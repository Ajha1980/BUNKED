'use strict';

const STORAGE_KEY = 'bunked.v3.subjects';
const THEME_KEY = 'bunked.v3.theme';
const SOUND_KEY = 'bunked.v3.sounddeck';
const $ = (id) => document.getElementById(id);
let subjects = [];
let activeId = null;
let current = null;
let toastTimer = null;
let saveTimer = null;
let isSaving = false;
let soundEnabled = true;
let soundSettings = { master: true, click: true, typing: true, volume: 88 };
let audioContext = null;
let mousePackBuffer = null;
let mousePackPromise = null;
let keyboardPackBuffer = null;
let keyboardPackPromise = null;
let lastKeySoundAt = 0;

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return 's-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}
function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2300);
}
function playTone(context, frequency, endFrequency, volume, duration, wave = 'triangle') {
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.00011, volume), start + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.005);
}
function playNoise(context, volume, duration, highpass = 900) {
  const length = Math.max(8, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const fade = Math.pow(1 - i / length, 2.2);
    data[i] = (Math.random() * 2 - 1) * fade;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(Math.max(0.0001, volume), context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start();
  source.stop(context.currentTime + duration + 0.005);
}
function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}
const KEYBOARD_SAMPLES = Object.freeze({
  space: { offset: 0.000000, duration: 0.410000 },
  digit1: { offset: 0.470000, duration: 0.276625 },
  digit2: { offset: 0.806625, duration: 0.257708 },
  digit3: { offset: 1.124333, duration: 0.230000 },
  digit4: { offset: 1.414333, duration: 0.230000 },
  digit5: { offset: 1.704333, duration: 0.238792 },
  digit6: { offset: 2.003125, duration: 0.220000 },
  digit7: { offset: 2.283125, duration: 0.326917 },
  digit8: { offset: 2.670042, duration: 0.296292 },
  backspace: { offset: 3.026333, duration: 0.357042 },
  enter: { offset: 3.443375, duration: 0.260000 },
  shift: { offset: 3.763375, duration: 0.319667 }
});
const KEYBOARD_CODE_MAP = (() => {
  const map = {
    Space: 'space', Backspace: 'backspace', Delete: 'backspace',
    Enter: 'enter', NumpadEnter: 'enter',
    ShiftLeft: 'shift', ShiftRight: 'shift',
    Digit1: 'digit1', Digit2: 'digit2', Digit3: 'digit3',
    Digit4: 'digit4', Digit5: 'digit5', Digit6: 'digit6',
    Digit7: 'digit7', Digit8: 'digit8',
    Digit9: 'digit5', Digit0: 'digit5'
  };
  // The supplied Mechvibes config maps every letter to backspace. Keep that mapping.
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => { map['Key' + letter] = 'backspace'; });
  // The uploaded config assigns punctuation and other modifiers to Digit5's sample.
  ['Comma','Period','Slash','Semicolon','Quote','BracketLeft','BracketRight','Minus','Equal',
   'ControlRight','ControlLeft','ContextMenu','MetaRight','MetaLeft','AltRight','AltLeft',
   'CapsLock','Tab','Backquote','Backslash'].forEach((code) => { map[code] = 'digit5'; });
  return Object.freeze(map);
})();
function keyboardSampleForCode(code) {
  return KEYBOARD_CODE_MAP[code] || null;
}
function preloadKeyboardPack() {
  if (!keyboardPackPromise) {
    const parts = Array.from({ length: 9 }, (_, index) =>
      '/static/audio/keyboard-sprite.part' + String(index + 1).padStart(2, '0') + '.txt'
    );
    keyboardPackPromise = Promise.all(parts.map((path) =>
      fetch(path, { cache: 'force-cache' }).then((response) => {
        if (!response.ok) throw new Error('Keyboard sound pack segment could not be loaded: ' + path);
        return response.text();
      })
    )).then((chunks) => {
      const binary = atob(chunks.join(''));
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return getAudioContext().decodeAudioData(bytes.buffer);
    }).then((buffer) => {
      keyboardPackBuffer = buffer;
      return buffer;
    }).catch((error) => {
      keyboardPackPromise = null;
      console.warn('BUNKED keyboard sound pack:', error);
      return null;
    });
  }
  return keyboardPackPromise;
}
function playKeyboardPackSample(context, level, keyCode) {
  if (!keyboardPackBuffer) return false;
  const sampleName = keyboardSampleForCode(keyCode);
  const sample = sampleName ? KEYBOARD_SAMPLES[sampleName] : null;
  if (!sample) return false;
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = keyboardPackBuffer;
  gain.gain.setValueAtTime(Math.min(1.7, level * 1.45), context.currentTime);
  source.connect(gain);
  gain.connect(context.destination);
  source.start(context.currentTime, sample.offset, sample.duration);
  return true;
}
function keyCodeFromInputEvent(event) {
  if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') return 'Backspace';
  if (event.data === ' ') return 'Space';
  if (event.data && /^[0-9]$/.test(event.data)) return 'Digit' + event.data;
  if (event.data && /^[a-z]$/i.test(event.data)) return 'Key' + event.data.toUpperCase();
  return 'Period';
}
function playMousePackSample(context, level, button = 'left') {
  if (!mousePackBuffer) return false;
  const samples = {
    left:  { offset: 0,        duration: 0.249979 },
    right: { offset: 0.249979, duration: 0.239979 },
    side:  { offset: 0.489958, duration: 0.129979 }
  };
  const sample = samples[button] || samples.left;
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = mousePackBuffer;
  gain.gain.setValueAtTime(Math.min(2.0, level * 1.65), context.currentTime);
  source.connect(gain);
  gain.connect(context.destination);
  source.start(context.currentTime, sample.offset, sample.duration);
  return true;
}
function preloadMousePack() {
  if (!mousePackPromise) {
    mousePackPromise = fetch('/static/audio/asmr-mouse.ogg', { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('Mouse sound pack could not be loaded.');
        return response.arrayBuffer();
      })
      .then((bytes) => getAudioContext().decodeAudioData(bytes))
      .then((buffer) => {
        mousePackBuffer = buffer;
        return buffer;
      })
      .catch((error) => {
        mousePackPromise = null;
        console.warn('BUNKED mouse sound pack:', error);
        return null;
      });
  }
  return mousePackPromise;
}
function playUiSound(kind = 'click', preview = false, mouseButton = 'left', keyCode = 'KeyA') {
  if (document.hidden || !soundSettings.master) return;
  if (kind === 'click' && !soundSettings.click) return;
  if (kind === 'type' && !soundSettings.typing) return;
  const context = getAudioContext();
  if (!context) return;
  const level = Math.max(0, Math.min(1, soundSettings.volume / 100));
  if (level <= 0) return;
  try {
    if (kind === 'type') {
      if (!playKeyboardPackSample(context, level, keyCode)) {
        preloadKeyboardPack();
        // Temporary synthetic keycap while the uploaded sample sprite is loading.
        playTone(context, 148, 72, 0.052 * level, 0.046, 'triangle');
        playTone(context, 2180, 940, 0.023 * level, 0.014, 'square');
        playNoise(context, 0.016 * level, 0.018, 1250);
      }
    } else if (!playMousePackSample(context, level, mouseButton)) {
      preloadMousePack();
      playNoise(context, 0.052 * level, 0.018, 1550);
      playTone(context, 1720, 720, 0.045 * level, 0.021, 'square');
      playTone(context, 520, 205, 0.021 * level, 0.024, 'triangle');
    }
  } catch (error) {
    console.debug('BUNKED sound unavailable:', error);
  }
}

