/* Stellar Drive Ultra: PS3-class pass. Branching procedural trees, houses, five maps, animated water, sky dome, clouds and bloom.
   Loaded on demand by racer.js when Graphics is set to Ultra. Bloom needs the import map in index.html (falls back to plain rendering). */
export default async function(T,sc,R,cam,x){
const{Group,Mesh,InstancedMesh,Color,Matrix4,Vector2,Vector3,Quaternion,Euler,BufferGeometry,Float32BufferAttribute,CylinderGeometry,IcosahedronGeometry,ConeGeometry,BoxGeometry,PlaneGeometry,SphereGeometry,MeshStandardMaterial,MeshBasicMaterial,ShaderMaterial,BackSide,CanvasTexture,RepeatWrapping,Sprite,SpriteMaterial,AdditiveBlending,WebGLRenderTarget,HalfFloatType}=T;
const cl=(v,a,b)=>Math.min(b,Math.max(a,v)),rnd=(a,b)=>a+Math.random()*(b-a),rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const UP=new Vector3(0,1,0),CC=new Color(),C2=new Color(),V1=new Vector3(),V2=new Vector3(),QQ=new Quaternion(),MM=new Matrix4(),ZM=new Matrix4().makeScale(.0001,.0001,.0001);
const tf=(px,py,pz,rx,ry,rz,sx,sy,sz)=>new Matrix4().compose(new Vector3(px,py,pz),new Quaternion().setFromEuler(new Euler(rx,ry,rz)),new Vector3(sx,sy,sz));

/* merge coloured parts [geometry, matrix, hex, jitter] into one vertex-coloured geometry */
function mrg(parts){const P=[],N=[],C=[];for(const[g0,m,c,j]of parts){const g=g0.index?g0.toNonIndexed():g0.clone();g.applyMatrix4(m);const p=g.attributes.position,n=g.attributes.normal;CC.setHex(c);
 for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));const k=1+(j||0)*.5*Math.sin(i*12.9898+p.getX(i)*78.233+p.getY(i)*37.719);C.push(CC.r*k,CC.g*k,CC.b*k)}}
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(P,3));g.setAttribute('normal',new Float32BufferAttribute(N,3));g.setAttribute('color',new Float32BufferAttribute(C,3));return g}
const CY=new CylinderGeometry(1,.72,1,6),IC=new IcosahedronGeometry(1,1),CO=new ConeGeometry(1,1,10),BX=new BoxGeometry(1,1,1),PY=new ConeGeometry(.7071,1,4).rotateY(Math.PI/4);
const seg=(P,a,d,L,r,c)=>P.push([CY,new Matrix4().compose(a.clone().addScaledVector(d,L/2),new Quaternion().setFromUnitVectors(UP,d),new Vector3(r,L,r)),c,.3]);
const blob=(P,p,s,c)=>P.push([IC,new Matrix4().compose(p,new Quaternion(),new Vector3(s,s*.78,s)),c,.55]);
const LF=[0x3d7a2b,0x4c8f35,0x2e6528,0x5aa03c],BARK=0x5b402a;

/* oak: trunk plus three generations of branches (40 limbs), a leaf mass on every tip and joint */
function oak(sd){const r=rng(sd),P=[];
 const rec=(a,d,L,rd,n)=>{seg(P,a,d,L,rd,BARK);const e=a.clone().addScaledVector(d,L);if(n===1)blob(P,e,1.3,LF[r()*4|0]);
  if(!n){blob(P,e.clone().add(new Vector3((r()-.5)*.6,.3,(r()-.5)*.6)),.9+r()*.8,LF[r()*4|0]);return}
  for(let i=0;i<3;i++){const ph=i*2.094+r()*1.1,tl=.55+r()*.5;rec(e,new Vector3(Math.sin(tl)*Math.cos(ph),Math.cos(tl)+.35,Math.sin(tl)*Math.sin(ph)).normalize(),L*.74,rd*.62,n-1)}};
 rec(new Vector3(),new Vector3(0,1,0),2.4,.24,3);return mrg(P)}
