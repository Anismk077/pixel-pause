/* Pixel Pause — noyau : navigation, stockage, icônes, utilitaires */
var PP_pause=null,PP_fs=null;
window.PP=(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)};
  function esc(t){var d=document.createElement('div');d.textContent=t==null?'':String(t);return d.innerHTML}
  /* Profils : chaque compte a ses propres records, stats, skins et sauvegardes (préfixe des clés) */
  var PROF=(function(){try{return localStorage.getItem('pp-profile')||''}catch(e){return ''}})();
  function key(k){return PROF?'pp-p-'+PROF+'-'+k:'pp-'+k}
  function store(k,v){try{if(v===undefined)return +localStorage.getItem(key(k))||0;localStorage.setItem(key(k),v)}catch(e){return 0}}
  function text(k,v){try{if(v===undefined)return localStorage.getItem(key(k))||'';localStorage.setItem(key(k),v)}catch(e){return ''}}
  function stat(g,f,n){store('st-'+g+'-'+f,store('st-'+g+'-'+f)+(n==null?1:n))}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function pad6(n){return ('000000'+Math.max(0,Math.floor(n))).slice(-6)}
  function fmtTime(s){s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}

  /* ---------- Navigation entre les vues ---------- */
  var games={},current='menu';
  function go(v){
    if(typeof PP_pause==='function')PP_pause(false);
    if(PP_fs)PP_fs.exit();
    if(games[current]&&games[current].close)games[current].close();
    document.querySelectorAll('.view').forEach(function(s){s.classList.toggle('on',s.id==='v-'+v)});
    current=v;window.scrollTo(0,0);
    if(games[v]&&games[v].open)games[v].open();
    try{history.replaceState(null,'',v==='menu'?location.pathname:'#'+v)}catch(e){}
  }
  document.addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});
  document.addEventListener('click',function(e){var b=e.target.closest('button[id$="-start"],#sv-cont');if(!b)return;var v=b.closest('.view');if(v&&v.id!=='v-account')stat(v.id.slice(2),'parties')},true);
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.classList&&e.target.classList.contains('logo'))return go('menu');
    if(e.key==='Enter'&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)){var v=document.querySelector('.view.on .overlay:not([hidden]) button');if(v){v.click();e.preventDefault()}}
  });

  /* ---------- Icônes pixel art 12x12 ---------- */
  var C={g:'#3cff6e',G:'#1aa84a',r:'#ff3b3b',y:'#ffd23f',b:'#3fa9ff',B:'#1c5fa8',w:'#f2efe6',k:'#111118',o:'#ff8a3d',s:'#8a5a2b',p:'#ff5fd2',d:'#555'};
  var ART={
    snake:['............','...kkkkkk...','..kkkkkkkk..','..kkwk..kk..','..kkkk......','...kkkkkk...','......kkkk..','........kkk.','.rr.....kkk.','.rr....kkkk.','..kkkkkkkk..','...kkkkkk...'],
    spy:['....kkkk....','...kkkkkk...','..kkkkkkkk..','.kkkkkkkkkk.','kkkkkkkkkkkk','....wwww....','...wkwwkw...','...wwwwww...','....wwww....','..kkkkkkkk..','.kkkkkkkkkk.','.kkk....kkk.'],
    run:['......yyy...','......yyy...','.......ww...','....wwwww.w.','...w.wwww.w.','..w..wwwww..','.....www....','....ww.ww...','...ww...ww..','..ww.....ww.','.kk.......kk','............'],
    geo:['....kkkk....','..kkwwwkkk..','.kkwwwkkkkk.','.kwwwwkkkww.','kkkwwwkkkwwk','kkkkkkkkwwwk','kkkkkwwkkkkk','kkkkwwwwkkkk','.kkkwwwkkkk.','.kkkkwkkkkk.','..kkkkkkkk..','....kkkk....'],
    hand:['....kk......','...kkkk.kk..','...kkkkkkkk.','...kkkkkkkk.','.kkkkkkkkkk.','kkkkkkkkkkk.','kkkkkkkkkkk.','.kkkkkkkkk..','..kkkkkkkk..','...kkkkkk...','...kkkkkk...','............'],
    gun:['............','............','kkkkkkkkkkk.','kkkkkkkkkkkk','kkkkkkkkkkk.','kkk..kkkk...','kkk..kkk....','.kk..kkk....','.kkkkkkk....','.kkkkkk.....','.kkkk.......','.kkkk.......'],
    kart:['............','....kkkkk...','...kkkkkkk..','..kkkwwkkkk.','.kkkkkkkkkkk','kkkkkkkkkkkk','kkkkkkkkkkkk','.kk..kkk..kk','kkkk.....kkk','kkkk.....kkk','.kk.......kk','............']
  };
  function icon(name,fg){
    var rows=ART[name];if(!rows)return '';
    var h='<svg viewBox="0 0 12 12" aria-hidden="true">';
    rows.forEach(function(r,y){for(var x=0;x<12;x++){var ch=r[x];if(ch==='.')continue;var c=(ch==='k'&&fg)?fg:C[ch];h+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+c+'"/>'}});
    return h+'</svg>';
  }
  document.querySelectorAll('[data-icon]').forEach(function(el){el.innerHTML=icon(el.dataset.icon)});
  /* ---------- Icônes SVG (traits simples) ---------- */
  var SVG={
    gun:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22h44l6 4v8H34l-2 6h-8l2-6h-6l-4 14H8l4-14H6z"/><path d="M40 34v6"/><circle cx="52" cy="16" r="3" fill="#fff" stroke="none" opacity=".7"/></svg>',
    sumo:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="32" cy="50" rx="26" ry="7"/><circle cx="22" cy="24" r="8"/><circle cx="44" cy="22" r="8"/><path d="M14 44c0-8 4-12 8-12s8 4 8 12M36 42c0-8 4-12 8-12s8 4 8 12"/><path d="M30 30l4-4" stroke="#fff"/></svg>',
    ball:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"><circle cx="32" cy="32" r="24"/><path d="M32 16l10 7-4 12H26l-4-12z" fill="#fff" opacity=".9"/><path d="M42 23l10-2M22 23l-10-2M38 35l6 10M26 35l-6 10M32 16V8"/></svg>',
    kart:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 40h44l-4-12H30l-6-8H14z"/><circle cx="18" cy="46" r="6" fill="#0b0d12"/><circle cx="46" cy="46" r="6" fill="#0b0d12"/><path d="M36 20h10"/></svg>',
    snake:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"><path d="M14 46c0-10 12-10 18-10s16 0 16-10-12-10-18-10S14 20 14 16"/><circle cx="46" cy="46" r="5" fill="#fff" stroke="none"/><circle cx="48" cy="45" r="1.4" fill="#0b0d12" stroke="none"/></svg>',
    spy:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 26h44M20 26l4-12h16l4 12"/><circle cx="24" cy="38" r="7"/><circle cx="40" cy="38" r="7"/><path d="M31 38h2M14 52c6-4 30-4 36 0"/></svg>',
    hand:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 30V14a4 4 0 018 0v14M30 28V10a4 4 0 018 0v18M38 28V14a4 4 0 018 0v20"/><path d="M22 30l-6-6a4 4 0 00-6 5l10 14c4 6 8 9 16 9h2c8 0 12-6 12-14V34"/></svg>',
    globe:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><circle cx="32" cy="32" r="22"/><path d="M10 32h44M32 10c-8 8-8 36 0 44M32 10c8 8 8 36 0 44M14 20h36M14 44h36"/></svg>',
    run:'<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="12" r="5"/><path d="M26 28l10-6 8 8 8-2M36 22l-6 14 8 6-4 14M30 36l-8 4-6 10"/></svg>'
  };
  (function(){var ch=$('chips');if(!ch)return;ch.addEventListener('click',function(e){var b=e.target.closest('[data-f]');if(!b)return;ch.querySelectorAll('.chip').forEach(function(x){x.classList.toggle('on',x===b)});var f=b.dataset.f;$('tiles').classList.toggle('filtered',f!=='all');document.querySelectorAll('#tiles [data-cat]').forEach(function(t){var ok=f==='all'||t.dataset.cat.split(' ').indexOf(f)>-1;t.classList.toggle('hide',!ok)})})})();
  (function(){var ci=$('cursor-img');if(!ci)return;var im=ci.querySelector('img'),tx=0,ty=0,x=0,y=0,raf=0;
    function loop(){x+=(tx-x)*.18;y+=(ty-y)*.18;ci.style.left=x+'px';ci.style.top=y+'px';raf=requestAnimationFrame(loop)}
    document.querySelectorAll('.row-game').forEach(function(r){
      r.addEventListener('mouseenter',function(e){im.src=r.querySelector('.rg-img').src;tx=x=e.clientX+190;ty=y=e.clientY;ci.classList.add('on');cancelAnimationFrame(raf);loop()});
      r.addEventListener('mousemove',function(e){tx=e.clientX+190;ty=e.clientY});
      r.addEventListener('mouseleave',function(){ci.classList.remove('on');cancelAnimationFrame(raf)});
    });
    document.addEventListener('click',function(){ci.classList.remove('on')});
  })();
  document.querySelectorAll('[data-svg]').forEach(function(el){el.innerHTML=SVG[el.dataset.svg]||''});


  /* ---------- Hi-score de l'accueil ---------- */
  function refreshHi(){
    var hi=Math.max(store('sn-best'),store('rn-best'),store('geo-best'),store('fps-best'));
    var e=$('hi');if(e)e.textContent=pad6(hi);
  }
  refreshHi();

  /* ---------- Pseudo ---------- */
  function myName(){return text('name')||PROF||''}
  function setName(n){text('name',(n||'').trim().slice(0,14))}

  /* ---------- Clavier / pad : touches tenues ---------- */
  function held(padId,map,onDown,onUp){
    var keys={};
    document.addEventListener('keydown',function(e){var k=map[e.key.length===1?e.key.toLowerCase():e.key];if(k&&!keys[k]){keys[k]=true;if(onDown)onDown(k,e)}});
    document.addEventListener('keyup',function(e){var k=map[e.key.length===1?e.key.toLowerCase():e.key];if(k){keys[k]=false;if(onUp)onUp(k,e)}});
    window.addEventListener('blur',function(){Object.keys(keys).forEach(function(k){if(keys[k]){keys[k]=false;if(onUp)onUp(k,{})}})});
    var pad=$(padId);
    if(pad)pad.querySelectorAll('[data-k]').forEach(function(b){
      var k=b.dataset.k;
      var dn=function(e){e.preventDefault();if(!keys[k]){keys[k]=true;if(onDown)onDown(k,e)}};
      var up=function(e){e.preventDefault();keys[k]=false;if(onUp)onUp(k,e)};
      b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);
    });
    return keys;
  }



  /* ---------- Réglages (gardés dans ce navigateur) ---------- */
  var SET_DEF={vol:80,sens:100,fov:75,q:'auto',invY:false,fpsMeter:false},SET=Object.assign({},SET_DEF);
  try{Object.assign(SET,JSON.parse(localStorage.getItem('pp-settings'))||{})}catch(e){}
  function setSetting(k,v){SET[k]=v;try{localStorage.setItem('pp-settings',JSON.stringify(SET))}catch(e){}document.dispatchEvent(new CustomEvent('pp-settings',{detail:SET}))}
  window.PP_settings=SET;
  /* ---------- Barre sous chaque jeu : plein écran et pause (solo) ---------- */
  function fsEl(){return document.fullscreenElement||document.webkitFullscreenElement}
  var paused=false,rafQ=[],RAF=window.requestAnimationFrame.bind(window);
  /* Pause globale : tant que c'est en pause, les boucles des jeux attendent (requestAnimationFrame gelé) */
  window.requestAnimationFrame=function(cb){if(paused){rafQ.push(cb);return -1}return RAF(cb)};
  function setPause(on){
    if(on===paused)return;
    if(on&&PP.net&&PP.net.inRoom()){toast('Pas de pause en salon : les autres jouent encore','warn');return}
    paused=on;
    document.querySelectorAll('.pause-ov').forEach(function(o){o.hidden=!paused||!o.closest('.view.on')});
    document.querySelectorAll('[data-pause]').forEach(function(b){b.textContent=paused?'Reprendre':'Pause';b.classList.toggle('on',paused)});
    if(paused){if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock()}
    else{var q=rafQ;rafQ=[];q.forEach(function(cb){RAF(cb)})}
  }
  function pauseHtml(){
    function rng(k,l,min,max,step,unit){return '<label class="pz-row"><span>'+l+'</span><input type="range" data-set="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'"><em data-val="'+k+'"></em></label>'}
    return '<div class="pz"><div class="pz-l"><b>PAUSE</b><div class="pz-btns"><button type="button" class="primary" data-resume>Reprendre</button><button type="button" class="pz-quit" data-quit>Quitter le jeu</button></div><p class="pz-hint">Échap : reprendre</p></div>'+
      '<div class="pz-set"><h4>Réglages</h4>'+rng('vol','Volume',0,100,5)+rng('sens','Sensibilité souris',30,250,5)+rng('fov','Champ de vision (3D)',60,100,1)+
      '<label class="pz-row"><span>Qualité (3D)</span><select data-set="q"><option value="auto">Auto</option><option value="haute">Haute</option><option value="basse">Basse (plus fluide)</option></select><em></em></label>'+
      '<label class="pz-row chk"><span>Inverser la souris (haut/bas)</span><input type="checkbox" data-set="invY"><em></em></label>'+
      '<label class="pz-row chk"><span>Afficher les images par seconde</span><input type="checkbox" data-set="fpsMeter"><em></em></label></div></div>';
  }
  function fmtSet(k,v){return k==='vol'||k==='sens'?v+' %':k==='fov'?v+'°':''}
  function syncSettings(root){(root||document).querySelectorAll('[data-set]').forEach(function(i){var k=i.dataset.set;if(i.type==='checkbox')i.checked=!!SET[k];else i.value=SET[k]});(root||document).querySelectorAll('[data-val]').forEach(function(e){e.textContent=fmtSet(e.dataset.val,SET[e.dataset.val])})}
  function bindSettings(root){syncSettings(root);root.querySelectorAll('[data-set]').forEach(function(i){var k=i.dataset.set;i.addEventListener('input',function(){var v=i.type==='checkbox'?i.checked:i.type==='range'?+i.value:i.value;setSetting(k,v);syncSettings()});i.addEventListener('change',function(){var v=i.type==='checkbox'?i.checked:i.type==='range'?+i.value:i.value;setSetting(k,v);syncSettings()})})}
  /* compteur d'images par seconde (option) */
  var fpsN=0,fpsT=performance.now(),fpsBox=null;
  (function tick(){fpsN++;var n=performance.now();if(n-fpsT>500){var f=Math.round(fpsN*1000/(n-fpsT));fpsN=0;fpsT=n;if(SET.fpsMeter){if(!fpsBox){fpsBox=document.createElement('div');fpsBox.className='fps-meter'}var st=document.querySelector('.view.on .stage.wide');if(st){if(fpsBox.parentNode!==st)st.appendChild(fpsBox);fpsBox.textContent=f+' img/s';fpsBox.hidden=false}else fpsBox.hidden=true}else if(fpsBox)fpsBox.hidden=true}RAF(tick)})();
  /* Échap : met en pause un jeu solo en cours (ou reprend) */
  var pauseGuards={};
  function canPause(){var st=document.querySelector('.view.on .stage.wide');if(!st)return false;if(PP.net&&PP.net.inRoom())return false;if(document.querySelector('.view.on .overlay:not([hidden])'))return false;var g=pauseGuards[current];return !(g&&g()===false)}
  document.addEventListener('keydown',function(e){if(e.key!=='Escape'||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;
    if(paused){e.preventDefault();setPause(false);document.dispatchEvent(new CustomEvent('pp-resume'));return}
    if(canPause()){e.preventDefault();e.stopImmediatePropagation();setPause(true)}},true);
  window.PP_pauseGuard=function(view,fn){pauseGuards[view]=fn};window.PP_canPause=canPause;
  document.querySelectorAll('.stage.wide').forEach(function(st){
    var bar=document.createElement('div');bar.className='stage-bar';
    bar.innerHTML='<button type="button" class="ghost" data-pause>Pause</button><button type="button" class="ghost" data-fs>Plein écran</button>';
    st.parentNode.insertBefore(bar,st.nextSibling);
    var ov=document.createElement('div');ov.className='pause-ov';ov.hidden=true;ov.innerHTML=pauseHtml();st.appendChild(ov);
    ov.addEventListener('mousedown',function(e){e.stopPropagation()});ov.addEventListener('click',function(e){e.stopPropagation()});
    ov.querySelector('[data-resume]').addEventListener('click',function(e){e.stopPropagation();setPause(false);document.dispatchEvent(new CustomEvent('pp-resume'))});
    ov.querySelector('[data-quit]').addEventListener('click',function(e){e.stopPropagation();setPause(false);go('menu')});
    bindSettings(ov);
    bar.querySelector('[data-fs]').addEventListener('click',function(){toggleFs(st)});
    var tb=document.createElement('div');tb.className='fs-tools';tb.innerHTML='<button type="button" data-pause>Pause</button><button type="button" data-fsx>Quitter le plein écran</button>';st.appendChild(tb);
    tb.querySelector('[data-pause]').addEventListener('click',function(e){e.stopPropagation();setPause(!paused)});tb.querySelector('[data-fsx]').addEventListener('click',function(e){e.stopPropagation();exitFs()});
    bar.querySelector('[data-pause]').addEventListener('click',function(){setPause(!paused)});
  });
  /* en plein écran, la touche P met en pause (sauf dans la Survie où P sert déjà) */
  document.addEventListener('keydown',function(e){if(e.key==='Pause'||(e.key.toLowerCase()==='p'&&current!=='surv'&&current!=='menu'&&!/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||''))){if(document.querySelector('.view.on .stage.wide'))setPause(!paused)}});
  /* Plein écran fiable : la scène passe en position fixe par-dessus tout (marche aussi sur iPhone),
     et on demande en plus le vrai plein écran du navigateur quand il est disponible. */
  var fsStage=null,fsReal=false;
  function fsChanged(){document.querySelectorAll('.stage-bar [data-fs]').forEach(function(b){b.textContent=fsStage===b.parentNode.previousSibling?'Quitter le plein écran':'Plein écran'});window.dispatchEvent(new Event('resize'));document.dispatchEvent(new CustomEvent('pp-fs',{detail:fsStage}))}
  function enterFs(st){
    if(fsStage)exitFs(true);fsStage=st;st.classList.add('fs-on');document.body.classList.add('fs-mode');
    var el=document.documentElement,r=el.requestFullscreen||el.webkitRequestFullscreen;fsReal=false;
    if(r){try{var p=r.call(el);fsReal=true;if(p&&p.catch)p.catch(function(){fsReal=false})}catch(x){fsReal=false}}
    setTimeout(fsChanged,60);fsChanged();
  }
  function exitFs(keepReal){
    if(!fsStage)return;fsStage.classList.remove('fs-on');document.body.classList.remove('fs-mode');fsStage=null;
    if(!keepReal&&fsEl()){var x=document.exitFullscreen||document.webkitExitFullscreen;if(x)try{var p=x.call(document);if(p&&p.catch)p.catch(function(){})}catch(e){}}
    fsChanged();
  }
  function toggleFs(st){if(fsStage===st)exitFs();else enterFs(st)}
  function onRealFs(){if(!fsEl()&&fsStage&&fsReal){fsReal=false;exitFs(true)}else fsChanged()}
  document.addEventListener('fullscreenchange',onRealFs);document.addEventListener('webkitfullscreenchange',onRealFs);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&fsStage&&!fsEl()&&!document.pointerLockElement&&!paused&&!canPause())exitFs()});
  PP_fs={toggle:toggleFs,exit:exitFs,isOn:function(st){return fsStage===st}};
  PP_pause=setPause;
  /* ---------- Toasts ---------- */
  var toastBox=document.createElement('div');toastBox.className='toasts';document.body.appendChild(toastBox);
  function toast(msg,kind){var t=document.createElement('div');t.className='toast '+(kind||'');t.textContent=msg;toastBox.appendChild(t);setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove()},400)},2600)}

  /* ---------- Avatars : petite tête pixel colorée selon le pseudo ---------- */
  var AV_COLS=['#3cff6e','#3fa9ff','#ff5fd2','#ff8a3d','#ffd23f','#36d6c3','#ff3b3b','#b89bff'];
  function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
  function avatar(name){
    var h=hash(name||'?'),c=AV_COLS[h%AV_COLS.length],eyes=h%3,mouth=(h>>2)%3;
    var r=['.kkkkkk.','kccccccka','kccccccka','kcEccEcka','kccccccka','kcMMMMcka','.kkkkkk.'];
    var out='<svg class="avatar" viewBox="0 0 8 7" aria-hidden="true" style="--c:'+c+'">';
    r.forEach(function(row,y){for(var x=0;x<8;x++){var ch=row[x];if(ch==='.'||ch==='a')continue;var col=ch==='k'?'#0a0a0c':ch==='c'?c:ch==='E'?(eyes===2?c:'#0a0a0c'):(mouth===0?'#0a0a0c':mouth===1?c:'#f2efe6');if(ch==='E'&&eyes===1&&x===3)col='#f2efe6';out+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+col+'"/>'}});
    return out+'</svg>';
  }


  return {settings:SET,setSetting:setSetting,pause:function(on){setPause(on)},isPaused:function(){return paused},pauseGuard:function(v,f){pauseGuards[v]=f},canPause:canPause,fs:function(){return PP_fs},key:key,stat:stat,profile:function(){return PROF},toast:toast,avatar:avatar,$:$,esc:esc,store:store,text:text,shuffle:shuffle,pick:pick,pad6:pad6,fmtTime:fmtTime,go:go,games:games,icon:icon,refreshHi:refreshHi,myName:myName,setName:setName,held:held,cur:function(){return current}};
})();
