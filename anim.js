/* Pixel Pause — animations légères : titre lettre par lettre, apparitions au scroll,
   rideau entre les pages, en-tête qui réagit au scroll. Rien ne tourne pendant les jeux. */
(function(){
  var d=document,root=d.documentElement;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  root.classList.add('pp-anim');

  /* ---------- Titre découpé en lettres ---------- */
  var t=d.querySelector('.mast-title');
  if(t&&!t.dataset.split){
    var i=0,h='';
    Array.prototype.forEach.call(t.childNodes,function(n){
      if(n.nodeType===3){n.textContent.split('').forEach(function(c){if(c.trim())h+='<i class="ch" style="--i:'+(i++)+'">'+c+'</i>'})}
      else if(n.nodeName==='BR')h+='<br>';
      else h+='<i class="ch" style="--i:'+(i++)+'">'+n.outerHTML+'</i>';
    });
    var words=[];Array.prototype.forEach.call(t.childNodes,function(n){if(n.nodeType===3)words.push(n.textContent)});
    t.setAttribute('aria-label',words.join(' ')+'.');t.dataset.split='1';t.innerHTML=h;
    Array.prototype.forEach.call(t.querySelectorAll('.ch'),function(c){c.setAttribute('aria-hidden','true')});
  }

  /* ---------- Apparition au scroll ---------- */
  var items=function(){return d.querySelectorAll('.row-game:not(.in),footer .wrap:not(.in)')};
  if(!('IntersectionObserver' in window)){Array.prototype.forEach.call(items(),function(e){e.classList.add('in')})}
  else{
    var io=new IntersectionObserver(function(es){
      var k=0;
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        var el=e.target,delay=Math.min(k++,7)*55;
        el.style.transitionDelay=delay+'ms';el.classList.add('in');io.unobserve(el);
        setTimeout(function(){el.style.transitionDelay=''},delay+800);
      });
    },{rootMargin:'0px 0px -6% 0px',threshold:.08});
    var watch=function(){Array.prototype.forEach.call(items(),function(e){io.observe(e)})};
    watch();
    /* les lignes ajoutées plus tard (liste des jeux arcade) */
    var tl=d.getElementById('tiles');
    if(tl&&'MutationObserver' in window)new MutationObserver(watch).observe(tl,{childList:true});
  }

  /* ---------- Rideau entre les pages ---------- */
  var cur=d.createElement('div');cur.className='pp-curtain';cur.setAttribute('aria-hidden','true');cur.innerHTML='<b></b>';
  d.body.appendChild(cur);
  var last=location.hash.slice(1)||'menu',ready=false;
  setTimeout(function(){ready=true},400);
  d.addEventListener('pp-go',function(e){
    var v=e.detail;if(v===last)return;last=v;
    if(!ready)return;
    var h2=d.querySelector('#v-'+v+' h2');
    cur.firstChild.textContent=v==='menu'?'Pixel Pause.':(h2?h2.textContent:'');
    cur.classList.remove('go');void cur.offsetWidth;cur.classList.add('go');
  });
  cur.addEventListener('animationend',function(e){if(e.target===cur)cur.classList.remove('go')});

  /* ---------- En-tête : ombre et barre de progression ---------- */
  var hd=d.querySelector('header'),bar=null;
  if(hd){bar=d.createElement('div');bar.className='pp-prog';hd.appendChild(bar)}
  var queued=false;
  function onScroll(){
    queued=false;
    var y=window.scrollY||root.scrollTop,max=root.scrollHeight-window.innerHeight;
    if(hd)hd.classList.toggle('pp-scrolled',y>8);
    if(bar)bar.style.transform='scaleX('+(max>40?Math.min(1,y/max):0)+')';
  }
  window.addEventListener('scroll',function(){if(!queued){queued=true;requestAnimationFrame(onScroll)}},{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  d.addEventListener('pp-go',function(){setTimeout(onScroll,50)});
  onScroll();
})();
