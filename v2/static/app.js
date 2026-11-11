const $ = (id) => document.getElementById(id);
let subjects = [];
let forecastSubject = null;
const openHistory = new Set();

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    let message = "Something went wrong.";
    try { message = (await response.json()).error || message; } catch (_) {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
function toast(message) {
  const box = $("toast");
  box.textContent = message;
  box.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => box.classList.remove("show"), 2200);
}
function pct(value) {
  return value == null ? "—" : Number(value).toFixed(1).replace(/\.0$/, "") + "%";
}
async function refresh() {
  try {
    subjects = await api("/api/subjects");
    if (!forecastSubject || !subjects.some((s) => s.id === forecastSubject)) {
      forecastSubject = subjects[0]?.id ?? null;
    }
    render();
  } catch (error) { toast(error.message); }
}
function render() {
  const list = $("subjectList");
  $("summary").textContent = subjects.length
    ? subjects.length + " SUBJECT" + (subjects.length === 1 ? "" : "S") + " · " +
      subjects.filter((s) => s.stats.status === "recover").length + " NEED ATTENTION"
    : "YOUR SEMESTER STARTS HERE";
  if (!subjects.length) {
    list.innerHTML = '<div class="empty">No subjects yet. Add your first subject to start tracking attendance.<br><br><button class="primary" id="emptyAdd">＋ ADD YOUR FIRST SUBJECT</button></div>';
    $("emptyAdd")?.addEventListener("click", addSubject);
    updateForecast();
    return;
  }
  list.innerHTML = subjects.map((s) => {
    const st = s.stats || {};
    const ready = st.status === "safe";
    const percent = st.percentage == null ? 0 : st.percentage;
    const displayBudget = ready ? st.skips : st.recovery;
    const stateText = st.status === "not-started" ? "NOT STARTED" : ready ? "SAFE ZONE" : "BELOW TARGET";
    return `
      <article class="subject-card" data-id="${s.id}">
        <div class="cardtop">
          <input class="subject-name" aria-label="Subject name" data-field="name" value="${escapeHtml(s.name)}">
          <span class="pill ${ready ? "safe" : "recover"}">${stateText}</span>
          <button class="delete" data-action="delete" title="Delete subject" aria-label="Delete subject">×</button>
        </div>
        <div class="cardstats">
          <div class="metric"><b>${pct(st.percentage)}</b><span>ATTENDANCE</span></div>
          <div class="metric"><b>${st.missed ?? 0}</b><span>CLASSES MISSED</span></div>
          <div class="metric"><b>${displayBudget ?? 0}</b><span>${ready ? "SAFE SKIPS" : "TO RECOVER"}</span></div>
        </div>
        <div class="attendance-line"><span>ATTENDANCE METER</span><span>${pct(st.percentage)} / ${s.target}%</span></div>
        <div class="bar"><i style="width:${Math.min(100, percent)}%"></i></div>
        <div class="controls">
          <div><label class="control-label">CLASSES HELD</label><div class="stepper">
            <button data-step="held" data-delta="-1" aria-label="Decrease held">−</button>
            <input type="number" min="0" step="1" data-field="held" value="${s.held}">
            <button data-step="held" data-delta="1" aria-label="Increase held">+</button>
          </div></div>
          <div><label class="control-label">CLASSES ATTENDED</label><div class="stepper">
            <button data-step="attended" data-delta="-1" aria-label="Decrease attended">−</button>
            <input type="number" min="0" step="1" data-field="attended" value="${s.attended}">
            <button data-step="attended" data-delta="1" aria-label="Increase attended">+</button>
          </div></div>
        </div>
        <div class="targetrow"><label class="control-label">ATTENDANCE TARGET · <b>${s.target}%</b></label>
          <input type="range" min="50" max="95" step="1" data-field="target" value="${s.target}">
        </div>
        <div class="actions">
          <button class="present" data-action="present">＋ I ATTENDED</button>
          <button data-action="absent">− I MISSED</button>
          <button data-action="history">PAPER TRAIL ↗</button>
          <button data-action="forecast">FORECAST</button>
        </div>
        ${openHistory.has(s.id) ? '<div class="history">Loading class log…</div>' : ""}
      </article>`;
  }).join("");
  updateForecast();
}
async function saveCard(card) {
  const id = Number(card.dataset.id);
  const payload = {
    name: card.querySelector('[data-field="name"]').value.trim(),
    held: Number(card.querySelector('[data-field="held"]').value),
    attended: Number(card.querySelector('[data-field="attended"]').value),
    target: Number(card.querySelector('[data-field="target"]').value)
  };
  if (!Number.isInteger(payload.held) || !Number.isInteger(payload.attended) ||
      payload.held < 0 || payload.attended < 0 || payload.attended > payload.held) {
    toast("Check the class counts. Attended cannot exceed held.");
    return;
  }
  try {
    await api("/api/subjects/" + id, { method: "PATCH", body: JSON.stringify(payload) });
    await refresh();
    toast("Subject updated.");
  } catch (error) { toast(error.message); }
}
async function addSubject(name) {
  const subjectName = name || window.prompt("Name this subject:");
  if (!subjectName || !subjectName.trim()) return;
  try {
    const result = await api("/api/subjects", {
      method: "POST",
      body: JSON.stringify({ name: subjectName.trim(), held: 0, attended: 0, target: 75 })
    });
    forecastSubject = result.id;
    await refresh();
    toast("Subject added to your ledger.");
  } catch (error) { toast(error.message); }
}
async function logClass(id, attended) {
  try {
    await api("/api/subjects/" + id + "/session", {
      method: "POST",
      body: JSON.stringify({ attended, note: "" })
    });
    await refresh();
    toast(attended ? "Attendance logged." : "Absence logged.");
  } catch (error) { toast(error.message); }
}
async function loadHistory(card) {
  const id = Number(card.dataset.id);
  const host = card.querySelector(".history");
  if (openHistory.has(id)) {
    openHistory.delete(id);
    host?.remove();
    return;
  }
  openHistory.add(id);
  if (!host) {
    const box = document.createElement("div");
    box.className = "history";
    box.textContent = "Loading class log…";
    card.appendChild(box);
  }
  try {
    const rows = await api("/api/subjects/" + id + "/history");
    const target = card.querySelector(".history");
    if (!target) return;
    target.innerHTML = rows.length ? rows.map((row) => `
      <div class="history-row"><span>${row.attended ? "PRESENT" : "ABSENT"} · ${escapeHtml(row.note || "Class logged")}</span>
      <span>${escapeHtml(row.created_at || "")}</span></div>`).join("") : "No classes logged yet.";
  } catch (error) { toast(error.message); }
}
function updateForecast() {
  const n = Number($("forecast").value);
  $("forecastN").textContent = n;
  const s = subjects.find((item) => item.id === forecastSubject);
  if (!s || s.held === 0) {
    $("forecastPct").textContent = "—";
    $("forecastVerdict").textContent = "Select a subject with classes logged to see how future absences affect attendance.";
    return;
  }
  const value = s.attended / (s.held + n) * 100;
  $("forecastPct").textContent = pct(value);
  $("forecastVerdict").textContent = value >= s.target
    ? "Still above the " + s.target + "% line for " + s.name + ". Keep a buffer for emergencies."
    : "That would drop " + s.name + " below " + s.target + "%. You would need to attend upcoming classes to recover.";
}
$("subjectList").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const card = event.target.closest(".subject-card");
  if (!button) return;
  if (button.id === "emptyAdd") return;
  if (!card) return;
  const id = Number(card.dataset.id);
  const action = button.dataset.action;
  if (button.dataset.step) {
    const input = card.querySelector('[data-field="' + button.dataset.step + '"]');
    input.value = Math.max(0, Number(input.value || 0) + Number(button.dataset.delta));
    await saveCard(card);
  } else if (action === "present") await logClass(id, true);
  else if (action === "absent") await logClass(id, false);
  else if (action === "delete") {
    if (!window.confirm("Delete this subject and its class history?")) return;
    try { await api("/api/subjects/" + id, { method: "DELETE" }); openHistory.delete(id); await refresh(); toast("Subject deleted."); }
    catch (error) { toast(error.message); }
  } else if (action === "history") await loadHistory(card);
  else if (action === "forecast") { forecastSubject = id; updateForecast(); $("forecast").scrollIntoView({ behavior:"smooth", block:"center" }); }
});
$("subjectList").addEventListener("change", async (event) => {
  const card = event.target.closest(".subject-card");
  if (card && event.target.matches("[data-field]")) await saveCard(card);
});
$("subjectList").addEventListener("keydown", async (event) => {
  if (event.key === "Enter" && event.target.matches('[data-field="name"]')) {
    event.preventDefault();
    await saveCard(event.target.closest(".subject-card"));
    event.target.blur();
  }
});
$("addSubject").addEventListener("click", () => addSubject());
$("forecast").addEventListener("input", updateForecast);
$("demoBtn").addEventListener("click", async () => {
  const examples = [
    { name:"Computer Science", held:40, attended:34, target:75 },
    { name:"Mathematics", held:36, attended:25, target:75 },
    { name:"Physics", held:38, attended:31, target:75 }
  ];
  try {
    for (const example of examples) await api("/api/subjects", { method:"POST", body:JSON.stringify(example) });
    await refresh();
    toast("Demo subjects added. Make them your own.");
  } catch (error) { toast(error.message); }
});
refresh();
