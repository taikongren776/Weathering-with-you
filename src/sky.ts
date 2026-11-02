import * as THREE from 'three';
const noiseGLSL = `
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+13.1;a*=.5;}return s;}
`;
export function createSky(scene: THREE.Scene) {
  const material = new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{uTime:{value:0},uSun:{value:0}},
    vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float;varying vec3 vDirection;uniform float uTime;uniform float uSun;
    ${noiseGLSL}
    void main(){
      vec3 d=normalize(vDirection);float h=max(d.y,0.);vec3 sunDir=normalize(vec3(-.48,.5,-.6));
      vec3 darkSky=mix(vec3(.38,.47,.53),vec3(.085,.17,.25),pow(h,.5));
      vec3 clearSky=mix(vec3(.74,.82,.83),vec3(.10,.40,.64),pow(h,.45));
      vec3 col=mix(darkSky,clearSky,uSun);
      vec3 p=d*vec3(3.4,2.2,3.4)+vec3(uTime*.003,0.,uTime*.001);
      float n=fbm(p*3.);float detail=fbm(p*7.+5.);
      float gap=smoothstep(.58,.94,dot(d,sunDir))*uSun;
      float clouds=smoothstep(.26+gap*.35,.65+gap*.3,n*.8+detail*.2);
      float bright=noise(p*2.+vec3(-2.,4.,0.));
      vec3 cloud=mix(vec3(.16,.23,.30),vec3(.61,.69,.73),bright*.85+h*.15);
      cloud=mix(cloud,mix(vec3(.52,.65,.73),vec3(1.,.94,.8),bright),uSun);
      col=mix(col,cloud,clouds*(.92-gap*.7)*smoothstep(-.1,.1,d.y));
      float sd=max(dot(d,sunDir),0.);
      col+=vec3(1.,.76,.4)*(pow(sd,24.)*.32+pow(sd,180.)*.6+pow(sd,1500.)*1.8)*uSun;
      col=mix(col,mix(vec3(.43,.51,.56),vec3(.77,.81,.78),uSun),pow(1.-abs(d.y),9.)*.5);
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  });
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1800,32,20),material);
  sky.renderOrder=-100;scene.add(sky);
  // Layered translucent cloud banks, with volume suggested by lit noise.
  const cloudMat = new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{uTime:{value:0},uSun:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float;varying vec2 vUv;uniform float uTime;uniform float uSun;${noiseGLSL}
    void main(){
      vec2 p=vUv*2.-1.;float edge=1.-smoothstep(.35,1.,length(p*vec2(.8,1.)));
      float n=fbm(vec3(vUv*6.,uTime*.006));float a=smoothstep(.28,.65,n)*edge*.65;
      vec3 color=mix(vec3(.31,.39,.46),vec3(.87,.9,.88),uSun);
      color*=.7+n*.5;gl_FragColor=vec4(color,a*(1.-uSun*.25));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  });
  for(let i=0;i<12;i++){
    const cloud=new THREE.Mesh(new THREE.PlaneGeometry(280,100),cloudMat);
    const a=i/12*Math.PI*2;
    cloud.position.set(Math.sin(a)*390,55+(i%3)*20,Math.cos(a)*390);
    cloud.lookAt(0,20,0);scene.add(cloud);
  }
  return {update(t:number,sun:number){material.uniforms.uTime.value=t;material.uniforms.uSun.value=sun;cloudMat.uniforms.uTime.value=t;cloudMat.uniforms.uSun.value=sun;}};
}

