/* Stellar Drive: 3D highway racer. Vehicles are extruded from real side profiles (hood, windshield, roof, trunk, wheels, lights).
   Traffic keeps its lane, brakes behind slower cars, signals, then changes lanes. In Two-way mode the left lanes carry oncoming cars. */
export default async function(root,api){
const T=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
const{Scene,PerspectiveCamera,WebGLRenderer,Color,Fog,Group,Mesh,BoxGeometry,CylinderGeometry,ConeGeometry,ExtrudeGeometry,Shape,PlaneGeometry,MeshStandardMaterial,MeshLambertMaterial,MeshBasicMaterial,InstancedMesh,Object3D,HemisphereLight,DirectionalLight,CanvasTexture,RepeatWrapping,SRGBColorSpace,AdditiveBlending,Points,BufferGeometry,Float32BufferAttribute,PointsMaterial,Vector3,PCFSoftShadowMap,PMREMGenerator,EquirectangularReflectionMapping,MeshPhysicalMaterial}=T;
const cl=(v,a,b)=>Math.min(b,Math.max(a,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0],cfg=api.cfg;
const coarse=matchMedia('(pointer:coarse)').matches,RMo=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- HUD and menus ---------- */
const ui=document.createElement('div');ui.style.cssText='position:absolute;inset:0;pointer-events:none;color:#f4f4f2;font:600 15px system-ui;user-select:none;-webkit-user-select:none';
ui.innerHTML=`<style>
.hs{position:absolute;left:16px;top:calc(env(safe-area-inset-top,0px) + 14px)}.hs b{font:800 clamp(3.2rem,10vw,5.6rem)/.85 "Barlow Condensed","Arial Narrow",sans-serif}.hs span{margin-left:.4rem;color:#b9bcc2}.hs small{display:block;margin-top:6px;color:#b9bcc2}
.hr{position:absolute;right:14px;top:calc(env(safe-area-inset-top,0px) + 12px);display:grid;gap:.25rem;justify-items:end;text-align:right}
.br{width:150px;height:6px;border-radius:9px;background:rgba(255,255,255,.18);overflow:hidden;margin-top:6px}.br i{display:block;height:100%;width:0}
.cb{position:absolute;left:0;right:0;top:30%;text-align:center;font:800 2.2rem "Barlow Condensed","Arial Narrow",sans-serif;text-transform:uppercase;color:#ff3b3b;opacity:0;transition:opacity .25s}.cb.on{opacity:1}
.fl,.vg{position:absolute;inset:0;opacity:0}.fl{background:#ff3b3b;transition:opacity .5s}.vg{background:radial-gradient(ellipse at center,transparent 52%,rgba(0,0,0,.6))}
.tb{position:absolute;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);min-width:60px;height:60px;padding:0 .8rem;border-radius:30px;border:1px solid rgba(255,255,255,.3);background:rgba(20,21,23,.55);color:#fff;font:700 14px system-ui;display:grid;place-items:center;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none}
</style><div class="vg"></div><div class="fl"></div>
<div class="hs"><b id="sp">0</b><span>km/h</span><div class="br"><i id="rp" style="background:#ffc83d"></i></div><div class="br"><i id="ni" style="background:#3bb7ff"></i></div><small id="gr"></small></div>
<div class="hr"><button class="bt" data-a="pause" type="button" style="pointer-events:auto;margin:0">Pause</button><span id="di"></span><span id="sc"></span><span id="cn"></span></div>
<div class="cb"></div><div class="ov" style="display:none;pointer-events:auto"></div>
<div class="tc" style="display:none"><b class="tb" data-t="n" style="left:14px">Nitro</b><b class="tb" data-t="c" style="left:90px">Cam</b><b class="tb" data-t="h" style="right:14px">Horn</b></div>`;
const $=s=>ui.querySelector(s),flash=$('.fl'),cbo=$('.cb'),vg=$('.vg'),ovl=$('.ov'),hs=$('.hs'),hr=$('.hr');
const ov=h=>{ovl.innerHTML=h?`<div>${h}</div>`:'';ovl.style.display=h?'grid':'none'};
if(coarse)$('.tc').style.display='block';

/* ---------- renderer and scene ---------- */
const sc=new Scene(),cam=new PerspectiveCamera(62,1,.1,600);
const R=new WebGLRenderer({antialias:cfg.q!=='low',powerPreference:'high-performance'});
R.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';R.shadowMap.type=PCFSoftShadowMap;
root.append(R.domElement,ui);
sc.background=new Color(0x7fb7e6);sc.fog=new Fog(0x7fb7e6,60,380);
const hemi=new HemisphereLight(0xcfe0ff,0x2b3038,1.25),sun=new DirectionalLight(0xfff0d8,2.2);
sun.position.set(-18,40,15);sun.target.position.set(0,0,-15);Object.assign(sun.shadow.camera,{left:-30,right:30,top:45,bottom:-45,near:1,far:140});sun.shadow.camera.updateProjectionMatrix();sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;
sc.add(hemi,sun,sun.target);
/* reflections: a painted sky is baked into an environment map so glass, paint and chrome have something to mirror */
const ENVM=[];
{const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
 g.addColorStop(0,'#4f86c6');g.addColorStop(.42,'#cfe3f5');g.addColorStop(.5,'#fff6e6');g.addColorStop(.52,'#6d7378');g.addColorStop(1,'#1d2125');x.fillStyle=g;x.fillRect(0,0,512,256);
 x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.ellipse(150,70,22,14,0,0,7);x.fill();x.fillStyle='rgba(255,255,255,.55)';for(const[a,b,w,h]of[[300,50,90,10],[380,95,60,8],[60,40,70,9]])x.fillRect(a,b,w,h);
 const tx=new CanvasTexture(c);tx.mapping=EquirectangularReflectionMapping;tx.colorSpace=SRGBColorSpace;const pg=new PMREMGenerator(R);sc.environment=pg.fromEquirectangular(tx).texture;pg.dispose()}

/* ---------- vehicle models ---------- */
const GL=new MeshStandardMaterial({color:0x2d4558,roughness:.03,metalness:1}),CBN=new MeshStandardMaterial({color:0x101113,roughness:.4,metalness:.35}),CHR=new MeshStandardMaterial({color:0xdde2e8,roughness:.1,metalness:1}),PLT=new MeshStandardMaterial({color:0xf2f2ee,roughness:.6}),TRM=new MeshLambertMaterial({color:0x0d0e10}),RMM=new MeshStandardMaterial({color:0xb9bec6,roughness:.45,metalness:.1}),DKM=new MeshLambertMaterial({color:0x1a1c20}),HLM=new MeshBasicMaterial({color:0xfff4d2});
ENVM.push(GL,CHR,CBN);const paint=c=>{const m=cfg.q==='high'?new MeshPhysicalMaterial({color:c,roughness:.32,metalness:.5,clearcoat:1,clearcoatRoughness:.1}):new MeshStandardMaterial({color:c,roughness:.3,metalness:.5});ENVM.push(m);return m};
const shp=p=>{const s=new Shape();p.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));return s};
function ext(p,w,m,b=.07){const g=new ExtrudeGeometry(shp(p),{depth:w-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2});g.translate(0,0,-(w-2*b)/2);g.rotateY(Math.PI/2);return new Mesh(g,m)}
/* [length,width,beltline,roof,hood,cabin,windshield rake,rear rake,trunk drop] */
const KD={taxi:[4.6,1.8,.9,1.42,1.25,2.05,.65,.8,.1],hatch:[3.9,1.72,.86,1.46,.85,2,.55,.25,0],sedan:[4.6,1.8,.9,1.42,1.25,2.05,.65,.8,.1],suv:[4.7,1.95,1.08,1.8,1.15,2.7,.5,.2,0],wagon:[4.8,1.82,.9,1.46,1.2,2.8,.6,.35,0],gt:[4.5,1.95,.78,1.2,1.5,1.45,.55,.5,.05],van:[5,2,1.15,2.15,.8,3.4,.55,.1,0],pickup:[5.3,2,1,1.78,1.2,1.7,.6,.1,0]};
const SPD={taxi:[24,34],bus:[18,24],hatch:[22,30],sedan:[24,34],suv:[24,32],wagon:[22,30],gt:[36,48],van:[20,26],pickup:[22,30],truck:[16,22]};
const COLS=[0xdfe3e8,0x1d2025,0x8a8f96,0xa32b2b,0x2d5d9c,0x3b7a57,0xd9b13a,0x6b4b2e,0xeeeeee,0x4b5560];
const POOL=['hatch','sedan','suv','wagon','van','pickup','truck','sedan','taxi','gt','suv','bus','sedan','wagon','van','hatch','taxi','pickup','gt','truck'];
const CARS=[{n:'Stellar FXX',k:'hyper',c:0xd4121a,top:92,acc:19,hd:1.2,df:1.6},{n:'Vanta GT',k:'gt',c:0xff7a1a,top:78,acc:15,hd:1},{n:'Meridian sedan',k:'sedan',c:0x2d5d9c,top:68,acc:12,hd:.9},{n:'Rook SUV',k:'suv',c:0x3b7a57,top:60,acc:10,hd:.8}];
function vehicle(k,col){
 if(k==='hyper')return hyper(col);
 const g=new Group(),pm=paint(col),tail=new MeshBasicMaterial({color:0x5a0d0d}),sl=new MeshBasicMaterial({color:0x3a2200}),sr=new MeshBasicMaterial({color:0x3a2200}),wh=[];
 const bx=(w,h,l,m,x,y,z)=>{const q=new Mesh(new BoxGeometry(w,h,l),m);q.position.set(x,y,z);g.add(q);return q};
 const wl=(x,z,r)=>{const w=new Group(),t=new Mesh(new CylinderGeometry(r,r,.3,18),TRM),m=new Mesh(new CylinderGeometry(r*.6,r*.6,.32,10),RMM),s=new Mesh(new BoxGeometry(.34,r*1.1,.07),DKM);t.rotation.z=m.rotation.z=Math.PI/2;w.add(t,m,s);for(const a of[1.047,2.094]){const q=s.clone();q.rotation.x=a;w.add(q)}w.position.set(x,r,z);g.add(w);wh.push(w)};
 let L,W,hb,r=.34,ax,hz=1;
 if(k==='truck'){L=11.4;W=2.5;r=.5;hb=1.7;
  g.add(ext([[3,.55],[5.7,.55],[5.7,1.7],[5.3,2.1],[5.05,3.2],[3.2,3.3],[3,2.8]],W,pm));
  g.add(ext([[5.2,2.15],[4.98,3.1],[4.2,3.1],[4.2,2.15]],W+.04,GL,.02));
  bx(W,2.75,8.5,new MeshLambertMaterial({color:pick(COLS)}),0,2.45,1.45);bx(W-.2,.5,8,DKM,0,.85,1.45);
  ax=[[4.6,1],[2.9,2],[-3.7,2],[-4.8,2]]}
 else if(k==='bus'){L=11;W=2.5;r=.5;hb=2.3;g.add(ext([[-5.5,.5],[5.5,.5],[5.5,3.3],[5.3,3.45],[-5.3,3.45],[-5.5,3.2]],W,pm));g.add(ext([[5.45,1.25],[5.45,3.05],[-5.2,3.05],[-5.2,1.25]],W+.04,GL,.02));bx(W+.02,.12,10.6,DKM,0,1.2,0);ax=[[3.7,1],[-3.5,1]]}
 else{const[l,w,h,hr,ho,cb,ws,rs,dr]=KD[k],xf=l/2,xw=xf-ho,xr=xw-cb;L=l;W=w;hb=h;hz=xw+.2;
  g.add(ext([[-xf,.34],[xf,.34],[xf,hb-.3],[xf-.3,hb-.06],[xw,hb],[xr,hb-dr],[-xf+.05,hb-dr-.04],[-xf,hb-.32]],W,pm));
  g.add(ext([[xw,hb-.02],[xw-ws,hr],[xr+rs,hr],[xr,hb-dr-.02]],W-.14,GL,.03));
  bx(W-.08,.07,xw-ws-xr-rs+.12,pm,0,hr+.02,-((xw-ws)+(xr+rs))/2);
  if(k==='taxi'){pm.color.setHex(0xf2c200);bx(.6,.17,.3,HLM,0,hr+.13,-((xw-ws)+(xr+rs))/2)}
  if(k==='wagon'||k==='suv')for(const s of[-1,1])bx(.04,.05,xw-ws-xr-rs,DKM,s*(W/2-.2),hr+.07,-((xw-ws)+(xr+rs))/2);
  if(k==='gt'){bx(W-.3,.05,.45,pm,0,hb+.3,xf-.4);for(const s of[-1,1])bx(.06,.28,.12,DKM,s*.6,hb+.15,xf-.4)}
  if(k==='pickup')bx(W-.1,.3,1.9,DKM,0,hb+.15,xf-1.1);
  for(const s of[-1,1])bx(.1,.1,.22,pm,s*(W/2+.05),hb+.12,-(xw-.15));
  ax=[[xf-.85,1],[-(xf-.85),1]]}
 const fz=-(L/2),rz=L/2;
 bx(W-.06,.26,.16,DKM,0,.46,fz);bx(W-.06,.24,.16,DKM,0,.46,rz);bx(.52,.13,.03,PLT,0,.5,fz-.09);bx(.52,.13,.03,PLT,0,.5,rz+.09);   /* bumpers and plates */
 if(k!=='truck'&&k!=='bus'){bx(W*.5,.12,.04,DKM,0,hb-.3,fz-.02);for(const s of[-1,1]){bx(.03,.03,L*.62,CHR,s*(W/2+.015),hb-.08,0);bx(.04,hb-.55,.03,DKM,s*(W/2+.012),.55+(hb-.55)/2,.2)}}   /* grille, chrome beltline, door shut lines */
 for(const[x,n]of ax)for(const s of[-1,1])for(let j=0;j<n;j++)wl(s*(W/2-.05-j*.45),-x,r);
 for(const s of[-1,1]){bx(.38,.14,.1,HLM,s*W*.33,hb-.22,-(L/2-.08));bx(.4,.13,.06,tail,s*W*.34,hb-.26,L/2);for(const z of[-(L/2-.04),L/2-.04])bx(.1,.1,.1,s<0?sl:sr,s*(W/2-.08),hb-.4,z)}
 const sh=new Mesh(new PlaneGeometry(W+.5,L+.5),new MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.03;g.add(sh);
 g.traverse(q=>{if(q.isMesh&&q!==sh)q.castShadow=true});
 return{g,pm,tail,sl,sr,wh,len:L,wid:W,r,hz,kind:k,spd:SPD[k]}}

/* ---------- Stellar FXX: original hypercar, built from a side profile plus aero parts ---------- */
function hyper(col){
 const g=new Group(),pm=paint(col),tail=new MeshBasicMaterial({color:0x5a0d0d}),sl=new MeshBasicMaterial({color:0x3a2200}),sr=new MeshBasicMaterial({color:0x3a2200}),wh=[],W=2,L=4.9;
 const bx=(w,h,l,m,x,y,z)=>{const q=new Mesh(new BoxGeometry(w,h,l),m);q.position.set(x,y,z);g.add(q);return q};
 g.add(ext([[-2.42,.3],[2.4,.3],[2.46,.5],[1.75,.64],[.75,.76],[-.1,.8],[-1.2,.9],[-2.3,1],[-2.45,.82]],W,pm,.08));   /* tub: low nose, rising tail */
 g.add(ext([[.7,.78],[.1,1.12],[-.7,1.14],[-1.3,.92],[-1.45,.86]],W-.5,GL,.04));bx(W-.55,.06,.85,pm,0,1.15,.4);        /* greenhouse and roof */
 bx(1.2,.05,1,GL,0,1.04,1.55);for(let i=0;i<4;i++)bx(1.2,.03,.04,CBN,0,1.07,1.2+i*.22);                                   /* engine cover and louvres */
 for(const s of[-1,1]){bx(.1,.3,1,CBN,s*(W/2+.01),.62,.5);bx(.1,.2,.5,CBN,s*(W/2+.01),.5,-1.1);bx(.05,.5,.05,CBN,s*(W/2+.01),.62,-.15);bx(.06,.09,.3,CBN,s*(W/2-.05),.9,-.5);
  bx(.6,.07,.12,HLM,s*.68,.56,-2.4);bx(.5,.03,.05,HLM,s*.7,.5,-2.43);bx(.06,.45,.7,CBN,s*.97,1.38,2.12);bx(.05,.4,.05,CBN,s*.5,1.17,2.1);bx(.1,.3,.5,CBN,s*.8,.35,2.2);
  bx(.35,.1,.06,tail,s*.8,.66,2.45);bx(.1,.08,.06,s<0?sl:sr,s*.92,.54,2.45);bx(.1,.08,.06,s<0?sl:sr,s*.92,.5,-2.44);
  const cy=new Mesh(new CylinderGeometry(.06,.06,.25,10),CHR);cy.rotation.x=Math.PI/2;cy.position.set(s*.22,.46,2.42);g.add(cy)}                  /* intakes, lights, wing endplates, exhausts */
 bx(2,.05,.7,CBN,0,1.45,2.12);bx(2,.025,.3,CBN,0,1.5,2);bx(W+.1,.04,.55,CBN,0,.3,-2.3);bx(1.7,.07,.5,CBN,0,.3,2.3);bx(1.5,.07,.05,tail,0,.74,2.46);
 const pc=document.createElement('canvas');pc.width=256;pc.height=64;{const x=pc.getContext('2d');x.fillStyle='#f4f4f0';x.fillRect(0,0,256,64);x.strokeStyle='#d4121a';x.lineWidth=4;x.strokeRect(2,2,252,60);x.fillStyle='#111';x.font='800 40px "Barlow Condensed","Arial Narrow",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('STELLAR',128,35)}
 const pl=new Mesh(new PlaneGeometry(.62,.16),new MeshBasicMaterial({map:new CanvasTexture(pc)}));pl.position.set(0,.62,2.47);g.add(pl);                  /* rear plate */
 const wl=(x,z,r,wd)=>{const w=new Group(),t=new Mesh(new CylinderGeometry(r,r,wd,24),TRM),m=new Mesh(new CylinderGeometry(r*.68,r*.68,wd+.02,16),CHR);t.rotation.z=m.rotation.z=Math.PI/2;w.add(t,m);for(let i=0;i<3;i++){const q=new Mesh(new BoxGeometry(wd+.04,r*1.25,.06),CBN);q.rotation.x=i*Math.PI/3;w.add(q)}w.position.set(x,r,z);g.add(w);wh.push(w)};
 for(const s of[-1,1]){wl(s*.92,-1.5,.34,.3);wl(s*.92,1.45,.38,.4)}
 const sh=new Mesh(new PlaneGeometry(W+.5,L+.5),new MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.03;g.add(sh);g.traverse(q=>{if(q.isMesh&&q!==sh)q.castShadow=true});
 return{g,pm,tail,sl,sr,wh,len:L,wid:W,r:.36,hz:-.35,kind:'hyper',spd:[40,50]}}

/* ---------- road, ground, roadside ---------- */
function roadTex(two){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#2b2d31';x.fillRect(0,0,128,128);for(let i=0;i<500;i++){x.fillStyle=Math.random()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.14)';x.fillRect(Math.random()*128,Math.random()*128,1,1)}x.fillStyle='rgba(0,0,0,.09)';for(const q of[16,48,80,112]){x.fillRect(q-9,0,5,128);x.fillRect(q+4,0,5,128)}x.fillStyle='#d9d7cf';x.fillRect(2,0,4,128);x.fillRect(122,0,4,128);
 for(const px of two?[32,96]:[32,64,96])x.fillRect(px-2,0,4,64);
 if(two){x.fillStyle='#e6b422';x.fillRect(61,0,2,128);x.fillRect(65,0,2,128)}
 const t=new CanvasTexture(c);t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(1,70);t.colorSpace=SRGBColorSpace;t.anisotropy=4;return t}
const gc=document.createElement('canvas');gc.width=gc.height=128;{const x=gc.getContext('2d');x.fillStyle='#e6e6e6';x.fillRect(0,0,128,128);for(let i=0;i<900;i++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.09)':'rgba(255,255,255,.12)';x.fillRect(Math.random()*128,Math.random()*128,2,2+Math.random()*3)}}
const gt=new CanvasTexture(gc);gt.wrapS=gt.wrapT=RepeatWrapping;gt.repeat.set(36,36);gt.colorSpace=SRGBColorSpace;const ground=new Mesh(new PlaneGeometry(900,900),new MeshLambertMaterial({color:0x31502e,map:gt}));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.05,-250);ground.receiveShadow=true;sc.add(ground);
const road=new Mesh(new PlaneGeometry(14.4,700),new MeshStandardMaterial({map:roadTex(0),roughness:.62,metalness:0}));ENVM.push(road.material);road.rotation.x=-Math.PI/2;road.position.z=-250;road.receiveShadow=true;sc.add(road);
for(const s of[-1,1]){const w=new Mesh(new BoxGeometry(.35,.8,700),new MeshLambertMaterial({color:0x8a8d92}));w.position.set(s*7.6,.4,-250);sc.add(w)}
const D3=new Object3D(),mi=(geo,n,mat)=>{const m=new InstancedMesh(geo,mat||new MeshLambertMaterial({color:0xffffff}),n);m.frustumCulled=false;sc.add(m);return m};
const zf=(z0,Lp)=>60-(((z0-dist)%Lp)+Lp)%Lp;
const NT=90,NB=30,NL=14;
/* buildings: window facades that glow at night, in three heights */
const fac=document.createElement('canvas'),glw=document.createElement('canvas');fac.width=fac.height=glw.width=glw.height=128;
{const a=fac.getContext('2d'),b=glw.getContext('2d');a.fillStyle='#c9ccd1';a.fillRect(0,0,128,128);b.fillStyle='#000';b.fillRect(0,0,128,128);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=i*32+6,y=j*32+7;a.fillStyle='#2a3a4c';a.fillRect(x,y,20,18);a.fillStyle='rgba(255,255,255,.25)';a.fillRect(x,y,20,3);a.fillStyle='rgba(0,0,0,.15)';a.fillRect(i*32,j*32+30,32,2);if(Math.random()<.45){b.fillStyle=Math.random()<.5?'#ffd9a0':'#bfe3ff';b.fillRect(x,y,20,18)}}}
const bt=c=>{const t=new CanvasTexture(c);t.wrapS=t.wrapT=RepeatWrapping;t.colorSpace=SRGBColorSpace;t.anisotropy=4;return t};
const bm=new MeshLambertMaterial({map:bt(fac),emissiveMap:bt(glw),emissive:0xffffff,emissiveIntensity:0});
const bgeo=(w,h,l)=>{const g=new BoxGeometry(w,h,l),uv=g.attributes.uv,n=g.attributes.normal;for(let i=0;i<uv.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));if(ay>.5)uv.setXY(i,0,0);else uv.setXY(i,uv.getX(i)*(ax>.5?l/12:w/12),uv.getY(i)*h/14)}return g};
const bV=[bgeo(12,16,14),bgeo(12,28,14),bgeo(14,48,14)].map(g=>mi(g,10,bm));
const tF=mi(new ConeGeometry(2.1,5.6,7),NT),tF2=mi(new ConeGeometry(1.5,3.6,7),NT),tK=mi(new CylinderGeometry(.25,.32,1.8,6),NT,new MeshLambertMaterial({color:0x4a3524})),pl=mi(new BoxGeometry(.2,6.4,.2),NL*2),lh=mi(new BoxGeometry(.9,.16,.45),NL*2,new MeshBasicMaterial({color:0xffe2b0}));
const td=[...Array(NT)].map((_,i)=>({s:i%2?1:-1,x:rnd(10,19),z:rnd(0,420),sc:rnd(.8,1.5)})),bd=[...Array(NB)].map((_,i)=>({s:i%2?1:-1,x:rnd(24,46),v:i%3,j:i/3|0,z:rnd(0,420),sx:rnd(.85,1.2),sy:rnd(.9,1.15)}));
td.forEach((t,i)=>{const c=new Color().setHSL(rnd(.24,.34),.45,rnd(.14,.26));tF.setColorAt(i,c);tF2.setColorAt(i,c.clone().offsetHSL(0,0,.04))});bd.forEach(b=>bV[b.v].setColorAt(b.j,new Color().setHSL(rnd(.05,.65),.08,rnd(.55,.9))));tF.instanceColor.needsUpdate=tF2.instanceColor.needsUpdate=true;bV.forEach(m=>m.instanceColor.needsUpdate=true);
const bc=document.createElement('canvas');bc.width=64;bc.height=128;{const x=bc.getContext('2d'),a=x.createLinearGradient(0,128,0,0);a.addColorStop(0,'rgba(255,240,200,.9)');a.addColorStop(1,'rgba(255,240,200,0)');x.fillStyle=a;x.fillRect(0,0,64,128);x.globalCompositeOperation='destination-in';const b=x.createLinearGradient(0,0,64,0);b.addColorStop(0,'rgba(0,0,0,0)');b.addColorStop(.5,'rgba(0,0,0,1)');b.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=b;x.fillRect(0,0,64,128)}
const beam=new Mesh(new PlaneGeometry(7.5,48),new MeshBasicMaterial({map:new CanvasTexture(bc),transparent:true,opacity:0,depthWrite:false,blending:AdditiveBlending,fog:false}));beam.rotation.x=-Math.PI/2;beam.position.set(0,.06,-26);sc.add(beam);
const gan=new Group();{const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#0d5a3c';x.fillRect(0,0,512,128);x.strokeStyle='#fff';x.lineWidth=6;x.strokeRect(8,8,496,112);x.fillStyle='#fff';x.font='800 64px "Barlow Condensed","Arial Narrow",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('STELLAR CITY   12 km',256,68);
 const sgn=new Mesh(new PlaneGeometry(10,2.5),new MeshBasicMaterial({map:new CanvasTexture(c)}));sgn.position.set(0,6.4,.2);const m=new MeshLambertMaterial({color:0x8a8d92});
 for(const s of[-1,1]){const q=new Mesh(new BoxGeometry(.5,7.4,.5),m);q.position.set(s*8.6,3.7,0);gan.add(q)}const bm2=new Mesh(new BoxGeometry(18,.5,.6),m);bm2.position.set(0,7.5,0);gan.add(bm2,sgn)}sc.add(gan);
