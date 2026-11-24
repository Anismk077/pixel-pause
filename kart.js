/* Pixel Pause — Pixel Kart : course pseudo-3D en vue arrière. Solo contre 5 karts, ou à 2 en écran partagé. */
(function(){
  'use strict';
  var $=PP.$,sfx=PP.sfx,net=PP.net,mp=PP.mp,sendT=0,cv=$('kt-cv'),cx=cv.getContext('2d'),CW=cv.width,CH=cv.height;
  var SEG=200,ROAD=2000,CAM_H=1000,CAM_D=.84,DRAW=90,LAPS=3;
  var track=[],TL=0,running=false,raf=0,last=0,keys={},karts,items,props,time,countdown,humans=1,best=PP.store('kt-best');
  var NAMES=['Rex','Nova','Kiki','Turbo','Zed'],COLS=['#3fa9ff','#ff5fd2','#3cff6e','#ff8a3d','#f2efe6'];
  $('kt-best').textContent=best?PP.fmtTime(best/1000):'—';

  /* ---------- Piste ---------- */
  function addRoad(n,curve,hill){for(var i=0;i<n;i++)track.push({curve:curve*ease(i/n),hill:hill*ease(i/n)})}
  function ease(t){return t<.3?t/.3:t>.7?(1-t)/.3:1}
  function build(){
    track=[];
    addRoad(40,0,0);addRoad(50,3,0);addRoad(30,0,40);addRoad(50,-4,0);addRoad(40,0,-40);addRoad(60,2,30);addRoad(30,0,0);addRoad(50,-5,-30);addRoad(40,0,0);addRoad(50,4,0);addRoad(40,0,0);
    TL=track.length;
    var y=0;track.forEach(function(s,i){s.y1=y;y+=s.hill*2;s.y2=y;s.i=i});
    var fix=(track[0].y1-track[TL-1].y2)/TL;track.forEach(function(s,i){s.y1+=fix*i;s.y2+=fix*(i+1)});
    items=[];props=[];
    for(var i=20;i<TL;i+=17){var r=Math.random();if(r<.4)items.push({z:i*SEG+100,x:(Math.random()-.5)*1.4,t:'boost'});else if(r<.8)items.push({z:i*SEG+100,x:(Math.random()-.5)*1.4,t:'oil'})}
    for(var j=0;j<TL;j+=6){var side=j%12?1:-1,kind=(j/6)%4;props.push({seg:j,x:side*(1.6+Math.random()*.8),t:kind===0?'palm':kind===1?'lamp':kind===2?'sign':'palm'})}
  }
  function seg(z){return track[((z/SEG)|0)%TL]}
  function mk(name,col,human,i){return {name:name,col:col,human:human,id:i,z:SEG*(2+i*2),x:(i%2?.45:-.45),v:0,top:human?3400:(2600+i*110)*(.92+Math.random()*.12),lap:1,prog:SEG*(2+i*2),spin:0,boost:0,lapStart:0,laps:[],done:0,pos:6}}
  function reset(){
    build();karts=[];
    if(mp.on()){
      var PC=['#ffd23f','#3fa9ff','#ff5fd2','#3cff6e','#ff8a3d','#f2efe6','#b89bff','#36d6c3'],me=net.slot(net.me.id);
      net.players.slice(0,8).forEach(function(pl,i){var k=mk(pl.name,PC[i%8],pl.id===net.me.id?1:0,i);k.remote=pl.id!==net.me.id;k.pid=pl.id;k.z=SEG*(2+i*2);k.prog=k.z;karts.push(k)});
      karts.sort(function(a,b){return (b.human?1:0)-(a.human?1:0)});
      karts.forEach(function(k,i){k.id=i});humans=1;
      time=0;countdown=3.99;hud();return;
    }
    karts.push(mk('J1','#ffd23f',1,0));
    if(humans===2)karts.push(mk('J2','#3fa9ff',2,1));
    for(var i=karts.length;i<6;i++)karts.push(mk(NAMES[i-humans],COLS[i-humans],0,i));
    time=0;countdown=3.99;hud();
  }
  function ranks(){var all=karts.slice().sort(function(a,b){return b.prog-a.prog});all.forEach(function(k,i){k.pos=i+1})}
  function hud(){
    ranks();var k=karts[0];
    $('kt-pos').textContent=humans===2?('J1 '+k.pos+' · J2 '+karts[1].pos):(k.pos+'/'+karts.length);$('kt-lap').textContent=Math.min(LAPS,k.lap)+'/'+LAPS;$('kt-time').textContent=PP.fmtTime(time);
  }
  function input(k){
    if(k.id===0)return {U:keys.U1||keys.U||(humans===1&&keys.U2),D:keys.D1||keys.D||(humans===1&&keys.D2),L:keys.L1||keys.L||(humans===1&&keys.L2),R:keys.R1||keys.R||(humans===1&&keys.R2)};
    return {U:keys.U2,D:keys.D2,L:keys.L2,R:keys.R2};
  }

  function step(dt){
    if(countdown>0){var before=Math.ceil(countdown);countdown-=dt;var after=Math.ceil(countdown);if(after!==before&&after>0)sfx.play('count');if(countdown<=0)sfx.play('go');if(countdown>1)return}
    time+=dt;
    karts.forEach(function(k){
      var s=seg(k.z);
      if(k.done||k.remote)return;
      if(k.human){
        var inp=input(k),top=3400+(k.boost>0?1400:0);
        if(k.spin>0){k.spin-=dt;k.v*=.9}
        else{if(inp.U)k.v+=2600*dt;else if(inp.D)k.v-=3000*dt;else k.v-=800*dt;if(inp.L)k.x-=1.6*dt*(k.v/top);if(inp.R)k.x+=1.6*dt*(k.v/top)}
        k.v=Math.max(0,Math.min(top,k.v));k.boost=Math.max(0,k.boost-dt);
        k.x-=s.curve*.0009*k.v*dt;
        if(Math.abs(k.x)>1.15){k.v*=.97;k.x=Math.max(-1.6,Math.min(1.6,k.x))}
        items.forEach(function(it){if(!it.hit&&Math.abs(it.z-k.z)<SEG*.6&&Math.abs(it.x-k.x)<.3){if(it.t==='boost'){k.boost=1.6;k.v=top+600;sfx.play('boost')}else{k.spin=1;k.v*=.3;sfx.play('crash')}it.hit=1;setTimeout(function(){it.hit=0},3000)}});
      }else{
        if(k.spin>0){k.spin-=dt;k.v*=.9}else k.v=Math.min(k.top,k.v+2200*dt);
        var want=-s.curve*.08+(Math.sin(k.z/900)*.3);
        karts.forEach(function(o){if(o===k)return;var dz=o.z-k.z;if(Math.abs(dz)<SEG*2&&Math.abs(o.x-k.x)<.35)want+=o.x>k.x?-.5:.5});
        k.x+=(want-k.x)*dt*1.5;
        items.forEach(function(it){if(it.t==='oil'&&!it.hit&&Math.abs(it.z-k.z)<SEG*.5&&Math.abs(it.x-k.x)<.3&&k.spin<=0)k.spin=.8});
      }
      var old=k.z;k.z=(k.z+k.v*dt)%(TL*SEG);k.prog+=k.v*dt;
      if(k.z<old&&k.v>0){k.laps.push(time-k.lapStart);k.lapStart=time;k.lap++;if(k.human)sfx.play('pickup');if(k.lap>LAPS){k.done=time;if(k.human)PP.toast(k.name+' a fini !','ok')}}
    });
    // collisions entre karts
    for(var i=0;i<karts.length;i++)for(var j=i+1;j<karts.length;j++){var a=karts[i],b=karts[j],dz=b.z-a.z;if(a.remote&&b.remote)continue;if(Math.abs(dz)<SEG*.7&&Math.abs(a.x-b.x)<.32){if(dz>0)a.v*=.6;else b.v*=.6}}
    hud();
    if(mp.on()){sendT-=dt;if(sendT<=0){sendT=.066;var m=karts[0];net.relay({g:'kart',z:m.z,x:m.x,v:m.v,lap:m.lap,prog:m.prog,done:m.done,spin:m.spin})}}
    var hs=karts.filter(function(k){return k.human||k.remote});
    if(hs.every(function(k){return k.done}))return finish();
    if(hs.some(function(k){return k.done})&&time-Math.min.apply(null,hs.filter(function(k){return k.done}).map(function(k){return k.done}))>25)return finish();
  }
  function finish(){
    running=false;cancelAnimationFrame(raf);ranks();
    var k=karts[0],ms=Math.round((k.done||time)*1000),msg;
    if(mp.on()){var rk=karts.slice().sort(function(a,b){if(a.done&&b.done)return a.done-b.done;if(a.done)return -1;if(b.done)return 1;return b.prog-a.prog});msg=rk.map(function(q,i){return (i+1)+'. '+q.name+(q.done?' ('+PP.fmtTime(q.done)+')':'')}).join(' · ');$('kt-title').textContent=rk[0]===k?'Victoire !':rk[0].name+' gagne la course'}
    else if(humans===2){var a=karts[0],b=karts[1];msg='J1 : '+a.pos+(a.pos===1?'er':'e')+(a.done?' en '+PP.fmtTime(a.done):'')+' · J2 : '+b.pos+(b.pos===1?'er':'e')+(b.done?' en '+PP.fmtTime(b.done):'');$('kt-title').textContent=(a.done&&(!b.done||a.done<b.done))?'J1 gagne le duel !':'J2 gagne le duel !'}
    else{msg=k.pos+(k.pos===1?'er':'e')+' sur 6 en '+PP.fmtTime(k.done||time)+'.';if(k.done&&(!best||ms<best)){best=ms;PP.store('kt-best',ms);$('kt-best').textContent=PP.fmtTime(ms/1000);msg+=' Meilleur temps !'}$('kt-title').textContent=k.pos===1?'Victoire !':'Arrivée'}
    sfx.play(k.pos===1?'win':'lose');
    $('kt-msg').innerHTML=PP.esc(msg)+'<br>Tours J1 : '+k.laps.map(function(t){return PP.fmtTime(t)+'.'+Math.floor((t%1)*10)}).join(' · ');
    $('kt-start').textContent='Rejouer';$('kt-ov').hidden=false;draw();
  }

  /* ---------- Rendu d'une vue (W×H) pour un kart donné ---------- */
  function drawView(W,H,me){
    var base=seg(me.z),baseI=base.i,camY=CAM_H+base.y1+(base.y2-base.y1)*((me.z%SEG)/SEG);
    function project(pt,camX,camY,camZ){var dz=Math.max(1,pt.z-camZ),sc=CAM_D/dz;return {x:W/2+sc*(pt.x-camX)*W/2,y:H/2-sc*(pt.y-camY)*H/2,w:sc*ROAD*W/2,sc:sc}}
    function poly(x1,y1,w1,x2,y2,w2,col){cx.fillStyle=col;cx.beginPath();cx.moveTo(x1-w1,y1);cx.lineTo(x1+w1,y1);cx.lineTo(x2+w2,y2);cx.lineTo(x2-w2,y2);cx.closePath();cx.fill()}
    var g=cx.createLinearGradient(0,0,0,H/2);g.addColorStop(0,'#120a2e');g.addColorStop(.6,'#5a1e6e');g.addColorStop(1,'#ff5fd2');cx.fillStyle=g;cx.fillRect(0,0,W,H);
    cx.fillStyle='#ffd23f';cx.fillRect(W*.7-34*H/450,H*.2,68*H/450,68*H/450);
    cx.fillStyle='#f2efe6';for(var st=0;st<30;st++)cx.fillRect((st*97)%W,(st*53)%(H*.3),2,2);
    var shift=(me.z*.02+base.curve*40)%42;cx.fillStyle='#0a0a0c';for(var b=0;b<Math.ceil(W/42)+1;b++){var bh=(30+((b*37)%70))*H/450;cx.fillRect(b*42-shift,H/2-bh,30,bh)}
    var x=0,dx=0,maxy=H,camX=me.x*ROAD,sprites=[];
    for(var n=0;n<DRAW;n++){
      var si=(baseI+n)%TL,s=track[si];
      var absZ1=si*SEG,rel1=absZ1-me.z;if(rel1<-SEG)rel1+=TL*SEG;var rel2=rel1+SEG;
      var p1=project({x:x,y:s.y1,z:rel1+me.z},camX,camY,me.z),p2=project({x:x+dx,y:s.y2,z:rel2+me.z},camX,camY,me.z);
      x+=dx;dx+=s.curve;
      if(p2.y>=maxy||p1.y<=p2.y)continue;
      var dark=(si>>1)%2;
      poly(W/2,p1.y,W,W/2,p2.y,W,dark?'#2a2237':'#241d30');
      poly(p1.x,p1.y,p1.w*1.12,p2.x,p2.y,p2.w*1.12,dark?'#ff3b3b':'#f2efe6');
      poly(p1.x,p1.y,p1.w,p2.x,p2.y,p2.w,dark?'#3a3744':'#34313f');
      if(dark)poly(p1.x,p1.y,p1.w*.02,p2.x,p2.y,p2.w*.02,'#f2efe6');
      if(si===0)poly(p1.x,p1.y,p1.w,p2.x,p2.y,p2.w,'#f2efe6');
      if(si===1){for(var ck=0;ck<8;ck++)poly(p1.x+(ck-3.5)*p1.w*.25,p1.y,p1.w*.125,p2.x+(ck-3.5)*p2.w*.25,p2.y,p2.w*.125,ck%2?'#0a0a0c':'#f2efe6')}
      maxy=p2.y;
      items.forEach(function(it){if(((it.z/SEG)|0)%TL===si&&!it.hit)sprites.push({kind:it.t,x:p1.x+it.x*p1.w,y:p1.y,sc:p1.sc,z:n})});
      props.forEach(function(pr){if(pr.seg===si)sprites.push({kind:pr.t,x:p1.x+pr.x*p1.w,y:p1.y,sc:p1.sc,z:n})});
      karts.forEach(function(a){if(a!==me&&((a.z/SEG)|0)%TL===si)sprites.push({kind:'kart',col:a.col,name:a.name,x:p1.x+a.x*p1.w,y:p1.y,sc:p1.sc,z:n,spin:a.spin,human:a.human})});
    }
    sprites.sort(function(a,b){return b.z-a.z}).forEach(function(sp){
      var sz=sp.sc*W*.9;
      if(sp.kind==='boost'){cx.fillStyle='#3cff6e';cx.beginPath();cx.moveTo(sp.x,sp.y-sz*.5);cx.lineTo(sp.x+sz*.3,sp.y);cx.lineTo(sp.x-sz*.3,sp.y);cx.closePath();cx.fill()}
      else if(sp.kind==='oil'){cx.fillStyle='#0a0a0c';cx.beginPath();cx.ellipse(sp.x,sp.y-sz*.05,sz*.35,sz*.12,0,0,7);cx.fill()}
      else if(sp.kind==='palm'){cx.fillStyle='#5a3a1e';cx.fillRect(sp.x-sz*.04,sp.y-sz*1.1,sz*.08,sz*1.1);cx.fillStyle='#1aa84a';for(var k=0;k<5;k++){cx.save();cx.translate(sp.x,sp.y-sz*1.1);cx.rotate(k*1.25-2.5);cx.fillRect(0,-sz*.05,sz*.45,sz*.1);cx.restore()}}
      else if(sp.kind==='lamp'){cx.fillStyle='#8a8a99';cx.fillRect(sp.x-sz*.03,sp.y-sz*1.3,sz*.06,sz*1.3);cx.fillStyle='#ffd23f';cx.fillRect(sp.x-sz*.12,sp.y-sz*1.36,sz*.24,sz*.08)}
      else if(sp.kind==='sign'){cx.fillStyle='#8a8a99';cx.fillRect(sp.x-sz*.03,sp.y-sz*.8,sz*.06,sz*.8);cx.fillStyle='#ff3b3b';cx.fillRect(sp.x-sz*.3,sp.y-sz*1.2,sz*.6,sz*.4);cx.fillStyle='#f2efe6';cx.fillRect(sp.x-sz*.22,sp.y-sz*1.05,sz*.44,sz*.1)}
      else{kart(sp.x,sp.y,sz*.55,sp.col,sp.spin>0?(Date.now()/60)%6.28:0);if(sz>50){cx.fillStyle='rgba(10,10,12,.7)';cx.font='bold 11px Inter,sans-serif';cx.textAlign='center';var tw=cx.measureText(sp.name).width+12;cx.fillRect(sp.x-tw/2,sp.y-sz*.85,tw,16);cx.fillStyle=sp.col;cx.fillText(sp.name,sp.x,sp.y-sz*.85+12)}}
    });
    var inp=me.human?input(me):{},tilt=(inp.L?-1:inp.R?1:0)*.2,ks=110*H/450;
    if(me.boost>0){cx.fillStyle='rgba(60,255,110,.6)';cx.beginPath();cx.moveTo(W/2-ks*.55,H-30);cx.lineTo(W/2-ks*.36,H+10);cx.lineTo(W/2-ks*.18,H-30);cx.fill();cx.beginPath();cx.moveTo(W/2+ks*.18,H-30);cx.lineTo(W/2+ks*.36,H+10);cx.lineTo(W/2+ks*.55,H-30);cx.fill()}
    kart(W/2,H-30*H/450,ks,me.col,me.spin>0?(Date.now()/60)%6.28:tilt);
    cx.fillStyle='rgba(10,10,12,.75)';cx.fillRect(W-150,H-30,140,22);cx.fillStyle='#3a3744';cx.fillRect(W-144,H-25,90,12);cx.fillStyle=me.boost>0?'#3cff6e':'#ffd23f';cx.fillRect(W-144,H-25,Math.min(90,me.v/4800*90),12);
    cx.fillStyle='#f2efe6';cx.font='bold 12px Inter,sans-serif';cx.textAlign='right';cx.fillText(Math.round(me.v/14)+'',W-16,H-15);
    cx.fillStyle='rgba(10,10,12,.75)';cx.fillRect(10,H-30,160,22);cx.fillStyle='#ffd23f';cx.textAlign='left';cx.fillText(me.name+'  P'+me.pos+'/'+karts.length+'  TOUR '+Math.min(LAPS,me.lap)+'/'+LAPS,18,H-15);
    if(me.done){cx.fillStyle='rgba(10,10,12,.55)';cx.fillRect(0,H/2-24,W,48);cx.fillStyle='#3cff6e';cx.font='bold 22px Inter,sans-serif';cx.textAlign='center';cx.fillText('ARRIVÉ '+me.pos+(me.pos===1?'er':'e'),W/2,H/2+8)}
    if(countdown>0){var cn=Math.ceil(countdown),txt=cn>3?'':cn>1?String(cn-1):'GO !';if(txt){cx.fillStyle='rgba(10,10,12,.5)';cx.fillRect(0,H/2-40,W,80);cx.fillStyle=txt==='GO !'?'#3cff6e':'#ffd23f';cx.font='800 '+Math.round(H*.14)+'px Inter,sans-serif';cx.textAlign='center';cx.fillText(txt,W/2,H/2+H*.05)}}
  }
  function kart(x,y,s,col,rot){
    cx.save();cx.translate(x,y);cx.rotate(rot);
    cx.fillStyle='#0a0a0c';cx.fillRect(-s*.55,-s*.1,s*.22,s*.26);cx.fillRect(s*.33,-s*.1,s*.22,s*.26);
    cx.fillStyle='#3a3744';cx.fillRect(-s*.5,-s*.02,s*.12,s*.1);cx.fillRect(s*.38,-s*.02,s*.12,s*.1);
    cx.fillStyle=col;cx.fillRect(-s*.45,-s*.4,s*.9,s*.42);
    cx.fillStyle='#0a0a0c';cx.fillRect(-s*.45,-s*.4,s*.9,s*.06);cx.fillRect(-s*.3,-s*.12,s*.6,s*.05);
    cx.fillStyle='#ff3b3b';cx.fillRect(-s*.4,-s*.08,s*.1,s*.06);cx.fillRect(s*.3,-s*.08,s*.1,s*.06);
    cx.fillStyle='#f2efe6';cx.fillRect(-s*.12,-s*.7,s*.24,s*.3);cx.fillStyle='#0a0a0c';cx.fillRect(-s*.12,-s*.7,s*.24,s*.08);cx.fillRect(-s*.16,-s*.48,s*.32,s*.06);
    cx.restore();
  }
  function draw(){
    if(humans===2){
      [0,1].forEach(function(i){cx.save();cx.beginPath();cx.rect(0,i*CH/2,CW,CH/2);cx.clip();cx.translate(0,i*CH/2);drawView(CW,CH/2,karts[i]);cx.restore()});
      cx.fillStyle='#0b0d12';cx.fillRect(0,CH/2-2,CW,4);
    }else drawView(CW,CH,karts[0]);
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){step(dt);if(running)draw();raf=requestAnimationFrame(loop)}}
  net.on(function(m,from){
    if(PP.cur()!=='kart'||!mp.on())return;
    if(m.t==='kart-go'&&!net.isHost){start();return}
    if(m.t==='rel'&&m.d&&m.d.g==='kart'&&karts){var k=karts.filter(function(q){return q.pid===m.from})[0];if(k){var d=m.d;k.z=d.z;k.x=d.x;k.v=d.v;k.lap=d.lap;k.prog=d.prog;k.done=d.done;k.spin=d.spin}}
  });
  function start(){if(mp.on()&&net.isHost)net.broadcast({t:'kart-go'});reset();$('kt-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
  $('kt-modes').addEventListener('click',function(e){var b=e.target.closest('[data-n]');if(!b)return;humans=+b.dataset.n;$('kt-modes').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x===b)});if(running){running=false;cancelAnimationFrame(raf)}reset();countdown=0;$('kt-title').textContent=humans===2?'Duel en écran partagé':'Pixel Kart';$('kt-msg').textContent=humans===2?'J1 en haut (Z gaz, S frein, Q/D), J2 en bas (↑ gaz, ↓ frein, ←/→). 3 tours, contre 4 karts.':'← → pour tourner, ↑ pour accélérer, ↓ pour freiner. Boosts verts, flaques d\'huile. 3 tours.';$('kt-start').textContent='Démarrer';$('kt-ov').hidden=false;draw();sfx.play('ui')});
  keys=PP.held('kt-pad',{z:'U1',w:'U1',s:'D1',q:'L1',a:'L1',d:'R1',ArrowUp:'U2',ArrowDown:'D2',ArrowLeft:'L2',ArrowRight:'R2'},function(k,e){if(PP.cur()==='kart'&&running&&e.preventDefault)e.preventDefault()});
  $('kt-start').addEventListener('click',start);
  PP.games.kart={open:function(){reset();countdown=0;$('kt-start').hidden=false;$('kt-title').textContent='Pixel Kart';$('kt-start').textContent='Démarrer';$('kt-ov').hidden=false;draw();mp.lobby('kt','Pixel Kart')},close:function(){if(running){running=false;cancelAnimationFrame(raf)}}};
})();
