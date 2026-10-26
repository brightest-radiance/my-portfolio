/* Stellar Drive audio. Nothing is sampled: every engine is a band-limited pulse train built from that engine's own firing order
   (cylinder count, uneven firing, exhaust resonance), so a flat-plane V12, a cross-plane V8, a turbo straight-six, a diesel and a
   single-cylinder bike all have a different voice. Also: held horns per vehicle class, turbo whistle and blow-off, nitro, crashes,
   sirens, rain, thunder and Doppler pass-bys for traffic. */

/* cyl: cylinders. jit/amp: uneven firing timing and strength (fractions of the 720 degree cycle). br: brightness in firing harmonics.
   tilt: spectral roll-off. res/rk: exhaust resonance gain and position. idle/red: rpm range. drv: growl. int: intake roar.
   clk: diesel clatter. whn: gear whine. tb: turbo (0-1). pop: overrun crackle. vol: loudness. f0/f1: filter range in Hz. */
export const EP={
 i3:{cyl:3,jit:[0,.01,-.01],br:1.4,tilt:1.3,res:.5,rk:1.4,idle:900,red:6200,drv:1.3,int:.3,clk:0,whn:.02,tb:0,pop:0,vol:1.25,f0:300,f1:2600},
 i4:{cyl:4,jit:[0,.004,-.004,.002],br:1.4,tilt:1.3,res:.6,rk:1.2,idle:800,red:6300,drv:1.2,int:.3,clk:0,whn:.03,tb:0,pop:0,vol:1.3,f0:260,f1:2600},
 i4s:{cyl:4,jit:[0,.003,-.003,.002],br:1.3,tilt:1.2,res:1,rk:1.5,idle:900,red:7600,drv:1.9,int:.45,clk:0,whn:.04,tb:.35,pop:.3,vol:1.05,f0:300,f1:3800},
 i6:{cyl:6,br:1,tilt:1.5,res:.5,rk:1.1,idle:750,red:5600,drv:1.2,int:.25,clk:0,whn:.02,tb:0,pop:0,vol:1,f0:240,f1:2400},
 i6t:{cyl:6,jit:[0,.002,-.002],br:1.15,tilt:1.35,res:.8,rk:1.3,idle:850,red:7300,drv:1.9,int:.35,clk:0,whn:.04,tb:1,pop:.45,vol:1.1,f0:280,f1:3600},
 flat6:{cyl:6,jit:[0,.01,-.008,.012,-.01,.006],amp:[1,.8,1,.85,1,.8],br:1.2,tilt:1.2,res:.9,rk:1.4,idle:850,red:7800,drv:1.7,int:.4,clk:0,whn:.03,tb:0,pop:.35,vol:1,f0:280,f1:3800},
 v6:{cyl:6,jit:[0,.012,-.012,.01,-.01,0],amp:[1,.9,1,.9,1,.9],br:.85,tilt:1.7,res:.5,rk:1,idle:700,red:5800,drv:1.4,int:.3,clk:0,whn:.02,tb:0,pop:0,vol:1.05,f0:220,f1:2200},
 v8t:{cyl:8,jit:[0,.02,-.015,.02,-.02,.015,-.015,.01],amp:[1,.7,.9,1,.7,1,.8,.75],br:.7,tilt:1.9,res:.6,rk:.9,idle:600,red:5000,drv:1.6,int:.3,clk:0,whn:.02,tb:0,pop:.15,vol:1.2,f0:180,f1:1700},
 v8m:{cyl:8,jit:[0,.03,-.02,.03,-.03,.02,-.02,.01],amp:[1,.65,.9,1,.6,1,.8,.7],br:.8,tilt:1.5,res:.8,rk:.9,idle:650,red:6200,drv:2.4,int:.35,clk:0,whn:.02,tb:0,pop:.7,vol:1.25,f0:200,f1:2200},
 v8f:{cyl:8,jit:[0,.004,-.004,.003,-.003,.004,-.004,.002],amp:[1,.9,1,.9,1,.9,1,.9],br:1.3,tilt:1.1,res:1,rk:1.4,idle:900,red:8300,drv:2.3,int:.45,clk:0,whn:.05,tb:0,pop:.55,vol:.95,f0:300,f1:4200},
 v12:{cyl:12,jit:[0,.002,-.002],br:1.7,tilt:1,res:1.1,rk:1.2,idle:1000,red:9300,drv:2.2,int:.5,clk:0,whn:.08,tb:0,pop:.6,vol:.8,f0:340,f1:5200},
 dsl:{cyl:4,jit:[0,.02,-.02,.015],amp:[1,.8,1,.85],br:1,tilt:1.8,res:.4,rk:.8,idle:700,red:3900,drv:1.2,int:.15,clk:.55,whn:.02,tb:.2,pop:0,vol:.8,f0:220,f1:1500,rasp:.5},
 dsl6:{cyl:6,jit:[0,.012,-.012],br:.9,tilt:1.9,res:.5,rk:.8,idle:550,red:2800,drv:1.2,int:.2,clk:.5,whn:.03,tb:.5,pop:0,vol:.85,f0:200,f1:1300,rasp:.5},
 bike:{cyl:1,br:6,tilt:1.2,res:.5,rk:2,idle:1400,red:9500,drv:1.6,int:.4,clk:.1,whn:.03,tb:0,pop:.4,vol:1.5,f0:300,f1:4200},
 twin:{cyl:2,jit:[0,.125],amp:[1,.85],br:3,tilt:1.3,res:.8,rk:1.5,idle:1200,red:8800,drv:1.8,int:.4,clk:0,whn:.03,tb:0,pop:.5,vol:.9,f0:300,f1:4000}};

