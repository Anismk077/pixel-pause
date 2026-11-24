/* Pixel Pause — Survie 3D v2
   Grande île, faim / soif / endurance, récolte, coffres, chasse, loups, zombies la nuit (nuits de sang),
   artisanat (établi, forge, fer, pioche, arc, armures, torche), base, objectifs jusqu'à l'appel des secours.
   Sauvegarde automatique dans le navigateur. Plein écran. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,cv=$('sv-cv'),stage=cv.parentNode;
  var SIZE=720,HALF=SIZE/2,SEG=240,EYE=1.7,DAY=420;

  /* ---------- Bruit et relief ---------- */
  function hash(x,z,s){var h=Math.sin(x*127.1+z*311.7+s*74.7)*43758.5453;return h-Math.floor(h)}
  function vnoise(x,z,s){var xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
    var a=hash(xi,zi,s),b=hash(xi+1,zi,s),c=hash(xi,zi+1,s),d=hash(xi+1,zi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
  function fbm(x,z,s){var t=0,a=1,f=1,n=0;for(var i=0;i<5;i++){t+=vnoise(x*f,z*f,s+i*13)*a;n+=a;a*=.5;f*=2.03}return t/n}
  var SEED=1;
  function height(x,z){
    var d=Math.hypot(x,z)/HALF,fall=Math.max(0,1-Math.pow(d,2.4));
    var h=(fbm(x/95,z/95,SEED)-.42)*36+(fbm(x/24,z/24,SEED+5)-.5)*5;
    var m=fbm(x/170,z/170,SEED+9);if(m>.58)h+=(m-.58)*140;
    return h*fall-(1-fall)*14+2;
  }
  function slope(x,z){return Math.hypot(height(x+1,z)-height(x-1,z),height(x,z+1)-height(x,z-1))/2}
  function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}

  /* ---------- Données ---------- */
  var TOOLS={
    axe   :{n:'Hache',dmg:30,range:2.8,rate:.55,melee:1},
    pick  :{n:'Pioche',dmg:22,range:2.8,rate:.6,melee:1},
    sword :{n:'Épée en fer',dmg:72,range:3,rate:.5,melee:1},
    bow   :{n:'Arc',dmg:48,rate:.8,ammo:'fleches'},
    pistol:{n:'Pistolet',dmg:40,rate:.3,ammo:'munitions'},
    rifle :{n:'Fusil',dmg:30,rate:.12,ammo:'munitions',auto:true},
    torch :{n:'Torche',dmg:12,range:2.4,rate:.5,melee:1}
  },TORDER=['axe','pick','sword','bow','pistol','rifle','torch'];
  var BUILD={
    wall :{n:'Mur en bois',cost:{bois:4},hp:220},
    door :{n:'Porte',cost:{bois:6},hp:180,d:'tu passes, pas les zombies'},
    fire :{n:'Feu de camp',cost:{bois:3,pierre:2},hp:80,d:'cuire, éclairer, éloigne les zombies'},
    spike:{n:'Piques',cost:{bois:3,pierre:1},hp:140,d:'blessent les zombies'},
    bed  :{n:'Lit',cost:{bois:6,tissu:2},hp:100,d:'réapparition, dormir la nuit'},
    bench:{n:'Établi',cost:{bois:10,pierre:2},hp:200,d:'arc, armure en cuir'},
    forge:{n:'Forge',cost:{pierre:20,bois:6},hp:300,d:'tout ce qui est en fer'},
    box  :{n:'Coffre de base',cost:{bois:5},hp:120,d:'stocke tes ressources'}
  };
  var CRAFT=[
    {id:'pick',n:'Pioche',cost:{bois:3,pierre:4},give:{pick:1},d:'casse la pierre plus vite, mine le fer'},
    {id:'torch',n:'Torche',cost:{bois:2,tissu:1},give:{torch:1},d:'lumière la nuit'},
    {id:'band',n:'2 bandages',cost:{tissu:2},give:{bandage:2}},
    {id:'bow',n:'Arc',cost:{bois:6,tissu:2},give:{bow:1},near:'bench',d:'arme silencieuse à distance'},
    {id:'arrows',n:'8 flèches',cost:{bois:2,pierre:1},give:{fleches:8},near:'bench'},
    {id:'leather',n:'Armure en cuir',cost:{cuir:8,tissu:2},give:{armure:1},near:'bench',d:'−30 % de dégâts'},
    {id:'iaxe',n:'Hache en fer',cost:{fer:3,bois:2},give:{iaxe:1},near:'forge',d:'coupe deux fois plus vite'},
    {id:'sword',n:'Épée en fer',cost:{fer:5,bois:2},give:{sword:1},near:'forge',d:'72 de dégâts'},
    {id:'iron',n:'Armure en fer',cost:{fer:12,cuir:2},give:{armure:2},near:'forge',d:'−55 % de dégâts'},
    {id:'radio',n:'Radio de secours',cost:{radio:5,fer:6,bois:4},give:{call:1},near:'forge',d:'appelle les secours'}
  ];
  var NAMES={bois:'Bois',pierre:'Pierre',fer:'Fer',baies:'Baies',viande:'Viande crue',cuite:'Viande cuite',conserve:'Conserves',eau:'Bouteilles d\'eau',bandage:'Bandages',munitions:'Munitions',fleches:'Flèches',tissu:'Tissu',cuir:'Cuir',radio:'Pièces de radio'};
  var GOALS=[
    {t:'Couper 10 bois',ok:function(){return st.bois>=10}},
    {t:'Fabriquer une pioche (touche C)',ok:function(){return inv.pick}},
    {t:'Construire un feu de camp (touche B)',ok:function(){return has('fire')}},
    {t:'Construire un lit',ok:function(){return has('bed')}},
    {t:'Survivre à la première nuit',ok:function(){return day>=2}},
    {t:'Construire un établi',ok:function(){return has('bench')}},
    {t:'Chasser un cerf',ok:function(){return st.deer>=1}},
    {t:'Fabriquer une armure en cuir',ok:function(){return inv.armure>=1}},
    {t:'Miner 6 fer dans les montagnes',ok:function(){return st.fer>=6}},
    {t:'Construire une forge',ok:function(){return has('forge')}},
    {t:'Fabriquer une épée en fer',ok:function(){return inv.sword}},
    {t:'Trouver 5 pièces de radio (coffres dorés)',ok:function(){return (inv.radio||0)>=5||inv.call}},
    {t:'Fabriquer la radio et appeler les secours',ok:function(){return inv.call}},
    {t:'Tenir 2 nuits jusqu\'aux secours',ok:function(){return won}}
  ];

  /* ---------- État ---------- */
  var R3,scene,cam,vscene,vcam,sun,amb,skyMat,skyMesh,stars,sunDisk,moonDisk,clouds=[],water,waterNorm,terrain,grass,flowers,grassC=null,running=false,paused=false,raf=0,last=0,keys={},mouseDown=false;
  var P,inv,st,world,structs=[],zombies=[],animals=[],drops=[],cols=[],grid={},trees=null,rocks=null,ores=null,bushes=[],chests=[],tool='axe',swing=0,cd=0,dayT=.3,day=1,saveT=0,buildMode=null,ghost=null,ghostRot=0,msgT=0,ray=null,flash=0,lastHurt=0,spawnT=0,goalI=0,rescueT=-1,won=false,torchL=null;
  function has(t){return structs.some(function(s){return !s.dead&&s.type===t})}

  /* ---------- Collisions (grille de 8 m) ---------- */
  function gk(x,z){return Math.floor(x/8)+','+Math.floor(z/8)}
  function addCol(c){c.k=gk(c.x,c.z);(grid[c.k]=grid[c.k]||[]).push(c);cols.push(c);return c}
  function unGrid(c){var l=grid[c.k];if(l){var i=l.indexOf(c);if(i>=0)l.splice(i,1)}}
  function remCol(c){unGrid(c);c.dead=true}
  function near(x,z,r){var out=[],x0=Math.floor((x-r)/8),x1=Math.floor((x+r)/8),z0=Math.floor((z-r)/8),z1=Math.floor((z+r)/8);for(var i=x0;i<=x1;i++)for(var j=z0;j<=z1;j++){var l=grid[i+','+j];if(l)for(var k=0;k<l.length;k++)out.push(l[k])}return out}
  function hitsCol(x,z,r,who){
    var l=near(x,z,r+3);
    for(var i=0;i<l.length;i++){var c=l[i];if(c.dead)continue;
      if(c.box){if(c.type==='door'&&who==='p')continue;var dx=Math.abs(x-c.x),dz=Math.abs(z-c.z);if(dx<c.hw+r&&dz<c.hd+r)return c}
      else if(Math.hypot(x-c.x,z-c.z)<c.r+r)return c}
    return null;
  }
  function moveCirc(e,dx,dz,r,who){
    var hit=null,c;
    c=hitsCol(e.x+dx,e.z,r,who);if(!c&&height(e.x+dx,e.z)>-1.3)e.x+=dx;else hit=c||hit;
    c=hitsCol(e.x,e.z+dz,r,who);if(!c&&height(e.x,e.z+dz)>-1.3)e.z+=dz;else hit=c||hit;
    return hit;
  }

  /* ---------- Textures ---------- */
  function canvasTex(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
  function detailTex(){return canvasTex(256,256,function(g,w,h){var im=g.createImageData(w,h);for(var y=0;y<h;y++)for(var x=0;x<w;x++){var v=200+((vnoise(x/6,y/6,3)*.6+vnoise(x/1.5,y/1.5,8)*.4)*55)|0,o=(y*w+x)*4;im.data[o]=im.data[o+1]=im.data[o+2]=Math.min(255,v);im.data[o+3]=255}g.putImageData(im,0,0)})}
  function normalTex(){return canvasTex(256,256,function(g,w,h){var im=g.createImageData(w,h);function f(x,y){return Math.sin(x*.09+Math.sin(y*.05)*2)*.5+Math.sin(y*.12+x*.03)*.5+vnoise(x/9,y/9,4)}for(var y=0;y<h;y++)for(var x=0;x<w;x++){var dx=f(x+1,y)-f(x-1,y),dy=f(x,y+1)-f(x,y-1),o=(y*w+x)*4;im.data[o]=128+dx*60;im.data[o+1]=128+dy*60;im.data[o+2]=255;im.data[o+3]=255}g.putImageData(im,0,0)})}

  /* ---------- Monde ---------- */
  function lam(o){return new THREE.MeshLambertMaterial(o)}
  function init(){
    if(R3)return true;
    if(!window.THREE){PP.toast('La 3D (three.js) n\'a pas pu se charger','warn');return false}
    ray=new THREE.Raycaster();
    R3=new THREE.WebGLRenderer({canvas:cv,antialias:true});R3.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));R3.setSize(cv.width,cv.height,false);R3.autoClear=false;
    R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFSoftShadowMap;R3.toneMapping=THREE.ACESFilmicToneMapping;R3.toneMappingExposure=1.05;
    cam=new THREE.PerspectiveCamera(72,cv.width/cv.height,.1,900);cam.rotation.order='YXZ';
    vscene=new THREE.Scene();vcam=new THREE.PerspectiveCamera(60,cv.width/cv.height,.01,10);
    vscene.add(new THREE.HemisphereLight(0xffffff,0x444444,1.1));var dl=new THREE.DirectionalLight(0xffffff,.7);dl.position.set(1,2,1);vscene.add(dl);
    document.addEventListener('fullscreenchange',fit);document.addEventListener('webkitfullscreenchange',fit);window.addEventListener('resize',fit);
    return true;
  }
  /* Plein écran : le rendu prend toute la taille de l'écran */
  function isFull(){return (document.fullscreenElement||document.webkitFullscreenElement)===stage}
  function fit(){
    if(!R3)return;var w=960,h=540;
    if(isFull()){w=window.innerWidth;h=window.innerHeight}
    cv.width=w;cv.height=h;R3.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();vcam.aspect=w/h;vcam.updateProjectionMatrix();
    if(!running&&P)render();
  }
  function buildSky(){
    skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(0x3d7cc9)},hor:{value:new THREE.Color(0xbfdcf0)},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color(0xfff0d0)}},
      vertexShader:'varying vec3 vp;void main(){vp=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform vec3 top;uniform vec3 hor;uniform vec3 sunDir;uniform vec3 sunCol;varying vec3 vp;void main(){float h=max(vp.y,0.0);vec3 c=mix(hor,top,pow(h,0.55));if(vp.y<0.0)c=hor*0.85;float s=max(dot(vp,normalize(sunDir)),0.0);c+=sunCol*(pow(s,320.0)*1.6+pow(s,12.0)*0.18);gl_FragColor=vec4(c,1.0);}'});
    skyMesh=new THREE.Mesh(new THREE.SphereGeometry(800,32,16),skyMat);skyMesh.renderOrder=-1;scene.add(skyMesh);
    var sg=new THREE.BufferGeometry(),sp=[];for(var i=0;i<1600;i++){var u=Math.random()*2-1,a=Math.random()*6.283,r=Math.sqrt(1-u*u);if(u<.05)continue;sp.push(r*Math.cos(a)*700,u*700,r*Math.sin(a)*700)}
    sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(stars);
    sunDisk=new THREE.Mesh(new THREE.CircleGeometry(16,24),new THREE.MeshBasicMaterial({color:0xfff3d6,fog:false,transparent:true}));scene.add(sunDisk);
    moonDisk=new THREE.Mesh(new THREE.CircleGeometry(11,24),new THREE.MeshBasicMaterial({color:0xdfe6f2,fog:false,transparent:true}));scene.add(moonDisk);
    var cm=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x555555,fog:false,transparent:true,opacity:.92});
    for(var c=0;c<26;c++){var g=new THREE.Group(),n=4+(Math.random()*4|0);for(var k=0;k<n;k++){var b=new THREE.Mesh(new THREE.IcosahedronGeometry(8+Math.random()*8,1),cm);b.position.set(k*10-n*5+Math.random()*6,Math.random()*4,Math.random()*10-5);b.scale.y=.45;g.add(b)}
      g.position.set((Math.random()-.5)*900,140+Math.random()*60,(Math.random()-.5)*900);g.userData.v=1+Math.random()*2;scene.add(g);clouds.push(g)}
  }
  function buildWorld(seed){
    SEED=seed;scene=new THREE.Scene();cols=[];grid={};structs=[];zombies=[];animals=[];drops=[];bushes=[];chests=[];clouds=[];grassC=null;
    scene.background=new THREE.Color(0xbfdcf0);scene.fog=new THREE.Fog(0xbfdcf0,80,380);
    buildSky();
    amb=new THREE.HemisphereLight(0xdfefff,0x4a5a30,.85);scene.add(amb);
    sun=new THREE.DirectionalLight(0xfff2dc,1.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);var sc=sun.shadow.camera;sc.left=sc.bottom=-55;sc.right=sc.top=55;sc.near=1;sc.far=320;sun.shadow.bias=-.0006;sun.shadow.normalBias=.4;scene.add(sun);scene.add(sun.target);
    torchL=new THREE.PointLight(0xffa64a,0,18,1.5);scene.add(torchL);
    // relief : couleurs selon hauteur et pente, texture de détail par-dessus
    var g=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);g.rotateX(-Math.PI/2);
    var pos=g.attributes.position,col=new Float32Array(pos.count*3),c=new THREE.Color(),grassA=new THREE.Color(0x4f7d2c),grassB=new THREE.Color(0x6e8f37),rock=new THREE.Color(0x77736b),sand=new THREE.Color(0xd8c99a),snow=new THREE.Color(0xf2f4f7),dirt=new THREE.Color(0x6b5a3c);
    for(var i=0;i<pos.count;i++){var x=pos.getX(i),z=pos.getZ(i),h=height(x,z);pos.setY(i,h);
      var sl=slope(x,z),n=fbm(x/30,z/30,SEED+40);
      if(h<.8)c.copy(sand);else{c.copy(grassA).lerp(grassB,n);if(n>.68)c.lerp(dirt,(n-.68)*2.2);if(h>20)c.lerp(rock,Math.min(1,(h-20)/8));if(sl>.85)c.lerp(rock,Math.min(1,(sl-.85)*1.6));if(h>36)c.lerp(snow,Math.min(1,(h-36)/5))}
      col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    var dt=detailTex();dt.repeat.set(140,140);
    terrain=new THREE.Mesh(g,lam({vertexColors:true,map:dt}));terrain.receiveShadow=true;scene.add(terrain);
    waterNorm=normalTex();waterNorm.repeat.set(60,60);
    water=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.MeshPhongMaterial({color:0x2a6f93,transparent:true,opacity:.86,shininess:120,specular:0xbbd4e6,normalMap:waterNorm,normalScale:new THREE.Vector2(.6,.6)}));water.rotation.x=-Math.PI/2;water.position.y=-.25;scene.add(water);
    // végétation
    var R=rng(seed),tl=[],rl=[],ol=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s3=new THREE.Vector3(),p3=new THREE.Vector3(),tc=new THREE.Color();
    for(var t=0;t<3400;t++){var x2=(R()-.5)*SIZE*.92,z2=(R()-.5)*SIZE*.92,h2=height(x2,z2);if(h2<1.5||h2>28||slope(x2,z2)>1.1)continue;var fo=fbm(x2/45,z2/45,seed+20);if(fo<.46&&R()<.8)continue;tl.push({x:x2,z:z2,y:h2,s:.75+R()*.8,k:h2>16?0:(R()<.45?0:R()<.7?1:2),r:R()*6,c:R()})}
    for(var r=0;r<560;r++){var x3=(R()-.5)*SIZE*.9,z3=(R()-.5)*SIZE*.9,h3=height(x3,z3);if(h3<.5)continue;rl.push({x:x3,z:z3,y:h3,s:.6+R()*1.5,r:R()*6})}
    for(var o=0;o<900&&ol.length<90;o++){var x6=(R()-.5)*SIZE*.85,z6=(R()-.5)*SIZE*.85,h6=height(x6,z6);if(h6<17||h6>40)continue;ol.push({x:x6,z:z6,y:h6,s:.8+R()*.6,r:R()*6})}
    function inst(geo,mat,list,fn,col){var im=new THREE.InstancedMesh(geo,mat,list.length);im.castShadow=true;im.receiveShadow=true;list.forEach(function(o,i){fn(o,i,m4);im.setMatrixAt(i,m4);if(col){col(o,tc);im.setColorAt(i,tc)}});scene.add(im);return im}
    var trunkG=new THREE.CylinderGeometry(.2,.34,4.2,7);trunkG.translate(0,2.1,0);
    var pine1=new THREE.ConeGeometry(2.1,4.6,9);pine1.translate(0,4.4,0);var pine2=new THREE.ConeGeometry(1.6,3.8,9);pine2.translate(0,6.4,0);var pine3=new THREE.ConeGeometry(1.05,2.8,9);pine3.translate(0,8.2,0);
    var leaf1=new THREE.IcosahedronGeometry(2.3,1);leaf1.translate(0,5.2,0);var leaf2=new THREE.IcosahedronGeometry(1.6,1);leaf2.translate(.9,6.4,.4);
    var birchT=new THREE.CylinderGeometry(.15,.22,5.2,7);birchT.translate(0,2.6,0);var birchL=new THREE.IcosahedronGeometry(1.7,1);birchL.scale(1,1.5,1);birchL.translate(0,6,0);
    function place(o,i,m){q.setFromAxisAngle(new THREE.Vector3(0,1,0),o.r);s3.set(o.s,o.s,o.s);p3.set(o.x,o.y-.25,o.z);m.compose(p3,q,s3)}
    function green(base,var1){return function(o,c){c.setHex(base);c.offsetHSL((o.c-.5)*.05,(o.c-.5)*.1,(o.c-.5)*var1)}}
    trees={list:tl,meshes:[]};
    [[0,[trunkG,pine1,pine2,pine3],[0x5b3b22,0x2c5a2c,0x336a31,0x3b7537]],[1,[trunkG,leaf1,leaf2],[0x5f4027,0x4b7f2c,0x568d31]],[2,[birchT,birchL],[0xe8e4da,0x86a83a]]].forEach(function(set){
      var lst=tl.filter(function(o){return o.k===set[0]});
      var ms=set[1].map(function(geo,j){return inst(geo,lam({color:0xffffff}),lst,place,j===0?function(o,c){c.setHex(set[2][0])}:green(set[2][j],.12))});
      lst.forEach(function(o,i){o.ms=ms;o.i=i;o.hp=5;addCol({x:o.x,z:o.z,r:.45*o.s,type:'tree',ref:o})});
      trees.meshes.push(ms);
    });
    var rockG=new THREE.DodecahedronGeometry(1,1),pp=rockG.attributes.position;for(var v=0;v<pp.count;v++){var k2=1+(hash(pp.getX(v)*9,pp.getZ(v)*9,1)-.5)*.35;pp.setXYZ(v,pp.getX(v)*k2,pp.getY(v)*k2,pp.getZ(v)*k2)}rockG.computeVertexNormals();
    rocks=inst(rockG,lam({color:0xffffff}),rl,function(o,i,m){q.setFromEuler(new THREE.Euler(o.r,o.r*2,0));s3.set(o.s*1.3,o.s*.8,o.s);p3.set(o.x,o.y+o.s*.15,o.z);m.compose(p3,q,s3)},function(o,c){c.setHex(0x8c8a84);c.offsetHSL(0,0,(o.r/6-.5)*.12)});
    rl.forEach(function(o,i){o.i=i;o.hp=5;addCol({x:o.x,z:o.z,r:o.s*1.05,type:'rock',ref:o})});rocks.userData.list=rl;
    ores=inst(rockG,lam({color:0xffffff}),ol,function(o,i,m){q.setFromEuler(new THREE.Euler(o.r,o.r,0));s3.set(o.s*1.2,o.s,o.s*1.1);p3.set(o.x,o.y+o.s*.3,o.z);m.compose(p3,q,s3)},function(o,c){c.setHex(0x8a5a3c)});
    ol.forEach(function(o,i){o.i=i;o.hp=6;addCol({x:o.x,z:o.z,r:o.s*1.05,type:'ore',ref:o})});ores.userData.list=ol;
    // veines de fer qui brillent
    var vg=new THREE.BufferGeometry(),vp=[];ol.forEach(function(o){for(var k=0;k<6;k++){var a=hash(o.x,k,2)*6.28;vp.push(o.x+Math.cos(a)*o.s*.9,o.y+o.s*(.2+hash(o.z,k,3)*.6),o.z+Math.sin(a)*o.s*.9)}});vg.setAttribute('position',new THREE.Float32BufferAttribute(vp,3));
    var veins=new THREE.Points(vg,new THREE.PointsMaterial({color:0xe0a070,size:.25}));scene.add(veins);ores.userData.veins=veins;
    // buissons à baies
    for(var b=0;b<200;b++){var x4=(R()-.5)*SIZE*.85,z4=(R()-.5)*SIZE*.85,h4=height(x4,z4);if(h4<1.5||h4>20)continue;
      var bg=new THREE.Group(),bm=new THREE.Mesh(new THREE.IcosahedronGeometry(.8,1),lam({color:0x3b6e2c}));bm.scale.set(1.2,.8,1.2);bm.position.y=.5;bm.castShadow=true;bg.add(bm);
      var berries=new THREE.Group();for(var k=0;k<9;k++){var be=new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),lam({color:0xc0152a,emissive:0x300000}));var a=R()*6.28;be.position.set(Math.cos(a)*.85,.45+R()*.5,Math.sin(a)*.85);berries.add(be)}bg.add(berries);
      bg.position.set(x4,h4,z4);scene.add(bg);bushes.push({x:x4,z:z4,m:bg,b:berries,full:true,t:0})}
    // coffres (les dorés : près des ruines, avec une pièce de radio)
    for(var ch=0;ch<56;ch++){var x5,z5,h5,tries=0;do{x5=(R()-.5)*SIZE*.82;z5=(R()-.5)*SIZE*.82;h5=height(x5,z5);tries++}while((h5<1||h5>30)&&tries<30);
      var rare=ch<12,cmh=chestMesh(rare);cmh.position.set(x5,h5,z5);cmh.rotation.y=R()*6;scene.add(cmh);var co={id:ch,x:x5,z:z5,m:cmh,open:false,rare:rare};chests.push(co);addCol({x:x5,z:z5,r:.6,type:'chest',ref:co})}
    chests.filter(function(c){return c.rare}).forEach(function(c){
      for(var k=0;k<4;k++){var a=k*1.57+c.id,hgt=1.2+R()*2.6,w=new THREE.Mesh(new THREE.BoxGeometry(4.2,hgt,.6),lam({color:0x8d877b,map:dt}));var wx=c.x+Math.cos(a)*3.4,wz=c.z+Math.sin(a)*3.4;if(k===3&&R()<.6)continue;w.position.set(wx,height(wx,wz)+hgt/2-.2,wz);w.rotation.y=-a+Math.PI/2;w.castShadow=w.receiveShadow=true;scene.add(w);addCol({x:wx,z:wz,r:1.3,type:'ruin'})}
      var pil=new THREE.Mesh(new THREE.CylinderGeometry(.35,.4,5,8),lam({color:0x9a948a}));pil.position.set(c.x+2,height(c.x+2,c.z+2)+2.3,c.z+2);pil.castShadow=true;scene.add(pil);
    });
    // herbe et fleurs (placées autour du joueur)
    var bladeG=new THREE.ConeGeometry(.05,.55,3);bladeG.translate(0,.27,0);
    var tuft=new THREE.BufferGeometry();(function(){var arr=[];for(var k=0;k<5;k++){var a=k*1.25,ox=Math.cos(a)*.12,oz=Math.sin(a)*.12,lean=.12;arr.push(ox-.03,0,oz, ox+.03,0,oz, ox+Math.cos(a)*lean,.45+k%2*.15,oz+Math.sin(a)*lean)}tuft.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));tuft.computeVertexNormals()})();
    grass=new THREE.InstancedMesh(tuft,new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}),7000);grass.count=0;scene.add(grass);
    flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(.09,6,4),new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x111111}),900);flowers.count=0;scene.add(flowers);
    // animaux
    for(var an=0;an<30;an++)addAnimal('deer',R);for(var w2=0;w2<10;w2++)addAnimal('wolf',R);
  }
  function placeGrass(){
    var cx=Math.round(P.x/10)*10,cz=Math.round(P.z/10)*10;if(grassC&&grassC.x===cx&&grassC.z===cz)return;grassC={x:cx,z:cz};
    var m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),c=new THREE.Color(),n=0,f=0,STEP=1.1,RAD=46;
    for(var gx=cx-RAD;gx<=cx+RAD;gx+=STEP)for(var gz=cz-RAD;gz<=cz+RAD;gz+=STEP){
      var ix=Math.round(gx/STEP),iz=Math.round(gz/STEP),hh=hash(ix,iz,7);if(hh<.35)continue;
      var x=ix*STEP+(hash(ix,iz,8)-.5)*STEP,z=iz*STEP+(hash(ix,iz,9)-.5)*STEP;if(Math.hypot(x-cx,z-cz)>RAD)continue;
      var h=height(x,z);if(h<1.1||h>22)continue;
      if(hash(ix,iz,11)>.985&&f<900){q.identity();s.setScalar(1);p.set(x,h+.25,z);m.compose(p,q,s);flowers.setMatrixAt(f,m);c.setHex([0xf3d23a,0xf1ece2,0xb072e0,0xe2361b][(hash(ix,iz,12)*4)|0]);flowers.setColorAt(f,c);f++;continue}
      if(n>=7000)continue;
      q.setFromAxisAngle(new THREE.Vector3(0,1,0),hh*40);s.set(1,.7+hash(ix,iz,10)*.9,1);p.set(x,h-.03,z);m.compose(p,q,s);grass.setMatrixAt(n,m);
      c.setHex(0x5a8a30);c.offsetHSL((hash(ix,iz,13)-.5)*.04,0,(hash(ix,iz,14)-.5)*.12);if(h>17)c.lerp(new THREE.Color(0x7d7a55),.4);grass.setColorAt(n,c);n++;
    }
    grass.count=n;flowers.count=f;grass.instanceMatrix.needsUpdate=true;flowers.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;if(flowers.instanceColor)flowers.instanceColor.needsUpdate=true;
  }
  function chestMesh(rare){
    var g=new THREE.Group(),wood=lam({color:rare?0x3c4a5a:0x7a5230}),band=lam({color:rare?0xd4a32a:0x3a3a3a,emissive:rare?0x3a2a00:0});
    var base=new THREE.Mesh(new THREE.BoxGeometry(1.1,.6,.7),wood);base.position.y=.3;base.castShadow=true;g.add(base);
    var lid=new THREE.Group(),lm=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.1,12,1,false,0,Math.PI),wood);lm.rotation.z=Math.PI/2;lid.add(lm);lid.position.set(0,.6,0);g.add(lid);
    [-.35,.35].forEach(function(x){var b=new THREE.Mesh(new THREE.BoxGeometry(.08,.62,.72),band);b.position.set(x,.31,0);g.add(b)});
    if(rare){var gl=new THREE.PointLight(0xffc860,.8,6);gl.position.y=1;g.add(gl)}
    g.userData={lid:lid,rare:rare};return g;
  }
  function humanoid(col,skin,zombie){
    var g=new THREE.Group(),m=lam({color:col}),sk=lam({color:skin}),dk=lam({color:0x2b2a28});
    var body=new THREE.Mesh(new THREE.CapsuleGeometry(.3,.6,4,10),m);body.position.y=1.25;body.castShadow=true;g.add(body);
    var head=new THREE.Mesh(new THREE.SphereGeometry(.23,14,10),sk);head.position.y=1.92;head.castShadow=true;head.userData.head=true;g.add(head);
    var legs=[],arms=[];
    [-.14,.14].forEach(function(x){var l=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.6,3,8),dk);l.geometry.translate(0,-.4,0);l.position.set(x,.85,0);l.castShadow=true;g.add(l);legs.push(l)});
    [-.4,.4].forEach(function(x){var a=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.55,3,8),zombie?sk:m);a.geometry.translate(0,-.33,0);a.position.set(x,1.55,0);if(zombie)a.rotation.x=-1.4;a.castShadow=true;g.add(a);arms.push(a)});
    if(zombie){var e1=new THREE.Mesh(new THREE.SphereGeometry(.04,6,4),new THREE.MeshBasicMaterial({color:0xff2a10}));e1.position.set(-.08,1.95,-.2);var e2=e1.clone();e2.position.x=.08;g.add(e1);g.add(e2)}
    g.userData.parts={legs:legs,arms:arms};return g;
  }
  function quad(col,wolf){
    var g=new THREE.Group(),m=lam({color:col}),l=lam({color:wolf?0x3a3a3a:0x6b4426}),s=wolf?.75:1;
    var b=new THREE.Mesh(new THREE.CapsuleGeometry(.33*s,1*s,4,10),m);b.rotation.x=Math.PI/2;b.position.y=1.05*s;b.castShadow=true;g.add(b);
    var n=new THREE.Mesh(new THREE.CapsuleGeometry(.14*s,.45*s,3,8),m);n.position.set(0,(wolf?1.15:1.5)*s,-.7*s);n.rotation.x=wolf?1.1:.6;g.add(n);
    var h=new THREE.Mesh(new THREE.SphereGeometry(.21*s,12,8),m);h.scale.set(.9,.9,wolf?1.7:1.4);h.position.set(0,(wolf?1.25:1.75)*s,(wolf?-1.05:-.95)*s);h.userData.head=true;g.add(h);
    if(wolf){[-.1,.1].forEach(function(x){var e=new THREE.Mesh(new THREE.ConeGeometry(.07,.18,4),m);e.position.set(x,1.45*s,-.95*s);g.add(e)});var tl=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.5,3,6),m);tl.position.set(0,1.05*s,.75*s);tl.rotation.x=-.8;g.add(tl);var ey=new THREE.Mesh(new THREE.SphereGeometry(.035,6,4),new THREE.MeshBasicMaterial({color:0xffd23f}));ey.position.set(-.08,1.32*s,-1.3*s);g.add(ey);var ey2=ey.clone();ey2.position.x=.08;g.add(ey2)}
    else{[-.12,.12].forEach(function(x){var an=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.5,4),lam({color:0x7a6a50}));an.position.set(x,2.05,-.85);an.rotation.z=x*3;g.add(an)})}
    var legs=[];[[-.18,-.45],[.18,-.45],[-.18,.45],[.18,.45]].forEach(function(p){var lg=new THREE.Mesh(new THREE.CylinderGeometry(.06*s,.05*s,.85*s,6),l);lg.geometry.translate(0,-.42*s,0);lg.position.set(p[0]*s,.88*s,p[1]*s);lg.castShadow=true;g.add(lg);legs.push(lg)});
    g.userData.parts={legs:legs,arms:[]};return g;
  }
  function addAnimal(kind,R){
    var x,z,t=0;do{x=(R()-.5)*SIZE*.8;z=(R()-.5)*SIZE*.8;t++}while((height(x,z)<2||(P&&Math.hypot(x-P.x,z-P.z)<60))&&t<30);
    var wolf=kind==='wolf',m=quad(wolf?0x77777a:0x8a5a33,wolf);scene.add(m);
    var a={kind:kind,x:x,z:z,yaw:R()*6,hp:wolf?60:40,m:m,alive:true,t:0,flee:0,r:wolf?.5:.6,cd:0};m.userData.ent=a;animals.push(a);
  }
  function addZombie(){
    var x,z,n=0;do{var a=Math.random()*6.28,d=40+Math.random()*25;x=P.x+Math.cos(a)*d;z=P.z+Math.sin(a)*d;n++}while(height(x,z)<.5&&n<12);if(height(x,z)<.5)return;
    var blood=bloodNight(),big=Math.random()<(blood?.2:.06)+day*.01;
    var m=humanoid([0x4d5a3a,0x5a4a3a,0x3a4a5a,0x5a3a3a][Math.random()*4|0],big?0x6f8a5a:0x86a070,true);if(big)m.scale.setScalar(1.45);scene.add(m);
    var e={kind:'z',x:x,z:z,yaw:0,hp:(70+day*12)*(big?3.5:1),dmg:(9+day*1.5)*(big?2:1),sp:(2.2+Math.random()*.9+Math.min(1.4,day*.1))*(big?.75:1)*(blood?1.15:1),m:m,alive:true,cd:0,r:big?.6:.4,anim:0};m.userData.ent=e;zombies.push(e);
  }

  /* ---------- Joueur et sauvegarde ---------- */
  function freshInv(){return {bois:0,pierre:0,fer:0,baies:2,viande:0,cuite:0,conserve:1,eau:1,bandage:1,munitions:0,fleches:0,tissu:0,cuir:0,radio:0,pick:0,sword:0,bow:0,pistol:0,rifle:0,torch:0,iaxe:0,armure:0,call:0}}
  function newGame(){
    var seed=(Math.random()*1e9)|0;buildWorld(seed);
    var sp=findSpawn();P={x:sp.x,z:sp.z,y:height(sp.x,sp.z),vy:0,yaw:0,pitch:0,hp:100,food:80,water:80,stam:100,bob:0,spawn:null};
    inv=freshInv();st={bois:0,fer:0,deer:0,kills:0};tool='axe';dayT=.27;day=1;goalI=0;rescueT=-1;won=false;
    msg('Jour 1 : suis les objectifs en haut à gauche');
  }
  function findSpawn(){for(var i=0;i<300;i++){var a=Math.random()*6.28,d=HALF*.55*Math.random(),x=Math.cos(a)*d,z=Math.sin(a)*d,h=height(x,z);if(h>2&&h<12&&!hitsCol(x,z,1))return {x:x,z:z}}return {x:0,z:0}}
  function save(){
    if(!P||won)return;
    var s={v:2,seed:SEED,day:day,t:dayT,p:{x:P.x,z:P.z,hp:P.hp,food:P.food,water:P.water,spawn:P.spawn},inv:inv,st:st,goal:goalI,rescue:rescueT,
      sts:structs.filter(function(o){return !o.dead}).map(function(o){return [o.type,+o.x.toFixed(2),+o.z.toFixed(2),o.rot,Math.round(o.hp),o.store||null]}),
      ch:chests.filter(function(c){return c.open}).map(function(c){return c.id}),
      tr:trees.list.filter(function(o){return o.hp<=0}).map(function(o){return trees.list.indexOf(o)}),
      rk:rocks.userData.list.filter(function(o){return o.hp<=0}).map(function(o){return o.i}),
      or:ores.userData.list.filter(function(o){return o.hp<=0}).map(function(o){return o.i})};
    try{localStorage.setItem('pp-survie2',JSON.stringify(s))}catch(e){}
  }
  function hasSave(){try{return !!JSON.parse(localStorage.getItem('pp-survie2'))}catch(e){return false}}
  function load(){
    var s;try{s=JSON.parse(localStorage.getItem('pp-survie2'))}catch(e){}
    if(!s)return newGame();
    buildWorld(s.seed);day=s.day;dayT=s.t;inv=Object.assign(freshInv(),s.inv);st=s.st||{bois:0,fer:0,deer:0,kills:0};goalI=s.goal||0;rescueT=s.rescue==null?-1:s.rescue;won=false;
    P={x:s.p.x,z:s.p.z,y:height(s.p.x,s.p.z),vy:0,yaw:0,pitch:0,hp:s.p.hp,food:s.p.food,water:s.p.water,stam:100,bob:0,spawn:s.p.spawn};
    (s.sts||[]).forEach(function(o){var x=build(o[0],o[1],o[2],o[3],true);if(x){x.hp=o[4];if(o[5])x.store=o[5]}});P.spawn=s.p.spawn;
    (s.ch||[]).forEach(function(id){var c=chests[id];if(c){c.open=true;c.m.userData.lid.rotation.x=-1.9}});
    (s.tr||[]).forEach(function(i){var o=trees.list[i];if(o)fell(o,'tree',true)});
    (s.rk||[]).forEach(function(i){var o=rocks.userData.list[i];if(o)fell(o,'rock',true)});
    (s.or||[]).forEach(function(i){var o=ores.userData.list[i];if(o)fell(o,'ore',true)});
    msg('Partie reprise : jour '+day);
  }

  /* ---------- Construction ---------- */
  function structMesh(type){
    var g=new THREE.Group(),wood=lam({color:0x8a6239}),dark=lam({color:0x5a3d22}),stone=lam({color:0x7f7c76});
    if(type==='wall'||type==='door'){
      for(var i=0;i<5;i++){var l=new THREE.Mesh(new THREE.CylinderGeometry(.2,.21,2.8,8),i%2?wood:dark);l.position.set(-.8+i*.4,1.4,0);g.add(l);var tip=new THREE.Mesh(new THREE.ConeGeometry(.2,.35,8),i%2?wood:dark);tip.position.set(-.8+i*.4,2.97,0);g.add(tip)}
      var bar=new THREE.Mesh(new THREE.BoxGeometry(2,.18,.12),dark);bar.position.set(0,2,.18);g.add(bar);var bar2=bar.clone();bar2.position.y=.8;g.add(bar2);
      if(type==='door'){var h=new THREE.Mesh(new THREE.TorusGeometry(.12,.03,6,12),lam({color:0x333333}));h.position.set(.5,1.3,.25);g.add(h);g.children.forEach(function(c){if(c.material===wood)c.material=lam({color:0xa07040})})}
    }else if(type==='fire'){
      for(var k=0;k<7;k++){var s=new THREE.Mesh(new THREE.DodecahedronGeometry(.22,0),stone);s.position.set(Math.cos(k*.9)*.6,.1,Math.sin(k*.9)*.6);g.add(s)}
      for(var j=0;j<3;j++){var lg=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1,6),dark);lg.rotation.z=1.2;lg.rotation.y=j*2.1;lg.position.y=.25;g.add(lg)}
      var fl=new THREE.Mesh(new THREE.ConeGeometry(.35,.9,8),new THREE.MeshBasicMaterial({color:0xff9a2a,transparent:true,opacity:.9}));fl.position.y=.6;g.add(fl);var fl2=new THREE.Mesh(new THREE.ConeGeometry(.2,.6,8),new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.95}));fl2.position.y=.5;g.add(fl2);g.userData.flame=fl;
      var pl=new THREE.PointLight(0xff9a40,2.2,24,1.4);pl.position.y=1.2;g.add(pl);g.userData.light=pl;
    }else if(type==='spike'){
      for(var s2=0;s2<5;s2++){var sp=new THREE.Mesh(new THREE.ConeGeometry(.12,1.3,6),wood);sp.position.set(-.8+s2*.4,.55,0);sp.rotation.x=-.5;g.add(sp)}
      var b2=new THREE.Mesh(new THREE.BoxGeometry(2,.15,.15),dark);b2.position.y=.2;g.add(b2);
    }else if(type==='bed'){
      var f=new THREE.Mesh(new THREE.BoxGeometry(1.1,.35,2.1),dark);f.position.y=.2;g.add(f);var mt=new THREE.Mesh(new THREE.BoxGeometry(1,.18,1.9),lam({color:0xc8c0a8}));mt.position.y=.45;g.add(mt);var bl=new THREE.Mesh(new THREE.BoxGeometry(1.02,.1,1.2),lam({color:0x9c3a2a}));bl.position.set(0,.56,.3);g.add(bl);var pw=new THREE.Mesh(new THREE.BoxGeometry(.7,.14,.4),lam({color:0xf1ece2}));pw.position.set(0,.6,-.7);g.add(pw);
    }else if(type==='bench'){
      var top=new THREE.Mesh(new THREE.BoxGeometry(2,.15,1),wood);top.position.y=1;g.add(top);[[-.9,-.4],[.9,-.4],[-.9,.4],[.9,.4]].forEach(function(p){var lg2=new THREE.Mesh(new THREE.BoxGeometry(.12,1,.12),dark);lg2.position.set(p[0],.5,p[1]);g.add(lg2)});
      var saw=new THREE.Mesh(new THREE.BoxGeometry(.6,.04,.2),lam({color:0x9a9a9a}));saw.position.set(.4,1.1,0);g.add(saw);var hm=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.4),dark);hm.position.set(-.5,1.12,.1);g.add(hm);
    }else if(type==='forge'){
      var base=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.1,1.2,10),stone);base.position.y=.6;g.add(base);var ch2=new THREE.Mesh(new THREE.CylinderGeometry(.3,.45,2.2,8),stone);ch2.position.set(0,2.2,.3);g.add(ch2);
      var glow=new THREE.Mesh(new THREE.CircleGeometry(.6,16),new THREE.MeshBasicMaterial({color:0xff6a1a}));glow.rotation.x=-Math.PI/2;glow.position.y=1.22;g.add(glow);g.userData.flame=glow;
      var anvil=new THREE.Mesh(new THREE.BoxGeometry(.7,.3,.3),lam({color:0x333336}));anvil.position.set(1.5,.75,0);g.add(anvil);var as=new THREE.Mesh(new THREE.BoxGeometry(.25,.6,.25),lam({color:0x333336}));as.position.set(1.5,.3,0);g.add(as);
      var pl2=new THREE.PointLight(0xff7a30,1.6,14,1.5);pl2.position.y=1.8;g.add(pl2);g.userData.light=pl2;
    }else if(type==='box'){var cm=chestMesh(false);cm.scale.setScalar(1.1);g.add(cm)}
    g.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
    return g;
  }
  function canPay(c){return Object.keys(c).every(function(k){return (inv[k]||0)>=c[k]})}
  function pay(c){Object.keys(c).forEach(function(k){inv[k]-=c[k]})}
  function costTxt(c){return Object.keys(c).map(function(k){return c[k]+' '+(NAMES[k]||k).toLowerCase()}).join(', ')}
  function build(type,x,z,rot,free){
    var B=BUILD[type];if(!free){if(!canPay(B.cost)){msg('Il manque : '+costTxt(B.cost));sfx.play('tick');return null}pay(B.cost)}
    var m=structMesh(type),y=height(x,z);m.position.set(x,y,z);m.rotation.y=rot*Math.PI/2;scene.add(m);
    var wide=type==='wall'||type==='door'||type==='spike',hw=wide?(rot%2?.25:1.05):type==='bench'?(rot%2?.5:1):type==='forge'?1.1:.6,hd=wide?(rot%2?1.05:.25):type==='bench'?(rot%2?1:.5):type==='forge'?1.1:(type==='bed'?1.05:.6);
    var o={type:type,x:x,z:z,rot:rot,hp:B.hp,max:B.hp,m:m,box:true,hw:hw,hd:hd};
    if(type!=='fire')addCol(o);
    structs.push(o);
    if(type==='bed')P.spawn={x:x,z:z+1.6};
    if(!free){sfx.play('pickup');hudInv()}
    return o;
  }
  function destroyStruct(o){remCol(o);scene.remove(o.m)}
  function ghostUpdate(){
    if(!buildMode){if(ghost){scene.remove(ghost);ghost=null}return}
    if(!ghost||ghost.userData.type!==buildMode){if(ghost)scene.remove(ghost);ghost=structMesh(buildMode);ghost.userData.type=buildMode;ghost.traverse(function(o){if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.5;o.castShadow=false}if(o.isLight)o.intensity=0});scene.add(ghost)}
    var x=Math.round(P.x-Math.sin(P.yaw)*3.2),z=Math.round(P.z-Math.cos(P.yaw)*3.2);
    ghost.position.set(x,height(x,z),z);ghost.rotation.y=ghostRot*Math.PI/2;ghost.userData.x=x;ghost.userData.z=z;
    var ok=canPay(BUILD[buildMode].cost);ghost.traverse(function(o){if(o.isMesh&&o.material.color)o.material.color.setHex(ok?0x9fe36a:0xe2361b)});
  }

  /* ---------- Récolte, coffres, combat ---------- */
  var ZERO=null;
  function fell(o,type,silent){
    if(!ZERO)ZERO=new THREE.Matrix4().makeScale(0,0,0);
    o.hp=0;
    if(type==='tree'){o.ms.forEach(function(im){im.setMatrixAt(o.i,ZERO);im.instanceMatrix.needsUpdate=true})}
    else{var im=type==='rock'?rocks:ores;im.setMatrixAt(o.i,ZERO);im.instanceMatrix.needsUpdate=true}
    near(o.x,o.z,2).forEach(function(c){if(c.ref===o)remCol(c)});
    if(silent)return;
    if(type==='tree'){inv.bois+=4;st.bois+=4;msg('L\'arbre tombe : +4 bois')}
    if(type==='rock'){inv.pierre+=3;msg('+3 pierre')}
    if(type==='ore'){inv.fer+=2;st.fer+=2;inv.pierre+=1;msg('+2 fer')}
    sfx.play('kill');
  }
  function isInFront(x,z,lim){var dx=x-P.x,dz=z-P.z,l=Math.hypot(dx,dz)||1;return (-Math.sin(P.yaw)*dx-Math.cos(P.yaw)*dz)/l>(lim||.5)}
  function interactTarget(){
    var best=null,bd=3.3;
    function cand(o,d,kind){if(d<bd){bd=d;best={o:o,k:kind}}}
    chests.forEach(function(c){if(!c.open){var d=Math.hypot(c.x-P.x,c.z-P.z);if(d<3.3&&isInFront(c.x,c.z))cand(c,d,'chest')}});
    bushes.forEach(function(b){if(b.full){var d=Math.hypot(b.x-P.x,b.z-P.z);if(d<3&&isInFront(b.x,b.z))cand(b,d,'bush')}});
    drops.forEach(function(dr){var d=Math.hypot(dr.x-P.x,dr.z-P.z);if(d<2.6)cand(dr,d-.5,'drop')});
    structs.forEach(function(s){if(s.dead)return;var d=Math.hypot(s.x-P.x,s.z-P.z);if(d<3.2&&isInFront(s.x,s.z,.3)&&['fire','bed','box','door','bench','forge'].indexOf(s.type)>=0)cand(s,d,s.type)});
    if(!best){var fx=P.x-Math.sin(P.yaw)*2.5,fz=P.z-Math.cos(P.yaw)*2.5;if(height(fx,fz)<-.1||height(P.x,P.z)<.3)best={k:'water'}}
    return best;
  }
  function prompt(){
    var t=interactTarget(),s='';
    if(buildMode)s='Clic : poser · R : tourner · B ou clic droit : annuler';
    else if(t){s={chest:'E : ouvrir le coffre',bush:'E : cueillir des baies',drop:'E : ramasser',water:'E : boire',fire:'E : cuire la viande'+(inv.viande?' ('+inv.viande+')':''),bed:'E : dormir'+(isNight()?' jusqu\'au matin':' (la nuit seulement)'),box:'E : déposer · clic droit : reprendre',door:'E : ouvrir / fermer',bench:'C : fabriquer à l\'établi',forge:'C : fabriquer à la forge'}[t.k]}
    var el=$('sv-prompt');el.textContent=s;el.style.display=s?'block':'none';
  }
  function interact(){
    var t=interactTarget();if(!t)return;
    if(t.k==='chest')openChest(t.o);
    if(t.k==='bush'){t.o.full=false;t.o.t=DAY*.8;t.o.b.visible=false;inv.baies+=3;msg('+3 baies');sfx.play('eat')}
    if(t.k==='drop'){var d=t.o;Object.keys(d.items).forEach(function(k){inv[k]=(inv[k]||0)+d.items[k]});msg(lootTxt(d.items));scene.remove(d.m);drops.splice(drops.indexOf(d),1);sfx.play('pickup')}
    if(t.k==='water'){P.water=Math.min(100,P.water+35);msg('Tu bois');sfx.play('ui')}
    if(t.k==='fire'){if(inv.viande>0){inv.cuite+=inv.viande;msg(inv.viande+' viande cuite');inv.viande=0;sfx.play('pickup')}else msg('Pas de viande crue')}
    if(t.k==='bed'){if(isNight()){if(zombies.some(function(z){return z.alive&&Math.hypot(z.x-P.x,z.z-P.z)<25}))msg('Impossible : des zombies sont tout près');else{dayT=.26;newDay();zombies.forEach(function(z){z.alive=false;scene.remove(z.m)});zombies=[];P.food=Math.max(0,P.food-15);P.water=Math.max(0,P.water-15);msg('Tu dors jusqu\'au matin');sfx.play('win');save()}}else msg('Tu ne peux dormir que la nuit')}
    if(t.k==='box'){var b=t.o;b.store=b.store||{};['bois','pierre','fer','cuir','tissu'].forEach(function(k){b.store[k]=(b.store[k]||0)+inv[k];inv[k]=0});msg('Ressources rangées dans le coffre');sfx.play('pickup')}
    if(t.k==='door'){var dd=t.o;dd.openD=!dd.openD;dd.m.rotation.y=dd.rot*Math.PI/2+(dd.openD?Math.PI/2:0);var gl=grid[dd.k]||[];if(dd.openD){var gi=gl.indexOf(dd);if(gi>=0)gl.splice(gi,1)}else if(gl.indexOf(dd)<0)gl.push(dd);sfx.play('ui')}
    if(t.k==='bench'||t.k==='forge')craftMenu();
    hudInv();
  }
  function lootTxt(it){return Object.keys(it).map(function(k){return '+'+it[k]+' '+({pistol:'pistolet',rifle:'fusil'}[k]||(NAMES[k]||k).toLowerCase())}).join(', ')}
  function openChest(c){
    c.open=true;c.m.userData.lid.rotation.x=-1.9;sfx.play('win');
    var it={},R=Math.random;function add(k,n){it[k]=(it[k]||0)+n}
    add(PP.pick(['conserve','eau','bandage','tissu','tissu']),1+(R()*2|0));add(PP.pick(['munitions','conserve','tissu','eau','fleches']),R()<.5?1:3);
    if(R()<.45)add('munitions',6+(R()*10|0));if(R()<.3)add('fer',1+(R()*2|0));
    if(c.rare){add('radio',1);if(!inv.pistol)add('pistol',1);else if(!inv.rifle&&R()<.6)add('rifle',1);else add('munitions',18)}
    else if(R()<.12&&!inv.pistol)add('pistol',1);
    Object.keys(it).forEach(function(k){inv[k]=(inv[k]||0)+it[k]});
    msg('Coffre : '+lootTxt(it));hudInv();save();
  }
  function dropAt(x,z,items){var m=new THREE.Mesh(new THREE.BoxGeometry(.45,.3,.45),lam({color:0x9a3020}));m.position.set(x,height(x,z)+.2,z);m.castShadow=true;scene.add(m);drops.push({x:x,z:z,m:m,items:items})}
  function attack(){
    if(cd>0||buildMode)return;var T=TOOLS[tool];
    if(T.ammo){if(inv[T.ammo]<=0){msg(tool==='bow'?'Plus de flèches':'Plus de munitions');sfx.play('tick');cd=.4;return}inv[T.ammo]--;sfx.play(tool==='bow'?'ui':'shoot');flash=tool==='bow'?0:1}
    else sfx.play('ui');
    cd=T.rate;swing=1;
    var dir=new THREE.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch)),org=new THREE.Vector3(P.x,P.y+EYE,P.z);
    ray.set(org,dir);ray.far=T.ammo?160:T.range;
    var tg=[];zombies.forEach(function(z){if(z.alive)tg.push(z.m)});animals.forEach(function(a){if(a.alive)tg.push(a.m)});
    var hs=ray.intersectObjects(tg,true),ht=ray.intersectObject(terrain,false),tdist=ht.length?ht[0].distance:1e9;
    var dmg=T.dmg*(tool==='axe'&&inv.iaxe?1.4:1);
    if(hs.length&&hs[0].distance<tdist){var o=hs[0].object,head=!!o.userData.head;while(o&&!o.userData.ent)o=o.parent;if(o){var e=o.userData.ent;e.hp-=dmg*(head?1.8:1);e.hurt=.15;if(e.kind==='deer')e.flee=6;if(e.kind==='wolf')e.angry=20;sfx.play('hit');if(e.hp<=0){e.alive=false;e.dieT=1;sfx.play('kill');st.kills++;
      if(e.kind==='deer'){dropAt(e.x,e.z,{viande:3,cuir:2});st.deer++}else if(e.kind==='wolf')dropAt(e.x,e.z,{viande:1,cuir:3});else{var r=Math.random();dropAt(e.x,e.z,r<.35?{munitions:6}:r<.6?{tissu:2}:r<.8?{conserve:1}:{fer:1})}}}}
    else if(T.melee){
      var l=near(P.x,P.z,4),best=null,bd=T.range;
      l.forEach(function(c){if(c.dead||(c.type!=='tree'&&c.type!=='rock'&&c.type!=='ore'))return;var d=Math.hypot(c.x-P.x,c.z-P.z)-c.r;if(d<bd&&isInFront(c.x,c.z,.4)){bd=d;best=c}});
      if(best){var o2=best.ref;
        if(best.type==='tree'){if(tool!=='axe'&&tool!=='sword'){msg('Prends la hache (1) pour couper');return}o2.hp-=inv.iaxe?2:1;sfx.play('hit');if(o2.hp<=0)fell(o2,'tree');else{inv.bois+=1;st.bois+=1;msg('+1 bois')}}
        else if(best.type==='rock'){var pw=tool==='pick'?2:1;o2.hp-=pw;sfx.play('hit');if(o2.hp<=0)fell(o2,'rock');else{inv.pierre+=1;msg('+1 pierre')}}
        else{if(tool!=='pick'){msg('Il faut une pioche pour miner le fer');sfx.play('tick');return}o2.hp--;sfx.play('hit');if(o2.hp<=0)fell(o2,'ore');else{inv.fer+=1;st.fer+=1;msg('+1 fer')}}}
    }
    hudInv();
  }
  function setTool(t){if(t!=='axe'&&!inv[t]){msg((TOOLS[t]?TOOLS[t].n:t)+' : pas encore fabriqué');return}tool=t;buildMode=null;viewModel();hudInv()}
  function eat(){
    var order=[['cuite',35],['conserve',25],['baies',8],['viande',10]];for(var i=0;i<order.length;i++){var k=order[i][0];if(inv[k]>0){inv[k]--;P.food=Math.min(100,P.food+order[i][1]);if(k==='conserve')P.water=Math.min(100,P.water+5);if(k==='viande'&&Math.random()<.3){P.hp-=8;msg('La viande crue te rend malade')}else msg('Tu manges : '+NAMES[k].toLowerCase());sfx.play('eat');hudInv();return}}
    msg('Rien à manger');
  }
  function heal(){if(inv.bandage>0&&P.hp<100){inv.bandage--;P.hp=Math.min(100,P.hp+35);msg('Bandage : +35 vie');sfx.play('pickup')}else if(inv.eau>0){inv.eau--;P.water=Math.min(100,P.water+40);msg('Tu bois une bouteille');sfx.play('ui')}else msg('Ni bandage ni eau');hudInv()}
  function hurt(d){d*=[1,.7,.45][inv.armure||0];P.hp-=d;lastHurt=performance.now();var h=$('sv-hurt');h.classList.remove('on');void h.offsetWidth;h.classList.add('on');sfx.play('hurt');if(P.hp<=0)die()}
  function die(){
    sfx.play('lose');var best=PP.store('sv-best');if(day>best){PP.store('sv-best',day);PP.refreshHi()}
    if(P.spawn){var lost={};['bois','pierre','fer','baies','viande','cuite','conserve','cuir'].forEach(function(k){var n=Math.floor((inv[k]||0)/2);if(n){lost[k]=n;inv[k]-=n}});dropAt(P.x,P.z,lost);P.x=P.spawn.x;P.z=P.spawn.z;P.hp=60;P.food=Math.max(P.food,40);P.water=Math.max(P.water,40);msg('Tu te réveilles dans ton lit. Ton sac est resté là où tu es tombé.');save();return}
    running=false;cancelAnimationFrame(raf);unlock();exitFull();try{localStorage.removeItem('pp-survie2')}catch(e){}
    $('sv-title').textContent='Tu es mort';$('sv-msg').textContent='Tu as survécu '+day+' jour'+(day>1?'s':'')+' et rempli '+goalI+' objectif'+(goalI>1?'s':'')+' sur '+GOALS.length+'. Construis un lit pour réapparaître la prochaine fois.';$('sv-start').textContent='Nouvelle île';$('sv-cont').hidden=true;$('sv-ov').hidden=false;
  }
  function msg(t){var m=$('sv-msg2');m.textContent=t;m.style.opacity=1;msgT=3.2}

  /* ---------- Artisanat ---------- */
  function nearStruct(t){return structs.some(function(s){return !s.dead&&s.type===t&&Math.hypot(s.x-P.x,s.z-P.z)<5})}
  function craftMenu(){
    var el=$('sv-craft');if(!el.hidden){el.hidden=true;lock();return}
    $('sv-build').hidden=true;buildMode=null;
    el.innerHTML='<b>Fabriquer</b><small class="hint">Établi et forge : il faut être à côté.</small>'+CRAFT.map(function(c,i){
      var okN=!c.near||nearStruct(c.near),ok=okN&&canPay(c.cost),done=(c.id==='pick'&&inv.pick)||(c.id==='bow'&&inv.bow)||(c.id==='torch'&&inv.torch)||(c.id==='sword'&&inv.sword)||(c.id==='iaxe'&&inv.iaxe)||(c.id==='leather'&&inv.armure>=1)||(c.id==='iron'&&inv.armure>=2)||(c.id==='radio'&&inv.call);
      return '<button type="button" class="'+(ok&&!done?'':'no')+'" data-c="'+i+'"'+(done?' disabled':'')+'><i>'+(i<9?i+1:0)+'</i>'+esc(c.n)+(done?' · fait':'')+'<small>'+costTxt(c.cost)+(c.near?' · '+(c.near==='bench'?'établi':'forge'):'')+(c.d?' · '+esc(c.d):'')+'</small></button>'}).join('')+'<small class="hint">C pour fermer.</small>';
    el.hidden=false;unlock();
  }
  function craft(i){
    var c=CRAFT[i];if(!c)return;
    if(c.near&&!nearStruct(c.near)){msg('Il faut être à côté '+(c.near==='bench'?'de l\'établi':'de la forge'));sfx.play('tick');return}
    if(!canPay(c.cost)){msg('Il manque : '+costTxt(c.cost));sfx.play('tick');return}
    pay(c.cost);Object.keys(c.give).forEach(function(k){inv[k]=Math.max(inv[k]||0,0)+(k==='armure'?0:c.give[k]);if(k==='armure')inv.armure=Math.max(inv.armure,c.give[k])});
    sfx.play('win');msg(c.n+' fabriqué');
    if(c.give.pick)setTool('pick');if(c.give.sword)setTool('sword');if(c.give.bow)setTool('bow');
    if(c.give.call){rescueT=2;PP.toast('Message reçu : « Hélicoptère en route. Tenez deux nuits. »','ok');msg('Les secours arrivent dans 2 jours. Tiens bon.')}
    $('sv-craft').hidden=true;craftMenu();hudInv();save();
  }
  $('sv-craft').addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(b)craft(+b.dataset.c)});

  /* ---------- Jour et nuit ---------- */
  function isNight(){return dayT<.22||dayT>.78}
  function bloodNight(){return day%4===0}
  function newDay(){
    day++;PP.toast('Jour '+day+(bloodNight()?' · cette nuit sera une nuit de sang':''),bloodNight()?'warn':'ok');
    if(rescueT>0){rescueT--;if(rescueT<=0)return victory()}
    if(animals.filter(function(a){return a.kind==='wolf'&&a.alive}).length<10)for(var i=0;i<3;i++)addAnimal('wolf',Math.random);
    save();
  }
  function victory(){
    won=true;running=false;cancelAnimationFrame(raf);unlock();exitFull();sfx.play('win');
    var best=PP.store('sv-best');if(day>best)PP.store('sv-best',day);try{localStorage.removeItem('pp-survie2')}catch(e){}
    $('sv-title').textContent='Sauvé !';$('sv-msg').textContent='L\'hélicoptère t\'a trouvé après '+day+' jours sur l\'île. '+st.kills+' créatures abattues. Bravo.';$('sv-start').textContent='Nouvelle île';$('sv-cont').hidden=true;$('sv-ov').hidden=false;
  }
  var cDay=new THREE.Color(0x3d7cc9),cDayH=new THREE.Color(0xbfdcf0),cDusk=new THREE.Color(0x5a4a7a),cDuskH=new THREE.Color(0xf0a060),cNight=new THREE.Color(0x050914),cNightH=new THREE.Color(0x101a30),cBlood=new THREE.Color(0x3a0a0a),cBloodH=new THREE.Color(0x6a1a12),tA=new THREE.Color(),tB=new THREE.Color(),sv=new THREE.Vector3();
  function lightCycle(dt){
    var s=Math.cos((dayT-.5)*Math.PI*2),k=Math.max(0,Math.min(1,(s+.25)/.6)),dusk=Math.max(0,1-Math.abs(s+.05)*3.2),blood=bloodNight()&&isNight();
    tA.copy(blood?cBlood:cNight).lerp(cDay,k);tB.copy(blood?cBloodH:cNightH).lerp(cDayH,k);tA.lerp(cDusk,dusk*.6);tB.lerp(cDuskH,dusk*.75);
    skyMat.uniforms.top.value.copy(tA);skyMat.uniforms.hor.value.copy(tB);scene.fog.color.copy(tB);scene.background.copy(tB);scene.fog.far=150+250*k;scene.fog.near=k>.3?80:20;
    var ang=(dayT-.25)*Math.PI*2;sv.set(Math.cos(ang),Math.sin(ang),.35).normalize();skyMat.uniforms.sunDir.value.copy(sv);skyMat.uniforms.sunCol.value.setRGB(1,.85+.15*k,.7+.3*k);
    var lightDir=k>0.02?sv:sv.clone().negate();
    sun.position.set(P.x+lightDir.x*160,Math.max(20,lightDir.y*160),P.z+lightDir.z*160);sun.target.position.set(P.x,P.y,P.z);
    sun.intensity=k>0.02?.15+1.6*k:.25;sun.color.setRGB(1,.82+.18*k-dusk*.15,.65+.35*k-dusk*.2);if(k<=0.02)sun.color.setHex(blood?0xff5a4a:0x8aa6ff);
    amb.intensity=.22+.7*k;amb.color.setRGB(.6+.4*k,.65+.35*k,.85+.15*k);
    skyMesh.position.copy(cam.position);stars.position.copy(cam.position);stars.material.opacity=Math.max(0,1-k*2.5)*(blood?.5:1);
    sunDisk.position.copy(cam.position).addScaledVector(sv,700);sunDisk.lookAt(cam.position);sunDisk.visible=sv.y>-.05;
    moonDisk.position.copy(cam.position).addScaledVector(sv,-700);moonDisk.lookAt(cam.position);moonDisk.visible=sv.y<.05;moonDisk.material.color.setHex(blood?0xff5040:0xdfe6f2);
    clouds.forEach(function(c){c.position.x+=c.userData.v*dt;if(c.position.x>P.x+500)c.position.x-=1000;c.children[0].material.color.setRGB(.35+.65*k,.35+.62*k-dusk*.1,.4+.6*k-dusk*.25)});
    water.material.color.setRGB(.06+.12*k,.18+.27*k,.28+.3*k);waterNorm.offset.x+=dt*.01;waterNorm.offset.y+=dt*.006;R3.toneMappingExposure=.85+.25*k;
  }

  /* ---------- Boucle ---------- */
  function step(dt){
    var now=performance.now();
    dayT+=dt/DAY;if(dayT>=1){dayT-=1;newDay();if(won)return}
    lightCycle(dt);
    var sprint=keys.SH&&P.stam>5&&(keys.F||keys.B||keys.L||keys.R),sp=(sprint?8.5:4.8)*dt;
    if(sprint)P.stam=Math.max(0,P.stam-dt*18);else P.stam=Math.min(100,P.stam+dt*12);
    var fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),mx=0,mz=0;if(keys.F){mx+=fx;mz+=fz}if(keys.B){mx-=fx;mz-=fz}if(keys.L){mx+=fz;mz-=fx}if(keys.R){mx-=fz;mz+=fx}
    var ml=Math.hypot(mx,mz);if(ml){if(height(P.x,P.z)<.2)sp*=.55;moveCirc(P,mx/ml*sp,mz/ml*sp,.4,'p');P.bob+=dt*(sprint?12:8)}
    var gh=Math.max(height(P.x,P.z),-.9);if(keys.J&&P.y<=gh+.05){P.vy=5.5;keys.J=false}
    P.vy-=15*dt;P.y+=P.vy*dt;if(P.y<gh){P.y=gh;P.vy=0}
    cd-=dt;swing=Math.max(0,swing-dt*3.5);flash*=.7;if(mouseDown&&TOOLS[tool].auto)attack();
    P.food=Math.max(0,P.food-dt*100/560*(sprint?1.6:1));P.water=Math.max(0,P.water-dt*100/420*(sprint?1.6:1));
    if(P.food<=0||P.water<=0){P.hp-=dt*1.5;if(P.hp<=0)return die()}
    else if(P.food>55&&P.water>55&&now-lastHurt>5000&&P.hp<100)P.hp=Math.min(100,P.hp+dt*1.2);
    // torche
    torchL.intensity=tool==='torch'?(isNight()?2.4:1)+Math.sin(now/70)*.2:0;torchL.position.set(P.x-Math.sin(P.yaw)*.6,P.y+EYE,P.z-Math.cos(P.yaw)*.6);
    // zombies la nuit
    if(isNight()){spawnT-=dt;var cap=Math.min(32,4+day*3)*(bloodNight()?1.6:1);if(spawnT<=0&&zombies.filter(function(z){return z.alive}).length<cap){spawnT=Math.max(1,(6-day*.4)*(bloodNight()?.5:1));addZombie()}}
    else if(dayT>.3&&dayT<.7){zombies.forEach(function(z){if(z.alive&&Math.random()<dt*.15)z.hp=0})}
    zombies.forEach(function(z){
      if(!z.alive){if(z.dieT>0){z.dieT-=dt;z.m.rotation.x=Math.min(1.5,(1-z.dieT)*3);if(z.dieT<=0)scene.remove(z.m)}return}
      if(z.hp<=0){z.alive=false;z.dieT=1;return}
      var dx=P.x-z.x,dz=P.z-z.z,d=Math.hypot(dx,dz),a=Math.atan2(dx,dz);z.yaw=a;
      var fear=structs.some(function(s){return !s.dead&&s.type==='fire'&&Math.hypot(s.x-z.x,s.z-z.z)<4})||(tool==='torch'&&d<3.5);if(fear)a+=Math.PI*.6;
      if(d>1.2){var hit=moveCirc(z,Math.sin(a)*z.sp*dt,Math.cos(a)*z.sp*dt,z.r,'z');
        if(hit&&hit.box){z.cd-=dt;if(z.cd<=0){z.cd=1;hit.hp-=z.dmg;if(Math.hypot(hit.x-P.x,hit.z-P.z)<20)sfx.play('hit');if(hit.hp<=0){destroyStruct(hit);msg('Un zombie a cassé : '+BUILD[hit.type].n.toLowerCase())}}if(hit.type==='spike')z.hp-=dt*25}}
      else{z.cd-=dt;if(z.cd<=0){z.cd=1.1;hurt(z.dmg)}}
      z.m.position.set(z.x,height(z.x,z.z),z.z);z.m.rotation.y=z.yaw+Math.PI;walk(z,dt,d>1.2);
      if(d>150){z.alive=false;scene.remove(z.m)}
    });
    zombies=zombies.filter(function(z){return z.alive||z.dieT>0});
    animals.forEach(function(a){
      if(!a.alive){if(a.dieT>0){a.dieT-=dt;a.m.rotation.z=Math.min(1.5,(1-a.dieT)*3);if(a.dieT<=0)scene.remove(a.m)}return}
      var d=Math.hypot(P.x-a.x,P.z-a.z);if(d>140)return;
      var sp3=0;
      if(a.kind==='wolf'){
        if(d<16||a.angry>0){a.angry=Math.max(0,(a.angry||0)-dt);a.yaw=Math.atan2(P.x-a.x,P.z-a.z);if(tool==='torch'&&d<5){a.yaw+=Math.PI;sp3=5}else if(d>1.6)sp3=6.2;else{a.cd-=dt;if(a.cd<=0){a.cd=1;hurt(8+day*.5)}}}
        else{a.t-=dt;if(a.t<=0){a.t=2+Math.random()*4;a.yaw+=(Math.random()-.5)*2;a.walk=Math.random()<.6}sp3=a.walk?1.8:0}
      }else{
        if(d<10&&(keys.SH||a.flee>0))a.flee=Math.max(a.flee,4);
        if(a.flee>0){a.flee-=dt;a.yaw=Math.atan2(a.x-P.x,a.z-P.z);sp3=7}else{a.t-=dt;if(a.t<=0){a.t=2+Math.random()*4;a.yaw+=(Math.random()-.5)*2;a.walk=Math.random()<.5}sp3=a.walk?1.3:0}
      }
      if(sp3){var hb=moveCirc(a,Math.sin(a.yaw)*sp3*dt,Math.cos(a.yaw)*sp3*dt,a.r,'a');if(hb)a.yaw+=1}
      a.m.position.set(a.x,height(a.x,a.z),a.z);a.m.rotation.y=a.yaw+Math.PI;walk(a,dt,sp3>0);
    });
    animals=animals.filter(function(a){return a.alive||a.dieT>0});
    if(animals.filter(function(a){return a.kind==='deer'}).length<24&&Math.random()<dt*.05)addAnimal('deer',Math.random);
    bushes.forEach(function(b){if(!b.full){b.t-=dt;if(b.t<=0){b.full=true;b.b.visible=true}}});
    structs.forEach(function(s){if(s.dead||!s.m.userData.light)return;var f=s.m.userData.flame;if(s.type==='fire')f.scale.set(1+Math.sin(now/90)*.1,1+Math.sin(now/70)*.2,1);s.m.userData.light.intensity=(isNight()?2.6:.8)+Math.sin(now/60)*.3});
    // objectifs
    while(goalI<GOALS.length-1&&GOALS[goalI].ok()){goalI++;sfx.play('win');PP.toast('Objectif rempli. Suivant : '+GOALS[goalI].t,'ok')}
    msgT-=dt;if(msgT<0)$('sv-msg2').style.opacity=0;
    saveT-=dt;if(saveT<=0){saveT=20;save()}
    placeGrass();ghostUpdate();prompt();hudBars();
  }
  function walk(e,dt,mv){var p=e.m.userData.parts;e.anim=(e.anim||0)+dt*(mv?(e.kind==='wolf'?13:8):0);var s=Math.sin(e.anim)*.55*(mv?1:0);p.legs.forEach(function(l,i){l.rotation.x=(i%2?s:-s)*(i>1?-1:1)})}

  /* ---------- Rendu ---------- */
  var vm=null;
  function viewModel(){
    while(vscene.children.length>2)vscene.remove(vscene.children[2]);
    var g=new THREE.Group(),skin=lam({color:0xd9a77c}),dark=lam({color:0x252525}),wood=lam({color:0x7a5230}),metal=lam({color:0xb8bcc4});
    var sleeve=[0x56643a,0x6b4a2a,0x6c7078][inv.armure||0];
    var arm=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.3,3,8),lam({color:sleeve}));arm.rotation.x=Math.PI/2.4;arm.position.set(.02,-.1,.18);g.add(arm);
    var hand=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),skin);g.add(hand);
    if(tool==='axe'){var h=new THREE.Mesh(new THREE.CylinderGeometry(.022,.026,.6,6),wood);h.position.set(0,.18,0);g.add(h);var hd=new THREE.Mesh(new THREE.BoxGeometry(.03,.12,.2),inv.iaxe?metal:lam({color:0x8a8a8a}));hd.position.set(0,.42,-.08);g.add(hd);g.rotation.x=-.3}
    else if(tool==='pick'){var h2=new THREE.Mesh(new THREE.CylinderGeometry(.022,.026,.6,6),wood);h2.position.set(0,.18,0);g.add(h2);var pk=new THREE.Mesh(new THREE.BoxGeometry(.03,.05,.42),lam({color:0x8a8a8a}));pk.position.set(0,.45,0);pk.rotation.x=.15;g.add(pk)}
    else if(tool==='sword'){var bl=new THREE.Mesh(new THREE.BoxGeometry(.03,.75,.06),metal);bl.position.set(0,.45,0);g.add(bl);var gd=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.22),dark);gd.position.set(0,.07,0);g.add(gd)}
    else if(tool==='torch'){var th=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.5,6),wood);th.position.set(0,.15,0);g.add(th);var fl=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,8),new THREE.MeshBasicMaterial({color:0xffa030}));fl.position.set(0,.48,0);g.add(fl);g.userData.flame=fl}
    else if(tool==='bow'){var bw=new THREE.Mesh(new THREE.TorusGeometry(.32,.015,6,24,Math.PI),wood);bw.rotation.z=Math.PI/2;bw.position.set(0,.05,-.1);g.add(bw);var str=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.64,4),lam({color:0xeeeeee}));str.position.set(0,.05,-.1);g.add(str)}
    else{var len=tool==='rifle'?.7:.28,b=new THREE.Mesh(new THREE.BoxGeometry(.06,.09,len),dark);b.position.set(0,.06,-len/2+.05);g.add(b);var gr=new THREE.Mesh(new THREE.BoxGeometry(.05,.13,.06),wood);gr.position.set(0,-.03,.03);g.add(gr);if(tool==='rifle'){var stk=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.22),wood);stk.position.set(0,.03,.2);g.add(stk)}
      var mf=new THREE.Mesh(new THREE.PlaneGeometry(.18,.18),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0,depthWrite:false}));mf.position.set(0,.07,-len+.02);g.add(mf);g.userData.fl=mf}
    g.scale.setScalar(.7);vm=g;vscene.add(g);
  }
  function render(){
    if(!R3||!P)return;
    cam.position.set(P.x,P.y+EYE+Math.sin(P.bob)*.04,P.z);cam.rotation.set(P.pitch,P.yaw,0);
    R3.clear();R3.render(scene,cam);
    if(vm&&!buildMode){
      var sw=swing>0?Math.sin(swing*Math.PI):0;
      vm.position.set(.26+Math.cos(P.bob*.5)*.01,-.3+Math.abs(Math.sin(P.bob*.5))*.012,-.45);
      if(TOOLS[tool].melee){vm.rotation.set(-.3-sw*1.4,sw*.4,-sw*.3)}else{vm.rotation.set(flash*.25-(tool==='bow'?sw*.2:0),0,tool==='bow'?.2:0);if(vm.userData.fl)vm.userData.fl.material.opacity=flash}
      if(vm.userData.flame)vm.userData.flame.scale.y=1+Math.sin(performance.now()/60)*.2;
      R3.clearDepth();R3.render(vscene,vcam);
    }
    drawMap();
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){if(!paused)step(dt);if(running)render();raf=requestAnimationFrame(loop)}}

  /* ---------- Interface ---------- */
  function hudBars(){
    [['hp',P.hp],['food',P.food],['water',P.water],['stam',P.stam]].forEach(function(b){var el=$('sv-'+b[0]);el.style.width=Math.max(0,b[1])+'%';el.parentNode.parentNode.classList.toggle('low',b[1]<25)});
    var hrs=dayT*24,hh=Math.floor(hrs),mm=Math.floor((hrs-hh)*6)*10;
    $('sv-clock').innerHTML='JOUR '+day+' · '+('0'+hh).slice(-2)+':'+('0'+mm).slice(-2)+(isNight()?(bloodNight()?' · <b class="blood">NUIT DE SANG</b>':' · <b>NUIT</b>'):'')+(rescueT>0?' · secours dans '+rescueT+' j':'');
    $('sv-goal').innerHTML='<small>OBJECTIF '+(goalI+1)+' / '+GOALS.length+'</small>'+esc(GOALS[goalI].t);
    $('sv-l1').innerHTML='Jour <b>'+day+'</b>';
  }
  function hudInv(){
    var ks=['bois','pierre','fer','baies','viande','cuite','conserve','eau','bandage','tissu','cuir','munitions','fleches','radio'];
    $('sv-inv').innerHTML=ks.filter(function(k){return inv[k]>0}).map(function(k){return '<span><b>'+inv[k]+'</b> '+esc(NAMES[k].toLowerCase())+'</span>'}).join('')+(inv.armure?'<span class="arm">'+(inv.armure>1?'armure en fer':'armure en cuir')+'</span>':'');
    $('sv-bar').innerHTML=TORDER.map(function(t,i){var own=t==='axe'||inv[t];if(!own)return '';var T=TOOLS[t];return '<span class="'+(tool===t&&!buildMode?'on':'')+'"><i>'+(i+1)+'</i>'+(t==='axe'&&inv.iaxe?'Hache en fer':T.n)+(T.ammo?' · '+inv[T.ammo]:'')+'</span>'}).join('')+'<span class="'+(buildMode?'on':'')+'"><i>B</i>Construire</span><span><i>C</i>Fabriquer</span>';
    $('sv-best').textContent=PP.store('sv-best');
  }
  function buildMenu(){
    var el=$('sv-build');$('sv-craft').hidden=true;
    if(el.hidden){el.innerHTML='<b>Construire</b>'+Object.keys(BUILD).map(function(k,i){var B=BUILD[k],ok=canPay(B.cost);return '<button type="button" class="'+(ok?'':'no')+(buildMode===k?' on':'')+'" data-b="'+k+'"><i>'+(i+1)+'</i>'+esc(B.n)+'<small>'+costTxt(B.cost)+(B.d?' · '+esc(B.d):'')+'</small></button>'}).join('')+'<small class="hint">Chiffre ou clic pour choisir, puis clic dans le monde pour poser. R tourne. B ferme.</small>';el.hidden=false;unlock()}
    else{el.hidden=true;buildMode=null;lock()}
  }
  $('sv-build').addEventListener('click',function(e){var b=e.target.closest('[data-b]');if(b){buildMode=b.dataset.b;$('sv-build').hidden=true;lock()}});
  var mapBase=null;
  function drawMap(){
    var c=$('sv-map'),g=c.getContext('2d'),sz=c.width;
    if(!mapBase||mapBase.seed!==SEED){mapBase=document.createElement('canvas');mapBase.width=mapBase.height=200;mapBase.seed=SEED;var mg=mapBase.getContext('2d'),im=mg.createImageData(200,200);for(var j=0;j<200;j++)for(var i=0;i<200;i++){var x=(i/200-.5)*SIZE,z=(j/200-.5)*SIZE,h=height(x,z),o=(j*200+i)*4,sh=(height(x+2,z+2)-h)*6,col=h<0?[42,111,147]:h<.8?[216,201,154]:h<20?[79,125,44]:h<36?[119,115,107]:[242,244,247];im.data[o]=Math.max(0,Math.min(255,col[0]-sh));im.data[o+1]=Math.max(0,Math.min(255,col[1]-sh));im.data[o+2]=Math.max(0,Math.min(255,col[2]-sh));im.data[o+3]=255}mg.putImageData(im,0,0)}
    var big=c.classList.contains('big'),range=big?SIZE:130,sc=sz/range,cx=big?0:P.x,cz=big?0:P.z;
    g.save();g.fillStyle='#2a6f93';g.fillRect(0,0,sz,sz);g.translate(sz/2,sz/2);
    g.drawImage(mapBase,(-HALF-cx)*sc,(-HALF-cz)*sc,SIZE*sc,SIZE*sc);
    chests.forEach(function(ch){if(!ch.open&&(Math.hypot(ch.x-P.x,ch.z-P.z)<(big?60:45))){g.fillStyle=ch.rare?'#d4a32a':'#8a5f33';g.fillRect((ch.x-cx)*sc-2.5,(ch.z-cz)*sc-2.5,5,5)}});
    if(big)ores.userData.list.forEach(function(o){if(o.hp>0&&Math.hypot(o.x-P.x,o.z-P.z)<90){g.fillStyle='#e0a070';g.fillRect((o.x-cx)*sc-1.5,(o.z-cz)*sc-1.5,3,3)}});
    structs.forEach(function(s){if(!s.dead){g.fillStyle=s.type==='fire'||s.type==='forge'?'#ff9a2a':s.type==='bed'?'#f1ece2':'#5a3d22';g.fillRect((s.x-cx)*sc-1.5,(s.z-cz)*sc-1.5,3,3)}});
    zombies.forEach(function(z){if(z.alive&&Math.hypot(z.x-P.x,z.z-P.z)<40){g.fillStyle='#e2361b';g.beginPath();g.arc((z.x-cx)*sc,(z.z-cz)*sc,2.5,0,7);g.fill()}});
    animals.forEach(function(a){if(a.alive&&a.kind==='wolf'&&Math.hypot(a.x-P.x,a.z-P.z)<30){g.fillStyle='#bbb';g.beginPath();g.arc((a.x-cx)*sc,(a.z-cz)*sc,2.2,0,7);g.fill()}});
    if(P.spawn){g.strokeStyle='#fff';g.lineWidth=1.5;g.strokeRect((P.spawn.x-cx)*sc-3,(P.spawn.z-cz)*sc-3,6,6)}
    g.translate((P.x-cx)*sc,(P.z-cz)*sc);g.rotate(-P.yaw);g.fillStyle='#fff';g.strokeStyle='#141210';g.beginPath();g.moveTo(0,-7);g.lineTo(5,5);g.lineTo(0,2);g.lineTo(-5,5);g.closePath();g.fill();g.stroke();
    g.restore();
  }

  /* ---------- Plein écran ---------- */
  function goFull(){var r=stage.requestFullscreen||stage.webkitRequestFullscreen;if(!r)return PP.toast('Le plein écran n\'est pas possible ici','warn');if(isFull())return exitFull();try{var p=r.call(stage);if(p&&p.then)p.then(function(){lock()}).catch(function(){})}catch(e){}}
  function exitFull(){if(isFull()){var x=document.exitFullscreen||document.webkitExitFullscreen;if(x)try{x.call(document)}catch(e){}}}

  /* ---------- Entrées ---------- */
  var KM={z:'F',w:'F',ArrowUp:'F',s:'B',ArrowDown:'B',q:'L',a:'L',ArrowLeft:'L',d:'R',ArrowRight:'R'};
  function menusOpen(){return !$('sv-build').hidden||!$('sv-craft').hidden}
  document.addEventListener('keydown',function(e){
    if(PP.cur()!=='surv'||!running)return;if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;
    var k=e.key.length===1?e.key.toLowerCase():e.key;
    if(KM[k]){keys[KM[k]]=true;e.preventDefault()}if(k==='Shift')keys.SH=true;if(k===' '){keys.J=true;e.preventDefault()}
    if(e.repeat)return;
    if(k==='e')interact();if(k==='f')eat();if(k==='h')heal();
    if(k==='b')buildMenu();if(k==='c')craftMenu();if(k==='p')goFull();
    if(k==='r'&&buildMode)ghostRot=(ghostRot+1)%4;
    if(k==='m')$('sv-map').classList.toggle('big');
    if(k>='0'&&k<='9'){var n=k==='0'?10:+k;
      if(!$('sv-build').hidden){var bk=Object.keys(BUILD)[n-1];if(bk){buildMode=bk;$('sv-build').hidden=true;lock()}}
      else if(!$('sv-craft').hidden)craft(n-1);
      else if(TORDER[n-1])setTool(TORDER[n-1])}
    if(k==='Escape'){buildMode=null;$('sv-build').hidden=true;$('sv-craft').hidden=true}
    hudInv();
  });
  document.addEventListener('keyup',function(e){var k=e.key.length===1?e.key.toLowerCase():e.key;if(KM[k])keys[KM[k]]=false;if(k==='Shift')keys.SH=false});
  window.addEventListener('blur',function(){keys={};mouseDown=false});
  cv.addEventListener('mousedown',function(e){
    if(!running)return;if(document.pointerLockElement!==cv){if(menusOpen()){$('sv-build').hidden=true;$('sv-craft').hidden=true}lock();paused=false;$('sv-lockhint').hidden=true;return}
    if(e.button===0){if(buildMode&&ghost){build(buildMode,ghost.userData.x,ghost.userData.z,ghostRot);return}mouseDown=true;attack()}
    if(e.button===2){var t=interactTarget();if(t&&t.k==='box'&&t.o.store){Object.keys(t.o.store).forEach(function(k){inv[k]=(inv[k]||0)+t.o.store[k]});msg('Ressources reprises');t.o.store={};hudInv()}else if(buildMode){buildMode=null}}
  });
  document.addEventListener('mouseup',function(e){if(e.button===0)mouseDown=false});
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  cv.addEventListener('wheel',function(e){if(!running||buildMode)return;e.preventDefault();var own=TORDER.filter(function(t){return t==='axe'||inv[t]}),i=own.indexOf(tool);setTool(own[(i+(e.deltaY>0?1:-1)+own.length)%own.length])},{passive:false});
  document.addEventListener('mousemove',function(e){if(document.pointerLockElement!==cv||!P)return;P.yaw-=e.movementX*.0025;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-e.movementY*.0025))});
  document.addEventListener('pointerlockchange',function(){if(PP.cur()!=='surv'||!running)return;var l=document.pointerLockElement===cv;$('sv-lockhint').hidden=l||menusOpen();if(!l&&!menusOpen()){paused=true;save()}else paused=false});
  function lock(){if(cv.requestPointerLock&&matchMedia('(hover:hover)').matches)try{var r=cv.requestPointerLock();if(r&&r.catch)r.catch(function(){})}catch(e){}}
  function unlock(){if(document.pointerLockElement===cv&&document.exitPointerLock)document.exitPointerLock()}
  var tl=null;
  cv.addEventListener('touchstart',function(e){var t=e.touches[0];tl={x:t.clientX,y:t.clientY}},{passive:true});
  cv.addEventListener('touchmove',function(e){if(!tl||!P)return;var t=e.touches[0];P.yaw-=(t.clientX-tl.x)*.006;P.pitch=Math.max(-1.4,Math.min(1.4,P.pitch-(t.clientY-tl.y)*.006));tl={x:t.clientX,y:t.clientY};e.preventDefault()},{passive:false});
  PP.held('sv-pad',{},function(k){if(k==='A'){mouseDown=true;attack()}if(k==='E')interact();if(k==='F2')eat();if(k==='F'||k==='B'||k==='L'||k==='R')keys[k]=true},function(k){if(k==='A')mouseDown=false;if(k==='F'||k==='B'||k==='L'||k==='R')keys[k]=false});

  function start(fresh){
    if(!init())return;
    if(fresh||!hasSave())newGame();else load();
    viewModel();hudInv();$('sv-ov').hidden=true;$('sv-build').hidden=true;$('sv-craft').hidden=true;buildMode=null;running=true;paused=false;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);lock();sfx.play('go');
  }
  $('sv-start').addEventListener('click',function(){if(hasSave()&&!confirm('Recommencer une nouvelle île ? Ta partie en cours sera effacée.'))return;start(true)});
  $('sv-cont').addEventListener('click',function(){start(false)});
  PP._sv=function(){return {P:P,inv:inv,st:st,zombies:zombies,animals:animals,structs:structs,chests:chests,setT:function(t){dayT=t},attack:attack,interact:interact,build:build,setTool:setTool,craft:craft,goal:function(){return goalI},render:render}};
  PP.games.surv={
    open:function(){$('sv-lockhint').hidden=true;var s=hasSave();$('sv-cont').hidden=!s;$('sv-start').textContent=s?'Nouvelle île':'Commencer';$('sv-title').textContent='Survie';
      $('sv-msg').textContent='Une grande île sauvage. Récolte, chasse, fabrique tes outils, construis ta base, mine le fer et trouve les pièces d\'une radio pour appeler les secours. La nuit, les zombies sortent. 14 objectifs à remplir.';$('sv-ov').hidden=false;$('sv-best').textContent=PP.store('sv-best')},
    close:function(){if(running){save();running=false;cancelAnimationFrame(raf)}unlock();exitFull();keys={};mouseDown=false}
  };
})();
