/* Pixel Pause — DEFEND MONTREUIL : tower defense à invocations, jeu original.
   Deux territoires de 4 × 8 cases, chacun entouré d'un chemin où les ennemis tournent en rond.
   On invoque des gardiens au hasard contre de l'or (commune grise, rare bleue, épique violette,
   légendaire dorée, mythique rouge), 3 gardiens identiques sur une case se fusionnent en un gardien
   de rareté supérieure. 80 vagues de slimes, un boss toutes les 10 vagues, boss final à la vague 80.
   On perd si plus de 100 ennemis tournent en même temps, ou si un boss n'est pas battu à temps.
   Solo avec un allié ordi sur l'autre territoire, ou à 2 en salon (chacun son territoire).
   Partie solo sauvegardée au début de chaque vague. Format téléphone vertical : plateau en hauteur. */
(function(){
  'use strict';
  var sfx=PP.sfx,net=PP.net,INK='#141210',CR='#f1ece2';
  var RAR=[{n:'Commune',c:'#a3a8ad',d:'#55595e'},{n:'Rare',c:'#3a8cff',d:'#17448e'},{n:'Épique',c:'#a04ee0',d:'#55207f'},{n:'Légendaire',c:'#f3c623',d:'#8f700a'},{n:'Mythique',c:'#e2361b',d:'#7d1606'}];
  /* dmg : dégâts par coup, cd : secondes entre 2 coups, rng : portée en cases, spl : zone, ch : rebonds, slow : ralentit, stun : étourdit, aura : accélère les voisins */
  /* les unités d'Anis. sh : nom court sur la case, p : passif */
  var U={
    luc:{n:'Luciathe',r:0,dmg:9,cd:.8,rng:2.6,s:'arc'},
    oni:{n:'Onika',r:0,dmg:5,cd:.45,rng:2.2,s:'vis'},
    maz:{n:'Mazouka',r:0,dmg:12,cd:1.2,rng:2.3,spl:.6,s:'orb'},
    ban:{n:'Bankalex',r:0,dmg:18,cd:1,rng:1.6,s:'epee'},
    jui:{n:'Juinik',r:0,dmg:7,cd:.9,rng:2.5,slow:.25,s:'gel'},
    ily:{n:'Ilya',r:0,dmg:14,cd:1.3,rng:3.4,s:'arc'},
    tho:{n:'Thomas',r:0,dmg:8,cd:1,rng:2.4,ch:2,s:'ecl'},
    har:{n:'Haram',r:1,dmg:30,cd:.75,rng:3,s:'arc'},
    hal:{n:'Halal',r:1,dmg:26,cd:1.1,rng:2.6,spl:.9,s:'orb'},
    kas:{n:'Kasher',r:1,dmg:18,cd:.9,rng:2.6,slow:.4,s:'gel'},
    hlf:{n:'Halouf',r:1,dmg:22,cd:.5,rng:2.2,s:'epee'},
    bou:{n:'Bouzelouf',r:1,dmg:24,cd:1,rng:2.8,ch:3,s:'ecl'},
    cac:{n:'Caca',r:2,dmg:58,cd:1,rng:2.8,spl:1.1,bossx:1.3,s:'orb',p:'Odeur : +30 % de dégâts contre les boss'},
    pip:{n:'Pipi',r:2,dmg:40,cd:.5,rng:2.6,slow:.3,s:'goutte',p:'Flaque : ralentit les slimes de 30 %'},
    cha:{n:'Chameau',r:2,dmg:150,cd:1.3,rng:4.5,crit:.2,s:'vis',p:'Bosse : 20 % de coups critiques (×2)'},
    toi:{n:'Toilette',r:2,dmg:52,cd:1,rng:3,ch:4,aura:.15,s:'ecl',p:'Chasse d\'eau : les voisins attaquent 15 % plus vite'},
    vac:{n:'Vache',r:2,dmg:70,cd:1.1,rng:2.4,stun:.3,lait:10,s:'poing',p:'Lait : +4 pièces toutes les 10 s'},
    moi:{n:'Moise',r:3,dmg:190,cd:.95,rng:3.2,spl:1.3,push:12,s:'bou',p:'Mer ouverte : toutes les 12 s, repousse les slimes à portée'},
    exa:{n:'Exaucer',r:3,dmg:130,cd:.8,rng:3.6,ch:6,gemk:.03,s:'ecl',p:'Vœu : 3 % de chance de gagner une gemme par slime tué'},
    chi:{n:'Chirac',r:3,dmg:230,cd:1,rng:2.4,stun:.5,glob:.1,s:'poing',p:'Discours : +10 % de dégâts à tout ton territoire'},
    cdc:{n:'Croix-de-Chavaux',sh:'Chavaux',r:3,dmg:160,cd:.7,rng:3.8,vsl:.5,s:'vis',p:'Carrefour : +50 % de dégâts aux slimes ralentis ou étourdis'},
    gog:{n:'GOG',r:4,dmg:1300,cd:1.4,rng:3,spl:.9,stun:1,s:'poing',p:'Colosse : étourdit 1 s à chaque coup'},
    mag:{n:'MAGOG',r:4,dmg:450,cd:.6,rng:4,ch:5,nodec:1,s:'ecl',p:'Écho : ses éclairs rebondissent sans perdre de force'},
    son:{n:'SONGOKU',r:4,dmg:520,cd:.7,rng:4,spl:1.6,blast:8,s:'etoile',p:'Rafale : toutes les 8 s, frappe tous les slimes à portée (×3)'},
    h:{n:'H',r:4,dmg:300,cd:.35,rng:3.2,aura:.2,s:'lettre',p:'Hâte : les voisins attaquent 20 % plus vite'},
    cap:{n:'CAPORAL',r:4,dmg:800,cd:1,rng:3.4,spl:1.2,glob:.15,s:'galon',p:'Garde-à-vous : +15 % de dégâts à tout ton territoire'}
  };
  /* recettes des mythiques : 1 exemplaire de chaque, pris sur le territoire */
  var REC={gog:['har','cac','moi'],mag:['hal','pip','exa'],son:['tho','cha','chi'],h:['kas','toi','cdc'],cap:['ban','hlf','bou','vac']},RK=Object.keys(REC);
  var BYR=[[],[],[],[],[]];Object.keys(U).forEach(function(k){if(U[k].r<4)BYR[U[k].r].push(k)});
  var SELL=[8,20,50,130,350],PARI=[[2,1,.3],[3,2,.1]],GRP=[0,0,1,1,2],WMAX=80,LIM=100,PER=28;
  var HPT=2.6,BOSSM=22,TC=['#6fbf5a','#4fc0e0','#e0c94f','#e0884f','#c04fe0','#e04f8a','#9aa3ad','#5a6cff'],DIF={normal:{hp:1,n:'Normal'},dur:{hp:1.55,n:'Difficile'},online:{hp:1.25,n:'À 2'}};
  var EK=[{h:1,v:1.5,c:'#6fbf5a'},{h:.6,v:2.4,c:'#e8a23a'},{h:1.8,v:1.05,c:'#7d6bd6'},{h:BOSSM,v:.9,c:'#e2361b'}];
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function rnd(){return Math.random()}

  /* ---------- un territoire : grille de 32 cases + ennemis qui tournent autour ---------- */
  function terr(name){return {name:name,g:new Array(32).fill(null),e:[],gold:100,gems:0,cost:10,up:[0,0,0],fx:[],sel:-1,aura:null,kills:0}}
  function room(T){for(var i=0;i<32;i++)if(!T.g[i])return true;return false}
  function place(T,id){var i,em=[];for(i=0;i<32;i++){var c=T.g[i];if(c&&c.u===id&&c.n<3){c.n++;c.cd.push(.2);T.aura=null;return i}if(!c)em.push(i)}
    if(!em.length)return -1;i=pick(em);T.g[i]={u:id,n:1,cd:[.2]};T.aura=null;return i}
  function roll(){var x=rnd();return x<.006?3:x<.075?2:x<.33?1:0}
  function summon(T){if(T.gold<T.cost||!room(T))return null;T.gold-=T.cost;T.cost+=1;var id=pick(BYR[roll()]);T.last=place(T,id);return id}
  function fuse(T,i){var c=T.g[i];if(!c||c.n<3||U[c.u].r>=3)return null;var id=pick(BYR[U[c.u].r+1]);T.g[i]=null;T.last=place(T,id);return id}
  function have(T,id){var b=-1;for(var i=0;i<32;i++){var c=T.g[i];if(c&&c.u===id&&(b<0||c.n<T.g[b].n))b=i}return b}
  function canCraft(T,m){return REC[m].every(function(id){return have(T,id)>=0})}
  function craft(T,m){if(!canCraft(T,m))return null;REC[m].forEach(function(id){var i=have(T,id),c=T.g[i];c.n--;c.cd.pop();if(c.n<=0)T.g[i]=null});T.aura=null;T.last=place(T,m);return m}
  function sell(T,i){var c=T.g[i];if(!c)return false;T.gold+=SELL[U[c.u].r];c.n--;c.cd.pop();if(c.n<=0)T.g[i]=null;T.aura=null;return true}
  function pari(T,k){var p=PARI[k];if(T.gems<p[1]||!room(T))return 0;T.gems-=p[1];if(rnd()>=p[2])return -1;var id=pick(BYR[p[0]]);T.last=place(T,id);return id}
  function upCost(T,k){var l=T.up[k];return k===0?30+30*l:k===1?80+60*l:2+l}
  function upgrade(T,k){var c=upCost(T,k);if(k<2){if(T.gold<c)return false;T.gold-=c}else{if(T.gems<c)return false;T.gems-=c}T.up[k]++;return true}
  function move(T,a,b){var A=T.g[a],B=T.g[b];if(!A)return;if(B&&B.u===A.u&&B.n+A.n<=3){B.n+=A.n;B.cd=B.cd.concat(A.cd);T.g[a]=null}else{T.g[a]=B;T.g[b]=A}T.aura=null}
  function mult(T,id){return (1+.15*T.up[GRP[U[id].r]]+(T.gb||0))*(T.bonus||1)}
  function auraMap(T){var m=new Array(32).fill(0),gc=0,gp=0;T.g.forEach(function(c){if(c&&U[c.u].glob){if(c.u==='chi')gc+=c.n;else gp+=c.n}});T.gb=Math.min(.3,gc*.1)+Math.min(.45,gp*.15);for(var i=0;i<32;i++){var c=T.g[i];if(!c||!U[c.u].aura)continue;var cx=i%8,cy=i/8|0;
      for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var x=cx+dx,y=cy+dy;if((dx||dy)&&x>=0&&x<8&&y>=0&&y<4)m[y*8+x]=Math.min(.5,m[y*8+x]+U[c.u].aura*c.n/3)}}return m}
  /* position sur le chemin : rectangle de (-0.5,-0.5) à (8.5,4.5), en unités de case */
  function pos(s,o){s=((s%PER)+PER)%PER;if(s<9){o.x=-.5+s;o.y=-.5}else if(s<14){o.x=8.5;o.y=-.5+(s-9)}else if(s<23){o.x=8.5-(s-14);o.y=4.5}else{o.x=-.5;o.y=4.5-(s-23)}return o}
  /* PV : +12 % à chaque vague, et un gros palier à chaque dizaine (vague 11, 21, 31…) */
  function hpOf(w,D){var t=Math.floor((w-1)/10);return 20*(1+.12*((w-1)%10))*Math.pow(HPT,t)*D.hp}
  function enemy(w,D,boss){var x=rnd(),k=boss?3:w%5===3?(x<.5?1:0):w%5===4?(x<.3?2:0):(x<.1?1:x<.18?2:0),K=EK[k],h=hpOf(w,D)*K.h*(boss?(w>=WMAX?3:1)*(1+w/40):1);return {s:0,hp:h,max:h,v:K.v,k:k,boss:boss,sl:0,slf:0,st:0,x:-.5,y:-.5,hit:0}}

  function hurt(T,e,d,u){if(e.hp<=0)return;e.hp-=d;e.by=u;e.hit=.1;if(u.slow){e.sl=1.6;e.slf=u.slow}if(u.stun)e.st=Math.max(e.st,e.boss?u.stun*.25:u.stun)}
  function strike(T,cx,cy,u,id,tg,dmg){
    hurt(T,tg,dmg,u);var col=RAR[u.r].c;
    if(T.fx.length<70)T.fx.push({k:'shot',x1:cx,y1:cy,x2:tg.x,y2:tg.y,t:.14,c:col});
    if(u.spl){T.e.forEach(function(o){if(o!==tg&&Math.hypot(o.x-tg.x,o.y-tg.y)<u.spl)hurt(T,o,dmg*.7,u)});if(T.fx.length<70)T.fx.push({k:'boom',x:tg.x,y:tg.y,r:u.spl,t:.25,c:col})}
    if(u.ch){var prev=tg,done=[tg],d=dmg;for(var j=1;j<u.ch;j++){var nx=null,nd=1.8;T.e.forEach(function(o){if(done.indexOf(o)<0&&o.hp>0){var dd=Math.hypot(o.x-prev.x,o.y-prev.y);if(dd<nd){nd=dd;nx=o}}});if(!nx)break;if(!u.nodec)d*=.85;hurt(T,nx,d,u);done.push(nx);if(T.fx.length<70)T.fx.push({k:'shot',x1:prev.x,y1:prev.y,x2:nx.x,y2:nx.y,t:.14,c:col});prev=nx}}}
  /* avance un territoire : les ennemis tournent, les gardiens tirent. Renvoie l'or gagné et si un boss est mort */
  function stepTerr(T,w,dt){
    var out={boss:false};
    T.e.forEach(function(e){e.hit=Math.max(0,e.hit-dt);if(e.st>0){e.st-=dt}else{var f=e.sl>0?1-e.slf:1;e.s=(e.s+e.v*f*dt)%PER}if(e.sl>0)e.sl-=dt;pos(e.s,e)});
    if(!T.aura)T.aura=auraMap(T);
    for(var i=0;i<32;i++){var c=T.g[i];if(!c)continue;var u=U[c.u],cx=i%8+.5,cy=(i/8|0)+.5,m=mult(T,c.u),sp=1+T.aura[i];
      for(var k=0;k<c.n;k++){c.cd[k]-=dt*sp;if(c.cd[k]>0)continue;
        var tg=null,bd=u.rng;for(var j=0;j<T.e.length;j++){var e=T.e[j];if(e.hp<=0)continue;var d=Math.hypot(e.x-cx,e.y-cy)-(e.boss?.3:0);if(d<=bd&&(!tg||e.boss&&!tg.boss||d<bd&&!(tg.boss&&!e.boss))){tg=e;bd=e.boss?u.rng:d}}
        if(!tg){c.cd[k]=0;continue}
        c.cd[k]=u.cd*(.9+rnd()*.2);c.at=.15;var dm=u.dmg*m;if(u.bossx&&tg.boss)dm*=u.bossx;if(u.vsl&&(tg.sl>0||tg.st>0))dm*=1+u.vsl;if(u.crit&&rnd()<u.crit){dm*=2;if(T.fx.length<70)T.fx.push({k:'txt',x:tg.x,y:tg.y,s:'CRIT',t:.5,c:'#f3c623'})}strike(T,cx,cy,u,c.u,tg,dm)}
      /* passifs à minuterie : Lait, Mer ouverte, Rafale */
      if(u.lait){c.pt=(c.pt==null?u.lait:c.pt)-dt;if(c.pt<=0){c.pt=u.lait;T.gold+=4*c.n;if(T.fx.length<70)T.fx.push({k:'txt',x:cx,y:cy-.3,s:'+'+4*c.n,t:.9,c:'#f3c623'})}}
      if(u.push||u.blast){var per=u.push||u.blast;c.pt=(c.pt==null?per:c.pt)-dt;if(c.pt<=0){var near=T.e.filter(function(e){return e.hp>0&&Math.hypot(e.x-cx,e.y-cy)<=u.rng});if(near.length){c.pt=per;
        if(u.push)near.forEach(function(e){if(!e.boss)e.s=(e.s-2.5+PER)%PER});else near.forEach(function(e){hurt(T,e,u.dmg*m*3*c.n,u)});
        if(T.fx.length<70)T.fx.push({k:'boom',x:cx,y:cy,r:u.rng,t:.4,c:u.push?'#7fd0ff':'#ffb020'})}else c.pt=.5}}
      if(c.at>0)c.at-=dt}
    var gold=2;
    T.e=T.e.filter(function(e){if(e.hp>0)return true;T.kills++;if(e.boss){T.gold+=40+w*3;T.gems+=3+Math.floor(w/10);out.boss=true}else T.gold+=gold;if(e.by&&e.by.gemk&&rnd()<e.by.gemk){T.gems++;if(T.fx.length<70)T.fx.push({k:'txt',x:e.x,y:e.y,s:'+1 gemme',t:.9,c:'#4fe0d0'})}
      if(T.fx.length<70)T.fx.push({k:'die',x:e.x,y:e.y,t:.3,c:EK[e.k].c,r:e.boss?.7:.3});return false});
    T.fx.forEach(function(f){f.t-=dt});T.fx=T.fx.filter(function(f){return f.t>0});
    return out}
  /* l'allié ordi : il invoque, fusionne, vend quand c'est plein et améliore */
  function bot(T){
    for(var i=0;i<32;i++){var c=T.g[i];if(c&&c.n===3&&U[c.u].r<3){fuse(T,i);return}}
    for(i=0;i<RK.length;i++)if(canCraft(T,RK[i])){craft(T,RK[i]);return}
    if(T.gems>=upCost(T,2)+2&&T.g.some(function(c){return c&&U[c.u].r===4})){upgrade(T,2);return}
    if(T.gems>=2&&rnd()<.6){pari(T,rnd()<.5?1:0);return}
    if(!room(T)&&T.gold>=T.cost){var lo=-1,lr=9;for(i=0;i<32;i++){c=T.g[i];if(c&&c.n<3&&U[c.u].r<lr){lr=U[c.u].r;lo=i}}if(lo>=0&&lr<2)sell(T,lo);return}
    for(var k=0;k<2;k++)if(T.gold>=upCost(T,k)+T.cost*1.5&&T.up[k]<=T.up[1-k]+(k?0:1)){upgrade(T,k);return}
    if(T.gold>=T.cost)summon(T)}

  /* ---------- partie ---------- */
  var G=null,CP=null,P=null,LY=null,sendT=0,botT=0,ON=null;
  function solo(){return G&&G.ally==='bot'}
  function newGame(mode,ally,names){var D=DIF[mode]||DIF.normal;G={mode:mode,D:D,w:0,t:3,spawnN:0,spawnT:0,iv:1,T:[terr(names[0]),terr(names[1])],ally:ally,over:false,done:false,pdone:false,warn:0,wtxt:'',time:0};
    P=null;G.T[1].name=names[1];if(ally==='bot')G.T[1].bonus=1.4;nextWave()}
  function nextWave(){G.w++;var b=G.w%10===0;G.boss=b;G.t=b?60:24;G.spawnN=b?1:15+2*(G.w-1);G.iv=b?0:Math.min(.9,17/G.spawnN);G.spawnT=.5;
    G.T.forEach(function(T,i){if(i===1&&G.ally!=='bot')return;if(G.w>1)T.gems+=1});
    if(b){G.warn=2.5;G.wtxt='BOSS ! Bats-le avant la fin du temps';if(CP){CP.pop('BOSS !','#e2361b','70px');sfx.play('lose')}}
    else if(CP&&G.w>1){CP.pop('VAGUE '+G.w,'#f1ece2','56px');sfx.play('tick')}
    if(solo())save()}
  function ser(T){return {g:T.g.map(function(c){return c?[c.u,c.n]:0}),gold:T.gold,gems:T.gems,cost:T.cost,up:T.up,e:T.e.map(function(e){return [+e.s.toFixed(2),Math.round(e.hp),Math.round(e.max),e.k,e.boss?1:0]})}}
  function unser(T,o){T.g=o.g.map(function(c){return c&&U[c[0]]?{u:c[0],n:c[1],cd:new Array(c[1]).fill(.3)}:null});T.gold=o.gold;T.gems=o.gems;T.cost=o.cost;T.up=o.up;
    T.e=(o.e||[]).map(function(a){var K=EK[a[3]]||EK[0];return {s:a[0],hp:a[1],max:a[2],v:K.v,k:a[3],boss:!!a[4],sl:0,slf:0,st:0,x:0,y:0,hit:0}});T.aura=null}
  function save(){try{PP.text('garde-save',JSON.stringify({v:1,mode:G.mode,w:G.w,me:ser(G.T[0]),al:ser(G.T[1])}))}catch(e){}}
  function loadSave(){try{var s=JSON.parse(PP.text('garde-save'));if(s&&s.v===1&&s.w>0)return s}catch(e){}return null}
  function clearSave(){PP.text('garde-save','')}
  function resume(s){newGame(s.mode,'bot',[PP.myName()||'Toi','Allié ordi']);G.w=s.w-1;nextWave();unser(G.T[0],s.me);unser(G.T[1],s.al);G.t=G.boss?60:24}

  function finish(C,win,why){if(!G||G.over)return;G.over=true;C.stop();var w=G.w;C.best('vague',win?WMAX+1:w);
    if(solo())clearSave();
    if(win){C.win();sfx.play('win');C.pop('VICTOIRE !','#f3c623','80px')}else{sfx.play('lose');C.shake(10)}
    if(G.mode==='online'&&G.ally==='net'&&!G.fromNet)net.relay({t:win?'gd-done':'gd-x',why:why});
    var best=C.best('vague');
    setTimeout(function(){if(!G||!G.over)return;
      var again=G.mode!=='online'||net.isHost;
      C.over(win?'Victoire !':'Défaite',(win?'Le boss final de la vague 80 est tombé. Bravo !':(why||'Trop d\'ennemis sur le chemin.')+'<br>Tu as tenu jusqu\'à la <b>vague '+w+'</b>.')+'<br>Record : vague '+(best>WMAX?'80 (gagné)':best),
        again?'Rejouer':false,again?function(){if(G.mode==='online')hostStart(C);else{startSolo(C);C.go()}}:null);
      if(!again)CP.over(win?'Victoire !':'Défaite',PP.$('garde-msg').innerHTML+'<br>Le chef du salon peut relancer.',false)},1300)}

  function wheelStep(C,dt){var W=G.wheel;if(!W)return;W.t+=dt;var f=Math.min(1,W.t/W.dur),r=W.end*(1-Math.pow(1-f,3)),seg=Math.floor(r/(Math.PI/8));if(seg!==W.tick&&f<1){W.tick=seg;sfx.play('tick')}W.rot=r;
    if(W.t>=W.dur&&!W.done){W.done=true;var T=G.T[0];if(W.win){var id=pick(BYR[PARI[W.k][0]]);T.last=place(T,id);if(T.last<0){T.gems+=PARI[W.k][1];say('Plus de place : gemmes rendues',0)}else got(C,id,'Pari gagné : ')}else{say('Raté…',0);sfx.play('lose')}}
    if(W.t>=W.dur+.9)G.wheel=null}
  function step(C,dt){if(!G||G.over)return;G.time+=dt;wheelStep(C,dt);G.warn=Math.max(0,G.warn-dt);
    G.t-=dt;var loc=G.ally==='bot'?G.T:[G.T[0]];
    if(G.spawnN>0){G.spawnT-=dt;while(G.spawnN>0&&G.spawnT<=0){loc.forEach(function(T){T.e.push(enemy(G.w,G.D,G.boss))});G.spawnN--;G.spawnT+=G.iv||1}}
    loc.forEach(function(T){stepTerr(T,G.w,dt)});
    if(G.ally==='bot'){botT-=dt;if(botT<=0){botT=.7+rnd()*.5;bot(G.T[1])}}
    else if(P){P.e.forEach(function(e){e.s=(e.s+e.v*dt)%PER});P.fx.forEach(function(f){f.t-=dt});P.fx=P.fx.filter(function(f){return f.t>0})}
    if(G.ally==='net'){sendT-=dt;if(sendT<=0){sendT=.2;sync()}}
    var n=G.T[0].e.length+(G.ally==='bot'?G.T[1].e.length:(P?P.n:0));G.count=n;
    if(n>=LIM){finish(C,false,LIM+' slimes sur le terrain : Montreuil est envahie !');return}
    if(G.boss){var alive=loc.some(function(T){return T.e.some(function(e){return e.boss})});
      if(!alive&&G.spawnN===0){if(G.w>=WMAX){if(G.ally==='net'&&!G.pdone){if(!G.done){G.done=true;G.wtxt='Boss battu ! On attend ton allié';G.warn=999;net.relay({t:'gd-boss30'})}}else finish(C,true)}else{C.pop('BOSS BATTU !','#f3c623','60px');sfx.play('win');nextWave()}}
      else if(G.t<=0&&alive){finish(C,false,'Le boss n\'a pas été battu à temps.');return}}
    else if(G.t<=0)nextWave()}

  /* ---------- salon à 2 ---------- */
  function sync(){var T=G.T[0];net.relay({t:'gd-s',g:T.g.map(function(c){return c?c.u+':'+c.n:0}),e:T.e.slice(0,110).map(function(e){return [+e.s.toFixed(2),Math.max(1,Math.round(e.hp/e.max*99)),e.k,e.boss?1:0,+((e.st>0?0:e.sl>0?1-e.slf:1)*e.v).toFixed(2)]}),n:T.e.length,w:G.w,gold:T.gold,nm:G.T[0].name})}
  function onNet(C,m){if(m.t!=='rel'||!m.d)return;var d=m.d;
    if(d.t==='gd-go'){if(net.isHost)return;var sl=net.slot(net.me.id);
      if(sl>1){G=null;C.over('Partie à 2 joueurs','DEFEND MONTREUIL se joue à <b>2 maximum</b>. Cette partie a déjà ses 2 joueurs.',false);return}
      newGame('online','net',[net.me.name||'Toi',d.host||'Allié']);C.go();return}
    if(!G||G.ally!=='net')return;
    if(d.t==='gd-s'){var old=P;P={g:d.g.map(function(s){if(!s)return null;var a=String(s).split(':');return U[a[0]]?{u:a[0],n:+a[1]||1}:null}),e:d.e.map(function(a){var o={s:a[0],hp:a[1],max:99,k:a[2],boss:!!a[3],v:a[4],x:0,y:0};return o}),n:d.n,w:d.w,gold:d.gold,fx:old?old.fx:[]};if(d.nm)G.T[1].name=d.nm;return}
    if(d.t==='gd-x'&&!G.over){G.fromNet=true;finish(C,false,'Ton allié a été débordé.');return}
    if(d.t==='gd-boss30'){G.pdone=true;if(G.done&&!G.over)finish(C,true);return}
    if(d.t==='gd-done'&&!G.over){G.fromNet=true;finish(C,true)}}
  function hostStart(C){var pl=net.players,mate=pl.filter(function(p){return p.id!==net.me.id})[0];
    if(!mate){newGame('online','bot',[net.me.name||'Toi','Allié ordi']);PP.toast('Tu es seul dans le salon : un allié ordi prend l\'autre territoire');C.go();return}
    newGame('online','net',[net.me.name||'Toi',mate.name||'Allié']);net.relay({t:'gd-go',host:net.me.name||'Chef'});C.go()}
  function startSolo(C){clearSave();newGame(C.mode,'bot',[PP.myName()||'Toi','Allié ordi'])}

  /* ---------- mise en page : paysage (PC, téléphone couché) ou vertical (téléphone en hauteur) ---------- */
  function tall(){return document.body.classList.contains('pp-touch')&&innerHeight>innerWidth}
  function layout(C){var v=tall();if(LY&&LY.v===v)return;
    if(v)LY={v:v,W:540,H:960,ter:[{ox:10,oy:282,cs:52},{ox:90,oy:56,cs:36}],
      b:{info:[10,600,520,80],sum:[10,688,250,112],fus:[270,688,125,112],sel:[405,688,125,112],p0:[10,812,166,66],p1:[187,812,166,66],rec:[364,812,166,66],u0:[10,886,166,66],u1:[187,886,166,66],u2:[364,886,166,66]}};
    else LY={v:v,W:960,H:540,ter:[{ox:20,oy:62,cs:44},{ox:500,oy:62,cs:44}],
      b:{info:[20,334,300,92],sum:[336,330,288,100],fus:[640,334,145,92],sel:[795,334,145,92],p0:[20,442,140,88],p1:[170,442,140,88],rec:[320,442,140,88],u0:[500,442,140,88],u1:[650,442,140,88],u2:[800,442,140,88]}};
    C.W=LY.W;C.H=LY.H;C.cv.width=LY.W;C.cv.height=LY.H}
  function inR(r,x,y){return x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3]}
  function cellAt(x,y){var t=LY.ter[0],gx=(x-t.ox)/t.cs-1,gy=(y-t.oy)/t.cs-1;if(gx<0||gx>=8||gy<0||gy>=4)return -1;return (gy|0)*8+(gx|0)}

  /* ---------- actions du joueur ---------- */
  function say(t,ok){G.wtxt=t;G.warn=1.8;G.wok=ok}
  function act(C,a){if(!G||G.over||!C.running)return;var T=G.T[0],id;
    if(a==='sum'){if(!room(T)){say('Plus de place : fusionne ou vends',0);sfx.play('lose');return}if(T.gold<T.cost){say('Pas assez d\'or',0);return}id=summon(T);got(C,id,'');return}
    if(a==='fus'){var c=T.g[T.sel];if(!c){say('Choisis d\'abord une case',0);return}if(c.n<3){say('Il faut 3 '+U[c.u].n+' sur la case',0);return}if(U[c.u].r>=3){say('Les mythiques se créent avec les RECETTES',0);return}id=fuse(T,T.sel);T.sel=T.last;got(C,id,'Fusion : ');return}
    if(a==='sel'){if(T.sel<0||!T.g[T.sel]){say('Choisis d\'abord une case',0);return}var r=U[T.g[T.sel].u].r;sell(T,T.sel);say('+'+SELL[r]+' or',1);sfx.play('tick');if(!T.g[T.sel])T.sel=-1;return}
    if(a==='rec'){G.rec=!G.rec;sfx.play('ui');return}
    if(a==='p0'||a==='p1'){var k=+a[1],p=PARI[k];if(G.wheel){return}if(T.gems<p[1]){say('Il faut '+p[1]+' gemme'+(p[1]>1?'s':''),0);return}if(!room(T)){say('Plus de place',0);return}
      /* la roue : une part gagnante (couleur de la rareté) et une part « raté », elle tourne puis s'arrête sur le résultat */
      T.gems-=p[1];var win=rnd()<p[2],A=Math.PI*2,la=win?(.15+rnd()*.7)*p[2]*A:(p[2]+(.1+rnd()*.8)*(1-p[2]))*A;
      G.wheel={k:k,win:win,t:0,dur:2.4,end:-Math.PI/2-la+A*5,tick:0};sfx.play('ui');return}
    if(a[0]==='u'){k=+a[1];if(!upgrade(T,k)){say(k<2?'Pas assez d\'or':'Pas assez de gemmes',0);return}say('Amélioration niveau '+T.up[k]+' !',1);sfx.play('pickup')}}
  function got(C,id,pre){if(!id)return;var u=U[id];say(pre+u.n+' ('+RAR[u.r].n.toLowerCase()+')',1);
    if(u.r>=3){C.pop(RAR[u.r].n.toUpperCase()+' !',RAR[u.r].c,'54px');sfx.play('win')}else if(u.r===2){C.pop('ÉPIQUE !',RAR[2].c,'42px');sfx.play('go')}else sfx.play('pickup')}

  /* ---------- dessin ---------- */
  function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
  function txt(g,s,x,y,sz,col,al,wt){g.font=(wt||'700')+' '+sz+'px Inter, system-ui, sans-serif';g.fillStyle=col||CR;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,x,y)}
  function big(g,s,x,y,sz,col,al){g.font='400 '+sz+'px Anton, Impact, sans-serif';g.fillStyle=col||CR;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,x,y)}
  function gem(g,x,y,r){g.fillStyle='#4fe0d0';g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*.8,y);g.lineTo(x,y+r);g.lineTo(x-r*.8,y);g.closePath();g.fill()}
  function coin(g,x,y,r){g.fillStyle='#f3c623';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.fillStyle='#b88a0a';g.beginPath();g.arc(x,y,r*.5,0,7);g.fill()}
  function icon(g,s,x,y,r){g.save();g.strokeStyle=INK;g.fillStyle=INK;g.lineWidth=Math.max(2,r*.16);g.lineCap='round';g.lineJoin='round';g.beginPath();
    if(s==='arc'){g.arc(x-r*.2,y,r*.7,-1.2,1.2);g.moveTo(x-r*.2+Math.cos(-1.2)*r*.7,y+Math.sin(-1.2)*r*.7);g.lineTo(x-r*.2+Math.cos(1.2)*r*.7,y+Math.sin(1.2)*r*.7);g.moveTo(x-r*.5,y);g.lineTo(x+r*.8,y);g.stroke()}
    else if(s==='orb'){g.arc(x,y,r*.45,0,7);g.fill()}
    else if(s==='epee'){g.moveTo(x-r*.6,y+r*.6);g.lineTo(x+r*.6,y-r*.6);g.moveTo(x-r*.55,y+r*.1);g.lineTo(x-r*.1,y+r*.55);g.stroke()}
    else if(s==='gel'){for(var i=0;i<3;i++){var a=i*Math.PI/3;g.moveTo(x-Math.cos(a)*r*.7,y-Math.sin(a)*r*.7);g.lineTo(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7)}g.stroke()}
    else if(s==='vis'){g.arc(x,y,r*.5,0,7);g.moveTo(x-r*.8,y);g.lineTo(x+r*.8,y);g.moveTo(x,y-r*.8);g.lineTo(x,y+r*.8);g.stroke()}
    else if(s==='feu'){g.moveTo(x,y-r*.8);g.quadraticCurveTo(x+r*.7,y,x+r*.35,y+r*.6);g.lineTo(x-r*.35,y+r*.6);g.quadraticCurveTo(x-r*.7,y,x,y-r*.8);g.fill()}
    else if(s==='ecl'){g.moveTo(x+r*.2,y-r*.8);g.lineTo(x-r*.35,y+r*.05);g.lineTo(x+r*.15,y+r*.05);g.lineTo(x-r*.2,y+r*.8);g.stroke()}
    else if(s==='bou'){g.moveTo(x-r*.55,y-r*.6);g.lineTo(x+r*.55,y-r*.6);g.lineTo(x+r*.5,y+r*.1);g.quadraticCurveTo(x,y+r*.8,x,y+r*.8);g.quadraticCurveTo(x,y+r*.8,x-r*.5,y+r*.1);g.closePath();g.fill()}
    else if(s==='goutte'){g.moveTo(x,y-r*.8);g.quadraticCurveTo(x+r*.65,y+r*.1,x,y+r*.65);g.quadraticCurveTo(x-r*.65,y+r*.1,x,y-r*.8);g.fill()}
    else if(s==='etoile'){for(var j=0;j<10;j++){var a2=j*Math.PI/5-Math.PI/2,rr2=j%2?r*.35:r*.85;if(j)g.lineTo(x+Math.cos(a2)*rr2,y+Math.sin(a2)*rr2);else g.moveTo(x+Math.cos(a2)*rr2,y+Math.sin(a2)*rr2)}g.closePath();g.fill()}
    else if(s==='lettre'){g.font='900 '+(r*1.7)+'px Inter, system-ui, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('H',x,y+r*.05)}
    else if(s==='galon'){for(var j=0;j<3;j++){g.moveTo(x-r*.7,y-r*.5+j*r*.45);g.lineTo(x,y-r*.1+j*r*.45);g.lineTo(x+r*.7,y-r*.5+j*r*.45)}g.stroke()}
    else if(s==='poing'){rr(g,x-r*.5,y-r*.45,r,r*.9,r*.25);g.fill()}
    g.restore()}
  function unitTile(g,x,y,cs,c,sel,at){var u=U[c.u],R=RAR[u.r],p=cs*.08,w=cs-2*p,yy=y+(at>0?-cs*.05:0);
    g.fillStyle=R.d;rr(g,x+p,yy+p+2,w,w,cs*.16);g.fill();g.fillStyle=R.c;rr(g,x+p,yy+p,w,w-2,cs*.16);g.fill();
    if(u.r===4){g.strokeStyle='rgba(255,220,180,.9)';g.lineWidth=2;g.stroke()}
    icon(g,u.s,x+cs/2,yy+cs*.52,cs*.24);
    var nm=u.sh||u.n,fs=Math.max(7,cs*.2);g.font='800 '+fs+'px Inter, system-ui, sans-serif';var tw=g.measureText(nm).width;if(tw>w-4)fs*=(w-4)/tw;
    txt(g,nm,x+cs/2,yy+p+cs*.15,fs,INK,'center','800');
    for(var i=0;i<3;i++){g.fillStyle=i<c.n?INK:'rgba(20,18,16,.22)';g.beginPath();g.arc(x+cs/2+(i-1)*cs*.17,yy+cs*.8,cs*.055,0,7);g.fill()}
    if(sel){g.strokeStyle='#fff';g.lineWidth=3;rr(g,x+p-2,yy+p-2,w+4,w+4,cs*.18);g.stroke()}}
  function drawTerr(g,t,V,me,label,col,wv){var tm=G?G.time:0,tier=Math.floor(((wv||1)-1)/10);var cs=t.cs,X=function(gx){return t.ox+(gx+1)*cs},Y=function(gy){return t.oy+(gy+1)*cs};
    /* chemin */
    g.fillStyle='#c9a86a';rr(g,t.ox,t.oy,cs*10,cs*6,cs*.3);g.fill();
    g.strokeStyle='rgba(20,18,16,.25)';g.lineWidth=1.5;g.setLineDash([cs*.25,cs*.25]);g.strokeRect(X(-.5),Y(-.5),cs*9,cs*5);g.setLineDash([]);
    /* territoire */
    g.fillStyle=me?'#27402a':'#2a3240';g.fillRect(X(0),Y(0),cs*8,cs*4);
    for(var i=0;i<32;i++){var cx=X(i%8),cy=Y(i/8|0);g.fillStyle=(i+(i/8|0))%2?'rgba(255,255,255,.05)':'rgba(0,0,0,.08)';g.fillRect(cx+1,cy+1,cs-2,cs-2)}
    g.strokeStyle=col;g.lineWidth=3;g.strokeRect(X(0),Y(0),cs*8,cs*4);
    /* départ */
    g.fillStyle='rgba(20,18,16,.6)';g.beginPath();g.arc(X(-.5),Y(-.5),cs*.32,0,7);g.fill();
    /* gardiens */
    var sel=V.sel!=null?V.sel:-1;
    for(i=0;i<32;i++){var c=V.g[i];if(c)unitTile(g,X(i%8),Y(i/8|0),cs,c,i===sel,c.at)}
    if(sel>=0&&V.g[sel]){g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=2;g.setLineDash([6,5]);g.beginPath();g.arc(X(sel%8+.5),Y((sel/8|0)+.5),U[V.g[sel].u].rng*cs,0,7);g.stroke();g.setLineDash([])}
    /* tirs */
    (V.fx||[]).forEach(function(f){g.globalAlpha=Math.min(1,f.t*6);if(f.k==='txt'){txt(g,f.s,X(f.x),Y(f.y)-(1-f.t)*cs*.6,Math.max(11,cs*.3),f.c,'center','900')}else if(f.k==='shot'){g.strokeStyle=f.c;g.lineWidth=3;g.beginPath();g.moveTo(X(f.x1),Y(f.y1));g.lineTo(X(f.x2),Y(f.y2));g.stroke()}
      else{g.strokeStyle=f.c;g.lineWidth=f.k==='die'?2:3;g.beginPath();g.arc(X(f.x),Y(f.y),(f.k==='die'?(f.r||.3)*(1.5-f.t*2):f.r*(1.2-f.t*2))*cs,0,7);g.stroke()}});g.globalAlpha=1;
    /* ennemis */
    var o={x:0,y:0};
    V.e.forEach(function(e){pos(e.s,o);var x=X(o.x),y=Y(o.y),r=cs*(e.boss?.42:e.k===2?.3:e.k===1?.2:.24);
      /* petit slime qui rebondit */
      var wb=Math.sin(tm*9+e.s*2.3)*.1,rw=r*(1+wb),rh=r*(1-wb),cl=e.boss?EK[3].c:TC[tier%TC.length];
      g.fillStyle=e.hit>0?'#fff':cl;g.strokeStyle=INK;g.lineWidth=e.k===2||e.boss?3:2;g.beginPath();g.moveTo(x-rw,y+rh*.55);g.bezierCurveTo(x-rw,y-rh*1.45,x+rw,y-rh*1.45,x+rw,y+rh*.55);g.closePath();g.fill();g.stroke();
      g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(x-rw*.4,y-rh*.45,r*.18,0,7);g.fill();
      g.fillStyle='#fff';g.fillRect(x-r*.45,y-r*.2,r*.28,r*.3);g.fillRect(x+r*.17,y-r*.2,r*.28,r*.3);g.fillStyle=INK;g.fillRect(x-r*.33,y-r*.12,r*.14,r*.2);g.fillRect(x+r*.29,y-r*.12,r*.14,r*.2);
      if(e.k===1){g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1.5;g.beginPath();g.moveTo(x-rw-4,y);g.lineTo(x-rw-10,y);g.moveTo(x-rw-3,y+4);g.lineTo(x-rw-8,y+4);g.stroke()}
      if(e.boss){g.fillStyle='#f3c623';g.beginPath();g.moveTo(x-r*.6,y-r*.8);g.lineTo(x-r*.6,y-r*1.25);g.lineTo(x-r*.3,y-r);g.lineTo(x,y-r*1.35);g.lineTo(x+r*.3,y-r);g.lineTo(x+r*.6,y-r*1.25);g.lineTo(x+r*.6,y-r*.8);g.closePath();g.fill()}
      var hp=Math.max(0,e.hp/e.max);if(hp<1||e.boss){var bw=e.boss?cs*1.1:cs*.5;g.fillStyle='rgba(20,18,16,.8)';g.fillRect(x-bw/2,y-r-8,bw,4);g.fillStyle=e.boss?'#e2361b':'#3fe09a';g.fillRect(x-bw/2,y-r-8,bw*hp,4)}});
    /* nom */
    txt(g,label,X(-1)+6,t.oy-8,Math.max(11,cs*.3),col,'left','800')}

  function button(g,r,title,sub,col,on,hot){g.fillStyle=on?'rgba(20,18,16,.85)':'rgba(20,18,16,.45)';rr(g,r[0],r[1]+3,r[2],r[3],12);g.fill();
    g.fillStyle=on?(col||'#2b2723'):'#2b2723';rr(g,r[0],r[1],r[2],r[3]-3,12);g.fill();
    g.strokeStyle=hot?'#fff':'rgba(241,236,226,.18)';g.lineWidth=hot?3:1.5;g.stroke();
    var cx=r[0]+r[2]/2,big1=r[3]>100;
    txt(g,title,cx,r[1]+r[3]*(sub?.38:.5),big1?26:r[3]>80?17:15,on?(col==='#f3c623'?INK:CR):'rgba(241,236,226,.45)','center','800');
    if(sub)txt(g,sub,cx,r[1]+r[3]*.7,big1?16:12,on?(col==='#f3c623'?'rgba(20,18,16,.8)':'rgba(241,236,226,.85)'):'rgba(241,236,226,.35)','center','600')}

  function draw(C){var g=C.g;layout(C);var W=LY.W,H=LY.H;g.fillStyle='#1c1a18';g.fillRect(0,0,W,H);
    if(!G){txt(g,'DEFEND MONTREUIL',W/2,H/2,30);return}
    var T=G.T[0],me={g:T.g,e:T.e,fx:T.fx,sel:T.sel},al=G.ally==='bot'?{g:G.T[1].g,e:G.T[1].e,fx:G.T[1].fx}:(P||{g:[],e:[],fx:[]});
    drawTerr(g,LY.ter[1],al,false,G.T[1].name+(G.ally==='bot'?'':(P?' · vague '+P.w:' · connexion…')),'#7fb0ff',P&&G.ally!=='bot'?P.w:G.w);
    drawTerr(g,LY.ter[0],me,true,T.name==='Toi'?'Toi':T.name+' (toi)','#3fe09a',G.w);
    /* barre du haut : vague, temps, ennemis */
    var n=G.count||0,bw=LY.v?250:340,bx=(W-bw)/2,f=Math.min(1,n/LIM);
    big(g,'VAGUE '+G.w+'/'+WMAX,12,25,LY.v?21:26,G.boss?'#e2361b':CR,'left');
    var sec=Math.max(0,Math.ceil(G.t));txt(g,(G.boss&&!LY.v?'BOSS ':'')+Math.floor(sec/60)+':'+('0'+sec%60).slice(-2),W-14,25,LY.v?19:22,G.boss&&sec<10?'#e2361b':CR,'right','800');
    g.fillStyle='#000';rr(g,bx,8,bw,34,10);g.fill();g.fillStyle=f>.8?'#e2361b':f>.55?'#f3c623':'#3fe09a';rr(g,bx,8,Math.max(10,bw*f),34,10);g.fill();
    g.strokeStyle='rgba(241,236,226,.3)';g.lineWidth=1.5;rr(g,bx,8,bw,34,10);g.stroke();
    txt(g,'SLIMES '+n+' / '+LIM,bx+bw/2,25,LY.v?16:18,f>.55&&f<=.8?INK:CR,'center','900');
    /* panneau */
    var B=LY.b,r=B.info;g.fillStyle='#24211e';rr(g,r[0],r[1],r[2],r[3],12);g.fill();
    coin(g,r[0]+18,r[1]+18,9);txt(g,''+T.gold,r[0]+32,r[1]+18,17,'#f3c623','left','800');
    gem(g,r[0]+(LY.v?120:110),r[1]+18,9);txt(g,''+T.gems,r[0]+(LY.v?134:124),r[1]+18,17,'#4fe0d0','left','800');
    var c=T.sel>=0?T.g[T.sel]:null,dim='rgba(241,236,226,.65)';
    if(c){var u=U[c.u],m=mult(T,c.u),st=RAR[u.r].n+' · '+Math.round(u.dmg*m/u.cd*c.n)+' dégâts/s · portée '+u.rng+(u.spl?' · zone':'')+(u.ch?' · rebonds':'')+(u.slow?' · ralentit':'')+(u.stun?' · étourdit':''),pa=u.p?'Passif · '+u.p:'Pas de passif';
      if(LY.v){txt(g,u.n+' ×'+c.n,r[0]+200,r[1]+18,15,RAR[u.r].c,'left','800');txt(g,st,r[0]+14,r[1]+42,12,'rgba(241,236,226,.8)','left','600');txt(g,pa,r[0]+14,r[1]+63,11.5,u.p?'#f3c623':dim,'left','600')}
      else{txt(g,u.n+' ×'+c.n,r[0]+14,r[1]+40,15,RAR[u.r].c,'left','800');txt(g,st,r[0]+14,r[1]+60,11,'rgba(241,236,226,.8)','left','600');g.save();g.beginPath();g.rect(r[0],r[1],r[2]-6,r[3]);g.clip();txt(g,pa,r[0]+14,r[1]+79,10.5,u.p?'#f3c623':dim,'left','600');g.restore()}}
    else{txt(g,'Touche une unité pour la choisir, puis une',r[0]+14,r[1]+(LY.v?42:44),12,dim,'left','600');txt(g,'autre case pour la déplacer. 3 identiques = fusion.',r[0]+14,r[1]+(LY.v?62:64),12,dim,'left','600')}
    button(g,B.sum,'INVOQUER',T.cost+' or',  '#e8a23a',T.gold>=T.cost&&room(T),false);
    var canF=c&&c.n===3&&U[c.u].r<3;button(g,B.fus,'FUSION',canF?'→ '+RAR[U[c.u].r+1].n:c&&U[c.u].r>=3?'voir recettes':'3 identiques','#a04ee0',canF,canF);
    button(g,B.sel,'VENDRE',c?'+'+SELL[U[c.u].r]+' or':'1 unité','#55595e',!!c,false);
    var PN=['Épique','Légend.'];var nc=RK.filter(function(m){return canCraft(T,m)}).length;button(g,B.rec,'RECETTES',nc?nc+' mythique'+(nc>1?'s':'')+' prêt'+(nc>1?'s':'')+' !':'Mythiques','#7d1606',true,!!nc);
    PARI.forEach(function(p,k){button(g,B['p'+k],'PARI '+PN[k],p[1]+' gemme'+(p[1]>1?'s':'')+' · '+Math.round(p[2]*100)+' %',RAR[p[0]].d,T.gems>=p[1],false)});
    var UN=['Amél. C/R','Amél. É/L','Amél. Myth.'],UC=['#17448e','#55207f','#7d1606'];
    [0,1,2].forEach(function(k){var co=upCost(T,k);button(g,B['u'+k],UN[k]+' '+T.up[k],co+(k<2?' or':' gemmes'),UC[k],k<2?T.gold>=co:T.gems>=co,false)});
    /* message */
    if(G.warn>0&&G.wtxt){g.globalAlpha=Math.min(1,G.warn*2);var mt=LY.ter[0],my=mt.oy+mt.cs*3;g.font='800 16px Inter, system-ui, sans-serif';var tw=g.measureText(G.wtxt).width+28;
      g.fillStyle='rgba(20,18,16,.88)';rr(g,mt.ox+mt.cs*5-tw/2,my-18,tw,36,10);g.fill();txt(g,G.wtxt,mt.ox+mt.cs*5,my,16,G.wok?'#3fe09a':G.boss&&/BOSS/.test(G.wtxt)?'#e2361b':'#f3c623','center','800');g.globalAlpha=1}
    if(G.wheel)drawWheel(g);
    if(G.rec)drawRec(g)}

  function drawWheel(g){var W=G.wheel,p=PARI[W.k],t=LY.ter[0],cx=t.ox+t.cs*5,cy=t.oy+t.cs*3,R=t.cs*2.3,A=Math.PI*2,rot=W.rot||0,col=RAR[p[0]].c;
    g.fillStyle='rgba(10,9,8,.55)';g.beginPath();g.arc(cx,cy,R+18,0,A);g.fill();
    g.save();g.translate(cx,cy);g.rotate(rot);
    /* part gagnante puis 3 parts « raté » */
    g.fillStyle=col;g.beginPath();g.moveTo(0,0);g.arc(0,0,R,0,p[2]*A);g.closePath();g.fill();
    for(var i=0;i<3;i++){var a0=p[2]*A+(1-p[2])*A*i/3,a1=p[2]*A+(1-p[2])*A*(i+1)/3;g.fillStyle=i%2?'#3a3530':'#4a443d';g.beginPath();g.moveTo(0,0);g.arc(0,0,R,a0,a1);g.closePath();g.fill()}
    g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.arc(0,0,R,0,A);g.stroke();
    var mid=p[2]*A/2;g.save();g.rotate(mid);txt(g,RAR[p[0]].n.toUpperCase(),R*.58,0,Math.max(11,R*.16),INK,'center','900');g.restore();
    for(i=0;i<3;i++){g.save();g.rotate(p[2]*A+(1-p[2])*A*(i+.5)/3);txt(g,'RATÉ',R*.6,0,Math.max(10,R*.14),'rgba(241,236,226,.7)','center','800');g.restore()}
    g.restore();
    g.fillStyle='#24211e';g.beginPath();g.arc(cx,cy,R*.16,0,A);g.fill();g.strokeStyle=col;g.lineWidth=3;g.stroke();
    /* flèche en haut */
    g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(cx-12,cy-R-14);g.lineTo(cx+12,cy-R-14);g.lineTo(cx,cy-R+8);g.closePath();g.fill();g.stroke();
    if(W.done){g.globalAlpha=Math.min(1,(W.t-W.dur)*4);big(g,W.win?'GAGNÉ !':'RATÉ…',cx,cy+R+2,Math.max(26,R*.36),W.win?col:'#f1ece2');g.globalAlpha=1}}

  /* ---------- panneau des recettes des mythiques ---------- */
  function recBox(){return LY.v?[10,110,520,760]:[110,50,740,470]}
  function recRow(i){var b=recBox();return LY.v?[b[0]+10,b[1]+64+i*134,b[2]-20,124]:[b[0]+12,b[1]+60+i*80,b[2]-24,72]}
  function recBtn(i){var r=recRow(i);return LY.v?[r[0]+r[2]-150,r[1]+64,140,50]:[r[0]+r[2]-140,r[1]+12,128,48]}
  function recClose(){var b=recBox();return [b[0]+b[2]-56,b[1]+8,48,44]}
  function recClick(C,x,y){if(inR(recClose(),x,y)||!inR(recBox(),x,y)){G.rec=false;sfx.play('ui');return}
    var T=G.T[0];RK.forEach(function(m,i){if(inR(recBtn(i),x,y)){if(!canCraft(T,m)){say('Il manque des unités',0);sfx.play('lose');return}T.sel=-1;var id=craft(T,m);G.rec=false;got(C,id,'Invoqué : ')}})}
  function drawRec(g){var T=G.T[0],b=recBox();g.fillStyle='rgba(10,9,8,.7)';g.fillRect(0,0,LY.W,LY.H);
    g.fillStyle='#24211e';rr(g,b[0],b[1],b[2],b[3],16);g.fill();g.strokeStyle=RAR[4].c;g.lineWidth=3;g.stroke();
    big(g,'RECETTES DES MYTHIQUES',b[0]+20,b[1]+30,LY.v?24:28,RAR[4].c,'left');
    var cl=recClose();g.fillStyle='#3a3530';rr(g,cl[0],cl[1],cl[2],cl[3],10);g.fill();txt(g,'✕',cl[0]+cl[2]/2,cl[1]+cl[3]/2,20,CR,'center','800');
    RK.forEach(function(m,i){var r=recRow(i),u=U[m],ok=canCraft(T,m);g.fillStyle=ok?'#3a2420':'#2d2a26';rr(g,r[0],r[1],r[2],r[3],12);g.fill();
      var ts=LY.v?52:54;unitTile(g,r[0]+8,r[1]+(LY.v?8:9),ts,{u:m,n:0},false,0);
      txt(g,u.n,r[0]+ts+20,r[1]+(LY.v?20:20),LY.v?18:17,RAR[4].c,'left','900');
      var x=r[0]+ts+20,y=r[1]+(LY.v?46:44);g.font='700 13px Inter, system-ui, sans-serif';
      REC[m].forEach(function(id,j){var has=have(T,id)>=0,s=(j?' + ':'')+U[id].n;g.fillStyle=j?'rgba(241,236,226,.6)':CR;
        if(j){g.textAlign='left';g.textBaseline='middle';g.fillStyle='rgba(241,236,226,.5)';g.fillText(' + ',x,y);x+=g.measureText(' + ').width}
        g.fillStyle=has?'#3fe09a':RAR[U[id].r].c;g.globalAlpha=has?1:.55;g.fillText(U[id].n,x,y);x+=g.measureText(U[id].n).width;g.globalAlpha=1});
      txt(g,u.p,r[0]+(LY.v?14:ts+20),r[1]+(LY.v?74:62),11,'rgba(243,198,35,.9)','left','600');
      if(LY.v){}
      button(g,recBtn(i),'CRÉER',ok?'prêt !':'il manque…','#e2361b',ok,ok)});
    txt(g,'En vert : déjà sur ton territoire. Les unités utilisées disparaissent.',b[0]+b[2]/2,b[1]+b[3]-16,12,'rgba(241,236,226,.6)','center','600')}

  /* une petite règle de style : en vertical, le plateau ne dépasse pas l'écran */
  (function(){var s=document.createElement('style');s.textContent='.pp-touch #v-garde .stage.fs-on>canvas:first-child{width:auto;max-width:100%;max-height:calc(100dvh - 70px - env(safe-area-inset-top,0px));margin:0 auto}';document.head.appendChild(s)})();

  var INTRO='Invoque des gardiens au hasard avec ton or, et pose-les sur ton territoire. <b>3 gardiens identiques</b> sur une case se fusionnent en un gardien plus rare : <span style="color:#a3a8ad">commune</span>, <span style="color:#3a8cff">rare</span>, <span style="color:#a04ee0">épique</span>, <span style="color:#f3c623">légendaire</span>, <span style="color:#e2361b">mythique</span>.<br>Les slimes tournent autour des territoires : à '+LIM+' slimes sur le terrain, c\'est perdu. Un boss toutes les 10 vagues et un boss final à la vague 80.';
  PP.arcade({id:'garde',
    setup:function(C){CP=C;G=null;P=null;LY=null;layout(C);
      C.keysText('<kbd>Espace</kbd> invoquer · clic sur une unité puis sur une case pour la déplacer · <kbd>F</kbd> fusion · <kbd>V</kbd> vendre · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> paris · <kbd>4</kbd> <kbd>5</kbd> <kbd>6</kbd> améliorations');
      if(C.mode==='online'){
        C.listen(function(m){onNet(C,m)});
        if(net.isHost)C.over('DEFEND MONTREUIL · à 2',INTRO+'<br><b>À 2 maximum</b> : chacun défend son territoire, si l\'un craque, vous perdez tous les deux.','Lancer la partie',function(){hostStart(C)});
        else C.over('DEFEND MONTREUIL · à 2',INTRO+'<br>Le chef du salon lance la partie.',false);
        return}
      var s=loadSave();
      if(s&&s.mode===C.mode)C.over('DEFEND MONTREUIL',INTRO+'<br><br>Partie sauvegardée : <b>vague '+s.w+'</b>.<br><button type="button" class="primary" id="garde-new" style="margin-top:10px">Nouvelle partie</button>','Continuer (vague '+s.w+')',function(){resume(s);C.go()});
      else C.over('DEFEND MONTREUIL',INTRO,'Jouer')},
    start:function(C){startSolo(C)},
    key:function(C,code,down){if(!down)return;var A={Space:'sum',KeyF:'fus',KeyV:'sel',Digit1:'p0',Digit2:'p1',Digit3:'rec',Digit4:'u0',Digit5:'u1',Digit6:'u2',Numpad1:'p0',Numpad2:'p1',Numpad3:'rec',Numpad4:'u0',Numpad5:'u1',Numpad6:'u2'}[code];
      if(A)act(C,A);if(code==='Escape'&&G)G.T[0].sel=-1},
    mouse:function(C,t,x,y){if(t!=='down'||!G||G.over||!C.running)return;var B=LY.b;
      if(G.rec){recClick(C,x,y);return}
      for(var k in B)if(k!=='info'&&inR(B[k],x,y)){act(C,k);return}
      var T=G.T[0],i=cellAt(x,y);if(i<0){T.sel=-1;return}
      if(T.sel<0){if(T.g[i]){T.sel=i;sfx.play('tick')}return}
      if(T.sel===i){T.sel=-1;return}
      move(T,T.sel,i);T.sel=T.g[i]?i:-1;sfx.play('tick')},
    step:function(C,dt){step(C,dt)},
    draw:function(C){draw(C)},
    close:function(){G=null;P=null}
  });
  document.addEventListener('click',function(e){if(e.target&&e.target.id==='garde-new'&&CP){clearSave();startSolo(CP);CP.go()}});
  window.addEventListener('resize',function(){if(CP&&PP.cur()==='garde'){LY=null;layout(CP)}});
  /* pour les tests */
  PP.gardeSim={terr:terr,summon:summon,fuse:fuse,bot:bot,stepTerr:stepTerr,enemy:enemy,DIF:DIF,U:U,hpOf:hpOf};
})();
