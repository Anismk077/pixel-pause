/* Pixel Pause — Néon Rush : course à 3 couloirs */
(function(){
  'use strict';
  var $=PP.$,sfx=PP.sfx,cv=$('rn-cv'),cx=cv.getContext('2d'),W=cv.width,H=cv.height;
  var HOR=150,BOT=H-20,running=false,raf=0,last=0;
  var lane,laneX,jump,slide,obs,speed,dist,coins,spawnT,dead,stripe;
  $('rn-best').textContent=PP.store('rn-best');
  function y(z){return BOT-(BOT-HOR)*(1-Math.pow(1-z,2.2))}
  function sc(z){return 1-z*.82}
  function lx(l,z){return W/2+(l-1)*150*sc(z)}
  function reset(){lane=1;laneX=1;jump=0;slide=0;obs=[];speed=.42;dist=0;coins=0;spawnT=0;dead=false;stripe=0;upd()}
  function upd(){$('rn-score').textContent=Math.floor(dist);$('rn-coins').textContent=coins}
  function spawn(){
    var free=[0,1,2],block=Math.random()<.35?2:1,used=PP.shuffle(free).slice(0,block);
    used.forEach(function(l){var r=Math.random();obs.push({l:l,z:1,t:r<.4?'low':r<.75?'high':'wall'})});
    var open=free.filter(function(l){return used.indexOf(l)<0});
    if(open.length&&Math.random()<.7){var cl=PP.pick(open);for(var k=0;k<4;k++)obs.push({l:cl,z:1.06+k*.06,t:'coin'})}
  }
  function step(dt){
    speed=Math.min(1.25,speed+dt*.012);dist+=dt*speed*40;stripe=(stripe+dt*speed*2.2)%1;
    laneX+=(lane-laneX)*Math.min(1,dt*14);
    if(jump>0)jump=Math.max(0,jump-dt*1.55);
    if(slide>0)slide=Math.max(0,slide-dt*1.6);
    spawnT-=dt*speed;if(spawnT<=0){spawn();spawnT=.62+Math.random()*.35}
    for(var i=obs.length-1;i>=0;i--){
      var o=obs[i];o.z-=dt*speed*.55;
      if(o.z<-.05){obs.splice(i,1);continue}
      if(o.z<.035&&o.z>-.02&&o.l===Math.round(laneX)&&!o.hit){
        if(o.t==='coin'){obs.splice(i,1);coins++;sfx.play('eat');continue}
        var air=jump>.18,low=slide>.1;
        if((o.t==='low'&&air)||(o.t==='high'&&low)){o.hit=true;continue}
        return crash();
      }
    }
    upd();
  }
  function crash(){
    sfx.play('crash');dead=true;running=false;cancelAnimationFrame(raf);draw();
    var score=Math.floor(dist)+coins*10,best=PP.store('rn-best');
    if(score>best){best=score;PP.store('rn-best',score);$('rn-best').textContent=score;PP.refreshHi()}
    $('rn-title').textContent='Crash !';$('rn-msg').textContent=Math.floor(dist)+' m et '+coins+' pièce'+(coins>1?'s':'')+' : '+score+' points. Record : '+best+'.';
    $('rn-start').textContent='Recourir';$('rn-ov').hidden=false;$('rn-start').focus();
  }
  function quad(z1,z2,x1a,x1b,x2a,x2b,col){cx.fillStyle=col;cx.beginPath();cx.moveTo(x1a,y(z1));cx.lineTo(x1b,y(z1));cx.lineTo(x2b,y(z2));cx.lineTo(x2a,y(z2));cx.closePath();cx.fill()}
  function draw(){
    var g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#050508');g.addColorStop(.3,'#15121f');g.addColorStop(1,'#1d1830');
    cx.fillStyle=g;cx.fillRect(0,0,W,H);
    for(var b=0;b<8;b++){
      var z=((b/8)+(1-stripe)/8)%1,zz=Math.max(.001,z),s=sc(zz),yy=y(zz),hh=260*s;
      [-1,1].forEach(function(side){
        var x=W/2+side*(240*s),w=60*s;
        cx.fillStyle='#111018';cx.fillRect(side<0?x-w:x,yy-hh,w,hh);
        for(var k=0;k<5;k++){cx.fillStyle=(k+b)%3?'#3fa9ff':'#ff3b3b';cx.fillRect((side<0?x-w:x)+w*.15,yy-hh+hh*(k+.5)/5.5,Math.max(1,3*s),Math.max(1,3*s))}
      });
    }
    quad(0,1,W/2-230,W/2+230,W/2-230*sc(1),W/2+230*sc(1),'#1e1a2b');
    for(var i=0;i<14;i++){var z1=((i+stripe)/14),z2=z1+.035;if(z2>1)continue;quad(z1,z2,W/2-230*sc(z1),W/2+230*sc(z1),W/2-230*sc(z2),W/2+230*sc(z2),'rgba(242,239,230,.05)')}
    [-.5,.5].forEach(function(d){cx.strokeStyle='rgba(63,169,255,.8)';cx.lineWidth=2;cx.beginPath();cx.moveTo(W/2+d*150,y(0));cx.lineTo(W/2+d*150*sc(1),y(1));cx.stroke()});
    obs.slice().sort(function(a,b){return b.z-a.z}).forEach(function(o){
      if(o.z>1||o.z<-.05)return;
      var s=sc(Math.max(0,o.z)),x=lx(o.l,Math.max(0,o.z)),yy=y(Math.max(0,o.z)),w=110*s;
      if(o.t==='coin'){cx.fillStyle='#ffd23f';cx.strokeStyle='#0a0a0c';cx.lineWidth=2*s;cx.fillRect(x-12*s,yy-60*s,24*s,24*s);cx.strokeRect(x-12*s,yy-60*s,24*s,24*s);return}
      if(o.t==='low'){cx.fillStyle='#ff3b3b';cx.fillRect(x-w/2,yy-22*s,w,22*s);cx.fillStyle='#ffd23f';for(var k=0;k<4;k++)cx.fillRect(x-w/2+k*w/4+4*s,yy-16*s,w/8,6*s)}
      else if(o.t==='high'){cx.fillStyle='#ffd23f';cx.fillRect(x-w/2,yy-150*s,8*s,150*s);cx.fillRect(x+w/2-8*s,yy-150*s,8*s,150*s);cx.fillStyle='#ff3b3b';cx.fillRect(x-w/2,yy-150*s,w,40*s);cx.fillStyle='#f2efe6';cx.font='bold '+Math.round(16*s)+'px sans-serif';cx.textAlign='center';cx.fillText('↓',x,yy-122*s)}
      else{cx.fillStyle='#0a0a0c';cx.fillRect(x-w/2,yy-170*s,w,170*s);cx.strokeStyle='#3fa9ff';cx.lineWidth=3*s;cx.strokeRect(x-w/2,yy-170*s,w,170*s);for(var k=0;k<6;k++){cx.fillStyle=k%2?'#3cff6e':'#ff3b3b';cx.fillRect(x-w/2+10*s,yy-160*s+k*26*s,8*s,6*s)}}
    });
    var px=lx(laneX,0),py=y(0)-Math.sin(Math.min(1,jump)*Math.PI)*120,h=slide>0?34:70,wob=Math.sin(dist*.9)*4;
    cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(px,y(0)-2,34,9,0,0,7);cx.fill();
    cx.fillStyle=dead?'#ff3b3b':'#3fa9ff';cx.strokeStyle='#0a0a0c';cx.lineWidth=3;cx.fillRect(px-22,py-h,44,h);cx.strokeRect(px-22,py-h,44,h);
    cx.fillStyle='#0a0a0c';cx.fillRect(px-14,py-h+10,28,12);cx.fillStyle='#f2efe6';cx.fillRect(px-10,py-h+13,7,6);cx.fillRect(px+3,py-h+13,7,6);
    if(slide<=0){cx.fillStyle='#0a0a0c';cx.fillRect(px-18,py-4+wob/2,12,8);cx.fillRect(px+6,py-4-wob/2,12,8)}
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){step(dt);draw();raf=requestAnimationFrame(loop)}}
  function start(){reset();$('rn-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);sfx.play('go')}
  function key(k){if(!running)return;if(k==='L')lane=Math.max(0,lane-1);if(k==='R')lane=Math.min(2,lane+1);if(k==='U'&&jump<=0&&slide<=0){jump=1;sfx.play('ui')}if(k==='D'){slide=.75;jump=0}}
  $('rn-start').addEventListener('click',start);
  $('rn-pad').addEventListener('click',function(e){var b=e.target.closest('[data-k]');if(b)key(b.dataset.k)});
  document.addEventListener('keydown',function(e){if(PP.cur()!=='run')return;var k={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D',q:'L',a:'L',d:'R',z:'U',w:'U',s:'D',' ':'U'}[e.key.length===1?e.key.toLowerCase():e.key];if(k&&running){key(k);e.preventDefault()}});
  var t0=null;
  cv.addEventListener('touchstart',function(e){t0=e.touches[0]},{passive:true});
  cv.addEventListener('touchend',function(e){if(!t0)return;var t=e.changedTouches[0],dx=t.clientX-t0.clientX,dy=t.clientY-t0.clientY;if(Math.max(Math.abs(dx),Math.abs(dy))>24)key(Math.abs(dx)>Math.abs(dy)?(dx>0?'R':'L'):(dy>0?'D':'U'));t0=null});
  PP.games.run={open:function(){reset();draw();$('rn-title').textContent='Néon Rush';$('rn-start').textContent='Courir';$('rn-ov').hidden=false},close:function(){if(running){running=false;cancelAnimationFrame(raf)}}};
})();
