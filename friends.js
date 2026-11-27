/* Pixel Pause — amis : ajout par pseudo ou par lien (pixelpause.fr/ami/pseudo), demandes (qu'on peut couper),
   statut (en ligne, occupé, en partie, hors ligne), mini profil au clic, messages privés avec emojis, invitations dans les salons. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,box=$('fr-box'),C=PP.cloud,net=PP.net;
  var sel=null,msgs=[],chatErr=null,sigL='',gateSig='';
  function pic(a,s){return PP.perso?PP.perso.img(a||null,s||32,'perso-pic'):''}
  function fname(f){return (f.prof&&f.prof.name)||f.name||'?'}
  function gname(id){var r=document.querySelector('#tiles [data-go="'+id+'"] .rg-name');return r?r.textContent:({fps:'Zone Morte'}[id]||id)}
  PP.gameName=gname;
  function ago(t){if(!t)return 'jamais';var s=(Date.now()-t)/1000;if(s<90)return 'à l\'instant';if(s<3600)return 'il y a '+Math.round(s/60)+' min';if(s<86400)return 'il y a '+Math.round(s/3600)+' h';var d=Math.round(s/86400);return d<30?'il y a '+d+' jour'+(d>1?'s':''):'il y a longtemps'}
  function dur(sec){sec=sec||0;var h=Math.floor(sec/3600),m=Math.round(sec%3600/60);return h?h+' h '+('0'+m).slice(-2):m+' min'}
  /* statut d'un joueur : pastille + texte */
  function st(pr){var s=C&&C.statusOf?C.statusOf(pr):'off',t={on:'En ligne',busy:'Occupé',off:pr&&pr.seen&&pr.st!=='off'?'Vu '+ago(pr.seen):'Hors ligne'}[s];if(s==='game')t='En partie · '+gname(pr.g);if(s!=='off'&&pr&&pr.room&&s!=='busy')t='Dans le salon '+(pr.room.name||pr.room.code);return {s:s,t:t}}
  PP.statusHtml=function(pr){var x=st(pr);return '<em class="fr-st s-'+x.s+'">'+esc(x.t)+'</em>'};
  function link(n){return location.host+'/ami/'+encodeURIComponent(n)}
  function joinRoom(code){
    if(net.inRoom()&&net.code===code){PP.go('room');return}
    PP.go('join');$('join-code').value=code;$('join-name').value=(C&&C.name)||PP.myName()||'Joueur';$('join-go').click();
  }
  PP.joinRoom=joinRoom;

  /* ---------- Emojis (chat des salons et messages privés) ---------- */
  var EMO='😀 😂 🤣 😊 😍 😎 🤔 😮 😢 😡 👍 👎 👏 🙏 💪 🔥 ❤️ 💯 🎉 🏆 💀 🧟 🔫 ⚽ 🏁 🎮 👋 ✅'.split(' ');
  PP.emojiFor=function(input){
    var b=document.createElement('button');b.type='button';b.className='emo-btn';b.textContent='😀';b.setAttribute('aria-label','Emojis');
    var pop=null;b.onclick=function(e){e.stopPropagation();if(pop){pop.remove();pop=null;return}pop=document.createElement('div');pop.className='emo-pop';pop.innerHTML=EMO.map(function(x){return '<button type="button">'+x+'</button>'}).join('');
      b.parentNode.appendChild(pop);pop.onclick=function(ev){var t=ev.target.closest('button');if(!t)return;ev.stopPropagation();var s=input.selectionStart||input.value.length;input.value=input.value.slice(0,s)+t.textContent+input.value.slice(s);input.focus();input.selectionStart=input.selectionEnd=s+t.textContent.length};
      setTimeout(function(){document.addEventListener('click',function off(ev){if(pop&&!pop.contains(ev.target)){pop.remove();pop=null;document.removeEventListener('click',off)}})},0)};
    input.parentNode.insertBefore(b,input.nextSibling);return b;
  };

  /* ---------- Mini profil ---------- */
  var cov=null,cst=null;
  function closeCard(){if(!cov)return;if(cst)cst.dispose();cst=null;cov.remove();cov=null}
  PP.card=function(o){
    o=o||{};closeCard();
    cov=document.createElement('div');cov.className='card-ov';cov.innerHTML='<div class="card-box" role="dialog"><button type="button" class="auth-x" aria-label="Fermer">×</button><div class="card-in"><p class="wait">Chargement…</p></div></div>';document.body.appendChild(cov);
    cov.addEventListener('mousedown',function(e){if(e.target===cov)closeCard()});cov.querySelector('.auth-x').onclick=closeCard;
    if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();
    function draw(pr,uid){
      if(!cov)return;pr=pr||{};var name=pr.name||o.name||'?',me=C&&C.user&&uid===C.user.uid,f=uid&&C&&C.friend?C.friend(uid):null,s=pr.stats||{},x=st(pr);
      var h='<div class="card-top"><canvas class="card-cv"></canvas><div class="card-id"><b>'+esc(name)+'</b>'+(uid?'<em class="fr-st s-'+x.s+'">'+esc(x.t)+'</em>':'<em class="fr-st s-off">Invité (sans compte)</em>')+
        (uid?'<button type="button" class="linkbtn card-link" data-copy="'+esc(link(name))+'">'+esc(link(name))+'</button>':'')+'</div></div>';
      if(uid)h+='<div class="card-stats"><div><b>'+(s.p||0)+'</b><span>parties</span></div><div><b>'+(s.w||0)+'</b><span>victoires</span></div><div><b>'+dur(s.time)+'</b><span>de jeu</span></div><div><b>'+(s.fav?esc(gname(s.fav)):'—')+'</b><span>jeu préféré</span></div></div><p class="muted card-since">'+(s.since?'Membre depuis le '+new Date(s.since).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'')+'</p>';
      var acts='';
      if(uid&&!me){
        if(!C||!C.user)acts+='<button type="button" class="primary" data-auth="signup">Crée un compte pour l\'ajouter</button>';
        else if(!C.verified)acts+='<button type="button" class="ghost" disabled>Confirme ton mail pour ajouter des amis</button>';
        else if(!f)acts+='<button type="button" class="primary" data-add>Ajouter en ami</button>';
        else if(f.status==='pending_in')acts+='<button type="button" class="primary" data-accept>Accepter sa demande</button>';
        else if(f.status==='pending_out')acts+='<button type="button" class="ghost" disabled>Demande envoyée</button>';
        else{acts+='<button type="button" class="primary" data-dm>Message</button>';if(net.inRoom())acts+='<button type="button" class="ghost" data-inv>Inviter dans mon salon</button>'}
        if(pr.room&&pr.room.code&&C&&C.statusOf(pr)!=='off'&&!(net.inRoom()&&net.code===pr.room.code))acts+='<button type="button" class="ghost" data-join="'+esc(pr.room.code)+'">Rejoindre son salon</button>';
      }
      if(me)acts+='<button type="button" class="ghost" data-go="account">Mon compte</button>';
      if(o.pid&&net.isHost&&o.pid!==net.me.id)acts+='<button type="button" class="ghost" data-chef>Nommer chef</button><button type="button" class="red" data-kick>Exclure du salon</button>';
      h+=acts?'<div class="card-act">'+acts+'</div>':'';
      cov.querySelector('.card-in').innerHTML=h;
      if(cst)cst.dispose();cst=PP.perso.stage(cov.querySelector('.card-cv'),{perso:pr.av||o.av,hello:true});
      var q=function(s){return cov.querySelector(s)},on=function(s,fn){var b=q(s);if(b)b.onclick=fn};
      on('[data-copy]',function(){var v='https://'+this.dataset.copy;try{navigator.clipboard.writeText(v)}catch(e){}this.textContent='Lien copié !'});
      on('[data-add]',function(){var b=this;b.disabled=true;C.addFriend(name).then(function(){b.textContent='Demande envoyée';PP.sfx.play('ui')}).catch(function(e){b.disabled=false;PP.toast(C.msg(e),'warn')})});
      on('[data-accept]',function(){var b=this;b.disabled=true;C.accept(uid).then(function(){b.textContent='Vous êtes amis !';PP.sfx.play('win')}).catch(function(e){b.disabled=false;PP.toast(C.msg(e),'warn')})});
      on('[data-dm]',function(){closeCard();PP.go('friends');setTimeout(function(){openChat(uid)},50)});
      on('[data-inv]',function(){var b=this,info=PP.room&&PP.room.info?PP.room.info():{code:net.code,name:''};b.disabled=true;C.sendDM(uid,'Viens dans mon salon'+(info.name?' « '+info.name+' »':'')+' !',{room:{code:info.code,name:info.name||''}}).then(function(){b.textContent='Invitation envoyée ✓'}).catch(function(e){b.disabled=false;PP.toast(C.msg(e),'warn')})});
      on('[data-join]',function(){var c=this.dataset.join;closeCard();joinRoom(c)});
      on('[data-chef]',function(){closeCard();PP.room&&PP.room.chef&&PP.room.chef(o.pid)});
      on('[data-kick]',function(){closeCard();PP.room&&PP.room.kick&&PP.room.kick(o.pid)});
      cov.querySelectorAll('[data-go],[data-auth]').forEach(function(b){b.addEventListener('click',function(){if(b.dataset.auth)try{sessionStorage.setItem('pp-ami',name)}catch(e){}closeCard()})});
    }
    if(o.uid&&C&&C.whenReady)C.whenReady(function(db){db.collection('profiles').doc(o.uid).get().then(function(d){draw(d.exists?d.data():{name:o.name,av:o.av},o.uid)}).catch(function(){draw({name:o.name,av:o.av},o.uid)})});
    else if(o.name&&!o.guest&&C&&C.whenReady)C.whenReady(function(db){db.collection('usernames').doc(String(o.name).toLowerCase()).get().then(function(u){if(!u.exists){draw({name:o.name,av:o.av},null);if(o.fromLink)cov.querySelector('.card-in').insertAdjacentHTML('afterbegin','<p class="cl-warn">Aucun joueur ne s\'appelle « '+esc(o.name)+' ».</p>');return}var id=u.data().uid;return db.collection('profiles').doc(id).get().then(function(d){draw(d.exists?d.data():{name:u.data().name},id)})}).catch(function(){draw({name:o.name,av:o.av},null)})});
    else draw({name:o.name,av:o.av},null);
  };
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&cov)closeCard()});
  /* lien pixelpause.fr/ami/pseudo -> ?ami=pseudo */
  (function(){var m=/[?&]ami=([^&#]+)/.exec(location.search),n=m?decodeURIComponent(m[1]):null;try{if(!n)n=sessionStorage.getItem('pp-ami')}catch(e){}if(!n)return;
    try{history.replaceState(null,'',location.pathname+'#friends')}catch(e){}
    function go(){try{sessionStorage.removeItem('pp-ami')}catch(e){}PP.card({name:n,fromLink:true})}
    if(C&&C.whenReady){var done=false;C.on(function(){if(done||C.state==='loading'||C.state==='checking')return;if(C.user&&!C.name)return;done=true;setTimeout(go,300)})}})();

  /* ---------- Page Amis ---------- */
  function gate(){
    if(!C||C.state==='off')return '<div class="panel fr-gate"><p class="muted">Les comptes en ligne ne sont pas disponibles pour l\'instant.</p></div>';
    if(C.state==='loading'||C.state==='checking')return '<div class="panel fr-gate"><p class="wait">Connexion…</p></div>';
    if(C.state==='need-name')return '<div class="panel fr-gate"><h3 class="t">Dernière étape : ton pseudo</h3><p class="muted">Tu es connecté, il te reste juste à choisir ton pseudo (c\'est lui que tes amis tapent pour t\'ajouter).</p><button type="button" class="primary" data-auth="signup">Choisir mon pseudo</button></div>';
    if(C.state==='need-device')return '<div class="panel fr-gate"><h3 class="t">Confirme cet appareil</h3><p class="muted">On t\'a envoyé un lien à <b>'+esc(C.pendingEmail||'')+'</b>. Ouvre-le sur cet appareil pour finir la connexion.</p></div>';
    if(!C.user&&PP.profile())return '<div class="panel fr-gate"><h3 class="t">Ton profil « '+esc(PP.profile())+' » n\'est pas encore un compte en ligne</h3><p class="muted">Il est gardé seulement sur cet appareil, donc personne ne peut t\'ajouter. Crée ton compte en ligne avec le même pseudo : tes records, ta survie et ton perso sont gardés. Si tu as déjà un compte en ligne, connecte-toi.</p><div class="row"><button type="button" class="primary" data-auth="signup">Créer mon compte en ligne</button><button type="button" class="ghost" data-auth="login">J\'ai déjà un compte</button></div></div>';
    if(!C.user||!C.name)return '<div class="panel fr-gate"><h3 class="t">Connecte-toi pour avoir des amis</h3><p class="muted">Avec un compte, tu ajoutes tes potes avec leur pseudo, tu leur écris, tu vois quand ils sont en ligne et tu les invites dans tes salons.</p><div class="row"><button type="button" class="primary" data-auth="signup">Créer un compte</button><button type="button" class="ghost" data-auth="login">Se connecter</button></div></div>';
    if(!C.verified)return '<div class="panel fr-gate"><h3 class="t">Confirme ton adresse mail</h3><p class="muted">On t\'a envoyé un lien à <b>'+esc(C.user.email||'')+'</b>. Clique dessus, puis reviens ici.</p><div class="row"><button type="button" class="primary" id="fr-chk">J\'ai cliqué sur le lien</button><button type="button" class="ghost" id="fr-re">Renvoyer le mail</button></div></div>';
    return null;
  }
  function render(){
    if(!box)return;
    var g=gate();gateSig=g?'g'+(C&&C.state)+(C&&C.verified):'ok';
    if(g){box.innerHTML=g;var c=$('fr-chk');if(c)c.onclick=function(){C.checkVerified().then(function(ok){if(!ok)PP.toast('Pas encore confirmée : clique sur le lien dans le mail.','warn');render()})};var r=$('fr-re');if(r)r.onclick=function(){C.resendVerify().then(function(){PP.toast('Mail renvoyé','ok')})};return}
    var s=C.status();
    box.innerHTML='<div class="fr-grid"><div class="fr-side"><div class="panel fr-meb">'+pic(PP.perso.get(),44)+'<div class="fr-mei"><b>'+esc(C.name)+'</b><div class="seg fr-stseg">'+[['on','En ligne'],['busy','Occupé'],['off','Invisible']].map(function(x){return '<button type="button" data-st="'+x[0]+'" class="'+(s===x[0]?'on':'')+'"><i class="dot s-'+x[0]+'"></i>'+x[1]+'</button>'}).join('')+'</div></div></div>'+
      '<div class="panel"><label class="lbl" for="fr-add">Ajouter un ami</label><form class="ch-form" id="fr-form"><input id="fr-add" maxlength="14" placeholder="Son pseudo" autocomplete="off"><button type="submit" class="primary">Ajouter</button></form><p class="muted fr-me" id="fr-msg"></p>'+
      '<div class="fr-link"><span>Ton lien :</span><button type="button" class="linkbtn" id="fr-mylink">'+esc(link(C.name))+'</button><button type="button" class="mini ghost" id="fr-copy">Copier</button></div>'+
      '<label class="fr-tog"><input type="checkbox" id="fr-noreq"'+(C.noReq?'':' checked')+'> Accepter les demandes d\'ami</label></div>'+
      '<div class="panel" id="fr-lists"></div></div><div class="panel fr-chat" id="fr-chat"></div></div>';
    $('fr-form').onsubmit=function(e){e.preventDefault();var i=$('fr-add'),m=$('fr-msg');var v=i.value;if(!v.trim())return;m.className='muted fr-me';m.textContent='…';
      C.addFriend(v).then(function(n){i.value='';m.innerHTML='Demande envoyée à <b>'+esc(n)+'</b>.';PP.sfx.play('ui')}).catch(function(e2){m.className='err fr-me';m.textContent=C.msg(e2)})};
    box.querySelectorAll('[data-st]').forEach(function(b){b.onclick=function(){C.setStatus(b.dataset.st);box.querySelectorAll('[data-st]').forEach(function(x){x.classList.toggle('on',x===b)})}});
    var cp=function(){var v='https://'+link(C.name);try{navigator.clipboard.writeText(v)}catch(e){}$('fr-copy').textContent='Copié !';setTimeout(function(){var c=$('fr-copy');if(c)c.textContent='Copier'},1500)};$('fr-copy').onclick=cp;$('fr-mylink').onclick=cp;
    $('fr-noreq').onchange=function(){C.setNoReq(!this.checked).then(function(){PP.toast(C.noReq?'Demandes d\'ami coupées':'Demandes d\'ami ouvertes','ok')})};
    sigL='';lists();chatPane();
  }
  function lists(){
    var el=$('fr-lists');if(!el)return;
    var F=C.friends||[],inn=F.filter(function(f){return f.status==='pending_in'}),out=F.filter(function(f){return f.status==='pending_out'}),
      rk={on:0,game:1,busy:2,off:3},fr=F.filter(function(f){return f.status==='friends'}).sort(function(a,b){return (rk[C.statusOf(a.prof)]-rk[C.statusOf(b.prof)])||fname(a).localeCompare(fname(b))});
    var h='';
    if(inn.length)h+='<label class="lbl">Demandes reçues</label><ul class="rp-list fr-req">'+inn.map(function(f){return '<li><span class="rp-n">'+esc(f.name)+'</span><span class="rp-act"><button type="button" class="mini primary" data-acc="'+f.uid+'">Accepter</button><button type="button" class="mini ghost" data-rm="'+f.uid+'">Refuser</button></span></li>'}).join('')+'</ul>';
    var nOn=fr.filter(function(f){return C.statusOf(f.prof)!=='off'}).length;
    h+='<label class="lbl">Amis · '+nOn+' en ligne sur '+fr.length+'</label>';
    h+=fr.length?'<ul class="rp-list fr-list">'+fr.map(function(f){var x=st(f.prof),r=x.s!=='off'&&f.prof&&f.prof.room;
      return '<li class="'+(sel===f.uid?'sel':'')+'" data-open="'+f.uid+'"><span class="av-wrap" data-card="'+f.uid+'">'+pic(f.prof&&f.prof.av,34)+'<i class="dot s-'+x.s+'"></i></span><span class="rp-n">'+esc(fname(f))+'<em class="fr-st s-'+x.s+'">'+esc(x.t)+'</em></span>'+(C.unread[f.uid]?'<i class="fr-dot" title="Nouveau message"></i>':'')+(r&&!(net.inRoom()&&net.code===r.code)?'<button type="button" class="mini ink" data-joinr="'+esc(r.code)+'">Rejoindre</button>':'')+'</li>'}).join('')+'</ul>'
      :'<p class="muted">Pas encore d\'amis. Ajoute-les avec leur pseudo ou envoie-leur ton lien.</p>';
    if(out.length)h+='<label class="lbl">Demandes envoyées</label><ul class="rp-list">'+out.map(function(f){return '<li><span class="rp-n">'+esc(f.name)+' <small class="you">en attente</small></span><button type="button" class="mini ghost" data-rm="'+f.uid+'">Annuler</button></li>'}).join('')+'</ul>';
    if(h===sigL)return;sigL=h;el.innerHTML=h;
    el.querySelectorAll('[data-acc]').forEach(function(b){b.onclick=function(){b.disabled=true;C.accept(b.dataset.acc).then(function(){PP.sfx.play('win')}).catch(function(e){b.disabled=false;PP.toast(C.msg(e),'warn')})}});
    el.querySelectorAll('[data-rm]').forEach(function(b){b.onclick=function(){b.disabled=true;C.remove(b.dataset.rm).catch(function(e){b.disabled=false;PP.toast(C.msg(e),'warn')})}});
    el.querySelectorAll('[data-card]').forEach(function(a){a.onclick=function(e){e.stopPropagation();var f=C.friend(a.dataset.card);PP.card({uid:a.dataset.card,name:f&&fname(f),av:f&&f.prof&&f.prof.av})}});
    el.querySelectorAll('[data-open]').forEach(function(li){li.onclick=function(e){if(e.target.closest('button'))return;openChat(li.dataset.open)}});
    el.querySelectorAll('[data-joinr]').forEach(function(b){b.onclick=function(){joinRoom(b.dataset.joinr)}});
  }
  function openChat(uid){if(sel===uid)return;sel=uid;msgs=[];chatErr=null;sigL='';lists();chatPane();
    var cp=$('fr-chat');if(cp&&innerWidth<820)cp.scrollIntoView({behavior:'smooth'});
    C.openChatWith(uid,function(l,err){if(sel!==uid)return;if(err){chatErr=err;msgs=[]}else msgs=l;log()})}
  function chatPane(){
    var el=$('fr-chat');if(!el)return;var f=sel&&C.friend(sel);
    if(!f||f.status!=='friends'){sel=null;el.innerHTML='<label class="lbl">Messages</label><p class="muted ch-empty fr-pick">Choisis un ami dans la liste pour lui écrire.</p>';return}
    var inRoom=net.inRoom(),x=st(f.prof);
    el.innerHTML='<div class="fr-head"><span class="av-wrap" data-card="'+f.uid+'">'+pic(f.prof&&f.prof.av,40)+'<i class="dot s-'+x.s+'"></i></span><div><b>'+esc(fname(f))+'</b><small id="fr-hst">'+esc(x.t)+'</small></div><span class="rp-act">'+(inRoom?'<button type="button" class="mini primary" id="fr-inv">Inviter dans mon salon</button>':'')+'<button type="button" class="mini ghost" id="fr-del">Retirer</button></span></div>'+
      '<div class="ch-log" id="fr-log"></div><form class="ch-form" id="fr-send"><input maxlength="500" placeholder="Écris à '+esc(fname(f))+'…" autocomplete="off"><button type="submit" class="primary">Envoyer</button></form>';
    log();
    var inp=$('fr-send').querySelector('input');PP.emojiFor(inp);
    el.querySelector('[data-card]').onclick=function(){PP.card({uid:f.uid,name:fname(f),av:f.prof&&f.prof.av})};
    $('fr-send').onsubmit=function(e){e.preventDefault();var v=inp.value;if(!v.trim())return;inp.value='';C.sendDM(sel,v).catch(function(e2){PP.toast(C.msg(e2),'warn');inp.value=v})};
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
    var f=sel&&C.friend(sel);if(sel&&(!f||f.status!=='friends'))chatPane();else if(f){var h=$('fr-hst');if(h)h.textContent=st(f.prof).t}
  });
  PP.games.friends={open:function(){render()},close:function(){if(C&&C.closeChat)C.closeChat();sel=null}};
})();
