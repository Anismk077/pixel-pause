/* Pixel Pause — salons : création, nom, public ou sur invitation, joueurs (exclure, nommer chef), chat,
   jeux proposés et votés (le chef garde le dernier mot, ou laisse le vote décider), et un panneau pendant les parties. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,box=$('room-box'),T=function(s){return PP.t?PP.t(s):s};
  var ONLINE=[
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
  var GN={};ONLINE.forEach(function(g){GN[g.id]=g.name});GN.fps='Zone Morte';
  var curGame=null,lobby=PP.lobby;

  /* ---------- État du salon (tenu par le chef, envoyé à tout le monde) ---------- */
  var rs={name:'',vis:'invite',mode:'chef',props:{}},chat=[];
  function defName(){return (T('Salon de ')+(net.me.name||'')).trim()}
  function pushRs(){if(!net.isHost)return;net.broadcast({t:'rs',s:rs});beat();paint()}
  function sysMsg(txt){addChat({sys:1,txt:txt,ts:Date.now()})}
  function addChat(m){chat.push(m);if(chat.length>80)chat.shift();if(net.isHost)net.broadcast({t:'chatm',m:m});paint();if(!m.sys&&m.id!==net.me.id){sfx.play('ui');unread++;dockBadge()}}
  function say(txt){txt=String(txt||'').trim().slice(0,200);if(!txt)return;if(net.isHost)addChat({n:net.me.name,id:'host',av:avOf('host'),txt:txt,ts:Date.now()});else net.send({t:'chat',txt:txt})}
  function propose(g){if(net.isHost)handleProp('host',g);else net.send({t:'prop',game:g})}
  function handleProp(id,g){if(!GN[g])return;var l=rs.props[g]=rs.props[g]||[],i=l.indexOf(id);if(i>=0)l.splice(i,1);else{l.push(id);var p=pl(id);sysMsg((p?p.name:'?')+' '+T('propose')+' '+GN[g])}
    if(!l.length)delete rs.props[g];
    if(rs.mode==='vote'&&l.length*2>net.players.length){launch(g);return}pushRs()}
  function launch(g){curGame=g;rs.props={};beat();sysMsg(T('Le salon part sur')+' '+GN[g]);net.all({t:'launch',game:g});pushRs()}
  function pl(id){return net.players.filter(function(p){return p.id===id})[0]}
  function avOf(id){var p=pl(id);return p&&p.av||null}
  function pic(p,size){return PP.perso?PP.perso.img(p&&p.av,size||28,'perso-pic'):PP.avatar(p?p.name:'?')}

  /* l'annuaire public : seuls les salons « publics » y apparaissent */
  function cloudOk(){var C=PP.cloud;return !!(C&&C.user&&C.verified)}
  function isFriend(uid){var C=PP.cloud;return !!(uid&&C&&C.friendUids&&C.friendUids().indexOf(uid)>=0)}
  /* salon « Amis » : le chef ne laisse entrer que ses amis (et ceux qui étaient déjà là, en cas de changement de chef) */
  net.setGate(function(d){if(rs.vis!=='friends')return true;return isFriend(d.uid)||known.indexOf(String(d.name||'').slice(0,14))>=0});
  /* tes amis voient dans quel salon tu es (sauf salon sur invitation) */
  function shareRoom(){var C=PP.cloud;if(!C||!C.setRoom)return;C.setRoom(net.inRoom()&&rs.vis!=='invite'?{code:net.code,name:rs.name||'',n:net.players.length}:null)}
  function beat(){shareRoom();if(!net.inRoom()||!net.isHost||!lobby)return;if(rs.vis==='public')lobby.register({code:net.code,host:net.me.name,name:rs.name||defName(),n:net.players.length,game:curGame});else lobby.unregister(net.code)}
  setInterval(beat,8000);
  PP.setRoomGame=function(g){curGame=g;beat()};
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
  function leaveRoom(){curGame=null;chat=[];rs={name:'',vis:'invite',mode:'chef',props:{}};if(net.isHost&&lobby)lobby.unregister(net.code);if(net.isHost&&net.players.length>1&&net.handover(net.players[1].id,true)){leaving=true;PP.toast(T('On passe le salon à ')+net.players[1].name+'…','ok')}else net.leave();dock()}
  $('roombar-leave').addEventListener('click',function(){leaveRoom();setTimeout(function(){bar();PP.go('menu')},350)});

  /* ---------- Rendu de la page Salon ---------- */
  function chatHtml(){return chat.slice(-60).map(function(m){if(m.sys)return '<div class="ch-sys">'+esc(m.txt)+'</div>';return '<div class="ch-msg'+(m.id===net.me.id?' me':'')+'">'+pic({av:m.av,name:m.n},22)+'<span><b>'+esc(m.n)+'</b> '+esc(m.txt)+'</span></div>'}).join('')||'<p class="muted ch-empty">'+T('Pas encore de message. Dis bonjour !')+'</p>'}
  function playersHtml(compact){return '<ul class="plist rp-list">'+net.players.map(function(p){var chef=p.id==='host';return '<li class="'+(p.id===net.me.id?'me ':'')+(chef?'host':'')+'">'+pic(p,compact?24:32)+'<span class="rp-n">'+esc(p.name)+(chef?' <small class="chef">'+T('chef')+'</small>':'')+(p.id===net.me.id?' <small class="you">'+T('toi')+'</small>':'')+'</span>'+
    (cloudOk()&&p.uid&&p.id!==net.me.id&&!isFriend(p.uid)&&!(PP.cloud.friend(p.uid))?'<button type="button" class="mini ghost" data-addf="'+esc(p.uid)+'">+ '+T('Ami')+'</button>':'')+(net.isHost&&!chef?'<span class="rp-act"><button type="button" class="mini ghost" data-chef="'+esc(p.id)+'">'+T('Nommer chef')+'</button><button type="button" class="mini red" data-kick="'+esc(p.id)+'">'+T('Exclure')+'</button></span>':'')+'</li>'}).join('')+'</ul>'}
  function invHtml(){var C=PP.cloud;if(!cloudOk())return '';var here={};net.players.forEach(function(p){if(p.uid)here[p.uid]=1});
    var l=(C.friends||[]).filter(function(f){return f.status==='friends'&&!here[f.uid]}).sort(function(a,b){return C.online(b)-C.online(a)});
    if(!l.length)return '';return '<label class="lbl" style="margin-top:14px">'+T('Inviter des amis')+'</label><ul class="rp-list">'+l.slice(0,12).map(function(f){var nm=(f.prof&&f.prof.name)||f.name;return '<li>'+pic({av:f.prof&&f.prof.av,name:nm},24)+'<span class="rp-n">'+esc(nm)+(C.online(f)?'':' <small class="you">'+T('hors ligne')+'</small>')+'</span><button type="button" class="mini primary" data-invf="'+f.uid+'">'+T('Inviter')+'</button></li>'}).join('')+'</ul>'}
  function gamesHtml(){var n=net.players.length;return '<div class="tiles room-tiles">'+ONLINE.map(function(g){
      var ok=n>=g.min,why=ok?(g.max&&n>g.max?T('Les ')+g.max+T(' premiers jouent'):g.desc):T('Il faut ')+g.min+' '+T('joueurs'),votes=(rs.props[g.id]||[]).length,mine=(rs.props[g.id]||[]).indexOf(net.me.id)>=0;
      return '<div class="tile rt'+(ok?'':' locked')+(votes?' voted':'')+'"><img src="thumb-'+g.id+'.jpg?v=3.3" alt=""><span class="tile-info"><b>'+esc(g.name)+'</b><small>'+esc(why)+'</small></span>'+(votes?'<span class="rt-votes">'+votes+' '+T(votes>1?'votes':'vote')+'</span>':'')+
        '<span class="rt-btns">'+(net.isHost?'<button type="button" class="primary" data-launch="'+g.id+'"'+(ok?'':' disabled')+'>'+T('Lancer')+'</button>':'')+'<button type="button" class="ghost'+(mine?' on':'')+'" data-prop="'+g.id+'">'+T(mine?'Proposé ✓':'Proposer')+'</button></span></div>'}).join('')+'</div>'}
  function render(){
    bar();
    if(!net.inRoom())return setup();
    var h='<div class="room-grid"><div class="panel room-main">';
    h+='<div class="rm-head"><div><label class="lbl">'+T('Salon')+'</label>'+(net.isHost?'<input id="rm-name" maxlength="28" value="'+esc(rs.name||defName())+'" aria-label="Nom du salon">':'<div class="rm-title">'+esc(rs.name||('Salon '+net.code))+'</div>')+'</div><div class="code-big" title="Code">'+esc(net.code)+'</div></div>';
    h+='<div class="linkbox"><input id="room-link" readonly value="'+esc(net.inviteLink())+'"><button type="button" class="ghost" id="room-copy">'+T('Copier le lien')+'</button>'+(navigator.share?'<button type="button" class="ghost" id="room-share">'+T('Partager')+'</button>':'')+'</div>';
    if(net.isHost){h+='<div class="rm-set"><div><label class="lbl">'+T('Qui peut entrer')+'</label><div class="seg" data-seg="vis"><button type="button" data-v="invite" class="'+(rs.vis==='invite'?'on':'')+'">'+T('Sur invitation')+'</button><button type="button" data-v="public" class="'+(rs.vis==='public'?'on':'')+'">'+T('Public')+'</button><button type="button" data-v="friends" class="'+(rs.vis==='friends'?'on':'')+'"'+(cloudOk()?'':' title="'+T('Connecte-toi à ton compte pour ça')+'" disabled')+'>'+T('Amis')+'</button></div></div>'+
      '<div><label class="lbl">'+T('Choix du jeu')+'</label><div class="seg" data-seg="mode"><button type="button" data-v="chef" class="'+(rs.mode==='chef'?'on':'')+'">'+T('Le chef décide')+'</button><button type="button" data-v="vote" class="'+(rs.mode==='vote'?'on':'')+'">'+T('Vote du salon')+'</button></div></div></div>'}
    else h+='<p class="muted">'+T(rs.mode==='vote'?'Propose un jeu : dès que plus de la moitié du salon le propose, il se lance.':'Propose un jeu, le chef décide.')+'</p>';
    h+='<label class="lbl" style="margin-top:14px">'+T('Joueurs')+' ('+net.players.length+')</label>'+playersHtml(false);
    h+=invHtml();
    h+='<p style="margin:14px 0 0"><button type="button" class="red" id="room-leave">'+T('Quitter le salon')+'</button></p></div>';
    h+='<div class="panel room-chat"><label class="lbl">'+T('Chat du salon')+'</label><div class="ch-log" id="rc-log">'+chatHtml()+'</div><form class="ch-form" id="rc-form"><input id="rc-in" maxlength="200" placeholder="'+T('Écris un message…')+'" autocomplete="off"><button type="submit" class="primary">'+T('Envoyer')+'</button></form></div></div>';
    h+='<label class="lbl" style="margin-top:18px;display:block">'+T(net.isHost?'Lance un jeu pour tout le salon, ou regarde ce que les autres proposent':'Propose un jeu au salon')+'</label>'+gamesHtml();
    box.innerHTML=h;bindRoom(box);var lg=$('rc-log');if(lg)lg.scrollTop=lg.scrollHeight;
  }
  function bindRoom(root){
    var cp=root.querySelector('#room-copy');if(cp)cp.onclick=function(){var i=$('room-link');i.select();try{navigator.clipboard.writeText(i.value)}catch(e){document.execCommand('copy')}cp.textContent=T('Copié !')};
    var shb=root.querySelector('#room-share');if(shb)shb.onclick=function(){navigator.share({title:'Pixel Pause',text:T('Rejoins mon salon'),url:net.inviteLink()}).catch(function(){})};
    var lv=root.querySelector('#room-leave');if(lv)lv.onclick=function(){leaveRoom();setTimeout(render,350)};
    var nm=root.querySelector('#rm-name');if(nm)nm.onchange=function(){rs.name=nm.value.trim().slice(0,28)||defName();pushRs();sysMsg(T('Le salon s\'appelle maintenant')+' « '+rs.name+' »')};
    root.querySelectorAll('[data-seg]').forEach(function(sg){sg.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){rs[sg.dataset.seg]=b.dataset.v;pushRs();render()}})});
    root.querySelectorAll('[data-chef]').forEach(function(b){b.onclick=function(){var p=pl(b.dataset.chef);if(!p)return;curGame=null;net.handover(p.id,false);PP.toast(p.name+' '+T('devient le chef'),'ok')}});
    root.querySelectorAll('[data-kick]').forEach(function(b){b.onclick=function(){var p=pl(b.dataset.kick);if(!p||!confirm(T('Exclure ')+p.name+' ?'))return;net.kick(p.id);sysMsg(p.name+' '+T('a été exclu'))}});
    root.querySelectorAll('[data-addf]').forEach(function(b){b.onclick=function(){b.disabled=true;PP.cloud.addFriendUid(b.dataset.addf).then(function(n){PP.toast(T('Demande d\'ami envoyée à ')+n,'ok')}).catch(function(e){b.disabled=false;PP.toast(PP.cloud.msg(e),'warn')})}});
    root.querySelectorAll('[data-invf]').forEach(function(b){b.onclick=function(){b.disabled=true;PP.cloud.sendDM(b.dataset.invf,T('Viens dans mon salon')+(rs.name?' « '+rs.name+' »':'')+' !',{room:{code:net.code,name:rs.name||''}}).then(function(){b.textContent=T('Invité ✓')}).catch(function(e){b.disabled=false;PP.toast(PP.cloud.msg(e),'warn')})}});
    root.querySelectorAll('[data-launch]').forEach(function(b){b.onclick=function(){launch(b.dataset.launch)}});
    root.querySelectorAll('[data-prop]').forEach(function(b){b.onclick=function(){propose(b.dataset.prop)}});
    var f=root.querySelector('.ch-form');if(f)f.onsubmit=function(e){e.preventDefault();var i=f.querySelector('input');say(i.value);i.value=''};
  }
  var paintT=0;function paint(){clearTimeout(paintT);paintT=setTimeout(function(){
    if(PP.cur()==='room'&&net.inRoom()){var lg=$('rc-log');if(lg&&document.activeElement&&document.activeElement.id==='rc-in'){lg.innerHTML=chatHtml();lg.scrollTop=lg.scrollHeight}else render()}
    if(dockOpen)renderDock()},30)}

  function roomsHtml(l){
    if(!l.length)return '<p class="muted rooms-empty">'+T('Aucun salon public pour l\'instant.')+'</p>';
    return l.map(function(r){return '<div class="room-row"><span class="rr-code">'+esc(r.code)+'</span><span class="rr-info"><b>'+esc(r.name||('Salon de '+r.host))+'</b><small>'+r.n+' '+T(r.n>1?'joueurs':'joueur')+(r.game?' · '+esc(GN[r.game]||r.game):'')+'</small></span><button type="button" class="ink" data-join="'+esc(r.code)+'">'+T('Rejoindre')+' →</button></div>'}).join('');
  }
  function bindRooms(){
    box.querySelectorAll('[data-join]').forEach(function(b){b.onclick=function(){
      var n=($('room-name')&&$('room-name').value.trim())||PP.myName()||'Joueur';PP.setName(n);b.disabled=true;b.textContent=T('Connexion…');
      net.join(b.dataset.join,n,function(err){if(err){b.disabled=false;b.textContent=T('Rejoindre')+' →';PP.toast(err,'warn');return}sfx.play('win');render()});
    }});
  }
  if(lobby)lobby.on(function(l){var el=$('room-list');if(el&&!net.inRoom()){el.innerHTML=roomsHtml(l);bindRooms()}});
  setInterval(function(){if(PP.cur()==='room'&&!net.inRoom()&&lobby)lobby.refresh()},4000);
  function setup(){
    box.innerHTML='<div class="room-grid"><div class="panel"><h3 class="t">'+T('Créer un salon')+'</h3><label class="lbl" for="room-name">'+T('Ton pseudo')+'</label><input id="room-name" maxlength="14" placeholder="Pseudo" value="'+esc(PP.myName())+'">'+
      '<label class="lbl" for="room-title" style="margin-top:10px">'+T('Nom du salon')+'</label><input id="room-title" maxlength="28" placeholder="'+T('Ex. : Les potes du vendredi')+'">'+
      '<label class="lbl" style="margin-top:10px">'+T('Qui peut entrer')+'</label><div class="seg" id="room-vis"><button type="button" data-v="invite" class="on">'+T('Sur invitation')+'</button><button type="button" data-v="public">'+T('Public')+'</button><button type="button" data-v="friends"'+(cloudOk()?'':' disabled title="'+T('Connecte-toi à ton compte pour ça')+'"')+'>'+T('Amis')+'</button></div>'+
      '<p class="err" id="room-err"></p><div class="row" style="margin-top:12px"><button type="button" class="primary" id="room-create">'+T('Créer le salon')+'</button><button type="button" class="ghost" data-go="join">'+T('J\'ai un code')+'</button></div>'+
      '<p class="muted" style="margin-top:12px">'+T('Sur invitation : seuls ceux qui ont le code ou le lien entrent. Public : ton salon apparaît dans la liste. Amis : seuls tes amis peuvent entrer, et ils le voient dans leur liste.')+'</p></div>'+
      '<div class="panel"><h3 class="t">'+T('Salons publics')+'</h3><div id="room-list"><p class="muted">'+T('Recherche…')+'</p></div></div></div>';
    var vis='invite';box.querySelectorAll('#room-vis [data-v]').forEach(function(b){b.onclick=function(){vis=b.dataset.v;box.querySelectorAll('#room-vis [data-v]').forEach(function(x){x.classList.toggle('on',x===b)})}});
    bindRooms();if(lobby){lobby.refresh();var l0=lobby.list&&lobby.list();if(l0){$('room-list').innerHTML=roomsHtml(l0);bindRooms()}}
    $('room-create').onclick=function(){
      var n=$('room-name').value.trim()||'Hôte',ttl=$('room-title').value.trim().slice(0,28);PP.setName(n);
      $('room-create').disabled=true;$('room-err').textContent='';
      net.host(n,function(err,code){
        if(err){$('room-err').textContent=err;$('room-create').disabled=false;return}
        curGame=null;chat=[];rs={name:ttl||defName(),vis:vis,mode:'chef',props:{}};setTimeout(beat,300);
        sfx.play('win');PP.toast('Salon '+code+' créé','ok');sysMsg(T('Salon créé. Envoie le lien à tes potes !'));render();
      });
    };
  }

  /* ---------- Rejoindre ---------- */
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

  /* ---------- Panneau du salon pendant les parties ---------- */
  var dockEl=null,dockOpen=false,unread=0;
  function dock(){
    var show=net.inRoom()&&PP.cur()!=='room'&&PP.cur()!=='menu'&&PP.cur()!=='join';
    if(!dockEl){dockEl=document.createElement('div');dockEl.className='room-dock';dockEl.innerHTML='<button type="button" class="rd-btn" id="rd-btn">'+T('Salon')+' <span id="rd-n"></span><i id="rd-badge" hidden></i></button><div class="rd-panel" id="rd-panel" hidden></div>';document.body.appendChild(dockEl);
      $('rd-btn').onclick=function(){dockOpen=!dockOpen;$('rd-panel').hidden=!dockOpen;if(dockOpen){unread=0;dockBadge();renderDock();if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock()}}}
    dockEl.hidden=!show;if(!show){dockOpen=false;$('rd-panel').hidden=true}
    $('rd-n').textContent=net.inRoom()?'('+net.players.length+')':'';dockBadge();
  }
  function dockBadge(){var b=$('rd-badge');if(b){b.hidden=!unread||dockOpen;b.textContent=unread}}
  function renderDock(){var p=$('rd-panel');if(!p)return;
    p.innerHTML='<div class="rd-head"><b>'+esc(rs.name||('Salon '+net.code))+'</b><button type="button" class="mini ghost" id="rd-close">×</button></div>'+playersHtml(true)+
      '<div class="ch-log" id="rd-log">'+chatHtml()+'</div><form class="ch-form"><input maxlength="200" placeholder="'+T('Écris un message…')+'" autocomplete="off"><button type="submit" class="primary">↵</button></form>'+
      '<label class="lbl">'+T('Proposer un jeu')+'</label><div class="rd-games">'+ONLINE.map(function(g){var v=(rs.props[g.id]||[]).length;return '<button type="button" class="mini'+((rs.props[g.id]||[]).indexOf(net.me.id)>=0?' on':'')+'" data-prop="'+g.id+'">'+esc(g.name)+(v?' · '+v:'')+'</button>'+(net.isHost&&v?'<button type="button" class="mini primary" data-launch="'+g.id+'">'+T('Lancer')+'</button>':'')}).join('')+'</div>';
    bindRoom(p);$('rd-close').onclick=function(){dockOpen=false;p.hidden=true};var lg=$('rd-log');if(lg)lg.scrollTop=lg.scrollHeight;
    p.querySelector('input').addEventListener('keydown',function(e){e.stopPropagation()});
  }

  /* ---------- Messages réseau ---------- */
  document.addEventListener('pp-go',function(e){var v=e.detail;if(!net.inRoom()||!net.isHost)return;if(!ONLINE.some(function(g){return g.id===v})||v===curGame)return;curGame=v;beat();net.broadcast({t:'launch',game:v})});
  var knownIds={};
  net.on(function(msg,from){
    if(net.isHost){
      if(msg.t==='chat'&&from&&from!=='host'){var p=pl(from);if(p)addChat({n:p.name,id:from,av:p.av,txt:String(msg.txt||'').slice(0,200),ts:Date.now()});return}
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
    if(msg.t==='kicked'){curGame=null;chat=[];known=[];PP.toast(T('Le chef t\'a exclu du salon'),'warn');bar();dock();PP.go('room')}
    if(msg.t==='handfail'){PP.toast(T('Le changement de chef n\'a pas marché'),'warn');if(leaving){leaving=false;net.leave()}bar();if(PP.cur()==='room')render()}
    if(msg.t==='migrating'&&msg.me&&leaving){leaving=false;curGame=null;PP.toast(T('Tu as quitté le salon, ')+msg.chef+T(' est le nouveau chef'),'ok');setTimeout(function(){bar();dock();if(PP.cur()==='room')render()},600);return}
    if(msg.t==='migrating'){curGame=null;PP.toast(msg.mine?T('Tu deviens le chef du salon'):(msg.chef+T(' est le nouveau chef, reconnexion…')),'ok');if(PP.cur()==='room')box.innerHTML='<div class="panel"><p class="wait">'+T('Reconnexion au salon de ')+esc(msg.chef)+'…</p></div>';if(PP.cur()!=='menu')PP.go('room')}
    if(msg.t==='migrated'){known=net.players.map(function(p){return p.name});if(msg.chef){knownIds={};net.players.forEach(function(p){knownIds[p.id]=1});rs.props={};pushRs();sysMsg(T('C\'est toi le chef maintenant'))}bar();dock();if(PP.cur()==='room')render();if(msg.chef)PP.toast('Salon '+net.code+' : '+T('c\'est toi qui choisis le jeu'),'ok')}
    if(msg.t==='launch'){curGame=msg.game;sfx.play('go');PP.go(msg.game)}
    if(msg.t==='rejoin'&&net.isHost){catchUp(arguments[1],msg.game)}
    if(msg.t==='closed'){curGame=null;chat=[];PP.toast(T('Le salon a été fermé par l\'hôte'),'warn');known=[];bar();dock();if(PP.cur()!=='menu'){PP.go('room')}}
  });
  net.onStatus(function(s){var e=$('room-err');if(e)e.textContent=s});

  PP.games.room={open:render};
  PP.games.join={open:function(){$('join-name').value=PP.myName();var m=/[?&]salon=(\d{3})/.exec(location.search);if(m)$('join-code').value=m[1];($('join-code').value?$('join-name'):$('join-code')).focus()}};
  PP.room={say:say,propose:propose,info:function(){return {code:net.code,name:rs.name||defName(),vis:rs.vis}}};
  if(PP.cloud&&PP.cloud.on){var fsig='';PP.cloud.on(function(C){var s=(C.verified?1:0)+'|'+(C.friends||[]).map(function(f){return f.uid+f.status}).join(',');if(s===fsig)return;fsig=s;if(PP.cur()==='room'&&!(document.activeElement&&/INPUT/.test(document.activeElement.tagName)))render()})}
})();
