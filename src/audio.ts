import { weatherAt } from './timeline';
/** Original synthesized soundscape. No movie audio or external audio asset. */
export class Soundscape {
  private context?: AudioContext;
  private master?: GainNode;
  private rain?: GainNode;
  private wind?: GainNode;
  private notes?: GainNode;
  private noise?: AudioBufferSourceNode;
  private oscillators: OscillatorNode[] = [];
  muted=false;
  async start() {
    if(!this.context) this.create();
    await this.context!.resume();
  }
  private create() {
    const ctx=this.context=new AudioContext();
    const master=this.master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
    const buffer=ctx.createBuffer(1,ctx.sampleRate*8,ctx.sampleRate);
    const data=buffer.getChannelData(0);
    let seed=98761, brown=0;
    for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0; const white=seed/4294967296*2-1;brown=(brown+0.02*white)/1.02;data[i]=white*0.25+brown*3;}
    const noise=this.noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const rainFilter=ctx.createBiquadFilter();rainFilter.type='highpass';rainFilter.frequency.value=700;
    this.rain=ctx.createGain();this.rain.gain.value=0.3;
    noise.connect(rainFilter).connect(this.rain).connect(master);
    const windFilter=ctx.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=280;
    this.wind=ctx.createGain();this.wind.gain.value=0.2;noise.connect(windFilter).connect(this.wind).connect(master);noise.start();
    this.notes=ctx.createGain();this.notes.gain.value=0;
    this.notes.connect(master);
    [130.8128,195.9977,261.6256,293.6648].forEach((freq,i)=>{
      const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=freq;osc.detune.value=i%2?3:-3;
      const gain=ctx.createGain();gain.gain.value=0.025;osc.connect(gain).connect(this.notes!);osc.start();this.oscillators.push(osc);
    });
  }
  update(time:number,playing:boolean) {
    if(!this.context || !this.master) return;
    const now=this.context.currentTime, w=weatherAt(time);
    this.master.gain.setTargetAtTime(playing&&!this.muted?0.7:0,now,0.08);
    this.rain!.gain.setTargetAtTime(w.rain*0.34,now,0.15);
    this.wind!.gain.setTargetAtTime(0.12+(1-w.sunshine)*0.15,now,0.15);
    this.notes!.gain.setTargetAtTime(w.sunshine*0.65,now,0.3);
  }
  async suspend(){await this.context?.suspend();}
  dispose(){this.noise?.stop();this.oscillators.forEach(x=>x.stop());void this.context?.close();}
}

