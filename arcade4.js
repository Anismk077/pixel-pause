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
        S.time-=dt;S.rings.forEach(function(r){if(r.done)return;r.m.rotation.y+=dt;var d=Math.hypot(S.x-r.x,S.y-r.y,S.z-r.z);if(d<4.2){r.done=true;r.m.material.color.setHex(0x3fe09a);S.score+=100;S.time+=4;sfx.play('win');C.pop('+100 · +4 s','#f3c623','44px')}});
        S.rings=S.rings.filter(function(r){if(r.z>S.z+40){S.sc.remove(r.m);return false}return true});while(S.rings.length<8){S.rings.push(ring(Math.min(S.next,S.z-120)));S.next=Math.min(S.next,S.z-120)-70}
        var gh=hgt(S.x,S.z)+0;if(S.y<Math.max(gh,-3)+1||S.time<=0){C.stop();sfx.play(S.time<=0?'tick':'kill');var nb=C.best('pts',S.score);if(S.score>=1500)C.win();C.over(S.time<=0?'Plus de carburant':'Crash !','Score : <b>'+S.score+'</b> · '+Math.round(S.dist)+' m'+(nb?' · nouveau record !':''),'Redécoller')}
        C.hud('<span>Score <b>'+S.score+'</b></span><span>Carburant <b>'+Math.max(0,Math.ceil(S.time))+' s</b></span><span>Altitude <b>'+Math.round(S.y-gh)+' m</b></span>')},
      draw:function(C){C.R.render(C.scene,C.cam)}});
  })();

  /* ================= LABYRINTHE 3D (v77) =================
     Nouveau labyrinthe à chaque partie : départ, sortie, clé et pièces placés au hasard.
     4 modes : Facile, Moyen (clé à trouver), Difficile (clé + fantômes) et Aventure (6 niveaux de plus en plus durs). */
  (function(){
    var S,DIFF={
      easy:{n:'Facile',N:8,loop:.14,key:false,gh:0,map:'all',coins:5,fog:30,light:.95},
      mid:{n:'Moyen',N:12,loop:.07,key:true,gh:0,map:'seen',coins:8,fog:24,light:.75},
      hard:{n:'Difficile',N:16,loop:.04,key:true,gh:2,map:'seen',coins:10,fog:15,light:.5}};
    function runCfg(L){return {n:'Niveau '+L,N:6+L*2,loop:Math.max(.03,.15-L*.02),key:L>=2,gh:L>=4?L-3:0,map:L>=3?'seen':'all',coins:4+L,fog:Math.max(14,32-L*3),light:Math.max(.5,1-L*.08)}}
    var LEVELS=6;
    function gen(N,loop){var M=N*2+1,g=[],i,j;for(i=0;i<M;i++){g.push([]);for(j=0;j<M;j++)g[i].push(1)}
      var sx=Math.random()*N|0,sy=Math.random()*N|0,st=[[sx,sy]],seen={};seen[sx+','+sy]=1;g[sx*2+1][sy*2+1]=0;
      while(st.length){var c=st[st.length-1],nb=[[1,0],[-1,0],[0,1],[0,-1]].map(function(d){return [c[0]+d[0],c[1]+d[1],d]}).filter(function(q){return q[0]>=0&&q[1]>=0&&q[0]<N&&q[1]<N&&!seen[q[0]+','+q[1]]});
        if(!nb.length){st.pop();continue}var n=nb[Math.random()*nb.length|0];seen[n[0]+','+n[1]]=1;g[c[0]*2+1+n[2][0]][c[1]*2+1+n[2][1]]=0;g[n[0]*2+1][n[1]*2+1]=0;st.push([n[0],n[1]])}
      /* quelques murs en moins : des boucles, pour ne pas avoir qu'un seul chemin */
      for(i=1;i<M-1;i++)for(j=1;j<M-1;j++)if(g[i][j]&&(i+j)%2===1&&Math.random()<loop){if((i%2===1&&g[i][j-1]===0&&g[i][j+1]===0)||(j%2===1&&g[i-1][j]===0&&g[i+1][j]===0))g[i][j]=0}
      return g}
    /* distances (en cases) depuis une case, en suivant les couloirs */
    function bfs(g,N,a,b){var D={},q=[[a,b]];D[a+','+b]=0;while(q.length){var c=q.shift(),d0=D[c[0]+','+c[1]];[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var x=c[0]+d[0],y=c[1]+d[1];if(x<0||y<0||x>=N||y>=N||D[x+','+y]!=null)return;if(g[c[0]*2+1+d[0]][c[1]*2+1+d[1]])return;D[x+','+y]=d0+1;q.push([x,y])})}return D}
    function pickFar(D,min,max,avoid){var l=Object.keys(D).filter(function(k){return D[k]>=min&&D[k]<=max&&!avoid[k]});if(!l.length)l=Object.keys(D).filter(function(k){return !avoid[k]});var k=l[Math.random()*l.length|0].split(',');return [+k[0],+k[1]]}
    function wallTex(dark){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d');g.fillStyle=dark?'#3e3a48':'#7a6a58';g.fillRect(0,0,128,128);for(var y=0;y<8;y++)for(var x=0;x<5;x++){var v=Math.random()*30|0;g.fillStyle=dark?'rgb('+(70+v)+','+(66+v)+','+(84+v)+')':'rgb('+(140+v)+','+(118+v)+','+(96+v)+')';g.fillRect((x*32+(y%2)*16)%160-16,y*16+1,30,14)}
      g.fillStyle='rgba(60,120,40,.35)';for(var m=0;m<6;m++){g.beginPath();g.arc(Math.random()*128,110+Math.random()*18,4+Math.random()*8,0,7);g.fill()}return new THREE.CanvasTexture(c)}
    function cfg(C){return C.mode==='run'?runCfg(S&&S.L||1):DIFF[C.mode]||DIFF.easy}
    function dispose(sc){sc.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){if(m.map)m.map.dispose();m.dispose()})}})}
    function build(C){var K=cfg(C),N=K.N,sc=C.scene;dispose(sc);clearScene(C);
      var dark=K.gh>0,bg=dark?0x07060c:0x0c0a10;sc.background=new THREE.Color(bg);sc.fog=new THREE.Fog(bg,3,K.fog);
      var g=gen(N,K.loop),M=g.length;S.g=g;S.N=N;S.K=K;S.coins=[];S.got=0;S.hasKey=!K.key;S.ghosts=[];S.seen={};S.t=0;S.pen=0;S.hint=0;
      sc.add(new THREE.HemisphereLight(0xfff0dc,0x303040,K.light));S.lamp=new THREE.PointLight(0xffd8a0,2.2,dark?11:16,1.3);sc.add(S.lamp);
      var cnt=0;g.forEach(function(r){r.forEach(function(v){if(v)cnt++})});var im=new THREE.InstancedMesh(new THREE.BoxGeometry(2,3,2),new THREE.MeshLambertMaterial({map:wallTex(dark)}),cnt),m4=new THREE.Matrix4(),k=0;
      for(var i=0;i<M;i++)for(var j=0;j<M;j++)if(g[i][j]){m4.makeTranslation(i*2,1.5,j*2);im.setMatrixAt(k++,m4)}sc.add(im);
      function tx(fn,rep){var c=document.createElement('canvas');c.width=c.height=128;fn(c.getContext('2d'));var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);return t}
      var flT=tx(function(q){q.fillStyle='#4a4038';q.fillRect(0,0,128,128);for(var y=0;y<4;y++)for(var x=0;x<4;x++){var v=Math.random()*24|0;q.fillStyle='rgb('+(78+v)+','+(68+v)+','+(58+v)+')';q.fillRect(x*32+2,y*32+2,28,28)}},M),ceT=tx(function(q){q.fillStyle='#2a1e14';q.fillRect(0,0,128,128);for(var i2=0;i2<8;i2++){q.fillStyle=i2%2?'#3a2a1c':'#33251a';q.fillRect(0,i2*16,128,14)}},M/2);
      var fl=new THREE.Mesh(new THREE.PlaneGeometry(M*2,M*2),new THREE.MeshLambertMaterial({map:flT}));fl.rotation.x=-Math.PI/2;fl.position.set(M-1,0,M-1);sc.add(fl);var ce=new THREE.Mesh(new THREE.PlaneGeometry(M*2,M*2),new THREE.MeshLambertMaterial({map:ceT}));ce.rotation.x=Math.PI/2;ce.position.set(M-1,3,M-1);sc.add(ce);
      S.torches=[];var fm=new THREE.MeshBasicMaterial({color:0xffa040});for(var ti=1;ti<M-1;ti+=2)for(var tj=1;tj<M-1;tj+=2){if(Math.random()>(dark?.1:.18))continue;var side=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(d){return g[ti+d[0]]&&g[ti+d[0]][tj+d[1]]})[0];if(!side)continue;var gx=ti*2+side[0]*.92,gz=tj*2+side[1]*.92;var stk=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,.35,6),lam(0x3a2414));stk.position.set(gx,1.9,gz);sc.add(stk);var f3=new THREE.Mesh(new THREE.ConeGeometry(.09,.25,7),fm);f3.position.set(gx,2.18,gz);sc.add(f3);S.torches.push(f3)}
      /* départ au hasard, sortie loin du départ, clé à mi-chemin, pièces partout */
      var s0=[Math.random()*N|0,Math.random()*N|0],D=bfs(g,N,s0[0],s0[1]),mx=0;Object.keys(D).forEach(function(q){if(D[q]>mx)mx=D[q]});
      var used={};used[s0.join(',')]=1;var ex=pickFar(D,Math.round(mx*.72),mx,used);used[ex.join(',')]=1;S.s0=s0;S.exC=ex;
      S.ex=[ex[0]*4+2,ex[1]*4+2];S.door=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.4,1.4),new THREE.MeshBasicMaterial({color:S.hasKey?0x3fe09a:0xe2361b,transparent:true,opacity:.72}));S.door.position.set(S.ex[0],1.2,S.ex[1]);sc.add(S.door);
      S.dl=new THREE.PointLight(S.hasKey?0x3fe09a:0xe2361b,2,8);S.dl.position.set(S.ex[0],2,S.ex[1]);sc.add(S.dl);
      if(K.key){var DE=bfs(g,N,ex[0],ex[1]),cand=Object.keys(D).filter(function(q){return D[q]>=mx*.35&&DE[q]>=mx*.35&&!used[q]}),kc=(cand.length?cand[Math.random()*cand.length|0]:Object.keys(D).filter(function(q){return !used[q]})[0]).split(',');used[kc.join(',')]=1;
        S.keyC=[+kc[0],+kc[1]];var kg=new THREE.Group();var km=new THREE.MeshLambertMaterial({color:0xf3c623,emissive:0x8a6a00});var ring=new THREE.Mesh(new THREE.TorusGeometry(.18,.06,8,16),km);ring.position.y=.25;kg.add(ring);var shaft=new THREE.Mesh(new THREE.BoxGeometry(.07,.45,.07),km);shaft.position.y=-.08;kg.add(shaft);var t1=new THREE.Mesh(new THREE.BoxGeometry(.16,.06,.07),km);t1.position.set(.08,-.22,0);kg.add(t1);var t2=t1.clone();t2.position.y=-.12;kg.add(t2);
        kg.position.set(S.keyC[0]*4+2,1.2,S.keyC[1]*4+2);sc.add(kg);S.key=kg;var kl=new THREE.PointLight(0xf3c623,1.4,6);kl.position.set(S.keyC[0]*4+2,1.6,S.keyC[1]*4+2);sc.add(kl);S.kl=kl}
      for(var q=0;q<K.coins;q++){var cc=pickFar(D,2,mx,used);used[cc.join(',')]=1;var co=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.06,16),new THREE.MeshLambertMaterial({color:0xf3c623,emissive:0x6a4a00}));co.rotation.x=Math.PI/2;co.position.set(cc[0]*4+2,1.1,cc[1]*4+2);sc.add(co);S.coins.push({m:co,x:cc[0]*4+2,z:cc[1]*4+2,got:false})}
      for(var gi=0;gi<K.gh;gi++){var gc=pickFar(D,Math.max(4,Math.round(mx*.5)),mx,used);var gm=new THREE.Group(),body=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),new THREE.MeshBasicMaterial({color:0xb8c8ff,transparent:true,opacity:.75}));gm.add(body);var eye=new THREE.MeshBasicMaterial({color:0x141210});[-.14,.14].forEach(function(ex2){var e=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),eye);e.position.set(ex2,.08,.36);gm.add(e)});var gl=new THREE.PointLight(0x8aa0ff,1.2,5);gm.add(gl);gm.position.set(gc[0]*4+2,1.3,gc[1]*4+2);sc.add(gm);
        S.ghosts.push({m:gm,c:gc.slice(),to:gc.slice(),k:1,home:gc.slice()})}
      S.x=s0[0]*4+2;S.z=s0[1]*4+2;var open=[[0,-1,0],[1,0,-Math.PI/2],[0,1,Math.PI],[-1,0,Math.PI/2]].filter(function(d){return g[s0[0]*2+1+d[0]][s0[1]*2+1+d[1]]===0})[0]||[0,0,0];S.yaw=open[2];S.pitch=0;C.cam.position.set(S.x,1.5,S.z);C.cam.rotation.set(0,S.yaw,0,'YXZ')}
    function cellOf(x,z){return [Math.round((x-2)/4),Math.round((z-2)/4)]}
    function ghostStep(C,G,dt){var spd=(C.mode==='hard'?1.9:1.6)+(S.L||0)*.08,dx=G.to[0]*4+2-G.m.position.x,dz=G.to[1]*4+2-G.m.position.z,d=Math.hypot(dx,dz),mv=spd*dt;
      if(d>mv){G.m.position.x+=dx/d*mv;G.m.position.z+=dz/d*mv}else{G.m.position.x=G.to[0]*4+2;G.m.position.z=G.to[1]*4+2;G.c=G.to.slice();
        var pc=cellOf(S.x,S.z),D=bfs(S.g,S.N,pc[0],pc[1]),here=D[G.c[0]+','+G.c[1]],opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(q){return !S.g[G.c[0]*2+1+q[0]][G.c[1]*2+1+q[1]]}).map(function(q){return [G.c[0]+q[0],G.c[1]+q[1]]});
        if(here!=null&&here<=7){opts.sort(function(a,b){return D[a[0]+','+a[1]]-D[b[0]+','+b[1]]});G.to=opts[0]}
        else{var back=G.prev,fw=opts.filter(function(o){return !back||o[0]!==back[0]||o[1]!==back[1]});G.to=(fw.length?fw:opts)[Math.random()*(fw.length||opts.length)|0]}G.prev=G.c.slice()}
      G.m.position.y=1.3+Math.sin(S.t*3+G.home[0])*.12;G.m.lookAt(S.x,1.3,S.z);
      if(Math.hypot(G.m.position.x-S.x,G.m.position.z-S.z)<.8&&S.inv<=0){S.x=S.s0[0]*4+2;S.z=S.s0[1]*4+2;S.pen+=10;S.inv=2;sfx.play('hurt');C.shake(10);C.pop('Attrapé ! +10 s','#b8c8ff','46px');
        S.ghosts.forEach(function(o){var h=o.home;o.m.position.set(h[0]*4+2,1.3,h[1]*4+2);o.c=h.slice();o.to=h.slice();o.prev=null})}}
    function mini(C){if(!S.mini)return;var mg=S.mini.getContext('2d'),M2=S.g.length,cs=170/M2,all=S.K.map==='all';mg.clearRect(0,0,170,170);mg.fillStyle='rgba(20,18,16,.78)';mg.fillRect(0,0,170,170);
      for(var i2=0;i2<M2;i2++)for(var j2=0;j2<M2;j2++){if(!all&&!S.seen[i2+','+j2])continue;mg.fillStyle=S.g[i2][j2]?'#8a7a64':'#2a2420';mg.fillRect(i2*cs,j2*cs,cs+.5,cs+.5)}
      function dot(x,z,col,r){var gi=x/2,gj=z/2;if(!all&&!S.seen[Math.round(gi)+','+Math.round(gj)])return;mg.fillStyle=col;mg.beginPath();mg.arc(gi*cs+cs/2,gj*cs+cs/2,r,0,7);mg.fill()}
      dot(S.ex[0],S.ex[1],S.hasKey?'#3fe09a':'#e2361b',Math.max(3,cs*.9));if(S.key&&!S.hasKey)dot(S.keyC[0]*4+2,S.keyC[1]*4+2,'#f3c623',Math.max(3,cs*.8));
      S.ghosts.forEach(function(G){dot(G.m.position.x,G.m.position.z,'#b8c8ff',Math.max(2.5,cs*.7))});
      mg.save();mg.translate(S.x/2*cs+cs/2,S.z/2*cs+cs/2);mg.rotate(-S.yaw);mg.fillStyle='#e2361b';mg.beginPath();mg.moveTo(0,-6);mg.lineTo(4,4);mg.lineTo(-4,4);mg.fill();mg.restore()}
    function intro(C){var K=cfg(C),run=C.mode==='run',best=run?C.best('lvl'):C.best('t-'+C.mode),
        rules=(K.key?'Trouve d\'abord la <b>clé dorée</b> : la porte de sortie reste rouge et fermée sans elle. ':'Trouve la <b>porte verte</b>. ')+(K.gh?'Attention aux <b>fantômes</b> : s\'ils te touchent, retour au départ et +10 s. ':'')+'Chaque pièce enlève 3 s. Labyrinthe, départ et sortie changent à chaque partie.';
      C.over(run?'Aventure · niveau '+S.L+' / '+LEVELS:'Labyrinthe '+K.n.toLowerCase(),rules+'<br>Record : <b>'+(best?(run?'niveau '+best:best+' s'):'—')+'</b>',run&&S.L>1?'Niveau '+S.L:'Entrer')}
    PP.arcade({id:'maze',three:true,
      setup:function(C){ag.three(C,0x0c0a10);C.hud('');S={L:1,tot:0,inv:0,done:false};build(C);
        var mn=document.createElement('canvas');mn.width=mn.height=170;mn.className='maze-mini';C.cv.parentNode.appendChild(mn);document.querySelectorAll('#v-maze .maze-mini').forEach(function(x){if(x!==mn)x.remove()});S.mini=mn;
        C.keysText('<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> ou flèches · clique dans l\'image pour tourner avec la souris · <kbd>M</kbd> grande carte (−5 s de pénalité) · trouve la sortie');
        intro(C)},
      start:function(C){if(S.done){var L=S.L,tot=S.tot,mn=S.mini;if(C.mode==='run'&&S.next){S={L:L+1,tot:tot,inv:0,done:false,mini:mn}}else{S={L:1,tot:0,inv:0,done:false,mini:mn}}build(C)}S.done=false},
      mouse:function(C,t){if(t==='down'&&C.running&&C.cv.requestPointerLock&&document.pointerLockElement!==C.cv&&matchMedia('(hover:hover)').matches)try{var r=C.cv.requestPointerLock();if(r&&r.catch)r.catch(function(){})}catch(e){}},
      key:function(C,k,d){if(d&&k==='KeyM'&&C.running&&S.K.map!=='all'){S.hint=4;S.pen+=5;C.pop('Carte : +5 s',YEL,'40px')}},
      step:function(C,dt){S.t+=dt;if(S.inv>0)S.inv-=dt;if(S.hint>0)S.hint-=dt;var k=C.keys,f=(k.KeyW||k.KeyZ||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0),s=(k.KeyD?1:0)-(k.KeyA||k.KeyQ?1:0),tr=(k.ArrowLeft?1:0)-(k.ArrowRight?1:0);S.yaw+=tr*2.2*dt;
        var sp=4.2*dt,dx=(-Math.sin(S.yaw)*f+Math.cos(S.yaw)*s)*sp,dz=(-Math.cos(S.yaw)*f-Math.sin(S.yaw)*s)*sp;function free(x,z){var r=.45;for(var a=-1;a<=1;a+=2)for(var b=-1;b<=1;b+=2){var i=Math.round((x+a*r)/2),j=Math.round((z+b*r)/2);if(S.g[i]&&S.g[i][j])return false}return true}
        if(free(S.x+dx,S.z))S.x+=dx;if(free(S.x,S.z+dz))S.z+=dz;C.cam.position.set(S.x,1.5+(f||s?Math.sin(S.t*9)*.04:0),S.z);C.cam.rotation.set(S.pitch,S.yaw,0,'YXZ');S.lamp.position.set(S.x,2.2,S.z);
        S.torches.forEach(function(q,i){q.scale.y=1+Math.sin(S.t*14+i)*.2});
        var ci=Math.round(S.x/2),cj=Math.round(S.z/2);for(var a2=-1;a2<=1;a2++)for(var b2=-1;b2<=1;b2++)S.seen[(ci+a2)+','+(cj+b2)]=1;
        if(S.hint>0){var sv=S.K.map;S.K.map='all';mini(C);S.K.map=sv}else mini(C);
        S.coins.forEach(function(c){c.m.rotation.z+=dt*3;if(!c.got&&Math.hypot(c.x-S.x,c.z-S.z)<.7){c.got=true;c.m.visible=false;S.got++;sfx.play('pickup');C.pop('−3 s',YEL,'44px')}});
        if(S.key&&!S.hasKey){S.key.rotation.y+=dt*2.5;S.key.position.y=1.2+Math.sin(S.t*3)*.1;if(Math.hypot(S.keyC[0]*4+2-S.x,S.keyC[1]*4+2-S.z)<.8){S.hasKey=true;S.key.visible=false;S.kl.intensity=0;S.door.material.color.setHex(0x3fe09a);S.dl.color.setHex(0x3fe09a);sfx.play('win');C.pop('CLÉ ! La porte est ouverte',YEL,'40px')}}
        S.ghosts.forEach(function(G){ghostStep(C,G,dt)});
        S.door.rotation.y+=dt;var tt=Math.max(0,S.t+S.pen-S.got*3),near=Math.hypot(S.ex[0]-S.x,S.ex[1]-S.z)<1;
        if(near&&!S.hasKey){if(!S.lockT||S.t-S.lockT>2){S.lockT=S.t;sfx.play('lose');C.pop('Fermé : trouve la clé !',RED,'40px')}}
        if(near&&S.hasKey){C.stop();S.done=true;if(document.exitPointerLock&&document.pointerLockElement)document.exitPointerLock();var sec=Math.round(tt);sfx.play('win');
          if(C.mode==='run'){S.tot+=sec;var last=S.L>=LEVELS;S.next=!last;C.best('lvl',S.L);
            if(last){var nb2=C.best('t-run',S.tot,true);C.win();C.over('Aventure terminée !','Les '+LEVELS+' niveaux en <b>'+S.tot+' s</b>'+(nb2?' · nouveau record !':''),'Rejouer')}
            else C.over('Niveau '+S.L+' réussi !','En <b>'+sec+' s</b> ('+S.got+' pièce'+(S.got>1?'s':'')+') · total '+S.tot+' s.<br>Niveau '+(S.L+1)+' : '+(runCfg(S.L+1).gh>runCfg(S.L).gh?'un fantôme de plus…':runCfg(S.L+1).key&&!runCfg(S.L).key?'il faudra trouver une clé.':runCfg(S.L+1).map!==runCfg(S.L).map?'la carte ne montre plus que ce que tu as vu.':'plus grand.'),'Niveau '+(S.L+1))}
          else{var nb=C.best('t-'+C.mode,sec,true);C.win();C.over('Sorti !','En <b>'+sec+' s</b> ('+S.got+' pièce'+(S.got>1?'s':'')+')'+(nb?' · nouveau record !':''),'Nouveau labyrinthe')}return}
        C.hud('<span>'+S.K.n+'</span><span>Temps <b>'+Math.round(tt)+' s</b></span>'+(S.K.key?'<span>Clé <b>'+(S.hasKey?'✓':'à trouver')+'</b></span>':'')+'<span>Pièces <b>'+S.got+' / '+S.coins.length+'</b></span>'+(C.mode==='run'?'<span>Niveau <b>'+S.L+' / '+LEVELS+'</b></span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)},close:function(){if(S&&S.mini){S.mini.remove();S.mini=null}}});
    document.addEventListener('mousemove',function(e){if(PP.cur()==='maze'&&S&&document.pointerLockElement===document.getElementById('maze-cv')){var s=.0025*(PP.settings?PP.settings.sens/100:1);S.yaw-=e.movementX*s;S.pitch=Math.max(-.8,Math.min(.8,S.pitch-e.movementY*s))}});
  })();

  /* ================= BASKET 3D : on se déplace, on dribble, on saute pour tirer ================= */
  (function(){
    var S,HZ=-7,RIM=.23,BR=.12,TURN=60;
    function cvT(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);return t}
    function hoopPos(){return new THREE.Vector3(S.hx,3.05,HZ)}
    PP.arcade({id:'hoops',three:true,
      setup:function(C){ag.three(C);clearScene(C);var sc=C.scene;sc.background=new THREE.Color(0x1a1f28);sc.add(new THREE.HemisphereLight(0xfff4e6,0x50505a,1.05));C.cam.fov=64;C.cam.updateProjectionMatrix();
        var sl=new THREE.DirectionalLight(0xffffff,.8);sl.position.set(4,12,6);sl.castShadow=true;sl.shadow.mapSize.set(1024,1024);var sc2=sl.shadow.camera;sc2.left=sc2.bottom=-12;sc2.right=sc2.top=12;sc.add(sl);
        for(var li=-1;li<=1;li++){var pl=new THREE.PointLight(0xfff0d8,1.1,20,1.3);pl.position.set(li*5,7,-2);sc.add(pl)}
        /* parquet avec les lignes du terrain */
        var floorT=cvT(1024,1024,function(g,w,h){for(var i=0;i<32;i++){g.fillStyle=['#c98d4f','#bf8446','#d29757','#c48a4c'][i%4];g.fillRect(i*32,0,32,h)}g.fillStyle='rgba(0,0,0,.05)';for(var y=0;y<h;y+=96)g.fillRect(0,y,w,2);
          var cx=w/2,cy=h*.15,s=w/16;g.strokeStyle='#fff';g.lineWidth=6;g.fillStyle='rgba(226,54,27,.55)';g.fillRect(cx-2.45*s,cy,4.9*s,5.8*s);g.strokeRect(cx-2.45*s,cy,4.9*s,5.8*s);g.beginPath();g.arc(cx,cy+5.8*s,1.8*s,0,Math.PI*2);g.stroke();
          g.beginPath();g.arc(cx,cy+1.2*s,6.75*s,.15,Math.PI-.15);g.stroke();g.beginPath();g.moveTo(cx-6.6*s,cy);g.lineTo(cx-6.6*s,cy+2.2*s);g.moveTo(cx+6.6*s,cy);g.lineTo(cx+6.6*s,cy+2.2*s);g.stroke();g.strokeRect(10,cy,w-20,h-cy-10);
          g.font='700 90px Anton, Impact';g.fillStyle='rgba(20,18,16,.25)';g.textAlign='center';g.fillText('PIXEL PAUSE',cx,h*.82)});
        var fl=new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.MeshLambertMaterial({map:floorT}));fl.rotation.x=-Math.PI/2;fl.position.set(0,0,HZ+.4+8-1.6*0-0.2);fl.position.z=HZ-2.4+8;fl.receiveShadow=true;sc.add(fl);
        var wall=new THREE.Mesh(new THREE.PlaneGeometry(24,10),lam(0x5d6f92));wall.position.set(0,5,HZ-2);sc.add(wall);var ban=new THREE.Mesh(new THREE.PlaneGeometry(8,1),new THREE.MeshBasicMaterial({map:cvT(512,64,function(g,w,h){g.fillStyle='#e2361b';g.fillRect(0,0,w,h);g.font='400 44px Anton, Impact';g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText('PIXEL PAUSE · BASKET',w/2,h/2+2)})}));ban.position.set(0,7.6,HZ-1.95);sc.add(ban);
        /* tableau d'affichage */
        S={sb:document.createElement('canvas')};S.sb.width=256;S.sb.height=96;S.sbT=new THREE.CanvasTexture(S.sb);var sbm=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1),new THREE.MeshBasicMaterial({map:S.sbT}));sbm.position.set(4.6,5.4,HZ-1.9);sc.add(sbm);
        /* public dans les tribunes (il saute quand tu marques) */
        S.crowd=[];var shirt=[0xe2361b,0x3fa9ff,0xf3c623,0x3fe09a,0xf1ece2,0xb072e0];for(var side=-1;side<=1;side+=2)for(var r=0;r<3;r++)for(var k=0;k<14;k++){var grp=new THREE.Group(),bd=new THREE.Mesh(new THREE.BoxGeometry(.35,.5,.25),lam(shirt[(k+r)%6]));bd.position.y=.25;grp.add(bd);var hd=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),lam([0xf1c7a0,0x9a6438,0x5a3a22][(k*7+r)%3]));hd.position.y=.62;grp.add(hd);grp.position.set(side*(7.2+r*.7),.4+r*.55,HZ+1+k*.75);grp.rotation.y=-side*Math.PI/2;sc.add(grp);S.crowd.push({g:grp,ph:Math.random()*6,y:grp.position.y});var st=new THREE.Mesh(new THREE.BoxGeometry(.6,.4+r*.55,.75),lam(0x2a2a34));st.position.set(side*(7.2+r*.7),(.4+r*.55)/2,HZ+1+k*.75);sc.add(st)}
        /* panier (peut bouger) */
        S.hx=0;S.hoop=new THREE.Group();sc.add(S.hoop);var bb=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.05,.05),lam(0xffffff,{transparent:true,opacity:.92}));bb.position.set(0,3.4,-.35);S.hoop.add(bb);var sq=new THREE.Mesh(new THREE.PlaneGeometry(.6,.45),new THREE.MeshBasicMaterial({color:0xe2361b,wireframe:true}));sq.position.set(0,3.25,-.32);S.hoop.add(sq);
        var arm=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.9),lam(0x333333));arm.position.set(0,3.4,-.8);S.hoop.add(arm);var pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,3.5,10),lam(0x333333));pole.position.set(0,1.75,-1.25);S.hoop.add(pole);var base=new THREE.Mesh(new THREE.BoxGeometry(.8,.3,.8),lam(0x2a2a2a));base.position.set(0,.15,-1.25);S.hoop.add(base);
        var rim=new THREE.Mesh(new THREE.TorusGeometry(RIM,.018,8,24),lam(0xe2361b));rim.rotation.x=Math.PI/2;rim.position.set(0,3.05,0);S.hoop.add(rim);S.net=new THREE.Mesh(new THREE.CylinderGeometry(RIM,RIM*.6,.42,12,3,true),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true}));S.net.position.set(0,2.84,0);S.hoop.add(S.net);S.hoop.position.z=HZ;
        var bt=cvT(128,128,function(g){g.fillStyle='#e06a1a';g.fillRect(0,0,128,128);g.strokeStyle='#2a1408';g.lineWidth=4;g.beginPath();g.moveTo(0,64);g.lineTo(128,64);g.moveTo(64,0);g.lineTo(64,128);g.stroke();g.beginPath();g.arc(0,64,50,-1.2,1.2);g.stroke();g.beginPath();g.arc(128,64,50,1.9,4.4);g.stroke()});
        S.ball=new THREE.Mesh(new THREE.SphereGeometry(BR,20,14),new THREE.MeshLambertMaterial({map:bt}));S.ball.castShadow=true;sc.add(S.ball);
        /* mains du joueur */
        S.hands=new THREE.Group();[-1,1].forEach(function(s){var h=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),lam(0xd9a77c));h.scale.set(1,.8,1.3);h.position.set(s*.16,0,0);S.hands.add(h);var arm2=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.5,8),lam(0x3fa9ff));arm2.rotation.x=Math.PI/2.4;arm2.position.set(s*.18,-.12,.24);S.hands.add(arm2)});sc.add(S.hands);
        S.hands.visible=false;S.side=1;S.sideX=1;
        /* ton perso, vu de dos : il dribble, change de main, saute pour tirer */
        if(PP.perso&&PP.perso.build){S.me=PP.perso.build(PP.perso.get());S.me.scale.setScalar(.82);S.me.traverse(function(o){if(o.isMesh)o.castShadow=true});sc.add(S.me);S.P=S.me.userData.parts}
        S.px=0;S.pz=HZ+6;S.cur=0;S.pts=[0,0];S.score=0;S.time=TURN;S.phase='hold';S.pw=0;S.jump=0;S.dr=0;S.streak=0;S.made=0;S.camY=1.7;S.mx=0;S.my=0;S.hold=null;
        C.keysText('<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> ou flèches : te déplacer en dribblant · maintiens clic ou <kbd>Espace</kbd> et relâche dans la zone verte pour tirer (tu sautes) · la souris ajuste le tir');
        C.over('Basket 3D',(C.mode==='duel'?'Chacun '+TURN+' secondes, le meilleur score gagne.':TURN+' secondes pour marquer un max.')+' Déplace-toi sur le terrain : derrière la ligne courbe, c\'est 3 points. Après 30 s, le panier se met à bouger !<br>Record : <b>'+C.best('pts')+'</b>','Coup d\'envoi')},
      start:function(C){if(S.made||S.time<TURN){this.setup(C);C.hide()}},
      mouse:function(C,t,x,y){S.mx=x/960-.5;S.my=y/540-.5;if(!C.running)return;if(t==='down'&&S.phase==='hold'){S.phase='charge';S.pw=0;S.dir=1}if(t==='up'&&S.phase==='charge')shoot(C)},
      key:function(C,k,d){if(!C.running||k!=='Space')return;if(d&&S.phase==='hold'){S.phase='charge';S.pw=0;S.dir=1}else if(!d&&S.phase==='charge')shoot(C)},
      step:function(C,dt){var k=C.keys,H=hoopPos();S.time-=dt;
        /* panier mobile après 30 s */
        var el=TURN-S.time;S.hx=el>30?Math.sin((el-30)*.9)*1.6:0;S.hoop.position.x=S.hx;H=hoopPos();
        /* déplacement relatif au panier */
        var toH=new THREE.Vector2(H.x-S.px,H.z-S.pz),dist=toH.length(),fx=toH.x/dist,fz=toH.y/dist,mvF=((k.KeyW||k.KeyZ||k.ArrowUp)?1:0)-((k.KeyS||k.ArrowDown)?1:0),mvS=((k.KeyD||k.ArrowRight)?1:0)-((k.KeyA||k.KeyQ||k.ArrowLeft)?1:0);
        var moving=(mvF||mvS)&&S.phase!=='fly'&&S.jump<=0,sp=(S.phase==='charge'?1.6:4.2)*dt;if(moving){S.px+=(fx*mvF-fz*mvS)*sp;S.pz+=(fz*mvF+fx*mvS)*sp;S.dr+=dt*9}
        S.px=Math.max(-6.8,Math.min(6.8,S.px));S.pz=Math.max(HZ+1.2,Math.min(HZ+11,S.pz));dist=Math.hypot(H.x-S.px,H.z-S.pz);
        if(S.phase==='charge'){S.pw+=S.dir*dt*1.15;if(S.pw>1){S.pw=1;S.dir=-1}if(S.pw<0){S.pw=0;S.dir=1}}
        S.sweet=Math.min(.92,.32+dist*.075);
        /* saut au moment du tir */
        if(S.jump>0){S.jump-=dt}var jy=S.jump>0?Math.sin((1-S.jump/.7)*Math.PI)*.55:0;
        var eye=S.me?new THREE.Vector3(S.px-fx*3.3+fz*.55,2.55+jy*.5,S.pz-fz*3.3-fx*.55):new THREE.Vector3(S.px,1.7+jy+(moving?Math.abs(Math.sin(S.dr))*.05:0),S.pz);if(S.me){eye.x=Math.max(-6.4,Math.min(6.4,eye.x));eye.z=Math.min(HZ+13,eye.z)}C.cam.position.lerp(eye,Math.min(1,dt*(S.me?6:12)));
        var look=new THREE.Vector3(H.x+S.mx*2.2,H.y-.9-S.my*1.6+(S.phase==='fly'?.4:0)-(S.me?.6:0),H.z);C.cam.lookAt(look);
        if(S.me){var P=S.P,ang=Math.atan2(-fx,-fz),wk=moving?Math.sin(S.dr*.9):0;S.me.position.set(S.px,jy,S.pz);S.me.rotation.y=ang;
          if(mvS)S.side=mvS>0?1:-1;S.sideX+=(S.side-S.sideX)*Math.min(1,dt*9);
          var up=S.phase==='charge'||S.jump>.35,ch=S.phase==='charge'?S.pw:0;
          P.legs[0].rotation.x=wk*.6-ch*.3;P.legs[1].rotation.x=-wk*.6-ch*.3;P.knees[0].rotation.x=Math.max(0,-wk)*.8+ch*.7;P.knees[1].rotation.x=Math.max(0,wk)*.8+ch*.7;P.root.position.y=-ch*.08;
          if(up){P.arms[0].rotation.x=P.arms[1].rotation.x=2.7+(S.jump>0?.3:0);P.arms[0].rotation.z=-.15;P.arms[1].rotation.z=.15;P.elbows[0].rotation.x=P.elbows[1].rotation.x=S.jump>0?.1:.9}
          else if(moving&&S.phase==='hold'){var di=S.side>0?1:0,ot=1-di,bn=Math.abs(Math.sin(S.dr*1.1));P.arms[di].rotation.x=.55+bn*.25;P.elbows[di].rotation.x=.5+bn*.5;P.arms[di].rotation.z=di?.25:-.25;P.arms[ot].rotation.x=-wk*.5;P.elbows[ot].rotation.x=.4;P.arms[ot].rotation.z=0}
          else{P.arms[0].rotation.x=P.arms[1].rotation.x=.9;P.elbows[0].rotation.x=P.elbows[1].rotation.x=.9;P.arms[0].rotation.z=.25;P.arms[1].rotation.z=-.25}
          P.torso.rotation.x=ch*.15;S.me.updateMatrixWorld(true)}
        /* mains et ballon (dribble quand on bouge) */
        var q=C.cam.quaternion,hpos=new THREE.Vector3(0,-.24,-.72).applyQuaternion(q).add(C.cam.position);S.hands.position.copy(hpos);S.hands.quaternion.copy(q);
        if(S.me&&(S.phase==='hold'||S.phase==='charge')){var hl=new THREE.Vector3(),hr2=new THREE.Vector3(),bp2;S.P.hands[0].getWorldPosition(hl);S.P.hands[1].getWorldPosition(hr2);
          if(moving&&S.phase==='hold'){var bn2=Math.abs(Math.sin(S.dr*1.1)),hand=S.sideX>0?hr2:hl,mid=hl.clone().lerp(hr2,(S.sideX+1)/2);bp2=new THREE.Vector3(mid.x-fx*.12,BR+(hand.y-BR-.08)*bn2,mid.z-fz*.12);if(bn2<.08&&!S.thud){S.thud=1;sfx.play('tick')}if(bn2>.3)S.thud=0;S.ball.position.copy(bp2)}
          else{bp2=hl.clone().add(hr2).multiplyScalar(.5);bp2.x+=fx*.12;bp2.z+=fz*.12;bp2.y+=S.phase==='charge'?.12:.02;S.ball.position.lerp(bp2,Math.min(1,dt*20))}S.ball.rotation.x-=dt*(moving?10:0)}
        else if(S.phase==='hold'||S.phase==='charge'){var bp;if(moving&&S.phase==='hold'){var bounce=Math.abs(Math.sin(S.dr*1.1));bp=new THREE.Vector3(.16,-.18-(1-bounce)*1.25,-.78).applyQuaternion(q).add(C.cam.position);bp.y=Math.max(BR,bp.y);if(bounce<.08&&!S.thud){S.thud=1;sfx.play('tick')}if(bounce>.3)S.thud=0}else{bp=new THREE.Vector3(.02,-.17+(S.phase==='charge'?S.pw*.1:0),-.74).applyQuaternion(q).add(C.cam.position)}S.ball.position.lerp(bp,Math.min(1,dt*18));S.ball.rotation.x-=dt*(moving?10:0)}
        if(S.phase==='fly'||S.phase==='loose'){var B=S.b,n=6;for(var s=0;s<n;s++){var h=dt/n;B.v.y-=9.8*h;B.p.addScaledVector(B.v,h);var dr=Math.hypot(B.p.x-H.x,B.p.z-H.z);
            var ringD=Math.hypot(dr-RIM,B.p.y-H.y);if(ringD<BR+.02){var nx=(dr-RIM),ny=(B.p.y-H.y),l=Math.hypot(nx,ny)||1,rx=(B.p.x-H.x)/(dr||1),rz=(B.p.z-H.z)/(dr||1),N3=new THREE.Vector3(rx*nx/l,ny/l,rz*nx/l),vn=B.v.dot(N3);if(vn<0){B.v.addScaledVector(N3,-1.6*vn);B.v.multiplyScalar(.8);sfx.play('tick')}B.p.addScaledVector(N3,(BR+.02-ringD))}
            if(B.p.z<H.z-.32+BR&&B.p.z>H.z-.6&&Math.abs(B.p.x-H.x)<.9&&B.p.y>2.87&&B.p.y<3.92&&B.v.z<0){B.v.z=-B.v.z*.6;B.p.z=H.z-.32+BR;sfx.play('hit')}
            if(!B.scored&&B.prevY>H.y&&B.p.y<=H.y&&dr<RIM-.03&&S.phase==='fly'){B.scored=true;var three=B.from>6.5,pts=three?3:2;S.made++;S.streak++;if(C.mode==='duel')S.pts[S.cur]+=pts;else S.score+=pts;sfx.play('win');S.swish=.5;S.cheer=1.2;C.pop(S.streak>=3?'EN FEU x'+S.streak:(three?'3 POINTS !':'PANIER !'),three?'#f3c623':'#f1ece2');if(S.streak>=3)C.shake(5)}
            if(B.p.y<BR){B.p.y=BR;B.v.y=-B.v.y*.6;B.v.x*=.85;B.v.z*=.85;if(Math.abs(B.v.y)>1)sfx.play('tick')}
            if(Math.abs(B.p.x)>7.5){B.v.x=-B.v.x*.5;B.p.x=Math.sign(B.p.x)*7.5}if(B.p.z<HZ-1.9){B.v.z=-B.v.z*.5;B.p.z=HZ-1.9}
            B.prevY=B.p.y}
          S.ball.position.copy(B.p);S.ball.rotation.x-=dt*8;S.t+=dt;if(S.phase==='fly'&&S.t>1.8){if(!B.scored){S.streak=0;C.pop('RATÉ','#f1ece2','40px')}S.phase='loose';S.t=0}
          if(S.phase==='loose'&&S.t>.5){/* la balle revient vers toi (passe) */var tgt=S.me?new THREE.Vector3(S.px,1.25,S.pz):new THREE.Vector3(.02,-.17,-.74).applyQuaternion(C.cam.quaternion).add(C.cam.position);S.ball.position.lerp(tgt,Math.min(1,dt*5));B.p.copy(S.ball.position);B.v.set(0,0,0);if(S.ball.position.distanceTo(tgt)<.15){S.phase='hold'}}}
        if(S.swish>0){S.swish-=dt;S.net.scale.y=1+Math.sin(S.swish*30)*.18}
        S.cheer=Math.max(0,(S.cheer||0)-dt);var tn=performance.now()/1000;S.crowd.forEach(function(c){c.g.position.y=c.y+(S.cheer>0?Math.abs(Math.sin(tn*9+c.ph))*.35:Math.abs(Math.sin(tn*1.5+c.ph))*.04)});
        /* tableau */
        if(!S.sbT0||tn-S.sbT0>.25){S.sbT0=tn;var g2=S.sb.getContext('2d');g2.fillStyle='#0b0b10';g2.fillRect(0,0,256,96);g2.font='700 44px "IBM Plex Mono",monospace';g2.textAlign='center';g2.textBaseline='middle';g2.fillStyle='#e2361b';g2.fillText(String(C.mode==='duel'?S.pts[S.cur]:S.score).padStart(2,'0'),70,50);g2.fillStyle='#f3c623';g2.fillText(Math.max(0,Math.ceil(S.time)),190,50);S.sbT.needsUpdate=true}
        if(S.time<=0&&S.phase!=='fly'){if(C.mode==='duel'&&S.cur===0){S.cur=1;S.time=TURN;S.px=0;S.pz=HZ+6;S.phase='hold';S.streak=0;C.pop('À J2 !','#3fa9ff');return}return end(C)}
        var three2=dist>6.5,bar=S.phase==='charge'?'<span>Puissance <b style="color:'+(Math.abs(S.pw-S.sweet)<.06?'#3fe09a':'#e2361b')+'">'+'█'.repeat(Math.round(S.pw*12))+'</b> · zone <b>'+'·'.repeat(Math.round(S.sweet*12))+'</b></span>':'';
        C.hud((C.mode==='duel'?'<span>Joueur <b>J'+(S.cur+1)+'</b></span><span>J1 <b>'+S.pts[0]+'</b> · J2 <b>'+S.pts[1]+'</b></span>':'<span>Score <b>'+S.score+'</b></span>')+'<span>Temps <b>'+Math.max(0,Math.ceil(S.time))+' s</b></span><span>'+(three2?'Zone <b>3 pts</b>':'Zone 2 pts')+'</span>'+(S.hx?'<span style="background:#e2361b;color:#fff">Panier mobile</span>':'')+bar)},
      draw:function(C){C.R.render(C.scene,C.cam)}});
    function shoot(C){var H=hoopPos(),from=S.ball.position.clone(),dx=H.x-from.x,dz=H.z-from.z,dh=Math.hypot(dx,dz),ang=.92,g=9.8,dy=H.y-from.y-(.3);
      var vIdeal=Math.sqrt(g*dh*dh/(2*Math.cos(ang)*Math.cos(ang)*(dh*Math.tan(ang)-dy)));var err=(S.pw-S.sweet)*1.6,v=vIdeal*(1+err*.3);var hx=dx/dh,hz=dz/dh,off=S.mx*.18,cx=Math.cos(off),sx=Math.sin(off),hx2=hx*cx-hz*sx,hz2=hx*sx+hz*cx;
      from.y+=.3;S.b={p:from,v:new THREE.Vector3(hx2*v*Math.cos(ang),v*Math.sin(ang)-S.my*1.1,hz2*v*Math.cos(ang)),prevY:from.y,scored:false,from:Math.hypot(H.x-S.px,H.z-S.pz)};S.phase='fly';S.t=0;S.jump=.7;sfx.play('ui')}
    function end(C){C.stop();if(C.mode==='duel'){C.over(S.pts[0]===S.pts[1]?'Égalité':(S.pts[0]>S.pts[1]?'J1':'J2')+' gagne !','J1 <b>'+S.pts[0]+'</b> – <b>'+S.pts[1]+'</b> J2','Rejouer');return}var nb=C.best('pts',S.score);if(S.score>=20)C.win();C.over('Fin du match','<b>'+S.score+'</b> points ('+S.made+' paniers)'+(nb?' · nouveau record !':''),'Rejouer')}
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
  (function(){var CPOOL=null;function popPool(n){var e=document.querySelector('#v-pool .stage');if(!e)return;var d=document.createElement('div');d.className='ag-pop';d.style.fontSize='48px';d.textContent=n===8?'LA NOIRE !':'RENTRÉE !';e.appendChild(d);setTimeout(function(){d.remove()},1300)}
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
            POCK.forEach(function(p){if(!b.in&&Math.hypot(b.x-p[0],b.y-p[1])<PR){b.in=true;b.vx=b.vy=0;S.potted.push(b.n);sfx.play('win');if(PP.cur()==='pool'&&b.n)popPool(b.n)}})});
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