/* horns: tones in Hz, level, attack and release in seconds, buzz = diaphragm flutter, air = breathy air horn */
export const HN={
 car:{t:[420,520],g:.045,a:.02,r:.07,bz:90},sporty:{t:[540,680],g:.05,a:.012,r:.05,bz:110},exotic:{t:[620,820,990],g:.028,a:.01,r:.05,bz:130},
 big:{t:[350,440],g:.05,a:.025,r:.09,bz:80},van:{t:[390,490],g:.045,a:.025,r:.08,bz:85},air:{t:[185,233,277],g:.06,a:.05,r:.28,bz:0,air:1},
 bus:{t:[150,196,247],g:.065,a:.06,r:.3,bz:0,air:1},bike:{t:[700,940],g:.035,a:.01,r:.04,bz:120}};

/* which engine and horn each vehicle uses */
export const VS={hyper:['v12','exotic'],gt:['v8f','sporty'],supra:['i6t','sporty'],sedan:['i4','car'],suv:['v6','big'],hatch:['i4','car'],kei:['i3','bike'],hothatch:['i4s','sporty'],
 coupe:['i4s','sporty'],roadster:['flat6','sporty'],muscle:['v8m','big'],jeep:['i6','big'],pickup:['v8t','big'],minivan:['v6','van'],wagon:['i4','car'],taxi:['i4','car'],
 police:['v8t','big'],ambulance:['dsl','van'],van:['dsl','van'],boxtruck:['dsl','air'],truck:['dsl6','air'],tanker:['dsl6','air'],towtruck:['dsl','air'],bus:['dsl6','bus'],
 schoolbus:['dsl6','bus'],motorbike:['twin','bike'],scooter:['bike','bike']};

