import * as THREE from 'three';
import {seeded} from './environment';
export function createRain(scene:THREE.Scene,mobile:boolean) {
  const count=mobile?1800:5500,random=seeded(516);
  const positions=new Float32Array(count*6),speeds=new Float32Array(count*2);
  for(let i=0;i<count;i++){
    const x=(random()-.5)*100,y=random()*55,z=(random()-.5)*100;
    positions.set([x,y,z,x+.07,y+.5+random()*.4,z],i*6);speeds[i*2]=speeds[i*2+1]=.7+random()*.6;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('aSpeed',new THREE.BufferAttribute(speeds,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uRain:{value:1}},
    vertexShader:`attribute float aSpeed;uniform float uTime;varying float vFade;
    void main(){vec3 p=position;p.y=mod(p.y-uTime*20.*aSpeed,55.)-5.;p.x+=sin(uTime*.3)*p.y*.035;
    vec4 mv=modelViewMatrix*vec4(p,1.);vFade=clamp(1.-length(mv.xyz)/95.,0.,1.);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uRain;varying float vFade;void main(){gl_FragColor=vec4(.68,.83,.91,vFade*.30*uRain);}`
  });
  const rain=new THREE.LineSegments(geometry,material);rain.frustumCulled=false;scene.add(rain);
  // Thin expanding rings on the rooftop.
  const rings=new THREE.InstancedMesh(new THREE.RingGeometry(.88,1,24),new THREE.MeshBasicMaterial({color:'#a3c2ca',transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide}),mobile?40:110);
  const seeds=Array.from({length:rings.count},()=>({x:(random()-.5)*22,z:(random()-.5)*28,phase:random()}));
  const dummy=new THREE.Object3D();scene.add(rings);
  return {update(t:number,intensity:number){
    material.uniforms.uTime.value=t;material.uniforms.uRain.value=intensity;rain.visible=intensity>.001;rings.visible=intensity>.001;
    (rings.material as THREE.MeshBasicMaterial).opacity=.2*intensity;
    seeds.forEach((s,i)=>{const phase=(t*.65+s.phase)%1;dummy.position.set(s.x,.175,s.z);dummy.rotation.set(-Math.PI/2,0,0);const r=.04+phase*.45;dummy.scale.set(r,r,r);dummy.updateMatrix();rings.setMatrixAt(i,dummy.matrix);});rings.instanceMatrix.needsUpdate=true;
  }};
}

