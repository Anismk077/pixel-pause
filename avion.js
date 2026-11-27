/* Pixel Pause — Avion 3D (v89) : refait de zéro.
   Archipel avec village, piste, phare, forêts et montagnes ; pilotage assisté (l'avion se remet à plat tout seul
   et remonte s'il frôle le sol) ; 8 missions sauvegardées ; vol libre ; duel contre l'ordi ;
   combat aérien en salon (1v1 ou jusqu'à 6), chacun pilote sur son appareil. */
(function(){
  'use strict';
  var sfx=PP.sfx,esc=PP.esc,net=PP.net;
  var DESK=matchMedia('(hover:hover) and (pointer:fine)').matches;
  function lam(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))}
  function cl(v,a,b){return v<a?a:v>b?b:v}
  function wrap(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
  function rng(seed){var s=seed>>>0;return function(){s=(s+0x6D2B79F5)>>>0;var t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

  /* ---------- la carte : un archipel ---------- */
  var LIM=1150;
  var ISL=[[0,60,560,0],[-230,-170,230,95],[640,-430,300,70],[-660,400,330,40],[-420,-720,280,150],[580,620,250,30],[-860,-150,190,60],[260,-900,190,45]];
  function n2(x,z){return Math.sin(x*.021+Math.cos(z*.017)*1.7)*Math.cos(z*.019-Math.sin(x*.013))}
  function hgt(x,z){var h=-26;for(var i=0;i<ISL.length;i++){var I=ISL[i],dx=x-I[0],dz=z-I[1],d=(dx*dx+dz*dz)/(I[2]*I[2]);if(d>5)continue;h+=40*Math.exp(-d*1.1)+(I[3]?I[3]*Math.exp(-d*4.5)*(.75+.45*n2(x+i*91,z-i*57)):0)}
    h+=3.5*n2(x*1.7,z*1.7);
    /* piste d'atterrissage aplanie */
    var rx=Math.abs(x-150),rz=Math.abs(z-140);if(rx<30&&rz<130){var w=Math.min(1,(30-rx)/10)*Math.min(1,(130-rz)/20);h=h+(9-h)*w}
    return h}
  function ground(x,z){return Math.max(hgt(x,z),0)}

  var W=null;/* monde 3D, construit une seule fois */
  function buildWorld(sc){
    var g=new THREE.Group();
    /* ciel en dégradé */
    var sg=new THREE.SphereGeometry(4200,24,14),sp=sg.attributes.position,sc2=new Float32Array(sp.count*3),hz=new THREE.Color(0xd6ecf8),zn=new THREE.Color(0x2f7fd0),tmp=new THREE.Color();
    for(var i=0;i<sp.count;i++){var t=cl(sp.getY(i)/4200,0,1);tmp.copy(hz).lerp(zn,Math.pow(t,.55));sc2.set([tmp.r,tmp.g,tmp.b],i*3)}
    sg.setAttribute('color',new THREE.BufferAttribute(sc2,3));var sky=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));sky.renderOrder=-1;g.add(sky);g.userData.sky=sky;
    var sunM=new THREE.Mesh(new THREE.SphereGeometry(90,16,10),new THREE.MeshBasicMaterial({color:0xfff6d8,fog:false}));sunM.position.set(1600,1500,-2600);sky.add(sunM);
    /* relief */
    var geo=new THREE.PlaneGeometry(2700,2700,190,190);geo.rotateX(-Math.PI/2);var p=geo.attributes.position,col=new Float32Array(p.count*3),c=new THREE.Color();
    var SAND=new THREE.Color(0xe6d59e),WET=new THREE.Color(0x9fd6c8),GR=new THREE.Color(0x67ab4b),GR2=new THREE.Color(0x4b8f37),FO=new THREE.Color(0x356f2a),RO=new THREE.Color(0x8b8379),SN=new THREE.Color(0xf4f6f8),RUN=new THREE.Color(0x55585e);
    for(i=0;i<p.count;i++){var x=p.getX(i),z=p.getZ(i),h=hgt(x,z);p.setY(i,h);
      if(Math.abs(x-150)<11&&Math.abs(z-140)<120)c.copy(RUN);
      else if(h<-3)c.copy(WET).lerp(SAND,cl((h+14)/12,0,1));else if(h<3)c.copy(SAND);else if(h<30)c.copy(GR).lerp(GR2,(n2(x*3,z*3)+1)/2);else if(h<60)c.copy(GR2).lerp(FO,cl((h-30)/25,0,1));else if(h<95)c.copy(FO).lerp(RO,cl((h-60)/25,0,1));else c.copy(RO).lerp(SN,cl((h-95)/20,0,1));
      col.set([c.r,c.g,c.b],i*3)}
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();g.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true})));
    /* bandes blanches de la piste */
    var lm=new THREE.MeshBasicMaterial({color:0xf4f1e8});for(var k=0;k<11;k++){var st=new THREE.Mesh(new THREE.PlaneGeometry(1.2,9),lm);st.rotation.x=-Math.PI/2;st.position.set(150,9.25,40+k*20);g.add(st)}
    /* mer */
    var sea=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000),new THREE.MeshPhongMaterial({color:0x1f86c9,transparent:true,opacity:.8,shininess:90,specular:0x88bbff}));sea.rotation.x=-Math.PI/2;sea.position.y=0;g.add(sea);
    /* arbres (instanciés) */
    var R=rng(42),dm=new THREE.Object3D(),spots=[];
    for(k=0;k<2600&&spots.length<1100;k++){var tx=(R()-.5)*2300,tz=(R()-.5)*2300,th=hgt(tx,tz);if(th<5||th>70)continue;if(Math.abs(tx-150)<40&&Math.abs(tz-140)<150)continue;if(Math.hypot(tx-(-40),tz-260)<95)continue;spots.push([tx,th,tz,.7+R()*.8])}
    var tg=new THREE.ConeGeometry(3,9,6);tg.translate(0,6.5,0);var tk=new THREE.CylinderGeometry(.5,.6,3,5);tk.translate(0,1.5,0);
    var trees=new THREE.InstancedMesh(tg,lam(0xffffff,{flatShading:true}),spots.length),trunks=new THREE.InstancedMesh(tk,lam(0x6b4a2b),spots.length);
    spots.forEach(function(s,j){dm.position.set(s[0],s[1]-.5,s[2]);dm.scale.setScalar(s[3]);dm.rotation.y=j;dm.updateMatrix();trees.setMatrixAt(j,dm.matrix);trunks.setMatrixAt(j,dm.matrix);trees.setColorAt(j,new THREE.Color(j%3?0x3f8a36:0x52a040))});g.add(trees);g.add(trunks);
    /* village */
    var hs=[];for(k=0;k<400&&hs.length<46;k++){var a=R()*Math.PI*2,r=20+R()*80,hx=-40+Math.cos(a)*r,hz2=260+Math.sin(a)*r,hh=hgt(hx,hz2);if(hh<3)continue;var ok=hs.every(function(o){return Math.hypot(o[0]-hx,o[2]-hz2)>11});if(ok)hs.push([hx,hh,hz2,R()])}
    var hb=new THREE.BoxGeometry(7,5,6);hb.translate(0,2.5,0);var rf=new THREE.ConeGeometry(5.6,3.4,4);rf.rotateY(Math.PI/4);rf.translate(0,6.6,0);
    var hm=new THREE.InstancedMesh(hb,lam(0xffffff),hs.length),rm=new THREE.InstancedMesh(rf,lam(0xffffff,{flatShading:true}),hs.length),WALL=[0xf3ead8,0xe9d6b6,0xf6f1ea,0xdfe7ee],ROOF=[0xc0472c,0xa63a26,0x6d4b3a,0xd05a33];
    hs.forEach(function(o,j){dm.position.set(o[0],o[1]-.6,o[2]);dm.scale.set(1,.8+o[3]*.6,1);dm.rotation.y=o[3]*6;dm.updateMatrix();hm.setMatrixAt(j,dm.matrix);rm.setMatrixAt(j,dm.matrix);hm.setColorAt(j,new THREE.Color(WALL[j%4]));rm.setColorAt(j,new THREE.Color(ROOF[(j*7)%4]))});g.add(hm);g.add(rm);
    /* clocher */
    var cb=hgt(-40,260);var tow=new THREE.Mesh(new THREE.BoxGeometry(6,22,6),lam(0xeee4cf));tow.position.set(-40,cb+11,260);g.add(tow);var sp2=new THREE.Mesh(new THREE.ConeGeometry(4.8,10,4),lam(0x4a5a6a));sp2.rotation.y=Math.PI/4;sp2.position.set(-40,cb+27,260);g.add(sp2);
    /* phare */
    var lx=330,lz=-170,lh=Math.max(0,hgt(lx,lz));var ph=new THREE.Group();[0,1,2,3,4].forEach(function(j){var s=new THREE.Mesh(new THREE.CylinderGeometry(3.4-j*.3,3.6-j*.3,5,12),lam(j%2?0xd8322a:0xf4f1ea));s.position.y=2.5+j*5;ph.add(s)});
    var lamp=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,3,10),new THREE.MeshBasicMaterial({color:0xfff2a8}));lamp.position.y=26.5;ph.add(lamp);var cap=new THREE.Mesh(new THREE.ConeGeometry(2.8,3,10),lam(0x30343a));cap.position.y=29.5;ph.add(cap);ph.position.set(lx,lh,lz);g.add(ph);
    /* hangar près de la piste */
    var hg=new THREE.Mesh(new THREE.CylinderGeometry(9,9,22,14,1,false,0,Math.PI),lam(0x9aa3ad));hg.rotation.z=Math.PI/2;hg.rotation.y=Math.PI/2;hg.position.set(190,9,60);g.add(hg);
    /* rochers en mer */
    for(k=0;k<40;k++){var rx2=(R()-.5)*2400,rz2=(R()-.5)*2400;if(hgt(rx2,rz2)>-6)continue;var rk=new THREE.Mesh(new THREE.DodecahedronGeometry(3+R()*5,0),lam(0x7d776f,{flatShading:true}));rk.position.set(rx2,0,rz2);rk.scale.y=.7;g.add(rk)}
    /* nuages */
    var cm=lam(0xffffff,{flatShading:true,transparent:true,opacity:.95,emissive:0x8a95a5});
    for(k=0;k<70;k++){var cg=new THREE.Group(),nb=3+((R()*4)|0);for(var q=0;q<nb;q++){var s2=new THREE.Mesh(new THREE.IcosahedronGeometry(9+R()*10,1),cm);s2.position.set((q-nb/2)*11+R()*6,R()*5,R()*10-5);s2.scale.y=.6;cg.add(s2)}cg.position.set((R()-.5)*3000,150+R()*110,(R()-.5)*3000);g.add(cg)}
    /* bouées de la limite de zone */
    sc.add(g);return {g:g,sky:sky}
  }
  /* image de la mini-carte */
  var MAPI=null;function mapImg(){if(MAPI)return MAPI;var c=document.createElement('canvas');c.width=c.height=150;var x=c.getContext('2d'),im=x.createImageData(150,150);
    for(var j=0;j<150;j++)for(var i=0;i<150;i++){var wx=(i/150-.5)*2*LIM,wz=(j/150-.5)*2*LIM,h=hgt(wx,wz),o=(j*150+i)*4,r,gg,b;if(h<0){r=31;gg=110+Math.max(-40,h)*1.2|0;b=180}else if(h<3){r=226;gg=210;b=158}else if(h<60){r=88;gg=150;b=66}else if(h<95){r=120;gg=118;b=108}else{r=235;gg=238;b=240}im.data[o]=r;im.data[o+1]=gg;im.data[o+2]=b;im.data[o+3]=225}
    x.putImageData(im,0,0);MAPI=c;return c}

  /* ---------- l'avion ---------- */
  function makePlane(c1,c2,name){
    var g=new THREE.Group(),m1=lam(c1),m2=lam(c2),dk=lam(0x26282c);
    var pr=[[.04,-3.3],[.22,-2.8],[.4,-1.4],[.58,0],[.64,1.3],[.6,2.3],[.48,2.95]].map(function(a){return new THREE.Vector2(a[0],a[1])});
    var bg=new THREE.LatheGeometry(pr,16);bg.rotateX(-Math.PI/2);var body=new THREE.Mesh(bg,m1);g.add(body);
    var cowl=new THREE.Mesh(new THREE.CylinderGeometry(.5,.62,.5,16,1,true),dk);cowl.rotation.x=Math.PI/2;cowl.position.z=-3.05;g.add(cowl);
    var spin=new THREE.Mesh(new THREE.ConeGeometry(.22,.6,12),m2);spin.rotation.x=-Math.PI/2;spin.position.z=-3.45;g.add(spin);
    var prop=new THREE.Group();[0,1].forEach(function(i){var b=new THREE.Mesh(new THREE.BoxGeometry(.18,1.9,.06),dk);b.rotation.z=i*Math.PI/2;prop.add(b)});prop.position.z=-3.32;g.add(prop);
    var disc=new THREE.Mesh(new THREE.CircleGeometry(1.05,20),new THREE.MeshBasicMaterial({color:0xdddddd,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}));disc.position.z=-3.34;g.add(disc);
    var wing=new THREE.Mesh(new THREE.BoxGeometry(9,.16,1.6),m2);wing.position.set(0,-.18,-.5);g.add(wing);
    [-1,1].forEach(function(s){var tip=new THREE.Mesh(new THREE.BoxGeometry(.9,.18,1.62),m1);tip.position.set(s*4.1,-.18,-.5);g.add(tip);
      var rd=new THREE.Mesh(new THREE.CircleGeometry(.5,16),lam(0xffffff));rd.rotation.x=-Math.PI/2;rd.position.set(s*2.6,-.09,-.5);g.add(rd);var rd2=new THREE.Mesh(new THREE.CircleGeometry(.28,16),m1);rd2.rotation.x=-Math.PI/2;rd2.position.set(s*2.6,-.08,-.5);g.add(rd2);
      var gun=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.7,6),dk);gun.rotation.x=Math.PI/2;gun.position.set(s*1.6,-.24,-1.4);g.add(gun);
      var st=new THREE.Mesh(new THREE.BoxGeometry(.08,.7,.12),dk);st.position.set(s*.7,-.75,-1.1);g.add(st);var wh=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.16,12),dk);wh.rotation.z=Math.PI/2;wh.position.set(s*.75,-1.1,-1.1);g.add(wh)});
    var hs=new THREE.Mesh(new THREE.BoxGeometry(3.2,.12,.9),m2);hs.position.set(0,.05,2.7);g.add(hs);
    var fin=new THREE.Mesh(new THREE.BoxGeometry(.12,1.3,1.1),m1);fin.position.set(0,.7,2.8);fin.rotation.x=-.25;g.add(fin);
    var can=new THREE.Mesh(new THREE.SphereGeometry(.45,14,10),new THREE.MeshPhongMaterial({color:0x9fd8ff,transparent:true,opacity:.75,shininess:120}));can.scale.set(1,.85,2);can.position.set(0,.5,-.5);g.add(can);
    var stripe=new THREE.Mesh(new THREE.CylinderGeometry(.62,.63,.35,16,1,true),m2);stripe.rotation.x=Math.PI/2;stripe.position.z=1.1;g.add(stripe);
    if(name){var tc=document.createElement('canvas');tc.width=256;tc.height=64;var x=tc.getContext('2d');x.font='700 34px Inter, Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=6;x.strokeStyle='rgba(0,0,0,.7)';x.strokeText(name,128,32);x.fillStyle='#fff';x.fillText(name,128,32);
      var spr=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(tc),depthTest:false,transparent:true}));spr.scale.set(10,2.5,1);spr.position.y=3.6;g.add(spr)}
    g.userData.prop=prop;return g}

  /* ---------- missions ---------- */
  var LV=[
    {n:'Baptême de l\'air',d:'Passe dans 6 anneaux. Prends ton temps.',rings:6,time:120},
    {n:'Tour de l\'île',d:'10 anneaux autour de l\'île.',rings:10,time:150},
    {n:'Fête foraine',d:'Éclate 12 ballons avec tes mitrailleuses.',balloons:12,time:120},
    {n:'Le canyon',d:'8 anneaux bas, entre les montagnes.',rings:8,time:140,low:1,at:[-420,-560]},
    {n:'Premier duel',d:'Abats l\'avion rouge.',bots:1,time:180,lvl:0},
    {n:'Course et ballons',d:'8 anneaux et 8 ballons.',rings:8,balloons:8,time:180},
    {n:'Escadrille',d:'Abats 3 avions.',bots:3,time:220,lvl:1},
    {n:'As du ciel',d:'5 avions qui visent bien.',bots:5,time:300,lvl:2}
  ];
  function unl(){return cl(PP.store('plane-lv')|0,0,LV.length-1)}

  var S=null,CC=null;
  var BOTC=[[0xc8322a,0x2a2a2a],[0x3a3f46,0xd23b2b],[0x7a3fb0,0xf1ece2],[0x2b8a4a,0xf3c623],[0xe07a1f,0x2a2a2a]];
  var PCOL=[[0xe2361b,0xf1ece2],[0x2d7fd6,0xf1ece2],[0x2fae5a,0xf3c623],[0xf3c623,0x2a2a2a],[0x8a3fd0,0xf1ece2],[0xe07a1f,0x2a2a2a]];

  function newPlane(x,y,z,yaw,col,name){var m=makePlane(col[0],col[1],name);S.dyn.add(m);return {x:x,y:y,z:z,yaw:yaw,pitch:0,roll:0,sp:50,hp:100,alive:true,mesh:m,cd:0,inv:0,boost:1,rt:0}}
  function fly(p,tx,ty,bo,dt,bot){
    p.roll+=(tx*.85-p.roll)*Math.min(1,dt*3.2);p.yaw=wrap(p.yaw+p.roll*dt*1.35);
    var tp=ty*.62,fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw),clr=p.y-Math.max(ground(p.x,p.z),ground(p.x+fx*45,p.z+fz*45),ground(p.x+fx*90,p.z+fz*90)*.9);
    if(clr<24)tp=Math.max(tp,(24-clr)/24*.75);if(p.y>260)tp=Math.min(tp,0);
    p.pitch+=(tp-p.pitch)*Math.min(1,dt*2.6);
    var ts=50*(bo?1.65:1);p.sp+=(ts-p.sp)*Math.min(1,dt*1.8);
    var cp=Math.cos(p.pitch);p.x+=fx*cp*p.sp*dt;p.z+=fz*cp*p.sp*dt;p.y+=Math.sin(p.pitch)*p.sp*dt;
    p.mesh.position.set(p.x,p.y,p.z);p.mesh.rotation.set(p.pitch,p.yaw,p.roll,'YXZ');p.mesh.userData.prop.rotation.z+=dt*45}
  function backHome(p){var r=Math.hypot(p.x,p.z);if(r<LIM-60)return null;var want=Math.atan2(p.x,p.z);return cl(wrap(want-p.yaw)*2,-1,1)}

  /* ---------- tirs, effets ---------- */
  var BG=null,BM=null;
  function shoot(p,own,targets,col){
    if(p.cd>0)return;p.cd=.11;p.side=-(p.side||1);
    var fx=-Math.sin(p.yaw)*Math.cos(p.pitch),fy=Math.sin(p.pitch),fz=-Math.cos(p.yaw)*Math.cos(p.pitch),rx=Math.cos(p.yaw),rz=-Math.sin(p.yaw);
    var ox=p.x+rx*1.6*p.side+fx*2,oy=p.y-.2+fy*2,oz=p.z+rz*1.6*p.side+fz*2;
    /* petite aide à la visée : si une cible est presque en face, les balles partent vers elle */
    var best=null,bd=.11;(targets||[]).forEach(function(t){if(!t.alive)return;var dx=t.x-p.x,dy=t.y-p.y,dz=t.z-p.z,d=Math.hypot(dx,dy,dz);if(d>340||d<5)return;var dot=(dx*fx+dy*fy+dz*fz)/d,a=Math.acos(cl(dot,-1,1));if(a<bd){bd=a;best=[t,d]}});
    var V=340,vx=fx*V,vy=fy*V,vz=fz*V;if(best){var t=best[0],tt=best[1]/V,tvx=t.vx||0,tvy=t.vy||0,tvz=t.vz||0,ax=t.x+tvx*tt-ox,ay=t.y+tvy*tt-oy,az=t.z+tvz*tt-oz,L=Math.hypot(ax,ay,az);vx=ax/L*V;vy=ay/L*V;vz=az/L*V}
    addBullet(ox,oy,oz,vx+fx*p.sp,vy+fy*p.sp,vz+fz*p.sp,own,col);
    if(own==='me'){sfx.play('shoot');if(S.mode==='online')net.relay({t:'pl-f',id:net.me.id,p:[r1(ox),r1(oy),r1(oz),r1(vx+fx*p.sp),r1(vy+fy*p.sp),r1(vz+fz*p.sp)]})}}
  function r1(v){return Math.round(v*10)/10}
  function addBullet(x,y,z,vx,vy,vz,own,col){if(!BG){BG=new THREE.BoxGeometry(.22,.22,5)}var m=S.bpool.pop();if(!m){m=new THREE.Mesh(BG,new THREE.MeshBasicMaterial({color:0xffe066}))}m.material.color.setHex(col||0xffe066);m.visible=true;S.dyn.add(m);m.position.set(x,y,z);m.lookAt(x+vx,y+vy,z+vz);S.bul.push({m:m,x:x,y:y,z:z,vx:vx,vy:vy,vz:vz,t:1.15,own:own})}
  function segHit(b,px,py,pz,nx,ny,nz,t,R){var dx=nx-px,dy=ny-py,dz=nz-pz,L2=dx*dx+dy*dy+dz*dz||1,u=cl(((t.x-px)*dx+(t.y-py)*dy+(t.z-pz)*dz)/L2,0,1),cx=px+dx*u-t.x,cy=py+dy*u-t.y,cz=pz+dz*u-t.z;return cx*cx+cy*cy+cz*cz<R*R}
  function boom(x,y,z,big){var n=big?14:5;for(var i=0;i<n;i++){var m=new THREE.Mesh(new THREE.IcosahedronGeometry(big?2.2:.8,0),new THREE.MeshBasicMaterial({color:i%3?0xff8a1e:0xffd34a,transparent:true}));m.position.set(x,y,z);S.dyn.add(m);var a=Math.random()*6.28,b=Math.random()*3.14,v=(big?22:9)*(.4+Math.random());S.fx.push({m:m,vx:Math.cos(a)*Math.sin(b)*v,vy:Math.cos(b)*v,vz:Math.sin(a)*Math.sin(b)*v,t:0,life:big?1.1:.4})}
    if(big){for(i=0;i<6;i++){var s=new THREE.Mesh(new THREE.IcosahedronGeometry(2.6,0),new THREE.MeshBasicMaterial({color:0x444444,transparent:true,opacity:.6}));s.position.set(x,y,z);S.dyn.add(s);S.fx.push({m:s,vx:(Math.random()-.5)*6,vy:3+Math.random()*4,vz:(Math.random()-.5)*6,t:0,life:2,smoke:1})}}}

  /* ---------- objectifs ---------- */
  function addRing(x,y,z,nx,ny,nz){var m=new THREE.Mesh(new THREE.TorusGeometry(8,.7,10,40),lam(0xf3c623,{emissive:0x6a4c00}));m.position.set(x,y,z);m.lookAt(nx,ny,nz);S.dyn.add(m);var r={x:x,y:y,z:z,m:m,done:false,alive:true};S.rings.push(r);return r}
  function addBalloon(x,y,z,c){var g=new THREE.Group(),b=new THREE.Mesh(new THREE.SphereGeometry(3,16,12),new THREE.MeshPhongMaterial({color:c,shininess:80}));b.scale.y=1.15;g.add(b);var k=new THREE.Mesh(new THREE.ConeGeometry(.5,.9,8),lam(c));k.rotation.x=Math.PI;k.position.y=-3.6;g.add(k);
    var st=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,8,4),lam(0xffffff));st.position.y=-8;g.add(st);g.position.set(x,y,z);S.dyn.add(g);var o={x:x,y:y,z:z,y0:y,m:g,alive:true,ph:Math.random()*6};S.balls.push(o);return o}
  function routeRings(n,low,seed,at){var R=rng(seed),x,z,dir,pts=[];
    if(at){x=at[0];z=at[1];dir=Math.atan2(S.me.x-x,S.me.z-z)+Math.PI}else{dir=S.me.yaw;x=S.me.x-Math.sin(dir)*130;z=S.me.z-Math.cos(dir)*130}
    for(var i=0;i<n;i++){var g=ground(x,z),y=low?g+16+R()*12:Math.max(g+35,45+R()*70);pts.push([x,Math.min(y,230),z]);
      dir+=(R()-.5)*(low?1.1:.9);if(Math.hypot(x,z)>LIM-260)dir+=wrap(Math.atan2(x,z)-dir)*.7;var st=low?100+R()*30:130+R()*40;x-=Math.sin(dir)*st;z-=Math.cos(dir)*st}
    pts.forEach(function(p,i){var q=pts[i+1]||[p[0]-Math.sin(dir)*50,p[1],p[2]-Math.cos(dir)*50];addRing(p[0],p[1],p[2],q[0],q[1],q[2])})}
  function botAt(i,lvl){var a=i*1.3+.6,x=Math.sin(a)*500,z=-Math.cos(a)*300-200;var b=newPlane(x,110+i*12,z,Math.atan2(x-S.me.x,z-S.me.z),BOTC[i%BOTC.length],'');b.lvl=lvl;b.bot=1;b.think=0;b.tx=0;b.ty=0;S.bots.push(b);return b}
  function botStep(b,dt,tg){
    var dx=tg.x-b.x,dy=tg.y-b.y,dz=tg.z-b.z,d=Math.hypot(dx,dz)||1,want=Math.atan2(-dx,-dz),dy2=wrap(want-b.yaw),wp=Math.atan2(dy,d);
    b.think-=dt;if(b.think<=0){b.think=.15+(2-b.lvl)*.08;b.tx=cl(dy2*2.2,-1,1);b.ty=cl((wp-b.pitch)*3,-1,1);
      /* esquive quand on lui tire dessus de près */
      if(b.evade>0){b.tx=b.ev;b.ty=.6}}
    var h=backHome(b);var tx=h!=null?h:b.tx;b.evade=(b.evade||0)-dt;
    fly(b,tx,b.ty,d>260,dt*(.86+b.lvl*.07),true);b.cd-=dt;
    var dist=Math.hypot(dx,dy,dz);if(tg.alive&&Math.abs(dy2)<.09+b.lvl*.02&&Math.abs(wp-b.pitch)<.16&&dist<280&&Math.random()<dt*(2.5+b.lvl*2.5)){b.cd=Math.max(b.cd,0);var sv=b.sp;shoot(b,'bot',[],0xff6a4a);b.sp=sv}}

  /* ---------- HUD 2D : mini-carte et flèche ---------- */
  function radar(){var st=CC.cv.parentNode,r=st.querySelector('.pl-radar');if(!r){r=document.createElement('canvas');r.className='pl-radar';r.width=r.height=150;st.appendChild(r)}return r}
  function drawRadar(){var r=radar(),x=r.getContext('2d');r.hidden=!CC.running;if(!CC.running)return;x.clearRect(0,0,150,150);x.save();x.beginPath();x.arc(75,75,74,0,7);x.clip();x.drawImage(mapImg(),0,0);
    function pt(o){return [(o.x/LIM/2+.5)*150,(o.z/LIM/2+.5)*150]}
    function dot(o,c,s){var p=pt(o);x.fillStyle=c;x.beginPath();x.arc(p[0],p[1],s,0,7);x.fill()}
    S.rings.forEach(function(o){if(!o.done)dot(o,'#f3c623',3)});S.balls.forEach(function(o){if(o.alive)dot(o,'#ff5fa2',3)});S.bots.forEach(function(o){if(o.alive)dot(o,'#ff3b2f',3.5)});
    Object.keys(S.rem).forEach(function(k){var o=S.rem[k];if(o.alive)dot(o,'#ff3b2f',3.5)});
    var p=pt(S.me);x.translate(p[0],p[1]);x.rotate(-S.me.yaw);x.fillStyle='#fff';x.strokeStyle='#141210';x.lineWidth=1.5;x.beginPath();x.moveTo(0,-6);x.lineTo(4.5,5);x.lineTo(0,3);x.lineTo(-4.5,5);x.closePath();x.fill();x.stroke();x.restore();
    x.strokeStyle='rgba(255,255,255,.8)';x.lineWidth=2;x.beginPath();x.arc(75,75,73,0,7);x.stroke()}
  var CSS=document.createElement('style');CSS.textContent='.stage canvas.pl-radar{position:absolute!important;left:auto!important;top:auto!important;right:10px!important;bottom:10px!important;width:min(19%,150px)!important;height:auto!important;aspect-ratio:1;border:0!important;box-shadow:none!important;border-radius:50%;pointer-events:none;z-index:3;filter:drop-shadow(0 2px 6px rgba(0,0,0,.4))}'+
    '.pl-lv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:10px auto 0;max-width:460px}.pl-lv button{font:600 12.5px var(--font,Inter),sans-serif;padding:8px 10px;border-radius:10px;border:2px solid #f1ece2;background:rgba(20,18,16,.55);color:#f1ece2;text-align:left;cursor:pointer}.pl-lv button.on{background:#f3c623;color:#141210;border-color:#f3c623}.pl-lv button:disabled{opacity:.35;cursor:default}'+
    '.pl-bar{position:absolute;left:10px;bottom:10px;display:flex;flex-direction:column;gap:5px;z-index:3;pointer-events:none;width:min(30%,190px)}.pl-bar i{display:block;height:9px;border-radius:5px;background:rgba(20,18,16,.5);overflow:hidden;border:1.5px solid rgba(255,255,255,.75)}.pl-bar i b{display:block;height:100%;background:#3fe09a;transition:width .15s}.pl-bar i.bo b{background:#3fa9ff}'+
    '.pl-msg{position:absolute;left:50%;top:14%;transform:translateX(-50%);z-index:3;font:700 15px var(--font,Inter),sans-serif;color:#fff;text-shadow:0 2px 4px #000;pointer-events:none;text-align:center}'+
    '.pl-res{margin:8px auto 0;border-collapse:collapse;font:600 14px var(--font,Inter),sans-serif}.pl-res td{padding:3px 10px}';document.head.appendChild(CSS);
  function bars(){var st=CC.cv.parentNode,b=st.querySelector('.pl-bar');if(!b){b=document.createElement('div');b.className='pl-bar';b.innerHTML='<i class="hp"><b></b></i><i class="bo"><b></b></i>';st.appendChild(b);var m=document.createElement('div');m.className='pl-msg';st.appendChild(m)}
    b.hidden=!CC.running;if(!CC.running)return;b.querySelector('.hp b').style.width=Math.max(0,S.me.hp)+'%';b.querySelector('.hp b').style.background=S.me.hp<35?'#e2361b':'#3fe09a';b.querySelector('.bo b').style.width=(S.me.boost*100)+'%'}
  function msg(t){var m=CC.cv.parentNode.querySelector('.pl-msg');if(m)m.textContent=t||''}

  /* ---------- la partie ---------- */
  function clearDyn(){if(S&&S.dyn){CC.scene.remove(S.dyn)}}
  function fresh(C){clearDyn();var keep=S||{};S={mode:C.mode,lv:keep.lv!=null?keep.lv:unl(),dyn:new THREE.Group(),bul:[],bpool:[],fx:[],rings:[],balls:[],bots:[],rem:{},kills:{},score:0,time:0,arrow:null,mouse:null,mOn:false,mdown:false,hudT:0,ended:false,sendT:0};C.scene.add(S.dyn);
    S.me=newPlane(150,40,330,0,PCOL[0],'');S.me.id='me';
    var ar=new THREE.ConeGeometry(.9,3.2,10);ar.rotateX(Math.PI/2);S.arrow=new THREE.Mesh(ar,new THREE.MeshBasicMaterial({color:0xf3c623,transparent:true,opacity:.85,depthTest:false}));S.arrow.renderOrder=5;S.dyn.add(S.arrow);
    return S}
  function camSnap(C){var p=S.me,bx=Math.sin(p.yaw)*16,bz=Math.cos(p.yaw)*16;C.cam.position.set(p.x+bx,p.y+5,p.z+bz);C.cam.lookAt(p.x,p.y+1.5,p.z)}
  function intro(C){
    var m=S.mode,html;
    if(m==='niveaux'){var u=unl();html='<span>Choisis ta mission :</span><div class="pl-lv">'+LV.map(function(l,i){return '<button type="button" data-pl-lv="'+i+'"'+(i>u?' disabled':'')+(i===S.lv?' class="on"':'')+'>'+(i>u?'🔒 ':'')+(i+1)+'. '+l.n+'</button>'}).join('')+'</div>';
      C.over('Mission '+(S.lv+1)+' · '+LV[S.lv].n,LV[S.lv].d+'<br>'+html,'Décoller')}
    else if(m==='libre')C.over('Vol libre','Toute l\'île est à toi. Chaque anneau doré donne des points et 5 s de carburant.<br>Record : <b>'+C.best('pts')+'</b>','Décoller');
    else if(m==='bot')C.over('Duel contre l\'ordi','Le premier à abattre l\'autre 3 fois gagne. Les balles visent un peu toutes seules quand l\'ennemi est en face.','Décoller');
    else onlineLobby(C)}
  function ctrlText(C){C.keysText('<kbd>←</kbd><kbd>→</kbd> ou <kbd>Q</kbd><kbd>D</kbd> tourner · <kbd>↑</kbd><kbd>↓</kbd> ou <kbd>Z</kbd><kbd>S</kbd> monter / descendre · <kbd>Espace</kbd> ou clic : tirer · <kbd>Maj</kbd> turbo · la souris pilote aussi. L\'avion se remet à plat tout seul et remonte s\'il frôle le sol.')}

  function startGame(C){fresh(C);var m=S.mode;S.time=0;
    if(m==='niveaux'){var L=LV[S.lv];S.limit=L.time;if(L.rings)routeRings(L.rings,L.low,S.lv*977+3,L.at);if(L.balloons){var R=rng(S.lv*31+5),BC=[0xff4f8b,0x3fa9ff,0xf3c623,0x3fe09a,0xb565ff];for(var i=0;i<L.balloons;i++){var a=R()*6.28,r=150+R()*550,x=Math.sin(a)*r,z=Math.cos(a)*r-80;addBalloon(x,Math.max(ground(x,z)+30,50+R()*80),z,BC[i%5])}}
      if(L.bots)for(i=0;i<L.bots;i++)botAt(i,L.lvl)}
    else if(m==='libre'){S.fuel=45;S.next=null;for(var k=0;k<4;k++)moreRing()}
    else if(m==='bot'){S.score=0;S.foe=0;botAt(0,1)}
    else if(m==='online'){S.limit=180;spawnOnline()}
    camSnap(C)}
  function moreRing(){var last=S.rings.filter(function(r){return !r.done}).slice(-1)[0],p=last||S.me,dir=last?last.dir:S.me.yaw,R=Math.random;dir+=(R()-.5)*1.1;var x=p.x-Math.sin(dir)*(140+R()*40),z=p.z-Math.cos(dir)*(140+R()*40);if(Math.hypot(x,z)>LIM-200){dir=Math.atan2(x,z);x=p.x-Math.sin(dir)*150;z=p.z-Math.cos(dir)*150}
    var y=cl(Math.max(ground(x,z)+35,(p.y||80)+(R()-.5)*50),40,220);var r=addRing(x,y,z,x-Math.sin(dir)*50,y,z-Math.cos(dir)*50);r.dir=dir}

  /* combat en salon */
  function slotOf(id){return net.slot(id)}
  function spawnOnline(){var n=Math.max(2,net.players.length),i=Math.max(0,slotOf(net.me.id)),a=i/n*Math.PI*2,x=Math.sin(a)*520,z=Math.cos(a)*520;
    var me=S.me;me.x=x;me.z=z;me.y=120;me.yaw=Math.atan2(x,z);me.pitch=0;me.roll=0;me.hp=100;me.alive=true;me.inv=2.5;me.mesh.visible=true;
    S.dyn.remove(me.mesh);me.mesh=makePlane(PCOL[i%6][0],PCOL[i%6][1],'');S.dyn.add(me.mesh)}
  function remote(id){var o=S.rem[id];if(o)return o;var i=Math.max(0,slotOf(id)),pl=net.players[i]||{name:'?'};var m=makePlane(PCOL[i%6][0],PCOL[i%6][1],pl.name||'?');S.dyn.add(m);o=S.rem[id]={id:id,x:0,y:-999,z:0,yaw:0,pitch:0,roll:0,tx:0,ty:-999,tz:0,alive:false,mesh:m,vx:0,vy:0,vz:0,name:pl.name||'?'};m.visible=false;return o}
  function pname(id){if(id===net.me.id)return 'Toi';var p=net.players[slotOf(id)];return p?p.name:'?'}
  function onlineLobby(C){var n=net.players.length,host=net.isHost;
    var list=net.players.map(function(p,i){return '<b style="color:#'+PCOL[i%6][0].toString(16).padStart(6,'0')+'">'+esc(p.name||'?')+'</b>'}).join(' · ');
    C.over('Combat aérien en salon',(n<2?'Il faut au moins 2 joueurs dans le salon.<br>':'')+'Pilotes : '+list+'<br>Le premier à 5 avions abattus gagne (3 minutes max). Avec 2 joueurs, c\'est un vrai 1 contre 1.'+(host?'':'<br><i>L\'hôte lance le combat.</i>'),host&&n>=2?'Lancer le combat':false,host?function(){var seed=(Math.random()*1e9)|0;net.relay({t:'pl-go',seed:seed});goOnline(C)}:null)}
  function goOnline(C){S.mode='online';startGame(C);C.go()}
  function onNet(C,m){
    if(m.t==='players'){Object.keys(S.rem).forEach(function(id){if(slotOf(id)<0){S.dyn.remove(S.rem[id].mesh);delete S.rem[id]}});if(!C.running&&!S.ended)onlineLobby(C);return}
    if(m.t!=='rel'||!m.d)return;var d=m.d;
    if(d.t==='pl-go'){goOnline(C);return}
    if(!C.running&&d.t!=='pl-k')return;
    if(d.t==='pl-s'){var o=remote(d.id);o.tx=d.p[0];o.ty=d.p[1];o.tz=d.p[2];o.yaw=d.p[3];o.pitch=d.p[4];o.roll=d.p[5];o.vx=d.p[6];o.vy=d.p[7];o.vz=d.p[8];if(!o.alive&&d.a){o.x=o.tx;o.y=o.ty;o.z=o.tz}o.alive=!!d.a;o.mesh.visible=o.alive;o.hp=d.h}
    else if(d.t==='pl-f'){addBullet(d.p[0],d.p[1],d.p[2],d.p[3],d.p[4],d.p[5],d.id,0xff9a5a)}
    else if(d.t==='pl-k'){var v=S.rem[d.id];if(v){boom(v.x,v.y,v.z,true);v.alive=false;v.mesh.visible=false}if(d.by)S.kills[d.by]=(S.kills[d.by]||0)+1;
      if(d.by===net.me.id){CC.pop('Abattu !','#f3c623','52px');sfx.play('kill')}else msg(pname(d.id)+(d.by?' abattu par '+pname(d.by):' s\'est écrasé'));
      checkWin()}}
  function checkWin(){if(S.ended)return;var top=null;Object.keys(S.kills).forEach(function(k){if(S.kills[k]>=5)top=k});if(top||S.time>=S.limit)endOnline()}
  function endOnline(){S.ended=true;CC.stop();var rows=net.players.map(function(p){return [p.id,p.name,S.kills[p.id]||0,(S.deaths&&S.deaths[p.id])||0]}).sort(function(a,b){return b[2]-a[2]});
    var win=rows[0]&&rows[0][0]===net.me.id&&rows[0][2]>0;if(win){C_win();sfx.play('win')}else sfx.play('lose');
    CC.over(win?'Tu gagnes le combat !':'Fin du combat','<table class="pl-res">'+rows.map(function(r,i){return '<tr><td>'+(i+1)+'.</td><td>'+esc(r[1]||'?')+(r[0]===net.me.id?' (toi)':'')+'</td><td><b>'+r[2]+'</b> abattus</td></tr>'}).join('')+'</table>',net.isHost?'Revanche':false,net.isHost?function(){net.relay({t:'pl-go',seed:1});goOnline(CC)}:null)}
  function C_win(){CC.win()}

  function endLocal(ok,title,txt){var C=CC;C.stop();S.ended=true;
    if(S.mode==='niveaux'){if(ok){sfx.play('win');var nx=Math.min(LV.length-1,S.lv+1);if(S.lv+1>unl())PP.store('plane-lv',Math.min(LV.length-1,S.lv+1));if(S.lv===LV.length-1)C.win();
        var last=S.lv===LV.length-1;C.over(last?'Toutes les missions réussies !':'Mission réussie !',txt+(last?'<br>Tu es un vrai as du ciel.':''),last?'Rejouer':'Mission suivante',function(){if(!last)S.lv=nx;startGame(C);C.go()})}
      else{sfx.play('lose');C.over(title,txt,'Réessayer',function(){startGame(C);C.go()})}}
    else if(S.mode==='libre'){var nb=C.best('pts',S.score);if(S.score>=1500)C.win();C.over(title,'Score : <b>'+S.score+'</b>'+(nb?' · nouveau record !':''),'Redécoller',function(){startGame(C);C.go()})}
    else if(S.mode==='bot'){if(ok){C.win();sfx.play('win')}else sfx.play('lose');C.over(ok?'Victoire !':'Défaite…','Toi <b>'+S.score+'</b> – <b>'+S.foe+'</b> ordi','Revanche',function(){startGame(C);C.go()})}}

  function die(C,why,by){var me=S.me;if(!me.alive)return;me.alive=false;me.mesh.visible=false;boom(me.x,me.y,me.z,true);sfx.play('crash');C.shake(10);
    if(S.mode==='niveaux'){setTimeout(function(){if(S.ended||CC.mode!=='niveaux')return;endLocal(false,why,'La mission « '+LV[S.lv].n+' » a raté. Retente ta chance !')},1200)}
    else if(S.mode==='libre'){setTimeout(function(){if(!S.ended)endLocal(false,why,'')},1000)}
    else if(S.mode==='bot'){S.foe+=1;msg(why);if(S.foe>=3){setTimeout(function(){if(!S.ended)endLocal(false)},1000)}else setTimeout(function(){respawnMe()},2200)}
    else if(S.mode==='online'){var killer=by&&by!=='bot'&&by!=='me'?by:null;net.relay({t:'pl-k',id:net.me.id,by:killer});if(killer)S.kills[killer]=(S.kills[killer]||0)+1;checkWin();S.deaths=S.deaths||{};S.deaths[net.me.id]=(S.deaths[net.me.id]||0)+1;msg(why);setTimeout(function(){if(!S.ended&&CC.running){spawnOnline();msg('')}},3000)}}
  function respawnMe(){var me=S.me;me.x=150;me.z=330;me.y=110;me.yaw=0;me.pitch=0;me.roll=0;me.hp=100;me.alive=true;me.inv=2;me.mesh.visible=true;msg('')}

  PP.arcade({id:'plane',three:true,
    setup:function(C){CC=C;PP.ag.three(C);if(!W){var sc=C.scene;while(sc.children.length)sc.remove(sc.children[0]);
        sc.add(new THREE.HemisphereLight(0xeaf4ff,0x5b6b4a,.95));var sun=new THREE.DirectionalLight(0xfff1d6,1.25);sun.position.set(400,700,-500);sc.add(sun);
        sc.fog=new THREE.Fog(0xd6ecf8,700,2600);W=buildWorld(sc);C.cam.near=.5;C.cam.far=5000;C.cam.fov=60;C.cam.updateProjectionMatrix()}
      S=S||{};var lv=S.lv;fresh(C);if(lv!=null)S.lv=lv;camSnap(C);ctrlText(C);
      if(C.mode==='online')C.listen(function(m){onNet(C,m)});
      intro(C)},
    start:function(C){startGame(C)},
    close:function(){if(S)S.mdown=false},
    mouse:function(C,t,x,y,e){if(!S||!e||e.pointerType!=='mouse'||!DESK)return;if(t==='move'){var nm=[x/960,y/540];if(S.mouse&&Math.hypot(nm[0]-S.mouse[0],nm[1]-S.mouse[1])>.004)S.mOn=true;S.mouse=nm}else if(t==='down'&&C.running)S.mdown=true;else if(t==='up')S.mdown=false},
    step:function(C,dt){var k=C.keys,me=S.me;S.time+=dt;
      /* pilotage */
      var tx=0,ty=0;
      if(S.mOn&&S.mouse){var dx=S.mouse[0]-.5,dy=S.mouse[1]-.55;dx=Math.abs(dx)<.06?0:dx-Math.sign(dx)*.06;dy=Math.abs(dy)<.06?0:dy-Math.sign(dy)*.06;tx=cl(-dx*3.2,-1,1);ty=cl(-dy*3.4,-1,1)}
      var kl=k.ArrowLeft||k.KeyA,kr=k.ArrowRight||k.KeyD,ku=k.ArrowUp||k.KeyW,kd=k.ArrowDown||k.KeyS;if(kl||kr||ku||kd)S.mOn=false;
      if(kl)tx=1;if(kr)tx=-1;if(ku)ty=1;if(kd)ty=-1;
      var hb=backHome(me);if(hb!=null){tx=hb;msg('Limite de la carte : demi-tour');S.limMsg=1}else if(S.limMsg){S.limMsg=0;msg('')}
      var bo=(k.ShiftLeft||k.ShiftRight)&&me.boost>.05;me.boost=cl(me.boost+(bo?-dt*.35:dt*.18),0,1);
      var targets=S.bots.concat(S.balls).concat(Object.keys(S.rem).map(function(i){return S.rem[i]}));
      if(me.alive){var px=me.x,py=me.y,pz=me.z;fly(me,tx,ty,bo,dt);me.vx=(me.x-px)/dt;me.vy=(me.y-py)/dt;me.vz=(me.z-pz)/dt;me.cd-=dt;me.inv-=dt;
        if(k.Space||S.mdown)shoot(me,'me',targets);
        if(me.y<ground(me.x,me.z)+1.4)die(C,me.y<1.5&&hgt(me.x,me.z)<0?'Plouf ! Dans l\'eau':'Crash contre le relief');
        me.mesh.visible=me.inv>0?((S.time*10|0)%2===0):true}
      /* caméra de poursuite */
      var p=me,cx=p.x+Math.sin(p.yaw)*16*Math.cos(p.pitch*.6),cy=p.y+4.8-Math.sin(p.pitch*.6)*12,cz=p.z+Math.cos(p.yaw)*16*Math.cos(p.pitch*.6);
      C.cam.position.lerp(new THREE.Vector3(cx,Math.max(cy,ground(cx,cz)+2),cz),Math.min(1,dt*(me.alive?5:1)));C.cam.lookAt(p.x-Math.sin(p.yaw)*6,p.y+1.5+Math.sin(p.pitch)*6,p.z-Math.cos(p.yaw)*6);
      W.sky.position.copy(C.cam.position);
      /* bots */
      S.bots.forEach(function(b){if(!b.alive){b.rt-=dt;if(S.mode==='bot'&&b.rt<=0&&!S.ended){b.alive=true;b.hp=100;b.x=me.x+(Math.random()-.5)*600;b.z=me.z-500;b.y=120;b.mesh.visible=true}return}
        var px=b.x,py=b.y,pz=b.z;botStep(b,dt,me.alive?me:{x:0,y:100,z:0,alive:false});b.vx=(b.x-px)/dt;b.vy=(b.y-py)/dt;b.vz=(b.z-pz)/dt;
        if(b.y<ground(b.x,b.z)+1.2)downBot(C,b,false)});
      /* joueurs distants : on glisse vers leur dernière position connue */
      Object.keys(S.rem).forEach(function(id){var o=S.rem[id];if(!o.alive)return;o.tx+=o.vx*dt;o.ty+=o.vy*dt;o.tz+=o.vz*dt;var f=Math.min(1,dt*10);o.x+=(o.tx-o.x)*f;o.y+=(o.ty-o.y)*f;o.z+=(o.tz-o.z)*f;o.mesh.position.set(o.x,o.y,o.z);o.mesh.rotation.set(o.pitch,o.yaw,o.roll,'YXZ');o.mesh.userData.prop.rotation.z+=dt*45});
      if(S.mode==='online'){S.sendT-=dt;if(S.sendT<=0){S.sendT=1/14;net.relay({t:'pl-s',id:net.me.id,a:me.alive?1:0,h:Math.round(me.hp),p:[r1(me.x),r1(me.y),r1(me.z),Math.round(me.yaw*100)/100,Math.round(me.pitch*100)/100,Math.round(me.roll*100)/100,r1(me.vx||0),r1(me.vy||0),r1(me.vz||0)]})}}
      /* balles */
      for(var i=S.bul.length-1;i>=0;i--){var b=S.bul[i],ox=b.x,oy=b.y,oz=b.z;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.t-=dt;b.m.position.set(b.x,b.y,b.z);var gone=b.t<=0||b.y<ground(b.x,b.z);
        if(!gone&&b.own==='me'){S.bots.forEach(function(t){if(!gone&&t.alive&&segHit(b,ox,oy,oz,b.x,b.y,b.z,t,4)){gone=true;t.hp-=10;t.evade=.8;t.ev=Math.random()<.5?1:-1;boom(b.x,b.y,b.z);sfx.play('hit');if(t.hp<=0)downBot(C,t,true)}});
          S.balls.forEach(function(t){if(!gone&&t.alive&&segHit(b,ox,oy,oz,b.x,b.y,b.z,t,4)){gone=true;t.alive=false;S.dyn.remove(t.m);boom(t.x,t.y,t.z);sfx.play('pickup');C.pop('POP !','#ff5fa2','40px')}});
          Object.keys(S.rem).forEach(function(id){var t=S.rem[id];if(!gone&&t.alive&&segHit(b,ox,oy,oz,b.x,b.y,b.z,t,4)){gone=true;boom(b.x,b.y,b.z);sfx.play('hit')}})}
        else if(!gone&&me.alive&&me.inv<=0&&b.own!=='me'&&segHit(b,ox,oy,oz,b.x,b.y,b.z,me,3.4)){gone=true;var dmg=b.own==='bot'?(S.mode==='niveaux'?[5,7,9][LV[S.lv].lvl||0]:8):9;me.hp-=dmg;boom(b.x,b.y,b.z);sfx.play('hurt');C.shake(4);
          if(me.hp<=0)die(C,S.mode==='online'?'Abattu par '+pname(b.own):'Abattu !',b.own)}
        if(gone){S.dyn.remove(b.m);b.m.visible=false;S.bpool.push(b.m);S.bul.splice(i,1)}}
      /* effets */
      for(i=S.fx.length-1;i>=0;i--){var f=S.fx[i];f.t+=dt;f.m.position.x+=f.vx*dt;f.m.position.y+=f.vy*dt;f.m.position.z+=f.vz*dt;var u=f.t/f.life;f.m.scale.setScalar(f.smoke?1+u*3:1-u*.6);f.m.material.opacity=(f.smoke?.6:1)*(1-u);if(u>=1){S.dyn.remove(f.m);S.fx.splice(i,1)}}
      /* anneaux et ballons */
      S.rings.forEach(function(r){if(r.done)return;r.m.rotation.z+=dt*.6;if(me.alive&&Math.hypot(me.x-r.x,me.y-r.y,me.z-r.z)<8.6){r.done=true;r.alive=false;r.m.material.color.setHex(0x3fe09a);r.m.material.emissive.setHex(0x0a4a2a);sfx.play('win');
        if(S.mode==='libre'){S.score+=100;S.fuel+=5;C.pop('+100 · +5 s','#f3c623','40px');moreRing()}else C.pop('Anneau !','#f3c623','40px');setTimeout(function(){S.dyn.remove(r.m)},700)}});
      S.balls.forEach(function(o){if(!o.alive)return;o.ph+=dt;o.y=o.y0+Math.sin(o.ph)*2;o.m.position.y=o.y;o.m.rotation.y+=dt*.5});
      /* flèche vers l'objectif le plus proche */
      var obj=null,od=1e9;S.rings.concat(S.balls,S.bots).forEach(function(o){if(o.done||o.alive===false)return;var d=Math.hypot(o.x-me.x,o.y-me.y,o.z-me.z);if(d<od){od=d;obj=o}});
      if(S.mode==='online')Object.keys(S.rem).forEach(function(id){var o=S.rem[id];if(!o.alive)return;var d=Math.hypot(o.x-me.x,o.y-me.y,o.z-me.z);if(d<od){od=d;obj=o}});
      S.arrow.visible=!!obj&&me.alive&&od>30;if(S.arrow.visible){S.arrow.position.set(me.x-Math.sin(me.yaw)*14,me.y+3.4,me.z-Math.cos(me.yaw)*14);S.arrow.lookAt(obj.x,obj.y,obj.z);S.arrow.material.color.setHex(obj.bot||obj.id?0xff4a3a:obj.m&&obj.m.children&&obj.m.children.length?0xff5fa2:0xf3c623)}
      /* règles de chaque mode */
      var hud='';
      if(S.mode==='niveaux'){var L=LV[S.lv],rl=S.rings.filter(function(r){return !r.done}).length,bl=S.balls.filter(function(b){return b.alive}).length,el=S.bots.filter(function(b){return b.alive}).length,left=Math.max(0,L.time-S.time);
        hud='<span>Mission <b>'+(S.lv+1)+'/'+LV.length+'</b></span>'+(L.rings?'<span>Anneaux <b>'+(L.rings-rl)+'/'+L.rings+'</b></span>':'')+(L.balloons?'<span>Ballons <b>'+(L.balloons-bl)+'/'+L.balloons+'</b></span>':'')+(L.bots?'<span>Ennemis <b>'+el+'</b></span>':'')+'<span>Temps <b>'+Math.ceil(left)+' s</b></span>';
        if(!S.ended&&me.alive&&!rl&&!bl&&!el)endLocal(true,'','Réussie en <b>'+Math.round(S.time)+' s</b>, avec '+Math.round(me.hp)+' % de vie.');
        else if(!S.ended&&left<=0&&me.alive){me.alive=false;endLocal(false,'Temps écoulé','Il fallait finir en '+L.time+' s. Retente !')}}
      else if(S.mode==='libre'){S.fuel-=dt;hud='<span>Score <b>'+S.score+'</b></span><span>Carburant <b>'+Math.max(0,Math.ceil(S.fuel))+' s</b></span><span>Altitude <b>'+Math.round(me.y-ground(me.x,me.z))+' m</b></span>';if(S.fuel<=0&&me.alive&&!S.ended){me.alive=false;endLocal(false,'Plus de carburant','')}}
      else if(S.mode==='bot'){hud='<span>Toi <b>'+S.score+'</b></span><span>Ordi <b>'+S.foe+'</b></span><span>Premier à <b>3</b></span>'}
      else if(S.mode==='online'){var ks=net.players.map(function(p,i){return '<span style="color:#'+PCOL[i%6][0].toString(16).padStart(6,'0')+'">'+esc((p.id===net.me.id?'Toi':p.name)||'?')+' <b>'+(S.kills[p.id]||0)+'</b></span>'}).join('');hud=ks+'<span>Temps <b>'+Math.max(0,Math.ceil(S.limit-S.time))+' s</b></span>';if(S.time>=S.limit)checkWin()}
      S.hudT-=dt;if(S.hudT<=0){S.hudT=.2;C.hud(hud)}},
    draw:function(C){if(!S)return;bars();drawRadar();C.R.render(C.scene,C.cam)}});

  function downBot(C,b,byMe){if(!b.alive)return;b.alive=false;b.mesh.visible=false;boom(b.x,b.y,b.z,true);sfx.play('kill');if(byMe){C.pop('Abattu !','#f3c623','52px');C.shake(6)}
    if(S.mode==='bot'){if(byMe)S.score++;b.rt=2.5;if(S.score>=3)setTimeout(function(){if(!S.ended)endLocal(true)},900)}}

  /* choix de mission dans l'écran de départ */
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pl-lv]');if(!b||!S||!CC)return;e.preventDefault();S.lv=+b.dataset.plLv;intro(CC)},true);
})();