/* pine: nine drooping tiers, each with its own branch stubs */
function pine(sd){const r=rng(sd),P=[];seg(P,new Vector3(),UP,8.2,.26,0x4a3524);
 for(let i=0;i<9;i++){const t=i/9,y=1.3+t*6.2,rad=(1-t)*2.6+.45;P.push([CO,tf(0,y+1,0,0,0,0,rad,2.5,rad),i%2?0x1f4f31:0x2a6340,.5]);
  for(let j=0;j<4;j++){const a=r()*6.283;seg(P,new Vector3(0,y+.5,0),new Vector3(Math.cos(a),-.25,Math.sin(a)).normalize(),rad*.95,.06,0x4a3524)}}
 return mrg(P)}
/* palm: curved trunk and ten arching fronds */
function palm(sd){const r=rng(sd),P=[],ln=(r()-.5)*.5;let a=new Vector3();
 for(let i=0;i<8;i++){const d=new Vector3(Math.sin(ln*(i/8)*1.6),1,0).normalize();seg(P,a,d,.95,.24-i*.012,0x8a6a45);a=a.clone().addScaledVector(d,.95)}
 for(let f=0;f<10;f++){const ph=f/10*6.283+r()*.3,b=a.clone(),d=new Vector3(Math.cos(ph),.75,Math.sin(ph)).normalize();
  for(let k=0;k<5;k++){P.push([BX,new Matrix4().compose(b.clone().addScaledVector(d,.45),new Quaternion().setFromUnitVectors(new Vector3(0,0,1),d),new Vector3(.9-k*.14,.03,.9)),0x3d8a3a,.5]);b.addScaledVector(d,.9);d.y-=.38;d.normalize()}}
 return mrg(P)}
function cactus(sd){const r=rng(sd),P=[],G=0x3f8a4f;P.push([CY,tf(0,1.7,0,0,0,0,.42,3.4,.42),G,.2],[IC,tf(0,3.4,0,0,0,0,.42,.45,.42),G,.2]);
 for(const s of[-1,1]){const h=1+r()*1.1;P.push([CY,tf(s*.55,1.6,0,0,0,Math.PI/2,.18,.8,.18),G,.2],[CY,tf(s*.95,1.6+h/2,0,0,0,0,.18,h,.18),G,.2],[IC,tf(s*.95,1.6+h,0,0,0,0,.18,.2,.18),G,.2])}return mrg(P)}
function rock(sd,c){const r=rng(sd),g=new IcosahedronGeometry(1,1).toNonIndexed(),p=g.attributes.position,k=new Map();
 for(let i=0;i<p.count;i++){const key=p.getX(i).toFixed(3)+p.getY(i).toFixed(3)+p.getZ(i).toFixed(3);if(!k.has(key))k.set(key,.75+r()*.5);const q=k.get(key);p.setXYZ(i,p.getX(i)*q*1.3,p.getY(i)*q*.8,p.getZ(i)*q)}
 g.computeVertexNormals();return mrg([[g,new Matrix4(),c,.3]])}
