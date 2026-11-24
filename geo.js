/* Pixel Pause — Devine où : une photo du lieu, une mini-carte, on pose son point. Solo, ou en salon : le plus proche gagne la manche. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,SKIP=['Pyramide de Khéops','Machu Picchu','Montagne de la Table','Dune du Pilat','Pétra','Angkor Vat','Badaling','Mont Fuji','Baie d\'Along','Uluru/Ayers Rock','Chutes du Niagara','Panneau Hollywood'],PLACES=(PP.GEO_PLACES||[]).filter(function(p){return SKIP.indexOf(p.t)<0});
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
  /* ---------- Vue 3D (MapLibre + OpenFreeMap, sans aucun nom) ---------- */
  var m3=null,m3ready=false,keys3={},walkRaf=0;
  function init3d(){
    if(m3)return true;
    if(!window.maplibregl){$('geo-loading').textContent='La 3D n\'a pas pu se charger : vérifie ta connexion.';return false}
    m3=new maplibregl.Map({container:'geo-3d',style:'https://tiles.openfreemap.org/styles/liberty',center:[2.29,48.86],zoom:16.5,pitch:65,bearing:0,minZoom:14.5,maxZoom:18.5,maxPitch:80,attributionControl:{compact:true},dragRotate:true,touchPitch:true});
    m3.on('style.load',function(){
      m3.getStyle().layers.forEach(function(l){if(l.type==='symbol')m3.setLayoutProperty(l.id,'visibility','none')});
      try{m3.setPaintProperty('building-3d','fill-extrusion-color','#8a8699');m3.setPaintProperty('building-3d','fill-extrusion-opacity',.95)}catch(e){}
      m3ready=true;$('geo-loading').hidden=true;
    });
    m3.on('error',function(){});
    keys3=PP.held('geo-pad',{z:'F',w:'F',ArrowUp:'F',s:'B',ArrowDown:'B',q:'SL',ArrowLeft:'SL',d:'SR',ArrowRight:'SR',a:'L',e:'R'},function(k,e){if(PP.cur()==='geo'&&e.preventDefault&&!/INPUT/.test(e.target&&e.target.tagName||''))e.preventDefault();walk()});
    return true;
  }
  function walk(){
    cancelAnimationFrame(walkRaf);
    (function st(){
      if(PP.cur()!=='geo'||!m3)return;
      var any=false,b=m3.getBearing()*Math.PI/180,step=6,dx=0,dy=0;
      if(keys3.F){dx+=Math.sin(b)*step;dy-=Math.cos(b)*step;any=true}
      if(keys3.B){dx-=Math.sin(b)*step;dy+=Math.cos(b)*step;any=true}
      if(keys3.SL){dx-=Math.cos(b)*step;dy-=Math.sin(b)*step;any=true}
      if(keys3.SR){dx+=Math.cos(b)*step;dy+=Math.sin(b)*step;any=true}
      if(keys3.L){m3.setBearing(m3.getBearing()-2);any=true}
      if(keys3.R){m3.setBearing(m3.getBearing()+2);any=true}
      if(dx||dy)m3.panBy([dx,dy],{duration:0});
      if(any)walkRaf=requestAnimationFrame(st);
    })();
  }
  function show3d(ll){
    if(!init3d())return;
    $('geo-loading').hidden=false;$('geo-loading').textContent='Chargement de la 3D';
    var d=.035;
    m3.setMaxBounds(null);
    m3.jumpTo({center:[ll[1]+(Math.random()-.5)*.004,ll[0]+(Math.random()-.5)*.003],zoom:16.8,pitch:68,bearing:Math.random()*360});
    m3.setMaxBounds([[ll[1]-d,ll[0]-d*.7],[ll[1]+d,ll[0]+d*.7]]);
    m3.resize();
    if(m3ready)m3.once('idle',function(){$('geo-loading').hidden=true});
  }
  function newRound(p){locked=false;clearMap();show3d(p.ll);$('geo-ok').disabled=true;$('geo-res').innerHTML='';$('geo-status').textContent='Clique sur la carte pour poser ton point.';$('geo-mini').classList.remove('big')}

  /* ---------- Entrée ---------- */
  function open(){
    if(!initMap())return;
    setTimeout(function(){map.resize();if(m3)m3.resize()},50);
    if(net.inRoom()){listen();if(net.isHost)hostLobby();else guestWait();return}
    if(!solo.rounds)soloNew();else soloRender();
  }
  function close(){if(sub){sub();sub=null}cancelAnimationFrame(walkRaf)}
  $('geo-ok').onclick=function(){
    if(!guess||locked)return;
    if(net.inRoom()){locked=true;$('geo-ok').disabled=true;$('geo-status').textContent='Réponse envoyée, on attend les autres.';if(net.isHost){H.guesses.host=guess;hostCheck()}else net.send({t:'geo-g',ll:guess});return}
    soloAnswer();
  };

  /* ---------- Solo ---------- */
  function soloNew(){solo.rounds=PP.shuffle(PLACES).slice(0,5);solo.ri=0;solo.score=0;soloRender()}
  function soloRender(){var p=solo.rounds[solo.ri];$('geo-round').textContent='Manche '+(solo.ri+1)+' / 5';$('geo-score').textContent=solo.score;newRound(p)}
  function soloAnswer(){
    sfx.play('ui');
    var p=solo.rounds[solo.ri],d=dist(guess,p.ll),pts=Math.round(5000*Math.exp(-d/1500));if(d<25)pts=5000;
    solo.score+=pts;locked=true;$('geo-ok').disabled=true;$('geo-score').textContent=solo.score;$('geo-status').textContent='';
    pin(p.ll,'#ff3b3b',p.n);lineTo(guess,p.ll,'#ff3b3b');$('geo-mini').classList.add('big');
    setTimeout(function(){fitAll([guess,p.ll])},260);
    var last=solo.ri===4;
    $('geo-res').innerHTML='<div class="result"><h3>C\'était '+esc(p.t)+' · '+esc(p.n)+'</h3><p>Tu étais à <b>'+km(d)+'</b> : +'+pts.toLocaleString('fr-FR')+' points.</p><button type="button" id="geo-next">'+(last?'Voir le score final':'Manche suivante')+'</button></div>';
    $('geo-next').onclick=function(){
      if(!last){solo.ri++;soloRender();return}
      var tot=solo.score,best=PP.store('geo-best');if(tot>best){best=tot;PP.store('geo-best',tot);PP.refreshHi()}
      $('geo-res').innerHTML='<div class="result" style="text-align:center"><h3>Score final</h3><p style="font:400 32px var(--px);margin:10px 0;color:var(--y)">'+tot.toLocaleString('fr-FR')+' / 25 000</p><p>Record : '+best.toLocaleString('fr-FR')+'</p><button type="button" id="geo-again">Rejouer</button></div>';
      $('geo-again').onclick=soloNew;
    };
  }

  /* ---------- Salon : hôte ---------- */
  function hostLobby(){
    H.rounds=null;H.ri=0;H.scores={};
    $('geo-round').textContent='Salon '+net.code;$('geo-score').textContent='';
    $('geo-res').innerHTML='<div class="result"><h3>'+net.players.length+' joueurs</h3><p>5 manches. À chaque manche, tout le monde pose son point sur son téléphone : le plus proche du lieu gagne 1 point.</p><ul class="plist">'+net.players.map(function(p){return '<li>'+esc(p.name)+'</li>'}).join('')+'</ul><button type="button" id="geo-launch"'+(net.players.length<2?' disabled':'')+'>Lancer</button></div>';
    $('geo-status').textContent='';$('geo-ok').disabled=true;
    $('geo-launch').onclick=function(){H.rounds=PP.shuffle(PLACES).slice(0,5);H.ri=0;H.scores={};hostRound()};
  }
  function hostRound(){
    var p=H.rounds[H.ri];H.guesses={};H.open=true;
    net.broadcast({t:'geo-r',r:H.ri+1,ll:p.ll});
    $('geo-round').textContent='Manche '+(H.ri+1)+' / 5';$('geo-score').textContent=scoreLine();
    newRound(p);hostStatus();
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
    var msg={t:'geo-res',place:{t:p.t,n:p.n,ll:p.ll},rows:rows,last:H.ri===4,scores:H.scores};
    net.broadcast(msg);showResults(msg,true);
  }
  function hostNext(){if(H.ri>=4)return hostEnd();H.ri++;hostRound()}
  function hostEnd(){
    var rows=Object.keys(H.scores).map(function(n){return {name:n,n:H.scores[n]}}).sort(function(a,b){return b.n-a.n});
    net.broadcast({t:'geo-end',rows:rows});
    $('geo-res').innerHTML=endHtml(rows)+'<div class="row" style="margin-top:14px"><button type="button" id="geo-again">Rejouer</button><button type="button" class="ghost" data-go="room">Retour au salon</button></div></div>';
    $('geo-again').onclick=hostLobby;
  }

  /* ---------- Salon : invité ---------- */
  function guestWait(){$('geo-round').textContent='Salon '+net.code;$('geo-score').textContent='';$('geo-ok').disabled=true;$('geo-status').textContent='';$('geo-res').innerHTML='<div class="result"><p class="wait">L\'hôte lance la partie</p></div>'}
  function guestRound(m){sfx.play('join');G.round=m.r;$('geo-round').textContent='Manche '+m.r+' / 5';newRound({ll:m.ll})}

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
    var h='<div class="result"><h3>C\'était '+esc(m.place.t)+' · '+esc(m.place.n)+'</h3>'+m.rows.slice().sort(function(a,b){return (a.d==null?1e9:a.d)-(b.d==null?1e9:b.d)}).map(function(r){return '<div class="bar"><span>'+(r.win?'★ ':'')+esc(r.name)+'</span><i style="width:'+(r.d==null?2:Math.max(4,200-Math.min(200,r.d/100)))+'px;background:'+(r.win?'var(--y)':'var(--p)')+'"></i><span>'+(r.d==null?'pas de réponse':km(r.d))+'</span></div>'}).join('');
    h+=isHost?'<p style="margin-top:12px"><button type="button" id="geo-next">'+(m.last?'Voir le classement':'Manche suivante')+'</button></p></div>':'<p class="wait">Suite</p></div>';
    $('geo-res').innerHTML=h;
    if(isHost)$('geo-next').onclick=hostNext;
  }
  function endHtml(rows){return '<div class="result"><h3>Classement</h3><p class="muted">Un point par manche gagnée.</p>'+(rows.length?rows.map(function(r,i){return '<div class="bar"><span>'+(i+1)+'. '+esc(r.name)+'</span><i style="width:'+(r.n*40)+'px;background:var(--y)"></i><span>'+r.n+'</span></div>'}).join(''):'<p>Personne n\'a marqué.</p>')}

  function listen(){
    if(sub)return;
    sub=net.on(function(m,from){
      if(PP.cur()!=='geo')return;
      if(net.isHost){
        if(m.t==='geo-g'&&H.open&&!H.guesses[from]){H.guesses[from]=m.ll;hostCheck()}
        if(m.t==='players'&&!H.rounds)hostLobby();
      }else{
        if(m.t==='geo-r')guestRound(m);
        if(m.t==='geo-res')showResults(m,false);
        if(m.t==='geo-end'){$('geo-res').innerHTML=endHtml(m.rows)+'<p class="wait">L\'hôte peut relancer</p></div>'}
      }
    });
  }
  PP._geo=function(){return {m3:m3,map:map,ready:m3ready}};
  PP.games.geo={open:open,close:close};
})();
