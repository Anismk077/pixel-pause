/* Pixel Pause — Casino : Blackjack, Poker (Texas Hold'em contre 3 bots) et la Roue.
   Jetons virtuels uniquement (aucun argent réel). Les trois jeux partagent la même réserve de jetons. */
(function(){
  'use strict';
  var sfx=PP.sfx,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',BLU='#3fa9ff',GRN='#3fe09a',FELT='#1f5a3c',FELT2='#17462f',W=960,H=540;
  function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
  function txt(g,s,x,y,size,col,al){g.font='400 '+size+'px Anton, Impact, sans-serif';g.fillStyle=col||CR;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,x,y)}
  function mono(g,s,x,y,size,col,al){g.font='700 '+size+'px "IBM Plex Mono", monospace';g.fillStyle=col||CR;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(s,x,y)}

  /* ---------- jetons partagés ---------- */
  var BANK={get:function(){if(!PP.store('cs-init')){PP.store('cs-init',1);PP.store('cs-chips',1000)}return Math.max(0,Math.round(PP.store('cs-chips')))},
    set:function(v){PP.store('cs-chips',Math.max(0,Math.round(v)))},add:function(d){BANK.set(BANK.get()+d)}};
  function refillOk(){return BANK.get()<10}
  function refill(C){BANK.set(1000);sfx.play('pickup');C.pop('+1000 JETONS',YEL,'54px')}
  function record(C){C.best('chips',BANK.get())}

  /* ---------- boutons dessinés sur le canvas (souris, doigt et clavier) ---------- */
  function UI(){return {btns:[],mx:-1,my:-1}}
  function button(U,g,x,y,w,h,label,fn,o){o=o||{};var off=!!o.off,hov=!off&&U.mx>=x&&U.mx<=x+w&&U.my>=y&&U.my<=y+h;
    g.fillStyle=off?'#3a3632':(o.col||RED);if(hov&&!off)g.fillStyle=o.hcol||'#f05a3e';rr(g,x,y,w,h,10);g.fill();
    if(o.sel){g.strokeStyle=YEL;g.lineWidth=3;rr(g,x-2,y-2,w+4,h+4,12);g.stroke()}
    mono(g,label,x+w/2,y+h/2+(o.sub?-7:0),o.size||15,off?'#7a746c':(o.tc||CR));if(o.sub)mono(g,o.sub,x+w/2,y+h/2+11,11,off?'#6a645c':'rgba(241,236,226,.75)');
    if(!off)U.btns.push({x:x,y:y,w:w,h:h,fn:fn,key:o.key})}
  function clickUI(U,x,y){for(var i=U.btns.length-1;i>=0;i--){var b=U.btns[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.fn();return true}}return false}
  function keyUI(U,code){for(var i=0;i<U.btns.length;i++){var b=U.btns[i];if(b.key&&(b.key===code||(Array.isArray(b.key)&&b.key.indexOf(code)>=0))){b.fn();return true}}return false}

  /* ---------- cartes ---------- */
  var SU=['♠','♥','♦','♣'],RK={11:'V',12:'D',13:'R',14:'A'};
  function deck(n){var d=[];for(var k=0;k<(n||1);k++)for(var s=0;s<4;s++)for(var r=2;r<=14;r++)d.push({r:r,s:s});for(var i=d.length-1;i>0;i--){var j=Math.random()*(i+1)|0,t=d[i];d[i]=d[j];d[j]=t}return d}
  function rname(r){return RK[r]||String(r)}
  var CW=70,CHh=100;
  function card(g,c,x,y,hidden,sc){sc=sc||1;var w=CW*sc,h=CHh*sc,a=c&&c.a!=null?Math.min(1,c.a):1;
    if(a<1){var fx=860,fy=40,ea=ease(Math.max(0,a));x=fx+(x-fx)*ea;y=fy+(y-fy)*ea}
    g.save();g.fillStyle='rgba(0,0,0,.3)';rr(g,x+3,y+4,w,h,8*sc);g.fill();
    if(hidden||!c){g.fillStyle='#b52a17';rr(g,x,y,w,h,8*sc);g.fill();g.strokeStyle=CR;g.lineWidth=3*sc;rr(g,x+5*sc,y+5*sc,w-10*sc,h-10*sc,5*sc);g.stroke();
      g.fillStyle='rgba(241,236,226,.25)';for(var i=0;i<4;i++)for(var j=0;j<6;j++)if((i+j)%2===0)g.fillRect(x+10*sc+i*12.5*sc,y+10*sc+j*13.5*sc,12.5*sc,13.5*sc);g.restore();return}
    g.fillStyle='#fbf8f1';rr(g,x,y,w,h,8*sc);g.fill();g.strokeStyle='rgba(20,18,16,.25)';g.lineWidth=1.5;g.stroke();
    var col=c.s===1||c.s===2?'#d2281a':INK,rs=rname(c.r);
    g.font='700 '+Math.round(22*sc)+'px "IBM Plex Mono", monospace';g.fillStyle=col;g.textAlign='left';g.textBaseline='top';g.fillText(rs,x+6*sc,y+5*sc);
    g.font=Math.round(18*sc)+'px serif';g.fillText(SU[c.s],x+7*sc,y+29*sc);
    g.font=Math.round(44*sc)+'px serif';g.textAlign='center';g.textBaseline='middle';g.fillText(SU[c.s],x+w/2+6*sc,y+h/2+10*sc);
    if(c.hl){g.strokeStyle=YEL;g.lineWidth=4;rr(g,x-2,y-2,w+4,h+4,9*sc);g.stroke()}
    g.restore()}
  function ease(t){return 1-Math.pow(1-t,3)}
  function animCards(list,dt){list.forEach(function(c){if(c&&c.a!=null&&c.a<1)c.a+=dt*4.5})}
  function chip(g,x,y,v,r){r=r||18;var col=v>=500?'#7b3fd1':v>=100?INK:v>=50?BLU:v>=25?GRN:RED;
    g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.arc(x+2,y+3,r,0,7);g.fill();g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,7);g.fill();
    g.strokeStyle=CR;g.lineWidth=r*.22;g.setLineDash([r*.45,r*.45]);g.beginPath();g.arc(x,y,r*.82,0,7);g.stroke();g.setLineDash([]);
    g.fillStyle=CR;g.beginPath();g.arc(x,y,r*.55,0,7);g.fill();mono(g,v>=1000?(v/1000)+'k':String(v),x,y+1,Math.round(r*.55),INK)}
  function table(g,title){var gr=g.createRadialGradient(480,250,60,480,270,620);gr.addColorStop(0,'#2a7a52');gr.addColorStop(1,FELT2);g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(243,198,35,.35)';g.lineWidth=3;g.beginPath();g.ellipse(480,250,420,205,0,0,7);g.stroke();
    if(title){g.globalAlpha=.12;txt(g,title,480,250,74,CR);g.globalAlpha=1}}
  function bankBar(g,extra){g.fillStyle='rgba(20,18,16,.75)';rr(g,12,12,220,40,10);g.fill();chip(g,36,32,100,13);mono(g,BANK.get()+' jetons',58,32,16,YEL,'left');if(extra)mono(g,extra,948,32,14,CR,'right')}

  /* =====================================================================
     BLACKJACK
     ===================================================================== */
  (function(){
    var S,U,SHOE=[];
    function draw1(){if(SHOE.length<60)SHOE=deck(6);var c=SHOE.pop();c.a=0;return c}
    function val(h){var t=0,a=0;h.forEach(function(c){if(c.r===14){a++;t+=11}else t+=Math.min(10,c.r)});while(t>21&&a){t-=10;a--}return {t:t,soft:a>0}}
    function bj(h){return h.length===2&&val(h).t===21}
    function fresh(){return {phase:'bet',bet:Math.min(50,BANK.get())||0,ph:[],dh:[],hide:true,msg:'',msgc:CR,t:0,stake:0,dbl:false,last:0}}
    function addBet(v){if(S.phase!=='bet')return;if(S.bet+v>BANK.get()){PP.toast('Pas assez de jetons','warn');return}S.bet+=v;sfx.play('ui')}
    function deal(C){if(S.phase!=='bet'||S.bet<10)return;if(S.bet>BANK.get()){S.bet=BANK.get();return}
      BANK.add(-S.bet);S.stake=S.bet;S.last=S.bet;S.dbl=false;S.ph=[];S.dh=[];S.hide=true;S.msg='';S.phase='deal';S.q=['p','d','p','d'];S.t=0;sfx.play('go')}
    function finish(C,res){S.phase='done';S.hide=false;var win=0;
      if(res==='bj'){win=Math.floor(S.stake*2.5);S.msg='BLACKJACK ! +'+(win-S.stake);S.msgc=YEL;C.pop('BLACKJACK !',YEL,'80px');sfx.play('win');C.win()}
      else if(res==='win'){win=S.stake*2;S.msg='Gagné ! +'+S.stake;S.msgc=GRN;C.pop('GAGNÉ !',GRN,'80px');sfx.play('win');C.win()}
      else if(res==='push'){win=S.stake;S.msg='Égalité : mise rendue';S.msgc=CR;sfx.play('ui')}
      else{S.msg=res==='bust'?'Tu dépasses 21 : perdu':'Le croupier gagne';S.msgc=RED;sfx.play('lose');if(res==='bust')C.shake(5)}
      BANK.add(win);record(C);if(S.bet>BANK.get())S.bet=Math.max(0,Math.min(S.last,BANK.get()))}
    function afterDeal(C){var pb=bj(S.ph),up=S.dh[0].r,db=bj(S.dh);
      if(pb||((up===14||up>=10)&&db)){S.hide=false;finish(C,pb&&db?'push':pb?'bj':'lose');return}S.phase='play'}
    function hit(C){if(S.phase!=='play')return;S.ph.push(draw1());sfx.play('ui');var v=val(S.ph).t;if(v>21)finish(C,'bust');else if(v===21)stand(C)}
    function stand(C){if(S.phase!=='play')return;S.phase='dealer';S.hide=false;S.t=.6}
    function dbl(C){if(S.phase!=='play'||S.ph.length!==2||BANK.get()<S.stake)return;BANK.add(-S.stake);S.stake*=2;S.dbl=true;S.ph.push(draw1());sfx.play('ui');if(val(S.ph).t>21)finish(C,'bust');else stand(C)}
    PP.arcade({id:'bj',
      setup:function(C){S=fresh();U=UI();C.keysText('Clique les boutons · <kbd>1</kbd>-<kbd>5</kbd> jetons · <kbd>Espace</kbd> distribuer · <kbd>H</kbd> carte · <kbd>S</kbd> rester · <kbd>D</kbd> doubler · jetons virtuels, pas d\'argent réel');
        C.over('Blackjack','Approche-toi de 21 sans dépasser et bats le croupier. Le blackjack paie 3 contre 2, le croupier tire jusqu\'à 17. Tu as <b>'+BANK.get()+' jetons</b> (virtuels).','Jouer')},
      start:function(C){S=fresh()},
      step:function(C,dt){animCards(S.ph.concat(S.dh),dt);
        if(S.phase==='deal'){S.t-=dt;if(S.t<=0&&S.q.length){var w=S.q.shift();(w==='p'?S.ph:S.dh).push(draw1());sfx.play('ui');S.t=.28;if(!S.q.length)S.t=.35}else if(S.t<=0)afterDeal(C)}
        if(S.phase==='dealer'){S.t-=dt;if(S.t<=0){var d=val(S.dh).t;if(d<17){S.dh.push(draw1());sfx.play('ui');S.t=.6}else{var p=val(S.ph).t;finish(C,d>21||p>d?'win':p===d?'push':'lose')}}}},
      mouse:function(C,t,x,y){U.mx=x;U.my=y;if(t==='down'&&C.running)clickUI(U,x,y)},
      key:function(C,k,down){if(!down||!C.running)return;keyUI(U,k)},
      draw:function(C){var g=C.g;U.btns=[];table(g,'BLACKJACK');bankBar(g,'Le blackjack paie 3:2');
        mono(g,'CROUPIER',480,70,13,'rgba(241,236,226,.6)');mono(g,'TOI',480,300,13,'rgba(241,236,226,.6)');
        var i;for(i=0;i<S.dh.length;i++)card(g,S.dh[i],480-S.dh.length*40+i*80,88,i===1&&S.hide);
        for(i=0;i<S.ph.length;i++)card(g,S.ph[i],480-S.ph.length*40+i*80,318);
        if(S.dh.length){var dv=S.hide?val([S.dh[0]]).t:val(S.dh).t;g.fillStyle=INK;rr(g,480+S.dh.length*40+10,122,52,32,8);g.fill();mono(g,String(dv),480+S.dh.length*40+36,138,17,CR)}
        if(S.ph.length){var pv=val(S.ph);g.fillStyle=pv.t>21?RED:INK;rr(g,480+S.ph.length*40+10,352,52,32,8);g.fill();mono(g,(pv.soft&&pv.t<21?'~':'')+pv.t,480+S.ph.length*40+36,368,17,CR)}
        if(S.stake&&S.phase!=='bet'){chip(g,300,370,S.stake,24);mono(g,'mise '+S.stake+(S.dbl?' (doublée)':''),300,408,12,CR)}
        if(S.msg){g.fillStyle='rgba(20,18,16,.8)';rr(g,330,232,300,46,12);g.fill();txt(g,S.msg,480,256,26,S.msgc)}
        if(!C.running)return;
        if(S.phase==='bet'||S.phase==='done'){
          if(refillOk()&&S.bet<10){button(U,g,355,455,250,58,'Recharger 1000 jetons',function(){refill(C);S.bet=50},{col:'#7b3fd1',key:'Space',sub:'jetons gratuits'});return}
          if(S.phase==='done'){button(U,g,380,455,200,58,'Nouvelle main',function(){S.phase='bet';S.ph=[];S.dh=[];S.msg='';S.stake=0;if(S.bet>BANK.get())S.bet=BANK.get()},{key:['Space','Enter']});return}
          [10,25,50,100,500].forEach(function(v,k){var x=60+k*62;chip(g,x+22,484,v,22);U.btns.push({x:x,y:460,w:46,h:48,fn:function(){addBet(v)},key:'Digit'+(k+1)})});
          mono(g,'MISE',420,470,12,'rgba(241,236,226,.6)');txt(g,String(S.bet),420,496,30,YEL);
          button(U,g,480,458,110,52,'Effacer',function(){S.bet=0;sfx.play('ui')},{col:'#3a3632',hcol:'#4a4642'});
          button(U,g,605,458,170,52,'Distribuer',function(){deal(C)},{off:S.bet<10||S.bet>BANK.get(),key:['Space','Enter'],sub:'Espace'});
          if(S.bet<10)mono(g,'Mise minimum : 10',690,522,11,'rgba(241,236,226,.6)')}
        else if(S.phase==='play'){
          button(U,g,250,455,140,58,'Carte',function(){hit(C)},{key:'KeyH',sub:'H'});
          button(U,g,410,455,140,58,'Rester',function(){stand(C)},{key:'KeyS',sub:'S',col:'#3a3632',hcol:'#4a4642'});
          button(U,g,570,455,140,58,'Doubler',function(){dbl(C)},{key:'KeyD',sub:'D',col:'#7b3fd1',hcol:'#8f55e6',off:S.ph.length!==2||BANK.get()<S.stake})}
      }});
  })();

  /* =====================================================================
     POKER — Texas Hold'em, toi contre 3 bots, petite blinde 10 / grosse 20
     ===================================================================== */
  /* valeur d'une main de 5 à 7 cartes : plus le nombre est grand, meilleure est la main */
  var HN=['Hauteur','Paire','Deux paires','Brelan','Suite','Couleur','Full','Carré','Quinte flush'];
  function straightHigh(mask){if((mask&0x403C)===0x403C)return 5;for(var h=14;h>=5;h--){var ok=true;for(var k=0;k<5;k++)if(!(mask&(1<<(h-k)))){ok=false;break}if(ok)return h}return 0}
  function evalH(cs){var cnt=[],suitM=[0,0,0,0],suitN=[0,0,0,0],mask=0,i;for(i=0;i<15;i++)cnt[i]=0;
    cs.forEach(function(c){cnt[c.r]++;suitM[c.s]|=1<<c.r;suitN[c.s]++;mask|=1<<c.r});
    function sc(cat,ks){var v=cat;for(var k=0;k<5;k++)v=v*15+(ks[k]||0);return v}
    for(i=0;i<4;i++)if(suitN[i]>=5){var sf=straightHigh(suitM[i]);if(sf)return sc(8,[sf])}
    var quads=[],trips=[],pairs=[],singles=[];for(var r=14;r>=2;r--){if(cnt[r]===4)quads.push(r);else if(cnt[r]===3)trips.push(r);else if(cnt[r]===2)pairs.push(r);else if(cnt[r]===1)singles.push(r)}
    function kick(ex,n){var out=[];for(var r=14;r>=2&&out.length<n;r--)if(cnt[r]&&ex.indexOf(r)<0)out.push(r);return out}
    if(quads.length)return sc(7,[quads[0]].concat(kick([quads[0]],1)));
    if(trips.length&&(trips.length>1||pairs.length)){var t=trips[0],p=Math.max(trips[1]||0,pairs[0]||0);return sc(6,[t,p])}
    for(i=0;i<4;i++)if(suitN[i]>=5){var fl=[];for(r=14;r>=2&&fl.length<5;r--)if(suitM[i]&(1<<r))fl.push(r);return sc(5,fl)}
    var st=straightHigh(mask);if(st)return sc(4,[st]);
    if(trips.length)return sc(3,[trips[0]].concat(kick([trips[0]],2)));
    if(pairs.length>=2)return sc(2,[pairs[0],pairs[1]].concat(kick([pairs[0],pairs[1]],1)));
    if(pairs.length)return sc(1,[pairs[0]].concat(kick([pairs[0]],3)));
    return sc(0,kick([],5))}
  function catOf(v){return Math.floor(v/759375)}
  PP._evalH=evalH;
  (function(){
    var S,U,SB=10,BB=20,NAMES=['Toi','Léa','Momo','Zed'],SEAT=[[480,440],[120,250],[480,78],[840,250]];
    function newTable(){var me=BANK.get();return {pl:NAMES.map(function(n,i){return {n:n,st:i?1000:me,bot:i>0,cards:[],fold:false,allin:false,bet:0,tot:0,acted:false,out:false,last:''}}),dealer:Math.random()*4|0,board:[],phase:'idle',cur:-1,max:0,minR:BB,t:0,msg:'',hand:0,wins:null}}
    function active(){return S.pl.filter(function(p){return !p.out&&!p.fold})}
    function pot(){return S.pl.reduce(function(a,p){return a+p.tot},0)}
    function nextIdx(i,f){for(var k=1;k<=4;k++){var j=(i+k)%4;if(f(S.pl[j]))return j}return -1}
    function syncMe(){BANK.set(S.pl[0].st)}
    function put(p,a){a=Math.min(a,p.st);p.st-=a;p.bet+=a;p.tot+=a;if(p.st===0)p.allin=true;return a}
    function newHand(C){
      S.pl.forEach(function(p,i){if(i&&p.st<=0)p.out=true});
      if(S.pl[0].st<=0){S.phase='broke';return}
      if(S.pl.every(function(p,i){return !i||p.out})){S.msg='Tu as ruiné les 3 bots ! Ils reviennent avec 1000 jetons.';C.pop('TABLE GAGNÉE !',YEL,'70px');C.win();sfx.play('win');S.pl.forEach(function(p,i){if(i){p.st=1000;p.out=false}})}
      S.hand++;S.board=[];S.deck=deck(1);S.wins=null;S.max=0;S.minR=BB;
      S.pl.forEach(function(p){p.cards=[];p.fold=p.out;p.allin=false;p.bet=0;p.tot=0;p.acted=false;p.last='';p.show=false});
      S.dealer=nextIdx(S.dealer,function(p){return !p.out});
      var live=S.pl.filter(function(p){return !p.out}).length,sb=live===2?S.dealer:nextIdx(S.dealer,function(p){return !p.out}),bb=nextIdx(sb,function(p){return !p.out});
      put(S.pl[sb],SB);S.pl[sb].last='Petite blinde';put(S.pl[bb],BB);S.pl[bb].last='Grosse blinde';S.max=BB;
      for(var r=0;r<2;r++)S.pl.forEach(function(p){if(!p.out){var c=S.deck.pop();c.a=-.15*r;p.cards.push(c)}});
      S.phase='pre';S.cur=nextIdx(bb,function(p){return !p.out&&!p.fold&&!p.allin});S.t=.8;S.msg='';sfx.play('go');syncMe();
      if(S.cur<0)runOut(C)}
    function canAct(p){return !p.out&&!p.fold&&!p.allin}
    function roundDone(){var a=S.pl.filter(canAct);return a.every(function(p){return p.acted&&p.bet===S.max})}
    function act(C,i,what,amt){var p=S.pl[i],call=S.max-p.bet;
      if(what==='fold'){p.fold=true;p.last='Se couche';sfx.play('ui')}
      else if(what==='call'){if(call>0){put(p,call);p.last=p.allin?'Tapis !':'Suit '+call;sfx.play('pickup')}else{p.last='Parole';sfx.play('tick')}}
      else if(what==='raise'){var to=Math.min(p.bet+p.st,amt),inc=to-S.max;put(p,to-p.bet);if(inc>0){if(inc>=S.minR)S.minR=inc;S.max=p.bet;S.pl.forEach(function(q){if(q!==p)q.acted=false})}p.last=p.allin?'Tapis !':'Relance à '+p.bet;sfx.play('pickup')}
      p.acted=true;syncMe();
      if(active().length===1){win1(C);return}
      if(roundDone()){nextStreet(C);return}
      S.cur=nextIdx(i,canAct);S.t=.75;if(S.cur<0)nextStreet(C)}
    function nextStreet(C){S.pl.forEach(function(p){p.bet=0;p.acted=false});S.max=0;S.minR=BB;
      if(S.board.length===5){showdown(C);return}
      var n=S.board.length?1:3;for(var k=0;k<n;k++){var c=S.deck.pop();c.a=-.12*k;S.board.push(c)}sfx.play('ui');
      S.phase=['','','','flop','turn','river'][S.board.length]||'river';
      var who=S.pl.filter(canAct);if(who.length<2){S.cur=-1;S.t=.9;S.auto=true;return}
      S.auto=false;S.cur=nextIdx(S.dealer,canAct);S.t=.9}
    function runOut(C){S.auto=true;S.cur=-1;S.t=.6}
    function win1(C){var w=active()[0],p=pot();w.st+=p;S.wins=[{i:S.pl.indexOf(w),amt:p}];S.msg=(w.bot?w.n+' remporte ':'Tu remportes ')+p+' (les autres se couchent)';if(!w.bot){C.pop('+'+p,YEL,'60px');sfx.play('win')}endHand(C)}
    function showdown(C){var cont=active();cont.forEach(function(p){p.show=true;p.score=evalH(p.cards.concat(S.board))});
      /* pots : on gère le tapis (pot principal + pots annexes) */
      var levels=[],won={};S.pl.forEach(function(p){if(p.tot>0&&levels.indexOf(p.tot)<0)levels.push(p.tot)});levels.sort(function(a,b){return a-b});var prev=0;
      levels.forEach(function(L){var part=0;S.pl.forEach(function(p){part+=Math.max(0,Math.min(p.tot,L)-prev)});var el=cont.filter(function(p){return p.tot>=L});if(!el.length)el=cont;
        var best=Math.max.apply(null,el.map(function(p){return p.score})),ws=el.filter(function(p){return p.score===best}),share=Math.floor(part/ws.length),rest=part-share*ws.length;
        ws.forEach(function(p,k){var i=S.pl.indexOf(p),a=share+(k===0?rest:0);p.st+=a;won[i]=(won[i]||0)+a});prev=L});
      S.wins=Object.keys(won).map(function(i){return {i:+i,amt:won[i]}});
      var top=S.wins.slice().sort(function(a,b){return b.amt-a.amt})[0],wp=S.pl[top.i];
      S.msg=S.wins.map(function(w){return S.pl[w.i].n+' +'+w.amt}).join(' · ')+' — '+HN[catOf(wp.score)];
      if(won[0]){C.pop(HN[catOf(S.pl[0].score)].toUpperCase()+' !',YEL,'60px');sfx.play('win');C.win()}else sfx.play('lose');
      endHand(C)}
    function endHand(C){S.phase='end';S.cur=-1;syncMe();record(C);if(S.pl[0].st<=0){S.msg+=' · Tu n\'as plus de jetons.'}}
    /* bots : chance de gagner estimée en simulant 200 fins de main au hasard */
    function equity(p){var opp=active().length-1,known=p.cards.concat(S.board),win=0,N=200;
      var rest=deck(1).filter(function(c){return !known.some(function(k){return k.r===c.r&&k.s===c.s})});
      for(var n=0;n<N;n++){for(var i=rest.length-1;i>rest.length-1-(5-S.board.length)-opp*2-1&&i>0;i--){var j=Math.random()*(i+1)|0,t=rest[i];rest[i]=rest[j];rest[j]=t}
        var k=rest.length-1,b=S.board.slice();while(b.length<5)b.push(rest[k--]);var mine=evalH(p.cards.concat(b)),best=true,tie=false;
        for(var o=0;o<opp;o++){var os=evalH([rest[k--],rest[k--]].concat(b));if(os>mine){best=false;break}if(os===mine)tie=true}
        if(best)win+=tie?.5:1}
      return win/N}
    function botMove(C,i){var p=S.pl[i],call=S.max-p.bet,eq=equity(p),pt=pot(),odds=call/(pt+call||1),r=Math.random(),agg=[0,.08,.15,.04][i];
      if(eq>.72-agg&&r<.75||(r<.06+agg*.3&&p.st>pt)){var to=S.max+Math.max(S.minR,Math.round(Math.max(BB,pt*(eq>.85?.9:.6))/10)*10);if(eq>.9&&r<.3)to=p.bet+p.st;act(C,i,'raise',to);return}
      if(call===0){act(C,i,'call');return}
      if(eq>=odds+.04||(call<=BB&&eq>.25)||(eq>.5)){act(C,i,'call');return}
      act(C,i,'fold')}
    function myCall(){var p=S.pl[0];return Math.min(p.st,S.max-p.bet)}
    function myRaiseTo(){var p=S.pl[0],to=S.max+Math.max(S.minR,BB*2);return Math.min(p.bet+p.st,to)}
    PP.arcade({id:'poker',
      setup:function(C){S=newTable();U=UI();C.keysText('Clique les boutons · <kbd>F</kbd> se coucher · <kbd>C</kbd> suivre / parole · <kbd>R</kbd> relancer · <kbd>A</kbd> tapis · jetons virtuels, pas d\'argent réel');
        C.over('Poker','Texas Hold\'em contre 3 bots. 2 cartes pour toi, 5 au milieu : fais la meilleure main de 5 cartes. Blindes 10 / 20. Tu joues avec tes <b>'+BANK.get()+' jetons</b> (virtuels).','Jouer')},
      start:function(C){if(BANK.get()<20){BANK.set(1000);C.pop('+1000 JETONS',YEL,'54px')}S=newTable();newHand(C)},
      close:function(){if(S&&S.pl)syncMe()},
      step:function(C,dt){if(!S||!S.pl)return;var all=S.board.slice();S.pl.forEach(function(p){all=all.concat(p.cards)});animCards(all,dt);
        if(S.phase==='end'||S.phase==='broke'||S.phase==='idle')return;
        S.t-=dt;if(S.t>0)return;
        if(S.auto){S.pl.forEach(function(p){if(!p.fold&&!p.out)p.show=true});nextStreet(C);S.t=1;return}
        if(S.cur>0)botMove(C,S.cur)},
      mouse:function(C,t,x,y){U.mx=x;U.my=y;if(t==='down'&&C.running)clickUI(U,x,y)},
      key:function(C,k,down){if(!down||!C.running)return;keyUI(U,k)},
      draw:function(C){var g=C.g;U.btns=[];table(g,'POKER');bankBar(g,'Main n°'+(S.hand||0)+' · blindes 10/20');
        /* tapis central */
        for(var b=0;b<5;b++){var bx=480-5*40+b*80+5;if(S.board[b])card(g,S.board[b],bx,200,false,.9);else{g.strokeStyle='rgba(241,236,226,.15)';g.lineWidth=2;rr(g,bx,200,63,90,8);g.stroke()}}
        var pt=pot();if(pt&&S.phase!=='end'){chip(g,430,306,pt>=500?500:pt>=100?100:25,15);mono(g,'POT '+pt,452,306,16,YEL,'left')}
        S.pl.forEach(function(p,i){var s=SEAT[i],x=s[0],y=s[1],me=i===0,turn=S.cur===i&&S.phase!=='end',win=S.wins&&S.wins.some(function(w){return w.i===i});
          if(p.out){g.globalAlpha=.35}
          /* cartes */
          var sc=me?1:.72,cw=CW*sc;for(var k=0;k<p.cards.length;k++){var cx=x-cw-4+k*(cw+8),cy=me?y-112:y-36;card(g,p.cards[k],cx,cy,!me&&!p.show,sc)}
          if(p.fold&&!p.out&&p.cards.length){g.fillStyle='rgba(31,90,60,.7)';g.fillRect(x-cw-6,me?y-114:y-38,cw*2+14,(me?CHh:CHh*.72)+6)}
          /* plaque du joueur */
          var px=x-80,py=me?y-2:y+42;g.fillStyle=turn?YEL:win?GRN:'rgba(20,18,16,.85)';rr(g,px,py,160,44,10);g.fill();
          mono(g,p.n+(i===S.dealer?'  Ⓓ':''),x,py+14,14,turn||win?INK:CR);mono(g,p.out?'éliminé':p.st+' jetons',x,py+31,13,turn||win?INK:YEL);
          if(p.bet>0){var bx2=me?x+170:i===2?x:x+(i===1?140:-140),by2=me?y+20:i===2?y+120:y;chip(g,bx2,by2,p.bet>=100?100:p.bet>=50?50:p.bet>=25?25:10,15);mono(g,String(p.bet),bx2,by2+24,12,CR)}
          if(p.last&&!p.out){var lx=me?x-190:x,ly=me?y+20:y+100;if(i===2){lx=x+150;ly=y+64}g.fillStyle='rgba(20,18,16,.7)';var tw=Math.max(80,p.last.length*8+16);rr(g,lx-tw/2,ly-12,tw,24,8);g.fill();mono(g,p.last,lx,ly,12,p.last==='Se couche'?'#b0a898':CR)}
          if(p.show&&!p.fold&&S.board.length>=3&&S.phase==='end'){mono(g,HN[catOf(evalH(p.cards.concat(S.board)))],me?x-150:x,me?y-60:y-48,13,YEL)}
          g.globalAlpha=1});
        if(S.msg){g.font='700 15px "IBM Plex Mono", monospace';var mw=Math.min(900,g.measureText(S.msg).width+40);g.fillStyle='rgba(20,18,16,.88)';rr(g,480-mw/2,296,mw,30,10);g.fill();mono(g,S.msg,480,311,15,CR)}
        if(!C.running)return;
        var me=S.pl[0];
        if(S.phase==='end'||S.phase==='broke'){
          if(me.st<=0){button(U,g,355,486,250,46,'Recharger 1000 jetons',function(){me.st=1000;BANK.set(1000);sfx.play('pickup');S.msg='';newHand(C)},{col:'#7b3fd1',key:['Space','Enter']})}
          else button(U,g,620,486,190,46,'Main suivante',function(){newHand(C)},{key:['Space','Enter'],sub:'Espace'});return}
        if(S.cur===0){var call=myCall(),rt=myRaiseTo();
          button(U,g,590,436,110,44,'Coucher',function(){act(C,0,'fold')},{key:'KeyF',col:'#3a3632',hcol:'#4a4642',sub:'F'});
          button(U,g,710,436,120,44,call?'Suivre '+call:'Parole',function(){act(C,0,'call')},{key:'KeyC',sub:'C'});
          button(U,g,840,436,110,44,'Relance',function(){act(C,0,'raise',rt)},{key:'KeyR',col:'#7b3fd1',hcol:'#8f55e6',sub:'à '+rt,off:me.st<=call});
          button(U,g,840,488,110,40,'Tapis',function(){act(C,0,'raise',me.bet+me.st)},{key:'KeyA',col:'#a0200f',hcol:'#c02a17',size:14})}
        else if(S.cur>0)mono(g,S.pl[S.cur].n+' réfléchit…',760,470,14,'rgba(241,236,226,.75)')
      }});
  })();

  /* =====================================================================
     LA ROUE — mise sur un multiplicateur, la roue tourne
     ===================================================================== */
  (function(){
    var S,U,SEG=[],A=Math.PI*2/54;
    var KINDS=[{k:'1',m:1,n:24,c:'#f1ece2',t:INK},{k:'2',m:2,n:15,c:BLU,t:INK},{k:'5',m:5,n:7,c:GRN,t:INK},{k:'10',m:10,n:4,c:'#7b3fd1',t:CR},{k:'20',m:20,n:2,c:YEL,t:INK},{k:'★',m:40,n:1,c:RED,t:CR},{k:'PP',m:40,n:1,c:INK,t:YEL}];
    /* répartition régulière des cases autour de la roue */
    (function(){var pos=[];KINDS.forEach(function(K,ki){for(var j=0;j<K.n;j++)pos.push({p:(j+.5)/K.n+ki*.013,k:ki})});pos.sort(function(a,b){return a.p-b.p});SEG=pos.map(function(o){return o.k})})();
    function fresh(){return {phase:'bet',rot:Math.random()*7,v:0,bets:{},unit:10,res:-1,msg:'',msgc:CR,lastSeg:-1,last:null,glow:0}}
    function total(){var t=0;for(var k in S.bets)t+=S.bets[k];return t}
    function segAt(){var a=((-Math.PI/2-S.rot)%(Math.PI*2)+Math.PI*4)%(Math.PI*2);return Math.floor(a/A)%54}
    function addBet(ki){if(S.phase!=='bet')return;if(total()+S.unit>BANK.get()){PP.toast('Pas assez de jetons','warn');return}S.bets[ki]=(S.bets[ki]||0)+S.unit;sfx.play('ui')}
    function spin(C){if(S.phase!=='bet'||!total())return;BANK.add(-total());S.last=JSON.parse(JSON.stringify(S.bets));S.phase='spin';S.v=9+Math.random()*5;S.msg='';sfx.play('go')}
    function land(C){var ki=SEG[segAt()],K=KINDS[ki],b=S.bets[ki]||0,win=b?b*(K.m+1):0,tot=total();S.res=ki;S.phase='done';S.glow=1.2;
      if(win){BANK.add(win);S.msg='×'+K.m+' ! Tu gagnes '+win+' (+'+(win-tot)+')';S.msgc=win>tot?GRN:YEL;C.pop('×'+K.m+' !',K.m>=10?YEL:GRN,K.m>=20?'110px':'80px');sfx.play('win');if(win>tot)C.win();if(K.m>=20)C.shake(8)}
      else{S.msg='La roue s\'arrête sur '+(K.k==='★'||K.k==='PP'?K.k:'×'+K.m)+' : perdu';S.msgc=RED;sfx.play('lose')}
      record(C)}
    PP.arcade({id:'roue',
      setup:function(C){S=fresh();U=UI();C.keysText('Clique une case pour miser, puis <kbd>Espace</kbd> pour lancer la roue · jetons virtuels, pas d\'argent réel');
        C.over('La Roue','Mise sur un chiffre : si la roue s\'arrête dessus, tu gagnes ta mise multipliée (×1, ×2, ×5, ×10, ×20, et ×40 pour ★ et PP). Tu as <b>'+BANK.get()+' jetons</b> (virtuels).','Jouer')},
      start:function(C){S=fresh()},
      step:function(C,dt){if(S.glow>0)S.glow-=dt;if(S.phase!=='spin')return;S.rot+=S.v*dt;S.v-=dt*(S.v>2?1.6:.9);
        var sg=segAt();if(sg!==S.lastSeg){S.lastSeg=sg;S.tick=.08;if(S.v<6)sfx.play('tick')}
        if(S.v<=0){S.v=0;land(C)}},
      mouse:function(C,t,x,y){U.mx=x;U.my=y;if(t==='down'&&C.running)clickUI(U,x,y)},
      key:function(C,k,down){if(!down||!C.running)return;keyUI(U,k)},
      draw:function(C){var g=C.g;U.btns=[];g.fillStyle='#211d1a';g.fillRect(0,0,W,H);
        var gr=g.createRadialGradient(270,280,40,270,280,330);gr.addColorStop(0,'#3a2f26');gr.addColorStop(1,'#141210');g.fillStyle=gr;g.fillRect(0,0,560,H);
        bankBar(g);
        /* roue */
        var cx=270,cy=290,R=215;g.save();g.translate(cx,cy);
        g.fillStyle='#5a3a1e';g.beginPath();g.arc(0,0,R+18,0,7);g.fill();g.fillStyle='#d4a32a';g.beginPath();g.arc(0,0,R+8,0,7);g.fill();
        for(var i=0;i<54;i++){var K=KINDS[SEG[i]],a0=S.rot+i*A;g.fillStyle=K.c;g.beginPath();g.moveTo(0,0);g.arc(0,0,R,a0,a0+A+.002);g.closePath();g.fill();
          g.strokeStyle='rgba(20,18,16,.55)';g.lineWidth=1.5;g.stroke();
          g.save();g.rotate(a0+A/2);g.translate(R-26,0);g.rotate(Math.PI/2);g.font='700 '+(K.k.length>1?13:16)+'px "IBM Plex Mono", monospace';g.fillStyle=K.t;g.textAlign='center';g.textBaseline='middle';g.fillText(K.k,0,0);g.restore()}
        for(i=0;i<54;i++){var pa=S.rot+i*A;g.fillStyle='#f3e2a0';g.beginPath();g.arc(Math.cos(pa)*(R+3),Math.sin(pa)*(R+3),3,0,7);g.fill()}
        if(S.phase==='done'&&S.glow>0&&Math.floor(S.glow*8)%2===0){var si=segAt(),ga=S.rot+si*A;g.strokeStyle=YEL;g.lineWidth=6;g.beginPath();g.arc(0,0,R-3,ga,ga+A);g.stroke()}
        g.fillStyle='#141210';g.beginPath();g.arc(0,0,58,0,7);g.fill();g.fillStyle=RED;g.beginPath();g.arc(0,0,48,0,7);g.fill();txt(g,'PIXEL',0,-9,18,CR);txt(g,'PAUSE',0,12,18,YEL);
        g.restore();
        /* flèche en haut */
        var wob=S.phase==='spin'&&S.tick>0?.25:0;if(S.tick>0)S.tick-=1/60;g.save();g.translate(cx,cy-R-14);g.rotate(wob);g.fillStyle=RED;g.strokeStyle=CR;g.lineWidth=3;g.beginPath();g.moveTo(-16,-20);g.lineTo(16,-20);g.lineTo(0,18);g.closePath();g.fill();g.stroke();g.restore();
        /* tableau des mises */
        txt(g,'TES MISES',760,40,26,CR);
        KINDS.forEach(function(K,ki){var col=ki%2,row=ki>>1,x=590+col*180,y=70+row*78,bw=160,bh=64,b=S.bets[ki]||0,hov=U.mx>=x&&U.mx<=x+bw&&U.my>=y&&U.my<=y+bh&&S.phase==='bet';
          if(ki===6){x=590+90;}
          g.fillStyle=K.c;rr(g,x,y,bw,bh,10);g.fill();if(hov){g.strokeStyle=YEL;g.lineWidth=3;g.stroke()}if(S.res===ki&&S.phase==='done'){g.strokeStyle=YEL;g.lineWidth=5;rr(g,x-3,y-3,bw+6,bh+6,12);g.stroke()}
          txt(g,K.k==='★'||K.k==='PP'?K.k:'×'+K.m,x+14,y+bh/2-6,26,K.t,'left');mono(g,(K.k==='★'||K.k==='PP'?'paie ×40 · ':'')+K.n+' case'+(K.n>1?'s':''),x+14,y+bh-12,10,K.t,'left');
          if(b){chip(g,x+bw-28,y+bh/2,b,20)}
          if(S.phase==='bet')U.btns.push({x:x,y:y,w:bw,h:bh,fn:function(){addBet(ki)}})});
        if(S.msg){g.font='700 15px "IBM Plex Mono", monospace';var mw=g.measureText(S.msg).width+30;g.fillStyle='rgba(20,18,16,.9)';rr(g,270-mw/2,500,mw,32,10);g.fill();mono(g,S.msg,270,516,15,S.msgc)}
        if(!C.running)return;
        var tot=total();
        if(S.phase==='bet'){
          mono(g,'Jeton :',600,398,13,'rgba(241,236,226,.7)','left');[10,50,100,500].forEach(function(v,k){var x=680+k*62;chip(g,x,398,v,S.unit===v?24:19);if(S.unit===v){g.strokeStyle=YEL;g.lineWidth=3;g.beginPath();g.arc(x,398,27,0,7);g.stroke()}U.btns.push({x:x-24,y:374,w:48,h:48,fn:function(){S.unit=v;sfx.play('tick')}})});
          mono(g,'Total misé : '+tot,600,440,14,YEL,'left');
          if(refillOk()&&!tot){button(U,g,600,460,330,54,'Recharger 1000 jetons',function(){refill(C)},{col:'#7b3fd1',key:'Space',sub:'jetons gratuits'});return}
          button(U,g,600,460,100,54,'Effacer',function(){S.bets={};sfx.play('ui')},{col:'#3a3632',hcol:'#4a4642',off:!tot});
          button(U,g,710,460,100,54,'Remiser',function(){var t=0;for(var k in S.last)t+=S.last[k];if(t<=BANK.get()){S.bets=JSON.parse(JSON.stringify(S.last));sfx.play('ui')}},{col:'#3a3632',hcol:'#4a4642',off:!S.last||!!tot,size:13});
          button(U,g,820,460,120,54,'Lancer',function(){spin(C)},{off:!tot,key:['Space','Enter'],sub:'Espace'})}
        else if(S.phase==='done'){button(U,g,660,460,220,54,'Nouvelle mise',function(){S.phase='bet';S.bets={};S.res=-1;S.msg=''},{key:['Space','Enter'],sub:'Espace'})}
        else mono(g,'La roue tourne…',760,480,16,CR)
      }});
  })();
})();
