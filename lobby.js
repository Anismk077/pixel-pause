/* Pixel Pause — annuaire des salons ouverts, sans serveur.
   Le premier visiteur qui obtient l'identifiant « lobby » devient l'annuaire.
   Les hôtes y inscrivent leur salon toutes les 8 s, les visiteurs demandent la liste.
   Si l'annuaire part, un autre visiteur reprend le rôle automatiquement. */
PP.lobby=(function(){
  'use strict';
  var ID='pixelpause-v2-lobby',peer=null,isReg=false,rooms={},conn=null,clients={},waiting=[],listeners=[],retry=0,mine=null;
  function now(){return Date.now()}
  function clean(){var t=now();Object.keys(rooms).forEach(function(c){if(t-rooms[c].ts>25000)delete rooms[c]})}
  function listArr(){clean();return Object.keys(rooms).map(function(c){return rooms[c]}).sort(function(a,b){return b.ts-a.ts})}
  function notify(){var l=listArr();listeners.forEach(function(f){try{f(l)}catch(e){}})}

  function start(){
    if(!window.Peer||peer)return;
    var p=new Peer(ID,{debug:0}),done=false;
    p.on('open',function(){done=true;peer=p;isReg=true;
      p.on('connection',function(c){c.on('open',function(){clients[c.peer]=c;
        c.on('data',function(d){if(!d)return;
          if(d.t==='reg'&&d.room){d.room.ts=now();rooms[d.room.code]=d.room;notify()}
          if(d.t==='unreg'){delete rooms[d.code];notify()}
          if(d.t==='list')c.send({t:'rooms',rooms:listArr()});
        });
        c.on('close',function(){delete clients[c.peer]});
      })});
      if(mine)register(mine);notify();
    });
    p.on('error',function(e){
      if(done)return;try{p.destroy()}catch(x){}
      if(e.type==='unavailable-id')asClient();else setTimeout(start,4000);
    });
  }
  function asClient(){
    var p=new Peer(undefined,{debug:0});
    p.on('open',function(){peer=p;isReg=false;
      var c=p.connect(ID,{reliable:true});
      c.on('open',function(){conn=c;retry=0;if(mine)c.send({t:'reg',room:mine});c.send({t:'list'})});
      c.on('data',function(d){if(d&&d.t==='rooms'){rooms={};d.rooms.forEach(function(r){rooms[r.code]=r});notify()}});
      var lost=function(){conn=null;try{p.destroy()}catch(x){}peer=null;setTimeout(start,500+Math.random()*1500)};
      c.on('close',lost);c.on('error',lost);
    });
    p.on('error',function(e){if(e.type==='peer-unavailable'){try{p.destroy()}catch(x){}peer=null;setTimeout(start,800+Math.random()*1500)}});
  }
  function register(room){
    mine=room;room.ts=now();
    if(isReg){rooms[room.code]=room;notify()}else if(conn)try{conn.send({t:'reg',room:room})}catch(e){}
  }
  function unregister(code){
    mine=null;
    if(isReg){delete rooms[code];notify()}else if(conn)try{conn.send({t:'unreg',code:code})}catch(e){}
  }
  function refresh(){if(isReg)notify();else if(conn)try{conn.send({t:'list'})}catch(e){}}
  function on(f){listeners.push(f);return function(){listeners=listeners.filter(function(x){return x!==f})}}
  setTimeout(start,300);
  return {register:register,unregister:unregister,refresh:refresh,on:on,list:listArr};
})();