/* houses: 0 suburban, 1 cabin, 2 villa, 3 adobe. Front faces +z; windows are a second mesh so they can glow at night */
function house(sd,st){const r=rng(sd),P=[],W=[],w=[8,7,9,7.5][st]*(.9+r()*.25),d=[6.5,6,7,6][st]*(.9+r()*.2),h=[3.3,3,3.2,3][st],
 wall=[[0xe9e2d0,0xd9c7a6,0xc9d6dc,0xe6c9c0],[0x7a5236,0x6b4a30,0x8a6240,0x5e3f29],[0xf3eee4,0xece0cc,0xf2dccb,0xe0eaee],[0xc98b5b,0xd29a6a,0xbf7f50,0xd8a878]][st][r()*4|0],
 roof=[[0x8a3b2e,0x4a4f5a,0x6a3a2a],[0x3a2f2a,0x2f3b34,0x4a3a30],[0xb8552e,0xc06a3a,0xb8552e],[0x9a5a38,0x8a4e30,0x9a5a38]][st][r()*3|0];
 P.push([BX,tf(0,h/2,0,0,0,0,w,h,d),wall,.1]);
 if(st>1)P.push([BX,tf(0,h+.15,0,0,0,0,w+.5,.3,d+.5),roof,.15],[BX,tf(w*.2,h+.8,-d*.1,0,0,0,w*.4,1.3,d*.5),wall,.1],[BX,tf(w*.2,h+1.5,-d*.1,0,0,0,w*.4+.4,.2,d*.5+.4),roof,.15]);
 else P.push([PY,tf(0,h+1.2,0,0,0,0,w*1.12,2.4,d*1.12),roof,.2],[BX,tf(w*.25,h+1.9,-d*.1,0,0,0,.8,1.8,.8),0x8a4a3a,.2]);
 P.push([BX,tf(0,1.05,d/2+.03,0,0,0,1.15,2.1,.1),0x3a2a20,.1],[BX,tf(0,.1,d/2+.6,0,0,0,2.4,.2,1.2),0x9a9a96,.1]);
 for(const q of[-1,1]){W.push([BX,tf(q*w*.3,1.9,d/2+.04,0,0,0,1.2,1.2,.1),0xffffff,0],[BX,tf(q*w*.3,1.9,-d/2-.04,0,0,0,1.2,1.2,.1),0xffffff,0],[BX,tf(q*(w/2+.04),1.9,0,0,0,0,.1,1.2,1.4),0xffffff,0]);P.push([IC,tf(q*(w/2-.4),.5,d/2+.9,0,0,0,.7,.55,.7),0x3f7d2c,.5])}
 return{b:mrg(P),w:mrg(W)}}

/* ---------- instanced props: one slot per prop, the kind in that slot follows the map at the prop's position ---------- */
const VM=new MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:0}),WM=new MeshBasicMaterial({color:0x7aa6c8}),WD=new Color(0x7aa6c8),WN=new Color(0xffd48a),NP=64,grp=new Group(),ID={},K=[];sc.add(grp);
const mk=(n,geo,win,cast)=>{const m=new InstancedMesh(geo,VM,NP);m.frustumCulled=false;m.castShadow=cast;grp.add(m);let w=null;if(win){w=new InstancedMesh(win,WM,NP);w.frustumCulled=false;grp.add(w)}ID[n]=K.length;K.push({m,w})};
mk('oak',oak(11),0,1);mk('pine',pine(5),0,1);mk('palm',palm(3),0,1);mk('cactus',cactus(7),0,0);mk('rock',rock(9,0x8a8a86),0,0);
[['house',0],['cabin',1],['villa',2],['adobe',3]].forEach(([n,s])=>{const h=house(20+s*7,s);mk(n,h.b,h.w,1)});
for(let i=0;i<NP;i++){const b=.82+Math.random()*.36,t=(Math.random()-.5)*.16;CC.setRGB(b*(1+t),b,b*(1-t));for(const k of K){k.m.setMatrixAt(i,ZM);k.m.setColorAt(i,CC);if(k.w)k.w.setMatrixAt(i,ZM)}}
const BI=[{n:'Meadow',g:0x4d7a3a,k:['oak','oak','house','oak','house','rock']},{n:'Alpine',g:0xdfe8ee,k:['pine','pine','cabin','pine','rock','pine']},{n:'Coast',g:0xd8c58f,k:['palm','villa','palm','palm','villa','rock']},{n:'Desert',g:0xc47f4a,k:['cactus','rock','adobe','cactus','rock','cactus']},{n:'Downtown',g:0x474a50,k:['oak','house','oak','villa','oak','house']}],SEG=1400;
const pr=[...Array(NP)].map((_,i)=>({s:i%2?1:-1,z:i/NP*420+rnd(0,6),x:rnd(11,26),sc:rnd(.85,1.4),ry:rnd(0,6.283),k:Math.random()*6|0,cur:-1}));
let fix=-1,cb=0,dst=0,live=false,comp=null;const bAt=w=>fix>=0?fix:Math.floor(w/SEG)%5;

