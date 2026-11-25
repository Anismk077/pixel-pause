/* Pixel Pause — comptes en ligne (Firebase) : connexion Google ou lien par mail,
   et synchronisation de tout le profil (records, stats, réglages, survie) entre appareils. */
window.PP_CLOUD_CFG=window.PP_CLOUD_CFG||null;
(function(){
  'use strict';
  var C={ready:false,user:null,state:'off',listeners:[]};PP.cloud=C;
  function emit(){C.listeners.forEach(function(f){try{f(C)}catch(e){}})}
  C.on=function(f){C.listeners.push(f)};
  var cfg=window.PP_CLOUD_CFG;if(!cfg)return;
  var V='10.12.2',base='https://www.gstatic.com/firebasejs/'+V+'/';
  function load(src){return new Promise(function(ok,ko){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s)})}
  C.state='loading';
  load(base+'firebase-app-compat.js').then(function(){return Promise.all([load(base+'firebase-auth-compat.js'),load(base+'firebase-firestore-compat.js')])}).then(init).catch(function(){C.state='error';emit()});
  var auth,db,pushT=null,lastSent='';
  function clean(n){return (n||'').replace(/[^\wÀ-ÿ .-]/g,'').trim().slice(0,14)||'Joueur'}
  function profiles(){try{return JSON.parse(localStorage.getItem('pp-profiles'))||[]}catch(e){return []}}
  function prefix(name){return 'pp-p-'+name+'-'}
  function snapshot(name){var p=prefix(name),d={};Object.keys(localStorage).forEach(function(k){if(k.indexOf(p)===0&&k.slice(p.length)!=='cloud-t')d[k.slice(p.length)]=localStorage.getItem(k)});return d}
  function init(){
    firebase.initializeApp(cfg);auth=firebase.auth();db=firebase.firestore();C.ready=true;C.state='ready';
    try{auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)}catch(e){}
    /* retour depuis le lien reçu par mail */
    if(auth.isSignInWithEmailLink(location.href)){var em=localStorage.getItem('pp-cloud-email')||prompt('Confirme ton adresse mail');if(em)auth.signInWithEmailLink(em,location.href).then(function(){localStorage.removeItem('pp-cloud-email');history.replaceState(null,'',location.pathname+'#account')}).catch(function(e){PP.toast('Lien expiré ou déjà utilisé','warn')})}
    auth.onAuthStateChanged(function(u){C.user=u;emit();if(u)attach(u);});
    emit();
  }
  /* rattache le compte en ligne à un profil de ce navigateur, puis synchronise */
  function attach(u){
    var map={};try{map=JSON.parse(localStorage.getItem('pp-cloud-map'))||{}}catch(e){}
    var name=map[u.uid];
    if(!name){var want=clean(u.displayName||(u.email||'').split('@')[0]),list=profiles(),n=want,i=2;while(list.some(function(p){return p.n.toLowerCase()===n.toLowerCase()&&p.uid!==u.uid})){n=(want.slice(0,12)+i++)}name=n;map[u.uid]=name;localStorage.setItem('pp-cloud-map',JSON.stringify(map));
      if(!list.some(function(p){return p.n===name})){list.push({n:name,pin:null,t:Date.now(),uid:u.uid});localStorage.setItem('pp-profiles',JSON.stringify(list))}}
    C.name=name;
    db.collection('users').doc(u.uid).get().then(function(doc){
      var remote=doc.exists?doc.data():null,lt=+localStorage.getItem(prefix(name)+'cloud-t')||0;
      if(remote&&remote.t>lt){Object.keys(localStorage).forEach(function(k){if(k.indexOf(prefix(name))===0)localStorage.removeItem(k)});Object.keys(remote.d||{}).forEach(function(k){localStorage.setItem(prefix(name)+k,remote.d[k])});localStorage.setItem(prefix(name)+'cloud-t',remote.t)}
      else push(true);
      if(PP.profile()!==name){localStorage.setItem('pp-profile',name);location.reload();return}
      C.state='sync';emit();schedule();
    }).catch(function(e){C.state='error';C.err=String(e&&e.message||e);emit()});
  }
  function push(force){if(!C.user||!C.name)return;var d=snapshot(C.name),js=JSON.stringify(d);if(!force&&js===lastSent)return;lastSent=js;var t=Date.now();
    db.collection('users').doc(C.user.uid).set({d:d,t:t,name:C.name,email:C.user.email||''}).then(function(){localStorage.setItem(prefix(C.name)+'cloud-t',t);C.lastSync=t;C.state='sync';emit()}).catch(function(e){C.state='error';C.err=String(e&&e.message||e);emit()})}
  function schedule(){clearInterval(pushT);pushT=setInterval(function(){push(false)},20000)}
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')push(false)});
  C.google=function(){var p=new firebase.auth.GoogleAuthProvider();return auth.signInWithPopup(p).catch(function(e){if(e&&e.code==='auth/popup-blocked')return auth.signInWithRedirect(p);throw e})};
  C.email=function(addr){localStorage.setItem('pp-cloud-email',addr);return auth.sendSignInLinkToEmail(addr,{url:location.origin+location.pathname+'#account',handleCodeInApp:true})};
  C.logout=function(){push(true);setTimeout(function(){auth.signOut().then(function(){localStorage.setItem('pp-profile','');location.hash='account';location.reload()})},400)};
  C.syncNow=function(){push(true)};
})();
