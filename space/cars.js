/* Stellar Drive vehicles. Every vehicle is built from parts that are merged by material, so a car costs about 20 draw calls instead of 60+.
   Bodies are extruded from real side profiles; wheels are separate (spin, steer, suspension travel) and the body floats on springs above them. */
export const SPD={taxi:[24,34],bus:[18,24],hatch:[22,30],sedan:[24,34],suv:[24,32],wagon:[22,30],gt:[36,48],van:[20,26],pickup:[22,30],truck:[16,22],
 coupe:[28,38],hothatch:[28,38],muscle:[30,40],roadster:[26,36],kei:[18,26],jeep:[20,28],minivan:[22,30],police:[28,36],ambulance:[26,34],schoolbus:[16,22],
 boxtruck:[18,24],tanker:[15,21],towtruck:[20,28],motorbike:[26,42],scooter:[14,20],supra:[36,46],hyper:[40,50]};
/* how often each kind shows up in traffic */
export const WT={sedan:1,hatch:1,suv:1,wagon:.8,taxi:.8,van:.7,pickup:.8,minivan:.8,kei:.6,jeep:.5,truck:.7,bus:.4,boxtruck:.5,tanker:.4,coupe:.5,hothatch:.5,muscle:.45,roadster:.4,gt:.3,
 police:.4,ambulance:.22,schoolbus:.3,towtruck:.3,motorbike:.5,scooter:.3};
export const POOL=['sedan','hatch','suv','wagon','taxi','van','pickup','minivan','sedan','hatch','suv','truck','kei','jeep','coupe','hothatch','muscle','roadster','boxtruck','bus','tanker','gt',
 'police','ambulance','schoolbus','towtruck','motorbike','motorbike','scooter','taxi','pickup','wagon','minivan','truck','sedan','suv'];
export const FX={taxi:0xf2c200,police:0x14151a,ambulance:0xf2f2ee,schoolbus:0xf2b705};
export const COLS=[0xdfe3e8,0x1d2025,0x8a8f96,0xa32b2b,0x2d5d9c,0x3b7a57,0xd9b13a,0x6b4b2e,0xeeeeee,0x4b5560,0x7a1f3d,0x1f6f8b,0xc8c4b8,0xe85d1c];
/* [length, width, beltline, roof, hood, cabin, windshield rake, rear rake, trunk drop]; r wheel radius; rim style */
const CAT={taxi:{p:[4.6,1.8,.9,1.42,1.25,2.05,.65,.8,.1],rim:'steel'},hatch:{p:[3.9,1.72,.86,1.46,.85,2,.55,.25,0],rim:'five'},sedan:{p:[4.6,1.8,.9,1.42,1.25,2.05,.65,.8,.1],rim:'five'},
 suv:{p:[4.7,1.95,1.08,1.8,1.15,2.7,.5,.2,0],r:.38,rim:'multi'},wagon:{p:[4.8,1.82,.9,1.46,1.2,2.8,.6,.35,0],rim:'five'},gt:{p:[4.5,1.95,.78,1.2,1.5,1.45,.55,.5,.05],r:.35,rim:'mesh'},
 van:{p:[5,2,1.15,2.15,.8,3.4,.55,.1,0],r:.36,rim:'steel'},pickup:{p:[5.3,2,1,1.78,1.2,1.7,.6,.1,0],r:.38,rim:'multi'},
 coupe:{p:[4.4,1.82,.84,1.3,1.4,1.65,.6,.55,.08],rim:'mesh'},hothatch:{p:[3.95,1.77,.84,1.42,.85,2,.6,.3,0],r:.33,rim:'five'},muscle:{p:[4.95,1.95,.92,1.36,1.6,1.75,.62,.5,.1],r:.36,rim:'dish'},
 roadster:{p:[4,1.8,.8,1.12,1.3,1.3,.5,.4,.05],open:1,rim:'five'},kei:{p:[3.4,1.48,.86,1.58,.62,2.1,.5,.2,0],r:.28,rim:'steel'},jeep:{p:[4,1.9,1.12,1.95,.95,2.35,.2,.1,0],r:.43,rim:'dish'},
 minivan:{p:[4.9,1.95,1,1.78,.9,3.1,.55,.25,0],r:.35,rim:'five'},police:{p:[4.7,1.85,.9,1.42,1.25,2.05,.65,.8,.1],rim:'steel'},ambulance:{p:[5.2,2,1.15,2.2,.8,3.5,.55,.1,0],r:.37,rim:'steel'},
 supra:{p:[4.51,1.81,.9,1.27,1.7,1.55,.7,.78,.04],r:.34,rim:'gold'},towtruck:{p:[5.6,2,1.05,1.9,1.1,1.6,.55,.1,0],r:.4,rim:'steel'}};
const HEAVY={truck:{L:11.4,W:2.5,r:.5},bus:{L:11,W:2.5,r:.5},schoolbus:{L:9.5,W:2.45,r:.46},boxtruck:{L:7.4,W:2.3,r:.45},tanker:{L:10.4,W:2.5,r:.5}};

