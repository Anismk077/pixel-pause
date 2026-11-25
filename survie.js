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
  function mainH(x,z){
    var d=Math.hypot(x,z)/HALF,fall=Math.max(0,1-Math.pow(d,2.4));
    var h=(fbm(x/95,z/95,SEED)-.42)*36+(fbm(x/24,z/24,SEED+5)-.5)*5;
    var m=fbm(x/170,z/170,SEED+9);if(m>.58)h+=(m-.58)*140;
    return h*fall-(1-fall)*14+2;
  }
  /* ---------- Archipel : 7 îles autour de l'île principale ---------- */
  var ISL=[],WORLDH=1400,terrains=[],boats=[],hdoors=[],tracers=[],gunL=null,gunKick=0;
  var BIOMES=[['jungle','Île des Palmes'],['desert','Île du Désert'],['neige','Île Gelée'],['foret','Île des Bois'],['jungle','Île aux Perroquets'],['desert','Île du Soleil'],['neige','Île du Nord']];
  function makeIslands(){
    var R=rng(SEED+31337);ISL=[];
    for(var k=0;k<7;k++){var a=k/7*Math.PI*2+R()*.45,d=720+R()*380,r=150+R()*110;ISL.push({x:Math.cos(a)*d,z:Math.sin(a)*d,r:r,b:BIOMES[k][0],n:BIOMES[k][1],s:100+k*17})}
    WORLDH=1450;
  }
  function islandH(I,x,z){
    var dx=x-I.x,dz=z-I.z,d=Math.sqrt(dx*dx+dz*dz)/I.r,fall=Math.max(0,1-Math.pow(d,2.2));
    var h=(fbm(x/70,z/70,SEED+I.s)-.38)*24+(fbm(x/18,z/18,SEED+I.s+3)-.5)*4;
    if(I.b==='neige'){var m=fbm(x/90,z/90,SEED+I.s+9);if(m>.5)h+=(m-.5)*90}
    if(I.b==='desert')h=h*.55+2+Math.sin(x*.05+fbm(x/40,z/40,SEED+I.s)*6)*1.2;
    if(I.b==='jungle')h=h*.8+1;
    return h*fall-(1-fall)*14+2;
  }
  function height(x,z){
    var h=mainH(x,z);
    if(x*x+z*z>HALF*HALF*.6)for(var i=0;i<ISL.length;i++){var I=ISL[i],dx=x-I.x,dz=z-I.z;if(dx*dx+dz*dz<I.r*I.r*1.25){var hi=islandH(I,x,z);if(hi>h)h=hi}}
    return h;
  }
  function islandAt(x,z){for(var i=0;i<ISL.length;i++){var I=ISL[i];if(Math.hypot(x-I.x,z-I.z)<I.r*1.12)return I}return null}
  function biomeAt(x,z){var I=islandAt(x,z);return I?I.b:'main'}
  function islandTerrain(I,dt){
    var S2=I.r*2.3,seg=Math.round(S2/3.2),g=new THREE.PlaneGeometry(S2,S2,seg,seg);g.rotateX(-Math.PI/2);g.translate(I.x,0,I.z);
    var pos=g.attributes.position,col=new Float32Array(pos.count*3),c=new THREE.Color(),P2={jungle:[0x3f8a2a,0x5aa83a,0xe8d8a0,0x6b5a3c],desert:[0xdcc488,0xc9a86a,0xe6d4a0,0xb07a4a],neige:[0xeef2f6,0xd8e0e8,0xb8b0a0,0x8a8a90],foret:[0x4f7d2c,0x6e8f37,0xd8c99a,0x77736b]}[I.b],A=new THREE.Color(P2[0]),B=new THREE.Color(P2[1]),beach=new THREE.Color(P2[2]),rk=new THREE.Color(P2[3]),wetC=new THREE.Color(P2[2]).multiplyScalar(.8),seaC=new THREE.Color(0x8f8a6a);
    for(var i=0;i<pos.count;i++){var x=pos.getX(i),z=pos.getZ(i),h=height(x,z);pos.setY(i,h);var n=fbm(x/28,z/28,SEED+I.s+40),sl=slope(x,z);
      if(h<1.6){c.copy(beach);if(h<.15)c.lerp(wetC,Math.min(1,(.15-h)*2.5));if(h<-.6)c.lerp(seaC,Math.min(1,(-.6-h)/3))}else{c.copy(A).lerp(B,n);if(h<2.6)c.lerp(beach,(2.6-h));if(sl>.85)c.lerp(rk,Math.min(1,(sl-.85)*1.6));if(I.b!=='neige'&&h>20)c.lerp(rk,Math.min(1,(h-20)/8));if(I.b==='neige'&&sl>1.2)c.lerp(rk,.6)}
      col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    var m=new THREE.Mesh(g,lam({vertexColors:true,map:dt}));m.receiveShadow=true;scene.add(m);terrains.push(m);
  }
  function islandTrees(R,tl,rl,ol){
    ISL.forEach(function(I){
      var n=Math.round(I.r*I.r/55);
      for(var t=0;t<n;t++){var a=R()*6.283,rr=Math.sqrt(R())*I.r*.95,x=I.x+Math.cos(a)*rr,z=I.z+Math.sin(a)*rr,h=height(x,z);if(h<1.3||h>(I.b==='neige'?32:24)||slope(x,z)>1.1)continue;
        var k;if(I.b==='jungle')k=R()<.7?3:1;else if(I.b==='desert'){if(R()<.55)continue;k=h<4&&R()<.5?3:4}else if(I.b==='neige')k=5;else k=R()<.45?0:R()<.7?1:2;
        tl.push({x:x,z:z,y:h,s:.75+R()*.7,k:k,r:R()*6,c:R()})}
      for(var r2=0;r2<I.r/3;r2++){var a2=R()*6.283,rr2=Math.sqrt(R())*I.r*.9,x2=I.x+Math.cos(a2)*rr2,z2=I.z+Math.sin(a2)*rr2,h2=height(x2,z2);if(h2<.5)continue;rl.push({x:x2,z:z2,y:h2,s:.6+R()*1.4,r:R()*6})}
      for(var o=0;o<(I.b==='neige'?60:12);o++){var a3=R()*6.283,rr3=Math.sqrt(R())*I.r*.85,x3=I.x+Math.cos(a3)*rr3,z3=I.z+Math.sin(a3)*rr3,h3=height(x3,z3);if(h3<(I.b==='neige'?12:6))continue;ol.push({x:x3,z:z3,y:h3,s:.8+R()*.6,r:R()*6})}
    });
  }
  function islandExtras(){
    var R=rng(SEED+999999);
    ISL.forEach(function(I,ii){
      // coffres (2 dorés par île) et ruines
      for(var c=0;c<7;c++){var x,z,h,t=0;do{var a=R()*6.283,rr=Math.sqrt(R())*I.r*.8;x=I.x+Math.cos(a)*rr;z=I.z+Math.sin(a)*rr;h=height(x,z);t++}while((h<1.2||h>26||slope(x,z)>.9)&&t<40);if(t>=40)continue;
        var ch=addChest(x,h,z,c<2,R()*6);if(c<2)for(var k=0;k<3;k++){var aa=k*2+ii,wx=x+Math.cos(aa)*3.2,wz=z+Math.sin(aa)*3.2,hg=1.4+R()*2,w=new THREE.Mesh(new THREE.BoxGeometry(3.8,hg,.6),tmat(stoneTex(),2,1,0xa09a90));w.position.set(wx,height(wx,wz)+hg/2-.2,wz);w.rotation.y=-aa+Math.PI/2;w.castShadow=w.receiveShadow=true;scene.add(w);addCol({x:wx,z:wz,r:1.2,type:'ruin'})}}
      // un petit village
      var hn=0;for(var k2=0;k2<120&&hn<(I.b==='neige'?1:2);k2++){var a4=R()*6.283,rr4=Math.sqrt(R())*I.r*.6,x4=I.x+Math.cos(a4)*rr4,z4=I.z+Math.sin(a4)*rr4,h4=height(x4,z4);if(h4<2||h4>14||slope(x4,z4)>.45||!flatOK(x4,z4))continue;house(x4,z4,R);hn++}
      // barques au bord
      for(var b=0;b<2;b++){var sp=shorePoint(I.x,I.z,R()*6.283,I.r*1.3);if(sp)addBoat(sp.x,sp.z,sp.a,false)}
    });
    for(var m=0;m<6;m++){var sp2=shorePoint(0,0,m/6*Math.PI*2+.4,HALF*1.1);if(sp2)addBoat(sp2.x,sp2.z,sp2.a,false)}
  }
  function shorePoint(cx,cz,a,maxR){for(var r=0;r<maxR;r+=2){var x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(height(x,z)<-.8){x+=Math.cos(a)*2;z+=Math.sin(a)*2;return {x:x,z:z,a:Math.atan2(-Math.cos(a),-Math.sin(a))}}}return null}
  /* ---------- Barques ---------- */
  function boatMesh(){
    var g=new THREE.Group(),wood=lam({map:plankTex(false)}),dark=lam({color:0x5a3d22}),paint=lam({color:[0xe2361b,0x2f6fb5,0xf1ece2,0x3f8f3a][Math.random()*4|0]});
    function bx(w,h,d,x,y,z,m,ry,rz){var q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(x,y,z);if(ry)q.rotation.y=ry;if(rz)q.rotation.z=rz;q.castShadow=true;q.receiveShadow=true;g.add(q);return q}
    bx(1.2,.14,3.2,0,.05,0,wood);[-1,1].forEach(function(s){bx(.1,.55,3,s*.62,.3,.1,wood,0,s*.18);bx(.12,.1,3.05,s*.66,.6,.1,paint,0,s*.18)});
    bx(1.3,.55,.1,0,.3,1.6,wood);[-1,1].forEach(function(s){bx(.1,.55,1.05,s*.32,.3,-1.85,wood,-s*.55)});bx(.14,.6,.14,0,.35,-2.25,dark);
    bx(1.15,.08,.3,0,.42,-.6,dark);bx(1.15,.08,.3,0,.42,.7,dark);
    [-1,1].forEach(function(s){var oar=new THREE.Group();oar.position.set(s*.66,.6,0);g.add(oar);var sh=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.2,6),dark);sh.rotation.z=s*1.25;sh.position.set(s*.9,-.3,0);oar.add(sh);var bl=new THREE.Mesh(new THREE.BoxGeometry(.05,.4,.18),wood);bl.position.set(s*1.85,-.75,0);bl.rotation.z=s*1.25;oar.add(bl);g.userData['oar'+(s>0?'R':'L')]=oar});
    return g;
  }
  function addBoat(x,z,yaw,built){var m=boatMesh();m.position.set(x,-.3,z);m.rotation.y=yaw;scene.add(m);var b={x:x,z:z,yaw:yaw,v:0,m:m,built:built,ph:Math.random()*6};boats.push(b);return b}
  function stepBoats(dt,now){
    boats.forEach(function(b){var on=P.boat===b;b.m.position.set(b.x,-.32+Math.sin(now*1.6+b.ph)*.05,b.z);b.m.rotation.set(Math.sin(now*1.1+b.ph)*.03,b.yaw,Math.sin(now*1.3+b.ph)*.04+(on?(keys.L?.06:keys.R?-.06:0):0));
      var ro=on&&Math.abs(b.v)>.5?Math.sin(now*5)*.5:0;if(b.m.userData.oarL){b.m.userData.oarL.rotation.x=ro;b.m.userData.oarR.rotation.x=ro}});
  }
  function boatStep(dt){
    var b=P.boat,fw=(keys.F?1:0)-(keys.B?1:0),tr=(keys.L?1:0)-(keys.R?1:0);
    b.yaw+=tr*dt*(.5+Math.min(1,Math.abs(b.v)/6))*1.2;b.v+=(fw*(keys.SH?17:11)-b.v)*Math.min(1,dt*1.1);
    var nx=b.x-Math.sin(b.yaw)*b.v*dt,nz=b.z-Math.cos(b.yaw)*b.v*dt;
    if(height(nx,nz)<-.6&&Math.abs(nx)<WORLDH&&Math.abs(nz)<WORLDH){b.x=nx;b.z=nz}else{b.v*=-.25;if(Math.abs(b.v)>2)sfx.play('hit')}
    P.x=b.x;P.z=b.z;P.y=-1.0;P.vy=0;if(Math.abs(b.v)>1)P.bob+=dt*3;
  }
  function boardBoat(b){P.boat=b;b.v=0;P.swim=false;msg('Z / S : ramer · Q / D : tourner · Maj : plus vite · E : descendre');sfx.play('ui')}
  function leaveBoat(){
    var b=P.boat;for(var r=2;r<=10;r+=1)for(var a=0;a<16;a++){var an=a/16*Math.PI*2,x=b.x+Math.cos(an)*r,z=b.z+Math.sin(an)*r;if(height(x,z)>.4&&!hitsCol(x,z,.5,'p')){P.boat=null;b.v=0;P.x=x;P.z=z;P.y=height(x,z);sfx.play('ui');return}}
    P.boat=null;b.v=0;P.x=b.x+2;P.z=b.z;msg('Tu sautes à l\'eau');
  }
  /* ---------- Portes des maisons ---------- */
  function toggleHDoor(h,silent){h.openD=!h.openD;h.tr=h.openD?h.open:0;if(h.openD)unGrid(h);else gridAdd(h);sfx.play('ui');if(!silent)relayEv({e:'hdoor',i:h.id,o:h.openD?1:0})}
  /* ---------- Tirs : traçantes ---------- */
  function tracer(a,b){var g=new THREE.BufferGeometry().setFromPoints([a,b]);var l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffe8a0,transparent:true,opacity:.9}));scene.add(l);tracers.push({l:l,t:.08})}
  function slope(x,z){return Math.hypot(height(x+1,z)-height(x-1,z),height(x,z+1)-height(x,z-1))/2}
  function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}

  /* ---------- Données ---------- */
  var TOOLS={
    axe   :{n:'Hache',dmg:30,range:2.8,rate:.55,melee:1},
    pick  :{n:'Pioche',dmg:22,range:2.8,rate:.6,melee:1},
    sword :{n:'Épée en fer',dmg:72,range:3,rate:.5,melee:1},
    bow   :{n:'Arc',dmg:48,rate:.8,ammo:'fleches'},
    pistol:{n:'Pistolet',dmg:48,rate:.28,ammo:'munitions'},
    rifle :{n:'Fusil',dmg:34,rate:.11,ammo:'munitions',auto:true},
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
    box  :{n:'Coffre de base',cost:{bois:5},hp:120,d:'stocke tes ressources'},
    boat :{n:'Barque',cost:{bois:16,tissu:2},hp:100,d:'à poser sur l\'eau, pour aller sur les autres îles'}
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
  function cellsOf(c){if(!c.box)return [gk(c.x,c.z)];var ks=[],x0=Math.floor((c.x-c.hw)/8),x1=Math.floor((c.x+c.hw)/8),z0=Math.floor((c.z-c.hd)/8),z1=Math.floor((c.z+c.hd)/8);for(var i=x0;i<=x1;i++)for(var j=z0;j<=z1;j++)ks.push(i+','+j);return ks}
  function gridAdd(c){c.ks=c.ks||cellsOf(c);c.k=c.ks[0];c.ks.forEach(function(k){var l=grid[k]=grid[k]||[];if(l.indexOf(c)<0)l.push(c)})}
  function addCol(c){c.ks=cellsOf(c);gridAdd(c);cols.push(c);return c}
  function unGrid(c){(c.ks||[c.k]).forEach(function(k){var l=grid[k];if(l){var i=l.indexOf(c);if(i>=0)l.splice(i,1)}})}
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
    c=hitsCol(e.x+dx,e.z,r,who);if(!c&&walkable(e.x+dx,e.z,who))e.x+=dx;else hit=c||hit;
    c=hitsCol(e.x,e.z+dz,r,who);if(!c&&walkable(e.x,e.z+dz,who))e.z+=dz;else hit=c||hit;
    return hit;
  }

  /* ---------- Textures ---------- */
  function canvasTex(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
  function detailTex(){return canvasTex(256,256,function(g,w,h){var im=g.createImageData(w,h);for(var y=0;y<h;y++)for(var x=0;x<w;x++){var v=200+((vnoise(x/6,y/6,3)*.6+vnoise(x/1.5,y/1.5,8)*.4)*55)|0,o=(y*w+x)*4;im.data[o]=im.data[o+1]=im.data[o+2]=Math.min(255,v);im.data[o+3]=255}g.putImageData(im,0,0)})}
  function normalTex(){return canvasTex(256,256,function(g,w,h){var im=g.createImageData(w,h);function f(x,y){return Math.sin(x*.09+Math.sin(y*.05)*2)*.5+Math.sin(y*.12+x*.03)*.5+vnoise(x/9,y/9,4)}for(var y=0;y<h;y++)for(var x=0;x<w;x++){var dx=f(x+1,y)-f(x-1,y),dy=f(x,y+1)-f(x,y-1),o=(y*w+x)*4;im.data[o]=128+dx*60;im.data[o+1]=128+dy*60;im.data[o+2]=255;im.data[o+3]=255}g.putImageData(im,0,0)})}

  /* ---------- Monde ---------- */
  function lam(o){return new THREE.MeshLambertMaterial(o)}
  /* Lumières : les feux, torches et lueurs sont des « lumières virtuelles » ; seules les plus proches du joueur
     sont allumées pour de vrai (un petit lot fixe), sinon chaque pixel calculait 70 lumières. */
  var vlights=[],lpool=[],LPOOL=6,_vw=null,cullT=0,qT=0,qN=0,qPR=0;
  function vLight(c,i,d,dc){var o=new THREE.Object3D();o.isVLight=true;o.color=new THREE.Color(c);o.intensity=i;o.distance=d;o.decay=dc||2;vlights.push(o);return o}
  function updLights(){
    if(!_vw)_vw=new THREE.Vector3();var cand=[];
    for(var i=0;i<vlights.length;i++){var o=vlights[i];if(o.intensity<=0)continue;var r=o;while(r.parent)r=r.parent;if(r!==scene){continue}
      o.getWorldPosition(_vw);var dx=_vw.x-P.x,dy=_vw.y-P.y,dz=_vw.z-P.z,d2=dx*dx+dy*dy+dz*dz,lim=o.distance+40;if(d2>lim*lim)continue;cand.push({o:o,d:d2,x:_vw.x,y:_vw.y,z:_vw.z})}
    cand.sort(function(a,b){return a.d-b.d});
    for(var k=0;k<lpool.length;k++){var L=lpool[k],c=cand[k];if(!c){L.intensity=0;continue}L.position.set(c.x,c.y,c.z);L.color.copy(c.o.color);L.distance=c.o.distance;L.decay=c.o.decay;
      var lim2=c.o.distance+40,fade=Math.min(1,Math.max(0,(lim2-Math.sqrt(c.d))/30));L.intensity=c.o.intensity*fade}
  }
  /* on cache ce qui est loin (petits objets à 230 m, gros à 650 m) : le navigateur ne dessine plus des milliers d'objets invisibles */
  function cullFar(){
    if(!_vw)_vw=new THREE.Vector3();var bb=new THREE.Box3(),ch=scene.children;
    for(var i=0;i<ch.length;i++){var o=ch[i];if(o.isLight||o.isPoints||o===sunDisk||o===moonDisk)continue;var u=o.userData;
      if(u._cr===undefined){if(o.isInstancedMesh||terrains.indexOf(o)>=0||o===water){u._cr=-1}else{bb.setFromObject(o);if(bb.isEmpty()){u._cr=-1}else{bb.getCenter(_vw);u._cr=bb.getSize(new THREE.Vector3()).length()/2;u._cx=_vw.x-o.position.x;u._cz=_vw.z-o.position.z;if(u._cr>80)u._cr=-1}}}
      if(u._cr<0)continue;var dx=o.position.x+u._cx-P.x,dz=o.position.z+u._cz-P.z,lim=(u._cr>5?650:u._cr>1.5?230:130)+u._cr,far=dx*dx+dz*dz>lim*lim;
      if(far){if(o.visible){o.visible=false;u._ch=true}}else if(u._ch){o.visible=true;u._ch=false}}
  }
  function applyQ(){if(!R3)return;var q=PP.settings.q,dpr=window.devicePixelRatio||1;if(q==='haute')R3.setPixelRatio(Math.min(1.5,dpr));else if(q==='basse')R3.setPixelRatio(.7);if(q!=='auto')R3.setSize(cv.width,cv.height,false);if(sun)sun.castShadow=q!=='basse'}
  /* qualité auto : si ça rame, on baisse la résolution du rendu, si ça va bien on la remonte */
  function autoQ(dt){
    if(PP.settings.q!=='auto')return;qT+=dt;qN++;if(qT<2.5)return;var fps=qN/qT;qT=0;qN=0;var cur=R3.getPixelRatio(),max=Math.min(1.25,window.devicePixelRatio||1);
    if(fps<27&&cur>.7){R3.setPixelRatio(Math.max(.7,cur-.1));R3.setSize(cv.width,cv.height,false)}
    else if(fps>55&&cur<max){R3.setPixelRatio(Math.min(max,cur+.1));R3.setSize(cv.width,cv.height,false)}
  }
  function init(){
    if(R3)return true;
    if(!window.THREE){PP.toast('La 3D (three.js) n\'a pas pu se charger','warn');return false}
    ray=new THREE.Raycaster();
    R3=new THREE.WebGLRenderer({canvas:cv,antialias:true});R3.setPixelRatio(Math.min(1,window.devicePixelRatio||1));R3.setSize(cv.width,cv.height,false);R3.autoClear=false;applyQ();
    R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFShadowMap;R3.toneMapping=THREE.ACESFilmicToneMapping;R3.toneMappingExposure=1.05;
    cam=new THREE.PerspectiveCamera(PP.settings.fov-3,cv.width/cv.height,.1,1700);cam.rotation.order='YXZ';
    vscene=new THREE.Scene();vcam=new THREE.PerspectiveCamera(60,cv.width/cv.height,.01,10);
    vscene.add(new THREE.HemisphereLight(0xffffff,0x555555,1.3));var dl=new THREE.DirectionalLight(0xffffff,1.1);dl.position.set(1,2,1);vscene.add(dl);
    document.addEventListener('pp-fs',function(){setTimeout(fit,30)});window.addEventListener('resize',fit);
    return true;
  }
  /* Plein écran : le rendu prend toute la taille de l'écran */
  function isFull(){var f=PP.fs();return !!(f&&f.isOn(stage))}
  function fit(){
    if(!R3)return;var w=960,h=540;
    if(isFull()){w=window.innerWidth;h=window.innerHeight}
    cv.width=w;cv.height=h;R3.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();vcam.aspect=w/h;vcam.updateProjectionMatrix();
    if(!running&&P)render();
  }
  /* ---------- Géométries organiques ---------- */
  function jitter(geo,amt,seed){var p=geo.attributes.position;for(var i=0;i<p.count;i++){var x=p.getX(i),y=p.getY(i),z=p.getZ(i),kx=Math.round(x*50),ky=Math.round(y*50),kz=Math.round(z*50);p.setXYZ(i,x+(hash(kx,ky+kz,seed)-.5)*amt,y+(hash(ky,kz+kx,seed+1)-.5)*amt*.6,z+(hash(kz,kx+ky,seed+2)-.5)*amt)}geo.computeVertexNormals();return geo}
  function merge(list,keepNormals){var pos=[],nor=[];list.forEach(function(g){var n=g.index?g.toNonIndexed():g;var p=n.attributes.position.array;for(var i=0;i<p.length;i++)pos.push(p[i]);if(keepNormals){var q=n.attributes.normal.array;for(var j=0;j<q.length;j++)nor.push(q[j])}});var out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(keepNormals)out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));else out.computeVertexNormals();return out}
  var windU={value:0};
  function windMat(base,amp){var m=lam({color:0xffffff});m.onBeforeCompile=function(sh){sh.uniforms.uTime=windU;sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);\n#else\nvec3 ip=vec3(0.0);\n#endif\nfloat hh=max(position.y-'+base.toFixed(2)+',0.0);transformed.x+=sin(uTime*1.7+ip.x*0.23+ip.z*0.17)*'+amp.toFixed(3)+'*hh;transformed.z+=cos(uTime*1.3+ip.z*0.21+ip.x*0.11)*'+(amp*.7).toFixed(3)+'*hh;')};m.customProgramCacheKey=function(){return 'wind'+base+'_'+amp};return m}
  function treeGeos(){
    var trunk=new THREE.CylinderGeometry(.18,.36,4.4,8,3);trunk.translate(0,2.2,0);jitter(trunk,.08,3);
    var b1=new THREE.CylinderGeometry(.06,.11,1.6,5);b1.rotateZ(.9);b1.translate(.55,3.6,0);var b2=new THREE.CylinderGeometry(.05,.1,1.3,5);b2.rotateX(-.9);b2.translate(0,3.9,.45);
    var oakTrunk=merge([trunk.clone(),b1,b2]);
    var pine=merge([0,1,2,3].map(function(i){var c=new THREE.ConeGeometry(2.3-i*.45,3.4-i*.3,10,2);jitter(c,.35,10+i);c.translate(0,3.6+i*1.75,0);return c}));
    var crown=merge([[0,5.4,0,2.2],[1.3,5.9,.4,1.5],[-1.1,6.1,-.5,1.6],[.2,6.8,-.2,1.4],[-.3,4.9,1,1.3]].map(function(b,i){var s=new THREE.IcosahedronGeometry(b[3],1);jitter(s,.4,30+i);s.translate(b[0],b[1],b[2]);return s}));
    var btrunk=new THREE.CylinderGeometry(.13,.2,5.6,7,3);btrunk.translate(0,2.8,0);jitter(btrunk,.05,40);
    var bcrown=merge([[0,6.2,0,1.5],[.6,7.2,.2,1.1],[-.5,5.6,.3,1.1]].map(function(b,i){var s=new THREE.IcosahedronGeometry(b[3],1);s.scale(1,1.4,1);jitter(s,.3,50+i);s.translate(b[0],b[1],b[2]);return s}));
    var palmT=merge([0,1,2,3,4].map(function(i){var c=new THREE.CylinderGeometry(.2-i*.02,.24-i*.02,1.45,8);c.translate(i*i*.06,.7+i*1.35,0);return c}));
    var palmL=merge([0,1,2,3,4,5,6].map(function(k){var l=new THREE.BoxGeometry(.55,.06,3.2);l.translate(0,0,1.55);l.rotateX(.38);l.rotateY(k/7*Math.PI*2);l.translate(.96,6.75,0);return l}).concat([0,1,2].map(function(k){var cn=new THREE.SphereGeometry(.18,8,6);cn.translate(.96+Math.cos(k*2.1)*.3,6.45,Math.sin(k*2.1)*.3);return cn})));
    var cactus=merge([(function(){var c=new THREE.CylinderGeometry(.32,.36,4,10);c.translate(0,2,0);return c})(),(function(){var c=new THREE.CylinderGeometry(.2,.2,1,8);c.rotateZ(Math.PI/2);c.translate(.6,2.2,0);return c})(),(function(){var c=new THREE.CylinderGeometry(.2,.2,1.3,8);c.translate(1.05,2.8,0);return c})(),(function(){var c=new THREE.CylinderGeometry(.18,.18,.8,8);c.rotateZ(Math.PI/2);c.translate(-.5,1.6,0);return c})(),(function(){var c=new THREE.CylinderGeometry(.18,.18,1,8);c.translate(-.85,2.1,0);return c})()]);
    return {palmT:palmT,palmL:palmL,cactus:cactus,trunk:trunk,oakTrunk:oakTrunk,pine:pine,crown:crown,btrunk:btrunk,bcrown:bcrown};
  }
  /* ---------- Nuages ---------- */
  function cloudGeo(seed){var R=rng(seed),parts=[],n=9+(R()*8|0),len=30+R()*40;for(var i=0;i<n;i++){var r=7+R()*9,s=new THREE.SphereGeometry(r,14,10);var x=(R()-.5)*len,y=R()*6,z=(R()-.5)*len*.45;var p=s.attributes.position;for(var j=0;j<p.count;j++){var yy=p.getY(j);if(yy<-r*.25)p.setY(j,-r*.25)}s.translate(x,y+(r-7)*.4,z);parts.push(s)}return merge(parts,true)}
  /* ---------- Coffres ---------- */
  var chestTex={};
  function plankTex(rare){var k=rare?'r':'n';if(chestTex[k])return chestTex[k];chestTex[k]=canvasTex(128,128,function(g,w,h){var base=rare?['#2f3d4f','#3a4a5e','#33435a']:['#7a5230','#8a5f38','#6f4a2a'];for(var y=0;y<h;y+=21){g.fillStyle=base[(y/21)%3|0];g.fillRect(0,y,w,20);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,y+19,w,2);for(var i=0;i<8;i++){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(Math.random()*w,y+3+Math.random()*14,10+Math.random()*30,1)}}});return chestTex[k]}
  function chestMesh(rare){
    var g=new THREE.Group(),wood=lam({map:plankTex(rare)}),iron=new THREE.MeshPhongMaterial({color:rare?0xd4a32a:0x3a3a3e,shininess:rare?80:30,emissive:rare?0x2a1a00:0}),dark=lam({color:0x1a1a1a});
    var base=new THREE.Mesh(new THREE.BoxGeometry(1.1,.6,.72),wood);base.position.y=.3;g.add(base);
    [[-.55,-.36],[.55,-.36],[-.55,.36],[.55,.36]].forEach(function(p){var c=new THREE.Mesh(new THREE.BoxGeometry(.09,.62,.09),iron);c.position.set(p[0]*.96,.31,p[1]*.96);g.add(c)});
    var bandB=new THREE.Mesh(new THREE.BoxGeometry(1.12,.07,.74),iron);bandB.position.y=.08;g.add(bandB);var bandT=bandB.clone();bandT.position.y=.56;g.add(bandT);
    var lid=new THREE.Group();lid.position.set(0,.6,.36);g.add(lid);
    var lm=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,1.1,16,1,false,0,Math.PI),wood);lm.rotation.z=Math.PI/2;lm.position.z=-.36;lid.add(lm);
    var cap1=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.06,16,1,false,0,Math.PI),iron);cap1.rotation.z=Math.PI/2;cap1.position.set(-.5,0,-.36);lid.add(cap1);var cap2=cap1.clone();cap2.position.x=.5;lid.add(cap2);var cap3=cap1.clone();cap3.position.x=0;cap3.scale.set(1,.9,1);lid.add(cap3);
    var lock=new THREE.Mesh(new THREE.BoxGeometry(.18,.22,.05),iron);lock.position.set(0,.47,-.39);g.add(lock);var kh=new THREE.Mesh(new THREE.BoxGeometry(.035,.08,.02),dark);kh.position.set(0,.45,-.42);g.add(kh);
    [-.58,.58].forEach(function(x){var h=new THREE.Mesh(new THREE.TorusGeometry(.08,.018,6,12),iron);h.position.set(x,.38,0);h.rotation.y=Math.PI/2;g.add(h)});
    var spark=null;
    if(rare){var gl=vLight(0xffc860,1.1,7);gl.position.y=1.1;g.add(gl);
      var sg=new THREE.BufferGeometry(),sp=[];for(var i=0;i<24;i++){var a=Math.random()*6.28,r=.4+Math.random()*.5;sp.push(Math.cos(a)*r,.5+Math.random()*1.4,Math.sin(a)*r)}sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
      spark=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffe08a,size:.09,transparent:true,opacity:.9,depthWrite:false}));g.add(spark)}
    g.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
    g.userData={lid:lid,rare:rare,spark:spark};return g;
  }
  /* ---------- Animaux ---------- */
  function animalMesh(kind,antlers){
    /* style « low poly » facetté comme les arbres : silhouettes fines, deux tons, museau, oreilles et queue bien lisibles */
    var wolf=kind==='wolf',g=new THREE.Group();
    function fm(c){return new THREE.MeshLambertMaterial({color:c,flatShading:true})}
    var coat=fm(wolf?0x8a8a8e:0xa86a3c),back=fm(wolf?0x55565c:0x7e4a26),belly=fm(wolf?0xe4e0d8:0xf0e2c4),dark=fm(0x1a1716),muz=fm(wolf?0x3a3a3e:0x5a3a22),hoof=fm(0x2a2420),white=fm(0xfaf6ee);
    var S=wolf?.8:1;
    function m(geo,mat,x,y,z,sx,sy,sz,par){var o=new THREE.Mesh(geo,mat);o.position.set(x*S,y*S,z*S);if(sx)o.scale.set(sx,sy,sz);o.castShadow=true;(par||g).add(o);return o}
    function sph(r,w,h){return new THREE.SphereGeometry(r,w||9,h||7)}
    // corps : torse affiné, dos plus sombre, ventre clair, poitrail, croupe
    var bodyY=wolf?1.0:1.18;
    m(sph(.5,10,8),coat,0,bodyY,0,.6,.62,1.45);
    m(sph(.46,10,6),back,0,bodyY+.16,.05,.52,.38,1.38);
    m(sph(.4,9,6),belly,0,bodyY-.17,0,.5,.36,1.15);
    m(sph(.4,9,7),coat,0,bodyY+.04,-.52,.62,.78,.7);
    m(sph(.4,9,7),coat,0,bodyY+.05,.52,.64,.7,.72);
    if(!wolf){m(sph(.18,8,6),white,0,bodyY+.02,.82,.9,1.1,.5)}
    else{m(sph(.4,9,7),fm(0x9a9896),0,bodyY+.12,-.62,.62,.72,.55)} // collerette du loup
    // cou et tête (le groupe « neck » pivote : tête basse pour brouter)
    var neck=new THREE.Group();neck.position.set(0,(bodyY+.18)*S,-.68*S);g.add(neck);
    var nk=new THREE.Mesh(new THREE.CylinderGeometry(.1*S,.17*S,(wolf?.42:.66)*S,8),coat);nk.rotation.x=wolf?-1.2:-.42;nk.position.set(0,(wolf?.06:.26)*S,(wolf?-.12:-.08)*S);nk.castShadow=true;neck.add(nk);
    var hy=wolf?.16:.56,hz=wolf?-.36:-.22;
    var head=new THREE.Mesh(sph(.17*S,9,7),coat);head.scale.set(.85,.82,1.15);head.position.set(0,hy*S,hz*S);head.userData.head=true;head.castShadow=true;neck.add(head);
    var sn=new THREE.Mesh(new THREE.CylinderGeometry(.045*S,.1*S,(wolf?.34:.3)*S,7),muz);sn.rotation.x=-Math.PI/2+(wolf?.08:.35);sn.position.set(0,(hy-(wolf?.04:.08))*S,(hz-(wolf?.26:.22))*S);sn.castShadow=true;neck.add(sn);
    var nose=new THREE.Mesh(sph(.04*S,6,5),dark);nose.position.set(0,(hy-(wolf?.05:.13))*S,(hz-(wolf?.43:.36))*S);neck.add(nose);
    if(wolf){var jaw=new THREE.Mesh(new THREE.BoxGeometry(.1*S,.04*S,.22*S),belly);jaw.position.set(0,(hy-.11)*S,(hz-.2)*S);neck.add(jaw)}
    [-1,1].forEach(function(sd){
      var ear=new THREE.Mesh(wolf?new THREE.ConeGeometry(.065*S,.2*S,4):sph(.09*S,7,5),wolf?back:coat);
      if(wolf){ear.position.set(sd*.09*S,(hy+.17)*S,(hz+.04)*S);ear.rotation.z=-sd*.12}else{ear.scale.set(.45,1.5,.25);ear.position.set(sd*.15*S,(hy+.12)*S,(hz+.08)*S);ear.rotation.z=-sd*1.05;ear.rotation.x=-.3}
      neck.add(ear);
      var eye=new THREE.Mesh(sph(.026*S,6,5),wolf?new THREE.MeshBasicMaterial({color:0xf2c23a}):dark);eye.position.set(sd*.1*S,(hy+.04)*S,(hz-.09)*S);neck.add(eye);
      var shine=new THREE.Mesh(sph(.009*S,4,3),new THREE.MeshBasicMaterial({color:0xffffff}));shine.position.set(sd*.105*S,(hy+.055)*S,(hz-.11)*S);neck.add(shine);
      if(antlers&&!wolf){var ant=new THREE.Group();ant.position.set(sd*.07,hy+.12,hz+.02);ant.rotation.z=-sd*.45;ant.rotation.x=-.15;neck.add(ant);var am=fm(0xe0d2b4);
        var main=new THREE.Mesh(new THREE.CylinderGeometry(.018,.032,.6,5),am);main.position.y=.3;ant.add(main);
        [[.2,.24,.75,-.5],[.38,.2,-.6,-.3],[.52,.17,.8,-.4],[.6,.13,-.5,.2]].forEach(function(t){var tn=new THREE.Mesh(new THREE.CylinderGeometry(.01,.02,t[1]*1.3,4),am);tn.position.set(0,t[0]+.08,0);tn.rotation.z=t[2]*sd;tn.rotation.x=t[3];ant.add(tn)})}
    });
    // queue : touffe blanche pour le cerf, grosse queue touffue pour le loup
    var tail=new THREE.Group();
    if(wolf){tail.position.set(0,(bodyY+.12)*S,.78*S);var tm=new THREE.Mesh(new THREE.CapsuleGeometry(.11*S,.42*S,3,7),back);tm.rotation.x=-2.35;tm.position.set(0,-.18*S,.2*S);tm.castShadow=true;tail.add(tm);var tip=new THREE.Mesh(sph(.08*S,6,5),belly);tip.position.set(0,-.36*S,.4*S);tail.add(tip)}
    else{tail.position.set(0,bodyY+.18,.84);var tw=new THREE.Mesh(sph(.09,7,5),white);tw.scale.set(.8,1.3,.6);tail.add(tw);var tb=new THREE.Mesh(sph(.06,6,5),back);tb.position.set(0,.07,-.02);tail.add(tb)}
    g.add(tail);
    // pattes fines : cuisse, canon, sabot / patte
    var legs=[],ly=bodyY-.1;[[-.17,-.5],[.17,-.5],[-.17,.5],[.17,.5]].forEach(function(p,i){
      var lg=new THREE.Group();lg.position.set(p[0]*S,ly*S,p[1]*S);g.add(lg);var rear=i>1;
      var up=new THREE.Mesh(new THREE.CylinderGeometry((rear?.1:.075)*S,.05*S,.42*S,7),coat);up.position.y=-.2*S;up.castShadow=true;lg.add(up);
      var lo=new THREE.Mesh(new THREE.CylinderGeometry(.035*S,.03*S,(ly-.48)*S,6),wolf?back:fm(0x8a5630));lo.position.y=-(.41+(ly-.48)/2)*S;lo.castShadow=true;lg.add(lo);
      var hf=new THREE.Mesh(new THREE.CylinderGeometry(.04*S,.05*S,.08*S,6),wolf?dark:hoof);hf.position.y=-(ly-.04)*S;lg.add(hf);legs.push(lg)});
    g.userData.parts={legs:legs,arms:[],neck:neck,tail:tail};return g;
  }
  function buildSky(){
    skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(0x3d7cc9)},hor:{value:new THREE.Color(0xbfdcf0)},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color(0xfff0d0)}},
      vertexShader:'varying vec3 vp;void main(){vp=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform vec3 top;uniform vec3 hor;uniform vec3 sunDir;uniform vec3 sunCol;varying vec3 vp;void main(){float h=max(vp.y,0.0);vec3 c=mix(hor,top,pow(h,0.55));if(vp.y<0.0)c=hor*0.85;float s=max(dot(vp,normalize(sunDir)),0.0);c+=sunCol*(pow(s,320.0)*1.6+pow(s,12.0)*0.18);gl_FragColor=vec4(c,1.0);}'});
    skyMesh=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),skyMat);skyMesh.renderOrder=-1;scene.add(skyMesh);
    var sg=new THREE.BufferGeometry(),sp=[];for(var i=0;i<1600;i++){var u=Math.random()*2-1,a=Math.random()*6.283,r=Math.sqrt(1-u*u);if(u<.05)continue;sp.push(r*Math.cos(a)*1400,u*1400,r*Math.sin(a)*1400)}
    sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(stars);
    sunDisk=new THREE.Mesh(new THREE.CircleGeometry(30,24),new THREE.MeshBasicMaterial({color:0xfff3d6,fog:false,transparent:true}));scene.add(sunDisk);
    moonDisk=new THREE.Mesh(new THREE.CircleGeometry(21,24),new THREE.MeshBasicMaterial({color:0xdfe6f2,fog:false,transparent:true}));scene.add(moonDisk);
    var cm=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x6a6a70,fog:false});var cgs=[0,1,2,3,4,5].map(function(i){return cloudGeo(SEED*7+i*131)});
    for(var c=0;c<30;c++){var g=new THREE.Group(),cl=new THREE.Mesh(cgs[c%6],cm);var sc=.8+Math.random()*.9;cl.scale.set(sc,sc*(.55+Math.random()*.3),sc);cl.rotation.y=Math.random()*6;g.add(cl);
      g.position.set((Math.random()-.5)*1000,150+Math.random()*90,(Math.random()-.5)*1000);g.userData.v=1.5+Math.random()*2.5;scene.add(g);clouds.push(g)}
  }
  function buildWorld(seed,noAnimals){
    SEED=seed;makeIslands();terrains=[];vlights=[];houseList=[];cullT=0;boats=[];hdoors=[];tracers=[];scene=new THREE.Scene();cols=[];grid={};structs=[];zombies=[];animals=[];drops=[];bushes=[];chests=[];clouds=[];grassC=null;
    scene.background=new THREE.Color(0xbfdcf0);scene.fog=new THREE.Fog(0xbfdcf0,120,700);
    buildSky();
    amb=new THREE.HemisphereLight(0xdfefff,0x4a5a30,.85);scene.add(amb);
    sun=new THREE.DirectionalLight(0xfff2dc,1.6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);var sc=sun.shadow.camera;sc.left=sc.bottom=-55;sc.right=sc.top=55;sc.near=1;sc.far=320;sun.shadow.bias=-.0006;sun.shadow.normalBias=.4;sun.castShadow=PP.settings.q!=='basse';scene.add(sun);scene.add(sun.target);
    torchL=new THREE.PointLight(0xffa64a,0,18,1.5);scene.add(torchL);lpool=[];for(var lp=0;lp<LPOOL;lp++){var LL=new THREE.PointLight(0xffa050,0,12,1.5);scene.add(LL);lpool.push(LL)}
    // relief : couleurs selon hauteur et pente, texture de détail par-dessus
    var g=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);g.rotateX(-Math.PI/2);
    var pos=g.attributes.position,col=new Float32Array(pos.count*3),c=new THREE.Color(),grassA=new THREE.Color(0x4f7d2c),grassB=new THREE.Color(0x6e8f37),rock=new THREE.Color(0x77736b),sand=new THREE.Color(0xe6d6a8),snow=new THREE.Color(0xf2f4f7),dirt=new THREE.Color(0x6b5a3c),wet=new THREE.Color(0xb8a57a),sea=new THREE.Color(0x8f8a6a);
    for(var i=0;i<pos.count;i++){var x=pos.getX(i),z=pos.getZ(i),h=height(x,z);pos.setY(i,h);
      var sl=slope(x,z),n=fbm(x/30,z/30,SEED+40);
      if(h<1.6){c.copy(sand);if(h<.15)c.lerp(wet,Math.min(1,(.15-h)*2.5));if(h<-.6)c.lerp(sea,Math.min(1,(-.6-h)/3))}else{c.copy(grassA).lerp(grassB,n);if(h<2.6)c.lerp(sand,(2.6-h));if(n>.68)c.lerp(dirt,(n-.68)*2.2);if(h>20)c.lerp(rock,Math.min(1,(h-20)/8));if(sl>.85)c.lerp(rock,Math.min(1,(sl-.85)*1.6));if(h>36)c.lerp(snow,Math.min(1,(h-36)/5))}
      col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
    var dt=detailTex();dt.repeat.set(140,140);
    terrain=new THREE.Mesh(g,lam({vertexColors:true,map:dt}));terrain.receiveShadow=true;scene.add(terrain);terrains.push(terrain);ISL.forEach(function(I){islandTerrain(I,dt)});gunL=new THREE.PointLight(0xffc070,0,14,1.6);scene.add(gunL);
    makeWater();
    // végétation
    var R=rng(seed),tl=[],rl=[],ol=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s3=new THREE.Vector3(),p3=new THREE.Vector3(),tc=new THREE.Color();
    for(var t=0;t<3400;t++){var x2=(R()-.5)*SIZE*.92,z2=(R()-.5)*SIZE*.92,h2=height(x2,z2);if(h2<1.5||h2>28||slope(x2,z2)>1.1)continue;var fo=fbm(x2/45,z2/45,seed+20);if(fo<.46&&R()<.8)continue;tl.push({x:x2,z:z2,y:h2,s:.75+R()*.8,k:h2>16?0:(R()<.45?0:R()<.7?1:2),r:R()*6,c:R()})}
    for(var r=0;r<560;r++){var x3=(R()-.5)*SIZE*.9,z3=(R()-.5)*SIZE*.9,h3=height(x3,z3);if(h3<.5)continue;rl.push({x:x3,z:z3,y:h3,s:.6+R()*1.5,r:R()*6})}
    for(var o=0;o<900&&ol.length<90;o++){var x6=(R()-.5)*SIZE*.85,z6=(R()-.5)*SIZE*.85,h6=height(x6,z6);if(h6<17||h6>40)continue;ol.push({x:x6,z:z6,y:h6,s:.8+R()*.6,r:R()*6})}
    islandTrees(rng(seed+555),tl,rl,ol);
    function inst(geo,mat,list,fn,col){var im=new THREE.InstancedMesh(geo,mat,list.length);im.castShadow=true;im.receiveShadow=true;list.forEach(function(o,i){fn(o,i,m4);im.setMatrixAt(i,m4);if(col){col(o,tc);im.setColorAt(i,tc)}});scene.add(im);return im}
    var TG=treeGeos();
    function place(o,i,m){q.setFromAxisAngle(new THREE.Vector3(0,1,0),o.r);s3.set(o.s,o.s,o.s);p3.set(o.x,o.y-.25,o.z);m.compose(p3,q,s3)}
    function green(base,var1){return function(o,c){c.setHex(base);c.offsetHSL((o.c-.5)*.05,(o.c-.5)*.1,(o.c-.5)*var1)}}
    trees={list:tl,meshes:[]};
    [[3,[TG.palmT,TG.palmL],[0x8a6a44,0x3f8a2a],[3,.05]],[4,[TG.cactus],[0x4f8a3a],[0,0]],[5,[TG.trunk,TG.pine],[0x5b3b22,0xdfe8ea],[3,.02]],[0,[TG.trunk,TG.pine],[0x5b3b22,0x2f5e2e],[3,.025]],[1,[TG.oakTrunk,TG.crown],[0x5f4027,0x4f8530],[4,.03]],[2,[TG.btrunk,TG.bcrown],[0xe8e4da,0x8aae3c],[4,.035]]].forEach(function(set){
      var lst=tl.filter(function(o){return o.k===set[0]});
      var ms=set[1].map(function(geo,j){return inst(geo,j===0?lam({color:0xffffff}):windMat(set[3][0],set[3][1]),lst,place,j===0?function(o,c){c.setHex(set[2][0]);if(set[0]===4)c.offsetHSL(0,0,(o.c-.5)*.08);if(set[0]===2){c.offsetHSL(0,0,(o.c-.5)*.06)}}:green(set[2][j],.14))});
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
    buildExplore(seed);natureExtras(rng(seed+4242));islandExtras();
    // herbe et fleurs (placées autour du joueur)
    var bladeG=new THREE.ConeGeometry(.05,.55,3);bladeG.translate(0,.27,0);
    var tuft=new THREE.BufferGeometry();(function(){var arr=[];for(var k=0;k<5;k++){var a=k*1.25,ox=Math.cos(a)*.12,oz=Math.sin(a)*.12,lean=.12;arr.push(ox-.03,0,oz, ox+.03,0,oz, ox+Math.cos(a)*lean,.45+k%2*.15,oz+Math.sin(a)*lean)}tuft.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));tuft.computeVertexNormals()})();
    var gm=windMat(0,.22);gm.side=THREE.DoubleSide;grass=new THREE.InstancedMesh(tuft,gm,7000);grass.count=0;scene.add(grass);
    flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(.09,6,4),new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x111111}),900);flowers.count=0;scene.add(flowers);
    // animaux
    if(!noAnimals){for(var an=0;an<30;an++)addAnimal('deer',R);for(var w2=0;w2<10;w2++)addAnimal('wolf',R)}
  }
  function placeGrass(){
    var cx=Math.round(P.x/10)*10,cz=Math.round(P.z/10)*10;if(grassC&&grassC.x===cx&&grassC.z===cz)return;grassC={x:cx,z:cz};
    var m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),c=new THREE.Color(),n=0,f=0,STEP=1.1,RAD=46;
    for(var gx=cx-RAD;gx<=cx+RAD;gx+=STEP)for(var gz=cz-RAD;gz<=cz+RAD;gz+=STEP){
      var ix=Math.round(gx/STEP),iz=Math.round(gz/STEP),hh=hash(ix,iz,7);if(hh<.35)continue;
      var x=ix*STEP+(hash(ix,iz,8)-.5)*STEP,z=iz*STEP+(hash(ix,iz,9)-.5)*STEP;if(Math.hypot(x-cx,z-cz)>RAD)continue;
      var h=height(x,z);if(h<1.1||h>22||onFloor(x,z))continue;var bm=(x*x+z*z>HALF*HALF*.6)?biomeAt(x,z):'main';if(bm==='desert'||bm==='neige')continue;
      if(hash(ix,iz,11)>.985&&f<900){q.identity();s.setScalar(1);p.set(x,h+.25,z);m.compose(p,q,s);flowers.setMatrixAt(f,m);c.setHex([0xf3d23a,0xf1ece2,0xb072e0,0xe2361b][(hash(ix,iz,12)*4)|0]);flowers.setColorAt(f,c);f++;continue}
      if(n>=7000)continue;
      q.setFromAxisAngle(new THREE.Vector3(0,1,0),hh*40);s.set(1,.7+hash(ix,iz,10)*.9,1);p.set(x,h-.03,z);m.compose(p,q,s);grass.setMatrixAt(n,m);
      c.setHex(0x5a8a30);c.offsetHSL((hash(ix,iz,13)-.5)*.04,0,(hash(ix,iz,14)-.5)*.12);if(h>17)c.lerp(new THREE.Color(0x7d7a55),.4);grass.setColorAt(n,c);n++;
    }
    grass.count=n;flowers.count=f;grass.instanceMatrix.needsUpdate=true;flowers.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;if(flowers.instanceColor)flowers.instanceColor.needsUpdate=true;
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
    if(e.rise!==undefined&&e.rise<1){e.rise=Math.min(1,e.rise+dt*.8);e.m.position.y+=-1.9*(1-e.rise);p.arms[0].rotation.x=p.arms[1].rotation.x=-2.8}
  }
  function addAnimal(kind,R){
    var x,z,t=0;do{x=(R()-.5)*SIZE*.8;z=(R()-.5)*SIZE*.8;t++}while((height(x,z)<2||(P&&Math.hypot(x-P.x,z-P.z)<60))&&t<30);
    var wolf=kind==='wolf',ant=!wolf&&R()<.45,m=animalMesh(kind,ant);scene.add(m);
    var a={id:++eid,ant:ant,kind:kind,x:x,z:z,yaw:R()*6,hp:wolf?60:40,m:m,alive:true,t:0,flee:0,r:wolf?.5:.6,cd:0};m.userData.ent=a;animals.push(a);
  }
  function addZombie(px,pz){
    if(px===undefined){px=P.x;pz=P.z}var x,z,n=0;do{var a=Math.random()*6.28,d=40+Math.random()*25;x=px+Math.cos(a)*d;z=pz+Math.sin(a)*d;n++}while(height(x,z)<.5&&n<12);if(height(x,z)<.5)return;
    var blood=bloodNight(),big=Math.random()<(blood?.2:.06)+day*.01;
    var ztype=big?'tank':(Math.random()<.3?'runner':'walker'),m=zombieModel(ztype);scene.add(m);
    var e={type:ztype,rise:0,id:++eid,big:big,kind:'z',x:x,z:z,yaw:0,hp:(70+day*12)*(big?3.5:1),dmg:(9+day*1.5)*(big?2:1),sp:(2.2+Math.random()*.9+Math.min(1.4,day*.1))*(big?.75:1)*(blood?1.15:1),m:m,alive:true,cd:0,r:big?.6:.4,anim:0};m.userData.ent=e;zombies.push(e);
  }

  function addZombieAt(x,z,big){var ztype=big?'tank':(Math.random()<.3?'runner':'walker'),m=zombieModel(ztype);scene.add(m);var e={type:ztype,rise:0,id:++eid,big:big,kind:'z',x:x,z:z,yaw:0,hp:(80+day*12)*(big?3.5:1),dmg:(10+day*1.5)*(big?2:1),sp:(2.4+Math.min(1.4,day*.1))*(big?.75:1),m:m,alive:true,cd:0,r:big?.6:.4,anim:0,guard:1};m.userData.ent=e;zombies.push(e);return e}
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
    if(online&&!auth){try{localStorage.setItem(PP.key('survie-g'),JSON.stringify({seed:SEED,p:{x:P.x,z:P.z,hp:P.hp,food:P.food,water:P.water,spawn:P.spawn},inv:inv,st:st,goal:goalI}))}catch(e){}return}
    var s={v:2,seed:SEED,day:day,t:dayT,p:{x:P.x,z:P.z,hp:P.hp,food:P.food,water:P.water,spawn:P.spawn},inv:inv,st:st,goal:goalI,rescue:rescueT,
      sts:structs.filter(function(o){return !o.dead}).map(function(o){return [o.type,+o.x.toFixed(2),+o.z.toFixed(2),o.rot,Math.round(o.hp),o.store||null]}),
      bt:boats.filter(function(b){return b.built}).map(function(b){return [+b.x.toFixed(1),+b.z.toFixed(1),+b.yaw.toFixed(2)]}),ch:chests.filter(function(c){return c.open}).map(function(c){return c.id}),ci:(function(){var o={};chests.forEach(function(c){if(c.items)o[c.id]=c.items});return o})(),
      tr:trees.list.filter(function(o){return o.hp<=0}).map(function(o){return trees.list.indexOf(o)}),
      rk:rocks.userData.list.filter(function(o){return o.hp<=0}).map(function(o){return o.i}),
      or:ores.userData.list.filter(function(o){return o.hp<=0}).map(function(o){return o.i})};
    try{localStorage.setItem(PP.key('survie2'),JSON.stringify(s))}catch(e){}fogSave();
  }
  function hasSave(){try{return !!JSON.parse(localStorage.getItem(PP.key('survie2')))}catch(e){return false}}
  function load(){
    var s;try{s=JSON.parse(localStorage.getItem(PP.key('survie2')))}catch(e){}
    if(!s)return newGame();
    buildWorld(s.seed);day=s.day;dayT=s.t;inv=Object.assign(freshInv(),s.inv);st=s.st||{bois:0,fer:0,deer:0,kills:0};goalI=s.goal||0;rescueT=s.rescue==null?-1:s.rescue;won=false;
    P={x:s.p.x,z:s.p.z,y:height(s.p.x,s.p.z),vy:0,yaw:0,pitch:0,hp:s.p.hp,food:s.p.food,water:s.p.water,stam:100,bob:0,spawn:s.p.spawn};
    (s.sts||[]).forEach(function(o){var x=build(o[0],o[1],o[2],o[3],true);if(x){x.hp=o[4];if(o[5])x.store=o[5]}});P.spawn=s.p.spawn;
    (s.ch||[]).forEach(function(id){var c=chests[id];if(c){c.open=true;c.m.userData.lid.rotation.x=-1.9;if(c.m.userData.spark)c.m.userData.spark.visible=false}});Object.keys(s.ci||{}).forEach(function(id){if(chests[id])chests[id].items=s.ci[id]});
    (s.tr||[]).forEach(function(i){var o=trees.list[i];if(o)fell(o,'tree',true)});
    (s.rk||[]).forEach(function(i){var o=rocks.userData.list[i];if(o)fell(o,'rock',true)});
    (s.or||[]).forEach(function(i){var o=ores.userData.list[i];if(o)fell(o,'ore',true)});
    (s.bt||[]).forEach(function(b){addBoat(b[0],b[1],b[2],true)});
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
      var pl=vLight(0xff9a40,2.2,24,1.4);pl.position.y=1.2;g.add(pl);g.userData.light=pl;
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
      var pl2=vLight(0xff7a30,1.6,14,1.5);pl2.position.y=1.8;g.add(pl2);g.userData.light=pl2;
    }else if(type==='box'){var cm=chestMesh(false);cm.scale.setScalar(1.1);g.add(cm)}
    g.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
    return g;
  }
  function canPay(c){return Object.keys(c).every(function(k){return (inv[k]||0)>=c[k]})}
  function pay(c){Object.keys(c).forEach(function(k){inv[k]-=c[k]})}
  function costTxt(c){return Object.keys(c).map(function(k){return c[k]+' '+(NAMES[k]||k).toLowerCase()}).join(', ')}
  function build(type,x,z,rot,free){
    if(type==='boat'){if(height(x,z)>-.5){msg('Pose la barque sur l\'eau, au bord du rivage');sfx.play('tick');return null}if(!free){if(!canPay(BUILD.boat.cost)){msg('Il manque : '+costTxt(BUILD.boat.cost));sfx.play('tick');return null}pay(BUILD.boat.cost);sfx.play('win');msg('Barque construite ! Monte dedans avec E');hudInv()}return addBoat(x,z,rot*Math.PI/2,true)}
    var B=BUILD[type];if(!free){if(!canPay(B.cost)){msg('Il manque : '+costTxt(B.cost));sfx.play('tick');return null}pay(B.cost)}
    var m=structMesh(type),y=groundAt(x,z);m.position.set(x,y,z);m.rotation.y=rot*Math.PI/2;scene.add(m);
    var wide=type==='wall'||type==='door'||type==='spike',hw=wide?(rot%2?.25:1.05):type==='bench'?(rot%2?.5:1):type==='forge'?1.1:.6,hd=wide?(rot%2?1.05:.25):type==='bench'?(rot%2?1:.5):type==='forge'?1.1:(type==='bed'?1.05:.6);
    var o={type:type,x:x,z:z,rot:rot,hp:B.hp,max:B.hp,m:m,box:true,hw:hw,hd:hd};
    if(type!=='fire')addCol(o);
    structs.push(o);
    if(type==='bed'&&!free)P.spawn={x:x,z:z+1.6};
    if(!free){sfx.play('pickup');hudInv();relayEv({e:'build',ty:type,x:x,z:z,r:rot})}
    return o;
  }
  function destroyStruct(o){remCol(o);scene.remove(o.m)}
  function ghostUpdate(){
    if(!buildMode){if(ghost){scene.remove(ghost);ghost=null}return}
    if(!ghost||ghost.userData.type!==buildMode){if(ghost)scene.remove(ghost);ghost=buildMode==='boat'?boatMesh():structMesh(buildMode);ghost.userData.type=buildMode;ghost.traverse(function(o){if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.5;o.castShadow=false}if(o.isLight)o.intensity=0});scene.add(ghost)}
    var x=Math.round(P.x-Math.sin(P.yaw)*3.2),z=Math.round(P.z-Math.cos(P.yaw)*3.2);
    ghost.position.set(x,buildMode==='boat'?-.3:groundAt(x,z),z);ghost.rotation.y=ghostRot*Math.PI/2;ghost.userData.x=x;ghost.userData.z=z;
    var ok=canPay(BUILD[buildMode].cost);ghost.traverse(function(o){if(o.isMesh&&o.material.color)o.material.color.setHex(ok?0x9fe36a:0xe2361b)});
  }

  /* ---------- Effets : éclats, arbres qui tombent, objets au sol ---------- */
  var parts=[],falls=[],shakes=[],shakeT=0,PG=null,TMP4=null;
  function burst(x,y,z,col,n,spd){
    if(!PG)PG=new THREE.BoxGeometry(.1,.1,.1);var mat=lam({color:col});
    for(var i=0;i<n;i++){var m=new THREE.Mesh(PG,mat);m.position.set(x+(Math.random()-.5)*.3,y+(Math.random()-.5)*.3,z+(Math.random()-.5)*.3);m.scale.setScalar(.5+Math.random()*1.3);m.castShadow=true;scene.add(m);
      parts.push({m:m,v:new THREE.Vector3((Math.random()-.5)*spd,Math.random()*spd*.8+1.5,(Math.random()-.5)*spd),rx:(Math.random()-.5)*14,ry:(Math.random()-.5)*14,t:.8+Math.random()*.6})}
  }
  function treeBase(o){return new THREE.Vector3(o.x,o.y-.25,o.z)}
  function treeM0(o){if(!o.m0){o.m0=new THREE.Matrix4();o.ms[0].getMatrixAt(o.i,o.m0)}return o.m0}
  function shakeTree(o,dir){treeM0(o);var s=shakes.filter(function(x){return x.o===o})[0];if(s){s.t=.35;return}shakes.push({o:o,t:.35,ax:new THREE.Vector3(dir.z,0,-dir.x).normalize()})}
  function fallTree(o,nd){
    var m0=treeM0(o),base=treeBase(o),inv0=new THREE.Matrix4().makeTranslation(-base.x,-base.y,-base.z).multiply(m0),g=new THREE.Group(),c=new THREE.Color();
    o.ms.forEach(function(im){if(im.instanceColor)im.getColorAt(o.i,c);else c.setHex(0x5b3b22);var m=new THREE.Mesh(im.geometry,lam({color:c.getHex()}));m.applyMatrix4(inv0);m.castShadow=true;g.add(m)});
    g.position.copy(base);scene.add(g);
    var dx=o.x-P.x,dz=o.z-P.z,l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
    falls.push({nd:nd,g:g,x:o.x,z:o.z,dx:dx,dz:dz,axis:new THREE.Vector3(dz,0,-dx),a:0,w:0,phase:0,t:0,len:8*o.s});
    if(!nd){sfx.play('hit');msg('L\'arbre tombe !')}
  }
  function itemMesh(k){
    var g=new THREE.Group();function add(geo,col,x,y,z,rx,ry,rz){var m=new THREE.Mesh(geo,lam({color:col}));m.position.set(x||0,y||0,z||0);m.rotation.set(rx||0,ry||0,rz||0);m.castShadow=true;g.add(m);return m}
    if(k==='bois'){add(new THREE.CylinderGeometry(.2,.2,1.1,10),0x7a5230,0,0,0,0,0,Math.PI/2);add(new THREE.CircleGeometry(.19,10),0xd2a868,.551,0,0,0,Math.PI/2);add(new THREE.CircleGeometry(.19,10),0xd2a868,-.551,0,0,0,-Math.PI/2);add(new THREE.CylinderGeometry(.04,.05,.3,5),0x6b4426,.1,.2,0,0,0,.5)}
    else if(k==='pierre'){var r=add(new THREE.DodecahedronGeometry(.26,0),0x9a968e);r.scale.set(1.2,.8,1);add(new THREE.DodecahedronGeometry(.15,0),0x86827a,.25,-.05,.1)}
    else if(k==='fer'){add(new THREE.BoxGeometry(.45,.14,.22),0xb8bcc4);add(new THREE.BoxGeometry(.36,.06,.16),0xd8dce2,0,.09,0);g.children.forEach(function(m){m.material.emissive=new THREE.Color(0x202020)})}
    else if(k==='viande'||k==='cuite'){var col=k==='viande'?0xb5483a:0x7a3f1e;var mm=add(new THREE.SphereGeometry(.22,12,10),col);mm.scale.set(1.3,.9,1);add(new THREE.CylinderGeometry(.045,.045,.4,6),0xf1ece2,.38,0,0,0,0,Math.PI/2);add(new THREE.SphereGeometry(.07,8,6),0xf1ece2,.6,.04,0);add(new THREE.SphereGeometry(.07,8,6),0xf1ece2,.6,-.04,0);add(new THREE.SphereGeometry(.1,8,6),k==='viande'?0xe0b0a0:0x9a5a2e,-.05,.12,.08)}
    else if(k==='cuir'){var h=add(new THREE.IcosahedronGeometry(.32,1),0x8a5a33);h.scale.set(1.3,.18,1)}
    else if(k==='tissu'){add(new THREE.BoxGeometry(.4,.08,.32),0xd9cfb8);add(new THREE.BoxGeometry(.4,.06,.16),0xc8bea6,0,.07,.08)}
    else if(k==='munitions'){add(new THREE.BoxGeometry(.3,.18,.18),0x4f5a33);add(new THREE.BoxGeometry(.31,.04,.19),0xd4a32a,0,.1,0)}
    else if(k==='conserve'){add(new THREE.CylinderGeometry(.13,.13,.26,12),0xa9adb3);add(new THREE.CylinderGeometry(.135,.135,.12,12),0xe2361b)}
    else{add(new THREE.BoxGeometry(.3,.3,.3),0x9a3020)}
    return g;
  }
  function dropItem(x,z,k,n,auto){
    var m=itemMesh(k),y=groundAt(x,z);m.position.set(x,y+1.2,z);scene.add(m);
    drops.push({x:x,z:z,m:m,items:(function(){var o={};o[k]=n;return o})(),auto:auto!==false,vy:3+Math.random()*1.5,y:y+1.2,spin:Math.random()*6,t:0});
  }
  function collect(d){
    Object.keys(d.items).forEach(function(k){inv[k]=(inv[k]||0)+d.items[k];if(k==='bois')st.bois+=d.items[k];if(k==='fer')st.fer+=d.items[k];popup('+'+d.items[k]+' '+(NAMES[k]||k).toLowerCase(),k)});
    scene.remove(d.m);d.gone=true;sfx.play('pickup');hudInv();
  }
  function stepFx(dt){
    stepDetails(dt);
    var nightK=isNight()?1:0;windows.forEach(function(g){g.material.emissive.setRGB(.55*nightK,.38*nightK,.12*nightK)});
    smokes.forEach(function(s){s.t+=dt*.25;if(s.t>1)s.t-=1;s.m.position.set(s.x+Math.sin(s.t*6)*.3+s.t*1.2,s.y+s.t*5,s.z);s.m.scale.setScalar(.5+s.t*1.8);s.m.material.opacity=.45*(1-s.t)});
    windU.value+=dt;
    chests.forEach(function(c){if(c.anim!==undefined&&c.anim<1){c.anim=Math.min(1,c.anim+dt*2.2);var e=1-Math.pow(1-c.anim,3);c.m.userData.lid.rotation.x=-1.9*e-Math.sin(c.anim*Math.PI)*.15}if(c.m.userData.spark&&c.m.userData.spark.visible){c.m.userData.spark.rotation.y+=dt*.8;c.m.userData.spark.material.opacity=.6+Math.sin(windU.value*3+c.id)*.35}});
    parts.forEach(function(p){p.t-=dt;p.v.y-=15*dt;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=p.rx*dt;p.m.rotation.y+=p.ry*dt;var g=groundAt(p.m.position.x,p.m.position.z)+.05;if(p.m.position.y<g){p.m.position.y=g;p.v.x*=.5;p.v.z*=.5;p.v.y=Math.abs(p.v.y)*.25;p.rx*=.5;p.ry*=.5}if(p.t<.3)p.m.scale.multiplyScalar(.88)});
    parts=parts.filter(function(p){if(p.t<=0){scene.remove(p.m);return false}return true});
    if(!TMP4)TMP4={a:new THREE.Matrix4(),b:new THREE.Matrix4(),c:new THREE.Matrix4()};
    shakes.forEach(function(s){s.t-=dt;var o=s.o,base=treeBase(o),ang=s.t>0?Math.sin(s.t*45)*.07*(s.t/.35):0;
      TMP4.a.makeTranslation(base.x,base.y,base.z).multiply(TMP4.b.makeRotationAxis(s.ax,ang)).multiply(TMP4.c.makeTranslation(-base.x,-base.y,-base.z)).multiply(o.m0);
      if(o.hp>0)o.ms.forEach(function(im){im.setMatrixAt(o.i,TMP4.a);im.instanceMatrix.needsUpdate=true})});
    shakes=shakes.filter(function(s){return s.t>0});
    falls.forEach(function(f){f.t+=dt;
      if(f.phase===0){f.w+=dt*2.6;f.a=Math.min(Math.PI/2-.04,f.a+f.w*dt);f.g.quaternion.setFromAxisAngle(f.axis,f.a);
        if(f.a>=Math.PI/2-.04){f.phase=1;f.t=0;sfx.play('crash');shakeT=.3;var tip=f.len*.6,tx=f.x+f.dx*tip,tz=f.z+f.dz*tip;burst(tx,height(tx,tz)+.6,tz,0x3b6e2c,26,7);burst(tx,height(tx,tz)+.4,tz,0x2c5a2c,14,5);burst(f.x+f.dx*2,height(f.x,f.z)+.3,f.z+f.dz*2,0x7a5230,10,4);
          if(!f.nd)for(var k=0;k<3;k++){var d=1.6+k*1.9;dropItem(f.x+f.dx*d+(Math.random()-.5)*.6,f.z+f.dz*d+(Math.random()-.5)*.6,'bois',3,true)}}}
      else if(f.t>1.1){var s=Math.max(0,1-(f.t-1.1)*1.4);f.g.scale.setScalar(Math.max(.01,s));if(s<=0){scene.remove(f.g);f.dead=1}}
    });
    falls=falls.filter(function(f){return !f.dead});
    var now=performance.now();
    drops.forEach(function(d){
      var gy=groundAt(d.x,d.z)+.25;
      if(d.vy!==undefined){d.vy-=14*dt;d.y+=d.vy*dt;if(d.y<gy){d.y=gy;d.vy=d.vy<-2?-d.vy*.3:0}}else d.y=gy;
      d.spin+=dt*(d.auto?1.6:.4);d.m.rotation.y=d.spin;d.m.position.set(d.x,d.y+(d.auto?Math.sin(now/300+d.spin)*.08+.1:0),d.z);
      if(!d.auto)return;d.t+=dt;var dx=P.x-d.x,dz=P.z-d.z,dd=Math.hypot(dx,dz);
      if(d.t>.6&&dd<3.4){var sp=Math.min(dd,(4-dd)*5*dt+.1);d.x+=dx/dd*sp;d.z+=dz/dd*sp;if(dd<.9)collect(d)}
    });
    drops=drops.filter(function(d){return !d.gone});
    shakeT=Math.max(0,shakeT-dt);
  }
  function flashEnt(e,pt){e.flinch=.22;
    e.m.traverse(function(o){if(o.isMesh&&o.material.emissive){o.material.emissive.setHex(0x7a1010)}});
    setTimeout(function(){if(e.m)e.m.traverse(function(o){if(o.isMesh&&o.material.emissive)o.material.emissive.setHex(0)})},130);
    if(pt)burst(pt.x,pt.y,pt.z,e.kind==='z'?0x4a6a2a:0x9a1a1a,8,3);
    var dx=e.x-P.x,dz=e.z-P.z,l=Math.hypot(dx,dz)||1;moveCirc(e,dx/l*.5,dz/l*.5,e.r,'a');
  }
  var popN=0;
  function popup(t,k){
    var box=$('sv-pops');if(!box)return;var d=document.createElement('div');d.className='sv-pop';d.innerHTML='<img src="'+icon(k)+'" alt="">'+esc(t);box.appendChild(d);
    setTimeout(function(){d.classList.add('out');setTimeout(function(){d.remove()},400)},1400);while(box.children.length>5)box.removeChild(box.firstChild);
  }

  /* ---------- Icônes dessinées (inventaire) ---------- */
  var IC={};
  function icon(k){
    if(IC[k])return IC[k];var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d');g.lineJoin='round';g.lineCap='round';g.lineWidth=3;g.strokeStyle='#141210';
    function poly(pts,fill){g.beginPath();g.moveTo(pts[0],pts[1]);for(var i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fillStyle=fill;g.fill();g.stroke()}
    function circ(x,y,r,fill){g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=fill;g.fill();g.stroke()}
    function rect(x,y,w,h,fill){g.fillStyle=fill;g.fillRect(x,y,w,h);g.strokeRect(x,y,w,h)}
    function line(x1,y1,x2,y2,col,w){g.save();g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.restore()}
    function outlined(x1,y1,x2,y2,col,w){line(x1,y1,x2,y2,'#141210',w+4);line(x1,y1,x2,y2,col,w)}
    switch(k){
      case 'bois':rect(8,22,42,20,'#8a5a2e');g.beginPath();g.ellipse(50,32,8,10,0,0,7);g.fillStyle='#d2a868';g.fill();g.stroke();g.beginPath();g.ellipse(50,32,3,4,0,0,7);g.stroke();line(14,28,40,28,'#6b4426',2);break;
      case 'pierre':poly([10,44,16,22,32,14,50,20,56,40,40,52,20,52],'#9a968e');poly([32,14,50,20,40,30,26,26],'#b4b0a8');break;
      case 'fer':poly([8,46,16,30,48,30,56,46],'#a9adb6');poly([16,30,22,20,42,20,48,30],'#d4d8de');break;
      case 'baies':g.fillStyle='#3b6e2c';poly([30,8,46,12,38,22],'#4f8a32');circ(22,38,10,'#c0152a');circ(40,34,10,'#a3101f');circ(32,50,9,'#d0202f');break;
      case 'viande':case 'cuite':outlined(38,34,56,18,'#f1ece2',7);circ(56,14,5,'#f1ece2');circ(58,21,5,'#f1ece2');g.beginPath();g.ellipse(26,40,18,14,-.5,0,7);g.fillStyle=k==='viande'?'#b5483a':'#7a3f1e';g.fill();g.stroke();g.beginPath();g.ellipse(22,36,6,4,-.5,0,7);g.fillStyle=k==='viande'?'#e0b0a0':'#a5683a';g.fill();break;
      case 'conserve':rect(18,16,28,36,'#a9adb3');rect(18,26,28,14,'#e2361b');g.beginPath();g.ellipse(32,16,14,4,0,0,7);g.fillStyle='#c9cdd3';g.fill();g.stroke();break;
      case 'eau':poly([26,8,38,8,38,18,46,26,46,56,18,56,18,26,26,18],'#3fa9ff');rect(26,4,12,6,'#141210');line(22,34,42,34,'#9fd2ff',3);break;
      case 'bandage':circ(32,32,20,'#f1ece2');circ(32,32,6,'#d9cfb8');g.fillStyle='#e2361b';g.fillRect(29,14,6,10);g.fillRect(24,17,16,4);break;
      case 'munitions':[16,28,40].forEach(function(x){rect(x,26,9,26,'#d4a32a');poly([x,26,x+4.5,12,x+9,26],'#b07020')});break;
      case 'fleches':outlined(12,52,50,14,'#8a5a2e',4);poly([50,14,42,16,48,22],'#9a968e');poly([12,52,10,42,18,46],'#e2361b');poly([12,52,22,54,18,46],'#e2361b');break;
      case 'tissu':poly([8,22,56,18,56,46,8,50],'#d9cfb8');line(10,34,54,32,'#a89e88',2);break;
      case 'cuir':poly([12,18,26,12,40,16,54,12,52,30,56,48,38,52,26,48,10,52,14,32],'#8a5a33');break;
      case 'radio':rect(10,14,44,36,'#2f6b3a');rect(16,20,12,10,'#141210');rect(34,22,14,6,'#141210');line(16,40,48,40,'#d4a32a',2);line(30,32,30,46,'#d4a32a',2);circ(44,42,3,'#e2361b');break;
      case 'axe':outlined(16,54,44,14,'#8a5a2e',5);poly([36,8,54,16,48,30,38,22],'#b8bcc4');break;
      case 'pick':outlined(18,56,40,18,'#8a5a2e',5);g.beginPath();g.moveTo(14,22);g.quadraticCurveTo(38,4,58,26);g.lineWidth=8;g.strokeStyle='#141210';g.stroke();g.lineWidth=4;g.strokeStyle='#9a968e';g.stroke();g.lineWidth=3;g.strokeStyle='#141210';break;
      case 'sword':outlined(18,46,52,12,'#d4d8de',6);outlined(12,40,26,54,'#5a3d22',5);outlined(10,52,16,58,'#d4a32a',5);break;
      case 'bow':g.beginPath();g.arc(20,32,24,-1.2,1.2);g.lineWidth=8;g.stroke();g.lineWidth=4;g.strokeStyle='#8a5a2e';g.stroke();g.strokeStyle='#141210';line(29,10,29,54,'#f1ece2',2);break;
      case 'pistol':poly([12,20,52,20,52,30,30,30,28,50,16,50,18,30,12,30],'#3a3a3e');break;
      case 'rifle':poly([4,26,48,26,48,22,60,22,60,30,36,30,34,40,28,40,26,32,4,36],'#3a3a3e');poly([4,26,16,26,14,38,4,40],'#8a5a2e');break;
      case 'torch':outlined(26,58,34,26,'#8a5a2e',6);poly([34,26,26,20,30,8,36,14,40,4,44,18,40,26],'#ff9a2a');break;
      case 'armure':poly([16,12,26,16,38,16,48,12,54,24,48,28,48,54,16,54,16,28,10,24],'#6c7078');line(32,18,32,52,'#4a4e56',2);break;
      default:rect(14,14,36,36,'#9a3020');
    }
    IC[k]=c.toDataURL();return IC[k];
  }

  /* ---------- Inventaire ---------- */
  var DESC={bois:'Pour construire et fabriquer. Coupe des arbres avec la hache.',pierre:'Casse des rochers (la pioche va deux fois plus vite).',fer:'Mine les rochers rouillés des montagnes avec une pioche.',baies:'Clic : manger (+8 faim).',viande:'Crue : clic pour manger (+10 faim, risque). Mieux : cuire au feu.',cuite:'Clic : manger (+35 faim).',conserve:'Clic : manger (+25 faim, +5 soif).',eau:'Clic : boire (+40 soif).',bandage:'Clic : se soigner (+35 vie).',munitions:'Pour le pistolet et le fusil.',fleches:'Pour l\'arc. Fabrique-les à l\'établi.',tissu:'Bandages, lit, arc, armure.',cuir:'Armure en cuir. Sur les cerfs et les loups.',radio:'Il en faut 5 pour la radio de secours (forge).'};
  var USE={baies:['food',8],viande:['food',10],cuite:['food',35],conserve:['food',25],eau:['water',40],bandage:['hp',35]};
  function useItem(k){
    var u=USE[k];if(!u||!inv[k])return;
    if(u[0]==='hp'&&P.hp>=100)return msg('Ta vie est déjà pleine');
    inv[k]--;if(u[0]==='food')P.food=Math.min(100,P.food+u[1]);if(u[0]==='water')P.water=Math.min(100,P.water+u[1]);if(u[0]==='hp')P.hp=Math.min(100,P.hp+u[1]);if(k==='conserve')P.water=Math.min(100,P.water+5);
    if(k==='viande'&&Math.random()<.3){P.hp-=8;msg('La viande crue te rend malade')}
    sfx.play(u[0]==='food'?'eat':'pickup');hudInv();invPanel(true);
  }
  function invPanel(refresh){
    var el=$('sv-invp');if(!refresh&&!el.hidden){el.hidden=true;lock();return}
    if(refresh&&el.hidden)return;
    $('sv-build').hidden=true;$('sv-craft').hidden=true;buildMode=null;
    var ks=['bois','pierre','fer','tissu','cuir','baies','viande','cuite','conserve','eau','bandage','munitions','fleches','radio'],slots=[];
    ks.forEach(function(k){if(inv[k]>0)slots.push(k)});
    var h='<div class="iv-head"><b>Inventaire</b><span>Jour '+day+' · '+st.kills+' créatures abattues · objectif '+(goalI+1)+'/'+GOALS.length+'</span></div><div class="iv-cols"><div><p class="iv-l">Sac</p><div class="iv-grid">';
    for(var i=0;i<20;i++){var k=slots[i];h+=k?'<button type="button" class="iv-slot'+(USE[k]?' use':'')+'" data-it="'+k+'" style="animation-delay:'+(i*18)+'ms"><img src="'+icon(k)+'" alt=""><b>'+inv[k]+'</b><small>'+esc(NAMES[k])+'</small></button>':'<span class="iv-slot empty" style="animation-delay:'+(i*18)+'ms"></span>'}
    h+='</div><p class="iv-desc" id="sv-ivdesc">Survole un objet pour le décrire. Clic sur la nourriture, l\'eau ou un bandage pour l\'utiliser.</p></div><div><p class="iv-l">Outils et armes</p><div class="iv-tools">';
    TORDER.forEach(function(t){var own=t==='axe'||inv[t];h+='<button type="button" class="iv-tool'+(tool===t?' on':'')+(own?'':' off')+'" data-tool="'+t+'"'+(own?'':' disabled')+'><img src="'+icon(t)+'" alt=""><small>'+(t==='axe'&&inv.iaxe?'Hache en fer':TOOLS[t].n)+(TOOLS[t].ammo&&own?' · '+inv[TOOLS[t].ammo]:'')+'</small></button>'});
    h+='</div><p class="iv-l">Armure</p><div class="iv-arm"><img src="'+icon('armure')+'" alt="" style="opacity:'+(inv.armure?1:.25)+'"><span>'+(inv.armure===2?'Armure en fer · −55 % de dégâts':inv.armure===1?'Armure en cuir · −30 % de dégâts':'Aucune armure. Fabrique-en une à l\'établi (C).')+'</span></div>';
    h+='<p class="iv-l">État</p><div class="iv-stats">'+[['Vie',P.hp,'#f1ece2'],['Faim',P.food,'#d4a32a'],['Soif',P.water,'#3fa9ff']].map(function(s){return '<label>'+s[0]+'<i><em style="width:'+Math.max(0,s[1])+'%;background:'+s[2]+'"></em></i><b>'+Math.round(s[1])+'</b></label>'}).join('')+'</div></div></div><small class="hint">Tab ou I pour fermer.</small>';
    el.innerHTML=h;el.hidden=false;unlock();
  }
  $('sv-invp').addEventListener('click',function(e){var s=e.target.closest('[data-it]');if(s){useItem(s.dataset.it);return}var t=e.target.closest('[data-tool]');if(t){setTool(t.dataset.tool);invPanel(true)}});
  $('sv-invp').addEventListener('mouseover',function(e){var s=e.target.closest('[data-it]');if(s){var d=$('sv-ivdesc');if(d)d.textContent=NAMES[s.dataset.it]+' : '+(DESC[s.dataset.it]||'')}});

  /* ---------- Lieux à explorer : maisons, châteaux, sous-sols ---------- */
  var floors=[],traps=[],rooms=[],castles=[];
  function onFloor(x,z){for(var i=0;i<floors.length;i++){var f=floors[i];if(x>f.x0&&x<f.x1&&z>f.z0&&z<f.z1)return f}return null}
  function groundAt(x,z){var f=onFloor(x,z);return f?f.y:height(x,z)}
  function walkable(x,z,who){if(who==='p')return !!onFloor(x,z)||(Math.abs(x)<WORLDH&&Math.abs(z)<WORLDH);return !!onFloor(x,z)||height(x,z)>-1.3}
  var STX={};
  function stoneTex(){if(STX.s)return STX.s;STX.s=canvasTex(128,128,function(g,w,h){g.fillStyle='#8d877b';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=16)for(var x=-(y/16%2)*16;x<w;x+=32){var v=120+Math.random()*30|0;g.fillStyle='rgb('+v+','+(v-6)+','+(v-16)+')';g.fillRect(x+1,y+1,30,14)}});return STX.s}
  function woodTex(){if(STX.w)return STX.w;STX.w=canvasTex(128,128,function(g,w,h){for(var x=0;x<w;x+=16){var v=Math.random()*20|0;g.fillStyle='rgb('+(150+v)+','+(108+v)+','+(66+v)+')';g.fillRect(x,0,15,h);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+15,0,1,h)}});return STX.w}
  function plasterTex(){if(STX.p)return STX.p;STX.p=canvasTex(128,128,function(g,w,h){g.fillStyle='#e4d9c2';g.fillRect(0,0,w,h);for(var i=0;i<400;i++){g.fillStyle='rgba(0,0,0,.05)';g.fillRect(Math.random()*w,Math.random()*h,2,2)}g.fillStyle='#6b4a2a';g.fillRect(0,0,w,8);g.fillRect(0,h-8,w,8);g.fillRect(0,0,8,h)});return STX.p}
  function tmat(t,rx,ry,col){var tt=t.clone();tt.needsUpdate=true;tt.repeat.set(rx,ry);return lam({map:tt,color:col||0xffffff})}
  function wallAt(x,y0,z,w,h,d,mat,type){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y0+h/2,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);addCol({x:x,z:z,box:true,hw:w/2,hd:d/2,type:type||'bwall'});return m}
  function deco(geo,mat,x,y,z,ry){var m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
  function clearArea(x0,x1,z0,z1){
    trees.list.forEach(function(o){if(o.hp>0&&o.x>x0&&o.x<x1&&o.z>z0&&o.z<z1)fell(o,'tree',true)});
    rocks.userData.list.forEach(function(o){if(o.hp>0&&o.x>x0-1&&o.x<x1+1&&o.z>z0-1&&o.z<z1+1)fell(o,'rock',true)});
    bushes.forEach(function(b){if(b.x>x0&&b.x<x1&&b.z>z0&&b.z<z1){b.m.visible=false;b.full=false;b.t=1e9}});
  }
  function addChest(x,y,z,rare,rot){var m=chestMesh(rare);m.position.set(x,y,z);m.rotation.y=rot||0;scene.add(m);var co={id:chests.length,x:x,z:z,m:m,open:false,rare:rare};chests.push(co);addCol({x:x,z:z,r:.6,type:'chest',ref:co});return co}
  function torch(x,y,z){var f=deco(new THREE.ConeGeometry(.1,.3,6),new THREE.MeshBasicMaterial({color:0xffa040}),x,y+.2,z);deco(new THREE.CylinderGeometry(.04,.05,.4,5),lam({color:0x4a3420}),x,y-.1,z);var l=vLight(0xffa050,1.6,12,1.5);l.position.set(x,y+.4,z);scene.add(l);return f}
  function furniture(x,y,z,R){
    var wood=lam({color:0x7a5230}),dark=lam({color:0x4a3420});
    var k=R();
    if(k<.35){deco(new THREE.BoxGeometry(1.4,.08,.8),wood,x,y+.78,z);[[-.6,-.32],[.6,-.32],[-.6,.32],[.6,.32]].forEach(function(p){deco(new THREE.BoxGeometry(.08,.78,.08),dark,x+p[0],y+.39,z+p[1])});[-1,1].forEach(function(s){deco(new THREE.BoxGeometry(.45,.06,.45),wood,x+s*.95,y+.45,z);deco(new THREE.BoxGeometry(.45,.5,.06),wood,x+s*1.17,y+.75,z)});deco(new THREE.CylinderGeometry(.08,.07,.15,8),lam({color:0xd9cfb8}),x+.2,y+.9,z)}
    else if(k<.6){deco(new THREE.BoxGeometry(1.6,1.8,.4),dark,x,y+.9,z);for(var i=0;i<3;i++)for(var j=0;j<5;j++)deco(new THREE.BoxGeometry(.18,.4,.28),lam({color:[0x9c3a2a,0x2f5a7a,0x3f7a3a,0xc29a1a][(i+j)%4]}),x-.6+j*.3,y+.4+i*.55,z)}
    else if(k<.8){deco(new THREE.BoxGeometry(1,.3,2),dark,x,y+.2,z);deco(new THREE.BoxGeometry(.95,.15,1.8),lam({color:0xc8c0a8}),x,y+.42,z);deco(new THREE.BoxGeometry(.97,.08,1.1),lam({color:0x5a7a9c}),x,y+.52,z+.35)}
    else{[0,1,2].forEach(function(i){deco(new THREE.CylinderGeometry(.32,.32,.8,12),lam({color:0x6b4a2a}),x+i*.7-.7,y+.4,z)})}
  }
  function makeRoom(big,R){
    var i=rooms.length,RX=1700+(i%8)*70,RZ=-1700+Math.floor(i/8)*70,y0=-60,w=big?24:13,d=big?18:10,H=3.8;
    var stone=tmat(stoneTex(),w/2,H/2,0x9a948a),floorM=tmat(stoneTex(),w/3,d/3,0x6f6a62);
    deco(new THREE.BoxGeometry(w,.4,d),floorM,RX,y0-.2,RZ);deco(new THREE.BoxGeometry(w,.4,d),lam({color:0x3a3632}),RX,y0+H+.2,RZ);
    wallAt(RX,y0,RZ-d/2,w+.6,H,.6,stone);wallAt(RX,y0,RZ+d/2,w+.6,H,.6,stone);wallAt(RX-w/2,y0,RZ,.6,H,d,stone);wallAt(RX+w/2,y0,RZ,.6,H,d,stone);
    floors.push({x0:RX-w/2,x1:RX+w/2,z0:RZ-d/2,z1:RZ+d/2,y:y0,under:true});
    // échelle
    var lx=RX,lz=RZ-d/2+.5,lad=lam({color:0x6b4a2a});[-.3,.3].forEach(function(s){deco(new THREE.BoxGeometry(.08,H,.08),lad,lx+s,y0+H/2,lz)});for(var r=0;r<8;r++)deco(new THREE.BoxGeometry(.6,.05,.06),lad,lx,y0+.3+r*.45,lz);
    torch(RX-w/2+.5,y0+2.2,RZ);torch(RX+w/2-.5,y0+2.2,RZ);if(big){torch(RX,y0+2.2,RZ+d/2-.5);for(var p=-1;p<=1;p+=2)for(var q=-1;q<=1;q+=2)wallAt(RX+p*w/4,y0,RZ+q*d/5,1,H,1,stone)}
    furniture(RX+w/2-2,y0,RZ+d/2-1.2,R);furniture(RX-w/2+2,y0,RZ+d/2-1.2,R);
    for(var b=0;b<(big?4:2);b++)deco(new THREE.CylinderGeometry(.35,.35,.9,12),lam({color:0x6b4a2a}),RX-w/2+1+b*.8,y0+.45,RZ-d/2+1.2);
    addChest(RX+(big?-4:2),y0,RZ+1,big,Math.PI);if(big){addChest(RX+4,y0,RZ+1,true,Math.PI);addChest(RX,y0,RZ+d/2-1,false,Math.PI)}else if(R()<.5)addChest(RX-2,y0,RZ+1,false,Math.PI);
    var room={x:RX,z:RZ,w:w,d:d,y:y0,lx:lx,lz:lz+1,guards:big?5:(R()<.6?2:0),spawned:false,big:big};rooms.push(room);return room;
  }
  function trapdoor(x,y,z,room){var g=new THREE.Group(),w=lam({color:0x5a3d22});var b=new THREE.Mesh(new THREE.BoxGeometry(1.2,.06,1.2),w);g.add(b);var ring=new THREE.Mesh(new THREE.TorusGeometry(.09,.02,6,12),lam({color:0x333333}));ring.rotation.x=Math.PI/2;ring.position.set(.35,.05,0);g.add(ring);g.position.set(x,y+.03,z);scene.add(g);traps.push({x:x,z:z,y:y,room:room})}
  var HTX={};
  function timberTex(){if(HTX.t)return HTX.t;HTX.t=canvasTex(256,256,function(g,w,h){g.fillStyle='#ece2cc';g.fillRect(0,0,w,h);for(var i=0;i<900;i++){g.fillStyle='rgba(120,100,70,.06)';g.fillRect(Math.random()*w,Math.random()*h,3,3)}g.fillStyle='#5a3d22';g.fillRect(0,0,w,14);g.fillRect(0,h-14,w,14);g.fillRect(0,0,14,h);g.fillRect(w-14,0,14,h);g.fillRect(w/2-7,0,14,h);g.save();g.translate(0,0);g.lineWidth=12;g.strokeStyle='#5a3d22';g.beginPath();g.moveTo(14,h-14);g.lineTo(w/2-7,14);g.moveTo(w/2+7,14);g.lineTo(w-14,h-14);g.stroke();g.restore()});return HTX.t}
  function shingleTex(col){var k='s'+col;if(HTX[k])return HTX[k];HTX[k]=canvasTex(128,128,function(g,w,h){var c=new THREE.Color(col);for(var y=0;y<h;y+=16)for(var x=-(y/16%2)*12;x<w;x+=24){var v=.85+Math.random()*.25;g.fillStyle='rgb('+(c.r*255*v|0)+','+(c.g*255*v|0)+','+(c.b*255*v|0)+')';g.fillRect(x+1,y+1,22,14);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x+1,y+13,22,3)}});return HTX[k]}
  function logTex(){if(HTX.l)return HTX.l;HTX.l=canvasTex(128,128,function(g,w,h){for(var y=0;y<h;y+=16){var v=Math.random()*25|0;g.fillStyle='rgb('+(120+v)+','+(80+v)+','+(48+v)+')';g.fillRect(0,y,w,16);g.fillStyle='rgba(255,230,190,.18)';g.fillRect(0,y+2,w,3);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,y+14,w,2)}});return HTX.l}
  var windows=[],smokes=[];
  var houseList=[];
  function flatOK(x,z){var mn=1e9,mx=-1e9;for(var i=-2;i<=2;i++)for(var j=-2;j<=2;j++){var h=height(x+i*3.2,z+j*2.8);mn=Math.min(mn,h);mx=Math.max(mx,h)}return mx-mn<1.7}
  function house(x,z,R){
    var log=R()<.35,w=8+(R()*3|0),d=6+(R()*2|0),hs=[],i,j;for(i=-1;i<=1;i++)for(j=-1;j<=1;j++)hs.push(height(x+i*w/2,z+j*d/2));
    var top=Math.max.apply(null,hs)+.45,low=Math.min.apply(null,hs)-.6,H=3.1,t=.3,gap=1.6,seg=(w-gap)/2,rise=d*.38;
    clearArea(x-w/2-1.5,x+w/2+1.5,z-d/2-1.5,z+d/2+3);
    var wallM=log?tmat(logTex(),w/3,H/2):tmat(timberTex(),w/3,1),sideM=log?tmat(logTex(),d/3,H/2):tmat(timberTex(),d/3,1),stoneM=tmat(stoneTex(),w/2,1,0xb0aaa0),woodD=lam({color:0x5a3d22}),roofCol=[0x9c3a2a,0x5a4a3a,0x3a4a5a,0x6a5a3a][R()*4|0];
    // fondation en pierre et plancher
    deco(new THREE.BoxGeometry(w+.3,top-low,d+.3),stoneM,x,(top+low)/2,z);
    deco(new THREE.BoxGeometry(w-.3,.06,d-.3),tmat(woodTex(),w/2,d/2),x,top+.03,z);
    floors.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y:top+.06});
    // murs (porte devant, en +z)
    wallAt(x,top,z-d/2,w,H,t,wallM);wallAt(x-w/2,top,z,t,H,d,sideM);wallAt(x+w/2,top,z,t,H,d,sideM);
    wallAt(x-gap/2-seg/2,top,z+d/2,seg,H,t,wallM);wallAt(x+gap/2+seg/2,top,z+d/2,seg,H,t,wallM);
    deco(new THREE.BoxGeometry(gap,H-2.3,t),wallM,x,top+2.3+(H-2.3)/2,z+d/2);
    // encadrement et porte ouverte
    [-1,1].forEach(function(s){deco(new THREE.BoxGeometry(.16,2.35,.42),woodD,x+s*(gap/2+.02),top+1.17,z+d/2)});deco(new THREE.BoxGeometry(gap+.36,.18,.42),woodD,x,top+2.38,z+d/2);
    var hinge=new THREE.Group();hinge.position.set(x-gap/2+.06,top,z+d/2);scene.add(hinge);var dp=new THREE.Mesh(new THREE.BoxGeometry(gap-.12,2.2,.09),lam({map:plankTex(false)}));dp.position.set((gap-.12)/2,1.12,0);dp.castShadow=true;hinge.add(dp);[.5,1.7].forEach(function(yy){var band=new THREE.Mesh(new THREE.BoxGeometry(gap-.1,.08,.1),lam({color:0x2b2b30}));band.position.set((gap-.12)/2,yy,0);hinge.add(band)});var knb=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),lam({color:0xb08a3a}));knb.position.set(gap-.3,1.1,.08);hinge.add(knb);var knb2=knb.clone();knb2.position.z=-.08;hinge.add(knb2);
    hinge.rotation.y=Math.PI/2;hdoors.push({x:x,z:z+d/2,box:true,hw:gap/2,hd:.22,type:'hdoor',m:hinge,openD:true,open:Math.PI/2,tr:Math.PI/2,id:hdoors.length});
    // plafond en planches (avant : on voyait le dessous noir du toit)
    var ceil=deco(new THREE.BoxGeometry(w-.3,.08,d-.3),tmat(woodTex(),w/2,d/2,0xc8a878),x,top+H-.06,z);ceil.castShadow=false;
    for(var bm=-1;bm<=1;bm++)deco(new THREE.BoxGeometry(.16,.18,d-.3),woodD,x+bm*w/3,top+H-.18,z);
    // poutres d'angle
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(c){deco(new THREE.BoxGeometry(.34,H+.1,.34),woodD,x+c[0]*w/2,top+H/2,z+c[1]*d/2)});
    deco(new THREE.BoxGeometry(w+.4,.22,d+.4),woodD,x,top+H,z);
    // fenêtres : cadre, vitre (s'allume la nuit), croisillons, volets, jardinière
    function win(px,pz,ry){var g=new THREE.Group();g.position.set(px,top+1.65,pz);g.rotation.y=ry;scene.add(g);
      var glass=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshLambertMaterial({color:0x2b3c4a,emissive:0x000000}));glass.position.z=.17;g.add(glass);windows.push(glass);
      [[0,.55,1.2,.12],[0,-.55,1.25,.14],[-.55,0,.12,1.2],[.55,0,.12,1.2],[0,0,1,.06],[0,0,.06,1]].forEach(function(b){var m=new THREE.Mesh(new THREE.BoxGeometry(b[2],b[3],.12),woodD);m.position.set(b[0],b[1],.19);g.add(m)});
      [-1,1].forEach(function(s){var sh=new THREE.Mesh(new THREE.BoxGeometry(.5,1.15,.06),lam({color:0x3f6b4a}));sh.position.set(s*.86,0,.2);g.add(sh)});
      var box=new THREE.Mesh(new THREE.BoxGeometry(1.1,.22,.28),woodD);box.position.set(0,-.72,.3);g.add(box);for(var f=0;f<5;f++){var fl=new THREE.Mesh(new THREE.SphereGeometry(.08,6,5),lam({color:[0xe2361b,0xf3d23a,0xf1ece2,0xb072e0][f%4]}));fl.position.set(-.4+f*.2,-.55,.3);g.add(fl)}}
    win(x-w/4,z-d/2,Math.PI);win(x+w/4,z-d/2,Math.PI);win(x-w/2,z,-Math.PI/2);win(x+w/2,z,Math.PI/2);win(x+w/4+.3,z+d/2,0);
    // toit à deux pans (faîtage selon x), avec débord et pignons
    var slope=Math.atan2(rise,d/2),len=Math.hypot(d/2+.6,rise+.45),sh=tmat(shingleTex(roofCol),w/2,len/1.4);
    [-1,1].forEach(function(s){var p=deco(new THREE.BoxGeometry(w+1.2,.16,len),sh,x,top+H+rise/2+.05,z+s*(d/4+.15));p.rotation.x=s*slope});
    deco(new THREE.BoxGeometry(w+1.3,.22,.3),woodD,x,top+H+rise+.12,z);
    var tri=new THREE.Shape();tri.moveTo(-d/2,0);tri.lineTo(d/2,0);tri.lineTo(0,rise);tri.lineTo(-d/2,0);
    [-1,1].forEach(function(s){var gm=new THREE.Mesh(new THREE.ShapeGeometry(tri),log?tmat(logTex(),1,1):lam({color:0xece2cc,side:THREE.DoubleSide}));gm.material.side=THREE.DoubleSide;gm.rotation.y=Math.PI/2;gm.position.set(x+s*(w/2+.01),top+H,z);gm.castShadow=true;scene.add(gm)});
    // cheminée avec fumée
    var cx=x+w/3,cz=z-d/5;deco(new THREE.BoxGeometry(.8,rise+1.6,.8),tmat(stoneTex(),1,2,0x9a948a),cx,top+H+(rise+1.6)/2,cz);deco(new THREE.BoxGeometry(1,.2,1),lam({color:0x6f6a62}),cx,top+H+rise+1.7,cz);
    for(var k=0;k<4;k++){var sm=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),new THREE.MeshLambertMaterial({color:0xdddddd,transparent:true,opacity:.5,depthWrite:false}));scene.add(sm);smokes.push({m:sm,x:cx,y:top+H+rise+1.9,z:cz,t:k/4})}
    // perron couvert
    var sy=height(x,z+d/2+1.5);deco(new THREE.BoxGeometry(gap+1.4,.22,1.6),stoneM,x,top-.11,z+d/2+.95);floors.push({x0:x-gap/2-.7,x1:x+gap/2+.7,z0:z+d/2,z1:z+d/2+1.75,y:top});
    /* marches jusqu'au sol (avant : un gros bloc de pierre bouchait la porte) */
    var drop=top-height(x,z+d/2+2.2),ns=Math.max(0,Math.ceil(drop/.28));for(var st2=1;st2<=ns&&st2<12;st2++){var sy2=top-st2*drop/ns,sz2=z+d/2+1.75+(st2-.5)*.42;deco(new THREE.BoxGeometry(gap+.9,Math.max(.12,sy2-height(x,sz2)+.3),.42),stoneM,x,sy2-Math.max(.12,sy2-height(x,sz2)+.3)/2,sz2);floors.push({x0:x-gap/2-.45,x1:x+gap/2+.45,z0:sz2-.21,z1:sz2+.21,y:sy2})}
    [-1,1].forEach(function(s){deco(new THREE.CylinderGeometry(.08,.08,2.6,8),woodD,x+s*(gap/2+.55),top+1.3,z+d/2+1.6)});var pr=deco(new THREE.BoxGeometry(gap+1.6,.12,1.9),sh,x,top+2.65,z+d/2+.95);pr.rotation.x=.25;
    // intérieur : tapis, cheminée, lampe
    deco(new THREE.BoxGeometry(2.2,.02,1.5),lam({color:[0x9c3a2a,0x2f5a7a,0x5a7a3a][R()*3|0]}),x,top+.08,z+.2);
    deco(new THREE.BoxGeometry(1.6,1.4,.5),tmat(stoneTex(),1,1,0x9a948a),x+w/3,top+.7,z-d/2+.45);deco(new THREE.BoxGeometry(.9,.6,.1),lam({color:0x141210}),x+w/3,top+.45,z-d/2+.72);
    furniture(x-w/2+1.4,top,z-d/2+1.1,R);if(R()<.75)furniture(x+w/2-1.5,top,z+d/2-1.6,R);
    addChest(x-w/2+1,top,z+d/2-1.1,R()<.15,Math.PI/2);
    if(R()<.45)trapdoor(x-w/4,top+.07,z+.2,makeRoom(false,R));
    houseExtras(x,z,w,d,top,R);houseList.push({x:x,z:z,w:w,d:d,top:top,log:log});
  }
  /* Personnages : joueurs et zombies */
  function humanoid(col,skin,zombie){
    var g=new THREE.Group(),shirt=lam({color:col}),pants=lam({color:zombie?0x3a3a42:0x2f3a52}),sk=lam({color:skin}),shoe=lam({color:0x2b2420}),hairM=lam({color:zombie?0x2a2a22:[0x2b1d12,0x5a3a1a,0x141210,0xc9a26a][(col>>3)%4]});
    var hip=new THREE.Mesh(new THREE.BoxGeometry(.5,.24,.3),pants);hip.position.y=.98;g.add(hip);
    var torso=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.42,4,12),shirt);torso.scale.set(1.15,1,.75);torso.position.y=1.38;torso.castShadow=true;g.add(torso);
    var collar=new THREE.Mesh(new THREE.TorusGeometry(.13,.04,6,14),shirt);collar.rotation.x=Math.PI/2;collar.position.y=1.72;g.add(collar);
    var neck=new THREE.Mesh(new THREE.CylinderGeometry(.08,.09,.12,8),sk);neck.position.y=1.76;g.add(neck);
    var head=new THREE.Mesh(new THREE.SphereGeometry(.2,18,14),sk);head.scale.set(.95,1.08,1);head.position.y=1.98;head.castShadow=true;head.userData.head=true;g.add(head);
    var hair=new THREE.Mesh(new THREE.SphereGeometry(.21,16,10,0,Math.PI*2,0,Math.PI/2.1),hairM);hair.position.set(0,2.02,.02);hair.scale.set(1,1.05,1.05);g.add(hair);
    [-1,1].forEach(function(s){var e=new THREE.Mesh(new THREE.SphereGeometry(.028,8,6),zombie?new THREE.MeshBasicMaterial({color:0xff3a10}):lam({color:0x141210}));e.position.set(s*.075,2.0,-.18);g.add(e);var ear=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),sk);ear.scale.set(.5,1,.8);ear.position.set(s*.2,1.98,0);g.add(ear)});
    var nose=new THREE.Mesh(new THREE.ConeGeometry(.03,.07,6),sk);nose.rotation.x=-Math.PI/2;nose.position.set(0,1.95,-.21);g.add(nose);
    if(!zombie){var bag=new THREE.Mesh(new THREE.BoxGeometry(.38,.45,.18),lam({color:0x6b4a2a}));bag.position.set(0,1.4,.24);bag.castShadow=true;g.add(bag);var flap=new THREE.Mesh(new THREE.BoxGeometry(.4,.14,.2),lam({color:0x5a3d22}));flap.position.set(0,1.58,.25);g.add(flap)}
    else{var tear=new THREE.Mesh(new THREE.BoxGeometry(.2,.14,.02),lam({color:0x5a1a10}));tear.position.set(.1,1.3,-.21);g.add(tear)}
    var legs=[],arms=[];
    [-.13,.13].forEach(function(x){var l=new THREE.Group();l.position.set(x,.95,0);var up=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.38,3,8),pants);up.position.y=-.25;up.castShadow=true;l.add(up);var lo=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.32,3,8),pants);lo.position.y=-.62;l.add(lo);var sh2=new THREE.Mesh(new THREE.BoxGeometry(.16,.1,.28),shoe);sh2.position.set(0,-.88,-.05);l.add(sh2);g.add(l);legs.push(l)});
    [-.36,.36].forEach(function(x){var a=new THREE.Group();a.position.set(x,1.62,0);var up=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.28,3,8),zombie?sk:shirt);up.position.y=-.2;up.castShadow=true;a.add(up);var lo=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.24,3,8),sk);lo.position.y=-.5;a.add(lo);var hd=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),sk);hd.position.y=-.7;a.add(hd);if(zombie)a.rotation.x=-1.4;g.add(a);arms.push(a)});
    g.userData.parts={legs:legs,arms:arms,swing:!zombie};return g;
  }
  /* ---------- Détails : lumières de nuit, clôtures, jardins, château vivant, nature ---------- */
  var glows=[],GLOWT=null,birds=[],flies=null,flags=[];
  function glowTex(){if(GLOWT)return GLOWT;var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,220,150,1)');gr.addColorStop(.3,'rgba(255,170,80,.55)');gr.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);GLOWT=new THREE.CanvasTexture(c);return GLOWT}
  function glow(x,y,z,s){var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));sp.position.set(x,y,z);sp.scale.setScalar(s||2.2);scene.add(sp);glows.push(sp);return sp}
  function lantern(x,y,z){var cage=new THREE.Mesh(new THREE.BoxGeometry(.22,.3,.22),lam({color:0x2b2420}));cage.position.set(x,y,z);scene.add(cage);var lit=new THREE.Mesh(new THREE.BoxGeometry(.16,.22,.16),new THREE.MeshLambertMaterial({color:0xffd27a,emissive:0x000000}));lit.position.set(x,y,z);scene.add(lit);windows.push(lit);glow(x,y,z,2.6)}
  function lampPost(x,z){var y=groundAt(x,z),dk=lam({color:0x2b2420});deco(new THREE.CylinderGeometry(.06,.09,3,8),dk,x,y+1.5,z);deco(new THREE.BoxGeometry(.6,.06,.06),dk,x+.25,y+2.95,z);lantern(x+.5,y+2.7,z)}
  function fenceAround(x0,x1,z0,z1,gateX,gateW){
    var parts=[],y;
    function post(px,pz){y=height(px,pz);var p=new THREE.BoxGeometry(.12,1.1,.12);p.translate(px,y+.5,pz);parts.push(p)}
    function rail(ax,az,bx,bz){var l=Math.hypot(bx-ax,bz-az),ya=height(ax,az),yb=height(bx,bz);[.45,.85].forEach(function(h){var r=new THREE.BoxGeometry(l,.07,.05);r.rotateY(-Math.atan2(bz-az,bx-ax));r.translate((ax+bx)/2,(ya+yb)/2+h,(az+bz)/2);parts.push(r)})}
    var pts=[];for(var px=x0;px<=x1+.01;px+=2)pts.push([px,z1]);
    for(var k=0;k<pts.length-1;k++){var a=pts[k],b=pts[k+1];if(Math.abs((a[0]+b[0])/2-gateX)<gateW/2)continue;post(a[0],a[1]);post(b[0],b[1]);rail(a[0],a[1],b[0],b[1])}
    [[x0,z0,x0,z1],[x1,z0,x1,z1],[x0,z0,x1,z0]].forEach(function(s){var n=Math.max(1,Math.round(Math.hypot(s[2]-s[0],s[3]-s[1])/2));for(var k2=0;k2<n;k2++){var ax=s[0]+(s[2]-s[0])*k2/n,az=s[1]+(s[3]-s[1])*k2/n,bx=s[0]+(s[2]-s[0])*(k2+1)/n,bz=s[1]+(s[3]-s[1])*(k2+1)/n;post(ax,az);post(bx,bz);rail(ax,az,bx,bz)}});
    var m=new THREE.Mesh(merge(parts),lam({color:0x8a6a44}));m.castShadow=true;m.receiveShadow=true;scene.add(m);
  }
  function garden(x,z,R){var y=groundAt(x,z);deco(new THREE.BoxGeometry(3,.12,2),lam({color:0x5a4030}),x,y+.06,z);for(var r=0;r<3;r++)for(var c=0;c<5;c++){var pl=new THREE.Mesh(new THREE.SphereGeometry(.16,6,5),lam({color:[0x4f8a32,0x6fa43a,0x3f7a2a][r]}));pl.scale.y=.7;pl.position.set(x-1.2+c*.6,y+.2,z-.6+r*.6);scene.add(pl);if(r===1&&c%2===0){var fr=new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),lam({color:0xe2361b}));fr.position.set(x-1.2+c*.6,y+.32,z);scene.add(fr)}}}
  function woodpile(x,z){var y=groundAt(x,z),parts=[];for(var r=0;r<3;r++)for(var c=0;c<4-r;c++){var g=new THREE.CylinderGeometry(.13,.13,1.1,8);g.rotateX(Math.PI/2);g.translate(x+(c-(3-r)/2)*.27,y+.13+r*.23,z);parts.push(g)}var m=new THREE.Mesh(merge(parts),lam({color:0x7a5230}));m.castShadow=true;scene.add(m)}
  function hay(x,z){var y=groundAt(x,z);var h=deco(new THREE.CylinderGeometry(.6,.6,1,16),lam({color:0xd4b25a}),x,y+.5,z);h.rotation.z=Math.PI/2}
  function houseExtras(x,z,w,d,top,R){
    fenceAround(x-w/2-3,x+w/2+3,z-d/2-3,z+d/2+4.5,x,2.4);
    lampPost(x+1.8,z+d/2+2.4);lantern(x-1.1,top+2.1,z+d/2+.35);
    if(R()<.7)garden(x-w/2+.5,z+d/2+3,R);if(R()<.8)woodpile(x+w/2+1.5,z-d/4);if(R()<.4)hay(x-w/2-1.6,z-d/2+1);
  }
  function banner(x,y,z,ry,col){var g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;scene.add(g);var c=document.createElement('canvas');c.width=64;c.height=128;var ctx=c.getContext('2d');ctx.fillStyle=col;ctx.fillRect(0,0,64,128);ctx.fillStyle='#d4a32a';ctx.fillRect(0,0,64,8);ctx.beginPath();ctx.moveTo(32,30);ctx.lineTo(48,52);ctx.lineTo(32,92);ctx.lineTo(16,52);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(0,0,0,.2)';ctx.fillRect(28,0,8,128);
    var geo=new THREE.PlaneGeometry(1.4,3.2,1,8);geo.translate(0,-1.6,0);var cl=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));g.add(cl);var rod=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.7,6),lam({color:0x2b2420}));rod.rotation.z=Math.PI/2;g.add(rod);flags.push({m:cl,base:geo.attributes.position.array.slice(),ph:Math.random()*6});return g}
  function stall(x,z,ry,col){var g=new THREE.Group(),y=groundAt(x,z);g.position.set(x,y,z);g.rotation.y=ry;scene.add(g);var wd=lam({color:0x7a5230});[[-1.2,-.8],[1.2,-.8],[-1.2,.8],[1.2,.8]].forEach(function(p){var po=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,2.4,6),wd);po.position.set(p[0],1.2,p[1]);g.add(po)});var tb=new THREE.Mesh(new THREE.BoxGeometry(2.4,.1,1),wd);tb.position.set(0,.9,.3);g.add(tb);
    var c=document.createElement('canvas');c.width=128;c.height=32;var ctx=c.getContext('2d');for(var i=0;i<8;i++){ctx.fillStyle=i%2?'#f1ece2':col;ctx.fillRect(i*16,0,16,32)}var roof=new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.1),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));roof.rotation.x=-Math.PI/2+.35;roof.position.set(0,2.45,0);g.add(roof);
    for(var k=0;k<6;k++){var it=new THREE.Mesh(k%2?new THREE.SphereGeometry(.12,8,6):new THREE.BoxGeometry(.2,.2,.2),lam({color:[0xe2361b,0xd4a32a,0x3f8f3a,0x8a5a33][k%4]}));it.position.set(-.9+k*.36,1.05,.3);g.add(it)}
    g.traverse(function(o){if(o.isMesh)o.castShadow=true})}
  function castleExtras(cx,cz,S,top,H,gate,kx,kz,kw,kd,kh){
    var st=tmat(stoneTex(),3,3,0x7a756c),wood=lam({map:plankTex(false)}),iron=lam({color:0x2b2b30});
    // pavés de la cour
    var pav=new THREE.Mesh(new THREE.PlaneGeometry(S-2,S-2),tmat(stoneTex(),S/2,S/2,0xa09a90));pav.rotation.x=-Math.PI/2;pav.position.set(cx,top+.02,cz);pav.receiveShadow=true;scene.add(pav);
    // portes ouvertes et herse relevée
    [-1,1].forEach(function(s){var dr=deco(new THREE.BoxGeometry(gate/2,5,.25),wood,cx+s*(gate/2+.3),top+2.5,cz+S/2-1.6);dr.rotation.y=s*1.2;for(var b=0;b<3;b++){var bd=new THREE.Mesh(new THREE.BoxGeometry(gate/2+.02,.15,.28),iron);bd.position.y=-1.8+b*1.6;dr.add(bd)}});
    for(var p=0;p<6;p++){deco(new THREE.BoxGeometry(.1,1.4,.1),iron,cx-gate/2+.4+p*(gate-.8)/5,top+H-.4,cz+S/2)}deco(new THREE.BoxGeometry(gate,.12,.12),iron,cx,top+H-1.05,cz+S/2);
    // bannières sur les remparts et le donjon
    [-1,1].forEach(function(s){banner(cx+s*(gate/2+2),top+H-.3,cz+S/2+.85,0,'#9c1a14')});banner(kx,top+kh-.4,kz+kd/2+.55,0,'#1a3a7a');
    [-1,1].forEach(function(s){banner(cx+s*(S/2+.85),top+H-.3,cz,s*Math.PI/2,'#9c1a14')});
    // torches sur les murs (s'allument la nuit)
    [[-gate/2-1,S/2+.9],[gate/2+1,S/2+.9],[-S/2+1,0],[S/2-1,0],[0,-S/2+1]].forEach(function(t){lantern(cx+t[0],top+3.2,cz+t[1])});
    // chemin de ronde visible : escaliers en bois vers les remparts
    for(var k=0;k<8;k++){deco(new THREE.BoxGeometry(2,.2,.8),wood,cx+S/2-2,top+.4+k*.8,cz+S/2-6-k*.8)}
    // marché dans la cour
    stall(cx-8,cz+2,0,'#e2361b');stall(cx-3,cz+4,0,'#2f6fb5');stall(cx+3,cz+3,.2,'#3f8f3a');
    // charrette, tonneaux, foin
    var cart=new THREE.Group();cart.position.set(cx+10,top,cz+10);scene.add(cart);var bed=new THREE.Mesh(new THREE.BoxGeometry(2.2,.5,1.3),wood);bed.position.y=.9;cart.add(bed);[-1,1].forEach(function(s){var wh=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.12,14),lam({color:0x5a3d22}));wh.rotation.x=Math.PI/2;wh.position.set(0,.55,s*.72);cart.add(wh)});var hl=new THREE.Mesh(new THREE.BoxGeometry(1.6,.08,.08),wood);hl.position.set(1.8,.8,0);cart.add(hl);
    for(var bb=0;bb<5;bb++)deco(new THREE.CylinderGeometry(.35,.32,.85,12),lam({color:0x6b4a2a}),cx+12-bb*.8,top+.42,cz-8+(bb%2)*.8);
    // fenêtres éclairées sur le donjon
    [-4,0,4].forEach(function(o){var wl=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.4),new THREE.MeshLambertMaterial({color:0x2b3c4a,emissive:0}));wl.position.set(kx+o,top+5.5,kz+kd/2+.52);scene.add(wl);windows.push(wl)});
    // meurtrières des tours
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(c){for(var a=0;a<4;a++){var an=a*Math.PI/2+Math.PI/4,tx=cx+c[0]*S/2+Math.cos(an)*3.32,tz=cz+c[1]*S/2+Math.sin(an)*3.32;var sl=new THREE.Mesh(new THREE.BoxGeometry(.18,1.1,.05),lam({color:0x141210}));sl.position.set(tx,top+H+1,tz);sl.rotation.y=-an+Math.PI/2;scene.add(sl)}});
  }
  function natureExtras(R){
    var m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s3=new THREE.Vector3(),p3=new THREE.Vector3(),logs=[],stumps=[],mush=[];
    for(var i=0;i<700;i++){var x=(R()-.5)*SIZE*.9,z=(R()-.5)*SIZE*.9,h=height(x,z);if(h<1.5||h>22||onFloor(x,z))continue;var f=fbm(x/45,z/45,SEED+20);if(f<.45)continue;var r=R();if(r<.18)logs.push([x,h,z,R()*6,.7+R()*.6]);else if(r<.4)stumps.push([x,h,z,R()*6,.7+R()*.5]);else mush.push([x,h,z,R()*6,.6+R()*.8])}
    function inst(geo,mat,list,fn){var im=new THREE.InstancedMesh(geo,mat,list.length);im.castShadow=true;im.receiveShadow=true;list.forEach(function(o,k){fn(o);im.setMatrixAt(k,m4)});scene.add(im);return im}
    var lg=new THREE.CylinderGeometry(.28,.32,4,10);lg.rotateZ(Math.PI/2);
    inst(lg,lam({color:0x6b4a2a}),logs,function(o){q.setFromAxisAngle(new THREE.Vector3(0,1,0),o[3]);s3.setScalar(o[4]);p3.set(o[0],o[1]+.25*o[4],o[2]);m4.compose(p3,q,s3)});
    var moss=new THREE.CylinderGeometry(.3,.34,1.2,10);moss.rotateZ(Math.PI/2);moss.translate(.6,.1,0);inst(moss,lam({color:0x4f7a2c}),logs,function(o){q.setFromAxisAngle(new THREE.Vector3(0,1,0),o[3]);s3.setScalar(o[4]*1.02);p3.set(o[0],o[1]+.25*o[4],o[2]);m4.compose(p3,q,s3)});
    var sg=new THREE.CylinderGeometry(.38,.5,.6,10);sg.translate(0,.3,0);inst(sg,lam({color:0x6b4a2a}),stumps,function(o){q.setFromAxisAngle(new THREE.Vector3(0,1,0),o[3]);s3.setScalar(o[4]);p3.set(o[0],o[1]-.05,o[2]);m4.compose(p3,q,s3)});
    var top=new THREE.CylinderGeometry(.36,.36,.02,10);top.translate(0,.61,0);inst(top,lam({color:0xd2a868}),stumps,function(o){q.setFromAxisAngle(new THREE.Vector3(0,1,0),o[3]);s3.setScalar(o[4]);p3.set(o[0],o[1]-.05,o[2]);m4.compose(p3,q,s3)});
    var stem=new THREE.CylinderGeometry(.04,.05,.22,6);stem.translate(0,.11,0);inst(stem,lam({color:0xf1ece2}),mush,function(o){q.identity();s3.setScalar(o[4]);p3.set(o[0],o[1],o[2]);m4.compose(p3,q,s3)});
    var cap=new THREE.SphereGeometry(.13,10,6,0,Math.PI*2,0,Math.PI/2);cap.translate(0,.2,0);inst(cap,lam({color:0xc0251a}),mush,function(o){q.identity();s3.setScalar(o[4]);p3.set(o[0],o[1],o[2]);m4.compose(p3,q,s3)});
    // oiseaux
    for(var b=0;b<4;b++){var fl=new THREE.Group();for(var k=0;k<5;k++){var bd=new THREE.Group();var wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.6,0,.2,-.6,0,-.1, 0,0,0,.6,0,.2,.6,0,-.1],3));wg.computeVertexNormals();var wm=new THREE.Mesh(wg,new THREE.MeshBasicMaterial({color:0x2b2a28,side:THREE.DoubleSide}));bd.add(wm);bd.position.set((k%3)*1.5-1.5,Math.random(),-(k>>1)*1.6);fl.add(bd)}
      fl.userData={cx:(R()-.5)*300,cz:(R()-.5)*300,r:30+R()*40,h:35+R()*20,sp:.15+R()*.1,a:R()*6};scene.add(fl);birds.push(fl)}
    // lucioles (autour du joueur, la nuit)
    var fg=new THREE.BufferGeometry(),fp=new Float32Array(120*3);for(var j=0;j<120;j++){fp[j*3]=(Math.random()-.5)*50;fp[j*3+1]=.5+Math.random()*2.5;fp[j*3+2]=(Math.random()-.5)*50}fg.setAttribute('position',new THREE.BufferAttribute(fp,3));
    flies=new THREE.Points(fg,new THREE.PointsMaterial({color:0xd8ff7a,map:glowTex(),size:.22,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(flies);
  }
  function stepDetails(dt){
    var k=Math.max(0,Math.min(1,(-Math.cos((dayT-.5)*Math.PI*2)-.05)*3)),now=performance.now()/1000;
    glows.forEach(function(g){g.material.opacity=k*(.75+Math.sin(now*9+g.position.x)*.08)});
    flags.forEach(function(f){var a=f.m.geometry.attributes.position;for(var i=0;i<a.count;i++){var y=f.base[i*3+1];a.setZ(i,Math.sin(now*3+f.ph-y*1.3)*.18*(-y/3.2))}a.needsUpdate=true});
    birds.forEach(function(b){var u=b.userData;u.a+=u.sp*dt;b.position.set(u.cx+Math.cos(u.a)*u.r,u.h,u.cz+Math.sin(u.a)*u.r);b.rotation.y=-u.a;b.visible=k<.5;b.children.forEach(function(bd,i){bd.children[0].rotation.z=Math.sin(now*9+i)*.5})});
    if(flies){flies.position.set(P.x,P.y,P.z);flies.material.opacity=k*.9;var fa=flies.geometry.attributes.position;for(var j=0;j<fa.count;j++){fa.setY(j,fa.getY(j)+Math.sin(now*2+j)*.006)}fa.needsUpdate=true}
  }
  function castle(cx,cz,R){
    var S=36,T=1.6,H=7,hs=[],i,j;for(i=-2;i<=2;i++)for(j=-2;j<=2;j++)hs.push(height(cx+i*S/4,cz+j*S/4));
    var top=Math.max.apply(null,hs)+.2,low=Math.min.apply(null,hs)-2;
    clearArea(cx-S/2-4,cx+S/2+4,cz-S/2-4,cz+S/2+8);
    var st=tmat(stoneTex(),S/3,(H+top-low)/3,0xb0aaa0),stD=tmat(stoneTex(),3,3,0x8a847a),hh=H+(top-low);
    deco(new THREE.BoxGeometry(S,top-low,S),tmat(stoneTex(),S/3,S/3,0x7a756c),cx,(top+low)/2,cz);
    floors.push({x0:cx-S/2,x1:cx+S/2,z0:cz-S/2,z1:cz+S/2,y:top});
    var gate=5,seg=(S-gate)/2;
    wallAt(cx,low,cz-S/2,S,hh,T,st);wallAt(cx-S/2,low,cz,T,hh,S,st);wallAt(cx+S/2,low,cz,T,hh,S,st);
    wallAt(cx-gate/2-seg/2,low,cz+S/2,seg,hh,T,st);wallAt(cx+gate/2+seg/2,low,cz+S/2,seg,hh,T,st);
    deco(new THREE.BoxGeometry(gate,2,T),st,cx,top+H-1,cz+S/2);
    var gz0=cz+S/2+T/2,gh0=height(cx,gz0+6),nst=Math.max(1,Math.ceil((top-gh0)/.45));if(top>gh0+.3)for(var q2=0;q2<nst;q2++){var yy=top-(q2+1)*(top-gh0)/(nst+1),zz=gz0+q2*1.1+.55;deco(new THREE.BoxGeometry(gate+1,Math.max(.2,yy-gh0+1),1.1),tmat(stoneTex(),2,1,0x9a948a),cx,(yy+gh0-1)/2,zz);floors.push({x0:cx-gate/2-.5,x1:cx+gate/2+.5,z0:zz-.55,z1:zz+.55,y:yy})}
    // créneaux
    for(var k=-S/2;k<=S/2;k+=2){[[k,-S/2],[k,S/2],[-S/2,k],[S/2,k]].forEach(function(p){if(Math.abs(p[1]-S/2)<.01&&Math.abs(p[0])<gate/2)return;deco(new THREE.BoxGeometry(1,1,1),stD,cx+p[0],top+H+.5,cz+p[1])})}
    // tours
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){var tx=cx+p[0]*S/2,tz=cz+p[1]*S/2;var tw=deco(new THREE.CylinderGeometry(3,3.3,hh+4,14),tmat(stoneTex(),6,4,0xa8a298),tx,low+(hh+4)/2,tz);addCol({x:tx,z:tz,r:3.1,type:'tower'});deco(new THREE.ConeGeometry(3.6,4.5,14),lam({color:0x7a2a22}),tx,top+H+4+2.25,tz);
      deco(new THREE.BoxGeometry(.7,1,.1),lam({color:0x141210}),tx-p[0]*0,top+H+1.5,tz+p[1]*-3.05)});
    // drapeau
    deco(new THREE.CylinderGeometry(.06,.06,4,6),lam({color:0x333333}),cx-S/2,top+H+10,cz-S/2);var flag=deco(new THREE.PlaneGeometry(2,1.2),new THREE.MeshLambertMaterial({color:0xe2361b,side:THREE.DoubleSide}),cx-S/2+1,top+H+11.2,cz-S/2);
    // donjon
    var kx=cx,kz=cz-S/2+8,kw=14,kd=10,kh=8,kst=tmat(stoneTex(),kw/3,kh/3,0x9e988e),kgap=2.2,kseg=(kw-kgap)/2;
    wallAt(kx,top,kz-kd/2,kw,kh,1,kst);wallAt(kx-kw/2,top,kz,1,kh,kd,kst);wallAt(kx+kw/2,top,kz,1,kh,kd,kst);
    wallAt(kx-kgap/2-kseg/2,top,kz+kd/2,kseg,kh,1,kst);wallAt(kx+kgap/2+kseg/2,top,kz+kd/2,kseg,kh,1,kst);deco(new THREE.BoxGeometry(kgap,kh-3,1),kst,kx,top+3+(kh-3)/2,kz+kd/2);
    deco(new THREE.BoxGeometry(kw+1,.6,kd+1),stD,kx,top+kh+.3,kz);for(var c2=-kw/2;c2<=kw/2;c2+=2)[-kd/2,kd/2].forEach(function(zz){deco(new THREE.BoxGeometry(.9,.9,.9),stD,kx+c2,top+kh+1,kz+zz)});
    deco(new THREE.BoxGeometry(kw-1,.05,kd-1),tmat(woodTex(),5,4),kx,top+.03,kz);
    torch(kx-kw/2+.8,top+2.6,kz);torch(kx+kw/2-.8,top+2.6,kz);
    addChest(kx-4,top,kz-kd/2+1.4,true,0);addChest(kx+4,top,kz-kd/2+1.4,false,0);furniture(kx,top,kz-1,R);
    // trône
    deco(new THREE.BoxGeometry(1.2,.6,1),lam({color:0x7a2a22}),kx,top+.3,kz-kd/2+1.2);deco(new THREE.BoxGeometry(1.2,2,.3),lam({color:0xd4a32a}),kx,top+1.2,kz-kd/2+.7);
    trapdoor(kx+2.5,top+.05,kz+1.5,makeRoom(true,R));
    // cour : puits et caisses
    deco(new THREE.CylinderGeometry(1.2,1.2,1,14,1,true),tmat(stoneTex(),3,1),cx+8,top+.5,cz+6);addCol({x:cx+8,z:cz+6,r:1.3,type:'well'});
    for(var cr=0;cr<5;cr++)deco(new THREE.BoxGeometry(1,1,1),lam({map:plankTex(false)}),cx-10+cr*1.1,top+.5,cz+10+(cr%2)*1.1);
    addChest(cx-12,top,cz+12,false,0);
    castleExtras(cx,cz,S,top,H,gate,kx,kz,kw,kd,kh);
    castles.push({x:cx,z:cz,S:S,y:top,spawnedDay:-1,flag:flag});
  }
  function buildExplore(seed){
    floors=[];traps=[];rooms=[];castles=[];windows=[];smokes=[];glows=[];birds=[];flags=[];flies=null;
    var R=rng(seed+999),cands=[];
    for(var t=0;t<500;t++){var x=(R()-.5)*SIZE*.7,z=(R()-.5)*SIZE*.7,h=height(x,z);if(h<3||h>16)continue;var mn=1e9,mx=-1e9;for(var i=-2;i<=2;i++)for(var j=-2;j<=2;j++){var hh=height(x+i*9,z+j*9);mn=Math.min(mn,hh);mx=Math.max(mx,hh)}if(mn<1.5)continue;cands.push({x:x,z:z,v:mx-mn})}
    cands.sort(function(a,b){return a.v-b.v});
    var used=[];
    for(var c=0;c<cands.length&&castles.length<2;c++){var p=cands[c];if(used.some(function(u){return Math.hypot(u.x-p.x,u.z-p.z)<180}))continue;castle(p.x,p.z,R);used.push(p)}
    var hn=0;for(var k=0;k<400&&hn<16;k++){var x2=(R()-.5)*SIZE*.78,z2=(R()-.5)*SIZE*.78,h2=height(x2,z2);if(h2<2||h2>15||slope(x2,z2)>.5||!flatOK(x2,z2))continue;if(used.some(function(u){return Math.hypot(u.x-x2,u.z-z2)<(u.S?40:16)}))continue;
      var vill=hn<8&&used.length>2?used[2+(hn%Math.max(1,used.length-2))]:null;house(x2,z2,R);used.push({x:x2,z:z2});hn++}
  }
  /* entrée / sortie des sous-sols */
  function goDown(tr){
    var r=tr.room;P.back={x:tr.x,z:tr.z+1.4};P.x=r.lx;P.z=r.lz;P.y=r.y;P.vy=0;P.under=r;sfx.play('ui');msg(r.big?'Les oubliettes du château':'Un sous-sol');
    if(!r.spawned&&(!online||auth)){r.spawned=true;for(var i=0;i<r.guards;i++){var e=addZombieAt(r.x+(Math.random()-.5)*(r.w-3),r.z+1+Math.random()*(r.d/2-2),i===0&&r.big)}}
  }
  function goUp(){if(!P.back)return;P.x=P.back.x;P.z=P.back.z;P.y=groundAt(P.x,P.z);P.under=null;sfx.play('ui')}
  /* ---------- Interface des coffres ---------- */
  var openBox=null;
  function chestItems(c){
    if(c.items)return c.items;var R=rng(SEED*977+c.id*131+7),it={};function add(k,n){it[k]=(it[k]||0)+n}
    var pool=['conserve','eau','bandage','tissu','tissu','baies','munitions','fleches','cuir','fer'];
    var n=2+(R()*3|0);for(var i=0;i<n;i++){var k=pool[R()*pool.length|0];add(k,k==='munitions'?6+(R()*8|0):k==='fleches'?4+(R()*6|0):1+(R()*2|0))}
    if(R()<.25)add('bois',3+(R()*5|0));
    if(c.rare){add('radio',1);add('munitions',10+(R()*10|0));add(R()<.55?'pistol':'rifle',1);if(R()<.5)add('fer',2)}
    else if(R()<.12)add('pistol',1);
    c.items=it;return it;
  }
  var TOOLNAMES={pistol:'Pistolet',rifle:'Fusil'};
  function itemName(k){return TOOLNAMES[k]||NAMES[k]||k}
  function takeItem(c,k,silent){
    var items=c.base?c.store:chestItems(c),n=items[k];if(!n)return;
    if(k==='pistol'||k==='rifle'){if(inv[k]){inv.munitions+=12;popup('+12 munitions','munitions')}else{inv[k]=1;popup(itemName(k)+' !',k);setTool(k)}}
    else{inv[k]=(inv[k]||0)+n;if(k==='bois')st.bois+=n;if(k==='fer')st.fer+=n;popup('+'+n+' '+itemName(k).toLowerCase(),k)}
    delete items[k];if(!c.base)relayEv({e:'take',id:c.id,k:k});
    if(!silent){sfx.play('pickup');chestPanel(c);hudInv()}
  }
  function putItem(c,k){var n=inv[k];if(!n||!c.base)return;c.store[k]=(c.store[k]||0)+n;inv[k]=0;sfx.play('pickup');chestPanel(c);hudInv()}
  function slotHtml(k,n,attr,i){return '<button type="button" class="iv-slot use" '+attr+'="'+k+'" style="animation-delay:'+(i*25)+'ms"><img src="'+icon(k)+'" alt=""><b>'+n+'</b><small>'+esc(itemName(k))+'</small></button>'}
  function chestPanel(c){
    openBox=c;var el=$('sv-chest'),items=c.base?(c.store=c.store||{}):chestItems(c),ks=Object.keys(items).filter(function(k){return items[k]>0});
    var h='<div class="iv-head"><b>'+(c.base?'Coffre de base':c.rare?'Coffre doré':'Coffre')+'</b><span>Clic sur un objet pour le prendre'+(c.base?' · clic dans ton sac pour le ranger':'')+'</span></div><div class="ch-grid">';
    for(var i=0;i<12;i++){var k=ks[i];h+=k?slotHtml(k,items[k],'data-take',i):'<span class="iv-slot empty" style="animation-delay:'+(i*25)+'ms"></span>'}
    h+='</div><div class="row" style="margin-top:10px"><button type="button" class="ink" id="ch-all"'+(ks.length?'':' disabled')+'>Tout prendre</button><button type="button" class="ghost" id="ch-close">Fermer (E)</button></div>';
    if(c.base){var mine=['bois','pierre','fer','tissu','cuir','baies','viande','cuite','conserve','eau','bandage','munitions','fleches'].filter(function(k){return inv[k]>0});h+='<p class="iv-l" style="margin-top:12px">Ton sac</p><div class="ch-grid small">'+mine.map(function(k,i){return slotHtml(k,inv[k],'data-put',i)}).join('')+'</div>'}
    if(!ks.length&&!c.base)h+='<p class="iv-desc">Ce coffre est vide.</p>';
    el.innerHTML=h;el.hidden=false;unlock();
    $('ch-all').onclick=function(){Object.keys(items).forEach(function(k){takeItem(c,k,true)});sfx.play('win');chestPanel(c);hudInv()};
    $('ch-close').onclick=closeChest;
  }
  function closeChest(){openBox=null;$('sv-chest').hidden=true;lock()}
  $('sv-chest').addEventListener('click',function(e){var t=e.target.closest('[data-take]');if(t&&openBox){takeItem(openBox,t.dataset.take);return}var p=e.target.closest('[data-put]');if(p&&openBox)putItem(openBox,p.dataset.put)});
  /* ---------- Récolte, coffres, combat ---------- */
  var ZERO=null;
  function fell(o,type,silent){
    if(!ZERO)ZERO=new THREE.Matrix4().makeScale(0,0,0);
    o.hp=0;
    if(type==='tree'){if(!silent)fallTree(o);o.ms.forEach(function(im){im.setMatrixAt(o.i,ZERO);im.instanceMatrix.needsUpdate=true})}
    else{var im=type==='rock'?rocks:ores;im.setMatrixAt(o.i,ZERO);im.instanceMatrix.needsUpdate=true}
    near(o.x,o.z,2).forEach(function(c){if(c.ref===o)remCol(c)});
    if(silent)return;
    relayEv({e:'fell',ty:type,i:type==='tree'?trees.list.indexOf(o):o.i});
    var gy=height(o.x,o.z)+.6;
    if(type==='rock'){burst(o.x,gy,o.z,0x8c8a84,30,7);burst(o.x,gy,o.z,0x6f6c66,12,5);for(var k=0;k<2;k++)dropItem(o.x+(Math.random()-.5)*1.5,o.z+(Math.random()-.5)*1.5,'pierre',2,true);sfx.play('kill');shakeT=.15}
    if(type==='ore'){burst(o.x,gy,o.z,0x8a5a3c,24,7);burst(o.x,gy+.3,o.z,0xffb060,12,6);for(var k2=0;k2<2;k2++)dropItem(o.x+(Math.random()-.5)*1.5,o.z+(Math.random()-.5)*1.5,'fer',2,true);sfx.play('kill');shakeT=.15}
  }
  function isInFront(x,z,lim){var dx=x-P.x,dz=z-P.z,l=Math.hypot(dx,dz)||1;return (-Math.sin(P.yaw)*dx-Math.cos(P.yaw)*dz)/l>(lim||.5)}
  function interactTarget(){
    var best=null,bd=3.3;
    function cand(o,d,kind){if(d<bd){bd=d;best={o:o,k:kind}}}
    if(P.boat)return {o:P.boat,k:'unboat'};
    boats.forEach(function(b){var d=Math.hypot(b.x-P.x,b.z-P.z);if(d<3.6)cand(b,d-.6,'boat')});
    hdoors.forEach(function(h){var d=Math.hypot(h.x-P.x,h.z-P.z);if(d<2.6)cand(h,d-.3,'hdoor')});
    chests.forEach(function(c){if(!c.open||Object.keys(chestItems(c)).length){var d=Math.hypot(c.x-P.x,c.z-P.z);if(d<3.3&&isInFront(c.x,c.z,.3))cand(c,d,'chest')}});
    traps.forEach(function(t){var d=Math.hypot(t.x-P.x,t.z-P.z);if(d<1.7&&!P.under)cand(t,d-.5,'trap')});
    if(P.under){var lr=P.under,ld=Math.hypot(lr.lx-P.x,lr.lz-1-P.z);if(ld<2.2)cand(lr,ld-.5,'ladder')}
    bushes.forEach(function(b){if(b.full){var d=Math.hypot(b.x-P.x,b.z-P.z);if(d<3&&isInFront(b.x,b.z))cand(b,d,'bush')}});
    drops.forEach(function(dr){if(dr.auto)return;var d=Math.hypot(dr.x-P.x,dr.z-P.z);if(d<2.6)cand(dr,d-.5,'drop')});
    structs.forEach(function(s){if(s.dead)return;var d=Math.hypot(s.x-P.x,s.z-P.z);if(d<3.2&&isInFront(s.x,s.z,.3)&&['fire','bed','box','door','bench','forge'].indexOf(s.type)>=0)cand(s,d,s.type)});
    if(!best){var fx=P.x-Math.sin(P.yaw)*2.5,fz=P.z-Math.cos(P.yaw)*2.5;if(height(fx,fz)<-.1||height(P.x,P.z)<.3)best={k:'water'}}
    return best;
  }
  function prompt(){
    var t=interactTarget(),s='';
    if(buildMode)s='Clic : poser · R : tourner · B ou clic droit : annuler';
    else if(t){s={boat:'E : monter dans la barque',unboat:'E : descendre de la barque',hdoor:(t.o&&t.o.openD?'E : fermer la porte':'E : ouvrir la porte'),trap:'E : descendre au sous-sol',ladder:'E : remonter',chest:(t.o&&t.o.open?'E : fouiller le coffre':'E : ouvrir le coffre'),bush:'E : cueillir des baies',drop:'E : ramasser',water:'E : boire',fire:'E : cuire la viande'+(inv.viande?' ('+inv.viande+')':''),bed:'E : dormir'+(isNight()?' jusqu\'au matin':' (la nuit seulement)'),box:'E : ouvrir le coffre de base',door:'E : ouvrir / fermer',bench:'C : fabriquer à l\'établi',forge:'C : fabriquer à la forge'}[t.k]}
    var el=$('sv-prompt');el.textContent=s;el.style.display=s?'block':'none';
  }
  function interact(){
    var t=interactTarget();if(!t)return;
    if(t.k==='boat'){boardBoat(t.o);return}if(t.k==='unboat'){leaveBoat();return}if(t.k==='hdoor')toggleHDoor(t.o);
    if(t.k==='chest')openChest(t.o);
    if(t.k==='trap')goDown(t.o);
    if(t.k==='ladder')goUp();
    if(t.k==='bush'){relayEv({e:'bush',i:bushes.indexOf(t.o)});t.o.full=false;t.o.t=DAY*.8;t.o.b.visible=false;inv.baies+=3;msg('+3 baies');sfx.play('eat')}
    if(t.k==='drop'){collect(t.o);drops=drops.filter(function(x){return !x.gone})}
    if(t.k==='water'){P.water=Math.min(100,P.water+35);msg('Tu bois');sfx.play('ui')}
    if(t.k==='fire'){if(inv.viande>0){inv.cuite+=inv.viande;msg(inv.viande+' viande cuite');inv.viande=0;sfx.play('pickup')}else msg('Pas de viande crue')}
    if(t.k==='bed'&&online&&!auth){P.spawn={x:t.o.x,z:t.o.z+1.6};msg('Point de réapparition enregistré. Seul l\'hôte peut faire passer la nuit.')}else if(t.k==='bed'){P.spawn={x:t.o.x,z:t.o.z+1.6};if(isNight()){if(zombies.some(function(z){return z.alive&&Math.hypot(z.x-P.x,z.z-P.z)<25}))msg('Impossible : des zombies sont tout près');else{dayT=.26;newDay();zombies.forEach(function(z){z.alive=false;scene.remove(z.m)});zombies=[];P.food=Math.max(0,P.food-15);P.water=Math.max(0,P.water-15);msg('Tu dors jusqu\'au matin');sfx.play('win');save()}}else msg('Tu ne peux dormir que la nuit')}
    if(t.k==='box'){t.o.base=true;chestPanel(t.o)}
    if(t.k==='door')toggleDoor(t.o);
    if(t.k==='bench'||t.k==='forge')craftMenu();
    hudInv();
  }
  function lootTxt(it){return Object.keys(it).map(function(k){return '+'+it[k]+' '+({pistol:'pistolet',rifle:'fusil'}[k]||(NAMES[k]||k).toLowerCase())}).join(', ')}
  function openChest(c){
    if(!c.open){c.open=true;c.anim=0;if(c.m.userData.spark)c.m.userData.spark.visible=false;burst(c.x,groundAt(c.x,c.z)+.9,c.z,c.rare?0xffd060:0xc9a26a,c.rare?22:10,4);sfx.play('win');relayEv({e:'chest',id:c.id})}
    chestPanel(c);
  }
  function dropAt(x,z,items){var m=new THREE.Group(),b=new THREE.Mesh(new THREE.SphereGeometry(.38,12,10),lam({color:0x6b5a3c}));b.scale.y=.8;m.add(b);var t=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,.25,8),lam({color:0x5a4a30}));t.position.y=.35;m.add(t);m.traverse(function(o){if(o.isMesh)o.castShadow=true});m.position.set(x,groundAt(x,z)+.3,z);scene.add(m);drops.push({x:x,z:z,m:m,items:items,auto:false,spin:0,t:0})}
  /* coup de hache : on arme, on frappe, et l'impact arrive au moment où la lame touche */
  var impactT=0,hitStop=0,_pv=null,_pq=null,_pe=null;
  function attack(){
    if(cd>0||buildMode)return;var T=TOOLS[tool];
    if(T.melee){cd=T.rate;swing=1;impactT=.16;sfx.play('ui');return}
    attackHit();
  }
  function attackHit(){
    var T=TOOLS[tool];
    if(T.ammo){if(inv[T.ammo]<=0){msg(tool==='bow'?'Plus de flèches':'Plus de munitions');sfx.play('tick');cd=.4;return}inv[T.ammo]--;sfx.play(tool==='bow'?'ui':'shoot');flash=tool==='bow'?0:1}
    if(!T.melee){cd=T.rate;swing=1}
    var dir=new THREE.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch)),org=new THREE.Vector3(P.x,P.y+EYE,P.z);
    ray.set(org,dir);ray.far=T.ammo?160:T.range;
    var tg=[];zombies.forEach(function(z){if(z.alive)tg.push(z.m)});animals.forEach(function(a){if(a.alive)tg.push(a.m)});
    var hs=ray.intersectObjects(tg,true),ht=ray.intersectObjects(terrains,false),tdist=ht.length?ht[0].distance:1e9;
    if(T.ammo){gunKick=1;if(gunL){gunL.position.set(P.x-Math.sin(P.yaw)*.8,P.y+EYE,P.z-Math.cos(P.yaw)*.8);gunL.intensity=tool==='bow'?0:3}var endP=hs.length&&hs[0].distance<tdist?hs[0].point:ht.length?ht[0].point:org.clone().addScaledVector(dir,120);var mz=org.clone().addScaledVector(dir,.7);mz.x+=Math.cos(P.yaw)*.18;mz.z-=Math.sin(P.yaw)*.18;mz.y-=.15;if(tool!=='bow')tracer(mz,endP);if(ht.length&&!(hs.length&&hs[0].distance<tdist))burst(ht[0].point.x,ht[0].point.y+.1,ht[0].point.z,0x9a8a70,5,3)}
    var dmg=T.dmg*(tool==='axe'&&inv.iaxe?1.4:1);
    if(hs.length&&hs[0].distance<tdist){var o=hs[0].object,head=!!o.userData.head;while(o&&!o.userData.ent)o=o.parent;if(o&&online&&!auth){var ge=o.userData.ent;flashEnt(ge,hs[0].point);sfx.play('hit');net.send({t:'sv-hit',id:ge.id,d:dmg*(head?1.8:1)});o=null}if(o){var e=o.userData.ent;e.hp-=dmg*(head?1.8:1);e.hurt=.15;flashEnt(e,hs[0].point);if(e.kind==='deer')e.flee=6;if(e.kind==='wolf')e.angry=20;sfx.play('hit');if(e.hp<=0){e.alive=false;e.dieT=1;sfx.play('kill');killDrops(e.kind,e.x,e.z)}}}
    else if(T.melee){
      var l=near(P.x,P.z,4),best=null,bd=T.range;
      l.forEach(function(c){if(c.dead||(c.type!=='tree'&&c.type!=='rock'&&c.type!=='ore'))return;var d=Math.hypot(c.x-P.x,c.z-P.z)-c.r;if(d<bd&&isInFront(c.x,c.z,.4)){bd=d;best=c}});
      if(best){var o2=best.ref;
        if(best.type==='tree'){if(tool!=='axe'&&tool!=='sword'){msg('Prends la hache (1) pour couper');return}o2.hp-=inv.iaxe?2:1;sfx.play('hit');shakeT=.13;hitStop=.07;var cdx=o2.x-P.x,cdz=o2.z-P.z,cl=Math.hypot(cdx,cdz)||1;burst(o2.x-cdx/cl*.4,P.y+1.2,o2.z-cdz/cl*.4,0xc9a26a,7,4);if(o2.hp<=0)fell(o2,'tree');else{shakeTree(o2,{x:cdx/cl,z:cdz/cl});inv.bois+=1;st.bois+=1;popup('+1 bois','bois')}}
        else if(best.type==='rock'){var pw=tool==='pick'?2:1;o2.hp-=pw;sfx.play('hit');shakeT=.12;hitStop=.07;burst(o2.x,height(o2.x,o2.z)+o2.s*.6,o2.z,0x9a968e,8,4);if(o2.hp<=0)fell(o2,'rock');else{inv.pierre+=1;popup('+1 pierre','pierre')}}
        else{if(tool!=='pick'){msg('Il faut une pioche pour miner le fer');sfx.play('tick');return}o2.hp--;sfx.play('hit');shakeT=.12;hitStop=.07;burst(o2.x,height(o2.x,o2.z)+o2.s*.7,o2.z,0xffb060,8,5);if(o2.hp<=0)fell(o2,'ore');else{inv.fer+=1;st.fer+=1;popup('+1 fer','fer')}}}
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
    if(P.dying)return;P.dying=true;setTimeout(function(){P.dying=false},500);
    if(P.boat){P.boat.v=0;P.boat=null}P.under=null;P.swim=false;P.vy=0;
    sfx.play('lose');var best=PP.store('sv-best');if(day>best){PP.store('sv-best',day);PP.refreshHi()}
    if(P.spawn){var lost={};['bois','pierre','fer','baies','viande','cuite','conserve','cuir'].forEach(function(k){var n=Math.floor((inv[k]||0)/2);if(n){lost[k]=n;inv[k]-=n}});dropAt(P.x,P.z,lost);P.x=P.spawn.x;P.z=P.spawn.z;P.y=groundAt(P.x,P.z);P.hp=60;P.food=Math.max(P.food,40);P.water=Math.max(P.water,40);msg('Tu te réveilles dans ton lit. Ton sac est resté là où tu es tombé.');save();return}
    if(online){var lost2={};['bois','pierre','fer','baies','viande','cuite','conserve','cuir'].forEach(function(k){var n=Math.floor((inv[k]||0)/2);if(n){lost2[k]=n;inv[k]-=n}});dropAt(P.x,P.z,lost2);var rs=Object.keys(remotes).map(function(k){return remotes[k]}).filter(function(r){return r.hp>0})[0],sp=rs?{x:rs.x+2,z:rs.z+2}:findSpawn();P.x=sp.x;P.z=sp.z;P.y=groundAt(P.x,P.z);P.hp=60;P.food=Math.max(P.food,40);P.water=Math.max(P.water,40);msg('Tu réapparais près de tes potes. Ton sac est resté là où tu es tombé.');return}
    running=false;cancelAnimationFrame(raf);unlock();exitFull();try{localStorage.removeItem(PP.key('survie2'))}catch(e){}
    $('sv-title').textContent='Tu es mort';$('sv-msg').textContent='Tu as survécu '+day+' jour'+(day>1?'s':'')+' et rempli '+goalI+' objectif'+(goalI>1?'s':'')+' sur '+GOALS.length+'. Construis un lit pour réapparaître la prochaine fois.';$('sv-start').textContent='Nouvelle île';$('sv-cont').hidden=true;$('sv-ov').hidden=false;
  }
  function msg(t){var m=$('sv-msg2');m.textContent=t;m.style.opacity=1;msgT=3.2}

  /* ---------- Artisanat ---------- */
  function nearStruct(t){return structs.some(function(s){return !s.dead&&s.type===t&&Math.hypot(s.x-P.x,s.z-P.z)<5})}
  function craftMenu(){
    var el=$('sv-craft');if(!el.hidden){el.hidden=true;lock();return}
    $('sv-build').hidden=true;$('sv-invp').hidden=true;buildMode=null;
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
    won=true;PP.stat('surv','win');running=false;cancelAnimationFrame(raf);unlock();exitFull();sfx.play('win');
    var best=PP.store('sv-best');if(day>best)PP.store('sv-best',day);try{localStorage.removeItem(PP.key('survie2'))}catch(e){}
    $('sv-title').textContent='Sauvé !';$('sv-msg').textContent='L\'hélicoptère t\'a trouvé après '+day+' jours sur l\'île. '+st.kills+' créatures abattues. Bravo.';$('sv-start').textContent='Nouvelle île';$('sv-cont').hidden=true;$('sv-ov').hidden=false;
  }
  var cDay=new THREE.Color(0x3d7cc9),cDayH=new THREE.Color(0xbfdcf0),cDusk=new THREE.Color(0x5a4a7a),cDuskH=new THREE.Color(0xf0a060),cNight=new THREE.Color(0x050914),cNightH=new THREE.Color(0x101a30),cBlood=new THREE.Color(0x3a0a0a),cBloodH=new THREE.Color(0x6a1a12),tA=new THREE.Color(),tB=new THREE.Color(),sv=new THREE.Vector3();
  function lightCycle(dt){
    var s=Math.cos((dayT-.5)*Math.PI*2),k=Math.max(0,Math.min(1,(s+.25)/.6)),dusk=Math.max(0,1-Math.abs(s+.05)*3.2),blood=bloodNight()&&isNight();
    tA.copy(blood?cBlood:cNight).lerp(cDay,k);tB.copy(blood?cBloodH:cNightH).lerp(cDayH,k);tA.lerp(cDusk,dusk*.6);tB.lerp(cDuskH,dusk*.75);
    skyMat.uniforms.top.value.copy(tA);skyMat.uniforms.hor.value.copy(tB);scene.fog.color.copy(tB);scene.background.copy(tB);scene.fog.far=180+520*k;scene.fog.near=k>.3?80:20;
    var ang=(dayT-.25)*Math.PI*2;sv.set(Math.cos(ang),Math.sin(ang),.35).normalize();skyMat.uniforms.sunDir.value.copy(sv);skyMat.uniforms.sunCol.value.setRGB(1,.85+.15*k,.7+.3*k);
    var lightDir=k>0.02?sv:sv.clone().negate();
    sun.position.set(P.x+lightDir.x*160,Math.max(20,lightDir.y*160),P.z+lightDir.z*160);sun.target.position.set(P.x,P.y,P.z);
    sun.intensity=k>0.02?.15+1.6*k:.25;sun.color.setRGB(1,.82+.18*k-dusk*.15,.65+.35*k-dusk*.2);if(k<=0.02)sun.color.setHex(blood?0xff5a4a:0x8aa6ff);
    amb.intensity=.22+.7*k;amb.color.setRGB(.6+.4*k,.65+.35*k,.85+.15*k);
    skyMesh.position.copy(cam.position);stars.position.copy(cam.position);stars.material.opacity=Math.max(0,1-k*2.5)*(blood?.5:1);
    sunDisk.position.copy(cam.position).addScaledVector(sv,1350);sunDisk.lookAt(cam.position);sunDisk.visible=sv.y>-.05;
    moonDisk.position.copy(cam.position).addScaledVector(sv,-1350);moonDisk.lookAt(cam.position);moonDisk.visible=sv.y<.05;moonDisk.material.color.setHex(blood?0xff5040:0xdfe6f2);
    clouds.forEach(function(c){c.position.x+=c.userData.v*dt;if(c.position.x>P.x+500)c.position.x-=1000;c.children[0].material.color.setRGB(.35+.65*k,.35+.62*k-dusk*.1,.4+.6*k-dusk*.25)});
    waterStep(dt,k);R3.toneMappingExposure=.85+.25*k;
  }

  /* ---------- Boucle ---------- */
  function step(dt){
    var now=performance.now();
    dayT+=dt/DAY;if(dayT>=1){dayT-=1;if(!online||auth){newDay();if(won)return}}
    lightCycle(dt);
    var sprint=keys.SH&&P.stam>5&&(keys.F||keys.B||keys.L||keys.R),sp=(sprint?8.5:4.8)*dt;
    if(sprint)P.stam=Math.max(0,P.stam-dt*18);else P.stam=Math.min(100,P.stam+dt*12);
    var fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),mx=0,mz=0;if(keys.F){mx+=fx;mz+=fz}if(keys.B){mx-=fx;mz-=fz}if(keys.L){mx+=fz;mz-=fx}if(keys.R){mx-=fz;mz+=fx}
    var hHere=height(P.x,P.z),flr=onFloor(P.x,P.z);
    if(P.boat){boatStep(dt)}
    else{
      P.swim=!flr&&hHere<-1.05;
      var ml=Math.hypot(mx,mz);if(ml){if(!flr&&hHere<.2)sp*=P.swim?.5:.6;moveCirc(P,mx/ml*sp,mz/ml*sp,.4,'p');P.bob+=dt*(P.swim?3:sprint?12:8)}P.spd=(P.spd||0)+(((ml&&!P.swim)?(sprint?1:.75):0)-(P.spd||0))*Math.min(1,dt*7);
      if(P.swim){P.y+=(-1.45+Math.sin(now/500)*.06-P.y)*Math.min(1,dt*4);P.vy=0;if(ml){P.stam=Math.max(0,P.stam-dt*7)}if(P.stam<=0){P.hp-=dt*5;if(Math.random()<dt)msg('Tu te noies : regagne la terre ou une barque !');if(P.hp<=0)return die()}}
      else{var gh=flr?groundAt(P.x,P.z):Math.max(hHere,-.9);if(keys.J&&P.y<=gh+.05){P.vy=5.5;keys.J=false}
        P.vy-=15*dt;P.y+=P.vy*dt;if(P.y<gh){P.y=gh;P.vy=0}}
    }
    $('sv-water').classList.toggle('on',!!P.swim);stepBoats(dt,now);
    tracers.forEach(function(t){t.t-=dt;t.l.material.opacity=Math.max(0,t.t/.08)});tracers=tracers.filter(function(t){if(t.t<=0){scene.remove(t.l);return false}return true});
    gunKick=Math.max(0,gunKick-dt*6);if(gunL)gunL.intensity*=.6;
    hdoors.forEach(function(h){h.m.rotation.y+=(h.tr-h.m.rotation.y)*Math.min(1,dt*8)});
    cd-=dt;swing=Math.max(0,swing-dt*(TOOLS[tool].melee?2.6:3.5));if(hitStop>0)hitStop-=dt;if(impactT>0){impactT-=dt;if(impactT<=0&&TOOLS[tool].melee)attackHit()}flash*=.7;if(mouseDown&&TOOLS[tool].auto)attack();
    P.food=Math.max(0,P.food-dt*100/560*(sprint?1.6:1));P.water=Math.max(0,P.water-dt*100/420*(sprint?1.6:1));
    if(P.food<=0||P.water<=0){P.hp-=dt*1.5;if(P.hp<=0)return die()}
    else if(P.food>55&&P.water>55&&now-lastHurt>5000&&P.hp<100)P.hp=Math.min(100,P.hp+dt*1.2);
    // torche
    torchL.intensity=tool==='torch'?(isNight()?2.4:1)+Math.sin(now/70)*.2:0;torchL.position.set(P.x-Math.sin(P.yaw)*.6,P.y+EYE,P.z-Math.cos(P.yaw)*.6);
    if(online&&!auth)stepGuestEnts(dt);else stepEnts(dt,now);
    if(online){stepRemotes(dt);sendNet(dt)}
    bushes.forEach(function(b){if(!b.full){b.t-=dt;if(b.t<=0){b.full=true;b.b.visible=true}}});
    structs.forEach(function(s){if(s.dead||!s.m.userData.light)return;var f=s.m.userData.flame;if(s.type==='fire')f.scale.set(1+Math.sin(now/90)*.1,1+Math.sin(now/70)*.2,1);s.m.userData.light.intensity=(isNight()?2.6:.8)+Math.sin(now/60)*.3});
    // objectifs
    while(goalI<GOALS.length-1&&GOALS[goalI].ok()){goalI++;sfx.play('win');PP.toast('Objectif rempli. Suivant : '+GOALS[goalI].t,'ok')}
    msgT-=dt;if(msgT<0)$('sv-msg2').style.opacity=0;
    saveT-=dt;if(saveT<=0){saveT=20;save()}
    stepFx(dt);placeGrass();ghostUpdate();prompt();hudBars();
  }
  function walk(e,dt,mv){if(!e.m)return;var p=e.m.userData.parts;e.anim=(e.anim||0)+dt*(mv?(e.kind==='wolf'?13:8):0);var s=Math.sin(e.anim)*.55*(mv?1:0);p.legs.forEach(function(l,i){l.rotation.x=(i%2?s:-s)*(i>1?-1:1)});if(p.swing)p.arms.forEach(function(a,i){a.rotation.x=(i%2?-s:s)*.8})}

  /* ---------- Créatures (calculées par l'hôte en ligne) ---------- */
  function playersList(){var l=[];if(P&&P.hp>0)l.push({x:P.x,z:P.z,me:1,torch:tool==='torch'});Object.keys(remotes).forEach(function(k){var r=remotes[k];if(r.hp>0&&r.ready)l.push({x:r.x,z:r.z,id:k,torch:r.tool==='torch'})});return l}
  function nearestP(x,z,pl){var b=null,bd=1e9;(pl||playersList()).forEach(function(p){var d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=p}});if(b)b.d=bd;return b}
  function hurtP(p,d){if(p.me)hurt(d);else net.to(p.id,{t:'sv-dmg',d:d})}
  function stepEnts(dt,now){
    var pl=playersList();
    if(isNight()){spawnT-=dt;var cap=Math.min(44,(4+day*3)*Math.max(1,pl.length*.75))*(bloodNight()?1.6:1);if(spawnT<=0&&pl.length&&zombies.filter(function(z){return z.alive}).length<cap){spawnT=Math.max(1,(6-day*.4)*(bloodNight()?.5:1)/Math.max(1,pl.length*.8));var tp=PP.pick(pl);addZombie(tp.x,tp.z)}}
    else if(dayT>.3&&dayT<.7){zombies.forEach(function(z){if(z.alive&&!z.guard&&Math.random()<dt*.15)z.hp=0})}
    castles.forEach(function(c){if(c.spawnedDay===day)return;var t=nearestP(c.x,c.z,pl);if(t&&t.d<55){c.spawnedDay=day;for(var i=0;i<4+Math.min(4,day>>1);i++)addZombieAt(c.x+(Math.random()-.5)*(c.S-8),c.z+(Math.random()-.2)*(c.S/2-4),i===0)}});
    zombies.forEach(function(z){
      if(!z.alive){if(z.dieT>0){z.dieT-=dt;var tt=1-z.dieT;z.m.rotation.x=-Math.min(1.5,tt*3.2);var zp=z.m.userData.parts;if(zp&&zp.jaw){zp.arms[0].rotation.x=-2.8+Math.sin(tt*12)*.4;zp.arms[1].rotation.x=-2.5;zp.jaw.rotation.x=.6}if(!z.dusted&&tt>.4){z.dusted=1;burst(z.x,groundAt(z.x,z.z)+.3,z.z,0x6b5a3c,10,4)}if(tt>.7)z.m.position.y-=dt*1.2;if(z.dieT<=0)scene.remove(z.m)}return}
      if(z.hp<=0){z.alive=false;z.dieT=1;return}
      if(z.rise<1){z.m.position.set(z.x,groundAt(z.x,z.z),z.z);zAnim(z,dt,false);if(z.rise===0||Math.random()<dt*3)burst(z.x,groundAt(z.x,z.z)+.2,z.z,0x6b5a3c,3,3);return}
      var t=nearestP(z.x,z.z,pl);if(!t){zAnim(z,dt,false);return}
      var dx=t.x-z.x,dz=t.z-z.z,d=t.d,a=Math.atan2(dx,dz);z.yaw=a;
      var fear=structs.some(function(s){return !s.dead&&s.type==='fire'&&Math.hypot(s.x-z.x,s.z-z.z)<4})||(t.torch&&d<3.5);if(fear)a+=Math.PI*.6;
      z.mv=d>1.2;
      if(d>1.2){var hit=moveCirc(z,Math.sin(a)*z.sp*dt,Math.cos(a)*z.sp*dt,z.r,'z');
        if(hit&&hit.box&&hit.max){z.cd-=dt;if(z.cd<=0){z.cd=1;hit.hp-=z.dmg;if(Math.hypot(hit.x-P.x,hit.z-P.z)<20)sfx.play('hit');if(hit.hp<=0){destroyStruct(hit);if(online)net.relay({g:'sve',e:'sdel',ty:hit.type,x:hit.x,z:hit.z});msg('Un zombie a cassé : '+BUILD[hit.type].n.toLowerCase())}}if(hit.type==='spike')z.hp-=dt*25}}
      else{z.cd-=dt;if(z.cd<.45&&!z.atk)z.atk=.45;if(z.cd<=0){z.cd=1.1;hurtP(t,z.dmg)}}
      z.m.position.set(z.x,groundAt(z.x,z.z),z.z);z.m.rotation.y=z.yaw+Math.PI;zAnim(z,dt,d>1.2);
      if(d>150){z.alive=false;scene.remove(z.m)}
    });
    zombies=zombies.filter(function(z){return z.alive||z.dieT>0});
    animals.forEach(function(a){
      if(!a.alive){if(a.dieT>0){a.dieT-=dt;a.m.rotation.z=Math.min(1.5,(1-a.dieT)*3);if(a.dieT<=0)scene.remove(a.m)}return}
      var t=nearestP(a.x,a.z,pl);if(!t||t.d>140)return;var d=t.d;
      var sp3=0;
      if(a.kind==='wolf'){
        if(d<16||a.angry>0){a.angry=Math.max(0,(a.angry||0)-dt);a.yaw=Math.atan2(t.x-a.x,t.z-a.z);if(t.torch&&d<5){a.yaw+=Math.PI;sp3=5}else if(d>1.6)sp3=6.2;else{a.cd-=dt;if(a.cd<=0){a.cd=1.1;hurtP(t,6+day*.5)}}}
        else{a.t-=dt;if(a.t<=0){a.t=2+Math.random()*4;a.yaw+=(Math.random()-.5)*2;a.walk=Math.random()<.6}sp3=a.walk?1.8:0}
      }else{
        if(d<9&&((t.me&&keys.SH)||d<5))a.flee=Math.max(a.flee,4);
        if(a.flee>0){a.flee-=dt;a.yaw=Math.atan2(a.x-t.x,a.z-t.z);sp3=7}else{a.t-=dt;if(a.t<=0){a.t=2+Math.random()*4;a.yaw+=(Math.random()-.5)*2;a.walk=Math.random()<.5}sp3=a.walk?1.3:0}
      }
      if(sp3){var hb=moveCirc(a,Math.sin(a.yaw)*sp3*dt,Math.cos(a.yaw)*sp3*dt,a.r,'a');if(hb)a.yaw+=1}
      a.mv=sp3>0;a.m.position.set(a.x,height(a.x,a.z),a.z);a.m.rotation.y=a.yaw+Math.PI;walk(a,dt,sp3>0);animalPose(a,dt,sp3);
    });
    animals=animals.filter(function(a){return a.alive||a.dieT>0});
    if(animals.filter(function(a){return a.kind==='deer'}).length<24&&Math.random()<dt*.05)addAnimal('deer',Math.random);
  }
  /* Invité : les créatures suivent l'état envoyé par l'hôte */
  function stepGuestEnts(dt){
    [zombies,animals].forEach(function(list){list.forEach(function(e){
      if(!e.alive){if(e.dieT>0){e.dieT-=dt;if(e.kind==='z')e.m.rotation.x=-Math.min(1.5,(1-e.dieT)*3);else e.m.rotation.z=Math.min(1.5,(1-e.dieT)*3);if(e.dieT<=0)scene.remove(e.m)}return}
      var dx=e.tx-e.x,dz=e.tz-e.z;e.x+=dx*Math.min(1,dt*9);e.z+=dz*Math.min(1,dt*9);var dy=((e.tyaw-e.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;e.yaw+=dy*Math.min(1,dt*10);
      e.m.position.set(e.x,groundAt(e.x,e.z),e.z);e.m.rotation.y=e.yaw+Math.PI;if(e.kind==='z')zAnim(e,dt,!!e.mv);else walk(e,dt,!!e.mv);if(e.kind!=='z')animalPose(e,dt,e.mv?2:0);
    })});
    zombies=zombies.filter(function(z){return z.alive||z.dieT>0});animals=animals.filter(function(a){return a.alive||a.dieT>0});
  }
  function animalPose(a,dt,sp){
    var p=a.m.userData.parts;if(!p.neck)return;
    a.graze=(a.graze||0)+dt;var down=a.kind==='deer'&&!sp&&Math.sin(a.graze*.7+(a.id||0))>.2;
    p.neck.rotation.x+=((down?1:0)-p.neck.rotation.x)*Math.min(1,dt*3);
    if(p.tail)p.tail.rotation.y=Math.sin(a.graze*(sp?14:3))*(sp?.5:.15);
  }
  function killDrops(kind,x,z){
    st.kills++;PP.stat('surv','kills');
    if(kind==='deer'){dropItem(x+.4,z,'viande',3);dropItem(x-.4,z+.3,'cuir',2);st.deer++}
    else if(kind==='wolf'){dropItem(x,z,'viande',1);dropItem(x+.4,z,'cuir',3)}
    else{var r=Math.random();if(r<.35)dropItem(x,z,'munitions',6);else if(r<.6)dropItem(x,z,'tissu',2);else if(r<.8)dropItem(x,z,'conserve',1);else dropItem(x,z,'fer',1)}
  }
  function entById(id){var l=zombies.concat(animals);for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return null}

  /* ---------- En ligne : joueurs, monde partagé ---------- */
  var net=PP.net,online=false,auth=true,remotes={},netAcc=0,eid=0,stateAcc=0,seenJoin={};
  var PCOL=[0x2f6fb5,0xb5452f,0x3f8f3a,0x8a3fb5,0xc29a1a,0x2fa3a3,0xd06090,0x5a5a5a];
  function nameTag(t){var c=document.createElement('canvas');c.width=256;c.height=64;var g=c.getContext('2d');g.fillStyle='rgba(20,18,16,.8)';g.font='bold 30px IBM Plex Mono, monospace';var w=Math.min(250,g.measureText(t).width+24);g.fillRect((256-w)/2,10,w,44);g.fillStyle='#f1ece2';g.textAlign='center';g.textBaseline='middle';g.fillText(t,128,33);var s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));s.scale.set(2.4,.6,1);s.position.y=2.55;s.renderOrder=5;return s}
  function remoteModel(r){if(r.m)scene.remove(r.m);var slot=Math.max(0,net.slot(r.id));r.m=humanoid(PCOL[slot%PCOL.length],0xd9a77c,false);r.m.add(nameTag(r.n||'?'));r.m.userData.ent=null;scene.add(r.m);r.shown=r.n}
  function stepRemotes(dt){Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!r.ready)return;if(!r.m||r.shown!==r.n)remoteModel(r);r.x+=(r.tx-r.x)*Math.min(1,dt*10);r.z+=(r.tz-r.z)*Math.min(1,dt*10);r.m.visible=r.hp>0;r.m.position.set(r.x,groundAt(r.x,r.z),r.z);r.m.rotation.y=r.yaw;walk(r,dt,Math.hypot(r.tx-r.x,r.tz-r.z)>.04)})}
  function snapshot(){
    return {seed:SEED,day:day,t:dayT,
      sts:structs.filter(function(o){return !o.dead}).map(function(o){return [o.type,+o.x.toFixed(2),+o.z.toFixed(2),o.rot,Math.round(o.hp),o.store||null]}),
      ch:chests.filter(function(c){return c.open}).map(function(c){return c.id}),ci:(function(){var o={};chests.forEach(function(c){if(c.items)o[c.id]=c.items});return o})(),
      tr:trees.list.filter(function(o){return o.hp<=0}).map(function(o){return trees.list.indexOf(o)}),
      rk:rocks.userData.list.filter(function(o){return o.hp<=0}).map(function(o){return o.i}),
      or:ores.userData.list.filter(function(o){return o.hp<=0}).map(function(o){return o.i})};
  }
  function applyWorld(s){
    (s.sts||[]).forEach(function(o){var x=build(o[0],o[1],o[2],o[3],true);if(x){x.hp=o[4];if(o[5])x.store=o[5]}});
    (s.ch||[]).forEach(function(id){var c=chests[id];if(c){c.open=true;c.m.userData.lid.rotation.x=-1.9;if(c.m.userData.spark)c.m.userData.spark.visible=false}});Object.keys(s.ci||{}).forEach(function(id){if(chests[id])chests[id].items=s.ci[id]});
    (s.tr||[]).forEach(function(i){var o=trees.list[i];if(o)fell(o,'tree',true)});
    (s.rk||[]).forEach(function(i){var o=rocks.userData.list[i];if(o)fell(o,'rock',true)});
    (s.or||[]).forEach(function(i){var o=ores.userData.list[i];if(o)fell(o,'ore',true)});
  }
  function worldMsg(){var w=snapshot();w.t='sv-world';w.dt=dayT;w.hx=P.x;w.hz=P.z;return w}
  function sendNet(dt){
    netAcc-=dt;if(netAcc>0)return;netAcc=.1;
    net.relay({g:'svp',x:+P.x.toFixed(2),z:+P.z.toFixed(2),yw:+P.yaw.toFixed(2),hp:Math.ceil(P.hp),tool:tool,n:net.me.name});
    if(auth){net.broadcast({t:'sv-s',dt:+dayT.toFixed(5),day:day,
      z:zombies.filter(function(z){return z.alive}).map(function(z){return [z.id,+z.x.toFixed(2),+z.z.toFixed(2),+z.yaw.toFixed(2),z.big?1:0,z.mv?1:0]}),
      a:animals.filter(function(a){return a.alive}).map(function(a){return [a.id,a.kind==='wolf'?1:0,+a.x.toFixed(2),+a.z.toFixed(2),+a.yaw.toFixed(2),a.mv?1:0,a.ant?1:0]})})}
  }
  function guestJoinWorld(m){
    if(!init())return;running=false;cancelAnimationFrame(raf);
    buildWorld(m.seed,true);day=m.day;dayT=m.dt;won=false;rescueT=-1;goalI=0;
    var gs=null;try{gs=JSON.parse(localStorage.getItem(PP.key('survie-g')))}catch(e){}
    if(gs&&gs.seed===m.seed){inv=Object.assign(freshInv(),gs.inv);st=gs.st;goalI=gs.goal||0;P={x:gs.p.x,z:gs.p.z,y:0,vy:0,yaw:0,pitch:0,hp:Math.max(30,gs.p.hp),food:gs.p.food,water:gs.p.water,stam:100,bob:0,spawn:gs.p.spawn}}
    else{inv=freshInv();st={bois:0,fer:0,deer:0,kills:0};var a=Math.random()*6.28;P={x:m.hx+Math.cos(a)*3,z:m.hz+Math.sin(a)*3,y:0,vy:0,yaw:0,pitch:0,hp:100,food:80,water:80,stam:100,bob:0,spawn:null}}
    P.y=height(P.x,P.z);applyWorld(m);
    viewModel();hudInv();$('sv-ov').hidden=true;$('sv-build').hidden=true;$('sv-craft').hidden=true;$('sv-invp').hidden=true;buildMode=null;running=true;paused=false;last=0;raf=requestAnimationFrame(loop);lock();sfx.play('go');
    msg('Tu as rejoint l\'île de l\'hôte');
  }
  net.on(function(m,from){
    if(!online||PP.cur()!=='surv')return;
    if(m.t==='rel'&&m.d){var d=m.d,id=m.from;
      if(d.g==='svp'){var r=remotes[id];if(!r){r=remotes[id]={id:id,x:d.x,z:d.z,tx:d.x,tz:d.z,yaw:0,hp:100,n:d.n,m:null}}r.tx=d.x;r.tz=d.z;r.yaw=d.yw;r.hp=d.hp;r.tool=d.tool;r.n=d.n;r.ready=!!scene;return}
      if(d.g==='sve'&&scene){netEvent(d);return}
      return}
    if(m.t==='sv-world'&&!net.isHost){guestJoinWorld(m);return}
    if(m.t==='sv-dmg'&&running){hurt(m.d);return}
    if(m.t==='sv-kill'&&running){sfx.play('kill');killDrops(m.k,m.x,m.z);return}
    if(m.t==='sv-s'&&!net.isHost&&running){
      dayT=m.dt;if(m.day!==day){day=m.day;PP.toast('Jour '+day,'ok')}
      var seenZ={},seenA={};
      m.z.forEach(function(s){seenZ[s[0]]=1;var e=entById(s[0]);if(!e){var gzt=s[4]?'tank':(s[0]%3===0?'runner':'walker'),mm=zombieModel(gzt);scene.add(mm);e={type:gzt,rise:0,id:s[0],kind:'z',x:s[1],z:s[2],yaw:s[3],m:mm,alive:true,r:.4};mm.userData.ent=e;zombies.push(e)}e.tx=s[1];e.tz=s[2];e.tyaw=s[3];e.mv=s[5]});
      m.a.forEach(function(s){seenA[s[0]]=1;var e=entById(s[0]);if(!e){var mm=animalMesh(s[1]?'wolf':'deer',s[6]);scene.add(mm);e={id:s[0],kind:s[1]?'wolf':'deer',x:s[2],z:s[3],yaw:s[4],m:mm,alive:true,r:.6};mm.userData.ent=e;animals.push(e)}e.tx=s[2];e.tz=s[3];e.tyaw=s[4];e.mv=s[5]});
      zombies.forEach(function(e){if(e.alive&&!seenZ[e.id]){e.alive=false;e.dieT=1}});animals.forEach(function(e){if(e.alive&&!seenA[e.id]){e.alive=false;e.dieT=1}});
      return}
    if(net.isHost){
      if(m.t==='sv-hello'&&running){net.to(from,worldMsg());return}
      if(m.t==='sv-hit'&&running){var e=entById(m.id);if(e&&e.alive){e.hp-=m.d;flashEnt(e);if(e.kind==='deer')e.flee=6;if(e.kind==='wolf')e.angry=20;if(e.hp<=0){e.alive=false;e.dieT=1;net.to(from,{t:'sv-kill',k:e.kind,x:e.x,z:e.z})}}return}
    }
    if(m.t==='players'){var ids=m.players.map(function(p){return p.id});Object.keys(remotes).forEach(function(k){if(ids.indexOf(k)<0){if(remotes[k].m)scene.remove(remotes[k].m);delete remotes[k]}});
      if(net.isHost&&running)m.players.forEach(function(p){if(p.id!=='host'&&!seenJoin[p.id]){seenJoin[p.id]=1;PP.toast(p.name+' arrive sur ton île','ok');net.to(p.id,{t:'launch',game:'surv'})}});return}
    if(m.t==='closed'){online=false;msg('L\'hôte a quitté : tu continues seul sur ta propre île');running=false;cancelAnimationFrame(raf);PP.games.surv.open()}
  });
  function netEvent(d){
    if(d.e==='fell'){var o=d.ty==='tree'?trees.list[d.i]:(d.ty==='rock'?rocks:ores).userData.list[d.i];if(o&&o.hp>0){if(d.ty==='tree'&&running&&Math.hypot(o.x-P.x,o.z-P.z)<120){o.hp=0;fallTree(o,true);if(!ZERO)ZERO=new THREE.Matrix4().makeScale(0,0,0);o.ms.forEach(function(im){im.setMatrixAt(o.i,ZERO);im.instanceMatrix.needsUpdate=true});near(o.x,o.z,2).forEach(function(c){if(c.ref===o)remCol(c)})}else fell(o,d.ty,true);if(d.ty!=='tree'){var gy=height(o.x,o.z)+.6;burst(o.x,gy,o.z,d.ty==='ore'?0x8a5a3c:0x8c8a84,18,6)}}}
    if(d.e==='chest'){var c=chests[d.id];if(c&&!c.open){c.open=true;c.anim=0;if(c.m.userData.spark)c.m.userData.spark.visible=false}}
    if(d.e==='hdoor'){var hh=hdoors[d.i];if(hh&&!!hh.openD!==!!d.o)toggleHDoor(hh,true)}
    if(d.e==='take'){var tc=chests[d.id];if(tc){delete chestItems(tc)[d.k];if(openBox===tc)chestPanel(tc)}}
    if(d.e==='build')build(d.ty,d.x,d.z,d.r,true);
    if(d.e==='sdel'){structs.forEach(function(s){if(!s.dead&&s.type===d.ty&&Math.abs(s.x-d.x)<.05&&Math.abs(s.z-d.z)<.05)destroyStruct(s)})}
    if(d.e==='door'){structs.forEach(function(s){if(!s.dead&&s.type==='door'&&Math.abs(s.x-d.x)<.05&&Math.abs(s.z-d.z)<.05&&!!s.openD!==!!d.o)toggleDoor(s,true)})}
    if(d.e==='bush'){var b=bushes[d.i];if(b){b.full=false;b.t=DAY*.8;b.b.visible=false}}
  }
  function relayEv(o){if(online){o.g='sve';net.relay(o)}}
  function toggleDoor(dd,silent){dd.openD=!dd.openD;dd.m.rotation.y=dd.rot*Math.PI/2+(dd.openD?Math.PI/2:0);if(dd.openD)unGrid(dd);else gridAdd(dd);sfx.play('ui');if(!silent)relayEv({e:'door',x:dd.x,z:dd.z,o:dd.openD?1:0})}
  function goOnline(){
    var name=PP.myName()||('Joueur'+(100+Math.random()*900|0));PP.setName(name);
    var btn=$('sv-online');btn.disabled=true;btn.textContent='Recherche d\'une île…';if(PP.lobby)PP.lobby.refresh();
    setTimeout(function(){
      function done(){btn.disabled=false;btn.textContent='Jouer à plusieurs'}
      if(net.inRoom()&&net.isHost){done();if(PP.setRoomGame)PP.setRoomGame('surv');online=true;auth=true;start(false);return}
      var l=(PP.lobby?PP.lobby.list():[]).filter(function(r){return r.game==='surv'&&r.code!==net.code});
      function hostIt(){net.host(name,function(err,code){done();if(err){PP.toast(err,'warn');return}if(PP.setRoomGame)PP.setRoomGame('surv');online=true;auth=true;PP.toast('Île ouverte (salon '+code+') : tes potes la verront dans « Jouer à plusieurs »','ok');start(false)})}
      if(l.length)net.join(l[0].code,name,function(err){done();if(err){hostIt();return}online=true;auth=false;PP.toast('Tu rejoins l\'île de '+l[0].host,'ok');$('sv-title').textContent='Connexion';$('sv-msg').textContent='Chargement de l\'île de '+l[0].host+'…';net.send({t:'sv-hello'})});
      else hostIt();
    },1600);
  }
  /* ---------- Rendu ---------- */
  var vm=null;
  /* Armes détaillées : canon vers -z, poignée vers l'origine */
  function buildGun(type,col){
    var g=new THREE.Group(),body=new THREE.MeshStandardMaterial({color:new THREE.Color(col).offsetHSL(0,0,.08),roughness:.55,metalness:.1}),steel=new THREE.MeshStandardMaterial({color:0x44474e,roughness:.42,metalness:.35}),bright=new THREE.MeshStandardMaterial({color:0x8a8e96,roughness:.3,metalness:.45}),grip=new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.85});
    function box(w,h,d,x,y,z,mat,rx){var q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;g.add(q);return q}
    function cyl(r1,r2,len,x,y,z,mat,seg){var q=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,seg||14),mat);q.rotation.x=Math.PI/2;q.position.set(x,y,z);g.add(q);return q}
    function guard(z,y,r){var t=new THREE.Mesh(new THREE.TorusGeometry(r||.045,.008,6,14,Math.PI),steel);t.rotation.set(0,Math.PI/2,Math.PI);t.position.set(0,y,z);g.add(t);box(.012,.03,.01,0,y-.005,z-.005,steel)}
    if(type==='pistol'){
      box(.068,.07,.36,0,.045,-.12,steel);for(var i=0;i<5;i++)box(.07,.05,.006,0,.05,.02+i*.012,bright);
      box(.06,.05,.27,0,-.005,-.1,body);cyl(.014,.014,.06,0,.04,-.32,bright,10);
      box(.058,.17,.085,0,-.1,.02,grip,.22);box(.062,.12,.006,0,-.1,.065,body,.22);
      guard(-.07,-.035);box(.012,.02,.01,0,.088,-.27,steel);box(.04,.018,.012,0,.088,.04,steel);
    }else if(type==='rifle'){
      box(.08,.1,.38,0,.02,-.12,body);box(.075,.09,.3,0,.02,-.45,steel);for(var v=0;v<4;v++)box(.08,.02,.03,0,.035,-.36-v*.06,grip);
      cyl(.017,.017,.26,0,.03,-.71,bright);cyl(.025,.025,.06,0,.03,-.84,steel);
      var mag=box(.05,.17,.08,0,-.1,-.2,steel,.18);box(.05,.06,.08,0,-.2,-.18,steel,.45);
      box(.055,.15,.07,0,-.09,.04,grip,.3);guard(-.08,-.04);
      box(.07,.08,.26,0,0,.21,body);box(.07,.13,.05,0,-.02,.33,body);box(.04,.04,.18,0,.08,.15,steel);
      box(.05,.05,.1,0,.1,-.15,steel);var dot=new THREE.Mesh(new THREE.CircleGeometry(.016,12),new THREE.MeshBasicMaterial({color:0xff2a10}));dot.position.set(0,.1,-.21);g.add(dot);box(.02,.03,.03,.045,.04,-.02,bright);
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
      var bolt=box(.012,.012,.07,.05,.05,-.02,bright);bolt.rotation.y=-.6;var knob=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),bright);knob.position.set(.075,.05,.0);g.add(knob);
      box(.05,.09,.09,0,-.06,-.2,steel);box(.055,.14,.07,0,-.09,.05,grip,.25);guard(-.05,-.04);
      box(.07,.1,.34,0,-.02,.26,body,-.08);box(.06,.05,.14,0,.05,.22,body);box(.072,.16,.04,0,-.05,.44,grip);
      [-1,1].forEach(function(s){var leg=box(.012,.012,.22,s*.025,-.02,-.72,steel);leg.rotation.y=s*.05});
    }
    g.traverse(function(o){if(o.isMesh)o.castShadow=true});
    return g;
  }
  function viewModel(){
    while(vscene.children.length>2)vscene.remove(vscene.children[2]);
    var g=new THREE.Group(),skin=lam({color:0xd9a77c}),dark=lam({color:0x252525}),wood=lam({color:0x7a5230}),metal=lam({color:0xb8bcc4});
    var sleeve=[0x56643a,0x6b4a2a,0x6c7078][inv.armure||0];
    var arm=new THREE.Mesh(new THREE.CapsuleGeometry(.062,.34,4,12),lam({color:sleeve}));arm.rotation.x=Math.PI/2.4;arm.position.set(.03,-.12,.2);g.add(arm);
    var cuff=new THREE.Mesh(new THREE.CylinderGeometry(.068,.068,.05,12),lam({color:0x2b2420}));cuff.rotation.x=Math.PI/2.4;cuff.position.set(.02,-.05,.07);g.add(cuff);
    var hand=new THREE.Mesh(new THREE.SphereGeometry(.065,14,10),skin);hand.scale.set(1,.8,1.15);g.add(hand);var th=new THREE.Mesh(new THREE.CapsuleGeometry(.018,.05,3,6),skin);th.position.set(-.05,.02,-.02);th.rotation.z=.8;g.add(th);
    [-.025,0,.025].forEach(function(fx){var f=new THREE.Mesh(new THREE.CapsuleGeometry(.014,.04,3,6),skin);f.position.set(fx+.01,.035,-.05);f.rotation.x=-.6;g.add(f)});
    var woodS=new THREE.MeshStandardMaterial({color:0x8a5a30,roughness:.7}),steelS=new THREE.MeshStandardMaterial({color:inv.iaxe||tool==='sword'?0xc4c8d0:0x8f8d88,roughness:.42,metalness:.3}),edge=new THREE.MeshStandardMaterial({color:0xf2f4f6,roughness:.2,metalness:.35}),wrap=new THREE.MeshStandardMaterial({color:0x5a3d22,roughness:.9});
    function ring(y,r,par){var t=new THREE.Mesh(new THREE.TorusGeometry(r,.008,6,12),wrap);t.rotation.x=Math.PI/2;t.position.y=y;(par||g).add(t)}
    if(tool==='axe'){var h=new THREE.Mesh(new THREE.CylinderGeometry(.02,.026,.66,10),woodS);h.position.set(0,.2,0);g.add(h);for(var w2=0;w2<4;w2++)ring(-.05+w2*.03,.027);
      var sh=new THREE.Shape();sh.moveTo(0,-.05);sh.lineTo(-.06,-.08);sh.quadraticCurveTo(-.2,-.02,-.2,.0);sh.quadraticCurveTo(-.2,.06,-.06,.1);sh.lineTo(0,.06);sh.lineTo(.03,.04);sh.lineTo(.03,-.03);sh.lineTo(0,-.05);
      var blade=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.022,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2}),steelS);blade.rotation.y=-Math.PI/2;blade.position.set(.011,.46,0);g.add(blade);
      var ed=new THREE.Mesh(new THREE.BoxGeometry(.03,.16,.012),edge);ed.position.set(0,.47,-.195);g.add(ed);g.rotation.x=-.3}
    else if(tool==='pick'){var h2=new THREE.Mesh(new THREE.CylinderGeometry(.02,.026,.66,10),woodS);h2.position.set(0,.2,0);g.add(h2);for(var w3=0;w3<4;w3++)ring(-.05+w3*.03,.027);
      var arc=new THREE.Mesh(new THREE.TorusGeometry(.26,.022,8,20,Math.PI*.7),steelS);arc.rotation.set(0,Math.PI/2,Math.PI*.15);arc.position.set(0,.28,0);g.add(arc);[-1,1].forEach(function(s){var tip=new THREE.Mesh(new THREE.ConeGeometry(.024,.09,8),edge);var an=s>0?Math.PI*.15:Math.PI*.85;tip.position.set(0,.28+Math.sin(an)*.26,-Math.cos(an)*.26);tip.rotation.x=s>0?-1.2:1.2;g.add(tip)});var col=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.07,10),steelS);col.position.set(0,.53,0);g.add(col)}
    else if(tool==='sword'){var bs=new THREE.Shape();bs.moveTo(-.03,0);bs.lineTo(-.026,.66);bs.lineTo(0,.76);bs.lineTo(.026,.66);bs.lineTo(.03,0);bs.lineTo(-.03,0);var bl=new THREE.Mesh(new THREE.ExtrudeGeometry(bs,{depth:.01,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:1}),steelS);bl.rotation.y=Math.PI/2;bl.position.set(-.005,.1,0);g.add(bl);var fu=new THREE.Mesh(new THREE.BoxGeometry(.004,.5,.012),new THREE.MeshStandardMaterial({color:0x6a6e74,metalness:.8,roughness:.3}));fu.position.set(.008,.38,0);g.add(fu);
      var cg=new THREE.Mesh(new THREE.BoxGeometry(.035,.035,.24),new THREE.MeshStandardMaterial({color:0xb08a3a,metalness:.7,roughness:.3}));cg.position.set(0,.09,0);g.add(cg);[-1,1].forEach(function(s){var b2=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),cg.material);b2.position.set(0,.09,s*.12);g.add(b2)});
      var gp=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.14,10),wrap);gp.position.set(0,.0,0);g.add(gp);for(var r2=0;r2<5;r2++)ring(-.06+r2*.028,.024);var pm=new THREE.Mesh(new THREE.SphereGeometry(.03,10,8),cg.material);pm.position.set(0,-.08,0);g.add(pm)}
    else if(tool==='torch'){var th=new THREE.Mesh(new THREE.CylinderGeometry(.022,.03,.5,10),woodS);th.position.set(0,.15,0);g.add(th);var cloth=new THREE.Mesh(new THREE.CylinderGeometry(.045,.035,.1,10),new THREE.MeshStandardMaterial({color:0x3a2a1a,roughness:1}));cloth.position.set(0,.4,0);g.add(cloth);var fl=new THREE.Group();[[0xff7a1a,.08,.26,1],[0xffb030,.055,.2,.95],[0xfff0a0,.03,.13,1]].forEach(function(f){var c=new THREE.Mesh(new THREE.ConeGeometry(f[1],f[2],10),new THREE.MeshBasicMaterial({color:f[0],transparent:true,opacity:f[3]}));c.position.y=f[2]/2;fl.add(c)});fl.position.set(0,.45,0);g.add(fl);g.userData.flame=fl}
    else if(tool==='bow'){var bw=new THREE.Mesh(new THREE.TorusGeometry(.34,.016,8,32,Math.PI*.9),woodS);bw.rotation.z=Math.PI/2+Math.PI*.05;bw.position.set(0,.05,-.12);g.add(bw);var gw=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.12,10),wrap);gw.position.set(0,.05,-.46);g.add(gw);
      var str=new THREE.Mesh(new THREE.CylinderGeometry(.0025,.0025,.66,4),new THREE.MeshBasicMaterial({color:0xf1ece2}));str.position.set(0,.05,-.13);g.add(str);if(inv.fleches>0){var ar=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.6,6),woodS);ar.rotation.x=Math.PI/2;ar.position.set(.02,.05,-.38);g.add(ar);var ah=new THREE.Mesh(new THREE.ConeGeometry(.016,.05,6),steelS);ah.rotation.x=-Math.PI/2;ah.position.set(.02,.05,-.7);g.add(ah);[-1,1].forEach(function(s){var ft=new THREE.Mesh(new THREE.BoxGeometry(.002,.025,.06),new THREE.MeshBasicMaterial({color:0xe2361b}));ft.position.set(.02+s*.008,.05,-.1);ft.rotation.z=s*.5;g.add(ft)})}}
    else{var len=tool==='rifle'?.82:.36,gm=buildGun(tool,tool==='rifle'?0x6b4a2a:0x2b2b30);gm.position.set(0,.05,0);g.add(gm);
      var mf=new THREE.Mesh(new THREE.PlaneGeometry(.18,.18),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0,depthWrite:false}));mf.position.set(0,.09,-len-.02);g.add(mf);g.userData.fl=mf}
    g.scale.setScalar(.7);vm=g;vscene.add(g);
  }
  function render(){
    if(!R3||!P)return;
    var sh=shakeT>0?shakeT*.25:0;cam.position.set(P.x+(Math.random()-.5)*sh,P.y+EYE+Math.sin(P.bob)*.04+(Math.random()-.5)*sh,P.z);cam.rotation.set(P.pitch,P.yaw,Math.sin(P.bob*.5)*.008*Math.min(1,P.spd||0));
    updLights();cullT-=1;if(cullT<=0){cullT=20;cullFar()}
    R3.clear();R3.render(scene,cam);
    if(vm&&!buildMode){
      var sw=swing>0?Math.sin(swing*Math.PI):0,now=performance.now()/1000,mv=Math.min(1,P.spd||0),br=Math.sin(now*1.6)*.006;
      /* marche : la main se balance en 8 et la tête roule un peu ; au repos on respire */
      var bx=Math.cos(P.bob*.5)*.022*mv,by=-Math.abs(Math.sin(P.bob*.5))*.03*mv+br;
      vm.position.set(.26+bx,-.3+by,-.45);
      if(TOOLS[tool].melee){var tt=1-swing,rx=-.3+Math.sin(P.bob*.5)*.04*mv,ry=0,rz=Math.cos(P.bob*.5)*.05*mv,py=0,pz=0,px=0;
        if(swing>0){
          if(tt<.3){var u=tt/.3,e=u*u*(3-2*u);rx=-.3+e*.85;ry=e*.2;rz=-e*.25;py=e*.12;pz=e*.05;px=e*.05}
          else if(tt<.44){var u2=(tt-.3)/.14,e2=u2*u2*u2;rx=.55-e2*1.35;ry=.2-e2*.6;rz=-.25+e2*.75;py=.12-e2*.24;pz=.05-e2*.05;px=.05-e2*.22}
          else if(tt<.58){var j=hitStop>0?.012:0;rx=-.8+(Math.random()-.5)*j*6;ry=-.4;rz=.5;py=-.12+(Math.random()-.5)*j;pz=0;px=-.17}
          else{var u3=(tt-.58)/.42,e3=1-Math.pow(1-u3,3);rx=-.8+e3*.5;ry=-.4+e3*.4;rz=.5-e3*.5;py=-.12+e3*.12;pz=0;px=-.17+e3*.17}}
        vm.rotation.set(rx,ry,rz);vm.position.x+=px;vm.position.y+=py;vm.position.z+=pz}
      else{vm.position.z+=gunKick*.07;vm.rotation.set(flash*.25+gunKick*.35-(tool==='bow'?sw*.2:0)+Math.sin(P.bob*.5)*.03*mv,0,(tool==='bow'?.2:0)+Math.cos(P.bob*.5)*.04*mv);if(vm.userData.fl)vm.userData.fl.material.opacity=flash}
      if(vm.userData.flame)vm.userData.flame.scale.y=1+Math.sin(performance.now()/60)*.2;
      R3.clearDepth();R3.render(vscene,vcam);
    }
    drawMap();
  }
  function loop(t){var dt=last?Math.min(.05,(t-last)/1000):0;last=t;if(running){if(!paused)step(dt);if(running){render();if(dt>0)autoQ(dt)}raf=requestAnimationFrame(loop)}}

  /* ---------- Interface ---------- */
  function hudBars(){
    [['hp',Math.max(0,P.hp)],['food',P.food],['water',P.water],['stam',P.stam]].forEach(function(b){var el=$('sv-'+b[0]);el.style.width=Math.max(0,b[1])+'%';el.parentNode.parentNode.classList.toggle('low',b[1]<25)});
    var hrs=dayT*24,hh=Math.floor(hrs),mm=Math.floor((hrs-hh)*6)*10;
    $('sv-clock').innerHTML='JOUR '+day+' · '+('0'+hh).slice(-2)+':'+('0'+mm).slice(-2)+(isNight()?(bloodNight()?' · <b class="blood">NUIT DE SANG</b>':' · <b>NUIT</b>'):'')+(rescueT>0?' · secours dans '+rescueT+' j':'');
    $('sv-goal').innerHTML='<small>OBJECTIF '+(goalI+1)+' / '+GOALS.length+'</small>'+esc(GOALS[goalI].t);
    $('sv-l1').innerHTML='Jour <b>'+day+'</b>';
  }
  function hudInv(){
    var ks=['bois','pierre','fer','baies','viande','cuite','conserve','eau','bandage','tissu','cuir','munitions','fleches','radio'];
    $('sv-inv').innerHTML=ks.filter(function(k){return inv[k]>0}).map(function(k){return '<span><b>'+inv[k]+'</b> '+esc(NAMES[k].toLowerCase())+'</span>'}).join('')+(inv.armure?'<span class="arm">'+(inv.armure>1?'armure en fer':'armure en cuir')+'</span>':'');
    $('sv-bar').innerHTML=TORDER.map(function(t,i){var own=t==='axe'||inv[t];if(!own)return '';var T=TOOLS[t];return '<span class="'+(tool===t&&!buildMode?'on':'')+'"><i>'+(i+1)+'</i>'+(t==='axe'&&inv.iaxe?'Hache en fer':T.n)+(T.ammo?' · '+inv[T.ammo]:'')+'</span>'}).join('')+'<span class="'+(buildMode?'on':'')+'"><i>B</i>Construire</span><span><i>C</i>Fabriquer</span><span><i>Tab</i>Sac</span>';
    $('sv-best').textContent=PP.store('sv-best');
  }
  function buildMenu(){
    var el=$('sv-build');$('sv-craft').hidden=true;$('sv-invp').hidden=true;
    if(el.hidden){el.innerHTML='<b>Construire</b>'+Object.keys(BUILD).map(function(k,i){var B=BUILD[k],ok=canPay(B.cost);return '<button type="button" class="'+(ok?'':'no')+(buildMode===k?' on':'')+'" data-b="'+k+'"><i>'+(i+1)+'</i>'+esc(B.n)+'<small>'+costTxt(B.cost)+(B.d?' · '+esc(B.d):'')+'</small></button>'}).join('')+'<small class="hint">Chiffre ou clic pour choisir, puis clic dans le monde pour poser. R tourne. B ferme.</small>';el.hidden=false;unlock()}
    else{el.hidden=true;buildMode=null;lock()}
  }
  $('sv-build').addEventListener('click',function(e){var b=e.target.closest('[data-b]');if(b){buildMode=b.dataset.b;$('sv-build').hidden=true;lock()}});
  var mapBase=null;
  /* couleur de la carte en un point (vue du dessus, ombrage du relief) */
  function mapPx(x,z,st){
    var h=height(x,z),r,g,b,bi=h>0?biomeAt(x,z):'';
    if(bi==='desert'&&h>=.8){r=220;g=196;b=136}else if(bi==='neige'&&h>=.8){r=236;g=240;b=244}else if(bi==='jungle'&&h>=.8&&h<20){r=63;g=138;b=42}else if(h<0){var dp=Math.min(1,-h/12);r=78-44*dp;g=164-66*dp;b=196-52*dp}
    else if(h<.8){r=230;g=214;b=166}
    else if(h<20){var t=h/20;r=104-30*t;g=152-25*t;b=70-20*t}
    else if(h<34){var t2=(h-20)/14;r=118+20*t2;g=120+15*t2;b=104+20*t2}
    else{r=240;g=242;b=246}
    if(h>=0){var sh=(height(x-st,z-st)-height(x+st,z+st))*(st<3?9:5);r+=sh;g+=sh;b+=sh;if(h>1&&Math.abs((h%6)-3)<.12+st*.01){r-=16;g-=16;b-=16}}
    else if(h>-1.6){r+=40;g+=34;b+=24}
    return [r,g,b];
  }
  function buildMapBase(){
    var N=560,WS=WORLDH*2;mapBase=document.createElement('canvas');mapBase.width=mapBase.height=N;mapBase.seed=SEED;var mg=mapBase.getContext('2d'),im=mg.createImageData(N,N),st=WS/N;
    for(var j=0;j<N;j++)for(var i=0;i<N;i++){var c=mapPx((i/N-.5)*WS,(j/N-.5)*WS,st),o=(j*N+i)*4;im.data[o]=c[0];im.data[o+1]=c[1];im.data[o+2]=c[2];im.data[o+3]=255}
    mg.putImageData(im,0,0);mapTiles={};
  }
  /* carte détaillée : petites tuiles calculées à la demande quand on zoome */
  var mapTiles={},TILE=200,TPX=128;
  function mapTile(i,j,make){
    var k=i+','+j,t=mapTiles[k];if(t||!make)return t||null;
    var c=document.createElement('canvas');c.width=c.height=TPX;var g=c.getContext('2d'),im=g.createImageData(TPX,TPX),st=TILE/TPX;
    for(var y=0;y<TPX;y++)for(var x=0;x<TPX;x++){var p=mapPx(i*TILE+(x+.5)*st,j*TILE+(y+.5)*st,st),o=(y*TPX+x)*4;im.data[o]=p[0];im.data[o+1]=p[1];im.data[o+2]=p[2];im.data[o+3]=255}
    g.putImageData(im,0,0);mapTiles[k]=c;return c;
  }
  /* ---------- Eau : vagues, reflets du ciel, eau turquoise sur le sable, écume qui roule sur la plage ---------- */
  var waterFar=null,waterMat=null,HTN=640;
  function heightTex(){
    var d=new Uint8Array(HTN*HTN*4),WS=WORLDH*2;
    for(var j=0;j<HTN;j++)for(var i=0;i<HTN;i++){var h=height((i+.5)/HTN*WS-WORLDH,(j+.5)/HTN*WS-WORLDH),v=Math.max(0,Math.min(255,Math.round((h+16)/24*255))),o=(j*HTN+i)*4;d[o]=v;d[o+1]=v;d[o+2]=v;d[o+3]=255}
    var t=new THREE.DataTexture(d,HTN,HTN,THREE.RGBAFormat);t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true;return t;
  }
  function makeWater(){
    var U={uT:{value:0},uH:{value:heightTex()},uW:{value:WORLDH},uP:{value:new THREE.Vector3()},uK:{value:1},uSun:{value:new THREE.Vector3(.3,.8,.2)},uSky:{value:new THREE.Color(0xbfdcf0)},
      uFogC:{value:new THREE.Color(0xbfdcf0)},uFogN:{value:120},uFogF:{value:700},uAmp:{value:1}};
    var common='uniform float uT,uW,uK,uFogN,uFogF,uAmp;uniform vec3 uP,uSun,uSky,uFogC;uniform sampler2D uH;\n'+
      'float hAt(vec2 p){vec2 uv=p/(uW*2.)+.5;if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.)return -16.;return texture2D(uH,uv).r*24.-16.;}\n'+
      'float waves(vec2 p,out vec2 g){float y=0.;g=vec2(0.);vec2 D[4];D[0]=normalize(vec2(1.,.35));D[1]=normalize(vec2(-.4,1.));D[2]=normalize(vec2(.8,-.7));D[3]=normalize(vec2(-1.,-.2));'+
      'float K[4];K[0]=.16;K[1]=.23;K[2]=.41;K[3]=.67;float A[4];A[0]=.32;A[1]=.2;A[2]=.1;A[3]=.05;float S[4];S[0]=1.1;S[1]=1.4;S[2]=1.9;S[3]=2.6;'+
      'for(int i=0;i<4;i++){float ph=dot(D[i],p)*K[i]+uT*S[i];y+=A[i]*sin(ph);g+=A[i]*K[i]*D[i]*cos(ph);}return y;}\n';
    waterMat=new THREE.ShaderMaterial({uniforms:U,
      vertexShader:common+'varying vec3 vW;varying vec2 vG;varying float vY;\n'+
        'void main(){vec4 wp=modelMatrix*vec4(position,1.);float dep=-.25-hAt(wp.xz);float dist=length(wp.xz-uP.xz);'+
        'float a=uAmp*clamp(dep/4.,.12,1.)*clamp(1.-(dist-260.)/140.,0.,1.);vec2 g;float y=waves(wp.xz,g)*a;wp.y+=y;vW=wp.xyz;vG=g*a;vY=y;gl_Position=projectionMatrix*viewMatrix*wp;}',
      fragmentShader:common+'varying vec3 vW;varying vec2 vG;varying float vY;\n'+
        'void main(){float d=-.25-hAt(vW.xz);'+
        'vec2 r=vec2(sin(vW.x*1.3+uT*2.1)+sin(vW.z*1.9-uT*1.7)+sin((vW.x+vW.z)*2.7+uT*2.9)*.5,cos(vW.z*1.1+uT*1.8)+cos(vW.x*1.6-uT*1.4)+cos((vW.x-vW.z)*2.3-uT*2.4)*.5)*.05;'+
        'vec3 n=normalize(vec3(-vG.x+r.x,1.,-vG.y+r.y));vec3 v=normalize(cameraPosition-vW);float fr=.04+.96*pow(1.-max(dot(n,v),0.),5.);'+
        'vec3 deep=vec3(.015,.1,.2),mid=vec3(.03,.27,.38),shal=vec3(.16,.58,.58),sand=vec3(.8,.72,.52);'+
        'vec3 c=mix(shal,mid,smoothstep(.3,2.8,d));c=mix(c,deep,smoothstep(2.8,12.,d));c=mix(sand*.92,c,smoothstep(0.,.9,d));'+
        'vec3 sky=uSky*.8;c=mix(c,sky,fr*.4);'+
        'vec3 h=normalize(normalize(uSun)+v);float sp=pow(max(dot(n,h),0.),160.)*1.6*uK*step(0.,uSun.y);'+
        'float nz=sin(vW.x*.9+uT*.7)*sin(vW.z*.8-uT*.6)*.5+.5;'+
        'float band=1.-smoothstep(0.,1.1,d);float rings=smoothstep(.62,.95,sin(d*7.-uT*1.8+nz*2.)*.5+.5)*band;'+
        'float edge=1.-smoothstep(0.,.18+nz*.12,d);float cap=smoothstep(.48,.62,vY)*.25*smoothstep(3.,6.,d);'+
        'float foam=clamp(rings*.8+edge+cap,0.,1.);c=mix(c,vec3(.96,.98,1.),foam*.9);'+
        'c*=mix(.16,1.,uK);c+=sp*vec3(1.,.95,.85);'+
        'float fd=length(cameraPosition-vW);c=mix(c,uFogC,smoothstep(uFogN,uFogF,fd));'+
        'gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
    });
    water=new THREE.Mesh(new THREE.PlaneGeometry(900,900,220,220),waterMat);water.rotation.x=-Math.PI/2;water.position.y=-.25;water.frustumCulled=false;water.userData._cr=-1;scene.add(water);
    var farMat=waterMat.clone();farMat.uniforms=U;waterFar=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000,1,1),farMat);waterFar.rotation.x=-Math.PI/2;waterFar.position.y=-.9;waterFar.userData._cr=-1;scene.add(waterFar);
  }
  function waterStep(dt,k){
    if(!waterMat)return;var U=waterMat.uniforms;U.uT.value+=dt;U.uK.value=k;
    var sx=Math.round(P.x/8)*8,sz=Math.round(P.z/8)*8;water.position.x=sx;water.position.z=sz;U.uP.value.set(P.x,0,P.z);
    if(scene.fog){U.uFogC.value.copy(scene.fog.color);U.uFogN.value=scene.fog.near;U.uFogF.value=scene.fog.far;U.uSky.value.copy(scene.fog.color)}
    U.uSun.value.copy(sun.position).sub(sun.target.position).normalize();
  }
  /* ---------- Carte : tout est gris tant qu'on n'est pas passé par là ---------- */
  var FN=580,fog=null,fogCv=null,fogDirty=true,fogSeed=null,fogT=0,MV={z:2.5,cx:0,cz:0,drag:null,hx:-1,hy:-1};
  function fogKey(){return PP.key('sv-fog')}
  function fogLoad(){
    fog=new Uint8Array(FN*FN);fogSeed=SEED;fogDirty=true;
    try{var o=JSON.parse(localStorage.getItem(fogKey()));if(o&&o.seed===SEED&&o.n===FN){var b=atob(o.d);for(var i=0;i<FN*FN;i++)fog[i]=(b.charCodeAt(i>>3)>>(i&7))&1}}catch(e){}
  }
  function fogSave(){
    if(!fog)return;var n=Math.ceil(FN*FN/8),u=new Uint8Array(n);for(var i=0;i<FN*FN;i++)if(fog[i])u[i>>3]|=1<<(i&7);
    var s='';for(var j=0;j<n;j++)s+=String.fromCharCode(u[j]);try{localStorage.setItem(fogKey(),JSON.stringify({seed:SEED,n:FN,d:btoa(s)}))}catch(e){}
  }
  function fogCell(x,z){return [Math.floor((x/(WORLDH*2)+.5)*FN),Math.floor((z/(WORLDH*2)+.5)*FN)]}
  function fogSeen(x,z){if(!fog)return false;var c=fogCell(x,z);if(c[0]<0||c[1]<0||c[0]>=FN||c[1]>=FN)return false;return !!fog[c[1]*FN+c[0]]}
  function fogReveal(x,z,r){
    if(!fog||fogSeed!==SEED)fogLoad();var c=fogCell(x,z),cr=Math.ceil(r/(WORLDH*2)*FN);
    for(var j=-cr;j<=cr;j++)for(var i=-cr;i<=cr;i++){if(i*i+j*j>cr*cr)continue;var X=c[0]+i,Y=c[1]+j;if(X<0||Y<0||X>=FN||Y>=FN)continue;var k=Y*FN+X;if(!fog[k]){fog[k]=1;fogDirty=true}}
  }
  function fogImage(){
    if(!fogCv){fogCv=document.createElement('canvas');fogCv.width=fogCv.height=FN}
    if(!fogDirty)return fogCv;fogDirty=false;
    var g=fogCv.getContext('2d'),im=g.createImageData(FN,FN),d=im.data;
    for(var i=0;i<FN*FN;i++){var o=i*4,n=((i*2654435761)>>>24)&15;d[o]=150+n;d[o+1]=148+n;d[o+2]=142+n;d[o+3]=fog[i]?0:255}
    g.putImageData(im,0,0);return fogCv;
  }
  function mapOpen(){return $('sv-map').classList.contains('big')}
  function toggleMap(){
    var c=$('sv-map');if(mapOpen()){c.classList.remove('big');MV.drag=null;MV.hx=-1;lock();return}
    c.classList.add('big');MV.z=2.5;MV.cx=P.x;MV.cz=P.z;unlock();
  }
  var ALLISL=null;
  function islandList(){return [{x:0,z:0,r:HALF*.75,n:'Île du Départ',b:'main'}].concat(ISL)}
  function mapView(sz){var range=WORLDH*2.05/MV.z,lim=WORLDH-range/2;MV.cx=Math.max(-Math.max(0,lim),Math.min(Math.max(0,lim),MV.cx));MV.cz=Math.max(-Math.max(0,lim),Math.min(Math.max(0,lim),MV.cz));return {sc:sz/range,cx:MV.cx,cz:MV.cz}}
  (function(){
    var c=$('sv-map');
    function pt(e){var r=c.getBoundingClientRect();return [(e.clientX-r.left)/r.width*c.width,(e.clientY-r.top)/r.height*c.height]}
    c.addEventListener('wheel',function(e){if(!mapOpen())return;e.preventDefault();e.stopPropagation();var p=pt(e),v=mapView(c.width),wx=MV.cx+(p[0]-c.width/2)/v.sc,wz=MV.cz+(p[1]-c.height/2)/v.sc;
      var nz=Math.max(1,Math.min(9,MV.z*(e.deltaY>0?.82:1.22)));MV.z=nz;var v2=WORLDH*2.05/nz/c.width;MV.cx=wx-(p[0]-c.width/2)*v2;MV.cz=wz-(p[1]-c.height/2)*v2},{passive:false});
    c.addEventListener('mousedown',function(e){if(!mapOpen())return;e.preventDefault();e.stopPropagation();MV.drag={p:pt(e),cx:MV.cx,cz:MV.cz};c.classList.add('drag')});
    document.addEventListener('mousemove',function(e){if(!mapOpen())return;var p=pt(e);MV.hx=p[0];MV.hy=p[1];if(MV.drag){var v=mapView(c.width);MV.cx=MV.drag.cx-(p[0]-MV.drag.p[0])/v.sc;MV.cz=MV.drag.cz-(p[1]-MV.drag.p[1])/v.sc}});
    document.addEventListener('mouseup',function(){if(MV.drag){MV.drag=null;c.classList.remove('drag')}});
    c.addEventListener('mouseleave',function(){MV.hx=-1});
  })();
  function drawMap(){
    if(P.under){var c0=$('sv-map'),g0=c0.getContext('2d');c0.width=c0.height=300;g0.fillStyle='#1a1816';g0.fillRect(0,0,300,300);g0.fillStyle='#d4a32a';g0.font='700 30px IBM Plex Mono, monospace';g0.textAlign='center';g0.fillText('SOUS-SOL',150,140);g0.fillStyle='#f1ece2';g0.font='500 20px IBM Plex Mono, monospace';g0.fillText('l\'échelle te remonte',150,180);return}
    fogT-=1;if(fogT<=0){fogT=10;fogReveal(P.x,P.z,P.boat?80:60)}
    var c=$('sv-map'),big=mapOpen(),want=big?900:300;if(c.width!==want){c.width=c.height=want}
    var g=c.getContext('2d'),sz=c.width;
    if(!mapBase||mapBase.seed!==SEED)buildMapBase();
    var v=big?mapView(sz):{sc:sz/170,cx:P.x,cz:P.z},sc=v.sc,cx=v.cx,cz=v.cz,k=sz/300;
    function X(x){return (x-cx)*sc}function Z(z){return (z-cz)*sc}
    g.save();g.clearRect(0,0,sz,sz);
    if(!big){g.beginPath();g.arc(sz/2,sz/2,sz/2-1,0,7);g.clip()}
    g.fillStyle='#9a9892';g.fillRect(0,0,sz,sz);g.translate(sz/2,sz/2);
    g.imageSmoothingEnabled=true;g.drawImage(mapBase,X(-WORLDH),Z(-WORLDH),WORLDH*2*sc,WORLDH*2*sc);
    if(sc*TILE/TPX>.9){var made=0,hw=sz/2/sc,i0=Math.floor((cx-hw)/TILE),i1=Math.floor((cx+hw)/TILE),j0=Math.floor((cz-hw)/TILE),j1=Math.floor((cz+hw)/TILE);
      for(var tj=j0;tj<=j1;tj++)for(var ti=i0;ti<=i1;ti++){if(Math.abs(ti*TILE)>WORLDH+TILE||Math.abs(tj*TILE)>WORLDH+TILE)continue;var cx0=(ti+.5)*TILE,cz0=(tj+.5)*TILE;if(!fogSeen(cx0,cz0)&&!fogSeen(cx0-TILE/2,cz0-TILE/2)&&!fogSeen(cx0+TILE/2,cz0+TILE/2)&&!fogSeen(cx0-TILE/2,cz0+TILE/2)&&!fogSeen(cx0+TILE/2,cz0-TILE/2))continue;
        var tl=mapTile(ti,tj,false);if(!tl&&made<1){tl=mapTile(ti,tj,true);made++}if(!tl)continue;g.drawImage(tl,X(ti*TILE)-.5,Z(tj*TILE)-.5,TILE*sc+1,TILE*sc+1)}}
    if('filter' in g){g.filter='blur('+Math.max(1,Math.min(8,sc*3))+'px)'}
    g.drawImage(fogImage(),X(-WORLDH),Z(-WORLDH),WORLDH*2*sc,WORLDH*2*sc);
    if('filter' in g)g.filter='none';
    /* bord du monde */
    if(big){g.strokeStyle='rgba(20,18,16,.5)';g.lineWidth=2;g.strokeRect(X(-WORLDH),Z(-WORLDH),WORLDH*2*sc,WORLDH*2*sc)}
    boats.forEach(function(bt){if(!bt.built)return;g.save();g.translate(X(bt.x),Z(bt.z));g.rotate(-bt.yaw);g.fillStyle='#7a4e28';g.strokeStyle='#141210';g.lineWidth=1.2*k;g.beginPath();g.ellipse(0,0,2.6*k,5.5*k,0,0,7);g.fill();g.stroke();g.restore()});
    if(P.spawn){var bx=X(P.spawn.x),bz=Z(P.spawn.z),s=k*(big?1.2:1);g.fillStyle='#f1ece2';g.strokeStyle='#141210';g.lineWidth=1.5*s;g.beginPath();g.moveTo(bx,bz-6*s);g.lineTo(bx+5*s,bz-1*s);g.lineTo(bx+5*s,bz+5*s);g.lineTo(bx-5*s,bz+5*s);g.lineTo(bx-5*s,bz-1*s);g.closePath();g.fill();g.stroke()}
    Object.keys(remotes).forEach(function(id){var r=remotes[id];if(!r.ready)return;g.beginPath();g.arc(X(r.x),Z(r.z),4.5*k,0,7);g.fillStyle='#3fa9ff';g.fill();g.lineWidth=1.5*k;g.strokeStyle='#141210';g.stroke();if(big){g.font='600 '+(11*k|0)+'px IBM Plex Mono, monospace';g.fillStyle='#fff';g.textAlign='center';g.fillText(r.n||'',X(r.x),Z(r.z)-9*k)}});
    var ps=big?1.25*k:k;g.save();g.translate(X(P.x),Z(P.z));g.rotate(-P.yaw);g.fillStyle='#e2361b';g.strokeStyle='#141210';g.lineWidth=2*ps/k*k*.9;g.beginPath();g.moveTo(0,-9*ps);g.lineTo(6.5*ps,7*ps);g.lineTo(0,3*ps);g.lineTo(-6.5*ps,7*ps);g.closePath();g.fill();g.stroke();g.restore();
    g.restore();
    g.font='700 '+(14*k|0)+'px IBM Plex Mono, monospace';g.textAlign='center';g.textBaseline='middle';
    if(big){
      /* étiquette de l'île survolée */
      if(MV.hx>=0&&!MV.drag){var wx=cx+(MV.hx-sz/2)/sc,wz=cz+(MV.hy-sz/2)/sc,hit=null;islandList().forEach(function(I){if(Math.hypot(wx-I.x,wz-I.z)<I.r*1.05)hit=I});
        if(hit){var known=fogSeen(hit.x,hit.z)||Math.hypot(P.x-hit.x,P.z-hit.z)<hit.r,name=known?hit.n:'Île inconnue',sub=known?({main:'tempérée',jungle:'jungle',desert:'désert',neige:'neige',foret:'forêt'}[hit.b]||''):'pas encore explorée';
          g.font='700 26px Anton, Impact, sans-serif';var w=Math.max(g.measureText(name.toUpperCase()).width,140)+36,lx=Math.min(sz-w-10,MV.hx+18),ly=Math.max(10,MV.hy-74);
          g.fillStyle='#141210';g.fillRect(lx+5,ly+5,w,62);g.fillStyle='#f1ece2';g.fillRect(lx,ly,w,62);g.strokeStyle='#141210';g.lineWidth=2;g.strokeRect(lx,ly,w,62);
          g.textAlign='left';g.fillStyle=known?'#141210':'#6b6760';g.fillText(name.toUpperCase(),lx+18,ly+24);g.font='600 15px IBM Plex Mono, monospace';g.fillStyle='#e2361b';g.fillText(sub,lx+18,ly+48)}}
      g.font='700 14px IBM Plex Mono, monospace';g.textBaseline='middle';
      var pct=0;for(var i=0;i<FN*FN;i+=7)pct+=fog[i];pct=Math.round(pct/(FN*FN/7)*100);
      g.fillStyle='rgba(20,18,16,.86)';g.fillRect(12,sz-46,sz-24,34);g.textAlign='left';g.fillStyle='#f1ece2';g.font='600 16px IBM Plex Mono, monospace';
      g.fillText('Molette : zoom · glisser : bouger · survole une île',24,sz-29);g.textAlign='right';g.fillStyle='#d4a32a';g.fillText('exploré '+pct+' % · M : fermer',sz-24,sz-29);
      var nx=sz-28,ny=28;g.fillStyle='#141210';g.beginPath();g.arc(nx,ny,14,0,7);g.fill();g.fillStyle='#f1ece2';g.textAlign='center';g.font='700 15px IBM Plex Mono, monospace';g.fillText('N',nx,ny+1);
    }else{var nx2=sz/2,ny2=13*k;g.fillStyle='#141210';g.beginPath();g.arc(nx2,ny2,9*k,0,7);g.fill();g.fillStyle='#f1ece2';g.fillText('N',nx2,ny2+1);g.lineWidth=3;g.strokeStyle='#141210';g.beginPath();g.arc(sz/2,sz/2,sz/2-1.5,0,7);g.stroke()}
  }

  /* ---------- Plein écran ---------- */
  function goFull(){var f=PP.fs();if(f)f.toggle(stage)}
  function exitFull(){var f=PP.fs();if(f&&f.isOn(stage))f.exit()}

  /* ---------- Entrées ---------- */
  var KM={z:'F',w:'F',ArrowUp:'F',s:'B',ArrowDown:'B',q:'L',a:'L',ArrowLeft:'L',d:'R',ArrowRight:'R'};
  function menusOpen(){return mapOpen()||!$('sv-build').hidden||!$('sv-craft').hidden||!$('sv-invp').hidden||!$('sv-chest').hidden}
  document.addEventListener('keydown',function(e){
    if(PP.cur()!=='surv'||!running)return;if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;
    var k=e.key.length===1?e.key.toLowerCase():e.key;
    if(KM[k]){keys[KM[k]]=true;e.preventDefault()}if(k==='Shift')keys.SH=true;if(k===' '){keys.J=true;e.preventDefault()}
    if(e.repeat)return;
    if(!$('sv-chest').hidden&&(k==='e'||k==='Escape'||k==='Tab')){e.preventDefault();closeChest();return}if(k==='Tab'||k==='i'){e.preventDefault();invPanel();return}if(k==='e')interact();if(k==='f')eat();if(k==='h')heal();
    if(k==='b')buildMenu();if(k==='c')craftMenu();if(k==='p')goFull();
    if(k==='r'&&buildMode)ghostRot=(ghostRot+1)%4;
    if(k==='m')toggleMap();
    if(k>='0'&&k<='9'){var n=k==='0'?10:+k;
      if(!$('sv-build').hidden){var bk=Object.keys(BUILD)[n-1];if(bk){buildMode=bk;$('sv-build').hidden=true;lock()}}
      else if(!$('sv-craft').hidden)craft(n-1);
      else if(TORDER[n-1])setTool(TORDER[n-1])}
    if(k==='Escape'){if(mapOpen())toggleMap();buildMode=null;$('sv-build').hidden=true;$('sv-craft').hidden=true;$('sv-invp').hidden=true}
    hudInv();
  });
  document.addEventListener('keyup',function(e){var k=e.key.length===1?e.key.toLowerCase():e.key;if(KM[k])keys[KM[k]]=false;if(k==='Shift')keys.SH=false});
  window.addEventListener('blur',function(){keys={};mouseDown=false});
  cv.addEventListener('mousedown',function(e){
    if(!running)return;if(document.pointerLockElement!==cv){if(menusOpen()){if(mapOpen())$('sv-map').classList.remove('big');$('sv-build').hidden=true;$('sv-craft').hidden=true;$('sv-invp').hidden=true;$('sv-chest').hidden=true}lock();paused=false;$('sv-lockhint').hidden=true;return}
    if(e.button===0){if(buildMode&&ghost){build(buildMode,ghost.userData.x,ghost.userData.z,ghostRot);return}mouseDown=true;attack()}
    if(e.button===2){var t=interactTarget();if(t&&t.k==='box'&&t.o.store){Object.keys(t.o.store).forEach(function(k){inv[k]=(inv[k]||0)+t.o.store[k]});msg('Ressources reprises');t.o.store={};hudInv()}else if(buildMode){buildMode=null}}
  });
  document.addEventListener('mouseup',function(e){if(e.button===0)mouseDown=false});
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  cv.addEventListener('wheel',function(e){if(!running||buildMode)return;e.preventDefault();var own=TORDER.filter(function(t){return t==='axe'||inv[t]}),i=own.indexOf(tool);setTool(own[(i+(e.deltaY>0?1:-1)+own.length)%own.length])},{passive:false});
  document.addEventListener('mousemove',function(e){if(document.pointerLockElement!==cv||!P)return;var ss=.0025*PP.settings.sens/100;P.yaw-=e.movementX*ss;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-e.movementY*ss*(PP.settings.invY?-1:1)))});
  document.addEventListener('pointerlockchange',function(){if(PP.cur()!=='surv'||!running)return;var l=document.pointerLockElement===cv;$('sv-lockhint').hidden=l||menusOpen();if(!l&&!menusOpen()){paused=true;save();if(!online)PP.pause(true)}else paused=false});
  PP.pauseGuard('surv',function(){return running&&!menusOpen()});
  document.addEventListener('pp-resume',function(){if(PP.cur()!=='surv'||!running)return;lock();paused=false;$('sv-lockhint').hidden=true});
  document.addEventListener('pp-settings',function(){if(!cam)return;cam.fov=PP.settings.fov-3;cam.updateProjectionMatrix();applyQ()});
  function lock(){if(cv.requestPointerLock&&matchMedia('(hover:hover)').matches)try{var r=cv.requestPointerLock();if(r&&r.catch)r.catch(function(){})}catch(e){}}
  function unlock(){if(document.pointerLockElement===cv&&document.exitPointerLock)document.exitPointerLock()}
  var tl=null;
  cv.addEventListener('touchstart',function(e){var t=e.touches[0];tl={x:t.clientX,y:t.clientY}},{passive:true});
  cv.addEventListener('touchmove',function(e){if(!tl||!P)return;var t=e.touches[0];P.yaw-=(t.clientX-tl.x)*.006;P.pitch=Math.max(-1.4,Math.min(1.4,P.pitch-(t.clientY-tl.y)*.006));tl={x:t.clientX,y:t.clientY};e.preventDefault()},{passive:false});
  PP.held('sv-pad',{},function(k){if(k==='A'){mouseDown=true;attack()}if(k==='E')interact();if(k==='F2')eat();if(k==='F'||k==='B'||k==='L'||k==='R')keys[k]=true},function(k){if(k==='A')mouseDown=false;if(k==='F'||k==='B'||k==='L'||k==='R')keys[k]=false});

  function start(fresh){
    if(!init())return;
    if(fresh||!hasSave())newGame();else load();
    viewModel();hudInv();$('sv-ov').hidden=true;$('sv-build').hidden=true;$('sv-craft').hidden=true;$('sv-invp').hidden=true;buildMode=null;running=true;paused=false;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);lock();sfx.play('go');
    if(online&&auth){remotes={};net.broadcast(worldMsg());msg('Ton île est ouverte : salon '+net.code)}
  }
  $('sv-start').addEventListener('click',function(){if(hasSave()&&!confirm('Recommencer une nouvelle île ? Ta partie en cours sera effacée.'))return;start(true)});
  $('sv-cont').addEventListener('click',function(){start(false)});
  $('sv-online').addEventListener('click',goOnline);
  PP._sv=function(){return {houses:function(){return houseList},fog:function(){return fog},MV:MV,scene:function(){return scene},R3:function(){return R3},isl:function(){return ISL},boats:function(){return boats},boardBoat:boardBoat,height:height,traps:traps,castles:castles,goDown:goDown,chestPanel:chestPanel,remotes:remotes,online:function(){return online},trees:trees,drops:drops,invPanel:invPanel,P:P,inv:inv,st:st,zombies:zombies,animals:animals,structs:structs,chests:chests,setT:function(t){dayT=t},attack:attack,interact:interact,build:build,setTool:setTool,craft:craft,goal:function(){return goalI},render:render}};
  PP.games.surv={
    open:function(){$('sv-lockhint').hidden=true;
      if(net.inRoom()){if(online&&P&&scene&&!running&&!$('sv-ov').hidden===false){}if(online&&P&&scene&&$('sv-ov').hidden){running=true;last=0;raf=requestAnimationFrame(loop);return}online=true;auth=net.isHost;$('sv-online').hidden=true;
        if(!auth){$('sv-title').textContent='Survie à plusieurs';$('sv-msg').textContent='Connexion à l\'île de l\'hôte… Si rien ne se passe, l\'hôte doit lancer sa partie.';$('sv-start').hidden=true;$('sv-cont').hidden=true;$('sv-ov').hidden=false;net.send({t:'sv-hello'});return}}
      else{online=false;auth=true;$('sv-online').hidden=false}
      $('sv-start').hidden=false;var s=hasSave();$('sv-cont').hidden=!s;$('sv-start').textContent=s?'Nouvelle île':'Commencer';$('sv-title').textContent='Survie';
      $('sv-msg').textContent='Une grande île sauvage. Récolte, chasse, fabrique tes outils, construis ta base, mine le fer et trouve les pièces d\'une radio pour appeler les secours. La nuit, les zombies sortent. 14 objectifs à remplir.';$('sv-ov').hidden=false;if(online&&auth)$('sv-msg').textContent+=' Tu es l\'hôte : tes potes arrivent sur ton île dès que tu lances.';$('sv-best').textContent=PP.store('sv-best')},
    close:function(){if(running){save();running=false;cancelAnimationFrame(raf)}unlock();exitFull();keys={};mouseDown=false}
  };
})();
