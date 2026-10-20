(function () {
  'use strict';
  if (!window.LEDMatrixWidgets) return;
  const colors={printer:'#EBF1FA',filename:'#8A9AAF',status:'#39E389',nozzle:'#FFAE37',bed:'#5ABEFF',progress:'#39E389',progress_background:'#1E2C3F',eta:'#EBF1FA',preprint:'#FFDA4E'};
  const previews=new Set();
  function colorPicker(container,config,value,options) {
    const input=document.createElement('input');
    input.type='color'; input.value=/^#[0-9a-fA-F]{6}$/.test(value)?value:(colors[(options.fieldId||'').split(/[._]/).pop()]||'#ffffff');
    input.style.cssText='width:66px;height:34px;cursor:pointer;border:1px solid #64748b;border-radius:6px;background:transparent;padding:2px';
    input.setAttribute('aria-label','Choose color');
    container.replaceChildren(input);
    // Native color input stores #RRGGBB; the surrounding widget serializer calls getValue().
    container.__moonColorInput=input;
    input.addEventListener('input',()=>{input.dispatchEvent(new Event('moonraker-color-updated',{bubbles:true}));previews.forEach(fn=>fn());});
  }
  function preview(container,config,value,options){
    const wrap=document.createElement('div');
    wrap.style.cssText='width:100%;max-width:980px;display:flex;flex-direction:column;gap:8px';
    const title=document.createElement('strong');title.textContent='Live Moonraker Preview — five P5 panels (320 × 32)';
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=32;
    canvas.style.cssText='width:100%;height:auto;background:#000;border:1px solid #475569;border-radius:5px;image-rendering:pixelated';
    canvas.setAttribute('aria-label','Live LEDMatrix Moonraker preview');
    const controls=document.createElement('div'); controls.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap';
    const select=document.createElement('select');
    for(const [value,label] of [['printing','Printing 68%'],['startup','Homing / QGL / Heat soak'],['complete','Complete'],['paused','Paused']]){
      const option=document.createElement('option'); option.value=value; option.textContent=label;select.append(option);
    }
    const stage=document.createElement('select');
    for(const v of ['HOMING','QGL','HEAT SOAKING']){const opt=document.createElement('option');opt.value=v;opt.textContent=v;stage.append(opt);}
    const info=document.createElement('small');info.textContent='Sample preview. Colors and text sizes update before Save; actual printer data comes from Moonraker.';
    controls.append(select,stage);wrap.append(title,controls,canvas,info);container.replaceChildren(wrap);
    const context=canvas.getContext('2d');if(!context)return;
    const form=container.closest('form')||document;
    function field(name){const inputs=form.querySelectorAll('input,select');for(const el of inputs){
      const id=String(el.name||el.id||'');if(id===name||id.endsWith('.'+name)||id.endsWith('_'+name)||id.endsWith('['+name+']'))return el;
    }return null;}
    function read(key,def){const el=field(key);return el?(el.type==='checkbox'?el.checked:el.value):def;}
    function swatch(key){const list=form.querySelectorAll('input[type=color]');for(const el of list){const id=String(el.closest('[data-field]')?.getAttribute('data-field')||el.closest('[id]')?.id||el.name||'');if(id===key||id.endsWith(key))return el.value;}return read(key,colors[key]);}
    function text(text,x,y,color,size){context.fillStyle=color;context.font=Math.max(6,Math.min(20,Number(size)||8))+'px monospace';context.textBaseline='top';context.fillText(text,x,y);}
    function draw(){
      if(!container.isConnected){previews.delete(draw);return;}
      context.fillStyle='#000';context.fillRect(0,0,320,32);
      const mode=select.value,startup=mode==='startup',pct=mode==='complete'?100:mode==='paused'?42:68;
      const c=k=>swatch(k)||colors[k];
      // Pixel thumbnail: small sample vase/object on left.
      context.fillStyle='#132331';context.fillRect(1,1,30,30);
      context.fillStyle='#5ABEFF';context.fillRect(10,6,12,3);context.fillRect(12,9,8,15);
      context.fillStyle='#7ED4ED';context.fillRect(8,24,16,3);
      const font=(k,n)=>read(k,n);
      text('VORON 2.4',36,0,c('printer'),font('printer',10));
      text('Dragon_Print.gcode',36,11,c('filename'),font('filename',9));
      text(mode==='startup'?'PRINTING':mode.toUpperCase(),215,0,c('status'),font('status',9));
      if(startup)text(stage.value,36,22,c('preprint'),font('status',9));
      else{
        context.fillStyle=c('progress_background');context.fillRect(36,24,125,4);
        context.fillStyle=c('progress');context.fillRect(36,24,Math.round(125*pct/100),4);
        text(pct+'%',165,21,c('progress'),font('progress',9));
      }
      // Keep the demo close to 320x32 while avoiding ambiguous E/B labels.
      context.fillStyle=c('nozzle');context.fillRect(215,12,5,2);context.fillRect(217,14,2,4);
      text('235°',224,10,c('nozzle'),font('temperature',8));
      context.fillStyle=c('bed');context.fillRect(260,14,8,2);context.fillRect(262,17,1,2);
      text('65°',271,10,c('bed'),font('temperature',8));
      text(startup?'STARTUP':'ETA 1h24m',215,23,c('eta'),font('eta',8));
    }
    const redraw=()=>draw(); previews.add(redraw);
    select.addEventListener('change',draw);stage.addEventListener('change',draw);
    form.addEventListener('input',draw);form.addEventListener('change',draw);
    // Some settings frameworks wrap controls with custom widget inputs.
    form.addEventListener('moonraker-color-updated',draw);
    draw();
  }
  window.LEDMatrixWidgets.register('moonraker-color-picker',{
    name:'Moonraker Color Picker',version:'1.4.0',render:colorPicker,
    getValue:function(container){return container?.__moonColorInput?.value||'#ffffff';},
    setValue:function(container,value){if(container?.__moonColorInput&&/^#[0-9a-fA-F]{6}$/.test(value))container.__moonColorInput.value=value;},
    handlers:{}
  });
  window.LEDMatrixWidgets.register('moonraker-live-preview',{
    name:'Moonraker Live Preview',version:'1.4.0',render:preview,
    getValue:function(){return 'live';},setValue:function(){},handlers:{}
  });
})();
