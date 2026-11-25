/* Pixel Pause — Quand et où : une photo historique, on devine l'année ET le lieu.
   5 manches, jusqu'à 10 000 points par manche (5 000 pour l'année, 5 000 pour le lieu). Solo ou en salon. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,net=PP.net,PH=(PP.TIME_PHOTOS||[]).slice(),MINY=1860,MAXY=2025;
  var map=null,mapReady=false,marker=null,pins=[],guess=null,locked=false,year=1950,sub=null,lines=[];
  
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
    var im=$('tg-img');$('tg-photo').classList.add('loading');im.onload=function(){$('tg-photo').classList.remove('loading')};im.onerror=function(){$('tg-photo').classList.remove('loading')};im.src=p.img;$('tg-photo').style.setProperty('--bg','url("'+p.img.replace(/"/g,'%22')+'")');
    locked=false;clearMap();setYear(Math.round((MINY+MAXY)/2));$('tg-res').innerHTML='';$('tg-cap').textContent='';check();$('tg-side').classList.remove('done');setTimeout(function(){map.resize()},60);
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

  /* ---------- Réglages de partie (solo et salon) ---------- */
  var CFG={n:5,from:1860,to:2025,t:0};
  try{Object.assign(CFG,JSON.parse(localStorage.getItem(PP.key('tg-cfg')))||{})}catch(e){}
  function pool(c){return PH.map(function(p,i){return i}).filter(function(i){return PH[i].y>=c.from&&PH[i].y<=c.to})}
  function opts(list,cur,fmtf){return list.map(function(v){return '<option value="'+v+'"'+(v==cur?' selected':'')+'>'+(fmtf?fmtf(v):v)+'</option>'}).join('')}
  function cfgHtml(online){
    var ys=[];for(var y=1860;y<=2020;y+=10)ys.push(y);    var to=[];for(var y2=1869;y2<2025;y2+=10)to.push(y2);to.push(2025);
    var n=pool(CFG).length;
    return '<div class="tg-card tg-cfg"><span class="lbl">'+(online?'Salon '+esc(net.code)+' · '+net.players.length+' joueur'+(net.players.length>1?'s':''):'Nouvelle partie')+'</span>'+
      '<label>Manches<select data-c="n">'+opts([3,5,8,10,15],CFG.n)+'</select></label>'+
      '<label>Période<span class="tg-two"><select data-c="from">'+opts(ys,CFG.from)+'</select><em>à</em><select data-c="to">'+opts(to,CFG.to)+'</select></span></label>'+
      '<label>Temps par photo<select data-c="t">'+opts([0,20,30,45,60,90,120],CFG.t,function(v){return v?(v<60?v+' s':(v/60)+' min'):'Illimité'})+'</select></label>'+
      '<p class="tg-avail">'+(n<CFG.n?'<b>Seulement '+n+' photos</b> dans cette période : la partie en fera '+n+'.':n+' photos possibles dans cette période.')+'</p>'+
      (online?'<p class="tg-note">Chacun joue à son rythme. À la fin, tu vois ton score et celui des autres dès qu\'ils ont fini.</p>':'')+
      '<button type="button" class="primary" id="tg-go"'+(online&&net.players.length<2||n<1?' disabled':'')+'>'+(online?'Lancer pour tout le monde':'Commencer')+'</button></div>';
  }
  function bindCfg(online,go){
    document.querySelectorAll('.tg-cfg [data-c]').forEach(function(s){s.onchange=function(){CFG[s.dataset.c]=+s.value;if(CFG.from>CFG.to){if(s.dataset.c==='from')CFG.to=Math.min(2025,CFG.from+9);else CFG.from=Math.max(1860,CFG.to-9)}
      try{localStorage.setItem(PP.key('tg-cfg'),JSON.stringify(CFG))}catch(e){}$('tg-res').innerHTML=cfgHtml(online);bindCfg(online,go)}});
    $('tg-go').onclick=go;
  }
  function idle(online){
    G=null;stopTimer();locked=true;$('tg-ok').disabled=true;$('tg-side').classList.add('cfg');$('tg-photo').classList.add('idle');var rp=PH[Math.random()*PH.length|0];$('tg-img').src=rp.img;$('tg-photo').style.setProperty('--bg','url("'+rp.img+'")');$('tg-cap').textContent='';$('tg-hint').textContent='';
    $('tg-round').textContent=online?'Salon '+net.code:'Quand et où';$('tg-score').textContent='';
    $('tg-res').innerHTML=cfgHtml(online);bindCfg(online,function(){
      var ids=PP.shuffle(pool(CFG)).slice(0,CFG.n),c={n:ids.length,from:CFG.from,to:CFG.to,t:CFG.t};if(!ids.length)return;
      if(online){B={};net.players.forEach(function(p){B[p.name]={s:0,r:0,done:false}});net.broadcast({t:'tg-go',ids:ids,cfg:c});boardSend()}
      startGame(ids,c,online)});
  }

  /* ---------- Partie : chacun à son rythme ---------- */
  var G=null,B={},tmr=null;
  function stopTimer(){if(tmr){clearInterval(tmr);tmr=null}$('tg-timer').textContent='';$('tg-timer').classList.remove('hot')}
  function startGame(ids,c,on){
    G={ids:ids,cfg:c,ri:0,score:0,online:on,res:[]};MINY=c.from;MAXY=c.to;$('tg-range').min=MINY;$('tg-range').max=MAXY;$('tg-photo').classList.remove('idle');$('tg-side').classList.remove('cfg');round();
  }
  function round(){
    $('tg-round').textContent='Manche '+(G.ri+1)+' / '+G.ids.length;$('tg-score').textContent=fmt(G.score)+' pts';showPhoto(PH[G.ids[G.ri]]);stopTimer();
    if(G.cfg.t){var end=Date.now()+G.cfg.t*1000;function tick(){var s=Math.max(0,Math.ceil((end-Date.now())/1000));$('tg-timer').textContent=s+' s';$('tg-timer').classList.toggle('hot',s<=5);if(s<=0){stopTimer();if(!locked)answer(true)}}tick();tmr=setInterval(tick,250)}
  }
  function answer(timeout){
    if(locked)return;stopTimer();var p=PH[G.ids[G.ri]],r=result(p,guess,year);G.score+=r.tot;G.res.push(r.tot);
    sfx.play(r.tot>7000?'win':'ui');$('tg-score').textContent=fmt(G.score)+' pts';reveal(p,[{g:guess,name:'toi'}]);
    var last=G.ri===G.ids.length-1;
    if(G.online)progress(G.ri+1,G.score,last);
    $('tg-res').innerHTML='<div class="tg-card">'+(timeout?'<p class="tg-late">Temps écoulé !</p>':'')+'<div class="tg-pts"><b>+'+fmt(r.tot)+'</b><span>points</span></div><div class="tg-rows"><div><span>Année</span><b>'+year+'</b><em>'+(r.dy===0?'pile !':(r.dy+' an'+(r.dy>1?'s':'')+' d\'écart'))+'</em><i>+'+fmt(r.yp)+'</i></div><div><span>Lieu</span><b>'+(r.d==null?'—':km(r.d))+'</b><em>'+esc(p.p)+'</em><i>+'+fmt(r.lp)+'</i></div></div><button type="button" class="primary" id="tg-next">'+(last?'Voir mon score':'Photo suivante')+'</button></div>';
    $('tg-next').onclick=function(){if(!last){G.ri++;round();return}finish()};
  }
  function finish(){
    var max=G.ids.length*10000,html='<div class="tg-card final"><span class="lbl">Ton score</span><div class="tg-big">'+fmt(G.score)+'<small> / '+fmt(max)+'</small></div>';
    if(!G.online){var best=PP.store('tg-best'),nb=G.cfg.n===5&&G.score>best;if(nb){PP.store('tg-best',G.score);PP.refreshHi()}if(G.score>=max*.7)PP.stat('time','win');
      html+='<p>'+(nb?'Nouveau record !':G.cfg.n===5?'Record (5 manches) : '+fmt(Math.max(best,G.score)):G.ids.length+' manches · '+G.cfg.from+'–'+G.cfg.to)+'</p><div class="row"><button type="button" class="primary" id="tg-again">Rejouer</button><button type="button" class="ghost" id="tg-set">Changer les réglages</button></div></div>';
      $('tg-res').innerHTML=html;$('tg-again').onclick=function(){startGame(PP.shuffle(pool(G.cfg)).slice(0,G.cfg.n),G.cfg,false)};$('tg-set').onclick=function(){idle(false)};return}
    html+='<span class="lbl" style="margin-top:10px;display:block">Classement</span><div class="tg-board" id="tg-live"></div>'+(net.isHost?'<button type="button" class="primary" id="tg-again">Nouvelle partie</button>':'<p class="wait">Les scores arrivent quand les autres finissent</p>')+'</div>';
    $('tg-res').innerHTML=html;drawBoard();if(net.isHost)$('tg-again').onclick=function(){idle(true)};
  }
  /* ---------- Classement en direct (l'hôte rassemble, tout le monde l'affiche) ---------- */
  function progress(r,s,done){var m={t:'tg-p',r:r,s:s,done:done};if(net.isHost)hostGot(net.me.name,m);else net.send(m)}
  function hostGot(name,m){if(!B[name])B[name]={s:0,r:0,done:false};B[name].s=m.s;B[name].r=m.r;B[name].done=!!m.done;boardSend()}
  function boardSend(){net.broadcast({t:'tg-b',b:B,n:G?G.ids.length:0});drawBoard()}
  function drawBoard(){
    var el=$('tg-live');if(!el)return;var n=G?G.ids.length:0;
    var rows=Object.keys(B).map(function(k){return {n:k,s:B[k].s,r:B[k].r,d:B[k].done}}).sort(function(a,b){return (b.d-a.d)||(b.s-a.s)});
    var fin=rows.filter(function(r){return r.d}),top=fin.length?fin.slice().sort(function(a,b){return b.s-a.s})[0]:null;
    if(fin.length===rows.length&&top&&top.n===net.me.name&&!drawBoard.won){drawBoard.won=1;PP.stat('time','win')}
    el.innerHTML=rows.map(function(r,k){return '<div class="'+(r.n===net.me.name?'me':'')+(r.d?'':' wait')+'"><b>'+(r.d?k+1:'…')+'</b><span>'+esc(r.n)+'</span><em>'+(r.d?'fini':'manche '+Math.min(n,r.r+1)+' / '+n)+'</em><i>'+(r.d?fmt(r.s):'')+'</i></div>'}).join('');
  }
  $('tg-ok').addEventListener('click',function(){if(locked||!guess||!G)return;answer(false)});

  /* ---------- Salon ---------- */
  function listen(){
    if(sub)return;
    sub=net.on(function(m,from){
      if(PP.cur()!=='time')return;
      if(net.isHost){
        if(m.t==='tg-p'){var pl=net.players.filter(function(p){return p.id===from})[0];if(pl)hostGot(pl.name,m)}
        if(m.t==='players'){if(!G)idle(true);else{net.players.forEach(function(p){if(!B[p.name])B[p.name]={s:0,r:0,done:false}});boardSend()}}
      }else{
        if(m.t==='tg-go'){B={};drawBoard.won=0;startGame(m.ids,m.cfg,true)}
        if(m.t==='tg-b'){B=m.b;drawBoard()}
      }
    });
  }
  PP.games.time={
    open:function(){if(!initMap())return;setTimeout(function(){map.resize()},60);var online=net.inRoom();
      if(online){listen();if(net.isHost){if(!G||!G.online)idle(true)}else if(!G||!G.online){G=null;$('tg-photo').classList.add('idle');$('tg-side').classList.add('cfg');locked=true;$('tg-round').textContent='Salon '+net.code;$('tg-score').textContent='';$('tg-res').innerHTML='<div class="tg-card"><p class="wait">L\'hôte règle la partie et la lance</p></div>'}return}
      if(!G||G.online)idle(false)},
    close:function(){stopTimer();if(sub){sub();sub=null}}
  };
  PP._tg=function(){return {G:function(){return G},B:function(){return B},setGuess:function(g){guess=g;check()},setYear:setYear,map:function(){return map},answer:answer}};
})();
