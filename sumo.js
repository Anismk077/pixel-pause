/* Pixel Pause — Sumo Arena : 3D (three.js), 1 à 4 joueurs sur un clavier, pousse les autres hors de la plateforme */
(function(){
  'use strict';
  var $=PP.$,sfx=PP.sfx,net=PP.net,mp=PP.mp,cv=$('sumo-cv'),remote={},guestRaf=0,state=null,sendT=0;
  var COLS=[0x3cff6e,0x3fa9ff,0xff5fd2,0xffb02e],CSS=['#3cff6e','#3fa9ff','#ff5fd2','#ffb02e'],NAMES=['J1','J2','J3','J4'];
  var renderer,scene,camera,platform,players=[],keys={},humans=1,running=false,raf=0,last=0,R,roundT,between=0,round=0,ready=false,msgT=0,msgTxt='';
  var KEYMAP={z:'1U',w:'1U',s:'1D',q:'1L',a:'1L',d:'1R',' ':'1X',ArrowUp:'2U',ArrowDown:'2D',ArrowLeft:'2L',ArrowRight:'2R',Enter:'2X',i:'3U',k:'3D',j:'3L',l:'3R',o:'3X','8':'4U','5':'4D','4':'4L','6':'4R','0':'4X'};

  function init(){
    if(ready)return true;
    if(!window.THREE){PP.toast('La 3D (three.js) n\'a pas pu se charger','warn');return false}
    renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});renderer.setSize(cv.width,cv.height,false);renderer.shadowMap.enabled=true;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x0b0d12);scene.fog=new THREE.Fog(0x0b0d12,30,60);
    camera=new THREE.PerspectiveCamera(50,cv.width/cv.height,.1,100);camera.position.set(0,15,17);camera.lookAt(0,-1.5,0);
    scene.add(new THREE.HemisphereLight(0xaab4ff,0x202030,.9));
    var sun=new THREE.DirectionalLight(0xffffff,1.1);sun.position.set(8,18,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;scene.add(sun);
    platform=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,64),new THREE.MeshStandardMaterial({color:0x2b3350,roughness:.8}));platform.receiveShadow=true;platform.position.y=-.5;scene.add(platform);
    var ring=new THREE.Mesh(new THREE.TorusGeometry(1,.08,8,64),new THREE.MeshStandardMaterial({color:0x5b8cff,emissive:0x1a2a66}));ring.rotation.x=Math.PI/2;ring.position.y=.02;platform.add(ring);platform.ring=ring;
    var floor=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:0x101420}));floor.rotation.x=-Math.PI/2;floor.position.y=-9;scene.add(floor);
    var grid=new THREE.GridHelper(120,40,0x1f2740,0x1f2740);grid.position.y=-8.99;scene.add(grid);
    ready=true;return true;
  }
  function mkPlayer(i,bot){
    var g=new THREE.Group(),body=new THREE.Mesh(new THREE.SphereGeometry(.7,24,16),new THREE.MeshStandardMaterial({color:bot?0x8a8a99:COLS[i],roughness:.5}));body.castShadow=true;g.add(body);
    var eyeG=new THREE.SphereGeometry(.14,10,8),eyeM=new THREE.MeshStandardMaterial({color:0xffffff}),pupM=new THREE.MeshStandardMaterial({color:0x0b0d12});
    [-.25,.25].forEach(function(x){var e=new THREE.Mesh(eyeG,eyeM);e.position.set(x,.2,.6);g.add(e);var p=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),pupM);p.position.set(x,.2,.72);g.add(p)});
    var band=new THREE.Mesh(new THREE.TorusGeometry(.72,.06,8,32),new THREE.MeshStandardMaterial({color:bot?0x444455:0xffffff}));band.rotation.x=Math.PI/2;band.position.y=-.1;g.add(band);
    scene.add(g);
    return {i:i,bot:bot,mesh:g,x:0,z:0,vx:0,vz:0,y:0,vy:0,alive:true,dash:0,dashCd:0,face:0,score:0,aiT:0,name:bot?'Bot '+(i+1):(mp.on()&&net.players[i]?net.players[i].name:NAMES[i])};
  }
  function setup(){
    players.forEach(function(p){scene.remove(p.mesh)});players=[];
    for(var i=0;i<4;i++)players.push(mkPlayer(i,i>=humans));
    players.forEach(function(p){p.score=0});round=0;newRound();
  }
  function newRound(){
    round++;R=9;roundT=0;between=0;
    players.forEach(function(p,i){var a=i*Math.PI/2+Math.PI/4;p.x=Math.cos(a)*5;p.z=Math.sin(a)*5;p.vx=p.vz=0;p.y=0;p.vy=0;p.alive=true;p.dash=0;p.dashCd=0;p.face=Math.atan2(-p.x,-p.z);p.mesh.visible=true});
    say('Manche '+round,1.2);sfx.play('go');hud();
  }
  function say(t,d){msgTxt=t;msgT=d}
  function hud(){$('sumo-hud').innerHTML=players.map(function(p){return '<span class="p'+(p.i+1)+'">'+PP.esc(p.name)+' <b>'+p.score+'</b>'+(p.alive?'':' ✕')+'</span>'}).join('')}

  function step(dt){
    if(between>0){between-=dt;if(between<=0){if(players.some(function(p){return p.score>=3}))return end();newRound()}return}
    roundT+=dt;R=Math.max(3.2,9-roundT*.14);
    platform.scale.set(R,1,R);platform.ring.scale.set(1,1,1);
    players.forEach(function(p){
      if(!p.alive)return;
      p.dashCd=Math.max(0,p.dashCd-dt);p.dash=Math.max(0,p.dash-dt);
      var ix=0,iz=0,dash=false;
      if(p.bot){
        p.aiT-=dt;
        var tgt=null,bd=99;players.forEach(function(o){if(o!==p&&o.alive){var d=Math.hypot(o.x-p.x,o.z-p.z);if(d<bd){bd=d;tgt=o}}});
        var dc=Math.hypot(p.x,p.z);
        if(dc>R-2.2){ix=-p.x/dc;iz=-p.z/dc}
        else if(tgt){var ang=Math.atan2(tgt.z-p.z,tgt.x-p.x)+Math.sin(roundT*1.3+p.i)*.5;ix=Math.cos(ang);iz=Math.sin(ang);
          var od=Math.hypot(tgt.x,tgt.z);if(bd<2.6&&od>R-3.5&&dc<R-3&&p.dashCd<=0&&Math.random()<.6)dash=true}
      }else{
        var k=String(p.i+1),inp=mp.on()?(p.i===0?mp.localInput(keys):(remote[p.i]||{})):{U:keys[k+'U'],D:keys[k+'D'],L:keys[k+'L'],R:keys[k+'R'],X:keys[k+'X']};
        if(inp.U)iz-=1;if(inp.D)iz+=1;if(inp.L)ix-=1;if(inp.R)ix+=1;
        if(inp.X&&p.dashCd<=0)dash=true;
      }
      var len=Math.hypot(ix,iz);if(len>0){ix/=len;iz/=len;p.face=Math.atan2(ix,iz)}
      var acc=p.dash>0?10:30;
      p.vx+=ix*acc*dt;p.vz+=iz*acc*dt;
      if(dash){p.dashCd=1.3;p.dash=.35;p.vx+=Math.sin(p.face)*14;p.vz+=Math.cos(p.face)*14;sfx.play('ui')}
      var fr=Math.pow(p.dash>0?.6:.08,dt);p.vx*=fr;p.vz*=fr;
      var sp=Math.hypot(p.vx,p.vz),max=p.dash>0?22:9;if(sp>max){p.vx*=max/sp;p.vz*=max/sp}
      p.x+=p.vx*dt;p.z+=p.vz*dt;
    });
    // collisions
    for(var i=0;i<players.length;i++)for(var j=i+1;j<players.length;j++){
      var a=players[i],b=players[j];if(!a.alive||!b.alive)continue;
      var dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
      if(d<1.4&&d>0){var nx=dx/d,nz=dz/d,over=1.4-d;a.x-=nx*over/2;a.z-=nz*over/2;b.x+=nx*over/2;b.z+=nz*over/2;
        var an=a.vx*nx+a.vz*nz,bn=b.vx*nx+b.vz*nz;if(an-bn>0){var ka=a.dash>0?1.6:1,kb=b.dash>0?1.6:1;a.vx+=(bn*kb-an)*nx;a.vz+=(bn*kb-an)*nz;b.vx+=(an*ka-bn)*nx;b.vz+=(an*ka-bn)*nz;b.vx+=nx*1.5;b.vz+=nz*1.5;a.vx-=nx*1.5;a.vz-=nz*1.5;[a,b].forEach(function(q){var sq=Math.hypot(q.vx,q.vz);if(sq>15){q.vx*=15/sq;q.vz*=15/sq}});sfx.play('hit')}}
    }
    players.forEach(function(p){
      if(!p.alive)return;
      var dc=Math.hypot(p.x,p.z);
      if(dc>R+.5||p.y<0){p.vy-=30*dt;p.y+=p.vy*dt;if(p.y<-9){p.alive=false;p.mesh.visible=false;sfx.play('die');hud();checkRound()}}
      p.mesh.position.set(p.x,p.y+.7,p.z);p.mesh.rotation.y=p.face;
      var s=p.dash>0?1.15:1;p.mesh.scale.set(s,1/s,s);
    });
    msgT=Math.max(0,msgT-dt);
    if(mp.on()&&net.isHost){sendT-=dt;if(sendT<=0){sendT=.05;net.broadcast({t:'sumo-s',p:players.map(function(q){return [+q.x.toFixed(2),+q.y.toFixed(2),+q.z.toFixed(2),+q.face.toFixed(2),q.alive?1:0,q.dash>0?1:0,q.score]}),R:+R.toFixed(2),m:msgT>0?msgTxt:''})}}
    var cxm=0,czm=0,n=0;players.forEach(function(p){if(p.alive){cxm+=p.x;czm+=p.z;n++}});if(n){cxm/=n;czm/=n}
    camera.position.x+=((cxm*.3)-camera.position.x)*dt*2;camera.position.z+=((17+czm*.3)-camera.position.z)*dt*2;camera.lookAt(cxm*.3,-1.5,czm*.3);
  }
  function checkRound(){
    var al=players.filter(function(p){return p.alive});
    if(al.length<=1){if(al.length===1){al[0].score++;say(al[0].name+' gagne la manche',2);sfx.play('win')}else say('Égalité',2);between=2.2;hud()}
  }
  function end(){
    running=false;cancelAnimationFrame(raf);
    var w=players.slice().sort(function(a,b){return b.score-a.score})[0];if(w&&!w.bot&&(w===players[0]||w.name===PP.net.me.name))PP.stat('sumo','win');
    $('sumo-title').textContent=w.bot?'Les bots gagnent…':w.name+' remporte le match !';
    $('sumo-msg').textContent=players.map(function(p){return p.name+' '+p.score}).join(' · ');
    $('sumo-start').textContent='Rejouer';$('sumo-ov').hidden=false;
    if(mp.on()&&net.isHost)net.broadcast({t:'sumo-end',title:$('sumo-title').textContent,msg:$('sumo-msg').textContent});
  }
  function render(){
    renderer.render(scene,camera);
    var c2=cv.getContext?null:null;
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){step(dt);if(running){render();overlayText()}raf=requestAnimationFrame(loop)}}
  // texte par-dessus le canvas WebGL : on utilise le HUD DOM, et un élément message
  var msgEl=null;
  function overlayText(){
    if(!msgEl){msgEl=document.createElement('div');msgEl.className='stage-msg';cv.parentNode.appendChild(msgEl)}
    msgEl.textContent=msgT>0?msgTxt:'';msgEl.hidden=!(msgT>0);
  }
  function start(){if(!init())return;if(mp.on()){humans=Math.min(4,net.players.length);if(net.isHost)net.broadcast({t:'sumo-go',n:humans})}setup();$('sumo-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
  function guestStart(n){
    if(!init())return;humans=n;setup();$('sumo-ov').hidden=true;cancelAnimationFrame(guestRaf);
    (function gl(){
      if(PP.cur()!=='sumo')return;
      if(state){
        platform.scale.set(state.R,1,state.R);
        state.p.forEach(function(a,i){var q=players[i];if(!q)return;q.x=a[0];q.y=a[1];q.z=a[2];q.face=a[3];q.alive=!!a[4];q.score=a[6];q.mesh.visible=q.alive;q.mesh.position.set(q.x,q.y+.7,q.z);q.mesh.rotation.y=q.face;var sc=a[5]?1.15:1;q.mesh.scale.set(sc,1/sc,sc)});
        msgTxt=state.m;msgT=state.m?1:0;hud();
      }
      renderer.render(scene,camera);overlayText();guestRaf=requestAnimationFrame(gl);
    })();
  }
  net.on(function(m){
    if(net.isHost||PP.cur()!=='sumo')return;
    if(m.t==='sumo-go'){state=null;guestStart(m.n);sfx.play('go')}
    if(m.t==='sumo-s')state=m;
    if(m.t==='sumo-end'){$('sumo-title').textContent=m.title;$('sumo-msg').textContent=m.msg;$('sumo-start').hidden=true;$('sumo-ov').hidden=false}
  });
  mp.hostInputs('sumo',remote);
  $('sumo-modes').addEventListener('click',function(e){var b=e.target.closest('[data-n]');if(!b)return;humans=+b.dataset.n;$('sumo-modes').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x===b)});sfx.play('ui');if(running){running=false;cancelAnimationFrame(raf);$('sumo-ov').hidden=false;$('sumo-start').textContent='Jouer'}});
  keys=PP.held('sumo-pad',KEYMAP,function(k,e){if(PP.cur()==='sumo'&&(running||mp.on())&&e.preventDefault)e.preventDefault()});
  mp.guestSender('sumo',keys);
  $('sumo-start').addEventListener('click',start);
  PP._sumo=function(){return {players:players,R:R,roundT:roundT}};
  PP.games.sumo={open:function(){if(init()){if(!players.length){setup();between=0;}render()}$('sumo-start').hidden=false;$('sumo-title').textContent='Sumo Arena';$('sumo-start').textContent='Jouer';$('sumo-ov').hidden=false;mp.lobby('sumo','Sumo Arena')},close:function(){if(running){running=false;cancelAnimationFrame(raf)}cancelAnimationFrame(guestRaf)}};
})();
