import * as THREE from 'three';

/** Shared world-space puddles and impacts. All effects use absolute film time. */
export const WATER_HEIGHT = .171;
export const IMPACT_LIFETIME = 1.45;
const fract=(x:number)=>x-Math.floor(x);
const hash=(x:number,y:number)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453123);
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function noise(x:number,y:number){
  const ix=Math.floor(x),iy=Math.floor(y),fx=fract(x),fy=fract(y),u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;
}
export function puddleAt(x:number,z:number){
  const n=noise(x*.48,z*.48)*.66+noise(x*1.34+9,z*1.34+9)*.24+noise(x*3.3,z*3.3)*.1;
  return smooth(.43,.63,n);
}
/** Ground-only impacts: avoid raised paving, props and building footprints. */
export function exposedGround(x:number,z:number){
  if(Math.abs(x)>10.8||Math.abs(z)>13.6)return false;
  if(Math.abs(x)<1.1&&z>-.2&&z<11.7)return false;
  if(Math.abs(x)<2.65&&z>-3.3&&z<1.1)return false;
  if(Math.abs(x)<1.9&&z< -6.4)return false;
  if(x< -5.1&&z< -6.5)return false;
  if(x>6.5&&z<-.1)return false;
  if(Math.abs(Math.abs(x)-4.2)<.75&&Math.abs(z+4.3)<.75)return false;
  return true;
}
export interface Impact { x:number; z:number; age:number; strength:number; }
export function impactAt(channel:number,time:number,rain:number):Impact{
  const period=2.25+hash(channel,87)*1.75, shifted=Math.max(0,time)+hash(channel,23)*period;
  const cycle=Math.floor(shifted/period),age=shifted-cycle*period;
  const seed=channel*97+cycle*7919;
  let x=0,z=0,found=false;
  for(let attempt=0;attempt<48;attempt++){
    x=(hash(seed+attempt,17)-.5)*21.6;z=(hash(seed+attempt,61)-.5)*27;
    if(exposedGround(x,z)&&puddleAt(x,z)>.48){found=true;break;}
  }
  const strength=found&&age<IMPACT_LIFETIME?(0.5+hash(seed,31)*.5)*Math.max(0,Math.min(1,rain)):0;
  return {x,z,age,strength};
}
export const puddleGLSL = `
uniform sampler2D uWetMap;
float puddleMask(vec2 p){return texture2D(uWetMap,vec2(p.x/23.+.5,.5-p.y/29.)).r;}
`;
export function createWater(mobile:boolean){
  const count=mobile?20:40;
  const impacts=Array.from({length:count},()=>new THREE.Vector4(0,0,10,0));
  const resolution=256,pixels=new Uint8Array(resolution*resolution);
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++)pixels[y*resolution+x]=Math.round(255*puddleAt((x+.5)/resolution*23-11.5,14.5-(y+.5)/resolution*29));
  const texture=new THREE.DataTexture(pixels,resolution,resolution,THREE.RedFormat);
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  const uniforms={uImpacts:{value:impacts},uWaterTime:{value:0},uWetMap:{value:texture}};
  return {count,impacts,uniforms,texture,update(time:number,rain:number){
    uniforms.uWaterTime.value=time;
    for(let i=0;i<count;i++){const p=impactAt(i,time,rain);impacts[i].set(p.x,p.z,p.age,p.strength);}
  }};
}
export type Water=ReturnType<typeof createWater>;
export function waterFragment(count:number){return `
varying vec2 vWaterPosition;
uniform vec4 uImpacts[${count}];
uniform float uWaterTime;
${puddleGLSL}
vec2 waterSlope(vec2 p){
 vec2 gradient=vec2(0.);
 for(int i=0;i<${count};i++){
  vec4 hit=uImpacts[i];
  if(hit.w<.001||hit.z>1.45)continue;
  vec2 delta=p-hit.xy;float distanceToHit=length(delta);
  float radius=.015+hit.z*(.29+hit.w*.10);
  if(distanceToHit>radius+.12)continue;
  float front=distanceToHit-radius;
  float envelope=exp(-pow(front/(.018+hit.z*.018),2.));
  float life=smoothstep(0.,.055,hit.z)*(1.-smoothstep(.18,1.45,hit.z));
  float irregular=.8+.2*sin(atan(delta.y,delta.x)*4.+float(i)*2.1);
  float wave=cos(front*135.)*envelope;
  // A weaker trailing capillary wave, already decaying behind the first front.
  float trail=front+.065;
  wave+=cos(trail*135.)*exp(-pow(trail/.025,2.))*.25;
  gradient+=delta/max(distanceToHit,.008)*wave*life*irregular*hit.w*.14;
 }
 return gradient;
}
`;}

