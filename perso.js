/* Pixel Pause — ton perso : un personnage à personnaliser (peau, cheveux, tenue, accessoires),
   gardé dans ton compte, affiché dans les salons et utilisé dans les jeux 3D. */
PP.perso=(function(){
  'use strict';
  var $=PP.$,esc=PP.esc;
  var OPT={
    skin:['#f3d2b3','#e8b896','#c98f68','#a66a44','#7a4a2a','#4e2e1a'],
    hair:['rase','court','meche','long','afro','crete','chignon'],
    hairCol:['#141210','#3a2416','#7a4a22','#c9a05a','#e8d8a8','#9a9a9a','#e2361b','#3a6ad8','#7c46c8'],
    top:['tshirt','sweat','veste','debardeur'],
    topCol:['#141210','#f1ece2','#e2361b','#3a5a8a','#3f7a3a','#d4a32a','#7c46c8','#e86aa8','#56643a'],
    botCol:['#141210','#2a3a5a','#4a4a52','#6a5236','#56643a','#c9c1b2'],
    shoeCol:['#f1ece2','#141210','#e2361b','#3a6ad8','#d4a32a'],
    acc:['aucun','lunettes','casquette','bandana','casque','couronne','masque'],
    accCol:['#141210','#e2361b','#3a6ad8','#d4a32a','#f1ece2','#3f7a3a'],
    eyes:['#2a1c12','#3a6ad8','#3f7a3a','#7a4a22']
  };
  var NAMES={rase:'Rasé',court:'Court',meche:'Mèche',long:'Long',afro:'Afro',crete:'Crête',chignon:'Chignon',tshirt:'T-shirt',sweat:'Sweat à capuche',veste:'Veste',debardeur:'Débardeur',
    aucun:'Aucun',lunettes:'Lunettes',casquette:'Casquette',bandana:'Bandana',casque:'Casque',couronne:'Couronne',masque:'Masque'};
  var DEF={skin:'#c98f68',hair:'court',hairCol:'#141210',top:'sweat',topCol:'#e2361b',botCol:'#2a3a5a',shoeCol:'#f1ece2',acc:'aucun',accCol:'#141210',eyes:'#2a1c12'};
  function get(){try{var s=JSON.parse(localStorage.getItem(PP.key('perso')));if(s)return Object.assign({},DEF,s)}catch(e){}return Object.assign({},DEF)}
  function set(a){try{localStorage.setItem(PP.key('perso'),JSON.stringify(a))}catch(e){}if(PP.net&&PP.net.setAvatar)PP.net.setAvatar(a);document.dispatchEvent(new CustomEvent('pp-perso',{detail:a}))}

  /* ---------- Portrait 2D (listes de joueurs, salons) ---------- */
  function portrait(a,size){
    a=Object.assign({},DEF,a||{});size=size||64;var c=document.createElement('canvas');c.width=c.height=size*2;var g=c.getContext('2d'),s=size*2/64;g.scale(s,s);
    g.fillStyle='#e8e1d3';g.fillRect(0,0,64,64);
    g.fillStyle=a.topCol;g.beginPath();g.moveTo(8,64);g.quadraticCurveTo(10,44,32,42);g.quadraticCurveTo(54,44,56,64);g.fill();
    if(a.top==='sweat'){g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;g.beginPath();g.moveTo(26,46);g.lineTo(28,58);g.moveTo(38,46);g.lineTo(36,58);g.stroke()}
    if(a.top==='veste'){g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.moveTo(28,44);g.lineTo(32,64);g.lineTo(36,44);g.fill()}
    g.fillStyle=a.skin;g.fillRect(28,36,8,8);g.beginPath();g.ellipse(32,28,13,15,0,0,7);g.fill();
    g.fillStyle=a.hairCol;var h=a.hair;
    if(h==='court'||h==='meche'){g.beginPath();g.ellipse(32,19,14,8,0,Math.PI,0);g.fill();g.fillRect(18,18,28,5);if(h==='meche'){g.beginPath();g.moveTo(20,20);g.quadraticCurveTo(34,14,40,28);g.lineTo(44,20);g.fill()}}
    else if(h==='long'){g.beginPath();g.ellipse(32,20,15,10,0,Math.PI,0);g.fill();g.fillRect(17,19,6,24);g.fillRect(41,19,6,24)}
    else if(h==='afro'){g.beginPath();g.arc(32,18,17,0,7);g.fill();g.fillStyle=a.skin;g.beginPath();g.ellipse(32,30,12,12,0,0,Math.PI);g.fill()}
    else if(h==='crete'){g.fillRect(28,6,8,14)}
    else if(h==='chignon'){g.beginPath();g.ellipse(32,19,14,8,0,Math.PI,0);g.fill();g.beginPath();g.arc(32,8,6,0,7);g.fill()}
    g.fillStyle=a.eyes;g.fillRect(26,27,3,3);g.fillRect(35,27,3,3);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(29,36,6,1.5);
    g.fillStyle=a.accCol;var ac=a.acc;
    if(ac==='lunettes'){g.fillRect(23,26,8,5);g.fillRect(33,26,8,5);g.fillRect(31,27,2,2)}
    else if(ac==='casquette'){g.beginPath();g.ellipse(32,18,15,8,0,Math.PI,0);g.fill();g.fillRect(30,16,20,4)}
    else if(ac==='bandana'){g.fillRect(18,19,28,5);g.beginPath();g.moveTo(44,20);g.lineTo(52,16);g.lineTo(50,26);g.fill()}
    else if(ac==='casque'){g.beginPath();g.ellipse(32,20,16,11,0,Math.PI,0);g.fill();g.fillRect(16,19,32,4)}
    else if(ac==='couronne'){g.fillStyle='#d4a32a';g.beginPath();g.moveTo(21,16);g.lineTo(24,6);g.lineTo(28,12);g.lineTo(32,4);g.lineTo(36,12);g.lineTo(40,6);g.lineTo(43,16);g.fill()}
    else if(ac==='masque'){g.fillRect(22,32,20,8)}
    return c;
  }
  function portraitImg(a,size,cls){return '<img class="'+(cls||'perso-pic')+'" alt="" src="'+portrait(a,size).toDataURL()+'" width="'+size+'" height="'+size+'">'}

  /* ---------- Modèle 3D (aperçu et jeux 3D) ---------- */
  function build(a){
    a=Object.assign({},DEF,a||{});var T=window.THREE;if(!T)return null;
    var g=new T.Group(),root=new T.Group();g.add(root);
    function M(c,r){return new T.MeshStandardMaterial({color:c,roughness:r==null?.75:r})}
    var skin=M(a.skin,.6),top=M(a.topCol,.85),bot=M(a.botCol,.85),shoe=M(a.shoeCol,.5),hair=M(a.hairCol,.9),acc=M(a.accCol,.4),eye=new T.MeshBasicMaterial({color:a.eyes});
    function m(geo,mat,x,y,z,par){var o=new T.Mesh(geo,mat);o.position.set(x,y,z);(par||root).add(o);return o}
    var knees=[],legs=[-.13,.13].map(function(x){var l=new T.Group();l.position.set(x,.95,0);root.add(l);m(new T.CapsuleGeometry(.11,.3,4,12),bot,0,-.2,0,l);var k=new T.Group();k.position.y=-.43;l.add(k);knees.push(k);m(new T.CapsuleGeometry(.095,.3,4,12),bot,0,-.2,0,k);var sh=m(new T.SphereGeometry(.1,14,10),shoe,0,-.42,-.05,k);sh.scale.set(.85,.6,1.55);return l});
    var torso=new T.Group();torso.position.y=1;root.add(torso);
    var body=m(new T.CapsuleGeometry(.24,.4,6,16),top,0,.38,0,torso);body.scale.set(1.12,1,.72);
    if(a.top==='sweat'){var hood=m(new T.TorusGeometry(.17,.06,8,18),top,0,.74,.06,torso);hood.rotation.x=Math.PI/2.4;m(new T.BoxGeometry(.2,.12,.04),M(new T.Color(a.topCol).multiplyScalar(.75).getHex()),0,.22,-.18,torso)}
    if(a.top==='veste'){m(new T.BoxGeometry(.12,.48,.03),M(0xf1ece2),0,.4,-.18,torso)}
    m(new T.CylinderGeometry(.07,.08,.14,12),skin,0,.79,0,torso);
    var head=new T.Group();head.position.set(0,.98,0);torso.add(head);
    var sk=m(new T.SphereGeometry(.19,22,18),skin,0,0,0,head);sk.scale.set(.95,1.08,1);
    [-1,1].forEach(function(s){m(new T.SphereGeometry(.024,10,8),eye,s*.07,.02,-.175,head);m(new T.SphereGeometry(.04,10,8),skin,s*.185,0,0,head).scale.set(.5,1,.8)});
    m(new T.BoxGeometry(.04,.05,.04),skin,0,-.04,-.19,head);
    var hz=a.hair;if(hz!=='rase'){
      if(hz==='afro'){m(new T.SphereGeometry(.26,18,14),hair,0,.08,.03,head)}
      else{var cap=m(new T.SphereGeometry(.2,20,14,0,Math.PI*2,0,Math.PI/2.1),hair,0,.03,.01,head);cap.scale.set(1,1.05,1.05);
        if(hz==='meche'){var mc=m(new T.BoxGeometry(.18,.06,.12),hair,.04,.15,-.15,head);mc.rotation.z=-.3}
        if(hz==='long'){m(new T.BoxGeometry(.4,.36,.14),hair,0,-.16,.1,head)}
        if(hz==='crete'){cap.visible=false;m(new T.BoxGeometry(.06,.16,.34),hair,0,.2,.02,head)}
        if(hz==='chignon'){m(new T.SphereGeometry(.08,12,10),hair,0,.2,.12,head)}}}
    var ac=a.acc;
    if(ac==='lunettes'){[-1,1].forEach(function(s){m(new T.BoxGeometry(.09,.05,.02),acc,s*.07,.02,-.19,head)});m(new T.BoxGeometry(.05,.015,.02),acc,0,.03,-.19,head)}
    else if(ac==='casquette'){var cq=m(new T.SphereGeometry(.205,20,14,0,Math.PI*2,0,Math.PI/2.2),acc,0,.04,0,head);m(new T.BoxGeometry(.22,.025,.16),acc,0,.07,-.2,head)}
    else if(ac==='bandana'){m(new T.CylinderGeometry(.2,.2,.06,20,1,true),acc,0,.08,0,head)}
    else if(ac==='casque'){var cs=m(new T.SphereGeometry(.23,20,14,0,Math.PI*2,0,Math.PI/2),acc,0,.02,0,head);m(new T.TorusGeometry(.23,.02,6,24),acc,0,.02,0,head).rotation.x=Math.PI/2}
    else if(ac==='couronne'){var cr=M(0xd4a32a,.3);m(new T.CylinderGeometry(.14,.14,.08,16,1,true),cr,0,.23,0,head);for(var i=0;i<5;i++){var a5=i/5*Math.PI*2;m(new T.ConeGeometry(.03,.08,5),cr,Math.cos(a5)*.14,.3,Math.sin(a5)*.14,head)}}
    else if(ac==='masque'){m(new T.BoxGeometry(.24,.1,.06),acc,0,-.07,-.16,head)}
    var elbows=[],arms=[-1,1].map(function(s){var ar=new T.Group();ar.position.set(s*.34,.7,0);torso.add(ar);m(new T.CapsuleGeometry(.075,.24,4,12),a.top==='debardeur'?skin:top,0,-.17,0,ar);var el=new T.Group();el.position.y=-.36;ar.add(el);elbows.push(el);m(new T.CapsuleGeometry(.065,.22,4,12),a.top==='tshirt'||a.top==='debardeur'?skin:top,0,-.14,0,el);m(new T.SphereGeometry(.075,12,10),skin,0,-.32,0,el);return ar});
    g.userData.parts={legs:legs,arms:arms,knees:knees,elbows:elbows,torso:torso,head:head,root:root};
    return g;
  }

  /* ---------- Page « Mon perso » ---------- */
  var R=null,scene=null,cam=null,model=null,raf=0,rot=0,drag=null,cur=null;
  function preview(){
    var cv=$('perso-cv');if(!cv||!window.THREE)return;var T=window.THREE;
    if(!R){R=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.15}
    var w=cv.clientWidth||320,h=cv.clientHeight||420,dpr=Math.min(2,window.devicePixelRatio||1);R.setPixelRatio(dpr);R.setSize(w,h,false);
    scene=new T.Scene();cam=new T.PerspectiveCamera(30,w/h,.1,50);cam.position.set(0,1.25,4.2);cam.lookAt(0,1.05,0);
    scene.add(new T.HemisphereLight(0xffffff,0x8a7a66,1.4));var d=new T.DirectionalLight(0xfff1d8,1.6);d.position.set(2,4,3);scene.add(d);var b=new T.DirectionalLight(0xbfd4ff,.7);b.position.set(-3,2,-2);scene.add(b);
    var floor=new T.Mesh(new T.CircleGeometry(.9,40),new T.MeshBasicMaterial({color:0x141210,transparent:true,opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=.005;scene.add(floor);
    model=build(cur);scene.add(model);
    cancelAnimationFrame(raf);(function loop(t){if(PP.cur()!=='perso')return;rot+=drag?0:.006;model.rotation.y=rot;var p=model.userData.parts,s=Math.sin((t||0)/600);p.arms[0].rotation.z=-.08-s*.03;p.arms[1].rotation.z=.08+s*.03;p.torso.position.y=1+Math.sin((t||0)/900)*.01;p.head.rotation.y=Math.sin((t||0)/1700)*.25;R.render(scene,cam);raf=requestAnimationFrame(loop)})();
  }
  function rebuild(){if(!scene)return preview();scene.remove(model);model=build(cur);scene.add(model);var pic=$('perso-mini');if(pic)pic.src=portrait(cur,64).toDataURL()}
  function row(k,label,list,isCol){return '<div class="ps-row"><span class="lbl">'+esc(PP.t?PP.t(label):label)+'</span><div class="ps-opts'+(isCol?' cols':'')+'">'+list.map(function(v){return isCol?'<button type="button" class="ps-sw'+(cur[k]===v?' on':'')+'" data-k="'+k+'" data-v="'+v+'" style="--c:'+v+'" aria-label="'+v+'"></button>':'<button type="button" class="ps-opt'+(cur[k]===v?' on':'')+'" data-k="'+k+'" data-v="'+v+'">'+esc(PP.t?PP.t(NAMES[v]||v):(NAMES[v]||v))+'</button>'}).join('')+'</div></div>'}
  function render(){
    var box=$('perso-box');if(!box)return;cur=get();
    box.innerHTML='<div class="perso-wrap"><div class="perso-stage panel"><canvas id="perso-cv" aria-label="Aperçu de ton perso"></canvas><p class="muted">'+esc(PP.t?PP.t('Glisse pour le faire tourner'):'Glisse pour le faire tourner')+'</p></div><div class="perso-edit panel">'+
      row('skin','Peau',OPT.skin,true)+row('hair','Coiffure',OPT.hair)+row('hairCol','Couleur des cheveux',OPT.hairCol,true)+row('eyes','Yeux',OPT.eyes,true)+
      row('top','Haut',OPT.top)+row('topCol','Couleur du haut',OPT.topCol,true)+row('botCol','Pantalon',OPT.botCol,true)+row('shoeCol','Chaussures',OPT.shoeCol,true)+
      row('acc','Accessoire',OPT.acc)+row('accCol','Couleur de l\'accessoire',OPT.accCol,true)+
      '<div class="row ps-actions"><button type="button" class="primary" id="ps-save">'+esc(PP.t?PP.t('Enregistrer mon perso'):'Enregistrer mon perso')+'</button><button type="button" class="ghost" id="ps-rand">'+esc(PP.t?PP.t('Au hasard'):'Au hasard')+'</button></div><p class="muted" id="ps-msg">'+esc(PP.t?PP.t('Ton perso est gardé dans ton compte. On le voit dans les salons et il est utilisé dans les jeux 3D.'):'')+'</p></div></div>';
    box.querySelectorAll('[data-k]').forEach(function(b){b.onclick=function(){cur[b.dataset.k]=b.dataset.v;box.querySelectorAll('[data-k="'+b.dataset.k+'"]').forEach(function(x){x.classList.toggle('on',x===b)});rebuild()}});
    $('ps-save').onclick=function(){set(cur);PP.sfx.play('win');PP.toast(PP.t?PP.t('Perso enregistré'):'Perso enregistré','ok')};
    $('ps-rand').onclick=function(){Object.keys(OPT).forEach(function(k){var l=OPT[k];cur[k]=l[Math.floor(Math.random()*l.length)]});render()};
    var cv=$('perso-cv');cv.onpointerdown=function(e){drag={x:e.clientX,r:rot};cv.setPointerCapture(e.pointerId)};cv.onpointermove=function(e){if(drag)rot=drag.r+(e.clientX-drag.x)*.01};cv.onpointerup=function(){drag=null};
    if(R){try{R.dispose()}catch(e){}}R=null;scene=null;setTimeout(preview,30);
  }
  PP.games.perso={open:render,close:function(){cancelAnimationFrame(raf)}};
  if(PP.net&&PP.net.setAvatar)PP.net.setAvatar(get());
  return {get:get,set:set,build:build,portrait:portrait,img:portraitImg,DEF:DEF};
})();
