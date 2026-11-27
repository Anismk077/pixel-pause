/* Pixel Pause — téléphone et tablette :
   plein écran automatique quand on lance une partie (et paysage si le téléphone le permet),
   manette tactile par-dessus le jeu en plein écran, manettes pour les jeux qui n'en avaient pas,
   et on cache les modes qui demandent un clavier. */
(function(){
  'use strict';
  var touch=matchMedia('(hover:none) and (pointer:coarse)').matches||(navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches);
  if(!touch)return;
  document.body.classList.add('pp-touch');

  /* modes « même clavier » : inutiles sur téléphone */
  function tidyModes(){document.querySelectorAll('.mode').forEach(function(b){var t=b.textContent;if(/ZQSD|IJKL|pavé|même clavier|A contre L|contre flèches|écran partagé/i.test(t)&&!/en ligne/i.test(t))b.classList.add('kb-only')})}
  tidyModes();

  /* manettes pour les jeux arcade qui se jouaient au clavier */
  var VP={
    tanks:[['u','KeyW','▲'],['l','KeyA','◀'],['d','KeyS','▼'],['r','KeyD','▶'],['x','Space','TIR']],
    maze:[['u','ArrowUp','▲'],['l','ArrowLeft','◀'],['d','ArrowDown','▼'],['r','ArrowRight','▶']],
    saut:[['l','ArrowLeft','◀'],['r','ArrowRight','▶'],['u','ArrowUp','▲'],['d','ArrowDown','▼'],['x','Space','SAUT'],['x','KeyF','FEU']],
    hoops:[['u','KeyW','▲'],['l','KeyA','◀'],['d','KeyS','▼'],['r','KeyD','▶'],['x','Space','TIR']],
    /* v66 : casino — gros boutons sous le jeu quand le téléphone est en hauteur */
    bj:[['x','Digit2','+25'],['x','Digit4','+100'],['x','Space','OK'],['x','KeyH','CARTE'],['x','KeyS','RESTER'],['x','KeyD','×2']],
    poker:[['x','KeyF','COUCHER'],['x','KeyC','SUIVRE'],['x','KeyR','RELANCE'],['x','KeyA','TAPIS'],['x','Space','SUITE']],
    roue:[['x','Space','LANCER']]
  };
  var CAS={bj:1,poker:1,roue:1};
  var KEY={KeyW:'z',KeyA:'q',KeyS:'s',KeyD:'d',Space:' ',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'};
  function fire(type,code){try{document.dispatchEvent(new KeyboardEvent(type,{code:code,key:KEY[code]||code,bubbles:true}))}catch(e){}}
  Object.keys(VP).forEach(function(id){
    var v=document.getElementById('v-'+id),st=v&&v.querySelector('.stage.wide');if(!st)return;
    var p=document.createElement('div');p.className='pad vpad'+(CAS[id]?' cas':'');
    p.innerHTML=VP[id].map(function(b){return '<button type="button" data-code="'+b[1]+'" data-dir="'+b[0]+'"'+(b[0]==='x'?' class="fire"':'')+'>'+b[2]+'</button>'}).join('');
    var bar=st.nextElementSibling&&st.nextElementSibling.classList.contains('stage-bar')?st.nextElementSibling:st;bar.parentNode.insertBefore(p,bar.nextSibling);
    p.querySelectorAll('button').forEach(function(b){var on=false;
      function dn(e){e.preventDefault();if(on)return;on=true;b.classList.add('on');fire('keydown',b.dataset.code)}
      function up(e){if(e)e.preventDefault();if(!on)return;on=false;b.classList.remove('on');fire('keyup',b.dataset.code)}
      b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);b.addEventListener('contextmenu',function(e){e.preventDefault()})});
  });

  /* range les boutons d'une manette : croix à gauche, actions à droite */
  var DIR={L:'l','1L':'l',R:'r','1R':'r',U:'u','1U':'u',F:'u',D:'d','1D':'d',B:'d'};
  function arrange(pad){
    if(pad.dataset.arr)return;pad.dataset.arr='1';var acts=document.createElement('span');acts.className='pd-acts';
    [].slice.call(pad.querySelectorAll('button')).forEach(function(b){var k=b.dataset.k||b.dataset.d||'',d=b.dataset.dir||DIR[k];if(pad.id==='kt-pad'&&(k==='U'||k==='D'))d=null;if(d&&d!=='x')b.classList.add('pd-'+d);else acts.appendChild(b)});
    if(acts.children.length)pad.appendChild(acts);
    if(pad.id!=='sn-pad'&&pad.querySelectorAll('.pd-l,.pd-r,.pd-u,.pd-d').length>=2)makeJoy(pad);
  }
  /* joystick : on glisse le pouce, il appuie tout seul sur les bonnes flèches (diagonales comprises) */
  function makeJoy(pad){
    var dirs={};['u','d','l','r'].forEach(function(d){dirs[d]=pad.querySelector('.pd-'+d)});
    var j=document.createElement('div');j.className='pd-joy';j.innerHTML='<i></i>';pad.insertBefore(j,pad.firstChild);pad.classList.add('has-joy');
    var knob=j.firstChild,id=null,cx=0,cy=0,R=1,state={};
    function set(d,on){var b=dirs[d];if(!b||!!state[d]===on)return;state[d]=on;try{b.dispatchEvent(new PointerEvent(on?'pointerdown':'pointerup',{bubbles:true,cancelable:true}))}catch(e){}b.classList.toggle('on',on)}
    function move(x,y){var dx=x-cx,dy=y-cy,L=Math.hypot(dx,dy),m=Math.min(L,R),a=Math.atan2(dy,dx);knob.style.transform='translate('+(Math.cos(a)*m).toFixed(1)+'px,'+(Math.sin(a)*m).toFixed(1)+'px)';
      var nx=dx/R,ny=dy/R,th=.33;set('r',nx>th);set('l',nx<-th);set('d',ny>th);set('u',ny<-th)}
    function end(e){if(e.pointerId!==id)return;id=null;knob.style.transform='';j.classList.remove('on');['u','d','l','r'].forEach(function(d){set(d,false)})}
    j.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();id=e.pointerId;try{j.setPointerCapture(id)}catch(x){}var r=j.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;R=r.width*.36;j.classList.add('on');move(e.clientX,e.clientY)});
    j.addEventListener('pointermove',function(e){if(e.pointerId!==id)return;e.preventDefault();move(e.clientX,e.clientY)});
    j.addEventListener('pointerup',end);j.addEventListener('pointercancel',end);j.addEventListener('contextmenu',function(e){e.preventDefault()});
  }
  function lockLand(){try{var o=screen.orientation;if(o&&o.lock)o.lock('landscape').catch(function(){})}catch(e){}}
  function unlock(){try{var o=screen.orientation;if(o&&o.unlock)o.unlock()}catch(e){}}
  document.addEventListener('pp-fs',function(e){
    var st=e.detail;document.querySelectorAll('.pad.pad-ov').forEach(function(p){p.classList.remove('pad-ov')});
    if(!st){unlock();return}
    var v=st.closest('.view'),pad=v&&v.querySelector('.pad');if(pad){arrange(pad);pad.classList.add('pad-ov')}
    /* v66 : format vertical : on ne force plus le paysage, le jeu se cale en haut et les commandes en dessous */
  });

  /* une partie qui démarre passe en plein écran (sauf Zone Morte, qui a déjà son mode téléphone) */
  document.addEventListener('click',function(e){
    var b=e.target.closest('.stage.wide .overlay button');if(!b||b.disabled)return;
    if(!(/-start$/.test(b.id)||b.classList.contains('primary')||b.classList.contains('ink'))||/salon/i.test(b.textContent))return;
    var st=b.closest('.stage.wide');if(!st||st.closest('#v-fps,#v-typing')||!window.PP_fs||PP_fs.isOn(st))return;
    setTimeout(function(){if(!PP_fs.isOn(st))PP_fs.toggle(st)},30);
  },true);
  /* en quittant un jeu, on sort du plein écran */
  /* Course de frappe : une zone de texte pour ouvrir le clavier du téléphone */
  (function(){var v=document.getElementById('v-typing'),st=v&&v.querySelector('.stage');if(!st)return;
    var inp=document.createElement('input');inp.className='ty-mob';inp.type='text';inp.autocomplete='off';inp.spellcheck=false;inp.setAttribute('autocapitalize','off');inp.setAttribute('autocorrect','off');inp.placeholder='Touche ici pour ouvrir le clavier';
    st.parentNode.insertBefore(inp,st.nextSibling);var last='';
    inp.addEventListener('input',function(){var val=inp.value,add=val.length>last.length&&val.indexOf(last)===0?val.slice(last.length):'';
      for(var i=0;i<add.length;i++){var ch=add[i];try{document.dispatchEvent(new KeyboardEvent('keydown',{key:ch,code:/[a-z]/i.test(ch)?'Key'+ch.toUpperCase():'',bubbles:true,cancelable:true}));document.dispatchEvent(new KeyboardEvent('keyup',{key:ch,code:/[a-z]/i.test(ch)?'Key'+ch.toUpperCase():'',bubbles:true}))}catch(e){}}
      last=val;if(val.length>30){inp.value='';last=''}});
    document.addEventListener('click',function(e){if(PP.cur()==='typing'&&e.target.closest('#v-typing .overlay button'))setTimeout(function(){inp.value='';last='';inp.focus()},120)});
  })();
  /* longues listes de touches du clavier : inutiles sur téléphone */
  function tidyKeys(){document.querySelectorAll('.keys').forEach(function(k){k.classList.toggle('kb-hint',k.querySelectorAll('kbd').length>=3&&!/toucher|doigt/i.test(k.textContent))})}
  document.addEventListener('pp-go',function(){tidyModes();setTimeout(tidyKeys,300)});document.addEventListener('click',function(){setTimeout(tidyKeys,300)});setTimeout(tidyKeys,500);
})();
