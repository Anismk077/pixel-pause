/* Pixel Pause — page Admin, visible seulement par le compte admin (vérifié par les règles Firestore, pas par le site) :
   joueurs en ligne, visites, visiteurs uniques, provenance, heures, appareils, jeux les plus lancés, comptes,
   bannir / débannir, bloquer un jeu le temps de le réparer. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,C=PP.cloud,box=$('adm-box'),isAdmin=false,timer=0;
  if(!C||!C.on)return;
  /* l'onglet Admin n'apparaît que si Firestore accepte la lecture de admin/ping (règle réservée à l'admin) */
  var tried='';
  C.on(function(){var k=C.user&&C.verified?C.user.uid:'';if(k===tried)return;tried=k;if(!k){setNav(false);return}
    C.db.collection('admin').doc('ping').get().then(function(){isAdmin=true;setNav(true)},function(){isAdmin=false;setNav(false)})});
  function setNav(on){var b=$('nav-adm');
    if(on&&!b){var nav=document.querySelector('header nav');b=document.createElement('button');b.type='button';b.id='nav-adm';b.dataset.go='admin';b.innerHTML='<svg class="ni" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg><span class="nl">admin</span>';nav.appendChild(b)}
    if(b)b.hidden=!on;if(!on&&PP.cur()==='admin')PP.go('menu')}
  function day(off){var d=new Date();d.setDate(d.getDate()-off);return PP.site.day(d)}
  function label(off){var d=new Date();d.setDate(d.getDate()-off);return d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric'})}
  function games(){var o={};document.querySelectorAll('#tiles .row-game[data-go]').forEach(function(r){var n=r.querySelector('.rg-name');o[r.dataset.go]=n?n.textContent:r.dataset.go});return o}
  function bars(list,max,cls){max=max||Math.max.apply(null,list.map(function(x){return x[1]}).concat([1]));return '<div class="ad-bars '+(cls||'')+'">'+list.map(function(x){return '<div class="ad-bar"><span class="ad-bl">'+esc(x[0])+'</span><span class="ad-bt"><i style="width:'+Math.max(2,x[1]/max*100)+'%"></i></span><b>'+x[1]+'</b></div>'}).join('')+'</div>'}
  function sum(docs,k){var o={};docs.forEach(function(d){var m=d[k]||{};Object.keys(m).forEach(function(s){o[s]=(o[s]||0)+m[s]})});return Object.keys(o).map(function(s){return [s,o[s]]}).sort(function(a,b){return b[1]-a[1]})}
  function render(){
    if(!isAdmin){box.innerHTML='<div class="panel"><p class="muted">Page réservée à l\'admin.</p></div>';return}
    box.innerHTML='<p class="wait">Chargement des stats…</p>';
    var db=C.db,ids=[];for(var i=13;i>=0;i--)ids.push(day(i));
    var now=Date.now();
    Promise.all([
      Promise.all(ids.map(function(id){return db.collection('stats').doc(id).get().then(function(d){return d.exists?d.data():{}})})),
      db.collection('presence').where('t','>',now-130000).get(),
      db.collection('profiles').get(),
      db.collection('banned').get(),
      db.collection('config').doc('site').get(),
      db.collection('rooms').where('t','>',now-60000).get()
    ]).then(function(r){
      var st=r[0],pres=[],profs=[],bans=[],blocked=(r[4].exists&&r[4].data().blocked)||[],rooms=[];
      r[1].forEach(function(d){pres.push(d.data())});r[2].forEach(function(d){var x=d.data();x.uid=d.id;profs.push(x)});r[3].forEach(function(d){var x=d.data();x.uid=d.id;bans.push(x)});r[5].forEach(function(d){rooms.push(d.data())});
      var td=st[13],last7=st.slice(7),G=games();
      var h='<div class="ad-kpi">'+[[pres.length,'en ligne maintenant'],[td.v||0,'visites aujourd\'hui'],[td.u||0,'visiteurs uniques aujourd\'hui'],[last7.reduce(function(a,d){return a+(d.v||0)},0),'visites sur 7 jours'],[profs.length,'comptes'],[td.acc||0,'nouveaux comptes aujourd\'hui'],[rooms.length,'salons ouverts']].map(function(k,i){return '<div class="acc-st" style="--d:'+i*50+'ms"><b>'+k[0]+'</b><span>'+k[1]+'</span></div>'}).join('')+'</div>';
      var mx=Math.max.apply(null,st.map(function(d){return d.v||0}).concat([1]));
      h+='<div class="ad-grid"><div class="panel ad-wide"><div class="acc-h"><b>Visites, 14 derniers jours</b><span class="muted"><i class="ad-k v"></i>visites <i class="ad-k u"></i>visiteurs uniques</span></div><div class="ad-days">'+st.map(function(d,i){return '<div class="ad-day" title="'+(d.v||0)+' visites, '+(d.u||0)+' uniques"><div class="ad-col"><i class="v" style="height:'+((d.v||0)/mx*100)+'%"></i><i class="u" style="height:'+((d.u||0)/mx*100)+'%"></i></div><small>'+esc(label(13-i))+'</small><b>'+(d.v||0)+'</b></div>'}).join('')+'</div></div>';
      var hrs={};last7.forEach(function(d){Object.keys(d.h||{}).forEach(function(k){hrs[k]=(hrs[k]||0)+d.h[k]})});var hm=Math.max.apply(null,Object.keys(hrs).map(function(k){return hrs[k]}).concat([1]));
      h+='<div class="panel ad-wide"><div class="acc-h"><b>À quelle heure on joue (7 jours)</b></div><div class="ad-hours">'+Array.apply(null,Array(24)).map(function(_,i){var v=hrs[i]||0;return '<div class="ad-hr" title="'+i+' h : '+v+' visites"><i style="height:'+(v/hm*100)+'%"></i><small>'+(i%3===0?i+'h':'')+'</small></div>'}).join('')+'</div></div>';
      var REF={direct:'Tapé directement ou lien d\'une appli',google:'Recherche Google',bing:'Recherche Bing',duckduckgo:'DuckDuckGo',instagram:'Instagram',tiktok:'TikTok',snapchat:'Snapchat',youtube:'YouTube',discord:'Discord',whatsapp:'WhatsApp',facebook:'Facebook',twitter:'X / Twitter',github:'GitHub'};
      h+='<div class="panel"><div class="acc-h"><b>D\'où ils viennent (7 jours)</b></div>'+(sum(last7,'ref').length?bars(sum(last7,'ref').map(function(x){return [REF[x[0]]||x[0].replace(/_/g,'.'),x[1]]})):'<p class="muted">Pas encore de données.</p>')+'</div>';
      h+='<div class="panel"><div class="acc-h"><b>Appareils (7 jours)</b></div>'+(sum(last7,'dev').length?bars(sum(last7,'dev').map(function(x){return [x[0]==='mobile'?'Téléphone / tablette':'Ordinateur',x[1]]})):'<p class="muted">Pas encore de données.</p>')+'</div>';
      var gp=sum(last7,'g');
      h+='<div class="panel ad-wide"><div class="acc-h"><b>Jeux les plus lancés (7 jours)</b><span class="muted">Bloquer cache le jeu pour tout le monde</span></div><div class="ad-games">'+Object.keys(G).map(function(id){var n=(gp.filter(function(x){return x[0]===id})[0]||[0,0])[1];return {id:id,n:n}}).sort(function(a,b){return b.n-a.n}).map(function(o){var bl=blocked.indexOf(o.id)>=0,mxg=gp.length?gp[0][1]:1;return '<div class="ad-g'+(bl?' bl':'')+'"><span class="ad-bl">'+esc(G[o.id])+'</span><span class="ad-bt"><i style="width:'+Math.max(1,o.n/Math.max(1,mxg)*100)+'%"></i></span><b>'+o.n+'</b><button type="button" class="mini '+(bl?'primary':'ghost')+'" data-block="'+o.id+'">'+(bl?'Débloquer':'Bloquer')+'</button></div>'}).join('')+'</div></div>';
      h+='<div class="panel"><div class="acc-h"><b>En ligne maintenant</b><span class="muted">'+pres.length+'</span></div><ul class="ad-list">'+(pres.sort(function(a,b){return (b.u?1:0)-(a.u?1:0)}).map(function(p){return '<li><b>'+esc(p.u||'Invité')+'</b><span>'+esc(G[p.p]||{menu:'Accueil',room:'Salon',friends:'Amis',account:'Compte',perso:'Mon perso',settings:'Paramètres',join:'Rejoindre',admin:'Admin'}[p.p]||p.p)+'</span><i>'+(p.m?'📱':'💻')+'</i></li>'}).join('')||'<li class="muted">Personne</li>')+'</ul></div>';
      h+='<div class="panel"><div class="acc-h"><b>Salons ouverts</b><span class="muted">'+rooms.length+'</span></div><ul class="ad-list">'+(rooms.map(function(r){return '<li><b>'+esc(r.name)+'</b><span>'+esc(r.host)+' · '+r.n+' joueur'+(r.n>1?'s':'')+(r.game?' · '+esc(G[r.game]||r.game):'')+'</span><i>'+esc(r.vis)+'</i></li>'}).join('')||'<li class="muted">Aucun salon public ou entre amis</li>')+'</ul></div>';
      h+='<div class="panel ad-wide"><div class="acc-h"><b>Joueurs</b><span class="muted">'+profs.length+' comptes · '+bans.length+' bannis</span></div><input id="ad-q" placeholder="Chercher un pseudo…" autocomplete="off"><div id="ad-players"></div></div></div>';
      box.innerHTML=h;
      box.querySelectorAll('[data-block]').forEach(function(b){b.onclick=function(){var id=b.dataset.block,bl=blocked.indexOf(id)>=0;db.collection('config').doc('site').set({blocked:bl?C.FV.arrayRemove(id):C.FV.arrayUnion(id)},{merge:true}).then(function(){PP.toast((bl?'Débloqué : ':'Bloqué : ')+G[id],'ok');render()}).catch(function(e){PP.toast(C.msg(e),'warn')})}});
      var banned={};bans.forEach(function(b){banned[b.uid]=b});
      function plist(){var q=($('ad-q').value||'').toLowerCase().trim();var l=profs.filter(function(p){return !q||String(p.name||'').toLowerCase().indexOf(q)>=0}).sort(function(a,b){return (b.seen||0)-(a.seen||0)}).slice(0,40);
        $('ad-players').innerHTML='<ul class="ad-list ad-pl">'+l.map(function(p){var b=banned[p.uid],s=p.stats||{};return '<li class="'+(b?'bl':'')+'"><span class="av-wrap" data-uid="'+p.uid+'">'+PP.perso.img(p.av,32,'perso-pic')+'</span><b>'+esc(p.name||'?')+'</b><span>'+(s.p||0)+' parties · vu '+(p.seen?new Date(p.seen).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—')+(b?' · <b class="err">banni</b>'+(b.why?' ('+esc(b.why)+')':''):'')+'</span><button type="button" class="mini '+(b?'ghost':'red')+'" data-ban="'+p.uid+'" data-n="'+esc(p.name||'')+'">'+(b?'Débannir':'Bannir')+'</button></li>'}).join('')+'</ul>';
        $('ad-players').querySelectorAll('[data-uid]').forEach(function(a){a.onclick=function(){PP.card({uid:a.dataset.uid})}});
        $('ad-players').querySelectorAll('[data-ban]').forEach(function(b){b.onclick=function(){var uid=b.dataset.ban;if(banned[uid]){db.collection('banned').doc(uid).delete().then(function(){delete banned[uid];PP.toast('Débanni','ok');plist()});return}
          var why=prompt('Bannir '+b.dataset.n+' ? Raison (facultatif) :','');if(why===null)return;var o={why:why.slice(0,120),t:Date.now(),name:b.dataset.n};db.collection('banned').doc(uid).set(o).then(function(){banned[uid]=o;PP.toast(b.dataset.n+' est banni','ok');plist()}).catch(function(e){PP.toast(C.msg(e),'warn')})}})}
      $('ad-q').oninput=plist;plist();
    }).catch(function(e){box.innerHTML='<div class="panel"><p class="err">Impossible de charger : '+esc(C.msg(e))+'</p></div>'});
  }
  PP.games.admin={open:function(){render();clearInterval(timer);timer=setInterval(function(){if(PP.cur()==='admin'&&!document.hidden&&!(document.activeElement&&document.activeElement.id==='ad-q'))render()},60000)},close:function(){clearInterval(timer)}};
})();
