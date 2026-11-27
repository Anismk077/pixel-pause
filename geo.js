/* Pixel Pause — Devine où : une vraie rue à 360° où l'on se balade, une mini-carte, on pose son point. Solo, ou en salon : le plus proche gagne la manche. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,SKIP=['Pyramide de Khéops','Machu Picchu','Montagne de la Table','Dune du Pilat','Pétra','Angkor Vat','Badaling','Mont Fuji','Baie d\'Along','Uluru/Ayers Rock','Chutes du Niagara','Panneau Hollywood'],PLACES=(PP.GEO_PLACES||[]).slice();
  var map=null,marker=null,layers=[],guess=null,locked=false,sub=null;
  var solo={rounds:null,ri:0,score:0},H={rounds:null,ri:0,guesses:{},scores:{},open:false},G={round:0};
  var R=6371;
  function dist(a,b){var r=Math.PI/180,dLa=(b[0]-a[0])*r,dLo=(b[1]-a[1])*r;var x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLo/2)*Math.sin(dLo/2);return 2*R*Math.asin(Math.sqrt(x))}
  function km(d){return Math.round(d).toLocaleString('fr-FR')+' km'}

  /* ---------- Mini-carte (MapLibre + OpenFreeMap, avec les noms) ---------- */
  var mapReady=false,lines=[];
  function initMap(){
    if(map)return true;
    if(!window.maplibregl){$('geo-res').innerHTML='<div class="result"><b>La carte n\'a pas pu se charger.</b> Vérifie ta connexion Internet puis recharge la page.</div>';return false}
    map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/bright',center:[10,25],zoom:.6,minZoom:.4,maxZoom:15,attributionControl:{compact:true},dragRotate:false,pitchWithRotate:false});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-left');
    map.on('load',function(){
      map.addSource('lines',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
      map.addLayer({id:'lines',type:'line',source:'lines',paint:{'line-color':['get','color'],'line-width':3,'line-dasharray':[2,2]}});
      mapReady=true;
    });
    map.on('click',function(e){
      if(locked)return;
      guess=[e.lngLat.lat,((e.lngLat.lng+540)%360)-180];
      if(marker)marker.setLngLat(e.lngLat);else marker=new maplibregl.Marker({color:'#3fa9ff'}).setLngLat(e.lngLat).addTo(map);
      $('geo-ok').disabled=false;$('geo-status').textContent='Point posé. Déplace-le si besoin, puis Valider.';
    });
    $('geo-expand').onclick=function(){var m=$('geo-mini');m.classList.toggle('big');setTimeout(function(){map.resize()},260)};
    $('geo-mini').addEventListener('transitionend',function(){map.resize()});
    return true;
  }
  function clearMap(){
    if(marker){marker.remove();marker=null}
    layers.forEach(function(x){x.remove()});layers=[];lines=[];
    if(mapReady)map.getSource('lines').setData({type:'FeatureCollection',features:[]});
    guess=null;map.jumpTo({center:[10,25],zoom:.6});
  }
  function pin(ll,color,label){
    var el=document.createElement('div');el.className='pp-pin';el.style.setProperty('--c',color);
    if(label){var t=document.createElement('span');t.textContent=label;el.appendChild(t)}
    var mk=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([ll[1],ll[0]]).addTo(map);layers.push(mk);return mk;
  }
  function lineTo(a,b,color){lines.push({type:'Feature',properties:{color:color},geometry:{type:'LineString',coordinates:[[a[1],a[0]],[b[1],b[0]]]}});if(mapReady)map.getSource('lines').setData({type:'FeatureCollection',features:lines})}
  function fitAll(pts){var bb=new maplibregl.LngLatBounds();pts.forEach(function(q){bb.extend([q[1],q[0]])});map.resize();map.fitBounds(bb,{padding:60,maxZoom:7,duration:500})}
  /* ---------- Vue de rue à 360° (photos libres Panoramax), on avance de photo en photo ---------- */
  var API='https://api.panoramax.xyz/api',HOST='',V={ready:false},keys3={},walkRaf=0,cache={};
  function bearing(a,b){var r=Math.PI/180,y=Math.sin((b[1]-a[1])*r)*Math.cos(b[0]*r),x=Math.cos(a[0]*r)*Math.sin(b[0]*r)-Math.sin(a[0]*r)*Math.cos(b[0]*r)*Math.cos((b[1]-a[1])*r);return (Math.atan2(y,x)/r+360)%360}
  function angDiff(a,b){var d=Math.abs(a-b)%360;return d>180?360-d:d}
  function init3d(){
    if(V.ready)return true;
    if(!window.THREE){$('geo-loading').textContent='La 3D n\'a pas pu se charger : vérifie ta connexion.';return false}
    var box=$('geo-3d');box.innerHTML='';
    var r=new THREE.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(2,devicePixelRatio||1));box.appendChild(r.domElement);
    var sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(75,1,.1,100);cam.rotation.order='YXZ';
    var geo=new THREE.SphereGeometry(50,64,40);geo.scale(-1,1,1);
    var sph=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x222222}));sc.add(sph);
    var arrows=new THREE.Group();sc.add(arrows);
    V={ready:true,r:r,sc:sc,cam:cam,sph:sph,arrows:arrows,box:box,H:0,P:-.08,fov:75,cur:null,nb:[],busy:false,hover:null,start:null,steps:0,req:0};
    function size(){var w=box.clientWidth||800,h=box.clientHeight||450;r.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();draw()}
    if(window.ResizeObserver)new ResizeObserver(size).observe(box);size();
    // regard à la souris ou au doigt
    var drag=null,ray=new THREE.Raycaster(),mv=new THREE.Vector2();
    function hit(e){var b=r.domElement.getBoundingClientRect();mv.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(mv,cam);var h=ray.intersectObjects(arrows.children,true)[0];if(!h)return null;var o=h.object;while(o&&!o.userData.nb)o=o.parent;return o}
    r.domElement.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,H:V.H,P:V.P,moved:false};r.domElement.setPointerCapture(e.pointerId)});
    r.domElement.addEventListener('pointermove',function(e){
      if(drag){var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;var k=V.fov/r.domElement.clientHeight;V.H=(drag.H-dx*k+360)%360;V.P=Math.max(-1.4,Math.min(1.4,drag.P+dy*k*Math.PI/180));draw();return}
      var o=hit(e);if(o!==V.hover){if(V.hover)V.hover.scale.setScalar(1);V.hover=o;if(o)o.scale.setScalar(1.25);r.domElement.style.cursor=o?'pointer':'grab';draw()}
    });
    r.domElement.addEventListener('pointerup',function(e){var d=drag;drag=null;if(d&&!d.moved){var o=hit(e);if(o)go(o.userData.nb)}});
    r.domElement.addEventListener('wheel',function(e){e.preventDefault();V.fov=Math.max(30,Math.min(90,V.fov+e.deltaY*.04));cam.fov=V.fov;cam.updateProjectionMatrix();draw()},{passive:false});
    r.domElement.style.cursor='grab';
    keys3=PP.held('geo-pad',{z:'F',w:'F',ArrowUp:'F',s:'B',ArrowDown:'B',q:'L',a:'L',ArrowLeft:'L',d:'R',ArrowRight:'R'},function(k,e){
      if(PP.cur()!=='geo'||(e&&e.target&&/INPUT|TEXTAREA/.test(e.target.tagName)))return;if(e&&e.preventDefault)e.preventDefault();
      if(k==='F')step(0);else if(k==='B')step(180);else turn();
    });
    // bouton retour au départ
    var hud=document.querySelector('#v-geo .geo-hud');if(hud&&!$('geo-home')){var b=document.createElement('button');b.type='button';b.id='geo-home';b.className='ghost';b.textContent='Retour au départ';b.onclick=function(){if(V.start)load(V.start,true)};hud.appendChild(b)}
    return true;
  }
  function draw(){if(!V.ready||V.req)return;V.req=requestAnimationFrame(function(){V.req=0;V.cam.rotation.y=-V.H*Math.PI/180;V.cam.rotation.x=V.P;V.r.render(V.sc,V.cam)})}
  function turn(){cancelAnimationFrame(walkRaf);(function st(){if(PP.cur()!=='geo')return;var any=false;if(keys3.L){V.H=(V.H-2.2+360)%360;any=true}if(keys3.R){V.H=(V.H+2.2)%360;any=true}if(any){draw();walkRaf=requestAnimationFrame(st)}})()}
  function step(rel){
    if(!V.nb.length||V.busy)return;var want=(V.H+rel)%360,best=null,bd=70;
    V.nb.forEach(function(n){var d=angDiff(n.b,want);if(d<bd){bd=d;best=n}});
    if(best)go(best);else $('geo-status').textContent='Pas de chemin par là : tourne-toi vers une flèche.';
  }
  function go(n){V.steps++;load({id:n.id,c:n.c,h:n.h},false)}
  function getJSON(u,ms){var ac=window.AbortController?new AbortController():null,t=setTimeout(function(){if(ac)ac.abort()},ms||7000);return fetch(u,ac?{signal:ac.signal}:{}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error(r.status);return r.json()},function(e){clearTimeout(t);throw e})}
  function apiFor(h){return h?'https://'+h+'/api':API}
  /* v88 : la fiche de la photo est demandée au serveur d'origine ; s'il traîne, on la demande aussi au catalogue commun, le premier qui répond gagne */
  function any(ps){return new Promise(function(ok,ko){var n=ps.length,f=0,last;ps.forEach(function(p){p.then(ok,function(e){last=e;if(++f===n)ko(last)})})})}
  function item(id,c,h){var k=c+'/'+id;if(cache[k])return cache[k];var settled=false;
    var a=getJSON(apiFor(h)+'/collections/'+c+'/items/'+id,6000);a.then(function(){settled=true},function(){});
    var b=!h?a:new Promise(function(ok,ko){setTimeout(function(){if(settled)return ko(new Error('inutile'));getJSON(API+'/collections/'+c+'/items/'+id,6000).then(ok,ko)},1200)});
    cache[k]=any([a,b]).catch(function(e){delete cache[k];throw e});return cache[k]}
  /* les images ont une adresse directe : on les charge en même temps que la fiche, sans l'attendre */
  function picUrl(h,id,f){return apiFor(h)+'/pictures/'+id+'/'+f+'.jpg'}
  var BADK=PP.key?PP.key('geo-bad'):'geo-bad';
  function bad(){try{return JSON.parse(localStorage.getItem(BADK))||[]}catch(e){return []}}
  function markBad(id){var b=bad();if(b.indexOf(id)<0){b.push(id);try{localStorage.setItem(BADK,JSON.stringify(b.slice(-60)))}catch(e){}}}
  function goodPlaces(){var b=bad(),l=PLACES.filter(function(q){return b.indexOf(q.id)<0});return l.length>=10?l:PLACES}
  function chevron(){
    var s=new THREE.Shape();s.moveTo(0,.55);s.lineTo(.55,-.05);s.lineTo(.3,-.05);s.lineTo(0,.28);s.lineTo(-.3,-.05);s.lineTo(-.55,-.05);s.lineTo(0,.55);
    var g=new THREE.Group(),m=new THREE.Mesh(new THREE.ShapeGeometry(s),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92,side:THREE.DoubleSide,depthTest:false}));
    var sh=new THREE.Mesh(new THREE.ShapeGeometry(s),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,side:THREE.DoubleSide,depthTest:false}));
    m.rotation.x=sh.rotation.x=-Math.PI/2;sh.position.set(.04,-.02,.04);m.renderOrder=2;sh.renderOrder=1;g.add(sh);g.add(m);return g;
  }
  function setArrows(){
    var A=V.arrows;while(A.children.length)A.remove(A.children[0]);
    V.nb.forEach(function(n){var w=new THREE.Group();w.rotation.y=-n.b*Math.PI/180;var c=chevron();c.position.set(0,-1.5,-3.2);c.userData.nb=n;w.add(c);A.add(w)});
    draw();
  }
  function neighbours(f,c){
    var me=[f.geometry.coordinates[1],f.geometry.coordinates[0]],out=[];
    f.links.forEach(function(l){if((l.rel==='prev'||l.rel==='next')&&l.geometry&&l.id){var ll=[l.geometry.coordinates[1],l.geometry.coordinates[0]];out.push({id:l.id,c:c,h:HOST,ll:ll,b:bearing(me,ll),d:dist(me,ll)*1000})}});
    var d=.00035;
    return getJSON(apiFor(HOST)+'/search?limit=20&bbox='+[me[1]-d,me[0]-d*.7,me[1]+d,me[0]+d*.7].join(',')+'&filter='+encodeURIComponent('"field_of_view"=360')).then(function(r){
      (r.features||[]).forEach(function(g){
        if(g.id===f.id||g.collection===c)return;var ll=[g.geometry.coordinates[1],g.geometry.coordinates[0]],dd=dist(me,ll)*1000;if(dd<3||dd>40)return;
        var b=bearing(me,ll);if(out.some(function(o){return angDiff(o.b,b)<35}))return;out.push({id:g.id,c:g.collection,h:HOST,ll:ll,b:b,d:dd});
      });return out;
    },function(){return out});
  }
  function tex(u,ms){return new Promise(function(ok,ko){var l=new THREE.TextureLoader();l.setCrossOrigin('anonymous');var tt=setTimeout(function(){ko(new Error('timeout'))},ms);l.load(u,function(t){clearTimeout(tt);ok(t)},undefined,function(e){clearTimeout(tt);ko(e)})})}
  function load(p,first){
    if(!init3d())return;V.busy=true;
    var tok=V.tok=(V.tok||0)+1;
    $('geo-loading').hidden=false;$('geo-loading').classList.remove('soft');$('geo-loading').textContent=first?'Chargement de la rue':'On avance';
    HOST=p.h||HOST;
    var az=null,lvl=0,shown=false,itP=item(p.id,p.c,p.h);
    function rot(){return (270-(az||0))*Math.PI/180}
    function apply(t,l){if(tok!==V.tok||l<=lvl){t.dispose();return}lvl=l;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;var old=V.sph.material;V.sph.material=new THREE.MeshBasicMaterial({map:t});if(old.map)old.map.dispose();old.dispose();V.sph.rotation.y=rot();
      if(!shown){shown=true;V.cur={id:p.id,c:p.c,h:p.h,ll:p.ll||(V.cur&&V.cur.ll)};if(first){V.start={id:p.id,c:p.c,h:p.h,ll:p.ll};V.H=Math.random()*360;V.P=-.06;V.fov=75;V.cam.fov=75;V.cam.updateProjectionMatrix();V.steps=0}V.busy=false}
      if(l===2){$('geo-loading').hidden=true;afterSd()}else{$('geo-loading').classList.add('soft');$('geo-loading').textContent='Image en haute qualité…'}draw()}
    /* petite image tout de suite, puis la bonne image ; les deux partent en même temps que la fiche */
    tex(picUrl(p.h,p.id,'thumb'),6000).catch(function(){return itP.then(function(f){return f.assets.thumb?tex(f.assets.thumb.href,6000):null})}).then(function(t){if(t)apply(t,1)}).catch(function(){});
    tex(picUrl(p.h,p.id,'sd'),14000).catch(function(){return itP.then(function(f){return tex((f.assets.sd||f.assets.hd).href,15000)})}).then(function(t){apply(t,2)},function(){
      if(tok!==V.tok)return;if(lvl){$('geo-loading').hidden=true;return}
      V.busy=false;if(first)markBad(p.id);
      if(first&&V.onfail){$('geo-loading').textContent='Rue indisponible, on en prend une autre';V.onfail()}
      else{$('geo-loading').hidden=true;$('geo-status').textContent='Cette photo ne charge pas, essaie une autre flèche.'}});
    var nbDone=false,sdDone=false;
    function afterSd(){sdDone=true;preNb()}
    function preNb(){if(!nbDone||!sdDone||tok!==V.tok)return;/* on prépare seulement les petites images des rues voisines (et la bonne image de celle d'en face) pour ne pas ralentir celle-ci */
      var front=null,fd=60;V.nb.forEach(function(n){var d=angDiff(n.b,V.H);if(d<fd){fd=d;front=n}var i=new Image();i.crossOrigin='anonymous';i.src=picUrl(n.h,n.id,'thumb')});
      if(front){var j=new Image();j.crossOrigin='anonymous';j.src=picUrl(front.h,front.id,'sd')}}
    V.nb=[];setArrows();
    itP.then(function(f){
      if(tok!==V.tok)return;var na=f.properties['view:azimuth']||0;
      /* la photo tourne pour pointer au nord : on tourne le regard d'autant, l'image ne saute pas */
      if(lvl){var d=((270-na)-(270-(az||0)));V.H=(V.H-d+720)%360;}az=na;V.sph.rotation.y=rot();
      var ll=[f.geometry.coordinates[1],f.geometry.coordinates[0]];if(V.cur&&V.cur.id===p.id)V.cur.ll=ll;draw();
      return neighbours(f,p.c).then(function(nb){if(tok!==V.tok)return;V.nb=nb;setArrows();nbDone=true;preNb();if(!locked)$('geo-status').textContent=nb.length?'Avance avec les flèches au sol, ou Z / flèche haut. Clique sur la carte pour poser ton point.':'Pas de chemin ici : regarde autour de toi puis pose ton point sur la carte.'});
    }).catch(function(){});
  }
  function show3d(p,onfail){if(!init3d())return;V.onfail=onfail||null;setTimeout(function(){V.r.domElement.dispatchEvent(new Event('resize'));draw()},0);load(p,true)}
  function newRound(p,onfail){locked=false;clearMap();show3d(p,onfail);$('geo-ok').disabled=true;$('geo-res').innerHTML='';$('geo-status').textContent='Clique sur la carte pour poser ton point.';$('geo-mini').classList.remove('big')}

  /* ---------- Entrée ---------- */
  function open(){
    if(!initMap())return;
    setTimeout(function(){map.resize();if(V.ready)draw()},50);
    if(net.inRoom()){
      if(net.isHost){if(!H.rounds)hostLobby();else if(H.open){newRound(H.rounds[H.ri]);hostStatus()}else if(H.res)showResults(H.res,true);else hostLobby();return}
      /* invité : on reprend la manche en cours (même si on est arrivé en retard), puis on demande à l'hôte où on en est */
      G.k=null;if(G.end&&(!G.pending||G.end.at>G.pending.at))showEnd(G.end);else if(G.pending){guestRound(G.pending);if(G.res&&G.res.k===G.pending.k)showResults(G.res,false)}else guestWait();
      net.send({t:'geo-hello'});return}
    if(!solo.rounds)soloNew();else soloRender();
  }
  function close(){cancelAnimationFrame(walkRaf);V.tok=(V.tok||0)+1}
  $('geo-ok').onclick=function(){
    if(!guess||locked)return;
    if(net.inRoom()){locked=true;$('geo-ok').disabled=true;$('geo-status').textContent='Réponse envoyée, on attend les autres.';if(net.isHost){H.guesses.host=guess;hostCheck()}else net.send({t:'geo-g',ll:guess,k:G.k});return}
    soloAnswer();
  };

  /* ---------- Solo ---------- */
  function soloNew(){solo.rounds=PP.shuffle(goodPlaces()).slice(0,5);solo.ri=0;solo.score=0;soloRender()}
  function prefetch(p,thumbOnly){if(!p)return;item(p.id,p.c,p.h).catch(function(){});var j=new Image();j.crossOrigin='anonymous';j.src=picUrl(p.h,p.id,'thumb');if(!thumbOnly){var i=new Image();i.crossOrigin='anonymous';i.src=picUrl(p.h,p.id,'sd')}}
  function soloRender(){var p=solo.rounds[solo.ri];setTimeout(function(){prefetch(solo.rounds[solo.ri+1])},4000);$('geo-round').textContent='Manche '+(solo.ri+1)+' / 5';$('geo-score').textContent=solo.score;newRound(p,function(){var used=solo.rounds.map(function(q){return q.id}),alt=PP.shuffle(goodPlaces()).filter(function(q){return used.indexOf(q.id)<0})[0];if(alt){solo.rounds[solo.ri]=alt;soloRender()}})}
  function soloAnswer(){
    sfx.play('ui');
    var p=solo.rounds[solo.ri],d=dist(guess,p.ll),pts=Math.round(5000*Math.exp(-d/600));if(d<1)pts=5000;
    solo.score+=pts;locked=true;$('geo-ok').disabled=true;$('geo-score').textContent=solo.score;$('geo-status').textContent='';
    pin(p.ll,'#ff3b3b',p.n);lineTo(guess,p.ll,'#ff3b3b');$('geo-mini').classList.add('big');
    setTimeout(function(){fitAll([guess,p.ll])},260);
    var last=solo.ri===4;
    $('geo-res').innerHTML='<div class="result"><h3>C\'était '+esc(p.n)+'</h3><p>Tu étais à <b>'+km(d)+'</b> : +'+pts.toLocaleString('fr-FR')+' points.</p><button type="button" id="geo-next">'+(last?'Voir le score final':'Manche suivante')+'</button></div>';
    $('geo-next').onclick=function(){
      if(!last){solo.ri++;soloRender();return}
      var tot=solo.score,best=PP.store('geo-best');if(tot>best){best=tot;PP.store('geo-best',tot);PP.refreshHi()}
      $('geo-res').innerHTML='<div class="result" style="text-align:center"><h3>Score final</h3><p style="font:400 32px var(--px);margin:10px 0;color:var(--y)">'+tot.toLocaleString('fr-FR')+' / 25 000</p><p>Record : '+best.toLocaleString('fr-FR')+'</p><button type="button" id="geo-again">Rejouer</button></div>';
      $('geo-again').onclick=soloNew;
    };
  }

  /* ---------- Salon : hôte ----------
     v88 : l'hôte vérifie que la rue charge avant de lancer la manche, puis envoie à tous exactement la même photo
     (avec un numéro de manche). Un joueur qui arrive en retard, ou qui revient du salon, reçoit la manche en cours. */
  function hostLobby(){
    H.rounds=null;H.ri=0;H.scores={};H.open=false;H.res=null;H.msg=null;
    $('geo-round').textContent='Salon '+net.code;$('geo-score').textContent='';
    $('geo-res').innerHTML='<div class="result"><h3>'+net.players.length+' joueurs</h3><p>5 manches. À chaque manche, tout le monde pose son point sur son téléphone : le plus proche du lieu gagne 1 point.</p><ul class="plist">'+net.players.map(function(p){return '<li>'+esc(p.name)+'</li>'}).join('')+'</ul><button type="button" id="geo-launch"'+(net.players.length<2?' disabled':'')+'>Lancer</button></div>';
    $('geo-status').textContent='';$('geo-ok').disabled=true;
    $('geo-launch').onclick=function(){H.rounds=PP.shuffle(goodPlaces()).slice(0,5);H.spare=PP.shuffle(goodPlaces()).filter(function(q){return H.rounds.indexOf(q)<0});H.ri=0;H.scores={};H.rounds.forEach(function(q,i){if(i<2)prefetch(q,i>0);else item(q.id,q.c,q.h).catch(function(){})});hostRound()};
  }
  function check(p){return new Promise(function(ok,ko){var t=setTimeout(function(){ko(new Error('lent'))},7000);item(p.id,p.c,p.h).then(function(f){clearTimeout(t);ok(f)},function(e){clearTimeout(t);ko(e)})})}
  function hostRound(tries){
    var p=H.rounds[H.ri];tries=tries||0;H.open=false;H.res=null;
    $('geo-res').innerHTML='<div class="result"><p class="wait">Préparation de la manche '+(H.ri+1)+'</p></div>';
    check(p).then(function(){startRound(p)},function(){markBad(p.id);var alt=H.spare&&H.spare.shift();if(alt&&tries<4){H.rounds[H.ri]=alt;hostRound(tries+1)}else startRound(p)});
  }
  function startRound(p){
    H.guesses={};H.open=true;H.k=Date.now()+'-'+H.ri;var nx=H.rounds[H.ri+1];
    H.msg={t:'geo-r',k:H.k,r:H.ri+1,ll:p.ll,id:p.id,c:p.c,h:p.h,nx:nx?{id:nx.id,c:nx.c,h:nx.h}:null,at:Date.now()};
    net.broadcast(H.msg);
    $('geo-round').textContent='Manche '+(H.ri+1)+' / 5';$('geo-score').textContent=scoreLine();
    newRound(p,retryFor(p));hostStatus();
    if(nx)setTimeout(function(){prefetch(nx)},5000);
  }
  function scoreLine(){return Object.keys(H.scores).map(function(n){return n+' '+H.scores[n]}).join(' · ')}
  function hostStatus(){
    var n=Object.keys(H.guesses).length,tot=net.players.length;
    $('geo-res').innerHTML='<div class="result"><p>'+n+' / '+tot+' ont répondu.</p><button type="button" class="ghost" id="geo-force">Terminer la manche maintenant</button></div>';
    $('geo-force').onclick=hostReveal;
  }
  function hostCheck(){if(!H.open)return;hostStatus();if(Object.keys(H.guesses).length>=net.players.length)hostReveal()}
  function hostReveal(){
    if(!H.open)return;H.open=false;
    var p=H.rounds[H.ri],rows=net.players.map(function(pl){var g=H.guesses[pl.id];return {name:pl.name,ll:g||null,d:g?dist(g,p.ll):null}});
    var best=rows.filter(function(r){return r.ll}).sort(function(a,b){return a.d-b.d})[0];
    rows.forEach(function(r){r.win=!!best&&r===best});
    if(best)H.scores[best.name]=(H.scores[best.name]||0)+1;
    var msg={t:'geo-res',k:H.k,place:{t:p.t,n:p.n,ll:p.ll},rows:rows,last:H.ri===4,scores:H.scores};H.res=msg;
    net.broadcast(msg);showResults(msg,true);
  }
  function hostNext(){if(H.ri>=4)return hostEnd();H.ri++;hostRound()}
  function hostEnd(){
    var rows=Object.keys(H.scores).map(function(n){return {name:n,n:H.scores[n]}}).sort(function(a,b){return b.n-a.n});
    H.endMsg={t:'geo-end',rows:rows,at:Date.now()};H.open=false;net.broadcast(H.endMsg);
    $('geo-res').innerHTML=endHtml(rows)+'<div class="row" style="margin-top:14px"><button type="button" id="geo-again">Rejouer</button><button type="button" class="ghost" data-go="room">Retour au salon</button></div></div>';
    $('geo-again').onclick=hostLobby;
  }
  /* quelqu'un arrive ou revient : on lui renvoie l'état de la partie */
  function hostSync(to){if(!H.rounds){if(H.endMsg)net.to(to,H.endMsg);return}if(H.msg)net.to(to,H.msg);if(!H.open&&H.res&&H.res.k===H.k)net.to(to,H.res)}

  /* ---------- Salon : invité ---------- */
  function retryFor(pl){return function retry(){$('geo-loading').hidden=false;$('geo-loading').innerHTML='La photo met du temps à arriver… <button type="button" class="ghost" id="geo-retry">Réessayer</button>';var b=$('geo-retry');if(b)b.onclick=function(){V.onfail=retry;load(pl,true)}}}
  function guestWait(){$('geo-round').textContent='Salon '+net.code;$('geo-score').textContent='';$('geo-ok').disabled=true;$('geo-status').textContent='';$('geo-res').innerHTML='<div class="result"><p class="wait">L\'hôte lance la partie</p></div>'}
  function guestRound(m){
    if(G.k===m.k)return;G.k=m.k;sfx.play('join');G.round=m.r;$('geo-round').textContent='Manche '+m.r+' / 5';
    var pl={ll:m.ll,id:m.id,c:m.c,h:m.h};
    /* on ne change jamais de lieu chez un invité : si la photo ne vient pas, on réessaie, la même */
    newRound(pl,retryFor(pl));
    if(m.nx)setTimeout(function(){if(G.k===m.k)prefetch(m.nx)},5000);
  }
  function showEnd(m){$('geo-res').innerHTML=endHtml(m.rows)+'<p class="wait">L\'hôte peut relancer</p></div>'}

  /* ---------- Résultats communs ---------- */
  var COLS=['#3cff6e','#3fa9ff','#ff5fd2','#ff8a3d','#ffd23f','#36d6c3','#f2efe6','#ff3b3b'];
  function showResults(m,isHost){
    sfx.play('win');
    locked=true;$('geo-ok').disabled=true;$('geo-status').textContent='';
    pin(m.place.ll,'#ff3b3b',m.place.t);
    var pts=[m.place.ll];
    m.rows.forEach(function(r,i){if(!r.ll)return;pts.push(r.ll);pin(r.ll,COLS[i%COLS.length],r.name);lineTo(r.ll,m.place.ll,COLS[i%COLS.length])});
    $('geo-mini').classList.add('big');
    setTimeout(function(){fitAll(pts)},260);
    $('geo-score').textContent=Object.keys(m.scores).map(function(n){return n+' '+m.scores[n]}).join(' · ');
    var h='<div class="result"><h3>C\'était '+esc(m.place.n)+'</h3>'+m.rows.slice().sort(function(a,b){return (a.d==null?1e9:a.d)-(b.d==null?1e9:b.d)}).map(function(r){return '<div class="bar"><span>'+(r.win?'★ ':'')+esc(r.name)+'</span><i style="width:'+(r.d==null?2:Math.max(4,200-Math.min(200,r.d/100)))+'px;background:'+(r.win?'var(--y)':'var(--p)')+'"></i><span>'+(r.d==null?'pas de réponse':km(r.d))+'</span></div>'}).join('');
    h+=isHost?'<p style="margin-top:12px"><button type="button" id="geo-next">'+(m.last?'Voir le classement':'Manche suivante')+'</button></p></div>':'<p class="wait">Suite</p></div>';
    $('geo-res').innerHTML=h;
    if(isHost)$('geo-next').onclick=hostNext;
  }
  function endHtml(rows){if(rows.length&&rows[0].name===net.me.name&&rows[0].n>0)PP.stat('geo','win');return '<div class="result"><h3>Classement</h3><p class="muted">Un point par manche gagnée.</p>'+(rows.length?rows.map(function(r,i){return '<div class="bar"><span>'+(i+1)+'. '+esc(r.name)+'</span><i style="width:'+(r.n*40)+'px;background:var(--y)"></i><span>'+r.n+'</span></div>'}).join(''):'<p>Personne n\'a marqué.</p>')}

  /* messages du salon : toujours écoutés, même si on n'est pas encore sur la page du jeu (on garde la manche en cours) */
  net.on(function(m,from){
    if(!net.inRoom())return;
    if(net.isHost){
      if(m.t==='geo-g'&&H.open&&(!m.k||m.k===H.k)&&!H.guesses[from]){H.guesses[from]=m.ll;if(PP.cur()==='geo')hostCheck();else if(Object.keys(H.guesses).length>=net.players.length)hostReveal()}
      if((m.t==='geo-hello'||(m.t==='rejoin'&&m.game==='geo'))&&from)hostSync(from);
      if(m.t==='players'&&!H.rounds&&PP.cur()==='geo')hostLobby();
      return;
    }
    if(m.t==='geo-r'){if(!G.pending||G.pending.k!==m.k){G.pending=m;G.res=null}if(PP.cur()==='geo')guestRound(m)}
    if(m.t==='geo-res'){G.res=m;if(PP.cur()==='geo'&&G.k===m.k)showResults(m,false)}
    if(m.t==='geo-end'){G.end=m;G.pending=null;if(PP.cur()==='geo')showEnd(m)}
  });
  PP._geo=function(){return {V:V,map:map}};
  PP.games.geo={open:open,close:close};
})();
