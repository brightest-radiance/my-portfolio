/* Stellar Drive, Stellar tier. Loaded on demand by racer.js when Graphics is set to Stellar.
   A physically-based pipeline in the spirit of Unity HDRP/URP: HDR rendering with MSAA, ACES tone mapping, a procedural sky with sun, moon, stars,
   clouds and mountains that also feeds a reflection probe, terrain with valleys, hills, a river and a sea, a wet-asphalt road, leaf-card trees with
   wind, 18 building and house types with lit facades, street furniture, overpasses, a weather cycle (clear, cloudy, rain, thunderstorm, fog, snow),
   bloom, sun shafts, speed blur, chromatic aberration, colour grading, vignette and film grain. Every optional stage fails soft. */

const SEG=1400,CELL=1700,NAMES=['Meadow','Alpine','Coast','Desert','Downtown'];

/* ---------------- shader library (exported so it can be compiled and tested on its own) ---------------- */
const NOISE=`float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.,9.);a*=.5;}return s;}
`;
/* weight of biome k at road distance s (blends over the last 14% of each segment); uFix >= 0 locks one map */
const BIO=`uniform float uDist,uFix;
float bw(float s,float k){if(uFix>-.5)return step(abs(uFix-k),.5);float t=s/${SEG}.,i=floor(t),f=smoothstep(.86,1.,fract(t));return mix(step(abs(mod(i,5.)-k),.5),step(abs(mod(i+1.,5.)-k),.5),f);}
`;
const TERR=`float hn(vec2 p){return sin(p.x*.011+sin(p.y*.007)*2.)*.5+sin(p.x*.027-p.y*.019+1.3)*.3+sin(p.y*.021+p.x*.013)*.2;}
float terrH(float x,float s){float ax=abs(x),rise=smoothstep(95.,260.,ax);
 float amp=bw(s,0.)*16.+bw(s,1.)*78.+bw(s,2.)*10.+bw(s,3.)*26.+bw(s,4.)*4.;
 float h=rise*amp*(.55+.45*hn(vec2(x,s)));float rv=bw(s,0.)*exp(-pow((x+130.)/26.,2.));float sea=bw(s,2.)*smoothstep(-70.,-110.,x);
 h*=1.-sea;h=mix(h,-5.,rv);return h-sea*9.;}
`;
const TERR_VDECL=`varying vec3 vTp;\n${BIO}${TERR}`;
const TERR_VBEGINN=`float tx=position.x,ts=uDist-(position.z-250.);float th0=terrH(tx,ts);
float tdx=(terrH(tx+8.,ts)-terrH(tx-8.,ts))/16.,tds=(terrH(tx,ts+8.)-terrH(tx,ts-8.))/16.;
#include <beginnormal_vertex>
objectNormal=normalize(vec3(-tdx,1.,tds));`;
const TERR_VBEGIN=`#include <begin_vertex>
transformed.y+=th0;vTp=vec3(tx,th0,ts);`;
const TERR_FDECL=`varying vec3 vTp;\n${NOISE}${BIO}
vec3 terrCol(vec3 p){float x=p.x,s=p.z,h=p.y;vec2 q=vec2(x,s);float n=fbm(q*.05),n2=fbm(q*.35),n3=vn(q*2.2);
 vec3 grass=mix(vec3(.05,.13,.03),vec3(.14,.24,.06),n)*(.75+.5*n2);
 vec3 rock=mix(vec3(.09,.085,.08),vec3(.2,.19,.17),n2),snow=vec3(.8,.84,.9);
 vec3 alp=mix(grass*.7,rock,smoothstep(3.,14.,h+(n-.5)*10.));alp=mix(alp,snow,smoothstep(20.,42.,h+(n-.5)*16.)+smoothstep(.5,.8,n)*.35*step(h,12.));
 vec3 sand=mix(vec3(.4,.31,.16),vec3(.52,.42,.24),n2),dune=mix(vec3(.34,.15,.05),vec3(.55,.28,.1),n)*(.85+.3*n3);
 vec3 coast=mix(sand,grass*.8,smoothstep(.55,.75,n));vec3 des=mix(dune,rock*1.3,smoothstep(8.,24.,h+(n2-.5)*8.));
 vec3 city=mix(vec3(.07,.075,.08),grass*.6,smoothstep(.5,.7,n))*(.8+.4*n2);
 vec3 c=bw(s,0.)*grass+bw(s,1.)*alp+bw(s,2.)*coast+bw(s,3.)*des+bw(s,4.)*city;
 c=mix(c,vec3(.14,.12,.1),smoothstep(12.5,9.,abs(x))*.85);
 c=mix(c,vec3(.34,.27,.17)*.8,smoothstep(-.2,-1.4,h)*(1.-smoothstep(-3.,-1.8,h)));c=mix(c,vec3(.03,.1,.12),smoothstep(-2.4,-6.,h));return c;}
`;
const TERR_FCOL=`#include <color_fragment>
diffuseColor.rgb=terrCol(vTp);`;

