import { useEffect, useRef } from 'react';
// Subtle floating gold dots behind the site; respects reduced motion.
export function GoldSparkles({snow=false,big=false}:{snow?:boolean;big?:boolean}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;const ctx=c.getContext('2d');if(!ctx)return;
    const still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w=0,h=0,raf=0;
    const resize=()=>{w=c.width=window.innerWidth;h=c.height=window.innerHeight;};resize();
    const mobile=w<760;const n=snow?Math.min(90,Math.max(35,Math.round(w*h/14000))):Math.min(50,Math.max(22,Math.round(w*h/26000)));const scale=(mobile?1.6:1.2)*(big?1.7:1);
    const dots=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:(snow?1.2+Math.random()*2.4:.9+Math.random()*1.8)*scale,v:snow?.3+Math.random()*.7:.08+Math.random()*.25,p:Math.random()*6.28}));
    const draw=(t:number)=>{ctx.clearRect(0,0,w,h);for(const d of dots){if(!still){if(snow){d.y+=d.v;d.x+=Math.sin(t/1500+d.p)*.3;if(d.y>h+5){d.y=-5;d.x=Math.random()*w;}}else{d.y-=d.v;if(d.y<-5){d.y=h+5;d.x=Math.random()*w;}}}
      const a=snow?.55+.3*Math.sin(d.p):.35+.4*(0.5+0.5*Math.sin(t/900+d.p));ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,6.28);ctx.fillStyle=snow?`rgba(255,255,255,${a})`:`rgba(255,200,60,${a})`;ctx.shadowColor=snow?'rgba(255,255,255,.7)':'rgba(255,190,40,.9)';ctx.shadowBlur=snow?4:8;ctx.fill();}
      if(!still)raf=requestAnimationFrame(draw);};
    raf=requestAnimationFrame(draw);window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[snow,big]);
  return <canvas ref={ref} className="gold-sparkles" aria-hidden="true"/>;
}
