/* Pixel Pause ‚Äî Marzouker : nourris-le de burgers, il grossit jusqu'√† devenir m√©ga gros‚Ä¶ et finit pauvre */
(function(){
  'use strict';
  var sfx=PP.sfx,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',GRN='#3fe09a';
  var S;
  var ITEMS={
    burger:{kg:3,eur:-2,p:.46,r:30},
    maxi:{kg:8,eur:-5,p:.12,r:38},
    frites:{kg:2,eur:-1,p:.2,r:26},
    salade:{kg:-5,eur:0,p:.14,r:28},
    piece:{kg:0,eur:6,p:.08,r:22}
  };
  var STAGES=[[0,'Normal'],[95,'Gros'],[130,'Tr√®s gros'],[175,'M√©ga gros'],[230,'Giga gros'],[300,'Plan√©taire']];
  function stageOf(kg){var s=0;STAGES.forEach(function(st,i){if(kg>=st[0])s=i});return s}
  function pickType(){var r=Math.random(),a=0,k;for(k in ITEMS){a+=ITEMS[k].p;if(r<a)return k}return 'burger'}
  function reset(){S={x:480,kg:70,eur:100,items:[],spawn:.6,t:0,speed:1,mouth:0,face:0,stage:0,over:false,poor:false,eaten:0,shake:0,crumbs:[],max:70,tgt:null}}

  /* ---------- dessins ---------- */
  function burger(g,x,y,r,big){g.save();g.translate(x,y);var s=r/30;g.scale(s,s);
    g.fillStyle='#e0a040';g.beginPath();g.ellipse(0,-8,30,18,0,Math.PI,0);g.fill();
    g.fillStyle='#fff6d8';for(var i=0;i<6;i++){g.beginPath();g.ellipse(-18+i*7,-16+Math.sin(i*2)*3,2,1.2,.5,0,7);g.fill()}
    g.fillStyle='#3fae3a';g.beginPath();g.moveTo(-32,-4);for(var j=0;j<=8;j++)g.lineTo(-32+j*8,j%2?2:-6);g.lineTo(32,2);g.lineTo(-32,2);g.fill();
    g.fillStyle='#f3c623';g.fillRect(-29,-2,58,5);
    g.fillStyle='#5a2e18';g.beginPath();g.roundRect(-30,2,60,10,5);g.fill();
    if(big){g.fillStyle='#f3c623';g.fillRect(-29,11,58,4);g.fillStyle='#5a2e18';g.beginPath();g.roundRect(-30,14,60,9,5);g.fill()}
    g.fillStyle='#e0a040';g.beginPath();g.roundRect(-28,big?22:11,56,10,5);g.fill();
    if(big){g.fillStyle=RED;g.font='800 13px "IBM Plex Mono",monospace';g.textAlign='center';g.fillText('MAXI',0,-26)}
    g.restore()}
  function frites(g,x,y,r){g.save();g.translate(x,y);var s=r/26;g.scale(s,s);g.fillStyle='#f3c623';for(var i=0;i<6;i++){g.save();g.rotate((i-2.5)*.12);g.fillRect(-4+(i-2.5)*5,-30,6,26);g.restore()}
    g.fillStyle=RED;g.beginPath();g.moveTo(-20,-8);g.lineTo(20,-8);g.lineTo(15,22);g.lineTo(-15,22);g.closePath();g.fill();g.fillStyle=CR;g.font='800 11px "IBM Plex Mono",monospace';g.textAlign='center';g.fillText('M',0,12);g.restore()}
  function salade(g,x,y,r){g.save();g.translate(x,y);var s=r/28;g.scale(s,s);g.fillStyle='#e8e2d4';g.beginPath();g.ellipse(0,10,28,10,0,0,7);g.fill();
    ['#58b84a','#3f9a3a','#79cf5e'].forEach(function(c,i){g.fillStyle=c;for(var k=0;k<4;k++){g.beginPath();g.ellipse(-16+k*11,0-i*4,10,7,(k-1.5)*.5,0,7);g.fill()}});
    g.fillStyle='#e2361b';g.beginPath();g.arc(-6,-6,4,0,7);g.arc(8,-3,4,0,7);g.fill();g.restore()}
  function piece(g,x,y,r){g.fillStyle='#d4a32a';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.fillStyle=YEL;g.beginPath();g.arc(x,y,r*.78,0,7);g.fill();g.fillStyle='#8a6a10';g.font='800 '+(r*.9|0)+'px "IBM Plex Mono",monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('‚Ç¨',x,y+1);g.textBaseline='alphabetic'}
  function item(g,o){if(o.t==='burger')burger(g,o.x,o.y,o.r);else if(o.t==='maxi')burger(g,o.x,o.y,o.r,true);else if(o.t==='frites')frites(g,o.x,o.y,o.r);else if(o.t==='salade')salade(g,o.x,o.y,o.r);else piece(g,o.x,o.y,o.r)}

  /* Marzouker : un gars √† la peau claire qui s'arrondit √† chaque bouch√©e */
  function guy(g,x,kg,mouth,face,poor){
    var f=Math.max(0,(kg-70)/230),bw=58+f*230,bh=92+f*70,base=520,cy=base-bh/2-38,skin='#f3d9c4',skinD='#e2bfa4';
    g.save();
    /* ombre */
    g.fillStyle='rgba(20,18,16,.25)';g.beginPath();g.ellipse(x,base+6,bw*.85,12+f*8,0,0,7);g.fill();
    /* jambes */
    g.fillStyle=poor?'#5a5248':'#2b3a5a';var lw=18+f*40;g.beginPath();g.roundRect(x-bw*.42-lw/2+lw*.4,base-46,lw,46,8);g.roundRect(x+bw*.42-lw/2-lw*.4,base-46,lw,46,8);g.fill();
    g.fillStyle='#1a1714';g.beginPath();g.ellipse(x-bw*.35,base-2,lw*.8,9,0,0,7);g.ellipse(x+bw*.35,base-2,lw*.8,9,0,0,7);g.fill();
    /* corps */
    g.fillStyle=poor?'#8a8070':RED;g.beginPath();g.ellipse(x,cy,bw,bh/2+10,0,0,7);g.fill();
    if(poor){g.fillStyle='#6a6052';[[-.4,-.1],[.3,.2],[.1,-.35]].forEach(function(p){g.beginPath();g.ellipse(x+p[0]*bw,cy+p[1]*bh,10+f*10,7+f*6,.6,0,7);g.fill()})}
    /* ventre qui d√©passe */
    if(f>.08){g.fillStyle=skin;g.beginPath();g.ellipse(x,cy+bh*.28,bw*.62,bh*.22*Math.min(1,f*3),0,0,Math.PI);g.fill();g.fillStyle=skinD;g.beginPath();g.ellipse(x,cy+bh*.32,4,3,0,0,7);g.fill()}
    if(!poor){g.fillStyle=CR;g.font='800 '+(16+f*14|0)+'px "Anton","Inter Tight",sans-serif';g.textAlign='center';g.fillText('MARZOUKER',x,cy-bh*.05)}
    /* bras */
    g.strokeStyle=skin;g.lineCap='round';g.lineWidth=16+f*22;var ay=cy-bh*.15,wave=Math.sin(Date.now()/150)*(mouth>0?.6:.15);
    g.beginPath();g.moveTo(x-bw*.9,ay);g.lineTo(x-bw*1.05-14,ay-30-wave*30);g.stroke();g.beginPath();g.moveTo(x+bw*.9,ay);g.lineTo(x+bw*1.05+14,ay-30+wave*30);g.stroke();
    /* t√™te (double menton quand il grossit) */
    var hr=34+f*22,hy=cy-bh/2-hr*.7;
    if(f>.15){g.fillStyle=skinD;g.beginPath();g.ellipse(x,hy+hr*.85,hr*(.8+f*.6),hr*.32,0,0,7);g.fill()}
    g.fillStyle=skin;g.beginPath();g.ellipse(x,hy,hr*(1+f*.35),hr,0,0,7);g.fill();
    /* joues */
    g.fillStyle='rgba(226,54,27,'+(.18+f*.3)+')';g.beginPath();g.ellipse(x-hr*.62,hy+hr*.2,hr*.24,hr*.16,0,0,7);g.ellipse(x+hr*.62,hy+hr*.2,hr*.24,hr*.16,0,0,7);g.fill();
    /* cheveux / casquette */
    if(poor){g.fillStyle='#4a4038';g.beginPath();g.ellipse(x,hy-hr*.65,hr*.95,hr*.4,0,Math.PI,0);g.fill()}
    else{g.fillStyle=INK;g.beginPath();g.ellipse(x,hy-hr*.55,hr*1.02,hr*.55,0,Math.PI,0);g.fill();g.fillRect(x-hr*1.2,hy-hr*.62,hr*1.1,hr*.18)}
    /* yeux */
    g.fillStyle=INK;var ey=hy-hr*.12,ex=hr*.36;
    if(face<0||poor){g.lineWidth=3;g.strokeStyle=INK;g.beginPath();g.moveTo(x-ex-8,ey-4);g.lineTo(x-ex+8,ey+2);g.moveTo(x+ex+8,ey-4);g.lineTo(x+ex-8,ey+2);g.stroke()}
    else{g.beginPath();g.arc(x-ex,ey,5,0,7);g.arc(x+ex,ey,5,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x-ex+1.5,ey-1.5,1.6,0,7);g.arc(x+ex+1.5,ey-1.5,1.6,0,7);g.fill()}
    /* bouche */
    var my=hy+hr*.42;g.fillStyle='#7a1a10';
    if(mouth>0){var mo=Math.min(1,mouth*3);g.beginPath();g.ellipse(x,my,hr*.34,hr*.26*mo+3,0,0,7);g.fill();g.fillStyle='#e2617a';g.beginPath();g.ellipse(x,my+hr*.12*mo,hr*.18,hr*.08*mo+1,0,0,7);g.fill()}
    else if(face<0||poor){g.lineWidth=4;g.strokeStyle='#7a1a10';g.beginPath();g.arc(x,my+12,hr*.25,Math.PI*1.15,Math.PI*1.85);g.stroke()}
    else{g.lineWidth=4;g.strokeStyle='#7a1a10';g.beginPath();g.arc(x,my-6,hr*.25,Math.PI*.15,Math.PI*.85);g.stroke()}
    g.restore();
    return {mx:x,my:my,hr:hr,bw:bw};
  }
  function scene(g,W,H,poor){
    if(poor){var sk=g.createLinearGradient(0,0,0,H);sk.addColorStop(0,'#5a6470');sk.addColorStop(1,'#8a8f94');g.fillStyle=sk;g.fillRect(0,0,W,H);
      g.fillStyle='#3a3a40';for(var i=0;i<8;i++)g.fillRect(i*130-20,120+(i%3)*30,110,400);g.fillStyle='#6a6a6e';g.fillRect(0,500,W,40);
      g.strokeStyle='rgba(200,210,220,.5)';g.lineWidth=1.5;for(var r=0;r<90;r++){var rx=(r*97+Date.now()/3)%W,ry=(r*53+Date.now()/2)%H;g.beginPath();g.moveTo(rx,ry);g.lineTo(rx-4,ry+14);g.stroke()}return}
    g.fillStyle=CR;g.fillRect(0,0,W,H);
    g.fillStyle='#e8e0d0';for(var x=0;x<W;x+=60)for(var y=0;y<500;y+=60)if((x+y)/60%2)g.fillRect(x,y,60,60);
    g.fillStyle=INK;g.fillRect(0,500,W,40);g.fillStyle=RED;g.fillRect(0,500,W,6);
    g.fillStyle=RED;g.font='400 64px "Anton","Inter Tight",sans-serif';g.textAlign='left';g.globalAlpha=.1;g.fillText('BURGER TIME',30,90);g.globalAlpha=1;
  }

  PP._marz=function(){return S};
  PP.arcade({id:'marz',
    setup:function(C){reset();C.keysText('Souris, doigt ou <kbd>‚Üê</kbd><kbd>‚Üí</kbd> pour placer sa bouche sous la bouffe ¬∑ √©vite la salade ¬∑ les pi√®ces rallongent la partie');
      C.over('Marzouker','Nourris Marzouker de burgers jusqu\'√† ce qu\'il devienne m√©ga gros. Chaque burger co√ªte des sous‚Ä¶ quand le portefeuille est vide, il devient pauvre.<br>Record : <b>'+(C.best('kg')||0)+' kg</b>','Manger !');this.draw(C)},
    start:function(C){reset();sfx.play('go')},
    mouse:function(C,t,x){if(t!=='up')S.tgt=x},
    step:function(C,dt){
      if(S.over)return;var k=C.keys,heavy=1-Math.min(.6,(S.kg-70)/500),sp=620*heavy;
      if(k.ArrowLeft||k.KeyA||k.KeyQ){S.tgt=null;S.x-=sp*dt}if(k.ArrowRight||k.KeyD){S.tgt=null;S.x+=sp*dt}
      if(S.tgt!=null)S.x+=(S.tgt-S.x)*Math.min(1,dt*10*heavy);S.x=Math.max(70,Math.min(890,S.x));
      S.t+=dt;S.speed=1+S.t/45;S.spawn-=dt;if(S.spawn<=0){S.spawn=Math.max(.28,.85-S.t/90);var tp=pickType(),it=ITEMS[tp];S.items.push({t:tp,x:60+Math.random()*840,y:-40,r:it.r,vy:(150+Math.random()*90)*S.speed,rot:0})}
      S.mouth=Math.max(0,S.mouth-dt);if(S.face<0)S.face=Math.min(0,S.face+dt);S.shake=Math.max(0,S.shake-dt);
      var f=Math.max(0,(S.kg-70)/230),hr=34+f*22,bh=92+f*70,cy=520-bh/2-38,my=cy-bh/2-hr*.7+hr*.42,catchW=hr*.75+20;
      for(var i=S.items.length-1;i>=0;i--){var o=S.items[i];o.y+=o.vy*dt;
        if(Math.abs(o.y-my)<26&&Math.abs(o.x-S.x)<catchW){var it=ITEMS[o.t];S.items.splice(i,1);
          if(o.t==='salade'){S.kg=Math.max(60,S.kg+it.kg);S.face=-1;sfx.play('lose');C.pop('BEURK ! '+it.kg+' kg',GRN,'40px');C.shake(6)}
          else if(o.t==='piece'){S.eur+=it.eur;sfx.play('pickup');C.pop('+'+it.eur+' ‚Ç¨',YEL,'40px')}
          else{S.kg+=it.kg;S.eur+=it.eur;S.mouth=.35;S.eaten++;sfx.play('eat');for(var c=0;c<6;c++)S.crumbs.push({x:S.x+(Math.random()-.5)*30,y:my,vx:(Math.random()-.5)*160,vy:-Math.random()*160,t:.6});if(o.t==='maxi'){C.pop('MENU MAXI ! +'+it.kg+' kg',RED,'44px');C.shake(4)}}
          var st=stageOf(S.kg);if(st>S.stage){S.stage=st;sfx.play('win');C.pop(STAGES[st][1].toUpperCase()+' !',RED,'64px');C.shake(10)}
          S.max=Math.max(S.max,S.kg);
          if(S.eur<=0){S.eur=0;S.over=true;S.poor=true;S.items=[];S.mouth=0;C.stop();sfx.play('lose');var nb=C.best('kg',Math.round(S.max));if(S.max>=230)C.win();
            setTimeout(function(){C.over('Marzouker est devenu pauvre','Il a tout claqu√© en burgers. Il a atteint <b>'+Math.round(S.max)+' kg</b> ('+STAGES[stageOf(S.max)][1]+') avec '+S.eaten+' burgers.'+(nb?' Nouveau record !':' Record : '+C.best('kg')+' kg'),'Recommencer')},900)}
          continue}
        if(o.y>600)S.items.splice(i,1)}
      S.crumbs.forEach(function(c){c.t-=dt;c.vy+=500*dt;c.x+=c.vx*dt;c.y+=c.vy*dt});S.crumbs=S.crumbs.filter(function(c){return c.t>0});
      C.hud('<span>Poids <b>'+Math.round(S.kg)+' kg</b></span><span>Porte-monnaie <b>'+Math.round(S.eur)+' ‚Ç¨</b></span><span>'+STAGES[stageOf(S.kg)][1]+'</span>')},
    draw:function(C){var g=C.g,W=960,H=540;if(!S)reset();g.save();if(S.shake>0)g.translate((Math.random()-.5)*10,(Math.random()-.5)*10);
      scene(g,W,H,S.poor);
      S.items.forEach(function(o){item(g,o)});
      guy(g,S.x,S.kg,S.mouth,S.face,S.poor);
      g.fillStyle='#c98a3a';S.crumbs.forEach(function(c){g.fillRect(c.x,c.y,4,4)});
      if(S.poor){g.save();g.translate(S.x+150,470);g.rotate(-.06);g.fillStyle='#b8925a';g.fillRect(-80,-46,160,72);g.fillStyle=INK;g.font='700 15px "IBM Plex Mono",monospace';g.textAlign='center';g.fillText('J\'AI TOUT MIS',0,-18);g.fillText('DANS LES BURGERS',0,2);g.fillText('1 ‚Ç¨ SVP',0,22);g.restore();
        g.fillStyle='#8a8a8a';g.beginPath();g.ellipse(S.x-150,500,26,8,0,0,7);g.fill();g.fillStyle='#d4a32a';g.beginPath();g.arc(S.x-156,496,5,0,7);g.fill()}
      /* jauge du porte-monnaie */
      if(!S.poor){g.fillStyle=INK;g.fillRect(20,20,220,18);g.fillStyle=S.eur<25?RED:GRN;g.fillRect(22,22,216*Math.min(1,S.eur/100),14);g.fillStyle=CR;g.font='700 11px "IBM Plex Mono",monospace';g.textAlign='left';g.fillText('‚Ç¨ '+Math.round(S.eur),28,33)}
      g.restore()}
  });
})();
