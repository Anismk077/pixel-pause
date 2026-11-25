/* Pixel Pause — liste des jeux « arcade » : crée leurs pages et leurs lignes dans l'accueil
   (chargé avant core.js pour que la pause et le plein écran s'y branchent aussi). */
window.ARCADE_LIST=[
  {id:'c4',n:'Quatre en ligne',sub:'Stratégie · aligne 4 jetons',pl:'1–2',cat:'pc tel solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','Chacun son tour, même écran'],['online','En ligne','Contre un pote du salon']]},
  {id:'hockey',n:'Air Hockey',sub:'Duel · palets et rebonds',pl:'1–2',cat:'pc solo',modes:[['solo','Solo','Contre l\'ordinateur'],['duel','2 joueurs','ZQSD contre flèches']]},
  {id:'stack',n:'Tour Infinie',sub:'3D · empile au bon moment',pl:'1',cat:'solo 3d',modes:[['solo','Solo','Monte le plus haut possible']]},
  {id:'reflex',n:'Réflexes',sub:'Party · le plus rapide gagne',pl:'1–8',cat:'pc tel solo',modes:[['solo','Solo','Bats ton temps de réaction'],['duel','2 joueurs','A contre L, même clavier'],['online','En ligne','Tout le salon en même temps']]},
  {id:'bricks',n:'Casse-Briques Néon',sub:'Arcade · niveaux et bonus',pl:'1',cat:'solo',modes:[['solo','Solo','5 niveaux, 3 vies']]}
];
(function(){
  var tiles=document.getElementById('tiles'),anchor=document.getElementById('v-geo');if(!tiles||!anchor)return;
  var n=tiles.querySelectorAll('.row-game').length;
  ARCADE_LIST.forEach(function(g){
    n++;var b=document.createElement('button');b.type='button';b.className='row-game';b.dataset.go=g.id;b.dataset.cat=g.cat;
    b.innerHTML='<span class="rg-n">'+(n<10?'0':'')+n+'</span><span class="rg-name">'+g.n+'</span><span class="rg-sub">'+g.sub+'</span><span class="rg-pl">'+g.pl+'<small>joueur'+(g.pl==='1'?'':'s')+'</small></span><img class="rg-img" src="thumb-'+g.id+'.jpg?v=7.0" alt="" loading="lazy">';
    tiles.appendChild(b);
    var s=document.createElement('section');s.className='view';s.id='v-'+g.id;
    s.innerHTML='<h2>'+g.n+'</h2><div class="modes ag-modes">'+g.modes.map(function(m,i){return '<button type="button" class="mode'+(i?'':' on')+'" data-m="'+m[0]+'"><b>'+m[1]+'</b><span>'+m[2]+'</span></button>'}).join('')+'</div>'+
      '<div class="hud" id="'+g.id+'-hud"></div><div class="stage wide"><canvas id="'+g.id+'-cv" width="960" height="540"></canvas>'+
      '<div class="overlay" id="'+g.id+'-ov"><h3 id="'+g.id+'-title">'+g.n+'</h3><p id="'+g.id+'-msg"></p><button type="button" class="primary" id="'+g.id+'-start">Jouer</button></div></div>'+
      '<p class="keys" id="'+g.id+'-keys"></p><p class="back"><button type="button" class="ghost" data-go="menu">← Retour aux jeux</button></p>';
    anchor.parentNode.insertBefore(s,anchor.nextSibling);anchor=s;
  });
})();
