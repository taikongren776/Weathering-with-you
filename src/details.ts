import * as THREE from 'three';

type SurfaceKind='wood'|'stone'|'metal';
function noise(x:number,y:number){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
/** Small original procedural texture atlas; shared by each material family. */
export function surface(kind:SurfaceKind,color:THREE.ColorRepresentation,roughness=.8){
  const size=256,data=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const a=noise(x,y),b=noise(Math.floor(x/9),Math.floor(y/12));
    let value=.84+a*.13,h=.46+a*.10;
    if(kind==='wood'){
      const grain=Math.sin(x*.68+Math.sin(y*.038)*.8+Math.sin(x*.065)*2.);
      const hairline=Math.pow(Math.max(0,Math.sin(x*1.93+Math.sin(y*.018))),22);
      value=.81+grain*.065+a*.055-hairline*.14;
      if(noise(Math.floor(x/3),Math.floor(y/47))>.971)value-=.18;
      h=.5+grain*.09-hairline*.16;
    } else if(kind==='stone'){
      const pores=a>.96?.25:0;
      value=.75+b*.12+a*.12-pores;
      h=.5+a*.23-pores;
    } else {const rust=noise(Math.floor(x/5),Math.floor(y/7))>.85;value=.78+a*.12-(rust?.18:0);h=.44+a*.12;}
    const i=(y*size+x)*4;
    data.set([value*255,value*255,value*255,255],i);
    height.set([h*255,h*255,h*255,255],i);
  }
  function tex(bytes:Uint8Array,srgb=false){
    const t=new THREE.DataTexture(bytes,size,size,THREE.RGBAFormat);
    t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;
    t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.needsUpdate=true;return t;
  }
  const map=tex(data,true),bump=tex(height);map.repeat.set(kind==='wood'?2:4,kind==='wood'?4:4);bump.repeat.copy(map.repeat);
  return new THREE.MeshStandardMaterial({color,map,bumpMap:bump,bumpScale:kind==='stone'?.025:.009,roughness,metalness:kind==='metal'?.4:0});
}
export function addRoofDetails(root:THREE.Group,mobile:boolean,wood:THREE.Material,stone:THREE.Material,metal:THREE.Material){
  const boxGeo=new THREE.BoxGeometry(1,1,1),dark=new THREE.MeshStandardMaterial({color:'#293431',roughness:.82}),bronze=new THREE.MeshStandardMaterial({color:'#8d7650',roughness:.55,metalness:.65});
  function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material){
    const mesh=new THREE.Mesh(boxGeo,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  function tube(points:THREE.Vector3[],radius:number,mat:THREE.Material,segments=36){
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,radius,5,false),mat);root.add(mesh);mesh.castShadow=true;return mesh;
  }
  // Three helically twisted strands make the sacred rope read as woven straw.
  const ropeCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-2.25,4.1,.25),new THREE.Vector3(-1.1,3.87,.4),new THREE.Vector3(0,3.78,.46),new THREE.Vector3(1.1,3.87,.4),new THREE.Vector3(2.25,4.1,.25)]);
  const ropeColors=['#9a855e','#c0aa7c','#7e7154'];
  for(let strand=0;strand<3;strand++){
    const points=[];
    for(let i=0;i<=320;i++){
      const t=i/320,p=ropeCurve.getPoint(t),angle=t*Math.PI*2*43+strand*Math.PI*2/3;
      p.y+=Math.cos(angle)*.046;p.z+=Math.sin(angle)*.046;points.push(p);
    }
    tube(points,.021,new THREE.MeshStandardMaterial({color:ropeColors[strand],roughness:.96}),mobile?240:440);
  }
  // Binding knots and frayed tassels.
  for(const x of [-2.18,2.18]){
    for(let j=0;j<5;j++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.082,.017,5,14),wood);ring.rotation.y=Math.PI/2;ring.position.set(x+j*.018,4.08,.28);root.add(ring);
    }
    for(let i=0;i<7;i++)tube([new THREE.Vector3(x,4.02,.28),new THREE.Vector3(x+(i-3)*.017,3.86,.29),new THREE.Vector3(x+(i-3)*.025,3.70,.31)],.006,wood,8);
  }
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=384;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#34352c';ctx.fillRect(0,0,256,384);
  ctx.strokeStyle='#b7a577';ctx.lineWidth=6;ctx.strokeRect(16,16,224,352);
  ctx.strokeStyle='#777657';ctx.lineWidth=2;ctx.strokeRect(26,26,204,332);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='116px "Noto Serif SC", SimSun, serif';
  ctx.fillStyle='#d1bd86';ctx.fillText('晴',128,128);ctx.fillText('天',128,257);
  const plaqueTexture=new THREE.CanvasTexture(canvas);plaqueTexture.colorSpace=THREE.SRGBColorSpace;plaqueTexture.anisotropy=8;
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.44,.65),new THREE.MeshStandardMaterial({map:plaqueTexture,roughness:.7}));plaque.position.set(0,4.86,.357);root.add(plaque);
  // Small metal caps, pegged joints and weathered pillar bases.
  const boltGeo=new THREE.SphereGeometry(.035,8,6);
  for(const x of [-2.35,2.35])for(const y of [4.33,5.45]){
    const bolt=new THREE.Mesh(boltGeo,bronze);bolt.position.set(x,y,.21);root.add(bolt);
  }
  for(const x of [-2.35,2.35]){
    for(const y of [.55,.68]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.3,.015,5,20),metal);ring.rotation.x=Math.PI/2;ring.position.set(x,y,0);root.add(ring);}
    for(let i=0;i<4;i++)box(.09,.04,.09,x+(i%2?1:-1)*.27,.37,i<2?-.27:.27,bronze);
  }
  // Individual wooden ribs and layered eaves on the shrine.
  for(const side of [-1,1]){
    for(let i=0;i<11;i++){
      const rib=box(.042,.04,2.95,side*(.12+i*.153),3.38-i*.053,-8.3,wood);
      rib.rotation.z=side*-.34;
    }
    const eave=box(.095,.22,3.1,side*1.72,2.85,-8.3,dark);eave.rotation.z=side*-.34;
  }
  for(const x of [-1.02,1.02])box(.12,2.18,.12,x,1.75,-7.28,wood);
  box(2.28,.14,.14,0,2.83,-7.28,wood);
  // Offertory box corner irons and feet.
  for(const x of [-.85,.85]){
    box(.09,.68,.05,x,.95,-6.07,bronze);box(.14,.3,.5,x,.47,-6.5,dark);
    for(const y of [.72,1.17]){const bolt=new THREE.Mesh(boltGeo,bronze);bolt.position.set(x,y,-6.025);root.add(bolt);}
  }
  // Water-tank seams, cap and service ladder.
  for(const y of [1.78,2.3,3.72,4.2]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.257,.025,5,36),metal);ring.rotation.x=Math.PI/2;ring.position.set(8,y,-10);root.add(ring);
  }
  box(.5,.1,.5,8,4.3,-10,metal);
  for(const x of [7.65,8.35])box(.045,4.2,.045,x,2.2,-8.69,metal);
  for(let i=0;i<12;i++)box(.73,.035,.035,8,.5+i*.31,-8.69,metal);
  // Grated drains and raised chipped stone borders.
  for(const [x,z] of [[-10,11],[10,11],[-10,-4],[5,-12]]){
    box(.72,.025,.95,x,.18,z,dark);
    for(let i=0;i<8;i++)box(.64,.02,.035,x,.2,z-.39+i*.11,metal);
    for(const side of [-1,1])box(.055,.05,1.06,x+side*.39,.19,z,stone);
  }
  // Hairline cracks in a few slabs (short, irregular, not a uniform texture grid).
  const crackMat=new THREE.LineBasicMaterial({color:'#283f40',transparent:true,opacity:.35});
  for(let i=0;i<20;i++){
    const x=Math.sin(i*39.3)*10,z=Math.cos(i*17.7)*12;
    if(Math.abs(x)<2.8)continue;
    const pts=[new THREE.Vector3(x,.153,z),new THREE.Vector3(x+.12,.153,z+.18),new THREE.Vector3(x+.07,.153,z+.31),new THREE.Vector3(x+.3,.153,z+.53)];
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),crackMat));
  }
  // Fallen ginkgo-like leaves, small enough to reward the low camera pass.
  const leafShape=new THREE.Shape();leafShape.moveTo(0,-.09);leafShape.quadraticCurveTo(-.04,-.02,-.085,.06);leafShape.quadraticCurveTo(-.03,.12,0,.07);leafShape.quadraticCurveTo(.04,.11,.08,.05);leafShape.quadraticCurveTo(.035,-.025,0,-.09);
  const leaves=new THREE.InstancedMesh(new THREE.ShapeGeometry(leafShape),new THREE.MeshStandardMaterial({color:'#a49b54',roughness:.65,side:THREE.DoubleSide}),mobile?28:65);
  const dummy=new THREE.Object3D();
  for(let i=0;i<leaves.count;i++){
    const x=(noise(i,4)-.5)*21,z=(noise(i,8)-.5)*26;
    dummy.position.set(x,.18,z);dummy.rotation.set(-Math.PI/2,0,noise(i,5)*6.28);const scale=.45+noise(i,9)*.8;dummy.scale.setScalar(scale);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
    leaves.setColorAt(i,new THREE.Color().setHSL(.12+noise(i,2)*.08,.24,.4+noise(i,3)*.2));
  }
  root.add(leaves);
}

