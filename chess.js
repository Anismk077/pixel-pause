/* Pixel Pause — Échecs : solo contre l'ordinateur, à deux sur le même écran, ou en ligne dans un salon
   (les deux premiers joueurs jouent, les autres regardent). Toutes les règles : roque, prise en passant,
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
  function aiMove(G){var mv=gen(G),best=-1e9,cands=[];mv.forEach(function(m){var v=-search(apply(G,m),2,-1e9,1e9)+Math.random()*8;if(v>best){best=v;cands=[m]}});return cands[0]||mv[0]}

  var S,BX=240,BY=30,SQ=60,GLY={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
  function fresh(){return {G:start(),sel:-1,moves:[],last:null,over:false,me:'w',flip:false,score:{w:0,b:0},names:null,thinking:false}}
  function mine(C){if(S.over)return false;if(C.mode==='duel')return true;if(C.mode==='solo')return S.G.turn==='w';return S.me===S.G.turn}
  function sqAt(x,y){var c=Math.floor((x-BX)/SQ),r=Math.floor((y-BY)/SQ);if(c<0||c>7||r<0||r>7)return -1;if(S.flip){r=7-r;c=7-c}return r*8+c}
  function xy(sq){var r=sq>>3,c=sq&7;if(S.flip){r=7-r;c=7-c}return {x:BX+c*SQ,y:BY+r*SQ}}
  function pname(C,c){if(C.mode==='solo')return c==='w'?'Toi':'L\'ordi';if(S.names)return S.names[c==='w'?0:1]||(c==='w'?'Blancs':'Noirs');return c==='w'?'Blancs':'Noirs'}
  function play(C,m,remote){S.G=apply(S.G,m);S.last=m;S.sel=-1;S.moves=[];sfx.play(m.cap?'hit':'ui');if(m.cap)C.shake(3);
    if(C.mode==='online'&&!remote)C.net.relay({t:'ch',f:m.f,to:m.t});
    var legal=gen(S.G),chk=inCheck(S.G,S.G.turn);
    if(!legal.length){S.over=true;var winner=chk?(S.G.turn==='w'?'b':'w'):null;
      if(winner){S.score[winner]++;C.pop('ÉCHEC ET MAT !',RED);if((C.mode==='solo'&&winner==='w')||(C.mode==='online'&&S.me===winner))C.win();sfx.play((C.mode==='solo'&&winner!=='w')||(C.mode==='online'&&S.me!==winner)?'lose':'win')}else C.pop('PAT',YEL);
      setTimeout(function(){C.over(winner?pname(C,winner)+' gagne !':'Pat : égalité',winner?'Échec et mat.':'Plus aucun coup possible, mais pas d\'échec.','Rejouer',function(){again(C,true)})},1100);return}
    if(chk){C.pop('ÉCHEC',RED,'54px');sfx.play('tick')}
    aiTurn(C)}
  function again(C,send){var sc=S.score,nm=S.names,me=S.me,fl=S.flip;S=fresh();S.score=sc;S.names=nm;S.me=me;S.flip=fl;C.go();if(send&&C.mode==='online'&&C.net.isHost)C.net.relay({t:'chnew'});aiTurn(C)}
  function aiTurn(C){if(C.mode!=='solo'||S.G.turn!=='b'||S.over||S.thinking)return;S.thinking=true;setTimeout(function(){var m=aiMove(S.G);S.thinking=false;if(m&&!S.over)play(C,m)},350)}
  function click(C,sq){if(sq<0||!mine(C))return;var p=S.G.B[sq];
    var mv=S.moves.filter(function(m){return m.t===sq})[0];if(mv){play(C,mv);return}
    if(p&&col(p)===S.G.turn){S.sel=sq;S.moves=gen(S.G).filter(function(m){return m.f===sq});sfx.play('tick')}else{S.sel=-1;S.moves=[]}}
  PP.arcade({id:'chess',
    setup:function(C){S=fresh();
      if(C.mode==='online'){var pl=C.net.players,ids=pl.map(function(p){return p.id}),i=ids.indexOf(C.net.me.id);S.me=i===0?'w':i===1?'b':'x';S.flip=S.me==='b';S.names=[pl[0]?pl[0].name:'Blancs',pl[1]?pl[1].name:'Noirs'];
        C.listen(function(m){if(m.t!=='rel')return;var d=m.d;if(d.t==='ch'){var mv=gen(S.G).filter(function(x){return x.f===d.f&&x.t===d.to})[0];if(mv)play(C,mv,true)}if(d.t==='chnew')again(C,false)})}
      C.keysText('Clique une pièce, puis la case où l\'envoyer · les points montrent les coups possibles');
      C.over('Échecs',C.mode==='solo'?'Tu joues les blancs contre l\'ordinateur. Mets le roi adverse échec et mat.':C.mode==='duel'?'Blancs contre noirs, chacun son tour sur le même écran.':(S.me==='x'?'Les deux premiers joueurs du salon s\'affrontent : tu regardes la partie.':'Tu joues les <b>'+(S.me==='w'?'blancs (tu commences)':'noirs')+'</b> contre '+PP.esc(S.names[S.me==='w'?1:0])+'.'),'Jouer')},
    start:function(C){aiTurn(C)},
    mouse:function(C,t,x,y){S.hov=sqAt(x,y);if(t==='down'&&C.running)click(C,S.hov)},
    step:function(C){C.hud('<span>Trait aux <b>'+(S.G.turn==='w'?'blancs':'noirs')+'</b></span><span>Score <b>'+S.score.w+' – '+S.score.b+'</b></span>')},
    draw:function(C){var g=C.g;g.fillStyle=INK;g.fillRect(0,0,960,540);
      g.fillStyle='rgba(0,0,0,.5)';g.fillRect(BX+6,BY+6,SQ*8,SQ*8);
      var ck=inCheck(S.G,S.G.turn)?S.G.B.indexOf(S.G.turn==='w'?'K':'k'):-1;
      for(var sq=0;sq<64;sq++){var P=xy(sq),r=sq>>3,c=sq&7,light=(r+c)%2===0;g.fillStyle=light?'#efe2c8':'#7d5a3a';g.fillRect(P.x,P.y,SQ,SQ);
        if(S.last&&(sq===S.last.f||sq===S.last.t)){g.fillStyle='rgba(243,198,35,.38)';g.fillRect(P.x,P.y,SQ,SQ)}
        if(sq===S.sel){g.fillStyle='rgba(63,169,255,.45)';g.fillRect(P.x,P.y,SQ,SQ)}
        if(sq===ck){var rg=g.createRadialGradient(P.x+SQ/2,P.y+SQ/2,4,P.x+SQ/2,P.y+SQ/2,SQ*.6);rg.addColorStop(0,'rgba(226,54,27,.9)');rg.addColorStop(1,'rgba(226,54,27,0)');g.fillStyle=rg;g.fillRect(P.x,P.y,SQ,SQ)}
        if(C.running&&sq===S.hov&&mine(C)){g.strokeStyle='rgba(20,18,16,.5)';g.lineWidth=3;g.strokeRect(P.x+1.5,P.y+1.5,SQ-3,SQ-3)}}
      /* coordonnées */
      for(var k=0;k<8;k++){var fl=S.flip?7-k:k;ag.mono(g,'abcdefgh'[fl],BX+k*SQ+SQ/2,BY+SQ*8+12,11,'rgba(241,236,226,.6)');ag.mono(g,String(8-fl),BX-12,BY+k*SQ+SQ/2,11,'rgba(241,236,226,.6)')}
      g.textAlign='center';g.textBaseline='middle';g.font='46px "Segoe UI Symbol","Apple Symbols","Noto Sans Symbols 2","DejaVu Sans",serif';
      for(sq=0;sq<64;sq++){var p=S.G.B[sq];if(!p)continue;var Q=xy(sq),wh=col(p)==='w',gl=GLY[p.toLowerCase()]+'︎';
        g.lineWidth=3;g.strokeStyle=wh?'#141210':'#efe2c8';g.strokeText(gl,Q.x+SQ/2,Q.y+SQ/2+3);g.fillStyle=wh?'#fbf8f1':'#1a1612';g.fillText(gl,Q.x+SQ/2,Q.y+SQ/2+3)}
      S.moves.forEach(function(m){var M=xy(m.t);g.fillStyle=m.cap?'rgba(226,54,27,.55)':'rgba(20,18,16,.35)';g.beginPath();if(m.cap){g.lineWidth=5;g.strokeStyle='rgba(226,54,27,.75)';g.arc(M.x+SQ/2,M.y+SQ/2,SQ*.42,0,7);g.stroke()}else{g.arc(M.x+SQ/2,M.y+SQ/2,SQ*.14,0,7);g.fill()}});
      /* panneaux : joueurs, pièces prises */
      function side(c,y){var on=C.running&&!S.over&&S.G.turn===c;if(on){g.fillStyle='rgba(241,236,226,.08)';ag.rr(g,22,y-34,196,68,10);g.fill()}
        ag.txt(g,String(pname(C,c)).slice(0,12).toUpperCase(),120,y-8,26,on?YEL:CR);ag.mono(g,c==='w'?'BLANCS':'NOIRS',120,y+20,12,'rgba(241,236,226,.6)')}
      side(S.flip?'w':'b',90);side(S.flip?'b':'w',450);
      var cnt={},have={};S.G.B.forEach(function(p){if(p)have[p]=(have[p]||0)+1});var full={p:8,n:2,b:2,r:2,q:1};
      ['w','b'].forEach(function(c,ci){var s='',x=740,y=ci?(S.flip?90:450):(S.flip?450:90);Object.keys(full).forEach(function(t){var pc=c==='w'?t.toUpperCase():t,lost=Math.max(0,full[t]-(have[pc]||0));for(var i=0;i<lost;i++)s+=GLY[t]+'︎'});
        g.font='22px "Segoe UI Symbol","Apple Symbols","Noto Sans Symbols 2",serif';g.fillStyle=c==='w'?'#fbf8f1':'#9a8c78';g.textAlign='left';g.fillText(s.slice(0,32),x,y);g.textAlign='center'});
      if(C.running&&!S.over)ag.mono(g,mine(C)?'À toi de jouer':C.mode==='solo'?'L\'ordi réfléchit…':'Au tour de '+pname(C,S.G.turn),840,270,14,YEL)}
  });
})();