const SKY_V=`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}`;
const SKY_F=`uniform vec3 uSun,uMoon,uTop,uHor,uSunCol;uniform float uCloud,uTime,uStar,uFlash,uDim,uMtn;varying vec3 vD;
${NOISE}
void main(){vec3 d=normalize(vD);float y=d.y;vec3 col=mix(uHor,uTop,pow(clamp(y,0.,1.),.42));
 float sd=max(dot(d,uSun),0.);col+=uSunCol*(pow(sd,3500.)*5.0+pow(sd,240.)*.4+pow(sd,32.)*.035)*(1.-uDim*.85);
 float md=max(dot(d,uMoon),0.);col+=vec3(.75,.8,.95)*(smoothstep(.9992,.9996,md)*3.+pow(md,50.)*.05)*uStar;
 vec3 g=floor(d*230.);float hs=fract(sin(dot(g,vec3(12.9898,78.233,37.719)))*43758.5453);
 col+=vec3(1.,.95,.9)*step(.9968,hs)*smoothstep(0.,.25,y)*uStar*(.5+.5*sin(uTime*2.+hs*40.))*2.*(1.-uDim);
 vec2 pz=vec2(d.x,-d.z)/max(length(d.xz),.001);
 float r1=.03+uMtn*(.13*fbm(pz*2.2+3.)+.05*fbm(pz*7.+8.)),r2=.014+uMtn*.07*fbm(pz*3.5+4.);
 vec3 haze=uHor*.9+uTop*.1;float up=step(-.05,y);
 col=mix(col,mix(haze,uTop*.3,.4)*.8,smoothstep(r1+.004,r1-.002,y)*up*(.5+.4*uMtn));col=mix(col,haze*.55,smoothstep(r2+.004,r2-.002,y)*up*.85);
 col=mix(col,uHor,smoothstep(.0,-.15,y));
 float cv=0.;
 if(y>.004){vec2 p=d.xz/(y+.18)*.9+vec2(uTime*.012,0.);float n=fbm(p*1.3);cv=smoothstep(1.-uCloud*.95,1.-uCloud*.95+.3,n+(uCloud-.5)*.4)*smoothstep(.004,.07,y);
  float n2=fbm(p*1.3+normalize(uSun.xz+vec2(.001))*.12);float lit=clamp(.55+(n-n2)*5.,0.,1.);
  vec3 cd=uHor*(.38-.2*uDim),cb=(uHor*.75+uSunCol*.3)*(1.-.55*uDim);col=mix(col,mix(cd,cb,lit),cv*.92);}
 col+=vec3(.7,.75,1.)*uFlash*(.35+cv*.65);
 gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

const FS_V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const GRADE_F=`uniform sampler2D tDiffuse;uniform float uTime,uSpd,uNit,uVig,uGrain,uSat,uCon,uCA,uRay;uniform vec2 uSunUV;uniform vec3 uSh,uHi;varying vec2 vUv;
float hh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 c=vUv-.5;float r=length(c);float bl=(uSpd*.045+uNit*.06)*smoothstep(.1,.75,r);vec3 col=vec3(0.);
 for(int i=0;i<6;i++){float t=float(i)/5.;vec2 o=c*(1.-bl*t);col.r+=texture2D(tDiffuse,.5+o*(1.+uCA)).r;col.g+=texture2D(tDiffuse,.5+o).g;col.b+=texture2D(tDiffuse,.5+o*(1.-uCA)).b;}
 col/=6.;
 if(uRay>.001){vec2 d=(uSunUV-vUv)*(.9/16.),p=vUv;float acc=0.,w=1.;for(int i=0;i<16;i++){p+=d;vec3 s=texture2D(tDiffuse,p).rgb;acc+=max(max(s.r,max(s.g,s.b))-1.8,0.)*w;w*=.95;}col+=vec3(1.,.82,.6)*acc*uRay*.008;}
 float l=dot(col,vec3(.2126,.7152,.0722));col=mix(vec3(l),col,uSat);col=(col-.2)*uCon+.2;col*=mix(uSh,uHi,smoothstep(.02,.9,l));
 col*=1.-uVig*smoothstep(.3,.9,r*1.4);col+=(hh(vUv*vec2(1731.,977.)+uTime)-.5)*uGrain;gl_FragColor=vec4(max(col,0.),1.);}`;

const RAIN_V=`attribute float aE;uniform float uT,uZ,uI,uWind,uFall,uSpd;varying float vA;
void main(){vec3 s=position;vec3 p=vec3((s.x-.5)*48.,fract(s.y-uT*uFall/22.)*22.-3.,fract(s.z+uZ/70.)*70.-60.);vec3 w=cameraPosition+p;w-=vec3(uWind,-uFall,uSpd)*.016*aE;
 vA=uI*(1.-aE*.85)*(.4+.6*fract(s.x*7.31));gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`;
const RAIN_F=`varying float vA;void main(){gl_FragColor=vec4(.72,.8,.9,vA*.55);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const SNOW_V=`uniform float uT,uZ,uI,uPx;varying float vA;
void main(){vec3 s=position;float ph=s.x*40.;vec3 p=vec3((s.x-.5)*40.+sin(uT*.7+ph)*1.2,fract(s.y-uT*2.2/18.)*18.-3.,fract(s.z+uZ/60.)*60.-50.);
 vec4 mv=viewMatrix*vec4(cameraPosition+p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uPx*(.5+s.z*.9)/-mv.z,1.,9.);vA=uI*(.4+.6*fract(s.x*13.7));}`;
const SNOW_F=`varying float vA;void main(){vec2 c=gl_PointCoord-.5;float a=smoothstep(.5,.1,length(c))*vA;if(a<.01)discard;gl_FragColor=vec4(.95,.97,1.,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const RIP_V=`uniform float uT,uZ,uI,uPx;varying float vP;
void main(){vec3 s=position;vP=fract(uT*(.8+s.y*.9)+s.x*9.);vec3 w=vec3((s.x-.5)*15.,.03,fract(s.z+uZ/38.)*38.-30.);w.xy+=bendOff(w.z);
 vec4 mv=viewMatrix*vec4(w,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uPx*.55/-mv.z,1.,48.);}`;
const RIP_F=`uniform float uI;varying float vP;void main(){vec2 c=gl_PointCoord-.5;float d=length(vec2(c.x,c.y*2.4))*2.;float ring=smoothstep(.14,0.,abs(d-vP*.95))*(1.-vP);if(ring<.01)discard;gl_FragColor=vec4(.78,.85,.95,ring*uI*.7);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
/* road: wet look in the tyre ruts, darkening when rained on */
const ROAD_F=`uniform float uWet;
float rutOf(float lx){float ru=0.;for(int i=0;i<4;i++){float c=-5.4+3.6*float(i);ru=max(ru,exp(-pow((lx-c-.82)/.32,2.)));ru=max(ru,exp(-pow((lx-c+.82)/.32,2.)));}return ru;}
`;
const ROAD_FRAG=`#include <roughnessmap_fragment>
{float ru=rutOf((vMapUv.x-.5)*14.4);roughnessFactor=mix(roughnessFactor,.06,uWet*(.3+.7*ru));diffuseColor.rgb*=1.-uWet*.38-ru*.1;}`;
export const GLS={NOISE,BIO,TERR,TERR_VDECL,TERR_VBEGINN,TERR_VBEGIN,TERR_FDECL,TERR_FCOL,SKY_V,SKY_F,FS_V,GRADE_F,RAIN_V,RAIN_F,SNOW_V,SNOW_F,RIP_V,RIP_F,ROAD_F,ROAD_FRAG};

/* ====================================================================================================================================== */
export default async function(T,sc,R,cam,x){
const{Group,Mesh,InstancedMesh,Color,Matrix4,Vector2,Vector3,Quaternion,Euler,BufferGeometry,Float32BufferAttribute,CylinderGeometry,IcosahedronGeometry,ConeGeometry,BoxGeometry,PlaneGeometry,SphereGeometry,ExtrudeGeometry,Shape,MeshStandardMaterial,MeshBasicMaterial,ShaderMaterial,BackSide,DoubleSide,CanvasTexture,RepeatWrapping,SRGBColorSpace,AdditiveBlending,WebGLRenderTarget,HalfFloatType,SpotLight,Scene,PMREMGenerator,LineSegments,LineBasicMaterial,Points}=T;
const cl=(v,a,b)=>Math.min(b,Math.max(a,v)),rnd=(a,b)=>a+Math.random()*(b-a),lp=(a,b,t)=>a+(b-a)*t,sm=(a,b,v)=>{v=cl((v-a)/(b-a),0,1);return v*v*(3-2*v)};
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const UP=new Vector3(0,1,0),CC=new Color(),C2=new Color(),C3=new Color(),V1=new Vector3(),V2=new Vector3(),QQ=new Quaternion(),MM=new Matrix4(),RMo=matchMedia('(prefers-reduced-motion:reduce)').matches;
const tf=(px,py,pz,rx,ry,rz,sx,sy,sz)=>new Matrix4().compose(new Vector3(px,py,pz),new Quaternion().setFromEuler(new Euler(rx,ry,rz)),new Vector3(sx,sy,sz));
const U={uDist:{value:0},uFix:{value:-1},uTime:{value:0},uWet:{value:0},uWind:{value:0}};
const grp=new Group();sc.add(grp);
/* materials that need extra shader code still get the road-bend hook: call the default one first */
const defHook=function(sh){T.Material.prototype.onBeforeCompile.call(this,sh)};
const hookMat=(m,key,fn)=>{m.onBeforeCompile=function(sh){defHook.call(this,sh);fn(sh)};m.customProgramCacheKey=()=>key;return m};

/* ---------- geometry kit ---------- */
const CY=new CylinderGeometry(1,.72,1,6),CP=new CylinderGeometry(1,1,1,14),IC=new IcosahedronGeometry(1,1),CO=new ConeGeometry(1,1,10),BX=new BoxGeometry(1,1,1),PL=new PlaneGeometry(1,1),PY=new ConeGeometry(.7071,1,4).rotateY(Math.PI/4);
const GB=(()=>{const s=new Shape();s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.lineTo(0,.5);s.closePath();const g=new ExtrudeGeometry(s,{depth:1,bevelEnabled:false});g.translate(0,0,-.5);return g})();
/* merge [geometry, matrix, hex, jitter, crownCentre] parts into one vertex-coloured geometry; crownCentre makes leaf-card normals point out of the crown */
function mrg(parts,uv){const P=[],N=[],C=[],UV=[];for(const[g0,m,c,j,ctr]of parts){const g=g0.index?g0.toNonIndexed():g0.clone();g.applyMatrix4(m);const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;if(c!=null)CC.setHex(c);else CC.setRGB(1,1,1);
 for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));if(ctr){V1.set(p.getX(i)-ctr.x,p.getY(i)-ctr.y+.3,p.getZ(i)-ctr.z).normalize();N.push(V1.x,V1.y,V1.z)}else N.push(n.getX(i),n.getY(i),n.getZ(i));
  if(uv)UV.push(u?u.getX(i):0,u?u.getY(i):0);const k=1+(j||0)*.5*Math.sin(i*12.9898+p.getX(i)*78.233+p.getY(i)*37.719);C.push(CC.r*k,CC.g*k,CC.b*k)}}
 if(!P.length)return null;const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(P,3));g.setAttribute('normal',new Float32BufferAttribute(N,3));g.setAttribute('color',new Float32BufferAttribute(C,3));if(uv)g.setAttribute('uv',new Float32BufferAttribute(UV,2));return g}
const bxp=(P,w,h,d,px,py,pz,c,j,ry)=>P.push([BX,tf(px,py,pz,0,ry||0,0,w,h,d),c,j==null?.1:j]);
const cyp=(P,r,h,px,py,pz,c,j,rx,rz)=>P.push([CP,tf(px,py,pz,rx||0,0,rz||0,r,h,r),c,j==null?.1:j]);
const seg=(P,a,d,L,r,c)=>P.push([CY,new Matrix4().compose(a.clone().addScaledVector(d,L/2),new Quaternion().setFromUnitVectors(UP,d),new Vector3(r,L,r)),c,.3]);

/* ---------- vegetation. Each builder returns wood/rock parts P and leaf-card parts LP ---------- */
const LF=[0x3d7a2b,0x4c8f35,0x2e6528,0x5aa03c],BARK=0x5b402a;
function cards(LP,c,rad,n,pal,r){for(let i=0;i<n;i++){const p=V1.set(r()-.5,r()-.35,r()-.5).normalize().multiplyScalar(rad*(.3+r()*.7)).add(c),s=rad*(.9+r()*.8);LP.push([PL,tf(p.x,p.y,p.z,r()*3,r()*6.28,r()*3,s,s,1),pal[r()*pal.length|0],.25,c.clone()])}}
function tree(sd,o){const r=rng(sd),P=[],LP=[],pal=o.pal||LF;
 const rec=(a,d,L,rd,n)=>{seg(P,a,d,L,rd,o.bark||BARK);const e=a.clone().addScaledVector(d,L);if(!n){if(o.leaf!==0)cards(LP,e,o.cr||1.5,o.cn||8,pal,r);return}
  for(let i=0;i<o.br;i++){const ph=i*(6.283/o.br)+r()*1.1,tl=.5+r()*.5;rec(e,new Vector3(Math.sin(tl)*Math.cos(ph),Math.cos(tl)+.35,Math.sin(tl)*Math.sin(ph)).normalize(),L*.74,rd*.62,n-1)}};
 rec(new Vector3(),UP.clone(),o.tl||2.4,o.tr||.26,o.gen);return{P,LP}}
function pine(sd,snow){const r=rng(sd),P=[];seg(P,new Vector3(),UP,8.2,.26,0x4a3524);
 for(let i=0;i<9;i++){const t=i/9,y=1.3+t*6.2,rad=(1-t)*2.6+.45;P.push([CO,tf(0,y+1,0,0,0,0,rad,2.5,rad),snow&&i>3?(i%2?0xdfe8ee:0xc8d6df):i%2?0x1f4f31:0x2a6340,.5]);
  for(let j=0;j<4;j++){const a=r()*6.283;seg(P,new Vector3(0,y+.5,0),new Vector3(Math.cos(a),-.25,Math.sin(a)).normalize(),rad*.95,.06,0x4a3524)}}return{P,LP:[]}}
