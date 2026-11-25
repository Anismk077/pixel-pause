/* Pixel Pause — comptes en ligne (Firebase).
   Connexion par mail + mot de passe (ou Google), adresse mail à confirmer, et confirmation par lien
   envoyé sur le mail à chaque nouvel appareil. Sauvegarde en ligne du profil (records, survie, perso, réglages),
   pseudo unique, amis, messages privés, présence (en ligne / dans un salon). */
window.PP_CLOUD_CFG=window.PP_CLOUD_CFG||{apiKey:'AIzaSyBM4-trHYAvg0bPShkUOhJAIt4lZWdo8Fc',authDomain:'pixel-pause.firebaseapp.com',projectId:'pixel-pause',storageBucket:'pixel-pause.firebasestorage.app',messagingSenderId:'928047436508',appId:'1:928047436508:web:b95eeb6701f520e7d2da19'};
(function(){
  'use strict';
  var C={ready:false,user:null,state:'off',listeners:[],friends:[],unread:{},verified:false,name:null};PP.cloud=C;
  function emit(){C.listeners.forEach(function(f){try{f(C)}catch(e){console.error(e)}})}
  C.on=function(f){C.listeners.push(f)};
  var readyCbs=[];C.whenReady=function(f){if(C.db)f(C.db);else readyCbs.push(f)};
  var cfg=window.PP_CLOUD_CFG;if(!cfg)return;
  var V='10.12.2',base='https://www.gstatic.com/firebasejs/'+V+'/';
  function load(src){return new Promise(function(ok,ko){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s)})}
  C.state='loading';
  load(base+'firebase-app-compat.js').then(function(){return Promise.all([load(base+'firebase-auth-compat.js'),load(base+'firebase-firestore-compat.js')])}).then(init).catch(function(){C.state='error';C.err='Impossible de charger les comptes en ligne (connexion ?)';emit()});

  var auth,db,FV,pushT=null,lastSent='',holding=false,method=null;
  var HOME=location.origin+location.pathname;
  function noop(){}
  function dev(){var d=null;try{d=localStorage.getItem('pp-dev');if(!d){d=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('pp-dev',d)}}catch(e){d='x'}return d}
  function clean(n){return (n||'').replace(/[^\wÀ-ÿ .-]/g,'').replace(/\s+/g,' ').trim().slice(0,14)}
  function low(n){return clean(n).toLowerCase()}
  C.cleanName=clean;
  function av(){try{return PP.perso?JSON.parse(JSON.stringify(PP.perso.get())):null}catch(e){return null}}
  var ERR={'auth/email-already-in-use':'Un compte existe déjà avec ce mail. Connecte-toi.','auth/invalid-email':'Adresse mail invalide.','auth/weak-password':'Mot de passe trop faible.','auth/invalid-credential':'Mail ou mot de passe incorrect.','auth/invalid-login-credentials':'Mail ou mot de passe incorrect.','auth/wrong-password':'Mail ou mot de passe incorrect.','auth/user-not-found':'Mail ou mot de passe incorrect.','auth/too-many-requests':'Trop d\'essais. Attends quelques minutes puis réessaie.','auth/network-request-failed':'Pas de connexion Internet.','auth/popup-closed-by-user':'Fenêtre Google fermée.','auth/cancelled-popup-request':'Fenêtre Google fermée.','auth/popup-blocked':'Le navigateur a bloqué la fenêtre Google.','auth/user-disabled':'Ce compte est désactivé.','auth/requires-recent-login':'Reconnecte-toi puis recommence.','auth/invalid-action-code':'Lien expiré ou déjà utilisé.','auth/expired-action-code':'Lien expiré.','auth/missing-password':'Entre ton mot de passe.','permission-denied':'Action refusée.','unavailable':'Serveur injoignable, réessaie.'};
  C.msg=function(e){return ERR[e&&e.code]||(e&&e.message)||String(e)};
  function fail(m){return Promise.reject({message:m})}

  function init(){
    firebase.initializeApp(cfg);auth=firebase.auth();db=firebase.firestore();FV=firebase.firestore.FieldValue;C.ready=true;C.state='ready';C.db=db;C.FV=FV;readyCbs.forEach(function(f){try{f(db)}catch(e){console.error(e)}});readyCbs=[];
    try{auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)}catch(e){}
    try{auth.languageCode=(document.documentElement.lang||'fr').slice(0,2)}catch(e){}
    if(auth.isSignInWithEmailLink(location.href)){holding=true;finishLink()}
    auth.onAuthStateChanged(function(u){
      C.user=u;
      if(!u){stopSocial();C.name=null;C.verified=false;if(C.state!=='need-device')C.state='ready';emit();return}
      if(holding)return;
      proceed(u);
    });
    emit();
  }

  /* ---------- Vérification d'un nouvel appareil : lien envoyé sur le mail ---------- */
  function askDevice(u){
    var em=u.email;
    try{localStorage.setItem('pp-2fa',JSON.stringify({uid:u.uid,email:em,t:Date.now()}))}catch(e){}
    return auth.sendSignInLinkToEmail(em,{url:HOME+'#account',handleCodeInApp:true}).then(function(){
      C.pendingEmail=em;C.state='need-device';return auth.signOut()}).then(emit).catch(function(e){C.state='ready';C.note=C.msg(e);auth.signOut();emit()});
  }
  function finishLink(){
    var p=null;try{p=JSON.parse(localStorage.getItem('pp-2fa'))}catch(e){}
    var url=location.href;try{history.replaceState(null,'',location.pathname+'#account')}catch(e){}
    if(!p||!p.email||Date.now()-p.t>3600e3){holding=false;C.state='ready';C.note='Ce lien doit être ouvert sur l\'appareil où tu as tapé ton mot de passe, dans l\'heure qui suit. Reconnecte-toi pour en recevoir un nouveau.';emit();return}
    auth.signInWithEmailLink(p.email,url).then(function(r){
      try{localStorage.removeItem('pp-2fa')}catch(e){}
      if(r.user.uid!==p.uid){holding=false;return auth.signOut()}
      return db.collection('users').doc(r.user.uid).set({devs:FV.arrayUnion(dev())},{merge:true}).then(function(){holding=false;C.note='';PP.toast&&PP.toast('Appareil confirmé','ok');proceed(r.user)});
    }).catch(function(e){holding=false;C.state='ready';C.note=C.msg(e);emit();try{auth.signOut()}catch(x){}});
  }

  /* ---------- Après connexion : appareil connu ? pseudo ? puis synchro ---------- */
  function proceed(u){
    C.state='checking';emit();
    var ref=db.collection('users').doc(u.uid);
    ref.get().then(function(doc){
      var data=doc.exists?doc.data():{},devs=data.devs||[];
      var viaGoogle=method==='google'||(method===null&&u.providerData.some(function(p){return p.providerId==='google.com'}));
      if(!viaGoogle&&devs.length&&devs.indexOf(dev())<0)return askDevice(u);
      method=null;
      if(devs.indexOf(dev())<0)ref.set({devs:FV.arrayUnion(dev())},{merge:true}).catch(noop);
      var fresh=u.emailVerified?Promise.resolve():u.reload().then(function(){if(auth.currentUser&&auth.currentUser.emailVerified)return auth.currentUser.getIdToken(true)}).catch(noop);
      return fresh.then(function(){u=auth.currentUser||u;return db.collection('banned').doc(u.uid).get().then(function(b){if(b.exists){C.note='Ce compte a été banni du site.'+(b.data().why?' Raison : '+b.data().why:'');C.state='ready';throw {banned:1}}},function(){})}).then(function(){return db.collection('profiles').doc(u.uid).get()}).then(function(pd){
        if(!pd.exists||!pd.data().name){C.state='need-name';emit();return}
        C.name=pd.data().name;C.noReq=!!pd.data().noReq;C.verified=!!u.emailVerified;attach(u,data);
      });
    }).catch(function(e){if(e&&e.banned){auth.signOut();emit();return}C.state='error';C.err=C.msg(e);emit()});
  }
  function profiles(){try{return JSON.parse(localStorage.getItem('pp-profiles'))||[]}catch(e){return []}}
  function prefix(name){return 'pp-p-'+name+'-'}
  function snapshot(name){var p=prefix(name),d={};Object.keys(localStorage).forEach(function(k){if(k.indexOf(p)===0&&k.slice(p.length)!=='cloud-t')d[k.slice(p.length)]=localStorage.getItem(k)});return d}
  /* le compte en ligne utilise un profil de ce navigateur qui porte son pseudo */
  function attach(u,remote){
    var map={};try{map=JSON.parse(localStorage.getItem('pp-cloud-map'))||{}}catch(e){}
    var list=profiles(),name=map[u.uid];
    if(!name||!list.some(function(p){return p.n===name})){
      var n=C.name,i=2;while(list.some(function(p){return p.n.toLowerCase()===n.toLowerCase()&&p.uid&&p.uid!==u.uid}))n=C.name.slice(0,12)+i++;
      name=n;map[u.uid]=name;localStorage.setItem('pp-cloud-map',JSON.stringify(map));
      var ex=list.filter(function(p){return p.n.toLowerCase()===name.toLowerCase()})[0];
      if(ex){ex.uid=u.uid;name=ex.n;map[u.uid]=name;localStorage.setItem('pp-cloud-map',JSON.stringify(map))}else list.push({n:name,pin:null,t:Date.now(),uid:u.uid});
      localStorage.setItem('pp-profiles',JSON.stringify(list));
    }
    C.local=name;
    var lt=+localStorage.getItem(prefix(name)+'cloud-t')||0,wait=Promise.resolve();
    if(remote&&remote.d&&remote.t>lt){Object.keys(localStorage).forEach(function(k){if(k.indexOf(prefix(name))===0)localStorage.removeItem(k)});Object.keys(remote.d).forEach(function(k){localStorage.setItem(prefix(name)+k,remote.d[k])});localStorage.setItem(prefix(name)+'cloud-t',remote.t)}
    else wait=push(true);
    wait.then(function(){
      if(PP.profile()!==name){localStorage.setItem('pp-profile',name);location.reload();return}
      C.state='sync';emit();schedule();if(C.verified)startSocial();
    });
  }
  function push(force){
    if(!C.user||!C.local)return Promise.resolve();var d=snapshot(C.local),js=JSON.stringify(d);if(!force&&js===lastSent)return Promise.resolve();lastSent=js;var t=Date.now();
    var o={d:d,t:t,name:C.name,email:C.user.email||''},ref=db.collection('users').doc(C.user.uid);
    return ref.update(o).catch(function(e){if(e&&e.code==='not-found')return ref.set(o,{merge:true});throw e}).then(function(){localStorage.setItem(prefix(C.local)+'cloud-t',t);C.lastSync=t;if(C.state!=='checking')C.state='sync';emit()}).catch(function(e){C.state='error';C.err=C.msg(e);emit()});
  }
  /* sauvegarde immédiate : chaque changement du profil part en ligne (regroupé, au plus toutes les 3 s) */
  var soonT=null,lastPush=0;
  C.saveSoon=function(){if(!C.user||!C.local)return;clearTimeout(soonT);soonT=setTimeout(function(){lastPush=Date.now();push(false)},Math.max(800,3000-(Date.now()-lastPush)))};
  try{var oSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){oSet.call(this,k,v);try{if(C.local&&this===window.localStorage&&String(k).indexOf('pp-p-'+C.local+'-')===0&&!/cloud-t$/.test(k))C.saveSoon()}catch(e){}}}catch(e){}
  document.addEventListener('pp-perso',function(){if(socialOn)setTimeout(presence,300)});
  window.addEventListener('pagehide',function(){push(false)});
  function schedule(){clearInterval(pushT);pushT=setInterval(function(){push(false);if(C.user&&!C.verified&&document.visibilityState==='visible')C.checkVerified().then(function(ok){if(ok)PP.toast&&PP.toast('Adresse mail confirmée','ok')})},20000)}
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')push(false)});

  /* ---------- Actions du compte ---------- */
  function goodPass(p){return p&&p.length>=8&&/[a-zA-Z]/.test(p)&&/\d/.test(p)}
  C.goodPass=goodPass;
  C.signup=function(name,email,pass){
    name=clean(name);if(name.length<2)return fail('Choisis un pseudo d\'au moins 2 lettres.');
    if(!goodPass(pass))return fail('Mot de passe : 8 caractères minimum, avec au moins une lettre et un chiffre.');
    var key=name.toLowerCase(),u=null;holding=true;method='password';
    return db.collection('usernames').doc(key).get().then(function(d){if(d.exists)throw {message:'Ce pseudo est déjà pris.'};return auth.createUserWithEmailAndPassword(email,pass)})
      .then(function(r){u=r.user;return db.collection('usernames').doc(key).set({uid:u.uid,name:name}).catch(function(){return u.delete().then(function(){u=null;throw {message:'Ce pseudo vient d\'être pris. Choisis-en un autre.'}})})})
      .then(function(){return Promise.all([u.updateProfile({displayName:name}),db.collection('profiles').doc(u.uid).set({name:name,av:av(),seen:Date.now()}),db.collection('users').doc(u.uid).set({devs:[dev()]},{merge:true})])})
      .then(function(){return u.sendEmailVerification({url:HOME+'#account'}).catch(noop)})
      .then(function(){holding=false;method=null;if(PP.site&&PP.site.newAccount)PP.site.newAccount();proceed(u)})
      .catch(function(e){holding=false;if(auth.currentUser)proceed(auth.currentUser);throw e});
  };
  C.login=function(email,pass){method='password';C.note='';return auth.signInWithEmailAndPassword(email,pass).catch(function(e){method=null;throw e})};
  C.google=function(){method='google';C.note='';var p=new firebase.auth.GoogleAuthProvider();return auth.signInWithPopup(p).catch(function(e){if(e&&e.code==='auth/popup-blocked')return auth.signInWithRedirect(p);method=null;throw e})};
  C.reset=function(email){return auth.sendPasswordResetEmail(email,{url:HOME+'#account'})};
  C.resendVerify=function(){var u=auth&&auth.currentUser;return u?u.sendEmailVerification({url:HOME+'#account'}):fail('Pas connecté')};
  C.checkVerified=function(){var u=auth&&auth.currentUser;if(!u)return Promise.resolve(false);return u.reload().then(function(){return auth.currentUser.getIdToken(true)}).then(function(){C.verified=!!auth.currentUser.emailVerified;emit();if(C.verified)startSocial();return C.verified})};
  C.claimName=function(name){
    var u=auth&&auth.currentUser;if(!u)return fail('Pas connecté');name=clean(name);if(name.length<2)return fail('Choisis un pseudo d\'au moins 2 lettres.');var key=name.toLowerCase();
    return db.collection('usernames').doc(key).get().then(function(d){if(d.exists&&d.data().uid!==u.uid)throw {message:'Ce pseudo est déjà pris.'};if(!d.exists)return db.collection('usernames').doc(key).set({uid:u.uid,name:name})})
      .then(function(){return db.collection('profiles').doc(u.uid).set({name:name,av:av(),seen:Date.now()},{merge:true})}).then(function(){return u.updateProfile({displayName:name}).catch(noop)}).then(function(){proceed(u)});
  };
  C.cancel=function(){C.state='ready';C.note='';C.pendingEmail=null;emit()};
  C.logout=function(){stopSocial();var p=push(true);setTimeout(function(){p.then(function(){return auth.signOut()},function(){return auth.signOut()}).then(function(){localStorage.setItem('pp-profile','');location.hash='account';location.reload()})},200)};
  C.syncNow=function(){return push(true)};

  /* avis des joueurs : une note (1 à 5) par compte et par jeu, lisible par tous */
  C.rate=function(id,n){if(!db||!C.user)return;if(!C.verified){PP.toast&&PP.toast('Confirme ton adresse mail pour noter','warn');return}var o={};o['u:'+C.user.uid]=n;db.collection('ratings').doc(id).set(o,{merge:true}).catch(function(){})};
  C.ratings=function(cb){if(!db)return;db.collection('ratings').get().then(function(s){var d={};s.forEach(function(doc){d[doc.id]=doc.data()});cb(d)}).catch(function(){})};

  /* ---------- Présence : en ligne, dans quel salon ---------- */
  var presT=null,roomJ='null',avJ='';C.room=null;
  var PAGES={menu:1,room:1,join:1,perso:1,friends:1,account:1,settings:1,admin:1};
  function curGame(){var v=PP.cur&&PP.cur();return v&&!PAGES[v]?v:null}
  /* stats publiques (mini profil) : parties, victoires, temps de jeu, jeu préféré */
  function pubStats(){var pre=prefix(C.local||''),p=0,w=0,fav='',fm=0;Object.keys(localStorage).forEach(function(k){if(k.indexOf(pre+'st-')!==0)return;var m=/^st-(.+)-(parties|win)$/.exec(k.slice(pre.length));if(!m)return;var v=+localStorage.getItem(k)||0;if(m[2]==='parties'){p+=v;if(v>fm){fm=v;fav=m[1]}}else w+=v});
    var since=0;try{since=Date.parse(C.user.metadata.creationTime)||0}catch(e){}return {p:p,w:w,time:Math.round(+localStorage.getItem(pre+'play-time')||0),fav:fav,since:since}}
  C.status=function(){try{return localStorage.getItem('pp-status')||'on'}catch(e){return 'on'}};
  C.setStatus=function(s){try{localStorage.setItem('pp-status',s)}catch(e){}presence();emit()};
  /* état d'un joueur à partir de son profil : on, busy (occupé), game (en partie), off */
  C.statusOf=function(pr){if(!pr||!pr.seen||pr.seen<Date.now()-150000||pr.st==='off')return 'off';if(pr.st==='busy')return 'busy';if(pr.g)return 'game';return 'on'};
  C.setNoReq=function(v){C.noReq=!!v;if(C.user)return db.collection('profiles').doc(C.user.uid).set({name:C.name,noReq:!!v},{merge:true});return Promise.resolve()};
  function presence(){if(!C.user||!C.name||!C.verified)return;var a=av();avJ=JSON.stringify(a);db.collection('profiles').doc(C.user.uid).set({name:C.name,av:a,seen:Date.now(),room:C.room||null,st:C.status(),g:curGame(),stats:pubStats()},{merge:true}).catch(noop)}
  var gT=0;document.addEventListener('pp-go',function(){clearTimeout(gT);gT=setTimeout(function(){if(socialOn)presence()},1200)});
  C.setRoom=function(r){var j=JSON.stringify(r||null);if(j===roomJ)return;roomJ=j;C.room=r||null;presence()};
  setInterval(function(){if(socialOn&&JSON.stringify(av())!==avJ)presence()},5000);

  /* ---------- Amis ---------- */
  var socialOn=false,unsubs=[],fUn={},cUn={},seenReq={},reqInit=false,lastNote={},openUn=null;
  function fdoc(a,b){return db.collection('friends').doc(a).collection('list').doc(b)}
  function friend(uid){return C.friends.filter(function(f){return f.uid===uid})[0]}
  C.friend=friend;
  C.friendUids=function(){return C.friends.filter(function(f){return f.status==='friends'}).map(function(f){return f.uid})};
  C.online=function(f){return !!(f&&f.prof&&f.prof.seen>Date.now()-150000)};
  C.badge=function(){return Object.keys(C.unread).length+C.friends.filter(function(f){return f.status==='pending_in'}).length};
  function startSocial(){
    if(socialOn||!C.user||!C.verified)return;socialOn=true;
    presence();clearInterval(presT);presT=setInterval(presence,60000);
    unsubs.push(db.collection('banned').doc(C.user.uid).onSnapshot(function(d){if(d.exists){PP.toast&&PP.toast('Ce compte a été banni du site.','warn');setTimeout(C.logout,1500)}},noop));
    unsubs.push(db.collection('friends').doc(C.user.uid).collection('list').onSnapshot(function(s){
      var l=[];s.forEach(function(d){var x=d.data();x.uid=d.id;var old=friend(d.id);if(old)x.prof=old.prof;l.push(x)});
      l.forEach(function(f){if(f.status==='pending_in'&&!seenReq[f.uid]&&reqInit){PP.toast&&PP.toast(f.name+' veut être ton ami','ok');try{PP.sfx.play('join')}catch(e){}}if(f.status==='pending_in')seenReq[f.uid]=1});
      reqInit=true;C.friends=l;watch();emit();
    },function(e){console.warn('amis',e)}));
  }
  function stopSocial(){socialOn=false;clearInterval(presT);unsubs.forEach(function(f){f()});unsubs=[];Object.keys(fUn).forEach(function(k){fUn[k]()});Object.keys(cUn).forEach(function(k){cUn[k]()});fUn={};cUn={};C.friends=[];C.unread={};if(openUn)openUn();openUn=null}
  function lrKey(uid){return 'pp-lr-'+(C.user?C.user.uid:'')+'-'+uid}
  function watch(){
    var want={};C.friends.forEach(function(f){if(f.status==='friends')want[f.uid]=1});
    Object.keys(fUn).forEach(function(id){if(!want[id]){fUn[id]();delete fUn[id];if(cUn[id]){cUn[id]();delete cUn[id]}delete C.unread[id]}});
    Object.keys(want).forEach(function(id){
      if(fUn[id])return;
      fUn[id]=db.collection('profiles').doc(id).onSnapshot(function(d){var f=friend(id);if(f){f.prof=d.data()||{};emit()}},noop);
      var first=true;
      cUn[id]=chatCol(id).orderBy('t','desc').limit(1).onSnapshot(function(s){
        s.forEach(function(d){var m=d.data(),lr=+localStorage.getItem(lrKey(id))||0;
          if(m.from!==C.user.uid&&m.t>lr&&C.openChat!==id){C.unread[id]=1;
            if(!first&&lastNote[id]!==m.t){lastNote[id]=m.t;var f=friend(id);PP.toast&&PP.toast((f?(f.prof&&f.prof.name||f.name):'?')+' : '+String(m.text).slice(0,60),'ok');try{PP.sfx.play('ui')}catch(e){}}}
          else delete C.unread[id]});
        first=false;emit();
      },noop);
    });
  }
  C.addFriend=function(name){
    if(!C.user||!C.verified)return fail('Connecte-toi et confirme ton mail d\'abord.');
    var key=low(name);if(key.length<2)return fail('Entre le pseudo de ton ami.');
    return db.collection('usernames').doc(key).get().then(function(d){
      if(!d.exists)throw {message:'Aucun joueur avec ce pseudo.'};var o=d.data();
      if(o.uid===C.user.uid)throw {message:'C\'est ton propre pseudo !'};
      return db.collection('profiles').doc(o.uid).get().then(function(pd){var ex0=friend(o.uid);if(pd.exists&&pd.data().noReq&&!(ex0&&ex0.status==='pending_in'))throw {message:o.name+' n\'accepte pas les demandes d\'ami pour l\'instant.'};return o})}).then(function(o){
      var ex=friend(o.uid);if(ex&&ex.status==='friends')throw {message:'Vous êtes déjà amis.'};
      if(ex&&ex.status==='pending_in')return C.accept(o.uid).then(function(){return o.name});
      if(ex&&ex.status==='pending_out')throw {message:'Demande déjà envoyée.'};
      var b=db.batch(),t=Date.now();b.set(fdoc(C.user.uid,o.uid),{status:'pending_out',name:o.name,t:t});b.set(fdoc(o.uid,C.user.uid),{status:'pending_in',name:C.name,t:t});
      return b.commit().then(function(){return o.name},function(){throw {message:'Impossible d\'envoyer la demande à '+o.name+'.'}});
    });
  };
  C.addFriendUid=function(uid){return db.collection('profiles').doc(uid).get().then(function(d){if(!d.exists)throw {message:'Joueur introuvable.'};return C.addFriend(d.data().name)})};
  C.accept=function(uid){var b=db.batch();b.update(fdoc(C.user.uid,uid),{status:'friends'});b.update(fdoc(uid,C.user.uid),{status:'friends'});return b.commit()};
  C.remove=function(uid){var b=db.batch();b.delete(fdoc(C.user.uid,uid));b.delete(fdoc(uid,C.user.uid));return b.commit()};

  /* ---------- Messages privés ---------- */
  function cid(uid){return [C.user.uid,uid].sort().join('_')}
  function chatCol(uid){return db.collection('chats').doc(cid(uid)).collection('msgs')}
  function markRead(uid){try{localStorage.setItem(lrKey(uid),Date.now())}catch(e){}if(C.unread[uid]){delete C.unread[uid];emit()}}
  C.openChatWith=function(uid,cb){C.closeChat();C.openChat=uid;markRead(uid);
    openUn=chatCol(uid).orderBy('t','desc').limit(60).onSnapshot(function(s){var l=[];s.forEach(function(d){l.push(d.data())});l.reverse();markRead(uid);cb(l)},function(e){cb(null,e)})};
  C.closeChat=function(){if(openUn)openUn();openUn=null;C.openChat=null};
  C.sendDM=function(uid,text,extra){if(!C.user||!C.verified)return fail('Pas connecté');text=String(text||'').trim().slice(0,500);if(!text)return Promise.resolve();
    var m={from:C.user.uid,text:text,t:Date.now()};if(extra)Object.keys(extra).forEach(function(k){m[k]=extra[k]});return chatCol(uid).add(m)};
})();
