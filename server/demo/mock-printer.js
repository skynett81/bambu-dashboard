import { MOCK_AMS_P2S, MOCK_AMS_X1C, MOCK_AMS_H2D } from './mock-data.js';

const PRINT_FILES = [
  { name: 'werewolf_bust.3mf', projectId: '1005938' },
  { name: 'cable_clip_x4.3mf', projectId: null },
  { name: 'deadpool_grenade.3mf', projectId: '736412' },
  { name: 'rv_15amp_inlet_mount.3mf', projectId: '28926' },
  { name: 'benchy_v2.3mf', projectId: null },
  { name: 'vase_mode.3mf', projectId: null }
];

const PHASES = {
  IDLE: { duration: 30000, next: 'HEATING' },
  HEATING: { duration: 20000, next: 'PRINTING' },
  PRINTING: { duration: 300000, next: 'COOLING' },
  COOLING: { duration: 15000, next: 'IDLE' }
};

export class MockPrinter {
  constructor(id = 'default', amsData = null) {
    this.id = id;
    this.amsData = amsData ? structuredClone(amsData) : structuredClone(MOCK_AMS_P2S);
    this.state = this._idleState();
    this.phase = 'IDLE';
    this.phaseStart = Date.now();
    this.paused = false;
    this.pausedAt = 0;
    this.currentFile = PRINT_FILES[0].name;
    this.currentProjectId = PRINT_FILES[0].projectId || '0';
    this.fileIndex = 0;
    this.totalLayers = 200;
    this.onUpdate = null;
    this.onXcamEvent = null;
    this.interval = null;
    this.seqId = 0;
    this._tickCount = 0;
    this._baseWifiSignal = -35 - Math.floor(Math.random() * 20); // -35 to -55
  }

