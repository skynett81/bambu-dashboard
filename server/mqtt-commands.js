let seqId = 100;

function nextSeq() {
  return String(seqId++);
}

export function buildPauseCommand() {
  return { print: { sequence_id: nextSeq(), command: 'pause' } };
}

export function buildResumeCommand() {
  return { print: { sequence_id: nextSeq(), command: 'resume' } };
}

export function buildStopCommand() {
  return { print: { sequence_id: nextSeq(), command: 'stop' } };
}

export function buildSpeedCommand(level) {
  return { print: { sequence_id: nextSeq(), command: 'print_speed', param: String(level) } };
}

export function buildLightCommand(node, mode) {
  return {
    system: {
      sequence_id: nextSeq(),
      command: 'ledctrl',
      led_node: node,
      led_mode: mode,
      led_on_time: 500,
      led_off_time: 500,
      loop_times: 0,
      interval_time: 0
    }
  };
}

export function buildGcodeCommand(gcode) {
  return { print: { sequence_id: nextSeq(), command: 'gcode_line', param: gcode } };
}

export function buildCommandFromClientMessage(msg) {
  switch (msg.action) {
    case 'pause': return buildPauseCommand();
    case 'resume': return buildResumeCommand();
    case 'stop': return buildStopCommand();
    case 'speed': return buildSpeedCommand(msg.value);
    case 'light': return buildLightCommand(msg.node || 'chamber_light', msg.mode || 'on');
    case 'gcode': return buildGcodeCommand(msg.gcode);
    default: return null;
  }
}
