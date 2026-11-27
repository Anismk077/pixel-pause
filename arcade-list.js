/* Pixel Pause — liste des jeux « arcade » : crée leurs pages et leurs lignes dans l'accueil
   (chargé avant core.js pour que la pause et le plein écran s'y branchent aussi). */
window.ARCADE_LIST=[
  {id:'c4',n:'Quatre en ligne',sub:'Stratégie · aligne 4 jetons, jusqu\'à 4 joueurs',pl:'1–4',cat:'pc tel solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','Chacun son tour, même écran'],['p3','3 joueurs','Grande grille, même écran'],['p4','4 joueurs','Grande grille, même écran'],['online','En ligne','2 à 4 potes du salon']]},
  {id:'hockey',n:'Air Hockey',sub:'Duel · palets et rebonds',pl:'1–2',cat:'pc solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','ZQSD contre flèches']]},
  {id:'stack',n:'Tour Infinie',sub:'3D · empile au bon moment',pl:'1',cat:'solo 3d',modes:[['solo','Solo','Monte le plus haut possible']]},
  {id:'reflex',n:'Réflexes',sub:'Party · le plus rapide gagne',pl:'1–8',cat:'pc tel solo',modes:[['solo','Solo','Bats ton temps de réaction'],['duel','2 joueurs','A contre L, même clavier'],['online','En ligne','Tout le salon en même temps']]},
  {id:'bricks',n:'Casse-Briques Néon',sub:'Arcade · niveaux et bonus',pl:'1',cat:'solo',modes:[['solo','Solo','5 niveaux, 3 vies']]},
  {id:'bowl',n:'Bowling 3D',sub:'3D · strikes et spares',pl:'1–2',cat:'pc solo 3d',modes:[['solo','Solo','10 frames'],['duel','2 joueurs','Chacun son tour']]},
  {id:'golf',n:'Mini-golf 3D',sub:'3D · 9 trous, moulin, sable et eau',pl:'1–4',cat:'pc solo 3d',modes:[['solo','Solo','Le moins de coups'],['duel','2 joueurs','Chacun son tour'],['trio','3 joueurs','Chacun son tour'],['quad','4 joueurs','Chacun son tour']]},
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
  {id:'volt',n:'Voltige',sub:'3D · cours sur les murs, grappin, tremplins, course et zombies',pl:'1',cat:'pc solo 3d',modes:[['course','Course','18 anneaux dans les airs, chrono'],['cibles','Cibles','24 cibles, chrono'],['zombies','Zombies','Des vagues pendant 3 min']]},
  {id:'flap',n:'Envol',sub:'Arcade · ton perso vole entre les cheminées',pl:'1',cat:'pc tel solo',modes:[['solo','Normal','Passages larges'],['hard','Difficile','Plus serré et plus rapide']]},
  {id:'potion',n:'Potions',sub:'Réflexion · range les couleurs dans les fioles',pl:'1',cat:'pc tel solo',modes:[['easy','Facile','4 couleurs'],['mid','Moyen','7 couleurs'],['hard','Difficile','10 couleurs'],['exp','Expert','12 couleurs'],['bot','Duel ordi','Course contre l\'ordinateur'],['online','Duel salon','Le premier qui finit gagne']]},
  {id:'snakeio',n:'Serpents',sub:'Arène · grandis et avale les plus petits',pl:'1',cat:'pc tel solo',modes:[['solo','Arène','13 serpents'],['big','Grosse arène','20 serpents']]},
  {id:'chess',img:'thumb-chess.svg?v=1',n:'Échecs',sub:'Stratégie · chrono, niveaux, 2 plateaux à 4',pl:'1–4',cat:'pc tel solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','Chacun son tour, même écran'],['online','En ligne','À 4 : deux parties en même temps']]},
  {id:'wire',img:'thumb-wire.svg?v=1',n:'Câbles',sub:'Réflexes · rebranche les câbles de couleur',pl:'1',cat:'pc tel solo',modes:[['solo','Chrono','60 secondes, un max de panneaux'],['zen','Zen','Sans chrono']]},
  {id:'tours',img:'thumb-tours.svg?v=1',n:'Guerre des Tours',sub:'Stratégie · cartes, tours et énergie en temps réel',pl:'1',cat:'pc tel solo',modes:[['easy','Facile','L\'ordi réfléchit lentement'],['mid','Moyen','Un bon adversaire'],['hard','Difficile','Il vise ta tour la plus faible']]},
  {id:'term',img:'thumb-term.svg?v=1',n:'Terminal',sub:'Apprends les commandes Linux · faux terminal, vraies commandes',pl:'1',cat:'pc solo',modes:[['story','Histoire','16 missions pour tout apprendre'],['chrono','Chrono','60 secondes, un max de commandes']]},
  {id:'blocs',img:'thumb-blocs.svg?v=1',n:'Blocs',sub:'Réflexion · des pièces tombent, remplis des lignes',pl:'1',cat:'pc solo',modes:[['marathon','Marathon','Ça accélère sans fin'],['sprint','Sprint','30 lignes, chrono'],['chrono','2 minutes','Un max de points']]},
  {id:'saut',img:'thumb-saut.svg?v=1',n:'Saute-Pixel',sub:'Plateformes · 4 mondes, des boss, à 1 ou 2',pl:'1-2',cat:'pc solo',modes:[['run','Aventure','4 mondes, 5 vies'],['duo','2 joueurs','Même clavier'],['hard','Expert','Une seule vie']]},
  {id:'bj',img:'thumb-bj.svg?v=1',n:'Blackjack',sub:'Casino · approche-toi de 21, seul ou à plusieurs',pl:'1–5',cat:'pc tel solo',modes:[['solo','Solo','Contre le croupier'],['online','En ligne','Tout le salon à la table']]},
  {id:'poker',img:'thumb-poker.svg?v=1',n:'Poker',sub:'Casino · Texas Hold\'em, contre des bots ou à plusieurs',pl:'1–6',cat:'pc tel solo',modes:[['solo','Solo','Toi contre 3 bots'],['online','En ligne','2 à 6 joueurs du salon']]},
  {id:'roue',img:'thumb-roue.svg?v=1',n:'La Roue',sub:'Casino · mise et fais tourner la roue',pl:'1',cat:'pc tel solo',modes:[['solo','Solo','×1 à ×40']]},
  {id:'marz',img:'thumb-marz.svg?v=2',n:'Marzoukeur',sub:'Fun · attrape les burgers, enchaîne les combos',pl:'1',cat:'pc tel solo',modes:[['solo','Solo','Le plus de kilos avant la ruine']]},
  {id:'bitume',img:'thumb-bitume.svg?v=1',n:'Bitume',sub:'Action · vole des voitures, missions, police aux trousses',pl:'1',cat:'pc tel solo',modes:[['histoire','Histoire','8 missions, partie sauvegardée'],['libre','Balade libre','La ville rien que pour toi'],['chaos','Chaos','Police aux trousses, tiens bon']]}
];
(function(){
  var tiles=document.getElementById('tiles'),anchor=document.getElementById('v-geo');if(!tiles||!anchor)return;
  var n=tiles.querySelectorAll('.row-game').length;
  ARCADE_LIST.forEach(function(g){
    n++;var b=document.createElement('button');b.type='button';b.className='row-game';b.dataset.go=g.id;b.dataset.cat=g.cat;
    b.innerHTML='<span class="rg-n">'+(n<10?'0':'')+n+'</span><span class="rg-name">'+g.n+'</span><span class="rg-sub">'+g.sub+'</span><span class="rg-pl">'+g.pl+'<small>joueur'+(g.pl==='1'?'':'s')+'</small></span><img class="rg-img" src="'+(g.img||('thumb-'+g.id+'.jpg?v=8.2'))+'" alt="" loading="lazy">';
    tiles.appendChild(b);
    var s=document.createElement('section');s.className='view';s.id='v-'+g.id;
    s.innerHTML='<h2>'+g.n+'</h2><div class="modes ag-modes">'+g.modes.map(function(m,i){return '<button type="button" class="mode'+(i?'':' on')+'" data-m="'+m[0]+'"><b>'+m[1]+'</b><span>'+m[2]+'</span></button>'}).join('')+'</div>'+
      '<div class="hud" id="'+g.id+'-hud"></div><div class="stage wide"><canvas id="'+g.id+'-cv" width="960" height="540"></canvas>'+
      '<div class="overlay" id="'+g.id+'-ov"><h3 id="'+g.id+'-title">'+g.n+'</h3><p id="'+g.id+'-msg"></p><button type="button" class="primary" id="'+g.id+'-start">Jouer</button></div></div>'+
      '<p class="keys" id="'+g.id+'-keys"></p><p class="back"><button type="button" class="ghost" data-go="menu">← Retour aux jeux</button></p>';
    anchor.parentNode.insertBefore(s,anchor.nextSibling);anchor=s;
  });
})();
