/* Pixel Pause — jeux arcade, lot 2 : Bowling 3D, Mini-golf 3D, Tir à l'arc 3D, Tanks, Bataille navale */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',BLU='#3fa9ff',GRN='#3fe09a';
  function lam(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))}
  function cvTex(w,h,fn,rx,ry){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rx)t.repeat.set(rx,ry);return t}
  /* le perso du joueur dans les jeux 3D (bowling, golf, arc) */
  function persoModel(sc,scale){if(!PP.perso||!PP.perso.build)return null;var md=PP.perso.build(PP.perso.get());md.scale.setScalar(scale||1);sc.add(md);return {m:md,P:md.userData.parts}}
  function pose(P,o){P.legs[0].rotation.x=o.l0||0;P.legs[1].rotation.x=o.l1||0;P.knees[0].rotation.x=o.k0||0;P.knees[1].rotation.x=o.k1||0;P.arms[0].rotation.x=o.a0||0;P.arms[1].rotation.x=o.a1||0;P.arms[0].rotation.z=o.z0||0;P.arms[1].rotation.z=o.z1||0;P.elbows[0].rotation.x=o.e0||0;P.elbows[1].rotation.x=o.e1||0;P.torso.rotation.x=o.tx||0;P.torso.rotation.y=o.ty||0;P.root.position.y=o.ry||0}
  /* jauge de puissance qui monte et descend : on relâche au bon moment */
  function gauge(C){var st=C.cv.parentNode,g=st.querySelector('.ag-gauge');if(!g){g=document.createElement('div');g.className='ag-gauge';g.innerHTML='<i></i><b></b><span>PUISSANCE</span>';st.appendChild(g)}return g}
  function setGauge(C,v,show){var g=gauge(C);g.hidden=!show;if(show){g.querySelector('i').style.height=(v*100)+'%';g.querySelector('i').style.background=v>.85?'#e2361b':v>.55?'#f3c623':'#3fbf6a'}}
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
    function newRoll(C){S.ball={x:0,z:-.3,vx:0,vz:0,rolling:false,spin:0};S.phase='aim';S.power=0;S.pdir=1;S.aim=0;S.t=0;S.mx=null;S.thr=0;S.mesh.position.set(0,BR,-.3);if(S.pz){S.pz.m.position.set(.16,0,.35);S.pz.m.rotation.y=0}}
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
        S.pz=persoModel(sc,.62);rackPins();newRoll(C);C.cam.position.set(0,1.1,1.6);C.cam.lookAt(0,0,-8);
        C.keysText('Souris ou <kbd>←</kbd><kbd>→</kbd> : place-toi · maintiens clic ou <kbd>Espace</kbd> : la jauge monte et descend, relâche au bon moment · la flèche jaune donne la direction');
        C.over('Bowling 3D','10 frames, 2 boules par frame. Strike et spare comptent comme au vrai bowling.'+(C.mode==='duel'?' Chacun son tour, J1 puis J2.':'')+'<br>Record : <b>'+C.best('pts')+'</b>','Jouer')},
      start:function(C){if(S.players.some(function(p){return p.rolls.length})){this.setup(C);C.hide()}},
      mouse:function(C,t,x){if(!C.running)return;S.mx=(x/960-.5);if(t==='down'&&S.phase==='aim'){S.phase='charge';S.power=0}if(t==='up'&&S.phase==='charge')throwB(C)},
      key:function(C,k,d){if(!C.running)return;if(k==='Space'){if(d&&S.phase==='aim'){S.phase='charge';S.power=0}else if(!d&&S.phase==='charge')throwB(C)}},
      step:function(C,dt){var B=S.ball;S.t+=dt;
        if(S.phase==='aim'||S.phase==='charge'){if(S.mx!=null)B.x+=((S.mx*1.3)-B.x)*Math.min(1,dt*10);if(C.keys.ArrowLeft)B.x-=dt*.6;if(C.keys.ArrowRight)B.x+=dt*.6;B.x=Math.max(-LANE/2+BR,Math.min(LANE/2-BR,B.x));S.aim=Math.sin(S.t*1.6)*.09;
          if(S.phase==='charge'){S.power+=dt*1.25*S.pdir;if(S.power>=1){S.power=1;S.pdir=-1}if(S.power<=0){S.power=0;S.pdir=1}}S.arrow.visible=true;S.arrow.position.set(B.x+Math.sin(S.aim)*.6,.02,B.z-.6);S.arrow.rotation.z=-S.aim;
          if(S.pz){S.pz.m.position.set(B.x+.16,0,.35);pose(S.pz.P,{a1:S.phase==='charge'?.5:.15,e1:-.2,k0:.15,k1:.15,ry:-.01});S.pz.m.updateMatrixWorld(true);var hp=new THREE.Vector3();S.pz.P.hands[1].getWorldPosition(hp);S.mesh.position.set(hp.x,Math.max(BR,hp.y-.05),hp.z)}else S.mesh.position.set(B.x,BR,B.z)}
        else S.arrow.visible=false;
        setGauge(C,S.power,S.phase==='charge');
        /* élan du perso : 3 pas, bras en arrière puis en avant, la boule part au bon moment */
        if(S.phase==='throw'){S.thr+=dt;var u=S.thr/.75,pz=S.pz,P2=pz.P,st=Math.min(1,u);pz.m.position.z=.35-st*.55;var sw=u<.45?u/.45*1.5:1.5-(u-.45)/.3*2.4;
          pose(P2,{a1:-sw,e1:.1,a0:sw*.4,l0:-Math.sin(u*Math.PI*2)*.5,l1:Math.sin(u*Math.PI*2)*.5,k0:.3+(u>.6?.5:0),k1:.2,tx:u>.5?.35:0,ry:u>.6?-.06:0});
          pz.m.updateMatrixWorld(true);var hp2=new THREE.Vector3();P2.hands[1].getWorldPosition(hp2);S.mesh.position.set(hp2.x,Math.max(BR,hp2.y-.05),hp2.z);
          if(u>=1){B.x=Math.max(-LANE/2+BR,Math.min(LANE/2-BR,hp2.x));B.z=hp2.z;var sp=4+S.power*7;B.vx=Math.sin(S.aim)*sp;B.vz=-Math.cos(S.aim)*sp;B.spin=(Math.random()-.5)*.25;S.phase='roll';S.t=0;sfx.play('hit')}}
        if(S.phase==='roll'){var n=4;for(var s=0;s<n;s++){var h=dt/n;B.x+=B.vx*h;B.z+=B.vz*h;B.vx+=B.spin*h;
            if(Math.abs(B.x)>LANE/2&&!B.gutter){B.gutter=true;B.vx=0;B.x=Math.sign(B.x)*(LANE/2+.1)}
            S.pins.forEach(function(p){if(!p.up)return;var dx=p.x-B.x,dz=p.z-B.z,d=Math.hypot(dx,dz);if(d<BR+PR&&!B.gutter){var nx=dx/d,nz=dz/d,rv=(B.vx-p.vx)*nx+(B.vz-p.vz)*nz;if(rv>0){var j=2*rv/(1/7+1/1.5);p.vx+=j/1.5*nx;p.vz+=j/1.5*nz;B.vx-=j/7*nx;B.vz-=j/7*nz;p.down=true;sfx.play('hit')}p.x=B.x+nx*(BR+PR)}});
            for(var i=0;i<S.pins.length;i++){var a=S.pins[i];if(!a.up)continue;a.x+=a.vx*h;a.z+=a.vz*h;for(var k=i+1;k<S.pins.length;k++){var b=S.pins[k];if(!b.up)continue;var ex=b.x-a.x,ez=b.z-a.z,e=Math.hypot(ex,ez);if(e<PR*2&&e>0){var nx2=ex/e,nz2=ez/e,rv2=(a.vx-b.vx)*nx2+(a.vz-b.vz)*nz2;if(rv2>0){a.vx-=rv2*nx2*.9;a.vz-=rv2*nz2*.9;b.vx+=rv2*nx2*.9;b.vz+=rv2*nz2*.9;if(Math.abs(rv2)>.3){a.down=b.down=true}}var push=(PR*2-e)/2;a.x-=nx2*push;a.z-=nz2*push;b.x+=nx2*push;b.z+=nz2*push}}
              if(Math.abs(a.x)>LANE/2+.05)a.down=true}}
          S.pins.forEach(function(p){if(!p.up)return;p.vx*=Math.pow(.25,dt);p.vz*=Math.pow(.25,dt);if(p.down){p.tilt=Math.min(Math.PI/2,p.tilt+dt*6);if(!p.ax&&!p.az){var l=Math.hypot(p.vx,p.vz)||1;p.ax=p.vz/l;p.az=-p.vx/l;if(!p.vx&&!p.vz){p.ax=1}}}p.m.position.set(p.x,p.tilt?.03:0,p.z);p.m.rotation.set(p.ax*p.tilt,0,p.az*p.tilt)});
          S.mesh.position.set(B.x,B.gutter?BR-.08:BR,B.z);S.mesh.rotation.x-=B.vz*dt/BR;
          if(B.z<-LEN-1.2||(S.t>9)){S.phase='settle';S.t=0}}
        if(S.phase==='settle'){S.pins.forEach(function(p){if(!p.up)return;p.vx*=Math.pow(.1,dt);p.vz*=Math.pow(.1,dt);p.x+=p.vx*dt;p.z+=p.vz*dt;if(p.down)p.tilt=Math.min(Math.PI/2,p.tilt+dt*6);p.m.position.set(p.x,p.tilt?.03:0,p.z);p.m.rotation.set((p.ax||1)*p.tilt,0,(p.az||0)*p.tilt)});if(S.t>1.2){S.phase='wait';finishRoll(C)}}
        if(S.phase==='throw')S.aim=S.aimLock;var cz=S.phase==='roll'?Math.max(-LEN+3,B.z+1.6):S.phase==='settle'||S.phase==='wait'?-LEN+3:3.0;var pre=S.phase==='aim'||S.phase==='charge'||S.phase==='throw';C.cam.position.x+=((pre?-.42:0)-C.cam.position.x)*Math.min(1,dt*3);C.cam.position.z+=(cz-C.cam.position.z)*Math.min(1,dt*3);C.cam.position.y+=((S.phase==='aim'||S.phase==='charge'||S.phase==='throw'?1.9:.8)-C.cam.position.y)*Math.min(1,dt*3);C.cam.lookAt(0,pre?.15:0,C.cam.position.z-9);
        var P=pl(),sc=score(P.rolls),fo=frameOf(P.rolls);
        C.hud('<span>'+P.n+'</span><span>Frame <b>'+Math.min(10,fo.f+1)+'</b></span><span>Score <b>'+sc.tot+'</b></span>'+(S.players.length>1?'<span>'+S.players.map(function(p){return p.n+' '+score(p.rolls).tot}).join(' · ')+'</span>':'')+(S.phase==='charge'?'<span>Puissance <b>'+Math.round(S.power*100)+' %</b></span>':'')+(S.msg?'<span style="background:#e2361b;color:#fff">'+S.msg+'</span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)}});
    function throwB(C){if(!S.pz){var B=S.ball,sp=4+S.power*7;B.vx=Math.sin(S.aim)*sp;B.vz=-Math.cos(S.aim)*sp;B.spin=(Math.random()-.5)*.25;S.phase='roll';S.t=0;sfx.play('ui');return}S.phase='throw';S.thr=0;S.aimLock=S.aim;sfx.play('ui')}
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
      {w:[[-3,-9,3,-8.8],[-3,1.8,3,2],[-3.2,-9,-3,2],[3,-9,3.2,2]],s:[0,1],h:[0,-7.6],par:3,b:[[-1.2,-3,.5],[1.2,-3,.5],[0,-5.2,.6],[-1.8,-6.5,.4],[1.8,-6.5,.4]]},
      /* v42 : 3 nouveaux trous. sd = bac à sable (la balle freine fort), wt = eau (plouf : +1 coup, on rejoue d'où on a tapé) */
      {w:[[-3,-9,3,-8.8],[-3,1.8,3,2],[-3.2,-9,-3,2],[3,-9,3.2,2],[-3,-3.1,-.6,-2.9],[.6,-3.1,3,-2.9]],s:[0,1],h:[0,-7.6],par:3,sd:[[-2.2,-6.6,2.2,-4.4]]},
      {w:[[-3.5,-9,3.5,-8.8],[-3.5,1.8,3.5,2],[-3.7,-9,-3.5,2],[3.5,-9,3.7,2]],s:[-2.4,1],h:[2.4,-7.6],par:3,wt:[[-1.4,-5.6,3.5,-2.6]],b:[[-2.3,-6.9,.45]]},
      {w:[[-3.5,-10,3.5,-9.8],[-3.5,1.8,3.5,2],[-3.7,-10,-3.5,2],[3.5,-10,3.7,2]],s:[0,1],h:[0,-8.8],par:4,mill:[0,-2.5],b:[[-2,-5.2,.5],[0,-5.2,.5],[2,-6.6,.5],[0,-7.4,.4]],sd:[[-3.5,-7.9,-1.2,-6.3]],wt:[[1.4,-4.6,3.5,-3.4]]}];
    function inRect(l,x,z){for(var i=0;i<l.length;i++){var r=l[i];if(x>r[0]&&x<r[2]&&z>r[1]&&z<r[3])return true}return false}
    function scoreName(st,par){var d=st-par;return st===1?'TROU EN UN !':d<=-2?'EAGLE !':d===-1?'BIRDIE !':d===0?'PAR':d===1?'BOGEY':st+' coups'}
    function build(C){clearScene(C);lights(C,8);var sc=C.scene,H=HOLES[S.hole];sc.background=new THREE.Color(0x9ed0ee);
      var grass=cvTex(128,128,function(g,w,h){g.fillStyle='#4fa043';g.fillRect(0,0,w,h);for(var i=0;i<26;i++){g.fillStyle=i%2?'#54a748':'#4a9a3f';g.fillRect(0,i*5,w,5)}},6,6);
      var ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),lam(0x6aa84f));ground.rotation.x=-Math.PI/2;ground.position.y=-.05;sc.add(ground);
      var mn=[1e9,1e9],mx=[-1e9,-1e9];H.w.forEach(function(w){mn[0]=Math.min(mn[0],w[0]);mn[1]=Math.min(mn[1],w[1]);mx[0]=Math.max(mx[0],w[2]);mx[1]=Math.max(mx[1],w[3])});
      var felt=new THREE.Mesh(new THREE.PlaneGeometry(mx[0]-mn[0],mx[1]-mn[1]),new THREE.MeshLambertMaterial({map:grass}));felt.rotation.x=-Math.PI/2;felt.position.set((mn[0]+mx[0])/2,0,(mn[1]+mx[1])/2);felt.receiveShadow=true;sc.add(felt);
      var wm=lam(0xc9763a),wt=lam(0xe8c08a);S.walls=H.w.map(function(w){var bx=new THREE.Mesh(new THREE.BoxGeometry(w[2]-w[0],.25,w[3]-w[1]),wm);bx.position.set((w[0]+w[2])/2,.12,(w[1]+w[3])/2);bx.castShadow=true;bx.receiveShadow=true;sc.add(bx);var tp=new THREE.Mesh(new THREE.BoxGeometry(w[2]-w[0]+.02,.04,w[3]-w[1]+.02),wt);tp.position.set(bx.position.x,.26,bx.position.z);sc.add(tp);return w});
      S.bumps=(H.b||[]).map(function(b,i){var m=new THREE.Mesh(new THREE.CylinderGeometry(b[2],b[2],.3,24),lam(i%2?0xe2361b:0x3fa9ff));m.position.set(b[0],.15,b[1]);m.castShadow=true;sc.add(m);return [b[0],b[1],b[2],m,b[0],i%2]});
      var hole=new THREE.Mesh(new THREE.CircleGeometry(HR,24),new THREE.MeshBasicMaterial({color:0x111111}));hole.rotation.x=-Math.PI/2;hole.position.set(H.h[0],.005,H.h[1]);sc.add(hole);
      var pole=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,1.2,6),lam(0xffffff));pole.position.set(H.h[0],.6,H.h[1]);sc.add(pole);var flag=new THREE.Mesh(new THREE.PlaneGeometry(.4,.26),new THREE.MeshLambertMaterial({color:0xe2361b,side:THREE.DoubleSide}));flag.position.set(H.h[0]+.2,1.05,H.h[1]);sc.add(flag);S.flag=flag;
      S.mill=null;if(H.mill){var g=new THREE.Group();g.position.set(H.mill[0],0,H.mill[1]);var tw=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,1.6,8),lam(0xf1ece2));tw.position.y=.8;g.add(tw);var roof=new THREE.Mesh(new THREE.ConeGeometry(.6,.6,8),lam(0xe2361b));roof.position.y=1.9;g.add(roof);var bl=new THREE.Group();bl.position.set(0,1.2,.5);g.add(bl);for(var i=0;i<4;i++){var b=new THREE.Mesh(new THREE.BoxGeometry(.2,1.4,.04),lam(0x8a5a30));b.position.y=.7;var pv=new THREE.Group();pv.rotation.z=i*Math.PI/2;pv.add(b);bl.add(pv)}sc.add(g);S.mill={g:g,bl:bl,x:H.mill[0],z:H.mill[1],a:0}}
      /* décor autour du parcours : arbres, rochers, fleurs, barrière */
      var rnd=function(a,b){return a+Math.random()*(b-a)};for(var t=0;t<40;t++){var ang=Math.random()*6.283,rad=rnd(8,22),tx=Math.cos(ang)*rad+(mn[0]+mx[0])/2,tz=Math.sin(ang)*rad+(mn[1]+mx[1])/2;if(tx>mn[0]-1&&tx<mx[0]+1&&tz>mn[1]-1&&tz<mx[1]+1)continue;var tr=new THREE.Group(),tk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,1,6),lam(0x6b4a2a));tk.position.y=.5;tr.add(tk);var fo=new THREE.Mesh(Math.random()<.5?new THREE.ConeGeometry(.8,2,7):new THREE.IcosahedronGeometry(.9,0),lam([0x2f7a3a,0x3f8f3a,0x4f9a44][t%3],{flatShading:true}));fo.position.y=1.7;tr.add(fo);tr.position.set(tx,0,tz);tr.scale.setScalar(rnd(.8,1.5));tr.traverse(function(o){if(o.isMesh)o.castShadow=true});sc.add(tr)}
      for(var f2=0;f2<60;f2++){var fl2=new THREE.Mesh(new THREE.SphereGeometry(.06,5,4),lam([0xe2361b,0xf3c623,0xffffff,0xb072e0][f2%4]));var fa=Math.random()*6.283,fr=rnd(5,9);fl2.position.set(Math.cos(fa)*fr+(mn[0]+mx[0])/2,.06,Math.sin(fa)*fr+(mn[1]+mx[1])/2);sc.add(fl2)}
      S.sand=H.sd||[];S.water=H.wt||[];
      S.sand.forEach(function(r){var m=new THREE.Mesh(new THREE.PlaneGeometry(r[2]-r[0],r[3]-r[1]),lam(0xe6d29a));m.rotation.x=-Math.PI/2;m.position.set((r[0]+r[2])/2,.006,(r[1]+r[3])/2);m.receiveShadow=true;sc.add(m);var ed=new THREE.Mesh(new THREE.PlaneGeometry(r[2]-r[0]+.16,r[3]-r[1]+.16),lam(0xc9b074));ed.rotation.x=-Math.PI/2;ed.position.set(m.position.x,.004,m.position.z);sc.add(ed)});
      S.waterM=S.water.map(function(r){var m=new THREE.Mesh(new THREE.PlaneGeometry(r[2]-r[0],r[3]-r[1]),new THREE.MeshLambertMaterial({color:0x3a8cff,transparent:true,opacity:.85,emissive:0x0a2a55}));m.rotation.x=-Math.PI/2;m.position.set((r[0]+r[2])/2,.008,(r[1]+r[3])/2);sc.add(m);var ed=new THREE.Mesh(new THREE.PlaneGeometry(r[2]-r[0]+.18,r[3]-r[1]+.18),lam(0x8a8e96));ed.rotation.x=-Math.PI/2;ed.position.set(m.position.x,.005,m.position.z);sc.add(ed);return m});
      /* trajectoire prévue : des points qui montrent où la balle va partir et rebondir */
      S.dots=[];for(var dq=0;dq<16;dq++){var dm=new THREE.Mesh(new THREE.SphereGeometry(.05*(1-dq*.03),8,6),new THREE.MeshBasicMaterial({color:0xffffff}));dm.visible=false;sc.add(dm);S.dots.push(dm)}
      S.mesh=new THREE.Mesh(new THREE.SphereGeometry(BR,20,14),lam(0xffffff));S.mesh.castShadow=true;sc.add(S.mesh);
      S.aimL=new THREE.Mesh(new THREE.BoxGeometry(.04,.02,1),new THREE.MeshBasicMaterial({color:0xf3c623}));sc.add(S.aimL);
      S.players.forEach(function(p){p.x=H.s[0]+(S.players.length>1?(p.i-(S.players.length-1)/2)*.35:0);p.z=H.s[1];p.vx=p.vz=0;p.in=false;p.st=0});S.cur=0;S.drag=null;S.swing=null;
      /* ton perso avec son putter, à côté de la balle */
      S.pz=persoModel(sc,.5);if(S.pz){var club=new THREE.Group(),sh2=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.0,6),lam(0x9a9aa0));sh2.position.y=-.5;club.add(sh2);var gr2=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.22,8),lam(0x141210));gr2.position.y=-.05;club.add(gr2);var hd2=new THREE.Mesh(new THREE.BoxGeometry(.22,.07,.08),lam(0x2a2a30));hd2.position.set(.06,-1.0,0);club.add(hd2);club.rotation.x=-.25;S.pz.P.hands[1].add(club);S.pz.ang=0}}
    function P(){return S.players[S.cur]}
    PP._golf=function(){return {S:S,holes:HOLES}};
    function hitWalls(b){S.walls.forEach(function(w){var cx=Math.max(w[0],Math.min(w[2],b.x)),cz=Math.max(w[1],Math.min(w[3],b.z)),dx=b.x-cx,dz=b.z-cz,d=Math.hypot(dx,dz);if(d<BR&&d>0){var nx=dx/d,nz=dz/d;b.x=cx+nx*BR;b.z=cz+nz*BR;var v=b.vx*nx+b.vz*nz;if(v<0){b.vx-=1.8*v*nx;b.vz-=1.8*v*nz;sfx.play('tick')}}});
      S.bumps.forEach(function(c){var dx=b.x-c[0],dz=b.z-c[1],d=Math.hypot(dx,dz);if(d<c[2]+BR){var nx=dx/d,nz=dz/d;b.x=c[0]+nx*(c[2]+BR);b.z=c[1]+nz*(c[2]+BR);var v=b.vx*nx+b.vz*nz;if(v<0){b.vx-=2.1*v*nx;b.vz-=2.1*v*nz;sfx.play('hit')}}});
      if(S.mill){var a=S.mill.a%(Math.PI/2);var blocked=a<.5;if(blocked&&Math.abs(b.x-S.mill.x)<.4&&Math.abs(b.z-(S.mill.z+.5))<.15){b.vz=Math.abs(b.vz)*.8;b.z=S.mill.z+.66;sfx.play('hit')}if(Math.abs(b.x-S.mill.x)<.5&&Math.abs(b.z-S.mill.z)<.5&&!(Math.abs(b.x-S.mill.x)<.25)){b.vx=-b.vx;b.x+=b.vx*.02}}}
    function nextTurn(C){var n=S.players.length,i;for(i=1;i<=n;i++){var c=(S.cur+i)%n;if(!S.players[c].in&&S.players[c].st<8){S.cur=c;return}}
      setTimeout(function(){S.hole++;if(S.hole>=HOLES.length)return end(C);build(C)},1200)}
    function end(C){C.stop();var tot=S.players.map(function(p){return p.tot}),par=HOLES.reduce(function(a,h){return a+h.par},0);if(S.players.length===1){var nb=C.best('coups9',tot[0],true);if(tot[0]<=par)C.win();C.over('Parcours terminé','<b>'+tot[0]+'</b> coups (par '+par+')'+(nb?' · nouveau record !':'')+card(),'Rejouer');return}
      var best=Math.min.apply(null,tot);C.over('Parcours terminé',S.players.map(function(p){return p.n+' : <b>'+p.tot+'</b>'+(p.tot===best?' (gagnant)':'')}).join(' · ')+' (par '+par+')'+card(),'Rejouer')}
    /* carte de score : coups par trou */
    function card(){var th='border:1px solid rgba(241,236,226,.35);padding:3px 7px;font:600 12px \'IBM Plex Mono\',monospace;text-align:center';
      var h='<table style="margin:12px auto 0;border-collapse:collapse"><tr><td style="'+th+'">Trou</td>'+HOLES.map(function(q,i){return '<td style="'+th+'">'+(i+1)+'</td>'}).join('')+'</tr><tr><td style="'+th+'">Par</td>'+HOLES.map(function(q){return '<td style="'+th+';opacity:.7">'+q.par+'</td>'}).join('')+'</tr>';
      S.players.forEach(function(p){h+='<tr><td style="'+th+'">'+p.n+'</td>'+HOLES.map(function(q,i){var v=(p.card||[])[i],c=v==null?'':v<q.par?'#3fe09a':v>q.par?'#ff8a6b':'#f1ece2';return '<td style="'+th+';color:'+c+'">'+(v==null?'-':v)+'</td>'}).join('')+'</tr>'});return h+'</table>'}
    PP.arcade({id:'golf',three:true,
      setup:function(C){ag.three(C);var n=C.mode==='duel'?2:C.mode==='trio'?3:C.mode==='quad'?4:1;S={hole:0,players:[],cur:0};for(var i=0;i<n;i++)S.players.push({i:i,n:'J'+(i+1),tot:0,c:[0xffffff,0xf3c623,0xe2361b,0x3fa9ff][i]});
        build(C);C.keysText('Clique sur ta balle et tire vers l\'arrière comme un lance-pierre, relâche pour jouer · plus tu tires loin, plus c\'est fort');
        C.over('Mini-golf 3D',HOLES.length+' trous avec murs, bumpers et moulin. Le moins de coups gagne.'+(n>1?' Chacun son tour.':'')+'<br>Record : <b>'+(C.best('coups9')||'—')+'</b> coups','Jouer')},
      start:function(C){if(S.hole||S.players[0].tot){this.setup(C);C.hide()}},
      mouse:function(C,t,x,y){if(!C.running)return;var p=P();if(t==='down'&&!S.moving&&!S.swing){S.drag={x:x,y:y}}if(t==='move'&&S.drag){S.drag.cx=x;S.drag.cy=y}
        if(t==='up'&&S.drag&&S.drag.cx!=null){var dx=S.drag.x-S.drag.cx,dy=S.drag.y-S.drag.cy,l=Math.min(220,Math.hypot(dx,dy));if(l>8){var ang=Math.atan2(dx,dy);var sp=l/220*7.5,dir=S.camYaw||0;p.vx=Math.sin(ang)*sp;p.vz=Math.cos(ang)*sp;var cs=Math.cos(dir),sn=Math.sin(dir),vx=p.vx*cs+p.vz*sn,vz=-p.vx*sn+p.vz*cs;p.vx=0;p.vz=0;p.st++;p.tot++;p.lx=p.x;p.lz=p.z;S.swing={t:0,vx:vx,vz:vz,done:false,pw:l/220}}S.drag=null}else if(t==='up')S.drag=null},
      step:function(C,dt){var H=HOLES[S.hole];S.tt=(S.tt||0)+dt;S.bumps.forEach(function(b,i){if(b[5]){b[0]=b[4]+Math.sin(S.tt*1.4+i)*1.1;b[3].position.x=b[0]}});if(S.mill){S.mill.a+=dt*1.4;S.mill.bl.rotation.z=S.mill.a}S.flag.rotation.y=Math.sin(performance.now()/400)*.3;
        if(S.moving){var p=P(),n=6;for(var s=0;s<n;s++){var h=dt/n;p.x+=p.vx*h;p.z+=p.vz*h;hitWalls(p);var dh=Math.hypot(p.x-H.h[0],p.z-H.h[1]),sp=Math.hypot(p.vx,p.vz);if(inRect(S.water,p.x,p.z)){p.x=p.lx;p.z=p.lz;p.vx=p.vz=0;p.st++;p.tot++;S.moving=false;sfx.play('lose');C.pop('PLOUF ! +1','#3a8cff');C.shake(4);if(p.st>=8){p.in=true;p.card=p.card||[];p.card[S.hole]=p.st}nextTurn(C);break}
          if(dh<HR&&sp<4.5){p.in=true;p.card=p.card||[];p.card[S.hole]=p.st;S.moving=false;sfx.play('win');S.msg=scoreName(p.st,H.par);C.pop(S.msg,p.st<=H.par-1||p.st===1?'#f3c623':'#f1ece2');setTimeout(function(){S.msg=''},1400);nextTurn(C);break}else if(dh<HR*1.8&&sp<6){p.vx+=(H.h[0]-p.x)*h*6;p.vz+=(H.h[1]-p.z)*h*6}}
          var f=Math.pow(inRect(S.sand,p.x,p.z)?.05:.45,dt);p.vx*=f;p.vz*=f;if(S.moving&&Math.hypot(p.vx,p.vz)<.06&&!p.in){p.vx=p.vz=0;S.moving=false;if(p.st>=8){p.in=true;p.tot+=1;p.card=p.card||[];p.card[S.hole]=p.st+1;S.msg='Maximum atteint'}nextTurn(C)}}
        if(S.waterM)S.waterM.forEach(function(m,i){m.material.opacity=.8+Math.sin(S.tt*2+i)*.08});
        if(S.swing){var sw=S.swing,pc=P();sw.t+=dt;if(!sw.done&&sw.t>=.28){sw.done=true;pc.vx=sw.vx;pc.vz=sw.vz;S.moving=true;sfx.play('hit')}if(sw.t>.8)S.swing=null}
        var cur=P();S.mesh.position.set(cur.x,BR,cur.z);S.mesh.material.color.setHex(cur.c);
        /* le perso se place à côté de la balle, face à elle, et fait son swing */
        if(S.pz){var Hh=HOLES[S.hole],dirX,dirZ;if(S.drag&&S.drag.cx!=null){var ddx=S.drag.x-S.drag.cx,ddy=S.drag.y-S.drag.cy;var aa=Math.atan2(ddx,ddy);dirX=Math.sin(aa);dirZ=Math.cos(aa)}else if(S.swing){var vl=Math.hypot(S.swing.vx,S.swing.vz)||1;dirX=S.swing.vx/vl;dirZ=S.swing.vz/vl}else{var hx=Hh.h[0]-cur.x,hz=Hh.h[1]-cur.z,hl=Math.hypot(hx,hz)||1;dirX=hx/hl;dirZ=hz/hl}
          var nx=-dirZ,nz=dirX,want=Math.atan2(-nx,-nz);var da=want-S.pz.ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(!S.moving)S.pz.ang+=da*Math.min(1,dt*10);
          var fx=Math.cos(S.pz.ang),fz=-Math.sin(S.pz.ang);var px=-Math.sin(S.pz.ang),pzz=-Math.cos(S.pz.ang);
          if(!S.moving||S.swing){S.pz.m.position.set(cur.x-px*.42,0,cur.z-pzz*.42);S.pz.m.rotation.y=S.pz.ang}
          var back=S.drag&&S.drag.cx!=null?Math.min(1,Math.hypot(S.drag.x-S.drag.cx,S.drag.y-S.drag.cy)/220):0,swz=S.swing?(S.swing.t<.28?(S.swing.pw)*(1-S.swing.t/.28)*.9-(S.swing.t/.28)*.1:-.1-Math.min(1,(S.swing.t-.28)/.25)*.6):back*.9;
          pose(S.pz.P,{a0:.42,a1:.42,z0:swz+.1,z1:swz-.1,e0:-.15,e1:-.15,tx:.25,k0:.18,k1:.18,ry:-.02})}
        S.players.forEach(function(q,i){if(!q.m&&S.players.length>1){q.m=new THREE.Mesh(new THREE.SphereGeometry(BR,16,12),lam(q.c));C.scene.add(q.m)}if(q.m){q.m.visible=i!==S.cur&&!q.in;q.m.position.set(q.x,BR,q.z);if(q.m.parent!==C.scene)C.scene.add(q.m)}});
        S.aimL.visible=false;
        if(S.drag&&S.drag.cx!=null&&S.dots){var dx=S.drag.x-S.drag.cx,dy=S.drag.y-S.drag.cy,l=Math.min(220,Math.hypot(dx,dy)),a=Math.atan2(dx,dy),pw=l/220,spd=pw*7.5;
          /* on simule le coup (sans bruit) : la balle fantôme rebondit sur les murs comme la vraie */
          var gb={x:cur.x,z:cur.z,vx:Math.sin(a)*spd,vz:Math.cos(a)*spd},op=sfx.play,col=new THREE.Color().setHSL(.33*(1-pw),.9,.55),stop=false;sfx.play=function(){};
          try{S.dots.forEach(function(d,k){if(l<=8||stop){d.visible=false;return}for(var s2=0;s2<6;s2++){var hh=.075/6;gb.x+=gb.vx*hh;gb.z+=gb.vz*hh;hitWalls(gb)}var ff=Math.pow(inRect(S.sand,gb.x,gb.z)?.05:.45,.075);gb.vx*=ff;gb.vz*=ff;d.visible=true;d.position.set(gb.x,.06,gb.z);d.material.color.copy(col);if(inRect(S.water,gb.x,gb.z)||Math.hypot(gb.vx,gb.vz)<.25)stop=true})}finally{sfx.play=op}}
        else if(S.dots)S.dots.forEach(function(d){d.visible=false});
        var tx=cur.x,tz=cur.z;C.cam.position.x+=(tx-C.cam.position.x)*Math.min(1,dt*2.5);C.cam.position.z+=((tz+6.5)-C.cam.position.z)*Math.min(1,dt*2.5);C.cam.position.y=5.6;C.cam.lookAt(C.cam.position.x,0,C.cam.position.z-8);S.camYaw=0;
        C.hud('<span>Trou <b>'+(S.hole+1)+' / '+HOLES.length+'</b></span><span>Par <b>'+H.par+'</b></span>'+S.players.map(function(q,i){return '<span'+(i===S.cur?' style="background:#e2361b;color:#fff"':'')+'>'+q.n+' <b>'+q.tot+'</b></span>'}).join('')+(S.msg?'<span style="background:#f3c623">'+S.msg+'</span>':'')+(S.drag&&S.drag.cx!=null?'<span>Puissance <b>'+Math.round(Math.min(220,Math.hypot(S.drag.x-S.drag.cx,S.drag.y-S.drag.cy))/2.2)+' %</b></span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)}});
  })();

  /* ================= TIR À L'ARC 3D =================
     v93 refait : on est en 3e personne derrière son perso ; quand on bande l'arc (clic maintenu), la caméra passe
     en douceur en 1re personne (zoom, arc et flèche devant les yeux, viseur avec repères de distance). On relâche
     pour tirer, on suit la flèche en 1re personne, puis on revient derrière le perso. Flèches plantées dans la cible. */
  (function(){
    var S,G=9.8,VMAX=74,FOV3=55,FOV1=38;
    function targetMesh(){var c=document.createElement('canvas');c.width=c.height=512;var g=c.getContext('2d'),cols=['#f6f2ea','#f6f2ea','#1b1a1e','#1b1a1e','#2f8fe0','#2f8fe0','#e2361b','#e2361b','#f3c623','#f3c623'];g.fillStyle='#d9c79a';g.fillRect(0,0,512,512);for(var i=0;i<10;i++){g.fillStyle=cols[i];g.beginPath();g.arc(256,256,250-i*25,0,7);g.fill();g.strokeStyle=i===2||i===3?'rgba(255,255,255,.35)':'rgba(0,0,0,.3)';g.lineWidth=2;g.stroke()}g.strokeStyle='#141210';g.lineWidth=2;g.beginPath();g.moveTo(250,256);g.lineTo(262,256);g.moveTo(256,250);g.lineTo(256,262);g.stroke();
      var grp=new THREE.Group(),face=new THREE.Group();grp.add(face);
      var straw=cvTex(128,128,function(g,w,h){g.fillStyle='#d8b86a';g.fillRect(0,0,w,h);for(var i=0;i<500;i++){g.strokeStyle=['#c9a454','#e8cc84','#b8913f'][i%3];g.lineWidth=1;var x=Math.random()*w,y=Math.random()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+(Math.random()-.5)*14,y+(Math.random()-.5)*4);g.stroke()}});
      var bale=new THREE.Mesh(new THREE.CylinderGeometry(.78,.78,.42,40),[lam(0xd8b86a,{map:straw}),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c)}),lam(0xc9a454,{map:straw})]);bale.rotation.x=Math.PI/2;face.add(bale);face.userData.bale=bale;
      var wood=lam(0x6b4a2a);[-1,1].forEach(function(s){var lg=new THREE.Mesh(new THREE.BoxGeometry(.08,2.1,.08),wood);lg.position.set(s*.55,-.55,.3);lg.rotation.x=-.28;lg.castShadow=true;grp.add(lg)});var back=new THREE.Mesh(new THREE.BoxGeometry(.08,1.9,.08),wood);back.position.set(0,-.6,.75);back.rotation.x=.42;grp.add(back);
      bale.castShadow=true;S.face=face;return grp}
    function arrowMesh(fp){var g=new THREE.Group(),sh=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.8,6),lam(0x9a6a3a));sh.rotation.x=Math.PI/2;g.add(sh);var tip=new THREE.Mesh(new THREE.ConeGeometry(.016,.07,6),new THREE.MeshPhongMaterial({color:0xb8bcc4,shininess:60}));tip.rotation.x=-Math.PI/2;tip.position.z=-.43;g.add(tip);var nk=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.03,6),lam(0xe2361b));nk.rotation.x=Math.PI/2;nk.position.z=.405;g.add(nk);
      [0,1,2].forEach(function(i){var p=new THREE.Group();p.rotation.z=i*2.094;var f=new THREE.Mesh(new THREE.PlaneGeometry(.13,.035),new THREE.MeshLambertMaterial({color:i?0xf1ece2:0xe2361b,side:THREE.DoubleSide}));f.rotation.y=Math.PI/2;f.position.set(0,.02,.33);p.add(f);g.add(p)});if(fp)g.traverse(function(o){if(o.material){o.material=o.material.clone();o.material.depthTest=false}o.renderOrder=10});return g}
    function bowMesh(fp){var g=new THREE.Group(),wood=new THREE.MeshPhongMaterial({color:0x5a3520,shininess:30}),grip=lam(0x1f1712);
      /* arc recourbé : deux branches courbes + poignée */
      var pts=[];for(var i=0;i<=20;i++){var t=i/20,y=(t-.5)*.9,z=.13*(1-Math.pow(2*t-1,2))-.02*Math.pow(2*t-1,6)*0;pts.push(new THREE.Vector3(0,y,z-.13+(Math.abs(2*t-1)>.86?-(Math.abs(2*t-1)-.86)*.5:0)))}
      var limb=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.016,6,false),wood);g.add(limb);
      var gp=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.13,8),grip);gp.position.z=0;g.add(gp);
      var top=pts[pts.length-1],bot=pts[0];g.userData.tips=[top,bot];
      var str=new THREE.Line(new THREE.BufferGeometry().setFromPoints([top,new THREE.Vector3(0,0,top.z),bot]),new THREE.LineBasicMaterial({color:0xf4efe6}));g.add(str);g.userData.str=str;
      if(fp)g.traverse(function(o){if(o.material){o.material=o.material.clone();o.material.depthTest=false}o.renderOrder=10});return g}
    function scenery(sc){
      /* ciel en dégradé */
      var sky=new THREE.Mesh(new THREE.SphereGeometry(300,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{},vertexShader:'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;void main(){float h=clamp(v.y*1.6,0.,1.);gl_FragColor=vec4(mix(vec3(.86,.92,.96),vec3(.36,.62,.9),h),1.);}'}));sc.add(sky);
      var grassT=cvTex(128,128,function(g,w,h){g.fillStyle='#6aa846';g.fillRect(0,0,w,h);for(var i=0;i<900;i++){g.fillStyle=['#5e9a3c','#78b652','#64a040','#82be5a'][i%4];g.fillRect(Math.random()*w,Math.random()*h,1,2+Math.random()*3)}},60,60);
      var gr=new THREE.Mesh(new THREE.PlaneGeometry(400,400),lam(0xffffff,{map:grassT}));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;sc.add(gr);
      var lane=cvTex(64,256,function(g,w,h){g.fillStyle='#8cc45e';g.fillRect(0,0,w,h);for(var i=0;i<400;i++){g.fillStyle=['#82ba54','#96cc68'][i%2];g.fillRect(Math.random()*w,Math.random()*h,1,3)}},1,12);
      var ln=new THREE.Mesh(new THREE.PlaneGeometry(5,80),lam(0xffffff,{map:lane}));ln.rotation.x=-Math.PI/2;ln.position.set(0,.01,-38);ln.receiveShadow=true;sc.add(ln);
      var white=lam(0xffffff);[-2.5,2.5].forEach(function(x){var l=new THREE.Mesh(new THREE.PlaneGeometry(.08,80),white);l.rotation.x=-Math.PI/2;l.position.set(x,.015,-38);sc.add(l)});
      /* pas de tir : plancher en bois et pupitre */
      var deck=new THREE.Mesh(new THREE.BoxGeometry(3,.12,2.4),lam(0x9a7048));deck.position.set(0,.06,.4);deck.receiveShadow=true;sc.add(deck);
      var quiver=new THREE.Group(),qb=new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,.6,10),lam(0x7a3a22));quiver.add(qb);for(var q=0;q<5;q++){var fa=new THREE.Mesh(new THREE.ConeGeometry(.02,.07,4),lam(q%2?0xe2361b:0xf1ece2));fa.position.set(Math.cos(q)*.04,.36,Math.sin(q)*.04);quiver.add(fa)}quiver.position.set(1.1,.42,.6);quiver.rotation.z=.15;sc.add(quiver);
      /* panneaux de distance */
      for(var d=25;d<=65;d+=10){var c=document.createElement('canvas');c.width=128;c.height=64;var g=c.getContext('2d');g.fillStyle='#f1ece2';g.fillRect(0,0,128,64);g.fillStyle='#141210';g.font='bold 40px IBM Plex Mono, monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(d+' m',64,34);
        var sg=new THREE.Mesh(new THREE.PlaneGeometry(.9,.45),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c)}));sg.position.set(-3.2,.5,-d);sg.rotation.y=.35;sc.add(sg);var po=new THREE.Mesh(new THREE.BoxGeometry(.05,.5,.05),lam(0x6b4a2a));po.position.set(-3.2,.2,-d);sc.add(po)}
      /* arbres (fusionnés par matériau), collines au loin, haies */
      var trunk=[],leaf=[];function add(list,geo,x,y,z){geo.translate(x,y,z);list.push(geo)}
      for(var i=0;i<90;i++){var x=(Math.random()<.5?-1:1)*(7+Math.random()*45),z=8-Math.random()*150,s=.8+Math.random()*.7;add(trunk,new THREE.CylinderGeometry(.14*s,.2*s,1.6*s,6),x,.8*s,z);if(Math.random()<.5)add(leaf,new THREE.ConeGeometry(1.2*s,3.2*s,7),x,2.9*s,z);else add(leaf,new THREE.IcosahedronGeometry(1.3*s,0),x,2.4*s,z)}
      function merged(list,mat){var THREE_=THREE,geos=list.map(function(g){return g.index?g.toNonIndexed():g}),n=0;geos.forEach(function(g){n+=g.attributes.position.count});var pos=new Float32Array(n*3),nor=new Float32Array(n*3),o=0;geos.forEach(function(g){g.computeVertexNormals();pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count});var bg=new THREE_.BufferGeometry();bg.setAttribute('position',new THREE_.BufferAttribute(pos,3));bg.setAttribute('normal',new THREE_.BufferAttribute(nor,3));var m=new THREE_.Mesh(bg,mat);m.castShadow=true;return m}
      sc.add(merged(trunk,lam(0x6b4a2a)));sc.add(merged(leaf,lam(0x3d7d3a,{flatShading:true})));
      var hills=[];for(var h=0;h<14;h++){var hg=new THREE.SphereGeometry(30+Math.random()*25,12,8,0,6.29,0,Math.PI/2);hg.scale(1,.35+Math.random()*.25,1);add(hills,hg,-180+h*28,-2,-170-Math.random()*30)}sc.add(merged(hills,lam(0x7fae7a,{flatShading:true})));
      /* manche à air (vent) */
      var pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,4,6),white);pole.position.set(3.4,2,-14);sc.add(pole);
      var sock=new THREE.Group();sock.position.set(3.4,3.85,-14);var sm=new THREE.Mesh(new THREE.CylinderGeometry(.22,.1,1.1,12,4,true),new THREE.MeshLambertMaterial({color:0xff6a2a,side:THREE.DoubleSide}));sm.rotation.z=Math.PI/2;sm.position.x=.55;sock.add(sm);sc.add(sock);S.sock=sock;
    }
    function newShot(){S.wind=(Math.random()-.5)*(1.6+S.n*.3);S.dist=[25,35,45,55,65][Math.min(4,Math.floor(S.n/2))];S.tg.position.set(0,1.5,-S.dist);S.phase='aim';S.draw=0;S.arrow=null;S.fp=S.fp||0}
    /* angle à viser au-dessus de la cible pour une distance (flèche tirée à pleine tension) */
    function hold(d){return .5*Math.asin(Math.min(1,G*d/(VMAX*VMAX)))}
    function sight(C){var st=C.cv.parentNode,el=st.querySelector('.arch-sight');if(!el){el=document.createElement('div');el.className='arch-sight';el.innerHTML='<svg viewBox="-100 -100 200 200"><circle r="46" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2"/><circle r="47.5" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/><line x1="-60" y1="0" x2="-14" y2="0"/><line x1="14" y1="0" x2="60" y2="0"/><line x1="0" y1="-60" x2="0" y2="-14"/><circle r="2.6" fill="#e2361b" stroke="none"/><g class="pins"></g></svg><b class="arch-pow"><i></i></b>';st.appendChild(el)}return el}
    function viewPx(C){return C.cv.getBoundingClientRect().height||540}
    PP.arcade({id:'arch',three:true,
      setup:function(C){ag.three(C);clearScene(C);var sc=C.scene;var sun=lights(C,24);sun.position.set(-8,18,6);sc.background=new THREE.Color(0xbfdcf0);sc.fog=new THREE.Fog(0xbfdcf0,70,220);
        S={n:0,tot:0,shots:C.mode==='duel'?12:10,cur:0,pts:[0,0],fp:0,yaw:0,pitch:0,stuck:[],marks:[]};mini(C);S.tg=targetMesh();sc.add(S.tg);scenery(sc);
        S.bow3=bowMesh(false);sc.add(S.bow3);S.bow1=bowMesh(true);sc.add(S.bow1);S.nock=arrowMesh(true);sc.add(S.nock);
        S.pz=persoModel(sc,.72);if(S.pz)S.pz.m.traverse(function(o){if(o.isMesh)o.castShadow=true});
        C.cam.fov=FOV3;C.cam.updateProjectionMatrix();newShot();
        C.keysText('Souris (ou glisse le doigt) pour viser · maintiens le clic pour bander l\'arc : la vue passe à la 1re personne · relâche pour tirer · les traits sous le viseur donnent la hausse pour 25, 45 et 65 m à pleine tension');
        C.over('Tir à l\'arc 3D',S.shots+' flèches, la cible recule et se met à bouger à partir de la 5e. Tu es derrière ton perso ; quand tu bandes l\'arc tu vises en 1re personne. Bande à fond, mets le bon trait du viseur sur la cible et compense le vent (manche à air). Le centre jaune vaut 10.'+(C.mode==='duel'?' J1 et J2 tirent chacun leur tour.':'')+'<br>Record : <b>'+C.best('pts')+'</b>','Jouer')},
      start:function(C){if(S.n){this.setup(C);C.hide()}},
      mouse:function(C,t,x,y,e){var touch=e&&e.pointerType==='touch';
        if(touch){if(t==='down'){S.tch={x:x,y:y,yw:S.yaw,pt:S.pitch}}else if(S.tch&&t==='move'){var k=S.fp>.5?.5:1;S.yaw=Math.max(-.3,Math.min(.3,S.tch.yw-(x-S.tch.x)/960*.6*k));S.pitch=Math.max(-.12,Math.min(.2,S.tch.pt-(y-S.tch.y)/540*.4*k))}}
        else{S.yaw=-(x/960-.5)*.6;S.pitch=-(y/540-.5)*.32+.04}
        if(!C.running)return;if(t==='down'&&S.phase==='aim'){S.phase='draw';S.draw=0;sfx.play('tick')}if(t==='up'){S.tch=null;if(S.phase==='draw')shoot(C)}},
      step:function(C,dt){var cam=C.cam;cam.rotation.order='YXZ';
        var sway=S.phase==='draw'&&S.draw>=1?Math.min(1,(S.hold=(S.hold||0)+dt)/6):0;if(S.phase!=='draw')S.hold=0;var tn=performance.now()/1000;
        var ty=S.yaw+Math.sin(tn*1.3)*.0015*(1+sway*3),tp=S.pitch+Math.sin(tn*1.9+1)*.0015*(1+sway*3);
        S.cy=(S.cy==null?ty:S.cy)+(ty-(S.cy==null?ty:S.cy))*Math.min(1,dt*10);S.cx=(S.cx==null?tp:S.cx)+(tp-(S.cx==null?tp:S.cx))*Math.min(1,dt*10);cam.rotation.set(S.cx,S.cy,0);
        if(S.phase==='draw')S.draw=Math.min(1,S.draw+dt*1.3);
        /* 1re personne pendant la visée et le vol de la flèche, 3e personne le reste du temps */
        var wantFP=S.phase==='draw'||S.phase==='fly'||(S.phase==='show'&&S.t>.7)?1:0;S.fp+=(wantFP-S.fp)*Math.min(1,dt*(wantFP?7:4));var k=S.fp*S.fp*(3-2*S.fp);
        var f=new THREE.Vector3(0,0,-1).applyEuler(cam.rotation),r=new THREE.Vector3(1,0,0).applyEuler(cam.rotation),u=new THREE.Vector3(0,1,0).applyEuler(cam.rotation);
        var eye=new THREE.Vector3(0,1.36,0),third=eye.clone().addScaledVector(f,-3.3).addScaledVector(r,.75).addScaledVector(u,.55);
        cam.position.copy(third).lerp(eye,k);cam.rotateX(-.12*(1-k));var fov=FOV3+(FOV1-FOV3)*k-(S.phase==='draw'?S.draw*5*k:0);if(Math.abs(cam.fov-fov)>.01){cam.fov=fov;cam.updateProjectionMatrix()}
        var dr=S.phase==='draw'?S.draw:0,pull=dr*.3;
        if(S.pz){var P3=S.pz.P,yaw=cam.rotation.y,pit=cam.rotation.x;S.pz.m.visible=k<.55;S.pz.m.position.set(0,.12,.05);S.pz.m.rotation.y=yaw;
          if(S.phase==='draw')pose(P3,{a0:1.52+pit,z0:.12,a1:.35+pit,z1:1.35,e1:2.25-dr*.75,ty:.2,k0:.1,k1:.1});
          else{var br=Math.sin(tn*2)*.02;pose(P3,{a0:.35+br,z0:.08,e0:.35,a1:.05,z1:-.1,e1:.25,ty:.05,k0:.06,k1:.06,ry:br*.5})}
          P3.head.rotation.y=S.phase==='draw'?-.15:0;S.pz.m.updateMatrixWorld(true);var lh=new THREE.Vector3();P3.hands[0].getWorldPosition(lh);
          S.bow3.visible=k<.55;S.bow3.position.copy(lh);S.bow3.scale.setScalar(.95);if(S.phase==='draw'){S.bow3.rotation.copy(cam.rotation);S.bow3.rotateZ(-.12)}else{S.bow3.rotation.set(.1,yaw+1.35,.3,'YXZ')}}
        else S.bow3.visible=false;
        /* arc et flèche devant les yeux, toujours dessinés par-dessus le décor */
        S.bow1.visible=k>.35;S.bow1.position.copy(cam.position).addScaledVector(f,.72).addScaledVector(r,-.07).addScaledVector(u,-.06+(1-k)*-.3);S.bow1.rotation.copy(cam.rotation);S.bow1.rotateZ(-.14);S.bow1.scale.setScalar(.62);
        var tips=S.bow1.userData.tips;S.bow1.userData.str.geometry.setFromPoints([tips[0],new THREE.Vector3(0,0,tips[0].z+pull),tips[1]]);
        var tips3=S.bow3.userData.tips;S.bow3.userData.str.geometry.setFromPoints([tips3[0],new THREE.Vector3(0,0,tips3[0].z+(S.pz?pull*.6:0)),tips3[1]]);
        S.nock.visible=(S.phase==='aim'||S.phase==='draw')&&k>.35;S.nock.position.copy(S.bow1.position).addScaledVector(f,.27-pull*.62-.08).addScaledVector(r,.012);S.nock.rotation.copy(cam.rotation);S.nock.scale.setScalar(.62);
        /* viseur et repères de hausse */
        var el=sight(C),cr=C.cv.getBoundingClientRect(),sz2=Math.round(cr.height*.44)+'px';if(el.style.height!==sz2){el.style.width=el.style.height=sz2;el.style.top=(C.cv.offsetTop+cr.height/2)+'px';el.style.left=(C.cv.offsetLeft+cr.width/2)+'px'}el.style.opacity=k>.6&&(S.phase==='draw')?Math.min(1,(k-.6)*2.5):0;
        if(k>.6){var Hpx=viewPx(C)/2,tf=Math.tan(cam.fov*Math.PI/360),scl=200/(el.getBoundingClientRect().height||200),g=el.querySelector('.pins'),h='';
          [25,45,65].forEach(function(d){var off=Math.tan(hold(d))/tf*Hpx*scl,cur=d===S.dist||(S.dist===35&&d===25)||(S.dist===55&&d===45);if(off<95)h+='<line x1="-'+(cur?16:10)+'" y1="'+off.toFixed(1)+'" x2="'+(cur?16:10)+'" y2="'+off.toFixed(1)+'" stroke="'+(cur?'#f3c623':'#fff')+'" stroke-width="'+(cur?3:2)+'"/><text x="'+(cur?21:15)+'" y="'+(off+4).toFixed(1)+'" font-size="11" font-family="IBM Plex Mono,monospace" font-weight="700" fill="'+(cur?'#f3c623':'#fff')+'" stroke="#141210" stroke-width=".6">'+d+'</text>'});
          if(g.innerHTML!==h)g.innerHTML=h;el.querySelector('.arch-pow i').style.width=(dr*100)+'%';el.classList.toggle('full',dr>=1)}
        S.sock.rotation.y=S.wind>0?Math.PI*0+(-.0):Math.PI;S.sock.children[0].scale.set(1,.35+Math.min(1,Math.abs(S.wind)/2)*.65,1);S.sock.rotation.y=(S.wind>0?0:Math.PI)+Math.sin(tn*3)*.12;S.sock.rotation.z=-(1-Math.min(1,Math.abs(S.wind)/2))*1.1;
        S.tt=(S.tt||0)+dt;if(S.n>=4&&S.phase!=='show'){S.tg.position.x=Math.sin(S.tt*(.6+S.n*.06))*(1.2+S.n*.25)}else if(S.n<4)S.tg.position.x=0;
        if(S.face){S.face.position.x*=.9;S.face.rotation.x*=.85}
        var A=S.arrow;if(A&&S.phase==='fly'){var n=4;for(var s=0;s<n;s++){var h2=dt/n;A.v.y-=G*h2;A.v.x+=S.wind*h2*.9;A.p.addScaledVector(A.v,h2);var tz=-S.dist+.2;if(A.p.z<=tz&&A.prevZ>tz){var dx=A.p.x-S.tg.position.x,dy=A.p.y-1.5,d=Math.hypot(dx,dy);if(d<.77){var pts=Math.max(1,10-Math.floor(Math.min(d,.76)/.0762));A.p.z=tz+.05;stick(A);S.marks.push([dx/.762,dy/.762]);mini(C);hit(C,pts);break}}A.prevZ=A.p.z;if(A.p.y<.02||A.p.z<tz-30){if(A.p.y<.02){A.p.y=.02;A.m.position.copy(A.p)}hit(C,0);break}}
          if(S.phase==='fly'){A.m.position.copy(A.p);A.m.lookAt(A.p.clone().add(A.v));A.m.rotateY(Math.PI);A.m.rotateZ(dt*8)}}
        if(S.phase==='show'){S.t-=dt;if(S.t<=0){S.n++;if(S.n>=S.shots)return end(C);if(C.mode==='duel')S.cur=S.n%2;newShot()}}
        C.hud((C.mode==='duel'?'<span>Tir <b>J'+(S.cur+1)+'</b></span><span>J1 <b>'+S.pts[0]+'</b> · J2 <b>'+S.pts[1]+'</b></span>':'<span>Score <b>'+S.tot+'</b></span>')+'<span>Flèche <b>'+Math.min(S.shots,S.n+1)+' / '+S.shots+'</b></span><span>Cible <b>'+S.dist+' m</b></span><span>Vent <b>'+(S.wind>0?'→':'←')+' '+Math.abs(S.wind).toFixed(1)+'</b></span>'+(S.phase==='aim'?'<span>Maintiens le clic pour viser</span>':'')+(S.msg?'<span style="background:#f3c623">'+S.msg+'</span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)}});
    function shoot(C){var cam=C.cam,f=new THREE.Vector3(0,0,-1).applyEuler(cam.rotation),sp=22+S.draw*(VMAX-22);var m=arrowMesh(false);m.castShadow=true;C.scene.add(m);
      var eye=new THREE.Vector3(0,1.36,0);S.arrow={m:m,p:eye.clone().addScaledVector(f,.5),v:f.clone().multiplyScalar(sp),prevZ:0};S.phase='fly';sfx.play('ui');S.msg='';S.draw=0;
      S.yaw+=(Math.random()-.5)*.002}
    /* petite cible dans le coin : on voit où sont tombées ses flèches */
    function mini(C){var st=C.cv.parentNode,c=st.querySelector('.arch-mini');if(!c){c=document.createElement('canvas');c.className='arch-mini';c.width=c.height=160;st.appendChild(c)}var hh=Math.round(Math.min(96,C.cv.getBoundingClientRect().height*.22))+'px';c.style.width=c.style.height=hh;c.style.top=(C.cv.offsetTop+10)+'px';c.style.right='10px';var g=c.getContext('2d'),cols=['#f6f2ea','#1b1a1e','#2f8fe0','#e2361b','#f3c623'];g.clearRect(0,0,160,160);
      for(var i=0;i<10;i++){g.fillStyle=cols[i>>1];g.beginPath();g.arc(80,80,74-i*7.4,0,7);g.fill();g.strokeStyle=i===2||i===3?'rgba(255,255,255,.3)':'rgba(0,0,0,.25)';g.lineWidth=1;g.stroke()}
      S.marks.forEach(function(m,i){var last=i===S.marks.length-1;g.fillStyle=last?'#3fe09a':'#141210';g.strokeStyle='#fff';g.lineWidth=last?2:1;g.beginPath();g.arc(80+m[0]*74,80-m[1]*74,last?5:3.5,0,7);g.fill();g.stroke()})}
    function stick(A){var tgp=S.face;tgp.updateMatrixWorld(true);A.m.position.copy(A.p);A.m.lookAt(A.p.clone().add(A.v));A.m.rotateY(Math.PI);tgp.attach(A.m);S.stuck.push(A.m);if(S.stuck.length>12){var o=S.stuck.shift();o.parent.remove(o)}S.face.position.x=0;S.face.rotation.x=-.06}
    function hit(C,pts){S.phase='show';S.t=1.8;C.pop(pts?(pts===10?'MOUCHE !':'+'+pts):'RATÉ',pts>=9?'#f3c623':pts>=7?'#e2361b':pts?'#3fa9ff':'#f1ece2');if(pts===10)C.shake(6);if(C.mode==='duel')S.pts[S.cur]+=pts;else S.tot+=pts;S.msg=pts?(pts===10?'MOUCHE ! 10':pts+' points'):'Raté';sfx.play(pts>=8?'win':pts?'hit':'lose')}
    function end(C){C.stop();var el=C.cv.parentNode.querySelector('.arch-sight');if(el)el.style.opacity=0;if(C.mode==='duel'){C.over(S.pts[0]===S.pts[1]?'Égalité':(S.pts[0]>S.pts[1]?'J1':'J2')+' gagne !','J1 <b>'+S.pts[0]+'</b> – <b>'+S.pts[1]+'</b> J2','Rejouer');return}var nb=C.best('pts',S.tot);if(S.tot>=70)C.win();C.over('Fin du tir','Score : <b>'+S.tot+'</b> / 100'+(nb?' · nouveau record !':''),'Rejouer')}
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
