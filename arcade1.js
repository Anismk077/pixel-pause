/* Pixel Pause — jeux arcade, lot 1 : Quatre en ligne, Air Hockey, Tour Infinie, Réflexes, Casse-Briques Néon */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',BLU='#3fa9ff';

  /* ================= QUATRE EN LIGNE (v30 : jusqu'à 4 joueurs, grande grille) ================= */
  (function(){
    var COLS=7,ROWS=6,NP=2,S,CS=72,GX=480-7*36,GY=70;
    var PC=['#e2361b','#f3c623','#3fbf6a','#3a8cff'],PL=['#ff7a5c','#ffe680','#8ff0a8','#9cc8ff'],PN=['Rouge','Jaune','Vert','Bleu'];
    function layout(np){NP=np;if(np>2){COLS=9;ROWS=7}else{COLS=7;ROWS=6}CS=Math.min(72,Math.floor(640/COLS),Math.floor(450/ROWS));GX=Math.round(480-COLS*CS/2);GY=Math.round(290-ROWS*CS/2)+10}
    function fresh(){return {b:[],turn:1,over:false,win:null,anim:null,hover:3,me:0,score:[0,0,0,0],first:1,names:null,q:[],rd:0,ids:null,gone:{}}}
    function newBoard(){S.b=[];for(var c=0;c<COLS;c++){var col=[];for(var r=0;r<ROWS;r++)col.push(0);S.b.push(col)}S.turn=S.first;if(S.gone&&S.gone[S.turn-1])nextTurn();S.over=false;S.win=null;S.anim=null;S.q=[];S.hover=Math.floor(COLS/2)}
    function top(b,c){for(var r=0;r<ROWS;r++)if(!b[c][r])return r;return -1}
    function lines(b,p){var out=null;var D=[[1,0],[0,1],[1,1],[1,-1]];for(var c=0;c<COLS;c++)for(var r=0;r<ROWS;r++){if(b[c][r]!==p)continue;D.forEach(function(d){var k,ok=true;for(k=1;k<4;k++){var x=c+d[0]*k,y=r+d[1]*k;if(x<0||x>=COLS||y<0||y>=ROWS||b[x][y]!==p){ok=false;break}}if(ok&&!out){out=[];for(k=0;k<4;k++)out.push([c+d[0]*k,r+d[1]*k])}})}return out}
    function full(b){for(var c=0;c<COLS;c++)if(top(b,c)>=0)return false;return true}
    /* ordinateur (solo, grille 7×6) */
    function evalWin(w,p){var me=0,op=0,em=0;w.forEach(function(v){if(v===p)me++;else if(v)op++;else em++});if(me===4)return 1000;if(me===3&&em===1)return 6;if(me===2&&em===2)return 2;if(op===3&&em===1)return -5;return 0}
    function heur(b,p){var s=0,c,r;for(r=0;r<ROWS;r++)if(b[3][r]===p)s+=3;
      for(c=0;c<COLS;c++)for(r=0;r<ROWS;r++){if(c<=3)s+=evalWin([b[c][r],b[c+1][r],b[c+2][r],b[c+3][r]],p);if(r<=2)s+=evalWin([b[c][r],b[c][r+1],b[c][r+2],b[c][r+3]],p);if(c<=3&&r<=2)s+=evalWin([b[c][r],b[c+1][r+1],b[c+2][r+2],b[c+3][r+3]],p);if(c<=3&&r>=3)s+=evalWin([b[c][r],b[c+1][r-1],b[c+2][r-2],b[c+3][r-3]],p)}return s}
    function mm(b,depth,a,be,maxi,p){var o=3-p,wp=lines(b,p),wo=lines(b,o);if(wp)return 100000+depth;if(wo)return -100000-depth;if(!depth||full(b))return heur(b,p);
      var order=[3,2,4,1,5,0,6],best=maxi?-1e9:1e9;for(var i=0;i<7;i++){var c=order[i],r=top(b,c);if(r<0)continue;b[c][r]=maxi?p:o;var v=mm(b,depth-1,a,be,!maxi,p);b[c][r]=0;if(maxi){best=Math.max(best,v);a=Math.max(a,v)}else{best=Math.min(best,v);be=Math.min(be,v)}if(a>=be)break}return best}
    function aiMove(){var b=S.b,best=-1e9,bc=3,order=[3,2,4,1,5,0,6];order.forEach(function(c){var r=top(b,c);if(r<0)return;b[c][r]=2;var v=mm(b,5,-1e9,1e9,false,2)+(Math.random()*2);b[c][r]=0;if(v>best){best=v;bc=c}});return bc}
    /* v87 : on peut jouer contre 1, 2 ou 3 ordis (grande grille à 3 et 4) */
    function vb(C){return C.mode==='solo'||C.mode==='b3'||C.mode==='b4'}
    function aiMulti(p){var b=S.b,cs=[],c,r,k,ctr=(COLS-1)/2;for(c=0;c<COLS;c++)if(top(b,c)>=0)cs.push(c);if(!cs.length)return 0;
      function winAt(c,q){var r=top(b,c);if(r<0)return false;b[c][r]=q;var w=!!lines(b,q);b[c][r]=0;return w}
      for(k=0;k<cs.length;k++)if(winAt(cs[k],p))return cs[k];
      for(var o=1;o<NP;o++){var q=(p-1+o)%NP+1;if(S.gone[q-1])continue;for(k=0;k<cs.length;k++)if(winAt(cs[k],q))return cs[k]}
      var D=[[1,0],[0,1],[1,1],[1,-1]],best=-1e9,bc=cs[0];
      cs.forEach(function(c){var r=top(b,c),sc=-Math.abs(c-ctr)*2+Math.random()*3;b[c][r]=p;
        D.forEach(function(d){for(var s0=-3;s0<=0;s0++){var me=0,ok=true;for(var j=0;j<4;j++){var x=c+d[0]*(s0+j),y=r+d[1]*(s0+j);if(x<0||x>=COLS||y<0||y>=ROWS){ok=false;break}var v=b[x][y];if(v===p)me++;else if(v){ok=false;break}}if(ok)sc+=me===3?30:me===2?6:1}});
        if(r+1<ROWS){b[c][r+1]=0;for(var o=1;o<NP;o++){var q=(p-1+o)%NP+1;b[c][r+1]=q;if(lines(b,q))sc-=400;b[c][r+1]=0}}
        b[c][r]=0;if(sc>best){best=sc;bc=c}});return bc}
    function pname(C,p){if(C.mode==='solo')return p===1?'Toi':'L\'ordi';if(vb(C))return p===1?'Toi':'Ordi '+PN[p-1];if(S.names&&S.names[p-1])return S.names[p-1];return PN[p-1]}
    /* v64 : on saute les joueurs qui ont quitté le salon (avant, la partie restait bloquée sur leur tour) */
    function nextTurn(){for(var k=0;k<NP;k++){S.turn=S.turn%NP+1;if(!S.gone||!S.gone[S.turn-1])break}}
    function alive(){var n=0;for(var k=0;k<NP;k++)if(!S.gone[k])n++;return n}
    function onPlayers(C,list){if(!S.ids)return;var now={};(list||[]).forEach(function(p){now[p.id]=1});var ch=false;
      S.ids.forEach(function(id,k){if(!now[id]&&!S.gone[k]){S.gone[k]=true;ch=true;C.pop(String(pname(C,k+1)).slice(0,14)+' est parti','#f1ece2','40px')}});if(!ch)return;
      if(!S.over&&alive()<2){S.over=true;S.q=[];C.over('Partie arrêtée','Les autres joueurs ont quitté le salon.','Rejouer',function(){again(C)});return}
      if(!S.anim&&S.gone[S.turn-1])nextTurn()}
    /* v64 : un coup reçu pendant qu'un jeton tombe encore est mis en file d'attente au lieu d'être perdu (grilles différentes à 3-4 joueurs) */
    function drop(C,c,remote){if(S.over)return;if(S.anim){if(remote)S.q.push(c);return}var r=top(S.b,c);if(r<0)return;S.anim={c:c,r:r,y:-1,v:0,p:S.turn};sfx.play('ui');
      if(C.mode==='online'&&!remote)C.net.relay({t:'c4',c:c})}
    /* v64 : n'importe quel joueur peut cliquer « Rejouer » : la nouvelle manche (numérotée) est envoyée à tous */
    function again(C){S.first=S.first%NP+1;for(var k=0;k<NP&&S.gone[S.first-1];k++)S.first=S.first%NP+1;S.rd++;newBoard();C.go();if(C.mode==='online')C.net.relay({t:'c4new',f:S.first,rd:S.rd});aiTurn(C)}
    function land(C){var a=S.anim;S.b[a.c][a.r]=a.p;S.anim=null;sfx.play('hit');C.shake(3);var w=lines(S.b,a.p);
      if(w){S.over=true;S.win=w;S.score[a.p-1]++;C.pop('4 ALIGNÉS !',PC[a.p-1]);C.shake(8);if(vb(C)&&a.p===1)C.win();if(C.mode==='online'&&a.p-1===S.me)C.win();sfx.play(a.p===1||!vb(C)?'win':'lose');
        var sc=[];for(var i=0;i<NP;i++)sc.push('<b style="color:'+PC[i]+'">'+S.score[i]+'</b> '+PP.esc(pname(C,i+1)));
        var rd=S.rd;setTimeout(function(){if(S.rd!==rd)return;C.over((vb(C)?(a.p===1?'Gagné !':C.mode==='solo'?'L\'ordi gagne':pname(C,a.p)+' gagne'):pname(C,a.p)+' gagne !'),'Score : '+sc.join(' · '),'Rejouer',function(){again(C)})},900);return}
      if(full(S.b)){S.over=true;var rd2=S.rd;setTimeout(function(){if(S.rd!==rd2)return;C.over('Égalité','Plus de place sur la grille.','Rejouer',function(){again(C)})},600);return}
      nextTurn();if(S.q.length){drop(C,S.q.shift(),true);return}aiTurn(C)}
    function aiTurn(C){if(!vb(C)||S.turn===1||S.over)return;var t=S.turn;setTimeout(function(){if(S.turn===t&&!S.over&&!S.anim)drop(C,NP===2&&COLS===7?aiMove():aiMulti(t))},C.mode==='solo'?450:600)}
    function myTurn(C){return C.mode==='duel'||C.mode==='p3'||C.mode==='p4'||(vb(C)&&S.turn===1)||(C.mode==='online'&&S.turn-1===S.me)}
    PP.arcade({id:'c4',
      setup:function(C){S=fresh();var np=C.mode==='p3'||C.mode==='b3'?3:C.mode==='p4'||C.mode==='b4'?4:2;
        if(C.mode==='online'){var pl=C.net.players.slice(0,4);np=Math.max(2,pl.length);var ids=pl.map(function(p){return p.id}),i=ids.indexOf(C.net.me.id);S.me=i<0?9:i;S.names=pl.map(function(p){return p.name});S.ids=ids;
          C.listen(function(m){if(m.t==='players'){onPlayers(C,m.players);return}if(m.t!=='rel')return;var d=m.d;if(d.t==='c4')drop(C,d.c,true);if(d.t==='c4new'&&(d.rd==null||d.rd>S.rd)){S.rd=d.rd||S.rd+1;S.first=d.f;newBoard();C.go()}})}
        layout(np);newBoard();
        C.keysText('Souris : clique une colonne · Clavier : <kbd>←</kbd><kbd>→</kbd> puis <kbd>Espace</kbd>');
        var msg=C.mode!=='solo'&&vb(C)?'Tu joues les rouges contre '+(np-1)+' ordis, sur une grande grille. Aligne 4 jetons avant eux !':vb(C)?'Tu joues les rouges contre l\'ordinateur. Aligne 4 jetons (ligne, colonne ou diagonale).':C.mode==='duel'?'Rouge contre jaune, chacun son tour sur le même écran.':
          C.mode!=='online'?np+' joueurs sur le même écran, chacun sa couleur, sur une grande grille. Le premier qui aligne 4 jetons gagne.':
          (S.me>3?'Le salon est complet (4 joueurs max) : tu regardes la partie.':np+' joueurs du salon sur '+(np>2?'une grande grille':'la grille')+'. Tu es <b style="color:'+PC[S.me]+'">'+PN[S.me]+'</b>.'+(np>2?' Plus on est, plus c\'est le chaos !':''));
        C.over('Quatre en ligne',msg,'Jouer')},
      start:function(C){aiTurn(C)},
      key:function(C,k,down){if(!down||!C.running)return;if(k==='ArrowLeft')S.hover=Math.max(0,S.hover-1);if(k==='ArrowRight')S.hover=Math.min(COLS-1,S.hover+1);if((k==='Space'||k==='Enter')&&myTurn(C))drop(C,S.hover)},
      mouse:function(C,t,x,y){var c=Math.floor((x-GX)/CS);if(c<0||c>=COLS)return;S.hover=c;if(t==='down'&&C.running&&myTurn(C))drop(C,c)},
      step:function(C,dt){if(S.anim){var a=S.anim;a.v+=dt*38;a.y+=a.v*dt;if(a.y>=ROWS-1-a.r){if(a.v>6){a.y=ROWS-1-a.r;a.v*=-.28}else{a.y=ROWS-1-a.r;land(C)}}}},
      draw:function(C){var g=C.g,R=CS*.4;g.fillStyle=INK;g.fillRect(0,0,960,540);
        g.fillStyle='#000';ag.rr(g,GX+8,GY+8,COLS*CS,ROWS*CS,16);g.fill();
        function tok(x,y,p,al){g.globalAlpha=al||1;var gr=g.createRadialGradient(x-R*.35,y-R*.4,3,x,y,R);gr.addColorStop(0,PL[p-1]);gr.addColorStop(1,PC[p-1]);g.fillStyle=gr;g.beginPath();g.arc(x,y,R,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=3;g.beginPath();g.arc(x,y,R*.7,0,7);g.stroke();g.globalAlpha=1}
        for(var c=0;c<COLS;c++)for(var r=0;r<ROWS;r++){var v=S.b[c][r];if(v)tok(GX+c*CS+CS/2,GY+(ROWS-1-r)*CS+CS/2,v)}
        if(S.anim)tok(GX+S.anim.c*CS+CS/2,GY+S.anim.y*CS+CS/2,S.anim.p);
        var H=R+2;g.save();g.beginPath();ag.rr(g,GX,GY,COLS*CS,ROWS*CS,16);for(c=0;c<COLS;c++)for(r=0;r<ROWS;r++){g.moveTo(GX+c*CS+CS/2+H,GY+r*CS+CS/2);g.arc(GX+c*CS+CS/2,GY+r*CS+CS/2,H,0,7,true)}
        var bg=g.createLinearGradient(0,GY,0,GY+ROWS*CS);bg.addColorStop(0,'#2b5fb0');bg.addColorStop(1,'#1c3f80');g.fillStyle=bg;g.fill('evenodd');g.restore();
        for(c=0;c<COLS;c++)for(r=0;r<ROWS;r++){g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=3;g.beginPath();g.arc(GX+c*CS+CS/2,GY+r*CS+CS/2,H,0,7);g.stroke()}
        if(S.win){g.strokeStyle=CR;g.lineWidth=8;g.lineCap='round';g.beginPath();S.win.forEach(function(p,i){var x=GX+p[0]*CS+CS/2,y=GY+(ROWS-1-p[1])*CS+CS/2;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke()}
        if(C.running&&!S.over&&!S.anim&&myTurn(C))tok(GX+S.hover*CS+CS/2,GY-R-6,S.turn,.55);
        /* scores : 2 joueurs de chaque côté */
        for(var i=0;i<NP;i++){var left=i%2===0,x=left?(GX/2):(GX+COLS*CS+(960-GX-COLS*CS)/2),y=NP>2?(i<2?170:350):240,on=C.running&&!S.over&&S.turn===i+1;
          if(on){g.fillStyle='rgba(241,236,226,.08)';ag.rr(g,x-70,y-62,140,118,12);g.fill()}
          ag.txt(g,String(S.score[i]),x,y-12,NP>2?58:80,PC[i]);ag.mono(g,String(pname(C,i+1)).slice(0,12).toUpperCase(),x,y+36,14,on?PC[i]:CR)}
        if(C.running&&!S.over)ag.mono(g,(myTurn(C)?(C.mode==='online'||vb(C)?'À toi':'Au tour de '+pname(C,S.turn)):vb(C)?(C.mode==='solo'?'L\'ordi':pname(C,S.turn))+' réfléchit…':'Au tour de '+pname(C,S.turn)),480,528,15,PC[S.turn-1]);
      }});
  })();

  /* ================= AIR HOCKEY ================= */
  (function(){
    var S,W=960,H=540,GOAL=170,R_M=34,R_P=20,WIN=7;
    function reset(srv){S.tr=[];S.still=0;S.p={x:W/2+(srv?-60:60)*0,y:H/2,vx:0,vy:0};S.p.x=W/2+(srv===1?-120:srv===2?120:0);S.m=[{x:150,y:H/2,vx:0,vy:0,px:150,py:H/2},{x:W-150,y:H/2,vx:0,vy:0,px:W-150,py:H/2}];S.wait=.8}
    /* v53 : le palet ne se coince plus. Coins arrondis comme sur le dessin, palet coincé contre une bande qui ressort tout seul,
       et petit coup de pouce vers le centre s'il reste immobile. */
    var RC=56;PP._hk=function(){return S};
    function corner(o,r,b){if(!((o.x<12+RC||o.x>W-12-RC)&&(o.y<12+RC||o.y>H-12-RC)))return false;var cx=o.x<W/2?12+RC:W-12-RC,cy=o.y<H/2?12+RC:H-12-RC,dx=o.x-cx,dy=o.y-cy,d=Math.hypot(dx,dy),mx=RC-r;
      if(d>mx&&d>0){var nx=dx/d,ny=dy/d;o.x=cx+nx*mx;o.y=cy+ny*mx;if(b){var vn=o.vx*nx+o.vy*ny;if(vn>0){o.vx-=1.92*vn*nx;o.vy-=1.92*vn*ny}}return true}return false}
    function clampP(P){var ox=P.x,oy=P.y;if(P.y<R_P+12)P.y=R_P+12;if(P.y>H-R_P-12)P.y=H-R_P-12;if(Math.abs(P.y-H/2)>=GOAL/2){if(P.x<R_P+12)P.x=R_P+12;if(P.x>W-R_P-12)P.x=W-R_P-12}corner(P,R_P,false);return Math.hypot(P.x-ox,P.y-oy)>.3}
    PP.arcade({id:'hockey',
      setup:function(C){S={sc:[0,0],mouse:null,fx:[]};reset(0);C.keysText(C.mode==='solo'?'Ton palet suit la souris (ou <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd>) · premier à '+WIN:'J1 <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> · J2 <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> · premier à '+WIN);
        C.over('Air Hockey','Marque dans le but d\'en face. Frappe fort en arrivant vite sur le palet. Premier à '+WIN+' buts.','Engagement')},
      start:function(C){S.sc=[0,0];reset(0)},
      mouse:function(C,t,x,y){if(C.mode==='solo')S.mouse=[x,y]},
      step:function(C,dt){
        var k=C.keys;function ctl(m,i,up,lf,dn,rt){var sp=640,ax=(k[rt]?1:0)-(k[lf]?1:0),ay=(k[dn]?1:0)-(k[up]?1:0);if(ax||ay){var l=Math.hypot(ax,ay);m.x+=ax/l*sp*dt;m.y+=ay/l*sp*dt}}
        var m0=S.m[0],m1=S.m[1];m0.px=m0.x;m0.py=m0.y;m1.px=m1.x;m1.py=m1.y;
        if(C.mode==='solo'&&S.mouse&&!(k.KeyW||k.KeyA||k.KeyS||k.KeyD||k.KeyZ||k.KeyQ)){m0.x+=(S.mouse[0]-m0.x)*Math.min(1,dt*18);m0.y+=(S.mouse[1]-m0.y)*Math.min(1,dt*18)}
        ctl(m0,0,'KeyW','KeyA','KeyS','KeyD');ctl(m0,0,'KeyZ','KeyQ','KeyS','KeyD');
        if(C.mode==='duel')ctl(m1,1,'ArrowUp','ArrowLeft','ArrowDown','ArrowRight');
        else{var p=S.p,tx=W-110,ty=H/2;if(p.x>W/2-40){tx=p.x+28;ty=p.y;if(p.vx>200&&p.x<W-200){tx=W-120;ty=p.y}}else{ty=H/2+(p.y-H/2)*.5}var sp=430*dt,dx=tx-m1.x,dy=ty-m1.y,dl=Math.hypot(dx,dy);if(dl>1){m1.x+=dx/dl*Math.min(dl,sp);m1.y+=dy/dl*Math.min(dl,sp)}}
        [m0,m1].forEach(function(m,i){m.x=Math.max(i?W/2+R_M:R_M+12,Math.min(i?W-R_M-12:W/2-R_M,m.x));m.y=Math.max(R_M+12,Math.min(H-R_M-12,m.y));corner(m,R_M,false);m.vx=(m.x-m.px)/Math.max(dt,1e-3);m.vy=(m.y-m.py)/Math.max(dt,1e-3)});
        if(S.wait>0){S.wait-=dt;return}
        S.hitCd=Math.max(0,(S.hitCd||0)-dt);
        var P=S.p,steps=6;for(var s=0;s<steps;s++){var h=dt/steps;P.x+=P.vx*h;P.y+=P.vy*h;
          if(P.y<R_P+12){P.y=R_P+12;P.vy=Math.abs(P.vy)*.92;sfx.play('tick')}if(P.y>H-R_P-12){P.y=H-R_P-12;P.vy=-Math.abs(P.vy)*.92;sfx.play('tick')}
          var inGoal=Math.abs(P.y-H/2)<GOAL/2;
          if(P.x<R_P+12&&!inGoal){P.x=R_P+12;P.vx=Math.abs(P.vx)*.92;sfx.play('tick')}if(P.x>W-R_P-12&&!inGoal){P.x=W-R_P-12;P.vx=-Math.abs(P.vx)*.92;sfx.play('tick')}
          if(corner(P,R_P,true)&&S.hitCd<=0&&Math.hypot(P.vx,P.vy)>80){sfx.play('tick');S.hitCd=.08}
          if(P.x<-R_P||P.x>W+R_P){var sc=P.x<0?1:0;S.sc[sc]++;C.pop('BUT !',sc?'#3fa9ff':'#e2361b');C.shake(10);sfx.play(sc===0||C.mode==='duel'?'win':'lose');for(var f=0;f<30;f++)S.fx.push({x:P.x<0?20:W-20,y:P.y,vx:(Math.random()-.5)*500,vy:(Math.random()-.5)*500,t:1});
            if(S.sc[sc]>=WIN){C.stop();if(C.mode==='solo'&&sc===0)C.win();C.over(C.mode==='solo'?(sc===0?'Victoire !':'Perdu'):(sc===0?'J1 gagne !':'J2 gagne !'),S.sc[0]+' – '+S.sc[1],'Revanche');return}reset(sc===0?2:1);return}
          S.m.forEach(function(m){var dx=P.x-m.x,dy=P.y-m.y,d=Math.hypot(dx,dy),md=R_M+R_P;if(d<md){if(d<=0){dx=m.x<W/2?1:-1;dy=0;d=1}var nx=dx/d,ny=dy/d;P.x=m.x+nx*md;P.y=m.y+ny*md;var rv=(P.vx-m.vx)*nx+(P.vy-m.vy)*ny;
              if(rv<0){P.vx-=1.9*rv*nx;P.vy-=1.9*rv*ny;if(S.hitCd<=0){sfx.play('hit');S.hitCd=.12;for(var q=0;q<6;q++)S.fx.push({x:P.x-nx*R_P,y:P.y-ny*R_P,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*260,t:.5})}}
              /* palet écrasé entre un maillet et la bande : le maillet recule et le palet file le long de la bande vers le centre */
              if(clampP(P)){m.x=P.x-nx*md;m.y=P.y-ny*md;var tx=-ny,ty=nx;if(tx*(W/2-P.x)+ty*(H/2-P.y)<0){tx=-tx;ty=-ty}var ps=Math.max(320,Math.hypot(m.vx,m.vy)*.6);P.vx=tx*ps+(W/2-P.x>0?40:-40);P.vy=ty*ps+(H/2-P.y>0?40:-40)}}})}
        P.vx*=Math.pow(.6,dt);P.vy*=Math.pow(.6,dt);var spd=Math.hypot(P.vx,P.vy);if(spd>1500){P.vx*=1500/spd;P.vy*=1500/spd}
        /* palet immobile trop longtemps : la table le renvoie doucement vers le centre */
        S.still=spd<35?(S.still||0)+dt:0;if(S.still>2.2){var cd=Math.hypot(W/2-P.x,H/2-P.y)||1;P.vx+=(W/2-P.x)/cd*190+(Math.random()-.5)*60;P.vy+=(H/2-P.y)/cd*190+(Math.random()-.5)*60;S.still=0}
        S.tr=S.tr||[];S.tr.push([P.x,P.y,spd]);if(S.tr.length>9)S.tr.shift();
        S.fx=S.fx.filter(function(f){f.t-=dt*1.5;f.x+=f.vx*dt;f.y+=f.vy*dt;return f.t>0});
        C.hud('<span>J1 <b>'+S.sc[0]+'</b></span><span>'+(C.mode==='solo'?'Ordi':'J2')+' <b>'+S.sc[1]+'</b></span>')},
      draw:function(C){var g=C.g;var bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#dfe9ef');bg.addColorStop(1,'#c9d8e2');g.fillStyle=INK;g.fillRect(0,0,W,H);ag.rr(g,8,8,W-16,H-16,60);g.fillStyle=bg;g.fill();
        g.strokeStyle=RED;g.lineWidth=4;g.beginPath();g.moveTo(W/2,10);g.lineTo(W/2,H-10);g.stroke();g.beginPath();g.arc(W/2,H/2,70,0,7);g.stroke();g.strokeStyle=BLU;[0,W].forEach(function(x){g.beginPath();g.arc(x,H/2,GOAL/2+30,0,7);g.stroke()});
        for(var i=0;i<40;i++){g.fillStyle='rgba(20,18,16,.08)';g.beginPath();g.arc(40+(i%10)*98,60+Math.floor(i/10)*140,2,0,7);g.fill()}
        g.fillStyle=INK;g.fillRect(0,H/2-GOAL/2,14,GOAL);g.fillRect(W-14,H/2-GOAL/2,14,GOAL);
        ag.txt(g,S.sc[0]+'',W/2-80,60,54,'rgba(226,54,27,.35)');ag.txt(g,S.sc[1]+'',W/2+80,60,54,'rgba(63,169,255,.45)');
        var P=S.p;(S.tr||[]).forEach(function(t,i){if(t[2]<350)return;g.fillStyle='rgba(20,18,16,'+(.03+i*.012)+')';g.beginPath();g.arc(t[0],t[1],R_P*(.45+i*.055),0,7);g.fill()});
        g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(P.x+5,P.y+6,R_P,R_P*.8,0,0,7);g.fill();g.fillStyle=INK;g.beginPath();g.arc(P.x,P.y,R_P,0,7);g.fill();g.strokeStyle='#444';g.lineWidth=3;g.beginPath();g.arc(P.x,P.y,R_P-6,0,7);g.stroke();
        S.m.forEach(function(m,i){var c=i?BLU:RED;g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.arc(m.x+6,m.y+8,R_M,0,7);g.fill();var gr=g.createRadialGradient(m.x-10,m.y-12,4,m.x,m.y,R_M);gr.addColorStop(0,i?'#9fd4ff':'#ff8a6a');gr.addColorStop(1,c);g.fillStyle=gr;g.beginPath();g.arc(m.x,m.y,R_M,0,7);g.fill();g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.arc(m.x,m.y,13,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(m.x,m.y,8,0,7);g.fill()});
        S.fx.forEach(function(f){g.globalAlpha=f.t;g.fillStyle=YEL;g.fillRect(f.x,f.y,5,5)});g.globalAlpha=1;
        if(S.wait>0&&C.running)ag.txt(g,'PRÊTS',W/2,H/2,64,'rgba(20,18,16,.25)')}
    });
  })();

  /* ================= TOUR INFINIE (3D) ================= */
  (function(){
    var S,BH=1;
    function col(i){var c=new THREE.Color();c.setHSL((.02+i*.035)%1,.62,.56);return c}
    function box(w,d,y,i){var m=new THREE.Mesh(new THREE.BoxGeometry(w,BH,d),new THREE.MeshLambertMaterial({color:col(i)}));m.position.y=y;m.castShadow=true;m.receiveShadow=true;return m}
    function newMover(C){var t=S.stack[S.stack.length-1],i=S.stack.length,ax=i%2?'x':'z',m=box(t.w,t.d,i*BH,i);m.position.x=t.x;m.position.z=t.z;m.position[ax]=-12;C.scene.add(m);S.mov={m:m,ax:ax,dir:1,w:t.w,d:t.d,x:t.x,z:t.z,sp:9+Math.min(9,i*.25)};S.mov[ax]=-12}
    PP.arcade({id:'stack',three:true,
      setup:function(C){ag.three(C,0x1a1816);var sc=C.scene;while(sc.children.length)sc.remove(sc.children[0]);
        sc.add(new THREE.HemisphereLight(0xfff4e0,0x303040,.9));var sun=new THREE.DirectionalLight(0xffffff,1.2);sun.position.set(10,20,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);var s2=sun.shadow.camera;s2.left=s2.bottom=-15;s2.right=s2.top=15;sc.add(sun);S={sun:sun};
        S.stack=[];S.fall=[];S.score=0;S.combo=0;S.camY=0;S.over=false;var base=new THREE.Mesh(new THREE.BoxGeometry(6,8,6),new THREE.MeshLambertMaterial({color:0x2a2622}));base.position.y=-4.5;base.receiveShadow=true;sc.add(base);var cvb=document.createElement('canvas');cvb.width=4;cvb.height=256;var gb=cvb.getContext('2d'),gr=gb.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#2b1d3a');gr.addColorStop(.6,'#e2836b');gr.addColorStop(1,'#f3c99a');gb.fillStyle=gr;gb.fillRect(0,0,4,256);sc.background=new THREE.CanvasTexture(cvb);var first=box(6,6,0,0);sc.add(first);S.stack.push({w:6,d:6,x:0,z:0,m:first});S.mov=null;
        C.cam.position.set(14,14,14);C.cam.lookAt(0,0,0);C.keysText('<kbd>Espace</kbd>, clic ou toucher : poser le bloc · un bloc posé pile au bon endroit ne rétrécit pas');
        C.over('Tour Infinie','Pose chaque bloc au-dessus du précédent. Ce qui dépasse tombe. Plus tu es précis, plus tu montes haut.<br>Record : <b>'+C.best('h')+'</b>','Jouer')},
      start:function(C){if(S.stack.length>1){this.setup(C);C.hide()}newMover(C)},
      key:function(C,k,down){if(down&&k==='Space'&&C.running)place(C)},
      mouse:function(C,t){if(t==='down'&&C.running)place(C)},
      step:function(C,dt){var M=S.mov;if(M&&!S.over){M[M.ax]+=M.dir*M.sp*dt;if(Math.abs(M[M.ax])>12)M.dir*=-1;M.m.position[M.ax]=M[M.ax]}
        S.fall=S.fall.filter(function(f){f.vy-=30*dt;f.m.position.y+=f.vy*dt;f.m.rotation.x+=f.rx*dt;f.m.rotation.z+=f.rz*dt;if(f.m.position.y<-40){C.scene.remove(f.m);return false}return true});
        var ty=Math.max(0,S.stack.length-4)*BH;S.camY+=(ty-S.camY)*Math.min(1,dt*3);var zm=S.over?Math.max(14,S.stack.length*.9):14;C.cam.position.set(zm,S.camY+zm,zm);C.cam.lookAt(0,S.camY,0);S.sun.position.set(10,S.camY+20,8);S.sun.target.position.set(0,S.camY,0);S.sun.target.updateMatrixWorld();
        C.hud('<span>Hauteur <b>'+S.score+'</b></span>'+(S.combo>1?'<span>Parfait x'+S.combo+'</span>':''))},
      draw:function(C){C.R.render(C.scene,C.cam)}});
    function place(C){var M=S.mov;if(!M||S.over)return;var t=S.stack[S.stack.length-1],ax=M.ax,size=ax==='x'?M.w:M.d,delta=M[ax]-t[ax],ov=size-Math.abs(delta);
      if(ov<=0){S.over=true;S.fall.push({m:M.m,vy:0,rx:1,rz:.6});S.mov=null;sfx.play('lose');C.shake(10);var nb=C.best('h',S.score);C.stop();setTimeout(function(){C.over('Écroulé !','Hauteur : <b>'+S.score+'</b>'+(nb?' · nouveau record !':' · record '+C.best('h')),'Rejouer')},900);return}
      if(Math.abs(delta)<.18){delta=0;ov=size;S.combo++;sfx.play('win');C.pop(S.combo>2?'PARFAIT x'+S.combo:'PARFAIT !','#f1ece2','46px')}else{S.combo=0;sfx.play('hit')}
      var nw=ax==='x'?ov:M.w,nd=ax==='z'?ov:M.d,nc=t[ax]+delta/2;C.scene.remove(M.m);var i=S.stack.length,m=box(nw,nd,i*BH,i);m.position.x=ax==='x'?nc:t.x;m.position.z=ax==='z'?nc:t.z;C.scene.add(m);
      var rec={w:nw,d:nd,x:m.position.x,z:m.position.z,m:m};
      if(S.combo>=3){rec.w=Math.min(6,rec.w+.3);rec.d=Math.min(6,rec.d+.3);m.scale.set(rec.w/nw,1,rec.d/nd)}
      S.stack.push(rec);
      if(delta){var cw=ax==='x'?Math.abs(delta):M.w,cd=ax==='z'?Math.abs(delta):M.d,cut=box(cw,cd,i*BH,i);cut.position.x=ax==='x'?nc+Math.sign(delta)*(ov/2+Math.abs(delta)/2):t.x;cut.position.z=ax==='z'?nc+Math.sign(delta)*(ov/2+Math.abs(delta)/2):t.z;C.scene.add(cut);S.fall.push({m:cut,vy:0,rx:(Math.random()-.5)*3,rz:(Math.random()-.5)*3})}
      S.score++;newMover(C)}
  })();

  /* ================= RÉFLEXES ================= */
  (function(){
    var S,ROUNDS=5;
    function next(C){S.r++;if(S.r>ROUNDS)return end(C);S.phase='wait';S.t=0;S.goAt=1.4+Math.random()*2.6;S.press={};S.msg=''}
    function end(C){S.phase='end';C.stop();var h;
      if(C.mode==='solo'){var ok=S.times.filter(function(x){return x>0}),avg=ok.length?Math.round(ok.reduce(function(a,b){return a+b},0)/ok.length):0;var nb=avg&&C.best('ms',avg,true);if(avg&&avg<260)C.win();h='Moyenne : <b>'+(avg?avg+' ms':'—')+'</b>'+(nb?' · nouveau record !':(C.best('ms')?' · record '+C.best('ms')+' ms':''))}
      else if(C.mode==='duel'){h='J1 (A) <b>'+S.pts[0]+'</b> – <b>'+S.pts[1]+'</b> J2 (L)';}
      C.over(C.mode==='solo'?'Terminé':S.pts[0]===S.pts[1]?'Égalité':(S.pts[0]>S.pts[1]?'J1 gagne !':'J2 gagne !'),h,'Rejouer')}
    function hit(C,who){
      if(C.mode==='online'){if(S.phase==='wait'&&!S.sent){S.sent=true;S.msg='Trop tôt !';sfx.play('lose');C.net.send({t:'rx-a',r:S.r,ms:-1})}else if(S.phase==='go'&&!S.sent){S.sent=true;var ms=Math.round(performance.now()-S.goT);S.msg=ms+' ms';sfx.play('ui');C.net.send({t:'rx-a',r:S.r,ms:ms})}return}
      if(S.phase==='wait'){if(S.press[who])return;S.press[who]='early';sfx.play('lose');if(C.mode==='solo'){S.times.push(-1);S.msg='Trop tôt !';S.phase='show';S.t=0}else{S.pts[1-who]++;S.msg=(who?'J2':'J1')+' trop tôt ! Point pour '+(who?'J1':'J2');S.phase='show';S.t=0}}
      else if(S.phase==='go'){if(S.press[who])return;var ms2=Math.round(performance.now()-S.goT);S.press[who]=ms2;sfx.play('win');C.pop(ms2+' ms',ms2<250?'#3fe09a':'#f3c623');if(C.mode==='solo'){S.times.push(ms2);S.msg=ms2+' ms';S.phase='show';S.t=0}else{S.pts[who]++;S.msg=(who?'J2':'J1')+' en '+ms2+' ms';S.phase='show';S.t=0}}}
    /* salon : l'hôte donne le départ, chacun mesure son temps chez lui */
    function hostRound(C){S.r++;if(S.r>ROUNDS){C.net.all({t:'rx-end',tot:S.tot});return}S.ans={};var d=1.4+Math.random()*2.6;C.net.all({t:'rx-r',r:S.r,d:d});setTimeout(function(){hostReveal(C,S.r)},d*1000+2600)}
    function hostReveal(C,r){if(S.r!==r)return;var rows=C.net.players.map(function(p){var a=S.ans[p.id];return {n:p.name,ms:a==null?null:a}});var okr=rows.filter(function(x){return x.ms>0}).sort(function(a,b){return a.ms-b.ms});okr.forEach(function(x,i){S.tot[x.n]=(S.tot[x.n]||0)+Math.max(1,C.net.players.length-i)});C.net.all({t:'rx-res',rows:rows,tot:S.tot});setTimeout(function(){hostRound(C)},2600)}
    PP.arcade({id:'reflex',
      setup:function(C){S={r:0,phase:'idle',times:[],pts:[0,0],tot:{},msg:'',rows:null};
        C.keysText(C.mode==='duel'?'J1 <kbd>A</kbd> (ou <kbd>Q</kbd>) · J2 <kbd>L</kbd> · le premier qui appuie quand ça devient rouge gagne la manche':'<kbd>Espace</kbd>, clic ou toucher dès que l\'écran devient rouge');
        if(C.mode==='online'){C.listen(function(m,from){
            if(C.net.isHost&&m.t==='rx-a'&&m.r===S.r&&S.ans[from]==null)S.ans[from]=m.ms;
            if(m.t==='rx-r'){C.hide();C.running=true;S.r=m.r;S.phase='wait';S.t=0;S.goAt=m.d;S.sent=false;S.msg='';S.rows=null}
            if(m.t==='rx-res'){S.rows=m.rows;S.tot=m.tot;S.phase='show'}
            if(m.t==='rx-end'){S.phase='end';C.stop();var arr=Object.keys(m.tot).map(function(k){return [k,m.tot[k]]}).sort(function(a,b){return b[1]-a[1]});if(arr[0]&&arr[0][0]===C.net.me.name)C.win();C.over('Classement',arr.map(function(a,i){return (i+1)+'. '+PP.esc(a[0])+' — '+a[1]+' pts'}).join('<br>')||'—',C.net.isHost?'Rejouer':false,C.net.isHost?function(){S.r=0;S.tot={};C.hide();hostRound(C)}:null)}});
          C.over('Réflexes',ROUNDS+' manches pour tout le salon. Appuie dès que l\'écran devient rouge, pas avant !',C.net.isHost?'Lancer':false,C.net.isHost?function(){S.r=0;S.tot={};C.hide();hostRound(C)}:null);if(!C.net.isHost)$msg(C,'L\'hôte lance la partie');return}
        C.over('Réflexes',C.mode==='solo'?ROUNDS+' essais. Appuie dès que l\'écran devient rouge. Trop tôt = essai raté.':ROUNDS+' manches. Le plus rapide marque, appuyer trop tôt donne le point à l\'autre.','Jouer')},
      start:function(C){S.r=0;S.times=[];S.pts=[0,0];next(C)},
      key:function(C,k,down){if(!down||!C.running)return;if(C.mode==='duel'){if(k==='KeyA'||k==='KeyQ')hit(C,0);if(k==='KeyL')hit(C,1)}else if(k==='Space'||k==='Enter')hit(C,0)},
      mouse:function(C,t,x){if(t==='down'&&C.running){if(C.mode==='duel')hit(C,x<480?0:1);else hit(C,0)}},
      step:function(C,dt){S.t+=dt;if(S.phase==='wait'&&S.t>=S.goAt){S.phase='go';S.goT=performance.now();sfx.play('tick')}
        if(C.mode!=='online'&&S.phase==='show'&&S.t>1.6){next(C)}if(C.mode!=='online'&&S.phase==='go'&&performance.now()-S.goT>2500){if(C.mode==='solo'){S.times.push(-1);S.msg='Trop lent'}else S.msg='Personne…';S.phase='show';S.t=0}
        C.hud('<span>Manche <b>'+Math.min(S.r,ROUNDS)+' / '+ROUNDS+'</b></span>'+(C.mode==='duel'?'<span>J1 <b>'+S.pts[0]+'</b> – <b>'+S.pts[1]+'</b> J2</span>':''))},
      draw:function(C){var g=C.g,ph=S.phase;g.fillStyle=ph==='go'?RED:ph==='wait'?'#1f3a5a':INK;g.fillRect(0,0,960,540);
        if(ph==='wait'){ag.txt(g,'ATTENDS…',480,250,96,CR);ag.mono(g,'pas encore',480,330,18,'rgba(241,236,226,.6)')}
        else if(ph==='go'){ag.txt(g,'MAINTENANT !',480,260,110,CR)}
        else if(ph==='show'){if(S.rows){var r=S.rows.slice().sort(function(a,b){return (a.ms>0?a.ms:1e9)-(b.ms>0?b.ms:1e9)});r.forEach(function(x,i){ag.mono(g,(i+1)+'. '+x.n+'  '+(x.ms==null?'—':x.ms<0?'trop tôt':x.ms+' ms'),480,140+i*42,24,i?CR:YEL)})}else ag.txt(g,S.msg,480,270,70,S.msg.indexOf('tôt')>=0?'#ff8a6a':YEL)}
        if(C.mode==='online'&&S.msg&&ph!=='show')ag.mono(g,S.msg,480,470,22,YEL);
        if(C.mode==='duel'&&C.running){g.fillStyle='rgba(241,236,226,.06)';g.fillRect(0,0,480,540);ag.mono(g,'J1 · A',120,500,18,'rgba(241,236,226,.6)');ag.mono(g,'J2 · L',840,500,18,'rgba(241,236,226,.6)')}}});
    function $msg(C,t){PP.$('reflex-msg').innerHTML+= '<br><i>'+t+'</i>'}
  })();

  /* ================= CASSE-BRIQUES NÉON ================= */
  (function(){
    var S,W=960,H=540,BW=72,BHt=24;
    var LV=[
      ['..111111..','.11222211.','1122332211','1122332211','.11222211.'],
      ['3.3.3.3.3.','.2.2.2.2.2','1111111111','2222222222','3.3.3.3.3.'],
      ['1........1','12......21','123....321','1234..4321','1234444321'],
      ['4444444444','1.1.1.1.1.','.2.2.2.2.2','3333333333','..4....4..','1111111111'],
      ['2222222222','2333333332','2344444432','2344444432','2333333332','2222222222']];
    var COL=['','#3fa9ff','#3fe09a','#f3c623','#e2361b'];
    function load(){var L=LV[(S.lv-1)%LV.length];S.br=[];L.forEach(function(row,j){row.split('').forEach(function(ch,i){if(ch!=='.')S.br.push({x:40+i*(BW+16),y:60+j*(BHt+12),hp:+ch,max:+ch})})});resetBall()}
    function resetBall(){S.balls=[{x:S.pad.x,y:H-70,vx:0,vy:0,stuck:true}]}
    function launch(){S.balls.forEach(function(b){if(b.stuck){b.stuck=false;var a=-Math.PI/2+(Math.random()-.5)*.6,sp=420+S.lv*25;b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp}})}
    PP.arcade({id:'bricks',
      setup:function(C){S={lv:1,lives:3,score:0,pad:{x:W/2,w:130},fx:[],pw:[],wide:0,slow:0,mouse:null};load();C.keysText('Souris ou <kbd>←</kbd><kbd>→</kbd> · <kbd>Espace</kbd> ou clic : lancer la balle');
        C.over('Casse-Briques Néon','Casse toutes les briques. Attrape les bonus qui tombent : raquette large (L), multi-balles (M), balle lente (S). '+LV.length+' niveaux, 3 vies.<br>Record : <b>'+C.best('pts')+'</b>','Jouer')},
      start:function(C){S.lv=1;S.lives=3;S.score=0;S.pad.w=130;S.wide=S.slow=0;S.pw=[];load()},
      mouse:function(C,t,x){S.mouse=x;if(t==='down'&&C.running)launch()},
      key:function(C,k,d){if(d&&k==='Space'&&C.running)launch()},
      step:function(C,dt){var k=C.keys,p=S.pad;if(k.ArrowLeft)p.x-=760*dt;if(k.ArrowRight)p.x+=760*dt;if(S.mouse!=null&&!k.ArrowLeft&&!k.ArrowRight)p.x+=(S.mouse-p.x)*Math.min(1,dt*20);
        S.wide=Math.max(0,S.wide-dt);S.slow=Math.max(0,S.slow-dt);var tw=S.wide>0?200:130;p.w+=(tw-p.w)*Math.min(1,dt*8);p.x=Math.max(p.w/2,Math.min(W-p.w/2,p.x));
        var sf=S.slow>0?.6:1;
        S.balls.forEach(function(b){if(b.stuck){b.x=p.x;b.y=H-58;return}var n=3;for(var s=0;s<n;s++){var h=dt/n*sf;b.x+=b.vx*h;b.y+=b.vy*h;
          if(b.x<10){b.x=10;b.vx=Math.abs(b.vx)}if(b.x>W-10){b.x=W-10;b.vx=-Math.abs(b.vx)}if(b.y<10){b.y=10;b.vy=Math.abs(b.vy)}
          if(b.vy>0&&b.y>H-58&&b.y<H-38&&Math.abs(b.x-p.x)<p.w/2+8){S.combo=0;var off=(b.x-p.x)/(p.w/2),sp=Math.hypot(b.vx,b.vy)*1.01,a=-Math.PI/2+off*1.05;b.vx=Math.cos(a)*sp;b.vy=Math.sin(a)*sp;sfx.play('tick')}
          for(var i=0;i<S.br.length;i++){var r=S.br[i];if(b.x>r.x-8&&b.x<r.x+BW+8&&b.y>r.y-8&&b.y<r.y+BHt+8){var ox=Math.min(b.x-(r.x-8),(r.x+BW+8)-b.x),oy=Math.min(b.y-(r.y-8),(r.y+BHt+8)-b.y);if(ox<oy)b.vx=-b.vx;else b.vy=-b.vy;r.hp--;S.score+=10;sfx.play('hit');
            for(var f=0;f<8;f++)S.fx.push({x:b.x,y:b.y,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300,t:1,c:COL[r.max]});
            if(r.hp<=0){S.br.splice(i,1);S.score+=20;S.combo=(S.combo||0)+1;if(S.combo%5===0)C.pop('COMBO x'+S.combo,'#3fe09a','44px');if(r.max>=3)C.shake(4);if(Math.random()<.16)S.pw.push({x:r.x+BW/2,y:r.y,k:['L','M','S'][Math.random()*3|0]})}break}}}});
        S.balls=S.balls.filter(function(b){return b.y<H+20});
        if(!S.balls.length){S.lives--;sfx.play('lose');C.shake(9);if(S.lives<=0){C.stop();var nb=C.best('pts',S.score);C.over('Partie terminée','Score : <b>'+S.score+'</b> · niveau '+S.lv+(nb?' · nouveau record !':''),'Rejouer');return}resetBall()}
        S.pw=S.pw.filter(function(w){w.y+=170*dt;if(w.y>H-60&&w.y<H-30&&Math.abs(w.x-p.x)<p.w/2+14){sfx.play('win');if(w.k==='L')S.wide=12;if(w.k==='S')S.slow=8;if(w.k==='M'){var b0=S.balls[0];if(b0){S.balls.push({x:b0.x,y:b0.y,vx:-b0.vx||200,vy:b0.vy||-400},{x:b0.x,y:b0.y,vx:b0.vx*.6+150,vy:b0.vy||-400})}}return false}return w.y<H+20});
        S.fx=S.fx.filter(function(f){f.t-=dt*2;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=400*dt;return f.t>0});
        if(!S.br.length){S.lv++;S.score+=200;sfx.play('win');C.pop('NIVEAU '+S.lv,'#3fa9ff');if(S.lv>LV.length){C.stop();C.win();var nb2=C.best('pts',S.score);C.over('Tu as tout cassé !','Score : <b>'+S.score+'</b>'+(nb2?' · nouveau record !':''),'Rejouer');return}load()}
        C.hud('<span>Niveau <b>'+S.lv+'</b></span><span>Score <b>'+S.score+'</b></span><span>Vies <b>'+'♥'.repeat(Math.max(0,S.lives))+'</b></span>')},
      draw:function(C){var g=C.g;g.fillStyle='#0e0d16';g.fillRect(0,0,W,H);if(!S.stars){S.stars=[];for(var si=0;si<90;si++)S.stars.push([Math.random()*W,Math.random()*H,Math.random()*1.6+.3])}var tn=performance.now()/1000;S.stars.forEach(function(st){g.fillStyle='rgba(241,236,226,'+(.25+.25*Math.sin(tn*2+st[0]))+')';g.fillRect(st[0],(st[1]+tn*st[2]*12)%H,st[2],st[2])});g.strokeStyle='rgba(120,110,200,.08)';g.lineWidth=1;for(var x=0;x<W;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke()}for(var y=0;y<H;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
        g.shadowBlur=18;S.br.forEach(function(r){var c=COL[r.hp];g.shadowColor=c;g.fillStyle=c;g.globalAlpha=.25+.75*(r.hp/r.max);ag.rr(g,r.x,r.y,BW,BHt,5);g.fill();g.globalAlpha=1;g.fillStyle='rgba(255,255,255,.25)';g.fillRect(r.x+4,r.y+3,BW-8,4)});
        var p=S.pad;g.shadowColor='#f1ece2';g.fillStyle=CR;ag.rr(g,p.x-p.w/2,H-52,p.w,14,7);g.fill();
        S.balls.forEach(function(b){b.tr=b.tr||[];b.tr.push([b.x,b.y]);if(b.tr.length>12)b.tr.shift();b.tr.forEach(function(p,i){g.globalAlpha=i/b.tr.length*.45;g.fillStyle='#9fd4ff';g.beginPath();g.arc(p[0],p[1],9*i/b.tr.length,0,7);g.fill()});g.globalAlpha=1;g.shadowColor='#fff';g.fillStyle='#fff';g.beginPath();g.arc(b.x,b.y,9,0,7);g.fill()});
        S.pw.forEach(function(w){var c={L:'#3fe09a',M:'#3fa9ff',S:'#f3c623'}[w.k];g.shadowColor=c;g.fillStyle=c;ag.rr(g,w.x-16,w.y-11,32,22,6);g.fill();g.shadowBlur=0;ag.mono(g,w.k,w.x,w.y+1,14,'#0e0d16');g.shadowBlur=18});
        g.shadowBlur=0;S.fx.forEach(function(f){g.globalAlpha=f.t;g.fillStyle=f.c;g.fillRect(f.x,f.y,4,4)});g.globalAlpha=1;
        if(C.running&&S.balls.some(function(b){return b.stuck}))ag.mono(g,'Espace ou clic pour lancer',W/2,H/2+80,18,'rgba(241,236,226,.6)')}});
  })();
})();
