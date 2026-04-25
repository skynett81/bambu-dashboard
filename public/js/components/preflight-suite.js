/**
 * Pre-print Analysis & Quality Suite — 4-tab panel:
 *   1. STL Analyzer  — drop a .stl, get bbox/overhang/orientation/integrity
 *   2. Test-Print Library — 12 standard models with metadata
 *   3. Pre-flight Checklist — verify printer ready before starting
 *   4. Quality Metrics — success rate, MTBF, cost, efficiency, trend
 */
(function () {
  'use strict';

  const _state = { tab: 'stl', stlReport: null, prints: [], metrics: null };
  function _esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
  function _toast(m, t = 'info') { if (typeof showToast === 'function') showToast(m, t, 3000); }

  function _load() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    body.innerHTML = `
      <div class="pf-tabs">
        <button class="form-btn pf-tab ${_state.tab === 'stl' ? 'active' : ''}" data-tab="stl">📐 STL Analyzer</button>
        <button class="form-btn pf-tab ${_state.tab === 'lib' ? 'active' : ''}" data-tab="lib">📚 Test Library</button>
        <button class="form-btn pf-tab ${_state.tab === 'check' ? 'active' : ''}" data-tab="check">✅ Pre-flight</button>
        <button class="form-btn pf-tab ${_state.tab === 'metrics' ? 'active' : ''}" data-tab="metrics">📈 Quality Metrics</button>
      </div>
      <div id="pf-content" class="pf-content"></div>
    `;
    body.querySelectorAll('.pf-tab').forEach(b => b.onclick = () => { _state.tab = b.dataset.tab; _load(); });
    if (_state.tab === 'stl') _renderStl();
    else if (_state.tab === 'lib') _renderLib();
    else if (_state.tab === 'check') _renderCheck();
    else _renderMetrics();
  }

  // ── Tab 1: STL Analyzer ──────────────────────────────────────────────

  function _renderStl() {
    const c = document.getElementById('pf-content');
    if (!c) return;
    c.innerHTML = `
      <div class="pf-stl-wrap">
        <div class="pf-drop" id="pf-stl-drop">
          <input type="file" id="pf-stl-file" accept=".stl" style="display:none">
          <strong>Drop .stl here</strong>
          <p class="text-muted" style="font-size:0.78rem">or <a href="#" id="pf-stl-pick" style="color:var(--accent-primary)">click to choose a file</a></p>
          <p class="text-muted" style="font-size:0.7rem">Up to 50 MB, ASCII or binary</p>
        </div>
        <div id="pf-stl-result" class="pf-stl-result"></div>
      </div>`;
    const drop = document.getElementById('pf-stl-drop');
    const input = document.getElementById('pf-stl-file');
    document.getElementById('pf-stl-pick').onclick = (e) => { e.preventDefault(); input.click(); };
    input.onchange = () => _stlAnalyze(input.files[0]);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('pf-drop-over'); };
    drop.ondragleave = () => drop.classList.remove('pf-drop-over');
    drop.ondrop = (e) => {
      e.preventDefault();
      drop.classList.remove('pf-drop-over');
      _stlAnalyze(e.dataTransfer.files[0]);
    };
  }

  async function _stlAnalyze(file) {
    if (!file) return;
    const out = document.getElementById('pf-stl-result');
    out.innerHTML = `<div class="text-muted">Analysing ${_esc(file.name)} (${(file.size / 1024 / 1024).toFixed(2)} MB)…</div>`;
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch('/api/preflight/stl/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'analysis failed');
      _state.stlReport = data;
      _renderStlReport(file.name);
    } catch (e) {
      out.innerHTML = `<div class="text-error">Analysis failed: ${_esc(e.message)}</div>`;
    }
  }

  function _renderStlReport(filename) {
    const out = document.getElementById('pf-stl-result');
    const r = _state.stlReport;
    if (!out || !r) return;
    const ohColors = { minimal: 'var(--accent-green)', moderate: 'var(--accent-blue)', heavy: 'var(--accent-orange)', extreme: 'var(--accent-red)' };
    out.innerHTML = `
      <div class="pf-stl-card">
        <h3>${_esc(filename)}</h3>
        <div class="pf-stl-grid">
          <div class="pf-stat"><div class="pf-stat-label">Triangles</div><div class="pf-stat-value">${r.triangleCount.toLocaleString()}</div></div>
          <div class="pf-stat"><div class="pf-stat-label">Volume</div><div class="pf-stat-value">${r.volumeCm3} cm³</div></div>
          <div class="pf-stat"><div class="pf-stat-label">Mass (PLA)</div><div class="pf-stat-value">${r.massGrams} g</div></div>
          <div class="pf-stat"><div class="pf-stat-label">Surface</div><div class="pf-stat-value">${(r.surfaceAreaMm2 / 100).toFixed(1)} cm²</div></div>
          <div class="pf-stat"><div class="pf-stat-label">Size (mm)</div><div class="pf-stat-value">${r.bbox.sizeMm.join(' × ')}</div></div>
          <div class="pf-stat"><div class="pf-stat-label">Format</div><div class="pf-stat-value">${r.format}</div></div>
        </div>
      </div>

      <div class="pf-stl-card">
        <h4>Overhangs</h4>
        <div class="pf-stl-bar">
          <div class="pf-stl-bar-fill" style="width:${(r.overhang.fraction * 100).toFixed(1)}%;background:${ohColors[r.overhang.label]}"></div>
        </div>
        <p>${(r.overhang.fraction * 100).toFixed(1)}% of surface area is below ${r.overhang.thresholdDeg}° from horizontal — <strong style="color:${ohColors[r.overhang.label]}">${r.overhang.label}</strong> support need</p>
      </div>

      <div class="pf-stl-card">
        <h4>Mesh integrity</h4>
        <p>${r.integrity.vertices} vertices · ${r.integrity.edges} edges · ${r.integrity.faces} faces · Euler = ${r.integrity.eulerNumber}</p>
        ${r.integrity.isManifold
          ? '<p style="color:var(--accent-green)"><strong>✓ Closed manifold</strong> — slicer-safe.</p>'
          : `<p style="color:var(--accent-orange)"><strong>⚠ Non-manifold</strong> — ${r.integrity.openEdges} open edges, ${r.integrity.nonManifoldEdges} bad edges. Repair before slicing.</p>`}
      </div>

      <div class="pf-stl-card">
        <h4>Better orientation candidates</h4>
        <table class="pf-table">
          <thead><tr><th>Orientation</th><th>Overhang area</th></tr></thead>
          <tbody>
            ${r.orientationSuggestions.slice(0, 5).map((o, i) => `
              <tr ${i === 0 ? 'style="background:var(--bg-tertiary)"' : ''}>
                <td>${i === 0 ? '⭐ ' : ''}${_esc(o.orientation)}</td>
                <td>${(o.overhangFraction * 100).toFixed(2)}%</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <p class="text-muted" style="font-size:0.72rem">Topp-orientation = ${r.orientationSuggestions[0].overhangFraction === r.overhang.fraction ? 'din nåværende' : 'bedre enn nåværende'}.</p>
      </div>

      <div class="pf-stl-card">
        <h4>Bridges</h4>
        <p>${r.bridges.candidates} bridge-candidate triangles, total ${r.bridges.areaMm2} mm². ${r.bridges.candidates > 5 ? '⚠ Bridge cooling settings will matter.' : '✓ Few bridges — should print cleanly.'}</p>
      </div>
    `;
  }

  // ── Tab 2: Test-Print Library ────────────────────────────────────────

  async function _renderLib() {
    const c = document.getElementById('pf-content');
    if (!c) return;
    c.innerHTML = '<div class="text-muted">Loading test prints…</div>';
    try {
      const data = await (await fetch('/api/preflight/test-prints')).json();
      _state.prints = data.prints || [];
      const tags = data.tags || [];
      c.innerHTML = `
        <div class="pf-lib-controls">
          <span class="text-muted" style="font-size:0.72rem;margin-right:8px">Filter:</span>
          <button class="form-btn form-btn-sm pf-tag-btn active" data-tag="">All</button>
          ${tags.map(t => `<button class="form-btn form-btn-sm pf-tag-btn" data-tag="${_esc(t)}">${_esc(t)}</button>`).join('')}
        </div>
        <div id="pf-lib-grid" class="pf-lib-grid"></div>`;
      c.querySelectorAll('.pf-tag-btn').forEach(b => b.onclick = () => _filterLib(b.dataset.tag, b));
      _filterLib('');
    } catch (e) {
      c.innerHTML = `<div class="text-error">Load failed: ${_esc(e.message)}</div>`;
    }
  }

  function _filterLib(tag, button) {
    const grid = document.getElementById('pf-lib-grid');
    if (!grid) return;
    const filtered = tag ? _state.prints.filter(p => p.tags.includes(tag)) : _state.prints;
    grid.innerHTML = filtered.map(p => `
      <div class="pf-lib-card">
        <div class="pf-lib-head">
          <strong>${_esc(p.name)}</strong>
          <span class="pf-lib-purpose">${_esc(p.purpose)}</span>
        </div>
        <p class="pf-lib-desc">${_esc(p.description)}</p>
        <div class="pf-lib-stats">
          <span>⏱ ${p.expected_minutes}min</span>
          <span>⚖ ${p.expected_grams}g</span>
          <span class="pf-lib-licence">${_esc(p.licence)}</span>
        </div>
        <div class="pf-lib-look">
          <strong style="font-size:0.7rem">Look for:</strong>
          <ul>${p.look_for.map(l => `<li>${_esc(l)}</li>`).join('')}</ul>
        </div>
        ${p.sourceUrl.startsWith('internal:')
          ? `<a class="form-btn form-btn-sm" href="#calibration" onclick="openPanel?.('calibration');return false">⚙ Open generator</a>`
          : `<a class="form-btn form-btn-sm" href="${_esc(p.sourceUrl)}" target="_blank" rel="noopener">📥 Source</a>`}
      </div>`).join('');
    if (button) {
      document.querySelectorAll('.pf-tag-btn').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
    }
  }

  // ── Tab 3: Pre-flight Checklist ──────────────────────────────────────

  async function _renderCheck() {
    const c = document.getElementById('pf-content');
    if (!c) return;
    const printers = await (await fetch('/api/printers')).json().catch(() => []);
    c.innerHTML = `
      <div class="pf-check-form">
        <h3>Pre-flight checklist</h3>
        <p class="text-muted" style="font-size:0.78rem">Verify the printer is ready before sending a print. Run this after uploading a file but before pressing start.</p>
        <div class="pf-check-grid">
          <label class="form-label">Printer
            <select class="form-input" id="pf-c-printer">
              ${printers.map(p => `<option value="${_esc(p.id)}">${_esc(p.name)}</option>`).join('')}
            </select>
          </label>
          <label class="form-label">Material
            <select class="form-input" id="pf-c-material">
              ${['PLA','PETG','ABS','ASA','TPU','PA-CF','PETG-CF','PC'].map(m => `<option>${m}</option>`).join('')}
            </select>
          </label>
          <label class="form-label">Hotend °C <input class="form-input" id="pf-c-hotend" type="number" value="215"></label>
          <label class="form-label">Bed °C <input class="form-input" id="pf-c-bed" type="number" value="60"></label>
          <label class="form-label">Estimated grams <input class="form-input" id="pf-c-grams" type="number" value="50"></label>
          <label class="form-label">Spool ID (optional) <input class="form-input" id="pf-c-spool" type="number"></label>
        </div>
        <button class="form-btn form-btn-success" id="pf-c-run">▶ Run checks</button>
        <div id="pf-c-output" class="pf-c-output"></div>
      </div>`;
    document.getElementById('pf-c-run').onclick = _runCheck;
  }

  async function _runCheck() {
    const intent = {
      printer_id: document.getElementById('pf-c-printer').value,
      material: document.getElementById('pf-c-material').value,
      hotend_temp: parseFloat(document.getElementById('pf-c-hotend').value),
      bed_temp: parseFloat(document.getElementById('pf-c-bed').value),
      estimated_grams: parseFloat(document.getElementById('pf-c-grams').value),
      spool_id: parseInt(document.getElementById('pf-c-spool').value, 10) || null,
      bbox: _state.stlReport?.bbox?.sizeMm,
    };
    try {
      const res = await fetch('/api/preflight/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intent),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'check failed');
      _renderCheckOutput(data);
    } catch (e) {
      _toast('Check failed: ' + e.message, 'error');
    }
  }

  function _renderCheckOutput(data) {
    const el = document.getElementById('pf-c-output');
    const colours = { fail: 'var(--accent-red)', warn: 'var(--accent-orange)', pass: 'var(--accent-green)', info: 'var(--text-muted)' };
    el.innerHTML = `
      <div class="pf-c-summary" style="border-left:4px solid ${colours[data.overall]}">
        <strong style="color:${colours[data.overall]}">Overall: ${data.overall.toUpperCase()}</strong>
        <span class="text-muted">${data.counts.pass || 0} pass · ${data.counts.warn || 0} warn · ${data.counts.fail || 0} fail · ${data.counts.info || 0} info</span>
      </div>
      ${data.checks.map(c => `
        <div class="pf-c-check pf-c-${c.severity}">
          <div class="pf-c-check-head">
            <span class="pf-c-sev pf-c-sev-${c.severity}">${c.severity.toUpperCase()}</span>
            <span class="pf-c-name">${_esc(c.check.replace(/^check/, '').replace(/([A-Z])/g, ' $1').trim())}</span>
          </div>
          <div class="pf-c-msg">${_esc(c.message)}</div>
          ${c.fix ? `<div class="pf-c-fix">💡 ${_esc(c.fix)}</div>` : ''}
        </div>`).join('')}
    `;
  }

  // ── Tab 4: Quality Metrics ───────────────────────────────────────────

  async function _renderMetrics() {
    const c = document.getElementById('pf-content');
    if (!c) return;
    c.innerHTML = '<div class="text-muted">Loading quality metrics…</div>';
    try {
      const data = await (await fetch('/api/preflight/quality-metrics?days=30')).json();
      _state.metrics = data;
      const m = data;
      c.innerHTML = `
        <div class="pf-met-row">
          <div class="pf-met-card">
            <div class="pf-met-label">Successful hours</div>
            <div class="pf-met-value">${m.mtbf.successful_hours} h</div>
          </div>
          <div class="pf-met-card">
            <div class="pf-met-label">MTBF</div>
            <div class="pf-met-value">${m.mtbf.mtbf_hours != null ? m.mtbf.mtbf_hours + ' h' : '—'}</div>
            <div class="pf-met-sub">${m.mtbf.failures} failures</div>
          </div>
          <div class="pf-met-card">
            <div class="pf-met-label">Total spent</div>
            <div class="pf-met-value">${m.cost.total_cost.toFixed(2)}</div>
            <div class="pf-met-sub">${m.cost.runs} runs · ${m.cost.cost_per_gram.toFixed(3)}/g</div>
          </div>
          <div class="pf-met-card">
            <div class="pf-met-label">Filament efficiency</div>
            <div class="pf-met-value">${m.efficiency.efficiency != null ? (m.efficiency.efficiency * 100).toFixed(1) + '%' : '—'}</div>
            <div class="pf-met-sub">${m.efficiency.samples || 0} samples</div>
          </div>
        </div>

        <div class="pf-met-card pf-met-card-wide">
          <h4>Success rate by printer / material</h4>
          ${m.success_by_material.length === 0
            ? '<p class="text-muted">Not enough history yet. Run a few prints and come back.</p>'
            : `<table class="pf-table">
                <thead><tr><th>Printer</th><th>Material</th><th>Completed</th><th>Failed</th><th>Success</th><th>Avg g</th></tr></thead>
                <tbody>${m.success_by_material.map(s => `
                  <tr>
                    <td>${_esc(s.printer_id)}</td>
                    <td>${_esc(s.material)}</td>
                    <td>${s.completed}</td>
                    <td>${s.failed}</td>
                    <td>${(s.success_rate * 100).toFixed(0)}%</td>
                    <td>${s.avg_grams ? s.avg_grams.toFixed(0) : '—'}</td>
                  </tr>`).join('')}</tbody>
              </table>`}
        </div>

        <div class="pf-met-card pf-met-card-wide">
          <h4>Weekly trend (last ${m.weekly_trend.length} weeks)</h4>
          ${m.weekly_trend.length === 0
            ? '<p class="text-muted">No data in this window.</p>'
            : `<table class="pf-table">
                <thead><tr><th>Week</th><th>Completed</th><th>Failed</th><th>Success rate</th></tr></thead>
                <tbody>${m.weekly_trend.map(w => `
                  <tr><td>${_esc(w.week)}</td><td>${w.completed}</td><td>${w.failed}</td><td>${(w.success_rate * 100).toFixed(0)}%</td></tr>
                `).join('')}</tbody>
              </table>`}
        </div>
      `;
    } catch (e) {
      c.innerHTML = `<div class="text-error">Load failed: ${_esc(e.message)}</div>`;
    }
  }

  window.loadPreflightSuite = _load;
})();
