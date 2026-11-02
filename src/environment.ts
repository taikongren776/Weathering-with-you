import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createWater, waterFragment } from './water';
import { surface, addRoofDetails } from './details';

export function seeded(seed=7319) {return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const v3=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
function material(color:THREE.ColorRepresentation,roughness=.8){return new THREE.MeshStandardMaterial({color,roughness});}
export function createEnvironment(scene:THREE.Scene, mobile:boolean) {
  const random=seeded(), root=new THREE.Group();scene.add(root);
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const stone=surface('stone','#778383'), rim=surface('stone','#697477'), iron=surface('metal','#45595c',.62), red=surface('wood','#b34b38',.62), darkWood=surface('wood','#4b483b'), gold=material('#b49a61',.4);
  const meshes:THREE.Mesh[]=[];
  function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,parent:THREE.Object3D=root,rounded=false){
    const mesh=new THREE.Mesh(rounded?new RoundedBoxGeometry(w,h,d,2,.055):boxGeo,mat);
    if(!rounded)mesh.scale.set(w,h,d);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);meshes.push(mesh);return mesh;
  }
  function tube(points:THREE.Vector3[],radius:number,mat:THREE.Material,parent:THREE.Object3D=root){
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,radius,6,false),mat);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  // A low-rise Tokyo street grid with a denser high-rise horizon.
  const city=new THREE.Group();scene.add(city);
  const blocks: {x:number,z:number,w:number,d:number,h:number}[]=[];
  for(let ix=-17;ix<=17;ix++)for(let iz=-17;iz<=17;iz++){
    const x=ix*18+(random()-.5)*5,z=iz*18+(random()-.5)*5;
    if(Math.abs(x)<20&&Math.abs(z)<25)continue;
    const distance=Math.hypot(x,z);
    let h=8+Math.pow(random(),2)*38;
    if(distance>130&&random()>.82)h+=35+random()*38;
    if(distance<75)h=Math.min(h,28); if(distance<140)h=Math.min(h,40);
    blocks.push({x,z,w:8+random()*6,d:8+random()*6,h});
  }
  // Each facade gets an inexpensive per-fragment window grid; all blocks share one draw call.
  const cityMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.83,metalness:.05});
  cityMat.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCityPosition; varying vec3 vCityNormal;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vCityNormal=normal; vec4 cp=vec4(position,1.);
      #ifdef USE_INSTANCING
      cp=instanceMatrix*cp;
      #endif
      vCityPosition=(modelMatrix*cp).xyz;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCityPosition; varying vec3 vCityNormal;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      if(abs(vCityNormal.y)<.5){
        vec2 facade=vec2(abs(vCityNormal.x)>.5?vCityPosition.z:vCityPosition.x,vCityPosition.y+34.);
        vec2 cell=fract(facade/vec2(2.,2.7));
        float win=step(.16,cell.x)*step(cell.x,.72)*step(.23,cell.y)*step(cell.y,.76);
        float id=fract(sin(dot(floor(facade/vec2(2.,2.7)),vec2(12.98,78.23)))*43758.5453);
        diffuseColor.rgb*=mix(1.,.24,win);
        diffuseColor.rgb+=vec3(.35,.29,.16)*win*step(.82,id);
        float floorLine=step(.96,cell.y);diffuseColor.rgb*=1.-floorLine*.18;
      }`);
  };
  const buildings=new THREE.InstancedMesh(boxGeo,cityMat,blocks.length);buildings.receiveShadow=true;
  const dummy=new THREE.Object3D(), color=new THREE.Color();
  blocks.forEach((b,i)=>{
    dummy.position.set(b.x,b.h/2-34,b.z);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();buildings.setMatrixAt(i,dummy.matrix);
    color.setHSL(.55+random()*.07,.08+random()*.13,.32+random()*.23);buildings.setColorAt(i,color);
  });
  city.add(buildings);
  const roofDetails=new THREE.InstancedMesh(boxGeo,material('#687477'),blocks.length*2);
  blocks.forEach((b,i)=>{
    dummy.position.set(b.x,b.h-33,b.z);dummy.scale.set(b.w*.4,1.5,b.d*.38);dummy.updateMatrix();roofDetails.setMatrixAt(i*2,dummy.matrix);
    dummy.position.set(b.x+b.w*.3,b.h-32.4,b.z-b.d*.3);dummy.scale.set(1.4,3,1.4);dummy.updateMatrix();roofDetails.setMatrixAt(i*2+1,dummy.matrix);
  });city.add(roofDetails);
  box(1000,.4,1000,0,-34.3,0,material('#263a43'),city);
  const roadMat=material('#758388'), streets=new THREE.InstancedMesh(boxGeo,roadMat,70);
  for(let i=0;i<35;i++){
    dummy.position.set((i-17)*18+8,-33.98,0);dummy.scale.set(.13,.02,650);dummy.updateMatrix();streets.setMatrixAt(i*2,dummy.matrix);
    dummy.position.set(0,-33.97,(i-17)*18+8);dummy.scale.set(650,.02,.13);dummy.updateMatrix();streets.setMatrixAt(i*2+1,dummy.matrix);
  }city.add(streets);
  // Distant communication tower and high-rise silhouettes.
  const tower=new THREE.Group();tower.position.set(-115,-34,-185);scene.add(tower);
  const towerMat=material('#8b786d');
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2+Math.PI/4;
    tube([v3(Math.cos(a)*8,0,Math.sin(a)*8),v3(Math.cos(a)*2,60,Math.sin(a)*2),v3(0,96,0)],.45,towerMat,tower);
  }
  for(let y=10;y<72;y+=12)box(16*(1-y/95),.8,16*(1-y/95),0,y,0,towerMat,tower);
  box(8,3,8,0,55,0,material('#778d94'),tower);
  box(.65,20,.65,0,100,0,towerMat,tower);

  // Hero building and weathered rooftop.
  box(24,34,30,0,-17.2,0,material('#697272'));
  box(24.7,.55,30.7,0,-.2,0,rim);
  box(24,.12,30,0,.08,0,stone);
  const crackMat=material('#3e5053');
  for(let i=-5;i<=5;i++)box(.022,.012,30,i*2.2,.148,0,crackMat);
  for(let i=-6;i<=6;i++)box(24,.012,.022,0,.149,i*2.2,crackMat);
  // Concrete curb + old iron fencing.
  for(const side of [-1,1]){
    box(.4,.6,30,side*11.7,.35,0,rim);
    for(let z=-14;z<=14;z+=2)box(.065,1.25,.065,side*11.7,1.2,z,iron);
    box(.06,.06,30,side*11.7,1.55,0,iron);box(.06,.045,30,side*11.7,.92,0,iron);
    box(23,.6,.4,0,.35,side*14.7,rim);
    for(let x=-10;x<=10;x+=2)box(.065,1.25,.065,x,1.2,side*14.7,iron);
    box(23,.06,.06,0,1.55,side*14.7,iron);
  }
  // Stairwell, pipes and roof fixtures.
  const hut=material('#717a75');box(5,3.3,5,-8,1.8,-10,hut);box(5.4,.25,5.4,-8,3.55,-10,rim);
  box(1.5,2.4,.08,-7.5,1.4,-7.45,iron);box(.08,.08,.1,-7,1.3,-7.37,gold);
  for(let i=0;i<5;i++)box(1.9,.14,1.2,-7.5,.18+i*.13,-6.9+i*.2,stone);
  tube([v3(-10.5,.3,-8),v3(-10.5,2.7,-8),v3(-10.5,2.9,-9),v3(-10.5,2.9,-12)],.1,iron);
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,2.5,20),material('#929a91',.42));
  tank.position.set(8,3,-10);tank.castShadow=true;root.add(tank);
  for(const dx of [-.85,.85])for(const dz of [-.85,.85])box(.1,2,.1,8+dx,1,-10+dz,iron);
  for(let i=0;i<3;i++){
    box(1.8,.9,1.2,8,.7,-5+i*2,material('#8b9690'),root,true);
    for(let j=0;j<5;j++)box(1.5,.025,.025,8,.4+j*.13,-4.38+i*2,iron);
  }

  // Stone approach deliberately stays open along the camera path.
  const pathPale=surface('stone','#a0a292',.75),pathDark=surface('stone','#89978b',.75);
  for(let i=0;i<11;i++)box(1.8,.08,.9,(random()-.5)*.08,.21,11-i*1.05,i%2?pathPale:pathDark,root,true);
  box(4.6,.18,3.3,0,.22,-1.1,stone,root,true);
  // Torii: tapered round pillars, curved lintel, black cap, metal footings.
  for(const x of [-2.35,2.35]){
    const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.21,.28,5.3,32),red);
    pillar.position.set(x,2.85,0);pillar.rotation.z=-Math.sign(x)*.025;pillar.castShadow=true;root.add(pillar);
    const foot=new THREE.Mesh(new THREE.CylinderGeometry(.32,.34,.5,16),darkWood);foot.position.set(x,.47,0);root.add(foot);
    box(.78,.22,.78,x,.24,0,rim,root,true);
  }
  box(6.4,.25,.34,0,4.35,0,red,root,true);
  box(.26,1.1,.28,0,4.9,0,red);
  const beamShape=new THREE.Shape();
  beamShape.moveTo(-3.6,5.65);beamShape.quadraticCurveTo(0,5.13,3.6,5.65);beamShape.lineTo(3.7,5.98);beamShape.quadraticCurveTo(0,5.5,-3.7,5.98);beamShape.closePath();
  const beam=new THREE.Mesh(new THREE.ExtrudeGeometry(beamShape,{depth:.57,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,steps:1}),red);beam.position.z=-.285;beam.castShadow=true;root.add(beam);
  tube([v3(-3.8,6.04,0),v3(-2,5.85,0),v3(0,5.78,0),v3(2,5.85,0),v3(3.8,6.04,0)],.14,darkWood);
  box(.58,.82,.12,0,4.86,.27,darkWood,root,true);box(.44,.65,.02,0,4.86,.34,gold);
  // Sacred straw rope and folded paper streamers.
  const straw=material('#b6a17b');tube([v3(-2.25,4.1,.25),v3(-1.1,3.87,.4),v3(0,3.78,.46),v3(1.1,3.87,.4),v3(2.25,4.1,.25)],.055,straw);
  const papers:THREE.Group[]=[];
  for(let i=0;i<5;i++){
    const g=new THREE.Group();g.position.set((i-2)*.78,3.82+Math.abs(i-2)*.06,.45);root.add(g);papers.push(g);
    for(let j=0;j<4;j++){const p=box(.17,.22,.013,(j%2)*.07,-j*.16,0,material('#e7e6ce'),g);p.rotation.z=j%2?.38:-.38;}
  }

  // Small rooftop shrine framed by two warm stone lanterns.
  const shrine=new THREE.Group();shrine.position.set(0,.15,-8.3);root.add(shrine);
  box(3.3,.3,3,0,.15,0,stone,shrine,true);box(2.8,.28,2.6,0,.4,0,stone,shrine);
  box(2.15,2.15,1.9,0,1.6,0,darkWood,shrine);box(1.5,1.55,.08,0,1.55,1.01,red,shrine);
  for(let i=-3;i<=3;i++)box(.055,1.6,.09,i*.22,1.55,1.06,gold,shrine);
  for(const side of [-1,1]){const roof=box(1.95,.18,2.9,side*.8,2.96,0,darkWood,shrine);roof.rotation.z=side*-.34;}
  box(.16,.18,3.1,0,3.3,0,gold,shrine);
  box(1.8,.7,.8,0,.8,1.8,material('#6b503d'),shrine);
  for(let i=0;i<8;i++)box(.09,.035,.65,-.75+i*.21,1.17,1.8,darkWood,shrine);
  for(const side of [-1,1]){
    const x=side*4.2,z=-4.3;
    box(.9,.2,.9,x,.28,z,stone,root,true);box(.32,1.2,.32,x,.95,z,stone);
    box(.75,.12,.75,x,1.58,z,stone);
    box(.52,.55,.52,x,1.89,z,new THREE.MeshStandardMaterial({color:'#ebd7a0',emissive:'#e9a853',emissiveIntensity:.9}));
    box(.94,.18,.94,x,2.22,z,darkWood,root,true);
    for(const dx of [-.28,.28])for(const dz of [-.28,.28])box(.055,.63,.055,x+dx,1.89,z+dz,iron);
    const light=new THREE.PointLight('#ffd7a1',8,7,2);light.position.set(x,1.95,z);root.add(light);
  }
  // Wild grass at the roof edges, swaying from absolute film time.
  const grassGeo=new THREE.BufferGeometry();grassGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.035,0,0,.035,0,0,-.028,.28,.018,.028,.28,.018,-.016,.58,.08,.016,.58,.08,0,.85,.18],3));grassGeo.setIndex([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6]);grassGeo.computeVertexNormals();
  const grassMat=new THREE.MeshStandardMaterial({color:'#d6e3b1',roughness:1,side:THREE.DoubleSide});
  let grassTime:{value:number}={value:0};
  grassMat.onBeforeCompile=s=>{
    s.uniforms.uTime=grassTime;s.vertexShader='uniform float uTime;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      transformed.x+=sin(uTime*1.6+instanceMatrix[3].x*.7+instanceMatrix[3].z)*position.y*position.y*.18;`);
  };
  const count=mobile?1600:5000,grass=new THREE.InstancedMesh(grassGeo,grassMat,count);
  for(let i=0;i<count;i++){
    let x=(random()-.5)*22,z=(random()-.5)*27;
    if(Math.abs(x)<3.2 && z>-10)x=Math.sign(x||1)*(3.3+random()*6);
    dummy.position.set(x,.18,z);dummy.rotation.set(0,random()*Math.PI,0);const h=.35+random()*.8;dummy.scale.set(.6+random(),h,1);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,new THREE.Color().setHSL(.22+random()*.12,.25,.35+random()*.2));
  }root.add(grass);
  addRoofDetails(root,mobile,darkWood,stone,iron);
  const water=createWater(mobile);
  // World-space puddles with damped capillary waves in the reflected image.
  const reflector=new Reflector(new THREE.PlaneGeometry(23,29),{textureWidth:mobile?512:1024,textureHeight:mobile?512:1024,color:0x8ca8b1,clipBias:.005});
  reflector.rotation.x=-Math.PI/2;reflector.position.y=.165;
  const reflectionMaterial=reflector.material as THREE.ShaderMaterial; reflectionMaterial.transparent=true;reflectionMaterial.depthWrite=false;
  Object.assign(reflectionMaterial.uniforms,water.uniforms);
  reflectionMaterial.vertexShader='varying vec2 vWaterPosition; varying vec3 vWaterView;\n'+reflectionMaterial.vertexShader.replace('vUv = textureMatrix', 'vWaterPosition=vec2(position.x,-position.y); vWaterView=cameraPosition-(modelMatrix*vec4(position,1.)).xyz; vUv = textureMatrix');
  reflectionMaterial.fragmentShader='varying vec3 vWaterView;\n'+waterFragment(water.count)+reflectionMaterial.fragmentShader;
  reflectionMaterial.fragmentShader=reflectionMaterial.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`
    vec2 slope=waterSlope(vWaterPosition);
    vec4 projection=vUv; projection.xy+=slope*.018*projection.w;
    vec4 base=texture2DProj(tDiffuse,projection);
    float shimmer=dot(slope,normalize(vec2(-.4,.8)));
    base.rgb+=shimmer*2.0;
  `);
  reflectionMaterial.fragmentShader=reflectionMaterial.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`
    float wet=puddleMask(vWaterPosition);
    float fresnel=pow(1.-clamp(normalize(vWaterView).y,0.,1.),3.);
    gl_FragColor=vec4(blendOverlay(base.rgb,color),wet*(.22+.43*fresnel));
  `);
  root.add(reflector);
  return {update(t:number){grassTime.value=t;papers.forEach((p,i)=>{p.rotation.x=Math.sin(t*1.8+i)*.11;p.rotation.z=Math.sin(t*1.1+i*2)*.09;});},reflector,city,meshes,water};
}





