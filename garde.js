/* Pixel Pause — DEFEND MONTREUIL : tower defense à invocations, jeu original.
   Deux territoires de 4 × 8 cases l'un au-dessus de l'autre. Chacun est entouré d'un chemin, et le chemin du milieu
   est partagé : les slimes sortent du camp de chaque joueur, passent entre les deux territoires, et les unités des deux
   joueurs peuvent les taper. On invoque des unités au hasard (commune grise, rare bleue, épique violette, légendaire dorée,
   mythique rouge), 3 identiques sur une case se fusionnent, les mythiques se créent par recettes.
   80 vagues, un boss toutes les 10 vagues, boss final à la vague 80. Perdu à 100 slimes sur le terrain.
   Solo avec un allié ordi, ou en duo en salon. Améliorations : dégâts par rareté et Chance (10 niveaux).
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
    ana:{n:'Ananas',r:0,dmg:11,cd:1.1,rng:2.4,spl:.7,s:'orb'},
    bsb:{n:'bsbfqhqsd',r:0,dmg:4,cd:.3,rng:2,s:'vis'},
    har:{n:'Haram',r:1,dmg:30,cd:.75,rng:3,s:'arc'},
    hal:{n:'Halal',r:1,dmg:26,cd:1.1,rng:2.6,spl:.9,s:'orb'},
    kas:{n:'Kasher',r:1,dmg:18,cd:.9,rng:2.6,slow:.4,s:'gel'},
    hlf:{n:'Halouf',r:1,dmg:22,cd:.5,rng:2.2,s:'epee'},
    bou:{n:'Bouzelouf',r:1,dmg:24,cd:1,rng:2.8,ch:3,s:'ecl'},
    coc:{n:'Cochon',r:1,dmg:45,cd:1.2,rng:1.8,stun:.2,s:'poing'},
    agn:{n:'Agneau',r:1,dmg:20,cd:.8,rng:2.6,ch:2,slow:.3,s:'gel'},
    cac:{n:'Caca',r:2,dmg:58,cd:1,rng:2.8,spl:1.1,bossx:1.3,s:'orb',p:'Odeur : +30 % de dégâts contre les boss'},
    pip:{n:'Pipi',r:2,dmg:40,cd:.5,rng:2.6,slow:.3,s:'goutte',p:'Flaque : ralentit les slimes de 30 %'},
    cha:{n:'Chameau',r:2,dmg:150,cd:1.3,rng:4.5,crit:.2,s:'vis',p:'Bosse : 20 % de coups critiques (×2)'},
    toi:{n:'Toilette',r:2,dmg:52,cd:1,rng:3,ch:4,aura:.15,s:'ecl',p:'Chasse d\'eau : les voisins attaquent 15 % plus vite'},
    vac:{n:'Vache',r:2,dmg:70,cd:1.1,rng:2.4,stun:.3,lait:10,s:'poing',p:'Lait : +4 pièces toutes les 10 s'},
    moi:{n:'Moise',r:3,dmg:190,cd:.95,rng:3.2,spl:1.3,push:12,s:'bou',p:'Mer ouverte : toutes les 12 s, repousse les slimes à portée'},
    exa:{n:'Exaucer',r:3,dmg:130,cd:.8,rng:3.6,ch:6,gemk:.03,s:'ecl',p:'Vœu : 3 % de chance de gagner une gemme par slime tué'},
    chi:{n:'Chirac',r:3,dmg:230,cd:1,rng:2.4,stun:.5,glob:.1,s:'poing',p:'Discours : +10 % de dégâts à tout ton territoire'},
    vad:{n:'Vador',r:2,dmg:90,cd:1.1,rng:3,stun:.6,s:'epee',p:'Étreinte : étourdit sa cible 0,6 s'},
    mtr:{n:'Montreuil',r:3,dmg:170,cd:.85,rng:3.4,spl:1,kb:1,s:'bou',p:'Mairie : +1 pièce par slime tué par ton équipe chez toi'},
    cdc:{n:'Croix-de-Chavaux',sh:'Chavaux',r:3,dmg:160,cd:.7,rng:3.8,vsl:.5,s:'vis',p:'Carrefour : +50 % de dégâts aux slimes ralentis ou étourdis'},
    gog:{n:'GOG',r:4,dmg:1300,cd:1.4,rng:3,spl:.9,stun:1,s:'poing',p:'Colosse : étourdit 1 s à chaque coup'},
    mag:{n:'MAGOG',r:4,dmg:450,cd:.6,rng:4,ch:5,nodec:1,s:'ecl',p:'Écho : ses éclairs rebondissent sans perdre de force'},
    son:{n:'SONGOKU',r:4,dmg:520,cd:.7,rng:4,spl:1.6,blast:8,s:'etoile',p:'Rafale : toutes les 8 s, frappe tous les slimes à portée (×3)'},
    h:{n:'H',r:4,dmg:300,cd:.35,rng:3.2,aura:.2,s:'lettre',p:'Hâte : les voisins attaquent 20 % plus vite'},
    cap:{n:'CAPORAL',r:4,dmg:800,cd:1,rng:3.4,spl:1.2,glob:.15,s:'galon',p:'Garde-à-vous : +15 % de dégâts à tout ton territoire'},
    ani:{n:'AnisGoat',r:4,dmg:900,cd:.6,rng:4.2,spl:1.3,gs:.25,s:'etoile',p:'GOAT : tout ton territoire attaque 25 % plus vite'},
    gm:{n:'GOG&MAGOG',r:4,dmg:2600,cd:1.1,rng:4.2,spl:1,ch:5,nodec:1,stun:1,blast:10,bx:5,s:'poing',p:'Colosse + Écho, et Fin du monde : toutes les 10 s, frappe tous les slimes à portée (×5)'}
  };
  /* recettes des mythiques : 1 exemplaire de chaque, pris sur le territoire */
  var REC={gog:['har','cac','moi','coc','ana'],mag:['hal','pip','exa','agn','bsb'],son:['tho','cha','chi'],h:['kas','toi','cdc'],cap:['ban','hlf','bou','vac'],ani:['mtr','vad','coc','agn'],gm:['gog','mag']},RK=Object.keys(REC);
  var BYR=[[],[],[],[],[]];Object.keys(U).forEach(function(k){if(U[k].r<4)BYR[U[k].r].push(k)});
  var SELL=[8,20,50,130,350],PARI=[[2,1,.3],[3,2,.1]],GRP=[0,0,1,1,2],WMAX=80,LIM=100,PER=28;
  var HPT=2.3,BOSSM=30,TC=['#6fbf5a','#4fc0e0','#e0c94f','#e0884f','#c04fe0','#e04f8a','#9aa3ad','#5a6cff'],DIF={normal:{hp:1,n:'Normal'},dur:{hp:1.55,n:'Difficile'},online:{hp:1.6,n:'À 2'}};
  var EK=[{h:1,v:1.5,c:'#6fbf5a'},{h:.6,v:2.4,c:'#e8a23a'},{h:1.8,v:1.05,c:'#7d6bd6'},{h:BOSSM,v:.9,c:'#e2361b'}];
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function rnd(){return Math.random()}

  /* ---------- un territoire : grille de 32 cases + ennemis qui tournent autour ---------- */
  function terr(name,side){return {name:name,side:side||0,luck:1,g:new Array(32).fill(null),e:[],gold:100,gems:0,cost:10,up:[0,0,0],fx:[],sel:-1,aura:null,kills:0}}
  /* grille : chaque unité occupe w × h cases (épique 2 × 1, légendaire et mythique 2 × 2). Toutes ses cases pointent vers
     le même objet, et c.a est sa case d'ancrage (en haut à gauche). */
  function SZ(id){var r=U[id].r;return r===2?[2,1]:r>=3?[2,2]:[1,1]}
  function room(T){for(var i=0;i<32;i++)if(!T.g[i])return true;return false}
  function fits(T,i,w,h,ig){var c=i%8,r=i/8|0;if(i<0||c+w>8||r+h>4)return false;for(var y=0;y<h;y++)for(var x=0;x<w;x++){var o=T.g[(r+y)*8+c+x];if(o&&(!ig||ig.indexOf(o)<0))return false}return true}
  function cover(T,o,v){for(var y=0;y<o.h;y++)for(var x=0;x<o.w;x++)T.g[o.a+y*8+x]=v}
  function put(T,o,i){o.a=i;cover(T,o,o);T.aura=null}
  function lift(T,o){cover(T,o,null);T.aura=null}
  function units(T){var L=[];for(var i=0;i<32;i++){var c=T.g[i];if(c&&c.a===i)L.push(c)}return L}
  function spotWH(T,w,h){var L=[];for(var i=0;i<32;i++)if(fits(T,i,w,h))L.push(i);return L}
  function canPlace(T,id){var s=SZ(id);return units(T).some(function(c){return c.u===id&&c.n<3})||spotWH(T,s[0],s[1]).length>0}
  function place(T,id){var us=units(T);for(var k=0;k<us.length;k++){var c=us[k];if(c.u===id&&c.n<3){c.n++;c.cd.push(.2);T.aura=null;return c.a}}
    var s=SZ(id),L=spotWH(T,s[0],s[1]);if(!L.length)return -1;var o={u:id,n:1,cd:[.2],w:s[0],h:s[1]};put(T,o,pick(L));return o.a}
  function mk(id,n){var s=SZ(id);return {u:id,n:n,cd:new Array(n).fill(.3),w:s[0],h:s[1]}}
  /* Chance : taux d'invocation par niveau (commune, rare, épique, légendaire), 10 niveaux */
  var LUCK=[[82,10,6,2],[78.5,12,7,2.5],[75,14,8,3],[71.5,16,9,3.5],[68,18,10,4],[64.5,20,11,4.5],[61,22,12,5],[57.5,24,13,5.5],[54,26,14,6],[50,28,15,7]],LCOST=[60,120,200,300,420,560,720,900,1100];
  function roll(T){var L=LUCK[(T&&T.luck||1)-1],x=rnd()*100;return x<L[3]?3:x<L[3]+L[2]?2:x<L[3]+L[2]+L[1]?1:0}
  function luckUp(T){if(T.luck>=10)return false;var c=LCOST[T.luck-1];if(T.gold<c)return false;T.gold-=c;T.luck++;return true}
  function summon(T){T.noroom=null;if(T.gold<T.cost||!room(T))return null;var id=pick(BYR[roll(T)]);if(!canPlace(T,id)){T.noroom=id;return null}T.gold-=T.cost;T.cost+=1;T.last=place(T,id);return id}
  function fuse(T,i){T.noroom=null;var c=T.g[i];if(!c||c.n<3||U[c.u].r>=3)return null;var id=pick(BYR[U[c.u].r+1]);lift(T,c);if(!canPlace(T,id)){put(T,c,c.a);T.noroom=id;return null}T.last=place(T,id);return id}
  function have(T,id){var b=-1;for(var i=0;i<32;i++){var c=T.g[i];if(c&&c.a===i&&c.u===id&&(b<0||c.n<T.g[b].n))b=i}return b}
  function canCraft(T,m){return REC[m].every(function(id){return have(T,id)>=0})}
  function craft(T,m){if(!canCraft(T,m))return null;REC[m].forEach(function(id){var i=have(T,id),c=T.g[i];c.n--;c.cd.pop();if(c.n<=0)lift(T,c)});T.aura=null;T.last=place(T,m);return m}
  function sell(T,i){var c=T.g[i];if(!c)return false;T.gold+=SELL[U[c.u].r];c.n--;c.cd.pop();if(c.n<=0)lift(T,c);T.aura=null;return true}
  function pari(T,k){var p=PARI[k];if(T.gems<p[1]||!room(T))return 0;T.gems-=p[1];if(rnd()>=p[2])return -1;var id=pick(BYR[p[0]]);T.last=place(T,id);return id}
  function upCost(T,k){var l=T.up[k];return k===0?30+30*l:k===1?80+60*l:2+l}
  function upgrade(T,k){var c=upCost(T,k);if(k<2){if(T.gold<c)return false;T.gold-=c}else{if(T.gems<c)return false;T.gems-=c}T.up[k]++;return true}
  /* déplacer une unité (glisser-déposer) : fusionne la pile si c'est la même unité, sinon va sur la place libre, sinon échange */
  function dropAt(A,b){var c=Math.min(b%8,8-A.w),r=Math.min(b/8|0,4-A.h);return r*8+c}
  function move(T,a,b){var A=T.g[a],B=T.g[b];if(!A||B===A)return -1;
    if(B&&B.u===A.u&&B.n+A.n<=3){B.n+=A.n;B.cd=B.cd.concat(A.cd);lift(T,A);return B.a}
    var nb=dropAt(A,b),old=A.a;if(fits(T,nb,A.w,A.h,[A])){lift(T,A);put(T,A,nb);return nb}
    var oth=[];for(var y=0;y<A.h;y++)for(var x=0;x<A.w;x++){var o=T.g[nb+y*8+x];if(o&&o!==A&&oth.indexOf(o)<0)oth.push(o)}
    if(oth.length!==1)return -1;B=oth[0];var bo=B.a;lift(T,A);lift(T,B);
    if(fits(T,nb,A.w,A.h)){put(T,A,nb);var k=fits(T,old,B.w,B.h)?old:(spotWH(T,B.w,B.h)[0]);if(k!=null&&k>=0){put(T,B,k);return nb}lift(T,A)}
    put(T,A,old);put(T,B,bo);return -1}
  function mult(T,id){return (1+.15*T.up[GRP[U[id].r]]+(T.gb||0))*(T.bonus||1)}
  function auraMap(T){var m=new Array(32).fill(0),gc=0,gp=0,us=units(T);us.forEach(function(c){if(U[c.u].glob){if(c.u==='chi')gc+=c.n;else gp+=c.n}});T.gb=Math.min(.3,gc*.1)+Math.min(.45,gp*.15);T.gs=0;T.kb=0;us.forEach(function(c){if(U[c.u].gs)T.gs=Math.min(.5,T.gs+U[c.u].gs);if(U[c.u].kb)T.kb=Math.min(3,T.kb+c.n)});us.forEach(function(A){if(!U[A.u].aura)return;var ax=A.a%8+A.w/2,ay=(A.a/8|0)+A.h/2;
      us.forEach(function(B){if(B===A)return;var d=Math.hypot(B.a%8+B.w/2-ax,(B.a/8|0)+B.h/2-ay);if(d<=(A.w+B.w)/2+.6)m[B.a]=Math.min(.5,m[B.a]+U[A.u].aura*A.n/3)})});return m}
  /* ---------- le monde : territoire du haut (côté 1, retourné) et du bas (côté 0), chemin du milieu partagé ----------
     Coordonnées en cases. Côté 0 : cases y 5..9, son chemin passe en y 4.5 (milieu) et 9.5 (dehors).
     Côté 1 : cases y 0..4, son chemin passe en y 4.5 (milieu) et -0.5 (dehors). */
  function pos(s,o){s=((s%PER)+PER)%PER;if(s<9){o.x=-.5+s;o.y=-.5}else if(s<14){o.x=8.5;o.y=-.5+(s-9)}else if(s<23){o.x=8.5-(s-14);o.y=4.5}else{o.x=-.5;o.y=4.5-(s-23)}return o}
  function wp(side,lx,ly,o){o.x=lx;o.y=side?4-ly:ly+5;return o}
  var TMP={x:0,y:0},SPAWN=18.5,EID=1;
  /* PV : +12 % à chaque vague, et un gros palier à chaque dizaine (vague 11, 21, 31…) */
  function hpOf(w,D){var t=Math.floor((w-1)/10);return 20*(1+.12*((w-1)%10))*Math.pow(HPT,t)*D.hp}
  function enemy(w,D,boss){var x=rnd(),k=boss?3:w%5===3?(x<.5?1:0):w%5===4?(x<.3?2:0):(x<.1?1:x<.18?2:0),K=EK[k],h=hpOf(w,D)*K.h*(boss?(w>=WMAX?3:1)*(1+w/40):1);
    return {id:EID++,s:SPAWN+rnd()*.3,hp:h,max:h,v:K.v,k:k,boss:boss,sl:0,slf:0,st:0,x:0,y:0,hit:0,ph:rnd()*6}}

  var HITS=null;/* coups portés aux slimes du coéquipier (en salon), envoyés toutes les 0,1 s */
  function hurt(e,d,u){if(e.hp<=0)return;e.hp-=d;e.hit=.1;e.by=u;if(u.slow){e.sl=1.6;e.slf=u.slow}if(u.stun)e.st=Math.max(e.st,e.boss?u.stun*.25:u.stun);
    if(e.ghost&&HITS){var h=HITS[e.id]||(HITS[e.id]=[0,0,0]);h[0]+=d;if(u.slow)h[1]=Math.max(h[1],u.slow);if(u.stun)h[2]=Math.max(h[2],e.boss?u.stun*.25:u.stun)}}
  function fxp(fx,o){if(fx.length<90)fx.push(o)}
  function strike(fx,all,cx,cy,u,tg,dmg){
    hurt(tg,dmg,u);var col=RAR[u.r].c;fxp(fx,{k:'shot',x1:cx,y1:cy,x2:tg.x,y2:tg.y,t:.16,c:col,s:u.s});
    if(u.spl){all.forEach(function(o){if(o!==tg&&o.hp>0&&Math.hypot(o.x-tg.x,o.y-tg.y)<u.spl)hurt(o,dmg*.7,u)});fxp(fx,{k:'boom',x:tg.x,y:tg.y,r:u.spl,t:.25,c:col})}
    if(u.ch){var prev=tg,done=[tg],d=dmg;for(var j=1;j<u.ch;j++){var nx=null,nd=1.8;all.forEach(function(o){if(done.indexOf(o)<0&&o.hp>0){var dd=Math.hypot(o.x-prev.x,o.y-prev.y);if(dd<nd){nd=dd;nx=o}}});if(!nx)break;if(!u.nodec)d*=.85;hurt(nx,d,u);done.push(nx);fxp(fx,{k:'zap',x1:prev.x,y1:prev.y,x2:nx.x,y2:nx.y,t:.14,c:col});prev=nx}}}
  /* avance le monde : Ts = territoires calculés ici, ghosts = slimes du coéquipier en salon (on peut les taper aussi) */
  function stepWorld(Ts,ghosts,w,dt,fx){
    var all=[],out={boss:false};
    Ts.forEach(function(T){T.e.forEach(function(e){e.hit=Math.max(0,e.hit-dt);if(e.st>0){e.st-=dt}else{var f=e.sl>0?1-e.slf:1;e.s=(e.s+e.v*f*dt)%PER}if(e.sl>0)e.sl-=dt;pos(e.s,TMP);wp(T.side,TMP.x,TMP.y,e);all.push(e)})});
    if(ghosts)ghosts.forEach(function(e){e.hit=Math.max(0,(e.hit||0)-dt);e.s=(e.s+e.v*dt)%PER;pos(e.s,TMP);wp(1,TMP.x,TMP.y,e);if(e.hp>0)all.push(e)});
    Ts.forEach(function(T){if(!T.aura)T.aura=auraMap(T);
      for(var i=0;i<32;i++){var c=T.g[i];if(!c||c.a!==i)continue;var u=U[c.u],m=mult(T,c.u),sp=1+T.aura[i]+(T.gs||0);wp(T.side,i%8+c.w/2,(i/8|0)+c.h/2,TMP);var cx=TMP.x,cy=TMP.y;
        for(var k=0;k<c.n;k++){c.cd[k]-=dt*sp;if(c.cd[k]>0)continue;
          var tg=null,bd=u.rng;for(var j=0;j<all.length;j++){var e=all[j];if(e.hp<=0)continue;var d=Math.hypot(e.x-cx,e.y-cy)-(e.boss?.3:0);if(d<=bd&&(!tg||e.boss&&!tg.boss||d<bd&&!(tg.boss&&!e.boss))){tg=e;bd=e.boss?u.rng:d}}
          if(!tg){c.cd[k]=0;continue}
          c.cd[k]=u.cd*(.9+rnd()*.2);c.at=.22;c.ax=tg.x-cx;var dm=u.dmg*m;if(u.bossx&&tg.boss)dm*=u.bossx;if(u.vsl&&(tg.sl>0||tg.st>0))dm*=1+u.vsl;
          if(u.crit&&rnd()<u.crit){dm*=2;fxp(fx,{k:'txt',x:tg.x,y:tg.y,s:'CRIT',t:.5,c:'#f3c623'})}strike(fx,all,cx,cy,u,tg,dm)}
        /* passifs à minuterie : Lait, Mer ouverte, Rafale */
        if(u.lait){c.pt=(c.pt==null?u.lait:c.pt)-dt;if(c.pt<=0){c.pt=u.lait;T.gold+=4*c.n;fxp(fx,{k:'txt',x:cx,y:cy-.3,s:'+'+4*c.n,t:.9,c:'#f3c623'})}}
        if(u.push||u.blast){var per=u.push||u.blast;c.pt=(c.pt==null?per:c.pt)-dt;if(c.pt<=0){var near=all.filter(function(e){return e.hp>0&&Math.hypot(e.x-cx,e.y-cy)<=u.rng});if(near.length){c.pt=per;
          if(u.push)near.forEach(function(e){if(!e.boss&&!e.ghost)e.s=(e.s-2.5+PER)%PER});else near.forEach(function(e){hurt(e,u.dmg*m*(u.bx||3)*c.n,u)});
          fxp(fx,{k:'boom',x:cx,y:cy,r:u.rng,t:.45,c:u.push?'#7fd0ff':'#ffb020'})}else c.pt=.5}}
        if(c.at>0)c.at-=dt}});
    Ts.forEach(function(T){T.e=T.e.filter(function(e){if(e.hp>0)return true;T.kills++;if(e.boss){T.gold+=40+w*3;T.gems+=3+Math.floor(w/10);out.boss=true}else T.gold+=2+(T.kb||0);
      if(e.by&&e.by.gemk&&rnd()<e.by.gemk){T.gems++;fxp(fx,{k:'txt',x:e.x,y:e.y,s:'+1 gemme',t:.9,c:'#4fe0d0'})}
      fxp(fx,{k:'die',x:e.x,y:e.y,t:.35,c:e.boss?EK[3].c:TC[Math.floor((w-1)/10)%TC.length],r:e.boss?.7:.3});return false})});
    for(var i=fx.length-1;i>=0;i--){fx[i].t-=dt;if(fx[i].t<=0)fx.splice(i,1)}
    return out}
  /* l'allié ordi : il invoque, fusionne, crée des mythiques, améliore */
  function bot(T){
    for(var i=0;i<32;i++){var c=T.g[i];if(c&&c.a===i&&c.n===3&&U[c.u].r<3){if(fuse(T,i))return}}
    for(i=0;i<RK.length;i++)if(canCraft(T,RK[i])){craft(T,RK[i]);return}
    if(T.gems>=upCost(T,2)+2&&T.g.some(function(c){return c&&U[c.u].r===4})){upgrade(T,2);return}
    if(T.gems>=2&&rnd()<.6){pari(T,rnd()<.5?1:0);return}
    if(!room(T)&&T.gold>=T.cost){var lo=-1,lr=9;for(i=0;i<32;i++){c=T.g[i];if(c&&c.a===i&&c.n<3&&U[c.u].r<lr){lr=U[c.u].r;lo=i}}if(lo>=0&&lr<2)sell(T,lo);return}
    if(T.luck<10&&T.gold>=LCOST[T.luck-1]+T.cost&&T.luck<=1+T.up[0]+T.up[1]){luckUp(T);return}
    for(var k=0;k<2;k++)if(T.gold>=upCost(T,k)+T.cost*1.5&&T.up[k]<=T.up[1-k]+(k?0:1)){upgrade(T,k);return}
    if(T.gold>=T.cost)summon(T)}

  /* ---------- partie ---------- */
  var DRAG=null,G=null,CP=null,P=null,LY=null,sendT=0,hitT=0,botT=0;
  var ANIM=(function(){try{return PP.text('garde-anim')!=='0'}catch(e){return true}})();
  function solo(){return G&&G.ally==='bot'}
  function newGame(mode,ally,names){var D=DIF[mode]||DIF.normal;G={mode:mode,D:D,w:0,t:3,spawnN:0,spawnT:0,iv:1,T:[terr(names[0],0),terr(names[1],1)],ally:ally,over:false,done:false,pdone:false,warn:0,wtxt:'',time:0,fx:[]};
    P=null;HITS=ally==='net'?{}:null;if(ally==='bot')G.T[1].bonus=1.4;nextWave()}
  function nextWave(){G.w++;var b=G.w%10===0;G.boss=b;G.t=b?60:24;G.spawnN=b?1:15+2*(G.w-1);G.iv=b?0:Math.min(.9,17/G.spawnN);G.spawnT=.5;
    G.T.forEach(function(T,i){if(i===1&&G.ally!=='bot')return;if(G.w>1)T.gems+=1});
    if(b){G.warn=2.5;G.wtxt='BOSS ! Battez-le avant la fin du temps';if(CP){CP.pop('BOSS !','#e2361b','70px');sfx.play('lose')}}
    else if(CP&&G.w>1&&(G.w-1)%10===0){var th=THEME[Math.min(7,Math.floor((G.w-1)/10))];CP.pop(th.n.toUpperCase(),'#e2361b','52px');G.warn=2.5;G.wtxt='Vague '+G.w+' : '+th.n+'… les slimes ont changé';G.wok=0;sfx.play('lose')}
    else if(CP&&G.w>1){CP.pop('VAGUE '+G.w,'#f1ece2','56px');sfx.play('tick')}
    if(solo())save()}
  function ser(T){return {g:units(T).map(function(c){return [c.u,c.n,c.a]}),gold:T.gold,gems:T.gems,cost:T.cost,up:T.up,luck:T.luck,e:T.e.map(function(e){return [+e.s.toFixed(2),Math.round(e.hp),Math.round(e.max),e.k,e.boss?1:0]})}}
  function unser(T,o){T.g=new Array(32).fill(null);(o.g||[]).forEach(function(a){if(a&&U[a[0]]){var c=mk(a[0],a[1]);if(fits(T,a[2],c.w,c.h))put(T,c,a[2])}});T.gold=o.gold;T.gems=o.gems;T.cost=o.cost;T.up=o.up;T.luck=o.luck||1;
    T.e=(o.e||[]).map(function(a){var K=EK[a[3]]||EK[0];return {id:EID++,s:a[0],hp:a[1],max:a[2],v:K.v,k:a[3],boss:!!a[4],sl:0,slf:0,st:0,x:0,y:0,hit:0,ph:rnd()*6}});T.aura=null}
  function save(){try{PP.text('garde-save',JSON.stringify({v:2,mode:G.mode,w:G.w,me:ser(G.T[0]),al:ser(G.T[1])}))}catch(e){}}
  function loadSave(){try{var s=JSON.parse(PP.text('garde-save'));if(s&&s.v===2&&s.w>0)return s}catch(e){}return null}
  function clearSave(){PP.text('garde-save','')}
  function resume(s){newGame(s.mode,'bot',[PP.myName()||'Toi','Allié ordi']);G.w=s.w-1;nextWave();unser(G.T[0],s.me);unser(G.T[1],s.al);G.t=G.boss?60:24}

  function finish(C,win,why){if(!G||G.over)return;G.over=true;C.stop();var w=G.w;C.best('vague',win?WMAX+1:w);
    if(solo())clearSave();
    if(win){C.win();sfx.play('win');C.pop('VICTOIRE !','#f3c623','80px')}else{sfx.play('lose');C.shake(10)}
    if(G.mode==='online'&&G.ally==='net'&&!G.fromNet)net.relay({t:win?'gd-done':'gd-x',why:why});
    var best=C.best('vague');
    setTimeout(function(){if(!G||!G.over)return;
      var again=G.mode!=='online'||net.isHost;
      C.over(win?'Victoire !':'Défaite',(win?(G.ally==='net'?'Bravo l\'équipe ! ':'')+'Le boss final de la vague 80 est tombé.':(why||'Trop de slimes sur le chemin.')+'<br>Vous avez tenu jusqu\'à la <b>vague '+w+'</b>.')+'<br>Record : vague '+(best>WMAX?'80 (gagné)':best),
        again?'Rejouer':false,again?function(){if(G.mode==='online')hostStart(C);else{startSolo(C);C.go()}}:null);
      if(!again)CP.over(win?'Victoire !':'Défaite',PP.$('garde-msg').innerHTML+'<br>Le chef du salon peut relancer.',false)},1300)}

  function wheelStep(C,dt){var W=G.wheel;if(!W)return;W.t+=dt;var f=Math.min(1,W.t/W.dur),r=W.end*(1-Math.pow(1-f,3)),seg=Math.floor(r/(Math.PI/8));if(seg!==W.tick&&f<1){W.tick=seg;sfx.play('tick')}W.rot=r;
    if(W.t>=W.dur&&!W.done){W.done=true;var T=G.T[0];if(W.win){var id=pick(BYR[PARI[W.k][0]]);T.last=place(T,id);if(T.last<0){T.gems+=PARI[W.k][1];say('Plus de place : gemmes rendues',0)}else got(C,id,'Pari gagné : ')}else{say('Raté…',0);sfx.play('lose')}}
    if(W.t>=W.dur+.9)G.wheel=null}
  function step(C,dt){if(!G||G.over)return;G.time+=dt;wheelStep(C,dt);G.warn=Math.max(0,G.warn-dt);
    G.t-=dt;var loc=G.ally==='bot'?G.T:[G.T[0]];
    if(G.spawnN>0){G.spawnT-=dt;while(G.spawnN>0&&G.spawnT<=0){loc.forEach(function(T){T.e.push(enemy(G.w,G.D,G.boss))});G.spawnN--;G.spawnT+=G.iv||1}}
    stepWorld(loc,G.ally==='net'&&P?P.e:null,G.w,dt,G.fx);
    if(G.ally==='bot'){botT-=dt;if(botT<=0){botT=.7+rnd()*.5;bot(G.T[1]);var A1=G.T[1],Me=G.T[0];if(A1.gold>A1.cost*3+60&&Me.gold<Me.cost&&rnd()<.3){A1.gold-=40;Me.gold+=40;say(A1.name+' t\'a donné 40 or',1)}}}
    if(G.ally==='net'){sendT-=dt;if(sendT<=0){sendT=.2;sync()}hitT-=dt;if(hitT<=0){hitT=.1;var ks=Object.keys(HITS);if(ks.length){net.relay({t:'gd-hit',h:ks.map(function(k){var h=HITS[k];return [+k,Math.round(h[0]),h[1],h[2]]})});HITS={}}}}
    var n=G.T[0].e.length+(G.ally==='bot'?G.T[1].e.length:(P?P.n:0));G.count=n;
    if(n>=LIM){finish(C,false,LIM+' slimes sur le terrain : Montreuil est envahie !');return}
    if(G.boss){var alive=loc.some(function(T){return T.e.some(function(e){return e.boss})});
      if(!alive&&G.spawnN===0){if(G.w>=WMAX){if(G.ally==='net'&&!G.pdone){if(!G.done){G.done=true;G.wtxt='Boss battu ! On attend ton coéquipier';G.warn=999;net.relay({t:'gd-boss30'})}}else finish(C,true)}else{C.pop('BOSS BATTU !','#f3c623','60px');sfx.play('win');nextWave()}}
      else if(G.t<=0&&alive){finish(C,false,'Le boss n\'a pas été battu à temps.');return}}
    else if(G.t<=0)nextWave()}

  /* ---------- duo en salon ---------- */
  function sync(){var T=G.T[0];net.relay({t:'gd-s',g:units(T).map(function(c){return c.u+':'+c.n+':'+c.a}),e:T.e.slice(0,120).map(function(e){return [e.id,+e.s.toFixed(2),Math.round(e.hp),Math.round(e.max),e.k,e.boss?1:0,+((e.st>0?0:e.sl>0?1-e.slf:1)*e.v).toFixed(2)]}),n:T.e.length,w:G.w,nm:G.T[0].name})}
  function onNet(C,m){if(m.t!=='rel'||!m.d)return;var d=m.d;
    if(d.t==='gd-go'){if(net.isHost)return;var sl=net.slot(net.me.id);
      if(sl>1){G=null;C.over('Duo complet','DEFEND MONTREUIL se joue à <b>2 maximum</b>. Ce duo a déjà ses 2 joueurs.',false);return}
      newGame('online','net',[net.me.name||'Toi',d.host||'Coéquipier']);C.go();return}
    if(!G||G.ally!=='net')return;
    if(d.t==='gd-s'){var PG={g:new Array(32).fill(null)};d.g.forEach(function(s){var a=String(s).split(':');if(U[a[0]]){var c=mk(a[0],+a[1]||1);if(fits(PG,+a[2],c.w,c.h))put(PG,c,+a[2])}});P={g:PG.g,e:d.e.map(function(a){return {id:a[0],s:a[1],hp:a[2],max:a[3],k:a[4],boss:!!a[5],v:a[6],x:0,y:0,ghost:1,sl:0,st:0,ph:a[0]%6}}),n:d.n,w:d.w};if(d.nm)G.T[1].name=d.nm;return}
    if(d.t==='gd-hit'){var Tm=G.T[0];d.h.forEach(function(h){for(var i=0;i<Tm.e.length;i++){var e=Tm.e[i];if(e.id===h[0]){e.hp-=h[1];e.hit=.1;if(h[2]){e.sl=1.6;e.slf=h[2]}if(h[3])e.st=Math.max(e.st,h[3]);break}}});return}
    if(d.t==='gd-x2'){G.x2=!!d.on;say(G.T[1].name+(G.x2?' a mis la vitesse ×2':' a remis la vitesse normale'),1);return}
    if(d.t==='gd-give'){Tm=G.T[0];var fr=d.from||G.T[1].name;if(d.u&&U[d.u]){if(place(Tm,d.u)<0){Tm.gold+=SELL[U[d.u].r];say(fr+' t\'a donné '+U[d.u].n+' (plus de place : +'+SELL[U[d.u].r]+' or)',1)}else say(fr+' t\'a donné '+U[d.u].n,1)}else if(d.g){Tm.gold+=d.g;say(fr+' t\'a donné '+d.g+' or',1)}C.pop('CADEAU !','#3fe09a','46px');sfx.play('pickup');return}
    if(d.t==='gd-x'&&!G.over){G.fromNet=true;finish(C,false,'Votre équipe a été débordée.');return}
    if(d.t==='gd-boss30'){G.pdone=true;if(G.done&&!G.over)finish(C,true);return}
    if(d.t==='gd-done'&&!G.over){G.fromNet=true;finish(C,true)}}
  function hostStart(C){var pl=net.players,mate=pl.filter(function(p){return p.id!==net.me.id})[0];
    if(!mate){newGame('online','bot',[net.me.name||'Toi','Allié ordi']);PP.toast('Tu es seul dans le salon : un coéquipier ordi prend l\'autre territoire');C.go();return}
    newGame('online','net',[net.me.name||'Toi',mate.name||'Coéquipier']);net.relay({t:'gd-go',host:net.me.name||'Chef'});C.go()}
  function startSolo(C){clearSave();newGame(C.mode,'bot',[PP.myName()||'Toi','Allié ordi'])}

  /* ---------- mise en page : plateau 10 × 11 cases (2 territoires + chemins), panneau à droite (paysage) ou dessous (vertical) ---------- */
  function tall(){return document.body.classList.contains('pp-touch')&&innerHeight>innerWidth}
  function layout(C){var v=tall();if(LY&&LY.v===v)return;
    if(v)LY={v:v,W:540,H:960,ox:10,oy:50,cs:52,
      b:{info:[10,632,520,76],don:[420,636,106,30],sum:[10,716,250,100],fus:[270,716,125,100],sel:[405,716,125,100],p0:[10,824,124,68],p1:[142,824,124,68],rec:[274,824,124,68],upg:[406,824,124,68],anim:[280,900,250,48],x2:[10,900,260,48]}};
    else LY={v:v,W:960,H:540,ox:16,oy:50,cs:44,
      b:{info:[472,50,472,110],don:[848,56,90,30],sum:[472,170,236,124],fus:[716,170,110,124],sel:[834,170,110,124],p0:[472,304,112,100],p1:[592,304,112,100],rec:[712,304,112,100],upg:[832,304,112,100],anim:[744,414,200,44],x2:[472,414,200,44]}};
    C.W=LY.W;C.H=LY.H;C.cv.width=LY.W;C.cv.height=LY.H}
  function PX(wx){return LY.ox+(wx+1)*LY.cs}
  function PY(wy){return LY.oy+(wy+1)*LY.cs}
  function inR(r,x,y){return x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3]}
  function cellAt(x,y){var gx=(x-LY.ox)/LY.cs-1,gy=(y-LY.oy)/LY.cs-1-5;if(gx<0||gx>=8||gy<0||gy>=4)return -1;return (gy|0)*8+(gx|0)}

  /* ---------- actions du joueur ---------- */
  function say(t,ok){if(!G)return;G.wtxt=t;G.warn=1.8;G.wok=ok}
  function act(C,a){if(!G||G.over||!C.running)return;var T=G.T[0],id;
    if(a==='x2'){G.x2=!G.x2;if(G.ally==='net')net.relay({t:'gd-x2',on:G.x2});say(G.x2?'Vitesse ×2 : tout va deux fois plus vite':'Vitesse normale',1);sfx.play('ui');return}
    if(a==='anim'){ANIM=!ANIM;PP.text('garde-anim',ANIM?'1':'0');say(ANIM?'Animations d\'attaque affichées':'Animations d\'attaque cachées (les dégâts comptent toujours)',1);sfx.play('ui');return}
    if(a==='sum'){if(!room(T)){say('Plus de place : fusionne ou vends',0);sfx.play('lose');return}if(T.gold<T.cost){say('Pas assez d\'or',0);return}id=summon(T);if(!id&&T.noroom){noRoom(T.noroom);return}got(C,id,'');return}
    if(a==='fus'){var c=T.g[T.sel];if(!c){say('Choisis d\'abord une case',0);return}if(c.n<3){say('Il faut 3 '+U[c.u].n+' sur la case',0);return}if(U[c.u].r>=3){say('Les mythiques se créent avec les RECETTES',0);return}id=fuse(T,T.sel);if(!id){if(T.noroom)noRoom(T.noroom);return}T.sel=T.last;got(C,id,'Fusion : ');return}
    if(a==='sel'){if(T.sel<0||!T.g[T.sel]){say('Choisis d\'abord une case',0);return}var r=U[T.g[T.sel].u].r;sell(T,T.sel);say('+'+SELL[r]+' or',1);sfx.play('tick');if(!T.g[T.sel])T.sel=-1;return}
    if(a==='don'){var T2=G.ally==='bot'?G.T[1]:null,who=G.T[1].name;
      if(T.sel>=0&&T.g[T.sel]){var c2=T.g[T.sel],uid=c2.u;if(T2&&place(T2,uid)<0){say('Plus de place chez '+who,0);return}if(!T2)net.relay({t:'gd-give',u:uid,from:T.name});
        c2.n--;c2.cd.pop();if(c2.n<=0){lift(T,c2);T.sel=-1}T.aura=null;say(U[uid].n+' donné à '+who,1);sfx.play('pickup');return}
      if(T.gold<50){say('Choisis une unité à donner, ou garde 50 or',0);return}T.gold-=50;if(T2)T2.gold+=50;else net.relay({t:'gd-give',g:50,from:T.name});say('50 or donnés à '+who,1);sfx.play('pickup');return}
    if(a==='rec'){G.rec=!G.rec;G.upg=false;sfx.play('ui');return}
    if(a==='upg'){G.upg=!G.upg;G.rec=false;sfx.play('ui');return}
    if(a==='p0'||a==='p1'){var k=+a[1],p=PARI[k];if(G.wheel){return}if(T.gems<p[1]){say('Il faut '+p[1]+' gemme'+(p[1]>1?'s':''),0);return}if(!room(T)){say('Plus de place',0);return}
      /* la roue : une part gagnante (couleur de la rareté) et des parts « raté », elle tourne puis s'arrête sur le résultat */
      T.gems-=p[1];var win=rnd()<p[2],A=Math.PI*2,la=win?(.15+rnd()*.7)*p[2]*A:(p[2]+(.1+rnd()*.8)*(1-p[2]))*A;
      G.wheel={k:k,win:win,t:0,dur:2.4,end:-Math.PI/2-la+A*5,tick:0};sfx.play('ui');return}
    if(a==='luck'){if(T.luck>=10){say('Chance déjà au maximum',0);return}if(!luckUp(T)){say('Pas assez d\'or',0);return}say('Chance niveau '+T.luck+' !',1);sfx.play('win');return}
    if(a[0]==='u'){k=+a[1];if(!upgrade(T,k)){say(k<2?'Pas assez d\'or':'Pas assez de gemmes',0);return}say('Amélioration niveau '+T.up[k]+' !',1);sfx.play('pickup')}}
  function noRoom(id){var s=SZ(id);say('Pas de place pour '+U[id].n+' (il prend '+s[0]*s[1]+' cases)',0);sfx.play('lose')}
  function got(C,id,pre){if(!id)return;var u=U[id];say(pre+u.n+' ('+RAR[u.r].n.toLowerCase()+')',1);
    if(u.r>=3){C.pop(RAR[u.r].n.toUpperCase()+' !',RAR[u.r].c,'54px');sfx.play('win')}else if(u.r===2){C.pop('ÉPIQUE !',RAR[2].c,'42px');sfx.play('go')}else sfx.play('pickup')}

  /* ---------- dessin ---------- */
  function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
  function txt(g,s,x,y,sz,col,al,wt){g.font=(wt||'700')+' '+sz+'px Inter, system-ui, sans-serif';g.fillStyle=col||CR;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,x,y)}
  function big(g,s,x,y,sz,col,al){g.font='400 '+sz+'px Anton, Impact, sans-serif';g.fillStyle=col||CR;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,x,y)}
  function gem(g,x,y,r){g.fillStyle='#4fe0d0';g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*.8,y);g.lineTo(x,y+r);g.lineTo(x-r*.8,y);g.closePath();g.fill()}
  function coin(g,x,y,r){g.fillStyle='#f3c623';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.fillStyle='#b88a0a';g.beginPath();g.arc(x,y,r*.5,0,7);g.fill()}

  /* petits bonshommes : peau, cheveux et coiffe tirés du nom, tenue de la couleur de la rareté, arme selon le type */
  var SKIN=['#f2c9a0','#d9a37a','#a8714d','#7a4b2e','#f5d6b8','#c58c62'],HAIR=['#2a1d14','#5a3a1e','#d9b060','#1d1d1d','#8a3a1a','#e8e2d6'],ORB={orb:'#ffcf5a',gel:'#9fe6ff',ecl:'#fff36a',feu:'#ff7a2a',goutte:'#ffe85a'};
  function hsh(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}
  function person(g,cx,cy,z,id,t,atk,dir){var u=U[id],R=RAR[u.r],h=hsh(id),sk=SKIN[h%SKIN.length],hc=HAIR[(h>>4)%HAIR.length],st=(h>>8)%4,ph=(h%100)/16;
    var bob=Math.sin(t*5+ph)*z*.035,lift=atk>0?Math.sin(atk/.22*Math.PI)*z*.08:0,by=cy+bob-lift,lw=Math.max(1.4,z*.06);
    g.lineCap='round';g.lineJoin='round';
    /* ombre */
    g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(cx,cy+z*.47,z*.24,z*.07,0,0,7);g.fill();
    /* aura des mythiques */
    if(u.r===4){g.globalAlpha=.35+.2*Math.sin(t*4+ph);g.fillStyle=R.c;g.beginPath();g.arc(cx,by,z*.46,0,7);g.fill();g.globalAlpha=1}
    /* jambes */
    var sw=Math.sin(t*6+ph)*z*.03;g.strokeStyle=INK;g.lineWidth=lw*1.3;g.beginPath();g.moveTo(cx-z*.08,by+z*.2);g.lineTo(cx-z*.1-sw,cy+z*.44);g.moveTo(cx+z*.08,by+z*.2);g.lineTo(cx+z*.1+sw,cy+z*.44);g.stroke();
    /* corps */
    g.fillStyle=R.c;g.strokeStyle=INK;g.lineWidth=lw;rr(g,cx-z*.19,by-z*.06,z*.38,z*.3,z*.09);g.fill();g.stroke();
    if(u.s==='lettre')txt(g,'H',cx,by+z*.09,z*.22,INK,'center','900');
    if(u.s==='galon'){g.strokeStyle='#f3c623';g.lineWidth=lw;g.beginPath();for(var j=0;j<2;j++){g.moveTo(cx-z*.1,by+z*.02+j*z*.08);g.lineTo(cx,by+z*.07+j*z*.08);g.lineTo(cx+z*.1,by+z*.02+j*z*.08)}g.stroke()}
    /* bras + arme côté de la cible */
    var sd=dir<0?-1:1,hx=cx+sd*z*.26,hy=by+z*.06,ang=atk>0?-1.1:-.35;
    g.strokeStyle=INK;g.lineWidth=lw*1.2;g.beginPath();g.moveTo(cx+sd*z*.15,by+z*.02);g.lineTo(hx,hy);g.stroke();
    g.save();g.translate(hx,hy);g.scale(sd,1);g.rotate(ang);g.lineWidth=lw;
    if(u.s==='arc'||u.s==='vis'){g.strokeStyle='#7a4a22';g.beginPath();g.arc(0,-z*.02,z*.18,-1.3,1.3);g.stroke();g.strokeStyle='#ddd';g.lineWidth=1;g.beginPath();g.moveTo(Math.cos(-1.3)*z*.18,Math.sin(-1.3)*z*.18-z*.02);g.lineTo(Math.cos(1.3)*z*.18,Math.sin(1.3)*z*.18-z*.02);g.stroke()}
    else if(ORB[u.s]||u.s==='etoile'){g.strokeStyle='#6a4a2a';g.beginPath();g.moveTo(0,z*.12);g.lineTo(0,-z*.3);g.stroke();g.fillStyle=ORB[u.s]||'#ffd34a';g.beginPath();g.arc(0,-z*.33,z*.075,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=1;g.stroke()}
    else if(u.s==='bou'){g.fillStyle='#c9d2dc';g.strokeStyle=INK;g.beginPath();g.moveTo(-z*.1,-z*.12);g.lineTo(z*.1,-z*.12);g.lineTo(z*.09,z*.04);g.lineTo(0,z*.13);g.lineTo(-z*.09,z*.04);g.closePath();g.fill();g.stroke()}
    else if(u.s==='poing'){g.fillStyle=sk;g.strokeStyle=INK;g.beginPath();g.arc(0,-z*.02,z*.085,0,7);g.fill();g.stroke()}
    else{g.strokeStyle='#d8dde3';g.lineWidth=lw*1.1;g.beginPath();g.moveTo(0,z*.02);g.lineTo(0,-z*.3);g.stroke();g.strokeStyle='#7a4a22';g.beginPath();g.moveTo(-z*.06,-z*.01);g.lineTo(z*.06,-z*.01);g.stroke()}
    g.restore();
    /* tête */
    var hy2=by-z*.2;g.fillStyle=sk;g.strokeStyle=INK;g.lineWidth=lw;g.beginPath();g.arc(cx,hy2,z*.15,0,7);g.fill();g.stroke();
    /* cheveux / coiffe */
    g.fillStyle=u.r===3?'#f3c623':hc;
    if(u.r===3){g.beginPath();g.moveTo(cx-z*.12,hy2-z*.1);g.lineTo(cx-z*.12,hy2-z*.24);g.lineTo(cx-z*.05,hy2-z*.16);g.lineTo(cx,hy2-z*.27);g.lineTo(cx+z*.05,hy2-z*.16);g.lineTo(cx+z*.12,hy2-z*.24);g.lineTo(cx+z*.12,hy2-z*.1);g.closePath();g.fill();g.stroke()}
    else if(u.s==='galon'){g.fillStyle='#3e5a2a';rr(g,cx-z*.16,hy2-z*.2,z*.32,z*.1,z*.03);g.fill();g.stroke()}
    else if(st===0){g.fillStyle=R.d;g.beginPath();g.arc(cx,hy2-z*.03,z*.155,Math.PI,0);g.fill();g.fillRect(cx,hy2-z*.06,z*.2*sd,z*.04)}
    else if(st===1){g.beginPath();for(var k=0;k<4;k++){g.moveTo(cx-z*.15+k*z*.1,hy2-z*.06);g.lineTo(cx-z*.1+k*z*.1,hy2-z*.25);g.lineTo(cx-z*.05+k*z*.1,hy2-z*.06)}g.fill()}
    else if(st===2){g.beginPath();g.arc(cx,hy2-z*.02,z*.155,Math.PI*1.05,-.05);g.fill()}
    else{g.beginPath();g.arc(cx,hy2-z*.02,z*.16,Math.PI,0);g.fill();g.fillRect(cx-z*.17,hy2-z*.04,z*.06,z*.2);g.fillRect(cx+z*.11,hy2-z*.04,z*.06,z*.2)}
    /* yeux */
    g.fillStyle=INK;var blink=((t+ph)%3.2)<.12;if(blink){g.fillRect(cx-z*.07,hy2+z*.01,z*.05,z*.015);g.fillRect(cx+z*.03,hy2+z*.01,z*.05,z*.015)}else{g.fillRect(cx-z*.065+sd*z*.015,hy2-z*.01,z*.035,z*.05);g.fillRect(cx+z*.035+sd*z*.015,hy2-z*.01,z*.035,z*.05)}}
  var SPOT=[[],[[.5,.56]],[[.31,.6],[.69,.6]],[[.5,.47],[.27,.68],[.73,.68]]],PZ=[0,.78,.6,.52],
      SPOTW=[[],[[.5,.58]],[[.3,.6],[.7,.6]],[[.18,.62],[.5,.56],[.82,.62]]],PZW=[0,.82,.76,.66];
  /* une case d'unité : 1 × 1, 2 × 1 (épique) ou 2 × 2 (légendaire, mythique), avec 1 à 3 bonshommes dessus */
  function tile(g,x,y,cs,c,sel,t,alpha){var u=U[c.u],R=RAR[u.r],w=c.w||1,h=c.h||1,W=cs*w,H=cs*h,p=cs*.05;
    if(alpha!=null)g.globalAlpha=alpha;var a0=g.globalAlpha;
    g.globalAlpha=a0*.55;g.fillStyle=R.d;rr(g,x+p,y+p,W-2*p,H-2*p,cs*.14);g.fill();g.globalAlpha=a0;
    if(u.r>=3){var gl=g.createRadialGradient(x+W/2,y+H/2,cs*.2,x+W/2,y+H/2,W*.6);gl.addColorStop(0,u.r===4?'rgba(226,54,27,.35)':'rgba(243,198,35,.3)');gl.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gl;rr(g,x+p,y+p,W-2*p,H-2*p,cs*.14);g.fill()}
    g.strokeStyle=R.c;g.lineWidth=sel?3:u.r>=3?2.5:2;rr(g,x+p,y+p,W-2*p,H-2*p,cs*.14);g.stroke();
    var n=Math.max(1,Math.min(3,c.n||1));
    for(var i=0;i<n;i++){var sp,z;if(w>h){sp=SPOTW[n][i];z=cs*PZW[n]}else{sp=SPOT[n][i];z=W*PZ[n]}person(g,x+W*sp[0],y+H*sp[1],z,c.u,t+i*.7,ANIM?(c.at||0):0,c.ax||1)}
    var nm=u.sh||u.n,fs=Math.max(7,cs*(w*h>1?.2:.17));g.font='800 '+fs+'px Inter, system-ui, sans-serif';var tw=g.measureText(nm).width,bw=W-2*p-4;if(tw>bw)fs*=bw/tw;
    g.fillStyle='rgba(20,18,16,.6)';rr(g,x+p+2,y+p+1,bw,fs+3,3);g.fill();txt(g,nm,x+W/2,y+p+2.5+fs/2,fs,R.c==='#a3a8ad'?'#e6e9ec':R.c,'center','800');
    if(sel){g.strokeStyle='#fff';g.lineWidth=3;rr(g,x+p-2,y+p-2,W-2*p+4,H-2*p+4,cs*.16);g.stroke()}
    if(alpha!=null)g.globalAlpha=1}
  function slime(g,e,cs,tm,tier){var x=PX(e.x),y=PY(e.y),r=cs*(e.boss?.42:e.k===2?.3:e.k===1?.2:.24),wb=Math.sin(tm*9+(e.ph||0)+e.s*2.3)*.1,rw=r*(1+wb),rh=r*(1-wb),cl=e.boss?EK[3].c:TC[tier%TC.length];
    g.fillStyle=e.hit>0?'#fff':cl;g.strokeStyle=INK;g.lineWidth=e.k===2||e.boss?3:2;g.beginPath();g.moveTo(x-rw,y+rh*.55);g.bezierCurveTo(x-rw,y-rh*1.45,x+rw,y-rh*1.45,x+rw,y+rh*.55);g.closePath();g.fill();g.stroke();
    g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(x-rw*.4,y-rh*.45,r*.18,0,7);g.fill();
    g.fillStyle='#fff';g.fillRect(x-r*.45,y-r*.2,r*.28,r*.3);g.fillRect(x+r*.17,y-r*.2,r*.28,r*.3);g.fillStyle=INK;g.fillRect(x-r*.33,y-r*.12,r*.14,r*.2);g.fillRect(x+r*.29,y-r*.12,r*.14,r*.2);
    skin(g,x,y,r,rw,rh,tier,tm,e);
    if(e.st>0){g.fillStyle='#fff36a';for(var i=0;i<3;i++){var a=tm*5+i*2.1;g.fillRect(x+Math.cos(a)*r*.8-1.5,y-r*1.1+Math.sin(a)*r*.25-1.5,3,3)}}
    if(e.boss){g.fillStyle='#f3c623';g.beginPath();g.moveTo(x-r*.6,y-r*.8);g.lineTo(x-r*.6,y-r*1.25);g.lineTo(x-r*.3,y-r);g.lineTo(x,y-r*1.35);g.lineTo(x+r*.3,y-r);g.lineTo(x+r*.6,y-r*1.25);g.lineTo(x+r*.6,y-r*.8);g.closePath();g.fill()}
    var hp=Math.max(0,e.hp/e.max);if(hp<1||e.boss){var bw=e.boss?cs*1.1:cs*.5;g.fillStyle='rgba(20,18,16,.8)';g.fillRect(x-bw/2,y-r-8,bw,4);g.fillStyle=e.boss?'#e2361b':'#3fe09a';g.fillRect(x-bw/2,y-r-8,bw*hp,4)}}
  /* un skin de slime toutes les 10 vagues */
  function skin(g,x,y,r,rw,rh,tier,tm,e){var top=y-rh*.95;g.strokeStyle=INK;g.lineWidth=1.5;
    if(tier===1){g.fillStyle='#4caf50';g.beginPath();g.ellipse(x+r*.15,top-r*.12,r*.32,r*.13,-.5,0,7);g.fill();g.stroke();g.beginPath();g.moveTo(x,top+r*.05);g.lineTo(x+r*.1,top-r*.1);g.stroke()}
    else if(tier===2){g.fillStyle='#efe6d0';[-1,1].forEach(function(s){g.beginPath();g.moveTo(x+s*r*.5,top+r*.25);g.lineTo(x+s*r*.75,top-r*.35);g.lineTo(x+s*r*.25,top+r*.15);g.closePath();g.fill();g.stroke()})}
    else if(tier===3){g.fillStyle='#3a2a20';for(var i=-1;i<=1;i++){g.beginPath();g.moveTo(x+i*r*.4-r*.15,top+r*.18);g.lineTo(x+i*r*.4,top-r*.3);g.lineTo(x+i*r*.4+r*.15,top+r*.18);g.closePath();g.fill()}}
    else if(tier===4){g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(x-r*.55,y-r*.38);g.lineTo(x-r*.15,y-r*.25);g.moveTo(x+r*.55,y-r*.38);g.lineTo(x+r*.15,y-r*.25);g.stroke();g.strokeStyle='#7a1a10';g.beginPath();g.moveTo(x+r*.25,y-r*.6);g.lineTo(x+r*.55,y+r*.1);g.stroke()}
    else if(tier===5){g.fillStyle='#8a929c';g.beginPath();g.arc(x,y-rh*.25,rw*.92,Math.PI*1.05,-.05*Math.PI);g.closePath();g.fill();g.stroke();g.fillStyle='#c9d0d8';g.fillRect(x-r*.06,y-rh*1.25,r*.12,r*.3)}
    else if(tier===6){g.fillStyle='#ff2a2a';g.shadowColor='#ff2a2a';g.shadowBlur=8;g.fillRect(x-r*.45,y-r*.2,r*.28,r*.3);g.fillRect(x+r*.17,y-r*.2,r*.28,r*.3);g.shadowBlur=0;g.fillStyle='#fff';g.beginPath();g.moveTo(x-r*.25,y+r*.2);g.lineTo(x-r*.15,y+r*.42);g.lineTo(x-r*.05,y+r*.2);g.moveTo(x+r*.05,y+r*.2);g.lineTo(x+r*.15,y+r*.42);g.lineTo(x+r*.25,y+r*.2);g.fill()}
    else if(tier>=7){g.globalAlpha=.35;g.fillStyle='#a04ee0';g.beginPath();g.arc(x,y-r*.3,r*1.35,0,7);g.fill();g.globalAlpha=1;
      for(i=0;i<5;i++){var fl=Math.sin(tm*12+i*1.7+(e.ph||0))*r*.12;g.fillStyle=i%2?'#c04fe0':'#ff7a2a';g.beginPath();g.moveTo(x+(i-2)*r*.28-r*.12,top+r*.15);g.lineTo(x+(i-2)*r*.28,top-r*.45+fl);g.lineTo(x+(i-2)*r*.28+r*.12,top+r*.15);g.closePath();g.fill()}
      g.fillStyle='#e8e2ff';g.fillRect(x-r*.45,y-r*.2,r*.28,r*.3);g.fillRect(x+r*.17,y-r*.2,r*.28,r*.3);g.fillStyle='#7a1aff';g.fillRect(x-r*.36,y-r*.12,r*.12,r*.16);g.fillRect(x+r*.26,y-r*.12,r*.12,r*.16)}}
  /* le terrain change toutes les 10 vagues, de plus en plus inquiétant jusqu'au boss final */
  var THEME=[{n:'Montreuil',bg:'#1f3a22',path:'#c9a86a',me:'#27402a',al:'#2a3240',d:'fleur'},
    {n:'Crépuscule',bg:'#2c2a1c',path:'#b8915a',me:'#2b3824',al:'#2b2e3a',d:'herbe',tint:'rgba(255,110,30,.07)'},
    {n:'Le Marais',bg:'#1b2618',path:'#857a4c',me:'#22301d',al:'#252b33',d:'flaque',tint:'rgba(60,140,40,.08)'},
    {n:'La Forêt morte',bg:'#221f19',path:'#76644a',me:'#29281f',al:'#26252c',d:'arbre',tint:'rgba(40,30,10,.12)'},
    {n:'Les Cendres',bg:'#251b17',path:'#665044',me:'#2b221d',al:'#26212a',d:'braise',tint:'rgba(255,60,0,.07)'},
    {n:'La Nuit noire',bg:'#10141d',path:'#48485a',me:'#1b2330',al:'#1b1e2b',d:'tombe',tint:'rgba(0,0,40,.22)',fog:1},
    {n:'Le Sang',bg:'#1e0c0c',path:'#5a2924',me:'#2a1515',al:'#21141c',d:'crane',tint:'rgba(150,0,0,.13)',fog:1},
    {n:'Le Néant',bg:'#0b0710',path:'#2e2136',me:'#19131f',al:'#15111c',d:'faille',tint:'rgba(90,0,140,.18)',fog:1}];
  var DECO=(function(){var a=[],sd=11;function r(){sd=(sd*9301+49297)%233280;return sd/233280}
    for(var i=0;i<34;i++){var side=i%2,s=r()*PER,o={x:0,y:0};pos(s,o);var out=r()<.5?.38:-.38;var lx=o.x,ly=o.y;if(ly<0||ly>4)ly+=ly<0?-out*0:0;
      if(o.y===-.5)ly=-.5+(r()<.5?-.36:.36);else if(o.y===4.5)ly=4.5+(r()<.5?-.36:.36);else lx=o.x+(r()<.5?-.36:.36);
      if(side===0&&o.y===-.5&&Math.abs(ly-(-.5))<.5)ly=-.5-.36;if(side===1&&o.y===-.5)ly=-.5-.36;a.push({side:side,x:lx,y:ly,k:r()})}return a})();
  function decor(g,cs,th,tm){var o={x:0,y:0};DECO.forEach(function(d,i){wp(d.side,d.x,d.y,o);var x=PX(o.x),y=PY(o.y),z=cs*.16;g.lineWidth=1.5;g.strokeStyle=INK;
      if(th.d==='fleur'){g.fillStyle=['#ff7aa8','#ffe066','#9fd0ff','#fff'][i%4];g.beginPath();g.arc(x,y,z*.45,0,7);g.fill();g.fillStyle='#f3c623';g.beginPath();g.arc(x,y,z*.18,0,7);g.fill()}
      else if(th.d==='herbe'){g.strokeStyle='#6a7a3a';g.beginPath();g.moveTo(x-z*.4,y+z*.4);g.lineTo(x-z*.2,y-z*.5);g.moveTo(x,y+z*.4);g.lineTo(x+z*.05,y-z*.7);g.moveTo(x+z*.4,y+z*.4);g.lineTo(x+z*.3,y-z*.4);g.stroke()}
      else if(th.d==='flaque'){g.fillStyle='rgba(40,70,30,.75)';g.beginPath();g.ellipse(x,y,z*1.1,z*.5,0,0,7);g.fill();g.fillStyle='rgba(140,220,90,.35)';g.beginPath();g.arc(x+z*.3,y-z*.1,z*.15+Math.sin(tm*3+i)*z*.05,0,7);g.fill()}
      else if(th.d==='arbre'){g.strokeStyle='#2a1c12';g.lineWidth=2.5;g.beginPath();g.moveTo(x,y+z*.6);g.lineTo(x,y-z*.9);g.moveTo(x,y-z*.3);g.lineTo(x-z*.6,y-z*.9);g.moveTo(x,y-z*.5);g.lineTo(x+z*.55,y-z*1.1);g.stroke()}
      else if(th.d==='braise'){var f=.5+.5*Math.sin(tm*6+i*1.3);g.fillStyle='rgba(255,'+Math.round(80+f*80)+',0,'+(.4+f*.5)+')';g.beginPath();g.arc(x,y,z*.35,0,7);g.fill();g.strokeStyle='rgba(255,90,0,.5)';g.beginPath();g.moveTo(x-z,y);g.lineTo(x-z*.3,y-z*.2);g.lineTo(x+z*.2,y+z*.3);g.lineTo(x+z,y+z*.1);g.stroke()}
      else if(th.d==='tombe'){g.fillStyle='#6d717a';g.beginPath();g.moveTo(x-z*.5,y+z*.5);g.lineTo(x-z*.5,y-z*.3);g.arc(x,y-z*.3,z*.5,Math.PI,0);g.lineTo(x+z*.5,y+z*.5);g.closePath();g.fill();g.stroke();g.strokeStyle='#3a3d44';g.beginPath();g.moveTo(x,y-z*.5);g.lineTo(x,y+z*.1);g.moveTo(x-z*.2,y-z*.3);g.lineTo(x+z*.2,y-z*.3);g.stroke()}
      else if(th.d==='crane'){g.fillStyle='#e8e2d6';g.beginPath();g.arc(x,y-z*.1,z*.5,0,7);g.fill();g.fillRect(x-z*.28,y+z*.2,z*.56,z*.3);g.fillStyle=INK;g.beginPath();g.arc(x-z*.2,y-z*.1,z*.14,0,7);g.arc(x+z*.2,y-z*.1,z*.14,0,7);g.fill()}
      else if(th.d==='faille'){var f2=.5+.5*Math.sin(tm*4+i);g.strokeStyle='rgba(190,90,255,'+(.4+f2*.6)+')';g.lineWidth=2.5;g.shadowColor='#b04fff';g.shadowBlur=8;g.beginPath();g.moveTo(x-z*1.1,y-z*.2);g.lineTo(x-z*.4,y+z*.2);g.lineTo(x+z*.1,y-z*.3);g.lineTo(x+z*.9,y+z*.15);g.stroke();g.shadowBlur=0}})}
  function camp(g,side,cs,label,col){pos(SPAWN,TMP);wp(side,TMP.x,TMP.y,TMP);var x=PX(TMP.x),y=PY(TMP.y);
    g.fillStyle='#4a3524';g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(x-cs*.42,y+cs*.3);g.lineTo(x-cs*.42,y-cs*.1);g.lineTo(x,y-cs*.38);g.lineTo(x+cs*.42,y-cs*.1);g.lineTo(x+cs*.42,y+cs*.3);g.closePath();g.fill();g.stroke();
    g.fillStyle='#1a120c';g.beginPath();g.arc(x,y+cs*.3,cs*.18,Math.PI,0);g.fill();
    g.font='800 '+Math.max(10,cs*.24)+'px Inter, system-ui, sans-serif';var tw=g.measureText(label).width;g.fillStyle='rgba(20,18,16,.7)';rr(g,x+cs*.55,y-cs*.17,tw+12,cs*.34,6);g.fill();txt(g,label,x+cs*.55+6,y,Math.max(10,cs*.24),col,'left','800')}
  function drawBoard(g){var cs=LY.cs,tm=G.time,T=G.T[0],me={g:T.g,e:T.e,sel:T.sel},al=G.ally==='bot'?{g:G.T[1].g,e:G.T[1].e}:(P||{g:[],e:[]}),
      tierMe=Math.floor((G.w-1)/10),tierAl=Math.floor(((G.ally==='bot'||!P?G.w:P.w)-1)/10),th=THEME[Math.min(7,tierMe)];
    /* chemins : anneau autour de chaque territoire, celui du milieu est partagé */
    g.fillStyle=th.bg;rr(g,PX(-1),PY(-1),cs*10,cs*11,cs*.3);g.fill();
    g.fillStyle=th.path;[[-1,-1],[-1,4]].forEach(function(o){rr(g,PX(o[0]),PY(o[1]),cs*10,cs*6,cs*.3);g.fill()});
    g.fillStyle='rgba(255,240,200,.12)';g.fillRect(PX(-.5),PY(4),cs*9,cs);
    g.strokeStyle='rgba(20,18,16,.22)';g.lineWidth=1.5;g.setLineDash([cs*.25,cs*.25]);g.strokeRect(PX(-.5),PY(-.5),cs*9,cs*5);g.strokeRect(PX(-.5),PY(4.5),cs*9,cs*5);g.setLineDash([]);
    decor(g,cs,th,tm);
    txt(g,'CHEMIN PARTAGÉ',PX(4),PY(4.5),Math.max(9,cs*.2),'rgba(20,18,16,.35)','center','900');
    /* territoires */
    [[0,5,th.me,'#3fe09a'],[0,0,th.al,'#7fb0ff']].forEach(function(o){g.fillStyle=o[2];g.fillRect(PX(o[0]),PY(o[1]),cs*8,cs*4);
      for(var i=0;i<32;i++){g.fillStyle=(i+(i/8|0))%2?'rgba(255,255,255,.05)':'rgba(0,0,0,.08)';g.fillRect(PX(i%8)+1,PY(o[1]+(i/8|0))+1,cs-2,cs-2)}
      g.strokeStyle=o[3];g.lineWidth=3;g.strokeRect(PX(o[0]),PY(o[1]),cs*8,cs*4)});
    camp(g,0,cs,T.name==='Toi'?'TON CAMP':T.name,'#3fe09a');camp(g,1,cs,G.T[1].name,'#7fb0ff');
    /* unités */
    if(th.tint){g.fillStyle=th.tint;rr(g,PX(-1),PY(-1),cs*10,cs*11,cs*.3);g.fill()}
    units(al).forEach(function(c){var r=c.a/8|0;tile(g,PX(c.a%8),PY(4-r-c.h),cs,c,false,tm+1.3)});
    units(me).forEach(function(c){tile(g,PX(c.a%8),PY(5+(c.a/8|0)),cs,c,c.a===me.sel,tm,DRAG&&DRAG.moved&&DRAG.o===c?.3:null)});
    var sc=me.sel>=0?me.g[me.sel]:null;if(sc){g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2;g.setLineDash([6,5]);g.beginPath();g.arc(PX(sc.a%8+sc.w/2),PY(5+(sc.a/8|0)+sc.h/2),U[sc.u].rng*cs,0,7);g.stroke();g.setLineDash([])}
    /* tirs */
    if(ANIM)G.fx.forEach(function(f){g.globalAlpha=Math.min(1,f.t*6);
      if(f.k==='txt'){txt(g,f.s,PX(f.x),PY(f.y)-(1-f.t)*cs*.6,Math.max(11,cs*.3),f.c,'center','900')}
      else if(f.k==='shot'){var k=1-f.t/.16,x=PX(f.x1)+(PX(f.x2)-PX(f.x1))*k,y=PY(f.y1)+(PY(f.y2)-PY(f.y1))*k;
        if(f.s==='arc'||f.s==='vis'){var a=Math.atan2(PY(f.y2)-PY(f.y1),PX(f.x2)-PX(f.x1));g.strokeStyle=f.c;g.lineWidth=2.5;g.beginPath();g.moveTo(x-Math.cos(a)*cs*.25,y-Math.sin(a)*cs*.25);g.lineTo(x,y);g.stroke()}
        else{g.fillStyle=ORB[f.s]||f.c;g.beginPath();g.arc(x,y,cs*.09,0,7);g.fill();g.strokeStyle=f.c;g.lineWidth=1.5;g.stroke()}}
      else if(f.k==='zap'){g.strokeStyle=f.c;g.lineWidth=2.5;g.beginPath();g.moveTo(PX(f.x1),PY(f.y1));var mx=(PX(f.x1)+PX(f.x2))/2+(Math.random()-.5)*8,my=(PY(f.y1)+PY(f.y2))/2+(Math.random()-.5)*8;g.lineTo(mx,my);g.lineTo(PX(f.x2),PY(f.y2));g.stroke()}
      else{g.strokeStyle=f.c;g.lineWidth=f.k==='die'?2:3;g.beginPath();g.arc(PX(f.x),PY(f.y),Math.max(1,(f.k==='die'?(f.r||.3)*(1.6-f.t*2):f.r*(1.2-f.t*2)))*cs,0,7);g.stroke()}});g.globalAlpha=1;
    /* slimes */
    al.e.forEach(function(e){if(e.hp>0)slime(g,e,cs,tm,tierAl)});me.e.forEach(function(e){slime(g,e,cs,tm,tierMe)});
    if(th.fog){g.save();g.beginPath();rr(g,PX(-1),PY(-1),cs*10,cs*11,cs*.3);g.clip();for(var k=0;k<5;k++){var fx=PX(-1)+((tm*cs*.25+k*cs*2.3)%(cs*12))-cs,fy=PY(-1)+cs*(1+k*2.1);g.fillStyle='rgba(200,200,230,.06)';g.beginPath();g.ellipse(fx,fy,cs*2.2,cs*.6,0,0,7);g.fill()}g.restore()}
    if(G.w>=WMAX){var pu=.12+.1*Math.sin(tm*3);var vg=g.createRadialGradient(PX(4),PY(4.5),cs*2,PX(4),PY(4.5),cs*7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(180,0,0,'+pu+')');g.fillStyle=vg;rr(g,PX(-1),PY(-1),cs*10,cs*11,cs*.3);g.fill()}
    else if(tierMe>=3){var vg2=g.createRadialGradient(PX(4),PY(4.5),cs*3,PX(4),PY(4.5),cs*7.5);vg2.addColorStop(0,'rgba(0,0,0,0)');vg2.addColorStop(1,'rgba(0,0,0,'+Math.min(.45,tierMe*.06)+')');g.fillStyle=vg2;rr(g,PX(-1),PY(-1),cs*10,cs*11,cs*.3);g.fill()}
    txt(g,th.n.toUpperCase(),PX(8.9),PY(-.75),Math.max(9,cs*.2),'rgba(241,236,226,.45)','right','900');
    /* glisser-déposer : aperçu de la place visée, et l'unité sous le doigt */
    if(DRAG&&DRAG.moved){var A=DRAG.o,b=cellAt(DRAG.x,DRAG.y);if(b>=0){var nb=dropAt(A,b),B=T.g[b],ok=B&&B!==A&&B.u===A.u&&B.n+A.n<=3||fits(T,nb,A.w,A.h,[A])||!!B;
        g.fillStyle=ok?'rgba(63,224,154,.28)':'rgba(226,54,27,.28)';g.fillRect(PX(nb%8),PY(5+(nb/8|0)),cs*A.w,cs*A.h);g.strokeStyle=ok?'#3fe09a':'#e2361b';g.lineWidth=2;g.strokeRect(PX(nb%8),PY(5+(nb/8|0)),cs*A.w,cs*A.h)}
      tile(g,DRAG.x-cs*A.w/2,DRAG.y-cs*A.h/2,cs,A,true,tm,.85)}}

  function button(g,r,title,sub,col,on,hot){g.fillStyle=on?'rgba(20,18,16,.85)':'rgba(20,18,16,.45)';rr(g,r[0],r[1]+3,r[2],r[3],12);g.fill();
    g.fillStyle=on?(col||'#2b2723'):'#2b2723';rr(g,r[0],r[1],r[2],r[3]-3,12);g.fill();
    g.strokeStyle=hot?'#fff':'rgba(241,236,226,.18)';g.lineWidth=hot?3:1.5;g.stroke();
    var cx=r[0]+r[2]/2,big1=r[3]>100&&r[2]>200,fs=big1?26:r[3]>60&&r[2]>120?17:r[3]>40?15:14;
    g.font='800 '+fs+'px Inter, system-ui, sans-serif';var tw=g.measureText(title).width;if(tw>r[2]-10)fs*=(r[2]-10)/tw;
    txt(g,title,cx,r[1]+r[3]*(sub?.38:.5),fs,on?(col==='#f3c623'?INK:CR):'rgba(241,236,226,.45)','center','800');
    if(sub){var f2=big1?16:12;g.font='600 '+f2+'px Inter, system-ui, sans-serif';var t2=g.measureText(sub).width;if(t2>r[2]-8)f2*=(r[2]-8)/t2;txt(g,sub,cx,r[1]+r[3]*.7,f2,on?'rgba(241,236,226,.85)':'rgba(241,236,226,.35)','center','600')}}

  function draw(C){var g=C.g;layout(C);var W=LY.W,H=LY.H;g.fillStyle='#1c1a18';g.fillRect(0,0,W,H);
    if(!G){txt(g,'DEFEND MONTREUIL',W/2,H/2,30);return}
    var T=G.T[0];drawBoard(g);
    /* barre du haut : vague, compteur de slimes, temps */
    var n=G.count||0,bw=LY.v?250:290,bx=LY.v?(W-bw)/2:172,f=Math.min(1,n/LIM);
    big(g,'VAGUE '+G.w+'/'+WMAX,12,25,LY.v?21:24,G.boss?'#e2361b':CR,'left');
    var sec=Math.max(0,Math.ceil(G.t));txt(g,(G.boss?'BOSS ':'')+Math.floor(sec/60)+':'+('0'+sec%60).slice(-2),LY.v?W-14:944,25,LY.v?19:22,G.boss&&sec<10?'#e2361b':CR,'right','800');
    g.fillStyle='#000';rr(g,bx,8,bw,34,10);g.fill();g.fillStyle=f>.8?'#e2361b':f>.55?'#f3c623':'#3fe09a';rr(g,bx,8,Math.max(10,bw*f),34,10);g.fill();
    g.strokeStyle='rgba(241,236,226,.3)';g.lineWidth=1.5;rr(g,bx,8,bw,34,10);g.stroke();
    txt(g,'SLIMES (ÉQUIPE) '+n+' / '+LIM,bx+bw/2,25,LY.v?16:16,f>.55&&f<=.8?INK:CR,'center','900');
    /* panneau */
    var B=LY.b,r=B.info;g.fillStyle='#24211e';rr(g,r[0],r[1],r[2],r[3],12);g.fill();
    coin(g,r[0]+18,r[1]+18,9);txt(g,''+T.gold,r[0]+32,r[1]+18,17,'#f3c623','left','800');
    gem(g,r[0]+110,r[1]+18,9);txt(g,''+T.gems,r[0]+124,r[1]+18,17,'#4fe0d0','left','800');
    txt(g,'Chance '+T.luck,r[0]+170,r[1]+18,13,'#3fe09a','left','800');
    var c=T.sel>=0?T.g[T.sel]:null,dim='rgba(241,236,226,.65)';
    if(c){var u=U[c.u],m=mult(T,c.u),st=RAR[u.r].n+' · '+Math.round(u.dmg*m/u.cd*c.n)+' dégâts/s · portée '+u.rng+(u.spl?' · zone':'')+(u.ch?' · rebonds':'')+(u.slow?' · ralentit':'')+(u.stun?' · étourdit':''),pa=u.p?'Passif · '+u.p:'Pas de passif';
      txt(g,u.n+' ×'+c.n,r[0]+14,r[1]+(LY.v?38:44),15,RAR[u.r].c,'left','800');txt(g,st,r[0]+14,r[1]+(LY.v?55:66),11.5,'rgba(241,236,226,.8)','left','600');
      g.save();g.beginPath();g.rect(r[0],r[1],r[2]-6,r[3]);g.clip();txt(g,pa,r[0]+14,r[1]+(LY.v?70:88),11,u.p?'#f3c623':dim,'left','600');g.restore()}
    else{txt(g,'Touche une unité pour la choisir. Maintiens-la et glisse',r[0]+14,r[1]+(LY.v?42:50),12,dim,'left','600');txt(g,'pour la déplacer. 3 identiques sur une case = fusion.',r[0]+14,r[1]+(LY.v?60:70),12,dim,'left','600')}
    button(g,B.don,'DONNER',null,'#2f7d4f',true,false);
    button(g,B.sum,'INVOQUER',T.cost+' or','#e8a23a',T.gold>=T.cost&&room(T),false);
    var canF=c&&c.n===3&&U[c.u].r<3;button(g,B.fus,'FUSION',canF?'→ '+RAR[U[c.u].r+1].n:c&&U[c.u].r>=3?'recettes':'3 identiques','#a04ee0',canF,canF);
    button(g,B.sel,'VENDRE',c?'+'+SELL[U[c.u].r]+' or':'1 unité','#55595e',!!c,false);
    var PN=['PARI ÉPIQUE','PARI LÉGEND.'];PARI.forEach(function(p,k){button(g,B['p'+k],PN[k],p[1]+' gemme'+(p[1]>1?'s':'')+' · '+Math.round(p[2]*100)+' %',RAR[p[0]].d,T.gems>=p[1],false)});
    var nc=RK.filter(function(mm){return canCraft(T,mm)}).length;button(g,B.rec,'RECETTES',nc?nc+' prêt'+(nc>1?'s':'')+' !':'Mythiques','#7d1606',true,!!nc);
    var cheap=T.luck<10&&T.gold>=LCOST[T.luck-1];button(g,B.upg,'AMÉLIOR.','Chance, dégâts','#17448e',true,cheap);
    button(g,B.x2,'VITESSE : '+(G.x2?'×2':'×1'),null,G.x2?'#e8a23a':'#3a3530',true,!!G.x2);
    button(g,B.anim,'ANIMATIONS : '+(ANIM?'OUI':'NON'),null,ANIM?'#3a3530':'#55595e',true,false);
    if(!LY.v){txt(g,'Les slimes sortent de vos camps et passent par',472,478,12,dim,'left','600');txt(g,'le chemin du milieu : vous pouvez tous les deux',472,496,12,dim,'left','600');txt(g,'les taper. 100 slimes sur le terrain = perdu.',472,514,12,dim,'left','600')}
    /* message */
    if(G.warn>0&&G.wtxt){g.globalAlpha=Math.min(1,G.warn*2);var mx=PX(4),my=PY(7);g.font='800 15px Inter, system-ui, sans-serif';var tw=Math.min(LY.cs*10-10,g.measureText(G.wtxt).width+28);
      g.fillStyle='rgba(20,18,16,.88)';rr(g,mx-tw/2,my-18,tw,36,10);g.fill();txt(g,G.wtxt,mx,my,15,G.wok?'#3fe09a':/BOSS/.test(G.wtxt)?'#e2361b':'#f3c623','center','800');g.globalAlpha=1}
    if(G.wheel)drawWheel(g);
    if(G.rec)drawRec(g);
    if(G.upg)drawUpg(g)}

  function drawWheel(g){var W=G.wheel,p=PARI[W.k],cs=LY.cs,cx=PX(4),cy=PY(7),R=cs*2.2,A=Math.PI*2,rot=W.rot||0,col=RAR[p[0]].c;
    g.fillStyle='rgba(10,9,8,.55)';g.beginPath();g.arc(cx,cy,R+18,0,A);g.fill();
    g.save();g.translate(cx,cy);g.rotate(rot);
    g.fillStyle=col;g.beginPath();g.moveTo(0,0);g.arc(0,0,R,0,p[2]*A);g.closePath();g.fill();
    for(var i=0;i<3;i++){var a0=p[2]*A+(1-p[2])*A*i/3,a1=p[2]*A+(1-p[2])*A*(i+1)/3;g.fillStyle=i%2?'#3a3530':'#4a443d';g.beginPath();g.moveTo(0,0);g.arc(0,0,R,a0,a1);g.closePath();g.fill()}
    g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.arc(0,0,R,0,A);g.stroke();
    g.save();g.rotate(p[2]*A/2);txt(g,RAR[p[0]].n.toUpperCase(),R*.6,0,Math.max(10,R*.13),INK,'center','900');g.restore();
    for(i=0;i<3;i++){g.save();g.rotate(p[2]*A+(1-p[2])*A*(i+.5)/3);txt(g,'RATÉ',R*.6,0,Math.max(10,R*.14),'rgba(241,236,226,.7)','center','800');g.restore()}
    g.restore();
    g.fillStyle='#24211e';g.beginPath();g.arc(cx,cy,R*.16,0,A);g.fill();g.strokeStyle=col;g.lineWidth=3;g.stroke();
    g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(cx-12,cy-R-14);g.lineTo(cx+12,cy-R-14);g.lineTo(cx,cy-R+8);g.closePath();g.fill();g.stroke();
    if(W.done){g.globalAlpha=Math.min(1,(W.t-W.dur)*4);big(g,W.win?'GAGNÉ !':'RATÉ…',cx,cy+R+2,Math.max(26,R*.36),W.win?col:'#f1ece2');g.globalAlpha=1}}

  /* ---------- fenêtres : recettes des mythiques, améliorations ---------- */
  function box(){if(G&&G.rec)return LY.v?[10,56,520,890]:[40,36,880,498];return LY.v?[10,110,520,760]:[110,50,740,470]}
  function closeR(){var b=box();return [b[0]+b[2]-56,b[1]+8,48,44]}
  function frame(g,title,col){var b=box();g.fillStyle='rgba(10,9,8,.7)';g.fillRect(0,0,LY.W,LY.H);g.fillStyle='#24211e';rr(g,b[0],b[1],b[2],b[3],16);g.fill();g.strokeStyle=col;g.lineWidth=3;g.stroke();
    big(g,title,b[0]+20,b[1]+30,LY.v?24:28,col,'left');var cl=closeR();g.fillStyle='#3a3530';rr(g,cl[0],cl[1],cl[2],cl[3],10);g.fill();txt(g,'✕',cl[0]+cl[2]/2,cl[1]+cl[3]/2,20,CR,'center','800');return b}
  function recRow(i){var b=box();return LY.v?[b[0]+10,b[1]+56+i*114,b[2]-20,108]:[b[0]+12,b[1]+54+i*62,b[2]-24,58]}
  function recBtn(i){var r=recRow(i);return LY.v?[r[0]+r[2]-150,r[1]+54,140,48]:[r[0]+r[2]-130,r[1]+5,120,48]}
  function recClick(C,x,y){if(inR(closeR(),x,y)||!inR(box(),x,y)){G.rec=false;sfx.play('ui');return}
    var T=G.T[0];RK.forEach(function(m,i){if(inR(recBtn(i),x,y)){if(!canCraft(T,m)){say('Il manque des unités',0);sfx.play('lose');return}T.sel=-1;var id=craft(T,m);G.rec=false;got(C,id,'Invoqué : ')}})}
  function drawRec(g){var T=G.T[0],b=frame(g,'RECETTES DES MYTHIQUES',RAR[4].c);
    txt(g,'en vert : déjà sur ton territoire',b[0]+(LY.v?20:360),b[1]+(LY.v?50:30),11,'rgba(241,236,226,.55)','left','600');
    RK.forEach(function(m,i){var r=recRow(i),u=U[m],ok=canCraft(T,m);g.fillStyle=ok?'#3a2420':'#2d2a26';rr(g,r[0],r[1],r[2],r[3],12);g.fill();
      var ts=50;tile(g,r[0]+4,r[1]+4,ts,{u:m,n:1},false,G.time);
      txt(g,u.n,r[0]+ts+14,r[1]+17,LY.v?17:16,RAR[4].c,'left','900');
      var x=r[0]+ts+14+(LY.v?0:130),y=r[1]+(LY.v?42:17);g.font='700 '+(LY.v?13:12.5)+'px Inter, system-ui, sans-serif';g.textAlign='left';g.textBaseline='middle';
      REC[m].forEach(function(id,j){var has=have(T,id)>=0;if(j){g.fillStyle='rgba(241,236,226,.5)';g.fillText(' + ',x,y);x+=g.measureText(' + ').width}
        g.fillStyle=has?'#3fe09a':RAR[U[id].r].c;g.globalAlpha=has?1:.55;g.fillText(U[id].n,x,y);x+=g.measureText(U[id].n).width;g.globalAlpha=1});
      g.save();g.beginPath();g.rect(r[0],r[1],r[2]-(LY.v?160:140),r[3]);g.clip();txt(g,u.p,r[0]+(LY.v?12:ts+14),r[1]+(LY.v?86:41),11,'rgba(243,198,35,.9)','left','600');g.restore();
      button(g,recBtn(i),'CRÉER',ok?'prêt !':'il manque…','#e2361b',ok,ok)})}
  /* améliorations : Chance (taux d'invocation, 10 niveaux) + dégâts par rareté */
  function upRow(i){var b=box();return LY.v?(i===0?[b[0]+10,b[1]+64,b[2]-20,250]:[b[0]+10,b[1]+324+(i-1)*130,b[2]-20,120]):(i===0?[b[0]+12,b[1]+60,b[2]-24,170]:[b[0]+12,b[1]+240+(i-1)*72,b[2]-24,64])}
  function upBtn(i){var r=upRow(i);return LY.v?(i===0?[r[0]+r[2]-170,r[1]+186,160,56]:[r[0]+r[2]-160,r[1]+56,150,54]):(i===0?[r[0]+r[2]-170,r[1]+108,158,54]:[r[0]+r[2]-150,r[1]+8,138,48])}
  function upgClick(C,x,y){if(inR(closeR(),x,y)||!inR(box(),x,y)){G.upg=false;sfx.play('ui');return}
    for(var i=0;i<4;i++)if(inR(upBtn(i),x,y)){act(C,i===0?'luck':'u'+(i-1));return}}
  function drawUpg(g){var T=G.T[0],b=frame(g,'AMÉLIORATIONS','#3a8cff');
    /* Chance */
    var r=upRow(0),L=LUCK[T.luck-1],N=T.luck<10?LUCK[T.luck]:null;g.fillStyle='#2d2a26';rr(g,r[0],r[1],r[2],r[3],12);g.fill();
    txt(g,'CHANCE · niveau '+T.luck+' / 10',r[0]+14,r[1]+20,17,'#3fe09a','left','900');
    txt(g,'Plus de rares, d\'épiques et de légendaires quand tu invoques.',r[0]+14,r[1]+42,11.5,'rgba(241,236,226,.7)','left','600');
    var colW=LY.v?118:130,x0=r[0]+14,y0=r[1]+(LY.v?70:66);
    ['Commune','Rare','Épique','Légend.'].forEach(function(nm,k){var x=x0+k*(LY.v?(r[2]-28)/4:colW);
      txt(g,nm,x,y0,12,RAR[k].c,'left','800');txt(g,L[k]+' %',x,y0+22,LY.v?20:18,CR,'left','900');
      if(N)txt(g,'→ '+N[k]+' %',x,y0+(LY.v?48:44),13,N[k]>L[k]?'#3fe09a':'rgba(241,236,226,.5)','left','800')});
    var lc=T.luck<10?LCOST[T.luck-1]:0;
    if(LY.v){var mini=r[1]+140;for(var lv=0;lv<10;lv++){g.fillStyle=lv<T.luck?'#3fe09a':'#3a3530';rr(g,r[0]+14+lv*24,mini+50,18,18,4);g.fill()}txt(g,'Niveaux',r[0]+14,mini+36,11,'rgba(241,236,226,.6)','left','700')}
    button(g,upBtn(0),T.luck<10?'AMÉLIORER':'MAXIMUM',T.luck<10?lc+' or':'niveau 10',T.luck<10?'#2f7d4f':'#3a3530',T.luck<10&&T.gold>=lc,false);
    /* dégâts */
    var UN=['Dégâts commune + rare','Dégâts épique + légendaire','Dégâts mythique'],UC=['#17448e','#55207f','#7d1606'];
    [0,1,2].forEach(function(k){var r2=upRow(k+1),co=upCost(T,k);g.fillStyle='#2d2a26';rr(g,r2[0],r2[1],r2[2],r2[3],12);g.fill();
      txt(g,UN[k],r2[0]+14,r2[1]+(LY.v?24:22),15,RAR[[0,2,4][k]].c==='#a3a8ad'?'#cfd3d6':RAR[[1,2,4][k]].c,'left','800');
      txt(g,'Niveau '+T.up[k]+' · +'+(T.up[k]*15)+' % de dégâts',r2[0]+14,r2[1]+(LY.v?50:44),12,'rgba(241,236,226,.75)','left','600');
      button(g,upBtn(k+1),'+15 %',co+(k<2?' or':' gemmes'),UC[k],k<2?T.gold>=co:T.gems>=co,false)})}

  /* une petite règle de style : en vertical, le plateau ne dépasse pas l'écran */
  (function(){var s=document.createElement('style');s.textContent='.pp-touch #v-garde .stage.fs-on>canvas:first-child{width:auto;max-width:100%;max-height:calc(100dvh - 70px - env(safe-area-inset-top,0px));margin:0 auto}';document.head.appendChild(s)})();

  var INTRO='Invoque des unités au hasard avec ton or et pose-les sur ton territoire. <b>3 unités identiques</b> sur une case se fusionnent en une unité plus rare : <span style="color:#a3a8ad">commune</span>, <span style="color:#3a8cff">rare</span>, <span style="color:#a04ee0">épique</span>, <span style="color:#f3c623">légendaire</span>. Les <span style="color:#e2361b">mythiques</span> se créent avec les recettes.<br>Les slimes sortent de vos camps et passent par le <b>chemin du milieu</b>, où vous pouvez tous les deux les taper. À '+LIM+' slimes sur le terrain, c\'est perdu. Un boss toutes les 10 vagues et un boss final à la vague 80.';
  PP.arcade({id:'garde',
    setup:function(C){CP=C;G=null;P=null;LY=null;layout(C);
      C.keysText('<kbd>Espace</kbd> invoquer · maintiens une unité et glisse-la pour la déplacer · <kbd>F</kbd> fusion · <kbd>S</kbd> vendre · <kbd>1</kbd> <kbd>2</kbd> paris · <kbd>3</kbd> recettes · <kbd>4</kbd> améliorations · <kbd>D</kbd> donner · <kbd>X</kbd> vitesse ×2');
      if(C.mode==='online'){
        C.listen(function(m){onNet(C,m)});
        if(net.isHost)C.over('DEFEND MONTREUIL · duo',INTRO+'<br><b>En duo, en équipe</b> : même compteur de slimes, même objectif, vous gagnez ou perdez ensemble. Le bouton <b>DONNER</b> passe une unité (ou 50 or) à ton coéquipier.','Lancer la partie',function(){hostStart(C)});
        else C.over('DEFEND MONTREUIL · duo',INTRO+'<br><b>En duo, en équipe</b> contre les slimes.<br>Le chef du salon lance la partie.',false);
        return}
      var s=loadSave();
      if(s&&s.mode===C.mode)C.over('DEFEND MONTREUIL',INTRO+'<br><br>Partie sauvegardée : <b>vague '+s.w+'</b>.<br><button type="button" class="primary" id="garde-new" style="margin-top:10px">Nouvelle partie</button>','Continuer (vague '+s.w+')',function(){resume(s);C.go()});
      else C.over('DEFEND MONTREUIL',INTRO,'Jouer')},
    start:function(C){startSolo(C)},
    key:function(C,code,down){if(!down)return;var A={Space:'sum',KeyF:'fus',KeyV:'sel',KeyS:'sel',KeyD:'don',Digit1:'p0',Digit2:'p1',Digit3:'rec',Digit4:'upg',KeyX:'x2',Numpad1:'p0',Numpad2:'p1',Numpad3:'rec',Numpad4:'upg'}[code];
      if(A)act(C,A);if(code==='Escape'&&G){G.T[0].sel=-1;G.rec=false;G.upg=false}},
    /* toucher = choisir une unité ; maintenir et glisser = la déplacer */
    mouse:function(C,t,x,y){if(!G||G.over||!C.running){DRAG=null;return}var T=G.T[0];
      if(t==='move'){if(DRAG){DRAG.x=x;DRAG.y=y;if(!DRAG.moved&&Math.hypot(x-DRAG.sx,y-DRAG.sy)>LY.cs*.3){DRAG.moved=true;T.sel=DRAG.o.a}}return}
      if(t==='up'){if(!DRAG)return;var D=DRAG;DRAG=null;if(!D.moved){T.sel=T.sel===D.o.a?-1:D.o.a;sfx.play('tick');return}
        var b=cellAt(x,y);if(b<0||T.g[b]===D.o)return;var r=move(T,D.o.a,b);if(r<0){say('Pas la place ici',0);sfx.play('lose');return}T.sel=T.g[r]?T.g[r].a:-1;sfx.play('pickup');return}
      if(t!=='down')return;var B=LY.b;
      if(G.rec){recClick(C,x,y);return}if(G.upg){upgClick(C,x,y);return}
      for(var k in B)if(k!=='info'&&inR(B[k],x,y)){act(C,k);return}
      var i=cellAt(x,y);if(i<0||!T.g[i]){T.sel=-1;return}
      DRAG={o:T.g[i],sx:x,sy:y,x:x,y:y,moved:false}},
    step:function(C,dt){step(C,dt);if(G&&G.x2&&!G.over)step(C,dt)},
    draw:function(C){draw(C)},
    close:function(){G=null;P=null}
  });
  document.addEventListener('click',function(e){if(e.target&&e.target.id==='garde-new'&&CP){clearSave();startSolo(CP);CP.go()}});
  window.addEventListener('resize',function(){if(CP&&PP.cur()==='garde'){LY=null;layout(CP)}});
  /* pour les tests */
  PP.gardeSim={terr:terr,summon:summon,fuse:fuse,bot:bot,stepWorld:stepWorld,enemy:enemy,DIF:DIF,U:U,hpOf:hpOf,LUCK:LUCK};
})();
