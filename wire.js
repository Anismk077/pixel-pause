/* Pixel Pause — Câbles : rebranche chaque câble sur la prise de la même couleur.
   Chrono : 60 secondes, un maximum de panneaux (chaque panneau réparé rend du temps, chaque erreur en enlève).
   Zen : sans chrono. Plus on avance, plus il y a de câbles, et à partir du panneau 5 les prises se mélangent toutes seules. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',W=960,H=540;
  var COL=['#e2361b','#3a8cff','#f3c623','#3fbf6a','#a46cf0','#ff8a1e','#f08bb0','#4ad0d8'],NAME=['Rouge','Bleu','Jaune','Vert','Violet','Orange','Rose','Cyan'];
  var LX=236,RX=724,S;
  function ys(n,i){return 96+(n===1?180:i*(370/(n-1)))}
  function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function panel(){var n=Math.min(8,3+Math.ceil(S.level/2)),cols=shuffle([0,1,2,3,4,5,6,7]).slice(0,n),right=cols.slice();
    do{shuffle(right)}while(n>2&&right.every(function(c,i){return c===cols[i]}));
    S.n=n;S.left=cols;S.right=right;S.link=[];for(var i=0;i<n;i++)S.link.push(-1);S.used={};S.drag=null;S.doneT=0;S.mixT=S.level>=5?6:0;S.ry=right.map(function(c,i){return ys(n,i)})}
  function fresh(C){S={level:1,score:0,time:C.mode==='zen'?0:60,err:0,over:false,bad:0,spark:[],hov:-1};panel()}
  function leftAt(x,y){for(var i=0;i<S.n;i++)if(S.link[i]<0&&Math.hypot(x-LX,y-ys(S.n,i))<34)return i;return -1}
  function rightAt(x,y){for(var i=0;i<S.n;i++)if(Math.abs(x-RX)<60&&Math.abs(y-S.ry[i])<30)return i;return -1}
  function end(C){if(S.over)return;S.over=true;C.stop();sfx.play('lose');var nb=C.best('pts',S.score);if(S.score>=10)C.win();
    setTimeout(function(){C.over('Temps écoulé !','<b>'+S.score+'</b> panneau'+(S.score>1?'x':'')+' réparé'+(S.score>1?'s':'')+' · '+S.err+' erreur'+(S.err>1?'s':'')+(nb&&S.score?'<br><b>Nouveau record !</b>':'<br>Record : '+(C.best('pts')||0)),'Rejouer')},500)}
  function plug(g,x,y,c,left,on){g.save();g.translate(x,y);if(!left)g.scale(-1,1);
    g.fillStyle='#2a2c30';ag.rr(g,-46,-20,52,40,6);g.fill();g.strokeStyle='#0c0c0e';g.lineWidth=3;g.stroke();
    g.fillStyle=COL[c];ag.rr(g,-2,-15,26,30,5);g.fill();g.strokeStyle=INK;g.lineWidth=3;g.stroke();g.fillStyle='rgba(255,255,255,.35)';g.fillRect(2,-11,18,5);
    if(on){g.fillStyle='#3fe09a';g.beginPath();g.arc(-34,0,5,0,7);g.fill()}else{g.fillStyle='#55585f';g.beginPath();g.arc(-34,0,5,0,7);g.fill()}
    g.restore()}
  function cable(g,x0,y0,x1,y1,c,a){var dx=Math.max(60,Math.abs(x1-x0)*.45);g.lineCap='round';g.globalAlpha=a||1;
    g.beginPath();g.moveTo(x0,y0);g.bezierCurveTo(x0+dx,y0,x1-dx,y1,x1,y1);g.strokeStyle=INK;g.lineWidth=15;g.stroke();g.strokeStyle=COL[c];g.lineWidth=10;g.stroke();
    g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=2.5;g.stroke();g.globalAlpha=1}
  PP.arcade({id:'wire',
    setup:function(C){fresh(C);C.keysText('Attrape un câble à gauche et tire-le jusqu\'à la prise de la même couleur à droite · une erreur coûte 3 secondes');
      C.over('Câbles',C.mode==='zen'?'Rebranche chaque câble sur la prise de sa couleur, sans chrono.':'Tu as <b>60 secondes</b>. Rebranche chaque câble sur la prise de sa couleur : chaque panneau réparé te rend 4 secondes, chaque erreur t\'en enlève 3. Plus tu avances, plus il y a de câbles… et les prises finissent par se mélanger.','Jouer')},
    start:function(C){fresh(C)},
    mouse:function(C,t,x,y){if(!C.running||S.over)return;S.mx=x;S.my=y;S.hov=leftAt(x,y);
      if(t==='down'){var i=S.hov;if(i>=0){S.drag={i:i};sfx.play('tick')}}
      if(t==='up'&&S.drag){var r=rightAt(x,y),i2=S.drag.i;S.drag=null;if(r<0)return;
        if(S.right[r]===S.left[i2]&&!S.used[r]){S.link[i2]=r;S.used[r]=1;sfx.play('pickup');for(var k=0;k<8;k++)S.spark.push({x:RX-30,y:S.ry[r],vx:-Math.random()*200,vy:(Math.random()-.5)*260,t:.4,c:COL[S.left[i2]]})
          if(S.link.every(function(v){return v>=0})){S.doneT=.55;S.score++;sfx.play('win');C.pop(S.score%5===0?S.score+' PANNEAUX !':'RÉPARÉ !','#3fbf6a','54px');if(C.mode!=='zen')S.time=Math.min(99,S.time+4)}}
        else{S.err++;S.bad=.35;sfx.play('lose');C.shake(5);if(C.mode!=='zen')S.time=Math.max(0,S.time-3)}}
      C.cv.style.cursor=S.drag?'grabbing':S.hov>=0?'grab':'default'},
    step:function(C,dt){S.bad=Math.max(0,S.bad-dt);S.spark.forEach(function(s){s.t-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt});S.spark=S.spark.filter(function(s){return s.t>0});
      if(S.doneT>0){S.doneT-=dt;if(S.doneT<=0){S.level++;panel()}}
      /* à partir du panneau 5 : toutes les 6 s, deux prises libres échangent leur place */
      if(S.mixT>0&&S.doneT<=0){S.mixT-=dt;if(S.mixT<=0){S.mixT=5;var free=[];for(var i=0;i<S.n;i++)if(!S.used[i])free.push(i);if(free.length>=2){shuffle(free);var a=free[0],b=free[1],t=S.ry[a];S.ry[a]=S.ry[b];S.ry[b]=t;sfx.play('ui')}}}
      S.vy=S.vy||S.ry.slice();if(S.vy.length!==S.n)S.vy=S.ry.slice();for(var k=0;k<S.n;k++)S.vy[k]+=(S.ry[k]-S.vy[k])*Math.min(1,dt*9);
      if(C.mode!=='zen'){S.time-=dt;if(S.time<=0){S.time=0;end(C)}}
      C.hud((C.mode==='zen'?'':'<span>Temps <b>'+Math.ceil(S.time)+' s</b></span>')+'<span>Panneaux <b>'+S.score+'</b></span><span>Câbles <b>'+S.n+'</b></span>')},
    draw:function(C){var g=C.g;if(!S)fresh(C);var n=S.n,vy=S.vy&&S.vy.length===n?S.vy:S.ry;
      g.fillStyle='#1b1a1d';g.fillRect(0,0,W,H);
      /* plaque métallique vissée */
      var gr=g.createLinearGradient(0,40,0,500);gr.addColorStop(0,'#4a4d55');gr.addColorStop(1,'#33353b');g.fillStyle=gr;ag.rr(g,150,40,660,460,18);g.fill();g.strokeStyle='#0c0c0e';g.lineWidth=5;g.stroke();
      g.fillStyle='rgba(255,255,255,.05)';for(var s=0;s<8;s++)g.fillRect(150,70+s*56,660,2);
      [[172,62],[788,62],[172,478],[788,478]].forEach(function(p){g.fillStyle='#8a8e96';g.beginPath();g.arc(p[0],p[1],8,0,7);g.fill();g.strokeStyle='#22242a';g.lineWidth=2.5;g.beginPath();g.moveTo(p[0]-5,p[1]-5);g.lineTo(p[0]+5,p[1]+5);g.stroke()});
      if(S.bad>0){g.fillStyle='rgba(226,54,27,'+(S.bad*1.2)+')';ag.rr(g,150,40,660,460,18);g.fill()}
      /* bandeau danger et titre */
      for(var b=0;b<17;b++){g.fillStyle=b%2?YEL:INK;g.fillRect(150+b*39,22,39,10)}
      ag.mono(g,'PANNEAU '+S.level,480,62,14,CR);
      var i;for(i=0;i<n;i++){plug(g,RX+22,vy[i],S.right[i],false,!!S.used[i])}
      for(i=0;i<n;i++){var y=ys(n,i);plug(g,LX-22,y,S.left[i],true,S.link[i]>=0);
        if(S.link[i]>=0)cable(g,LX+2,y,RX-2,vy[S.link[i]],S.left[i]);
        else if(S.drag&&S.drag.i===i)cable(g,LX+2,y,S.mx,S.my,S.left[i]);
        else{cable(g,LX+2,y,LX+46,y+16,S.left[i],1);g.fillStyle='#c9c9cf';g.strokeStyle=INK;g.lineWidth=2.5;ag.rr(g,LX+40,y+8,16,16,3);g.fill();g.stroke();if(S.hov===i&&C.running){g.strokeStyle=CR;g.lineWidth=3;g.beginPath();g.arc(LX+48,y+16,18,0,7);g.stroke()}}}
      if(S.drag){g.fillStyle='#c9c9cf';g.strokeStyle=INK;g.lineWidth=2.5;ag.rr(g,S.mx-8,S.my-8,16,16,3);g.fill();g.stroke();var r=rightAt(S.mx,S.my);if(r>=0){g.strokeStyle=CR;g.lineWidth=3;g.setLineDash([6,5]);ag.rr(g,RX-34,vy[r]-26,84,52,8);g.stroke();g.setLineDash([])}}
      S.spark.forEach(function(p){g.fillStyle=p.c;g.globalAlpha=Math.min(1,p.t*3);g.fillRect(p.x,p.y,5,5);g.globalAlpha=1});
      /* chrono en grand à gauche */
      if(C.mode!=='zen'){ag.txt(g,String(Math.ceil(S.time)),76,250,70,S.time<10?RED:CR);ag.mono(g,'SECONDES',76,300,12,'rgba(241,236,226,.6)')}
      ag.txt(g,String(S.score),884,250,70,YEL);ag.mono(g,'PANNEAUX',884,300,12,'rgba(241,236,226,.6)');
      if(S.mixT>0&&S.mixT<1.2&&S.doneT<=0)ag.mono(g,'ÇA BOUGE !',480,518,14,YEL)}
  });
})();
