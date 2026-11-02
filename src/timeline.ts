export const DURATION = 60;
export const CHAPTERS = [
  { start: 0, name: '雨中的东京', en: 'A CITY IN THE RAIN' },
  { start: 10, name: '楼顶的风', en: 'ABOVE THE CITY' },
  { start: 20, name: '穿过鸟居', en: 'THE THRESHOLD' },
  { start: 30, name: '向天空祈愿', en: 'A SILENT PRAYER' },
  { start: 40, name: '云隙之间', en: 'THE FIRST LIGHT' },
  { start: 50, name: '终于，天晴了', en: 'A WORLD IN SUNLIGHT' },
] as const;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a: number, b: number, x: number) => { const t = clamp((x-a)/(b-a)); return t*t*(3-2*t); };
export function weatherAt(t: number) {
  const sunshine = smooth(39, 54, t);
  return { sunshine, rain: 1-smooth(39, 49, t), prayer: smooth(28, 35, t), chapter: Math.min(5, Math.floor(clamp(t,0,DURATION)/10)) };
}
export class FilmClock {
  time = 0;
  playing = false;
  private previous: number | null = null;
  play() { if(this.time >= DURATION) this.time=0; this.playing=true; this.previous=null; }
  pause() { this.playing=false; this.previous=null; }
  restart() { this.time=0; this.play(); }
  resync() { this.previous=null; }
  seek(time: number) { this.time=clamp(time,0,DURATION); this.previous=null; }
  tick(now: number) {
    if(this.playing && this.previous!==null) {
      this.time=clamp(this.time+Math.min(Math.max(0,(now-this.previous)/1000),0.1),0,DURATION);
      if(this.time===DURATION) this.playing=false;
    }
    this.previous=now;
    return this.time;
  }
}

