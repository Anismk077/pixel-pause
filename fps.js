/* Pixel Pause — Bunker 3D (three.js)
   Modes : Zombies (solo, vagues) et Battle royale (solo contre des bots, ou en ligne façon serveur :
   les bots complètent la partie, les joueurs qui arrivent prennent part à la manche, un joueur AFK est joué par un bot).
   4 armes, recharge, visée, munitions, soins, pièces, skins, 3 cartes, mini-carte, chat en ligne. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,net=PP.net,mp=PP.mp,cv=$('fps-cv');
  var S=4,WH=4,EYE=1.65,W=0,H=0,G=null,OPEN=[];

  /* ---------- Données ---------- */
  var GUNS={
    pistol :{n:'Pistolet',dmg:26,rate:.26,mag:12,res:Infinity,spread:.012,auto:false,rel:1.1,pel:1,zoom:55,kick:.035},
    rifle  :{n:'Fusil d\'assaut',dmg:21,rate:.1,mag:30,res:90,spread:.03,auto:true,rel:1.7,pel:1,zoom:48,kick:.02},
    shotgun:{n:'Fusil à pompe',dmg:15,rate:.8,mag:6,res:24,spread:.085,auto:false,rel:2.2,pel:8,zoom:58,kick:.09},
    sniper :{n:'Sniper',dmg:120,rate:1.15,mag:5,res:15,spread:.07,auto:false,rel:2.4,pel:1,zoom:18,kick:.12}
  },ORDER=['pistol','rifle','shotgun','sniper'];
  var ZT={
    walker :{n:'Rôdeur',hp:60,sp:2.3,dmg:12,col:0x6f8f4e,sc:1},
    runner :{n:'Coureur',hp:35,sp:4.6,dmg:8,col:0xa0563c,sc:.9},
    tank   :{n:'Mastodonte',hp:340,sp:1.5,dmg:30,col:0x3f5a36,sc:1.55},
    spitter:{n:'Cracheur',hp:55,sp:2,dmg:10,col:0x7a4fa0,sc:1}
  };
  var CH_SKINS=[{n:'Commando',c:0x56643a,p:0},{n:'Urbain',c:0x3a3f4a,p:0},{n:'Désert',c:0xb89a6a,p:30},{n:'Neige',c:0xe6ebf0,p:60},{n:'Néon',c:0xe2361b,p:120},{n:'Or',c:0xd4a32a,p:250}];
  var GUN_SKINS=[{n:'Acier',c:0x2b2b30,p:0},{n:'Sable',c:0x9c8659,p:0},{n:'Camo',c:0x4f5d33,p:40},{n:'Rouge',c:0xc22d16,p:80},{n:'Glace',c:0x9fd0e6,p:120},{n:'Or',c:0xd4a32a,p:200}];
  var MAPS={bunker:'Bunker',entrepot:'Entrepôt',village:'Village'};
  var skins=(function(){try{var s=JSON.parse(localStorage.getItem(PP.key('fps-skins')));if(s&&s.owned)return s}catch(e){}return {owned:['c0','c1','g0','g1'],ch:0,gun:0}})();
  function saveSkins(){try{localStorage.setItem(PP.key('fps-skins'),JSON.stringify(skins))}catch(e){}}
  function coins(v){if(v===undefined)return PP.store('fps-coins');PP.store('fps-coins',v)}

  /* ---------- Cartes ---------- */
  function rng(seed){return function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
  function genMap(style,seed){
    var R=rng(seed||1),g=[],w,h,x,y;
    function fill(c){g=[];for(y=0;y<h;y++){g.push([]);for(x=0;x<w;x++)g[y].push(c)}}
    function rect(x0,y0,x1,y1,c){for(var yy=y0;yy<=y1;yy++)for(var xx=x0;xx<=x1;xx++)if(g[yy]&&g[yy][xx]!==undefined)g[yy][xx]=c}
    if(style==='bunker'){
      w=h=27;fill('#');var rooms=[];
      for(var ry=0;ry<3;ry++)for(var rx=0;rx<3;rx++){var rw=4+Math.floor(R()*3),rh=4+Math.floor(R()*3),ox=1+rx*9+Math.floor(R()*(8-rw)),oy=1+ry*9+Math.floor(R()*(8-rh));rect(ox,oy,ox+rw-1,oy+rh-1,'.');rooms.push({cx:ox+(rw>>1),cy:oy+(rh>>1),x:ox,y:oy,w:rw,h:rh})}
      function cor(a,b){var x0=a.cx,y0=a.cy;while(x0!==b.cx){rect(x0,y0,x0,y0+1,'.');x0+=x0<b.cx?1:-1}while(y0!==b.cy){rect(x0,y0,x0+1,y0,'.');y0+=y0<b.cy?1:-1}}
      for(var i=0;i<9;i++){if(i%3<2)cor(rooms[i],rooms[i+1]);if(i<6)cor(rooms[i],rooms[i+3])}
      cor(rooms[0],rooms[4]);cor(rooms[8],rooms[4]);
      rooms.forEach(function(r){if(R()<.7){var cx=r.x+1+Math.floor(R()*(r.w-2)),cy=r.y+1+Math.floor(R()*(r.h-2));if(cx!==r.cx&&cy!==r.cy)g[cy][cx]='c'}});
    }else if(style==='entrepot'){
      w=h=28;fill('.');rect(0,0,w-1,0,'#');rect(0,h-1,w-1,h-1,'#');rect(0,0,0,h-1,'#');rect(w-1,0,w-1,h-1,'#');
      for(var sy=4;sy<h-3;sy+=5)for(var sx=3;sx<w-3;sx++){if((sx-3)%8<5)g[sy][sx]='c'}
      for(var k=0;k<18;k++){var px=2+Math.floor(R()*(w-4)),py=2+Math.floor(R()*(h-4));if(g[py][px]==='.'&&g[py-1][px]!=='c'&&g[py+1][px]!=='c')g[py][px]=R()<.25?'#':'c'}
    }else{
      w=h=36;fill('.');rect(0,0,w-1,0,'#');rect(0,h-1,w-1,h-1,'#');rect(0,0,0,h-1,'#');rect(w-1,0,w-1,h-1,'#');
      var houses=[];
      for(var t=0;t<60&&houses.length<9;t++){
        var hw=4+Math.floor(R()*3),hh=4+Math.floor(R()*3),hx=2+Math.floor(R()*(w-hw-4)),hy=2+Math.floor(R()*(h-hh-4));
        if(houses.some(function(o){return hx<o.x+o.w+2&&hx+hw+2>o.x&&hy<o.y+o.h+2&&hy+hh+2>o.y}))continue;
        houses.push({x:hx,y:hy,w:hw,h:hh});
        rect(hx,hy,hx+hw-1,hy,'#');rect(hx,hy+hh-1,hx+hw-1,hy+hh-1,'#');rect(hx,hy,hx,hy+hh-1,'#');rect(hx+hw-1,hy,hx+hw-1,hy+hh-1,'#');
        g[hy+hh-1][hx+(hw>>1)]='.';g[hy+(hh>>1)][R()<.5?hx:hx+hw-1]='.';
        if(R()<.6)g[hy+1][hx+1]='c';
      }
      for(var tr=0;tr<45;tr++){var tx=1+Math.floor(R()*(w-2)),ty=1+Math.floor(R()*(h-2));if(g[ty][tx]==='.'&&!houses.some(function(o){return tx>=o.x-1&&tx<=o.x+o.w&&ty>=o.y-1&&ty<=o.y+o.h}))g[ty][tx]='t'}
      for(var cr=0;cr<10;cr++){var qx=2+Math.floor(R()*(w-4)),qy=2+Math.floor(R()*(h-4));if(g[qy][qx]==='.')g[qy][qx]='c'}
    }
    // garde seulement la zone accessible
    var start=null;for(y=1;y<h-1&&!start;y++)for(x=1;x<w-1;x++)if(g[y][x]==='.'){start=[x,y];break}
    var seen={},q=[start];seen[start]=1;
    while(q.length){var c=q.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var nx=c[0]+d[0],ny=c[1]+d[1];if(g[ny]&&g[ny][nx]==='.'&&!seen[nx+','+ny]){seen[nx+','+ny]=1;q.push([nx,ny])}})}
    var open=[];for(y=0;y<h;y++)for(x=0;x<w;x++)if(g[y][x]==='.'){if(seen[x+','+y])open.push([x,y]);else g[y][x]='#'}
    return {w:w,h:h,g:g,open:open,style:style};
  }
  function cellAt(x,z){var r=G[Math.floor(z/S)];return r?(r[Math.floor(x/S)]||'#'):'#'}
  function solid(x,z){return cellAt(x,z)!=='.'}
  function freeAt(x,z,r){return !(solid(x-r,z-r)||solid(x+r,z-r)||solid(x-r,z+r)||solid(x+r,z+r))}
  function moveEnt(e,dx,dz,r){if(freeAt(e.x+dx,e.z,r))e.x+=dx;if(freeAt(e.x,e.z+dz,r))e.z+=dz}
  function los(ax,az,bx,bz){var d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.5);for(var i=1;i<n;i++){var t=i/n,c=cellAt(ax+(bx-ax)*t,az+(bz-az)*t);if(c==='#'||c==='t')return false}return true}
  function cellC(c){return {x:(c[0]+.5)*S,z:(c[1]+.5)*S}}
  /* champ de distances (BFS) vers une case, pour que zombies et bots trouvent leur chemin */
  var fields={};
  function field(x,z){
    var cx=Math.floor(x/S),cz=Math.floor(z/S),k=cx+','+cz,f=fields[k],now=performance.now();
    if(f&&now-f.t<600)return f.d;
    var d=new Int16Array(W*H).fill(-1),q=[cx+cz*W],h=0;if(G[cz]&&G[cz][cx]==='.')d[q[0]]=0;else return d;
    while(h<q.length){var i=q[h++],ix=i%W,iz=(i/W)|0,v=d[i]+1;
      if(ix>0&&G[iz][ix-1]==='.'&&d[i-1]<0){d[i-1]=v;q.push(i-1)}
      if(ix<W-1&&G[iz][ix+1]==='.'&&d[i+1]<0){d[i+1]=v;q.push(i+1)}
      if(iz>0&&G[iz-1][ix]==='.'&&d[i-W]<0){d[i-W]=v;q.push(i-W)}
      if(iz<H-1&&G[iz+1][ix]==='.'&&d[i+W]<0){d[i+W]=v;q.push(i+W)}}
    fields[k]={t:now,d:d};var ks=Object.keys(fields);if(ks.length>40)delete fields[ks[0]];
    return d;
  }
  function pathDir(e,tx,tz){
    if(los(e.x,e.z,tx,tz)&&Math.hypot(tx-e.x,tz-e.z)<S*3)return Math.atan2(tx-e.x,tz-e.z);
    var d=field(tx,tz),cx=Math.floor(e.x/S),cz=Math.floor(e.z/S),best=null,bv=d[cx+cz*W];if(bv<0)bv=1e4;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){var nx=cx+o[0],nz=cz+o[1];if(nx<0||nz<0||nx>=W||nz>=H)return;var v=d[nx+nz*W];if(v>=0&&v<bv){bv=v;best=[nx,nz]}});
    if(!best)return Math.atan2(tx-e.x,tz-e.z);
    return Math.atan2((best[0]+.5)*S-e.x,(best[1]+.5)*S-e.z);
  }

  /* ---------- Rendu ---------- */
  var R3=null,scene,cam,vscene,vcam,world,ray=new THREE.Raycaster(),solidMeshes=[],targets=[],viewGun=null,muzzle,muzzleL;
  function tex(w,h,fn,rep){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(rep)t.repeat.set(rep[0],rep[1]);return t}
  function noise(g,w,h,base,amt,n){g.fillStyle=base;g.fillRect(0,0,w,h);for(var i=0;i<n;i++){var v=Math.random()*amt|0;g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+(v/255)+')';g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3)}}
  var TX={};
  function textures(){
    if(TX.ok)return;TX.ok=1;
    TX.concrete=tex(256,256,function(g,w,h){noise(g,w,h,'#7d7b76',40,2600);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=3;g.strokeRect(2,2,w-4,h/2-4);g.strokeRect(2,h/2,w-4,h/2-4);for(var i=0;i<w;i+=32){g.fillStyle=(i/32)%2?'#1b1a18':'#d8a520';g.beginPath();g.moveTo(i,h-26);g.lineTo(i+32,h-26);g.lineTo(i+16,h);g.lineTo(i-16,h);g.fill()}});
    TX.bfloor=tex(256,256,function(g,w,h){noise(g,w,h,'#3b3a37',30,2200);g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=2;for(var i=0;i<=w;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke()}});
    TX.metal=tex(256,256,function(g,w,h){g.fillStyle='#55697a';g.fillRect(0,0,w,h);for(var i=0;i<w;i+=16){g.fillStyle=i%32?'#4a5d6d':'#61778a';g.fillRect(i,0,8,h)}noise(g,w,h,'rgba(0,0,0,0)',30,900);g.fillStyle='#c94a1c';g.fillRect(0,h-20,w,20)});
    TX.wfloor=tex(256,256,function(g,w,h){noise(g,w,h,'#8f8c84',22,1800);g.fillStyle='#d8a520';g.fillRect(0,124,w,8)});
    TX.brick=tex(256,256,function(g,w,h){g.fillStyle='#d9cfc0';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=24)for(var x=-(y/24%2)*24;x<w;x+=48){g.fillStyle=['#8e3b26','#a3472d','#7d3320','#9a4a33'][Math.random()*4|0];g.fillRect(x+2,y+2,44,20)}noise(g,w,h,'rgba(0,0,0,0)',30,1200)});
    TX.grass=tex(256,256,function(g,w,h){noise(g,w,h,'#4f7a32',45,5200);for(var i=0;i<400;i++){g.fillStyle='rgba(30,60,15,.5)';g.fillRect(Math.random()*w,Math.random()*h,1,4)}});
    TX.crate=tex(128,128,function(g,w,h){g.fillStyle='#8a5f33';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=16){g.fillStyle=y%32?'#7a522a':'#946839';g.fillRect(0,y,w,14)}g.strokeStyle='#4c3218';g.lineWidth=10;g.strokeRect(5,5,w-10,h-10);g.beginPath();g.moveTo(8,8);g.lineTo(w-8,h-8);g.stroke()});
    TX.ceil=tex(256,256,function(g,w,h){noise(g,w,h,'#2a2a2c',20,1500);g.fillStyle='#fff6d8';g.fillRect(w/2-40,h/2-6,80,12)});
    TX.med=tex(64,64,function(g,w,h){g.fillStyle='#f2efe6';g.fillRect(0,0,w,h);g.fillStyle='#e2361b';g.fillRect(24,10,16,44);g.fillRect(10,24,44,16)});
    TX.ammo=tex(64,64,function(g,w,h){g.fillStyle='#3f5a2c';g.fillRect(0,0,w,h);g.fillStyle='#d8a520';for(var i=0;i<4;i++)g.fillRect(10+i*12,14,7,30);g.fillStyle='#141210';g.fillRect(0,50,w,14)});
  }
  function init(){
    if(R3)return true;
    if(!window.THREE){PP.toast('La 3D (three.js) n\'a pas pu se charger','warn');return false}
    R3=new THREE.WebGLRenderer({canvas:cv,antialias:true});R3.setSize(cv.width,cv.height,false);R3.autoClear=false;
    cam=new THREE.PerspectiveCamera(75,cv.width/cv.height,.05,400);cam.rotation.order='YXZ';
    vscene=new THREE.Scene();vcam=new THREE.PerspectiveCamera(60,cv.width/cv.height,.01,10);
    vscene.add(new THREE.HemisphereLight(0xffffff,0x666666,1.4));var vl=new THREE.DirectionalLight(0xffffff,1.3);vl.position.set(1,2,1);vscene.add(vl);var vl2=new THREE.DirectionalLight(0xbfd4ff,.6);vl2.position.set(-1,.5,-1);vscene.add(vl2);
    muzzleL=new THREE.PointLight(0xffc060,0,12);
    textures();buildUI();
    return true;
  }
  function lam(o){return new THREE.MeshLambertMaterial(o)}
  function buildWorld(style,seed){
    var M=genMap(style,seed);G=M.g;W=M.w;H=M.h;OPEN=M.open;fields={};
    scene=new THREE.Scene();solidMeshes=[];
    var sky=style==='village'?0x9cc4e4:style==='entrepot'?0x2a2c30:0x121212;
    scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,style==='village'?40:18,style==='village'?120:60);
    scene.add(new THREE.HemisphereLight(style==='village'?0xdfefff:0xbfc4d0,style==='village'?0x4a5a30:0x303030,style==='village'?1.1:.9));
    var sun=new THREE.DirectionalLight(0xffffff,style==='village'?1.1:.5);sun.position.set(30,60,20);scene.add(sun);
    scene.add(muzzleL);
    var wallT=style==='bunker'?TX.concrete:style==='entrepot'?TX.metal:TX.brick,floorT=style==='bunker'?TX.bfloor:style==='entrepot'?TX.wfloor:TX.grass;
    var walls=[],crates=[],trees=[];
    for(var z=0;z<H;z++)for(var x=0;x<W;x++){var c=G[z][x];if(c==='#')walls.push([x,z]);else if(c==='c')crates.push([x,z]);else if(c==='t')trees.push([x,z])}
    var m4=new THREE.Matrix4();
    function inst(geo,mat,list,y,yoff){var im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach(function(p,i){m4.makeTranslation((p[0]+.5)*S,y,(p[1]+.5)*S);if(yoff)m4.multiply(new THREE.Matrix4().makeRotationY(yoff(i)));im.setMatrixAt(i,m4)});scene.add(im);solidMeshes.push(im);return im}
    if(walls.length)inst(new THREE.BoxGeometry(S,WH,S),lam({map:wallT}),walls,WH/2);
    if(crates.length)inst(new THREE.BoxGeometry(S*.8,1.7,S*.8),lam({map:TX.crate}),crates,.85,function(i){return (i%4)*.2});
    if(trees.length){inst(new THREE.CylinderGeometry(.35,.45,3,8),lam({color:0x5b3b22}),trees,1.5);inst(new THREE.ConeGeometry(2,5,9),lam({color:0x2f5a2a}),trees,5);inst(new THREE.ConeGeometry(1.5,3.5,9),lam({color:0x3b6e32}),trees,7)}
    var ft=floorT.clone();ft.needsUpdate=true;ft.repeat.set(W/(style==='village'?2:1),H/(style==='village'?2:1));
    var floor=new THREE.Mesh(new THREE.PlaneGeometry(W*S,H*S),lam({map:ft}));floor.rotation.x=-Math.PI/2;floor.position.set(W*S/2,0,H*S/2);scene.add(floor);solidMeshes.push(floor);
    if(style!=='village'){var ct=TX.ceil.clone();ct.needsUpdate=true;ct.repeat.set(W/2,H/2);var ceil=new THREE.Mesh(new THREE.PlaneGeometry(W*S,H*S),lam({map:ct,emissive:0x111111}));ceil.rotation.x=Math.PI/2;ceil.position.set(W*S/2,WH,H*S/2);scene.add(ceil)}
    else{var hill=new THREE.Mesh(new THREE.PlaneGeometry(600,600),lam({color:0x5d8a3a}));hill.rotation.x=-Math.PI/2;hill.position.set(W*S/2,-.02,H*S/2);scene.add(hill)}
    world={style:style,seed:seed};drawMiniBase();
  }

  /* ---------- Modèles ---------- */
  function box(w,h,d,col,map){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam(map?{map:map}:{color:col}))}
  function human(body,skin,opts){
    opts=opts||{};var g=new THREE.Group(),sc=opts.sc||1;
    var legs=[box(.26,.85,.28,0x2c2a26),box(.26,.85,.28,0x2c2a26)];legs.forEach(function(l,i){l.geometry.translate(0,-.42,0);l.position.set(i?.16:-.16,.9,0);g.add(l)});
    var torso=box(.62,.75,.36,body);torso.position.y=1.3;g.add(torso);
    var head=box(.4,.4,.4,skin);head.position.y=1.9;head.userData.head=true;g.add(head);
    if(opts.helmet){var hm=box(.46,.16,.46,body);hm.position.y=2.12;g.add(hm)}
    var arms=[box(.2,.7,.22,body),box(.2,.7,.22,body)];arms.forEach(function(a,i){a.geometry.translate(0,-.33,0);a.position.set(i?.42:-.42,1.62,0);g.add(a)});
    if(opts.zombie){arms[0].rotation.x=arms[1].rotation.x=-Math.PI/2.3}
    if(opts.gun){var gun=box(.1,.14,.7,0x1c1c1e);gun.position.set(.42,1.25,-.38);g.add(gun);arms[1].rotation.x=-1.3;arms[0].rotation.x=-1.1;arms[0].rotation.z=-.5}
    if(opts.eyes){var e1=new THREE.Mesh(new THREE.BoxGeometry(.08,.06,.02),new THREE.MeshBasicMaterial({color:opts.eyes}));e1.position.set(-.09,1.95,-.21);var e2=e1.clone();e2.position.x=.09;g.add(e1);g.add(e2)}
    g.scale.setScalar(sc);g.userData.parts={legs:legs,arms:arms,head:head,torso:torso};
    return g;
  }
  /* ---------- Zombies : modèle et animations ---------- */
  function zombieModel(type){
    var T={walker:{shirt:0x5a6a4a,skin:0x8fa877,pants:0x3a3a48,sc:1},runner:{shirt:0x7a3a30,skin:0xa0b088,pants:0x2f2f3a,sc:.92},tank:{shirt:0x3a4030,skin:0x6f8a5a,pants:0x2a2a30,sc:1.55},spitter:{shirt:0x5a3a6a,skin:0x9a9ab0,pants:0x33303a,sc:1}}[type]||{shirt:0x5a6a4a,skin:0x8fa877,pants:0x3a3a48,sc:1};
    var shc=new THREE.Color(T.shirt);shc.offsetHSL((Math.random()-.5)*.06,(Math.random()-.5)*.15,(Math.random()-.5)*.1);var sh=shc.getHex();
    var g=new THREE.Group(),root=new THREE.Group();g.add(root);
    var L=function(c){return new THREE.MeshLambertMaterial({color:c})},shirt=L(sh),skin=L(T.skin),pants=L(T.pants),dark=L(0x1a1412),blood=L(0x5a1010);
    function mesh(geo,mat,x,y,z,par){var m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(par||root).add(m);return m}
    var legs=[-.14,.14].map(function(x){var l=new THREE.Group();l.position.set(x,.95,0);root.add(l);mesh(new THREE.CapsuleGeometry(.11,.38,3,8),pants,0,-.25,0,l);mesh(new THREE.CapsuleGeometry(.09,.32,3,8),x<0?pants:skin,0,-.62,0,l);mesh(new THREE.BoxGeometry(.16,.1,.28),dark,0,-.88,-.05,l);return l});
    var torso=new THREE.Group();torso.position.y=1;root.add(torso);
    var body=mesh(new THREE.CapsuleGeometry(.25,.42,4,12),shirt,0,.38,0,torso);body.scale.set(type==='tank'?1.5:1.15,1,type==='tank'?1.1:.78);
    mesh(new THREE.BoxGeometry(.22,.16,.03),blood,.08,.32,-.2,torso);mesh(new THREE.BoxGeometry(.12,.22,.03),skin,-.1,.5,-.2,torso);
    if(type==='spitter'){var belly=mesh(new THREE.SphereGeometry(.34,16,12),L(0x7a5a9a),0,.25,-.12,torso);belly.scale.set(1,.9,.9);mesh(new THREE.SphereGeometry(.08,8,6),new THREE.MeshBasicMaterial({color:0xb05cff}),0,.3,-.43,torso)}
    if(type==='tank'){[-1,1].forEach(function(s){mesh(new THREE.SphereGeometry(.24,12,10),shirt,s*.42,.72,0,torso)})}
    var head=new THREE.Group();head.position.set(0,.88,-.02);torso.add(head);
    var skull=mesh(new THREE.SphereGeometry(.2,16,12),skin,0,.1,0,head);skull.scale.set(.95,1.05,1);skull.userData.head=true;
    var jaw=new THREE.Group();jaw.position.set(0,0,-.06);head.add(jaw);mesh(new THREE.BoxGeometry(.2,.07,.16),skin,0,-.04,-.06,jaw);mesh(new THREE.BoxGeometry(.16,.03,.12),dark,0,0,-.08,jaw);
    var eyeM=new THREE.MeshBasicMaterial({color:type==='spitter'?0xc070ff:0xff3010});[-1,1].forEach(function(s){mesh(new THREE.SphereGeometry(.035,8,6),eyeM,s*.075,.13,-.17,head)});
    for(var i=0;i<5;i++){var hr=mesh(new THREE.ConeGeometry(.04,.12,4),L(0x2a2420),(Math.random()-.5)*.25,.28,(Math.random()-.5)*.2,head);hr.rotation.set(Math.random()-.5,0,Math.random()-.5)}
    var arms=[-1,1].map(function(s){var a=new THREE.Group();a.position.set(s*(type==='tank'?.52:.36),.68,0);torso.add(a);var up=mesh(new THREE.CapsuleGeometry(type==='tank'?.12:.075,.3,3,8),type==='runner'?skin:shirt,0,-.2,0,a);var lo=mesh(new THREE.CapsuleGeometry(type==='tank'?.11:.065,.26,3,8),skin,0,-.52,0,a);var hd=mesh(new THREE.SphereGeometry(type==='tank'?.13:.08,8,6),skin,0,-.74,0,a);for(var c=0;c<3;c++){var cl=mesh(new THREE.ConeGeometry(.015,.08,4),L(0xd8d0b8),(c-1)*.035,-.82,-.03,a);cl.rotation.x=Math.PI}return a});
    g.scale.setScalar(T.sc*(.95+Math.random()*.1));
    g.userData.parts={legs:legs,arms:arms,torso:torso,head:head,jaw:jaw,root:root,body:body};g.userData.zt=type;
    return g;
  }
  function zAnim(e,dt,mv){
    var p=e.m.userData.parts,ty=e.type||'walker',fast=ty==='runner'?1.8:ty==='tank'?.7:1;
    e.anim=(e.anim||Math.random()*6)+dt*(mv?7*fast:1.5);var s=Math.sin(e.anim),now=performance.now()/1000;
    p.legs[0].rotation.x=mv?s*.75:0;p.legs[1].rotation.x=mv?-s*.75:0;
    var atk=e.atk>0?1-e.atk/.45:0;e.atk=Math.max(0,(e.atk||0)-dt);
    var reach=ty==='runner'?-1.1:-1.45;
    p.arms[0].rotation.x=atk?-2.6+atk*2.4:reach+s*.25;p.arms[1].rotation.x=atk?-2.6+atk*2.2:reach-s*.25;p.arms[0].rotation.z=-.1+Math.sin(now*2+1)*.08;p.arms[1].rotation.z=.1-Math.sin(now*2)*.08;
    e.flinch=Math.max(0,(e.flinch||0)-dt);
    p.root.rotation.x=(ty==='runner'?.4:ty==='tank'?.25:.12)-e.flinch*1.6;p.root.rotation.z=Math.sin(e.anim*.5)*(ty==='tank'?.05:.1);
    p.head.rotation.z=Math.sin(now*1.3+(e.x||0))*.3;p.head.rotation.x=atk?.3:-.1;p.jaw.rotation.x=.15+Math.abs(Math.sin(now*7+(e.z||0)))*.35;
    if(e.rise!==undefined&&e.rise<1){e.rise=Math.min(1,e.rise+dt*.8);e.m.position.y=-1.9*(1-e.rise);p.arms[0].rotation.x=p.arms[1].rotation.x=-2.8}
  }
  function animWalk(e,dt,moving){var p=e.m.userData.parts;e.anim=(e.anim||0)+dt*(moving?9:0);var s=Math.sin(e.anim)*.6*(moving?1:0);p.legs[0].rotation.x=s;p.legs[1].rotation.x=-s;if(e.kind==='z'){p.arms[0].rotation.x=-1.35+s*.2;p.arms[1].rotation.x=-1.35-s*.2}}
  /* Armes détaillées : canon vers -z, poignée vers l'origine */
  function buildGun(type,col){
    var g=new THREE.Group(),body=new THREE.MeshStandardMaterial({color:new THREE.Color(col).offsetHSL(0,0,.08),roughness:.55,metalness:.1}),steel=new THREE.MeshStandardMaterial({color:0x44474e,roughness:.42,metalness:.35}),bright=new THREE.MeshStandardMaterial({color:0x8a8e96,roughness:.3,metalness:.45}),grip=new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.85});
    function box(w,h,d,x,y,z,mat,rx){var q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;g.add(q);return q}
    function cyl(r1,r2,len,x,y,z,mat,seg){var q=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,seg||14),mat);q.rotation.x=Math.PI/2;q.position.set(x,y,z);g.add(q);return q}
    function guard(z,y,r){var t=new THREE.Mesh(new THREE.TorusGeometry(r||.045,.008,6,14,Math.PI),steel);t.rotation.set(0,Math.PI/2,Math.PI);t.position.set(0,y,z);g.add(t);box(.012,.03,.01,0,y-.005,z-.005,steel)}
    if(type==='pistol'){
      var slide=box(.068,.07,.36,0,.045,-.12,steel);for(var i=0;i<5;i++)slide.add((function(z){var q=new THREE.Mesh(new THREE.BoxGeometry(.07,.05,.006),bright);q.position.set(0,.005,.14+z*.012);return q})(i));g.userData.slide=slide;
      g.userData.mag=box(.046,.13,.06,0,-.17,.035,bright,.22);
      box(.06,.05,.27,0,-.005,-.1,body);cyl(.014,.014,.06,0,.04,-.32,bright,10);
      box(.058,.17,.085,0,-.1,.02,grip,.22);box(.062,.12,.006,0,-.1,.065,body,.22);
      guard(-.07,-.035);box(.012,.02,.01,0,.088,-.27,steel);box(.04,.018,.012,0,.088,.04,steel);
    }else if(type==='rifle'){
      box(.08,.1,.38,0,.02,-.12,body);box(.075,.09,.3,0,.02,-.45,steel);for(var v=0;v<4;v++)box(.08,.02,.03,0,.035,-.36-v*.06,grip);
      cyl(.017,.017,.26,0,.03,-.71,bright);cyl(.025,.025,.06,0,.03,-.84,steel);
      var mag=box(.05,.17,.08,0,-.1,-.2,steel,.18);mag.add((function(){var q=new THREE.Mesh(new THREE.BoxGeometry(.05,.06,.08),steel);q.position.set(0,-.1,.03);q.rotation.x=.27;return q})());g.userData.mag=mag;
      box(.055,.15,.07,0,-.09,.04,grip,.3);guard(-.08,-.04);
      box(.07,.08,.26,0,0,.21,body);box(.07,.13,.05,0,-.02,.33,body);box(.04,.04,.18,0,.08,.15,steel);
      g.userData.slide=box(.02,.03,.05,.045,.045,-.05,bright);box(.05,.05,.1,0,.1,-.15,steel);var dot=new THREE.Mesh(new THREE.CircleGeometry(.016,12),new THREE.MeshBasicMaterial({color:0xff2a10}));dot.position.set(0,.1,-.21);g.add(dot);
    }else if(type==='shotgun'){
      cyl(.028,.028,.78,0,.035,-.5,steel);cyl(.022,.022,.6,0,-.015,-.43,steel);
      var pump=box(.075,.07,.22,0,-.015,-.46,body);for(var r=0;r<5;r++)box(.078,.072,.012,0,-.015,-.39-r*.035,grip);g.userData.pump=pump;
      box(.085,.11,.24,0,.01,-.04,steel);box(.06,.15,.07,0,-.1,.08,grip,.3);guard(.0,-.05);
      box(.07,.09,.3,0,-.02,.26,body,-.1);box(.075,.15,.06,0,-.05,.41,grip);box(.012,.016,.012,0,.07,-.86,bright);
    }else{
      cyl(.02,.024,.68,0,.04,-.72,steel);cyl(.03,.03,.08,0,.04,-1.07,steel);
      box(.075,.09,.34,0,.02,-.2,body);box(.065,.08,.26,0,.015,-.45,body);
      cyl(.04,.04,.32,0,.13,-.2,steel);cyl(.052,.04,.07,0,.13,-.39,steel);cyl(.046,.04,.06,0,.13,-.02,steel);
      var lens=new THREE.Mesh(new THREE.CircleGeometry(.042,16),new THREE.MeshStandardMaterial({color:0x2a6aa0,emissive:0x0a2040,roughness:.1,metalness:.5}));lens.position.set(0,.13,-.43);lens.rotation.y=Math.PI;g.add(lens);
      box(.02,.05,.02,0,.08,-.26,steel);box(.02,.05,.02,0,.08,-.13,steel);
      var boltG=new THREE.Group();boltG.position.set(.03,.05,-.02);g.add(boltG);var bolt=new THREE.Mesh(new THREE.BoxGeometry(.012,.012,.07),bright);bolt.position.set(.02,0,0);bolt.rotation.y=-.6;boltG.add(bolt);var knob=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),bright);knob.position.set(.045,0,.02);boltG.add(knob);g.userData.bolt=boltG;
      g.userData.mag=box(.05,.09,.09,0,-.06,-.2,steel);box(.055,.14,.07,0,-.09,.05,grip,.25);guard(-.05,-.04);
      box(.07,.1,.34,0,-.02,.26,body,-.08);box(.06,.05,.14,0,.05,.22,body);box(.072,.16,.04,0,-.05,.44,grip);
      [-1,1].forEach(function(s){var leg=box(.012,.012,.22,s*.025,-.02,-.72,steel);leg.rotation.y=s*.05});
    }
    ['slide','mag','pump','bolt'].forEach(function(k){var o=g.userData[k];if(o){o.userData.p0=o.position.clone();o.userData.r0=o.rotation.clone()}});
    g.traverse(function(o){if(o.isMesh)o.castShadow=true});
    return g;
  }
  function gunModel(type,col){return buildGun(type,col)}
  function setViewGun(){
    while(vscene.children.length>3)vscene.remove(vscene.children[3]);
    var gg=new THREE.Group(),gun=gunModel(P.gun,GUN_SKINS[skins.gun].c);gg.add(gun);gg.userData.gun=gun;
    var skinM=new THREE.MeshStandardMaterial({color:0xd9a77c,roughness:.7}),glove=new THREE.MeshStandardMaterial({color:CH_SKINS[skins.ch].c,roughness:.8});
    var hand=new THREE.Mesh(new THREE.SphereGeometry(.07,14,10),glove);hand.scale.set(.75,.85,1.1);hand.position.set(0,-.1,.04);gg.add(hand);
    if(P.gun!=='pistol'){var h2=new THREE.Mesh(new THREE.SphereGeometry(.065,14,10),glove);h2.scale.set(.8,.65,1.1);h2.position.set(-.02,-.06,P.gun==='shotgun'?-.46:-.4);gg.add(h2);var a2=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.3,4,10),glove);a2.rotation.x=1.2;a2.rotation.z=.5;a2.position.set(-.12,-.16,-.25);gg.add(a2)}
    var arm=box(.1,.1,.34,CH_SKINS[skins.ch].c);arm.position.set(.03,-.15,.24);arm.rotation.x=.25;gg.add(arm);
    var fl=new THREE.Mesh(new THREE.PlaneGeometry(.22,.22),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0,depthWrite:false}));
    fl.position.set(0,.02,P.gun==='sniper'?-1.1:P.gun==='shotgun'?-.9:P.gun==='rifle'?-.82:-.4);gg.add(fl);muzzle=fl;var fl2=new THREE.Mesh(new THREE.PlaneGeometry(.12,.34),fl.material);fl2.position.copy(fl.position);fl2.rotation.y=Math.PI/2;gg.add(fl2);var core=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xfff6d0,transparent:true,opacity:0}));core.position.copy(fl.position);gg.add(core);gg.userData.core=core;
    gg.scale.setScalar(.75);viewGun=gg;vscene.add(gg);
  }
  function pickupMesh(type){
    var g=new THREE.Group();
    if(type==='med'){g.add(box(.6,.4,.4,0,TX.med))}
    else if(type==='ammo'){g.add(box(.6,.35,.35,0,TX.ammo))}
    else if(type==='coin'){var c=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.06,18),lam({color:0xf0c030,emissive:0x664400}));c.rotation.x=Math.PI/2;g.add(c)}
    else{var gm=gunModel(type,GUN_SKINS[0].c);gm.scale.setScalar(1.6);g.add(gm);var ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.04,6,24),new THREE.MeshBasicMaterial({color:0xe2361b}));ring.rotation.x=Math.PI/2;ring.position.y=-.55;g.add(ring)}
    return g;
  }

  /* ---------- État ---------- */
  var pk={},mode='zombie',mapId='bunker',P=null,ents=[],items=[],shots=[],running=false,paused=false,raf=0,last=0,keys={},mouseDown=false,aiming=false,wave=0,waveT=0,kills=0,zone=null,feed=[],stats={},lastInput=0,online=false,auth=true,remotes={},round=null,dead=false,deadMsg='',chatOpen=false,bigMap=false,itemSeq=0;
  function newPlayer(sp){return {x:sp.x,z:sp.z,y:0,vy:0,yaw:Math.random()*6.28,pitch:0,hp:100,guns:{pistol:{mag:12,res:Infinity}},gun:'pistol',cd:0,rel:0,kick:0,bob:0,afk:false,shotN:0,lastHurt:0,by:''}}
  function spawnFar(minD){var s,n=0;do{s=cellC(PP.pick(OPEN));n++}while(P&&Math.hypot(s.x-P.x,s.z-P.z)<minD&&n<60);return {x:s.x+(Math.random()-.5),z:s.z+(Math.random()-.5)}}
  function addItem(type,x,z,id){var m=pickupMesh(type);m.position.set(x,.7,z);scene.add(m);var it={id:id!=null?id:itemSeq++,type:type,x:x,z:z,m:m};items.push(it);return it}
  function removeItem(id){for(var i=items.length-1;i>=0;i--)if(items[i].id===id){scene.remove(items[i].m);items.splice(i,1)}}

  function addZombie(type,mult){
    var t=ZT[type],s=spawnFar(22),m=zombieModel(type);
    m.position.set(s.x,-1.9,s.z);scene.add(m);dust(s.x,s.z);
    var e={kind:'z',type:type,x:s.x,z:s.z,yaw:0,hp:t.hp*mult,max:t.hp*mult,sp:t.sp*(.9+Math.random()*.25),dmg:t.dmg,cd:0,spit:2+Math.random()*2,m:m,r:.45*t.sc,alive:true,hit:0,rise:0};
    m.userData.ent=e;ents.push(e);return e;
  }
  var BOTN=['Rex','Nova','Kilo','Vega','Orion','Bravo','Lynx','Jinx','Zed','Moka','Tango','Echo'];
  function addBot(i,x,z){
    var sk=CH_SKINS[i%CH_SKINS.length].c,m=human(sk,0xe0b48f,{gun:true,helmet:true});m.position.set(x,0,z);scene.add(m);
    var e={kind:'b',i:i,name:'Bot '+BOTN[i%BOTN.length],x:x,z:z,yaw:Math.random()*6.28,hp:100,m:m,r:.4,alive:true,cd:1+Math.random(),wander:0,goal:null,strafe:1,hit:0,flash:0,tx:x,tz:z};
    m.userData.ent=e;ents.push(e);return e;
  }
  function remoteModel(r){if(r.m)scene.remove(r.m);r.m=human(CH_SKINS[r.sk||0].c,0xe0b48f,{gun:true,helmet:true});r.m.userData.ent=r;r.kind='p';scene.add(r.m);r.skShown=r.sk}

  function reset(seed){
    if(!init())return false;
    buildWorld(mapId,seed||((Math.random()*1e9)|0));
    ents=[];items=[];shots=[];feed=[];kills=0;wave=0;waveT=2;dead=false;deadMsg='';zone=null;stats={hits:0,shots:0};
    Object.keys(remotes).forEach(function(k){remotes[k].m=null});
    P=newPlayer(spawnFar(0));setViewGun();
    var R=rng((seed||1)+7);
    if(mode==='zombie'){for(var i=0;i<5;i++){var c=cellC(OPEN[Math.floor(R()*OPEN.length)]);addItem(i<2?'med':'ammo',c.x,c.z)}var w=cellC(OPEN[Math.floor(R()*OPEN.length)]);addItem('rifle',w.x,w.z)}
    if(mode==='br'){
      var loot=['rifle','shotgun','sniper','rifle','shotgun','ammo','ammo','ammo','ammo','med','med','med','coin','coin','coin','coin','coin','sniper','ammo','med'];
      loot.forEach(function(t,j){var c=cellC(OPEN[Math.floor(R()*OPEN.length)]);addItem(t,c.x+(R()-.5)*2,c.z+(R()-.5)*2,j)});itemSeq=100;
      var zc=cellC(OPEN[Math.floor(R()*OPEN.length)]);zone={x:zc.x,z:zc.z,r:Math.hypot(W,H)*S*.6,target:Math.hypot(W,H)*S*.6,t:25,stage:0};
    }
    lastInput=performance.now();hud();return true;
  }

  /* ---------- Interface (HUD sur l'image) ---------- */
  var UI={};
  function buildUI(){
    var st=cv.parentNode,d=document.createElement('div');d.className='fx-ui';d.innerHTML=
      '<div class="fx-cross" id="fx-cross"><i></i><i></i><i></i><i></i></div><div class="fx-hitm" id="fx-hitm"></div><div class="fx-scope" id="fx-scope"></div><div class="fx-hurt" id="fx-hurt"></div>'+
      '<canvas class="fx-mini" id="fx-mini" width="180" height="180"></canvas><div class="fx-feed" id="fx-feed"></div><div class="fx-top" id="fx-top"></div><div class="fx-center" id="fx-center"></div>'+
      '<div class="fx-hp"><span>VIE</span><b id="fx-hp">100</b><i><em id="fx-hpbar"></em></i></div><div class="fx-ammo"><span id="fx-gname">Pistolet</span><b id="fx-ammo">12 / ∞</b><small id="fx-slots"></small></div><div class="fx-coins" id="fx-coins"></div>'+
      '<div class="fx-chat" id="fx-chat" hidden><div class="fx-log" id="fx-log"></div><input id="fx-in" maxlength="80" placeholder="Message, Entrée pour envoyer" hidden></div>';
    st.appendChild(d);['cross','hitm','scope','hurt','mini','feed','top','center','hp','hpbar','gname','ammo','slots','coins','chat','log','in'].forEach(function(k){UI[k]=$('fx-'+k)});
    UI.mctx=UI.mini.getContext('2d');
    UI.in.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter'){var t=UI.in.value.trim();if(t){chatAdd(net.me.name||'Moi',t,true);net.relay({g:'fchat',n:net.me.name,t:t})}UI.in.value='';closeChat()}if(e.key==='Escape')closeChat()});
  }
  function openChat(){if(!online)return;chatOpen=true;UI.in.hidden=false;keys={};mouseDown=false;unlock();setTimeout(function(){UI.in.focus()},0)}
  function closeChat(){chatOpen=false;UI.in.hidden=true;UI.in.blur();lock()}
  function chatAdd(n,t,me){var l=document.createElement('div');l.className=me?'me':'';l.innerHTML='<b>'+esc(n)+'</b> '+esc(t);UI.log.appendChild(l);while(UI.log.children.length>7)UI.log.removeChild(UI.log.firstChild);sfx.play('ui')}
  function sys(t){var l=document.createElement('div');l.className='sys';l.textContent=t;if(UI.log){UI.log.appendChild(l);while(UI.log.children.length>7)UI.log.removeChild(UI.log.firstChild)}}
  function addFeed(t){feed.unshift({t:t,ttl:5});if(feed.length>5)feed.pop();renderFeed()}
  function renderFeed(){UI.feed.innerHTML=feed.map(function(f){return '<div>'+esc(f.t)+'</div>'}).join('')}
  function hud(){
    if(!P||!UI.hp)return;
    var g=GUNS[P.gun],a=P.guns[P.gun];
    UI.hp.textContent=Math.max(0,Math.ceil(P.hp));UI.hpbar.style.width=Math.max(0,P.hp)+'%';UI.hpbar.style.background=P.hp<30?'#e2361b':'#f1ece2';
    UI.gname.textContent=g.n+(P.rel>0?' · recharge':'');UI.ammo.textContent=a.mag+' / '+(a.res===Infinity?'∞':a.res);
    UI.slots.innerHTML=ORDER.map(function(k,i){return P.guns[k]?'<span class="'+(k===P.gun?'on':'')+'">'+(i+1)+'</span>':'<span class="off">'+(i+1)+'</span>'}).join('');
    UI.coins.textContent=coins()+' pièces';
    $('fps-hp').textContent=Math.max(0,Math.ceil(P.hp));
    if(mode==='zombie'){$('fps-l1').innerHTML='Zombies <b>'+kills+'</b>';$('fps-l2').innerHTML='Vague <b>'+wave+'</b>';UI.top.textContent='VAGUE '+wave+' · '+ents.filter(function(e){return e.alive}).length+' ZOMBIES'}
    else{var al=aliveCount();$('fps-l1').innerHTML='Frags <b>'+kills+'</b>';$('fps-l2').innerHTML='En vie <b>'+al+'</b>';UI.top.textContent=(online?'SALON '+net.code+' · ':'')+al+' EN VIE · ZONE '+Math.max(0,Math.ceil(zone?zone.t:0))+' S'}
    var best=mode==='br'?PP.store('fps-br'):PP.store('fps-zombie');$('fps-best').textContent=mode==='br'?(best?'Top '+best:'—'):best;
  }
  function center(t){UI.center.textContent=t||'';UI.center.style.display=t?'block':'none'}

  /* ---------- Mini-carte ---------- */
  var miniBase=null;
  function drawMiniBase(){
    var c=document.createElement('canvas'),k=4;c.width=W*k;c.height=H*k;var g=c.getContext('2d');
    g.fillStyle=world.style==='village'?'#4f7a32':'#2b2a27';g.fillRect(0,0,c.width,c.height);
    for(var z=0;z<H;z++)for(var x=0;x<W;x++){var ch=G[z][x];if(ch==='#'){g.fillStyle=world.style==='village'?'#a3472d':'#9a968c';g.fillRect(x*k,z*k,k,k)}else if(ch==='c'){g.fillStyle='#8a5f33';g.fillRect(x*k+1,z*k+1,k-2,k-2)}else if(ch==='t'){g.fillStyle='#1f4a1c';g.beginPath();g.arc(x*k+k/2,z*k+k/2,k*.6,0,7);g.fill()}}
    miniBase=c;
  }
  function drawMini(){
    var g=UI.mctx,sz=bigMap?360:180,c=UI.mini;if(c.width!==sz){c.width=c.height=sz;c.classList.toggle('big',bigMap)}
    var range=bigMap?Math.max(W,H)*S:60,sc=sz/range,cx=bigMap?W*S/2:P.x,cz=bigMap?H*S/2:P.z;
    g.save();g.fillStyle='#141210';g.fillRect(0,0,sz,sz);g.translate(sz/2,sz/2);
    g.drawImage(miniBase,(-cx)*sc,(-cz)*sc,W*S*sc,H*S*sc);
    if(zone){g.strokeStyle='#3fa9ff';g.lineWidth=2;g.beginPath();g.arc((zone.x-cx)*sc,(zone.z-cz)*sc,zone.r*sc,0,7);g.stroke();if(zone.target<zone.r){g.setLineDash([4,4]);g.strokeStyle='#fff';g.beginPath();g.arc((zone.x-cx)*sc,(zone.z-cz)*sc,zone.target*sc,0,7);g.stroke();g.setLineDash([])}}
    items.forEach(function(it){g.fillStyle=it.type==='med'?'#fff':it.type==='ammo'?'#9fe36a':it.type==='coin'?'#f0c030':'#e2361b';g.fillRect((it.x-cx)*sc-2,(it.z-cz)*sc-2,4,4)});
    ents.forEach(function(e){if(!e.alive)return;var dd=Math.hypot(e.x-P.x,e.z-P.z);if(e.kind==='z'&&dd>40&&!bigMap)return;if(e.kind==='b'&&dd>28&&!bigMap&&!e.flash)return;g.fillStyle=e.kind==='z'?'#e2361b':'#ffb020';g.beginPath();g.arc((e.x-cx)*sc,(e.z-cz)*sc,3,0,7);g.fill()});
    Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!r.al)return;g.fillStyle='#3fa9ff';g.beginPath();g.arc((r.x-cx)*sc,(r.z-cz)*sc,3.5,0,7);g.fill()});
    g.translate((P.x-cx)*sc,(P.z-cz)*sc);g.rotate(-P.yaw);g.fillStyle='#fff';g.beginPath();g.moveTo(0,-7);g.lineTo(5,5);g.lineTo(0,2);g.lineTo(-5,5);g.closePath();g.fill();
    g.restore();g.strokeStyle='#f1ece2';g.lineWidth=2;g.strokeRect(1,1,sz-2,sz-2);
  }

  /* ---------- Tir ---------- */
  function fwd(){return new THREE.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch))}
  function targetList(){var l=[];ents.forEach(function(e){if(e.alive&&e.m)l.push(e.m)});Object.keys(remotes).forEach(function(k){var r=remotes[k];if(r.al&&r.m)l.push(r.m)});return l}
  function fire(){
    if(dead||P.rel>0||P.cd>0)return;var g=GUNS[P.gun],a=P.guns[P.gun];
    if(a.mag<=0){sfx.play('tick');reload();P.cd=.3;return}
    a.mag--;P.cd=g.rate;P.kick=Math.min(.25,P.kick+g.kick);P.shotN++;stats.shots++;sfx.play('shoot');if(P.gun!=='shotgun'&&P.gun!=='sniper')casing();shakeT=Math.max(shakeT,g.kick*1.2);
    P.fireT=1;if(P.gun==='shotgun')P.pumpT=1.6;if(P.gun==='sniper')P.boltT=1.6;P.pitch=Math.min(1.45,P.pitch+g.kick*(aiming?.12:.22));smoke();
    muzzle.scale.setScalar(.8+Math.random()*.9);muzzle.rotation.z=Math.random()*6;muzzle.material.opacity=1;if(viewGun&&viewGun.userData.core)viewGun.userData.core.material.opacity=1;muzzleL.intensity=3;muzzleL.position.set(P.x,EYE+P.y,P.z);
    var tl=targetList(),hitAny=false,spr=g.spread*(aiming?(P.gun==='sniper'?.02:.35):1)*(isMoving()?1.4:1);
    var origin=new THREE.Vector3(P.x,EYE+P.y,P.z);
    for(var i=0;i<g.pel;i++){
      var dir=fwd();dir.x+=(Math.random()-.5)*spr*2;dir.y+=(Math.random()-.5)*spr*2;dir.z+=(Math.random()-.5)*spr*2;dir.normalize();
      ray.set(origin,dir);ray.far=200;
      var hs=ray.intersectObjects(tl,true),hw=ray.intersectObjects(solidMeshes,false),wd=hw.length?hw[0].distance:1e9;
      if(hs.length&&hs[0].distance<wd){
        var o=hs[0].object,head=!!o.userData.head;while(o&&!o.userData.ent)o=o.parent;if(!o)continue;
        var ent=o.userData.ent,dmg=g.dmg*(head?2:1)*(g.pel>1?Math.max(.4,1-hs[0].distance/30):1);hitAny=true;hitEnt(ent,dmg,head);
        blood(hs[0].point,head);
      }else if(hw.length){spark(hw[0].point,0xd8c8a0);hole(hw[0])}
    }
    if(hitAny){stats.hits++;UI.hitm.classList.remove('on','kill');void UI.hitm.offsetWidth;UI.hitm.classList.add('on');if(lastKill&&performance.now()-lastKill<60)UI.hitm.classList.add('kill')}
    if(a.mag===0&&a.res>0)setTimeout(function(){if(P&&P.guns[P.gun]===a&&a.mag===0)reload()},250);
    lastInput=performance.now();hud();
  }
  function hitEnt(e,dmg,head){
    if(e.kind==='p'){net.relay({g:'fbhit',to:e.id,d:dmg,by:net.me.name});sfx.play('hit');return}
    if(e.kind==='b'&&online&&!auth){net.send({t:'fb-hit',b:e.i,d:dmg,by:net.me.name});sfx.play('hit');return}
    damageEnt(e,dmg,net.me.name||'Toi',true,head);
  }
  var lastKill=0;
  function damageEnt(e,dmg,by,mine,head){
    if(!e.alive)return;e.hp-=dmg;e.hit=.15;e.flinch=Math.min(.45,.18+dmg/250);
    if(e.hp<=0){e.alive=false;e.headshot=!!head;
      if(mine){kills++;sfx.play('kill');lastKill=performance.now();if(head)addFeed('Tir dans la tête !')}
      if(e.kind==='z'){var r=Math.random();if(r<.35)addItem('coin',e.x,e.z);else if(r<.47)addItem('ammo',e.x,e.z);else if(r<.53)addItem('med',e.x,e.z)}
      if(e.kind==='b'){var t=by+' a éliminé '+e.name;addFeed(t);if(online&&auth)net.broadcast({t:'fb-feed',txt:t})}
      e.dieT=e.kind==='z'?4.5:1.2;if(e.kind==='z')startDeath(e);
    }else if(mine)sfx.play('hit');
    hud();
  }
  var sparks=[],shakeT=0,holes=[],smokes=[];
  function blood(p,head){for(var i=0;i<(head?22:9);i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.06),new THREE.MeshBasicMaterial({color:i%3?0x8a0c0c:0xc41a1a}));m.position.copy(p);scene.add(m);sparks.push({m:m,v:new THREE.Vector3((Math.random()-.5)*(head?6:3.5),Math.random()*(head?5:3),(Math.random()-.5)*(head?6:3.5)),t:.6})}}
  function hole(h){if(!h.face)return;var n=h.face.normal.clone();var m=new THREE.Mesh(new THREE.CircleGeometry(.05,8),new THREE.MeshBasicMaterial({color:0x1a1612,transparent:true,opacity:.85,depthWrite:false}));m.position.copy(h.point).addScaledVector(n,.01);m.lookAt(h.point.clone().add(n));scene.add(m);holes.push(m);if(holes.length>60)scene.remove(holes.shift())}
  function smoke(){var d=fwd();var m=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xcfcfcf,transparent:true,opacity:.35,depthWrite:false}));m.position.set(P.x+d.x*1.1+Math.cos(P.yaw)*.15,EYE+P.y+d.y*1.1-.12,P.z+d.z*1.1-Math.sin(P.yaw)*.15);scene.add(m);smokes.push({m:m,t:.7})}
  function startDeath(e){
    var a=Math.atan2(e.x-P.x,e.z-P.z);e.fx=Math.sin(a);e.fz=Math.cos(a);e.roll=(Math.random()-.5)*.6;
    if(e.headshot&&e.m.userData.parts){e.m.userData.parts.head.visible=false;blood(new THREE.Vector3(e.x,1.8*(e.m.scale.y||1),e.z),true)}
    var pool=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x3a0303,transparent:true,opacity:.8,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.set(e.x+e.fx*1.1,.03,e.z+e.fz*1.1);pool.scale.setScalar(.01);scene.add(pool);e.pool=pool;
  }
  function stepDeath(e,dt){
    var tt=4.5-e.dieT,p=e.m.userData.parts,sc=e.m.scale.x;
    if(tt<.28){var k=tt/.28;if(p){p.legs[0].rotation.x=-k*.9;p.legs[1].rotation.x=-k*.7;p.arms[0].rotation.x=-1.4-k*1.2;p.arms[1].rotation.x=-1.2-k*1.4;p.root.rotation.x=k*.3}e.m.position.y=-k*.35*sc;e.m.position.x=e.x+e.fx*k*.25;e.m.position.z=e.z+e.fz*k*.25}
    else if(tt<1){var u=(tt-.28)/.72,eu=u*u;e.m.rotation.x=-eu*1.52;e.m.rotation.z=e.roll*eu;e.m.position.y=-.35*sc*(1-eu)+.05;e.m.position.x=e.x+e.fx*(.25+eu*.3);e.m.position.z=e.z+e.fz*(.25+eu*.3);if(p){p.arms[0].rotation.x=-2.6+Math.sin(tt*14)*.5;p.arms[1].rotation.x=-2.6-Math.sin(tt*14)*.5;p.root.rotation.x=.3-eu*.3;if(p.jaw)p.jaw.rotation.x=.7}}
    else if(tt<1.3){if(!e.dusted){e.dusted=1;dust(e.x+e.fx*1.2,e.z+e.fz*1.2);shakeT=Math.max(shakeT,.05)}e.m.rotation.x=-1.52+Math.sin((tt-1)/.3*Math.PI)*.12;if(p){p.arms[0].rotation.x=-2.9;p.arms[1].rotation.x=-2.2;p.legs[0].rotation.x=-.2;p.legs[1].rotation.x=.15}}
    else if(tt>3.6){e.m.position.y-=dt*.6}
    if(e.pool){var ps=Math.min(1,tt/1.8)*(1.1*sc);e.pool.scale.setScalar(Math.max(.01,ps));if(tt>3.6)e.pool.material.opacity=Math.max(0,.85-(tt-3.6)*.9)}
  }
  function dust(x,z){for(var i=0;i<10;i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.14),new THREE.MeshLambertMaterial({color:0x6a5a48}));m.position.set(x+(Math.random()-.5),.2,z+(Math.random()-.5));scene.add(m);sparks.push({m:m,v:new THREE.Vector3((Math.random()-.5)*3,2+Math.random()*3,(Math.random()-.5)*3),t:.7})}}
  function casing(){var m=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,.08),new THREE.MeshBasicMaterial({color:0xd4a32a}));var rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);m.position.set(P.x+rx*.25-Math.sin(P.yaw)*.4,EYE+P.y-.15,P.z+rz*.25-Math.cos(P.yaw)*.4);scene.add(m);sparks.push({m:m,v:new THREE.Vector3(rx*2.5+(Math.random()-.5),2.2+Math.random(),rz*2.5+(Math.random()-.5)),t:.6})}
  function spark(p,col){for(var i=0;i<5;i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.05),new THREE.MeshBasicMaterial({color:col}));m.position.copy(p);scene.add(m);sparks.push({m:m,v:new THREE.Vector3((Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4),t:.35})}}
  function reload(){var g=GUNS[P.gun],a=P.guns[P.gun];if(P.rel>0||a.mag>=g.mag||a.res<=0)return;P.rel=g.rel;P.relSnd=0;aiming=false;sfx.play('tick');hud()}
  function finishReload(){var g=GUNS[P.gun],a=P.guns[P.gun],need=g.mag-a.mag,take=a.res===Infinity?need:Math.min(need,a.res);a.mag+=take;if(a.res!==Infinity)a.res-=take;hud()}
  function switchGun(k){if(!P.guns[k]||k===P.gun||dead)return;P.gun=k;P.rel=0;P.cd=.35;aiming=false;setViewGun();hud();sfx.play('ui')}
  function cycle(d){var own=ORDER.filter(function(k){return P.guns[k]});var i=own.indexOf(P.gun);switchGun(own[(i+d+own.length)%own.length])}
  function hurt(d,by){
    if(dead)return;P.hp-=d;P.lastHurt=performance.now();shakeT=.25;P.by=by||P.by;UI.hurt.classList.remove('on');void UI.hurt.offsetWidth;UI.hurt.classList.add('on');sfx.play('hurt');
    if(P.hp<=0){P.hp=0;die(by)}hud();
  }
  function isMoving(){return keys.F||keys.B||keys.L||keys.R||pk.F||pk.B}

  /* ---------- Ramassage ---------- */
  function pickup(it){
    var t=it.type;
    if(t==='med'){if(P.hp>=100)return false;P.hp=Math.min(100,P.hp+45);sfx.play('pickup');addFeed('+45 vie')}
    else if(t==='ammo'){ORDER.forEach(function(k){var a=P.guns[k];if(a&&a.res!==Infinity)a.res+=GUNS[k].mag*2});sfx.play('pickup');addFeed('Munitions')}
    else if(t==='coin'){coins(coins()+5);sfx.play('eat');addFeed('+5 pièces')}
    else{var g=GUNS[t];if(P.guns[t])P.guns[t].res+=g.mag*2;else{P.guns[t]={mag:g.mag,res:g.mag*2};switchGun(t)}sfx.play('pickup');addFeed(g.n+' ramassé')}
    if(online)net.relay({g:'fbloot',i:it.id});
    hud();return true;
  }

  /* ---------- Boucle ---------- */
  function step(dt){
    var now=performance.now();
    // joueur
    if(!dead){
      var afk=online&&now-lastInput>20000;if(afk!==P.afk){P.afk=afk;if(afk)addFeed('Tu es AFK : un bot joue pour toi')}
      if(P.afk)autopilot(dt);
      var sp=(keys.SH&&!aiming?8.5:5.5)*(aiming?.6:1)*dt,fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),mx=0,mz=0;
      var kF=keys.F||pk.F,kB=keys.B||pk.B,kL=keys.L||pk.L,kR=keys.R||pk.R;if(kF){mx+=fx;mz+=fz}if(kB){mx-=fx;mz-=fz}if(kL){mx+=fz;mz-=fx}if(kR){mx-=fz;mz+=fx}
      var ml=Math.hypot(mx,mz);if(ml>0){moveEnt(P,mx/ml*sp,mz/ml*sp,.4);P.bob+=dt*(keys.SH?13:9)}
      if(keys.J&&P.y<=0){P.vy=5.2;keys.J=false}
      P.vy-=14*dt;P.y=Math.max(0,P.y+P.vy*dt);if(P.y===0)P.vy=Math.max(0,P.vy);
      P.cd-=dt;if(P.rel>0){P.rel-=dt;if(P.rel<=0){P.rel=0;finishReload()}}
      if(mouseDown&&GUNS[P.gun].auto&&!P.afk)fire();
      for(var i=items.length-1;i>=0;i--){var it=items[i];it.m.rotation.y+=dt*2;it.m.position.y=.7+Math.sin(now/300+i)*.12;if(Math.hypot(it.x-P.x,it.z-P.z)<1.3&&pickup(it)){scene.remove(it.m);items.splice(i,1)}}
      if(zone&&Math.hypot(P.x-zone.x,P.z-zone.z)>zone.r){P.hp-=7*dt;if(Math.random()<dt*2){UI.hurt.classList.remove('on');void UI.hurt.offsetWidth;UI.hurt.classList.add('on')}if(P.hp<=0)die('La zone');hud()}
      if(now-P.lastHurt>6000&&P.hp<100&&mode==='br'){P.hp=Math.min(100,P.hp+dt*2)}
    }else items.forEach(function(it,i){it.m.rotation.y+=dt*2});
    P.kick=Math.max(0,P.kick-dt*.9);
    // zombies
    if(mode==='zombie')stepZombies(dt);
    if(mode==='br'){if(auth)stepBR(dt);else stepBRGuest(dt)}
    stepRemotes(dt);
    // morts : petite chute
    ents.forEach(function(e){if(!e.alive&&e.dieT>0&&e.kind==='z'&&e.fx!==undefined){e.dieT-=dt;stepDeath(e,dt);if(e.dieT<=0){scene.remove(e.m);if(e.pool)scene.remove(e.pool);e.m=null}return}if(!e.alive&&e.dieT>0){e.dieT-=dt;var tt=1.2-e.dieT;if(e.kind==='z'){if(!e.dusted&&tt>.4){e.dusted=1;dust(e.x,e.z)}e.m.rotation.x=-Math.min(Math.PI/2,tt*3.2);var pp=e.m.userData.parts;if(pp){pp.arms[0].rotation.x=-2.8+Math.sin(tt*12)*.4;pp.arms[1].rotation.x=-2.5-Math.sin(tt*12)*.4;pp.jaw.rotation.x=.6}e.m.position.y=-Math.max(0,tt-.7)*1.2}else{e.m.rotation.x=Math.min(Math.PI/2,tt*3)}e.m.position.y=e.kind==='z'?e.m.position.y:-Math.max(0,tt-.8);if(e.dieT<=0){scene.remove(e.m);e.m=null}}if(e.m&&e.hit>0){e.hit-=dt}});
    ents=ents.filter(function(e){return e.alive||e.m||(e.kind==='b'&&mode==='br')});
    // projectiles (cracheurs)
    shots.forEach(function(s){s.x+=s.vx*dt;s.z+=s.vz*dt;s.t-=dt;s.m.position.set(s.x,1.3,s.z);if(Math.hypot(s.x-P.x,s.z-P.z)<.8&&!dead){hurt(s.dmg,'un cracheur');s.t=0}if(solid(s.x,s.z))s.t=0});
    shots=shots.filter(function(s){if(s.t<=0){scene.remove(s.m);return false}return true});
    smokes.forEach(function(s){s.t-=dt;s.m.position.y+=dt*.6;s.m.scale.multiplyScalar(1+dt*2.2);s.m.material.opacity=Math.max(0,s.t*.5)});smokes=smokes.filter(function(s){if(s.t<=0){scene.remove(s.m);return false}return true});
    sparks.forEach(function(s){s.t-=dt;s.v.y-=9*dt;s.m.position.addScaledVector(s.v,dt)});sparks=sparks.filter(function(s){if(s.t<=0){scene.remove(s.m);return false}return true});
    feed.forEach(function(f){f.ttl-=dt});if(feed.length&&feed[feed.length-1].ttl<=0){feed.pop();renderFeed()}
    if(online)sendState(dt);
  }
  function stepZombies(dt){
    var alive=0;
    ents.forEach(function(e){
      if(!e.alive||e.kind!=='z')return;alive++;
      var d=Math.hypot(P.x-e.x,P.z-e.z),a=pathDir(e,P.x,P.z);
      if(e.type==='spitter'&&d<18&&los(e.x,e.z,P.x,P.z)){e.spit-=dt;a=Math.atan2(P.x-e.x,P.z-e.z);if(d<9)a+=Math.PI;
        if(e.spit<=0){e.spit=2.6;e.atk=.45;var m=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:0x9b4dff}));scene.add(m);var ang=Math.atan2(P.x-e.x,P.z-e.z);shots.push({x:e.x,z:e.z,vx:Math.sin(ang)*11,vz:Math.cos(ang)*11,t:3,m:m,dmg:e.dmg})}}
      var mv=d>1.1||e.type==='spitter';
      if(mv){moveEnt(e,Math.sin(a)*e.sp*dt,Math.cos(a)*e.sp*dt,e.r)}
      e.yaw=Math.atan2(P.x-e.x,P.z-e.z);
      if(e.rise<1){e.m.position.x=e.x;e.m.position.z=e.z;e.m.rotation.y=e.yaw+Math.PI;zAnim(e,dt,false);return}
      if(d<1.5+e.r&&!dead){e.cd-=dt;if(e.cd<.45&&!e.atk&&e.cd>.4)e.atk=.45;if(e.cd<=0){e.cd=.9;hurt(e.dmg,ZT[e.type].n);e.atk=e.atk||.3}}
      e.m.position.set(e.x,0,e.z);e.m.rotation.y=e.yaw+Math.PI;zAnim(e,dt,mv);
      var hot=e.hit>0?0x661111:0;if(e.hot!==hot){e.hot=hot;e.m.traverse(function(o){if(o.isMesh&&o.material.emissive)o.material.emissive.setHex(hot)})}
    });
    if(!alive){waveT-=dt;center(wave?'VAGUE '+(wave+1)+' DANS '+Math.ceil(waveT):'');if(waveT<=0)nextWave()}
  }
  function nextWave(){
    wave++;center('');var n=Math.min(36,4+wave*3),mult=1+wave*.09;
    for(var i=0;i<n;i++){var r=Math.random(),t='walker';if(wave>=2&&r<.28)t='runner';else if(wave>=3&&r<.42)t='spitter';else if(wave>=4&&r<.5)t='tank';addZombie(t,mult)}
    if(wave%5===0)addZombie('tank',mult*1.4);
    for(var k=0;k<2;k++){var s=spawnFar(6);addItem(k?'ammo':'med',s.x,s.z)}
    if(wave===2||wave%3===0){var w=spawnFar(8);addItem(PP.pick(['shotgun','sniper','rifle']),w.x,w.z)}
    sfx.play('go');PP.toast('Vague '+wave+' : '+n+' zombies','warn');hud();waveT=8;
  }

  /* ---------- Battle royale ---------- */
  function aliveCount(){var n=0;ents.forEach(function(e){if(e.kind==='b'&&e.alive)n++});if(!dead)n++;Object.keys(remotes).forEach(function(k){if(remotes[k].al)n++});return n}
  function stepZone(dt){
    zone.t-=dt;if(zone.t<=0){zone.stage++;zone.target=Math.max(5,zone.target*.62);zone.t=zone.stage<5?22:16;if(zone.stage===1||zone.target>5)PP.toast('La zone rétrécit','warn')}
    zone.r+=(zone.target-zone.r)*Math.min(1,dt*.35);
  }
  function stepBR(dt){
    stepZone(dt);
    var people=[];if(!dead)people.push({x:P.x,z:P.z,me:1,name:net.me.name||'Toi'});Object.keys(remotes).forEach(function(k){var r=remotes[k];if(r.al)people.push({x:r.x,z:r.z,id:k,name:r.n})});
    ents.forEach(function(b){
      if(b.kind!=='b'||!b.alive)return;
      if(Math.hypot(b.x-zone.x,b.z-zone.z)>zone.r){b.hp-=7*dt;if(b.hp<=0){damageEnt(b,1,'La zone',false);return}}
      var tgt=null,td=34;
      people.forEach(function(p){var d=Math.hypot(p.x-b.x,p.z-b.z);if(d<td&&los(b.x,b.z,p.x,p.z)){td=d;tgt=p}});
      ents.forEach(function(o){if(o===b||o.kind!=='b'||!o.alive)return;var d=Math.hypot(o.x-b.x,o.z-b.z);if(d<td*.8&&los(b.x,b.z,o.x,o.z)){td=d;tgt={x:o.x,z:o.z,bot:o,name:o.name}}});
      var mv=false;b.flash=Math.max(0,b.flash-dt);
      if(tgt){
        b.yaw=Math.atan2(tgt.x-b.x,tgt.z-b.z);b.wander-=dt;if(b.wander<=0){b.wander=.8+Math.random();b.strafe=-b.strafe}
        var sa=b.yaw+Math.PI/2*b.strafe,s2=td>12?2.6:1.8;moveEnt(b,Math.sin(sa)*s2*dt+(td>14?Math.sin(b.yaw)*2*dt:0),Math.cos(sa)*s2*dt+(td>14?Math.cos(b.yaw)*2*dt:0),b.r);mv=true;
        b.cd-=dt;if(b.cd<=0){b.cd=.55+Math.random()*.5;b.flash=.08;var chance=Math.max(.12,.62-td/45),dm=10+Math.random()*8;
          if(Math.hypot(b.x-P.x,b.z-P.z)<30)sfx.play('shoot');
          if(Math.random()<chance){if(tgt.me)hurt(dm,b.name);else if(tgt.id)net.to(tgt.id,{t:'fb-dmg',d:dm,by:b.name});else if(tgt.bot)damageEnt(tgt.bot,dm,b.name,false)}}
      }else{
        var out=Math.hypot(b.x-zone.x,b.z-zone.z)>zone.target*.8;
        if(!b.goal||out||Math.hypot(b.goal.x-b.x,b.goal.z-b.z)<2){var near=items.filter(function(it){return Math.hypot(it.x-b.x,it.z-b.z)<20})[0];b.goal=out?{x:zone.x,z:zone.z}:near?{x:near.x,z:near.z}:cellC(PP.pick(OPEN))}
        var a=pathDir(b,b.goal.x,b.goal.z);moveEnt(b,Math.sin(a)*3.4*dt,Math.cos(a)*3.4*dt,b.r);b.yaw=a;mv=true;
        for(var i=items.length-1;i>=0;i--){if(Math.hypot(items[i].x-b.x,items[i].z-b.z)<1.2){if(online)net.broadcast({t:'rel',from:'host',d:{g:'fbloot',i:items[i].id}});removeItem(items[i].id);b.goal=null;break}}
      }
      b.m.position.set(b.x,0,b.z);b.m.rotation.y=b.yaw+Math.PI;animWalk(b,dt,mv);
    });
    // fin de manche
    if(round&&round.phase==='play'&&performance.now()-round.t0>3000){
      var n=aliveCount();
      if(n<=1){round.phase='end';var w=!dead?(net.me.name||'Toi'):null;if(!w)Object.keys(remotes).forEach(function(k){if(remotes[k].al)w=remotes[k].n});if(!w)ents.forEach(function(e){if(e.kind==='b'&&e.alive)w=e.name});
        endRound(w||'Personne');if(online)net.broadcast({t:'fb-end',w:w||'Personne'})}
    }
  }
  function stepBRGuest(dt){
    if(zone){zone.r+=(zone.target-zone.r)*Math.min(1,dt*.35);zone.t-=dt}
    ents.forEach(function(b){if(b.kind!=='b')return;if(!b.alive)return;var dx=b.tx-b.x,dz=b.tz-b.z;b.x+=dx*Math.min(1,dt*10);b.z+=dz*Math.min(1,dt*10);b.m.position.set(b.x,0,b.z);b.m.rotation.y=b.yaw+Math.PI;animWalk(b,dt,Math.hypot(dx,dz)>.05)});
  }
  function stepRemotes(dt){
    Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!r.m||r.skShown!==r.sk)remoteModel(r);
      r.x+=(r.tx-r.x)*Math.min(1,dt*12);r.z+=(r.tz-r.z)*Math.min(1,dt*12);
      r.m.visible=!!r.al;r.m.position.set(r.x,r.y||0,r.z);r.m.rotation.y=r.yaw;animWalk(r,dt,Math.hypot(r.tx-r.x,r.tz-r.z)>.03);
    });
  }
  function autopilot(dt){
    var tgt=null,td=30;
    ents.forEach(function(e){if(!e.alive)return;var d=Math.hypot(e.x-P.x,e.z-P.z);if(d<td&&los(P.x,P.z,e.x,e.z)){td=d;tgt=e}});
    Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!r.al)return;var d=Math.hypot(r.x-P.x,r.z-P.z);if(d<td&&los(P.x,P.z,r.x,r.z)){td=d;tgt=r}});
    keys.F=keys.B=keys.L=keys.R=false;
    if(tgt){P.yaw=Math.atan2(-(tgt.x-P.x),-(tgt.z-P.z));P.pitch=0;if(Math.random()<dt*2.5)fire()}
    else if(zone){var a=pathDir(P,zone.x,zone.z);if(Math.hypot(P.x-zone.x,P.z-zone.z)>zone.target*.6){P.yaw=Math.atan2(-Math.sin(a),-Math.cos(a));keys.F=true}}
  }
  function endRound(w){
    var me=net.me.name||'Toi',won=w===me&&!dead;if(won)PP.stat('fps','win');
    if(!dead||won){var place=won?1:aliveCount();var b=PP.store('fps-br');if(!b||place<b)PP.store('fps-br',place)}
    sfx.play(won?'win':'lose');
    if(online){center((won?'VICTOIRE ! ':w+' GAGNE LA MANCHE. ')+'NOUVELLE MANCHE DANS 8 S');addFeed(w+' gagne la manche');sys(w+' gagne la manche')}
    else showEnd(won?'Victoire royale !':'Partie finie',won?'Dernier debout, avec '+kills+' frag'+(kills>1?'s':'')+'.':w+' gagne. Tu as fait '+kills+' frag'+(kills>1?'s':'')+'.');
    if(online&&auth)setTimeout(function(){if(online&&auth&&PP.cur()==='fps')hostRound()},8000);
    hud();
  }
  function die(by){
    dead=true;aiming=false;mouseDown=false;P.hp=0;sfx.play('lose');
    if(online){net.relay({g:'fbdie',by:by||''});var t=(by?by+' a éliminé ':'Éliminé : ')+(net.me.name||'toi');addFeed(t);center('ÉLIMINÉ'+(by?' PAR '+String(by).toUpperCase():'')+' · TU REJOUES À LA PROCHAINE MANCHE');var pl=aliveCount();var b=PP.store('fps-br');if(!b||pl+1<b)PP.store('fps-br',pl+1);sendState(1)}
    else if(mode==='zombie'){var best=PP.store('fps-zombie'),better=kills>best;if(better){PP.store('fps-zombie',kills);PP.refreshHi()}showEnd('Dévoré','Vague '+wave+', '+kills+' zombie'+(kills>1?'s':'')+'.'+(better?' Nouveau record !':' Record : '+best+'.'))}
    else{var place=aliveCount()+1,bb=PP.store('fps-br');if(!bb||place<bb)PP.store('fps-br',place);showEnd('Éliminé','Par '+(by||'?')+'. Place : '+place+'e. '+kills+' frag'+(kills>1?'s':'')+'.')}
    hud();
  }
  function showEnd(t,m){running=false;cancelAnimationFrame(raf);unlock();$('fps-title').textContent=t;$('fps-msg').textContent=m;$('fps-start').textContent='Rejouer';$('fps-start').hidden=false;$('fps-online').hidden=mode!=='br';$('fps-ov').hidden=false;render()}

  /* ---------- Réseau (battle royale en ligne) ---------- */
  var sendAcc=0;
  function sendState(dt){
    sendAcc-=dt;if(sendAcc>0)return;sendAcc=.066;
    net.relay({g:'fb',x:+P.x.toFixed(2),z:+P.z.toFixed(2),y:+P.y.toFixed(2),yw:+P.yaw.toFixed(3),hp:Math.ceil(P.hp),al:dead?0:1,w:P.gun,sk:skins.ch,afk:P.afk?1:0,n:net.me.name,sh:P.shotN,r:round?round.n:0});
    if(auth){stateAcc-=.066;if(stateAcc<=0){stateAcc=.1;net.broadcast({t:'fb-s',r:round?round.n:0,z:[+zone.x.toFixed(1),+zone.z.toFixed(1),+zone.r.toFixed(1),+zone.target.toFixed(1),+zone.t.toFixed(1)],b:ents.filter(function(e){return e.kind==='b'}).map(function(e){return [e.i,+e.x.toFixed(2),+e.z.toFixed(2),+e.yaw.toFixed(2),Math.ceil(e.hp),e.alive?1:0,e.flash>0?1:0]})})}}
  }
  var stateAcc=0;
  function hostRound(){
    var seed=(Math.random()*1e9)|0,maps=Object.keys(MAPS);
    round={n:(round?round.n:0)+1,seed:seed,map:maps[(round?round.n:0)%3],phase:'play',t0:performance.now()};
    /* en salon entre potes : pas de bots dès qu'on est au moins 2 (quelques bots seulement si tu es seul) */
    var nb=net.players.length>=2?0:4;
    var msg={t:'fb-round',n:round.n,seed:seed,map:round.map,nb:nb};
    net.broadcast(msg);startRound(msg);
  }
  function startRound(m){
    mapId=m.map;mode='br';round={n:m.n,seed:m.seed,map:m.map,phase:'play',t0:performance.now()};
    reset(m.seed);center('');
    var R=rng(m.seed+3),sl=Math.max(0,net.slot(net.me.id));
    for(var i=0;i<m.nb;i++){var c=cellC(OPEN[Math.floor(R()*OPEN.length)]);addBot(i,c.x,c.z)}
    var sp=cellC(OPEN[Math.floor(rng(m.seed+11+sl*97)()*OPEN.length)]);P.x=sp.x;P.z=sp.z;
    Object.keys(remotes).forEach(function(k){remotes[k].al=1});
    $('fps-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);sfx.play('go');addFeed('Manche '+m.n+' · '+MAPS[m.map]);hud();
  }
  function remote(id,d){var r=remotes[id];if(!r){r=remotes[id]={id:id,kind:'p',x:d.x,z:d.z,tx:d.x,tz:d.z,yaw:0,al:1,n:d.n||'?',sk:0,m:null};}return r}
  net.on(function(m,from){
    if(!online)return;
    if(m.t==='rel'&&m.d){var d=m.d,id=m.from;
      if(d.g==='fb'){if(round&&d.r!==round.n){if(remotes[id])remotes[id].al=0;return}var r=remote(id,d);r.tx=d.x;r.tz=d.z;r.y=d.y;r.yaw=d.yw;r.hp=d.hp;r.al=d.al;r.n=(d.n||'?')+(d.afk?' (bot)':'');r.sk=d.sk||0;if(d.sh!==r.sh){if(r.sh!==undefined&&Math.hypot(r.x-P.x,r.z-P.z)<35)sfx.play('shoot');r.sh=d.sh}r.w=d.w}
      if(d.g==='fbhit'&&d.to===net.me.id&&!dead){hurt(d.d,d.by)}
      if(d.g==='fbdie'){var who=(remotes[id]&&remotes[id].n)||'?';if(remotes[id])remotes[id].al=0;addFeed((d.by?d.by+' a éliminé ':'')+who);if(d.by===net.me.name){kills++;sfx.play('kill');hud()}}
      if(d.g==='fbloot')removeItem(d.i);
      if(d.g==='fchat')chatAdd(d.n||'?',d.t,false);
      return}
    if(m.t==='fb-round'&&!net.isHost){startRound(m);return}
    if(m.t==='fb-end'&&!net.isHost&&round){round.phase='end';endRound(m.w);return}
    if(m.t==='fb-feed'&&!net.isHost){addFeed(m.txt);return}
    if(m.t==='fb-dmg'&&!dead){hurt(m.d,m.by);return}
    if(m.t==='fb-s'&&!net.isHost&&round&&m.r===round.n){
      zone=zone||{};zone.x=m.z[0];zone.z=m.z[1];if(zone.r==null)zone.r=m.z[2];zone.r+=(m.z[2]-zone.r)*.5;zone.target=m.z[3];zone.t=m.z[4];
      m.b.forEach(function(s){var b=ents.filter(function(e){return e.kind==='b'&&e.i===s[0]})[0];if(!b)return;b.tx=s[1];b.tz=s[2];b.yaw=s[3];b.hp=s[4];if(b.alive&&!s[5]){b.alive=false;b.dieT=1.2}if(s[6]&&Math.hypot(b.x-P.x,b.z-P.z)<30)sfx.play('shoot')});
      return}
    if(net.isHost){
      if(m.t==='fb-hit'){var b=ents.filter(function(e){return e.kind==='b'&&e.i===m.b})[0];if(b&&b.alive){var was=b.alive;damageEnt(b,m.d,m.by,false);if(was&&!b.alive){var pid=from;net.to(pid,{t:'fb-kill'})}}return}
      if(m.t==='fb-hello'){if(round)net.to(from,{t:'fb-round',n:round.n,seed:round.seed,map:round.map,nb:ents.filter(function(e){return e.kind==='b'}).length});return}
      if(m.t==='players'&&running){var ids=m.players.map(function(p){return p.id});Object.keys(remotes).forEach(function(k){if(ids.indexOf(k)<0){if(remotes[k].m)scene.remove(remotes[k].m);delete remotes[k]}});return}
      if(m.t==='left'){if(remotes[m.id]){if(remotes[m.id].m)scene.remove(remotes[m.id].m);sys((remotes[m.id].n||'Un joueur')+' est parti');delete remotes[m.id]}return}
    }else{
      if(m.t==='fb-kill'){kills++;sfx.play('kill');hud();return}
      if(m.t==='players'){var ids2=m.players.map(function(p){return p.id});Object.keys(remotes).forEach(function(k){if(ids2.indexOf(k)<0){if(remotes[k].m&&scene)scene.remove(remotes[k].m);delete remotes[k]}});return}
      if(m.t==='closed'){online=false;running=false;cancelAnimationFrame(raf);showEnd('Partie terminée','L\'hôte a fermé le serveur. Clique sur « Partie en ligne » pour en trouver ou en créer un autre.')}
    }
  });
  net.on(function(m){if(m.t==='players'&&online&&net.isHost){var known=Object.keys(remotes);m.players.forEach(function(p){if(p.id!=='host'&&known.indexOf(p.id)<0&&!seenJoin[p.id]){seenJoin[p.id]=1;sys(p.name+' a rejoint la partie');if(running)net.to(p.id,{t:'launch',game:'fps'})}})}});
  var seenJoin={};
  /* Partie en ligne façon serveur : on rejoint le premier serveur de battle royale ouvert, sinon on en crée un */
  function goOnline(){
    var name=PP.myName()||('Joueur'+(100+Math.random()*900|0));PP.setName(name);
    var btn=$('fps-online');btn.disabled=true;btn.textContent='Recherche d\'un serveur…';
    if(PP.lobby)PP.lobby.refresh();
    setTimeout(function(){
      var l=[];
      function done(){btn.disabled=false;btn.textContent='Partie en ligne'}
      if(net.inRoom()&&!net.isHost){done();beginOnline();return}
      if(net.inRoom()&&net.isHost&&PP.setRoomGame){done();PP.setRoomGame('fps-br');beginOnline();return}
      if(l.length){
        net.join(l[0].code,name,function(err){done();if(err){PP.toast('Serveur plein ou fermé, on en crée un','warn');hostServer();return}PP.toast('Serveur '+l[0].code+' rejoint','ok');beginOnline()});
      }else hostServer();
      function hostServer(){net.host(name,function(err,code){done();if(err){PP.toast(err,'warn');return}if(PP.setRoomGame)PP.setRoomGame('fps-br');PP.toast('Salon '+code+' créé : donne ce code à tes potes (bouton salon en haut)','ok');beginOnline()})}
    },1600);
  }
  function beginOnline(){
    online=true;auth=net.isHost;mode='br';remotes={};UI.chat.hidden=false;UI.log.innerHTML='';sys('Appuie sur T pour écrire dans le chat');lock();
    if(auth)hostRound();else{$('fps-title').textContent='Connexion au serveur';$('fps-msg').textContent='On attend la manche en cours.';$('fps-start').hidden=true;net.send({t:'fb-hello'})}
  }

  /* ---------- Rendu ---------- */
  var sway={x:0,y:0},mouseDX=0,mouseDY=0;
  function render(){
    if(!R3||!scene||!P)return;
    var bob=Math.sin(P.bob)*.05,fov=aiming?GUNS[P.gun].zoom:PP.settings.fov;
    cam.fov+=(fov-cam.fov)*.25;cam.updateProjectionMatrix();
    shakeT=Math.max(0,shakeT-.016);var sk=shakeT*.25;cam.position.set(P.x+(Math.random()-.5)*sk,EYE+P.y+(dead?-1.2:bob)+(Math.random()-.5)*sk,P.z);cam.rotation.set(P.pitch+P.kick*.5,P.yaw,(dead?.4:0)+(Math.random()-.5)*sk*.3);
    R3.clear();R3.render(scene,cam);
    var sc=aiming&&P.gun==='sniper'&&cam.fov<30;UI.scope.classList.toggle('on',!!sc);UI.cross.style.opacity=aiming||dead?0:1;
    if(viewGun&&!sc&&!dead){
      var ax=aiming?0:.2,ay=aiming?-.1:-.19,az=aiming?-.32:-.42;
      viewGun.position.set(ax+(aiming?0:Math.cos(P.bob*.5)*.012),ay+(aiming?0:Math.abs(Math.sin(P.bob*.5))*.015),az+P.kick*.6);
      sway.x+=(-mouseDX*.0006-sway.x)*.15;sway.y+=(mouseDY*.0006-sway.y)*.15;mouseDX*=.6;mouseDY*=.6;
      var rp=P.rel>0?1-P.rel/GUNS[P.gun].rel:0,rs=Math.sin(rp*Math.PI);
      viewGun.position.x+=sway.x;viewGun.position.y+=sway.y;
      var G=viewGun.userData.gun,ud=G?G.userData:{};
      P.fireT=Math.max(0,(P.fireT||0)-.016*8);P.pumpT=Math.max(0,(P.pumpT||0)-.016*3);P.boltT=Math.max(0,(P.boltT||0)-.016*2.4);
      function reset(o){if(o){o.position.copy(o.userData.p0);o.rotation.copy(o.userData.r0);o.visible=true}}
      ['slide','mag','pump','bolt'].forEach(function(k){reset(ud[k])});
      if(ud.slide)ud.slide.position.z+=P.fireT*.06;
      if(ud.pump&&P.pumpT>0&&P.pumpT<1.4){var pk=Math.sin((1.4-P.pumpT)/1.4*Math.PI);ud.pump.position.z+=pk*.14}
      if(ud.bolt&&P.boltT>0&&P.boltT<1.4){var bk=(1.4-P.boltT)/1.4;ud.bolt.rotation.z=Math.sin(Math.min(1,bk*2)*Math.PI/2)*1.2*(bk<.5?1:Math.max(0,1-(bk-.5)*2)*1);ud.bolt.position.z+=Math.sin(bk*Math.PI)*.07}
      var rot=[P.kick*1.2,sway.x*2,0],dy=0,dz=0;
      if(P.rel>0){var R0=rp;
        if(R0<.22){var a1=R0/.22;rot[0]-=a1*.25;rot[2]+=a1*.6;dy-=a1*.02}
        else if(R0<.78){rot[0]-=.25;rot[2]+=.6;dy-=.02;
          if(P.gun==='shotgun'){var sh=(R0-.22)/.56*4;dy+=Math.abs(Math.sin(sh*Math.PI))*.03;if(Math.floor(sh)!==P.relSnd){P.relSnd=Math.floor(sh);sfx.play('tick')}}
          else if(ud.mag){var mm=(R0-.22)/.56;if(mm<.45){ud.mag.position.y-=mm/.45*.35;if(P.relSnd===0&&mm>.1){P.relSnd=1;sfx.play('tick')}}else{var mi=(mm-.45)/.55;ud.mag.position.y-=(1-mi)*.35;if(P.relSnd===1&&mi>.9){P.relSnd=2;sfx.play('pickup')}}}}
        else{var a3=(R0-.78)/.22,e3=1-Math.pow(1-a3,3);rot[0]-=.25*(1-e3);rot[2]+=.6*(1-e3);dy-=.02*(1-e3);
          if(ud.slide)ud.slide.position.z+=Math.sin(a3*Math.PI)*.07;if(ud.pump)ud.pump.position.z+=Math.sin(a3*Math.PI)*.14;if(ud.bolt){ud.bolt.rotation.z=Math.sin(a3*Math.PI)*1.2;ud.bolt.position.z+=Math.sin(a3*Math.PI)*.07}
          if(P.relSnd<3&&a3>.4){P.relSnd=3;sfx.play('ui')}}}
      viewGun.position.y+=dy;viewGun.position.z+=dz;viewGun.rotation.set(rot[0],rot[1],rot[2]);
      if(viewGun.userData.core)viewGun.userData.core.material.opacity*=.45;
      UI.cross.style.transform='translate(-50%,-50%) scale('+(1+P.kick*3.5+(isMoving()?.25:0))+')';
      R3.clearDepth();R3.render(vscene,vcam);
    }
    muzzle&&(muzzle.material.opacity*=.5);muzzleL.intensity*=.5;
    drawMini();
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){if(!paused||online)step(dt);if(running)render();raf=requestAnimationFrame(loop)}}

  /* ---------- Entrées ---------- */
  var KM={z:'F',w:'F',ArrowUp:'F',s:'B',ArrowDown:'B',q:'L',a:'L',ArrowLeft:'L',d:'R',ArrowRight:'R'};
  document.addEventListener('keydown',function(e){
    if(PP.cur()!=='fps'||chatOpen)return;if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;
    var k=e.key.length===1?e.key.toLowerCase():e.key;lastInput=performance.now();
    if(!running)return;
    if(KM[k]){keys[KM[k]]=true;e.preventDefault()}
    if(k==='Shift')keys.SH=true;if(k===' '){keys.J=true;e.preventDefault()}
    if(k==='r')reload();if(k>='1'&&k<='4')switchGun(ORDER[+k-1]);
    if(k==='m')bigMap=!bigMap;
    if((k==='t'||k==='Enter')&&online){e.preventDefault();openChat()}
  });
  document.addEventListener('keyup',function(e){var k=e.key.length===1?e.key.toLowerCase():e.key;if(KM[k])keys[KM[k]]=false;if(k==='Shift')keys.SH=false});
  window.addEventListener('blur',function(){keys={};mouseDown=false});
  cv.addEventListener('mousedown',function(e){
    lastInput=performance.now();if(!running)return;
    if(document.pointerLockElement!==cv){lock();paused=false;$('fps-lockhint').hidden=true;return}
    if(e.button===0){mouseDown=true;fire()}if(e.button===2){if(P.rel<=0&&!dead)aiming=true}
  });
  document.addEventListener('mouseup',function(e){if(e.button===0)mouseDown=false;if(e.button===2)aiming=false});
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  cv.addEventListener('wheel',function(e){if(!running)return;e.preventDefault();cycle(e.deltaY>0?1:-1)},{passive:false});
  document.addEventListener('mousemove',function(e){if(document.pointerLockElement!==cv||!P||dead)return;mouseDX+=e.movementX;mouseDY+=e.movementY;lastInput=performance.now();var s=(aiming?(cam.fov/75)*.0026:.0026)*PP.settings.sens/100;P.yaw-=e.movementX*s;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-e.movementY*s*(PP.settings.invY?-1:1)))});
  document.addEventListener('pointerlockchange',function(){if(PP.cur()!=='fps'||!running)return;var l=document.pointerLockElement===cv;$('fps-lockhint').hidden=l||chatOpen;if(!l&&!online&&!chatOpen){paused=true;PP.pause(true)}if(l)paused=false});
  document.addEventListener('pp-resume',function(){if(PP.cur()!=='fps'||!running)return;lock();paused=false;$('fps-lockhint').hidden=true});
  document.addEventListener('pp-settings',function(){if(!R3)return;var q=PP.settings.q,dpr=window.devicePixelRatio||1;R3.setPixelRatio(q==='haute'?Math.min(1.5,dpr):q==='basse'?.7:1);R3.setSize(cv.width,cv.height,false)});
  function lock(){if(cv.requestPointerLock&&matchMedia('(hover:hover)').matches)try{var r=cv.requestPointerLock();if(r&&r.catch)r.catch(function(){})}catch(e){}}
  function unlock(){if(document.pointerLockElement===cv&&document.exitPointerLock)document.exitPointerLock()}
  // tactile
  var tl=null;
  cv.addEventListener('touchstart',function(e){var t=e.touches[0];tl={x:t.clientX,y:t.clientY};lastInput=performance.now()},{passive:true});
  cv.addEventListener('touchmove',function(e){if(!tl||!P)return;var t=e.touches[0];P.yaw-=(t.clientX-tl.x)*.006;P.pitch=Math.max(-1.4,Math.min(1.4,P.pitch-(t.clientY-tl.y)*.006));tl={x:t.clientX,y:t.clientY};e.preventDefault()},{passive:false});
  pk=PP.held('fps-pad',{},function(k){lastInput=performance.now();if(k==='S'){mouseDown=true;fire()}if(k==='A')aiming=!aiming;if(k==='W')reload()},function(k){if(k==='S')mouseDown=false});

  /* ---------- Menus ---------- */
  var DESC={zombie:'Rôdeurs, coureurs, cracheurs et mastodontes, par vagues. Ramasse les armes, munitions, soins et pièces. Clic droit pour viser, R pour recharger.',br:'Toi contre 9 bots sur la carte choisie. La zone rétrécit, ramasse des armes. Pour jouer avec tes potes, clique sur « Partie en ligne » : ça crée un salon privé, tu leur donnes le code, et vous jouez entre vous sans bots.'};
  function menu(){
    $('fps-title').textContent=mode==='zombie'?'Zombies':'Battle royale';$('fps-msg').textContent=DESC[mode];$('fps-start').textContent=mode==='zombie'?'Entrer dans le bunker':'Jouer contre les bots';$('fps-start').hidden=false;$('fps-online').hidden=mode!=='br';$('fps-ov').hidden=false;
    $('fps-modes').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x.dataset.m===mode)});
    $('fps-maps').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x.dataset.map===mapId)});
    if(reset())render();
  }
  $('fps-modes').addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b||running)return;mode=b.dataset.m;menu()});
  $('fps-maps').addEventListener('click',function(e){var b=e.target.closest('[data-map]');if(!b||running||online)return;mapId=b.dataset.map;menu()});
  $('fps-online').addEventListener('click',function(){mode='br';goOnline()});
  function start(){
    if(net.inRoom()){if(net.isHost){if(!round||!running)beginOnline();else hostRound()}return}
    online=false;auth=true;UI.chat&&(UI.chat.hidden=true);
    if(!reset())return;
    if(mode==='br'){round={n:1,seed:0,map:mapId,phase:'play',t0:performance.now()};for(var i=0;i<9;i++){var s=spawnFar(14);addBot(i,s.x,s.z)}}
    $('fps-ov').hidden=true;running=true;paused=false;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);lock();sfx.play('go');center('');
    if(mode==='zombie'){waveT=2.5;center('PRÉPARE-TOI')}
    hud();
  }
  $('fps-start').addEventListener('click',start);
  // skins
  function skinsHtml(){
    var c=coins();
    function row(list,pre,cur){return list.map(function(s,i){var id=pre+i,own=skins.owned.indexOf(id)>=0||!s.p;return '<button type="button" class="sk'+(cur===i?' on':'')+'" data-sk="'+id+'"><i style="background:#'+('00000'+s.c.toString(16)).slice(-6)+'"></i><b>'+esc(s.n)+'</b><small>'+(cur===i?'équipé':own?'à toi':s.p+' pièces')+'</small></button>'}).join('')}
    return '<div class="sk-head"><b>Skins</b><span>'+c+' pièces</span></div><p class="sk-l">Tenue (tes bras, et ce que voient les autres en ligne)</p><div class="sk-row">'+row(CH_SKINS,'c',skins.ch)+'</div><p class="sk-l">Arme</p><div class="sk-row">'+row(GUN_SKINS,'g',skins.gun)+'</div><p class="sk-l muted">Gagne des pièces en ramassant celles des zombies et du battle royale.</p><button type="button" class="ghost" id="fps-skins-close">Fermer</button>';
  }
  function openSkins(){var p=$('fps-skins');p.innerHTML=skinsHtml();p.hidden=false;$('fps-skins-close').onclick=function(){p.hidden=true}}
  $('fps-skins-btn').addEventListener('click',openSkins);
  $('fps-skins').addEventListener('click',function(e){
    var b=e.target.closest('[data-sk]');if(!b)return;var id=b.dataset.sk,list=id[0]==='c'?CH_SKINS:GUN_SKINS,i=+id.slice(1),s=list[i],own=skins.owned.indexOf(id)>=0||!s.p;
    if(!own){if(coins()<s.p){PP.toast('Il te manque '+(s.p-coins())+' pièces','warn');return}coins(coins()-s.p);skins.owned.push(id);sfx.play('win');PP.toast(s.n+' débloqué','ok')}
    if(id[0]==='c')skins.ch=i;else skins.gun=i;saveSkins();if(P&&vscene)setViewGun();openSkins();
  });

  PP._fps=function(){return {reload:reload,fire:fire,P:P,ents:ents,zone:zone,items:items,remotes:remotes,round:round,online:online,setMode:function(m){mode=m}}};
  PP.games.fps={
    open:function(){if(!init())return;$('fps-lockhint').hidden=true;$('fps-skins').hidden=true;
      if(online&&net.inRoom()){if(round&&!running){running=true;last=0;raf=requestAnimationFrame(loop)}return}
      online=false;UI.chat.hidden=true;
      if(mp.lobby('fps','Battle royale en ligne')){$('fps-maps').hidden=true;$('fps-online').hidden=true;mode='br';reset();render();if(!net.isHost)net.send({t:'fb-hello'});online=true;auth=net.isHost;UI.chat.hidden=false;return}
      $('fps-maps').hidden=false;menu()},
    close:function(){if(running){running=false;cancelAnimationFrame(raf)}unlock();keys={};mouseDown=false;aiming=false}
  };
})();