const MG=.5,EV=.3;   /* master level and engine level: the whole mix was about 12 dB too hot */
export function createAudio(cfg){
 let c=null,nb,mst,eng=null,hornV=null,ns={},ntv=[],wsc={},sirV=null,lastSet=0;
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const ctx=()=>{if(!c){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;c=new C();nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  mst=c.createGain();const cp=c.createDynamicsCompressor();cp.threshold.value=-22;cp.knee.value=18;cp.ratio.value=4;cp.attack.value=.006;cp.release.value=.25;mst.connect(cp);cp.connect(c.destination);mkBeds()}
  if(c.state!=='running')c.resume();mst.gain.value=cfg.sfx?MG:0;return c};
 const noise=(type,f,q,loop=true)=>{const s=c.createBufferSource(),b=c.createBiquadFilter(),g=c.createGain();s.buffer=nb;s.loop=loop;b.type=type;b.frequency.value=f;b.Q.value=q;g.gain.value=0;s.connect(b);b.connect(g);g.connect(mst);s.start(0,Math.random());return{s,b,g}};
 const curve=k=>{const a=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/512-1;a[i]=Math.tanh(x*k)/Math.tanh(k)}return a};
 /* the engine wave: Fourier coefficients of one full 4-stroke cycle of firing pulses */
 const waveOf=(key)=>{if(wsc[key])return wsc[key];const P=EP[key],n=72,re=new Float32Array(n),im=new Float32Array(n),N=P.cyl;
  for(let k=1;k<n;k++){let a=0,b=0;for(let i=0;i<N;i++){const ph=6.2832*k*(i/N+(P.jit?P.jit[i%P.jit.length]:0)),am=P.amp?P.amp[i%P.amp.length]:1;a+=am*Math.cos(ph);b+=am*Math.sin(ph)}
   const hk=Math.pow(1+(k/(N*P.br*1.8))**2,-P.tilt*.62)*(1+P.res*Math.exp(-(((k-N*P.rk)/(N*.7))**2)))*Math.min(1,Math.pow(k/(N*.9),.9));re[k]=a*hk/N;im[k]=b*hk/N}
  return wsc[key]=c.createPeriodicWave(re,im)};
 const hornWave=air=>{if(wsc['h'+air])return wsc['h'+air];const n=40,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++){const o=k%2?1:.22;im[k]=o/Math.pow(k,air?1.3:1.15)}return wsc['h'+air]=c.createPeriodicWave(re,im)};
 /* always-on beds: wind, road, rain, tyre squeal, nitro rush, scrape. Their gains are driven from set() */
 function mkBeds(){ns.wind=noise('bandpass',700,.7);ns.road=noise('lowpass',260,.6);ns.rain=noise('highpass',2600,.4);ns.sq=noise('bandpass',2300,7);ns.sq2=noise('bandpass',1500,5);ns.nit=noise('bandpass',1700,.8);ns.hiss=noise('highpass',5200,.5);ns.scr=noise('bandpass',2800,2.5);ns.wet=noise('highpass',3200,.5)}
 const ramp=(p,v,t=.08)=>p.setTargetAtTime(v,c.currentTime,t);

 /* one engine voice: used for the player (full) and for pass-by traffic (light) */
 function voice(key,full){const P=EP[key],o=c.createOscillator(),pre=c.createGain(),sh=c.createWaveShaper(),lp=c.createBiquadFilter(),pk=c.createBiquadFilter(),out=c.createGain(),nodes=[o];
  o.setPeriodicWave(waveOf(key));o.frequency.value=P.idle/120;sh.curve=curve(P.drv*.55);sh.oversample='2x';lp.type='lowpass';lp.Q.value=.6;pk.type='peaking';pk.frequency.value=900;pk.Q.value=1.1;pk.gain.value=7;out.gain.value=0;pre.gain.value=1;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=full?85:120;hp.Q.value=.6;
  o.connect(pre);pre.connect(sh);sh.connect(hp);hp.connect(lp);lp.connect(pk);const p2=c.createBiquadFilter();p2.type='peaking';p2.frequency.value=1700;p2.Q.value=.9;p2.gain.value=4;pk.connect(p2);p2.connect(out);out.connect(mst);o.start();const V={P,o,pre,lp,pk,out,nodes,key};
  if(full){const o2=c.createOscillator();o2.setPeriodicWave(waveOf(key));o2.detune.value=P.cyl<4?9:5;o2.connect(pre);o2.start();V.o2=o2;nodes.push(o2);
   const sub=c.createOscillator(),sg=c.createGain();sub.type='sine';sg.gain.value=0;sub.connect(sg);sg.connect(out);sub.start();V.sub=sub;V.sg=sg;nodes.push(sub);
   V.in=noise('bandpass',900,1.4);V.cl=noise('bandpass',2600,1.2);
   /* exhaust rasp: band-passed noise whose volume is pulsed by the engine's own firing wave */
   const rs=c.createBufferSource(),rb=c.createBiquadFilter(),am=c.createGain(),rg=c.createGain(),o3=c.createOscillator();rs.buffer=nb;rs.loop=true;rb.type='bandpass';rb.frequency.value=700;rb.Q.value=.9;am.gain.value=0;rg.gain.value=0;o3.setPeriodicWave(waveOf(key));o3.frequency.value=P.idle/120;
   rs.connect(rb);rb.connect(am);o3.connect(am.gain);am.connect(rg);rg.connect(out);rs.start(0,Math.random());o3.start();nodes.push(rs,o3);V.rb=rb;V.rg=rg;V.o3=o3;
   const wh=c.createOscillator(),wg=c.createGain();wh.type='sine';wg.gain.value=0;wh.connect(wg);wg.connect(out);wh.start();V.wh=wh;V.wg=wg;nodes.push(wh);
   if(P.tb){const tb=c.createOscillator(),tg=c.createGain();tb.type='sine';tg.gain.value=0;tb.connect(tg);tg.connect(out);tb.start();V.tb=tb;V.tg=tg;nodes.push(tb)}}
  return V}
 const vstop=V=>{if(!V)return;for(const n of V.nodes)try{n.stop()}catch(e){}if(V.in){for(const k of['in','cl']){try{V[k].s.stop()}catch(e){}}}try{V.out.disconnect()}catch(e){}};

 const A={
  unlock(){return!!ctx()},
  /* ---- player engine ---- */
  start(vkey){if(!ctx()||eng)return;const key=(VS[vkey]||VS.sedan)[0];eng=voice(key,true);eng.vk=vkey;eng.cut=0;eng.lr=0;
   /* starter motor, then the engine catches */
   const n=c.currentTime,so=c.createOscillator(),sg=c.createGain();so.type='sawtooth';so.frequency.setValueAtTime(40,n);so.frequency.linearRampToValueAtTime(95,n+.45);sg.gain.setValueAtTime(.025,n);sg.gain.linearRampToValueAtTime(0,n+.5);so.connect(sg);sg.connect(mst);so.start(n);so.stop(n+.55)},
  stop(){if(!c)return;for(const k in ns)ramp(ns[k].g.gain,0,.05);if(eng){const e=eng;eng=null;ramp(e.out.gain,0,.04);setTimeout(()=>vstop(e),300)}A.horn(false);A.siren(0);for(const v of ntv)ramp(v.g.gain,0,.05)},
  /* S: rpm 0-1 within the rev range, thr 0-1, v m/s, vx lateral speed, brk, nit, boost 0-1, wet 0-1, rain 0-1, edge 0-1 (road edge), gear */
  set(S){if(!eng||!c)return;const P=eng.P,n=c.currentTime,rpm=P.idle+(P.red-P.idle)*S.rpm,f=rpm/120,load=S.thr,cut=eng.cut>n?0:1;mst.gain.value=cfg.sfx?MG:0;
   eng.o.frequency.setTargetAtTime(f,n,.025);eng.o2.frequency.setTargetAtTime(f,n,.025);eng.o3.frequency.setTargetAtTime(f,n,.025);eng.rb.frequency.setTargetAtTime(380+rpm*.22,n,.06);ramp(eng.rg.gain,(P.rasp==null?.7:P.rasp)*(.5+load*.5)*(.5+S.rpm*.5)*cut,.05);eng.sub.frequency.setTargetAtTime(rpm/60,n,.03);
   eng.lp.frequency.setTargetAtTime(Math.min(3000,P.f0+(P.f1-P.f0)*clamp(.14+load*.5+S.rpm*.4+(S.nit?.15:0),0,1)),n,.05);eng.pk.frequency.setTargetAtTime(560+rpm*.07,n,.06);
   eng.out.gain.setTargetAtTime(cut*P.vol*EV*(.1+load*.08+S.rpm*.04+(S.nit?.02:0)),n,.035);eng.sg.gain.setTargetAtTime(.1*(1-S.rpm)*(.4+load*.6),n,.1);
   ramp(eng.in.g.gain,P.int*(.01+load*.03)*S.rpm*cut*EV*2.2,.06);eng.in.b.frequency.setTargetAtTime(500+rpm*.35,n,.06);
   ramp(eng.cl.g.gain,P.clk*.03*(.5+load*.5)*cut*EV*2.2,.06);eng.cl.b.frequency.setTargetAtTime(1800+rpm*.3,n,.06);
   eng.wh.frequency.setTargetAtTime(220+S.v*34,n,.05);ramp(eng.wg.gain,P.whn*.05*clamp(S.v/40,0,1)*(.3+load*.7)*EV*4,.1);
   if(eng.tb){const b=S.boost*P.tb;eng.tb.frequency.setTargetAtTime(2400+b*6200,n,.06);ramp(eng.tg.gain,(.0008+b*.008*(load>.5?1:.2))*EV*4,.08);
    if(eng.bl>.5&&load<.25){A.bov(eng.bl);eng.bl=0}eng.bl=Math.max(eng.bl*.95||0,S.boost*P.tb)}
   if(P.pop&&eng.lr-S.rpm>.12&&load<.5&&Math.random()<P.pop)A.pop(P.pop);eng.lr=S.rpm;
   ramp(ns.wind.g.gain,Math.min(.04,S.v*.0005),.1);ns.wind.b.frequency.setTargetAtTime(500+S.v*10,n,.1);ramp(ns.road.g.gain,Math.min(.03,S.v*.0004)*(1+S.edge*3),.1);
   const slip=clamp((Math.abs(S.vx)-3.2)*.012+(S.brk&&S.v>25?.015:0),0,.035)*(1-S.wet*.4);ramp(ns.sq.g.gain,slip,.05);ramp(ns.sq2.g.gain,slip*.6,.05);ns.sq.b.frequency.setTargetAtTime(2100+S.v*6,n,.1);
   ramp(ns.rain.g.gain,S.rain*.02,.4);ramp(ns.wet.g.gain,S.wet*Math.min(.025,S.v*.0005),.2);
   ramp(ns.nit.g.gain,S.nit?.035:0,S.nit?.05:.25);ns.nit.b.frequency.setTargetAtTime(S.nit?1500+S.v*14:900,n,.1);ramp(ns.hiss.g.gain,S.nit?.012:0,.1);if(S.nit)eng.nit=1;else eng.nit=0},
  shift(){if(!eng)return;const n=c.currentTime;eng.cut=n+.09;if(eng.P.pop&&Math.random()<.7)setTimeout(()=>A.pop(eng&&eng.P.pop||0),90);if(eng.P.tb)A.bov(.6)},
  /* exhaust crackle */
  pop(a=.5){if(!c||!eng)return;const n=c.currentTime,b=c.createBufferSource(),h=c.createBiquadFilter(),q=c.createGain(),o=c.createOscillator(),og=c.createGain();b.buffer=nb;h.type='bandpass';h.frequency.value=900+Math.random()*1400;h.Q.value=1.4;
   q.gain.setValueAtTime(.06*a,n);q.gain.exponentialRampToValueAtTime(.001,n+.11);b.connect(h);h.connect(q);q.connect(mst);b.start(n,Math.random());b.stop(n+.13);
   o.type='sine';o.frequency.setValueAtTime(150,n);o.frequency.exponentialRampToValueAtTime(55,n+.08);og.gain.setValueAtTime(.05*a,n);og.gain.exponentialRampToValueAtTime(.001,n+.09);o.connect(og);og.connect(mst);o.start(n);o.stop(n+.1)},
  /* turbo blow-off valve: a short, airy chuff */
  bov(a=.6){if(!c)return;const n=c.currentTime,b=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();b.buffer=nb;f.type='bandpass';f.Q.value=1.1;f.frequency.setValueAtTime(5200,n);f.frequency.exponentialRampToValueAtTime(1500,n+.32);
   g.gain.setValueAtTime(.001,n);g.gain.linearRampToValueAtTime(.06*a,n+.015);g.gain.exponentialRampToValueAtTime(.001,n+.36);b.connect(f);f.connect(g);g.connect(mst);b.start(n,Math.random());b.stop(n+.4)},
  /* ---- horn: hold to sound, releases with its own tail ---- */
  horn(on,vkey){if(!ctx())return;const n=c.currentTime;
   if(!on){if(hornV){const h=hornV;hornV=null;h.g.gain.cancelScheduledValues(n);h.g.gain.setTargetAtTime(0,n,h.H.r);setTimeout(()=>{for(const o of h.os)try{o.stop()}catch(e){}},700)}return}
   if(hornV)return;const H=HN[(VS[vkey]||VS.sedan)[1]]||HN.car;hornV=A.honkVoice(H,0,1);hornV.H=H},
  honkVoice(H,pan,gain){const g=c.createGain(),bp=c.createBiquadFilter(),lp=c.createBiquadFilter(),sh=c.createWaveShaper(),sp=c.createStereoPanner?c.createStereoPanner():null,os=[],n=c.currentTime;
   bp.type='peaking';bp.frequency.value=1700;bp.Q.value=.9;bp.gain.value=6;lp.type='lowpass';lp.frequency.value=2300;lp.Q.value=.5;sh.curve=curve(.9);g.gain.setValueAtTime(0,n);g.gain.linearRampToValueAtTime(H.g*gain,n+H.a);
   const mix=c.createGain();for(const f of H.t){const o=c.createOscillator();o.setPeriodicWave(hornWave(H.air));o.frequency.value=f*(1+(Math.random()-.5)*.012);o.connect(mix);o.start(n);os.push(o)}
   if(H.bz){const lf=c.createOscillator(),lg=c.createGain();lf.frequency.value=H.bz;lg.gain.value=.1;lf.connect(lg);lg.connect(g.gain);lf.start(n);os.push(lf)}
   if(H.air){const q=noise('bandpass',1200,.8);q.g.gain.value=.01*gain;os.push(q.s)}
   mix.connect(sh);sh.connect(bp);bp.connect(lp);lp.connect(g);if(sp){sp.pan.value=pan;g.connect(sp);sp.connect(mst)}else g.connect(mst);return{g,os,H}},
  /* a short honk from traffic, panned and attenuated by where the car is */
  honk(vkey,pan,gain,dur=.35){if(!ctx())return;const H=HN[(VS[vkey]||VS.sedan)[1]]||HN.car,h=A.honkVoice(H,clamp(pan,-1,1),clamp(gain,0,1)*.8),n=c.currentTime;
   h.g.gain.setTargetAtTime(0,n+dur,H.r);setTimeout(()=>{for(const o of h.os)try{o.stop()}catch(e){}},dur*1000+900)},
  /* ---- nitro: purge hiss, ignition thump and a rising turbine ---- */
  nitro(on){if(!ctx())return;const n=c.currentTime;if(!on)return;const b=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),o=c.createOscillator(),og=c.createGain();
   b.buffer=nb;f.type='highpass';f.frequency.setValueAtTime(2500,n);f.frequency.linearRampToValueAtTime(7000,n+.5);g.gain.setValueAtTime(.001,n);g.gain.linearRampToValueAtTime(.07,n+.03);g.gain.exponentialRampToValueAtTime(.001,n+.6);b.connect(f);f.connect(g);g.connect(mst);b.start(n,Math.random());b.stop(n+.65);
   o.type='sine';o.frequency.setValueAtTime(110,n);o.frequency.exponentialRampToValueAtTime(34,n+.35);og.gain.setValueAtTime(.16,n);og.gain.exponentialRampToValueAtTime(.001,n+.4);o.connect(og);og.connect(mst);o.start(n);o.stop(n+.45)},
  /* ---- impacts ---- */
  crash(sev=1){if(!ctx())return;const n=c.currentTime,b=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();b.buffer=nb;f.type='lowpass';f.frequency.setValueAtTime(5200,n);f.frequency.exponentialRampToValueAtTime(260,n+1.1);g.gain.setValueAtTime(.24*sev,n);g.gain.exponentialRampToValueAtTime(.001,n+1.2);b.connect(f);f.connect(g);g.connect(mst);b.start(n,Math.random());b.stop(n+1.3);
   [180,420,760,1330].forEach((fr,i)=>{const o=c.createOscillator(),q=c.createGain();o.type='square';o.frequency.value=fr*(1+Math.random()*.2);q.gain.setValueAtTime(.02*sev,n+i*.012);q.gain.exponentialRampToValueAtTime(.001,n+.25+i*.05);o.connect(q);q.connect(mst);o.start(n);o.stop(n+.5)});
   const o=c.createOscillator(),og=c.createGain();o.type='sine';o.frequency.setValueAtTime(95,n);o.frequency.exponentialRampToValueAtTime(28,n+.6);og.gain.setValueAtTime(.28*sev,n);og.gain.exponentialRampToValueAtTime(.001,n+.7);o.connect(og);og.connect(mst);o.start(n);o.stop(n+.8);
   const h=c.createBufferSource(),hf=c.createBiquadFilter(),hg=c.createGain();h.buffer=nb;hf.type='highpass';hf.frequency.value=4200;hg.gain.setValueAtTime(.06*sev,n+.02);hg.gain.exponentialRampToValueAtTime(.001,n+.6);h.connect(hf);hf.connect(hg);hg.connect(mst);h.start(n,Math.random());h.stop(n+.7)},
  bump(){if(!ctx())return;const n=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(160,n);o.frequency.exponentialRampToValueAtTime(60,n+.12);g.gain.setValueAtTime(.12,n);g.gain.exponentialRampToValueAtTime(.001,n+.15);o.connect(g);g.connect(mst);o.start(n);o.stop(n+.2);A.scrape(.25)},
  scrape(d=.3){if(!c||!ns.scr)return;ramp(ns.scr.g.gain,.035,.01);setTimeout(()=>{if(c&&ns.scr)ramp(ns.scr.g.gain,0,.08)},d*1000)},
  /* ---- weather ---- */
  thunder(delay=0,pow=1){if(!ctx())return;const n=c.currentTime+delay,b=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();b.buffer=nb;f.type='lowpass';f.frequency.setValueAtTime(900,n);f.frequency.exponentialRampToValueAtTime(70,n+3);
   g.gain.setValueAtTime(.001,n);g.gain.linearRampToValueAtTime(.3*pow,n+.08);g.gain.exponentialRampToValueAtTime(.07*pow,n+.9);g.gain.exponentialRampToValueAtTime(.001,n+3.2);b.connect(f);f.connect(g);g.connect(mst);b.start(n,Math.random());b.stop(n+3.4)},
  /* ---- sirens ---- */
  siren(kind,gain=.1,pan=0){if(!c)return;if(!kind){if(sirV){const s=sirV;sirV=null;ramp(s.g.gain,0,.05);setTimeout(()=>{try{s.o.stop()}catch(e){}},300)}return}
   if(!sirV){const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter(),p=c.createStereoPanner?c.createStereoPanner():null;o.type='square';f.type='lowpass';f.frequency.value=2600;g.gain.value=0;o.connect(f);f.connect(g);if(p){g.connect(p);p.connect(mst)}else g.connect(mst);o.start();sirV={o,g,p}}
   const t=c.currentTime,fr=kind===1?900+420*Math.sin(t*5.2)+120*Math.sin(t*11):(t*1.9%1<.5?640:850);sirV.o.frequency.setTargetAtTime(fr,t,.02);ramp(sirV.g.gain,gain*.028,.05);if(sirV.p)sirV.p.pan.value=clamp(pan,-1,1)},
  /* ---- traffic pass-bys: list of {k kind, d metres ahead (negative behind), vr closing speed m/s, x lateral metres from the player, s speed} ---- */
  npc(list){if(!c||!eng)return;const n=c.currentTime;list=list.filter(q=>Math.abs(q.d)<110).sort((a,b)=>Math.abs(a.d)-Math.abs(b.d)).slice(0,3);
   while(ntv.length<3){const g=c.createGain(),lp=c.createBiquadFilter(),p=c.createStereoPanner?c.createStereoPanner():null,o=c.createOscillator();lp.type='lowpass';lp.frequency.value=1800;g.gain.value=0;o.frequency.value=40;o.connect(lp);lp.connect(g);if(p){g.connect(p);p.connect(mst)}else g.connect(mst);o.start();ntv.push({o,g,lp,p,k:''})}
   let who=0;
   ntv.forEach((v,i)=>{const q=list[i];if(!q){ramp(v.g.gain,0,.08);return}const key=(VS[q.k]||VS.sedan)[0],P=EP[key];
    if(v.k!==key){v.k=key;v.o.setPeriodicWave(waveOf(key))}
    const dop=343/(343-clamp(q.vr,-70,70)),rp=P.idle+(P.red-P.idle)*clamp(q.s/45,0,1)*.55,att=1/Math.pow(1+Math.abs(q.d)/9,1.25);
    v.o.frequency.setTargetAtTime(rp/120*dop,n,.04);v.lp.frequency.setTargetAtTime(400+Math.min(P.f1,2600)*.3*att,n,.05);ramp(v.g.gain,att*P.vol*.05,.05);if(v.p)v.p.pan.value=clamp(q.x/10,-1,1);
    if(Math.abs(q.d)<16)who=Math.max(who,(1-Math.abs(q.d)/16)*clamp(Math.abs(q.vr)/45,0,1))});
   ramp(ns.hiss.g.gain,Math.max(who*.03,eng.nit?.012:0),.06)},
  dispose(){A.stop();if(c){for(const k in ns)try{ns[k].s.stop()}catch(e){}for(const v of ntv)try{v.o.stop()}catch(e){}try{c.close()}catch(e){}c=null}}};
 return A}
