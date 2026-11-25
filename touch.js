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
    hoops:[['u','KeyW','▲'],['l','KeyA','◀'],['d','KeyS','▼'],['r','KeyD','▶'],['x','Space','TIR']]
  };
  var KEY={KeyW:'z',KeyA:'q',KeyS:'s',KeyD:'d',Space:' ',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'};
  function fire(type,code){try{document.dispatchEvent(new KeyboardEvent(type,{code:code,key:KEY[code]||code,bubbles:true}))}catch(e){}}
  Object.keys(VP).forEach(function(id){
    var v=document.getElementById('v-'+id),st=v&&v.querySelector('.stage.wide');if(!st)return;
    var p=document.createElement('div');p.className='pad vpad';
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
  }
  function lockLand(){try{var o=screen.orientation;if(o&&o.lock)o.lock('landscape').catch(function(){})}catch(e){}}
  function unlock(){try{var o=screen.orientation;if(o&&o.unlock)o.unlock()}catch(e){}}
  document.addEventListener('pp-fs',function(e){
    var st=e.detail;document.querySelectorAll('.pad.pad-ov').forEach(function(p){p.classList.remove('pad-ov')});
    if(!st){unlock();return}
    var v=st.closest('.view'),pad=v&&v.querySelector('.pad');if(pad){arrange(pad);pad.classList.add('pad-ov')}
    lockLand();
    st.classList.remove('rot-hint');void st.offsetWidth;st.classList.add('rot-hint');
  });

  /* une partie qui démarre passe en plein écran (sauf Zone Morte, qui a déjà son mode téléphone) */
  document.addEventListener('click',function(e){
    var b=e.target.closest('.stage.wide .overlay button');if(!b||b.disabled)return;
    if(!(/-start$/.test(b.id)||b.classList.contains('primary')||b.classList.contains('ink'))||/salon/i.test(b.textContent))return;
    var st=b.closest('.stage.wide');if(!st||st.closest('#v-fps')||!window.PP_fs||PP_fs.isOn(st))return;
    setTimeout(function(){if(!PP_fs.isOn(st))PP_fs.toggle(st)},30);
  },true);
  /* en quittant un jeu, on sort du plein écran */
  /* longues listes de touches du clavier : inutiles sur téléphone */
  function tidyKeys(){document.querySelectorAll('.keys').forEach(function(k){k.classList.toggle('kb-hint',k.querySelectorAll('kbd').length>=3&&!/toucher|doigt/i.test(k.textContent))})}
  document.addEventListener('pp-go',function(){tidyModes();setTimeout(tidyKeys,300)});document.addEventListener('click',function(){setTimeout(tidyKeys,300)});setTimeout(tidyKeys,500);
})();
