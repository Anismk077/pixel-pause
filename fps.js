/* Pixel Pause — Bunker 3D : FPS en raycasting. Modes : deathmatch, zombies, battle royale. Grande carte générée. */
(function(){
  'use strict';
  var $=PP.$,sfx=PP.sfx,net=PP.net,mp=PP.mp,online=false,respawnT=0,deaths=0,sendT=0,cv=$('fps-cv'),cx=cv.getContext('2d'),W=cv.width,H=cv.height,CW=(window.innerWidth<800||!matchMedia('(hover:hover)').matches)?4:2,COLS=W/CW,FOV=Math.PI/2.6,TEX=64;
  cx.imageSmoothingEnabled=false;

  /* ---------- Carte générée (toujours la même grâce à la graine) ---------- */
  var MW=32,MH=24,MAP=[];
  function rng(seed){return function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
  function genMap(seed){
    var r=rng(seed),g=[];
    for(var y=0;y<MH;y++){g.push([]);for(var x=0;x<MW;x++)g[y].push((x===0||y===0||x===MW-1||y===MH-1)?'M':'.')}
    function open(){var n=0;for(var y=0;y<MH;y++)for(var x=0;x<MW;x++)if(g[y][x]==='.')n++;return n}
    function connected(){
      var seen={},st=[],total=open(),n=0;
      for(var y=1;y<MH&&!st.length;y++)for(var x=1;x<MW;x++)if(g[y][x]==='.'){st.push([x,y]);break}
      while(st.length){var c=st.pop(),k=c[0]+','+c[1];if(seen[k]||g[c[1]][c[0]]!=='.')continue;seen[k]=1;n++;st.push([c[0]+1,c[1]],[c[0]-1,c[1]],[c[0],c[1]+1],[c[0],c[1]-1])}
      return n===total;
    }
    var types=['M','B','L','M','B'],tries=0;
    while(tries++<400){
      var w=1+Math.floor(r()*4),h=1+Math.floor(r()*4),x0=1+Math.floor(r()*(MW-2-w)),y0=1+Math.floor(r()*(MH-2-h)),t=types[Math.floor(r()*types.length)];
      var backup=[];
      for(var y=y0;y<y0+h;y++)for(var x=x0;x<x0+w;x++){backup.push([x,y,g[y][x]]);g[y][x]=t}
      if(!connected()||open()<MW*MH*.55){backup.forEach(function(b){g[b[1]][b[0]]=b[2]})}
    }
    return g;
  }
  MAP=genMap(20261124);
  function cell(x,y){var r=MAP[y|0];return r?(r[x|0]||'M'):'M'}
  function wall(x,y){return cell(x,y)!=='.'}
  function free(x,y,r){return !(wall(x-r,y-r)||wall(x+r,y-r)||wall(x-r,y+r)||wall(x+r,y+r))}
  var OPEN=[];for(var yy=1;yy<MH-1;yy++)for(var xx=1;xx<MW-1;xx++)if(!wall(xx,yy)&&free(xx+.5,yy+.5,.35))OPEN.push([xx+.5,yy+.5]);

  /* ---------- Textures ---------- */
  function mkTex(fn){var c=document.createElement('canvas');c.width=c.height=TEX;var g=c.getContext('2d');fn(g);return c}
  var TEXS={
    M:mkTex(function(g){g.fillStyle='#3a3d4a';g.fillRect(0,0,TEX,TEX);for(var y=0;y<TEX;y+=16){for(var x=0;x<TEX;x+=16){g.fillStyle=(x+y)%32?'#454858':'#3f4252';g.fillRect(x+1,y+1,14,14);g.fillStyle='#22242c';g.fillRect(x+2,y+2,2,2);g.fillRect(x+12,y+12,2,2)}}g.fillStyle='#22242c';for(var i=0;i<TEX;i+=16){g.fillRect(0,i,TEX,1);g.fillRect(i,0,1,TEX)}}),
    B:mkTex(function(g){g.fillStyle='#5a2a24';g.fillRect(0,0,TEX,TEX);for(var y=0;y<TEX;y+=8){var off=(y/8)%2?8:0;for(var x=-8;x<TEX;x+=16){g.fillStyle=((x+y)%48)?'#8a3d33':'#7a352c';g.fillRect(x+off+1,y+1,14,6)}}}),
    L:mkTex(function(g){g.fillStyle='#1d2a3a';g.fillRect(0,0,TEX,TEX);g.fillStyle='#2b4a6a';g.fillRect(4,4,56,56);g.fillStyle='#3fa9ff';g.fillRect(8,28,48,8);g.fillStyle='#8fd0ff';g.fillRect(8,30,48,2);g.fillStyle='#ffd23f';for(var i=0;i<4;i++)g.fillRect(10+i*13,10,6,6);g.fillStyle='#0a0a0c';g.fillRect(0,0,TEX,2);g.fillRect(0,62,TEX,2)})
  };
  var DARK={};Object.keys(TEXS).forEach(function(k){DARK[k]=mkTex(function(g){g.drawImage(TEXS[k],0,0);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,TEX,TEX)})});

  /* ---------- Sprites ---------- */
  var PAL_BOT={k:'#0a0a0c',y:'#ffd23f',r:'#ff3b3b',w:'#f2efe6',s:'#8a8a99',d:'#5a1e1e'};
  var PAL_ZOMBIE={k:'#0a0a0c',y:'#ffd23f',r:'#9fe36a',w:'#f2efe6',s:'#4f7a3a',d:'#2f4a2a'};
  var BOT=[['.....kkkkkk.....','....kssssssk....','....ksrrrrsk....','....ksrkkrsk....','....ksrrrrsk....','.....kssssk.....','...kkkdddddkkk..','..kdkkdddddkkdk.','..kdk.ddddd.kdk.','..kkk.ddddd.kkk.','......ddddd.....','......dd.dd.....','.....kkk.kkk....','.....kkk.kkk....','....kkk...kkk...','................'],
    ['.....kkkkkk.....','....kssssssk....','....ksrrrrsk....','....ksrkkrsk....','....ksrrrrsk....','.....kssssk.....','...kkkdddddkkk..','..kdkkdddddkkdk.','..kdk.ddddd.kdk.','..kkk.ddddd.kkk.','......ddddd.....','......dd.dd.....','......kk.kk.....','.....kkk.kkk....','.....kk...kk....','................']];
  var ZOM=[['.....kkkkkk.....','....ksssssk.....','....ksrksrsk....','....ksssssk.....','....kssrrrsk....','.....kkkkk......','..kkkdddddk.....','.kdddddddddkk...','.kkkkkddddd.kk..','......ddddd.....','......ddddd.....','......dd.dd.....','.....kkk.kkk....','.....kkk.kkk....','....kkk...kkk...','................'],
    ['.....kkkkkk.....','....ksssssk.....','....ksrksrsk....','....ksssssk.....','....kssrrrsk....','.....kkkkk......','.....kdddddkkk..','...kkdddddddddk.','..kk.ddddd.kkkk.','......ddddd.....','......ddddd.....','......dd.dd.....','......kk.kk.....','.....kkk.kkk....','.....kk...kk....','................']];
  var MED=['................','................','....kkkkkkkk....','...kwwwwwwwwk...','...kwwwkkwwwk...','...kwwwkkwwwk...','...kwkkkkkkwk...','...kwkkkkkkwk...','...kwwwkkwwwk...','...kwwwkkwwwk...','...kwwwwwwwwk...','....kkkkkkkk....','................','................','................','................'];
  var DEAD=['................','................','................','................','................','................','................','................','................','..kkkkk.........','.ksssssk..kkk...','ksrrrrrskkdddk..','ksrkkkrskddddk..','ksrrrrrsk.dd.k..','.ksssssk.kkkkk..','..kkkkk.........'];
  function mkSprite(rows,pal,tint){var c=document.createElement('canvas');c.width=c.height=16;var g=c.getContext('2d');rows.forEach(function(r,y){for(var x=0;x<16;x++){var ch=r[x];if(ch==='.')continue;g.fillStyle=tint||pal[ch]||'#f2efe6';g.fillRect(x,y,1,1)}});return c}
  var SP={bot:[mkSprite(BOT[0],PAL_BOT),mkSprite(BOT[1],PAL_BOT)],zom:[mkSprite(ZOM[0],PAL_ZOMBIE),mkSprite(ZOM[1],PAL_ZOMBIE)],hit:mkSprite(BOT[0],PAL_BOT,'#f2efe6'),zhit:mkSprite(ZOM[0],PAL_ZOMBIE,'#f2efe6'),med:mkSprite(MED,PAL_BOT),dead:mkSprite(DEAD,PAL_BOT),zdead:mkSprite(DEAD,PAL_ZOMBIE)};

  /* ---------- État ---------- */
  var mode='dm',p,bots,meds,running=false,raf=0,last=0,time,kills,hp,flash,recoil,fireCd,keys={},mouseDown=false,locked=false,zb=new Float32Array(COLS),bob=0,hitMark=0,shots=0,hits=0,parts=[],tracer=0,pitch=0;
  var wave,waveT,zone,alive,place,best={};
  ['dm','zombie','br'].forEach(function(m){best[m]=PP.store('fps-'+m)});
  function showBest(){$('fps-best').textContent=mode==='br'?(best.br?'Top '+best.br:'—'):best[mode]}
  function spawnPt(far){var s,n=0;do{s=PP.pick(OPEN);n++}while(p&&Math.hypot(s[0]-p.x,s[1]-p.y)<(far||6)&&n<40);return {x:s[0],y:s[1]}}
  function makeBot(kind,hpv){var s=spawnPt(kind==='zombie'?9:6);return {kind:kind||'bot',x:s.x,y:s.y,a:Math.random()*6.28,hp:hpv||100,cd:1.2+Math.random(),dead:0,wander:0,hit:0,anim:Math.random()*10,flash:0,strafe:1,speed:kind==='zombie'?1.1+Math.random()*.5:1.7}}
  function reset(){
    var s=PP.pick(OPEN);p={x:s[0],y:s[1],a:0};
    var dirs=[0,Math.PI/2,Math.PI,-Math.PI/2].filter(function(an){return !wall(s[0]+Math.cos(an)*2.5,s[1]+Math.sin(an)*2.5)});p.a=dirs.length?PP.pick(dirs):0;
    hp=100;kills=0;flash=0;recoil=0;fireCd=0;bob=0;hitMark=0;shots=0;hits=0;parts=[];tracer=0;pitch=0;
    bots=[];meds=[];wave=0;waveT=0;zone=null;alive=0;place=0;respawnT=0;deaths=0;
    if(online){time=180;for(var q=0;q<3;q++)meds.push(spawnPt());bots=net.players.filter(function(o){return o.id!==net.me.id}).map(function(o){return {kind:'net',pid:o.id,name:o.name,x:-50,y:-50,a:0,hp:100,dead:0,hit:0,anim:0,flash:0,k:0}});hud();return}
    if(mode==='dm'){time=180;for(var i=0;i<6;i++)bots.push(makeBot('bot'));for(var j=0;j<3;j++)meds.push(spawnPt())}
    if(mode==='zombie'){time=0;waveT=2;for(var k=0;k<2;k++)meds.push(spawnPt())}
    if(mode==='br'){time=0;for(var b=0;b<9;b++)bots.push(makeBot('bot',100));for(var m=0;m<4;m++)meds.push(spawnPt());var c=PP.pick(OPEN);zone={x:c[0],y:c[1],r:26,target:26,t:20};alive=10}
    hud();
  }
  function hud(){
    $('fps-hp').textContent=Math.max(0,Math.ceil(hp));
    if(mode==='dm'){$('fps-l1').innerHTML='Frags <b id="fps-kills">'+kills+'</b>';$('fps-l2').innerHTML='Temps <b id="fps-time">'+PP.fmtTime(time)+'</b>'}
    if(mode==='zombie'){$('fps-l1').innerHTML='Zombies <b>'+kills+'</b>';$('fps-l2').innerHTML='Vague <b>'+wave+'</b>'}
    if(mode==='br'){$('fps-l1').innerHTML='Frags <b>'+kills+'</b>';$('fps-l2').innerHTML='En vie <b>'+alive+'</b>'}
  }
  function los(ax,ay,bx,by){var d=Math.hypot(bx-ax,by-ay),n=Math.ceil(d*6);for(var i=1;i<n;i++){var t=i/n;if(wall(ax+(bx-ax)*t,ay+(by-ay)*t))return false}return true}
  function inZone(x,y){return !zone||Math.hypot(x-zone.x,y-zone.y)<=zone.r}

  function nextWave(){
    wave++;waveT=0;var n=3+wave*2,hpv=50+wave*10;
    for(var i=0;i<n;i++)bots.push(makeBot('zombie',hpv));
    if(wave>1)meds.push(spawnPt());
    sfx.play('go');PP.toast('Vague '+wave+' : '+n+' zombies','warn');
  }

  function step(dt){
    time+=mode==='dm'?-dt:dt;
    if(mode==='dm'){if(time<=0){time=0;return end('Temps écoulé !')}if(time<10&&Math.floor(time)!==Math.floor(time+dt))sfx.play('tick')}
    if(online){sendT-=dt;if(sendT<=0){sendT=.066;net.relay({g:'fps',x:+p.x.toFixed(2),y:+p.y.toFixed(2),a:+p.a.toFixed(2),dead:respawnT>0,k:kills})}
      bots.forEach(function(b){b.anim+=dt*6;b.hit=Math.max(0,b.hit-dt*5)});
      if(respawnT>0){respawnT-=dt;flash=Math.max(flash-dt*2,.3);if(respawnT<=0){var sp0=spawnPt(5);p.x=sp0.x;p.y=sp0.y;hp=100;flash=0}hud();return}}
    if(mode==='zombie'){var left=bots.filter(function(b){return b.dead<=0}).length;if(!left){waveT-=dt;if(waveT<=0)nextWave()}}
    if(mode==='br'){
      zone.t-=dt;if(zone.t<=0){zone.target=Math.max(2.5,zone.target*.68);zone.t=16;sfx.play('tick');PP.toast('La zone rétrécit','warn')}
      zone.r+=(zone.target-zone.r)*Math.min(1,dt*.6);
      if(!inZone(p.x,p.y)){hp-=dt*9;flash=Math.max(flash,.35);if(hp<=0)return end('Mort hors de la zone.')}
      var al=1;bots.forEach(function(b){if(b.dead<=0)al++});if(al!==alive){alive=al}
      if(alive===1)return end('Victoire royale ! Dernier debout.');
    }
    flash=Math.max(0,flash-dt*3);recoil=Math.max(0,recoil-dt*8);fireCd=Math.max(0,fireCd-dt);hitMark=Math.max(0,hitMark-dt*5);tracer=Math.max(0,tracer-dt*12);
    var rot=(keys.L?-1:0)+(keys.R?1:0);p.a+=rot*2.4*dt;
    var mv=(keys.F?1:0)-(keys.B?1:0),st=(keys.SR?1:0)-(keys.SL?1:0),sp=3.4*dt;
    if(mv||st)bob+=dt*9;
    var dx=(Math.cos(p.a)*mv+Math.cos(p.a+Math.PI/2)*st)*sp,dy=(Math.sin(p.a)*mv+Math.sin(p.a+Math.PI/2)*st)*sp;
    if(free(p.x+dx,p.y,.25))p.x+=dx;if(free(p.x,p.y+dy,.25))p.y+=dy;
    if((keys.S||mouseDown)&&fireCd<=0)fire();
    for(var bi=0;bi<bots.length;bi++){
      var b=bots[bi];
      if(b.kind==='net')continue;
      b.anim+=dt*(b.kind==='zombie'?4:6);b.flash=Math.max(0,b.flash-dt*6);b.hit=Math.max(0,b.hit-dt*5);
      if(b.dead>0){b.dead-=dt;if(b.dead<=0){if(mode==='dm'){var nb=makeBot('bot');b.x=nb.x;b.y=nb.y;b.hp=100;b.a=nb.a}else b.dead=999}continue}
      if(mode==='br'&&!inZone(b.x,b.y)){b.hp-=dt*12;if(b.hp<=0){b.dead=999;continue}}
      // cible : le joueur, ou en battle royale le plus proche (joueur ou bot)
      var tx=p.x,ty=p.y,tgt=null;
      if(mode==='br'){var bd=Math.hypot(p.x-b.x,p.y-b.y);for(var oj=0;oj<bots.length;oj++){var o=bots[oj];if(o===b||o.dead>0)continue;var od=Math.hypot(o.x-b.x,o.y-b.y);if(od<bd){bd=od;tgt=o;tx=o.x;ty=o.y}}}
      var d=Math.hypot(tx-b.x,ty-b.y),see=d<(b.kind==='zombie'?14:10)&&los(b.x,b.y,tx,ty);
      if(b.kind==='zombie'){
        if(see||d<3){b.a=Math.atan2(ty-b.y,tx-b.x)}
        else{b.wander-=dt;if(b.wander<=0){b.wander=.8+Math.random()*1.5;b.a=Math.atan2(p.y-b.y,p.x-b.x)+(Math.random()-.5)*1.5}}
        if(d<.9){b.cd-=dt;if(b.cd<=0){b.cd=.9;b.flash=1;hp-=8+wave*1.5;flash=1;sfx.play('hurt');if(hp<=0)return end('Dévoré à la vague '+wave+'.')}}
        else{var zs=b.speed*dt,nx=b.x+Math.cos(b.a)*zs,ny=b.y+Math.sin(b.a)*zs;if(free(nx,b.y,.3))b.x=nx;else b.a+=1.3;if(free(b.x,ny,.3))b.y=ny;else b.a+=1.3}
        continue;
      }
      if(see){
        b.a=Math.atan2(ty-b.y,tx-b.x);b.cd-=dt;
        if(b.cd<=0){b.cd=1+Math.random()*.9;b.flash=1;var chance=Math.max(.2,.9-d/11);
          if(Math.random()<chance){if(tgt){tgt.hp-=25;tgt.hit=1;if(tgt.hp<=0)tgt.dead=999}else{hp-=10+Math.random()*8;flash=1;sfx.play('hurt');if(hp<=0)return end(mode==='br'?'Éliminé. Place : '+alive+'e sur 10.':'Tu es tombé.')}}}
      }else{
        b.wander-=dt;if(b.wander<=0){b.wander=1+Math.random()*2;b.a=(mode==='br'&&!inZone(b.x,b.y))?Math.atan2(zone.y-b.y,zone.x-b.x):b.a+(Math.random()-.5)*2.5}
      }
      var want=see?Math.max(0,d-2.5):1,bs=b.speed*(see?1:.65)*dt,ang=b.a;
      if(see&&d<4){ang=b.a+Math.PI/2*b.strafe;if(Math.random()<dt*.6)b.strafe*=-1;want=1}
      if(mode==='br'&&zone.r<6&&!see){ang=Math.atan2(zone.y-b.y,zone.x-b.x);want=1}
      if(want>0){var nx2=b.x+Math.cos(ang)*bs,ny2=b.y+Math.sin(ang)*bs;if(free(nx2,b.y,.3))b.x=nx2;else{b.a+=1.5;b.strafe*=-1}if(free(b.x,ny2,.3))b.y=ny2;else{b.a+=1.5;b.strafe*=-1}}
    }
    meds.forEach(function(m,i){if(Math.hypot(m.x-p.x,m.y-p.y)<.6){hp=Math.min(100,hp+50);meds[i]=spawnPt();sfx.play('pickup')}});
    parts.forEach(function(q){q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=dt*600});parts=parts.filter(function(q){return q.t>0});
    hud();
  }
  function fire(){
    fireCd=.26;recoil=1;shots++;tracer=1;sfx.play('shoot');
    var bestB=null,bd=99;
    bots.forEach(function(b){if(b.dead>0)return;var d=Math.hypot(b.x-p.x,b.y-p.y),ang=Math.atan2(b.y-p.y,b.x-p.x)-p.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
      if(Math.abs(ang)<Math.atan2(.45,d)&&d<bd&&los(p.x,p.y,b.x,b.y)){bestB=b;bd=d}});
    if(bestB&&bestB.kind==='net'){bestB.hit=1;hits++;hitMark=1;sfx.play('hit');net.relay({g:'fps',hit:bestB.pid,dmg:34})}
    else if(bestB){bestB.hp-=40;bestB.hit=1;hits++;hitMark=1;
      for(var i=0;i<6;i++)parts.push({x:W/2+(Math.random()-.5)*30,y:H/2+(Math.random()-.5)*30,vx:(Math.random()-.5)*300,vy:-Math.random()*300,t:.4,c:bestB.kind==='zombie'?'#9fe36a':'#ff3b3b'});
      if(bestB.hp<=0){bestB.dead=mode==='dm'?3.5:999;kills++;hud();sfx.play('kill')}else sfx.play('hit')}
  }
  function end(msg){
    running=false;cancelAnimationFrame(raf);unlock();
    var score=mode==='dm'?kills:mode==='zombie'?kills:alive,better=false;
    if(mode==='br'){if(!best.br||alive<best.br){best.br=alive;PP.store('fps-br',alive);better=true}}
    else if(score>best[mode]){best[mode]=score;PP.store('fps-'+mode,score);better=true;PP.refreshHi()}
    showBest();if(better)msg+=' Nouveau record !';
    var won=mode==='br'?alive===1:hp>0;sfx.play(won?'win':'lose');
    $('fps-title').textContent=won?(mode==='br'?'Victoire !':'Fin du round'):'Game over';
    var stats=mode==='zombie'?kills+' zombie'+(kills>1?'s':'')+' · vague '+wave:mode==='br'?kills+' frag'+(kills>1?'s':''):kills+' frag'+(kills>1?'s':'')+' en '+PP.fmtTime(180-time);
    $('fps-msg').innerHTML=PP.esc(msg)+'<br><b>'+stats+'</b> · précision '+(shots?Math.round(hits/shots*100):0)+' %';
    $('fps-start').textContent='Rejouer';$('fps-ov').hidden=false;$('fps-lockhint').hidden=true;draw();
    if(online){var rows=[{n:net.me.name,k:kills,me:1}].concat(bots.map(function(b){return {n:b.name,k:b.k||0}})).sort(function(a,b){return b.k-a.k});
      $('fps-title').textContent=rows[0].me?'Tu gagnes le deathmatch !':rows[0].n+' gagne le deathmatch';
      $('fps-msg').innerHTML=rows.map(function(r,i){return (i+1)+'. '+PP.esc(r.n)+' — '+r.k+' frag'+(r.k>1?'s':'')}).join('<br>')+'<br><small>Tu es mort '+deaths+' fois · précision '+(shots?Math.round(hits/shots*100):0)+' %</small>';
      $('fps-start').hidden=!net.isHost;$('fps-start').textContent='Relancer pour tout le salon'}
  }

  /* ---------- Rendu ---------- */
  function draw(){
    var bobY=Math.sin(bob)*4,horizon=H/2+bobY+pitch;
    var g=cx.createLinearGradient(0,0,0,Math.max(1,horizon));g.addColorStop(0,'#07070a');g.addColorStop(1,'#1a1922');cx.fillStyle=g;cx.fillRect(0,0,W,Math.max(0,horizon));
    var f=cx.createLinearGradient(0,horizon,0,H);f.addColorStop(0,'#1c1b24');f.addColorStop(.5,'#2a2834');f.addColorStop(1,'#3a3746');cx.fillStyle=f;cx.fillRect(0,Math.max(0,horizon),W,H);
    cx.strokeStyle='rgba(0,0,0,.25)';cx.lineWidth=1;for(var k=1;k<10;k++){var yy=horizon+(H/2)/(k*.9);cx.beginPath();cx.moveTo(0,yy|0);cx.lineTo(W,yy|0);cx.stroke()}
    for(var c=0;c<COLS;c++){
      var ra=p.a-FOV/2+(c/COLS)*FOV,rdx=Math.cos(ra),rdy=Math.sin(ra);
      var mx=p.x|0,my=p.y|0,ddx=Math.abs(1/rdx),ddy=Math.abs(1/rdy),sx,sy,sdx,sdy,side=0;
      if(rdx<0){sx=-1;sdx=(p.x-mx)*ddx}else{sx=1;sdx=(mx+1-p.x)*ddx}
      if(rdy<0){sy=-1;sdy=(p.y-my)*ddy}else{sy=1;sdy=(my+1-p.y)*ddy}
      for(var n=0;n<80;n++){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0}else{sdy+=ddy;my+=sy;side=1}if(wall(mx,my))break}
      var dist=(side?(sdy-ddy):(sdx-ddx))*Math.cos(ra-p.a);zb[c]=dist;
      var h=Math.min(H*4,H/Math.max(.05,dist)),y0=horizon-h/2;
      var wx=side?p.x+(sdy-ddy)*rdx:p.y+(sdx-ddx)*rdy;wx-=Math.floor(wx);
      var tex=(side?DARK:TEXS)[cell(mx,my)]||TEXS.M,tx=(wx*TEX)|0;
      cx.drawImage(tex,tx,0,1,TEX,c*CW,y0,CW,h);
      var fog=Math.min(.85,dist/16);if(fog>.05){cx.fillStyle='rgba(7,7,10,'+fog+')';cx.fillRect(c*CW,y0,CW,h)}
    }
    var sp=[];
    bots.forEach(function(b){if(b.dead>=999&&b.deadT===undefined)b.deadT=1;var z=b.kind==='zombie';sp.push({name:b.kind==='net'?b.name:null,x:b.x,y:b.y,img:b.dead>0?(z?SP.zdead:SP.dead):(b.hit>.5?(z?SP.zhit:SP.hit):(z?SP.zom:SP.bot)[(b.anim|0)%2]),sz:b.dead>0?.9:1,flash:b.flash>.7&&!z})});
    meds.forEach(function(m){sp.push({x:m.x,y:m.y,img:SP.med,sz:.5})});
    sp.forEach(function(s){s.d=Math.hypot(s.x-p.x,s.y-p.y)});
    sp.sort(function(a,b){return b.d-a.d}).forEach(function(s){
      if(s.d>18)return;
      var ang=Math.atan2(s.y-p.y,s.x-p.x)-p.a;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
      if(Math.abs(ang)>FOV/2+.35)return;
      var d=s.d*Math.cos(ang),size=Math.min(H*3,H/Math.max(.05,d))*s.sz,scx=(ang/FOV+.5)*W,x0=scx-size/2,y0=horizon+H/Math.max(.05,d)*.5-size,px=size/16;
      for(var i=0;i<16;i++){var xx=x0+i*px,col=(xx/CW)|0;if(col<0||col>=COLS||zb[col]<d)continue;cx.drawImage(s.img,i,0,1,16,xx,y0,px+.5,size)}
      if(s.name&&size>18&&zb[Math.max(0,Math.min(COLS-1,(scx/CW)|0))]>=d){cx.font='bold 13px Inter,sans-serif';cx.textAlign='center';var tw=cx.measureText(s.name).width+12;cx.fillStyle='rgba(11,13,18,.75)';cx.fillRect(scx-tw/2,y0-22,tw,18);cx.fillStyle='#fff';cx.fillText(s.name,scx,y0-9)}
      if(s.flash){cx.fillStyle='rgba(255,210,63,.9)';cx.beginPath();cx.arc(scx-size*.1,y0+size*.55,size*.08,0,7);cx.fill()}
    });
    if(tracer>0){cx.strokeStyle='rgba(255,210,63,'+tracer+')';cx.lineWidth=2;cx.beginPath();cx.moveTo(W/2+67,H-104+recoil*26);cx.lineTo(W/2,H/2);cx.stroke()}
    var gx=W/2+30,gy=H-120+recoil*26+bobY*1.5,gxo=Math.sin(bob/2)*6;
    cx.fillStyle='#15141c';cx.fillRect(gx+gxo-10,gy+40,120,120);
    cx.fillStyle='#2b2a36';cx.fillRect(gx+gxo,gy+10,70,52);cx.fillStyle='#3d3c4c';cx.fillRect(gx+gxo+6,gy+16,58,14);
    cx.fillStyle='#0a0a0c';cx.fillRect(gx+gxo+20,gy-14,34,30);cx.fillStyle='#ffd23f';cx.fillRect(gx+gxo+26,gy-8,22,6);cx.fillStyle='#3fa9ff';cx.fillRect(gx+gxo+8,gy+36,16,6);
    cx.fillStyle='#0a0a0c';cx.fillRect(gx+gxo-10,gy+40,120,5);
    if(recoil>.55){cx.fillStyle='rgba(255,210,63,.95)';cx.beginPath();cx.arc(gx+gxo+37,gy-24,16+Math.random()*12,0,7);cx.fill();cx.fillStyle='rgba(255,255,255,.9)';cx.beginPath();cx.arc(gx+gxo+37,gy-24,7,0,7);cx.fill()}
    parts.forEach(function(q){cx.fillStyle=q.c;cx.fillRect(q.x,q.y,4,4)});
    cx.strokeStyle=hitMark>0?'#ff3b3b':'#3cff6e';cx.lineWidth=2;var cr=hitMark>0?12:9;
    cx.beginPath();cx.moveTo(W/2-cr,H/2);cx.lineTo(W/2-4,H/2);cx.moveTo(W/2+4,H/2);cx.lineTo(W/2+cr,H/2);cx.moveTo(W/2,H/2-cr);cx.lineTo(W/2,H/2-4);cx.moveTo(W/2,H/2+4);cx.lineTo(W/2,H/2+cr);cx.stroke();
    if(hitMark>0){cx.beginPath();cx.moveTo(W/2-14,H/2-14);cx.lineTo(W/2-8,H/2-8);cx.moveTo(W/2+14,H/2-14);cx.lineTo(W/2+8,H/2-8);cx.moveTo(W/2-14,H/2+14);cx.lineTo(W/2-8,H/2+8);cx.moveTo(W/2+14,H/2+14);cx.lineTo(W/2+8,H/2+8);cx.stroke()}
    if(flash>0){var rg=cx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.8);rg.addColorStop(0,'rgba(255,59,59,0)');rg.addColorStop(1,'rgba(255,59,59,'+flash*.7+')');cx.fillStyle=rg;cx.fillRect(0,0,W,H)}
    if(zone&&!inZone(p.x,p.y)){cx.fillStyle='rgba(63,169,255,.18)';cx.fillRect(0,0,W,H)}
    // HUD
    cx.fillStyle='rgba(10,10,12,.75)';cx.fillRect(10,H-34,150,24);cx.fillStyle=hp>40?'#3cff6e':'#ff3b3b';cx.fillRect(14,H-30,Math.max(0,hp)*1.42,16);
    cx.fillStyle='#f2efe6';cx.font='10px "Press Start 2P",monospace';cx.textAlign='left';cx.textBaseline='middle';cx.fillText(Math.max(0,Math.ceil(hp))+'',168,H-22);
    cx.fillStyle='rgba(10,10,12,.75)';cx.fillRect(W-190,H-34,180,24);cx.fillStyle='#ffd23f';cx.textAlign='right';
    var hudTxt=mode==='dm'?PP.fmtTime(time)+'  '+kills+'F':mode==='zombie'?'VAGUE '+wave+'  '+kills+'Z':'ZONE '+Math.ceil(zone.t)+'s  '+alive+' EN VIE';
    cx.fillText(hudTxt,W-16,H-22);
    if(mode==='zombie'&&!bots.some(function(b){return b.dead<=0})&&wave>0){cx.fillStyle='rgba(10,10,12,.6)';cx.fillRect(0,H/2-40,W,60);cx.fillStyle='#9fe36a';cx.font='16px "Press Start 2P",monospace';cx.textAlign='center';cx.fillText('VAGUE '+(wave+1)+' DANS '+Math.ceil(waveT)+'S',W/2,H/2-10)}
    if(zone){var za=Math.atan2(zone.y-p.y,zone.x-p.x)-p.a;za=Math.atan2(Math.sin(za),Math.cos(za));if(!inZone(p.x,p.y)){cx.fillStyle='#3fa9ff';cx.font='12px "Press Start 2P",monospace';cx.textAlign='center';cx.fillText('HORS ZONE '+(za<-.3?'←':za>.3?'→':'↑'),W/2,40)}}
    // minimap
    var ms=3,mx0=W-MW*ms-10,my0=10;cx.fillStyle='rgba(0,0,0,.6)';cx.fillRect(mx0-2,my0-2,MW*ms+4,MH*ms+4);
    for(var y=0;y<MH;y++)for(var x=0;x<MW;x++)if(MAP[y][x]!=='.'){cx.fillStyle=MAP[y][x]==='B'?'#7a352c':MAP[y][x]==='L'?'#2b4a6a':'#55525f';cx.fillRect(mx0+x*ms,my0+y*ms,ms,ms)}
    if(zone){cx.strokeStyle='#3fa9ff';cx.lineWidth=1.5;cx.beginPath();cx.arc(mx0+zone.x*ms,my0+zone.y*ms,zone.r*ms,0,7);cx.stroke();cx.strokeStyle='rgba(63,169,255,.4)';cx.beginPath();cx.arc(mx0+zone.x*ms,my0+zone.y*ms,zone.target*ms,0,7);cx.stroke()}
    bots.forEach(function(b){if(b.dead<=0){cx.fillStyle=b.kind==='zombie'?'#9fe36a':'#ff3b3b';cx.fillRect(mx0+b.x*ms-2,my0+b.y*ms-2,4,4)}});
    meds.forEach(function(m){cx.fillStyle='#f2efe6';cx.fillRect(mx0+m.x*ms-1,my0+m.y*ms-1,3,3)});
    cx.fillStyle='#3cff6e';cx.fillRect(mx0+p.x*ms-2,my0+p.y*ms-2,4,4);cx.strokeStyle='#3cff6e';cx.beginPath();cx.moveTo(mx0+p.x*ms,my0+p.y*ms);cx.lineTo(mx0+p.x*ms+Math.cos(p.a)*7,my0+p.y*ms+Math.sin(p.a)*7);cx.stroke();
    cx.textBaseline='alphabetic';
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){step(dt);if(running)draw();raf=requestAnimationFrame(loop)}}
  net.on(function(m){
    if(PP.cur()!=='fps'||!mp.on())return;
    if(m.t==='fps-go'&&!net.isHost){start();return}
    if(m.t!=='rel'||!m.d||m.d.g!=='fps')return;
    var d=m.d,b=bots.filter(function(q){return q.pid===m.from})[0];
    if(d.x!==undefined&&b){b.x=d.x;b.y=d.y;b.a=d.a;b.dead=d.dead?1:0;b.k=d.k}
    if(d.hit===net.me.id&&running&&respawnT<=0){hp-=d.dmg;flash=1;sfx.play('hurt');if(hp<=0){hp=0;deaths++;respawnT=2.5;net.relay({g:'fps',killed:net.me.id,by:m.from});PP.toast('Éliminé par '+(b?b.name:'?'),'warn')}}
    if(d.killed&&d.by===net.me.id){kills++;sfx.play('kill');var v=bots.filter(function(q){return q.pid===d.killed})[0];PP.toast('Tu as éliminé '+(v?v.name:'?'),'ok');hud()}
  });
  function start(){online=mp.on();if(online){mode='dm';$('fps-start').hidden=false;if(net.isHost)net.broadcast({t:'fps-go'})}reset();$('fps-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);lock();sfx.play('go');if(mode==='zombie')PP.toast('Les zombies arrivent','warn')}

  /* ---------- Modes ---------- */
  $('fps-modes').addEventListener('click',function(e){
    var b=e.target.closest('[data-m]');if(!b)return;
    mode=b.dataset.m;$('fps-modes').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x===b)});
    if(running){running=false;cancelAnimationFrame(raf)}
    reset();showBest();$('fps-title').textContent={dm:'Deathmatch',zombie:'Zombies',br:'Battle royale'}[mode];
    $('fps-msg').textContent={dm:'3 minutes contre 6 bots qui réapparaissent. Fais le maximum de frags.',zombie:'Des vagues de zombies de plus en plus nombreuses et résistantes. Ils mordent de près : garde tes distances et ramasse les kits de soin.',br:'10 combattants, une zone qui rétrécit toutes les 16 secondes. Hors zone, tu perds de la vie. Dernier debout gagne.'}[mode];
    $('fps-start').textContent='Jouer';$('fps-ov').hidden=false;draw();sfx.play('ui');
  });

  /* ---------- Souris, tactile, clavier ---------- */
  function lock(){if(cv.requestPointerLock&&matchMedia('(hover:hover)').matches)try{var r=cv.requestPointerLock();if(r&&r.catch)r.catch(function(){})}catch(e){}}
  function unlock(){if(document.pointerLockElement===cv&&document.exitPointerLock)document.exitPointerLock()}
  function look(dx,dy){p.a+=dx*.0032;pitch=Math.max(-H*.45,Math.min(H*.45,pitch-dy*.5))}
  document.addEventListener('pointerlockchange',function(){locked=document.pointerLockElement===cv;$('fps-lockhint').hidden=locked||!running||!matchMedia('(hover:hover)').matches});
  document.addEventListener('mousemove',function(e){if(locked&&running)look(e.movementX,e.movementY)});
  var drag=null;
  cv.addEventListener('mousedown',function(e){if(e.button!==0||!running)return;if(!locked){lock();drag={x:e.clientX,y:e.clientY}}mouseDown=true});
  document.addEventListener('mousemove',function(e){if(drag&&!locked&&running){look((e.clientX-drag.x)*2,(e.clientY-drag.y)*2);drag={x:e.clientX,y:e.clientY}}});
  document.addEventListener('mouseup',function(){mouseDown=false;drag=null});
  cv.addEventListener('touchstart',function(e){if(!running)return;var t=e.touches[0];drag={x:t.clientX,y:t.clientY};e.preventDefault()},{passive:false});
  cv.addEventListener('touchmove',function(e){if(!drag||!running)return;var t=e.touches[0];look((t.clientX-drag.x)*2.2,(t.clientY-drag.y)*2.2);drag={x:t.clientX,y:t.clientY};e.preventDefault()},{passive:false});
  cv.addEventListener('touchend',function(){drag=null});
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  var KM={z:'F',w:'F',ArrowUp:'F',s:'B',ArrowDown:'B',q:'SL',a:'SL',d:'SR',ArrowLeft:'L',ArrowRight:'R',' ':'S'};
  keys=PP.held('fps-pad',KM,function(k,e){if(PP.cur()==='fps'&&running&&e.preventDefault)e.preventDefault()});
  document.addEventListener('keydown',function(e){if(PP.cur()==='fps'&&running&&(e.key===' '||e.key.indexOf('Arrow')===0))e.preventDefault()});
  $('fps-start').addEventListener('click',start);
  PP._fps=function(){return {p:p,bots:bots,zone:zone,setMode:function(m){mode=m}}};
  PP.games.fps={open:function(){reset();showBest();$('fps-title').textContent='Bunker 3D';$('fps-start').textContent='Entrer dans le bunker';$('fps-ov').hidden=false;$('fps-lockhint').hidden=true;draw();if(mp.lobby('fps','Deathmatch en ligne')){online=true;mode='dm'}else{online=false;$('fps-start').hidden=false}},close:function(){if(running){running=false;cancelAnimationFrame(raf)}unlock()}};
})();
