/* Pixel Pause — liste des jeux « arcade » : crée leurs pages et leurs lignes dans l'accueil
   (chargé avant core.js pour que la pause et le plein écran s'y branchent aussi). */
window.ARCADE_LIST=[
  {id:'c4',n:'Quatre en ligne',sub:'Stratégie · aligne 4 jetons',pl:'1–2',cat:'pc tel solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','Chacun son tour, même écran'],['online','En ligne','Contre un pote du salon']]},
  {id:'hockey',n:'Air Hockey',sub:'Duel · palets et rebonds',pl:'1–2',cat:'pc solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','ZQSD contre flèches']]},
  {id:'stack',n:'Tour Infinie',sub:'3D · empile au bon moment',pl:'1',cat:'solo 3d',modes:[['solo','Solo','Monte le plus haut possible']]},
  {id:'reflex',n:'Réflexes',sub:'Party · le plus rapide gagne',pl:'1–8',cat:'pc tel solo',modes:[['solo','Solo','Bats ton temps de réaction'],['duel','2 joueurs','A contre L, même clavier'],['online','En ligne','Tout le salon en même temps']]},
  {id:'bricks',n:'Casse-Briques Néon',sub:'Arcade · niveaux et bonus',pl:'1',cat:'solo',modes:[['solo','Solo','5 niveaux, 3 vies']]},
  {id:'bowl',n:'Bowling 3D',sub:'3D · strikes et spares',pl:'1–2',cat:'pc solo 3d',modes:[['solo','Solo','10 frames'],['duel','2 joueurs','Chacun son tour']]},
  {id:'golf',n:'Mini-golf 3D',sub:'3D · 6 trous, moulin et bumpers',pl:'1–4',cat:'pc solo 3d',modes:[['solo','Solo','Le moins de coups'],['duel','2 joueurs','Chacun son tour'],['trio','3 joueurs','Chacun son tour'],['quad','4 joueurs','Chacun son tour']]},
  {id:'arch',n:'Tir à l\'arc 3D',sub:'3D · vent et distance',pl:'1–2',cat:'pc solo 3d',modes:[['solo','Solo','10 flèches'],['duel','2 joueurs','Chacun son tour']]},
  {id:'tanks',n:'Tanks',sub:'Duel · obus qui rebondissent',pl:'1–2',cat:'pc solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','Même clavier']]},
  {id:'navale',n:'Bataille navale',sub:'Stratégie · coule la flotte',pl:'1–2',cat:'tel solo',modes:[['solo','Solo','Contre l\'ordinateur'],['online','En ligne','Contre un pote du salon']]},
  {id:'typing',n:'Course de frappe',sub:'Clavier · tape plus vite que les autres',pl:'1–8',cat:'pc tel solo',modes:[['solo','Solo','Contre 3 bots'],['online','En ligne','Tout le salon']]},
  {id:'quiz',n:'Quiz',sub:'Party · culture générale chrono',pl:'1–12',cat:'tel solo',modes:[['solo','Solo','10 questions'],['online','En ligne','Tout le salon répond']]},
  {id:'memory',n:'Memory',sub:'Cartes · retrouve les paires',pl:'1–2',cat:'pc solo',modes:[['solo','Solo','Le moins de coups'],['duel','2 joueurs','Chacun son tour']]},
  {id:'mines',n:'Démineur',sub:'Réflexion · évite les mines',pl:'1',cat:'solo',modes:[['easy','Facile','12 × 8, 12 mines'],['mid','Moyen','16 × 10, 26 mines'],['hard','Difficile','20 × 11, 45 mines']]},
  {id:'pong',n:'Pong néon',sub:'Arcade · duel de raquettes',pl:'1–2',cat:'pc solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','Même clavier']]},
  {id:'plane',n:'Avion 3D',sub:'3D · vole dans les anneaux',pl:'1',cat:'solo 3d',modes:[['solo','Solo','Le plus loin possible']]},
  {id:'maze',n:'Labyrinthe 3D',sub:'3D · trouve la sortie',pl:'1',cat:'solo 3d',modes:[['solo','Solo','Un nouveau labyrinthe à chaque fois']]},
  {id:'hoops',n:'Basket 3D',sub:'3D · paniers à 2 et 3 points',pl:'1–2',cat:'pc solo 3d',modes:[['solo','Solo','60 secondes chrono'],['duel','2 joueurs','60 s chacun']]},
  {id:'draw',n:'Dessine et devine',sub:'Party · un dessine, les autres devinent',pl:'2–12',cat:'tel',modes:[['online','En ligne','Tout le salon']]},
  {id:'pool',n:'Billard',sub:'Adresse · pleines contre rayées',pl:'1–2',cat:'pc solo',modes:[['solo','Solo','Nettoie la table'],['duel','2 joueurs','Chacun son tour']]},
  {id:'flap',n:'Envol',sub:'Arcade · ton perso vole entre les cheminées',pl:'1',cat:'pc tel solo',modes:[['solo','Normal','Passages larges'],['hard','Difficile','Plus serré et plus rapide']]},
  {id:'potion',n:'Potions',sub:'Réflexion · range les couleurs dans les fioles',pl:'1',cat:'pc tel solo',modes:[['easy','Facile','4 couleurs'],['mid','Moyen','7 couleurs'],['hard','Difficile','10 couleurs'],['exp','Expert','12 couleurs']]},
  {id:'snakeio',n:'Serpents',sub:'Arène · grandis et avale les plus petits',pl:'1',cat:'pc tel solo',modes:[['solo','Arène','13 serpents'],['big','Grosse arène','20 serpents']]},
  {id:'marz',img:'thumb-marz.svg?v=2',n:'Marzoukeur',sub:'Fun · attrape les burgers, enchaîne les combos',pl:'1',cat:'pc tel solo',modes:[['solo','Solo','Le plus de kilos avant la ruine']]}
];
(function(){
  var tiles=document.getElementById('tiles'),anchor=document.getElementById('v-geo');if(!tiles||!anchor)return;
  var n=tiles.querySelectorAll('.row-game').length;
  ARCADE_LIST.forEach(function(g){
    n++;var b=document.createElement('button');b.type='button';b.className='row-game';b.dataset.go=g.id;b.dataset.cat=g.cat;
    b.innerHTML='<span class="rg-n">'+(n<10?'0':'')+n+'</span><span class="rg-name">'+g.n+'</span><span class="rg-sub">'+g.sub+'</span><span class="rg-pl">'+g.pl+'<small>joueur'+(g.pl==='1'?'':'s')+'</small></span><img class="rg-img" src="'+(g.img||('thumb-'+g.id+'.jpg?v=8.0'))+'" alt="" loading="lazy">';
    tiles.appendChild(b);
    var s=document.createElement('section');s.className='view';s.id='v-'+g.id;
    s.innerHTML='<h2>'+g.n+'</h2><div class="modes ag-modes">'+g.modes.map(function(m,i){return '<button type="button" class="mode'+(i?'':' on')+'" data-m="'+m[0]+'"><b>'+m[1]+'</b><span>'+m[2]+'</span></button>'}).join('')+'</div>'+
      '<div class="hud" id="'+g.id+'-hud"></div><div class="stage wide"><canvas id="'+g.id+'-cv" width="960" height="540"></canvas>'+
      '<div class="overlay" id="'+g.id+'-ov"><h3 id="'+g.id+'-title">'+g.n+'</h3><p id="'+g.id+'-msg"></p><button type="button" class="primary" id="'+g.id+'-start">Jouer</button></div></div>'+
      '<p class="keys" id="'+g.id+'-keys"></p><p class="back"><button type="button" class="ghost" data-go="menu">← Retour aux jeux</button></p>';
    anchor.parentNode.insertBefore(s,anchor.nextSibling);anchor=s;
  });
})();
