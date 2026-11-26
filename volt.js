/* Pixel Pause — Voltige : jeu de mouvement en 3D. Sprint, double saut, course sur les murs, saut de mur,
   glissade, grappin, escalade des rebords. Trois armes (inventaire 1-2-3), des cibles à exploser ou des zombies.
   Grande ville avec mini-carte. Pas de barre de vie : un zombie qui te touche te fait perdre des points. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,V=null,BOX=[],RND;
  function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
  var WEAP=[{n:'Pistolet',cd:.2,mag:12,rl:.9,dmg:2,sp:.004,pel:1,auto:false,col:0x2a2a30},
    {n:'Mitraillette',cd:.075,mag:32,rl:1.3,dmg:1,sp:.018,pel:1,auto:true,col:0x3a4a3a},
    {n:'Pompe',cd:.65,mag:6,rl:1.5,dmg:1,sp:.065,pel:9,auto:false,col:0x5a3a22}];
  var G=26,JV=8.6,WALK=7.6,SPR=11.8,ACC=70,AIR=22,FRIC=11,R=.36;
  function lam(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))}
  /* v51 : figures et combo. Chaque figure (mur, balancement, glissade, tremplin…) monte le multiplicateur, qui retombe au bout de 5 s. */
  function trick(C,n,pts){if(n!==V.trickN||!V.combo)V.combo=Math.min(5,(V.combo||0)+1);V.comboT=5;V.score+=pts;V.trickN=n}
  /* point d'accroche du grappin : là où on vise, sinon le premier bâtiment trouvé un peu plus haut (aide à la visée) */
  function anchor(C,assist){var o=C.cam.position,q=C.cam.quaternion,tr=assist?[[0,0],[.2,0],[.4,0],[.2,.28],[.2,-.28],[.62,0],[.45,.45],[.45,-.45],[.9,0]]:[[0,0]];
    for(var i=0;i<tr.length;i++){var d=new THREE.Vector3(Math.tan(tr[i][1]),Math.tan(tr[i][0]),-1).normalize().applyQuaternion(q),r=rayWorld(o,d,75);
      if(r.b&&!r.b.pad&&r.t<75&&r.t>2.5){var pt=o.clone().addScaledVector(d,r.t);if(i===0||pt.y>V.pos.y+5)return pt}}return null}
  function release(C){if(!V.grap)return;var v=V.vel;if(V.gMode==='s'&&v.length()>13){trick(C,'BALANCEMENT',100);v.multiplyScalar(1.08);v.y+=2.5}V.grap=null;V.jumps=Math.min(V.jumps,1);inv()}
  function skyTex(){var c=document.createElement('canvas');c.width=4;c.height=256;var g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#5b8fd0');gr.addColorStop(.45,'#b9cfe0');gr.addColorStop(.62,'#f0d9b5');gr.addColorStop(1,'#f0d9b5');g.fillStyle=gr;g.fillRect(0,0,4,256);var t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
  function winTex(base,lit){var c=document.createElement('canvas');c.width=64;c.height=128;var g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,64,128);
    for(var y=6;y<128;y+=16)for(var x=5;x<64;x+=15){g.fillStyle=Math.random()<lit?'#ffe9a8':'rgba(20,24,40,.55)';g.fillRect(x,y,9,10)}var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t}
  function addBox(sc,x0,y0,z0,x1,y1,z1,mat,wall){BOX.push({x0:x0,y0:y0,z0:z0,x1:x1,y1:y1,z1:z1,wall:!!wall});if(!sc)return;var m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.castShadow=m.receiveShadow=true;sc.add(m);return m}
  /* ---------- la ville ---------- */
  function buildCity(C){var sc=C.scene;BOX=[];RND=rng(77);
    sc.background=skyTex();sc.fog=new THREE.Fog(0xf0d9b5,70,210);
    sc.add(new THREE.HemisphereLight(0xfff4e0,0x6a5a4a,1.0));var sun=new THREE.DirectionalLight(0xffe2b8,1.25);sun.position.set(40,80,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);var sc2=sun.shadow.camera;sc2.left=sc2.bottom=-90;sc2.right=sc2.top=90;sc2.far=220;sc.add(sun);
    var gtx=document.createElement('canvas');gtx.width=gtx.height=256;var gg=gtx.getContext('2d');gg.fillStyle='#3b3a40';gg.fillRect(0,0,256,256);gg.fillStyle='#46454c';for(var i=0;i<256;i+=32){gg.fillRect(i,0,2,256);gg.fillRect(0,i,256,2)}var gt=new THREE.CanvasTexture(gtx);gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(40,40);
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(320,320),new THREE.MeshLambertMaterial({map:gt}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;sc.add(ground);
    var mats=['#c9b79a','#9fb3c8','#d29a7a','#b5c2a0','#e0c98a','#a99ab8'].map(function(c){return new THREE.MeshLambertMaterial({map:winTex(c,.25)})}),roof=lam(0x5a5560),wallM=lam(0xe2361b),plat=lam(0xf1ece2),ramp=lam(0x3fa9ff);
    var N=6,BS=16,ST=10,S0=-(N*(BS+ST))/2;V.lim=-S0+6;
    for(var bx=0;bx<N;bx++)for(var bz=0;bz<N;bz++){var x0=S0+bx*(BS+ST)+ST/2,z0=S0+bz*(BS+ST)+ST/2;
      if(bx===2&&bz===2){/* place centrale : plateformes en escalier et un mât */for(var k=0;k<5;k++)addBox(sc,x0+2+k*2.4,0,z0+3+k*1.6,x0+4.2+k*2.4,1.2+k*1.3,z0+5.2+k*1.6,plat);addBox(sc,x0+12,0,z0+10,x0+13,14,z0+11,plat);continue}
      var split=RND()<.5;var parts=split?[[0,0,BS*.45,BS],[BS*.55,0,BS,BS]]:[[0,0,BS,BS]];
      parts.forEach(function(p){var h=7+Math.floor(RND()*7)*3;if(RND()<.24)h=34+RND()*20;var m=mats[Math.floor(RND()*mats.length)];var b=addBox(sc,x0+p[0],0,z0+p[1],x0+p[2],h,z0+p[3],m);
        if(b){b.material=m.clone();b.material.map=m.map.clone();b.material.map.needsUpdate=true;b.material.map.repeat.set(Math.max(1,(p[2]-p[0])/6),h/8)}
        var cap=new THREE.Mesh(new THREE.BoxGeometry(p[2]-p[0]+.3,.3,p[3]-p[1]+.3),roof);cap.position.set(x0+(p[0]+p[2])/2,h+.15,z0+(p[1]+p[3])/2);sc.add(cap);
        if(RND()<.5){var ax=x0+p[0]+1+RND()*(p[2]-p[0]-3),az=z0+p[1]+1+RND()*(p[3]-p[1]-3);addBox(sc,ax,h,az,ax+2,h+1.6,az+2,roof)}});
    }
    /* murs rouges pour courir dessus, dans les rues */
    for(var w=0;w<26;w++){var horiz=RND()<.5,line=Math.floor(RND()*(N+1)),off=S0+line*(BS+ST)-ST/2+ST/2+(RND()<.5?-2.2:2.2),a=S0+RND()*(N*(BS+ST)-18),L=12+RND()*8,hh=5+RND()*3;
      if(horiz)addBox(sc,a,1.2,off-.35,a+L,1.2+hh,off+.35,wallM,true);else addBox(sc,off-.35,1.2,a,off+.35,1.2+hh,a+L,wallM,true)}
    /* passerelles entre les toits et petits cubes pour sauter */
    for(var q=0;q<40;q++){var px=S0+RND()*N*(BS+ST),pz=S0+RND()*N*(BS+ST),py=1+RND()*9;addBox(sc,px,py,pz,px+2.4,py+.5,pz+2.4,RND()<.5?plat:ramp)}
    /* tremplins jaunes dans les rues : on atterrit dessus et on s'envole */
    var padM=lam(0xf3c623),np=0;for(var pd=0;pd<80&&np<18;pd++){var onX=RND()<.5,sl=S0+Math.floor(RND()*(N+1))*(BS+ST)+(RND()-.5)*4,fr=S0+RND()*N*(BS+ST),ax2=onX?sl:fr,az2=onX?fr:sl;
      if(Math.abs(ax2)>V.lim-4||Math.abs(az2)>V.lim-4||hit(ax2-1.6,0,az2-1.6,ax2+1.6,3,az2+1.6))continue;addBox(sc,ax2-1.3,0,az2-1.3,ax2+1.3,.3,az2+1.3,padM);BOX[BOX.length-1].pad=true;np++}
    /* bords de la carte */
    var L2=V.lim;[[-L2-2,-L2,L2+2,-L2+.01],[-L2-2,L2,L2+2,L2+2],[-L2-2,-L2,-L2,L2],[L2,-L2,L2+2,L2]].forEach(function(b){addBox(sc,b[0],0,b[1]-(b[1]===b[3]?1:0),b[2],10,b[3],lam(0x8a8478))});
    /* mini-carte pré-dessinée */
    var mc=document.createElement('canvas');mc.width=mc.height=200;var m2=mc.getContext('2d');m2.fillStyle='#2b2a30';m2.fillRect(0,0,200,200);BOX.forEach(function(b){if(b.y0>2&&!b.wall)return;var s=200/(2*L2);m2.fillStyle=b.pad?'#f3c623':b.wall?'#e2361b':'rgba(241,236,226,'+Math.min(.9,.3+b.y1/60)+')';m2.fillRect((b.x0+L2)*s,(b.z0+L2)*s,Math.max(1,(b.x1-b.x0)*s),Math.max(1,(b.z1-b.z0)*s))});V.mapImg=mc}
  /* ---------- collisions ---------- */
  function hit(x0,y0,z0,x1,y1,z1){for(var i=0;i<BOX.length;i++){var b=BOX[i];if(x1>b.x0&&x0<b.x1&&y1>b.y0&&y0<b.y1&&z1>b.z0&&z0<b.z1)return b}return null}
  function height(){return V.slide>0?1.0:1.8}
  function moveAxis(ax,d){var p=V.pos,h=height();p[ax]+=d;var b=hit(p.x-R,p.y,p.z-R,p.x+R,p.y+h,p.z+R);if(!b)return null;
    if(ax==='y'){if(d<0){p.y=b.y1;V.vel.y=0;V.ground=true}else{p.y=b.y0-h-.001;V.vel.y=Math.min(0,V.vel.y)}return b}
    /* petite marche : on monte dessus */if(V.wasG&&b.y1-p.y<.6&&!hit(p.x-R,b.y1+.01,p.z-R,p.x+R,b.y1+h,p.z+R)){p.y=b.y1+.001;return null}
    if(ax==='x'){p.x=d>0?b.x0-R-.001:b.x1+R+.001;V.vel.x=0}else{p.z=d>0?b.z0-R-.001:b.z1+R+.001;V.vel.z=0}return b}
  function wallNear(){var p=V.pos,h=height(),e=V.wr?.3:.55,y0=p.y+.3,y1=p.y+h-.2,res=null;
    var sides=[[1,0,p.x+R,p.z-R+.05,p.x+R+e,p.z+R-.05],[-1,0,p.x-R-e,p.z-R+.05,p.x-R,p.z+R-.05],[0,1,p.x-R+.05,p.z+R,p.x+R-.05,p.z+R+e],[0,-1,p.x-R+.05,p.z-R-e,p.x+R-.05,p.z-R]];
    sides.forEach(function(s){if(res)return;var b=hit(s[2],y0,s[3],s[4],y1,s[5]);if(b)res={nx:-s[0],nz:-s[1],b:b}});return res}
  function rayBox(o,d,b){var t0=0,t1=1e9;['x','y','z'].forEach(function(a){var lo=b[a+'0'],hi=b[a+'1'];if(Math.abs(d[a])<1e-9){if(o[a]<lo||o[a]>hi)t0=1e9}else{var ta=(lo-o[a])/d[a],tb=(hi-o[a])/d[a];if(ta>tb){var s=ta;ta=tb;tb=s}t0=Math.max(t0,ta);t1=Math.min(t1,tb)}});return t0<=t1?t0:1e9}
  function rayWorld(o,d,max){var best=max||1e9,bb=null;for(var i=0;i<BOX.length;i++){var t=rayBox(o,d,BOX[i]);if(t<best){best=t;bb=BOX[i]}}return {t:best,b:bb}}
  /* ---------- arme en main ---------- */
  function gunModel(w){var g=new THREE.Group(),m=lam(WEAP[w].col),dk=lam(0x141210);var body=new THREE.Mesh(new THREE.BoxGeometry(.07,.09,w===1?.42:w===2?.55:.26),m);g.add(body);
    var br=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,w===2?.35:.22,8),dk);br.rotation.x=Math.PI/2;br.position.set(0,.025,-(w===2?.42:w===1?.3:.2));g.add(br);
    var gr=new THREE.Mesh(new THREE.BoxGeometry(.05,.13,.06),dk);gr.position.set(0,-.08,.06);gr.rotation.x=.25;g.add(gr);if(w===1){var mg=new THREE.Mesh(new THREE.BoxGeometry(.04,.14,.06),dk);mg.position.set(0,-.1,-.08);g.add(mg)}
    if(w===2){var pump=new THREE.Mesh(new THREE.BoxGeometry(.08,.06,.14),lam(0x8a5a32));pump.position.set(0,-.03,-.25);g.add(pump)}
    var a=PP.perso&&PP.perso.get?PP.perso.get():{topCol:'#e2361b',skin:'#d9a07a'};var sl=lam(a.topCol),sk=lam(a.skin);
    [[.02,-.1,.1],[-.07,-.08,-.12]].forEach(function(h,i){var hand=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),sk);hand.position.set(h[0],h[1],h[2]);hand.scale.set(1,.9,1.3);g.add(hand);var cuff=new THREE.Mesh(new THREE.CylinderGeometry(.04,.045,.12,8),sl);cuff.rotation.x=Math.PI/2.3;cuff.position.set(h[0],h[1]-.03,h[2]+.09);g.add(cuff)});g.scale.setScalar(.75);
    var fl=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:0xffd27a}));fl.position.set(0,.025,-(w===2?.62:w===1?.43:.33));fl.visible=false;g.add(fl);g.userData.flash=fl;return g}
  function setWeapon(C,i){if(V.gun)C.cam.remove(V.gun);V.w=i;V.gun=gunModel(i);V.gun.position.set(.2,-.19,-.45);C.cam.add(V.gun);V.swap=.25;sfx.play('tick');inv()}
  /* ---------- cibles et zombies ---------- */
  function spawnTargets(C){var sc=C.scene;V.tg=[];var tries=0;while(V.tg.length<24&&tries<500){tries++;var x=(RND()*2-1)*(V.lim-6),z=(RND()*2-1)*(V.lim-6),y=2+RND()*32;
      if(hit(x-1.2,y-1.2,z-1.2,x+1.2,y+1.2,z+1.2))continue;var g=new THREE.Group(),c=document.createElement('canvas');c.width=c.height=128;var x2=c.getContext('2d');['#f1ece2','#e2361b','#f1ece2','#e2361b','#f3c623'].forEach(function(col,i){x2.fillStyle=col;x2.beginPath();x2.arc(64,64,64-i*12.5,0,7);x2.fill()});
      var disc=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.12,28),[lam(0x141210),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)})]);disc.rotation.x=Math.PI/2;g.add(disc);
      var ring=new THREE.Mesh(new THREE.TorusGeometry(.95,.04,8,30),new THREE.MeshBasicMaterial({color:0xf3c623}));g.add(ring);g.position.set(x,y,z);sc.add(g);V.tg.push({g:g,x:x,y:y,z:z,mv:RND()<.3?RND()*6:0,ph:RND()*6,alive:true})}}
  /* mode Course : 18 anneaux à traverser dans l'ordre. Le parcours est le même pour tout le monde (classement juste). */
  function spawnRings(C){var r=rng(4242),x=V.pos.x,z=V.pos.z,ang=r()*6.28;V.rings=[];V.ri=0;V.rmA=new THREE.MeshBasicMaterial({color:0xf3c623});V.rmB=new THREE.MeshBasicMaterial({color:0xf1ece2,transparent:true,opacity:.45});
    for(var i=0;i<18;i++){var ok=false,nx=0,ny=0,nz=0;for(var t=0;t<80&&!ok;t++){var a=ang+(r()-.5)*2.2,d=26+r()*16;nx=x+Math.cos(a)*d;nz=z+Math.sin(a)*d;ny=4+r()*(8+i*1.2);
        if(Math.abs(nx)>V.lim-8||Math.abs(nz)>V.lim-8){ang+=1.3;continue}if(hit(nx-3,ny-3,nz-3,nx+3,ny+3,nz+3))continue;ang=a;ok=true}
      if(!ok)continue;var g=new THREE.Group(),tor=new THREE.Mesh(new THREE.TorusGeometry(2.5,.17,10,36),V.rmA);g.add(tor);g.position.set(nx,ny,nz);g.lookAt(x,ny,z);C.scene.add(g);
      var beam=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,90,8),new THREE.MeshBasicMaterial({color:0xf3c623,transparent:true,opacity:.22,depthWrite:false}));beam.position.set(nx,45,nz);C.scene.add(beam);
      V.rings.push({g:g,t:tor,beam:beam,x:nx,y:ny,z:nz});x=nx;z=nz}showRings()}
  function showRings(){(V.rings||[]).forEach(function(r,i){r.g.visible=i===V.ri||i===V.ri+1;r.beam.visible=i===V.ri;r.t.material=i===V.ri?V.rmA:V.rmB;r.g.scale.setScalar(i===V.ri?1:.7)})}
  function zombieMesh(){var g=new THREE.Group(),sk=lam(0x7aa868),cl=lam([0x5a4a6a,0x4a5a3a,0x6a3a2a][Math.floor(Math.random()*3)]);var b=new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.4),cl);b.position.y=1.15;g.add(b);var h=new THREE.Mesh(new THREE.BoxGeometry(.48,.48,.48),sk);h.position.y=1.85;g.add(h);
    [-1,1].forEach(function(s){var e=new THREE.Mesh(new THREE.BoxGeometry(.09,.06,.02),new THREE.MeshBasicMaterial({color:0xff3b2a}));e.position.set(s*.11,1.9,-.25);g.add(e);var a=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.7),sk);a.position.set(s*.45,1.4,-.3);g.add(a);var l=new THREE.Mesh(new THREE.BoxGeometry(.24,.72,.24),lam(0x2a2a30));l.position.set(s*.17,.36,0);g.add(l);g.userData['l'+s]=l});g.traverse(function(o){if(o.isMesh)o.castShadow=true});return g}
  function spawnZombie(C){for(var k=0;k<30;k++){var a=Math.random()*7,d=25+Math.random()*35,x=V.pos.x+Math.cos(a)*d,z=V.pos.z+Math.sin(a)*d;if(Math.abs(x)>V.lim-3||Math.abs(z)>V.lim-3)continue;if(hit(x-.4,0,z-.4,x+.4,1.9,z+.4))continue;var m=zombieMesh();m.position.set(x,0,z);C.scene.add(m);V.zs.push({m:m,x:x,z:z,y:0,hp:3+Math.floor(V.wave/2),sp:3+Math.random()*1.5+V.wave*.25,alive:true,hitCd:0});return}}
  /* ---------- tir ---------- */
  function fire(C){var W=WEAP[V.w];if(V.fireCd>0||V.reload>0||V.swap>0)return;if(V.ammo[V.w]<=0){reload();return}V.ammo[V.w]--;V.fireCd=W.cd;V.recoil=Math.min(1,V.recoil+(V.w===2?1:.35));sfx.play('shoot');V.gun.userData.flash.visible=true;V.flashT=.05;
    var o=C.cam.position.clone();for(var p=0;p<W.pel;p++){var d=new THREE.Vector3((Math.random()-.5)*W.sp*2,(Math.random()-.5)*W.sp*2,-1).normalize().applyQuaternion(C.cam.quaternion);
      var wr=rayWorld(o,d,200),best=wr.t,what=null;
      (V.tg||[]).forEach(function(t){if(!t.alive)return;var oc=new THREE.Vector3(t.g.position.x-o.x,t.g.position.y-o.y,t.g.position.z-o.z),tc=oc.dot(d);if(tc<0||tc>best)return;var d2=oc.lengthSq()-tc*tc;if(d2<.85*.85){best=tc;what={t:t}}});
      (V.zs||[]).forEach(function(z){if(!z.alive)return;[[1.85,.34,2],[1.1,.48,1],[.4,.35,1]].forEach(function(sp){var oc=new THREE.Vector3(z.x-o.x,z.y+sp[0]-o.y,z.z-o.z),tc=oc.dot(d);if(tc<0||tc>best)return;var d2=oc.lengthSq()-tc*tc;if(d2<sp[1]*sp[1]){best=tc;what={z:z,mul:sp[2]}}})});
      var hp=o.clone().addScaledVector(d,Math.min(best,200));spark(C,hp,what?(what.z?0x9a1a10:0xf3c623):0xcfc8bb);
      if(what&&what.t){what.t.alive=false;C.scene.remove(what.t.g);V.hits++;var mu=Math.max(1,V.combo||0)*(V.ground?1:2);V.score+=100*mu;if(V.combo)V.comboT=5;sfx.play('win');burst(C,what.t.g.position,0xe2361b);C.pop(V.ground?'+'+100*mu:'EN L\'AIR +'+100*mu,'#f3c623','34px');if(V.tg.every(function(t){return !t.alive}))finish(C)}
      if(what&&what.z){var z=what.z;z.hp-=W.dmg*what.mul;z.flash=.1;if(z.hp<=0&&z.alive){z.alive=false;V.kills++;var mz=Math.max(1,V.combo||0)*(V.ground?1:2);V.score+=(what.mul>1?150:100)*mz;if(V.combo)V.comboT=5;if(!V.ground)C.pop('EN L\'AIR x2','#f3c623','26px');burst(C,new THREE.Vector3(z.x,1.2,z.z),0x7aa868);z.die=.6;sfx.play('hit');if(what.mul>1)C.pop('TÊTE !','#e2361b','30px')}}}}
  function reload(){var W=WEAP[V.w];if(V.reload>0||V.ammo[V.w]===W.mag)return;V.reload=W.rl;sfx.play('tick')}
  function spark(C,p,col){var m=new THREE.Mesh(new THREE.SphereGeometry(.08,6,4),new THREE.MeshBasicMaterial({color:col}));m.position.copy(p);C.scene.add(m);V.fx.push({m:m,t:.25,v:new THREE.Vector3()})}
  function burst(C,p,col){for(var i=0;i<14;i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.14),new THREE.MeshBasicMaterial({color:i%2?col:0xf1ece2}));m.position.copy(p);C.scene.add(m);V.fx.push({m:m,t:.7,v:new THREE.Vector3((Math.random()-.5)*9,Math.random()*8,(Math.random()-.5)*9)})}}
  function finish(C){if(V.over)return;V.over=true;C.stop();if(document.pointerLockElement)document.exitPointerLock();sfx.play('win');
    if(V.mode==='course'){var tc=Math.round(V.time*10)/10,nbc=C.best('course',tc,true);if(tc<90)C.win();C.over('Course terminée !','Les '+V.rings.length+' anneaux en <b>'+tc.toFixed(1)+' s</b>'+(nbc?'<br><b>Nouveau record !</b>':'<br>Record : '+C.best('course')+' s')+'<br>Astuce : lâche la corde en bas du balancement pour partir comme une fusée.','Rejouer')}
    else if(V.mode==='cibles'){var t=Math.round(V.time*10)/10,nb=C.best('temps',t,true);if(t<120)C.win();C.over('Toutes les cibles !','Temps : <b>'+t.toFixed(1)+' s</b>'+(nb?'<br><b>Nouveau record !</b>':'<br>Record : '+C.best('temps')+' s'),'Rejouer')}
    else{var nb2=C.best('pts',V.score);if(V.kills>=40)C.win();C.over('Fin de la partie','<b>'+V.score+'</b> points · '+V.kills+' zombies · vague '+V.wave+(nb2?'<br><b>Nouveau record !</b>':''),'Rejouer')}}
  /* ---------- interface (viseur, inventaire, mini-carte) ---------- */
  function ui(C){var st=C.cv.parentNode;if(!V.ui){var d=document.createElement('div');d.className='vt-ui';d.innerHTML='<div class="vt-cross"></div><canvas class="vt-map" width="160" height="160"></canvas><div class="vt-inv"></div><div class="vt-ammo"></div><div class="vt-speed"></div><div class="vt-hurt"></div><div class="vt-fast" style="position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,transparent 48%,rgba(255,255,255,.55) 135%)"></div><div class="vt-gr" style="position:absolute;left:50%;top:50%;width:36px;height:36px;margin:-18px 0 0 -18px;border:2px solid #f3c623;border-radius:50%;opacity:0;transition:opacity .1s"></div><div class="vt-combo" style="position:absolute;left:50%;top:14%;transform:translateX(-50%);text-align:center;color:#fff;font:400 34px Anton,Impact,sans-serif;text-shadow:0 2px 0 #141210;line-height:1;opacity:0"></div>';st.appendChild(d);V.ui=d}
    V.ui.hidden=false;inv()}
  function inv(){if(!V||!V.ui)return;V.ui.querySelector('.vt-inv').innerHTML=WEAP.map(function(w,i){return '<span class="'+(i===V.w?'on':'')+'"><b>'+(i+1)+'</b>'+w.n+'</span>'}).join('')+'<span class="'+(V.grap&&V.gMode==='s'?'on':'')+'"><b>Clic droit</b>Corde</span><span class="'+(V.grap&&V.gMode==='z'?'on':'')+'"><b>E</b>Traction</span>'}
  function drawMap(){var c=V.ui.querySelector('.vt-map'),g=c.getContext('2d'),L=V.lim,s=160/(2*L),px=(V.pos.x+L)*s,pz=(V.pos.z+L)*s;g.save();g.clearRect(0,0,160,160);g.beginPath();g.arc(80,80,78,0,7);g.clip();g.fillStyle='#2b2a30';g.fillRect(0,0,160,160);
    /* carte qui tourne avec le joueur, centrée sur lui */g.translate(80,80);g.rotate(V.yaw);g.scale(2.2,2.2);g.translate(-px,-pz);g.drawImage(V.mapImg,0,0,160,160);
    (V.tg||[]).forEach(function(t){if(!t.alive)return;g.fillStyle='#f3c623';g.fillRect((t.g.position.x+L)*s-1.4,(t.g.position.z+L)*s-1.4,2.8,2.8)});(V.zs||[]).forEach(function(z){if(!z.alive)return;g.fillStyle='#ff3b2a';g.beginPath();g.arc((z.x+L)*s,(z.z+L)*s,1.5,0,7);g.fill()});
    var rg=V.rings&&V.rings[V.ri];if(rg){g.fillStyle='#f3c623';g.beginPath();g.arc((rg.x+L)*s,(rg.z+L)*s,2.6,0,7);g.fill();g.strokeStyle='#141210';g.lineWidth=.6;g.stroke()}
    g.restore();g.fillStyle='#fff';g.beginPath();g.moveTo(80,72);g.lineTo(85,86);g.lineTo(80,83);g.lineTo(75,86);g.closePath();g.fill();g.strokeStyle='#f1ece2';g.lineWidth=3;g.beginPath();g.arc(80,80,78,0,7);g.stroke()}
  /* ---------- souris (vue) ---------- */
  document.addEventListener('mousemove',function(e){if(!V||!V.C||document.pointerLockElement!==V.C.cv||!V.C.running)return;var sens=.0022*(PP.store('vt-sens')||1);V.yaw-=e.movementX*sens;V.pitch=Math.max(-1.5,Math.min(1.5,V.pitch-e.movementY*sens))});
  document.addEventListener('wheel',function(e){if(!V||!V.C||!V.C.running||PP.cur()!=='volt')return;setWeapon(V.C,(V.w+(e.deltaY>0?1:2))%3)},{passive:true});
  document.addEventListener('contextmenu',function(e){if(V&&V.C&&e.target===V.C.cv)e.preventDefault()});

  PP._volt=function(){return V};PP._voltB=function(){return BOX};
  PP.arcade({id:'volt',three:true,
    setup:function(C){ag.three(C);var sc=C.scene;while(sc.children.length)sc.remove(sc.children[0]);C.cam.fov=82;C.cam.near=.05;C.cam.far=400;C.cam.updateProjectionMatrix();sc.add(C.cam);
      V={C:C,mode:C.mode,pos:new THREE.Vector3(0,0,0),vel:new THREE.Vector3(),yaw:0,pitch:0,ground:false,jumps:0,wr:null,wrT:0,slide:0,grap:null,w:0,ammo:WEAP.map(function(w){return w.mag}),fireCd:0,reload:0,swap:0,recoil:0,roll:0,fovK:0,bob:0,land:0,fx:[],zs:[],tg:[],time:0,score:0,hits:0,kills:0,wave:0,spawnT:0,over:false,hurt:0,coyote:0,combo:0,comboT:0,air:0,rings:null,ri:0,up:new THREE.Vector3(0,1,0),ui:V&&V.ui};
      buildCity(C);var sp=[0,0],rs=V.mode==='course'?rng(99):Math.random;for(var k=0;k<200;k++){var x=(rs()*2-1)*20,z=(rs()*2-1)*20;if(!hit(x-.5,0,z-.5,x+.5,2,z+.5)){sp=[x,z];break}}V.pos.set(sp[0],0,sp[1]);
      RND=rng(Date.now()%100000);if(V.mode==='cibles')spawnTargets(C);if(V.mode==='course')spawnRings(C);setWeapon(C,0);ui(C);V.ui.hidden=true;
      V.rope=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,1,6),new THREE.MeshBasicMaterial({color:0xf1ece2}));V.rope.frustumCulled=false;V.rope.visible=false;sc.add(V.rope);
      V.hook=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),new THREE.MeshBasicMaterial({color:0xf3c623}));V.hook.visible=false;sc.add(V.hook);
      C.keysText('<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> bouger · <kbd>Maj</kbd> sprint · <kbd>Espace</kbd> saut et double saut · saute contre un mur rouge (ou un bâtiment) en avançant pour courir dessus, re-saute pour rebondir · <kbd>C</kbd> glissade · <b>clic droit maintenu : corde pour se balancer</b> (lâche en bas pour t\'envoler, <kbd>Espace</kbd> pour sauter de la corde) · <kbd>E</kbd> maintenu : traction vers le point visé · tremplins jaunes · clic : tirer · <kbd>R</kbd> recharger · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> ou molette : armes · <kbd>K</kbd> <kbd>L</kbd> : souris moins ou plus rapide');
      C.over('Voltige',(V.mode==='course'?'Traverse les 18 anneaux dans l\'ordre le plus vite possible. Le prochain anneau a un rayon de lumière jaune et un point sur la mini-carte.':V.mode==='cibles'?'Explose les 24 cibles cachées dans la ville le plus vite possible.':'Des zombies arrivent par vagues pendant 3 minutes : fais le plus de points.')+'<br><b>Clic droit maintenu</b> : une corde s\'accroche au bâtiment visé et tu te balances. Lâche en bas du balancement pour t\'envoler. Enchaîne murs, glissades, tremplins et balancements pour faire monter le combo.','Jouer');
      C.cam.position.set(V.pos.x,1.6,V.pos.z);C.R.render(sc,C.cam)},
    start:function(C){if(V.time>0||V.over){this.setup(C)}ui(C);V.ui.hidden=false;V.C=C},
    close:function(C){if(V&&V.ui)V.ui.hidden=true},
    mouse:function(C,t,x,y,e){if(!C.running||!e)return;if(t==='down'){if(e.button===2){V.grapKey=true}else{V.trig=true;fire(C)}}if(t==='up'){if(e.button===2)V.grapKey=false;else V.trig=false}},
    key:function(C,k,d){if(!C.running)return;if(d){if(k==='Space')V.jumpQ=.15;if(k==='KeyC'||k==='ControlLeft')V.slideQ=.15;if(k==='KeyR')reload();if(k==='KeyK'||k==='KeyL'){var se=Math.round(Math.max(.3,Math.min(3,(PP.store('vt-sens')||1)+(k==='KeyL'?.1:-.1)))*10)/10;PP.store('vt-sens',se);C.pop('Souris x'+se.toFixed(1),'#f1ece2','24px')}if(k==='Digit1')setWeapon(C,0);if(k==='Digit2')setWeapon(C,1);if(k==='Digit3')setWeapon(C,2)}},
    step:function(C,dt){if(V.over)return;var k=C.keys,p=V.pos,v=V.vel;V.time+=dt;
      var fw=((k.KeyW||k.KeyZ||k.ArrowUp)?1:0)-((k.KeyS||k.ArrowDown)?1:0),st=((k.KeyD||k.ArrowRight)?1:0)-((k.KeyA||k.KeyQ||k.ArrowLeft)?1:0);
      var sy=Math.sin(V.yaw),cy=Math.cos(V.yaw),dx=-sy*fw+cy*st,dz=-cy*fw-sy*st,dl=Math.hypot(dx,dz);if(dl>0){dx/=dl;dz/=dl}
      var sprint=(k.ShiftLeft||k.ShiftRight)&&fw>0,max=sprint?SPR:WALK;
      V.jumpQ=Math.max(0,(V.jumpQ||0)-dt);V.slideQ=Math.max(0,(V.slideQ||0)-dt);V.coyote=V.ground?.12:Math.max(0,V.coyote-dt);
      /* glissade */
      if(V.slideQ>0&&V.ground&&V.slide<=0&&Math.hypot(v.x,v.z)>6){V.slide=.85;V.slideQ=0;var hs=Math.hypot(v.x,v.z);v.x*=(hs+4)/hs;v.z*=(hs+4)/hs;sfx.play('ui');trick(C,'GLISSADE',30)}
      if(V.slide>0){V.slide-=dt;if(V.slide<=0&&hit(p.x-R,p.y,p.z-R,p.x+R,p.y+1.8,p.z+R))V.slide=.05}
      /* grappin */
      /* v51 : clic droit = vraie corde (on se balance comme un pendule, la corde se raccourcit toute seule), E = traction directe */
      if((k.KeyE||V.grapKey)&&!V.grap&&!V.grapFail){var ap=anchor(C,!!V.grapKey);
        if(ap){V.grap=ap;V.gMode=V.grapKey?'s':'z';V.ropeL=Math.max(4,ap.distanceTo(new THREE.Vector3(p.x,p.y+1.2,p.z))*.94);V.ropeMin=Math.max(3.5,V.ropeL*.6);if(V.ground||V.gMode==='z')v.y=Math.max(v.y,5);V.ground=false;sfx.play('shoot');inv()}
        else{V.grapFail=true;C.pop('rien à accrocher','#f1ece2','22px')}}
      if(V.grap&&!(V.gMode==='s'?V.grapKey:k.KeyE))release(C);
      if(!k.KeyE&&!V.grapKey)V.grapFail=false;
      if(V.grap&&V.gMode==='z'){var to=V.grap.clone().sub(new THREE.Vector3(p.x,p.y+1.2,p.z)),dd=to.length();if(dd<2){V.grap=null;v.y=Math.max(v.y,8);V.jumps=1;trick(C,'TRACTION',40);V.grapFail=true;inv()}else{to.normalize();v.addScaledVector(to,70*dt);v.x+=dx*10*dt;v.z+=dz*10*dt;var sp2=v.length();if(sp2>30)v.multiplyScalar(30/sp2);V.ground=false}}
      var swing=V.grap&&V.gMode==='s'&&!V.ground;
      if(swing){if(p.y+1.2<V.grap.y)V.ropeL=Math.max(V.ropeMin,V.ropeL-4*dt);v.x+=dx*15*dt;v.z+=dz*15*dt}
      /* course sur les murs */
      var wn=!V.ground?wallNear():null,hsp=Math.hypot(v.x,v.z);
      if(V.ground)V.lastWall=null;
      if(wn&&!V.grap&&fw>0&&hsp>4.5&&(V.wr?V.wrT<1.7:wn.b!==V.lastWall)){if(!V.wr){V.wr=wn;V.wrT=0;V.jumps=1;v.y=Math.min(Math.max(v.y,1.5),3.2);sfx.play('tick');trick(C,'MUR',50)}V.wr=wn;V.wrT+=dt;
        var tx=-wn.nz,tz=wn.nx;if(tx*v.x+tz*v.z<0){tx=-tx;tz=-tz}var along=Math.max(hsp,9);v.x=tx*along-wn.nx*1.5;v.z=tz*along-wn.nz*1.5;v.y-=6*dt;if(v.y<-1.8)v.y=-1.8;
        var rs=(-sy*wn.nz+cy*wn.nx);V.roll+=((wn.nx*cy-wn.nz*sy>0?-.16:.16)-V.roll)*Math.min(1,dt*8)}
      else{if(V.wr){V.lastWall=V.wr.b;V.wr=null}var rt=-st*.025;if(V.grap&&V.gMode==='s')rt=Math.max(-.2,Math.min(.2,-(v.x*cy-v.z*sy)*.011));V.roll+=(rt-V.roll)*Math.min(1,dt*6);if(V.ground)V.wrT=0}
      /* saut, double saut, saut de mur */
      if(V.jumpQ>0&&V.grap&&V.gMode==='s'){release(C);v.y+=4.5;V.jumpQ=0;V.grapFail=true;sfx.play('ui')}
      if(V.jumpQ>0){if(V.wr){var w2=V.wr;v.x+=w2.nx*9;v.z+=w2.nz*9;v.y=JV;V.lastWall=w2.b;V.wr=null;V.jumpQ=0;V.jumps=1;sfx.play('ui');trick(C,'SAUT DE MUR',80)}
        else if(V.ground||V.coyote>0){v.y=JV;V.ground=false;V.coyote=0;V.jumpQ=0;V.jumps=1;if(V.slide>0){V.slide=0;v.x*=1.08;v.z*=1.08}sfx.play('ui')}
        else if(V.jumps<2){v.y=JV*.92;V.jumps=2;V.jumpQ=0;if(dl>0){var hs2=Math.max(Math.hypot(v.x,v.z),WALK);v.x=dx*hs2;v.z=dz*hs2}sfx.play('ui');for(var i=0;i<6;i++)spark(C,new THREE.Vector3(p.x+(Math.random()-.5),p.y,p.z+(Math.random()-.5)),0xf1ece2)}}
      /* accélération (sol / air) */
      if(!V.wr&&!swing&&!(V.grap&&V.gMode==='z')){var acc=V.ground?(V.slide>0?2:ACC):AIR,cur=v.x*dx+v.z*dz,add=Math.max(0,Math.min(acc*dt,max-cur));if(dl>0){v.x+=dx*add;v.z+=dz*add}
        if(V.ground&&V.slide<=0){var s3=Math.hypot(v.x,v.z),drop=s3*FRIC*dt*(dl>0?.35:1);if(s3>0){var ns=Math.max(0,s3-drop)/s3;v.x*=ns;v.z*=ns}}else if(V.ground&&V.slide>0){v.x*=Math.pow(.55,dt);v.z*=Math.pow(.55,dt)}}
      if(!V.wr)v.y-=G*(V.grap&&V.gMode==='z'?.2:1)*dt;
      /* escalade automatique d'un rebord */
      var wasGround=V.ground;V.wasG=wasGround;V.ground=false;var bxh=moveAxis('x',v.x*dt),bzh=moveAxis('z',v.z*dt),hb=bxh||bzh;
      /* on tape une façade au bout de la corde : la corde lâche et on rebondit vers le haut au lieu de rester collé */
      if(hb&&V.grap&&V.gMode==='s'&&!wasGround){V.grap=null;V.grapFail=true;v.y=Math.max(v.y,10);V.jumps=1;trick(C,'REBOND',40);inv()}
      if(hb&&fw>0&&!wasGround&&hb.y1-p.y<1.6&&hb.y1-p.y>0&&!hit(p.x-R,hb.y1+.05,p.z-R,p.x+R,hb.y1+1.85,p.z+R)){v.y=Math.max(v.y,7.5);V.jumps=1}
      var yb=moveAxis('y',v.y*dt);if(!V.ground&&hit(p.x-R,p.y-.05,p.z-R,p.x+R,p.y,p.z+R)&&v.y<=0)V.ground=true;if(p.y<0){p.y=0;v.y=0;V.ground=true}
      /* corde tendue : on reste à la longueur de la corde et on garde seulement la vitesse qui tourne autour du point d'accroche */
      if(V.grap&&V.gMode==='s'){var rx=p.x-V.grap.x,ry=p.y+1.2-V.grap.y,rz=p.z-V.grap.z,rd=Math.hypot(rx,ry,rz);
        if(rd>V.ropeL){rx/=rd;ry/=rd;rz/=rd;var ex=Math.min(rd-V.ropeL,2),vr=v.x*rx+v.y*ry+v.z*rz;if(vr>0){v.x-=rx*vr;v.y-=ry*vr;v.z-=rz*vr}var vy0=v.y,g0=V.ground;moveAxis('x',-rx*ex);moveAxis('z',-rz*ex);moveAxis('y',-ry*ex);if(-ry*ex>0){V.ground=false;v.y=vy0}else V.ground=g0||V.ground}
        var s9=v.length();if(s9>42)v.multiplyScalar(42/s9)}
      /* tremplin */
      if(yb&&yb.pad&&V.ground){v.y=24;V.ground=false;V.jumps=1;sfx.play('go');trick(C,'TREMPLIN',40);burst(C,new THREE.Vector3(p.x,p.y+.3,p.z),0xf3c623)}
      V.air=V.ground?0:V.air+dt;
      if(V.ground&&!wasGround){V.jumps=0;V.land=Math.min(.25,Math.max(0,-V.lastVy)/60);if(V.lastVy<-10)sfx.play('tick');if(V.lastAir>1.8)trick(C,'GRAND SAUT',60)}V.lastVy=v.y;V.lastAir=V.air;
      V.comboT-=dt;if(V.comboT<=0)V.combo=0;
      if(V.mode==='course'){var rg=V.rings[V.ri];if(rg&&Math.hypot(p.x-rg.x,p.y+1-rg.y,p.z-rg.z)<3.2){V.ri++;sfx.play('pickup');burst(C,new THREE.Vector3(rg.x,rg.y,rg.z),0xf3c623);C.pop(V.ri+' / '+V.rings.length,'#f3c623','40px');showRings();if(V.ri>=V.rings.length){finish(C);return}}}
      p.x=Math.max(-V.lim+.6,Math.min(V.lim-.6,p.x));p.z=Math.max(-V.lim+.6,Math.min(V.lim-.6,p.z));
      /* caméra : balancement, roulis sur les murs, champ de vision qui s'ouvre avec la vitesse */
      var spd=Math.hypot(v.x,v.z);V.bob+=V.ground&&V.slide<=0?spd*dt*1.4:0;V.land=Math.max(0,V.land-dt*.9);
      var eye=(V.slide>0?.95:1.62)+(V.ground?Math.sin(V.bob)*.035*Math.min(1,spd/8):0)-V.land;C.cam.position.set(p.x,p.y+eye,p.z);
      V.recoil=Math.max(0,V.recoil-dt*5);C.cam.rotation.order='YXZ';C.cam.rotation.set(V.pitch+V.recoil*.05,V.yaw,V.roll);
      V.fovK+=((spd>9?Math.min(26,(spd-9)*1.15):0)+(V.slide>0?6:0)-V.fovK)*Math.min(1,dt*5);C.cam.fov=82+V.fovK;C.cam.updateProjectionMatrix();
      /* arme */
      V.fireCd=Math.max(0,V.fireCd-dt);V.swap=Math.max(0,V.swap-dt);if(V.reload>0){V.reload-=dt;if(V.reload<=0){V.ammo[V.w]=WEAP[V.w].mag;sfx.play('pickup')}}
      if(V.trig&&WEAP[V.w].auto)fire(C);if(V.flashT>0){V.flashT-=dt;if(V.flashT<=0)V.gun.userData.flash.visible=false}
      var gb=V.ground?Math.sin(V.bob)*.012:0;V.gun.position.set(.2+gb,-.19-Math.abs(gb)-(V.reload>0?.15:0)-V.swap*.4,-.42+V.recoil*.08);V.gun.rotation.set(V.recoil*.25+(V.reload>0?.6:0),0,V.slide>0?.3:0);
      /* corde du grappin */
      if(V.grap){V.rope.visible=V.hook.visible=true;var gp=new THREE.Vector3(.22,-.15,-.8).applyQuaternion(C.cam.quaternion).add(C.cam.position),rd2=V.grap.clone().sub(gp),rl=rd2.length();V.rope.position.copy(gp).addScaledVector(rd2,.5);V.rope.scale.set(1,rl,1);V.rope.quaternion.setFromUnitVectors(V.up,rd2.normalize());V.hook.position.copy(V.grap)}else V.rope.visible=V.hook.visible=false;
      /* cibles qui bougent */
      (V.tg||[]).forEach(function(t){if(!t.alive)return;t.ph+=dt;if(t.mv)t.g.position.y=t.y+Math.sin(t.ph*1.2)*t.mv*.4;t.g.lookAt(C.cam.position)});
      /* zombies */
      if(V.mode==='zombies'){V.spawnT-=dt;var alive=V.zs.filter(function(z){return z.alive}).length;if(alive===0&&V.spawnT<=0&&!(V.toSpawn>0)){V.wave++;V.spawnT=2;V.toSpawn=4+V.wave*3;C.pop('VAGUE '+V.wave,'#e2361b','56px')}
        if(V.toSpawn>0&&V.spawnT<=0){V.spawnT=.35;V.toSpawn--;spawnZombie(C)}
        if(V.time>=180)finish(C)}
      V.zs.forEach(function(z){if(z.die>0){z.die-=dt;z.m.rotation.x=-(1-z.die/.6)*1.5;z.m.position.y=-(1-z.die/.6)*.4;if(z.die<=0){C.scene.remove(z.m)}return}if(!z.alive)return;
        var tx=p.x-z.x,tz=p.z-z.z,d=Math.hypot(tx,tz);if(d>.8){var sp3=z.sp*dt;var nx=z.x+tx/d*sp3,nz=z.z+tz/d*sp3;if(!hit(nx-.35,.1,z.z-.35,nx+.35,1.8,z.z+.35))z.x=nx;if(!hit(z.x-.35,.1,nz-.35,z.x+.35,1.8,nz+.35))z.z=nz}
        z.m.position.set(z.x,0,z.z);z.m.rotation.y=Math.atan2(-tx,-tz);var wk=Math.sin(V.time*8+z.x);z.m.userData['l-1'].rotation.x=wk*.6;z.m.userData['l1'].rotation.x=-wk*.6;
        z.hitCd=Math.max(0,z.hitCd-dt);if(d<1&&Math.abs(p.y-z.y)<1.5&&z.hitCd<=0){z.hitCd=1.2;V.score=Math.max(0,V.score-50);V.hurt=.4;v.x+=tx/d*10;v.z+=tz/d*10;v.y=5;V.ground=false;sfx.play('lose');C.shake(6)}});
      V.zs=V.zs.filter(function(z){return z.alive||z.die>0});
      V.fx.forEach(function(f){f.t-=dt;f.v.y-=20*dt;f.m.position.addScaledVector(f.v,dt);if(f.t<=0)C.scene.remove(f.m)});V.fx=V.fx.filter(function(f){return f.t>0});
      V.hurt=Math.max(0,V.hurt-dt);
      /* interface */
      if(V.ui){drawMap();var W=WEAP[V.w];V.ui.querySelector('.vt-ammo').innerHTML=V.reload>0?'<b>RECHARGE…</b>':'<b>'+V.ammo[V.w]+'</b> / '+W.mag;var s3d=v.length();V.ui.querySelector('.vt-speed').textContent=Math.round(s3d*3.6)+' km/h'+(V.wr?' · MUR':V.slide>0?' · GLISSE':V.grap?(V.gMode==='s'?' · CORDE':' · TRACTION'):'');V.ui.querySelector('.vt-hurt').style.opacity=V.hurt*2;
        V.ui.querySelector('.vt-fast').style.opacity=Math.max(0,Math.min(.8,(s3d-16)/22));
        V.gT=(V.gT||0)-dt;if(V.gT<=0){V.gT=.1;V.ui.querySelector('.vt-gr').style.opacity=!V.grap&&anchor(C,true)?.9:0}
        var cb=V.ui.querySelector('.vt-combo');if(V.combo>0){cb.style.opacity=Math.min(1,V.comboT);cb.innerHTML='x'+V.combo+'<div style="font:700 12px \'IBM Plex Mono\',monospace;margin-top:4px">'+V.trickN+'</div>'}else cb.style.opacity=0}
      C.hud('<span>'+(V.mode==='course'?'Anneaux <b>'+V.ri+' / '+V.rings.length+'</b>':V.mode==='cibles'?'Cibles <b>'+V.hits+' / '+V.tg.length+'</b>':'Vague <b>'+V.wave+'</b>')+'</span><span>'+(V.mode!=='zombies'?'Temps <b>'+V.time.toFixed(1)+' s</b>':'Reste <b>'+Math.max(0,Math.ceil(180-V.time))+' s</b>')+'</span><span>Points <b>'+V.score+'</b></span>'+(V.mode==='zombies'?'<span>Zombies <b>'+V.kills+'</b></span>':''))},
    draw:function(C){C.R.render(C.scene,C.cam)}});
})();
