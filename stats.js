/* Pixel Pause — fréquentation du site (anonyme) : visites, provenance, heures, jeux lancés, joueurs en ligne,
   temps de jeu de chacun, jeux bloqués par l'admin. Tout passe par Firestore (PP.cloud.db). */
PP.site=(function(){
  'use strict';
  var C=PP.cloud,S={online:0,blocked:[],listeners:[]};
  var PAGES={menu:1,room:1,join:1,perso:1,friends:1,account:1,settings:1,admin:1};
  function emit(){S.listeners.forEach(function(f){try{f(S)}catch(e){}})}
  S.on=function(f){S.listeners.push(f)};
  function day(d){d=d||new Date();return 'd'+d.getFullYear()+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2)}
  S.day=day;
  function sid(){var s=null;try{s=localStorage.getItem('pp-sid');if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('pp-sid',s)}}catch(e){s='x'+Math.random().toString(36).slice(2)}return s}
  var mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&innerWidth<900);
  function ref(){var r=document.referrer||'';if(!r)return 'direct';var h='';try{h=new URL(r).hostname.replace(/^www\./,'')}catch(e){return 'autre'}
    if(h===location.hostname)return null;if(/google\./.test(h))return 'google';if(/bing\./.test(h))return 'bing';if(/duckduckgo/.test(h))return 'duckduckgo';if(/instagram/.test(h))return 'instagram';if(/tiktok/.test(h))return 'tiktok';
    if(/snapchat/.test(h))return 'snapchat';if(/youtube|youtu\.be/.test(h))return 'youtube';if(/discord/.test(h))return 'discord';if(/whatsapp/.test(h))return 'whatsapp';if(/facebook|fb\./.test(h))return 'facebook';if(/(^|\.)t\.co$|twitter|x\.com/.test(h))return 'twitter';if(/github/.test(h))return 'github';return h.replace(/[.\/]/g,'_').slice(0,30)}
  function bump(db,o){var FV=C.FV,data={};Object.keys(o).forEach(function(k){var v=o[k];if(v==null)return;if(typeof v==='object'){data[k]={};Object.keys(v).forEach(function(s){data[k][s]=FV.increment(v[s])})}else data[k]=FV.increment(v)});
    return db.collection('stats').doc(day()).set(data,{merge:true}).catch(function(){})}
  S.newAccount=function(){C.whenReady(function(db){bump(db,{acc:1})})};
  if(!C||!C.whenReady)return S;
  C.whenReady(function(db){
    /* une visite par onglet ouvert ; un visiteur unique par jour et par navigateur */
    try{if(!sessionStorage.getItem('pp-visit')){sessionStorage.setItem('pp-visit','1');var r=ref(),o={v:1,h:{},dev:{}},hh=String(new Date().getHours());o.h[hh]=1;o.dev[mobile?'mobile':'ordi']=1;if(r){o.ref={};o.ref[r]=1}
      if(localStorage.getItem('pp-vday')!==day()){localStorage.setItem('pp-vday',day());o.u=1}bump(db,o)}}catch(e){}
    /* joueurs en ligne : chaque navigateur signale sa présence toutes les 60 s */
    var me=sid();
    function beat(){if(document.hidden)return;var v=PP.cur();db.collection('presence').doc(me).set({t:Date.now(),p:v||'menu',m:mobile,u:(C.name||'').slice(0,14)}).catch(function(){})}
    beat();setInterval(beat,60000);document.addEventListener('visibilitychange',function(){if(!document.hidden)beat()});
    var gT=0;document.addEventListener('pp-go',function(e){var v=e.detail;clearTimeout(gT);gT=setTimeout(beat,1500);
      if(v&&!PAGES[v]){var o={g:{}};o.g[v]=1;bump(db,o)}});
    function count(){var q=db.collection('presence').where('t','>',Date.now()-130000);var p=q.count?q.count().get().then(function(s){return s.data().count}):q.get().then(function(s){return s.size});
      return p.then(function(n){S.online=Math.max(1,n);emit();return S.online}).catch(function(){})}
    S.refresh=count;count();setInterval(function(){if(!document.hidden&&(PP.cur()==='room'||PP.cur()==='menu'||PP.cur()==='admin'))count()},45000);
    /* jeux bloqués par l'admin */
    db.collection('config').doc('site').onSnapshot(function(d){S.blocked=(d.exists&&d.data().blocked)||[];applyBlock();emit()},function(){});
  });
  /* temps de jeu : 10 s comptées toutes les 10 s passées dans un jeu, onglet visible */
  setInterval(function(){var v=PP.cur();if(v&&!PAGES[v]&&!document.hidden)PP.store('play-time',PP.store('play-time')+10)},10000);
  function applyBlock(){var b=S.blocked;document.querySelectorAll('#tiles [data-go]').forEach(function(r){r.classList.toggle('blocked',b.indexOf(r.dataset.go)>=0)});if(b.indexOf(PP.cur())>=0){PP.toast('Ce jeu est en maintenance, reviens plus tard','warn');PP.go('menu')}}
  document.addEventListener('pp-go',function(e){if(S.blocked.indexOf(e.detail)>=0){setTimeout(function(){PP.toast('Ce jeu est en maintenance, reviens plus tard','warn');PP.go('menu')},0)}});
  return S;
})();
