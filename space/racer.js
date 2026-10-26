/* Stellar Drive: 3D highway racer. Winding roads and hills (the world bends around straight lane logic), six cameras, per-model engine and horn sounds,
   nitro flames, a spring-mounted body over steerable wheels, and traffic that brakes, signals, yields, honks and chases. In Two-way mode the left lanes carry oncoming cars.
   Graphics tiers: Low, Medium, High, Ultra and Stellar (ultra3d.js and stellar3d.js load on demand). */
import{createAudio}from'./carsound.js';
import{makeCars,POOL,COLS,WT,FX}from'./cars.js';
import*as TK from'./track.js';
export default async function(root,api){
const T=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
const{Scene,PerspectiveCamera,WebGLRenderer,Color,Fog,Group,Mesh,BoxGeometry,CylinderGeometry,ConeGeometry,SphereGeometry,PlaneGeometry,MeshStandardMaterial,MeshLambertMaterial,MeshBasicMaterial,InstancedMesh,Object3D,HemisphereLight,DirectionalLight,CanvasTexture,RepeatWrapping,SRGBColorSpace,AdditiveBlending,NormalBlending,Points,BufferGeometry,Float32BufferAttribute,PointsMaterial,ShaderMaterial,Vector2,Vector3,PCFSoftShadowMap,PMREMGenerator,EquirectangularReflectionMapping}=T;
const cl=(v,a,b)=>Math.min(b,Math.max(a,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0],cfg=api.cfg,SND=createAudio(cfg);
const coarse=matchMedia('(pointer:coarse)').matches,RMo=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- HUD and menus ---------- */
const ui=document.createElement('div');ui.style.cssText='position:absolute;inset:0;pointer-events:none;color:#f4f4f2;font:600 15px system-ui;user-select:none;-webkit-user-select:none';
ui.innerHTML=`<style>
.hs{position:absolute;left:16px;top:calc(env(safe-area-inset-top,0px) + 14px)}.hs b{font:800 clamp(3.2rem,10vw,5.6rem)/.85 "Barlow Condensed","Arial Narrow",sans-serif}.hs span{margin-left:.4rem;color:#b9bcc2}.hs small{display:block;margin-top:6px;color:#b9bcc2}
.hr{position:absolute;right:14px;top:calc(env(safe-area-inset-top,0px) + 12px);display:grid;gap:.25rem;justify-items:end;text-align:right}
.br{width:150px;height:6px;border-radius:9px;background:rgba(255,255,255,.18);overflow:hidden;margin-top:6px}.br i{display:block;height:100%;width:0}
.cb{position:absolute;left:0;right:0;top:30%;text-align:center;font:800 2.2rem "Barlow Condensed","Arial Narrow",sans-serif;text-transform:uppercase;color:#ff3b3b;opacity:0;transition:opacity .25s}.cb.on{opacity:1}
.fl,.vg,.ng{position:absolute;inset:0;opacity:0}.fl{background:#ff3b3b;transition:opacity .5s}.vg{background:radial-gradient(ellipse at center,transparent 52%,rgba(0,0,0,.6))}
.ng{background:radial-gradient(ellipse at center,transparent 38%,rgba(70,160,255,.5));mix-blend-mode:screen}.sl{position:absolute;inset:0;width:100%;height:100%}
.tb{position:absolute;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);min-width:60px;height:60px;padding:0 .8rem;border-radius:30px;border:1px solid rgba(255,255,255,.3);background:rgba(20,21,23,.55);color:#fff;font:700 14px system-ui;display:grid;place-items:center;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none}
.sp2{font-size:.8rem;color:#8d9198}
</style><canvas class="sl"></canvas><div class="vg"></div><div class="ng"></div><div class="fl"></div>
<div class="hs"><b id="sp">0</b><span>km/h</span><div class="br"><i id="rp" style="background:#ffc83d"></i></div><div class="br"><i id="ni" style="background:#3bb7ff"></i></div><small id="gr"></small></div>
<div class="hr"><button class="bt" data-a="pause" type="button" style="pointer-events:auto;margin:0">Pause</button><span id="di"></span><span id="sc"></span><span id="cn"></span></div>
<div class="cb"></div><div class="ov" style="display:none;pointer-events:auto"></div>
<div class="tc" style="display:none"><b class="tb" data-t="n" style="left:14px">Nitro</b><b class="tb" data-t="c" style="left:90px">Cam</b><b class="tb" data-t="h" style="right:14px">Horn</b></div>`;
const $=s=>ui.querySelector(s),flash=$('.fl'),cbo=$('.cb'),vg=$('.vg'),ng=$('.ng'),ovl=$('.ov'),hs=$('.hs'),hr=$('.hr'),slc=$('.sl'),slx=slc.getContext('2d');
const ov=h=>{ovl.innerHTML=h?`<div>${h}</div>`:'';ovl.style.display=h?'grid':'none'};
if(coarse)$('.tc').style.display='block';

/* ---------- renderer and scene ---------- */
const sc=new Scene(),cam=new PerspectiveCamera(62,1,.1,700);
const R=new WebGLRenderer({antialias:cfg.q!=='low',powerPreference:'high-performance'});
R.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';R.shadowMap.type=PCFSoftShadowMap;
root.append(R.domElement,ui);
sc.background=new Color(0x7fb7e6);sc.fog=new Fog(0x7fb7e6,60,380);
const hemi=new HemisphereLight(0xcfe0ff,0x2b3038,1.25),sun=new DirectionalLight(0xfff0d8,2.2);
sun.position.set(-18,40,15);sun.target.position.set(0,0,-15);Object.assign(sun.shadow.camera,{left:-30,right:30,top:45,bottom:-45,near:1,far:140});sun.shadow.camera.updateProjectionMatrix();sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;
sc.add(hemi,sun,sun.target);
const ENVM=[];
{const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);
 g.addColorStop(0,'#4f86c6');g.addColorStop(.42,'#cfe3f5');g.addColorStop(.5,'#fff6e6');g.addColorStop(.52,'#6d7378');g.addColorStop(1,'#1d2125');x.fillStyle=g;x.fillRect(0,0,512,256);
 x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.ellipse(150,70,22,14,0,0,7);x.fill();x.fillStyle='rgba(255,255,255,.55)';for(const[a,b,w,h]of[[300,50,90,10],[380,95,60,8],[60,40,70,9]])x.fillRect(a,b,w,h);
 const tx=new CanvasTexture(c);tx.mapping=EquirectangularReflectionMapping;tx.colorSpace=SRGBColorSpace;const pg=new PMREMGenerator(R);sc.environment=pg.fromEquirectangular(tx).texture;pg.dispose()}

/* ---------- bent world: the road curves and rolls, lane logic stays straight ---------- */
/* Every built-in material gets a vertex hook that offsets each vertex sideways and up by the road shape at its distance ahead.
   The tables come from track.js (cubic Hermite, 12 m steps). Materials with userData.nobend (stars) are left alone, and the sky dome has its own shader. */
const BEND={uBend:{value:new Float32Array(TK.N*4)},uBendK:{value:new Vector2()}};let bendOn=false,TS={k0:0,r0:0,g0:0};
try{const mk='mvPosition = modelViewMatrix * mvPosition;',pv=T.ShaderChunk.project_vertex;
 if(pv.includes('bendOff')||pv.includes(mk)){if(!pv.includes('bendOff'))T.ShaderChunk.project_vertex=pv.replace(mk,'#ifdef BENDON\nvec4 bndW=modelMatrix*mvPosition;vec2 bndO=bendOff(bndW.z);bndW.xy+=bndO;mvPosition=viewMatrix*bndW;\n#else\n'+mk+'\n#endif');
  const GLS=`#define BENDON\nuniform vec4 uBend[${TK.N}];uniform vec2 uBendK;\nvec2 bendOff(float z){float u=-z;if(u<=0.)return uBendK*u*u*.5;float f=u/${TK.DU}.;if(f>=${TK.N-1}.){vec4 a=uBend[${TK.N-1}];return a.xy+a.zw*(u-${(TK.N-1)*TK.DU}.);}int i=int(f);float t=f-float(i),t2=t*t,t3=t2*t;vec4 a=uBend[i],b=uBend[i+1];return(2.*t3-3.*t2+1.)*a.xy+(t3-2.*t2+t)*${TK.DU}.*a.zw+(-2.*t3+3.*t2)*b.xy+(t3-t2)*${TK.DU}.*b.zw;}\n`;
  T.Material.prototype.onBeforeCompile=function(sh){if(this.userData&&this.userData.nobend)return;sh.uniforms.uBend=BEND.uBend;sh.uniforms.uBendK=BEND.uBendK;sh.vertexShader=GLS+sh.vertexShader};bendOn=true}}
catch(e){console.warn('Road bending unavailable, roads stay straight',e)}

/* ---------- vehicles ---------- */
const CF=makeCars(T,{cfg,ENVM});
const CARS=[{n:'Stellar FXX',k:'hyper',c:0xd4121a,top:92,acc:19,hd:1.2,df:1.6,e:'V12'},{n:'Vanta GT',k:'gt',c:0xff7a1a,top:78,acc:15,hd:1,e:'Flat-plane V8'},{n:'Toyota Supra',k:'supra',c:0xf2570f,top:76,acc:14.5,hd:1.08,df:1.15,e:'Turbo straight-six'},
 {n:'Meridian sedan',k:'sedan',c:0x2d5d9c,top:68,acc:12,hd:.9,e:'Inline-four'},{n:'Rook SUV',k:'suv',c:0x3b7a57,top:60,acc:10,hd:.8,e:'V6'}];
const EMER={police:1,ambulance:1},TIERNOTE={low:'Low: every map and the weather, at the lightest cost.',med:'Medium: adds richer scenery and weather particles.',high:'High: adds shadows, leaf trees and reflections.',ultra:'Ultra: adds bloom, lamp light pools and headlights.',stellar:'Stellar: adds film grading, sun shafts, speed blur and rain on the lens.'};

/* ---------- road, ground, roadside ---------- */
function roadTex(two){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#2b2d31';x.fillRect(0,0,128,128);for(let i=0;i<500;i++){x.fillStyle=Math.random()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.14)';x.fillRect(Math.random()*128,Math.random()*128,1,1)}x.fillStyle='rgba(0,0,0,.09)';for(const q of[16,48,80,112]){x.fillRect(q-9,0,5,128);x.fillRect(q+4,0,5,128)}x.fillStyle='#d9d7cf';x.fillRect(2,0,4,128);x.fillRect(122,0,4,128);
 for(const px of two?[32,96]:[32,64,96])x.fillRect(px-2,0,4,64);
 if(two){x.fillStyle='#e6b422';x.fillRect(61,0,2,128);x.fillRect(65,0,2,128)}
 const t=new CanvasTexture(c);t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(1,70);t.colorSpace=SRGBColorSpace;t.anisotropy=4;return t}
const gc=document.createElement('canvas');gc.width=gc.height=128;{const x=gc.getContext('2d');x.fillStyle='#e6e6e6';x.fillRect(0,0,128,128);for(let i=0;i<900;i++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.09)':'rgba(255,255,255,.12)';x.fillRect(Math.random()*128,Math.random()*128,2,2+Math.random()*3)}}
const gt=new CanvasTexture(gc);gt.wrapS=gt.wrapT=RepeatWrapping;gt.repeat.set(56,36);gt.colorSpace=SRGBColorSpace;
const ground=new Mesh(new PlaneGeometry(1400,900,8,150),new MeshLambertMaterial({color:0x31502e,map:gt}));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.05,-250);ground.receiveShadow=true;ground.frustumCulled=false;sc.add(ground);
const road=new Mesh(new PlaneGeometry(14.4,700,1,140),new MeshStandardMaterial({map:roadTex(0),roughness:.62,metalness:0}));ENVM.push(road.material);road.rotation.x=-Math.PI/2;road.position.z=-250;road.receiveShadow=true;road.frustumCulled=false;sc.add(road);
const WALLS=[];for(const s of[-1,1]){const w=new Mesh(new BoxGeometry(.35,.8,700,1,1,140),new MeshLambertMaterial({color:0x8a8d92}));w.position.set(s*7.6,.4,-250);w.frustumCulled=false;sc.add(w);WALLS.push(w)}
const D3=new Object3D(),mi=(geo,n,mat)=>{const m=new InstancedMesh(geo,mat||new MeshLambertMaterial({color:0xffffff}),n);m.frustumCulled=false;sc.add(m);return m};
const zf=(z0,Lp)=>60-(((z0-dist)%Lp)+Lp)%Lp;
const NT=90,NB=30,NL=14;
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
const beam=new Mesh(new PlaneGeometry(7.5,48,1,8),new MeshBasicMaterial({map:new CanvasTexture(bc),transparent:true,opacity:0,depthWrite:false,blending:AdditiveBlending,fog:false}));beam.rotation.x=-Math.PI/2;beam.position.set(0,.06,-26);sc.add(beam);
const gan=new Group();{const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#0d5a3c';x.fillRect(0,0,512,128);x.strokeStyle='#fff';x.lineWidth=6;x.strokeRect(8,8,496,112);x.fillStyle='#fff';x.font='800 64px "Barlow Condensed","Arial Narrow",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('STELLAR CITY   12 km',256,68);
 const sgn=new Mesh(new PlaneGeometry(10,2.5),new MeshBasicMaterial({map:new CanvasTexture(c)}));sgn.position.set(0,6.4,.2);const m=new MeshLambertMaterial({color:0x8a8d92});
 for(const s of[-1,1]){const q=new Mesh(new BoxGeometry(.5,7.4,.5),m);q.position.set(s*8.6,3.7,0);gan.add(q)}const bm2=new Mesh(new BoxGeometry(18,.5,.6),m);bm2.position.set(0,7.5,0);gan.add(bm2,sgn)}sc.add(gan);
const sg=new BufferGeometry(),spt=[];for(let i=0;i<260;i++){const a=Math.random()*6.283,e=Math.random()*1.3+.1;spt.push(Math.cos(a)*Math.cos(e)*480,Math.sin(e)*380+20,Math.sin(a)*Math.cos(e)*480)}sg.setAttribute('position',new Float32BufferAttribute(spt,3));
const stars=new Points(sg,new PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,fog:false,transparent:true,opacity:0}));stars.material.userData.nobend=true;stars.frustumCulled=false;sc.add(stars);

