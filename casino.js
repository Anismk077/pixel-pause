/* Pixel Pause — Casino : Blackjack, Poker (Texas Hold'em contre 3 bots), la Roue et la Roulette russe.
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
    /* ---------- v69 : Blackjack à plusieurs (salon). Le chef tient le sabot et le croupier ; chacun mise ses propres jetons ---------- */
    var Q=null,QU=UI(),LED={r:-1,sp:0,ga:0},SEEN={},MYBET=50,CIDN=1,QT=0;
    function host(C){return C.net.isHost}
    function meId(C){return C.net.me.id}
    function seatsFrom(C){return C.net.players.slice(0,5).map(function(p){var o=Q&&Q.seats.filter(function(s){return s.id===p.id})[0];return {id:p.id,n:p.name||'?',bet:o?o.bet:0,rdy:false,h:[],stake:0,dbl:false,res:'',win:0,in:false,done:false}})}
    function qNew(C){Q={r:0,ph:'bet',dh:[],hide:true,cur:-1,seats:[],v:0};Q.seats=seatsFrom(C)}
    function dcard(){var c=draw1();c.id=CIDN++;return c}
    function qSync(C){Q.v++;var out=JSON.parse(JSON.stringify(Q));if(out.hide&&out.dh[1])out.dh[1]={r:0,s:0,id:out.dh[1].id,x:1};C.net.broadcast({t:'bj-s',q:out});qView(C,out)}
    function mySeat(q,C){q=q||Q;if(!q)return null;var id=meId(C);return q.seats.filter(function(s){return s.id===id})[0]||null}
    /* jetons : chacun débite / crédite sa propre réserve d'après ce que dit le chef */
    function qView(C,q){if(!host(C))Q=q;q.seats.forEach(function(s){s.h.forEach(fresh1)});q.dh.forEach(fresh1);
      var s=mySeat(q,C);if(!s)return;if(q.r!==LED.r){LED={r:q.r,sp:0,ga:0}}
      var need=s.in&&q.ph!=='bet'?s.stake:0;if(need!==LED.sp){BANK.add(-(need-LED.sp));LED.sp=need}
      if(q.ph==='done'&&s.in&&s.win!==LED.ga){BANK.add(s.win-LED.ga);if(s.win>s.stake){C.pop(s.res==='bj'?'BLACKJACK !':'GAGNÉ !',s.res==='bj'?YEL:GRN,'70px');sfx.play('win');C.win()}else if(!s.win){sfx.play('lose')}LED.ga=s.win;record(C)}}
    function fresh1(c){if(!c||c.id==null)return;if(!SEEN[c.id]){SEEN[c.id]=1;c.a=0}else c.a=1}
    function qAct(C,from,m){if(!Q)return;
      var s=Q.seats.filter(function(x){return x.id===from})[0];
      if(m.t==='bj-hello'){if(Q.ph==='bet'){var ns=seatsFrom(C);ns.forEach(function(n){var o=Q.seats.filter(function(x){return x.id===n.id})[0];if(o){n.bet=o.bet;n.rdy=o.rdy}});Q.seats=ns}qSync(C);return}
      if(!s)return;
      if(m.t==='bj-bet'&&Q.ph==='bet'){s.bet=Math.max(0,Math.min(100000,Math.round(+m.v||0)));s.rdy=!!m.rdy&&s.bet>=10;qSync(C);if(Q.seats.length&&Q.seats.every(function(x){return x.rdy}))qDeal(C);return}
      if(m.t==='bj-act'&&Q.ph==='play'&&Q.seats[Q.cur]===s){
        if(m.a==='hit'){s.h.push(dcard());var v=val(s.h).t;if(v>=21)qNext(C);else qSync(C)}
        else if(m.a==='stand')qNext(C);
        else if(m.a==='dbl'&&s.h.length===2&&!s.dbl){s.dbl=true;s.stake*=2;s.h.push(dcard());qNext(C)}
        sfx.play('ui');return}
      if(m.t==='bj-new'&&from==='host'&&Q.ph==='done')qNewRound(C)}
    function qDeal(C){var any=false;Q.seats.forEach(function(s){s.h=[];s.res='';s.win=0;s.dbl=false;s.done=false;s.in=s.rdy&&s.bet>=10;s.stake=s.in?s.bet:0;if(s.in)any=true});if(!any)return;
      Q.r++;Q.dh=[];Q.hide=true;for(var k=0;k<2;k++){Q.seats.forEach(function(s){if(s.in)s.h.push(dcard())});Q.dh.push(dcard())}
      Q.ph='play';Q.cur=-1;sfx.play('go');
      var up=Q.dh[0].r;if((up===14||up>=10)&&bj(Q.dh)){qResolve(C);return}
      qNext(C)}
    function qNext(C){for(var i=Q.cur+1;i<Q.seats.length;i++){var s=Q.seats[i];if(s.in&&!bj(s.h)&&val(s.h).t<21&&!s.dbl){Q.cur=i;QT=0;qSync(C);return}}
      Q.cur=-1;Q.ph='dealer';Q.hide=false;Q.t=.7;qSync(C)}
    function qResolve(C){Q.hide=false;var d=val(Q.dh).t,dbj=bj(Q.dh);
      Q.seats.forEach(function(s){if(!s.in)return;var p=val(s.h).t,pbj=bj(s.h);
        if(pbj&&!dbj){s.res='bj';s.win=Math.floor(s.stake*2.5)}else if(p>21){s.res='bust';s.win=0}else if(dbj&&!pbj){s.res='lose';s.win=0}else if(pbj&&dbj){s.res='push';s.win=s.stake}
        else if(d>21||p>d){s.res='win';s.win=s.stake*2}else if(p===d){s.res='push';s.win=s.stake}else{s.res='lose';s.win=0}});
      Q.ph='done';Q.cur=-1;qSync(C)}
    function qNewRound(C){Q.ph='bet';Q.dh=[];Q.hide=true;var ns=seatsFrom(C);ns.forEach(function(n){var o=Q.seats.filter(function(x){return x.id===n.id})[0];if(o)n.bet=o.bet});Q.seats=ns;qSync(C)}
    function qSend(C,m){C.net.send(m)}
    var ON={
      setup:function(C){Q=null;SEEN={};LED={r:-1,sp:0,ga:0};MYBET=Math.min(50,BANK.get());
        C.listen(function(m,from){if(m.t==='bj-s'&&!host(C)){qView(C,m.q);return}if(host(C)&&/^bj-/.test(m.t))qAct(C,from,m)});
        C.keysText('À plusieurs : chacun mise ses jetons et joue contre le croupier · <kbd>H</kbd> carte · <kbd>S</kbd> rester · <kbd>D</kbd> doubler · jetons virtuels');
        C.over('Blackjack à plusieurs','Tout le salon à la même table, chacun contre le croupier. Choisis ta mise puis clique <b>Prêt</b> : la donne part quand tout le monde est prêt (ou quand le chef lance).','Rejoindre la table')},
      start:function(C){if(host(C)){qNew(C);qSync(C)}else qSend(C,{t:'bj-hello'})},
      step:function(C,dt){if(!Q)return;var all=Q.dh.slice();Q.seats.forEach(function(s){all=all.concat(s.h)});animCards(all,dt);
        if(!host(C))return;
        if(Q.ph==='dealer'){Q.t-=dt;if(Q.t<=0){if(!Q.seats.some(function(s){return s.in&&val(s.h).t<=21})||val(Q.dh).t>=17)qResolve(C);else{Q.dh.push(dcard());Q.t=.6;qSync(C)}}}
        if(Q.ph==='play'&&Q.cur>=0){QT+=dt;if(QT>40){QT=0;qNext(C)}}
        if(Q.ph==='bet'&&Q.seats.length!==Math.min(5,C.net.players.length)){Q.seats=seatsFrom(C);qSync(C)}},
      mouse:function(C,t,x,y){QU.mx=x;QU.my=y;if(t==='down'&&C.running)clickUI(QU,x,y)},
      key:function(C,k,down){if(!down||!C.running)return;keyUI(QU,k)},
      draw:function(C){var g=C.g;QU.btns=[];table(g,'BLACKJACK');bankBar(g,'À plusieurs · paie 3:2');
        if(!Q){mono(g,'Connexion à la table du chef…',480,270,18,CR);return}
        mono(g,'CROUPIER',480,62,13,'rgba(241,236,226,.6)');
        var i;for(i=0;i<Q.dh.length;i++){var dc=Q.dh[i];card(g,dc&&!dc.x?dc:null,480-Q.dh.length*34+i*68,78,!dc||dc.x||(i===1&&Q.hide),.85)}
        if(Q.dh.length){var dv=val(Q.hide?[Q.dh[0]]:Q.dh.filter(function(c){return c&&!c.x})).t;g.fillStyle=INK;rr(g,480+Q.dh.length*34+8,104,48,30,8);g.fill();mono(g,String(dv),480+Q.dh.length*34+32,119,16,CR)}
        var n=Q.seats.length,me=mySeat(null,C);
        Q.seats.forEach(function(s,k){var cx=480+(k-(n-1)/2)*186,mine=me===s,turn=Q.ph==='play'&&Q.cur===k,y=230;
          for(var j=0;j<s.h.length;j++)card(g,s.h[j],cx-50+j*24,y,false,.62);
          if(s.h.length){var v=val(s.h).t;g.fillStyle=v>21?RED:INK;rr(g,cx+56,y-4,40,26,7);g.fill();mono(g,String(v),cx+76,y+9,14,CR)}
          g.fillStyle=turn?YEL:mine?'#2f6fbf':'rgba(20,18,16,.85)';rr(g,cx-80,330,160,42,10);g.fill();
          mono(g,String(s.n).slice(0,12)+(mine?' (toi)':''),cx,344,13,turn?INK:CR);
          var st=Q.ph==='bet'?(s.rdy?'prêt · '+s.bet:'mise '+s.bet+'…'):s.in?'mise '+s.stake+(s.dbl?' ×2':''):'ne joue pas';mono(g,st,cx,361,12,turn?INK:YEL);
          if(Q.ph==='done'&&s.in){var lab={bj:'BLACKJACK +'+(s.win-s.stake),win:'GAGNÉ +'+s.stake,push:'ÉGALITÉ',lose:'PERDU',bust:'DÉPASSÉ'}[s.res]||'';var col=s.res==='bj'||s.res==='win'?GRN:s.res==='push'?CR:RED;g.fillStyle='rgba(20,18,16,.85)';rr(g,cx-72,388,144,26,8);g.fill();mono(g,lab,cx,401,13,col)}});
        if(!C.running)return;
        if(!me){mono(g,'Tu regardes la partie (5 joueurs max à la table)',480,470,14,CR);return}
        if(Q.ph==='bet'){
          if(refillOk()&&!me.rdy&&MYBET<10){button(QU,g,355,455,250,58,'Recharger 1000 jetons',function(){refill(C);MYBET=50},{col:'#7b3fd1'});return}
          if(!me.rdy){[10,25,50,100,500].forEach(function(v,k){var x=40+k*58;chip(g,x+22,484,v,21);QU.btns.push({x:x,y:460,w:44,h:48,fn:function(){if(MYBET+v<=BANK.get()){MYBET+=v;sfx.play('ui')}else PP.toast('Pas assez de jetons','warn')},key:'Digit'+(k+1)})});
            mono(g,'MISE',345,470,12,'rgba(241,236,226,.6)');txt(g,String(MYBET),345,496,28,YEL);button(QU,g,395,458,100,52,'Effacer',function(){MYBET=0},{col:'#3a3632',hcol:'#4a4642'})}
          button(QU,g,510,458,150,52,me.rdy?'Pas prêt':'Prêt',function(){qSend(C,{t:'bj-bet',v:MYBET,rdy:!me.rdy})},{off:!me.rdy&&(MYBET<10||MYBET>BANK.get()),key:['Space','Enter'],sub:'Espace',col:me.rdy?'#3a3632':RED});
          if(host(C))button(QU,g,675,458,170,52,'Distribuer',function(){qDeal(C)},{off:!Q.seats.some(function(s){return s.rdy}),col:'#7b3fd1',hcol:'#8f55e6',key:'KeyD',sub:'D · joueurs prêts'})}
        else if(Q.ph==='play'){if(Q.seats[Q.cur]===me){
            button(QU,g,250,455,140,58,'Carte',function(){qSend(C,{t:'bj-act',a:'hit'})},{key:'KeyH',sub:'H'});
            button(QU,g,410,455,140,58,'Rester',function(){qSend(C,{t:'bj-act',a:'stand'})},{key:'KeyS',sub:'S',col:'#3a3632',hcol:'#4a4642'});
            button(QU,g,570,455,140,58,'Doubler',function(){if(BANK.get()>=me.stake)qSend(C,{t:'bj-act',a:'dbl'})},{key:'KeyD',sub:'D',col:'#7b3fd1',hcol:'#8f55e6',off:me.h.length!==2||BANK.get()<me.stake})}
          else mono(g,(Q.seats[Q.cur]?Q.seats[Q.cur].n:'?')+' joue…',480,480,16,CR)}
        else if(Q.ph==='dealer')mono(g,'Le croupier tire…',480,480,16,CR);
        else if(Q.ph==='done'){if(host(C))button(QU,g,380,455,200,58,'Nouvelle main',function(){qNewRound(C)},{key:['Space','Enter'],sub:'Espace'});else mono(g,'Le chef lance la main suivante',480,480,15,CR)}
      }};
    var SO={
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
      }};
    function pick(C){return C.mode==='online'?ON:SO}
    PP.arcade({id:'bj',setup:function(C){pick(C).setup(C)},start:function(C){pick(C).start(C)},step:function(C,dt){pick(C).step(C,dt)},mouse:function(C,t,x,y,e){pick(C).mouse(C,t,x,y,e)},key:function(C,k,d,e){pick(C).key(C,k,d,e)},draw:function(C,dt){pick(C).draw(C,dt)}});
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
    /* v69 : la même table sert en solo (toi contre 3 bots) et en salon (jusqu'à 6 joueurs, des bots complètent jusqu'à 4).
       En salon, le chef fait tourner la partie et envoie à chacun ce qu'il a le droit de voir (pas les cartes des autres). */
    var S,U,SB=10,BB=20,BOTN=['Léa','Momo','Zed','Nina','Rex'],CC=null,SITS={},LASTV=-1,SEENC={},POPR=-1,TT=0;
    function online(C){return C.mode==='online'}
    function isHost(C){return !online(C)||C.net.isHost}
    function N(){return S.pl.length}
    function newTable(list){return {pl:list.map(function(o){return {id:o.id,n:o.n,st:o.st,bot:!!o.bot,sat:o.sat!==false,cards:[],fold:false,allin:false,bet:0,tot:0,acted:false,out:false,last:'',show:false}}),dealer:Math.random()*list.length|0,board:[],phase:'idle',cur:-1,max:0,minR:BB,t:0,msg:'',hand:0,wins:null,v:0,me:0}}
    function soloTable(){return newTable([{id:'me',n:'Toi',st:BANK.get()}].concat(BOTN.slice(0,3).map(function(n,i){return {id:'b'+i,n:n,st:1000,bot:true}})))}
    function roomTable(C){var hs=C.net.players.slice(0,6).map(function(p){return {id:p.id,n:p.name||'?',st:p.id===C.net.me.id?BANK.get():(SITS[p.id]||1000),sat:p.id===C.net.me.id||SITS[p.id]!=null}});var k=0;while(hs.length<4)hs.push({id:'b'+k,n:BOTN[k++]+' (bot)',st:1000,bot:true});return newTable(hs)}
    function meIdx(C){if(!online(C))return 0;var id=C.net.me.id;for(var i=0;i<N();i++)if(S.pl[i].id===id)return i;return -1}
    function active(){return S.pl.filter(function(p){return !p.out&&!p.fold})}
    function pot(){return S.pl.reduce(function(a,p){return a+p.tot},0)}
    function nextIdx(i,f){for(var k=1;k<=N();k++){var j=(i+k)%N();if(f(S.pl[j]))return j}return -1}
    function syncMe(C){var m=meIdx(C);if(m>=0&&S.pl[m].sat!==false)BANK.set(S.pl[m].st)}
    function bump(){S.v++}
    function put(p,a){a=Math.min(a,p.st);p.st-=a;p.bet+=a;p.tot+=a;if(p.st===0)p.allin=true;return a}
    function canAct(p){return !p.out&&!p.fold&&!p.allin}
    function newHand(C){
      if(online(C)){/* nouveaux arrivants à la place d'un bot ou d'un siège vide ; les partis sont retirés */
        var ids=C.net.players.map(function(p){return p.id});S.pl=S.pl.filter(function(p){return p.bot||ids.indexOf(p.id)>=0});
        C.net.players.slice(0,6).forEach(function(p){if(!S.pl.some(function(q){return q.id===p.id})){var bi=-1;S.pl.forEach(function(q,i){if(q.bot&&bi<0)bi=i});var np={id:p.id,n:p.name||'?',st:SITS[p.id]||1000,sat:SITS[p.id]!=null,bot:false,cards:[],out:false};if(bi>=0)S.pl[bi]=np;else if(S.pl.length<6)S.pl.push(np)}});
        if(S.dealer>=N())S.dealer=0}
      S.pl.forEach(function(p){if(!p.bot&&!p.sat&&SITS[p.id]!=null){p.st=SITS[p.id];p.sat=true}if(p.st<=0&&p.bot)p.out=true});
      var mi=meIdx(C);if(!online(C)&&S.pl[0].st<=0){S.phase='broke';bump();return}
      if(!online(C)&&S.pl.every(function(p,i){return !i||p.out})){S.msg='Tu as ruiné les 3 bots ! Ils reviennent avec 1000 jetons.';C.pop('TABLE GAGNÉE !',YEL,'70px');C.win();sfx.play('win');S.pl.forEach(function(p,i){if(i){p.st=1000;p.out=false}})}
      S.pl.forEach(function(p){if(!p.bot)p.out=p.st<=0});
      if(S.pl.filter(function(p){return !p.out}).length<2){S.phase='end';S.msg='Pas assez de joueurs avec des jetons.';bump();return}
      S.hand++;S.board=[];S.deck=deck(1);S.wins=null;S.max=0;S.minR=BB;
      S.pl.forEach(function(p){p.cards=[];p.fold=p.out;p.allin=false;p.bet=0;p.tot=0;p.acted=false;p.last='';p.show=false});
      S.dealer=nextIdx(S.dealer,function(p){return !p.out});
      var live=S.pl.filter(function(p){return !p.out}).length,sb=live===2?S.dealer:nextIdx(S.dealer,function(p){return !p.out}),bb=nextIdx(sb,function(p){return !p.out});
      put(S.pl[sb],SB);S.pl[sb].last='Petite blinde';put(S.pl[bb],BB);S.pl[bb].last='Grosse blinde';S.max=BB;
      for(var r=0;r<2;r++)S.pl.forEach(function(p){if(!p.out){var c=S.deck.pop();c.a=-.15*r;p.cards.push(c)}});
      S.phase='pre';S.cur=nextIdx(bb,canAct);S.t=.8;S.msg='';TT=0;sfx.play('go');syncMe(C);bump();
      if(S.cur<0)runOut()}
    function roundDone(){return S.pl.filter(canAct).every(function(p){return p.acted&&p.bet===S.max})}
    function act(C,i,what,amt){var p=S.pl[i];if(!p||S.cur!==i||S.phase==='end')return;var call=S.max-p.bet;
      if(what==='fold'){p.fold=true;p.last='Se couche';sfx.play('ui')}
      else if(what==='call'){if(call>0){put(p,call);p.last=p.allin?'Tapis !':'Suit '+call;sfx.play('pickup')}else{p.last='Parole';sfx.play('tick')}}
      else if(what==='raise'){var to=Math.min(p.bet+p.st,Math.max(+amt||0,S.max+1)),inc=to-S.max;put(p,to-p.bet);if(inc>0){if(inc>=S.minR)S.minR=inc;S.max=p.bet;S.pl.forEach(function(q){if(q!==p)q.acted=false})}p.last=p.allin?'Tapis !':'Relance à '+p.bet;sfx.play('pickup')}
      else return;
      p.acted=true;syncMe(C);bump();TT=0;
      if(active().length===1){win1(C);return}
      if(roundDone()){nextStreet(C);return}
      S.cur=nextIdx(i,canAct);S.t=.75;if(S.cur<0)nextStreet(C)}
    function nextStreet(C){S.pl.forEach(function(p){p.bet=0;p.acted=false});S.max=0;S.minR=BB;bump();
      if(S.board.length===5){showdown(C);return}
      var n=S.board.length?1:3;for(var k=0;k<n;k++){var c=S.deck.pop();c.a=-.12*k;S.board.push(c)}sfx.play('ui');
      S.phase=['','','','flop','turn','river'][S.board.length]||'river';
      if(S.pl.filter(canAct).length<2){runOut();return}
      S.auto=false;S.cur=nextIdx(S.dealer,canAct);S.t=.9;TT=0}
    function runOut(){S.auto=true;S.cur=-1;S.t=.9}
    function win1(C){var w=active()[0],p=pot();w.st+=p;S.wins=[{i:S.pl.indexOf(w),amt:p}];S.msg=(!online(C)&&w.id==='me'?'Tu remportes ':w.n+' remporte ')+p+' (les autres se couchent)';endHand(C)}
    function showdown(C){var cont=active();cont.forEach(function(p){p.show=true;p.score=evalH(p.cards.concat(S.board))});
      var levels=[],won={};S.pl.forEach(function(p){if(p.tot>0&&levels.indexOf(p.tot)<0)levels.push(p.tot)});levels.sort(function(a,b){return a-b});var prev=0;
      levels.forEach(function(L){var part=0;S.pl.forEach(function(p){part+=Math.max(0,Math.min(p.tot,L)-prev)});var el=cont.filter(function(p){return p.tot>=L});if(!el.length)el=cont;
        var best=Math.max.apply(null,el.map(function(p){return p.score})),ws=el.filter(function(p){return p.score===best}),share=Math.floor(part/ws.length),rest=part-share*ws.length;
        ws.forEach(function(p,k){var i=S.pl.indexOf(p),a=share+(k===0?rest:0);p.st+=a;won[i]=(won[i]||0)+a});prev=L});
      S.wins=Object.keys(won).map(function(i){return {i:+i,amt:won[i]}});
      var top=S.wins.slice().sort(function(a,b){return b.amt-a.amt})[0],wp=S.pl[top.i];
      S.msg=S.wins.map(function(w){return S.pl[w.i].n+' +'+w.amt}).join(' · ')+' — '+HN[catOf(wp.score)];
      endHand(C)}
    function endHand(C){S.phase='end';S.cur=-1;S.auto=false;syncMe(C);record(C);bump()}
    /* effets (pop, sons) quand une main se termine, vus par chacun depuis sa place */
    function endFx(C){if(S.phase!=='end'||POPR===S.hand+'/'+S.v)return;POPR=S.hand+'/'+S.v;var m=meIdx(C),w=S.wins&&S.wins.filter(function(x){return x.i===m})[0];if(!S.wins)return;
      if(w){var p=S.pl[m];C.pop(p.show&&S.board.length===5?HN[catOf(evalH(p.cards.concat(S.board)))].toUpperCase()+' !':'+'+w.amt,YEL,'60px');sfx.play('win');C.win()}else sfx.play('lose')}
    function equity(p){var opp=active().length-1,known=p.cards.concat(S.board),win=0,Nn=200;
      var rest=deck(1).filter(function(c){return !known.some(function(k){return k.r===c.r&&k.s===c.s})});
      for(var n=0;n<Nn;n++){for(var i=rest.length-1;i>rest.length-1-(5-S.board.length)-opp*2-1&&i>0;i--){var j=Math.random()*(i+1)|0,t=rest[i];rest[i]=rest[j];rest[j]=t}
        var k=rest.length-1,b=S.board.slice();while(b.length<5)b.push(rest[k--]);var mine=evalH(p.cards.concat(b)),best=true,tie=false;
        for(var o=0;o<opp;o++){var os=evalH([rest[k--],rest[k--]].concat(b));if(os>mine){best=false;break}if(os===mine)tie=true}
        if(best)win+=tie?.5:1}
      return win/Nn}
    function botMove(C,i){var p=S.pl[i],call=S.max-p.bet,eq=equity(p),pt=pot(),odds=call/(pt+call||1),r=Math.random(),agg=[.08,.15,.04,.1,.06][i%5];
      if(eq>.72-agg&&r<.75||(r<.06+agg*.3&&p.st>pt)){var to=S.max+Math.max(S.minR,Math.round(Math.max(BB,pt*(eq>.85?.9:.6))/10)*10);if(eq>.9&&r<.3)to=p.bet+p.st;act(C,i,'raise',to);return}
      if(call===0){act(C,i,'call');return}
      if(eq>=odds+.04||(call<=BB&&eq>.25)||(eq>.5)){act(C,i,'call');return}
      act(C,i,'fold')}
    /* ce que voit chaque joueur : ses cartes, et celles des autres seulement à l'abattage */
    function viewFor(id){var o=JSON.parse(JSON.stringify(S));delete o.deck;o.pl.forEach(function(p){if(p.id!==id&&!p.show)p.cards=p.cards.map(function(){return {r:0,s:0,x:1}})});return o}
    function sendAll(C){if(!online(C)||!C.net.isHost||S.v===LASTV)return;LASTV=S.v;S.pl.forEach(function(p){if(!p.bot&&p.id!==C.net.me.id)C.net.to(p.id,{t:'pk-s',s:viewFor(p.id)})});
      C.net.players.forEach(function(p){if(p.id!==C.net.me.id&&!S.pl.some(function(q){return q.id===p.id}))C.net.to(p.id,{t:'pk-s',s:viewFor(p.id)})})}
    function recv(C,s){s.board.forEach(seen1);s.pl.forEach(function(p){p.cards.forEach(seen1)});S=s;syncMe(C);endFx(C)}
    function seen1(c){if(!c||c.x)return;var k=c.r+'-'+c.s;if(!SEENC[k]){SEENC[k]=1;c.a=0}else c.a=1}
    function myTurn(C){var m=meIdx(C);return m>=0&&S.cur===m&&S.phase!=='end'&&S.phase!=='broke'}
    function doAct(C,what,amt){if(!myTurn(C))return;if(online(C)&&!C.net.isHost)C.net.send({t:'pk-act',w:what,a:amt});else act(C,meIdx(C),what,amt)}
    function myCall(C){var p=S.pl[meIdx(C)];return Math.min(p.st,S.max-p.bet)}
    function myRaiseTo(C){var p=S.pl[meIdx(C)],to=S.max+Math.max(S.minR,BB*2);return Math.min(p.bet+p.st,to)}
    /* places autour de la table, toi toujours en bas */
    function seatPos(k,n){if(k===0)return [480,440];var a=Math.PI/2+k*Math.PI*2/n;return [Math.round(480+Math.cos(a)*370),Math.round(250+Math.sin(a)*175)]}
    PP.arcade({id:'poker',
      setup:function(C){CC=C;U=UI();SEENC={};LASTV=-1;POPR=-1;S=online(C)?null:soloTable();
        if(online(C)){C.listen(function(m,from){
            if(m.t==='pk-s'&&!C.net.isHost){if(m.s.hand!==(S&&S.hand))SEENC={};recv(C,m.s);return}
            if(!C.net.isHost)return;
            if(m.t==='pk-sit'){SITS[from]=Math.max(20,Math.min(1e6,+m.st||1000));if(S){S.pl.forEach(function(p){if(p.id===from&&(S.phase==='idle'||S.phase==='end'||p.fold||p.out||!p.cards.length)){p.st=SITS[from];p.sat=true}});bump();LASTV=-1}return}
            if(m.t==='pk-act'&&S){var i=-1;S.pl.forEach(function(p,k){if(p.id===from)i=k});if(i>=0)act(C,i,m.w,m.a);return}
            if(m.t==='players'&&S){var ids=m.players.map(function(p){return p.id});S.pl.forEach(function(p,k){if(!p.bot&&ids.indexOf(p.id)<0&&!p.out){p.fold=true;p.out=true;p.last='Parti';if(S.cur===k&&S.phase!=='end'){if(active().length===1)win1(C);else{S.cur=nextIdx(k,canAct);if(S.cur<0||roundDone())nextStreet(C)}}bump()}})}});
          C.keysText('À plusieurs : <kbd>F</kbd> se coucher · <kbd>C</kbd> suivre / parole · <kbd>R</kbd> relancer · <kbd>A</kbd> tapis · jetons virtuels, pas d\'argent réel');
          C.over('Poker à plusieurs','Texas Hold\'em avec tout le salon (6 max). S\'il y a moins de 4 joueurs, des bots complètent la table. Chacun joue avec ses propres jetons (virtuels). Le chef distribue.',C.net.isHost?'Ouvrir la table':'Rejoindre la table');return}
        C.keysText('Clique les boutons · <kbd>F</kbd> se coucher · <kbd>C</kbd> suivre / parole · <kbd>R</kbd> relancer · <kbd>A</kbd> tapis · jetons virtuels, pas d\'argent réel');
        C.over('Poker','Texas Hold\'em contre 3 bots. 2 cartes pour toi, 5 au milieu : fais la meilleure main de 5 cartes. Blindes 10 / 20. Tu joues avec tes <b>'+BANK.get()+' jetons</b> (virtuels).','Jouer')},
      start:function(C){if(BANK.get()<20){BANK.set(1000);C.pop('+1000 JETONS',YEL,'54px')}
        if(online(C)){if(C.net.isHost){S=roomTable(C);S.phase='idle';S.msg='Le chef lance la première main.';bump()}else C.net.send({t:'pk-sit',st:BANK.get()});return}
        S=soloTable();newHand(C)},
      close:function(C){if(S&&S.pl&&meIdx(C)>=0)syncMe(C)},
      step:function(C,dt){if(!S||!S.pl)return;var all=S.board.slice();S.pl.forEach(function(p){all=all.concat(p.cards)});animCards(all,dt);
        if(!isHost(C))return;
        sendAll(C);
        if(S.phase==='end'){endFx(C);return}
        if(S.phase==='broke'||S.phase==='idle')return;
        S.t-=dt;
        /* un joueur du salon qui ne joue pas pendant 40 s : il passe (ou se couche s'il doit suivre) */
        var cp=S.pl[S.cur];if(cp&&!cp.bot&&online(C)){TT+=dt;if(TT>40){TT=0;act(C,S.cur,S.max>cp.bet?'fold':'call')}return}
        if(S.t>0)return;
        if(S.auto){S.pl.forEach(function(p){if(!p.fold&&!p.out)p.show=true});nextStreet(C);S.t=1;return}
        if(cp&&cp.bot)botMove(C,S.cur)},
      mouse:function(C,t,x,y){U.mx=x;U.my=y;if(t==='down'&&C.running)clickUI(U,x,y)},
      key:function(C,k,down){if(!down||!C.running)return;keyUI(U,k)},
      draw:function(C){var g=C.g;U.btns=[];table(g,'POKER');
        if(!S){bankBar(g,'À plusieurs');mono(g,'Connexion à la table du chef…',480,270,18,CR);return}
        bankBar(g,'Main n°'+(S.hand||0)+' · blindes 10/20'+(online(C)?' · salon':''));
        for(var b=0;b<5;b++){var bx=480-5*40+b*80+5;if(S.board[b])card(g,S.board[b],bx,200,false,.9);else{g.strokeStyle='rgba(241,236,226,.15)';g.lineWidth=2;rr(g,bx,200,63,90,8);g.stroke()}}
        var pt=pot();if(pt&&S.phase!=='end'){chip(g,430,306,pt>=500?500:pt>=100?100:25,15);mono(g,'POT '+pt,452,306,16,YEL,'left')}
        var mi=meIdx(C),n=N(),base=mi<0?0:mi;
        S.pl.forEach(function(p,i){var k=(i-base+n)%n,s=seatPos(k,n),x=s[0],y=s[1],me=i===mi,turn=S.cur===i&&S.phase!=='end',win=S.wins&&S.wins.some(function(w){return w.i===i}),top=!me&&y<150;
          if(p.out){g.globalAlpha=.35}
          var sc=me?1:.66,cw=CW*sc;for(var c=0;c<p.cards.length;c++){var cx=x-cw-4+c*(cw+8),cy=me?y-112:y-34;var cd=p.cards[c];card(g,cd&&!cd.x?cd:null,cx,cy,!cd||cd.x||(!me&&!p.show),sc)}
          if(p.fold&&!p.out&&p.cards.length){g.fillStyle='rgba(31,90,60,.7)';g.fillRect(x-cw-6,me?y-114:y-36,cw*2+14,(me?CHh:CHh*sc)+6)}
          var px=x-74,py=me?y-2:y+36;g.fillStyle=turn?YEL:win?GRN:me&&online(C)?'#2f6fbf':'rgba(20,18,16,.85)';rr(g,px,py,148,40,10);g.fill();
          mono(g,String(p.n).slice(0,13)+(i===S.dealer?' Ⓓ':''),x,py+13,13,turn||win?INK:CR);mono(g,p.out?(p.last==='Parti'?'parti':'éliminé'):p.st+' jetons',x,py+29,12,turn||win?INK:YEL);
          if(p.bet>0){var bx2=me?x+165:top?x:x+(x<480?120:-120),by2=me?y+20:top?y+100:y;chip(g,bx2,by2,p.bet>=100?100:p.bet>=50?50:p.bet>=25?25:10,14);mono(g,String(p.bet),bx2,by2+22,11,CR)}
          if(p.last&&!p.out){var lx=me?x-185:top?x+140:x,ly=me?y+20:top?y+58:y+92;g.fillStyle='rgba(20,18,16,.7)';var tw=Math.max(76,p.last.length*8+14);rr(g,lx-tw/2,ly-11,tw,22,8);g.fill();mono(g,p.last,lx,ly,11,p.last==='Se couche'?'#b0a898':CR)}
          if(p.show&&!p.fold&&S.board.length>=3&&S.phase==='end'&&p.cards[0]&&!p.cards[0].x)mono(g,HN[catOf(evalH(p.cards.concat(S.board)))],me?x-150:x,me?y-60:y-46,12,YEL);
          g.globalAlpha=1});
        if(S.msg){g.font='700 15px "IBM Plex Mono", monospace';var mw=Math.min(900,g.measureText(S.msg).width+40);g.fillStyle='rgba(20,18,16,.88)';rr(g,480-mw/2,296,mw,30,10);g.fill();mono(g,S.msg,480,311,15,CR)}
        if(!C.running)return;
        if(mi<0){mono(g,'La table est pleine : tu regardes (tu joueras à la main suivante s\'il y a une place)',480,500,13,CR);return}
        var me=S.pl[mi];
        if(S.phase==='end'||S.phase==='broke'||S.phase==='idle'){
          if(me.st<=0){button(U,g,355,486,250,46,'Recharger 1000 jetons',function(){BANK.set(1000);sfx.play('pickup');if(online(C)){if(C.net.isHost){me.st=1000;bump()}else C.net.send({t:'pk-sit',st:1000})}else{me.st=1000;S.msg='';newHand(C)}},{col:'#7b3fd1',key:['Space','Enter']})}
          else if(isHost(C))button(U,g,620,486,190,46,S.phase==='idle'?'Distribuer':'Main suivante',function(){newHand(C)},{key:['Space','Enter'],sub:'Espace'});
          else mono(g,'Le chef lance la main suivante',720,505,13,'rgba(241,236,226,.75)');return}
        if(myTurn(C)){var call=myCall(C),rt=myRaiseTo(C);
          button(U,g,590,436,110,44,'Coucher',function(){doAct(C,'fold')},{key:'KeyF',col:'#3a3632',hcol:'#4a4642',sub:'F'});
          button(U,g,710,436,120,44,call?'Suivre '+call:'Parole',function(){doAct(C,'call')},{key:'KeyC',sub:'C'});
          button(U,g,840,436,110,44,'Relance',function(){doAct(C,'raise',rt)},{key:'KeyR',col:'#7b3fd1',hcol:'#8f55e6',sub:'à '+rt,off:me.st<=call});
          button(U,g,840,488,110,40,'Tapis',function(){doAct(C,'raise',me.bet+me.st)},{key:'KeyA',col:'#a0200f',hcol:'#c02a17',size:14})}
        else if(S.cur>=0&&S.pl[S.cur])mono(g,S.pl[S.cur].n+(S.pl[S.cur].bot?' réfléchit…':' joue…'),760,470,14,'rgba(241,236,226,.75)')
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
  /* =====================================================================
     ROULETTE RUSSE (v77) — contre 3 bots ou avec tout le salon (6 max).
     Chacun mise la somme qu'il veut. À chaque manche tout le monde paie la « mise de manche » dans le pot,
     puis le revolver (1 balle sur 6) passe de main en main : TIRER, TOURNER le barillet (−1 mise) ou PASSER (−2 mises).
     Celui qui prend la balle paie une amende et les autres se partagent le pot. Le dernier qui a encore des jetons rafle tout.
     Le chef (ou ton navigateur en solo) tient le barillet ; chacun débite et crédite sa propre réserve de jetons.
     Jetons virtuels uniquement, revolver de dessin animé.
     ===================================================================== */
  (function(){
    var G=null,U=UI(),CC=null,SOLO=true,BUL=0,MYBET=100,LED={gid:'',paid:false,got:false},
      A={ev:-1,k:'',who:-1,t:9,ang:-Math.PI/2,flash:0,beat:0,cyl:0,tv:-1,ts:0};
    var BOTN=['Le Baron','Mamie Colt','Tonton Flingue','Lucky Lu','La Comtesse','Big Mike','Doc Pépin','Rosa'];
    var SC=['#e2361b','#3fa9ff','#3fe09a','#f3c623','#c06be0','#ff8a3d'];
    function host(C){return SOLO||C.net.isHost}
    function myId(C){return SOLO?'me':C.net.me.id}
    function mySeat(){if(!G||!CC)return null;var id=myId(CC);for(var i=0;i<G.seats.length;i++)if(G.seats[i].id===id)return G.seats[i];return null}
    function live(){return G.seats.filter(function(s){return s.live})}
    function nextLive(i){var n=G.seats.length;for(var k=1;k<=n;k++){var j=((i+k)%n+n)%n;if(G.seats[j].live)return j}return i}
    function ev(k,who,x){G.ev={id:(G.ev?G.ev.id:0)+1,k:k,who:who,x:x||0}}
    function seat(id,n,col,bot,buy){return {id:id,n:n,col:col,bot:!!bot,buy:buy||0,rdy:!!bot,st:0,in:false,out:false,live:false,gone:false}}

    /* ---------- le chef : règles ---------- */
    function roomSeats(C){var old=G?G.seats:[];return C.net.players.slice(0,6).map(function(p,i){var o=old.filter(function(s){return s.id===p.id})[0],s=seat(p.id,p.name||'?',i);if(o){s.buy=o.buy;s.rdy=o.rdy}return s})}
    function newGame(C){var keep=G&&G.seats||[];G={gid:Math.random().toString(36).slice(2,9),ph:'lobby',seats:[],pot:0,ante:0,base:10,m:0,cur:-1,first:-1,p:0,sub:'',t:0,tt:0,nx:'',split:0,fine:0,win:-1,ev:{id:(G&&G.ev?G.ev.id:0)+1,k:'lobby',who:-1},v:(G?G.v:0)};
      if(SOLO)G.seats=[seat('me',PP.myName?PP.myName()||'Toi':'Toi',0,false,MYBET)];
      else{G.seats=roomSeats(C);G.seats.forEach(function(s){var o=keep.filter(function(k){return k.id===s.id})[0];if(o)s.buy=o.buy;s.rdy=false})}}
    function sync(C){G.v++;if(!SOLO)C.net.broadcast({t:'rr-s',g:G});view(C)}
    function launch(C){
      if(SOLO){var me=G.seats[0];me.buy=MYBET;me.rdy=true;var names=BOTN.slice().sort(function(){return Math.random()-.5});
        for(var b=0;b<3;b++){var bb=Math.max(20,Math.round(MYBET*(.6+Math.random()*.8)/10)*10);G.seats.push(seat('bot'+b,names[b],b+1,true,bb))}}
      var ps=G.seats.filter(function(s){return s.rdy&&s.buy>=10});if(ps.length<2)return;
      G.seats=ps;var tot=0;ps.forEach(function(s,i){s.col=i;s.in=true;s.st=s.buy;tot+=s.buy});
      G.base=Math.max(5,Math.round(tot/ps.length/12/5)*5);G.ph='play';G.m=0;G.pot=0;G.first=Math.random()*ps.length|0;G.first=(G.first-1+ps.length)%ps.length;
      manche(C)}
    function anteOf(m){var a=G.base*Math.pow(1.35,m-1);return a<50?Math.max(5,Math.round(a)):Math.round(a/5)*5}
    function manche(C){G.seats.forEach(function(s){if(s.in&&!s.out&&s.st<=0)s.out=true});
      var al=G.seats.filter(function(s){return s.in&&!s.out});if(al.length<=1){finish(C,al[0]);return}
      G.m++;G.ante=anteOf(G.m);G.split=0;G.fine=0;
      al.forEach(function(s){var a=Math.min(G.ante,s.st);s.st-=a;G.pot+=a});
      G.seats.forEach(function(s){s.live=s.in&&!s.out});
      BUL=Math.random()*6|0;G.p=0;G.first=nextLive(G.first);G.cur=G.first;G.sub='intro';G.t=1.4;ev('manche',-1);sync(C)}
    function startTurn(C){var s=G.seats[G.cur];G.sub='turn';G.t=s.bot?.5+Math.random()*.7:(SOLO?0:25);G.tt=G.t;sync(C)}
    function act(C,from,a){if(!G||G.ph!=='play'||G.sub!=='turn')return;var s=G.seats[G.cur];if(!s||s.id!==from)return;
      if(a==='spin'){if(s.st<G.ante)return;s.st-=G.ante;G.pot+=G.ante;BUL=Math.random()*6|0;G.p=0;G.sub='spin';G.t=1.2;ev('spin',G.cur,G.ante);sync(C);return}
      if(a==='pass'){if(s.st<G.ante*2)return;s.st-=G.ante*2;G.pot+=G.ante*2;G.sub='res';G.nx='next';G.t=1.2;ev('pass',G.cur,G.ante*2);sync(C);return}
      if(a==='shoot')pull(C)}
    function pull(C){G.sub='pull';G.t=1.25;ev('pull',G.cur);sync(C)}
    function resolve(C){var s=G.seats[G.cur];
      if(G.p===BUL){var f=Math.min(s.st,G.ante*2);s.st-=f;G.pot+=f;s.live=false;G.fine=f;
        var sv=live(),sh=Math.floor(G.pot/sv.length),rest=G.pot-sh*sv.length;sv.forEach(function(x,i){x.st+=sh+(i<rest?1:0)});G.split=sh;G.pot=0;
        if(s.st<=0)s.out=true;G.sub='res';G.nx='manche';G.t=2.8;ev('bang',G.cur,f)}
      else{G.p++;G.sub='res';G.nx='next';G.t=.8;ev('click',G.cur)}
      sync(C)}
    function finish(C,w){G.ph='end';G.sub='';G.win=-1;if(w){w.st+=G.pot;G.pot=0;G.win=G.seats.indexOf(w)}ev('end',G.win);sync(C)}
    function botMove(s){var left=6-G.p;
      if(left<=1)return s.st>=G.ante?'spin':s.st>=G.ante*2?'pass':'shoot';
      if(left<=3&&s.st>=G.ante*3&&Math.random()<(left===2?.75:.4))return Math.random()<.7?'spin':'pass';
      return 'shoot'}
    function hstep(C,dt){if(!G||G.ph!=='play')return;var s=G.seats[G.cur];
      if(G.sub==='turn'){if(!s)return;if(s.bot||!SOLO){G.t-=dt;if(G.t<=0)act(C,s.id,s.bot?botMove(s):'shoot')}return}
      G.t-=dt;if(G.t>0)return;
      if(G.sub==='intro')startTurn(C);
      else if(G.sub==='spin')pull(C);
      else if(G.sub==='pull')resolve(C);
      else if(G.sub==='res'){if(G.nx==='next'){G.cur=nextLive(G.cur);startTurn(C)}else manche(C)}}
    /* quelqu'un quitte le salon : en partie, ses jetons restent dans le pot */
    function gone(C,ids){if(!G)return;var ch=false;
      G.seats.slice().forEach(function(s){if(s.bot||s.gone||ids.indexOf(s.id)>=0)return;ch=true;
        if(G.ph==='lobby'){G.seats.splice(G.seats.indexOf(s),1);return}
        s.gone=true;if(G.ph!=='play'||s.out)return;var i=G.seats.indexOf(s),wasCur=i===G.cur&&/turn|spin|pull/.test(G.sub);G.pot+=s.st;s.st=0;s.out=true;s.live=false;
        if(live().length<=1){G.sub='res';G.nx='manche';G.t=1}else if(wasCur){G.cur=nextLive(G.cur);startTurn(C)}});
      if(ch)sync(C)}
    function msgIn(C,m,from){if(!G)return;
      if(m.t==='rr-hello'){if(G.ph==='lobby'){var ns=roomSeats(C);G.seats=ns}sync(C);return}
      var s=G.seats.filter(function(x){return x.id===from})[0];
      if(m.t==='rr-bet'&&G.ph==='lobby'&&s){s.buy=Math.max(0,Math.min(1e6,Math.round(+m.v||0)));s.rdy=!!m.rdy&&s.buy>=10;sync(C);
        if(G.seats.length>=2&&G.seats.every(function(x){return x.rdy}))launch(C);return}
      if(m.t==='rr-act')act(C,from,m.a)}

    /* ---------- chaque joueur : affichage, sons et jetons ---------- */
    function view(C,g){if(g)G=g;if(!G)return;var me=mySeat();
      if(G.gid!==LED.gid)LED={gid:G.gid,paid:false,got:false};
      if(me&&me.in&&G.ph!=='lobby'&&!LED.paid){LED.paid=true;BANK.add(-me.buy)}
      if(me&&me.in&&G.ph==='end'&&!LED.got){LED.got=true;BANK.add(me.st);record(C)}
      if(G.ev&&G.ev.id!==A.ev){A.ev=G.ev.id;fx(C,G.ev)}}
    function fx(C,e){A.k=e.k;A.who=e.who;A.t=0;var me=mySeat(),mine=me&&G.seats[e.who]===me,who=G.seats[e.who];
      if(e.k==='bang'){A.flash=1;C.shake(14);sfx.play('shoot');setTimeout(function(){sfx.play(mine?'lose':'hit')},140);C.pop('PAN !',RED,'130px')}
      else if(e.k==='click'){sfx.play('tick');C.pop('clic',CR,'56px')}
      else if(e.k==='spin'){sfx.play('ui')}
      else if(e.k==='pass'){sfx.play('ui')}
      else if(e.k==='manche'){sfx.play('go');C.pop('MANCHE '+G.m,YEL,'64px')}
      else if(e.k==='end'){var w=G.seats[G.win];if(w&&w===me){C.pop('TU RAFLES TOUT !',YEL,'64px');sfx.play('win');C.win()}else if(me&&me.in)sfx.play('lose')}
      if(e.k==='pull'&&mine)A.beat=0}
    function send(C,m){if(host(C))msgIn(C,m,myId(C));else C.net.send(m)}

    /* ---------- dessin ---------- */
    function pos(i){var n=G.seats.length,me=mySeat(),mi=me?G.seats.indexOf(me):0,a=Math.PI/2+(i-mi)*2*Math.PI/n;return {a:a,x:480+Math.cos(a)*372,y:236+Math.sin(a)*164}}
    function felt(g){var bg=g.createRadialGradient(480,260,80,480,270,640);bg.addColorStop(0,'#3a1216');bg.addColorStop(1,'#120708');g.fillStyle=bg;g.fillRect(0,0,W,H);
      g.globalAlpha=.06;for(var i=0;i<W;i+=24){g.fillStyle=i%48?'#000':'#fff';g.fillRect(i,0,12,H)}g.globalAlpha=1;
      g.fillStyle='#3b2412';g.beginPath();g.ellipse(480,240,330,150,0,0,7);g.fill();
      var gr=g.createRadialGradient(480,220,30,480,240,330);gr.addColorStop(0,'#2a7a52');gr.addColorStop(1,'#123b27');g.fillStyle=gr;g.beginPath();g.ellipse(480,240,314,136,0,0,7);g.fill();
      g.strokeStyle='rgba(243,198,35,.35)';g.lineWidth=2;g.beginPath();g.ellipse(480,240,296,120,0,0,7);g.stroke()}
    function revolver(g,x,y,ang,sc,kick,cyl,shake){g.save();g.translate(x+(shake?(Math.random()-.5)*shake:0),y+(shake?(Math.random()-.5)*shake:0));g.rotate(ang);if(Math.cos(ang)<0)g.scale(1,-1);g.scale(sc,sc);g.translate(-kick*16,0);
      var D='#1b1d21';g.lineJoin='round';
      g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(14,40,110,14,0,0,7);g.fill();
      var wd=g.createLinearGradient(-80,0,-30,64);wd.addColorStop(0,'#a35a2a');wd.addColorStop(1,'#552a12');g.fillStyle=wd;
      g.beginPath();g.moveTo(-28,-2);g.lineTo(-60,0);g.quadraticCurveTo(-88,32,-80,64);g.lineTo(-52,68);g.quadraticCurveTo(-50,34,-20,16);g.closePath();g.fill();g.strokeStyle='#2a140a';g.lineWidth=2.5;g.stroke();
      g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1.5;for(var k=0;k<5;k++){g.beginPath();g.moveTo(-66+k*3,14+k*10);g.lineTo(-46+k*2,10+k*10);g.stroke()}
      var mt=g.createLinearGradient(0,-26,0,18);mt.addColorStop(0,'#e3e7ec');mt.addColorStop(.45,'#8d949c');mt.addColorStop(1,'#3d434a');
      g.fillStyle=D;g.beginPath();g.moveTo(-56,-20);g.lineTo(-74,-34);g.lineTo(-64,-38);g.lineTo(-44,-22);g.closePath();g.fill();
      g.fillStyle=mt;g.strokeStyle=D;g.lineWidth=2.5;
      g.beginPath();g.moveTo(-62,-16);g.lineTo(-22,-20);g.lineTo(44,-20);g.lineTo(44,8);g.lineTo(-18,12);g.lineTo(-32,16);g.lineTo(-62,2);g.closePath();g.fill();g.stroke();
      rr(g,42,-19,100,17,3);g.fill();g.stroke();rr(g,44,-1,66,9,4);g.fill();g.stroke();g.fillStyle=D;g.fillRect(132,-25,7,7);
      g.strokeStyle=D;g.lineWidth=5;g.beginPath();g.moveTo(-34,14);g.quadraticCurveTo(-30,42,-2,30);g.lineTo(2,10);g.stroke();
      g.lineWidth=3.5;g.beginPath();g.moveTo(-16,13);g.quadraticCurveTo(-22,26,-14,32);g.stroke();
      var cg=g.createLinearGradient(0,-26,0,16);cg.addColorStop(0,'#c9ced4');cg.addColorStop(.5,'#6c737b');cg.addColorStop(1,'#2e3338');g.fillStyle=cg;g.lineWidth=2.5;rr(g,-18,-26,56,40,9);g.fill();g.stroke();
      g.save();rr(g,-18,-26,56,40,9);g.clip();g.fillStyle='rgba(0,0,0,.4)';var off=((cyl||0)%1)*18;for(k=-1;k<4;k++)rr(g,-14+k*18+off,-21,9,30,4),g.fill();g.restore();
      g.fillStyle='rgba(255,255,255,.35)';g.fillRect(46,-17,90,3);
      g.restore()}
    function flash(g,x,y,ang,a){if(a<=0)return;g.save();g.translate(x,y);g.rotate(ang);g.translate(150,Math.cos(ang)<0?10:-10);g.globalAlpha=Math.min(1,a*1.4);
      for(var r=0;r<2;r++){g.fillStyle=r?'#fff6c0':'#ff9a2a';g.beginPath();for(var i=0;i<16;i++){var rad=(i%2?18:58)*(r?.55:1)*(0.8+a*.4),q=i/16*Math.PI*2;g.lineTo(Math.cos(q)*rad,Math.sin(q)*rad)}g.closePath();g.fill()}g.restore()}
    function cylinder(g,x,y){var left=6-G.p;g.fillStyle='rgba(20,18,16,.85)';g.beginPath();g.arc(x,y,30,0,7);g.fill();g.strokeStyle='#8d949c';g.lineWidth=3;g.stroke();
      for(var i=0;i<6;i++){var q=-Math.PI/2+i*Math.PI/3+A.cyl,used=i<G.p;g.fillStyle=used?'#3a3632':'#c9ced4';g.beginPath();g.arc(x+Math.cos(q)*18,y+Math.sin(q)*18,6,0,7);g.fill();if(!used){g.fillStyle='#141210';g.beginPath();g.arc(x+Math.cos(q)*18,y+Math.sin(q)*18,3,0,7);g.fill()}}
      mono(g,'RISQUE',x,y+44,11,'rgba(241,236,226,.6)');txt(g,'1 sur '+left,x,y+64,22,left<=2?RED:left<=3?YEL:CR)}
    function seatCard(g,s,i){var P=pos(i),w=158,h=58,x=P.x-w/2,y=P.y-h/2,cur=G.ph==='play'&&G.cur===i&&G.sub!=='intro',me=s===mySeat(),hit=A.k==='bang'&&A.who===i&&G.sub==='res',win=G.ph==='end'&&G.win===i;
      g.save();if(s.out&&!win)g.globalAlpha=.42;
      if(cur||win){g.shadowColor=win?YEL:RED;g.shadowBlur=26}
      g.fillStyle=hit?'#6a1410':me?'#1d3a66':'rgba(20,18,16,.92)';rr(g,x,y,w,h,12);g.fill();g.shadowBlur=0;
      g.strokeStyle=cur||win?YEL:SC[s.col%6];g.lineWidth=cur||win?3:2;rr(g,x,y,w,h,12);g.stroke();
      g.fillStyle=SC[s.col%6];g.beginPath();g.arc(x+24,y+h/2,15,0,7);g.fill();txt(g,(s.bot?'🤖':String(s.n||'?').charAt(0).toUpperCase()),x+24,y+h/2+1,s.bot?15:17,INK);
      mono(g,String(s.n||'?').slice(0,14),x+46,y+19,11,CR,'left');
      var st=G.ph==='lobby'?(s.rdy?'prêt · '+s.buy:'choisit sa mise…'):s.out?(s.gone?'parti':'RUINÉ'):s.st+' jetons';
      mono(g,st,x+46,y+40,13,s.out?RED:G.ph==='lobby'&&!s.rdy?'rgba(241,236,226,.6)':YEL,'left');
      if(G.ph==='play'&&s.in&&!s.out&&!s.live)mono(g,'touché',x+w-8,y+12,10,RED,'right');
      g.restore();
      if(G.ph==='play'&&G.sub==='res'&&A.k==='bang'&&A.t<3){var up=Math.min(1,A.t)*22;
        if(s.live&&G.split){g.globalAlpha=Math.max(0,1-A.t/3);mono(g,'+'+G.split,P.x,y-10-up,17,GRN);g.globalAlpha=1}
        if(hit&&G.fine){g.globalAlpha=Math.max(0,1-A.t/3);mono(g,'−'+G.fine,P.x,y-10-up,17,RED);g.globalAlpha=1}}
      if(G.ph==='play'&&A.t<1.4&&A.who===i&&(A.k==='spin'||A.k==='pass')){g.globalAlpha=Math.max(0,1-A.t/1.4);mono(g,'−'+(A.k==='spin'?G.ante:G.ante*2),P.x,y-12-A.t*18,16,RED);g.globalAlpha=1}}
    function status(){var s=G.seats[G.cur],n=s?s.n:'?';
      if(G.sub==='intro')return ['Manche '+G.m+' : chacun met '+G.ante+' dans le pot',YEL];
      if(G.sub==='turn')return [n+' a le revolver…',CR];
      if(G.sub==='spin')return [n+' fait tourner le barillet (−'+G.ante+')',CR];
      if(G.sub==='pull')return [n+' appuie sur la détente…',CR];
      if(G.sub==='res'){if(A.k==='bang')return ['PAN ! '+n+' paie '+G.fine+(G.split?' · les autres gagnent '+G.split+' chacun':''),RED];if(A.k==='pass')return [n+' passe (−'+G.ante*2+')',CR];return ['Clic… '+n+' s\'en sort',GRN]}
      return ['',CR]}
    function pill(g,s,col,y){g.font='700 15px "IBM Plex Mono", monospace';var w=g.measureText(s).width+34;g.fillStyle='rgba(20,18,16,.9)';rr(g,480-w/2,y-18,w,36,12);g.fill();mono(g,s,480,y,15,col)}
    function lobbyBar(g,C,me){
      if(refillOk()&&(!me||!me.rdy)&&MYBET<10){button(U,g,355,458,250,56,'Recharger 1000 jetons',function(){refill(C);MYBET=100},{col:'#7b3fd1',key:['Space','Enter'],sub:'jetons gratuits'});return}
      var rdy=me&&me.rdy&&!SOLO;
      if(!rdy){[10,25,50,100,500].forEach(function(v,k){var x=24+k*54;chip(g,x+22,486,v,21);U.btns.push({x:x,y:462,w:44,h:48,fn:function(){if(MYBET+v<=BANK.get()){MYBET+=v;sfx.play('ui')}else{MYBET=BANK.get();PP.toast('Pas assez de jetons','warn')}},key:'Digit'+(k+1)})});
        button(U,g,296,462,62,48,'Tapis',function(){MYBET=BANK.get();sfx.play('ui')},{col:'#3a3632',hcol:'#4a4642',size:13,key:'KeyT'});
        mono(g,'MISE',405,474,11,'rgba(241,236,226,.6)');txt(g,String(MYBET),405,498,26,YEL);
        button(U,g,450,462,70,48,'Effacer',function(){MYBET=0},{col:'#3a3632',hcol:'#4a4642',size:12,key:'Backspace'})}
      var ok=MYBET>=10&&MYBET<=BANK.get();
      if(SOLO)button(U,g,540,458,200,56,'Commencer',function(){if(ok)launch(C)},{off:!ok,key:['Space','Enter'],sub:'Espace · contre 3 bots'});
      else{button(U,g,rdy?380:540,458,rdy?200:150,56,rdy?'Pas prêt':'Prêt',function(){send(C,{t:'rr-bet',v:MYBET,rdy:!rdy})},{off:!rdy&&!ok,key:['Space','Enter'],sub:'Espace',col:rdy?'#3a3632':RED});
        if(host(C)&&!rdy)button(U,g,704,458,236,56,'Lancer la partie',function(){launch(C)},{off:G.seats.filter(function(s){return s.rdy}).length<2,col:'#7b3fd1',hcol:'#8f55e6',key:'KeyL',sub:'L · 2 joueurs prêts mini'})}
      if(!rdy&&MYBET>BANK.get())MYBET=BANK.get()}
    function draw(C,dt){var g=C.g;U.btns=[];dt=dt||0;A.t+=dt;if(A.flash>0)A.flash-=dt*2.2;
      felt(g);bankBar(g,G&&G.ph!=='lobby'?'Jetons virtuels':'');
      if(!G){mono(g,SOLO?'':'Connexion à la table du chef…',480,250,18,CR);return}
      var me=mySeat(),i;
      /* revolver : vise celui qui a la main */
      var tgt=G.ph==='play'&&G.cur>=0?pos(G.cur).a:G.ph==='end'&&G.win>=0?pos(G.win).a:-Math.PI/2+Math.sin(A.t*.5)*.4,d=tgt-A.ang;d=Math.atan2(Math.sin(d),Math.cos(d));A.ang+=d*Math.min(1,dt*6);
      if(G.ph==='play'&&G.sub==='spin')A.cyl+=dt*14;
      var pulling=G.ph==='play'&&G.sub==='pull',kick=A.k==='bang'&&A.t<.25?1-A.t/.25:A.k==='click'&&A.t<.12?.3:0;
      if(pulling){A.beat-=dt;if(A.beat<=0){A.beat=.42;sfx.play('tick')}}
      if(G.ph==='lobby'){
        txt(g,'ROULETTE RUSSE',480,128,40,CR);
        mono(g,'Chacun mise ce qu\'il veut · 1 balle, 6 trous',480,166,13,YEL);
        ['À chaque manche, tout le monde paie la mise de manche.','À ton tour : TIRER, TOURNER le barillet (−1 mise)','ou PASSER (−2 mises). Qui prend la balle paie une amende,','les autres se partagent le pot. Le dernier avec des jetons rafle tout.'].forEach(function(l,k){mono(g,l,480,206+k*22,12,'rgba(241,236,226,.82)')});
        revolver(g,480,318,-0.12+Math.sin(A.t*.8)*.05,.55,0,0,0)}
      else{
        mono(g,G.ph==='end'?'PARTIE TERMINÉE':'MANCHE '+G.m+' · MISE '+G.ante,480,128,14,'rgba(241,236,226,.75)');
        revolver(g,480,222,A.ang,.85,kick,A.cyl,pulling?3+A.t*2:0);flash(g,480,222,A.ang,A.k==='bang'?.9-A.t*3:0);
        if(G.ph==='play'){cylinder(g,380,300);var pt=G.pot;if(pt){chip(g,580,296,pt>=500?500:pt>=100?100:pt>=50?50:25,20);mono(g,'POT',580,330,11,'rgba(241,236,226,.6)');txt(g,String(pt),580,350,22,YEL)}}}
      for(i=0;i<G.seats.length;i++)seatCard(g,G.seats[i],i);
      if(A.flash>0){g.fillStyle='rgba(255,240,220,'+Math.max(0,A.flash*.75)+')';g.fillRect(0,0,W,H)}
      if(!C.running)return;
      if(G.ph==='lobby'){if(SOLO&&me){me.buy=MYBET;me.rdy=MYBET>=10}if(!SOLO&&!me){pill(g,'Table pleine (6 max) : tu regardes',CR,486);return}lobbyBar(g,C,me);return}
      if(G.ph==='end'){var w=G.seats[G.win];g.fillStyle='rgba(20,18,16,.88)';rr(g,250,262,460,70,14);g.fill();
        txt(g,w?(w===me?'TU RAFLES TOUT !':w.n+' rafle tout'):'Personne ne gagne',480,286,28,w===me?YEL:CR);mono(g,w?w.st+' jetons':'',480,316,14,YEL);
        if(host(C))button(U,g,360,458,240,56,'Nouvelle partie',function(){newGame(C);sync(C)},{key:['Space','Enter'],sub:'Espace'});else pill(g,'Le chef relance une partie',CR,486);return}
      var cs=G.seats[G.cur];
      if(me&&me.out){pill(g,'Tu es ruiné… regarde la fin'+(SOLO?'':' de la partie'),RED,474);if(SOLO)button(U,g,700,458,240,56,'Rejouer',function(){newGame(C);sync(C)},{key:['Space','Enter'],sub:'Espace',col:'#7b3fd1',hcol:'#8f55e6'});return}
      if(G.sub==='turn'&&cs&&cs===me){
        if(A.tv!==G.v){A.tv=G.v;A.ts=performance.now()}
        button(U,g,180,458,200,58,'TIRER',function(){send(C,{t:'rr-act',a:'shoot'})},{key:['Space','Enter'],sub:'Espace · risque 1 sur '+(6-G.p),size:18});
        button(U,g,396,458,190,58,'Barillet',function(){send(C,{t:'rr-act',a:'spin'})},{key:'KeyR',sub:'R · tourner · −'+G.ante,col:'#7b3fd1',hcol:'#8f55e6',off:me.st<G.ante});
        button(U,g,602,458,180,58,'Passer',function(){send(C,{t:'rr-act',a:'pass'})},{key:'KeyP',sub:'P · −'+G.ante*2,col:'#3a3632',hcol:'#4a4642',off:me.st<G.ante*2});
        if(!SOLO&&G.tt){var left=Math.max(0,G.tt-(performance.now()-A.ts)/1000);g.fillStyle='rgba(241,236,226,.15)';rr(g,180,524,602,6,3);g.fill();g.fillStyle=left<6?RED:YEL;rr(g,180,524,602*left/G.tt,6,3);g.fill()}
        mono(g,'À TOI',480,440,13,YEL);return}
      var st=status();if(st[0])pill(g,st[0],st[1],486)}
    PP.arcade({id:'rr',
      setup:function(C){CC=C;U=UI();SOLO=C.mode!=='online';G=null;A.ev=-1;A.k='';A.flash=0;MYBET=Math.min(100,BANK.get());
        if(!SOLO){C.listen(function(m,from){
            if(m.t==='rr-s'&&!C.net.isHost){view(C,m.g);return}
            if(m.t==='migrating'||(m.t==='left'&&m.id==='host')){var me=mySeat();if(G&&G.ph==='play'&&me&&me.in&&LED.paid&&!LED.got){LED.got=true;BANK.add(me.st);C.stop();C.over('Partie arrêtée','Le chef a quitté le salon : tu récupères tes <b>'+me.st+' jetons</b>.','Rejoindre la table')}G=null;return}
            if(!C.net.isHost)return;
            if(m.t==='players'){gone(C,m.players.map(function(p){return p.id}));if(G&&G.ph==='lobby'){G.seats=roomSeats(C);sync(C)}return}
            if(/^rr-/.test(m.t))msgIn(C,m,from)});
          C.keysText('À plusieurs : choisis ta mise puis <kbd>Espace</kbd> Prêt · en jeu <kbd>Espace</kbd> tirer · <kbd>R</kbd> tourner le barillet · <kbd>P</kbd> passer · jetons virtuels, pas d\'argent réel');
          C.over('Roulette russe','Tout le salon autour de la table (6 max). Chacun mise la somme qu\'il veut, puis le revolver passe de main en main. Le dernier qui a encore des jetons rafle tout le pot. Tu as <b>'+BANK.get()+' jetons</b> (virtuels).',C.net.isHost?'Ouvrir la table':'Rejoindre la table');return}
        C.keysText('<kbd>1</kbd>-<kbd>5</kbd> jetons · <kbd>T</kbd> tapis · <kbd>Espace</kbd> commencer / tirer · <kbd>R</kbd> tourner le barillet · <kbd>P</kbd> passer · jetons virtuels, pas d\'argent réel');
        C.over('Roulette russe','Toi contre 3 bots. Mise la somme que tu veux, puis le revolver passe de main en main : tire, fais tourner le barillet ou passe ton tour. Le dernier qui a encore des jetons rafle tout. Tu as <b>'+BANK.get()+' jetons</b> (virtuels).','Jouer')},
      start:function(C){if(SOLO){newGame(C);sync(C);return}if(C.net.isHost){newGame(C);sync(C)}else C.net.send({t:'rr-hello'})},
      step:function(C,dt){if(G&&host(C))hstep(C,dt);if(G&&G.ph==='lobby'&&!SOLO&&host(C)&&G.seats.length!==Math.min(6,C.net.players.length)){G.seats=roomSeats(C);sync(C)}},
      mouse:function(C,t,x,y){U.mx=x;U.my=y;if(t==='down'&&C.running)clickUI(U,x,y)},
      key:function(C,k,down){if(!down||!C.running)return;keyUI(U,k)},
      draw:function(C,dt){draw(C,dt)},
      close:function(C){var me=mySeat();if(SOLO&&G&&G.ph==='play'&&me&&LED.paid&&!LED.got&&!me.out){LED.got=true;BANK.add(me.st)}}});
  })();
})();
