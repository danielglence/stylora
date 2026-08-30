import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HeroVideoScrub(){
  const [hero,setHero]=useState(null); const [ready,setReady]=useState(false);
  const stage=useRef(null); const visual=useRef(null); const video=useRef(null); const canvas=useRef(null); const glow=useRef(null);
  useEffect(()=>setHero(document.querySelector('#home')),[]);
  useEffect(()=>{
    if(!hero||!video.current) return;
    const media=video.current; const output=canvas.current; let frame=0; let drawFrameId=0; let ctx;
    const drawFrame=()=>{cancelAnimationFrame(drawFrameId);drawFrameId=requestAnimationFrame(()=>{
      if(!media.videoWidth||!output) return; output.width=media.videoWidth; output.height=media.videoHeight;
      const drawing=output.getContext('2d',{willReadFrequently:true}); drawing.drawImage(media,0,0,output.width,output.height);
      const image=drawing.getImageData(0,0,output.width,output.height),pixels=image.data;
      for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b),neutral=max-min<22;if(neutral&&min>188)pixels[i+3]=0;else if(neutral&&min>164)pixels[i+3]=Math.round(255*(188-min)/24)}
      drawing.putImageData(image,0,0); setReady(true);
    })};
    const seek=time=>{cancelAnimationFrame(frame); frame=requestAnimationFrame(()=>{if(Number.isFinite(time)&&Math.abs(media.currentTime-time)>.015) media.currentTime=time})};
    const setup=()=>{
      media.pause(); media.currentTime=0.01;
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){media.currentTime=Math.min(media.duration*.55,5.5); ScrollTrigger.refresh(); return}
      ctx=gsap.context(()=>{
        const mm=gsap.matchMedia();
        mm.add({desktop:'(min-width:768px)',mobile:'(max-width:767px)'},({conditions})=>{
          const mobile=conditions.mobile; const end=Math.min(media.duration||10,10);
          const open=Math.min(2.5,end*.25), exposed=Math.min(7,end*.7);
          gsap.set(visual.current,{scale:mobile?.78:.9,xPercent:mobile?10:28,yPercent:0,force3D:true,transformOrigin:'50% 50%'});
          gsap.set(glow.current,{opacity:0,scale:.8});
          const mapTime=progress=>progress<=.25?(progress/.25)*open:progress<=.7?open+((progress-.25)/.45)*(exposed-open):exposed+((progress-.7)/.3)*(end-exposed);
          const tl=gsap.timeline({scrollTrigger:{trigger:hero,start:'top top',end:'bottom bottom',scrub:.65,invalidateOnRefresh:true,onUpdate:self=>seek(mapTime(self.progress))}});
          tl.to(visual.current,{scale:mobile?.92:1,xPercent:mobile?8:25,duration:25,ease:'none'},0)
            .to(visual.current,{scale:mobile?1.28:1.55,xPercent:mobile?5:20,yPercent:mobile?-1:-2,duration:45,ease:'power1.inOut'},25)
            .to(glow.current,{opacity:mobile?.28:.65,scale:1.15,duration:30,ease:'power1.inOut'},40)
            .to(visual.current,{scale:mobile?.9:1,xPercent:mobile?10:28,yPercent:0,duration:30,ease:'power1.inOut'},70)
            .to(glow.current,{opacity:0,scale:.9,duration:24},76)
            .to(stage.current,{opacity:0,duration:8,ease:'power1.in'},92);
        });
        return()=>mm.revert();
      },hero);
      requestAnimationFrame(()=>ScrollTrigger.refresh());
    };
    media.addEventListener('loadedmetadata',setup,{once:true}); media.addEventListener('loadeddata',drawFrame); media.addEventListener('seeked',drawFrame);
    if(media.readyState>=1) setup();
    return()=>{cancelAnimationFrame(frame);cancelAnimationFrame(drawFrameId);media.removeEventListener('loadedmetadata',setup);media.removeEventListener('loadeddata',drawFrame);media.removeEventListener('seeked',drawFrame);ctx?.revert()};
  },[hero]);
  if(!hero) return null;
  return createPortal(<div className={`scrub-stage ${ready?'is-ready':''}`} ref={stage} aria-hidden="true">
    <div className="scrub-loading"><span/><small>Preparing the experience</small></div>
    <div className="scrub-glow" ref={glow}/>
    <div className="scrub-visual" ref={visual}>
      <canvas ref={canvas}/><video ref={video} preload="auto" muted playsInline disablePictureInPicture src="/assets/trimmer-exploded.mp4"/>
    </div>
  </div>,hero);
}
