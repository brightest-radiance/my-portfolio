/* Star Run: 2D platformer. Levels 1-19 use fixed seeds on a curated difficulty curve; from level 20 every run gets a fresh random seed.
   Every segment stays inside the jump limits (gaps up to 4 tiles, steps of 1 tile, pipes up to 3 tiles), so every generated level is beatable. */
export default function(root,api){
const TS=16,VW=320,VH=192,GY=10,STEP=1/120,cl=(v,a,b)=>Math.min(b,Math.max(a,v));
const cv=document.createElement('canvas');cv.width=VW;cv.height=VH;
cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;background:#000';
const X=cv.getContext('2d');
const ui=document.createElement('div');ui.style.cssText='position:absolute;inset:0;pointer-events:none';
ui.innerHTML=`<style>.tb{position:absolute;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);width:64px;height:64px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(20,21,23,.55);color:#fff;font:700 16px system-ui;display:grid;place-items:center;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none}</style><button class="bt" data-a="pause" type="button" style="pointer-events:auto;position:absolute;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px;margin:0">Pause</button><div class="ov" style="display:none;pointer-events:auto"></div><div class="tc" style="display:none"><b class="tb" data-t="l" style="left:14px">◀</b><b class="tb" data-t="r" style="left:88px">▶</b><b class="tb" data-t="d" style="right:96px;bottom:calc(env(safe-area-inset-bottom,0px) + 90px);width:52px;height:52px">Dash</b><b class="tb" data-t="n" style="right:96px;width:52px;height:52px">Run</b><b class="tb" data-t="j" style="right:14px">Jump</b></div>`;
root.append(cv,ui);
const ov=ui.querySelector('.ov'),tc=ui.querySelector('.tc');

const TH=[{a:'#5aa8ff',b:'#cfe9ff',g:'#b5702f',t:'#3f9e3e',h:'#4aa84a',k:'#c86a2a'},{a:'#07080d',b:'#18202c',g:'#2d4a63',t:'#4d7aa0',h:'#101a26',k:'#3a5f80'},{a:'#0a1030',b:'#2c3d80',g:'#3a3f66',t:'#6a72b8',h:'#17204a',k:'#5a5fa0'},{a:'#3a0f1a',b:'#ff8a3c',g:'#5a2d2d',t:'#a8442c',h:'#2a1015',k:'#8a4a3a'}];
TH.forEach((t,i)=>{t.m=['#8fb8e8','#0f1722','#1e2a66','#6a1f26'][i];t.s=['#ffd54a','#7fd1ff','#fff3b0','#ffb347'][i]});
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
let lv=1,ti=0,st='title',g=[],W=0,en=[],co=[],fx=[],flagX=0,p={},cx=0,time=0,tmax=240,score=0,coins=0,lives=3,stomped=0,bonus=0,anim=0,acc=0,last=performance.now(),raf=0,seed=0,th=TH[0],jb=0,paused=false,stars=[],shk=0,pt=[],shots=[],crs=[],dsh=0,dcd=0,hist=[];
const keys={},T={},tos=[],later=(f,ms)=>tos.push(setTimeout(f,ms)),qs=+new URLSearchParams(location.search).get('lv')||0,reached=()=>Math.max(api.get('reached')||1,qs);
if(qs)lv=qs;
const solid=(x,y)=>x<0||x>=W||(y>=0&&y<12&&g[y][x]!==' '&&g[y][x]!=='S');
const puff=(x,y,n,c,sp=40)=>{for(let i=0;i<n;i++)pt.push({x,y,vx:(Math.random()-.5)*sp,vy:-Math.random()*sp*.7,t:.25+Math.random()*.3,c})};
function tryDash(){if(st!=='play'||dcd>0||dsh>0)return;dsh=.18;dcd=.7;p.vx=p.f*230;p.vy=Math.min(p.vy,0)*.2;shk=2;puff(p.x+6,p.y+12,8,'#cfe9ff',70);api.sfx('nitro')}

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
 const foe=(c0,y,ty)=>{if(!ty){const q=r();ty=lv<3?'bug':lv<5?(q<.7?'bug':'hop'):lv<8?(q<.4?'bug':q<.65?'hop':q<.85?'fly':'spk'):(q<.25?'bug':q<.45?'hop':q<.65?'fly':q<.85?'spk':'tur')}
 const e={x:c0*TS,y:y*TS,w:14,h:14,vx:0,vy:0,k:0,t:0,dr:-1,sp:26+d*26*r(),ty,t2:r()*6,y0:y*TS-TS*2,hj:1+r()*2,sc:1,xa:c0*TS-TS*4,xb:c0*TS+TS*4};if(ty==='fly')e.y=e.y0;if(ty==='spk')e.sp*=.7;en.push(e)};
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
  else if(q<.93&&lv>=3){const n=1+(r()*(1+d*2)|0);flat(3);for(let i=0;i<n;i++){put(x,GY-1,'S');gr(x);x++}cr(x-n,n,GY-3);flat(3)}
  else if(q<.96&&lv>=5){const n=3+(r()*3|0);for(let i=0;i<n;i++)put(x+i,GY,'C');cr(x,n,GY-2);x+=n;flat(3)}
  else if(q<.985&&lv>=6){gr(x);put(x,GY,'J');x++;flat(2);for(let i=0;i<8;i++){put(x+i,GY-6,'B');gr(x+i)}cr(x+1,6,GY-7);x+=8;flat(3)}
  else flat(3+(r()*3|0))}
 flat(4);for(let i=1;i<=4;i++)gr(x++,GY-i);gr(x,GY-4);flagX=x*TS+TS/2;x++;flat(6);W=x}
