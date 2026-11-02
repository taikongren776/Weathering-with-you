import './style.css';
import { Cinema } from './cinema';
import { Soundscape } from './audio';
import { CHAPTERS, DURATION, FilmClock, weatherAt } from './timeline';

const icons={
 play:'<path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 replay:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
 sound:'<path d="m11 5-6 4H2v6h3l6 4V5ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
 mute:'<path d="m11 5-6 4H2v6h3l6 4V5ZM16 9l6 6M22 9l-6 6"/>',
 full:'<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 rain:'<path d="M7 14a4 4 0 1 1 .5-8 5 5 0 0 1 9.5 1 3.5 3.5 0 0 1 0 7M8 17l-1 3M13 17l-1 3M18 17l-1 3"/>'
};
const icon=(name:keyof typeof icons)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
<div class="page-shell">
  <header class="masthead">
    <a class="wordmark" href="./" aria-label="天气之子 首页"><span class="mark">天</span><span>WEATHERING<br><em>WITH YOU</em></span></a>
    <div class="edition"><span class="fine-line"></span> AN IMMERSIVE FILM EXPERIENCE</div>
    <button id="about-button" class="icon-button" aria-label="关于作品">${icon('info')}</button>
  </header>
  <main>
    <div class="eyebrow-row"><span class="eyebrow"><i></i> A PRAYER FOR SUNSHINE</span><span class="location">TOKYO, JAPAN <span>35°40′ N · 139°42′ E</span></span></div>
    <section id="cinema" aria-label="天气之子电影播放器">
      <div id="viewport">
        <div class="screen-grain"></div>
        <div class="poster-shade"></div>
        <div class="screen-top"><span class="screen-location">${icon('rain')} 東京 · 雨</span><span id="version-badge">正在准备场景</span></div>
        <div id="intro" class="intro">
          <p class="overline">天気の子 <span>—</span> WEATHERING WITH YOU</p>
          <h1>天气之子<span class="title-dot">。</span></h1>
          <p class="poetic-title">A prayer for <em>sunshine.</em></p>
          <p class="description">穿过雨幕，在城市的尽头，<br>等一束为你而来的光。</p>
          <button id="start-button" class="start-button" disabled><span class="play-disc">${icon('play')}</span><span id="start-label">正在唤醒这座城市</span><span class="duration">01:00</span></button>
          <div id="loading" class="loading"><span class="loading-track"><i id="loading-fill"></i></span><span id="loading-value">00%</span></div>
        </div>
        <div class="frame-caption"><span>01 — 屋上の祈り</span><span>雨が、やむまで。</span></div>
        <div id="end-card" class="end-card" hidden><span class="overline">AFTER THE RAIN</span><h2>终于，天晴了。</h2><p>云的另一边，一直都有光。</p><button id="end-replay" class="text-button">${icon('replay')} 再看一次</button></div>
        <div id="pause-card" class="pause-card" hidden><span>PAUSED</span><button id="resume-button" aria-label="继续播放">${icon('play')}</button></div>
        <div id="error-card" class="error-card" hidden role="alert"><span class="overline">A MOMENT, PLEASE</span><h2>场景暂时无法打开</h2><p id="error-message"></p><button id="retry-button" class="text-button">重新加载 ${icon('arrow')}</button></div>
        <div id="screen-controls" class="screen-controls">
          <span id="shot-label">A CITY IN THE RAIN</span>
          <div class="screen-buttons"><button id="pause-button" class="icon-button" aria-label="暂停">${icon('pause')}</button><button id="replay-button" class="icon-button" aria-label="重新播放">${icon('replay')}</button><button id="sound-button" class="icon-button" aria-label="关闭声音" aria-pressed="false">${icon('sound')}</button><button id="fullscreen-button" class="icon-button" aria-label="全屏观看">${icon('full')}</button></div>
        </div>
      </div>
      <div class="transport"><span id="time-current" class="time">00:00</span><div class="progress" role="progressbar" aria-label="影片进度" aria-valuemin="0" aria-valuemax="60" aria-valuenow="0"><i id="progress-fill"></i>${[1,2,3,4,5].map(x=>`<b style="left:${x/6*100}%"></b>`).join('')}</div><span class="time time-total">01:00</span><span class="aspect">2.39 : 1</span></div>
    </section>
    <div class="chapter-heading"><span>THE SEQUENCE <i>六个瞬间，一场祈愿</i></span><span id="chapter-count">01 / 06</span></div>
    <ol class="chapters" aria-label="影片章节">${CHAPTERS.map((c,i)=>`<li data-chapter="${i}" class="${i===0?'active':''}"><span class="chapter-number">0${i+1}</span><div><span class="chapter-name">${c.name}</span><span class="chapter-time">00:${String(c.start).padStart(2,'0')}</span></div><i class="chapter-line"></i></li>`).join('')}</ol>
  </main>
  <footer><span>一个关于雨、天空与愿望的三维电影实验</span><span class="footer-note" id="footer-note">ENVIRONMENT STUDY <i>© 2026</i></span></footer>
