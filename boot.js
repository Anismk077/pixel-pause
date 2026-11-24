/* Pixel Pause — démarrage : lien d'invitation et ancre */
(function(){
  'use strict';
  var m=/[?&]salon=(\d{3})/.exec(location.search);
  if(m){PP.go('join');return}
  var h=location.hash.slice(1);
  if(h&&PP.games[h])PP.go(h);
})();