function load(ns){if(ns)seed=lv<20?lv*7919+13:Math.random()*1e9|0;ti=(lv-1>>2)%4;th=TH[ti];gen();p={x:2*TS,y:GY*TS-14,w:12,h:14,vx:0,vy:0,on:true,f:1,cy:0};cx=0;fx=[];pt=[];shots=[];crs=[];dsh=0;dcd=0;hist=[];shk=0;stomped=0;tmax=Math.max(120,240-lv*4);time=tmax}

/* flow */
const show=h=>{ov.innerHTML=h?`<div>${h}</div>`:'';ov.style.display=h?'grid':'none'};
const J=()=>keys.ArrowUp||keys.KeyW||keys.Space||keys.KeyZ||T.j,Lf=()=>keys.ArrowLeft||keys.KeyA||T.l,Rt=()=>keys.ArrowRight||keys.KeyD||T.r,RN=()=>keys.ShiftLeft||keys.ShiftRight||keys.KeyX||T.n;
function title(){load(1);st='title';paused=false;const rc=reached();api.music('run');
 show(`<h3>Star Run</h3><p>Level <b>${lv}</b>${rc>1?' (furthest: '+rc+')':''}</p><p>${lv>=20?'Generated level. New seed every run.':'Curated world. Same every time.'}</p><p>Arrows or A/D move. Space or W jumps. Hold Shift to run. Press K or C to dash through enemies. Stomp most enemies from above, but not spiked ones. Springs launch you, spikes hurt, cracked floors fall.</p><div class="row"><button class="bt pri" data-a="go" type="button">Start level ${lv}</button>${rc>1?'<button class="bt" data-a="prev" type="button">◀ Level</button><button class="bt" data-a="next" type="button">Level ▶</button>':''}</div>${api.strip()}`)}
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
 for(const q of pt){q.vy+=300*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.t-=dt}pt=pt.filter(q=>q.t>0);shk=Math.max(0,shk-dt*8);
 if(st==='title')return;
 const tx=cl(p.x+p.w/2-VW/2+p.f*20,0,Math.max(0,W*TS-VW));cx+=(tx-cx)*Math.min(1,dt*7);
 if(st==='dead'){p.vy+=900*dt;p.y+=p.vy*dt;return}
 if(st!=='play')return;
 time-=dt;if(time<=0){die('time');return}
 const dir=(Rt()?1:0)-(Lf()?1:0),run=RN(),mx=run?160:105;let ac=p.on?(run?640:520):360;
 if(dir){if(p.vx*dir<0)ac*=2.2;p.vx=cl(p.vx+dir*ac*dt,-mx,mx);p.f=dir}else p.vx-=Math.sign(p.vx)*Math.min(Math.abs(p.vx),(p.on?520:90)*dt);
 if(p.on)p.cy=.09;else p.cy-=dt;jb-=dt;
 if(jb>0&&p.cy>0){p.vy=-335-Math.abs(p.vx)*.12;p.cy=0;jb=0;p.on=false;api.sfx('jump');api.unlock('leap')}
 if(dcd>0)dcd-=dt;
 if(dsh>0){dsh-=dt;p.vx=p.f*230;p.vy=0;if(Math.random()<.6)pt.push({x:p.x+6,y:p.y+3+Math.random()*10,vx:-p.f*30,vy:0,t:.25,c:'#9fe3ff'})}else p.vy=Math.min(p.vy+(p.vy<0?(J()||p.sp?880:2300):1350)*dt,460);
 if(p.vy>=0)p.sp=0;
 const wasOn=p.on,pvy=p.vy;move(p,dt);if(p.bc>=0)bump(p.bc,p.br);
 if(p.on){if(!wasOn&&pvy>120)puff(p.x+6,p.y+14,5,th.t,35);const fx0=Math.floor((p.x+p.w/2)/TS),fy0=Math.floor((p.y+p.h+1)/TS),t0=g[fy0]&&g[fy0][fx0];
  if(t0==='J'){p.vy=-470;p.sp=1;p.on=false;api.sfx('jump');puff(p.x+6,p.y+14,8,'#ffd54a',60);shk=1.5}
  else if(t0==='C'&&!crs.some(c=>c.x===fx0&&c.y===fy0))crs.push({x:fx0,y:fy0,t:.45})}
 if(p.y>VH+10){die('pit');return}
 hist.unshift([p.x,p.y]);if(hist.length>40)hist.pop();
 {const a0=Math.floor((p.x+3)/TS),a1=Math.floor((p.x+p.w-3)/TS),r0=Math.floor((p.y+p.h-3)/TS);for(let xx=a0;xx<=a1;xx++)if(g[r0]&&g[r0][xx]==='S'){die('spike');return}}
 for(const c of crs){c.t-=dt;if(c.t<=0){if(g[c.y])g[c.y][c.x]=' ';puff(c.x*TS+8,c.y*TS+8,6,'#8a7f73',50);api.sfx('bump')}}crs=crs.filter(c=>c.t>0);
 for(const e of en){
  if(e.k){e.t-=dt;if(e.t<=0)e.k=2;continue}
  if(Math.abs(e.x-p.x)>VW)continue;
  e.t2+=dt;const ty=e.ty;
  if(ty==='fly'){e.x+=e.dr*e.sp*.9*dt;e.y=e.y0+Math.sin(e.t2*2.6)*14;if(e.x<e.xa)e.dr=1;if(e.x>e.xb)e.dr=-1}
  else if(ty==='tur'){e.dr=p.x<e.x?-1:1;e.sc-=dt;if(e.sc<=0&&Math.abs(p.x-e.x)<170){e.sc=2.1;shots.push({x:e.x+7,y:e.y+5,vx:e.dr*85,t:4});api.sfx('bump')}}
  else{
   e.vy=Math.min(e.vy+900*dt,400);
   const ah=Math.floor((e.x+(e.dr>0?e.w+1:-1))/TS),bl=Math.floor((e.y+e.h+2)/TS);
   if(e.on&&!solid(ah,bl))e.dr*=-1;
   if(ty==='hop'){e.hj-=dt;if(e.on&&e.hj<=0){e.vy=-250;e.hj=1.2+Math.random()*1.3;e.dr=p.x<e.x?-1:1}e.vx=e.on?0:e.dr*55}else e.vx=e.dr*e.sp;
   move(e,dt);if(e.hx)e.dr*=-1;
   if(e.y>VH+40){e.k=2;continue}}
  if(p.x<e.x+e.w&&p.x+p.w>e.x&&p.y<e.y+e.h&&p.y+p.h>e.y){
   if(dsh>0){e.k=1;e.t=.4;score+=150;stomped++;api.add('squish');api.sfx('stomp');shk=2.5;puff(e.x+7,e.y+7,10,'#ffd54a',90)}
   else if(p.vy>0&&p.y+p.h-e.y<10&&ty!=='spk'&&ty!=='tur'){e.k=1;e.t=.5;p.vy=J()?-300:-200;p.y=e.y-p.h;score+=100;stomped++;api.add('squish');api.sfx('stomp');puff(e.x+7,e.y+10,6,'#fff',50)}
   else{die('hit');return}}}
 for(const o of shots){o.t-=dt;o.x+=o.vx*dt;if(solid(Math.floor(o.x/TS),Math.floor(o.y/TS)))o.t=0;if(dsh<=0&&Math.abs(o.x-(p.x+6))<5&&Math.abs(o.y-(p.y+7))<7){die('hit');return}}shots=shots.filter(o=>o.t>0);
 for(const k of co)if(!k.got&&Math.abs(k.x-(p.x+p.w/2))<10&&Math.abs(k.y-(p.y+p.h/2))<11){k.got=1;getCoin(50);api.sfx('coin')}
 if(p.x+p.w>flagX)win()}

