/* Pixel Pause — Mot imposteur : sur un seul PC (on se passe l'écran) ou en ligne (chacun son téléphone) */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,box=$('imp-box');
  var PAIRS=[
    ['Kebab','Tacos'],['Lundi matin','Vendredi soir'],['Ex','Crush'],['Chaussette trouée','Caleçon'],['Belle-mère','Beau-père'],['Toilettes du lycée','Toilettes du McDo'],
    ['Prof de maths','Prof de sport'],['Netflix','YouTube'],['Uber Eats','Deliveroo'],['Ronflement','Pet'],['Salle de sport','Canapé'],['Coiffeur','Barbier'],
    ['Pizza ananas','Pizza 4 fromages'],['Contrôle surprise','Rattrapage'],['Clé USB','Disque dur'],['WiFi','Bluetooth'],['Mot de passe','Code PIN'],['Imprimante','Photocopieuse'],
    ['Stagiaire','Alternant'],['Réunion','Pause café'],['PowerPoint','Excel'],['Ticket de caisse','Facture'],['Cheat code','Bug'],['Manette','Clavier'],
    ['Mariage','Enterrement de vie de garçon'],['Premier rendez-vous','Date Tinder'],['Mouton','Chèvre'],['Lion','Chat de gouttière'],['Pigeon','Mouette'],['Moustique','Mouche'],
    ['Cantine','Self du lycée'],['Chewing-gum','Bonbon Haribo'],['Chips','Pop-corn'],['Bubble tea','Milkshake'],['Jus d\'orange','Jus de pomme'],['Croissant','Chocolatine'],
    ['Metro bondé','Bus de nuit'],['Trottinette électrique','Vélo'],['Permis de conduire','Code de la route'],['Radar','Gendarme'],['Amende','PV'],['Parking','Garage'],
    ['Dentiste','Médecin'],['Piqûre','Vaccin'],['Rhume','Grippe'],['Sieste','Grasse matinée'],['Réveil','Alarme'],['Lundi','Dimanche'],
    ['Plage','Piscine'],['Camping','Hôtel'],['Ski','Luge'],['Neige','Grêle'],['Orage','Canicule'],['Parapluie','K-way'],
    ['Smartphone cassé','Écran fissuré'],['Batterie à 1 %','Mode avion'],['Spam','Phishing'],['Virus','Pub'],['Capture d\'écran','Selfie'],['Story','Reel'],
    ['Influenceur','Youtubeur'],['Streamer','Gamer'],['Rappeur','Chanteur'],['DJ','Guitariste'],['Film d\'horreur','Film d\'action'],['Série','Dessin animé'],
    ['Zombie','Vampire'],['Fantôme','Sorcière'],['Pirate','Viking'],['Ninja','Samouraï'],['Super-héros','Méchant'],['Dragon','Dinosaure'],
    ['Foot','Futsal'],['Basket','Hand'],['Marathon','Jogging'],['Boxe','MMA'],['Échecs','Dames'],['Uno','Belote'],
    ['Lasagnes','Gratin dauphinois'],['Couscous','Tajine'],['Sushi','Poke bowl'],['Burger','Hot-dog'],['Frites','Potatoes'],['Nutella','Confiture'],
    ['Tatouage','Piercing'],['Lunettes','Lentilles'],['Casquette','Bonnet'],['Crocs','Claquettes'],['Jogging','Jean'],['Doudoune','Manteau']
  ];
  var local={names:[],imp:1,white:false,game:null,started:false};
  var online={state:null,role:null,word:null,voted:false,sub:null};

  /* ============ Écran d'entrée ============ */
  function open(){
    if(net.inRoom()){
      if(net.isHost)hostLobby();else guestWait();
      return;
    }
    localSetup();
  }
  function close(){if(online.sub){online.sub();online.sub=null}}

  /* ============ MODE LOCAL ============ */
  function localSetup(){
    if(!local.names.length)local.names=['Joueur 1','Joueur 2','Joueur 3','Joueur 4'];
    var h='<div class="panel"><p style="margin-top:0">Chaque joueur reçoit un mot secret. Les civils ont tous le même mot, l\'imposteur a un mot proche mais différent, et <b>Mr White</b> n\'a aucun mot. Chacun donne un indice à tour de rôle, puis on vote.</p>'+
      '<p class="muted">Pour jouer chacun sur son téléphone, crée un <a href="#" data-go="room">salon en ligne</a>.</p>';
    h+='<label class="lbl">Joueurs ('+local.names.length+')</label><div class="players">';
    local.names.forEach(function(n,i){h+='<input data-i="'+i+'" value="'+esc(n)+'" maxlength="14" aria-label="Nom du joueur '+(i+1)+'">'});
    h+='</div><div class="row"><button type="button" class="ghost" id="imp-add"'+(local.names.length>=12?' disabled':'')+'>+ Joueur</button><button type="button" class="ghost" id="imp-rem"'+(local.names.length<=3?' disabled':'')+'>− Joueur</button></div>';
    h+=options(local.imp,local.white)+'<p style="margin:18px 0 0"><button type="button" id="imp-go">Distribuer les mots</button></p><p class="err" id="imp-err"></p></div>';
    box.innerHTML=h;
    box.querySelectorAll('[data-i]').forEach(function(inp){inp.addEventListener('input',function(){local.names[+inp.dataset.i]=inp.value})});
    $('imp-add').onclick=function(){local.names.push('Joueur '+(local.names.length+1));localSetup()};
    $('imp-rem').onclick=function(){local.names.pop();localSetup()};
    $('imp-n').onchange=function(){local.imp=+this.value};
    $('imp-white').onchange=function(){local.white=this.checked};
    $('imp-go').onclick=function(){
      var list=local.names.map(function(n,i){return (n||'').trim()||('Joueur '+(i+1))}).map(function(n,i){return {id:'p'+i,name:n}});
      var g=makeGame(list,local.imp,local.white);
      if(!g){$('imp-err').textContent='Il faut au moins 2 civils : ajoute des joueurs ou retire un rôle.';return}
      local.game=g;reveal(0);
    };
  }
  function options(imp,white){
    return '<div class="row" style="margin-top:18px"><div><label class="lbl" for="imp-n">Imposteurs</label><select id="imp-n" style="width:auto"><option value="1"'+(imp===1?' selected':'')+'>1</option><option value="2"'+(imp===2?' selected':'')+'>2</option></select></div>'+
      '<label style="font-weight:600;margin-top:24px"><input type="checkbox" id="imp-white" style="width:auto;margin-right:8px"'+(white?' checked':'')+'>Ajouter un Mr White</label></div>'+
      '<p class="muted">Mr White ne reçoit aucun mot : il doit bluffer. S\'il est éliminé, il gagne seul s\'il devine le mot des civils.</p>';
  }
  function makeGame(players,nImp,white){
    var special=nImp+(white?1:0);
    if(players.length-special<2)return null;
    var pair=PP.pick(PAIRS);if(Math.random()<.5)pair=[pair[1],pair[0]];
    var roles=[];for(var i=0;i<players.length;i++)roles.push(i<nImp?'imp':(white&&i===nImp?'white':'civ'));
    roles=PP.shuffle(roles);
    return {pair:pair,players:players.map(function(p,i){return {id:p.id,name:p.name,role:roles[i],out:false}}),round:1};
  }
  function wordOf(g,p){return p.role==='civ'?g.pair[0]:p.role==='imp'?g.pair[1]:null}
  function roleName(r){return r==='civ'?'civil':r==='imp'?'imposteur':'Mr White'}
  function alive(g){return g.players.filter(function(p){return !p.out})}
  function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'')}

  function reveal(i){sfx.play('ui');
    var g=local.game;
    if(i>=g.players.length)return discuss();
    var p=g.players[i];
    box.innerHTML='<div class="panel card-reveal"><p class="muted">Passe l\'ordinateur à</p><div class="who">'+esc(p.name)+'</div><p>Vérifie que personne d\'autre ne regarde l\'écran.</p><button type="button" id="imp-see">Voir mon mot</button></div>';
    $('imp-see').onclick=function(){
      box.innerHTML='<div class="panel card-reveal"><div class="who">'+esc(p.name)+'</div><p>Ton mot secret :</p>'+secretHtml(wordOf(g,p))+'<p class="muted">Retiens-le, puis cache-le avant de passer l\'ordinateur.</p><button type="button" id="imp-hide">C\'est retenu, cacher</button></div>';
      $('imp-hide').onclick=function(){reveal(i+1)};
    };
  }
  function secretHtml(w){return w?'<div class="secret">'+esc(w)+'</div>':'<div class="secret none">Tu es Mr White.<br>Tu n\'as pas de mot : écoute les autres et bluffe !</div>'}
  function speakOrder(g){
    var a=alive(g),start=Math.floor(Math.random()*a.length),order=a.slice(start).concat(a.slice(0,start));
    if(order[0].role==='white'&&order.length>1)order.push(order.shift());
    return order;
  }
  function discuss(){
    var g=local.game,order=speakOrder(g);
    box.innerHTML='<div class="panel"><h3 class="t">Tour '+g.round+' : les indices</h3><p>Chacun dit <b>un seul mot ou une courte phrase</b> qui décrit son mot, sans le dire. Dans cet ordre :</p>'+
      '<ol class="order">'+order.map(function(p){return '<li>'+esc(p.name)+'</li>'}).join('')+'</ol><p>Quand tout le monde a parlé, discutez puis votez.</p><button type="button" id="imp-vote">Passer au vote</button></div>';
    $('imp-vote').onclick=vote;
  }
  function vote(){
    var g=local.game,h='<div class="panel"><h3 class="t">Qui éliminer ?</h3><p>Mettez-vous d\'accord, puis clique sur le joueur qui a reçu le plus de votes.</p><div class="votes">';
    g.players.forEach(function(p,i){h+='<button type="button" data-v="'+i+'" class="'+(p.out?'out':'')+'"'+(p.out?' disabled':'')+'>'+esc(p.name)+'</button>'});
    box.innerHTML=h+'</div></div>';
    box.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){eliminate(+b.dataset.v)}});
  }
  function eliminate(i){
    var g=local.game,p=g.players[i];p.out=true;
    var h='<div class="panel"><div class="result"><h3>'+esc(p.name)+' est éliminé</h3><p>Son rôle : <b>'+roleName(p.role)+'</b>'+(p.role!=='white'?' (mot : '+esc(wordOf(g,p))+')':'')+'.</p></div>';
    if(p.role==='white'){
      h+='<p><b>'+esc(p.name)+'</b>, dernière chance : quel est le mot des civils ?</p><div class="row"><input id="imp-guess" placeholder="Ta réponse" autocomplete="off" style="max-width:320px"><button type="button" id="imp-try">Valider</button></div></div>';
      box.innerHTML=h;$('imp-guess').focus();
      $('imp-try').onclick=function(){
        if(norm($('imp-guess').value)===norm(g.pair[0]))return end('Mr White a deviné « '+g.pair[0]+' » : '+p.name+' gagne seul !');
        box.querySelector('.panel').insertAdjacentHTML('beforeend','<p class="err">Raté !</p>');setTimeout(next,900);
      };
      return;
    }
    box.innerHTML=h+'<p><button type="button" id="imp-next">Continuer</button></p></div>';$('imp-next').onclick=next;
  }
  function verdict(g){
    var a=alive(g),bad=a.filter(function(p){return p.role!=='civ'}).length,civ=a.length-bad;
    if(!bad)return 'Les civils ont démasqué tout le monde. Victoire des civils !';
    if(bad>=civ)return 'Les imposteurs sont aussi nombreux que les civils. Victoire des imposteurs !';
    return null;
  }
  function next(){var v=verdict(local.game);if(v)return end(v);local.game.round++;discuss()}
  function end(msg){
    var g=local.game;
    box.innerHTML=endHtml(g,msg)+'<div class="row" style="margin-top:14px"><button type="button" id="imp-again">Nouvelle partie</button><button type="button" class="ghost" id="imp-edit">Changer les joueurs</button></div></div>';
    $('imp-again').onclick=function(){local.game=makeGame(g.players.map(function(p){return {id:p.id,name:p.name}}),local.imp,local.white);reveal(0)};
    $('imp-edit').onclick=localSetup;
  }
  function endHtml(g,msg){
    return '<div class="panel"><h3 class="t">Fin de partie</h3><p style="font-size:18px;font-weight:600">'+esc(msg)+'</p><p>Mot des civils : <b>'+esc(g.pair[0])+'</b> · Mot de l\'imposteur : <b>'+esc(g.pair[1])+'</b></p><ul class="plist">'+
      g.players.map(function(p){return '<li'+(p.out?' style="opacity:.5"':'')+'>'+esc(p.name)+' · '+roleName(p.role)+'</li>'}).join('')+'</ul>';
  }

  /* ============ MODE EN LIGNE : HÔTE ============ */
  var H={game:null,votes:{},imp:1,white:false};
  function hostLobby(){
    listen();
    var n=net.players.length;
    box.innerHTML='<div class="panel"><h3 class="t">Salon '+esc(net.code)+' · '+n+' joueurs</h3><p>Chaque joueur verra son mot sur son propre écran. Toi aussi, tu joues.</p><ul class="plist">'+net.players.map(function(p){return '<li>'+esc(p.name)+'</li>'}).join('')+'</ul>'+
      options(H.imp,H.white)+'<p class="err" id="imp-err"></p><p style="margin:14px 0 0"><button type="button" id="imp-go"'+(n<3?' disabled':'')+'>Distribuer les mots</button></p></div>';
    $('imp-n').onchange=function(){H.imp=+this.value};$('imp-white').onchange=function(){H.white=this.checked};
    $('imp-go').onclick=function(){
      var g=makeGame(net.players,H.imp,H.white);
      if(!g){$('imp-err').textContent='Il faut au moins 2 civils.';return}
      H.game=g;
      g.players.forEach(function(p){net.to(p.id,{t:'imp-role',role:p.role,word:wordOf(g,p),round:1})});
      hostDiscuss();
    };
  }
  function hostDiscuss(){
    var g=H.game,order=speakOrder(g);
    net.broadcast({t:'imp-phase',phase:'discuss',order:order.map(function(p){return p.name}),round:g.round});
    box.innerHTML='<div class="panel">'+myCard()+'<h3 class="t">Tour '+g.round+' : les indices</h3><p>Chacun donne un indice, dans cet ordre :</p><ol class="order">'+order.map(function(p){return '<li>'+esc(p.name)+'</li>'}).join('')+'</ol><button type="button" id="imp-vote">Ouvrir le vote</button></div>';
    $('imp-vote').onclick=hostVote;
  }
  function myCard(){
    var me=H.game.players.filter(function(p){return p.id==='host'})[0];if(!me)return '';
    return '<details class="result" style="cursor:pointer"><summary><b>Mon mot</b> (clique pour voir)</summary>'+secretHtml(wordOf(H.game,me))+'</details>';
  }
  function hostVote(){
    var g=H.game;H.votes={};
    var a=alive(g).map(function(p){return {id:p.id,name:p.name}});
    net.broadcast({t:'imp-phase',phase:'vote',alive:a});
    renderHostVote();
  }
  function renderHostVote(){
    var g=H.game,a=alive(g),n=Object.keys(H.votes).length;
    var h='<div class="panel">'+myCard()+'<h3 class="t">Vote</h3><p>'+n+' / '+a.length+' ont voté.</p>';
    var me=g.players.filter(function(p){return p.id==='host'&&!p.out})[0];
    if(me&&!H.votes.host){h+='<p>Ton vote :</p><div class="votes">'+a.map(function(p){return '<button type="button" data-v="'+p.id+'">'+esc(p.name)+'</button>'}).join('')+'</div>'}
    h+='<p class="muted">Le vote se termine tout seul quand tout le monde a voté.</p><button type="button" class="ghost" id="imp-force">Clore le vote maintenant</button></div>';
    box.innerHTML=h;
    box.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){H.votes.host=b.dataset.v;checkVotes(true)}});
    $('imp-force').onclick=function(){closeVote()};
  }
  function checkVotes(rerender){
    var a=alive(H.game);
    if(Object.keys(H.votes).length>=a.length)return closeVote();
    if(rerender)renderHostVote();
  }
  function closeVote(){
    sfx.play('kill');var g=H.game,count={};
    Object.keys(H.votes).forEach(function(k){count[H.votes[k]]=(count[H.votes[k]]||0)+1});
    var ids=Object.keys(count);if(!ids.length)ids=alive(g).map(function(p){return p.id});
    var max=Math.max.apply(null,ids.map(function(i){return count[i]||0}));
    var top=ids.filter(function(i){return (count[i]||0)===max});
    var outId=PP.pick(top),p=g.players.filter(function(x){return x.id===outId})[0];
    p.out=true;
    var tally=alive(g).concat([p]).map(function(x){return {name:x.name,n:count[x.id]||0}});
    net.broadcast({t:'imp-phase',phase:'out',name:p.name,role:p.role,word:wordOf(g,p),tally:tally,tie:top.length>1});
    var h='<div class="panel"><div class="result"><h3>'+esc(p.name)+' est éliminé'+(top.length>1?' (égalité, tiré au sort)':'')+'</h3><p>Rôle : <b>'+roleName(p.role)+'</b>'+(p.role!=='white'?' · mot : '+esc(wordOf(g,p)):'')+'</p>'+
      tally.map(function(t){return '<div class="bar"><span>'+esc(t.name)+'</span><i style="width:'+(t.n*40)+'px"></i><span>'+t.n+'</span></div>'}).join('')+'</div>';
    if(p.role==='white'){
      net.to(p.id,{t:'imp-guess'});
      h+='<p class="wait">'+esc(p.name)+' est Mr White et tente de deviner le mot</p></div>';box.innerHTML=h;
      if(p.id==='host'){box.querySelector('.wait').outerHTML='<div class="row"><input id="imp-guess" placeholder="Le mot des civils ?" style="max-width:320px"><button type="button" id="imp-try">Valider</button></div>';$('imp-try').onclick=function(){hostGuess('host',$('imp-guess').value)}}
      return;
    }
    box.innerHTML=h+'<p><button type="button" id="imp-next">Continuer</button></p></div>';
    $('imp-next').onclick=hostNext;
  }
  function hostGuess(id,txt){
    var g=H.game,p=g.players.filter(function(x){return x.id===id})[0];
    if(norm(txt)===norm(g.pair[0]))return hostEnd('Mr White a deviné « '+g.pair[0]+' » : '+p.name+' gagne seul !');
    net.broadcast({t:'imp-phase',phase:'info',msg:p.name+' a proposé « '+txt+' » : raté !'});
    box.innerHTML='<div class="panel"><p class="err">'+esc(p.name)+' a proposé « '+esc(txt)+' » : raté !</p><button type="button" id="imp-next">Continuer</button></div>';$('imp-next').onclick=hostNext;
  }
  function hostNext(){var v=verdict(H.game);if(v)return hostEnd(v);H.game.round++;hostDiscuss()}
  function hostEnd(msg){
    var g=H.game;
    net.broadcast({t:'imp-phase',phase:'end',msg:msg,pair:g.pair,players:g.players.map(function(p){return {name:p.name,role:p.role,out:p.out}})});
    box.innerHTML=endHtml(g,msg)+'<div class="row" style="margin-top:14px"><button type="button" id="imp-again">Nouvelle partie</button><button type="button" class="ghost" data-go="room">Retour au salon</button></div></div>';
    $('imp-again').onclick=hostLobby;
  }

  /* ============ MODE EN LIGNE : INVITÉ ============ */
  function guestWait(){
    listen();
    box.innerHTML='<div class="panel card-reveal"><p class="wait">L\'hôte distribue les mots</p></div>';
  }
  function guestRole(m){sfx.play('join');
    online.role=m.role;online.word=m.word;online.voted=false;
    box.innerHTML='<div class="panel card-reveal"><div class="who">'+esc(net.me.name)+'</div><p>Ton mot secret :</p><div id="imp-secret">'+secretHtml(m.word)+'</div><button type="button" class="ghost" id="imp-toggle">Cacher</button><p class="wait" style="margin-top:16px">En attente du tour des indices</p></div>';
    $('imp-toggle').onclick=function(){var s=$('imp-secret');s.hidden=!s.hidden;this.textContent=s.hidden?'Voir mon mot':'Cacher'};
  }
  function guestPhase(m){
    if(m.phase==='discuss'){
      box.innerHTML='<div class="panel">'+guestCard()+'<h3 class="t">Tour '+m.round+' : les indices</h3><p>Ordre de parole :</p><ol class="order">'+m.order.map(function(n){return '<li>'+esc(n)+'</li>'}).join('')+'</ol><p class="wait">L\'hôte ouvrira le vote</p></div>';
    }
    if(m.phase==='vote'){
      var meOut=!m.alive.some(function(p){return p.id===net.me.id});
      if(meOut){box.innerHTML='<div class="panel">'+guestCard()+'<h3 class="t">Vote en cours</h3><p class="muted">Tu es éliminé, tu regardes.</p></div>';return}
      box.innerHTML='<div class="panel">'+guestCard()+'<h3 class="t">Qui est l\'imposteur ?</h3><div class="votes">'+m.alive.map(function(p){return '<button type="button" data-v="'+p.id+'">'+esc(p.name)+'</button>'}).join('')+'</div><p class="wait" id="imp-wait" hidden>Vote envoyé, on attend les autres</p></div>';
      box.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){net.send({t:'imp-v',target:b.dataset.v});box.querySelectorAll('[data-v]').forEach(function(x){x.disabled=true;x.classList.toggle('sel',x===b)});$('imp-wait').hidden=false}});
    }
    if(m.phase==='out'){
      box.innerHTML='<div class="panel">'+guestCard()+'<div class="result"><h3>'+esc(m.name)+' est éliminé'+(m.tie?' (égalité, tiré au sort)':'')+'</h3><p>Rôle : <b>'+roleName(m.role)+'</b>'+(m.role!=='white'?' · mot : '+esc(m.word):'')+'</p>'+
        m.tally.map(function(t){return '<div class="bar"><span>'+esc(t.name)+'</span><i style="width:'+(t.n*40)+'px"></i><span>'+t.n+'</span></div>'}).join('')+'</div><p class="wait">Suite</p></div>';
    }
    if(m.phase==='info'){box.innerHTML='<div class="panel">'+guestCard()+'<p class="err">'+esc(m.msg)+'</p><p class="wait">Suite</p></div>'}
    if(m.phase==='end'){
      box.innerHTML='<div class="panel"><h3 class="t">Fin de partie</h3><p style="font-size:18px;font-weight:600">'+esc(m.msg)+'</p><p>Mot des civils : <b>'+esc(m.pair[0])+'</b> · Mot de l\'imposteur : <b>'+esc(m.pair[1])+'</b></p><ul class="plist">'+
        m.players.map(function(p){return '<li'+(p.out?' style="opacity:.5"':'')+'>'+esc(p.name)+' · '+roleName(p.role)+'</li>'}).join('')+'</ul><p class="wait">L\'hôte peut relancer une partie</p></div>';
    }
  }
  function guestCard(){return '<details class="result" style="cursor:pointer"><summary><b>Mon mot</b> (clique pour voir)</summary>'+secretHtml(online.word)+'</details>'}
  function guestGuess(){
    box.innerHTML='<div class="panel card-reveal"><h3 class="t">Tu es Mr White !</h3><p>Dernière chance : quel est le mot des civils ?</p><div class="row" style="justify-content:center"><input id="imp-guess" placeholder="Ta réponse" style="max-width:320px"><button type="button" id="imp-try">Valider</button></div></div>';
    $('imp-guess').focus();$('imp-try').onclick=function(){net.send({t:'imp-g',text:$('imp-guess').value});box.innerHTML='<div class="panel"><p class="wait">Réponse envoyée</p></div>'};
    $('imp-guess').onkeydown=function(e){if(e.key==='Enter')$('imp-try').click()};
  }

  function listen(){
    if(online.sub)return;
    online.sub=net.on(function(m,from){
      if(PP.cur()!=='imp')return;
      if(net.isHost){
        if(m.t==='imp-v'&&H.game&&!H.votes[from]){H.votes[from]=m.target;checkVotes(true)}
        if(m.t==='imp-g'&&H.game)hostGuess(from,m.text);
        if(m.t==='players'&&!H.game)hostLobby();
        if(m.t==='imp-role'&&from==='host'){/* l'hôte se voit via myCard */}
      }else{
        if(m.t==='imp-role')guestRole(m);
        if(m.t==='imp-phase')guestPhase(m);
        if(m.t==='imp-guess')guestGuess();
      }
    });
  }

  PP.games.imp={open:open,close:close};
})();
