/* Pixel Pause — Guerre des Tours : duel de cartes en temps réel, jeu original.
   Deux camps, une rivière et deux ponts. Chaque camp a 2 tours de garde et un donjon. On pose des cartes
   (troupes, canon, météore) avec de l'énergie qui remonte toute seule. On gagne en détruisant le donjon adverse,
   ou en ayant détruit plus de tours à la fin du temps. Solo contre l'ordinateur, 3 niveaux. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',BLU='#3a8cff',W=960,H=540;
  var RX=480,LANES=[140,340],TOPY=46,BOTY=434;
  var CARDS={
    pix:{n:'Pixels',c:2,cnt:3,hp:70,dmg:22,cd:.7,sp:78,r:9,rng:6,d:'3 petits rapides'},
    cos:{n:'Costaud',c:4,cnt:1,hp:640,dmg:70,cd:1.1,sp:42,r:16,rng:8,d:'Encaisse les coups'},
    tir:{n:'Tireuse',c:3,cnt:1,hp:150,dmg:48,cd:1,sp:50,r:11,rng:120,d:'Tire de loin'},
    bel:{n:'Bélier',c:4,cnt:1,hp:330,dmg:150,cd:1.4,sp:88,r:13,rng:8,bld:1,d:'Fonce sur les tours'},
    mag:{n:'Mage',c:4,cnt:1,hp:190,dmg:62,cd:1.4,sp:46,r:12,rng:105,spl:42,d:'Dégâts de zone'},
    col:{n:'Colosse',c:5,cnt:1,hp:1500,dmg:95,cd:1.5,sp:30,r:20,rng:10,bld:1,d:'Énorme, vise les tours'},
    met:{n:'Météore',c:3,spell:1,dmg:210,spl:62,d:'Explose où tu veux'},
    can:{n:'Canon',c:3,cnt:1,hp:420,dmg:55,cd:.9,sp:0,r:15,rng:140,life:28,build:1,d:'Défense fixe, 28 s'}
  };
  var DECK=Object.keys(CARDS),S,LV={easy:{think:2.6,thr:9,dumb:.4},mid:{think:1.6,thr:7,dumb:.12},hard:{think:1.05,thr:6,dumb:0}};
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function mkTower(team,king,x,y){return {tw:1,team:team,king:king,x:x,y:y,r:king?30:24,hp:king?2400:1300,max:king?2400:1300,rng:king?165:150,dmg:king?62:50,cd:0,alive:true,awake:!king,lane:y<240?0:1}}
  function fresh(C){var d0=shuffle(DECK.slice()),d1=shuffle(DECK.slice());
    S={t:150,over:false,sd:false,u:[],fx:[],tw:[mkTower(0,0,190,140),mkTower(0,0,190,340),mkTower(0,1,105,240),mkTower(1,0,770,140),mkTower(1,0,770,340),mkTower(1,1,855,240)],
      e:[5,5],hand:[d0.splice(0,4),d1.splice(0,4)],deck:[d0,d1],sel:-1,ai:{t:2.5},L:LV[C.mode]||LV.mid,mx:0,my:0,tt:0,warn:0}}
  function crowns(team){return S.tw.filter(function(t){return t.team!==team&&!t.alive}).length}
  function spawn(team,id,x,y){var c=CARDS[id];
    if(c.spell){S.fx.push({k:'met',x:x,y:y,t:.7,team:team,id:id});return}
    for(var i=0;i<c.cnt;i++){var a=i/c.cnt*6.283,ox=c.cnt>1?Math.cos(a)*14:0,oy=c.cnt>1?Math.sin(a)*14:0;
      S.u.push({team:team,id:id,c:c,x:x+ox,y:Math.max(TOPY+8,Math.min(BOTY-8,y+oy)),hp:c.hp,max:c.hp,cd:.6,r:c.r,lane:y<240?0:1,alive:true,bridge:false,an:Math.random()*6,hit:0})}
    S.fx.push({k:'ring',x:x,y:y,t:.35,c:team?RED:BLU})}
  function play(team,idx,x,y){var id=S.hand[team][idx],c=CARDS[id];if(!c||S.e[team]<c.c)return false;
    if(!c.spell){x=team?Math.max(505,Math.min(890,x)):Math.max(70,Math.min(455,x))}y=Math.max(TOPY+10,Math.min(BOTY-10,y));
    S.e[team]-=c.c;spawn(team,id,x,y);S.deck[team].push(id);S.hand[team][idx]=S.deck[team].shift();if(team===0)sfx.play('pickup');return true}
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function hurt(C,t,d){if(!t.alive)return;t.hp-=d;t.hit=.12;if(t.tw&&t.king)t.awake=true;
    if(t.hp<=0){t.alive=false;t.hp=0;for(var i=0;i<(t.tw?26:8);i++)S.fx.push({k:'p',x:t.x,y:t.y,vx:(Math.random()-.5)*(t.tw?260:140),vy:(Math.random()-.5)*(t.tw?260:140),t:.5+Math.random()*.4,c:t.tw?'#8a8e96':(t.team?RED:BLU)});
      if(t.tw){sfx.play(t.team?'win':'lose');C.shake(t.king?12:7);S.tw.forEach(function(k){if(k.team===t.team&&k.king)k.awake=true});C.pop(t.king?'DONJON DÉTRUIT !':'TOUR DÉTRUITE !',t.team?YEL:RED,'50px');
        if(t.king)finish(C,t.team===1?1:-1);else if(S.sd)finish(C,t.team===1?1:-1)}}}
  function blast(C,team,x,y,rad,dmg){S.u.forEach(function(u){if(u.alive&&u.team!==team&&Math.hypot(u.x-x,u.y-y)<rad+u.r)hurt(C,u,dmg)});S.tw.forEach(function(t){if(t.alive&&t.team!==team&&Math.hypot(t.x-x,t.y-y)<rad+t.r)hurt(C,t,dmg*.35)})}
  function target(u){var best=null,bd=1e9,sight=Math.max(u.c.rng+30,125);
    S.u.forEach(function(o){if(!o.alive||o.team===u.team)return;if(u.c.bld&&!o.c.build)return;var d=dist(u,o);if(d<sight&&d<bd){bd=d;best=o}});
    if(best)return best;
    var foes=S.tw.filter(function(t){return t.alive&&t.team!==u.team}),side=foes.filter(function(t){return !t.king&&t.lane===u.lane})[0];
    return side||foes.filter(function(t){return t.king})[0]||foes[0]||null}
  function stepUnit(C,u,dt){u.cd-=dt;u.hit=Math.max(0,u.hit-dt);u.an+=dt*8;
    if(u.c.build){u.hp-=u.max/u.c.life*dt;if(u.hp<=0){u.alive=false;return}}
    var T=target(u);u.tg=T;if(!T)return;var d=dist(u,T),reach=u.c.rng+T.r+u.r;
    if(d<=reach){if(u.cd<=0){u.cd=u.c.cd;u.at=.15;if(u.c.rng>40)S.fx.push({k:'shot',x:u.x,y:u.y,x2:T.x,y2:T.y,t:.14,c:u.id==='mag'?'#b072e0':YEL});
        if(u.c.spl){blast(C,u.team,T.x,T.y,u.c.spl,u.c.dmg);S.fx.push({k:'ring',x:T.x,y:T.y,t:.25,c:'#b072e0'})}else hurt(C,T,u.c.dmg);if(u.team===0&&Math.random()<.25)sfx.play('tick')}return}
    if(!u.c.sp)return;
    /* la rivière ne se traverse que par le pont de sa voie */
    var ax=T.x,ay=T.y,ls=u.x<RX?-1:1,ts=T.x<RX?-1:1,ly=LANES[u.lane];
    if(ls!==ts){var ex=RX+ls*26;if(!u.bridge&&Math.hypot(u.x-ex,u.y-ly)>9){ax=ex;ay=ly}else{u.bridge=true;ax=RX-ls*30;ay=ly}}else u.bridge=false;
    var dx=ax-u.x,dy=ay-u.y,l=Math.hypot(dx,dy)||1,sp=u.c.sp*dt;u.x+=dx/l*sp;u.y+=dy/l*sp;u.dir=dx>0?1:-1;
    if(!u.bridge&&Math.abs(u.x-RX)<20&&Math.abs(u.y-ly)>26)u.x=RX+ls*20}
  function stepTower(C,t,dt){t.hit=Math.max(0,(t.hit||0)-dt);if(!t.alive||!t.awake)return;t.cd-=dt;if(t.cd>0)return;var best=null,bd=t.rng;
    S.u.forEach(function(u){if(u.alive&&u.team!==t.team){var d=dist(t,u)-u.r;if(d<bd){bd=d;best=u}}});
    if(best){t.cd=.8;hurt(C,best,t.dmg);S.fx.push({k:'shot',x:t.x,y:t.y-18,x2:best.x,y2:best.y,t:.14,c:'#fff'})}}
  /* ---------- ordinateur : même énergie que toi, il réfléchit plus ou moins vite selon le niveau ---------- */
  function ai(C,dt){var A=S.ai,L=S.L;A.t-=dt;if(A.t>0)return;A.t=L.think*(.7+Math.random()*.6);
    var hand=S.hand[1],e=S.e[1],ok=function(id){var i=hand.indexOf(id);return i>=0&&CARDS[id].c<=e?i:-1};
    if(Math.random()<L.dumb){var r=Math.floor(Math.random()*4),c=CARDS[hand[r]];if(c&&c.c<=e&&e>=8)play(1,r,700+Math.random()*150,LANES[Math.floor(Math.random()*2)]+(Math.random()-.5)*40);return}
    var foes=S.u.filter(function(u){return u.alive&&u.team===0}),thr=foes.filter(function(u){return u.x>420});
    /* météore : sur un groupe, ou pour achever une tour */
    var mi=ok('met');if(mi>=0&&L.dumb<.3){var bestN=0,bp=null;foes.forEach(function(u){var n=foes.filter(function(o){return Math.hypot(o.x-u.x,o.y-u.y)<60}).length;if(n>bestN){bestN=n;bp=u}});
      if(bestN>=3){play(1,mi,bp.x,bp.y);return}var low=S.tw.filter(function(t){return t.team===0&&t.alive&&t.hp<80})[0];if(low){play(1,mi,low.x,low.y);return}}
    if(thr.length){var big=thr.slice().sort(function(a,b){return b.max-a.max})[0],ly=LANES[big.lane],pref=thr.length>=3?['mag','can','cos','pix','tir']:big.c.bld?['can','pix','cos','tir','mag']:['cos','can','tir','mag','pix'];
      for(var k=0;k<pref.length;k++){var i=ok(pref[k]);if(i>=0){play(1,i,pref[k]==='can'?700:Math.min(760,Math.max(520,big.x+90)),ly+(Math.random()-.5)*30);return}}return}
    if(e<L.thr)return;
    var lane=Math.floor(Math.random()*2);if(L.dumb===0){var t0=S.tw.filter(function(t){return t.team===0&&!t.king&&t.alive});if(t0.length===2)lane=t0[0].hp<t0[1].hp?t0[0].lane:t0[1].lane;else if(t0.length===1)lane=1-t0[0].lane}
    var mine=S.u.filter(function(u){return u.alive&&u.team===1&&u.lane===lane&&!u.c.build}),front=mine.filter(function(u){return u.c.hp>500}).length;
    var order=front?['tir','mag','pix','bel','cos','col']:['col','cos','bel','pix','tir','mag'];
    for(var q=0;q<order.length;q++){var j=ok(order[q]);if(j>=0){play(1,j,front?800+Math.random()*60:840+Math.random()*40,LANES[lane]+(Math.random()-.5)*30);return}}}
  function finish(C,res){if(S.over)return;S.over=true;S.sel=-1;C.stop();var c0=crowns(0),c1=crowns(1);
    if(c0>0)PP.store('ag-tours-cr',(PP.store('ag-tours-cr')||0)+c0);if(res>0){C.win();sfx.play('win')}else if(res<0)sfx.play('lose');
    setTimeout(function(){C.over(res>0?'Victoire !':res<0?'Défaite…':'Égalité','Tours détruites : toi <b>'+c0+'</b> – <b>'+c1+'</b> l\'ordi'+(res>0?'<br>Bien joué !':res<0?'<br>Revanche ?':'')+'<br>Total de tours détruites : <b>'+(PP.store('ag-tours-cr')||0)+'</b>','Rejouer')},1300)}
  /* ---------- dessin ---------- */
  function unit(g,u,x,y,team,id,sc,face){var c=CARDS[id],r=c.r*(sc||1),col=team?RED:BLU,dk=team?'#8f1f0e':'#1f559f',f=face||(team?-1:1);
    g.save();g.translate(x,y);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,r*.85,r*.95,r*.4,0,0,7);g.fill();g.lineWidth=2.5;g.strokeStyle=INK;g.fillStyle=col;
    if(id==='pix'){g.fillRect(-r,-r,r*2,r*2);g.strokeRect(-r,-r,r*2,r*2);g.fillStyle=CR;g.fillRect(-r*.5+f*2,-r*.4,r*.35,r*.45);g.fillRect(r*.15+f*2,-r*.4,r*.35,r*.45)}
    else if(id==='cos'){g.beginPath();g.arc(0,0,r,0,7);g.fill();g.stroke();g.fillStyle='#c9c9cf';g.beginPath();g.ellipse(f*r*.75,0,r*.35,r*.8,0,0,7);g.fill();g.stroke();g.fillStyle=CR;g.fillRect(-r*.35,-r*.35,r*.25,r*.3);g.fillRect(r*.05,-r*.35,r*.25,r*.3)}
    else if(id==='tir'){g.beginPath();g.arc(0,0,r,0,7);g.fill();g.stroke();g.strokeStyle='#8a5a30';g.lineWidth=3;g.beginPath();g.arc(f*r*.6,0,r*.9,-1.1,1.1,f<0);g.stroke();g.strokeStyle=CR;g.lineWidth=1.5;g.beginPath();g.moveTo(f*r*.6+Math.cos(1.1)*r*.9*f,-Math.sin(1.1)*r*.9);g.lineTo(f*r*.6+Math.cos(1.1)*r*.9*f,Math.sin(1.1)*r*.9);g.stroke()}
    else if(id==='bel'){ag.rr(g,-r*1.2,-r*.8,r*2.4,r*1.6,5);g.fill();g.stroke();g.fillStyle='#e8e2d4';[-1,1].forEach(function(s){g.beginPath();g.moveTo(f*r*1.1,s*r*.3);g.lineTo(f*r*1.9,s*r*.75);g.lineTo(f*r*1.15,s*r*.75);g.closePath();g.fill();g.stroke()})}
    else if(id==='mag'){g.beginPath();g.arc(0,2,r,0,7);g.fill();g.stroke();g.fillStyle='#7c46c8';g.beginPath();g.moveTo(-r*1.05,-r*.3);g.lineTo(0,-r*2.1);g.lineTo(r*1.05,-r*.3);g.closePath();g.fill();g.stroke();g.fillStyle=YEL;g.beginPath();g.arc(f*r*.9,r*.2,r*.3,0,7);g.fill()}
    else if(id==='col'){ag.rr(g,-r,-r,r*2,r*2,7);g.fill();g.stroke();g.fillStyle=dk;g.fillRect(-r,-r*.2,r*2,r*.35);g.fillStyle=CR;g.fillRect(-r*.5,-r*.6,r*.3,r*.3);g.fillRect(r*.2,-r*.6,r*.3,r*.3);g.fillStyle='#c9c9cf';[-1,1].forEach(function(s){g.beginPath();g.arc(s*r*.7,r*.6,r*.14,0,7);g.fill()})}
    else if(id==='can'){g.fillStyle='#6a6f78';ag.rr(g,-r,-r,r*2,r*2,5);g.fill();g.stroke();g.fillStyle=col;g.fillRect(-r,r*.45,r*2,r*.4);g.fillStyle='#2a2c30';g.save();if(u&&u.tg)g.rotate(Math.atan2(u.tg.y-y,u.tg.x-x));else if(f<0)g.rotate(Math.PI);g.fillRect(0,-r*.3,r*1.6,r*.6);g.strokeRect(0,-r*.3,r*1.6,r*.6);g.restore();g.beginPath();g.arc(0,0,r*.5,0,7);g.fill();g.stroke()}
    else{g.fillStyle='#ff8a1e';g.beginPath();g.arc(0,0,r||12,0,7);g.fill();g.stroke();g.fillStyle=YEL;g.beginPath();g.arc(-3,-3,(r||12)*.45,0,7);g.fill()}
    g.restore()}
  function bar(g,x,y,w,v,team){g.fillStyle='rgba(20,18,16,.75)';g.fillRect(x-w/2-1,y-1,w+2,6);g.fillStyle=team?RED:BLU;g.fillRect(x-w/2,y,Math.max(0,w*v),4)}
  function tower(g,t){var x=t.x,y=t.y,r=t.r,col=t.team?RED:BLU;
    if(!t.alive){g.fillStyle='rgba(20,18,16,.45)';g.beginPath();g.ellipse(x,y+6,r*1.1,r*.6,0,0,7);g.fill();g.fillStyle='#6a6660';for(var i=0;i<5;i++)g.fillRect(x-r+i*r*.45,y-4+(i%2)*8,r*.35,r*.3);return}
    g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x,y+r*.9,r*1.15,r*.45,0,0,7);g.fill();
    g.fillStyle=t.hit>0?'#fff':'#b9b3a6';g.strokeStyle=INK;g.lineWidth=3;ag.rr(g,x-r,y-r,r*2,r*2,5);g.fill();g.stroke();
    g.fillStyle='#8f897c';for(var b=0;b<3;b++)g.fillRect(x-r+3+b*(r*2-6)/3+2,y-r-6,(r*2-6)/3-4,8);
    g.fillStyle=col;ag.rr(g,x-r*.62,y-r*.62,r*1.24,r*1.24,4);g.fill();g.stroke();
    if(t.king){g.fillStyle=YEL;g.beginPath();g.moveTo(x-13,y+8);g.lineTo(x-13,y-6);g.lineTo(x-6,y+1);g.lineTo(x,y-9);g.lineTo(x+6,y+1);g.lineTo(x+13,y-6);g.lineTo(x+13,y+8);g.closePath();g.fill();g.lineWidth=2;g.stroke();if(!t.awake)ag.mono(g,'Zzz',x,y-r-16,11,CR)}
    else{g.fillStyle=CR;g.beginPath();g.arc(x,y,6,0,7);g.fill();g.lineWidth=2;g.stroke()}
    bar(g,x,y+r+6,r*2,t.hp/t.max,t.team);ag.mono(g,String(Math.ceil(t.hp)),x,y+r+19,10,CR)}
  var CX=250,CW=108,CG=12,CY=452,CH=82;
  function cardAt(x,y){if(y<CY||y>CY+CH)return -1;for(var i=0;i<4;i++){var cx=CX+i*(CW+CG);if(x>=cx&&x<=cx+CW)return i}return -1}
  PP.arcade({id:'tours',
    setup:function(C){fresh(C);C.keysText('Clique une carte (ou <kbd>1</kbd> à <kbd>4</kbd>) puis clique de ton côté du terrain pour la poser · le Météore se lance n\'importe où');
      C.over('Guerre des Tours','Détruis le <b>donjon</b> adverse, ou plus de tours que l\'ordinateur avant la fin du temps (2 min 30).<br>Ton énergie remonte toute seule : chaque carte en coûte. Les troupes passent par les ponts. La dernière minute, l\'énergie monte 2 fois plus vite.','Jouer')},
    start:function(C){fresh(C)},
    key:function(C,code,down){if(!down||!C.running||S.over)return;var m=/^(Digit|Numpad)([1-4])$/.exec(code);if(m){var i=+m[2]-1;S.sel=S.sel===i?-1:i;sfx.play('tick')}if(code==='Escape')S.sel=-1},
    mouse:function(C,t,x,y){S.mx=x;S.my=y;if(t!=='down'||!C.running||S.over)return;var ci=cardAt(x,y);
      if(ci>=0){S.sel=S.sel===ci?-1:ci;sfx.play('tick');return}
      if(S.sel<0||y>BOTY+6||y<TOPY-6)return;var id=S.hand[0][S.sel],c=CARDS[id];
      if(S.e[0]<c.c){S.warn=1;S.wtxt='Pas assez d\'énergie';sfx.play('lose');return}
      if(!c.spell&&x>RX-22){S.warn=1;S.wtxt='Pose tes troupes de ton côté (à gauche de la rivière)';sfx.play('lose');return}
      if(play(0,S.sel,x,y))S.sel=-1},
    step:function(C,dt){S.tt+=dt;S.warn=Math.max(0,S.warn-dt);var rate=(S.t<60||S.sd?2:1)/2.4;S.e[0]=Math.min(10,S.e[0]+dt*rate);S.e[1]=Math.min(10,S.e[1]+dt*rate);
      ai(C,dt);S.u.forEach(function(u){if(u.alive)stepUnit(C,u,dt)});S.tw.forEach(function(t){stepTower(C,t,dt)});
      /* les troupes ne se marchent pas dessus */
      for(var i=0;i<S.u.length;i++)for(var j=i+1;j<S.u.length;j++){var a=S.u[i],b=S.u[j];if(!a.alive||!b.alive)continue;var dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r-2;if(d<m&&d>0){var p=(m-d)/2,nx=dx/d,ny=dy/d;if(a.c.sp){a.x-=nx*p;a.y-=ny*p}if(b.c.sp){b.x+=nx*p;b.y+=ny*p}}}
      S.u.forEach(function(u){u.y=Math.max(TOPY+6,Math.min(BOTY-6,u.y))});S.u=S.u.filter(function(u){return u.alive});
      S.fx.forEach(function(f){f.t-=dt;if(f.k==='p'){f.x+=f.vx*dt;f.y+=f.vy*dt}if(f.k==='met'&&f.t<=0&&!f.done){f.done=1;var c=CARDS[f.id];blast(C,f.team,f.x,f.y,c.spl,c.dmg);S.fx.push({k:'boom',x:f.x,y:f.y,t:.4,r:c.spl});C.shake(6);sfx.play('hit')}});S.fx=S.fx.filter(function(f){return f.t>0});
      if(S.over)return;S.t-=dt;
      if(S.t<=0){var c0=crowns(0),c1=crowns(1);if(!S.sd){if(c0!==c1)finish(C,c0>c1?1:-1);else{S.sd=true;S.t=45;C.pop('MORT SUBITE !',YEL,'56px');sfx.play('go')}}
        else{var h0=0,h1=0;S.tw.forEach(function(t){if(t.team)h1+=t.hp/t.max;else h0+=t.hp/t.max});finish(C,Math.abs(h0-h1)<.02?0:h0>h1?1:-1)}}
      var tm=Math.max(0,Math.ceil(S.t));C.hud('<span>'+(S.sd?'Mort subite':'Temps')+' <b>'+Math.floor(tm/60)+':'+('0'+tm%60).slice(-2)+'</b></span><span>Tours détruites <b>'+crowns(0)+' – '+crowns(1)+'</b></span><span>Énergie <b>'+Math.floor(S.e[0])+'</b></span>')},
    draw:function(C){var g=C.g;if(!S)fresh(C);
      /* terrain : deux camps, rivière, ponts, voies */
      g.fillStyle='#1b1a1d';g.fillRect(0,0,W,H);g.fillStyle='#5aa34a';g.fillRect(40,TOPY-10,W-80,BOTY-TOPY+20);
      for(var i=0;i<12;i++){g.fillStyle=i%2?'rgba(255,255,255,.05)':'rgba(0,0,0,.05)';g.fillRect(40+i*73.4,TOPY-10,73.4,BOTY-TOPY+20)}
      g.fillStyle='rgba(58,140,255,.10)';g.fillRect(40,TOPY-10,RX-60,BOTY-TOPY+20);g.fillStyle='rgba(226,54,27,.10)';g.fillRect(RX+20,TOPY-10,W-RX-60,BOTY-TOPY+20);
      LANES.forEach(function(ly){g.fillStyle='rgba(232,214,160,.5)';g.fillRect(110,ly-14,740,28)});g.fillStyle='rgba(232,214,160,.5)';g.fillRect(96,LANES[0],26,LANES[1]-LANES[0]);g.fillRect(838,LANES[0],26,LANES[1]-LANES[0]);
      g.fillStyle='#3a8cd8';g.fillRect(RX-20,TOPY-10,40,BOTY-TOPY+20);g.fillStyle='rgba(255,255,255,.18)';for(var w=0;w<9;w++)g.fillRect(RX-14+((w*13+S.tt*14)%28),TOPY+w*46,10,3);
      LANES.forEach(function(ly){g.fillStyle='#9a6a3a';g.fillRect(RX-26,ly-28,52,56);g.strokeStyle=INK;g.lineWidth=3;g.strokeRect(RX-26,ly-28,52,56);g.fillStyle='rgba(0,0,0,.18)';for(var p=0;p<5;p++)g.fillRect(RX-26+p*10.4,ly-28,2,56)});
      g.strokeStyle=INK;g.lineWidth=4;g.strokeRect(40,TOPY-10,W-80,BOTY-TOPY+20);
      /* zone où tu peux poser */
      if(S.sel>=0&&C.running){var c=CARDS[S.hand[0][S.sel]];g.fillStyle='rgba(243,198,35,.13)';if(c.spell)g.fillRect(40,TOPY-10,W-80,BOTY-TOPY+20);else g.fillRect(40,TOPY-10,RX-60,BOTY-TOPY+20);
        if(S.my>TOPY-6&&S.my<BOTY+6){var ok=c.spell||S.mx<RX-22;g.globalAlpha=.6;if(c.spell){g.strokeStyle=ok?YEL:RED;g.lineWidth=3;g.setLineDash([7,6]);g.beginPath();g.arc(S.mx,S.my,c.spl,0,7);g.stroke();g.setLineDash([])}else{unit(g,null,S.mx,S.my,0,S.hand[0][S.sel]);if(c.rng>40){g.strokeStyle='rgba(241,236,226,.6)';g.lineWidth=2;g.setLineDash([5,6]);g.beginPath();g.arc(S.mx,S.my,c.rng,0,7);g.stroke();g.setLineDash([])}if(!ok){g.strokeStyle=RED;g.lineWidth=5;g.beginPath();g.moveTo(S.mx-14,S.my-14);g.lineTo(S.mx+14,S.my+14);g.moveTo(S.mx+14,S.my-14);g.lineTo(S.mx-14,S.my+14);g.stroke()}}g.globalAlpha=1}}
      S.tw.forEach(function(t){tower(g,t)});
      S.u.slice().sort(function(a,b){return a.y-b.y}).forEach(function(u){var bob=u.c.sp&&u.cd<u.c.cd-.2?Math.sin(u.an)*1.5:0;if(u.hit>0)g.globalAlpha=.55;unit(g,u,u.x,u.y+bob,u.team,u.id,1,u.dir);g.globalAlpha=1;if(u.hp<u.max)bar(g,u.x,u.y-u.r-11,Math.max(20,u.r*2),u.hp/u.max,u.team)});
      S.fx.forEach(function(f){if(f.k==='shot'){g.strokeStyle=f.c;g.globalAlpha=Math.min(1,f.t/.14);g.lineWidth=3;g.beginPath();g.moveTo(f.x,f.y);g.lineTo(f.x2,f.y2);g.stroke();g.globalAlpha=1}
        else if(f.k==='ring'){g.strokeStyle=f.c;g.globalAlpha=Math.max(0,f.t/.35);g.lineWidth=3;g.beginPath();g.arc(f.x,f.y,(1-f.t/.35)*34+6,0,7);g.stroke();g.globalAlpha=1}
        else if(f.k==='p'){g.fillStyle=f.c;g.globalAlpha=Math.min(1,f.t*2);g.fillRect(f.x,f.y,5,5);g.globalAlpha=1}
        else if(f.k==='met'){var k=1-f.t/.7;g.fillStyle='rgba(20,18,16,.3)';g.beginPath();g.ellipse(f.x,f.y,30*k+6,12*k+3,0,0,7);g.fill();g.fillStyle='#ff8a1e';g.beginPath();g.arc(f.x+(1-k)*120,f.y-(1-k)*260,13,0,7);g.fill();g.fillStyle=YEL;g.beginPath();g.arc(f.x+(1-k)*120-3,f.y-(1-k)*260-3,6,0,7);g.fill()}
        else if(f.k==='boom'){var q=1-f.t/.4;g.fillStyle='rgba(255,138,30,'+(1-q)*.8+')';g.beginPath();g.arc(f.x,f.y,f.r*(.4+q*.7),0,7);g.fill();g.strokeStyle=YEL;g.globalAlpha=1-q;g.lineWidth=4;g.beginPath();g.arc(f.x,f.y,f.r*(.5+q*.7),0,7);g.stroke();g.globalAlpha=1}});
      /* bandeau du haut : temps */
      var tm=Math.max(0,Math.ceil(S.t));g.fillStyle=S.sd||S.t<60?RED:INK;ag.rr(g,W/2-52,6,104,26,6);g.fill();ag.mono(g,(S.sd?'MS ':'')+Math.floor(tm/60)+':'+('0'+tm%60).slice(-2)+(S.t<60&&!S.sd?' ×2':''),W/2,19,13,CR);
      ag.mono(g,'TOI',70,20,12,BLU);ag.mono(g,'ORDI',890,20,12,RED);
      /* bas : énergie et cartes */
      g.fillStyle=INK;g.fillRect(0,444,W,96);var e=S.e[0];ag.mono(g,'ÉNERGIE',120,462,11,CR);
      for(var s=0;s<10;s++){g.fillStyle=s<Math.floor(e)?'#b072e0':'#3a3640';ag.rr(g,22+s*20,476,17,22,3);g.fill();if(s===Math.floor(e)&&e<10){g.fillStyle='rgba(176,114,224,.55)';var hh=22*(e-Math.floor(e));ag.rr(g,22+s*20,476+22-hh,17,hh,2);g.fill()}}
      ag.txt(g,String(Math.floor(e)),120,518,26,'#d9b8f5');
      for(var ci=0;ci<4;ci++){var id=S.hand[0][ci],cc=CARDS[id],x=CX+ci*(CW+CG),sel=S.sel===ci,can=e>=cc.c,y=CY-(sel?8:0);
        g.fillStyle='rgba(0,0,0,.4)';ag.rr(g,x+3,CY+4,CW,CH,8);g.fill();g.fillStyle=can?'#fbf8f1':'#8d867c';ag.rr(g,x,y,CW,CH,8);g.fill();g.strokeStyle=sel?YEL:INK;g.lineWidth=sel?4:2.5;g.stroke();
        g.save();g.globalAlpha=can?1:.55;unit(g,null,x+34,y+36,0,id,cc.r>16?.75:cc.spell?1:1.05);g.restore();
        ag.mono(g,cc.n.toUpperCase(),x+CW/2,y+68,10,INK);ag.mono(g,String(ci+1),x+CW-12,y+CH-34,10,'rgba(20,18,16,.45)');
        g.fillStyle='#b072e0';g.beginPath();g.arc(x+CW-16,y+17,12,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();ag.txt(g,String(cc.c),x+CW-16,y+18,17,'#fff')}
      var nx=S.deck[0][0];if(nx){ag.mono(g,'SUIVANTE',770,462,10,CR);g.fillStyle='#cfc8ba';ag.rr(g,742,472,56,56,7);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();unit(g,null,770,498,0,nx,.7)}
      if(S.sel>=0){ag.mono(g,CARDS[S.hand[0][S.sel]].d,880,500,10,YEL);ag.mono(g,'clique le terrain',880,516,9,'rgba(241,236,226,.6)')}
      if(S.warn>0){g.globalAlpha=Math.min(1,S.warn*2);g.fillStyle=RED;ag.rr(g,W/2-230,400,460,28,6);g.fill();ag.mono(g,S.wtxt,W/2,414,12,'#fff');g.globalAlpha=1}}
  });
})();
