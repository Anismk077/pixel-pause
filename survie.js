/* Pixel Pause — Survie 3D : une grande île, faim et soif, coffres, armes, récolte, base à construire,
   cycle jour / nuit avec des zombies la nuit. Sauvegarde automatique dans le navigateur. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,cv=$('sv-cv');
  var SIZE=640,HALF=SIZE/2,SEG=200,EYE=1.7,DAY=360;

  /* ---------- Bruit et relief ---------- */
  function hash(x,z,s){var h=Math.sin(x*127.1+z*311.7+s*74.7)*43758.5453;return h-Math.floor(h)}
  function vnoise(x,z,s){var xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
    var a=hash(xi,zi,s),b=hash(xi+1,zi,s),c=hash(xi,zi+1,s),d=hash(xi+1,zi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
  function fbm(x,z,s){var t=0,a=1,f=1,n=0;for(var i=0;i<5;i++){t+=vnoise(x*f,z*f,s+i*13)*a;n+=a;a*=.5;f*=2.03}return t/n}
  var SEED=1;
  function height(x,z){
    var d=Math.hypot(x,z)/HALF,fall=Math.max(0,1-Math.pow(d,2.4));
    var h=(fbm(x/90,z/90,SEED)-.42)*38+(fbm(x/22,z/22,SEED+5)-.5)*5;
    var m=fbm(x/160,z/160,SEED+9);if(m>.6)h+=(m-.6)*120;
    return h*fall-(1-fall)*14+2;
  }
  function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}

  /* ---------- État ---------- */
  var R3,scene,cam,vscene,vcam,sun,amb,sky,water,terrain,running=false,paused=false,raf=0,last=0,keys={},mouseDown=false;
  var P,inv,world,structs=[],zombies=[],animals=[],drops=[],cols=[],grid={},trees=null,rocks=null,bushes=[],chests=[],tool='axe',swing=0,cd=0,dayT=.3,day=1,saveT=0,buildMode=null,ghost=null,ghostRot=0,msgT=0,ray=new THREE.Raycaster(),flash=0,lastHurt=0,spawnT=0;
  var TOOLS={axe:{n:'Hache',dmg:34,range:2.8,rate:.55},pistol:{n:'Pistolet',dmg:38,rate:.3,ammo:true},rifle:{n:'Fusil',dmg:30,rate:.12,ammo:true,auto:true}};
  var BUILD={
    wall :{n:'Mur en bois',cost:{bois:4},hp:200},
    door :{n:'Porte (tu passes, pas les zombies)',cost:{bois:6},hp:160},
    fire :{n:'Feu de camp (cuire, lumière)',cost:{bois:3,pierre:2},hp:80},
    spike:{n:'Piques (blessent les zombies)',cost:{bois:3,pierre:1},hp:120},
    bed  :{n:'Lit (réapparition, dormir la nuit)',cost:{bois:6,tissu:2},hp:100},
    box  :{n:'Coffre de base (garde 50 % au réveil)',cost:{bois:5},hp:120}
  };
  var NAMES={bois:'Bois',pierre:'Pierre',baies:'Baies',viande:'Viande crue',cuite:'Viande cuite',conserve:'Conserves',eau:'Bouteilles d\'eau',bandage:'Bandages',munitions:'Munitions',tissu:'Tissu'};

  /* ---------- Collisions (grille de 8 m) ---------- */
  function gk(x,z){return Math.floor(x/8)+','+Math.floor(z/8)}
  function addCol(c){c.k=gk(c.x,c.z);(grid[c.k]=grid[c.k]||[]).push(c);cols.push(c);return c}
  function remCol(c){var l=grid[c.k];if(l){var i=l.indexOf(c);if(i>=0)l.splice(i,1)}c.dead=true}
  function near(x,z,r){var out=[],x0=Math.floor((x-r)/8),x1=Math.floor((x+r)/8),z0=Math.floor((z-r)/8),z1=Math.floor((z+r)/8);for(var i=x0;i<=x1;i++)for(var j=z0;j<=z1;j++){var l=grid[i+','+j];if(l)for(var k=0;k<l.length;k++)out.push(l[k])}return out}
  function hitsCol(x,z,r,who){
    var l=near(x,z,r+3);
    for(var i=0;i<l.length;i++){var c=l[i];if(c.dead)continue;
      if(c.box){if(c.type==='door'&&who==='p')continue;if(c.type==='spike'||c.type==='fire'||c.type==='bed'||c.type==='box'){if(who!=='z'||c.type!=='spike'){}}
        var dx=Math.abs(x-c.x),dz=Math.abs(z-c.z);if(dx<c.hw+r&&dz<c.hd+r)return c}
      else if(Math.hypot(x-c.x,z-c.z)<c.r+r)return c}
    return null;
  }
  function moveCirc(e,dx,dz,r,who){
    var hit=null,c;
    c=hitsCol(e.x+dx,e.z,r,who);if(!c&&height(e.x+dx,e.z)>-1.2)e.x+=dx;else hit=c||hit;
    c=hitsCol(e.x,e.z+dz,r,who);if(!c&&height(e.x,e.z+dz)>-1.2)e.z+=dz;else hit=c||hit;
    return hit;
  }

  /* ---------- Monde ---------- */
  function lam(o){return new THREE.MeshLambertMaterial(o)}
  function init(){
    if(R3)return true;
    if(!window.THREE){PP.toast('La 3D (three.js) n\'a pas pu se charger','warn');return false}
    R3=new THREE.WebGLRenderer({canvas:cv,antialias:true});R3.setSize(cv.width,cv.height,false);R3.autoClear=false;R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFSoftShadowMap;
    cam=new THREE.PerspectiveCamera(72,cv.width/cv.height,.1,500);cam.rotation.order='YXZ';
    vscene=new THREE.Scene();vcam=new THREE.PerspectiveCamera(60,cv.width/cv.height,.01,10);
    vscene.add(new THREE.HemisphereLight(0xffffff,0x444444,1.1));var dl=new THREE.DirectionalLight(0xffffff,.7);dl.position.set(1,2,1);vscene.add(dl);
    return true;
  }
  function buildWorld(seed){
    SEED=seed;scene=new THREE.Scene();cols=[];grid={};structs=[];zombies=[];animals=[];drops=[];bushes=[];chests=[];
    sky=new THREE.Color(0x9cc4e4);scene.background=sky.clone();scene.fog=new THREE.Fog(sky.getHex(),60,260);
    amb=new THREE.HemisphereLight(0xdfefff,0x4a5a30,.9);scene.add(amb);
    sun=new THREE.DirectionalLight(0xfff2dc,1.2);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);var sc=sun.shadow.camera;sc.left=sc.bottom=-45;sc.right=sc.top=45;sc.near=1;sc.far=220;sun.shadow.bias=-.0008;scene.add(sun);scene.add(sun.target);
    // relief
    var g=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);g.rotateX(-Math.PI/2);
    var pos=g.attributes.position,col=new Float32Array(pos.count*3),c=new THREE.Color();
    for(var i=0;i<pos.count;i++){var x=pos.getX(i),z=pos.getZ(i),h=height(x,z);pos.setY(i,h);
      var n=hash(Math.floor(x),Math.floor(z),3)*.06;
      if(h<.6)c.setRGB(.82+n,.76+n,.56);else if(h<14)c.setRGB(.31+n,.48+n*1.5,.2);else if(h<24)c.setRGB(.42+n,.45+n,.33);else c.setRGB(.55+n,.54+n,.52+n);
      if(h>32)c.setRGB(.93,.94,.96);
      col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    terrain=new THREE.Mesh(g,lam({vertexColors:true}));terrain.receiveShadow=true;scene.add(terrain);
    water=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshPhongMaterial({color:0x2a6f93,transparent:true,opacity:.82,shininess:90,specular:0x88aacc}));water.rotation.x=-Math.PI/2;water.position.y=-.2;scene.add(water);
    // végétation, rochers, buissons, coffres
    var R=rng(seed),tl=[],rl=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s3=new THREE.Vector3(),p3=new THREE.Vector3();
    for(var t=0;t<2600;t++){var x2=(R()-.5)*SIZE*.92,z2=(R()-.5)*SIZE*.92,h2=height(x2,z2);if(h2<1.5||h2>26)continue;if(fbm(x2/40,z2/40,seed+20)<.45&&R()<.7)continue;tl.push({x:x2,z:z2,y:h2,s:.8+R()*.7,k:R()<.6?0:1,r:R()*6})}
    for(var r=0;r<520;r++){var x3=(R()-.5)*SIZE*.9,z3=(R()-.5)*SIZE*.9,h3=height(x3,z3);if(h3<.5)continue;rl.push({x:x3,z:z3,y:h3,s:.6+R()*1.4,r:R()*6})}
    function inst(geo,mat,list,fn){var im=new THREE.InstancedMesh(geo,mat,list.length);im.castShadow=true;im.receiveShadow=true;list.forEach(function(o,i){fn(o,i,m4);im.setMatrixAt(i,m4)});scene.add(im);return im}
    var trunkG=new THREE.CylinderGeometry(.22,.34,4,7);trunkG.translate(0,2,0);
    var pineG=new THREE.ConeGeometry(1.9,5.5,8);pineG.translate(0,5.2,0);var pine2=new THREE.ConeGeometry(1.4,3.6,8);pine2.translate(0,7.4,0);
    var leafG=new THREE.IcosahedronGeometry(2.4,1);leafG.translate(0,5,0);
    var pines=tl.filter(function(o){return o.k===0}),oaks=tl.filter(function(o){return o.k===1});
    function place(o,i,m){q.setFromAxisAngle(new THREE.Vector3(0,1,0),o.r);s3.set(o.s,o.s,o.s);p3.set(o.x,o.y-.2,o.z);m.compose(p3,q,s3)}
    trees={list:tl,meshes:[]};
    [[pines,[trunkG,pineG,pine2],[0x5b3b22,0x2f5a2a,0x3a6b32]],[oaks,[trunkG,leafG],[0x5f4027,0x4f7f2e]]].forEach(function(set){
      var ms=set[1].map(function(geo,j){return inst(geo,lam({color:set[2][j]}),set[0],place)});
      set[0].forEach(function(o,i){o.ms=ms;o.i=i;o.hp=4;addCol({x:o.x,z:o.z,r:.45*o.s,type:'tree',ref:o})});
      trees.meshes.push(ms);
    });
    var rockG=new THREE.DodecahedronGeometry(1,0);
    rocks=inst(rockG,lam({color:0x8a8780,flatShading:true}),rl,function(o,i,m){q.setFromEuler(new THREE.Euler(o.r,o.r*2,0));s3.set(o.s*1.3,o.s*.8,o.s);p3.set(o.x,o.y+o.s*.2,o.z);m.compose(p3,q,s3)});
    rl.forEach(function(o,i){o.i=i;o.hp=4;addCol({x:o.x,z:o.z,r:o.s*1.05,type:'rock',ref:o})});rocks.userData.list=rl;
    // buissons à baies
    for(var b=0;b<160;b++){var x4=(R()-.5)*SIZE*.85,z4=(R()-.5)*SIZE*.85,h4=height(x4,z4);if(h4<1.5||h4>20){continue}
      var bg=new THREE.Group(),bm=new THREE.Mesh(new THREE.IcosahedronGeometry(.8,1),lam({color:0x356b2a}));bm.scale.set(1.2,.8,1.2);bm.position.y=.5;bm.castShadow=true;bg.add(bm);
      var berries=new THREE.Group();for(var k=0;k<7;k++){var be=new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),lam({color:0xc0152a}));var a=R()*6.28;be.position.set(Math.cos(a)*.85,.45+R()*.5,Math.sin(a)*.85);berries.add(be)}bg.add(berries);
      bg.position.set(x4,h4,z4);scene.add(bg);bushes.push({x:x4,z:z4,m:bg,b:berries,full:true,t:0})}
    // coffres
    for(var ch=0;ch<46;ch++){var x5,z5,h5,tries=0;do{x5=(R()-.5)*SIZE*.8;z5=(R()-.5)*SIZE*.8;h5=height(x5,z5);tries++}while((h5<1||h5>24)&&tries<30);
      var cm=chestMesh(R()<.15);cm.position.set(x5,h5,z5);cm.rotation.y=R()*6;scene.add(cm);var co={id:ch,x:x5,z:z5,m:cm,open:false,rare:cm.userData.rare};chests.push(co);addCol({x:x5,z:z5,r:.6,type:'chest',ref:co})}
    // ruines : quelques murs de pierre près des coffres rares
    chests.filter(function(c){return c.rare}).forEach(function(c){for(var k=0;k<3;k++){var a=k*2.1+c.id,w=new THREE.Mesh(new THREE.BoxGeometry(4,1.4+R()*2,.5),lam({color:0x8d877b}));var wx=c.x+Math.cos(a)*3.2,wz=c.z+Math.sin(a)*3.2;w.position.set(wx,height(wx,wz)+.6,wz);w.rotation.y=-a+Math.PI/2;w.castShadow=w.receiveShadow=true;scene.add(w);addCol({x:wx,z:wz,r:1.2,type:'ruin'})}});
    // animaux
    for(var an=0;an<26;an++)addDeer(R);
  }
  function chestMesh(rare){
    var g=new THREE.Group(),wood=lam({color:rare?0x3c4a5a:0x7a5230}),band=lam({color:rare?0xd4a32a:0x3a3a3a});
    var base=new THREE.Mesh(new THREE.BoxGeometry(1.1,.6,.7),wood);base.position.y=.3;base.castShadow=true;g.add(base);
    var lid=new THREE.Group(),lm=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.1,10,1,false,0,Math.PI),wood);lm.rotation.z=Math.PI/2;lid.add(lm);lid.position.set(0,.6,0);g.add(lid);
    [-.35,.35].forEach(function(x){var b=new THREE.Mesh(new THREE.BoxGeometry(.08,.62,.72),band);b.position.set(x,.31,0);g.add(b)});
    g.userData={lid:lid,rare:rare};return g;
  }
  function humanoid(col,skin,zombie){
    var g=new THREE.Group(),m=lam({color:col}),sk=lam({color:skin}),dk=lam({color:0x2b2a28});
    var body=new THREE.Mesh(new THREE.CapsuleGeometry(.3,.6,4,8),m);body.position.y=1.25;body.castShadow=true;g.add(body);
    var head=new THREE.Mesh(new THREE.SphereGeometry(.23,12,10),sk);head.position.y=1.92;head.castShadow=true;head.userData.head=true;g.add(head);
    var legs=[],arms=[];
    [-.14,.14].forEach(function(x){var l=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.6,3,6),dk);l.geometry.translate(0,-.4,0);l.position.set(x,.85,0);l.castShadow=true;g.add(l);legs.push(l)});
    [-.4,.4].forEach(function(x){var a=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.55,3,6),zombie?sk:m);a.geometry.translate(0,-.33,0);a.position.set(x,1.55,0);if(zombie)a.rotation.x=-1.4;a.castShadow=true;g.add(a);arms.push(a)});
    if(zombie){var e1=new THREE.Mesh(new THREE.SphereGeometry(.04,6,4),new THREE.MeshBasicMaterial({color:0xff2a10}));e1.position.set(-.08,1.95,-.2);var e2=e1.clone();e2.position.x=.08;g.add(e1);g.add(e2)}
    g.userData.parts={legs:legs,arms:arms};return g;
  }
  function deerMesh(){
    var g=new THREE.Group(),m=lam({color:0x8a5a33}),l=lam({color:0x6b4426});
    var b=new THREE.Mesh(new THREE.CapsuleGeometry(.35,1,4,8),m);b.rotation.z=Math.PI/2;b.rotation.y=Math.PI/2;b.position.y=1.05;b.castShadow=true;g.add(b);
    var n=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.5,3,6),m);n.position.set(0,1.5,-.7);n.rotation.x=.6;g.add(n);
    var h=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),m);h.scale.set(.9,.9,1.4);h.position.set(0,1.75,-.95);h.userData.head=true;g.add(h);
    var legs=[];[[-.18,-.45],[.18,-.45],[-.18,.45],[.18,.45]].forEach(function(p){var lg=new THREE.Mesh(new THREE.CylinderGeometry(.06,.05,.85,5),l);lg.geometry.translate(0,-.42,0);lg.position.set(p[0],.88,p[1]);g.add(lg);legs.push(lg)});
    g.userData.parts={legs:legs,arms:[]};return g;
  }
  function addDeer(R){var x,z,t=0;do{x=(R()-.5)*SIZE*.8;z=(R()-.5)*SIZE*.8;t++}while(height(x,z)<2&&t<20);var m=deerMesh();scene.add(m);var a={kind:'deer',x:x,z:z,yaw:R()*6,hp:40,m:m,alive:true,t:0,flee:0,r:.6};m.userData.ent=a;animals.push(a)}
  function addZombie(){
    var x,z,n=0;do{var a=Math.random()*6.28,d=40+Math.random()*25;x=P.x+Math.cos(a)*d;z=P.z+Math.sin(a)*d;n++}while(height(x,z)<.5&&n<12);if(height(x,z)<.5)return;
    var m=humanoid([0x4d5a3a,0x5a4a3a,0x3a4a5a][Math.random()*3|0],0x86a070,true);scene.add(m);
    var e={kind:'z',x:x,z:z,yaw:0,hp:70+day*12,dmg:9+day*1.5,sp:2.2+Math.random()*.9+Math.min(1.2,day*.1),m:m,alive:true,cd:0,r:.4,anim:0};m.userData.ent=e;zombies.push(e);
  }

  /* ---------- Joueur et sauvegarde ---------- */
  function newGame(){
    var seed=(Math.random()*1e9)|0;buildWorld(seed);
    var sp=findSpawn();P={x:sp.x,z:sp.z,y:height(sp.x,sp.z),vy:0,yaw:0,pitch:0,hp:100,food:80,water:80,stam:100,bob:0,spawn:null};
    inv={bois:0,pierre:0,baies:2,viande:0,cuite:0,conserve:1,eau:1,bandage:1,munitions:0,tissu:0,pistol:0,rifle:0};tool='axe';dayT=.28;day=1;
    PP.toast('Jour 1 : trouve un coin, coupe du bois, construis avant la nuit','ok');
  }
  function findSpawn(){for(var i=0;i<200;i++){var a=Math.random()*6.28,d=HALF*.55*Math.random(),x=Math.cos(a)*d,z=Math.sin(a)*d,h=height(x,z);if(h>2&&h<12&&!hitsCol(x,z,1))return {x:x,z:z}}return {x:0,z:0}}
  function save(){
    if(!P)return;
    var s={seed:SEED,day:day,t:dayT,p:{x:P.x,z:P.z,hp:P.hp,food:P.food,water:P.water,spawn:P.spawn},inv:inv,
      st:structs.filter(function(o){return !o.dead}).map(function(o){return [o.type,+o.x.toFixed(2),+o.z.toFixed(2),o.rot,Math.round(o.hp)]}),
      ch:chests.filter(function(c){return c.open}).map(function(c){return c.id}),
      tr:trees.list.filter(function(o){return o.hp<=0}).map(function(o){return trees.list.indexOf(o)}),
      rk:rocks.userData.list.filter(function(o){return o.hp<=0}).map(function(o){return o.i}),best:Math.max(day,PP.store('sv-best'))};
    try{localStorage.setItem('pp-survie',JSON.stringify(s))}catch(e){}
  }
  function hasSave(){try{return !!JSON.parse(localStorage.getItem('pp-survie'))}catch(e){return false}}
  function load(){
    var s;try{s=JSON.parse(localStorage.getItem('pp-survie'))}catch(e){}
    if(!s)return newGame();
    buildWorld(s.seed);day=s.day;dayT=s.t;inv=s.inv;
    P={x:s.p.x,z:s.p.z,y:height(s.p.x,s.p.z),vy:0,yaw:0,pitch:0,hp:s.p.hp,food:s.p.food,water:s.p.water,stam:100,bob:0,spawn:s.p.spawn};
    (s.st||[]).forEach(function(o){var st=build(o[0],o[1],o[2],o[3],true);if(st)st.hp=o[4]});
    (s.ch||[]).forEach(function(id){var c=chests[id];if(c){c.open=true;c.m.userData.lid.rotation.x=-1.9}});
    (s.tr||[]).forEach(function(i){var o=trees.list[i];if(o)fellTree(o,true)});
    (s.rk||[]).forEach(function(i){var o=rocks.userData.list[i];if(o)breakRock(o,true)});
    PP.toast('Partie reprise : jour '+day,'ok');
  }

  /* ---------- Construction ---------- */
  function structMesh(type){
    var g=new THREE.Group(),wood=lam({color:0x8a6239}),dark=lam({color:0x5a3d22});
    if(type==='wall'||type==='door'){
      for(var i=0;i<5;i++){var l=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,2.8,7),i%2?wood:dark);l.position.set(-.8+i*.4,1.4,0);l.castShadow=l.receiveShadow=true;g.add(l)}
      var bar=new THREE.Mesh(new THREE.BoxGeometry(2,.18,.12),dark);bar.position.set(0,2,.18);g.add(bar);var bar2=bar.clone();bar2.position.y=.8;g.add(bar2);
      if(type==='door'){var h=new THREE.Mesh(new THREE.TorusGeometry(.12,.03,6,12),lam({color:0x333333}));h.position.set(.5,1.3,.25);g.add(h);g.children.forEach(function(c,i){if(i<5&&c.material===wood)c.material=lam({color:0xa07040})})}
    }else if(type==='fire'){
      for(var k=0;k<6;k++){var st=new THREE.Mesh(new THREE.DodecahedronGeometry(.22,0),lam({color:0x777777}));st.position.set(Math.cos(k)*.6,.1,Math.sin(k)*.6);g.add(st)}
      for(var j=0;j<3;j++){var lg=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1,6),dark);lg.rotation.z=1.2;lg.rotation.y=j*2.1;lg.position.y=.25;g.add(lg)}
      var fl=new THREE.Mesh(new THREE.ConeGeometry(.35,.9,8),new THREE.MeshBasicMaterial({color:0xff9a2a,transparent:true,opacity:.9}));fl.position.y=.6;g.add(fl);g.userData.flame=fl;
      var pl=new THREE.PointLight(0xff9a40,2.2,22,1.4);pl.position.y=1.2;g.add(pl);g.userData.light=pl;
    }else if(type==='spike'){
      for(var s=0;s<5;s++){var sp=new THREE.Mesh(new THREE.ConeGeometry(.12,1.2,6),wood);sp.position.set(-.8+s*.4,.5,0);sp.rotation.x=-.5;g.add(sp)}
      var b2=new THREE.Mesh(new THREE.BoxGeometry(2,.15,.15),dark);b2.position.y=.2;g.add(b2);
    }else if(type==='bed'){
      var f=new THREE.Mesh(new THREE.BoxGeometry(1.1,.35,2.1),dark);f.position.y=.2;g.add(f);var mt=new THREE.Mesh(new THREE.BoxGeometry(1,.18,1.9),lam({color:0xc8c0a8}));mt.position.y=.45;g.add(mt);var pw=new THREE.Mesh(new THREE.BoxGeometry(.7,.14,.4),lam({color:0xf1ece2}));pw.position.set(0,.6,-.7);g.add(pw);
    }else if(type==='box'){var cm=chestMesh(false);cm.scale.setScalar(1.1);g.add(cm)}
    g.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
    return g;
  }
  function canPay(c){return Object.keys(c).every(function(k){return (inv[k]||0)>=c[k]})}
  function build(type,x,z,rot,free){
    var B=BUILD[type];if(!free){if(!canPay(B.cost)){PP.toast('Il manque des ressources','warn');return null}Object.keys(B.cost).forEach(function(k){inv[k]-=B.cost[k]})}
    var m=structMesh(type),y=height(x,z);m.position.set(x,y,z);m.rotation.y=rot*Math.PI/2;scene.add(m);
    var wide=type==='wall'||type==='door'||type==='spike',hw=wide?(rot%2?.25:1.05):.6,hd=wide?(rot%2?1.05:.25):(type==='bed'?1.05:.6);
    var o={type:type,x:x,z:z,rot:rot,hp:B.hp,max:B.hp,m:m,box:true,hw:hw,hd:hd};
    if(type!=='fire')addCol(o);else{o.k=null}
    structs.push(o);
    if(type==='bed')P.spawn={x:x,z:z+1.5};
    if(!free){sfx.play('pickup');hudInv()}
    return o;
  }
  function destroyStruct(o){o.dead=true;remCol(o);scene.remove(o.m);if(o.type==='bed'&&P.spawn&&Math.hypot(P.spawn.x-o.x,P.spawn.z-o.z-1.5)<.1)P.spawn=null}
  function ghostUpdate(){
    if(!buildMode){if(ghost){scene.remove(ghost);ghost=null}return}
    if(!ghost||ghost.userData.type!==buildMode){if(ghost)scene.remove(ghost);ghost=structMesh(buildMode);ghost.userData.type=buildMode;ghost.traverse(function(o){if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.5;o.castShadow=false}if(o.isLight)o.intensity=0});scene.add(ghost)}
    var x=P.x-Math.sin(P.yaw)*3,z=P.z-Math.cos(P.yaw)*3;x=Math.round(x);z=Math.round(z);
    ghost.position.set(x,height(x,z),z);ghost.rotation.y=ghostRot*Math.PI/2;ghost.userData.x=x;ghost.userData.z=z;
    var ok=canPay(BUILD[buildMode].cost);ghost.traverse(function(o){if(o.isMesh)o.material.color.setHex(ok?0x9fe36a:0xe2361b)});
  }

  /* ---------- Récolte, coffres, combat ---------- */
  var M4=new THREE.Matrix4(),ZERO=new THREE.Matrix4().makeScale(0,0,0);
  function fellTree(o,silent){o.hp=0;o.ms.forEach(function(im){im.setMatrixAt(o.i,ZERO);im.instanceMatrix.needsUpdate=true});near(o.x,o.z,1).forEach(function(c){if(c.ref===o)remCol(c)});if(!silent){inv.bois+=4;msg('+4 bois');sfx.play('kill')}}
  function breakRock(o,silent){o.hp=0;rocks.setMatrixAt(o.i,ZERO);rocks.instanceMatrix.needsUpdate=true;near(o.x,o.z,1).forEach(function(c){if(c.ref===o)remCol(c)});if(!silent){inv.pierre+=3;msg('+3 pierre');sfx.play('kill')}}
  function front(){return {x:P.x-Math.sin(P.yaw),z:P.z-Math.cos(P.yaw)}}
  function interactTarget(){
    var f=front(),best=null,bd=3.2;
    function cand(o,d,kind){if(d<bd){bd=d;best={o:o,k:kind}}}
    chests.forEach(function(c){if(!c.open){var d=Math.hypot(c.x-P.x,c.z-P.z);if(d<3.2&&isInFront(c.x,c.z))cand(c,d,'chest')}});
    bushes.forEach(function(b){if(b.full){var d=Math.hypot(b.x-P.x,b.z-P.z);if(d<3&&isInFront(b.x,b.z))cand(b,d,'bush')}});
    drops.forEach(function(dr){var d=Math.hypot(dr.x-P.x,dr.z-P.z);if(d<2.5)cand(dr,d,'drop')});
    structs.forEach(function(s){if(s.dead)return;var d=Math.hypot(s.x-P.x,s.z-P.z);if(d<3&&(s.type==='fire'||s.type==='bed'||s.type==='box'||s.type==='door'))cand(s,d,s.type)});
    if(!best){var fx=P.x-Math.sin(P.yaw)*2.5,fz=P.z-Math.cos(P.yaw)*2.5;if(height(fx,fz)<-.1||height(P.x,P.z)<.3)best={k:'water'}}
    return best;
  }
  function isInFront(x,z){var dx=x-P.x,dz=z-P.z,l=Math.hypot(dx,dz)||1;return (-Math.sin(P.yaw)*dx-Math.cos(P.yaw)*dz)/l>.5}
  function prompt(){
    var t=interactTarget(),s='';
    if(buildMode)s='Clic : poser '+BUILD[buildMode].n.split(' (')[0].toLowerCase()+' · R : tourner · B : fermer';
    else if(t){s={chest:'E : ouvrir le coffre',bush:'E : cueillir des baies',drop:'E : ramasser',water:'E : boire',fire:'E : cuire la viande'+(inv.viande?' ('+inv.viande+')':''),bed:'E : dormir'+(isNight()?' jusqu\'au matin':' (seulement la nuit)'),box:'E : déposer bois et pierre',door:'E : ouvrir / fermer'}[t.k]}
    $('sv-prompt').textContent=s;$('sv-prompt').style.display=s?'block':'none';
  }
  function interact(){
    var t=interactTarget();if(!t)return;
    if(t.k==='chest')openChest(t.o);
    if(t.k==='bush'){t.o.full=false;t.o.t=DAY*.8;t.o.b.visible=false;inv.baies+=3;msg('+3 baies');sfx.play('eat')}
    if(t.k==='drop'){var d=t.o;Object.keys(d.items).forEach(function(k){inv[k]=(inv[k]||0)+d.items[k]});msg(lootTxt(d.items));scene.remove(d.m);drops.splice(drops.indexOf(d),1);sfx.play('pickup')}
    if(t.k==='water'){P.water=Math.min(100,P.water+35);msg('Tu bois');sfx.play('ui')}
    if(t.k==='fire'){if(inv.viande>0){inv.cuite+=inv.viande;msg(inv.viande+' viande cuite');inv.viande=0;sfx.play('pickup')}else msg('Pas de viande crue')}
    if(t.k==='bed'){if(isNight()){if(zombies.some(function(z){return z.alive&&Math.hypot(z.x-P.x,z.z-P.z)<25}))msg('Impossible : des zombies sont tout près');else{dayT=.27;day++;zombies.forEach(function(z){z.alive=false;scene.remove(z.m)});zombies=[];P.food=Math.max(0,P.food-15);P.water=Math.max(0,P.water-15);msg('Tu dors. Jour '+day);sfx.play('win');save()}}else msg('Tu ne peux dormir que la nuit')}
    if(t.k==='box'){var b=t.o;b.store=b.store||{bois:0,pierre:0};b.store.bois+=inv.bois;b.store.pierre+=inv.pierre;msg('Déposé : '+inv.bois+' bois, '+inv.pierre+' pierre. Clic droit dessus pour reprendre.');inv.bois=0;inv.pierre=0}
    if(t.k==='door'){var dd=t.o;dd.openD=!dd.openD;dd.m.rotation.y=dd.rot*Math.PI/2+(dd.openD?Math.PI/2:0);var gl=grid[dd.k]||[];if(dd.openD){var gi=gl.indexOf(dd);if(gi>=0)gl.splice(gi,1)}else if(gl.indexOf(dd)<0)gl.push(dd);sfx.play('ui')}
    hudInv();
  }
  function lootTxt(it){return Object.keys(it).map(function(k){return '+'+it[k]+' '+(k==='pistol'?'pistolet':k==='rifle'?'fusil':(NAMES[k]||k).toLowerCase())}).join(', ')}
  function openChest(c){
    c.open=true;c.m.userData.lid.rotation.x=-1.9;sfx.play('win');
    var it={},R=Math.random;function add(k,n){it[k]=(it[k]||0)+n}
    add(PP.pick(['conserve','eau','bandage','tissu']),1+(R()*2|0));add(PP.pick(['munitions','conserve','tissu','eau']),R()<.5?1:2);
    if(R()<.55)add('munitions',8+(R()*10|0));
    if(c.rare||R()<.25){if(!inv.pistol)add('pistol',1);else if(!inv.rifle&&(c.rare||R()<.4))add('rifle',1);else add('munitions',15)}
    Object.keys(it).forEach(function(k){inv[k]=(inv[k]||0)+it[k]});
    if(it.pistol&&tool==='axe')setTool('pistol');if(it.rifle)setTool('rifle');
    msg('Coffre : '+lootTxt(it));hudInv();save();
  }
  function dropAt(x,z,items){var m=new THREE.Mesh(new THREE.BoxGeometry(.45,.3,.45),lam({color:0x9a3020}));m.position.set(x,height(x,z)+.2,z);m.castShadow=true;scene.add(m);drops.push({x:x,z:z,m:m,items:items})}
  function attack(){
    if(cd>0||buildMode)return;var T=TOOLS[tool];
    if(T.ammo){if(inv.munitions<=0){msg('Plus de munitions');sfx.play('tick');cd=.4;return}inv.munitions--;sfx.play('shoot');flash=1;}
    else sfx.play('ui');
    cd=T.rate;swing=1;
    var dir=new THREE.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch)),org=new THREE.Vector3(P.x,P.y+EYE,P.z);
    ray.set(org,dir);ray.far=T.ammo?150:T.range;
    var tg=[];zombies.forEach(function(z){if(z.alive)tg.push(z.m)});animals.forEach(function(a){if(a.alive)tg.push(a.m)});
    var hs=ray.intersectObjects(tg,true),ht=ray.intersectObject(terrain,false),tdist=ht.length?ht[0].distance:1e9;
    if(hs.length&&hs[0].distance<tdist){var o=hs[0].object,head=!!o.userData.head;while(o&&!o.userData.ent)o=o.parent;if(o){var e=o.userData.ent;e.hp-=T.dmg*(head?1.8:1);e.hurt=.15;if(e.kind==='deer')e.flee=6;sfx.play('hit');if(e.hp<=0){e.alive=false;e.dieT=1;sfx.play('kill');if(e.kind==='deer')dropAt(e.x,e.z,{viande:3});else{var r=Math.random();dropAt(e.x,e.z,r<.4?{munitions:6}:r<.7?{tissu:1}:{conserve:1})}}}}
    else if(!T.ammo){
      var f=front(),l=near(P.x,P.z,4),best=null,bd=T.range;
      l.forEach(function(c){if(c.dead||(c.type!=='tree'&&c.type!=='rock'))return;var d=Math.hypot(c.x-P.x,c.z-P.z)-c.r;if(d<bd&&isInFront(c.x,c.z)){bd=d;best=c}});
      if(best){var o2=best.ref;o2.hp--;sfx.play('hit');if(best.type==='tree'){if(o2.hp<=0)fellTree(o2);else{inv.bois+=1;msg('+1 bois')}}else{if(o2.hp<=0)breakRock(o2);else{inv.pierre+=1;msg('+1 pierre')}}}
      // reprendre dans un coffre de base
    }
    hudInv();
  }
  function setTool(t){if(t!=='axe'&&!inv[t])return;tool=t;buildMode=null;viewModel();hudInv()}
  function eat(){
    var order=[['cuite',35],['conserve',25],['baies',8],['viande',10]];for(var i=0;i<order.length;i++){var k=order[i][0];if(inv[k]>0){inv[k]--;P.food=Math.min(100,P.food+order[i][1]);if(k==='conserve')P.water=Math.min(100,P.water+5);msg('Tu manges : '+NAMES[k].toLowerCase());sfx.play('eat');hudInv();return}}
    msg('Rien à manger');
  }
  function heal(){if(inv.bandage>0&&P.hp<100){inv.bandage--;P.hp=Math.min(100,P.hp+35);msg('Bandage : +35 vie');sfx.play('pickup')}else if(inv.eau>0){inv.eau--;P.water=Math.min(100,P.water+40);msg('Tu bois une bouteille');sfx.play('ui')}hudInv()}
  function hurt(d){P.hp-=d;lastHurt=performance.now();var h=$('sv-hurt');h.classList.remove('on');void h.offsetWidth;h.classList.add('on');sfx.play('hurt');if(P.hp<=0)die()}
  function die(){
    sfx.play('lose');var best=PP.store('sv-best');if(day>best){PP.store('sv-best',day);PP.refreshHi()}
    if(P.spawn){var lost={};['bois','pierre','baies','viande','cuite','conserve'].forEach(function(k){var n=Math.floor((inv[k]||0)/2);if(n){lost[k]=n;inv[k]-=n}});dropAt(P.x,P.z,lost);P.x=P.spawn.x;P.z=P.spawn.z;P.hp=60;P.food=Math.max(P.food,40);P.water=Math.max(P.water,40);msg('Tu te réveilles dans ton lit. Ton sac est resté là où tu es mort.');save();return}
    running=false;cancelAnimationFrame(raf);unlock();try{localStorage.removeItem('pp-survie')}catch(e){}
    $('sv-title').textContent='Tu es mort';$('sv-msg').textContent='Tu as survécu '+day+' jour'+(day>1?'s':'')+'. Record : '+Math.max(day,best)+'. Construis un lit pour réapparaître la prochaine fois.';$('sv-start').textContent='Nouvelle partie';$('sv-cont').hidden=true;$('sv-ov').hidden=false;
  }
  function msg(t){var m=$('sv-msg2');m.textContent=t;m.style.opacity=1;msgT=3}

  /* ---------- Jour et nuit ---------- */
  function isNight(){return dayT<.22||dayT>.78}
  var cDay=new THREE.Color(0x9cc4e4),cDusk=new THREE.Color(0xe39a6a),cNight=new THREE.Color(0x0b1022),tmpC=new THREE.Color();
  function lightCycle(){
    var a=(dayT-.25)*Math.PI*2,sy=Math.sin(a+Math.PI/2*0)*1,el=Math.sin((dayT-.25)*Math.PI*2+Math.PI/2);
    var s=Math.cos((dayT-.5)*Math.PI*2);// 1 à midi, -1 à minuit
    var k=Math.max(0,Math.min(1,(s+.25)/.6));
    tmpC.copy(cNight).lerp(cDusk,Math.min(1,k*2)).lerp(cDay,Math.max(0,k*2-1));
    scene.background.copy(tmpC);scene.fog.color.copy(tmpC);scene.fog.far=110+150*k;
    sun.intensity=.05+1.2*k;amb.intensity=.18+.75*k;sun.color.setHSL(.09,.6,.6+.35*k);
    var ang=(dayT-.25)*Math.PI*2;sun.position.set(P.x+Math.cos(ang)*120,Math.max(15,Math.sin(ang)*140),P.z+40);sun.target.position.set(P.x,P.y,P.z);
    water.material.color.setRGB(.08+.1*k,.2+.24*k,.3+.27*k);
  }

  /* ---------- Boucle ---------- */
  function step(dt){
    var now=performance.now();
    dayT+=dt/DAY;if(dayT>=1){dayT-=1;day++;PP.toast('Jour '+day,'ok');save()}
    lightCycle();
    // joueur
    var sprint=keys.SH&&P.stam>5&&(keys.F||keys.B||keys.L||keys.R),sp=(sprint?8.5:4.8)*dt;
    if(sprint)P.stam=Math.max(0,P.stam-dt*18);else P.stam=Math.min(100,P.stam+dt*12);
    var fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),mx=0,mz=0;if(keys.F){mx+=fx;mz+=fz}if(keys.B){mx-=fx;mz-=fz}if(keys.L){mx+=fz;mz-=fx}if(keys.R){mx-=fz;mz+=fx}
    var ml=Math.hypot(mx,mz);if(ml){var py=height(P.x,P.z);var inW=py<.2;if(inW)sp*=.55;moveCirc(P,mx/ml*sp,mz/ml*sp,.4,'p');P.bob+=dt*(sprint?12:8)}
    var gh=Math.max(height(P.x,P.z),-.9);if(keys.J&&P.y<=gh+.05){P.vy=5.5;keys.J=false}
    P.vy-=15*dt;P.y+=P.vy*dt;if(P.y<gh){P.y=gh;P.vy=0}
    cd-=dt;swing=Math.max(0,swing-dt*3.5);flash*=.7;if(mouseDown&&TOOLS[tool].auto)attack();
    // faim, soif, vie
    P.food=Math.max(0,P.food-dt*100/480*(sprint?1.6:1));P.water=Math.max(0,P.water-dt*100/360*(sprint?1.6:1));
    if(P.food<=0||P.water<=0){P.hp-=dt*1.5;if(P.hp<=0)return die()}
    else if(P.food>55&&P.water>55&&now-lastHurt>5000&&P.hp<100)P.hp=Math.min(100,P.hp+dt*1.2);
    // près d'un feu, la nuit fait moins peur
    // zombies la nuit
    if(isNight()){spawnT-=dt;var cap=Math.min(26,4+day*3);if(spawnT<=0&&zombies.filter(function(z){return z.alive}).length<cap){spawnT=Math.max(1.5,6-day*.4);addZombie()}}
    else if(dayT>.3&&dayT<.7){zombies.forEach(function(z){if(z.alive&&Math.random()<dt*.15){z.hp-=999}});}
    zombies.forEach(function(z){
      if(!z.alive){if(z.dieT>0){z.dieT-=dt;z.m.rotation.x=Math.min(1.5,(1-z.dieT)*3);if(z.dieT<=0)scene.remove(z.m)}return}
      if(z.hp<=0){z.alive=false;z.dieT=1;return}
      var dx=P.x-z.x,dz=P.z-z.z,d=Math.hypot(dx,dz),a=Math.atan2(dx,dz);z.yaw=a;
      var nearFire=structs.some(function(s){return !s.dead&&s.type==='fire'&&Math.hypot(s.x-z.x,s.z-z.z)<4});if(nearFire)a+=Math.PI*.6;
      if(d>1.2){var hit=moveCirc(z,Math.sin(a)*z.sp*dt,Math.cos(a)*z.sp*dt,z.r,'z');
        if(hit&&hit.box){z.cd-=dt;if(z.cd<=0){z.cd=1;hit.hp-=z.dmg;if(Math.hypot(hit.x-P.x,hit.z-P.z)<20)sfx.play('hit');if(hit.hp<=0){destroyStruct(hit);msg('Un zombie a cassé '+(hit.type==='door'?'une porte':'un mur'))}}
          if(hit.type==='spike'){z.hp-=dt*25}}}
      else{z.cd-=dt;if(z.cd<=0){z.cd=1.1;hurt(z.dmg)}}
      var sp2=near(z.x,z.z,2).filter(function(c){return c.type==='spike'&&!c.dead&&Math.abs(z.x-c.x)<c.hw+.6&&Math.abs(z.z-c.z)<c.hd+.6})[0];if(sp2)z.hp-=dt*20;
      z.m.position.set(z.x,height(z.x,z.z),z.z);z.m.rotation.y=z.yaw+Math.PI;walk(z,dt,d>1.2);
      if(d>140){z.alive=false;scene.remove(z.m)}
    });
    zombies=zombies.filter(function(z){return z.alive||z.dieT>0});
    // animaux
    animals.forEach(function(a){
      if(!a.alive){if(a.dieT>0){a.dieT-=dt;a.m.rotation.z=Math.min(1.5,(1-a.dieT)*3);if(a.dieT<=0)scene.remove(a.m)}return}
      var d=Math.hypot(P.x-a.x,P.z-a.z);if(d>120)return;
      if(d<10&&(keys.SH||a.flee>0))a.flee=Math.max(a.flee,4);
      var sp3=0;if(a.flee>0){a.flee-=dt;a.yaw=Math.atan2(a.x-P.x,a.z-P.z);sp3=7}else{a.t-=dt;if(a.t<=0){a.t=2+Math.random()*4;a.yaw+=(Math.random()-.5)*2;a.walk=Math.random()<.5}sp3=a.walk?1.3:0}
      if(sp3){var hb=moveCirc(a,Math.sin(a.yaw)*sp3*dt,Math.cos(a.yaw)*sp3*dt,a.r,'a');if(hb)a.yaw+=1}
      a.m.position.set(a.x,height(a.x,a.z),a.z);a.m.rotation.y=a.yaw+Math.PI;walk(a,dt,sp3>0);
    });
    animals=animals.filter(function(a){return a.alive||a.dieT>0});
    if(animals.length<20&&Math.random()<dt*.05)addDeer(Math.random);
    // buissons qui repoussent, feux qui dansent
    bushes.forEach(function(b){if(!b.full){b.t-=dt;if(b.t<=0){b.full=true;b.b.visible=true}}});
    structs.forEach(function(s){if(s.type==='fire'&&!s.dead){var f=s.m.userData.flame;f.scale.set(1+Math.sin(now/90)*.1,1+Math.sin(now/70)*.2,1);s.m.userData.light.intensity=(isNight()?2.6:.8)+Math.sin(now/60)*.3}});
    msgT-=dt;if(msgT<0)$('sv-msg2').style.opacity=0;
    saveT-=dt;if(saveT<=0){saveT=20;save()}
    ghostUpdate();prompt();hudBars();
  }
  function walk(e,dt,mv){var p=e.m.userData.parts;e.anim=(e.anim||0)+dt*(mv?8:0);var s=Math.sin(e.anim)*.55*(mv?1:0);p.legs.forEach(function(l,i){l.rotation.x=i%2?s:-s})}

  /* ---------- Rendu ---------- */
  var vm=null;
  function viewModel(){
    while(vscene.children.length>2)vscene.remove(vscene.children[2]);
    var g=new THREE.Group(),skin=lam({color:0xd9a77c}),dark=lam({color:0x252525}),wood=lam({color:0x7a5230});
    var arm=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.3,3,6),lam({color:0x56643a}));arm.rotation.x=Math.PI/2.4;arm.position.set(.02,-.1,.18);g.add(arm);
    var hand=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),skin);hand.position.set(0,-.02,0);g.add(hand);
    if(tool==='axe'){var h=new THREE.Mesh(new THREE.CylinderGeometry(.022,.026,.6,6),wood);h.position.set(0,.18,0);g.add(h);var hd=new THREE.Mesh(new THREE.BoxGeometry(.03,.12,.2),lam({color:0x9a9a9a}));hd.position.set(0,.42,-.08);g.add(hd);g.rotation.x=-.3}
    else{var len=tool==='rifle'?.7:.28,b=new THREE.Mesh(new THREE.BoxGeometry(.06,.09,len),dark);b.position.set(0,.06,-len/2+.05);g.add(b);var gr=new THREE.Mesh(new THREE.BoxGeometry(.05,.13,.06),wood);gr.position.set(0,-.03,.03);g.add(gr);if(tool==='rifle'){var st=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.22),wood);st.position.set(0,.03,.2);g.add(st)}
      var fl=new THREE.Mesh(new THREE.PlaneGeometry(.18,.18),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0,depthWrite:false}));fl.position.set(0,.07,-len+.02);g.add(fl);g.userData.fl=fl}
    g.scale.setScalar(.7);vm=g;vscene.add(g);
  }
  function render(){
    if(!R3||!P)return;
    cam.position.set(P.x,P.y+EYE+Math.sin(P.bob)*.04,P.z);cam.rotation.set(P.pitch,P.yaw,0);
    R3.clear();R3.render(scene,cam);
    if(vm&&!buildMode){
      var sw=swing>0?Math.sin(swing*Math.PI):0;
      vm.position.set(.26+Math.cos(P.bob*.5)*.01,-.3+Math.abs(Math.sin(P.bob*.5))*.012,-.45);
      if(tool==='axe'){vm.rotation.set(-.3-sw*1.4,sw*.4,-sw*.3)}else{vm.rotation.set(flash*.25,0,0);if(vm.userData.fl)vm.userData.fl.material.opacity=flash}
      R3.clearDepth();R3.render(vscene,vcam);
    }
    drawMap();
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){if(!paused)step(dt);if(running)render();raf=requestAnimationFrame(loop)}}

  /* ---------- Interface ---------- */
  function hudBars(){
    [['hp',P.hp],['food',P.food],['water',P.water],['stam',P.stam]].forEach(function(b){var el=$('sv-'+b[0]);el.style.width=Math.max(0,b[1])+'%';el.parentNode.classList.toggle('low',b[1]<25)});
    var hrs=(dayT*24+0)%24,hh=Math.floor(hrs),mm=Math.floor((hrs-hh)*60/10)*10;
    $('sv-clock').innerHTML='JOUR '+day+' · '+('0'+hh).slice(-2)+':'+('0'+mm).slice(-2)+(isNight()?' · <b>NUIT</b>':'');
    $('sv-l1').innerHTML='Jour <b>'+day+'</b>';
  }
  function hudInv(){
    var keysL=['bois','pierre','baies','viande','cuite','conserve','eau','bandage','tissu','munitions'];
    $('sv-inv').innerHTML=keysL.filter(function(k){return inv[k]>0}).map(function(k){return '<span><b>'+inv[k]+'</b> '+esc(NAMES[k].toLowerCase())+'</span>'}).join('');
    $('sv-bar').innerHTML=[['axe','1','Hache'],['pistol','2','Pistolet'],['rifle','3','Fusil']].map(function(t){var own=t[0]==='axe'||inv[t[0]];return '<span class="'+(tool===t[0]&&!buildMode?'on':'')+(own?'':' off')+'"><i>'+t[1]+'</i>'+t[2]+(TOOLS[t[0]].ammo&&own?' · '+inv.munitions:'')+'</span>'}).join('')+'<span class="'+(buildMode?'on':'')+'"><i>B</i>Construire</span><span><i>F</i>Manger</span><span><i>H</i>Soigner</span>';
    $('sv-best').textContent=Math.max(PP.store('sv-best'),0);
  }
  function buildMenu(){
    var el=$('sv-build');
    if(el.hidden){el.innerHTML='<b>Construire</b>'+Object.keys(BUILD).map(function(k,i){var B=BUILD[k],ok=canPay(B.cost);return '<button type="button" class="'+(ok?'':'no')+(buildMode===k?' on':'')+'" data-b="'+k+'"><i>'+(i+1)+'</i>'+esc(B.n)+'<small>'+Object.keys(B.cost).map(function(c){return B.cost[c]+' '+NAMES[c].toLowerCase()}).join(', ')+'</small></button>'}).join('')+'<small class="hint">Chiffre ou clic pour choisir, puis clic dans le monde pour poser. R tourne. B ferme.</small>';el.hidden=false}
    else{el.hidden=true;buildMode=null}
  }
  $('sv-build').addEventListener('click',function(e){var b=e.target.closest('[data-b]');if(b){buildMode=b.dataset.b;$('sv-build').hidden=true;lock()}});
  // carte
  var mapBase=null;
  function drawMap(){
    var c=$('sv-map'),g=c.getContext('2d'),sz=c.width;
    if(!mapBase||mapBase.seed!==SEED){mapBase=document.createElement('canvas');mapBase.width=mapBase.height=160;mapBase.seed=SEED;var mg=mapBase.getContext('2d'),im=mg.createImageData(160,160);for(var j=0;j<160;j++)for(var i=0;i<160;i++){var x=(i/160-.5)*SIZE,z=(j/160-.5)*SIZE,h=height(x,z),o=(j*160+i)*4,col=h<0?[42,111,147]:h<.6?[210,196,142]:h<14?[80,122,52]:h<24?[107,115,84]:h<32?[140,138,132]:[236,238,242];im.data[o]=col[0];im.data[o+1]=col[1];im.data[o+2]=col[2];im.data[o+3]=255}mg.putImageData(im,0,0)}
    var big=c.classList.contains('big'),range=big?SIZE:120,sc=sz/range,cx=big?0:P.x,cz=big?0:P.z;
    g.save();g.fillStyle='#2a6f93';g.fillRect(0,0,sz,sz);g.translate(sz/2,sz/2);g.imageSmoothingEnabled=true;
    g.drawImage(mapBase,(-HALF-cx)*sc,(-HALF-cz)*sc,SIZE*sc,SIZE*sc);
    chests.forEach(function(ch){if(!ch.open&&(big||Math.hypot(ch.x-P.x,ch.z-P.z)<45)){g.fillStyle=ch.rare?'#d4a32a':'#8a5f33';g.fillRect((ch.x-cx)*sc-2.5,(ch.z-cz)*sc-2.5,5,5)}});
    structs.forEach(function(s){if(!s.dead){g.fillStyle=s.type==='fire'?'#ff9a2a':s.type==='bed'?'#f1ece2':'#5a3d22';g.fillRect((s.x-cx)*sc-1.5,(s.z-cz)*sc-1.5,3,3)}});
    zombies.forEach(function(z){if(z.alive&&Math.hypot(z.x-P.x,z.z-P.z)<40){g.fillStyle='#e2361b';g.beginPath();g.arc((z.x-cx)*sc,(z.z-cz)*sc,2.5,0,7);g.fill()}});
    if(P.spawn){g.strokeStyle='#fff';g.strokeRect((P.spawn.x-cx)*sc-3,(P.spawn.z-cz)*sc-3,6,6)}
    g.translate((P.x-cx)*sc,(P.z-cz)*sc);g.rotate(-P.yaw);g.fillStyle='#fff';g.strokeStyle='#141210';g.beginPath();g.moveTo(0,-7);g.lineTo(5,5);g.lineTo(0,2);g.lineTo(-5,5);g.closePath();g.fill();g.stroke();
    g.restore();
  }

  /* ---------- Entrées ---------- */
  var KM={z:'F',w:'F',ArrowUp:'F',s:'B',ArrowDown:'B',q:'L',a:'L',ArrowLeft:'L',d:'R',ArrowRight:'R'};
  document.addEventListener('keydown',function(e){
    if(PP.cur()!=='surv'||!running)return;if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;
    var k=e.key.length===1?e.key.toLowerCase():e.key;
    if(KM[k]){keys[KM[k]]=true;e.preventDefault()}if(k==='Shift')keys.SH=true;if(k===' '){keys.J=true;e.preventDefault()}
    if(e.repeat)return;
    if(k==='e')interact();if(k==='f')eat();if(k==='h')heal();
    if(k==='b')buildMenu();
    if(k==='r'&&buildMode)ghostRot=(ghostRot+1)%4;
    if(k==='m')$('sv-map').classList.toggle('big');
    if(k>='1'&&k<='6'){if(!$('sv-build').hidden){var bk=Object.keys(BUILD)[+k-1];if(bk){buildMode=bk;$('sv-build').hidden=true}}else setTool(['axe','pistol','rifle'][+k-1]||tool)}
    if(k==='Escape'&&buildMode){buildMode=null;$('sv-build').hidden=true}
    hudInv();
  });
  document.addEventListener('keyup',function(e){var k=e.key.length===1?e.key.toLowerCase():e.key;if(KM[k])keys[KM[k]]=false;if(k==='Shift')keys.SH=false});
  window.addEventListener('blur',function(){keys={};mouseDown=false});
  cv.addEventListener('mousedown',function(e){
    if(!running)return;if(document.pointerLockElement!==cv){lock();paused=false;$('sv-lockhint').hidden=true;return}
    if(e.button===0){if(buildMode&&ghost){build(buildMode,ghost.userData.x,ghost.userData.z,ghostRot);return}mouseDown=true;attack()}
    if(e.button===2){var t=interactTarget();if(t&&t.k==='box'&&t.o.store){inv.bois+=t.o.store.bois;inv.pierre+=t.o.store.pierre;msg('Repris : '+t.o.store.bois+' bois, '+t.o.store.pierre+' pierre');t.o.store={bois:0,pierre:0};hudInv()}else if(buildMode){buildMode=null}}
  });
  document.addEventListener('mouseup',function(e){if(e.button===0)mouseDown=false});
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  document.addEventListener('mousemove',function(e){if(document.pointerLockElement!==cv||!P)return;P.yaw-=e.movementX*.0025;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-e.movementY*.0025))});
  document.addEventListener('pointerlockchange',function(){if(PP.cur()!=='surv'||!running)return;var l=document.pointerLockElement===cv;$('sv-lockhint').hidden=l||!$('sv-build').hidden;if(!l&&$('sv-build').hidden){paused=true;save()}else paused=false});
  function lock(){if(cv.requestPointerLock&&matchMedia('(hover:hover)').matches)try{var r=cv.requestPointerLock();if(r&&r.catch)r.catch(function(){})}catch(e){}}
  function unlock(){if(document.pointerLockElement===cv&&document.exitPointerLock)document.exitPointerLock()}
  var tl=null;
  cv.addEventListener('touchstart',function(e){var t=e.touches[0];tl={x:t.clientX,y:t.clientY}},{passive:true});
  cv.addEventListener('touchmove',function(e){if(!tl||!P)return;var t=e.touches[0];P.yaw-=(t.clientX-tl.x)*.006;P.pitch=Math.max(-1.4,Math.min(1.4,P.pitch-(t.clientY-tl.y)*.006));tl={x:t.clientX,y:t.clientY};e.preventDefault()},{passive:false});
  var pad=PP.held('sv-pad',{},function(k){if(k==='A'){mouseDown=true;attack()}if(k==='E')interact();if(k==='F2')eat();if(k==='F'||k==='B'||k==='L'||k==='R')keys[k]=true},function(k){if(k==='A')mouseDown=false;if(k==='F'||k==='B'||k==='L'||k==='R')keys[k]=false});

  function start(fresh){
    if(!init())return;
    if(fresh||!hasSave())newGame();else load();
    viewModel();hudInv();$('sv-ov').hidden=true;$('sv-build').hidden=true;buildMode=null;running=true;paused=false;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);lock();sfx.play('go');
  }
  $('sv-start').addEventListener('click',function(){if(hasSave()&&!confirm('Recommencer une nouvelle île ? Ta partie en cours sera effacée.'))return;start(true)});
  $('sv-cont').addEventListener('click',function(){start(false)});
  PP._sv=function(){return {P:P,inv:inv,zombies:zombies,structs:structs,chests:chests,setT:function(t){dayT=t},attack:attack,interact:interact,build:build,setTool:setTool}};
  PP.games.surv={
    open:function(){$('sv-lockhint').hidden=true;var s=hasSave();$('sv-cont').hidden=!s;$('sv-start').textContent=s?'Nouvelle île':'Commencer';$('sv-title').textContent='Survie';
      $('sv-msg').textContent='Une grande île. Coupe du bois, casse des pierres, fouille les coffres, chasse et mange. Construis ta base avant la nuit : les zombies sortent dans le noir.';$('sv-ov').hidden=false;$('sv-best').textContent=PP.store('sv-best')},
    close:function(){if(running){save();running=false;cancelAnimationFrame(raf)}unlock();keys={};mouseDown=false}
  };
})();