/* drawing */
const R=(x,y,w,h,c)=>{X.fillStyle=c;X.fillRect(x,y,w,h)};
const vgG=(()=>{const q=X.createRadialGradient(VW/2,VH/2,VH*.45,VW/2,VH/2,VW*.62);q.addColorStop(0,'rgba(0,0,0,0)');q.addColorStop(1,'rgba(0,0,0,.4)');return q})();
function tile(ch,x,y,A,Lc,Rc,gx,gy){const h=(gx*7+gy*13)&7;
 if(ch==='#'){R(x,y,TS,TS,th.g);R(x,y+TS-1,TS,1,'rgba(0,0,0,.25)');
  if(A===' '||A==='S'||A==='J'){R(x,y,TS,5,th.t);R(x,y+5,TS,1,'rgba(0,0,0,.28)');for(let i=0;i<TS;i+=3)R(x+i,y+4+((i+h)&1),2,2,th.t);if(h<2){R(x+5,y-1,1,2,'#fff');R(x+4,y-2,3,1,'#ffd54a')}}
  else{R(x+3+(h&3),y+4,2,2,'rgba(0,0,0,.18)');R(x+10,y+10-(h&1)*3,3,2,'rgba(255,255,255,.08)');R(x+1,y+13,5,1,'rgba(0,0,0,.18)')}}
 else if(ch==='B'){R(x,y,TS,TS,th.k);for(const[a,b,w,hh]of[[0,7,TS,1],[0,15,TS,1],[7,0,1,7],[3,8,1,7],[11,8,1,7]])R(x+a,y+b,w,hh,'rgba(0,0,0,.35)');R(x,y,TS,1,'rgba(255,255,255,.22)')}
 else if(ch==='?'){const u=Math.sin(anim*5+gx)*.5+.5;R(x,y,TS,TS,'#f2b72b');R(x,y+15,TS,1,'#b4781a');R(x+15,y,1,TS,'#b4781a');R(x,y,TS,1,'#fff3a0');R(x,y,1,TS,'#fff3a0');for(const[a,b]of[[2,2],[13,2],[2,13],[13,13]])R(x+a,y+b,1,1,'#7a4a00');R(x+1,y+1,TS-2,TS-2,`rgba(255,255,200,${.1+u*.22})`);X.fillStyle='#7a4a00';X.font='bold 11px monospace';X.textBaseline='top';X.fillText('?',x+5,y+3)}
 else if(ch==='b'){R(x,y,TS,TS,'#6b5a4a');R(x,y+15,TS,1,'rgba(0,0,0,.3)');R(x+15,y,1,TS,'rgba(0,0,0,.3)')}
 else if(ch==='P'){R(x,y,TS,TS,'#2fa84f');if(Lc!=='P')R(x+2,y,3,TS,'#7ee08a');if(Rc!=='P')R(x+TS-4,y,4,TS,'#16692e');if(A!=='P'){R(x,y,TS,5,'#1e8a3c');R(x,y,TS,1,'rgba(255,255,255,.25)')}}
 else if(ch==='S'){R(x,y+12,TS,4,'#555a63');for(let i=0;i<4;i++){X.fillStyle='#cfd5dd';X.beginPath();X.moveTo(x+i*4,y+12);X.lineTo(x+i*4+2,y+2);X.lineTo(x+i*4+4,y+12);X.fill();R(x+i*4+1,y+2,2,2,'#ff3b3b')}}
 else if(ch==='C'){const c=crs.find(q=>q.x===gx&&q.y===gy),k=c?Math.round(Math.sin(anim*90)):0;R(x+k,y,TS,TS,'#8a7f73');R(x+k,y,TS,2,'#b5a999');R(x+k,y+TS-2,TS,2,'#5c5349');R(x+k+5,y+3,1,6,'#4b443c');R(x+k+6,y+8,4,1,'#4b443c');R(x+k+11,y+5,1,5,'#4b443c')}
 else if(ch==='J'){R(x,y+10,TS,6,'#c0392b');for(let i=0;i<3;i++)R(x+3+i*4,y+7,2,3,'#ddd');R(x+1,y+4+Math.round(Math.sin(anim*8)),TS-2,3,'#ffd54a');R(x+1,y+4+Math.round(Math.sin(anim*8)),TS-2,1,'#fff3a0')}}