function palm(sd){const r=rng(sd),P=[],ln=(r()-.5)*.5;let a=new Vector3();
 for(let i=0;i<8;i++){const d=new Vector3(Math.sin(ln*(i/8)*1.6),1,0).normalize();seg(P,a,d,.95,.24-i*.012,0x8a6a45);a=a.clone().addScaledVector(d,.95)}
 for(let f=0;f<11;f++){const ph=f/11*6.283+r()*.3,b=a.clone(),d=new Vector3(Math.cos(ph),.75,Math.sin(ph)).normalize();
  for(let k=0;k<5;k++){P.push([BX,new Matrix4().compose(b.clone().addScaledVector(d,.45),new Quaternion().setFromUnitVectors(new Vector3(0,0,1),d),new Vector3(.9-k*.14,.03,.9)),f%2?0x3d8a3a:0x4a9a42,.5]);b.addScaledVector(d,.9);d.y-=.38;d.normalize()}}
 return{P,LP:[]}}
function cactus(sd){const r=rng(sd),P=[],G=0x3f8a4f;P.push([CP,tf(0,1.7,0,0,0,0,.42,3.4,.42),G,.2],[IC,tf(0,3.4,0,0,0,0,.42,.45,.42),G,.2]);
 for(const s of[-1,1]){const h=1+r()*1.1;P.push([CP,tf(s*.55,1.6,0,0,0,Math.PI/2,.18,.8,.18),G,.2],[CP,tf(s*.95,1.6+h/2,0,0,0,0,.18,h,.18),G,.2],[IC,tf(s*.95,1.6+h,0,0,0,0,.18,.2,.18),G,.2])}return{P,LP:[]}}
function rock(sd){const r=rng(sd),g=new IcosahedronGeometry(1,1).toNonIndexed(),p=g.attributes.position,k=new Map();
 for(let i=0;i<p.count;i++){const key=p.getX(i).toFixed(3)+p.getY(i).toFixed(3)+p.getZ(i).toFixed(3);if(!k.has(key))k.set(key,.75+r()*.5);const q=k.get(key);p.setXYZ(i,p.getX(i)*q*1.3,p.getY(i)*q*.8,p.getZ(i)*q)}
 g.computeVertexNormals();return{P:[[g,new Matrix4(),0x8a8a86,.3]],LP:[]}}
function bush(sd){const r=rng(sd),P=[],LP=[];for(let i=0;i<4;i++){const c=new Vector3((r()-.5)*1.4,.55+r()*.3,(r()-.5)*1.4);P.push([IC,tf(c.x,c.y,c.z,0,0,0,.7,.55,.7),LF[r()*4|0],.5]);cards(LP,c,.8,5,LF,r)}return{P,LP}}
const VEG={oak:()=>tree(11,{gen:3,br:3}),birch:()=>tree(21,{gen:2,br:3,bark:0xe8e4da,pal:[0x8fb84a,0x9bc450,0x7aa83e],tl:3.2,tr:.14,cr:1.25,cn:7}),dead:()=>tree(31,{gen:3,br:3,leaf:0,bark:0x6b5d50}),
 pine:()=>pine(5,0),spruce:()=>pine(7,1),palm:()=>palm(3),cactus:()=>cactus(7),rock:()=>rock(9),bush:()=>bush(13)};

/* ---------- facades: lit-window textures, tiled in metres ---------- */
const TILE={glass:[8,14.4],office:[10,7.2],brick:[9,10.5],deco:[10,11]};
function facTex(kind){const S=256,c=document.createElement('canvas'),e=document.createElement('canvas');c.width=c.height=e.width=e.height=S;const a=c.getContext('2d'),b=e.getContext('2d');b.fillStyle='#000';b.fillRect(0,0,S,S);
 const lit=()=>{const q=Math.random();return q<.4?(Math.random()<.6?'#ffd9a0':'#fff0cf'):q<.52?'#bfe3ff':null};
 const pane=(x0,y0,w,h,c1,c2)=>{const g=a.createLinearGradient(x0,y0,x0,y0+h);g.addColorStop(0,c1);g.addColorStop(1,c2);a.fillStyle=g;a.fillRect(x0,y0,w,h);const l=lit();if(l){b.fillStyle=l;b.fillRect(x0,y0,w,h)}};
 if(kind==='glass'){a.fillStyle='#8f9aa6';a.fillRect(0,0,S,S);for(let i=0;i<4;i++)for(let j=0;j<4;j++)pane(i*64+2,j*64+2,60,60,'#5d86a8','#233a52')}
 else if(kind==='office'){a.fillStyle='#b9b6ae';a.fillRect(0,0,S,S);for(let i=0;i<4;i++)for(let j=0;j<2;j++){a.fillStyle='rgba(0,0,0,.08)';a.fillRect(i*64,j*128+120,64,8);pane(i*64+4,j*128+18,56,76,'#46586a','#1e2a38')}}
 else if(kind==='brick'){a.fillStyle='#8c4a38';a.fillRect(0,0,S,S);for(let y=0;y<S;y+=8)for(let x2=0;x2<S;x2+=16){a.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,200,170'},${.05+Math.random()*.1})`;a.fillRect(x2+(y/8%2?8:0),y,15,7)}
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){const x0=i*85+18,y0=j*85+16;a.fillStyle='#e8e2d4';a.fillRect(x0-3,y0-3,38,56);pane(x0,y0,32,50,'#4a627a','#1c2733');a.fillStyle='#e8e2d4';a.fillRect(x0-5,y0+50,42,5);if(j>0){a.fillStyle='#26282b';a.fillRect(x0-6,y0-18,44,3);a.fillRect(x0-6,y0-18,2,16);a.fillRect(x0+36,y0-18,2,16)}}}
 else{a.fillStyle='#cdbf9f';a.fillRect(0,0,S,S);for(let i=0;i<4;i++){a.fillStyle='rgba(0,0,0,.1)';a.fillRect(i*64+58,0,6,S);for(let j=0;j<3;j++){pane(i*64+10,j*85+10,40,64,'#3c4d5e','#1b2430');a.fillStyle='#a8977a';a.fillRect(i*64+6,j*85+76,48,4)}}}
 const t=k=>{const q=new CanvasTexture(k);q.wrapS=q.wrapT=RepeatWrapping;q.anisotropy=8;q.colorSpace=SRGBColorSpace;return q};return{m:t(c),em:t(e)}}
const FM={};for(const[k,met,rg]of[['glass',.55,.18],['office',.1,.6],['brick',0,.85],['deco',.05,.7]]){const t=facTex(k);FM[k]=new MeshStandardMaterial({map:t.m,emissiveMap:t.em,emissive:0xffffff,emissiveIntensity:0,metalness:met,roughness:rg});x.ENVM.push(FM[k])}
/* a box whose UVs tile the facade texture in metres (roof faces sample a plain corner) */
function fbox(w,h,d,fk,ox){const[tw,th]=TILE[fk],g=new BoxGeometry(w,h,d),u=g.attributes.uv;for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i,a=u.getX(k),b=u.getY(k);
 if(f<2)u.setXY(k,a*d/tw+ox,b*h/th);else if(f<4)u.setXY(k,.01+a*.02,.01+b*.02);else u.setXY(k,a*w/tw+ox,b*h/th)}return g}
const fb=(F,fk,w,h,d,px,py,pz,ox)=>F.push([fbox(w,h,d,fk,ox||0),tf(px,py,pz,0,0,0,1,1,1),null,0]);

/* ---------- houses and buildings. Each returns {F facade parts, T trim parts, L emissive parts, fk facade kind} ---------- */
const wn=(T_,L,px,py,pz,ry,w,h,lit)=>{bxp(T_,w+.18,h+.18,.07,px,py,pz,0xe6e2da,.05,ry);L.push([BX,tf(px,py,pz,0,ry,0,w,h,.1),lit?0xffd28a:0x1a2430,0])};
const HS={house1:{w:8.5,d:6.5,h:3.2,roof:'gable',rh:2.4,wall:[0xe9e2d0,0xd9c7a6,0xc9d6dc,0xe6c9c0,0xb9c7a8],roofC:[0x8a3b2e,0x4a4f5a,0x6a3a2a],chim:1,garage:1,porch:1},
 house2:{w:11,d:6,h:2.8,roof:'hip',rh:1.8,wall:[0xcbb89a,0xd8d0c0,0xa98f78,0xe0d9c8],roofC:[0x5b4a40,0x3f4a52,0x6b5546],chim:1,garage:1},
 cabin:{w:7.5,d:6.5,h:2.6,roof:'a',rh:4.6,wall:[0x7a5236,0x6b4a30,0x8a6240],roofC:[0x3a2f2a,0x2f3b34],chim:1,porch:1},
 villa:{w:10,d:8,h:3.4,roof:'flat',wall:[0xf3eee4,0xece0cc,0xf2dccb],roofC:[0xb8552e],pool:1,lv:2},
 modern:{w:11,d:8,h:3.1,roof:'flat',wall:[0xdad8d2,0x8f9296,0x3b3f44],roofC:[0x44484d],glass:1,lv:2},
 adobe:{w:8,d:7,h:3.1,roof:'flat',wall:[0xc98b5b,0xd29a6a,0xbf7f50,0xd8a878],roofC:[0xc98b5b],beams:1}};
