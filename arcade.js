/* Pixel Pause — moteur commun des jeux « arcade » (2D canvas ou 3D three.js), modes, overlay, records, salon. */
(function(){
  'use strict';
  var $=PP.$,sfx=PP.sfx,net=PP.net,DEF={};
  PP.arcade=function(d){DEF[d.id]=d};
  PP.arcadeRun=function(){
    (window.ARCADE_LIST||[]).forEach(function(L){var d=DEF[L.id];if(!d)return;
      var view=$('v-'+L.id),cv=$(L.id+'-cv'),ov=$(L.id+'-ov'),C={id:L.id,L:L,d:d,cv:cv,mode:L.modes[0][0],keys:{},running:false,raf:0,last:0,W:960,H:540,net:net,subs:[]};
      C.g=d.three?null:cv.getContext('2d');
      C.over=function(title,msg,btn,cb){$(L.id+'-title').textContent=title;$(L.id+'-msg').innerHTML=msg||'';var b=$(L.id+'-start');b.textContent=btn||'Jouer';b.hidden=btn===false;ov.hidden=false;C.onBtn=cb||null};
      C.hide=function(){ov.hidden=true};
      C.hud=function(h){$(L.id+'-hud').innerHTML=h};
      C.keysText=function(h){$(L.id+'-keys').innerHTML=h};
      C.best=function(k,v,low){var key='ag-'+L.id+'-'+k,b=PP.store(key);if(v==null)return b;if(!b||(low?v<b:v>b)){PP.store(key,v);return true}return false};
      C.win=function(){PP.stat(L.id,'win')};
      /* grosse annonce animée au centre (STRIKE !, +10, etc.) et tremblement d'écran */
      C.pop=function(t,col,size){var st=cv.parentNode,e=document.createElement('div');e.className='ag-pop';e.textContent=t;if(col)e.style.color=col;if(size)e.style.fontSize=size;st.appendChild(e);setTimeout(function(){e.remove()},1300)};
      C.shake=function(k){cv.classList.remove('ag-shake');void cv.offsetWidth;cv.style.setProperty('--sh',(k||6)+'px');cv.classList.add('ag-shake')};
      C.listen=function(fn){C.subs.push(net.on(function(m,from){if(PP.cur()===L.id)fn(m,from)}))};
      C.stop=function(){C.running=false};
      C.go=function(){C.hide();C.running=true;C.last=0;cancelAnimationFrame(C.raf);C.raf=requestAnimationFrame(loop)};
      function loop(t){var dt=C.last?Math.min(.05,(t-C.last)/1000):0;C.last=t;if(PP.cur()!==L.id)return;if(C.running&&d.step)d.step(C,dt);if(d.draw)d.draw(C,dt);C.raf=requestAnimationFrame(loop)}
      C.loop=function(){cancelAnimationFrame(C.raf);C.last=0;C.raf=requestAnimationFrame(loop)};
      $(L.id+'-start').addEventListener('click',function(){if(C.onBtn)C.onBtn();else{d.start(C);C.go()}});
      view.querySelectorAll('.ag-modes .mode').forEach(function(b){b.addEventListener('click',function(){
        var m=b.dataset.m;if(m==='online'&&!net.inRoom()){PP.toast('Crée ou rejoins d\'abord un salon','warn');PP.go('room');return}
        view.querySelectorAll('.ag-modes .mode').forEach(function(x){x.classList.toggle('on',x===b)});C.mode=m;C.running=false;d.setup(C);C.loop()})});
      function pt(e){var r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*C.W,(e.clientY-r.top)/r.height*C.H]}
      cv.addEventListener('pointerdown',function(e){if(d.mouse){var p=pt(e);d.mouse(C,'down',p[0],p[1],e)}});
      cv.addEventListener('pointermove',function(e){if(d.mouse){var p=pt(e);d.mouse(C,'move',p[0],p[1],e)}});
      window.addEventListener('pointerup',function(e){if(d.mouse&&PP.cur()===L.id){var p=pt(e);d.mouse(C,'up',p[0],p[1],e)}});
      document.addEventListener('keydown',function(e){if(PP.cur()!==L.id||/INPUT|TEXTAREA/.test(e.target.tagName))return;C.keys[e.code]=true;if(C.running&&/^(Arrow|Space)/.test(e.code))e.preventDefault();if(d.key&&!e.repeat)d.key(C,e.code,true,e)});
      document.addEventListener('keyup',function(e){if(PP.cur()!==L.id)return;C.keys[e.code]=false;if(d.key)d.key(C,e.code,false,e)});
      PP.games[L.id]={open:function(){var on=net.inRoom()&&L.modes.some(function(m){return m[0]==='online'});if(on){C.mode='online';view.querySelectorAll('.ag-modes .mode').forEach(function(x){x.classList.toggle('on',x.dataset.m==='online')})}d.setup(C);C.loop()},
        close:function(){C.running=false;cancelAnimationFrame(C.raf);C.subs.forEach(function(u){u()});C.subs=[];C.keys={};if(d.close)d.close(C)}};
    });
  };
  /* petits outils de dessin partagés */
  PP.ag={
    rr:function(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()},
    txt:function(g,s,x,y,size,col,align,font){g.font=(font||'400 '+size+'px Anton, Impact, sans-serif');g.fillStyle=col||'#f1ece2';g.textAlign=align||'center';g.textBaseline='middle';g.fillText(s,x,y)},
    mono:function(g,s,x,y,size,col,align){g.font='700 '+size+'px "IBM Plex Mono", monospace';g.fillStyle=col||'#f1ece2';g.textAlign=align||'center';g.textBaseline='middle';g.fillText(s,x,y)},
    three:function(C,bg){if(C.R)return;C.R=new THREE.WebGLRenderer({canvas:C.cv,antialias:true});C.R.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));C.R.setSize(960,540,false);C.R.shadowMap.enabled=true;C.R.toneMapping=THREE.ACESFilmicToneMapping;C.scene=new THREE.Scene();C.scene.background=new THREE.Color(bg||0x1a1816);C.cam=new THREE.PerspectiveCamera(50,960/540,.1,500)}
  };
})();
