/* Pixel Pause — comptes (profils) et statistiques.
   Les comptes sont gardés dans ce navigateur. Un code de sauvegarde permet de les emporter sur un autre appareil. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,box=$('acc-box');
  var GAMES=[
    {id:'surv',n:'Survie',rec:function(){var d=PP.store('sv-best');return d?d+' jour'+(d>1?'s':''):'—'},win:'Sauvé par l\'hélico'},
    {id:'party',n:'Dernier Debout',rec:function(){return '—'},win:'Dernier debout'},
    {id:'fps',n:'Zone Morte',rec:function(){var z=PP.store('fps-zombie'),b=PP.store('fps-br');return (z?z+' zombies':'—')+(b?' · top '+b+' en BR':'')},win:'Battle royale gagnée'},
    {id:'sumo',n:'Sumo Arena',rec:function(){return '—'},win:'Match gagné'},
    {id:'foot',n:'Foot 2v2',rec:function(){return '—'},win:'Match gagné'},
    {id:'kart',n:'Pixel Kart',rec:function(){var t=PP.store('kt-best');return t?PP.fmtTime(t/1000):'—'},win:'Course gagnée'},
    {id:'run',n:'Néon Rush',rec:function(){var r=PP.store('rn-best');return r?r+' pts':'—'},win:'Course en salon gagnée'},
    {id:'time',n:'Quand et où',rec:function(){var t=PP.store('tg-best');return t?t.toLocaleString('fr-FR')+' pts':'—'},win:'35 000 pts en solo ou partie en salon gagnée'},
    {id:'geo',n:'Devine où',rec:function(){var g=PP.store('geo-best');return g?g.toLocaleString('fr-FR')+' pts':'—'},win:'Partie en salon gagnée'},
    {id:'snake',n:'Paquet Snake',rec:function(){var s=PP.store('sn-best');return s?s+' pts':'—'},win:'—'},
    {id:'imp',n:'Mot imposteur',rec:function(){return '—'},win:'—'},
    {id:'prob',n:'Le plus probable',rec:function(){return '—'},win:'—'}
  ].concat((window.ARCADE_LIST||[]).map(function(g){return {id:g.id,n:g.n,rec:function(){var k=Object.keys(localStorage).filter(function(x){return x.indexOf(PP.key('ag-'+g.id+'-'))===0})[0];return k?localStorage.getItem(k):'—'},win:'Partie gagnée'}}));
  function profiles(){try{return JSON.parse(localStorage.getItem('pp-profiles'))||[]}catch(e){return []}}
  function saveProfiles(l){try{localStorage.setItem('pp-profiles',JSON.stringify(l))}catch(e){}}
  function h(s){var x=0;for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return String(x)}
  function switchTo(n){try{localStorage.setItem('pp-profile',n)}catch(e){}location.hash='account';location.reload()}
  function render(){
    var cur=PP.profile(),list=profiles(),tot={p:0,w:0};
    GAMES.forEach(function(g){tot.p+=PP.store('st-'+g.id+'-parties');tot.w+=PP.store('st-'+g.id+'-win')});
    var x='<div class="acc-top"><div><span class="lbl">Compte</span><div class="acc-name">'+(cur?esc(cur):'Invité')+'</div><p class="muted">'+(cur?'Tes records, tes stats, tes skins et ta survie sont rangés dans ce compte.':'Tu joues sans compte. Crée-en un pour garder tes records et ta survie à ton nom.')+'</p></div>'+
      '<div class="acc-big"><div><b>'+tot.p+'</b><span>parties</span></div><div><b>'+tot.w+'</b><span>victoires</span></div><div><b>'+PP.store('st-surv-kills')+'</b><span>créatures abattues</span></div></div></div>';
    var CL=PP.cloud;
    if(CL&&CL.state!=='off'){
      x+='<div class="panel cloud-box"><h3 class="t">Compte en ligne</h3>';
      if(CL.user){x+='<p>Connecté avec <b>'+esc(CL.user.email||CL.user.displayName||'ton compte')+'</b>. Tes records, stats, réglages et ta survie sont sauvegardés en ligne et te suivent sur tous tes appareils.</p><p class="muted">'+(CL.state==='error'?'Problème de synchro : '+esc(CL.err||''):CL.lastSync?'Dernière synchro : '+new Date(CL.lastSync).toLocaleTimeString('fr-FR'):'Synchronisation…')+'</p><div class="row"><button type="button" class="ghost" id="cl-sync">Synchroniser maintenant</button><button type="button" class="ghost" id="cl-out">Se déconnecter</button></div>'}
      else if(CL.state==='loading')x+='<p class="muted">Chargement…</p>';
      else{x+='<p>Connecte-toi pour garder tes records et ta survie en ligne, sur tous tes appareils.</p><button type="button" class="gbtn" id="cl-google"><span>G</span> Continuer avec Google</button><div class="cl-or">ou</div><label class="lbl" for="cl-mail">Adresse mail</label><div class="row"><input id="cl-mail" type="email" placeholder="toi@exemple.fr" autocomplete="email"><button type="button" id="cl-send">Recevoir un lien de connexion</button></div><p class="muted" id="cl-msg">Pas de mot de passe : tu reçois un lien sécurisé par mail, tu cliques dessus et c\'est bon.</p>'}
      x+='</div>';
    }
    x+='<h3 class="t">Statistiques</h3><div class="acc-table"><div class="acc-row head"><span>Jeu</span><span>Parties</span><span>Victoires</span><span>Record</span></div>'+GAMES.map(function(g){return '<div class="acc-row"><span>'+esc(g.n)+'</span><span>'+PP.store('st-'+g.id+'-parties')+'</span><span title="'+esc(g.win)+'">'+(g.win==='—'?'—':PP.store('st-'+g.id+'-win'))+'</span><span>'+esc(g.rec())+'</span></div>'}).join('')+'</div>';
    x+='<div class="acc-cols"><div class="panel"><h3 class="t">Créer un compte</h3><label class="lbl" for="acc-new">Pseudo</label><input id="acc-new" maxlength="14" placeholder="Ton pseudo"><label class="lbl" for="acc-pin" style="margin-top:10px">Code à 4 chiffres (facultatif)</label><input id="acc-pin" maxlength="4" inputmode="numeric" placeholder="Pour que personne ne joue sur ton compte"><p class="err" id="acc-err"></p><button type="button" id="acc-create">Créer et jouer</button></div>';
    x+='<div class="panel"><h3 class="t">Changer de compte</h3>'+(list.length?'<div class="acc-list">'+list.map(function(p){return '<div class="acc-item'+(p.n===cur?' on':'')+'"><b>'+esc(p.n)+'</b>'+(p.pin?'<small>protégé</small>':'')+(p.n===cur?'<span class="tag">connecté</span>':'<button type="button" class="ink" data-sw="'+esc(p.n)+'">Jouer</button>')+'<button type="button" class="ghost" data-del="'+esc(p.n)+'" aria-label="Supprimer">×</button></div>'}).join('')+'</div>':'<p class="muted">Aucun compte pour l\'instant.</p>')+
      (cur?'<button type="button" class="ghost" id="acc-out" style="margin-top:10px">Se déconnecter (jouer en invité)</button>':'')+'</div></div>';
    x+='<div class="panel"><h3 class="t">Emporter ton compte sur un autre appareil</h3><p class="muted">Les comptes sont gardés dans ce navigateur. Copie ce code, puis colle-le sur l\'autre appareil (Importer) : tu retrouves tout, survie comprise.</p><div class="row"><button type="button" class="ink" id="acc-exp">Copier mon code de sauvegarde</button><button type="button" class="ghost" id="acc-imp">Importer un code</button></div><textarea id="acc-code" rows="3" placeholder="Colle ici un code de sauvegarde puis clique sur Importer" hidden></textarea></div>';
    box.innerHTML=x;
    if(CL){var g=$('cl-google');if(g)g.onclick=function(){g.disabled=true;CL.google().catch(function(e){g.disabled=false;PP.toast('Connexion annulée','warn')})};
      var se=$('cl-send');if(se)se.onclick=function(){var m=$('cl-mail').value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)){$('cl-msg').textContent='Adresse mail invalide.';return}se.disabled=true;CL.email(m).then(function(){$('cl-msg').innerHTML='<b>Lien envoyé à '+esc(m)+'</b> : ouvre ton mail et clique dessus (regarde aussi dans les spams).'}).catch(function(e){se.disabled=false;$('cl-msg').textContent='Envoi impossible : '+(e&&e.message||e)})};
      var so=$('cl-out');if(so)so.onclick=function(){CL.logout()};var sy=$('cl-sync');if(sy)sy.onclick=function(){CL.syncNow();PP.toast('Sauvegardé en ligne','ok')}}
    $('acc-create').onclick=function(){
      var n=$('acc-new').value.trim().replace(/[^\wÀ-ÿ .-]/g,'').slice(0,14),pin=$('acc-pin').value.trim();
      if(n.length<2){$('acc-err').textContent='Choisis un pseudo d\'au moins 2 lettres.';return}
      if(pin&&!/^\d{4}$/.test(pin)){$('acc-err').textContent='Le code doit faire 4 chiffres.';return}
      var l=profiles();if(l.some(function(p){return p.n.toLowerCase()===n.toLowerCase()})){$('acc-err').textContent='Ce pseudo existe déjà ici.';return}
      l.push({n:n,pin:pin?h(n+pin):null,t:Date.now()});saveProfiles(l);try{localStorage.setItem('pp-p-'+n+'-name',n)}catch(e){}
      sfx.play('win');switchTo(n);
    };
    box.querySelectorAll('[data-sw]').forEach(function(b){b.onclick=function(){var p=profiles().filter(function(q){return q.n===b.dataset.sw})[0];if(!p)return;if(p.pin){var c=prompt('Code à 4 chiffres de '+p.n);if(c===null)return;if(h(p.n+c)!==p.pin){PP.toast('Mauvais code','warn');return}}switchTo(p.n)}});
    box.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){var n=b.dataset.del,p=profiles().filter(function(q){return q.n===n})[0];if(!p)return;if(p.pin){var c=prompt('Code de '+n+' pour supprimer le compte');if(c===null||h(n+c)!==p.pin){PP.toast('Mauvais code','warn');return}}
      if(!confirm('Supprimer le compte '+n+' et toutes ses données (records, survie) ? C\'est définitif.'))return;
      saveProfiles(profiles().filter(function(q){return q.n!==n}));try{Object.keys(localStorage).forEach(function(k){if(k.indexOf('pp-p-'+n+'-')===0)localStorage.removeItem(k)})}catch(e){}
      if(PP.profile()===n)switchTo('');else render()}});
    var out=$('acc-out');if(out)out.onclick=function(){switchTo('')};
    $('acc-exp').onclick=function(){
      var cur2=PP.profile(),pre=cur2?'pp-p-'+cur2+'-':'pp-',data={};
      Object.keys(localStorage).forEach(function(k){if(k.indexOf(pre)===0&&(cur2||(k.indexOf('pp-p-')!==0&&k!=='pp-profiles'&&k!=='pp-profile')))data[k.slice(pre.length)]=localStorage.getItem(k)});
      var me=profiles().filter(function(p){return p.n===cur2})[0];
      var code='PP1.'+btoa(unescape(encodeURIComponent(JSON.stringify({n:cur2||'',pin:me?me.pin:null,d:data}))));
      var ta=$('acc-code');ta.hidden=false;ta.value=code;ta.select();try{navigator.clipboard.writeText(code)}catch(e){document.execCommand('copy')}PP.toast('Code copié','ok');
    };
    $('acc-imp').onclick=function(){
      var ta=$('acc-code');if(ta.hidden){ta.hidden=false;ta.value='';ta.focus();return}
      try{var s=ta.value.trim();if(s.indexOf('PP1.')!==0)throw 0;var o=JSON.parse(decodeURIComponent(escape(atob(s.slice(4)))));var n=o.n||'Importé';
        var l=profiles().filter(function(p){return p.n!==n});l.push({n:n,pin:o.pin||null,t:Date.now()});saveProfiles(l);
        Object.keys(o.d||{}).forEach(function(k){localStorage.setItem('pp-p-'+n+'-'+k,o.d[k])});PP.toast('Compte '+n+' importé','ok');switchTo(n)}
      catch(e){PP.toast('Ce code n\'est pas valide','warn')}
    };
  }
  /* bouton du compte dans l'en-tête */
  var nb=$('nav-acc');if(nb)nb.textContent=PP.profile()?PP.profile():'compte';
  if(PP.cloud&&PP.cloud.on)PP.cloud.on(function(){if(PP.cur()==='account')render();var nb2=$('nav-acc');if(nb2&&PP.cloud.user)nb2.textContent=PP.profile()||'compte'});
  PP.games.account={open:render};
})();
