/* Pixel Pause — salons en ligne, pair à pair avec PeerJS.
   L'hôte crée un Peer dont l'identifiant contient un code à 3 chiffres.
   Les invités se connectent à cet identifiant. L'hôte relaie tout. */
PP.net=(function(){
  'use strict';
  var PREFIX='pixelpause-v2-';
  var peer=null,conns={},hostConn=null,isHost=false,code=null,me={id:null,name:''},players=[],handlers=[],statusCb=null,seq=0;

  function emit(msg,from){handlers.forEach(function(h){try{h(msg,from)}catch(e){console.error(e)}})}
  function on(fn){handlers.push(fn);return function(){handlers=handlers.filter(function(h){return h!==fn})}}
  function status(s){if(statusCb)statusCb(s)}
  function ready(){return !!window.Peer}

  function newId(){return Math.random().toString(36).slice(2,10)}

  /* ---- Hôte ---- */
  function host(name,cb){
    if(!ready())return cb('PeerJS ne s\'est pas chargé. Vérifie ta connexion Internet.');
    leave();
    var tries=0;
    (function attempt(){
      var c=String(Math.floor(100+Math.random()*900));
      var p=new Peer(PREFIX+c,{debug:0});
      var done=false;
      p.on('open',function(){
        done=true;peer=p;isHost=true;code=c;me={id:'host',name:name};players=[{id:'host',name:name}];
        p.on('connection',function(conn){setupGuest(conn)});
        p.on('disconnected',function(){status('Connexion au service perdue, tentative de reconnexion');try{p.reconnect()}catch(e){}});
        p.on('error',function(e){status('Erreur réseau : '+e.type)});
        cb(null,c);
      });
      p.on('error',function(e){
        if(done)return;
        try{p.destroy()}catch(x){}
        if(e.type==='unavailable-id'&&tries++<6)return attempt();
        cb(e.type==='browser-incompatible'?'Ce navigateur ne gère pas le pair à pair.':'Impossible de créer le salon ('+e.type+'). Réessaie dans quelques secondes.');
      });
    })();
  }
  function setupGuest(conn){
    conn.on('open',function(){
      conns[conn.peer]=conn;
      conn.on('data',function(d){
        if(!d||typeof d!=='object')return;
        if(d.t==='join'){
          var nm=String(d.name||'').slice(0,14)||'Joueur';
          if(players.some(function(p){return p.id===conn.peer}))return;
          players.push({id:conn.peer,name:nm});
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
  function join(c,name,cb){
    if(!ready())return cb('PeerJS ne s\'est pas chargé. Vérifie ta connexion Internet.');
    leave();
    var p=new Peer(undefined,{debug:0}),done=false,timer;
    p.on('open',function(){
      var conn=p.connect(PREFIX+c,{reliable:true});
      timer=setTimeout(function(){if(!done){done=true;try{p.destroy()}catch(e){};cb('Aucun salon avec le code '+c+'. Vérifie le code, et que l\'hôte a bien sa page ouverte.')}},8000);
      conn.on('open',function(){
        conn.send({t:'join',name:name});
      });
      conn.on('data',function(d){
        if(!d||typeof d!=='object')return;
        if(d.t==='hello'&&!done){
          done=true;clearTimeout(timer);peer=p;hostConn=conn;isHost=false;code=d.code;me={id:d.id,name:name};players=d.players;
          cb(null,code);return;
        }
        if(d.t==='players')players=d.players;
        emit(d,'host');
      });
      var bye=function(){if(done){status('Le salon a été fermé par l\'hôte.');emit({t:'closed'},'host');leave()}};
      conn.on('close',bye);
      conn.on('error',function(){if(!done){done=true;clearTimeout(timer);cb('Connexion impossible au salon '+c+'.')}else bye()});
    });
    p.on('error',function(e){if(!done){done=true;clearTimeout(timer);cb(e.type==='peer-unavailable'?'Aucun salon avec le code '+c+'.':'Erreur réseau : '+e.type)}});
  }
  /* Invité -> hôte */
  function send(msg){if(isHost)emit(msg,'host');else if(hostConn)try{hostConn.send(msg)}catch(e){}}

  /* Relais : un message de n'importe qui, renvoyé à tous les autres (positions, scores…) */
  function relay(d){if(isHost)broadcast({t:'rel',from:'host',d:d});else if(hostConn)try{hostConn.send({t:'rel',d:d})}catch(e){}}
  function slot(id){for(var i=0;i<players.length;i++)if(players[i].id===id)return i;return -1}
  function leave(){
    if(peer){try{peer.destroy()}catch(e){}}
    peer=null;conns={};hostConn=null;isHost=false;code=null;players=[];me={id:null,name:''};
    emit({t:'players',players:[]},'host');
  }
  function inRoom(){return !!code}

  return {relay:relay,slot:slot,host:host,join:join,leave:leave,send:send,all:all,to:to,broadcast:broadcast,on:on,
    get code(){return code},get isHost(){return isHost},get me(){return me},get players(){return players},
    inRoom:inRoom,ready:ready,onStatus:function(f){statusCb=f},
    inviteLink:function(){return location.origin+location.pathname+'?salon='+code}};
})();
