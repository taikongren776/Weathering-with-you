import test from 'node:test';
import assert from 'node:assert/strict';
import {impactAt,exposedGround,puddleAt,IMPACT_LIFETIME} from '../src/water.ts';

test('rain impacts stay on exposed puddles and below the raised paving',()=>{
 let active=0;
 for(let channel=0;channel<40;channel++)for(let time=0;time<60;time+=.37){
  const hit=impactAt(channel,time,1);
  if(!hit.strength)continue;
  active++;
  assert.ok(exposedGround(hit.x,hit.z));
  assert.ok(puddleAt(hit.x,hit.z)>.48);
  assert.ok(hit.age>=0&&hit.age<IMPACT_LIFETIME);
 }
 assert.ok(active>300);
});
test('seeking and replay produce the same water and relocated later impacts',()=>{
 for(const time of [0,1.34,14.1,28.7,41.2]){
  const first=Array.from({length:40},(_,i)=>impactAt(i,time,.8));
  for(let t=0;t<60;t+=2)impactAt(3,t,1);
  assert.deepEqual(first,Array.from({length:40},(_,i)=>impactAt(i,time,.8)));
 }
 const a=impactAt(2,1,1),b=impactAt(2,12,1);
 assert.notDeepEqual([a.x,a.z],[b.x,b.z]);
});
test('dry weather has no splashes or ripple energy',()=>{
 for(let i=0;i<40;i++)for(const t of [0,12,33,49,60])assert.equal(impactAt(i,t,0).strength,0);
});
test('fading rainfall changes ripple energy continuously',()=>{
 for(let i=0;i<40;i++){
  const a=impactAt(i,14.3,.71),b=impactAt(i,14.3,.7101);
  assert.ok(Math.abs(a.strength-b.strength)<=.000101);
 }
});

