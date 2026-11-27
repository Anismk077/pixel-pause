/* Pixel Pause — Tennis 3D (v89) : un set contre l'ordi, 3 difficultés.
   Déplace-toi, frappe au bon moment ; la direction tenue au moment de la frappe choisit où part la balle
   (gauche / droite, en avant = long et fort, en arrière = amorti). */
(function(){
  'use strict';
  var sfx=PP.sfx;
  function lam(c,o){return new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}))}
  function cl(v,a,b){return v<a?a:v>b?b:v}
  var HW=4.115,HL=11.885,SL=6.4,NET=.914,G=9.8,BR=.11;
  var DIF={facile:{sp:4.6,miss:.14,out:.12,reach:2.1,aim:2.2,auto:1,name:'Facile'},moyen:{sp:6,miss:.06,out:.07,reach:1.75,aim:2.9,auto:0,name:'Moyen'},difficile:{sp:7.4,miss:.02,out:.035,reach:1.55,aim:3.4,auto:0,name:'Difficile'}};
  var S=null,CC=null,WORLD=null;
  var PTS=['0','15','30','40'];

  function cvTex(w,h,f){var c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}
  function person(shirt,shorts,skin,hair){
    var g=new THREE.Group(),sk=lam(skin),m=function(geo,mat,x,y,z,p){var o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;(p||g).add(o);return o};
    var legs=[-1,1].map(function(s){var l=new THREE.Group();l.position.set(s*.13,.86,0);g.add(l);m(new THREE.CylinderGeometry(.075,.065,.82,8),sk,0,-.41,0,l);m(new THREE.BoxGeometry(.13,.08,.26),lam(0xf4f4f4),0,-.84,-.05,l);return l});
    m(new THREE.CylinderGeometry(.22,.2,.28,10),lam(shorts),0,.92,0);
    var torso=m(new THREE.CylinderGeometry(.2,.23,.58,10),lam(shirt),0,1.32,0);
    m(new THREE.SphereGeometry(.15,14,10),sk,0,1.78,0);var cap=m(new THREE.SphereGeometry(.155,14,8,0,Math.PI*2,0,Math.PI/2),lam(hair),0,1.8,0);var vis=m(new THREE.BoxGeometry(.2,.02,.14),lam(hair),0,1.82,-.15);
    var armL=new THREE.Group();armL.position.set(-.27,1.55,0);g.add(armL);m(new THREE.CylinderGeometry(.055,.05,.6,8),sk,0,-.3,0,armL);armL.rotation.z=-.25;
    var arm=new THREE.Group();arm.position.set(.27,1.55,0);g.add(arm);m(new THREE.CylinderGeometry(.055,.05,.6,8),sk,0,-.3,0,arm);
    var rk=new THREE.Group();rk.position.set(0,-.62,0);arm.add(rk);m(new THREE.CylinderGeometry(.018,.022,.3,6),lam(0x222222),0,-.15,0,rk);
    var head=m(new THREE.TorusGeometry(.14,.018,6,20),lam(0xe2361b),0,-.44,0,rk);head.scale.y=1.3;var str=new THREE.Mesh(new THREE.CircleGeometry(.13,16),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,side:THREE.DoubleSide}));str.scale.y=1.3;str.position.y=-.44;rk.add(str);
    arm.rotation.z=.35;
    g.userData={legs:legs,arm:arm,armL:armL,rk:rk};return g}

  function buildWorld(C){var sc=C.scene;while(sc.children.length)sc.remove(sc.children[0]);
    sc.background=new THREE.Color(0x8fc8ee);sc.fog=new THREE.Fog(0x8fc8ee,60,140);
    sc.add(new THREE.HemisphereLight(0xffffff,0x4a6a4a,.85));var sun=new THREE.DirectionalLight(0xfff3dc,1.2);sun.position.set(-8,22,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);var c=sun.shadow.camera;c.left=-14;c.right=14;c.top=18;c.bottom=-18;c.far=60;sc.add(sun);
    /* sol et terrain */
    var out=new THREE.Mesh(new THREE.PlaneGeometry(60,90),lam(0x3c8f5c));out.rotation.x=-Math.PI/2;out.receiveShadow=true;sc.add(out);
    var tex=cvTex(512,1024,function(g,w,h){var sx=w/16,sz=h/36;g.fillStyle='#3c8f5c';g.fillRect(0,0,w,h);g.fillStyle='#1f5aa3';g.fillRect((8-5.485)*sx,(18-HL)*sz,10.97*sx,2*HL*sz);
      g.strokeStyle='#ffffff';g.lineWidth=5;function L(x1,z1,x2,z2){g.beginPath();g.moveTo((x1+8)*sx,(z1+18)*sz);g.lineTo((x2+8)*sx,(z2+18)*sz);g.stroke()}
      [-5.485,-HW,HW,5.485].forEach(function(x){L(x,-HL,x,HL)});[-HL,HL].forEach(function(z){L(-5.485,z,5.485,z)});[-SL,SL].forEach(function(z){L(-HW,z,HW,z)});L(0,-SL,0,SL);L(0,-HL,0,-HL+.3);L(0,HL,0,HL-.3)});
    var court=new THREE.Mesh(new THREE.PlaneGeometry(16,36),new THREE.MeshLambertMaterial({map:tex}));court.rotation.x=-Math.PI/2;court.position.y=.005;court.receiveShadow=true;sc.add(court);
    /* filet */
    var nt=cvTex(256,32,function(g,w,h){g.clearRect(0,0,w,h);g.strokeStyle='rgba(20,20,20,.85)';g.lineWidth=1;for(var x=0;x<w;x+=6){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(var y=0;y<h;y+=6){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}});nt.wrapS=THREE.RepeatWrapping;nt.repeat.x=6;
    var net=new THREE.Mesh(new THREE.PlaneGeometry(12.8,NET),new THREE.MeshBasicMaterial({map:nt,transparent:true,side:THREE.DoubleSide}));net.position.y=NET/2;sc.add(net);
    var tape=new THREE.Mesh(new THREE.BoxGeometry(12.8,.06,.04),lam(0xffffff));tape.position.y=NET;sc.add(tape);
    [-6.4,6.4].forEach(function(x){var p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.07,8),lam(0x2b2b2b));p.position.set(x,.535,0);p.castShadow=true;sc.add(p)});
    /* tribunes */
    var crowd=cvTex(512,128,function(g,w,h){g.fillStyle='#3a3f4a';g.fillRect(0,0,w,h);var C2=['#e2361b','#f3c623','#3fa9ff','#f1ece2','#3fe09a','#b565ff','#ff8a3a'];for(var y=8;y<h;y+=16)for(var x=6;x<w;x+=12){g.fillStyle=C2[(Math.random()*C2.length)|0];g.beginPath();g.arc(x+(Math.random()*3),y,4.5,0,7);g.fill();g.fillStyle='#e8b98c';g.beginPath();g.arc(x,y-6,3,0,7);g.fill()}});
    [-1,1].forEach(function(s){for(var k=0;k<4;k++){var b=new THREE.Mesh(new THREE.BoxGeometry(1.2,1,40),[lam(0x50586a),lam(0x50586a),lam(0x5a6276),lam(0x5a6276),lam(0x50586a),lam(0x50586a)]);b.position.set(s*(10+k*1.2),.5+k,0);sc.add(b);
        var cr=new THREE.Mesh(new THREE.PlaneGeometry(40,.9),new THREE.MeshLambertMaterial({map:crowd,transparent:true}));cr.rotation.y=-s*Math.PI/2;cr.position.set(s*(9.9+k*1.2),1.45+k,0);sc.add(cr)}});
    /* panneaux et chaise d'arbitre */
    var ad=cvTex(1024,64,function(g,w,h){g.fillStyle='#141210';g.fillRect(0,0,w,h);g.font='400 44px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';for(var i=0;i<4;i++){g.fillStyle=i%2?'#f3c623':'#e2361b';g.fillText('PIXEL PAUSE OPEN',128+i*256,h/2+2)}});
    [-1,1].forEach(function(s){var b=new THREE.Mesh(new THREE.PlaneGeometry(16,1),new THREE.MeshBasicMaterial({map:ad}));b.position.set(0,.5,s*17.5);if(s<0)b.rotation.y=0;else b.rotation.y=Math.PI;sc.add(b)});
    var ch=new THREE.Group(),ml=lam(0x2b2b2b);[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]].forEach(function(p){var l=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.8,6),ml);l.position.set(p[0],.9,p[1]);ch.add(l)});var seat=new THREE.Mesh(new THREE.BoxGeometry(.8,.1,.8),lam(0x2e6fb3));seat.position.y=1.8;ch.add(seat);var ump=person(0x223355,0x223355,0xe8b98c,0x222222);ump.position.y=1.0;ump.scale.setScalar(.9);ump.rotation.y=-Math.PI/2;ch.add(ump);ch.position.set(7.4,0,0);sc.add(ch);
    /* arbres au loin */
    for(var k=0;k<40;k++){var a=k/40*Math.PI*2,r=40+Math.random()*10,t=new THREE.Mesh(new THREE.ConeGeometry(2+Math.random(),7+Math.random()*4,7),lam(0x2f6e3a));t.position.set(Math.cos(a)*r,4,Math.sin(a)*r*1.3);sc.add(t)}
    /* balle et ombre */
    var ball=new THREE.Mesh(new THREE.SphereGeometry(BR*1.4,14,10),new THREE.MeshPhongMaterial({color:0xd9f24a,emissive:0x2a3300,shininess:30}));ball.castShadow=true;sc.add(ball);
    var sh=new THREE.Mesh(new THREE.CircleGeometry(.16,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.012;sc.add(sh);
    var mark=new THREE.Mesh(new THREE.RingGeometry(.22,.3,20),new THREE.MeshBasicMaterial({color:0xf3c623,transparent:true,opacity:.0,depthWrite:false}));mark.rotation.x=-Math.PI/2;mark.position.y=.015;sc.add(mark);
    var me=person(0xe2361b,0xf1ece2,0xe8b98c,0x141210),ai=person(0x2f7fd6,0x141210,0xc68a5a,0xf3c623);sc.add(me);sc.add(ai);ai.rotation.y=Math.PI;
    return {ball:ball,sh:sh,mark:mark,me:me,ai:ai}}

  function fresh(C){var D=DIF[C.mode]||DIF.moyen;S={D:D,pts:[0,0],games:[0,0],server:0,state:'serve',t:0,ball:{x:0,y:1,z:0,vx:0,vy:0,vz:0},last:-1,bounces:0,side:1,netHit:false,me:{x:1,z:12.6,sw:0,swDir:1,hit:false,run:0},ai:{x:-1,z:-12.6,sw:0,swDir:1,run:0,tx:0,tz:-12,react:0},msg:'',serveBall:false,landX:null,ended:false,rally:0,GW:4};placeServe()}
  function placeServe(){var tot=S.pts[0]+S.pts[1],right=tot%2===0,sv=S.server;S.state='serve';S.t=0;S.last=-1;S.bounces=0;S.netHit=false;S.serveBall=false;S.rally=0;
    var sx=right?1.4:-1.4;/* côté droit vu par chaque serveur */
    if(sv===0){S.me.x=sx;S.me.z=12.4;S.ai.x=-sx*1.6;S.ai.z=-12.2}else{S.ai.x=-sx;S.ai.z=-12.4;S.me.x=sx*1.6;S.me.z=12.2}
    var p=sv===0?S.me:S.ai;S.ball.x=p.x+(sv===0?.35:-.35);S.ball.y=1.1;S.ball.z=p.z+(sv===0?-.3:.3);S.ball.vx=S.ball.vy=S.ball.vz=0}
  function scoreText(){var a=S.pts[0],b=S.pts[1];if(a>=3&&b>=3){if(a===b)return 'Égalité';return 'Avantage '+(a>b?'toi':'ordi')}return PTS[Math.min(a,3)]+' – '+PTS[Math.min(b,3)]}
  function point(C,w,why){if(S.state==='point')return;S.state='point';S.t=0;S.msg=why;S.pts[w]++;sfx.play(w===0?'pickup':'hurt');var a=S.pts[0],b=S.pts[1];
    if((a>=4||b>=4)&&Math.abs(a-b)>=2){S.games[w]++;S.pts=[0,0];S.server=1-S.server;var g=S.games;C.pop(w===0?'JEU POUR TOI':'JEU ORDI',w===0?'#3fe09a':'#e2361b','46px');
      if((g[w]>=S.GW&&g[w]-g[1-w]>=2)||g[w]>=S.GW+2){S.ended=true;setTimeout(function(){endMatch(C,w)},1300)}}
    else C.pop(w===0?'Point !':'Point ordi',w===0?'#3fe09a':'#e2361b','40px')}
  function endMatch(C,w){C.stop();var g=S.games;if(w===0){C.win();sfx.play('win');var k='w-'+C.mode;PP.store('tennis-'+k,(PP.store('tennis-'+k)|0)+1)}else sfx.play('lose');
    C.over(w===0?'Victoire !':'Défaite…','Set : <b>'+g[0]+' – '+g[1]+'</b> ('+S.D.name+')<br>Victoires en '+S.D.name.toLowerCase()+' : <b>'+(PP.store('tennis-w-'+C.mode)|0)+'</b>','Rejouer')}

  /* tir : vitesse pour que la balle tombe en (tx,tz) après T secondes, en passant le filet */
  function shot(b,tx,tz,T){for(var k=0;k<14;k++){var vx=(tx-b.x)/T,vz=(tz-b.z)/T,vy=(0-b.y+.5*G*T*T)/T,t0=(0-b.z)/vz;if(t0>0&&t0<T){var yn=b.y+vy*t0-.5*G*t0*t0;if(yn<NET+.25){T+=.08;continue}}b.vx=vx;b.vy=vy;b.vz=vz;return}b.vx=(tx-b.x)/T;b.vz=(tz-b.z)/T;b.vy=(0-b.y+.5*G*T*T)/T}
  function predict(sideSign){/* où la balle sera frappable (après le rebond) du côté sideSign */var b={x:S.ball.x,y:S.ball.y,z:S.ball.z,vx:S.ball.vx,vy:S.ball.vy,vz:S.ball.vz},bo=S.bounces,dt=1/60;
    for(var i=0;i<240;i++){b.vy-=G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;if(b.y<BR){b.y=BR;b.vy=-b.vy*.72;b.vx*=.9;b.vz*=.9;bo++}if(bo>=1&&b.z*sideSign>0&&b.vy<0&&b.y<1.2)return b;if(Math.abs(b.z)>15)return b}return b}
  function hit(C,who){var b=S.ball,D=S.D;S.last=who;S.bounces=0;S.netHit=false;S.rally++;sfx.play('hit');
    if(who===0){var k=C.keys,L=k.ArrowLeft||k.KeyA,R=k.ArrowRight||k.KeyD,U=k.ArrowUp||k.KeyW,Dn=k.ArrowDown||k.KeyS,late=cl((b.z-S.me.z)/1.2,0,1);
      var tx=L?-3.1:R?3.1:cl(-S.me.x*.4,-2,2)+(Math.random()-.5)*1.6,tz=U?-9.6:Dn?-4.2:-8,T=U?.95:Dn?1.35:1.12;tx+=(Math.random()-.5)*(.5+late*2.2);tz+=(Math.random()-.5)*(.8+late*1.5);
      if(S.serveBall){tx=S.me.x>0?-2.2:2.2;tz=-4.5;T=.85;tx+=(Math.random()-.5)*.8}shot(b,tx,tz,T)}
    else{var A=D.aim,ax=(Math.random()*2-1)*A;if(D.name==='Difficile'&&Math.random()<.6)ax=S.me.x>0?-A:A;var az=6+Math.random()*4,aT=1.05+Math.random()*.3-(D.name==='Difficile'?.12:0);
      if(Math.random()<D.out){if(Math.random()<.5)ax=Math.sign(ax||1)*(HW+.6+Math.random());else az=HL+.8+Math.random()*1.5}
      if(S.serveBall){ax=S.ai.x>0?2.0:-2.0;az=4.6;aT=.9}shot(b,ax,az,aT)}
    if(S.state==='serve'){S.state='play'}S.serveBall=S.serveBall&&false}
  function serve(C){var sv=S.server,p=sv===0?S.me:S.ai;S.serveBall=true;S.ball.x=p.x+(sv===0?.3:-.3);S.ball.z=p.z+(sv===0?-.2:.2);S.ball.y=2.6;hit(C,sv);S.serveBall=true;S.state='play';if(sv===0)S.me.sw=.3;else S.ai.sw=.3}

  PP.arcade({id:'tennis',three:true,
    setup:function(C){CC=C;PP.ag.three(C);if(!WORLD){WORLD=buildWorld(C);C.cam.fov=52;C.cam.near=.1;C.cam.far=300;C.cam.updateProjectionMatrix()}fresh(C);this.draw(C,0);
      C.keysText('<kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> ou <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> se déplacer · <kbd>Espace</kbd> frapper / servir · la direction tenue au moment de frapper choisit le coup : côté = vers la ligne, avant = long et fort, arrière = amorti');
      C.over('Tennis · '+S.D.name,'Un set contre l\'ordi : le premier à <b>4 jeux</b> (avec 2 d\'écart) gagne.<br>Place-toi près de la balle et frappe au bon moment.'+(S.D.auto?'<br>En Facile, ton perso frappe tout seul : occupe-toi juste de te placer.':'')+'<br>Victoires : <b>'+(PP.store('tennis-w-'+C.mode)|0)+'</b>','Jouer')},
    start:function(C){fresh(C)},
    key:function(C,code,down){if(!down||!C.running||!S)return;if(code==='Space'||code==='Enter'||code==='KeyJ'){if(S.state==='serve'&&S.server===0&&S.t>.4){serve(C);return}if(S.me.sw<=0)S.me.sw=.32}},
    mouse:function(C,t){if(t==='down'&&C.running&&S){if(S.state==='serve'&&S.server===0&&S.t>.4){serve(C);return}if(S.me.sw<=0)S.me.sw=.32}},
    step:function(C,dt){var k=C.keys,b=S.ball,me=S.me,ai=S.ai,D=S.D;S.t+=dt;
      /* moi */
      var mx=(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),mz=(k.ArrowDown||k.KeyS?1:0)-(k.ArrowUp||k.KeyW?1:0);
      if(S.state!=='serve'||S.server!==0){var L=Math.hypot(mx,mz)||1;me.x=cl(me.x+mx/L*7*dt,-7,7);me.z=cl(me.z+mz/L*7*dt,1.2,15.5);me.run=mx||mz?me.run+dt*12:0}
      else me.x=cl(me.x+mx*3*dt,me.x>0?.3:-4,me.x>0?4:-.3);
      if(me.sw>0)me.sw-=dt;
      var near=function(p){var dx=b.x-p.x,dz=b.z-p.z;return Math.hypot(dx,dz)<D.reach&&b.y<2.5&&b.y>.05};
      if(S.state==='play'&&S.last!==0&&b.z>0&&!(S.serveBall&&S.bounces<1)&&near(me)){if(me.sw>.05||D.auto){if(D.auto&&me.sw<=0)me.sw=.3;me.swDir=b.x<me.x?-1:1;hit(C,0)}}
      /* service de l'ordi */
      if(S.state==='serve'&&S.server===1&&S.t>1.1)serve(C);
      if(S.state==='serve'&&S.server===0){S.ball.x=me.x+.3;S.ball.z=me.z-.3;S.ball.y=1.1+Math.abs(Math.sin(S.t*3))*.5}
      /* l'ordi */
      if(S.state==='play'){if(S.last===0){ai.react-=dt;if(ai.react<=0){var p=predict(-1);ai.tx=cl(p.x+(b.x<ai.x?.3:-.3),-7,7);ai.tz=cl(p.z-.4,-15,-1.5);ai.react=.25}}else{ai.tx=0;ai.tz=-11.8}}
      else if(S.state==='point'){ai.tx=0;ai.tz=-11.8}
      if(S.state!=='serve'){var ddx=ai.tx-ai.x,ddz=ai.tz-ai.z,dl=Math.hypot(ddx,ddz),st=Math.min(dl,D.sp*dt);if(dl>.05){ai.x+=ddx/dl*st;ai.z+=ddz/dl*st;ai.run+=dt*12}else ai.run=0}
      if(ai.sw>0)ai.sw-=dt;
      if(S.state==='play'&&S.last===0&&b.z<0&&!(S.serveBall&&S.bounces<1)&&near(ai)&&S.bounces<2){if(ai.decided==null)ai.decided=Math.random()>=D.miss;if(ai.decided){ai.sw=.3;ai.swDir=b.x<ai.x?1:-1;hit(C,1)}}
      if(S.last!==1)/*nouvelle décision au prochain échange*/;if(S.last===1)ai.decided=null;
      /* balle */
      if(S.state==='play'||S.state==='point'){var pz=b.z;b.vy-=G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
        /* filet */
        if(S.state==='play'&&!S.netHit&&((pz>0)!==(b.z>0))&&b.y<NET+BR&&Math.abs(b.x)<6.4){S.netHit=true;b.z=pz>0?.12:-.12;b.vz=-b.vz*.15;b.vx*=.3;b.vy=Math.min(b.vy,.5);sfx.play('tick');S.netBy=S.last}
        if(b.y<BR){b.y=BR;if(Math.abs(b.vy)>.6)sfx.play('tick');b.vy=-b.vy*.72;b.vx*=.88;b.vz*=.88;
          if(S.state==='play'){var side=b.z>0?0:1;S.bounces++;
            if(S.netHit){point(C,1-S.netBy,S.netBy===0?'Dans le filet':'L\'ordi a mis la balle dans le filet')}
            else if(S.bounces===1){var inX=Math.abs(b.x)<=HW+.03,inZ=Math.abs(b.z)<=HL+.03;if(side===S.last){point(C,1-S.last,'Faute')}
              else if(!inX||!inZ){point(C,1-S.last,S.last===0?'Out !':'Out ! L\'ordi a tapé dehors');S.landX={x:b.x,z:b.z}}
              else{S.landX={x:b.x,z:b.z};S.serveBall=false}}
            else if(S.bounces>=2){point(C,side===0?1:0,side===0?'Deux rebonds : trop tard':'L\'ordi n\'a pas pu la reprendre')}}}
        if(S.state==='play'&&(Math.abs(b.z)>22||Math.abs(b.x)>14)){if(S.bounces>=1&&!S.netHit)point(C,S.last,S.last===0?'Imparable !':'Trop tard');else point(C,1-S.last,'Dehors')}}
      if(S.state==='point'&&S.t>1.5&&!S.ended)placeServe();
      C.hud('<span>Toi <b>'+S.games[0]+'</b> jeux</span><span><b>'+scoreText()+'</b></span><span>Ordi <b>'+S.games[1]+'</b> jeux</span><span>'+(S.state==='serve'?(S.server===0?'À toi de servir (Espace)':'Service ordi'):S.state==='point'?S.msg:'Échange '+S.rally)+'</span>')},
    draw:function(C){if(!S||!WORLD)return;var w=WORLD,b=S.ball,t=performance.now()/1000;
      w.ball.position.set(b.x,b.y,b.z);w.sh.position.set(b.x,.012,b.z);var hs=cl(1-b.y/6,.3,1);w.sh.scale.setScalar(hs);w.sh.material.opacity=.38*hs;
      if(S.landX){w.mark.position.set(S.landX.x,.015,S.landX.z);w.mark.material.opacity=Math.max(0,w.mark.material.opacity-.01)}if(S.landX&&S.landX.fresh!==1){S.landX.fresh=1;w.mark.material.opacity=.9}
      [[w.me,S.me,1],[w.ai,S.ai,-1]].forEach(function(o){var m=o[0],p=o[1],ud=m.userData;m.position.set(p.x,0,p.z);var r=Math.sin(p.run)*.6;ud.legs[0].rotation.x=r;ud.legs[1].rotation.x=-r;m.position.y=Math.abs(Math.sin(p.run))*.05;
        var sw=p.sw>0?1-p.sw/.32:0;ud.arm.rotation.set(-.3-Math.sin(sw*Math.PI)*.9,0,.35);ud.arm.rotation.y=p.sw>0?(sw*2.6-1.3)*(p.swDir||1):-.6;ud.armL.rotation.x=Math.sin(p.run)*.4});
      var cx=S.me.x*.45;C.cam.position.set(cx,4.8,S.me.z+5.6);C.cam.lookAt(cx*.4,.5,-2.5);C.R.render(C.scene,C.cam)}});
})();