export function makeCars(T,ctx){
 const{Group,Mesh,BoxGeometry,CylinderGeometry,ExtrudeGeometry,Shape,PlaneGeometry,TorusGeometry,SphereGeometry,MeshStandardMaterial,MeshPhysicalMaterial,MeshLambertMaterial,MeshBasicMaterial,BufferGeometry,Float32BufferAttribute,Matrix4,Vector3,Quaternion,Euler,CanvasTexture,SRGBColorSpace,Color}=T;
 const{cfg,ENVM}=ctx,pick=a=>a[Math.random()*a.length|0],hi=cfg.q==='high'||cfg.q==='ultra'||cfg.q==='stellar';
 const GL=new MeshStandardMaterial({color:0x22313e,roughness:.03,metalness:1}),CBN=new MeshStandardMaterial({color:0x101113,roughness:.4,metalness:.35}),CHR=new MeshStandardMaterial({color:0xdde2e8,roughness:.1,metalness:1}),
  PLT=new MeshStandardMaterial({color:0xf2f2ee,roughness:.6}),TRM=new MeshLambertMaterial({color:0x0d0e10}),RMM=new MeshStandardMaterial({color:0xb9bec6,roughness:.3,metalness:.9}),GLD=new MeshStandardMaterial({color:0xc9a24a,roughness:.28,metalness:1}),
  DKM=new MeshLambertMaterial({color:0x1a1c20}),HLM=new MeshBasicMaterial({color:0xfff4d2}),BK=new MeshStandardMaterial({color:0x0b0b0d,roughness:.35,metalness:.4}),RD=new MeshLambertMaterial({color:0xc01818}),
  WH=new MeshStandardMaterial({color:0xf1f1ee,roughness:.4,metalness:.3}),YE=new MeshStandardMaterial({color:0xf2b705,roughness:.45,metalness:.2}),INT=new MeshLambertMaterial({color:0x17181b}),SEAT=new MeshLambertMaterial({color:0x2a2b30});
 ENVM.push(GL,CHR,CBN,RMM,GLD,BK,WH,YE);
 const paint=c=>{const m=hi?new MeshPhysicalMaterial({color:c,roughness:.3,metalness:.5,clearcoat:1,clearcoatRoughness:.08}):new MeshStandardMaterial({color:c,roughness:.3,metalness:.5});ENVM.push(m);return m};
 const shp=p=>{const s=new Shape();p.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));return s};
 const extG=(p,w,b=.07)=>{const g=new ExtrudeGeometry(shp(p),{depth:w-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2});g.translate(0,0,-(w-2*b)/2);g.rotateY(Math.PI/2);return g};
 const UB=new BoxGeometry(1,1,1),UC=new CylinderGeometry(1,1,1,18),US=new SphereGeometry(1,14,10),V=new Vector3(),S=new Vector3(),Q=new Quaternion(),E=new Euler();
 const mat=(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>new Matrix4().compose(V.set(x,y,z),Q.setFromEuler(E.set(rx,ry,rz)),S.set(sx,sy,sz));
 /* part collector: parts are grouped by material key and merged into one geometry per key */
 class B{constructor(){this.p={}}
  add(k,g,m){(this.p[k]||(this.p[k]=[])).push([g,m])}
  box(k,w,h,l,x,y,z,rx,ry,rz){this.add(k,UB,mat(x,y,z,w,h,l,rx,ry,rz))}
  cyl(k,r,len,x,y,z,rx,ry,rz){this.add(k,UC,mat(x,y,z,r,len,r,rx,ry,rz))}
  cylZ(k,r,len,x,y,z){this.add(k,UC,mat(x,y,z,r,len,r,Math.PI/2,0,0))}
  cylX(k,r,len,x,y,z){this.add(k,UC,mat(x,y,z,r,len,r,0,0,Math.PI/2))}
  sph(k,rx,ry,rz,x,y,z){this.add(k,US,mat(x,y,z,rx,ry,rz))}
  ext(k,p,w,b){this.add(k,extG(p,w,b),new Matrix4())}
  geoC(map){const P=[],N=[],C=[];for(const k in map){const c=new Color(map[k]);for(const[g0,m]of this.p[k]||[]){const g=g0.index?g0.toNonIndexed():g0.clone();g.applyMatrix4(m);const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));C.push(c.r,c.g,c.b)}}}
   if(!P.length)return null;const o=new BufferGeometry();o.setAttribute('position',new Float32BufferAttribute(P,3));o.setAttribute('normal',new Float32BufferAttribute(N,3));o.setAttribute('color',new Float32BufferAttribute(C,3));return o}
  geo(k){const P=[],N=[];for(const[g0,m]of this.p[k]||[]){const g=g0.index?g0.toNonIndexed():g0.clone();g.applyMatrix4(m);const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i))}}
   if(!P.length)return null;const o=new BufferGeometry();o.setAttribute('position',new Float32BufferAttribute(P,3));o.setAttribute('normal',new Float32BufferAttribute(N,3));return o}}

 /* ---------- lofted bodies: a rounded cross-section swept along the car (narrower at nose and tail, tapered roof), smooth-shaded ---------- */
 const sstep=(a,b,v)=>{v=Math.min(1,Math.max(0,(v-a)/(b-a)));return v*v*(3-2*v)};
 const lin=(pts,x)=>{if(x<=pts[0][0])return pts[0][1];for(let i=1;i<pts.length;i++)if(x<=pts[i][0]){const t=(x-pts[i-1][0])/(pts[i][0]-pts[i-1][0]||1);return pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t}return pts[pts.length-1][1]};
 function ring(yb,yt,hw,tw,rt,rb){const H=Math.max(yt-yb,.001);rt=Math.min(rt,H*.45,hw*tw);rb=Math.min(rb,H*.45,hw);const th=hw*tw,P=[[0,yb],[hw-rb,yb]];
  for(let i=1;i<=3;i++){const a=-Math.PI/2+i*Math.PI/6;P.push([hw-rb+rb*Math.cos(a),yb+rb+rb*Math.sin(a)])}
  for(let i=1;i<=3;i++){const a=i*Math.PI/6;P.push([th-rt+rt*Math.cos(a),yt-rt+rt*Math.sin(a)])}P.push([0,yt]);
  return P.concat(P.slice(1,-1).reverse().map(([x,y])=>[-x,y]))}
 function loft(S){const pos=[],idx=[],R=S.map(s=>ring(s.yb,s.yt,s.hw,s.tw,s.rt,s.rb)),M=R[0].length;
  R.forEach((r,i)=>{for(const[px,py]of r)pos.push(px,py,-S[i].x)});
  for(let i=0;i<S.length-1;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M,c=(i+1)*M+j,d=(i+1)*M+(j+1)%M;idx.push(a,c,b,b,c,d)}
  for(const[i,fw]of[[0,0],[S.length-1,1]]){const s=S[i],base=pos.length/3,cy=(s.yb+s.yt)/2;pos.push(0,cy,-s.x);for(const[px,py]of R[i])pos.push(px,py,-s.x);
   for(let j=0;j<M;j++){const p=base+1+j,q=base+1+(j+1)%M;if(fw)idx.push(base,q,p);else idx.push(base,p,q)}}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g}
 const smooth=(S,n)=>{for(let p=0;p<n;p++){const y=S.map(s=>s.yt);for(let i=1;i<S.length-1;i++)S[i].yt=(y[i-1]+2*y[i]+y[i+1])/4}};
 const NSP={five:5,multi:7,mesh:14,dish:0,steel:0,gold:10};
 /* wheel templates are shared between every wheel of the same size and style */
 const WC={};
 function wheelT(r,wd,sty){const key=r+'|'+wd+'|'+sty;if(WC[key])return WC[key];const t=new B(),m=new B(),n={five:5,multi:7,mesh:14,dish:0,steel:0,gold:10}[sty];
  t.cylX('t',r,wd,0,0,0);t.cylX('t',r*.5,wd+.03,0,0,0);          /* tyre and brake disc */
  m.cylX('r',r*.66,wd+.02,0,0,0);m.cylX('r',r*.2,wd+.06,0,0,0);m.cylX('r',r*.7,wd*.5,0,0,0);
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;m.add('r',UB,mat(0,0,0,wd+.045,r*(sty==='mesh'?.05:.1),r*1.28,a,0,0))}
  return WC[key]={t:t.geo('t'),r:m.geo('r'),gold:sty==='gold'}}
 const wheel=(r,wd,sty)=>{const T0=wheelT(r,wd,sty),g=new Group();g.add(new Mesh(T0.t,TRM),new Mesh(T0.r,T0.gold?GLD:RMM));return g};
 const WN={},WNM=new MeshLambertMaterial({vertexColors:true});
 function wheelN(r,wd,sty){const key=r+'|'+wd+'|'+sty;if(WN[key])return WN[key];const t=new B(),n=NSP[sty];t.cylX('t',r,wd,0,0,0);t.cylX('t',r*.5,wd+.03,0,0,0);t.cylX('r',r*.66,wd+.02,0,0,0);t.cylX('r',r*.2,wd+.06,0,0,0);t.cylX('r',r*.7,wd*.5,0,0,0);
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;t.add('r',UB,mat(0,0,0,wd+.045,r*(sty==='mesh'?.05:.1),r*1.28,a,0,0))}return WN[key]=t.geoC({t:0x0d0e10,r:sty==='gold'?0xc9a24a:0xb9bec6})}

 /* ---------- assembly ---------- */
 const DET={gl:0x1c2b38,dk:0x1a1c20,cb:0x131416,ch:0xc9ced6,pl:0xe9e9e4,bk:0x0b0b0d,rd:0xb01818,wh:0xefefec,ye:0xf2b705,int:0x17181b,seat:0x2a2b30,hl:0xf4ecd0},DETM=new MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.35});ENVM.push(DETM);
 const DYN=/^(pm|tm|tl|sl|sr|lb1|lb2)$/;
 function finish(b,o){const{g,body,mats}=o;
  if(o.npc){const map={};for(const k in b.p)if(!DYN.test(k))map[k]=DET[k]!=null?DET[k]:mats[k]&&mats[k].color?mats[k].color.getHex():0x222222;
   const dg=b.geoC(map);if(dg){const m=new Mesh(dg,DETM);m.castShadow=true;body.add(m)}
   for(const k in b.p)if(DYN.test(k)){const geo=b.geo(k);if(geo){const m=new Mesh(geo,mats[k]);m.castShadow=k==='pm'||k==='tm';body.add(m)}}}
  else for(const k in b.p){const geo=b.geo(k);if(!geo)continue;const m=new Mesh(geo,mats[k]);m.castShadow=!/^(hl|tl|sl|sr|lb1|lb2)$/.test(k);body.add(m)}
  const sh=new Mesh(new PlaneGeometry(o.wid+.5,o.len+.5),new MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.03;g.add(sh);return o}
 function shell(k,col,len,wid,r,hz,spd,pl){const g=new Group(),body=new Group(),pm=paint(col),tail=new MeshBasicMaterial({color:0x5a0d0d}),sl=new MeshBasicMaterial({color:0x3a2200}),sr=new MeshBasicMaterial({color:0x3a2200}),
   lb1=new MeshBasicMaterial({color:0x300505}),lb2=new MeshBasicMaterial({color:0x050a30}),tm=new MeshStandardMaterial({color:pick(COLS),roughness:.55,metalness:.15});ENVM.push(tm);g.add(body);
  return{g,body,pm,tail,sl,sr,lb1,lb2,tm,wh:[],fw:[],wp:[],len,wid,r,hz,kind:k,spd:spd||SPD[k],ex:[],npc:!pl,mats:{pm,gl:GL,dk:DKM,cb:CBN,ch:CHR,pl:PLT,hl:HLM,tl:tail,sl,sr,bk:BK,rd:RD,wh:WH,ye:YE,lb1,lb2,tm,int:INT,seat:SEAT}}}
 /* wheels: pivot (steer + suspension travel) -> spin. front=true wheels steer */
 function addWheel(o,x,z,r,wd,sty,front){const piv=new Group(),w=o.npc?(()=>{const q=new Group();q.add(new Mesh(wheelN(r,wd,sty),WNM));return q})():wheel(r,wd,sty);piv.position.set(x,r,z);piv.add(w);o.g.add(piv);o.wh.push(w);o.wp.push(piv);if(front)o.fw.push(piv);w.traverse(q=>{if(q.isMesh)q.castShadow=true})}

 /* ---------- cars from a side profile ---------- */
 function car(k,col,pl){const d=CAT[k],[l,w,hb,hr,ho,cb,ws,rs,dr]=d.p,xf=l/2,xw=xf-ho,xr=xw-cb,r=d.r||.34,fz=-xf,rz=xf,b=new B(),sport=/^(gt|coupe|hothatch|muscle|roadster|supra)$/.test(k),roofZ=-((xw-ws)+(xr+rs))/2;
  const o=shell(k,col,l,w,r,xw+.2,undefined,pl),M=o.mats;o.hr=hr;o.hb=hb;
  /* lower body: rounded section swept nose to tail, hood and deck lines smoothed */
  const hw0=w/2,tw0=.93,hwG=(w-.14)/2,side=y=>{const y0=.4,y1=hb-.12,f=Math.min(1,Math.max(0,(y-y0)/(y1-y0)));let q=hw0*(1-(1-tw0)*f);if(y>y1-.18)q-=Math.pow((y-(y1-.18))/.18,2)*.14;return q+.004};
  const top=[[-xf,hb-.3],[-xf+.18,hb-dr-.08],[xr,hb-dr],[xw,hb],[xw+(xf-xw)*.5,hb-.09],[xf-.2,hb-.2],[xf,hb-.36]],S=[],NS=30;
  for(let i=0;i<=NS;i++){const x=-xf+l*i/NS,eF=sstep(xf-.9,xf,x),eR=1-sstep(-xf,-xf+.8,x);S.push({x,yb:.3+.06*(eF+eR),yt:lin(top,x),hw:hw0*(1-.13*eF-.1*eR),tw:tw0-.07*sstep(xw,xf,x),rt:.2,rb:.1})}
  smooth(S,2);b.add('pm',loft(S),new Matrix4());
  if(d.open){b.ext('gl',[[xw,hb-.02],[xw-ws*.6,hb+.32],[xw-ws*.6-.03,hb+.32],[xw-.04,hb-.02]],w-.14,.02);b.box('dk',w-.25,.03,cb*.85,0,hb+.005,-(xw+xr)/2);
   for(const s of[-1,1]){b.box('seat',.46,.5,.5,s*.4,hb+.2,-(xw+xr)/2-.2);b.box('seat',.4,.4,.12,s*.4,hb+.44,-(xw+xr)/2+.05);b.cylZ('ch',.025,.5,s*.4,hb+.55,-xr+.32)}b.cylX('ch',.03,w-.5,0,hb+.5,-xr+.32)}
  else{ /* glasshouse: tapered, rounded roof edges; roof panel and pillars are painted so the glass reads as separate windows */
   const rf=[[xr,hb-dr],[xr+rs,hr],[xw-ws,hr],[xw,hb]],G=[],NG=22;
   for(let i=0;i<=NG;i++){const x=xr+(xw-xr)*i/NG,yb=lin(top,x)-.02;G.push({x,yb,yt:Math.max(lin(rf,x),yb+.012),hw:hwG,tw:.78,rt:.26,rb:.02})}
   smooth(G,2);b.add('gl',loft(G),new Matrix4());
   const R2=[];for(let i=0;i<=6;i++){const x=(xr+rs-.1)+(xw-ws-xr-rs+.2)*i/6;R2.push({x,yb:hr-.05,yt:hr+.025,hw:hwG*.78-.02,tw:.93,rt:.03,rb:.01})}b.add('pm',loft(R2),new Matrix4());
   const aA=Math.atan2(hr-hb,ws),LA=Math.hypot(ws,hr-hb),aC=Math.atan2(hr-(hb-dr),rs),LC=Math.hypot(rs,hr-(hb-dr));
   for(const s of[-1,1]){b.box('pm',.06,.06,LA,s*hwG*.87,(hb+hr)/2,-(xw-ws/2),-aA,0,0);b.box('pm',.07,.07,LC,s*hwG*.87,(hb-dr+hr)/2,-(xr+rs/2),aC,0,0);if(!sport)b.box('pm',.06,hr-hb,.08,s*hwG*.91,(hb+hr)/2,-(xw+xr)/2)}}
  if(k==='taxi'){b.box('wh',.6,.17,.3,0,hr+.13,roofZ);b.box('ye',.4,.1,.02,0,hr+.13,roofZ-.16)}
  if(k==='wagon'||k==='suv'||k==='jeep')for(const s of[-1,1])b.box('dk',.04,.05,xw-ws-xr-rs,s*(hwG*.78-.1),hr+.07,roofZ);
  if(k==='pickup'||k==='towtruck')b.box('dk',w-.1,.3,1.9,0,hb+.15,xf-1.1);
  if(k==='gt'||k==='hothatch'||k==='muscle'){b.box('pm',w-.3,.05,.45,0,hb+.3,xf-.4);for(const s of[-1,1])b.box('dk',.06,.28,.12,s*.6,hb+.15,xf-.4)}
  if(k==='muscle'){b.box('cb',.7,.08,1.1,0,hb+.04,-(xw+.8));b.box('wh',.34,.012,xf+xw,.5,hb+.005,0);b.box('wh',.34,.012,xf+xw,-.5,hb+.005,0)}
  if(k==='jeep'){b.cylZ('cb',.4,.22,0,.85,xf+.14);b.cylZ('ch',.2,.24,0,.85,xf+.15)}
  if(k==='kei'||k==='minivan'||k==='van'||k==='ambulance')b.box('dk',w-.2,.05,.04,0,hb+.55,xf+.02);
  for(const s of[-1,1]){b.box('pm',.1,.1,.22,s*(hwG*.95+.05),hb+.1,-(xw-.15));b.box('dk',.07,.025,.12,s*side(hb-.12),hb-.12,-(xw-ws*.35))}   /* mirrors, door handles */
  b.box('dk',w*.84,.26,.16,0,.46,fz);b.box('dk',w*.84,.24,.16,0,.46,rz);b.box('pl',.52,.13,.03,0,.5,fz-.09);b.box('pl',.52,.13,.03,0,.5,rz+.09);
  b.box('dk',w*.5,.12,.04,0,hb-.3,fz-.02);
  for(const s of[-1,1]){b.box('ch',.02,.025,l*.6,s*side(hb-.1),hb-.1,0);if(!d.open)for(const z of[-(xw-.12),-(xr+.45)])b.box('dk',.012,hb-.58,.014,s*side(.62),.42+(hb-.58)/2,z)}
  if(sport){for(const s of[-1,1])b.box('cb',.06,.1,l*.5,s*(side(.4)+.02),.4,0);b.box('cb',w*.8,.05,.3,0,.34,fz-.05)}
  for(const s of[-1,1]){b.box('hl',.38,.14,.1,s*w*.33,hb-.22,-(l/2-.08));b.box('tl',.4,.13,.06,s*w*.34,hb-.26,l/2);for(const z of[-(l/2-.04),l/2-.04])b.box(s<0?'sl':'sr',.1,.1,.1,s*(w/2*.86-.04),hb-.4,z)}
  const exx=sport?[-.5,.5]:[-.6];for(const x of exx){b.cylZ('ch',.05,.2,x,.3,rz+.04);o.ex.push([x,.3,rz+.15])}
  if(k==='police'){b.box('wh',w-.05,.5,1.5,0,.78,.55);b.box('wh',w-.05,.5,1.5,0,.78,-.95);b.box('bk',w-.06,.62,.04,0,.65,-.2);b.box('cb',1.1,.08,.4,0,hr+.1,roofZ);b.box('lb1',.5,.1,.3,-.28,hr+.17,roofZ);b.box('lb2',.5,.1,.3,.28,hr+.17,roofZ)}
  if(k==='ambulance'){b.box('rd',w+.01,.2,3.2,0,.95,0);b.box('rd',.5,.5,.03,0,hb+.5,xf+.015);b.box('cb',1.4,.08,.4,0,hr+.1,roofZ);b.box('lb1',.6,.12,.3,-.4,hr+.17,roofZ);b.box('lb2',.6,.12,.3,.4,hr+.17,roofZ)}
  if(k==='towtruck'){b.box('cb',w-.2,.14,2.6,0,hb+.14,xf-1.5);b.box('ye',.1,.9,.1,0,hb+.7,xf-2.4);b.box('ye',.1,.1,1.6,0,hb+1.15,xf-1.8,.5);b.box('lb1',.5,.1,.3,-.3,hr+.17,roofZ);b.box('lb2',.5,.1,.3,.3,hr+.17,roofZ)}
  if(k==='supra'){supraKit(b,o,w,hb,hr,xf,xw,xr,roofZ);o.ex.length=0;for(const x of[-.6,-.42,.42,.6])o.ex.push([x,.34,rz+.15])}
  const fx=xf-.85,rx=-(xf-.85),track=w/2-(k==='supra'?.1:.05),wd=k==='muscle'||k==='supra'?.3:.24,rr=r*(k==='supra'||k==='muscle'?1.06:1);
  for(const s of[-1,1]){addWheel(o,s*track,-fx,r,wd,d.rim,true);addWheel(o,s*(track+(k==='muscle'||k==='supra'?.02:0)),-rx,rr,wd+(k==='muscle'||k==='supra'?.08:0),d.rim,false);
   for(const[zz,q]of[[-fx,r],[-rx,rr]])b.add('dk',UC,mat(s*side(q),q,zz,q*1.14,.03,q*1.14,0,0,Math.PI/2))}   /* wheel arches */
  if(pl)interior(b,o,w,hb,hr,xw,xr,ws,k);
  o.eye=[-.36,hr-.25,-(xw-ws-.12)];
  return finish(b,o)}

 /* Supra (fourth generation): long hood, short deck, tall wing, wide tail lamp bar, gold multi-spoke wheels */
 function supraKit(b,o,w,hb,hr,xf,xw,xr,roofZ){
  for(const s of[-1,1]){b.cylZ('hl',.085,.1,s*w*.3,hb-.2,-(xf-.06));b.cylZ('ch',.1,.08,s*w*.3,hb-.2,-(xf-.03));b.box('dk',.34,.12,.05,s*w*.3,.52,-(xf+.02));      /* projector lamps, lower intakes */
   b.box('cb',.08,.62,.3,s*.62,1.09,xf-.5);b.box('cb',.04,.3,.62,s*(w/2-.03),1.4,xf-.5);                                                      /* wing uprights and endplates */
   b.box('cb',.12,.03,.7,s*.5,hb+.04,-(xw+.5));b.cylZ('ch',.07,.12,s*.1,.28,xf+.05)}
  b.box('cb',w-.06,.05,.5,0,1.4,xf-.5);b.box('cb',w-.2,.025,.24,0,1.34,xf-.38);                                                            /* the wing */
  b.box('tl',w*.74,.1,.05,0,hb-.2,xf+.005);b.box('dk',.03,.1,.055,-.2,hb-.2,xf+.01);b.box('dk',.03,.1,.055,.2,hb-.2,xf+.01);b.box('dk',w-.2,.12,.07,0,.52,xf+.03);
  b.box('cb',w*.85,.04,.34,0,.3,-xf-.12);b.box('cb',w*.7,.035,.5,0,.3,xf);b.box('pm',w-.34,.06,.42,0,hb-.05,xf-.28);                                       /* splitter, diffuser, ducktail */
  b.box('cb',.4,.02,1.1,0,hb-.035,-(xw+.55));for(const s of[-1,1])b.box('cb',.015,.03,.6,s*.2,hb-.03,-(xw+.5))}

 /* ---------- cockpit: dash, wheel, seats and a live gauge cluster (player car only) ---------- */
 function interior(b,o,w,hb,hr,xw,xr,ws,k){
  const ez=-(xw-ws-.12);b.box('int',w-.2,.28,.5,0,hb-.12,-(xw-.2)-.15);b.box('int',w-.3,.06,.35,0,hb+.14,-(xw-.15)-.08);
  for(const s of[-1,1]){b.box('seat',.44,.12,.5,s*.4,hb-.3,ez+.05);b.box('seat',.44,.56,.12,s*.4,hb+.05,ez+.34);b.box('seat',.22,.2,.1,s*.4,hb+.42,ez+.38)}
  b.box('int',w-.2,.08,.5,0,hr-.04,ez+.2);
  const cv=document.createElement('canvas');cv.width=256;cv.height=128;const cx=cv.getContext('2d'),tx=new CanvasTexture(cv);tx.colorSpace=SRGBColorSpace;
  o.gauge=new Mesh(new PlaneGeometry(.42,.2),new MeshBasicMaterial({map:tx}));o.gauge.position.set(-.36,hb+.17,ez-.62);o.gauge.rotation.x=-.9;o.body.add(o.gauge);
  o.gDraw=(kmh,rpm,gear)=>{cx.fillStyle='#07080a';cx.fillRect(0,0,256,128);for(const[X,val,mx,lab]of[[70,rpm,1,'RPM'],[186,kmh/340,1,'KM/H']]){cx.strokeStyle='#2a2d33';cx.lineWidth=8;cx.beginPath();cx.arc(X,70,46,2.4,7.0);cx.stroke();
    cx.strokeStyle=val>.88&&lab==='RPM'?'#ff3b3b':'#ffc83d';cx.beginPath();cx.arc(X,70,46,2.4,2.4+4.6*Math.min(1,val));cx.stroke();cx.fillStyle='#8d9198';cx.font='11px system-ui';cx.textAlign='center';cx.fillText(lab,X,108)}
   cx.fillStyle='#f4f4f2';cx.font='800 34px system-ui';cx.textAlign='center';cx.fillText(Math.round(kmh),186,82);cx.font='800 30px system-ui';cx.fillText(gear,70,82);tx.needsUpdate=true};
  const sw=new Group(),ring=new Mesh(new TorusGeometry(.17,.022,8,24),INT);sw.add(ring);for(const a of[0,2.1,4.2]){const sp=new Mesh(new BoxGeometry(.015,.15,.02),INT);sp.position.set(Math.sin(a)*.075,Math.cos(a)*.075,0);sp.rotation.z=-a;sw.add(sp)}
  sw.position.set(-.36,hb+.02,ez-.32);sw.rotation.x=-1.0;o.body.add(sw);o.steerW=sw}

 /* ---------- trucks, buses and tankers ---------- */
 function heavy(k,col){const H=HEAVY[k],L=H.L,W=H.W,r=H.r,b=new B(),o=shell(k,col,L,W,r,2.5,undefined,false),M=o.mats;o.hr=3;o.hb=1.7;
  const bus=k==='bus'||k==='schoolbus',axles=[];
  if(bus){const hh=k==='bus'?3.4:3;b.ext('pm',[[-L/2,.5],[L/2,.5],[L/2,hh-.1],[L/2-.2,hh],[-L/2+.2,hh],[-L/2,hh-.3]],W);b.ext('gl',[[L/2-.05,1.25],[L/2-.05,hh-.35],[-L/2+.3,hh-.35],[-L/2+.3,1.25]],W+.04,.02);b.box('dk',W+.02,.12,L-.4,0,1.2,0);
   if(k==='schoolbus'){o.mats.pm.color.setHex(0xf2b705);b.box('bk',W+.03,.14,L-.2,0,.95,0);b.box('bk',W+.03,.1,L-.2,0,1.9,0);b.box('rd',.5,.5,.04,-W/2-.03,1.6,L/2-1.4);b.box('rd',W,.3,.1,0,hh-.4,L/2+.03)}
   b.box('hl',.5,.2,.1,-W*.33,.8,-(L/2));b.box('hl',.5,.2,.1,W*.33,.8,-(L/2));b.box('tl',.4,.2,.06,-W*.35,.9,L/2);b.box('tl',.4,.2,.06,W*.35,.9,L/2);b.box('wh',2,.5,.1,0,hh-.2,-(L/2)-.04);
   axles.push([L*.33,0],[-L*.32,0]);o.eye=[-.5,2.4,-(L/2-1)];o.ex.push([-.9,.4,L/2+.1])}
  else{const cabL=k==='boxtruck'?2.2:3.1,cx=-L/2+(k==='boxtruck'?cabL/2+.1:cabL/2+.1),ch=k==='boxtruck'?2.6:3.3,front=-L/2,
    cab=[[front+.1,.55],[front+cabL+.1,.55],[front+cabL+.1,ch*.55],[front+cabL-.2,ch],[front+.5,ch],[front+.15,ch*.8]];
   b.ext('pm',cab.map(([x,y])=>[-x,y]),W);b.ext('gl',[[-(front+.2),ch*.52],[-(front+.5),ch*.95],[-(front+cabL-.5),ch*.95],[-(front+cabL-.5),ch*.52]].map(([x,y])=>[x,y]),W+.04,.02);
   b.box('dk',W-.1,.5,.2,0,.8,front-.08);b.box('hl',.4,.18,.1,-W*.3,.85,front-.1);b.box('hl',.4,.18,.1,W*.3,.85,front-.1);b.box('ch',W-.4,.1,.05,0,1.05,front-.12);b.cylZ('ch',.06,1.2,-W/2+.08,ch*.5,front+.9);b.cylZ('ch',.06,1.2,W/2-.08,ch*.5,front+.9);
   const bl=L-cabL-.5,bz=front+cabL+.3+bl/2;
   if(k==='tanker'){b.cylZ('tm',1.25,bl,0,2.05,bz);b.sph('tm',1.25,1.25,.25,0,2.05,bz-bl/2);b.sph('tm',1.25,1.25,.25,0,2.05,bz+bl/2);b.box('dk',W-.4,.3,bl,0,.8,bz);for(let i=0;i<4;i++)b.cylZ('ch',1.27,.1,0,2.05,bz-bl/2+bl*(i+.5)/4);b.cylZ('ch',.3,.2,0,3.35,bz);b.box('rd',.4,.4,.02,0,2.05,bz+bl/2+.3)}
   else{b.box('tm',W,k==='boxtruck'?2.7:2.75,bl,0,k==='boxtruck'?2.05:2.45,bz);b.box('dk',W-.2,.5,bl,0,.85,bz)}
   b.box('tl',.4,.2,.06,-W*.35,.9,L/2);b.box('tl',.4,.2,.06,W*.35,.9,L/2);b.box('dk',W,.3,.1,0,.55,L/2);
   axles.push(k==='boxtruck'?[-L/2+1.5,0]:[-L/2+1.4,0],...(k==='boxtruck'?[[L/2-1.4,1]]:[[L/2-2.6,2],[L/2-1.3,2]]));o.eye=[-.55,ch-.4,front+1.1];o.ex.push([W/2-.15,ch*.7,front+cabL])}
  b.box('pl',.6,.15,.03,0,.7,-L/2-.1);
  const fz0=Math.min(...axles.map(a=>a[0]));for(const[z,n]of axles)for(const s of[-1,1])for(let j=0;j<(n===2?2:1);j++)addWheel(o,s*(W/2-.2-j*.5),z,r,.32,'steel',z===fz0&&j===0);
  return finish(b,o)}

 /* ---------- motorbike and scooter ---------- */
 function bike(k,col){const sc=k==='scooter'?.8:1,L=2.1*sc,r=(k==='scooter'?.22:.31),b=new B(),o=shell(k,col,L,.8,r,.4,undefined,false);o.hr=1.3;o.hb=.9;const jk=pick([0xc01818,0x1f4f8f,0x222428,0xd9b13a,0x3b7a57]);o.mats.jk=new MeshLambertMaterial({color:jk});o.mats.hm=new MeshLambertMaterial({color:pick([0xe8e8e4,0x1d2025,0xc01818,0x2d5d9c,0xf2b705])});
  b.ext('pm',[[-.6*sc,.45],[.5*sc,.5],[.62*sc,.85],[.1*sc,.98],[-.5*sc,.8]].map(([x,y])=>[x,y]),.34,.05);
  b.cylZ('ch',.045,1.1*sc,.2*sc,.8,-.45*sc);b.box('dk',.2,.25,.7*sc,0,.62,.1*sc);b.box('seat',.26,.1,.6*sc,0,.9,.32*sc);b.box('ch',.62,.04,.04,0,1.12,-.45*sc);b.box('hl',.18,.14,.1,0,1.02,-.55*sc);b.box('tl',.2,.08,.06,0,.95,.78*sc);
  b.cylZ('ch',.05,.8*sc,.2,.38,.55*sc);o.ex.push([.2,.36,.95*sc]);b.box('sl',.07,.07,.07,-.3,1.14,-.45*sc);b.box('sr',.07,.07,.07,.3,1.14,-.45*sc);b.box('pl',.2,.12,.02,0,.7,.82*sc);
  b.box('jk',.34,.55,.28,0,1.2,.1*sc);b.box('jk',.1,.08,.55,-.26,1.32,-.12*sc,.3);b.box('jk',.1,.08,.55,.26,1.32,-.12*sc,.3);b.box('dk',.18,.5,.12,-.1,.62,.2*sc);b.box('dk',.18,.5,.12,.1,.62,.2*sc);b.sph('hm',.17,.18,.19,0,1.68,-.04*sc);
  addWheel(o,0,-.7*sc,r,.14,'multi',true);addWheel(o,0,.72*sc,r,.18,'multi',false);o.wid=.8;o.eye=[0,1.6,.1];return finish(b,o)}

 /* ---------- Stellar FXX: the original hypercar, rebuilt on the merged pipeline ---------- */
 function hyper(col){const W=2,L=4.9,b=new B(),o=shell('hyper',col,L,W,.36,-.35,[40,50],true),M=o.mats;o.hr=1.15;o.hb=.9;
  const T0=[[-2.45,.82],[-2.3,1.0],[-1.2,.9],[-.1,.8],[.75,.76],[1.75,.64],[2.4,.5],[2.46,.42]],S=[];
  for(let i=0;i<=34;i++){const x=-2.45+4.91*i/34,eF=sstep(1.55,2.46,x),eR=1-sstep(-2.45,-1.6,x);S.push({x,yb:.3+.05*(eF+eR),yt:lin(T0,x),hw:(W/2)*(1-.17*eF-.12*eR),tw:.9,rt:.26,rb:.12})}
  smooth(S,2);b.add('pm',loft(S),new Matrix4());
  const rf=[[-1.45,.86],[-1.3,.92],[-.7,1.14],[.1,1.12],[.7,.78]],G=[];for(let i=0;i<=18;i++){const x=-1.45+2.15*i/18,yb=lin(T0,x)-.02;G.push({x,yb,yt:Math.max(lin(rf,x),yb+.012),hw:.74,tw:.7,rt:.3,rb:.02})}smooth(G,2);b.add('gl',loft(G),new Matrix4());
  const R2=[];for(let i=0;i<=6;i++){const x=-.9+1.0*i/6,y=lin(rf,x);R2.push({x,yb:y-.05,yt:y+.025,hw:.74*.7-.03,tw:.92,rt:.03,rb:.01})}b.add('pm',loft(R2),new Matrix4());
  b.box('gl',1.2,.05,1,0,1.04,1.55);for(let i=0;i<4;i++)b.box('cb',1.2,.03,.04,0,1.07,1.2+i*.22);
  for(const s of[-1,1]){b.box('cb',.1,.3,1,s*(W/2+.01),.62,.5);b.box('cb',.1,.2,.5,s*(W/2+.01),.5,-1.1);b.box('cb',.05,.5,.05,s*(W/2+.01),.62,-.15);b.box('cb',.06,.09,.3,s*(W/2-.05),.9,-.5);
   b.box('hl',.6,.07,.12,s*.68,.56,-2.4);b.box('hl',.5,.03,.05,s*.7,.5,-2.43);b.box('cb',.06,.45,.7,s*.97,1.38,2.12);b.box('cb',.05,.4,.05,s*.5,1.17,2.1);b.box('cb',.1,.3,.5,s*.8,.35,2.2);
   b.box('tl',.35,.1,.06,s*.8,.66,2.45);b.box(s<0?'sl':'sr',.1,.08,.06,s*.92,.54,2.45);b.box(s<0?'sl':'sr',.1,.08,.06,s*.92,.5,-2.44);b.cylZ('ch',.06,.25,s*.22,.46,2.42);o.ex.push([s*.22,.46,2.55])}
  b.box('cb',2,.05,.7,0,1.45,2.12);b.box('cb',2,.025,.3,0,1.5,2);b.box('cb',W+.1,.04,.55,0,.3,-2.3);b.box('cb',1.7,.07,.5,0,.3,2.3);b.box('tl',1.5,.07,.05,0,.74,2.46);
  for(const s of[-1,1]){addWheel(o,s*.92,-1.5,.34,.3,'mesh',true);addWheel(o,s*.92,1.45,.38,.4,'mesh',false)}
  o.eye=[-.3,.98,-.05];interior(b,o,W,.9,1.15,.7,-1.3,.6,'hyper');return finish(b,o)}

 return{build(k,col,player){const o=k==='hyper'?hyper(col):HEAVY[k]?heavy(k,col):(k==='motorbike'||k==='scooter')?bike(k,col):car(k,col,player);if(FX[k])o.pm.color.setHex(FX[k]);return o}}}
