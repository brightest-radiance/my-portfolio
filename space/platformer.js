/* Star Run: 2D platformer. Levels 1-19 use fixed seeds on a curated difficulty curve; from level 20 every run gets a fresh random seed.
   Every segment stays inside the jump limits (gaps up to 4 tiles, steps of 1 tile, pipes up to 3 tiles), so every generated level is beatable. */
export default function(root,api){
const TS=16,VW=320,VH=192,GY=10,STEP=1/120,cl=(v,a,b)=>Math.min(b,Math.max(a,v));
const cv=document.createElement('canvas');cv.width=VW;cv.height=VH;
cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;background:#000';
const X=cv.getContext('2d');
const ui=document.createElement('div');ui.style.cssText='position:absolute;inset:0;pointer-events:none';
ui.innerHTML=`<style>.tb{position:absolute;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);width:64px;height:64px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(20,21,23,.55);color:#fff;font:700 16px system-ui;display:grid;place-items:center;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none}</style><button class="bt" data-a="pause" type="button" style="pointer-events:auto;position:absolute;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px;margin:0">Pause</button><div class="ov" style="display:none;pointer-events:auto"></div><div class="tc" style="display:none"><b class="tb" data-t="l" style="left:14px">◀</b><b class="tb" data-t="r" style="left:88px">▶</b><b class="tb" data-t="n" style="right:96px;width:52px;height:52px">Run</b><b class="tb" data-t="j" style="right:14px">Jump</b></div>`;
root.append(cv,ui);
const ov=ui.querySelector('.ov'),tc=ui.querySelector('.tc');

const TH=[{a:'#5aa8ff',b:'#cfe9ff',g:'#b5702f',t:'#3f9e3e',h:'#4aa84a',k:'#c86a2a'},{a:'#07080d',b:'#18202c',g:'#2d4a63',t:'#4d7aa0',h:'#101a26',k:'#3a5f80'},{a:'#0a1030',b:'#2c3d80',g:'#3a3f66',t:'#6a72b8',h:'#17204a',k:'#5a5fa0'},{a:'#3a0f1a',b:'#ff8a3c',g:'#5a2d2d',t:'#a8442c',h:'#2a1015',k:'#8a4a3a'}];
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
let lv=1,ti=0,st='title',g=[],W=0,en=[],co=[],fx=[],flagX=0,p={},cx=0,time=0,tmax=240,score=0,coins=0,lives=3,stomped=0,bonus=0,anim=0,acc=0,last=performance.now(),raf=0,seed=0,th=TH[0],jb=0,paused=false,stars=[];
const keys={},T={},tos=[],later=(f,ms)=>tos.push(setTimeout(f,ms)),qs=+new URLSearchParams(location.search).get('lv')||0,reached=()=>Math.max(api.get('reached')||1,qs);
if(qs)lv=qs;
const solid=(x,y)=>x<0||x>=W||(y>=0&&y<12&&g[y][x]!==' ');

/* physics: axis-separated tile collision */
function move(o,dt){
 o.hx=0;o.bc=-1;
 const dx=o.vx*dt;o.x+=dx;
 for(let y=Math.floor(o.y/TS),y1=Math.floor((o.y+o.h-.01)/TS);y<=y1;y++)for(let x=Math.floor(o.x/TS),x1=Math.floor((o.x+o.w-.01)/TS);x<=x1;x++)if(solid(x,y)){o.x=dx>0?x*TS-o.w:(x+1)*TS;o.hx=1;o.vx=0}
 const dy=o.vy*dt;o.y+=dy;o.on=false;const pc=o.x+o.w/2;let ny=null;
 for(let y=Math.floor(o.y/TS),y1=Math.floor((o.y+o.h-.01)/TS);y<=y1;y++)for(let x=Math.floor(o.x/TS),x1=Math.floor((o.x+o.w-.01)/TS);x<=x1;x++)if(solid(x,y)){
  if(dy>=0){const n=y*TS-o.h;ny=ny===null?n:Math.min(ny,n);o.on=true}
  else{const n=(y+1)*TS;ny=ny===null?n:Math.max(ny,n);if(o.bc<0||Math.abs(x*TS+8-pc)<Math.abs(o.bc*TS+8-pc)){o.bc=x;o.br=y}}}
 if(ny!==null){o.y=ny;o.vy=0}}

/* level generator */
function gen(){
 const r=rng(seed),d=Math.min(lv/28,1),tut=lv===1,N=140+Math.min(lv,28)*4;
 g=Array.from({length:12},()=>Array(N+80).fill(' '));en=[];co=[];stars=[...Array(40)].map(()=>[r()*VW,r()*110,r()]);
 const put=(x,y,ch)=>{if(y>=0&&y<12)g[y][x]=ch},gr=(x,top=GY)=>{for(let y=top;y<12;y++)put(x,y,'#')},cr=(x0,n,y)=>{for(let i=0;i<n;i++)co.push({x:(x0+i)*TS+8,y:y*TS+8,got:0})};
 let x=0;const flat=n=>{const x0=x;for(let i=0;i<n;i++)gr(x++);return x0};
 const foe=(c0,y)=>en.push({x:c0*TS,y:y*TS,w:14,h:14,vx:0,vy:0,k:0,t:0,dr:-1,sp:26+d*26*r()});
 flat(10);
 while(x<N){
  const q=r();
  if(q<.3){const n=4+(r()*6|0),x0=flat(n);
   if(n>=5&&r()<.65){const b0=x0+1+(r()*(n-4)|0);for(let i=0,k=1+(r()*3|0);i<k;i++)put(b0+i,GY-4,r()<.55?'?':'B')}else cr(x0+1,Math.min(n-2,4),GY-2);
   if(n>=6&&!(tut&&x<40)&&r()<.25+d*.55)foe(x0+3+(r()*(n-5)|0),GY-1)}
  else if(q<.5){const n=tut?2:2+(r()*(1+d*2.99)|0),x0=x;x+=n;cr(x0,n,GY-3);flat(3)}
  else if(q<.64){const h=tut?2:2+(r()*2|0);for(let i=0;i<2;i++){gr(x+i);for(let y=GY-h;y<GY;y++)put(x+i,y,'P')}x+=2;flat(3)}
  else if(q<.76&&lv>2){const n=2+(r()*(1+d*2)|0);for(let i=1;i<=n;i++)gr(x++,GY-i);gr(x++,GY-n);gr(x++,GY-n);for(let i=n;i>=1;i--)gr(x++,GY-i);flat(2);if(r()<.5+d*.3)foe(x-2,GY-1)}
  else if(q<.9&&lv>3){const n=2+(r()*(1+d*2)|0),w=d>.5?2:3;let row=GY-2;x+=2;for(let i=0;i<n;i++){for(let j=0;j<w;j++)put(x+j,row,'B');if(r()<.5)cr(x,w,row-2);x+=w+2+(r()*2|0);row=cl(row+(r()<.5?-1:1),GY-3,GY-2)}flat(3)}
  else flat(3+(r()*3|0))}
 flat(4);for(let i=1;i<=4;i++)gr(x++,GY-i);gr(x,GY-4);flagX=x*TS+TS/2;x++;flat(6);W=x}
function load(ns){if(ns)seed=lv<20?lv*7919+13:Math.random()*1e9|0;ti=(lv-1>>2)%4;th=TH[ti];gen();p={x:2*TS,y:GY*TS-14,w:12,h:14,vx:0,vy:0,on:true,f:1,cy:0};cx=0;fx=[];stomped=0;tmax=Math.max(120,240-lv*4);time=tmax}

/* flow */
const show=h=>{ov.innerHTML=h?`<div>${h}</div>`:'';ov.style.display=h?'grid':'none'};
const J=()=>keys.ArrowUp||keys.KeyW||keys.Space||keys.KeyZ||T.j,Lf=()=>keys.ArrowLeft||keys.KeyA||T.l,Rt=()=>keys.ArrowRight||keys.KeyD||T.r,RN=()=>keys.ShiftLeft||keys.ShiftRight||keys.KeyX||T.n;
function title(){load(1);st='title';paused=false;const rc=reached();api.music('run');
 show(`<h3>Star Run</h3><p>Level <b>${lv}</b>${rc>1?' (furthest: '+rc+')':''}</p><p>${lv>=20?'Generated level. New seed every run.':'Curated world. Same every time.'}</p><p>Arrows or A/D move. Space or W jumps. Hold Shift to run. Stomp enemies from above and bump ? blocks from below.</p><div class="row"><button class="bt pri" data-a="go" type="button">Start level ${lv}</button>${rc>1?'<button class="bt" data-a="prev" type="button">◀ Level</button><button class="bt" data-a="next" type="button">Level ▶</button>':''}</div>${api.strip()}`)}
function go(){if(st==='over'){lives=3;score=0;load(0)}if(lv>=10)api.unlock('l10');if(lv>=20)api.unlock('l20');st='play';paused=false;time=tmax;show('');api.music('run')}
function pause(on){if(st!=='play')return;paused=on;show(on?`<h3>Paused</h3><div class="row"><button class="bt pri" data-a="res" type="button">Resume</button><button class="bt" data-a="menu" type="button">Level select</button><button class="bt" data-a="exit" type="button">Exit</button></div>${api.strip()}`:'')}
function die(w){if(st!=='play')return;st='dead';p.vy=-250;p.vx=0;lives--;api.add('skill');api.sfx('die');api.music(null);if(w==='pit')api.unlock('pit');
 later(()=>{if(st!=='dead')return;if(lives>0){load(0);go()}else{st='over';show(`<h3>Game over</h3><p>Score <b>${score.toLocaleString()}</b></p><p>Reached level ${lv}</p><div class="row"><button class="bt pri" data-a="go" type="button">Try level ${lv} again</button><button class="bt" data-a="menu" type="button">Level select</button><button class="bt" data-a="exit" type="button">Exit</button></div>`)}},1700)}
function win(){if(st!=='play')return;st='clear';api.music(null);api.sfx('win');bonus=Math.floor(time)*5;score+=bonus;api.unlock('flag');if(lv>=20)api.unlock('gen');if(!stomped&&en.length>=3)api.unlock('pac');
 api.put('reached',Math.max(api.get('reached'),lv+1));api.best('platformer',lv);later(()=>{lv++;load(1);go()},3200)}
function getCoin(pts){coins++;score+=pts;api.add('coins');if(coins%100===0){lives++;api.sfx('up')}}
function bump(x,y){const ch=g[y][x];if(ch==='?'){g[y][x]='b';fx.push({x:x*TS+8,y:y*TS-4,vy:-170,t:.5});getCoin(200);api.sfx('coin')}else api.sfx('bump');
 for(const e of en)if(!e.k&&Math.abs(e.x+7-(x*TS+8))<12&&Math.abs(e.y+e.h-y*TS)<3){e.k=1;e.t=.4;score+=100}}

function upd(dt){
 anim+=dt;
 for(const f of fx){f.vy+=600*dt;f.y+=f.vy*dt;f.t-=dt}fx=fx.filter(f=>f.t>0);
 if(st==='title')return;
 const tx=cl(p.x+p.w/2-VW/2+p.f*20,0,Math.max(0,W*TS-VW));cx+=(tx-cx)*Math.min(1,dt*7);
 if(st==='dead'){p.vy+=900*dt;p.y+=p.vy*dt;return}
 if(st!=='play')return;
 time-=dt;if(time<=0){die('time');return}
 const dir=(Rt()?1:0)-(Lf()?1:0),run=RN(),mx=run?160:105;let ac=p.on?(run?640:520):360;
 if(dir){if(p.vx*dir<0)ac*=2.2;p.vx=cl(p.vx+dir*ac*dt,-mx,mx);p.f=dir}else p.vx-=Math.sign(p.vx)*Math.min(Math.abs(p.vx),(p.on?520:90)*dt);
 if(p.on)p.cy=.09;else p.cy-=dt;jb-=dt;
 if(jb>0&&p.cy>0){p.vy=-335-Math.abs(p.vx)*.12;p.cy=0;jb=0;p.on=false;api.sfx('jump');api.unlock('leap')}
 p.vy=Math.min(p.vy+(p.vy<0?(J()?880:2300):1350)*dt,460);
 move(p,dt);if(p.bc>=0)bump(p.bc,p.br);
 if(p.y>VH+10){die('pit');return}
 for(const e of en){
  if(e.k){e.t-=dt;if(e.t<=0)e.k=2;continue}
  if(Math.abs(e.x-p.x)>VW)continue;
  e.vy=Math.min(e.vy+900*dt,400);
  const ah=Math.floor((e.x+(e.dr>0?e.w+1:-1))/TS),bl=Math.floor((e.y+e.h+2)/TS);
  if(e.on&&!solid(ah,bl))e.dr*=-1;
  e.vx=e.dr*e.sp;move(e,dt);if(e.hx)e.dr*=-1;
  if(e.y>VH+40){e.k=2;continue}
  if(p.x<e.x+e.w&&p.x+p.w>e.x&&p.y<e.y+e.h&&p.y+p.h>e.y){
   if(p.vy>0&&p.y+p.h-e.y<10){e.k=1;e.t=.5;p.vy=J()?-300:-200;p.y=e.y-p.h;score+=100;stomped++;api.add('squish');api.sfx('stomp')}
   else{die('hit');return}}}
 for(const k of co)if(!k.got&&Math.abs(k.x-(p.x+p.w/2))<10&&Math.abs(k.y-(p.y+p.h/2))<11){k.got=1;getCoin(50);api.sfx('coin')}
 if(p.x+p.w>flagX)win()}

/* drawing */
function tile(ch,x,y,A,Lc,Rc){
 if(ch==='#'){X.fillStyle=th.g;X.fillRect(x,y,TS,TS);if(A===' '){X.fillStyle=th.t;X.fillRect(x,y,TS,4);X.fillStyle='rgba(0,0,0,.2)';X.fillRect(x,y+4,TS,1)}else{X.fillStyle='rgba(0,0,0,.14)';X.fillRect(x+3,y+4,2,2);X.fillRect(x+10,y+10,2,2)}}
 else if(ch==='B'){X.fillStyle=th.k;X.fillRect(x,y,TS,TS);X.fillStyle='rgba(0,0,0,.35)';X.fillRect(x,y+7,TS,1);X.fillRect(x,y+15,TS,1);X.fillRect(x+7,y,1,7);X.fillRect(x+3,y+8,1,7);X.fillRect(x+11,y+8,1,7);X.fillStyle='rgba(255,255,255,.22)';X.fillRect(x,y,TS,1)}
 else if(ch==='?'){X.fillStyle='#f2b72b';X.fillRect(x,y,TS,TS);X.fillStyle='#b4781a';X.fillRect(x,y+15,TS,1);X.fillRect(x+15,y,1,TS);X.fillStyle='#fff3a0';X.fillRect(x,y,TS,1);X.fillRect(x,y,1,TS);X.fillStyle='#7a4a00';X.font='bold 11px monospace';X.textBaseline='top';X.fillText('?',x+5,y+3)}
 else if(ch==='b'){X.fillStyle='#6b5a4a';X.fillRect(x,y,TS,TS);X.fillStyle='rgba(0,0,0,.3)';X.fillRect(x,y+15,TS,1);X.fillRect(x+15,y,1,TS)}
 else if(ch==='P'){X.fillStyle='#2fa84f';X.fillRect(x,y,TS,TS);if(Lc!=='P'){X.fillStyle='#7ee08a';X.fillRect(x+2,y,3,TS)}if(Rc!=='P'){X.fillStyle='#16692e';X.fillRect(x+TS-4,y,4,TS)}if(A!=='P'){X.fillStyle='#1e8a3c';X.fillRect(x,y,TS,5);X.fillStyle='rgba(255,255,255,.25)';X.fillRect(x,y,TS,1)}}}
function draw(){
 const gr=X.createLinearGradient(0,0,0,VH);gr.addColorStop(0,th.a);gr.addColorStop(1,th.b);X.fillStyle=gr;X.fillRect(0,0,VW,VH);
 if(ti===2)for(const s of stars){X.fillStyle=`rgba(255,255,255,${.35+.5*Math.abs(Math.sin(anim*2+s[2]*9))})`;X.fillRect(s[0],s[1],1,1)}
 X.fillStyle=th.h;for(let i=-1;i<4;i++){const hx=i*140-(cx*.35%140);X.beginPath();X.ellipse(hx+70,VH-30,80,i&1?52:70,0,Math.PI,0);X.fill()}
 if(ti===0||ti===2){X.fillStyle=ti?'rgba(180,190,255,.3)':'rgba(255,255,255,.85)';for(let i=-1;i<4;i++){const x=i*120-(cx*.2%120)+(i&1)*30,y=22+(i&1)*26;X.fillRect(x,y+6,34,8);X.fillRect(x+6,y+2,22,8);X.fillRect(x+12,y,12,6)}}
 if(g.length){
  const ox=Math.round(cx);X.save();X.translate(-ox,0);
  const c0=Math.max(0,ox/TS|0),c1=Math.min(W-1,c0+VW/TS+1);
  for(let y=0;y<12;y++)for(let x=c0;x<=c1;x++){const ch=g[y][x];if(ch!==' ')tile(ch,x*TS,y*TS,y?g[y-1][x]:' ',x?g[y][x-1]:' ',g[y][x+1]||' ')}
  X.fillStyle='#e8e8e8';X.fillRect(flagX-1,2*TS,2,(GY-4)*TS-2*TS);X.fillStyle='#ffc83d';X.fillRect(flagX-2,2*TS-3,5,5);X.fillStyle='#ff3b3b';X.beginPath();X.moveTo(flagX+1,2*TS+2);X.lineTo(flagX+17,2*TS+10+Math.sin(anim*5)*2);X.lineTo(flagX+1,2*TS+18);X.fill();
  for(const k of co)if(!k.got&&k.x>ox-8&&k.x<ox+VW+8){const w=Math.abs(Math.cos(anim*6+k.x))*5+1;X.fillStyle='#f6c431';X.fillRect(k.x-w/2,k.y-5,w,10);X.fillStyle='#fff3a0';X.fillRect(k.x-w/2,k.y-5,Math.max(1,w/3),10)}
  for(const f of fx){X.fillStyle='#f6c431';X.fillRect(f.x-3,f.y-4,6,8)}
  for(const e of en){if(e.k===2||e.x<ox-20||e.x>ox+VW+20)continue;const x=Math.round(e.x),y=Math.round(e.y);
   if(e.k){X.fillStyle='#8a4b2a';X.fillRect(x,y+11,14,3);continue}
   const f=(anim*8|0)%2;X.fillStyle='#8a4b2a';X.fillRect(x,y+4,14,7);X.fillRect(x+2,y+1,10,4);X.fillStyle='#e7c9a5';X.fillRect(x+3,y+9,8,3);X.fillStyle='#fff';X.fillRect(x+3,y+4,3,3);X.fillRect(x+8,y+4,3,3);X.fillStyle='#111';X.fillRect(x+(e.dr>0?5:3),y+5,1,2);X.fillRect(x+(e.dr>0?10:8),y+5,1,2);X.fillStyle='#2a1a10';X.fillRect(x+(f?0:1),y+11,5,3);X.fillRect(x+(f?9:8),y+11,5,3)}
  {const x=Math.round(p.x),y=Math.round(p.y),f=p.f,wf=p.on&&Math.abs(p.vx)>12?(anim*12|0)%2:0;
   X.fillStyle='#3a3f4a';X.fillRect(x+2,y+10,3,4-wf);X.fillRect(x+7,y+10,3,3+wf);
   X.fillStyle='#ff7a1a';X.fillRect(x+1,y+5,10,6);
   X.fillStyle='#f4f4f2';X.fillRect(x+1,y,10,6);
   X.fillStyle='#1b2a41';X.fillRect(f>0?x+4:x+1,y+1,7,4);
   X.fillStyle='#6ad7ff';X.fillRect(f>0?x+9:x+2,y+2,1,1)}
  X.restore()}
 X.shadowColor='#000';X.shadowOffsetX=1;X.shadowOffsetY=1;X.fillStyle='#fff';X.font='bold 9px monospace';X.textBaseline='top';X.textAlign='left';
 X.fillText('LV '+lv,6,6);X.fillText('SCORE '+String(score).padStart(6,'0'),40,6);X.fillText('● '+coins,124,6);X.fillText('♥ '+lives,160,6);X.fillText('TIME '+Math.max(0,Math.ceil(time)),196,6);
 if(st==='clear'){X.textAlign='center';X.font='bold 20px monospace';X.fillText('LEVEL CLEAR',VW/2,64);X.font='bold 10px monospace';X.fillText('Time bonus +'+bonus,VW/2,92);X.textAlign='left'}
 X.shadowColor='transparent';X.shadowOffsetX=X.shadowOffsetY=0}
function frame(t){raf=requestAnimationFrame(frame);const d=Math.min((t-last)/1000,.1);last=t;if(!paused){acc+=d;while(acc>=STEP){upd(STEP);acc-=STEP}}draw()}

/* input */
const jumpKeys=['ArrowUp','KeyW','Space','KeyZ'];
const kd=e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(e.code==='Escape'||e.code==='KeyP'){if(st==='play')pause(!paused);return}
 if(st==='title'){if(e.code==='ArrowLeft'||e.code==='KeyA'){lv=Math.max(1,lv-1);title()}else if(e.code==='ArrowRight'||e.code==='KeyD'){lv=Math.min(reached(),lv+1);title()}else if(e.code==='Space'||e.code==='Enter')go();return}
 if(st==='over'&&(e.code==='Space'||e.code==='Enter')){go();return}
 if(jumpKeys.includes(e.code))jb=.12};
