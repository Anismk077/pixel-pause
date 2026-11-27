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

  /* =================== POTIONS (v24 : rapide, net, sans attente) ===================
     - un versement dure 0,3 s, et on peut enchaîner sans attendre (un clic pendant un versement le termine aussitôt)
     - touches 1 à 9 / 0 pour choisir les fioles, Z annule, H donne un indice, R recommence
     - fioles en verre avec reflets, bouchon et petite étincelle quand une couleur est finie, étoiles selon les coups */
  var COLS=['#e2361b','#3a6ad8','#f3c623','#3fbf6a','#7c46c8','#f08bb0','#ff8a1e','#4ad0d8','#8a5a32','#a8e05a','#2b2622','#e8e2d4'];
  var LVL={easy:[4,2],mid:[7,2],hard:[10,2],exp:[12,2],bot:[5,2],online:[5,2]},P,SEG=34,POUR=.3;
  function pGen(C){var d=LVL[C.mode]||LVL.easy,nc=d[0],ne=d[1],segs=[];for(var c=0;c<nc;c++)for(var k=0;k<4;k++)segs.push(c);
    var tubes;for(var tries=0;tries<200;tries++){for(var i=segs.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=segs[i];segs[i]=segs[j];segs[j]=t}
      tubes=[];for(var c2=0;c2<nc;c2++)tubes.push(segs.slice(c2*4,c2*4+4));if(!tubes.some(function(t){return t.every(function(x){return x===t[0]})}))break}
    for(var e=0;e<ne;e++)tubes.push([]);return tubes}
  function pReset(C,keepLevel){var lv=keepLevel?P.level:1;P={tubes:pGen(C),sel:-1,kb:1,cur:0,anim:null,undo:[],moves:0,level:lv,extra:false,t:0,won:false,lift:[],shake:{},spark:[],hint:null,done:{},flash:{},nc:(LVL[C.mode]||LVL.easy)[0],hid:null,mask:null,startX:null};P.start=JSON.stringify(P.tubes);pLay()}
  function pLay(){var n=P.tubes.length,rows=n>8?2:1,per=Math.ceil(n/rows),tw=54,gap=Math.min(48,(W-90-per*tw)/(per-1||1)),th=4*SEG+20;P.pos=[];
    for(var i=0;i<n;i++){var r=Math.floor(i/per),cI=i%per,inRow=r===rows-1?n-per*(rows-1):per,rowW=inRow*tw+(inRow-1)*gap,x0=W/2-rowW/2;P.pos.push({x:x0+cI*(tw+gap),y:rows===2?(r?268:72):150,w:tw,h:th})}
    P.lift=P.tubes.map(function(){return 0})}
  function full(t){return t.length===4&&t.every(function(z){return z===t[0]})}
  function topRun(t,h){if(!t.length)return 0;var c=t[t.length-1],n=0;for(var i=t.length-1;i>=(h||0)&&t[i]===c;i--)n++;return Math.max(1,n)}
  /* v68 : couches mystères (P.hid[i] = nombre de couches cachées au fond de la fiole i) et fiole masquée (P.mask) */
  function hidOf(i){return P&&P.hid?P.hid[i]||0:0}
  function masked(i){return !!(P&&P.mask&&P.mask.on&&P.mask.i===i)}
  function canPour(a,b){var A=P.tubes[a],B=P.tubes[b];if(a===b||!A.length||B.length>=4||masked(a)||masked(b))return 0;if(B.length&&B[B.length-1]!==A[A.length-1])return 0;return Math.min(topRun(A,hidOf(a)),4-B.length)}
  function solved(){return P.tubes.every(function(t){return !t.length||full(t)})}
  /* un coup « utile » : pas de fiole déjà finie, pas de couleur unie versée dans une fiole vide */
  function useful(a,b){var A=P.tubes[a],B=P.tubes[b];if(!canPour(a,b)||full(A))return false;if(!B.length&&topRun(A,hidOf(a))===A.length&&!hidOf(a))return false;return true}
  function findHint(){var best=null,bs=-1;for(var a=0;a<P.tubes.length;a++)for(var b=0;b<P.tubes.length;b++){if(!useful(a,b))continue;var A=P.tubes[a],B=P.tubes[b],k=canPour(a,b),s=(B.length?10:0)+(B.length+k===4?20:0)+(k===topRun(A,hidOf(a))?5:0)+(A.length===k?8:0)+(hidOf(a)&&A.length-k<=hidOf(a)?6:0);if(s>bs){bs=s;best=[a,b]}}return best}
  /* fin du versement : on applique le coup (appelé à la fin de l'animation, ou tout de suite si on clique entre-temps) */
  function pFinish(C){var a=P.anim;if(!a)return;P.anim=null;var A=P.tubes[a.a],B=P.tubes[a.b];for(var k=0;k<a.k;k++)B.push(A.pop());
    /* la couche du dessous devient visible quand celle du dessus est partie */
    if(P.hid&&P.hid[a.a]>0&&P.hid[a.a]>A.length-1){P.hid[a.a]=Math.max(0,A.length-1);P.flash[a.a]=.35;sfx.play('tick')}
    if(P.hid&&full(B))P.hid[a.b]=0;
    if(P.mask&&P.mask.on&&full(B)&&B[0]===P.mask.col){P.mask.on=false;P.flash[P.mask.i]=.8;C.pop('FIOLE RÉVÉLÉE !',COLS[P.mask.col],'52px');sfx.play('win');C.shake(4)}
    if(full(B)&&!P.done[a.b]){P.done[a.b]=1;P.flash[a.b]=.5;sfx.play('pickup');var p=P.pos[a.b];for(var s=0;s<14;s++)P.spark.push({x:p.x+p.w/2+(Math.random()-.5)*p.w,y:p.y-4,vx:(Math.random()-.5)*260,vy:-60-Math.random()*220,t:.55,c:COLS[B[0]]})}
    if(C.mode==='online')C.net.relay({t:'pd-st',tb:P.tubes});
    if(solved()){pWin(C);return}
    /* v34 : si on tourne en rond (même position vue 3 fois) ou s'il n'y a plus aucun coup utile, écran « Bloqué » */
    P.seen=P.seen||{};var key=JSON.stringify(P.tubes);P.seen[key]=(P.seen[key]||0)+1;
    if(P.seen[key]>=3)pStuck(C,'Tu refais les mêmes coups en boucle : cette position est revenue 3 fois.');else if(!findHint())pStuck(C,'Il ne reste plus aucun coup utile.')}
  var CP=null;
  function pStuck(C,why){CP=C;P.stuck=true;P.sel=-1;P.hint=null;C.stop();sfx.play('lose');C.shake(6);
    setTimeout(function(){if(!P||P.won)return;C.over('Bloqué !',why+'<br>Recommence le niveau'+(P.extra?'.':', ou ajoute un tube vide pour t\'en sortir.<br><button type="button" data-pot-tube style="margin-top:12px;font:700 13px \'IBM Plex Mono\',monospace;padding:10px 16px;border:2px solid #f1ece2;background:transparent;color:#f1ece2;cursor:pointer">+ 1 TUBE ET CONTINUER</button>'),'Recommencer',function(){pRestart();P.seen={};C.go()})},350)}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pot-tube]');if(!b||!CP||!P||PP.cur()!=='potion')return;e.preventDefault();if(!P.extra){P.extra=true;P.tubes.push([]);pLay()}P.seen={};P.stuck=false;sfx.play('ui');CP.go()});
  function stars(){var par=P.nc*2+2;return P.moves<=par?3:P.moves<=par*1.5?2:1}
  /* ---------- v35 : DUEL. Le même casse-tête pour les deux, le premier qui finit gagne.
     Contre l'ordi : il résout vraiment le casse-tête (même règles que toi) et joue un coup toutes les X secondes
     selon le niveau, sans tricher. En salon : chacun joue chez soi, on voit les fioles de l'autre en petit. ---------- */
  var DS=[0,0],OPP=null,BOTIV=[0,4200,2900,1900],BOTN=['','Facile','Moyen','Difficile'];
  function duel(C){return C.mode==='bot'||C.mode==='online'}
  /* v67 : la partie est sauvegardée (niveau en cours et fioles, pour chaque difficulté) et reprend à la prochaine visite */
  function pKey(C){return 'pot-save-'+C.mode}
  function pSaved(C){if(duel(C))return null;try{var o=JSON.parse(PP.text(pKey(C))||'null');return o&&o.lv>=1?o:null}catch(e){return null}}
  function pSave(C){if(!P||duel(C)||P.anim)return;var o=P.won?{lv:P.level+1,nw:1}:{lv:P.level,tb:P.tubes,st:P.start,mv:P.moves,ex:P.extra?1:0,hd:P.hid,mk:P.mask,x0:P.startX},j=JSON.stringify(o);if(j!==P._sv){P._sv=j;PP.text(pKey(C),j)}}
  function pLoad(C){var o=pSaved(C);if(!o)return false;pReset(C,false);P.level=o.lv;
    if(!o.nw&&Array.isArray(o.tb)&&o.tb.length>=P.tubes.length-1){P.tubes=o.tb;P.start=o.st||JSON.stringify(o.tb);P.moves=o.mv||0;P.extra=!!o.ex;P.hid=o.hd||null;P.mask=o.mk||null;P.startX=o.x0||null;pLay()}else pMech(C);P._sv=JSON.stringify(o);return true}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pot-r1]');if(!b||!CP)return;e.preventDefault();e.stopPropagation();PP.text(pKey(CP),'');sfx.play('ui');pReset(CP,false);var st=document.getElementById('potion-start');if(st)st.click()},true);
  function botLv(){var v=PP.store('pot-lv');return v>=1&&v<=3?v:2}
  function solve(tubes){return solveG(tubes,null,-1)}
  function solveG(tubes,goal,lock){var t=tubes.map(function(x){return x.slice()}),seen={},path=[],nodes=0;
    function fullT(x){return x.length===4&&x[0]===x[1]&&x[1]===x[2]&&x[2]===x[3]}
    function key(){return t.map(function(x){return x.map(function(c){return String.fromCharCode(97+c)}).join('')}).sort().join('|')}
    function rec(d){if(goal?goal(t):t.every(function(x){return !x.length||fullT(x)}))return true;if(d>120||++nodes>60000)return false;var k=key();if(seen[k])return false;seen[k]=1;
      var cand=[],usedEmpty=false;
      for(var a=0;a<t.length;a++){if(a===lock)continue;var A=t[a];if(!A.length||fullT(A))continue;var c=A[A.length-1],r=0;for(var i=A.length-1;i>=0&&A[i]===c;i--)r++;
        for(var b=0;b<t.length;b++){if(a===b||b===lock)continue;var B=t[b];if(B.length>=4)continue;if(B.length){if(B[B.length-1]!==c)continue;cand.push([a,b,Math.min(r,4-B.length),0])}else if(r<A.length)cand.push([a,b,r,1])}}
      cand.sort(function(x,y){return x[3]-y[3]});
      for(var j=0;j<cand.length;j++){var m=cand[j],A2=t[m[0]],B2=t[m[1]];if(m[3]){if(usedEmpty)continue;usedEmpty=true}
        for(var q=0;q<m[2];q++)B2.push(A2.pop());path.push([m[0],m[1]]);if(rec(d+1))return true;path.pop();for(q=0;q<m[2];q++)A2.push(B2.pop())}
      return false}
    return rec(0)?path:null}
  /* v68 : certains niveaux (pas tous) ont des couleurs mystères et/ou une fiole masquée, dans toutes les difficultés */
  function pMech(C){if(duel(C)||!P)return;var L=P.level,myst=L>=3&&L%3===0,msk=L>=4&&L%4===0;P.hid=null;P.mask=null;
    if(msk){var mk=null;for(var tr=0;tr<6&&!mk;tr++){if(tr)P.tubes=pGen(C);mk=pickMask(P.tubes)}if(mk){P.mask=mk;P.start=JSON.stringify(P.tubes);pLay()}}
    if(myst){var deep=C.mode!=='easy';P.hid=P.tubes.map(function(t,i){if(t.length<2||Math.random()<.3)return 0;return Math.min(t.length-1,1+(deep&&Math.random()<.45?1:0))})}
    P.startX=JSON.stringify({h:P.hid,m:P.mask});
    if(P.mask||P.hid)setTimeout(function(){if(!P||P.won)return;C.pop(P.mask&&P.hid?'MYSTÈRES !':P.mask?'FIOLE MASQUÉE':'COULEURS MYSTÈRES',P.mask?COLS[P.mask.col]:'#7c46c8','46px')},400)}
  /* fiole masquée : on choisit une fiole et une couleur absente de cette fiole, puis on vérifie que le niveau reste faisable */
  function pickMask(tubes){var idx=[];tubes.forEach(function(t,i){if(t.length===4)idx.push(i)});idx.sort(function(){return Math.random()-.5});
    for(var q=0;q<Math.min(3,idx.length);q++){var mi=idx[q],cols={};tubes.forEach(function(t,i){if(i!==mi)t.forEach(function(c){cols[c]=(cols[c]||0)+1})});
      var cand=Object.keys(cols).filter(function(c){return cols[c]===4&&tubes[mi].indexOf(+c)<0}).map(Number);if(!cand.length)continue;var col=cand[Math.random()*cand.length|0];
      var p1=solveG(tubes,function(t){return t.some(function(x,i){return i!==mi&&x.length===4&&x[0]===col&&x[1]===col&&x[2]===col&&x[3]===col})},mi);if(!p1)continue;
      var st=tubes.map(function(x){return x.slice()});p1.forEach(function(m){var A=st[m[0]],B=st[m[1]],c=A[A.length-1],r=0;for(var i=A.length-1;i>=0&&A[i]===c;i--)r++;var k=Math.min(r,4-B.length);for(var z=0;z<k;z++)B.push(A.pop())});
      if(solve(st))return {i:mi,col:col,on:true}}
    return null}
  function genSolvable(C){var t;for(var i=0;i<40;i++){t=pGen(C);if(solve(t))return t}return t}
  function oppName(C,from){if(C.mode==='bot')return 'L\'ordi';var p=C.net.players.filter(function(q){return q.id===from})[0];return p?p.name:'Adversaire'}
  function duelStart(C,tubes){pReset(C,false);P.tubes=JSON.parse(JSON.stringify(tubes));P.start=JSON.stringify(P.tubes);P.done={};pLay();
    OPP={tubes:JSON.parse(P.start),name:C.mode==='bot'?'L\'ordi':'Adversaire',path:null,i:0,next:0};
    if(C.mode==='bot'){OPP.path=solve(tubes)||[];OPP.next=performance.now()+BOTIV[botLv()]+600}
    C.go()}
  function duelNew(C){var t=genSolvable(C);if(C.mode==='online')C.net.relay({t:'pd-go',tb:t});duelStart(C,t)}
  function duelEnd(C,win,who){if(P.won)return;P.won=true;P.sel=-1;P.anim=null;C.stop();DS[win?0:1]++;
    if(win){sfx.play('win');C.pop('GAGNÉ !',RED,'70px');C.win();if(C.mode==='online')C.net.relay({t:'pd-win'})}else{sfx.play('lose');C.pop('PERDU',INK,'70px');C.shake(6)}
    var host=C.mode==='bot'||C.net.isHost;
    setTimeout(function(){C.over(win?'Gagné !':'Perdu…',(win?'Tu as fini en premier, en '+P.moves+' coups.':PP.esc(who||'L\'adversaire')+' a fini avant toi.')+'<br>Score : <b>'+DS[0]+' – '+DS[1]+'</b>'+(host?'':'<br>Le chef relance la revanche.'),host?'Revanche':false,function(){duelNew(C)})},700)}
  function duelIntro(C){var h;
    if(C.mode==='bot'){h='Toi et l\'ordinateur avez <b>le même casse-tête</b>. Le premier qui range toutes les couleurs gagne. L\'ordi joue avec les mêmes règles que toi, un coup à la fois.'+
      '<div style="margin-top:10px"><small style="opacity:.75;display:block;margin-bottom:4px">Niveau de l\'ordinateur</small>'+[1,2,3].map(function(v){var on=v===botLv();return '<button type="button" data-pot-lv="'+v+'" style="font:700 12px \'IBM Plex Mono\',monospace;padding:7px 11px;margin:2px;border:2px solid #f1ece2;cursor:pointer;background:'+(on?'#f1ece2':'transparent')+';color:'+(on?'#141210':'#f1ece2')+'">'+BOTN[v]+' · 1 coup / '+(BOTIV[v]/1000).toFixed(1).replace('.',',')+' s</button>'}).join('')+'</div>';
      C.over('Duel de potions',h,'Jouer');return}
    var host=C.net.isHost;C.over('Duel de potions','Tout le salon reçoit <b>le même casse-tête</b>. Le premier qui range toutes les couleurs gagne. Tu vois les fioles de l\'adversaire en petit, en haut à droite.'+(host?'':'<br>Le chef lance le duel.'),host?'Lancer le duel':false,function(){duelNew(C)})}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pot-lv]');if(!b||!CP||PP.cur()!=='potion'||CP.mode!=='bot')return;e.preventDefault();PP.store('pot-lv',+b.dataset.potLv);sfx.play('ui');duelIntro(CP)});
  function botStep(C){if(C.mode!=='bot'||!OPP||!OPP.path||P.won)return;var now=performance.now();if(now<OPP.next)return;
    var m=OPP.path[OPP.i++];if(m){var A=OPP.tubes[m[0]],B=OPP.tubes[m[1]],c=A[A.length-1],r=0;for(var i=A.length-1;i>=0&&A[i]===c;i--)r++;var k=Math.min(r,4-B.length);for(var q=0;q<k;q++)B.push(A.pop())}
    OPP.next=now+BOTIV[botLv()]*(.7+Math.random()*.6);if(OPP.i>=OPP.path.length)duelEnd(C,false,'L\'ordi')}
  /* v40 : l'adversaire dans un vrai cadre : mÃªmes fioles que les tiennes en miniature, son nom, et deux barres (toi / lui) */
  function drawOpp(g,C){if(!OPP)return;var n=OPP.tubes.length,k=.31,sp=23,cw=n*sp+22,ch=120,x0=W-cw-12,y0=6,nm=String(OPP.name).slice(0,14).toUpperCase();
    g.fillStyle='rgba(20,18,16,.18)';rr(g,x0+4,y0+5,cw,ch,10);g.fill();
    g.fillStyle='#fbf8f1';rr(g,x0,y0,cw,ch,10);g.fill();g.strokeStyle=INK;g.lineWidth=2.5;g.stroke();
    g.save();rr(g,x0,y0,cw,ch,10);g.clip();g.fillStyle=INK;g.fillRect(x0,y0,cw,22);g.restore();
    mono(g,nm,x0+cw/2,y0+12,11,CR);
    OPP.tubes.forEach(function(t,i){g.save();g.translate(x0+13+i*sp,y0+36);g.scale(k,k);var dn=full(t);drawTube(g,{x:0,y:0,w:54,h:4*SEG+20},t,0,0,0,0,0,0,dn,dn?1:0);g.restore()});
    var mine=P.tubes.filter(full).length,his=OPP.tubes.filter(full).length,bx=x0+44,bw=cw-78;
    function bar(y,lbl,v,col){mono(g,lbl,x0+10,y,9,INK,'left');g.fillStyle='rgba(20,18,16,.14)';rr(g,bx,y-4,bw,8,4);g.fill();if(v>0){g.fillStyle=col;rr(g,bx,y-4,Math.max(8,bw*v/P.nc),8,4);g.fill()}mono(g,v+'/'+P.nc,x0+cw-10,y,9,INK,'right')}
    bar(y0+95,'LUI',his,RED);bar(y0+109,'TOI',mine,'#3fbf6a')}  PP._pot=function(){return {opp:OPP,p:P,solve:solve,bot:function(){botStep(CP)},hint:function(){return findHint()},sel:function(i){pSelect(CP,i)}}};
  function pWin(C){if(duel(C)){duelEnd(C,true);return}P.won=true;pSave(C);P.sel=-1;C.stop();sfx.play('win');var key=C.mode,nb=C.best('lvl-'+key,P.level),st=stars();C.pop('BRAVO !',RED,'70px');if(P.level>=5)C.win();
    setTimeout(function(){C.over('Niveau '+P.level+' réussi','<span style="font-size:30px;letter-spacing:6px;color:#f3c623">'+'★★★'.slice(0,st)+'<span style="opacity:.3">'+'★★★'.slice(st)+'</span></span><br>En '+P.moves+' coups.'+(nb?'<br><b>Record de niveaux !</b>':''),'Niveau suivant',function(){var lv=P.level+1;pReset(C,true);P.level=lv;pMech(C);C.go()})},450)}
  function pSelect(C,hit){if(P.won||P.stuck)return;if(P.anim)pFinish(C);if(P.won||P.stuck)return;P.hint=null;
    if(hit<0){P.sel=-1;return}
    if(masked(hit)){P.shake[hit]=.25;sfx.play('lose');if(P.sel<0)PP.toast&&PP.toast('Fiole masquée : remplis une fiole de la couleur indiquée pour la révéler','warn');return}
    if(P.sel<0){if(P.tubes[hit].length&&!full(P.tubes[hit])){P.sel=hit;sfx.play('tick')}else if(P.tubes[hit].length)P.shake[hit]=.2;return}
    if(hit===P.sel){P.sel=-1;return}
    var k=canPour(P.sel,hit);if(!k){P.shake[hit]=.25;sfx.play('lose');/* on garde la sélection si on clique une autre fiole pleine : elle devient la sélection */if(P.tubes[hit].length&&!full(P.tubes[hit]))P.sel=hit;else P.sel=-1;return}
    P.undo.push(JSON.stringify({t:P.tubes,d:P.done,h:P.hid,m:P.mask}));P.anim={a:P.sel,b:hit,k:k,col:P.tubes[P.sel][P.tubes[P.sel].length-1],t:0};P.sel=-1;P.moves++;sfx.play('eat')}
  function pClick(C,x,y){if(P.won)return;var b=pBtnAt(x,y);if(b>=0){if(P.anim)pFinish(C);if(!P.won&&!P.stuck){pBtns()[b].fn(C);sfx.play('ui')}return}pSelect(C,pHit(x,y))}
  function pUndo(){if(P.anim){P.anim=null}if(!P.undo.length)return;var u=JSON.parse(P.undo.pop());P.tubes=u.t;P.done=u.d;P.hid=u.h||null;P.mask=u.m||null;P.sel=-1;P.hint=null}
  function pRestart(){P.seen={};P.stuck=false;P.anim=null;P.tubes=JSON.parse(P.start);if(P.startX){var x0=JSON.parse(P.startX);P.hid=x0.h;P.mask=x0.m}P.undo=[];P.moves=0;P.done={};P.sel=-1;P.hint=null;if(P.extra)P.tubes.push([]);pLay()}
  function pHintGo(){if(P.anim)return;var h=findHint();if(h){P.hint={a:h[0],b:h[1],t:2.2};P.sel=-1}else{PP.toast&&PP.toast('Plus de coup utile : annule ou ajoute un tube','warn')}}
  function pHit(x,y){var hit=-1;P.pos.forEach(function(p,i){if(x>p.x-10&&x<p.x+p.w+10&&y>p.y-34&&y<p.y+p.h+12)hit=i});return hit}
  function pBtnAt(x,y){var bs=pBtns();for(var b=0;b<bs.length;b++){var B=bs[b];if(x>B.x&&x<B.x+B.w&&y>B.y&&y<B.y+B.h)return b}return -1}
  function pHover(C,x,y){if(!P)return;P.hov=pHit(x,y);P.hb=pBtnAt(x,y);var can=C.running&&!P.won&&(P.hb>=0||(P.hov>=0&&(P.sel>=0||P.tubes[P.hov].length)));C.cv.style.cursor=can?'pointer':'default'}
  function pBtns(){var w=132,g=12,x0=W/2-(w*4+g*3)/2,y=H-54;return [
    {x:x0,y:y,w:w,h:38,l:'↶ ANNULER',k:'Z',off:!P.undo.length,fn:pUndo},
    {x:x0+(w+g),y:y,w:w,h:38,l:'⟳ REFAIRE',k:'R',off:!P.undo.length,fn:pRestart},
    {x:x0+(w+g)*2,y:y,w:w,h:38,l:P.extra?'TUBE AJOUTÉ':'+ 1 TUBE',k:'T',off:P.extra,fn:function(){if(!P.extra){P.extra=true;P.tubes.push([]);pLay()}}},
    {x:x0+(w+g)*3,y:y,w:w,h:38,l:'? INDICE',k:'H',off:false,fn:pHintGo}]}
  function drawTube(g,p,tube,ox,oy,ang,hide,add,addCol,isDone,cork,hidN,msk){hidN=msk?99:(hidN||0);var x=p.x+ox,y=p.y+oy,w=p.w,h=p.h;
    g.save();g.translate(x+w/2,y);g.rotate(ang);g.translate(-w/2,0);
    function shape(){g.beginPath();g.moveTo(3,0);g.lineTo(3,h-w/2);g.arc(w/2,h-w/2,w/2-3,Math.PI,0,true);g.lineTo(w-3,0);g.closePath()}
    g.save();shape();g.clip();
    var gl=g.createLinearGradient(0,0,w,0);gl.addColorStop(0,'rgba(255,255,255,.75)');gl.addColorStop(.5,'rgba(255,255,255,.45)');gl.addColorStop(1,'rgba(220,214,200,.7)');g.fillStyle=gl;g.fillRect(0,0,w,h);
    var n=tube.length,fullN=n-hide;
    for(var u=0;u<n;u++){var amt=u<fullN?1:Math.max(0,Math.min(1,n-u-hide));if(amt<=0)continue;var yy=h-4-(u+amt)*SEG,hd=u<hidN;g.fillStyle=hd?'#4a433c':COLS[tube[u]];g.fillRect(0,yy,w,SEG*amt+1);
      if(hd){g.fillStyle='rgba(241,236,226,.12)';for(var dx=0;dx<w;dx+=8)g.fillRect(dx,yy,4,SEG*amt);g.font='700 20px "IBM Plex Mono", monospace';g.fillStyle='#f1ece2';g.textAlign='center';g.textBaseline='middle';g.fillText('?',w/2,yy+SEG*amt/2+1)}
      /* léger dégradé dans chaque couche pour un effet liquide */
      g.fillStyle='rgba(0,0,0,.10)';g.fillRect(w*.68,yy,w*.32,SEG*amt+1);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,yy,w,3)}
    if(add>0){g.fillStyle=COLS[addCol];g.fillRect(0,h-4-(n+add)*SEG,w,SEG*add+1)}
    var lvl=Math.max(0,n-hide)+add;if(lvl>0){var sy=h-4-lvl*SEG;g.fillStyle='rgba(255,255,255,.4)';g.fillRect(0,sy,w,3)}
    g.fillStyle='rgba(255,255,255,.55)';g.fillRect(9,10,5,h-34);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(17,10,3,h-60);g.restore();
    shape();g.strokeStyle=INK;g.lineWidth=3;g.stroke();g.fillStyle=INK;rr(g,-2,-5,w+4,8,3);g.fill();
    if(isDone&&cork>0){var cy=-20+(1-cork)*-14;g.globalAlpha=Math.min(1,cork*2);g.fillStyle='#c08a52';rr(g,9,cy,w-18,17,4);g.fill();g.fillStyle='#d9a66a';g.fillRect(12,cy+3,w-24,3);g.strokeStyle=INK;g.lineWidth=2.5;rr(g,9,cy,w-18,17,4);g.stroke();g.globalAlpha=1}
    g.restore()}
  PP.arcade({id:'potion',
    setup:function(C){CP=C;OPP=null;DS=[0,0];pReset(C);
      if(C.mode==='online')C.listen(function(m){if(m.t!=='rel'||!m.d)return;var d=m.d;
        if(d.t==='pd-go'&&d.tb){duelStart(C,d.tb);OPP.name=oppName(C,m.from)}
        if(d.t==='pd-st'&&OPP&&d.tb){OPP.tubes=d.tb;OPP.name=oppName(C,m.from)}
        if(d.t==='pd-win'&&P&&!P.won&&OPP)duelEnd(C,false,oppName(C,m.from))});
      if(duel(C)){C.keysText('Duel au clavier ou à la souris : <kbd>←</kbd><kbd>→</kbd> choisissent une fiole, <kbd>Espace</kbd> prend puis verse · ou <kbd>1</kbd>…<kbd>9</kbd> <kbd>0</kbd> · <kbd>Z</kbd> annule · <kbd>H</kbd> indice');duelIntro(C);return}
      C.keysText('Souris : clique une fiole puis une autre · Clavier : <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> choisissent une fiole, <kbd>Espace</kbd> prend puis verse (ou <kbd>1</kbd>…<kbd>9</kbd> <kbd>0</kbd>) · <kbd>Z</kbd> annule · <kbd>R</kbd> recommence · <kbd>T</kbd> +1 tube · <kbd>H</kbd> indice');
      var sv=pSaved(C);
      C.over('Potions','Range les couleurs : chaque fiole doit finir remplie d\'une seule couleur.<br>On ne verse que sur la même couleur ou dans une fiole vide. Moins tu fais de coups, plus tu gagnes d\'étoiles.'+(sv&&sv.lv>1||sv&&!sv.nw&&sv.mv?'<br><b>Partie sauvegardée : tu reprends au niveau '+sv.lv+'.</b><br><button type="button" class="ghost" data-pot-r1>Repartir du niveau 1</button>':''),sv?'Continuer':'Jouer')},
    start:function(C){if(C.mode==='bot'){duelStart(C,genSolvable(C));return}if(!pLoad(C)){pReset(C,false);pMech(C)}},
    close:function(C){if(P&&C.running)pSave(C)},
    mouse:function(C,t,x,y){/* v70 : un petit mouvement de souris ne cache plus le curseur du clavier */if(P){if(t==='down')P.kb=0;else if(t==='move'){if(P.kx==null){P.kx=x;P.ky=y}if(Math.abs(x-P.kx)+Math.abs(y-P.ky)>40){P.kb=0;P.kx=x;P.ky=y}}}if(t==='down'&&C.running)pClick(C,x,y);pHover(C,x,y)},
    key:function(C,code,down){if(!down||!C.running||!P||P.won)return;
      P.kx=null;
      /* v41 : tout au clavier. Flèches = déplacer le curseur de fiole en fiole, Espace ou Entrée = prendre / verser */
      var nT=P.tubes.length,per=nT>8?Math.ceil(nT/2):nT;if(P.cur==null||P.cur>=nT)P.cur=0;
      if(code==='ArrowRight'){P.cur=(P.cur+1)%nT;P.kb=1;sfx.play('tick');return}
      if(code==='ArrowLeft'){P.cur=(P.cur+nT-1)%nT;P.kb=1;sfx.play('tick');return}
      if(code==='ArrowDown'||code==='ArrowUp'){if(nT>8){var o=P.cur<per?Math.min(nT-1,P.cur+per):P.cur-per;P.cur=o;sfx.play('tick')}P.kb=1;return}
      if(code==='Space'||code==='Enter'||code==='NumpadEnter'){P.kb=1;pSelect(C,P.cur);return}
      var m=/^(Digit|Numpad)(\d)$/.exec(code);if(m){var i=m[2]==='0'?9:+m[2]-1;if(i<P.tubes.length)pSelect(C,i);return}
      if(code==='KeyZ'||code==='KeyW'||code==='Backspace')pUndo();else if(code==='KeyR')pRestart();else if(code==='KeyH')pHintGo();else if(code==='KeyT'){if(!P.extra){P.extra=true;P.tubes.push([]);pLay();sfx.play('ui')}}else if(code==='Escape')P.sel=-1},
    step:function(C,dt){botStep(C);P.t+=dt;Object.keys(P.shake).forEach(function(k){P.shake[k]=Math.max(0,P.shake[k]-dt)});Object.keys(P.flash).forEach(function(k){P.flash[k]=Math.max(0,P.flash[k]-dt)});
      P.lift=P.lift.map(function(l,i){var tg=i===P.sel?1:(i===P.hov&&!P.anim&&P.sel<0&&P.tubes[i].length&&!full(P.tubes[i]))?.22:0;return l+(tg-l)*Math.min(1,dt*30)});
      P.spark.forEach(function(s){s.t-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=520*dt});P.spark=P.spark.filter(function(s){return s.t>0});
      if(P.hint){P.hint.t-=dt;if(P.hint.t<=0)P.hint=null}
      if(P.anim){P.anim.t+=dt/POUR;if(P.anim.t>=1)pFinish(C)}P.svT=(P.svT||0)-dt;if(P.svT<=0){P.svT=.4;pSave(C)}
      C.hud('<span>Niveau <b>'+P.level+'</b></span><span>Coups <b>'+P.moves+'</b></span><span>'+({easy:'Facile',mid:'Moyen',hard:'Difficile',exp:'Expert'}[C.mode]||'')+'</span>')},
    draw:function(C){var g=C.g;if(!P)pReset(C);
      var bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f7f1e6');bg.addColorStop(1,'#e6d9c0');g.fillStyle=bg;g.fillRect(0,0,W,H);
      function shelf(y){g.fillStyle='rgba(20,18,16,.12)';g.fillRect(48,y+14,W-96,7);g.fillStyle='#b8834a';g.fillRect(48,y,W-96,14);g.fillStyle='#d19a5e';g.fillRect(48,y,W-96,4);g.strokeStyle=INK;g.lineWidth=2.5;g.strokeRect(48,y,W-96,14)}
      shelf(P.pos[0].y+P.pos[0].h+4);if(P.pos.length>8)shelf(P.pos[P.pos.length-1].y+P.pos[0].h+4);
      var a=P.anim,hint=P.hint,many=P.tubes.length>9;
      /* cibles possibles : petite flèche de la couleur sélectionnée */
      if(P.sel>=0)P.pos.forEach(function(p,i){if(i===P.sel||!canPour(P.sel,i))return;var cx=p.x+p.w/2,cy=p.y-24;g.fillStyle=COLS[P.tubes[P.sel][P.tubes[P.sel].length-1]];g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.moveTo(cx-9,cy-8);g.lineTo(cx+9,cy-8);g.lineTo(cx,cy+4);g.closePath();g.fill();g.stroke()});
      P.tubes.forEach(function(t,i){if(a&&i===a.a)return;var p=P.pos[i],sh=P.shake[i]?Math.sin(P.t*70)*5*P.shake[i]/.25:0,lf=-P.lift[i]*20;
        var add=0;if(a&&i===a.b){add=a.k*Math.max(0,Math.min(1,(a.t-.25)/.55))}
        var dn=full(t)&&!(a&&i===a.b);
        if(i===P.sel||(hint&&(i===hint.a||i===hint.b))){var col=i===P.sel?'243,198,35':'74,208,216',pulse=hint&&i!==P.sel?.35+Math.sin(P.t*8)*.2:.5;g.fillStyle='rgba('+col+','+pulse+')';rr(g,p.x-7,p.y-10+lf,p.w+14,p.h+16,14);g.fill()}
        if(P.flash[i]){g.fillStyle='rgba(255,255,255,'+(P.flash[i]*1.4)+')';rr(g,p.x-6,p.y-8,p.w+12,p.h+14,14);g.fill()}
        drawTube(g,p,t,sh,lf,0,0,add,a?a.col:0,dn,dn?Math.min(1,1-(P.flash[i]||0)*1.2+.4):0,hidOf(i),masked(i));
        /* fiole masquée : cadenas avec la couleur à finir pour l'ouvrir */
        if(masked(i)){var mx=p.x+p.w/2+sh,my=p.y-30+lf;g.fillStyle=INK;rr(g,mx-15,my-6,30,24,5);g.fill();g.strokeStyle=INK;g.lineWidth=4;g.beginPath();g.arc(mx,my-6,9,Math.PI,0);g.stroke();g.fillStyle=COLS[P.mask.col];g.beginPath();g.arc(mx,my+6,7,0,7);g.fill();g.strokeStyle='#f1ece2';g.lineWidth=2;g.stroke()}
        /* numéro de touche sous la fiole */
        if(i<10)mono(g,String((i+1)%10),p.x+p.w/2,p.y+p.h+29,11,'rgba(20,18,16,.45)');
        if(P.kb&&i===P.cur&&C.running){var cy=p.y+p.h+40+Math.sin(P.t*6)*2;g.fillStyle=RED;g.strokeStyle=INK;g.lineWidth=2.5;g.beginPath();g.moveTo(p.x+p.w/2,cy-9);g.lineTo(p.x+p.w/2+10,cy+5);g.lineTo(p.x+p.w/2-10,cy+5);g.closePath();g.fill();g.stroke();g.strokeStyle=RED;g.lineWidth=3;rr(g,p.x-6,p.y-9+lf,p.w+12,p.h+15,13);g.stroke()}});
      if(hint){var HA=P.pos[hint.a],HB=P.pos[hint.b],y0=Math.min(HA.y,HB.y)-44;g.strokeStyle='rgba(30,130,140,.9)';g.lineWidth=4;g.setLineDash([8,6]);g.beginPath();g.moveTo(HA.x+HA.w/2,HA.y-14);g.quadraticCurveTo((HA.x+HB.x+HB.w)/2,y0-30,HB.x+HB.w/2,HB.y-14);g.stroke();g.setLineDash([])}
      if(a){var A=P.pos[a.a],B=P.pos[a.b],e=function(u){return 1-Math.pow(1-u,3)};
        /* la fiole file au-dessus de la cible, s'incline, verse, puis revient (tout en 0,3 s) */
        var mv=a.t<.25?e(a.t/.25):a.t>.8?1-e((a.t-.8)/.2):1,dir=B.x>=A.x?1:-1,tx=B.x-A.x-dir*(A.w*.18),ty=B.y-A.y-26;
        var ang=dir*mv*1.15,pp=Math.max(0,Math.min(1,(a.t-.25)/.55)),ox=tx*mv,oy=ty*mv;
        if(pp>0&&pp<1){var lipx=A.x+ox+A.w/2+dir*A.w*.3,lipy=A.y+oy+4;g.strokeStyle=COLS[a.col];g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(lipx,lipy);g.lineTo(B.x+B.w/2,B.y+B.h-4-(P.tubes[a.b].length+a.k*pp)*SEG);g.stroke()}
        drawTube(g,A,P.tubes[a.a],ox,oy,ang,a.k*pp,0,0,false,0,hidOf(a.a))}
      P.spark.forEach(function(s){g.fillStyle=s.c;g.globalAlpha=Math.min(1,s.t*2.5);g.beginPath();g.arc(s.x,s.y,3.5,0,7);g.fill();g.globalAlpha=1});
      pBtns().forEach(function(b,i){var hv=P.hb===i&&!b.off&&C.running,yy=b.y-(hv?2:0);
        g.fillStyle='rgba(20,18,16,.18)';rr(g,b.x+3,b.y+4,b.w,b.h,8);g.fill();
        g.fillStyle=b.off?'#a39b8f':hv?RED:INK;rr(g,b.x,yy,b.w,b.h,8);g.fill();mono(g,b.l,b.x+b.w/2-8,yy+b.h/2,12,CR);mono(g,b.k,b.x+b.w-14,yy+b.h/2,10,'rgba(241,236,226,.5)')});
      /* barre de progression : couleurs terminées */
      var nd=P.tubes.filter(full).length,bw=220,bx=W/2-bw/2,by=P.pos.length>8?20:84;
      txt(g,duel(C)?'DUEL':'NIVEAU '+P.level,W/2,by-2,24,INK);if(duel(C))drawOpp(g,C);g.fillStyle='rgba(20,18,16,.12)';rr(g,bx,by+16,bw,8,4);g.fill();g.fillStyle='#3fbf6a';rr(g,bx,by+16,Math.max(8,bw*nd/P.nc),8,4);g.fill()}
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
