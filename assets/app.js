/* ETS Investments — Advisory Practice Intake
   Front end. Talks to the Apps Script backend in apps-script/Code.gs.
   The web-app URL lives in assets/config.js — nothing else needs editing. */

const API_URL = window.API_URL || "";

let storageOK = true;        // becomes false if the backend can't be reached
let sid = "";                // this person's session id

function newSid(){
  const r = new Uint8Array(12);
  (window.crypto || {}).getRandomValues
    ? window.crypto.getRandomValues(r)
    : r.forEach((_,i)=>r[i]=Math.floor(Math.random()*256));
  return "s" + Array.from(r, b => b.toString(36).padStart(2,"0")).join("").slice(0,20);
}

function apiReady(){
  return /^https?:\/\//.test(API_URL) && API_URL.indexOf("PASTE_YOUR") === -1;
}

/* Sends answers to the sheet. Content-Type is text/plain on purpose —
   it keeps the browser from firing a CORS preflight that Apps Script
   cannot answer. Apps Script still reads the JSON body fine. */
async function push(status){
  if(!apiReady()) { storageOK = false; return false; }
  const headers = [], values = [];
  SECTIONS.forEach(s => s.qs.forEach(q => {
    headers.push(q.id + " " + q.t);
    values.push(flatten(answers[q.id], q));
  }));
  try{
    const res = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify({ sid, status, answers, headers, values })
    });
    const j = await res.json();
    if(!j.ok) throw new Error(j.error || "rejected");
    storageOK = true;
    return true;
  }catch(err){
    storageOK = false;
    return false;
  }
}

async function pull(which){
  if(!apiReady()) return null;
  try{
    const url = API_URL + (which.key ? "?key=" + encodeURIComponent(which.key)
                                     : "?sid=" + encodeURIComponent(which.sid));
    const res = await fetch(url);
    return await res.json();
  }catch(err){ return null; }
}

function flatten(v, q){
  if(v==null) return "";
  if(Array.isArray(v)) return v.join(" | ");
  if(typeof v==="object") return Object.entries(v)
    .filter(([,x])=>x!==""&&x!=null)
    .map(([k,x])=>k+": "+x+(q && q.grid==="pct"?"%":"")).join(" | ");
  return String(v);
}

const ALL_Q = SECTIONS.flatMap(s => s.qs.map(q => ({...q, sec:s.id, secTitle:s.title})));
const REQUIRED = ALL_Q.filter(q => q.req);

/* ------------------------- state ------------------------- */
let answers = {};
let cur = 0;
let mode = "form";       // form | done | admin
let showErrors = false;
let saveState = "";
let subs = [];

/* ------------------------- helpers ------------------------- */
const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function answered(q){
  const v = answers[q.id];
  if(v==null) return false;
  if(Array.isArray(v)) return v.length>0;
  if(typeof v==="object") return Object.values(v).some(x=>x!==""&&x!=null);
  return String(v).trim()!=="";
}
function secDone(s){ const r=s.qs.filter(q=>q.req); return r.length>0 && r.every(answered); }
function missing(){ return REQUIRED.filter(q=>!answered(q)); }

/* ------------------------- render ------------------------- */
function render(){
  const root = document.getElementById("root");
  if(mode==="admin"){ root.innerHTML = adminHTML(); bindAdmin(); return; }
  if(mode==="done"){ root.innerHTML = doneHTML(); bindDone(); return; }

  const s = SECTIONS[cur];
  const miss = missing();
  const pct = Math.round(REQUIRED.filter(answered).length / REQUIRED.length * 100);

  root.innerHTML = `
  <div class="mobbar">
    <select id="msel" aria-label="Jump to section">${SECTIONS.map((x,i)=>`<option value="${i}" ${i===cur?"selected":""}>${i+1}. ${esc(x.title)}${secDone(x)?" ✓":""}</option>`).join("")}</select>
    <div class="prog"><i style="width:${pct}%"></i></div>
  </div>
  <div class="wrap">
    <nav class="rail">
      <h1>Advisory practice intake</h1>
      <p class="who">ETS Investments · Lucky Noor</p>
      ${SECTIONS.map((x,i)=>`<button class="navitem ${i===cur?"on":""}" data-go="${i}">
        <span class="nnum">${i+1}</span><span>${esc(x.title)}</span>${secDone(x)?`<span class="ndone">✓</span>`:""}
      </button>`).join("")}
      <p class="who" style="margin-top:22px">${REQUIRED.filter(answered).length} of ${REQUIRED.length} required answers complete</p>
    </nav>
    <main class="main">
      ${!storageOK?`<div class="warn">Not connected to the response sheet, so nothing is being saved. Finish in this tab and use “Copy all answers” at the bottom, or tell Sahil the form is not connecting.</div>`
        :`<div class="note" style="background:#EFEDE4;border-left-color:var(--brass)">Your progress saves automatically. To carry on later, bookmark this page or copy the address bar — it now contains your personal resume link.</div>`}
      <p class="crumb">Section ${cur+1} of ${SECTIONS.length}</p>
      <h2>${esc(s.title)}</h2>
      <p class="sub">${esc(s.sub||"")}</p>
      ${s.note?`<div class="note">${esc(s.note)}</div>`:""}
      ${s.qs.map(qHTML).join("")}
      <div class="bar">
        ${cur>0?`<button class="b sec" data-go="${cur-1}">Back</button>`:""}
        ${cur<SECTIONS.length-1
          ? `<button class="b pri" data-go="${cur+1}">Continue</button>`
          : `<button class="b pri" id="submit">Send to Sahil</button>`}
        <button class="b sec" id="copy">Copy all answers</button>
        <span class="savenote">${esc(saveState)}</span>
      </div>
      ${cur===SECTIONS.length-1 && showErrors && miss.length
        ? `<div class="warn" style="margin-top:18px"><strong>${miss.length} required ${miss.length===1?"answer is":"answers are"} still missing.</strong><br>${
            miss.slice(0,12).map(q=>`${q.id} — ${esc(q.t)} <em>(${esc(q.secTitle)})</em>`).join("<br>")
          }${miss.length>12?`<br>…and ${miss.length-12} more.`:""}</div>`
        : ""}
    </main>
  </div>
  <div class="foot">
    <span>Confidential. Please do not forward this link.</span>
    <button id="adminbtn">Practice access</button>
  </div>`;
  bindForm();
}