const ku=e=>{keys[e.code]=false;if(e.code==='Space')e.preventDefault()};
ui.addEventListener('click',e=>{const a=e.target.closest('[data-a]');setTimeout(()=>document.activeElement&&document.activeElement.blur&&document.activeElement.blur(),0);if(!a)return;const k=a.dataset.a;
 if(k==='go')go();else if(k==='pause')pause(!paused);else if(k==='res')pause(false);else if(k==='menu')title();else if(k==='exit')api.exit();
 else if(k==='prev'){lv=Math.max(1,lv-1);title()}else if(k==='next'){lv=Math.min(reached(),lv+1);title()}});
if(matchMedia('(pointer:coarse)').matches)tc.style.display='block';
tc.addEventListener('pointerdown',e=>{const k=e.target.dataset.t;if(!k)return;T[k]=true;if(k==='j')jb=.12;e.preventDefault()});
const tu=e=>{const k=e.target.dataset&&e.target.dataset.t;if(k)T[k]=false};
tc.addEventListener('pointerup',tu);tc.addEventListener('pointercancel',tu);tc.addEventListener('pointerout',tu);
const vis=()=>{if(document.hidden&&st==='play')pause(true);last=performance.now()};
addEventListener('keydown',kd);addEventListener('keyup',ku);document.addEventListener('visibilitychange',vis);
title();raf=requestAnimationFrame(frame);
return()=>{cancelAnimationFrame(raf);tos.forEach(clearTimeout);removeEventListener('keydown',kd);removeEventListener('keyup',ku);document.removeEventListener('visibilitychange',vis);api.music(null)}}
