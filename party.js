/* Pixel Pause — Dernier Debout : 12 blobs (joueurs + bots), 3 épreuves éliminatoires jusqu'au dernier.
   1 à 4 joueurs sur un clavier, ou en salon (l'hôte calcule tout, les autres envoient leurs touches). */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,net=PP.net,mp=PP.mp,cv=$('pa-cv');
  var COLS=[0xe2361b,0x3fa9ff,0x3f8f3a,0xd4a32a,0x8a3fb5,0x2fa3a3,0xd06090,0xf1ece2],BOTC=[0x9a8f86,0x86909a,0x9a8698,0x8a9a86];
  var BOTN=['Pépito','Gribouille','Tofu','Biscotte','Moumoute','Patapouf','Zigzag','Croquette','Bidule','Nougat','Pistache','Ratatouille'];
  var KEYMAP={z:'1U',w:'1U',s:'1D',q:'1L',a:'1L',d:'1R',' ':'1X',ArrowUp:'2U',ArrowDown:'2D',ArrowLeft:'2L',ArrowRight:'2R',Enter:'2X',i:'3U',k:'3D',j:'3L',l:'3R',o:'3X','8':'4U','5':'4D','4':'4L','6':'4R','0':'4X'};
  var GAMES={
    race :{n:'La Course',d:'Atteins l\'arche d\'arrivée. Seuls les plus rapides passent.',ty:'race',c:'#3fa9ff',g:'▶'},
    doors:{n:'Les Portes',d:'Fonce dans les portes : certaines cassent, d\'autres sont en béton.',ty:'race',c:'#d4a32a',g:'▦'},
    hex  :{n:'Sol qui fond',d:'Les dalles disparaissent sous tes pieds. Ne tombe pas tout en bas.',ty:'surv',c:'#9be27a',g:'⬢'},
    rocks:{n:'Pluie de rochers',d:'Des rochers tombent du ciel et roulent. Reste sur la plateforme.',ty:'surv',c:'#8a7a6a',g:'●'},
    arena:{n:'La Balayeuse',d:'Saute par-dessus la barre. Le dernier debout gagne tout.',ty:'final',c:'#e2361b',g:'—'},
    summit:{n:'Le Sommet',d:'Grimpe la tour en spirale. Le premier qui touche la couronne gagne.',ty:'final',c:'#8a3fb5',g:'▲'}
  },STAGES=[['race','doors'],['hex','rocks'],['arena','summit']],sched=['race','hex','arena'];
  var ROUNDS={length:3};function gid(){return sched[ri]}function TY(){return GAMES[gid()].ty}
  var R3=null,scene,cam,level,players=[],keys={},remote={},humans=1,running=false,raf=0,last=0,ri=0,T=0,phase='idle',phaseT=0,obs=[],floorsL=[],tiles=[],sendT=0,myIdx=0,camT=new THREE.Vector3(),winner=null,camYaw=[0,0,0,0],camPitch=[.35,.35,.35,.35],camDist=7.5,mouseT=0,remoteYaw={},cams=[],yawAcc=0,mouseCam=false,banners={};

  /* ---------- Rendu ---------- */
  function lam(o){return new THREE.MeshLambertMaterial(o)}
  function init(){
    if(R3)return true;if(!window.THREE){PP.toast('La 3D n\'a pas pu se charger','warn');return false}
    R3=new THREE.WebGLRenderer({canvas:cv,antialias:true});R3.setSize(cv.width,cv.height,false);R3.shadowMap.enabled=true;R3.toneMapping=THREE.ACESFilmicToneMapping;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x8fd0f5);scene.fog=new THREE.Fog(0x8fd0f5,60,170);
    cam=new THREE.PerspectiveCamera(55,cv.width/cv.height,.1,300);
    scene.add(new THREE.HemisphereLight(0xffffff,0x8a7a9a,1));var sun=new THREE.DirectionalLight(0xffffff,1.3);sun.position.set(20,40,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);var c=sun.shadow.camera;c.left=c.bottom=-60;c.right=c.top=60;c.far=150;scene.add(sun);scene.add(sun.target);sun.target.position.set(0,0,-50);
    // décor : sol lointain et nuages
    var sea=new THREE.Mesh(new THREE.PlaneGeometry(600,600),lam({color:0xff9ad1}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-30,-50);scene.add(sea);
    for(var i=0;i<16;i++){var cl=new THREE.Mesh(new THREE.SphereGeometry(6+Math.random()*6,12,8),lam({color:0xffffff,emissive:0x777777}));cl.scale.y=.5;cl.position.set((Math.random()-.5)*220,10+Math.random()*30,-50+(Math.random()-.5)*200);scene.add(cl)}
    level=new THREE.Group();scene.add(level);
    return true;
  }
  function blob(col,hat){
    var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:col,roughness:.35,metalness:0}),white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.3}),black=new THREE.MeshStandardMaterial({color:0x141210,roughness:.2});
    var body=new THREE.Mesh(new THREE.CapsuleGeometry(.46,.5,10,24),m);body.position.y=.78;body.castShadow=true;g.add(body);
    var face=new THREE.Mesh(new THREE.SphereGeometry(.34,24,16),new THREE.MeshStandardMaterial({color:0xfff3e0,roughness:.5}));face.scale.set(1,.85,.45);face.position.set(0,1.02,-.3);g.add(face);
    [-.12,.12].forEach(function(x){var e=new THREE.Mesh(new THREE.SphereGeometry(.075,14,10),black);e.scale.set(1,1.35,.6);e.position.set(x,1.07,-.43);g.add(e);var hl=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),white);hl.position.set(x+.025,1.11,-.47);g.add(hl)});
    var mouth=new THREE.Mesh(new THREE.TorusGeometry(.06,.016,6,12,Math.PI),black);mouth.rotation.z=Math.PI;mouth.position.set(0,.95,-.44);g.add(mouth);
    [-.2,.2].forEach(function(x){var ck=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshStandardMaterial({color:0xff8a8a}));ck.position.set(x,.97,-.4);ck.scale.z=.4;g.add(ck)});
    var arms=[-1,1].map(function(s){var a=new THREE.Group();a.position.set(s*.47,.85,0);var hand=new THREE.Mesh(new THREE.SphereGeometry(.13,14,10),m);hand.position.set(s*.12,-.18,0);hand.castShadow=true;a.add(hand);g.add(a);return a});
    var feet=[-1,1].map(function(s){var f=new THREE.Mesh(new THREE.SphereGeometry(.16,14,10),m);f.scale.set(1,.55,1.35);f.position.set(s*.2,.08,-.04);f.castShadow=true;g.add(f);return f});
    var hm=new THREE.MeshStandardMaterial({color:[0xe2361b,0x3fa9ff,0xd4a32a,0x3f8f3a,0xf1ece2,0x8a3fb5][hat%6],roughness:.4});
    if(hat%5===0){var cap=new THREE.Mesh(new THREE.SphereGeometry(.4,16,10,0,Math.PI*2,0,Math.PI/2),hm);cap.position.y=1.28;g.add(cap);var bill=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.04,16,1,false,0,Math.PI),hm);bill.rotation.y=Math.PI/2;bill.position.set(0,1.29,-.28);g.add(bill)}
    else if(hat%5===1){var bn=new THREE.Mesh(new THREE.SphereGeometry(.41,16,10,0,Math.PI*2,0,Math.PI/2.2),hm);bn.position.y=1.25;g.add(bn);var pom=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),white);pom.position.y=1.66;g.add(pom)}
    else if(hat%5===2){[-1,1].forEach(function(s){var ear=new THREE.Mesh(new THREE.ConeGeometry(.13,.28,4),m);ear.position.set(s*.24,1.5,0);ear.rotation.z=-s*.3;g.add(ear)})}
    else if(hat%5===3){var cr=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.18,5,1,true),new THREE.MeshStandardMaterial({color:0xd4a32a,metalness:.6,roughness:.3,side:THREE.DoubleSide}));cr.position.y=1.42;g.add(cr)}
    else{var pr=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.25,6),black);pr.position.y=1.38;g.add(pr);var bl=new THREE.Mesh(new THREE.BoxGeometry(.7,.03,.12),hm);bl.position.y=1.52;g.add(bl);g.userData.prop=bl}
    g.userData.arms=arms;g.userData.feet=feet;g.userData.body=body;return g;
  }
  function tag(t,col){var c=document.createElement('canvas');c.width=256;c.height=64;var g=c.getContext('2d');g.fillStyle='#'+('00000'+col.toString(16)).slice(-6);g.fillRect(20,8,216,48);g.fillStyle='#141210';g.font='bold 30px IBM Plex Mono, monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(t,128,33);var s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));s.scale.set(2,.5,1);s.position.y=1.9;s.renderOrder=9;return s}

  /* ---------- Joueurs ---------- */
  function makePlayers(){
    players.forEach(function(p){scene.remove(p.m)});players=[];
    /* en salon : uniquement les joueurs du salon, sans bots */
    for(var i=0;i<(mp.on()?Math.max(2,humans):12);i++){
      var human=i<humans,col=human?COLS[i%COLS.length]:BOTC[i%BOTC.length],nm=human?(mp.on()&&net.players[i]?net.players[i].name:'J'+(i+1)):BOTN[i%BOTN.length];
      var m=blob(col,i*7+3);if(human)m.add(tag(nm,col));scene.add(m);
      players.push({i:i,human:human,bot:!human,name:nm,col:col,m:m,x:0,y:0,z:0,vx:0,vy:0,vz:0,face:Math.PI,g:false,st:'in',cp:0,anim:Math.random()*6,ai:{t:0,lane:(Math.random()-.5)*8,jt:0,skill:.75+Math.random()*.25}});
    }
  }
  function input(p){
    if(p.bot)return p.ai.inp||{};
    if(mp.on())return p.i===0?mp.localInput(keys):(remote[p.i]||{});
    var k=String(p.i+1);return {U:keys[k+'U'],D:keys[k+'D'],L:keys[k+'L'],R:keys[k+'R'],X:keys[k+'X']};
  }

  /* ---------- Niveaux ---------- */
  function boxMesh(x,y,z,w,h,d,col){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam({color:col}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;level.add(m);return m}
  function floor(x0,x1,z0,z1,top,col,stripe){var w=x1-x0,d=z1-z0;var m=boxMesh((x0+x1)/2,top-.5,(z0+z1)/2,w,1,d,col);if(stripe){for(var s=z0+1;s<z1;s+=4){var st=boxMesh((x0+x1)/2,top+.01,s,w,.02,1.2,stripe);st.castShadow=false}}floorsL.push({x0:x0,x1:x1,z0:z0,z1:z1,top:top});return m}
  function clearLevel(){while(level.children.length)level.remove(level.children[0]);obs=[];floorsL=[];tiles=[]}
  function buildRace(){
    clearLevel();
    floor(-8,8,-14,4,0,0xf1ece2,0xffc2e2);
    floor(-7,7,-42,-14,0,0x7fd0ff,0x5ab8ee);
    [-20,-28,-36].forEach(function(z,k){addBar(0,z,7,.6,(k%2?-1:1)*(.9+k*.2),0xe2361b)});
    floor(-7,7,-62,-47,0,0xffd36b,0xffbe3d);
    [-1,0,1].forEach(function(k){addHammer(k*4.6,-52-k*2,2.6,1.6+k*.3,k*2)});
    floor(-2,2,-74,-62,0,0xb48cff,null);floor(-7,-4,-74,-62,0,0xb48cff,null);floor(4,7,-74,-62,0,0xb48cff,null);
    addPusher(-68,5,1.1);addPusher(-72,-5,1.4);
    floor(-8,8,-104,-74,0,0x9be27a,0x7cc95a);
    [-80,-88,-96].forEach(function(z,k){addBar(0,z,7.5,.6,(k%2?1:-1)*(1.1+k*.25),0x3fa9ff)});
    floor(-9,9,-122,-104,0,0xf1ece2,null);
    // arche d'arrivée
    boxMesh(-6,3,-108,1,6,1,0xe2361b);boxMesh(6,3,-108,1,6,1,0xe2361b);var top=boxMesh(0,6.3,-108,13,1,1,0x141210);
    var c=document.createElement('canvas');c.width=512;c.height=64;var g=c.getContext('2d');g.fillStyle='#141210';g.fillRect(0,0,512,64);g.fillStyle='#f1ece2';g.font='bold 40px Anton, Impact, sans-serif';g.textAlign='center';g.fillText('ARRIVÉE',256,48);var pl=new THREE.Mesh(new THREE.PlaneGeometry(12,1.2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));pl.position.set(0,6.3,-107.4);level.add(pl);
    for(var i=-8;i<8;i++)boxMesh(i+.5,.02,-108,1,.04,1,(i%2?0x141210:0xffffff)).castShadow=false;
  }
  function addBar(cx,cz,len,h,w,col){var g=new THREE.Group();g.position.set(cx,h,cz);var b=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,len*2,12),lam({color:col}));b.rotation.z=Math.PI/2;b.castShadow=true;g.add(b);var hub=new THREE.Mesh(new THREE.CylinderGeometry(.6,.7,h+.4,14),lam({color:0x141210}));hub.position.y=-h/2+.2;g.add(hub);[-1,1].forEach(function(s){var cap=new THREE.Mesh(new THREE.SphereGeometry(.4,12,10),lam({color:0xffffff}));cap.position.x=s*len;g.add(cap)});level.add(g);obs.push({k:'bar',cx:cx,cz:cz,len:len,h:h,w:w,g:g,a:Math.random()*6})}
  function addHammer(cx,cz,amp,w,ph){var m=boxMesh(cx,1,cz,1.6,2,1.6,0x141210);var top=boxMesh(cx,5,cz,.2,6,.2,0x555555);obs.push({k:'ham',cx:cx,cz:cz,amp:amp,w:w,ph:ph,m:m,top:top,x:cx})}
  function addPusher(cz,dir,w){var m=boxMesh(0,1,cz,3,2,2,0xe2361b);obs.push({k:'push',cz:cz,amp:6,w:w,ph:dir,m:m,x:0})}
  function buildHex(){
    clearLevel();var R=1.25,H=Math.sqrt(3)*R;
    [0,-7].forEach(function(y,layer){
      for(var q=-9;q<=9;q++)for(var r=-9;r<=9;r++){var x=R*1.5*q,z=H*(r+q/2);if(Math.hypot(x,z)>11.5)continue;
        var col=layer?0xffb3d9:[0x7fd0ff,0xffd36b,0x9be27a][(q+r+30)%3];var m=new THREE.Mesh(new THREE.CylinderGeometry(R*.96,R*.96,.6,6),lam({color:col}));m.rotation.y=Math.PI/6;m.position.set(x,y-.3,z);m.castShadow=true;m.receiveShadow=true;level.add(m);
        tiles.push({x:x,z:z,y:y,r:R*.9,st:0,t:0,m:m,col:col})}
    });
  }
  function buildArena(){
    clearLevel();
    var disk=new THREE.Mesh(new THREE.CylinderGeometry(11,11,1,48),lam({color:0xf1ece2}));disk.position.y=-.5;disk.receiveShadow=true;level.add(disk);
    for(var i=0;i<6;i++){var ring=new THREE.Mesh(new THREE.TorusGeometry(2+i*1.6,.05,6,64),lam({color:0xe2361b}));ring.rotation.x=Math.PI/2;ring.position.y=.01;level.add(ring)}
    floorsL.push({disk:true,r:11,top:0,m:disk});
    addBar(0,0,11,.6,1.2,0xe2361b);
  }
  function resetYaws(){players.forEach(function(p){if(!p.human)return;var k=mp.on()?0:p.i;if(mp.on()&&p.i!==myIdx)return;camYaw[k]=startYaw(p)})}
  function startPositions(){
    var alive=players.filter(function(p){return p.st!=='out'});
    alive.forEach(function(p,k){
      if(TY()==='race'){p.x=-6+(k%6)*2.4;p.z=2-(k/6|0)*2.2;p.y=0}
      else{var a=k/alive.length*Math.PI*2;var rr=gid()==='summit'?11:7;p.x=Math.cos(a)*rr;p.z=Math.sin(a)*rr;p.y=gid()==='hex'?.2:0}
      p.vx=p.vy=p.vz=0;p.st='in';p.cp=0;p.face=TY()==='race'?Math.PI:Math.atan2(p.x,p.z);p.ai.door=null;p.m.visible=true;p.fin=0;
    });
  }

  /* ---------- Nouvelles épreuves ---------- */
  function buildDoors(){
    clearLevel();
    floor(-8,8,-96,6,0,0xf1ece2,0xffe3a3);
    var R=Math.random;
    [-14,-28,-42,-56,-70].forEach(function(z,row){
      var xs=[-6,-3,0,3,6],reals=[];while(reals.length<(row<2?3:2)){var k=R()*5|0;if(reals.indexOf(k)<0)reals.push(k)}
      boxMesh(0,3.4,z,16,.5,1,0x141210);
      xs.forEach(function(x,k){var m=boxMesh(x,1.5,z,2.8,3,.5,[0xd4a32a,0xe2361b,0x3fa9ff,0x3f8f3a,0x8a3fb5][(k+row)%5]);var knob=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),lam({color:0xf1ece2}));knob.position.set(.9,0,.3);m.add(knob);obs.push({k:'door',x:x,z:z,real:reals.indexOf(k)>=0,alive:true,m:m,row:row})});
      [-7.6,7.6].forEach(function(x){boxMesh(x,1.7,z,.4,3.4,1,0x141210)});
    });
    boxMesh(-6,3,-84,1,6,1,0xe2361b);boxMesh(6,3,-84,1,6,1,0xe2361b);boxMesh(0,6.3,-84,13,1,1,0x141210);
    for(var i=-8;i<8;i++)boxMesh(i+.5,.02,-84,1,.04,1,(i%2?0x141210:0xffffff)).castShadow=false;
  }
  function buildRocks(){
    clearLevel();
    var f=floor(-12,12,-12,12,0,0xd9cfb8,null);
    for(var i=-12;i<12;i+=3)for(var j=-12;j<12;j+=3)if((i+j)/3%2===0){var t=boxMesh(i+1.5,.01,j+1.5,3,.02,3,0xc8bea6);t.castShadow=false}
    [[-12,0,.6,24],[12,0,.6,24],[0,-12,24,.6],[0,12,24,.6]].forEach(function(b){var e=boxMesh(b[0],.15,b[1],b[2],.3,b[3],0xe2361b);e.castShadow=false});
  }
  var ROCKG=null;
  function spawnRock(){
    if(!ROCKG){ROCKG=new THREE.DodecahedronGeometry(1.1,1)}
    var al=aliveList(),tp=al.length&&Math.random()<.6?PP.pick(al):null,x=tp?tp.x+(Math.random()-.5)*4:(Math.random()-.5)*22,z=tp?tp.z+(Math.random()-.5)*4:(Math.random()-.5)*22;
    x=Math.max(-11,Math.min(11,x));z=Math.max(-11,Math.min(11,z));
    var m=new THREE.Mesh(ROCKG,lam({color:0x7a6a5a,flatShading:true}));m.castShadow=true;m.position.set(x,20,z);level.add(m);
    var sh=new THREE.Mesh(new THREE.RingGeometry(.6,1.1,20),new THREE.MeshBasicMaterial({color:0xe2361b,transparent:true,opacity:.7}));sh.rotation.x=-Math.PI/2;sh.position.set(x,.03,z);level.add(sh);
    obs.push({k:'rock',x:x,y:20,z:z,vy:0,vx:0,vz:0,m:m,sh:sh,t:0,land:false});
  }
  var SUMMIT=[];
  function buildSummit(){
    clearLevel();SUMMIT=[];
    floor(-14,14,-14,14,0,0x9be27a,0x7cc95a);
    var core=new THREE.Mesh(new THREE.CylinderGeometry(3,3.4,20,20),lam({color:0xf1ece2}));core.position.y=10;core.castShadow=true;level.add(core);
    for(var k=0;k<16;k++){var a=k*.72+.3,r=7.5,x=Math.cos(a)*r,z=Math.sin(a)*r,y=1+k*1.05,s=k===15?5:4.2;
      var col=[0xffd36b,0x7fd0ff,0xffb3d9,0xb48cff][k%4];floor(x-s/2,x+s/2,z-s/2,z+s/2,y,col,null);SUMMIT.push({x:x,z:z,y:y});
      if(k===5||k===10)addBar(x,z,1.7,y+.6,2.2,0xe2361b);
    }
    var top=SUMMIT[15],crown=new THREE.Group();
    var ring=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.35,16,1,true),new THREE.MeshStandardMaterial({color:0xd4a32a,metalness:.7,roughness:.25,side:THREE.DoubleSide}));crown.add(ring);
    for(var i=0;i<5;i++){var sp=new THREE.Mesh(new THREE.ConeGeometry(.16,.5,6),ring.material);var aa=i/5*Math.PI*2;sp.position.set(Math.cos(aa)*.62,.4,Math.sin(aa)*.62);crown.add(sp)}
    crown.position.set(top.x,top.y+1.6,top.z);level.add(crown);var gl=new THREE.PointLight(0xffd060,2,10);gl.position.copy(crown.position);level.add(gl);
    obs.push({k:'crown',x:top.x,y:top.y,z:top.z,m:crown});
  }
  function stepNewObs(dt,host){
    obs.forEach(function(o){
      if(o.k==='crown')o.m.rotation.y+=dt*1.5;
      if(o.k==='rock'&&host){o.t+=dt;
        if(!o.land){o.vy-=22*dt;o.y+=o.vy*dt;if(o.y<=1.1){o.y=1.1;o.land=true;var a=Math.random()*6.28,s=4+Math.random()*4;o.vx=Math.cos(a)*s;o.vz=Math.sin(a)*s;sfx.play('crash');level.remove(o.sh)}}
        else{o.x+=o.vx*dt;o.z+=o.vz*dt;if(Math.abs(o.x)>12||Math.abs(o.z)>12){o.vy-=22*dt;o.y+=o.vy*dt}o.m.rotation.x+=o.vz*dt;o.m.rotation.z-=o.vx*dt}
        o.m.position.set(o.x,o.y,o.z);if(o.y<-20||o.t>7){level.remove(o.m);level.remove(o.sh);o.dead=1}}
      if(o.k==='door'&&!o.alive&&o.m.visible){o.fall=(o.fall||0)+dt;o.m.rotation.x=-Math.min(1.5,o.fall*4);o.m.position.y=1.5-Math.min(1.4,o.fall*3);if(o.fall>1.2)o.m.visible=false}
    });
    obs=obs.filter(function(o){return !o.dead});
  }
  function hitNewObs(p){
    obs.forEach(function(o){
      if(o.k==='door'&&o.alive&&Math.abs(p.x-o.x)<1.5&&Math.abs(p.z-o.z)<.75&&p.y<3){
        if(o.real){o.alive=false;sfx.play('crash');}else{p.z=o.z+.8;p.vz=6;p.vy=3;p.stun=.45;o.known=true;if(!p.bot)sfx.play('hit');if(p.bot)p.ai.door=null}}
      if(o.k==='rock'){var dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz);if(d<1.55&&Math.abs(p.y+.7-o.y)<1.6){dx/=d||1;dz/=d||1;p.vx=dx*10+o.vx*.5;p.vz=dz*10+o.vz*.5;p.vy=6;p.stun=.6;if(!p.bot)sfx.play('hit')}}
    });
  }
  /* ---------- Roulette ---------- */
  function roulette(id,stage){
    var el=$('pa-roul'),pool=Object.keys(GAMES),strip=[];for(var r=0;r<5;r++)pool.forEach(function(k){strip.push(k)});
    var target=4*pool.length+pool.indexOf(id);
    el.innerHTML='<span class="lbl">Épreuve '+(stage+1)+' sur 3 · tirage</span><div class="ro-win"><div class="ro-strip" id="pa-strip">'+strip.map(function(k){var g=GAMES[k];return '<div class="ro-card" style="--c:'+g.c+'"><i>'+g.g+'</i><b>'+esc(g.n)+'</b><small>'+(g.ty==='race'?'course':g.ty==='surv'?'survie':'finale')+'</small></div>'}).join('')+'</div><div class="ro-mark"></div></div><p class="ro-d" id="pa-rod"></p>';
    el.hidden=false;var st=$('pa-strip'),cw=150;st.style.transform='translateX(0)';
    requestAnimationFrame(function(){requestAnimationFrame(function(){st.style.transition='transform 2.6s cubic-bezier(.12,.75,.2,1)';st.style.transform='translateX(calc(50% - '+(target*cw+cw/2)+'px))'})});
    var tk=0,iv=setInterval(function(){tk++;sfx.play('tick');if(tk>9)clearInterval(iv)},230);
    setTimeout(function(){var g=GAMES[id];$('pa-rod').innerHTML='<b>'+esc(g.n)+'</b> · '+esc(g.d);sfx.play('win');st.children[target].classList.add('on')},2700);
    clearTimeout(roulette.t);roulette.t=setTimeout(function(){el.hidden=true},4300);
  }
  function buildFor(id){({race:buildRace,doors:buildDoors,hex:buildHex,rocks:buildRocks,arena:buildArena,summit:buildSummit})[id]()}
  /* ---------- Physique ---------- */
  function groundAt(p){
    var best=-1e9;
    floorsL.forEach(function(f){if(f.disk){if(Math.hypot(p.x,p.z)<f.r&&p.y>=f.top-.6)best=Math.max(best,f.top)}else if(p.x>f.x0-.2&&p.x<f.x1+.2&&p.z>f.z0-.2&&p.z<f.z1+.2&&p.y>=f.top-.6)best=Math.max(best,f.top)});
    var tl=null;tiles.forEach(function(t){if(t.st<2&&Math.hypot(p.x-t.x,p.z-t.z)<t.r&&p.y>=t.y-.6&&t.y>best){best=t.y;tl=t}});
    return {y:best,tile:tl};
  }
  function segHit(p,o){
    var ang=o.a,dx=Math.cos(ang),dz=-Math.sin(ang),rx=p.x-o.cx,rz=p.z-o.cz,proj=rx*dx+rz*dz;if(Math.abs(proj)>o.len)return null;
    var px=rx-proj*dx,pz=rz-proj*dz,d=Math.hypot(px,pz);if(d>.75||p.y>o.h+.35)return null;
    return {nx:px/(d||1),nz:pz/(d||1),r:proj};
  }
  function stepObs(dt){
    stepNewObs(dt,!mp.on()||net.isHost);
    obs.forEach(function(o){
      if(o.k==='bar'){var sp=o.w*(gid()==='arena'?1+T*.025:1);o.a+=sp*dt;o.g.rotation.y=o.a;o.sp=sp}
      if(o.k==='ham'){o.x=o.cx+Math.sin(T*o.w+o.ph)*o.amp;o.m.position.x=o.x;o.top.position.x=o.x;o.vx=Math.cos(T*o.w+o.ph)*o.amp*o.w}
      if(o.k==='push'){o.x=Math.sin(T*o.w+o.ph)*o.amp;o.m.position.x=o.x;o.vx=Math.cos(T*o.w+o.ph)*o.amp*o.w}
    });
  }
  function hitObs(p){
    obs.forEach(function(o){
      if(o.k==='bar'){var h=segHit(p,o);if(h){var tang=o.sp*h.r;var tx=-Math.sin(o.a)*tang,tz=-Math.cos(o.a)*tang;var sgn=Math.sign(h.nx*tx+h.nz*tz)||1;var kk=Math.min(11,Math.abs(tang)*1.1+3);p.vx=h.nx*sgn*kk+tx*.3;p.vz=h.nz*sgn*kk+tz*.3;p.vy=Math.max(p.vy,5);p.stun=.5;if(!p.bot)sfx.play('hit')}}
      if(o.k==='ham'||o.k==='push'){var w=o.k==='ham'?1.1:1.8;if(Math.abs(p.x-o.x)<w&&Math.abs(p.z-o.cz)<1.2&&p.y<2){var dir=Math.sign(p.x-o.x)||1;p.vx=dir*Math.max(9,Math.abs(o.vx)*1.5);p.vy=Math.max(p.vy,4);p.stun=.5;if(!p.bot)sfx.play('hit')}}
    });
  }
  function yawOf(p){if(p.bot)return 0;if(mp.on())return p.i===myIdx?camYaw[0]:(remoteYaw[p.i]!=null?remoteYaw[p.i]:startYaw(p));return camYaw[p.i]||0}
  function startYaw(p){return TY()!=='race'?Math.atan2(p.x,p.z):0}
  function physics(p,dt){
    var inp=input(p),fw=(inp.U?1:0)-(inp.D?1:0),sr=(inp.R?1:0)-(inp.L?1:0),y=yawOf(p),mx=p.bot?sr:-Math.sin(y)*fw+Math.cos(y)*sr,mz=p.bot?-fw:-Math.cos(y)*fw-Math.sin(y)*sr,ml=Math.hypot(mx,mz);if(ml){mx/=ml;mz/=ml}
    p.stun=Math.max(0,(p.stun||0)-dt);var ctl=p.stun>0?.15:(p.g?1:.45),spd=7.2*(p.bot?p.ai.skill:1);
    p.vx+=(mx*spd-p.vx)*Math.min(1,dt*8*ctl);p.vz+=(mz*spd-p.vz)*Math.min(1,dt*8*ctl);
    if(ml)p.face=Math.atan2(-mx,-mz)+Math.PI;
    if(inp.X&&p.g&&!p.jl){p.vy=7.6;p.g=false;if(!p.bot)sfx.play('ui')}p.jl=!!inp.X;
    p.vy-=20*dt;
    var nx=p.x+p.vx*dt,nz=p.z+p.vz*dt,ny=p.y+p.vy*dt;p.x=nx;p.z=nz;
    var gr=groundAt({x:p.x,y:p.y,z:p.z});
    if(ny<=gr.y&&p.vy<=0){p.y=gr.y;p.vy=0;p.g=true;if(gr.tile&&gr.tile.st===0){gr.tile.st=1;gr.tile.t=.85}}else{p.y=ny;p.g=false}
    hitObs(p);hitNewObs(p);
    // collisions entre joueurs
    players.forEach(function(q){if(q===p||q.st!=='in'||q.i<p.i)return;var dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.9&&d>0&&Math.abs(q.y-p.y)<1.2){var push=(.9-d)/2;dx/=d;dz/=d;p.x-=dx*push;p.z-=dz*push;q.x+=dx*push;q.z+=dz*push}});
  }

  /* ---------- IA des bots ---------- */
  function ai(p,dt){
    var a=p.ai,inp={};a.t-=dt;var id=gid();
    if(id==='doors'){
      inp.U=true;var nr=null;obs.forEach(function(o){if(o.k==='door'&&o.z<p.z-.2&&(!nr||o.z>nr))nr=o.z});
      if(nr!==null){if(!a.door||a.door.z!==nr){var row=obs.filter(function(o){return o.k==='door'&&o.z===nr}),open=row.filter(function(o){return !o.alive}),cand=row.filter(function(o){return o.alive&&!o.known});a.door=open.length&&Math.random()<.85?PP.pick(open):PP.pick(cand.length?cand:row)}
        if(a.door.x<p.x-.3)inp.L=true;if(a.door.x>p.x+.3)inp.R=true;if(Math.abs(a.door.x-p.x)>1.2&&p.z-nr<2.5)inp.U=false}
    }else if(id==='rocks'){
      if(a.t<=0){a.t=.8+Math.random();a.gx=(Math.random()-.5)*14;a.gz=(Math.random()-.5)*14}var gx2=a.gx,gz2=a.gz;
      obs.forEach(function(o){if(o.k==='rock'){var dd=Math.hypot(o.x-p.x,o.z-p.z);if(dd<4&&Math.random()<a.skill){gx2=p.x+(p.x-o.x)*2;gz2=p.z+(p.z-o.z)*2}}});gx2=Math.max(-9,Math.min(9,gx2));gz2=Math.max(-9,Math.min(9,gz2));
      if(gx2<p.x-.4)inp.L=true;if(gx2>p.x+.4)inp.R=true;if(gz2<p.z-.4)inp.U=true;if(gz2>p.z+.4)inp.D=true;
    }else if(id==='summit'){
      var cur=-1;SUMMIT.forEach(function(s,k){if(Math.abs(p.x-s.x)<2.3&&Math.abs(p.z-s.z)<2.3&&p.y>=s.y-.3)cur=Math.max(cur,k)});var nx=SUMMIT[Math.min(15,cur+1)];
      if(nx){if(nx.x<p.x-.3)inp.L=true;if(nx.x>p.x+.3)inp.R=true;if(nx.z<p.z-.3)inp.U=true;if(nx.z>p.z+.3)inp.D=true;if(p.g&&Math.hypot(nx.x-p.x,nx.z-p.z)<3.6&&nx.y>p.y-.2&&Math.random()<a.skill*.35)inp.X=true}
      obs.forEach(function(o){if(o.k==='bar'&&Math.hypot(p.x-o.cx,p.z-o.cz)<2.5&&Math.random()<.3)inp.X=true});
    }else if(id==='race'){
      inp.U=true;var tx=a.lane;
      if(p.z<-62&&p.z>-74){tx=Math.abs(a.lane)<3?0:(a.lane<0?-5.5:5.5)}
      if(p.z<-46&&p.z>-62){obs.forEach(function(o){if(o.k==='ham'&&Math.abs(p.z-o.cz)<3&&Math.abs(tx-o.x)<1.6)tx+=o.x>tx?-2:2})}
      if(tx<p.x-.4)inp.L=true;if(tx>p.x+.4)inp.R=true;
      var ahead=groundAt({x:p.x,y:p.y+.1,z:p.z-1.8});if(p.g&&ahead.y<-5)inp.X=true;
      obs.forEach(function(o){if(o.k==='bar'&&Math.abs(p.z-o.cz)<o.len){var h=segHit({x:p.x-Math.sin(o.a)*0,y:0,z:p.z},{a:o.a+o.sp*.25,cx:o.cx,cz:o.cz,len:o.len,h:o.h});if(h&&Math.random()<a.skill)inp.X=true}});
      if(a.t<=0){a.t=1.5+Math.random()*2;a.lane=(Math.random()-.5)*9}
    }else if(id==='hex'){
      if(a.t<=0||!a.goal){a.t=.6+Math.random();var best=null,bd=1e9;tiles.forEach(function(t){if(t.st===0&&Math.abs(t.y-p.y)<1&&Math.hypot(t.x,t.z)<10){var d=Math.hypot(t.x-p.x,t.z-p.z)+Math.random()*2;if(d>1.2&&d<bd){bd=d;best=t}}});a.goal=best}
      if(a.goal){if(a.goal.x<p.x-.3)inp.L=true;if(a.goal.x>p.x+.3)inp.R=true;if(a.goal.z<p.z-.3)inp.U=true;if(a.goal.z>p.z+.3)inp.D=true}
      var here=groundAt({x:p.x,y:p.y,z:p.z});if(here.tile&&here.tile.st===1&&Math.random()<dt*3)inp.X=true;
    }else{
      var d=Math.hypot(p.x,p.z);if(a.t<=0){a.t=1+Math.random()*2;var an=Math.random()*6.28;a.gx=Math.cos(an)*4;a.gz=Math.sin(an)*4}
      var gx=d>7?0:a.gx,gz=d>7?0:a.gz;if(gx<p.x-.4)inp.L=true;if(gx>p.x+.4)inp.R=true;if(gz<p.z-.4)inp.U=true;if(gz>p.z+.4)inp.D=true;
      obs.forEach(function(o){if(o.k==='bar'){var h=segHit({x:p.x,y:0,z:p.z},{a:o.a+o.sp*.22,cx:0,cz:0,len:o.len,h:o.h});if(h&&Math.random()<a.skill*.92)inp.X=true}});
    }
    a.inp=inp;
  }

  /* ---------- Boucle ---------- */
  function aliveList(){return players.filter(function(p){return p.st==='in'})}
  function startRound(){
    sched[ri]=PP.pick(STAGES[ri]);var id=gid();buildFor(id);winner=null;step.rk=1;
    startPositions();T=0;phase='count';phaseT=7.6;resetYaws();roulette(id,ri);
    var n=players.filter(function(p){return p.st!=='out'}).length;
    if(mp.on()&&net.isHost)net.broadcast({t:'pa-round',r:ri,id:id});
  }
  function qualifTarget(){var n=players.filter(function(p){return p.st!=='out'}).length;return TY()==='race'?Math.max(2,Math.ceil(n*.67)):TY()==='surv'?Math.max(2,Math.ceil(n/2)):1}
  function count(t){var e=$('pa-count');e.textContent=t;e.classList.remove('on');void e.offsetWidth;e.classList.add('on')}
  function banner(p,t,cls){banners[p.i]={t:t,c:cls,until:performance.now()+2600}}
  function say(t,m){$('pa-say').innerHTML='<b>'+esc(t)+'</b>'+(m?'<span>'+esc(m)+'</span>':'');$('pa-say').classList.remove('on');void $('pa-say').offsetWidth;$('pa-say').classList.add('on')}
  function step(dt){
    if(phase==='count'){phaseT-=dt;var c=Math.ceil(phaseT);if(c!==step.lc&&c>0&&c<=3){step.lc=c;sfx.play('tick');count(String(c))}if(phaseT<=0){phase='play';count('PARTEZ');sfx.play('go')}stepObs(dt);return}
    if(phase==='inter'){phaseT-=dt;if(phaseT<=0){ri++;startRound()}return}
    if(phase!=='play')return;
    T+=dt;stepObs(dt);var id=gid();
    players.forEach(function(p){if(p.st!=='in')return;if(p.bot)ai(p,dt);physics(p,dt);
      if(id==='doors'){if(p.y<-8){p.y=1;p.vy=0;p.z=Math.min(p.z+4,2)}if(p.z<-84&&!p.fin){p.fin=1;p.st='q';p.order=players.filter(function(q){return q.fin}).length;if(p.human){sfx.play('win');banner(p,'QUALIFIÉ · '+p.order+'e','good')}p.m.visible=false}}
      else if(id==='summit'){if(p.y<-6){p.x=(Math.random()-.5)*16;p.z=12;p.y=1;p.vx=p.vy=p.vz=0}var cr=SUMMIT[15];if(cr&&!winner&&Math.hypot(p.x-cr.x,p.z-cr.z)<1.6&&p.y>cr.y-.2){winner=p;p.st='crown'}}
      else if(id==='race'){if(p.z<-44)p.cp=Math.max(p.cp,1);if(p.z<-74)p.cp=Math.max(p.cp,2);
        if(p.y<-8){var cz=[-2,-49,-77][p.cp];p.x=(Math.random()-.5)*6;p.z=cz;p.y=1;p.vx=p.vy=p.vz=0;p.stun=.4}
        if(p.z<-108&&!p.fin){p.fin=1;p.st='q';p.order=players.filter(function(q){return q.fin}).length;if(p.human){sfx.play('win');banner(p,'QUALIFIÉ · '+p.order+'e','good')}p.m.visible=false}}
      else if(p.y<(id==='hex'?-12:-6)){p.st='out';p.m.visible=false;if(p.human){sfx.play('lose');banner(p,'ÉLIMINÉ','bad')}else sfx.play('crash')}
    });
    tiles.forEach(function(t){if(t.st===1){t.t-=dt;t.m.position.y=t.y-.3+Math.sin(T*60)*.04;t.m.material.color.setHex(0xff6a5a);if(t.t<=0){t.st=2;t.m.visible=false}}});
    if(id==='rocks'){step.rk=(step.rk||0)-dt;if(step.rk<=0){step.rk=Math.max(.22,.75-T*.008);spawnRock()}}
    if(id==='arena'&&T>25){var rr=Math.max(4,11-(T-25)*.12);floorsL[0].r=rr;floorsL[0].m.scale.set(rr/11,1,rr/11)}
    // fin de manche
    var target=qualifTarget(),left=aliveList();
    if(id==='summit'){if(winner){players.forEach(function(p){if(p!==winner)p.st='out'});winner.st='in';endRound()}return hud()}
    if(TY()==='race'){var q=players.filter(function(p){return p.st==='q'}).length;if(T>100&&q<target){left.sort(function(a,b){return a.z-b.z}).slice(0,target-q).forEach(function(p){p.st='q'});left=aliveList();q=target}if(q>=target||(left.length===0)){left.forEach(function(p){p.st='out';p.m.visible=false});endRound()}}
    else if(left.length<=target||T>(id==='rocks'?80:120)){if(id==='arena'&&left.length>1&&T<=120)return;endRound()}
    hud();
  }
  function endRound(){
    var id=gid();players.forEach(function(p){if(p.st==='q'||p.st==='in')p.st='ok'});
    var ok=players.filter(function(p){return p.st==='ok'});
    if(TY()==='final'||ok.length<=1||ri>=2){
      var w=winner&&winner.st==='ok'?winner:(ok.length?ok.sort(function(a,b){return (b.y||0)-(a.y||0)})[0]:null);winner=w;phase='end';
      finish(w);return}
    players.forEach(function(p){if(p.st==='ok')p.st='in'});
    var outN=players.filter(function(p){return p.st==='out'}).length;
    var meIn=players.filter(function(p){return p.human&&p.st!=='out'}).map(function(p){return p.name});
    inter();phase='inter';phaseT=5;
    if(mp.on()&&net.isHost)net.broadcast({t:'pa-inter',l:players.map(function(p){return [p.name,p.st==='out'?0:1,p.human?1:0,p.col]}),r:ri});
  }
  function inter(list){
    list=list||players.map(function(p){return [p.name,p.st==='out'?0:1,p.human?1:0,p.col]});var el=$('pa-inter');
    el.innerHTML='<span class="lbl">Fin de l\'épreuve '+(ri+1)+'</span><b class="pi-t">'+list.filter(function(x){return x[1]}).length+' qualifiés</b><div class="pi-grid">'+list.map(function(x,k){return '<div class="pi-c '+(x[1]?'ok':'out')+(x[2]?' me':'')+'" style="animation-delay:'+(k*60)+'ms"><i style="background:#'+('00000'+x[3].toString(16)).slice(-6)+'"></i>'+esc(x[0])+'<small>'+(x[1]?'qualifié':'éliminé')+'</small></div>'}).join('')+'</div><p class="pi-next">Prochaine épreuve : <b>tirage au sort</b> parmi '+STAGES[Math.min(2,ri+1)].map(function(k){return GAMES[k].n}).join(' ou ')+'.</p>';
    el.hidden=false;clearTimeout(inter.t);inter.t=setTimeout(function(){el.hidden=true},4800);
  }
  function finish(w){
    running=false;cancelAnimationFrame(raf);
    var t=w?(w.human?w.name+' est le dernier debout !':w.name+' (bot) gagne…'):'Personne ne reste debout';
    if(w&&w.human&&(!mp.on()&&w.i===0||mp.on()&&w.name===net.me.name))PP.stat('party','win');
    if(w&&w.human)sfx.play('win');else sfx.play('lose');
    $('pa-title').textContent=t;$('pa-msg').innerHTML=(w?'<span class="pa-crown" style="--c:#'+('00000'+w.col.toString(16)).slice(-6)+'"></span>':'')+'Les 12 repartent à zéro pour un nouveau tour.';confetti();$('pa-start').textContent=mp.on()?'Relancer pour tout le salon':'Rejouer';$('pa-start').hidden=mp.on()&&!net.isHost;$('pa-ov').hidden=false;
    if(mp.on()&&net.isHost)net.broadcast({t:'pa-end',title:t});
    if(w){w.m.visible=true;w.x=0;w.z=0;w.y=0;render(0)}
  }
  function confetti(){var box=$('pa-confetti');box.innerHTML='';for(var i=0;i<70;i++){var d=document.createElement('i');d.style.left=Math.random()*100+'%';d.style.background=['#e2361b','#3fa9ff','#d4a32a','#3f8f3a','#f1ece2','#d06090'][i%6];d.style.animationDelay=(Math.random()*1.2)+'s';d.style.animationDuration=(2+Math.random()*1.6)+'s';box.appendChild(d)}setTimeout(function(){box.innerHTML=''},4200)}
  function hud(){
    var id=gid(),left=aliveList().length,q=players.filter(function(p){return p.st==='q'}).length;
    $('pa-hud').innerHTML='';
    $('pa-top').innerHTML='<div class="pt-dots">'+STAGES.map(function(r,k){return '<i class="'+(k<ri?'done':k===ri?'now':'')+'">'+(k+1)+'</i>'}).join('')+'<span>'+esc(GAMES[gid()].n)+'</span></div><div class="pt-big">'+(TY()==='race'?'<b>'+q+'</b><small>/ '+qualifTarget()+' qualifiés</small>':id==='summit'?'<b>'+(SUMMIT.length?Math.max.apply(null,aliveList().map(function(p){return Math.round(p.y)})):0)+' m</b><small>le plus haut · couronne à '+Math.round(SUMMIT[15]?SUMMIT[15].y:0)+' m</small>':'<b>'+left+'</b><small>'+(TY()==='surv'?'debout · objectif '+qualifTarget():'encore debout')+'</small>')+'</div><div class="pt-time">'+(phase==='play'?Math.floor(T/60)+':'+('0'+Math.floor(T%60)).slice(-2):'')+'</div>';
  }
  function views(){
    if(mp.on())return [players[myIdx]];
    return players.filter(function(p){return p.human});
  }
  function rects(n,W,H){if(n<=1)return [[0,0,W,H]];if(n===2)return [[0,0,W/2,H],[W/2,0,W/2,H]];return [[0,H/2,W/2,H/2],[W/2,H/2,W/2,H/2],[0,0,W/2,H/2],[W/2,0,W/2,H/2]].slice(0,n)}
  function angDiff(a,b){var d=(a-b)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d}
  function render(dt){
    if(!R3)return;dt=dt||0;
    players.forEach(function(p){var mv=Math.hypot(p.vx,p.vz)>.5&&p.g;p.anim+=(mv?.28:.06);var u=p.m.userData;p.sq=(p.sq||0)*.85;if(p.g&&!p.wasG)p.sq=.25;p.wasG=p.g;var sq=p.sq;p.m.position.set(p.x,p.y+(mv?Math.abs(Math.sin(p.anim))*.08:Math.sin(p.anim*.5)*.02),p.z);p.m.rotation.y=p.face;p.m.rotation.z=mv?Math.sin(p.anim)*.06:0;p.m.scale.set(1+sq*.4,p.g?1-sq:1.1,1+sq*.4);u.feet[0].position.z=mv?Math.sin(p.anim)*.22-.04:-.04;u.feet[1].position.z=mv?-Math.sin(p.anim)*.22-.04:-.04;u.arms[0].rotation.x=p.g?Math.sin(p.anim)*.7:-2.6;u.arms[1].rotation.x=p.g?-Math.sin(p.anim)*.7:-2.6;u.arms[0].rotation.z=p.g?0:.4;u.arms[1].rotation.z=p.g?0:-.4;if(u.prop)u.prop.rotation.y+=p.g?.1:.6});
    var vs=views(),W=cv.width,H=cv.height,rs=rects(vs.length,W,H),now=performance.now(),lab='';
    R3.setScissorTest(true);
    vs.forEach(function(p,k){
      var c=cams[k];if(!c){c=cams[k]=new THREE.PerspectiveCamera(62,1,.1,300);c.userData.t=new THREE.Vector3(p.x,p.y,p.z)}
      var tgt=p;if(p.st!=='in'){var al=aliveList();if(al.length)tgt=al.sort(function(a,b){return a.z-b.z})[0]}
      var yk=mp.on()?0:p.i;
      if(tgt===p&&p.st==='in'&&!(k===0&&performance.now()-mouseT<2500)){var sp=Math.hypot(p.vx,p.vz);if(sp>2.5&&phase==='play'){var want=Math.atan2(-p.vx,-p.vz),df=angDiff(want,camYaw[yk]);if(Math.abs(df)<2.4)camYaw[yk]+=df*Math.min(1,dt*1.6)}}
      var y=tgt===p?camYaw[yk]:(TY()==='race'?0:Math.atan2(tgt.x,tgt.z));
      var t=c.userData.t;t.lerp(new THREE.Vector3(tgt.x,Math.max(tgt.y,-4),tgt.z),Math.min(1,dt*8));
      var pt=camPitch[yk]||.35,dist=k===0?camDist:7.5,hd=Math.cos(pt)*dist,hgt=Math.sin(pt)*dist+1.2;c.position.set(t.x+Math.sin(y)*hd,t.y+hgt,t.z+Math.cos(y)*hd);c.lookAt(t.x,t.y+1.3,t.z);
      var r=rs[k];c.aspect=r[2]/r[3];c.updateProjectionMatrix();R3.setViewport(r[0],r[1],r[2],r[3]);R3.setScissor(r[0],r[1],r[2],r[3]);R3.render(scene,c);
      var bn=banners[p.i],sc=100/W,top=(H-r[1]-r[3])/H*100;
      lab+='<div class="pv" style="left:'+(r[0]*sc)+'%;top:'+top+'%;width:'+(r[2]*sc)+'%;height:'+(r[3]/H*100)+'%"><span class="pv-n" style="background:#'+('00000'+p.col.toString(16)).slice(-6)+'">'+esc(p.name)+(p.st!=='in'?' · spectateur':'')+'</span>'+(bn&&bn.until>now?'<b class="pv-b '+bn.c+'">'+esc(bn.t)+'</b>':'')+'</div>';
    });
    R3.setScissorTest(false);
    var pvEl=$('pa-views');if(pvEl.dataset.h!==lab){pvEl.innerHTML=lab;pvEl.dataset.h=lab}
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){if(!mp.on()||net.isHost){step(dt);sendState(dt)}else{guestStep(dt);yawAcc-=dt;if(yawAcc<=0){yawAcc=.1;net.send({t:'pa-yaw',y:+camYaw[0].toFixed(3)})}}render(dt);raf=requestAnimationFrame(loop)}}

  /* ---------- Salon ---------- */
  function sendState(dt){
    if(!mp.on()||!net.isHost)return;sendT-=dt;if(sendT>0)return;sendT=.05;
    net.broadcast({t:'pa-s',r:ri,id:gid(),dr:obs.filter(function(o){return o.k==='door'}).map(function(o){return o.alive?1:0}).join(''),rk:obs.filter(function(o){return o.k==='rock'}).map(function(o){return [+o.x.toFixed(1),+o.y.toFixed(1),+o.z.toFixed(1)]}),T:+T.toFixed(2),ph:phase,p:players.map(function(p){return [+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2),+p.face.toFixed(2),p.st==='in'?1:p.st==='q'?2:0,+p.vx.toFixed(1),+p.vz.toFixed(1),p.g?1:0]}),ti:tiles.length?tiles.map(function(t){return t.st}).join(''):'',a:obs.map(function(o){return o.a!==undefined?+o.a.toFixed(3):0}),fr:floorsL[0]&&floorsL[0].disk?+floorsL[0].r.toFixed(2):0});
  }
  var gs=null;
  function guestStep(dt){
    if(!gs)return;T=gs.T;
    players.forEach(function(p,i){var s=gs.p[i];if(!s)return;p.x+=(s[0]-p.x)*Math.min(1,dt*15);p.y+=(s[1]-p.y)*Math.min(1,dt*15);p.z+=(s[2]-p.z)*Math.min(1,dt*15);p.face=s[3];p.st=s[4]===1?'in':s[4]===2?'q':'out';p.m.visible=s[4]===1;p.vx=s[5];p.vz=s[6];p.g=!!s[7]});
    obs.forEach(function(o,k){if(o.k==='bar'){o.a=gs.a[k];o.g.rotation.y=o.a}});stepObsGuest();
    if(gs.ti)tiles.forEach(function(t,k){var v=+gs.ti[k];if(v!==t.st){t.st=v;if(v===1)t.m.material.color.setHex(0xff6a5a);if(v===2)t.m.visible=false}});
    if(gs.dr){var ds=obs.filter(function(o){return o.k==='door'});ds.forEach(function(o,k){if(gs.dr[k]==='0'&&o.alive){o.alive=false}})}
    if(gs.rk){var rs2=obs.filter(function(o){return o.k==='rock'});while(rs2.length<gs.rk.length){if(!ROCKG)ROCKG=new THREE.DodecahedronGeometry(1.1,1);var mm=new THREE.Mesh(ROCKG,lam({color:0x7a6a5a,flatShading:true}));mm.castShadow=true;level.add(mm);var o2={k:'rock',m:mm,gst:1};obs.push(o2);rs2.push(o2)}rs2.forEach(function(o,k){var r=gs.rk[k];if(r){o.m.visible=true;o.m.position.set(r[0],r[1],r[2]);o.m.rotation.x+=.05}else o.m.visible=false})}
    stepNewObs(dt,false);
    if(gs.fr&&floorsL[0]&&floorsL[0].disk)floorsL[0].m.scale.set(gs.fr/11,1,gs.fr/11);
    hud();
  }
  function stepObsGuest(){obs.forEach(function(o){if(o.k==='ham'){o.x=o.cx+Math.sin(T*o.w+o.ph)*o.amp;o.m.position.x=o.x;o.top.position.x=o.x}if(o.k==='push'){o.x=Math.sin(T*o.w+o.ph)*o.amp;o.m.position.x=o.x}})}
  net.on(function(m){
    if(net.isHost||PP.cur()!=='party')return;
    if(m.t==='pa-go'){humans=m.n;begin()}
    if(m.t==='pa-round'){ri=m.r;sched[ri]=m.id;buildFor(m.id);roulette(m.id,ri)}
    if(m.t==='pa-s'){gs=m;if(m.r!==ri||m.id!==sched[ri]){ri=m.r;sched[ri]=m.id;buildFor(m.id)}}
    if(m.t==='pa-say')say(m.a,m.b);
    if(m.t==='pa-inter'){ri=m.r;inter(m.l)}
    if(m.t==='pa-end'){running=false;cancelAnimationFrame(raf);$('pa-title').textContent=m.title;$('pa-msg').textContent='L\'hôte peut relancer.';$('pa-start').hidden=true;$('pa-ov').hidden=false;if(m.title.indexOf(net.me.name+' ')===0)PP.stat('party','win')}
  });
  mp.hostInputs('party',remote);
  net.on(function(m,from){if(m.t==='pa-yaw'&&net.isHost){var sl=net.slot(from);if(sl>=0)remoteYaw[sl]=m.y}});
  /* souris : tourner la caméra (joueur 1) */
  cv.addEventListener('click',function(){if(running&&cv.requestPointerLock)try{var r=cv.requestPointerLock();if(r&&r.catch)r.catch(function(){})}catch(e){}});
  document.addEventListener('pointerlockchange',function(){mouseCam=document.pointerLockElement===cv});
  document.addEventListener('mousemove',function(e){if(mouseCam&&running){var ps=PP.settings.sens/100;camYaw[0]-=e.movementX*.004*ps;camPitch[0]=Math.max(-.15,Math.min(1.35,camPitch[0]+e.movementY*.003*ps*(PP.settings.invY?-1:1)));mouseT=performance.now()}});
  cv.addEventListener('wheel',function(e){if(!running)return;e.preventDefault();camDist=Math.max(3.5,Math.min(16,camDist+e.deltaY*.01))},{passive:false});
  keys=PP.held('pa-pad',KEYMAP,function(k,e){if(PP.cur()==='party'&&running&&e.preventDefault)e.preventDefault()});
  mp.guestSender('party',keys);

  /* ---------- Menus ---------- */
  $('pa-modes').addEventListener('click',function(e){var b=e.target.closest('[data-n]');if(!b)return;humans=+b.dataset.n;$('pa-modes').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x===b)})});
  function begin(){
    if(!init())return;ri=0;winner=null;gs=null;cams=[];banners={};$('pa-inter').hidden=true;$('pa-roul').hidden=true;myIdx=mp.on()?Math.max(0,net.slot(net.me.id)):0;makePlayers();
    $('pa-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);
    if(!mp.on()||net.isHost)startRound();else{sched[0]='race';buildRace();startPositions()}
    raf=requestAnimationFrame(loop);
  }
  $('pa-start').addEventListener('click',function(){if(mp.on()){if(!net.isHost)return;humans=Math.min(8,net.players.length);net.broadcast({t:'pa-go',n:humans})}begin()});
  PP._pa=function(){return {obs:function(){return obs},T:function(){return T},players:players,ri:function(){return ri},phase:function(){return phase},tiles:tiles,setRound:function(r){ri=r;startRound()},force:function(r,id){var s0=STAGES[r];STAGES[r]=[id];ri=r;startRound();STAGES[r]=s0}}};
  PP.games.party={
    open:function(){if(!init())return;if(!players.length){humans=1;ri=0;sched=['race','hex','arena'];makePlayers();buildRace();startPositions()}render();$('pa-start').hidden=false;$('pa-title').textContent='Dernier Debout';$('pa-start').textContent='Jouer';$('pa-msg').textContent='12 blobs, 3 épreuves tirées au sort parmi 6 : une course, une survie, puis une finale. Les bots complètent. Le dernier debout gagne.';$('pa-ov').hidden=false;
      if(mp.lobby('pa','Dernier Debout'))$('pa-msg').textContent=net.isHost?net.players.length+' joueurs dans le salon, sans bots. ZQSD ou flèches pour bouger, Espace pour sauter.':'L\'hôte va lancer. ZQSD ou flèches pour bouger, Espace pour sauter.'},
    close:function(){if(running){running=false;cancelAnimationFrame(raf)}}
  };
})();