const sg=new BufferGeometry(),spt=[];for(let i=0;i<260;i++){const a=Math.random()*6.283,e=Math.random()*1.3+.1;spt.push(Math.cos(a)*Math.cos(e)*480,Math.sin(e)*380+20,Math.sin(a)*Math.cos(e)*480)}sg.setAttribute('position',new Float32BufferAttribute(spt,3));
const stars=new Points(sg,new PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,fog:false,transparent:true,opacity:0}));stars.frustumCulled=false;sc.add(stars);

/* ---------- state ---------- */
const tr=POOL.map(k=>{const o=vehicle(k,pick(COLS));Object.assign(o,{d:-999,pd:-999,x:0,li:0,s:25,pv:25,on:false,ch:null,cd:0,sig:0,br:false,hk:0});o.g.visible=false;sc.add(o.g);return o});
let ps=0,rs=0,nCap=tr.length,ci=0,C=CARS[0],P=null;
function buildP(){if(P)sc.remove(P.g);P=vehicle(C.k,C.c);sc.add(P.g)}buildP();
let st='menu',paused=false,M=0,mode=0,v=0,px=0,vx=0,dist=0,time=0,bonus=0,combo=0,ct=0,nm=0,pass=0,top=0,nitro=60,used=0,shake=0,crashT=0,spinZ=0,spinY=0,cm=(+api.get('cam')||0)%4,gear=1,rpm=.3,dark=0,lights=false,hornT=0,hudT=0,raf=0,lt=performance.now(),accl=0,brk=false,nAct=8;
const keys={},tp={},tried=new Set(),LX=[-5.4,-1.8,1.8,5.4],CAMS=['Chase','Far chase','Hood','Bumper'],GS=[0,13,23,34,46,60],ptr=new Map();
const camPos=new Vector3(0,3,8.6),camLook=new Vector3(0,1,-20),tv=new Vector3(),tl=new Vector3();

