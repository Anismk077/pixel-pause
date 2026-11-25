/* Pixel Pause — Paramètres (langue, son, souris, graphismes, touches), traduction français / anglais,
   et avis des joueurs (étoiles) qui classent les jeux de l'accueil. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,SET=PP.settings;

  /* ================= Langue ================= */
  var LANG=(function(){try{return localStorage.getItem('pp-lang')||'fr'}catch(e){return 'fr'}})();
  var EN={
    'Jeux':'Games','Salon':'Room','Compte':'Account','Paramètres':'Settings','compte':'account',
    'Neuf petits jeux à lancer dans le navigateur. Seul, sur un même clavier, ou chacun sur son téléphone avec un code.':'Little games to play right in your browser. Solo, on one keyboard, or everyone on their own phone with a code.',
    'Créer un salon →':'Create a room →','J’ai un code':'I have a code','Filtrer :':'Filter:','tout':'all','même PC':'same PC','en ligne':'online','solo':'solo','joueurs':'players','joueur':'player',
    'Zone Morte':'Dead Zone','FPS · zombies, battle royale en ligne':'FPS · zombies, online battle royale','3D · pousse-les dans le vide':'3D · push them off the edge','3D · deux minutes, une balle':'3D · two minutes, one ball',
    'Course · trois tours':'Race · three laps','Mot imposteur':'Impostor Word','Party · qui n’a pas le bon mot ?':'Party · who has the wrong word?','Devine où':'Guess Where','Vue de rue 360° · devine où tu es':'360° street view · guess where you are',
    'Le plus probable':'Most Likely','Party · votes entre potes':'Party · vote with friends','Paquet Snake':'Packet Snake','Arcade · duel ou en ligne':'Arcade · duel or online','Néon Rush':'Neon Rush','Arcade · course sans fin':'Arcade · endless run',
    'Survie':'Survival','3D · île, artisanat, base, jour et nuit':'3D · island, crafting, base, day and night','Quand et où':'When and Where','Photo historique · devine l\'année et le lieu':'Historic photo · guess the year and the place',
    'Dernier Debout':'Last Standing','3D · 3 épreuves éliminatoires, 12 blobs':'3D · 3 knockout rounds, 12 blobs','Quatre en ligne':'Four in a Row','Stratégie · aligne 4 jetons':'Strategy · line up 4 tokens',
    'Duel · palets et rebonds':'Duel · pucks and bounces','Tour Infinie':'Endless Tower','3D · empile au bon moment':'3D · stack at the right time','Réflexes':'Reflexes','Party · le plus rapide gagne':'Party · fastest wins',
    'Casse-Briques Néon':'Neon Breakout','Arcade · niveaux et bonus':'Arcade · levels and power-ups','3D · strikes et spares':'3D · strikes and spares','Mini-golf 3D':'Mini Golf 3D','3D · 6 trous, moulin et bumpers':'3D · 6 holes, windmill and bumpers',
    'Tir à l\'arc 3D':'Archery 3D','3D · vent et distance':'3D · wind and distance','Duel · obus qui rebondissent':'Duel · bouncing shells','Bataille navale':'Battleship','Stratégie · coule la flotte':'Strategy · sink the fleet',
    'Course de frappe':'Typing Race','Clavier · tape plus vite que les autres':'Keyboard · type faster than the others','Party · culture générale chrono':'Party · timed trivia','Cartes · retrouve les paires':'Cards · find the pairs',
    'Démineur':'Minesweeper','Réflexion · évite les mines':'Puzzle · avoid the mines','Pong néon':'Neon Pong','Arcade · duel de raquettes':'Arcade · paddle duel','Avion 3D':'Plane 3D','3D · vole dans les anneaux':'3D · fly through the rings',
    'Labyrinthe 3D':'Maze 3D','3D · trouve la sortie':'3D · find the exit','3D · paniers à 2 et 3 points':'3D · 2 and 3 point shots','Dessine et devine':'Draw and Guess','Party · un dessine, les autres devinent':'Party · one draws, the others guess',
    'Billard':'Pool','Adresse · pleines contre rayées':'Skill · solids against stripes','Fun · gave-le de burgers jusqu\'à la ruine':'Fun · stuff him with burgers until he is broke',
    '← Retour aux jeux':'← Back to games','Pause':'Pause','Plein écran':'Fullscreen','Quitter le plein écran':'Exit fullscreen','Reprendre':'Resume','Quitter le jeu':'Quit game','Échap : reprendre':'Esc: resume','Clique sur Reprendre pour rejouer':'Click Resume to play again','Recommencer':'Restart','OUVRIR':'OPEN','PAS ENCORE DÉBLOQUÉE':'NOT UNLOCKED YET','M : fermer':'M: close','Armes':'Weapons','Équipement':'Gear','Possédée':'Owned','Acheté !':'Bought!','Commune':'Common','Épique':'Epic','Lourde':'Heavy','Légendaire':'Legendary',
    'Réglages':'Settings','Volume':'Volume','Sensibilité souris':'Mouse sensitivity','Champ de vision (3D)':'Field of view (3D)','Qualité (3D)':'Quality (3D)','Inverser la souris (haut/bas)':'Invert mouse (up/down)',
    'Afficher les images par seconde':'Show frames per second','Haute':'High','Basse (plus fluide)':'Low (smoother)','Jouer':'Play','Rejouer':'Play again','Partie en ligne':'Online match',
    'Salon en ligne':'Online room','Rejoindre un salon':'Join a room','Code à 3 chiffres':'3-digit code','Ton pseudo':'Your nickname','Rejoindre':'Join','Annuler':'Cancel',
    'Pause · clique dans l\'image pour reprendre':'Paused · click the picture to resume','Solo':'Solo','Duel':'Duel','En ligne':'Online','Bats ton record':'Beat your record','2 joueurs, même clavier':'2 players, same keyboard',
    '2 à 4 dans le salon':'2 to 4 in the room','← Changer de mode':'← Change mode','7 sortes de zombies, portes à ouvrir, armurerie':'7 kinds of zombies, doors to open, armories',
    'Contre des bots, ou en ligne avec les autres joueurs':'Against bots, or online with other players','Tirage de la carte':'Drawing the map','Choisis la difficulté':'Choose the difficulty',
    'Facile':'Easy','Difficile':'Hard','Cauchemar':'Nightmare','Zombies plus lents et fragiles':'Slower, weaker zombies','L\'expérience prévue':'The intended experience','Plus nombreux, plus costauds':'More of them, tougher','Bonne chance':'Good luck',
    'Entrepôt':'Warehouse','Jouer contre les bots':'Play against bots','Armurerie':'Armory','Armurerie avancée':'Advanced armory','Armurerie lourde':'Heavy armory','acheter':'buy','Fermer · E':'Close · E',
    'Munitions':'Ammo','Remplit les réserves de toutes tes armes':'Refills reserve ammo for all your guns','Gilet léger':'Light vest','+50 d\'armure':'+50 armor','Gilet lourd':'Heavy vest','Armure remplie à 100':'Armor filled to 100',
    'Trousse de soin':'First aid kit','Vie au maximum':'Full health','Mains rapides':'Fast hands','Recharges 40 % plus rapides':'40% faster reloads','remplace l\'arme en main':'replaces the gun in your hands',
    'Dégâts':'Damage','Cadence':'Fire rate','Chargeur':'Magazine','acquis':'owned','Pistolet':'Pistol','Mitraillette':'SMG','Fusil d\'assaut':'Assault rifle','Fusil à pompe':'Shotgun',
    'Mitrailleuse':'Machine gun','Lance-grenades':'Grenade launcher','Pistolet à rayons':'Ray gun','VAGUE':'WAVE','VIE':'HEALTH','ARMURE':'ARMOR','Dévoré':'Eaten','Une brute arrive !':'A brute is coming!',
    'Langue':'Language','Son':'Sound','Souris et vue':'Mouse and view','Graphismes':'Graphics','Touches de Zone Morte':'Dead Zone controls','Clique sur une touche, puis appuie sur la nouvelle.':'Click a key, then press the new one.',
    'Avancer':'Forward','Reculer':'Back','Gauche':'Left','Droite':'Right','Sauter':'Jump','Courir':'Sprint','Glisser':'Slide','Recharger':'Reload','Ouvrir / acheter':'Open / buy','Arme suivante':'Next weapon',
    'Arme précédente':'Previous weapon','Grande carte':'Big map','Remettre par défaut':'Reset to default','Appuie sur une touche…':'Press a key…','Les armes se choisissent aussi avec 1 à 4 et la molette.':'Weapons can also be picked with 1 to 4 and the mouse wheel.',
    'La page se recharge pour changer de langue.':'The page reloads to change language.','Son : on':'Sound: on','Son : off':'Sound: off','Classés par note des joueurs':'Ranked by player rating',
    'Crée un compte pour donner ton avis':'Create an account to rate games','Merci pour ta note !':'Thanks for your rating!','pas encore noté':'not rated yet','Pixel Pause — fait à Arcueil, 2026.':'Pixel Pause — made in Arcueil, 2026.',
    'Une carte au hasard en 9 zones. Tue des zombies pour gagner des pièces, ouvre les portes pour agrandir la carte, et achète armes, gilets et munitions à l\'armurerie (E). Glisse en courant avec C ou Ctrl. Armes : 1 à 4, X ou A pour changer.':'A random map with 9 zones. Kill zombies to earn coins, open doors to grow the map, and buy guns, vests and ammo at the armory (E). Slide while running with C or Ctrl. Weapons: 1 to 4, X or A to switch.',
    'Affichage':'Display','Tes réglages sont gardés dans ce navigateur (et en ligne si tu es connecté).':'Your settings are kept in this browser (and online if you are signed in).'
  };
  var XL=window.PP_LANGS||{};if(LANG!=='fr'&&LANG!=='en'&&!XL[LANG])LANG='fr';var DL=XL[LANG]&&XL[LANG].d||{};
  PP.lang=LANG;
  PP.t=function(s){if(LANG==='fr')return s;return DL[s]||EN[s]||s};
  function trText(n){var v=n.nodeValue,t=v&&v.trim();if(!t)return;var r=PP.t(t);if(r!==t)n.nodeValue=v.replace(t,r)}
  function trTree(root){if(LANG==='fr'||!root)return;if(root.nodeType===3){trText(root);return}
    if(root.nodeType!==1||root.tagName==='SCRIPT'||root.tagName==='STYLE'||root.tagName==='CANVAS')return;
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n;while((n=w.nextNode()))trText(n);
    root.querySelectorAll&&root.querySelectorAll('[placeholder]').forEach(function(i){var p=i.getAttribute('placeholder'),r=PP.t(p);if(r!==p)i.setAttribute('placeholder',r)})}
  if(LANG!=='fr'){document.documentElement.lang=LANG;if(XL[LANG]&&XL[LANG].rtl)document.documentElement.classList.add('pp-rtl');trTree(document.body);
    new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==='characterData')trText(m.target);else m.addedNodes.forEach(trTree)})}).observe(document.body,{childList:true,subtree:true,characterData:true})}

  /* nombre de jeux de l'accueil, compté automatiquement */
  (function(){var p=document.querySelector('.mast-side p'),n=document.querySelectorAll('#tiles .row-game').length;if(!p||!n)return;
    p.textContent=XL[LANG]&&XL[LANG].home?n+XL[LANG].home:LANG==='en'?n+' little games to play right in your browser. Solo, on one keyboard, or everyone on their own phone with a code.':n+' petits jeux à lancer dans le navigateur. Seul, sur un même clavier, ou chacun sur son téléphone avec un code.'})();

  /* ================= Page Paramètres ================= */
  var ACT=[['fwd','Avancer'],['back','Reculer'],['left','Gauche'],['right','Droite'],['jump','Sauter'],['sprint','Courir'],['slide','Glisser'],['reload','Recharger'],['use','Ouvrir / acheter'],['next','Arme suivante'],['prev','Arme précédente'],['map','Grande carte']];
  var layout=null;try{if(navigator.keyboard&&navigator.keyboard.getLayoutMap)navigator.keyboard.getLayoutMap().then(function(m){layout=m;if(PP.cur()==='settings')render()})}catch(e){}
  var AZ=/^fr/i.test(navigator.language||'')&&!/Mac/.test('')?{KeyQ:'A',KeyW:'Z',KeyA:'Q',KeyZ:'W',Semicolon:'M',KeyM:'M'}:{};
  function keyLabel(c){if(!c)return '—';var sp={Space:LANG!=='fr'?'Space':'Espace',ShiftLeft:LANG!=='fr'?'Left Shift':'Maj gauche',ShiftRight:LANG!=='fr'?'Right Shift':'Maj droite',ControlLeft:'Ctrl',ControlRight:'Ctrl',AltLeft:'Alt',AltRight:'Alt Gr',Tab:'Tab',CapsLock:LANG!=='fr'?'Caps':'Verr. maj',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Enter:LANG!=='fr'?'Enter':'Entrée',Backspace:'⌫',MetaLeft:'⌘',MetaRight:'⌘'};
    if(sp[c])return sp[c];if(c==='KeyM')return 'M';if(layout&&layout.get(c))return layout.get(c).toUpperCase();if(AZ[c])return AZ[c];if(/^Key/.test(c))return c.slice(3);if(/^Digit/.test(c))return c.slice(5);if(/^Numpad/.test(c))return 'Pavé '+c.slice(6);return c}
  var listening=null;
  function binds(){return PP.fpsBinds?PP.fpsBinds.get():{}}
  function setBind(a,code){var b=Object.assign({},binds()),old=b[a];Object.keys(b).forEach(function(k){if(k!==a&&b[k]===code)b[k]=old});b[a]=code;PP.setSetting('binds',b)}
  function syncPauseOv(){document.querySelectorAll('.pause-ov [data-set]').forEach(function(i){var k=i.dataset.set;if(i.type==='checkbox')i.checked=!!SET[k];else i.value=SET[k]});document.querySelectorAll('.pause-ov [data-val]').forEach(function(e){var k=e.dataset.val,v=SET[k];e.textContent=k==='fov'?v+'°':v+' %'})}
  function rng(k,l,min,max,step,unit){return '<label class="st-row"><span>'+PP.t(l)+'</span><input type="range" data-st="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+SET[k]+'"><em>'+SET[k]+unit+'</em></label>'}
  function chk(k,l){return '<label class="st-row chk"><span>'+PP.t(l)+'</span><input type="checkbox" data-st="'+k+'"'+(SET[k]?' checked':'')+'><em></em></label>'}
  function render(){
    var box=$('set-box');if(!box)return;var b=binds();
    var h='<p class="lead">'+PP.t('Tes réglages sont gardés dans ce navigateur (et en ligne si tu es connecté).')+'</p><div class="st-grid">';
    h+='<div class="panel st-card"><h3 class="t">'+PP.t('Langue')+'</h3><div class="st-lang">'+[['fr','Français'],['en','English']].concat(Object.keys(XL).map(function(k){return [k,XL[k].n]})).map(function(l){return '<button type="button" class="mode'+(LANG===l[0]?' on':'')+'" data-lang="'+l[0]+'"><b>'+l[1]+'</b><span>'+l[0].toUpperCase()+'</span></button>'}).join('')+'</div><p class="muted">'+PP.t('La page se recharge pour changer de langue.')+'</p></div>';
    h+='<div class="panel st-card"><h3 class="t">'+PP.t('Son')+'</h3><button type="button" class="st-mute" data-mute>'+(PP.sfx.muted?'Son : off':'Son : on')+'</button>'+rng('vol','Volume',0,100,5,' %')+'</div>';
    h+='<div class="panel st-card"><h3 class="t">'+PP.t('Souris et vue')+'</h3>'+rng('sens','Sensibilité souris',30,250,5,' %')+rng('fov','Champ de vision (3D)',60,100,1,'°')+chk('invY','Inverser la souris (haut/bas)')+'</div>';
    h+='<div class="panel st-card"><h3 class="t">'+PP.t('Graphismes')+'</h3><label class="st-row"><span>'+PP.t('Qualité (3D)')+'</span><select data-st="q"><option value="auto">Auto</option><option value="haute">'+PP.t('Haute')+'</option><option value="basse">'+PP.t('Basse (plus fluide)')+'</option></select><em></em></label>'+chk('fpsMeter','Afficher les images par seconde')+'</div>';
    h+='</div><div class="panel st-card st-keys"><h3 class="t">'+PP.t('Touches de Zone Morte')+'</h3><p class="muted">'+PP.t('Clique sur une touche, puis appuie sur la nouvelle.')+' '+PP.t('Les armes se choisissent aussi avec 1 à 4 et la molette.')+'</p><div class="st-kgrid">'+
      ACT.map(function(a){return '<div class="st-k"><span>'+PP.t(a[1])+'</span><button type="button" class="st-key'+(listening===a[0]?' wait':'')+'" data-bind="'+a[0]+'">'+(listening===a[0]?PP.t('Appuie sur une touche…'):esc(keyLabel(b[a[0]])))+'</button></div>'}).join('')+
      '</div><button type="button" class="ghost" id="st-reset">'+PP.t('Remettre par défaut')+'</button></div>';
    box.innerHTML=h;
    var sel=box.querySelector('select[data-st=q]');if(sel)sel.value=SET.q;
    box.querySelectorAll('[data-st]').forEach(function(i){var k=i.dataset.st;function upd(){var v=i.type==='checkbox'?i.checked:i.type==='range'?+i.value:i.value;PP.setSetting(k,v);var em=i.parentNode.querySelector('em');if(em&&i.type==='range')em.textContent=v+(k==='fov'?'°':' %');syncPauseOv()}i.addEventListener('input',upd);i.addEventListener('change',upd)});
    box.querySelectorAll('[data-lang]').forEach(function(x){x.onclick=function(){var l=x.dataset.lang;if(l===LANG)return;try{localStorage.setItem('pp-lang',l)}catch(e){}location.hash='settings';location.reload()}});
    box.querySelectorAll('[data-bind]').forEach(function(x){x.onclick=function(){listening=listening===x.dataset.bind?null:x.dataset.bind;render()}});
    $('st-reset').onclick=function(){PP.setSetting('binds',{});listening=null;render();PP.toast(PP.t('Remettre par défaut'),'ok')};
  }
  document.addEventListener('keydown',function(e){if(!listening||PP.cur()!=='settings')return;e.preventDefault();e.stopImmediatePropagation();if(e.key!=='Escape'&&e.code)setBind(listening,e.code);listening=null;render()},true);
  document.addEventListener('click',function(e){if(e.target.closest('[data-mute]')&&PP.cur()==='settings')setTimeout(render,0)});
  PP.games.settings={open:function(){listening=null;render()},close:function(){listening=null}};

  /* ================= Avis des joueurs (étoiles) ================= */
  /* Il faut un compte pour noter. Les notes sont gardées en ligne quand les comptes en ligne sont activés,
     sinon dans ce navigateur (pour tous les comptes de cet appareil). Les jeux les mieux notés passent en haut. */
  var LK='pp-ratings',RT={},cloudRT=null;
  try{RT=JSON.parse(localStorage.getItem(LK))||{}}catch(e){RT={}}
  function me(){var c=PP.cloud;if(c&&c.user)return 'u:'+c.user.uid;var p=PP.profile();return p?'p:'+p:null}
  function data(){return cloudRT||RT}
  function stats(id){var r=data()[id]||{},v=Object.keys(r).map(function(k){return r[k]}).filter(function(x){return x>=1&&x<=5});var s=v.reduce(function(a,b){return a+b},0);return {n:v.length,avg:v.length?s/v.length:0,mine:me()?r[me()]||0:0}}
  function starsHtml(id){var st=stats(id),h='<span class="rg-rate" data-rate="'+id+'" title="'+(st.n?st.avg.toFixed(1)+' / 5':PP.t('pas encore noté'))+'"><span class="rg-stars">';
    for(var i=1;i<=5;i++){var fill=Math.max(0,Math.min(1,st.avg-(i-1)));h+='<i data-star="'+i+'" class="'+(st.mine>=i?'me':'')+'" style="--f:'+Math.round(fill*100)+'%">★</i>'}
    return h+'</span><small>'+(st.n?st.avg.toFixed(1).replace('.',LANG==='en'?'.':XL[LANG]?XL[LANG].dec:',')+' · '+st.n+' '+(XL[LANG]?XL[LANG].rev[st.n>1?1:0]:LANG==='en'?(st.n>1?'reviews':'review'):'avis'):PP.t('pas encore noté'))+'</small></span>'}
  var tiles=$('tiles'),order=null;
  function paint(){if(!tiles)return;var rows=[].slice.call(tiles.querySelectorAll('.row-game'));
    if(!order){order={};rows.forEach(function(r,i){order[r.dataset.go]=i})}
    rows.forEach(function(r){var id=r.dataset.go,old=r.querySelector('.rg-rate'),tmp=document.createElement('span');tmp.innerHTML=starsHtml(id);var nw=tmp.firstChild;if(old)r.replaceChild(nw,old);else{var nm=r.querySelector('.rg-name');nm.parentNode.insertBefore(nw,nm.nextSibling)}});
    rows.sort(function(a,b){var A=stats(a.dataset.go),Bs=stats(b.dataset.go);return (Bs.avg-A.avg)||(Bs.n-A.n)||(order[a.dataset.go]-order[b.dataset.go])});
    rows.forEach(function(r,i){tiles.appendChild(r);var n=r.querySelector('.rg-n');if(n)n.textContent=(i<9?'0':'')+(i+1)});
    var lb=$('rate-note');if(!lb){lb=document.createElement('p');lb.id='rate-note';lb.className='rate-note';tiles.parentNode.insertBefore(lb,tiles)}lb.textContent=PP.t('Classés par note des joueurs');}
  function rate(id,n){var who=me();if(!who){PP.toast(PP.t('Crée un compte pour donner ton avis'),'warn');PP.go('account');return}
    RT[id]=RT[id]||{};RT[id][who]=n;try{localStorage.setItem(LK,JSON.stringify(RT))}catch(e){}
    if(PP.cloud&&PP.cloud.rate&&PP.cloud.user){PP.cloud.rate(id,n);if(cloudRT){cloudRT[id]=cloudRT[id]||{};cloudRT[id][who]=n}}
    PP.sfx.play('pickup');PP.toast(PP.t('Merci pour ta note !'),'ok');paint();
    var r=tiles.querySelector('[data-rate="'+id+'"]');if(r){r.classList.add('pop');setTimeout(function(){r.classList.remove('pop')},500)}}
  if(tiles){
    tiles.addEventListener('click',function(e){var s=e.target.closest('[data-star]');if(!s)return;e.preventDefault();e.stopPropagation();rate(s.closest('[data-rate]').dataset.rate,+s.dataset.star)},true);
    tiles.addEventListener('mousedown',function(e){if(e.target.closest('[data-star]'))e.stopPropagation()},true);
    paint();
    if(PP.cloud&&PP.cloud.on)PP.cloud.on(function(c){if(c.ratings&&!cloudRT)c.ratings(function(d){cloudRT=d;paint()});else paint()});
  }
  PP.ratings={paint:paint,stats:stats};
})();