/* ---------- river with an animated normal map, and a sandy shore ---------- */
const wc=document.createElement('canvas');wc.width=wc.height=256;
{const c=wc.getContext('2d'),im=c.createImageData(256,256),H=(a,b)=>{const u=a/256*6.2832,v=b/256*6.2832;return Math.sin(u*3+Math.sin(v*2))*.5+Math.sin(v*5+u)*.35+Math.sin((u+v)*7)*.2+Math.sin((u-v)*11)*.12};
 for(let b=0;b<256;b++)for(let a=0;a<256;a++){const dx=(H(a+1,b)-H(a-1,b))*4,dy=(H(a,b+1)-H(a,b-1))*4,n=Math.hypot(dx,dy,1),o=(b*256+a)*4;im.data[o]=128+127*dx/n;im.data[o+1]=128+127*dy/n;im.data[o+2]=128+127/n;im.data[o+3]=255}c.putImageData(im,0,0)}
const wn=new CanvasTexture(wc);wn.wrapS=wn.wrapT=RepeatWrapping;wn.repeat.set(28,70);wn.anisotropy=8;
const WTM=new MeshStandardMaterial({color:0x2a7da0,roughness:.05,metalness:.2,normalMap:wn,normalScale:new Vector2(.9,.9),transparent:true,opacity:.93,envMapIntensity:1.8});
const water=new Mesh(new PlaneGeometry(260,900),WTM);water.rotation.x=-Math.PI/2;water.position.set(-186,.04,-250);
const beach=new Mesh(new PlaneGeometry(9,900),new MeshStandardMaterial({color:0xd9c48f,roughness:1}));beach.rotation.x=-Math.PI/2;beach.position.set(-52.5,.02,-250);beach.receiveShadow=true;grp.add(water,beach);
x.ENVM.push(WTM,VM);