/* ---------- particles: one additive pool (flames, sparks) and one alpha pool (smoke, dust). They live in the scrolling world, so they drift back at road speed ---------- */
function pool(n,add){const g=new BufferGeometry(),P=new Float32Array(n*3),C=new Float32Array(n*4),Z=new Float32Array(n),a=[...Array(n)].map(()=>({l:0,t:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,s0:1,s1:1,c:[1,1,1,1],g:0,d:0}));
 g.setAttribute('position',new Float32BufferAttribute(P,3));g.setAttribute('col',new Float32BufferAttribute(C,4));g.setAttribute('siz',new Float32BufferAttribute(Z,1));
 const m=new ShaderMaterial({transparent:true,depthWrite:false,blending:add?AdditiveBlending:NormalBlending,uniforms:{sc:{value:600}},
  vertexShader:'attribute vec4 col;attribute float siz;varying vec4 vc;uniform float sc;void main(){vc=col;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(siz*sc/-mv.z,160.);}',
  fragmentShader:'varying vec4 vc;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*14.)*vc.a;if(a<.004)discard;gl_FragColor=vec4(vc.rgb,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const pts=new Points(g,m);pts.frustumCulled=false;pts.renderOrder=5;sc.add(pts);let k=0;
 return{pts,m,emit(x,y,z,vx,vy,vz,life,s0,s1,r,gg,b,al,grav=0,drag=0){const q=a[k++%n];q.l=q.t=life;q.x=x;q.y=y;q.z=z;q.vx=vx;q.vy=vy;q.vz=vz;q.s0=s0;q.s1=s1;q.c=[r,gg,b,al];q.g=grav;q.d=drag},
  step(dt,v){for(let i=0;i<n;i++){const q=a[i];if(q.l<=0){C[i*4+3]=0;continue}q.l-=dt;const k2=1-q.l/q.t,dk=Math.exp(-q.d*dt);q.vx*=dk;q.vy=q.vy*dk-q.g*dt;q.vz*=dk;q.x+=q.vx*dt;q.y=Math.max(.02,q.y+q.vy*dt);q.z+=(q.vz+v)*dt;
   P[i*3]=q.x;P[i*3+1]=q.y;P[i*3+2]=q.z;Z[i]=q.s0+(q.s1-q.s0)*k2;C[i*4]=q.c[0];C[i*4+1]=q.c[1];C[i*4+2]=q.c[2];C[i*4+3]=q.c[3]*(1-k2)*Math.min(1,k2*8+.2)}
   g.attributes.position.needsUpdate=g.attributes.col.needsUpdate=g.attributes.siz.needsUpdate=true}}}
const PA=pool(700,true),PN=pool(500,false);

/* ---------- state ---------- */
const tr=POOL.map(k=>{const o=CF.build(k,pick(COLS),false);Object.assign(o,{d:-999,pd:-999,x:0,li:0,s:25,pv:25,pv0:25,on:false,ch:null,cd:0,sig:0,br:false,hk:0,hornT:0,chase:0,ct:0});o.g.visible=false;sc.add(o.g);return o});
let ps=0,rs=0,hv=0,pvl=0,rvl=0,hvl=0,ci=0,C=CARS[ci],P=null,ste=0,nitA=0,bfT=0,chaseT=0;
const NFL=[];
function buildP(){if(P)sc.remove(P.g);P=CF.build(C.k,C.c,true);NFL.length=0;
 /* nitro flames: a blue-white cone pair and a diamond per exhaust, parented to the body so they roll with it */
 const cone=new ConeGeometry(.15,1,10,1,true).translate(0,.5,0).rotateX(Math.PI/2),bl=()=>({transparent:true,blending:AdditiveBlending,depthWrite:false,fog:false});
 for(const[x,y,z]of P.ex){const g=new Group(),m1=new MeshBasicMaterial({color:new Color(.25,.6,3),opacity:.7,...bl()}),m2=new MeshBasicMaterial({color:new Color(2.2,2.6,3),opacity:.95,...bl()}),dm=new Mesh(new SphereGeometry(.09,8,6),new MeshBasicMaterial({color:new Color(2.4,2.8,3.4),opacity:.9,...bl()}));
  g.position.set(x,y,z);g.add(new Mesh(cone,m1),new Mesh(cone,m2),dm);g.visible=false;P.body.add(g);NFL.push({g,dm,m1,m2})}
 sc.add(P.g)}buildP();
let st='menu',paused=false,M=0,mode=0,v=0,px=0,vx=0,dist=0,time=0,bonus=0,combo=0,ct=0,nm=0,pass=0,top=0,nitro=60,used=0,shake=0,crashT=0,spinZ=0,spinY=0,cm=(+api.get('cam')||0)%6,gear=1,rpm=.3,dark=0,lights=false,hornHeld=false,hudT=0,raf=0,lt=performance.now(),accl=0,brk=false,nAct=8,sndT=0,spawnT=0,gDrawT=0,nCap=24;
const keys={},tp={},tried=new Set(),LX=[-5.4,-1.8,1.8,5.4],CAMS=['Chase','Far chase','Hood','Bumper','Cockpit','Director'],GS=[0,13,23,34,46,60],ptr=new Map();
const camPos=new Vector3(0,3,8.6),camLook=new Vector3(0,1,-20),tv=new Vector3(),tl=new Vector3();let camRoll=0,camG=0,dirT=0;

/* ---------- graphics tiers: low, med, high, ultra, stellar. Quality and render resolution apply live ---------- */
const PRs={low:.7,med:1,high:Math.min(devicePixelRatio||1,1.5),ultra:Math.min(devicePixelRatio||1,1.5),stellar:Math.min(devicePixelRatio||1,1.25)};
let WORLD=null,WP=0,mapSel=+api.get('map')||0,seen=api.get('maps')|0,drs=1;const MAPN=['Auto','Meadow','Alpine','Coast','Desert','Downtown'];
const SXC={T,ground,road,walls:WALLS,lamps:[pl,lh],ENVM,hemi,sun,ui,BEND,TK,snd:SND,api,beam,stars,get bendOn(){return bendOn}};
const XLm=()=>WORLD&&WORLD.live?WORLD:null;
function applyG(){const q=cfg.q,hi=q==='high'||q==='ultra'||q==='stellar',w=root.clientWidth||1,h=root.clientHeight||1,was=R.shadowMap.enabled,tm=WORLD?T.ACESFilmicToneMapping:T.NoToneMapping;
 R.setPixelRatio(cl(PRs[q]*cfg.scale*drs,.3,3));R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
 R.shadowMap.enabled=sun.castShadow=hi;sun.shadow.mapSize.set(q==='high'?1024:2048,q==='high'?1024:2048);if(was!==hi||R.toneMapping!==tm){R.toneMapping=tm;R.toneMappingExposure=1.1;sc.traverse(o=>{if(o.material)o.material.needsUpdate=true})}
 if(!WORLD&&!WP){WP=1;import('./world3d.js').then(m=>m.default(T,sc,R,cam,SXC)).then(u=>{WORLD=u;u.map(mapSel);applyG()}).catch(e=>{WP=2;console.warn('World module could not load, using the basic scenery',e)})}
 if(WORLD)WORLD.on(true,w,h,R.getPixelRatio(),q);
 sc.fog.far=q==='low'?230:380;const f=q==='low'?.5:1;tF.count=tK.count=tF2.count=Math.floor(NT*f);bV.forEach(m=>m.count=Math.floor(10*f));nCap=q==='low'?12:q==='stellar'?30:24}
/* dynamic resolution: if the frame rate falls, render fewer pixels (down to 50%) and win them back when there is headroom */
let dAcc=0,dN=0,dT=0,okT=0,showFps=false,fpsTxt='';
function drsStep(raw){if(st!=='run'||paused||raw>.12||document.hidden)return;dAcc+=raw;dN++;dT+=raw;if(dT<1.2)return;const ms=dAcc/dN*1000;fpsTxt=Math.round(1000/ms)+' fps, '+Math.round(drs*100)+'% res';dAcc=dN=dT=0;
 /* a screen locked to its refresh rate can never look "faster", so recovery is time based: five steady seconds earn some resolution back */
 let nd=drs;if(ms>21){nd=Math.max(.4,drs-(ms>32?.2:.1));okT=0}else if(ms<18.5&&drs<1){okT+=1.2;if(okT>=4.8){nd=Math.min(1,drs+.1);okT=0}}else okT=0;if(Math.abs(nd-drs)>.001){drs=nd;applyG()}}

/* day and night follow distance */
const PAL=[[0x7fb7e6,2.2,1.25,0x31502e],[0xe0833c,1.5,.9,0x2a3320],[0x1f3248,.7,.55,0x1b2418],[0x06080c,.3,.3,0x0b100b]],DKN=[0,.3,.75,1],ca=new Color(),cb=new Color();
function env(){const t=dist/2200,i=Math.floor(t)%4,f=t%1,a=PAL[i],b=PAL[(i+1)%4];
 ca.setHex(a[0]).lerp(cb.setHex(b[0]),f);sc.background.copy(ca);sc.fog.color.copy(ca);
 sun.intensity=a[1]+(b[1]-a[1])*f;hemi.intensity=a[2]+(b[2]-a[2])*f;
 ca.setHex(a[3]).lerp(cb.setHex(b[3]),f);ground.material.color.copy(ca);
 dark=DKN[i]+(DKN[(i+1)%4]-DKN[i])*f;stars.material.opacity=cl((dark-.5)*2,0,1);const ei=.25+.85*(1-dark);for(const m of ENVM)m.envMapIntensity=ei*(m===P.mats.gl?1.6:1);bm.emissiveIntensity=dark*1.3;if(dark>.7)api.unlock('dusk')}

/* ---------- traffic ---------- */
const RARE={police:1,ambulance:1,schoolbus:1,tanker:1,towtruck:1,muscle:1,roadster:1,gt:1};
function place(o,far){
 for(let t=0;t<12;t++){const l=Math.random()*4|0,x=LX[l],d=far?rnd(240,440):rnd(70,280);
  if(tr.some(q=>q!==o&&q.on&&Math.abs(q.x-x)<2.4&&Math.abs(q.d-d)<(q.len+o.len)/2+30))continue;
  o.li=l;o.x=x;o.d=d;o.pv0=o.pv=rnd(o.spd[0],o.spd[1])*(mode&&l<2?-1:1);o.s=o.pv;o.ch=null;o.cd=rnd(1,5);o.sig=0;o.br=false;o.hk=0;o.hornT=rnd(2,8);o.chase=0;o.ct=0;o.on=true;o.g.visible=true;
   if(!FX[o.kind])o.pm.color.setHex(pick(COLS));if(o.tm)o.tm.color.setHex(pick(COLS));return true}
 o.on=false;o.g.visible=false;return false}
function spawnOne(far){let tot=0;const c=[];for(const o of tr)if(!o.on){const w=(WT[o.kind]||.4)*(RARE[o.kind]?cl(dist/1800,.12,1):1);c.push([o,w]);tot+=w}
 let r=Math.random()*tot;for(const[o,w]of c){if((r-=w)<=0){place(o,far);return}}}
function off(o){o.on=false;o.g.visible=false;o.chase=0}
function laneFree(l,o){const x=LX[l];for(const q of tr)if(q!==o&&q.on&&Math.abs(q.x-x)<2.4&&Math.abs(q.d-o.d)<(q.len+o.len)/2+16)return false;return!(Math.abs(px-x)<2.6&&Math.abs(o.d)<(P.len+o.len)/2+14)}

/* ---------- gameplay ---------- */
function near(o){combo++;ct=3.2;nm++;const onc=o.s<0,b=(onc?100:50)*Math.min(combo,10);bonus+=b;nitro=Math.min(100,nitro+(onc?10:6));cbo.textContent=`Near miss +${b}${combo>1?'  x'+combo:''}`;cbo.classList.add('on');api.sfx('near');api.unlock('near');if(combo>=8)api.unlock('hair');if(onc)api.add('wrong');if(Math.random()<.3)SND.honk(o.kind,cl((o.x-px)/8,-1,1),.7,.3)}
function sparks(x,y,z,n,vx=0){for(let i=0;i<n;i++)PA.emit(x,y,z,vx+rnd(-5,5),rnd(1,6),rnd(-6,3),rnd(.25,.6),.12,.03,1.6,1,.3,.8,18,.5)}
function crash(o){if(st!=='run')return;st='crash';crashT=0;hornHeld=false;if(v*3.6>200)api.unlock('wreck');SND.crash(cl(v/40,.5,1.2));SND.stop();shake=1.5;flash.style.opacity=.55;setTimeout(()=>flash.style.opacity=0,350);spinZ=rnd(-5,5);spinY=rnd(-3,3);vx+=(px-o.x)*2;combo=0;ct=0;cbo.classList.remove('on');
 sparks(px,.6,-P.len/2,40,(o.x-px)*2);for(let i=0;i<26;i++)PN.emit(px+rnd(-1,1),rnd(.3,1),-P.len/2+rnd(-1,1),rnd(-3,3),rnd(.5,3),rnd(-2,2),rnd(.8,1.8),.8,3.2,.5,.5,.52,.5,-.5,.8)}
function finish(){st='over';const s=Math.floor(dist/10)+bonus,nb=api.best('racer',s);
 ov(`<h3>Wrecked</h3><p>Score <b>${s.toLocaleString()}</b>${nb?' (new best)':''}</p><p>${(dist/1000).toFixed(2)} km, top speed ${Math.round(top*3.6)} km/h</p><p>${nm} near misses, ${pass} cars passed</p><p>Best ${api.getBest('racer').toLocaleString()}</p><div class="row"><button class="bt pri" data-a="go" type="button">Play again (Space)</button><button class="bt" data-a="menu" type="button">Car and mode</button><button class="bt" data-a="exit" type="button">Exit</button></div>${api.strip(1)}`)}
function crashStep(dt){crashT+=dt;const k=cl(.25+crashT*.45,.25,1),d=dt*k;v*=Math.exp(-1.4*d);dist+=v*d;px+=vx*d;vx*=Math.exp(-d);shake=Math.max(0,shake-dt*.8);
 for(const o of tr)if(o.on)o.d-=(v-o.s)*d;
 spinZ*=Math.exp(-1.5*d);spinY*=Math.exp(-1.5*d);P.g.rotation.z+=spinZ*d;P.g.rotation.y+=spinY*d;P.g.position.set(px,Math.abs(Math.sin(crashT*4))*Math.max(0,1.3-crashT),0);
 if(crashT<1.2&&v>4&&Math.random()<dt*30)sparks(px,.2,rnd(-1,1),2);if(Math.random()<dt*30)PN.emit(px+rnd(-1,1),.5,rnd(-1,1),rnd(-1,1),rnd(1,2),0,rnd(1,2),.6,3,.45,.45,.47,.4,-.3,.5);
 if(crashT>1.7&&st==='crash')finish()}
function hornOn(on){if(!on){if(hornHeld){hornHeld=false;SND.horn(false)}return}if(hornHeld||st!=='run'||paused)return;hornHeld=true;SND.horn(true,C.k);api.add('horn');for(const o of tr)if(o.on&&o.s>0&&Math.abs(o.x-px)<2.4&&o.d>0&&o.d<70)o.hk=1}
function camNext(){cm=(cm+1)%CAMS.length;tried.add(cm);api.put('cam',cm);if(tried.size>=4)api.unlock('tour');api.sfx('click')}
function step(dt){
 brk=!!(keys.KeyS||keys.ArrowDown||tp.b);const XL=XLm(),W=XL&&XL.weather?XL.weather():null,grip=W?W.grip:1;
 const thr=!!(keys.KeyW||keys.ArrowUp||coarse),nit=!!(keys.ShiftLeft||keys.ShiftRight||tp.n)&&nitro>0&&thr&&!brk;
 const cap=Math.min(C.top,36+dist/60)+(nit?12:0);let a;
 if(brk)a=-46*(.55+.45*grip);else if(thr)a=C.acc*(nit?1.9:1)*Math.max(0,1-v/cap)*(.82+.18*grip);else a=-(3+v*.025+v*v*.0011);
 if(v>cap)a-=6;accl=a;v=cl(v+a*dt,0,cap+4);top=Math.max(top,v);
 if(nit){nitro=Math.max(0,nitro-24*dt);used+=24*dt;if(used>=95)api.unlock('burn');if(!tp.ns){tp.ns=1;SND.nitro(true);shake=Math.max(shake,.35)}}else{tp.ns=0;nitro=Math.min(100,nitro+3*dt)}
 let gg=1;for(let i=0;i<GS.length;i++)if(v>=GS[i])gg=i+1;if(gg!==gear){gear=gg;SND.shift();if(Math.random()<.5)bfT=.1}
 const lo=GS[gear-1],hi=GS[gear]||C.top+4;rpm=.28+.72*cl((v-lo)/(hi-lo),0,1);
 const dir=((keys.KeyD||keys.ArrowRight||tp.r)?1:0)-((keys.KeyA||keys.ArrowLeft||tp.l)?1:0);
 /* the road pushes the car to the outside of a bend; counter-steer to hold the lane */
 const df=C.df||1,edge=Math.abs(px)>7.2-P.wid/2-1.1?1:0;vx+=dir*(64+30*C.hd)*dt*cl(1.3-v/(105*df),.35,1)*(.8+.2*grip);vx-=TS.k0*v*v*.4*dt;
 vx*=Math.exp(-(6.6+Math.min(v,80)*.014*df-(brk&&v>30?2.2:0))*(.65+.35*grip)*dt);px+=vx*dt;
 const lim=7.2-P.wid/2-.1;if(Math.abs(px)>lim){px=cl(px,-lim,lim);if(Math.abs(vx)>2.5){sparks(px,.4,rnd(-1,1),3,-Math.sign(px)*3);SND.scrape(.15)}vx=0;v*=1-.5*dt;shake=Math.max(shake,.25)}
 dist+=v*dt;if(ct>0){ct-=dt;if(ct<=0){combo=0;cbo.classList.remove('on')}}
 nAct=Math.min(nCap,8+(dist/500|0)*2);
 if(v*3.6>=250)api.unlock('red');if(dist>=5000)api.unlock('haul');
 /* tyre smoke when sliding or locking the brakes, nitro exhaust, overrun backfire */
 const slip=Math.abs(vx)>3.4||brk&&v>28;if(slip&&Math.random()<dt*50)for(const s of[-1,1])PN.emit(px+s*.85,.2,P.len/2-.7,rnd(-.4,.4),rnd(.3,1),rnd(-1,1),rnd(.5,1.1),.5,2.2,.78,.78,.8,.38*(W?1-W.wet*.3:1),-.3,1.5);
 if(nit&&Math.random()<dt*34)for(const e of P.ex)PA.emit(px+e[0],e[1],e[2]+.9,rnd(-.2,.2),rnd(0,.3),rnd(1,3),rnd(.1,.2),.09,.02,.3,.6,1.5,.3,0,2);
 if(bfT>0){bfT-=dt;if(Math.random()<dt*60)for(const e of P.ex)PA.emit(px+e[0],e[1],e[2]+.5,rnd(-.5,.5),rnd(0,1),rnd(2,5),rnd(.08,.16),.12,.03,1.8,.8,.2,.6,0,2)}
 if(!thr&&rpm>.55&&/^(hyper|gt|supra)$/.test(C.k)&&Math.random()<dt*2.2){bfT=.1;SND.pop(.8)}
 if(W&&W.storm&&W.rain>.7)api.unlock('storm');
 /* traffic */
 let act=0;
 for(const o of tr){if(!o.on)continue;act++;o.pd=o.d;o.hornT-=dt;
  if(o.s>0){
   let gap=1e9,ls=o.pv;
   for(const q of tr)if(q!==o&&q.on&&q.s>0&&Math.abs(q.x-o.x)<2.3&&q.d>o.d){const gp=q.d-o.d-(q.len+o.len)/2;if(gp<gap){gap=gp;ls=q.s}}
   const blockedByMe=o.d<0&&Math.abs(px-o.x)<2.3;if(blockedByMe){const gp=-o.d-(o.len+P.len)/2;if(gp<gap){gap=gp;ls=v}}
   if(o.kind==='police'){
    if(!o.chase&&v>54&&Math.abs(o.d)<90&&o.d<35){o.chase=1;o.ct=0;SND.honk('police',cl((o.x-px)/8,-1,1),.6,.25)}
    if(o.chase){o.ct+=dt;const tg=o.d>0?Math.max(8,v*.5):Math.min(v*1.04+3,60);o.pv+=(tg-o.pv)*Math.min(1,dt*1.5);if(o.d<0&&o.d>-130){chaseT+=dt;if(chaseT>12)api.unlock('pursuit')}if(o.d<-320||o.ct>45){o.chase=0;o.pv=o.pv0}}}
   const want=6+o.s*.8;let ac=2.6*(1-o.s/o.pv);
   if(gap<want)ac=-Math.min(10,(want-gap)/want*12+Math.max(0,o.s-ls)*.8);
   if(blockedByMe&&gap<want*.55&&o.hornT<=0&&o.s>v*.7){o.hornT=rnd(5,10);SND.honk(o.kind,cl((o.x-px)/8,-1,1),cl(1-Math.abs(o.d)/60,.2,.9),.4)}
   if(o.sb>0){ac=-7;o.sb-=dt}else if(o.d>40&&o.d<220&&o.s>14&&Math.random()<dt*.01&&!o.chase)o.sb=.8;o.br=ac<-1.5;o.s=cl(o.s+ac*dt,0,Math.max(o.pv*1.05,o.s>o.pv*1.05?o.s-dt*6:0));
   if(o.ch){const c=o.ch;c.t+=dt;c.k=cl(c.t/1.7,0,1);const e=c.k*c.k*(3-2*c.k);o.x=c.x0+(c.x1-c.x0)*e;if(c.k>=1){o.ch=null;o.sig=0;o.cd=rnd(4,9)}}
   else{o.cd-=dt;
    /* make way for a fast car closing in from behind, or for emergency vehicles */
    if(!o.hk&&o.d<0&&o.d>-45&&Math.abs(px-o.x)<2.3&&v>o.s+9&&o.kind!=='police')o.hk=1;
    if(!o.hk&&!EMER[o.kind])for(const q of tr)if(q!==o&&q.on&&EMER[q.kind]&&(q.kind==='ambulance'||q.chase)&&Math.abs(q.x-o.x)<2.3&&q.d<o.d&&q.d>o.d-60&&q.s>o.s){o.hk=1;break}
    if(o.chase&&o.d<0&&Math.abs(o.x-px)>2.3&&o.cd<=0){const tl2=LX.findIndex(x=>Math.abs(x-px)<1.9);if(tl2>=0&&tl2!==o.li){const l=o.li+Math.sign(tl2-o.li);if(l>=0&&l<4&&(!mode||l>=2)&&laneFree(l,o)){o.ch={t:-.3,k:0,x0:o.x,x1:LX[l]};o.sig=LX[l]<o.x?-1:1;o.li=l}}o.cd=.6}
    else if((o.cd<=0||o.hk)&&(o.hk||(gap<want*.9&&o.pv>o.s+1)||Math.random()<dt*.05)){o.hk=0;const c=(o.pv<25?[1,-1]:o.pv>34?[-1,1]:Math.random()<.5?[-1,1]:[1,-1]).map(q=>o.li+q).find(l=>l>=(mode?2:0)&&l<4&&laneFree(l,o));if(c!==undefined){o.ch={t:-.8,k:0,x0:o.x,x1:LX[c]};o.li=c;o.sig=LX[c]<o.x?-1:1}else o.cd=1.5}}
  }
  o.d-=(v-o.s)*dt;
  if(o.d<-70||o.d>480){off(o);continue}
  if(o.pd>0&&o.d<=0){pass++;const gx=Math.abs(o.x-px)-(o.wid+P.wid)/2;if(gx>-.05&&gx<.9)near(o)}
  {const lo=(o.wid+P.wid)/2-.1-Math.abs(o.x-px);if(Math.abs(o.d)<(o.len+P.len)/2-.25&&lo>0){if(lo<(o.s<0?.25:.45)){const sg=px<o.x?-1:1;px+=sg*Math.min(lo,.12);vx=sg*Math.max(Math.abs(vx),3.5);v*=1-1.4*dt;shake=Math.max(shake,.5);hvl+=2.5;if(!o.gz){o.gz=1;SND.bump();sparks(px+sg*P.wid/2,.5,rnd(-1,1),14,sg*3);api.unlock('graze')}}else{crash(o);return}}else o.gz=0}}
 if(act<nAct&&(spawnT-=dt)<=0){spawnT=.12;spawnOne(1)}
 /* sound: engine every frame, traffic voices at 20 Hz */
 SND.set({rpm,thr:thr&&!brk?1:.18,v,vx,brk,nit,boost:cl(rpm*(thr?1:.3),0,1),wet:W?W.wet:0,rain:W?W.rain:0,edge,gear});
 if((sndT-=dt)<=0){sndT=.05;const L=[];let sir=null,sd=1e9;for(const o of tr)if(o.on&&Math.abs(o.d)<130){L.push({k:o.kind,d:o.d,vr:v-o.s,x:o.x-px,s:Math.abs(o.s)});if(EMER[o.kind]&&(o.kind==='ambulance'&&o.s>0||o.chase)&&Math.abs(o.d)<sd){sd=Math.abs(o.d);sir=o}}
  SND.npc(L);if(sir)SND.siren(sir.kind==='police'?1:2,cl(1.2-sd/160,0,1),cl((sir.x-px)/10,-1,1));else SND.siren(0)}}

/* ---------- menus ---------- */
function menu(){st='menu';paused=false;SND.stop();api.music('drive');cbo.classList.remove('on');hs.style.display=hr.style.display='none';hornHeld=false;
 ov(`<h3>Stellar Drive</h3><p>Pick a car and a mode.</p><div class="row"><button class="bt" data-a="cp" type="button">◀</button><b>${C.n}</b><button class="bt" data-a="cn" type="button">▶</button></div><p class="sp2">${C.e}, ${Math.round(C.top*3.6)} km/h</p><div class="row"><button class="bt${M?'':' pri'}" data-a="m0" type="button">Free ride</button><button class="bt${M?' pri':''}" data-a="m1" type="button">Two-way</button></div><div class="row"><button class="bt" data-a="mp" type="button">Map: ${MAPN[mapSel]}</button></div><p class="sp2">${TIERNOTE[cfg.q]||''}</p><p>W or Up accelerates, S or Down brakes, A D or the arrows steer, Shift is nitro. Hold H for the horn. C changes camera, L the headlights, P pauses, R restarts. Bends push you wide, so steer into them.</p><p>On a touch screen, hold the left or right side to steer and the middle to brake. Throttle is automatic.</p><button class="bt pri" data-a="go" type="button">Start (Space)</button>${api.strip(1)}<p>Best ${api.getBest('racer').toLocaleString()}</p>`)}
function carStep(d){ci=(ci+d+CARS.length)%CARS.length;C=CARS[ci];buildP();menu()}
const bumpN=s=>Math.sin(s*1.3)*.5+Math.sin(s*3.7+1)*.3+Math.sin(s*9.1)*.2;
/* [x,y,z, lookx,looky,lookz, fov] for the chosen camera. Chase cameras look into the bend and lag behind acceleration. */
function camTarget(dt){const x=px,la=TK.off(BEND.uBend.value,32),lx=la[0]*.55,ly=la[1]*.4,g=camG;
 switch(cm){case 0:return[x*.6,3+g*.3,8.6+g*.8,x*.35+lx,1.2+ly,-20,62];case 1:return[x*.5,5.8,14.5+g,x*.3+lx,.9+ly,-16,58];
  case 2:return[x,Math.min(P.hr-.1,P.hb+.42),-P.hz,x+lx*.5,1.2+ly,-40,74];case 3:return[x,.62,-(P.len/2+.05),x+lx*.4,.7,-45,80];
  case 4:{const e=P.eye||[-.36,1.1,-.3];return[x+e[0],e[1]+hv+Math.sin(time*40)*.002*cl(v/40,0,1),e[2]-g*.05,x+e[0]*.4+lx*.5,e[1]-.08+ly,-40,70]}
  default:{dirT+=dt;const sh=Math.floor(dirT/5.5)%4,u=(dirT%5.5)/5.5,e=Math.sin(u*Math.PI);
   if(sh===0)return[x+3.4-u*.6,.75,-5.5+u*1.5,x,.55,-1,46];if(sh===1)return[x-1.6,.55,4.5-u*1.5,x+lx*.4,.8,-30,58];if(sh===2)return[x+6.5,1.3+e*.5,2-u*5,x,.7,-1.5-u*2,40];return[x+.3,7+e,10-u*3,x,.6,-6,56]}}}
function start(){mode=M;buildP();road.material.map=roadTex(mode);road.material.needsUpdate=true;
 v=28;dist=0;px=LX[2];vx=0;bonus=0;combo=0;ct=0;nm=0;pass=0;top=0;nitro=60;used=0;shake=0;crashT=0;gear=1;paused=false;lights=false;ste=0;hv=pvl=rvl=hvl=ps=rs=0;chaseT=0;nitA=0;dirT=0;hornHeld=false;
 tr.forEach(o=>{off(o);o.ch=null});for(let i=0;i<8;i++)spawnOne(0);
 P.g.rotation.set(0,0,0);tried.clear();tried.add(cm);const t=camTarget(0);camPos.set(t[0],t[1],t[2]);camLook.set(t[3],t[4],t[5]);cam.fov=t[6];
 st='run';ov('');hs.style.display=hr.style.display='';api.music('drive');SND.start(C.k);api.unlock('ign');if(C.k==='supra')api.unlock('supra')}
function pause(on){if(st!=='run')return;paused=on;ov(on?`<h3>Paused</h3><div class="row"><button class="bt pri" data-a="res" type="button">Resume</button><button class="bt" data-a="go" type="button">Restart</button><button class="bt" data-a="menu" type="button">Car and mode</button><button class="bt" data-a="exit" type="button">Exit</button></div>${api.strip(1)}<p>Camera C, horn H, headlights L.</p>`:'');if(on){SND.stop();hornHeld=false}else SND.start(C.k)}

/* ---------- drawing ---------- */
function hud(){$('#sp').textContent=Math.round(v*3.6);$('#rp').style.width=rpm*100+'%';$('#ni').style.width=nitro+'%';const XL=XLm(),W=XL&&XL.weather?XL.weather():null;$('#gr').textContent='Gear '+gear+'   Camera: '+CAMS[cm]+(XL?'   Map: '+XL.name():'')+(W&&W.name!=='Clear'?'   '+W.name:'')+(showFps?'   '+fpsTxt:'');$('#di').textContent=(dist/1000).toFixed(2)+' km';$('#sc').textContent=(Math.floor(dist/10)+bonus).toLocaleString()+' pts';$('#cn').textContent=combo>1?'Combo x'+combo:''}
function speedLines(){const w=slc.clientWidth|0,h=slc.clientHeight|0;if(slc.width!==w||slc.height!==h){slc.width=w;slc.height=h}slx.clearRect(0,0,w,h);const k=cl((v-40)/55,0,1)*.35+nitA*.9;if(k<.04||RMo)return;slx.lineCap='round';const cx=w/2,cy=h*.46,n=Math.floor(8+k*34);
 for(let i=0;i<n;i++){const a=Math.random()*6.283,r0=Math.max(w,h)*(.28+Math.random()*.2),r1=r0+Math.max(w,h)*(.12+k*.28*Math.random());slx.strokeStyle=`rgba(${nitA>.3?'150,205,255':'255,255,255'},${(.05+Math.random()*.2)*k})`;slx.lineWidth=1+Math.random()*2*k;slx.beginPath();slx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0*.7);slx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1*.7);slx.stroke()}}
