/* Pixel Pause — aides pour jouer en salon (chacun sur son appareil) */
PP.mp=(function(){
  'use strict';
  var net=PP.net;
  function on(){return net.inRoom()}
  function isHost(){return net.isHost}
  /* Hôte : stocke les touches envoyées par chaque invité, rangées par place dans le salon */
  function hostInputs(game,store){
    net.on(function(m,from){if(m.t==='in'&&m.g===game&&net.isHost){var s=net.slot(from);if(s>=0)store[s]=m.k}});
  }
  /* Invité : envoie ses touches à l'hôte dès qu'elles changent (ZQSD ou flèches, Espace ou Entrée) */
  function guestSender(game,keys){
    var last='';
    setInterval(function(){
      if(!on()||net.isHost||PP.cur()!==game)return;
      var k={U:!!(keys['1U']||keys['2U']),D:!!(keys['1D']||keys['2D']),L:!!(keys['1L']||keys['2L']),R:!!(keys['1R']||keys['2R']),X:!!(keys['1X']||keys['2X'])};
      var s=JSON.stringify(k);if(s!==last){last=s;net.send({t:'in',g:game,k:k})}
    },33);
  }
  /* Touches de l'hôte (place 0) en ligne : ZQSD ou flèches */
  function localInput(keys){return {U:keys['1U']||keys['2U'],D:keys['1D']||keys['2D'],L:keys['1L']||keys['2L'],R:keys['1R']||keys['2R'],X:keys['1X']||keys['2X']}}
  /* Écran d'attente commun : l'hôte voit « Lancer », les invités attendent */
  function lobby(prefix,title){
    var modes=document.getElementById(prefix+'-modes');if(modes)modes.hidden=on();
    if(!on())return false;
    var st=document.getElementById(prefix+'-start'),msg=document.getElementById(prefix+'-msg');
    document.getElementById(prefix+'-title').textContent=title+' · salon '+net.code;
    if(net.isHost){st.hidden=false;st.textContent='Lancer pour tout le salon';msg.textContent=net.players.length+' joueur'+(net.players.length>1?'s':'')+' : '+net.players.map(function(p){return p.name}).join(', ')+'. Chacun joue sur son appareil avec ZQSD ou les flèches.'}
    else{st.hidden=true;msg.textContent='L\'hôte va lancer la partie. Tu joues avec ZQSD ou les flèches (ou les boutons sur téléphone).'}
    document.getElementById(prefix+'-ov').hidden=false;
    return true;
  }
  return {on:on,isHost:isHost,hostInputs:hostInputs,guestSender:guestSender,localInput:localInput,lobby:lobby};
})();