/* ---------- sky dome, sun and clouds ---------- */
const sky=new Mesh(new SphereGeometry(560,24,14),new ShaderMaterial({side:BackSide,depthWrite:false,fog:false,uniforms:{h:{value:new Color()},t:{value:new Color()}},
 vertexShader:'varying float y;void main(){y=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 h,t;varying float y;void main(){gl_FragColor=vec4(mix(h,t,pow(clamp(y,0.,1.),.5)),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));sky.renderOrder=-10;sky.frustumCulled=false;grp.add(sky);
const glow=(stops,sz)=>{const c=document.createElement('canvas');c.width=c.height=sz;const q=c.getContext('2d'),g=q.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);stops.forEach(([o,s])=>g.addColorStop(o,s));q.fillStyle=g;q.fillRect(0,0,sz,sz);return new CanvasTexture(c)};
const sunS=new Sprite(new SpriteMaterial({map:glow([[0,'rgba(255,255,255,1)'],[.12,'rgba(255,244,210,.95)'],[.35,'rgba(255,200,120,.28)'],[1,'rgba(255,170,90,0)']],256),transparent:true,depthWrite:false,fog:false,blending:AdditiveBlending}));sunS.scale.set(150,150,1);sunS.renderOrder=-9;grp.add(sunS);
const SD=new Vector3(-.38,.4,-.84).normalize(),ctex=glow([[0,'rgba(255,255,255,.55)'],[1,'rgba(255,255,255,0)']],128);
const clouds=[...Array(16)].map(()=>{const s=new Sprite(new SpriteMaterial({map:ctex,transparent:true,depthWrite:false,fog:false,opacity:.8}));s.scale.set(rnd(120,220),rnd(40,70),1);s.position.set(rnd(-300,300),rnd(110,190),rnd(-420,-150));grp.add(s);return s});

/* ---------- bloom, anti-aliased HDR target, ACES tone mapping ---------- */
try{const[a,b,c,d]=await Promise.all(['EffectComposer','RenderPass','UnrealBloomPass','OutputPass'].map(n=>import(`three/addons/postprocessing/${n}.js`))),sz=R.getSize(new Vector2()),p=R.getPixelRatio();
 comp=new a.EffectComposer(R,new WebGLRenderTarget(1,1,{type:HalfFloatType,samples:4}));comp.setPixelRatio(p);comp.setSize(sz.x,sz.y);comp.addPass(new b.RenderPass(sc,cam));comp.addPass(new c.UnrealBloomPass(new Vector2(sz.x,sz.y),.42,.6,.88));comp.addPass(new d.OutputPass())}
catch(e){comp=null;console.warn('Bloom unavailable, using plain rendering',e)}

return{get live(){return live},
 on(v,w,h,p){live=v;grp.visible=v;if(v&&comp){comp.setPixelRatio(p);comp.setSize(w,h)}},
 size(w,h,p){if(comp){comp.setPixelRatio(p);comp.setSize(w,h)}},
 map(i){fix=i-1},bi(){return cb},name(){return BI[cb].n},
 city(z0,Lp){return bAt(dst+(((z0-dst)%Lp)+Lp)%Lp)===4},
 render(){comp?comp.render():R.render(sc,cam)},
 update(dist,dark,dt,time){dst=dist;
  const bt=(dist+160)/SEG,f=cl(((bt%1)-.86)/.14,0,1);cb=bAt(dist+160);const ni=fix>=0?fix:(cb+1)%5,sm=fix>=0?0:f*f*(3-2*f);
  CC.setHex(BI[cb].g).lerp(C2.setHex(BI[ni].g),sm).multiplyScalar(1-.75*dark);x.ground.material.color.lerp(CC,.9);
  for(let i=0;i<NP;i++){const p=pr[i],a=((p.z-dist)%420+420)%420,n=BI[bAt(dist+a)].k[p.k],ki=ID[n],hs=ki>4;
   if(p.cur!==ki){if(p.cur>=0){K[p.cur].m.setMatrixAt(i,ZM);if(K[p.cur].w)K[p.cur].w.setMatrixAt(i,ZM)}p.cur=ki}
   const sc2=n==='rock'?p.sc*1.6:hs?1:p.sc;MM.compose(V1.set(p.s*p.x*(hs?1.5:1),0,60-a),QQ.setFromAxisAngle(UP,hs?-p.s*Math.PI/2+(p.ry-3.14)*.04:p.ry),V2.set(sc2,sc2*(n==='rock'?.7:1),sc2));
   K[ki].m.setMatrixAt(i,MM);if(K[ki].w)K[ki].w.setMatrixAt(i,MM)}
  for(const k of K){k.m.instanceMatrix.needsUpdate=true;if(k.w)k.w.instanceMatrix.needsUpdate=true}
  WM.color.copy(WD).lerp(WN,cl((dark-.25)*2.2,0,1));wn.offset.set(time*.012,dist*.0778+time*.03);
  const u=sky.material.uniforms;u.h.value.copy(sc.fog.color);u.t.value.copy(sc.fog.color).lerp(C2.setHex(0x2d63b0),.62*(1-dark)).multiplyScalar(.7+.25*(1-dark));sky.position.copy(cam.position);
  sunS.position.copy(cam.position).addScaledVector(SD,500);sunS.material.opacity=cl(1-dark*1.3,0,1);sunS.material.color.setHex(0xfff2cf).lerp(C2.setHex(0xff8a3c),cl(dark*2.2,0,1));
  for(const c of clouds){c.position.x+=dt*(3+c.scale.x*.02);if(c.position.x>330)c.position.x=-330;c.material.color.setScalar(1-.8*dark)}},
 dispose(){sc.remove(grp);if(comp&&comp.dispose)comp.dispose()}}}
