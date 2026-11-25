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
  function beat(){if(net.inRoom()&&net.isHost&&lobby)lobby.register({code:net.code,host:net.me.name,n:net.players.length,game:curGame})}
  setInterval(beat,8000);
  PP.setRoomGame=function(g){curGame=g;beat()};
  function bar(){
    var rb=$('roombar');
    if(net.inRoom()){rb.hidden=false;$('roombar-txt').textContent='Salon '+net.code+' · '+net.players.length+' joueur'+(net.players.length>1?'s':'')}
    else rb.hidden=true;
  }
  $('roombar-leave').addEventListener('click',function(){if(net.isHost&&lobby)lobby.unregister(net.code);net.leave();bar();PP.go('menu')});

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
    h+='<label class="lbl" style="margin-top:14px">Joueurs ('+net.players.length+')</label><ul class="plist">'+net.players.map(function(p){return '<li class="'+(p.id===net.me.id?'me ':'')+(p.id==='host'?'host':'')+'">'+PP.avatar(p.name)+esc(p.name)+'</li>'}).join('')+'</ul>';
    if(net.isHost){
      h+='<label class="lbl" style="margin-top:18px">Choisis le jeu pour tout le salon</label><div class="tiles room-tiles">'+ONLINE.map(function(g){
        var n=net.players.length,ok=n>=g.min,why=ok?(g.max&&n>g.max?'Les '+g.max+' premiers jouent':g.desc):'Il faut '+g.min+' joueurs';
        return '<button type="button" class="tile'+(ok?'':' locked')+'" data-launch="'+g.id+'"'+(ok?'':' disabled')+'><img src="thumb-'+g.id+'.jpg?v=3.3" alt=""><span class="tile-info"><b>'+esc(g.name)+'</b><small>'+esc(why)+'</small></span><span class="tile-play">Lancer</span></button>';
      }).join('')+'</div>';
    }else h+='<p class="wait">En attente de l\'hôte</p>';
    h+='<p style="margin:18px 0 0"><button type="button" class="red" id="room-leave">Quitter le salon</button></p></div>';
    box.innerHTML=h;
    var cp=$('room-copy');if(cp)cp.onclick=function(){var i=$('room-link');i.select();try{navigator.clipboard.writeText(i.value);cp.textContent='Copié !'}catch(e){document.execCommand('copy');cp.textContent='Copié !'}};
    $('room-leave').onclick=function(){if(net.isHost&&lobby)lobby.unregister(net.code);net.leave();render()};
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
    box.innerHTML='<div class="rooms-open"><h3 class="t">Salons ouverts</h3><div id="room-list">'+roomsHtml(lobby?lobby.list():[])+'</div></div><div class="panel narrow"><label class="lbl" for="room-name">Ton pseudo</label><input id="room-name" maxlength="14" placeholder="Pseudo" value="'+esc(PP.myName())+'">'+
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

  var known=[];
  net.on(function(msg){
    if(msg.t==='players'){
      var now=msg.players.map(function(p){return p.name});
      if(known.length&&net.inRoom()){now.filter(function(n){return known.indexOf(n)<0}).forEach(function(n){PP.toast(n+' a rejoint le salon','ok');sfx.play('join')});known.filter(function(n){return now.indexOf(n)<0}).forEach(function(n){PP.toast(n+' a quitté le salon','warn')})}
      known=now;bar();if(PP.cur()==='room')render()}
    if(msg.t==='launch'){sfx.play('go');PP.go(msg.game)}
    if(msg.t==='closed'){PP.toast('Le salon a été fermé par l\'hôte','warn');known=[];bar();if(PP.cur()!=='menu'){PP.go('room')}}
  });
  net.onStatus(function(s){var e=$('room-err');if(e)e.textContent=s});

  PP.games.room={open:render};
  PP.games.join={open:function(){$('join-name').value=PP.myName();var m=/[?&]salon=(\d{3})/.exec(location.search);if(m)$('join-code').value=m[1];($('join-code').value?$('join-name'):$('join-code')).focus()}};
})();