function qHTML(q){
  const bad = showErrors && q.req && !answered(q);
  const v = answers[q.id];
  let body = "";

  if(q.type==="text" || q.type==="num"){
    const inp = `<input type="${q.type==="num"?"number":"text"}" data-q="${q.id}" value="${esc(v||"")}" ${q.type==="num"?'inputmode="decimal"':""}>`;
    body = q.unit ? `<div class="unit"><span>${esc(q.unit)}</span>${inp}</div>` : inp;
  }
  else if(q.type==="long"){
    body = `<textarea data-q="${q.id}" class="${q.big?"big":""}">${esc(v||"")}</textarea>`;
  }
  else if(q.type==="radio"){
    body = q.opts.map(o=>`<label class="opt ${v===o?"sel":""}">
      <input type="radio" name="${q.id}" data-q="${q.id}" data-val="${esc(o)}" ${v===o?"checked":""}><span>${esc(o)}</span></label>`).join("");
  }
  else if(q.type==="check"){
    const arr = Array.isArray(v)?v:[];
    body = q.opts.map(o=>`<label class="opt ${arr.includes(o)?"sel":""}">
      <input type="checkbox" data-q="${q.id}" data-val="${esc(o)}" ${arr.includes(o)?"checked":""}><span>${esc(o)}</span></label>`).join("");
  }
  else if(q.type==="grid"){
    const obj = (v&&typeof v==="object")?v:{};
    if(q.grid==="pct"){
      const tot = pctTotal(obj);
      body = `<table class="grid">${q.rows.map(r=>`<tr><td class="rl">${esc(r)}</td>
        <td style="width:110px"><input type="number" data-gq="${q.id}" data-row="${esc(r)}" value="${esc(obj[r]||"")}" inputmode="decimal"> %</td></tr>`).join("")}
        <tr><td class="rl" style="color:var(--muted)">Total</td>
            <td class="gtotal ${pctOff(tot)?"over":""}" data-total="${q.id}">${tot}%</td></tr></table>`;
    } else {
      body = `<table class="grid"><tr><th></th>${q.cols.map(c=>`<th>${esc(c)}</th>`).join("")}</tr>
        ${q.rows.map(r=>`<tr><td class="rl">${esc(r)}</td>${q.cols.map(c=>
          `<td><input type="radio" name="${q.id}::${r}" data-gq="${q.id}" data-row="${esc(r)}" data-val="${esc(c)}" ${obj[r]===c?"checked":""}></td>`).join("")}</tr>`).join("")}
        </table>`;
    }
  }

  return `<div class="q ${q.req?"req":""} ${bad?"err":""}">
    <p class="qt"><span class="qid">${esc(q.id)}</span>${esc(q.t)}${q.req?`<span class="reqtag">required</span>`:""}</p>
    ${q.help?`<p class="qh">${esc(q.help)}</p>`:""}
    ${body}
    ${bad?`<p class="errtag">This one is needed before the plan can be built.</p>`:""}
  </div>`;
}

function pctTotal(obj){ return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0); }
function pctOff(t){ return t>103 || (t>0 && t<97); }

