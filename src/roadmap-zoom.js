// Cert Tracker — Roadmap Map zoom, fit-to-width and touch pinch controls.
(function initRoadmapZoom(global){
  'use strict';

  const MIN_ZOOM=.35;
  const MAX_ZOOM=1.6;
  const STEP=.1;
  const zoomByLayout={mobile:.62,tablet:.82,desktop:1};

  function layoutMode(){
    const mode=document.documentElement.dataset.layout;
    return mode==='mobile'||mode==='tablet'?mode:'desktop';
  }
  function clamp(value){
    const n=Number(value);
    if(!Number.isFinite(n))return 1;
    return Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Math.round(n*100)/100));
  }
  function currentZoom(){return clamp(zoomByLayout[layoutMode()]||1);}
  function parts(workspace){
    return {
      viewport:workspace?.querySelector?.('.ct-map-viewport')||null,
      stage:workspace?.querySelector?.('.ct-map-stage')||null,
      canvas:workspace?.querySelector?.('.ct-map-canvas')||null,
      output:workspace?.querySelector?.('[data-map-zoom-readout]')||null
    };
  }
  function measure(workspace){
    const {canvas}=parts(workspace);
    if(!canvas)return{width:1,height:1};
    // Transform does not affect layout metrics, which is exactly what we need here.
    return {width:Math.max(canvas.scrollWidth,canvas.offsetWidth,1),height:Math.max(canvas.scrollHeight,canvas.offsetHeight,1)};
  }
  function sync(workspace){
    const {viewport,stage,canvas,output}=parts(workspace);if(!viewport||!stage||!canvas)return;
    const zoom=currentZoom(),size=measure(workspace);
    canvas.style.transformOrigin='0 0';
    canvas.style.transform=`scale(${zoom})`;
    stage.style.width=`${Math.ceil(size.width*zoom)}px`;
    stage.style.height=`${Math.ceil(size.height*zoom)}px`;
    viewport.dataset.mapZoom=String(zoom);
    if(output)output.textContent=`${Math.round(zoom*100)}%`;
  }
  function setZoom(workspace,next,options={}){
    const {viewport}=parts(workspace);if(!viewport)return;
    const previous=currentZoom(),preserve=options.preserveCenter!==false;
    const logicalX=(viewport.scrollLeft+viewport.clientWidth/2)/previous;
    const logicalY=(viewport.scrollTop+viewport.clientHeight/2)/previous;
    zoomByLayout[layoutMode()]=clamp(next);
    sync(workspace);
    requestAnimationFrame(()=>{
      const zoom=currentZoom();
      if(options.anchor){
        const {clientX,clientY,logicalX:ax,logicalY:ay}=options.anchor;
        const rect=viewport.getBoundingClientRect();
        viewport.scrollLeft=Math.max(0,ax*zoom-(clientX-rect.left));
        viewport.scrollTop=Math.max(0,ay*zoom-(clientY-rect.top));
      }else if(preserve){
        viewport.scrollLeft=Math.max(0,logicalX*zoom-viewport.clientWidth/2);
        viewport.scrollTop=Math.max(0,logicalY*zoom-viewport.clientHeight/2);
      }
    });
  }
  function fitWidth(workspace){
    const {viewport}=parts(workspace);if(!viewport)return;
    const size=measure(workspace),usable=Math.max(220,viewport.clientWidth-18);
    setZoom(workspace,Math.min(1,usable/size.width),{preserveCenter:false});
    requestAnimationFrame(()=>viewport.scrollTo({top:0,left:0,behavior:'smooth'}));
  }
  function reset(workspace){
    zoomByLayout[layoutMode()]=layoutMode()==='mobile'?.62:layoutMode()==='tablet'?.82:1;
    sync(workspace);
    parts(workspace).viewport?.scrollTo({top:0,left:0,behavior:'smooth'});
  }
  function installButtons(workspace){
    workspace.querySelector?.('[data-map-zoom-out]')?.addEventListener('click',()=>setZoom(workspace,currentZoom()-STEP));
    workspace.querySelector?.('[data-map-zoom-in]')?.addEventListener('click',()=>setZoom(workspace,currentZoom()+STEP));
    workspace.querySelector?.('[data-map-zoom-fit]')?.addEventListener('click',()=>fitWidth(workspace));
    workspace.querySelector?.('[data-map-zoom-reset]')?.addEventListener('click',()=>reset(workspace));
  }
  function installPointerGestures(workspace){
    const {viewport}=parts(workspace);if(!viewport||viewport.dataset.ctMapZoomBound==='1')return;
    viewport.dataset.ctMapZoomBound='1';
    const pointers=new Map();
    let pan=null,pinch=null;
    const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});

    viewport.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button!==0)return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      viewport.setPointerCapture?.(event.pointerId);
      if(pointers.size===1){pan={id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};pinch=null;}
      if(pointers.size===2){
        const [a,b]=[...pointers.values()],mid=midpoint(a,b),rect=viewport.getBoundingClientRect(),zoom=currentZoom();
        pinch={startDistance:Math.max(1,distance(a,b)),startZoom:zoom,logicalX:(viewport.scrollLeft+mid.x-rect.left)/zoom,logicalY:(viewport.scrollTop+mid.y-rect.top)/zoom};
        pan=null;
      }
    });
    viewport.addEventListener('pointermove',event=>{
      if(!pointers.has(event.pointerId))return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(pointers.size===1&&pan&&pan.id===event.pointerId){
        event.preventDefault();
        viewport.scrollLeft=pan.left-(event.clientX-pan.x);
        viewport.scrollTop=pan.top-(event.clientY-pan.y);
      }else if(pointers.size>=2&&pinch){
        event.preventDefault();
        const [a,b]=[...pointers.values()].slice(0,2),mid=midpoint(a,b),ratio=distance(a,b)/pinch.startDistance;
        setZoom(workspace,pinch.startZoom*ratio,{preserveCenter:false,anchor:{clientX:mid.x,clientY:mid.y,logicalX:pinch.logicalX,logicalY:pinch.logicalY}});
      }
    },{passive:false});
    const release=event=>{
      pointers.delete(event.pointerId);
      if(pointers.size===1){const [id,p]=[...pointers.entries()][0];pan={id,x:p.x,y:p.y,left:viewport.scrollLeft,top:viewport.scrollTop};pinch=null;}
      else if(pointers.size===0){pan=null;pinch=null;}
    };
    viewport.addEventListener('pointerup',release);
    viewport.addEventListener('pointercancel',release);
    viewport.addEventListener('lostpointercapture',release);

    // Ctrl/Cmd + wheel zooms the map while ordinary wheel/trackpad scrolling remains normal.
    viewport.addEventListener('wheel',event=>{
      if(!(event.ctrlKey||event.metaKey))return;
      event.preventDefault();
      const rect=viewport.getBoundingClientRect(),zoom=currentZoom();
      setZoom(workspace,zoom+(event.deltaY<0?STEP:-STEP),{preserveCenter:false,anchor:{clientX:event.clientX,clientY:event.clientY,logicalX:(viewport.scrollLeft+event.clientX-rect.left)/zoom,logicalY:(viewport.scrollTop+event.clientY-rect.top)/zoom}});
    },{passive:false});
  }
  function bind(root=document){
    const workspace=root.matches?.('.ct-roadmap-map-workspace')?root:root.querySelector?.('.ct-roadmap-map-workspace');
    if(!workspace)return;
    installButtons(workspace);installPointerGestures(workspace);sync(workspace);
    requestAnimationFrame(()=>sync(workspace));
  }
  global.addEventListener('certtracker:layout-changed',()=>document.querySelectorAll('.ct-roadmap-map-workspace').forEach(workspace=>{sync(workspace);if(layoutMode()==='mobile'&&currentZoom()>1)fitWidth(workspace);}));
  global.addEventListener('resize',()=>document.querySelectorAll('.ct-roadmap-map-workspace').forEach(sync));
  global.CertTrackerRoadmapZoom=Object.freeze({bind,setZoom,fitWidth,reset,currentZoom});
})(window);
