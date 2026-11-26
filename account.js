/* Pixel Pause — page Compte : ton perso en 3D, ton compte en ligne, tes stats, tes amis.
   Les profils locaux (sans compte en ligne) restent possibles, rangés en bas. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,box=$('acc-box');
  var GAMES=[
    {id:'fps',n:'Zone Morte',rec:function(){var z=PP.store('fps-zombie');return z?z+' zombies':''},win:'—'},
    {id:'surv',n:'Survie',rec:function(){var d=PP.store('sv-best');return d?d+' jour'+(d>1?'s':''):''},win:'Sauvé par l\'hélico'},
    {id:'party',n:'Dernier Debout',rec:function(){return ''},win:'Dernier debout'},
    {id:'sumo',n:'Sumo Arena',rec:function(){return ''},win:'Match gagné'},
    {id:'foot',n:'Foot 2v2',rec:function(){return ''},win:'Match gagné'},
    {id:'kart',n:'Pixel Kart',rec:function(){var t=PP.store('kt-best');return t?PP.fmtTime(t/1000):''},win:'Course gagnée'},
    {id:'run',n:'Néon Rush',rec:function(){var r=PP.store('rn-best');return r?r+' pts':''},win:'Course en salon gagnée'},
    {id:'time',n:'Quand et où',rec:function(){var t=PP.store('tg-best');return t?t.toLocaleString('fr-FR')+' pts':''},win:'35 000 pts en solo ou partie en salon gagnée'},
    {id:'geo',n:'Devine où',rec:function(){var g=PP.store('geo-best');return g?g.toLocaleString('fr-FR')+' pts':''},win:'Partie en salon gagnée'},
    {id:'snake',n:'Paquet Snake',rec:function(){var s=PP.store('sn-best');return s?s+' pts':''},win:'—'},
    {id:'imp',n:'Mot imposteur',rec:function(){return ''},win:'—'},
    {id:'prob',n:'Le plus probable',rec:function(){return ''},win:'—'}
  ].concat((window.ARCADE_LIST||[]).map(function(g){return {id:g.id,n:g.n,rec:function(){var k=Object.keys(localStorage).filter(function(x){return x.indexOf(PP.key('ag-'+g.id+'-'))===0})[0];return k?localStorage.getItem(k):''},win:'Partie gagnée'}}));
  var THUMB={};'arch bowl bricks c4 draw foot fps geo golf hockey hoops imp kart maze memory mines navale party plane pong pool prob quiz reflex run snake stack sumo surv tanks time typing'.split(' ').forEach(function(k){THUMB[k]=1});
  function profiles(){try{return JSON.parse(localStorage.getItem('pp-profiles'))||[]}catch(e){return []}}
  function saveProfiles(l){try{localStorage.setItem('pp-profiles',JSON.stringify(l))}catch(e){}}
  function h(s){var x=0;for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return String(x)}
  function switchTo(n){try{localStorage.setItem('pp-profile',n)}catch(e){}location.hash='account';location.reload()}
  function sig(CL){return [CL.state,CL.user&&CL.user.uid,CL.name,CL.verified,(CL.friends||[]).map(function(f){return f.uid+f.status}).join(',')].join('|')}
  var cloudSig='',stg=null;

  function friendsHtml(CL){
    if(!(CL&&CL.user&&CL.verified))return '';
    var fr=(CL.friends||[]).filter(function(f){return f.status==='friends'}).sort(function(a,b){return CL.online(b)-CL.online(a)}),req=(CL.friends||[]).filter(function(f){return f.status==='pending_in'}).length;
    return '<div class="acc-box2 acc-fr"><div class="acc-h"><b>Mes amis</b><button type="button" class="mini ghost" data-go="friends">'+(req?req+' demande'+(req>1?'s':'')+' · ':'')+'Tout voir →</button></div>'+
      (fr.length?'<div class="acc-frl">'+fr.slice(0,8).map(function(f){var on=CL.online(f);return '<button type="button" class="acc-fi" data-go="friends" title="'+esc((f.prof&&f.prof.name)||f.name)+'">'+PP.perso.img(f.prof&&f.prof.av,44,'perso-pic')+'<i class="'+(on?'on':'')+'"></i><span>'+esc((f.prof&&f.prof.name)||f.name)+'</span></button>'}).join('')+'</div>'
        :'<p class="muted">Pas encore d\'amis. Ajoute tes potes avec leur pseudo.</p><button type="button" class="ghost" data-go="friends">Ajouter un ami</button>')+'</div>';
  }
  function render(){
    var CL=PP.cloud,cur=PP.profile(),list=profiles(),tot={p:0,w:0,g:0};
    GAMES.forEach(function(g){var p=PP.store('st-'+g.id+'-parties');tot.p+=p;tot.w+=PP.store('st-'+g.id+'-win');if(p)tot.g++});
    var online=!!(CL&&CL.user&&CL.name),loading=CL&&(CL.state==='loading'||CL.state==='checking');
    var name=online?CL.name:(cur||'Invité');
    var x='<div class="acc-hero">';
    /* carte du perso */
    x+='<div class="acc-card"><div class="acc-stage"><canvas id="acc-cv"></canvas></div><div class="acc-id"><span class="lbl">'+(online?'Compte en ligne':cur?'Profil local':'Pas connecté')+'</span><div class="acc-name">'+esc(name)+'</div>'+
      (online?'<p class="muted acc-mail">'+esc(CL.user.email||'')+(CL.verified?' <span class="cl-ok">✓ confirmé</span>':'')+'</p><button type="button" class="ghost mini" id="cl-ren">Changer de pseudo</button>':'')+
      '<div class="row"><button type="button" class="primary" data-go="perso">Personnaliser mon perso</button></div></div></div>';
    /* colonne de droite */
    x+='<div class="acc-side">';
    if(online&&!CL.verified)x+='<div class="cl-warn"><b>Confirme ton adresse mail.</b> On t\'a envoyé un lien à '+esc(CL.user.email)+'. Tant que ce n\'est pas fait, les amis, les messages et les notes sont bloqués.<div class="row"><button type="button" class="primary" id="cl-chk">J\'ai cliqué sur le lien</button><button type="button" class="ghost" id="cl-rev">Renvoyer le mail</button></div></div>';
    if(!online&&CL&&CL.state!=='off')x+='<div class="acc-cta"><b class="cl-big">'+(loading?'Connexion…':cur?'Sauvegarde « '+esc(cur)+' » en ligne':'Crée ton compte')+'</b><p>'+(cur?'Ton profil est gardé seulement sur cet appareil. Crée ton compte en ligne avec le même pseudo : tes records, ta survie et ton perso sont gardés, et tu peux avoir des amis.':'Garde tes records, ta survie et ton perso sur tous tes appareils, ajoute tes potes et parle-leur.')+'</p>'+
      (loading?'':'<div class="row"><button type="button" class="primary big" data-auth="signup">Créer mon compte</button><button type="button" class="ghost big" data-auth="login">Se connecter</button></div>')+'</div>';
    x+='<div class="acc-stats">'+[[tot.p,'parties'],[tot.w,'victoires'],[tot.g,'jeux essayés'],[PP.store('st-surv-kills'),'créatures abattues']].map(function(s,i){return '<div class="acc-st" style="--d:'+(i*60)+'ms"><b data-count="'+s[0]+'">0</b><span>'+s[1]+'</span></div>'}).join('')+'</div>';
    x+=friendsHtml(CL);
    if(online)x+='<div class="acc-box2"><div class="acc-h"><b>Sauvegarde</b><span class="muted" id="acc-sync">'+(CL.state==='error'?'Problème : '+esc(CL.err||''):CL.lastSync?'Sauvegardé à '+new Date(CL.lastSync).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'Sauvegarde automatique')+'</span></div><p class="muted">Tout est sauvegardé en ligne automatiquement, dès que ça change.</p><div class="row">'+
      (CL.user.providerData.some(function(p){return p.providerId==='password'})?'<button type="button" class="ghost" id="cl-pw">Changer de mot de passe</button>':'')+'<button type="button" class="ghost" id="cl-out">Se déconnecter</button></div></div>';
    x+='</div></div>';
    /* stats par jeu */
    var gl=GAMES.map(function(g){return {g:g,p:PP.store('st-'+g.id+'-parties'),w:PP.store('st-'+g.id+'-win'),r:g.rec()}}).sort(function(a,b){return (b.p-a.p)||(b.r?1:0)-(a.r?1:0)});
    x+='<div class="acc-h acc-gh"><b>Mes jeux</b><span class="muted">'+tot.g+' / '+GAMES.length+' essayés</span></div><div class="acc-games">'+gl.map(function(o,i){var g=o.g;return '<button type="button" class="acc-g'+(o.p||o.r?'':' off')+'" data-go="'+esc(g.id)+'" style="--d:'+Math.min(i,12)*30+'ms">'+(THUMB[g.id]?'<img src="thumb-'+g.id+'.jpg?v=7.0" alt="" loading="lazy">':'<span class="acc-gi">'+esc(g.n.slice(0,1))+'</span>')+'<span class="acc-gt"><b>'+esc(g.n)+'</b><small>'+(o.r?'Record : '+esc(o.r):o.p?'Pas encore de record':'Pas encore joué')+'</small></span><span class="acc-gn"><b>'+o.p+'</b><small>parties</small>'+(g.win!=='—'?'<b>'+o.w+'</b><small>victoires</small>':'')+'</span></button>'}).join('')+'</div>';
    /* profils locaux */
    x+='<details class="acc-local"'+(CL&&CL.state!=='off'?'':' open')+'><summary>'+(CL&&CL.state!=='off'?'Jouer sans compte en ligne (profils gardés seulement sur cet appareil)':'Profils sur cet appareil')+'</summary>';
    x+='<div class="acc-cols"><div class="panel"><h3 class="t">Créer un profil local</h3><label class="lbl" for="acc-new">Pseudo</label><input id="acc-new" maxlength="14" placeholder="Ton pseudo"><label class="lbl" for="acc-pin" style="margin-top:10px">Code à 4 chiffres (facultatif)</label><input id="acc-pin" maxlength="4" inputmode="numeric" placeholder="Pour que personne ne joue sur ton profil"><p class="err" id="acc-err"></p><button type="button" id="acc-create">Créer et jouer</button></div>';
    x+='<div class="panel"><h3 class="t">Changer de profil</h3>'+(list.length?'<div class="acc-list">'+list.map(function(p){return '<div class="acc-item'+(p.n===cur?' on':'')+'"><b>'+esc(p.n)+'</b>'+(p.uid?'<small>en ligne</small>':p.pin?'<small>protégé</small>':'')+(p.n===cur?'<span class="tag">actif</span>':'<button type="button" class="ink" data-sw="'+esc(p.n)+'">Jouer</button>')+'<button type="button" class="ghost" data-del="'+esc(p.n)+'" aria-label="Supprimer">×</button></div>'}).join('')+'</div>':'<p class="muted">Aucun profil pour l\'instant.</p>')+
      (cur&&!online?'<button type="button" class="ghost" id="acc-out" style="margin-top:10px">Jouer en invité</button>':'')+'</div></div>';
    x+='<div class="panel"><h3 class="t">Emporter un profil local sur un autre appareil</h3><p class="muted">Copie ce code, puis colle-le sur l\'autre appareil (Importer). Avec un compte en ligne, pas besoin : tout se synchronise tout seul.</p><div class="row"><button type="button" class="ink" id="acc-exp">Copier mon code de sauvegarde</button><button type="button" class="ghost" id="acc-imp">Importer un code</button></div><textarea id="acc-code" rows="3" placeholder="Colle ici un code de sauvegarde puis clique sur Importer" hidden></textarea></div></details>';
    if(stg)stg.dispose();
    box.innerHTML=x;
    if(CL)cloudSig=sig(CL);
    stg=PP.perso.stage($('acc-cv'),{hello:true,autoWave:true});
    box.querySelectorAll('[data-count]').forEach(function(b){var n=+b.dataset.count,t0=performance.now();(function up(t){var k=Math.min(1,(t-t0)/700);b.textContent=Math.round(n*(1-Math.pow(1-k,3))).toLocaleString('fr-FR');if(k<1)requestAnimationFrame(up)})(t0)});
    box.querySelectorAll('[data-auth]').forEach(function(b){b.onclick=function(){PP.auth.open(b.dataset.auth)}});
    var on=function(id,f){var b=$(id);if(b)b.onclick=f};
    if(CL){
      on('cl-out',function(){CL.logout()});
      on('cl-ren',function(){var n=prompt('Ton nouveau pseudo (2 à 14 caractères) :',CL.name||'');if(n===null)return;CL.rename(n).then(function(v){PP.toast('Ton pseudo est maintenant '+v,'ok');render()}).catch(function(e){PP.toast(CL.msg?CL.msg(e):(e&&e.message)||'Impossible','warn')})});
      on('cl-pw',function(){CL.reset(CL.user.email).then(function(){PP.toast('Mail envoyé à '+CL.user.email+' pour changer ton mot de passe','ok')}).catch(function(e){PP.toast(CL.msg(e),'warn')})});
      on('cl-rev',function(){CL.resendVerify().then(function(){PP.toast('Mail renvoyé','ok')}).catch(function(e){PP.toast(CL.msg(e),'warn')})});
      on('cl-chk',function(){CL.checkVerified().then(function(ok){PP.toast(ok?'Adresse confirmée, merci !':'Pas encore confirmée : clique sur le lien dans le mail.',ok?'ok':'warn');render()})});
    }
    on('acc-create',function(){
      var n=$('acc-new').value.trim().replace(/[^\wÀ-ÿ .-]/g,'').slice(0,14),pin=$('acc-pin').value.trim();
      if(n.length<2){$('acc-err').textContent='Choisis un pseudo d\'au moins 2 lettres.';return}
      if(pin&&!/^\d{4}$/.test(pin)){$('acc-err').textContent='Le code doit faire 4 chiffres.';return}
      var l=profiles();if(l.some(function(p){return p.n.toLowerCase()===n.toLowerCase()})){$('acc-err').textContent='Ce pseudo existe déjà ici.';return}
      l.push({n:n,pin:pin?h(n+pin):null,t:Date.now()});saveProfiles(l);try{localStorage.setItem('pp-p-'+n+'-name',n)}catch(e){}
      sfx.play('win');switchTo(n);
    });
    box.querySelectorAll('[data-sw]').forEach(function(b){b.onclick=function(){var p=profiles().filter(function(q){return q.n===b.dataset.sw})[0];if(!p)return;if(p.uid&&CL&&CL.user&&CL.user.uid!==p.uid){PP.toast('Ce profil est lié à un autre compte en ligne : connecte-toi avec.','warn');return}if(p.pin){var c=prompt('Code à 4 chiffres de '+p.n);if(c===null)return;if(h(p.n+c)!==p.pin){PP.toast('Mauvais code','warn');return}}switchTo(p.n)}});
    box.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){var n=b.dataset.del,p=profiles().filter(function(q){return q.n===n})[0];if(!p)return;if(p.pin){var c=prompt('Code de '+n+' pour supprimer le profil');if(c===null||h(n+c)!==p.pin){PP.toast('Mauvais code','warn');return}}
      if(!confirm('Supprimer le profil '+n+' de cet appareil et toutes ses données locales (records, survie) ? C\'est définitif.'+(p.uid?' (Ton compte en ligne, lui, reste.)':'')))return;
      saveProfiles(profiles().filter(function(q){return q.n!==n}));try{Object.keys(localStorage).forEach(function(k){if(k.indexOf('pp-p-'+n+'-')===0)localStorage.removeItem(k)})}catch(e){}
      if(PP.profile()===n)switchTo('');else render()}});
    on('acc-out',function(){switchTo('')});
    on('acc-exp',function(){
      var cur2=PP.profile(),pre=cur2?'pp-p-'+cur2+'-':'pp-',data={};
      Object.keys(localStorage).forEach(function(k){if(k.indexOf(pre)===0&&(cur2||(k.indexOf('pp-p-')!==0&&k!=='pp-profiles'&&k!=='pp-profile')))data[k.slice(pre.length)]=localStorage.getItem(k)});
      var me=profiles().filter(function(p){return p.n===cur2})[0];
      var code='PP1.'+btoa(unescape(encodeURIComponent(JSON.stringify({n:cur2||'',pin:me?me.pin:null,d:data}))));
      var ta=$('acc-code');ta.hidden=false;ta.value=code;ta.select();try{navigator.clipboard.writeText(code)}catch(e){document.execCommand('copy')}PP.toast('Code copié','ok');
    });
    on('acc-imp',function(){
      var ta=$('acc-code');if(ta.hidden){ta.hidden=false;ta.value='';ta.focus();return}
      try{var s=ta.value.trim();if(s.indexOf('PP1.')!==0)throw 0;var o=JSON.parse(decodeURIComponent(escape(atob(s.slice(4)))));var n=o.n||'Importé';
        var l=profiles().filter(function(p){return p.n!==n});l.push({n:n,pin:o.pin||null,t:Date.now()});saveProfiles(l);
        Object.keys(o.d||{}).forEach(function(k){localStorage.setItem('pp-p-'+n+'-'+k,o.d[k])});PP.toast('Profil '+n+' importé','ok');switchTo(n)}
      catch(e){PP.toast('Ce code n\'est pas valide','warn')}
    });
  }
  /* nom affiché dans l'onglet Compte */
  function navName(){var s=document.querySelector('#nav-acc .nl')||$('nav-acc');if(!s)return;var CL=PP.cloud;s.textContent=(CL&&CL.name)||PP.profile()||'compte'}
  navName();document.addEventListener('pp-navready',navName);
  if(PP.cloud&&PP.cloud.on)PP.cloud.on(function(CL){navName();if(PP.cur()!=='account')return;if(sig(CL)!==cloudSig){render();return}var s=$('acc-sync');if(s&&CL.lastSync)s.textContent=CL.state==='error'?'Problème : '+(CL.err||''):'Sauvegardé à '+new Date(CL.lastSync).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
  document.addEventListener('pp-perso',function(e){if(stg&&PP.cur()==='account')stg.set(e.detail)});
  PP.games.account={open:render,close:function(){if(stg){stg.dispose();stg=null}}};
})();
