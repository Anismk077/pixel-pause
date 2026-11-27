/* Pixel Pause — Coup de Bâton (v89) : beat'em up à défilement.
   Tu avances avec ton bâton, des voyous arrivent de partout : assomme-les pour passer.
   5 niveaux (rue, parc, métro, port, toits) avec un chef à la fin, 3 difficultés, niveau atteint sauvegardé. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag;
  var W=960,H=540,Y0=330,Y1=515;
  function cl(v,a,b){return v<a?a:v>b?b:v}
  function hash(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)}
  function sc(y){return .86+(y-Y0)/(Y1-Y0)*.24}

  var DIF={facile:{dmg:.55,hp:.8,max:1,lives:5,wind:1.35,name:'Facile'},normal:{dmg:1,hp:1,max:2,lives:3,wind:1,name:'Normal'},difficile:{dmg:1.45,hp:1.25,max:3,lives:2,wind:.75,name:'Difficile'}};
  var TYPES={
    voyou:{hp:34,sp:105,dmg:8,reach:62,wind:.45,col:['#3f5a8a','#2a2a33','#6b4a2b'],hat:'cap',pts:100},
    rapide:{hp:22,sp:140,dmg:6,reach:58,wind:.3,col:['#3fbf6a','#2a2a33','#1a1a1a'],hat:'band',pts:120},
    costaud:{hp:80,sp:68,dmg:15,reach:72,wind:.65,col:['#8a3a3a','#3a3a3a','#2a1a10'],hat:'bald',big:1.25,armor:1,pts:250},
    lanceur:{hp:26,sp:95,dmg:8,reach:0,wind:.6,col:['#c9a23a','#4a3a2a','#3a2a1a'],hat:'hood',throw:1,pts:150},
    boss:{hp:260,sp:95,dmg:14,reach:80,wind:.5,col:['#141210','#7a1a1a','#e2361b'],hat:'mohawk',big:1.4,armor:1,boss:1,pts:1000}
  };
  var LV=[
    {n:'La rue',th:'rue',waves:[['voyou','voyou'],['voyou','voyou','voyou'],['voyou','rapide','voyou']],boss:'Gros Momo',bc:['#5a5a6a','#2a2a33','#e2361b']},
    {n:'Le parc',th:'parc',waves:[['rapide','voyou','rapide'],['voyou','voyou','rapide','rapide'],['costaud','voyou']],boss:'La Fusée',bc:['#3fbf6a','#141210','#f3c623'],bsp:1.4},
    {n:'Le métro',th:'metro',waves:[['lanceur','voyou','voyou'],['rapide','lanceur','rapide','voyou'],['costaud','lanceur','lanceur']],boss:'Le Contrôleur',bc:['#2a4a8a','#1a1a2a','#f3c623']},
    {n:'Le port',th:'port',waves:[['costaud','voyou','rapide'],['lanceur','costaud','rapide','voyou'],['costaud','costaud','lanceur']],boss:'Capitaine Crochet',bc:['#e07a1f','#1a2a3a','#f1ece2'],bhp:1.2},
    {n:'Les toits',th:'toit',waves:[['rapide','rapide','lanceur','voyou'],['costaud','rapide','lanceur','voyou'],['costaud','costaud','rapide','rapide','lanceur']],boss:'Le Boss',bc:['#141210','#7a1a1a','#e2361b'],bhp:1.5,bsp:1.2}
  ];
  var S=null,CC=null;
  function saved(m){return cl(PP.store('baton-lv-'+m)|0,0,LV.length-1)}

  /* ---------- personnages dessinés ---------- */
  function limb(g,x1,y1,x2,y2,w,col){g.lineCap='round';g.strokeStyle='#141210';g.lineWidth=w+4;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()}
  function leg(g,hx,hy,a,k,L,w,col,shoe){var kx=hx+Math.sin(a)*L,ky=hy+Math.cos(a)*L,fx=kx+Math.sin(a-k)*L,fy=ky+Math.cos(a-k)*L;limb(g,hx,hy,kx,ky,w,col);limb(g,kx,ky,fx,fy,w-1,col);g.fillStyle=shoe;g.strokeStyle='#141210';g.lineWidth=2;g.beginPath();g.ellipse(fx+4,fy+1,9,5,0,0,7);g.fill();g.stroke()}
  function arm(g,sx,sy,a,e,L,w,col,skin){var ex=sx+Math.sin(a)*L,ey=sy+Math.cos(a)*L,hx=ex+Math.sin(a+e)*L*.95,hy=ey+Math.cos(a+e)*L*.95;limb(g,sx,sy,ex,ey,w,col);limb(g,ex,ey,hx,hy,w-2,skin);g.fillStyle=skin;g.beginPath();g.arc(hx,hy,w*.55,0,7);g.fill();g.strokeStyle='#141210';g.lineWidth=2;g.stroke();return [hx,hy]}
  /* pose : la, lb (jambes), aa, ae (bras avant), ba, be (bras arrière), lean, stick (angle du bâton ou null) */
  function drawGuy(g,o){var s=o.s,col=o.col,skin=o.skin||'#e8b98c';g.save();g.translate(o.x,o.y-o.z);g.scale(o.face*s,s);if(o.rot)g.rotate(o.rot);
    var P=o.p;g.rotate(P.lean||0);
    /* ombre déjà dessinée à part */
    leg(g,-6,-48,P.lb,P.kb||.3,25,12,col[1],'#222');
    if(!o.noBackArm)arm(g,-4,-88,P.ba,P.be,20,10,col[0],skin);
    leg(g,6,-48,P.la,P.ka||.3,25,12,col[1],'#222');
    /* torse */
    g.fillStyle=col[0];g.strokeStyle='#141210';g.lineWidth=3;ag.rr(g,-16,-96,32,52,10);g.fill();g.stroke();
    if(o.tank){g.fillStyle=skin;g.beginPath();g.moveTo(-9,-96);g.quadraticCurveTo(0,-82,9,-96);g.fill()}
    g.fillStyle=col[1];g.fillRect(-16,-52,32,8);g.strokeRect(-16,-52,32,8);
    /* tête */
    g.fillStyle=skin;g.beginPath();g.arc(2,-110,14,0,7);g.fill();g.stroke();
    g.fillStyle='#141210';if(o.ko){g.lineWidth=2;g.beginPath();g.moveTo(5,-115);g.lineTo(11,-109);g.moveTo(11,-115);g.lineTo(5,-109);g.stroke()}else{g.fillRect(8,-114,3.5,4.5)}
    if(o.angry&&!o.ko){g.lineWidth=2;g.beginPath();g.moveTo(5,-119);g.lineTo(13,-116);g.stroke()}
    var hat=o.hat;g.lineWidth=2.5;
    if(hat==='band'){g.fillStyle=col[2]==='#1a1a1a'?'#e2361b':col[2];g.fillRect(-12,-121,28,6);g.strokeRect(-12,-121,28,6);g.beginPath();g.moveTo(-12,-118);g.lineTo(-22,-112);g.lineTo(-20,-122);g.closePath();g.fill();g.stroke()}
    else if(hat==='cap'){g.fillStyle=col[2];g.beginPath();g.arc(2,-113,14.5,Math.PI,0);g.fill();g.stroke();g.fillRect(8,-116,14,4)}
    else if(hat==='hood'){g.fillStyle=col[0];g.beginPath();g.arc(1,-111,17,Math.PI*.8,Math.PI*2.15);g.fill();g.stroke()}
    else if(hat==='mohawk'){g.fillStyle=col[2];for(var i=0;i<5;i++){g.beginPath();g.moveTo(-10+i*5,-121);g.lineTo(-7+i*5,-136+Math.abs(i-2)*3);g.lineTo(-4+i*5,-121);g.fill()}}
    else if(hat==='hair'){g.fillStyle='#2a1a10';g.beginPath();g.arc(1,-114,14,Math.PI*1.05,Math.PI*1.95);g.fill()}
    else if(hat==='bandana'){g.fillStyle='#e2361b';g.beginPath();g.arc(2,-113,14.5,Math.PI,0);g.fill();g.stroke();g.beginPath();g.moveTo(-12,-113);g.lineTo(-24,-106+Math.sin(o.t*14)*3);g.lineTo(-22,-116);g.closePath();g.fill();g.stroke()}
    if(o.boss){g.fillStyle='#f3c623';g.fillRect(-16,-96,32,6)}
    /* bras avant + bâton */
    var hd=arm(g,4,-88,P.aa,P.ae,20,10,col[0],skin);
    if(P.stick!=null){var sa=P.stick,len=74;g.lineCap='round';g.strokeStyle='#141210';g.lineWidth=11;g.beginPath();g.moveTo(hd[0]-Math.cos(sa)*14,hd[1]-Math.sin(sa)*14);g.lineTo(hd[0]+Math.cos(sa)*len,hd[1]+Math.sin(sa)*len);g.stroke();g.strokeStyle='#a8723a';g.lineWidth=7;g.stroke();g.strokeStyle='#d9a066';g.lineWidth=2;g.beginPath();g.moveTo(hd[0],hd[1]-2);g.lineTo(hd[0]+Math.cos(sa)*len*.9,hd[1]+Math.sin(sa)*len*.9-2);g.stroke()}
    if(P.bottle){g.fillStyle='#3fae5a';g.strokeStyle='#141210';g.lineWidth=2;ag.rr(g,hd[0]-4,hd[1]-16,8,16,3);g.fill();g.stroke()}
    g.restore()}
  /* les poses */
  function pose(st,ph,t,walk){var w=Math.sin(walk||0),P={la:.15,lb:-.15,ka:.25,kb:.25,aa:.5,ae:-1.2,ba:-.3,be:-.6,lean:0,stick:null};
    if(st==='walk'){P.la=w*.55;P.lb=-w*.55;P.ka=.2+Math.max(0,-w)*.6;P.kb=.2+Math.max(0,w)*.6;P.ba=-w*.5;P.lean=.05}
    else if(st==='idle'){var b=Math.sin(t*4)*.04;P.la=.2+b;P.lb=-.2-b;P.aa=.6+b}
    else if(st==='wind'){P.aa=Math.PI*.9;P.ae=-.5;P.lean=-.15;P.la=.35;P.lb=-.35}
    else if(st==='punch'){P.aa=1.55;P.ae=0;P.lean=.18;P.la=.45;P.lb=-.4;P.ba=-.7}
    else if(st==='kick'){P.la=1.5;P.ka=0;P.lb=-.2;P.lean=-.2;P.aa=.2}
    else if(st==='slam'){P.aa=2.6-ph*1.4;P.ae=-.2;P.ba=2.4-ph*1.3;P.lean=.25*ph;P.la=.4;P.lb=-.4}
    else if(st==='throw'){P.aa=Math.PI*.95-ph*2.2;P.ae=-.3;P.lean=-.1+ph*.25;P.bottle=ph<.5}
    else if(st==='hurt'){P.lean=-.35;P.aa=-.3;P.ba=-.9;P.la=.3;P.lb=-.2}
    else if(st==='jump'){P.la=.8;P.ka=1.4;P.lb=-.1;P.kb=1.2;P.aa=1.2;P.ba=-1}
    return P}
  function stickPose(P,st,ph){/* angles du bâton pour le héros */
    if(st==='atk1'){var a=-2.2+ph*2.6;P.aa=Math.PI-1.4+ph*1.9;P.ae=-.25;P.stick=a;P.lean=.12*ph}
    else if(st==='atk2'){a=.6-ph*2.6;P.aa=1.9-ph*1.2;P.ae=-.4;P.stick=a;P.lean=.1}
    else if(st==='atk3'){a=-2.6+ph*3.6;P.aa=2.9-ph*1.9;P.ae=-.2;P.stick=a;P.lean=-.15+ph*.4;P.la=.5;P.lb=-.5}
    else if(st==='jatk'){a=-1.2+ph*2.4;P.aa=2.6-ph*1.4;P.stick=a;P.la=.8;P.ka=1.4;P.lb=-.1;P.kb=1.2}
    else if(st==='spin'){a=ph*Math.PI*4;P.aa=1.57;P.ae=0;P.stick=0;P.lean=0}
    else P.stick=P.stick==null?-1.1:P.stick;
    return P}

  /* ---------- décors ---------- */
  function sky(g,top,bot){var gr=g.createLinearGradient(0,0,0,Y0);gr.addColorStop(0,top);gr.addColorStop(1,bot);g.fillStyle=gr;g.fillRect(0,0,W,Y0)}
  function bg(g,cx,th,t){var i,x,h;
    if(th==='rue'||th==='toit'){var night=th==='toit';sky(g,night?'#0b1030':'#7cc4f0',night?'#3a2a5a':'#d8eefa');
      if(night){g.fillStyle='#fff';for(i=0;i<60;i++){g.globalAlpha=.4+hash(i)*.6;g.fillRect(hash(i+3)*W,hash(i+7)*200,2,2)}g.globalAlpha=1;g.fillStyle='#fff6d0';g.beginPath();g.arc(800,80,34,0,7);g.fill()}
      else{g.fillStyle='rgba(255,255,255,.85)';for(i=0;i<5;i++){x=((i*260-cx*.1)%1300+1300)%1300-160;g.beginPath();g.ellipse(x,60+i%3*30,60,18,0,0,7);g.ellipse(x+40,52+i%3*30,40,16,0,0,7);g.fill()}}
      /* immeubles au loin */
      for(i=-1;i<12;i++){var k=Math.floor(cx*.3/110)+i;x=k*110-cx*.3;h=120+hash(k)*150;g.fillStyle=night?'#1c1f3a':'#9fb3c8';g.fillRect(x,Y0-h,100,h);g.fillStyle=night?'rgba(255,220,120,.8)':'rgba(255,255,255,.4)';for(var wy=Y0-h+12;wy<Y0-20;wy+=20)for(var wx=8;wx<92;wx+=18)if(hash(k*31+wy+wx)>.45)g.fillRect(x+wx,wy,8,10)}
      if(!night){/* façades de magasins */for(i=-1;i<6;i++){k=Math.floor(cx*.75/240)+i;x=k*240-cx*.75;var C3=['#d9826a','#e3c27a','#8fb8a8','#c48aa8','#a8b0c8'][(k%5+5)%5];g.fillStyle=C3;g.fillRect(x,Y0-200,236,200);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,Y0-200,236,8);
          g.fillStyle='#2a2f3a';g.fillRect(x+20,Y0-120,120,100);g.fillStyle='rgba(160,210,240,.7)';g.fillRect(x+24,Y0-116,112,92);g.fillStyle='#5a3a2a';g.fillRect(x+160,Y0-110,50,110);
          g.fillStyle=['#e2361b','#3fa9ff','#3fe09a','#f3c623'][(k%4+4)%4];g.fillRect(x+16,Y0-160,200,28);ag.txt(g,['PIZZA','KEBAB','TABAC','GARAGE','CAFÉ','BOULANGERIE'][(k%6+6)%6],x+116,Y0-145,22,'#fff');
          for(var j=0;j<4;j++){g.fillStyle='rgba(255,255,255,.45)';g.fillRect(x+20+j*52,Y0-190,36,22)}}}
      else{for(i=-1;i<6;i++){k=Math.floor(cx*.75/260)+i;x=k*260-cx*.75;g.fillStyle='#2a2a3a';g.fillRect(x+30,Y0-60,90,60);g.fillStyle='#3a3a4a';g.fillRect(x+36,Y0-54,78,6);g.fillStyle='#555';g.beginPath();g.arc(x+190,Y0-30,26,0,7);g.fill();g.fillStyle='#e2361b';g.fillRect(x+180,Y0-140,6,110);if((t*2|0)%2)g.fillStyle='#ff4040';g.beginPath();g.arc(x+183,Y0-142,5,0,7);g.fill()}}
      /* sol */
      g.fillStyle=night?'#3b3a42':'#9a9aa0';g.fillRect(0,Y0,W,40);g.fillStyle=night?'#2e2d34':'#5b5d66';g.fillRect(0,Y0+40,W,H-Y0-40);
      g.strokeStyle=night?'rgba(255,255,255,.08)':'rgba(255,255,255,.5)';g.lineWidth=4;g.setLineDash([40,40]);g.lineDashOffset=cx;g.beginPath();g.moveTo(0,Y0+120);g.lineTo(W,Y0+120);g.stroke();g.setLineDash([]);
      g.fillStyle=night?'#4a4952':'#b8b8be';g.fillRect(0,Y0+36,W,6)}
    else if(th==='parc'){sky(g,'#6ab8ec','#e0f2fb');g.fillStyle='#7cb85c';g.fillRect(0,Y0-40,W,H);g.fillStyle='#8cc66a';for(i=-1;i<8;i++){x=i*200-(cx*.2)%200;g.beginPath();g.ellipse(x,Y0+10,170,90,0,Math.PI,0);g.fill()}
      for(i=-1;i<10;i++){k=Math.floor(cx*.7/130)+i;x=k*130-cx*.7+hash(k)*40;h=90+hash(k+9)*60;g.fillStyle='#6b4a2b';g.fillRect(x-7,Y0-h*.5,14,h*.5+6);g.fillStyle=['#3d8a3a','#4fa04a','#2f7a34'][(k%3+3)%3];g.beginPath();g.arc(x,Y0-h*.6,42,0,7);g.arc(x-26,Y0-h*.45,30,0,7);g.arc(x+26,Y0-h*.45,30,0,7);g.fill()}
      for(i=-1;i<5;i++){k=Math.floor(cx/420)+i;x=k*420-cx+200;g.fillStyle='#7a5a3a';g.fillRect(x,Y0+2,90,10);g.fillRect(x+6,Y0+12,6,18);g.fillRect(x+78,Y0+12,6,18);g.fillRect(x,Y0-16,90,8)}
      g.fillStyle='#5fae4a';g.fillRect(0,Y0+30,W,H);g.fillStyle='#d8c08a';g.fillRect(0,Y0+60,W,130);g.fillStyle='rgba(0,0,0,.06)';for(i=0;i<40;i++){x=((i*97-cx)%W+W)%W;g.fillRect(x,Y0+70+(i*37)%110,14,4)}}
    else if(th==='metro'){g.fillStyle='#d9d4c8';g.fillRect(0,0,W,Y0);g.fillStyle='#c8c2b4';for(var yy=0;yy<Y0;yy+=24)for(x=-((cx*.9)%48);x<W;x+=48){g.fillRect(x+((yy/24)%2)*24,yy,46,22)}
      for(i=-1;i<6;i++){k=Math.floor(cx*.9/300)+i;x=k*300-cx*.9;g.fillStyle=['#e2361b','#3fa9ff','#f3c623','#3fe09a'][(k%4+4)%4];g.fillRect(x+40,80,120,160);g.fillStyle='#fff';g.fillRect(x+50,90,100,60);ag.txt(g,['JEUX','SOLDES','CONCERT','FILM'][(k%4+4)%4],x+100,200,24,'#141210')}
      g.fillStyle='#1d5a9a';g.fillRect(0,20,W,26);for(i=-1;i<5;i++){x=Math.floor(cx/320+i)*320-cx;ag.txt(g,'STATION PIXEL',x+160,34,18,'#fff')}
      for(i=-1;i<6;i++){x=Math.floor(cx/260+i)*260-cx;g.fillStyle='#8a8478';g.fillRect(x,0,30,Y0+20)}
      g.fillStyle='#7c7870';g.fillRect(0,Y0,W,H);g.fillStyle='#f3c623';g.fillRect(0,H-26,W,10);g.fillStyle='#141210';for(x=-(cx%30);x<W;x+=30)g.fillRect(x,H-26,14,10);g.fillStyle='#222';g.fillRect(0,H-16,W,16)}
    else if(th==='port'){sky(g,'#f7a35c','#fde6b8');g.fillStyle='#ffdf8a';g.beginPath();g.arc(700,Y0-60,50,0,7);g.fill();g.fillStyle='#2a7fb0';g.fillRect(0,Y0-90,W,90);g.fillStyle='rgba(255,255,255,.3)';for(i=0;i<30;i++){x=((i*83-cx*.2+t*20)%W+W)%W;g.fillRect(x,Y0-80+(i*13)%70,20,2)}
      for(i=-1;i<8;i++){k=Math.floor(cx*.8/180)+i;x=k*180-cx*.8;var st2=1+((hash(k)*3)|0);for(j=0;j<st2;j++){g.fillStyle=['#c8322a','#2d7fd6','#2fae5a','#e07a1f','#7a3fb0'][((k+j)%5+5)%5];g.fillRect(x,Y0-40-j*46,170,46);g.fillStyle='rgba(0,0,0,.18)';for(var q=8;q<170;q+=14)g.fillRect(x+q,Y0-36-j*46,5,38)}}
      g.fillStyle='#8a6a48';g.fillRect(0,Y0,W,H);g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;for(yy=Y0+20;yy<H;yy+=24){g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke()}for(i=0;i<12;i++){x=((i*130-cx)%W+W)%W;g.beginPath();g.moveTo(x,Y0);g.lineTo(x,H);g.stroke()}}
  }

  /* ---------- partie ---------- */
  function newHero(){return {x:160,y:430,z:0,vz:0,vx:0,face:1,hp:100,st:'idle',ph:0,t:0,walk:0,combo:0,cbuf:0,inv:1,sp:0,hitList:[],down:0}}
  function fresh(C,lv){var D=DIF[C.mode]||DIF.normal;S={D:D,lv:lv,lives:D.lives,score:0,camX:0,lock:null,wave:0,trig:[],en:[],props:[],fx:[],shots:[],items:[],t:0,boss:null,done:false,msg:'',msgT:0,adv:0,ended:false};loadLevel()}
  function loadLevel(){var L=LV[S.lv];S.hero=newHero();S.camX=0;S.lock=null;S.wave=0;S.en=[];S.props=[];S.fx=[];S.shots=[];S.items=[];S.boss=null;S.done=false;S.end=L.waves.length*900+1500;
    S.trig=L.waves.map(function(w,i){return 500+i*900});S.trig.push(S.end-700);
    for(var i=0;i<6;i++){S.props.push({x:420+i*620+hash(i+S.lv*7)*200,y:Y0+40+hash(i*3)*140,hp:1,kind:hash(i+2)>.5?'caisse':'baril'})}
    S.msg=L.n;S.msgT=2.2}
  function spawn(type,x,y,o){var T=TYPES[type],D=S.D,e={type:type,T:T,x:x,y:y,z:0,vz:0,vx:0,face:-1,hp:Math.round(T.hp*D.hp*((o&&o.hpm)||1)),max:0,st:'walk',ph:0,t:0,walk:Math.random()*6,cool:.5+Math.random(),hits:0,stun:0,down:0,ko:0,side:Math.random()<.5?-1:1,col:(o&&o.col)||T.col,name:o&&o.name,spm:(o&&o.spm)||1};e.max=e.hp;S.en.push(e);return e}
  function startWave(i){var L=LV[S.lv];S.lock=S.camX;var list=i<L.waves.length?L.waves[i]:null;
    if(list){list.forEach(function(t,k){var left=k%2===1&&k>0;spawn(t,left?S.camX-60-k*40:S.camX+W+60+k*50,Y0+30+hash(k+i*5+S.lv)*150)})}
    else{var b=spawn('boss',S.camX+W+80,430,{name:L.boss,col:L.bc,hpm:L.bhp||1,spm:L.bsp||1});S.boss=b;spawn(L.waves[0][0],S.camX-80,380);S.msg=L.boss+' arrive !';S.msgT=2;sfx.play('count')}}
  function attackers(){return S.en.filter(function(e){return e.att}).length}
  function hurtHero(C,dmg,kx,big){var h=S.hero;if(h.inv>0||h.down>0||S.ended)return;h.hp-=dmg*S.D.dmg;h.st='hurt';h.ph=0;h.vx=kx;sfx.play('hurt');C.shake(big?9:5);fxHit(h.x,h.y,h.z+70,'#ff5a3a');
    if(big||h.hp<=0){h.down=1.1;h.vz=260;h.st='down'}if(h.hp<=0){h.hp=0;loseLife(C)}}
  function loseLife(C){S.lives--;var h=S.hero;if(S.lives<=0){S.ended=true;setTimeout(function(){gameOver(C)},1300);return}
    setTimeout(function(){if(S.ended)return;h.hp=100;h.inv=2.5;h.down=0;h.st='idle';S.msg='Encore '+S.lives+' vie'+(S.lives>1?'s':'');S.msgT=1.6;/* tout le monde valse */S.en.forEach(function(e){if(e.ko)return;e.vx=(e.x<h.x?-1:1)*300;e.down=1;e.vz=200})},1300)}
  function gameOver(C){C.stop();sfx.play('lose');var nb=C.best('pts-'+C.mode,S.score);C.over('Assommé…','Tu es tombé au niveau <b>'+(S.lv+1)+' · '+LV[S.lv].n+'</b>.<br>Score : <b>'+S.score+'</b>'+(nb?' · record !':'')+'<br>Ta progression est gardée : tu reprends à ce niveau.','Réessayer le niveau '+(S.lv+1),function(){fresh(C,S.lv);C.go()})}
  function fxHit(x,y,z,col,txt){S.fx.push({x:x,y:y,z:z,t:0,col:col||'#fff',txt:txt||['POW','BAM','PAF','BONK','CRAC'][(Math.random()*5)|0]})}
  function hitEnemy(C,e,dmg,kx,knock){if(e.ko||e.inv>0)return;
    /* les costauds et les chefs encaissent les petits coups sans s'arrêter, et finissent par riposter */
    if(e.T.armor&&!knock&&e.hp-dmg>0){e.hp-=dmg;e.rage=(e.rage||0)+1;fxHit(e.x,e.y,e.z+70,'#f3c623');sfx.play('hit');C.shake(2);S.hero.sp=Math.min(1,S.hero.sp+.05);e.flash=.12;if(e.rage>=(S.D.name==='Facile'?5:4)&&e.down<=0&&e.charge<=0){e.rage=0;e.st='wind';e.ph=e.T.wind*S.D.wind*.6;e.att=true}if(e.st!=='wind'){e.vx=kx*.25;e.stun=.08}return}
    e.rage=0;e.hp-=dmg;e.att=false;e.st='hurt';e.ph=0;e.vx=kx;e.hits++;var big=knock||(!e.T.armor&&e.hits>=3)||e.hp<=0;
    if(e.T.armor&&!knock&&e.hp>0){e.stun=.12;e.vx*=.3}else e.stun=.38;
    if(big){e.down=e.hp<=0?2:.9;e.vz=e.hp<=0?320:220;e.vx=kx*1.5;e.hits=0}
    fxHit(e.x,e.y,e.z+70,'#f3c623');sfx.play('hit');C.shake(knock?7:3);S.hero.sp=Math.min(1,S.hero.sp+.07);
    if(e.hp<=0){e.ko=1;e.koT=0;S.score+=e.T.pts;sfx.play('kill');if(e===S.boss){C.pop('K.O. !','#e2361b','90px');C.shake(14)}}}

  function heroStep(C,dt){var h=S.hero,k=C.keys;h.t+=dt;h.inv-=dt;
    if(h.down>0){h.down-=dt;h.vz-=900*dt;h.z=Math.max(0,h.z+h.vz*dt);h.x+=h.vx*dt;h.vx*=.92;if(h.down<=0&&h.hp>0){h.st='idle';h.inv=1.2}return}
    var busy=/atk|spin|hurt|jatk/.test(h.st);if(busy){h.ph+=dt;var dur={atk1:.26,atk2:.26,atk3:.42,hurt:.3,spin:.6,jatk:.4}[h.st]}
    /* déplacement */
    var mx=(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),my=(k.ArrowDown||k.KeyS?1:0)-(k.ArrowUp||k.KeyW?1:0);
    var air=h.z>0||h.vz>0;
    if(!busy||h.st==='jatk'){var sp=air?190:210;h.x+=mx*sp*dt;h.y+=my*130*dt;if(mx)h.face=mx;if(!air){h.st=mx||my?'walk':'idle';h.walk+=(mx||my)?dt*11:0}}
    if(h.st==='hurt'){h.x+=h.vx*dt;h.vx*=.88}
    if(air){h.vz-=1100*dt;h.z+=h.vz*dt;if(h.z<=0){h.z=0;h.vz=0;if(h.st==='jatk'||h.st==='jump')h.st='idle'}else if(h.st!=='jatk')h.st='jump'}
    h.y=cl(h.y,Y0+18,Y1);var lo=S.camX+30,hi=S.lock!=null?S.lock+W-30:S.camX+W-30;h.x=cl(h.x,lo,Math.min(hi,S.end+80));
    if(busy&&h.ph>=dur){if(h.st==='atk1'&&h.cbuf>0)attack(C,'atk2');else if(h.st==='atk2'&&h.cbuf>0)attack(C,'atk3');else if(h.st!=='jatk'){h.st='idle';h.combo=0}h.cbuf=0}
    /* coups qui touchent */
    if(/atk|spin|jatk/.test(h.st)){var ph=h.ph/dur,act=h.st==='spin'?ph>.1&&ph<.9:ph>.3&&ph<.75;
      if(act){S.en.forEach(function(e){if(e.ko||h.hitList.indexOf(e)>=0)return;var dx=e.x-h.x,dy=Math.abs(e.y-h.y),inF=h.st==='spin'?Math.abs(dx)<115:dx*h.face>-10&&dx*h.face<112;
          if(inF&&dy<30&&Math.abs(e.z-h.z)<70){h.hitList.push(e);var dmg={atk1:9,atk2:10,atk3:18,spin:16,jatk:16}[h.st],kx=(dx>=0?1:-1)*({atk3:320,spin:300,jatk:200}[h.st]||110);hitEnemy(C,e,dmg,kx,h.st==='atk3'||h.st==='spin'||h.st==='jatk')}});
        S.props.forEach(function(p){if(p.hp<=0||h.hitList.indexOf(p)>=0)return;var dx=p.x-h.x;if((h.st==='spin'?Math.abs(dx)<110:dx*h.face>-10&&dx*h.face<105)&&Math.abs(p.y-h.y)<34){h.hitList.push(p);p.hp=0;sfx.play('crash');fxHit(p.x,p.y,40,'#d9a066','CRAC');var r=Math.random();S.items.push({x:p.x,y:p.y,kind:r<.55?'pizza':r<.8?'piece':'soda',t:0})}})}}}
  function attack(C,st){var h=S.hero;h.st=st;h.ph=0;h.hitList=[];h.cbuf=0;sfx.play('shoot')}
  function press(C,code){var h=S.hero;if(!h||h.down>0||S.ended)return;
    if(code==='Space'||code==='KeyJ'){if(h.z>0){if(h.st!=='jatk'){h.st='jatk';h.ph=0;h.hitList=[];sfx.play('shoot')}return}
      if(h.st==='atk1'||h.st==='atk2'){h.cbuf=1;return}if(!/atk|spin|hurt/.test(h.st))attack(C,'atk1')}
    else if(code==='KeyK'||code==='ShiftLeft'||code==='ShiftRight'){if(h.z===0&&!/atk|spin|hurt/.test(h.st)){h.vz=430;h.z=.1;h.st='jump';sfx.play('ui')}}
    else if(code==='KeyL'||code==='KeyE'){if(!/spin|hurt/.test(h.st)&&h.z===0){if(h.sp>=1){h.sp=0;attack(C,'spin');C.pop('TOURNIQUET !','#f3c623','44px')}else if(h.hp>12){h.hp-=8;attack(C,'spin')}}}}

  function enemyStep(C,e,dt){var h=S.hero,T=e.T;e.t+=dt;
    if(e.ko){e.koT+=dt;e.vz-=900*dt;e.z=Math.max(0,e.z+e.vz*dt);e.x+=e.vx*dt;e.vx*=.9;return e.koT<2.4}
    if(e.down>0){e.down-=dt;e.vz-=900*dt;e.z=Math.max(0,e.z+e.vz*dt);e.x+=e.vx*dt;e.vx*=.9;if(e.down<=0){e.st='walk';e.cool=.6;e.inv=.55}return true}
    if(e.inv>0)e.inv-=dt;if(e.flash>0)e.flash-=dt;
    if(e.stun>0){e.stun-=dt;e.x+=e.vx*dt;e.vx*=.85;return true}
    var dx=h.x-e.x,dy=h.y-e.y,dist=Math.abs(dx);e.face=dx>=0?1:-1;
    if(e.charge>0){e.charge-=dt;e.x+=e.vx*dt;e.st='walk';e.walk+=dt*20;if(Math.abs(h.x-e.x)<60&&Math.abs(h.y-e.y)<30){hurtHero(C,T.dmg,e.face*380,true);e.charge=0;e.cool=1.2}if(e.charge<=0)e.cool=Math.max(e.cool,.8);return true}
    if(e.st==='wind'){e.ph+=dt;if(e.ph>=T.wind*S.D.wind){e.st=T.throw?'throw':e.type==='rapide'?'kick':e.type==='costaud'||e.type==='boss'?'slam':'punch';e.ph=0;
        if(T.throw){S.shots.push({x:e.x+e.face*20,y:e.y,z:80,vx:e.face*360,t:0,dmg:T.dmg});sfx.play('shoot')}
        else if(Math.abs(h.x-e.x)<T.reach*(T.big||1)&&Math.abs(h.y-e.y)<28&&h.z<50)hurtHero(C,T.dmg*(e.type==='boss'?1+(S.lv*.12):1),e.face*(T.big?320:160),T.big&&Math.random()<.5)}return true}
    if(/punch|kick|slam|throw|hurt/.test(e.st)){e.ph+=dt;if(e.ph>.35){e.st='walk';e.att=false;e.cool=(T.throw?1.6:.9)+Math.random()*.9*(S.D.wind)}return true}
    e.cool-=dt;
    /* charge du chef */
    if(T.boss&&e.cool<=0&&dist>220&&Math.abs(dy)<40&&Math.random()<dt*1.2){e.vx=e.face*520;e.charge=.55;S.msg='';return true}
    var canAtt=e.att||attackers()<S.D.max||T.boss;
    var tx,ty=h.y;if(T.throw){tx=h.x-e.face*300;ty=h.y}else if(canAtt){tx=h.x-e.face*(T.reach*.8);e.att=true}else{tx=h.x+e.side*230;ty=h.y+(e.side>0?-40:40)}
    var ddx=tx-e.x,ddy=ty-e.y,L=Math.hypot(ddx,ddy),sp=T.sp*e.spm;if(L>8){e.x+=ddx/L*sp*dt;e.y+=ddy/L*sp*.7*dt;e.st='walk';e.walk+=dt*10}else e.st='idle';
    e.y=cl(e.y,Y0+18,Y1);
    var inRange=T.throw?(Math.abs(dy)<26&&dist<520&&dist>150):(dist<T.reach*(T.big||1)&&Math.abs(dy)<24);
    if(inRange&&e.cool<=0&&(canAtt||T.throw)&&h.down<=0){e.st='wind';e.ph=0}
    return true}

  PP.arcade({id:'baton',
    setup:function(C){CC=C;var D=DIF[C.mode]||DIF.normal,sv=saved(C.mode);S=null;fresh(C,sv);
      C.keysText('<kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> ou <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> bouger · <kbd>Espace</kbd> ou <kbd>J</kbd> coup de bâton (appuie 3 fois pour l\'enchaînement) · <kbd>K</kbd> ou <kbd>Maj</kbd> sauter (+ coup en l\'air) · <kbd>L</kbd> ou <kbd>E</kbd> tourniquet (gratuit quand la jauge jaune est pleine)');
      var lvb='<div class="bt-lv">'+LV.map(function(l,i){return '<button type="button" data-bt-lv="'+i+'"'+(i>sv?' disabled':'')+(i===sv?' class="on"':'')+'>'+(i>sv?'🔒 ':'')+(i+1)+'. '+l.n+'</button>'}).join('')+'</div>';
      C.over('Coup de Bâton · '+D.name,'Avance dans la ville, des voyous veulent te taper : assomme-les avec ton bâton pour passer. Un chef t\'attend au bout de chaque niveau.<br>'+D.lives+' vies · niveau atteint : <b>'+(sv+1)+'</b>'+lvb,'Jouer le niveau '+(sv+1))},
    start:function(C){fresh(C,S?S.lv:saved(C.mode))},
    key:function(C,code,down){if(down&&C.running)press(C,code)},
    mouse:function(C,t){if(t==='down'&&C.running&&S)press(C,'Space')},
    step:function(C,dt){var h=S.hero;S.t+=dt;if(S.msgT>0)S.msgT-=dt;
      heroStep(C,dt);
      /* caméra : suit vers l'avant, jamais en arrière, bloquée pendant une vague */
      if(S.lock==null){var want=h.x-360;if(want>S.camX)S.camX+=Math.min(want-S.camX,400*dt);S.camX=Math.min(S.camX,S.end-W+200)}
      if(S.lock==null&&S.wave<S.trig.length&&h.x>S.trig[S.wave]){startWave(S.wave);S.wave++}
      S.en=S.en.filter(function(e){return enemyStep(C,e,dt)});
      if(S.lock!=null&&!S.en.some(function(e){return !e.ko})){S.lock=null;if(S.boss&&S.boss.ko&&!S.done){S.done=true;levelDone(C)}else{S.adv=2.5;sfx.play('go')}}
      if(S.adv>0)S.adv-=dt;
      /* bouteilles lancées */
      S.shots=S.shots.filter(function(s){s.t+=dt;s.x+=s.vx*dt;if(Math.abs(s.x-h.x)<24&&Math.abs(s.y-h.y)<26&&h.z<90){hurtHero(C,s.dmg,s.vx>0?160:-160);fxHit(s.x,s.y,70,'#3fae5a','CLING');return false}return s.t<2.5});
      /* objets */
      S.items=S.items.filter(function(it){it.t+=dt;if(Math.abs(it.x-h.x)<36&&Math.abs(it.y-h.y)<26){if(it.kind==='pizza'){h.hp=Math.min(100,h.hp+35);C.pop('+35 vie','#3fe09a','36px')}else if(it.kind==='soda'){h.sp=1;C.pop('Jauge pleine !','#f3c623','36px')}else{S.score+=300;C.pop('+300','#f3c623','36px')}sfx.play('pickup');return false}return it.t<20});
      S.fx=S.fx.filter(function(f){f.t+=dt;return f.t<.5});
      if(S.end&&h.x>S.end-60&&S.wave>=S.trig.length&&!S.done&&S.boss&&S.boss.ko){S.done=true;levelDone(C)}},
    draw:function(C){var g=C.g;if(!S){g.fillStyle='#141210';g.fillRect(0,0,W,H);return}var L=LV[S.lv],cx=S.camX,t=S.t;
      bg(g,cx,L.th,t);
      /* tout ce qui est au sol, trié par profondeur */
      var list=[];S.props.forEach(function(p){if(p.hp>0)list.push({y:p.y,k:'p',o:p})});S.items.forEach(function(i){list.push({y:i.y-1,k:'i',o:i})});S.en.forEach(function(e){list.push({y:e.y,k:'e',o:e})});list.push({y:S.hero.y,k:'h',o:S.hero});S.shots.forEach(function(s){list.push({y:s.y+1,k:'s',o:s})});
      list.sort(function(a,b){return a.y-b.y});
      list.forEach(function(it){var o=it.o,x=o.x-cx,s=sc(o.y);if(x<-150||x>W+150)return;
        g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,o.y,26*s*(o.T&&o.T.big||1),7*s,0,0,7);g.fill();
        if(it.k==='p'){g.save();g.translate(x,o.y);g.scale(s,s);if(o.kind==='caisse'){g.fillStyle='#b07a42';g.strokeStyle='#141210';g.lineWidth=3;g.fillRect(-26,-50,52,50);g.strokeRect(-26,-50,52,50);g.beginPath();g.moveTo(-26,-50);g.lineTo(26,0);g.moveTo(26,-50);g.lineTo(-26,0);g.stroke()}else{g.fillStyle='#3a6a9a';g.strokeStyle='#141210';g.lineWidth=3;ag.rr(g,-20,-56,40,56,6);g.fill();g.stroke();g.fillStyle='#2a4a6a';g.fillRect(-20,-40,40,6);g.fillRect(-20,-18,40,6)}g.restore()}
        else if(it.k==='i'){var by=o.y-8-Math.abs(Math.sin(o.t*4))*6;if(o.t>17&&(o.t*8|0)%2)return;g.save();g.translate(x,by);g.scale(s,s);if(o.kind==='pizza'){g.fillStyle='#f3c623';g.strokeStyle='#141210';g.lineWidth=2.5;g.beginPath();g.moveTo(-16,0);g.lineTo(16,0);g.lineTo(0,-26);g.closePath();g.fill();g.stroke();g.fillStyle='#e2361b';g.beginPath();g.arc(-3,-7,3,0,7);g.arc(5,-5,3,0,7);g.arc(1,-15,3,0,7);g.fill()}else if(o.kind==='soda'){g.fillStyle='#3fa9ff';g.strokeStyle='#141210';g.lineWidth=2.5;ag.rr(g,-8,-28,16,28,4);g.fill();g.stroke();g.fillStyle='#fff';g.fillRect(-8,-18,16,6)}else{g.fillStyle='#f3c623';g.strokeStyle='#141210';g.lineWidth=2.5;g.beginPath();g.arc(0,-14,12,0,7);g.fill();g.stroke();ag.txt(g,'€',0,-13,14,'#8a6a10')}g.restore()}
        else if(it.k==='s'){g.save();g.translate(x,o.y-o.z);g.rotate(o.t*14);g.fillStyle='#3fae5a';g.strokeStyle='#141210';g.lineWidth=2;ag.rr(g,-4,-10,8,20,3);g.fill();g.stroke();g.restore()}
        else if(it.k==='h'){var h=o;if(h.inv>0&&h.down<=0&&(t*12|0)%2)return;var st=h.st==='down'?'hurt':h.st,P=stickPose(pose(/atk|spin|jatk/.test(st)?'idle':st,0,t,h.walk),st,h.ph/({atk1:.26,atk2:.26,atk3:.42,spin:.6,jatk:.4}[st]||1));
          var rot=h.down>0?(h.z>0?-.9:-1.45)*1:0;if(h.st==='spin'){g.save();g.translate(x,h.y-h.z-60*s);g.scale(1,.35);g.strokeStyle='rgba(243,198,35,.7)';g.lineWidth=10;g.beginPath();g.arc(0,0,100*s,0,7);g.stroke();g.restore()}
          drawGuy(g,{x:x,y:h.y,z:h.z,s:s,face:h.st==='spin'?((h.ph*16|0)%2?1:-1):h.face,p:P,col:['#f1ece2','#2d5aa0','#e2361b'],hat:'bandana',tank:1,t:t,rot:rot,ko:false,skin:'#d9a47a'})}
        else{var e=o,T=e.T,big=T.big||1,st2=e.ko||e.down>0?'hurt':e.st,P2=pose(st2,e.ph/(T.wind||.5),t,e.walk);if(e.ko&&e.koT>1.8&&(t*12|0)%2)return;
          drawGuy(g,{x:x,y:e.y,z:e.z,s:s*big,face:e.face,p:P2,col:e.col,hat:T.hat,t:t,rot:(e.ko||e.down>0)&&e.z<20?-1.45:(e.ko||e.down>0)?-.8:0,ko:!!e.ko,angry:e.st==='wind',boss:T.boss});
          if(e.st==='wind'){ag.txt(g,'!',x,e.y-150*s*big,34,'#e2361b')}
          if(e.ko&&e.z<5){for(var i=0;i<3;i++){var a=t*5+i*2.1;ag.txt(g,'★',x+Math.cos(a)*24-e.face*30*s,e.y-36*s+Math.sin(a)*7,16,'#f3c623')}}
          if(!e.ko&&!T.boss&&e.hp<e.max){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x-22,e.y-150*s*big+14,44,5);g.fillStyle='#e2361b';g.fillRect(x-22,e.y-150*s*big+14,44*e.hp/e.max,5)}}});
      /* effets de coups */
      S.fx.forEach(function(f){var x=f.x-cx,y=f.y-f.z-f.t*40,k=1+f.t*1.6;g.save();g.globalAlpha=1-f.t*2;g.translate(x,y);g.rotate(-.15);g.fillStyle=f.col;g.strokeStyle='#141210';g.lineWidth=3;g.beginPath();for(var i=0;i<10;i++){var a=i/10*Math.PI*2,r=(i%2?14:28)*k;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();g.stroke();ag.txt(g,f.txt,0,1,14*k,'#141210');g.restore()});
      /* interface */
      var h=S.hero;g.fillStyle='rgba(20,18,16,.75)';ag.rr(g,12,12,300,58,12);g.fill();ag.txt(g,'TOI',38,30,18,'#f1ece2');g.fillStyle='#3a3530';g.fillRect(62,20,236,14);g.fillStyle=h.hp<30?'#e2361b':'#3fe09a';g.fillRect(62,20,236*h.hp/100,14);
      g.fillStyle='#3a3530';g.fillRect(62,40,236,8);g.fillStyle=h.sp>=1?((t*6|0)%2?'#fff':'#f3c623'):'#f3c623';g.fillRect(62,40,236*h.sp,8);
      ag.mono(g,'♥ '+S.lives+'   '+S.score+' pts',62,60,13,'#f1ece2','left');
      ag.mono(g,'Niveau '+(S.lv+1)+' · '+L.n+' · '+S.D.name,W-16,24,14,'#f1ece2','right');
      if(S.boss&&!S.boss.ko){var b=S.boss;g.fillStyle='rgba(20,18,16,.8)';ag.rr(g,W/2-230,H-46,460,34,10);g.fill();ag.txt(g,b.name,W/2-150,H-29,18,'#f3c623');g.fillStyle='#3a3530';g.fillRect(W/2-80,H-36,296,14);g.fillStyle='#e2361b';g.fillRect(W/2-80,H-36,296*Math.max(0,b.hp)/b.max,14)}
      if(S.adv>0&&(t*3|0)%2===0){ag.txt(g,'AVANCE  →',W-150,H/2-40,48,'#f3c623');}
      if(S.msgT>0){g.globalAlpha=Math.min(1,S.msgT);ag.txt(g,S.msg,W/2,170,56,'#f1ece2');g.globalAlpha=1}}});

  function levelDone(C){C.stop();sfx.play('win');var m=C.mode,nx=S.lv+1,last=nx>=LV.length;if(!last&&nx>saved(m))PP.store('baton-lv-'+m,nx);S.score+=500;C.best('pts-'+m,S.score);
    if(last){C.win();C.over('La ville est sauvée !','Tu as assommé tout le monde, chef compris, en '+S.D.name.toLowerCase()+'.<br>Score : <b>'+S.score+'</b>'+(m!=='difficile'?'<br>Essaie la difficulté au-dessus !':''),'Rejouer depuis le niveau 1',function(){fresh(C,0);C.go()})}
    else C.over('Niveau '+(S.lv+1)+' terminé !','Prochain niveau : <b>'+LV[nx].n+'</b> (sauvegardé).<br>Score : <b>'+S.score+'</b>','Niveau suivant',function(){var sc2=S.score,lv=S.lives;fresh(C,nx);S.score=sc2;S.lives=Math.min(S.D.lives,lv+1);C.go()})}

  var CSS=document.createElement('style');CSS.textContent='.bt-lv{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:10px auto 0;max-width:520px}.bt-lv button{font:600 12.5px var(--font,Inter),sans-serif;padding:7px 10px;border-radius:10px;border:2px solid #f1ece2;background:rgba(20,18,16,.55);color:#f1ece2;cursor:pointer}.bt-lv button.on{background:#f3c623;color:#141210;border-color:#f3c623}.bt-lv button:disabled{opacity:.35;cursor:default}';document.head.appendChild(CSS);
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-bt-lv]');if(!b||!CC)return;e.preventDefault();e.stopPropagation();var i=+b.dataset.btLv;fresh(CC,i);var bs=document.querySelectorAll('.bt-lv button');bs.forEach(function(x){x.classList.toggle('on',x===b)});var st=document.getElementById('baton-start');if(st)st.textContent='Jouer le niveau '+(i+1)},true);
})();
