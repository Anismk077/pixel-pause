/* Pixel Pause — Saute-Pixel v62 : jeu de plateformes original du site.
   4 mondes, chacun termine par un boss. Blocs à frapper par en dessous (cristaux, bonus), briques à casser quand on est grand,
   bonus : Gélule (grandir), Flamme (lancer des boules de feu), Prisme (invincible quelques secondes).
   Ennemis : gluants, chauves-souris, hérissons (on ne peut pas les écraser), scarabées (carapace qu'on peut lancer), flammèches des fosses.
   Mode 2 joueurs sur le même clavier. Les niveaux sont les mêmes pour tout le monde (classement juste). */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',W=960,H=540,T=40,RH=14,OY=H-RH*T,S;
  var TH=[
    {n:'Prairie',sky:['#8fd0f5','#e3f4ff'],far:'#a9d8c0',hill:'#6fbf55',hill2:'#9ed784',dirt:'#8a5a34',dirt2:'#6f4628',top:'#4fae4a',top2:'#7fd36a',fric:1,pit:'#3f8fd0',boss:'Gros Gluant'},
    {n:'Canyon',sky:['#ff9a6b','#ffe0a8'],far:'#eaa774',hill:'#c9703f',hill2:'#e39a5f',dirt:'#9a5a35',dirt2:'#7d4528',top:'#d9a441',top2:'#efc46a',fric:1,pit:'#ff5a1f',lava:1,boss:'Scorpion des sables'},
    {n:'Glacier',sky:['#9ec9e8','#eef7ff'],far:'#cfe4f2',hill:'#b2d2e8',hill2:'#d9ebf6',dirt:'#5d7d99',dirt2:'#4b6884',top:'#eef6fb',top2:'#ffffff',fric:.3,pit:'#2f6f9a',boss:'Golem de glace'},
    {n:'Château de nuit',sky:['#15142e','#43306e'],far:'#26224a',hill:'#2c2a55',hill2:'#3a3670',dirt:'#4a4560',dirt2:'#3a364e',top:'#7a6ad0',top2:'#9d8ff0',fric:1,pit:'#ff4a1a',lava:1,boss:'Roi Corbeau'}];
  var NW=TH.length;
  function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
  function hsh(n){n=(n*2654435761)>>>0;n^=n>>>15;return n>>>0}

  /* ---------- fabrication des niveaux (morceaux enchaînés, puis l'arène du boss) ---------- */
  function gen(lv){var R=rng(4242+lv*977),Wd=[118,132,146,160][lv],AR=24,TW=Wd+AR,g=[],ents=[],items={},i,x=0,top=11,lastCp=0,last=-1,NF=11;
    for(var y=0;y<RH;y++)g.push(new Array(TW).fill(' '));
    function ground(x0,x1,tp){for(var a=Math.max(0,x0);a<Math.min(TW,x1);a++)for(var b=tp;b<RH;b++)g[b][a]='#'}
    function put(r,c,ch){if(r>=0&&r<RH&&c>=0&&c<TW)g[r][c]=ch}
    function qb(r,c,what){if(r<1)return;put(r,c,'?');items[c+','+r]=what}
    function en(k,tx,ty,o){var e={k:k,tx:tx,ty:ty};if(o)for(var q in o)e[q]=o[q];ents.push(e)}
    function prize(){var r=R();return r<.2?'pw':r<.25?'star':'o'}
    ground(0,12,top);qb(top-4,7,'pw');put(top-4,6,'B');put(top-4,8,'B');x=12;
    while(x<Wd-14){
      if(x-lastCp>34){ground(x,x+5,top);put(top-1,x+2,'c');x+=5;lastCp=x;continue}
      var f=Math.floor(R()*NF);if(f===last)f=(f+1)%NF;if((f===9||f===10)&&lv<1)f=f===9?4:0;last=f;
      if(f===0){var n=7+Math.floor(R()*4);ground(x,x+n,top);for(i=1;i<n-1;i++)if(R()<.45)put(top-2,x+i,'o');en(lv>1&&R()<.4?'k':'s',x+n/2,top);if(lv>0&&n>8)en('s',x+2,top);x+=n}
      else if(f===1){var w=2+Math.floor(R()*(lv>0?3:2));ground(x,x+2,top);x+=2;for(i=0;i<w;i++)put(top-3-(i>0&&i<w-1?1:0),x+i,'o');if(lv>0&&w>=3&&R()<.6)en('j',x+w/2,RH);x+=w;ground(x,x+2,top);x+=2}
      else if(f===2){ground(x,x+9,top);var sw=2+(lv>1?1:0);for(i=0;i<sw;i++)put(top-1,x+3+i,'^');put(top-4,x+3,'o');put(top-4,x+4,'o');if(lv>0)put(top-4,x+5,'o');x+=9}
      else if(f===3){var nt=Math.max(8,Math.min(11,top+(R()<.5?-1:1)*(1+Math.floor(R()*2))));if(nt===top)nt=top>9?top-1:top+1;ground(x,x+7,nt);top=nt;if(R()<.6)en('s',x+4,top);x+=7}
      else if(f===4){ground(x,x+2,top);x+=2;var k=2+Math.floor(R()*2);for(i=0;i<k;i++){x+=2+Math.floor(R()*(lv>0?2:1));var py=top-1-Math.floor(R()*2);put(py,x,'=');put(py,x+1,'=');put(py,x+2,'=');put(py-2,x+1,'o');x+=3}x+=2;ground(x,x+3,top);x+=3}
      else if(f===5){ground(x,x+11,top);put(top-1,x+2,'S');for(i=1;i<=5;i++){put(top-i,x+5,'#');put(top-i,x+6,'#')}for(i=7;i<=9;i++){put(top-i,x+5,'o');put(top-i,x+6,'o')}x+=11}
      else if(f===6){ground(x,x+10,top);en('b',x+5,top-2.6);for(i=2;i<8;i+=2)put(top-1,x+i,'o');if(lv>1)en('s',x+7,top);x+=10}
      else if(f===7){ground(x,x+10,top);for(i=0;i<4;i++)for(var hh=1;hh<=i+1;hh++)put(top-hh,x+2+i,'#');put(top-6,x+5,'o');put(top-6,x+6,'o');for(hh=1;hh<=4;hh++)put(top-hh,x+6,'#');x+=10}
      else if(f===8){ground(x,x+11,top);var r4=top-4;put(r4,x+2,'B');qb(r4,x+3,prize());put(r4,x+4,'B');qb(r4,x+5,'o');put(r4,x+6,'B');if(top-8>=1)qb(top-8,x+4,R()<.3?'star':'o');en(lv>0&&R()<.5?'t':'s',x+8,top);x+=11}
      else if(f===9){ground(x,x+2,top);x+=2;var gw=7;en('mp',x+gw/2-1.5,top-1,{ax:lv===2?0:2.2,ay:lv===2?2.4:0,sp:1.1+lv*.15});if(lv!==1&&R()<.5)en('j',x+gw/2,RH);for(i=1;i<gw-1;i++)put(top-4,x+i,i%2?'o':' ');x+=gw;ground(x,x+3,top);x+=3}
      else{ground(x,x+11,top);en('k',x+4,top);en('t',x+8,top);put(top-4,x+5,'B');qb(top-4,x+6,prize());put(top-4,x+7,'B');x+=11}
    }
    /* fin du parcours : sol plat, point de retour, puis l'arène fermée du boss */
    var e0=Math.min(x,Wd);for(var a=e0;a<TW;a++)for(var b=0;b<RH;b++)g[b][a]=' ';
    ents=ents.filter(function(e){return e.tx<e0-1});ground(e0,TW,top);put(top-1,Wd+1,'c');
    for(i=0;i<3;i++){put(top-4,Wd+9+i,'=');put(top-4,Wd+16+i,'=')}
    return {g:g,ents:ents,items:items,w:TW,top0:11,arena:Wd,atop:top}}
  PP._sautGen=function(lv){return gen(lv)};

  /* ---------- tuiles ---------- */
  function tile(tx,ty){if(tx<0||tx>=S.L.w)return '#';if(ty<0||ty>=RH)return ' ';return S.L.g[ty][tx]}
  function solid(c){return c==='#'||c==='B'||c==='?'||c==='U'||c==='X'}
  function hitBox(x,y,w,h){var x0=Math.floor(x/T),x1=Math.floor((x+w-.01)/T),y0=Math.floor(y/T),y1=Math.floor((y+h-.01)/T);for(var ty=y0;ty<=y1;ty++)for(var tx=x0;tx<=x1;tx++)if(solid(tile(tx,ty)))return {tx:tx,ty:ty};return null}
  /* déplacement d'une boîte avec les blocs : horizontal puis vertical, plateformes fines traversables par-dessous */
  function phys(o,dt,grav){var r={wall:0,ceil:null};o.vy=Math.min(1100,o.vy+(grav==null?2300:grav)*dt);
    o.x+=o.vx*dt;var b=hitBox(o.x,o.y,o.w,o.h);if(b){if(o.vx>0){o.x=b.tx*T-o.w;r.wall=1}else if(o.vx<0){o.x=(b.tx+1)*T;r.wall=-1}}
    var py0=o.y;o.y+=o.vy*dt;o.g=false;b=hitBox(o.x,o.y,o.w,o.h);
    if(b){if(o.vy>0){o.y=b.ty*T-o.h;o.g=true}else{o.y=(b.ty+1)*T;r.ceil=b}o.vy=0}
    else if(o.vy>0){var fy=Math.floor((o.y+o.h)/T),x0=Math.floor(o.x/T),x1=Math.floor((o.x+o.w-.01)/T);for(var i=x0;i<=x1;i++)if(tile(i,fy)==='='&&py0+o.h<=fy*T+2){o.y=fy*T-o.h;o.vy=0;o.g=true;break}}
    return r}
  function over(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

  /* ---------- état ---------- */
  function mkP(i){return {i:i,x:(2+i*1.2)*T,y:(11-1)*T-36,w:24,h:34,vx:0,vy:0,g:false,face:1,coy:0,jb:0,inv:0,an:0,pw:0,star:0,fcd:0,sq:0,on:null,dead:0}}
  function load(lv,keep){var L=gen(lv);S.L=L;S.lv=lv;S.cam=0;S.lt=0;S.banner=2.4;S.boss=null;S.arena=false;S.bossDone=false;S.items=[];S.fb=[];S.bp=[];S.bump={};S.txt=[];S.fx=[];S.dust=0;
    S.ps.forEach(function(p,i){var pw=keep?p.pw:0;var n=mkP(i);n.pw=pw;n.h=pw?50:34;n.y=(L.top0)*T-n.h;S.ps[i]=n});
    S.cp={x:2*T,tx:-1};
    S.en=[];S.mp=[];L.ents.forEach(function(e){
      if(e.k==='mp'){S.mp.push({x:e.tx*T,y:e.ty*T,x0:e.tx*T,y0:e.ty*T,w:3*T,h:14,ax:(e.ax||0)*T,ay:(e.ay||0)*T,sp:e.sp||1,ph:0,dx:0,dy:0});return}
      if(e.k==='j'){S.en.push({k:'j',x:e.tx*T-14,y:RH*T+40,w:28,h:28,vx:0,vy:0,t:(e.tx*.37)%2,alive:true,act:false});return}
      if(e.k==='b'){S.en.push({k:'b',x:e.tx*T-15,y:e.ty*T-20,x0:e.tx*T-15,y0:e.ty*T-20,w:30,h:20,vx:0,vy:0,ph:e.tx,alive:true,act:false});return}
      var dir=(e.tx*7)%2?1:-1,sp=e.k==='k'?50:e.k==='t'?60:55+lv*10;
      S.en.push({k:e.k,x:e.tx*T-15,y:e.ty*T-(e.k==='t'?26:24),w:30,h:e.k==='t'?26:24,vx:dir*sp,sp:sp,vy:0,alive:true,act:false,st:'walk'})})}
  /* v67 : le monde atteint est sauvegardé (Aventure et 2 joueurs ; pas en Expert) : on reprend là au lieu de tout refaire */
  function svW(mode,v){if(mode==='hard')return 0;var k='saut-w-'+(mode||'run');if(v===undefined)return Math.max(0,Math.min(NW-1,PP.store(k)|0));PP.store(k,v)}
  var SC=null;document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-saut-r1]');if(!b||!SC)return;e.preventDefault();e.stopPropagation();svW(SC.mode,0);var st=document.getElementById('saut-start');if(st)st.click()},true);
  function fresh(C){SC=C;var duo=C.mode==='duo';S={mode:C.mode||'run',duo:duo,lives:C.mode==='hard'?1:duo?8:5,score:0,gems:0,time:0,over:false,tt:0,ps:duo?[null,null]:[null]};load(0)}
  function alive(){return S.ps.filter(function(p){return !p.dead})}

  /* ---------- effets ---------- */
  function burst(x,y,col,n,sp){for(var i=0;i<(n||8);i++)S.fx.push({x:x,y:y,vx:(Math.random()-.5)*(sp||320),vy:-Math.random()*(sp||300),t:.6,col:col,s:4+Math.random()*4})}
  function txt(x,y,s,col){S.txt.push({x:x,y:y,s:s,t:1,col:col||CR})}
  function addScore(n,x,y){S.score+=n;if(x!=null)txt(x,y,'+'+n)}

  /* ---------- joueurs ---------- */
  var J1=['KeyW','Space'],J2=['ArrowUp'],F1=['KeyF','ShiftLeft'],F2=['Enter','ShiftRight','ControlRight','Numpad0','KeyL'];
  var JS=['Space','ArrowUp','KeyW'],FS=['KeyF','KeyX','ShiftLeft','ShiftRight','Enter','KeyK'];
  function any(k,arr){for(var i=0;i<arr.length;i++)if(k[arr[i]])return true;return false}
  function ctl(C,p){var k=C.keys;if(!S.duo)return {dir:((k.ArrowRight||k.KeyD)?1:0)-((k.ArrowLeft||k.KeyA)?1:0),hold:any(k,JS)};
    if(p.i===0)return {dir:(k.KeyD?1:0)-(k.KeyA?1:0),hold:any(k,J1)};return {dir:(k.ArrowRight?1:0)-(k.ArrowLeft?1:0),hold:any(k,J2)}}
  function setPw(p,n){var was=p.pw;p.pw=n;var nh=n?50:34;if(nh!==p.h){p.y+=p.h-nh;p.h=nh}if(n>was){p.inv=Math.max(p.inv,.6);sfx.play('pickup')}}
  function shoot(p){if(p.pw<2||p.dead||p.fcd>0)return;var n=S.fb.filter(function(f){return f.o===p.i}).length;if(n>=2)return;p.fcd=.22;
    S.fb.push({x:p.x+p.w/2+p.face*12-7,y:p.y+14,w:14,h:14,vx:p.face*470,vy:80,t:2.2,o:p.i});sfx.play('ui')}
  function hurt(C,p){if(p.inv>0||p.star>0||p.dead||S.over)return;
    if(p.pw>0){setPw(p,p.pw-1);p.inv=1.6;sfx.play('lose');C.shake(5);return}
    die(C,p)}
  function die(C,p){if(p.dead||S.over)return;S.lives--;sfx.play('lose');C.shake(9);burst(p.x+p.w/2,p.y+p.h/2,RED,14);
    if(S.lives<=0){p.dead=1;finish(C,false);return}
    p.dead=1.1;p.vx=p.vy=0}
  function respawn(p){var mate=S.duo?S.ps[1-p.i]:null;p.dead=0;setPw(p,0);p.vx=p.vy=0;p.inv=2;p.star=0;
    if(mate&&!mate.dead){p.x=mate.x;p.y=mate.y-60;return}
    if(S.arena&&!S.bossDone){/* tout le monde est tombé dans l'arène : on rouvre et le boss repart à zéro */openGate();S.boss=null;S.arena=false;S.bp=[]}
    var cx=S.cp.tx>=0?S.cp.tx*T+8:2*T;p.x=cx;p.y=-10;for(var ty=0;ty<RH;ty++)if(solid(tile(Math.floor((cx+12)/T),ty))){p.y=ty*T-p.h-1;break}
    if(!S.duo||!mate||mate.dead)S.cam=Math.max(0,Math.min(S.L.w*T-W,p.x-W*.3))}
  function finish(C,won){if(S.over)return;S.over=true;if(won)svW(S.mode,0);C.stop();var key=S.mode==='hard'?'hard':S.mode==='duo'?'duo':'pts',nb=C.best(key,S.score);if(won){sfx.play('win');C.win()}
    setTimeout(function(){C.over(won?'Bravo, les 4 mondes !':'Perdu au monde '+(S.lv+1),'<b>'+S.score+'</b> points · '+S.gems+' cristaux · '+Math.round(S.time)+' s'+(nb&&S.score?'<br><b>Nouveau record !</b>':'<br>Record : '+(C.best(key)||0)),'Rejouer')},won?900:600)}

  /* bloc frappé par en dessous */
  function headHit(C,p,tx,ty){var c=tile(tx,ty),key=tx+','+ty;
    if(c==='?'){S.L.g[ty][tx]='U';S.bump[key]=.18;var it=S.L.items[key]||'o';sfx.play('tick');
      if(it==='o'){S.gems++;addScore(10,tx*T+20,ty*T-10);S.fx.push({k:'gem',x:tx*T+20,y:ty*T-6,vy:-520,t:.45})}
      else S.items.push({t:it==='star'?'star':(p.pw===0?'cap':'flame'),x:tx*T+6,y:ty*T,w:28,h:28,vx:0,vy:0,rise:.45,y0:ty*T})}
    else if(c==='B'){if(p.pw>0){S.L.g[ty][tx]=' ';addScore(5);sfx.play('hit');for(var i=0;i<4;i++)S.fx.push({x:tx*T+10+(i%2)*20,y:ty*T+10+(i>1?20:0),vx:(i%2?1:-1)*(120+Math.random()*80),vy:-380-(i>1?0:140),t:1,col:'#b5573a',s:12})}else{S.bump[key]=.18;sfx.play('tick')}}
    else return;
    /* un ennemi posé sur le bloc est éjecté */
    S.en.forEach(function(e){if(!e.alive||e.dying)return;if(Math.abs(e.y+e.h-ty*T)<8&&e.x+e.w>tx*T&&e.x<tx*T+T)kill(e,'flip',p)})}
  function kill(e,how,p){if(!e.alive||e.dying)return;e.dying=how==='squash'?.4:1.2;e.how=how;if(how==='flip'){e.vy=-420;e.vx=(p&&p.x<e.x?1:-1)*80}addScore(how==='squash'?50:100,e.x+e.w/2,e.y);burst(e.x+e.w/2,e.y+e.h/2,e.k==='b'?'#b48cff':e.k==='k'?'#c9a26a':'#6fd66a',8)}

  /* ---------- boss ---------- */
  function openGate(){var A=S.L.arena;for(var ty=0;ty<RH;ty++)if(S.L.g[ty][A+3]==='X')S.L.g[ty][A+3]=' '}
  function closeGate(){var A=S.L.arena;for(var ty=0;ty<S.L.atop;ty++)S.L.g[ty][A+3]='X'}
  function mkBoss(lv){var A=S.L.arena,top=S.L.atop,d=[{w:84,h:66,hp:3},{w:100,h:52,hp:3},{w:78,h:96,hp:4},{w:92,h:58,hp:5}][lv];
    var b={lv:lv,x:(A+17)*T,y:top*T-d.h,w:d.w,h:d.h,hp:d.hp,max:d.hp,vx:0,vy:0,g:false,inv:0,t:1.2,st:'idle',face:-1,dead:0,n:TH[lv].boss,ph:0};
    if(lv===3){b.y=top*T-300;b.st='fly';b.t=2.5}return b}
  function nearest(x){var best=null,d=1e9;alive().forEach(function(p){var dd=Math.abs(p.x-x);if(dd<d){d=dd;best=p}});return best}
  function stepBoss(C,b,dt){var top=S.L.atop,A=S.L.arena,L0=(A+4)*T,R0=(S.L.w-1)*T,tg=nearest(b.x+b.w/2);b.inv=Math.max(0,b.inv-dt);b.t-=dt;b.ph+=dt;
    if(b.dead){b.dead-=dt;b.vy+=1400*dt;b.y+=b.vy*dt;if(b.dead<=0){S.boss=null;S.bossDone=true;openGate();S.L.g[top-1][S.L.w-3]='F';C.pop('LE PORTAIL EST OUVERT',YEL,'34px')}return}
    var dir=tg?(tg.x+tg.w/2<b.x+b.w/2?-1:1):b.face,rage=b.hp<=Math.ceil(b.max/2);
    if(b.lv===0){/* gros gluant : il saute vers toi, et fait trembler le sol */
      if(b.g&&b.t<=0){b.vy=-(760+Math.random()*160);b.vx=dir*(rage?260:190);b.face=dir;b.t=rage?.8:1.3;b.g=false}
      var wasAir=!b.g;phys(b,dt,1900);if(b.g){b.vx=0;if(wasAir){C.shake(6);burst(b.x+b.w/2,b.y+b.h,'#6fd66a',10);if(rage)S.bp.push({x:b.x+b.w/2-8,y:b.y+b.h-20,w:16,h:16,vx:-220,vy:-300,g:1500,t:3,k:'goo'},{x:b.x+b.w/2-8,y:b.y+b.h-20,w:16,h:16,vx:220,vy:-300,g:1500,t:3,k:'goo'})}}}
    else if(b.lv===1){/* scorpion : il se prépare, fonce, et reste sonné s'il tape le mur */
      if(b.st==='idle'){b.vx=dir*70;b.face=dir;if(b.t<=0){b.st='prep';b.t=.6}}
      else if(b.st==='prep'){b.vx=0;if(b.t<=0){b.st='run';b.vx=b.face*(rage?600:500)}}
      else if(b.st==='run'){/* garde sa vitesse */}
      else if(b.st==='stun'){b.vx=0;if(b.t<=0){b.st='idle';b.t=1.2}}
      var r=phys(b,dt,1900);if(b.st==='run'&&r.wall){b.st='stun';b.t=1.4;C.shake(8);sfx.play('hit');burst(b.x+(r.wall>0?b.w:0),b.y+b.h/2,'#d9a441',12)}
      if(b.st!=='run'&&b.t<=-3)b.t=0}
    else if(b.lv===2){/* golem : il avance lentement et lance des blocs de glace */
      b.vx=dir*(rage?75:50);b.face=dir;phys(b,dt,1900);
      if(b.t<=0&&tg){b.t=rage?1.4:2.1;var dx=(tg.x+tg.w/2)-(b.x+b.w/2),fl=.9;S.bp.push({x:b.x+b.w/2-14,y:b.y+6,w:28,h:28,vx:dx/fl,vy:-0.5*1300*fl,g:1300,t:3,k:'ice'});sfx.play('ui')}}
    else{/* roi corbeau : il plane, lâche des plumes, pique sur toi puis reste au sol un instant */
      if(b.st==='fly'){var cx=(L0+R0)/2,amp=(R0-L0)/2-b.w;b.x+=((cx+Math.sin(b.ph*.7)*amp-b.w/2)-b.x)*Math.min(1,dt*2);b.y+=((top*T-300+Math.sin(b.ph*2)*30)-b.y)*Math.min(1,dt*3);b.face=dir;
        if(Math.floor(b.ph/1.3)!==Math.floor((b.ph-dt)/1.3))S.bp.push({x:b.x+b.w/2-6,y:b.y+b.h,w:12,h:22,vx:dir*60,vy:220,g:300,t:4,k:'feather'});
        if(b.t<=0&&tg){b.st='dive';b.tx=tg.x+tg.w/2-b.w/2;b.t=1.5}}
      else if(b.st==='dive'){var dx2=b.tx-b.x;b.x+=Math.sign(dx2)*Math.min(Math.abs(dx2),520*dt);b.y+=700*dt;if(b.y+b.h>=top*T){b.y=top*T-b.h;b.st='stun';b.t=rage?1.1:1.6;C.shake(7);burst(b.x+b.w/2,b.y+b.h,'#9d8ff0',12)}}
      else if(b.st==='stun'){if(b.t<=0){b.st='fly';b.t=rage?2:2.8}}}
    b.x=Math.max(L0,Math.min(R0-b.w,b.x))}
  function bossStompable(b){if(b.lv===1)return b.st!=='run';if(b.lv===3)return b.st==='stun';return true}
  function hitBoss(C,b,dmg){if(b.inv>0||b.dead)return;b.hp-=dmg;b.inv=dmg>=1?1:.25;sfx.play('hit');C.shake(dmg>=1?7:2);burst(b.x+b.w/2,b.y+b.h/3,YEL,dmg>=1?14:4);
    if(b.lv===1&&dmg>=1){b.st='idle';b.t=1}if(b.lv===3&&dmg>=1){b.st='fly';b.t=2.4}
    if(b.hp<=0){b.dead=1.6;b.vy=-500;addScore(1000,b.x+b.w/2,b.y);C.pop(b.n.toUpperCase()+' VAINCU !',YEL,'40px');sfx.play('win');S.bp=[]}}

  PP._saut=function(){return S};
  PP.arcade({id:'saut',
    setup:function(C){fresh(C);
      C.keysText(S.duo?'Joueur 1 : <kbd>Q</kbd><kbd>D</kbd> courir · <kbd>Z</kbd> ou <kbd>Espace</kbd> sauter · <kbd>F</kbd> boule de feu &nbsp;—&nbsp; Joueur 2 : <kbd>←</kbd><kbd>→</kbd> courir · <kbd>↑</kbd> sauter · <kbd>Entrée</kbd> boule de feu'
        :'<kbd>←</kbd><kbd>→</kbd> ou <kbd>Q</kbd><kbd>D</kbd> courir · <kbd>Espace</kbd>, <kbd>↑</kbd> ou <kbd>Z</kbd> sauter (reste appuyé pour sauter plus haut) · <kbd>F</kbd> ou <kbd>Maj</kbd> boule de feu · frappe les blocs par en dessous');
      C.over('Saute-Pixel',(S.mode==='hard'?'Mode Expert : une seule vie pour les 4 mondes.':S.duo?'À deux sur le même clavier, 8 vies en commun. Si l\'un tombe, il revient à côté de l\'autre.':'4 mondes à traverser, 5 vies.')+
        '<br>Écrase les ennemis en leur sautant dessus, frappe les blocs ✦ par en dessous pour trouver des cristaux et des bonus : la Gélule te fait grandir (tu casses les briques), la Flamme lance des boules de feu, le Prisme te rend invincible. Un boss t\'attend au bout de chaque monde.'+(svW(C.mode)>0?'<br><b>Partie sauvegardée : tu reprends au monde '+(svW(C.mode)+1)+'.</b><br><button type="button" class="ghost" data-saut-r1>Repartir du monde 1</button>':''),svW(C.mode)>0?'Continuer':'Jouer')},
    start:function(C){fresh(C);var w=svW(C.mode);if(w>0)load(w)},
    key:function(C,k,d){if(!C.running||S.over||!d)return;
      if(!S.duo){if(JS.indexOf(k)>=0)S.ps[0].jb=.13;if(FS.indexOf(k)>=0)shoot(S.ps[0]);return}
      if(J1.indexOf(k)>=0)S.ps[0].jb=.13;if(J2.indexOf(k)>=0)S.ps[1].jb=.13;if(F1.indexOf(k)>=0)shoot(S.ps[0]);if(F2.indexOf(k)>=0)shoot(S.ps[1])},
    step:function(C,dt){if(S.over)return;var L=S.L,th=TH[S.lv],i;S.time+=dt;S.lt+=dt;S.tt+=dt;S.banner=Math.max(0,S.banner-dt);
      for(var bk in S.bump){S.bump[bk]-=dt;if(S.bump[bk]<=0)delete S.bump[bk]}
      /* plateformes mobiles */
      S.mp.forEach(function(m){m.ph+=dt*m.sp;var nx=m.x0+Math.sin(m.ph)*m.ax,ny=m.y0+Math.sin(m.ph)*m.ay;m.dx=nx-m.x;m.dy=ny-m.y;m.x=nx;m.y=ny});
      /* joueurs */
      S.ps.forEach(function(p){
        if(p.dead){p.dead-=dt;if(p.dead<=0&&!S.over)respawn(p);return}
        var c=ctl(C,p);p.inv=Math.max(0,p.inv-dt);p.star=Math.max(0,p.star-dt);p.fcd=Math.max(0,p.fcd-dt);p.sq=Math.max(0,p.sq-dt*4);
        if(p.on){p.x+=p.on.dx;p.y+=p.on.dy}
        var fr=p.g?th.fric:1,mx=p.star>0?340:300;
        if(c.dir){p.vx+=c.dir*(p.g?2600*Math.max(.35,fr):1700)*dt;p.face=c.dir}else{var de=(p.g?2400*fr:500)*dt;p.vx=Math.abs(p.vx)<=de?0:p.vx-Math.sign(p.vx)*de}
        p.vx=Math.max(-mx,Math.min(mx,p.vx));
        p.coy=(p.g||p.on)?.1:Math.max(0,p.coy-dt);p.jb=Math.max(0,p.jb-dt);
        if(p.jb>0&&p.coy>0){p.vy=p.pw?-800:-780;p.jb=0;p.coy=0;p.g=false;p.on=null;sfx.play('ui');p.sq=-.6}
        if(!c.hold&&p.vy<-280&&!p.spr)p.vy=-280;if(p.vy>=0)p.spr=false;
        var wasG=p.g,py0=p.y,r=phys(p,dt,2300);
        if(r.ceil){var htx=Math.floor((p.x+p.w/2)/T);headHit(C,p,solid(tile(htx,r.ceil.ty))?htx:r.ceil.tx,r.ceil.ty)}
        /* plateformes mobiles : on se pose dessus par-dessus */
        p.on=null;if(p.vy>=0)S.mp.forEach(function(m){if(p.x+p.w>m.x+2&&p.x<m.x+m.w-2&&py0+p.h<=m.y-m.dy+4&&p.y+p.h>=m.y){p.y=m.y-p.h;p.vy=0;p.g=true;p.on=m}});
        if(p.g&&!wasG){p.sq=.8;if(Math.abs(p.vx)>60||py0<p.y-4)for(i=0;i<3;i++)S.fx.push({x:p.x+p.w/2,y:p.y+p.h,vx:(i-1)*90,vy:-40,t:.3,col:'rgba(255,255,255,.7)',s:5})}
        if(p.g&&Math.abs(p.vx)>20){p.an+=Math.abs(p.vx)*dt*.05;if(Math.abs(p.vx)>200&&Math.random()<dt*14)S.fx.push({x:p.x+p.w/2-p.face*10,y:p.y+p.h-2,vx:-p.face*40,vy:-30,t:.3,col:'rgba(255,255,255,.55)',s:4})}
        /* bords de l'écran : on ne revient pas en arrière (comme dans les vrais jeux de plateformes) */
        if(p.x<S.cam){p.x=S.cam;if(p.vx<0)p.vx=0}
        if(S.duo&&p.x>S.cam+W-p.w){p.x=S.cam+W-p.w;if(p.vx>0)p.vx=0}
        /* cases spéciales */
        var tx0=Math.floor((p.x+3)/T),tx1=Math.floor((p.x+p.w-3)/T),ty0=Math.floor((p.y+3)/T),ty1=Math.floor((p.y+p.h-1)/T);
        for(var ty=ty0;ty<=ty1;ty++)for(var tx=tx0;tx<=tx1;tx++){var ch=tile(tx,ty);
          if(ch==='o'){L.g[ty][tx]=' ';S.gems++;S.score+=10;sfx.play('pickup');burst(tx*T+20,ty*T+20,'#6fe3ff',5,200);if(S.gems%100===0){S.lives++;C.pop('+1 VIE',YEL,'34px')}}
          else if(ch==='^'){if(p.y+p.h>ty*T+14)hurt(C,p)}
          else if(ch==='S'){if(p.vy>=0&&p.y+p.h>ty*T+16){p.vy=-1180;p.spr=true;p.g=false;sfx.play('go');S.sprT=.25;S.sprX=tx}}
          else if(ch==='c'){if(S.cp.tx!==tx){S.cp={tx:tx};sfx.play('tick');C.pop('POINT DE RETOUR',YEL,'26px')}}
          else if(ch==='F'){var bonus=Math.max(0,Math.round((150-S.lt)*5));S.score+=300+bonus;sfx.play('win');burst(p.x,p.y,YEL,24);
            if(S.lv>=NW-1){finish(C,true);return}C.pop('MONDE '+(S.lv+2),YEL,'54px');load(S.lv+1,true);svW(S.mode,S.lv);return}}
        if(p.y>RH*T+60)die(C,p)});
      if(S.over||S.L!==L)return;
      /* arène : la porte se ferme derrière toi et le boss arrive */
      var A=L.arena;if(!S.arena&&!S.bossDone&&alive().some(function(p){return p.x>(A+6)*T})){S.arena=true;closeGate();S.boss=mkBoss(S.lv);sfx.play('go');C.pop(S.boss.n.toUpperCase(),RED,'46px');
        S.ps.forEach(function(p){if(!p.dead&&p.x<(A+4)*T){p.x=(A+5)*T;p.y=(L.atop-2)*T}})}
      if(S.boss)stepBoss(C,S.boss,dt);
      var B=S.boss;
      /* bonus qui sortent des blocs */
      S.items=S.items.filter(function(it){
        if(it.rise>0){it.rise-=dt;it.y=it.y0-(1-it.rise/.45)*T;if(it.rise<=0){it.y=it.y0-T;it.vx=it.t==='flame'?0:it.t==='star'?140:120}return true}
        var r=phys(it,dt,it.t==='flame'?0:1800);if(r.wall)it.vx=-it.vx;if(it.t==='star'&&it.g)it.vy=-560;if(it.y>RH*T+60)return false;
        for(var q=0;q<S.ps.length;q++){var p=S.ps[q];if(p.dead||!over(p,it))continue;
          if(it.t==='star'){p.star=9;sfx.play('go');C.pop('INVINCIBLE !',YEL,'34px')}else if(it.t==='cap'){setPw(p,Math.max(1,p.pw));C.pop('GRAND !',YEL,'30px')}else{setPw(p,2);C.pop('FLAMME !',RED,'30px')}
          addScore(200,it.x+14,it.y);return false}
        return true});
      /* boules de feu */
      S.fb=S.fb.filter(function(f){f.t-=dt;var r=phys(f,dt,1700);if(f.g)f.vy=-380;if(r.wall||r.ceil||f.t<=0||f.y>RH*T){burst(f.x+7,f.y+7,'#ff9a3a',5,160);return false}
        for(var q=0;q<S.en.length;q++){var e=S.en[q];if(e.alive&&!e.dying&&e.act&&over(f,e)){kill(e,'flip');burst(f.x+7,f.y+7,'#ff9a3a',6);return false}}
        if(B&&!B.dead&&over(f,B)){hitBoss(C,B,1/3);return false}
        return f.x>S.cam-60&&f.x<S.cam+W+60});
      /* ennemis */
      S.en.forEach(function(e){if(!e.alive)return;if(!e.act){if(e.x<S.cam+W+60)e.act=true;else return}
        if(e.dying){e.dying-=dt;if(e.how==='flip'){e.vy+=1800*dt;e.y+=e.vy*dt;e.x+=e.vx*dt}if(e.dying<=0)e.alive=false;return}
        if(e.k==='b'){e.ph+=dt;e.x=e.x0+Math.sin(e.ph*1.3)*90;e.y=e.y0+Math.sin(e.ph*3.1)*14}
        else if(e.k==='j'){if(e.y>=RH*T+40&&e.vy>=0){e.y=RH*T+40;e.vy=0;e.t-=dt;if(e.t<=0){e.vy=-(880+(e.x%3)*30);e.t=1.6}}else{e.vy+=1500*dt;e.y+=e.vy*dt}}
        else{var r=phys(e,dt,2300);if(r.wall){if(e.st==='slide'){e.vx=-e.vx;sfx.play('tick')}else e.vx=-e.vx}
          if(e.g&&e.st==='walk'){var ax=e.vx>0?e.x+e.w+2:e.x-2,bt=tile(Math.floor(ax/T),Math.floor((e.y+e.h+4)/T));if(!solid(bt)&&bt!=='=')e.vx=-e.vx}
          if(e.y>RH*T+100)e.alive=false;
          if(e.st==='slide'){e.kick=Math.max(0,(e.kick||0)-dt);S.en.forEach(function(o){if(o!==e&&o.alive&&!o.dying&&o.act&&over(e,o))kill(o,'flip')});if(e.x<S.cam-300||e.x>S.cam+W+300)e.alive=false}}
        /* contact avec les joueurs */
        S.ps.forEach(function(p){if(p.dead||!e.alive||e.dying||!over(p,e))return;
          if(p.star>0){kill(e,'flip',p);return}
          var fromTop=p.vy>60&&p.y+p.h-p.vy*dt<=e.y+12,c=ctl(C,p);
          if(e.k==='t'){
            if(fromTop){p.vy=c.hold?-680:-460;p.spr=true;sfx.play('hit');if(e.st==='walk'){e.st='shell';e.vx=0;e.h=20;e.y+=6;addScore(50,e.x+15,e.y)}else if(e.st==='shell'){e.st='slide';e.vx=(p.x+p.w/2<e.x+e.w/2?1:-1)*560;e.kick=.25}else{e.st='shell';e.vx=0}return}
            if(e.st==='shell'){e.st='slide';e.vx=(p.x+p.w/2<e.x+e.w/2?1:-1)*560;e.kick=.25;sfx.play('hit');return}
            if(e.st==='slide'&&e.kick>0)return;hurt(C,p);return}
          if(fromTop&&(e.k==='s'||e.k==='b')){kill(e,e.k==='s'?'squash':'flip',p);p.vy=c.hold?-680:-460;p.spr=true;sfx.play('hit');return}
          hurt(C,p)})});
      /* boss : contact et projectiles */
      if(B&&!B.dead){S.ps.forEach(function(p){if(p.dead||!over(p,B))return;var c=ctl(C,p),fromTop=p.vy>60&&p.y+p.h-p.vy*dt<=B.y+18;
        if(fromTop&&bossStompable(B)){p.vy=c.hold?-760:-560;p.spr=true;hitBoss(C,B,1);return}
        if(p.star>0){hitBoss(C,B,1);p.vx=(p.x<B.x?-1:1)*300;return}
        hurt(C,p);p.vx=(p.x+p.w/2<B.x+B.w/2?-1:1)*320;p.vy=-300})}
      S.bp=S.bp.filter(function(o){o.t-=dt;o.vy+=(o.g||0)*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;
        if(hitBox(o.x,o.y,o.w,o.h)||o.t<=0){burst(o.x+o.w/2,o.y+o.h/2,o.k==='ice'?'#d9ebf6':o.k==='goo'?'#6fd66a':'#9d8ff0',6,200);return false}
        for(var q=0;q<S.ps.length;q++){var p=S.ps[q];if(!p.dead&&over(p,o)){hurt(C,p);return false}}return true});
      /* effets */
      S.fx=S.fx.filter(function(f){f.t-=dt;if(f.k==='gem'){f.vy+=1600*dt;f.y+=f.vy*dt;return f.t>0}f.vy+=900*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;return f.t>0});
      S.txt=S.txt.filter(function(t){t.t-=dt;t.y-=50*dt;return t.t>0});S.sprT=Math.max(0,(S.sprT||0)-dt);
      /* caméra : elle avance avec le joueur de tête, sans laisser l'autre sortir par la gauche */
      var al=alive();if(al.length){var lead=-1e9,lag=1e9;al.forEach(function(p){lead=Math.max(lead,p.x+p.w/2);lag=Math.min(lag,p.x)});
        var want=lead-W*.42;if(S.duo&&al.length>1)want=Math.min(want,lag-30);if(S.arena)want=L.arena*T+T*2;want=Math.max(S.cam,Math.min(L.w*T-W,want));S.cam+=(want-S.cam)*Math.min(1,dt*6)}
      var pp=S.ps[0];C.hud('<span>Monde <b>'+(S.lv+1)+' / '+NW+'</b></span><span>Vies <b>'+S.lives+'</b></span><span>Cristaux <b>'+S.gems+'</b></span><span>Points <b>'+S.score+'</b></span>'+(pp&&pp.pw===2?'<span>Flamme <b>F</b></span>':''))},

    draw:function(C){var g=C.g;if(!S)fresh(C);var th=TH[S.lv],L=S.L,cam=Math.round(S.cam),i,tt=S.tt;
      /* ciel et décor lointain */
      var sk=g.createLinearGradient(0,0,0,H);sk.addColorStop(0,th.sky[0]);sk.addColorStop(1,th.sky[1]);g.fillStyle=sk;g.fillRect(0,0,W,H);
      if(S.lv===3){g.fillStyle='rgba(255,255,255,.75)';for(i=0;i<60;i++){var tw=.5+.5*Math.sin(tt*2+i);g.globalAlpha=.4+.6*tw;g.fillRect((i*197+31-cam*.03)%W+(i*197+31-cam*.03<0?W:0),(i*89+17)%300,2,2)}g.globalAlpha=1;
        g.fillStyle='#f1ece2';g.beginPath();g.arc(790,92,36,0,7);g.fill();g.fillStyle=th.sky[0];g.beginPath();g.arc(804,84,30,0,7);g.fill()}
      else{g.fillStyle=S.lv===1?'#fff1c9':'#fffbe0';g.beginPath();g.arc(800,90,40,0,7);g.fill();g.globalAlpha=.25;g.beginPath();g.arc(800,90,58,0,7);g.fill();g.globalAlpha=1}
      /* montagnes lointaines (forme différente par monde) */
      g.fillStyle=th.far;g.beginPath();g.moveTo(0,H);for(var x=0;x<=W+40;x+=40){var wx=x+cam*.1,hh;
        if(S.lv===1)hh=300-(Math.floor(wx/180)%3===0?110:Math.floor(wx/180)%3===1?60:20);
        else if(S.lv===3)hh=320-((Math.floor(wx/60)%5===0)?150:(Math.floor(wx/60)%5===1?90:40));
        else hh=280+Math.sin(wx*.006)*50+Math.abs(Math.sin(wx*.017))*-60;
        g.lineTo(x-((wx%40)),hh)}g.lineTo(W,H);g.fill();
      /* nuages */
      if(S.lv!==3){g.fillStyle='rgba(255,255,255,.85)';for(i=0;i<6;i++){var cx=((i*331+80)-cam*.2-tt*8)%(W+300);if(cx<-150)cx+=W+300;var cy=60+(i*53)%120;
        g.beginPath();g.arc(cx,cy,22,0,7);g.arc(cx+26,cy-10,28,0,7);g.arc(cx+56,cy,22,0,7);g.rect(cx,cy,56,22);g.fill()}}
      [[.3,th.hill2,350,50,.006],[.5,th.hill,410,40,.011]].forEach(function(h){g.fillStyle=h[1];g.beginPath();g.moveTo(0,H);for(var x=0;x<=W;x+=16){var wx=x+cam*h[0];g.lineTo(x,h[2]+Math.sin(wx*h[4])*h[3]+Math.sin(wx*h[4]*2.7)*h[3]*.3)}g.lineTo(W,H);g.fill()});
      g.save();g.translate(-cam,OY);
      var c0=Math.max(0,Math.floor(cam/T)-1),c1=Math.min(L.w-1,c0+26),tx,ty;
      /* liquide au fond des fosses */
      g.fillStyle=th.pit;for(tx=c0;tx<=c1;tx++)if(!solid(L.g[RH-1][tx])){var wv=Math.sin(tt*3+tx)*4;g.fillRect(tx*T,RH*T-22+wv,T+1,30)}
      if(th.lava){g.fillStyle='rgba(255,220,80,.8)';for(tx=c0;tx<=c1;tx++)if(!solid(L.g[RH-1][tx]))g.fillRect(tx*T+((tt*30+tx*13)%30),RH*T-20+Math.sin(tt*3+tx)*4,8,3)}
      /* décor posé sur le sol (buissons, arbres, cactus, sapins, torches) */
      for(tx=c0;tx<=c1;tx++){var top=-1;for(ty=1;ty<RH;ty++)if(L.g[ty][tx]==='#'&&!solid(L.g[ty-1][tx])){top=ty;break}if(top<0||L.g[top-1][tx]!==' ')continue;
        var h=hsh(tx+S.lv*1000),bx=tx*T+20,by=top*T;
        if(h%9===0){if(S.lv===1){g.fillStyle='#4f8a3a';g.fillRect(bx-5,by-46,10,46);g.fillRect(bx-17,by-30,8,6);g.fillRect(bx-17,by-40,6,14);g.fillRect(bx+9,by-24,8,6);g.fillRect(bx+11,by-34,6,14);g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(bx-5,by-46,10,46)}
          else if(S.lv===2){g.fillStyle='#3d6b5a';for(var q=0;q<3;q++){g.beginPath();g.moveTo(bx,by-70+q*16);g.lineTo(bx-22+q*2,by-34+q*12);g.lineTo(bx+22-q*2,by-34+q*12);g.fill()}g.fillStyle='#fff';g.beginPath();g.moveTo(bx,by-70);g.lineTo(bx-8,by-56);g.lineTo(bx+8,by-56);g.fill();g.fillStyle='#6a4a2a';g.fillRect(bx-4,by-14,8,14)}
          else if(S.lv===3){g.fillStyle='#4a4560';g.fillRect(bx-3,by-40,6,40);var fl=Math.sin(tt*12+tx)*3;g.fillStyle='#ff9a3a';g.beginPath();g.moveTo(bx-7,by-40);g.lineTo(bx,by-58-fl);g.lineTo(bx+7,by-40);g.fill();g.fillStyle=YEL;g.beginPath();g.moveTo(bx-3,by-40);g.lineTo(bx,by-50-fl);g.lineTo(bx+3,by-40);g.fill()}
          else{g.fillStyle='#6a4a2a';g.fillRect(bx-5,by-40,10,40);g.fillStyle='#3f9a3a';g.beginPath();g.arc(bx,by-52,24,0,7);g.arc(bx-16,by-40,16,0,7);g.arc(bx+16,by-40,16,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.arc(bx,by-52,24,Math.PI*.9,Math.PI*2.1);g.stroke()}}
        else if(h%5===0&&S.lv!==3){g.fillStyle=S.lv===2?'#e6f2f9':S.lv===1?'#b88a4a':'#58b44a';g.beginPath();g.arc(bx-10,by-8,11,0,7);g.arc(bx+2,by-13,14,0,7);g.arc(bx+14,by-7,10,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.arc(bx+2,by-13,14,Math.PI*1.05,Math.PI*1.95);g.stroke()}
        else if(h%7===0&&S.lv===0){g.fillStyle='#fff';g.beginPath();g.arc(bx,by-12,4,0,7);g.fill();g.fillStyle=YEL;g.beginPath();g.arc(bx,by-12,2,0,7);g.fill();g.fillStyle='#3f8a3a';g.fillRect(bx-1,by-8,2,8)}}
      /* tuiles */
      for(ty=0;ty<RH;ty++)for(tx=c0;tx<=c1;tx++){var ch=L.g[ty][tx],x=tx*T,y=ty*T;if(ch===' ')continue;var bo=S.bump[tx+','+ty]?-Math.sin((1-S.bump[tx+','+ty]/.18)*Math.PI)*8:0;
        if(ch==='#'){var up=!solid(tile(tx,ty-1));
          if(S.lv===3&&!up){g.fillStyle=th.dirt;g.fillRect(x,y,T,T);g.strokeStyle=th.dirt2;g.lineWidth=2;g.strokeRect(x+1,y+1,T/2-2,T/2-2);g.strokeRect(x+T/2+1,y+1,T/2-2,T/2-2);g.strokeRect(x+1+(ty%2?10:0),y+T/2+1,T/2-2,T/2-2)}
          else{g.fillStyle=th.dirt;g.fillRect(x,y,T,T);g.fillStyle=th.dirt2;g.fillRect(x+6+(tx%3)*4,y+22,8,6);g.fillRect(x+24-(ty%2)*6,y+10,7,5)}
          if(up){g.fillStyle=th.top;g.fillRect(x,y,T,12);g.fillStyle=th.top2;g.fillRect(x,y,T,4);g.fillStyle=th.top;for(i=0;i<4;i++){g.beginPath();g.arc(x+5+i*10,y+12,5,0,Math.PI);g.fill()}g.fillStyle=INK;g.fillRect(x,y,T,2)}
          if(!solid(tile(tx-1,ty))){g.fillStyle=INK;g.fillRect(x,y,2,T)}if(!solid(tile(tx+1,ty))){g.fillStyle=INK;g.fillRect(x+T-2,y,2,T)}}
        else if(ch==='B'){y+=bo;g.fillStyle='#b5573a';g.fillRect(x,y,T,T);g.fillStyle='#7a3522';g.fillRect(x,y+12,T,3);g.fillRect(x,y+26,T,3);g.fillRect(x+18,y,3,12);g.fillRect(x+8,y+15,3,11);g.fillRect(x+28,y+15,3,11);g.fillRect(x+18,y+29,3,11);g.fillStyle='rgba(255,255,255,.2)';g.fillRect(x,y,T,3);g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(x+1,y+1,T-2,T-2)}
        else if(ch==='?'){y+=bo;g.fillStyle=CR;g.fillRect(x,y,T,T);g.strokeStyle=INK;g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,T-3,T-3);var gl=1+Math.sin(tt*4+tx)*.12;g.fillStyle=RED;g.beginPath();for(i=0;i<8;i++){var ang=i*Math.PI/4-Math.PI/2,rr=(i%2?5:12)*gl;g.lineTo(x+20+Math.cos(ang)*rr,y+20+Math.sin(ang)*rr)}g.fill();g.fillStyle=INK;g.fillRect(x+5,y+5,3,3);g.fillRect(x+T-8,y+5,3,3);g.fillRect(x+5,y+T-8,3,3);g.fillRect(x+T-8,y+T-8,3,3)}
        else if(ch==='U'){y+=bo;g.fillStyle='#a8957a';g.fillRect(x,y,T,T);g.strokeStyle=INK;g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,T-3,T-3);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+5,y+5,3,3);g.fillRect(x+T-8,y+5,3,3);g.fillRect(x+5,y+T-8,3,3);g.fillRect(x+T-8,y+T-8,3,3)}
        else if(ch==='X'){g.fillStyle='#6a6478';g.fillRect(x,y,T,T);g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(x+1,y+1,T-2,T/2-1);g.strokeRect(x+1,y+T/2,T-2,T/2-1);g.fillStyle=RED;g.fillRect(x+T/2-2,y+8,4,4)}
        else if(ch==='='){g.fillStyle='#c9a26a';g.fillRect(x,y,T,12);g.fillStyle='#8a6a3a';g.fillRect(x,y+9,T,3);g.fillRect(x+19,y,2,12);g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(x,y,T,12)}
        else if(ch==='^'){for(i=0;i<2;i++){g.fillStyle='#d9d4c8';g.beginPath();g.moveTo(x+i*20,y+T);g.lineTo(x+i*20+10,y+12);g.lineTo(x+i*20+20,y+T);g.closePath();g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.moveTo(x+i*20+10,y+12);g.lineTo(x+i*20+20,y+T);g.lineTo(x+i*20+10,y+T);g.fill()}}
        else if(ch==='o'){var bb=Math.sin(tt*4+tx)*3,sx=Math.abs(Math.cos(tt*3+tx))*.6+.4;g.fillStyle='#6fe3ff';g.beginPath();g.moveTo(x+20,y+8+bb);g.lineTo(x+20+10*sx,y+20+bb);g.lineTo(x+20,y+32+bb);g.lineTo(x+20-10*sx,y+20+bb);g.closePath();g.fill();g.strokeStyle=INK;g.lineWidth=1.5;g.stroke();g.fillStyle='rgba(255,255,255,.75)';g.beginPath();g.moveTo(x+20,y+8+bb);g.lineTo(x+20+4*sx,y+20+bb);g.lineTo(x+20,y+24+bb);g.fill()}
        else if(ch==='S'){var sq=S.sprT>0&&S.sprX===tx?10:0;g.strokeStyle='#8a8478';g.lineWidth=4;g.beginPath();for(i=0;i<4;i++){g.moveTo(x+8,y+T-4-i*(6-sq/4));g.lineTo(x+32,y+T-7-i*(6-sq/4))}g.stroke();g.fillStyle=YEL;g.fillRect(x+4,y+12+sq,32,8);g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(x+4,y+12+sq,32,8)}
        else if(ch==='c'){var on=S.cp.tx===tx;g.fillStyle=INK;g.fillRect(x+18,y-8,4,T+8);g.fillStyle=on?YEL:'#b9b3a6';g.beginPath();g.moveTo(x+22,y-7);g.lineTo(x+40,y+1+Math.sin(tt*5)*3);g.lineTo(x+22,y+10);g.closePath();g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke()}
        else if(ch==='F'){g.fillStyle=INK;g.fillRect(x-6,y-44,52,84);var pg=g.createLinearGradient(0,y-40,0,y+40);pg.addColorStop(0,'#b48cff');pg.addColorStop(1,'#6fe3ff');g.fillStyle=pg;g.fillRect(x,y-38,40,78);g.fillStyle='rgba(255,255,255,.5)';for(i=0;i<5;i++){var yy=(tt*60+i*17)%78;g.fillRect(x+4+i*7,y+40-yy,3,8)}}}
      /* plateformes mobiles */
      S.mp.forEach(function(m){if(m.x>cam+W+40||m.x+m.w<cam-40)return;g.fillStyle='#c9a26a';g.fillRect(m.x,m.y,m.w,m.h);g.fillStyle='#8a6a3a';for(i=1;i<3;i++)g.fillRect(m.x+i*T-1,m.y,2,m.h);g.fillRect(m.x,m.y+m.h-3,m.w,3);g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(m.x,m.y,m.w,m.h);
        g.strokeStyle='rgba(20,18,16,.35)';g.setLineDash([4,6]);g.beginPath();if(m.ax){g.moveTo(m.x0-m.ax+m.w/2,m.y0+m.h/2);g.lineTo(m.x0+m.ax+m.w/2,m.y0+m.h/2)}else{g.moveTo(m.x0+m.w/2,m.y0-m.ay);g.lineTo(m.x0+m.w/2,m.y0+m.ay+m.h)}g.stroke();g.setLineDash([])});
      /* bonus */
      S.items.forEach(function(it){var x=it.x,y=it.y;if(it.rise>0){g.save();g.beginPath();g.rect(x-4,it.y0-T-4,it.w+8,T+4);g.clip()}
        if(it.t==='cap'){g.fillStyle=RED;ag.rr(g,x+2,y+6,24,16,8);g.fill();g.fillStyle=CR;g.fillRect(x+14,y+6,12,16);g.strokeStyle=INK;g.lineWidth=2;ag.rr(g,x+2,y+6,24,16,8);g.stroke();g.fillStyle='#fff';g.fillRect(x+6,y+9,4,3)}
        else if(it.t==='flame'){var fl=Math.sin(tt*10)*2;g.fillStyle='#3f8a3a';g.fillRect(x+12,y+18,4,10);g.fillStyle='#ff7a2a';g.beginPath();g.moveTo(x+4,y+20);g.quadraticCurveTo(x+2,y+6,x+14,y-2-fl);g.quadraticCurveTo(x+26,y+6,x+24,y+20);g.closePath();g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();g.fillStyle=YEL;g.beginPath();g.moveTo(x+9,y+19);g.quadraticCurveTo(x+10,y+10,x+14,y+5-fl);g.quadraticCurveTo(x+18,y+10,x+19,y+19);g.fill()}
        else{var hue=(tt*360)%360;g.fillStyle='hsl('+hue+',90%,62%)';g.beginPath();for(i=0;i<10;i++){var a2=i*Math.PI/5-Math.PI/2+tt*2,r2=i%2?6:14;g.lineTo(x+14+Math.cos(a2)*r2,y+14+Math.sin(a2)*r2)}g.closePath();g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke()}
        if(it.rise>0)g.restore()});
      /* ennemis */
      S.en.forEach(function(e){if(!e.alive||e.x<cam-80||e.x>cam+W+80)return;var cx=e.x+e.w/2,by=e.y+e.h;g.save();
        if(e.dying&&e.how==='flip'){g.translate(cx,e.y+e.h/2);g.scale(1,-1);g.translate(-cx,-(e.y+e.h/2))}
        if(e.k==='s'){var sq=e.dying&&e.how==='squash'?.35:1,wob=Math.sin(tt*8+e.x*.05)*2;var hh=(22-wob)*sq;g.fillStyle='#6fd66a';ag.rr(g,cx-15,by-hh,30,hh,9*sq);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();
          if(sq===1){var d=e.vx>0?4:-4;g.fillStyle='#fff';g.beginPath();g.arc(cx-5+d,by-13+wob,4,0,7);g.arc(cx+5+d,by-13+wob,4,0,7);g.fill();g.fillStyle=INK;g.beginPath();g.arc(cx-5+d*1.3,by-13+wob,2,0,7);g.arc(cx+5+d*1.3,by-13+wob,2,0,7);g.fill()}}
        else if(e.k==='k'){g.fillStyle='#8a6a4a';for(i=0;i<5;i++){g.beginPath();g.moveTo(cx-14+i*7,by-12);g.lineTo(cx-11+i*7,by-26-(i%2)*4);g.lineTo(cx-7+i*7,by-12);g.fill()}g.fillStyle='#c9a26a';ag.rr(g,cx-15,by-16,30,16,7);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();var dk=e.vx>0?1:-1;g.fillStyle=INK;g.beginPath();g.arc(cx+dk*8,by-9,2.5,0,7);g.fill();g.fillStyle='#e88a8a';g.beginPath();g.arc(cx+dk*14,by-6,2.5,0,7);g.fill();var st2=Math.sin(tt*14)*3;g.fillStyle=INK;g.fillRect(cx-9+st2,by-3,5,3);g.fillRect(cx+4-st2,by-3,5,3)}
        else if(e.k==='t'){var sh=e.st!=='walk';g.fillStyle='#3a6ad8';g.beginPath();g.ellipse(cx,by-(sh?10:14),15,sh?10:12,0,Math.PI,0);g.fill();g.fillRect(cx-15,by-(sh?10:14),30,sh?6:6);g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.ellipse(cx,by-(sh?10:14),15,sh?10:12,0,Math.PI,0);g.stroke();g.strokeRect(cx-15,by-(sh?10:14),30,6);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(cx-8,by-(sh?18:23),6,3);
          if(!sh){var d3=e.vx>0?1:-1;g.fillStyle='#e8d6a0';g.beginPath();g.arc(cx+d3*17,by-12,6,0,7);g.fill();g.stroke();g.fillStyle=INK;g.fillRect(cx+d3*19-1,by-14,2,3);var st3=Math.sin(tt*14)*3;g.fillRect(cx-9+st3,by-8,4,8);g.fillRect(cx+5-st3,by-8,4,8)}}
        else if(e.k==='j'){var fl2=Math.sin(tt*20)*3;g.fillStyle='#ff7a2a';g.beginPath();g.moveTo(cx-12,by-4);g.quadraticCurveTo(cx-16,by-20,cx,by-30-fl2);g.quadraticCurveTo(cx+16,by-20,cx+12,by-4);g.closePath();g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();g.fillStyle=YEL;g.beginPath();g.arc(cx,by-12,7,0,7);g.fill();g.fillStyle=INK;g.fillRect(cx-5,by-15,3,4);g.fillRect(cx+2,by-15,3,4)}
        else{var fl3=Math.sin(tt*16)*8;g.fillStyle='#8a5ad0';g.beginPath();g.moveTo(cx-8,by-12);g.lineTo(cx-24,by-18-fl3);g.lineTo(cx-16,by-4);g.fill();g.beginPath();g.moveTo(cx+8,by-12);g.lineTo(cx+24,by-18-fl3);g.lineTo(cx+16,by-4);g.fill();g.beginPath();g.arc(cx,by-10,10,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();g.fillStyle=YEL;g.fillRect(cx-6,by-13,4,4);g.fillRect(cx+2,by-13,4,4)}
        g.restore()});
      /* boss */
      var B=S.boss;if(B&&!(B.inv>0&&Math.floor(tt*16)%2&&!B.dead)){var bx=B.x,bw=B.w,bh=B.h,bt=B.y,fc=B.face;g.save();if(B.dead){g.translate(bx+bw/2,bt+bh/2);g.rotate(B.dead*3);g.translate(-(bx+bw/2),-(bt+bh/2))}g.strokeStyle=INK;g.lineWidth=3;
        if(B.lv===0){var wb=B.g?Math.sin(tt*6)*3:-4;g.fillStyle='#4fc24a';ag.rr(g,bx,bt-wb,bw,bh+wb,26);g.fill();g.stroke();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(bx+bw*.3,bt+14-wb,12,6,-.4,0,7);g.fill();
          g.fillStyle=YEL;g.beginPath();g.moveTo(bx+20,bt-wb+4);g.lineTo(bx+28,bt-wb-14);g.lineTo(bx+38,bt-wb);g.lineTo(bx+46,bt-wb-16);g.lineTo(bx+56,bt-wb);g.lineTo(bx+64,bt-wb-12);g.lineTo(bx+66,bt-wb+4);g.fill();g.stroke();
          var ex=bx+bw/2+fc*10;g.fillStyle='#fff';g.beginPath();g.arc(ex-12,bt+28,10,0,7);g.arc(ex+12,bt+28,10,0,7);g.fill();g.stroke();g.fillStyle=INK;g.beginPath();g.arc(ex-12+fc*4,bt+29,4,0,7);g.arc(ex+12+fc*4,bt+29,4,0,7);g.fill();g.fillRect(ex-14,bt+46,28,4)}
        else if(B.lv===1){var lg=Math.sin(tt*(B.st==='run'?30:10))*4,sh2=B.st==='prep'?Math.sin(tt*60)*3:0;bx+=sh2;g.fillStyle='#c98a3f';for(i=0;i<3;i++){g.fillRect(bx+20+i*22+lg*(i%2?1:-1),bt+bh-12,6,12)}
          ag.rr(g,bx+10,bt+18,bw-20,bh-24,14);g.fill();g.stroke();var tx2=fc>0?bx+14:bx+bw-14;g.beginPath();g.moveTo(tx2,bt+26);g.quadraticCurveTo(tx2-fc*30,bt-20,tx2+fc*6,bt-26);g.lineWidth=10;g.strokeStyle='#c98a3f';g.stroke();g.lineWidth=3;g.strokeStyle=INK;g.fillStyle=RED;g.beginPath();g.moveTo(tx2+fc*6,bt-34);g.lineTo(tx2+fc*16,bt-20);g.lineTo(tx2-fc*2,bt-20);g.fill();g.stroke();
          var hx2=fc>0?bx+bw-16:bx+16;g.fillStyle='#d9a441';g.beginPath();g.arc(hx2+fc*10,bt+20,10,0,7);g.fill();g.stroke();g.fillStyle=B.st==='stun'?'#fff':INK;g.fillRect(bx+bw/2+fc*14-8,bt+24,5,5);g.fillRect(bx+bw/2+fc*14+3,bt+24,5,5);if(B.st==='stun'){g.fillStyle=YEL;for(i=0;i<3;i++){var aa=tt*5+i*2.1;g.fillRect(bx+bw/2+Math.cos(aa)*24,bt+4+Math.sin(aa)*6,5,5)}}}
        else if(B.lv===2){var st4=Math.sin(tt*4)*3;g.fillStyle='#bcdcee';g.fillRect(bx+12,bt+bh-24,20,24);g.fillRect(bx+bw-32,bt+bh-24,20,24);g.strokeRect(bx+12,bt+bh-24,20,24);g.strokeRect(bx+bw-32,bt+bh-24,20,24);
          g.fillStyle='#d9ebf6';ag.rr(g,bx,bt+24,bw,bh-44,10);g.fill();g.stroke();g.fillStyle='#9ec9e8';g.fillRect(bx-10,bt+34+st4,14,34);g.fillRect(bx+bw-4,bt+34-st4,14,34);g.strokeRect(bx-10,bt+34+st4,14,34);g.strokeRect(bx+bw-4,bt+34-st4,14,34);
          g.fillStyle='#eef7ff';ag.rr(g,bx+14,bt,bw-28,30,6);g.fill();g.stroke();g.fillStyle='#2f6f9a';g.fillRect(bx+bw/2+fc*6-14,bt+10,8,8);g.fillRect(bx+bw/2+fc*6+6,bt+10,8,8);g.strokeStyle='rgba(47,111,154,.5)';g.beginPath();g.moveTo(bx+20,bt+40);g.lineTo(bx+40,bt+60);g.lineTo(bx+30,bt+70);g.stroke()}
        else{var fl4=B.st==='stun'?0:Math.sin(tt*10)*16;g.fillStyle='#2a2440';g.beginPath();g.moveTo(bx+bw/2,bt+20);g.lineTo(bx-30,bt+4-fl4);g.lineTo(bx+10,bt+36);g.fill();g.stroke();g.beginPath();g.moveTo(bx+bw/2,bt+20);g.lineTo(bx+bw+30,bt+4-fl4);g.lineTo(bx+bw-10,bt+36);g.fill();g.stroke();
          g.fillStyle='#3a3260';g.beginPath();g.ellipse(bx+bw/2,bt+bh/2+4,bw/2-6,bh/2-4,0,0,7);g.fill();g.stroke();g.fillStyle=YEL;g.beginPath();g.moveTo(bx+bw/2-18,bt+6);g.lineTo(bx+bw/2-12,bt-12);g.lineTo(bx+bw/2-4,bt+2);g.lineTo(bx+bw/2+4,bt-14);g.lineTo(bx+bw/2+12,bt+2);g.lineTo(bx+bw/2+20,bt-10);g.lineTo(bx+bw/2+22,bt+8);g.closePath();g.fill();g.stroke();
          g.fillStyle='#ff9a3a';g.beginPath();g.moveTo(bx+bw/2+fc*14,bt+24);g.lineTo(bx+bw/2+fc*34,bt+30);g.lineTo(bx+bw/2+fc*14,bt+36);g.fill();g.stroke();g.fillStyle=B.st==='stun'?'#fff':RED;g.beginPath();g.arc(bx+bw/2+fc*4,bt+22,5,0,7);g.fill()}
        g.restore()}
      /* projectiles du boss */
      S.bp.forEach(function(o){g.strokeStyle=INK;g.lineWidth=2;if(o.k==='ice'){g.fillStyle='#d9ebf6';g.save();g.translate(o.x+o.w/2,o.y+o.h/2);g.rotate(tt*6);g.fillRect(-o.w/2,-o.h/2,o.w,o.h);g.strokeRect(-o.w/2,-o.h/2,o.w,o.h);g.restore()}
        else if(o.k==='goo'){g.fillStyle='#6fd66a';g.beginPath();g.arc(o.x+8,o.y+8,8,0,7);g.fill();g.stroke()}else{g.fillStyle='#9d8ff0';g.beginPath();g.ellipse(o.x+6,o.y+11,5,11,Math.atan2(o.vx,o.vy)*-1,0,7);g.fill();g.stroke()}});
      /* boules de feu */
      S.fb.forEach(function(f){g.fillStyle='#ff7a2a';g.beginPath();g.arc(f.x+7,f.y+7,7,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();g.fillStyle=YEL;g.beginPath();g.arc(f.x+7,f.y+7,3,0,7);g.fill()});
      /* les héros, aux couleurs de ton perso (le joueur 2 en bleu) */
      var a=PP.perso&&PP.perso.get?PP.perso.get():{};
      S.ps.forEach(function(p){if(p.dead||(p.inv>0&&Math.floor(tt*14)%2))return;drawHero(g,p,a,tt)});
      /* effets */
      S.fx.forEach(function(f){if(f.k==='gem'){g.fillStyle='#6fe3ff';g.beginPath();g.moveTo(f.x,f.y-10);g.lineTo(f.x+7,f.y);g.lineTo(f.x,f.y+10);g.lineTo(f.x-7,f.y);g.closePath();g.fill();g.strokeStyle=INK;g.lineWidth=1.5;g.stroke();return}g.globalAlpha=Math.min(1,f.t*2);g.fillStyle=f.col;g.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s)});g.globalAlpha=1;
      S.txt.forEach(function(t){g.globalAlpha=Math.min(1,t.t*2);ag.mono(g,t.s,t.x,t.y,14,S.lv===3?CR:INK,'center');g.globalAlpha=1});
      g.restore();
      /* interface : vies, cristaux, progression, barre du boss */
      var dark=S.lv===3,hc=dark?CR:INK;g.fillStyle=dark?'rgba(255,255,255,.12)':'rgba(255,255,255,.55)';ag.rr(g,14,12,170,34,8);g.fill();
      g.fillStyle=RED;var hx=30,hy=29;g.beginPath();g.moveTo(hx,hy+8);g.bezierCurveTo(hx-14,hy-4,hx-5,hy-12,hx,hy-4);g.bezierCurveTo(hx+5,hy-12,hx+14,hy-4,hx,hy+8);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();
      ag.mono(g,'× '+S.lives,48,34,16,hc,'left');g.fillStyle='#6fe3ff';g.beginPath();g.moveTo(104,19);g.lineTo(111,29);g.lineTo(104,39);g.lineTo(97,29);g.closePath();g.fill();g.stroke();ag.mono(g,'× '+S.gems,118,34,16,hc,'left');
      var prog=Math.min(1,(S.ps[0].x)/((L.arena+4)*T));g.fillStyle='rgba(20,18,16,.35)';ag.rr(g,W/2-150,18,300,8,4);g.fill();g.fillStyle=YEL;ag.rr(g,W/2-150,18,Math.max(8,300*prog),8,4);g.fill();ag.mono(g,'MONDE '+(S.lv+1)+' · '+th.n.toUpperCase(),W/2,44,12,hc,'center');
      ag.mono(g,S.score+' PTS',W-20,34,16,hc,'right');
      if(B&&!B.dead){g.fillStyle='rgba(20,18,16,.7)';ag.rr(g,W/2-180,60,360,30,6);g.fill();ag.mono(g,B.n.toUpperCase(),W/2,80,13,CR,'center');g.fillStyle='#3a3630';g.fillRect(W/2-170,94,340,8);g.fillStyle=RED;g.fillRect(W/2-170,94,340*Math.max(0,B.hp/B.max),8);g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(W/2-170,94,340,8)}
      if(S.banner>0&&C.running){g.globalAlpha=Math.min(1,S.banner);ag.txt(g,'MONDE '+(S.lv+1)+' · '+th.n.toUpperCase(),W/2,150,48,dark?CR:INK);g.globalAlpha=1}}
  });

  /* héros dessiné en vectoriel : petit (34 px) ou grand (50 px), squash au saut et à l'atterrissage */
  function drawHero(g,p,a,tt){var p2=p.i===1,tc=p2?'#3a6ad8':(a.topCol||RED),bc=p2?'#17120e':(a.botCol||'#2a3a5a'),skc=a.skin||'#e8b98c',hc=p2?'#e6cf96':(a.hairCol||'#3a2a1a'),shc=p2?'#f1ece2':(a.shoeCol||'#f1ece2');
    if(p.pw===2){bc=RED;if(!p2)tc=CR;else tc='#bfe3ff'}
    if(p.star>0)tc='hsl('+((tt*600)%360)+',85%,58%)';
    var cx=p.x+p.w/2,by=p.y+p.h,s=p.h/34,air=!p.g&&!p.on,run=air?0:Math.sin(p.an*3),sq=p.sq>0?p.sq:0,st=p.sq<0?-p.sq:0;
    var sxk=(1+sq*.18-st*.08)*(p.pw?1.12:1),syk=(1-sq*.16+st*.1)*s;
    g.save();g.translate(cx,by);g.scale(p.face*sxk,syk);g.lineJoin='round';g.strokeStyle=INK;g.lineWidth=2/Math.max(.8,s);
    /* jambes et chaussures */
    var l1=air?-3:run*5,l2=air?3:-run*5;g.fillStyle=bc;g.fillRect(-8+l1,-12,6,8);g.fillRect(2+l2,-12,6,8);g.fillStyle=shc;g.fillRect(-9+l1,-5,9,5);g.fillRect(1+l2,-5,9,5);g.strokeRect(-9+l1,-5,9,5);g.strokeRect(1+l2,-5,9,5);
    /* bras arrière */
    var aw=air?-10:run*4;g.fillStyle=tc;g.save();g.translate(-8,-23);g.rotate((air?-2.2:-aw*.08));g.fillRect(-3,0,6,11);g.strokeRect(-3,0,6,11);g.fillStyle=skc;g.fillRect(-3,10,6,4);g.restore();
    /* corps */
    g.fillStyle=tc;ag.rr(g,-11,-25,22,15,5);g.fill();g.stroke();g.fillStyle=bc;g.fillRect(-11,-13,22,3);
    /* tête */
    g.fillStyle=skc;ag.rr(g,-10,-42,20,18,7);g.fill();g.stroke();
    g.fillStyle=hc;g.beginPath();g.moveTo(-11,-34);g.quadraticCurveTo(-12,-45,0,-45);g.quadraticCurveTo(12,-45,11,-37);g.lineTo(4,-38);g.lineTo(1,-35);g.lineTo(-3,-38);g.lineTo(-9,-36);g.closePath();g.fill();g.stroke();
    g.fillStyle=INK;g.fillRect(3,-34,3,5);g.fillRect(-3,-34,3,5);g.fillRect(0,-28,5,2);
    /* bras avant */
    g.fillStyle=tc;g.save();g.translate(8,-23);g.rotate(air?-2.4:aw*.08);g.fillRect(-3,0,6,11);g.strokeRect(-3,0,6,11);g.fillStyle=skc;g.fillRect(-3,10,6,4);g.restore();
    g.restore();
    if(S.duo){ag.mono(g,p2?'J2':'J1',cx,p.y-10,11,p2?'#3a6ad8':RED,'center')}}
})();