function persistSoundSettings() {
  try { localStorage.setItem(SOUND_KEY, JSON.stringify(soundSettings)); } catch (_) {}
}
function updateSoundDeck() {
  soundEnabled = soundSettings.master;
  $('masterToggle').checked = soundSettings.master;
  $('clickToggle').checked = soundSettings.click;
  $('typingToggle').checked = soundSettings.typing;
  $('soundVolume').value = soundSettings.volume;
  $('soundVolumeValue').textContent = soundSettings.volume + '%';
  $('soundState').textContent = soundSettings.master ? 'LIVE / ' + soundSettings.volume + '%' : 'MUTED';
  $('soundBtn').classList.toggle('is-live', soundSettings.master);
  $('soundBtn').setAttribute('aria-expanded', String(!$('soundDeck').hidden));
  $('soundBtn').setAttribute('aria-label', $('soundDeck').hidden ? 'Open sound deck' : 'Close sound deck');
  $('soundDeck').hidden = !$('soundBtn').getAttribute('aria-expanded') || $('soundBtn').getAttribute('aria-expanded') !== 'true';
  document.querySelectorAll('.sound-meter i').forEach((bar, index) => {
    bar.style.setProperty('--bar-level', soundSettings.master && soundSettings.volume > 0 ? String(0.4 + ((index * 7) % 5) / 8) : '0.12');
  });
}
function setSoundDeckOpen(open) {
  $('soundDeck').hidden = !open;
  $('soundBtn').setAttribute('aria-expanded', String(open));
  $('soundBtn').setAttribute('aria-label', open ? 'Close sound deck' : 'Open sound deck');
  $('soundBtn').classList.toggle('panel-open', open);
}
function loadSoundSettings() {
  try {
    const stored = localStorage.getItem(SOUND_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      soundSettings = {
        master: parsed.master !== false,
        click: parsed.click !== false,
        typing: parsed.typing !== false,
        volume: Math.max(0, Math.min(100, Number(parsed.volume ?? 88)))
      };
    } else {
      // Migrate the previous simple on/off preference.
      soundSettings.master = localStorage.getItem('bunked.v3.sound') !== 'off';
    }
  } catch (_) {}
  updateSoundDeck();
}

