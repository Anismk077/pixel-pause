/* Pixel Pause — amis : ajout par pseudo, demandes, présence (en ligne, dans un salon), messages privés,
   invitations dans les salons. Tout passe par PP.cloud (Firebase). */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,box=$('fr-box'),C=PP.cloud,net=PP.net;
  var sel=null,msgs=[],chatErr=null,sigL='',gateSig='';
  function pic(a,s){return PP.perso?PP.perso.img(a||null,s||32,'perso-pic'):''}
  function fname(f){return (f.prof&&f.prof.name)||f.name||'?'}
  function joinRoom(code){
    if(net.inRoom()&&net.code===code){PP.go('room');return}
    PP.go('join');$('join-code').value=code;$('join-name').value=(C&&C.name)||PP.myName()||'Joueur';$('join-go').click();
  }
  function gate(){
    if(!C||C.state==='off')return '<div class="panel fr-gate"><p class="muted">Les comptes en ligne ne sont pas disponibles pour l\'instant.</p></div>';
    if(C.state==='loading'||C.state==='checking')return '<div class="panel fr-gate"><p class="wait">Connexion…</p></div>';
    if(C.state==='need-name')return '<div class="panel fr-gate"><h3 class="t">Dernière étape : ton pseudo</h3><p class="muted">Tu es connecté, il te reste juste à choisir ton pseudo (c\'est lui que tes amis tapent pour t\'ajouter).</p><button type="button" class="primary" data-auth="signup">Choisir mon pseudo</button></div>';
    if(C.state==='need-device')return '<div class="panel fr-gate"><h3 class="t">Confirme cet appareil</h3><p class="muted">On t\'a envoyé un lien à <b>'+esc(C.pendingEmail||'')+'</b>. Ouvre-le sur cet appareil pour finir la connexion.</p></div>';
    if(!C.user&&PP.profile())return '<div class="panel fr-gate"><h3 class="t">Ton profil « '+esc(PP.profile())+' » n\'est pas encore un compte en ligne</h3><p class="muted">Il est gardé seulement sur cet appareil, donc personne ne peut t\'ajouter. Crée ton compte en ligne avec le même pseudo : tes records, ta survie et ton perso sont gardés. Si tu as déjà un compte en ligne, connecte-toi.</p><div class="row"><button type="button" class="primary" id="fr-signup">Créer mon compte en ligne</button><button type="button" class="ghost" id="fr-login">J\'ai déjà un compte</button></div></div>';
    if(!C.user||!C.name)return '<div class="panel fr-gate"><h3 class="t">Connecte-toi pour avoir des amis</h3><p class="muted">Avec un compte, tu ajoutes tes potes avec leur pseudo, tu leur écris, tu vois quand ils sont en ligne et tu les invites dans tes salons.</p><div class="row"><button type="button" class="primary" data-auth="signup">Créer un compte</button><button type="button" class="ghost" data-auth="login">Se connecter</button></div></div>';
    if(!C.verified)return '<div class="panel fr-gate"><h3 class="t">Confirme ton adresse mail</h3><p class="muted">On t\'a envoyé un lien à <b>'+esc(C.user.email||'')+'</b>. Clique dessus, puis reviens ici.</p><div class="row"><button type="button" class="primary" id="fr-chk">J\'ai cliqué sur le lien</button><button type="button" class="ghost" id="fr-re">Renvoyer le mail</button></div></div>';
    return null;
  }
  function render(){
    if(!box)return;
    var g=gate();gateSig=g?'g'+(C&&C.state)+(C&&C.verified):'ok';
    if(g){box.innerHTML=g;var su=$('fr-signup'),li=$('fr-login');if(su)su.onclick=function(){PP.auth.open('signup')};if(li)li.onclick=function(){PP.auth.open('login')};var c=$('fr-chk');if(c)c.onclick=function(){C.checkVerified().then(function(ok){if(!ok)PP.toast('Pas encore confirmée : clique sur le lien dans le mail.','warn');render()})};var r=$('fr-re');if(r)r.onclick=function(){C.resendVerify().then(function(){PP.toast('Mail renvoyé','ok')})};return}
    box.innerHTML='<div class="fr-grid"><div class="panel fr-side"><label class="lbl" for="fr-add">Ajouter un ami</label><form class="ch-form" id="fr-form"><input id="fr-add" maxlength="14" placeholder="Son pseudo" autocomplete="off"><button type="submit" class="primary">Ajouter</button></form><p class="muted fr-me" id="fr-msg">Ton pseudo : <b>'+esc(C.name)+'</b> (donne-le à tes potes)</p><div id="fr-lists"></div></div><div class="panel fr-chat" id="fr-chat"></div></div>';
    $('fr-form').onsubmit=function(e){e.preventDefault();var i=$('fr-add'),m=$('fr-msg');var v=i.value;if(!v.trim())return;m.className='muted fr-me';m.textContent='…';
      C.addFriend(v).then(function(n){i.value='';m.innerHTML='Demande envoyée à <b>'+esc(n)+'</b>.';PP.sfx.play('ui')}).catch(function(e2){m.className='err fr-me';m.textContent=C.msg(e2)})};
    sigL='';lists();chatPane();
  }
  function lists(){
    var el=$('fr-lists');if(!el)return;
    var F=C.friends||[],inn=F.filter(function(f){return f.status==='pending_in'}),out=F.filter(function(f){return f.status==='pending_out'}),
      fr=F.filter(function(f){return f.status==='friends'}).sort(function(a,b){return (C.online(b)-C.online(a))||fname(a).localeCompare(fname(b))});
    var h='';
    if(inn.length)h+='<label class="lbl">Demandes reçues</label><ul class="rp-list fr-req">'+inn.map(function(f){return '<li><span class="rp-n">'+esc(f.name)+'</span><span class="rp-act"><button type="button" class="mini primary" data-acc="'+f.uid+'">Accepter</button><button type="button" class="mini ghost" data-rm="'+f.uid+'">Refuser</button></span></li>'}).join('')+'</ul>';
    h+='<label class="lbl">Amis ('+fr.length+')</label>';
    h+=fr.length?'<ul class="rp-list fr-list">'+fr.map(function(f){var on=C.online(f),r=on&&f.prof&&f.prof.room;
      return '<li class="'+(sel===f.uid?'sel':'')+'" data-open="'+f.uid+'">'+pic(f.prof&&f.prof.av,30)+'<span class="rp-n">'+esc(fname(f))+'<em class="fr-st'+(on?' on':'')+'">'+(r?'Dans le salon '+esc(r.name||r.code):on?'En ligne':'Hors ligne')+'</em></span>'+(C.unread[f.uid]?'<i class="fr-dot" title="Nouveau message"></i>':'')+(r?'<button type="button" class="mini ink" data-joinr="'+esc(r.code)+'">Rejoindre</button>':'')+'</li>'}).join('')+'</ul>'
      :'<p class="muted">Pas encore d\'amis. Ajoute-les avec leur pseudo, au-dessus.</p>';
    if(out.length)h+='<label class="lbl">Demandes envoyées</label><ul class="rp-list">'+out.map(function(f){return '<li><span class="rp-n">'+esc(f.name)+' <small class="you">en attente</small></span><button type="button" class="mini ghost" data-rm="'+f.uid+'">Annuler</button></li>'}).join('')+'</ul>';
    if(h===sigL)return;sigL=h;el.innerHTML=h;
    el.querySelectorAll('[data-acc]').forEach(function(b){b.onclick=function(){b.disabled=true;C.accept(b.dataset.acc).then(function(){PP.sfx.play('win')}).catch(function(e){b.disabled=false;PP.toast(C.msg(e),'warn')})}});
    el.querySelectorAll('[data-rm]').forEach(function(b){b.onclick=function(){b.disabled=true;C.remove(b.dataset.rm).catch(function(e){b.disabled=false;PP.toast(C.msg(e),'warn')})}});
    el.querySelectorAll('[data-open]').forEach(function(li){li.onclick=function(e){if(e.target.closest('button'))return;open(li.dataset.open)}});
    el.querySelectorAll('[data-joinr]').forEach(function(b){b.onclick=function(){joinRoom(b.dataset.joinr)}});
  }
  function open(uid){if(sel===uid)return;sel=uid;msgs=[];chatErr=null;sigL='';lists();chatPane();
    C.openChatWith(uid,function(l,err){if(sel!==uid)return;if(err){chatErr=err;msgs=[]}else msgs=l;log()})}
  function chatPane(){
    var el=$('fr-chat');if(!el)return;var f=sel&&C.friend(sel);
    if(!f||f.status!=='friends'){sel=null;el.innerHTML='<label class="lbl">Messages</label><p class="muted ch-empty fr-pick">Choisis un ami dans la liste pour lui écrire.</p>';return}
    var inRoom=net.inRoom();
    el.innerHTML='<div class="fr-head">'+pic(f.prof&&f.prof.av,40)+'<div><b>'+esc(fname(f))+'</b><small id="fr-hst">'+(C.online(f)?'En ligne':'Hors ligne')+'</small></div><span class="rp-act">'+(inRoom?'<button type="button" class="mini primary" id="fr-inv">Inviter dans mon salon</button>':'')+'<button type="button" class="mini ghost" id="fr-del">Retirer</button></span></div>'+
      '<div class="ch-log" id="fr-log"></div><form class="ch-form" id="fr-send"><input maxlength="500" placeholder="Écris à '+esc(fname(f))+'…" autocomplete="off"><button type="submit" class="primary">Envoyer</button></form>';
    log();
    $('fr-send').onsubmit=function(e){e.preventDefault();var i=this.querySelector('input'),v=i.value;if(!v.trim())return;i.value='';C.sendDM(sel,v).catch(function(e2){PP.toast(C.msg(e2),'warn');i.value=v})};
    var inv=$('fr-inv');if(inv)inv.onclick=function(){var info=PP.room&&PP.room.info?PP.room.info():{code:net.code,name:''};C.sendDM(sel,'Viens dans mon salon'+(info.name?' « '+info.name+' »':'')+' !',{room:{code:info.code,name:info.name||''}}).then(function(){PP.toast('Invitation envoyée','ok')}).catch(function(e2){PP.toast(C.msg(e2),'warn')})};
    $('fr-del').onclick=function(){if(!confirm('Retirer '+fname(f)+' de tes amis ?'))return;var u=sel;C.closeChat();sel=null;C.remove(u).catch(function(e2){PP.toast(C.msg(e2),'warn')});chatPane()};
  }
  function log(){
    var lg=$('fr-log');if(!lg)return;var me=C.user&&C.user.uid;
    if(chatErr){lg.innerHTML='<p class="err ch-empty">Messages indisponibles : '+esc(C.msg(chatErr))+'</p>';return}
    lg.innerHTML=msgs.map(function(m){var mine=m.from===me;return '<div class="ch-msg'+(mine?' me':'')+'"><span>'+esc(m.text)+(m.room&&m.room.code?'<button type="button" class="mini ink fr-rj" data-joinr="'+esc(m.room.code)+'">Rejoindre le salon '+esc(m.room.code)+'</button>':'')+'<small class="ch-t">'+new Date(m.t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'</small></span></div>'}).join('')||'<p class="muted ch-empty">Pas encore de message. Dis bonjour !</p>';
    lg.scrollTop=lg.scrollHeight;
    lg.querySelectorAll('[data-joinr]').forEach(function(b){b.onclick=function(){joinRoom(b.dataset.joinr)}});
  }
  /* pastille sur le bouton Amis du menu */
  function badge(){var n=C&&C.badge?C.badge():0,b=$('nav-fr-n');if(b){b.hidden=!n;b.textContent=n}}
  if(C&&C.on)C.on(function(){
    badge();
    if(PP.cur()!=='friends')return;
    var g=gate(),s=g?'g'+C.state+C.verified:'ok';
    if(s!==gateSig||!$('fr-lists'))return render();
    lists();
    var f=sel&&C.friend(sel);if(sel&&(!f||f.status!=='friends'))chatPane();else if(f){var h=$('fr-hst');if(h)h.textContent=C.online(f)?'En ligne':'Hors ligne'}
  });
  PP.games.friends={open:function(){render()},close:function(){if(C&&C.closeChat)C.closeChat();sel=null}};
})();
