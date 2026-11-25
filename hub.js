/* Pixel Pause — fenêtre de connexion / création de compte (au milieu de l'écran, en étapes),
   onglets avec icônes (barre du bas sur téléphone), et ton perso 3D animé sur l'accueil. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,C=PP.cloud;
  var MAILRE=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  /* ---------- Icônes des onglets ---------- */
  var ICO={
    menu:'<path d="M6 11h4M8 9v4"/><circle cx="15.5" cy="11" r="1"/><circle cx="17.5" cy="13" r="1"/><path d="M7 6h10a4 4 0 0 1 4 4v3.5a3.5 3.5 0 0 1-6.2 2.2L13.5 14h-3l-1.3 1.7A3.5 3.5 0 0 1 3 13.5V10a4 4 0 0 1 4-4z"/>',
    room:'<path d="M4 20v-1a5 5 0 0 1 10 0v1"/><circle cx="9" cy="8" r="3.2"/><path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M17 14.2a5 5 0 0 1 3.5 4.8v1"/>',
    perso:'<circle cx="12" cy="6.5" r="3.2"/><path d="M8 21v-6.5L6 13l1.8-3.2h8.4L18 13l-2 1.5V21M12 14v7"/>',
    friends:'<path d="M20.4 12.6 12 21l-8.4-8.4a4.9 4.9 0 0 1 7-6.9l1.4 1.4 1.4-1.4a4.9 4.9 0 0 1 7 6.9z"/>',
    account:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3.2"/><path d="M6.2 18.4a6.5 6.5 0 0 1 11.6 0"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  var PAGES={menu:1,room:1,join:1,perso:1,friends:1,account:1,settings:1};
  function navSetup(){
    document.querySelectorAll('header nav [data-go]').forEach(function(b){
      var k=b.dataset.go;if(!ICO[k]||b.querySelector('svg'))return;
      var tn=[].filter.call(b.childNodes,function(n){return n.nodeType===3})[0],sp=document.createElement('span');sp.className='nl';sp.textContent=tn?tn.textContent:'';if(tn)b.replaceChild(sp,tn);else b.appendChild(sp);
      b.insertAdjacentHTML('afterbegin','<svg class="ni" viewBox="0 0 24 24" aria-hidden="true">'+ICO[k]+'</svg>');
    });
    document.body.classList.add('pp-nav2');
    try{document.dispatchEvent(new CustomEvent('pp-navready'))}catch(e){}
    navState();
  }
  function navState(){var v=PP.cur();document.querySelectorAll('header nav [data-go]').forEach(function(b){b.classList.toggle('on',b.dataset.go===v||(v==='join'&&b.dataset.go==='room'))});document.body.classList.toggle('pp-ingame',!PAGES[v])}
  document.addEventListener('pp-go',function(){setTimeout(navState,0)});
  navSetup();

  /* ---------- Fenêtre de compte ---------- */
  var ov=null,step=null,fresh=false,ed=null;
  function close(){if(!ov)return;ov.classList.add('out');var o=ov;ov=null;step=null;setTimeout(function(){o.remove()},220);document.documentElement.classList.remove('auth-open');if(ed&&ed.stage)ed.stage.dispose();ed=null}
  function shell(inner){
    if(!ov){ov=document.createElement('div');ov.className='auth-ov';ov.innerHTML='<div class="auth-box" role="dialog" aria-modal="true"><button type="button" class="auth-x" aria-label="Fermer">×</button><div class="auth-in"></div></div>';document.body.appendChild(ov);document.documentElement.classList.add('auth-open');
      ov.addEventListener('mousedown',function(e){if(e.target===ov&&step!=='perso')close()});ov.querySelector('.auth-x').onclick=function(){if(step==='perso'&&fresh){done()}else close()};
      if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock()}
    var box=ov.querySelector('.auth-box');box.classList.toggle('wide',step==='perso');
    var inn=ov.querySelector('.auth-in');inn.innerHTML=inner;inn.classList.remove('swap');void inn.offsetWidth;inn.classList.add('swap');return inn;
  }
  function dots(n){return '<div class="auth-steps">'+['Compte','Perso','C\'est parti'].map(function(s,i){return '<span class="'+(i<n?'ok':i===n?'on':'')+'"><i>'+(i<n?'✓':i+1)+'</i>'+s+'</span>'}).join('')+'</div>'}
  function err(m,ok){var e=ov&&ov.querySelector('.auth-err');if(e){e.textContent=m||'';e.className='auth-err'+(ok?' ok':'')}}
  function gbtn(){return '<div class="auth-or"><span>ou</span></div><button type="button" class="gbtn auth-g" data-g><span>G</span> Continuer avec Google</button>'}
  function form(mode){
    step=mode;var su=mode==='signup';
    var inn=shell((su?dots(0):'')+'<h2 class="auth-t">'+(su?'Crée ton compte':'Content de te revoir')+'</h2><p class="auth-sub">'+(su?'Trois cases et c\'est fini. Ensuite tu crées ton perso.':'Connecte-toi pour retrouver ton perso, tes records et tes amis.')+'</p>'+
      (C&&C.note?'<p class="auth-note">'+esc(C.note)+'</p>':'')+
      '<form class="auth-f" novalidate>'+
      (su?'<label><span>Pseudo</span><input name="n" maxlength="14" autocomplete="nickname" placeholder="Ce que tes amis verront" value="'+esc(PP.profile()||'')+'"></label>':'')+
      '<label><span>Adresse mail</span><input name="m" type="email" autocomplete="email" placeholder="toi@exemple.fr"></label>'+
      '<label><span>Mot de passe</span><span class="auth-pw"><input name="p" type="password" autocomplete="'+(su?'new-password':'current-password')+'" placeholder="'+(su?'8 caractères, une lettre et un chiffre':'Ton mot de passe')+'"><button type="button" class="auth-eye" aria-label="Voir le mot de passe">Voir</button></span></label>'+
      (su?'<div class="cl-meter"><i></i></div>':'<button type="button" class="linkbtn auth-forgot">Mot de passe oublié ?</button>')+
      '<p class="auth-err"></p><button type="submit" class="primary auth-go">'+(su?'Créer mon compte':'Se connecter')+'</button></form>'+gbtn()+
      '<p class="auth-sw">'+(su?'Déjà un compte ? <button type="button" class="linkbtn" data-sw="login">Se connecter</button>':'Pas encore de compte ? <button type="button" class="linkbtn" data-sw="signup">Créer un compte</button>')+'</p>'+
      '<p class="auth-sec">Ton mot de passe est vérifié par Google (Firebase), le site ne le voit jamais. Ton mail est confirmé, et chaque nouvel appareil doit être validé par un lien envoyé sur ton mail.</p>');
    var f=inn.querySelector('form'),pw=f.p;
    setTimeout(function(){(su&&!f.n.value?f.n:f.m).focus()},60);
    inn.querySelector('.auth-eye').onclick=function(){var s=pw.type==='password';pw.type=s?'text':'password';this.textContent=s?'Cacher':'Voir'};
    var me=inn.querySelector('.cl-meter');if(me)pw.oninput=function(){var v=pw.value,s=0;if(v.length>=8)s++;if(v.length>=12)s++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))s++;if(/\d/.test(v))s++;if(/[^\w]/.test(v))s++;me.firstChild.style.width=(s*20)+'%';me.className='cl-meter s'+s};
    inn.querySelectorAll('[data-sw]').forEach(function(b){b.onclick=function(){var m=f.m.value;if(C)C.note='';form(b.dataset.sw);ov.querySelector('[name=m]').value=m}});
    var fg=inn.querySelector('.auth-forgot');if(fg)fg.onclick=function(){var m=f.m.value.trim();if(!MAILRE.test(m))return err('Tape d\'abord ton adresse mail au-dessus.');C.reset(m).then(function(){err('Si un compte existe avec '+m+', un mail pour changer le mot de passe vient de partir.',1)}).catch(function(e){err(C.msg(e))})};
    inn.querySelector('[data-g]').onclick=function(){var g=this;g.disabled=true;ob('login');C.google().catch(function(e){g.disabled=false;err(C.msg(e))})};
    f.onsubmit=function(e){e.preventDefault();var m=f.m.value.trim(),p=pw.value,go=f.querySelector('.auth-go');
      if(su&&C.cleanName(f.n.value).length<2)return err('Choisis un pseudo d\'au moins 2 lettres.');
      if(!MAILRE.test(m))return err('Adresse mail invalide.');
      if(su&&!C.goodPass(p))return err('Mot de passe : 8 caractères minimum, avec au moins une lettre et un chiffre.');
      if(!p)return err('Entre ton mot de passe.');
      go.disabled=true;err(su?'Création du compte…':'Connexion…',1);
      ob(su?'perso':'login');if(su){fresh=true;C.signup(f.n.value,m,p).then(function(){PP.sfx.play('win')}).catch(function(e2){ob(null);fresh=false;go.disabled=false;err(C.msg(e2))})}
      else C.login(m,p).catch(function(e2){ob(null);go.disabled=false;err(C.msg(e2))});
    };
  }
  function nameStep(){
    step='name';var inn=shell(dots(0)+'<h2 class="auth-t">Choisis ton pseudo</h2><p class="auth-sub">C\'est lui que tes amis verront et taperont pour t\'ajouter.</p><form class="auth-f" novalidate><label><span>Pseudo</span><input name="n" maxlength="14" autocomplete="nickname" value="'+esc((C.user&&C.user.displayName||PP.profile()||'').replace(/[^\wÀ-ÿ .-]/g,'').slice(0,14))+'"></label><p class="auth-err"></p><button type="submit" class="primary auth-go">Valider</button></form><p class="auth-sw"><button type="button" class="linkbtn" data-out>Annuler et se déconnecter</button></p>');
    var f=inn.querySelector('form');setTimeout(function(){f.n.focus();f.n.select()},60);
    f.onsubmit=function(e){e.preventDefault();var go=f.querySelector('.auth-go');go.disabled=true;err('…',1);ob('perso');C.claimName(f.n.value).catch(function(e2){go.disabled=false;err(C.msg(e2))})};
    inn.querySelector('[data-out]').onclick=function(){close();C.logout()};
  }
  function deviceStep(){
    step='device';shell('<div class="auth-icon">✉</div><h2 class="auth-t">Nouvel appareil</h2><p class="auth-sub">Pour protéger ton compte, on vient d\'envoyer un lien à <b>'+esc(C.pendingEmail||'ton adresse')+'</b>.</p><ol class="auth-ol"><li>Ouvre ce mail <b>sur cet appareil</b> (regarde aussi les spams).</li><li>Clique sur le lien : la connexion se termine toute seule.</li></ol><p class="auth-sec">Le lien marche pendant une heure.</p><button type="button" class="ghost" data-back>Revenir à la connexion</button>');
    ov.querySelector('[data-back]').onclick=function(){C.cancel();form('login')};
  }
  function persoStep(){
    step='perso';var inn=shell(dots(1)+'<h2 class="auth-t">Crée ton perso</h2><p class="auth-sub">C\'est lui qu\'on verra sur ton compte, dans les salons et dans les jeux 3D. Tu pourras le changer quand tu veux.</p><div class="auth-ed"></div>');
    ed=PP.perso.editor(inn.querySelector('.auth-ed'),{compact:true,doneLabel:'C\'est parti !',onDone:done});
  }
  function done(){
    if(ed&&ed.stage){ed.stage.dispose();ed=null}
    step='done';var nm=C&&C.name||'';
    var inn=shell(dots(2)+'<div class="auth-done"><canvas class="auth-cv"></canvas><h2 class="auth-t">Bienvenue '+esc(nm)+' !</h2>'+(C&&C.user&&!C.verified?'<p class="auth-sub">Dernière chose : on t\'a envoyé un mail à <b>'+esc(C.user.email||'')+'</b>. Clique sur le lien pour débloquer les amis et les messages.</p>':'<p class="auth-sub">Ton compte est prêt et tout est sauvegardé en ligne.</p>')+'<div class="row"><button type="button" class="primary" data-acc>Voir mon compte</button><button type="button" class="ghost" data-play>Jouer</button></div></div>');
    var st=PP.perso.stage(inn.querySelector('.auth-cv'),{hello:true,autoWave:true});if(st)setTimeout(function(){st.jump()},300);
    fresh=false;
    inn.querySelector('[data-acc]').onclick=function(){close();PP.go('account')};inn.querySelector('[data-play]').onclick=function(){close();PP.go('menu')};
  }
  /* l'étape suivante survit au rechargement de la page qui suit la connexion */
  function ob(v){try{if(v===undefined)return sessionStorage.getItem('pp-onboard');if(v===null)sessionStorage.removeItem('pp-onboard');else sessionStorage.setItem('pp-onboard',v)}catch(e){}}
  function sync(){
    if(!C)return;
    if(C.state==='need-device'){deviceStep();return}
    if(C.state==='need-name'){nameStep();return}
    if(C.user&&C.name&&(C.state==='sync'||C.state==='error')){
      var o=ob();
      if(o==='perso'){ob(null);fresh=true;persoStep();return}
      if(o==='login'||(ov&&step==='login')){ob(null);close();PP.toast('Connecté : salut '+C.name+' !','ok');PP.sfx.play('win');if(PP.cur()!=='account')PP.go('account');return}
    }
    if(!ov)return;
    if(!C.user&&step==='login'&&C.note){var n=ov.querySelector('.auth-note');if(!n)form('login')}
  }
  if(C&&C.on){var last='';C.on(function(){var s=C.state+'|'+(C.user&&C.user.uid)+'|'+C.name;if(s===last)return;last=s;sync()})}
  PP.auth={open:function(mode){if(!C||C.state==='off'){PP.toast('Comptes en ligne indisponibles','warn');return}if(C.user&&C.name){PP.go('account');return}if(C.state==='need-name')return nameStep();if(C.state==='need-device')return deviceStep();fresh=false;form(mode==='login'?'login':'signup')},close:close};
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ov&&step!=='perso')close()});
  document.addEventListener('click',function(e){var b=e.target.closest('[data-auth]');if(b&&!b.closest('#acc-box')){e.preventDefault();PP.auth.open(b.dataset.auth)}});

  /* ---------- Ton perso sur l'accueil ---------- */
  var home=null,bubT=0;
  var LINES=['Salut {n} !','On fait une partie ?','Clique-moi !','Prêt pour Zone Morte ?','Tes potes t\'attendent','Joli look aujourd\'hui'];
  function homeSetup(){
    var mast=document.querySelector('#v-menu .mast');if(!mast||!window.THREE||mast.querySelector('.mast-perso'))return;
    var d=document.createElement('div');d.className='mast-perso';d.innerHTML='<div class="mp-bub" id="mp-bub"></div><canvas id="mp-cv" aria-label="Ton perso"></canvas><button type="button" class="mini ghost mp-edit" data-go="perso">Modifier mon perso</button>';
    mast.insertBefore(d,mast.querySelector('.mast-side'));mast.classList.add('has-perso');
    home=PP.perso.stage(PP.$('mp-cv'),{hello:true,autoWave:true,yaw:Math.PI+.2,onClick:function(){home.jump();home.wave();say(true)}});
    say();setInterval(function(){if(PP.cur()==='menu')say()},6500);
  }
  var li=0;function say(next){var b=PP.$('mp-bub');if(!b)return;var nm=(C&&C.name)||PP.profile()||'';var l=LINES[li%LINES.length];li++;if(!nm&&l.indexOf('{n}')>=0)l='Salut !';b.textContent=l.replace('{n}',nm);b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
  document.addEventListener('pp-perso',function(e){if(home)home.set(e.detail)});
  if(document.readyState==='complete')setTimeout(homeSetup,50);else window.addEventListener('load',function(){setTimeout(homeSetup,50)});
})();