function drawEnemy(e,x,y){const f=(anim*8|0)%2,d=e.dr>0?1:-1,t=e.ty;
 if(e.k){R(x,y+11,14,3,{bug:'#e4572e',hop:'#3fa34d',fly:'#8e9aaf',spk:'#3b3f4a',tur:'#59606e'}[t]);R(x+3,y+11,2,1,'#fff');R(x+9,y+11,2,1,'#fff');return}
 if(t==='bug'){R(x+1,y+3,12,8,'#e4572e');R(x+3,y+1,8,3,'#e4572e');R(x+6,y+1,2,10,'rgba(0,0,0,.25)');R(x+3,y+4,3,3,'#fff');R(x+8,y+4,3,3,'#fff');R(x+(d>0?5:3),y+5,1,2,'#111');R(x+(d>0?10:8),y+5,1,2,'#111');R(x+(f?1:2),y+11,3,3,'#3a1a12');R(x+(f?10:9),y+11,3,3,'#3a1a12');R(x+3,y-1,1,3,'#3a1a12');R(x+10,y-1,1,3,'#3a1a12')}
 else if(t==='hop'){const q=e.on?0:2;R(x+1,y+5+q,12,7-q,'#3fa34d');R(x+2,y+2+q,4,4,'#3fa34d');R(x+8,y+2+q,4,4,'#3fa34d');R(x+3,y+3+q,2,2,'#fff');R(x+9,y+3+q,2,2,'#fff');R(x+(d>0?4:3),y+4+q,1,1,'#111');R(x+(d>0?10:9),y+4+q,1,1,'#111');R(x+4,y+9+q,6,2,'#c9f5c4');R(x,y+12,4,2,'#2b7a35');R(x+10,y+12,4,2,'#2b7a35')}
 else if(t==='fly'){R(x+2,y+5,10,6,'#8e9aaf');R(x+4,y+3,6,3,'#b7c1d3');R(x+5,y+6,4,3,'#ff3b3b');R(x+6,y+7,2,1,'#fff');const w=(anim*30|0)%2?5:1;R(x+4-w,y+1,w*2+6,1,'#dfe6ef');R(x+6,y+2,2,1,'#555');R(x+3,y+11,2,2,'#555');R(x+9,y+11,2,2,'#555')}
 else if(t==='spk'){R(x+1,y+6,12,6,'#3b3f4a');R(x+2,y+4,10,3,'#4a4f5c');for(let i=0;i<4;i++){X.fillStyle='#ff4b3b';X.beginPath();X.moveTo(x+2+i*3,y+5);X.lineTo(x+3.5+i*3,y);X.lineTo(x+5+i*3,y+5);X.fill()}R(x+(d>0?8:2),y+8,4,2,'#fff');R(x+(d>0?10:3),y+8,1,2,'#111');R(x+(f?1:2),y+12,4,2,'#222');R(x+(f?9:8),y+12,4,2,'#222')}
 else{R(x,y+7,14,7,'#59606e');R(x+2,y+9,10,1,'rgba(255,255,255,.2)');R(d>0?x+8:x-3,y+3,9,4,'#7a8294');R(d>0?x+14:x-4,y+4,2,2,'#222');R(x+5,y+9,4,3,Math.sin(anim*8)>0?'#ff3b3b':'#661515')}}
