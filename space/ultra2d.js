/* Star Run Ultra: renders at 3-4x resolution, then adds parallax hills, dynamic lights, bloom, drifting motes and colour grading.
   Loaded on demand by platformer.js when Graphics is set to Ultra. */
export default function(cv,X,VW,VH){
const S0=devicePixelRatio>1.5?4:3,L=document.createElement('canvas'),B=document.createElement('canvas'),lx=L.getContext('2d'),bx=B.getContext('2d');
L.width=VW;L.height=VH;B.width=VW/4;B.height=VH/4;
const MC=['#fff6b0','#c9ff7a','#b6c6ff','#ff9a4a'],AMB=[0,.5,.38,.3],GR=['rgba(255,214,160,.5)','rgba(120,150,255,.45)','rgba(160,140,255,.45)','rgba(255,120,70,.5)'];
const mo=Array.from({length:46},()=>({x:Math.random()*VW,y:Math.random()*VH,z:.3+Math.random()*.9,p:Math.random()*6.28}));
let on=false,tm=0;
return{
 pre(q){const S=q?S0:1;if(cv.width!==VW*S){cv.width=VW*S;cv.height=VH*S;cv.style.imageRendering=q?'auto':'pixelated'}X.setTransform(S,0,0,S,0,0);on=q},
 /* three parallax ridges behind the level */
 far(cx,th,ti){if(!on)return;const C=[th.m,th.m,th.h];
  for(let i=0;i<3;i++){const f=.12+i*.14,b=VH*(.58+i*.1),a=16-i*3;X.globalAlpha=[.5,.7,.6][i];X.fillStyle=C[i];X.beginPath();X.moveTo(0,VH);
   for(let x=0;x<=VW;x+=4){const w=x+cx*f;X.lineTo(x,b-a*(.5+.5*Math.sin(w*.021+i*2))-a*.6*Math.sin(w*.049+i))}X.lineTo(VW,VH);X.fill()}X.globalAlpha=1},
 /* lights, glow, bloom, motes, grade: runs after the level is drawn and before the HUD */
 post(s){if(!on)return;const{ox,p,co,shots,flagX,ti,th,t}=s,amb=AMB[ti],Ls=[[p.x-ox+6,p.y+4,36,'#6ad7ff',.55],[flagX-ox,40,44,'#ffd54a',.5]];tm=t;
  for(const k of co)if(!k.got){const x=k.x-ox;if(x>-20&&x<VW+20)Ls.push([x,k.y,16,'#ffd54a',.6])}
  for(const q of shots)Ls.push([q.x-ox,q.y,20,'#ff5a4a',.7]);
  if(amb){lx.globalCompositeOperation='source-over';lx.clearRect(0,0,VW,VH);lx.globalAlpha=amb;lx.fillStyle=ti===3?'#1a0508':'#050816';lx.fillRect(0,0,VW,VH);lx.globalAlpha=1;lx.globalCompositeOperation='destination-out';
   for(const[x,y,r,,a]of Ls){const g=lx.createRadialGradient(x,y,0,x,y,r*1.6);g.addColorStop(0,`rgba(0,0,0,${Math.min(1,a*1.6)})`);g.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=g;lx.fillRect(x-r*1.6,y-r*1.6,r*3.2,r*3.2)}
   lx.globalCompositeOperation='source-over';X.drawImage(L,0,0,VW,VH)}
  X.globalCompositeOperation='lighter';
  for(const[x,y,r,c,a]of Ls){const g=X.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,c+'00');X.globalAlpha=a*(amb?.4:.18);X.fillStyle=g;X.fillRect(x-r,y-r,r*2,r*2)}
  X.globalAlpha=1;X.fillStyle=MC[ti];
  for(const m of mo){const x=((m.x-ox*m.z*.5+(ti===3?0:t*8*m.z))%VW+VW)%VW,y=ti===3?((m.y-t*12*m.z)%VH+VH)%VH:m.y+Math.sin(t*.8+m.p)*6;X.globalAlpha=.35+.45*Math.sin(t*2+m.p)**2;X.fillRect(x,y,1.3*m.z+.4,1.3*m.z+.4)}
  X.globalAlpha=1;X.globalCompositeOperation='source-over';
  /* bloom: shrink the frame twice, then add it back softly */
  lx.globalCompositeOperation='copy';lx.drawImage(cv,0,0,VW,VH);bx.globalCompositeOperation='copy';bx.filter='brightness(.85) contrast(1.7)';bx.drawImage(L,0,0,B.width,B.height);bx.filter='none';
  X.save();X.setTransform(1,0,0,1,0,0);X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';X.globalCompositeOperation='lighter';X.globalAlpha=.3;X.drawImage(B,0,0,cv.width,cv.height);
  X.globalCompositeOperation='soft-light';X.globalAlpha=.55;const g=X.createLinearGradient(0,0,cv.width,cv.height);g.addColorStop(0,GR[ti]);g.addColorStop(1,'rgba(20,30,70,.5)');X.fillStyle=g;X.fillRect(0,0,cv.width,cv.height);X.restore()}}}
