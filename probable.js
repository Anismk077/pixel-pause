/* Pixel Pause — Le plus probable : « Qui est le plus susceptible de… » (en ligne, chacun vote sur son téléphone) */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,box=$('prob-box');
  var Q=[
    'oublier son propre anniversaire','se perdre avec le GPS allumé','répondre « oui » sans avoir écouté la question','manger la dernière part sans demander','arriver en retard à son propre mariage',
    'envoyer un message au mauvais groupe','dormir pendant un film au cinéma','se faire virer d\'un escape game','pleurer devant une pub','devenir influenceur par accident',
    'acheter un truc inutile à 3 h du matin','mettre un vocal de 6 minutes','faire semblant de comprendre une blague','rater le dernier métro','finir en garde à vue pour une bêtise',
    'se tromper de prénom en rencard','appeler sa mère pour une recette simple','perdre ses clés deux fois le même jour','se faire avoir par un faux mail','manger des pâtes 7 jours de suite',
    'oublier un enfant au supermarché','devenir riche puis tout perdre','survivre le plus longtemps à une apocalypse zombie','être pris pour un employé dans un magasin','chanter faux en étant sûr de chanter juste',
    'parler à son chat comme à un humain','se réveiller à 14 h un jour de travail','rater un vol parce qu\'il est au Starbucks','faire un karaoké à jeun','prendre un abonnement salle de sport et n\'y aller qu\'une fois',
    'se faire bannir d\'un jeu en ligne','se disputer avec un GPS','rire à un enterrement','commander un dessert « pour partager » et ne rien partager','poser une question déjà posée 2 minutes avant',
    'se faire arnaquer en vacances','gagner au loto et ne le dire à personne','oublier son mot de passe pour la 5e fois','adopter un animal sur un coup de tête','avoir 300 onglets ouverts',
    'être la cause d\'une panne WiFi','mettre un selfie avec filtre sur LinkedIn','se cacher pour éviter quelqu\'un','mentir sur sa taille','lire les conditions générales jusqu\'au bout',
    'passer la nuit sur un seul épisode « de plus »','se faire réveiller par le voisin','avoir peur des pigeons','partir en voyage sans rien prévoir','manger un truc tombé par terre'
  ];
  var sub=null,host={q:null,votes:{},round:0,used:[],scores:{}},guest={voted:false};

  function open(){
    if(!net.inRoom()){box.innerHTML='<div class="panel narrow"><p style="margin-top:0">Ce jeu se joue en ligne : chacun vote sur son téléphone.</p><button type="button" data-go="room">Créer un salon</button> <button type="button" class="ghost" data-go="join">J\'ai un code</button></div>';return}
    listen();
    if(net.isHost)lobby();else box.innerHTML='<div class="panel card-reveal"><p class="wait">L\'hôte lance la première question</p></div>';
  }
  function close(){if(sub){sub();sub=null}}

  function lobby(){
    host.round=0;host.used=[];host.scores={};
    box.innerHTML='<div class="panel"><h3 class="t">Salon '+esc(net.code)+' · '+net.players.length+' joueurs</h3><p>À chaque question, tout le monde vote pour la personne la plus probable. Celle qui a le plus de voix prend un point. 8 questions.</p><ul class="plist">'+net.players.map(function(p){return '<li>'+esc(p.name)+'</li>'}).join('')+'</ul><button type="button" id="prob-go"'+(net.players.length<3?' disabled':'')+'>Lancer</button></div>';
    $('prob-go').onclick=nextQ;
  }
  function nextQ(){
    if(host.round>=8)return end();
    host.round++;host.votes={};
    var pool=Q.map(function(q,i){return i}).filter(function(i){return host.used.indexOf(i)<0});
    var qi=PP.pick(pool);host.used.push(qi);host.q=Q[qi];
    net.broadcast({t:'prob-q',q:host.q,round:host.round,players:net.players});
    renderQ();
  }
  function renderQ(){
    var n=Object.keys(host.votes).length,tot=net.players.length;
    var h='<div class="panel"><p class="muted">Question '+host.round+' / 8 · '+n+' / '+tot+' votes</p><div class="question">Qui est le plus susceptible de '+esc(host.q)+' ?</div>';
    if(!host.votes.host){h+='<div class="votes">'+net.players.map(function(p){return '<button type="button" data-v="'+p.id+'">'+esc(p.name)+'</button>'}).join('')+'</div>'}
    else h+='<p class="wait">On attend les autres</p>';
    h+='<p><button type="button" class="ghost" id="prob-force">Montrer les résultats maintenant</button></p></div>';
    box.innerHTML=h;
    box.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){host.votes.host=b.dataset.v;check()}});
    $('prob-force').onclick=results;
  }
  function check(){if(Object.keys(host.votes).length>=net.players.length)results();else renderQ()}
  function results(){
    sfx.play('win');
    var count={};Object.keys(host.votes).forEach(function(k){count[host.votes[k]]=(count[host.votes[k]]||0)+1});
    var rows=net.players.map(function(p){return {name:p.name,id:p.id,n:count[p.id]||0}}).sort(function(a,b){return b.n-a.n});
    var max=rows[0]?rows[0].n:0;
    rows.forEach(function(r){if(r.n===max&&max>0)host.scores[r.name]=(host.scores[r.name]||0)+1});
    net.broadcast({t:'prob-res',q:host.q,rows:rows,round:host.round});
    box.innerHTML='<div class="panel"><div class="question" style="border-color:var(--edge)">'+esc(host.q)+'</div><div class="result">'+rows.map(function(r){return '<div class="bar"><span>'+esc(r.name)+'</span><i style="width:'+(r.n*40)+'px;background:'+(r.n===max&&max>0?'var(--r)':'var(--p)')+'"></i><span>'+r.n+'</span></div>'}).join('')+'</div><button type="button" id="prob-next">'+(host.round>=8?'Voir le classement':'Question suivante')+'</button></div>';
    $('prob-next').onclick=nextQ;
  }
  function end(){
    var rows=Object.keys(host.scores).map(function(n){return {name:n,n:host.scores[n]}}).sort(function(a,b){return b.n-a.n});
    net.broadcast({t:'prob-end',rows:rows});
    box.innerHTML=endHtml(rows)+'<div class="row" style="margin-top:14px"><button type="button" id="prob-again">Rejouer</button><button type="button" class="ghost" data-go="room">Retour au salon</button></div></div>';
    $('prob-again').onclick=lobby;
  }
  function endHtml(rows){
    return '<div class="panel"><h3 class="t">Classement</h3><p class="muted">Un point par question où tu as été le plus cité.</p><div class="result">'+(rows.length?rows.map(function(r,i){return '<div class="bar"><span>'+(i+1)+'. '+esc(r.name)+'</span><i style="width:'+(r.n*40)+'px;background:var(--y)"></i><span>'+r.n+'</span></div>'}).join(''):'<p>Personne n\'a été cité.</p>')+'</div>';
  }

  function listen(){
    if(sub)return;
    sub=net.on(function(m,from){
      if(PP.cur()!=='prob')return;
      if(net.isHost){
        if(m.t==='prob-v'&&host.q&&!host.votes[from]){host.votes[from]=m.target;check()}
        if(m.t==='players'&&!host.q)lobby();
      }else{
        if(m.t==='prob-q'){sfx.play('join');
          box.innerHTML='<div class="panel"><p class="muted">Question '+m.round+' / 8</p><div class="question">Qui est le plus susceptible de '+esc(m.q)+' ?</div><div class="votes">'+m.players.map(function(p){return '<button type="button" data-v="'+p.id+'">'+esc(p.name)+'</button>'}).join('')+'</div><p class="wait" id="prob-wait" hidden>Vote envoyé</p></div>';
          box.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){net.send({t:'prob-v',target:b.dataset.v});box.querySelectorAll('[data-v]').forEach(function(x){x.disabled=true;x.classList.toggle('sel',x===b)});$('prob-wait').hidden=false}});
        }
        if(m.t==='prob-res'){
          var max=m.rows[0]?m.rows[0].n:0;
          box.innerHTML='<div class="panel"><div class="question" style="border-color:var(--edge)">'+esc(m.q)+'</div><div class="result">'+m.rows.map(function(r){return '<div class="bar"><span>'+esc(r.name)+'</span><i style="width:'+(r.n*40)+'px;background:'+(r.n===max&&max>0?'var(--r)':'var(--p)')+'"></i><span>'+r.n+'</span></div>'}).join('')+'</div><p class="wait">Question suivante</p></div>';
        }
        if(m.t==='prob-end')box.innerHTML=endHtml(m.rows)+'<p class="wait">L\'hôte peut relancer</p></div>';
      }
    });
  }
  PP.games.prob={open:open,close:close};
})();
