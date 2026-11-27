/* Pixel Pause — Dernier Debout : 12 joueurs (persos + bots), 3 épreuves éliminatoires jusqu'au dernier.
   1 à 4 joueurs sur un clavier, ou en salon (l'hôte calcule tout, les autres envoient leurs touches).
   v87 : refonte. Chacun joue avec son perso (skin du compte), les bots ont leurs propres persos,
   bots plus malins (ils calculent quand sauter, attendent les pousseurs, choisissent leurs dalles),
   cartes plus propres (ciel, nuages, plateformes nettes), animations de course, saut, plongeon, chute,
   et une interface à part pour ce jeu. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,net=PP.net,mp=PP.mp,cv=$('pa-cv');
  var COLS=[0xff5a3c,0x3fa9ff,0x45c46a,0xffc23d,0xa45cf0,0x2fc7c0,0xff6fb1,0xf1ece2];
  var BOTN=['Pépito','Gribouille','Tofu','Biscotte','Moumoute','Patapouf','Zigzag','Croquette','Bidule','Nougat','Pistache','Ratatouille'];
  var KEYMAP={z:'1U',w:'1U',s:'1D',q:'1L',a:'1L',d:'1R',' ':'1X',ArrowUp:'2U',ArrowDown:'2D',ArrowLeft:'2L',ArrowRight:'2R',Enter:'2X',i:'3U',k:'3D',j:'3L',l:'3R',o:'3X','8':'4U','5':'4D','4':'4L','6':'4R','0':'4X'};
  var GAMES={
    race :{n:'La Course',d:'Atteins l\'arche d\'arrivée. Seuls les plus rapides passent.',ty:'race',c:'#3fa9ff',g:'▶'},
    doors:{n:'Les Portes',d:'Fonce dans les portes : certaines cassent, d\'autres sont en béton.',ty:'race',c:'#ffc23d',g:'▦'},
    hex  :{n:'Sol qui fond',d:'Les dalles tombent sous tes pieds. Ne tombe pas tout en bas.',ty:'surv',c:'#45c46a',g:'⬢'},
    spin :{n:'Le Manège',d:'Saute par-dessus la barre rouge, mais reste au sol quand la barre bleue passe au-dessus.',ty:'surv',c:'#2fc7c0',g:'✚'},
    rocks:{n:'Pluie de rochers',d:'Des rochers tombent du ciel et roulent. Reste sur la plateforme.',ty:'surv',c:'#c98a5a',g:'●'},
    arena:{n:'La Balayeuse',d:'Saute par-dessus la barre. Le dernier debout gagne tout.',ty:'final',c:'#ff5a3c',g:'—'},
    summit:{n:'Le Sommet',d:'Grimpe la tour en spirale. Le premier qui touche la couronne gagne.',ty:'final',c:'#a45cf0',g:'▲'}
  },STAGES=[['race','doors'],['hex','rocks','spin'],['arena','summit']],sched=['race','hex','arena'];
  /* niveau des bots : [habileté min, max] */
  var DIFF={facile:[.5,.7],normal:[.74,.9],costaud:[.9,1]},diff='normal';try{var sd=localStorage.getItem(PP.key('pa-diff'));if(DIFF[sd])diff=sd}catch(e){}
  function gid(){return sched[ri]}function TY(){return GAMES[gid()].ty}
  var R3=null,scene,level,sun,players=[],keys={},remote={},humans=1,running=false,raf=0,showRaf=0,last=0,showLast=0,ri=0,T=0,phase='idle',phaseT=0,obs=[],floorsL=[],tiles=[],sendT=0,myIdx=0,winner=null,camYaw=[0,0,0,0],camPitch=[.35,.35,.35,.35],camDist=7.5,mouseT=0,remoteYaw={},cams=[],yawAcc=0,mouseCam=false,banners={},showMode='lobby',showT=0,hudKey='';
  var V2=new THREE.Vector2();
  function hx(c){return '#'+('00000'+(c>>>0).toString(16)).slice(-6)}
  function rnd(seed){var s=seed>>>0;return function(){s=(s+0x6D2B79F5)>>>0;var t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
  function damp(a,b,k,dt){return a+(b-a)*(1-Math.exp(-k*dt))}
  function angDiff(a,b){var d=(a-b)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d}

  /* ---------- Matériaux et textures ---------- */
  var MC={},TC={};
  function lam(o){return new THREE.MeshLambertMaterial(o)}
  function mat(col,k){k=k||'';var key=col+k;if(!MC[key]){MC[key]=lam({color:col});MC[key].userData.keep=1}return MC[key]}
  function shade(c,f){var o=new THREE.Color(c);o.multiplyScalar(f);return o}
  function ctex(key,w,h,draw,rep){if(TC[key])return TC[key];var c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.userData.keep=1;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}TC[key]=t;return t}
  /* dalle de sol : carreau arrondi plus clair au centre */
  function tileTex(col){return ctex('t'+col,128,128,function(g,w){var b=new THREE.Color(col);g.fillStyle=hx(shade(col,.9).getHex());g.fillRect(0,0,w,w);g.fillStyle=hx(col);rr(g,5,5,w-10,w-10,18);g.fill();var gr=g.createLinearGradient(0,0,0,w);gr.addColorStop(0,'rgba(255,255,255,.28)');gr.addColorStop(.5,'rgba(255,255,255,0)');g.fillStyle=gr;rr(g,5,5,w-10,w-10,18);g.fill()},true)}
  function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
  function stripeTex(a,b){return ctex('s'+a+b,64,64,function(g,w){g.fillStyle=hx(a);g.fillRect(0,0,w,w);g.fillStyle=hx(b);for(var i=-w;i<w*2;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i+16,0);g.lineTo(i+16+w,w);g.lineTo(i+w,w);g.closePath();g.fill()}},true)}
  function checkerTex(){return ctex('chk',128,32,function(g,w,h){for(var i=0;i<8;i++)for(var j=0;j<2;j++){g.fillStyle=(i+j)%2?'#17120e':'#ffffff';g.fillRect(i*16,j*16,16,16)}},true)}
  function arrowTex(){return ctex('arr',64,128,function(g,w,h){g.fillStyle='#ffc23d';g.fillRect(0,0,w,h);g.fillStyle='#ff8a1c';for(var y=8;y<h;y+=64){g.beginPath();g.moveTo(8,y+34);g.lineTo(32,y+10);g.lineTo(56,y+34);g.lineTo(56,y+50);g.lineTo(32,y+26);g.lineTo(8,y+50);g.closePath();g.fill()}},true)}
  function ringTex(a,b){return ctex('r'+a+b,256,256,function(g,w){g.fillStyle=hx(a);g.fillRect(0,0,w,w);for(var i=6;i>0;i--){g.beginPath();g.arc(128,128,i*21,0,7);g.fillStyle=i%2?hx(a):hx(shade(a,.9).getHex());g.fill()}g.beginPath();g.arc(128,128,16,0,7);g.fillStyle=hx(b);g.fill()})}
  function doorTex(col){return ctex('d'+col,64,96,function(g,w,h){g.fillStyle=hx(col);g.fillRect(0,0,w,h);g.fillStyle=hx(shade(col,.82).getHex());rr(g,8,8,48,36,6);g.fill();rr(g,8,52,48,36,6);g.fill();g.fillStyle='rgba(255,255,255,.25)';g.fillRect(0,0,w,3)})}
  function signTex(t,bg,fg){return ctex('sg'+t+bg,512,96,function(g,w,h){g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.font='bold 62px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,w/2,h/2+3)})}

  /* fusion de géométries (un seul appel de dessin pour beaucoup de petits objets) */
  function mergeGeos(list){
    var n=0;list=list.map(function(g){g=g.index?g.toNonIndexed():g;n+=g.attributes.position.count;return g});
    var pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),o=0;
    list.forEach(function(g){var c=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=c});
    var out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.computeBoundingSphere();return out;
  }
  /* allège un perso : toutes les petites pièces d'un même membre et d'une même matière ne font plus qu'un objet */
  var EMPTY=new THREE.BufferGeometry();
  function slim(g){
    var P=g.userData.parts;if(!P)return g;
    var bones=[g,P.root,P.torso,P.head,P.eyes].concat(P.legs||[],P.knees||[],P.arms||[],P.elbows||[]).filter(Boolean),isB=function(o){return bones.indexOf(o)>=0};
    g.updateMatrixWorld(true);var buck=[],inv=new THREE.Matrix4(),m4=new THREE.Matrix4();
    g.traverse(function(o){if(!o.isMesh||isB(o)||Array.isArray(o.material)||o.material.transparent)return;var b=o.parent;while(b&&!isB(b))b=b.parent;if(!b)return;
      inv.copy(b.matrixWorld).invert();m4.multiplyMatrices(inv,o.matrixWorld);var gm=o.geometry.clone();gm.applyMatrix4(m4);
      var k=null;for(var i=0;i<buck.length;i++)if(buck[i].b===b&&buck[i].m===o.material){k=buck[i];break}
      if(!k){k={b:b,m:o.material,g:[],sh:false};buck.push(k)}k.g.push(gm);if(o.castShadow&&!o.userData.noOut)k.sh=true;o.userData.kill=1});
    var kill=[];g.traverse(function(o){if(o.userData.kill)kill.push(o)});
    kill.forEach(function(o){o.geometry=EMPTY;o.castShadow=false;var hasB=false;o.traverse(function(c){if(c!==o&&isB(c))hasB=true});if(!hasB&&o.parent)o.parent.remove(o)});
    buck.forEach(function(k){var me=new THREE.Mesh(mergeGeos(k.g),k.m);me.castShadow=k.sh;k.b.add(me)});
    return g;
  }

  /* ---------- Décor ---------- */
  function init(){
    if(R3)return true;if(!window.THREE){PP.toast('La 3D n\'a pas pu se charger','warn');return false}
    R3=new THREE.WebGLRenderer({canvas:cv,antialias:true});R3.setSize(cv.width,cv.height,false);R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFSoftShadowMap;R3.toneMapping=THREE.ACESFilmicToneMapping;R3.toneMappingExposure=1.05;
    scene=new THREE.Scene();scene.fog=new THREE.Fog(0xbfe0ff,90,300);
    /* ciel en dégradé */
    var sky=new THREE.Mesh(new THREE.SphereGeometry(420,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
      uniforms:{t:{value:new THREE.Color(0x2f8cff)},h:{value:new THREE.Color(0xbfe0ff)},b:{value:new THREE.Color(0xffd6ec)}},
      vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform vec3 t;uniform vec3 h;uniform vec3 b;varying vec3 vP;void main(){float y=vP.y;vec3 c=y>0.?mix(h,t,pow(min(1.,y*1.8),.75)):mix(h,b,min(1.,-y*4.));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
    sky.renderOrder=-1;scene.add(sky);scene.userData.sky=sky;
    scene.add(new THREE.HemisphereLight(0xe4f2ff,0xf7c6df,.95));
    sun=new THREE.DirectionalLight(0xfff1dc,2.5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);var c=sun.shadow.camera;c.left=c.bottom=-34;c.right=c.top=34;c.near=1;c.far=140;sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;scene.add(sun);scene.add(sun.target);
    /* mer de nuages sous les niveaux, quelques nuages et îles au loin (fusionnés : très léger) */
    var R=rnd(7),cl=[],isl=[],grs=[];
    var sea=new THREE.Mesh(new THREE.PlaneGeometry(900,900),lam({color:0xfff0f7}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-46,-50);scene.add(sea);
    for(var i=0;i<34;i++){var low=i<22,cx=(R()-.5)*(low?260:340),cz=-50+(R()-.5)*(low?260:340);if(low&&Math.abs(cx)<26&&cz>-135&&cz<20)cx+=cx<0?-30:30;var cy=low?-26-R()*14:6+R()*26;if(!low&&Math.hypot(cx,cz+50)<120){cx*=1.8;cz=-50+(cz+50)*1.8}
      for(var k=0;k<5;k++){var s=(low?7:5)+R()*6,sg=new THREE.SphereGeometry(s,10,7);sg.scale(1,.55,1);sg.translate(cx+(k-2)*s*.8,cy+R()*2,cz+(R()-.5)*s);cl.push(sg)}}
    var clouds=new THREE.Mesh(mergeGeos(cl),lam({color:0xffffff,emissive:0x9aa6b8}));scene.add(clouds);
    for(var j=0;j<7;j++){var a=j/7*Math.PI*2+.4,rr2=150+R()*60,ix=Math.cos(a)*rr2,iz=-50+Math.sin(a)*rr2,iy=-8+R()*20,is=8+R()*10;
      var rock=new THREE.ConeGeometry(is,is*1.6,7);rock.rotateX(Math.PI);rock.translate(ix,iy-is*.8,iz);isl.push(rock);var top=new THREE.CylinderGeometry(is*1.02,is,1.6,7);top.translate(ix,iy+.8,iz);grs.push(top);
      for(var tr=0;tr<3;tr++){var tg=new THREE.ConeGeometry(1.6,4.4,6),ta=R()*6.28,td=R()*is*.6;tg.translate(ix+Math.cos(ta)*td,iy+3.6,iz+Math.sin(ta)*td);grs.push(tg)}}
    scene.add(new THREE.Mesh(mergeGeos(isl),lam({color:0xc9a27a})));scene.add(new THREE.Mesh(mergeGeos(grs),lam({color:0x7ccf6a})));
    level=new THREE.Group();scene.add(level);initFx();
    return true;
  }

  /* ---------- Persos ---------- */
  function randAv(seed){var O=PP.perso&&PP.perso.OPT;if(!O)return null;var R=rnd(seed),a={};Object.keys(O).forEach(function(k){a[k]=O[k][Math.floor(R()*O[k].length)]});if(R()<.55)a.acc='aucun';if(R()<.8)a.back='aucun';return a}
  function myAv(){try{return PP.perso.get()}catch(e){return null}}
  function avFor(i,human){
    if(!human)return randAv(1000+i*97);
    if(mp.on()){var np=net.players[i];if(np&&np.id===net.me.id)return myAv();return np&&np.av||randAv(500+i)}
    return i===0?myAv():randAv(300+i*31);
  }
  function blobModel(col){/* secours si le perso ne peut pas se construire */
    var g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:col,roughness:.4});var b=new THREE.Mesh(new THREE.CapsuleGeometry(.46,.5,8,16),m);b.position.y=.78;b.castShadow=true;g.add(b);
    var f=new THREE.Mesh(new THREE.SphereGeometry(.3,16,10),new THREE.MeshStandardMaterial({color:0xfff3e0}));f.scale.set(1,.8,.4);f.position.set(0,1.02,-.32);g.add(f);return g}
  function tag(t,col){var c=document.createElement('canvas');c.width=256;c.height=64;var g=c.getContext('2d');g.font='800 30px Inter Tight, Arial, sans-serif';var w=Math.min(236,g.measureText(t).width+56);
    g.fillStyle='rgba(20,16,30,.78)';rr(g,128-w/2,10,w,44,22);g.fill();g.fillStyle=hx(col);g.beginPath();g.arc(128-w/2+22,32,9,0,7);g.fill();g.fillStyle='#fff';g.textAlign='left';g.textBaseline='middle';g.fillText(t,128-w/2+38,33);
    var tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;var s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false,transparent:true}));s.scale.set(2.2,.55,1);s.renderOrder=9;return s}
  function makePlayers(){
    players.forEach(function(p){scene.remove(p.m);if(p.tg)scene.remove(p.tg)});players=[];
    var R=rnd(Date.now()&0xffff),lo=DIFF[diff][0],hi=DIFF[diff][1];
    /* en salon : uniquement les joueurs du salon, sans bots */
    for(var i=0;i<(mp.on()?Math.max(2,humans):12);i++){
      var human=i<humans,col=human?COLS[i%COLS.length]:0x8a8aa0,nm=human?(mp.on()&&net.players[i]?net.players[i].name:(i===0&&!mp.on()&&PP.cloud&&PP.cloud.name?String(PP.cloud.name).slice(0,14):'J'+(i+1))):BOTN[i%BOTN.length];
      var av=avFor(i,human),md=null;
      if(av&&PP.perso&&PP.perso.build){try{md=slim(PP.perso.build(av))}catch(e){md=null}}
      var g=new THREE.Group(),body=md||blobModel(human?col:0xb0a8c0);if(md)body.scale.setScalar(.8);g.add(body);
      if(human){var ring=new THREE.Mesh(new THREE.RingGeometry(.48,.62,28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.85,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;ring.renderOrder=2;g.add(ring)}
      scene.add(g);var tg=human?tag(nm,col):null;if(tg)scene.add(tg);
      var sk=lo+R()*(hi-lo);
      players.push({i:i,human:human,bot:!human,name:nm,col:col,av:av,m:g,body:body,parts:md?md.userData.parts:null,tg:tg,x:0,y:0,z:0,vx:0,vy:0,vz:0,face:Math.PI,dy:Math.PI,g:false,st:'in',cp:0,
        an:{ph:R()*6,run:0,air:0,dive:0,stun:0,cel:0,sq:0,lean:0,blink:2+R()*3,dust:0,mode:''},ai:{t:0,lane:(R()-.5)*8,skill:sk,lead:.3,bt:9}});
    }
  }
  function input(p){
    if(p.bot)return p.ai.inp||{};
    if(mp.on())return p.i===0?mp.localInput(keys):(remote[p.i]||{});
    var k=String(p.i+1);return {U:keys[k+'U'],D:keys[k+'D'],L:keys[k+'L'],R:keys[k+'R'],X:keys[k+'X']};
  }

  /* ---------- Animation des persos ---------- */
  function animate(p,dt){
    var a=p.an,P=p.parts,sp=Math.hypot(p.vx,p.vz),mode=a.mode;
    var run=mode?0:(p.g&&p.st==='in'?Math.min(1.25,sp/6.5):0),air=!mode&&!p.g&&p.st==='in'?1:0,dv=p.dive>0?1:0,stn=p.stun>0&&!dv?1:0,cel=(p.st==='q'||mode==='cel')?1:0;
    a.run=damp(a.run,run,10,dt);a.air=damp(a.air,air,12,dt);a.dive=damp(a.dive,dv,14,dt);a.stun=damp(a.stun,stn,10,dt);a.cel=damp(a.cel,cel,6,dt);
    a.ph+=dt*(4+sp*1.55);var s=Math.sin(a.ph),c=Math.cos(a.ph),t=performance.now()/1000+p.i;
    /* atterrissage : écrasement, puis rebond */
    if(p.g&&!a.wasG&&a.vy0<-4){a.sq=Math.min(.32,-a.vy0*.03);fxDust(p.x,p.y,p.z,6)}a.wasG=p.g;a.vy0=p.vy;a.sq=damp(a.sq,0,9,dt);
    if(p.g&&sp>5&&!mode){a.dust-=dt;if(a.dust<=0){a.dust=.22;fxDust(p.x,p.y,p.z,1)}}
    /* tourner en douceur vers la direction */
    p.dy+=angDiff(p.face,p.dy)*(1-Math.exp(-16*dt));
    var celJ=a.cel*Math.abs(Math.sin(t*5.2))*.35;
    p.m.position.set(p.x,p.y+(p.dive>0?.25:0)+celJ,p.z);p.m.rotation.order='YXZ';p.m.rotation.y=p.dy;
    a.lean=damp(a.lean,-.16*a.run-1.3*a.dive,12,dt);p.m.rotation.x=a.lean;p.m.rotation.z=a.stun*Math.sin(t*18)*.18;
    var bs=p.parts?.8:1,sq=a.sq;p.body.scale.set(bs*(1+sq*.35),bs*(1-sq),bs*(1+sq*.35));
    if(!P)return;
    var r=a.run,ai=a.air,d=a.dive,st=a.stun,ce=a.cel,clap=mode==='clap'?1:0,wave=mode==='wave'?1:0;
    var up=p.vy>0?1:0;
    /* jambes */
    var lx=s*.85*r+ai*(up?.55:.15)+(-.1)*d,lx2=-s*.85*r+ai*(up?-.1:.35)+(-.1)*d;
    P.legs[0].rotation.x=lx;P.legs[1].rotation.x=lx2;
    P.knees[0].rotation.x=-(.15+.95*Math.max(0,-Math.sin(a.ph+.5)))*r-ai*(up?1.2:.3)-.05*d;
    P.knees[1].rotation.x=-(.15+.95*Math.max(0,Math.sin(a.ph+.5)))*r-ai*(up?.4:.9)-.05*d;
    P.legs[0].rotation.z=-.12*ai*(1-up);P.legs[1].rotation.z=.12*ai*(1-up);
    /* bras */
    var fl=Math.sin(t*16);
    var ax=-s*.9*r,ax2=s*.9*r;
    ax=ax*(1-ai)+ai*-2.5;ax2=ax2*(1-ai)+ai*-2.5;
    ax=ax*(1-d)+d*-2.9;ax2=ax2*(1-d)+d*-2.9;
    ax=ax*(1-ce)+ce*(-2.7+Math.sin(t*9)*.3);ax2=ax2*(1-ce)+ce*(-2.7-Math.sin(t*9)*.3);
    ax+=st*fl*1.2;ax2-=st*fl*1.2;
    if(clap){ax=1.25;ax2=1.25}if(wave){ax2=-2.8}
    P.arms[0].rotation.x=ax;P.arms[1].rotation.x=ax2;
    var az=.12+ai*.45+st*.6+ce*.25;P.arms[0].rotation.z=-az+(clap?.55+Math.max(0,Math.sin(t*12))*.25:0);P.arms[1].rotation.z=az-(clap?.55+Math.max(0,Math.sin(t*12))*.25:0)+(wave?.3+Math.sin(t*10)*.35:0);
    P.elbows[0].rotation.x=.95*r*(1-ai)+(clap?.4:0);P.elbows[1].rotation.x=.95*r*(1-ai)+(clap?.4:0);
    /* corps, tête, yeux */
    P.root.position.y=Math.abs(c)*.07*r+(mode&&!clap?Math.sin(t*2.2)*.01:0);
    P.torso.rotation.y=s*.12*r;P.torso.rotation.x=-.05*r;
    P.head.rotation.x=.12*r+.35*d-.25*ce;P.head.rotation.y=-s*.08*r+(mode==='idle'?Math.sin(t*.6)*.35:0)+st*Math.sin(t*9)*.4;
    a.blink-=dt;var bl=1;if(a.blink<0){bl=.12;if(a.blink<-.12)a.blink=2.5+Math.random()*3}if(st>.3)bl=.35;P.eyes.scale.y=bl;
  }

  /* ---------- Effets (poussière, éclats, confettis 3D) ---------- */
  var FX=[],FXG=null;
  function initFx(){FXG=new THREE.IcosahedronGeometry(1,0);for(var i=0;i<90;i++){var m=new THREE.Mesh(FXG,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}));m.visible=false;scene.add(m);FX.push({m:m,l:0})}}
  function fxOne(x,y,z,vx,vy,vz,col,size,life,grav){var f=null;for(var i=0;i<FX.length;i++)if(FX[i].l<=0){f=FX[i];break}if(!f)return;f.l=f.L=life;f.x=x;f.y=y;f.z=z;f.vx=vx;f.vy=vy;f.vz=vz;f.s=size;f.gr=grav;f.m.material.color.setHex(col);f.m.visible=true;f.m.rotation.set(Math.random()*3,Math.random()*3,0)}
  function fxDust(x,y,z,n){for(var i=0;i<n;i++){var a=Math.random()*6.28,s=.8+Math.random()*1.2;fxOne(x+Math.cos(a)*.3,y+.1,z+Math.sin(a)*.3,Math.cos(a)*s,.6+Math.random()*.6,Math.sin(a)*s,0xf4efe6,.12+Math.random()*.1,.45+Math.random()*.2,-1)}}
  function fxBurst(x,y,z,col,n,spd){for(var i=0;i<n;i++){var a=Math.random()*6.28,e=Math.random()*1.2,s=(spd||5)*(.5+Math.random()*.7);fxOne(x,y+.8,z,Math.cos(a)*Math.cos(e)*s,Math.sin(e)*s+2,Math.sin(a)*Math.cos(e)*s,Array.isArray(col)?col[i%col.length]:col,.09+Math.random()*.08,.7+Math.random()*.5,12)}}
  function stepFx(dt){FX.forEach(function(f){if(f.l<=0)return;f.l-=dt;if(f.l<=0){f.m.visible=false;return}f.vy-=f.gr*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.z+=f.vz*dt;f.vx*=.97;f.vz*=.97;var k=f.l/f.L;f.m.position.set(f.x,f.y,f.z);f.m.scale.setScalar(f.s*(f.gr<0?(1.6-k*.8):1)*(k<.3?k/.3:1));f.m.material.opacity=Math.min(1,k*2)*(f.gr<0?.7:1);f.m.rotation.x+=dt*4})}

  /* ---------- Niveaux ---------- */
  function addM(geo,mt,x,y,z,sh){var m=new THREE.Mesh(geo,mt);m.position.set(x||0,y||0,z||0);m.castShadow=sh!==false;m.receiveShadow=true;level.add(m);return m}
  function boxMesh(x,y,z,w,h,d,col){return addM(new THREE.BoxGeometry(w,h,d),mat(col),x,y,z)}
  /* plateforme : dessus en carreaux, côtés plus sombres, liseré blanc */
  function floor(x0,x1,z0,z1,top,col){
    var w=x1-x0,d=z1-z0,tt=tileTex(col).clone();tt.needsUpdate=true;tt.repeat.set(w/2.5,d/2.5);
    var side=mat(shade(col,.72).getHex(),'s'),topM=lam({map:tt});
    var m=addM(new THREE.BoxGeometry(w,1.6,d),[side,side,topM,side,side,side],(x0+x1)/2,top-.8,(z0+z1)/2);
    var lip=addM(new THREE.BoxGeometry(w+.16,.22,d+.16),mat(0xffffff),(x0+x1)/2,top-.14,(z0+z1)/2,false);lip.receiveShadow=false;
    floorsL.push({x0:x0,x1:x1,z0:z0,z1:z1,top:top});return m}
  function disk(r,col,acc){var g=new THREE.Group(),tx=ringTex(col,acc);var d=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.94,1.6,56),[mat(shade(col,.72).getHex(),'s'),lam({map:tx}),mat(shade(col,.6).getHex(),'b')]);d.position.y=-.8;d.receiveShadow=true;d.castShadow=true;g.add(d);
    var rim=new THREE.Mesh(new THREE.TorusGeometry(r,.16,8,64),mat(0xffffff));rim.rotation.x=Math.PI/2;rim.position.y=-.05;g.add(rim);level.add(g);floorsL.push({disk:true,r:r,top:0,m:g});return g}
  function clearLevel(){for(var i=level.children.length-1;i>=0;i--){var o=level.children[i];level.remove(o);o.traverse(function(c){if(c.geometry&&c.geometry!==ROCKG&&c.geometry!==HEXG)c.geometry.dispose();if(c.material)[].concat(c.material).forEach(function(m){if(m.userData.keep||m===ROCKM)return;if(m.map&&!m.map.userData.keep)m.map.dispose();m.dispose()})})}obs=[];floorsL=[];tiles=[]}
  function arch(z,w){
    var col=0xff5a3c;[-1,1].forEach(function(s){addM(new THREE.CylinderGeometry(.55,.65,6.4,16),mat(col),s*w,3.2,z);addM(new THREE.SphereGeometry(.7,16,12),mat(0xffc23d),s*w,6.6,z)});
    var b=addM(new THREE.BoxGeometry(w*2,1.3,.6),[mat(0x17120e),mat(0x17120e),mat(0x17120e),mat(0x17120e),new THREE.MeshBasicMaterial({map:signTex('ARRIVÉE','#17120e','#ffc23d')}),new THREE.MeshBasicMaterial({map:signTex('ARRIVÉE','#17120e','#ffc23d')})],0,5.9,z);
    var ck=checkerTex().clone();ck.needsUpdate=true;ck.repeat.set(w*2/8,1);var st=new THREE.Mesh(new THREE.PlaneGeometry(w*2,1.2),lam({map:ck}));st.rotation.x=-Math.PI/2;st.position.set(0,.02,z);st.receiveShadow=true;level.add(st);
  }
  function buildRace(){
    clearLevel();
    floor(-8,8,-14,4,0,0xffe4f1);
    floor(-7,7,-42,-14,0,0x8fd3ff);
    [-20,-28,-36].forEach(function(z,k){addBar(0,z,7,.6,(k%2?-1:1)*(.9+k*.2),0xff5a3c)});
    floor(-7,7,-62,-47,0,0xffe08a);
    [-1,0,1].forEach(function(k){addHammer(k*4.6,-52-k*2,2.6,1.6+k*.3,k*2)});
    floor(-2,2,-74,-62,0,0xc9b4ff);floor(-7,-4,-74,-62,0,0xc9b4ff);floor(4,7,-74,-62,0,0xc9b4ff);
    addPusher(-68,5,1.1);addPusher(-72,-5,1.4);
    floor(-8,8,-104,-74,0,0xaee88f);
    addBoost(-4.5,-8);addBoost(4.5,-8);addBoost(0,-58);addBoost(-5,-101);addBoost(5,-101);
    [-80,-88,-96].forEach(function(z,k){addBar(0,z,7.5,.6,(k%2?1:-1)*(1.1+k*.25),0x3fa9ff)});
    floor(-9,9,-122,-104,0,0xfff6e8);
    arch(-108,6.4);
    /* drapeaux sur les bords pour bien voir le chemin */
    for(var z=0;z>-120;z-=12){[-1,1].forEach(function(s){var x=s*(z<-104?9.2:z<-74&&z>-104?8.2:z<-62?7.2:z<-47?7.2:z<-14?7.2:8.2);if(z<-62&&z>-74)return;addM(new THREE.CylinderGeometry(.06,.06,2.2,6),mat(0xffffff),x,1.1,z,false);var fl=addM(new THREE.BoxGeometry(.04,.5,.7),mat(s<0?0xff5a3c:0x3fa9ff),x,1.95,z+.36,false)})}
  }
  function addBar(cx,cz,len,h,w,col){
    var g=new THREE.Group();g.position.set(cx,h,cz);var tx=stripeTex(col,0xffffff).clone();tx.needsUpdate=true;tx.repeat.set(1,len*.7);
    var b=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,len*2,16,1,true),lam({map:tx}));b.rotation.z=Math.PI/2;b.castShadow=true;g.add(b);
    var hub=new THREE.Mesh(new THREE.CylinderGeometry(.6,.85,h+.4,20),mat(0x2a2440));hub.position.y=-h/2+.2;hub.castShadow=true;g.add(hub);var hc=new THREE.Mesh(new THREE.SphereGeometry(.55,16,10),mat(0xffc23d));hc.position.y=.1;g.add(hc);
    [-1,1].forEach(function(s){var cap=new THREE.Mesh(new THREE.SphereGeometry(.42,14,10),mat(0xffffff));cap.position.x=s*len;cap.castShadow=true;g.add(cap)});
    level.add(g);obs.push({k:'bar',cx:cx,cz:cz,len:len,h:h,w:w,g:g,a:Math.random()*6,sp:w})}
  function addHammer(cx,cz,amp,w,ph){
    var m=new THREE.Group();m.position.set(cx,1,cz);var blk=new THREE.Mesh(new THREE.BoxGeometry(1.6,2,1.6),mat(0xff5a3c));blk.castShadow=true;m.add(blk);
    [-1,1].forEach(function(s){var pad=new THREE.Mesh(new THREE.BoxGeometry(.18,1.5,1.3),mat(0xffffff));pad.position.x=s*.88;m.add(pad)});
    var pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,4.2,8),mat(0x5a5470));pole.position.y=3.1;m.add(pole);level.add(m);
    addM(new THREE.BoxGeometry(14.5,.35,.35),mat(0x2a2440),0,5.3,cz);
    obs.push({k:'ham',cx:cx,cz:cz,amp:amp,w:w,ph:ph,m:m,x:cx})}
  /* tapis jaunes qui font foncer pendant une seconde (flèches qui défilent) */
  function addBoost(x,z){var tx=arrowTex();var m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshBasicMaterial({map:tx}));m.rotation.x=-Math.PI/2;m.position.set(x,.045,z);level.add(m);
    var fr=addM(new THREE.BoxGeometry(2.7,.04,2.7),mat(0x17120e),x,0,z,false);obs.push({k:'boost',x:x,z:z,m:m})}
  function buildSpin(){
    clearLevel();disk(11,0xe9f4ff,0x2fc7c0);
    addBar(0,0,11,.6,1.05,0xff5a3c);addBar(0,0,11,2.1,-.8,0x3fa9ff);obs[obs.length-1].hi=true;obs[obs.length-1].a=obs[obs.length-2].a+1.6;
  }
  function addPusher(cz,dir,w){var m=new THREE.Group();m.position.set(0,1,cz);var tx=stripeTex(0xffc23d,0x17120e);
    var b=new THREE.Mesh(new THREE.BoxGeometry(3,2,2),[lam({map:tx}),lam({map:tx}),mat(0xff5a3c),mat(0xff5a3c),mat(0xff5a3c),mat(0xff5a3c)]);b.castShadow=true;m.add(b);level.add(m);
    obs.push({k:'push',cz:cz,amp:6,w:w,ph:dir,m:m,x:0})}
  var HEXG=null;
  function buildHex(){
    clearLevel();var R=1.25,H=Math.sqrt(3)*R;if(!HEXG)HEXG=new THREE.CylinderGeometry(R*.95,R*.9,.6,6);
    [0,-7].forEach(function(y,layer){
      for(var q=-9;q<=9;q++)for(var r=-9;r<=9;r++){var x=R*1.5*q,z=H*(r+q/2);if(Math.hypot(x,z)>11.5)continue;
        var col=layer?[0xffb3d9,0xff9ccc][(q+r+30)%2]:[0x8fd3ff,0xffe08a,0xaee88f][(q+r+30)%3];var m=new THREE.Mesh(HEXG,lam({color:col}));m.rotation.y=Math.PI/6;m.position.set(x,y-.3,z);m.castShadow=true;m.receiveShadow=true;level.add(m);
        tiles.push({x:x,z:z,y:y,r:R*.9,st:0,t:0,m:m,col:col,fall:0})}
    });
    tiles.forEach(function(t){t.nb=tiles.filter(function(u){return u!==t&&u.y===t.y&&Math.hypot(u.x-t.x,u.z-t.z)<H*1.1})});
  }
  function buildArena(){clearLevel();disk(11,0xfff0e0,0xff5a3c);addBar(0,0,11,.6,1.2,0xff5a3c)}
  function resetYaws(){players.forEach(function(p){if(!p.human)return;var k=mp.on()?0:p.i;if(mp.on()&&p.i!==myIdx)return;camYaw[k]=startYaw(p)})}
  function startPositions(){
    var alive=players.filter(function(p){return p.st!=='out'});
    alive.forEach(function(p,k){
      if(TY()==='race'){p.x=-6+(k%6)*2.4;p.z=2-(k/6|0)*2.2;p.y=0}
      else{var a=k/alive.length*Math.PI*2;var rr=gid()==='summit'?11:7;p.x=Math.cos(a)*rr;p.z=Math.sin(a)*rr;p.y=gid()==='hex'?.2:0}
      p.vx=p.vy=p.vz=0;p.g=true;p.st='in';p.cp=0;p.face=TY()==='race'?0:Math.atan2(p.x,p.z);p.dy=p.face;p.ai.door=null;p.ai.goal=null;p.m.visible=true;p.fin=0;p.an.mode='';p.stun=0;p.dive=0;
    });
  }
  function buildDoors(){
    clearLevel();
    floor(-8,8,-96,6,0,0xfff0d6);
    addBoost(-4.5,-6);addBoost(4.5,-6);addBoost(0,-35);addBoost(-3,-63);addBoost(3,-78);
    var R=Math.random,DC=[0xffc23d,0xff5a3c,0x3fa9ff,0x45c46a,0xa45cf0];
    [-14,-28,-42,-56,-70].forEach(function(z,row){
      var xs=[-6,-3,0,3,6],reals=[];while(reals.length<(row<2?3:2)){var k=R()*5|0;if(reals.indexOf(k)<0)reals.push(k)}
      boxMesh(0,3.45,z,16,.5,1.1,0x2a2440);
      xs.forEach(function(x,k){var col=DC[(k+row)%5],tm=MC['door'+col]||(MC['door'+col]=lam({map:doorTex(col)}),MC['door'+col].userData.keep=1,MC['door'+col]),sm=mat(shade(col,.75).getHex(),'s');var m=addM(new THREE.BoxGeometry(2.8,3,.5),[sm,sm,sm,sm,tm,tm],x,1.5,z);var knob=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),mat(0xfff6e8));knob.position.set(.9,0,.3);m.add(knob);obs.push({k:'door',x:x,z:z,real:reals.indexOf(k)>=0,alive:true,m:m,row:row,col:col})});
      [-7.6,7.6].forEach(function(x){boxMesh(x,1.7,z,.4,3.4,1.1,0x2a2440)});
    });
    arch(-84,6.4);
  }
  function buildRocks(){
    clearLevel();floor(-12,12,-12,12,0,0xf0e2c8);
    [[-12,0,.6,24],[12,0,.6,24],[0,-12,24,.6],[0,12,24,.6]].forEach(function(b){var e=boxMesh(b[0],.15,b[1],b[2],.3,b[3],0xff5a3c);e.castShadow=false});
  }
  var ROCKG=null,ROCKM=null;
  function rockMesh(){if(!ROCKG){ROCKG=new THREE.DodecahedronGeometry(1.1,1);ROCKM=lam({color:0x8a6e5a,flatShading:true})}var m=new THREE.Mesh(ROCKG,ROCKM);m.castShadow=true;return m}
  function spawnRock(){
    var al=aliveList(),tp=al.length&&Math.random()<.6?PP.pick(al):null,x=tp?tp.x+(Math.random()-.5)*4:(Math.random()-.5)*22,z=tp?tp.z+(Math.random()-.5)*4:(Math.random()-.5)*22;
    x=Math.max(-11,Math.min(11,x));z=Math.max(-11,Math.min(11,z));
    var m=rockMesh();m.position.set(x,20,z);level.add(m);
    var sh=new THREE.Mesh(new THREE.RingGeometry(.6,1.1,24),new THREE.MeshBasicMaterial({color:0xff5a3c,transparent:true,opacity:.75,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.set(x,.03,z);level.add(sh);
    obs.push({k:'rock',id:Math.random()*1e9|0,x:x,y:20,z:z,vy:0,vx:0,vz:0,m:m,sh:sh,t:0,land:false});
  }
  var SUMMIT=[];
  function buildSummit(){
    clearLevel();SUMMIT=[];
    floor(-14,14,-14,14,0,0xaee88f);
    var tx=stripeTex(0xfff6e8,0xc9b4ff).clone();tx.needsUpdate=true;tx.repeat.set(4,6);
    addM(new THREE.CylinderGeometry(3,3.4,20,24),lam({map:tx}),0,10,0);
    for(var k=0;k<16;k++){var a=k*.72+.3,r=7.5,x=Math.cos(a)*r,z=Math.sin(a)*r,y=1+k*1.05,s=k===15?5:4.2;
      var col=[0xffe08a,0x8fd3ff,0xffb3d9,0xc9b4ff][k%4];floor(x-s/2,x+s/2,z-s/2,z+s/2,y,col);SUMMIT.push({x:x,z:z,y:y});
      if(k===5||k===10)addBar(x,z,1.7,y+.6,2.2,0xff5a3c);
    }
    var top=SUMMIT[15],crown=new THREE.Group(),gold=new THREE.MeshStandardMaterial({color:0xffc23d,metalness:.7,roughness:.25,side:THREE.DoubleSide,emissive:0x6a4a00});
    var ring=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.35,16,1,true),gold);crown.add(ring);
    for(var i=0;i<5;i++){var sp=new THREE.Mesh(new THREE.ConeGeometry(.16,.5,6),gold);var aa=i/5*Math.PI*2;sp.position.set(Math.cos(aa)*.62,.4,Math.sin(aa)*.62);crown.add(sp)}
    crown.position.set(top.x,top.y+1.6,top.z);level.add(crown);var gl=new THREE.PointLight(0xffd060,2,10);gl.position.copy(crown.position);level.add(gl);
    obs.push({k:'crown',x:top.x,y:top.y,z:top.z,m:crown});
  }
  /* salle d'attente et podium (derrière les menus) */
  function buildLobby(){clearLevel();disk(9,0xfff0f7,0xa45cf0);var b=addM(new THREE.CylinderGeometry(1.3,1.45,1,32),mat(0xffc23d),0,.5,0);b.visible=false;obs.push({k:'podium',m:b})}
  function stepNewObs(dt,host){
    obs.forEach(function(o){
      if(o.k==='crown')o.m.rotation.y+=dt*1.5;
      if(o.k==='rock'&&host){o.t+=dt;
        if(!o.land){o.vy-=22*dt;o.y+=o.vy*dt;if(o.y<=1.1){o.y=1.1;o.land=true;var a=Math.random()*6.28,s=4+Math.random()*4;o.vx=Math.cos(a)*s;o.vz=Math.sin(a)*s;sfx.play('crash');level.remove(o.sh);fxBurst(o.x,0,o.z,[0xc9a27a,0xe8d6b8],10,4)}}
        else{o.x+=o.vx*dt;o.z+=o.vz*dt;if(Math.abs(o.x)>12||Math.abs(o.z)>12){o.vy-=22*dt;o.y+=o.vy*dt}o.m.rotation.x+=o.vz*dt;o.m.rotation.z-=o.vx*dt}
        o.m.position.set(o.x,o.y,o.z);if(o.y<-20||o.t>7){level.remove(o.m);level.remove(o.sh);o.dead=1}}
      if(o.k==='door'&&!o.alive&&o.m.visible){if(!o.fall)fxBurst(o.x,1,o.z,[o.col,0xffffff],12,6);o.fall=(o.fall||0)+dt;o.m.rotation.x=-Math.min(1.5,o.fall*4);o.m.position.y=1.5-Math.min(1.4,o.fall*3);if(o.fall>1.2)o.m.visible=false}
    });
    obs=obs.filter(function(o){return !o.dead});
  }
  function hitNewObs(p){
    obs.forEach(function(o){
      if(o.k==='door'&&o.alive&&Math.abs(p.x-o.x)<1.5&&Math.abs(p.z-o.z)<.75&&p.y<3){
        if(o.real){o.alive=false;sfx.play('crash');}else{p.z=o.z+.8;p.vz=6;p.vy=3;p.stun=.45;o.known=true;if(!p.bot)sfx.play('hit');if(p.bot)p.ai.door=null}}
      if(o.k==='boost'&&p.g&&Math.abs(p.x-o.x)<1.3&&Math.abs(p.z-o.z)<1.3){if(!(p.boost>0)){if(!p.bot)sfx.play('go');fxBurst(p.x,-.6,p.z,0xffc23d,5,3)}p.boost=1}
      if(o.k==='rock'){var dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz);if(d<1.55&&Math.abs(p.y+.7-o.y)<1.6){dx/=d||1;dz/=d||1;p.vx=dx*10+o.vx*.5;p.vz=dz*10+o.vz*.5;p.vy=6;p.stun=.6;if(!p.bot)sfx.play('hit')}}
    });
  }
  /* ---------- Roulette ---------- */
  function roulette(id,stage){
    var el=$('pa-roul'),pool=Object.keys(GAMES),strip=[];for(var r=0;r<5;r++)pool.forEach(function(k){strip.push(k)});
    var target=4*pool.length+pool.indexOf(id);
    el.innerHTML='<span class="ro-lbl">Épreuve '+(stage+1)+' sur 3</span><div class="ro-win"><div class="ro-strip" id="pa-strip">'+strip.map(function(k){var g=GAMES[k];return '<div class="ro-card" style="--c:'+g.c+'"><i>'+g.g+'</i><b>'+esc(g.n)+'</b><small>'+(g.ty==='race'?'course':g.ty==='surv'?'survie':'finale')+'</small></div>'}).join('')+'</div><div class="ro-mark"></div></div><p class="ro-d" id="pa-rod"></p>';
    el.hidden=false;var st=$('pa-strip'),cw=150;st.style.transform='translateX(0)';
    requestAnimationFrame(function(){requestAnimationFrame(function(){st.style.transition='transform 2.6s cubic-bezier(.12,.75,.2,1)';st.style.transform='translateX(calc(50% - '+(target*cw+cw/2)+'px))'})});
    var tk=0,iv=setInterval(function(){tk++;sfx.play('tick');if(tk>9)clearInterval(iv)},230);
    setTimeout(function(){var g=GAMES[id];var d=$('pa-rod');if(d)d.innerHTML='<b>'+esc(g.n)+'</b>'+esc(g.d);sfx.play('win');if(st.children[target])st.children[target].classList.add('on')},2700);
    clearTimeout(roulette.t);roulette.t=setTimeout(function(){el.hidden=true},4300);
  }
  function buildFor(id){({race:buildRace,doors:buildDoors,hex:buildHex,rocks:buildRocks,spin:buildSpin,arena:buildArena,summit:buildSummit})[id]()}
  /* ---------- Physique ---------- */
  function groundAt(p){
    var best=-1e9;
    floorsL.forEach(function(f){if(f.disk){if(Math.hypot(p.x,p.z)<f.r&&p.y>=f.top-.6)best=Math.max(best,f.top)}else if(p.x>f.x0-.2&&p.x<f.x1+.2&&p.z>f.z0-.2&&p.z<f.z1+.2&&p.y>=f.top-.6)best=Math.max(best,f.top)});
    var tl=null;tiles.forEach(function(t){if(t.st<2&&Math.hypot(p.x-t.x,p.z-t.z)<t.r&&p.y>=t.y-.6&&t.y>best){best=t.y;tl=t}});
    return {y:best,tile:tl};
  }
  function segHit(p,o){
    var ang=o.a,dx=Math.cos(ang),dz=-Math.sin(ang),rx=p.x-o.cx,rz=p.z-o.cz,proj=rx*dx+rz*dz;if(Math.abs(proj)>o.len)return null;
    var px=rx-proj*dx,pz=rz-proj*dz,d=Math.hypot(px,pz);if(d>.75||p.y>o.h+.35)return null;if(o.hi&&p.y+1.5<o.h-.25)return null;
    return {nx:px/(d||1),nz:pz/(d||1),r:proj};
  }
  function stepObs(dt){
    stepNewObs(dt,!mp.on()||net.isHost);
    obs.forEach(function(o){
      if(o.k==='bar'){var sp=o.w*(gid()==='arena'?1+T*.025:gid()==='spin'?1+T*.022:1);o.a+=sp*dt;o.g.rotation.y=o.a;o.sp=sp}
      if(o.k==='ham'){o.x=o.cx+Math.sin(T*o.w+o.ph)*o.amp;o.m.position.x=o.x;o.vx=Math.cos(T*o.w+o.ph)*o.amp*o.w}
      if(o.k==='push'){o.x=Math.sin(T*o.w+o.ph)*o.amp;o.m.position.x=o.x;o.vx=Math.cos(T*o.w+o.ph)*o.amp*o.w}
    });
  }
  function hitObs(p){
    obs.forEach(function(o){
      if(o.k==='bar'){var h=segHit(p,o);if(h){var tang=o.sp*h.r;var tx=-Math.sin(o.a)*tang,tz=-Math.cos(o.a)*tang;var sgn=Math.sign(h.nx*tx+h.nz*tz)||1;var kk=Math.min(11,Math.abs(tang)*1.1+3);p.vx=h.nx*sgn*kk+tx*.3;p.vz=h.nz*sgn*kk+tz*.3;p.vy=Math.max(p.vy,5);if(!(p.stun>0))fxBurst(p.x,p.y,p.z,0xffffff,5,3);p.stun=.5;if(!p.bot)sfx.play('hit')}}
      if(o.k==='ham'||o.k==='push'){var w=o.k==='ham'?1.1:1.8;if(Math.abs(p.x-o.x)<w&&Math.abs(p.z-o.cz)<1.2&&p.y<2){var dir=Math.sign(p.x-o.x)||1;p.vx=dir*Math.max(9,Math.abs(o.vx)*1.5);p.vy=Math.max(p.vy,4);if(!(p.stun>0))fxBurst(p.x,p.y,p.z,0xffffff,5,3);p.stun=.5;if(!p.bot)sfx.play('hit')}}
    });
  }
  function yawOf(p){if(p.bot)return 0;if(mp.on())return p.i===myIdx?camYaw[0]:(remoteYaw[p.i]!=null?remoteYaw[p.i]:startYaw(p));return camYaw[p.i]||0}
  function startYaw(p){return TY()!=='race'?Math.atan2(p.x,p.z):0}
  function physics(p,dt){
    var inp=input(p),fw=(inp.U?1:0)-(inp.D?1:0),sr=(inp.R?1:0)-(inp.L?1:0),y=yawOf(p),mx=p.bot?sr:-Math.sin(y)*fw+Math.cos(y)*sr,mz=p.bot?-fw:-Math.cos(y)*fw-Math.sin(y)*sr;
    if(p.bot&&inp.mx!=null){mx=inp.mx;mz=inp.mz}
    var ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;ml=1}
    p.stun=Math.max(0,(p.stun||0)-dt);p.boost=Math.max(0,(p.boost||0)-dt);p.dive=Math.max(0,(p.dive||0)-dt);
    var ctl=p.stun>0?.15:p.dive>0?.08:(p.g?1:.45),spd=7.2*(p.bot?.9+.1*p.ai.skill:1)*(p.boost>0?1.7:1);
    p.vx+=(mx*spd-p.vx)*Math.min(1,dt*8*ctl);p.vz+=(mz*spd-p.vz)*Math.min(1,dt*8*ctl);
    if(ml>.2)p.face=Math.atan2(-mx,-mz);
    /* plongeon : un deuxième appui sur saut, en l'air, te jette en avant (une fois par saut) */
    if(inp.X&&!p.jl){if(p.g){p.vy=7.6;p.g=false;p.dv=0;if(!p.bot)sfx.play('ui')}
      else if(!p.dv&&p.stun<=0){p.dv=1;p.dive=.55;if(ml>.2)p.face=Math.atan2(-mx,-mz);var ddx=ml>.2?mx/ml:-Math.sin(p.face),ddz=ml>.2?mz/ml:-Math.cos(p.face);p.vx=ddx*11.5;p.vz=ddz*11.5;p.vy=Math.max(p.vy,3.4);if(!p.bot)sfx.play('shoot')}}
    p.jl=!!inp.X;
    p.vy-=20*dt;
    var nx=p.x+p.vx*dt,nz=p.z+p.vz*dt,ny=p.y+p.vy*dt;p.x=nx;p.z=nz;
    var gr=groundAt({x:p.x,y:p.y,z:p.z});
    if(ny<=gr.y&&p.vy<=0){p.y=gr.y;p.vy=0;p.g=true;if(p.dv){p.dv=0;p.dive=Math.min(p.dive,.12)}if(gr.tile&&gr.tile.st===0){gr.tile.st=1;gr.tile.t=.85}}else{p.y=ny;p.g=false}
    hitObs(p);hitNewObs(p);
    players.forEach(function(q){if(q===p||q.st!=='in'||q.i<p.i)return;var dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.9&&d>0&&Math.abs(q.y-p.y)<1.2){var push=(.9-d)/2;dx/=d;dz/=d;p.x-=dx*push;p.z-=dz*push;q.x+=dx*push;q.z+=dz*push}});
  }

  /* ---------- IA des bots ----------
     Les bots regardent quand la barre va passer sur eux et sautent au bon moment (avec une petite erreur selon leur niveau),
     prévoient où seront les marteaux et les pousseurs, sautent les trous au bord, plongent pour aller plus loin,
     choisissent les dalles les plus sûres et fuient les rochers qui vont tomber. */
  function gauss(){return (Math.random()+Math.random()+Math.random()-1.5)/1.5}
  function steer(inp,p,tx,tz,slow){var dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);if(d<.15){inp.mx=0;inp.mz=0;return d}var s=slow?Math.min(1,d/1.5):1;inp.mx=dx/d*s;inp.mz=dz/d*s;return d}
  /* temps avant que la barre balaie la position (x,z) */
  function barT(o,x,z){var rx=x-o.cx,rz=z-o.cz,r=Math.hypot(rx,rz);if(r>o.len+.7)return 1e9;var sp=o.sp||o.w;if(Math.abs(sp)<.01)return 1e9;
    var th=Math.atan2(-rz,rx),d=sp>0?th-o.a:o.a-th;d=((d%Math.PI)+Math.PI)%Math.PI;var hw=Math.min(1.2,.8/Math.max(.6,r));if(d>Math.PI-hw)return 0;return Math.max(0,d-hw)/Math.abs(sp)}
  /* faut-il sauter maintenant pour passer la barre basse ? (une décision par passage de barre) */
  function barJump(p,dt){
    var a=p.ai,tLow=1e9,tHi=1e9;
    obs.forEach(function(o){if(o.k!=='bar')return;if(Math.abs(p.y-(o.h-.6))>1.2)return;var t=barT(o,p.x+p.vx*.15,p.z+p.vz*.15);if(o.hi)tHi=Math.min(tHi,t);else tLow=Math.min(tLow,t)});
    if(tLow>a.bt+.25||a.bt>=1e8){a.lead=.3+gauss()*(1-a.skill)*.45;a.miss=Math.random()<(1-a.skill)*.35}
    a.bt=tLow;
    if(tHi<.8)return false;
    return !a.miss&&tLow<a.lead&&tLow>.06&&p.g;
  }
  function edgeX(z){/* limites du sol de la course à cette profondeur */
    if(z>-14)return [-8,8];if(z>-42)return [-7,7];if(z>-47)return [-7,7];if(z>-62)return [-7,7];if(z>-74)return null;if(z>-104)return [-8,8];return [-9,9]}
  function ai(p,dt){
    var a=p.ai,inp={},id=gid();a.t-=dt;
    if(p.stun>0){a.inp={};return}
    if(id==='race'){
      var tx=a.lane,tz=p.z-6,wait=false,BR=[[-5.5,-7,-4],[0,-2,2],[5.5,4,7]];
      if(a.t<=0){a.t=1.5+Math.random()*2;a.lane=(Math.random()-.5)*9}
      /* tapis jaunes devant : on y va */
      obs.forEach(function(o){if(o.k==='boost'&&o.z<p.z-1&&o.z>p.z-9&&Math.abs(o.x-p.x)<4.5)tx=o.x});
      /* marteaux : on vise un couloir où le marteau ne sera pas quand on passera */
      if(p.z<-44&&p.z>-58){var best=null,bs=1e9,spd=Math.max(4,Math.hypot(p.vx,p.vz));
        obs.forEach(function(o){if(o.k!=='ham'||o.cz>p.z+.5||o.cz<p.z-6)return;var tc=(p.z-o.cz)/spd;
          for(var cx=-6;cx<=6;cx+=.5){var cl=1e9;for(var dtt=-.35;dtt<=.35;dtt+=.1){var ox=o.cx+Math.sin((T+tc+dtt)*o.w+o.ph)*o.amp;cl=Math.min(cl,Math.abs(cx-ox))}if(cl>1.9){var sc=Math.abs(cx-p.x)+Math.abs(cx-tx)*.2;if(sc<bs){bs=sc;best=cx}}}
          if(best===null&&p.z-o.cz<3.2)wait=true});
        if(best!==null)tx=best}
      /* ponts : on choisit un pont et on attend que le pousseur soit passé */
      if(p.z<-56&&p.z>-75){if(a.br==null||p.z>-58){var bb=0,bd=1e9;BR.forEach(function(b,k){var d=Math.abs(b[0]-p.x)+(k===1?-.5:0)+(k===(a.lastBr||1)?0:.3);if(d<bd){bd=d;bb=k}});a.br=bb}
        var B=BR[a.br];tx=B[0];
        if(p.z>-62.3&&Math.abs(p.x-B[0])>(B[2]-B[1])/2-.6)wait=p.z>-61;
        obs.forEach(function(o){if(o.k!=='push')return;var dz=p.z-o.cz;if(dz<-1.3||dz>3.2)return;var spd2=6.5,t0=Math.max(0,(dz-1.3)/spd2),t1=(dz+1.4)/spd2;
          for(var tt=t0;tt<=t1+.2;tt+=.08){var ox=Math.sin((T+tt)*o.w+o.ph)*o.amp;if(Math.abs(ox-p.x)<2.3){if(dz>1.2)wait=true;break}}})}
      else a.br=null;
      var ex=edgeX(p.z);if(ex)tx=Math.max(ex[0]+1,Math.min(ex[1]-1,tx));
      /* on évite de rentrer dans le bot de devant */
      players.forEach(function(q){if(q===p||q.st!=='in')return;var dz=p.z-q.z,dx=q.x-p.x;if(dz>0&&dz<1.8&&Math.abs(dx)<1)tx+=dx>0?-1.2:1.2});
      if(wait){steer(inp,p,tx,p.z,true)}else steer(inp,p,tx,tz);
      /* trous : on saute au bord, et on plonge en l'air pour aller plus loin */
      var ahead=groundAt({x:p.x,y:p.y+.1,z:p.z-1.1});if(p.g&&ahead.y<-5&&!wait)inp.X=true;
      if(!p.g&&!p.dv&&p.vy<1.5&&groundAt({x:p.x,y:p.y,z:p.z}).y<-5&&groundAt({x:p.x,y:p.y,z:p.z-2.5}).y<-5)inp.X=true;
      if(barJump(p,dt))inp.X=true;
      /* plongeon vers l'arrivée */
      if(p.z<-104&&p.z>-107.5&&p.g&&Math.random()<a.skill*.1)inp.X=true;
    }else if(id==='doors'){
      var nr=null;obs.forEach(function(o){if(o.k==='door'&&o.z<p.z-.2&&(!nr||o.z>nr))nr=o.z});
      var gx=p.x;
      if(nr!==null){if(!a.door||a.door.z!==nr||a.door.known){var row=obs.filter(function(o){return o.k==='door'&&o.z===nr}),open=row.filter(function(o){return !o.alive}),cand=row.filter(function(o){return o.alive&&!o.known});
          if(open.length&&Math.random()<.5+a.skill*.5){open.sort(function(u,v){return Math.abs(u.x-p.x)-Math.abs(v.x-p.x)});a.door=open[0]}
          else{/* parmi les inconnues : la plus proche, avec un peu de hasard */var c2=cand.length?cand:row;c2=c2.slice().sort(function(u,v){return Math.abs(u.x-p.x)+Math.random()*3-Math.abs(v.x-p.x)-Math.random()*3});a.door=c2[0]}}
        gx=a.door.x;var near=p.z-nr<3&&Math.abs(gx-p.x)>.9;steer(inp,p,gx,near?p.z:p.z-6)}
      else steer(inp,p,0,p.z-6);
      obs.forEach(function(o){if(o.k==='boost'&&o.z<p.z-1&&o.z>p.z-5&&Math.abs(o.x-p.x)<2&&!(nr!==null&&p.z-nr<6))steer(inp,p,o.x,p.z-6)});
      if(p.z<-80&&p.z>-83.5&&p.g&&Math.random()<a.skill*.1)inp.X=true;
    }else if(id==='rocks'){
      if(a.t<=0||!a.goal){a.t=1.2+Math.random()*1.5;a.goal={x:(Math.random()-.5)*12,z:(Math.random()-.5)*12}}
      var fx=(a.goal.x-p.x)*.15,fz=(a.goal.z-p.z)*.15;
      obs.forEach(function(o){if(o.k!=='rock')return;var seen=((o.id^(p.i*2654435761))>>>0)%1000/1000<.45+a.skill*.55;if(!seen)return;
        if(!o.land){var dd=Math.hypot(p.x-o.x,p.z-o.z),tf=Math.sqrt(Math.max(0,(o.y-1.1)/11));if(dd<2.8&&tf<1.4){var k=(2.8-dd)/2.8*3;fx+=(p.x-o.x)/(dd||.1)*k;fz+=(p.z-o.z)/(dd||.1)*k}}
        else{var rx=p.x-o.x,rz=p.z-o.z,vv=o.vx*o.vx+o.vz*o.vz||1,tc=Math.max(0,Math.min(1.2,(rx*o.vx+rz*o.vz)/vv)),cx=rx-o.vx*tc,cz=rz-o.vz*tc,cd=Math.hypot(cx,cz);
          if(cd<2.2&&(rx*o.vx+rz*o.vz)>0){var k2=(2.2-cd)*1.6/(.3+tc);fx+=(cd>.05?cx/cd:-o.vz/Math.sqrt(vv))*k2;fz+=(cd>.05?cz/cd:o.vx/Math.sqrt(vv))*k2}}});
      var e=9;if(p.x>e)fx-=(p.x-e)*2;if(p.x<-e)fx-=(p.x+e)*2;if(p.z>e)fz-=(p.z-e)*2;if(p.z<-e)fz-=(p.z+e)*2;
      var fl=Math.hypot(fx,fz);if(fl>.08){inp.mx=fx/Math.max(1,fl);inp.mz=fz/Math.max(1,fl)}
    }else if(id==='summit'){
      var cur=-1;SUMMIT.forEach(function(s,k){if(Math.abs(p.x-s.x)<2.3&&Math.abs(p.z-s.z)<2.3&&p.y>=s.y-.3)cur=Math.max(cur,k)});var nx=SUMMIT[Math.min(15,cur+1)];
      if(nx){var dn=Math.hypot(nx.x-p.x,nx.z-p.z);steer(inp,p,nx.x,nx.z,dn<1);
        if(p.g&&cur>=-1&&dn<(cur<0?3.6:3.4)&&nx.y>p.y-.2&&Math.random()<.35+a.skill*.6)inp.X=true;
        if(!p.g&&!p.dv&&p.vy<0&&dn>2.6&&groundAt({x:p.x,y:p.y,z:p.z}).y<nx.y-1&&Math.random()<a.skill)inp.X=true}
      if(barJump(p,dt))inp.X=true;
    }else if(id==='hex'){
      var here=groundAt({x:p.x,y:p.y,z:p.z});
      if(a.t<=0||!a.goal||a.goal.st!==0||Math.hypot(a.goal.x-p.x,a.goal.z-p.z)<.45){a.t=.9+Math.random()*.6;var best2=null,bd2=1e9;
        tiles.forEach(function(t){if(t.st!==0||Math.abs(t.y-p.y)>1.5||Math.hypot(t.x,t.z)>10.6)return;var d=Math.hypot(t.x-p.x,t.z-p.z);if(d<1||d>6)return;
          var safe=t.nb.filter(function(u){return u.st===0}).length,crowd=0;players.forEach(function(q){if(q!==p&&q.st==='in'&&Math.hypot(q.x-t.x,q.z-t.z)<1.4)crowd++});
          var sc=d*.6-safe*.55*a.skill+crowd*1.5+Math.random()*(1.4-a.skill)*2;if(sc<bd2){bd2=sc;best2=t}});a.goal=best2}
      if(a.goal)steer(inp,p,a.goal.x,a.goal.z);else steer(inp,p,0,0);
      if(here.tile&&here.tile.st===1&&here.tile.t<.35&&a.goal&&Math.hypot(a.goal.x-p.x,a.goal.z-p.z)>1.6&&Math.random()<a.skill)inp.X=true;
    }else{
      /* Manège et Balayeuse : on tourne autour, pas trop près du bord, et on saute au bon moment */
      var R0=floorsL[0]&&floorsL[0].r||11,want=Math.max(1.8,Math.min(4.2,R0-3));
      if(a.t<=0||a.ang==null){a.t=1.5+Math.random()*2;a.ang=(a.ang==null?Math.atan2(p.z,p.x):a.ang)+(Math.random()-.5)*1.4}
      steer(inp,p,Math.cos(a.ang)*want,Math.sin(a.ang)*want,true);
      if(Math.hypot(p.x,p.z)>R0-1.6){inp.mx=-p.x/Math.hypot(p.x,p.z);inp.mz=-p.z/Math.hypot(p.x,p.z)}
      if(barJump(p,dt))inp.X=true;
    }
    a.inp=inp;
  }

  /* ---------- Boucle ---------- */
  function aliveList(){return players.filter(function(p){return p.st==='in'})}
  function startRound(){
    sched[ri]=PP.pick(STAGES[ri]);var id=gid();buildFor(id);winner=null;step.rk=1;
    startPositions();T=0;phase='count';phaseT=7.6;resetYaws();roulette(id,ri);hudKey='';
    if(mp.on()&&net.isHost)net.broadcast({t:'pa-round',r:ri,id:id});
  }
  function qualifTarget(){var n=players.filter(function(p){return p.st!=='out'}).length;return TY()==='race'?Math.max(2,Math.ceil(n*.67)):TY()==='surv'?Math.max(2,Math.ceil(n/2)):1}
  function count(t,cls){var e=$('pa-count');e.textContent=t;e.className='pa-count '+(cls||'');void e.offsetWidth;e.classList.add('on')}
  function banner(p,t,cls){banners[p.i]={t:t,c:cls,until:performance.now()+2600}}
  function say(t,m){$('pa-say').innerHTML='<b>'+esc(t)+'</b>'+(m?'<span>'+esc(m)+'</span>':'');$('pa-say').classList.remove('on');void $('pa-say').offsetWidth;$('pa-say').classList.add('on')}
  function qualify(p){p.fin=1;p.st='q';p.order=players.filter(function(q){return q.fin}).length;fxBurst(p.x,p.y,p.z,[0xffc23d,0xffffff,p.human?p.col:0x45c46a],14,5);if(p.human){sfx.play('win');banner(p,'QUALIFIÉ · '+p.order+(p.order===1?'er':'e'),'good')}}
  function eliminate(p){p.st='out';p.m.visible=false;fxBurst(p.x,Math.max(p.y,-3),p.z,[0xff5a3c,0xffffff],12,6);if(p.human){sfx.play('lose');banner(p,'ÉLIMINÉ','bad')}else sfx.play('crash')}
  function step(dt){
    if(phase==='count'){phaseT-=dt;var c=Math.ceil(phaseT);if(c!==step.lc&&c>0&&c<=3){step.lc=c;sfx.play('tick');count(String(c),'n'+c)}if(phaseT<=0){phase='play';count('PARTEZ !','go');sfx.play('go')}stepObs(dt);hud();return}
    if(phase==='inter'){phaseT-=dt;if(phaseT<=0){ri++;startRound()}return}
    if(phase!=='play')return;
    T+=dt;stepObs(dt);var id=gid();
    players.forEach(function(p){if(p.st!=='in')return;if(p.bot)ai(p,dt);physics(p,dt);
      if(id==='doors'){if(p.y<-8){p.y=1;p.vy=0;p.z=Math.min(p.z+4,2)}if(p.z<-84&&!p.fin)qualify(p)}
      else if(id==='summit'){if(p.y<-6){p.x=(Math.random()-.5)*16;p.z=12;p.y=1;p.vx=p.vy=p.vz=0}var cr=SUMMIT[15];if(cr&&!winner&&Math.hypot(p.x-cr.x,p.z-cr.z)<1.6&&p.y>cr.y-.2){winner=p;p.st='crown'}}
      else if(id==='race'){if(p.z<-44)p.cp=Math.max(p.cp,1);if(p.z<-74)p.cp=Math.max(p.cp,2);
        if(p.y<-8){var cz=[-2,-49,-77][p.cp];p.x=(Math.random()-.5)*6;p.z=cz;p.y=1;p.vx=p.vy=p.vz=0;p.stun=.4;fxBurst(p.x,0,p.z,0xffffff,8,3)}
        if(p.z<-108&&!p.fin)qualify(p)}
      else if(p.y<(id==='hex'?-12:-6))eliminate(p);
    });
    /* les qualifiés avancent un peu après la ligne et font la fête */
    players.forEach(function(p){if(p.st==='q'){var endZ=id==='doors'?-92:-118;if(p.z>endZ){p.z-=dt*3;p.face=0}p.vx=p.vz=0;p.g=true}});
    tiles.forEach(function(t){if(t.st===1){t.t-=dt;if(t.t<=0){t.st=2}}});
    if(id==='rocks'){step.rk=(step.rk||0)-dt;if(step.rk<=0){step.rk=Math.max(.22,.75-T*.008);spawnRock()}}
    if(id==='spin'&&T>40){var rs9=Math.max(6,11-(T-40)*.08);floorsL[0].r=rs9;floorsL[0].m.scale.set(rs9/11,1,rs9/11)}
    if(id==='arena'&&T>25){var rr=Math.max(4,11-(T-25)*.12);floorsL[0].r=rr;floorsL[0].m.scale.set(rr/11,1,rr/11)}
    var target=qualifTarget(),left=aliveList();
    if(id==='summit'){if(winner){players.forEach(function(p){if(p!==winner)p.st='out'});winner.st='in';endRound()}return hud()}
    if(TY()==='race'){var q=players.filter(function(p){return p.st==='q'}).length;if(T>100&&q<target){left.sort(function(a,b){return a.z-b.z}).slice(0,target-q).forEach(function(p){p.st='q'});left=aliveList();q=target}if(q>=target||(left.length===0)){left.forEach(function(p){p.st='out';p.m.visible=false});endRound()}}
    else if(left.length<=target||T>(id==='rocks'?80:120)){if(id==='arena'&&left.length>1&&T<=120)return hud();endRound()}
    hud();
  }
  /* dalles : tremblent, rougissent puis tombent (aussi chez les invités) */
  function stepTiles(dt){tiles.forEach(function(t){if(t.st===1){t.m.position.y=t.y-.3+Math.sin(performance.now()*.06+t.x)*.05;t.m.material.color.lerp(TILE_RED,Math.min(1,dt*3))}else if(t.st===2&&t.m.visible){t.fall+=dt;t.m.position.y=t.y-.3-t.fall*t.fall*14;t.m.rotation.x=t.fall*1.2;if(t.fall>.7)t.m.visible=false}})}
  var TILE_RED=new THREE.Color(0xff5a3c);
  function endRound(){
    var id=gid();players.forEach(function(p){if(p.st==='q'||p.st==='in')p.st='ok'});
    var ok=players.filter(function(p){return p.st==='ok'});
    if(TY()==='final'||ok.length<=1||ri>=2){
      var w=winner&&winner.st==='ok'?winner:(ok.length?ok.sort(function(a,b){return (b.y||0)-(a.y||0)})[0]:null);winner=w;phase='end';
      finish(w);return}
    players.forEach(function(p){if(p.st==='ok')p.st='in'});
    inter();phase='inter';phaseT=5;
    if(mp.on()&&net.isHost)net.broadcast({t:'pa-inter',l:interList(),r:ri});
  }
  function interList(){return players.map(function(p){return [p.name,p.st==='out'?0:1,p.human?1:0,p.col,p.i]})}
  function pic(i,sz){var p=players[i];if(!p||!p.av||!PP.perso||!PP.perso.img)return '<i class="pa-dot" style="background:'+hx(p?p.col:0x888888)+'"></i>';try{return PP.perso.img(p.av,sz||40,'pa-pic')}catch(e){return ''}}
  function inter(list){
    list=list||interList();var el=$('pa-inter'),nq=list.filter(function(x){return x[1]}).length;
    el.innerHTML='<span class="pi-lbl">Fin de l\'épreuve '+(ri+1)+'</span><b class="pi-t">'+nq+' qualifiés</b><div class="pi-grid">'+list.map(function(x,k){return '<div class="pi-c '+(x[1]?'ok':'out')+(x[2]?' me':'')+'" style="--c:'+hx(x[3])+';animation-delay:'+(k*55)+'ms">'+pic(x[4]!=null?x[4]:k,36)+'<span>'+esc(x[0])+'<small>'+(x[1]?'qualifié':'éliminé')+'</small></span></div>'}).join('')+'</div><p class="pi-next">Prochaine épreuve : '+STAGES[Math.min(2,ri+1)].map(function(k){return '<b style="--c:'+GAMES[k].c+'">'+GAMES[k].g+' '+esc(GAMES[k].n)+'</b>'}).join(' ou ')+'</p>';
    el.hidden=false;clearTimeout(inter.t);inter.t=setTimeout(function(){el.hidden=true},4800);
  }
  function finish(w){
    running=false;cancelAnimationFrame(raf);
    var t=w?(w.human?w.name+' est le dernier debout !':w.name+' (bot) gagne…'):'Personne ne reste debout';
    if(w&&w.human&&(!mp.on()&&w.i===0||mp.on()&&w.name===net.me.name))PP.stat('party','win');
    if(w&&w.human)sfx.play('win');else sfx.play('lose');
    $('pa-title').textContent=t;$('pa-msg').innerHTML=(w?'<span class="pa-winpic">'+pic(w.i,64)+'</span>':'')+'Les 12 repartent à zéro pour un nouveau tour.';confetti();$('pa-start').textContent=mp.on()?'Relancer pour tout le salon':'Rejouer';$('pa-start').hidden=mp.on()&&!net.isHost;ovShow(true);
    if(mp.on()&&net.isHost)net.broadcast({t:'pa-end',title:t,w:w?w.i:-1});
    showWin(w);
  }
  function confetti(){var box=$('pa-confetti');box.innerHTML='';for(var i=0;i<70;i++){var d=document.createElement('i');d.style.left=Math.random()*100+'%';d.style.background=['#ff5a3c','#3fa9ff','#ffc23d','#45c46a','#ffffff','#ff6fb1','#a45cf0'][i%7];d.style.animationDelay=(Math.random()*1.2)+'s';d.style.animationDuration=(2+Math.random()*1.6)+'s';box.appendChild(d)}setTimeout(function(){box.innerHTML=''},4200)}
  function rankOf(p){var l=players.filter(function(q){return q.st!=='out'}).sort(function(a,b){var fa=a.st==='q'?-1000+(a.order||0):a.z,fb=b.st==='q'?-1000+(b.order||0):b.z;return fa-fb});return l.indexOf(p)+1}
  function hud(){
    var id=gid(),G=GAMES[id],left=aliveList().length,q=players.filter(function(p){return p.st==='q'}).length,big,sm;
    if(TY()==='race'){big=q+'<i>/'+qualifTarget()+'</i>';sm='qualifiés'}
    else if(id==='summit'){big=(SUMMIT.length?Math.max.apply(null,aliveList().map(function(p){return Math.round(p.y)}).concat([0])):0)+'<i> m</i>';sm='le plus haut · couronne à '+Math.round(SUMMIT[15]?SUMMIT[15].y:0)+' m'}
    else{big=left+'';sm=TY()==='surv'?'debout · il en faut '+qualifTarget():'encore debout'}
    var me=views()[0],rk=me&&TY()==='race'&&views().length===1&&me.st!=='out'?rankOf(me):0;
    var tm=phase==='play'?Math.floor(T/60)+':'+('0'+Math.floor(T%60)).slice(-2):'';
    var key=id+big+sm+rk+tm+ri;if(key===hudKey)return;hudKey=key;
    $('pa-top').innerHTML='<div class="pt-l" style="--c:'+G.c+'"><span class="pt-step">'+STAGES.map(function(r,k){return '<i class="'+(k<ri?'done':k===ri?'now':'')+'"></i>'}).join('')+'Épreuve '+(ri+1)+'/3</span><b class="pt-game"><em>'+G.g+'</em>'+esc(G.n)+'</b></div>'+
      '<div class="pt-c"><b>'+big+'</b><small>'+esc(sm)+'</small></div>'+
      '<div class="pt-r">'+(rk?'<span class="pt-rank"><b>'+rk+'</b>'+(rk===1?'er':'e')+'</span>':'')+(tm?'<span class="pt-time">'+tm+'</span>':'')+'</div>';
  }
  function views(){
    if(mp.on())return [players[myIdx]].filter(Boolean);
    return players.filter(function(p){return p.human});
  }
  function rects(n,W,H){if(n<=1)return [[0,0,W,H]];if(n===2)return [[0,0,W/2,H],[W/2,0,W/2,H]];return [[0,H/2,W/2,H/2],[W/2,H/2,W/2,H/2],[0,0,W/2,H/2],[W/2,0,W/2,H/2]].slice(0,n)}
  function animAll(dt){
    players.forEach(function(p){if(!p.m.visible)return;animate(p,dt);if(p.tg){p.tg.visible=p.m.visible;p.tg.position.set(p.x,p.m.position.y+2.05,p.z)}});
    obs.forEach(function(o){if(o.k==='boost'&&o.m.material.map)o.m.material.map.offset.y-=dt*.9});
    stepTiles(dt);stepFx(dt);
  }
  function aimSun(x,y,z){sun.position.set(x+16,y+38,z+12);sun.target.position.set(x,y,z);sun.target.updateMatrixWorld()}
  function render(dt){
    if(!R3)return;dt=dt||0;animAll(dt);
    var vs=views(),sz=R3.getSize(V2),W=sz.x,H=sz.y,rs=rects(vs.length,W,H),now=performance.now(),lab='',sx=0,sy=0,sz2=0;
    vs.forEach(function(p){sx+=p.x;sy+=p.y;sz2+=p.z});if(vs.length)aimSun(sx/vs.length,Math.max(-4,sy/vs.length),sz2/vs.length);
    players.forEach(function(p){if(p.tg)p.tg.visible=p.m.visible&&(vs.length>1||!mp.on()||p.i!==myIdx)});
    R3.setScissorTest(true);
    vs.forEach(function(p,k){
      var c=cams[k];if(!c){c=cams[k]=new THREE.PerspectiveCamera(62,1,.1,600);c.userData.t=new THREE.Vector3(p.x,p.y,p.z);c.userData.fov=62}
      var tgt=p;if(p.st!=='in'){var al=aliveList();if(al.length)tgt=al.sort(function(a,b){return a.z-b.z})[0]}
      var yk=mp.on()?0:p.i;
      if(tgt===p&&p.st==='in'&&!(k===0&&performance.now()-mouseT<2500)){var sp=Math.hypot(p.vx,p.vz);if(sp>2.5&&phase==='play'){var want=Math.atan2(-p.vx,-p.vz),df=angDiff(want,camYaw[yk]);if(Math.abs(df)<2.4)camYaw[yk]+=df*Math.min(1,dt*1.6)}}
      var y=tgt===p?camYaw[yk]:(TY()==='race'?0:Math.atan2(tgt.x,tgt.z));
      var t=c.userData.t;t.lerp(new THREE.Vector3(tgt.x,Math.max(tgt.y,-4),tgt.z),Math.min(1,dt*8));
      var pt=camPitch[yk]||.35,dist=k===0?camDist:7.5,hd=Math.cos(pt)*dist,hgt=Math.sin(pt)*dist+1.2;c.position.set(t.x+Math.sin(y)*hd,t.y+hgt,t.z+Math.cos(y)*hd);
      if(tgt.stun>0){c.position.x+=(Math.random()-.5)*.08;c.position.y+=(Math.random()-.5)*.08}
      c.lookAt(t.x,t.y+1.3,t.z);
      c.userData.fov=damp(c.userData.fov,62+(tgt.boost>0?9:0)+(tgt.dive>0?5:0),6,dt);
      var r=rs[k];c.fov=c.userData.fov;c.aspect=r[2]/r[3];c.updateProjectionMatrix();R3.setViewport(r[0],r[1],r[2],r[3]);R3.setScissor(r[0],r[1],r[2],r[3]);R3.render(scene,c);
      var bn=banners[p.i],sc=100/W,top=(H-r[1]-r[3])/H*100;
      lab+='<div class="pv" style="left:'+(r[0]*sc)+'%;top:'+top+'%;width:'+(r[2]*sc)+'%;height:'+(r[3]/H*100)+'%">'+(vs.length>1||p.st==='out'?'<span class="pv-n" style="--c:'+hx(p.col)+'">'+esc(p.name)+(p.st==='out'?' · spectateur':'')+'</span>':'')+(bn&&bn.until>now?'<b class="pv-b '+bn.c+'">'+esc(bn.t)+'</b>':'')+'</div>';
    });
    R3.setScissorTest(false);
    var pvEl=$('pa-views');if(pvEl.dataset.h!==lab){pvEl.innerHTML=lab;pvEl.dataset.h=lab}
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){if(!mp.on()||net.isHost){step(dt);sendState(dt)}else{guestStep(dt);yawAcc-=dt;if(yawAcc<=0){yawAcc=.1;net.send({t:'pa-yaw',y:+camYaw[0].toFixed(3)})}}render(dt);raf=requestAnimationFrame(loop)}}

  /* ---------- Vitrine derrière les menus : tout le monde attend sur la plateforme, ou le gagnant sur le podium ---------- */
  var showCam=null;
  function lineUp(){
    buildLobby();var n=players.length;
    players.forEach(function(p,k){var hu=p.human,row=hu?0:1,idx=hu?p.i:p.i-humans,cnt=hu?humans:n-humans,span=hu?Math.min(4.5,cnt*1.4):Math.min(13,cnt*1.25),u=cnt>1?idx/(cnt-1)-.5:0;
      var ang=u*span/(row?6.2:3.6);p.x=Math.sin(ang)*(row?6.2:3.6);p.z=-Math.cos(ang)*(row?6.2:3.6)+(row?1.2:3);p.y=0;p.face=Math.PI;p.dy=p.face;p.vx=p.vy=p.vz=0;p.g=true;p.st='in';p.stun=0;p.dive=0;p.boost=0;
      p.m.visible=true;p.an.mode=hu?'wave':'idle';p.an.cel=0});
  }
  function showWin(w){
    buildLobby();var pod=obs.filter(function(o){return o.k==='podium'})[0];if(pod&&w)pod.m.visible=true;
    var others=players.filter(function(p){return p!==w});
    others.forEach(function(p,k){var a=Math.PI*.15+k/Math.max(1,others.length-1)*Math.PI*.7;p.x=-Math.cos(a)*5.5;p.z=-Math.sin(a)*5.5+1;p.y=0;p.face=Math.atan2(p.x,p.z-1)+0;p.dy=p.face;p.m.visible=true;p.an.mode='clap';p.st='in';p.g=true;p.vx=p.vz=0;p.stun=0;p.dive=0});
    if(w){w.x=0;w.z=1;w.y=1;w.face=Math.PI;w.dy=w.face;w.m.visible=true;w.an.mode='cel';w.st='in';w.g=true;w.vx=w.vz=0;w.stun=0;w.dive=0}
    showMode='win';startShow();
  }
  function startShow(){cancelAnimationFrame(showRaf);showLast=0;showRaf=requestAnimationFrame(showLoop)}
  function showLoop(t){
    if(running||PP.cur()!=='party'||!R3){showRaf=0;return}
    showRaf=requestAnimationFrame(showLoop);if(document.hidden)return;
    var dt=showLast?Math.min(.05,(t-showLast)/1000):0;showLast=t;showT+=dt;
    if(!showCam)showCam=new THREE.PerspectiveCamera(42,1,.1,600);
    players.forEach(function(p){if(showMode!=='win'&&p.an.mode==='idle'&&Math.random()<dt*.08)p.an.mode='wave';else if(p.an.mode==='wave'&&!p.human&&Math.random()<dt*.6)p.an.mode='idle'});
    animAll(dt);
    var sz=R3.getSize(V2),a=Math.sin(showT*.25)*.35,d=showMode==='win'?8.5:11.5,ty=showMode==='win'?1.7:1.2;
    showCam.position.set(Math.sin(a)*d,ty+2.6,Math.cos(a)*d+1);showCam.lookAt(0,ty,showMode==='win'?0:0);showCam.aspect=sz.x/sz.y;showCam.updateProjectionMatrix();
    aimSun(0,0,0);players.forEach(function(p){if(p.tg)p.tg.visible=false});
    R3.setScissorTest(false);R3.setViewport(0,0,sz.x,sz.y);R3.render(scene,showCam);
    var pv=$('pa-views');if(pv.dataset.h){pv.innerHTML='';pv.dataset.h=''}
  }

  /* ---------- Salon ---------- */
  function sendState(dt){
    if(!mp.on()||!net.isHost)return;sendT-=dt;if(sendT>0)return;sendT=.05;
    net.broadcast({t:'pa-s',r:ri,id:gid(),dr:obs.filter(function(o){return o.k==='door'}).map(function(o){return o.alive?1:0}).join(''),rk:obs.filter(function(o){return o.k==='rock'}).map(function(o){return [+o.x.toFixed(1),+o.y.toFixed(1),+o.z.toFixed(1)]}),T:+T.toFixed(2),ph:phase,pt:+phaseT.toFixed(2),p:players.map(function(p){return [+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2),+p.face.toFixed(2),p.st==='in'?1:p.st==='q'?2:0,+p.vx.toFixed(1),+p.vz.toFixed(1),p.g?1:0,p.dive>0?1:0,p.stun>0?1:0,+p.vy.toFixed(1)]}),ti:tiles.length?tiles.map(function(t){return t.st}).join(''):'',a:obs.map(function(o){return o.a!==undefined?+o.a.toFixed(3):0}),fr:floorsL[0]&&floorsL[0].disk?+floorsL[0].r.toFixed(2):0});
  }
  var gs=null;
  function guestStep(dt){
    if(!gs)return;T=gs.T;phase=gs.ph||phase;
    players.forEach(function(p,i){var s=gs.p[i];if(!s)return;var k=Math.min(1,dt*15);p.x+=(s[0]-p.x)*k;p.y+=(s[1]-p.y)*k;p.z+=(s[2]-p.z)*k;p.face=s[3];
      var ns=s[4]===1?'in':s[4]===2?'q':'out';if(ns!==p.st){if(ns==='out'&&p.st==='in')fxBurst(p.x,Math.max(p.y,-3),p.z,[0xff5a3c,0xffffff],12,6);if(ns==='q')fxBurst(p.x,p.y,p.z,[0xffc23d,0xffffff],14,5);if(i===myIdx){if(ns==='q'){sfx.play('win');banner(p,'QUALIFIÉ','good')}if(ns==='out'&&p.st==='in'){sfx.play('lose');banner(p,'ÉLIMINÉ','bad')}}}
      p.st=ns;p.m.visible=s[4]!==0;p.vx=s[5];p.vz=s[6];p.g=!!s[7];p.dive=s[8]?.2:0;p.stun=s[9]?.2:0;p.vy=s[10]||0});
    obs.forEach(function(o,k){if(o.k==='bar'){o.a=gs.a[k];o.g.rotation.y=o.a}});stepObsGuest();
    if(gs.ti)tiles.forEach(function(t,k){var v=+gs.ti[k];if(v>t.st)t.st=v});
    if(gs.dr){var ds=obs.filter(function(o){return o.k==='door'});ds.forEach(function(o,k){if(gs.dr[k]==='0'&&o.alive){o.alive=false}})}
    if(gs.rk){var rs2=obs.filter(function(o){return o.k==='rock'});while(rs2.length<gs.rk.length){var mm=rockMesh();level.add(mm);var o2={k:'rock',m:mm,gst:1};obs.push(o2);rs2.push(o2)}rs2.forEach(function(o,k){var r=gs.rk[k];if(r){o.m.visible=true;o.m.position.set(r[0],r[1],r[2]);o.m.rotation.x+=.05}else o.m.visible=false})}
    stepNewObs(dt,false);
    if(gs.fr&&floorsL[0]&&floorsL[0].disk)floorsL[0].m.scale.set(gs.fr/11,1,gs.fr/11);
    if(phase==='count'&&gs.pt!=null){var c=Math.ceil(gs.pt);if(c!==guestStep.lc&&c>0&&c<=3){guestStep.lc=c;sfx.play('tick');count(String(c),'n'+c)}}if(phase==='play'&&guestStep.ph==='count'){count('PARTEZ !','go');sfx.play('go')}guestStep.ph=phase;
    hud();
  }
  function stepObsGuest(){obs.forEach(function(o){if(o.k==='ham'){o.x=o.cx+Math.sin(T*o.w+o.ph)*o.amp;o.m.position.x=o.x}if(o.k==='push'){o.x=Math.sin(T*o.w+o.ph)*o.amp;o.m.position.x=o.x}})}
  net.on(function(m){
    if(net.isHost||PP.cur()!=='party')return;
    if(m.t==='pa-go'){humans=m.n;begin()}
    if(m.t==='pa-round'){ri=m.r;sched[ri]=m.id;buildFor(m.id);startPositions();roulette(m.id,ri);hudKey=''}
    if(m.t==='pa-s'){gs=m;if(m.r!==ri||m.id!==sched[ri]){ri=m.r;sched[ri]=m.id;buildFor(m.id)}}
    if(m.t==='pa-say')say(m.a,m.b);
    if(m.t==='pa-inter'){ri=m.r;inter(m.l)}
    if(m.t==='pa-end'){running=false;cancelAnimationFrame(raf);$('pa-title').textContent=m.title;$('pa-msg').innerHTML=(m.w>=0?'<span class="pa-winpic">'+pic(m.w,64)+'</span>':'')+'L\'hôte peut relancer.';$('pa-start').hidden=true;ovShow(true);if(m.title.indexOf(net.me.name+' ')===0)PP.stat('party','win');showWin(m.w>=0?players[m.w]:null)}
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
  function ovShow(on){$('pa-ov').hidden=!on;$('pa-top').hidden=on;var d=$('pa-diff');if(d)d.hidden=mp.on();}
  function diffUI(){var d=$('pa-diff');if(!d)return;d.querySelectorAll('[data-d]').forEach(function(b){b.classList.toggle('on',b.dataset.d===diff)})}
  $('pa-modes').addEventListener('click',function(e){var b=e.target.closest('[data-n]');if(!b)return;humans=+b.dataset.n;$('pa-modes').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x===b)});if(!running&&R3){makePlayers();lineUp();showMode='lobby'}});
  var dEl=$('pa-diff');if(dEl)dEl.addEventListener('click',function(e){var b=e.target.closest('[data-d]');if(!b)return;diff=b.dataset.d;try{localStorage.setItem(PP.key('pa-diff'),diff)}catch(x){}diffUI();sfx.play('ui')});
  function begin(){
    if(!init())return;cancelAnimationFrame(showRaf);showRaf=0;ri=0;winner=null;gs=null;cams=[];banners={};hudKey='';$('pa-inter').hidden=true;$('pa-roul').hidden=true;myIdx=mp.on()?Math.max(0,net.slot(net.me.id)):0;makePlayers();
    ovShow(false);running=true;last=0;cancelAnimationFrame(raf);
    if(!mp.on()||net.isHost)startRound();else{sched[0]='race';buildRace();startPositions()}
    raf=requestAnimationFrame(loop);
  }
  $('pa-start').addEventListener('click',function(){if(mp.on()){if(!net.isHost)return;humans=Math.min(8,net.players.length);net.broadcast({t:'pa-go',n:humans})}begin()});
  PP._pa=function(){return {obs:function(){return obs},T:function(){return T},players:players,ri:function(){return ri},phase:function(){return phase},tiles:tiles,setRound:function(r){ri=r;startRound()},force:function(r,id){var s0=STAGES[r];STAGES[r]=[id];ri=r;startRound();STAGES[r]=s0},list:function(){return players}}};
  var INTRO='12 joueurs, 3 épreuves tirées au sort parmi 7 : une course, une survie, puis une finale. Le dernier debout gagne.';
  PP.games.party={
    open:function(){if(!init())return;
      if(!running){var on=mp.on();if(on)humans=Math.min(8,Math.max(2,net.players.length));else if(humans>4)humans=1;makePlayers();lineUp();showMode='lobby';startShow()}
      $('pa-start').hidden=false;$('pa-title').textContent='Dernier Debout';$('pa-start').textContent='Jouer';diffUI();
      $('pa-msg').innerHTML=esc(INTRO)+'<span class="pa-games">'+Object.keys(GAMES).map(function(k){var g=GAMES[k];return '<i style="--c:'+g.c+'" title="'+esc(g.n)+'">'+g.g+'</i>'}).join('')+'</span>';ovShow(true);
      if(mp.lobby('pa','Dernier Debout'))$('pa-msg').textContent=net.isHost?net.players.length+' joueurs dans le salon, chacun avec son perso. ZQSD ou flèches pour bouger, Espace pour sauter, encore Espace en l\'air pour plonger.':'L\'hôte va lancer. ZQSD ou flèches pour bouger, Espace pour sauter, encore Espace en l\'air pour plonger.'},
    close:function(){if(running){running=false;cancelAnimationFrame(raf)}cancelAnimationFrame(showRaf);showRaf=0}
  };
})();
