/* Pixel Pause — Bitume v71 : jeu de ville en vue du dessus, original du site.
   Une grande ville en blocs, des voitures qu'on vole et qu'on conduit, des passants, une police qui te recherche (1 à 5 étoiles),
   8 missions (Histoire, progression sauvegardée), une balade libre et un mode Chaos (tiens le plus longtemps possible).
   Clavier : ZQSD / flèches, E pour monter ou descendre, Espace pour frapper (à pied) ou freiner (en voiture).
   Téléphone : joystick (en voiture, la voiture tourne vers où tu pousses), boutons VOITURE et COUP. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',BLU='#3fa9ff',GRN='#3fe09a',W=960,H=540;
  var T=48,N=82,PX=N*T,PI=Math.PI;
  var DX=[1,0,-1,0],DY=[0,1,0,-1],DA=[0,PI/2,PI,-PI/2];
  var ROAD=0,WALK=1,BLD=2,GRASS=3,TREE=4,PLAZA=5,LOT=6,FOUNT=7;
  var MAP=null,BLDS=[],TREES=[],FOUNTS=[],SPEC={},MM=null,S=null,TOUCH=false;
  var ROOF=['#c9b79c','#a7b4c2','#d1a07a','#8fa3a8','#b9a3c9','#c47e6a','#9db58a','#d8c27a','#b0a89a','#7f97b3'];
  var TYPES={
    compact:{L:38,W:19,max:250,acc:270,m:1,cols:['#3f7fd0','#3fae6a','#d0563f','#8a5ad0','#e0e0e0','#2f2f36','#d08a3f']},
    sedan:{L:44,W:21,max:285,acc:290,m:1.1,cols:['#2f4f7f','#7f2f2f','#cfcfcf','#3a3a40','#5f7f3f','#e8e1cf']},
    sport:{L:44,W:20,max:370,acc:430,m:.9,cols:['#e2361b','#f3c623','#3fe09a','#ff7a1a']},
    van:{L:54,W:24,max:205,acc:200,m:1.7,cols:['#f1ece2','#9db5c9','#c9b48a']},
    taxi:{L:44,W:21,max:275,acc:290,m:1.1,cols:['#f3c623']},
    pol:{L:46,W:21,max:300,acc:350,m:1.3,cols:['#f4f4f4']},
    lux:{L:48,W:22,max:395,acc:440,m:1.1,cols:['#e6b422']}
  };
  var POOL=['compact','compact','compact','sedan','sedan','sedan','van','taxi','sport','pol'];
  var SHIRT=['#3f7fd0','#3fae6a','#d0563f','#8a5ad0','#e0c040','#e8e1cf','#2f2f36','#d0709a','#4fb0b0'],HAIR=['#2a1d14','#5a3a1f','#d8b25a','#1a1a1a','#8a4a2a','#bbb'],SKIN=['#f0c8a0','#d9a577','#a8744a','#6f4a2f','#f5d6b8'];

  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function rnd(a,b){return a+Math.random()*(b-a)}
  function pick(a){return a[Math.random()*a.length|0]}
  function wrap(a){while(a>PI)a-=2*PI;while(a<-PI)a+=2*PI;return a}
  function cl(v,a,b){return v<a?a:v>b?b:v}
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function tile(tx,ty){if(tx<0||ty<0||tx>=N||ty>=N)return BLD;return MAP[ty*N+tx]}
  function at(x,y){return tile(Math.floor(x/T),Math.floor(y/T))}
  function solid(t){return t===BLD||t===TREE||t===FOUNT}
  function walkable(t){return t===WALK||t===GRASS||t===PLAZA||t===LOT}
  /* coin de trottoir près du carrefour (ix,iy) et centre du carrefour */
  function SP(ix,iy,c){var o={SE:[2,2],SW:[-1,2],NE:[2,-1],NW:[-1,-1]}[c];return {x:(ix*10+o[0]+.5)*T,y:(iy*10+o[1]+.5)*T}}
  function NC(ix,iy){return {x:(ix*10+1)*T,y:(iy*10+1)*T}}

  /* ---------- la ville (toujours la même) ---------- */
  function fill(x,y,w,h,v){for(var j=y;j<y+h;j++)for(var i=x;i<x+w;i++)MAP[j*N+i]=v}
  function addB(tx,ty,w,h,h3,col,label){fill(tx,ty,w,h,BLD);var b={x:tx*T,y:ty*T,w:w*T,h:h*T,h3:h3,col:col,label:label||'',ac:[]};
    var R=rng(tx*131+ty*17);for(var i=0;i<1+(w*h/6|0);i++)b.ac.push([R()*.7+.1,R()*.7+.1,R()<.5]);BLDS.push(b);return b}
  function build(){if(MAP)return;MAP=new Uint8Array(N*N);var R=rng(20261127),x,y;
    for(y=0;y<N;y++)for(x=0;x<N;x++)MAP[y*N+x]=(x%10<2||y%10<2)?ROAD:WALK;
    var specs={'2,1':['gar','GARAGE PISTONS','#c9572f'],'5,3':['paint','PEINTURE MINUTE','#3f8fd0'],'4,5':['pol','COMMISSARIAT','#34489a'],'1,5':['hosp','HÔPITAL','#e8e4da']};
    function hb(){return .55+R()*1.15}function cb(){return ROOF[R()*ROOF.length|0]}
    for(var bj=0;bj<8;bj++)for(var bi=0;bi<8;bi++){var ox=bi*10+3,oy=bj*10+3,sp=specs[bi+','+bj];
      if(sp){addB(ox,oy,6,4,1.2,sp[2],sp[1]);fill(ox,oy+4,6,2,LOT);SPEC[sp[0]]={lot:{x:ox*T,y:(oy+4)*T,w:6*T,h:2*T},door:{x:(ox+3)*T,y:(oy+6.5)*T},c:{x:(ox+3)*T,y:(oy+5)*T}};continue}
      var r=R();
      if(r<.11){fill(ox,oy,6,6,GRASS);for(var i=0;i<8;i++){var tx=ox+(R()*6|0),ty=oy+(R()*6|0);if(tile(tx,ty)===GRASS){MAP[ty*N+tx]=TREE;TREES.push({x:(tx+.5)*T,y:(ty+.5)*T,r:17+R()*7})}}continue}
      if(r<.16){fill(ox,oy,6,6,PLAZA);fill(ox+2,oy+2,2,2,FOUNT);FOUNTS.push({x:(ox+3)*T,y:(oy+3)*T});continue}
      var lay=R();
      if(lay<.2)addB(ox,oy,6,6,hb()+.3,cb());
      else if(lay<.4){addB(ox,oy,3,6,hb(),cb());addB(ox+3,oy,3,6,hb(),cb())}
      else if(lay<.6){addB(ox,oy,6,3,hb(),cb());addB(ox,oy+3,6,3,hb(),cb())}
      else if(lay<.82){addB(ox,oy,3,3,hb(),cb());addB(ox+3,oy,3,3,hb(),cb());addB(ox,oy+3,3,3,hb(),cb());addB(ox+3,oy+3,3,3,hb(),cb())}
      else{addB(ox,oy,6,2,hb(),cb());addB(ox,oy+2,4,4,hb(),cb());fill(ox+4,oy+2,2,4,LOT)}}
    BLDS.sort(function(a,b){return a.h3-b.h3});
    BLDS.forEach(function(b){var c=b.col;b.s1=shade(c,-.32);b.s2=shade(c,-.45)});
    /* mini-carte : 2 px par case, avec une marge pour ne jamais lire hors de l'image */
    MM=document.createElement('canvas');MM.width=MM.height=(N+60)*2;var m=MM.getContext('2d');m.fillStyle='#1b1a18';m.fillRect(0,0,MM.width,MM.height);
    var COL=['#55545a','#8d887e','#3b3934','#4f8f3a','#2f6a2a','#a59a85','#55545a','#3f8fd0'];
    for(y=0;y<N;y++)for(x=0;x<N;x++){m.fillStyle=COL[MAP[y*N+x]];m.fillRect((x+30)*2,(y+30)*2,2,2)}}
  function shade(hex,k){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;function f(v){return Math.round(k<0?v*(1+k):v+(255-v)*k)}return 'rgb('+f(r)+','+f(g)+','+f(b)+')'}

  /* ---------- missions (Histoire) ---------- */
  var MIS=[
    {n:'Premier volant',d:'Vole une voiture : approche-toi et appuie sur E (VOITURE sur téléphone). Puis amène-la au Garage Pistons.',s:[1,2,'NE'],car:1,r:200,
      pts:[{g:'gar',o:'Amène une voiture au Garage Pistons',l:'GARÉE !'}]},
    {n:'Livraison express',d:'Va chercher le colis en voiture puis livre-le avant la fin du chrono.',s:[3,2,'SW'],car:1,time:85,r:300,
      pts:[{p:[6,1,'SE'],o:'Va chercher le colis',l:'COLIS RÉCUPÉRÉ'},{p:[2,6,'NE'],o:'Livre le colis',l:'LIVRÉ !'}]},
    {n:'Taxi pressé',d:'Un client attend sur le trottoir. Emmène-le à destination, vite !',s:[4,4,'NW'],car:1,time:80,r:350,
      pts:[{p:[5,4,'SE'],o:'Prends le client',l:'CLIENT À BORD',pax:1},{p:[7,7,'NW'],o:'Dépose le client',l:'DÉPOSÉ !'}]},
    {n:'Course de rue',d:'Passe les 6 points avant la fin du chrono.',s:[2,5,'NE'],car:1,time:72,r:500,
      pts:[{n:[3,5]},{n:[5,5]},{n:[5,3]},{n:[7,3]},{n:[7,6]},{n:[4,7]}]},
    {n:'Sème-les',d:'La police te cherche : 3 étoiles. Fais-les toutes disparaître en restant loin des policiers, ou passe à Peinture Minute (100 $).',s:[6,2,'SW'],heat:3,lose:1,r:600},
    {n:'La voiture dorée',d:'Une voiture de luxe dorée est garée en ville. Vole-la et amène-la au garage sans trop l\'abîmer.',s:[1,4,'NE'],spec:[7,1,'SW'],car:2,r:800,
      pts:[{g:'gar',o:'Amène la voiture dorée au garage',l:'LIVRÉE !'}]},
    {n:'Tournée',d:'Trois colis à livrer, un seul chrono.',s:[5,6,'NW'],car:1,time:125,r:900,
      pts:[{p:[3,3,'SE'],o:'Livre le colis 1',l:'1 / 3'},{p:[6,5,'NE'],o:'Livre le colis 2',l:'2 / 3'},{p:[1,7,'NE'],o:'Livre le colis 3',l:'3 / 3'}]},
    {n:'Le grand final',d:'4 étoiles aux trousses : passe les 5 points, puis sème la police.',s:[4,2,'SE'],heat:4,car:1,time:115,lose:1,r:1500,
      pts:[{n:[4,4]},{n:[2,4]},{n:[2,7]},{n:[6,7]},{n:[8,4]}]}
  ];
  function ptPos(p){if(p.g)return SPEC[p.g].c;if(p.p)return SP(p.p[0],p.p[1],p.p[2]);return NC(p.n[0],p.n[1])}

  /* ---------- sauvegarde ---------- */
  function save(){if(!S||S.mode==='chaos')return;PP.store('bt-cash',Math.max(0,S.cash|0));PP.store('bt-mis',S.mis);if(S.C)S.C.best('cash',S.cash|0)}
  var SC=null;document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-bt-r0]');if(!b||!SC)return;e.preventDefault();e.stopPropagation();
    PP.store('bt-mis',0);PP.store('bt-cash',0);var st=document.getElementById('bitume-start');if(st)st.click()},true);

  /* ---------- voitures ---------- */
  var CID=0;
  function mkCar(type,x,y,a){var t=TYPES[type];return {id:++CID,type:type,x:x,y:y,a:a,vx:0,vy:0,L:t.L,W:t.W,max:t.max,acc:t.acc,m:t.m,col:pick(t.cols),hp:100,drv:null,
    d:0,ix:0,iy:0,nd:null,cruise:rnd(120,165),blk:0,daze:0,stuck:0,rev:0,hitW:0,burn:0,wreck:false,out:0,siren:false,keep:0,horn:0}}
  function fwd(c){return c.vx*Math.cos(c.a)+c.vy*Math.sin(c.a)}
  function carHit(x,y,a,L,w){var co=Math.cos(a),si=Math.sin(a),hl=L/2-1,hw=w/2-1,P=[[hl,hw],[hl,-hw],[-hl,hw],[-hl,-hw],[0,hw],[0,-hw],[hl,0],[-hl,0]];
    for(var i=0;i<8;i++){var px=x+P[i][0]*co-P[i][1]*si,py=y+P[i][0]*si+P[i][1]*co;if(solid(at(px,py)))return true}return false}
  function carStep(c,th,st,hb,dt){
    var co=Math.cos(c.a),si=Math.sin(c.a),f=c.vx*co+c.vy*si,l=-c.vx*si+c.vy*co,mx=c.max*(at(c.x,c.y)===GRASS?.55:1);
    if(c.wreck||c.burn>0){th=0;st=0}
    if(th>0)f+=(f<0?520:c.acc)*th*dt;else if(th<0)f-=(f>0?520:c.acc*.6)*(-th)*dt;else f-=Math.sign(f)*Math.min(Math.abs(f),(c.drv?90:260)*dt);
    if(f>mx)f-=Math.min(f-mx,400*dt);f=Math.max(f,-c.max*.4);
    var grip=hb?1.8:9;l*=Math.exp(-grip*dt);if(hb)f-=Math.sign(f)*Math.min(Math.abs(f),240*dt);
    c.a=wrap(c.a+st*2.7*cl(f/140,-1,1)*dt);co=Math.cos(c.a);si=Math.sin(c.a);
    c.vx=co*f-si*l;c.vy=si*f+co*l;
    var inW=carHit(c.x,c.y,c.a,c.L,c.W),nx=c.x+c.vx*dt,ny=c.y+c.vy*dt,imp=0;
    if(inW||!carHit(nx,c.y,c.a,c.L,c.W))c.x=nx;else{imp=Math.max(imp,Math.abs(c.vx));c.vx*=-.3;c.vy*=.8}
    if(inW||!carHit(c.x,ny,c.a,c.L,c.W))c.y=ny;else{imp=Math.max(imp,Math.abs(c.vy));c.vy*=-.3;c.vx*=.8}
    c.x=cl(c.x,30,PX-30);c.y=cl(c.y,30,PX-30);
    if(imp>0){c.hitW=.25;if(imp>80)hurtCar(c,(imp-60)/12);if(imp>110&&c===S.P.car){sfx.play('crash');S.C.shake(Math.min(10,imp/40));sparks(c.x+co*c.L/2,c.y+si*c.L/2,6)}}
    c.hitW=Math.max(0,c.hitW-dt);
    if(c.hitW>0&&Math.abs(f)<30&&th)c.stuck+=dt;else c.stuck=Math.max(0,c.stuck-dt);
  }
  function hurtCar(c,v){if(c.wreck)return;c.hp-=v;if(c.hp<=0&&c.burn<=0){c.hp=0;c.burn=3;if(c===S.P.car)S.banner={t:3,s:'La voiture prend feu ! Sors vite ('+(TOUCH?'VOITURE':'E')+') !'}}}
  function explode(c){c.burn=0;c.wreck=true;c.vx=c.vy=0;sfx.play('crash');sfx.play('die');
    for(var i=0;i<26;i++)S.fx.push({x:c.x,y:c.y,vx:rnd(-160,160),vy:rnd(-160,160),t:rnd(.4,1),t0:1,r:rnd(6,14),col:pick(['#ff7a1a','#f3c623','#e2361b','#444'])});
    if(dist(c,S.P)<240)S.C.shake(12);
    S.peds.forEach(function(p){var d=dist(p,c);if(d<90)knock(p,(p.x-c.x)/d*200||100,(p.y-c.y)/d*200||0,null)});
    S.cars.forEach(function(o){if(o!==c&&dist(o,c)<90)hurtCar(o,35)});
    var P=S.P;if(P.car===c){P.car=null;c.drv=null;ejectPlayer(c);P.hp-=50;P.hurtT=0}else if(!P.car&&dist(P,c)<90){P.hp-=45;P.hurtT=0}
    if(c.drv==='ai'||c.drv==='cop')c.drv=null}
  function sparks(x,y,n){for(var i=0;i<n;i++)S.fx.push({x:x,y:y,vx:rnd(-220,220),vy:rnd(-220,220),t:rnd(.15,.35),t0:.35,r:2.5,col:YEL})}

  /* circulation : la voiture suit sa voie (à droite) d'un carrefour à l'autre */
  function rightOf(d){return [-DY[d],DX[d]]}
  function initLane(c){var bd=9,d=0;for(var k=0;k<4;k++){var df=Math.abs(wrap(DA[k]-c.a));if(df<bd){bd=df;d=k}}
    var gx=(c.x/T-1)/10,gy=(c.y/T-1)/10;
    for(var tries=0;tries<4;tries++){var ix,iy;
      if(DX[d]){ix=d===0?Math.floor(gx)+1:Math.ceil(gx)-1;iy=Math.round(gy)}else{iy=d===1?Math.floor(gy)+1:Math.ceil(gy)-1;ix=Math.round(gx)}
      ix=cl(ix,0,8);iy=cl(iy,0,8);var n=NC(ix,iy);if((n.x-c.x)*DX[d]+(n.y-c.y)*DY[d]>-20){c.d=d;c.ix=ix;c.iy=iy;c.nd=null;return}d=(d+1)%4}
    c.d=d;c.ix=cl(Math.round(gx),0,8);c.iy=cl(Math.round(gy),0,8);c.nd=null}
  function pickDir(c){var o=[],d=c.d;for(var k=0;k<4;k++){if(k===(d+2)%4)continue;var jx=c.ix+DX[k],jy=c.iy+DY[k];if(jx<0||jy<0||jx>8||jy>8)continue;o.push(k);if(k===d){o.push(k);o.push(k)}}
    return o.length?pick(o):(d+2)%4}
  function blocked(c){var co=Math.cos(c.a),si=Math.sin(c.a),hit=0;
    function chk(o,rad){var rx=o.x-c.x,ry=o.y-c.y,f=rx*co+ry*si;if(f<=0||f>c.L/2+52)return;if(Math.abs(-rx*si+ry*co)<rad)hit=1}
    for(var i=0;i<S.cars.length&&!hit;i++){var o=S.cars[i];if(o===c)continue;if(o.drv==='ai'&&Math.abs(wrap(o.a-c.a))>1.05&&Math.hypot(o.vx,o.vy)>20)continue;chk(o,20)}
    for(i=0;i<S.peds.length&&!hit;i++)chk(S.peds[i],16);
    if(!S.P.car&&!hit)chk(S.P,18);
    return hit}
  function aiDrive(c,dt,dp){var d=c.d,n=NC(c.ix,c.iy),da=(n.x-c.x)*DX[d]+(n.y-c.y)*DY[d];
    if(c.nd==null&&da<110)c.nd=pickDir(c);
    var turn=c.nd!=null&&c.nd!==d,r=rightOf(d),tx,ty;
    if(!turn||da>34){if(!turn&&da<0&&!dp){var jx=c.ix+DX[d],jy=c.iy+DY[d];if(jx<0||jy<0||jx>8||jy>8){c.d=(d+2)%4}else{c.ix=jx;c.iy=jy}c.nd=null;return aiDrive(c,dt,1)}
      var ah=Math.max(da-70,turn?34:-9999);tx=n.x+r[0]*T/2-DX[d]*ah;ty=n.y+r[1]*T/2-DY[d]*ah}
    else{var nd=c.nd,r2=rightOf(nd);tx=n.x+r2[0]*T/2+DX[nd]*70;ty=n.y+r2[1]*T/2+DY[nd]*70;
      if((c.x-n.x)*DX[nd]+(c.y-n.y)*DY[nd]>0){c.d=nd;c.ix=cl(c.ix+DX[nd],0,8);c.iy=cl(c.iy+DY[nd],0,8);c.nd=null}}
    var tgt=turn&&da<120?85:c.cruise,b=blocked(c);if(b){tgt=0;c.blk+=dt;if(c.blk>4.5){c.blk=0;c.ix=cl(c.ix-DX[d],0,8);c.iy=cl(c.iy-DY[d],0,8);c.d=(d+2)%4;c.nd=null}}else c.blk=0;
    if(c.daze>0){c.daze-=dt;tgt=0}
    var f=fwd(c),th=tgt===0?(f>5?-1:0):f<tgt-8?1:f>tgt+15?-1:0,st=cl(wrap(Math.atan2(ty-c.y,tx-c.x)-c.a)*2.2,-1,1);
    carStep(c,th,st,false,dt)}

  /* police : suit un champ de distances calculé depuis le joueur (recalculé 2 fois par seconde) */
  function flow(){var D=S.flow||(S.flow=new Int16Array(N*N)),Q=S.fq||(S.fq=new Int32Array(N*N));D.fill(-1);
    var sx=cl(Math.floor(S.P.x/T),0,N-1),sy=cl(Math.floor(S.P.y/T),0,N-1),h=0,t=0;D[sy*N+sx]=0;Q[t++]=sy*N+sx;
    while(h<t){var k=Q[h++],x=k%N,y=k/N|0,v=D[k]+1;
      if(x>0&&D[k-1]<0&&!solid(MAP[k-1])){D[k-1]=v;Q[t++]=k-1}if(x<N-1&&D[k+1]<0&&!solid(MAP[k+1])){D[k+1]=v;Q[t++]=k+1}
      if(y>0&&D[k-N]<0&&!solid(MAP[k-N])){D[k-N]=v;Q[t++]=k-N}if(y<N-1&&D[k+N]<0&&!solid(MAP[k+N])){D[k+N]=v;Q[t++]=k+N}}}
  function flowNext(x,y){var D=S.flow,best=-1,bv=1e9;for(var j=-1;j<=1;j++)for(var i=-1;i<=1;i++){if(!i&&!j)continue;var tx=x+i,ty=y+j;if(tx<0||ty<0||tx>=N||ty>=N)continue;var v=D[ty*N+tx];
      if(v>=0&&(i&&j?(solid(tile(x+i,y))||solid(tile(x,y+j))):false))continue;if(v>=0&&v<bv){bv=v;best=ty*N+tx}}return best}
  function copDrive(c,dt){var P=S.P,tgt=P.car||P,d=dist(c,tgt),st0=stars(),tx,ty;c.siren=true;
    if(d<210||!S.flow){var lead=st0>=3?.35:.12;tx=tgt.x+(P.car?P.car.vx*lead:0);ty=tgt.y+(P.car?P.car.vy*lead:0)}
    else{var cx=Math.floor(c.x/T),cy=Math.floor(c.y/T),k1=flowNext(cx,cy);if(k1<0){tx=tgt.x;ty=tgt.y}else{var k2=flowNext(k1%N,k1/N|0);var k=k2>=0?k2:k1;tx=(k%N+.5)*T;ty=((k/N|0)+.5)*T}}
    var diff=wrap(Math.atan2(ty-c.y,tx-c.x)-c.a),f=fwd(c),th=Math.abs(diff)>1.4&&f>110?.2:1,st=cl(diff*2.6,-1,1);
    c.max=TYPES.pol.max+st0*16;
    if(!P.car&&d<95){th=f>5?-1:0;if(c.out<1&&Math.abs(f)<60){c.out++;var s=Math.sin(c.a),co=Math.cos(c.a);var p=mkPed(c.x-s*24,c.y+co*24,true);S.peds.push(p)}}
    if(c.daze>0){c.daze-=dt;th=0}
    if(c.rev>0){c.rev-=dt;th=-1;st=-st}else if(c.stuck>1){c.stuck=0;c.rev=.9}
    carStep(c,th,st,Math.abs(diff)>1.6&&f>150,dt)}

  /* ---------- passants ---------- */
  function mkPed(x,y,cop){var d=Math.random()*4|0;return {x:x,y:y,a:DA[d],dx:DX[d],dy:DY[d],sp:rnd(38,58),shirt:cop?'#24356e':pick(SHIRT),hair:pick(HAIR),skin:pick(SKIN),cop:!!cop,ko:0,flee:0,fx:0,fy:0,wt:Math.random()*5,kvx:0,kvy:0,turn:rnd(2,6),calm:false}}
  function moveCirc(o,dx,dy,r){var nx=o.x+dx,ny=o.y+dy;
    if(!(solid(at(nx-r,o.y-r))||solid(at(nx+r,o.y-r))||solid(at(nx-r,o.y+r))||solid(at(nx+r,o.y+r))))o.x=nx;else dx=0;
    if(!(solid(at(o.x-r,ny-r))||solid(at(o.x+r,ny-r))||solid(at(o.x-r,ny+r))||solid(at(o.x+r,ny+r))))o.y=ny;else dy=0;
    o.x=cl(o.x,r,PX-r);o.y=cl(o.y,r,PX-r);return dx||dy}
  function knock(p,vx,vy,by){if(p.ko>0)return;p.ko=p.cop?4:6;p.kvx=vx;p.kvy=vy;p.a=Math.atan2(vy,vx)||0;sfx.play('hit');
    if(!p.cop&&Math.random()<.55)S.items.push({x:p.x,y:p.y,k:'$',v:5+(Math.random()*20|0),t:40});
    panic(p.x,p.y,170);
    if(by==='player')crime(p.cop?1:.9,p.cop?1:0)}
  function panic(x,y,r){S.peds.forEach(function(q){if(!q.cop&&q.ko<=0&&Math.hypot(q.x-x,q.y-y)<r){q.flee=rnd(2.5,4);q.fx=x;q.fy=y}})}
  function pedStep(p,dt){var P=S.P;
    if(p.ko>0){p.ko-=dt;moveCirc(p,p.kvx*dt,p.kvy*dt,6);p.kvx*=Math.exp(-4*dt);p.kvy*=Math.exp(-4*dt);if(p.ko<=0&&!p.cop){p.flee=3;p.fx=P.x;p.fy=P.y}return}
    var vx=0,vy=0;
    if(p.cop&&!p.calm){var tg=P.car||P,dx=tg.x-p.x,dy=tg.y-p.y,d=Math.hypot(dx,dy)||1,sp=118+stars()*9;if(d>8){vx=dx/d*sp;vy=dy/d*sp}p.a=Math.atan2(dy,dx)}
    else if(p.flee>0){p.flee-=dt;var ex=p.x-p.fx,ey=p.y-p.fy,el=Math.hypot(ex,ey)||1;vx=ex/el*125;vy=ey/el*125;p.a=Math.atan2(vy,vx)}
    else{p.turn-=dt;var ahead=at(p.x+p.dx*14,p.y+p.dy*14);
      if(!walkable(ahead)||p.turn<0||!walkable(at(p.x,p.y))){var opts=[];for(var k=0;k<4;k++){if(walkable(at(p.x+DX[k]*20,p.y+DY[k]*20)))opts.push(k)}
        if(opts.length){var k2=pick(opts);p.dx=DX[k2];p.dy=DY[k2]}else{p.dx=-p.dx;p.dy=-p.dy}p.turn=rnd(3,8)}
      vx=p.dx*p.sp;vy=p.dy*p.sp;p.a=Math.atan2(vy,vx);
      if(P.car&&Math.hypot(P.car.vx,P.car.vy)>190&&dist(p,P)<90){p.flee=2;p.fx=P.x;p.fy=P.y}}
    if(vx||vy){p.wt+=dt;moveCirc(p,vx*dt,vy*dt,6)}}

  /* ---------- joueur ---------- */
  function ejectPlayer(c){var P=S.P,s=Math.sin(c.a),co=Math.cos(c.a);
    var opts=[[-s*(c.W/2+14),co*(c.W/2+14)],[s*(c.W/2+14),-co*(c.W/2+14)],[-co*(c.L/2+14),-s*(c.L/2+14)],[co*(c.L/2+14),s*(c.L/2+14)]];
    for(var i=0;i<opts.length;i++){var x=c.x+opts[i][0],y=c.y+opts[i][1];if(!solid(at(x-8,y-8))&&!solid(at(x+8,y+8))&&!solid(at(x+8,y-8))&&!solid(at(x-8,y+8))){P.x=x;P.y=y;break}}
    if(i===opts.length){P.x=c.x;P.y=c.y}P.a=c.a}
  function nearCar(){var P=S.P,best=null,bd=56;S.cars.forEach(function(c){if(c.wreck)return;var d=dist(c,P);if(d<bd){bd=d;best=c}});return best}
  function useCar(C){var P=S.P;
    if(P.car){var c=P.car;if(Math.abs(fwd(c))>130){C.pop('FREINE D\'ABORD',CR,'26px');return}c.drv=null;P.car=null;ejectPlayer(c);sfx.play('ui');return}
    var c2=nearCar();if(!c2)return;
    if(c2.burn>0){C.pop('ELLE BRÛLE !',RED,'26px');return}
    if(c2.drv==='ai'||c2.drv==='cop'){var s=Math.sin(c2.a),co=Math.cos(c2.a),p=mkPed(c2.x-s*26,c2.y+co*26,c2.type==='pol');
      if(c2.type!=='pol'){p.flee=4;p.fx=c2.x;p.fy=c2.y}S.peds.push(p);crime(c2.type==='pol'?2:.6,c2.type==='pol'?2:0);if(S.M&&S.M.car===c2)crime(1,0)}
    else if(S.M&&S.M.car===c2&&!c2.alarm){c2.alarm=1;crime(2,2);C.pop('ALARME !',RED,'34px')}
    c2.drv='player';c2.siren=false;P.car=c2;sfx.play('go');
    if(c2.type==='pol'&&stars()<2)S.heat=Math.max(S.heat,2)}
  function punch(C){var P=S.P;if(P.pt>0)return;P.pt=.28;var co=Math.cos(P.a),si=Math.sin(P.a),hit=null;
    S.peds.forEach(function(p){if(hit||p.ko>0)return;var dx=p.x-P.x,dy=p.y-P.y,d=Math.hypot(dx,dy);if(d<32&&(dx*co+dy*si)/(d||1)>.2)hit=p});
    if(hit)knock(hit,co*170,si*170,'player');else sfx.play('ui')}

  /* ---------- recherche (étoiles) ---------- */
  function stars(){return Math.min(5,Math.floor(S.heat+1e-6))}
  function copNear(r){var P=S.P;for(var i=0;i<S.cars.length;i++){var c=S.cars[i];if(c.type==='pol'&&!c.wreck&&c.drv!=='player'&&dist(c,P)<r)return true}
    for(i=0;i<S.peds.length;i++)if(S.peds[i].cop&&S.peds[i].ko<=0&&dist(S.peds[i],P)<r*.75)return true;return !!(S.heli&&!S.heli.leave&&dist(S.heli,P)<r*.8)}
  function crime(v,min){if(S.mode==='chaos')return;if(v<2&&S.crimeT>S.t)return;S.crimeT=S.t+1.2;var b=stars();if(copNear(400)&&b<2)v=Math.max(v,1);if(b>=3)v*=.4;else if(b>=2)v*=.65;S.heat=Math.min(5,Math.max(S.heat+v,min||0));S.lostT=0;
    if(stars()>b){sfx.play('lose');S.C.pop('★'.repeat(stars()),YEL,'40px')}}
  function calmDown(){S.heat=0;S.lostT=0;S.cars.forEach(function(c){if(c.drv==='cop'){c.drv='ai';c.siren=false;initLane(c)}});S.peds.forEach(function(p){if(p.cop)p.calm=true});if(S.heli)S.heli.leave=1}

  /* ---------- objets à ramasser ---------- */
  function spawnSpot(minD,maxD,ok){for(var k=0;k<14;k++){var a=Math.random()*2*PI,d=rnd(minD,maxD),x=S.P.x+Math.cos(a)*d,y=S.P.y+Math.sin(a)*d;if(x<40||y<40||x>PX-40||y>PX-40)continue;if(ok(at(x,y)))return {x:x,y:y}}return null}
  function spawnTraffic(minD,maxD,type){for(var k=0;k<12;k++){var ix=cl(Math.floor((S.P.x/T-1)/10+rnd(-2.2,2.2)),0,8),iy=cl(Math.floor((S.P.y/T-1)/10+rnd(-2.2,2.2)),0,8),d=Math.random()*4|0;
      var jx=ix+DX[d],jy=iy+DY[d];if(jx<0||jy<0||jx>8||jy>8)continue;var n=NC(ix,iy),r=rightOf(d),t=rnd(110,370),x=n.x+DX[d]*t+r[0]*T/2,y=n.y+DY[d]*t+r[1]*T/2,dd=Math.hypot(x-S.P.x,y-S.P.y);
      if(dd<minD||dd>maxD)continue;var bad=false;for(var i=0;i<S.cars.length;i++)if(Math.hypot(S.cars[i].x-x,S.cars[i].y-y)<80){bad=true;break}if(bad)continue;
      var c=mkCar(type||pick(POOL),x,y,DA[d]);c.drv='ai';c.d=d;c.ix=jx;c.iy=jy;var f=c.cruise*.7;c.vx=DX[d]*f;c.vy=DY[d]*f;S.cars.push(c);return c}return null}

  /* ---------- partie ---------- */
  function fresh(C){SC=C;build();TOUCH=document.body.classList.contains('pp-touch');var m=C.mode||'histoire',mis=Math.min(PP.store('bt-mis')|0,MIS.length);
    S={C:C,mode:m,t:0,cash:m==='chaos'?0:PP.store('bt-cash')|0,mis:mis,heat:0,lostT:0,seen:false,
      P:{x:0,y:0,a:0,hp:100,car:null,pt:0,hurtT:9,wt:0,bust:0},cars:[],peds:[],items:[],fx:[],M:null,heli:null,cam:{x:0,y:0,z:1},flow:null,fq:null,flowT:0,polT:1,banner:null,over:false,paintIn:false,crT:0};
    var st=m==='histoire'&&mis<MIS.length?SP(MIS[mis].s[0],MIS[mis].s[1],MIS[mis].s[2]):SP(6,6,'NW');
    if(m==='histoire'&&mis<MIS.length){st={x:st.x+(MIS[mis].s[2].indexOf('E')>=0?60:-60),y:st.y}}
    S.P.x=st.x;S.P.y=st.y;S.cam.x=st.x;S.cam.y=st.y;S.cam.z=TOUCH?1.45:1;
    /* une voiture garée juste à côté pour démarrer */
    var pc=mkCar(m==='chaos'?'sport':'compact',st.x,st.y+(at(st.x,st.y+60)===ROAD?44:-44),0);if(carHit(pc.x,pc.y,pc.a,pc.L,pc.W)){pc.y=st.y;pc.x=st.x+70}S.cars.push(pc);
    if(m==='chaos'){pc.drv='player';S.P.car=pc;S.banner={t:5,s:'La police arrive dans 5 secondes… File !'}}
    for(var i=0;i<16;i++)spawnTraffic(160,950);
    for(i=0;i<30;i++){var s=spawnSpot(120,900,function(t){return t===WALK||t===PLAZA});if(s)S.peds.push(mkPed(s.x,s.y,false))}
  }
  function knockout(kind){var C=S.C,P=S.P;
    if(S.mode==='chaos'){finish(C,kind);return}
    var why=kind==='bust'?'Tu t\'es fait arrêter.':'Tu es K.O.';if(S.M)misFail(why);
    var loss=Math.min(S.cash,kind==='bust'?Math.max(50,Math.round(S.cash*.1)):100);S.cash-=loss;
    if(P.car){P.car.drv=null;P.car=null}
    var sp=SPEC[kind==='bust'?'pol':'hosp'].door;P.x=sp.x;P.y=sp.y;P.hp=100;P.bust=0;P.hurtT=9;
    calmDown();S.cars=S.cars.filter(function(c){return c.type!=='pol'||c.drv==='ai'});S.peds=S.peds.filter(function(p){return !p.cop});S.heli=null;
    S.cam.x=P.x;S.cam.y=P.y;save();sfx.play('lose');
    C.pop(kind==='bust'?'ARRÊTÉ !':'K.O. !',RED,'70px');
    S.banner={t:4.5,s:(kind==='bust'?'Le commissariat te relâche.':'L\'hôpital t\'a remis sur pied.')+(loss?' Ça t\'a coûté '+loss+' $.':'')}}
  function finish(C,kind){if(S.over)return;S.over=true;C.stop();var secs=Math.floor(S.t),nb=C.best('chaos',secs);if(secs>=120)C.win();
    setTimeout(function(){C.over(kind==='bust'?'Arrêté !':'K.O. !','Tu as tenu <b>'+secs+' s</b> avec la police aux trousses.'+(nb&&secs?'<br><b>Nouveau record !</b>':'<br>Record : '+(C.best('chaos')||0)+' s'),'Rejouer')},700)}

  /* missions */
  function misStart(){var m=MIS[S.mis],C=S.C;S.M={m:m,i:0,t:m.time||0,ph:m.pts?'route':'lose',car:null};
    if(m.heat){S.heat=Math.max(S.heat,m.heat);S.lostT=0}
    if(m.spec){var p=SP(m.spec[0],m.spec[1],m.spec[2]),c=mkCar('lux',p.x,p.y,0);c.keep=1;S.cars.push(c);S.M.car=c}
    C.pop(m.n.toUpperCase(),YEL,'46px');S.banner={t:7,s:m.d};sfx.play('go')}
  function misFail(why){if(!S.M)return;if(S.M.car)S.M.car.keep=0;S.M=null;S.C.pop('MISSION RATÉE',RED,'50px');S.banner={t:5,s:why+' Retourne au point « ! » pour réessayer.'};sfx.play('lose')}
  function misWin(){var m=S.M.m,C=S.C;if(S.M.car)S.M.car.keep=0;S.M=null;S.cash+=m.r;S.mis++;save();sfx.play('win');C.pop('MISSION RÉUSSIE · +'+m.r+' $',GRN,'38px');
    if(S.mis>=MIS.length){C.win();S.banner={t:9,s:'Les 8 missions sont faites ! La ville est à toi : continue à te balader.'}}
    else S.banner={t:5,s:'Prochaine mission : '+MIS[S.mis].n+'. Suis la flèche jaune.'}}
  function misStep(dt){var P=S.P;S.obj='';S.tgt=null;
    if(S.mode==='chaos'){S.obj='Tiens le plus longtemps possible !';return}
    if(S.mode==='libre'){S.obj=stars()?'Sème la police (ou Peinture Minute, 100 $)':'Balade libre';if(stars())S.tgt=SPEC.paint.c;return}
    if(!S.M){if(S.mis>=MIS.length){S.obj='Ville libre : toutes les missions sont faites';return}
      var m=MIS[S.mis],sp=SP(m.s[0],m.s[1],m.s[2]);S.tgt=sp;S.obj='Mission '+(S.mis+1)+'/8 : va au point « ! »';
      if(dist(P,sp)<38)misStart();return}
    var M=S.M,mm=M.m;
    if(M.car&&(M.car.hp<35||M.car.wreck)){misFail('La voiture dorée est trop abîmée.');return}
    if(mm.time&&M.ph==='route'){M.t-=dt;if(M.t<=0){misFail('Temps écoulé.');return}}
    if(M.ph==='route'){var pt=mm.pts[M.i],pos=ptPos(pt),need=mm.car,ok=!need||(P.car&&(need<2||P.car===M.car));
      if(need===2&&P.car!==M.car){S.tgt=M.car;S.obj='Vole la voiture dorée'}
      else if(need&&!P.car){S.tgt=pos;S.obj='Vole une voiture ('+(TOUCH?'VOITURE':'E')+')'}
      else{S.tgt=pos;S.obj=pt.o||('Passe le point '+(M.i+1)+' / '+mm.pts.length)}
      if(ok&&dist(P,pos)<(pt.n?62:54)){M.i++;sfx.play('pickup');S.C.pop(pt.l||((M.i)+' / '+mm.pts.length),YEL,'40px');
        if(M.i>=mm.pts.length){if(mm.lose&&stars()>0){M.ph='lose'}else{misWin();return}}}}
    if(M.ph==='lose'){S.obj='Sème la police : plus aucune étoile';S.tgt=SPEC.paint.c;if(stars()===0)misWin()}}

  /* ---------- boucle ---------- */
  var KU=['KeyW','ArrowUp'],KD=['KeyS','ArrowDown'],KL=['KeyA','ArrowLeft'],KR=['KeyD','ArrowRight'];
  function K(C,a){return !!(C.keys[a[0]]||C.keys[a[1]])}
  function step(C,dt){if(!S||S.over)return;var P=S.P,i,c;S.t+=dt;S.crT-=dt;
    var mx=(K(C,KR)?1:0)-(K(C,KL)?1:0),my=(K(C,KD)?1:0)-(K(C,KU)?1:0);
    /* joueur */
    if(P.car){c=P.car;var th,st,hb=!!C.keys.Space;
      if(TOUCH){if(mx||my){var diff=wrap(Math.atan2(my,mx)-c.a);th=Math.abs(diff)<1.3?1:.45;st=cl(diff*2.6,-1,1)}else{th=0;st=0}
        if(c.rev>0){c.rev-=dt;th=-1;st=-st}else if(c.stuck>.35&&(mx||my)){c.stuck=0;c.rev=.8}}
      else{th=-my;st=mx}
      carStep(c,th,st,hb,dt);P.x=c.x;P.y=c.y;P.a=c.a}
    else{if(mx||my){var l=Math.hypot(mx,my);P.a=Math.atan2(my,mx);P.wt+=dt;moveCirc(P,mx/l*150*dt,my/l*150*dt,8)}}
    P.pt=Math.max(0,P.pt-dt);P.hurtT+=dt;if(P.hurtT>6&&P.hp<100)P.hp=Math.min(100,P.hp+5*dt);
    /* autres voitures */
    var sN=stars();
    for(i=0;i<S.cars.length;i++){c=S.cars[i];if(c===P.car)continue;
      if(c.drv==='ai'){if(c.type==='pol'&&sN>0&&dist(c,P)<800&&!c.wreck)c.drv='cop';else{aiDrive(c,dt);continue}}
      if(c.drv==='cop'){if(sN===0){c.drv='ai';c.siren=false;initLane(c);aiDrive(c,dt)}else copDrive(c,dt);continue}
      carStep(c,0,0,false,dt)}
    S.cars.forEach(function(c){if(c.burn>0){c.burn-=dt;if(Math.random()<dt*30)S.fx.push({x:c.x+rnd(-8,8),y:c.y+rnd(-8,8),vx:rnd(-20,20),vy:rnd(-40,-10),t:.6,t0:.6,r:rnd(5,9),col:pick(['#ff7a1a','#f3c623','#e2361b'])});if(c.burn<=0)explode(c)}
      else if(!c.wreck&&c.hp<40&&Math.random()<dt*(c.hp<20?14:6))S.fx.push({x:c.x+Math.cos(c.a)*c.L*.35,y:c.y+Math.sin(c.a)*c.L*.35,vx:rnd(-15,15),vy:rnd(-30,-10),t:1,t0:1,r:rnd(5,10),col:'rgba(60,60,60,.5)'})});
    collideCars(dt);
    /* passants et voitures */
    for(i=0;i<S.peds.length;i++){var p=S.peds[i];pedStep(p,dt);
      for(var j=0;j<S.cars.length;j++){c=S.cars[j];if(Math.abs(c.x-p.x)>40||Math.abs(c.y-p.y)>40)continue;var co=Math.cos(c.a),si=Math.sin(c.a),dx=p.x-c.x,dy=p.y-c.y,lx=dx*co+dy*si,ly=-dx*si+dy*co;
        if(Math.abs(lx)<c.L/2+5&&Math.abs(ly)<c.W/2+5){var sp=Math.hypot(c.vx,c.vy);if(sp>70&&p.ko<=0){knock(p,c.vx*.7,c.vy*.7,c===P.car?'player':null)}else{var pl=Math.hypot(dx,dy)||1;p.x+=dx/pl*2;p.y+=dy/pl*2}}}}
    if(!P.car){for(j=0;j<S.cars.length;j++){c=S.cars[j];if(Math.abs(c.x-P.x)>40||Math.abs(c.y-P.y)>40)continue;var co2=Math.cos(c.a),si2=Math.sin(c.a),dx2=P.x-c.x,dy2=P.y-c.y,lx2=dx2*co2+dy2*si2,ly2=-dx2*si2+dy2*co2;
      if(Math.abs(lx2)<c.L/2+7&&Math.abs(ly2)<c.W/2+7){var sp2=Math.hypot(c.vx,c.vy),pl2=Math.hypot(dx2,dy2)||1;
        if(sp2>80&&P.hurtT>.7){P.hp-=sp2/9;P.hurtT=0;sfx.play('hurt');C.shake(6);moveCirc(P,c.vx*.12,c.vy*.12,8)}else moveCirc(P,dx2/pl2*3,dy2/pl2*3,8)}}}
    /* police */
    if(S.mode==='chaos')S.heat=S.t<5?0:Math.min(5,3+(S.t-5)/45);
    sN=stars();var want=[0,1,2,3,5,6][sN],nCop=0;S.cars.forEach(function(c){if(c.drv==='cop')nCop++});
    S.polT-=dt;if(nCop<want&&S.polT<=0){S.polT=sN>=4?.9:1.6;var pc=spawnTraffic(620,980,'pol');if(pc)pc.drv='cop'}
    S.flowT-=dt;if(sN>0&&S.flowT<=0){S.flowT=.5;flow()}
    if(sN>=4){if(!S.heli||S.heli.leave)S.heli={x:P.x+500,y:P.y-420,a:0,leave:0};}
    if(S.heli){var h=S.heli,hx=h.leave?h.x+(h.x-P.x):P.x+Math.cos(S.t*.7)*60,hy=h.leave?h.y+(h.y-P.y):P.y+Math.sin(S.t*.7)*60,hd=Math.hypot(hx-h.x,hy-h.y)||1,hs=Math.min(hd,(h.leave?260:230)*dt);
      h.x+=(hx-h.x)/hd*hs;h.y+=(hy-h.y)/hd*hs;h.a+=dt*30;if(h.leave&&dist(h,P)>1100)S.heli=null}
    S.seen=sN>0&&copNear(420);
    if(sN>0&&S.mode!=='chaos'){if(S.seen)S.lostT=0;else{S.lostT+=dt;if(S.lostT>3+sN*2.2){S.heat=sN-1;S.lostT=0;sfx.play('tick');if(S.heat<=0){calmDown();C.pop('POLICE SEMÉE',GRN,'40px')}}}}
    /* arrestation */
    var catching=false;
    if(sN>0){if(P.car){if(Math.abs(fwd(P.car))<35)S.cars.forEach(function(c){if(c.drv==='cop'&&dist(c,P)<64)catching=true});S.peds.forEach(function(p){if(p.cop&&!p.calm&&p.ko<=0&&dist(p,P)<34)catching=true})}
      else S.peds.forEach(function(p){if(p.cop&&!p.calm&&p.ko<=0&&dist(p,P)<20)catching=true})}
    P.bust=catching?P.bust+dt/(P.car?1.8:.9):Math.max(0,P.bust-dt);
    if(P.bust>=1){knockout('bust');return}
    if(P.hp<=0){knockout('dead');return}
    /* Peinture Minute */
    var lot=SPEC.paint.lot,inLot=P.car&&P.x>lot.x&&P.x<lot.x+lot.w&&P.y>lot.y&&P.y<lot.y+lot.h;
    if(inLot&&!S.paintIn){S.paintIn=true;if(S.mode==='chaos')C.pop('PAS EN MODE CHAOS',CR,'28px');
      else if(sN>0||P.car.hp<100){if(S.cash>=100){S.cash-=100;save();calmDown();P.car.hp=100;P.car.col=pick(TYPES[P.car.type].cols.concat(['#7b3fd1','#1f8f7a','#c93f8a']));P.car.alarm=0;sfx.play('pickup');C.pop('REPEINTE ! −100 $',BLU,'40px')}
        else C.pop('IL FAUT 100 $',RED,'32px')}}
    if(!inLot)S.paintIn=false;
    /* objets */
    for(i=S.items.length-1;i>=0;i--){var it=S.items[i];it.t-=dt;if(it.t<=0){S.items.splice(i,1);continue}
      if(dist(it,P)<(P.car?30:20)){S.items.splice(i,1);if(it.k==='$'){S.cash+=it.v;sfx.play('eat');if(S.mode!=='chaos'&&Math.random()<.3)save()}else{P.hp=Math.min(100,P.hp+40);sfx.play('pickup')}}}
    if(S.items.length<7&&Math.random()<dt*.6){var s2=spawnSpot(260,800,function(t){return t===WALK||t===PLAZA||t===GRASS});if(s2)S.items.push({x:s2.x,y:s2.y,k:Math.random()<.2?'hp':'$',v:10+(Math.random()*30|0),t:60})}
    /* apparitions et disparitions autour du joueur */
    S.cars=S.cars.filter(function(c){return c===P.car||c.keep||(S.M&&S.M.car===c)||dist(c,P)<1500||(c.drv==='cop'&&dist(c,P)<2200)});
    S.peds=S.peds.filter(function(p){return dist(p,P)<(p.cop&&!p.calm?900:1300)});
    var nTraf=0;S.cars.forEach(function(c){if(c.drv==='ai')nTraf++});if(nTraf<17&&Math.random()<dt*3)spawnTraffic(640,1050);
    if(S.peds.length<32&&Math.random()<dt*4){var s3=spawnSpot(560,950,function(t){return t===WALK||t===PLAZA});if(s3)S.peds.push(mkPed(s3.x,s3.y,false))}
    /* effets */
    for(i=S.fx.length-1;i>=0;i--){var f=S.fx[i];f.t-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.96;f.vy*=.96;if(f.t<=0)S.fx.splice(i,1)}
    if(S.banner){S.banner.t-=dt;if(S.banner.t<=0)S.banner=null}
    misStep(dt);
    /* caméra */
    var tx=P.x+(P.car?P.car.vx*.35:0),ty=P.y+(P.car?P.car.vy*.35:0),spd=P.car?Math.hypot(P.car.vx,P.car.vy):0,zt=(TOUCH?1.45:1)*(1-Math.min(.22,spd/1400));
    S.cam.x+=(tx-S.cam.x)*Math.min(1,dt*4);S.cam.y+=(ty-S.cam.y)*Math.min(1,dt*4);S.cam.z+=(zt-S.cam.z)*Math.min(1,dt*1.5);
    S.cam.x=cl(S.cam.x,W/2/S.cam.z,PX-W/2/S.cam.z);S.cam.y=cl(S.cam.y,H/2/S.cam.z,PX-H/2/S.cam.z)}
  function collideCars(){var A=S.cars,P=S.P;
    for(var i=0;i<A.length;i++)for(var j=i+1;j<A.length;j++){var a=A[i],b=A[j];if(Math.abs(a.x-b.x)>64||Math.abs(a.y-b.y)>64)continue;
      var ca=[Math.cos(a.a)*a.L/4,Math.sin(a.a)*a.L/4],cb=[Math.cos(b.a)*b.L/4,Math.sin(b.a)*b.L/4],ra=a.W/2+1,rb=b.W/2+1,best=null,bo=0;
      for(var u=-1;u<=1;u+=2)for(var v=-1;v<=1;v+=2){var ax=a.x+ca[0]*u,ay=a.y+ca[1]*u,bx=b.x+cb[0]*v,by=b.y+cb[1]*v,d=Math.hypot(bx-ax,by-ay),o=ra+rb-d;if(o>bo){bo=o;best=[(bx-ax)/(d||1),(by-ay)/(d||1)]}}
      if(!best)continue;var nx=best[0],ny=best[1],ma=a.wreck?4:a.m,mb=b.wreck?4:b.m,sm=ma+mb;
      a.x-=nx*bo*mb/sm;a.y-=ny*bo*mb/sm;b.x+=nx*bo*ma/sm;b.y+=ny*bo*ma/sm;
      var vr=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(vr>=0)continue;var J=-(1.3)*vr/(1/ma+1/mb);
      a.vx-=nx*J/ma;a.vy-=ny*J/ma;b.vx+=nx*J/mb;b.vy+=ny*J/mb;var imp=-vr;
      if(imp>70){hurtCar(a,(imp-55)/12);hurtCar(b,(imp-55)/12);sparks((a.x+b.x)/2,(a.y+b.y)/2,imp>150?10:4);if(a.drv==='ai')a.daze=1;if(b.drv==='ai')b.daze=1}
      if(a===P.car||b===P.car){var o2=a===P.car?b:a;if(imp>90&&S.crT<=0){S.crT=.3;sfx.play('crash');S.C.shake(Math.min(10,imp/35))}
        if(imp>70&&o2.type==='pol'&&o2.drv!=='player')crime(.5,1)}}}

  /* ---------- dessin ---------- */
  function rr(g,x,y,w,h,r){ag.rr(g,x,y,w,h,r)}
  function star(g,x,y,r,fillc,line){g.beginPath();for(var i=0;i<10;i++){var a=-PI/2+i*PI/5,rad=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad)}g.closePath();if(fillc){g.fillStyle=fillc;g.fill()}if(line){g.strokeStyle=line;g.lineWidth=2;g.stroke()}}
  function drawCar(g,c){var L=c.L,w=c.W,t=S.t;g.save();g.translate(c.x,c.y);g.rotate(c.a);
    g.fillStyle='rgba(0,0,0,.33)';rr(g,-L/2+3,-w/2+4,L,w,6);g.fill();
    var body=c.wreck?'#2a2725':c.col;g.fillStyle=body;rr(g,-L/2,-w/2,L,w,c.type==='van'?4:7);g.fill();
    g.fillStyle='rgba(0,0,0,.18)';g.fillRect(-L/2+2,w/2-4,L-4,3);
    if(c.type==='pol'&&!c.wreck){g.fillStyle='#141a2e';g.fillRect(L*.22,-w/2+1,L*.26,w-2);g.fillRect(-L/2+1,-w/2+1,L*.14,w-2)}
    if(c.type==='sport'||c.type==='lux'){g.fillStyle='rgba(255,255,255,.35)';g.fillRect(-L/2+2,-2.5,L-4,5)}
    var glass='#1d2733',van=c.type==='van';
    g.fillStyle=glass;if(van){g.fillRect(L*.26,-w/2+3,L*.1,w-6)}else{g.fillRect(L*.06,-w/2+3,L*.17,w-6);g.fillRect(-L*.34,-w/2+3,L*.1,w-6)}
    g.fillStyle=c.wreck?'#1d1b1a':shade(c.col.charAt(0)==='#'?c.col:'#888888',.12);if(van)g.fillRect(-L/2+3,-w/2+3,L*.74,w-6);else g.fillRect(-L*.24,-w/2+3,L*.3,w-6);
    if(c.type==='taxi'){g.fillStyle=INK;g.fillRect(-L*.12,-4,8,8);g.fillStyle='#fff';g.fillRect(-L*.12,-4,4,4);g.fillRect(-L*.12+4,0,4,4)}
    if(c.type==='pol'&&!c.wreck){var on=c.siren&&((t*8|0)%2);g.fillStyle=c.siren?(on?'#ff3030':'#5a1010'):'#7a2020';g.fillRect(-L*.1,-w/2+3,6,w/2-3);g.fillStyle=c.siren?(on?'#2a40a0':'#30a0ff'):'#203a7a';g.fillRect(-L*.1,0,6,w/2-3);
      if(c.siren){g.globalAlpha=.25;g.fillStyle=on?'#ff3030':'#30a0ff';g.beginPath();g.arc(-L*.1+3,0,26,0,7);g.fill();g.globalAlpha=1}}
    if(!c.wreck){g.fillStyle='#fff6c8';g.fillRect(L/2-3,-w/2+2,3,4);g.fillRect(L/2-3,w/2-6,3,4);g.fillStyle=fwd(c)<-5||(c===S.P.car&&S.C.keys.Space)?'#ff3a3a':'#a01818';g.fillRect(-L/2,-w/2+2,2.5,4);g.fillRect(-L/2,w/2-6,2.5,4)}
    if(c.hp<50&&!c.wreck){g.fillStyle='rgba(0,0,0,'+((50-c.hp)/120)+')';rr(g,-L/2,-w/2,L,w,6);g.fill()}
    g.restore()}
  function drawPed(g,p,me){g.save();g.translate(p.x,p.y);
    if(p.ko>0){g.rotate(p.a);g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(2,3,14,7,0,0,7);g.fill();
      g.fillStyle='#2b2b33';g.fillRect(-15,-4,7,3);g.fillRect(-15,1,7,3);g.fillStyle=p.shirt;g.beginPath();g.ellipse(-2,0,9,6.5,0,0,7);g.fill();
      g.fillStyle=p.skin;g.beginPath();g.arc(10,0,5,0,7);g.fill();g.fillStyle=p.cop?'#24356e':p.hair;g.beginPath();g.arc(11.5,0,4,0,7);g.fill();
      g.rotate(-p.a);g.fillStyle=YEL;for(var i=0;i<3;i++){var a=S.t*4+i*2.1;g.fillRect(Math.cos(a)*9-1.5,-12+Math.sin(a)*3-1.5,3,3)}g.restore();return}
    g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(2,3,9,0,7);g.fill();
    g.rotate(p.a);var sw=Math.sin(p.wt*13)*4;
    g.fillStyle='#2b2b33';g.beginPath();g.ellipse(sw,-4,3.5,2.6,0,0,7);g.fill();g.beginPath();g.ellipse(-sw,4,3.5,2.6,0,0,7);g.fill();
    if(me){g.strokeStyle=CR;g.lineWidth=2;g.beginPath();g.ellipse(0,0,6.5,10,0,0,7);g.stroke()}
    g.fillStyle=p.shirt;g.beginPath();g.ellipse(0,0,6,9.5,0,0,7);g.fill();
    g.fillStyle=p.skin;var pt=me&&S.P.pt>0;g.beginPath();g.arc(pt?13:-sw*.6,pt?5:9,2.8,0,7);g.fill();g.beginPath();g.arc(sw*.6,-9,2.8,0,7);g.fill();
    g.beginPath();g.arc(1,0,5.2,0,7);g.fill();
    if(p.cop){g.fillStyle='#1a2550';g.beginPath();g.arc(0,0,5.6,0,7);g.fill();g.fillRect(3,-4,4,8)}else{g.fillStyle=p.hair;g.beginPath();g.arc(-.5,0,4.6,PI*.5,PI*1.5);g.fill();g.beginPath();g.arc(-1,0,4.2,0,7);g.fill()}
    g.restore()}
  function drawB(g,b,cx,cy){var k=.1*b.h3,hx=(b.x+b.w/2-cx)*k,hy=(b.y+b.h/2-cy)*k,x=b.x,y=b.y,w=b.w,h=b.h,rx=x+hx,ry=y+hy;
    function quad(a,b2,c,d,e,f,g2,h2){g.beginPath();g.moveTo(a,b2);g.lineTo(c,d);g.lineTo(e,f);g.lineTo(g2,h2);g.closePath();g.fill()}
    g.fillStyle=b.s1;quad(x,y,x+w,y,rx+w,ry,rx,ry);quad(x,y+h,x+w,y+h,rx+w,ry+h,rx,ry+h);
    g.fillStyle=b.s2;quad(x,y,x,y+h,rx,ry+h,rx,ry);quad(x+w,y,x+w,y+h,rx+w,ry+h,rx+w,ry);
    var fl=Math.max(2,Math.round(b.h3*4));g.strokeStyle='rgba(255,240,200,.13)';g.lineWidth=2;g.beginPath();
    for(var i=1;i<fl;i++){var t=i/fl,ax=x+hx*t,ay=y+hy*t;if(hy<0){g.moveTo(ax,ay);g.lineTo(ax+w,ay)}else{g.moveTo(ax,ay+h);g.lineTo(ax+w,ay+h)}if(hx<0){g.moveTo(ax,ay);g.lineTo(ax,ay+h)}else{g.moveTo(ax+w,ay);g.lineTo(ax+w,ay+h)}}g.stroke();
    g.fillStyle=b.col;g.fillRect(rx,ry,w,h);g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=3;g.strokeRect(rx+4,ry+4,w-8,h-8);
    g.fillStyle='rgba(255,255,255,.12)';g.fillRect(rx,ry,w,3);
    for(i=0;i<b.ac.length;i++){var a=b.ac[i],ax2=rx+a[0]*w,ay2=ry+a[1]*h;g.fillStyle='rgba(0,0,0,.22)';g.fillRect(ax2+3,ay2+3,a[2]?18:12,a[2]?12:12);g.fillStyle=a[2]?'#d8d4cc':'#8a857c';g.fillRect(ax2,ay2,a[2]?18:12,a[2]?12:12)}
    if(b.label){g.save();g.font='400 22px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='rgba(0,0,0,.35)';g.fillText(b.label,rx+w/2+2,ry+h/2+2);g.fillStyle=b.col==='#e8e4da'?RED:CR;g.fillText(b.label,rx+w/2,ry+h/2);
      if(b.col==='#e8e4da'){g.fillStyle=RED;g.fillRect(rx+w/2-7,ry+h/2-62,14,40);g.fillRect(rx+w/2-20,ry+h/2-49,40,14)}g.restore()}}
  function groundCol(t){return t===ROAD?'#3b3b41':t===WALK?'#9a948a':t===GRASS?'#4f8f3a':t===TREE?'#4a8636':t===PLAZA?'#b7ab95':t===LOT?'#47474e':'#3f8fd0'}
  function draw(C){var g=C.g;if(!S)fresh(C);var z=S.cam.z,cx=S.cam.x,cy=S.cam.y,P=S.P,i,x,y,t=S.t;
    g.setTransform(1,0,0,1,0,0);g.fillStyle='#24231f';g.fillRect(0,0,W,H);
    g.setTransform(z,0,0,z,W/2-cx*z,H/2-cy*z);
    var vx0=cx-W/2/z,vy0=cy-H/2/z,vx1=cx+W/2/z,vy1=cy+H/2/z,x0=Math.max(0,Math.floor(vx0/T)),x1=Math.min(N-1,Math.floor(vx1/T)),y0=Math.max(0,Math.floor(vy0/T)),y1=Math.min(N-1,Math.floor(vy1/T));
    for(y=y0;y<=y1;y++)for(x=x0;x<=x1;x++){var tt=MAP[y*N+x],X=x*T,Y=y*T;g.fillStyle=groundCol(tt);g.fillRect(X,Y,T+.5,T+.5);
      if(tt===WALK||tt===PLAZA){g.fillStyle='rgba(0,0,0,.07)';g.fillRect(X,Y+T-2,T,2);g.fillRect(X+T-2,Y,2,T);
        g.fillStyle='#c4beb2';if(tile(x-1,y)===ROAD)g.fillRect(X,Y,3,T);if(tile(x+1,y)===ROAD)g.fillRect(X+T-3,Y,3,T);if(tile(x,y-1)===ROAD)g.fillRect(X,Y,T,3);if(tile(x,y+1)===ROAD)g.fillRect(X,Y+T-3,T,3)}
      else if(tt===GRASS||tt===TREE){var hsh=(x*73+y*37)%7;g.fillStyle='rgba(0,0,0,.08)';g.fillRect(X+hsh*5,Y+(hsh*11)%T,6,4);g.fillRect(X+(hsh*13)%T,Y+hsh*6,4,6)}
      else if(tt===LOT){g.fillStyle='rgba(255,255,255,.35)';if(x%2===0)g.fillRect(X+2,Y+4,2,T-8)}}
    /* marquages : pointillés au milieu et passages piétons */
    g.strokeStyle='rgba(243,198,35,.75)';g.lineWidth=2.5;g.setLineDash([16,14]);g.beginPath();
    for(var k=0;k<9;k++){var ly=(k*10+1)*T;if(ly>vy0-10&&ly<vy1+10)for(var s=0;s<8;s++){var a0=(s*10+2)*T,a1=(s*10+10)*T;if(a1<vx0||a0>vx1)continue;g.moveTo(a0+8,ly);g.lineTo(a1-8,ly)}
      var lx=(k*10+1)*T;if(lx>vx0-10&&lx<vx1+10)for(s=0;s<8;s++){a0=(s*10+2)*T;a1=(s*10+10)*T;if(a1<vy0||a0>vy1)continue;g.moveTo(lx,a0+8);g.lineTo(lx,a1-8)}}
    g.stroke();g.setLineDash([]);
    g.fillStyle='rgba(241,236,226,.55)';
    for(var ix=0;ix<9;ix++)for(var iy=0;iy<9;iy++){var n=NC(ix,iy);if(n.x<vx0-140||n.x>vx1+140||n.y<vy0-140||n.y>vy1+140)continue;
      for(var q=0;q<6;q++){var o=-T+8+q*14;if(ix<8)g.fillRect(n.x+T+4,n.y+o,12,8);if(ix>0)g.fillRect(n.x-T-16,n.y+o,12,8);if(iy<8)g.fillRect(n.x+o,n.y+T+4,8,12);if(iy>0)g.fillRect(n.x+o,n.y-T-16,8,12)}}
    FOUNTS.forEach(function(f){if(f.x<vx0-80||f.x>vx1+80||f.y<vy0-80||f.y>vy1+80)return;g.fillStyle='#d8cfbd';g.beginPath();g.arc(f.x,f.y,T*1.05,0,7);g.fill();g.fillStyle='#3f8fd0';g.beginPath();g.arc(f.x,f.y,T*.85,0,7);g.fill();
      g.fillStyle='rgba(255,255,255,.5)';for(var i=0;i<6;i++){var a=t*1.5+i;g.beginPath();g.arc(f.x+Math.cos(a)*18,f.y+Math.sin(a)*18,3,0,7);g.fill()}g.fillStyle='#d8cfbd';g.beginPath();g.arc(f.x,f.y,8,0,7);g.fill()});
    /* Peinture Minute : bande bleue au sol */
    var lot=SPEC.paint.lot;if(lot.x<vx1&&lot.x+lot.w>vx0&&lot.y<vy1&&lot.y+lot.h>vy0){g.fillStyle='rgba(63,169,255,'+(.18+.1*Math.sin(t*4))+')';g.fillRect(lot.x,lot.y,lot.w,lot.h);ag.txt(g,'100 $ · EFFACE LES ÉTOILES',lot.x+lot.w/2,lot.y+lot.h/2,18,CR)}
    var gl=SPEC.gar.lot;if(gl.x<vx1&&gl.x+gl.w>vx0&&gl.y<vy1&&gl.y+gl.h>vy0){g.strokeStyle='rgba(243,198,35,.5)';g.lineWidth=3;g.setLineDash([10,8]);g.strokeRect(gl.x+6,gl.y+6,gl.w-12,gl.h-12);g.setLineDash([])}
    /* objets */
    S.items.forEach(function(it){if(it.x<vx0-20||it.x>vx1+20||it.y<vy0-20||it.y>vy1+20)return;var b=Math.sin(t*5+it.x)*2;
      if(it.k==='$'){g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(it.x+2,it.y+5,9,4,0,0,7);g.fill();g.fillStyle='#3fae6a';rr(g,it.x-10,it.y-6+b,20,12,3);g.fill();ag.mono(g,'$',it.x,it.y+b+.5,10,'#e8ffe8')}
      else{g.fillStyle='#fff';g.beginPath();g.arc(it.x,it.y+b,10,0,7);g.fill();g.fillStyle=RED;g.fillRect(it.x-2.5,it.y-6+b,5,12);g.fillRect(it.x-6,it.y-2.5+b,12,5)}});
    /* marqueurs de mission */
    var tg=S.tgt;if(tg&&!tg.L){var pr=24+Math.sin(t*5)*4;g.strokeStyle=YEL;g.lineWidth=4;g.beginPath();g.arc(tg.x,tg.y,pr,0,7);g.stroke();g.fillStyle='rgba(243,198,35,.22)';g.beginPath();g.arc(tg.x,tg.y,pr,0,7);g.fill();
      if(S.M&&S.M.ph==='route'&&S.M.m.pts&&S.M.m.pts[S.M.i]&&S.M.m.pts[S.M.i].pax){drawPed(g,{x:tg.x,y:tg.y,a:t,wt:0,shirt:'#f3c623',hair:'#2a1d14',skin:'#d9a577',ko:0},false)}
      if(!S.M&&S.mode==='histoire'){g.fillStyle=YEL;g.beginPath();g.arc(tg.x,tg.y-30+Math.sin(t*4)*4,14,0,7);g.fill();ag.txt(g,'!',tg.x,tg.y-29+Math.sin(t*4)*4,20,INK)}}
    /* passants à terre, puis debout */
    S.peds.forEach(function(p){if(p.ko>0&&p.x>vx0-20&&p.x<vx1+20&&p.y>vy0-20&&p.y<vy1+20)drawPed(g,p,false)});
    S.peds.forEach(function(p){if(p.ko<=0&&p.x>vx0-20&&p.x<vx1+20&&p.y>vy0-20&&p.y<vy1+20)drawPed(g,p,false)});
    S.cars.forEach(function(c){if(c.x>vx0-40&&c.x<vx1+40&&c.y>vy0-40&&c.y<vy1+40)drawCar(g,c)});
    if(S.M&&S.M.car&&P.car!==S.M.car){var sc=S.M.car;g.strokeStyle=YEL;g.lineWidth=3;g.beginPath();g.arc(sc.x,sc.y,34+Math.sin(t*6)*4,0,7);g.stroke()}
    if(!P.car){drawPed(g,{x:P.x,y:P.y,a:P.a,wt:P.wt,shirt:RED,hair:'#1a1a1a',skin:'#d9a577',ko:0},true);
      var nc=nearCar();if(nc&&!nc.burn){var lb=TOUCH?'VOITURE':'E';g.fillStyle='rgba(20,18,16,.8)';rr(g,nc.x-(TOUCH?34:12),nc.y-40,TOUCH?68:24,22,6);g.fill();ag.mono(g,lb,nc.x,nc.y-29,TOUCH?12:14,YEL)}}
    S.fx.forEach(function(f){g.globalAlpha=Math.max(0,f.t/f.t0);g.fillStyle=f.col;g.beginPath();g.arc(f.x,f.y,f.r*(f.col.charAt(0)==='r'?(2-f.t/f.t0):1),0,7);g.fill()});g.globalAlpha=1;
    /* immeubles en relief, puis arbres */
    for(i=0;i<BLDS.length;i++){var b=BLDS[i];if(b.x>vx1+140||b.x+b.w<vx0-140||b.y>vy1+140||b.y+b.h<vy0-140)continue;drawB(g,b,cx,cy)}
    TREES.forEach(function(tr){if(tr.x<vx0-60||tr.x>vx1+60||tr.y<vy0-60||tr.y>vy1+60)return;var ox=(tr.x-cx)*.04,oy=(tr.y-cy)*.04;
      g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(tr.x+5,tr.y+6,tr.r,0,7);g.fill();g.fillStyle='#2f6a2a';g.beginPath();g.arc(tr.x+ox,tr.y+oy,tr.r,0,7);g.fill();
      g.fillStyle='#4f9a3f';g.beginPath();g.arc(tr.x+ox-tr.r*.25,tr.y+oy-tr.r*.25,tr.r*.6,0,7);g.fill()});
    if(S.heli){var h=S.heli;g.fillStyle='rgba(255,255,230,.12)';g.beginPath();g.arc(P.x,P.y,70,0,7);g.fill();
      g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(h.x+40,h.y+60,26,13,0,0,7);g.fill();
      g.save();g.translate(h.x,h.y);var ha=Math.atan2(P.y-h.y,P.x-h.x);g.rotate(ha);g.fillStyle='#24356e';g.beginPath();g.ellipse(0,0,24,13,0,0,7);g.fill();g.fillRect(-48,-3,30,6);g.fillRect(-50,-9,6,18);
      g.fillStyle='#9fd0ff';g.beginPath();g.ellipse(12,0,9,8,0,0,7);g.fill();g.rotate(h.a);g.fillStyle='rgba(20,20,20,.55)';g.fillRect(-42,-2.5,84,5);g.fillRect(-2.5,-42,5,84);g.restore()}
    g.setTransform(1,0,0,1,0,0);
    hud(g,C)}
  function hud(g,C){var P=S.P,t=S.t,sN=stars(),i,U=TOUCH?1.5:1;
    /* argent, vie, étoiles (plus gros sur téléphone) */
    g.save();g.scale(U,U);
    g.fillStyle='rgba(20,18,16,.72)';rr(g,12,12,236,P.car?104:88,12);g.fill();
    ag.txt(g,(S.mode==='chaos'?Math.floor(S.t)+' s':S.cash.toLocaleString('fr-FR')+' $'),24,36,28,S.mode==='chaos'?CR:GRN,'left');
    g.fillStyle='#3a3632';rr(g,24,56,140,8,4);g.fill();g.fillStyle=P.hp>35?RED:(t*6|0)%2?RED:'#ff9a8a';rr(g,24,56,140*Math.max(0,P.hp)/100,8,4);g.fill();ag.mono(g,'♥',176,60,12,RED,'left');
    if(P.car){g.fillStyle='#3a3632';rr(g,24,70,140,6,3);g.fill();g.fillStyle=P.car.hp>40?BLU:'#ff7a1a';rr(g,24,70,140*Math.max(0,P.car.hp)/100,6,3);g.fill();ag.mono(g,'VOIT.',176,73,10,BLU,'left')}
    var blink=sN>0&&!S.seen&&S.mode!=='chaos'&&(t*4|0)%2;
    for(i=0;i<5;i++)star(g,34+i*26,P.car?90:76,10,i<sN?(blink?'rgba(243,198,35,.35)':YEL):'rgba(255,255,255,.06)',i<sN?null:'rgba(241,236,226,.3)');
    g.restore();
    /* mini-carte */
    var ms=TOUCH?170:150,mx=W-ms-12,my=12,span=44,ptx=P.x/T,pty=P.y/T,sc=ms/span;
    g.save();rr(g,mx,my,ms,ms,10);g.fillStyle='#1b1a18';g.fill();g.clip();g.imageSmoothingEnabled=false;
    g.drawImage(MM,(ptx-span/2+30)*2,(pty-span/2+30)*2,span*2,span*2,mx,my,ms,ms);
    function mp(wx,wy){return [mx+(wx/T-ptx+span/2)*sc,my+(wy/T-pty+span/2)*sc]}
    [['gar','G','#c9572f'],['paint','P',BLU],['pol','★','#34489a'],['hosp','+',RED]].forEach(function(s){var q=mp(SPEC[s[0]].c.x,SPEC[s[0]].c.y);g.fillStyle=s[2];g.beginPath();g.arc(q[0],q[1],6,0,7);g.fill();ag.mono(g,s[1],q[0],q[1]+.5,8,'#fff')});
    S.cars.forEach(function(c){if(c.drv!=='cop')return;var q=mp(c.x,c.y);g.fillStyle=(t*6|0)%2?'#ff3030':'#30a0ff';g.fillRect(q[0]-2.5,q[1]-2.5,5,5)});
    if(S.tgt){var q=mp(S.tgt.x,S.tgt.y);q[0]=cl(q[0],mx+6,mx+ms-6);q[1]=cl(q[1],my+6,my+ms-6);g.fillStyle=YEL;g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.arc(q[0],q[1],5+Math.sin(t*6),0,7);g.fill();g.stroke()}
    g.save();g.translate(mx+ms/2,my+ms/2);g.rotate(P.a);g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=1.5;g.beginPath();g.moveTo(7,0);g.lineTo(-5,-5);g.lineTo(-3,0);g.lineTo(-5,5);g.closePath();g.fill();g.stroke();g.restore();
    g.restore();g.strokeStyle='rgba(241,236,226,.35)';g.lineWidth=2;rr(g,mx,my,ms,ms,10);g.stroke();
    /* chrono de mission */
    if(S.M&&S.M.m.time&&S.M.ph==='route'){var tl=Math.max(0,S.M.t),lw=tl<10;g.fillStyle='rgba(20,18,16,.72)';rr(g,W/2-60,12,120,40,10);g.fill();ag.txt(g,Math.floor(tl/60)+':'+('0'+Math.floor(tl%60)).slice(-2),W/2,33,28,lw&&(t*4|0)%2?RED:CR)}
    if(S.M&&S.M.car&&P.car===S.M.car){ag.mono(g,'Voiture dorée : '+Math.round(S.M.car.hp)+' %',W/2,S.M.m.time?64:24,13,S.M.car.hp<50?RED:YEL)}
    /* flèche vers l'objectif */
    if(S.tgt){var z=S.cam.z,sx=(S.tgt.x-S.cam.x)*z+W/2,sy=(S.tgt.y-S.cam.y)*z+H/2,mg=50;
      if(sx<mg||sx>W-mg||sy<mg+40||sy>H-mg-40){var ang=Math.atan2(sy-H/2,sx-W/2),ex=W/2+Math.cos(ang)*1000,ey=H/2+Math.sin(ang)*1000,k=Math.min((W/2-mg)/Math.abs(ex-W/2||1),(H/2-mg-40)/Math.abs(ey-H/2||1));ex=W/2+(ex-W/2)*k;ey=H/2+(ey-H/2)*k;
        g.save();g.translate(ex,ey);g.rotate(ang);g.fillStyle=YEL;g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.moveTo(20,0);g.lineTo(-12,-15);g.lineTo(-5,0);g.lineTo(-12,15);g.closePath();g.stroke();g.fill();g.restore();
        ag.mono(g,Math.round(dist(S.tgt,P)/12)+' m',ex-Math.cos(ang)*30,ey-Math.sin(ang)*30,12,YEL)}}
    /* arrestation */
    if(P.bust>0){g.fillStyle='rgba(20,18,16,.8)';rr(g,W/2-130,H*.3-22,260,44,10);g.fill();g.fillStyle='#3a3632';rr(g,W/2-110,H*.3+4,220,8,4);g.fill();g.fillStyle=BLU;rr(g,W/2-110,H*.3+4,220*Math.min(1,P.bust),8,4);g.fill();ag.mono(g,'ARRESTATION… BOUGE !',W/2,H*.3-8,14,CR)}
    /* objectif et bandeau */
    g.save();g.translate(W/2,H);g.scale(U,U);var Wd=W/U,by=-16;
    if(S.banner){var lines=wrapText(g,S.banner.s,Wd-40,15);var bh=lines.length*20+18;g.globalAlpha=Math.min(1,S.banner.t*2);g.fillStyle='rgba(20,18,16,.85)';rr(g,-Wd/2+20,by-bh,Wd-40,bh,12);g.fill();
      lines.forEach(function(l,i){ag.mono(g,l,0,by-bh+19+i*20,15,CR)});g.globalAlpha=1;by-=bh+8}
    if(S.obj){g.font='700 15px "IBM Plex Mono", monospace';var ow=g.measureText(S.obj).width+40;g.fillStyle='rgba(20,18,16,.72)';rr(g,-ow/2,by-34,ow,32,10);g.fill();ag.mono(g,S.obj,0,by-18,15,YEL)}
    g.restore()}
  function wrapText(g,s,maxw,size){g.font='700 '+size+'px "IBM Plex Mono", monospace';var words=s.split(' '),lines=[],cur='';words.forEach(function(w){var tt=cur?cur+' '+w:w;if(g.measureText(tt).width>maxw-30&&cur){lines.push(cur);cur=w}else cur=tt});if(cur)lines.push(cur);return lines}

  /* ---------- branchement ---------- */
  PP._bitume=function(){return S};
  PP.arcade({id:'bitume',
    setup:function(C){fresh(C);var m=C.mode;
      C.keysText('<kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> ou flèches : marcher / conduire · <kbd>E</kbd> monter ou descendre d\'une voiture · <kbd>Espace</kbd> frapper (à pied) ou frein à main · sur téléphone : joystick, VOITURE et COUP');
      var sv=m==='histoire'&&(S.mis>0||S.cash>0);
      var msg=m==='chaos'?'La police te cherche déjà (3 étoiles, puis jusqu\'à 5). Vole une voiture et tiens le plus longtemps possible sans te faire arrêter.'
        :m==='libre'?'La ville rien que pour toi : vole des voitures, ramasse des billets, fais monter les étoiles et sème la police. Peinture Minute (P sur la carte) efface les étoiles pour 100 $.'
        :'8 missions dans la ville : livraisons, taxi, course, voiture dorée… Suis la flèche jaune. Plus tu fais de bêtises, plus la police te cherche (étoiles). Ta progression est gardée.';
      if(sv)msg+='<br><b>Partie sauvegardée : '+(S.mis>=MIS.length?'toutes les missions faites':'mission '+(S.mis+1)+' / 8')+', '+S.cash+' $.</b><br><button type="button" class="ghost" data-bt-r0>Repartir de zéro</button>';
      C.over('Bitume',msg,sv?'Continuer':'Jouer')},
    start:function(C){fresh(C)},
    key:function(C,k,d){if(!d||!C.running||!S||S.over)return;
      if(k==='KeyE'||k==='KeyF'||k==='Enter'||k==='NumpadEnter')useCar(C);else if(k==='Space'&&!S.P.car)punch(C)},
    step:function(C,dt){step(C,dt)},
    draw:function(C){draw(C)},
    close:function(){if(S&&S.mode!=='chaos')save()}
  });
})();
