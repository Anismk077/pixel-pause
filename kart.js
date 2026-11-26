/* Pixel Pause — Pixel Kart 3D : vrais circuits en 3D (Ville, Désert, Neige), karts pilotés par les persos des joueurs,
   dérapage avec mini-turbo, caisses à objets (turbo, flaque d'huile, boule chercheuse), 3 tours.
   Solo contre 5 karts, duel en écran partagé, ou en salon (chacun sur son appareil). */
(function(){
  'use strict';
  var $=PP.$,sfx=PP.sfx,net=PP.net,mp=PP.mp,cv=$('kt-cv');cv.width=960;cv.height=540;
  var R=null,scene,cams=[],K=[],S=null,raf=0,last=0,running=false,humans=1,mapId=PP.store('kt-map')||'ville',KEYS={},TOUCH={};
  var LAPS=3,W=16,NS=1400;
  var MAPS={
    ville:{n:'Ville',pts:[[0,0],[120,0],[185,35],[195,115],[150,170],[70,165],[25,115],[-40,95],[-110,125],[-175,85],[-180,5],[-120,-55],[-45,-45]],sky:0xf3dcb8,ground:0x55585f,grass:0x6d6f76,deco:'ville'},
    desert:{n:'Désert',pts:[[0,0],[150,-25],[225,40],[205,135],[105,145],[65,205],[-60,215],[-145,150],[-120,65],[-205,15],[-150,-85],[-60,-65]],sky:0xf6d29a,ground:0xd9a86a,grass:0xe2b878,deco:'desert'},
    neige:{n:'Neige',pts:[[0,0],[105,10],[165,75],[115,135],[165,205],[60,255],[-45,205],[-20,125],[-105,95],[-165,20],[-105,-65]],sky:0xd8e6f2,ground:0xf4f7fb,grass:0xe6eef6,deco:'neige'}};
  var COLS=[0xe2361b,0x3a6ad8,0xf3c623,0x3fbf6a,0x7c46c8,0xff8a1e,0xf08bb0,0x4ad0d8],NAMES=['Rex','Nova','Kiki','Turbo','Zed','Lou','Momo'];
  var TRK=null;
  /* ---------- circuit ---------- */
  function buildTrack(){var M=MAPS[mapId],curve=new THREE.CatmullRomCurve3(M.pts.map(function(p){return new THREE.Vector3(p[0],0,p[1])}),true,'centripetal');
    var P=curve.getSpacedPoints(NS),T=[],N=[];P.pop();for(var i=0;i<NS;i++){var a=P[(i+NS-1)%NS],b=P[(i+1)%NS],t=b.clone().sub(a).normalize();T.push(t);N.push(new THREE.Vector3(-t.z,0,t.x))}
    var len=0;for(var j=0;j<NS;j++)len+=P[j].distanceTo(P[(j+1)%NS]);TRK={P:P,T:T,N:N,len:len,step:len/NS,M:M}}
  function ribbon(w0,w1,y,mat,rep){var pos=[],uv=[],idx=[],acc=0;for(var i=0;i<=NS;i++){var k=i%NS,p=TRK.P[k],n=TRK.N[k];pos.push(p.x+n.x*w0,y,p.z+n.z*w0,p.x+n.x*w1,y,p.z+n.z*w1);uv.push(0,acc/(rep||8),1,acc/(rep||8));acc+=TRK.step;if(i<NS){var q=i*2;idx.push(q,q+1,q+2,q+1,q+3,q+2)}}
    var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();var m=new THREE.Mesh(g,mat);m.receiveShadow=true;scene.add(m);return m}
  function tex(w,h,fn,rx,ry){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rx)t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
  function lam(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))}
  function buildScene(){scene=new THREE.Scene();var M=TRK.M;scene.background=new THREE.Color(M.sky);scene.fog=new THREE.Fog(M.sky,120,420);
    scene.add(new THREE.HemisphereLight(0xffffff,0x707060,.95));
    /* v23 : le soleil suit le joueur avec une petite zone d'ombre → ombres nettes au lieu de grosses taches floues */
    var sun=new THREE.DirectionalLight(0xfff0d6,1.35);sun.position.set(40,70,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;var sc=sun.shadow.camera;sc.left=sc.bottom=-70;sc.right=sc.top=70;sc.near=1;sc.far=220;scene.add(sun);scene.add(sun.target);S.sun=sun;
    /* sol avec un peu de grain (au lieu d'un aplat) */
    var grT=tex(128,128,function(g,w,h){var c=new THREE.Color(M.grass);g.fillStyle='#'+c.getHexString();g.fillRect(0,0,w,h);for(var i=0;i<900;i++){var v=Math.random();g.fillStyle=v<.5?'rgba(0,0,0,'+(.03+Math.random()*.05)+')':'rgba(255,255,255,'+(.03+Math.random()*.05)+')';g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*3,2+Math.random()*3)}},90,90);
    var gr=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshLambertMaterial({map:grT}));gr.rotation.x=-Math.PI/2;gr.position.y=-.05;gr.receiveShadow=true;scene.add(gr);
    var road=tex(64,256,function(g,w,h){g.fillStyle=M.deco==='neige'?'#8a929c':M.deco==='desert'?'#7a6a5a':'#3e3d44';g.fillRect(0,0,w,h);for(var i=0;i<500;i++){g.fillStyle='rgba(255,255,255,'+Math.random()*.06+')';g.fillRect(Math.random()*w,Math.random()*h,2,2)}g.fillStyle='rgba(255,255,255,.75)';g.fillRect(w/2-2,0,4,h*.45);
      /* lignes blanches continues le long des bords + légère usure au centre des voies */
      g.fillStyle='rgba(255,255,255,.85)';g.fillRect(2,0,3,h);g.fillRect(w-5,0,3,h);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(w*.22,0,6,h);g.fillRect(w*.72,0,6,h)});
    ribbon(-W/2,W/2,0,new THREE.MeshLambertMaterial({map:road}),10);
    var curb=tex(16,64,function(g,w,h){g.fillStyle='#e2361b';g.fillRect(0,0,w,h/2);g.fillStyle='#f1ece2';g.fillRect(0,h/2,w,h/2)});ribbon(W/2,W/2+1.4,.02,new THREE.MeshLambertMaterial({map:curb}),4);ribbon(-W/2-1.4,-W/2,.02,new THREE.MeshLambertMaterial({map:curb}),4);
    /* barrières */
    var bm=lam(M.deco==='neige'?0x3a6ad8:0xf1ece2),bm2=lam(0xe2361b);for(var i=0;i<NS;i+=6){[-1,1].forEach(function(s){var p=TRK.P[i],n=TRK.N[i],b=new THREE.Mesh(new THREE.BoxGeometry(.5,.9,TRK.step*6.1),(Math.floor(i/6)%2)?bm:bm2);b.position.set(p.x+n.x*s*(W/2+4.5),.45,p.z+n.z*s*(W/2+4.5));b.rotation.y=Math.atan2(TRK.T[i].x,TRK.T[i].z);scene.add(b)})}
    /* ligne de départ en damier et arche */
    var chk=tex(64,16,function(g){for(var x=0;x<16;x++)for(var y=0;y<4;y++){g.fillStyle=(x+y)%2?'#141210':'#ffffff';g.fillRect(x*4,y*4,4,4)}});var sl=new THREE.Mesh(new THREE.PlaneGeometry(W,2.5),new THREE.MeshLambertMaterial({map:chk}));sl.rotation.x=-Math.PI/2;sl.rotation.z=-Math.atan2(TRK.T[0].x,TRK.T[0].z);sl.position.set(TRK.P[0].x,.03,TRK.P[0].z);scene.add(sl);
    var arch=new THREE.Group();[-1,1].forEach(function(s){var po=new THREE.Mesh(new THREE.BoxGeometry(.8,8,.8),lam(0x141210));po.position.set(s*(W/2+2),4,0);arch.add(po)});var ban=new THREE.Mesh(new THREE.BoxGeometry(W+5,1.8,.4),new THREE.MeshLambertMaterial({map:tex(512,64,function(g,w,h){g.fillStyle='#e2361b';g.fillRect(0,0,w,h);g.font='400 44px Anton, Impact';g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText('PIXEL KART · '+M.n.toUpperCase(),w/2,h/2+2)})}));ban.position.y=8.4;arch.add(ban);arch.position.copy(TRK.P[0]);arch.rotation.y=Math.atan2(TRK.T[0].x,TRK.T[0].z);scene.add(arch);
    /* décor */
    var rnd=function(){return Math.random()};for(var d=0;d<260;d++){var k=Math.floor(rnd()*NS),s2=rnd()<.5?-1:1,off=W/2+10+rnd()*60,p2=TRK.P[k],n2=TRK.N[k],x=p2.x+n2.x*s2*off,z=p2.z+n2.z*s2*off;
      if(nearTrack(x,z)<W/2+8)continue;var o=deco(M.deco);o.position.set(x,0,z);o.rotation.y=rnd()*6;scene.add(o)}
    /* caisses à objets */
    S.boxes=[];[.18,.5,.78].forEach(function(f){var k=Math.floor(f*NS);for(var l=-1.5;l<=1.5;l++){var p=TRK.P[k],n=TRK.N[k],m=itemBoxMesh();m.position.set(p.x+n.x*l*3.2,1.1,p.z+n.z*l*3.2);scene.add(m);S.boxes.push({m:m,t:0})}});
    S.slicks=[];S.balls=[]}
  var WIN=null;function winTex(){if(!WIN)WIN=tex(64,64,function(g,w,h){g.fillStyle='#fff';g.fillRect(0,0,w,h);for(var y=6;y<h;y+=16)for(var x=6;x<w;x+=16){g.fillStyle=Math.random()<.25?'#f6e2a0':'#5d6a7a';g.fillRect(x,y,8,9)}});return WIN}
  function deco(kind){var g=new THREE.Group();if(kind==='ville'){var h=8+Math.random()*30,c=[0xc9b79a,0x9fb3c8,0xd29a7a,0xb5c2a0,0xe0c98a][Math.floor(Math.random()*5)],bw=8+Math.random()*8,bd=8+Math.random()*8;
    /* façades avec fenêtres (texture partagée, répétée selon la taille) */
    var wt=winTex().clone();wt.needsUpdate=true;wt.repeat.set(Math.round(bw/4),Math.round(h/4));var b=new THREE.Mesh(new THREE.BoxGeometry(bw,h,bd),new THREE.MeshLambertMaterial({color:c,map:wt}));b.position.y=h/2;b.castShadow=true;g.add(b);var r=new THREE.Mesh(new THREE.BoxGeometry(3,1.2,3),lam(0x5a5560));r.position.y=h+.6;g.add(r)}
    else if(kind==='desert'){if(Math.random()<.6){var cm=lam(0x4f8a3a);var t=new THREE.Mesh(new THREE.CylinderGeometry(.6,.7,5,8),cm);t.position.y=2.5;g.add(t);[-1,1].forEach(function(s){var a=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,2.2,8),cm);a.position.set(s*1.1,3,0);g.add(a);var a2=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,1.2,8),cm);a2.rotation.z=Math.PI/2;a2.position.set(s*.7,2.1,0);g.add(a2)})}else{var rk=new THREE.Mesh(new THREE.DodecahedronGeometry(2+Math.random()*4,0),lam(0xb0703a,{flatShading:true}));rk.position.y=1;rk.scale.y=.7;g.add(rk)}}
    else{var tr=new THREE.Mesh(new THREE.CylinderGeometry(.3,.4,1.6,6),lam(0x6b4a2a));tr.position.y=.8;g.add(tr);for(var i=0;i<3;i++){var f=new THREE.Mesh(new THREE.ConeGeometry(2.2-i*.5,2.6,8),lam(i%2?0xf4f7fb:0x2f6a4a,{flatShading:true}));f.position.y=2.2+i*1.5;g.add(f)}}
    g.traverse(function(o){if(o.isMesh)o.castShadow=true});var s=.9+Math.random()*.8;g.scale.setScalar(s);return g}
  function itemBoxMesh(){var t=tex(64,64,function(g,w,h){g.fillStyle='#f3c623';g.fillRect(0,0,w,h);g.strokeStyle='#141210';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);g.font='400 44px Anton, Impact';g.fillStyle='#141210';g.textAlign='center';g.textBaseline='middle';g.fillText('?',w/2,h/2+3)});return new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.6),new THREE.MeshLambertMaterial({map:t,transparent:true,opacity:.92}))}
  function nearTrack(x,z){var best=1e9;for(var i=0;i<NS;i+=8){var p=TRK.P[i],d=(p.x-x)*(p.x-x)+(p.z-z)*(p.z-z);if(d<best)best=d}return Math.sqrt(best)}
  function locate(k){var best=1e9,bi=k.si;for(var o=-40;o<=40;o++){var i=(k.si+o+NS)%NS,p=TRK.P[i],d=(p.x-k.x)*(p.x-k.x)+(p.z-k.z)*(p.z-k.z);if(d<best){best=d;bi=i}}
    var moved=bi-k.si;if(moved<-NS/2){if(k.half){k.lap++;k.half=false;k.lapT=0;if(k.me)onLap(k)}}else if(moved>NS/2){k.lap--}k.si=bi;if(bi>NS*.45&&bi<NS*.6)k.half=true;
    var p2=TRK.P[bi],n=TRK.N[bi];k.lat=(k.x-p2.x)*n.x+(k.z-p2.z)*n.z;k.prog=k.lap*NS+bi}
  /* ---------- karts ---------- */
  function kartMesh(col,av){var g=new THREE.Group(),body=new THREE.Group();g.add(body);var c=lam(col),dk=lam(0x1a1816),me=lam(0xc9c9cf);
    var ch=new THREE.Mesh(new THREE.BoxGeometry(1.5,.35,2.4),c);ch.position.y=.45;body.add(ch);var nose=new THREE.Mesh(new THREE.BoxGeometry(1.2,.3,.7),c);nose.position.set(0,.5,-1.4);nose.rotation.x=.2;body.add(nose);
    var bump=new THREE.Mesh(new THREE.BoxGeometry(1.7,.2,.25),dk);bump.position.set(0,.35,-1.75);body.add(bump);var seat=new THREE.Mesh(new THREE.BoxGeometry(.8,.7,.3),dk);seat.position.set(0,.85,.65);body.add(seat);
    var spoiler=new THREE.Mesh(new THREE.BoxGeometry(1.6,.08,.4),c);spoiler.position.set(0,1.15,1.25);body.add(spoiler);[-1,1].forEach(function(s){var st=new THREE.Mesh(new THREE.BoxGeometry(.08,.4,.08),dk);st.position.set(s*.6,.95,1.25);body.add(st)});
    var exh=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.4,8),me);exh.rotation.x=Math.PI/2;exh.position.set(.45,.55,1.35);body.add(exh);
    var wh=[];[[-.85,-.95],[.85,-.95],[-.85,.85],[.85,.85]].forEach(function(p,i){var w=new THREE.Group(),t=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.34,14),dk);t.rotation.z=Math.PI/2;w.add(t);var hub=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.36,8),me);hub.rotation.z=Math.PI/2;w.add(hub);w.position.set(p[0],.38,p[1]);body.add(w);wh.push(w)});
    var sw=new THREE.Mesh(new THREE.TorusGeometry(.2,.04,6,14),dk);sw.position.set(0,1.05,-.35);sw.rotation.x=-1.1;body.add(sw);
    var drv=null;if(av&&PP.perso&&PP.perso.build){drv=PP.perso.build(av);drv.scale.setScalar(.5);drv.position.set(0,.55,.45);var P=drv.userData.parts;P.legs.forEach(function(l){l.rotation.x=1.45});P.knees.forEach(function(k){k.rotation.x=-.9});P.arms.forEach(function(a){a.rotation.x=1.05});P.elbows.forEach(function(e){e.rotation.x=.5});body.add(drv)}
    var sp=new THREE.Group();[-1,1].forEach(function(s){var f=new THREE.Mesh(new THREE.SphereGeometry(.18,6,4),new THREE.MeshBasicMaterial({color:0x6fc8ff}));f.position.set(s*.85,.2,1.05);sp.add(f)});sp.visible=false;body.add(sp);
    g.traverse(function(o){if(o.isMesh)o.castShadow=true});return {g:g,body:body,wh:wh,drv:drv,sp:sp}}
  function mkKart(i,name,col,av,me,remote,pid){var k={i:i,name:name,col:col,me:me,remote:remote,pid:pid,x:0,z:0,h:0,v:0,si:0,lat:0,lap:0,half:false,prog:0,item:null,roll:0,boost:0,spin:0,drift:0,driftT:0,hop:0,done:0,lapT:0,ai:{lane:(Math.random()-.5)*8,skill:.9+Math.random()*.1,itemT:1+Math.random()*3},mesh:kartMesh(col,av)};
    var row=Math.floor(i/2),side=i%2?1:-1,si=(NS-6-row*5)%NS,p=TRK.P[si],n=TRK.N[si];k.si=si;k.x=p.x+n.x*side*3.4;k.z=p.z+n.z*side*3.4;k.h=Math.atan2(-TRK.T[si].x,-TRK.T[si].z);k.lap=-1;k.half=true;scene.add(k.mesh.g);return k}
  function randAv(){var O=PP.perso&&PP.perso.OPT,a={};if(!O)return null;Object.keys(O).forEach(function(k){a[k]=O[k][Math.floor(Math.random()*O[k].length)]});a.back='aucun';return a}
  function myAv(){try{return PP.perso.get()}catch(e){return null}}
  /* ---------- course ---------- */
  function setup(){buildTrack();S={t:-3.2,over:false,fin:[]};buildScene();K=[];cams=[];
    if(mp.on()){var pl=net.players.slice(0,8);pl.forEach(function(p,i){var me=p.id===net.me.id;K.push(mkKart(i,p.name,COLS[i%8],me?myAv():(p.av||randAv()),me,!me,p.id))})}
    else{for(var i=0;i<6;i++){var hum=i<humans;K.push(mkKart(i,hum?(humans>1?'J'+(i+1):'Toi'):NAMES[i-humans],COLS[i],hum&&i===0?myAv():randAv(),hum,false,null))}}
    K.forEach(function(k){if(k.me)cams.push({k:k,c:new THREE.PerspectiveCamera(68,16/9,.1,600)})});cams.forEach(function(c){placeCam(c,1)});
    if(!R){R=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;R.outputColorSpace=THREE.SRGBColorSpace}
    VW=0;fitSize();ui();render()}
  /* v23 : rendu à la vraie taille affichée (avant : 960×540 étiré → image floue en grand écran) */
  var VW=960,VH=540;
  function fitSize(){var w=Math.round(cv.clientWidth||960),h=Math.round(w*9/16);w=Math.max(320,Math.min(2560,w));h=Math.max(180,Math.min(1440,h));if(w===VW&&h===VH)return;VW=w;VH=h;R.setPixelRatio(Math.min(2,window.devicePixelRatio||1)*(w>1700?.85:1));R.setSize(w,h,false)}
  function ctl(k){if(k.remote)return null;var n=K.filter(function(q){return q.me}).indexOf(k),T=TOUCH,c={};
    if(humans>1&&!mp.on()){if(n===0)c={L:KEYS.KeyA,R:KEYS.KeyD,U:KEYS.KeyW,D:KEYS.KeyS,X:KEYS.ShiftLeft||KEYS.Space,I:KEYS.KeyE};else c={L:KEYS.ArrowLeft,R:KEYS.ArrowRight,U:KEYS.ArrowUp,D:KEYS.ArrowDown,X:KEYS.ShiftRight||KEYS.Numpad0,I:KEYS.Enter||KEYS.NumpadEnter||KEYS.ControlRight}}
    else c={L:KEYS.KeyA||KEYS.ArrowLeft||T.L,R:KEYS.KeyD||KEYS.ArrowRight||T.R,U:KEYS.KeyW||KEYS.ArrowUp||T.U,D:KEYS.KeyS||KEYS.ArrowDown||T.D,X:KEYS.ShiftLeft||KEYS.ShiftRight||KEYS.Space||T.X,I:KEYS.KeyE||KEYS.Enter||T.I};return c}
  function aiCtl(k){var look=(k.si+18)%NS,p=TRK.P[look],n=TRK.N[look],tx=p.x+n.x*k.ai.lane,tz=p.z+n.z*k.ai.lane,want=Math.atan2(-(tx-k.x),-(tz-k.z)),d=want-k.h;d=Math.atan2(Math.sin(d),Math.cos(d));
    if(Math.random()<.004)k.ai.lane=(Math.random()-.5)*9;var c={L:d>.04,R:d<-.04,U:true,D:false,X:Math.abs(d)>.35&&k.v>18,I:false};k.ai.itemT-=1/60;if(k.item&&k.ai.itemT<=0){c.I=true;k.ai.itemT=1+Math.random()*3}return c}
  function useItem(k){var it=k.item;if(!it||k.roll>0)return;k.item=null;
    if(it==='turbo'){k.boost=1.3;if(k.me)sfx.play('go')}
    else if(it==='huile'){var b=back(k,3);dropSlick(b.x,b.z,true)}
    else if(it==='boule'){var f=fwd(k,2.5);var m=new THREE.Mesh(new THREE.SphereGeometry(.5,14,10),new THREE.MeshStandardMaterial({color:0xe2361b,roughness:.3}));m.position.set(f.x,.6,f.z);scene.add(m);var tg=null,bp=-1e9;K.forEach(function(q){if(q!==k&&q.prog>k.prog&&(tg===null||q.prog<bp)){tg=q;bp=q.prog}});S.balls.push({m:m,x:f.x,z:f.z,si:k.si,tg:tg,t:6,by:k});if(mp.on()&&k.me)net.relay({g:'kart',ev:'ball',x:f.x,z:f.z,si:k.si,tg:tg?tg.pid:null})}
    if(k.me)ui()}
  function dropSlick(x,z,send){var m=new THREE.Mesh(new THREE.CircleGeometry(1.5,20),new THREE.MeshBasicMaterial({color:0x141210,transparent:true,opacity:.85}));m.rotation.x=-Math.PI/2;m.position.set(x,.05,z);scene.add(m);S.slicks.push({m:m,x:x,z:z,t:20});if(send&&mp.on())net.relay({g:'kart',ev:'slick',x:x,z:z})}
  function fwd(k,d){return {x:k.x-Math.sin(k.h)*d,z:k.z-Math.cos(k.h)*d}}
  function back(k,d){return {x:k.x+Math.sin(k.h)*d,z:k.z+Math.cos(k.h)*d}}
  function spinOut(k){if(k.shield){k.shield=0;return}k.spin=1.1;k.v*=.25;k.drift=0;if(k.me){sfx.play('lose')}}
  function stepKart(k,dt){var c=k.remote?null:(k.me?ctl(k):aiCtl(k));if(k.remote)return;if(S.t<0||k.done)c={L:0,R:0,U:S.t>-1&&c&&c.U,D:0,X:0,I:0};if(k.done&&!k.me)c=aiCtl(k);if(k.done&&k.me)c=aiCtl(k);
    var steer=(c.L?1:0)-(c.R?1:0),off=Math.abs(k.lat)>W/2+.6,maxV=(off?15:31)*(k.me?1:k.ai.skill*(1+Math.max(0,(meProg()-k.prog)/NS)*.25));if(k.boost>0){maxV=44;k.boost-=dt}
    if(k.spin>0){k.spin-=dt;k.v*=Math.pow(.3,dt);k.mesh.body.rotation.y+=dt*14;steer=0;c={}}else k.mesh.body.rotation.y*=.8;
    if(S.t>=0||k.boost>0){if(c.U)k.v+=(k.v<maxV?24:-8)*dt;else if(c.D)k.v-=34*dt;else k.v-=7*dt;if(k.v>maxV)k.v-=(k.v-maxV)*Math.min(1,dt*3)}k.v=Math.max(-8,k.v);
    /* dérapage : on maintient Maj (ou Espace) en tournant, plus c'est long plus le turbo est fort */
    if(c.X&&!k.drift&&Math.abs(steer)>0&&k.v>14&&k.hop<=0){k.drift=steer;k.driftT=0;k.hop=.25}
    if(k.drift){k.driftT+=dt;if(!c.X||k.v<10){if(k.driftT>.7){k.boost=Math.max(k.boost,k.driftT>1.5?1.2:.6);if(k.me)sfx.play('pickup')}k.drift=0}}
    k.hop=Math.max(0,k.hop-dt);var tr=k.drift?(k.drift*1.05+steer*.55):steer*1.6;var rate=tr*Math.min(1,Math.abs(k.v)/9)*(k.v<0?-1:1);k.h+=rate*dt;
    var slip=k.drift?k.drift*.35:0,vx=-Math.sin(k.h+slip)*k.v,vz=-Math.cos(k.h+slip)*k.v;k.x+=vx*dt;k.z+=vz*dt;
    locate(k);var lim=W/2+3.9;if(Math.abs(k.lat)>lim){var n=TRK.N[k.si],e=k.lat-Math.sign(k.lat)*lim;k.x-=n.x*e;k.z-=n.z*e;k.v*=.6;k.lat=Math.sign(k.lat)*lim;if(k.me)sfx.play('hit')}
    if(c.I)useItem(k);
    if(k.roll>0){k.roll-=dt;if(k.roll<=0){var r=Math.random(),ahead=K.filter(function(q){return q.prog>k.prog}).length;k.item=ahead>2?(r<.5?'turbo':r<.85?'boule':'huile'):ahead>0?(r<.4?'turbo':r<.7?'boule':'huile'):(r<.6?'huile':'turbo');if(k.me){sfx.play('win');ui()}}}
    if(k.me&&!k.done&&k.lap>=LAPS){k.done=S.t;S.fin.push(k);sfx.play('win');if(mp.on())net.relay({g:'kart',ev:'done',t:k.done});finishCheck()}
    if(!k.me&&!k.remote&&!k.done&&k.lap>=LAPS){k.done=S.t;S.fin.push(k);finishCheck()}}
  function meProg(){var m=K.filter(function(q){return q.me});return m.length?Math.max.apply(null,m.map(function(q){return q.prog})):0}
  function onLap(k){if(k.lap>0&&k.lap<LAPS){PP.toast&&0;pop(k.lap===LAPS-1?'DERNIER TOUR !':'TOUR '+(k.lap+1))}}
  function pop(t){var st=cv.parentNode,e=document.createElement('div');e.className='ag-pop';e.textContent=t;st.appendChild(e);setTimeout(function(){e.remove()},1300)}
  function finishCheck(){var mine=K.filter(function(q){return q.me});if(mine.every(function(q){return q.done})&&!S.over){S.over=true;setTimeout(results,2200)}}
  function results(){running=false;cancelAnimationFrame(raf);var rk=rank(),me=K.filter(function(q){return q.me})[0];var pos=rk.indexOf(me)+1;
    if(!mp.on()&&humans===1&&me.done){var bk='kt-best-'+mapId,b=PP.store(bk);if(!b||me.done<b){PP.store(bk,me.done)}if(pos===1)PP.stat&&PP.stat('kart','win')}
    $('kt-title').textContent=pos===1?'Victoire !':pos+'e place';$('kt-msg').innerHTML=rk.map(function(q,i){return (i+1)+'. '+PP.esc(q.name)+(q.done?' · '+PP.fmtTime(q.done):'')}).join('<br>');$('kt-start').hidden=mp.on()&&!net.isHost;$('kt-start').textContent='Rejouer';$('kt-ov').hidden=false;sfx.play(pos===1?'win':'lose')}
  function rank(){return K.slice().sort(function(a,b){if(a.done&&b.done)return a.done-b.done;if(a.done)return -1;if(b.done)return 1;return b.prog-a.prog})}
  function step(dt){S.t+=dt;var prevT=S.t-dt;if(prevT<0&&Math.floor(prevT)!==Math.floor(S.t)&&S.t<1){sfx.play(S.t>=0?'go':'count');if(S.t>=0)pop('GO !');else pop(String(-Math.floor(S.t)))}
    K.forEach(function(k){stepKart(k,dt)});
    /* chocs entre karts */
    for(var i=0;i<K.length;i++)for(var j=i+1;j<K.length;j++){var a=K[i],b=K[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<2.3&&d>0){var push=(2.3-d)/2,nx=dx/d,nz=dz/d;if(!a.remote){a.x-=nx*push;a.z-=nz*push}if(!b.remote){b.x+=nx*push;b.z+=nz*push}}}
    /* caisses, flaques, boules */
    S.boxes.forEach(function(bx){if(bx.t>0){bx.t-=dt;bx.m.visible=bx.t<=0;return}bx.m.rotation.y+=dt*1.5;bx.m.position.y=1.1+Math.sin(S.t*3+bx.m.position.x)*.15;K.forEach(function(k){if(k.remote||bx.t>0)return;if(Math.hypot(k.x-bx.m.position.x,k.z-bx.m.position.z)<2){bx.t=3;bx.m.visible=false;if(!k.item&&k.roll<=0){k.roll=1;if(k.me)sfx.play('tick')}}})});
    S.slicks.forEach(function(s){s.t-=dt;K.forEach(function(k){if(k.remote||k.spin>0)return;if(Math.hypot(k.x-s.x,k.z-s.z)<1.8){spinOut(k);s.t=0}});if(s.t<=0)scene.remove(s.m)});S.slicks=S.slicks.filter(function(s){return s.t>0});
    S.balls.forEach(function(b){b.t-=dt;var tgt=b.tg;var look=(b.si+10)%NS,p=TRK.P[look],tx=p.x,tz=p.z;if(tgt&&((tgt.prog-(b.si))%NS+NS)%NS<60){tx=tgt.x;tz=tgt.z}var dx=tx-b.x,dz=tz-b.z,d=Math.hypot(dx,dz)||1;b.x+=dx/d*52*dt;b.z+=dz/d*52*dt;
      var best=1e9,bi=b.si;for(var o=-5;o<=30;o++){var ii=(b.si+o+NS)%NS,q=TRK.P[ii],dd=(q.x-b.x)*(q.x-b.x)+(q.z-b.z)*(q.z-b.z);if(dd<best){best=dd;bi=ii}}b.si=bi;b.m.position.set(b.x,.6,b.z);
      K.forEach(function(k){if(k===b.by||b.t<=0)return;if(Math.hypot(k.x-b.x,k.z-b.z)<1.8){if(!k.remote)spinOut(k);b.t=0}});if(b.t<=0)scene.remove(b.m)});S.balls=S.balls.filter(function(b){return b.t>0});
    /* envoi en salon */
    if(mp.on()){S.sendT=(S.sendT||0)-dt;if(S.sendT<=0){S.sendT=.066;var m=K.filter(function(q){return q.me})[0];if(m)net.relay({g:'kart',x:+m.x.toFixed(2),z:+m.z.toFixed(2),h:+m.h.toFixed(3),v:+m.v.toFixed(1),lap:m.lap,si:m.si,sp:m.spin>0?1:0,dr:m.drift,b:m.boost>0?1:0})}}
    K.forEach(function(k){if(k.remote&&k.tx!=null){k.x+=(k.tx-k.x)*Math.min(1,dt*12);k.z+=(k.tz-k.z)*Math.min(1,dt*12);var dh=k.th-k.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));k.h+=dh*Math.min(1,dt*12);k.prog=k.lap*NS+k.si}});
    hud()}
  /* ---------- caméra : 3 vues (touche C), et la souris (ou le doigt) la fait tourner autour du kart ----------
     glisser = tourner/monter, molette = zoom, double-clic ou R = recentrer ; lâchée, elle revient doucement derrière */
  var VIEWS=[{n:'Normale',d:8.2,y:3.7},{n:'Proche',d:5.4,y:2.4},{n:'Haute',d:12,y:7.5}],CAM={view:Math.min(2,PP.store('kt-view')||0),yaw:0,pit:0,zoom:1,drag:null,idle:0};
  function placeCam(c,snap){var k=c.k,V=VIEWS[CAM.view],free=c===cams[0],yaw=free?CAM.yaw:0,pit=free?CAM.pit:0,zm=free?CAM.zoom:1;
    var dist=(V.d+Math.max(0,k.v-25)*.06)*zm,ang=k.h+yaw,hy=V.y*zm+pit*dist*.9;
    var px=k.x+Math.sin(ang)*dist*Math.cos(pit*.6),pz=k.z+Math.cos(ang)*dist*Math.cos(pit*.6),py=Math.max(1.2,hy),tgt=fwd(k,6*Math.cos(yaw));
    if(snap){c.c.position.set(px,py,pz)}else{var f=CAM.drag&&free?.35:.14;c.c.position.x+=(px-c.c.position.x)*f;c.c.position.z+=(pz-c.c.position.z)*f;c.c.position.y+=(py-c.c.position.y)*(f*.8)}
    var bl=Math.min(1,Math.abs(Math.atan2(Math.sin(yaw),Math.cos(yaw)))/1.2);c.c.lookAt(tgt.x+(k.x-tgt.x)*bl,1.2,tgt.z+(k.z-tgt.z)*bl);var fv=68+(k.boost>0?10:0)+Math.max(0,k.v-25)*.25;c.c.fov+=(fv-c.c.fov)*.1;c.c.updateProjectionMatrix()}
  function camTick(dt){if(CAM.drag)return;CAM.idle+=dt;if(CAM.idle>1.2){var r=Math.min(1,dt*2.2);CAM.yaw=Math.atan2(Math.sin(CAM.yaw),Math.cos(CAM.yaw))*(1-r);CAM.pit*=1-r}}
  function camView(){CAM.view=(CAM.view+1)%VIEWS.length;PP.store('kt-view',CAM.view);CAM.yaw=CAM.pit=0;CAM.zoom=1;pop('VUE '+VIEWS[CAM.view].n.toUpperCase())}
  cv.addEventListener('pointerdown',function(e){if(PP.cur()!=='kart')return;CAM.drag={x:e.clientX,y:e.clientY,id:e.pointerId};CAM.idle=0;cv.classList.add('drag');try{cv.setPointerCapture(e.pointerId)}catch(_){}});
  cv.addEventListener('pointermove',function(e){var d=CAM.drag;if(!d||d.id!==e.pointerId)return;var dx=e.clientX-d.x,dy=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;var s=(PP.settings&&PP.settings.sens?PP.settings.sens/100:1)*.008;CAM.yaw-=dx*s;CAM.pit=Math.max(-.35,Math.min(.9,CAM.pit+dy*s*.8));CAM.idle=0});
  ['pointerup','pointercancel'].forEach(function(ev){cv.addEventListener(ev,function(e){if(CAM.drag&&CAM.drag.id===e.pointerId){CAM.drag=null;cv.classList.remove('drag')}})});
  cv.addEventListener('wheel',function(e){if(PP.cur()!=='kart')return;e.preventDefault();CAM.zoom=Math.max(.6,Math.min(1.8,CAM.zoom*(e.deltaY>0?1.08:1/1.08)))},{passive:false});
  cv.addEventListener('dblclick',function(){CAM.yaw=CAM.pit=0;CAM.zoom=1});
  window.addEventListener('resize',function(){if(R&&PP.cur()==='kart'){fitSize();if(!running)render()}});
  function syncMeshes(){K.forEach(function(k){var g=k.mesh.g;g.position.set(k.x,k.hop>0?Math.sin(k.hop/.25*Math.PI)*.35:0,k.z);g.rotation.y=k.h+(k.drift?k.drift*.45:0);
      k.mesh.wh.forEach(function(w,i){w.children[0].rotation.x+=k.v*.05;if(i<2)w.rotation.y=k.me||!k.remote?((KEYS.KeyA||KEYS.ArrowLeft)&&k.me?.3:(KEYS.KeyD||KEYS.ArrowRight)&&k.me?-.3:0):0});
      k.mesh.sp.visible=!!k.drift&&k.driftT>.7;if(k.mesh.sp.visible)k.mesh.sp.children.forEach(function(s){s.material.color.setHex(k.driftT>1.5?0xff8a1e:0x6fc8ff);s.scale.setScalar(.7+Math.random()*.6)});
      if(k.mesh.drv){var P=k.mesh.drv.userData.parts;P.torso.rotation.z=(k.drift?k.drift*.15:0);P.head.rotation.y=k.drift?k.drift*.2:0}});}
  function render(){if(!R)return;fitSize();syncMeshes();cams.forEach(function(c){placeCam(c)});
    /* l'ombre suit le premier joueur */
    if(S&&S.sun&&cams[0]){var k0=cams[0].k;S.sun.position.set(k0.x+40,70,k0.z+30);S.sun.target.position.set(k0.x,0,k0.z);S.sun.target.updateMatrixWorld()}
    R.setScissorTest(cams.length>1);var hh=VH/2;
    if(cams.length>1){cams.forEach(function(c,i){c.c.aspect=VW/hh;c.c.updateProjectionMatrix();R.setViewport(0,i?0:hh,VW,hh);R.setScissor(0,i?0:hh,VW,hh);R.render(scene,c.c)})}
    else if(cams[0]){cams[0].c.aspect=VW/VH;cams[0].c.updateProjectionMatrix();R.setViewport(0,0,VW,VH);R.render(scene,cams[0].c)}drawMini()}
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(!running)return;if(PP.cur()!=='kart'){running=false;return}step(dt);camTick(dt);render();raf=requestAnimationFrame(loop)}
  /* ---------- interface ---------- */
  function ui(){var st=cv.parentNode,u=st.querySelector('.kt-ui');if(!u){u=document.createElement('div');u.className='kt-ui';u.innerHTML='<canvas class="kt-mini" width="170" height="170"></canvas><div class="kt-items"></div>';st.appendChild(u)}
    var mine=K.filter(function(q){return q.me});u.querySelector('.kt-items').innerHTML=mine.map(function(k,i){var ic={turbo:'⚡ TURBO',huile:'● HUILE',boule:'◉ BOULE'}[k.item]||(k.roll>0?'…':'—');return '<span class="kt-it'+(mine.length>1?' p'+(i+1):'')+'">'+(mine.length>1?k.name+' ':'')+'<b>'+ic+'</b></span>'}).join('')}
  function drawMini(){var c=cv.parentNode.querySelector('.kt-mini');if(!c||!TRK)return;var g=c.getContext('2d');if(!TRK.mm){var mn=[1e9,1e9],mx=[-1e9,-1e9];TRK.P.forEach(function(p){mn[0]=Math.min(mn[0],p.x);mn[1]=Math.min(mn[1],p.z);mx[0]=Math.max(mx[0],p.x);mx[1]=Math.max(mx[1],p.z)});var s=150/Math.max(mx[0]-mn[0],mx[1]-mn[1]);TRK.mm={mn:mn,s:s}}
    var M=TRK.mm,X=function(x){return 10+(x-M.mn[0])*M.s},Z=function(z){return 10+(z-M.mn[1])*M.s};g.clearRect(0,0,170,170);g.lineJoin='round';g.strokeStyle='rgba(20,18,16,.75)';g.lineWidth=9;g.beginPath();TRK.P.forEach(function(p,i){if(i%4)return;i?g.lineTo(X(p.x),Z(p.z)):g.moveTo(X(p.x),Z(p.z))});g.closePath();g.stroke();g.strokeStyle='#f1ece2';g.lineWidth=3;g.stroke();
    K.forEach(function(k){g.fillStyle='#'+('00000'+k.col.toString(16)).slice(-6);g.strokeStyle=k.me?'#fff':'#141210';g.lineWidth=k.me?3:1.5;g.beginPath();g.arc(X(k.x),Z(k.z),k.me?6:4.5,0,7);g.fill();g.stroke()})}
  function hud(){var mine=K.filter(function(q){return q.me})[0];if(!mine)return;var rk=rank();$('kt-pos').textContent=(rk.indexOf(mine)+1)+'/'+K.length;$('kt-lap').textContent=Math.max(1,Math.min(LAPS,mine.lap+1))+'/'+LAPS;$('kt-time').textContent=PP.fmtTime(Math.max(0,S.t));
    var b=PP.store('kt-best-'+mapId);$('kt-best').textContent=b?PP.fmtTime(b):'—';if(Math.random()<.1)ui()}
  /* ---------- menus ---------- */
  function menus(){var mo=$('kt-modes');mo.innerHTML='<button type="button" class="mode'+(humans===1?' on':'')+'" data-n="1"><b>Solo</b><span>Toi contre 5 karts</span></button><button type="button" class="mode'+(humans===2?' on':'')+'" data-n="2"><b>2 joueurs</b><span>Écran partagé, contre 4 karts</span></button>';
    var mm=$('kt-maps');if(!mm){mm=document.createElement('div');mm.id='kt-maps';mm.className='modes kt-maps';mo.parentNode.insertBefore(mm,mo.nextSibling)}
    mm.innerHTML=Object.keys(MAPS).map(function(id){var b=PP.store('kt-best-'+id);return '<button type="button" class="mode'+(id===mapId?' on':'')+'" data-map="'+id+'"><b>'+MAPS[id].n+'</b><span>'+(b?'Record '+PP.fmtTime(b):'3 tours')+'</span></button>'}).join('');mm.hidden=mp.on()&&!net.isHost}
  document.addEventListener('click',function(e){var b=e.target.closest('#kt-modes [data-n],#kt-maps [data-map]');if(!b)return;if(b.dataset.n)humans=+b.dataset.n;if(b.dataset.map){mapId=b.dataset.map;PP.store('kt-map',mapId)}menus();if(running){running=false;cancelAnimationFrame(raf)}setup();intro();sfx.play('ui')});
  function intro(){$('kt-title').textContent='Pixel Kart · '+MAPS[mapId].n;$('kt-msg').innerHTML=humans===2&&!mp.on()?'J1 : <b>Z Q S D</b>, Maj gauche pour déraper, E pour l\'objet.<br>J2 : <b>flèches</b>, Maj droite pour déraper, Entrée pour l\'objet.':'Flèches ou ZQSD. Maintiens <b>Maj</b> (ou Espace) en tournant pour déraper : plus tu tiens, plus le turbo est fort (bleu puis orange). Passe dans les caisses <b>?</b> et lance ton objet avec <b>E</b>. 3 tours.<br>Caméra : <b>glisse la souris</b> sur l\'écran pour la tourner, molette pour zoomer, <b>C</b> change de vue, <b>R</b> recentre.';$('kt-start').hidden=false;$('kt-start').textContent='Démarrer';$('kt-ov').hidden=false;mp.lobby('kt','Pixel Kart')}
  function start(fromNet){if(mp.on()&&net.isHost&&!fromNet)net.broadcast({t:'kart-go',map:mapId});setup();$('kt-ov').hidden=true;running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
  $('kt-start').addEventListener('click',function(){start(false)});
  net.on(function(m,from){if(PP.cur()!=='kart'||!mp.on())return;
    if(m.t==='kart-go'&&!net.isHost){if(m.map&&MAPS[m.map])mapId=m.map;start(true);return}
    if(m.t==='rel'&&m.d&&m.d.g==='kart'&&K.length){var d=m.d,k=K.filter(function(q){return q.pid===m.from})[0];
      if(d.ev==='slick'){dropSlick(d.x,d.z,false);return}if(d.ev==='ball'){var mm2=new THREE.Mesh(new THREE.SphereGeometry(.5,14,10),new THREE.MeshStandardMaterial({color:0xe2361b}));scene.add(mm2);S.balls.push({m:mm2,x:d.x,z:d.z,si:d.si,tg:K.filter(function(q){return q.pid===d.tg})[0]||null,t:6,by:k});return}
      if(d.ev==='done'&&k){k.done=d.t;return}
      if(k){k.tx=d.x;k.tz=d.z;k.th=d.h;k.v=d.v;k.lap=d.lap;k.si=d.si;k.drift=d.dr||0;k.spin=d.sp?.2:0;k.boost=d.b?.1:0;if(k.x===0&&k.z===0){k.x=d.x;k.z=d.z}}}});
  /* touches (e.code : marche en AZERTY comme en QWERTY) */
  document.addEventListener('keydown',function(e){if(PP.cur()!=='kart'||/INPUT|TEXTAREA/.test(e.target.tagName))return;KEYS[e.code]=true;if(running&&/^(Arrow|Space|ShiftRight|Enter)/.test(e.code))e.preventDefault();
    if(!e.repeat&&e.code==='KeyC')camView();if(!e.repeat&&e.code==='KeyR'){CAM.yaw=CAM.pit=0;CAM.zoom=1}});
  document.addEventListener('keyup',function(e){KEYS[e.code]=false});window.addEventListener('blur',function(){KEYS={}});
  (function pad(){var p=$('kt-pad');if(!p)return;p.innerHTML='<button type="button" data-k="L">←</button><button type="button" data-k="X">DÉRAPE</button><button type="button" data-k="I">OBJET</button><button type="button" data-k="D">FREIN</button><button type="button" data-k="U">GAZ</button><button type="button" data-k="R">→</button>';
    function set(e,v){var b=e.target.closest('[data-k]');if(!b)return;e.preventDefault();TOUCH[b.dataset.k]=v;b.classList.toggle('on',v)}
    p.addEventListener('pointerdown',function(e){set(e,true)});['pointerup','pointercancel','pointerleave'].forEach(function(ev){p.addEventListener(ev,function(e){var b=e.target.closest('[data-k]');if(b){TOUCH[b.dataset.k]=false;b.classList.remove('on')}})})})();
  PP.games.kart={open:function(){menus();if(!window.THREE){$('kt-msg').textContent='La 3D (three.js) n\'a pas pu se charger.';$('kt-ov').hidden=false;return}setup();intro()},close:function(){running=false;cancelAnimationFrame(raf);KEYS={}}};
  PP._kart=function(){return {K:K,S:S}};
})();