/* ------------------------- events ------------------------- */
let saveTimer=null;
function queueSave(){
  saveState = "Saving…"; paintSave();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async ()=>{
    const ok = await push("draft");
    saveState = ok ? "Draft saved" : "Not saving — check the connection";
    paintSave();
  }, 2500);
}
function paintSave(){ const el=document.querySelector(".savenote"); if(el) el.textContent=saveState; }

function bindForm(){
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{ cur=+b.dataset.go; showErrors=false; render(); window.scrollTo(0,0); });
  const msel=document.getElementById("msel");
  if(msel) msel.onchange=e=>{ cur=+e.target.value; showErrors=false; render(); window.scrollTo(0,0); };

  document.querySelectorAll("input[data-q], textarea[data-q]").forEach(el=>{
    if(el.type==="radio"){
      el.onchange=()=>{ answers[el.dataset.q]=el.dataset.val; queueSave(); render(); };
    } else if(el.type==="checkbox"){
      el.onchange=()=>{
        const k=el.dataset.q; const arr=Array.isArray(answers[k])?[...answers[k]]:[];
        const val=el.dataset.val; const i=arr.indexOf(val);
        if(el.checked && i<0) arr.push(val); if(!el.checked && i>=0) arr.splice(i,1);
        answers[k]=arr; queueSave(); render();
      };
    } else {
      el.oninput=()=>{ answers[el.dataset.q]=el.value; queueSave(); };
    }
  });

  document.querySelectorAll("[data-gq]").forEach(el=>{
    const k=el.dataset.gq, row=el.dataset.row;
    const set=val=>{ const o={...(answers[k]||{})}; o[row]=val; answers[k]=o; queueSave(); };
    if(el.type==="radio"){
      el.onchange=()=>{ set(el.dataset.val); render(); };
    } else {
      // Numeric grid: update the running total in place rather than
      // re-rendering, so the cursor stays in the field being typed in.
      el.oninput=()=>{
        set(el.value);
        const cell=document.querySelector(`[data-total="${k}"]`);
        if(cell){
          const tot=pctTotal(answers[k]);
          cell.textContent=tot+"%";
          cell.classList.toggle("over", pctOff(tot));
        }
      };
    }
  });

  const sb=document.getElementById("submit");
  if(sb) sb.onclick=submit;
  document.getElementById("copy").onclick=copyAll;
  document.getElementById("adminbtn").onclick=askAdmin;
}

function plainText(a=answers, meta=null){
  let out = "ETS INVESTMENTS — ADVISORY PRACTICE INTAKE\n";
  if(meta) out += "Submitted: " + new Date(meta).toLocaleString() + "\n";
  out += "=".repeat(58) + "\n\n";
  SECTIONS.forEach((s,i)=>{
    out += `${i+1}. ${s.title.toUpperCase()} — ${s.sub||""}\n${"-".repeat(50)}\n`;
    s.qs.forEach(q=>{
      const v=a[q.id];
      let str="(not answered)";
      if(Array.isArray(v)&&v.length) str=v.map(x=>"• "+x).join("\n   ");
      else if(v&&typeof v==="object") str=Object.entries(v).filter(([,x])=>x!==""&&x!=null).map(([k2,x])=>`${k2}: ${x}${q.grid==="pct"?"%":""}`).join("\n   ");
      else if(v!=null&&String(v).trim()!=="") str=String(v);
      out += `${q.id} ${q.t}\n   ${str}\n\n`;
    });
  });
  return out;
}

function copyAll(){
  const t=plainText();
  navigator.clipboard.writeText(t).then(
    ()=>{ saveState="Answers copied to clipboard"; paintSave(); },
    ()=>{ saveState="Copy failed — select the text manually"; paintSave(); }
  );
}

async function submit(){
  const miss=missing();
  if(miss.length){
    showErrors=true; render(); window.scrollTo(0,0);
    return;
  }
  const sb=document.getElementById("submit");
  if(sb){ sb.disabled=true; sb.textContent="Sending…"; }
  clearTimeout(saveTimer);          // don't let a queued draft land after the final
  await push("final");
  mode="done"; render(); window.scrollTo(0,0);
}

function doneHTML(){
  return `<div class="done">
    <h2>Received. Thank you.</h2>
    <p class="sub" style="font-size:16px; max-width:56ch">Your answers have been sent through. Sahil will come back with the structured plan — entity route, registration path, client acquisition model, content system and the 24-month financial picture.</p>
    ${!storageOK?`<div class="warn">The answers did not reach the response sheet. Please use the button below and send the text to Sahil directly.</div>`:""}
    <div class="bar" style="border:0; padding-top:0">
      <button class="b pri" id="copy2">Copy a personal copy of your answers</button>
      <button class="b sec" id="back">Go back and edit</button>
    </div>
    <p style="font-size:13px;color:var(--muted);margin-top:26px">If you remembered something afterwards, reopen this link, edit, and send again. A second submission does not overwrite the first.</p>
  </div>`;
}
function bindDone(){
  document.getElementById("copy2").onclick=copyAll;
  document.getElementById("back").onclick=()=>{ mode="form"; cur=0; render(); };
}