/* graphics settings: quality and render resolution apply live */
const PRs={low:.7,med:1,high:Math.min(devicePixelRatio||1,2)};
function applyG(){const q=cfg.q,hi=q==='high',w=root.clientWidth||1,h=root.clientHeight||1,was=R.shadowMap.enabled;
 R.setPixelRatio(cl(PRs[q]*cfg.scale,.3,3));R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
 R.shadowMap.enabled=sun.castShadow=hi;if(was!==hi)sc.traverse(o=>{if(o.material)o.material.needsUpdate=true});
 sc.fog.far=q==='low'?230:380;const f=q==='low'?.5:1;tF.count=tK.count=tF2.count=Math.floor(NT*f);bV.forEach(m=>m.count=Math.floor(10*f));nCap=q==='low'?12:tr.length}

/* day and night follow distance */
const PAL=[[0x7fb7e6,2.2,1.25,0x31502e],[0xe0833c,1.5,.9,0x2a3320],[0x1f3248,.7,.55,0x1b2418],[0x06080c,.3,.3,0x0b100b]],DKN=[0,.3,.75,1],ca=new Color(),cb=new Color();
function env(){const t=dist/2200,i=Math.floor(t)%4,f=t%1,a=PAL[i],b=PAL[(i+1)%4];
 ca.setHex(a[0]).lerp(cb.setHex(b[0]),f);sc.background.copy(ca);sc.fog.color.copy(ca);
 sun.intensity=a[1]+(b[1]-a[1])*f;hemi.intensity=a[2]+(b[2]-a[2])*f;
 ca.setHex(a[3]).lerp(cb.setHex(b[3]),f);ground.material.color.copy(ca);
 dark=DKN[i]+(DKN[(i+1)%4]-DKN[i])*f;stars.material.opacity=cl((dark-.5)*2,0,1);const ei=.25+.85*(1-dark);for(const m of ENVM)m.envMapIntensity=ei*(m===GL?1.6:1);bm.emissiveIntensity=dark*1.3;if(dark>.7)api.unlock('dusk')}