  start() {
    console.log(`[demo] Mock-printer startet: ${this.id}`);
    this.interval = setInterval(() => this._tick(), 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  handleCommand(msg) {
    switch (msg.action) {
      case 'pause':
        if (this.phase === 'PRINTING' && !this.paused) {
          this.paused = true;
          this.pausedAt = Date.now();
          this.state.gcode_state = 'PAUSE';
        }
        break;
      case 'resume':
        if (this.paused) {
          const pauseDuration = Date.now() - this.pausedAt;
          this.phaseStart += pauseDuration;
          this.paused = false;
          this.state.gcode_state = 'RUNNING';
        }
        break;
      case 'stop':
        if (this.phase === 'PRINTING' || this.phase === 'HEATING') {
          this.state.gcode_state = 'IDLE';
          this._emit(); // Emit before reset so PrintTracker records the cancelled print
        }
        this._transitionTo('IDLE');
        break;
      case 'speed':
        this.state.spd_lvl = parseInt(msg.value) || 2;
        break;
      case 'light':
        this.state.lights_report = [{
          node: 'chamber_light',
          mode: msg.mode || 'on'
        }];
        break;
    }
  }

  getState() {
    return { print: { ...this.state, ams: structuredClone(this.amsData), command: 'push_status' } };
  }

  _tick() {
    this._tickCount++;

    if (this.paused) {
      this._emit();
      return;
    }

    const elapsed = Date.now() - this.phaseStart;
    const duration = PHASES[this.phase].duration;
    const progress = Math.min(elapsed / duration, 1);

    // Update WiFi signal with slight variation
    this.state.wifi_signal = `${this._baseWifiSignal + Math.floor(this._fluctuate(3))}dBm`;

    switch (this.phase) {
      case 'IDLE':
        this._updateIdle();
        break;
      case 'HEATING':
        this._updateHeating(progress);
        break;
      case 'PRINTING':
        this._updatePrinting(progress);
        break;
      case 'COOLING':
        this._updateCooling(progress);
        break;
    }

    if (progress >= 1) {
      this._transitionTo(PHASES[this.phase].next);
    }

    this._emit();
  }

  _transitionTo(phase) {
    this.phase = phase;
    this.phaseStart = Date.now();

    if (phase === 'IDLE') {
      this.state = this._idleState();
      this.fileIndex = (this.fileIndex + 1) % PRINT_FILES.length;
      this.currentFile = PRINT_FILES[this.fileIndex].name;
      this.currentProjectId = PRINT_FILES[this.fileIndex].projectId || '0';
      this.totalLayers = 100 + Math.floor(Math.random() * 250);
    } else if (phase === 'HEATING') {
      this.state.gcode_state = 'PREPARE';
      this.state.subtask_name = this.currentFile;
      this.state.gcode_file = `/sdcard/${this.currentFile.replace('.3mf', '.gcode')}`;
      this.state.project_id = this.currentProjectId;
    } else if (phase === 'PRINTING') {
      this.state.gcode_state = 'RUNNING';
      this.state.total_layer_num = this.totalLayers;
    } else if (phase === 'COOLING') {
      this.state.gcode_state = 'FINISH';
      this.state.mc_percent = 100;
      this.state.layer_num = this.totalLayers;
    }
  }

  _updateIdle() {
    this.state.nozzle_temper = 24 + this._fluctuate(0.5);
    this.state.bed_temper = 23 + this._fluctuate(0.3);
    this.state.chamber_temper = 22 + this._fluctuate(0.2);
    this.state.nozzle_target_temper = 0;
    this.state.bed_target_temper = 0;
  }

  _updateHeating(progress) {
    const nozzleTarget = 220;
    const bedTarget = 60;
    this.state.nozzle_target_temper = nozzleTarget;
    this.state.bed_target_temper = bedTarget;

    // First 30% of HEATING phase = uploading file to printer
    if (progress < 0.3) {
      const uploadProgress = Math.min(Math.floor((progress / 0.3) * 100), 100);
      this.state.upload = { status: 'uploading', progress: uploadProgress, message: '' };
      // Temperatures barely start rising during upload
      this.state.nozzle_temper = 24 + 10 * (progress / 0.3) + this._fluctuate(0.5);
      this.state.bed_temper = 23 + 5 * (progress / 0.3) + this._fluctuate(0.3);
      this.state.chamber_temper = 22 + this._fluctuate(0.2);
    } else {
      // Upload done, now heating
      this.state.upload = { status: 'idle', progress: 100, message: '' };
      const heatProgress = (progress - 0.3) / 0.7; // 0..1 within heating sub-phase
      this.state.bed_temper = 28 + (bedTarget - 28) * Math.min(heatProgress * 1.3, 1) + this._fluctuate(0.3);
      this.state.nozzle_temper = 34 + (nozzleTarget - 34) * heatProgress + this._fluctuate(0.5);
      this.state.chamber_temper = 22 + 8 * heatProgress + this._fluctuate(0.2);
    }

    // H2D dual-nozzle
    if (this.state.nozzle_temper_2 !== undefined) {
      this.state.nozzle_target_temper_2 = nozzleTarget;
      this.state.nozzle_temper_2 = 24 + (nozzleTarget - 24) * progress * 0.95 + this._fluctuate(0.5);
    }
  }

  _updatePrinting(progress) {
    this.state.mc_percent = Math.floor(progress * 100);
    this.state.layer_num = Math.floor(progress * this.totalLayers);
    this.state.mc_remaining_time = Math.floor((1 - progress) * 45);

    this.state.nozzle_temper = 220 + this._fluctuate(0.8);
    this.state.bed_temper = 60 + this._fluctuate(0.3);
    this.state.chamber_temper = 30 + 5 * Math.min(progress * 2, 1) + this._fluctuate(0.3);

    this.state.cooling_fan_speed = '180';
    this.state.big_fan1_speed = '120';
    this.state.big_fan2_speed = '100';
    this.state.heatbreak_fan_speed = '200';

    // H2D dual-nozzle
    if (this.state.nozzle_temper_2 !== undefined) {
      this.state.nozzle_temper_2 = 220 + this._fluctuate(0.8);
    }

    // Cycle AMS tray during print
    if (progress > 0.3 && progress < 0.7) {
      this.amsData.tray_now = '1';
    } else {
      this.amsData.tray_now = '0';
    }

    // Simulate filament consumption
    const activeTray = this.amsData.ams[0].tray.find(t => t && t.id === this.amsData.tray_now);
    if (activeTray && activeTray.remain > 5) {
      activeTray.remain = Math.max(5, activeTray.remain - 0.01);
    }

    // Occasional XCam events (~1% chance per tick during mid-print)
    if (this.onXcamEvent && progress > 0.1 && progress < 0.9 && Math.random() < 0.01) {
      const events = ['spaghetti', 'first_layer_inspection'];
      this.onXcamEvent(events[Math.floor(Math.random() * events.length)]);
    }

    // Occasional HMS event (~0.3% chance per tick)
    if (progress > 0.2 && progress < 0.8 && Math.random() < 0.003) {
      this.state.hms = [{ attr: '0300_0100_0001_0001', code: 0x03000100, msg: 'AMS filament has run out' }];
    } else {
      delete this.state.hms;
    }
  }

  _updateCooling(progress) {
    this.state.nozzle_temper = 220 - 196 * progress + this._fluctuate(0.5);
    this.state.bed_temper = 60 - 37 * progress + this._fluctuate(0.3);
    this.state.chamber_temper = 35 - 13 * progress + this._fluctuate(0.2);
    this.state.nozzle_target_temper = 0;
    this.state.bed_target_temper = 0;
    this.state.cooling_fan_speed = '255';
    this.state.big_fan1_speed = '255';
    this.state.big_fan2_speed = '200';
  }

  _idleState() {
    const base = {
      gcode_state: 'IDLE',
      mc_percent: 0,
      mc_remaining_time: 0,
      layer_num: 0,
      total_layer_num: 0,
      subtask_name: '',
      gcode_file: '',
      project_id: '0',
      nozzle_temper: 24,
      nozzle_target_temper: 0,
      bed_temper: 23,
      bed_target_temper: 0,
      chamber_temper: 22,
      heatbreak_fan_speed: '0',
      cooling_fan_speed: '0',
      big_fan1_speed: '0',
      big_fan2_speed: '0',
      spd_lvl: 2,
      spd_mag: 100,
      print_error: 0,
      wifi_signal: '-42dBm',
      sdcard: true,
      lights_report: [{ node: 'chamber_light', mode: 'on' }],
      ipcam: { ipcam_record: 'enable', timelapse: 'disable', resolution: '1080p' },
      xcam: { first_layer_inspector: true, spaghetti_detector: true },
      upload: { status: 'idle', progress: 0, message: '' },
      lifecycle: 'product',
      hw_switch_state: 1,
      nozzle_type: 'stainless_steel',
      nozzle_diameter: '0.4',
      _info: {
        module: [
          { name: 'ota', sw_ver: '01.09.01.00', hw_ver: 'AP04', sn: this.id + '-ota' },
          { name: 'mc', sw_ver: '09.01.30.00', hw_ver: '', sn: this.id + '-mc' }
        ]
      }
    };

    // H2D dual-nozzle
    if (this.id.includes('h2d')) {
      base.nozzle_temper_2 = 24;
      base.nozzle_target_temper_2 = 0;
    }

    return base;
  }

  _fluctuate(range) {
    return (Math.random() - 0.5) * 2 * range;
  }

  _emit() {
    if (this.onUpdate) {
      this.onUpdate(this.getState());
    }
  }
}
