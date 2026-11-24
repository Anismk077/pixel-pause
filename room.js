/* Pixel Pause — écran du salon (création, invitation, liste des joueurs, lancement d'un jeu) */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,box=$('room-box');
  var ONLINE=[
    {id:'imp',name:'Mot imposteur',desc:'Chacun reçoit son mot sur son téléphone',min:3},
    {id:'prob',name:'Le plus probable',desc:'Des questions, des votes, des résultats qui piquent',min:3},
    {id:'snake',name:'Paquet Snake en ligne',desc:'2 à 4 serpents sur le même plateau',min:2,max:4},
    {id:'geo',name:'Devine où',desc:'Une photo, chacun pose son point, le plus proche gagne',min:2}
  ];

  function bar(){
    var rb=$('roombar');
    if(net.inRoom()){rb.hidden=false;$('roombar-txt').textContent='Salon '+net.code+' · '+net.players.length+' joueur'+(net.players.length>1?'s':'')}
    else rb.hidden=true;
  }
  $('roombar-leave').addEventListener('click',function(){net.leave();bar();PP.go('menu')});

  function render(){
    bar();
    if(!net.inRoom())return setup();
    var h='<div class="panel">';
    if(net.isHost){
      h+='<label class="lbl">Code du salon</label><div class="code-big">'+esc(net.code)+'</div><p class="muted">Tes potes vont sur ce site, « Rejoindre avec un code », et tapent ce code. Ou envoie-leur le lien :</p>';
      h+='<div class="linkbox"><input id="room-link" readonly value="'+esc(net.inviteLink())+'"><button type="button" class="ghost" id="room-copy">Copier</button></div>';
    }else{
      h+='<label class="lbl">Salon</label><div class="code-big">'+esc(net.code)+'</div><p class="muted">Connecté. L\'hôte choisit le jeu : ton écran suivra tout seul.</p>';
    }
    h+='<label class="lbl" style="margin-top:14px">Joueurs ('+net.players.length+')</label><ul class="plist">'+net.players.map(function(p){return '<li class="'+(p.id===net.me.id?'me ':'')+(p.id==='host'?'host':'')+'">'+PP.avatar(p.name)+esc(p.name)+'</li>'}).join('')+'</ul>';
    if(net.isHost){
      h+='<label class="lbl" style="margin-top:14px">Lancer un jeu</label><div class="gamepick">'+ONLINE.map(function(g){
        var n=net.players.length,ok=n>=g.min&&(!g.max||n<=g.max);
        return '<button type="button" data-launch="'+g.id+'"'+(ok?'':' disabled')+'>'+esc(g.name)+'<small>'+esc(g.desc)+' · '+g.min+(g.max?' à '+g.max:'+')+' joueurs</small></button>';
      }).join('')+'</div>';
    }else h+='<p class="wait">En attente de l\'hôte</p>';
    h+='<p style="margin:18px 0 0"><button type="button" class="red" id="room-leave">Quitter le salon</button></p></div>';
    box.innerHTML=h;
    var cp=$('room-copy');if(cp)cp.onclick=function(){var i=$('room-link');i.select();try{navigator.clipboard.writeText(i.value);cp.textContent='Copié !'}catch(e){document.execCommand('copy');cp.textContent='Copié !'}};
    $('room-leave').onclick=function(){net.leave();render()};
    box.querySelectorAll('[data-launch]').forEach(function(b){b.onclick=function(){net.all({t:'launch',game:b.dataset.launch});}});
  }

  function setup(){
    box.innerHTML='<div class="panel narrow"><label class="lbl" for="room-name">Ton pseudo</label><input id="room-name" maxlength="14" placeholder="Pseudo" value="'+esc(PP.myName())+'">'+
      '<p class="err" id="room-err"></p><div class="row" style="margin-top:16px"><button type="button" id="room-create">Créer le salon</button><button type="button" class="ghost" data-go="join">J\'ai un code</button></div>'+
      '<p class="muted" style="margin-top:14px">Le salon marche entre téléphones et PC, même sur des réseaux différents. L\'hôte doit rester sur la page.</p></div>';
    $('room-create').onclick=function(){
      var n=$('room-name').value.trim()||'Hôte';PP.setName(n);
      $('room-create').disabled=true;$('room-err').textContent='';
      net.host(n,function(err,code){
        if(err){$('room-err').textContent=err;$('room-create').disabled=false;return}
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