/* ---------- traffic ---------- */
function spawn(o,far){
 for(let t=0;t<12;t++){const l=Math.random()*4|0,x=LX[l],d=far?rnd(240,440):rnd(70,280);
  if(tr.some(q=>q!==o&&q.on&&Math.abs(q.x-x)<2.4&&Math.abs(q.d-d)<(q.len+o.len)/2+30))continue;
  o.li=l;o.x=x;o.d=d;o.pv=rnd(o.spd[0],o.spd[1])*(mode&&l<2?-1:1);o.s=o.pv;o.ch=null;o.cd=rnd(1,5);o.sig=0;o.br=false;o.hk=0;o.on=true;o.g.visible=true;if(o.kind!=='taxi')o.pm.color.setHex(pick(COLS));return}
 o.on=false;o.g.visible=false}
function laneFree(l,o){const x=LX[l];for(const q of tr)if(q!==o&&q.on&&Math.abs(q.x-x)<2.4&&Math.abs(q.d-o.d)<(q.len+o.len)/2+16)return false;return!(Math.abs(px-x)<2.6&&Math.abs(o.d)<(P.len+o.len)/2+14)}

/* ---------- sound: each car has its own engine voice, plus wind, tyre squeal and shift pops ---------- */
const EP={hyper:{w1:'sawtooth',w2:'square',b:44,r:230,c:1700,v:.05,p:1},gt:{w1:'sawtooth',w2:'square',b:34,r:150,c:950,v:.05,p:.5},sedan:{w1:'sawtooth',w2:'triangle',b:30,r:105,c:700,v:.045,p:0},suv:{w1:'square',w2:'triangle',b:24,r:85,c:520,v:.05,p:0}};
const EN=(()=>{let c,nb,o,f,g,wg,sg,ns=[],on=0,pr=EP.sedan,lr=0;
 const ctx=()=>{if(!c){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;c=new C();nb=c.createBuffer(1,c.sampleRate,c.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}if(c.state!=='running')c.resume();return c};
 const nz=(type,fq,q)=>{const s=c.createBufferSource(),b=c.createBiquadFilter(),a=c.createGain();s.buffer=nb;s.loop=true;b.type=type;b.frequency.value=fq;b.Q.value=q;a.gain.value=0;s.connect(b);b.connect(a);a.connect(c.destination);s.start();ns.push(s);return a};
 return{start(k){if(on||!cfg.sfx||!ctx())return;pr=EP[k]||EP.sedan;o=[c.createOscillator(),c.createOscillator(),c.createOscillator()];[pr.w1,pr.w2,'sine'].forEach((w,i)=>o[i].type=w);f=c.createBiquadFilter();f.type='lowpass';g=c.createGain();g.gain.value=0;o.forEach(q=>{q.connect(f);q.start()});f.connect(g);g.connect(c.destination);wg=nz('bandpass',700,.7);sg=nz('bandpass',2400,6);on=1},
  set(r,t,v,vx,br){if(!on)return;const n=c.currentTime,F=pr.b+r*pr.r,s=cfg.sfx?1:0;o[0].frequency.setTargetAtTime(F,n,.03);o[1].frequency.setTargetAtTime(F*.5,n,.03);o[2].frequency.setTargetAtTime(F*.25,n,.03);f.frequency.setTargetAtTime(220+(t+r*.8)*pr.c,n,.05);g.gain.setTargetAtTime(s*(pr.v+t*pr.v*1.1+r*.03),n,.05);wg.gain.setTargetAtTime(s*Math.min(.12,v*.0016),n,.1);sg.gain.setTargetAtTime(s*cl((Math.abs(vx)-3.2)*.03+(br&&v>25?.04:0),0,.09),n,.05);if(pr.p&&lr-r>.3&&t<.6)this.pop();lr=r},
  pop(){if(!on)return;const n=c.currentTime,b=c.createBufferSource(),h=c.createBiquadFilter(),q=c.createGain();b.buffer=nb;h.type='highpass';h.frequency.value=2500;q.gain.setValueAtTime(.1*pr.p,n);q.gain.exponentialRampToValueAtTime(.001,n+.18);b.connect(h);h.connect(q);q.connect(c.destination);b.start(n);b.stop(n+.2)},
  stop(){if(!on)return;on=0;[...o,...ns].forEach(q=>{try{q.stop()}catch(e){}});ns=[];g.disconnect()}}})();

/* ---------- gameplay ---------- */
function near(o){combo++;ct=3.2;nm++;const onc=o.s<0,b=(onc?100:50)*Math.min(combo,10);bonus+=b;nitro=Math.min(100,nitro+(onc?10:6));cbo.textContent=`Near miss +${b}${combo>1?'  x'+combo:''}`;cbo.classList.add('on');api.sfx('near');api.unlock('near');if(combo>=8)api.unlock('hair');if(onc)api.add('wrong')}
function crash(o){if(st!=='run')return;st='crash';crashT=0;if(v*3.6>200)api.unlock('wreck');api.sfx('crash');EN.stop();shake=1.4;flash.style.opacity=.55;setTimeout(()=>flash.style.opacity=0,350);spinZ=rnd(-5,5);spinY=rnd(-3,3);vx+=(px-o.x)*2;combo=0;ct=0;cbo.classList.remove('on')}
function finish(){st='over';const s=Math.floor(dist/10)+bonus,nb=api.best('racer',s);
 ov(`<h3>Wrecked</h3><p>Score <b>${s.toLocaleString()}</b>${nb?' (new best)':''}</p><p>${(dist/1000).toFixed(2)} km, top speed ${Math.round(top*3.6)} km/h</p><p>${nm} near misses, ${pass} cars passed</p><p>Best ${api.getBest('racer').toLocaleString()}</p><div class="row"><button class="bt pri" data-a="go" type="button">Play again (Space)</button><button class="bt" data-a="menu" type="button">Car and mode</button><button class="bt" data-a="exit" type="button">Exit</button></div>${api.strip(1)}`)}
function crashStep(dt){crashT+=dt;const k=cl(.25+crashT*.45,.25,1),d=dt*k;v*=Math.exp(-1.4*d);dist+=v*d;px+=vx*d;vx*=Math.exp(-d);shake=Math.max(0,shake-dt*.8);
 for(const o of tr)if(o.on)o.d-=(v-o.s)*d;
 spinZ*=Math.exp(-1.5*d);spinY*=Math.exp(-1.5*d);P.g.rotation.z+=spinZ*d;P.g.rotation.y+=spinY*d;P.g.position.set(px,Math.abs(Math.sin(crashT*4))*Math.max(0,1.3-crashT),0);
 if(crashT>1.7&&st==='crash')finish()}
function horn(){if(hornT>0)return;hornT=.35;api.sfx('horn');api.add('horn');for(const o of tr)if(o.on&&o.s>0&&Math.abs(o.x-px)<2.4&&o.d>0&&o.d<70)o.hk=1}
function camNext(){cm=(cm+1)%4;tried.add(cm);api.put('cam',cm);if(tried.size>=4)api.unlock('tour');api.sfx('click')}
function step(dt){
 hornT-=dt;brk=!!(keys.KeyS||keys.ArrowDown||tp.b);
 const thr=!!(keys.KeyW||keys.ArrowUp||coarse),nit=!!(keys.ShiftLeft||keys.ShiftRight||tp.n)&&nitro>0&&thr&&!brk;
 const cap=Math.min(C.top,36+dist/60)+(nit?12:0);let a;
 if(brk)a=-46;else if(thr)a=C.acc*(nit?1.9:1)*Math.max(0,1-v/cap);else a=-(3+v*.025);
 if(v>cap)a-=6;accl=a;v=cl(v+a*dt,0,cap+4);top=Math.max(top,v);
 if(nit){nitro=Math.max(0,nitro-24*dt);used+=24*dt;if(used>=95)api.unlock('burn');if(!tp.ns){tp.ns=1;api.sfx('nitro')}}else{tp.ns=0;nitro=Math.min(100,nitro+3*dt)}
 let gg=1;for(let i=0;i<GS.length;i++)if(v>=GS[i])gg=i+1;if(gg!==gear){gear=gg;api.sfx('gear')}
 const lo=GS[gear-1],hi=GS[gear]||C.top+4;rpm=.28+.72*cl((v-lo)/(hi-lo),0,1);EN.set(rpm,thr&&!brk?1:.2,v,vx,brk);
 const dir=((keys.KeyD||keys.ArrowRight||tp.r)?1:0)-((keys.KeyA||keys.ArrowLeft||tp.l)?1:0);
 const df=C.df||1;vx+=dir*(64+30*C.hd)*dt*cl(1.3-v/(105*df),.35,1);vx*=Math.exp(-(6.2+Math.min(v,80)*.02*df)*dt);px+=vx*dt;
 const lim=7.2-P.wid/2-.1;if(Math.abs(px)>lim){px=cl(px,-lim,lim);vx=0;v*=1-.5*dt;shake=Math.max(shake,.25)}
 dist+=v*dt;if(ct>0){ct-=dt;if(ct<=0){combo=0;cbo.classList.remove('on')}}
 nAct=Math.min(nCap,8+(dist/500|0)*2);
 if(v*3.6>=250)api.unlock('red');if(dist>=5000)api.unlock('haul');
 for(let i=0;i<tr.length;i++){const o=tr[i];
  if(i>=nAct){o.on=false;o.g.visible=false;continue}
  if(!o.on){spawn(o,1);continue}
  o.pd=o.d;
  if(o.s>0){
   let gap=1e9,ls=o.pv;
   for(const q of tr)if(q!==o&&q.on&&q.s>0&&Math.abs(q.x-o.x)<2.3&&q.d>o.d){const gp=q.d-o.d-(q.len+o.len)/2;if(gp<gap){gap=gp;ls=q.s}}
   if(o.d<0&&Math.abs(px-o.x)<2.3){const gp=-o.d-(o.len+P.len)/2;if(gp<gap){gap=gp;ls=v}}
   const want=6+o.s*.8;let ac=2.6*(1-o.s/o.pv);
   if(gap<want)ac=-Math.min(10,(want-gap)/want*12+Math.max(0,o.s-ls)*.8);
   if(o.sb>0){ac=-7;o.sb-=dt}else if(o.d>40&&o.d<220&&o.s>14&&Math.random()<dt*.01)o.sb=.8;o.br=ac<-1.5;o.s=cl(o.s+ac*dt,0,o.pv*1.05);
   if(o.ch){const c=o.ch;c.t+=dt;c.k=cl(c.t/1.7,0,1);const e=c.k*c.k*(3-2*c.k);o.x=c.x0+(c.x1-c.x0)*e;if(c.k>=1){o.ch=null;o.sig=0;o.cd=rnd(4,9)}}
   else{o.cd-=dt;if((o.cd<=0||o.hk)&&(o.hk||(gap<want*.9&&o.pv>o.s+1)||Math.random()<dt*.05)){o.hk=0;const c=(o.pv<25?[1,-1]:o.pv>34?[-1,1]:Math.random()<.5?[-1,1]:[1,-1]).map(q=>o.li+q).find(l=>l>=(mode?2:0)&&l<4&&laneFree(l,o));if(c!==undefined){o.ch={t:-.8,k:0,x0:o.x,x1:LX[c]};o.li=c;o.sig=LX[c]<o.x?-1:1}else o.cd=1.5}}
  }
  o.d-=(v-o.s)*dt;
  if(o.d<-70||o.d>480){spawn(o,1);continue}
  if(o.pd>0&&o.d<=0){pass++;const gx=Math.abs(o.x-px)-(o.wid+P.wid)/2;if(gx>-.05&&gx<.9)near(o)}
  if(Math.abs(o.d)<(o.len+P.len)/2-.25&&Math.abs(o.x-px)<(o.wid+P.wid)/2-.1){crash(o);return}}}

/* ---------- menus ---------- */
function menu(){st='menu';paused=false;EN.stop();api.music('drive');cbo.classList.remove('on');hs.style.display=hr.style.display='none';
 ov(`<h3>Stellar Drive</h3><p>Pick a car and a mode.</p><div class="row"><button class="bt" data-a="cp" type="button">◀</button><b>${C.n}</b><button class="bt" data-a="cn" type="button">▶</button></div><div class="row"><button class="bt${M?'':' pri'}" data-a="m0" type="button">Free ride</button><button class="bt${M?' pri':''}" data-a="m1" type="button">Two-way</button></div><p>W or Up accelerates, S or Down brakes, A D or the arrows steer, Shift is nitro. C changes camera, H is the horn, L the headlights, P pauses, R restarts.</p><p>On a touch screen, hold the left or right side to steer and the middle to brake. Throttle is automatic.</p><button class="bt pri" data-a="go" type="button">Start (Space)</button>${api.strip(1)}<p>Best ${api.getBest('racer').toLocaleString()}</p>`)}
function carStep(d){ci=(ci+d+CARS.length)%CARS.length;C=CARS[ci];buildP();menu()}
function camTarget(){const x=px;switch(cm){case 0:return[x*.6,3,8.6,x*.35,1.2,-20,62];case 1:return[x*.5,5.8,14.5,x*.3,.9,-16,58];case 2:return[x,P.kind==='hyper'?1.02:1.32,-P.hz,x,1.2,-40,74];default:return[x,.62,-(P.len/2+.05),x,.7,-45,80]}}
function start(){mode=M;buildP();road.material.map=roadTex(mode);road.material.needsUpdate=true;
 v=28;dist=0;px=LX[2];vx=0;bonus=0;combo=0;ct=0;nm=0;pass=0;top=0;nitro=60;used=0;shake=0;crashT=0;gear=1;paused=false;lights=false;
 tr.forEach(o=>{o.on=false;o.g.visible=false;o.ch=null});for(let i=0;i<8;i++)spawn(tr[i],0);
 P.g.rotation.set(0,0,0);tried.clear();tried.add(cm);const t=camTarget();camPos.set(t[0],t[1],t[2]);camLook.set(t[3],t[4],t[5]);cam.fov=t[6];
 st='run';ov('');hs.style.display=hr.style.display='';api.music('drive');EN.start(C.k);api.unlock('ign')}
function pause(on){if(st!=='run')return;paused=on;ov(on?`<h3>Paused</h3><div class="row"><button class="bt pri" data-a="res" type="button">Resume</button><button class="bt" data-a="go" type="button">Restart</button><button class="bt" data-a="menu" type="button">Car and mode</button><button class="bt" data-a="exit" type="button">Exit</button></div>${api.strip(1)}<p>Camera C, horn H, headlights L.</p>`:'');if(on)EN.stop();else EN.start(C.k)}

/* ---------- drawing ---------- */
function hud(){$('#sp').textContent=Math.round(v*3.6);$('#rp').style.width=rpm*100+'%';$('#ni').style.width=nitro+'%';$('#gr').textContent='Gear '+gear+'   Camera: '+CAMS[cm];$('#di').textContent=(dist/1000).toFixed(2)+' km';$('#sc').textContent=(Math.floor(dist/10)+bonus).toLocaleString()+' pts';$('#cn').textContent=combo>1?'Combo x'+combo:''}
function draw(dt){
 env();road.material.map.offset.y=dist/10;ground.material.map.offset.y=dist/25;gan.position.z=60-(((240-dist)%900)+900)%900;
 for(let k=0;k<tF.count;k++){const t=td[k],z=zf(t.z,420);D3.scale.set(t.sc,t.sc,t.sc);D3.position.set(t.s*t.x,3.6*t.sc+.6,z);D3.updateMatrix();tF.setMatrixAt(k,D3.matrix);D3.position.y=.9*t.sc;D3.updateMatrix();tK.setMatrixAt(k,D3.matrix);D3.position.y=6.4*t.sc;D3.updateMatrix();tF2.setMatrixAt(k,D3.matrix)}
 for(const b of bd){const m=bV[b.v];if(b.j>=m.count)continue;D3.scale.set(b.sx,b.sy,b.sx);D3.position.set(b.s*b.x,m.geometry.parameters.height*b.sy/2,zf(b.z,420));D3.updateMatrix();m.setMatrixAt(b.j,D3.matrix)}
 D3.scale.set(1,1,1);
 for(let k=0;k<NL;k++)for(let s=0;s<2;s++){const z=60-(((k*30-dist)%420)+420)%420,i=k*2+s,sx=s?1:-1;D3.position.set(sx*8.3,3.2,z);D3.updateMatrix();pl.setMatrixAt(i,D3.matrix);D3.position.set(sx*7.8,6.45,z);D3.updateMatrix();lh.setMatrixAt(i,D3.matrix)}
 for(const m of[tF,tF2,tK,pl,lh,...bV])m.instanceMatrix.needsUpdate=true;
 const blink=(time*2.6)%1<.5;
 for(const o of tr)if(o.on){o.g.position.set(o.x,0,-o.d);const yw=(o.ch&&o.ch.k>0&&o.ch.k<1)?-(o.ch.x1-o.ch.x0)*.09*Math.sin(Math.PI*o.ch.k):0;o.g.rotation.y=(o.s<0?Math.PI:0)+yw;o.g.rotation.x=o.br?-.02:0;
  o.tail.color.setHex(o.br?0xff2020:dark>.4?0xa01414:0x5a0d0d);o.sl.color.setHex(o.sig<0&&blink?0xffa000:0x3a2200);o.sr.color.setHex(o.sig>0&&blink?0xffa000:0x3a2200);for(const w of o.wh)w.rotation.x-=Math.abs(o.s)/o.r*dt}
 if(st==='menu'){P.g.position.set(0,0,0);P.g.rotation.set(0,0,0)}
 else if(st==='run'){const kk=Math.min(1,dt*6);ps+=(cl(accl*.0009,-.04,.03)-ps)*kk;rs+=(-vx*.022-rs)*kk;P.g.position.set(px,Math.sin(time*53)*.006*cl(v/50,0,1),0);P.g.rotation.set(ps,-vx*.015,rs)}
 P.tail.color.setHex(brk&&st==='run'?0xff2020:dark>.4?0xa01414:0x5a0d0d);for(const w of P.wh)w.rotation.x-=v/P.r*dt;
 if(st==='menu'){cam.position.set(Math.sin(time*.45)*7.5,2.3,Math.cos(time*.45)*7.5);cam.lookAt(0,.8,0);cam.fov=48;cam.updateProjectionMatrix()}
 else{const t=camTarget(),k=1-Math.exp(-(cm>1?40:8)*dt);camPos.lerp(tv.set(t[0],t[1],t[2]),k);camLook.lerp(tl.set(t[3],t[4],t[5]),k);
  const sh=shake+(v>55?(v-55)*.0016:0)+(tp.ns?.04:0),f=t[6]+v/80*18+(tp.ns?8:0);shake=Math.max(0,shake-dt*1.2);
  cam.fov+=(f-cam.fov)*Math.min(1,dt*5);cam.updateProjectionMatrix();cam.position.copy(camPos);if(!RMo)cam.position.add(tv.set((Math.random()-.5)*sh,(Math.random()-.5)*sh,0));cam.lookAt(camLook)}
 stars.position.copy(cam.position);vg.style.opacity=st==='menu'?0:cl((v-35)/45,0,.9);
 beam.position.x=px;beam.material.opacity=st!=='menu'&&(lights||dark>.45)?.22*(.4+.6*dark):0}
function frame(t){raf=requestAnimationFrame(frame);const dt=Math.min((t-lt)/1000,.05);lt=t;time+=dt;
 if(!paused){if(st==='run')step(dt);else if(st==='crash'||st==='over')crashStep(dt)}
 draw(dt);if(st==='run'&&!paused&&(hudT-=dt)<=0){hudT=.1;hud()}R.render(sc,cam)}

/* ---------- input ---------- */
const kd=e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(e.code==='Space'||e.code==='Enter'){if(st==='menu'||st==='over')start();return}
 if(st==='menu'){if(e.code==='ArrowLeft'||e.code==='KeyA')carStep(-1);else if(e.code==='ArrowRight'||e.code==='KeyD')carStep(1);return}
 if(e.code==='Escape'||e.code==='KeyP'){pause(!paused);return}
 if(st!=='run'||paused)return;
 if(e.code==='KeyC')camNext();else if(e.code==='KeyH')horn();else if(e.code==='KeyL'){lights=!lights;api.sfx('click')}else if(e.code==='KeyR')start()};
