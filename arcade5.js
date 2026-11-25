/* Pixel Pause — Marzoukeur : attrape la bouffe avec sa bouche, il grossit à chaque bouchée…
   jusqu'à ce que le porte-monnaie soit vide. Combos, bonus (aspirateur, coupon, burger doré), pièges (salade, facture). */
(function(){
  'use strict';
  var sfx=PP.sfx,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',GRN='#3fbf6a',W=960,H=540,FLOOR=500;
  var S;
  /* kg pris, € (négatif = ça coûte), probabilité, taille */
  var ITEMS={
    burger:{kg:3,eur:-2,p:.36,r:30,n:'Burger'},
    maxi:{kg:8,eur:-5,p:.1,r:38,n:'Menu maxi'},
    frites:{kg:2,eur:-1,p:.16,r:26,n:'Frites'},
    shake:{kg:4,eur:-3,p:.07,r:26,n:'Milkshake'},
    salade:{kg:-5,eur:0,p:.1,r:28,n:'Salade'},
    facture:{kg:0,eur:-15,p:.05,r:26,n:'Facture'},
    piece:{kg:0,eur:6,p:.08,r:22,n:'Pièce'},
    dore:{kg:12,eur:10,p:.025,r:34,n:'Burger doré'},
    aspi:{kg:0,eur:0,p:.02,r:24,n:'Aspirateur'},
    coupon:{kg:0,eur:0,p:.015,r:24,n:'Coupon'}
  };
  var STAGES=[[0,'Normal'],[95,'Gros'],[130,'Très gros'],[175,'Méga gros'],[230,'Giga gros'],[300,'Planétaire'],[400,'Galactique']];
  function stageOf(kg){var s=0;STAGES.forEach(function(st,i){if(kg>=st[0])s=i});return s}
  function pickType(){var r=Math.random()*Object.keys(ITEMS).reduce(function(a,k){return a+ITEMS[k].p},0),a=0,k;for(k in ITEMS){a+=ITEMS[k].p;if(r<a)return k}return 'burger'}
  function reset(){S={x:480,vx:0,kg:70,shownKg:70,eur:100,items:[],spawn:.6,t:0,speed:1,mouth:0,face:0,stage:0,over:false,poor:false,eaten:0,shake:0,parts:[],floats:[],max:70,tgt:null,
    combo:0,bestCombo:0,comboT:0,aspi:0,coupon:0,jig:0,jigV:0,blink:2,lean:0,sweat:0,bg:0}}
  function f(){return Math.max(0,Math.min(1.6,(S.shownKg-70)/230))}
  function float(x,y,t,c,big){S.floats.push({x:x,y:y,t:t,c:c,big:!!big,life:1.1})}
  function burst(x,y,c,n){for(var i=0;i<n;i++)S.parts.push({x:x,y:y,vx:(Math.random()-.5)*260,vy:-Math.random()*260-40,t:.7+Math.random()*.4,c:c,s:3+Math.random()*4})}

  /* ---------- dessins de la bouffe ---------- */
  function rr(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}
  function burger(g,r,gold){var s=r/30;g.scale(s,s);var bun=gold?'#f5c542':'#e3a447',bunD=gold?'#d49a1a':'#c9852e';
    g.fillStyle=bunD;g.beginPath();g.ellipse(0,-6,31,19,0,Math.PI,0);g.fill();g.fillStyle=bun;g.beginPath();g.ellipse(0,-8,30,18,0,Math.PI,0);g.fill();
    g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(-10,-18,10,4,-.3,0,7);g.fill();
    g.fillStyle='#fff6d8';for(var i=0;i<6;i++){g.beginPath();g.ellipse(-18+i*7,-15+Math.sin(i*2)*3,2,1.2,.5,0,7);g.fill()}
    g.fillStyle='#4fbe45';g.beginPath();g.moveTo(-33,-4);for(var j=0;j<=8;j++)g.lineTo(-33+j*8.25,j%2?3:-6);g.lineTo(33,3);g.lineTo(-33,3);g.fill();
    g.fillStyle='#e2361b';g.fillRect(-27,-3,54,3);
    g.fillStyle='#f7c81e';g.beginPath();g.moveTo(-30,0);g.lineTo(30,0);g.lineTo(24,7);g.lineTo(-18,7);g.fill();
    g.fillStyle='#5a2e18';rr(g,-31,3,62,11,6);g.fill();g.fillStyle='#7a4228';g.fillRect(-26,5,52,2);
    g.fillStyle=bun;rr(g,-29,13,58,11,6);g.fill();g.fillStyle=bunD;g.fillRect(-27,20,54,3);
    if(gold){g.strokeStyle='#fff3b0';g.lineWidth=2;g.beginPath();g.arc(0,-2,40,0,7);g.stroke()}}
  function maxi(g,r){burger(g,r);g.fillStyle=RED;g.font='800 12px "IBM Plex Mono",monospace';g.textAlign='center';g.fillText('MAXI',0,-30)}
  function frites(g,r){var s=r/26;g.scale(s,s);g.fillStyle='#f7c81e';for(var i=0;i<7;i++){g.save();g.rotate((i-3)*.1);g.fillRect(-3+(i-3)*4.5,-30-(i%2)*4,5,26);g.restore()}
    g.fillStyle=RED;g.beginPath();g.moveTo(-20,-8);g.lineTo(20,-8);g.lineTo(15,22);g.lineTo(-15,22);g.closePath();g.fill();g.fillStyle='#b8260f';g.fillRect(-18,-8,36,4);g.fillStyle=CR;g.font='800 12px "Anton",sans-serif';g.textAlign='center';g.fillText('M',0,12)}
  function shake(g,r){var s=r/26;g.scale(s,s);g.fillStyle='#f1ece2';g.beginPath();g.moveTo(-14,-14);g.lineTo(14,-14);g.lineTo(10,24);g.lineTo(-10,24);g.closePath();g.fill();
    g.fillStyle='#f08bb0';g.beginPath();g.moveTo(-13,-6);g.lineTo(13,-6);g.lineTo(10,20);g.lineTo(-10,20);g.closePath();g.fill();
    g.fillStyle='#fff';g.beginPath();g.ellipse(0,-16,15,7,0,0,7);g.fill();g.fillStyle=RED;g.beginPath();g.arc(2,-22,4,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.moveTo(5,-20);g.lineTo(11,-34);g.stroke()}
  function salade(g,r){var s=r/28;g.scale(s,s);g.fillStyle='#e8e2d4';g.beginPath();g.ellipse(0,10,28,10,0,0,7);g.fill();
    ['#58b84a','#3f9a3a','#79cf5e'].forEach(function(c,i){g.fillStyle=c;for(var k=0;k<4;k++){g.beginPath();g.ellipse(-16+k*11,0-i*4,10,7,(k-1.5)*.5,0,7);g.fill()}});
    g.fillStyle='#e2361b';g.beginPath();g.arc(-6,-6,4,0,7);g.arc(8,-3,4,0,7);g.fill()}
  function facture(g,r){var s=r/26;g.scale(s,s);g.rotate(Math.sin(S.t*6)*.15);g.fillStyle='#fff';g.beginPath();g.moveTo(-18,-24);g.lineTo(18,-24);g.lineTo(18,22);for(var i=0;i<6;i++)g.lineTo(18-i*6-3,i%2?18:24);g.lineTo(-18,22);g.closePath();g.fill();
    g.strokeStyle=INK;g.lineWidth=2;g.stroke();g.fillStyle=INK;g.font='800 9px "IBM Plex Mono",monospace';g.textAlign='center';g.fillText('FACTURE',0,-12);g.fillStyle=RED;g.font='800 14px "IBM Plex Mono",monospace';g.fillText('-15€',0,8)}
  function piece(g,r){g.scale(Math.abs(Math.cos(S.t*4))*.7+.3,1);g.fillStyle='#d4a32a';g.beginPath();g.arc(0,0,r,0,7);g.fill();g.fillStyle=YEL;g.beginPath();g.arc(0,0,r*.78,0,7);g.fill();g.fillStyle='#8a6a10';g.font='800 '+(r*.9|0)+'px "IBM Plex Mono",monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('€',0,1);g.textBaseline='alphabetic'}
  function bonus(g,r,t){var s=r/24;g.scale(s,s);g.fillStyle=t==='aspi'?'#3a6ad8':'#7c46c8';g.beginPath();g.arc(0,0,24,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.arc(0,0,20,0,7);g.stroke();
    g.fillStyle='#fff';g.font='800 9px "IBM Plex Mono",monospace';g.textAlign='center';g.textBaseline='middle';
    if(t==='aspi'){g.font='22px sans-serif';g.fillText('🌀',0,1)}else{g.font='800 10px "IBM Plex Mono",monospace';g.fillText('GRATUIT',0,1)}g.textBaseline='alphabetic'}
  function item(g,o){g.save();g.translate(o.x,o.y);g.rotate(o.rot);
    var t=o.t;if(t==='burger')burger(g,o.r);else if(t==='maxi')maxi(g,o.r);else if(t==='dore')burger(g,o.r,true);else if(t==='frites')frites(g,o.r);else if(t==='shake')shake(g,o.r);
    else if(t==='salade')salade(g,o.r);else if(t==='facture')facture(g,o.r);else if(t==='piece')piece(g,o.r);else bonus(g,o.r,t);g.restore()}

  /* ---------- Marzoukeur ---------- */
  function guy(x){
    var g=S.g,F=f(),poor=S.poor,bw=58+F*210,bh=92+F*70,base=FLOOR,jig=S.jig,cy=base-bh/2-38,skin='#f3d9c4',skinD='#e0bb9c',shirt=poor?'#8a8070':RED,shirtD=poor?'#6a6052':'#b8260f';
    g.save();g.translate(x,0);g.rotate(S.lean*.06);g.translate(-x,0);
    g.fillStyle='rgba(20,18,16,.25)';g.beginPath();g.ellipse(x,base+6,bw*.85,12+F*8,0,0,7);g.fill();
    /* jambes et baskets */
    var lw=20+F*40,ls=Math.sin(S.t*12)*Math.min(1,Math.abs(S.vx)/300)*6;
    g.fillStyle=poor?'#5a5248':'#2b3a5a';rr(g,x-bw*.38-lw/2,base-48+ls,lw,48-ls,9);g.fill();rr(g,x+bw*.38-lw/2,base-48-ls,lw,48+ls,9);g.fill();
    g.fillStyle='#fff';g.beginPath();g.ellipse(x-bw*.38-4,base-4,lw*.75,10,0,0,7);g.ellipse(x+bw*.38+4,base-4,lw*.75,10,0,0,7);g.fill();
    g.fillStyle=RED;g.fillRect(x-bw*.38-lw*.6,base-6,lw*1.1,3);g.fillRect(x+bw*.38-lw*.5,base-6,lw*1.1,3);
    /* corps qui ballotte */
    var sx=1+jig*.06,sy=1-jig*.05;g.save();g.translate(x,cy+bh/2);g.scale(sx,sy);g.translate(-x,-(cy+bh/2));
    g.fillStyle=shirtD;g.beginPath();g.ellipse(x,cy+4,bw+2,bh/2+12,0,0,7);g.fill();
    g.fillStyle=shirt;g.beginPath();g.ellipse(x,cy,bw,bh/2+10,0,0,7);g.fill();
    g.fillStyle='rgba(255,255,255,.12)';g.beginPath();g.ellipse(x-bw*.35,cy-bh*.2,bw*.35,bh*.22,-.4,0,7);g.fill();
    if(poor){g.fillStyle='#6a6052';[[-.4,-.1],[.3,.2],[.1,-.35]].forEach(function(p){g.beginPath();g.ellipse(x+p[0]*bw,cy+p[1]*bh,10+F*10,7+F*6,.6,0,7);g.fill()})}
    if(F>.08){g.fillStyle=skin;g.beginPath();g.ellipse(x,cy+bh*.28,bw*.62,bh*.22*Math.min(1,F*3),0,0,Math.PI);g.fill();g.fillStyle=skinD;g.beginPath();g.ellipse(x,cy+bh*.32,4,3,0,0,7);g.fill()}
    if(!poor){g.fillStyle=CR;var fs=Math.round(13+F*14);g.font='400 '+fs+'px "Anton","Inter Tight",sans-serif';g.textAlign='center';g.fillText('MARZOUKEUR',x,cy-bh*.05)}
    g.restore();
    /* bras : ils se lèvent quand il mange */
    g.strokeStyle=skin;g.lineCap='round';g.lineWidth=16+F*22;var ay=cy-bh*.15,up=S.mouth>0?1:0,w=Math.sin(S.t*8)*(.15+up*.5);
    g.beginPath();g.moveTo(x-bw*.9,ay);g.quadraticCurveTo(x-bw*1.05-20,ay-10,x-bw*1.0-14,ay-34-up*24-w*20);g.stroke();
    g.beginPath();g.moveTo(x+bw*.9,ay);g.quadraticCurveTo(x+bw*1.05+20,ay-10,x+bw*1.0+14,ay-34-up*24+w*20);g.stroke();
    g.fillStyle=skin;g.beginPath();g.arc(x-bw*1.0-14,ay-34-up*24-w*20,10+F*8,0,7);g.arc(x+bw*1.0+14,ay-34-up*24+w*20,10+F*8,0,7);g.fill();
    /* tête */
    var hr=34+F*22,hy=cy-bh/2-hr*.7-jig*3;
    if(F>.15){g.fillStyle=skinD;g.beginPath();g.ellipse(x,hy+hr*.85,hr*(.8+F*.6),hr*.32,0,0,7);g.fill()}
    g.fillStyle=skin;g.beginPath();g.ellipse(x,hy,hr*(1+F*.35),hr,0,0,7);g.fill();
    g.fillStyle='rgba(226,54,27,'+(.18+F*.3)+')';g.beginPath();g.ellipse(x-hr*.62,hy+hr*.2,hr*.24,hr*.16,0,0,7);g.ellipse(x+hr*.62,hy+hr*.2,hr*.24,hr*.16,0,0,7);g.fill();
    /* casquette avec le M */
    if(poor){g.fillStyle='#4a4038';g.beginPath();g.ellipse(x,hy-hr*.65,hr*.95,hr*.4,0,Math.PI,0);g.fill()}
    else{g.fillStyle=INK;g.beginPath();g.ellipse(x,hy-hr*.5,hr*1.04,hr*.6,0,Math.PI,0);g.fill();g.beginPath();g.ellipse(x+hr*.55,hy-hr*.5,hr*.9,hr*.14,0,0,7);g.fill();
      g.fillStyle=RED;g.font='400 '+Math.round(hr*.5)+'px "Anton",sans-serif';g.textAlign='center';g.fillText('M',x,hy-hr*.62)}
    /* yeux (clignent), sourcils */
    var ey=hy-hr*.12,ex=hr*.36,blink=S.blink<.12;g.fillStyle=INK;g.strokeStyle=INK;g.lineWidth=3;
    if(S.face<0||poor){g.beginPath();g.moveTo(x-ex-8,ey-4);g.lineTo(x-ex+8,ey+2);g.moveTo(x+ex+8,ey-4);g.lineTo(x+ex-8,ey+2);g.stroke()}
    else if(blink){g.beginPath();g.moveTo(x-ex-6,ey);g.lineTo(x-ex+6,ey);g.moveTo(x+ex-6,ey);g.lineTo(x+ex+6,ey);g.stroke()}
    else{g.beginPath();g.arc(x-ex,ey,5.5,0,7);g.arc(x+ex,ey,5.5,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x-ex+1.8,ey-1.8,1.8,0,7);g.arc(x+ex+1.8,ey-1.8,1.8,0,7);g.fill();
      if(S.combo>=5){g.fillStyle=YEL;g.font='14px sans-serif';g.textAlign='center';g.fillText('★',x-ex,ey+5);g.fillText('★',x+ex,ey+5)}}
    /* bouche */
    var my=hy+hr*.42;g.fillStyle='#7a1a10';
    if(S.mouth>0||S.aspi>0){var mo=S.aspi>0?1:Math.min(1,S.mouth*3);g.beginPath();g.ellipse(x,my,hr*.34,hr*.26*mo+3,0,0,7);g.fill();g.fillStyle='#e2617a';g.beginPath();g.ellipse(x,my+hr*.12*mo,hr*.18,hr*.08*mo+1,0,0,7);g.fill()}
    else if(S.face<0||poor){g.lineWidth=4;g.strokeStyle='#7a1a10';g.beginPath();g.arc(x,my+12,hr*.25,Math.PI*1.15,Math.PI*1.85);g.stroke()}
    else{g.lineWidth=4;g.strokeStyle='#7a1a10';g.beginPath();g.arc(x,my-6,hr*.25,Math.PI*.15,Math.PI*.85);g.stroke()}
    /* sueur quand il est très gros */
    if(F>.5&&!poor){g.fillStyle='#8fd0ff';var sw=(S.t*1.3)%1;g.beginPath();g.ellipse(x+hr*1.1,hy-hr*.2+sw*30,3,5,0,0,7);g.fill()}
    /* aspirateur : un cône d'aspiration */
    if(S.aspi>0){g.fillStyle='rgba(58,106,216,'+(.12+Math.sin(S.t*20)*.05)+')';g.beginPath();g.moveTo(x-12,my);g.lineTo(x-200,0);g.lineTo(x+200,0);g.lineTo(x+12,my);g.fill()}
    g.restore();
    return {my:my,hr:hr};
  }
  function scene(g){
    if(S.poor){var sk=g.createLinearGradient(0,0,0,H);sk.addColorStop(0,'#5a6470');sk.addColorStop(1,'#8a8f94');g.fillStyle=sk;g.fillRect(0,0,W,H);
      g.fillStyle='#3a3a40';for(var i=0;i<8;i++)g.fillRect(i*130-20,120+(i%3)*30,110,400);g.fillStyle='#6a6a6e';g.fillRect(0,FLOOR,W,40);
      g.strokeStyle='rgba(200,210,220,.5)';g.lineWidth=1.5;for(var r=0;r<90;r++){var rx=(r*97+S.t*330)%W,ry=(r*53+S.t*500)%H;g.beginPath();g.moveTo(rx,ry);g.lineTo(rx-4,ry+14);g.stroke()}return}
    /* le resto : carrelage, comptoir, néon, menu au mur */
    g.fillStyle=CR;g.fillRect(0,0,W,H);
    g.fillStyle='#e8e0d0';for(var x=0;x<W;x+=60)for(var y=0;y<FLOOR;y+=60)if((x+y)/60%2)g.fillRect(x,y,60,60);
    g.fillStyle=INK;g.fillRect(0,FLOOR,W,40);g.fillStyle=RED;g.fillRect(0,FLOOR,W,6);
    var on=Math.sin(S.t*3)>-.8;g.save();g.font='400 46px "Anton","Inter Tight",sans-serif';g.textAlign='center';
    g.shadowColor=RED;g.shadowBlur=on?18:0;g.fillStyle=on?RED:'#a8988a';g.fillText('MARZOUKEUR BURGER',W/2,66);g.restore();
    g.fillStyle=INK;rr(g,40,100,150,96,4);g.fill();g.fillStyle=CR;g.font='700 11px "IBM Plex Mono",monospace';g.textAlign='left';
    [['BURGER','2€'],['MAXI','5€'],['FRITES','1€'],['SHAKE','3€']].forEach(function(m,i){g.fillText(m[0],52,124+i*18);g.textAlign='right';g.fillText(m[1],176,124+i*18);g.textAlign='left'});
    g.fillStyle=INK;rr(g,W-190,100,150,96,4);g.fill();g.fillStyle=YEL;g.font='700 11px "IBM Plex Mono",monospace';g.fillText('RECORD',W-178,124);g.fillStyle=CR;g.font='400 30px "Anton",sans-serif';g.fillText((S.rec||0)+' KG',W-178,166);
  }
  function catchItem(C,o,my){
    var it=ITEMS[o.t],free=S.coupon>0&&it.eur<0&&o.t!=='facture';
    if(o.t==='salade'){S.kg=Math.max(60,S.kg+it.kg);S.face=-1;S.combo=0;sfx.play('lose');float(o.x,my-40,'BEURK ! '+it.kg+' kg',GRN,1);C.shake(6);return}
    if(o.t==='facture'){S.eur+=it.eur;S.face=-1;S.combo=0;sfx.play('lose');float(o.x,my-40,'FACTURE ! -15 €',RED,1);C.shake(8);return}
    if(o.t==='piece'){S.eur+=it.eur;sfx.play('pickup');float(o.x,my-40,'+'+it.eur+' €','#b58a10');burst(o.x,o.y,YEL,8);return}
    if(o.t==='aspi'){S.aspi=6;sfx.play('win');float(W/2,200,'ASPIRATEUR À BOUFFE !','#3a6ad8',1);return}
    if(o.t==='coupon'){S.coupon=8;sfx.play('win');float(W/2,200,'COUPON : TOUT EST GRATUIT !','#7c46c8',1);return}
    S.combo++;S.comboT=2.2;S.bestCombo=Math.max(S.bestCombo,S.combo);var mult=S.combo>=10?3:S.combo>=5?2:1,kg=it.kg*mult;
    S.kg+=kg;if(!free)S.eur+=it.eur;S.mouth=.35;S.eaten++;S.jigV+=2.5+F2(kg);sfx.play('eat');burst(o.x,my,'#c98a3a',8);
    float(o.x,my-50,'+'+kg+' kg'+(mult>1?' ×'+mult:'')+(free?' · gratuit':''),o.t==='dore'?'#b58a10':INK,o.t==='dore'||o.t==='maxi');
    if(S.combo===5||S.combo===10){float(W/2,160,'COMBO ×'+(S.combo===10?3:2)+' !',RED,1);sfx.play('win')}
    if(o.t==='maxi'||o.t==='dore')C.shake(4);
  }
  function F2(k){return Math.min(3,k/4)}

  PP._marz=function(){return S};
  PP.arcade({id:'marz',
    setup:function(C){reset();S.rec=C.best('kg')||0;C.keysText('Glisse le doigt ou la souris (ou <kbd>←</kbd><kbd>→</kbd>) pour placer sa bouche sous la bouffe · évite la salade et les factures · enchaîne pour les combos');
      C.over('Marzoukeur','Fais grossir Marzoukeur à coups de burgers. Chaque burger coûte des sous : quand le porte-monnaie est vide, il est ruiné.<br>Enchaîne sans rater pour les <b>combos</b>, attrape les <b>pièces</b>, l\'<b>aspirateur</b> et le <b>coupon gratuit</b>. Évite la <b>salade</b> et les <b>factures</b>.<br>Record : <b>'+S.rec+' kg</b>','Manger !');this.draw(C)},
    start:function(C){var rec=S.rec;reset();S.rec=rec;sfx.play('go')},
    mouse:function(C,t,x){if(t!=='up')S.tgt=x},
    step:function(C,dt){
      S.t+=dt;S.blink-=dt;if(S.blink<0)S.blink=2+Math.random()*3;
      S.shownKg+=(S.kg-S.shownKg)*Math.min(1,dt*6);
      S.jigV+=(-S.jig*60-S.jigV*6)*dt;S.jig+=S.jigV*dt;
      S.parts.forEach(function(c){c.t-=dt;c.vy+=600*dt;c.x+=c.vx*dt;c.y+=c.vy*dt});S.parts=S.parts.filter(function(c){return c.t>0});
      S.floats.forEach(function(o){o.life-=dt;o.y-=50*dt});S.floats=S.floats.filter(function(o){return o.life>0});
      if(S.over)return;
      var k=C.keys,heavy=1-Math.min(.6,(S.kg-70)/500),sp=640*heavy,ox=S.x;
      if(k.ArrowLeft||k.KeyA||k.KeyQ){S.tgt=null;S.x-=sp*dt}if(k.ArrowRight||k.KeyD){S.tgt=null;S.x+=sp*dt}
      if(S.tgt!=null)S.x+=(S.tgt-S.x)*Math.min(1,dt*11*heavy);S.x=Math.max(70,Math.min(890,S.x));
      S.vx=(S.x-ox)/Math.max(dt,.001);S.lean+=((Math.max(-1,Math.min(1,S.vx/500)))-S.lean)*Math.min(1,dt*8);
      S.speed=1+S.t/45;S.spawn-=dt;
      if(S.spawn<=0){S.spawn=Math.max(.26,.82-S.t/90);var tp=pickType(),it=ITEMS[tp];S.items.push({t:tp,x:60+Math.random()*840,y:-40,r:it.r,vy:(150+Math.random()*90)*S.speed,rot:(Math.random()-.5)*.4,vr:(Math.random()-.5)*2})}
      S.mouth=Math.max(0,S.mouth-dt);if(S.face<0)S.face=Math.min(0,S.face+dt);S.shake=Math.max(0,S.shake-dt);
      S.aspi=Math.max(0,S.aspi-dt);S.coupon=Math.max(0,S.coupon-dt);if(S.comboT>0){S.comboT-=dt;if(S.comboT<=0)S.combo=0}
      var F=Math.max(0,(S.kg-70)/230),hr=34+F*22,bh=92+F*70,cy=FLOOR-bh/2-38,my=cy-bh/2-hr*.7+hr*.42,catchW=hr*.75+22;
      for(var i=S.items.length-1;i>=0;i--){var o=S.items[i];o.y+=o.vy*dt;o.rot+=o.vr*dt;
        if(S.aspi>0&&ITEMS[o.t].kg>0&&o.y<my){o.x+=(S.x-o.x)*Math.min(1,dt*3);}
        if(Math.abs(o.y-my)<28&&Math.abs(o.x-S.x)<catchW){S.items.splice(i,1);catchItem(C,o,my);
          var st=stageOf(S.kg);if(st>S.stage){S.stage=st;sfx.play('win');C.pop(STAGES[st][1].toUpperCase()+' !',RED,'64px');C.shake(10);burst(S.x,my,RED,20)}
          S.max=Math.max(S.max,S.kg);
          if(S.eur<=0){S.eur=0;S.over=true;S.poor=true;S.items=[];S.mouth=0;S.aspi=0;C.stop();sfx.play('lose');var nb=C.best('kg',Math.round(S.max));if(S.max>=230)C.win();
            var self=this;setTimeout(function(){C.over('Marzoukeur est ruiné','Il a tout claqué en burgers. Record de la partie : <b>'+Math.round(S.max)+' kg</b> ('+STAGES[stageOf(S.max)][1]+'), '+S.eaten+' trucs mangés, meilleur combo ×'+S.bestCombo+'.'+(nb?'<br><b>Nouveau record !</b>':'<br>Record : '+C.best('kg')+' kg'),'Recommencer')},1000)}
          continue}
        if(o.y>FLOOR-10){if(ITEMS[o.t].kg>0&&o.t!=='salade'){burst(o.x,FLOOR,'#c98a3a',4);if(S.combo>=3)float(o.x,FLOOR-30,'raté…','#8a7a66')}if(ITEMS[o.t].kg>0)S.combo=0;S.items.splice(i,1)}}
      C.hud('<span>Poids <b>'+Math.round(S.kg)+' kg</b></span><span>Porte-monnaie <b>'+Math.round(S.eur)+' €</b></span><span>'+STAGES[stageOf(S.kg)][1]+'</span>'+(S.combo>1?'<span>Combo <b>×'+S.combo+'</b></span>':''))},
    draw:function(C){var g=C.g;if(!S)reset();S.g=g;g.save();if(S.shake>0)g.translate((Math.random()-.5)*10,(Math.random()-.5)*10);
      scene(g);
      S.items.forEach(function(o){item(g,o)});
      guy(S.x);
      S.parts.forEach(function(c){g.fillStyle=c.c;g.fillRect(c.x,c.y,c.s,c.s)});
      S.floats.forEach(function(o){g.globalAlpha=Math.min(1,o.life*2);g.fillStyle=o.c;g.font=(o.big?'400 30px "Anton"':'700 16px "IBM Plex Mono"')+',sans-serif';g.textAlign='center';g.fillText(o.t,o.x,o.y);g.globalAlpha=1});
      if(S.poor){g.save();g.translate(S.x+150,470);g.rotate(-.06);g.fillStyle='#b8925a';g.fillRect(-80,-46,160,72);g.fillStyle=INK;g.font='700 15px "IBM Plex Mono",monospace';g.textAlign='center';g.fillText('J\'AI TOUT MIS',0,-18);g.fillText('DANS LES BURGERS',0,2);g.fillText('1 € SVP',0,22);g.restore();
        g.fillStyle='#8a8a8a';g.beginPath();g.ellipse(S.x-150,500,26,8,0,0,7);g.fill();g.fillStyle='#d4a32a';g.beginPath();g.arc(S.x-156,496,5,0,7);g.fill()}
      else{
        /* porte-monnaie, poids, bonus en cours */
        g.fillStyle=INK;g.fillRect(20,20,240,22);g.fillStyle=S.eur<25?RED:GRN;g.fillRect(23,23,234*Math.min(1,S.eur/100),16);g.fillStyle=CR;g.font='700 12px "IBM Plex Mono",monospace';g.textAlign='left';g.fillText('PORTE-MONNAIE  '+Math.round(S.eur)+' €',30,36);
        var by=50;[['aspi','ASPIRATEUR','#3a6ad8',6],['coupon','GRATUIT','#7c46c8',8]].forEach(function(b){if(S[b[0]]>0){g.fillStyle=b[2];g.fillRect(20,by,240*S[b[0]]/b[3],14);g.fillStyle='#fff';g.font='700 10px "IBM Plex Mono",monospace';g.fillText(b[1],26,by+11);by+=18}});
        if(S.combo>1){g.save();g.translate(W-110,250);var sc=1+Math.max(0,S.comboT-1.9)*2;g.scale(sc,sc);g.fillStyle=S.combo>=10?RED:S.combo>=5?'#d4a32a':INK;g.font='400 40px "Anton",sans-serif';g.textAlign='center';g.fillText('×'+S.combo,0,0);g.font='700 11px "IBM Plex Mono",monospace';g.fillText('COMBO',0,18);g.restore()}
        g.fillStyle=INK;g.font='400 22px "Anton",sans-serif';g.textAlign='right';g.fillText(Math.round(S.shownKg)+' KG · '+STAGES[stageOf(S.kg)][1].toUpperCase(),W-20,40);
      }
      g.restore()}
  });
})();
