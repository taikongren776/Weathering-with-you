import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createSky } from './sky';
import { createEnvironment } from './environment';
import { createRain } from './weather';
import { loadCharacter } from './character';
import type { Character } from './character';
import { clamp, smooth, weatherAt } from './timeline';

const positions=[
 [-40,24,70], [9,6.2,22], [.5,2.7,6], [.9,1.5,-.8], [2.2,1.75,-3.8], [3,5,1], [25,19,40]
].map(p=>new THREE.Vector3(...p));
const targets=[
 [0,1.8,0], [0,2,0], [0,1.8,-3], [0,1.3,-3], [0,1.4,-3], [-30,58,-85], [0,8,-15]
].map(p=>new THREE.Vector3(...p));
const environmentTargets=[
 [0,2,0], [0,2,0], [0,3.9,0], [0,2,-8.3], [0,2.7,-8.3], [-30,58,-85], [0,8,-15]
].map(p=>new THREE.Vector3(...p));
/** C1-continuous Hermite curve with bounded tangents at sharply changing shots. */
function sample(points:THREE.Vector3[],t:number,out:THREE.Vector3){
  const f=clamp(t/10,0,6),i=Math.min(5,Math.floor(f)),u=f-i;
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(6,i+2)];
  const m1=p2.clone().sub(p0).multiplyScalar(.25),m2=p3.clone().sub(p1).multiplyScalar(.25);
  out.copy(p1).multiplyScalar(2*u*u*u-3*u*u+1).addScaledVector(m1,u*u*u-2*u*u+u).addScaledVector(p2,-2*u*u*u+3*u*u).addScaledVector(m2,u*u*u-u*u);
}
export class Cinema {
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.PerspectiveCamera(44,2.39,.08,2300);
  readonly renderer:THREE.WebGLRenderer;
  private composer:EffectComposer;
  private sky:ReturnType<typeof createSky>;
  private environment:ReturnType<typeof createEnvironment>;
  private rain:ReturnType<typeof createRain>;
  private sun=new THREE.DirectionalLight('#d1e0ef',2.3);
  private ambient=new THREE.HemisphereLight('#b5cee1','#36434b',2.15);
  private bloom:UnrealBloomPass;
  private grade:ShaderPass;
  private target=new THREE.Vector3();
  private char:Character={present:false,info:'',update:()=>{}};
  private mobile=matchMedia('(max-width: 800px)').matches;
  private resizeObserver:ResizeObserver;
  private width=0;private height=0;private tier=1;
  private frames=0;private ms=0;private last=0;private lowRuns=0;
  fps=0;
  lastTime=0;
  constructor(private container:HTMLElement){
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.25:1.5));
    this.renderer.info.autoReset=false;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.12;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-label','楼顶鸟居与东京城市的实时三维场景');
    container.prepend(this.renderer.domElement);
    this.scene.fog=new THREE.FogExp2('#667d8e',.006);
    this.scene.add(this.ambient);
    this.sun.position.set(-35,60,-45);this.sun.castShadow=true;
    this.sun.shadow.mapSize.set(this.mobile?1024:2048,this.mobile?1024:2048);
    this.sun.shadow.camera.left=-22;this.sun.shadow.camera.right=22;this.sun.shadow.camera.top=22;this.sun.shadow.camera.bottom=-22;this.sun.shadow.camera.far=160;
    this.sun.shadow.normalBias=.035;this.sun.shadow.bias=-.00015;this.scene.add(this.sun);
    this.sky=createSky(this.scene);this.environment=createEnvironment(this.scene,this.mobile);this.rain=createRain(this.scene,this.mobile);
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(1000,420),.17,.6,1.05);this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uTime:{value:0},uWarm:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform sampler2D tDiffuse;uniform float uTime;uniform float uWarm;
    void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float v=pow(vUv.x*(1.-vUv.x)*vUv.y*(1.-vUv.y)*16.,.16);
      c*=mix(.75,1.,v);c*=mix(vec3(.94,1.,1.04),vec3(1.035,1.01,.97),uWarm);
      float grain=fract(sin(dot(vUv+fract(uTime),vec2(12.9898,78.233)))*43758.5453);
      c+=(grain-.5)*.012;gl_FragColor=vec4(c,1.);}`});
    this.composer.addPass(this.grade);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
  }
  get characterPresent(){return this.char.present;}
  get info(){return this.char.info;}
  async load(progress:(fraction:number)=>void){this.char=await loadCharacter(this.scene,progress);await this.renderer.compileAsync(this.scene,this.camera);}
  resize(){
    const rect=this.container.getBoundingClientRect();this.width=Math.max(1,Math.round(rect.width));this.height=Math.max(1,Math.round(rect.height));
    this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width,this.height,false);this.composer.setSize(this.width,this.height);
  }
  render(t:number,poster=false){
    this.lastTime=t;const w=weatherAt(t);
    if(poster){this.camera.position.set(18,7.8,26);this.target.set(-1,5.6,-9);this.camera.fov=46;}
    else{
      sample(positions,t,this.camera.position);sample(this.char.present?targets:environmentTargets,t,this.target);
      const close=smooth(20,28,t)*(1-smooth(39,45,t));this.camera.fov=44-close*9;
    }
    this.camera.lookAt(this.target);this.camera.updateProjectionMatrix();
    const sun=poster?.26:w.sunshine;
    this.sun.intensity=THREE.MathUtils.lerp(1.2,4.2,sun);this.sun.color.set('#b5cde3').lerp(new THREE.Color('#ffd394'),sun);
    this.ambient.intensity=THREE.MathUtils.lerp(1.8,2.4,sun);
    const fog=this.scene.fog as THREE.FogExp2;fog.color.set('#677e8e').lerp(new THREE.Color('#ced6ca'),sun);fog.density=THREE.MathUtils.lerp(.0063,.0031,sun);
    this.renderer.toneMappingExposure=THREE.MathUtils.lerp(1.08,1.14,sun);this.bloom.strength=.16+sun*.18;
    this.sky.update(t,sun);this.environment.update(t);this.rain.update(t,poster?.8:w.rain);this.char.update(t);
    this.grade.uniforms.uTime.value=t;this.grade.uniforms.uWarm.value=sun;
    this.renderer.info.reset();this.composer.render();
  }
  measure(now:number){
    if(this.last&&now-this.last<250){this.frames++;this.ms+=now-this.last;}
    this.last=now;
    if(this.ms>2000){
      this.fps=Math.round(this.frames*1000/this.ms);this.frames=0;this.ms=0;
      if(this.fps<27)this.lowRuns++;else this.lowRuns=0;
      if(this.lowRuns>=2&&this.tier>.55){this.tier-=.15;this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.25:1.5)*this.tier);this.composer.setPixelRatio(this.renderer.getPixelRatio());this.resize();this.lowRuns=0;}
    }
  }
  dispose(){this.resizeObserver.disconnect();this.environment.reflector.getRenderTarget().dispose();this.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});this.composer.dispose();this.renderer.dispose();}
}




