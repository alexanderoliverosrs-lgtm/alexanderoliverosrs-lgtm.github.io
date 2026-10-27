/* Kapitalcoins: independent, administrator-only morning advertisement editor. */
(() => {
  'use strict';
  const DURATION = 15;
  const WIDTH = 540, HEIGHT = 960;
  const VIDEO = 'kapitalcoins-mascota.mp4';
  let recorder = null, recording = false, raf = 0, frameStart = 0;
  let video, canvas, ctx, vesField, copField, dateField, status, exportBtn;
  const $ = (id) => document.getElementById(id);
  const gold = '#e7bc59';
  const shortDate = value => {
    const parts = (value || '').split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
  };
  const format = value => {
    const n = Number(String(value).replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n.toLocaleString('es-VE', {maximumFractionDigits: 2}) : '—';
  };
  const valid = () => [vesField.value, copField.value].every(v => Number(String(v).replace(',', '.')) > 0 && Number.isFinite(Number(String(v).replace(',', '.'))));
  function roundRect(x,y,w,h,r,color,stroke) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}
  }
  function text(value,x,y,size,color='#fff',bold=false,align='left') {
    ctx.textAlign=align;ctx.fillStyle=color;
    ctx.font=`${bold?'800':'500'} ${size}px -apple-system, BlinkMacSystemFont, Arial, sans-serif`;
    ctx.fillText(value,x,y);
  }
  function draw() {
    ctx.fillStyle='#f2eee4';ctx.fillRect(0,0,WIDTH,HEIGHT);
    if(video.readyState >= 2) {
      const vw=video.videoWidth,vh=video.videoHeight;
      if(vw&&vh){const h=760,w=h*vw/vh;ctx.drawImage(video,(WIDTH-w)/2,100,w,h);}
    }
    roundRect(38,24,464,133,20,'#11100e','#d4a64f');
    text('KAPITALCOINS',270,69,32,gold,true,'center');
    text('TASAS DE ENVÍO · '+shortDate(dateField.value),270,106,16,'#fff',true,'center');
    text('¡Buenos días!',270,133,18,'#e0d1ae',false,'center');
    roundRect(27,675,486,264,22,'#11100f','#c99c4a');
    text('ENVÍA CON CONFIANZA',270,709,19,gold,true,'center');
    ctx.strokeStyle='#8d713b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(62,725);ctx.lineTo(478,725);ctx.stroke();
    const rate=(y,country,value,unit)=>{
      roundRect(51,y,438,81,12,'#302b22');
      text(country,68,y+31,18,'#fff',true);
      text('1 USD =',68,y+57,13,'#d8cfbb');
      text(format(value)+' '+unit,470,y+52,29,gold,true,'right');
    };
    rate(743,'VENEZUELA',vesField.value,'Bs.');
    rate(835,'COLOMBIA',copField.value,'COP');
    text('Más que cambios, somos tu aliado.',270,930,13,'#e7dac1',false,'center');
  }
  function loop() {draw();raf=requestAnimationFrame(loop);}
  function message(m){status.textContent=m;}
  function loadPublicRates() {
    vesField.value=$('ves')?.value || vesField.value;
    copField.value=$('cop')?.value || copField.value;
    message('Tasas copiadas al editor. No se han cambiado las tasas públicas.');
  }
  function download(blob,ext) {
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);
    link.download=`Kapitalcoins-tasas-${dateField.value}.${ext}`;
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(link.href),60000);
  }
  function exportImage() {
    draw();canvas.toBlob(blob=>blob&&download(blob,'png'),'image/png');
    message('Imagen de publicidad generada.');
  }
  async function exportVideo() {
    if(recording || !valid()) {message('Verifica las dos tasas antes de generar.');return;}
    if(!canvas.captureStream || !window.MediaRecorder) {
      message('Este navegador no permite exportar video aquí. Puedes descargar la imagen o intentar desde Safari/Chrome actualizado.');return;
    }
    const mime=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm']
      .find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime){message('El navegador no dispone de codificador de video. Descarga la imagen.');return;}
    const chunks=[];
    try {
      video.pause();video.currentTime=0;
      await new Promise((resolve,reject)=>{
        if(video.readyState>=2)resolve();else {
          video.addEventListener('loadeddata',resolve,{once:true});
          video.addEventListener('error',()=>reject(new Error('No se pudo cargar la animación.')),{once:true});
        }
      });
      await video.play();
      const stream=canvas.captureStream(30);
      recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4000000});
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=()=>{
        stream.getTracks().forEach(t=>t.stop());
        recording=false;exportBtn.disabled=false;exportBtn.textContent='🎬 Generar video (15 segundos)';
        if(chunks.length) {download(new Blob(chunks,{type:mime}),mime.includes('mp4')?'mp4':'webm');message('Video creado. Comprueba el archivo antes de publicarlo.');}
        else message('No se generó ningún archivo. Prueba descargar la imagen.');
      };
      recorder.onerror=()=>message('Error durante la grabación. Prueba desde otro navegador.');
      recording=true;exportBtn.disabled=true;frameStart=performance.now();recorder.start(1000);
      const finish=()=>{
        if(!recording)return;
        const elapsed=performance.now()-frameStart;
        exportBtn.textContent=`🎬 Grabando… ${Math.max(0,Math.ceil((DURATION*1000-elapsed)/1000))} s`;
        if(elapsed>=DURATION*1000){recorder.stop();video.pause();}
        else setTimeout(finish,250);
      };
      finish();message('Mantén esta pantalla abierta durante la generación del video.');
    } catch(err){recording=false;exportBtn.disabled=false;exportBtn.textContent='🎬 Generar video (15 segundos)';message('No se pudo generar el video: '+err.message);}
  }
  function setup() {
    const section=document.createElement('section');
    section.className='box adminonly'; section.id='kcAdEditor';
    section.innerHTML=`
      <h2>🎬 Crear publicidad</h2>
      <p class="desc">Edita las tasas para tu video matutino. Los cambios aquí <b>no alteran las tasas públicas</b>.</p>
      <div class="kc-ad-fields">
        <label>🇻🇪 Venezuela · Bs. por USD<input id="kcAdVes" type="number" min="0.01" step="any" inputmode="decimal" value="971"></label>
        <label>🇨🇴 Colombia · COP por USD<input id="kcAdCop" type="number" min="0.01" step="any" inputmode="decimal" value="3089"></label>
        <label>📅 Fecha de publicación<input id="kcAdDate" type="date"></label>
      </div>
      <button type="button" id="kcAdUseRates" class="kc-ad-secondary">↻ Usar las tasas actuales de Kapitalcoins</button>
      <canvas id="kcAdCanvas" width="540" height="960" aria-label="Vista previa de publicidad vertical"></canvas>
      <video id="kcAdVideo" src="${VIDEO}" preload="auto" muted playsinline loop style="display:none"></video>
      <button type="button" id="kcAdExport">🎬 Generar video (15 segundos)</button>
      <button type="button" id="kcAdImage" class="kc-ad-secondary">📷 Descargar imagen</button>
      <p id="kcAdStatus" class="adminmsg" role="status">Vista previa lista. Algunas versiones de iPhone podrían exportar WebM o solo imagen.</p>`;
    const style=document.createElement('style');
    style.textContent=`#kcAdEditor{scroll-margin-top:20px}#kcAdEditor .kc-ad-fields{display:grid;gap:12px;margin:14px 0}#kcAdEditor label{display:grid;gap:5px;color:#e9c75a;font-weight:700;font-size:13px}#kcAdEditor input{width:100%;padding:13px;border-radius:11px;border:1px solid #8e722c;background:#171717;color:#fff;font-size:18px}#kcAdCanvas{display:block;width:min(100%,360px);height:auto;margin:18px auto;border:1px solid #b68e35;border-radius:12px}#kcAdEditor .kc-ad-secondary{background:#27221a;color:#e9c75a;border:1px solid #8e722c;font-size:14px}`;
    document.head.append(style);
    const anchor=$('receiptPanel');
    if(anchor)anchor.before(section);else document.querySelector('main.app').append(section);
    vesField=$('kcAdVes');copField=$('kcAdCop');dateField=$('kcAdDate');status=$('kcAdStatus');
    exportBtn=$('kcAdExport');canvas=$('kcAdCanvas');ctx=canvas.getContext('2d');video=$('kcAdVideo');
    const now=new Date();dateField.value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    $('kcAdUseRates').addEventListener('click',loadPublicRates);
    $('kcAdImage').addEventListener('click',exportImage);
    exportBtn.addEventListener('click',exportVideo);
    video.addEventListener('error',()=>message('Falta kapitalcoins-mascota.mp4 en la misma carpeta que index.html.'));
    video.play().catch(()=>{message('Toca la vista previa para activar la animación.');});
    canvas.addEventListener('click',()=>video.play().catch(()=>{}));
    loop();
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);if(recording&&recorder?.state==='recording')recorder.stop();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
  else setup();
})();
