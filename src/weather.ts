import * as THREE from 'three';
import {seeded} from './environment';
import { WATER_HEIGHT } from './water';
import type { Water } from './water';

export function createRain(scene:THREE.Scene,mobile:boolean,water:Water) {
  const count=mobile?1800:5500,random=seeded(516);
  const positions=new Float32Array(count*6),speeds=new Float32Array(count*2),ends=new Float32Array(count*2);
  for(let i=0;i<count;i++){
    const x=(random()-.5)*100,y=random()*55,z=(random()-.5)*100;
    positions.set([x,y,z,x,y,z],i*6);
    speeds[i*2]=speeds[i*2+1]=.7+random()*.6;ends[i*2+1]=.35+random()*.55;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('aSpeed',new THREE.BufferAttribute(speeds,1));
  geometry.setAttribute('aEnd',new THREE.BufferAttribute(ends,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uRain:{value:1}},
    vertexShader:`attribute float aSpeed;attribute float aEnd;uniform float uTime;varying float vFade;
    void main(){vec3 p=position;p.y=mod(p.y-uTime*20.*aSpeed,55.)-5.+aEnd;p.x+=aEnd*.13+sin(uTime*.3)*p.y*.035;
    vec4 mv=modelViewMatrix*vec4(p,1.);vFade=clamp(1.-length(mv.xyz)/95.,0.,1.);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uRain;varying float vFade;void main(){gl_FragColor=vec4(.68,.83,.91,vFade*.23*uRain);}`
  });
  const rain=new THREE.LineSegments(geometry,material);rain.frustumCulled=false;scene.add(rain);
  // Tiny ballistic droplets, sharing the exact impact timing used by the water shader.
  const splashPositions=new Float32Array(water.count*5*3),alpha=new Float32Array(water.count*5);
  const splashGeometry=new THREE.BufferGeometry();
  const positionAttribute=new THREE.BufferAttribute(splashPositions,3).setUsage(THREE.DynamicDrawUsage);
  const alphaAttribute=new THREE.BufferAttribute(alpha,1).setUsage(THREE.DynamicDrawUsage);
  splashGeometry.setAttribute('position',positionAttribute);splashGeometry.setAttribute('aAlpha',alphaAttribute);
  const splashMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:`attribute float aAlpha;varying float vAlpha;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vAlpha=aAlpha;gl_PointSize=clamp(24./max(-mv.z,1.),.7,2.3);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float soft=1.-smoothstep(.12,.5,d);gl_FragColor=vec4(.66,.78,.8,vAlpha*soft);}`
  });
  const splashes=new THREE.Points(splashGeometry,splashMaterial);splashes.frustumCulled=false;scene.add(splashes);
  return {update(t:number,intensity:number){
    material.uniforms.uTime.value=t;material.uniforms.uRain.value=intensity;rain.visible=intensity>.001;
    water.update(t,intensity);splashes.visible=intensity>.001;
    for(let i=0;i<water.count;i++){
      const hit=water.impacts[i],age=hit.z;
      for(let j=0;j<5;j++){
        const index=i*5+j,angle=j*2.399+i*1.73,velocity=.42+j*.045;
        const active=age<.17&&hit.w>0;
        const r=age*(.16+j*.025);
        splashPositions.set([hit.x+Math.cos(angle)*r,WATER_HEIGHT+Math.max(0,velocity*age-3.4*age*age),hit.y+Math.sin(angle)*r],index*3);
        alpha[index]=active?Math.max(0,1-age/.17)*hit.w*.38:0;
      }
    }
    positionAttribute.needsUpdate=true;alphaAttribute.needsUpdate=true;
  }};
}

