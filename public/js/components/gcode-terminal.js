/**
 * G-code Terminal — visual console with command input and response history.
 * Works for all printer types via sendGcode() global function.
 */
(function() {
  'use strict';

  const MAX_LINES = 200;
  let _history = [];
  let _cmdHistory = [];
  let _cmdIndex = -1;

  window.renderGcodeTerminal = function() {
    return `<div class="ctrl-card" id="gcode-terminal-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        G-code Console
      </div>
      <div id="gcode-output" style="height:180px;overflow-y:auto;background:#0d1117;border-radius:6px;padding:6px 8px;font-family:monospace;font-size:0.7rem;color:#c9d1d9;white-space:pre-wrap;word-break:break-all;margin-bottom:6px;scroll-behavior:smooth"></div>
      <div style="display:flex;gap:4px">
        <input class="form-input" id="gcode-input" style="flex:1;font-family:monospace;font-size:0.78rem" placeholder="Enter G-code command..." onkeydown="if(event.key==='Enter')window._sendTerminalCmd(); if(event.key==='ArrowUp')window._termHistoryUp(); if(event.key==='ArrowDown')window._termHistoryDown();">
        <button class="form-btn form-btn-sm" data-ripple onclick="window._sendTerminalCmd()">Send</button>
      </div>
      <div style="display:flex;gap:3px;margin-top:4px;flex-wrap:wrap">
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="window._quickGcodeCmd('G28')">Home</button>
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="window._quickGcodeCmd('M105')">Temps</button>
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="window._quickGcodeCmd('M114')">Position</button>
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="window._quickGcodeCmd('M503')">Settings</button>
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="window._quickGcodeCmd('M115')">Firmware</button>
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;padding:2px 6px" data-ripple onclick="window._clearTerminal()">Clear</button>
      </div>
    </div>`;
  };

  window._sendTerminalCmd = function() {
    const input = document.getElementById('gcode-input');
    if (!input) return;
    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = '';
    _cmdHistory.unshift(cmd);
    if (_cmdHistory.length > 50) _cmdHistory.pop();
    _cmdIndex = -1;
    _appendLine(`> ${cmd}`, '#58a6ff');
    if (typeof sendGcode === 'function') sendGcode(cmd);
  };

  window._quickGcodeCmd = function(cmd) {
    _appendLine(`> ${cmd}`, '#58a6ff');
    if (typeof sendGcode === 'function') sendGcode(cmd);
  };

  window._termHistoryUp = function() {
    if (_cmdHistory.length === 0) return;
    _cmdIndex = Math.min(_cmdIndex + 1, _cmdHistory.length - 1);
    const input = document.getElementById('gcode-input');
    if (input) input.value = _cmdHistory[_cmdIndex] || '';
  };

  window._termHistoryDown = function() {
    _cmdIndex = Math.max(_cmdIndex - 1, -1);
    const input = document.getElementById('gcode-input');
    if (input) input.value = _cmdIndex >= 0 ? _cmdHistory[_cmdIndex] : '';
  };

  window._clearTerminal = function() {
    _history = [];
    const output = document.getElementById('gcode-output');
    if (output) output.innerHTML = '';
  };

  // Feed terminal log from WebSocket data
  window.updateGcodeTerminal = function(data) {
    if (data._terminalLog?.length) {
      for (const line of data._terminalLog) {
        if (!_history.includes(line)) _appendLine(line, '#8b949e');
      }
    }
  };

  function _appendLine(text, color) {
    _history.push(text);
    if (_history.length > MAX_LINES) _history.shift();
    const output = document.getElementById('gcode-output');
    if (!output) return;
    const line = document.createElement('div');
    line.style.color = color || '#c9d1d9';
    line.textContent = text;
    output.appendChild(line);
    // Auto-scroll
    output.scrollTop = output.scrollHeight;
    // Trim DOM
    while (output.children.length > MAX_LINES) output.removeChild(output.firstChild);
  }
})();
