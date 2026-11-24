/* Pixel Pause — Néon Rush 3D : course sans fin en 3e personne (three.js), solo ou en salon */
(function(){
  'use strict';
  var $=PP.$,sfx=PP.sfx,net=PP.net,mp=PP.mp,others={},sendT=0,cv=$('rn-cv');
  var LX=[-2.2,0,2.2],running=false,raf=0,last=0,ready=false;
  var renderer,scene,camera,player,parts={},roadTex,objs=[],builds=[],sparks=[];
  var lane,laneX,jumpT,slideT,y,speed,dist,coins,spawnZ,dead,runT;
  $('rn-best').textContent=PP.store('rn-best');

  /* ---------- Textures ---------- */
  function canvasTex(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}
  function init(){
    if(ready)return true;
    if(!window.THREE){PP.toast('La 3D (three.js) n\'a pas pu se charger','warn');return false}
    renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});renderer.setSize(cv.width,cv.height,false);
    scene=new THREE.Scene();scene.background=new THREE.Color(0x07060d);scene.fog=new THREE.Fog(0x07060d,18,70);
    camera=new THREE.PerspectiveCamera(62,cv.width/cv.height,.1,120);
    scene.add(new THREE.HemisphereLight(0x8a7cff,0x120a20,.8));
    var key=new THREE.DirectionalLight(0xffffff,.8);key.position.set(3,8,6);scene.add(key);
    // route
    roadTex=canvasTex(256,512,function(g,w,h){g.fillStyle='#16131f';g.fillRect(0,0,w,h);g.fillStyle='#1d1930';for(var i=0;i<8;i++)g.fillRect(0,i*64,w,30);
      g.fillStyle='#3fa9ff';[w/3,2*w/3].forEach(function(x){for(var y=0;y<h;y+=64)g.fillRect(x-3,y,6,34)});g.fillStyle='#e2361b';g.fillRect(0,0,6,h);g.fillRect(w-6,0,6,h)});
    roadTex.wrapS=roadTex.wrapT=THREE.RepeatWrapping;roadTex.repeat.set(1,10);
    var road=new THREE.Mesh(new THREE.PlaneGeometry(7.2,140),new THREE.MeshStandardMaterial({map:roadTex,roughness:.6,emissive:0x111122,emissiveMap:roadTex,emissiveIntensity:.6}));road.rotation.x=-Math.PI/2;road.position.z=-60;scene.add(road);
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x0b0916}));ground.rotation.x=-Math.PI/2;ground.position.y=-.02;ground.position.z=-60;scene.add(ground);
    // immeubles
    var winTex=canvasTex(64,128,function(g,w,h){g.fillStyle='#120f20';g.fillRect(0,0,w,h);for(var y=6;y<h;y+=12)for(var x=6;x<w;x+=12){var r=Math.random();g.fillStyle=r<.15?'#ffd23f':r<.3?'#3fa9ff':r<.38?'#ff3fb5':'#1c1830';g.fillRect(x,y,6,6)}});
    for(var i=0;i<26;i++){[-1,1].forEach(function(side){
      var hgt=6+Math.random()*16,w=3+Math.random()*3,m=new THREE.Mesh(new THREE.BoxGeometry(w,hgt,4),new THREE.MeshStandardMaterial({map:winTex,emissive:0xffffff,emissiveMap:winTex,emissiveIntensity:.9,color:0x222033}));
      m.position.set(side*(7+w/2+Math.random()*2),hgt/2,-i*5.5);scene.add(m);builds.push(m);
      var edge=new THREE.Mesh(new THREE.BoxGeometry(w+.1,.12,4.1),new THREE.MeshBasicMaterial({color:Math.random()<.5?0x3fa9ff:0xff3fb5}));edge.position.y=hgt/2;m.add(edge);
    })}
    // joueur
    player=new THREE.Group();
    var suit=new THREE.MeshStandardMaterial({color:0x3fa9ff,roughness:.4,emissive:0x0a2a55}),dark=new THREE.MeshStandardMaterial({color:0x141210}),skin=new THREE.MeshStandardMaterial({color:0xf2d2b6});
    parts.body=new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.45),suit);parts.body.position.y=1.15;player.add(parts.body);
    parts.head=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),skin);parts.head.position.y=1.9;player.add(parts.head);
    var visor=new THREE.Mesh(new THREE.BoxGeometry(.52,.16,.1),new THREE.MeshBasicMaterial({color:0xff3fb5}));visor.position.set(0,1.95,-.27);player.add(visor);
    function limb(x,yy,mat,h){var g=new THREE.Group();g.position.set(x,yy,0);var m=new THREE.Mesh(new THREE.BoxGeometry(.24,h,.24),mat);m.position.y=-h/2;g.add(m);player.add(g);return g}
    parts.la=limb(-.48,1.55,suit,.7);parts.ra=limb(.48,1.55,suit,.7);parts.ll=limb(-.18,.72,dark,.72);parts.rl=limb(.18,.72,dark,.72);
    var sh=new THREE.Mesh(new THREE.CircleGeometry(.5,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.4}));sh.rotation.x=-Math.PI/2;sh.position.y=.01;parts.shadow=sh;scene.add(sh);
    scene.add(player);
    ready=true;return true;
  }

  /* ---------- Obstacles ---------- */
  var MAT={};
  function mat(name){if(MAT[name])return MAT[name];var m={red:new THREE.MeshStandardMaterial({color:0xe2361b,emissive:0x5a0d05}),yel:new THREE.MeshStandardMaterial({color:0xffd23f,emissive:0x664400}),train:new THREE.MeshStandardMaterial({color:0x1a1830,emissive:0x0a0a18}),coin:new THREE.MeshStandardMaterial({color:0xffd23f,emissive:0xaa7700,metalness:.6,roughness:.3}),neon:new THREE.MeshBasicMaterial({color:0x3fa9ff})}[name];MAT[name]=m;return m}
  function mkObs(t,l,z){
    var g=new THREE.Group(),x=LX[l];
    if(t==='low'){var b=new THREE.Mesh(new THREE.BoxGeometry(1.9,.6,.4),mat('red'));b.position.y=.3;g.add(b);for(var i=0;i<3;i++){var s=new THREE.Mesh(new THREE.BoxGeometry(.3,.62,.42),mat('yel'));s.position.set(-.6+i*.6,.3,0);g.add(s)}}
    else if(t==='high'){[-0.9,.9].forEach(function(px){var p=new THREE.Mesh(new THREE.BoxGeometry(.15,2.3,.15),mat('yel'));p.position.set(px,1.15,0);g.add(p)});var bar=new THREE.Mesh(new THREE.BoxGeometry(1.95,.5,.3),mat('red'));bar.position.y=1.9;g.add(bar)}
    else if(t==='wall'){var w=new THREE.Mesh(new THREE.BoxGeometry(1.9,2.8,5),mat('train'));w.position.y=1.4;g.add(w);var n=new THREE.Mesh(new THREE.BoxGeometry(1.92,.12,5.02),mat('neon'));n.position.y=2.8;g.add(n);var fr=new THREE.Mesh(new THREE.BoxGeometry(1.4,.9,.05),new THREE.MeshBasicMaterial({color:0xffd23f}));fr.position.set(0,1.9,2.52);g.add(fr)}
    else{var c=new THREE.Mesh(new THREE.TorusGeometry(.32,.1,8,20),mat('coin'));c.position.y=1;g.add(c)}
    g.position.set(x,0,z);scene.add(g);objs.push({t:t,l:l,z:z,m:g,len:t==='wall'?2.5:.3});
  }
  function spawnRow(z){
    var used=PP.shuffle([0,1,2]).slice(0,Math.random()<.35?2:1);
    used.forEach(function(l){var r=Math.random();mkObs(r<.38?'low':r<.72?'high':'wall',l,z)});
    var open=[0,1,2].filter(function(l){return used.indexOf(l)<0});
    if(open.length&&Math.random()<.75){var cl=PP.pick(open);for(var k=0;k<5;k++)mkObs('coin',cl,z-2-k*1.6)}
  }

  function reset(){
    if(!init())return;
    objs.forEach(function(o){scene.remove(o.m)});objs=[];sparks.forEach(function(s){scene.remove(s.m)});sparks=[];
    lane=1;laneX=0;jumpT=0;slideT=0;y=0;speed=14;dist=0;coins=0;spawnZ=-30;dead=false;runT=0;
    for(var z=-45;z>-90;z-=14)spawnRow(z);spawnZ=-90;
    player.position.set(0,0,0);player.scale.set(1,1,1);upd();place();
  }
  function upd(){
    $('rn-score').textContent=Math.floor(dist);$('rn-coins').textContent=coins;
    if(mp.on()&&running){sendT-=1;if(sendT<=0){sendT=4;net.relay({g:'run',d:Math.floor(dist)+coins*10,dead:dead})}}
    if(mp.on())board();
  }
  function board(){
    var rows=[{n:net.me.name,s:Math.floor(dist)+coins*10,dead:dead,me:1}];Object.keys(others).forEach(function(k){rows.push(others[k])});
    rows.sort(function(a,b){return b.s-a.s});
    var el=$('rn-board');if(!el){el=document.createElement('div');el.id='rn-board';el.className='live-board';cv.parentNode.appendChild(el)}
    el.innerHTML=rows.map(function(r,i){return '<div class="'+(r.me?'me ':'')+(r.dead?'out':'')+'"><b>'+(i+1)+'</b>'+PP.esc(r.n)+'<span>'+r.s+'</span></div>'}).join('');
    return rows;
  }
  function spark(x,yy,z,col){for(var i=0;i<8;i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color:col}));m.position.set(x,yy,z);scene.add(m);sparks.push({m:m,vx:(Math.random()-.5)*6,vy:Math.random()*5,vz:(Math.random()-.5)*6,t:.5})}}

  function step(dt){
    runT+=dt;speed=Math.min(32,14+runT*.35);var mv=speed*dt;dist+=mv;
    laneX+=(LX[lane]-laneX)*Math.min(1,dt*12);
    // saut et glissade
    if(jumpT>0){jumpT=Math.max(0,jumpT-dt);var k=1-jumpT/.62;y=Math.sin(k*Math.PI)*1.6}else y=0;
    if(slideT>0)slideT=Math.max(0,slideT-dt);
    // déplacement du monde
    objs.forEach(function(o){o.z+=mv;o.m.position.z=o.z;if(o.t==='coin')o.m.children[0].rotation.y+=dt*4});
    builds.forEach(function(b){b.position.z+=mv;if(b.position.z>8)b.position.z-=26*5.5});
    roadTex.offset.y+=mv/14;
    spawnZ+=mv;while(spawnZ>-90){spawnZ-=Math.max(9,14-runT*.04);spawnRow(spawnZ)}
    // collisions
    for(var i=objs.length-1;i>=0;i--){
      var o=objs[i];
      if(o.z>6){scene.remove(o.m);objs.splice(i,1);continue}
      if(Math.abs(o.z)<o.len+.35&&Math.abs(LX[o.l]-laneX)<1){
        if(o.t==='coin'){coins++;sfx.play('eat');spark(o.m.position.x,1,o.z,0xffd23f);scene.remove(o.m);objs.splice(i,1);continue}
        if(o.t==='low'&&y>.7)continue;
        if(o.t==='high'&&slideT>0)continue;
        if(o.hit)continue;o.hit=1;return crash();
      }
    }
    sparks.forEach(function(s){s.t-=dt;s.vy-=12*dt;s.m.position.x+=s.vx*dt;s.m.position.y+=s.vy*dt;s.m.position.z+=s.vz*dt+mv});
    sparks=sparks.filter(function(s){if(s.t<=0){scene.remove(s.m);return false}return true});
    place();upd();
  }
  function place(){
    var sl=slideT>0,ph=runT*speed*.55;
    player.position.set(laneX,y,0);
    player.rotation.z=(LX[lane]-laneX)*-.12;
    parts.body.scale.y=sl?.5:1;parts.body.position.y=sl?.55:1.15;parts.head.position.y=sl?1.05:1.9;
    var sw=y>0?.6:Math.sin(ph)*.9;parts.la.rotation.x=sw;parts.ra.rotation.x=-sw;parts.ll.rotation.x=y>0?-.8:-sw;parts.rl.rotation.x=y>0?.4:sw;
    parts.la.position.y=parts.ra.position.y=sl?.8:1.55;parts.ll.visible=parts.rl.visible=!sl;
    parts.shadow.position.set(laneX,.01,0);parts.shadow.scale.setScalar(1-y*.25);
    camera.position.x+=((laneX*.6)-camera.position.x)*.12;camera.position.y=3.4+y*.25;camera.position.z=6.2;
    camera.lookAt(laneX*.4,1.2,-8);
    camera.fov=62+Math.min(14,(speed-14)*.6);camera.updateProjectionMatrix();
  }
  function crash(){
    sfx.play('crash');dead=true;running=false;cancelAnimationFrame(raf);
    spark(laneX,1,0,0xe2361b);player.rotation.x=-.6;renderer.render(scene,camera);
    var score=Math.floor(dist)+coins*10,best=PP.store('rn-best');
    if(score>best){best=score;PP.store('rn-best',score);$('rn-best').textContent=score;PP.refreshHi()}
    $('rn-title').textContent='Crash !';$('rn-msg').textContent=Math.floor(dist)+' m et '+coins+' pièce'+(coins>1?'s':'')+' : '+score+' points. Record : '+best+'.';
    $('rn-start').textContent='Recourir';$('rn-ov').hidden=false;$('rn-start').focus();
    if(mp.on()){net.relay({g:'run',d:score,dead:true});$('rn-start').hidden=!net.isHost;$('rn-start').textContent='Relancer pour tout le salon';onlineEnd()}
  }
  var won1=0;function onlineEnd(){
    var rows=board(),allDead=rows.every(function(r){return r.dead});
    if(!dead)return;
    $('rn-title').textContent=allDead?(rows[0].me?'Tu gagnes la course !':rows[0].n+' gagne la course'):'Crash ! On attend les autres';if(allDead&&rows[0].me&&!won1){won1=1;PP.stat('run','win')}
    $('rn-msg').innerHTML=rows.map(function(r,i){return (i+1)+'. '+PP.esc(r.n)+' — '+r.s+(r.dead?'':' (en course)')}).join('<br>');
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){step(dt);if(running)renderer.render(scene,camera);raf=requestAnimationFrame(loop)}}
  net.on(function(m){
    if(PP.cur()!=='run'||!mp.on())return;
    if(m.t==='run-go'&&!net.isHost){start();return}
    if(m.t==='rel'&&m.d&&m.d.g==='run'){var pl=net.players.filter(function(q){return q.id===m.from})[0];others[m.from]={n:pl?pl.name:'?',s:m.d.d,dead:m.d.dead};board();if(dead)onlineEnd()}
  });
  function start(){won1=0;if(!init())return;if(mp.on()){others={};net.players.forEach(function(q){if(q.id!==net.me.id)others[q.id]={n:q.name,s:0,dead:false}});if(net.isHost)net.broadcast({t:'run-go'})}player.rotation.x=0;reset();$('rn-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);sfx.play('go')}
  function key(k){if(!running)return;if(k==='L')lane=Math.max(0,lane-1);if(k==='R')lane=Math.min(2,lane+1);if(k==='U'&&jumpT<=0){jumpT=.62;slideT=0;sfx.play('ui')}if(k==='D'){slideT=.7;jumpT=0}}
  $('rn-start').addEventListener('click',start);
  $('rn-pad').addEventListener('click',function(e){var b=e.target.closest('[data-k]');if(b)key(b.dataset.k)});
  document.addEventListener('keydown',function(e){if(PP.cur()!=='run'||e.repeat)return;var k={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D',q:'L',a:'L',d:'R',z:'U',w:'U',s:'D',' ':'U'}[e.key.length===1?e.key.toLowerCase():e.key];if(k&&running){key(k);e.preventDefault()}});
  var t0=null;
  cv.addEventListener('touchstart',function(e){t0=e.touches[0]},{passive:true});
  cv.addEventListener('touchend',function(e){if(!t0)return;var t=e.changedTouches[0],dx=t.clientX-t0.clientX,dy=t.clientY-t0.clientY;if(Math.max(Math.abs(dx),Math.abs(dy))>24)key(Math.abs(dx)>Math.abs(dy)?(dx>0?'R':'L'):(dy>0?'D':'U'));t0=null});
  PP.games.run={open:function(){reset();if(ready)renderer.render(scene,camera);$('rn-start').hidden=false;$('rn-title').textContent='Néon Rush';$('rn-start').textContent='Courir';$('rn-ov').hidden=false;mp.lobby('rn','Néon Rush')},close:function(){if(running){running=false;cancelAnimationFrame(raf)}}};
})();
