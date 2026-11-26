/* Pixel Pause — Saute-Pixel : jeu de plateformes original du site. Ton perso court, saute, écrase les gluants,
   ramasse les cristaux et rejoint le portail. 3 mondes, les niveaux sont les mêmes pour tout le monde (classement juste). */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',W=960,H=540,T=40,RH=14,OY=H-RH*T,S;
  var TH=[{sky:['#8fd0f5','#d9f0ff'],hill:'#7cc95a',hill2:'#a5dd86',dirt:'#8a5a34',top:'#4fae4a',n:'Prairie'},
    {sky:['#ff9a6b','#ffd9a0'],hill:'#c9703f',hill2:'#e39a5f',dirt:'#6a3f2a',top:'#d9a441',n:'Canyon'},
    {sky:['#1c1b3a','#4a3a78'],hill:'#2c2a55',hill2:'#3d3a70',dirt:'#34304a',top:'#7a6ad0',n:'Nuit'}];
  function rng(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
  /* niveaux fabriqués à partir de morceaux (plat, trou, pics, marches, plateformes, ressort, chauve-souris, blocs) */
  function gen(lv){var R=rng(1000+lv*77),Wd=[110,135,160][lv],g=[],ents=[],i,x=0,top=11,lastCp=0,last=-1;
    for(var y=0;y<RH;y++)g.push(new Array(Wd).fill(' '));
    function ground(x0,x1,tp){for(var a=x0;a<Math.min(Wd,x1);a++)for(var b=tp;b<RH;b++)g[b][a]='#'}
    function put(r,c,ch){if(r>=0&&r<RH&&c>=0&&c<Wd)g[r][c]=ch}
    ground(0,9,top);x=9;
    while(x<Wd-16){
      if(x-lastCp>30){ground(x,x+5,top);put(top-1,x+2,'c');x+=5;lastCp=x;continue}
      var f=Math.floor(R()*8);if(f===last)f=(f+1)%8;last=f;
      if(f===0){var n=6+Math.floor(R()*4);ground(x,x+n,top);for(i=1;i<n-1;i++)if(R()<.5)put(top-2,x+i,'o');ents.push({k:'s',tx:x+n/2,ty:top});if(lv>0&&n>7)ents.push({k:'s',tx:x+2,ty:top});x+=n}
      else if(f===1){var w=2+Math.floor(R()*(lv>0?3:2));ground(x,x+2,top);x+=2;for(i=0;i<w;i++)put(top-3,x+i,'o');x+=w;ground(x,x+2,top);x+=2}
      else if(f===2){ground(x,x+8,top);var sw=2+(lv>1?1:0);for(i=0;i<sw;i++)put(top-1,x+3+i,'^');put(top-4,x+3,'o');put(top-4,x+4,'o');x+=8}
      else if(f===3){var nt=Math.max(8,Math.min(11,top+(R()<.5?-1:1)*(1+Math.floor(R()*2))));if(nt===top)nt=top>9?top-1:top+1;ground(x,x+6,nt);top=nt;if(R()<.6)ents.push({k:'s',tx:x+3,ty:top});x+=6}
      else if(f===4){ground(x,x+2,top);x+=2;var k=2+Math.floor(R()*2);for(i=0;i<k;i++){x+=2+Math.floor(R()*(lv>0?2:1));var py=top-1-Math.floor(R()*2);put(py,x,'=');put(py,x+1,'=');put(py,x+2,'=');put(py-2,x+1,'o');x+=3}x+=2;ground(x,x+3,top);x+=3}
      else if(f===5){ground(x,x+11,top);put(top-1,x+2,'S');for(i=1;i<=5;i++){put(top-i,x+5,'#');put(top-i,x+6,'#')}put(top-7,x+5,'o');put(top-7,x+6,'o');put(top-8,x+5,'o');put(top-8,x+6,'o');x+=11}
      else if(f===6){ground(x,x+9,top);ents.push({k:'b',tx:x+4.5,ty:top-2.6});for(i=2;i<7;i+=2)put(top-1,x+i,'o');if(lv>1)ents.push({k:'s',tx:x+6,ty:top});x+=9}
      else{ground(x,x+9,top);put(top-1,x+2,'#');put(top-1,x+3,'#');put(top-2,x+3,'#');put(top-1,x+4,'#');put(top-2,x+4,'#');put(top-3,x+4,'#');put(top-5,x+4,'o');put(top-1,x+5,'#');put(top-2,x+5,'#');put(top-1,x+6,'#');x+=9}
    }
    ground(x,Wd,top);put(top-1,Wd-5,'F');return {g:g,ents:ents,w:Wd,top0:11}}
  function tile(tx,ty){if(tx<0||tx>=S.L.w)return '#';if(ty<0||ty>=RH)return ' ';return S.L.g[ty][tx]}
  function load(lv){var L=gen(lv);S.L=L;S.lv=lv;S.p={x:2*T,y:(L.top0-1)*T-2,w:24,h:34,vx:0,vy:0,g:false,face:1,coy:0,jb:0,inv:0,an:0};S.cp={x:S.p.x,y:S.p.y};S.cam=0;S.lt=0;S.banner=2.2;
    S.en=L.ents.map(function(e){return e.k==='s'?{k:'s',x:e.tx*T,y:e.ty*T,vx:(e.tx*7%2?1:-1)*(55+lv*12),w:30,h:22,alive:true}:{k:'b',x:e.tx*T,x0:e.tx*T,y:e.ty*T,y0:e.ty*T,ph:e.tx,w:30,h:20,alive:true}})}
  function fresh(C){S={mode:C.mode||'run',lives:C.mode==='hard'?1:5,score:0,gems:0,time:0,over:false,fx:[],tt:0};load(0)}
  function hurt(C){var p=S.p;if(p.inv>0||S.over)return;S.lives--;sfx.play('lose');C.shake(8);if(S.lives<=0){finish(C,false);return}p.x=S.cp.x;p.y=S.cp.y;p.vx=p.vy=0;p.inv=1.6}
  function finish(C,won){if(S.over)return;S.over=true;C.stop();var nb=C.best(S.mode==='hard'?'hard':'pts',S.score);if(won){sfx.play('win');C.win()}
    setTimeout(function(){C.over(won?'Bravo, les 3 mondes !':'Perdu au monde '+(S.lv+1),'<b>'+S.score+'</b> points · '+S.gems+' cristaux · '+Math.round(S.time)+' s'+(nb&&S.score?'<br><b>Nouveau record !</b>':'<br>Record : '+(C.best(S.mode==='hard'?'hard':'pts')||0)),'Rejouer')},won?900:500)}
  function solidBox(x,y,w,h){var x0=Math.floor(x/T),x1=Math.floor((x+w-.01)/T),y0=Math.floor(y/T),y1=Math.floor((y+h-.01)/T);for(var ty=y0;ty<=y1;ty++)for(var tx=x0;tx<=x1;tx++)if(tile(tx,ty)==='#')return {tx:tx,ty:ty};return null}
  function burst(x,y,col,n){for(var i=0;i<(n||8);i++)S.fx.push({x:x,y:y,vx:(Math.random()-.5)*320,vy:-Math.random()*300,t:.5,col:col})}
  PP._saut=function(){return S};
  PP.arcade({id:'saut',
    setup:function(C){fresh(C);C.keysText('<kbd>←</kbd><kbd>→</kbd> ou <kbd>Q</kbd><kbd>D</kbd> courir · <kbd>Espace</kbd> ou <kbd>↑</kbd> sauter (reste appuyé pour sauter plus haut) · saute sur les ennemis pour les écraser');
      C.over('Saute-Pixel',(S.mode==='hard'?'Mode Expert : une seule vie pour les 3 mondes.':'3 mondes à traverser, 5 vies.')+'<br>Saute sur les gluants et les chauves-souris pour les écraser, ramasse les cristaux, utilise les ressorts jaunes et rejoins le portail. Les drapeaux sont des points de retour.','Jouer')},
    start:function(C){fresh(C)},
    key:function(C,k,d){if(!C.running||S.over)return;if(d&&(k==='Space'||k==='ArrowUp'||k==='KeyW'))S.p.jb=.13},
    step:function(C,dt){if(S.over)return;var k=C.keys,p=S.p,L=S.L,i;S.time+=dt;S.lt+=dt;S.tt+=dt;S.banner=Math.max(0,S.banner-dt);p.inv=Math.max(0,p.inv-dt);
      var dir=((k.ArrowRight||k.KeyD)?1:0)-((k.ArrowLeft||k.KeyA)?1:0),hold=k.Space||k.ArrowUp||k.KeyW;
      if(dir){p.vx+=dir*(p.g?2600:1700)*dt;p.face=dir}else{var fr=(p.g?2400:500)*dt;p.vx=Math.abs(p.vx)<=fr?0:p.vx-Math.sign(p.vx)*fr}
      p.vx=Math.max(-300,Math.min(300,p.vx));
      p.coy=p.g?.1:Math.max(0,p.coy-dt);p.jb=Math.max(0,p.jb-dt);
      if(p.jb>0&&p.coy>0){p.vy=-780;p.jb=0;p.coy=0;p.g=false;sfx.play('ui')}
      if(!hold&&p.vy<-280&&!p.spr)p.vy=-280;if(p.vy>=0)p.spr=false;
      p.vy=Math.min(1100,p.vy+2300*dt);
      /* déplacement horizontal puis vertical, avec les blocs */
      p.x+=p.vx*dt;var b=solidBox(p.x,p.y,p.w,p.h);if(b){if(p.vx>0)p.x=b.tx*T-p.w;else p.x=(b.tx+1)*T;p.vx=0}
      var py0=p.y;p.y+=p.vy*dt;p.g=false;b=solidBox(p.x,p.y,p.w,p.h);
      if(b){if(p.vy>0){p.y=b.ty*T-p.h;p.g=true}else p.y=(b.ty+1)*T;p.vy=0}
      else if(p.vy>0){/* plateformes fines : on passe à travers par-dessous */var fy=Math.floor((p.y+p.h)/T),x0=Math.floor(p.x/T),x1=Math.floor((p.x+p.w-.01)/T);for(i=x0;i<=x1;i++)if(tile(i,fy)==='='&&py0+p.h<=fy*T+2){p.y=fy*T-p.h;p.vy=0;p.g=true;break}}
      if(p.g&&Math.abs(p.vx)>20)p.an+=Math.abs(p.vx)*dt*.05;
      /* cases spéciales touchées */
      var tx0=Math.floor((p.x+3)/T),tx1=Math.floor((p.x+p.w-3)/T),ty0=Math.floor((p.y+3)/T),ty1=Math.floor((p.y+p.h-1)/T);
      for(var ty=ty0;ty<=ty1;ty++)for(var tx=tx0;tx<=tx1;tx++){var c=tile(tx,ty);
        if(c==='o'){L.g[ty][tx]=' ';S.gems++;S.score+=10;sfx.play('pickup');burst(tx*T+20,ty*T+20,'#6fe3ff',5)}
        else if(c==='^'){if(p.y+p.h>ty*T+14)hurt(C)}
        else if(c==='S'){if(p.vy>=0&&p.y+p.h>ty*T+16){p.vy=-1180;p.spr=true;p.g=false;sfx.play('go');S.sprT=.25;S.sprX=tx;S.sprY=ty}}
        else if(c==='c'){if(S.cp.tx!==tx){S.cp={x:tx*T+8,y:ty*T+T-p.h-1,tx:tx};sfx.play('tick');C.pop('POINT DE RETOUR',YEL,'26px')}}
        else if(c==='F'){var bonus=Math.max(0,Math.round((90-S.lt)*5));S.score+=200+bonus;sfx.play('win');burst(p.x,p.y,YEL,20);if(S.lv>=2){finish(C,true);return}C.pop('MONDE '+(S.lv+2),YEL,'54px');load(S.lv+1);return}}
      if(p.y>RH*T+80){hurt(C);if(S.over)return}
      if(p.x<0){p.x=0;p.vx=0}
      /* ennemis */
      S.en.forEach(function(e){if(!e.alive)return;
        if(e.k==='s'){e.x+=e.vx*dt;var ex=Math.floor((e.x+(e.vx>0?e.w/2:-e.w/2))/T),ey=Math.floor((e.y-4)/T);if(tile(ex,ey)==='#'||tile(ex,ey)==='^'||tile(ex,ey+1)!=='#')e.vx=-e.vx}
        else{e.ph+=dt;e.x=e.x0+Math.sin(e.ph*1.3)*90;e.y=e.y0+Math.sin(e.ph*3.1)*14}
        var ex0=e.x-e.w/2,ey0=e.y-e.h;if(p.x<ex0+e.w&&p.x+p.w>ex0&&p.y<e.y&&p.y+p.h>ey0){
          if(p.vy>80&&p.y+p.h-p.vy*dt<=ey0+12){e.alive=false;p.vy=hold?-680:-460;p.spr=true;S.score+=50;sfx.play('hit');burst(e.x,e.y-10,e.k==='s'?'#6fd66a':'#b48cff',10);C.pop('+50',CR,'24px')}
          else hurt(C)}});
      S.fx=S.fx.filter(function(f){f.t-=dt;f.vy+=900*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;return f.t>0});S.sprT=Math.max(0,(S.sprT||0)-dt);
      var tc=p.x+p.w/2-W*.4+p.face*60;S.cam+=(Math.max(0,Math.min(L.w*T-W,tc))-S.cam)*Math.min(1,dt*5);
      C.hud('<span>Monde <b>'+(S.lv+1)+' / 3</b></span><span>Vies <b>'+S.lives+'</b></span><span>Cristaux <b>'+S.gems+'</b></span><span>Points <b>'+S.score+'</b></span>')},
    draw:function(C){var g=C.g;if(!S)fresh(C);var th=TH[S.lv],L=S.L,cam=Math.round(S.cam),p=S.p,i;
      var sk=g.createLinearGradient(0,0,0,H);sk.addColorStop(0,th.sky[0]);sk.addColorStop(1,th.sky[1]);g.fillStyle=sk;g.fillRect(0,0,W,H);
      if(S.lv===2){g.fillStyle='rgba(255,255,255,.7)';for(i=0;i<40;i++)g.fillRect((i*197+31)%W,(i*89+17)%300,2,2);g.fillStyle='#f1ece2';g.beginPath();g.arc(780,90,34,0,7);g.fill()}
      else{g.fillStyle=S.lv?'#fff1c9':'#fffbe0';g.beginPath();g.arc(790,90,40,0,7);g.fill()}
      [[.2,th.hill2,330,60,.006],[.45,th.hill,400,45,.011]].forEach(function(h){g.fillStyle=h[1];g.beginPath();g.moveTo(0,H);for(var x=0;x<=W;x+=20){var wx=x+cam*h[0];g.lineTo(x,h[2]+Math.sin(wx*h[4])*h[3]+Math.sin(wx*h[4]*2.7)*h[3]*.3)}g.lineTo(W,H);g.fill()});
      g.save();g.translate(-cam,OY);
      var c0=Math.max(0,Math.floor(cam/T)),c1=Math.min(L.w-1,c0+25);
      for(var ty=0;ty<RH;ty++)for(var tx=c0;tx<=c1;tx++){var ch=L.g[ty][tx],x=tx*T,y=ty*T;if(ch===' ')continue;
        if(ch==='#'){g.fillStyle=th.dirt;g.fillRect(x,y,T,T);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x+6,y+22,8,6);g.fillRect(x+24,y+10,7,5);if(tile(tx,ty-1)!=='#'){g.fillStyle=th.top;g.fillRect(x,y,T,10);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x,y,T,3)}}
        else if(ch==='='){g.fillStyle='#c9a26a';g.fillRect(x,y,T,12);g.fillStyle='#8a6a3a';g.fillRect(x,y+9,T,3);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(x,y,T,3)}
        else if(ch==='^'){g.fillStyle='#d9d4c8';for(i=0;i<2;i++){g.beginPath();g.moveTo(x+i*20,y+T);g.lineTo(x+i*20+10,y+12);g.lineTo(x+i*20+20,y+T);g.fill()}g.fillStyle='rgba(0,0,0,.25)';for(i=0;i<2;i++){g.beginPath();g.moveTo(x+i*20+10,y+12);g.lineTo(x+i*20+20,y+T);g.lineTo(x+i*20+10,y+T);g.fill()}}
        else if(ch==='o'){var bo=Math.sin(S.tt*4+tx)*3,sx=Math.abs(Math.cos(S.tt*3+tx))*.6+.4;g.fillStyle='#6fe3ff';g.beginPath();g.moveTo(x+20,y+8+bo);g.lineTo(x+20+10*sx,y+20+bo);g.lineTo(x+20,y+32+bo);g.lineTo(x+20-10*sx,y+20+bo);g.fill();g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.moveTo(x+20,y+8+bo);g.lineTo(x+20+4*sx,y+20+bo);g.lineTo(x+20,y+24+bo);g.fill()}
        else if(ch==='S'){var sq=S.sprT>0&&S.sprX===tx?10:0;g.strokeStyle='#8a8478';g.lineWidth=4;g.beginPath();for(i=0;i<4;i++){g.moveTo(x+8,y+T-4-i*(6-sq/4));g.lineTo(x+32,y+T-7-i*(6-sq/4))}g.stroke();g.fillStyle=YEL;g.fillRect(x+4,y+12-sq*-1,32,8);g.strokeStyle=INK;g.lineWidth=2;g.strokeRect(x+4,y+12+sq,32,8)}
        else if(ch==='c'){var on=S.cp.tx===tx;g.fillStyle='#8a8478';g.fillRect(x+18,y+2,4,T-2);g.fillStyle=on?YEL:'#b9b3a6';g.beginPath();g.moveTo(x+22,y+3);g.lineTo(x+38,y+10+Math.sin(S.tt*5)*2);g.lineTo(x+22,y+18);g.fill()}
        else if(ch==='F'){g.fillStyle=INK;g.fillRect(x-6,y-44,52,84);var pg=g.createLinearGradient(0,y-40,0,y+40);pg.addColorStop(0,'#b48cff');pg.addColorStop(1,'#6fe3ff');g.fillStyle=pg;g.fillRect(x,y-38,40,78);g.fillStyle='rgba(255,255,255,.5)';for(i=0;i<5;i++){var yy=(S.tt*60+i*17)%78;g.fillRect(x+4+i*7,y+40-yy,3,8)}}}
      /* ennemis */
      S.en.forEach(function(e){if(!e.alive||e.x<cam-60||e.x>cam+W+60)return;
        if(e.k==='s'){var sq=Math.sin(S.tt*8+e.x*.05)*2;g.fillStyle='#6fd66a';ag.rr(g,e.x-15,e.y-22+sq,30,22-sq,9);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();g.fillStyle='#fff';var d=e.vx>0?4:-4;g.beginPath();g.arc(e.x-5+d,e.y-13+sq,4,0,7);g.arc(e.x+5+d,e.y-13+sq,4,0,7);g.fill();g.fillStyle=INK;g.beginPath();g.arc(e.x-5+d*1.3,e.y-13+sq,2,0,7);g.arc(e.x+5+d*1.3,e.y-13+sq,2,0,7);g.fill()}
        else{var fl=Math.sin(S.tt*16)*8;g.fillStyle='#8a5ad0';g.beginPath();g.moveTo(e.x-8,e.y-12);g.lineTo(e.x-24,e.y-18-fl);g.lineTo(e.x-16,e.y-4);g.fill();g.beginPath();g.moveTo(e.x+8,e.y-12);g.lineTo(e.x+24,e.y-18-fl);g.lineTo(e.x+16,e.y-4);g.fill();g.beginPath();g.arc(e.x,e.y-10,10,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();g.fillStyle=YEL;g.fillRect(e.x-6,e.y-13,4,4);g.fillRect(e.x+2,e.y-13,4,4)}});
      /* le héros, aux couleurs de ton perso */
      if(!(p.inv>0&&Math.floor(S.tt*14)%2)){var a=PP.perso&&PP.perso.get?PP.perso.get():{},tc=a.topCol||RED,skc=a.skin||'#e8b98c',cx=p.x+p.w/2,by=p.y+p.h,run=p.g?Math.sin(p.an*3):0,air=!p.g;
        g.fillStyle=INK;g.fillRect(cx-9+run*5,by-(air?6:8),7,air?6:8);g.fillRect(cx+2-run*5,by-(air?6:8),7,air?6:8);
        g.fillStyle=tc;ag.rr(g,cx-11,by-25,22,18,5);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();
        g.fillStyle=skc;ag.rr(g,cx-10,by-41,20,18,7);g.fill();g.stroke();
        g.fillStyle=a.hairCol||'#3a2a1a';g.fillRect(cx-10,by-42,20,6);
        g.fillStyle=INK;g.fillRect(cx+p.face*4-1,by-33,3,5);g.fillRect(cx+p.face*4-7*p.face-1,by-33,3,5);
        g.fillStyle=tc;g.fillRect(cx-14-(air?0:run*2),by-(air?32:23),5,10);g.fillRect(cx+9+(air?0:run*2),by-(air?32:23),5,10)}
      S.fx.forEach(function(f){g.globalAlpha=Math.min(1,f.t*2);g.fillStyle=f.col;g.fillRect(f.x-3,f.y-3,6,6)});g.globalAlpha=1;
      g.restore();
      /* vies (petits cœurs dessinés) et barre de progression */
      for(i=0;i<S.lives;i++){var hx=24+i*26,hy=26;g.fillStyle=RED;g.beginPath();g.moveTo(hx,hy+8);g.bezierCurveTo(hx-14,hy-4,hx-5,hy-12,hx,hy-4);g.bezierCurveTo(hx+5,hy-12,hx+14,hy-4,hx,hy+8);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke()}
      g.fillStyle='rgba(20,18,16,.35)';ag.rr(g,W/2-150,16,300,8,4);g.fill();g.fillStyle=YEL;ag.rr(g,W/2-150,16,Math.max(8,300*Math.min(1,p.x/((L.w-5)*T))),8,4);g.fill();
      ag.mono(g,'CRISTAUX '+S.gems+' · '+S.score+' PTS',W-20,22,13,S.lv===2?CR:INK,'right');
      if(S.banner>0&&C.running){g.globalAlpha=Math.min(1,S.banner);ag.txt(g,'MONDE '+(S.lv+1)+' · '+th.n.toUpperCase(),W/2,120,48,S.lv===2?CR:INK);g.globalAlpha=1}}
  });
})();
