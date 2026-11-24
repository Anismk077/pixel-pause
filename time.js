/* Pixel Pause — Quand et où : une photo historique, on devine l'année ET le lieu.
   5 manches, jusqu'à 10 000 points par manche (5 000 pour l'année, 5 000 pour le lieu). Solo ou en salon. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,net=PP.net,PH=(PP.TIME_PHOTOS||[]).slice(),MINY=1860,MAXY=2025;
  var map=null,mapReady=false,marker=null,pins=[],guess=null,locked=false,year=1950,sub=null,lines=[];
  var S={rounds:null,ri:0,score:0},H={rounds:null,ri:0,ans:{},tot:{},open:false},online=false;
  function dist(a,b){var r=Math.PI/180,dLa=(b[0]-a[0])*r,dLo=(b[1]-a[1])*r,x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLo/2)*Math.sin(dLo/2);return 2*6371*Math.asin(Math.sqrt(x))}
  function locPts(d){return d<25?5000:Math.round(5000*Math.exp(-d/1500))}
  function yearPts(dy){return Math.round(5000*Math.pow(Math.max(0,1-dy/25),1.5))}
  function km(d){return Math.round(d).toLocaleString('fr-FR')+' km'}
  function fmt(n){return n.toLocaleString('fr-FR')}

  /* ---------- Carte ---------- */
  function initMap(){
    if(map)return true;
    if(!window.maplibregl){$('tg-res').innerHTML='<div class="result"><b>La carte n\'a pas pu se charger.</b> Vérifie ta connexion.</div>';return false}
    map=new maplibregl.Map({container:'tg-map',style:'https://tiles.openfreemap.org/styles/bright',center:[10,30],zoom:.7,minZoom:.4,maxZoom:14,attributionControl:{compact:true},dragRotate:false,pitchWithRotate:false});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-left');
    map.on('load',function(){map.addSource('tl',{type:'geojson',data:{type:'FeatureCollection',features:[]}});map.addLayer({id:'tl',type:'line',source:'tl',paint:{'line-color':['get','c'],'line-width':3,'line-dasharray':[2,2]}});mapReady=true});
    map.on('click',function(e){if(locked)return;guess=[e.lngLat.lat,((e.lngLat.lng+540)%360)-180];if(marker)marker.setLngLat(e.lngLat);else marker=new maplibregl.Marker({color:'#e2361b'}).setLngLat(e.lngLat).addTo(map);check();sfx.play('ui')});
    return true;
  }
  function clearMap(){if(marker){marker.remove();marker=null}pins.forEach(function(p){p.remove()});pins=[];lines=[];if(mapReady)map.getSource('tl').setData({type:'FeatureCollection',features:[]});guess=null;map.jumpTo({center:[10,30],zoom:.7})}
  function pin(ll,color,label){var el=document.createElement('div');el.className='pp-pin';el.style.setProperty('--c',color);if(label){var t=document.createElement('span');t.textContent=label;el.appendChild(t)}pins.push(new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([ll[1],ll[0]]).addTo(map))}
  function line(a,b,c){lines.push({type:'Feature',properties:{c:c},geometry:{type:'LineString',coordinates:[[a[1],a[0]],[b[1],b[0]]]}});if(mapReady)map.getSource('tl').setData({type:'FeatureCollection',features:lines})}
  function fit(pts){var bb=new maplibregl.LngLatBounds();pts.forEach(function(q){bb.extend([q[1],q[0]])});map.resize();map.fitBounds(bb,{padding:50,maxZoom:6,duration:600})}

  /* ---------- Année ---------- */
  function setYear(y){year=Math.max(MINY,Math.min(MAXY,Math.round(y)));$('tg-year').textContent=year;$('tg-range').value=year;var pct=(year-MINY)/(MAXY-MINY)*100;$('tg-range').style.setProperty('--p',pct+'%')}
  $('tg-range').min=MINY;$('tg-range').max=MAXY;
  $('tg-range').addEventListener('input',function(){if(!locked){setYear(+this.value);check()}});
  document.querySelectorAll('[data-dy]').forEach(function(b){b.addEventListener('click',function(){if(!locked){setYear(year+(+b.dataset.dy));sfx.play('ui')}})});
  function check(){$('tg-ok').disabled=locked||!guess;$('tg-hint').textContent=guess?'Prêt : '+year+' et ton point sur la carte.':'Choisis l\'année, puis clique sur la carte.'}

  /* ---------- Manche ---------- */
  function showPhoto(p){
    var im=$('tg-img');$('tg-photo').classList.add('loading');im.onload=function(){$('tg-photo').classList.remove('loading')};im.onerror=function(){$('tg-photo').classList.remove('loading')};im.src=p.img;
    locked=false;clearMap();setYear(1950);$('tg-res').innerHTML='';$('tg-cap').textContent='';check();$('tg-side').classList.remove('done');setTimeout(function(){map.resize()},60);
  }
  function result(p,g,y){
    var d=g?dist(g,p.ll):null,lp=g?locPts(d):0,dy=Math.abs(y-p.y),yp=yearPts(dy);return {d:d,lp:lp,dy:dy,yp:yp,tot:lp+yp};
  }
  function reveal(p,rows){
    locked=true;$('tg-ok').disabled=true;$('tg-side').classList.add('done');
    $('tg-cap').innerHTML='<b>'+esc(p.n)+'</b> · '+esc(p.p)+' · '+p.y;
    pin(p.ll,'#141210',p.y+'');var pts=[p.ll];
    rows.forEach(function(r,i){if(!r.g)return;var col=['#e2361b','#3fa9ff','#3f8f3a','#d4a32a','#8a3fb5','#2fa3a3','#d06090','#5a5a5a'][i%8];pin(r.g,col,rows.length>1?r.name:'');line(r.g,p.ll,col);pts.push(r.g)});
    setTimeout(function(){fit(pts)},80);
  }

  /* ---------- Solo ---------- */
  function soloNew(){S.rounds=PP.shuffle(PH).slice(0,5);S.ri=0;S.score=0;soloRound()}
  function soloRound(){$('tg-round').textContent='Manche '+(S.ri+1)+' / 5';$('tg-score').textContent=fmt(S.score)+' pts';showPhoto(S.rounds[S.ri])}
  function soloAnswer(){
    var p=S.rounds[S.ri],r=result(p,guess,year);S.score+=r.tot;sfx.play(r.tot>7000?'win':'ui');$('tg-score').textContent=fmt(S.score)+' pts';
    reveal(p,[{g:guess,name:'toi'}]);var last=S.ri===4;
    $('tg-res').innerHTML='<div class="tg-card"><div class="tg-pts"><b>+'+fmt(r.tot)+'</b><span>points</span></div><div class="tg-rows"><div><span>Année</span><b>'+year+'</b><em>'+(r.dy===0?'pile !':(r.dy+' an'+(r.dy>1?'s':'')+' d\'écart'))+'</em><i>+'+fmt(r.yp)+'</i></div><div><span>Lieu</span><b>'+km(r.d)+'</b><em>'+esc(p.p)+'</em><i>+'+fmt(r.lp)+'</i></div></div><button type="button" class="primary" id="tg-next">'+(last?'Score final':'Photo suivante')+'</button></div>';
    $('tg-next').onclick=function(){
      if(!last){S.ri++;soloRound();return}
      var best=PP.store('tg-best'),nb=S.score>best;if(nb){PP.store('tg-best',S.score);PP.refreshHi()}if(S.score>=35000)PP.stat('time','win');
      $('tg-res').innerHTML='<div class="tg-card final"><span class="lbl">Score final</span><div class="tg-big">'+fmt(S.score)+'<small> / 50 000</small></div><p>'+(nb?'Nouveau record !':'Record : '+fmt(Math.max(best,S.score)))+'</p><button type="button" class="primary" id="tg-again">Rejouer</button></div>';
      $('tg-again').onclick=soloNew;
    };
  }
  $('tg-ok').addEventListener('click',function(){
    if(locked||!guess)return;
    if(online){locked=true;$('tg-ok').disabled=true;$('tg-hint').textContent='Réponse envoyée, on attend les autres.';var a={ll:guess,y:year};if(net.isHost){H.ans.host=a;hostCheck()}else net.send({t:'tg-a',a:a});return}
    soloAnswer();
  });

  /* ---------- Salon ---------- */
  function hostLobby(){
    H.rounds=null;H.tot={};$('tg-round').textContent='Salon '+net.code;$('tg-score').textContent='';
    $('tg-res').innerHTML='<div class="tg-card"><p><b>'+net.players.length+' joueurs</b> · 5 photos. Chacun devine l\'année et le lieu sur son appareil, les points s\'additionnent.</p><button type="button" class="primary" id="tg-launch"'+(net.players.length<2?' disabled':'')+'>Lancer</button></div>';
    $('tg-launch').onclick=function(){H.rounds=PP.shuffle(PH.map(function(p,i){return i})).slice(0,5);H.ri=0;H.tot={};hostRound()};
  }
  function hostRound(){H.ans={};H.open=true;var i=H.rounds[H.ri];net.broadcast({t:'tg-r',r:H.ri,i:i});roundUI(H.ri,i);hostStatus()}
  function roundUI(r,i){$('tg-round').textContent='Manche '+(r+1)+' / 5';showPhoto(PH[i]);$('tg-score').textContent=''}
  function hostStatus(){$('tg-res').innerHTML='<div class="tg-card"><p>'+Object.keys(H.ans).length+' / '+net.players.length+' ont répondu.</p><button type="button" class="ghost" id="tg-force">Terminer la manche</button></div>';$('tg-force').onclick=hostReveal}
  function hostCheck(){if(!H.open)return;hostStatus();if(Object.keys(H.ans).length>=net.players.length)hostReveal()}
  function hostReveal(){
    if(!H.open)return;H.open=false;var i=H.rounds[H.ri],p=PH[i];
    var rows=net.players.map(function(pl){var a=H.ans[pl.id],r=a?result(p,a.ll,a.y):{tot:0};H.tot[pl.name]=(H.tot[pl.name]||0)+r.tot;return {name:pl.name,g:a?a.ll:null,y:a?a.y:null,d:r.d,tot:r.tot}});
    var m={t:'tg-res',i:i,rows:rows,tot:H.tot,last:H.ri===4};net.broadcast(m);showRes(m,true);
  }
  function showRes(m,isHost){
    var p=PH[m.i];sfx.play('win');reveal(p,m.rows);
    var rows=m.rows.slice().sort(function(a,b){return b.tot-a.tot});
    var h='<div class="tg-card"><div class="tg-board">'+rows.map(function(r,k){return '<div><b>'+(k+1)+'</b><span>'+esc(r.name)+'</span><em>'+(r.y==null?'pas de réponse':r.y+' · '+km(r.d))+'</em><i>+'+fmt(r.tot)+'</i></div>'}).join('')+'</div>';
    h+=isHost?'<button type="button" class="primary" id="tg-hnext">'+(m.last?'Classement final':'Photo suivante')+'</button>':'<p class="wait">L\'hôte passe à la suite</p>';
    $('tg-res').innerHTML=h+'</div>';$('tg-score').textContent=fmt(m.tot[net.me.name]||0)+' pts';
    if(isHost)$('tg-hnext').onclick=function(){if(H.ri>=4)return hostEnd();H.ri++;hostRound()};
  }
  function endHtml(tot){var r=Object.keys(tot).map(function(n){return {n:n,s:tot[n]}}).sort(function(a,b){return b.s-a.s});if(r.length&&r[0].n===net.me.name)PP.stat('time','win');return '<div class="tg-card final"><span class="lbl">Classement</span><div class="tg-board">'+r.map(function(x,k){return '<div><b>'+(k+1)+'</b><span>'+esc(x.n)+'</span><em></em><i>'+fmt(x.s)+'</i></div>'}).join('')+'</div>'}
  function hostEnd(){net.broadcast({t:'tg-end',tot:H.tot});$('tg-res').innerHTML=endHtml(H.tot)+'<button type="button" class="primary" id="tg-again">Rejouer</button></div>';$('tg-again').onclick=hostLobby}
  function listen(){
    if(sub)return;
    sub=net.on(function(m,from){
      if(PP.cur()!=='time')return;
      if(net.isHost){if(m.t==='tg-a'&&H.open&&!H.ans[from]){H.ans[from]=m.a;hostCheck()}if(m.t==='players'&&!H.rounds)hostLobby()}
      else{if(m.t==='tg-r')roundUI(m.r,m.i);if(m.t==='tg-res')showRes(m,false);if(m.t==='tg-end')$('tg-res').innerHTML=endHtml(m.tot)+'<p class="wait">L\'hôte peut relancer</p></div>'}
    });
  }
  PP.games.time={
    open:function(){if(!initMap())return;setTimeout(function(){map.resize()},60);online=net.inRoom();
      if(online){listen();if(net.isHost)hostLobby();else{$('tg-round').textContent='Salon '+net.code;$('tg-res').innerHTML='<div class="tg-card"><p class="wait">L\'hôte lance la partie</p></div>'}return}
      if(!S.rounds)soloNew();else soloRound()},
    close:function(){if(sub){sub();sub=null}}
  };
  PP._tg=function(){return {S:S,setGuess:function(g){guess=g;check()},setYear:setYear,map:function(){return map}}};
})();
