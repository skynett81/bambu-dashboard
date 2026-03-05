import { getQueues, getQueue, getNextPendingItem, updateQueueItem, updateQueue, addQueueLog, getActiveQueueItems, getSpoolBySlot, getEntityTags, getInventorySetting } from './database.js';
import { buildPrintCommand, buildGcodeCommand } from './mqtt-commands.js';

export class QueueManager {
  constructor(printerManager, notifier, broadcastFn, failureDetector) {
    this._pm = printerManager;
    this._notifier = notifier;
    this._broadcast = broadcastFn;
    this._failureDetector = failureDetector || null;
    this._activeJobs = new Map(); // printerId -> { queueId, itemId }
    this._cooldownTimers = new Map(); // printerId -> timeout
    this._dispatchInterval = null;
  }

  init() {
    // Resume any jobs that were printing when server restarted
    const activeItems = getActiveQueueItems();
    for (const item of activeItems) {
      if (item.printer_id && item.status === 'printing') {
        this._activeJobs.set(item.printer_id, { queueId: item.queue_id, itemId: item.id });
      }
    }

    // Check dispatch every 10 seconds
    this._dispatchInterval = setInterval(() => this._checkDispatch(), 10000);
    // Initial check after 5 seconds
    setTimeout(() => this._checkDispatch(), 5000);

    console.log(`[queue] Initialized (${activeItems.length} active jobs resumed)`);
  }

  shutdown() {
    if (this._dispatchInterval) clearInterval(this._dispatchInterval);
    for (const timer of this._cooldownTimers.values()) clearTimeout(timer);
    this._cooldownTimers.clear();
  }

  // Called by PrintTracker when a print ends
  onPrintComplete(printerId, status, printHistoryId) {
    const job = this._activeJobs.get(printerId);
    if (!job) return;

    this._activeJobs.delete(printerId);
    const queue = getQueue(job.queueId);
    if (!queue) return;

    const item = queue.items?.find(i => i.id === job.itemId);
    if (!item) return;

    if (status === 'completed') {
      const newCompleted = (item.copies_completed || 0) + 1;
      if (newCompleted >= (item.copies || 1)) {
        updateQueueItem(item.id, { status: 'completed', copies_completed: newCompleted, completed_at: new Date().toISOString(), print_history_id: printHistoryId || null });
        addQueueLog(job.queueId, item.id, printerId, 'item_completed', `Copy ${newCompleted}/${item.copies}`);
        this._broadcast('queue_update', { action: 'item_completed', queueId: job.queueId, itemId: item.id, printerId });
        this._notifyEvent('queue_item_completed', { printerId, filename: item.filename, queueName: queue.name });
      } else {
        // More copies needed — keep as pending
        updateQueueItem(item.id, { status: 'pending', copies_completed: newCompleted, print_history_id: printHistoryId || null });
        addQueueLog(job.queueId, item.id, printerId, 'copy_completed', `Copy ${newCompleted}/${item.copies}`);
        this._broadcast('queue_update', { action: 'copy_completed', queueId: job.queueId, itemId: item.id, printerId });
      }
    } else {
      updateQueueItem(item.id, { status: 'failed', completed_at: new Date().toISOString(), print_history_id: printHistoryId || null });
      addQueueLog(job.queueId, item.id, printerId, 'item_failed', status);
      this._broadcast('queue_update', { action: 'item_failed', queueId: job.queueId, itemId: item.id, printerId });
      this._notifyEvent('queue_item_failed', { printerId, filename: item.filename, queueName: queue.name, error: status });
    }

    // Check if queue is fully completed
    this._checkQueueCompletion(job.queueId);

    // Auto-start next if enabled
    if (queue.auto_start && queue.status === 'active') {
      const cooldown = (queue.cooldown_seconds || 60) * 1000;
      this._cooldownTimers.set(printerId, setTimeout(() => {
        this._cooldownTimers.delete(printerId);
        // Send bed clear gcode if configured
        if (queue.bed_clear_gcode) {
          this._sendGcode(printerId, queue.bed_clear_gcode);
          setTimeout(() => this._checkDispatch(), 5000);
        } else {
          this._checkDispatch();
        }
      }, cooldown));
    }
  }