const SX={},SZ=new Vector2();
function draw(dt){
 env();const XL=XLm(),ul=!!XL,W=XL&&XL.weather?XL.weather():null;
 TS=TK.fill(dist,BEND.uBend.value);BEND.uBendK.value.set(bendOn?TS.k0:0,bendOn?TS.r0:0);if(!bendOn)BEND.uBend.value.fill(0);
 if(ul){Object.assign(SX,{v,px,nit:nitA,cm,lights,brk,steer:ste,st,dist,tr,k0:TS.k0,hv});XL.update(dist,dark,dt,time,SX);if(st==='run'){const b=XL.bi();if(!(seen>>b&1)){seen|=1<<b;api.put('maps',seen);if(seen===31)api.unlock('globe')}}}
 tF.visible=tF2.visible=tK.visible=!ul;for(const m of bV)m.visible=!ul;road.material.map.offset.y=dist/10;ground.material.map.offset.y=dist/25;gan.position.z=60-(((240-dist)%900)+900)%900;
 for(let k=0;k<tF.count;k++){const t=td[k],z=zf(t.z,420);D3.scale.set(t.sc,t.sc,t.sc);D3.position.set(t.s*t.x,3.6*t.sc+.6,z);D3.updateMatrix();tF.setMatrixAt(k,D3.matrix);D3.position.y=.9*t.sc;D3.updateMatrix();tK.setMatrixAt(k,D3.matrix);D3.position.y=6.4*t.sc;D3.updateMatrix();tF2.setMatrixAt(k,D3.matrix)}
 for(const b of bd){const m=bV[b.v];if(b.j>=m.count)continue;const cs=ul&&!(XL.city&&XL.city(b.z,420))?.001:1;D3.scale.set(b.sx*cs,b.sy*cs,b.sx*cs);D3.position.set(b.s*b.x,m.geometry.parameters.height*b.sy/2,zf(b.z,420));D3.updateMatrix();m.setMatrixAt(b.j,D3.matrix)}
 D3.scale.set(1,1,1);
 for(let k=0;k<NL;k++)for(let s=0;s<2;s++){const z=60-(((k*30-dist)%420)+420)%420,i=k*2+s,sx=s?1:-1;D3.position.set(sx*8.3,3.2,z);D3.updateMatrix();pl.setMatrixAt(i,D3.matrix);D3.position.set(sx*7.8,6.45,z);D3.updateMatrix();lh.setMatrixAt(i,D3.matrix)}
 for(const m of[tF,tF2,tK,pl,lh,...bV])m.instanceMatrix.needsUpdate=true;
 const blink=(time*2.6)%1<.5,hdr=cfg.q==='ultra'||cfg.q==='stellar',hm=hdr?2.3:1,fa=Math.floor(time*7)%2;
 for(const o of tr)if(o.on){const yw=(o.ch&&o.ch.k>0&&o.ch.k<1)?-(o.ch.x1-o.ch.x0)*.09*Math.sin(Math.PI*o.ch.k):0;o.g.position.set(o.x,0,-o.d);o.g.rotation.y=(o.s<0?Math.PI:0)+yw;o.body.rotation.x=o.br?-.02:0;
  o.tail.color.setHex(o.br?0xff2020:dark>.4?0xa01414:0x5a0d0d).multiplyScalar(o.br?hm:1);o.sl.color.setHex(o.sig<0&&blink?0xffa000:0x3a2200);o.sr.color.setHex(o.sig>0&&blink?0xffa000:0x3a2200);for(const w of o.wh)w.rotation.x-=Math.abs(o.s)/o.r*dt;
  const sa=o.ch&&o.ch.k>0&&o.ch.k<1?-Math.sign(o.ch.x1-o.ch.x0)*.12*Math.sin(Math.PI*o.ch.k):0;for(const f of o.fw)f.rotation.y=sa;
  if(EMER[o.kind]){const em=o.chase||o.kind==='ambulance'&&o.s>0;o.lb1.color.setHex(em&&fa?0xff2020:0x300505).multiplyScalar(em&&fa?hm:1);o.lb2.color.setHex(em&&!fa?0x2a50ff:0x050a30).multiplyScalar(em&&!fa?hm:1)}}
 if(st==='menu'){P.g.position.set(0,0,0);P.g.rotation.set(0,0,0);P.body.rotation.set(0,0,0);P.body.position.y=0}
 else if(st==='run'){
  /* spring-mounted body: weight transfer under braking, acceleration and cornering, plus road bumps and hill crests */
  const wet=W&&W.wet>.4,bump=(bumpN(dist*.9)+bumpN(dist*2.3)*.4)*.0045*cl(v/45,0,1)*(1+(Math.abs(px)>5.6?3:0))*(wet?1.4:1)+Math.sin(time*53)*.003*cl(v/50,0,1),k=150,c=13;
  const tp2=cl(accl*.0016,-.09,.05)-TS.r0*v*.5,tr2=-vx*.022;
  pvl+=(k*(tp2-ps)-c*pvl)*dt;ps+=pvl*dt;rvl+=(k*(tr2-rs)-c*rvl)*dt;rs+=rvl*dt;hvl+=(k*(bump-hv)-c*hvl)*dt;hv+=hvl*dt;
  const tgt=(((keys.KeyD||keys.ArrowRight||tp.r)?1:0)-((keys.KeyA||keys.ArrowLeft||tp.l)?1:0))*.44*cl(1.25-v/90,.3,1);ste+=(tgt-ste)*Math.min(1,dt*9);
  camG+=((-accl*.012)-camG)*Math.min(1,dt*4);
  P.g.position.set(px,0,0);P.g.rotation.set(0,-vx*.015,0);P.body.position.y=hv;P.body.rotation.set(ps,0,rs);for(const f of P.fw)f.rotation.y=-ste;
  if(P.steerW)P.steerW.rotation.z=-ste*3;if(P.gDraw&&cm===4&&(gDrawT-=dt)<=0){gDrawT=.07;P.gDraw(v*3.6,rpm,gear)}}
 P.tail.color.setHex(brk&&st==='run'?0xff2020:dark>.4?0xa01414:0x5a0d0d).multiplyScalar(brk?hm:1);for(const w of P.wh)w.rotation.x-=v/P.r*dt;
 /* nitro flames: flickering cone pairs, plus an orange burst on overrun backfire */
 nitA+=((tp.ns&&st==='run'?1:0)-nitA)*Math.min(1,dt*(tp.ns?9:4));const bf=bfT>0&&st==='run'&&nitA<.2;
 for(const f of NFL){const on=nitA>.04||bf;f.g.visible=on;if(on){const L=bf?.9:.6+nitA*(1.9+Math.random()*.7),w=bf?1.4:.55+nitA*.6;f.g.scale.set(w,w,L);if(bf)f.m1.color.setRGB(3,1.1,.2);else f.m1.color.setRGB(.25,.6,3);f.m1.opacity=.55+Math.random()*.3;f.dm.position.set(0,0,.62);f.dm.scale.setScalar((.8+Math.random()*.5)/w)}}
 ng.style.opacity=nitA*.8;
 if(st==='menu'){cam.position.set(Math.sin(time*.45)*7.5,2.3,Math.cos(time*.45)*7.5);cam.lookAt(0,.8,0);cam.fov=48;cam.updateProjectionMatrix()}
 else{const t=camTarget(dt),fp=cm===2||cm===3||cm===4,k=1-Math.exp(-(fp?40:cm===5?4:8)*dt);camPos.lerp(tv.set(t[0],t[1],t[2]),k);camLook.lerp(tl.set(t[3],t[4],t[5]),k);
  const sh=shake+(v>55?(v-55)*.0016:0)+(tp.ns?.05:0)+nitA*.02,f=t[6]+(cm===5?0:v/80*18+nitA*12);shake=Math.max(0,shake-dt*1.2);
  cam.fov+=(f-cam.fov)*Math.min(1,dt*5);cam.position.copy(camPos);if(!RMo)cam.position.add(tv.set((Math.random()-.5)*sh,(Math.random()-.5)*sh,0));cam.lookAt(camLook);
  const rl=fp?rs*.7:-vx*.006-TS.k0*v*.04;camRoll+=(rl-camRoll)*Math.min(1,dt*5);if(!RMo)cam.rotateZ(camRoll);cam.updateProjectionMatrix()}
 R.getSize(SZ);const pxs=SZ.y*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));PA.m.uniforms.sc.value=PN.m.uniforms.sc.value=pxs;const pv=st==='menu'?0:v;PA.step(dt,pv);PN.step(dt,pv);
 if(P.gauge)P.gauge.visible=cm===4;
 stars.position.copy(cam.position);vg.style.opacity=st==='menu'?0:cl((v-35)/45,0,.9);if(st==='run')speedLines();else if(slc.width)slx.clearRect(0,0,slc.width,slc.height);
 beam.position.x=px;beam.material.opacity=st!=='menu'&&(lights||dark>.45)?.22*(.4+.6*dark):0}