function house(sd,o){const r=rng(sd),T_=[],L=[],w=o.w*(.92+r()*.16),d=o.d*(.92+r()*.16),h=o.h,lv=o.lv||1,H=h*lv,wall=o.wall[r()*o.wall.length|0],rf=o.roofC[r()*o.roofC.length|0],dk=0x2a1f18;
 bxp(T_,w,H,d,0,H/2,0,wall,.08);
 if(o.roof==='gable')T_.push([GB,tf(0,H+o.rh/2,0,0,Math.PI/2,0,d*1.14,o.rh,w*1.1),rf,.2]);
 else if(o.roof==='hip')T_.push([PY,tf(0,H+o.rh/2,0,0,0,0,w*1.12,o.rh,d*1.12),rf,.2]);
 else if(o.roof==='a'){T_.push([GB,tf(0,o.rh/2+.2,0,0,0,0,w*1.15,o.rh,d*1.25),rf,.15]);L.push([GB,tf(0,o.rh*.4+.2,d*.63,0,0,0,w*.72,o.rh*.6,.05),0xffc47a,0])}
 else{bxp(T_,w+.5,.3,d+.5,0,H+.15,0,rf,.15);bxp(T_,w+.5,.55,.25,0,H+.5,d/2+.12,wall,.1);bxp(T_,w*.4,1.1,d*.5,w*.2,H+.85,-d*.1,wall,.1);bxp(T_,w*.4+.4,.2,d*.5+.4,w*.2,H+1.5,-d*.1,rf,.15)}
 if(o.chim)bxp(T_,.8,2.4,.8,w*.28,H+(o.roof==='gable'?1.9:o.roof==='a'?3.2:1.4),-d*.18,0x8a4a3a,.2);
 const gx=o.garage?-w*.2:0;bxp(T_,1.15,2.1,.1,gx,1.05,d/2+.03,dk,.1);bxp(T_,2.4,.2,1.2,gx,.1,d/2+.6,0x9a9a96,.1);
 if(o.garage){bxp(T_,w*.32,2.3,.1,w*.28,1.15,d/2+.03,0xd8d4cc,.08);bxp(T_,w*.34,.06,3,w*.28,.03,d/2+1.5,0x58585a,.05)}
 if(o.porch){bxp(T_,2.8,.14,1.5,gx,2.45,d/2+.75,rf,.1);for(const s of[-1,1])bxp(T_,.14,2.4,.14,gx+s*1.3,1.2,d/2+1.4,0xe8e4dc,.05)}
 for(let l=0;l<lv;l++)for(const q of[-1,1]){wn(T_,L,q*w*.3,1.7+l*h,d/2+.04,0,o.glass?2.6:1.15,o.glass?2:1.1,r()<.4);wn(T_,L,q*w*.3,1.7+l*h,-d/2-.04,0,1.15,1.1,r()<.4);wn(T_,L,q*(w/2+.04),1.7+l*h,0,Math.PI/2,1.4,1.1,r()<.4);
  if(o.roof!=='flat'||!o.glass)bxp(T_,.14,1.2,.1,q*w*.3-q*.8,1.7+l*h,d/2+.1,0x3d5a45,.2)}
 if(o.beams)for(let i=0;i<5;i++)cyp(T_,.12,.8,-w/2+1+i*(w-2)/4,H-.3,d/2+.2,0x5a3a22,.2,Math.PI/2);
 if(o.pool){bxp(T_,4.5,.12,6.5,w/2+3.3,.04,0,0x3a9bc4,0);bxp(T_,5,.08,7,w/2+3.3,.02,0,0xd8d4c8,.1)}
 for(const q of[-1,1])T_.push([IC,tf(q*(w/2-.5),.5,d/2+.9,0,0,0,.7,.55,.7),LF[r()*4|0],.5]);
 return{F:[],T:T_,L,fk:null}}
function farm(sd){const h=house(sd,HS.house1),r=rng(sd+1),T_=h.T,L=h.L;
 bxp(T_,10,6,8,16,3,-2,0xa83a2a,.15);T_.push([GB,tf(16,6+1.8,-2,0,0,0,10.6,3.6,8.8),0x4a3a30,.2]);bxp(T_,3.6,4.5,.1,16,2.25,2.04,0xe8e0d0,.1);cyp(T_,1.6,9,25,4.5,-2,0xb8bcc2,.1);T_.push([IC,tf(25,9,-2,0,0,0,1.6,1.1,1.6),0x8a8e94,.1]);
 bxp(T_,12,.2,8,10,.1,2,0x6b4a2a,.4);for(let i=0;i<6;i++)bxp(T_,.1,.9,.1,-6+i*2.4,.45,8,0xe8e4dc,.1);return h}
function gas(sd){const T_=[],L=[];bxp(T_,13,.5,7.5,0,5,2,0xe8e8e6,.05);bxp(T_,13.1,.35,7.6,0,4.6,2,0xd4262a,.1);for(const px of[-5.5,5.5])for(const pz of[-.8,4.8])bxp(T_,.4,4.6,.4,px,2.3,pz,0xc8c8c6,.05);
 for(const px of[-2.5,2.5]){bxp(T_,.9,1.5,.5,px,.75,2,0x2a2f36,.1);L.push([BX,tf(px,1.15,2.27,0,0,0,.6,.35,.05),0xffffff,0])}bxp(T_,9,3.6,5.5,-1,1.8,-7.5,0xd9d6cf,.1);bxp(T_,9.4,.3,6,-1,3.7,-7.5,0x3a3d42,.1);L.push([BX,tf(-1,2,-4.7,0,0,0,7,1.6,.06),0xbfe3ff,0]);
 bxp(T_,.3,9,.3,9,4.5,5,0x8a8d92,.1);L.push([BX,tf(9,8.4,5,0,0,0,1.6,2.2,.3),0xe8e8e8,0],[BX,tf(9,9.3,5.17,0,0,0,1.4,.4,.05),0xd4262a,0],[BX,tf(9,8.4,5.17,0,0,0,1.2,.35,.05),0x9be86a,0]);return{F:[],T:T_,L,fk:null}}
function warehouse(sd){const r=rng(sd),T_=[],L=[],c=[0x9aa0a6,0xb8b4a8,0x7d8890][r()*3|0];bxp(T_,22,7,12,0,3.5,0,c,.1);T_.push([GB,tf(0,7+.7,0,0,Math.PI/2,0,12.4,1.4,22.4),0x6a6e72,.1]);for(let i=0;i<3;i++)bxp(T_,3.4,4.2,.15,-6+i*6,2.1,6.05,0x6a7078,.08);bxp(T_,1.4,2.2,.15,9.4,1.1,6.05,0x2a2d31,.1);for(let i=0;i<6;i++)bxp(T_,.2,.2,12.1,-9+i*3.6,6.4,0,0x888d92,.05);return{F:[],T:T_,L,fk:null}}
function motel(sd){const r=rng(sd),T_=[],L=[];bxp(T_,26,3.2,6.5,0,1.6,0,0xd9c7a6,.1);bxp(T_,27,.4,7.8,0,3.4,.4,0x8a3b2e,.1);for(let i=0;i<8;i++){const px=-11+i*3.15;bxp(T_,1,2.1,.1,px,1.05,3.28,0x3a2a20,.1);wn(T_,L,px+1.2,1.7,3.28,0,.9,.9,r()<.3)}
 bxp(T_,.3,7,.3,-14,3.5,6,0x8a8d92,.1);L.push([BX,tf(-14,7.4,6,0,0,0,3.4,1.2,.25),0xff5a8a,0],[BX,tf(-14,6.4,6,0,0,0,2.8,.5,.25),0x7fe8ff,0]);return{F:[],T:T_,L,fk:null}}
function turbine(sd){const T_=[],L=[],r=rng(sd);T_.push([CY,tf(0,22,0,0,0,0,1.6,44,1.6),0xe8eaec,.04],[BX,tf(0,44.5,.4,0,0,0,1.6,1.8,4.4),0xe0e2e4,.05],[IC,tf(0,44.5,-2.2,0,0,0,1.1,1.1,1.1),0xd0d2d4,.05]);
 const a0=r()*2;for(let i=0;i<3;i++){const a=a0+i*2.094;T_.push([BX,tf(Math.sin(a)*10,44.5+Math.cos(a)*10,-2.5,0,0,-a,.9,20,.18),0xf0f2f4,.03])}L.push([BX,tf(0,46,.4,0,0,0,.4,.3,.4),0xff2020,0]);return{F:[],T:T_,L,fk:null}}