/* Stellar: helmeted runner in a navy suit, star on the chest, glowing visor and a scarf that trails the path just run */
function drawStellar(x,y){
 const f=p.f,mv=p.on&&Math.abs(p.vx)>12,ph=mv?(anim*12|0)%4:0,air=!p.on,up=p.vy<0,bob=!mv&&p.on&&Math.sin(anim*3)>.4?1:0;
 for(let k=1;k<=7;k++){const q=hist[Math.min(k*5,hist.length-1)]||[p.x,p.y],w=Math.sin(anim*14+k*1.2)*1.2;R(Math.round(q[0]+6-f*k*1.6),Math.round(q[1]-3+w+k*.3),3,2,k<4?'#ff4b3b':'#c9302a')}
 X.save();X.translate(Math.round(x+6),Math.round(y+14));if(f<0)X.scale(-1,1);
 const a=mv?[-2,0,2,0][ph]:air?(up?2:1):0,lift=mv&&(ph&1)?0:mv?1:0;
 R(-4+a,-5,3,5-lift,'#1d2a44');R(1-a,-5,3,5-(mv&&!(ph&1)?1:0),'#1d2a44');R(-4+a,-1,3,1,'#e23b3b');R(1-a,-1,3,1,'#e23b3b');
 R(-4,-11+bob,8,6,'#25365a');R(-4,-6+bob,8,1,'#e23b3b');R(-1,-10+bob,3,1,'#fff');R(0,-11+bob,1,3,'#fff');R(-2,-9+bob,1,1,'#ffd54a');R(2,-9+bob,1,1,'#ffd54a');
 const ar=air?(up?-3:-1):mv?[-2,0,2,0][(ph+2)&3]:0;R((2+ar*.5)|0,-10+bob,2,5,'#25365a');R((2+ar*.5)|0,-6+bob,2,1,'#f4f4f2');R(-5,-10+bob,2,4,'#1b2944');
 R(-4,-18+bob,8,7,'#f4f4f2');R(-3,-19+bob,6,1,'#f4f4f2');R(-4,-14+bob,8,1,'#e23b3b');R(0,-16+bob,5,3,'#12202e');R(1,-16+bob,4,2,'#6ad7ff');R(1,-16+bob,1,1,'#fff');R(-4,-12+bob,8,2,'#e23b3b');R(-5,-17+bob,1,3,'#ffd54a');
 X.restore()}
