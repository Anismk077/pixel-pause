/* Pixel Pause — Paquet Snake : solo, duel sur le même clavier, ou 2 à 4 en ligne */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,net=PP.net,sfx=PP.sfx,parts=[],cv=$('sn-cv'),cx=cv.getContext('2d'),N=24,S=cv.width/N;
  var COLORS=['#3cff6e','#3fa9ff','#ff5fd2','#ff8a3d','#c08bff','#ffd23f','#5ff0e6'],HEADS=['#bfffd1','#c6e4ff','#ffc9f1','#ffd3b3','#e6d2ff','#fff1b0','#c8fbf7'];
  /* options de partie (solo et duel) : serpents ordi, nombre de paquets, bonus, bords, obstacles */
  var OP=Object.assign({bots:0,food:1,bonus:1,wrap:0,rocks:0},PP.store('sn-opts')||{});
  var OPDEF=[['bots','Serpents ordi',[[0,'Aucun'],[1,'1'],[2,'2'],[3,'3']]],['food','Paquets',[[1,'1'],[3,'3'],[5,'5']]],['bonus','Bonus',[[1,'Oui'],[0,'Non']]],['wrap','Bords',[[0,'Mortels'],[1,'On traverse']]],['rocks','Obstacles',[[0,'Non'],[1,'Oui']]]];
  function optsUI(){var box=$('sn-opts');if(!box){box=document.createElement('div');box.id='sn-opts';box.className='sn-opts';$('sn-start').parentNode.insertBefore(box,$('sn-start'));
      box.addEventListener('click',function(e){var b=e.target.closest('[data-o]');if(!b)return;OP[b.dataset.o]=+b.dataset.v;PP.store('sn-opts',OP);optsUI();state=makeState(mode==='solo'?1:2,null);hud();draw()})}
    box.hidden=mode==='online';box.innerHTML=OPDEF.map(function(r){return '<div class="sn-opt"><span>'+r[1]+'</span>'+r[2].map(function(v){return '<button type="button" data-o="'+r[0]+'" data-v="'+v[0]+'" class="'+(OP[r[0]]===v[0]?'on':'')+'">'+v[1]+'</button>'}).join('')+'</div>'}).join('')}
  var mode=null,state=null,timer=null,running=false,paused=false,starting=false,sub=null,speed=120;
  $('sn-best')&&($('sn-best').textContent=PP.store('sn-best'));

  /* ---------- Choix du mode ---------- */
  function open(){
    $('sn-mode').hidden=false;$('sn-game').hidden=true;
    var ob=$('sn-mode').querySelector('[data-m=online]');ob.disabled=!net.inRoom()||net.players.length<2||net.players.length>4;
    ob.querySelector('span').textContent=net.inRoom()?(ob.disabled?'Il faut 2 à 4 joueurs dans le salon':'2 à 4 dans le salon '+net.code):'Crée d\'abord un salon';
    if(net.inRoom()&&(!net.isHost||!ob.disabled))startMode('online');
    listen();
  }
  function close(){stop();if(sub){sub();sub=null}}
  $('sn-mode').addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(b&&!b.disabled)startMode(b.dataset.m)});
  $('sn-back').addEventListener('click',function(){stop();open()});

  function startMode(m){
    mode=m;$('sn-mode').hidden=true;$('sn-game').hidden=false;
    $('sn-title').textContent={solo:'Solo',duel:'Duel',online:'En ligne'}[m];
    $('sn-msg').textContent={solo:'Mange les paquets, évite les murs et ta queue. Ça accélère.',duel:'Joueur 1 : flèches · Joueur 2 : ZQSD. Le dernier en vie gagne.',online:net.isHost?'Tu lances la partie pour tout le salon.':'L\'hôte lance la partie.'}[m];
    $('sn-keys').innerHTML={solo:'<kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> ou <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> · <kbd>Espace</kbd> pause',duel:'J1 <kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> · J2 <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> · <kbd>Espace</kbd> pause',online:'<kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> ou <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd>, ou les boutons sur téléphone'}[m];
    $('sn-start').hidden=(m==='online'&&!net.isHost);$('sn-start').textContent='Jouer';
    $('sn-ov').hidden=false;
    optsUI();state=makeState(m==='solo'?1:m==='duel'?2:net.players.length,m==='online'?net.players:null);
    hud();draw();
  }

  /* ---------- État ---------- */
  function makeState(n,players){
    var spawns=[[5,5,1,0],[N-6,N-6,-1,0],[N-6,5,0,1],[5,N-6,0,-1],[12,3,1,0],[11,N-4,-1,0],[3,12,0,1]];
    var ps=[],off=!players,nb=off?OP.bots:0;
    for(var i=0;i<n+nb;i++){var s=spawns[i],bot=i>=n;ps.push({id:players?players[i].id:'p'+i,bot:bot,name:bot?'Ordi '+(i-n+1):players?players[i].name:(n===1?'Toi':'J'+(i+1)),body:[{x:s[0],y:s[1]},{x:s[0]-s[2],y:s[1]-s[3]},{x:s[0]-2*s[2],y:s[1]-2*s[3]}],dir:{x:s[2],y:s[3]},next:{x:s[2],y:s[3]},score:0,alive:true})}
    var st={ps:ps,food:[],rocks:[],over:false,msg:'',wrap:off&&!!OP.wrap,bonus:off?!!OP.bonus:false};
    if(off&&OP.rocks){for(var r=0;r<14;r++){var rx=2+Math.floor(Math.random()*(N-4)),ry=2+Math.floor(Math.random()*(N-4));if(spawns.some(function(q){return Math.abs(q[0]-rx)<4&&Math.abs(q[1]-ry)<3}))continue;st.rocks.push({x:rx,y:ry})}}
    var nf=off?OP.food:(n>1?2:1);for(var f=0;f<nf;f++)place(st);
    return st;
  }
  function place(st){
    var free;
    do{free={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}
    while(st.ps.some(function(p){return p.body.some(function(b){return b.x===free.x&&b.y===free.y})})||st.food.some(function(f){return f.x===free.x&&f.y===free.y})||(st.rocks||[]).some(function(r){return r.x===free.x&&r.y===free.y}));
    var rnd=Math.random();free.k=st.bonus?(rnd<.12?'gold':rnd<.2?'mini':''):'';st.food.push(free);
  }
  function tick(){
    if(paused||starting||!state||state.over)return;
    var st=state,heads=[];
    st.ps.forEach(function(p){if(p.alive&&p.bot)botTurn(st,p)});
    st.ps.forEach(function(p){if(!p.alive)return;p.dir=p.next;heads.push({p:p,x:p.body[0].x+p.dir.x,y:p.body[0].y+p.dir.y})});
    var dead=[];
    heads.forEach(function(h){
      if(st.wrap){h.x=(h.x+N)%N;h.y=(h.y+N)%N}
      if(h.x<0||h.y<0||h.x>=N||h.y>=N){dead.push(h.p);return}
      if((st.rocks||[]).some(function(r){return r.x===h.x&&r.y===h.y})){dead.push(h.p);return}
      st.ps.forEach(function(q){if(!q.alive)return;var body=q.body,len=body.length;
        // la queue va bouger sauf si ce serpent mange : on la compte quand même, c'est plus simple et plus sûr
        for(var i=0;i<len;i++)if(body[i].x===h.x&&body[i].y===h.y){dead.push(h.p);return}
      });
      heads.forEach(function(o){if(o!==h&&o.x===h.x&&o.y===h.y)dead.push(h.p)});
    });
    heads.forEach(function(h){
      if(dead.indexOf(h.p)>-1)return;
      h.p.body.unshift({x:h.x,y:h.y});
      var fi=-1;st.food.forEach(function(f,i){if(f.x===h.x&&f.y===h.y)fi=i});
      if(fi>-1){var fk=st.food[fi].k;st.food.splice(fi,1);h.p.score+=fk==='gold'?3:1;if(fk==='gold'){var tl=h.p.body[h.p.body.length-1];h.p.body.push({x:tl.x,y:tl.y},{x:tl.x,y:tl.y})}if(fk==='mini'&&h.p.body.length>5){h.p.body.splice(-3,3)}place(st);sfx.play('eat');burst(h.x,h.y,'#ffd23f');if(mode==='solo'&&speed>60){speed-=3;restartTimer()}}
      else h.p.body.pop();
    });
    dead.forEach(function(p){p.alive=false;sfx.play('die');burst(p.body[0].x,p.body[0].y,'#ff3b3b')});
    var hum=st.ps.filter(function(p){return !p.bot}),alive=hum.filter(function(p){return p.alive});
    if(hum.length===1){if(!alive.length)finish('Perdu ! '+st.ps[0].score+' paquet'+(st.ps[0].score>1?'s':'')+'.')}
    else if(alive.length<=1){finish(alive.length?alive[0].name+' gagne avec '+alive[0].score+' paquet'+(alive[0].score>1?'s':'')+' !':'Égalité : tout le monde s\'est planté en même temps.')}
    if(mode==='online'&&net.isHost)net.broadcast({t:'sn-s',s:pack(st)});
    hud();draw();
  }
  /* les serpents ordi : vont vers le paquet le plus proche sans se jeter dans un mur, un rocher ou un corps */
  function botTurn(st,p){var h=p.body[0],best=null,bd=1e9,opts=['L','R','U','D'].map(function(k){return D[k]}).filter(function(m){return !(m.x===-p.dir.x&&m.y===-p.dir.y)});
    function free(x,y){if(st.wrap){x=(x+N)%N;y=(y+N)%N}if(x<0||y<0||x>=N||y>=N)return false;if((st.rocks||[]).some(function(r){return r.x===x&&r.y===y}))return false;return !st.ps.some(function(q){return q.alive&&q.body.some(function(b,i){return b.x===x&&b.y===y&&i<q.body.length-1})})}
    opts.forEach(function(m){var x=h.x+m.x,y=h.y+m.y;if(!free(x,y))return;var room=0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){if(free(x+d[0],y+d[1]))room++});
      var fd=1e9;st.food.forEach(function(f){fd=Math.min(fd,Math.abs(f.x-x)+Math.abs(f.y-y))});var sc=fd-room*1.5+Math.random()*1.2;if(sc<bd){bd=sc;best=m}});
    if(best)p.next=best}
  function pack(st){return {ps:st.ps.map(function(p){return {n:p.name,b:p.body.map(function(c){return [c.x,c.y]}),s:p.score,a:p.alive}}),f:st.food.map(function(f){return [f.x,f.y]}),o:st.over,m:st.msg}}
  function unpack(d){return {ps:d.ps.map(function(p){return {name:p.n,body:p.b.map(function(c){return {x:c[0],y:c[1]}}),score:p.s,alive:p.a,dir:{x:0,y:0}}}),food:d.f.map(function(f){return {x:f[0],y:f[1]}}),over:d.o,msg:d.m}}

  function burst(x,y,c){for(var i=0;i<10;i++)parts.push({x:x*S+S/2,y:y*S+S/2,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*260,t:.5,c:c})}
  function finish(msg){
    state.over=true;state.msg=msg;stop();
    if(mode==='solo'){var sc=state.ps[0].score,best=PP.store('sn-best');if(sc>best){PP.store('sn-best',sc);PP.refreshHi();msg+=' Nouveau record !';sfx.play('win')}}
    $('sn-title').textContent='Game over';$('sn-msg').textContent=msg;$('sn-start').textContent='Rejouer';
    if(mode!=='online'||net.isHost){$('sn-ov').hidden=false;$('sn-start').focus()}
    else $('sn-ov').hidden=false;
    if(mode==='online'&&net.isHost)net.broadcast({t:'sn-end',msg:msg});
  }
  function restartTimer(){clearInterval(timer);timer=setInterval(tick,speed)}
  function start(){
    speed=mode==='solo'?120:110;
    state=makeState(mode==='solo'?1:mode==='duel'?2:net.players.length,mode==='online'?net.players:null);
    $('sn-ov').hidden=true;running=true;paused=false;starting=true;hud();draw();
    if(mode==='online'&&net.isHost)net.broadcast({t:'sn-start',s:pack(state)});
    countdown(function(){starting=false;restartTimer()});
  }
  var cdT=null;
  function countdown(done){clearTimeout(cdT);var n=3;(function tick(){draw();if(n>0){cx.fillStyle='rgba(10,10,12,.55)';cx.fillRect(0,0,cv.width,cv.height);cx.fillStyle='#ffd23f';cx.font='48px "Press Start 2P",monospace';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(n,cv.width/2,cv.height/2);sfx.play('count');n--;cdT=setTimeout(tick,700)}else{sfx.play('go');done()}})()}
  function stop(){clearInterval(timer);clearTimeout(cdT);running=false}

  /* ---------- HUD et dessin ---------- */
  function hud(){
    var h=$('sn-hud');if(!state)return;
    if(state.ps.length===1)h.innerHTML='<span>Score <b>'+state.ps[0].score+'</b></span><span>Record <b>'+PP.store('sn-best')+'</b></span>';
    else h.innerHTML=state.ps.map(function(p,i){return '<span class="p'+(i+1)+'">'+esc(p.name)+' <b>'+p.score+(p.alive?'':' ✕')+'</b></span>'}).join('');
  }
  function cell(x,y,c,pad){cx.fillStyle=c;cx.fillRect(x*S+pad,y*S+pad,S-pad*2,S-pad*2)}
  function glow(x,y,c){cx.shadowColor=c;cx.shadowBlur=10}
  function draw(){
    cx.fillStyle='#0a0a0c';cx.fillRect(0,0,cv.width,cv.height);
    cx.strokeStyle='rgba(242,239,230,.06)';cx.lineWidth=1;
    for(var i=1;i<N;i++){cx.beginPath();cx.moveTo(i*S,0);cx.lineTo(i*S,cv.height);cx.moveTo(0,i*S);cx.lineTo(cv.width,i*S);cx.stroke()}
    if(!state)return;
    var pulse=2+Math.sin(Date.now()/150)*2;(state.rocks||[]).forEach(function(r){cell(r.x,r.y,'#5a5560',2);cx.fillStyle='#7a7480';cx.fillRect(r.x*S+5,r.y*S+5,S*.35,S*.25)});state.food.forEach(function(f){cell(f.x,f.y,f.k==='gold'?'#ffb400':f.k==='mini'?'#5fc8ff':'#ffd23f',pulse);if(f.k){cx.fillStyle='#0a0a0c';cx.font='bold '+Math.round(S*.5)+'px ui-monospace,monospace';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(f.k==='gold'?'+3':'-3',f.x*S+S/2,f.y*S+S/2+1);return}cx.fillStyle='#0a0a0c';cx.font='bold '+Math.round(S*.42)+'px ui-monospace,monospace';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('01',f.x*S+S/2,f.y*S+S/2+1)});
    state.ps.forEach(function(p,i){
      var col=p.alive?COLORS[i]:'#3a3a44';
      p.body.forEach(function(c,j){cell(c.x,c.y,j?col:(p.alive?HEADS[i]:'#555'),j?3:2)});
      var h=p.body[0];cx.fillStyle='#0a0a0c';cx.beginPath();cx.arc(h.x*S+S*.35,h.y*S+S*.4,S*.08,0,7);cx.arc(h.x*S+S*.65,h.y*S+S*.4,S*.08,0,7);cx.fill();
    });
    parts.forEach(function(q){q.t-=.02;q.x+=q.vx*.02;q.y+=q.vy*.02;cx.fillStyle=q.c;cx.fillRect(q.x,q.y,5,5)});parts=parts.filter(function(q){return q.t>0});
    if(paused){cx.fillStyle='rgba(10,10,12,.6)';cx.fillRect(0,0,cv.width,cv.height);cx.fillStyle='#ffd23f';cx.font='20px "Press Start 2P",monospace';cx.textAlign='center';cx.fillText('PAUSE',cv.width/2,cv.height/2)}
  }

  /* ---------- Commandes ---------- */
  var D={L:{x:-1,y:0},R:{x:1,y:0},U:{x:0,y:-1},D:{x:0,y:1}};
  function turn(pi,d){
    if(mode==='online'&&!net.isHost){net.send({t:'sn-d',d:d});return}
    if(!state||!running)return;
    var p=pi==='me'?state.ps[0]:state.ps[pi];if(!p||!p.alive)return;
    var m=D[d];if(m&&(m.x!==-p.dir.x||m.y!==-p.dir.y))p.next=m;
  }
  document.addEventListener('keydown',function(e){
    if(PP.cur()!=='snake'||$('sn-game').hidden)return;
    var k=e.key.length===1?e.key.toLowerCase():e.key;
    var arrows={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D'}[k],zqsd={q:'L',a:'L',d:'R',z:'U',w:'U',s:'D'}[k];
    if(mode==='duel'){if(arrows)turn(0,arrows);if(zqsd)turn(1,zqsd)}
    else{var d=arrows||zqsd;if(d)turn('me',d)}
    if(arrows||zqsd)e.preventDefault();
    if(k===' '&&running&&!starting&&mode!=='online'){paused=!paused;draw();e.preventDefault()}
  });
  $('sn-pad').addEventListener('click',function(e){var b=e.target.closest('[data-d]');if(b)turn('me',b.dataset.d)});
  var t0=null;
  cv.addEventListener('touchstart',function(e){t0=e.touches[0]},{passive:true});
  cv.addEventListener('touchend',function(e){if(!t0)return;var t=e.changedTouches[0],dx=t.clientX-t0.clientX,dy=t.clientY-t0.clientY;if(Math.max(Math.abs(dx),Math.abs(dy))>24)turn('me',Math.abs(dx)>Math.abs(dy)?(dx>0?'R':'L'):(dy>0?'D':'U'));t0=null});
  $('sn-start').addEventListener('click',start);

  /* ---------- En ligne ---------- */
  function listen(){
    if(sub)return;
    sub=net.on(function(m,from){
      if(PP.cur()!=='snake')return;
      if(net.isHost){
        if(m.t==='sn-d'&&state&&running){var p=state.ps.filter(function(x){return x.id===from})[0];if(p&&p.alive){var d=D[m.d];if(d&&(d.x!==-p.dir.x||d.y!==-p.dir.y))p.next=d}}
        if(m.t==='players'&&!running)open();
      }else{
        if(m.t==='sn-start'){if($('sn-game').hidden)startMode('online');state=unpack(m.s);running=true;$('sn-ov').hidden=true;hud();draw();countdown(function(){})}
        if(m.t==='sn-s'){state=unpack(m.s);hud();draw()}
        if(m.t==='sn-end'){running=false;$('sn-title').textContent='Game over';$('sn-msg').textContent=m.msg+' L\'hôte peut relancer.';$('sn-start').hidden=true;$('sn-ov').hidden=false}
      }
    });
  }
  PP.games.snake={open:open,close:close};
})();
