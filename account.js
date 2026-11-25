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
  /* ---------- Compte en ligne : connexion, inscription, mail confirmé, nouvel appareil ---------- */
  var cmode='login',cloudSig='';
  var SEC='<p class="muted cl-sec"><b>Sécurisé :</b> ton mot de passe est vérifié par Google (Firebase), le site ne le voit jamais. Ton mail doit être confirmé, et chaque nouvel appareil doit être validé par un lien envoyé sur ton mail.</p>';
  function cloudHtml(CL){
    var x='<div class="panel cloud-box" id="cloud-box"><h3 class="t">Compte en ligne</h3>';
    var st=CL.state;
    if(st==='loading'||st==='checking'){x+='<p class="wait">Connexion…</p>'}
    else if(st==='need-device'){x+='<div class="cl-step"><b class="cl-big">Nouvel appareil</b><p>Pour protéger ton compte, on vient d\'envoyer un lien de confirmation à <b>'+esc(CL.pendingEmail||'ton adresse')+'</b>.</p><p>Ouvre ce mail <b>sur cet appareil</b> et clique sur le lien : la connexion se termine toute seule. Le lien marche pendant une heure. Regarde aussi dans les spams.</p><button type="button" class="ghost" id="cl-cancel">Revenir à la connexion</button></div>'}
    else if(st==='need-name'){x+='<p>Dernière étape : choisis ton pseudo. C\'est lui que tes amis verront et qu\'ils taperont pour t\'ajouter.</p><form id="cl-nameform"><label class="lbl" for="cl-name">Pseudo</label><div class="row"><input id="cl-name" maxlength="14" autocomplete="nickname" placeholder="Ton pseudo" value="'+esc(CL.user&&CL.user.displayName||PP.profile()||'')+'"><button type="submit" class="primary">Valider</button></div><p class="err" id="cl-err"></p></form><button type="button" class="ghost" id="cl-out" style="margin-top:8px">Annuler et se déconnecter</button>'}
    else if(CL.user&&CL.name){
      x+='<div class="cl-me"><div><span class="lbl">Connecté</span><div class="cl-big">'+esc(CL.name)+'</div><p class="muted">'+esc(CL.user.email||'')+(CL.verified?' · <span class="cl-ok">mail confirmé</span>':'')+'</p></div></div>';
      if(!CL.verified)x+='<div class="cl-warn"><b>Confirme ton adresse mail.</b> On t\'a envoyé un lien à '+esc(CL.user.email)+'. Tant que ce n\'est pas fait, les amis, les messages et les notes sont bloqués.<div class="row"><button type="button" class="primary" id="cl-chk">J\'ai cliqué sur le lien</button><button type="button" class="ghost" id="cl-rev">Renvoyer le mail</button></div></div>';
      x+='<p>Tes records, tes stats, ton perso, tes réglages et ta survie sont sauvegardés en ligne et te suivent sur tous tes appareils.</p><p class="muted">'+(st==='error'?'Problème de synchro : '+esc(CL.err||''):CL.lastSync?'Dernière sauvegarde : '+new Date(CL.lastSync).toLocaleTimeString('fr-FR'):'Synchronisation…')+'</p>'+
        '<div class="row"><button type="button" class="ghost" id="cl-sync">Sauvegarder maintenant</button>'+(CL.user.providerData.some(function(p){return p.providerId==='password'})?'<button type="button" class="ghost" id="cl-pw">Changer de mot de passe</button>':'')+'<button type="button" class="ghost" id="cl-out">Se déconnecter</button></div>';
    }
    else{
      var su=cmode==='signup';
      x+='<div class="seg cl-tabs"><button type="button" data-cm="login" class="'+(su?'':'on')+'">Se connecter</button><button type="button" data-cm="signup" class="'+(su?'on':'')+'">Créer un compte</button></div>';
      if(CL.note)x+='<p class="cl-warn">'+esc(CL.note)+'</p>';
      x+='<form id="cl-form" class="cl-form" novalidate>'+
        (su?'<label class="lbl" for="cl-name">Pseudo</label><input id="cl-name" maxlength="14" autocomplete="nickname" placeholder="Ce que tes amis verront" value="'+esc(PP.profile()||'')+'">':'')+
        '<label class="lbl" for="cl-mail">Adresse mail</label><input id="cl-mail" type="email" autocomplete="email" placeholder="toi@exemple.fr">'+
        '<label class="lbl" for="cl-pass">Mot de passe</label><div class="cl-pw"><input id="cl-pass" type="password" autocomplete="'+(su?'new-password':'current-password')+'" placeholder="'+(su?'8 caractères, une lettre et un chiffre':'Ton mot de passe')+'"><button type="button" class="mini ghost" id="cl-eye">Voir</button></div>'+
        (su?'<div class="cl-meter" id="cl-meter"><i></i></div><label class="lbl" for="cl-pass2">Confirme le mot de passe</label><input id="cl-pass2" type="password" autocomplete="new-password">':'')+
        '<p class="err" id="cl-err"></p><div class="row cl-go"><button type="submit" class="primary" id="cl-submit">'+(su?'Créer mon compte':'Se connecter')+'</button>'+(su?'':'<button type="button" class="linkbtn" id="cl-forgot">Mot de passe oublié ?</button>')+'</div></form>'+
        '<div class="cl-or">ou</div><button type="button" class="gbtn" id="cl-google"><span>G</span> Continuer avec Google</button>'+SEC;
    }
    return x+'</div>';
  }
  function cErr(m,ok){var e=$('cl-err');if(e){e.textContent=m||'';e.className=ok?'ok':'err'}}
  function bindCloud(CL){
    cloudSig=sig(CL);
    var on=function(id,f){var b=$(id);if(b)b.onclick=f};
    box.querySelectorAll('[data-cm]').forEach(function(b){b.onclick=function(){var m=$('cl-mail')&&$('cl-mail').value;cmode=b.dataset.cm;CL.note='';render();if(m&&$('cl-mail'))$('cl-mail').value=m}});
    on('cl-eye',function(){var p=$('cl-pass'),p2=$('cl-pass2'),show=p.type==='password';p.type=show?'text':'password';if(p2)p2.type=p.type;this.textContent=show?'Cacher':'Voir'});
    var pi=$('cl-pass'),me=$('cl-meter');if(pi&&me)pi.oninput=function(){var v=pi.value,s=0;if(v.length>=8)s++;if(v.length>=12)s++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))s++;if(/\d/.test(v))s++;if(/[^\w]/.test(v))s++;me.firstChild.style.width=(s*20)+'%';me.className='cl-meter s'+s};
    var f=$('cl-form');if(f)f.onsubmit=function(e){e.preventDefault();
      var m=$('cl-mail').value.trim(),p=$('cl-pass').value,btn=$('cl-submit');
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m))return cErr('Adresse mail invalide.');
      if(cmode==='signup'){var n=$('cl-name').value;
        if(CL.cleanName(n).length<2)return cErr('Choisis un pseudo d\'au moins 2 lettres.');
        if(!CL.goodPass(p))return cErr('Mot de passe : 8 caractères minimum, avec au moins une lettre et un chiffre.');
        if(p!==$('cl-pass2').value)return cErr('Les deux mots de passe ne sont pas pareils.');
        btn.disabled=true;cErr('Création du compte…',1);
        CL.signup(n,m,p).then(function(){PP.toast('Compte créé. Regarde tes mails pour confirmer ton adresse.','ok');sfx.play('win')}).catch(function(e){btn.disabled=false;cErr(CL.msg(e))});
      }else{if(!p)return cErr('Entre ton mot de passe.');btn.disabled=true;cErr('Connexion…',1);CL.login(m,p).catch(function(e){btn.disabled=false;cErr(CL.msg(e))})}
    };
    on('cl-forgot',function(){var m=$('cl-mail').value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m))return cErr('Tape d\'abord ton adresse mail au-dessus.');CL.reset(m).then(function(){cErr('Si un compte existe avec '+m+', un mail pour changer le mot de passe vient de partir.',1)}).catch(function(e){cErr(CL.msg(e))})});
    on('cl-google',function(){var g=this;g.disabled=true;CL.google().catch(function(e){g.disabled=false;cErr(CL.msg(e))})});
    on('cl-cancel',function(){CL.cancel()});
    var nf=$('cl-nameform');if(nf)nf.onsubmit=function(e){e.preventDefault();cErr('…',1);CL.claimName($('cl-name').value).catch(function(e2){cErr(CL.msg(e2))})};
    on('cl-out',function(){CL.logout()});
    on('cl-sync',function(){CL.syncNow().then(function(){PP.toast('Sauvegardé en ligne','ok')})});
    on('cl-pw',function(){CL.reset(CL.user.email).then(function(){PP.toast('Mail envoyé à '+CL.user.email+' pour changer ton mot de passe','ok')}).catch(function(e){PP.toast(CL.msg(e),'warn')})});
    on('cl-rev',function(){CL.resendVerify().then(function(){PP.toast('Mail renvoyé','ok')}).catch(function(e){PP.toast(CL.msg(e),'warn')})});
    on('cl-chk',function(){CL.checkVerified().then(function(ok){PP.toast(ok?'Adresse confirmée, merci !':'Pas encore confirmée : clique sur le lien dans le mail.',ok?'ok':'warn');render()})});
  }
  function sig(CL){return [CL.state,CL.user&&CL.user.uid,CL.name,CL.verified,CL.note,CL.pendingEmail].join('|')}
  function switchTo(n){try{localStorage.setItem('pp-profile',n)}catch(e){}location.hash='account';location.reload()}
  function render(){
    var cur=PP.profile(),list=profiles(),tot={p:0,w:0};
    GAMES.forEach(function(g){tot.p+=PP.store('st-'+g.id+'-parties');tot.w+=PP.store('st-'+g.id+'-win')});
    var x='<div class="acc-top"><div><span class="lbl">Compte</span><div class="acc-name">'+(cur?esc(cur):'Invité')+'</div><p class="muted">'+(cur?'Tes records, tes stats, tes skins et ta survie sont rangés dans ce compte.':'Tu joues sans compte. Crée-en un pour garder tes records et ta survie à ton nom.')+'</p></div>'+
      '<div class="acc-big"><div><b>'+tot.p+'</b><span>parties</span></div><div><b>'+tot.w+'</b><span>victoires</span></div><div><b>'+PP.store('st-surv-kills')+'</b><span>créatures abattues</span></div></div></div>';
    if(PP.perso)x+='<div class="panel acc-perso">'+PP.perso.img(PP.perso.get(),84,'perso-pic big')+'<div><h3 class="t">Mon perso</h3><p class="muted">Ton personnage : on le voit dans les salons et il est utilisé dans les jeux 3D. Il est gardé dans ce compte.</p><button type="button" class="primary" data-go="perso">Personnaliser mon perso</button></div></div>';
    var CL=PP.cloud,online=CL&&CL.user&&CL.name&&(CL.state==='sync'||CL.state==='error');
    if(CL&&CL.state!=='off')x+=cloudHtml(CL);
    x+='<h3 class="t">Statistiques</h3><div class="acc-table"><div class="acc-row head"><span>Jeu</span><span>Parties</span><span>Victoires</span><span>Record</span></div>'+GAMES.map(function(g){return '<div class="acc-row"><span>'+esc(g.n)+'</span><span>'+PP.store('st-'+g.id+'-parties')+'</span><span title="'+esc(g.win)+'">'+(g.win==='—'?'—':PP.store('st-'+g.id+'-win'))+'</span><span>'+esc(g.rec())+'</span></div>'}).join('')+'</div>';
    x+='<details class="acc-local"'+(CL&&CL.state!=='off'?'':' open')+'><summary>'+(CL&&CL.state!=='off'?'Jouer sans compte en ligne (profils gardés seulement sur cet appareil)':'Profils sur cet appareil')+'</summary>';
    x+='<div class="acc-cols"><div class="panel"><h3 class="t">Créer un profil local</h3><label class="lbl" for="acc-new">Pseudo</label><input id="acc-new" maxlength="14" placeholder="Ton pseudo"><label class="lbl" for="acc-pin" style="margin-top:10px">Code à 4 chiffres (facultatif)</label><input id="acc-pin" maxlength="4" inputmode="numeric" placeholder="Pour que personne ne joue sur ton compte"><p class="err" id="acc-err"></p><button type="button" id="acc-create">Créer et jouer</button></div>';
    x+='<div class="panel"><h3 class="t">Changer de compte</h3>'+(list.length?'<div class="acc-list">'+list.map(function(p){return '<div class="acc-item'+(p.n===cur?' on':'')+'"><b>'+esc(p.n)+'</b>'+(p.pin?'<small>protégé</small>':'')+(p.n===cur?'<span class="tag">connecté</span>':'<button type="button" class="ink" data-sw="'+esc(p.n)+'">Jouer</button>')+'<button type="button" class="ghost" data-del="'+esc(p.n)+'" aria-label="Supprimer">×</button></div>'}).join('')+'</div>':'<p class="muted">Aucun compte pour l\'instant.</p>')+
      (cur?'<button type="button" class="ghost" id="acc-out" style="margin-top:10px">Se déconnecter (jouer en invité)</button>':'')+'</div></div>';
    x+='<div class="panel"><h3 class="t">Emporter ton compte sur un autre appareil</h3><p class="muted">Les comptes sont gardés dans ce navigateur. Copie ce code, puis colle-le sur l\'autre appareil (Importer) : tu retrouves tout, survie comprise.</p><div class="row"><button type="button" class="ink" id="acc-exp">Copier mon code de sauvegarde</button><button type="button" class="ghost" id="acc-imp">Importer un code</button></div><textarea id="acc-code" rows="3" placeholder="Colle ici un code de sauvegarde puis clique sur Importer" hidden></textarea></div></details>';
    box.innerHTML=x;
    if(CL)bindCloud(CL);
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
  if(PP.cloud&&PP.cloud.on)PP.cloud.on(function(CL){if(PP.cur()==='account'&&sig(CL)!==cloudSig)render();var nb2=$('nav-acc');if(nb2)nb2.textContent=CL.name||PP.profile()||'compte'});
  PP.games.account={open:render};
})();
