import test from 'node:test';
import assert from 'node:assert/strict';
import {FilmClock,weatherAt,DURATION} from '../src/timeline.ts';
test('pause and tab resync do not advance film time',()=>{
 const clock=new FilmClock();clock.play();clock.tick(1000);clock.tick(1050);assert.equal(clock.time,.05);
 clock.pause();clock.tick(30000);assert.equal(clock.time,.05);
 clock.play();clock.tick(60000);assert.equal(clock.time,.05);
 clock.tick(60050);assert.equal(clock.time,.1);
 clock.resync();clock.tick(100000);assert.equal(clock.time,.1);
});
test('film ends exactly at 60 seconds, replay starts from zero',()=>{
 const clock=new FilmClock();clock.seek(59.95);clock.play();clock.tick(1000);clock.tick(1100);
 assert.equal(clock.time,DURATION);assert.equal(clock.playing,false);clock.restart();assert.equal(clock.time,0);assert.equal(clock.playing,true);
});
test('long foreground stalls and backwards timestamps cannot jump the camera',()=>{
 const clock=new FilmClock();clock.play();clock.tick(1000);clock.tick(100000);assert.equal(clock.time,.1);clock.tick(90000);assert.equal(clock.time,.1);
});
test('weather transitions are continuous, bounded and repeatable',()=>{
 let previous=weatherAt(0);
 for(let t=0;t<=60;t+=.05){const w=weatherAt(t);assert.ok(w.sunshine>=0&&w.sunshine<=1);assert.ok(w.rain>=0&&w.rain<=1);
 assert.ok(w.sunshine>=previous.sunshine);assert.ok(w.rain<=previous.rain);assert.deepEqual(w,weatherAt(t));previous=w;}
 assert.equal(weatherAt(0).rain,1);assert.equal(weatherAt(60).rain,0);assert.equal(weatherAt(60).sunshine,1);assert.equal(weatherAt(60).chapter,5);
});

