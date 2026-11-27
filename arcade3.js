/* Pixel Pause — jeux arcade, lot 3 : Course de frappe, Quiz, Memory, Démineur, Pong néon */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,esc=PP.esc,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',BLU='#3fa9ff',GRN='#3fe09a';

  /* ================= COURSE DE FRAPPE ================= */
  (function(){
    var TXT=['Le renard brun saute par-dessus le chien paresseux qui dort au soleil.','Un petit café en terrasse, et la journée commence enfin du bon pied.','Les vacances arrivent vite quand on prépare déjà la prochaine sortie entre potes.','Il pleut sur Paris mais la tour Eiffel brille toujours le soir.','Ne remets jamais à demain ce que tu peux jouer aujourd\'hui.','Le train de nuit file à travers les montagnes sous un ciel étoilé.','Mon chat préfère dormir sur le clavier plutôt que dans son panier.','On a mangé une pizza géante et on a regardé un film jusqu\'à minuit.','La mer était calme et les bateaux rentraient lentement au port.','Celui qui tape le plus vite gagne une glace à la vanille.','Le gardien a plongé du mauvais côté et le ballon est entré.','Au marché, les tomates rouges sentaient bon le soleil du sud.','Un robot poli dit toujours bonjour avant de passer l\'aspirateur.','Le vélo grince un peu mais il roule encore très bien en ville.','Trois zombies dansent la salsa au milieu du bunker abandonné.'];
    /* v36 : textes tapables sur tous les claviers (Windows, Mac, Linux, QWERTY) : pas d'accent circonflexe ni de
       caractères spéciaux, et une lettre sans accent est acceptée à la place d'une lettre accentuée (e pour é, a pour à…) */
    function nd(s){try{return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'')}catch(e){return s}}
    TXT=TXT.map(function(t){return t.replace(/[âäêëîïôöûü]/g,function(c){return nd(c)}).replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[’‘]/g,'\'').replace(/[«»“”]/g,'"').replace(/[–—]/g,'-').replace(/…/g,'...').replace(/ | /g,' ').replace(/ +/g,' ')});
    var S,CARS=['#e2361b','#3fa9ff','#3fe09a','#f3c623','#b072e0','#ff8a3d','#f1ece2','#2fa3a3'];
    /* v67 : nouveau look + à plusieurs : résultats pour tous et "Rejouer" pour tout le monde */
    function newRace(txt,bots){S.txt=txt;S.i=0;S.err=0;S.t0=0;S.done=false;S.cd=3.2;S.lastCd=4;S.bad=0;S.shake=0;S.lay=null;S.ended=false;S.endT=0;S.fin=[];S.prog={};S.myW=0;S.trail=[];
      S.racers=[{n:'Toi',p:0,me:true,c:CARS[0],w:0}];if(bots)[[28,'Lent'],[42,'Moyen'],[58,'Rapide']].forEach(function(b,k){S.racers.push({n:'Bot '+b[1],p:0,wpm:b[0]*(0.9+Math.random()*.2),c:CARS[k+1],w:0})})}
    function el(){return S.t0?(performance.now()-S.t0)/1000:0}
    function wpm(){var t=el()/60;return t>0.02?Math.round(S.i/5/t):0}
    function acc(){return Math.round(100*S.i/Math.max(1,S.i+S.err))}
    function pickTxt(){return TXT[Math.random()*TXT.length|0]}
    function launch(C){var t=pickTxt();S.rd=(S.rd||0)+1;C.net.all({t:'ty-go',txt:t,rd:S.rd})}
    function resHtml(fin,meN){var md=['🥇','🥈','🥉'];return '<div style="text-align:left;display:inline-block;min-width:240px">'+fin.map(function(f,i){var me=f.n===meN;return '<div style="padding:3px 0;'+(me?'font-weight:700':'')+'">'+(f.w!=null?(md[i]||(i+1)+'.'):'⏳')+' '+esc(f.n)+(me?' (toi)':'')+' · '+(f.w!=null?'<b>'+f.w+'</b> mots/min':Math.round(f.p*100)+' %')+'</div>'}).join('')+'</div>'}
    function finish(C){S.done=true;var w=wpm(),a=acc();S.myW=w;sfx.play('win');C.pop(w+' MOTS/MIN','#3fe09a','56px');
      if(C.mode==='online'){C.net.send({t:'ty-done',w:w,a:a});return}
      var place=1+S.racers.filter(function(r){return !r.me&&r.p>=1}).length;if(place===1)C.win();var nb=C.best('wpm',w);C.stop();
      C.over(place===1?'1er !':place+'e','<b>'+w+'</b> mots/minute · précision '+a+' %'+(nb?' · nouveau record !':''),'Nouvelle course')}
    function endOnline(C){if(S.ended)return;S.ended=true;var fin=S.fin.slice();
      C.net.players.forEach(function(p){if(!fin.some(function(f){return f.id===p.id})){var q=S.prog[p.id];fin.push({id:p.id,n:p.name,p:q?q.p:0})}});
      C.net.all({t:'ty-end',fin:fin,rd:S.rd})}
    PP.arcade({id:'typing',
      setup:function(C){S={racers:[],txt:'',i:0,rd:0};newRace(pickTxt(),C.mode==='solo');S.cd=0;
        if(C.mode==='online'){S.wait=true;C.listen(function(m,from){var H=C.net.isHost;
          if(H&&m.t==='ty-p'){var pl=C.net.players.filter(function(p){return p.id===from})[0];if(pl&&!S.ended){S.prog[from]={n:pl.name,p:m.p,w:m.w||0};C.net.broadcast({t:'ty-all',prog:S.prog,fin:S.fin})}}
          if(H&&m.t==='ty-done'){var pl2=C.net.players.filter(function(p){return p.id===from})[0];if(pl2&&!S.ended&&!S.fin.some(function(f){return f.id===from})){S.fin.push({id:from,n:pl2.name,w:m.w,a:m.a});S.prog[from]={n:pl2.name,p:1,w:m.w};if(!S.endT)S.endT=performance.now();C.net.broadcast({t:'ty-all',prog:S.prog,fin:S.fin})}}
          if(H&&m.t==='ty-again'&&(S.ended||S.wait))launch(C);
          if(m.t==='ty-go'){var rd=m.rd;newRace(m.txt,false);S.rd=rd;S.wait=false;C.hide();C.running=true}
          if(m.t==='ty-all'&&!H){S.prog=m.prog||{};S.fin=m.fin||[];if(S.fin.length&&!S.endT)S.endT=performance.now()}
          if(m.t==='ty-end'){S.ended=true;S.wait=true;C.stop();var meN=C.net.me.name,first=m.fin[0]&&m.fin[0].w!=null?m.fin[0]:null;
            if(first&&first.n===meN){C.win();sfx.play('win')}if(S.myW)C.best('wpm',S.myW);
            C.over(first?(first.n===meN?'Tu gagnes !':first.n+' gagne'):'Course finie',resHtml(m.fin,meN),'Rejouer',function(){if(C.net.isHost)launch(C);else{C.net.send({t:'ty-again'});PP.$('typing-msg').innerHTML+='<br><i>Nouvelle course demandée…</i>'}})}})
          C.over('Course de frappe','Tout le salon tape la même phrase. Chaque lettre juste fait avancer ta voiture.<br>Tout le monde peut lancer ou relancer la course.','Lancer',function(){if(C.net.isHost)launch(C);else{C.net.send({t:'ty-again'});PP.$('typing-msg').innerHTML+='<br><i>Départ demandé…</i>'}})}
        else C.over('Course de frappe','Tape la phrase le plus vite possible, sans faute : une mauvaise lettre te bloque. Trois bots courent contre toi.<br>Record : <b>'+(C.best('wpm')||'—')+'</b> mots/min','Partez !');
        C.keysText('Tape simplement au clavier · une lettre sans accent marche aussi · sur téléphone, touche la zone sous le jeu')},
      start:function(C){newRace(pickTxt(),true)},
      key:function(C,k,d,e){if(!d||!C.running||S.done||S.cd>0)return;var ch=e.key;if(!ch||ch.length!==1)return;e.preventDefault();
        var want=S.txt[S.i];if(ch===want||nd(ch)===nd(want)||(want==='’'&&ch==='\'')){S.i++;sfx.play('tick');if(C.mode==='online')C.net.send({t:'ty-p',p:S.i/S.txt.length,w:wpm()});if(S.i>=S.txt.length)finish(C)}else{S.err++;S.bad=.3;S.shake=.18;sfx.play('lose')}},
      step:function(C,dt){S.bad=Math.max(0,S.bad-dt);S.shake=Math.max(0,S.shake-dt);
        if(S.cd>0){S.cd-=dt;var n=Math.ceil(S.cd);if(n!==S.lastCd&&n>0){S.lastCd=n;sfx.play('tick')}if(S.cd<=0){S.cd=0;S.t0=performance.now();sfx.play('pickup')}}
        var me=S.racers[0];me.p=S.i/Math.max(1,S.txt.length);me.w=S.done?S.myW:wpm();
        if(C.mode==='solo'&&S.t0){var mins=el()/60;S.racers.forEach(function(r){if(!r.me){r.p=Math.min(1,r.wpm*5*mins/S.txt.length);r.w=Math.round(r.wpm)}})}
        if(C.mode==='online'){var myId=C.net.me.id;S.racers=[me];var k=1;Object.keys(S.prog).forEach(function(id){if(id===myId)return;var q=S.prog[id];S.racers.push({n:q.n,p:q.p,w:q.w,c:CARS[k++%8]})});
          if(C.net.isHost&&!S.ended&&!S.wait){var pl=C.net.players,all=pl.length&&pl.every(function(p){return S.fin.some(function(f){return f.id===p.id})});
            if(all||(S.endT&&performance.now()-S.endT>20000))endOnline(C)}}
        S.racers.forEach(function(r){r.dp=r.dp==null?r.p:r.dp+(r.p-r.dp)*Math.min(1,dt*8)});
        C.hud('<span>Vitesse <b>'+me.w+'</b> mots/min</span><span>Précision <b>'+acc()+'</b> %</span><span>Fautes <b>'+S.err+'</b></span>')},
      draw:function(C){var g=C.g,T=performance.now()/1000;
        var bg=g.createLinearGradient(0,0,0,540);bg.addColorStop(0,'#1b1714');bg.addColorStop(1,'#0f0d0b');g.fillStyle=bg;g.fillRect(0,0,960,540);
        /* piste */
        var n=Math.max(1,S.racers.length),top=18,H=Math.min(250,Math.max(150,n*46)),lh=H/n,X0=150,X1=880;
        g.fillStyle='#2b2824';ag.rr(g,18,top-6,924,H+12,14);g.fill();
        g.fillStyle='#3a8a4a';g.fillRect(18,top-6,924,4);g.fillRect(18,top+H+2,924,4);
        S.racers.forEach(function(r,i){var y=top+i*lh,cy=y+lh/2;
          g.fillStyle=i%2?'#2f2c28':'#34302b';g.fillRect(24,y,912,lh);
          if(i>0){g.fillStyle='rgba(241,236,226,.35)';for(var x=X0;x<X1;x+=36)g.fillRect(x+((T*0)%36),y-1,18,2)}
          /* étiquette */
          g.fillStyle=r.me?'rgba(226,54,27,.25)':'rgba(0,0,0,.25)';ag.rr(g,30,y+4,112,lh-8,8);g.fill();g.fillStyle=r.c;g.fillRect(30,y+4,4,lh-8);
          ag.mono(g,String(r.n).slice(0,11),40,cy-(lh>36?7:0),12,r.me?'#fff':CR,'left');if(lh>36)ag.mono(g,(r.w||0)+' mpm',40,cy+9,10,'rgba(241,236,226,.55)','left');
          /* ligne d'arrivée */
          for(var q=0;q<Math.ceil(lh/8);q++){g.fillStyle=q%2?'#f1ece2':'#141210';g.fillRect(X1,y+q*8,8,Math.min(8,lh-q*8));g.fillStyle=q%2?'#141210':'#f1ece2';g.fillRect(X1+8,y+q*8,8,Math.min(8,lh-q*8))}
          g.fillStyle='rgba(241,236,226,.5)';g.fillRect(X0-2,y+3,3,lh-6);
          /* voiture */
          var s=Math.min(1,(lh-6)/34),cx=X0+16+(r.dp||0)*(X1-X0-30),mv=S.t0&&!S.done&&r.p<1&&r.p>0;
          g.save();g.translate(cx,cy+(mv?Math.sin(T*30+i)*0.6:0));g.scale(s,s);
          if(mv){g.fillStyle='rgba(241,236,226,.18)';for(var l=0;l<3;l++)g.fillRect(-48-l*10-(T*90%10),-8+l*7,16,2)}
          g.fillStyle='rgba(0,0,0,.35)';ag.rr(g,-28,6,58,9,4);g.fill();
          var bd=g.createLinearGradient(0,-12,0,10);bd.addColorStop(0,r.c);bd.addColorStop(1,'rgba(0,0,0,.35)');
          g.fillStyle=r.c;ag.rr(g,-28,-8,56,18,7);g.fill();g.fillStyle=bd;ag.rr(g,-28,-8,56,18,7);g.fill();
          g.fillStyle=r.c;ag.rr(g,-14,-17,26,12,6);g.fill();g.fillStyle='rgba(170,220,255,.75)';ag.rr(g,-9,-15,17,8,3);g.fill();
          g.fillStyle='#fff6';g.fillRect(-24,-5,48,2);g.fillStyle='#ffe58a';g.fillRect(25,-4,3,4);g.fillStyle='#ff4a3a';g.fillRect(-28,-4,3,4);
          g.fillStyle='#111';g.beginPath();g.arc(-15,10,6,0,7);g.arc(15,10,6,0,7);g.fill();g.fillStyle='#777';g.beginPath();g.arc(-15,10,2.4,0,7);g.arc(15,10,2.4,0,7);g.fill();
          g.restore();
          if(r.p>=1){ag.mono(g,'🏁',X1-14,cy,14,CR)}});
        /* barre de progression perso */
        var me=S.racers[0],py=top+H+22;g.fillStyle='#24201c';ag.rr(g,40,py,880,8,4);g.fill();g.fillStyle=RED;ag.rr(g,40,py,Math.max(8,880*me.p),8,4);g.fill();
        /* texte */
        var bx=40,by=py+22,bw=880,bh=540-by-18,sh=S.shake>0?Math.sin(T*90)*5*S.shake/.18:0;
        g.save();g.translate(sh,0);
        g.fillStyle='#f1ece2';ag.rr(g,bx,by,bw,bh,14);g.fill();g.strokeStyle=S.bad>0?RED:'#141210';g.lineWidth=3;ag.rr(g,bx,by,bw,bh,14);g.stroke();
        var fs=S.txt.length>90?22:25,x0=bx+28,maxW=bw-56;g.font='500 '+fs+'px "IBM Plex Mono", monospace';g.textAlign='left';g.textBaseline='alphabetic';
        if(S.lay!==S.txt){S.lay=S.txt;S.pos=[];var cx=x0,cy=0,words=S.txt.split(' '),idx=0;words.forEach(function(wd,wi){var ww=g.measureText(wd).width;if(cx+ww>x0+maxW){cx=x0;cy+=fs*1.65}for(var q=0;q<wd.length;q++){var cw=g.measureText(wd[q]).width;S.pos[idx++]=[cx,cy,cw];cx+=cw}if(wi<words.length-1){var sw=g.measureText(' ').width;S.pos[idx++]=[cx,cy,sw];cx+=sw}});S.lines=cy/(fs*1.65)+1}
        var ty0=by+(bh-(S.lines-1)*fs*1.65)/2+fs*.35;
        /* mot en cours surligné */
        var ws=S.i,we=S.i;while(ws>0&&S.txt[ws-1]!==' ')ws--;while(we<S.txt.length&&S.txt[we]!==' ')we++;
        if(S.pos[ws]&&S.pos[we-1]&&S.t0&&!S.done){var a=S.pos[ws],b=S.pos[we-1];if(a[1]===b[1]){g.fillStyle='rgba(243,198,35,.28)';ag.rr(g,a[0]-4,ty0+a[1]-fs*.95,b[0]+b[2]-a[0]+8,fs*1.35,6);g.fill()}}
        g.font='500 '+fs+'px "IBM Plex Mono", monospace';g.textAlign='left';g.textBaseline='alphabetic';
        for(var i=0;i<S.txt.length;i++){var ch=S.txt[i],P=S.pos[i];if(!P)continue;var y=ty0+P[1];
          if(i<S.i)g.fillStyle='#2f9e5c';
          else if(i===S.i&&!S.done){g.fillStyle=S.bad>0?RED:'#141210';var bl=(T*2%1)<.6||S.bad>0;if(bl)g.fillRect(P[0],y+5,Math.max(P[2],12),4);if(S.bad>0){g.fillStyle='rgba(226,54,27,.18)';g.fillRect(P[0]-1,y-fs*.9,Math.max(P[2],12)+2,fs*1.2)}g.fillStyle=S.bad>0?RED:'#141210'}
          else g.fillStyle='rgba(20,18,16,.38)';
          g.fillText(ch===' '&&i===S.i?'·':ch,P[0],y)}
        g.restore();
        /* compte à rebours / attente */
        if(S.cd>0&&C.running){var nn=Math.ceil(S.cd),f=S.cd-Math.floor(S.cd);g.fillStyle='rgba(15,13,11,.55)';g.fillRect(0,0,960,540);ag.txt(g,nn>3?'3':String(nn),480,250,120+60*f,[RED,YEL,GRN][3-Math.min(3,nn)]||RED);ag.mono(g,'Prépare tes doigts…',480,340,16,CR)}
        if(C.mode==='online'&&S.done&&!S.ended){g.fillStyle='rgba(15,13,11,.78)';ag.rr(g,300,top+H/2-34,360,68,14);g.fill();ag.mono(g,'Arrivé ! '+S.myW+' mots/min',480,top+H/2-12,18,GRN);
          var tot=C.net.players.length,dn=S.fin.length,left=S.endT?Math.max(0,20-Math.floor((performance.now()-S.endT)/1000)):20;ag.mono(g,'En attente des autres · '+dn+'/'+tot+' · fin dans '+left+' s',480,top+H/2+14,12,CR)}}});
  })();

  /* ================= QUIZ ================= */
  (function(){
    var Q=[['Quelle est la capitale de l\'Australie ?','Canberra','Sydney','Melbourne','Perth'],['Combien de joueurs dans une équipe de foot sur le terrain ?','11','10','12','9'],['Quel est le plus grand océan ?','Pacifique','Atlantique','Indien','Arctique'],['Qui a peint la Joconde ?','Léonard de Vinci','Michel-Ange','Picasso','Van Gogh'],['Quel est le symbole chimique de l\'or ?','Au','Ag','Or','Fe'],
      ['En quelle année a eu lieu la prise de la Bastille ?','1789','1815','1492','1914'],['Quelle planète est la plus proche du Soleil ?','Mercure','Vénus','Mars','Terre'],['Combien de côtés a un hexagone ?','6','5','7','8'],['Quel pays a la forme d\'une botte ?','Italie','Espagne','Grèce','Portugal'],['Quelle est la langue la plus parlée au Brésil ?','Portugais','Espagnol','Brésilien','Anglais'],
      ['Quel animal est le plus rapide sur terre ?','Guépard','Lion','Antilope','Cheval'],['Combien font 7 × 8 ?','56','54','64','48'],['Quel fleuve traverse Paris ?','La Seine','La Loire','Le Rhône','La Garonne'],['Qui a écrit « Les Misérables » ?','Victor Hugo','Émile Zola','Molière','Balzac'],['Quel est le plus haut sommet du monde ?','Everest','Mont Blanc','K2','Kilimandjaro'],
      ['Combien de continents compte-t-on habituellement ?','7','5','6','8'],['Quel gaz les plantes absorbent-elles ?','Dioxyde de carbone','Oxygène','Azote','Hélium'],['Dans quel pays se trouve Marrakech ?','Maroc','Tunisie','Algérie','Égypte'],['Quelle est la monnaie du Japon ?','Yen','Won','Yuan','Roupie'],['Combien de minutes dans une journée ?','1 440','1 200','2 400','3 600'],
      ['Quel est l\'organe qui pompe le sang ?','Le cœur','Le foie','Les poumons','Le rein'],['Quelle couleur obtient-on avec bleu + jaune ?','Vert','Violet','Orange','Marron'],['Qui a marché le premier sur la Lune ?','Neil Armstrong','Buzz Aldrin','Youri Gagarine','Thomas Pesquet'],['Quel est le plus grand pays du monde ?','Russie','Canada','Chine','États-Unis'],['Combien de pattes a une araignée ?','8','6','10','12'],
      ['Quelle ville accueille le Colisée ?','Rome','Athènes','Paris','Madrid'],['Quel sport pratique-t-on à Roland-Garros ?','Tennis','Golf','Rugby','Cyclisme'],['Quelle est la capitale du Canada ?','Ottawa','Toronto','Montréal','Vancouver'],['De quel pays vient le sushi ?','Japon','Chine','Corée','Thaïlande'],['Combien y a-t-il de jours dans une année bissextile ?','366','365','364','360'],
      ['Quel est le plus long fleuve de France ?','La Loire','La Seine','Le Rhône','La Garonne'],['Quel instrument a 88 touches ?','Piano','Orgue','Accordéon','Synthé'],['Quel métal est liquide à température ambiante ?','Mercure','Plomb','Étain','Zinc'],['Qui a inventé l\'ampoule électrique à filament (brevet célèbre) ?','Edison','Tesla','Volta','Ampère'],['Quelle est la capitale de l\'Espagne ?','Madrid','Barcelone','Séville','Valence'],
      ['Combien de joueurs dans une équipe de basket sur le terrain ?','5','6','7','4'],['Quel désert est le plus grand désert chaud ?','Sahara','Gobi','Kalahari','Atacama'],['Quel est le cri du chat ?','Miaulement','Aboiement','Hennissement','Barrissement'],['Combien de zéros dans un million ?','6','5','7','9'],['Quel pays a gagné la Coupe du monde de foot 2018 ?','France','Croatie','Brésil','Allemagne'],
      ['Quelle est la formule de l\'eau ?','H₂O','CO₂','O₂','NaCl'],['Quel animal est le roi de la savane ?','Lion','Éléphant','Girafe','Hippopotame'],['Dans quel océan se trouve Madagascar ?','Indien','Atlantique','Pacifique','Austral'],['Quelle est la capitale de l\'Allemagne ?','Berlin','Munich','Francfort','Hambourg'],['Combien de cordes a une guitare classique ?','6','4','5','7']];
    var S,ROUNDS=10,T=15;
    function ask(C,qi,order){S.q=qi;S.order=order;S.t=T;S.ans=null;S.reveal=false;S.phase='q'}
    function shuffled(qi){return PP.shuffle([0,1,2,3])}
    function reveal(C){S.reveal=true;S.phase='r';var ok=S.ans!=null&&S.order[S.ans]===0;var pts=ok?Math.round(500+500*S.left/T):0;if(C.mode!=='online')C.pop(ok?'+'+pts:'RATÉ',ok?'#3fe09a':'#ff8a6a');if(C.mode!=='online'){S.score+=pts;if(ok)S.good++;sfx.play(ok?'win':'lose')}S.gain=pts}
    PP.arcade({id:'quiz',
      setup:function(C){S={score:0,good:0,n:0,list:PP.shuffle(Q.map(function(q,i){return i})).slice(0,ROUNDS),phase:'idle',tot:{}};
        C.keysText('Clique la bonne réponse ou tape <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> · plus tu réponds vite, plus tu marques');
        if(C.mode==='online'){C.listen(function(m,from){
            if(C.net.isHost&&m.t==='qz-a'&&S.answers&&S.answers[from]==null)S.answers[from]=m;
            if(m.t==='qz-q'){C.hide();C.running=true;S.n=m.n;ask(C,m.q,m.o)}
            if(m.t==='qz-r'){S.left=0;S.reveal=true;S.phase='r';S.tot=m.tot;var ok=S.ans!=null&&S.order[S.ans]===0;sfx.play(ok?'win':'lose')}
            if(m.t==='qz-end'){C.stop();var arr=Object.keys(m.tot).map(function(k){return [k,m.tot[k]]}).sort(function(a,b){return b[1]-a[1]});if(arr[0]&&arr[0][0]===C.net.me.name)C.win();C.over('Classement',arr.map(function(a,i){return (i+1)+'. '+esc(a[0])+' — '+a[1]}).join('<br>'),C.net.isHost?'Rejouer':false,C.net.isHost?function(){hostGo(C)}:null)}});
          C.over('Quiz',ROUNDS+' questions pour tout le salon, '+T+' secondes chacune.',C.net.isHost?'Lancer':false,C.net.isHost?function(){hostGo(C)}:null);return}
        C.over('Quiz',ROUNDS+' questions de culture générale, '+T+' secondes chacune. Réponds vite pour marquer plus.<br>Record : <b>'+(C.best('pts')||'—')+'</b>','Jouer')},
      start:function(C){S.score=0;S.good=0;S.n=0;S.list=PP.shuffle(Q.map(function(q,i){return i})).slice(0,ROUNDS);ask(C,S.list[0],shuffled())},
      key:function(C,k,d){if(!d||!C.running||S.phase!=='q')return;var m={Digit1:0,Digit2:1,Digit3:2,Digit4:3,Numpad1:0,Numpad2:1,Numpad3:2,Numpad4:3}[k];if(m!=null)choose(C,m)},
      mouse:function(C,t,x,y){if(t!=='down'||!C.running||S.phase!=='q')return;for(var i=0;i<4;i++){var b=box(i);if(x>b[0]&&x<b[0]+b[2]&&y>b[1]&&y<b[1]+b[3])choose(C,i)}},
      step:function(C,dt){if(S.phase==='q'){S.t-=dt;if(S.t<=0){S.left=0;if(C.mode==='online'){if(!S.sent){S.sent=true}}else reveal(C)}}
        if(S.phase==='r'&&C.mode!=='online'){S.rt=(S.rt||0)+dt;if(S.rt>2){S.rt=0;S.n++;if(S.n>=ROUNDS){C.stop();var nb=C.best('pts',S.score);if(S.good>=8)C.win();C.over('Fin du quiz','<b>'+S.good+' / '+ROUNDS+'</b> bonnes réponses · '+S.score+' points'+(nb?' · nouveau record !':''),'Rejouer');return}ask(C,S.list[S.n],shuffled())}}
        C.hud('<span>Question <b>'+Math.min(ROUNDS,S.n+1)+' / '+ROUNDS+'</b></span>'+(C.mode==='online'?'':'<span>Score <b>'+S.score+'</b></span>'))},
      draw:function(C){var g=C.g;g.fillStyle='#1d1a30';g.fillRect(0,0,960,540);if(S.q==null||S.phase==='idle'){ag.txt(g,'QUIZ',480,270,120,'rgba(241,236,226,.12)');return}
        var q=Q[S.q];g.fillStyle=CR;PP.ag.rr(g,60,40,840,130,10);g.fill();g.font='700 26px "Inter Tight", sans-serif';g.fillStyle=INK;g.textAlign='center';g.textBaseline='middle';wrap(g,q[0],480,105,780,32);
        var tw=840*Math.max(0,S.t)/T;g.fillStyle=S.t<4?RED:YEL;g.fillRect(60,180,tw,8);
        var cols=['#e2361b','#3fa9ff','#f3c623','#3fe09a'];for(var i=0;i<4;i++){var b=box(i),ok=S.order[i]===0,sel=S.ans===i;g.globalAlpha=S.reveal&&!ok&&!sel?.35:1;g.fillStyle=S.reveal?(ok?'#3fe09a':sel?'#7a2016':cols[i]):cols[i];PP.ag.rr(g,b[0],b[1],b[2],b[3],10);g.fill();if(sel&&!S.reveal){g.strokeStyle='#fff';g.lineWidth=5;g.stroke()}
          ag.mono(g,(i+1)+'',b[0]+28,b[1]+b[3]/2,22,INK);g.font='700 22px "Inter Tight", sans-serif';g.fillStyle=INK;g.textAlign='left';g.fillText(q[1+S.order[i]],b[0]+56,b[1]+b[3]/2);g.globalAlpha=1}
        if(S.reveal&&C.mode!=='online')ag.txt(g,S.gain?'+'+S.gain:'Raté',480,505,34,S.gain?GRN:'#ff8a6a');
        if(S.reveal&&C.mode==='online'&&S.tot){var arr=Object.keys(S.tot).map(function(k){return [k,S.tot[k]]}).sort(function(a,b){return b[1]-a[1]}).slice(0,4);ag.mono(g,arr.map(function(a){return a[0]+' '+a[1]}).join('   '),480,512,15,CR)}}});
    function box(i){return [60+(i%2)*425,210+Math.floor(i/2)*140,415,120]}
    function wrap(g,t,x,y,mw,lh){var w=t.split(' '),lines=[],l='';w.forEach(function(s){var tt=l?l+' '+s:s;if(g.measureText(tt).width>mw){lines.push(l);l=s}else l=tt});lines.push(l);lines.forEach(function(s,i){g.fillText(s,x,y+(i-(lines.length-1)/2)*lh)})}
    function choose(C,i){if(S.ans!=null)return;S.ans=i;S.left=Math.max(0,S.t);sfx.play('ui');if(C.mode==='online'){C.net.send({t:'qz-a',i:i,ok:S.order[i]===0,left:S.left})}else reveal(C)}
    function hostGo(C){S.tot={};C.net.players.forEach(function(p){S.tot[p.name]=0});S.list=PP.shuffle(Q.map(function(q,i){return i})).slice(0,ROUNDS);var n=0;
      function one(){if(n>=ROUNDS){C.net.all({t:'qz-end',tot:S.tot});return}S.answers={};C.net.all({t:'qz-q',n:n,q:S.list[n],o:PP.shuffle([0,1,2,3])});setTimeout(function(){C.net.players.forEach(function(p){var a=S.answers[p.id];if(a&&a.ok)S.tot[p.name]+=Math.round(500+500*a.left/T)});C.net.all({t:'qz-r',tot:S.tot});n++;setTimeout(one,2500)},T*1000+300)}
      one()}
  })();

  /* ================= MEMORY ================= */
  (function(){
    var S,COLS=6,ROWS=4,SYM=['♠','♥','♦','♣','★','☀','☂','♫','⚓','✈','☕','⚽'],SC=['#141210','#e2361b','#e2361b','#141210','#d4a32a','#f39a1a','#3fa9ff','#b072e0','#1c5fa8','#2fa3a3','#7a4e28','#3f8f3a'];
    function deal(){var d=[];for(var i=0;i<12;i++)d.push(i,i);d=PP.shuffle(d);S.cards=d.map(function(v,k){return {v:v,up:false,done:false,f:0,k:k}});S.open=[];S.moves=0;S.t0=performance.now();S.pairs=[0,0];S.turn=0;S.lock=0}
    function cell(k){var cw=130,ch=112,gx=480-COLS*cw/2,gy=40;return [gx+(k%COLS)*cw+6,gy+Math.floor(k/COLS)*ch+6,cw-12,ch-12]}
    PP.arcade({id:'memory',
      setup:function(C){S={};deal();C.keysText('Clique deux cartes pour trouver les paires');C.over('Memory','12 paires à retrouver.'+(C.mode==='duel'?' Chacun son tour : une paire trouvée = tu rejoues.':' Le moins de coups possible.')+(C.mode==='solo'?'<br>Record : <b>'+(C.best('coups')||'—')+'</b> coups':''),'Jouer')},
      start:function(C){deal()},
      mouse:function(C,t,x,y){if(t!=='down'||!C.running||S.lock>0)return;S.cards.forEach(function(c){var b=cell(c.k);if(x>b[0]&&x<b[0]+b[2]&&y>b[1]&&y<b[1]+b[3]&&!c.up&&!c.done&&S.open.length<2){c.up=true;S.open.push(c);sfx.play('ui');if(S.open.length===2){S.moves++;var a=S.open[0],b2=S.open[1];if(a.v===b2.v){a.done=b2.done=true;S.open=[];S.pairs[S.turn]++;sfx.play('win');C.pop('PAIRE !','#3fe09a','48px');if(S.cards.every(function(q){return q.done}))setTimeout(function(){end(C)},600)}else{S.lock=1}}}})},
      step:function(C,dt){if(S.lock>0){S.lock-=dt;if(S.lock<=0){S.open.forEach(function(c){c.up=false});S.open=[];if(C.mode==='duel')S.turn=1-S.turn}}
        S.cards.forEach(function(c){var tg=c.up||c.done?1:0;c.f+=(tg-c.f)*Math.min(1,dt*10)});
        C.hud(C.mode==='duel'?'<span'+(S.turn===0?' style="background:#e2361b;color:#fff"':'')+'>J1 <b>'+S.pairs[0]+'</b></span><span'+(S.turn===1?' style="background:#3fa9ff;color:#fff"':'')+'>J2 <b>'+S.pairs[1]+'</b></span>':'<span>Coups <b>'+S.moves+'</b></span><span>Temps <b>'+Math.round((performance.now()-S.t0)/1000)+' s</b></span>')},
      draw:function(C){var g=C.g;g.fillStyle='#2b5a3a';g.fillRect(0,0,960,540);for(var i=0;i<60;i++){g.fillStyle='rgba(0,0,0,.05)';g.fillRect((i*97)%960,(i*53)%540,40,2)}
        S.cards.forEach(function(c){var b=cell(c.k),s=Math.abs(Math.cos(c.f*Math.PI)),face=c.f>.5,cx=b[0]+b[2]/2;g.save();g.translate(cx,b[1]+b[3]/2);g.scale(Math.max(.02,s),1);
          g.fillStyle='rgba(0,0,0,.3)';PP.ag.rr(g,-b[2]/2+4,-b[3]/2+5,b[2],b[3],10);g.fill();
          if(face){g.fillStyle=c.done?'#fffdf6':CR;PP.ag.rr(g,-b[2]/2,-b[3]/2,b[2],b[3],10);g.fill();g.font='56px serif';g.fillStyle=SC[c.v];g.textAlign='center';g.textBaseline='middle';g.fillText(SYM[c.v],0,4);if(c.done){g.strokeStyle=GRN;g.lineWidth=4;PP.ag.rr(g,-b[2]/2,-b[3]/2,b[2],b[3],10);g.stroke()}}
          else{g.fillStyle=RED;PP.ag.rr(g,-b[2]/2,-b[3]/2,b[2],b[3],10);g.fill();g.strokeStyle='rgba(241,236,226,.6)';g.lineWidth=2;PP.ag.rr(g,-b[2]/2+8,-b[3]/2+8,b[2]-16,b[3]-16,6);g.stroke();ag.txt(g,'P',0,2,40,'rgba(241,236,226,.85)')}
          g.restore()})}});
    function end(C){C.stop();if(C.mode==='duel'){C.over(S.pairs[0]===S.pairs[1]?'Égalité':(S.pairs[0]>S.pairs[1]?'J1':'J2')+' gagne !','J1 <b>'+S.pairs[0]+'</b> – <b>'+S.pairs[1]+'</b> J2','Rejouer');return}var nb=C.best('coups',S.moves,true);if(S.moves<=20)C.win();C.over('Bravo !','<b>'+S.moves+'</b> coups en '+Math.round((performance.now()-S.t0)/1000)+' s'+(nb?' · nouveau record !':''),'Rejouer')}
  })();

  /* ================= DÉMINEUR ================= */
  (function(){
    var S,LV={easy:[12,8,12],mid:[16,10,26],hard:[20,11,45]};
    function cfg(C){return LV[C.mode]||LV.easy}
    function make(C,sx,sy){var L=cfg(C),w=L[0],h=L[1],m=L[2];S.g=[];for(var x=0;x<w;x++){S.g.push([]);for(var y=0;y<h;y++)S.g[x].push({m:false,n:0,o:false,f:false})}var placed=0;while(placed<m){var x2=Math.random()*w|0,y2=Math.random()*h|0;if(S.g[x2][y2].m||(Math.abs(x2-sx)<=1&&Math.abs(y2-sy)<=1))continue;S.g[x2][y2].m=true;placed++}
      for(x=0;x<w;x++)for(var y3=0;y3<h;y3++){var n=0;nb(x,y3,function(a,b){if(S.g[a][b].m)n++});S.g[x][y3].n=n}}
    function nb(x,y,fn){var L=S.L;for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){var a=x+dx,b=y+dy;if((dx||dy)&&a>=0&&b>=0&&a<L[0]&&b<L[1])fn(a,b)}}
    function open(C,x,y){var c=S.g[x][y];if(c.o||c.f)return;c.o=true;S.left--;if(c.m){S.boom=[x,y];lose(C);return}if(!c.n)nb(x,y,function(a,b){open(C,a,b)})}
    function lose(C){S.over=true;sfx.play('kill');C.shake(14);S.g.forEach(function(col){col.forEach(function(c){if(c.m)c.o=true})});C.stop();setTimeout(function(){C.over('BOUM !','Une mine… Retente ta chance.','Rejouer')},900)}
    function cs(){var L=S.L;return Math.min(Math.floor(900/L[0]),Math.floor(480/L[1]))}
    function org(){var L=S.L,c=cs();return [480-L[0]*c/2,24+(492-L[1]*c)/2]}
    PP.arcade({id:'mines',
      setup:function(C){S={L:cfg(C),g:null,over:false,t0:0,flags:0};S.left=S.L[0]*S.L[1]-S.L[2];C.keysText('Clic gauche : creuser · clic droit (ou appui long) : drapeau · le premier clic est toujours sûr');
        C.over('Démineur',S.L[2]+' mines cachées sur '+S.L[0]+'×'+S.L[1]+'. Les chiffres disent combien de mines touchent la case.<br>Record : <b>'+(C.best(C.mode)?C.best(C.mode)+' s':'—')+'</b>','Jouer');
        if(!S.ctx){C.cv.addEventListener('contextmenu',function(e){if(PP.cur()==='mines')e.preventDefault()})}},
      start:function(C){S.g=null;S.over=false;S.flags=0;S.left=S.L[0]*S.L[1]-S.L[2];S.t0=0},
      mouse:function(C,t,x,y,e){if(!C.running||S.over)return;var c=cs(),o=org(),gx=Math.floor((x-o[0])/c),gy=Math.floor((y-o[1])/c);if(gx<0||gy<0||gx>=S.L[0]||gy>=S.L[1])return;
        if(t==='down'){S.press={x:gx,y:gy,t:performance.now(),right:e.button===2};if(e.button===2)flag(gx,gy)}
        if(t==='up'&&S.press&&!S.press.right&&S.press.x===gx&&S.press.y===gy){if(performance.now()-S.press.t>450)flag(gx,gy);else{if(!S.g){make(C,gx,gy);S.t0=performance.now()}var cl=S.g[gx][gy];if(cl.o&&cl.n){var f=0;nb(gx,gy,function(a,b){if(S.g[a][b].f)f++});if(f===cl.n)nb(gx,gy,function(a,b){open(C,a,b)})}else open(C,gx,gy);sfx.play('tick');
          if(!S.over&&S.left<=0){S.over=true;var tt=Math.round((performance.now()-S.t0)/1000),nbr=C.best(C.mode,tt,true);C.win();sfx.play('win');C.stop();C.over('Déminé !','En <b>'+tt+' s</b>'+(nbr?' · nouveau record !':''),'Rejouer')}}S.press=null}},
      step:function(C){C.hud('<span>Mines <b>'+(S.L[2]-countF())+'</b></span><span>Temps <b>'+(S.t0?Math.round((performance.now()-S.t0)/1000):0)+' s</b></span>')},
      draw:function(C){var g=C.g;g.fillStyle='#24303a';g.fillRect(0,0,960,540);var c=cs(),o=org(),L=S.L,NC=['','#3fa9ff','#3fe09a','#e2361b','#b072e0','#d4a32a','#2fa3a3','#141210','#888'];
        for(var x=0;x<L[0];x++)for(var y=0;y<L[1];y++){var px=o[0]+x*c,py=o[1]+y*c,cl=S.g?S.g[x][y]:{o:false,f:false};
          if(cl.o){g.fillStyle=(x+y)%2?'#e9dfc8':'#f1e8d4';g.fillRect(px,py,c,c);if(cl.m){g.fillStyle=S.boom&&S.boom[0]===x&&S.boom[1]===y?RED:'rgba(0,0,0,.08)';g.fillRect(px,py,c,c);g.fillStyle=INK;g.beginPath();g.arc(px+c/2,py+c/2,c*.24,0,7);g.fill();for(var k=0;k<4;k++){g.save();g.translate(px+c/2,py+c/2);g.rotate(k*Math.PI/4);g.fillRect(-c*.36,-2,c*.72,4);g.restore()}}else if(cl.n)ag.txt(g,cl.n+'',px+c/2,py+c/2+2,c*.62,NC[cl.n])}
          else{g.fillStyle=(x+y)%2?'#6aa84f':'#78b65c';g.fillRect(px,py,c,c);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(px,py,c,3);if(cl.f){g.fillStyle='#fff';g.fillRect(px+c*.42,py+c*.2,3,c*.6);g.fillStyle=RED;g.beginPath();g.moveTo(px+c*.45,py+c*.2);g.lineTo(px+c*.78,py+c*.33);g.lineTo(px+c*.45,py+c*.46);g.fill()}}}}});
    function countF(){var n=0;if(S.g)S.g.forEach(function(col){col.forEach(function(c){if(c.f)n++})});return n}
    function flag(x,y){if(!S.g)return;var c=S.g[x][y];if(c.o)return;c.f=!c.f;sfx.play('ui')}
  })();

  /* ================= PONG NÉON ================= */
  (function(){
    var S,W=960,H=540,PH=96,WIN=7;
    function serve(dir){var a=(Math.random()-.5)*.8;S.b={x:W/2,y:H/2,vx:Math.cos(a)*380*dir,vy:Math.sin(a)*380,tr:[]};S.wait=.8}
    PP.arcade({id:'pong',
      setup:function(C){S={p:[H/2,H/2],sc:[0,0],fx:[],mouse:null};serve(1);C.keysText(C.mode==='solo'?'Souris ou <kbd>Z</kbd>/<kbd>S</kbd> (ou <kbd>W</kbd>/<kbd>S</kbd>) · premier à '+WIN:'J1 <kbd>Z</kbd>/<kbd>S</kbd> · J2 <kbd>↑</kbd>/<kbd>↓</kbd> · premier à '+WIN);
        C.over('Pong néon','La balle accélère à chaque renvoi. Tape-la avec le bord de la raquette pour l\'angler. Premier à '+WIN+'.','Jouer')},
      start:function(C){S.sc=[0,0];serve(1)},
      mouse:function(C,t,x,y){if(C.mode==='solo')S.mouse=y},
      step:function(C,dt){var k=C.keys,sp=520*dt;if(k.KeyW||k.KeyZ)S.p[0]-=sp;if(k.KeyS)S.p[0]+=sp;if(C.mode==='solo'&&S.mouse!=null&&!(k.KeyW||k.KeyZ||k.KeyS))S.p[0]+=(S.mouse-S.p[0])*Math.min(1,dt*16);
        if(C.mode==='duel'){if(k.ArrowUp)S.p[1]-=sp;if(k.ArrowDown)S.p[1]+=sp}else{var tgt=S.b.vx>0?S.b.y+(S.b.vy*((W-60-S.b.x)/Math.max(1,S.b.vx)))*.8:H/2;tgt=Math.max(0,Math.min(H,Math.abs(((tgt%(2*H))+2*H)%(2*H)>H?2*H-(((tgt%(2*H))+2*H)%(2*H)):(((tgt%(2*H))+2*H)%(2*H)))));S.p[1]+=Math.max(-sp*.75,Math.min(sp*.75,tgt-S.p[1]))}
        S.p=S.p.map(function(y){return Math.max(PH/2,Math.min(H-PH/2,y))});
        if(S.wait>0){S.wait-=dt;return}var b=S.b;b.tr.push([b.x,b.y]);if(b.tr.length>14)b.tr.shift();b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y<10){b.y=10;b.vy=Math.abs(b.vy);sfx.play('tick')}if(b.y>H-10){b.y=H-10;b.vy=-Math.abs(b.vy);sfx.play('tick')}
        [[40,0,1],[W-40,1,-1]].forEach(function(q){var px=q[0],i=q[1],dir=q[2];if((dir>0&&b.vx<0&&b.x<px+14&&b.x>px-10)||(dir<0&&b.vx>0&&b.x>px-14&&b.x<px+10)){if(Math.abs(b.y-S.p[i])<PH/2+10){var off=(b.y-S.p[i])/(PH/2),spd=Math.min(1100,Math.hypot(b.vx,b.vy)*1.07),a=off*1.0;b.vx=Math.cos(a)*spd*dir;b.vy=Math.sin(a)*spd;b.x=px+dir*14;sfx.play('hit');for(var f=0;f<14;f++)S.fx.push({x:b.x,y:b.y,vx:dir*Math.random()*300,vy:(Math.random()-.5)*300,t:1,c:i?BLU:RED})}}});
        if(b.x<-20||b.x>W+20){var w=b.x<0?1:0;S.sc[w]++;C.pop('POINT !',w?'#3fa9ff':'#e2361b','52px');C.shake(6);sfx.play(w===0||C.mode==='duel'?'win':'lose');if(S.sc[w]>=WIN){C.stop();if(C.mode==='solo'&&w===0)C.win();C.over(C.mode==='solo'?(w===0?'Victoire !':'Perdu'):(w===0?'J1':'J2')+' gagne !',S.sc[0]+' – '+S.sc[1],'Revanche');return}serve(w===0?1:-1)}
        S.fx=S.fx.filter(function(f){f.t-=dt*2;f.x+=f.vx*dt;f.y+=f.vy*dt;return f.t>0})},
      draw:function(C){var g=C.g;g.fillStyle='#07060d';g.fillRect(0,0,W,H);g.strokeStyle='rgba(241,236,226,.15)';g.setLineDash([10,14]);g.lineWidth=3;g.beginPath();g.moveTo(W/2,0);g.lineTo(W/2,H);g.stroke();g.setLineDash([]);
        ag.txt(g,S.sc[0]+'',W/2-90,80,90,'rgba(226,54,27,.5)');ag.txt(g,S.sc[1]+'',W/2+90,80,90,'rgba(63,169,255,.5)');
        g.shadowBlur=24;[[40,0,RED],[W-40,1,BLU]].forEach(function(q){g.shadowColor=q[2];g.fillStyle=q[2];PP.ag.rr(g,q[0]-8,S.p[q[1]]-PH/2,16,PH,8);g.fill()});
        var b=S.b;b.tr.forEach(function(p,i){g.globalAlpha=i/b.tr.length*.4;g.fillStyle='#fff';g.beginPath();g.arc(p[0],p[1],8*i/b.tr.length,0,7);g.fill()});g.globalAlpha=1;g.shadowColor='#fff';g.fillStyle='#fff';g.beginPath();g.arc(b.x,b.y,10,0,7);g.fill();g.shadowBlur=0;
        S.fx.forEach(function(f){g.globalAlpha=f.t;g.fillStyle=f.c;g.fillRect(f.x,f.y,4,4)});g.globalAlpha=1}});
  })();
})();