function saveAll() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    return true;
  } catch (error) {
    toast('Could not save in this browser. Check storage settings.');
    return false;
  }
}
function createSubjectRecord(name, held = 0, attended = 0, target = 75) {
  return { id: makeId(), name, held, attended, target, history: [], createdAt: new Date().toISOString() };
}
function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        subjects = parsed.filter((s) => s && typeof s === 'object').map((s) => ({
          id: String(s.id || makeId()),
          name: String(s.name || 'Untitled subject').slice(0, 48),
          held: Math.max(0, Math.trunc(Number(s.held) || 0)),
          attended: Math.max(0, Math.trunc(Number(s.attended) || 0)),
          target: Math.min(95, Math.max(50, Number(s.target) || 75)),
          history: Array.isArray(s.history) ? s.history : [],
          createdAt: s.createdAt || new Date().toISOString()
        }));
      }
    }
  } catch (error) {
    console.warn('BUNKED storage could not be read:', error);
    subjects = [];
  }
  if (!subjects.length) {
    // Starter values match the original BUNKED demo. No fake history is generated.
    subjects = [createSubjectRecord('Computer Science', 26, 24, 75)];
    saveAll();
  }
  activeId = subjects[0].id;
}
function calculate(held, attended, target) {
  if (!Number.isInteger(held) || !Number.isInteger(attended) || held < 0 || attended < 0 || attended > held) {
    return { valid: false, percentage: null, missed: 0, skips: 0, recovery: 0, status: 'invalid' };
  }
  if (held === 0) return { valid: true, percentage: null, missed: 0, skips: 0, recovery: 0, status: 'not-started' };
  const ratio = target / 100;
  const percentage = attended / held * 100;
  const skips = Math.max(0, Math.floor((attended - ratio * held) / ratio + 1e-10));
  const recovery = percentage < target
    ? Math.max(0, Math.ceil((ratio * held - attended) / (1 - ratio) - 1e-10))
    : 0;
  return { valid: true, percentage, missed: held - attended, skips, recovery,
    after: skips ? attended / (held + skips) * 100 : percentage,
    status: percentage >= target ? 'safe' : 'recover' };
}
function getCounts() {
  return { held: Number($('held').value), attended: Number($('attended').value), target: Number($('target').value) };
}
function renderTabs() {
  $('subjectTabs').innerHTML = subjects.map((subject) =>
    `<button type="button" class="tab ${subject.id === activeId ? 'active' : ''}" data-id="${esc(subject.id)}">${esc(subject.name)}</button>`
  ).join('');
  $('subjectTabs').querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => selectSubject(button.dataset.id));
  });
}
function selectSubject(id) {
  activeId = id;
  current = subjects.find((subject) => subject.id === id) || null;
  if (!current) return;
  renderTabs();
  $('subjectName').value = current.name;
  $('held').value = current.held;
  $('attended').value = current.attended;
  $('target').value = current.target;
  $('targetVal').textContent = current.target + '%';
  $('forecast').value = 1;
  render();
  renderHistory();
}
function render() {
  if (!current) return;
  const { held, attended, target } = getCounts();
  const result = calculate(held, attended, target);
  $('targetVal').textContent = target + '%';
  $('meterFill').style.width = result.percentage === null ? '0%' : Math.min(100, result.percentage) + '%';
  $('meterText').textContent = result.percentage === null ? 'NO CLASSES YET' : result.percentage.toFixed(1) + '% / ' + target + '%';
  $('pct').textContent = result.percentage === null ? '—' : result.percentage.toFixed(1) + '%';
  $('missed').textContent = String(result.missed).padStart(2, '0');
  $('status').textContent = result.status === 'safe'
    ? (result.skips ? '● SAFE ZONE' : '● ON THE LINE')
    : result.status === 'recover' ? '● RECOVERY MODE' : result.status === 'not-started' ? '● NOT STARTED' : '● CHECK INPUTS';
  if (!result.valid) {
    $('bigNumber').textContent = '—';
    $('resultLabel').textContent = 'CHECK YOUR COUNTS';
    $('resultUnit').textContent = 'ATTENDED CANNOT EXCEED HELD';
    $('resultMessage').textContent = 'Enter whole numbers. Attended classes must be between zero and classes held.';
    $('after').textContent = '—';
    renderForecast();
    return;
  }
  if (result.status === 'not-started') {
    $('resultLabel').textContent = 'NO CLASSES YET';
    $('bigNumber').textContent = '—';
    $('resultUnit').textContent = 'ADD YOUR FIRST CLASS';
    $('resultMessage').textContent = 'Add your class counts or log your first class to start tracking.';
    $('after').textContent = '—';
  } else if (result.status === 'recover') {
    $('resultLabel').textContent = 'ATTEND TO RECOVER';
    $('bigNumber').textContent = String(result.recovery).padStart(2, '0');
    $('resultUnit').textContent = 'CONSECUTIVE CLASSES TO ATTEND';
    $('resultMessage').textContent = `You are below ${target}%. Attend the next ${result.recovery} consecutive ${result.recovery === 1 ? 'class' : 'classes'} to recover.`;
    $('after').textContent = '—';
  } else {
    $('resultLabel').textContent = result.skips ? 'YOU CAN STILL SKIP' : 'NO BUNKS LEFT';
    $('bigNumber').textContent = String(result.skips).padStart(2, '0');
    $('resultUnit').textContent = `CLASSES WITHOUT DROPPING BELOW ${target}%`;
    $('resultMessage').textContent = result.skips
      ? `You can miss ${result.skips} more ${result.skips === 1 ? 'class' : 'classes'} and stay at or above ${target}%.`
      : 'You are right on the line. Attend your next class to build a buffer.';
    $('after').textContent = result.after.toFixed(1) + '%';
  }
  renderForecast();
}
function renderForecast() {
  if (!current) return;
  const { held, attended, target } = getCounts();
  const n = Number($('forecast').value);
  const valid = Number.isInteger(held) && Number.isInteger(attended) && held >= 0 && attended >= 0 && attended <= held;
  const percentage = valid && held + n > 0 ? attended / (held + n) * 100 : null;
  $('forecastN').textContent = n;
  $('forecastPct').textContent = percentage === null ? '—' : percentage.toFixed(1) + '%';
  const verdict = $('forecastVerdict');
  verdict.classList.toggle('below', percentage !== null && percentage < target);
  verdict.textContent = percentage === null
    ? 'Enter valid class counts to run the forecast.'
    : percentage >= target
      ? 'Still above the line. Nice.'
      : `That would put you ${(target - percentage).toFixed(1)} points below the target.`;
}
function updateManualValues() {
  if (!current) return;
  const { held, attended, target } = getCounts();
  if (!Number.isInteger(held) || !Number.isInteger(attended) || held < 0 || attended < 0 || attended > held) {
    render();
    return;
  }
  current.held = held;
  current.attended = attended;
  current.target = target;
  current.name = $('subjectName').value.trim().slice(0, 48) || current.name;
  saveAll();
  renderTabs();
  render();
}
function scheduleManualSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(updateManualValues, 280);
}
function renderHistory() {
  if (!current) return;
  const rows = [...current.history].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 50);
  $('historyCount').textContent = `${rows.length} ${rows.length === 1 ? 'ENTRY' : 'ENTRIES'}`;
  $('history').innerHTML = rows.length ? rows.map((entry) => {
    const date = new Date(entry.at);
    const timestamp = Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    return `<div class="historyrow"><b>${entry.attended ? 'PRESENT' : 'ABSENT'}</b><span class="${entry.attended ? 'yes' : 'no'}">${entry.attended ? '✓ ATTENDED' : '× MISSED'}</span><span>${esc(entry.note || (entry.attended ? 'Attended' : 'Absent'))} · ${esc(timestamp)}</span></div>`;
  }).join('') : '<div class="empty">No classes logged yet. Use the buttons above to start your record.</div>';
}
function logClass(wasPresent) {
  if (!current) return;
  const { held, attended, target } = getCounts();
  if (!Number.isInteger(held) || !Number.isInteger(attended) || held < 0 || attended < 0 || attended > held) {
    toast('Fix your class counts before logging a class.');
    return;
  }
  // A class-log action changes counts once and appends one corresponding history entry.
  current.held = held + 1;
  current.attended = attended + (wasPresent ? 1 : 0);
  current.target = target;
  current.name = $('subjectName').value.trim().slice(0, 48) || current.name;
  current.history.push({ id: makeId(), attended: wasPresent, note: wasPresent ? 'Attended' : 'Absent', at: new Date().toISOString() });
  if (saveAll()) {
    selectSubject(current.id);
    toast(wasPresent ? 'Class marked attended.' : 'Absence logged.');
  }
}
function addSubject(name) {
  const cleanName = String(name || '').trim().slice(0, 48);
  if (!cleanName) throw new Error('Enter a subject name first.');
  const subject = createSubjectRecord(cleanName);
  subjects.push(subject);
  saveAll();
  selectSubject(subject.id);
  return subject;
}
function applyTheme(theme) {
  const light = theme === 'light';
  document.body.classList.toggle('light', light);
  $('themeBtn').setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  $('themeBtn').title = light ? 'Switch to dark mode' : 'Switch to light mode';
  $('themeBtn').textContent = light ? '☼' : '◐';
  document.querySelector('meta[name="theme-color"]').content = light ? '#E9DFCD' : '#1E1E1C';
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
}
function wireEvents() {
  $('addSubject').addEventListener('click', () => {
    $('formError').textContent = '';
    $('newName').value = '';
    $('addDialog').showModal();
    setTimeout(() => $('newName').focus(), 0);
  });
  $('cancelAdd').addEventListener('click', () => {
    $('addDialog').close('cancel');
    $('addForm').reset();
    $('formError').textContent = '';
  });
  $('addForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('newName').value.trim();
    if (!name) {
      $('formError').textContent = 'Please enter a subject name.';
      $('newName').focus();
      return;
    }
    try {
      const subject = addSubject(name);
      $('addDialog').close('created');
      $('addForm').reset();
      $('formError').textContent = '';
      toast(`${subject.name} added to your semester.`);
    } catch (error) {
      $('formError').textContent = error.message;
    }
  });
  $('newName').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') $('addDialog').close('cancel');
  });
  $('subjectName').addEventListener('input', scheduleManualSave);
  ['held', 'attended'].forEach((id) => $(id).addEventListener('input', () => {
    render();
    scheduleManualSave();
  }));
  $('target').addEventListener('input', () => {
    $('targetVal').textContent = $('target').value + '%';
    render();
    scheduleManualSave();
  });
  document.querySelectorAll('[data-change]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $(button.dataset.change);
      input.value = Math.max(0, (Number(input.value) || 0) + Number(button.dataset.delta));
      render();
      updateManualValues();
    });
  });
  $('presentBtn').addEventListener('click', () => logClass(true));
  $('absentBtn').addEventListener('click', () => logClass(false));
  $('forecast').addEventListener('input', renderForecast);
  $('refreshHistory').addEventListener('click', renderHistory);
  $('deleteSubject').addEventListener('click', () => {
    if (!current) return;
    if (!window.confirm(`Delete ${current.name} and its class history?`)) return;
    subjects = subjects.filter((subject) => subject.id !== activeId);
    if (!subjects.length) subjects = [createSubjectRecord('Computer Science', 0, 0, 75)];
    activeId = subjects[0].id;
    saveAll();
    selectSubject(activeId);
    toast('Subject and its class log deleted.');
  });
  $('demoBtn').addEventListener('click', () => {
    const demo = createSubjectRecord('Demo — Physics', 32, 25, 75);
    subjects.push(demo);
    saveAll();
    selectSubject(demo.id);
    toast('Demo subject added.');
  });
  $('soundBtn').addEventListener('click', (event) => {
    event.stopPropagation();
    setSoundDeckOpen($('soundDeck').hidden);
    playUiSound('click');
  });
  $('masterToggle').addEventListener('change', () => {
    soundSettings.master = $('masterToggle').checked;
    updateSoundDeck();
    persistSoundSettings();
    if (soundSettings.master) playUiSound('click');
  });
  $('clickToggle').addEventListener('change', () => {
    soundSettings.click = $('clickToggle').checked;
    updateSoundDeck();
    persistSoundSettings();
    if (soundSettings.click) playUiSound('click');
  });
  $('typingToggle').addEventListener('change', () => {
    soundSettings.typing = $('typingToggle').checked;
    updateSoundDeck();
    persistSoundSettings();
    if (soundSettings.typing) playUiSound('type');
  });
  $('soundVolume').addEventListener('input', () => {
    soundSettings.volume = Number($('soundVolume').value);
    updateSoundDeck();
    persistSoundSettings();
  });
  $('testClick').addEventListener('click', () => {
    if (soundSettings.master && soundSettings.click) {
      playUiSound('click', false, 'left');
      window.setTimeout(() => playUiSound('click', false, 'right'), 285);
    }
  });
  $('testType').addEventListener('click', () => {
    if (soundSettings.master && soundSettings.typing) {
      const sequence = ['KeyA', 'Digit2', 'Space', 'Backspace', 'Enter', 'ShiftLeft'];
      sequence.forEach((code, index) => {
        window.setTimeout(() => playUiSound('type', false, 'left', code), index * 165);
      });
      preloadKeyboardPack();
    }
  });
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('button:not(:disabled), a[href], input:not([type="range"]), select, textarea, summary, [role="button"], [data-click-sound]')
      : null;
    if (!target || target.closest('[data-no-auto-sound]') || target.id === 'soundBtn') return;
    playUiSound('click', false, event.button === 2 ? 'right' : 'left');
    if (!$('soundDeck').hidden && !target.closest('#soundDeck')) setSoundDeckOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const field = event.target instanceof Element
      ? event.target.closest('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')
      : null;
    const keyCode = event.code || (event.key === ' ' ? 'Space' : '');
    if (!field || !keyboardSampleForCode(keyCode)) return;
    const now = performance.now();
    if (now - lastKeySoundAt < 32) return;
    lastKeySoundAt = now;
    playUiSound('type', false, 'left', keyCode);
  }, true);
  // Mobile virtual keyboards may emit input events without a usable keydown event.
  document.addEventListener('input', (event) => {
    const field = event.target instanceof Element
      ? event.target.closest('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')
      : null;
    if (!field || !['insertText', 'deleteContentBackward', 'deleteContentForward'].includes(event.inputType)) return;
    const now = performance.now();
    if (now - lastKeySoundAt < 32) return;
    lastKeySoundAt = now;
    playUiSound('type', false, 'left', keyCodeFromInputEvent(event));
  }, true);
  document.addEventListener('pointerdown', (event) => {
    if ($('soundDeck').hidden || event.target.closest('#soundDeck') || event.target.closest('#soundBtn')) return;
    setSoundDeckOpen(false);
  });
  document.addEventListener('contextmenu', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('button, a[href], [role="button"], [data-click-sound]')
      : null;
    if (target) playUiSound('click', false, 'right');
  });
  document.addEventListener('pointerdown', (event) => {
    if (event.button >= 3) {
      const target = event.target instanceof Element
        ? event.target.closest('button, a[href], [role="button"], [data-click-sound]')
        : null;
      if (target) playUiSound('click', false, 'side');
    }
  });
  $('themeBtn').addEventListener('click', () => {
    applyTheme(document.body.classList.contains('light') ? 'dark' : 'light');
  });
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      loadAll();
      selectSubject(activeId);
    }
  });
}

loadAll();
applyTheme((() => { try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch (_) { return 'dark'; } })());
loadSoundSettings();
wireEvents();
selectSubject(activeId);
preloadMousePack();
preloadKeyboardPack();