function watertower(sd){const T_=[],L=[];for(const sx of[-1,1])for(const sz of[-1,1])T_.push([CP,tf(sx*2,6,sz*2,sz*.13,0,-sx*.13,.18,12,.18),0x6a5a4a,.1]);cyp(T_,3.2,5,0,14.5,0,0x9a8a78,.12);T_.push([CO,tf(0,18.3,0,0,0,0,3.4,2.4,3.4),0x6a5a4a,.1]);bxp(T_,4,.4,4,0,11.8,0,0x6a5a4a,.1);return{F:[],T:T_,L,fk:null}}
function lighthouse(sd){const T_=[],L=[];for(let i=0;i<5;i++)T_.push([CY,tf(0,2.6+i*5,0,0,0,0,3.4-i*.35,5,3.4-i*.35),i%2?0xc8312a:0xf0f0ee,.04]);bxp(T_,4.4,.4,4.4,0,26,0,0x2a2d31,.05);cyp(T_,1.3,1.6,0,27,0,0xf8f0c0,0);L.push([CP,tf(0,27,0,0,0,0,1.15,1.5,1.15),0xfff2b0,0]);T_.push([CO,tf(0,28.9,0,0,0,0,1.8,1.6,1.8),0xc8312a,.05]);return{F:[],T:T_,L,fk:null}}
const AC=(T_,r,w,d,y)=>{for(let i=0;i<4;i++)bxp(T_,1.6+r()*1.4,1+r()*.6,1.4+r(),(r()-.5)*(w-4),y+.6,(r()-.5)*(d-3),0x8a8f94,.1)};
function apt(sd){const r=rng(sd),F=[],T_=[],L=[],w=13+r()*3,d=10,n=4+(r()*3|0),h=n*3.5,ox=r()*4|0;fb(F,'brick',w,h,d,0,h/2,0,ox);bxp(T_,w+.4,.5,d+.4,0,h+.25,0,0x5a4a44,.1);AC(T_,r,w,d,h+.5);bxp(T_,3.8,.25,1.8,0,3.2,d/2+1,0x4a4d52,.05);bxp(T_,.18,3.1,.18,-1.7,1.55,d/2+1.8,0xd4cfc5,.05);bxp(T_,.18,3.1,.18,1.7,1.55,d/2+1.8,0xd4cfc5,.05);bxp(T_,2.8,2.4,.1,0,1.2,d/2+.05,0x242830,.05);L.push([BX,tf(0,1.2,d/2+.08,0,0,0,2.4,2,.04),0xffd9a0,0]);for(let k=1;k<n;k++)for(const q of[-1,0,1])bxp(T_,2.6,.12,1.1,q*w*.28,k*3.5,d/2+.5,0x2a2c30,.1);return{F,T:T_,L,fk:'brick'}}
function office(sd){const r=rng(sd),F=[],T_=[],L=[],w=17+r()*4,d=14+r()*3,h=7.2*(2+(r()*3|0)),ox=r()*4|0;fb(F,'office',w,h,d,0,h/2,0,ox);bxp(T_,w+.5,.6,d+.5,0,h+.3,0,0x6a6d72,.08);AC(T_,r,w,d,h+.6);bxp(T_,w*.5,2,d*.4,0,h+1.6,0,0x9a9da2,.1);bxp(T_,6,.3,3.5,0,3.8,d/2+1.2,0x3a3d42,.1);L.push([BX,tf(0,h+2.8,0,0,0,0,7,1.8,.25),[0x00f0ff,0xffaa00,0x00ff88][r()*3|0],0]);return{F,T:T_,L,fk:'office'}}
function tower(sd){const r=rng(sd),F=[],T_=[],L=[];let y=0,w=14+r()*8,d=14+r()*6;const n=2+(r()*2|0),ox=r()*4|0;
 for(let i=0;i<n;i++){const h=14.4*(1+(r()*1.5|0));fb(F,'glass',w,h,d,0,y+h/2,0,ox);bxp(T_,w+.5,.6,d+.5,0,y+h+.3,0,0x555a62,.08);y+=h+.6;w*=.78;d*=.78}
 AC(T_,r,w,d,y);bxp(T_,.5,16,.5,0,y+8,0,0xbfc4ca,.05);L.push([BX,tf(0,y+16.4,0,0,0,0,.9,.9,.9),0xff2a2a,0]);L.push([BX,tf(0,y+1.8,0,0,0,0,w*.55,2.2,.3),[0x00f0ff,0xff007f,0xffb800,0x3b82f6][r()*4|0],0]);bxp(T_,w*.58,.15,.45,0,y+.8,0,0x3a3d42,.05);return{F,T:T_,L,fk:'glass'}}
function deco(sd){const r=rng(sd),F=[],T_=[],L=[],ox=r()*4|0;let y=0,w=15,d=13;for(let i=0;i<3;i++){const h=i?11:22;fb(F,'deco',w,h,d,0,y+h/2,0,ox);bxp(T_,w+.6,.8,d+.6,0,y+h+.4,0,0xb9a982,.08);y+=h+.8;w*=.74;d*=.74}
 T_.push([PY,tf(0,y+3.2,0,0,0,0,w*1.1,6.4,d*1.1),0xc9a24a,.1]);bxp(T_,.4,6,.4,0,y+9,0,0xc9a24a,.1);for(const s of[-1,1])bxp(T_,.5,22,.5,s*7.4,11,7,0xd4c9a8,.05);return{F,T:T_,L,fk:'deco'}}
function shop(sd){const r=rng(sd),F=[],T_=[],L=[],w=16,d=9,h=7,ox=r()*4|0;fb(F,'deco',w,h,d,0,h/2,0,ox);bxp(T_,w+.4,.5,d+.4,0,h+.25,0,0x6a5a4a,.1);const aw=[0xc8312a,0x2a6a9a,0x2f7a4a,0xd9a02a][r()*4|0];
 for(const q of[-1,0,1]){T_.push([BX,tf(q*5,3.4,d/2+.9,.45,0,0,4,.1,2.2),aw,.1]);bxp(T_,3,2.6,.1,q*5,1.3,d/2+.03,0x2a3238,.1)}L.push([BX,tf(0,4.4,d/2+.1,0,0,0,10,1,.1),[0xff5a8a,0x7fe8ff,0xffd23a,0x9bff7a][r()*4|0],0]);return{F,T:T_,L,fk:'deco'}}
const BLD={house1:sd=>house(sd,HS.house1),house2:sd=>house(sd,HS.house2),cabin:sd=>house(sd,HS.cabin),villa:sd=>house(sd,HS.villa),modern:sd=>house(sd,HS.modern),adobe:sd=>house(sd,HS.adobe),farm,gas,warehouse,motel,turbine,watertower,lighthouse,apt,office,tower,deco,shop};
const BW={house1:6,house2:7,cabin:5,villa:9,modern:7,adobe:5,farm:14,gas:9,warehouse:12,motel:14,turbine:4,watertower:5,lighthouse:5,apt:9,office:11,tower:13,deco:10,shop:10};

/* ---------- biomes (shared logic with the shaders) ---------- */
let fix=-1,cbI=0,dst=0,live=false,comp=null,bloom=null,grade=null,roadOld=null,envOrig=null,probeRT=null,probeT=0,night=0,e=.7;
const m5=i=>((i%5)+5)%5,bAtS=s=>fix>=0?fix:m5(Math.floor(s/SEG)),bwj=(s,k)=>{if(fix>=0)return fix===k?1:0;const t=s/SEG,i=Math.floor(t),f=sm(.86,1,t-i);return(m5(i)===k?1-f:0)+(m5(i+1)===k?f:0)};

/* ---------- materials ---------- */
const lc=document.createElement('canvas');lc.width=lc.height=128;{const g=lc.getContext('2d');for(let i=0;i<22;i++){const px=18+Math.random()*92,py=18+Math.random()*92,a=Math.random()*6.28,l=rnd(12,22),b=rnd(.7,1)*255|0;g.save();g.translate(px,py);g.rotate(a);g.fillStyle=`rgb(${b},${b},${b})`;g.beginPath();g.ellipse(0,0,l,l*.42,0,0,6.283);g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1;g.beginPath();g.moveTo(-l,0);g.lineTo(l,0);g.stroke();g.restore()}}
const leafTex=new CanvasTexture(lc);leafTex.colorSpace=SRGBColorSpace;leafTex.anisotropy=4;
const VM=new MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:0}),LAMP=new MeshBasicMaterial({vertexColors:true}),STEEL=new MeshStandardMaterial({color:0x9aa0a6,metalness:.8,roughness:.4});
const LM=hookMat(new MeshStandardMaterial({map:leafTex,alphaTest:.45,side:DoubleSide,vertexColors:true,roughness:.85}),'stl-leaf',sh=>{sh.uniforms.uTime=U.uTime;sh.uniforms.uWind=U.uWind;
 sh.vertexShader='uniform float uTime,uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sw=sin(uTime*1.7+instanceMatrix[3].x*.31+instanceMatrix[3].z*.23+position.y)*(.03+uWind*.09)*max(position.y-1.2,0.)*.3;transformed.x+=sw;transformed.z+=sw*.6;')});
x.ENVM.push(VM,LM,STEEL);