function bg(){
 const gr=X.createLinearGradient(0,0,0,VH);gr.addColorStop(0,th.a);gr.addColorStop(1,th.b);X.fillStyle=gr;X.fillRect(0,0,VW,VH);
 if(ti===1||ti===2)for(const s of stars){X.fillStyle=`rgba(255,255,255,${.3+.5*Math.abs(Math.sin(anim*2+s[2]*9))})`;X.fillRect(s[0],s[1],1,1)}
 if(ti!==1){const sx=ti===3?230:262,sy=ti===3?96:34,sr=ti===3?26:12;X.fillStyle='rgba(255,255,255,.12)';X.beginPath();X.arc(sx,sy,sr+8,0,7);X.fill();X.fillStyle=th.s;X.beginPath();X.arc(sx,sy,sr,0,7);X.fill()}
 const o1=Math.floor(cx*.12/90);X.fillStyle=th.m;for(let i=-1;i<5;i++){const mx=i*90-(cx*.12%90),mh=38+(((i+o1)*37)&31);X.beginPath();X.moveTo(mx,VH-18);X.lineTo(mx+45,VH-18-mh);X.lineTo(mx+90,VH-18);X.fill()}
 X.fillStyle=th.h;for(let i=-1;i<4;i++){const hx=i*140-(cx*.35%140);X.beginPath();X.ellipse(hx+70,VH-30,80,i&1?52:70,0,Math.PI,0);X.fill()}
 if(ti===0||ti===2){X.fillStyle=ti?'rgba(180,190,255,.3)':'rgba(255,255,255,.85)';for(let i=-1;i<4;i++){const x=i*120-(cx*.2%120)+(i&1)*30,y=22+(i&1)*26;X.fillRect(x,y+6,34,8);X.fillRect(x+6,y+2,22,8);X.fillRect(x+12,y,12,6)}}
 const o2=Math.floor(cx*.6/64);for(let i=-1;i<7;i++){const n=i+o2,px=i*64-(cx*.6%64)+((n*29)&31),hg=14+((n*17)&15),by=VH-14;
  if(ti===0){X.fillStyle='rgba(20,70,30,.55)';X.beginPath();X.moveTo(px,by);X.lineTo(px+7,by-hg-8);X.lineTo(px+14,by);X.fill()}
  else if(ti===1){X.fillStyle='rgba(110,200,255,.35)';X.beginPath();X.moveTo(px,by);X.lineTo(px+4,by-hg-6);X.lineTo(px+9,by);X.fill()}
  else if(ti===2){R(px,by-hg-14,9,hg+14,'rgba(10,14,40,.7)');for(let j=0;j<4;j++)if(((n+j)*7)&1)R(px+2,by-hg-10+j*7,2,2,'rgba(255,214,120,.8)')}
  else{X.fillStyle='rgba(255,120,40,.35)';X.beginPath();X.moveTo(px,by);X.lineTo(px+5,by-hg-10);X.lineTo(px+11,by);X.fill()}}}
