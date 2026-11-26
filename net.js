/* Pixel Pause — salons en ligne, pair à pair avec PeerJS.
   L'hôte crée un Peer dont l'identifiant contient un code à 3 chiffres.
   Les invités se connectent à cet identifiant. L'hôte relaie tout. */
PP.net=(function(){
  'use strict';
  var PREFIX='pixelpause-v2-';
  /* v25 : serveurs STUN/TURN en plus de ceux de PeerJS. Sans TURN, deux joueurs derrière des box/4G « strictes »
     ne peuvent pas se connecter (c'est ce qui empêchait certains potes de rejoindre). TURN en TCP 443 passe presque partout. */
  var ICE=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun.cloudflare.com:3478']},
    {urls:['turn:eu-0.turn.peerjs.com:3478','turn:us-0.turn.peerjs.com:3478'],username:'peerjs',credential:'peerjsp'},
    {urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}];
  function opts(){var c={iceServers:ICE,sdpSemantics:'unified-plan'};if(window.PP_RELAY_ONLY)c.iceTransportPolicy='relay';return {debug:0,config:c}}
  var peer=null,conns={},hostConn=null,isHost=false,code=null,me={id:null,name:''},players=[],handlers=[],statusCb=null,seq=0;

  function emit(msg,from){handlers.forEach(function(h){try{h(msg,from)}catch(e){console.error(e)}})}
  function on(fn){handlers.push(fn);return function(){handlers=handlers.filter(function(h){return h!==fn})}}
  function status(s){if(statusCb)statusCb(s)}
  function ready(){return !!window.Peer}

  function newId(){return Math.random().toString(36).slice(2,10)}

  /* ---- Hôte ---- */
  function host(name,cb,want){
    if(!ready())return cb('PeerJS ne s\'est pas chargé. Vérifie ta connexion Internet.');
    if(want!=='pre')leave();
    var tries=0;
    (function attempt(){
      var c=(want&&want!=='pre'?want:null)||String(Math.floor(100+Math.random()*900));
      var p=new Peer(PREFIX+c,opts());
      var done=false;
      p.on('open',function(){
        done=true;if(want==='pre'){cb(null,c,p);return}adopt(p,c,name);cb(null,c);
      });
      p.on('error',function(e){
        if(done)return;
        try{p.destroy()}catch(x){}
        if(e.type==='unavailable-id'&&tries++<(want?12:6))return want?setTimeout(attempt,900):attempt();
        cb(e.type==='browser-incompatible'?'Ce navigateur ne gère pas le pair à pair.':'Impossible de créer le salon ('+e.type+'). Réessaie dans quelques secondes.');
      });
    })();
  }
  var banned={},myAv=null,gate=null;
  function myUid(){return PP.cloud&&PP.cloud.user&&PP.cloud.verified?PP.cloud.user.uid:null}
  /* exclure un joueur : il est prévenu, déconnecté, et ne peut plus revenir avec le même pseudo */
  function kick(id){if(!isHost||id==='host')return;var p=players.filter(function(q){return q.id===id})[0];if(!p)return;banned[p.name.toLowerCase()]=1;try{conns[id]&&conns[id].send({t:'kicked'})}catch(e){}setTimeout(function(){try{conns[id]&&conns[id].close()}catch(e){}},250)}
  function adopt(p,c,name){
    banned={};peer=p;isHost=true;code=c;me={id:'host',name:name};players=[{id:'host',name:name,av:myAv,uid:myUid()}];conns={};hostConn=null;
    p.on('connection',function(conn){setupGuest(conn)});
    p.on('disconnected',function(){status('Connexion au service perdue, tentative de reconnexion');try{p.reconnect()}catch(e){}});
    p.on('error',function(e){status('Erreur réseau : '+e.type)});
  }
  function setupGuest(conn){
    conn.on('open',function(){
      conns[conn.peer]=conn;
      conn.on('data',function(d){
        if(!d||typeof d!=='object')return;
        if(d.t==='join'){
          var nm=String(d.name||'').slice(0,14)||'Joueur',ds=typeof d.sid==='string'?d.sid.slice(0,40):null,du=typeof d.uid==='string'?d.uid.slice(0,40):null;
          if(players.some(function(p){return p.id===conn.peer}))return;
          /* v25 : même navigateur (ou même compte) déjà dans le salon → on remplace l'ancienne connexion au lieu d'ajouter un doublon */
          players.filter(function(p){return p.id!=='host'&&((ds&&p.sid===ds)||(du&&p.uid===du))}).forEach(function(old){players=players.filter(function(q){return q!==old});var oc=conns[old.id];delete conns[old.id];try{oc&&oc.close()}catch(e){}emit({t:'left',id:old.id},'host')});
          /* deux joueurs différents avec le même pseudo : le second devient « Pseudo 2 » */
          var base=nm,k=2;while(players.some(function(p){return p.name.toLowerCase()===nm.toLowerCase()}))nm=base.slice(0,12)+' '+(k++);
          if(banned[nm.toLowerCase()]){try{conn.send({t:'kicked',ban:1})}catch(e){}setTimeout(function(){try{conn.close()}catch(e){}},300);return}
          var gw=gate?gate(d):true;if(gw!==true){try{conn.send({t:'kicked',why:gw||'friends'})}catch(e){}setTimeout(function(){try{conn.close()}catch(e){}},300);return}
          players.push({id:conn.peer,name:nm,av:d.av||null,uid:du,sid:ds});
          conn.send({t:'hello',id:conn.peer,players:players,code:code});
          broadcast({t:'players',players:players});
          emit({t:'players',players:players},'host');
          return;
        }
        if(d.t==='rel'){broadcast({t:'rel',from:conn.peer,d:d.d},conn.peer);emit({t:'rel',from:conn.peer,d:d.d},conn.peer);return}
        emit(d,conn.peer);
      });
      var bye=function(){
        delete conns[conn.peer];
        var was=players.length;players=players.filter(function(p){return p.id!==conn.peer});
        if(was!==players.length){broadcast({t:'players',players:players});emit({t:'players',players:players},'host');emit({t:'left',id:conn.peer},'host')}
      };
      conn.on('close',bye);conn.on('error',bye);
    });
  }
  function broadcast(msg,except){
    if(!isHost)return;
    Object.keys(conns).forEach(function(k){if(k!==except)try{conns[k].send(msg)}catch(e){}});
  }
  /* Envoi à tous, soi-même compris (pratique pour les jeux : l'hôte se traite comme un joueur) */
  function all(msg){broadcast(msg);emit(msg,'host')}
  function to(id,msg){if(id==='host')emit(msg,'host');else if(conns[id])try{conns[id].send(msg)}catch(e){}}

  /* ---- Invité ---- */
  /* v25 : si la connexion échoue pour une raison réseau, on retente une fois tout seul avant d'afficher l'erreur */
  /* v25 : un seul « rejoindre » à la fois : cliquer 10 fois ne crée plus 10 joueurs dans le salon */
  var joining=null,pendingP=null;
  function join(c,name,cb){if(joining===c)return;joining=c;var fin=function(err,kind){joining=null;cb(err,kind)};
    join1(c,name,function(err,kind){if(err&&(kind==='slow'||kind==='net')){status('Nouvelle tentative de connexion…');join1(c,name,fin);return}fin(err,kind)})}
  function sid(){try{var s=localStorage.getItem('pp-sid');if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('pp-sid',s)}return s}catch(e){return null}}
  function join1(c,name,cb){
    if(!ready())return cb('PeerJS ne s\'est pas chargé. Vérifie ta connexion Internet.');
    leave(migrating);
    if(pendingP){try{pendingP.destroy()}catch(e){}}
    var p=new Peer(undefined,opts()),done=false,timer,gone=false;pendingP=p;
    p.on('open',function(){
      var conn=p.connect(PREFIX+c,{reliable:true});
      timer=setTimeout(function(){if(!done){done=true;try{p.destroy()}catch(e){};cb('Connexion au salon '+c+' trop longue. Réessaie ; si ça recommence, demande à l\'hôte de recharger sa page et de recréer le salon.','slow')}},16000);
      conn.on('open',function(){
        conn.send({t:'join',name:name,av:myAv,uid:myUid(),sid:sid()});
      });
      conn.on('data',function(d){
        if(!d||typeof d!=='object')return;
        if(d.t==='hello'&&!done){
          done=true;clearTimeout(timer);if(pendingP===p)pendingP=null;peer=p;hostConn=conn;isHost=false;code=d.code;me={id:d.id,name:name};players=d.players;
          cb(null,code);return;
        }
        if(d.t==='players')players=d.players;
        if(d.t==='kicked'){if(!done){done=true;clearTimeout(timer);try{p.destroy()}catch(e){}cb(d.why==='friends'?'Ce salon est réservé aux amis du chef.':d.why==='acc'?'Ce salon est réservé aux joueurs avec un compte. Connecte-toi pour entrer.':'Le chef t\'a exclu de ce salon.');return}gone=true;emit({t:'kicked',ban:d.ban},'host');leave();return}
        if(d.t==='mkhost'){host(me.name,function(err,nc,np){if(err){try{hostConn.send({t:'newhost',err:1})}catch(e){}return}preP=np;try{hostConn.send({t:'newhost',code:nc})}catch(e){}},'pre');return}
        if(d.t==='migrate'){migrating=true;var nm=me.name,mine=d.to===me.id;emit({t:'migrating',chef:d.name,mine:mine},'host');
          setTimeout(function(){if(mine&&preP){var np=preP;preP=null;leave(true);adopt(np,d.code,nm);migrating=false;emit({t:'migrated',chef:true},'host')}else{leave(true);rejoin(d.code,nm,0)}},mine?200:1200);return}
        emit(d,'host');
      });
      var bye=function(){if(migrating||gone||peer!==p)return;if(done){status('Le salon a été fermé par l\'hôte.');emit({t:'closed'},'host');leave()}};
      conn.on('close',bye);
      conn.on('error',function(){if(!done){done=true;clearTimeout(timer);cb('Connexion impossible au salon '+c+'.','net')}else bye()});
    });
    p.on('error',function(e){if(!done){done=true;clearTimeout(timer);cb(e.type==='peer-unavailable'?'Aucun salon avec le code '+c+'.':'Erreur réseau : '+e.type,e.type==='peer-unavailable'?'none':'net')}});
  }
  /* Invité -> hôte */
  function send(msg){if(isHost)emit(msg,'host');else if(hostConn)try{hostConn.send(msg)}catch(e){}}

  /* Relais : un message de n'importe qui, renvoyé à tous les autres (positions, scores…) */
  function relay(d){if(isHost)broadcast({t:'rel',from:'host',d:d});else if(hostConn)try{hostConn.send({t:'rel',d:d})}catch(e){}}
  function slot(id){for(var i=0;i<players.length;i++)if(players[i].id===id)return i;return -1}
  function leave(quiet){
    if(peer){try{peer.destroy()}catch(e){}}
    peer=null;conns={};hostConn=null;isHost=false;code=null;players=[];me={id:null,name:''};
    if(!quiet)emit({t:'players',players:[]},'host');
  }
  function inRoom(){return !!code}
  /* changement de chef : l'ancien chef donne le salon (même code) à un autre joueur, les autres se reconnectent tout seuls */
  var migrating=false;
  function rejoin(cc,nm,n){join(cc,nm,function(err){if(!err){migrating=false;emit({t:'migrated'},'host');return}if(n<6)setTimeout(function(){rejoin(cc,nm,n+1)},1500);else{migrating=false;emit({t:'closed'},'host')}})}
  var preP=null,hand=null;
  function handover(id,thenLeave){if(!isHost||hand)return false;var p=players.filter(function(q){return q.id===id})[0];if(!p)return false;hand={id:id,name:p.name,leave:thenLeave};to(id,{t:'mkhost'});
    setTimeout(function(){if(hand&&hand.id===id){hand=null;emit({t:'handfail'},'host')}},12000);return true}
  on(function(m,from){if(m.t!=='newhost'||!isHost||!hand||from!==hand.id)return;var h=hand;hand=null;if(m.err){emit({t:'handfail'},'host');return}
    migrating=true;broadcast({t:'migrate',to:h.id,name:h.name,code:m.code});emit({t:'migrating',chef:h.name,mine:false,me:true},'host');var nm=me.name;
    setTimeout(function(){leave(true);if(h.leave){migrating=false;emit({t:'players',players:[]},'host')}else rejoin(m.code,nm,0)},400)});

  return {relay:relay,slot:slot,host:host,join:join,leave:leave,send:send,all:all,to:to,broadcast:broadcast,on:on,
    get code(){return code},get isHost(){return isHost},get me(){return me},get players(){return players},
    inRoom:inRoom,ready:ready,setGate:function(f){gate=f},alive:function(){return !!(peer&&!peer.disconnected&&!peer.destroyed)},handover:handover,kick:kick,setAvatar:function(a){myAv=a;players.forEach(function(p){if(p.id===me.id)p.av=a})},get migrating(){return migrating},onStatus:function(f){statusCb=f},
    inviteLink:function(){return location.origin+location.pathname+'?salon='+code}};
})();