</div>
<dialog id="about-dialog"><button id="close-about" class="icon-button close-dialog" aria-label="关闭">${icon('close')}</button><p class="overline">ABOUT THIS EXPERIENCE</p><h2>雨的尽头，是晴天。</h2><p>以《天气之子》楼顶鸟居祈晴为灵感的非官方三维电影实验。城市、鸟居、云雨与声音实时生成，影片长约一分钟。</p><p id="asset-note">当前版本是环境与运镜预演，阳菜人物及祈晴动作尚未完成。</p><div class="credit"><span>目标角色资产</span><a href="https://sketchfab.com/3d-models/hina-amano-33a0dc6df31443889a03177d1996f116" target="_blank" rel="noopener noreferrer">Hina Amano · NekoRare ↗</a><small>CC BY 4.0 · 未包含在当前版本</small></div><div class="shortcuts"><span>空格 <b>播放 / 暂停</b></span><span>R <b>重播</b></span><span>M <b>声音</b></span><span>F <b>全屏</b></span></div></dialog>
<div id="toast" role="status" aria-live="polite"></div>
`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewport=$('viewport'),cinemaElement=$('cinema'),clock=new FilmClock(),audio=new Soundscape();
let cinema:Cinema|undefined,started=false,ready=false,raf=0,posterStart=performance.now(),lastPoster=0;
let idleTimer:ReturnType<typeof setTimeout>,toastTimer:ReturnType<typeof setTimeout>;
let lastUIChapter=-1;
function toast(message:string){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4500);}
function progress(f:number){$('loading-fill').style.width=`${Math.round(f*100)}%`;$('loading-value').textContent=String(Math.round(f*100)).padStart(2,'0')+'%';}
function showError(error:unknown){
  console.error(error);ready=false;clock.pause();audio.update(clock.time,false);
  $('intro').hidden=true;$('pause-card').hidden=true;$('end-card').hidden=true;
  $('error-card').hidden=false;$('error-message').textContent=error instanceof Error?error.message:'请重试，或使用支持 WebGL 2 的浏览器。';
  viewport.classList.add('has-error');
}
function updateUI(){
  const t=clock.time,chapter=weatherAt(t).chapter;
  $('time-current').textContent=`00:${Math.floor(t).toString().padStart(2,'0')}`.replace('00:60','01:00');
  $('progress-fill').style.width=`${t/DURATION*100}%`;
  document.querySelector('.progress')!.setAttribute('aria-valuenow',t.toFixed(1));
  $('pause-button').innerHTML=icon(clock.playing?'pause':'play');$('pause-button').setAttribute('aria-label',clock.playing?'暂停':'继续播放');
  $('pause-card').hidden=!started||clock.playing||t===DURATION;
  $('end-card').hidden=t!==DURATION||!started;
  viewport.classList.toggle('ended',started&&t===DURATION);
  viewport.classList.toggle('paused',started&&!clock.playing);
  if(chapter!==lastUIChapter){
    lastUIChapter=chapter;
    document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el,i)=>{el.classList.toggle('active',i===chapter);el.classList.toggle('passed',i<chapter);});
    $('chapter-count').textContent=`0${chapter+1} / 06`;$('shot-label').textContent=CHAPTERS[chapter].en;
    document.querySelector('.screen-location')!.innerHTML=icon('rain')+(chapter>=5?' 東京 · 晴':' 東京 · 雨');
  }
}
async function ensureAudio(){try{await audio.start();audio.update(clock.time,clock.playing);}catch{toast('声音未能启动，影片仍可正常观看。');}}
function play(){
  if(!ready)return;started=true;viewport.classList.add('playing');$('intro').hidden=true;$('loading').hidden=true;clock.play();void ensureAudio();updateUI();revealControls();
}
function pause(){clock.pause();audio.update(clock.time,false);updateUI();revealControls();}
function replay(){if(!ready)return;clock.restart();play();}
function toggle(){if(!started)play();else if(clock.playing)pause();else play();}
function mute(){audio.muted=!audio.muted;$('sound-button').innerHTML=icon(audio.muted?'mute':'sound');$('sound-button').setAttribute('aria-label',audio.muted?'开启声音':'关闭声音');$('sound-button').setAttribute('aria-pressed',String(audio.muted));audio.update(clock.time,clock.playing);}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await cinemaElement.requestFullscreen();}catch{toast('此浏览器暂不支持全屏，请使用横屏观看。');}}
function revealControls(){viewport.classList.add('controls-visible');clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(clock.playing)viewport.classList.remove('controls-visible');},2500);}
$('start-button').addEventListener('click',play);$('pause-button').addEventListener('click',toggle);$('resume-button').addEventListener('click',play);
$('replay-button').addEventListener('click',replay);$('end-replay').addEventListener('click',replay);
$('sound-button').addEventListener('click',mute);$('fullscreen-button').addEventListener('click',()=>void fullscreen());
$('retry-button').addEventListener('click',()=>location.reload());
const dialog=$<HTMLDialogElement>('about-dialog');
$('about-button').addEventListener('click',()=>{if(clock.playing)pause();dialog.showModal();});
$('close-about').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
viewport.addEventListener('pointermove',revealControls);viewport.addEventListener('pointerdown',revealControls);viewport.addEventListener('focusin',revealControls);
document.addEventListener('keydown',event=>{
  if(dialog.open||event.target instanceof HTMLButtonElement||event.target instanceof HTMLInputElement||event.target instanceof HTMLAnchorElement)return;
  if(event.code==='Space'){event.preventDefault();toggle();}
  if(event.code==='KeyR')replay();if(event.code==='KeyM')mute();if(event.code==='KeyF')void fullscreen();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(clock.playing)pause();clock.resync();void audio.suspend();cancelAnimationFrame(raf);}
  else{clock.resync();posterStart=performance.now()-lastPoster*1000;raf=requestAnimationFrame(frame);}
});
function frame(now:number){
  if(!cinema||!ready)return;
  try{
    if(started){clock.tick(now);cinema.render(clock.time);audio.update(clock.time,clock.playing);updateUI();}
    else{lastPoster=(now-posterStart)/1000;cinema.render(lastPoster,true);}
    cinema.measure(now);
  }catch(error){showError(error);return;}
  raf=requestAnimationFrame(frame);
}
async function boot(){
  try{
    progress(.08);
    cinema=new Cinema(viewport);progress(.45);
    cinema.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(raf);showError(new Error('图形上下文已中断。请关闭占用显存的页面后重新加载。'));});
    await cinema.load(f=>progress(.45+f*.4));progress(1);ready=true;
    $('version-badge').textContent=cinema.characterPresent?'电影实验 · 人物待验收':'环境预演 · 人物待接入';
    $('start-label').textContent=cinema.characterPresent?'开始观看':'观看环境预演';
    if(cinema.characterPresent){$('asset-note').textContent=cinema.info;$('footer-note').innerHTML='CHARACTER STUDY <i>© 2026</i>';}
    $<HTMLButtonElement>('start-button').disabled=false;
    setTimeout(()=>$('loading').classList.add('complete'),600);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){cinema.render(0,true);toast('已减少首页动画；点击观看后播放镜头。');}
    else raf=requestAnimationFrame(frame);
    // Playback must also start RAF in reduced-motion mode.
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)$('start-button').addEventListener('click',()=>{if(!raf)raf=requestAnimationFrame(frame);},{once:true});
    if(import.meta.env.DEV){
      Object.assign(window,{__film:{seek:(t:number)=>{started=true;viewport.classList.add('playing');$('intro').hidden=true;clock.pause();clock.seek(t);cinema!.render(t);audio.update(t,false);updateUI();},state:()=>({time:clock.time,playing:clock.playing,ready,fps:cinema!.fps,characterPresent:cinema!.characterPresent,renderer:cinema!.renderer.info.render}),play,pause}});
    }
  }catch(error){showError(error);}
}
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);audio.dispose();cinema?.dispose();},{once:true});
void boot();

