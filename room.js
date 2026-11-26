/* Pixel Pause — salons.
   Page Salon : joueurs en ligne sur le site, salons de tes amis, salons publics, créer un salon, rejoindre avec un code.
   Dans un salon : persos des joueurs (mini profil au clic), chat avec emojis, jeux proposés (vote en un clic dans le chat),
   réglages du chef (privé / amis / public, comptes seulement, chef décide ou vote), invitations d'amis, exclure, nommer chef,
   et un panneau du salon pendant les parties. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,box=$('room-box'),T=function(s){return PP.t?PP.t(s):s},C=PP.cloud;
  var ONLINE=[
    {id:'fps',name:'Zone Morte',desc:'Zombies en équipe, on se relève entre potes',min:1,max:8},
    {id:'party',name:'Dernier Debout',desc:'Épreuves éliminatoires, bots en renfort',min:1,max:8},
    {id:'surv',name:'Survie',desc:'La même île pour tout le salon',min:1},
    {id:'sumo',name:'Sumo Arena',desc:'Pousse les autres dans le vide',min:2,max:4},
    {id:'foot',name:'Foot 2v2',desc:'Équipes mélangées, bots si besoin',min:2,max:4},
    {id:'kart',name:'Pixel Kart',desc:'Course de 3 tours',min:2,max:8},
    {id:'run',name:'Néon Rush',desc:'Celui qui va le plus loin',min:2},
    {id:'time',name:'Quand et où',desc:'Année et lieu, le meilleur score gagne',min:2},
    {id:'geo',name:'Devine où',desc:'Le plus proche gagne la manche',min:2},
    {id:'imp',name:'Mot imposteur',desc:'Chacun son mot sur son téléphone',min:3},
    {id:'prob',name:'Le plus probable',desc:'Votes entre potes',min:3},
    {id:'snake',name:'Paquet Snake',desc:'2 à 4 serpents',min:2,max:4},
    {id:'draw',name:'Dessine et devine',desc:'Un dessine, les autres devinent',min:2},
    {id:'quiz',name:'Quiz',desc:'Culture générale, le plus rapide marque',min:2},
    {id:'typing',name:'Course de frappe',desc:'Tape la phrase le plus vite',min:2},
    {id:'reflex',name:'Réflexes',desc:'Appuie dès que ça devient rouge',min:2},
    {id:'c4',name:'Quatre en ligne',desc:'Aligne 4 jetons',min:2,max:2},
    {id:'navale',name:'Bataille navale',desc:'Coule la flotte d\'en face',min:2,max:2}
  ];
  var GN={};ONLINE.forEach(function(g){GN[g.id]=g.name});
  var curGame=null;

  /* ---------- État du salon (tenu par le chef, envoyé à tout le monde) ---------- */
  function fresh(){return {name:'',vis:'invite',acc:false,mode:'chef',props:{}}}
  var rs=fresh(),chat=[];
  function defName(){return (T('Salon de ')+(net.me.name||'')).trim()}
  function myUid(){return C&&C.user&&C.verified?C.user.uid:null}
  function pushRs(){if(!net.isHost)return;net.broadcast({t:'rs',s:rs});publish();paint()}
  function sysMsg(txt){addChat({sys:1,txt:txt,ts:Date.now()})}
  function addChat(m){chat.push(m);if(chat.length>80)chat.shift();if(net.isHost)net.broadcast({t:'chatm',m:m});paint();if(!m.sys&&m.id!==net.me.id){sfx.play('ui');unread++;dockBadge()}}
  function say(txt){txt=String(txt||'').trim().slice(0,200);if(!txt)return;if(net.isHost)addChat({n:net.me.name,id:'host',av:avOf('host'),uid:myUid(),txt:txt,ts:Date.now()});else net.send({t:'chat',txt:txt})}
  function propose(g){if(net.isHost)handleProp('host',g);else net.send({t:'prop',game:g})}
  /* une proposition apparaît dans le chat : tout le monde peut voter en cliquant dessus */
  function handleProp(id,g){if(!GN[g])return;var l=rs.props[g]=rs.props[g]||[],i=l.indexOf(id);
    if(i>=0)l.splice(i,1);else{var first=!l.length;l.push(id);var p=pl(id);if(first)addChat({prop:g,n:p?p.name:'?',id:id,ts:Date.now()});else sysMsg((p?p.name:'?')+' '+T('vote pour')+' '+GN[g])}
    if(!l.length)delete rs.props[g];
    if(rs.mode==='vote'&&l.length*2>net.players.length){launch(g);return}pushRs()}
  function launch(g){curGame=g;rs.props={};sysMsg(T('Le salon part sur')+' '+GN[g]);net.all({t:'launch',game:g});pushRs()}
  function pl(id){return net.players.filter(function(p){return p.id===id})[0]}
  function avOf(id){var p=pl(id);return p&&p.av||null}
  function pic(p,size){return PP.perso?PP.perso.img(p&&p.av,size||28,'perso-pic'):''}
  function cloudOk(){return !!(C&&C.user&&C.verified)}
  function isFriend(uid){return !!(uid&&C&&C.friendUids&&C.friendUids().indexOf(uid)>=0)}

  /* qui peut entrer : amis seulement, comptes seulement (sauf ceux qui étaient déjà là, en cas de changement de chef) */
  net.setGate(function(d){var nm=String(d.name||'').slice(0,14);if(known.indexOf(nm)>=0)return true;
    if(rs.acc&&!d.uid)return 'acc';if(rs.vis==='friends'&&!isFriend(d.uid))return 'friends';return true});

  /* ---------- Annuaire des salons (Firestore) : publics et entre amis ---------- */
  var pubT=0,lastPub='';
  function publish(){clearTimeout(pubT);pubT=setTimeout(publishNow,400)}
  function publishNow(){
    if(!C||!C.db)return;var db=C.db;
    if(net.inRoom()&&net.isHost&&rs.vis!=='invite'&&(!net.alive||net.alive())){
      var d={code:net.code,name:(rs.name||defName()).slice(0,28),host:net.me.name,hostUid:myUid(),vis:rs.vis,acc:!!rs.acc,n:net.players.length,game:curGame||null,pl:net.players.slice(0,8).map(function(p){return {n:p.name,av:p.av||null}}),t:Date.now()};
      lastPub=net.code;db.collection('rooms').doc(net.code).set(d).catch(function(){});
    }else if(lastPub){db.collection('rooms').doc(lastPub).delete().catch(function(){});lastPub=''}
  }
  setInterval(function(){if(net.inRoom()&&net.isHost&&rs.vis!=='invite')publishNow()},10000);
  /* la liste se nettoie toute seule : un salon qui ne donne plus signe de vie disparaît */
  var dead={};setInterval(function(){if(PP.cur()==='room'&&!net.inRoom())lists()},5000);
  window.addEventListener('pagehide',function(){if(lastPub&&C&&C.db)C.db.collection('rooms').doc(lastPub).delete()});
  /* tes amis voient dans quel salon tu es (sauf salon privé) */
  function shareRoom(){if(!C||!C.setRoom)return;C.setRoom(net.inRoom()&&rs.vis!=='invite'?{code:net.code,name:rs.name||'',n:net.players.length}:null)}
  PP.setRoomGame=function(g){curGame=g;publish()};
  function gid(){return curGame==='fps-br'?'fps':curGame}
  function backToGame(){var g=gid();if(!g)return;sfx.play('go');PP.go(g);if(!net.isHost)setTimeout(function(){net.send({t:'rejoin',game:g})},250)}
  var replay={},rb0=net.broadcast;
  net.broadcast=function(m,ex){try{var t=m&&m.t,g=gid();if(t&&g&&g!=='fps'&&g!=='surv'){if(/-(go|start)$/.test(t))replay[g]=[m];else if(/-(round|r|inter|b)$/.test(t)&&replay[g]){replay[g]=replay[g].slice(0,1).concat([m])}else if(/-end$/.test(t))delete replay[g]}}catch(e){}return rb0.apply(net,arguments)};
  function catchUp(id,g){if(net.isHost&&g===gid()&&PP.cur()===g&&replay[g])replay[g].forEach(function(m,i){setTimeout(function(){net.to(id,m)},i*150)})}
  setInterval(function(){if(net.inRoom())bar();shareRoom()},1500);document.addEventListener('pp-go',function(){setTimeout(function(){bar();dock()},0)});
  function bar(){
    var rb=$('roombar');
    if(net.inRoom()){rb.hidden=false;$('roombar-txt').textContent=(rs.name||('Salon '+net.code))+' · '+net.players.length+' '+T(net.players.length>1?'joueurs':'joueur')}
    else rb.hidden=true;
    var bk=$('roombar-back');if(!bk){bk=document.createElement('button');bk.type='button';bk.id='roombar-back';bk.className='mini roombar-back';rb.insertBefore(bk,$('roombar-leave'));bk.onclick=backToGame}
    var g=gid(),show=net.inRoom()&&g&&PP.cur()!==g;bk.hidden=!show;if(show)bk.textContent='▶ '+(GN[g]||g)+' · '+T('Rejoindre');
  }
  var leaving=false;
  function leaveRoom(){curGame=null;chat=[];var wasPub=lastPub;rs=fresh();if(net.isHost&&wasPub){publishNow()}if(net.isHost&&net.players.length>1&&net.handover(net.players[1].id,true)){leaving=true;PP.toast(T('On passe le salon à ')+net.players[1].name+'…','ok')}else net.leave();shareRoom();dock()}
  $('roombar-leave').addEventListener('click',function(){leaveRoom();setTimeout(function(){bar();PP.go('menu')},350)});

  /* ---------- Chat ---------- */
  function chatHtml(){return chat.slice(-60).map(function(m,i){
      if(m.sys)return '<div class="ch-sys">'+esc(m.txt)+'</div>';
      if(m.prop){var v=(rs.props[m.prop]||[]),mine=v.indexOf(net.me.id)>=0,open=!!rs.props[m.prop];
        return '<div class="ch-prop'+(open?'':' done')+'"><span class="cp-ico">🎮</span><span class="cp-t"><b>'+esc(m.n)+'</b> '+T('propose')+' <b>'+esc(GN[m.prop]||m.prop)+'</b><small>'+(open?v.length+' / '+net.players.length+' '+T('votes'):T('vote terminé'))+'</small></span>'+(open?'<button type="button" class="mini'+(mine?' on':'')+'" data-prop="'+m.prop+'">'+(mine?T('Voté ✓'):T('Voter'))+'</button>'+(net.isHost?'<button type="button" class="mini primary" data-launch="'+m.prop+'">'+T('Lancer')+'</button>':''):'')+'</div>'}
      return '<div class="ch-msg'+(m.id===net.me.id?' me':'')+'"><span class="ch-av" data-pid="'+esc(m.id||'')+'" data-name="'+esc(m.n)+'">'+pic({av:m.av},24)+'</span><span><b>'+esc(m.n)+'</b> '+esc(m.txt)+'</span></div>'}).join('')||'<p class="muted ch-empty">'+T('Pas encore de message. Dis bonjour !')+'</p>'}
  function chatForm(){return '<form class="ch-form rc-form"><input maxlength="200" placeholder="'+T('Écris un message…')+'" autocomplete="off"><button type="submit" class="primary">'+T('Envoyer')+'</button></form>'}

  /* ---------- Joueurs ---------- */
  function playersHtml(compact){return '<div class="rp-grid'+(compact?' compact':'')+'">'+net.players.map(function(p){var chef=p.id==='host',me=p.id===net.me.id;
    return '<button type="button" class="rp-card'+(chef?' chef':'')+(me?' me':'')+'" data-pid="'+esc(p.id)+'">'+pic(p,compact?40:72)+'<span class="rp-nm">'+esc(p.name)+'</span><span class="rp-tags">'+(chef?'<i class="tg-chef">'+T('chef')+'</i>':'')+(me?'<i>'+T('toi')+'</i>':'')+(!p.uid?'<i class="tg-g">'+T('invité')+'</i>':isFriend(p.uid)?'<i class="tg-f">'+T('ami')+'</i>':'')+'</span></button>'}).join('')+'</div>'}
  function openCard(pid,name){var p=pid&&pl(pid);if(!p&&!name)return;PP.card({uid:p?p.uid:null,name:p?p.name:name,av:p?p.av:null,pid:p?p.id:null,guest:!(p&&p.uid)})}
  function invHtml(){if(!cloudOk())return '';var here={};net.players.forEach(function(p){if(p.uid)here[p.uid]=1});
    var l=(C.friends||[]).filter(function(f){return f.status==='friends'&&!here[f.uid]}).sort(function(a,b){return (C.statusOf(a.prof)==='off')-(C.statusOf(b.prof)==='off')});
    if(!l.length)return '<p class="muted">'+T('Ajoute des amis pour les inviter ici en un clic.')+'</p>';
    return '<ul class="rp-list inv-list">'+l.slice(0,10).map(function(f){var nm=(f.prof&&f.prof.name)||f.name;return '<li>'+pic({av:f.prof&&f.prof.av},28)+'<span class="rp-n">'+esc(nm)+PP.statusHtml(f.prof)+'</span><button type="button" class="mini primary" data-invf="'+f.uid+'">'+T('Inviter')+'</button></li>'}).join('')+'</ul>'}
  function seg(k,opts){return '<div class="seg" data-seg="'+k+'">'+opts.map(function(o){var dis=o[2]&&!cloudOk();return '<button type="button" data-v="'+o[0]+'" class="'+(rs[k]===o[0]?'on':'')+'"'+(dis?' disabled title="'+T('Connecte-toi à ton compte pour ça')+'"':'')+'>'+T(o[1])+'</button>'}).join('')+'</div>'}
  var VIS={invite:'Privé : seulement avec le lien ou le code',friends:'Amis : tes amis le voient et peuvent entrer',public:'Public : tout le monde le voit dans la liste'};
  function gamesHtml(){var n=net.players.length;return '<div class="rg-list">'+ONLINE.map(function(g){
      var ok=n>=g.min,why=ok?(g.max&&n>g.max?T('Les ')+g.max+T(' premiers jouent'):g.desc):T('Il faut ')+g.min+' '+T('joueurs'),votes=(rs.props[g.id]||[]).length,mine=(rs.props[g.id]||[]).indexOf(net.me.id)>=0;
      return '<div class="rg-it'+(ok?'':' locked')+(votes?' voted':'')+'"><img src="thumb-'+g.id+'.jpg?v=3.3" alt="" loading="lazy"><span class="rg-t"><b>'+esc(g.name)+'</b><small>'+esc(why)+'</small></span>'+(votes?'<span class="rt-votes">'+votes+'</span>':'')+
        '<span class="rg-b">'+(net.isHost?'<button type="button" class="mini primary" data-launch="'+g.id+'"'+(ok?'':' disabled')+'>'+T('Lancer')+'</button>':'')+'<button type="button" class="mini ghost'+(mine?' on':'')+'" data-prop="'+g.id+'">'+T(mine?'Proposé ✓':'Proposer')+'</button></span></div>'}).join('')+'</div>'}
  function render(){
    bar();
    if(!net.inRoom())return setup();
    var host=net.isHost,h='<div class="rm2">';
    h+='<div class="rm-top"><div class="rm-tl">'+(host?'<input id="rm-name" maxlength="28" value="'+esc(rs.name||defName())+'" aria-label="Nom du salon">':'<div class="rm-title">'+esc(rs.name||('Salon '+net.code))+'</div>')+
      '<span class="rm-meta"><i class="vis-'+rs.vis+'">'+T({invite:'Privé',friends:'Amis',public:'Public'}[rs.vis])+'</i>'+(rs.acc?'<i>'+T('Comptes seulement')+'</i>':'')+'<i>'+net.players.length+' '+T(net.players.length>1?'joueurs':'joueur')+'</i></span></div>'+
      '<div class="rm-code"><small>'+T('Code')+'</small><b>'+esc(net.code)+'</b></div><button type="button" class="ghost" id="room-copy">'+T('Copier le lien')+'</button><button type="button" class="red" id="room-leave">'+T('Quitter')+'</button></div>';
    h+=playersHtml(false);
    h+='<div class="rm-grid"><div class="panel rm-chat"><label class="lbl">'+T('Chat du salon')+'</label><div class="ch-log" id="rc-log">'+chatHtml()+'</div>'+chatForm()+'</div><div class="rm-side">';
    if(host)h+='<div class="panel"><label class="lbl">'+T('Qui peut entrer')+'</label>'+seg('vis',[['invite','Privé'],['friends','Amis',1],['public','Public']])+'<p class="muted rm-help">'+T(VIS[rs.vis])+'</p>'+
      '<label class="rm-tog"><input type="checkbox" id="rm-acc"'+(rs.acc?' checked':'')+'> '+T('Seulement les joueurs avec un compte (pas d\'invités)')+'</label>'+
      '<label class="lbl" style="margin-top:12px">'+T('Choix du jeu')+'</label>'+seg('mode',[['chef','Le chef décide'],['vote','Vote du salon']])+'</div>';
    else h+='<div class="panel"><p class="muted">'+T(rs.mode==='vote'?'Propose un jeu : dès que plus de la moitié du salon vote pour lui, il se lance.':'Propose un jeu dans le chat, les autres votent, le chef lance.')+'</p></div>';
    h+='<div class="panel"><label class="lbl">'+T('Inviter des amis')+'</label>'+invHtml()+'</div></div></div>';
    h+='<label class="lbl rm-gl">'+T(host?'Lance un jeu, ou regarde ce que le salon propose':'Propose un jeu au salon')+'</label>'+gamesHtml()+'</div>';
    box.innerHTML=h;bindRoom(box);var lg=$('rc-log');if(lg)lg.scrollTop=lg.scrollHeight;
  }
  function bindRoom(root){
    var cp=root.querySelector('#room-copy');if(cp)cp.onclick=function(){var v=net.inviteLink();try{navigator.clipboard.writeText(v)}catch(e){}if(navigator.share&&innerWidth<700)navigator.share({title:'Pixel Pause',text:T('Rejoins mon salon'),url:v}).catch(function(){});cp.textContent=T('Copié !')};
    var lv=root.querySelector('#room-leave');if(lv)lv.onclick=function(){leaveRoom();setTimeout(render,350)};
    var nm=root.querySelector('#rm-name');if(nm)nm.onchange=function(){rs.name=nm.value.trim().slice(0,28)||defName();pushRs();sysMsg(T('Le salon s\'appelle maintenant')+' « '+rs.name+' »')};
    var ac=root.querySelector('#rm-acc');if(ac)ac.onchange=function(){rs.acc=ac.checked;pushRs();sysMsg(T(rs.acc?'Seuls les joueurs avec un compte peuvent entrer':'Les invités peuvent entrer'))};
    root.querySelectorAll('[data-seg]').forEach(function(sg){sg.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){rs[sg.dataset.seg]=b.dataset.v;pushRs();render()}})});
    root.querySelectorAll('.rp-card,[data-pid]').forEach(function(b){b.onclick=function(){openCard(b.dataset.pid,b.dataset.name)}});
    root.querySelectorAll('[data-invf]').forEach(function(b){b.onclick=function(){b.disabled=true;C.sendDM(b.dataset.invf,T('Viens dans mon salon')+(rs.name?' « '+rs.name+' »':'')+' !',{room:{code:net.code,name:rs.name||''}}).then(function(){b.textContent=T('Invité ✓')}).catch(function(e){b.disabled=false;PP.toast(C.msg(e),'warn')})}});
    root.querySelectorAll('[data-launch]').forEach(function(b){b.onclick=function(){launch(b.dataset.launch)}});
    root.querySelectorAll('[data-prop]').forEach(function(b){b.onclick=function(){propose(b.dataset.prop)}});
    root.querySelectorAll('.rc-form').forEach(function(f){var i=f.querySelector('input');if(PP.emojiFor&&!f.querySelector('.emo-btn'))PP.emojiFor(i);i.addEventListener('keydown',function(e){e.stopPropagation()});f.onsubmit=function(e){e.preventDefault();say(i.value);i.value=''}});
  }
  var paintT=0;function paint(){clearTimeout(paintT);paintT=setTimeout(function(){
    if(PP.cur()==='room'&&net.inRoom()){var lg=$('rc-log'),a=document.activeElement;if(lg&&a&&a.closest&&a.closest('.rc-form')){lg.innerHTML=chatHtml();lg.scrollTop=lg.scrollHeight;bindChat(lg)}else render()}
    if(dockOpen)renderDock()},30)}
  function bindChat(lg){lg.querySelectorAll('[data-prop]').forEach(function(b){b.onclick=function(){propose(b.dataset.prop)}});lg.querySelectorAll('[data-launch]').forEach(function(b){b.onclick=function(){launch(b.dataset.launch)}});lg.querySelectorAll('[data-pid]').forEach(function(b){b.onclick=function(){openCard(b.dataset.pid,b.dataset.name)}})}

  /* ---------- Page Salon (pas encore dans un salon) ---------- */
  var dirUn=null,dir=[],vis='invite',acc=false;
  function roomCard(r,tag){var pls=(r.pl||[]).slice(0,5);
    return '<div class="rl-card"><div class="rl-av">'+pls.map(function(p){return pic(p,34)}).join('')+(r.n>5?'<span>+'+(r.n-5)+'</span>':'')+'</div><div class="rl-i"><b>'+esc(r.name||('Salon de '+r.host))+'</b><small>'+(tag?'<i class="tg-f">'+esc(tag)+'</i> ':'')+esc(r.host)+' · '+r.n+' '+T(r.n>1?'joueurs':'joueur')+(r.game?' · '+esc(GN[r.game]||r.game):'')+(r.acc?' · '+T('comptes seulement'):'')+'</small></div><button type="button" class="primary mini" data-join="'+esc(r.code)+'">'+T('Rejoindre')+'</button></div>'}
  function lists(){
    var el=$('rl-lists');if(!el)return;var now=Date.now(),fu=C&&C.friendUids?C.friendUids():[],seen={};
    /* v28 : un salon dont l'hôte ne donne plus signe de vie depuis 25 s disparaît (avant 35 s, et la liste ne se rafraîchissait pas).
       Ton propre salon d'avant un rechargement (« salon fantôme ») est caché et effacé dès 12 s sans nouvelles. */
    var mu=myUid(),live=dir.filter(function(r){if(dead[r.code])return false;if(net.inRoom()&&r.code===net.code)return true;
      if(mu&&r.hostUid===mu&&!(net.inRoom()&&net.isHost)&&r.t<now-12000){dead[r.code]=1;if(C&&C.db)C.db.collection('rooms').doc(r.code).delete().catch(function(){});return false}
      return r.t>now-25000});
    var fr=live.filter(function(r){return r.hostUid&&fu.indexOf(r.hostUid)>=0});fr.forEach(function(r){seen[r.code]=1});
    (C&&C.friends||[]).forEach(function(f){var p=f.prof;if(f.status==='friends'&&p&&p.room&&p.room.code&&!seen[p.room.code]&&C.statusOf(p)!=='off'){seen[p.room.code]=1;fr.push({code:p.room.code,name:p.room.name,host:p.name,n:p.room.n||1,pl:[{n:p.name,av:p.av}],via:p.name})}});
    var pub=live.filter(function(r){return r.vis==='public'&&!seen[r.code]});
    var h='<div class="panel"><div class="rl-h"><b>'+T('Salons de tes amis')+'</b><span class="muted">'+fr.length+'</span></div>'+(fr.length?fr.map(function(r){return roomCard(r,r.via?r.via+' '+T('y est'):T('ami'))}).join(''):'<p class="muted">'+(cloudOk()?T('Aucun ami dans un salon pour l\'instant.'):T('Connecte-toi pour voir les salons de tes amis.'))+'</p>')+'</div>';
    h+='<div class="panel"><div class="rl-h"><b>'+T('Salons publics')+'</b><span class="muted">'+pub.length+'</span></div>'+(pub.length?pub.map(function(r){return roomCard(r)}).join(''):'<p class="muted">'+T('Aucun salon public pour l\'instant. Crée le tien !')+'</p>')+'</div>';
    el.innerHTML=h;el.querySelectorAll('[data-join]').forEach(function(b){b.onclick=function(){joinCode(b.dataset.join,b)}});
  }
  function joinCode(code,b){var n=(C&&C.name)||($('room-name')&&$('room-name').value.trim())||PP.myName()||'Joueur';PP.setName(n);if(b){b.disabled=true;b.textContent=T('Connexion…')}
    net.join(code,n,function(err,kind){if(err){if(b){b.disabled=false;b.textContent=T('Rejoindre')}
      /* salon vraiment fermé (le serveur dit qu'il n'existe plus) : on le retire de la liste.
         v25 : avant, une simple connexion lente le supprimait pour tout le monde, et le pote ne pouvait plus le voir */
      if(kind==='none'){dead[code]=1;if(C&&C.db)C.db.collection('rooms').doc(code).delete().catch(function(){});lists();PP.toast(T('Ce salon est fermé, il est retiré de la liste'),'warn')}else PP.toast(err,'warn');return}sfx.play('win');render()})}
  function watchDir(){if(dirUn||!C||!C.whenReady)return;C.whenReady(function(db){if(dirUn)return;dirUn=db.collection('rooms').where('t','>',Date.now()-60000).onSnapshot(function(s){dir=[];s.forEach(function(d){dir.push(d.data())});dir.sort(function(a,b){return b.n-a.n});lists()},function(){})})}
  function unwatchDir(){if(dirUn){dirUn();dirUn=null}}
  /* quand l'hôte ferme ou recharge la page, son salon est retiré tout de suite de la liste */
  window.addEventListener('pagehide',function(){try{if(net.inRoom()&&net.isHost&&lastPub&&C&&C.db)C.db.collection('rooms').doc(lastPub).delete()}catch(e){}});
  function onlineTxt(){var n=PP.site&&PP.site.online;return n?'<b>'+n+'</b> '+T(n>1?'joueurs en ligne sur le site':'joueur en ligne sur le site'):T('Joueurs en ligne…')}
  function setup(){
    var named=C&&C.name;
    box.innerHTML='<div class="rl-top"><span class="rl-live"><i></i><span id="rl-online">'+onlineTxt()+'</span></span></div><div class="rl-grid"><div class="panel rl-new"><h3 class="t">'+T('Créer un salon')+'</h3>'+
      (named?'':'<label class="lbl" for="room-name">'+T('Ton pseudo')+'</label><input id="room-name" maxlength="14" placeholder="Pseudo" value="'+esc(PP.myName())+'">')+
      '<label class="lbl" for="room-title">'+T('Nom du salon')+'</label><input id="room-title" maxlength="28" placeholder="'+T('Ex. : Les potes du vendredi')+'">'+
      '<label class="lbl">'+T('Qui peut entrer')+'</label><div class="seg" id="room-vis">'+[['invite','Privé'],['friends','Amis',1],['public','Public']].map(function(o){return '<button type="button" data-v="'+o[0]+'" class="'+(vis===o[0]?'on':'')+'"'+(o[2]&&!cloudOk()?' disabled title="'+T('Connecte-toi à ton compte pour ça')+'"':'')+'>'+T(o[1])+'</button>'}).join('')+'</div><p class="muted rm-help" id="room-vh">'+T(VIS[vis])+'</p>'+
      '<label class="rm-tog"><input type="checkbox" id="room-acc"'+(acc?' checked':'')+'> '+T('Seulement les joueurs avec un compte')+'</label>'+
      '<p class="err" id="room-err"></p><button type="button" class="primary big" id="room-create">'+T('Créer le salon')+'</button>'+
      '<div class="rl-code"><label class="lbl" for="rl-code">'+T('Tu as un code ?')+'</label><form class="ch-form" id="rl-codef"><input id="rl-code" maxlength="3" inputmode="numeric" placeholder="123"><button type="submit" class="ink">'+T('Rejoindre')+'</button></form></div></div>'+
      '<div class="rl-lists" id="rl-lists"></div></div>';
    box.querySelectorAll('#room-vis [data-v]').forEach(function(b){b.onclick=function(){vis=b.dataset.v;box.querySelectorAll('#room-vis [data-v]').forEach(function(x){x.classList.toggle('on',x===b)});$('room-vh').textContent=T(VIS[vis])}});
    $('room-acc').onchange=function(){acc=this.checked};
    $('rl-codef').onsubmit=function(e){e.preventDefault();var c=$('rl-code').value.trim();if(!/^\d{3}$/.test(c)){PP.toast(T('Le code fait 3 chiffres.'),'warn');return}joinCode(c,this.querySelector('button'))};
    $('room-create').onclick=function(){
      var n=named||$('room-name').value.trim()||'Hôte',ttl=$('room-title').value.trim().slice(0,28);PP.setName(n);
      $('room-create').disabled=true;$('room-err').textContent='';
      net.host(n,function(err,code){
        if(err){$('room-err').textContent=err;$('room-create').disabled=false;return}
        curGame=null;chat=[];rs={name:ttl||defName(),vis:vis,acc:acc,mode:'chef',props:{}};setTimeout(publish,300);
        sfx.play('win');PP.toast('Salon '+code+' créé','ok');sysMsg(T('Salon créé. Invite tes amis ou envoie le lien !'));render();
      });
    };
    lists();watchDir();if(PP.site&&PP.site.refresh)PP.site.refresh();
  }
  if(PP.site&&PP.site.on)PP.site.on(function(){var e=$('rl-online');if(e)e.innerHTML=onlineTxt()});

  /* ---------- Rejoindre (page code) ---------- */
  $('join-go').addEventListener('click',function(){
    var c=$('join-code').value.trim(),n=$('join-name').value.trim()||'Joueur';
    if(!/^\d{3}$/.test(c)){$('join-err').textContent=T('Le code fait 3 chiffres.');return}
    PP.setName(n);$('join-go').disabled=true;$('join-err').textContent=T('Connexion');$('join-err').className='wait';
    net.join(c,n,function(err){
      $('join-go').disabled=false;$('join-err').className='err';
      if(err){$('join-err').textContent=err;return}
      $('join-err').textContent='';sfx.play('win');PP.go('room');
    });
  });
  $('join-code').addEventListener('keydown',function(e){if(e.key==='Enter')$('join-name').focus()});
  $('join-name').addEventListener('keydown',function(e){if(e.key==='Enter')$('join-go').click()});

  /* ---------- Panneau du salon pendant les parties (hors plein écran) ---------- */
  var dockEl=null,dockOpen=false,unread=0,sideOff=false;
  function dock(){
    var show=net.inRoom()&&PP.cur()!=='room'&&PP.cur()!=='menu'&&PP.cur()!=='join';
    if(!dockEl){dockEl=document.createElement('div');dockEl.className='room-dock';dockEl.innerHTML='<button type="button" class="rd-btn" id="rd-btn">💬 '+T('Salon')+' <span id="rd-n"></span><i id="rd-badge" hidden></i></button><div class="rd-panel" id="rd-panel" hidden></div>';document.body.appendChild(dockEl);
      $('rd-btn').onclick=function(){sideOff=false;if(innerWidth>=1180&&!document.body.classList.contains('fs-mode')&&!document.body.classList.contains('pp-touch')){dock();return}dockOpen=!dockOpen;$('rd-panel').hidden=!dockOpen;if(dockOpen){unread=0;dockBadge();renderDock();if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock()}}}
    dockEl.hidden=!show;if(!show){dockOpen=false;$('rd-panel').hidden=true}
    /* grand écran : le panneau du salon reste ouvert à côté du jeu (chat, joueurs, jeux proposés) */
    var wide=show&&!sideOff&&innerWidth>=1180&&!document.body.classList.contains('fs-mode')&&!document.body.classList.contains('pp-touch');
    var was=document.body.classList.contains('room-side');document.body.classList.toggle('room-side',wide);
    if(wide&&!was){dockOpen=true;$('rd-panel').hidden=false;unread=0;renderDock()}
    if(!wide&&was){dockOpen=false;$('rd-panel').hidden=true}
    $('rd-n').textContent=net.inRoom()?'('+net.players.length+')':'';dockBadge();
  }
  window.addEventListener('resize',function(){if(dockEl)dock()});document.addEventListener('pp-fs',function(){setTimeout(dock,50)});
  /* fin de partie : le panneau s'ouvre pour proposer la suite et parler */
  document.addEventListener('pp-gameover',function(){if(!net.inRoom())return;dock();dockOpen=true;var pn=$('rd-panel');if(pn){pn.hidden=false;unread=0;dockBadge();renderDock();var d=pn.querySelector('.rd-more');if(d)d.open=true}});
  function dockBadge(){var b=$('rd-badge');if(b){b.hidden=!unread||dockOpen;b.textContent=unread}}
  function renderDock(){var p=$('rd-panel');if(!p)return;var a=document.activeElement,keep=a&&p.contains(a)&&a.tagName==='INPUT'?a.value:null;
    p.innerHTML='<div class="rd-head"><b>'+esc(rs.name||('Salon '+net.code))+'</b><button type="button" class="mini ghost" id="rd-close">×</button></div>'+playersHtml(true)+
      '<div class="ch-log" id="rd-log">'+chatHtml()+'</div>'+chatForm()+
      '<details class="rd-more"'+(document.body.classList.contains('room-side')?' open':'')+'><summary>'+T('Proposer un jeu')+'</summary><div class="rd-games">'+ONLINE.map(function(g){var v=(rs.props[g.id]||[]).length;return '<button type="button" class="mini'+((rs.props[g.id]||[]).indexOf(net.me.id)>=0?' on':'')+'" data-prop="'+g.id+'">'+esc(g.name)+(v?' · '+v:'')+'</button>'}).join('')+'</div></details>';
    bindRoom(p);$('rd-close').onclick=function(){dockOpen=false;p.hidden=true;sideOff=true;document.body.classList.remove('room-side')};var lg=$('rd-log');if(lg)lg.scrollTop=lg.scrollHeight;
    if(keep!==null){var i=p.querySelector('.rc-form input');i.value=keep;i.focus()}
  }

  /* ---------- Messages réseau ---------- */
  document.addEventListener('pp-go',function(e){var v=e.detail;if(PP.cur()==='room'&&!net.inRoom())watchDir();else unwatchDir();if(!net.inRoom()||!net.isHost)return;if(!ONLINE.some(function(g){return g.id===v})||v===curGame)return;curGame=v;publish();net.broadcast({t:'launch',game:v})});
  var knownIds={};
  net.on(function(msg,from){
    if(net.isHost){
      if(msg.t==='chat'&&from&&from!=='host'){var p=pl(from);if(p)addChat({n:p.name,id:from,av:p.av,uid:p.uid||null,txt:String(msg.txt||'').slice(0,200),ts:Date.now()});return}
      if(msg.t==='prop'&&from&&from!=='host'){handleProp(from,msg.game);return}
      if(msg.t==='players'){msg.players.forEach(function(p){if(p.id!=='host'&&!knownIds[p.id]){knownIds[p.id]=1;net.to(p.id,{t:'rs',s:rs});net.to(p.id,{t:'chath',l:chat.slice(-40)});sysMsg(p.name+' '+T('a rejoint le salon'));if(curGame&&curGame!=='surv'){net.to(p.id,{t:'launch',game:gid()});var pid=p.id;setTimeout(function(){catchUp(pid,gid())},700)}}});
        Object.keys(rs.props).forEach(function(g){rs.props[g]=rs.props[g].filter(function(id){return !!pl(id)});if(!rs.props[g].length)delete rs.props[g]});pushRs()}
      if(msg.t==='left'){var gone=msg.id;Object.keys(knownIds).forEach(function(k){if(k===gone)delete knownIds[k]})}
    }else{
      if(msg.t==='rs'){rs=msg.s||rs;paint();bar()}
      if(msg.t==='chatm'){addChat(msg.m)}
      if(msg.t==='chath'){chat=msg.l||[];paint()}
    }
  });
  var known=[];
  net.on(function(msg){
    if(msg.t==='players'){
      var now=msg.players.map(function(p){return p.name});
      if(known.length&&net.inRoom()){now.filter(function(n){return known.indexOf(n)<0}).forEach(function(n){PP.toast(n+' '+T('a rejoint le salon'),'ok');sfx.play('join')});known.filter(function(n){return now.indexOf(n)<0}).forEach(function(n){PP.toast(n+' '+T('a quitté le salon'),'warn');if(net.isHost)sysMsg(n+' '+T('a quitté le salon'))})}
      known=now;bar();dock();if(PP.cur()==='room')render();else if(dockOpen)renderDock()}
    if(msg.t==='kicked'){curGame=null;chat=[];known=[];rs=fresh();PP.toast(T('Le chef t\'a exclu du salon'),'warn');bar();dock();PP.go('room')}
    if(msg.t==='handfail'){PP.toast(T('Le changement de chef n\'a pas marché'),'warn');if(leaving){leaving=false;net.leave()}bar();if(PP.cur()==='room')render()}
    if(msg.t==='migrating'&&msg.me&&leaving){leaving=false;curGame=null;PP.toast(T('Tu as quitté le salon, ')+msg.chef+T(' est le nouveau chef'),'ok');setTimeout(function(){bar();dock();if(PP.cur()==='room')render()},600);return}
    if(msg.t==='migrating'){curGame=null;PP.toast(msg.mine?T('Tu deviens le chef du salon'):(msg.chef+T(' est le nouveau chef, reconnexion…')),'ok');if(PP.cur()==='room')box.innerHTML='<div class="panel"><p class="wait">'+T('Reconnexion au salon de ')+esc(msg.chef)+'…</p></div>';if(PP.cur()!=='menu')PP.go('room')}
    if(msg.t==='migrated'){known=net.players.map(function(p){return p.name});if(msg.chef){knownIds={};net.players.forEach(function(p){knownIds[p.id]=1});rs.props={};pushRs();sysMsg(T('C\'est toi le chef maintenant'))}bar();dock();if(PP.cur()==='room')render();if(msg.chef)PP.toast('Salon '+net.code+' : '+T('c\'est toi qui choisis le jeu'),'ok')}
    if(msg.t==='launch'){curGame=msg.game;sfx.play('go');PP.go(msg.game)}
    if(msg.t==='rejoin'&&net.isHost){catchUp(arguments[1],msg.game)}
    if(msg.t==='closed'){curGame=null;chat=[];rs=fresh();PP.toast(T('Le salon a été fermé par l\'hôte'),'warn');known=[];bar();dock();if(PP.cur()!=='menu'){PP.go('room')}}
  });
  net.onStatus(function(s){var e=$('room-err');if(e)e.textContent=s});

  PP.games.room={open:render,close:unwatchDir};
  PP.games.join={open:function(){$('join-name').value=(C&&C.name)||PP.myName();var m=/[?&]salon=(\d{3})/.exec(location.search);if(m)$('join-code').value=m[1];($('join-code').value?$('join-name'):$('join-code')).focus()}};
  PP.room={say:say,propose:propose,info:function(){return {code:net.code,name:rs.name||defName(),vis:rs.vis}},
    kick:function(id){var p=pl(id);if(!p||!net.isHost||!confirm(T('Exclure ')+p.name+' ?'))return;net.kick(p.id);sysMsg(p.name+' '+T('a été exclu'))},
    chef:function(id){var p=pl(id);if(!p||!net.isHost)return;curGame=null;net.handover(p.id,false);PP.toast(p.name+' '+T('devient le chef'),'ok')}};
  if(C&&C.on){var fsig='';C.on(function(){var s=(C.verified?1:0)+'|'+(C.friends||[]).map(function(f){return f.uid+f.status+(f.prof&&f.prof.room?f.prof.room.code:'')}).join(',');if(s===fsig)return;fsig=s;if(PP.cur()!=='room')return;if(!net.inRoom())lists();else if(!(document.activeElement&&/INPUT/.test(document.activeElement.tagName)))render()})}
})();
