/* Pixel Pause — Échecs : solo contre l'ordinateur, à deux sur le même écran, ou en ligne dans un salon
   (à 4 dans le salon : deux parties en même temps). Toutes les règles : roque, prise en passant,
   promotion (en dame), échec, mat et pat. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623';
  var KN=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],KG=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]],DI=[[-1,-1],[-1,1],[1,-1],[1,1]],OR=[[-1,0],[1,0],[0,-1],[0,1]];
  var VAL={p:100,n:320,b:330,r:500,q:900,k:0};
  function inB(r,c){return r>=0&&r<8&&c>=0&&c<8}
  function col(p){return p?(p===p.toUpperCase()?'w':'b'):null}
  function start(){var B=[],back='rnbqkbnr';for(var i=0;i<64;i++)B.push('');for(var c=0;c<8;c++){B[c]=back[c];B[8+c]='p';B[48+c]='P';B[56+c]=back[c].toUpperCase()}
    return {B:B,turn:'w',cr:{K:1,Q:1,k:1,q:1},ep:-1}}
  function attacked(B,r,c,by){
    var w=by==='w',pr=w?r+1:r-1,pw=w?'P':'p';
    if(pr>=0&&pr<8){if(c>0&&B[pr*8+c-1]===pw)return true;if(c<7&&B[pr*8+c+1]===pw)return true}
    var n=w?'N':'n',k=w?'K':'k',bi=w?'B':'b',ro=w?'R':'r',q=w?'Q':'q',i,d,rr,cc,p;
    for(i=0;i<8;i++){rr=r+KN[i][0];cc=c+KN[i][1];if(inB(rr,cc)&&B[rr*8+cc]===n)return true}
    for(i=0;i<8;i++){rr=r+KG[i][0];cc=c+KG[i][1];if(inB(rr,cc)&&B[rr*8+cc]===k)return true}
    for(i=0;i<4;i++){d=DI[i];rr=r+d[0];cc=c+d[1];while(inB(rr,cc)){p=B[rr*8+cc];if(p){if(p===bi||p===q)return true;break}rr+=d[0];cc+=d[1]}}
    for(i=0;i<4;i++){d=OR[i];rr=r+d[0];cc=c+d[1];while(inB(rr,cc)){p=B[rr*8+cc];if(p){if(p===ro||p===q)return true;break}rr+=d[0];cc+=d[1]}}
    return false}
  function inCheck(G,me){var s=G.B.indexOf(me==='w'?'K':'k');return s>=0&&attacked(G.B,s>>3,s&7,me==='w'?'b':'w')}
  function apply(G,m){var B=G.B.slice(),p=B[m.f],me=col(p),cr={K:G.cr.K,Q:G.cr.Q,k:G.cr.k,q:G.cr.q};
    B[m.t]=p;B[m.f]='';
    if(m.ep)B[(m.f>>3)*8+(m.t&7)]='';
    if(m.pr)B[m.t]=me==='w'?'Q':'q';
    if(m.cs){var r=m.f>>3;if(m.cs==='K'){B[r*8+5]=B[r*8+7];B[r*8+7]=''}else{B[r*8+3]=B[r*8];B[r*8]=''}}
    if(p==='K'){cr.K=cr.Q=0}if(p==='k'){cr.k=cr.q=0}
    [m.f,m.t].forEach(function(s){if(s===63)cr.K=0;if(s===56)cr.Q=0;if(s===7)cr.k=0;if(s===0)cr.q=0});
    return {B:B,turn:me==='w'?'b':'w',cr:cr,ep:m.dbl?(m.f+m.t)/2:-1}}
  function gen(G,legalOnly){
    var B=G.B,me=G.turn,op=me==='w'?'b':'w',mv=[];
    for(var sq=0;sq<64;sq++){var p=B[sq];if(!p||col(p)!==me)continue;var r=sq>>3,c=sq&7,t=p.toLowerCase();
      var add=function(tr,tc,x){var o={f:sq,t:tr*8+tc,cap:B[tr*8+tc]};if(x)for(var k in x)o[k]=x[k];mv.push(o)};
      if(t==='p'){var dir=me==='w'?-1:1,st=me==='w'?6:1,last=me==='w'?0:7,r1=r+dir;
        if(inB(r1,c)&&!B[r1*8+c]){add(r1,c,r1===last?{pr:1}:null);if(r===st&&!B[(r+2*dir)*8+c])add(r+2*dir,c,{dbl:1})}
        [-1,1].forEach(function(dc){var tc=c+dc;if(!inB(r1,tc))return;var tp=B[r1*8+tc];if(tp&&col(tp)===op)add(r1,tc,r1===last?{pr:1}:null);else if(G.ep===r1*8+tc)add(r1,tc,{ep:1,cap:op==='w'?'P':'p'})})}
      else if(t==='n'||t==='k'){(t==='n'?KN:KG).forEach(function(d){var rr=r+d[0],cc=c+d[1];if(!inB(rr,cc))return;var tp=B[rr*8+cc];if(!tp||col(tp)===op)add(rr,cc)});
        if(t==='k'){var row=me==='w'?7:0,K=me==='w'?'K':'k',Q=me==='w'?'Q':'q';
          if(sq===row*8+4&&!attacked(B,row,4,op)){
            if(G.cr[K]&&!B[row*8+5]&&!B[row*8+6]&&B[row*8+7]===(me==='w'?'R':'r')&&!attacked(B,row,5,op)&&!attacked(B,row,6,op))add(row,6,{cs:'K'});
            if(G.cr[Q]&&!B[row*8+3]&&!B[row*8+2]&&!B[row*8+1]&&B[row*8]===(me==='w'?'R':'r')&&!attacked(B,row,3,op)&&!attacked(B,row,2,op))add(row,2,{cs:'Q'})}}}
      else{var dirs=t==='b'?DI:t==='r'?OR:DI.concat(OR);dirs.forEach(function(d){var rr=r+d[0],cc=c+d[1];while(inB(rr,cc)){var tp=B[rr*8+cc];if(tp){if(col(tp)===op)add(rr,cc);break}add(rr,cc);rr+=d[0];cc+=d[1]}})}}
    if(legalOnly===false)return mv;
    return mv.filter(function(m){return !inCheck(apply(G,m),me)})}
  /* ordinateur : recherche à 2 coups (alpha-bêta) + matériel + petit bonus de placement */
  function evalG(G){var s=0;for(var i=0;i<64;i++){var p=G.B[i];if(!p)continue;var t=p.toLowerCase(),v=VAL[t],r=i>>3,c=i&7,ctr=(3.5-Math.abs(3.5-r))+(3.5-Math.abs(3.5-c));
      if(t==='n'||t==='b')v+=ctr*4;if(t==='p')v+=(p==='P'?6-r:r-1)*6+ctr*2;if(t==='q')v+=ctr;s+=col(p)==='w'?v:-v}return G.turn==='w'?s:-s}
  function search(G,d,a,b){var mv=gen(G);if(!mv.length)return inCheck(G,G.turn)?-99999-d:0;if(!d)return evalG(G);
    mv.sort(function(x,y){return (y.cap?VAL[y.cap.toLowerCase()]:0)-(x.cap?VAL[x.cap.toLowerCase()]:0)});
    for(var i=0;i<mv.length;i++){var v=-search(apply(G,mv[i]),d-1,-b,-a);if(v>=b)return v;if(v>a)a=v}return a}
  /* v33 : niveaux de l'ordi. Facile : regarde 1 coup et se trompe souvent. Moyen : 2 coups. Difficile : 3 coups. */
  var LV=['','Facile','Moyen','Difficile'],TMS=[0,3,5,10];
  function lvl(){var v=PP.store('ch-lv');return v>=1&&v<=3?v:2}
  function aiMove(G){var mv=gen(G),L=lvl();if(!mv.length)return null;if(L===1&&Math.random()<.3)return mv[Math.floor(Math.random()*mv.length)];
    var d=L-1,best=-1e9,pick=mv[0],noise=L===1?60:L===2?14:4;mv.forEach(function(m){var v=-search(apply(G,m),d,-1e9,1e9)+Math.random()*noise;if(v>best){best=v;pick=m}});return pick}

  /* ---------- pièces dessinées (plus de caractères « police ») ---------- */
  function piece(g,t,cx,cy,s,white){
    var f=white?'#fbf8f1':'#2a241e',o=white?'#141210':'#e6d6b4',u=s/60;g.save();g.translate(cx,cy+2*u);g.scale(u,u);g.lineJoin='round';g.lineCap='round';g.lineWidth=2.4;g.fillStyle=f;g.strokeStyle=o;
    function fs(){g.fill();g.stroke()}
    function base(w){g.beginPath();g.moveTo(-w,22);g.lineTo(w,22);g.lineTo(w-2,15);g.lineTo(-w+2,15);g.closePath();fs()}
    function body(wb,wt,top){g.beginPath();g.moveTo(-wb,15);g.quadraticCurveTo(-wt*.6,2,-wt,top);g.lineTo(wt,top);g.quadraticCurveTo(wt*.6,2,wb,15);g.closePath();fs()}
    if(t==='p'){base(13);body(10,4,-4);g.beginPath();g.arc(0,-11,8,0,7);fs()}
    else if(t==='r'){base(16);body(12,10,-10);g.beginPath();g.moveTo(-14,-10);g.lineTo(-14,-21);g.lineTo(-8,-21);g.lineTo(-8,-16);g.lineTo(-3,-16);g.lineTo(-3,-21);g.lineTo(3,-21);g.lineTo(3,-16);g.lineTo(8,-16);g.lineTo(8,-21);g.lineTo(14,-21);g.lineTo(14,-10);g.closePath();fs()}
    else if(t==='n'){base(16);g.beginPath();g.moveTo(-11,15);g.quadraticCurveTo(-9,2,-2,-3);g.lineTo(-13,1);g.lineTo(-15,-5);g.lineTo(-5,-15);g.lineTo(-5,-23);g.lineTo(1,-18);g.quadraticCurveTo(15,-14,13,15);g.closePath();fs();g.fillStyle=o;g.beginPath();g.arc(-3,-11,1.8,0,7);g.fill();g.fillStyle=f}
    else if(t==='b'){base(15);body(11,4,-6);g.beginPath();g.ellipse(0,-13,8,11,0,0,7);fs();g.beginPath();g.moveTo(-3,-17);g.lineTo(4,-10);g.stroke();g.beginPath();g.arc(0,-26,2.6,0,7);fs()}
    else if(t==='q'){base(17);body(13,9,-6);g.beginPath();g.moveTo(-12,-6);g.lineTo(-16,-22);g.lineTo(-8,-13);g.lineTo(-5,-25);g.lineTo(0,-13);g.lineTo(5,-25);g.lineTo(8,-13);g.lineTo(16,-22);g.lineTo(12,-6);g.closePath();fs();[[-16,-23],[-5,-26],[5,-26],[16,-23]].forEach(function(p){g.beginPath();g.arc(p[0],p[1],2.4,0,7);fs()})}
    else{base(17);body(13,9,-8);g.beginPath();g.moveTo(-11,-8);g.quadraticCurveTo(-15,-20,0,-19);g.quadraticCurveTo(15,-20,11,-8);g.closePath();fs();g.lineWidth=4.2;g.strokeStyle=o;g.beginPath();g.moveTo(0,-19);g.lineTo(0,-30);g.moveTo(-5,-25.5);g.lineTo(5,-25.5);g.stroke();g.lineWidth=1.8;g.strokeStyle=f;g.beginPath();g.moveTo(0,-19.5);g.lineTo(0,-29.5);g.moveTo(-4.5,-25.5);g.lineTo(4.5,-25.5);g.stroke()}
    g.restore()}

  /* ---------- partie : un ou deux plateaux (en salon à 3–4, deux parties en même temps) ---------- */
  var S,CUR=null,BX=220,BY=30,SQ=60,UB={x:742,y:330,w:176,h:40};
  function tm(){return S&&S.tm||0}
  function newBoard(names){var t=tm()*60;return {G:start(),last:null,hist:[],over:false,res:'',names:names||null,clock:{w:t,b:t},sc:{w:0,b:0}}}
  function mb(){return S.bd[S.bi]}
  function local(C){return C.mode!=='online'}
  function mine(C){var b=mb();if(b.over)return false;if(C.mode==='duel')return true;if(C.mode==='solo')return b.G.turn==='w';return S.me===b.G.turn}
  function sqAt(x,y){var c=Math.floor((x-BX)/SQ),r=Math.floor((y-BY)/SQ);if(c<0||c>7||r<0||r>7)return -1;if(S.flip){r=7-r;c=7-c}return r*8+c}
  function xy(sq){var r=sq>>3,c=sq&7;if(S.flip){r=7-r;c=7-c}return {x:BX+c*SQ,y:BY+r*SQ}}
  function pname(C,b,c){if(C.mode==='solo')return c==='w'?'Toi':'L\'ordi';if(b.names)return b.names[c==='w'?0:1]||(c==='w'?'Blancs':'Noirs');return c==='w'?'Blancs':'Noirs'}
  function fmt(t){t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+('0'+t%60).slice(-2)}
  function finish(C,bi,winner,why){var b=S.bd[bi];if(b.over)return;b.over=true;b.res=why;if(winner)b.sc[winner]++;if(bi!==S.bi)return;S.sel=-1;S.moves=[];
    var iWin=winner&&((C.mode==='solo'&&winner==='w')||(C.mode==='online'&&S.me===winner)),iLose=winner&&((C.mode==='solo'&&winner==='b')||(C.mode==='online'&&S.me!=='x'&&S.me!==winner));
    if(winner){C.pop(why==='temps'?'TEMPS ÉCOULÉ !':'ÉCHEC ET MAT !',RED);if(iWin)C.win();sfx.play(iLose?'lose':'win')}else C.pop('PAT',YEL);
    setTimeout(function(){if(!S||S.bd[bi]!==b)return;C.over(winner?pname(C,b,winner)+' gagne !':'Pat : égalité',(why==='temps'?'Le temps est écoulé.':winner?'Échec et mat.':'Plus aucun coup possible, mais pas d\'échec.')+'<br>Score : <b>'+b.sc.w+' – '+b.sc.b+'</b>','Rejouer',function(){again(C,bi,true)})},1100)}
  function play(C,bi,m,remote){var b=S.bd[bi],isMine=bi===S.bi;if(b.over)return;b.hist.push({G:b.G,last:b.last});b.G=apply(b.G,m);b.last=m;
    if(isMine){S.sel=-1;S.moves=[];sfx.play(m.cap?'hit':'ui');if(m.cap)C.shake(3)}
    if(C.mode==='online'&&!remote)C.net.relay({t:'ch',b:bi,f:m.f,to:m.t});
    var legal=gen(b.G),chk=inCheck(b.G,b.G.turn);
    if(!legal.length){finish(C,bi,chk?(b.G.turn==='w'?'b':'w'):null,'mat');return}
    if(chk&&isMine){C.pop('ÉCHEC',RED,'54px');sfx.play('tick')}
    aiTurn(C)}
  function again(C,bi,send){var o=S.bd[bi],n=newBoard(o.names);n.sc=o.sc;S.bd[bi]=n;if(bi===S.bi){S.sel=-1;S.moves=[];C.go()}if(send&&C.mode==='online')C.net.relay({t:'chnew',b:bi});aiTurn(C)}
  function aiTurn(C){var b=mb();if(C.mode!=='solo'||b.G.turn!=='b'||b.over||S.thinking)return;S.thinking=true;setTimeout(function(){S.thinking=false;if(!S||mb()!==b||b.over||b.G.turn!=='b')return;var m=aiMove(b.G);if(m)play(C,S.bi,m)},380)}
  function undo(C){var b=mb();if(!local(C)||b.over||S.thinking||!b.hist.length)return;var n=C.mode==='solo'?(b.G.turn==='w'?2:1):1;while(n-->0&&b.hist.length){var h=b.hist.pop();b.G=h.G;b.last=h.last}S.sel=-1;S.moves=[];sfx.play('ui');aiTurn(C)}
  function click(C,sq){if(sq<0||!mine(C))return;var b=mb(),p=b.G.B[sq];
    var mv=S.moves.filter(function(m){return m.t===sq})[0];if(mv){play(C,S.bi,mv);return}
    if(p&&col(p)===b.G.turn){S.sel=sq;S.moves=gen(b.G).filter(function(m){return m.f===sq});sfx.play('tick')}else{S.sel=-1;S.moves=[]}}
  /* réglages dans l'écran de départ : niveau de l'ordi et temps par joueur */
  function opt(lbl,attr,vals,cur,dis){return '<div style="margin-top:10px"><small style="opacity:.75;display:block;margin-bottom:4px">'+lbl+'</small>'+vals.map(function(v){var on=v[0]===cur;return '<button type="button" '+attr+'="'+v[0]+'"'+(dis?' disabled':'')+' style="font:700 12px \'IBM Plex Mono\',monospace;padding:7px 11px;margin:2px;border:2px solid #f1ece2;cursor:'+(dis?'default':'pointer')+';background:'+(on?'#f1ece2':'transparent')+';color:'+(on?'#141210':'#f1ece2')+';opacity:'+(dis&&!on?.4:1)+'">'+v[1]+'</button>'}).join('')+'</div>'}
  function intro(C){var np=C.mode==='online'?C.net.players.length:0,host=C.mode!=='online'||C.net.isHost,h;
    if(C.mode==='solo')h='Tu joues les blancs contre l\'ordinateur. Mets le roi adverse échec et mat.';
    else if(C.mode==='duel')h='Blancs contre noirs, chacun son tour sur le même écran.';
    else h=(S.me==='x'?'Tu regardes la partie.':'Tu joues les <b>'+(S.me==='w'?'blancs (tu commences)':'noirs')+'</b> contre <b>'+PP.esc(mb().names[S.me==='w'?1:0])+'</b>.')+(S.bd.length>1?'<br>Vous êtes '+np+' : <b>deux parties en même temps</b>, l\'autre plateau s\'affiche en petit à droite.':'');
    if(C.mode==='solo')h+=opt('Niveau de l\'ordinateur','data-ch-lv',[[1,'Facile'],[2,'Moyen'],[3,'Difficile']],lvl());
    h+=opt('Temps par joueur'+(host?'':' (choisi par le chef)'),'data-ch-tm',TMS.map(function(v){return [v,v?v+' min':'Sans chrono']}),tm(),!host);
    C.over('Échecs',h,'Jouer')}
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-ch-lv],[data-ch-tm]');if(!a||!CUR||!S||PP.cur()!=='chess')return;e.preventDefault();var C=CUR;
    if(a.dataset.chLv)PP.store('ch-lv',+a.dataset.chLv);
    if(a.dataset.chTm!==undefined&&a.hasAttribute('data-ch-tm')){if(C.mode==='online'&&!C.net.isHost)return;setTm(+a.dataset.chTm);if(C.mode==='online')C.net.relay({t:'chcfg',tm:S.tm})}
    sfx.play('ui');intro(C)});
  function setTm(v){S.tm=v;PP.store('ch-tm',v);S.bd.forEach(function(b){if(!b.hist.length){b.clock.w=b.clock.b=v*60}})}
  PP.arcade({id:'chess',
    setup:function(C){CUR=C;S={bd:[],bi:0,me:'w',flip:false,sel:-1,moves:[],hov:-1,thinking:false,tm:PP.store('ch-tm')||0};
      if(C.mode==='online'){var pl=C.net.players.slice(0,4),ids=pl.map(function(p){return p.id}),i=C.net.players.map(function(p){return p.id}).indexOf(C.net.me.id),nb=pl.length>=4?2:1;
        for(var k=0;k<nb;k++)S.bd.push(newBoard([pl[k*2]?pl[k*2].name:'Blancs',pl[k*2+1]?pl[k*2+1].name:'Noirs']));
        if(i>=0&&i<nb*2){S.bi=i>>1;S.me=i%2?'b':'w'}else{S.bi=0;S.me='x'}S.flip=S.me==='b';
        C.listen(function(m){if(m.t!=='rel'||!S)return;var d=m.d,b=S.bd[d.b||0];
          if(d.t==='ch'&&b){var mv=gen(b.G).filter(function(x){return x.f===d.f&&x.t===d.to})[0];if(mv)play(C,d.b||0,mv,true)}
          if(d.t==='chnew'&&b)again(C,d.b||0,false);
          if(d.t==='chflag'&&b)finish(C,d.b||0,d.w,'temps');
          if(d.t==='chcfg'&&!C.net.isHost){setTm(+d.tm||0);if(!C.running)intro(C)}
          if(d.t==='chask'&&C.net.isHost)C.net.relay({t:'chcfg',tm:S.tm})});
        /* le chrono est celui du chef : il l'envoie à tout le monde, et les invités le demandent en arrivant */
        if(C.net.isHost)C.net.relay({t:'chcfg',tm:S.tm});else C.net.relay({t:'chask'})}
      else S.bd.push(newBoard(null));
      C.keysText('Clique une pièce, puis la case où l\'envoyer · les points montrent les coups possibles'+(local(C)?' · <kbd>Z</kbd> annule le dernier coup':''));intro(C)},
    start:function(C){S.lt=0;S.bd.forEach(function(b){if(!b.hist.length){b.clock.w=b.clock.b=tm()*60}});aiTurn(C)},
    key:function(C,code,down){if(down&&C.running&&(code==='KeyZ'||code==='KeyW'||code==='Backspace'))undo(C)},
    mouse:function(C,t,x,y){S.hov=sqAt(x,y);S.hu=local(C)&&x>UB.x&&x<UB.x+UB.w&&y>UB.y&&y<UB.y+UB.h;if(t==='down'&&C.running){if(S.hu)undo(C);else click(C,S.hov)}
      C.cv.style.cursor=C.running&&(S.hu||(S.hov>=0&&mine(C)))?'pointer':'default'},
    step:function(C,dt){var b0=mb(),now=performance.now();dt=Math.min(2,(now-(S.lt||now))/1000);S.lt=now;/* vrai temps écoulé : le chrono ne ralentit pas si l'ordi rame */
      if(tm())S.bd.forEach(function(b,bi){if(b.over||!b.hist.length)return;var c=b.G.turn;b.clock[c]-=dt;if(b.clock[c]<=0){b.clock[c]=0;
        if(local(C))finish(C,bi,c==='w'?'b':'w','temps');else if(bi===S.bi&&S.me===c){var w=c==='w'?'b':'w';C.net.relay({t:'chflag',b:bi,w:w});finish(C,bi,w,'temps')}}});
      C.hud('<span>Trait aux <b>'+(b0.G.turn==='w'?'blancs':'noirs')+'</b></span><span>Score <b>'+b0.sc.w+' – '+b0.sc.b+'</b></span>'+(tm()?'<span>Chrono <b>'+tm()+' min</b></span>':''))},
    draw:function(C){var g=C.g,b=mb(),G=b.G;g.fillStyle=INK;g.fillRect(0,0,960,540);
      g.fillStyle='rgba(0,0,0,.5)';g.fillRect(BX+6,BY+6,SQ*8,SQ*8);
      var ck=inCheck(G,G.turn)?G.B.indexOf(G.turn==='w'?'K':'k'):-1,sq,P;
      for(sq=0;sq<64;sq++){P=xy(sq);var r=sq>>3,c=sq&7,light=(r+c)%2===0;g.fillStyle=light?'#ecdfc4':'#8a6744';g.fillRect(P.x,P.y,SQ,SQ);
        if(b.last&&(sq===b.last.f||sq===b.last.t)){g.fillStyle='rgba(243,198,35,.4)';g.fillRect(P.x,P.y,SQ,SQ)}
        if(sq===S.sel){g.fillStyle='rgba(63,169,255,.5)';g.fillRect(P.x,P.y,SQ,SQ)}
        if(sq===ck){var rg=g.createRadialGradient(P.x+SQ/2,P.y+SQ/2,4,P.x+SQ/2,P.y+SQ/2,SQ*.6);rg.addColorStop(0,'rgba(226,54,27,.9)');rg.addColorStop(1,'rgba(226,54,27,0)');g.fillStyle=rg;g.fillRect(P.x,P.y,SQ,SQ)}
        if(C.running&&sq===S.hov&&mine(C)){g.strokeStyle='rgba(20,18,16,.5)';g.lineWidth=3;g.strokeRect(P.x+1.5,P.y+1.5,SQ-3,SQ-3)}}
      g.strokeStyle='#f1ece2';g.lineWidth=3;g.strokeRect(BX-1.5,BY-1.5,SQ*8+3,SQ*8+3);
      for(var k=0;k<8;k++){var fl=S.flip?7-k:k;ag.mono(g,'abcdefgh'[fl],BX+k*SQ+SQ/2,BY+SQ*8+13,11,'rgba(241,236,226,.6)');ag.mono(g,String(8-fl),BX-13,BY+k*SQ+SQ/2,11,'rgba(241,236,226,.6)')}
      for(sq=0;sq<64;sq++){var p=G.B[sq];if(!p)continue;P=xy(sq);piece(g,p.toLowerCase(),P.x+SQ/2,P.y+SQ/2,SQ,col(p)==='w')}
      S.moves.forEach(function(m){var M=xy(m.t);g.beginPath();if(m.cap){g.lineWidth=5;g.strokeStyle='rgba(226,54,27,.8)';g.arc(M.x+SQ/2,M.y+SQ/2,SQ*.43,0,7);g.stroke()}else{g.fillStyle='rgba(20,18,16,.38)';g.arc(M.x+SQ/2,M.y+SQ/2,SQ*.15,0,7);g.fill()}});
      /* joueurs et chronos à gauche */
      function side(c,y){var on=C.running&&!b.over&&G.turn===c;g.fillStyle=on?'rgba(241,236,226,.1)':'rgba(241,236,226,.04)';ag.rr(g,14,y-44,184,tm()?96:70,10);g.fill();
        piece(g,'k',40,y-12,34,c==='w');ag.txt(g,String(pname(C,b,c)).slice(0,11).toUpperCase(),118,y-16,19,on?YEL:CR);ag.mono(g,(c==='w'?'BLANCS':'NOIRS')+(C.mode==='solo'&&c==='b'?' · '+LV[lvl()].toUpperCase():''),118,y+8,11,'rgba(241,236,226,.6)');
        if(tm())ag.mono(g,fmt(b.clock[c]),106,y+34,22,b.clock[c]<20?RED:on?YEL:CR)}
      side(S.flip?'w':'b',84);side(S.flip?'b':'w',tm()?430:456);
      /* à droite : à qui de jouer, bouton annuler, et l'autre plateau en petit */
      if(C.running&&!b.over)ag.mono(g,mine(C)?'À TOI DE JOUER':C.mode==='solo'?'L\'ORDI RÉFLÉCHIT…':'AU TOUR DE '+String(pname(C,b,G.turn)).slice(0,10).toUpperCase(),830,S.bd.length>1?44:250,13,YEL);
      if(local(C)){var off=!b.hist.length||b.over,hv=S.hu&&!off&&C.running;g.fillStyle=off?'#5a554e':hv?RED:CR;ag.rr(g,UB.x,UB.y,UB.w,UB.h,8);g.fill();ag.mono(g,'↶ ANNULER (Z)',UB.x+UB.w/2,UB.y+UB.h/2,12,off?'#8d867c':hv?CR:INK)}
      if(S.bd.length>1){var ob=S.bd[1-S.bi],q=26,ox=726,oy=110;ag.mono(g,'AUTRE PLATEAU',ox+q*4,oy-18,11,'rgba(241,236,226,.7)');
        for(sq=0;sq<64;sq++){var r2=sq>>3,c2=sq&7;g.fillStyle=(r2+c2)%2===0?'#ecdfc4':'#8a6744';g.fillRect(ox+c2*q,oy+r2*q,q,q);if(ob.last&&(sq===ob.last.f||sq===ob.last.t)){g.fillStyle='rgba(243,198,35,.4)';g.fillRect(ox+c2*q,oy+r2*q,q,q)}var p2=ob.G.B[sq];if(p2)piece(g,p2.toLowerCase(),ox+c2*q+q/2,oy+r2*q+q/2,q,col(p2)==='w')}
        g.strokeStyle='rgba(241,236,226,.6)';g.lineWidth=2;g.strokeRect(ox-1,oy-1,q*8+2,q*8+2);
        ag.mono(g,String(ob.names[1]).slice(0,10)+(tm()?' '+fmt(ob.clock.b):''),ox+q*4,oy+q*8+16,11,ob.G.turn==='b'&&!ob.over?YEL:CR);ag.mono(g,String(ob.names[0]).slice(0,10)+(tm()?' '+fmt(ob.clock.w):''),ox+q*4,oy+q*8+34,11,ob.G.turn==='w'&&!ob.over?YEL:CR);
        if(ob.over)ag.mono(g,'PARTIE FINIE · '+ob.sc.w+' – '+ob.sc.b,ox+q*4,oy+q*8+54,11,RED)}}
  });
})();
