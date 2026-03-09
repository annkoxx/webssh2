let term=null,fitAddon=null,ws=null,currentSSHInfo='',heartbeatTimer=null,sysInfoTimer=null,resizeObs=null;

// ==================== Particles ====================
(function(){
    const c=document.getElementById('particles');if(!c)return;const x=c.getContext('2d');let p=[],m={x:null,y:null};
    function rs(){c.width=innerWidth;c.height=innerHeight}rs();addEventListener('resize',rs);
    document.addEventListener('mousemove',e=>{m.x=e.clientX;m.y=e.clientY});
    class P{constructor(){this.r()}r(){this.x=Math.random()*c.width;this.y=Math.random()*c.height;this.s=Math.random()*2+.5;this.sx=(Math.random()-.5)*.5;this.sy=(Math.random()-.5)*.5;this.o=Math.random()*.5+.1;this.h=Math.random()*60+180}u(){this.x+=this.sx;this.y+=this.sy;if(m.x!==null){const dx=m.x-this.x,dy=m.y-this.y,d=Math.sqrt(dx*dx+dy*dy);if(d<150){const f=(150-d)/150;this.x-=dx*f*.01;this.y-=dy*f*.01}}if(this.x<0||this.x>c.width)this.sx*=-1;if(this.y<0||this.y>c.height)this.sy*=-1}d(){x.beginPath();x.arc(this.x,this.y,this.s,0,Math.PI*2);x.fillStyle=`hsla(${this.h},80%,60%,${this.o})`;x.fill()}}
    const n=Math.min(50,Math.floor(innerWidth*innerHeight/22000));for(let i=0;i<n;i++)p.push(new P);
    (function a(){x.clearRect(0,0,c.width,c.height);p.forEach(q=>{q.u();q.d()});for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const dx=p[i].x-p[j].x,dy=p[i].y-p[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){x.beginPath();x.moveTo(p[i].x,p[i].y);x.lineTo(p[j].x,p[j].y);x.strokeStyle=`rgba(0,212,255,${(1-d/120)*.15})`;x.lineWidth=.5;x.stroke()}}requestAnimationFrame(a)})();
})();