function frame(t){raf=requestAnimationFrame(frame);const raw=(t-lt)/1000,dt=Math.min(raw,.05);lt=t;time+=dt;drsStep(raw);
 if(!paused){if(st==='run')step(dt);else if(st==='crash'||st==='over')crashStep(dt)}
 draw(dt);if(st==='run'&&!paused&&(hudT-=dt)<=0){hudT=.1;hud()}const X=XLm();if(X)X.render();else R.render(sc,cam)}

/* ---------- input ---------- */
const kd=e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(e.code==='Space'||e.code==='Enter'){if(st==='menu'||st==='over')start();return}
 if(st==='menu'){if(e.code==='ArrowLeft'||e.code==='KeyA')carStep(-1);else if(e.code==='ArrowRight'||e.code==='KeyD')carStep(1);return}
 if(e.code==='Escape'||e.code==='KeyP'){pause(!paused);return}
 if(st!=='run'||paused)return;
 if(e.code==='KeyC')camNext();else if(e.code==='KeyH')hornOn(true);else if(e.code==='KeyF')showFps=!showFps;else if(e.code==='KeyL'){lights=!lights;api.sfx('click')}else if(e.code==='KeyR')start()};
const ku=e=>{keys[e.code]=false;if(e.code==='Space')e.preventDefault();if(e.code==='KeyH')hornOn(false)};
const zn=()=>{tp.l=tp.r=tp.b=false;for(const z of ptr.values())tp[z]=true};
const pd=e=>{if(e.pointerType==='mouse'||st!=='run'||e.target.closest('.ov,button,.tb'))return;const b=root.getBoundingClientRect(),f=(e.clientX-b.left)/b.width;ptr.set(e.pointerId,f<.38?'l':f>.62?'r':'b');zn()};
const pu=e=>{ptr.delete(e.pointerId);tp.n=false;zn();hornOn(false)};
ui.addEventListener('pointerdown',e=>{const t=e.target.dataset&&e.target.dataset.t;if(!t)return;if(t==='n')tp.n=true;else if(t==='c')camNext();else if(t==='h')hornOn(true)});
ui.addEventListener('click',e=>{const a=e.target.closest('[data-a]');setTimeout(()=>document.activeElement&&document.activeElement.blur&&document.activeElement.blur(),0);if(!a)return;const k=a.dataset.a;
 if(k==='go')start();else if(k==='pause')pause(!paused);else if(k==='res')pause(false);else if(k==='menu')menu();else if(k==='exit')api.exit();
 else if(k==='mp'){mapSel=(mapSel+1)%6;api.put('map',mapSel);if(WORLD)WORLD.map(mapSel);menu()}else if(k==='cp')carStep(-1);else if(k==='cn')carStep(1);else if(k==='m0'||k==='m1'){M=+k[1];menu()}});
const vis=()=>{if(document.hidden)pause(true);lt=performance.now()};
const offG=api.on(applyG),ro=new ResizeObserver(applyG);ro.observe(root);
addEventListener('keydown',kd);addEventListener('keyup',ku);root.addEventListener('pointerdown',pd);addEventListener('pointerup',pu);addEventListener('pointercancel',pu);document.addEventListener('visibilitychange',vis);
applyG();menu();raf=requestAnimationFrame(frame);
return()=>{cancelAnimationFrame(raf);offG();ro.disconnect();removeEventListener('keydown',kd);removeEventListener('keyup',ku);root.removeEventListener('pointerdown',pd);removeEventListener('pointerup',pu);removeEventListener('pointercancel',pu);document.removeEventListener('visibilitychange',vis);if(WORLD)WORLD.dispose();
 T.Material.prototype.onBeforeCompile=function(){};R.dispose();R.forceContextLoss();api.music(null);SND.dispose()}}