  _checkDispatch() {
    const queues = getQueues('active');
    for (const q of queues) {
      const queue = getQueue(q.id);
      if (!queue || queue.status !== 'active') continue;

      const nextItem = getNextPendingItem(queue.id, queue.priority_mode);
      if (!nextItem) continue;

      const printerId = this._findAvailablePrinter(queue, nextItem);
      if (!printerId) continue;

      this._dispatchItem(queue, nextItem, printerId);
    }
  }

  _findAvailablePrinter(queue, item) {
    const printers = this._pm.printers;
    const candidates = [];

    for (const [id, entry] of printers) {
      if (!entry.live || !entry.client) continue;
      // Skip printers already in active queue jobs or cooldown
      if (this._activeJobs.has(id)) continue;
      if (this._cooldownTimers.has(id)) continue;
      // If queue targets a specific printer, only use that one
      if (queue.target_printer_id && queue.target_printer_id !== id) continue;
      // If item targets a specific printer
      if (item.printer_id && item.printer_id !== id) continue;

      // Check printer state — must be IDLE or FINISH
      const tracker = entry.tracker;
      const prevState = tracker?.previousState?.gcode_state;
      if (prevState !== 'IDLE' && prevState !== 'FINISH') continue;

      // Nozzle compatibility check
      if (item.required_nozzle_mm) {
        const nozzleDia = tracker?.previousState?.nozzle_diameter;
        if (nozzleDia && Math.abs(nozzleDia - item.required_nozzle_mm) > 0.01) continue;
      }

      // Material compatibility check — match required_material against AMS tray types
      if (item.required_material) {
        const ams = tracker?.previousState?.ams?.ams;
        let hasMaterial = false;
        if (Array.isArray(ams)) {
          for (const unit of ams) {
            if (Array.isArray(unit?.tray)) {
              for (const tray of unit.tray) {
                if (tray?.tray_type && tray.tray_type.toLowerCase() === item.required_material.toLowerCase()) {
                  hasMaterial = true; break;
                }
              }
            }
            if (hasMaterial) break;
          }
        }
        if (!hasMaterial) continue;
      }

      // Target printers filter — only dispatch to specified printers
      if (item.target_printers) {
        try {
          const targets = typeof item.target_printers === 'string' ? JSON.parse(item.target_printers) : item.target_printers;
          if (Array.isArray(targets) && targets.length > 0 && !targets.includes(id)) continue;
        } catch (_) {}
      }

      // Tag-based matching — printer must have ALL required tags
      if (item.required_tags) {
        try {
          const requiredTags = typeof item.required_tags === 'string' ? JSON.parse(item.required_tags) : item.required_tags;
          if (Array.isArray(requiredTags) && requiredTags.length > 0) {
            const printerTags = getEntityTags('printer', id).map(t => t.id);
            if (!requiredTags.every(tagId => printerTags.includes(tagId))) continue;
          }
        } catch (_) {}
      }

      candidates.push(id);
    }

    if (candidates.length <= 1) return candidates[0] || null;

    // Load balancing — pick the printer with fewest active+pending jobs across all queues
    const jobCounts = new Map();
    for (const cid of candidates) jobCounts.set(cid, 0);
    // Count active jobs
    for (const [pid] of this._activeJobs) {
      if (jobCounts.has(pid)) jobCounts.set(pid, jobCounts.get(pid) + 1);
    }
    // Count pending items assigned to specific printers
    try {
      const allQueues = getQueues('active');
      for (const q of allQueues) {
        const fullQ = getQueue(q.id);
        if (!fullQ?.items) continue;
        for (const it of fullQ.items) {
          if (it.status === 'pending' && it.printer_id && jobCounts.has(it.printer_id)) {
            jobCounts.set(it.printer_id, jobCounts.get(it.printer_id) + 1);
          }
        }
      }
    } catch (_) {}

    // Select printer with lowest job count
    let bestId = candidates[0], bestCount = Infinity;
    for (const [pid, count] of jobCounts) {
      if (count < bestCount) { bestCount = count; bestId = pid; }
    }
    return bestId;
  }

