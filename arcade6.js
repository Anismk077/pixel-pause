/* Pixel Pause — Envol (ton perso vole entre les cheminées), Potions (trie les couleurs dans les fioles),
   Serpents (mange les points, grandis et avale les plus petits). Les persos sont les vrais skins des joueurs. */
(function(){
  'use strict';
  var sfx=PP.sfx,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',W=960,H=540;
  function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
  function txt(g,s,x,y,size,col,al){g.font='400 '+size+'px Anton, Impact, sans-serif';g.fillStyle=col||CR;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,x,y)}
  function mono(g,s,x,y,size,col,al){g.font='700 '+size+'px "IBM Plex Mono", monospace';g.fillStyle=col||CR;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,x,y)}
  /* le visage 3D du perso, mis en cache */
  var FACES={};
  function me(){try{return PP.perso.get()}catch(e){return null}}
  function face(a,size){if(!a||!PP.perso||!PP.perso.portrait)return null;var k=JSON.stringify(a)+size;if(!FACES[k]){try{FACES[k]=PP.perso.portrait(a,size)}catch(e){FACES[k]=null}}return FACES[k]}
  function randPerso(){var O=PP.perso&&PP.perso.OPT,a={};if(!O)return null;Object.keys(O).forEach(function(k){a[k]=O[k][Math.floor(Math.random()*O[k].length)]});a.acc=Math.random()<.6?'aucun':a.acc;a.back='aucun';return a}
  function drawFace(g,f,x,y,r,fallback){g.save();g.beginPath();g.arc(x,y,r,0,7);g.closePath();g.fillStyle=fallback||'#d9a07a';g.fill();g.clip();if(f)g.drawImage(f,x-r*1.25,y-r*1.18,r*2.5,r*2.5);g.restore()}

  /* =================== ENVOL =================== */
  var F;
  function fReset(C){F={y:250,vy:0,t:0,pipes:[],next:1.2,score:0,dead:false,wait:true,ground:0,par:0,flapT:0,best:C.best('pts')||0,gap:C.mode==='hard'?132:168,spd:C.mode==='hard'?235:200,a:me(),parts:[]};F.face=face(F.a,96)}
  function flap(){if(!F||F.dead)return;F.wait=false;F.vy=-430;F.flapT=.25;sfx.play('ui')}
  function fDie(C){if(F.dead)return;F.dead=true;sfx.play('lose');C.shake(9);C.stop();var nb=C.best('pts',F.score);if(F.score>=25)C.win();
    var med=F.score>=50?'Médaille d\'or':F.score>=25?'Médaille d\'argent':F.score>=10?'Médaille de bronze':'Pas de médaille cette fois';
    setTimeout(function(){C.over('Crash !','<b>'+F.score+'</b> cheminée'+(F.score>1?'s':'')+' passée'+(F.score>1?'s':'')+' · '+med+(nb&&F.score?'<br><b>Nouveau record !</b>':'<br>Record : '+(C.best('pts')||0)),'Rejouer')},700)}
  PP._flap=function(){return F};
  PP.arcade({id:'flap',
    setup:function(C){fReset(C);C.keysText('<kbd>Espace</kbd>, clic ou tape l\'écran pour battre des ailes · passe entre les cheminées');C.over('Envol','Ton perso a des ailes. Tape pour monter, lâche pour descendre, et passe entre les cheminées.<br>Bronze à 10, argent à 25, or à 50.','Décoller')},
    start:function(C){fReset(C)},
    mouse:function(C,t){if(t==='down'&&C.running)flap()},
    key:function(C,code,down){if(down&&C.running&&/Space|ArrowUp|KeyW|KeyZ/.test(code))flap()},
    step:function(C,dt){var s=F;s.t+=dt;s.flapT=Math.max(0,s.flapT-dt);
      if(s.wait){s.y=250+Math.sin(s.t*3)*10;s.ground=(s.ground+s.spd*dt)%48;s.par+=dt*30;return}
      s.vy=Math.min(620,s.vy+1500*dt);s.y+=s.vy*dt;s.ground=(s.ground+s.spd*dt)%48;s.par+=dt*30;
      var sp=s.spd+Math.min(80,s.score*2);s.next-=dt;
      if(s.next<=0){s.next=290/sp*1.0+.55;var gy=110+Math.random()*(330-s.gap*.5);s.pipes.push({x:W+40,gy:gy,done:false})}
      s.pipes.forEach(function(p){p.x-=sp*dt;if(!p.done&&p.x+38<260){p.done=true;s.score++;sfx.play('pickup');if(s.score%10===0){C.pop(s.score+' !',RED,'60px')}}});
      s.pipes=s.pipes.filter(function(p){return p.x>-90});
      var r=20;if(s.y+r>H-60){s.y=H-60-r;return fDie(C)}if(s.y-r<0){s.y=r;s.vy=0}
      for(var i=0;i<s.pipes.length;i++){var p=s.pipes[i];if(260+r>p.x-38&&260-r<p.x+38&&(s.y-r<p.gy-s.gap/2||s.y+r>p.gy+s.gap/2))return fDie(C)}
      C.hud('<span>Score <b>'+s.score+'</b></span><span>Record <b>'+Math.max(s.best,s.score)+'</b></span>')},
    draw:function(C){var g=C.g;if(!F)fReset(C);var s=F;
      var sk=g.createLinearGradient(0,0,0,H);sk.addColorStop(0,'#f6efe1');sk.addColorStop(1,'#e8dcc4');g.fillStyle=sk;g.fillRect(0,0,W,H);
      g.fillStyle='rgba(226,54,27,.14)';g.beginPath();g.arc(760,120,60,0,7);g.fill();
      /* nuages et ville en parallaxe */
      g.fillStyle='#fff';for(var c=0;c<5;c++){var cx=((c*260-s.par*.6)%1300+1300)%1300-150,cy=60+c*37%110;g.beginPath();g.ellipse(cx,cy,48,16,0,0,7);g.ellipse(cx+30,cy-8,32,14,0,0,7);g.fill()}
      g.fillStyle='#cfc2a8';for(var b=0;b<16;b++){var bx=((b*84-s.par*1.4)%1344+1344)%1344-100,bh=60+(b*53)%110;g.fillRect(bx,H-60-bh,70,bh);}
      g.fillStyle='#b8a98c';for(var b2=0;b2<12;b2++){var bx2=((b2*120-s.par*2.6)%1440+1440)%1440-120,bh2=40+(b2*71)%80;g.fillRect(bx2,H-60-bh2,96,bh2)}
      /* cheminées */
      s.pipes.forEach(function(p){[[0,p.gy-s.gap/2],[p.gy+s.gap/2,H-60]].forEach(function(seg,i){var y0=seg[0],y1=seg[1];g.fillStyle=RED;g.fillRect(p.x-34,y0,68,y1-y0);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(p.x-26,y0,10,y1-y0);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(p.x+18,y0,16,y1-y0);
          for(var yy=y0+18;yy<y1;yy+=22){g.fillStyle='rgba(20,18,16,.12)';g.fillRect(p.x-34,yy,68,2)}
          var cy2=i?y0:y1-26;g.fillStyle=INK;g.fillRect(p.x-42,cy2,84,26);g.fillStyle='#2e2a26';g.fillRect(p.x-42,cy2+20,84,6);g.strokeStyle=INK;g.lineWidth=3;g.strokeRect(p.x-34,y0,68,y1-y0)})});
      /* sol */
      g.fillStyle=INK;g.fillRect(0,H-60,W,60);g.fillStyle=RED;g.fillRect(0,H-60,W,6);g.fillStyle='#2e2a26';for(var gx=-s.ground;gx<W;gx+=48)g.fillRect(gx,H-44,24,8);
      /* le perso : sa tête avec des ailes */
      var ang=s.wait?Math.sin(s.t*3)*.1:Math.max(-.5,Math.min(1.1,s.vy/600)),fl=Math.sin(s.t*(s.flapT>0?40:14));
      g.save();g.translate(260,s.y);g.rotate(ang);
      g.fillStyle='rgba(20,18,16,.15)';g.beginPath();g.ellipse(4,26,18,5,0,0,7);g.fill();
      [-1,1].forEach(function(sd){g.save();g.translate(-6,4);g.scale(1,sd);g.rotate(-.5+fl*.7);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.ellipse(-16,-6,20,9,-.4,0,7);g.fill();g.stroke();g.beginPath();g.moveTo(-28,-4);g.lineTo(-8,-4);g.stroke();g.restore()});
      g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.arc(0,0,22,0,7);g.stroke();drawFace(g,s.face,0,0,21,s.a&&s.a.skin);
      g.restore();
      if(!s.wait||C.running)txt(g,String(s.score),W/2,70,64,INK);
      if(s.wait&&C.running)mono(g,'TAPE POUR DÉCOLLER',W/2,H-110,16,INK)}
  });

  /* =================== POTIONS =================== */
  var COLS=['#e2361b','#3a6ad8','#f3c623','#3fbf6a','#7c46c8','#f08bb0','#ff8a1e','#4ad0d8','#8a5a32','#a8e05a','#17120e','#e8e2d4'];
  var LVL={easy:[4,2],mid:[7,2],hard:[10,2],exp:[12,2]},P;
  function pGen(C){var d=LVL[C.mode]||LVL.easy,nc=d[0],ne=d[1],segs=[];for(var c=0;c<nc;c++)for(var k=0;k<4;k++)segs.push(c);
    var tubes;for(var tries=0;tries<200;tries++){for(var i=segs.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=segs[i];segs[i]=segs[j];segs[j]=t}
      tubes=[];for(var c2=0;c2<nc;c2++)tubes.push(segs.slice(c2*4,c2*4+4));if(!tubes.some(function(t){return t.every(function(x){return x===t[0]})}))break}
    for(var e=0;e<ne;e++)tubes.push([]);return tubes}
  function pReset(C,keepLevel){var lv=keepLevel?P.level:1;P={tubes:pGen(C),sel:-1,anim:null,undo:[],moves:0,level:lv,extra:false,t:0,won:false,lift:[],shake:{},spark:[]};pLay()}
  function pLay(){var n=P.tubes.length,rows=n>8?2:1,per=Math.ceil(n/rows),tw=56,gap=Math.min(46,(W-80-per*tw)/(per-1||1)),th=4*38+22;P.pos=[];
    for(var i=0;i<n;i++){var r=Math.floor(i/per),cI=i%per,inRow=r===rows-1?n-per*(rows-1):per,rowW=inRow*tw+(inRow-1)*gap,x0=W/2-rowW/2;P.pos.push({x:x0+cI*(tw+gap),y:rows===2?(r?282:66):150,w:tw,h:th})}
    P.lift=P.tubes.map(function(){return 0})}
  function topRun(t){if(!t.length)return 0;var c=t[t.length-1],n=0;for(var i=t.length-1;i>=0&&t[i]===c;i--)n++;return n}
  function canPour(a,b){var A=P.tubes[a],B=P.tubes[b];if(a===b||!A.length||B.length>=4)return 0;if(B.length&&B[B.length-1]!==A[A.length-1])return 0;return Math.min(topRun(A),4-B.length)}
  function solved(){return P.tubes.every(function(t){return !t.length||(t.length===4&&t.every(function(x){return x===t[0]}))})}
  function pClick(C,x,y){if(P.anim||P.won)return;
    /* boutons du bas */
    var bs=pBtns();for(var b=0;b<bs.length;b++){var B=bs[b];if(x>B.x&&x<B.x+B.w&&y>B.y&&y<B.y+B.h){B.fn(C);sfx.play('ui');return}}
    var hit=pHit(x,y);
    if(hit<0){P.sel=-1;return}
    if(P.sel<0){if(P.tubes[hit].length&&!(P.tubes[hit].length===4&&P.tubes[hit].every(function(z){return z===P.tubes[hit][0]}))){P.sel=hit;sfx.play('tick')}return}
    if(hit===P.sel){P.sel=-1;return}
    var k=canPour(P.sel,hit);if(!k){P.shake[hit]=.35;sfx.play('lose');P.sel=-1;return}
    P.undo.push(JSON.stringify(P.tubes));P.anim={a:P.sel,b:hit,k:k,col:P.tubes[P.sel][P.tubes[P.sel].length-1],t:0};P.sel=-1;P.moves++;sfx.play('eat')}
  function pHit(x,y){var hit=-1;P.pos.forEach(function(p,i){if(x>p.x-8&&x<p.x+p.w+8&&y>p.y-30&&y<p.y+p.h+10)hit=i});return hit}
  function pBtnAt(x,y){var bs=pBtns();for(var b=0;b<bs.length;b++){var B=bs[b];if(x>B.x&&x<B.x+B.w&&y>B.y&&y<B.y+B.h)return b}return -1}
  /* survol : la fiole sous la souris se soulève un peu, et la main apparaît sur ce qui est cliquable */
  function pHover(C,x,y){if(!P)return;P.hov=pHit(x,y);P.hb=pBtnAt(x,y);var can=C.running&&!P.won&&(P.hb>=0||(P.hov>=0&&(P.sel>=0||P.tubes[P.hov].length)));C.cv.style.cursor=can?'pointer':'default'}
  function pBtns(){return [{x:W/2-250,y:H-58,w:150,h:40,l:'↶ ANNULER',fn:function(){if(P.undo.length){P.tubes=JSON.parse(P.undo.pop());P.moves++}}},
    {x:W/2-75,y:H-58,w:150,h:40,l:'⟳ RECOMMENCER',fn:function(C){if(P.undo.length){P.tubes=JSON.parse(P.undo[0]);P.undo=[];P.moves=0;if(P.extra){P.tubes.push([]);pLay()}}}},
    {x:W/2+100,y:H-58,w:150,h:40,l:P&&P.extra?'TUBE AJOUTÉ':'+ 1 TUBE',fn:function(){if(!P.extra){P.extra=true;P.tubes.push([]);pLay()}}}]}
  function drawTube(g,p,tube,i,ox,oy,ang,hide,add,addCol,done){var x=p.x+ox,y=p.y+oy,w=p.w,h=p.h,seg=38;
    g.save();g.translate(x+w/2,y);g.rotate(ang);g.translate(-w/2,0);
    /* forme du tube : col en haut, fond arrondi */
    function shape(){g.beginPath();g.moveTo(4,0);g.lineTo(4,h-w/2);g.arc(w/2,h-w/2,w/2-4,Math.PI,0,true);g.lineTo(w-4,0);g.closePath()}
    g.save();shape();g.clip();g.fillStyle='rgba(255,255,255,.55)';g.fillRect(0,0,w,h);
    var units=[];tube.forEach(function(c){units.push(c)});var full=units.length-hide;
    for(var u=0;u<units.length;u++){var amt=u<full?1:u<units.length?Math.max(0,1-(hide-(units.length-1-u))):0;if(u>=full){amt=Math.max(0,Math.min(1,(units.length-u)-hide))}
      if(amt<=0)continue;var yy=h-6-(u+amt)*seg;g.fillStyle=COLS[units[u]];g.fillRect(0,yy,w,seg*amt+1)}
    if(add>0){var base=units.length;g.fillStyle=COLS[addCol];g.fillRect(0,h-6-(base+add)*seg,w,seg*add+1)}
    var lvl=Math.max(0,units.length-hide)+add;if(lvl>0){var sy=h-6-lvl*seg;g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.moveTo(0,sy);for(var xx=0;xx<=w;xx+=6)g.lineTo(xx,sy+Math.sin(xx*.25+P.t*6)*1.6);g.lineTo(w,sy+5);g.lineTo(0,sy+5);g.fill()}
    g.fillStyle='rgba(255,255,255,.35)';g.fillRect(10,8,7,h-30);g.restore();
    shape();g.strokeStyle=INK;g.lineWidth=3.5;g.stroke();g.fillStyle=INK;g.fillRect(0,-6,w,9);
    if(done){g.fillStyle='#b8834a';rr(g,8,-20,w-16,18,4);g.fill();g.strokeStyle=INK;g.lineWidth=2.5;g.stroke()}
    g.restore()}
  PP.arcade({id:'potion',
    setup:function(C){pReset(C);C.keysText('Clique (ou tape) une fiole puis une autre pour verser · une couleur ne va que sur la même couleur ou dans une fiole vide · <kbd>Z</kbd> annule');
      C.over('Potions','Range les couleurs : chaque fiole doit finir remplie d\'une seule couleur.<br>On ne verse que sur la même couleur ou dans une fiole vide. Tu peux annuler, recommencer, ou ajouter une fiole vide une fois par niveau.','Jouer')},
    start:function(C){pReset(C,false)},
    mouse:function(C,t,x,y){if(t==='down'&&C.running)pClick(C,x,y);pHover(C,x,y)},
    key:function(C,code,down){if(down&&C.running&&code==='KeyZ'&&!P.anim&&P.undo.length){P.tubes=JSON.parse(P.undo.pop())}},
    step:function(C,dt){P.t+=dt;Object.keys(P.shake).forEach(function(k){P.shake[k]=Math.max(0,P.shake[k]-dt)});
      P.lift=P.lift.map(function(l,i){var tg=i===P.sel?1:(i===P.hov&&!P.anim&&P.sel<0&&P.tubes[i].length)?.25:0;return l+(tg-l)*Math.min(1,dt*14)});
      P.spark.forEach(function(s){s.t-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=300*dt});P.spark=P.spark.filter(function(s){return s.t>0});
      if(P.anim){var a=P.anim;a.t+=dt/.85;if(a.t>=1){var A=P.tubes[a.a],B=P.tubes[a.b];for(var k=0;k<a.k;k++)B.push(A.pop());P.anim=null;
          if(B.length===4&&B.every(function(z){return z===B[0]})){sfx.play('win');var p=P.pos[a.b];for(var s=0;s<18;s++)P.spark.push({x:p.x+p.w/2,y:p.y,vx:(Math.random()-.5)*240,vy:-Math.random()*240,t:.8,c:COLS[B[0]]})}
          if(solved()){P.won=true;C.stop();sfx.play('win');var key=C.mode,nb=C.best('lvl-'+key,P.level);C.pop('BRAVO !',RED,'70px');if(P.level>=5)C.win();
            setTimeout(function(){C.over('Niveau '+P.level+' réussi','En '+P.moves+' coups.'+(nb?'<br><b>Record de niveaux !</b>':''),'Niveau suivant',function(){var lv=P.level+1;pReset(C,true);P.level=lv;C.go()})},900)}}}
      C.hud('<span>Niveau <b>'+P.level+'</b></span><span>Coups <b>'+P.moves+'</b></span><span>'+({easy:'Facile',mid:'Moyen',hard:'Difficile',exp:'Expert'}[C.mode]||'')+'</span>')},
    draw:function(C){var g=C.g;if(!P)pReset(C);
      /* fond : mur clair dégradé avec une lueur douce derrière les fioles, et des étagères en bois */
      var bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f6efe2');bg.addColorStop(1,'#e4d6bb');g.fillStyle=bg;g.fillRect(0,0,W,H);
      var gl=g.createRadialGradient(W/2,H*.45,40,W/2,H*.45,W*.6);gl.addColorStop(0,'rgba(255,255,255,.55)');gl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gl;g.fillRect(0,0,W,H);
      function shelf(y){g.fillStyle='rgba(20,18,16,.10)';g.fillRect(40,y+14,W-80,8);g.fillStyle='#b8834a';g.fillRect(40,y,W-80,14);g.fillStyle='#d19a5e';g.fillRect(40,y,W-80,4);g.strokeStyle=INK;g.lineWidth=2.5;g.strokeRect(40,y,W-80,14)}
      shelf(P.pos[0].y+P.pos[0].h+4);if(P.pos.length>8)shelf(P.pos[P.pos.length-1].y+P.pos[0].h+4);
      var a=P.anim;
      /* fioles où l'on peut verser : petite flèche au-dessus */
      if(P.sel>=0&&!a)P.pos.forEach(function(p,i){if(i===P.sel||!canPour(P.sel,i))return;var bob=Math.sin(P.t*6)*3,cx=p.x+p.w/2,cy=p.y-26+bob;g.fillStyle=COLS[P.tubes[P.sel][P.tubes[P.sel].length-1]];g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.moveTo(cx-9,cy-8);g.lineTo(cx+9,cy-8);g.lineTo(cx,cy+4);g.closePath();g.fill();g.stroke()});
      P.tubes.forEach(function(t,i){if(a&&i===a.a)return;var p=P.pos[i],sh=P.shake[i]?Math.sin(P.t*60)*6*P.shake[i]/.35:0,lf=-P.lift[i]*22;
        var add=0;if(a&&i===a.b){var pp=Math.max(0,Math.min(1,(a.t-.3)/.42));add=a.k*pp}
        var done=t.length===4&&t.every(function(z){return z===t[0]})&&!(a&&i===a.b);
        if(i===P.sel){var hg=g.createRadialGradient(p.x+p.w/2,p.y+p.h/2+lf,10,p.x+p.w/2,p.y+p.h/2+lf,p.h*.75);hg.addColorStop(0,'rgba(243,198,35,.45)');hg.addColorStop(1,'rgba(243,198,35,0)');g.fillStyle=hg;g.fillRect(p.x-p.h,p.y-p.h*.4+lf,p.w+p.h*2,p.h*1.8)}
        if(done){g.fillStyle='rgba(63,191,106,.18)';g.beginPath();g.ellipse(p.x+p.w/2,p.y+p.h+2,p.w*.8,8,0,0,7);g.fill()}
        drawTube(g,p,t,i,sh,lf,0,0,add,a?a.col:0,done)});
      if(a){var A=P.pos[a.a],B=P.pos[a.b],e=function(u){return u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2};
        var mv=a.t<.3?e(a.t/.3):a.t>.75?1-e((a.t-.75)/.25):1,dir=B.x>A.x?1:-1,tx=B.x-A.x-dir*(A.w*.85),ty=B.y-A.y-A.h*.55;
        var ang=dir*mv*1.25,pp2=Math.max(0,Math.min(1,(a.t-.3)/.42)),ox=tx*mv,oy=ty*mv-22*(1-mv);
        if(pp2>0&&pp2<1){var lipx=A.x+ox+A.w/2+dir*Math.cos(ang)*A.w*.45,lipy=A.y+oy+Math.sin(Math.abs(ang))*A.w*.3+4;g.strokeStyle=COLS[a.col];g.lineWidth=7;g.lineCap='round';g.beginPath();g.moveTo(lipx,lipy);g.quadraticCurveTo(B.x+B.w/2,lipy-6,B.x+B.w/2,B.y+B.h-6-(P.tubes[a.b].length+a.k*pp2)*38);g.stroke()}
        drawTube(g,A,P.tubes[a.a],a.a,ox,oy,ang,a.k*pp2,0,0,false)}
      P.spark.forEach(function(s){g.fillStyle=s.c;g.globalAlpha=Math.min(1,s.t*2);g.fillRect(s.x,s.y,6,6);g.globalAlpha=1});
      pBtns().forEach(function(b,i){var off=(i===0&&!P.undo.length)||(i===1&&!P.undo.length)||(i===2&&P.extra),hv=P.hb===i&&!off&&C.running,yy=b.y-(hv?2:0);
        g.fillStyle='rgba(20,18,16,.18)';rr(g,b.x+3,b.y+4,b.w,b.h,8);g.fill();
        g.fillStyle=off?'#8d867c':hv?RED:INK;rr(g,b.x,yy,b.w,b.h,8);g.fill();mono(g,b.l,b.x+b.w/2,yy+b.h/2,12,CR)});
      txt(g,'NIVEAU '+P.level,W/2,P.pos.length>8?26:80,26,INK)}
  });

  /* =================== SERPENTS =================== */
  var R0=1500,Z,PALS=[['#e2361b','#ff8a6b'],['#3a6ad8','#8fb4ff'],['#f3c623','#fff1a0'],['#3fbf6a','#a6f0b8'],['#7c46c8','#c9a8ff'],['#f08bb0','#ffd2e2'],['#ff8a1e','#ffc78f'],['#4ad0d8','#b9f4f7']];
  var NAMES=['Zizou','Nala','Kenzo','Mimi','Rayan','Lou','Sacha','Inès','Bilal','Jade','Tom','Yanis','Léa','Momo','Nour','Max'];
  function sRad(s){return Math.min(30,9+Math.sqrt(s.m)*1.1)}
  function sLen(s){return Math.floor(14+s.m*.55)}
  function mkSnake(bot,a,name){var ang=Math.random()*7,d=bot?450+Math.random()*(R0*.85-450):0,x=Math.cos(ang)*d,y=Math.sin(ang)*d,pal=PALS[Math.floor(Math.random()*PALS.length)];
    if(!bot&&a)pal=[a.topCol||'#e2361b',a.hairCol||'#17120e'];
    var s={x:x,y:y,ang:Math.random()*7,m:bot?10+Math.random()*50:10,pts:[],bot:bot,a:a,name:name,pal:pal,alive:true,boost:false,think:0,tgt:null,drop:0};
    for(var i=0;i<20;i++)s.pts.push({x:x-Math.cos(s.ang)*i*6,y:y-Math.sin(s.ang)*i*6});s.face=face(a,64);return s}
  function food(x,y,v,c){Z.food.push({x:x,y:y,v:v||1,r:3+Math.min(6,(v||1)*1.4),c:c||PALS[Math.floor(Math.random()*PALS.length)][Math.random()<.5?0:1],ph:Math.random()*7})}
  function zReset(C){var a=me();Z={snakes:[],food:[],t:0,cam:{x:0,y:0,z:1},over:false,kills:0,best:0};for(var i=0;i<700;i++){var an=Math.random()*7,d=Math.sqrt(Math.random())*R0;food(Math.cos(an)*d,Math.sin(an)*d)}
    Z.me=mkSnake(false,a,'Toi');Z.me.x=0;Z.me.y=0;Z.me.pts.forEach(function(p,i){p.x=-i*6;p.y=0});Z.snakes.push(Z.me);
    var nb=C.mode==='big'?20:13;for(var j=0;j<nb;j++)Z.snakes.push(mkSnake(true,randPerso(),NAMES[j%NAMES.length]));Z.mx=W/2+100;Z.my=H/2}
  function kill(s,by){if(!s.alive)return;s.alive=false;for(var i=0;i<s.pts.length;i+=2){var p=s.pts[i];food(p.x+(Math.random()-.5)*10,p.y+(Math.random()-.5)*10,Math.max(1,s.m/s.pts.length*1.6),s.pal[i%4<2?0:1])}
    if(by&&by.alive){by.m+=s.m*.25;if(by===Z.me){Z.kills++;sfx.play('win')}}}
  function stepSnake(s,dt){var rad=sRad(s),turn=(3.6-Math.min(1.6,s.m/300))*dt,d=s.tgtAng-s.ang;d=Math.atan2(Math.sin(d),Math.cos(d));s.ang+=Math.max(-turn,Math.min(turn,d));
    var sp=(s.boost&&s.m>12?330:170)*dt;if(s.boost&&s.m>12){s.m-=7*dt;s.drop+=dt;if(s.drop>.12){s.drop=0;var tl=s.pts[s.pts.length-1];food(tl.x,tl.y,.8,s.pal[0])}}
    s.x+=Math.cos(s.ang)*sp;s.y+=Math.sin(s.ang)*sp;
    var h=s.pts[0],dx=s.x-h.x,dy=s.y-h.y,dd=Math.hypot(dx,dy),gap=Math.max(5,rad*.5);
    while(dd>=gap){h={x:h.x+dx/dd*gap,y:h.y+dy/dd*gap};s.pts.unshift(h);dx=s.x-h.x;dy=s.y-h.y;dd=Math.hypot(dx,dy)}
    var L=sLen(s);while(s.pts.length>L)s.pts.pop();
    if(Math.hypot(s.x,s.y)>R0-rad)kill(s,null)}
  function botThink(s,dt){s.think-=dt;var rad=sRad(s);
    /* danger devant : un autre corps tout proche ou le bord → on tourne */
    var ax=s.x+Math.cos(s.ang)*(rad*3+40),ay=s.y+Math.sin(s.ang)*(rad*3+40),danger=Math.hypot(ax,ay)>R0-60;
    if(!danger)for(var i=0;i<Z.snakes.length&&!danger;i++){var o=Z.snakes[i];if(o===s||!o.alive)continue;if(Math.abs(o.x-s.x)>400||Math.abs(o.y-s.y)>400)continue;var or=sRad(o);for(var j=0;j<o.pts.length;j+=3){var p=o.pts[j];if(Math.hypot(p.x-ax,p.y-ay)<or+rad+18&&!(s.m>o.m*1.6)){danger=true;break}}}
    if(danger){s.tgtAng=s.ang+(s.turnDir||1)*1.6;s.boost=false;if(s.think<=0){s.turnDir=Math.random()<.5?1:-1;s.think=.4}return}
    if(s.think>0)return;s.think=.25+Math.random()*.3;
    /* chasse un plus petit, sinon la bouffe la plus proche */
    var best=null,bd=1e9;Z.snakes.forEach(function(o){if(o===s||!o.alive||!(s.m>o.m*1.6))return;var d=Math.hypot(o.x-s.x,o.y-s.y);if(d<300&&d<bd){bd=d;best=o}});
    if(best){s.tgtAng=Math.atan2(best.y-s.y,best.x-s.x);s.boost=bd<200&&s.m>40;return}
    s.boost=false;bd=1e9;var bf=null;for(var k=0;k<Z.food.length;k+=2){var f=Z.food[k],d2=(f.x-s.x)*(f.x-s.x)+(f.y-s.y)*(f.y-s.y);if(d2<bd){bd=d2;bf=f}}
    if(bf)s.tgtAng=Math.atan2(bf.y-s.y,bf.x-s.x)+(Math.random()-.5)*.3}
  PP.arcade({id:'snakeio',
    setup:function(C){zReset(C);C.keysText('La souris (ou le doigt) dirige ta tête · clic maintenu ou <kbd>Espace</kbd> pour foncer (ça coûte de la taille) · mange les points, et avale les serpents bien plus petits que toi');
      C.over('Serpents','Mange les points lumineux pour grandir. Si tu touches le corps d\'un autre serpent, tu perds… sauf s\'il est bien plus petit que toi : là, c\'est toi qui le manges.<br>Les têtes sont les persos des joueurs : la tienne, c\'est ton perso.','Jouer')},
    start:function(C){zReset(C)},
    mouse:function(C,t,x,y){Z.mx=x;Z.my=y;if(t==='down')Z.press=true;if(t==='up')Z.press=false},
    step:function(C,dt){Z.t+=dt;var m=Z.me;
      if(m.alive){var k=C.keys;m.tgtAng=Math.atan2(Z.my-H/2,Z.mx-W/2);if(k.ArrowLeft||k.KeyA||k.KeyQ)m.tgtAng=m.ang-1;if(k.ArrowRight||k.KeyD)m.tgtAng=m.ang+1;m.boost=!!(Z.press||k.Space)}
      Z.snakes.forEach(function(s){if(!s.alive)return;if(s.bot)botThink(s,dt);stepSnake(s,dt)});
      /* manger */
      Z.snakes.forEach(function(s){if(!s.alive)return;var r=sRad(s)+8;for(var i=Z.food.length-1;i>=0;i--){var f=Z.food[i];if(Math.abs(f.x-s.x)<r+6&&Math.abs(f.y-s.y)<r+6&&Math.hypot(f.x-s.x,f.y-s.y)<r+f.r){s.m+=f.v;Z.food.splice(i,1);if(s===Z.me&&Math.random()<.3)sfx.play('tick')}}});
      /* collisions tête contre corps */
      Z.snakes.forEach(function(s){if(!s.alive)return;var rs=sRad(s);Z.snakes.forEach(function(o){if(o===s||!o.alive||!s.alive)return;if(Z.t<3&&(s===Z.me||o===Z.me))return;if(Math.abs(o.x-s.x)>600||Math.abs(o.y-s.y)>600)return;var ro=sRad(o);
        for(var j=0;j<o.pts.length;j+=2){var p=o.pts[j];if(Math.hypot(p.x-s.x,p.y-s.y)<ro+rs*.6){if(s.m>o.m*1.6)kill(o,s);else kill(s,o);break}}})});
      Z.snakes=Z.snakes.filter(function(s){return s.alive||s===Z.me});
      var nb=(C.mode==='big'?20:13)+1;while(Z.snakes.length<nb)Z.snakes.push(mkSnake(true,randPerso(),NAMES[Math.floor(Math.random()*NAMES.length)]));
      while(Z.food.length<650){var an=Math.random()*7,d=Math.sqrt(Math.random())*R0;food(Math.cos(an)*d,Math.sin(an)*d)}
      Z.best=Math.max(Z.best,Math.floor(m.m));
      if(!m.alive&&!Z.over){Z.over=true;sfx.play('lose');C.shake(10);C.stop();var sc=Z.best,nb2=C.best('m',sc);if(sc>=300)C.win();
        setTimeout(function(){C.over('Mangé !','Taille max : <b>'+sc+'</b> · serpents avalés : <b>'+Z.kills+'</b>'+(nb2?'<br><b>Nouveau record !</b>':'<br>Record : '+C.best('m')),'Rejouer')},900)}
      var rank=Z.snakes.filter(function(s){return s.alive}).sort(function(a,b){return b.m-a.m});Z.rank=rank;
      C.hud('<span>Taille <b>'+Math.floor(m.m)+'</b></span><span>Avalés <b>'+Z.kills+'</b></span><span>Place <b>'+(rank.indexOf(m)+1||'-')+'/'+rank.length+'</b></span>')},
    draw:function(C){var g=C.g;if(!Z)zReset(C);var m=Z.me,cam=Z.cam,tz=Math.max(.55,1.05-sRad(m)/80);cam.x+=(m.x-cam.x)*.2;cam.y+=(m.y-cam.y)*.2;cam.z+=(tz-cam.z)*.05;
      g.fillStyle='#17151f';g.fillRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.scale(cam.z,cam.z);g.translate(-cam.x,-cam.y);
      /* sol : grille de points et bord */
      var x0=cam.x-W/2/cam.z,x1=cam.x+W/2/cam.z,y0=cam.y-H/2/cam.z,y1=cam.y+H/2/cam.z;g.fillStyle='#2a2735';
      for(var gx=Math.floor(x0/40)*40;gx<x1;gx+=40)for(var gy=Math.floor(y0/40)*40;gy<y1;gy+=40)g.fillRect(gx,gy,3,3);
      g.strokeStyle=RED;g.lineWidth=8;g.beginPath();g.arc(0,0,R0,0,7);g.stroke();g.fillStyle='rgba(226,54,27,.08)';g.beginPath();g.rect(x0,y0,x1-x0,y1-y0);g.moveTo(R0,0);g.arc(0,0,R0,0,Math.PI*2,true);g.fill('evenodd');
      Z.food.forEach(function(f){if(f.x<x0-10||f.x>x1+10||f.y<y0-10||f.y>y1+10)return;var pu=1+Math.sin(Z.t*4+f.ph)*.18;g.fillStyle=f.c;g.globalAlpha=.25;g.beginPath();g.arc(f.x,f.y,f.r*2*pu,0,7);g.fill();g.globalAlpha=1;g.beginPath();g.arc(f.x,f.y,f.r*pu,0,7);g.fill()});
      Z.snakes.forEach(function(s){if(!s.alive)return;var r=sRad(s);
        for(var i=s.pts.length-1;i>=0;i--){var p=s.pts[i];if(p.x<x0-40||p.x>x1+40||p.y<y0-40||p.y>y1+40)continue;g.fillStyle=(Math.floor(i/3)%2)?s.pal[1]:s.pal[0];g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,r,0,7);g.fill();if(i%3===0)g.stroke()}
        if(s.boost){g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=4;g.beginPath();g.arc(s.x,s.y,r*1.5,0,7);g.stroke()}
        g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.arc(s.x,s.y,r*1.3,0,7);g.stroke();drawFace(g,s.face,s.x,s.y,r*1.28,s.a&&s.a.skin);
        mono(g,s.name,s.x,s.y-r*1.3-12,12,s===m?YEL:'rgba(241,236,226,.8)')});
      g.restore();
      /* mini-carte et classement */
      var mx=W-80,my=H-80,mr=62;g.fillStyle='rgba(20,18,16,.7)';g.beginPath();g.arc(mx,my,mr,0,7);g.fill();g.strokeStyle=CR;g.lineWidth=2;g.stroke();
      Z.snakes.forEach(function(s){if(!s.alive)return;g.fillStyle=s===m?YEL:s.pal[0];var sz=s===m?4:Math.min(4,1.5+s.m/150);g.fillRect(mx+s.x/R0*mr-sz/2,my+s.y/R0*mr-sz/2,sz,sz)});
      g.fillStyle='rgba(20,18,16,.7)';g.fillRect(W-200,10,190,24+Math.min(8,(Z.rank||[]).length)*18);mono(g,'CLASSEMENT',W-105,22,11,YEL);
      (Z.rank||[]).slice(0,8).forEach(function(s,i){mono(g,(i+1)+'. '+s.name,W-190,42+i*18,11,s===m?YEL:CR,'left');mono(g,String(Math.floor(s.m)),W-18,42+i*18,11,s===m?YEL:CR,'right')})}
  });
})();
