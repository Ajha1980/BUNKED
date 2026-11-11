'use strict';

const STORAGE_KEY = 'bunked.v3.subjects';
const THEME_KEY = 'bunked.v3.theme';
const $ = (id) => document.getElementById(id);
let subjects = [];
let activeId = null;
let current = null;
let toastTimer = null;
let saveTimer = null;
let isSaving = false;

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
wireEvents();
selectSubject(activeId);
