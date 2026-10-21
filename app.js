const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "studymate.tasks.v1";
let tasks = [];
let currentFilter = "all";
let toastTimer;
try { tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { tasks = []; }
const today = new Date();
$("todayLabel").textContent = today.toLocaleDateString(undefined, {weekday:"long", month:"long", day:"numeric"}).toUpperCase();
const hour = today.getHours();
$("pageTitle").innerHTML = `${hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}, student <span class="wave">✦</span>`;
let serverStorageAvailable = false;
let voiceRepliesEnabled = true;
async function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  renderTasks();
  try {
    const response = await fetch('/api/tasks', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({tasks}) });
    if (!response.ok) throw new Error('server save failed');
    serverStorageAvailable = true;
  } catch {
    if (serverStorageAvailable) toast('Server save failed. A local browser copy is still available.');
    serverStorageAvailable = false;
  }
}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2300);}
function dateLabel(value){if(!value)return "No due date";const d=new Date(value+"T12:00:00");return "Due "+d.toLocaleDateString(undefined,{month:"short",day:"numeric"});}
function taskRow(task){const row=document.createElement("div");row.className="task-row"+(task.done?" completed":"");row.innerHTML=`<input class="task-check" type="checkbox" ${task.done?"checked":""} aria-label="Mark ${escapeHTML(task.title)} complete"><div class="task-main"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.subject||"General")} · ${dateLabel(task.due)}</small></div><span class="priority ${task.priority}">${task.priority}</span><button class="delete-task" aria-label="Delete task" title="Delete task">×</button>`;row.querySelector("input").addEventListener("change",()=>{task.done=!task.done;save();});row.querySelector(".delete-task").addEventListener("click",()=>{tasks=tasks.filter(t=>t.id!==task.id);save();toast("Assignment removed.");});return row;}
function escapeHTML(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function emptyState(title,sub){const d=document.createElement("div");d.className="empty-state";d.innerHTML=`<b>${title}</b>${sub}`;return d;}
function renderList(container,items){container.innerHTML="";if(!items.length){container.appendChild(emptyState("Nothing here yet","Add a task and it will show up here."));return;}items.forEach(t=>container.appendChild(taskRow(t)));}
function renderTasks(){const open=tasks.filter(t=>!t.done),done=tasks.filter(t=>t.done);$("openTaskStat").textContent=open.length;$("doneTaskStat").textContent=done.length;$("navTaskCount").textContent=open.length;$("taskCountLabel").textContent=`${tasks.length} assignment${tasks.length===1?"":"s"}`;const next=open.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due))[0];$("nextDeadlineStat").textContent=next?new Date(next.due+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"}):"—";$("nextDeadlineSub").textContent=next?next.title:"Add an assignment";renderList($("homeTaskList"),open.slice().sort(sortTasks).slice(0,4));let filtered=tasks;if(currentFilter==="open")filtered=tasks.filter(t=>!t.done);if(currentFilter==="done")filtered=tasks.filter(t=>t.done);renderList($("allTaskList"),filtered.slice().sort(sortTasks));}
function sortTasks(a,b){if(a.done!==b.done)return a.done?1:-1;if(!a.due)return 1;if(!b.due)return -1;return a.due.localeCompare(b.due);}
function navigate(view){document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));$(view+"View").classList.remove("hidden");document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));const titles={home:["Overview","Let's make today feel a little more manageable."],tasks:["Assignments","Capture every task before it escapes into the void."],planner:["Study planner","Build a realistic plan you can actually follow."],assistant:["Ask StudyMate","A study co-pilot for the next step."]};$("pageTitle").innerHTML=`${titles[view][0]} <span class="wave">✦</span>`;$("pageSubtitle").textContent=titles[view][1];window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
$("taskForm").addEventListener("submit",e=>{e.preventDefault();const title=$("taskTitle").value.trim();if(!title)return;tasks.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title,subject:$("taskSubject").value.trim(),due:$("taskDue").value,priority:$("taskPriority").value,done:false});save();e.target.reset();toast("Assignment added to your planner.");});
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{currentFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderTasks();}));
$("generatePlan").addEventListener("click",()=>{const topic=$("focusTopic").value.trim()||"your chosen topic";const goal=$("focusGoal").value.trim()||"make measurable progress";const mins=Number($("focusDuration").value);const main=Math.max(10,mins-10);$("focusPlanResult").classList.remove("hidden");$("focusPlanResult").innerHTML=`<h4>✦ Your ${mins}-minute plan</h4><ol><li><b>Set up · 2 min</b><br>Open only the notes or tools you need for ${escapeHTML(topic)}.</li><li><b>Focused work · ${main} min</b><br>${escapeHTML(goal)}. Put distracting tabs away and work on one objective.</li><li><b>Recall · 5 min</b><br>Close your notes and write or explain what you remember.</li><li><b>Wrap up · 3 min</b><br>Record one thing learned and one question to revisit.</li></ol><p class="muted">Tip: take a proper break after this block. Focus is not a renewable resource with unlimited supply.</p>`;});
const weekStart=new Date(today);weekStart.setDate(today.getDate()-((today.getDay()+6)%7));$("weekDays").innerHTML="";for(let i=0;i<7;i++){const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);const b=document.createElement("button");b.className="day-chip"+(d.toDateString()===today.toDateString()?" selected":"");b.innerHTML=`<small>${d.toLocaleDateString(undefined,{weekday:"short"}).toUpperCase()}</small><strong>${d.getDate()}</strong>`;b.addEventListener("click",()=>{document.querySelectorAll(".day-chip").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");});$("weekDays").appendChild(b);}
$("themeButton").addEventListener("click",()=>{document.body.classList.toggle("light");toast(document.body.classList.contains("light")?"Light appearance enabled.":"Dark appearance enabled.");});
const chatHistory=[];
function speakText(text){
  if(!voiceRepliesEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}
function addMessage(text,role){const msg=document.createElement("div");msg.className="message "+role;const bubble=document.createElement("div");bubble.className="bubble";bubble.textContent=text;if(role==="assistant"){const av=document.createElement("div");av.className="message-avatar";av.textContent="✦";msg.appendChild(av);}msg.appendChild(bubble);$("chatMessages").appendChild(msg);$("chatMessages").scrollTop=$("chatMessages").scrollHeight;if(role==="assistant")speakText(text);}
const recentMessages=[];
async function sendChat(text){
  text=text.trim();if(!text)return;
  addMessage(text,"user");recentMessages.push({role:"user",text});if(recentMessages.length>12)recentMessages.shift();$("chatInput").value="";
  const waiting=document.createElement("div");waiting.className="message assistant";waiting.id="assistantThinking";waiting.innerHTML='<div class="message-avatar">✦</div><div class="bubble">Thinking…</div>';$("chatMessages").appendChild(waiting);$("chatMessages").scrollTop=$("chatMessages").scrollHeight;
  try {
    const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:recentMessages.slice(0,-1)})});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||'StudyMate could not answer.');
    waiting.remove();addMessage(data.reply,"assistant");recentMessages.push({role:"assistant",text:data.reply});if(recentMessages.length>12)recentMessages.shift();
  } catch(error) {
    waiting.remove();addMessage(`I couldn't reach the AI backend. ${error.message} Make sure StudyMate is running with npm start, then refresh this page.`,"assistant");
  }
}
$("chatForm").addEventListener("submit",e=>{e.preventDefault();sendChat($("chatInput").value);});
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>{navigate("assistant");sendChat(b.dataset.prompt);}));
$("clearChat").addEventListener("click",()=>{if("speechSynthesis" in window)window.speechSynthesis.cancel();$("chatMessages").innerHTML="";addMessage("Conversation cleared. What would you like to work on next?","assistant");});
$("micButton").addEventListener("click",()=>{const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechRecognition){toast("Voice input isn't supported in this browser. Try a supported Chromium browser.");return;}const rec=new SpeechRecognition();rec.lang="en-IN";rec.interimResults=false;rec.maxAlternatives=1;rec.onstart=()=>toast("Listening… speak now.");rec.onerror=()=>toast("Couldn't capture speech. Check microphone permission.");rec.onresult=e=>{$("chatInput").value=e.results[0][0].transcript;$("chatInput").focus();};try{rec.start();}catch{toast("Voice input could not start. Check microphone permission.");}});
$("speakButton").addEventListener("click",()=>{
  voiceRepliesEnabled=!voiceRepliesEnabled;
  $("speakButton").textContent=voiceRepliesEnabled?"🔊 Voice on":"🔇 Voice off";
  $("speakButton").setAttribute("aria-pressed",String(voiceRepliesEnabled));
  if(!voiceRepliesEnabled && "speechSynthesis" in window)window.speechSynthesis.cancel();
  toast(voiceRepliesEnabled?"Spoken replies enabled.":"Spoken replies disabled.");
});
async function initializeTasks(){
  try {
    const response=await fetch('/api/tasks');
    if(!response.ok)throw new Error('server unavailable');
    const data=await response.json();
    if(Array.isArray(data.tasks)){
      const localTasks=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
      if(data.tasks.length===0 && localTasks.length>0){tasks=localTasks;await save();}
      else {tasks=data.tasks;localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));serverStorageAvailable=true;renderTasks();}
    }
  } catch { serverStorageAvailable=false; }
}
initializeTasks();
renderTasks();