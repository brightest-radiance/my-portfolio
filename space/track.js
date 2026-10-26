/* Road geometry for Stellar Drive. Gameplay stays in straight lane space (lane x, distance d); the renderer bends the world with these
   tables so the road curves left and right and rolls over hills. Everything here is pure maths, so it is cheap and deterministic. */
const H=(a,b)=>{let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
const bump=t=>{t=Math.abs(t);if(t>=1)return 0;t=1-t*t;return t*t};
const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
export const N=48,DU=12,CS=560,HS=760;           /* table: N samples every DU metres, so 564 m of road ahead */
const cache=new Map();
function cell(n,kind){const key=n*2+kind;let c=cache.get(key);if(!c){const cs=kind?HS:CS,r=k=>H(n*7+kind*131+k,9173+kind);
 c={c:n*cs+cs*(.2+.5*r(1)),w:cs*(.2+.17*r(2)),a:(r(3)<.5?-1:1)*(kind?.018+.026*r(4):1/(270+480*r(4)))};if(cache.size>600)cache.clear();cache.set(key,c)}return c}
function sum(s,kind){const cs=kind?HS:CS,n=Math.floor(s/cs);let t=0;for(let i=n-1;i<=n+1;i++){const c=cell(i,kind);t+=c.a*bump((s-c.c)/c.w)}return t}
export const curv=s=>sum(s,0)*sm(260,1700,s);     /* 1/m, positive turns right */
export const grade=s=>sum(s,1)*sm(500,2300,s);    /* dy/ds */
/* fill(s0,out): out[j*4..] = lateral offset, height, lateral slope, height slope of the road j*DU metres ahead, relative to the car */
export function fill(s0,out){const g0=grade(s0),h=3;let th=0,x=0,y=0,u=0;out[0]=out[1]=out[2]=out[3]=0;
 for(let j=1;j<N;j++){for(let q=0;q<DU/h;q++){const s=s0+u+h/2,k=curv(s),g=grade(s)-g0;x+=(th+k*h/2)*h;th+=k*h;y+=g*h;u+=h}
  out[j*4]=x;out[j*4+1]=y;out[j*4+2]=th;out[j*4+3]=grade(s0+u)-g0}
 return{k0:curv(s0),r0:(grade(s0+1)-grade(s0-1))/2,g0}}
/* sample the filled table on the CPU (cameras, look-ahead): returns [x,y] at u metres ahead */
export function off(t,u){if(u<=0)return[0,0];const f=Math.min(u/DU,N-1.001),i=f|0,a=i*4,b=a+4,s=f-i,s2=s*s,s3=s2*s,h=DU;
 const p=(2*s3-3*s2+1),q=(s3-2*s2+s)*h,r=(-2*s3+3*s2),w=(s3-s2)*h;return[p*t[a]+q*t[a+2]+r*t[b]+w*t[b+2],p*t[a+1]+q*t[a+3]+r*t[b+1]+w*t[b+3]]}