/* ---------- instanced props: one InstancedMesh per part of each kind; counts are compacted every frame ---------- */
const KI={},NV=110,NVF=80,NBL=44;
function reg(name,pairs,cap,cast){const ms=[];for(const[g,m,tint]of pairs){if(!g||!m)continue;const im=new InstancedMesh(g,m,cap);im.name=name;im.frustumCulled=false;im.castShadow=!!cast&&m!==LAMP;im.receiveShadow=true;im.count=0;grp.add(im);ms.push({m:im,tint:!!tint})}KI[name]={ms,n:0,cap}}
for(const k in VEG){const v=VEG[k]();reg(k,[[mrg(v.P),VM,1],[v.LP.length?mrg(v.LP,true):null,LM,1]],NV+NVF,1)}
for(const k in BLD){const b=BLD[k](k.length*131+7);reg(k,[[b.F.length?mrg(b.F,true):null,b.fk?FM[b.fk]:null,1],[mrg(b.T),VM,1],[b.L.length?mrg(b.L):null,LAMP,0]],NBL,1)}
{const T_=[],L=[];cyp(T_,.09,6.8,0,3.4,0,0x6a6e75);bxp(T_,1.9,.1,.14,.9,6.75,0,0x6a6e75);L.push([BX,tf(1.7,6.66,0,0,0,0,.9,.1,.45),0xfff0c8,0]);reg('lamp',[[mrg(T_),VM,0],[mrg(L),LAMP,0]],36,1)}
{const T_=[],L=[];cyp(T_,.04,.9,0,.45,0,0xe8e8e4);L.push([BX,tf(0,.75,.03,0,0,0,.06,.12,.02),0xff9a30,0]);reg('dl',[[mrg(T_),VM,0],[mrg(L),LAMP,0]],90,0)}
{const T_=[];bxp(T_,.1,.75,.1,0,.375,0,0x8a8e94);bxp(T_,.2,.05,.1,0,.74,0,0x8a8e94);reg('post',[[mrg(T_),STEEL,0]],100,0)}
{const c=document.createElement('canvas');c.width=128;c.height=96;const g=c.getContext('2d');g.fillStyle='#0b0b0d';g.fillRect(0,0,128,96);g.strokeStyle='#ffd23a';g.lineWidth=12;g.lineJoin='miter';for(const o of[18,58]){g.beginPath();g.moveTo(o,14);g.lineTo(o+36,48);g.lineTo(o,82);g.stroke()}
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;const T_=[];cyp(T_,.05,1.7,0,.85,0,0x8a8e94);reg('chevP',[[mrg(T_),VM,0]],14,0);reg('chevB',[[new PlaneGeometry(1.5,1.1),new MeshBasicMaterial({map:t,side:DoubleSide}),0]],14,0)}
const POOLM=new MeshBasicMaterial({color:0xffd9a0,transparent:true,blending:AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(.4,'rgba(255,255,255,.3)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);POOLM.map=new CanvasTexture(c);
 reg('pool',[[new PlaneGeometry(9,9).rotateX(-Math.PI/2),POOLM,0]],36,0)}
const VL=[['oak','oak','birch','bush','oak','pine','bush','rock'],['spruce','pine','spruce','dead','spruce','rock','spruce','pine'],['palm','palm','bush','palm','rock','palm','bush','palm'],['cactus','rock','cactus','dead','rock','bush','cactus','rock'],['birch','bush','oak','bush','birch','bush','oak','bush']],
 BL=[['house1','house2','farm','gas','turbine','house2'],['cabin','cabin','cabin','house2','cabin','turbine'],['villa','deco','villa','modern','lighthouse','villa'],['adobe','motel','adobe','watertower','gas','warehouse'],['tower','office','apt','shop','tower','deco']],
 VD=[1,.9,.8,.45,.5],BD=[.45,.3,.45,.3,1];
const SL=[];const mkS=(n,L,x0,x1)=>{for(let i=0;i<n;i++){const g=rnd(.82,1.12);SL.push({L,s:i%2?1:-1,z:(i+Math.random())/n*480,x01:Math.random(),x0,x1,sc:rnd(.8,1.35),ry:rnd(0,6.283),r:Math.random(),k:Math.random(),col:new Color(g*rnd(.95,1.05),g,g*rnd(.92,1.05))})}};
mkS(NV,0,9.5,32);mkS(NVF,1,34,92);mkS(NBL,2,0,0);
/* an overpass every 1100 m on the open-road maps */
const bridge=(()=>{const T_=[];bxp(T_,34,1.2,8,0,6.9,0,0x8f9094,.05);for(const s of[-1,1]){bxp(T_,34,.9,.3,0,7.9,s*3.9,0x9a9a96,.05);for(const px of[-1,1]){bxp(T_,1.7,6.3,2.2,px*10.8,3.15,s*2,0x8a8c90,.06)}}bxp(T_,4,.8,8.4,-10.8,6.4,0,0x7a7c80,.05);bxp(T_,4,.8,8.4,10.8,6.4,0,0x7a7c80,.05);
 const m=new Mesh(mrg(T_),VM);m.castShadow=m.receiveShadow=true;m.frustumCulled=false;m.visible=false;grp.add(m);return m})();
function put(n,px,py,pz,ry,sx,sy,sz){const k=KI[n];if(!k||k.n>=k.cap)return;MM.compose(V1.set(px,py,pz),QQ.setFromAxisAngle(UP,ry),V2.set(sx||1,sy||1,sz||1));for(const q of k.ms)q.m.setMatrixAt(k.n,MM);k.n++}
function props(){for(const k in KI)KI[k].n=0;
 for(const p of SL){const a=((p.z-dst)%480+480)%480,s=dst+a-60,b=bAtS(s);let nm,px,sc2=p.sc,ry=p.ry;
  if(p.L===2){if(p.r>BD[b])continue;nm=BL[b][p.k*6|0];px=p.s*(16+BW[nm]*(.9+p.x01*.6)+p.x01*28);sc2=.9+p.sc*.12;ry=(nm==='turbine'||nm==='lighthouse'||nm==='watertower')?p.ry:-p.s*Math.PI/2+(p.ry-3.14)*.03}
  else{if(p.r>VD[b])continue;nm=VL[b][p.k*8|0];px=p.s*(p.x0+p.x01*(p.x1-p.x0));if(p.L===1)sc2*=1.9;if(nm==='rock')sc2*=1.6;else if(nm!=='bush'&&nm!=='cactus')sc2*=1.25}
  const k=KI[nm];if(!k||k.n>=k.cap)continue;
  MM.compose(V1.set(px,0,60-a),QQ.setFromAxisAngle(UP,ry),V2.set(sc2,sc2*(nm==='rock'?.7:1),sc2));for(const q of k.ms){q.m.setMatrixAt(k.n,MM);if(q.tint)q.m.setColorAt(k.n,p.col)}k.n++}
 /* street furniture on a fixed grid: lamps (with light pools at night), delineators, guardrail posts, curve chevrons */
 const n0=Math.floor((dst-30)/36);for(let j=0;j<14;j++){const n=n0+j,s=n*36,u=s-dst;if(u<-25||u>470)continue;const b=bAtS(s),city=b===4;if(!(city||((b===0||b===2)&&n%2===0)))continue;
  for(const side of city?[-1,1]:[n%4<2?-1:1]){put('lamp',side*8.7,0,-u,side<0?0:Math.PI);if(night>.15)put('pool',side*4.3,.045,-u,0)}}
 const d0=Math.floor((dst-20)/24);for(let j=0;j<22;j++){const s=(d0+j)*24,u=s-dst;if(u<-20||u>470||bAtS(s)===4)continue;for(const side of[-1,1])put('dl',side*7.95,0,-u,side<0?0:Math.PI)}
 const p0=Math.floor((dst-10)/4);for(let j=0;j<46;j++){const s=(p0+j)*4,u=s-dst,b=bAtS(s);if(u<-12||u>170||b===1||b===4)continue;for(const side of[-1,1])put('post',side*7.55,0,-u,0)}
 const c0=Math.floor(dst/36);for(let j=0;j<12;j++){const s=(c0+j)*36+18,u=s-dst;if(u<10||u>380)continue;const k=x.TK.curv(s);if(Math.abs(k)<.0016)continue;const side=k>0?-1:1;put('chevP',side*8.9,0,-u,0);put('chevB',side*8.9,1.7,-u,0,k>0?1:-1,1,1)}
 for(const n in KI)for(const q of KI[n].ms){q.m.count=KI[n].n;q.m.instanceMatrix.needsUpdate=true;if(q.m.instanceColor)q.m.instanceColor.needsUpdate=true}
 let br=false;for(const nb of[Math.floor((dst-520)/1100),Math.floor((dst-520)/1100)+1]){const s=520+nb*1100,u=s-dst;if(u<-30||u>470)continue;const b=bAtS(s);if(b===0||b===3||b===4){bridge.position.z=-u;br=true;break}}bridge.visible=br}

/* ---------- sky dome, reflection probe, terrain, water, road ---------- */
const SKU={uSun:{value:new Vector3(0,1,0)},uMoon:{value:new Vector3(.45,.55,-.7).normalize()},uTop:{value:new Color()},uHor:{value:new Color()},uSunCol:{value:new Color()},uCloud:{value:.3},uTime:U.uTime,uStar:{value:0},uFlash:{value:0},uDim:{value:0},uMtn:{value:.5}};
const skyMat=new ShaderMaterial({side:BackSide,depthWrite:false,fog:false,uniforms:SKU,vertexShader:SKY_V,fragmentShader:SKY_F});skyMat.userData.nobend=true;
const skyG=new SphereGeometry(560,32,16),sky=new Mesh(skyG,skyMat);sky.renderOrder=-10;sky.frustumCulled=false;grp.add(sky);
const pm=new PMREMGenerator(R),probeScene=new Scene();probeScene.add(new Mesh(skyG,skyMat));
function probe(){try{const rt=pm.fromScene(probeScene,0,1,1000);if(probeRT)probeRT.dispose();probeRT=rt;sc.environment=rt.texture}catch(err){console.warn('Reflection probe failed',err)}}
const terrMat=hookMat(new MeshStandardMaterial({color:0xffffff,roughness:.96,metalness:0}),'stl-terrain',sh=>{sh.uniforms.uDist=U.uDist;sh.uniforms.uFix=U.uFix;
 sh.vertexShader=TERR_VDECL+sh.vertexShader.replace('#include <beginnormal_vertex>',TERR_VBEGINN).replace('#include <begin_vertex>',TERR_VBEGIN);sh.fragmentShader=TERR_FDECL+sh.fragmentShader.replace('#include <color_fragment>',TERR_FCOL)});
const terr=new Mesh(new PlaneGeometry(1400,900,70,150).rotateX(-Math.PI/2),terrMat);terr.position.set(0,-.05,-250);terr.receiveShadow=true;terr.frustumCulled=false;grp.add(terr);
const wc=document.createElement('canvas');wc.width=wc.height=256;
{const c=wc.getContext('2d'),im=c.createImageData(256,256),H=(a,b)=>{const u=a/256*6.2832,v=b/256*6.2832;return Math.sin(u*3+Math.sin(v*2))*.5+Math.sin(v*5+u)*.35+Math.sin((u+v)*7)*.2+Math.sin((u-v)*11)*.12};
 for(let b=0;b<256;b++)for(let a=0;a<256;a++){const dx=(H(a+1,b)-H(a-1,b))*4,dy=(H(a,b+1)-H(a,b-1))*4,n=Math.hypot(dx,dy,1),o=(b*256+a)*4;im.data[o]=128+127*dx/n;im.data[o+1]=128+127*dy/n;im.data[o+2]=128+127/n;im.data[o+3]=255}c.putImageData(im,0,0)}
const wn2=new CanvasTexture(wc);wn2.wrapS=wn2.wrapT=RepeatWrapping;wn2.repeat.set(40,100);wn2.anisotropy=8;
const WTM=new MeshStandardMaterial({color:0x2a7da0,roughness:.05,metalness:.25,normalMap:wn2,normalScale:new Vector2(.9,.9),transparent:true,opacity:.93,envMapIntensity:1.8});
const water=new Mesh(new PlaneGeometry(700,900,4,150).rotateX(-Math.PI/2),WTM);water.position.set(-380,-1.6,-250);grp.add(water);
const rdMat=hookMat(new MeshStandardMaterial({map:x.road.material.map,roughness:.62,metalness:0}),'stl-road',sh=>{sh.uniforms.uWet=U.uWet;sh.fragmentShader=ROAD_F+sh.fragmentShader.replace('#include <roughnessmap_fragment>',ROAD_FRAG)});
/* roadside ribbons: gravel shoulders always; W-beam guardrail on the open maps, concrete barrier in the mountains and the city */
function maskMat(m,ks,key){const cond=ks.map(k=>`bw(vS,${k}.)`).join('+');return hookMat(m,key,sh=>{sh.uniforms.uDist=U.uDist;sh.uniforms.uFix=U.uFix;
 sh.vertexShader='varying float vS;uniform float uDist;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvS=uDist-(transformed.z+modelMatrix[3].z);');
 sh.fragmentShader='varying float vS;\n'+BIO+sh.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(('+cond+')<.5)discard;')})}
const rib=(geo,mat,px,py)=>{const m=new Mesh(geo,mat);m.position.set(px,py,-250);m.frustumCulled=false;m.receiveShadow=true;m.castShadow=true;grp.add(m);return m};
const shG=new PlaneGeometry(2.4,700,1,140).rotateX(-Math.PI/2),shM=new MeshStandardMaterial({color:0x5d5a54,roughness:1}),
 rlG=new BoxGeometry(.07,.34,700,1,1,140),rlM=maskMat(new MeshStandardMaterial({color:0xaab0b6,metalness:.85,roughness:.35}),[0,2,3],'stl-rail'),
 jbG=new BoxGeometry(.55,.82,700,1,1,140),jbM=maskMat(new MeshStandardMaterial({color:0xb9b9b4,roughness:.9}),[1,4],'stl-jersey');
for(const s of[-1,1]){rib(shG,shM,s*8.4,.01);rib(rlG,rlM,s*7.55,.62);rib(jbG,jbM,s*7.6,.41)}
x.ENVM.push(terrMat,rdMat,WTM,rlM,FM.glass,FM.office,FM.brick,FM.deco);

/* ---------- weather: clear, cloudy, rain, thunderstorm, fog, snow. The cell for each 1700 m is seeded, so a drive is repeatable ---------- */
const WS=[{n:'Clear',cv:.28,fg:1,dm:0,rn:0,sn:0,wd:.15,st:0,gr:1},{n:'Cloudy',cv:.72,fg:.8,dm:.3,rn:0,sn:0,wd:.35,st:0,gr:1},{n:'Rain',cv:.92,fg:.55,dm:.55,rn:.75,sn:0,wd:.6,st:0,gr:.82},
 {n:'Thunderstorm',cv:1,fg:.4,dm:.8,rn:1,sn:0,wd:1,st:1,gr:.7},{n:'Fog',cv:.6,fg:.2,dm:.4,rn:0,sn:0,wd:.1,st:0,gr:.94},{n:'Snow',cv:.9,fg:.42,dm:.4,rn:0,sn:.9,wd:.4,st:0,gr:.78}];
const cur={cv:.28,fg:1,dm:0,rn:0,sn:0,wd:.15,st:0,gr:1},WOUT={name:'Clear',wet:0,rain:0,snow:0,grip:1,storm:false,fog:1};let wet=0,nextFl=6,flash=0,boltT=0;
const wk=n=>{if(n<=0)return 0;const q=rng(n*977+13)();return q<.3?0:q<.5?1:q<.68?2:q<.78?3:q<.9?4:5},wst=n=>{const k=wk(n);return k===5&&bAtS(n*CELL+CELL/2)!==1?2:k};
const seeds=n=>{const a=new Float32Array(n*3);for(let i=0;i<a.length;i++)a[i]=Math.random();return a};
const mat0=(vs,fs,u,extra)=>{const m=new ShaderMaterial({vertexShader:vs,fragmentShader:fs,uniforms:u,transparent:true,depthWrite:false,fog:false,...extra});return m};
const rn=1800,rg=new BufferGeometry(),rs=seeds(rn),rP=new Float32Array(rn*6),rE=new Float32Array(rn*2);for(let i=0;i<rn;i++){for(let k=0;k<2;k++){rP.set([rs[i*3],rs[i*3+1],rs[i*3+2]],i*6+k*3);rE[i*2+k]=k}}
rg.setAttribute('position',new Float32BufferAttribute(rP,3));rg.setAttribute('aE',new Float32BufferAttribute(rE,1));
const RU={uT:{value:0},uZ:{value:0},uI:{value:0},uWind:{value:0},uFall:{value:20},uSpd:{value:0}},rainM=mat0(RAIN_V,RAIN_F,RU),rain=new LineSegments(rg,rainM);rainM.userData.nobend=true;rain.frustumCulled=false;rain.renderOrder=6;rain.visible=false;grp.add(rain);
const ptsOf=(n,vs,fs,u,bend)=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(seeds(n),3));const m=mat0(vs,fs,u);if(bend){m.onBeforeCompile=function(sh){defHook.call(this,sh)};m.customProgramCacheKey=()=>'stl-rip'}else m.userData.nobend=true;const p=new Points(g,m);p.frustumCulled=false;p.renderOrder=6;p.visible=false;grp.add(p);return p};
const SU={uT:{value:0},uZ:{value:0},uI:{value:0},uPx:{value:600}},snow=ptsOf(2200,SNOW_V,SNOW_F,SU,false),PU={uT:{value:0},uZ:{value:0},uI:{value:0},uPx:{value:600}},rip=ptsOf(380,RIP_V,RIP_F,PU,true);
const bg=new BufferGeometry();bg.setAttribute('position',new Float32BufferAttribute(new Float32Array(28*3),3));
const bolt=new LineSegments(bg,new LineBasicMaterial({color:new Color(3,3.4,4),transparent:true,blending:AdditiveBlending,fog:false,depthWrite:false}));bolt.material.userData.nobend=true;bolt.frustumCulled=false;bolt.visible=false;grp.add(bolt);
function strike(){flash=1;boltT=.22;const P=bg.attributes.position.array,x0=rnd(-220,220),z0=-rnd(170,380);let px=x0,py=300,pz=z0;for(let i=0;i<14;i++){const ny=py-300/14,nx=px+rnd(-14,14),nz=pz+rnd(-6,6);P.set([px,py,pz,nx,ny,nz],i*6);px=nx;py=ny;pz=nz}bg.attributes.position.needsUpdate=true;bolt.visible=true;try{x.snd.thunder(rnd(.3,2.6),rnd(.7,1.1))}catch(err){}}
function weather(dt,S){const n=Math.floor(dst/CELL),f=sm(.72,1,dst/CELL-n),A=WS[wst(n)],B=WS[wst(n+1)];for(const k in cur)cur[k]=lp(A[k],B[k],f);
 const tg=cur.rn>.2?1:cur.sn>.2?.5:0;wet+=(tg-wet)*Math.min(1,dt*(tg>wet?.25:.02));
 WOUT.name=(f<.5?A:B).n;WOUT.wet=wet;WOUT.rain=cur.rn;WOUT.snow=cur.sn;WOUT.grip=cl(cur.gr-(wet>.3&&cur.rn<.2&&cur.sn<.2?.04:0),.6,1);WOUT.storm=cur.st>.5;WOUT.fog=cur.fg;
 if(cur.st>.5){nextFl-=dt;if(nextFl<=0){nextFl=rnd(3.5,10);strike()}}flash*=Math.exp(-dt*8);if(boltT>0){boltT-=dt;if(boltT<=0)bolt.visible=false}
 U.uWet.value=wet;U.uWind.value=cur.wd;RU.uT.value=SU.uT.value=PU.uT.value=U.uTime.value;RU.uZ.value=SU.uZ.value=PU.uZ.value=dst;RU.uSpd.value=S.v||0;RU.uWind.value=cur.wd*5;
 RU.uI.value=cur.rn;rain.visible=cur.rn>.02;SU.uI.value=cur.sn;snow.visible=cur.sn>.02;PU.uI.value=cur.rn;rip.visible=cur.rn>.2}

/* ---------- headlights, rain on the lens, post-processing ---------- */
const hlL=new SpotLight(0xfff2d6,0,130,.5,.6,1.6),hlR=new SpotLight(0xfff2d6,0,130,.5,.6,1.6);sc.add(hlL,hlL.target,hlR,hlR.target);
const lens=document.createElement('canvas');lens.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none';x.ui.insertBefore(lens,x.ui.children[1]||null);const lx=lens.getContext('2d'),DR=[];let wipT=0;
function lensUpdate(dt,S){const w=lens.clientWidth|0,h=lens.clientHeight|0;if(lens.width!==w||lens.height!==h){lens.width=w;lens.height=h}lx.clearRect(0,0,w,h);
 if(!(S.st==='run'&&(S.cm===2||S.cm===3||S.cm===4)&&cur.rn>.15)){DR.length=0;return}
 if(DR.length<70&&Math.random()<dt*cur.rn*(20+(S.v||0)*.4))DR.push({x:Math.random()*w,y:Math.random()*h*.8,r:rnd(2,5),v:0});
 wipT+=dt;const ph=(wipT%1.6)/1.6,ang=lp(-.15,-Math.PI+.15,Math.sin(ph*Math.PI)),px=w*.3,py=h*1.08,L=h*1.2,wp=cur.rn>.3;
 for(let i=DR.length-1;i>=0;i--){const d=DR[i];d.v+=dt*(d.r>3.6?30:4);d.y+=d.v*dt;d.r+=dt*.2;if(d.y>h||wp&&Math.abs(Math.atan2(d.y-py,d.x-px)-ang)<.07&&Math.hypot(d.x-px,d.y-py)<L){DR.splice(i,1);continue}
  lx.fillStyle='rgba(190,210,235,.16)';lx.strokeStyle='rgba(255,255,255,.35)';lx.beginPath();lx.ellipse(d.x,d.y,d.r,d.r*1.25,0,0,6.283);lx.fill();lx.stroke()}
 if(wp){lx.strokeStyle='rgba(8,8,10,.95)';lx.lineWidth=Math.max(6,w*.008);lx.lineCap='round';lx.beginPath();lx.moveTo(px,py);lx.lineTo(px+Math.cos(ang)*L,py+Math.sin(ang)*L);lx.stroke()}}
try{const[a,b,c,d]=await Promise.all(['EffectComposer','RenderPass','UnrealBloomPass','OutputPass'].map(n=>import(`three/addons/postprocessing/${n}.js`))),sz=R.getSize(new Vector2()),p=R.getPixelRatio();
 const isMob=matchMedia('(pointer:coarse)').matches;comp=new a.EffectComposer(R,new WebGLRenderTarget(1,1,{type:HalfFloatType,samples:isMob?0:2}));comp.setPixelRatio(Math.min(p,1.5));comp.setSize(sz.x,sz.y);comp.addPass(new b.RenderPass(sc,cam));
 bloom=new c.UnrealBloomPass(new Vector2(sz.x,sz.y),.22,.45,.96);comp.addPass(bloom);
 try{const{ShaderPass}=await import('three/addons/postprocessing/ShaderPass.js');grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uTime:{value:0},uSpd:{value:0},uNit:{value:0},uVig:{value:.3},uGrain:{value:.03},uSat:{value:1.08},uCon:{value:1.06},uCA:{value:.002},uRay:{value:0},uSunUV:{value:new Vector2(.5,.5)},uSh:{value:new Vector3(1,1,1)},uHi:{value:new Vector3(1,1,1)}},vertexShader:FS_V,fragmentShader:GRADE_F});comp.addPass(grade)}
 catch(err){grade=null;console.warn('Colour grading unavailable',err)}
 comp.addPass(new d.OutputPass())}
