let subjects=[],activeId=null,current=null;
const $=id=>document.getElementById(id);
async function api(url,opts={}){const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opts});if(!r.ok){let d={};try{d=await r.json()}catch{}throw Error(d.error||'Something went wrong');}return r.status===204?null:r.json()}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),1900)}
async function load(){subjects=await api('/api/subjects');if(!subjects.length){const x=await api('/api/subjects',{method:'POST',body:JSON.stringify({name:'Computer Science',held:40,attended:34})});subjects=await api('/api/subjects');activeId=x.id}if(!activeId||!subjects.some(s=>s.id===activeId))activeId=subjects[0].id;renderTabs();selectSubject(activeId)}
function renderTabs(){$('subjectTabs').innerHTML=subjects.map(s=>`<button class="tab ${s.id===activeId?'active':''}" data-id="${s.id}">${esc(s.name)}</button>`).join('');document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>selectSubject(+b.dataset.id))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function selectSubject(id){activeId=id;current=subjects.find(s=>s.id===id);if(!current)return;renderTabs();$('subjectName').value=current.name;$('held').value=current.held;$('attended').value=current.attended;$('target').value=current.target;$('targetVal').textContent=current.target+'%';render();loadHistory()}
function stats(h,a,t){if(h===0)return{percentage:null,missed:0,skips:0,recovery:0,status:'not-started'};let p=a/h*100,r=t/100;return{percentage:p,missed:h-a,skips:Math.max(0,Math.floor((a-r*h)/r+1e-10)),recovery:p<t?Math.max(0,Math.ceil((r*h-a)/(1-r)-1e-10)):0,status:p>=t?'safe':'recover'}}
function render(){let h=+ $('held').value,a=+ $('attended').value,t=+$('target').value;let valid=Number.isInteger(h)&&Number.isInteger(a)&&h>=0&&a>=0&&a<=h;if(!valid){$('bigNumber').textContent='—';$('resultMessage').textContent='Enter valid whole numbers. Attended cannot exceed held.';return}let s=stats(h,a,t),p=s.percentage;$('targetVal').textContent=t+'%';$('pct').textContent=p===null?'—':p.toFixed(1)+'%';$('missed').textContent=String(s.missed).padStart(2,'0');$('meterFill').style.width=Math.min(100,p||0)+'%';$('meterText').textContent=p===null?'NO CLASSES YET':p.toFixed(1)+'% / '+t+'%';$('status').textContent=s.status==='safe'?(s.skips?'● SAFE ZONE':'● ON THE LINE'):s.status==='recover'?'● RECOVERY MODE':'● NOT STARTED';$('resultLabel').textContent=s.status==='recover'?'ATTEND TO RECOVER':s.status==='not-started'?'NO CLASSES YET':s.skips?'YOU CAN STILL SKIP':'NO BUNKS LEFT';$('bigNumber').textContent=s.status==='recover'?String(s.recovery).padStart(2,'0'):s.status==='not-started'?'—':String(s.skips).padStart(2,'0');$('resultUnit').textContent=s.status==='recover'?'CONSECUTIVE CLASSES TO ATTEND':s.status==='not-started'?'ADD YOUR FIRST CLASS':'CLASSES WITHOUT DROPPING BELOW '+t+'%';$('resultMessage').textContent=s.status==='recover'?`You're below ${t}%. Attend the next ${s.recovery} consecutive classes to recover.`:s.status==='not-started'?'Add a class to start tracking your attendance.':s.skips?`You can miss ${s.skips} more ${s.skips===1?'class':'classes'} and stay at or above ${t}%.`:"You're right on the line. Attend your next class to build a buffer.";$('after').textContent=s.status==='recover'?'—':s.status==='not-started'?'—':(a/(h+s.skips)*100).toFixed(1)+'%';forecast()}
function forecast(){let h=+$('held').value,a=+$('attended').value,t=+$('target').value,n=+$('forecast').value;let p=h+n?100*a/(h+n):0;$('forecastN').textContent=n;$('forecastPct').textContent=p.toFixed(1)+'%';$('forecastVerdict').textContent=p>=t?'Still above the line. Nice.':`That would put you ${ (t-p).toFixed(1)} points below the target.`;$('forecastVerdict').style.color=p>=t?'#91d2a8':'#ff9e83';}
async function save(){let h=+$('held').value,a=+$('attended').value,t=+$('target').value;if(!Number.isInteger(h)||!Number.isInteger(a)||h<0||a<0||a>h){toast('Check your class counts.');return}current=await api('/api/subjects/'+activeId,{method:'PATCH',body:JSON.stringify({held:h,attended:a,target:t,name:$('subjectName').value})});subjects=await api('/api/subjects');renderTabs();render()}
async function log(present){try{await save();await api('/api/subjects/'+activeId+'/session',{method:'POST',body:JSON.stringify({attended:present,note:present?'Attended':'Absent'})});subjects=await api('/api/subjects');selectSubject(activeId);toast(present?'Class marked attended.':'Absence logged.')}catch(e){toast(e.message)}}
async function loadHistory(){try{let rows=await api('/api/subjects/'+activeId+'/history');$('history').innerHTML=rows.length?rows.map(r=>`<div class="historyrow"><b>${r.attended?'PRESENT':'ABSENT'}</b><span class="${r.attended?'yes':'no'}">${r.attended?'✓ ATTENDED':'× MISSED'}</span><span>${esc(r.note||'Class logged')} · ${esc(r.created_at)}</span></div>`).join(''):'<div class="empty">No classes logged yet. Use the buttons above to start your record.</div>'}catch{}}
['held','attended'].forEach(id=>$(id).addEventListener('input',()=>{render();clearTimeout(window.saveTimer);window.saveTimer=setTimeout(save,450)}));
$('subjectName').addEventListener('change',save);$('target').addEventListener('input',()=>{render();clearTimeout(window.saveTimer);window.saveTimer=setTimeout(save,400)});
document.querySelectorAll('[data-change]').forEach(b=>b.onclick=()=>{let el=$(b.dataset.change);el.value=Math.max(0,(+el.value||0)+ +b.dataset.delta);render();save()});
$('presentBtn').onclick=()=>log(true);$('absentBtn').onclick=()=>log(false);$('forecast').oninput=forecast;$('refreshHistory').onclick=loadHistory;
$('addSubject').onclick=()=>$('addDialog').showModal();
async function createSubject(event){
  event.preventDefault();
  if(event.submitter?.value==='cancel'){ $('addDialog').close(); $('addForm').reset(); return; }
  const name=$('newName').value.trim();
  if(!name){$('newName').focus();return}
  const button=$('createSubject');
  button.disabled=true;
  button.textContent='ADDING…';
  try{
    const created=await api('/api/subjects',{method:'POST',body:JSON.stringify({name})});
    $('addDialog').close();
    $('addForm').reset();
    activeId=created.id;
    await load();
    selectSubject(created.id);
    toast('Subject added.');
  }catch(error){toast('Could not add subject: '+error.message)}
  finally{button.disabled=false;button.textContent='CREATE SUBJECT ↗'}
}
$('addForm').addEventListener('submit',createSubject);
$('deleteSubject').onclick=async()=>{if(!confirm(`Delete ${current.name} and its log?`))return;await api('/api/subjects/'+activeId,{method:'DELETE'});activeId=null;await load();toast('Subject deleted.')};
$('demoBtn').onclick=async()=>{let d=await api('/api/subjects',{method:'POST',body:JSON.stringify({name:'Demo — Physics',held:32,attended:25,target:75})});activeId=d.id;await load();toast('Demo subject loaded.')};
$('themeBtn').onclick=()=>document.body.classList.toggle('light');
load().catch(e=>toast(e.message))