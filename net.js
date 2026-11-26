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
    relayHost(c);remember();
  }
  /* v31 : le salon survit à une actualisation de la page. On note le salon dans l'onglet (sessionStorage) :
     au rechargement, le chef rouvre le même code et les invités se reconnectent tout seuls. */
  var RK='pp-room';
  function remember(){try{sessionStorage.setItem(RK,JSON.stringify({c:code,h:isHost?1:0,n:me.name,t:Date.now()}))}catch(e){}}
  function forget(){try{sessionStorage.removeItem(RK)}catch(e){}}
  /* v37 : « quitter » annule toute reconnexion automatique en cours (avant, on pouvait être remis dans le salon qu'on venait de quitter) */
  var quitGen=0;
  function quit(q){quitGen++;forget();joining=null;if(pendingP){try{pendingP.destroy()}catch(e){}pendingP=null}leave(q)}
  function rejoinLost(cc,nm){var n=0,g=quitGen;status('Reconnexion au salon '+cc+'…');
    (function tryIt(){if(code||g!==quitGen)return;join(cc,nm,function(err){if(g!==quitGen){if(!err)quit();return}if(!err){emit({t:'players',players:players},'host');if(PP.toast)PP.toast('Reconnecté au salon '+cc,'ok');return}if(++n<3)setTimeout(tryIt,2500);else{forget();emit({t:'closed'},'host')}})})()}
  function resume(){var s;try{s=JSON.parse(sessionStorage.getItem(RK))}catch(e){}if(!s||!s.c||Date.now()-s.t>30*60000||code||!ready())return;
    if(s.h)host(s.n,function(err,c){if(err){forget();return}emit({t:'players',players:players},'host');if(PP.toast)PP.toast('Salon '+c+' rouvert : tes potes reviennent tout seuls','ok')},s.c);
    else rejoinLost(s.c,s.n)}
  setTimeout(resume,1200);
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
  /* v27 : d'abord la connexion directe (rapide) ; si elle échoue (box, 4G ou wifi qui bloquent), on passe
     automatiquement par un serveur relais (MQTT sur WebSocket, port 443-like) qui marche sur tous les réseaux. */
  function join(c,name,cb){if(joining===c)return;joining=c;var g0=quitGen,fin=function(err,kind){joining=null;if(g0!==quitGen){if(!err)quit(true);return}cb(err,kind)};
    if(window.PP_FORCE_RELAY&&window.mqtt){leave(migrating);joinRelay(c,name,fin);return}
    join1(c,name,function(err,kind){if(!err||kind===undefined||!window.mqtt){fin(err,kind);return}
      status('Connexion par le relais…');
      joinRelay(c,name,function(e2,k2){if(!e2){fin(null,k2);return}if(k2===undefined){fin(e2,k2);return}
        fin(kind==='none'?'Aucun salon avec le code '+c+'. Vérifie le code, et que l\'hôte a bien sa page ouverte.':'Impossible de rejoindre le salon '+c+'. Demande à l\'hôte de recharger sa page et de recréer le salon, puis réessaie.',kind==='none'?'none':'slow')})})}
  function sid(){try{var s=localStorage.getItem('pp-sid');if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('pp-sid',s)}return s}catch(e){return null}}
  /* tout ce que l'invité reçoit de l'hôte (même code pour la connexion directe et le relais) */
  function wire(conn,p,c,name,S,cb){
    conn.on('data',function(d){
      if(!d||typeof d!=='object')return;
      if(d.t==='hello'&&!S.done){
        S.done=true;clearTimeout(S.timer);if(pendingP===p)pendingP=null;peer=p;hostConn=conn;isHost=false;code=d.code;me={id:d.id,name:name};players=d.players;remember();
        cb(null,code);return;
      }
      if(d.t==='players')players=d.players;
      if(d.t==='kicked'){forget();if(!S.done){S.done=true;clearTimeout(S.timer);try{p.destroy()}catch(e){}cb(d.why==='friends'?'Ce salon est réservé aux amis du chef.':d.why==='acc'?'Ce salon est réservé aux joueurs avec un compte. Connecte-toi pour entrer.':'Le chef t\'a exclu de ce salon.');return}S.gone=true;emit({t:'kicked',ban:d.ban},'host');leave();return}
      if(d.t==='mkhost'){host(me.name,function(err,nc,np){if(err){try{hostConn.send({t:'newhost',err:1})}catch(e){}return}preP=np;try{hostConn.send({t:'newhost',code:nc})}catch(e){}},'pre');return}
      if(d.t==='migrate'){migrating=true;var nm=me.name,mine=d.to===me.id;emit({t:'migrating',chef:d.name,mine:mine},'host');
        setTimeout(function(){if(mine&&preP){var np=preP;preP=null;leave(true);adopt(np,d.code,nm);migrating=false;emit({t:'migrated',chef:true},'host')}else{leave(true);rejoin(d.code,nm,0)}},mine?200:1200);return}
      emit(d,'host');
    });
    /* l'hôte a disparu (il a peut-être juste actualisé sa page) : on essaie de revenir avant d'annoncer la fermeture */
    var bye=function(){if(migrating||S.gone||peer!==p)return;if(S.done){var cc=code,nm=me.name;leave(true);rejoinLost(cc,nm)}};
    conn.on('close',bye);
    conn.on('error',function(){if(!S.done){S.done=true;clearTimeout(S.timer);cb('Connexion impossible au salon '+c+'.','net')}else bye()});
  }
  function join1(c,name,cb){
    if(!ready())return cb('PeerJS ne s\'est pas chargé. Vérifie ta connexion Internet.','net');
    leave(migrating);
    if(pendingP){try{pendingP.destroy()}catch(e){}}
    var p=new Peer(undefined,opts()),S={done:false,timer:0,gone:false};pendingP=p;
    S.timer=setTimeout(function(){if(!S.done){S.done=true;try{p.destroy()}catch(e){};cb('Connexion directe trop longue.','slow')}},9000);
    p.on('open',function(){
      var conn=p.connect(PREFIX+c,{reliable:true});
      conn.on('open',function(){conn.send({t:'join',name:name,av:myAv,uid:myUid(),sid:sid()})});
      wire(conn,p,c,name,S,cb);
    });
    p.on('error',function(e){if(!S.done){S.done=true;clearTimeout(S.timer);try{p.destroy()}catch(x){}cb(e.type==='peer-unavailable'?'Aucun salon avec le code '+c+'.':'Erreur réseau : '+e.type,e.type==='peer-unavailable'?'none':'net')}});
  }
  /* ---- Relais de secours (MQTT public, sur WebSocket sécurisé) ---- */
  var BROKERS=['wss://broker.hivemq.com:8884/mqtt','wss://broker.emqx.io:8084/mqtt'],TOP='pixelpause-anismk/v3/';
  function mq(url,cb){var done=false,cl;try{cl=mqtt.connect(url,{connectTimeout:5000,reconnectPeriod:2000,keepalive:20,clean:true,clientId:'pp'+newId()+newId()})}catch(e){cb(null);return}
    var t=setTimeout(function(){if(!done){done=true;try{cl.end(true)}catch(e){}cb(null)}},6500);
    cl.on('connect',function(){if(done)return;done=true;clearTimeout(t);cb(cl)});cl.on('error',function(){})}
  function fakeConn(id,sendFn,closeFn){var H={},o={peer:id,open:true,
    on:function(e,f){(H[e]=H[e]||[]).push(f)},fire:function(e,a){(H[e]||[]).slice().forEach(function(f){try{f(a)}catch(x){console.error(x)}})},
    send:function(m){if(o.open)try{sendFn(m)}catch(e){}},close:function(){if(!o.open)return;o.open=false;try{closeFn&&closeFn()}catch(e){}o.fire('close')}};return o}
  function joinRelay(c,name,cb){var i=0,myId='r'+newId();
    (function next(){if(i>=BROKERS.length){cb('relais indisponible','none');return}var url=BROKERS[i++];
      mq(url,function(cl){if(!cl){next();return}
        var hostT=TOP+c+'/h',myT=TOP+c+'/g/'+myId,S={done:false,timer:0,gone:false},last=Date.now(),pi=0;
        var conn=fakeConn(myId,function(m){cl.publish(hostT,JSON.stringify({f:myId,k:'d',d:m}))},function(){cl.publish(hostT,JSON.stringify({f:myId,k:'c'}))});
        var p={relay:true,disconnected:false,destroyed:false,destroy:function(){if(p.destroyed)return;p.destroyed=true;clearInterval(pi);try{if(conn.open)cl.publish(hostT,JSON.stringify({f:myId,k:'c'}))}catch(e){}conn.open=false;setTimeout(function(){try{cl.end(true)}catch(e){}},150)}};
        if(pendingP){try{pendingP.destroy()}catch(e){}}pendingP=p;
        cl.on('offline',function(){p.disconnected=true});cl.on('connect',function(){p.disconnected=false});
        cl.on('message',function(t,buf){var m;try{m=JSON.parse(buf.toString())}catch(e){return}if(!m)return;last=Date.now();if(m.k==='d')conn.fire('data',m.d);else if(m.k==='c'&&conn.open){conn.open=false;conn.fire('close')}});
        pi=setInterval(function(){if(p.destroyed)return;try{cl.publish(hostT,JSON.stringify({f:myId,k:'p'}))}catch(e){}if(S.done&&conn.open&&Date.now()-last>16000){conn.open=false;conn.fire('close')}},4000);
        wire(conn,p,c,name,S,cb);
        S.timer=setTimeout(function(){if(!S.done){S.done=true;p.destroy();next()}},7000);
        cl.subscribe(myT,{qos:0},function(){cl.publish(hostT,JSON.stringify({f:myId,k:'o'}));conn.send({t:'join',name:name,av:myAv,uid:myUid(),sid:sid()})});
      })})()}
  /* l'hôte écoute aussi sur le relais, sur chaque serveur : un invité qui passe par là devient une connexion comme une autre */
  var relayH=[];
  function relayHost(c){stopRelayHost();if(!window.mqtt)return;
    BROKERS.forEach(function(url){mq(url,function(cl){if(!cl)return;if(!isHost||code!==c){try{cl.end(true)}catch(e){}return}
      var H={cl:cl,g:{}};relayH.push(H);cl.subscribe(TOP+c+'/h',{qos:0});
      cl.on('message',function(t,buf){var m;try{m=JSON.parse(buf.toString())}catch(e){return}if(!m||typeof m.f!=='string')return;var id=m.f.slice(0,24),G=H.g[id],gt=TOP+c+'/g/'+id;
        if(m.k==='o'){if(G&&G.conn.open)return;var conn=fakeConn(id,function(msg){cl.publish(gt,JSON.stringify({k:'d',d:msg}))},function(){cl.publish(gt,JSON.stringify({k:'c'}));delete H.g[id]});
          G=H.g[id]={conn:conn,last:Date.now()};setupGuest(conn);conn.fire('open');return}
        if(!G)return;G.last=Date.now();
        if(m.k==='d')G.conn.fire('data',m.d);else if(m.k==='c'){delete H.g[id];if(G.conn.open){G.conn.open=false;G.conn.fire('close')}}});
      H.iv=setInterval(function(){Object.keys(H.g).forEach(function(id){var G=H.g[id];if(Date.now()-G.last>16000){delete H.g[id];if(G.conn.open){G.conn.open=false;G.conn.fire('close')}return}try{cl.publish(TOP+c+'/g/'+id,JSON.stringify({k:'p'}))}catch(e){}})},4000);
    })})}
  function stopRelayHost(){relayH.forEach(function(H){clearInterval(H.iv);Object.keys(H.g).forEach(function(id){try{H.g[id].conn.close()}catch(e){}});try{H.cl.end(true)}catch(e){}});relayH=[]}
  /* Invité -> hôte */
  function send(msg){if(isHost)emit(msg,'host');else if(hostConn)try{hostConn.send(msg)}catch(e){}}

  /* Relais : un message de n'importe qui, renvoyé à tous les autres (positions, scores…) */
  function relay(d){if(isHost)broadcast({t:'rel',from:'host',d:d});else if(hostConn)try{hostConn.send({t:'rel',d:d})}catch(e){}}
  function slot(id){for(var i=0;i<players.length;i++)if(players[i].id===id)return i;return -1}
  function leave(quiet){
    if(peer){try{peer.destroy()}catch(e){}}
    if(isHost)stopRelayHost();
    peer=null;conns={};hostConn=null;isHost=false;code=null;players=[];me={id:null,name:''};
    if(!quiet)emit({t:'players',players:[]},'host');
  }
  function inRoom(){return !!code}
  /* changement de chef : l'ancien chef donne le salon (même code) à un autre joueur, les autres se reconnectent tout seuls */
  var migrating=false;
  function rejoin(cc,nm,n,g){if(g===undefined)g=quitGen;if(g!==quitGen){migrating=false;return}join(cc,nm,function(err){if(!err){migrating=false;emit({t:'migrated'},'host');return}if(n<6)setTimeout(function(){rejoin(cc,nm,n+1,g)},1500);else{migrating=false;emit({t:'closed'},'host')}})}
  var preP=null,hand=null;
  function handover(id,thenLeave){if(!isHost||hand)return false;var p=players.filter(function(q){return q.id===id})[0];if(!p)return false;hand={id:id,name:p.name,leave:thenLeave};to(id,{t:'mkhost'});
    setTimeout(function(){if(hand&&hand.id===id){hand=null;emit({t:'handfail'},'host')}},12000);return true}
  on(function(m,from){if(m.t!=='newhost'||!isHost||!hand||from!==hand.id)return;var h=hand;hand=null;if(m.err){emit({t:'handfail'},'host');return}
    migrating=true;broadcast({t:'migrate',to:h.id,name:h.name,code:m.code});emit({t:'migrating',chef:h.name,mine:false,me:true},'host');var nm=me.name;
    setTimeout(function(){leave(true);if(h.leave){forget();migrating=false;emit({t:'players',players:[]},'host')}else rejoin(m.code,nm,0)},400)});

  return {relay:relay,slot:slot,host:host,join:join,leave:quit,send:send,all:all,to:to,broadcast:broadcast,on:on,
    get code(){return code},get isHost(){return isHost},get me(){return me},get players(){return players},
    inRoom:inRoom,ready:ready,setGate:function(f){gate=f},alive:function(){return !!(peer&&!peer.disconnected&&!peer.destroyed)},handover:handover,kick:kick,setAvatar:function(a){myAv=a;players.forEach(function(p){if(p.id===me.id)p.av=a})},get migrating(){return migrating},onStatus:function(f){statusCb=f},
    inviteLink:function(){return location.origin+location.pathname+'?salon='+code}};
})();