catch(err){comp=null;console.warn('Post-processing unavailable, using plain rendering',err)}

/* ---------- per-frame update ---------- */
const SZ2=new Vector2(),EK=[.78,.08,-.2,-.6],TOP_N=new Color(0x04081a),TOP_D=new Color(0x2b6cc4),HOR_N=new Color(0x0b1424),HOR_D=new Color(0xb7d6f2),HOR_S=new Color(0xff8c4a),TOP_G=new Color(0x78808a),HOR_G=new Color(0x9aa2ab),
 top=new Color(),hor=new Color(),sunC=new Color(),SD=new Vector3(),MD=new Vector3(.45,.55,-.7).normalize(),MT=[.55,1,.35,.65,.2];
function update(dist,dark,dt,time,S){S=S||{};dst=dist;U.uDist.value=dist;U.uTime.value=time;
 const t=dist/2200,i=Math.floor(t)%4;e=lp(EK[i],EK[(i+1)%4],sm(0,1,t%1));
 cbI=bAtS(dist+160);weather(dt,S);
 const c=Math.sqrt(Math.max(0,1-e*e)),w=sm(-.22,.32,e),gl=cl(1-Math.abs(e-.03)/.3,0,1);SD.set(-.45*c,e,-.89*c).normalize();night=cl((.05-e)*5,0,1);
 top.copy(TOP_N).lerp(TOP_D,w);hor.copy(HOR_N).lerp(HOR_D,w).lerp(HOR_S,gl*.85);
 C3.copy(TOP_G).multiplyScalar(.12+.88*w);top.lerp(C3,cur.dm*.8);C3.copy(HOR_G).multiplyScalar(.12+.88*w);hor.lerp(C3,cur.dm*.75);
 sunC.setRGB(1,.96,.88).lerp(C3.setRGB(1,.5,.22),1-sm(0,.45,e));
 SKU.uSun.value.copy(SD);SKU.uTop.value.copy(top);SKU.uHor.value.copy(hor);SKU.uSunCol.value.copy(sunC).multiplyScalar(1.2);SKU.uCloud.value=cur.cv;SKU.uDim.value=cur.dm;SKU.uStar.value=cl((-e-.05)*3,0,1)*(1-cur.dm);SKU.uFlash.value=flash*.9;
 let mt=0;for(let k=0;k<5;k++)mt+=bwj(dist+300,k)*MT[k];SKU.uMtn.value=mt;sky.position.copy(cam.position);
 const Is=sm(-.04,.3,e)*3.4*(1-cur.dm*.7),Im=(1-w)*.42*(1-cur.dm*.5),sn=Is>=Im;x.sun.color.copy(sn?sunC:C3.setHex(0x8fa8ff));x.sun.intensity=Math.max(Is,Im);x.sun.position.copy(x.sun.target.position).addScaledVector(sn?SD:MD,70);
 x.hemi.color.copy(top).lerp(hor,.4);x.hemi.groundColor.setRGB(.12,.13,.12).multiplyScalar(.4+.6*w);x.hemi.intensity=lp(.28,1.1,w)*(1-cur.dm*.3)+flash*3.5;
 sc.fog.color.copy(hor);sc.background.copy(hor);const fg=cur.fg;sc.fog.far=Math.max(90,380*fg);sc.fog.near=Math.min(40*fg,sc.fog.far*.3);R.toneMappingExposure=1.05+night*.25;
 const ei=lp(.12,1,w)*(1-cur.dm*.3);for(const m of x.ENVM)m.envMapIntensity=ei*(m.metalness>.9&&m.roughness<.08?1.6:1);
 for(const k in FM)FM[k].emissiveIntensity=night*2.6;LAMP.color.setScalar(lp(.3,2.6,night));POOLM.color.setRGB(1,.85,.6).multiplyScalar(night*.9);
 WTM.color.setHex(0x2a7da0).lerp(C3.setHex(0x08161f),night*.85);wn2.offset.set(time*.012,dist*.0778+time*.03);
 const hl=S.lights||night>.4,hi=hl?lp(0,35,cl(night*1.3,0,1)):0,px=S.px||0;hlL.intensity=hlR.intensity=hi;hlL.position.set(px-.7,.75,-2);hlR.position.set(px+.7,.75,-2);hlL.target.position.set(px-.4,0,-45);hlR.target.position.set(px+.4,0,-45);
 props();
 if((probeT-=dt)<=0){probeT=6;probe()}
 lensUpdate(dt,S);
 if(bloom)bloom.strength=.22+night*.12+cur.dm*.04+(S.nit||0)*.15;
 if(grade){const g=grade.uniforms,sp=RMo?0:cl(((S.v||0)-30)/70,0,1);g.uTime.value=time%100;g.uSpd.value=sp;g.uNit.value=RMo?0:S.nit||0;g.uVig.value=.28+.12*night+cur.dm*.1+(S.nit||0)*.15;g.uGrain.value=.022+night*.02;
  g.uSat.value=1.1-night*.14-cur.dm*.25;g.uCon.value=1.05+gl*.05-cur.dm*.06;g.uCA.value=.0014+(S.nit||0)*.006+cl(((S.v||0)-60)/100,0,1)*.002;
  g.uSh.value.set(1-night*.06,1-night*.02,1+night*.1);g.uHi.value.set(1+gl*.08,1+gl*.01,1-gl*.1);
  V1.copy(SD).multiplyScalar(500).add(cam.position).project(cam);g.uSunUV.value.set(V1.x*.5+.5,V1.y*.5+.5);g.uRay.value=V1.z<1&&Math.abs(V1.x)<1.5&&Math.abs(V1.y)<1.5?(1-cur.dm*.8)*sm(-.02,.2,e)*.25:0}
 R.getSize(SZ2);SU.uPx.value=PU.uPx.value=SZ2.y*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360))}

