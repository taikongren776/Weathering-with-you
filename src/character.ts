import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { smooth } from './timeline';
export interface Character {
  present:boolean;
  info:string;
  update:(time:number)=>void;
}
export async function loadCharacter(scene:THREE.Scene,onProgress:(fraction:number)=>void):Promise<Character>{
  const files=import.meta.glob('/public/models/*.glb',{eager:true,query:'?url',import:'default'});
  const file=Object.entries(files).find(([path])=>path.endsWith('/hina.glb'));
  if(!file){onProgress(1);return {present:false,info:'环境预演 · 阳菜模型待接入',update:()=>{}};}
  const gltf=await new GLTFLoader().loadAsync(file[1] as string,event=>onProgress(event.total?event.loaded/event.total:.5));
  const model=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  if(size.y<=0)throw new Error('角色模型尺寸无效');
  model.scale.multiplyScalar(1.58/size.y);
  const normalized=new THREE.Box3().setFromObject(model),center=normalized.getCenter(new THREE.Vector3());
  model.position.set(-center.x,-normalized.min.y+.26,-3-center.z);
  const bones=new Map<string,THREE.Bone>();
  const morphs:{mesh:THREE.Mesh,index:number}[]=[];
  model.traverse(node=>{
    if(node instanceof THREE.Bone)bones.set(node.name.replace(/mixamorig[:_]?/i,'').toLowerCase(),node);
    if(node instanceof THREE.Mesh){
      node.castShadow=true;node.receiveShadow=true;
      if(node.morphTargetDictionary) for(const [name,index] of Object.entries(node.morphTargetDictionary)){
        if(/^(blink|eyesclosed|eyeBlinkLeft|eyeBlinkRight)$/i.test(name))morphs.push({mesh:node,index});
      }
    }
  });
  scene.add(model);
  const base=new Map<THREE.Bone,THREE.Quaternion>();bones.forEach(b=>base.set(b,b.quaternion.clone()));
  function rotate(name:string,axis:THREE.Vector3,angle:number){
    const b=bones.get(name.toLowerCase());if(b)b.quaternion.copy(base.get(b)!).multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle));
  }
  const x=new THREE.Vector3(1,0,0),z=new THREE.Vector3(0,0,1);
  return {present:true,info:`角色已加载 · ${bones.size} 根骨骼 · 动画待逐镜验收`,update(t:number){
    const p=smooth(28,35,t),breath=Math.sin(t*1.9)*.012;
    rotate('Spine',x,breath);rotate('Head',x,.06+p*.12);
    rotate('LeftArm',z,-1.13+p*.64);rotate('RightArm',z,1.13-p*.64);
    rotate('LeftForeArm',x,-p*1.65);rotate('RightForeArm',x,-p*1.65);
    for(const side of ['Left','Right'])for(const finger of ['Thumb','Index','Middle','Ring','Pinky'])for(let i=1;i<=3;i++)rotate(side+'Hand'+finger+i,z,(side==='Left'?1:-1)*.08*p);
    morphs.forEach(({mesh,index})=>{if(mesh.morphTargetInfluences)mesh.morphTargetInfluences[index]=smooth(28,32,t);});
  }};
}