const ku=e=>{keys[e.code]=false;if(e.code==='Space')e.preventDefault()};
const zn=()=>{tp.l=tp.r=tp.b=false;for(const z of ptr.values())tp[z]=true};
const pd=e=>{if(e.pointerType==='mouse'||st!=='run'||e.target.closest('.ov,button,.tb'))return;const b=root.getBoundingClientRect(),f=(e.clientX-b.left)/b.width;ptr.set(e.pointerId,f<.38?'l':f>.62?'r':'b');zn()};
const pu=e=>{ptr.delete(e.pointerId);tp.n=false;zn()};
ui.addEventListener('pointerdown',e=>{const t=e.target.dataset&&e.target.dataset.t;if(!t)return;if(t==='n')tp.n=true;else if(t==='c')camNext();else if(t==='h')horn()});
ui.addEventListener('click',e=>{const a=e.target.closest('[data-a]');setTimeout(()=>document.activeElement&&document.activeElement.blur&&document.activeElement.blur(),0);if(!a)return;const k=a.dataset.a;
 if(k==='go')start();else if(k==='pause')pause(!paused);else if(k==='res')pause(false);else if(k==='menu')menu();else if(k==='exit')api.exit();
 else if(k==='cp')carStep(-1);else if(k==='cn')carStep(1);else if(k==='m0'||k==='m1'){M=+k[1];menu()}});
const vis=()=>{if(document.hidden)pause(true);lt=performance.now()};
const off=api.on(applyG),ro=new ResizeObserver(applyG);ro.observe(root);
addEventListener('keydown',kd);addEventListener('keyup',ku);root.addEventListener('pointerdown',pd);addEventListener('pointerup',pu);addEventListener('pointercancel',pu);document.addEventListener('visibilitychange',vis);
applyG();menu();raf=requestAnimationFrame(frame);
return()=>{cancelAnimationFrame(raf);off();ro.disconnect();removeEventListener('keydown',kd);removeEventListener('keyup',ku);root.removeEventListener('pointerdown',pd);removeEventListener('pointerup',pu);removeEventListener('pointercancel',pu);document.removeEventListener('visibilitychange',vis);R.dispose();R.forceContextLoss();api.music(null);EN.stop()}}
