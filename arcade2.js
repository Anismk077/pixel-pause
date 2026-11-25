/* Pixel Pause — jeux arcade, lot 2 : Bowling 3D, Mini-golf 3D, Tir à l'arc 3D, Tanks, Bataille navale */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',BLU='#3fa9ff',GRN='#3fe09a';
  function lam(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))}
  function cvTex(w,h,fn,rx,ry){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rx)t.repeat.set(rx,ry);return t}
  function clearScene(C){while(C.scene.children.length)C.scene.remove(C.scene.children[0])}
  function lights(C,sh){C.scene.add(new THREE.HemisphereLight(0xfff4e6,0x40404a,.85));var s=new THREE.DirectionalLight(0xffffff,1.1);s.position.set(6,14,8);if(sh){s.castShadow=true;s.shadow.mapSize.set(1024,1024);var c=s.shadow.camera;c.left=c.bottom=-sh;c.right=c.top=sh;c.far=80}C.scene.add(s);return s}

  /* ================= BOWLING 3D ================= */
  (function(){
    var S,LANE=1.05,LEN=18,BR=.11,PR=.06,PINS=[];
    (function(){var r=0,sp=.3;for(var row=0;row<4;row++)for(var i=0;i<=row;i++)PINS.push([(i-row/2)*sp,-(LEN-1.2)-row*sp*.87])})();
    function pinMesh(){var pts=[[0,0],[.028,0],[.045,.06],[.06,.13],[.055,.2],[.03,.27],[.025,.29],[.032,.32],[.034,.35],[.02,.38],[0,.385]].map(function(p){return new THREE.Vector2(p[0],p[1])});
      var tex=cvTex(64,128,function(g,w,h){g.fillStyle='#fbf8f2';g.fillRect(0,0,w,h);g.fillStyle=RED;g.fillRect(0,h*.22,w,h*.05);g.fillRect(0,h*.3,w,h*.05)});var m=new THREE.Mesh(new THREE.LatheGeometry(pts,16),new THREE.MeshLambertMaterial({map:tex}));m.castShadow=true;return m}
    function rackPins(){S.pins.forEach(function(p){if(p.m)C0.scene.remove(p.m)});S.pins=PINS.map(function(q){var m=pinMesh();m.position.set(q[0],0,q[1]);C0.scene.add(m);return {x:q[0],z:q[1],vx:0,vz:0,m:m,down:false,tilt:0,ax:0,az:0,up:true}})}
    var C0;
    function score(rolls){var s=0,i=0,fr=[];for(var f=0;f<10;f++){if(rolls[i]==null)break;if(rolls[i]===10){if(rolls[i+2]==null){fr.push(null);break}s+=10+rolls[i+1]+rolls[i+2];i++}else{if(rolls[i+1]==null){fr.push(null);break}if(rolls[i]+rolls[i+1]===10){if(rolls[i+2]==null){fr.push(null);break}s+=10+rolls[i+2]}else s+=rolls[i]+rolls[i+1];i+=2}fr.push(s)}return {fr:fr,tot:s}}
    function frameOf(rolls){var i=0,f=0;while(f<9&&i<rolls.length){if(rolls[i]===10){i++}else{if(i+1>=rolls.length)return {f:f,b:1};i+=2}f++}if(f<9)return {f:f,b:0};var t=rolls.slice(i);return {f:9,b:t.length,t:t}}
    function gameDone(rolls){var fo=frameOf(rolls);if(fo.f<9)return false;var t=fo.t;if(t.length<2)return false;if(t.length===2)return t[0]+t[1]<10;return true}
    function newRoll(C){S.ball={x:0,z:-.3,vx:0,vz:0,rolling:false,spin:0};S.phase='aim';S.power=0;S.aim=0;S.t=0;S.mx=null;S.mesh.position.set(0,BR,-.3)}
    function pl(){return S.players[S.cur]}
    function knocked(){return S.pins.filter(function(p){return p.up&&p.down}).length}
    function finishRoll(C){var n=S.pins.filter(function(p){return p.up&&p.down}).length;var P=pl(),fo=frameOf(P.rolls),first=fo.b===0||(fo.f===9&&(fo.t.length===0||(fo.t.length===1&&fo.t[0]===10)||(fo.t.length===2&&fo.t[0]+fo.t[1]===10)));
      P.rolls.push(n);S.msg=n===10&&first?'STRIKE !':(!first&&S.standing-n===0?'SPARE !':n+' quille'+(n>1?'s':''));C.pop(S.msg,n===10&&first?'#e2361b':(S.msg==='SPARE !'?'#3fa9ff':'#f1ece2'),S.msg.length>8?'52px':null);if(n===10&&first)C.shake(10);sfx.play(n>=S.standing&&n?'win':'hit');
      S.pins.forEach(function(p){if(p.down){p.up=false;C.scene.remove(p.m)}});S.standing=S.pins.filter(function(p){return p.up}).length;
      var fo2=frameOf(P.rolls),newFrame=fo2.b===0&&!(fo2.f===9&&fo2.t.length);var tenthReset=fo2.f===9&&fo2.t.length&&(fo2.t[fo2.t.length-1]===10||(fo2.t.length===2&&fo2.t[0]+fo2.t[1]===10&&fo2.t[0]!==10));
      setTimeout(function(){
        if(gameDone(P.rolls)||newFrame){if(S.players.every(function(p){return gameDone(p.rolls)}))return end(C);if(gameDone(P.rolls)||newFrame){S.cur=(S.cur+1)%S.players.length;while(gameDone(pl().rolls))S.cur=(S.cur+1)%S.players.length}rackPins();S.standing=10}
        else if(tenthReset||S.standing===0){rackPins();S.standing=10}
        S.msg='';newRoll(C)},1500)}
    function end(C){C.stop();var sc=S.players.map(function(p){return score(p.rolls).tot});var best=Math.max.apply(null,sc),nb=C.best('pts',S.mode==='solo'?sc[0]:best);if(S.mode==='solo'&&sc[0]>=150)C.win();
      C.over('Partie terminée',S.players.map(function(p,i){return p.n+' : <b>'+sc[i]+'</b>'}).join(' · ')+(nb?'<br>Nouveau record !':''),'Rejouer')}
    PP.arcade({id:'bowl',three:true,
      setup:function(C){C0=C;ag.three(C,0x1a1412);clearScene(C);lights(C,4);var sc=C.scene;S={mode:C.mode,pins:[],players:C.mode==='duel'?[{n:'J1',rolls:[]},{n:'J2',rolls:[]}]:[{n:'Toi',rolls:[]}],cur:0,standing:10,msg:''};
        var wood=cvTex(128,512,function(g,w,h){for(var i=0;i<16;i++){g.fillStyle=['#d9b27a','#cfa56c','#e0bb86'][i%3];g.fillRect(i*8,0,8,h)}g.fillStyle='rgba(0,0,0,.08)';for(var y=0;y<h;y+=64)g.fillRect(0,y,w,1)},1,6);
        var lane=new THREE.Mesh(new THREE.BoxGeometry(LANE,.1,LEN+2),new THREE.MeshLambertMaterial({map:wood}));lane.position.set(0,-.05,-LEN/2);lane.receiveShadow=true;sc.add(lane);
        [-1,1].forEach(function(s){var gu=new THREE.Mesh(new THREE.BoxGeometry(.24,.06,LEN+2),lam(0x2a2a30));gu.position.set(s*(LANE/2+.12),-.08,-LEN/2);sc.add(gu);var wall=new THREE.Mesh(new THREE.BoxGeometry(.1,.4,LEN+3),lam(0x3a3240));wall.position.set(s*(LANE/2+.3),.1,-LEN/2);sc.add(wall)});
        for(var a=0;a<7;a++){var ar=new THREE.Mesh(new THREE.ConeGeometry(.04,.12,3),lam(RED));ar.rotation.x=-Math.PI/2;ar.position.set((a-3)*.13,.005,-4.5);ar.rotation.z=0;sc.add(ar)}
        var back=new THREE.Mesh(new THREE.BoxGeometry(4,2,.2),lam(0x141210));back.position.set(0,.6,-LEN-1.4);sc.add(back);var pit=new THREE.Mesh(new THREE.BoxGeometry(2.4,.05,1.6),lam(0x0a0a0a));pit.position.set(0,-.2,-LEN-.6);sc.add(pit);
        var sign=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.6),new THREE.MeshBasicMaterial({map:cvTex(512,96,function(g,w,h){g.fillStyle=INK;g.fillRect(0,0,w,h);g.font='400 64px Anton, Impact';g.fillStyle=RED;g.textAlign='center';g.textBaseline='middle';g.fillText('PIXEL BOWL',w/2,h/2+4)})}));sign.position.set(0,1.4,-LEN-1.28);sc.add(sign);
        /* salle : pistes voisines, néons, rampe de retour des boules, spot sur les quilles */
        [-1,1].forEach(function(s2){var l2=lane.clone();l2.position.x=s2*2.3;sc.add(l2);for(var q=0;q<10;q++){var pm=pinMesh();pm.position.set(s2*2.3+PINS[q][0],0,PINS[q][1]);sc.add(pm)}var rr=new THREE.Mesh(new THREE.BoxGeometry(.35,.3,LEN),lam(0x2a2430));rr.position.set(s2*1.15,.05,-LEN/2);sc.add(rr)});
        var neonC=[0xe2361b,0x3fa9ff];[-1,1].forEach(function(s3,i){var ne=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,LEN+2),new THREE.MeshBasicMaterial({color:neonC[i]}));ne.position.set(s3*(LANE/2+.36),.32,-LEN/2);sc.add(ne)});
        var spot=new THREE.SpotLight(0xfff2d8,2.2,12,.55,.5);spot.position.set(0,3,-LEN+1.5);spot.target.position.set(0,0,-LEN-.4);spot.castShadow=true;sc.add(spot);sc.add(spot.target);
        for(var cl=0;cl<6;cl++){var lmp=new THREE.Mesh(new THREE.BoxGeometry(3,.05,.25),new THREE.MeshBasicMaterial({color:0xfff6e0}));lmp.position.set(0,2.6,-cl*3.3);sc.add(lmp)}
        var floor=new THREE.Mesh(new THREE.PlaneGeometry(12,LEN+8),lam(0x2a1e2e));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.12,-LEN/2);sc.add(floor);
        S.mesh=new THREE.Mesh(new THREE.SphereGeometry(BR,24,18),new THREE.MeshStandardMaterial({color:0x2a4fd0,roughness:.25,metalness:.1}));S.mesh.castShadow=true;sc.add(S.mesh);
        S.arrow=new THREE.Mesh(new THREE.ConeGeometry(.05,.3,8),new THREE.MeshBasicMaterial({color:0xf3c623}));S.arrow.rotation.x=-Math.PI/2;sc.add(S.arrow);
        rackPins();newRoll(C);C.cam.position.set(0,1.1,1.6);C.cam.lookAt(0,0,-8);
        C.keysText('Souris ou <kbd>←</kbd><kbd>→</kbd> : place la boule · maintiens clic ou <kbd>Espace</kbd> pour la puissance, relâche pour lancer (la flèche jaune donne la direction)');
        C.over('Bowling 3D','10 frames, 2 boules par frame. Strike et spare comptent comme au vrai bowling.'+(C.mode==='duel'?' Chacun son tour, J1 puis J2.':'')+'<br>Record : <b>'+C.best('pts')+'</b>','Jouer')},
      start:function(C){if(S.players.some(function(p){return p.rolls.length})){this.setup(C);C.hide()}},
      mouse:function(C,t,x){if(!C.running)return;S.mx=(x/960-.5);if(t==='down'&&S.phase==='aim'){S.phase='charge';S.power=0}if(t==='up'&&S.phase==='charge')throwB(C)},
      key:function(C,k,d){if(!C.running)return;if(k==='Space'){if(d&&S.phase==='aim'){S.phase='charge';S.power=0}else if(!d&&S.phase==='charge')throwB(C)}},
      step:function(C,dt){var B=S.ball;S.t+=dt;
        if(S.phase==='aim'||S.phase==='charge'){if(S.mx!=null)B.x+=((S.mx*1.3)-B.x)*Math.min(1,dt*10);if(C.keys.ArrowLeft)B.x-=dt*.6;if(C.keys.ArrowRight)B.x+=dt*.6;B.x=Math.max(-LANE/2+BR,Math.min(LANE/2-BR,B.x));S.aim=Math.sin(S.t*1.6)*.09;
          if(S.phase==='charge')S.power=Math.min(1,S.power+dt*.8);S.mesh.position.set(B.x,BR,B.z);S.arrow.visible=true;S.arrow.position.set(B.x+Math.sin(S.aim)*.6,.02,B.z-.6);S.arrow.rotation.z=-S.aim}
        else S.arrow.visible=false;
        if(S.phase==='roll'){var n=4;for(var s=0;s<n;s++){var h=dt/n;B.x+=B.vx*h;B.z+=B.vz*h;B.vx+=B.spin*h;
            if(Math.abs(B.x)>LANE/2&&!B.gutter){B.gutter=true;B.vx=0;B.x=Math.sign(B.x)*(LANE/2+.1)}
            S.pins.forEach(function(p){if(!p.up)return;var dx=p.x-B.x,dz=p.z-B.z,d=Math.hypot(dx,dz);if(d<BR+PR&&!B.gutter){var nx=dx/d,nz=dz/d,rv=(B.vx-p.vx)*nx+(B.vz-p.vz)*nz;if(rv>0){var j=2*rv/(1/7+1/1.5);p.vx+=j/1.5*nx;p.vz+=j/1.5*nz;B.vx-=j/7*nx;B.vz-=j/7*nz;p.down=true;sfx.play('hit')}p.x=B.x+nx*(BR+PR)}});
            for(var i=0;i<S.pins.length;i++){var a=S.pins[i];if(!a.up)continue;a.x+=a.vx*h;a.z+=a.vz*h;for(var k=i+1;k<S.pins.length;k++){var b=S.pins[k];if(!b.up)continue;var ex=b.x-a.x,ez=b.z-a.z,e=Math.hypot(ex,ez);if(e<PR*2&&e>0){var nx2=ex/e,nz2=ez/e,rv2=(a.vx-b.vx)*nx2+(a.vz-b.vz)*nz2;if(rv2>0){a.vx-=rv2*nx2*.9;a.vz-=rv2*nz2*.9;b.vx+=rv2*nx2*.9;b.vz+=rv2*nz2*.9;if(Math.abs(rv2)>.3){a.down=b.down=true}}var push=(PR*2-e)/2;a.x-=nx2*push;a.z-=nz2*push;b.x+=nx2*push;b.z+=nz2*push}}
              if(Math.abs(a.x)>LANE/2+.05)a.down=true}}
          S.pins.forEach(function(p){if(!p.up)return;p.vx*=Math.pow(.25,dt);p.vz*=Math.pow(.25,dt);if(p.down){p.tilt=Math.min(Math.PI/2,p.tilt+dt*6);if(!p.ax&&!p.az){var l=Math.hypot(p.vx,p.vz)||1;p.ax=p.vz/l;p.az=-p.vx/l;if(!p.vx&&!p.vz){p.ax=1}}}p.m.position.set(p.x,p.tilt?.03:0,p.z);p.m.rotation.set(p.ax*p.tilt,0,p.az*p.tilt)});
          S.mesh.position.set(B.x,B.gutter?BR-.08:BR,B.z);S.mesh.rotation.x-=B.vz*dt/BR;
          if(B.z<-LEN-1.2||(S.t>9)){S.phase='settle';S.t=0}}
        if(S.phase==='settle'){S.pins.forEach(function(p){if(!p.up)return;p.vx*=Math.pow(.1,dt);p.vz*=Math.pow(.1,dt);p.x+=p.vx*dt;p.z+=p.vz*dt;if(p.down)p.tilt=Math.min(Math.PI/2,p.tilt+dt*6);p.m.position.set(p.x,p.tilt?.03:0,p.z);p.m.rotation.set((p.ax||1)*p.tilt,0,(p.az||0)*p.tilt)});if(S.t>1.2){S.phase='wait';finishRoll(C)}}
        var cz=S.phase==='roll'?Math.max(-LEN+3,B.z+1.6):S.phase==='settle'||S.phase==='wait'?-LEN+3:1.6;C.cam.position.z+=(cz-C.cam.position.z)*Math.min(1,dt*3);C.cam.position.y+=((S.phase==='aim'||S.phase==='charge'?1.1:.8)-C.cam.position.y)*Math.min(1,dt*3);C.cam.lookAt(0,0,C.cam.position.z-9);
        var P=pl(),sc=score(P.rolls),fo=frameOf(P.rolls);
        C.hud('<span>'+P.n+'</span><span>Frame <b>'+Math.min(10,fo.f+1)+'</b></span><span>Score <b>'+sc.tot+'</b></span>'+(S.players.length>1?'<span>'+S.players.map(function(p){return p.n+' '+score(p.rolls).tot}).join(' · ')+'</span>':'')+(S.phase==='charge'?'<span>Puissance <b>'+Math.round(S.power*100)+' %</b></span>':'')+(S.msg?'<span style="background:#e2361b;color:#fff">'+S.msg+'</span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)}});
    function throwB(C){var B=S.ball,sp=4+S.power*7;B.vx=Math.sin(S.aim)*sp;B.vz=-Math.cos(S.aim)*sp;B.spin=(Math.random()-.5)*.25;S.phase='roll';S.t=0;sfx.play('ui')}
  })();

  /* ================= MINI-GOLF 3D ================= */
  (function(){
    var S,BR=.12,HR=.2;
    /* trous : murs (x0,z0,x1,z1 en boîtes), départ, trou, par, obstacles */
    var HOLES=[
      {w:[[-2,-8,2,-7.8],[-2,1.8,2,2],[-2.2,-8,-2,2],[2,-8,2.2,2]],s:[0,1],h:[0,-6.5],par:2},
      {w:[[-2,-9,2,-8.8],[-2,1.8,2,2],[-2.2,-9,-2,2],[2,-9,2.2,2],[-2,-4.1,1,-3.9]],s:[-1,1],h:[-1,-7.5],par:3},
      {w:[[-4,-8,4,-7.8],[-4,1.8,4,2],[-4.2,-8,-4,2],[4,-8,4.2,2],[-1,-3,1,-2.8],[-.1,-6,.1,-3]],s:[0,1],h:[0,-6.5],par:3,b:[[-2,-5,.6],[2,-5,.6]]},
      {w:[[-3,-9,3,-8.8],[-3,1.8,3,2],[-3.2,-9,-3,2],[3,-9,3.2,2]],s:[0,1],h:[0,-7.5],par:3,mill:[0,-4]},
      {w:[[-3,-8,3,-7.8],[-3,1.8,3,2],[-3.2,-8,-3,2],[3,-8,3.2,2],[-3,-2.1,1.5,-1.9],[-1.5,-5.1,3,-4.9]],s:[-2,1],h:[2,-6.8],par:4},
      {w:[[-3,-9,3,-8.8],[-3,1.8,3,2],[-3.2,-9,-3,2],[3,-9,3.2,2]],s:[0,1],h:[0,-7.6],par:3,b:[[-1.2,-3,.5],[1.2,-3,.5],[0,-5.2,.6],[-1.8,-6.5,.4],[1.8,-6.5,.4]]}];
    function build(C){clearScene(C);lights(C,8);var sc=C.scene,H=HOLES[S.hole];sc.background=new THREE.Color(0x9ed0ee);
      var grass=cvTex(128,128,function(g,w,h){g.fillStyle='#4fa043';g.fillRect(0,0,w,h);for(var i=0;i<26;i++){g.fillStyle=i%2?'#54a748':'#4a9a3f';g.fillRect(0,i*5,w,5)}},6,6);
      var ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),lam(0x6aa84f));ground.rotation.x=-Math.PI/2;ground.position.y=-.05;sc.add(ground);
      var mn=[1e9,1e9],mx=[-1e9,-1e9];H.w.forEach(function(w){mn[0]=Math.min(mn[0],w[0]);mn[1]=Math.min(mn[1],w[1]);mx[0]=Math.max(mx[0],w[2]);mx[1]=Math.max(mx[1],w[3])});
      var felt=new THREE.Mesh(new THREE.PlaneGeometry(mx[0]-mn[0],mx[1]-mn[1]),new THREE.MeshLambertMaterial({map:grass}));felt.rotation.x=-Math.PI/2;felt.position.set((mn[0]+mx[0])/2,0,(mn[1]+mx[1])/2);felt.receiveShadow=true;sc.add(felt);
      var wm=lam(0xc9763a),wt=lam(0xe8c08a);S.walls=H.w.map(function(w){var bx=new THREE.Mesh(new THREE.BoxGeometry(w[2]-w[0],.25,w[3]-w[1]),wm);bx.position.set((w[0]+w[2])/2,.12,(w[1]+w[3])/2);bx.castShadow=true;bx.receiveShadow=true;sc.add(bx);var tp=new THREE.Mesh(new THREE.BoxGeometry(w[2]-w[0]+.02,.04,w[3]-w[1]+.02),wt);tp.position.set(bx.position.x,.26,bx.position.z);sc.add(tp);return w});
      S.bumps=(H.b||[]).map(function(b){var m=new THREE.Mesh(new THREE.CylinderGeometry(b[2],b[2],.3,24),lam(0x3fa9ff));m.position.set(b[0],.15,b[1]);m.castShadow=true;sc.add(m);return b});
      var hole=new THREE.Mesh(new THREE.CircleGeometry(HR,24),new THREE.MeshBasicMaterial({color:0x111111}));hole.rotation.x=-Math.PI/2;hole.position.set(H.h[0],.005,H.h[1]);sc.add(hole);
      var pole=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,1.2,6),lam(0xffffff));pole.position.set(H.h[0],.6,H.h[1]);sc.add(pole);var flag=new THREE.Mesh(new THREE.PlaneGeometry(.4,.26),new THREE.MeshLambertMaterial({color:0xe2361b,side:THREE.DoubleSide}));flag.position.set(H.h[0]+.2,1.05,H.h[1]);sc.add(flag);S.flag=flag;
      S.mill=null;if(H.mill){var g=new THREE.Group();g.position.set(H.mill[0],0,H.mill[1]);var tw=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,1.6,8),lam(0xf1ece2));tw.position.y=.8;g.add(tw);var roof=new THREE.Mesh(new THREE.ConeGeometry(.6,.6,8),lam(0xe2361b));roof.position.y=1.9;g.add(roof);var bl=new THREE.Group();bl.position.set(0,1.2,.5);g.add(bl);for(var i=0;i<4;i++){var b=new THREE.Mesh(new THREE.BoxGeometry(.2,1.4,.04),lam(0x8a5a30));b.position.y=.7;var pv=new THREE.Group();pv.rotation.z=i*Math.PI/2;pv.add(b);bl.add(pv)}sc.add(g);S.mill={g:g,bl:bl,x:H.mill[0],z:H.mill[1],a:0}}
      /* décor autour du parcours : arbres, rochers, fleurs, barrière */
      var rnd=function(a,b){return a+Math.random()*(b-a)};for(var t=0;t<40;t++){var ang=Math.random()*6.283,rad=rnd(8,22),tx=Math.cos(ang)*rad+(mn[0]+mx[0])/2,tz=Math.sin(ang)*rad+(mn[1]+mx[1])/2;if(tx>mn[0]-1&&tx<mx[0]+1&&tz>mn[1]-1&&tz<mx[1]+1)continue;var tr=new THREE.Group(),tk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,1,6),lam(0x6b4a2a));tk.position.y=.5;tr.add(tk);var fo=new THREE.Mesh(Math.random()<.5?new THREE.ConeGeometry(.8,2,7):new THREE.IcosahedronGeometry(.9,0),lam([0x2f7a3a,0x3f8f3a,0x4f9a44][t%3],{flatShading:true}));fo.position.y=1.7;tr.add(fo);tr.position.set(tx,0,tz);tr.scale.setScalar(rnd(.8,1.5));tr.traverse(function(o){if(o.isMesh)o.castShadow=true});sc.add(tr)}
      for(var f2=0;f2<60;f2++){var fl2=new THREE.Mesh(new THREE.SphereGeometry(.06,5,4),lam([0xe2361b,0xf3c623,0xffffff,0xb072e0][f2%4]));var fa=Math.random()*6.283,fr=rnd(5,9);fl2.position.set(Math.cos(fa)*fr+(mn[0]+mx[0])/2,.06,Math.sin(fa)*fr+(mn[1]+mx[1])/2);sc.add(fl2)}
      S.mesh=new THREE.Mesh(new THREE.SphereGeometry(BR,20,14),lam(0xffffff));S.mesh.castShadow=true;sc.add(S.mesh);
      S.aimL=new THREE.Mesh(new THREE.BoxGeometry(.04,.02,1),new THREE.MeshBasicMaterial({color:0xf3c623}));sc.add(S.aimL);
      S.players.forEach(function(p){p.x=H.s[0]+(S.players.length>1?(p.i-(S.players.length-1)/2)*.35:0);p.z=H.s[1];p.vx=p.vz=0;p.in=false;p.st=0});S.cur=0;S.drag=null}
    function P(){return S.players[S.cur]}
    function hitWalls(b){S.walls.forEach(function(w){var cx=Math.max(w[0],Math.min(w[2],b.x)),cz=Math.max(w[1],Math.min(w[3],b.z)),dx=b.x-cx,dz=b.z-cz,d=Math.hypot(dx,dz);if(d<BR&&d>0){var nx=dx/d,nz=dz/d;b.x=cx+nx*BR;b.z=cz+nz*BR;var v=b.vx*nx+b.vz*nz;if(v<0){b.vx-=1.8*v*nx;b.vz-=1.8*v*nz;sfx.play('tick')}}});
      S.bumps.forEach(function(c){var dx=b.x-c[0],dz=b.z-c[1],d=Math.hypot(dx,dz);if(d<c[2]+BR){var nx=dx/d,nz=dz/d;b.x=c[0]+nx*(c[2]+BR);b.z=c[1]+nz*(c[2]+BR);var v=b.vx*nx+b.vz*nz;if(v<0){b.vx-=2.1*v*nx;b.vz-=2.1*v*nz;sfx.play('hit')}}});
      if(S.mill){var a=S.mill.a%(Math.PI/2);var blocked=a<.5;if(blocked&&Math.abs(b.x-S.mill.x)<.4&&Math.abs(b.z-(S.mill.z+.5))<.15){b.vz=Math.abs(b.vz)*.8;b.z=S.mill.z+.66;sfx.play('hit')}if(Math.abs(b.x-S.mill.x)<.5&&Math.abs(b.z-S.mill.z)<.5&&!(Math.abs(b.x-S.mill.x)<.25)){b.vx=-b.vx;b.x+=b.vx*.02}}}
    function nextTurn(C){var n=S.players.length,i;for(i=1;i<=n;i++){var c=(S.cur+i)%n;if(!S.players[c].in&&S.players[c].st<8){S.cur=c;return}}
      setTimeout(function(){S.hole++;if(S.hole>=HOLES.length)return end(C);build(C)},1200)}
    function end(C){C.stop();var tot=S.players.map(function(p){return p.tot}),par=HOLES.reduce(function(a,h){return a+h.par},0);if(S.players.length===1){var nb=C.best('coups',tot[0],true);if(tot[0]<=par)C.win();C.over('Parcours terminé','<b>'+tot[0]+'</b> coups (par '+par+')'+(nb?' · nouveau record !':''),'Rejouer');return}
      var best=Math.min.apply(null,tot);C.over('Parcours terminé',S.players.map(function(p){return p.n+' : <b>'+p.tot+'</b>'+(p.tot===best?' 🏆':'')}).join(' · ')+' (par '+par+')','Rejouer')}
    PP.arcade({id:'golf',three:true,
      setup:function(C){ag.three(C);var n=C.mode==='duel'?2:C.mode==='trio'?3:C.mode==='quad'?4:1;S={hole:0,players:[],cur:0};for(var i=0;i<n;i++)S.players.push({i:i,n:'J'+(i+1),tot:0,c:[0xffffff,0xf3c623,0xe2361b,0x3fa9ff][i]});
        build(C);C.keysText('Clique sur ta balle et tire vers l\'arrière comme un lance-pierre, relâche pour jouer · plus tu tires loin, plus c\'est fort');
        C.over('Mini-golf 3D',HOLES.length+' trous avec murs, bumpers et moulin. Le moins de coups gagne.'+(n>1?' Chacun son tour.':'')+'<br>Record : <b>'+(C.best('coups')||'—')+'</b> coups','Jouer')},
      start:function(C){if(S.hole||S.players[0].tot){this.setup(C);C.hide()}},
      mouse:function(C,t,x,y){if(!C.running)return;var p=P();if(t==='down'&&!S.moving){S.drag={x:x,y:y}}if(t==='move'&&S.drag){S.drag.cx=x;S.drag.cy=y}
        if(t==='up'&&S.drag&&S.drag.cx!=null){var dx=S.drag.x-S.drag.cx,dy=S.drag.y-S.drag.cy,l=Math.min(220,Math.hypot(dx,dy));if(l>8){var ang=Math.atan2(dx,dy);var sp=l/220*7.5,dir=S.camYaw||0;p.vx=Math.sin(ang)*sp;p.vz=Math.cos(ang)*sp;var cs=Math.cos(dir),sn=Math.sin(dir),vx=p.vx*cs+p.vz*sn,vz=-p.vx*sn+p.vz*cs;p.vx=vx;p.vz=vz;p.st++;p.tot++;S.moving=true;sfx.play('hit')}S.drag=null}else if(t==='up')S.drag=null},
      step:function(C,dt){var H=HOLES[S.hole];if(S.mill){S.mill.a+=dt*1.4;S.mill.bl.rotation.z=S.mill.a}S.flag.rotation.y=Math.sin(performance.now()/400)*.3;
        if(S.moving){var p=P(),n=6;for(var s=0;s<n;s++){var h=dt/n;p.x+=p.vx*h;p.z+=p.vz*h;hitWalls(p);var dh=Math.hypot(p.x-H.h[0],p.z-H.h[1]),sp=Math.hypot(p.vx,p.vz);if(dh<HR&&sp<4.5){p.in=true;S.moving=false;sfx.play('win');S.msg=p.st===1?'TROU EN UN !':(p.st-H.par<=-1?'BIRDIE':p.st===H.par?'PAR':p.st+' coups');C.pop(S.msg,p.st===1?'#f3c623':'#f1ece2');setTimeout(function(){S.msg=''},1400);nextTurn(C);break}else if(dh<HR*1.8&&sp<6){p.vx+=(H.h[0]-p.x)*h*6;p.vz+=(H.h[1]-p.z)*h*6}}
          var f=Math.pow(.45,dt);p.vx*=f;p.vz*=f;if(Math.hypot(p.vx,p.vz)<.06&&!p.in){p.vx=p.vz=0;S.moving=false;if(p.st>=8){p.in=true;p.tot+=1;S.msg='Maximum atteint'}nextTurn(C)}}
        var cur=P();S.mesh.position.set(cur.x,BR,cur.z);S.mesh.material.color.setHex(cur.c);
        S.players.forEach(function(q,i){if(!q.m&&S.players.length>1){q.m=new THREE.Mesh(new THREE.SphereGeometry(BR,16,12),lam(q.c));C.scene.add(q.m)}if(q.m){q.m.visible=i!==S.cur&&!q.in;q.m.position.set(q.x,BR,q.z);if(q.m.parent!==C.scene)C.scene.add(q.m)}});
        if(S.drag&&S.drag.cx!=null){var dx=S.drag.x-S.drag.cx,dy=S.drag.y-S.drag.cy,l=Math.min(220,Math.hypot(dx,dy)),a=Math.atan2(dx,dy);S.aimL.visible=true;S.aimL.scale.z=l/220*3+.2;S.aimL.rotation.y=a;S.aimL.position.set(cur.x+Math.sin(a)*(S.aimL.scale.z/2),.03,cur.z+Math.cos(a)*(S.aimL.scale.z/2))}else S.aimL.visible=false;
        var tx=cur.x,tz=cur.z;C.cam.position.x+=(tx-C.cam.position.x)*Math.min(1,dt*2.5);C.cam.position.z+=((tz+6)-C.cam.position.z)*Math.min(1,dt*2.5);C.cam.position.y=5.2;C.cam.lookAt(C.cam.position.x,0,C.cam.position.z-7.5);S.camYaw=0;
        C.hud('<span>Trou <b>'+(S.hole+1)+' / '+HOLES.length+'</b></span><span>Par <b>'+H.par+'</b></span>'+S.players.map(function(q,i){return '<span'+(i===S.cur?' style="background:#e2361b;color:#fff"':'')+'>'+q.n+' <b>'+q.tot+'</b></span>'}).join('')+(S.msg?'<span style="background:#f3c623">'+S.msg+'</span>':'')+(S.drag&&S.drag.cx!=null?'<span>Puissance <b>'+Math.round(Math.min(220,Math.hypot(S.drag.x-S.drag.cx,S.drag.y-S.drag.cy))/2.2)+' %</b></span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)}});
  })();

  /* ================= TIR À L'ARC 3D ================= */
  (function(){
    var S;
    function targetMesh(){var c=document.createElement('canvas');c.width=c.height=256;var g=c.getContext('2d'),cols=['#f1ece2','#f1ece2','#141210','#141210','#3fa9ff','#3fa9ff','#e2361b','#e2361b','#f3c623','#f3c623'];for(var i=0;i<10;i++){g.fillStyle=cols[i];g.beginPath();g.arc(128,128,128-i*12.8,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1;g.stroke()}
      var t=new THREE.Mesh(new THREE.CylinderGeometry(.61,.61,.12,40),[lam(0xc9a26a),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c)}),lam(0xc9a26a)]);t.rotation.x=Math.PI/2;var grp=new THREE.Group();grp.add(t);
      [-1,1].forEach(function(s){var lg=new THREE.Mesh(new THREE.BoxGeometry(.06,1.6,.06),lam(0x6b4a2a));lg.position.set(s*.4,-.7,.25);lg.rotation.x=-.25;grp.add(lg)});return grp}
    function newShot(){S.wind=(Math.random()-.5)*(2+S.n*.3);S.dist=[25,35,45,55,65][Math.min(4,Math.floor(S.n/2))];S.tg.position.set(0,1.5,-S.dist);S.phase='aim';S.draw=0;S.arrow=null}
    function arrowMesh(){var g=new THREE.Group(),sh=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.8,6),lam(0x8a5a30));sh.rotation.x=Math.PI/2;g.add(sh);var tip=new THREE.Mesh(new THREE.ConeGeometry(.018,.07,6),lam(0x888888));tip.rotation.x=-Math.PI/2;tip.position.z=-.43;g.add(tip);[0,1,2].forEach(function(i){var p=new THREE.Group();p.rotation.z=i*2.094;var f=new THREE.Mesh(new THREE.PlaneGeometry(.12,.04),new THREE.MeshLambertMaterial({color:i?0xf1ece2:0xe2361b,side:THREE.DoubleSide}));f.rotation.y=Math.PI/2;f.position.set(0,.022,.33);p.add(f);g.add(p)});return g}
    PP.arcade({id:'arch',three:true,
      setup:function(C){ag.three(C);clearScene(C);var sc=C.scene;lights(C,20);sc.background=new THREE.Color(0xa9d4ef);sc.fog=new THREE.Fog(0xa9d4ef,60,160);
        var gr=new THREE.Mesh(new THREE.PlaneGeometry(400,400),lam(0x6fae4a));gr.rotation.x=-Math.PI/2;sc.add(gr);var path=new THREE.Mesh(new THREE.PlaneGeometry(3,120),lam(0xcbb888));path.rotation.x=-Math.PI/2;path.position.set(0,.01,-55);sc.add(path);
        for(var i=0;i<60;i++){var x=(Math.random()<.5?-1:1)*(8+Math.random()*40),z=-Math.random()*140,t=new THREE.Group(),tr=new THREE.Mesh(new THREE.CylinderGeometry(.15,.2,1.6,6),lam(0x6b4a2a));tr.position.y=.8;t.add(tr);var lf=new THREE.Mesh(new THREE.ConeGeometry(1.1+Math.random(),2.8+Math.random()*2,7),lam(0x2f6e35,{flatShading:true}));lf.position.y=2.8;t.add(lf);t.position.set(x,0,z);sc.add(t)}
        for(var d=20;d<=70;d+=10){var mk=new THREE.Mesh(new THREE.PlaneGeometry(3,.12),lam(0xffffff));mk.rotation.x=-Math.PI/2;mk.position.set(0,.02,-d);sc.add(mk)}
        S={n:0,tot:0,shots:C.mode==='duel'?12:10,cur:0,pts:[0,0],tg:targetMesh(),flags:[]};sc.add(S.tg);
        var fl=new THREE.Mesh(new THREE.PlaneGeometry(.8,.5),new THREE.MeshLambertMaterial({color:0xe2361b,side:THREE.DoubleSide}));fl.position.set(4,3.2,-15);sc.add(fl);var fp=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,3.5,6),lam(0xffffff));fp.position.set(3.6,1.75,-15);sc.add(fp);S.flag=fl;
        S.bow=new THREE.Group();var bw=new THREE.Mesh(new THREE.TorusGeometry(.42,.02,6,24,Math.PI*.9),lam(0x5a3a22));bw.rotation.z=Math.PI/2+Math.PI*.05;S.bow.add(bw);S.str=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,.42,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.42,0)]),new THREE.LineBasicMaterial({color:0xeeeeee}));S.bow.add(S.str);sc.add(S.bow);
        S.nock=arrowMesh();sc.add(S.nock);newShot();C.cam.position.set(0,1.6,0);S.yaw=0;S.pitch=0;
        C.keysText('Bouge la souris pour viser · maintiens le clic pour bander l\'arc, relâche pour tirer · regarde le vent (drapeau et flèche du haut)');
        C.over('Tir à l\'arc 3D',S.shots+' flèches, cible de plus en plus loin. Compense le vent et la chute de la flèche. Le centre jaune vaut 10.'+(C.mode==='duel'?' J1 et J2 tirent chacun leur tour.':'')+'<br>Record : <b>'+C.best('pts')+'</b>','Jouer')},
      start:function(C){if(S.n){this.setup(C);C.hide()}},
      mouse:function(C,t,x,y){S.yaw=-(x/960-.5)*.5;S.pitch=-(y/540-.5)*.32;if(!C.running)return;if(t==='down'&&S.phase==='aim'){S.phase='draw';S.draw=0;sfx.play('tick')}if(t==='up'&&S.phase==='draw')shoot(C)},
      step:function(C,dt){C.cam.rotation.order='YXZ';C.cam.rotation.y+=(S.yaw-C.cam.rotation.y)*Math.min(1,dt*8);C.cam.rotation.x+=(S.pitch-C.cam.rotation.x)*Math.min(1,dt*8);
        if(S.phase==='draw')S.draw=Math.min(1,S.draw+dt*.9);
        var f=new THREE.Vector3(0,0,-1).applyEuler(C.cam.rotation),r=new THREE.Vector3(1,0,0).applyEuler(C.cam.rotation),u=new THREE.Vector3(0,1,0).applyEuler(C.cam.rotation);
        S.bow.position.copy(C.cam.position).addScaledVector(f,1.25).addScaledVector(r,-.08).addScaledVector(u,-.1);S.bow.rotation.copy(C.cam.rotation);S.bow.scale.setScalar(.6);
        var pull=S.phase==='draw'?S.draw*.28:0;S.str.geometry.setFromPoints([new THREE.Vector3(0,.42,0),new THREE.Vector3(0,0,pull),new THREE.Vector3(0,-.42,0)]);
        S.nock.visible=S.phase==='aim'||S.phase==='draw';S.nock.position.copy(S.bow.position).addScaledVector(f,.2-pull*.6).addScaledVector(r,.0);S.nock.rotation.copy(C.cam.rotation);S.nock.scale.setScalar(.6);
        S.flag.rotation.y=Math.sign(S.wind)*.6+Math.sin(performance.now()/200)*.2;S.flag.scale.x=.5+Math.min(1.5,Math.abs(S.wind)/2);
        var A=S.arrow;if(A&&S.phase==='fly'){var n=4;for(var s=0;s<n;s++){var h=dt/n;A.v.y-=9.8*h;A.v.x+=S.wind*h*.9;A.p.addScaledVector(A.v,h);var tz=-S.dist;if(A.p.z<=tz+.06&&A.prevZ>tz+.06){var dx=A.p.x,dy=A.p.y-1.5,d=Math.hypot(dx,dy);if(d<.61){var pts=Math.max(1,10-Math.floor(d/.061));hit(C,pts);A.p.z=tz+.08;break}}A.prevZ=A.p.z;if(A.p.y<0||A.p.z<tz-30){hit(C,0);break}}
          A.m.position.copy(A.p);A.m.lookAt(A.p.clone().add(A.v));A.m.rotateY(Math.PI)}
        if(S.phase==='show'){S.t-=dt;if(S.t<=0){S.n++;if(S.n>=S.shots)return end(C);if(C.mode==='duel')S.cur=S.n%2;newShot()}}
        C.hud((C.mode==='duel'?'<span>Tir <b>J'+(S.cur+1)+'</b></span><span>J1 <b>'+S.pts[0]+'</b> · J2 <b>'+S.pts[1]+'</b></span>':'<span>Score <b>'+S.tot+'</b></span>')+'<span>Flèche <b>'+Math.min(S.shots,S.n+1)+' / '+S.shots+'</b></span><span>Cible <b>'+S.dist+' m</b></span><span>Vent <b>'+(S.wind>0?'→':'←')+' '+Math.abs(S.wind).toFixed(1)+'</b></span>'+(S.phase==='draw'?'<span>Tension <b>'+Math.round(S.draw*100)+' %</b></span>':'')+(S.msg?'<span style="background:#f3c623">'+S.msg+'</span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)}});
    function shoot(C){var f=new THREE.Vector3(0,0,-1).applyEuler(C.cam.rotation),sp=20+S.draw*42;var m=arrowMesh();C.scene.add(m);S.arrow={m:m,p:C.cam.position.clone().addScaledVector(f,.6),v:f.multiplyScalar(sp),prevZ:0};S.phase='fly';sfx.play('ui');S.msg=''}
    function hit(C,pts){S.phase='show';S.t=1.6;C.pop(pts?(pts===10?'MOUCHE !':'+'+pts):'RATÉ',pts>=9?'#f3c623':pts>=7?'#e2361b':pts?'#3fa9ff':'#f1ece2');if(pts===10)C.shake(6);if(C.mode==='duel')S.pts[S.cur]+=pts;else S.tot+=pts;S.msg=pts?(pts===10?'MOUCHE ! 10':pts+' points'):'Raté';sfx.play(pts>=8?'win':pts?'hit':'lose');if(!pts&&S.arrow){}}
    function end(C){C.stop();if(C.mode==='duel'){C.over(S.pts[0]===S.pts[1]?'Égalité':(S.pts[0]>S.pts[1]?'J1':'J2')+' gagne !','J1 <b>'+S.pts[0]+'</b> – <b>'+S.pts[1]+'</b> J2','Rejouer');return}var nb=C.best('pts',S.tot);if(S.tot>=70)C.win();C.over('Fin du tir','Score : <b>'+S.tot+'</b> / 100'+(nb?' · nouveau record !':''),'Rejouer')}
  })();

  /* ================= TANKS ================= */
  (function(){
    var S,W=960,H=540,WIN=5;
    function walls(){var w=[[0,0,W,14],[0,H-14,W,14],[0,0,14,H],[W-14,0,14,H]];var lay=[[200,120,24,140],[736,280,24,140],[420,60,120,24],[420,456,120,24],[300,330,140,24],[520,186,140,24],[120,380,90,24],[750,136,90,24]];return w.concat(lay)}
    function tank(x,y,a,c){return {x:x,y:y,a:a,ta:a,c:c,alive:true,cd:0,tr:0}}
    function round(){S.t=[tank(80,H/2,0,RED),tank(W-80,H/2,Math.PI,BLU)];S.b=[];S.fx=[];S.wait=1;S.marks=[];S.pu=[];S.cr=[];for(var i=0;i<10;i++){var x=150+Math.random()*660,y=60+Math.random()*420;if(hitW(x,y,30))continue;S.cr.push([x-16,y-16,32,32])}}
    function hitW(x,y,r){for(var i=0;i<S.w.length;i++){var w=S.w[i];if(x+r>w[0]&&x-r<w[0]+w[2]&&y+r>w[1]&&y-r<w[1]+w[3])return w}if(S.cr)for(var j=0;j<S.cr.length;j++){var c=S.cr[j];if(x+r>c[0]&&x-r<c[0]+c[2]&&y+r>c[1]&&y-r<c[1]+c[3])return c}return null}
    function crateAt(x,y){for(var j=0;j<S.cr.length;j++){var c=S.cr[j];if(x>c[0]-4&&x<c[0]+c[2]+4&&y>c[1]-4&&y<c[1]+c[3]+4)return j}return -1}
    function fire(t,i){if(t.cd>0||!t.alive)return;if(S.b.filter(function(b){return b.o===i}).length>=(t.tri>0?9:4))return;t.cd=t.rap>0?.14:.35;(t.tri>0?[-.18,0,.18]:[0]).forEach(function(da){var a=t.a+da;S.b.push({x:t.x+Math.cos(a)*28,y:t.y+Math.sin(a)*28,vx:Math.cos(a)*430,vy:Math.sin(a)*430,bn:2,o:i,life:5})});t.flash=.08;sfx.play('shoot')}
    PP.arcade({id:'tanks',
      setup:function(C){S={sc:[0,0],w:walls()};round();C.keysText(C.mode==='solo'?'<kbd>Z</kbd>/<kbd>S</kbd> avancer/reculer · <kbd>Q</kbd>/<kbd>D</kbd> tourner · <kbd>Espace</kbd> tirer (les obus rebondissent 2 fois)':'J1 <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> + <kbd>Espace</kbd> · J2 <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> + <kbd>Entrée</kbd>');
        C.over('Tanks','Détruis le tank d\'en face. Les obus rebondissent sur les murs, attention à ne pas te toucher toi-même ! Premier à '+WIN+'.','Jouer')},
      start:function(C){S.sc=[0,0];round()},
      key:function(C,k,d){if(!d||!C.running)return;if(k==='Space')fire(S.t[0],0);if(k==='Enter'&&C.mode==='duel')fire(S.t[1],1)},
      step:function(C,dt){var k=C.keys;if(S.wait>0){S.wait-=dt}
        function drive(t,i,f,b,l,r){if(!t.alive||S.wait>0)return;var tr=(k[r]?1:0)-(k[l]?1:0),mv=(k[f]?1:0)-(k[b]?1:0);t.a+=tr*2.8*dt;var nx=t.x+Math.cos(t.a)*mv*170*dt,ny=t.y+Math.sin(t.a)*mv*170*dt;if(!hitW(nx,t.y,18))t.x=nx;if(!hitW(t.x,ny,18))t.y=ny;if(mv)t.tr+=dt*10}
        drive(S.t[0],0,'KeyW','KeyS','KeyA','KeyD');drive(S.t[0],0,'KeyZ','KeyS','KeyQ','KeyD');
        if(C.mode==='duel')drive(S.t[1],1,'ArrowUp','ArrowDown','ArrowLeft','ArrowRight');
        else if(S.t[1].alive&&S.wait<=0){var ai=S.t[1],p=S.t[0],dx=p.x-ai.x,dy=p.y-ai.y,ta=Math.atan2(dy,dx),da=Math.atan2(Math.sin(ta-ai.a),Math.cos(ta-ai.a));ai.a+=Math.max(-1,Math.min(1,da*3))*2.4*dt;var d=Math.hypot(dx,dy),mv=d>260?1:d<150?-.6:0;ai.wob=(ai.wob||0)+dt;var nx=ai.x+Math.cos(ai.a+Math.sin(ai.wob)*.6)*mv*140*dt,ny=ai.y+Math.sin(ai.a+Math.sin(ai.wob)*.6)*mv*140*dt;if(!hitW(nx,ai.y,18))ai.x=nx;else ai.a+=1.2*dt*4;if(!hitW(ai.x,ny,18))ai.y=ny;
          var clear=true;for(var s=1;s<12;s++){if(hitW(ai.x+dx*s/12,ai.y+dy*s/12,4)){clear=false;break}}if((clear&&Math.abs(da)<.12)||Math.random()<.004)fire(ai,1)}
        S.t.forEach(function(t){t.cd-=dt});
        S.t.forEach(function(t){t.tri=Math.max(0,(t.tri||0)-dt);t.rap=Math.max(0,(t.rap||0)-dt);t.shield=Math.max(0,(t.shield||0)-dt);t.flash=Math.max(0,(t.flash||0)-dt);if(t.alive&&t.tr%1<.2&&Math.random()<.5)S.marks.push({x:t.x,y:t.y,a:t.a,t:6});S.pu=S.pu.filter(function(p){if(t.alive&&Math.hypot(p.x-t.x,p.y-t.y)<26){if(p.k==='T')t.tri=8;if(p.k==='R')t.rap=8;if(p.k==='S')t.shield=8;sfx.play('win');C.pop({T:'TRIPLE TIR',R:'TIR RAPIDE',S:'BOUCLIER'}[p.k],'#f3c623','40px');return false}return true})});S.marks=S.marks.filter(function(m){m.t-=dt;return m.t>0}).slice(-300);
        S.b=S.b.filter(function(b){b.life-=dt;var ci=crateAt(b.x+b.vx*dt,b.y+b.vy*dt);if(ci>=0){var c=S.cr[ci];S.cr.splice(ci,1);sfx.play('hit');C.shake(4);for(var f=0;f<14;f++)S.fx.push({x:c[0]+16,y:c[1]+16,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300,t:1,c:'#a07a46'});if(Math.random()<.45)S.pu.push({x:c[0]+16,y:c[1]+16,k:['T','R','S'][Math.random()*3|0]});return false}var nx=b.x+b.vx*dt,ny=b.y+b.vy*dt;if(hitW(nx,b.y,4)){b.vx=-b.vx;b.bn--;sfx.play('tick')}else b.x=nx;if(hitW(b.x,ny,4)){b.vy=-b.vy;b.bn--;sfx.play('tick')}else b.y=ny;if(b.bn<0||b.life<0)return false;
          for(var i=0;i<2;i++){var t=S.t[i];if(t.alive&&Math.hypot(t.x-b.x,t.y-b.y)<20&&!(b.o===i&&b.life>4.85)){if(t.shield>0){t.shield=0;sfx.play('hit');C.pop('BOUCLIER CASSÉ','#3fa9ff','36px');return false}t.alive=false;sfx.play('kill');C.shake(12);C.pop('BOUM !','#f3c623');for(var f=0;f<40;f++)S.fx.push({x:t.x,y:t.y,vx:(Math.random()-.5)*400,vy:(Math.random()-.5)*400,t:1,c:Math.random()<.5?YEL:t.c});var w=1-i;S.sc[w]++;
            setTimeout(function(){if(S.sc[0]>=WIN||S.sc[1]>=WIN){C.stop();var j1=S.sc[0]>=WIN;if(C.mode==='solo'&&j1)C.win();C.over(C.mode==='solo'?(j1?'Victoire !':'Détruit…'):(j1?'J1 gagne !':'J2 gagne !'),S.sc[0]+' – '+S.sc[1],'Revanche')}else round()},1300);return false}}return true});
        S.fx=S.fx.filter(function(f){f.t-=dt*1.4;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.96;f.vy*=.96;return f.t>0});
        C.hud('<span style="color:#e2361b">J1 <b>'+S.sc[0]+'</b></span><span style="color:#1c5fa8">'+(C.mode==='solo'?'Ordi':'J2')+' <b>'+S.sc[1]+'</b></span>')},
      draw:function(C){var g=C.g;g.fillStyle='#c9b98f';g.fillRect(0,0,W,H);for(var i=0;i<140;i++){g.fillStyle='rgba(90,70,40,.08)';g.beginPath();g.arc((i*137)%W,(i*71)%H,6+(i%5)*3,0,7);g.fill()}
        S.marks.forEach(function(m){g.save();g.globalAlpha=Math.min(.25,m.t/12);g.translate(m.x,m.y);g.rotate(m.a);g.fillStyle='#5a4a30';g.fillRect(-4,-18,8,5);g.fillRect(-4,13,8,5);g.restore()});g.globalAlpha=1;
        S.cr.forEach(function(c){g.fillStyle='#6b4a22';g.fillRect(c[0]+3,c[1]+3,c[2],c[3]);g.fillStyle='#b8863e';g.fillRect(c[0],c[1],c[2],c[3]);g.strokeStyle='#7a5226';g.lineWidth=3;g.strokeRect(c[0]+2,c[1]+2,c[2]-4,c[3]-4);g.beginPath();g.moveTo(c[0]+3,c[1]+3);g.lineTo(c[0]+c[2]-3,c[1]+c[3]-3);g.stroke()});
        S.pu.forEach(function(p){var bob=Math.sin(performance.now()/200)*3;g.fillStyle='#141210';g.beginPath();g.arc(p.x,p.y+bob,15,0,7);g.fill();g.fillStyle={T:'#f3c623',R:'#3fe09a',S:'#3fa9ff'}[p.k];g.beginPath();g.arc(p.x,p.y+bob,12,0,7);g.fill();PP.ag.mono(g,p.k,p.x,p.y+bob+1,13,'#141210')});
        S.w.forEach(function(w){g.fillStyle='#5a4a3a';g.fillRect(w[0]+4,w[1]+4,w[2],w[3]);g.fillStyle='#8a7a62';g.fillRect(w[0],w[1],w[2],w[3]);g.fillStyle='rgba(255,255,255,.15)';g.fillRect(w[0],w[1],w[2],3)});
        S.t.forEach(function(t){if(!t.alive)return;g.save();g.translate(t.x,t.y);g.rotate(t.a);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-20,-15,44,34);g.fillStyle='#2b2b2b';g.fillRect(-22,-20,44,9);g.fillRect(-22,11,44,9);g.fillStyle='#555';for(var k=0;k<6;k++){g.fillRect(-22+((k*8+t.tr*8)%44),-20,3,9);g.fillRect(-22+((k*8+t.tr*8)%44),11,3,9)}
          g.fillStyle=t.c;PP.ag.rr(g,-18,-12,36,24,5);g.fill();g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(0,0,10,0,7);g.fill();g.fillStyle=t.c;g.beginPath();g.arc(-1,-1,9,0,7);g.fill();g.fillStyle='#222';g.fillRect(4,-3,26,6);if(t.flash>0){g.fillStyle='#f3c623';g.beginPath();g.arc(34,0,8,0,7);g.fill()}g.restore();if(t.shield>0){g.strokeStyle='rgba(63,169,255,'+(.5+Math.sin(performance.now()/90)*.3)+')';g.lineWidth=3;g.beginPath();g.arc(t.x,t.y,30,0,7);g.stroke()}});
        S.b.forEach(function(b){g.fillStyle='#141210';g.beginPath();g.arc(b.x,b.y,5,0,7);g.fill();g.fillStyle=YEL;g.beginPath();g.arc(b.x,b.y,2.5,0,7);g.fill()});
        S.fx.forEach(function(f){g.globalAlpha=f.t;g.fillStyle=f.c;g.fillRect(f.x,f.y,5,5)});g.globalAlpha=1;
        if(S.wait>0&&C.running)ag.txt(g,'PRÊTS ?',W/2,H/2,64,'rgba(20,18,16,.35)')}});
  })();

  /* ================= BATAILLE NAVALE ================= */
  (function(){
    var S,N=10,SH=[5,4,3,3,2],CS=34,LX=70,RX=550,TY=110;
    function empty(){var b=[];for(var i=0;i<N;i++){b.push([]);for(var j=0;j<N;j++)b[i].push(0)}return b}
    function place(){var b=empty(),ships=[];SH.forEach(function(len,id){for(var t=0;t<500;t++){var h=Math.random()<.5,x=Math.random()*(h?N-len+1:N)|0,y=Math.random()*(h?N:N-len+1)|0,ok=true,cells=[];for(var k=0;k<len;k++){var cx=x+(h?k:0),cy=y+(h?0:k);for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){var ax=cx+dx,ay=cy+dy;if(ax>=0&&ay>=0&&ax<N&&ay<N&&b[ax][ay])ok=false}cells.push([cx,cy])}if(!ok)continue;cells.forEach(function(c){b[c[0]][c[1]]=id+1});ships.push({len:len,cells:cells,hits:0});break}});return {b:b,ships:ships,shots:empty()}}
    function shootAt(F,x,y){if(F.shots[x][y])return null;var id=F.b[x][y];F.shots[x][y]=id?2:1;if(!id)return {hit:false};var sh=F.ships[id-1];sh.hits++;return {hit:true,sunk:sh.hits===sh.len?sh.cells:null}}
    function allSunk(F){return F.ships.every(function(s){return s.hits===s.len})}
    function aiPick(){var F=S.me,t=S.ai;while(t.q.length){var c=t.q.shift();if(c[0]>=0&&c[1]>=0&&c[0]<N&&c[1]<N&&!F.shots[c[0]][c[1]])return c}var c2;do{c2=[Math.random()*N|0,Math.random()*N|0]}while(F.shots[c2[0]][c2[1]]||(c2[0]+c2[1])%2);return c2}
    function aiTurn(C){setTimeout(function(){if(S.over)return;var c=aiPick(),r=shootAt(S.me,c[0],c[1]);S.last=c;sfx.play(r.hit?'hit':'tick');if(r.hit){if(r.sunk){r.sunk.forEach(function(q){for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){var a=q[0]+dx,b=q[1]+dy;if(a>=0&&b>=0&&a<N&&b<N&&!S.me.shots[a][b])S.me.shots[a][b]=3}});S.ai.q=[]}else S.ai.q=[[c[0]+1,c[1]],[c[0]-1,c[1]],[c[0],c[1]+1],[c[0],c[1]-1]].concat(S.ai.q);
      if(allSunk(S.me))return end(C,false);S.msg='L\'ordi a touché, il rejoue';aiTurn(C)}else{S.turn=0;S.msg='À toi de tirer'}},650)}
    function end(C,won){S.over=true;C.stop();sfx.play(won?'win':'lose');if(won)C.win();setTimeout(function(){C.over(won?'Flotte ennemie coulée !':'Ta flotte est coulée','Tirs : <b>'+S.count+'</b>','Rejouer')},700)}
    function markSunk(F,cells){cells.forEach(function(q){for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){var a=q[0]+dx,b=q[1]+dy;if(a>=0&&b>=0&&a<N&&b<N&&!F.shots[a][b])F.shots[a][b]=3}})}
    PP.arcade({id:'navale',
      setup:function(C){S={me:place(),op:C.mode==='solo'?place():{b:empty(),ships:SH.map(function(l){return {len:l,cells:[],hits:0}}),shots:empty()},turn:0,ai:{q:[]},over:false,count:0,msg:'',hover:null,sunkOp:0};
        if(C.mode==='online'){var ids=C.net.players.map(function(p){return p.id}),role=ids.indexOf(C.net.me.id);if(role>1){C.over('Bataille navale','Cette partie se joue à deux : les deux premiers du salon s\'affrontent.',false);return}S.ready={};S.turn=C.net.isHost?0:1;C.listen(function(m){if(m.t!=='rel')return;var d=m.d;
            if(d.t==='nv-shot'){var r=shootAt(S.me,d.x,d.y);if(r&&r.sunk)markSunk(S.me,r.sunk);C.net.relay({t:'nv-res',x:d.x,y:d.y,hit:r&&r.hit,sunk:r&&r.sunk});sfx.play(r&&r.hit?'hit':'tick');if(allSunk(S.me)){C.net.relay({t:'nv-win'});end(C,false);return}S.turn=r&&r.hit?1:0;S.msg=S.turn?'Touché, il rejoue':'À toi de tirer'}
            if(d.t==='nv-res'){S.op.shots[d.x][d.y]=d.hit?2:1;if(d.sunk){S.sunkOp++;markSunk(S.op,d.sunk);d.sunk.forEach(function(q){S.op.shots[q[0]][q[1]]=4})}S.turn=d.hit?0:1;S.msg=d.hit?(d.sunk?'Coulé ! Rejoue':'Touché ! Rejoue'):'Dans l\'eau…';sfx.play(d.hit?'hit':'tick')}
            if(d.t==='nv-win')end(C,true)})}
        C.keysText('Clique sur la grille de droite pour tirer · ta flotte est à gauche · touché = tu rejoues');
        C.over('Bataille navale',(C.mode==='solo'?'Contre l\'ordinateur.':'Contre ton pote du salon, l\'hôte tire en premier.')+' 5 navires placés au hasard. Coule toute la flotte d\'en face.','Jouer')},
      start:function(C){if(S.count||S.over)this.setup(C),C.hide();S.msg=S.turn===0?'À toi de tirer':'L\'autre tire en premier'},
      mouse:function(C,t,x,y){var gx=Math.floor((x-RX)/CS),gy=Math.floor((y-TY)/CS);S.hover=gx>=0&&gy>=0&&gx<N&&gy<N?[gx,gy]:null;if(t!=='down'||!C.running||!S.hover||S.turn!==0||S.over)return;if(S.op.shots[gx][gy])return;S.count++;
        if(C.mode==='online'){S.turn=2;S.msg='…';C.net.relay({t:'nv-shot',x:gx,y:gy});return}
        var r=shootAt(S.op,gx,gy);sfx.play(r.hit?'hit':'tick');if(r.hit){if(r.sunk){markSunk(S.op,r.sunk);r.sunk.forEach(function(q){S.op.shots[q[0]][q[1]]=4});S.msg='Coulé ! Rejoue';C.pop('COULÉ !','#e2361b');C.shake(8)}else S.msg='Touché ! Rejoue';if(allSunk(S.op))end(C,true)}else{S.msg='Dans l\'eau…';S.turn=1;aiTurn(C)}},
      step:function(C){C.hud('<span>Tirs <b>'+S.count+'</b></span><span>'+(S.msg||'')+'</span>')},
      draw:function(C){var g=C.g;var bg=g.createLinearGradient(0,0,0,540);bg.addColorStop(0,'#0f2840');bg.addColorStop(1,'#081a2c');g.fillStyle=bg;g.fillRect(0,0,960,540);
        function grid(ox,F,mine){ag.mono(g,mine?'TA FLOTTE':'FLOTTE ENNEMIE',ox+N*CS/2,TY-40,16,mine?CR:YEL);for(var i=0;i<N;i++){ag.mono(g,'ABCDEFGHIJ'[i],ox+i*CS+CS/2,TY-14,11,'rgba(241,236,226,.5)');ag.mono(g,(i+1)+'',ox-14,TY+i*CS+CS/2,11,'rgba(241,236,226,.5)')}
          for(var x=0;x<N;x++)for(var y=0;y<N;y++){var px=ox+x*CS,py=TY+y*CS;g.fillStyle=(x+y)%2?'#14466e':'#164d78';g.fillRect(px,py,CS-2,CS-2);var id=F.b[x][y],s=F.shots[x][y];
            if(mine&&id){g.fillStyle='#8a929c';PP.ag.rr(g,px+3,py+3,CS-8,CS-8,6);g.fill()}
            if(s===4){g.fillStyle='#5a1a10';g.fillRect(px,py,CS-2,CS-2)}
            if(s===2||s===4){g.fillStyle=RED;g.beginPath();g.arc(px+CS/2-1,py+CS/2-1,9,0,7);g.fill();g.strokeStyle=YEL;g.lineWidth=2;g.beginPath();g.moveTo(px+9,py+9);g.lineTo(px+CS-11,py+CS-11);g.moveTo(px+CS-11,py+9);g.lineTo(px+9,py+CS-11);g.stroke()}
            else if(s===1||s===3){g.fillStyle=s===1?'rgba(241,236,226,.85)':'rgba(241,236,226,.3)';g.beginPath();g.arc(px+CS/2-1,py+CS/2-1,4,0,7);g.fill()}}
          if(!mine&&S.hover&&S.turn===0&&C.running){g.strokeStyle=YEL;g.lineWidth=3;g.strokeRect(ox+S.hover[0]*CS,TY+S.hover[1]*CS,CS-2,CS-2)}
          if(mine&&S.last){g.strokeStyle='#fff';g.lineWidth=2;g.strokeRect(ox+S.last[0]*CS,TY+S.last[1]*CS,CS-2,CS-2)}}
        grid(LX,S.me,true);grid(RX,S.op,false);
        if(C.running)ag.txt(g,S.turn===0?'À TOI':'…',480,TY+N*CS/2,40,S.turn===0?YEL:'rgba(241,236,226,.4)')}});
  })();
})();