// ==================== Util ====================
document.querySelector('.btn-connect')?.addEventListener('click',function(e){const r=this.querySelector('.btn-ripple'),b=this.getBoundingClientRect(),s=Math.max(b.width,b.height);r.style.width=r.style.height=s+'px';r.style.left=(e.clientX-b.left-s/2)+'px';r.style.top=(e.clientY-b.top-s/2)+'px';r.classList.remove('active');void r.offsetWidth;r.classList.add('active')});
function switchAuthTab(t){document.querySelectorAll('.auth-tab').forEach(e=>e.classList.remove('active'));document.querySelectorAll('.auth-panel').forEach(e=>e.classList.remove('active'));document.querySelector(`[data-tab="${t}"]`).classList.add('active');document.getElementById(t==='password'?'passwordAuth':'keyAuth').classList.add('active')}
function togglePassword(){const i=document.getElementById('password');i.type=i.type==='password'?'text':'password'}
function showToast(m,t='info'){const c=document.getElementById('toastContainer'),ic={success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'};const d=document.createElement('div');d.className=`toast ${t}`;d.innerHTML=`${ic[t]||ic.info}<span>${m}</span>`;c.appendChild(d);setTimeout(()=>{d.classList.add('removing');setTimeout(()=>d.remove(),300)},3000)}
function setStatus(s,t){const e=document.getElementById('statusIndicator');e.className=`status-indicator ${s}`;e.querySelector('.status-text').textContent=t}
function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active')}
function fmtB(b){b=parseInt(b)||0;if(!b)return'0B';const u=['B','KB','MB','GB','TB'],i=Math.floor(Math.log(b)/Math.log(1024));return(b/Math.pow(1024,i)).toFixed(i>1?1:0)+u[i]}
function pct(u,t){return Math.round((parseInt(u)||0)/(parseInt(t)||1)*100)}
function pillCls(v){return v>=90?'danger':v>=70?'warn':''}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

// ==================== Drawers ====================
function toggleConnDrawer(){document.getElementById('connDrawer').classList.toggle('open')}
function toggleScriptDrawer(){const d=document.getElementById('scriptDrawer');d.classList.toggle('open');setTimeout(()=>fitTerm(),350)}
function toggleSftp(){const p=document.getElementById('sftpPanel');const wasOpen=p.classList.contains('open');p.classList.toggle('open');if(!wasOpen){sftpLoad(document.getElementById('sftpPath').value||'/')}setTimeout(()=>fitTerm(),350)}

// ==================== System Info ====================
function fetchSysInfo(){if(!currentSSHInfo)return;fetch(`/sysinfo?sshInfo=${encodeURIComponent(currentSSHInfo)}`).then(r=>r.json()).then(d=>{if(d.Msg==='success'&&d.Data)renderMetrics(d.Data)}).catch(()=>{})}
function renderMetrics(d){const c=document.getElementById('topbarMetrics'),mp=pct(d.memUsed,d.memTotal),dp=pct(d.diskUsed,d.diskTotal),cv=parseFloat(d.cpuUsage)||0;
const pills=[{i:'server',l:d.os||'?'},{i:'cpu',l:d.arch,v:(d.cpuCores||'?')+'C'},{i:'activity',l:'CPU',v:cv.toFixed(0)+'%',c:pillCls(cv)},{i:'memory',l:'MEM',v:fmtB(d.memUsed)+'/'+fmtB(d.memTotal),c:pillCls(mp)},{i:'hdd',l:'DISK',v:fmtB(d.diskUsed)+'/'+fmtB(d.diskTotal),c:pillCls(dp)},{i:'zap',l:'Load',v:d.load||'0'}];
const sv={server:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>',cpu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>',activity:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',memory:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg>',hdd:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>',zap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'};
c.innerHTML=pills.map(p=>`<div class="metric-pill${p.c?' '+p.c:''}">${sv[p.i]||''}${p.l}${p.v?' <span class="metric-value">'+p.v+'</span>':''}</div>`).join('')}
function startSysInfo(){fetchSysInfo();sysInfoTimer=setInterval(fetchSysInfo,60000)}
function stopSysInfo(){if(sysInfoTimer){clearInterval(sysInfoTimer);sysInfoTimer=null}}

// ==================== Terminal ====================
function buildSSHInfo(){const at=document.querySelector('.auth-tab.active').dataset.tab;const i={hostname:document.getElementById('hostname').value.trim(),port:parseInt(document.getElementById('port').value)||22,username:document.getElementById('username').value.trim(),logintype:at==='key'?1:0};if(at==='password')i.password=document.getElementById('password').value;else{i.privateKey=document.getElementById('privateKey').value;i.passphrase=document.getElementById('passphrase').value}return btoa(unescape(encodeURIComponent(JSON.stringify(i))))}

function fitTerm(){if(fitAddon&&term)try{fitAddon.fit()}catch(e){}}

function initTerminal(){if(term){term.dispose();term=null}
term=new Terminal({cursorBlink:true,cursorStyle:'bar',fontSize:window.innerWidth<=520?13:15,fontFamily:"'JetBrains Mono','Fira Code','Cascadia Code',Consolas,monospace",theme:{background:'rgba(10,10,26,0)',foreground:'#e8e8f0',cursor:'#00d4ff',cursorAccent:'#0a0a1a',selectionBackground:'rgba(0,212,255,.25)',black:'#1a1a2e',red:'#ff006e',green:'#00ff88',yellow:'#ffbe0b',blue:'#00d4ff',magenta:'#7b2ff7',cyan:'#00d4ff',white:'#e8e8f0',brightBlack:'#3a3a5e',brightRed:'#ff4488',brightGreen:'#33ffaa',brightYellow:'#ffdd33',brightBlue:'#33ddff',brightMagenta:'#9955ff',brightCyan:'#33ddff',brightWhite:'#fff'},allowTransparency:true,scrollback:10000});
fitAddon=new FitAddon.FitAddon();term.loadAddon(fitAddon);term.loadAddon(new WebLinksAddon.WebLinksAddon());
const el=document.getElementById('terminal');el.innerHTML='';term.open(el);
if(resizeObs)resizeObs.disconnect();
resizeObs=new ResizeObserver(()=>fitTerm());
resizeObs.observe(el);
setTimeout(fitTerm,100)}

function connect(){const btn=document.getElementById('connectBtn');btn.classList.add('loading');setStatus('connecting','连接中...');
currentSSHInfo=buildSSHInfo();initTerminal();
const cols=term.cols,rows=term.rows;
const proto=location.protocol==='https:'?'wss:':'ws:';
ws=new WebSocket(`${proto}//${location.host}/term?cols=${cols}&rows=${rows}`);
let got=false;
ws.onopen=()=>{ws.send(currentSSHInfo)};
ws.onmessage=e=>{if(!got){got=true;btn.classList.remove('loading');setStatus('','已连接');
document.getElementById('topbarUser').textContent=`${document.getElementById('username').value.trim()}@${document.getElementById('hostname').value.trim()}`;
document.getElementById('topbarMetrics').innerHTML='';
showView('terminalView');showToast('连接成功','success');
setTimeout(()=>{fitTerm();term.focus()},200);
heartbeatTimer=setInterval(()=>{if(ws&&ws.readyState===1)ws.send('ping')},30000);
if(document.getElementById('enableSysInfo').checked)startSysInfo();
renderScriptBookmarks()}term.write(e.data)};
ws.onerror=()=>{btn.classList.remove('loading');setStatus('error','连接失败');showToast('连接失败','error')};
ws.onclose=()=>{btn.classList.remove('loading');if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null}stopSysInfo();if(!got)showToast('无法连接','error')};
term.onData(d=>{if(ws&&ws.readyState===1)ws.send(d)});
addEventListener('resize',()=>{fitTerm();if(ws&&ws.readyState===1&&term)ws.send(`resize:${term.rows}:${term.cols}`)})}

function disconnect(){if(ws){ws.close();ws=null}if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null}stopSysInfo();if(resizeObs){resizeObs.disconnect();resizeObs=null}if(term){term.dispose();term=null}
document.getElementById('scriptDrawer').classList.remove('open');document.getElementById('sftpPanel').classList.remove('open');
showView('loginView');setStatus('','就绪');showToast('已断开','info')}

