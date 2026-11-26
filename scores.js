/* Pixel Pause — classements en ligne : chaque record battu est envoyé sur ton profil (profiles/{uid}.rec),
   et sous chaque jeu un tableau montre le top 10 des joueurs, avec leur perso. */
(function(){
  'use strict';
  var esc=PP.esc;
  /* [clé du record dans le stockage, nom de l'onglet, plus petit = mieux, format] */
  var B={
    fps:[['fps-zombie','Zombies tués',0,'']],surv:[['sv-best','Jours survécus',0,' j']],run:[['rn-best','Score',0,' pts']],snake:[['sn-best','Score',0,' pts']],
    geo:[['geo-best','Score',0,' pts']],time:[['tg-best','Score',0,' pts']],
    kart:[['kt-best-ville','Ville',1,'time'],['kt-best-desert','Désert',1,'time'],['kt-best-neige','Neige',1,'time']],
    stack:[['ag-stack-h','Hauteur',0,'']],reflex:[['ag-reflex-ms','Réflexes',1,' ms']],bricks:[['ag-bricks-pts','Score',0,' pts']],bowl:[['ag-bowl-pts','Score',0,' pts']],
    golf:[['ag-golf-coups9','Coups',1,' coups']],arch:[['ag-arch-pts','Score',0,' pts']],typing:[['ag-typing-wpm','Vitesse',0,' mots/min']],quiz:[['ag-quiz-pts','Score',0,' pts']],
    memory:[['ag-memory-coups','Coups',1,' coups']],mines:[['ag-mines-easy','Facile',1,' s'],['ag-mines-mid','Moyen',1,' s'],['ag-mines-hard','Difficile',1,' s']],
    plane:[['ag-plane-pts','Score',0,' pts']],maze:[['ag-maze-t','Temps',1,' s']],hoops:[['ag-hoops-pts','Points',0,' pts']],pool:[['ag-pool-coups','Coups',1,' coups']],
    marz:[['ag-marz-kg','Poids',0,' kg']],flap:[['ag-flap-pts','Cheminées',0,'']],snakeio:[['ag-snakeio-m','Taille',0,'']],
    potion:[['ag-potion-lvl-easy','Facile',0,'niv'],['ag-potion-lvl-mid','Moyen',0,'niv'],['ag-potion-lvl-hard','Difficile',0,'niv'],['ag-potion-lvl-exp','Expert',0,'niv']],
    wire:[['ag-wire-pts','Panneaux',0,'']],
    tours:[['ag-tours-cr','Tours détruites',0,'']],
    volt:[['ag-volt-temps','Cibles',1,'dec'],['ag-volt-pts','Zombies',0,' pts']]};
  /* v23 : chaque jeu a aussi un classement « Victoires » (nombre de parties gagnées) */
  Object.keys(B).forEach(function(g){B[g].push(['st-'+g+'-win','Victoires',0,'win'])});
  var IDX={};Object.keys(B).forEach(function(g){B[g].forEach(function(b){IDX[b[0]]={g:g,k:b[0],n:b[1],low:!!b[2],f:b[3],id:b[0].replace(/[^a-z0-9]/gi,'_')}})});
  var tab={},cache={};
  function fmt(b,v){if(b.f==='time')return PP.fmtTime(v);if(b.f==='dec')return (+v).toFixed(1)+' s';if(b.f==='niv')return 'niveau '+v;if(b.f==='win')return Math.round(v)+' victoire'+(v>1?'s':'');return Math.round(v).toLocaleString('fr-FR')+b.f}
  function cloud(){var C=PP.cloud;return C&&C.db&&C.user?C:null}
  function submit(b,v){var C=cloud();if(!C||!(v>0))return;var rec={};rec[b.id]=v;C.db.collection('profiles').doc(C.user.uid).set({name:C.name||PP.myName(),rec:rec},{merge:true}).then(function(){delete cache[b.id];if(PP.cur()===b.g)render(b.g)}).catch(function(){})}
  /* chaque nouveau record local part aussi en ligne */
  var orig=PP.store;PP.store=function(k,v){var r=orig.apply(this,arguments);if(v!==undefined&&IDX[k])submit(IDX[k],+v);return r};
  /* les victoires passent par PP.stat (qui écrit sans passer par PP.store) : on les envoie ici */
  var oStat=PP.stat;PP.stat=function(g,f){var r=oStat.apply(this,arguments);var b=IDX['st-'+g+'-'+f];if(b)submit(b,orig(b.k));return r};
  /* à la connexion : on envoie les records déjà faits sur cet appareil s'ils sont meilleurs que ceux en ligne */
  var synced=false;setInterval(function(){var C=cloud();if(!C||synced)return;synced=true;C.db.collection('profiles').doc(C.user.uid).get().then(function(d){var cur=(d.exists&&d.data().rec)||{},up={},n=0;
      Object.keys(IDX).forEach(function(k){var b=IDX[k],v=orig(k);if(!(v>0))return;var c=cur[b.id];if(c==null||(b.low?v<c:v>c)){up[b.id]=v;n++}});
      if(n)C.db.collection('profiles').doc(C.user.uid).set({name:C.name||PP.myName(),rec:up},{merge:true}).catch(function(){})}).catch(function(){synced=false})},3000);
  function load(b){if(cache[b.id]&&Date.now()-cache[b.id].t<30000)return Promise.resolve(cache[b.id].rows);var C=PP.cloud;if(!C||!C.db)return Promise.reject('off');
    var fp=new firebase.firestore.FieldPath('rec',b.id);return C.db.collection('profiles').orderBy(fp,b.low?'asc':'desc').limit(10).get().then(function(s){var rows=[];s.forEach(function(d){var x=d.data();if(x.rec&&x.rec[b.id]>0)rows.push({uid:d.id,n:x.name||'?',av:x.av,v:x.rec[b.id]})});cache[b.id]={t:Date.now(),rows:rows};return rows})}
  function render(g){var list=B[g];if(!list)return;var view=document.getElementById('v-'+g);if(!view)return;var box=view.querySelector('.lb');
    if(!box){box=document.createElement('section');box.className='lb';var back=view.querySelector('.back');view.insertBefore(box,back||null)}
    var cur=tab[g]||0,b=IDX[list[cur][0]],mine=orig(b.k),C=cloud();
    box.innerHTML='<div class="lb-head"><h3>Classement</h3>'+(list.length>1?'<div class="lb-tabs">'+list.map(function(x,i){return '<button type="button" data-lbt="'+i+'" class="'+(i===cur?'on':'')+'">'+esc(x[1])+'</button>'}).join('')+'</div>':'')+'</div>'+
      '<ol class="lb-list"><li class="lb-wait">Chargement…</li></ol><p class="lb-me">'+(mine>0?'Ton record : <b>'+fmt(b,mine)+'</b>':'Pas encore de record.')+(C?'':' · <a href="#account" data-go="account">Connecte-toi</a> pour apparaître dans le classement.')+'</p>';
    box.querySelectorAll('[data-lbt]').forEach(function(x){x.onclick=function(){tab[g]=+x.dataset.lbt;render(g)}});
    var me=C&&C.user.uid;load(b).then(function(rows){var ol=box.querySelector('.lb-list');if(!ol)return;if(!rows.length){ol.innerHTML='<li class="lb-wait">Personne pour l\'instant : sois le premier !</li>';return}
      function pic(r,s,c){try{if(r.av&&PP.perso&&PP.perso.img)return PP.perso.img(r.av,s,c)}catch(e){}return '<span class="'+c+' lb-nopic"></span>'}
      /* podium : 2e à gauche, 1er au centre (plus haut), 3e à droite */
      var pod=[1,0,2].map(function(i){var r=rows[i];if(!r)return '<div class="lb-step p'+(i+1)+' empty"></div>';
        return '<div class="lb-step p'+(i+1)+(r.uid===me?' me':'')+'">'+pic(r,64,'lb-ppic')+'<span class="lb-pn">'+esc(r.n)+'</span><b>'+fmt(b,r.v)+'</b><div class="lb-block"><span>'+(i+1)+'</span></div></div>'}).join('');
      var pd=box.querySelector('.lb-podium');if(!pd){pd=document.createElement('div');pd.className='lb-podium';ol.parentNode.insertBefore(pd,ol)}pd.innerHTML=pod;
      var rest=rows.slice(3);
      ol.innerHTML=rest.length?rest.map(function(r,j){var i=j+3;return '<li class="'+(r.uid===me?'me':'')+'"><span class="lb-r">'+(i+1)+'</span>'+pic(r,30,'lb-pic')+'<span class="lb-n">'+esc(r.n)+'</span><b>'+fmt(b,r.v)+'</b></li>'}).join(''):''})
      .catch(function(){var ol=box.querySelector('.lb-list');if(ol)ol.innerHTML='<li class="lb-wait">Classement indisponible pour l\'instant.</li>'})}
  document.addEventListener('pp-go',function(e){var g=e.detail;if(B[g])setTimeout(function(){render(g)},60)});
  if(PP.cloud&&PP.cloud.whenReady)PP.cloud.whenReady(function(){var g=PP.cur&&PP.cur();if(B[g])render(g)});
  PP.lb={render:render,boards:B};
})();