function draw(){
 bg();
 if(g.length){
  const ox=Math.round(cx),sx=shk>.1?Math.round((Math.random()-.5)*shk):0,sy=shk>.1?Math.round((Math.random()-.5)*shk):0;X.save();X.translate(-ox+sx,sy);
  const c0=Math.max(0,ox/TS|0),c1=Math.min(W-1,c0+VW/TS+1);
  for(let y=0;y<12;y++)for(let x=c0;x<=c1;x++){const ch=g[y][x];if(ch!==' ')tile(ch,x*TS,y*TS,y?g[y-1][x]:' ',x?g[y][x-1]:' ',g[y][x+1]||' ',x,y)}
  R(flagX-1,2*TS,2,(GY-4)*TS-2*TS,'#e8e8e8');X.fillStyle='#ffc83d';X.beginPath();X.arc(flagX,2*TS-2,3.5,0,7);X.fill();X.fillStyle='#ff3b3b';X.beginPath();X.moveTo(flagX+1,2*TS+2);X.lineTo(flagX+17,2*TS+10+Math.sin(anim*5)*2);X.lineTo(flagX+1,2*TS+18);X.fill();R(flagX+4,2*TS+8,3,1,'#fff');
  for(const k of co)if(!k.got&&k.x>ox-8&&k.x<ox+VW+8){const w=Math.abs(Math.cos(anim*6+k.x))*5+1;R(k.x-w/2,k.y-5,w,10,'#f6c431');R(k.x-w/2,k.y-5,Math.max(1,w/3),10,'#fff3a0');if((anim*3+k.x)%3<.12)R(k.x+4,k.y-6,1,1,'#fff')}
  for(const f of fx)R(f.x-3,f.y-4,6,8,'#f6c431');
  for(const e of en){if(e.k===2||e.x<ox-20||e.x>ox+VW+20)continue;drawEnemy(e,Math.round(e.x),Math.round(e.y))}
  for(const o of shots){R(o.x-2,o.y-2,4,4,'#ff5a4a');R(o.x-1,o.y-1,2,2,'#fff')}
  drawStellar(Math.round(p.x),Math.round(p.y));
  for(const q of pt)R(Math.round(q.x),Math.round(q.y),2,2,q.c);
  X.restore()}
 X.shadowColor='#000';X.shadowOffsetX=1;X.shadowOffsetY=1;X.fillStyle='#fff';X.font='bold 9px monospace';X.textBaseline='top';X.textAlign='left';
 X.fillText('LV '+lv,6,6);X.fillText('SCORE '+String(score).padStart(6,'0'),40,6);X.fillText('● '+coins,124,6);X.fillText('♥ '+lives,160,6);X.fillText('TIME '+Math.max(0,Math.ceil(time)),196,6);
 X.shadowColor='transparent';X.shadowOffsetX=X.shadowOffsetY=0;R(196,17,44,3,'rgba(255,255,255,.2)');R(196,17,44*(1-Math.max(0,dcd)/.7),3,dcd>0?'#6a8aa0':'#6ad7ff');
 X.fillStyle=vgG;X.fillRect(0,0,VW,VH);
 if(st==='clear'){X.shadowColor='#000';X.shadowOffsetX=1;X.shadowOffsetY=1;X.fillStyle='#fff';X.textAlign='center';X.font='bold 20px monospace';X.fillText('LEVEL CLEAR',VW/2,64);X.font='bold 10px monospace';X.fillText('Time bonus +'+bonus,VW/2,92);X.textAlign='left';X.shadowColor='transparent';X.shadowOffsetX=X.shadowOffsetY=0}}
