/* Pixel Pause — écran du salon (création, invitation, liste des joueurs, lancement d'un jeu) */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,box=$('room-box');
  var ONLINE=[
    {id:'fps',name:'Bunker 3D',desc:'Battle royale, des bots complètent',min:1},
    {id:'party',name:'Dernier Debout',desc:'Épreuves éliminatoires, bots en renfort',min:1,max:8},
    {id:'surv',name:'Survie',desc:'La même île pour tout le salon',min:1},
    {id:'sumo',name:'Sumo Arena',desc:'Pousse les autres dans le vide',min:2,max:4},
    {id:'foot',name:'Foot 2v2',desc:'Équipes mélangées, bots si besoin',min:2,max:4},
    {id:'kart',name:'Pixel Kart',desc:'Course de 3 tours',min:2,max:8},
    {id:'run',name:'Néon Rush',desc:'Celui qui va le plus loin',min:2},
    {id:'time',name:'Quand et où',desc:'Année et lieu, le meilleur score gagne',min:2},
    {id:'geo',name:'Devine où',desc:'Le plus proche gagne la manche',min:2},
    {id:'imp',name:'Mot imposteur',desc:'Chacun son mot sur son téléphone',min:3},
    {id:'prob',name:'Le plus probable',desc:'Votes entre potes',min:3},
    {id:'snake',name:'Paquet Snake',desc:'2 à 4 serpents',min:2,max:4},
    {id:'draw',name:'Dessine et devine',desc:'Un dessine, les autres devinent',min:2},
    {id:'quiz',name:'Quiz',desc:'Culture générale, le plus rapide marque',min:2},
    {id:'typing',name:'Course de frappe',desc:'Tape la phrase le plus vite',min:2},
    {id:'reflex',name:'Réflexes',desc:'Appuie dès que ça devient rouge',min:2},
    {id:'c4',name:'Quatre en ligne',desc:'Aligne 4 jetons',min:2,max:2},
    {id:'navale',name:'Bataille navale',desc:'Coule la flotte d\'en face',min:2,max:2}
  ];

  var GN={party:'Dernier Debout',time:'Quand et où',surv:'Survie','fps-br':'Bunker · battle royale',fps:'Bunker 3D',sumo:'Sumo Arena',foot:'Foot 2v2',kart:'Pixel Kart',run:'Néon Rush',geo:'Devine où',imp:'Mot imposteur',prob:'Le plus probable',snake:'Paquet Snake',draw:'Dessine et devine',quiz:'Quiz',typing:'Course de frappe',reflex:'Réflexes',c4:'Quatre en ligne',navale:'Bataille navale'},curGame=null,lobby=PP.lobby;
  /* les salons sont privés : on ne les affiche plus dans une liste publique, on rejoint avec le code ou le lien */
  function beat(){}
  setInterval(beat,8000);
  PP.setRoomGame=function(g){curGame=g;beat()};
  function gid(){return curGame==='fps-br'?'fps':curGame}
  function backToGame(){var g=gid();if(!g)return;sfx.play('go');PP.go(g);if(!net.isHost)setTimeout(function(){net.send({t:'rejoin',game:g})},250)}
  /* l'hôte garde les derniers messages de départ de chaque jeu pour remettre dans la partie ceux qui reviennent */
  var replay={},rb0=net.broadcast;
  net.broadcast=function(m,ex){try{var t=m&&m.t,g=gid();if(t&&g&&g!=='fps'&&g!=='surv'){if(/-(go|start)$/.test(t))replay[g]=[m];else if(/-(round|r|inter|b)$/.test(t)&&replay[g]){replay[g]=replay[g].slice(0,1).concat([m])}else if(/-end$/.test(t))delete replay[g]}}catch(e){}return rb0.apply(net,arguments)};
  function catchUp(id,g){if(net.isHost&&g===gid()&&PP.cur()===g&&replay[g])replay[g].forEach(function(m,i){setTimeout(function(){net.to(id,m)},i*150)})}
  setInterval(function(){if(net.inRoom())bar()},1500);document.addEventListener('pp-go',function(){setTimeout(bar,0)});
  function bar(){
    var rb=$('roombar');
    if(net.inRoom()){rb.hidden=false;$('roombar-txt').textContent='Salon '+net.code+' · '+net.players.length+' joueur'+(net.players.length>1?'s':'')}
    else rb.hidden=true;
    /* on a quitté le jeu du salon : bouton pour y retourner */
    var bk=$('roombar-back');if(!bk){bk=document.createElement('button');bk.type='button';bk.id='roombar-back';bk.className='mini roombar-back';rb.insertBefore(bk,$('roombar-leave'));bk.onclick=backToGame}
    var g=gid(),show=net.inRoom()&&g&&PP.cur()!==g;bk.hidden=!show;if(show)bk.textContent='▶ '+(GN[g]||g)+' en cours · Rejoindre';
  }
  /* le chef qui part laisse le salon au joueur suivant au lieu de le fermer */
  var leaving=false;
  function leaveRoom(){curGame=null;if(net.isHost&&net.players.length>1&&net.handover(net.players[1].id,true)){leaving=true;PP.toast('On passe le salon à '+net.players[1].name+'…','ok')}else{if(net.isHost&&lobby)lobby.unregister(net.code);net.leave()}}
  $('roombar-leave').addEventListener('click',function(){leaveRoom();setTimeout(function(){bar();PP.go('menu')},350)});

  function render(){
    bar();
    if(!net.inRoom())return setup();
    var h='<div class="panel">';
    if(net.isHost){
      h+='<label class="lbl">Code du salon</label><div class="code-big">'+esc(net.code)+'</div><p class="muted">Tes potes vont sur ce site, « Rejoindre avec un code », et tapent ce code. Ou envoie-leur le lien :</p>';
      h+='<div class="linkbox"><input id="room-link" readonly value="'+esc(net.inviteLink())+'"><button type="button" class="ghost" id="room-copy">Copier</button></div>';
    }else{
      h+='<label class="lbl">Salon</label><div class="code-big">'+esc(net.code)+'</div><p class="muted">Tu es connecté. Quand l\'hôte lance un jeu, ton écran le suit tout seul.</p>';
    }
    h+='<label class="lbl" style="margin-top:14px">Joueurs ('+net.players.length+')</label><ul class="plist">'+net.players.map(function(p){return '<li class="'+(p.id===net.me.id?'me ':'')+(p.id==='host'?'host':'')+'">'+PP.avatar(p.name)+esc(p.name)+(p.id==='host'?' <small class="chef">chef</small>':'')+(net.isHost&&p.id!=='host'?' <button type="button" class="mini ghost chef-btn" data-chef="'+esc(p.id)+'">Nommer chef</button>':'')+'</li>'}).join('')+'</ul>';
    if(net.isHost){
      h+='<label class="lbl" style="margin-top:18px">Choisis le jeu pour tout le salon</label><div class="tiles room-tiles">'+ONLINE.map(function(g){
        var n=net.players.length,ok=n>=g.min,why=ok?(g.max&&n>g.max?'Les '+g.max+' premiers jouent':g.desc):'Il faut '+g.min+' joueurs';
        return '<button type="button" class="tile'+(ok?'':' locked')+'" data-launch="'+g.id+'"'+(ok?'':' disabled')+'><img src="thumb-'+g.id+'.jpg?v=3.3" alt=""><span class="tile-info"><b>'+esc(g.name)+'</b><small>'+esc(why)+'</small></span><span class="tile-play">Lancer</span></button>';
      }).join('')+'</div>';
    }else h+='<p class="wait">En attente de l\'hôte</p>';
    h+='<p style="margin:18px 0 0"><button type="button" class="red" id="room-leave">Quitter le salon</button></p></div>';
    box.innerHTML=h;
    var cp=$('room-copy');if(cp)cp.onclick=function(){var i=$('room-link');i.select();try{navigator.clipboard.writeText(i.value);cp.textContent='Copié !'}catch(e){document.execCommand('copy');cp.textContent='Copié !'}};
    $('room-leave').onclick=function(){leaveRoom();setTimeout(render,350)};
    box.querySelectorAll('[data-chef]').forEach(function(b){b.onclick=function(){var p=net.players.filter(function(q){return q.id===b.dataset.chef})[0];if(!p)return;curGame=null;net.handover(p.id,false);PP.toast(p.name+' devient le chef','ok');box.innerHTML='<div class="panel"><p class="wait">On passe le salon à '+esc(p.name)+'…</p></div>'}});
    box.querySelectorAll('[data-launch]').forEach(function(b){b.onclick=function(){curGame=b.dataset.launch;beat();net.all({t:'launch',game:b.dataset.launch});}});
  }

  function roomsHtml(l){
    if(!l.length)return '<p class="muted rooms-empty">Aucun salon ouvert pour l\'instant. Crée le tien, tes potes le verront ici.</p>';
    return l.map(function(r){return '<div class="room-row"><span class="rr-code">'+esc(r.code)+'</span><span class="rr-info"><b>Salon de '+esc(r.host)+'</b><small>'+r.n+' joueur'+(r.n>1?'s':'')+(r.game?' · en train de jouer à '+esc(GN[r.game]||r.game):' · dans le salon')+'</small></span><button type="button" class="ink" data-join="'+esc(r.code)+'">Rejoindre →</button></div>'}).join('');
  }
  function bindRooms(){
    box.querySelectorAll('[data-join]').forEach(function(b){b.onclick=function(){
      var n=($('room-name')&&$('room-name').value.trim())||PP.myName()||'Joueur';PP.setName(n);b.disabled=true;b.textContent='Connexion…';
      net.join(b.dataset.join,n,function(err){if(err){b.disabled=false;b.textContent='Rejoindre →';PP.toast(err,'warn');return}sfx.play('win');render()});
    }});
  }
  if(lobby)lobby.on(function(l){var el=$('room-list');if(el&&!net.inRoom()){el.innerHTML=roomsHtml(l);bindRooms()}});
  setInterval(function(){if(PP.cur()==='room'&&!net.inRoom()&&lobby)lobby.refresh()},4000);
  function setup(){
    box.innerHTML='<div class="panel narrow"><p class="muted" style="margin-top:0">Crée ton salon, puis envoie le code (ou le lien) à tes potes. Seuls ceux qui ont le code peuvent entrer.</p><label class="lbl" for="room-name">Ton pseudo</label><input id="room-name" maxlength="14" placeholder="Pseudo" value="'+esc(PP.myName())+'">'+
      '<p class="err" id="room-err"></p><div class="row" style="margin-top:16px"><button type="button" id="room-create">Créer le salon</button><button type="button" class="ghost" data-go="join">J\'ai un code</button></div>'+
      '<p class="muted" style="margin-top:14px">Le salon marche entre téléphones et PC, même sur des réseaux différents. L\'hôte doit rester sur la page.</p></div>';
    bindRooms();if(lobby)lobby.refresh();
    $('room-create').onclick=function(){
      var n=$('room-name').value.trim()||'Hôte';PP.setName(n);
      $('room-create').disabled=true;$('room-err').textContent='';
      net.host(n,function(err,code){
        if(err){$('room-err').textContent=err;$('room-create').disabled=false;return}
        curGame=null;setTimeout(beat,300);
        sfx.play('win');PP.toast('Salon '+code+' créé','ok');render();
      });
    };
  }

  /* Rejoindre */
  $('join-go').addEventListener('click',function(){
    var c=$('join-code').value.trim(),n=$('join-name').value.trim()||'Joueur';
    if(!/^\d{3}$/.test(c)){$('join-err').textContent='Le code fait 3 chiffres.';return}
    PP.setName(n);$('join-go').disabled=true;$('join-err').textContent='Connexion';$('join-err').className='wait';
    net.join(c,n,function(err){
      $('join-go').disabled=false;$('join-err').className='err';
      if(err){$('join-err').textContent=err;return}
      $('join-err').textContent='';sfx.play('win');PP.go('room');
    });
  });
  $('join-code').addEventListener('keydown',function(e){if(e.key==='Enter')$('join-name').focus()});
  $('join-name').addEventListener('keydown',function(e){if(e.key==='Enter')$('join-go').click()});

  /* l'hôte change de jeu : tout le salon suit ; un nouveau venu arrive directement sur le jeu en cours */
  document.addEventListener('pp-go',function(e){var v=e.detail;if(!net.inRoom()||!net.isHost)return;if(!ONLINE.some(function(g){return g.id===v})||v===curGame)return;curGame=v;beat();net.broadcast({t:'launch',game:v})});
  var knownIds={};
  net.on(function(msg){if(msg.t!=='players'||!net.isHost)return;msg.players.forEach(function(p){if(p.id!=='host'&&!knownIds[p.id]){knownIds[p.id]=1;if(curGame&&curGame!=='surv'){net.to(p.id,{t:'launch',game:gid()});var pid=p.id;setTimeout(function(){catchUp(pid,gid())},700)}}})});
  var known=[];
  net.on(function(msg){
    if(msg.t==='players'){
      var now=msg.players.map(function(p){return p.name});
      if(known.length&&net.inRoom()){now.filter(function(n){return known.indexOf(n)<0}).forEach(function(n){PP.toast(n+' a rejoint le salon','ok');sfx.play('join')});known.filter(function(n){return now.indexOf(n)<0}).forEach(function(n){PP.toast(n+' a quitté le salon','warn')})}
      known=now;bar();if(PP.cur()==='room')render()}
    if(msg.t==='handfail'){PP.toast('Le changement de chef n\'a pas marché','warn');if(leaving){leaving=false;net.leave()}bar();if(PP.cur()==='room')render()}
    if(msg.t==='migrating'&&msg.me&&leaving){leaving=false;curGame=null;PP.toast('Tu as quitté le salon, '+msg.chef+' est le nouveau chef','ok');setTimeout(function(){bar();if(PP.cur()==='room')render()},600);return}
    if(msg.t==='migrating'){curGame=null;PP.toast(msg.mine?'Tu deviens le chef du salon':(msg.chef+' est le nouveau chef, reconnexion…'),'ok');if(PP.cur()==='room')box.innerHTML='<div class="panel"><p class="wait">Reconnexion au salon de '+esc(msg.chef)+'…</p></div>';if(PP.cur()!=='menu')PP.go('room')}
    if(msg.t==='migrated'){known=net.players.map(function(p){return p.name});bar();if(PP.cur()==='room')render();if(msg.chef)PP.toast('Salon '+net.code+' : c\'est toi qui choisis le jeu','ok')}
    if(msg.t==='launch'){curGame=msg.game;sfx.play('go');PP.go(msg.game)}
    if(msg.t==='rejoin'&&net.isHost){catchUp(arguments[1],msg.game)}
    if(msg.t==='closed'){curGame=null;PP.toast('Le salon a été fermé par l\'hôte','warn');known=[];bar();if(PP.cur()!=='menu'){PP.go('room')}}
  });
  net.onStatus(function(s){var e=$('room-err');if(e)e.textContent=s});

  PP.games.room={open:render};
  PP.games.join={open:function(){$('join-name').value=PP.myName();var m=/[?&]salon=(\d{3})/.exec(location.search);if(m)$('join-code').value=m[1];($('join-code').value?$('join-name'):$('join-code')).focus()}};
})();
