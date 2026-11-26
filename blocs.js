/* Pixel Pause — Blocs : des pièces tombent, on les tourne et on remplit des lignes pour les faire disparaître.
   Jeu original du site : en plus des pièces de 4 carrés, il y a des petites pièces de 3 carrés, une réserve (C) et trois modes. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',W=960,H=540,COLS=10,ROWS=20,CS=25,GX=355,GY=20,S;
  var SH={I:{n:4,c:[[0,1],[1,1],[2,1],[3,1]],col:'#36c5d6'},O:{n:2,c:[[0,0],[1,0],[0,1],[1,1]],col:'#f3c623'},T:{n:3,c:[[1,0],[0,1],[1,1],[2,1]],col:'#a45bd6'},
    S:{n:3,c:[[1,0],[2,0],[0,1],[1,1]],col:'#3fbf6a'},Z:{n:3,c:[[0,0],[1,0],[1,1],[2,1]],col:'#e2361b'},L:{n:3,c:[[2,0],[0,1],[1,1],[2,1]],col:'#ff8a3d'},J:{n:3,c:[[0,0],[0,1],[1,1],[2,1]],col:'#3f6fe0'},
    B:{n:3,c:[[0,1],[1,1],[2,1]],col:'#f1ece2'},C:{n:2,c:[[0,0],[0,1],[1,1]],col:'#ff7ab8'}};
  function bag(){var a=['I','O','T','S','Z','L','J',Math.random()<.5?'B':'C'];for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function piece(k){var s=SH[k];return {k:k,n:s.n,c:s.c.map(function(p){return [p[0],p[1]]}),x:Math.floor((COLS-s.n)/2),y:k==='I'?-1:0}}
  function fits(c,x,y){for(var i=0;i<c.length;i++){var cx=x+c[i][0],cy=y+c[i][1];if(cx<0||cx>=COLS||cy>=ROWS)return false;if(cy>=0&&S.g[cy][cx])return false}return true}
  function rot(c,n,dir){return c.map(function(p){return dir>0?[n-1-p[1],p[0]]:[p[1],n-1-p[0]]})}
  function take(){while(S.q.length<5)S.q=S.q.concat(bag());return S.q.shift()}
  function spawn(C,k){S.cur=piece(k||take());S.lock=0;S.resets=0;S.dropT=0;S.canHold=!k?true:S.canHold;if(!fits(S.cur.c,S.cur.x,S.cur.y)){end(C,false)}}
  function fresh(C){S={mode:C.mode||'marathon',g:[],q:[],cur:null,hold:null,canHold:true,score:0,lines:0,level:1,dropT:0,lock:0,resets:0,das:0,dir:0,clr:null,clrT:0,time:0,left:C.mode==='chrono'?120:0,over:false,fx:[],combo:-1};
    for(var r=0;r<ROWS;r++){S.g.push(new Array(COLS).fill(0))}}
  function end(C,won){if(S.over)return;S.over=true;C.stop();var t,msg;
    if(S.mode==='sprint'){if(won){var sec=Math.round(S.time*10)/10,nb=C.best('sprint',sec,true);sfx.play('win');C.win();t='30 lignes !';msg='Temps : <b>'+sec.toFixed(1)+' s</b>'+(nb?'<br><b>Nouveau record !</b>':'<br>Record : '+C.best('sprint')+' s')}else{sfx.play('lose');t='Perdu';msg='Tu avais fait <b>'+S.lines+'</b> lignes sur 30.'}}
    else{var key=S.mode==='chrono'?'chrono':'pts',nb2=C.best(key,S.score);sfx.play(nb2&&S.score?'win':'lose');if(S.score>=5000)C.win();t=S.mode==='chrono'&&won?'Temps écoulé !':'Partie terminée';msg='<b>'+S.score+'</b> points · '+S.lines+' lignes · niveau '+S.level+(nb2&&S.score?'<br><b>Nouveau record !</b>':'<br>Record : '+(C.best(key)||0))}
    setTimeout(function(){C.over(t,msg,'Rejouer')},500)}
  function move(dx){if(!S.cur||S.clr)return false;if(fits(S.cur.c,S.cur.x+dx,S.cur.y)){S.cur.x+=dx;touch();return true}return false}
  function touch(){if(S.lock>0&&S.resets<14){S.lock=.0001;S.resets++}}
  function turn(dir){if(!S.cur||S.clr||S.cur.k==='O')return;var c=rot(S.cur.c,S.cur.n,dir),ks=[[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[-1,-1],[1,-1],[0,-2]];
    for(var i=0;i<ks.length;i++)if(fits(c,S.cur.x+ks[i][0],S.cur.y+ks[i][1])){S.cur.c=c;S.cur.x+=ks[i][0];S.cur.y+=ks[i][1];touch();sfx.play('tick');return}}
  function ghostY(){var y=S.cur.y;while(fits(S.cur.c,S.cur.x,y+1))y++;return y}
  function place(C){var cur=S.cur,out=false;cur.c.forEach(function(p){var y=cur.y+p[1];if(y<0)out=true;else S.g[y][cur.x+p[0]]=SH[cur.k].col});S.cur=null;
    if(out){end(C,false);return}
    var full=[];for(var r=0;r<ROWS;r++)if(S.g[r].every(function(v){return v}))full.push(r);
    if(full.length){S.clr=full;S.clrT=.22;S.combo++;var pts=[0,100,300,500,800][full.length]*S.level+S.combo*50*S.level;S.score+=pts;sfx.play(full.length>=4?'win':'pickup');C.pop(full.length>=4?'QUATRE LIGNES !':full.length===3?'TRIPLE':full.length===2?'DOUBLE':'+'+pts,full.length>=3?YEL:CR,full.length>=4?'54px':'34px');if(full.length>=4)C.shake(8);
      full.forEach(function(r2){for(var c=0;c<COLS;c++)for(var k=0;k<2;k++)S.fx.push({x:GX+c*CS+CS/2,y:GY+r2*CS+CS/2,vx:(Math.random()-.5)*300,vy:-Math.random()*220,t:.6,col:S.g[r2][c]})})}
    else{S.combo=-1;sfx.play('hit');spawn(C)}}
  function hard(C){if(!S.cur||S.clr)return;var gy=ghostY();S.score+=(gy-S.cur.y)*2;S.cur.y=gy;C.shake(3);place(C)}
  function hold(C){if(!S.cur||S.clr||!S.canHold)return;var k=S.cur.k,h=S.hold;S.hold=k;S.canHold=false;sfx.play('ui');if(h)spawn(C,h);else{spawn(C);S.canHold=false}}
  function speed(){return Math.max(.045,.8*Math.pow(.83,S.level-1))}
  function cell(g,x,y,col,a){g.globalAlpha=a==null?1:a;g.fillStyle=col;g.fillRect(x+1,y+1,CS-2,CS-2);g.fillStyle='rgba(255,255,255,.28)';g.fillRect(x+1,y+1,CS-2,4);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x+1,y+CS-5,CS-2,4);g.globalAlpha=1}
  function mini(g,k,cx,cy,sc){if(!k)return;var s=SH[k],mnx=9,mxx=-9,mny=9,mxy=-9;s.c.forEach(function(p){mnx=Math.min(mnx,p[0]);mxx=Math.max(mxx,p[0]);mny=Math.min(mny,p[1]);mxy=Math.max(mxy,p[1])});var w=(mxx-mnx+1)*sc,h=(mxy-mny+1)*sc;
    s.c.forEach(function(p){var x=cx-w/2+(p[0]-mnx)*sc,y=cy-h/2+(p[1]-mny)*sc;g.fillStyle=s.col;g.fillRect(x+1,y+1,sc-2,sc-2);g.fillStyle='rgba(255,255,255,.28)';g.fillRect(x+1,y+1,sc-2,3)})}
  function panel(g,x,y,w,h,t){g.fillStyle='#1f1d22';ag.rr(g,x,y,w,h,10);g.fill();g.strokeStyle='#3a3840';g.lineWidth=2;g.stroke();ag.mono(g,t,x+w/2,y+16,11,'rgba(241,236,226,.6)')}
  PP._blocs=function(){return S};
  PP.arcade({id:'blocs',
    setup:function(C){fresh(C);C.keysText('<kbd>←</kbd><kbd>→</kbd> ou <kbd>Q</kbd><kbd>D</kbd> déplacer · <kbd>↑</kbd> ou <kbd>Z</kbd> tourner · <kbd>↓</kbd> ou <kbd>S</kbd> descendre · <kbd>Espace</kbd> poser d\'un coup · <kbd>C</kbd> mettre en réserve');
      C.over('Blocs',S.mode==='sprint'?'Fais 30 lignes le plus vite possible.':S.mode==='chrono'?'2 minutes pour marquer un maximum de points.':'Remplis des lignes entières pour les effacer. Ça accélère tous les 10 lignes. Plusieurs lignes d\'un coup et les enchaînements rapportent beaucoup plus.','Jouer')},
    start:function(C){fresh(C);spawn(C)},
    key:function(C,k,d){if(!d||!C.running||S.over)return;if(k==='ArrowUp'||k==='KeyW'||k==='KeyX')turn(1);else if(k==='KeyE'||k==='ControlLeft')turn(-1);else if(k==='Space')hard(C);else if(k==='KeyC'||k==='ShiftLeft')hold(C)},
    step:function(C,dt){if(S.over)return;var k=C.keys;S.time+=dt;
      S.fx=S.fx.filter(function(f){f.t-=dt;f.vy+=700*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;return f.t>0});
      if(S.mode==='chrono'){S.left-=dt;if(S.left<=0){S.left=0;end(C,true);return}}
      if(S.clr){S.clrT-=dt;if(S.clrT<=0){S.clr.forEach(function(r){S.g.splice(r,1);S.g.unshift(new Array(COLS).fill(0))});S.lines+=S.clr.length;S.clr=null;S.level=1+Math.floor(S.lines/10);if(S.mode==='sprint'&&S.lines>=30){end(C,true);return}spawn(C)}}
      else if(S.cur){
        var dir=((k.ArrowRight||k.KeyD)?1:0)-((k.ArrowLeft||k.KeyA)?1:0);
        if(dir!==S.dir){S.dir=dir;if(dir){if(move(dir))sfx.play('tick');S.das=.17}}else if(dir){S.das-=dt;while(S.das<=0){S.das+=.035;if(!move(dir))break}}
        var soft=k.ArrowDown||k.KeyS,iv=soft?Math.min(.04,speed()):speed();S.dropT+=dt;
        while(S.dropT>=iv&&S.cur){S.dropT-=iv;if(fits(S.cur.c,S.cur.x,S.cur.y+1)){S.cur.y++;if(soft)S.score++;S.lock=0}else{S.dropT=0;break}}
        if(S.cur&&!fits(S.cur.c,S.cur.x,S.cur.y+1)){S.lock+=dt;if(S.lock>.45||(soft&&S.lock>.12))place(C)}else if(S.cur)S.lock=0}
      C.hud('<span>Points <b>'+S.score+'</b></span><span>Lignes <b>'+S.lines+(S.mode==='sprint'?' / 30':'')+'</b></span><span>'+(S.mode==='chrono'?'Reste <b>'+Math.ceil(S.left)+' s</b>':S.mode==='sprint'?'Temps <b>'+S.time.toFixed(1)+' s</b>':'Niveau <b>'+S.level+'</b>')+'</span>')},
    draw:function(C){var g=C.g;if(!S)fresh(C);g.fillStyle='#17161a';g.fillRect(0,0,W,H);
      /* plateau */
      g.fillStyle='#0d0c10';ag.rr(g,GX-8,GY-8,COLS*CS+16,ROWS*CS+16,10);g.fill();g.strokeStyle='#3a3840';g.lineWidth=3;g.stroke();
      g.strokeStyle='rgba(241,236,226,.05)';g.lineWidth=1;g.beginPath();for(var c=1;c<COLS;c++){g.moveTo(GX+c*CS+.5,GY);g.lineTo(GX+c*CS+.5,GY+ROWS*CS)}for(var r=1;r<ROWS;r++){g.moveTo(GX,GY+r*CS+.5);g.lineTo(GX+COLS*CS,GY+r*CS+.5)}g.stroke();
      for(r=0;r<ROWS;r++)for(c=0;c<COLS;c++)if(S.g[r][c]){var fl=S.clr&&S.clr.indexOf(r)>=0;cell(g,GX+c*CS,GY+r*CS,fl?'#ffffff':S.g[r][c],fl?Math.max(0,S.clrT/.22):1)}
      if(S.cur&&!S.over){var gy=ghostY(),col=SH[S.cur.k].col;S.cur.c.forEach(function(p){var y=gy+p[1];if(y>=0){g.strokeStyle=col;g.globalAlpha=.45;g.lineWidth=2;g.strokeRect(GX+(S.cur.x+p[0])*CS+3,GY+y*CS+3,CS-6,CS-6);g.globalAlpha=1}});
        S.cur.c.forEach(function(p){var y=S.cur.y+p[1];if(y>=0)cell(g,GX+(S.cur.x+p[0])*CS,GY+y*CS,col)})}
      S.fx.forEach(function(f){g.globalAlpha=Math.min(1,f.t*2);g.fillStyle=f.col;g.fillRect(f.x-4,f.y-4,8,8)});g.globalAlpha=1;
      /* réserve à gauche, suivantes à droite */
      panel(g,205,20,130,110,'RÉSERVE (C)');g.globalAlpha=S.canHold?1:.35;mini(g,S.hold,270,82,22);g.globalAlpha=1;
      panel(g,625,20,130,290,'À VENIR');for(var i=0;i<3;i++)mini(g,S.q[i],690,82+i*84,i?18:22);
      panel(g,205,150,130,214,'SCORE');ag.txt(g,String(S.score),270,200,S.score>99999?26:34,CR);ag.mono(g,'LIGNES',270,240,11,'rgba(241,236,226,.6)');ag.txt(g,String(S.lines),270,268,28,YEL);ag.mono(g,S.mode==='chrono'?'TEMPS':S.mode==='sprint'?'CHRONO':'NIVEAU',270,306,11,'rgba(241,236,226,.6)');
      ag.txt(g,S.mode==='chrono'?String(Math.ceil(S.left)):S.mode==='sprint'?S.time.toFixed(0):String(S.level),270,334,28,S.mode==='chrono'&&S.left<15?RED:CR);
      if(S.combo>0){ag.mono(g,'ENCHAÎNEMENT x'+(S.combo+1),690,340,12,YEL)}
      ag.mono(g,'RECORD',690,470,11,'rgba(241,236,226,.6)');var b=C.best(S.mode==='sprint'?'sprint':S.mode==='chrono'?'chrono':'pts');ag.txt(g,b?(S.mode==='sprint'?b+' s':String(b)):'—',690,498,24,CR)}
  });
})();
