/* Pixel Pause — Voltige : jeu de mouvement en 3D. Sprint, double saut, course sur les murs, saut de mur,
   glissade, grappin, escalade des rebords. Trois armes (inventaire 1-2-3), des cibles à exploser ou des zombies.
   Grande ville avec mini-carte. Pas de barre de vie : un zombie qui te touche te fait perdre des points. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,V=null,BOX=[],RND;
  function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
  /* v95 : les armes de Zone Morte (mêmes modèles, mêmes dégâts) */
  var K=PP.fpsKit,WK=['pistol','smg','shotgun','rifle','sniper','rocket'],WEAP=WK.map(function(k){var g=K.GUNS[k];return {k:k,n:g.n,cd:k==='rocket'?1:Math.max(.06,g.rate),mag:k==='rocket'?4:g.mag,rl:Math.min(2,g.rel),dmg:g.dmg,sp:g.spread*.8,pel:g.pel,auto:g.auto,kick:Math.min(1.2,.2+g.kick*7),climb:g.kick*.35,rk:!!g.rk}}),RKT=WEAP[5];
  var G=26,JV=8.6,WALK=7.6,SPR=11.8,ACC=70,AIR=22,FRIC=11,R=.36;
  function lam(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))}
  /* v51 : figures et combo. Chaque figure (mur, balancement, glissade, tremplin…) monte le multiplicateur, qui retombe au bout de 5 s. */
  function trick(C,n,pts){if(n!==V.trickN||!V.combo)V.combo=Math.min(5,(V.combo||0)+1);V.comboT=5;V.score+=pts;V.trickN=n}
  /* point d'accroche du grappin : là où on vise, sinon le premier bâtiment trouvé un peu plus haut (aide à la visée) */
  function anchor(C,assist){var o=C.cam.position,q=C.cam.quaternion,tr=assist?[[0,0],[.2,0],[.4,0],[.2,.28],[.2,-.28],[.62,0],[.45,.45],[.45,-.45],[.9,0]]:[[0,0]];
    for(var i=0;i<tr.length;i++){var d=new THREE.Vector3(Math.tan(tr[i][1]),Math.tan(tr[i][0]),-1).normalize().applyQuaternion(q),r=rayWorld(o,d,110);
      if(r.b&&!r.b.pad&&r.t<110&&r.t>2.5){var pt=o.clone().addScaledVector(d,r.t);if(i===0||pt.y>V.pos.y+5)return pt}}return null}
  function release(C){if(!V.grap)return;var v=V.vel;if(V.gMode==='s'&&v.length()>13){trick(C,'BALANCEMENT',100);v.multiplyScalar(1.08);v.y+=2.5}V.grap=null;V.jumps=Math.min(V.jumps,1);inv()}
  function skyTex(){var c=document.createElement('canvas');c.width=4;c.height=256;var g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#5b8fd0');gr.addColorStop(.45,'#b9cfe0');gr.addColorStop(.62,'#f0d9b5');gr.addColorStop(1,'#f0d9b5');g.fillStyle=gr;g.fillRect(0,0,4,256);var t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
  function winTex(base,lit){var c=document.createElement('canvas');c.width=64;c.height=128;var g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,64,128);
    for(var y=6;y<128;y+=16)for(var x=5;x<64;x+=15){g.fillStyle=Math.random()<lit?'#ffe9a8':'rgba(20,24,40,.55)';g.fillRect(x,y,9,10)}var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t}
  function addBox(sc,x0,y0,z0,x1,y1,z1,mat,wall){BOX.push({x0:x0,y0:y0,z0:z0,x1:x1,y1:y1,z1:z1,wall:!!wall});if(!sc)return;var m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.castShadow=m.receiveShadow=true;sc.add(m);return m}
  /* ---------- la ville ---------- */
  /* v73 : ville bien plus grande (9×9 pâtés), immeubles bien plus hauts (tours jusqu'à 130 m), trottoirs, marquages, toits détaillés */
  function glassTex(base){var c=document.createElement('canvas');c.width=64;c.height=128;var g=c.getContext('2d');var gr=g.createLinearGradient(0,0,64,128);gr.addColorStop(0,base);gr.addColorStop(1,'#1d2a3a');g.fillStyle=gr;g.fillRect(0,0,64,128);
    g.fillStyle='rgba(255,255,255,.08)';for(var y=0;y<128;y+=8)g.fillRect(0,y,64,1);g.fillStyle='rgba(20,24,30,.7)';for(var x=0;x<64;x+=16)g.fillRect(x,0,2,128);
    for(var y2=2;y2<128;y2+=8)for(var x2=3;x2<64;x2+=16)if(Math.random()<.12){g.fillStyle='rgba(255,233,168,.75)';g.fillRect(x2,y2,12,5)}var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t}
  function buildCity(C){var sc=C.scene;BOX=[];RND=rng(77);V.grid=null;
    var N=9,BS=18,ST=11,S0=-(N*(BS+ST))/2;V.lim=-S0+6;var L2=V.lim;
    sc.background=skyTex();sc.fog=new THREE.Fog(0xf0d9b5,110,L2*2.6);
    sc.add(new THREE.HemisphereLight(0xfff4e0,0x6a5a4a,1.0));var sun=new THREE.DirectionalLight(0xffe2b8,1.3);sun.position.set(40,90,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;var sc2=sun.shadow.camera;sc2.left=sc2.bottom=-70;sc2.right=sc2.top=70;sc2.far=320;sc.add(sun);sc.add(sun.target);V.sun=sun;
    /* sol : asphalte + lignes */
    var gtx=document.createElement('canvas');gtx.width=gtx.height=256;var gg=gtx.getContext('2d');gg.fillStyle='#38373d';gg.fillRect(0,0,256,256);for(var i=0;i<900;i++){gg.fillStyle=Math.random()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.06)';gg.fillRect(Math.random()*256,Math.random()*256,2,2)}
    var gt=new THREE.CanvasTexture(gtx);gt.wrapS=gt.wrapT=THREE.RepeatWrapping;var GS=L2*2+80;gt.repeat.set(GS/8,GS/8);gt.colorSpace=THREE.SRGBColorSpace;
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(GS,GS),new THREE.MeshLambertMaterial({map:gt}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;sc.add(ground);
    var lineM=new THREE.MeshBasicMaterial({color:0xe8dcc0}),walkM=lam(0x8d8a86),curbM=lam(0xb9b4ac);
    var dash=[];for(var li=0;li<=N;li++){var c0=S0+li*(BS+ST);for(var a0=S0;a0<-S0;a0+=6){dash.push([c0,a0+3,0]);dash.push([a0+3,c0,1])}}
    var dm=new THREE.InstancedMesh(new THREE.PlaneGeometry(.22,2.6),lineM,dash.length),dO=new THREE.Object3D();dash.forEach(function(d,i){dO.position.set(d[0],.03,d[1]);dO.rotation.set(-Math.PI/2,0,d[2]?Math.PI/2:0);dO.updateMatrix();dm.setMatrixAt(i,dO.matrix)});sc.add(dm);
    var mats=['#c9b79a','#9fb3c8','#d29a7a','#b5c2a0','#e0c98a','#a99ab8','#d8cfc0','#b98f78'].map(function(c){return new THREE.MeshLambertMaterial({map:winTex(c,.25)})}),
      glass=['#4f7aa8','#5e8f9a','#6a7fa0','#3f6a8a'].map(function(c){return new THREE.MeshLambertMaterial({map:glassTex(c)})}),
      roof=lam(0x5a5560),trim=lam(0x2e2b30),wallM=lam(0xe2361b),plat=lam(0xf1ece2),ramp=lam(0x3fa9ff),tank=lam(0x8a6a4a),ant=lam(0xd8d2c8),redL=new THREE.MeshBasicMaterial({color:0xff3b2a});
    function facade(b,m,w,h,d){if(!b)return;b.material=m.clone();b.material.map=m.map.clone();b.material.map.needsUpdate=true;b.material.map.repeat.set(Math.max(1,Math.max(w,d)/6),h/8)}
    var mid=(N-1)/2,parks=[];
    for(var bx=0;bx<N;bx++)for(var bz=0;bz<N;bz++){var x0=S0+bx*(BS+ST)+ST/2,z0=S0+bz*(BS+ST)+ST/2;
      /* trottoir */var sw=new THREE.Mesh(new THREE.BoxGeometry(BS+2.4,.14,BS+2.4),walkM);sw.position.set(x0+BS/2,.07,z0+BS/2);sw.receiveShadow=true;sc.add(sw);
      if(bx===mid&&bz===mid){/* place centrale : plateformes en escalier et un mât */for(var k=0;k<6;k++)addBox(sc,x0+2+k*2.4,0,z0+3+k*1.6,x0+4.2+k*2.4,1.2+k*1.4,z0+5.2+k*1.6,plat);addBox(sc,x0+14,0,z0+12,x0+15,16,z0+13,plat);continue}
      if((bx===1&&bz===6)||(bx===6&&bz===2)){var gr=new THREE.Mesh(new THREE.PlaneGeometry(BS,BS),lam(0x5f8f3e));gr.rotation.x=-Math.PI/2;gr.position.set(x0+BS/2,.15,z0+BS/2);gr.receiveShadow=true;sc.add(gr);parks.push([x0,z0]);/* parcs : quelques blocs bas pour sauter */for(var k2=0;k2<7;k2++){var px0=x0+1+RND()*(BS-4),pz0=z0+1+RND()*(BS-4),ph=.8+RND()*3;addBox(sc,px0,0,pz0,px0+2.5,ph,pz0+2.5,k2%2?plat:ramp)}continue}
      var dc=Math.max(Math.abs(bx-mid),Math.abs(bz-mid)),split=RND()<.55,parts=split?(RND()<.5?[[0,0,BS*.45,BS],[BS*.55,0,BS,BS]]:[[0,0,BS,BS*.45],[0,BS*.55,BS,BS]]):[[0,0,BS,BS]];
      parts.forEach(function(p){var w=p[2]-p[0],d=p[3]-p[1],r=RND(),h=10+Math.floor(RND()*8)*4,isT=false;
        if(r<.3){h=48+RND()*40;isT=true}if(dc<=1&&RND()<.55){h=85+RND()*45;isT=true}
        var gl=isT&&RND()<.6,m=gl?glass[Math.floor(RND()*glass.length)]:mats[Math.floor(RND()*mats.length)],cx=x0+(p[0]+p[2])/2,cz=z0+(p[1]+p[3])/2;
        var b=addBox(sc,x0+p[0],0,z0+p[1],x0+p[2],h,z0+p[3],m);facade(b,m,w,h,d);
        var cap=new THREE.Mesh(new THREE.BoxGeometry(w+.4,.45,d+.4),trim);cap.position.set(cx,h+.22,cz);sc.add(cap);
        var top=h;
        /* tours : un ou deux retraits en escalier, on peut s'y poser */
        if(isT&&w>6&&d>6){var steps=RND()<.5?2:1;for(var s=0;s<steps;s++){var ins=2+s*1.6,sh=10+RND()*18;if(w-2*ins<3||d-2*ins<3)break;var b2=addBox(sc,x0+p[0]+ins,top,z0+p[1]+ins,x0+p[2]-ins,top+sh,z0+p[3]-ins,m);facade(b2,m,w-2*ins,sh,d-2*ins);var c2=new THREE.Mesh(new THREE.BoxGeometry(w-2*ins+.4,.4,d-2*ins+.4),trim);c2.position.set(cx,top+sh+.2,cz);sc.add(c2);top+=sh}
          /* antenne avec feu rouge */var an=new THREE.Mesh(new THREE.CylinderGeometry(.12,.2,8,6),ant);an.position.set(cx,top+4,cz);sc.add(an);var lt=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),redL);lt.position.set(cx,top+8.2,cz);sc.add(lt)}
        else{/* toit : château d'eau, clim, petit muret */
          if(RND()<.5){var ax=x0+p[0]+1+RND()*(w-4),az=z0+p[1]+1+RND()*(d-4);addBox(sc,ax,h,az,ax+2.2,h+1.4,az+2.2,roof)}
          if(RND()<.35){var tx2=x0+p[0]+2+RND()*(w-5),tz2=z0+p[1]+2+RND()*(d-5);var tk=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,2.2,12),tank);tk.position.set(tx2,h+2.6,tz2);tk.castShadow=true;sc.add(tk);BOX.push({x0:tx2-1.1,y0:h+1.5,z0:tz2-1.1,x1:tx2+1.1,y1:h+3.7,z1:tz2+1.1});[[-.8,-.8],[.8,-.8],[-.8,.8],[.8,.8]].forEach(function(o){var lg=new THREE.Mesh(new THREE.BoxGeometry(.15,1.5,.15),trim);lg.position.set(tx2+o[0],h+.75,tz2+o[1]);sc.add(lg)})}}
        /* auvent rouge sur certaines façades : petite plateforme à 4 m */
        if(RND()<.3&&h>12){var side=RND()<.5?-1:1,az3=side<0?z0+p[1]-1.6:z0+p[3],ax3=x0+p[0]+1+RND()*Math.max(0,w-6);addBox(sc,ax3,4,az3,ax3+4,4.3,az3+1.6,wallM)}});
    }
    /* murs rouges pour courir dessus, dans les rues */
    for(var w=0;w<55;w++){var horiz=RND()<.5,line=Math.floor(RND()*(N+1)),off=S0+line*(BS+ST)+(RND()<.5?-2.4:2.4),a=S0+RND()*(N*(BS+ST)-20),L=12+RND()*10,hh=5+RND()*4;
      if(Math.abs(off)>L2-3)continue;if(horiz)addBox(sc,a,1.2,off-.35,a+L,1.2+hh,off+.35,wallM,true);else addBox(sc,off-.35,1.2,a,off+.35,1.2+hh,a+L,wallM,true)}
    /* passerelles et petits cubes pour sauter */
    for(var q=0;q<90;q++){var px=S0+RND()*N*(BS+ST),pz=S0+RND()*N*(BS+ST),py=1+RND()*12;if(hit(px-.5,py-1,pz-.5,px+2.9,py+2.5,pz+2.9))continue;addBox(sc,px,py,pz,px+2.4,py+.5,pz+2.4,RND()<.5?plat:ramp)}
    /* tremplins jaunes dans les rues : on atterrit dessus et on s'envole */
    var padM=lam(0xf3c623),np=0;for(var pd=0;pd<200&&np<36;pd++){var onX=RND()<.5,sl=S0+Math.floor(RND()*(N+1))*(BS+ST)+(RND()-.5)*4,fr=S0+RND()*N*(BS+ST),ax2=onX?sl:fr,az2=onX?fr:sl;
      if(Math.abs(ax2)>L2-4||Math.abs(az2)>L2-4||hit(ax2-1.6,0,az2-1.6,ax2+1.6,3,az2+1.6))continue;addBox(sc,ax2-1.3,0,az2-1.3,ax2+1.3,.3,az2+1.3,padM);BOX[BOX.length-1].pad=true;np++}
    /* lampadaires (décor) */
    var lamps=[];for(var lp=0;lp<90;lp++){var onX2=RND()<.5,sl2=S0+Math.floor(RND()*(N+1))*(BS+ST)+(RND()<.5?-4.6:4.6),fr2=S0+RND()*N*(BS+ST),lx=onX2?sl2:fr2,lz=onX2?fr2:sl2;if(Math.abs(lx)>L2-3||Math.abs(lz)>L2-3||hit(lx-.3,0,lz-.3,lx+.3,5,lz+.3))continue;lamps.push([lx,lz])}
    var pm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.1,5,6),lam(0x2e2b30),lamps.length),bm=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.18,.3),new THREE.MeshBasicMaterial({color:0xfff2c0}),lamps.length),lo=new THREE.Object3D();
    lamps.forEach(function(l,i){lo.position.set(l[0],2.5,l[1]);lo.updateMatrix();pm.setMatrixAt(i,lo.matrix);lo.position.y=5;lo.updateMatrix();bm.setMatrixAt(i,lo.matrix)});pm.castShadow=true;sc.add(pm);sc.add(bm);
    /* v95 : la ville refaite : passages piétons, voitures garées (on peut monter dessus), arbres le long des trottoirs et dans les parcs */
    var RC=function(i){return S0+i*(BS+ST)},stripes=[];
    for(var ix=0;ix<=N;ix++)for(var iz=0;iz<=N;iz++){var icx=RC(ix),icz=RC(iz);for(var sd=-1;sd<=1;sd+=2)for(var k5=-3;k5<=3;k5++){stripes.push([icx+sd*(ST/2+1.4),icz+k5*1.3,0]);stripes.push([icx+k5*1.3,icz+sd*(ST/2+1.4),1])}}
    var swM=new THREE.MeshBasicMaterial({color:0xece6d8}),sim=new THREE.InstancedMesh(new THREE.PlaneGeometry(2.4,.6),swM,stripes.length),so=new THREE.Object3D();stripes.forEach(function(t,i){so.position.set(t[0],.035,t[1]);so.rotation.set(-Math.PI/2,0,t[2]?Math.PI/2:0);so.updateMatrix();sim.setMatrixAt(i,so.matrix)});sc.add(sim);
    var carC=[0xe2361b,0x3fa9ff,0xf3c623,0xf1ece2,0x2a2a30,0x3fbf6a,0x8a8f99,0xa46cf0].map(function(c){return new THREE.MeshStandardMaterial({color:c,roughness:.35,metalness:.4})}),cabM=new THREE.MeshStandardMaterial({color:0x1d2633,roughness:.15,metalness:.6}),tyM=lam(0x141414),hlM=new THREE.MeshBasicMaterial({color:0xfff2c0}),nc=0;
    for(var ct=0;ct<400&&nc<80;ct++){var alongX=RND()<.5,li2=Math.floor(RND()*(N+1)),side=RND()<.5?-1:1,bi=Math.floor(RND()*N),t0=RC(bi)+ST/2+2+RND()*(BS-6),c1=RC(li2)+side*3.4;
      var cx2=alongX?t0:c1,cz2=alongX?c1:t0,hx=alongX?2.1:.95,hz=alongX?.95:2.1;if(Math.abs(cx2)>L2-4||Math.abs(cz2)>L2-4||hit(cx2-hx-.4,0,cz2-hz-.4,cx2+hx+.4,2,cz2+hz+.4))continue;
      var cm=carC[Math.floor(RND()*carC.length)];addBox(sc,cx2-hx,.32,cz2-hz,cx2+hx,1.05,cz2+hz,cm);var cs=alongX?[1.15,.85]:[.85,1.15];addBox(sc,cx2-cs[0],1.05,cz2-cs[1],cx2+cs[0],1.65,cz2+cs[1],cabM);
      var tb=new THREE.Mesh(new THREE.BoxGeometry(hx*2-.3,.34,hz*2+.06),tyM);tb.position.set(cx2,.17,cz2);sc.add(tb);[-1,1].forEach(function(e){var hl=new THREE.Mesh(new THREE.BoxGeometry(alongX?.04:.5,.14,alongX?.5:.04),hlM);hl.position.set(cx2+(alongX?e*(hx+.01):0),.8,cz2+(alongX?0:e*(hz+.01)));sc.add(hl)});nc++}
    var trees=[];for(var tt=0;tt<500&&trees.length<170;tt++){var bx4=Math.floor(RND()*N),bz4=Math.floor(RND()*N),ex0=RC(bx4)+ST/2,ez0=RC(bz4)+ST/2,sd4=Math.floor(RND()*4),u=1.5+RND()*(BS-3),tx4,tz4;
      if(sd4===0){tx4=ex0+u;tz4=ez0-.65}else if(sd4===1){tx4=ex0+u;tz4=ez0+BS+.65}else if(sd4===2){tx4=ex0-.65;tz4=ez0+u}else{tx4=ex0+BS+.65;tz4=ez0+u}
      if(hit(tx4-.6,0,tz4-.6,tx4+.6,4,tz4+.6)||trees.some(function(q){return Math.abs(q[0]-tx4)+Math.abs(q[1]-tz4)<5}))continue;trees.push([tx4,tz4,.8+RND()*.5])}
    parks.forEach(function(pk){for(var n2=0;n2<9;n2++){var px2=pk[0]+1.5+RND()*(BS-3),pz2=pk[1]+1.5+RND()*(BS-3);if(!hit(px2-.8,0,pz2-.8,px2+.8,4,pz2+.8))trees.push([px2,pz2,1+RND()*.6])}});
    var trM=lam(0x6a4a2e),lfM=[0x4f8a3a,0x5e9a44,0x3f7a34,0x7aa84a].map(function(c){return lam(c)}),tkI=new THREE.InstancedMesh(new THREE.CylinderGeometry(.14,.2,2.6,7),trM,trees.length),lfI=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.5,1),lfM[0],trees.length),to=new THREE.Object3D(),tcol=new THREE.Color();
    trees.forEach(function(t,i){to.position.set(t[0],1.3*t[2],t[1]);to.scale.set(t[2],t[2],t[2]);to.rotation.set(0,RND()*6,0);to.updateMatrix();tkI.setMatrixAt(i,to.matrix);to.position.y=3.4*t[2];to.scale.set(t[2],t[2]*1.15,t[2]);to.updateMatrix();lfI.setMatrixAt(i,to.matrix);tcol.setHSL(.27+RND()*.08,.4+RND()*.2,.3+RND()*.12);lfI.setColorAt(i,tcol);BOX.push({x0:t[0]-.2,y0:0,z0:t[1]-.2,x1:t[0]+.2,y1:2.6*t[2],z1:t[1]+.2,tree:true})});
    lfI.material=new THREE.MeshLambertMaterial({color:0xffffff});tkI.castShadow=lfI.castShadow=true;sc.add(tkI);sc.add(lfI);
    /* bords de la carte */
    [[-L2-2,-L2,L2+2,-L2+.01],[-L2-2,L2,L2+2,L2+2],[-L2-2,-L2,-L2,L2],[L2,-L2,L2+2,L2]].forEach(function(b){addBox(sc,b[0],0,b[1]-(b[1]===b[3]?1:0),b[2],10,b[3],lam(0x8a8478))});
    /* mini-carte pré-dessinée */
    var MS=360,mc=document.createElement('canvas');mc.width=mc.height=MS;var m2=mc.getContext('2d');m2.fillStyle='#2b2a30';m2.fillRect(0,0,MS,MS);var sM=MS/(2*L2);
    BOX.slice().sort(function(a,b){return a.y1-b.y1}).forEach(function(b){if(b.y0>2&&!b.wall&&b.y1-b.y0<6)return;m2.fillStyle=b.tree?'#5f8f3e':b.pad?'#f3c623':b.wall?'#e2361b':'rgba(241,236,226,'+Math.min(.95,.25+b.y1/110)+')';m2.fillRect((b.x0+L2)*sM,(b.z0+L2)*sM,Math.max(1,(b.x1-b.x0)*sM),Math.max(1,(b.z1-b.z0)*sM))});V.mapImg=mc;
    /* grille de collisions : bien plus rapide avec une grande ville */
    V.cell=12;V.grid={};BOX.forEach(function(b,bi){for(var gx=Math.floor(b.x0/V.cell);gx<=Math.floor(b.x1/V.cell);gx++)for(var gz=Math.floor(b.z0/V.cell);gz<=Math.floor(b.z1/V.cell);gz++){var key=gx+','+gz;(V.grid[key]||(V.grid[key]=[])).push(b)}})}
  /* ---------- collisions ---------- */
  function hit(x0,y0,z0,x1,y1,z1){if(V&&V.grid){var c=V.cell,gx1=Math.floor(x1/c),gz1=Math.floor(z1/c);for(var gx=Math.floor(x0/c);gx<=gx1;gx++)for(var gz=Math.floor(z0/c);gz<=gz1;gz++){var Lc=V.grid[gx+','+gz];if(Lc)for(var j=0;j<Lc.length;j++){var q=Lc[j];if(x1>q.x0&&x0<q.x1&&y1>q.y0&&y0<q.y1&&z1>q.z0&&z0<q.z1)return q}}return null}for(var i=0;i<BOX.length;i++){var b=BOX[i];if(x1>b.x0&&x0<b.x1&&y1>b.y0&&y0<b.y1&&z1>b.z0&&z0<b.z1)return b}return null}
  function height(){return V.slide>0?1.0:1.8}
  function moveAxis(ax,d){var p=V.pos,h=height();p[ax]+=d;var b=hit(p.x-R,p.y,p.z-R,p.x+R,p.y+h,p.z+R);if(!b)return null;
    if(ax==='y'){if(d<0){p.y=b.y1;V.vel.y=0;V.ground=true}else{p.y=b.y0-h-.001;V.vel.y=Math.min(0,V.vel.y)}return b}
    /* petite marche : on monte dessus */if(V.wasG&&b.y1-p.y<.6&&!hit(p.x-R,b.y1+.01,p.z-R,p.x+R,b.y1+h,p.z+R)){p.y=b.y1+.001;return null}
    if(ax==='x'){p.x=d>0?b.x0-R-.001:b.x1+R+.001;V.vel.x=0}else{p.z=d>0?b.z0-R-.001:b.z1+R+.001;V.vel.z=0}return b}
  function wallNear(){var p=V.pos,h=height(),e=V.wr?.6:1.0,y0=p.y+.3,y1=p.y+h-.2,res=null;
    var sides=[[1,0,p.x+R,p.z-R+.05,p.x+R+e,p.z+R-.05],[-1,0,p.x-R-e,p.z-R+.05,p.x-R,p.z+R-.05],[0,1,p.x-R+.05,p.z+R,p.x+R-.05,p.z+R+e],[0,-1,p.x-R+.05,p.z-R-e,p.x+R-.05,p.z-R]];
    sides.forEach(function(s){if(res)return;var b=hit(s[2],y0,s[3],s[4],y1,s[5]);if(b)res={nx:-s[0],nz:-s[1],b:b}});return res}
  function rayBox(o,d,b){var t0=0,t1=1e9;['x','y','z'].forEach(function(a){var lo=b[a+'0'],hi=b[a+'1'];if(Math.abs(d[a])<1e-9){if(o[a]<lo||o[a]>hi)t0=1e9}else{var ta=(lo-o[a])/d[a],tb=(hi-o[a])/d[a];if(ta>tb){var s=ta;ta=tb;tb=s}t0=Math.max(t0,ta);t1=Math.min(t1,tb)}});return t0<=t1?t0:1e9}
  function rayWorld(o,d,max){var best=max||1e9,bb=null;for(var i=0;i<BOX.length;i++){var t=rayBox(o,d,BOX[i]);if(t<best){best=t;bb=BOX[i]}}return {t:best,b:bb}}
  /* ---------- arme en main ---------- */
  /* v73 : armes refaites : vrais modèles (culasse, viseurs, chargeur, crosse), recul, éclair de bouche qui éclaire, traçantes, impacts, et un lance-roquettes (rocket jump !) */
  function gunModel(w){var g=new THREE.Group(),gun=K.gun(WEAP[w].k),GD=K.GUNS[WEAP[w].k];g.add(gun);
    var bb=new THREE.Box3().setFromObject(gun),mz=bb.min.z-.02,ud=gun.userData;
    var a=PP.perso&&PP.perso.get?PP.perso.get():{topCol:'#e2361b',skin:'#d9a07a'},glove=new THREE.MeshStandardMaterial({color:0x2a2724,roughness:.85}),sl=new THREE.MeshStandardMaterial({color:new THREE.Color(a.topCol||'#e2361b'),roughness:.9});
    function hand(h,back){var hd=new THREE.Mesh(new THREE.BoxGeometry(.05,.09,.08),glove);hd.position.set(h[0]+(back?.02:-.01),h[1],h[2]);g.add(hd);var dv=new THREE.Vector3(back?.24:-.38,-.45,.8).normalize(),len=.45,arm=new THREE.Mesh(new THREE.CapsuleGeometry(.05,len,4,10),sl);arm.position.set(h[0]+dv.x*(len/2+.04),h[1]-.03+dv.y*(len/2+.04),h[2]+dv.z*(len/2+.04));arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dv);g.add(arm)}
    hand(GD.grip,true);hand(GD.hg||[GD.grip[0]-.02,GD.grip[1]-.04,GD.grip[2]-.02],false);
    var fl=new THREE.Group(),fm=new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95,depthWrite:false});[0,1,2].forEach(function(i){var p=new THREE.Mesh(new THREE.PlaneGeometry(.16,.07),fm);p.rotation.z=i*Math.PI/3;fl.add(p)});var core=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0xfff6d0}));fl.add(core);
    fl.position.set(0,.03,mz);fl.visible=false;g.add(fl);g.userData.flash=fl;g.userData.mz=new THREE.Vector3(0,.03,mz);
    if(ud.pump){g.userData.pump=ud.pump;g.userData.pump0=ud.pump.position.z}if(ud.slide){g.userData.slide=ud.slide;g.userData.slide0=ud.slide.position.z}
    g.scale.setScalar(.62);g.traverse(function(o){if(o.isMesh)o.renderOrder=5});return g}
  function setWeapon(C,i){if(V.gun)C.cam.remove(V.gun);V.w=i;V.gun=gunModel(i);V.gun.position.set(.13,-.105,-.33);C.cam.add(V.gun);V.swap=.25;sfx.play('tick');inv()}
  /* ---------- cibles et zombies ---------- */
  function spawnTargets(C){var sc=C.scene;V.tg=[];var tries=0;while(V.tg.length<24&&tries<500){tries++;var x=(RND()*2-1)*(V.lim-6),z=(RND()*2-1)*(V.lim-6),y=2+RND()*55;
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
  /* v95 : les zombies de Zone Morte (modèles et animations), plusieurs types selon la vague */
  function zType(){var w=V.wave,r=Math.random();if(w>=5&&r<.07)return 'tank';if(w>=4&&r<.2)return 'armored';if(w>=3&&r<.32)return 'ghoul';if(w>=2&&r<.5)return 'runner';if(r<.62)return 'crawler';if(w>=3&&r<.7)return 'spitter';return 'walker'}
  function mkZombie(C,id,type,x,z){var m=K.zombie(type);m.position.set(x,0,z);C.scene.add(m);var T=K.GUNS&&K.ZT[type]||{hp:60,sp:2.3,sc:1},hp=T.hp*(1+V.wave*.1);
    var zz={id:id,type:type,m:m,x:x,z:z,tx:x,tz:z,y:0,hp:hp,max:hp,sp:Math.min(9,T.sp*1.45+V.wave*.12)*(.9+Math.random()*.2),sc:(T.sc||1)*m.scale.x/(T.sc||1),alive:true,hitCd:0,atk:0};zz.sc=m.scale.x;V.zs.push(zz);V.zmap[id]=zz;return zz}
  function spawnZombie(C){for(var k=0;k<30;k++){var pl=V.mp?mpPlayers():[[V.pos.x,V.pos.z]],o=pl[Math.floor(Math.random()*pl.length)],a=Math.random()*7,d=25+Math.random()*35,x=o[0]+Math.cos(a)*d,z=o[1]+Math.sin(a)*d;if(Math.abs(x)>V.lim-3||Math.abs(z)>V.lim-3)continue;if(hit(x-.4,0,z-.4,x+.4,1.9,z+.4))continue;mkZombie(C,V.zid++,zType(),x,z);return}}
  /* ---------- à plusieurs (salon) : le chef fait vivre les zombies, chacun envoie sa position ---------- */
  function mpPlayers(){var l=[[V.pos.x,V.pos.z,'me']],now=performance.now();Object.keys(V.rp).forEach(function(id){var r=V.rp[id];if(now-r.t<4000)l.push([r.x,r.z,id])});return l}
  function mpSend(d){if(V.mp&&V.C&&V.C.net)try{V.C.net.relay(d)}catch(e){}}
  function rpModel(C,id){var av=null,nm='?';(C.net.players||[]).forEach(function(q){if(q.id===id){av=q.av;nm=q.name}});var m=null;
    if(av&&PP.perso&&PP.perso.build){try{m=PP.perso.build(av)}catch(e){m=null}}
    if(!m){m=new THREE.Group();var b=new THREE.Mesh(new THREE.CapsuleGeometry(.35,1,4,10),lam(0x3fa9ff));b.position.y=.9;m.add(b);var h=new THREE.Mesh(new THREE.SphereGeometry(.25,12,10),lam(0xd9a07a));h.position.y=1.75;m.add(h)}
    var c=document.createElement('canvas');c.width=256;c.height=64;var g=c.getContext('2d');g.fillStyle='rgba(20,18,16,.8)';g.fillRect(0,8,256,48);g.fillStyle='#3fa9ff';g.fillRect(0,8,8,48);g.fillStyle='#f1ece2';g.font='700 30px "IBM Plex Mono",monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(String(nm).slice(0,12),132,33);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));sp.scale.set(2.2,.55,1);sp.position.y=2.45;m.add(sp);
    m.traverse(function(o){if(o.isMesh)o.castShadow=true});C.scene.add(m);return {m:m,n:nm,x:0,y:0,z:0,tx:0,ty:0,tz:0,yaw:0,s:0,k:0,t:0,ph:0}}
  function onNet(C,msg){if(msg.t!=='rel'||!V)return;var d=msg.d||{},from=msg.from;if(!d.t||d.t.indexOf('vt-')!==0)return;
    if(d.t==='vt-go'){if(!C.running&&PP.cur()==='volt'&&!V.host){C.d.start(C);C.go()}return}
    if(d.t==='vt-p'){var r=V.rp[from];if(!r)r=V.rp[from]=rpModel(C,from);if(!r.t){r.x=d.x;r.y=d.y;r.z=d.z}r.tx=d.x;r.ty=d.y;r.tz=d.z;r.yaw=d.yw;r.s=d.s;r.k=d.k;r.t=performance.now();return}
    if(d.t==='vt-bye'){var r2=V.rp[from];if(r2){C.scene.remove(r2.m);delete V.rp[from]}return}
    if(V.host){if(d.t==='vt-h'){var z=V.zmap[d.id];if(z&&z.alive)hurtZ(C,z,d.d,!!d.h,from)}return}
    if(d.t==='vt-z'){V.wave=d.w;V.time=d.tm;var seen={};d.z.forEach(function(e){var z=V.zmap[e[0]];if(!z){z=mkZombie(C,e[0],e[1],e[2],e[3])}if(!z.alive)return;seen[e[0]]=1;z.tx=e[2];z.tz=e[3];z.ry=e[4];z.hpF=e[5];if(e[6]&&!z.atkN)z.atk=.45;z.atkN=!!e[6]});
      V.zs.forEach(function(z){if(z.alive&&!seen[z.id]){z.alive=false;C.scene.remove(z.m)}});return}
    if(d.t==='vt-k'){var zk=V.zmap[d.id];if(zk&&zk.alive)killZ(C,zk,d.by===C.net.me.id,!!d.h);return}
    if(d.t==='vt-end'){V.board=d.b;finish(C);return}}
  function mpStep(C,dt){V.sendT=(V.sendT||0)-dt;if(V.sendT<=0){V.sendT=.08;mpSend({t:'vt-p',x:+V.pos.x.toFixed(2),y:+V.pos.y.toFixed(2),z:+V.pos.z.toFixed(2),yw:+V.yaw.toFixed(2),s:V.score,k:V.kills})}
    if(V.host){V.zsT=(V.zsT||0)-dt;if(V.zsT<=0){V.zsT=.1;mpSend({t:'vt-z',w:V.wave,tm:+V.time.toFixed(1),z:V.zs.filter(function(z){return z.alive}).map(function(z){return [z.id,z.type,+z.x.toFixed(2),+z.z.toFixed(2),+(z.ry||0).toFixed(2),+(z.hp/z.max).toFixed(2),z.atk>0?1:0]})})}}
    Object.keys(V.rp).forEach(function(id){var r=V.rp[id],k=Math.min(1,dt*12),ox=r.x,oz=r.z;r.x+=(r.tx-r.x)*k;r.y+=(r.ty-r.y)*k;r.z+=(r.tz-r.z)*k;r.m.position.set(r.x,r.y,r.z);r.m.rotation.y=r.yaw;r.m.visible=performance.now()-r.t<4000;
      var sp=Math.hypot(r.x-ox,r.z-oz)/Math.max(dt,1e-3);r.ph+=dt*Math.min(14,sp*1.2);var P2=r.m.userData.parts;if(P2&&P2.legs){var sw=sp>.5?Math.sin(r.ph)*.7:0;P2.legs[0].rotation.x=sw;P2.legs[1].rotation.x=-sw;if(P2.arms){P2.arms[0].rotation.x=-sw*.6;P2.arms[1].rotation.x=-1.2}}})}
  function killZ(C,z,mine,head){z.alive=false;z.die=.6;burst(C,new THREE.Vector3(z.x,1.2,z.z),0x7aa868);sfx.play('hit');
    if(mine){V.kills++;var mz=Math.max(1,V.combo||0)*(V.ground?1:2);V.score+=(head?150:100)*mz;if(V.combo)V.comboT=5;if(!V.ground)C.pop('EN L\'AIR x2','#f3c623','26px');hitMark(true);if(head)C.pop('TÊTE !','#e2361b','30px')}}
  /* ---------- tir ---------- */
  function muzzleWorld(C){var m=V.gun.userData.mz.clone().multiplyScalar(V.gun.scale.x).add(V.gun.position);return m.applyQuaternion(C.cam.quaternion).add(C.cam.position)}
  function boxNormal(p,b){var best=1e9,n=[0,1,0];[['x',1,0,0],['y',0,1,0],['z',0,0,1]].forEach(function(a){var d0=Math.abs(p[a[0]]-b[a[0]+'0']),d1=Math.abs(p[a[0]]-b[a[0]+'1']);if(d0<best){best=d0;n=[-a[1],-a[2],-a[3]]}if(d1<best){best=d1;n=[a[1],a[2],a[3]]}});return new THREE.Vector3(n[0],n[1],n[2])}
  function decal(C,p,b){if(!V.decM)V.decM=new THREE.MeshBasicMaterial({color:0x141210,transparent:true,opacity:.7,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    var n=boxNormal(p,b),m=new THREE.Mesh(V.decG||(V.decG=new THREE.CircleGeometry(.07,8)),V.decM);m.position.copy(p).addScaledVector(n,.01);m.lookAt(p.clone().add(n));C.scene.add(m);V.decals.push(m);if(V.decals.length>80)C.scene.remove(V.decals.shift())}
  function tracer(C,a,b,col){var geo=new THREE.BufferGeometry().setFromPoints([a,b]),l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:col||0xffe2a0,transparent:true,opacity:.85}));C.scene.add(l);V.fx.push({m:l,t:.06,v:new THREE.Vector3(),disp:true})}
  function hitMark(kill){var h=V.ui&&V.ui.querySelector('.vt-hit');if(!h)return;h.style.borderColor=kill?'#e2361b':'#fff';h.style.opacity=1;h.style.transform='scale('+(kill?1.4:1)+') rotate(45deg)';V.hitT=.18}
  function hurtZ(C,z,dmg,head,by){z.flinch=.15;if(!by)hitMark(false);if(V.mp&&!V.host){mpSend({t:'vt-h',id:z.id,d:Math.round(dmg),h:head?1:0});return}z.hp-=dmg;if(z.hp<=0&&z.alive){var mine=!by;killZ(C,z,mine,head);if(V.mp)mpSend({t:'vt-k',id:z.id,by:by||C.net.me.id,h:head?1:0})}}
  function hitTarget(C,t){t.alive=false;C.scene.remove(t.g);V.hits++;var mu=Math.max(1,V.combo||0)*(V.ground?1:2);V.score+=100*mu;if(V.combo)V.comboT=5;sfx.play('win');burst(C,t.g.position,0xe2361b);hitMark(true);C.pop(V.ground?'+'+100*mu:'EN L\'AIR +'+100*mu,'#f3c623','34px');if(V.tg.every(function(t){return !t.alive}))finish(C)}
  function fire(C){var W=WEAP[V.w];if(V.fireCd>0||V.reload>0||V.swap>0)return;if(V.ammo[V.w]<=0){reload();return}V.ammo[V.w]--;V.fireCd=W.cd;V.recoil=Math.min(1.2,V.recoil+W.kick);V.pitch=Math.min(1.5,V.pitch+W.climb*(.7+Math.random()*.6));V.yaw+=(Math.random()-.5)*W.climb*.6;
    sfx.play(WEAP[V.w].rk?'go':'shoot');var fl=V.gun.userData.flash;fl.visible=true;fl.rotation.z=Math.random()*3;fl.scale.setScalar((WEAP[V.w].pel>1)?1.6:WEAP[V.w].rk?2:1);V.flashT=.05;if(V.mLight){V.mLight.intensity=WEAP[V.w].rk?6:4}
    if(V.gun.userData.pump)V.pumpT=.45;if(V.gun.userData.slide)V.slideT=.08;
    var o=C.cam.position.clone(),mzw=muzzleWorld(C);
    if(WEAP[V.w].rk){var d0=new THREE.Vector3(0,0,-1).applyQuaternion(C.cam.quaternion),rk=new THREE.Group(),body=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.4,8),lam(0x4a5a3a));body.rotation.x=Math.PI/2;rk.add(body);var tip=new THREE.Mesh(new THREE.ConeGeometry(.06,.14,8),lam(0xe2361b));tip.rotation.x=-Math.PI/2;tip.position.z=-.27;rk.add(tip);var fire2=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:0xffb347}));fire2.position.z=.24;rk.add(fire2);
      rk.position.copy(mzw);rk.lookAt(mzw.clone().add(d0));C.scene.add(rk);V.rockets.push({m:rk,p:mzw.clone(),v:d0.multiplyScalar(48),t:0,o:o.clone(),dir:d0.clone().normalize()});return}
    var spread=W.sp*(V.ground?1:1.4)*(Math.hypot(V.vel.x,V.vel.z)>9?1.3:1);
    for(var p=0;p<W.pel;p++){var d=new THREE.Vector3((Math.random()-.5)*spread*2,(Math.random()-.5)*spread*2,-1).normalize().applyQuaternion(C.cam.quaternion);
      var wr=rayWorld(o,d,200),best=wr.t,what=null;
      (V.tg||[]).forEach(function(t){if(!t.alive)return;var oc=new THREE.Vector3(t.g.position.x-o.x,t.g.position.y-o.y,t.g.position.z-o.z),tc=oc.dot(d);if(tc<0||tc>best)return;var d2=oc.lengthSq()-tc*tc;if(d2<.85*.85){best=tc;what={t:t}}});
      (V.zs||[]).forEach(function(z){if(!z.alive)return;var zs0=z.sc||1;(z.type==='crawler'?[[.55,.28,2],[.35,.55,1]]:[[1.95,.26,2],[1.35,.42,1],[.6,.35,1]]).forEach(function(sp){var oc=new THREE.Vector3(z.x-o.x,z.y+sp[0]*zs0-o.y,z.z-o.z),tc=oc.dot(d);if(tc<0||tc>best)return;var d2=oc.lengthSq()-tc*tc;if(d2<sp[1]*sp[1]*zs0*zs0){best=tc;what={z:z,mul:sp[2]}}})});
      var hp=o.clone().addScaledVector(d,Math.min(best,200));spark(C,hp,what?(what.z?0x9a1a10:0xf3c623):0xcfc8bb);if(p<3||Math.random()<.3)tracer(C,mzw,hp);
      if(!what&&wr.b&&best<200)decal(C,hp,wr.b);
      if(what&&what.t)hitTarget(C,what.t);
      if(what&&what.z){var dmg=W.dmg*what.mul*((WEAP[V.w].pel>1)?Math.max(.4,1-best/30):1);hurtZ(C,what.z,dmg,what.mul>1)}}}
  function explode(C,pos){sfx.play('hit');C.shake(8);for(var i=0;i<3;i++)burst(C,pos,i?0xff8a3d:0xf3c623);
    var ball=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:.85,depthWrite:false}));ball.position.copy(pos);C.scene.add(ball);V.fx.push({m:ball,t:.35,v:new THREE.Vector3(),grow:14,disp:true});
    if(V.mLight){V.mLight.intensity=10}
    var RAD=5.5;(V.zs||[]).forEach(function(z){if(!z.alive)return;var d=Math.hypot(z.x-pos.x,z.y+1-pos.y,z.z-pos.z);if(d<RAD)hurtZ(C,z,RKT.dmg*(1-d/RAD*.6),false)});
    (V.tg||[]).forEach(function(t){if(t.alive&&t.g.position.distanceTo(pos)<RAD-1)hitTarget(C,t)});
    var me=new THREE.Vector3(V.pos.x,V.pos.y+.9,V.pos.z),dv=me.clone().sub(pos),dd=dv.length();
    if(dd<RAD){var f=(1-dd/RAD);dv.normalize();V.vel.addScaledVector(dv,26*f);V.vel.y=Math.max(V.vel.y,0)+16*f;V.ground=false;V.jumps=1;if(f>.25)trick(C,'ROCKET JUMP',120)}}
  function rocketStep(C,dt){V.rockets=V.rockets.filter(function(r){r.t+=dt;var np=r.p.clone().addScaledVector(r.v,dt),boom=null;
      var seg=np.clone().sub(r.p),len=seg.length(),dir=seg.clone().normalize(),wr=rayWorld(r.p,dir,len+.1);if(wr.b&&wr.t<=len+.1)boom=r.p.clone().addScaledVector(dir,Math.max(0,wr.t-.15));
      if(!boom&&np.y<=.1)boom=new THREE.Vector3(np.x,.15,np.z);
      if(!boom)(V.zs||[]).forEach(function(z){if(!boom&&z.alive&&Math.hypot(z.x-np.x,z.z-np.z)<.7&&np.y<z.y+2.1)boom=np.clone()});
      if(!boom)(V.tg||[]).forEach(function(t){if(!boom&&t.alive&&t.g.position.distanceTo(np)<1)boom=np.clone()});
      if(!boom&&r.t>4)boom=np.clone();
      if(boom){C.scene.remove(r.m);explode(C,boom);return false}
      r.p.copy(np);r.m.position.copy(np);if(Math.random()<.7){var sm=new THREE.Mesh(V.smG||(V.smG=new THREE.SphereGeometry(.14,6,4)),new THREE.MeshBasicMaterial({color:0xd8d2c8,transparent:true,opacity:.6,depthWrite:false}));sm.position.copy(np);C.scene.add(sm);V.fx.push({m:sm,t:.5,v:new THREE.Vector3(0,.6,0),grow:2,fade:true,disp:'mat'})}return true})}
  function reload(){var W=WEAP[V.w];if(V.reload>0||V.ammo[V.w]===W.mag)return;V.reload=W.rl;sfx.play('tick')}
  function spark(C,p,col){var m=new THREE.Mesh(new THREE.SphereGeometry(.08,6,4),new THREE.MeshBasicMaterial({color:col}));m.position.copy(p);C.scene.add(m);V.fx.push({m:m,t:.25,v:new THREE.Vector3(),disp:true})}
  function burst(C,p,col){for(var i=0;i<14;i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.14),new THREE.MeshBasicMaterial({color:i%2?col:0xf1ece2}));m.position.copy(p);C.scene.add(m);V.fx.push({m:m,t:.7,v:new THREE.Vector3((Math.random()-.5)*9,Math.random()*8,(Math.random()-.5)*9),disp:true})}}
  function mpEnd(C){var b=[{n:C.net.me.name||'Chef',s:V.score,k:V.kills}];Object.keys(V.rp).forEach(function(id){var r=V.rp[id];b.push({n:r.n,s:r.s||0,k:r.k||0})});b.sort(function(a,c){return c.k-a.k||c.s-a.s});V.board=b;mpSend({t:'vt-end',b:b})}
  function finish(C){if(V.over)return;V.over=true;C.stop();if(document.pointerLockElement)document.exitPointerLock();sfx.play('win');
    if(V.mode==='course'){var tc=Math.round(V.time*10)/10,nbc=C.best('course',tc,true);if(tc<90)C.win();C.over('Course terminée !','Les '+V.rings.length+' anneaux en <b>'+tc.toFixed(1)+' s</b>'+(nbc?'<br><b>Nouveau record !</b>':'<br>Record : '+C.best('course')+' s')+'<br>Astuce : grappin vers le haut, puis course sur les murs pour garder ta vitesse.','Rejouer')}
    else if(V.mode==='cibles'){var t=Math.round(V.time*10)/10,nb=C.best('temps',t,true);if(t<120)C.win();C.over('Toutes les cibles !','Temps : <b>'+t.toFixed(1)+' s</b>'+(nb?'<br><b>Nouveau record !</b>':'<br>Record : '+C.best('temps')+' s'),'Rejouer')}
    else if(V.mp&&V.board){var me=C.net.me.name;C.over('Fin de la partie','Vague <b>'+V.wave+'</b><br>'+V.board.map(function(r,i){return (i+1)+'. '+(r.n===me?'<b>'+PP.esc(r.n)+'</b>':PP.esc(r.n))+' · '+r.k+' zombies · '+r.s+' pts'}).join('<br>'),V.host?'Rejouer':'OK')}
    else{var nb2=C.best('pts',V.score);if(V.kills>=40)C.win();C.over('Fin de la partie','<b>'+V.score+'</b> points · '+V.kills+' zombies · vague '+V.wave+(nb2?'<br><b>Nouveau record !</b>':''),'Rejouer')}}
  /* ---------- interface (viseur, inventaire, mini-carte) ---------- */
  function ui(C){var st=C.cv.parentNode;if(!V.ui){var d=document.createElement('div');d.className='vt-ui';d.innerHTML='<div class="vt-cross"></div><canvas class="vt-map" width="160" height="160"></canvas><div class="vt-inv"></div><div class="vt-ammo"></div><div class="vt-speed"></div><div class="vt-hurt"></div><div class="vt-hit" style="position:absolute;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border:2px solid #fff;border-radius:2px;opacity:0;transform:rotate(45deg);box-shadow:0 0 0 1px rgba(0,0,0,.4)"></div><div class="vt-fast" style="position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,transparent 48%,rgba(255,255,255,.55) 135%)"></div><div class="vt-gr" style="position:absolute;left:50%;top:50%;width:36px;height:36px;margin:-18px 0 0 -18px;border:2px solid #f3c623;border-radius:50%;opacity:0;transition:opacity .1s"></div><div class="vt-combo" style="position:absolute;left:50%;top:14%;transform:translateX(-50%);text-align:center;color:#fff;font:400 34px Anton,Impact,sans-serif;text-shadow:0 2px 0 #141210;line-height:1;opacity:0"></div>';st.appendChild(d);V.ui=d}
    V.ui.hidden=false;inv()}
  function inv(){if(!V||!V.ui)return;V.ui.querySelector('.vt-inv').innerHTML=WEAP.map(function(w,i){return '<span class="'+(i===V.w?'on':'')+'"><b>'+(i+1)+'</b>'+w.n+'</span>'}).join('')+'<span class="'+(V.grap?'on':'')+'"><b>E</b>Grappin</span>'}
  function drawMap(){var c=V.ui.querySelector('.vt-map'),g=c.getContext('2d'),L=V.lim,s=160/(2*L),px=(V.pos.x+L)*s,pz=(V.pos.z+L)*s;g.save();g.clearRect(0,0,160,160);g.beginPath();g.arc(80,80,78,0,7);g.clip();g.fillStyle='#2b2a30';g.fillRect(0,0,160,160);
    /* carte qui tourne avec le joueur, centrée sur lui */g.translate(80,80);g.rotate(V.yaw);g.scale(2.2,2.2);g.translate(-px,-pz);g.drawImage(V.mapImg,0,0,160,160);
    (V.tg||[]).forEach(function(t){if(!t.alive)return;g.fillStyle='#f3c623';g.fillRect((t.g.position.x+L)*s-1.4,(t.g.position.z+L)*s-1.4,2.8,2.8)});(V.zs||[]).forEach(function(z){if(!z.alive)return;g.fillStyle='#ff3b2a';g.beginPath();g.arc((z.x+L)*s,(z.z+L)*s,1.5,0,7);g.fill()});
    Object.keys(V.rp||{}).forEach(function(id){var r=V.rp[id];if(!r.m.visible)return;g.fillStyle='#3fa9ff';g.beginPath();g.arc((r.x+L)*s,(r.z+L)*s,2.4,0,7);g.fill()});var rg=V.rings&&V.rings[V.ri];if(rg){g.fillStyle='#f3c623';g.beginPath();g.arc((rg.x+L)*s,(rg.z+L)*s,2.6,0,7);g.fill();g.strokeStyle='#141210';g.lineWidth=.6;g.stroke()}
    g.restore();g.fillStyle='#fff';g.beginPath();g.moveTo(80,72);g.lineTo(85,86);g.lineTo(80,83);g.lineTo(75,86);g.closePath();g.fill();g.strokeStyle='#f1ece2';g.lineWidth=3;g.beginPath();g.arc(80,80,78,0,7);g.stroke()}
  /* ---------- souris (vue) ---------- */
  document.addEventListener('mousemove',function(e){if(!V||!V.C||document.pointerLockElement!==V.C.cv||!V.C.running)return;var sens=.0022*(PP.store('vt-sens')||1);V.yaw-=e.movementX*sens;V.pitch=Math.max(-1.5,Math.min(1.5,V.pitch-e.movementY*sens))});
  document.addEventListener('wheel',function(e){if(!V||!V.C||!V.C.running||PP.cur()!=='volt')return;setWeapon(V.C,(V.w+(e.deltaY>0?1:WEAP.length-1))%WEAP.length)},{passive:true});
  document.addEventListener('contextmenu',function(e){if(V&&V.C&&e.target===V.C.cv)e.preventDefault()});

  PP._volt=function(){return V};PP._voltF=function(){return {hurtZ:hurtZ,fire:fire}};PP._voltB=function(){return BOX};
  PP.arcade({id:'volt',three:true,
    setup:function(C){ag.three(C);var sc=C.scene;while(sc.children.length)sc.remove(sc.children[0]);C.cam.fov=82;C.cam.near=.05;C.cam.far=800;C.cam.updateProjectionMatrix();sc.add(C.cam);
      var MP=C.mode==='online';V={C:C,mode:MP?'zombies':C.mode,mp:MP,host:!MP||!!C.net.isHost,rp:{},zmap:{},zid:1,dur:MP?240:180,pos:new THREE.Vector3(0,0,0),vel:new THREE.Vector3(),yaw:0,pitch:0,ground:false,jumps:0,wr:null,wrT:0,slide:0,grap:null,w:0,ammo:WEAP.map(function(w){return w.mag}),fireCd:0,reload:0,swap:0,recoil:0,roll:0,fovK:0,bob:0,land:0,fx:[],zs:[],tg:[],time:0,score:0,hits:0,kills:0,wave:0,spawnT:0,over:false,hurt:0,coyote:0,combo:0,comboT:0,air:0,rings:null,ri:0,rockets:[],decals:[],up:new THREE.Vector3(0,1,0),ui:V&&V.ui};
      if(MP)C.listen(function(m){onNet(C,m)});
      buildCity(C);var sp=[0,0],rs=V.mode==='course'?rng(99):Math.random;for(var k=0;k<200;k++){var x=(rs()*2-1)*20,z=(rs()*2-1)*20;if(!hit(x-.5,0,z-.5,x+.5,2,z+.5)){sp=[x,z];break}}if(MP){var sl=Math.max(0,(C.net.players||[]).map(function(q){return q.id}).indexOf(C.net.me.id));sp=[sp[0]+(sl%3)*2.2,sp[1]+Math.floor(sl/3)*2.2];if(hit(sp[0]-.5,0,sp[1]-.5,sp[0]+.5,2,sp[1]+.5))sp=[0,0]}V.pos.set(sp[0],0,sp[1]);
      RND=rng(Date.now()%100000);if(V.mode==='cibles')spawnTargets(C);if(V.mode==='course')spawnRings(C);setWeapon(C,0);ui(C);V.ui.hidden=true;
      V.mLight=new THREE.PointLight(0xffc070,0,12,2);V.mLight.position.set(.2,-.1,-.9);C.cam.add(V.mLight);
      V.rope=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,1,6),new THREE.MeshBasicMaterial({color:0xf1ece2}));V.rope.frustumCulled=false;V.rope.visible=false;sc.add(V.rope);
      V.hook=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),new THREE.MeshBasicMaterial({color:0xf3c623}));V.hook.visible=false;sc.add(V.hook);
      C.keysText('<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> bouger · <kbd>Maj</kbd> sprint · <kbd>Espace</kbd> saut et double saut · saute contre un mur rouge (ou un bâtiment) en avançant pour courir dessus, re-saute pour rebondir · <kbd>C</kbd> glissade · <kbd>E</kbd> ou clic droit maintenu : grappin · longe un mur, même en marchant, pour courir dessus · tremplins jaunes · clic : tirer · <kbd>R</kbd> recharger · <kbd>1</kbd> à <kbd>6</kbd> ou molette : armes de Zone Morte (6 = lance-roquettes : tire à tes pieds en sautant pour un rocket jump) · <kbd>K</kbd> <kbd>L</kbd> : souris moins ou plus rapide');
      C.over('Voltige',(V.mode==='course'?'Traverse les 18 anneaux dans l\'ordre le plus vite possible. Le prochain anneau a un rayon de lumière jaune et un point sur la mini-carte.':V.mode==='cibles'?'Explose les 24 cibles cachées dans la ville le plus vite possible.':(MP?(V.host?'Zombies à plusieurs : vous êtes '+(C.net.players||[]).length+' dans la ville. Quand tu lances, tout le salon démarre. 4 minutes, le plus de zombies possible !':'Zombies à plusieurs : le chef du salon lance la partie, tu démarres tout seul avec lui. Tu peux aussi cliquer Jouer pour te balader en attendant.'):'Des zombies arrivent par vagues pendant 3 minutes : fais le plus de points.'))+'<br>Longe un mur pour courir dessus, lance ton grappin (<b>E</b> ou clic droit maintenu) sur les bâtiments, prends les tremplins jaunes. Enchaîne les figures pour faire monter le combo.','Jouer');
      C.cam.position.set(V.pos.x,1.6,V.pos.z);C.R.render(sc,C.cam)},
    start:function(C){if(V.time>0||V.over){this.setup(C)}ui(C);V.ui.hidden=false;V.C=C;if(V.mp&&V.host)mpSend({t:'vt-go'})},
    close:function(C){if(V&&V.ui)V.ui.hidden=true;if(V&&V.mp)mpSend({t:'vt-bye'})},
    mouse:function(C,t,x,y,e){if(!C.running||!e)return;if(t==='down'){if(e.button===2){V.grapKey=true}else{V.trig=true;fire(C)}}if(t==='up'){if(e.button===2)V.grapKey=false;else V.trig=false}},
    key:function(C,k,d){if(!C.running)return;if(d){if(k==='Space')V.jumpQ=.15;if(k==='KeyC'||k==='ControlLeft')V.slideQ=.15;if(k==='KeyR')reload();if(k==='KeyK'||k==='KeyL'){var se=Math.round(Math.max(.3,Math.min(3,(PP.store('vt-sens')||1)+(k==='KeyL'?.1:-.1)))*10)/10;PP.store('vt-sens',se);C.pop('Souris x'+se.toFixed(1),'#f1ece2','24px')}var dn=/^(?:Digit|Numpad)([1-9])$/.exec(k);if(dn&&+dn[1]<=WEAP.length&&+dn[1]-1!==V.w)setWeapon(C,+dn[1]-1)}},
    step:function(C,dt){if(V.over)return;var k=C.keys,p=V.pos,v=V.vel;if(!V.mp||V.host)V.time+=dt;
      var fw=((k.KeyW||k.KeyZ||k.ArrowUp)?1:0)-((k.KeyS||k.ArrowDown)?1:0),st=((k.KeyD||k.ArrowRight)?1:0)-((k.KeyA||k.KeyQ||k.ArrowLeft)?1:0);
      var sy=Math.sin(V.yaw),cy=Math.cos(V.yaw),dx=-sy*fw+cy*st,dz=-cy*fw-sy*st,dl=Math.hypot(dx,dz);if(dl>0){dx/=dl;dz/=dl}
      var sprint=(k.ShiftLeft||k.ShiftRight)&&fw>0,max=sprint?SPR:WALK;
      V.jumpQ=Math.max(0,(V.jumpQ||0)-dt);V.slideQ=Math.max(0,(V.slideQ||0)-dt);V.coyote=V.ground?.12:Math.max(0,V.coyote-dt);
      /* glissade */
      if(V.slideQ>0&&V.ground&&V.slide<=0&&Math.hypot(v.x,v.z)>6){V.slide=.85;V.slideQ=0;var hs=Math.hypot(v.x,v.z);v.x*=(hs+4)/hs;v.z*=(hs+4)/hs;sfx.play('ui');trick(C,'GLISSADE',30)}
      if(V.slide>0){V.slide-=dt;if(V.slide<=0&&hit(p.x-R,p.y,p.z-R,p.x+R,p.y+1.8,p.z+R))V.slide=.05}
      /* grappin */
      /* v51 : clic droit = vraie corde (on se balance comme un pendule, la corde se raccourcit toute seule), E = traction directe */
      /* v52 : retour au grappin d'avant (demande d'Anis) : E ou clic droit, ça tire droit vers le point visé */
      if((k.KeyE||V.grapKey)&&!V.grap&&!V.grapFail){var ap=anchor(C,false);
        if(ap){V.grap=ap;V.gMode='z';V.ropeL=Math.max(4,ap.distanceTo(new THREE.Vector3(p.x,p.y+1.2,p.z))*.94);V.ropeMin=Math.max(3.5,V.ropeL*.6);if(V.ground||V.gMode==='z')v.y=Math.max(v.y,5);V.ground=false;sfx.play('shoot');inv()}
        else{V.grapFail=true;C.pop('trop loin','#f1ece2','22px')}}
      if(V.grap&&!(V.grapKey||k.KeyE))release(C);
      if(!k.KeyE&&!V.grapKey)V.grapFail=false;
      if(V.grap&&V.gMode==='z'){var to=V.grap.clone().sub(new THREE.Vector3(p.x,p.y+1.2,p.z)),dd=to.length();if(dd<1.8){V.grap=null;V.jumps=Math.min(V.jumps,1);trick(C,'GRAPPIN',40);inv()}else{to.normalize();v.addScaledVector(to,62*dt);v.x+=dx*10*dt;v.z+=dz*10*dt;var sp2=v.length();if(sp2>26)v.multiplyScalar(26/sp2);V.ground=false}}
      var swing=V.grap&&V.gMode==='s'&&!V.ground;
      if(swing){if(p.y+1.2<V.grap.y)V.ropeL=Math.max(V.ropeMin,V.ropeL-4*dt);v.x+=dx*15*dt;v.z+=dz*15*dt}
      /* course sur les murs */
      var wn=!V.ground?wallNear():null,hsp=Math.hypot(v.x,v.z);
      if(V.ground)V.lastWall=null;
      /* v52 : les murs accrochent bien plus facilement : même en marchant, de plus loin, plus longtemps, et on peut reprendre le même mur */
      V.wallCd=Math.max(0,(V.wallCd||0)-dt);
      if(wn&&!V.grap&&dl>0&&hsp>2.2&&(V.wr?V.wrT<3:(wn.b!==V.lastWall||V.wallCd<=0))){if(!V.wr){V.wr=wn;V.wrT=0;V.jumps=1;v.y=Math.min(Math.max(v.y,1.5),3.2);sfx.play('tick');trick(C,'MUR',50)}V.wr=wn;V.wrT+=dt;
        var tx=-wn.nz,tz=wn.nx;if(tx*v.x+tz*v.z<0){tx=-tx;tz=-tz}var along=Math.max(hsp,9);v.x=tx*along-wn.nx*2.5;v.z=tz*along-wn.nz*2.5;v.y-=3.2*dt;if(v.y<-1)v.y=-1;
        var rs=(-sy*wn.nz+cy*wn.nx);V.roll+=((wn.nx*cy-wn.nz*sy>0?-.16:.16)-V.roll)*Math.min(1,dt*8)}
      else{if(V.wr){V.lastWall=V.wr.b;V.wr=null;V.wallCd=.5}var rt=-st*.025;if(V.grap&&V.gMode==='s')rt=Math.max(-.2,Math.min(.2,-(v.x*cy-v.z*sy)*.011));V.roll+=(rt-V.roll)*Math.min(1,dt*6);if(V.ground)V.wrT=0}
      /* saut, double saut, saut de mur */
      if(V.jumpQ>0&&V.grap&&V.gMode==='s'){release(C);v.y+=4.5;V.jumpQ=0;V.grapFail=true;sfx.play('ui')}
      if(V.jumpQ>0){if(V.wr){var w2=V.wr;v.x+=w2.nx*9;v.z+=w2.nz*9;v.y=JV;V.lastWall=w2.b;V.wallCd=.35;V.wr=null;V.jumpQ=0;V.jumps=1;sfx.play('ui');trick(C,'SAUT DE MUR',80)}
        else if(V.ground||V.coyote>0){v.y=JV;V.ground=false;V.coyote=0;V.jumpQ=0;V.jumps=1;if(V.slide>0){V.slide=0;v.x*=1.08;v.z*=1.08}sfx.play('ui')}
        else if(V.jumps<2){v.y=JV*.92;V.jumps=2;V.jumpQ=0;if(dl>0){var hs2=Math.max(Math.hypot(v.x,v.z),WALK);v.x=dx*hs2;v.z=dz*hs2}sfx.play('ui');for(var i=0;i<6;i++)spark(C,new THREE.Vector3(p.x+(Math.random()-.5),p.y,p.z+(Math.random()-.5)),0xf1ece2)}}
      /* accélération (sol / air) */
      if(!V.wr&&!swing&&!(V.grap&&V.gMode==='z')){var acc=V.ground?(V.slide>0?2:ACC):AIR,cur=v.x*dx+v.z*dz,add=Math.max(0,Math.min(acc*dt,max-cur));if(dl>0){v.x+=dx*add;v.z+=dz*add}
        if(V.ground&&V.slide<=0){var s3=Math.hypot(v.x,v.z),drop=s3*FRIC*dt*(dl>0?.35:1);if(s3>0){var ns=Math.max(0,s3-drop)/s3;v.x*=ns;v.z*=ns}}else if(V.ground&&V.slide>0){v.x*=Math.pow(.55,dt);v.z*=Math.pow(.55,dt)}}
      if(!V.wr)v.y-=G*(V.grap&&V.gMode==='z'?.2:1)*dt;
      /* escalade automatique d'un rebord */
      var wasGround=V.ground;V.wasG=wasGround;V.ground=false;var bxh=moveAxis('x',v.x*dt),bzh=moveAxis('z',v.z*dt),hb=bxh||bzh;
      /* on tape une façade au bout de la corde : la corde lâche et on rebondit vers le haut au lieu de rester collé */
      /* v52 : en marchant le long d'un mur haut, un petit saut automatique lance la course sur le mur */
      if(hb&&wasGround&&dl>0&&!V.grap&&V.slide<=0&&hb.y1-p.y>2.2&&Math.hypot(v.x,v.z)>2.5&&(V.hopCd||0)<=0){v.y=5.2;V.hopCd=.8}
      V.hopCd=Math.max(0,(V.hopCd||0)-dt);
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
      var gb=V.ground?Math.sin(V.bob)*.012:0;V.gun.position.set(.13+gb,-.105-Math.abs(gb)-(V.reload>0?.15:0)-V.swap*.4,-.33+V.recoil*.07);V.gun.rotation.set(V.recoil*.25+(V.reload>0?.6:0),0,V.slide>0?.3:0);var ud=V.gun.userData;if(ud.pump){V.pumpT=Math.max(0,(V.pumpT||0)-dt);ud.pump.position.z=ud.pump0+Math.sin(Math.min(1,(.45-V.pumpT)/.45)*Math.PI)*(V.pumpT>0?.09:0)}if(ud.slide){V.slideT=Math.max(0,(V.slideT||0)-dt);ud.slide.position.z=ud.slide0+(V.slideT>0?.05:0)}
      /* corde du grappin */
      if(V.grap){V.rope.visible=V.hook.visible=true;var gp=new THREE.Vector3(.22,-.15,-.8).applyQuaternion(C.cam.quaternion).add(C.cam.position),rd2=V.grap.clone().sub(gp),rl=rd2.length();V.rope.position.copy(gp).addScaledVector(rd2,.5);V.rope.scale.set(1,rl,1);V.rope.quaternion.setFromUnitVectors(V.up,rd2.normalize());V.hook.position.copy(V.grap)}else V.rope.visible=V.hook.visible=false;
      /* cibles qui bougent */
      (V.tg||[]).forEach(function(t){if(!t.alive)return;t.ph+=dt;if(t.mv)t.g.position.y=t.y+Math.sin(t.ph*1.2)*t.mv*.4;t.g.lookAt(C.cam.position)});
      /* zombies */
      if(V.mode==='zombies'&&(!V.mp||V.host)){V.spawnT-=dt;var alive=V.zs.filter(function(z){return z.alive}).length;if(alive===0&&V.spawnT<=0&&!(V.toSpawn>0)){V.wave++;V.spawnT=2;V.toSpawn=4+V.wave*3;C.pop('VAGUE '+V.wave,'#e2361b','56px')}
        if(V.toSpawn>0&&V.spawnT<=0&&alive<(V.mp?26:20)){V.spawnT=.35;V.toSpawn--;spawnZombie(C)}
        if(V.time>=V.dur){if(V.mp)mpEnd(C);finish(C)}}
      var PLS=V.mp?mpPlayers():null;
      V.zs.forEach(function(z){if(z.die>0){z.die-=dt;z.m.rotation.x=-(1-z.die/.6)*1.5;z.m.position.y=-(1-z.die/.6)*.4;if(z.die<=0){C.scene.remove(z.m)}return}if(!z.alive)return;
        var ox=z.x,oz=z.z,tx,tz,d;
        if(!V.mp||V.host){var tg=[p.x,p.z];if(PLS){var bd=1e9;PLS.forEach(function(q){var dq=Math.hypot(q[0]-z.x,q[1]-z.z);if(dq<bd){bd=dq;tg=q}})}
          tx=tg[0]-z.x;tz=tg[1]-z.z;d=Math.hypot(tx,tz);if(d>.8){var sp3=z.sp*dt;var nx=z.x+tx/d*sp3,nz=z.z+tz/d*sp3;if(!hit(nx-.35,.1,z.z-.35,nx+.35,1.8,z.z+.35))z.x=nx;if(!hit(z.x-.35,.1,nz-.35,z.x+.35,1.8,nz+.35))z.z=nz}z.ry=Math.atan2(-tx,-tz);
          if(d<1.1&&tg[2]&&tg[2]!=='me'&&(z.atkCd=(z.atkCd||0)-dt)<=0){z.atkCd=1.2;z.atk=.45}}
        else{var kk=Math.min(1,dt*10);z.x+=(z.tx-z.x)*kk;z.z+=(z.tz-z.z)*kk}
        tx=p.x-z.x;tz=p.z-z.z;d=Math.hypot(tx,tz);
        z.m.position.set(z.x,0,z.z);z.m.rotation.y=z.ry||0;K.anim(z,dt,Math.hypot(z.x-ox,z.z-oz)>dt*.4);
        var far=d>24;if(z.lod!==far){z.lod=far;(z.m.userData.det||[]).forEach(function(o){o.visible=!far})}
        z.hitCd=Math.max(0,z.hitCd-dt);if(d<1&&Math.abs(p.y-z.y)<1.5&&z.hitCd<=0){z.hitCd=1.2;z.atk=.45;V.score=Math.max(0,V.score-50);V.hurt=.4;v.x+=tx/d*10;v.z+=tz/d*10;v.y=5;V.ground=false;sfx.play('lose');C.shake(6)}});
      V.zs=V.zs.filter(function(z){return z.alive||z.die>0});if(V.mp)mpStep(C,dt);
      rocketStep(C,dt);if(V.sun){V.sun.position.set(p.x+40,p.y+90,p.z+30);V.sun.target.position.set(p.x,p.y,p.z)}
      if(V.mLight)V.mLight.intensity=Math.max(0,V.mLight.intensity-dt*60);V.hitT=Math.max(0,(V.hitT||0)-dt);if(V.ui){var hm=V.ui.querySelector('.vt-hit');if(hm)hm.style.opacity=Math.min(1,V.hitT*6)}
      V.fx.forEach(function(f){f.t-=dt;if(f.grow){f.m.scale.addScalar(f.grow*dt);f.m.material.opacity=Math.max(0,f.m.material.opacity-dt*2.4)}else f.v.y-=20*dt;f.m.position.addScaledVector(f.v,dt);if(f.t<=0){C.scene.remove(f.m);if(f.disp){if(f.disp===true&&f.m.geometry)f.m.geometry.dispose();if(f.m.material)f.m.material.dispose()}}});V.fx=V.fx.filter(function(f){return f.t>0});
      V.hurt=Math.max(0,V.hurt-dt);
      /* interface */
      if(V.ui){drawMap();var W=WEAP[V.w];V.ui.querySelector('.vt-ammo').innerHTML=V.reload>0?'<b>RECHARGE…</b>':'<b>'+V.ammo[V.w]+'</b> / '+W.mag;var s3d=v.length();V.ui.querySelector('.vt-speed').textContent=Math.round(s3d*3.6)+' km/h'+(V.wr?' · MUR':V.slide>0?' · GLISSE':V.grap?' · GRAPPIN':'');V.ui.querySelector('.vt-hurt').style.opacity=V.hurt*2;
        V.ui.querySelector('.vt-fast').style.opacity=Math.max(0,Math.min(.8,(s3d-16)/22));
        V.gT=(V.gT||0)-dt;if(V.gT<=0){V.gT=.1;V.ui.querySelector('.vt-gr').style.opacity=!V.grap&&anchor(C,false)?.9:0}
        var cb=V.ui.querySelector('.vt-combo');if(V.combo>0){cb.style.opacity=Math.min(1,V.comboT);cb.innerHTML='x'+V.combo+'<div style="font:700 12px \'IBM Plex Mono\',monospace;margin-top:4px">'+V.trickN+'</div>'}else cb.style.opacity=0}
      C.hud('<span>'+(V.mode==='course'?'Anneaux <b>'+V.ri+' / '+V.rings.length+'</b>':V.mode==='cibles'?'Cibles <b>'+V.hits+' / '+V.tg.length+'</b>':'Vague <b>'+V.wave+'</b>')+'</span><span>'+(V.mode!=='zombies'?'Temps <b>'+V.time.toFixed(1)+' s</b>':'Reste <b>'+Math.max(0,Math.ceil(V.dur-V.time))+' s</b>')+'</span><span>Points <b>'+V.score+'</b></span>'+(V.mode==='zombies'?'<span>Zombies <b>'+V.kills+'</b></span>':'')+(V.mp?'<span>Équipe <b>'+(1+Object.keys(V.rp).filter(function(id){return V.rp[id].m.visible}).length)+'</b></span>':''))},
    draw:function(C){C.R.render(C.scene,C.cam)}});
})();
