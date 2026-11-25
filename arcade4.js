/* Pixel Pause — jeux arcade, lot 4 : Avion 3D, Labyrinthe 3D, Basket 3D, Dessine et devine, Billard */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,esc=PP.esc,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',BLU='#3fa9ff',GRN='#3fe09a';
  function lam(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))}
  function clearScene(C){while(C.scene.children.length)C.scene.remove(C.scene.children[0]);C.scene.fog=null}
  function sun(C,sz){C.scene.add(new THREE.HemisphereLight(0xfff4e6,0x50505a,.9));var s=new THREE.DirectionalLight(0xffffff,1.1);s.position.set(30,60,20);if(sz){s.castShadow=true;s.shadow.mapSize.set(1024,1024);var c=s.shadow.camera;c.left=c.bottom=-sz;c.right=c.top=sz;c.far=200}C.scene.add(s);return s}

  /* ================= AVION 3D ================= */
  (function(){
    var S;
    function hgt(x,z){return Math.sin(x*.012)*14+Math.cos(z*.009)*12+Math.sin((x+z)*.021)*6-6}
    function plane(){var g=new THREE.Group(),body=new THREE.Mesh(new THREE.CylinderGeometry(.45,.3,4,10),lam(0xe2361b));body.rotation.x=Math.PI/2;g.add(body);var nose=new THREE.Mesh(new THREE.ConeGeometry(.45,.8,10),lam(0xf1ece2));nose.rotation.x=-Math.PI/2;nose.position.z=-2.4;g.add(nose);
      var wing=new THREE.Mesh(new THREE.BoxGeometry(6,.12,1.1),lam(0xf1ece2));wing.position.z=-.3;g.add(wing);var tail=new THREE.Mesh(new THREE.BoxGeometry(2.2,.1,.6),lam(0xf1ece2));tail.position.z=1.8;g.add(tail);var fin=new THREE.Mesh(new THREE.BoxGeometry(.1,.9,.7),lam(0xe2361b));fin.position.set(0,.45,1.8);g.add(fin);
      var cab=new THREE.Mesh(new THREE.SphereGeometry(.38,10,8),lam(0x3fa9ff));cab.scale.set(1,.8,1.6);cab.position.set(0,.35,-.8);g.add(cab);var prop=new THREE.Mesh(new THREE.BoxGeometry(1.6,.12,.05),lam(0x222222));prop.position.z=-2.85;g.add(prop);g.userData.prop=prop;g.traverse(function(o){if(o.isMesh)o.castShadow=true});return g}
    function ring(z){var x=(Math.random()-.5)*60,y=Math.max(hgt(x,z)+14,8+Math.random()*26),m=new THREE.Mesh(new THREE.TorusGeometry(4,.35,8,32),lam(0xf3c623,{emissive:0x5a4000}));m.position.set(x,y,z);S.sc.add(m);return {m:m,x:x,y:y,z:z,done:false}}
    PP.arcade({id:'plane',three:true,
      setup:function(C){ag.three(C);clearScene(C);var sc=C.scene;S={sc:sc};sun(C,0);sc.background=new THREE.Color(0x9fd3f2);sc.fog=new THREE.Fog(0x9fd3f2,120,420);
        var g=new THREE.PlaneGeometry(1600,3000,120,220);g.rotateX(-Math.PI/2);S.gz=-1000;var p=g.attributes.position,col=new Float32Array(p.count*3),c=new THREE.Color();for(var i=0;i<p.count;i++){var x=p.getX(i),z=p.getZ(i),h=hgt(x,z+S.gz);p.setY(i,h);if(h<-2)c.setHex(0xd8c99a);else if(h<12)c.setHex(0x5c9a3e).lerp(new THREE.Color(0x3f7a2a),Math.random()*.3);else c.setHex(0x8a8478).lerp(new THREE.Color(0xf2f4f7),Math.max(0,(h-18)/10));col.set([c.r,c.g,c.b],i*3)}
        g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();S.ground=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true}));S.ground.position.z=S.gz;sc.add(S.ground);
        var sea=new THREE.Mesh(new THREE.PlaneGeometry(4000,6000),lam(0x2a7fb0,{transparent:true,opacity:.85}));sea.rotation.x=-Math.PI/2;sea.position.y=-3;sc.add(sea);
        for(var k=0;k<40;k++){var cl=new THREE.Mesh(new THREE.SphereGeometry(6+Math.random()*8,7,5),lam(0xffffff,{flatShading:true}));cl.scale.y=.45;cl.position.set((Math.random()-.5)*600,60+Math.random()*30,-Math.random()*2800);sc.add(cl)}
        S.pl=plane();sc.add(S.pl);S.x=0;S.y=25;S.z=0;S.yaw=0;S.pitch=0;S.roll=0;S.sp=38;S.rings=[];S.next=-80;S.time=45;S.score=0;S.dist=0;S.mouse=null;
        for(var r=0;r<8;r++){S.rings.push(ring(S.next));S.next-=70}
        C.keysText('Souris ou <kbd>←</kbd><kbd>→</kbd> tourner · <kbd>↑</kbd><kbd>↓</kbd> (ou souris haut/bas) monter / descendre · <kbd>Maj</kbd> turbo · passe dans les anneaux dorés');
        C.over('Avion 3D','Passe dans les anneaux : chacun rapporte des points et du temps. Ne touche pas le relief !<br>Record : <b>'+C.best('pts')+'</b>','Décoller')},
      start:function(C){if(S.score||S.dist){this.setup(C);C.hide()}},
      mouse:function(C,t,x,y){S.mouse=[x/960-.5,y/540-.5]},
      step:function(C,dt){var k=C.keys,tr=0,pt=0;if(S.mouse){tr=-S.mouse[0]*2.2;pt=-S.mouse[1]*2}if(k.ArrowLeft)tr=1;if(k.ArrowRight)tr=-1;if(k.ArrowUp)pt=1;if(k.ArrowDown)pt=-1;
        S.roll+=((tr*.7)-S.roll)*Math.min(1,dt*3);S.yaw+=S.roll*dt*1.2;S.pitch+=((pt*.45)-S.pitch)*Math.min(1,dt*2.5);var sp=S.sp*(k.ShiftLeft||k.ShiftRight?1.6:1);
        S.x-=Math.sin(S.yaw)*Math.cos(S.pitch)*sp*dt;S.z-=Math.cos(S.yaw)*Math.cos(S.pitch)*sp*dt;S.y+=Math.sin(S.pitch)*sp*dt;S.y=Math.min(90,S.y);S.dist+=sp*dt;
        S.pl.position.set(S.x,S.y,S.z);S.pl.rotation.set(S.pitch,S.yaw,S.roll,'YXZ');S.pl.userData.prop.rotation.z+=dt*40;
        var back=new THREE.Vector3(Math.sin(S.yaw)*14,5,Math.cos(S.yaw)*14);C.cam.position.lerp(new THREE.Vector3(S.x+back.x,S.y+back.y,S.z+back.z),Math.min(1,dt*4));C.cam.lookAt(S.x,S.y+1,S.z);
        if(S.z<S.gz-500){S.gz=S.z-1000;var gp=S.ground.geometry.attributes.position,gc=S.ground.geometry.attributes.color,cc=new THREE.Color();for(var vi=0;vi<gp.count;vi++){var vx=gp.getX(vi),vz=gp.getZ(vi),vh=hgt(vx,vz+S.gz);gp.setY(vi,vh);if(vh<-2)cc.setHex(0xd8c99a);else if(vh<12)cc.setHex(0x5c9a3e);else cc.setHex(0x8a8478).lerp(new THREE.Color(0xf2f4f7),Math.max(0,(vh-18)/10));gc.setXYZ(vi,cc.r,cc.g,cc.b)}gp.needsUpdate=true;gc.needsUpdate=true;S.ground.geometry.computeVertexNormals();S.ground.position.z=S.gz}
        S.time-=dt;S.rings.forEach(function(r){if(r.done)return;r.m.rotation.y+=dt;var d=Math.hypot(S.x-r.x,S.y-r.y,S.z-r.z);if(d<4.2){r.done=true;r.m.material.color.setHex(0x3fe09a);S.score+=100;S.time+=4;sfx.play('win')}});
        S.rings=S.rings.filter(function(r){if(r.z>S.z+40){S.sc.remove(r.m);return false}return true});while(S.rings.length<8){S.rings.push(ring(Math.min(S.next,S.z-120)));S.next=Math.min(S.next,S.z-120)-70}
        var gh=hgt(S.x,S.z)+0;if(S.y<Math.max(gh,-3)+1||S.time<=0){C.stop();sfx.play(S.time<=0?'tick':'kill');var nb=C.best('pts',S.score);if(S.score>=1500)C.win();C.over(S.time<=0?'Plus de carburant':'Crash !','Score : <b>'+S.score+'</b> · '+Math.round(S.dist)+' m'+(nb?' · nouveau record !':''),'Redécoller')}
        C.hud('<span>Score <b>'+S.score+'</b></span><span>Carburant <b>'+Math.max(0,Math.ceil(S.time))+' s</b></span><span>Altitude <b>'+Math.round(S.y-gh)+' m</b></span>')},
      draw:function(C){C.R.render(C.scene,C.cam)}});
  })();

  /* ================= LABYRINTHE 3D ================= */
  (function(){
    var S,N=11;
    function gen(){var g=[],i,j;for(i=0;i<N*2+1;i++){g.push([]);for(j=0;j<N*2+1;j++)g[i].push(1)}var st=[[0,0]],seen={'0,0':1};g[1][1]=0;while(st.length){var c=st[st.length-1],nb=[[1,0],[-1,0],[0,1],[0,-1]].map(function(d){return [c[0]+d[0],c[1]+d[1],d]}).filter(function(q){return q[0]>=0&&q[1]>=0&&q[0]<N&&q[1]<N&&!seen[q[0]+','+q[1]]});if(!nb.length){st.pop();continue}var n=nb[Math.random()*nb.length|0];seen[n[0]+','+n[1]]=1;g[c[0]*2+1+n[2][0]][c[1]*2+1+n[2][1]]=0;g[n[0]*2+1][n[1]*2+1]=0;st.push([n[0],n[1]])}return g}
    function wallTex(){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d');g.fillStyle='#7a6a58';g.fillRect(0,0,128,128);for(var y=0;y<8;y++)for(var x=0;x<4;x++){var v=Math.random()*30|0;g.fillStyle='rgb('+(140+v)+','+(118+v)+','+(96+v)+')';g.fillRect((x*32+(y%2)*16)%128,y*16+1,30,14)}var t=new THREE.CanvasTexture(c);return t}
    PP.arcade({id:'maze',three:true,
      setup:function(C){ag.three(C,0x0c0a10);clearScene(C);var sc=C.scene;sc.fog=new THREE.Fog(0x0c0a10,4,26);S={g:gen(),coins:[],got:0};sc.add(new THREE.HemisphereLight(0xfff0dc,0x303040,.75));S.lamp=new THREE.PointLight(0xffd8a0,2.2,16,1.3);sc.add(S.lamp);
        var wt=wallTex(),geo=new THREE.BoxGeometry(2,3,2),mat=new THREE.MeshLambertMaterial({map:wt}),M=S.g.length,cnt=0;S.g.forEach(function(r){r.forEach(function(v){if(v)cnt++})});var im=new THREE.InstancedMesh(geo,mat,cnt),m4=new THREE.Matrix4(),k=0;
        for(var i=0;i<M;i++)for(var j=0;j<M;j++)if(S.g[i][j]){m4.makeTranslation(i*2,1.5,j*2);im.setMatrixAt(k++,m4)}sc.add(im);
        var fl=new THREE.Mesh(new THREE.PlaneGeometry(M*2,M*2),lam(0x3a3430));fl.rotation.x=-Math.PI/2;fl.position.set(M-1,0,M-1);sc.add(fl);var ce=new THREE.Mesh(new THREE.PlaneGeometry(M*2,M*2),lam(0x1a1614));ce.rotation.x=Math.PI/2;ce.position.set(M-1,3,M-1);sc.add(ce);
        S.ex=[(N*2-1)*2,(N*2-1)*2];var door=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.4,1.4),new THREE.MeshBasicMaterial({color:0x3fe09a,transparent:true,opacity:.7}));door.position.set(S.ex[0],1.2,S.ex[1]);sc.add(door);S.door=door;var dl=new THREE.PointLight(0x3fe09a,2,8);dl.position.set(S.ex[0],2,S.ex[1]);sc.add(dl);
        for(var q=0;q<8;q++){var ci,cj;do{ci=(Math.random()*N|0)*2+1;cj=(Math.random()*N|0)*2+1}while(ci+cj<6);var co=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.06,16),new THREE.MeshLambertMaterial({color:0xf3c623,emissive:0x6a4a00}));co.rotation.x=Math.PI/2;co.position.set(ci*2,1.1,cj*2);sc.add(co);S.coins.push({m:co,x:ci*2,z:cj*2,got:false})}
        S.x=2;S.z=2;S.yaw=S.g[2][1]===0?-Math.PI/2:Math.PI;S.pitch=0;S.t=0;C.cam.position.set(S.x,1.5,S.z);
        C.keysText('<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> ou flèches · clique dans l\'image pour tourner avec la souris · trouve la porte verte (et les pièces)');
        C.over('Labyrinthe 3D','Trouve la sortie verte le plus vite possible. Ramasse les pièces au passage (−3 s chacune).<br>Record : <b>'+(C.best('t')?C.best('t')+' s':'—')+'</b>','Entrer');
        if(!S.bound){S.bound=1}},
      start:function(C){if(S.t){this.setup(C);C.hide()}},
      mouse:function(C,t){if(t==='down'&&C.running&&C.cv.requestPointerLock&&document.pointerLockElement!==C.cv)try{C.cv.requestPointerLock()}catch(e){}},
      step:function(C,dt){S.t+=dt;var k=C.keys,f=(k.KeyW||k.KeyZ||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0),s=(k.KeyD?1:0)-(k.KeyA||k.KeyQ?1:0),tr=(k.ArrowLeft?1:0)-(k.ArrowRight?1:0);S.yaw+=tr*2.2*dt;
        var sp=4.2*dt,dx=(-Math.sin(S.yaw)*f+Math.cos(S.yaw)*s)*sp,dz=(-Math.cos(S.yaw)*f-Math.sin(S.yaw)*s)*sp;function free(x,z){var r=.3;for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2){var i=Math.round((x+a*r)/2),j=Math.round((z+b*r)/2);if(S.g[i]&&S.g[i][j])return false}return true}
        if(free(S.x+dx,S.z))S.x+=dx;if(free(S.x,S.z+dz))S.z+=dz;C.cam.position.set(S.x,1.5+(f||s?Math.sin(S.t*9)*.04:0),S.z);C.cam.rotation.set(S.pitch,S.yaw,0,'YXZ');S.lamp.position.set(S.x,2.2,S.z);
        S.coins.forEach(function(c){c.m.rotation.z+=dt*3;if(!c.got&&Math.hypot(c.x-S.x,c.z-S.z)<.7){c.got=true;c.m.visible=false;S.got++;sfx.play('win')}});S.door.rotation.y+=dt;
        var tt=Math.max(0,S.t-S.got*3);if(Math.hypot(S.ex[0]-S.x,S.ex[1]-S.z)<1){C.stop();if(document.exitPointerLock)document.exitPointerLock();var sec=Math.round(tt),nb=C.best('t',sec,true);C.win();sfx.play('win');C.over('Sorti !','En <b>'+sec+' s</b> ('+S.got+' pièce'+(S.got>1?'s':'')+')'+(nb?' · nouveau record !':''),'Nouveau labyrinthe')}
        C.hud('<span>Temps <b>'+Math.round(tt)+' s</b></span><span>Pièces <b>'+S.got+' / 8</b></span>')},
      draw:function(C){C.R.render(C.scene,C.cam)}});
    document.addEventListener('mousemove',function(e){if(PP.cur()==='maze'&&S&&document.pointerLockElement===document.getElementById('maze-cv')){var s=.0025*(PP.settings?PP.settings.sens/100:1);S.yaw-=e.movementX*s;S.pitch=Math.max(-.8,Math.min(.8,S.pitch-e.movementY*s))}});
  })();

  /* ================= BASKET 3D ================= */
  (function(){
    var S,HOOP=new THREE.Vector3(0,3.05,-7),RIM=.23,BR=.12;
    PP.arcade({id:'hoops',three:true,
      setup:function(C){ag.three(C);clearScene(C);var sc=C.scene;sun(C,12);sc.background=new THREE.Color(0x26303c);
        var wood=document.createElement('canvas');wood.width=256;wood.height=256;var g=wood.getContext('2d');for(var i=0;i<16;i++){g.fillStyle=['#c98d4f','#bf8446','#d29757'][i%3];g.fillRect(i*16,0,16,256)}var wt=new THREE.CanvasTexture(wood);wt.wrapS=wt.wrapT=THREE.RepeatWrapping;wt.repeat.set(4,4);
        var fl=new THREE.Mesh(new THREE.PlaneGeometry(16,20),new THREE.MeshLambertMaterial({map:wt}));fl.rotation.x=-Math.PI/2;fl.position.z=-4;fl.receiveShadow=true;sc.add(fl);
        var line=new THREE.Mesh(new THREE.RingGeometry(5.9,6.0,48,1,Math.PI,Math.PI),new THREE.MeshBasicMaterial({color:0xffffff}));line.rotation.x=-Math.PI/2;line.position.set(0,.01,-7);sc.add(line);
        var wall=new THREE.Mesh(new THREE.PlaneGeometry(16,8),lam(0x4a5a72));for(var li=-1;li<=1;li++){var spl=new THREE.PointLight(0xfff0d8,1.2,18,1.4);spl.position.set(li*5,6,-3);sc.add(spl)}var banner=new THREE.Mesh(new THREE.PlaneGeometry(6,.8),lam(0xe2361b));banner.position.set(0,6.2,-8.55);sc.add(banner);wall.position.set(0,4,-8.6);sc.add(wall);
        var bb=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.05,.05),lam(0xffffff,{transparent:true,opacity:.9}));bb.position.set(0,3.4,-7.35);sc.add(bb);var sq=new THREE.Mesh(new THREE.PlaneGeometry(.6,.45),new THREE.MeshBasicMaterial({color:0xe2361b,wireframe:true}));sq.position.set(0,3.25,-7.32);sc.add(sq);
        var pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3.4,10),lam(0x333333));pole.position.set(0,1.7,-7.9);sc.add(pole);
        var rim=new THREE.Mesh(new THREE.TorusGeometry(RIM,.018,8,24),lam(0xe2361b));rim.rotation.x=Math.PI/2;rim.position.copy(HOOP);sc.add(rim);
        var net=new THREE.Mesh(new THREE.CylinderGeometry(RIM,RIM*.6,.4,12,3,true),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true}));net.position.set(HOOP.x,HOOP.y-.2,HOOP.z);sc.add(net);S={net:net};
        var bt=document.createElement('canvas');bt.width=bt.height=128;g=bt.getContext('2d');g.fillStyle='#e06a1a';g.fillRect(0,0,128,128);g.strokeStyle='#2a1408';g.lineWidth=4;g.beginPath();g.moveTo(0,64);g.lineTo(128,64);g.moveTo(64,0);g.lineTo(64,128);g.stroke();g.beginPath();g.arc(0,64,50,-1.2,1.2);g.stroke();g.beginPath();g.arc(128,64,50,1.9,4.4);g.stroke();
        S.ball=new THREE.Mesh(new THREE.SphereGeometry(BR,20,14),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(bt)}));S.ball.castShadow=true;sc.add(S.ball);
        S.score=0;S.shots=0;S.max=C.mode==='duel'?20:15;S.pts=[0,0];S.cur=0;S.streak=0;newShot(C);
        C.keysText('Vise avec la souris · maintiens le clic (ou <kbd>Espace</kbd>) puis relâche quand la jauge est dans la zone verte');
        C.over('Basket 3D',S.max+' tirs depuis des positions différentes. Relâche au bon moment pour la bonne puissance. Panier à 3 points derrière la ligne.'+(C.mode==='duel'?' J1 et J2 tirent à tour de rôle.':'')+'<br>Record : <b>'+C.best('pts')+'</b>','Jouer')},
      start:function(C){if(S.shots){this.setup(C);C.hide()}},
      mouse:function(C,t,x,y){S.aimX=(x/960-.5);S.aimY=(y/540-.5);if(!C.running)return;if(t==='down'&&S.phase==='aim'){S.phase='charge';S.pw=0;S.dir=1}if(t==='up'&&S.phase==='charge')shoot(C)},
      key:function(C,k,d){if(!C.running||k!=='Space')return;if(d&&S.phase==='aim'){S.phase='charge';S.pw=0;S.dir=1}else if(!d&&S.phase==='charge')shoot(C)},
      step:function(C,dt){var B=S.b;if(S.phase==='charge'){S.pw+=S.dir*dt*1.1;if(S.pw>1){S.pw=1;S.dir=-1}if(S.pw<0){S.pw=0;S.dir=1}}
        if(S.phase==='fly'){var n=6;for(var s=0;s<n;s++){var h=dt/n;B.v.y-=9.8*h;B.p.addScaledVector(B.v,h);
            var rimPt=new THREE.Vector3(B.p.x,HOOP.y,B.p.z),dr=Math.hypot(B.p.x-HOOP.x,B.p.z-HOOP.z);var ringD=Math.hypot(dr-RIM,B.p.y-HOOP.y);if(ringD<BR+.02){var nx=(dr-RIM),ny=(B.p.y-HOOP.y),l=Math.hypot(nx,ny)||1;var rx=(B.p.x-HOOP.x)/(dr||1),rz=(B.p.z-HOOP.z)/(dr||1);var N3=new THREE.Vector3(rx*nx/l,ny/l,rz*nx/l);var vn=B.v.dot(N3);if(vn<0){B.v.addScaledVector(N3,-1.6*vn);B.v.multiplyScalar(.8);sfx.play('tick')}B.p.addScaledVector(N3,(BR+.02-ringD))}
            if(B.p.z<-7.32+BR&&B.p.z>-7.6&&Math.abs(B.p.x)<.9&&B.p.y>2.87&&B.p.y<3.92&&B.v.z<0){B.v.z=-B.v.z*.6;B.p.z=-7.32+BR;sfx.play('hit')}
            if(!B.scored&&B.prevY>HOOP.y&&B.p.y<=HOOP.y&&dr<RIM-.03){B.scored=true;var three=S.from>6;var pts=three?3:2;if(C.mode==='duel')S.pts[S.cur]+=pts;else S.score+=pts;S.streak++;S.msg=(three?'3 POINTS !':'PANIER !');sfx.play('win');S.swish=.4}
            if(B.p.y<BR){B.p.y=BR;B.v.y=-B.v.y*.55;B.v.x*=.8;B.v.z*=.8}B.prevY=B.p.y}
          S.ball.position.copy(B.p);S.ball.rotation.x-=dt*8;S.t+=dt;if(S.t>2.6){if(!B.scored){S.streak=0;S.msg='Raté'}S.phase='after';S.t=0}}
        if(S.swish>0){S.swish-=dt;S.net.scale.y=1+Math.sin(S.swish*30)*.15}
        if(S.phase==='after'){S.t+=dt;if(S.t>.9){S.shots++;if(S.shots>=S.max)return end(C);if(C.mode==='duel')S.cur=S.shots%2;newShot(C)}}
        if(S.phase==='aim'||S.phase==='charge'){var yaw=Math.atan2(HOOP.x-S.pos.x,-(HOOP.z-S.pos.z));C.cam.position.set(S.pos.x+Math.sin(-yaw)*0,1.75,S.pos.z+.8);C.cam.lookAt(HOOP.x+(S.aimX||0)*1.5,HOOP.y-.3-(S.aimY||0)*1.5,HOOP.z);S.ball.position.copy(C.cam.position).add(new THREE.Vector3(0,-.35,-.6).applyQuaternion(C.cam.quaternion))}
        var bar=S.phase==='charge'?'<span>Puissance <b style="color:'+(Math.abs(S.pw-S.sweet)<.06?'#3fe09a':'#e2361b')+'">'+'█'.repeat(Math.round(S.pw*12))+'</b></span>':'';
        C.hud((C.mode==='duel'?'<span>Tir <b>J'+(S.cur+1)+'</b></span><span>J1 <b>'+S.pts[0]+'</b> · J2 <b>'+S.pts[1]+'</b></span>':'<span>Score <b>'+S.score+'</b></span>')+'<span>Tir <b>'+Math.min(S.max,S.shots+1)+' / '+S.max+'</b></span><span>'+(S.from>6?'Zone 3 pts':'Zone 2 pts')+'</span>'+bar+(S.msg?'<span style="background:#f3c623">'+S.msg+'</span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)}});
    function newShot(C){var a=(Math.random()-.5)*2.2,d=3+Math.random()*5;S.pos=new THREE.Vector3(HOOP.x+Math.sin(a)*d,0,HOOP.z+Math.cos(a)*d);S.from=d;S.phase='aim';S.pw=0;S.msg='';S.t=0;
      var dist=Math.hypot(S.pos.x-HOOP.x,S.pos.z-HOOP.z+.8);S.sweet=Math.min(.92,.38+dist*.07)}
    function shoot(C){var dir=new THREE.Vector3();C.cam.getWorldDirection(dir);var tgt=HOOP.clone(),from=S.ball.position.clone(),dx=tgt.x-from.x,dz=tgt.z-from.z,dh=Math.hypot(dx,dz),ang=.9,g=9.8,dy=tgt.y-from.y;
      var vIdeal=Math.sqrt(g*dh*dh/(2*Math.cos(ang)*Math.cos(ang)*(dh*Math.tan(ang)-dy)));var err=(S.pw-S.sweet)*1.6,v=vIdeal*(1+err*.35);var hx=dx/dh,hz=dz/dh;var aimOff=(S.aimX||0)*.25;var cx=Math.cos(aimOff),sx=Math.sin(aimOff),hx2=hx*cx-hz*sx,hz2=hx*sx+hz*cx;
      S.b={p:from,v:new THREE.Vector3(hx2*v*Math.cos(ang),v*Math.sin(ang)-(S.aimY||0)*1.2,hz2*v*Math.cos(ang)),prevY:from.y,scored:false};S.phase='fly';S.t=0;sfx.play('ui')}
    function end(C){C.stop();if(C.mode==='duel'){C.over(S.pts[0]===S.pts[1]?'Égalité':(S.pts[0]>S.pts[1]?'J1':'J2')+' gagne !','J1 <b>'+S.pts[0]+'</b> – <b>'+S.pts[1]+'</b> J2','Rejouer');return}var nb=C.best('pts',S.score);if(S.score>=20)C.win();C.over('Fin du match','<b>'+S.score+'</b> points'+(nb?' · nouveau record !':''),'Rejouer')}
  })();

  /* ================= DESSINE ET DEVINE (salon) ================= */
  (function(){
    var WORDS=['chat','maison','voiture','soleil','pizza','avion','arbre','guitare','lunettes','fusée','poisson','montagne','vélo','parapluie','téléphone','bateau','dragon','fantôme','château','glace','banane','pingouin','tortue','escargot','ballon','couronne','robot','licorne','cactus','hamburger','girafe','chaussure','horloge','ordinateur','tente','volcan','araignée','sirène','pirate','arc-en-ciel','bougie','lune','étoile','nuage','clé','cadeau','sapin','serpent','éléphant','cerf-volant'];
    var S,RT=75;
    function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z]/g,'')}
    function ui(C){var v=document.getElementById('v-draw');if(v.querySelector('.dw-box'))return;var box=document.createElement('div');box.className='dw-box';box.innerHTML='<div class="dw-tools"></div><div class="dw-chat" id="dw-chat"></div><form id="dw-form"><input id="dw-in" placeholder="Ta réponse… (Entrée)" autocomplete="off" maxlength="30"><button type="submit" class="primary">Envoyer</button></form>';v.insertBefore(box,v.querySelector('.keys'));
      var tools=box.querySelector('.dw-tools');['#141210','#e2361b','#3fa9ff','#3fe09a','#f3c623','#b072e0','#7a4e28','#ffffff'].forEach(function(c){var b=document.createElement('button');b.type='button';b.className='dw-c';b.style.background=c;b.onclick=function(){S.col=c;S.w=c==='#ffffff'?22:6};tools.appendChild(b)});
      var cl=document.createElement('button');cl.type='button';cl.className='ghost';cl.textContent='Tout effacer';cl.onclick=function(){if(S.drawer===C.net.me.id){S.strokes=[];C.net.relay({t:'dw-clr'})}};tools.appendChild(cl);
      document.getElementById('dw-form').onsubmit=function(e){e.preventDefault();var i=document.getElementById('dw-in'),t=i.value.trim();if(!t)return;i.value='';C.net.send({t:'dw-g',txt:t})}}
    function chat(t){var c=document.getElementById('dw-chat');if(!c)return;var d=document.createElement('div');d.innerHTML=t;c.appendChild(d);c.scrollTop=c.scrollHeight}
    function hostNext(C){S.ri++;var pl=C.net.players;if(S.ri>=pl.length*S.laps){C.net.all({t:'dw-end',sc:S.sc});return}var d=pl[S.ri%pl.length];S.word=null;S.found={};C.net.all({t:'dw-round',drawer:d.id,dn:d.name,ri:S.ri,tot:pl.length*S.laps});S.end=Date.now()+(RT+10)*1000;clearTimeout(S.tm);S.tm=setTimeout(function(){hostReveal(C)},(RT+10)*1000)}
    function hostReveal(C){clearTimeout(S.tm);C.net.all({t:'dw-reveal',w:S.word||'?',sc:S.sc});setTimeout(function(){hostNext(C)},3500)}
    PP.arcade({id:'draw',
      setup:function(C){S={strokes:[],col:'#141210',w:6,drawer:null,word:null,sc:{},ri:-1,laps:1,t:0,hint:''};ui(C);if(!C.net.inRoom()){C.over('Dessine et devine','Ce jeu se joue à plusieurs : crée ou rejoins un salon, puis reviens ici.','Aller au salon',function(){PP.go('room')});return}C.keysText('Le dessinateur dessine à la souris (ou au doigt), les autres tapent leurs réponses en dessous');
        C.listen(function(m,from){
          if(m.t==='rel'){var d=m.d;if(d.t==='dw-s')S.strokes.push(d.s);if(d.t==='dw-clr')S.strokes=[];return}
          if(C.net.isHost){
            if(m.t==='dw-word'&&from===C.net.players[S.ri%C.net.players.length].id){S.word=m.w;S.end=Date.now()+RT*1000;clearTimeout(S.tm);S.tm=setTimeout(function(){hostReveal(C)},RT*1000);C.net.all({t:'dw-go',len:m.w.length,hint:m.w.replace(/[^ -]/g,'_')})}
            if(m.t==='dw-g'){var pl=C.net.players.filter(function(p){return p.id===from})[0];if(!pl)return;var drawerId=C.net.players[S.ri%C.net.players.length].id;
              if(S.word&&from!==drawerId&&!S.found[from]&&norm(m.txt)===norm(S.word)){S.found[from]=1;var left=Math.max(0,(S.end-Date.now())/1000),pts=Math.round(100+300*left/RT);S.sc[pl.name]=(S.sc[pl.name]||0)+pts;var dn=C.net.players.filter(function(p){return p.id===drawerId})[0];if(dn)S.sc[dn.name]=(S.sc[dn.name]||0)+60;C.net.all({t:'dw-chat',html:'<b style="color:#3fe09a">'+esc(pl.name)+' a trouvé ! +'+pts+'</b>',sc:S.sc});
                if(Object.keys(S.found).length>=C.net.players.length-1)hostReveal(C)}
              else if(from!==drawerId)C.net.all({t:'dw-chat',html:'<b>'+esc(pl.name)+'</b> : '+esc(m.txt)})}}
          if(m.t==='dw-round'){C.hide();C.running=true;S.drawer=m.drawer;S.strokes=[];S.word=null;S.hint='';S.end=0;S.dn=m.dn;S.ri=m.ri;S.tot=m.tot;S.choices=null;chat('<i>Manche '+(m.ri+1)+' / '+m.tot+' : '+esc(m.dn)+' dessine</i>');
            if(m.drawer===C.net.me.id){S.choices=PP.shuffle(WORDS).slice(0,3)}}
          if(m.t==='dw-go'){S.hint=m.hint;S.end=Date.now()+RT*1000}
          if(m.t==='dw-chat'){chat(m.html);if(m.sc)S.sc=m.sc;sfx.play(m.html.indexOf('trouvé')>0?'win':'tick')}
          if(m.t==='dw-reveal'){S.revealW=m.w;S.sc=m.sc;chat('<i>Le mot était : <b>'+esc(m.w)+'</b></i>');S.end=0;setTimeout(function(){S.revealW=null},3200)}
          if(m.t==='dw-end'){C.stop();var arr=Object.keys(m.sc).map(function(k){return [k,m.sc[k]]}).sort(function(a,b){return b[1]-a[1]});if(arr[0]&&arr[0][0]===C.net.me.name)C.win();C.over('Classement',arr.map(function(a,i){return (i+1)+'. '+esc(a[0])+' — '+a[1]}).join('<br>')||'—',C.net.isHost?'Rejouer':false,C.net.isHost?function(){S.ri=-1;S.sc={};hostNext(C)}:null)}});
        C.over('Dessine et devine','À tour de rôle, un joueur dessine un mot et les autres devinent. Plus tu trouves vite, plus tu marques.',C.net.isHost?'Lancer':false,C.net.isHost?function(){if(C.net.players.length<2){PP.toast('Il faut au moins 2 joueurs','warn');return}S.ri=-1;S.sc={};hostNext(C)}:null)},
      start:function(){},
      mouse:function(C,t,x,y){if(!C.running)return;var me=S.drawer===C.net.me.id;
        if(me&&S.choices&&t==='down'){for(var i=0;i<3;i++){if(x>180+i*210&&x<370+i*210&&y>230&&y<310){S.word=S.choices[i];S.choices=null;C.net.send({t:'dw-word',w:S.word});sfx.play('ui')}}return}
        if(!me||!S.word||!S.end)return;if(t==='down'){S.cur={c:S.col,w:S.w,p:[[x|0,y|0]]};S.strokes.push(S.cur)}if(t==='move'&&S.cur){S.cur.p.push([x|0,y|0]);if(S.cur.p.length%6===0){C.net.relay({t:'dw-s',s:{c:S.cur.c,w:S.cur.w,p:S.cur.p.slice(-7)}})}}if(t==='up'&&S.cur){C.net.relay({t:'dw-s',s:{c:S.cur.c,w:S.cur.w,p:S.cur.p.slice(-((S.cur.p.length%6)+1))}});S.cur=null}},
      step:function(C){var left=S.end?Math.max(0,Math.ceil((S.end-Date.now())/1000)):0;var me=S.drawer===C.net.me.id;C.hud('<span>'+(me?'Tu dessines : <b>'+(S.word||'choisis un mot')+'</b>':'Mot : <b style="letter-spacing:.2em">'+(S.revealW||S.hint||'…')+'</b>')+'</span><span>Temps <b>'+left+' s</b></span><span>'+Object.keys(S.sc).map(function(k){return esc(k)+' '+S.sc[k]}).join(' · ')+'</span>')},
      draw:function(C){var g=C.g;g.fillStyle='#fffdf6';g.fillRect(0,0,960,540);g.lineCap='round';g.lineJoin='round';
        S.strokes.forEach(function(s){g.strokeStyle=s.c;g.lineWidth=s.w;g.beginPath();s.p.forEach(function(p,i){i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])});if(s.p.length===1)g.lineTo(s.p[0][0]+.1,s.p[0][1]);g.stroke()});
        if(S.choices){g.fillStyle='rgba(20,18,16,.85)';g.fillRect(0,0,960,540);ag.txt(g,'CHOISIS TON MOT',480,170,48,CR);S.choices.forEach(function(w,i){g.fillStyle=[RED,BLU,'#3f8f3a'][i];PP.ag.rr(g,180+i*210,230,190,80,10);g.fill();ag.mono(g,w,275+i*210,270,20,'#fff')})}
        else if(S.drawer&&S.drawer!==C.net.me.id&&!S.end&&!S.revealW&&C.running){ag.mono(g,(S.dn||'')+' choisit un mot…',480,270,22,'rgba(20,18,16,.5)')}
        if(S.revealW)ag.txt(g,S.revealW.toUpperCase(),480,60,52,RED)}});
  })();

  /* ================= BILLARD ================= */
  (function(){
    var S,W=960,H=540,R=11,TX=60,TY=60,TW=840,TH=420,POCK=[[TX,TY],[TX+TW/2,TY-4],[TX+TW,TY],[TX,TY+TH],[TX+TW/2,TY+TH+4],[TX+TW,TY+TH]],PR=22;
    var COLS=['#f3c623','#1c5fa8','#e2361b','#6a2a8a','#ff8a3d','#2f8a3a','#7a1a1a','#141210','#f3c623','#1c5fa8','#e2361b','#6a2a8a','#ff8a3d','#2f8a3a','#7a1a1a'];
    function rack(){S.b=[{n:0,x:TX+TW*.25,y:TY+TH/2,vx:0,vy:0,in:false}];var order=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15],k=0,sx=TX+TW*.68;for(var c=0;c<5;c++)for(var r=0;r<=c;r++){S.b.push({n:order[k++],x:sx+c*R*1.75,y:TY+TH/2+(r-c/2)*R*2.02,vx:0,vy:0,in:false})}}
    function moving(){return S.b.some(function(b){return !b.in&&(Math.abs(b.vx)>2||Math.abs(b.vy)>2)})}
    function kind(n){return n===8?'8':n<8?'pleines':'rayées'}
    PP.arcade({id:'pool',
      setup:function(C){S={turn:0,grp:[null,null],shots:0,potted:[],drag:null,msg:'',ballInHand:false};rack();C.keysText('Clique sur la bille blanche et tire vers l\'arrière, relâche pour taper · plus tu tires loin, plus c\'est fort');
        C.over('Billard',C.mode==='duel'?'Chacun son tour. La première bille rentrée donne ton groupe (pleines ou rayées). Rentre toutes les tiennes puis la noire. Bille blanche rentrée = l\'autre la replace.':'Rentre les 15 billes en un minimum de coups. La noire en dernier !','Casser')},
      start:function(C){S.turn=0;S.grp=[null,null];S.shots=0;S.msg='';rack()},
      mouse:function(C,t,x,y){if(!C.running||moving())return;var cb=S.b[0];if(S.ballInHand&&t==='down'){if(x>TX+R&&x<TX+TW-R&&y>TY+R&&y<TY+TH-R&&!S.b.some(function(b){return b.n&&!b.in&&Math.hypot(b.x-x,b.y-y)<R*2.2})){cb.x=x;cb.y=y;cb.in=false;cb.vx=cb.vy=0;S.ballInHand=false}return}
        if(t==='down')S.drag={x:x,y:y,cx:x,cy:y};if(t==='move'&&S.drag){S.drag.cx=x;S.drag.cy=y}if(t==='move')S.mouse=[x,y];
        if(t==='up'&&S.drag){var dx=S.drag.x-S.drag.cx,dy=S.drag.y-S.drag.cy,l=Math.min(200,Math.hypot(dx,dy));if(l>6){var aim=S.mouse?Math.atan2(cb.y-S.drag.cy,cb.x-S.drag.cx):0;var a=Math.atan2(dy,dx),sp=l/200*1500;cb.vx=Math.cos(a)*sp;cb.vy=Math.sin(a)*sp;S.shots++;S.potted=[];S.firstHit=null;S.shot=true;sfx.play('hit')}S.drag=null}},
      step:function(C,dt){var n=8;for(var s=0;s<n;s++){var h=dt/n;S.b.forEach(function(b){if(b.in)return;b.x+=b.vx*h;b.y+=b.vy*h;
            if(b.x<TX+R){b.x=TX+R;b.vx=Math.abs(b.vx)*.8}if(b.x>TX+TW-R){b.x=TX+TW-R;b.vx=-Math.abs(b.vx)*.8}if(b.y<TY+R){b.y=TY+R;b.vy=Math.abs(b.vy)*.8}if(b.y>TY+TH-R){b.y=TY+TH-R;b.vy=-Math.abs(b.vy)*.8}
            POCK.forEach(function(p){if(!b.in&&Math.hypot(b.x-p[0],b.y-p[1])<PR){b.in=true;b.vx=b.vy=0;S.potted.push(b.n);sfx.play('win')}})});
          for(var i=0;i<S.b.length;i++)for(var j=i+1;j<S.b.length;j++){var a=S.b[i],b2=S.b[j];if(a.in||b2.in)continue;var dx=b2.x-a.x,dy=b2.y-a.y,d=Math.hypot(dx,dy);if(d<R*2&&d>0){var nx=dx/d,ny=dy/d,ov=(R*2-d)/2;a.x-=nx*ov;a.y-=ny*ov;b2.x+=nx*ov;b2.y+=ny*ov;var rv=(a.vx-b2.vx)*nx+(a.vy-b2.vy)*ny;if(rv>0){a.vx-=rv*nx*.96;a.vy-=rv*ny*.96;b2.vx+=rv*nx*.96;b2.vy+=rv*ny*.96;if(rv>40)sfx.play('tick');if(a.n===0&&S.firstHit==null)S.firstHit=b2.n}}}}
        S.b.forEach(function(b){var f=Math.pow(.42,dt);b.vx*=f;b.vy*=f;if(Math.hypot(b.vx,b.vy)<4){b.vx=b.vy=0}});
        if(S.shot&&!moving()){S.shot=false;resolve(C)}
        var gt=S.grp[S.turn];C.hud(C.mode==='duel'?'<span'+(S.turn===0?' style="background:#e2361b;color:#fff"':'')+'>J1'+(S.grp[0]?' · '+S.grp[0]:'')+'</span><span'+(S.turn===1?' style="background:#3fa9ff;color:#fff"':'')+'>J2'+(S.grp[1]?' · '+S.grp[1]:'')+'</span>'+(S.msg?'<span>'+S.msg+'</span>':''):'<span>Coups <b>'+S.shots+'</b></span><span>Restantes <b>'+S.b.filter(function(b){return b.n&&!b.in}).length+'</b></span>'+(S.msg?'<span>'+S.msg+'</span>':''))},
      draw:function(C){var g=C.g;g.fillStyle='#2a1a10';g.fillRect(0,0,W,H);g.fillStyle='#5a3418';PP.ag.rr(g,TX-40,TY-40,TW+80,TH+80,26);g.fill();g.fillStyle='#1f6b45';g.fillRect(TX,TY,TW,TH);
        var gr=g.createRadialGradient(W/2,H/2,50,W/2,H/2,500);gr.addColorStop(0,'rgba(255,255,255,.08)');gr.addColorStop(1,'rgba(0,0,0,.2)');g.fillStyle=gr;g.fillRect(TX,TY,TW,TH);
        g.strokeStyle='rgba(255,255,255,.15)';g.beginPath();g.moveTo(TX+TW*.25,TY);g.lineTo(TX+TW*.25,TY+TH);g.stroke();
        POCK.forEach(function(p){g.fillStyle='#0a0a0a';g.beginPath();g.arc(p[0],p[1],PR,0,7);g.fill()});
        S.b.forEach(function(b){if(b.in)return;g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.arc(b.x+3,b.y+4,R,0,7);g.fill();
          if(b.n===0){g.fillStyle='#fbf8f2';g.beginPath();g.arc(b.x,b.y,R,0,7);g.fill()}else{var c=COLS[b.n-1];if(b.n>8){g.fillStyle='#fbf8f2';g.beginPath();g.arc(b.x,b.y,R,0,7);g.fill();g.save();g.beginPath();g.arc(b.x,b.y,R,0,7);g.clip();g.fillStyle=c;g.fillRect(b.x-R,b.y-R*.55,R*2,R*1.1);g.restore()}else{g.fillStyle=c;g.beginPath();g.arc(b.x,b.y,R,0,7);g.fill()}
            g.fillStyle='#fff';g.beginPath();g.arc(b.x,b.y,R*.48,0,7);g.fill();g.font='700 9px "IBM Plex Mono"';g.fillStyle='#111';g.textAlign='center';g.textBaseline='middle';g.fillText(b.n,b.x,b.y+.5)}
          g.fillStyle='rgba(255,255,255,.45)';g.beginPath();g.arc(b.x-3,b.y-4,3,0,7);g.fill()});
        var cb=S.b[0];if(C.running&&!moving()&&!cb.in&&!S.ballInHand){var ang=S.drag?Math.atan2(S.drag.y-S.drag.cy,S.drag.x-S.drag.cx):S.mouse?Math.atan2(S.mouse[1]-cb.y,S.mouse[0]-cb.x):0,pull=S.drag?Math.min(200,Math.hypot(S.drag.x-S.drag.cx,S.drag.y-S.drag.cy)):0;
          g.strokeStyle='rgba(255,255,255,.35)';g.setLineDash([6,8]);g.beginPath();g.moveTo(cb.x,cb.y);g.lineTo(cb.x+Math.cos(ang)*600,cb.y+Math.sin(ang)*600);g.stroke();g.setLineDash([]);
          g.save();g.translate(cb.x,cb.y);g.rotate(ang+Math.PI);g.fillStyle='#c9a26a';g.fillRect(R+6+pull*.4,-3,300,6);g.fillStyle='#f1ece2';g.fillRect(R+6+pull*.4,-3,10,6);g.fillStyle='#3a2414';g.fillRect(R+220+pull*.4,-4,90,8);g.restore()}
        if(S.ballInHand)ag.mono(g,'Bille blanche en main : clique sur la table pour la poser',W/2,H-22,15,YEL)}});
    function resolve(C){var p=S.potted,cue=p.indexOf(0)>=0,eight=p.indexOf(8)>=0,left=function(grp){return S.b.filter(function(b){return b.n&&b.n!==8&&!b.in&&kind(b.n)===grp}).length};
      if(C.mode!=='duel'){if(eight&&S.b.some(function(b){return b.n&&b.n!==8&&!b.in})){C.stop();sfx.play('lose');C.over('Noire rentrée trop tôt','Perdu ! La noire doit être la dernière.','Rejouer');return}
        if(cue){S.ballInHand=true;S.b[0].in=true;S.msg='Blanche rentrée (+1 coup)';S.shots++}
        if(S.b.every(function(b){return !b.n||b.in})){C.stop();var nb=C.best('coups',S.shots,true);if(S.shots<=25)C.win();C.over('Table nettoyée !','En <b>'+S.shots+'</b> coups'+(nb?' · nouveau record !':''),'Rejouer')}return}
      var me=S.turn,mine=S.grp[me],keep=false;
      if(eight){var won=mine&&left(mine)===0&&!cue;C.stop();sfx.play(won?'win':'lose');var w=won?me:1-me;C.over('J'+(w+1)+' gagne !',won?'Noire rentrée proprement.':'Noire rentrée trop tôt ou avec une faute.','Rejouer');return}
      var balls=p.filter(function(n){return n&&n!==8});if(!mine&&balls.length){mine=S.grp[me]=kind(balls[0]);S.grp[1-me]=mine==='pleines'?'rayées':'pleines';S.msg='J'+(me+1)+' joue les '+mine}
      if(mine&&balls.some(function(n){return kind(n)===mine}))keep=true;
      if(cue){keep=false;S.ballInHand=true;S.b[0].in=true;S.msg='Faute : blanche rentrée'}
      if(!keep)S.turn=1-me}
  })();
})();