  async _dispatchItem(queue, item, printerId) {
    // Bed check before dispatch (if enabled)
    if (this._failureDetector && getInventorySetting('bed_check_enabled') === '1') {
      const printer = this._pm.printers.get(printerId);
      if (printer?.config?.ip && printer?.config?.access_code) {
        try {
          const result = await this._failureDetector.checkBedClear(printerId, printer.config.ip, printer.config.access_code);
          if (!result.clear) {
            addQueueLog(queue.id, item.id, printerId, 'bed_not_clear', `Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
            this._broadcast('queue_update', { action: 'bed_not_clear', queueId: queue.id, printerId });
            console.log(`[queue] Bed not clear for ${printerId}, skipping dispatch`);
            return;
          }
        } catch (e) { console.warn(`[queue] Bed check failed for ${printerId}:`, e.message); }
      }
    }

    // Pre-print filament check — warn or block if spool has insufficient filament
    if (item.estimated_filament_g && item.estimated_filament_g > 0) {
      const filamentCheckMode = getInventorySetting('filament_check_mode') || 'warn';
      const printer = this._pm.printers.get(printerId);
      const ams = printer?.tracker?.previousState?.ams?.ams;
      let insufficientFilament = false;
      if (Array.isArray(ams)) {
        for (const unit of ams) {
          if (!Array.isArray(unit?.tray)) continue;
          for (const tray of unit.tray) {
            if (!tray?.tray_sub_brands) continue;
            const spool = getSpoolBySlot(printerId, unit.id ?? 0, tray.id ?? 0);
            if (spool && spool.remaining_weight_g < item.estimated_filament_g) {
              const msg = `Low filament: ${spool.profile_name || 'spool'} has ${Math.round(spool.remaining_weight_g)}g, job needs ~${Math.round(item.estimated_filament_g)}g`;
              addQueueLog(queue.id, item.id, printerId, 'filament_warning', msg);
              this._notifyEvent('queue_filament_warning', { printerId, filename: item.filename, message: msg });
              console.log(`[queue] ${msg}`);
              insufficientFilament = true;
            }
          }
        }
      }
      if (insufficientFilament && filamentCheckMode === 'block') {
        addQueueLog(queue.id, item.id, printerId, 'filament_blocked', 'Dispatch blocked: insufficient filament');
        this._broadcast('queue_update', { action: 'filament_blocked', queueId: queue.id, itemId: item.id, printerId });
        console.log(`[queue] Dispatch blocked for "${item.filename}" — insufficient filament`);
        return;
      }
    }

    // Update item status
    updateQueueItem(item.id, { status: 'printing', printer_id: printerId, started_at: new Date().toISOString() });
    this._activeJobs.set(printerId, { queueId: queue.id, itemId: item.id });
    addQueueLog(queue.id, item.id, printerId, 'item_started', null);

    // Send print command via MQTT
    const cmd = buildPrintCommand(item.filename);
    const printer = this._pm.printers.get(printerId);
    if (printer?.client) {
      printer.client.sendCommand(cmd);
    }

    this._broadcast('queue_update', { action: 'item_started', queueId: queue.id, itemId: item.id, printerId });
    this._notifyEvent('queue_item_started', { printerId, filename: item.filename, queueName: queue.name });

    console.log(`[queue] Dispatched "${item.filename}" to ${printerId} (queue: ${queue.name})`);
  }

  _sendGcode(printerId, gcode) {
    const printer = this._pm.printers.get(printerId);
    if (!printer?.client) return;
    for (const line of gcode.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith(';')) {
        printer.client.sendCommand(buildGcodeCommand(trimmed));
      }
    }
  }

  _checkQueueCompletion(queueId) {
    const queue = getQueue(queueId);
    if (!queue || queue.status !== 'active') return;
    const pending = queue.items.filter(i => i.status === 'pending' || i.status === 'printing' || i.status === 'assigned');
    if (pending.length === 0) {
      updateQueue(queueId, { status: 'completed', completed_at: new Date().toISOString() });
      addQueueLog(queueId, null, null, 'queue_completed', null);
      this._broadcast('queue_update', { action: 'queue_completed', queueId });
      this._notifyEvent('queue_completed', { queueName: queue.name });
    }
  }

  _notifyEvent(eventType, data) {
    if (this._notifier) {
      const printerName = data.printerId ? this._getPrinterName(data.printerId) : null;
      this._notifier.notify(eventType, { ...data, printerName });
    }
  }

  _getPrinterName(printerId) {
    const entry = this._pm.printers.get(printerId);
    return entry?.config?.name || printerId;
  }

  // Force an immediate dispatch check
  forceDispatch() {
    this._checkDispatch();
  }

  // Get active job for a printer (used by print-tracker integration)
  getActiveJob(printerId) {
    return this._activeJobs.get(printerId) || null;
  }
}