/* ---------- public interface (same shape as ultra3d.js) ---------- */
return{get live(){return live},
 on(v,w,h,p){const was=live;live=v;grp.visible=v;x.ground.visible=!v;for(const q of x.walls)q.visible=!v;for(const q of x.lamps||[])q.visible=!v;x.stars.visible=!v;hlL.visible=hlR.visible=v;lens.style.display=v?'block':'none';
  if(v&&!was){roadOld=x.road.material;rdMat.map=roadOld.map;x.road.material=rdMat;envOrig=sc.environment;probeT=0}
  else if(!v&&was){if(roadOld){roadOld.map=rdMat.map;x.road.material=roadOld}sc.environment=envOrig;DR.length=0}
  if(comp&&v){comp.setPixelRatio(p);comp.setSize(w,h)}},
 size(w,h,p){if(comp){comp.setPixelRatio(p);comp.setSize(w,h)}},
 map(i){fix=i-1},bi(){return cbI},name(){return NAMES[cbI]},city(){return false},weather(){return WOUT},update,
 render(){comp?comp.render():R.render(sc,cam)},
 dispose(){try{if(live){live=false;if(roadOld){roadOld.map=rdMat.map;x.road.material=roadOld}x.ground.visible=true;for(const q of x.walls)q.visible=true;for(const q of x.lamps||[])q.visible=true;x.stars.visible=true;sc.environment=envOrig}}catch(err){}
  sc.remove(grp,hlL,hlL.target,hlR,hlR.target);lens.remove();if(probeRT)probeRT.dispose();pm.dispose();if(comp&&comp.dispose)comp.dispose()}}}