/* ------------------------- admin ------------------------- */
function askAdmin(){
  const p=prompt("Passcode");
  if(p===null || !p) return;
  loadSubs(p);
}
async function loadSubs(pass){
  const r = await pull({key:pass});
  if(!r || !r.ok){
    alert(r && r.error === "unauthorized"
      ? "Wrong passcode."
      : "Could not reach the response sheet. Check that API_URL is set in assets/config.js and the deployment access is 'Anyone'.");
    return;
  }
  subs = (r.records||[]).map(x=>({answers:x.answers||{}, ts:x.ts, draft:x.status!=="SUBMITTED"}));
  mode="admin"; render(); window.scrollTo(0,0);
}
function adminHTML(){
  if(!subs.length){
    return `<div class="done"><h2>No responses yet</h2>
      <p class="sub">Nothing has been submitted, and no draft is in progress. Once Lucky starts filling the form, his partial answers will appear here too.</p>
      <div class="bar" style="border:0"><button class="b sec" id="exit">Back to the form</button></div></div>`;
  }
  return `<div class="main" style="max-width:860px; margin:0 auto">
    <div class="adminhead">
      <h2 style="margin:0">Responses</h2>
      <span class="sub" style="margin:0">${subs.length} record${subs.length>1?"s":""}</span>
      <button class="b sec" id="exit" style="margin-left:auto">Back to the form</button>
    </div>
    ${subs.map((r,i)=>`<div class="arec">
      <h3>${r.draft?"Draft in progress":"Submitted"} — ${esc(new Date(r.ts).toLocaleString())}</h3>
      <div class="bar" style="border:0; padding:0; margin:0 0 14px">
        <button class="b sec" data-copy="${i}">Copy as text</button>
        <button class="b sec" data-csv="${i}">Download CSV</button>
      </div>
      ${SECTIONS.map(s=>`
        <p style="font-family:'Source Serif 4',serif;font-weight:600;margin:20px 0 6px;font-size:15px">${esc(s.title)}</p>
        ${s.qs.map(q=>{
          const v=r.answers[q.id];
          let str="", empty=false;
          if(Array.isArray(v)&&v.length) str=v.join(" · ");
          else if(v&&typeof v==="object") str=Object.entries(v).filter(([,x])=>x!==""&&x!=null).map(([k,x])=>`${k}: ${x}`).join(" · ");
          else if(v!=null&&String(v).trim()!=="") str=String(v);
          else { str="not answered"; empty=true; }
          return `<div class="arow"><div class="ak">${esc(q.id)} · ${esc(q.t)}</div><div class="av ${empty?"empty":""}">${esc(str)}</div></div>`;
        }).join("")}
      `).join("")}
    </div>`).join("")}
  </div>
  <div class="foot"><span>Confidential client data.</span></div>`;
}
function bindAdmin(){
  const ex=document.getElementById("exit");
  if(ex) ex.onclick=()=>{ mode="form"; render(); };
  document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>{
    const r=subs[+b.dataset.copy];
    const done=(msg)=>{ b.textContent=msg; setTimeout(()=>b.textContent="Copy as text",2200); };
    navigator.clipboard.writeText(plainText(r.answers, r.ts)).then(
      ()=>done("Copied"),
      ()=>done("Copy blocked — use CSV")
    );
  });
  document.querySelectorAll("[data-csv]").forEach(b=>b.onclick=()=>{
    const r=subs[+b.dataset.csv];
    const rows=[["Section","ID","Question","Answer"]];
    SECTIONS.forEach(s=>s.qs.forEach(q=>{
      const v=r.answers[q.id]; let str="";
      if(Array.isArray(v)) str=v.join(" | ");
      else if(v&&typeof v==="object") str=Object.entries(v).map(([k,x])=>`${k}: ${x}`).join(" | ");
      else str=v==null?"":String(v);
      rows.push([s.title,q.id,q.t,str]);
    }));
    const csv="﻿"+rows.map(r2=>r2.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="ets-intake-"+new Date(r.ts).toISOString().slice(0,10)+".csv";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  });
}

/* ------------------------- boot ------------------------- */
(async function(){
  const hash = (location.hash||"").match(/s=([A-Za-z0-9]+)/);
  if(hash){
    sid = hash[1];
    const r = await pull({sid});
    if(r && r.ok && r.answers){
      answers = r.answers;
      saveState = r.status==="SUBMITTED"
        ? "Already submitted — you can edit and send again"
        : "Draft restored";
    }
  } else {
    sid = newSid();
    try{ history.replaceState(null,"","#s="+sid); }catch(e){}
  }
  if(!apiReady()) storageOK = false;
  render();
})();
