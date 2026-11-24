/* Pixel Pause — Foot 2v2 : 3D (three.js), 1 à 4 joueurs sur un clavier, bleus contre rouges, 2 minutes */
(function(){
  'use strict';
  var $=PP.$,sfx=PP.sfx,net=PP.net,mp=PP.mp,cv=$('foot-cv'),remote={},guestRaf=0,state=null,sendT=0;
  var FW=30,FH=18,GW=6,DUR=120;
  var renderer,scene,camera,ball,players=[],keys={},humans=1,running=false,raf=0,last=0,ready=false,time,score,pause=0,msgT=0,msgTxt='',msgEl=null;
  var KEYMAP={z:'1U',w:'1U',s:'1D',q:'1L',a:'1L',d:'1R',' ':'1X',ArrowUp:'2U',ArrowDown:'2D',ArrowLeft:'2L',ArrowRight:'2R',Enter:'2X',i:'3U',k:'3D',j:'3L',l:'3R',o:'3X','8':'4U','5':'4D','4':'4L','6':'4R','0':'4X'};
  var TEAM=[0,1,0,1],NAMES=['J1','J2','J3','J4'],TCOL=[0x3fa9ff,0xff4d6d];

  function fieldTexture(){
    var c=document.createElement('canvas');c.width=600;c.height=360;var g=c.getContext('2d');
    g.fillStyle='#1f7a3a';g.fillRect(0,0,600,360);g.fillStyle='#237f3f';for(var i=0;i<10;i++)if(i%2)g.fillRect(i*60,0,60,360);
    g.strokeStyle='#e8f5e9';g.lineWidth=4;g.strokeRect(10,10,580,340);g.beginPath();g.moveTo(300,10);g.lineTo(300,350);g.stroke();g.beginPath();g.arc(300,180,50,0,7);g.stroke();
    g.strokeRect(10,100,90,160);g.strokeRect(500,100,90,160);
    var t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
  }
  function init(){
    if(ready)return true;
    if(!window.THREE){PP.toast('La 3D (three.js) n\'a pas pu se charger','warn');return false}
    renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});renderer.setSize(cv.width,cv.height,false);renderer.shadowMap.enabled=true;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x0b0d12);scene.fog=new THREE.Fog(0x0b0d12,40,80);
    camera=new THREE.PerspectiveCamera(46,cv.width/cv.height,.1,120);camera.position.set(0,17,18);camera.lookAt(0,-1,0);
    scene.add(new THREE.HemisphereLight(0xbfd4ff,0x203020,.9));
    var sun=new THREE.DirectionalLight(0xffffff,1.1);sun.position.set(10,24,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;scene.add(sun);
    var field=new THREE.Mesh(new THREE.PlaneGeometry(FW,FH),new THREE.MeshStandardMaterial({map:fieldTexture(),roughness:.9}));field.rotation.x=-Math.PI/2;field.receiveShadow=true;scene.add(field);
    var out=new THREE.Mesh(new THREE.PlaneGeometry(80,60),new THREE.MeshStandardMaterial({color:0x173d24}));out.rotation.x=-Math.PI/2;out.position.y=-.02;scene.add(out);
    [-1,1].forEach(function(s){
      var gm=new THREE.MeshStandardMaterial({color:0xffffff});
      var post=new THREE.CylinderGeometry(.1,.1,2.2,8),bar=new THREE.CylinderGeometry(.1,.1,GW,8);
      [-GW/2,GW/2].forEach(function(z){var p=new THREE.Mesh(post,gm);p.position.set(s*FW/2,1.1,z);scene.add(p)});
      var b=new THREE.Mesh(bar,gm);b.rotation.x=Math.PI/2;b.position.set(s*FW/2,2.2,0);scene.add(b);
      var net=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.2,GW),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.18,wireframe:true}));net.position.set(s*(FW/2+.8),1.1,0);scene.add(net);
    });
    ball=new THREE.Mesh(new THREE.SphereGeometry(.5,20,14),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.4}));ball.castShadow=true;scene.add(ball);
    var patch=new THREE.Mesh(new THREE.SphereGeometry(.51,8,6,0,Math.PI/2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x0b0d12}));ball.add(patch);
    ready=true;return true;
  }
  function mkPlayer(i,bot){
    var g=new THREE.Group(),col=TCOL[TEAM[i]];
    var body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,.8,6,12),new THREE.MeshStandardMaterial({color:col,roughness:.5}));body.castShadow=true;body.position.y=.85;g.add(body);
    var head=new THREE.Mesh(new THREE.SphereGeometry(.32,14,10),new THREE.MeshStandardMaterial({color:0xf2d2b6}));head.position.y=1.75;g.add(head);
    var hair=new THREE.Mesh(new THREE.SphereGeometry(.33,14,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:bot?0x333344:0x0b0d12}));hair.position.y=1.8;g.add(hair);
    var num=new THREE.Mesh(new THREE.CircleGeometry(.2,12),new THREE.MeshStandardMaterial({color:0xffffff}));num.position.set(0,1,.46);g.add(num);
    scene.add(g);
    return {i:i,team:TEAM[i],bot:bot,mesh:g,x:0,z:0,vx:0,vz:0,face:0,kick:0,name:bot?'Bot '+NAMES[i]:(mp.on()&&net.players[i]?net.players[i].name:NAMES[i])};
  }
  function setup(){
    players.forEach(function(p){scene.remove(p.mesh)});players=[];
    for(var i=0;i<4;i++)players.push(mkPlayer(i,i>=humans));
    time=DUR;score=[0,0];kickoff();hud();
  }
  function kickoff(){
    var pos=[[-6,-3],[6,-3],[-6,3],[6,3]];
    players.forEach(function(p,i){p.x=pos[i][0];p.z=pos[i][1];p.vx=p.vz=0;p.face=p.team===0?Math.PI/2:-Math.PI/2});
    ball.userData={x:0,z:0,y:.5,vx:0,vz:0,vy:0};pause=1;
  }
  function say(t,d){msgTxt=t;msgT=d}
  function hud(){$('foot-hud').innerHTML='<span class="p2">Bleus <b>'+score[0]+'</b></span><span>Temps <b>'+PP.fmtTime(time)+'</b></span><span style="color:var(--bad)">Rouges <b>'+score[1]+'</b></span>'}

  function step(dt){
    var b=ball.userData;
    if(pause>0){pause-=dt;if(pause<=0&&time<=0)return end()}
    else{time-=dt;if(time<=0){time=0;say('Fin du match',2);pause=2;return}}
    players.forEach(function(p){
      p.kick=Math.max(0,p.kick-dt);
      var ix=0,iz=0,kick=false;
      if(p.bot){
        var goalX=p.team===0?FW/2:-FW/2,ownX=-goalX;
        var mates=players.filter(function(o){return o.team===p.team}),db=Math.hypot(b.x-p.x,b.z-p.z);
        var closest=mates.slice().sort(function(a,c){return Math.hypot(b.x-a.x,b.z-a.z)-Math.hypot(b.x-c.x,b.z-c.z)})[0]===p;
        var tx,tz;
        if(closest){var dirx=goalX-b.x,dirz=0-b.z,dl=Math.hypot(dirx,dirz);dirx/=dl;dirz/=dl;tx=b.x-dirx*.9;tz=b.z-dirz*.9;if(db<1.6&&((goalX>0&&p.x<b.x)||(goalX<0&&p.x>b.x)))kick=true}
        else{tx=(ownX+b.x)/2;tz=b.z*.5}
        ix=tx-p.x;iz=tz-p.z;
      }else{var k=String(p.i+1),inp=mp.on()?(p.i===0?mp.localInput(keys):(remote[p.i]||{})):{U:keys[k+'U'],D:keys[k+'D'],L:keys[k+'L'],R:keys[k+'R'],X:keys[k+'X']};if(inp.U)iz-=1;if(inp.D)iz+=1;if(inp.L)ix-=1;if(inp.R)ix+=1;if(inp.X)kick=true}
      var len=Math.hypot(ix,iz);if(len>0){ix/=len;iz/=len;p.face=Math.atan2(ix,iz)}
      if(pause<=0){p.vx+=ix*40*dt;p.vz+=iz*40*dt}
      var fr=Math.pow(.02,dt);p.vx*=fr;p.vz*=fr;var sp=Math.hypot(p.vx,p.vz),mx=p.bot?7.2:8;if(sp>mx){p.vx*=mx/sp;p.vz*=mx/sp}
      p.x=Math.max(-FW/2-1,Math.min(FW/2+1,p.x+p.vx*dt));p.z=Math.max(-FH/2-1,Math.min(FH/2+1,p.z+p.vz*dt));
      // contact balle
      var dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz);
      if(d<1.05&&pause<=0){var nx=dx/d,nz=dz/d;b.x=p.x+nx*1.05;b.z=p.z+nz*1.05;
        if(kick&&p.kick<=0){p.kick=.5;var fx=Math.sin(p.face),fz=Math.cos(p.face);b.vx=fx*24+p.vx;b.vz=fz*24+p.vz;b.vy=5;sfx.play('shoot')}
        else{var push=Math.max(5,sp+3);b.vx=nx*push+p.vx*.3;b.vz=nz*push+p.vz*.3;if(Math.random()<.3)sfx.play('tick')}
      }
      p.mesh.position.set(p.x,0,p.z);p.mesh.rotation.y=p.face;
      var bob=Math.sin(Date.now()/80)*(sp>1?.06:0);p.mesh.children[0].position.y=.85+bob;
    });
    // collisions joueurs
    for(var i=0;i<4;i++)for(var j=i+1;j<4;j++){var a=players[i],c=players[j],dx2=c.x-a.x,dz2=c.z-a.z,d2=Math.hypot(dx2,dz2);if(d2<1&&d2>0){var ov=(1-d2)/2;a.x-=dx2/d2*ov;a.z-=dz2/d2*ov;c.x+=dx2/d2*ov;c.z+=dz2/d2*ov}}
    // balle
    var bf=Math.pow(.35,dt);b.vx*=bf;b.vz*=bf;b.vy-=22*dt;b.y+=b.vy*dt;if(b.y<.5){b.y=.5;b.vy=Math.abs(b.vy)*.4}
    b.x+=b.vx*dt;b.z+=b.vz*dt;
    if(Math.abs(b.z)>FH/2-.5){b.z=Math.sign(b.z)*(FH/2-.5);b.vz*=-.7}
    var inGoal=Math.abs(b.z)<GW/2-.3&&b.y<2.1;
    if(Math.abs(b.x)>FW/2-.5){
      if(inGoal&&pause<=0&&Math.abs(b.x)>FW/2+.6){var scorer=b.x>0?0:1;score[scorer]++;say((scorer?'Rouges':'Bleus')+' marquent !',2);sfx.play('win');hud();pause=2.2;setTimeout(function(){if(running)kickoff()},1800)}
      else if(!inGoal){b.x=Math.sign(b.x)*(FW/2-.5);b.vx*=-.7}
      if(Math.abs(b.x)>FW/2+1.9){b.x=Math.sign(b.x)*(FW/2+1.9);b.vx*=-.5}
    }
    ball.position.set(b.x,b.y,b.z);ball.rotation.x+=b.vz*dt*2;ball.rotation.z-=b.vx*dt*2;
    camera.position.x+=((b.x*.35)-camera.position.x)*dt*3;camera.lookAt(b.x*.35,-1,b.z*.2);
    msgT=Math.max(0,msgT-dt);hud();
    if(mp.on()&&net.isHost){sendT-=dt;if(sendT<=0){sendT=.05;net.broadcast({t:'foot-s',p:players.map(function(q){return [+q.x.toFixed(2),+q.z.toFixed(2),+q.face.toFixed(2),Math.hypot(q.vx,q.vz)>1?1:0]}),b:[+b.x.toFixed(2),+b.y.toFixed(2),+b.z.toFixed(2)],sc:score,tm:time,m:msgT>0?msgTxt:''})}}
  }
  function end(){
    running=false;cancelAnimationFrame(raf);
    var t=score[0]===score[1]?'Match nul '+score[0]+' - '+score[1]:(score[0]>score[1]?'Les Bleus gagnent ':'Les Rouges gagnent ')+score[0]+' - '+score[1];
    $('foot-title').textContent=t;$('foot-msg').textContent=humans===1?'Bleus : toi + un bot. Rouges : deux bots.':'Bleus : J1'+(humans>=3?' + J3':' + bot')+' · Rouges : J2'+(humans>=4?' + J4':' + bot');
    $('foot-start').textContent='Rejouer';$('foot-ov').hidden=false;sfx.play(score[0]>score[1]?'win':'lose');if(score[0]>score[1])PP.stat('foot','win');
    if(mp.on()){$('foot-msg').textContent='Bleus : '+players.filter(function(q){return q.team===0}).map(function(q){return q.name}).join(' + ')+' · Rouges : '+players.filter(function(q){return q.team===1}).map(function(q){return q.name}).join(' + ');if(net.isHost)net.broadcast({t:'foot-end',title:$('foot-title').textContent,msg:$('foot-msg').textContent})}
  }
  function overlayText(){
    if(!msgEl){msgEl=document.createElement('div');msgEl.className='stage-msg';cv.parentNode.appendChild(msgEl)}
    msgEl.textContent=msgT>0?msgTxt:'';msgEl.hidden=!(msgT>0);
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){step(dt);if(running){renderer.render(scene,camera);overlayText()}raf=requestAnimationFrame(loop)}}
  function start(){if(!init())return;if(mp.on()){humans=Math.min(4,net.players.length);if(net.isHost)net.broadcast({t:'foot-go',n:humans})}setup();$('foot-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);sfx.play('go')}
  function guestStart(n){
    if(!init())return;humans=n;setup();$('foot-ov').hidden=true;cancelAnimationFrame(guestRaf);
    (function gl(){
      if(PP.cur()!=='foot')return;
      if(state){
        state.p.forEach(function(a,i){var q=players[i];if(!q)return;q.x=a[0];q.z=a[1];q.face=a[2];q.mesh.position.set(q.x,0,q.z);q.mesh.rotation.y=q.face;q.mesh.children[0].position.y=.85+(a[3]?Math.sin(Date.now()/80)*.06:0)});
        var bb=state.b;ball.position.set(bb[0],bb[1],bb[2]);score=state.sc;time=state.tm;msgTxt=state.m;msgT=state.m?1:0;hud();
        camera.position.x+=((bb[0]*.35)-camera.position.x)*.08;camera.lookAt(bb[0]*.35,-1,bb[2]*.2);
      }
      renderer.render(scene,camera);overlayText();guestRaf=requestAnimationFrame(gl);
    })();
  }
  net.on(function(m){
    if(net.isHost||PP.cur()!=='foot')return;
    if(m.t==='foot-go'){state=null;guestStart(m.n);sfx.play('go')}
    if(m.t==='foot-s')state=m;
    if(m.t==='foot-end'){$('foot-title').textContent=m.title;$('foot-msg').textContent=m.msg;$('foot-start').hidden=true;$('foot-ov').hidden=false}
  });
  mp.hostInputs('foot',remote);
  $('foot-modes').addEventListener('click',function(e){var b=e.target.closest('[data-n]');if(!b)return;humans=+b.dataset.n;$('foot-modes').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x===b)});sfx.play('ui');if(running){running=false;cancelAnimationFrame(raf);$('foot-ov').hidden=false;$('foot-start').textContent='Coup d\'envoi'}});
  keys=PP.held('foot-pad',KEYMAP,function(k,e){if(PP.cur()==='foot'&&(running||mp.on())&&e.preventDefault)e.preventDefault()});
  mp.guestSender('foot',keys);
  $('foot-start').addEventListener('click',start);
  PP.games.foot={open:function(){if(init()){if(!players.length)setup();renderer.render(scene,camera)}$('foot-start').hidden=false;$('foot-title').textContent='Foot 2v2';$('foot-start').textContent='Coup d\'envoi';$('foot-ov').hidden=false;mp.lobby('foot','Foot 2v2')},close:function(){if(running){running=false;cancelAnimationFrame(raf)}cancelAnimationFrame(guestRaf)}};
})();