function frame(t){raf=requestAnimationFrame(frame);const d=Math.min((t-last)/1000,.1);last=t;if(!paused){acc+=d;while(acc>=STEP){upd(STEP);acc-=STEP}}draw()}

/* input */
const jumpKeys=['ArrowUp','KeyW','Space','KeyZ'];
const kd=e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(e.code==='Escape'||e.code==='KeyP'){if(st==='play')pause(!paused);return}
 if(st==='title'){if(e.code==='ArrowLeft'||e.code==='KeyA'){lv=Math.max(1,lv-1);title()}else if(e.code==='ArrowRight'||e.code==='KeyD'){lv=Math.min(reached(),lv+1);title()}else if(e.code==='Space'||e.code==='Enter')go();return}
 if(st==='over'&&(e.code==='Space'||e.code==='Enter')){go();return}
 if(jumpKeys.includes(e.code))jb=.12;if(e.code==='KeyK'||e.code==='KeyC')tryDash()};
const ku=e=>{keys[e.code]=false;if(e.code==='Space')e.preventDefault()};
ui.addEventListener('click',e=>{const a=e.target.closest('[data-a]');setTimeout(()=>document.activeElement&&document.activeElement.blur&&document.activeElement.blur(),0);if(!a)return;const k=a.dataset.a;
 if(k==='go')go();else if(k==='pause')pause(!paused);else if(k==='res')pause(false);else if(k==='menu')title();else if(k==='exit')api.exit();
 else if(k==='prev'){lv=Math.max(1,lv-1);title()}else if(k==='next'){lv=Math.min(reached(),lv+1);title()}});
if(matchMedia('(pointer:coarse)').matches)tc.style.display='block';
tc.addEventListener('pointerdown',e=>{const k=e.target.dataset.t;if(!k)return;T[k]=true;if(k==='j')jb=.12;if(k==='d')tryDash();e.preventDefault()});
const tu=e=>{const k=e.target.dataset&&e.target.dataset.t;if(k)T[k]=false};
tc.addEventListener('pointerup',tu);tc.addEventListener('pointercancel',tu);tc.addEventListener('pointerout',tu);
const vis=()=>{if(document.hidden&&st==='play')pause(true);last=performance.now()};
addEventListener('keydown',kd);addEventListener('keyup',ku);document.addEventListener('visibilitychange',vis);
title();raf=requestAnimationFrame(frame);
return()=>{cancelAnimationFrame(raf);tos.forEach(clearTimeout);removeEventListener('keydown',kd);removeEventListener('keyup',ku);document.removeEventListener('visibilitychange',vis);api.music(null)}}