function reconnect(){if(ws){ws.close();ws=null}if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null}stopSysInfo();showToast('重新连接...','info');setTimeout(connect,300)}

document.getElementById('loginForm').addEventListener('submit',e=>{e.preventDefault();if(!document.getElementById('hostname').value.trim()){showToast('请输入主机','error');return}if(!document.getElementById('username').value.trim()){showToast('请输入用户名','error');return}connect()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('terminalView').classList.contains('active'))disconnect()});

// ==================== Connection Bookmarks ====================
const CBK='webssh_conn_bm',SBK='webssh_script_bm';
function loadBM(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}}
function saveBM(k,v){localStorage.setItem(k,JSON.stringify(v))}

function renderConnBookmarks(){const l=document.getElementById('connBookmarkList'),bms=loadBM(CBK);
if(!bms.length){l.innerHTML='<div class="bm-empty">暂无书签</div>';return}
l.innerHTML=bms.map((b,i)=>`<div class="bm-item" onclick="applyConn(${i})"><div class="bm-item-info"><div class="bm-item-name">${esc(b.username+'@'+b.hostname)}</div><div class="bm-item-host">:${b.port||22}</div></div><button class="bm-item-del" onclick="event.stopPropagation();delConn(${i})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('')}

function saveConnBookmark(){const h=document.getElementById('hostname').value.trim(),u=document.getElementById('username').value.trim(),p=parseInt(document.getElementById('port').value)||22;
if(!h||!u){showToast('请先填写连接信息','error');return}
const at=document.querySelector('.auth-tab.active').dataset.tab;
const bm={hostname:h,port:p,username:u,authType:at};
if(at==='password')bm.password=document.getElementById('password').value;
const bms=loadBM(CBK),idx=bms.findIndex(b=>b.hostname===h&&b.port===p&&b.username===u);
if(idx>=0)bms[idx]=bm;else bms.push(bm);
saveBM(CBK,bms);renderConnBookmarks();showToast('已保存','success')}

function applyConn(i){const b=loadBM(CBK)[i];if(!b)return;
document.getElementById('hostname').value=b.hostname||'';document.getElementById('port').value=b.port||22;document.getElementById('username').value=b.username||'';
if(b.authType==='key')switchAuthTab('key');else{switchAuthTab('password');if(b.password)document.getElementById('password').value=b.password}
showToast('已填入','info')}
function delConn(i){const bms=loadBM(CBK);bms.splice(i,1);saveBM(CBK,bms);renderConnBookmarks();showToast('已删除','info')}

// ==================== Script Bookmarks ====================
function renderScriptBookmarks(){const l=document.getElementById('scriptBookmarkList'),bms=loadBM(SBK);
if(!bms.length){l.innerHTML='<div class="bm-empty">暂无脚本</div>';return}
l.innerHTML=bms.map((b,i)=>`<div class="bm-item" onclick="runScript(${i})" title="${esc(b.cmd)}"><div class="bm-item-info"><div class="bm-item-name">${esc(b.name)}</div><div class="bm-item-host">${esc(b.cmd.substring(0,40))}${b.cmd.length>40?'...':''}</div></div><span class="bm-item-run">▶</span><button class="bm-item-del" onclick="event.stopPropagation();delScript(${i})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('')}

function saveScriptBookmark(){const n=document.getElementById('scriptName').value.trim(),c=document.getElementById('scriptContent').value.trim();
if(!n||!c){showToast('名称和命令不能为空','error');return}
const bms=loadBM(SBK);bms.push({name:n,cmd:c});saveBM(SBK,bms);
document.getElementById('scriptName').value='';document.getElementById('scriptContent').value='';
renderScriptBookmarks();showToast('脚本已保存','success')}

function runScript(i){const b=loadBM(SBK)[i];if(!b||!ws||ws.readyState!==1)return;
ws.send(b.cmd+'\n');showToast('已执行: '+b.name,'success');term?.focus()}
function delScript(i){const bms=loadBM(SBK);bms.splice(i,1);saveBM(SBK,bms);renderScriptBookmarks();showToast('已删除','info')}

// ==================== SFTP ====================
let sftpCurrentPath='/';
function sftpLoad(path){if(!currentSSHInfo)return;
sftpCurrentPath=path;document.getElementById('sftpPath').value=path;
document.getElementById('sftpBody').innerHTML='<div class="sftp-loading">加载中...</div>';
fetch(`/file/list?sshInfo=${encodeURIComponent(currentSSHInfo)}&path=${encodeURIComponent(path)}`).then(r=>r.json()).then(d=>{
if(d.Msg!=='success'){document.getElementById('sftpBody').innerHTML=`<div class="sftp-loading" style="color:var(--err)">${esc(d.Msg)}</div>`;return}
const list=d.Data?.list||[];
if(!list.length){document.getElementById('sftpBody').innerHTML='<div class="sftp-loading">空目录</div>';return}
document.getElementById('sftpBody').innerHTML=list.map(f=>{
const isDir=f.IsDir;
const icon=isDir?'<svg class="sftp-icon dir" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>':'<svg class="sftp-icon file" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>';
const fp=(path==='/'?'/':path+'/')+f.Name;
const click=isDir?`onclick="sftpLoad('${fp.replace(/'/g,"\\'")}')"`:`onclick="sftpDownload('${fp.replace(/'/g,"\\'")}')"`; 
const dl=isDir?'':'<button class="sftp-dl" onclick="event.stopPropagation();sftpDownload(\''+fp.replace(/'/g,"\\'")+'\')" title="下载"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></button>';
return `<div class="sftp-row" ${click}>${icon}<span class="sftp-name">${esc(f.Name)}</span><span class="sftp-meta">${f.Size}</span>${dl}</div>`}).join('')
}).catch(e=>{document.getElementById('sftpBody').innerHTML=`<div class="sftp-loading" style="color:var(--err)">加载失败</div>`})}

function sftpGo(){sftpLoad(document.getElementById('sftpPath').value.trim()||'/')}
function sftpUp(){let p=sftpCurrentPath.replace(/\/$/,'');const i=p.lastIndexOf('/');sftpLoad(i<=0?'/':p.substring(0,i))}
function sftpDownload(path){if(!currentSSHInfo)return;window.open(`/file/download?sshInfo=${encodeURIComponent(currentSSHInfo)}&path=${encodeURIComponent(path)}`,'_blank')}
function sftpUpload(){const input=document.getElementById('sftpUploadInput');if(!input.files.length||!currentSSHInfo)return;
Array.from(input.files).forEach(f=>{const fd=new FormData();fd.append('file',f);fd.append('sshInfo',currentSSHInfo);fd.append('path',sftpCurrentPath);fd.append('id',Date.now().toString());
fetch('/file/upload',{method:'POST',body:fd}).then(r=>r.json()).then(d=>{if(d.Msg==='success'){showToast('上传成功: '+f.name,'success');sftpLoad(sftpCurrentPath)}else showToast('上传失败: '+d.Msg,'error')}).catch(()=>showToast('上传失败','error'))});
input.value=''}

document.getElementById('sftpPath').addEventListener('keydown',e=>{if(e.key==='Enter')sftpGo()});

// ==================== Init ====================
renderConnBookmarks();
