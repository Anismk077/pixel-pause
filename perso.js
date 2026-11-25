/* Pixel Pause — ton perso : un personnage 3D à personnaliser (peau, cheveux, yeux, tenue, accessoire),
   gardé dans ton compte (sauvegarde immédiate), affiché dans les salons, sur l'accueil, sur ton compte et dans les jeux 3D. */
PP.perso=(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,T_=function(s){return PP.t?PP.t(s):s};
  var OPT={
    skin:['#fbe8d8','#f6dcc4','#eec3a0','#e4b48e','#d9a07a','#c98d63','#b97a52','#a3673f','#8d5634','#734328','#5e3820','#432817'],
    hair:['rase','degrade','court','meche','boucle','long','queue','tresses','afro','crete','chignon'],
    beard:['aucune','moustache','courte','bouc','longue'],
    mouth:['sourire','grand','dents','neutre','moue','o','langue'],
    motif:['uni','raye','logo','eclair','flamme','coeur'],
    botType:['jean','jogging','short'],
    back:['aucun','sac','cape','ailes'],
    hairCol:['#17120e','#3a2416','#6e4322','#b8834a','#e6cf96','#a8a29a','#e2361b','#3a6ad8','#7c46c8','#e86aa8'],
    eyes:['#3a2616','#17120e','#6b4423','#a07a3a','#2f6fd0','#7ab4e8','#3f7a3a','#6a8a5a','#5a5a66','#7c46c8','#c0392b'],
    top:['tshirt','sweat','veste','debardeur'],
    topCol:['#17120e','#f1ece2','#e2361b','#2f4f86','#3f7a3a','#d4a32a','#7c46c8','#e86aa8','#56643a','#4aa3b8'],
    botCol:['#17120e','#2a3a5a','#4a4a52','#6a5236','#56643a','#c9c1b2','#8a2a1e'],
    shoeCol:['#f1ece2','#17120e','#e2361b','#3a6ad8','#d4a32a','#3f7a3a'],
    acc:['aucun','lunettes','casquette','bandana','casque','couronne','masque'],
    accCol:['#17120e','#e2361b','#3a6ad8','#d4a32a','#f1ece2','#3f7a3a','#e86aa8']
  };
  var NAMES={rase:'Rasé',court:'Court',meche:'Mèche',long:'Long',afro:'Afro',crete:'Crête',chignon:'Chignon',tshirt:'T-shirt',sweat:'Sweat à capuche',veste:'Veste',debardeur:'Débardeur',
    aucun:'Aucun',lunettes:'Lunettes',casquette:'Casquette',bandana:'Bandana',casque:'Casque audio',couronne:'Couronne',masque:'Masque',
    degrade:'Dégradé',boucle:'Bouclé',queue:'Queue de cheval',tresses:'Tresses',aucune:'Aucune',moustache:'Moustache',courte:'Barbe courte',bouc:'Bouc',longue:'Barbe longue',
    sourire:'Sourire',grand:'Grand sourire',dents:'Dents',neutre:'Neutre',moue:'En coin',o:'Surpris',langue:'Langue',uni:'Uni',raye:'Rayé',logo:'Logo PP',eclair:'Éclair',flamme:'Flammes',coeur:'Cœur',
    jean:'Jean',jogging:'Jogging',short:'Short',sac:'Sac à dos',cape:'Cape',ailes:'Ailes'};
  var DEF={skin:'#d9a07a',hair:'court',hairCol:'#17120e',top:'sweat',topCol:'#e2361b',botCol:'#2a3a5a',shoeCol:'#f1ece2',acc:'aucun',accCol:'#17120e',eyes:'#3a2616',beard:'aucune',mouth:'sourire',motif:'uni',botType:'jean',back:'aucun'};
  /* motif imprimé sur le haut (texture dessinée) */
  var texCache={};
  function topTex(T,col,motif){var k=col+motif;if(texCache[k])return texCache[k];var c=document.createElement('canvas');c.width=512;c.height=256;var g=c.getContext('2d');
    var base=new T.Color(col),lum=base.r*.3+base.g*.55+base.b*.15,ink=lum>.55?'#17120e':'#f1ece2';g.fillStyle=col;g.fillRect(0,0,512,256);
    /* tissu : petit grain */
    for(var i=0;i<900;i++){g.fillStyle='rgba('+(lum>.5?'0,0,0':'255,255,255')+','+(Math.random()*.05)+')';g.fillRect(Math.random()*512,Math.random()*256,2,2)}
    /* l'avant du torse est au milieu de la texture (u = 0,5), le haut de la poitrine vers le haut */
    var cx=256,cy=86;g.fillStyle=ink;g.strokeStyle=ink;
    if(motif==='raye'){g.fillStyle=lum>.55?'rgba(23,18,14,.75)':'rgba(241,236,226,.8)';for(var y=30;y<256;y+=34)g.fillRect(0,y,512,12)}
    else if(motif==='logo'){g.beginPath();g.arc(cx,cy,30,0,7);g.lineWidth=6;g.stroke();g.save();g.translate(cx,cy+2);g.scale(-1,1);g.font='bold 30px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('PP',0,0);g.restore()}
    else if(motif==='eclair'){g.fillStyle='#f3c623';g.beginPath();g.moveTo(cx+8,cy-44);g.lineTo(cx-22,cy+6);g.lineTo(cx-2,cy+6);g.lineTo(cx-12,cy+46);g.lineTo(cx+24,cy-8);g.lineTo(cx+4,cy-8);g.closePath();g.fill();g.lineWidth=3;g.strokeStyle='#17120e';g.stroke()}
    else if(motif==='flamme'){var cols=['#e2361b','#f08a1c','#f3c623'];cols.forEach(function(cc,j){g.fillStyle=cc;g.beginPath();g.moveTo(0,256);for(var x=0;x<=512;x+=32){g.quadraticCurveTo(x+16,256-(120-j*30)-Math.sin(x*.07+j)*24,x+32,256-(40-j*10))}g.lineTo(512,256);g.closePath();g.fill()})}
    else if(motif==='coeur'){g.fillStyle='#e2361b';g.beginPath();g.moveTo(cx,cy+34);g.bezierCurveTo(cx-60,cy-6,cx-28,cy-48,cx,cy-18);g.bezierCurveTo(cx+28,cy-48,cx+60,cy-6,cx,cy+34);g.fill()}
    var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;texCache[k]=t;return t}
  /* cheveux : mèches dessinées (stries claires et foncées, reflet) */
  function hairTex(T,col){var k='h'+col;if(texCache[k])return texCache[k];var c=document.createElement('canvas');c.width=256;c.height=256;var g=c.getContext('2d'),b=new T.Color(col);g.fillStyle=col;g.fillRect(0,0,256,256);
    for(var i=0;i<260;i++){var x=Math.random()*256,lt=Math.random()<.5,a=.08+Math.random()*.16;g.strokeStyle=lt?'rgba(255,255,255,'+a+')':'rgba(0,0,0,'+(a*1.4)+')';g.lineWidth=1+Math.random()*2;g.beginPath();g.moveTo(x,0);var w=(Math.random()-.5)*14;g.bezierCurveTo(x+w,80,x-w,170,x+w*.5,256);g.stroke()}
    var gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.3,'rgba(255,255,255,.16)');gr.addColorStop(.42,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);
    var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;texCache[k]=t;return t}
  /* tissus : maille (pulls, t-shirts), jean (sergé en diagonale) */
  function fabTex(T,col,kind){var k='f'+kind+col;if(texCache[k])return texCache[k];var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d'),b=new T.Color(col),lum=b.r*.3+b.g*.55+b.b*.15;g.fillStyle=col;g.fillRect(0,0,128,128);
    if(kind==='jean'){for(var i=-128;i<256;i+=4){g.strokeStyle='rgba(255,255,255,'+(.05+Math.random()*.05)+')';g.lineWidth=1.2;g.beginPath();g.moveTo(i,0);g.lineTo(i+128,128);g.stroke()}for(var j=0;j<300;j++){g.fillStyle='rgba(255,255,255,'+(Math.random()*.06)+')';g.fillRect(Math.random()*128,Math.random()*128,2,1)}}
    else{for(var y=0;y<128;y+=3){g.fillStyle='rgba('+(lum>.5?'0,0,0':'255,255,255')+','+(.04+Math.random()*.03)+')';g.fillRect(0,y,128,1)}for(var j2=0;j2<400;j2++){g.fillStyle='rgba('+(lum>.5?'0,0,0':'255,255,255')+','+(Math.random()*.05)+')';g.fillRect(Math.random()*128,Math.random()*128,1,1)}}
    var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);texCache[k]=t;return t}
  /* contour noir façon dessin animé : une copie un peu plus grosse, vue de dos */
  var OUT=null;
  function outline(T,root){if(!OUT)OUT=new T.MeshBasicMaterial({color:0x17120e,side:T.BackSide});var list=[];
    root.traverse(function(o){if(o.isMesh&&!o.userData.noOut&&!(o.material&&o.material.transparent))list.push(o)});
    list.forEach(function(o){var gm=o.geometry;if(!gm.boundingSphere)gm.computeBoundingSphere();var r=gm.boundingSphere.radius*Math.max(o.scale.x,o.scale.y,o.scale.z);if(r<.045)return;
      var c=new T.Mesh(gm,OUT);c.scale.setScalar(1+.014/Math.max(.05,gm.boundingSphere.radius));c.position.copy(gm.boundingSphere.center).multiplyScalar(-(c.scale.x-1));c.userData.noOut=true;c.raycast=function(){};o.add(c)})}
  function fix(a){a=Object.assign({},DEF,a||{});Object.keys(OPT).forEach(function(k){if(OPT[k].indexOf(a[k])<0&&!/^#[0-9a-f]{6}$/i.test(a[k]))a[k]=DEF[k]});return a}
  function get(){try{var s=JSON.parse(localStorage.getItem(PP.key('perso')));if(s)return fix(s)}catch(e){}return fix()}
  function set(a){a=fix(a);try{localStorage.setItem(PP.key('perso'),JSON.stringify(a))}catch(e){}if(PP.net&&PP.net.setAvatar)PP.net.setAvatar(a);try{document.dispatchEvent(new CustomEvent('pp-perso',{detail:a}))}catch(e){}if(PP.cloud&&PP.cloud.saveSoon)PP.cloud.saveSoon()}

  /* ---------- Modèle 3D ---------- */
  function build(a){
    a=fix(a);var T=window.THREE;if(!T)return null;
    var g=new T.Group(),root=new T.Group();g.add(root);
    function M(c,r,m){return new T.MeshStandardMaterial({color:c,roughness:r==null?.75:r,metalness:m||0})}
    function shade(c,k){return new T.Color(c).multiplyScalar(k)}
    var skin=M(a.skin,.55),top=new T.MeshStandardMaterial({map:fabTex(T,a.topCol,'knit'),roughness:.88}),topD=M(shade(a.topCol,.72),.85),bot=new T.MeshStandardMaterial({map:fabTex(T,a.botCol,a.botType==='jean'?'jean':'knit'),roughness:.85}),botD=M(shade(a.botCol,.6),.8),shoe=M(a.shoeCol,.45),sole=M(0xf4f1ea,.6),
      hair=new T.MeshStandardMaterial({map:hairTex(T,a.hairCol),roughness:.55}),acc=M(a.accCol,.35,.1),white=M(0xffffff,.3),dark=new T.MeshBasicMaterial({color:0x141210}),iris=M(a.eyes,.3),lip=M(shade(a.skin,.62),.6);
    var shell=a.top==='debardeur'||a.top==='tshirt';
    function m(geo,mat,x,y,z,par){var o=new T.Mesh(geo,mat);o.position.set(x||0,y||0,z||0);o.castShadow=true;(par||root).add(o);return o}
    function lathe(pts,mat,par,y,sz){var o=m(new T.LatheGeometry(pts.map(function(p){return new T.Vector2(p[0],p[1])}),28),mat,0,y||0,0,par);o.scale.z=sz||.72;return o}
    /* jambes */
    var bt=a.botType,stripe=M(0xf1ece2,.7),laces=M(new T.Color(a.shoeCol).getHSL({}).l>.6?0x17120e:0xf1ece2,.6);
    var knees=[],legs=[-.115,.115].map(function(x,i){var l=new T.Group();l.position.set(x,.93,0);root.add(l);
      m(new T.CapsuleGeometry(.105,.28,6,14),bot,0,-.2,0,l);
      if(bt==='jean'){m(new T.BoxGeometry(.06,.07,.015),botD,x>0?.03:-.03,-.06,.1,l);m(new T.BoxGeometry(.012,.3,.012),botD,x>0?.1:-.1,-.2,0,l).userData.noOut=true}
      if(bt==='jogging'){var sp=m(new T.BoxGeometry(.012,.5,.03),stripe,x>0?.104:-.104,-.38,0,l);sp.userData.noOut=true}
      var k=new T.Group();k.position.y=-.42;l.add(k);knees.push(k);
      if(bt==='short'){m(new T.CylinderGeometry(.112,.112,.06,16),botD,0,-.02,0,k);m(new T.CapsuleGeometry(.075,.28,6,14),skin,0,-.19,0,k);m(new T.CylinderGeometry(.08,.08,.08,14),M(0xf1ece2,.8),0,-.35,0,k)}
      else{m(new T.CapsuleGeometry(.092,.28,6,14),bot,0,-.19,0,k);m(new T.CylinderGeometry(.098,.098,.05,14),bt==='jogging'?stripe:botD,0,-.34,0,k)}
      /* baskets : semelle, bout renforcé, lacets */
      var s=m(new T.SphereGeometry(.1,18,12),shoe,0,-.43,-.045,k);s.scale.set(.95,.62,1.6);var so=m(new T.CylinderGeometry(.1,.1,.03,18),sole,0,-.47,-.045,k);so.scale.set(.98,1,1.66);
      var toe=m(new T.SphereGeometry(.06,12,8,0,Math.PI*2,0,Math.PI/2),sole,0,-.455,-.15,k);toe.scale.set(1.4,.55,1);
      for(var j=0;j<3;j++){var lc=m(new T.BoxGeometry(.07,.008,.012),laces,0,-.385+j*.006,-.06-j*.03,k);lc.rotation.x=-.4;lc.userData.noOut=true}
      return l});
    /* bassin, torse */
    var torso=new T.Group();torso.position.y=1;root.add(torso);
    lathe([[0,-.12],[.19,-.12],[.225,-.02],[.215,.1],[0,.1]],bot,torso,0,.74);
    m(new T.CylinderGeometry(.218,.218,.045,24),M(0x2a241e,.5),0,.09,0,torso).scale.z=.75;
    var tp=[[0,.08],[.2,.08],[.215,.2],[.225,.36],[.25,.5],[.262,.6],[.23,.68],[.15,.73],[0,.745]];
    var printed=a.top==='veste'?top:new T.MeshStandardMaterial({map:topTex(T,a.topCol,a.motif),roughness:.85});
    lathe(tp,printed,torso,0,.7);
    if(bt!=='short'||true){var buckle=m(new T.BoxGeometry(.06,.04,.02),M(0xc9a24a,.3,.6),0,.09,-.165,torso);buckle.userData.noOut=true}
    if(a.top==='veste'){/* veste ouverte : t-shirt visible au milieu, revers de col, fermeture et poches */
      var tee=new T.MeshStandardMaterial({map:topTex(T,'#f1ece2',a.motif),roughness:.85}),met=M(0xb9b4aa,.3,.7);
      var ins=m(new T.BoxGeometry(.13,.5,.02),tee,0,.36,-.172,torso);ins.userData.noOut=true;
      [-1,1].forEach(function(s){var ed=m(new T.BoxGeometry(.018,.52,.026),topD,s*.072,.36,-.176,torso);ed.userData.noOut=true;
        var lp=m(new T.BoxGeometry(.075,.2,.02),topD,s*.085,.6,-.17,torso);lp.rotation.z=s*.42;lp.rotation.y=s*.2;
        var pc=m(new T.BoxGeometry(.085,.014,.012),topD,s*.15,.26,-.18,torso);pc.rotation.y=s*.3;pc.userData.noOut=true;
        var zp=m(new T.BoxGeometry(.008,.5,.01),met,s*.08,.36,-.19,torso);zp.userData.noOut=true});
      var zt=m(new T.BoxGeometry(.016,.032,.01),met,-.08,.5,-.198,torso);zt.userData.noOut=true;
      var col=m(new T.TorusGeometry(.11,.028,8,22,Math.PI*1.3),topD,0,.71,.01,torso);col.rotation.set(Math.PI/2,0,-Math.PI*.15+Math.PI);
      m(new T.CylinderGeometry(.205,.205,.06,22,1,true),topD,0,.1,0,torso).scale.z=.72}
    if(a.top==='debardeur'){/* bretelles et encolure */
      [-1,1].forEach(function(s){var st2=m(new T.BoxGeometry(.06,.025,.26),top,s*.13,.735,0,torso);st2.rotation.z=-s*.25;st2.userData.noOut=true});
      var nk=m(new T.TorusGeometry(.075,.012,6,18,Math.PI),topD,0,.69,-.135,torso);nk.rotation.set(-.35,0,Math.PI);nk.userData.noOut=true}
    if(a.top==='sweat'){var hood=m(new T.TorusGeometry(.155,.05,10,24),top,0,.74,.06,torso);hood.rotation.x=Math.PI/2.3;hood.scale.set(1,1,.8);
      var hin=m(new T.SphereGeometry(.15,18,10,0,Math.PI*2,0,Math.PI/2),topD,0,.76,.1,torso);hin.scale.set(1,.5,.7);hin.rotation.x=-.5;
      var pk=m(new T.BoxGeometry(.24,.12,.03),topD,0,.24,-.165,torso);pk.rotation.x=.08;
      [-1,1].forEach(function(s){m(new T.CylinderGeometry(.008,.008,.14,6),white,s*.05,.6,-.18,torso)});
      m(new T.CylinderGeometry(.205,.2,.06,22,1,true),topD,0,.11,0,torso).scale.z=.72}
    if(a.top==='tshirt'){m(new T.TorusGeometry(.085,.015,6,18),topD,0,.73,-.02,torso).rotation.x=Math.PI/2}
    m(new T.CylinderGeometry(.068,.075,.12,14),skin,0,.79,0,torso);
    /* tête */
    var head=new T.Group();head.position.set(0,1.0,0);torso.add(head);
    var sk=m(new T.SphereGeometry(.205,28,22),skin,0,0,0,head);sk.scale.set(.96,1.04,1);
    [-1,1].forEach(function(s){var e=m(new T.SphereGeometry(.045,12,10),skin,s*.195,-.005,.01,head);e.scale.set(.45,.9,.7)});
    var eyes=new T.Group();head.add(eyes);
    [-1,1].forEach(function(s){var w=m(new T.SphereGeometry(.036,16,12),white,s*.072,.015,-.175,eyes);w.scale.set(1,1.15,.55);
      m(new T.SphereGeometry(.022,14,10),iris,s*.072,.013,-.193,eyes).scale.set(1,1.1,.5);
      m(new T.SphereGeometry(.011,10,8),dark,s*.072,.013,-.2,eyes);
      m(new T.SphereGeometry(.006,8,6),new T.MeshBasicMaterial({color:0xffffff}),s*.072+.008,.022,-.205,eyes);
      var br=m(new T.CapsuleGeometry(.009,.045,4,8),hair,s*.074,.07,-.185,head);br.rotation.z=Math.PI/2+s*.12});
    m(new T.SphereGeometry(.024,12,10),skin,0,-.03,-.2,head).scale.set(1,1.1,1);
    /* joues roses */
    var blush=new T.MeshBasicMaterial({color:0xe86a6a,transparent:true,opacity:.28,depthWrite:false});[-1,1].forEach(function(s){var b=m(new T.CircleGeometry(.028,16),blush,s*.118,-.045,-.178,head);b.rotation.y=Math.PI+s*.5})
    /* bouche */
    var mt=a.mouth,mouthG=new T.Group();mouthG.position.set(0,-.078,-.19);head.add(mouthG);
    if(mt==='neutre'){var mn=m(new T.CapsuleGeometry(.006,.04,4,8),lip,0,0,0,mouthG);mn.rotation.z=Math.PI/2}
    else if(mt==='grand'){var mg=m(new T.SphereGeometry(.036,16,10,0,Math.PI*2,Math.PI/2,Math.PI/2),M(0x5a1a14,.6),0,.008,0,mouthG);mg.scale.set(1.1,.85,.4);var th=m(new T.BoxGeometry(.05,.012,.01),white,0,.002,-.012,mouthG);th.userData.noOut=true}
    else if(mt==='dents'){var md2=m(new T.SphereGeometry(.036,16,10,0,Math.PI*2,Math.PI/2,Math.PI/2),M(0x5a1a14,.6),0,.008,0,mouthG);md2.scale.set(1.15,.7,.4);var tt=m(new T.BoxGeometry(.066,.016,.012),white,0,.0,-.012,mouthG);tt.userData.noOut=true;var tb=m(new T.BoxGeometry(.04,.01,.01),white,0,-.016,-.01,mouthG);tb.userData.noOut=true}
    else if(mt==='moue'){var mm=m(new T.TorusGeometry(.03,.007,6,14,Math.PI*.6),lip,.01,.006,0,mouthG);mm.rotation.z=Math.PI*1.2}
    else if(mt==='o'){var mo2=m(new T.TorusGeometry(.016,.008,8,16),M(0x5a1a14,.6),0,-.004,0,mouthG);mo2.scale.y=1.25;var mi=m(new T.CircleGeometry(.014,14),M(0x3a0e0a,.7),0,-.004,.002,mouthG);mi.rotation.y=Math.PI;mi.scale.y=1.25}
    else{var mo=m(new T.TorusGeometry(.034,.008,6,14,Math.PI),lip,0,0,0,mouthG);mo.rotation.z=Math.PI;
      if(mt==='langue'){var tg=m(new T.SphereGeometry(.018,10,8),M(0xe2617a,.5),.008,-.03,-.005,mouthG);tg.scale.set(1,1.3,.6)}}
    /* barbe */
    var bd=a.beard,beardM=M(a.hairCol,.9);
    if(bd==='moustache'){[-1,1].forEach(function(s){var mu=m(new T.CapsuleGeometry(.012,.04,4,8),beardM,s*.026,-.055,-.198,head);mu.rotation.z=Math.PI/2+s*.35})}
    else if(bd==='courte'||bd==='longue'){var st=M(new T.Color(a.hairCol).lerp(new T.Color(a.skin),bd==='courte'?.35:0),.95),ch=m(new T.SphereGeometry(.207,24,14,Math.PI*.15,Math.PI*1.7,Math.PI*.6,Math.PI*.26),st,0,0,.004,head);ch.scale.set(.97,1.05,1.02);ch.rotation.x=-.32;ch.rotation.y=Math.PI;ch.material.side=2;
      if(bd==='longue'){var lb=m(new T.CapsuleGeometry(.07,.12,6,12),beardM,0,-.2,-.12,head);lb.scale.set(1.25,1,.7);lb.rotation.x=-.35}}
    else if(bd==='bouc'){var bc=m(new T.SphereGeometry(.03,12,10),beardM,0,-.15,-.17,head);bc.scale.set(1,1.3,.8)}
    /* cheveux */
    var hz=a.hair;
    function cap(r,cut,mat){var c=m(new T.SphereGeometry(r,26,16,0,Math.PI*2,0,Math.PI*cut),mat||hair,0,.012,.018,head);c.scale.set(.99,1.04,1.04);c.rotation.x=.42;return c}
    if(hz==='rase'){var buzz=M(new T.Color(a.hairCol).lerp(new T.Color(a.skin),.45),.95);cap(.208,.5,buzz)}
    else if(hz==='degrade'){cap(.209,.53,M(new T.Color(a.hairCol).lerp(new T.Color(a.skin),.4),.95));var tp2=m(new T.SphereGeometry(.17,20,12,0,Math.PI*2,0,Math.PI/2),hair,0,.1,.02,head);tp2.scale.set(1.08,.75,1.12);tp2.rotation.x=.25}
    else if(hz==='boucle'){cap(.216,.56);for(var q=0;q<22;q++){var th2=(q/22)*Math.PI*2,ring=q%2;var cx=Math.sin(th2)*(.17-ring*.05),cz=Math.cos(th2)*(.17-ring*.05)+.02,cy2=.12+ring*.07-(Math.cos(th2)<-.3?.04:0);m(new T.SphereGeometry(.05,10,8),hair,cx,cy2,cz,head)}}
    else if(hz==='queue'){cap(.218,.6);var pt=m(new T.CapsuleGeometry(.055,.26,6,12),hair,0,-.06,.24,head);pt.rotation.x=.45;m(new T.TorusGeometry(.04,.014,6,14),acc,0,.08,.2,head).rotation.x=1.2;var fr3=m(new T.SphereGeometry(.13,16,10),hair,0,.155,-.125,head);fr3.scale.set(1.3,.32,.6)}
    else if(hz==='tresses'){cap(.218,.6);[-1,1].forEach(function(s){for(var q=0;q<6;q++){m(new T.SphereGeometry(.035,10,8),hair,s*.16,-.04-q*.055,.06,head)}m(new T.SphereGeometry(.022,8,6),acc,s*.16,-.38,.06,head)});var fr4=m(new T.SphereGeometry(.13,16,10),hair,0,.155,-.125,head);fr4.scale.set(1.35,.34,.6)}
    else if(hz==='afro'){cap(.215,.55);[[0,.17,0],[.13,.12,.02],[-.13,.12,.02],[.08,.15,.12],[-.08,.15,.12],[0,.1,.16],[.15,.03,.08],[-.15,.03,.08],[0,.16,-.08],[.1,.17,-.05],[-.1,.17,-.05]].forEach(function(p){m(new T.SphereGeometry(.12,14,10),hair,p[0],p[1],p[2],head)})}
    else if(hz==='crete'){cap(.207,.5,M(new T.Color(a.hairCol).lerp(new T.Color(a.skin),.55),.95));for(var i=0;i<5;i++){var cn=m(new T.ConeGeometry(.05,.2-Math.abs(i-2)*.025,8),hair,0,.2-Math.abs(i-2)*.015,-.12+i*.07,head);cn.rotation.x=-.3+i*.15}}
    else{cap(.218,hz==='long'?.62:.56);
      /* frange en mèches : plusieurs pointes au lieu d'un bloc */
      var nT=a.acc==='casquette'?0:hz==='meche'?5:6;for(var f=0;f<nT;f++){var u=f/(nT-1)-.5,tf=m(new T.ConeGeometry(.048,.12,8),hair,u*.27+(hz==='meche'?.04:0),.115-Math.abs(u)*.035,-.17+Math.abs(u)*.055,head);
        tf.rotation.x=Math.PI+.42;tf.rotation.z=hz==='meche'?-.55-u*.2:u*.5;tf.scale.set(1.25,1,.6)}
      if(a.acc!=='casquette'){var fb=m(new T.SphereGeometry(.13,16,10),hair,hz==='meche'?.03:0,.175,-.1,head);fb.scale.set(1.3,.32,.7)}
      /* pattes sur les côtés */
      [-1,1].forEach(function(s){var pb=m(new T.BoxGeometry(.03,.085,.045),hair,s*.188,-.005,-.045,head);pb.rotation.z=-s*.06});
      if(hz==='meche'&&a.acc!=='casquette'){var fr2=m(new T.ConeGeometry(.05,.18,8),hair,.15,.07,-.13,head);fr2.rotation.set(Math.PI-.3,0,-.35);fr2.scale.set(1,1,.6)}
      if(hz==='long'){var bk=m(new T.CapsuleGeometry(.17,.26,8,18),hair,0,-.14,.07,head);bk.scale.set(1.18,1,.62);
        for(var q3=0;q3<5;q3++){var uu=q3/4-.5,st3=m(new T.ConeGeometry(.05,.16,8),hair,uu*.3,-.38+Math.abs(uu)*.05,.08,head);st3.rotation.x=Math.PI;st3.scale.set(1,1,.6)}
        [-1,1].forEach(function(s){var sd=m(new T.CapsuleGeometry(.05,.24,6,10),hair,s*.175,-.11,-.04,head);sd.rotation.z=s*.08;var sp2=m(new T.ConeGeometry(.045,.1,8),hair,s*.18,-.3,-.04,head);sp2.rotation.x=Math.PI})}
      if(hz==='chignon'){m(new T.SphereGeometry(.085,16,12),hair,0,.19,.13,head);m(new T.TorusGeometry(.05,.014,6,14),acc,0,.16,.1,head).rotation.x=1}}
    /* accessoires */
    var ac=a.acc;
    if(ac==='lunettes'){[-1,1].forEach(function(s){m(new T.TorusGeometry(.04,.009,8,20),acc,s*.072,.015,-.215,head);var gl=m(new T.CircleGeometry(.038,20),new T.MeshStandardMaterial({color:0x9fc4e8,transparent:true,opacity:.28,roughness:.1}),s*.072,.015,-.216,head);gl.rotation.y=Math.PI;
      var br=m(new T.BoxGeometry(.012,.012,.2),acc,s*.112,.02,-.11,head)});m(new T.BoxGeometry(.05,.01,.01),acc,0,.022,-.215,head)}
    else if(ac==='casquette'){var cq=m(new T.SphereGeometry(.225,24,14,0,Math.PI*2,0,Math.PI/2.15),acc,0,.035,.01,head);cq.scale.set(1,.95,1.04);
      var vz=m(new T.CylinderGeometry(.17,.17,.018,24,1,false,Math.PI/2,Math.PI),acc,0,.07,-.1,head);vz.scale.set(1,1,1.15);vz.rotation.x=-.14;m(new T.SphereGeometry(.02,8,6),acc,0,.25,0,head)}
    else if(ac==='bandana'){var bd=m(new T.CylinderGeometry(.212,.212,.055,26,1,true),acc,0,.085,.01,head);bd.scale.z=1.04;bd.material.side=2;[-1,1].forEach(function(s){var tl=m(new T.BoxGeometry(.05,.13,.012),acc,s*.035,.02,.23,head);tl.rotation.z=s*.35;tl.rotation.x=.3})}
    else if(ac==='casque'){var hb=m(new T.TorusGeometry(.225,.022,8,30,Math.PI),acc,0,.03,0,head);[-1,1].forEach(function(s){var cup=m(new T.CylinderGeometry(.075,.075,.05,20),acc,s*.215,-.01,0,head);cup.rotation.z=Math.PI/2;m(new T.CylinderGeometry(.06,.06,.052,20),M(0x2a241e,.6),s*.218,-.01,0,head).rotation.z=Math.PI/2})}
    else if(ac==='couronne'){var cr=M(0xd9ab2e,.25,.6);var band=m(new T.CylinderGeometry(.15,.155,.07,22,1,true),cr,0,.22,0,head);band.material.side=2;for(var j=0;j<6;j++){var a6=j/6*Math.PI*2;m(new T.ConeGeometry(.028,.09,6),cr,Math.cos(a6)*.15,.3,Math.sin(a6)*.15,head);m(new T.SphereGeometry(.014,8,6),cr,Math.cos(a6)*.15,.35,Math.sin(a6)*.15,head)}m(new T.SphereGeometry(.024,10,8),M(0xe2361b,.2,.2),0,.22,-.155,head)}
    else if(ac==='masque'){/* loup de super-héros : un anneau autour de chaque œil, un pont et l'élastique */
      [-1,1].forEach(function(s){var rg=m(new T.TorusGeometry(.056,.017,10,22),acc,s*.074,.016,-.188,head);rg.scale.set(1.1,.92,.45);rg.rotation.y=s*.18;
        var tip=m(new T.ConeGeometry(.022,.05,8),acc,s*.13,.03,-.165,head);tip.rotation.z=-s*Math.PI/2.4;tip.scale.z=.5});
      m(new T.BoxGeometry(.05,.022,.02),acc,0,.022,-.205,head);
      var el2=m(new T.CylinderGeometry(.208,.208,.022,28,1,true,Math.PI*.3,Math.PI*1.4),acc,0,.02,.005,head);el2.material.side=2}
    /* bras */
    var elbows=[],hands=[],arms=[-1,1].map(function(s){
      var sh=m(new T.SphereGeometry(.085,16,12),a.top==='debardeur'?skin:top,s*.25,.61,0,torso);sh.scale.set(1,.9,.85);
      var ar=new T.Group();ar.position.set(s*.29,.6,0);ar.rotation.z=s*.07;torso.add(ar);
      if(shell){m(new T.CapsuleGeometry(.074,.2,6,12),skin,0,-.16,0,ar);if(a.top==='tshirt'){var sl=m(new T.CylinderGeometry(.088,.098,.14,16),top,0,-.05,0,ar)}}
      else m(new T.CapsuleGeometry(.08,.2,6,12),top,0,-.16,0,ar);
      var el=new T.Group();el.position.y=-.33;ar.add(el);elbows.push(el);
      m(new T.CapsuleGeometry(shell?.064:.072,.18,6,12),shell?skin:top,0,-.13,0,el);
      if(!shell)m(new T.CylinderGeometry(.068,.068,.04,14),topD,0,-.25,0,el);
      var hd=m(new T.SphereGeometry(.068,14,12),skin,0,-.31,-.005,el);hd.scale.set(.82,1,.95);hands.push(hd);
      return ar});
    /* dans le dos : sac, cape, ailes */
    var bk2=a.back,bkM=M(a.accCol,.7);
    if(bk2==='sac'){var bag=m(new T.BoxGeometry(.34,.4,.16),bkM,0,.42,.2,torso);m(new T.BoxGeometry(.28,.14,.06),M(shade(a.accCol,.75),.7),0,.32,.29,torso);[-1,1].forEach(function(s){var sp2=m(new T.BoxGeometry(.04,.42,.03),M(shade(a.accCol,.6),.7),s*.12,.45,-.02,torso);sp2.rotation.x=.1;sp2.scale.z=6})}
    else if(bk2==='cape'){var cp=m(new T.CylinderGeometry(.26,.42,.95,20,1,true,-Math.PI*.42,Math.PI*.84),bkM,0,.22,.04,torso);cp.material.side=2;cp.rotation.y=0;cp.scale.z=.55;m(new T.TorusGeometry(.14,.025,6,16,Math.PI),M(0xd9ab2e,.3,.6),0,.7,.02,torso).rotation.x=Math.PI/2}
    else if(bk2==='ailes'){var wm=M(0xf8f6f0,.6);[-1,1].forEach(function(s){var wg=new T.Group();wg.position.set(s*.1,.5,.18);wg.rotation.y=s*.5;torso.add(wg);for(var f=0;f<4;f++){var fe=m(new T.SphereGeometry(.12,12,8),wm,s*(.12+f*.07),.08-f*.06,0,wg);fe.scale.set(1.2,.45-f*.05,.12)}wg.userData.wing=s})}
    outline(T,root);
    g.userData.parts={legs:legs,arms:arms,knees:knees,elbows:elbows,hands:hands,torso:torso,head:head,root:root,eyes:eyes};
    return g;
  }

  /* ---------- Scène 3D réutilisable (accueil, compte, éditeur) ---------- */
  var blobTex=null;
  function blob(T){if(blobTex)return blobTex;var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d'),gr=x.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(20,18,16,.42)');gr.addColorStop(1,'rgba(20,18,16,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);blobTex=new T.CanvasTexture(c);return blobTex}
  function lights(T,scene){scene.add(new T.HemisphereLight(0xffffff,0x9a8a74,1.35));var d=new T.DirectionalLight(0xfff0d8,1.7);d.position.set(2.5,4,3.5);scene.add(d);var b=new T.DirectionalLight(0xc8dcff,.8);b.position.set(-3,2.5,-2.5);scene.add(b);var f=new T.DirectionalLight(0xffffff,.35);f.position.set(0,1,5);scene.add(f)}
  /* anime un perso : respiration, regard, clignement, coucou, saut */
  function animate(md,t,st){
    var p=md.userData.parts,s=t/1000;
    var br=Math.sin(s*2.2);p.torso.position.y=1+br*.008;p.torso.scale.set(1+br*.006,1,1+br*.006);
    p.head.rotation.y=Math.sin(s*.55)*.28+(st.look||0);p.head.rotation.x=Math.sin(s*.8)*.05;
    var bl=(s%3.8)<.12?.15:1;p.eyes.scale.y=bl;p.eyes.position.y=(1-bl)*.012;
    var wv=st.wave>0?Math.min(1,st.wave/.3,(st.waveT-st.wave)/.25):0;wv=wv*wv*(3-2*wv);
    p.arms[0].rotation.z=-.07-Math.sin(s*2.2)*.02;p.arms[0].rotation.x=Math.sin(s*1.1)*.04;
    var up=wv*2.55;p.arms[1].rotation.z=.07+Math.sin(s*2.2)*.02+up;p.arms[1].rotation.x=-wv*.25;
    p.elbows[1].rotation.z=wv*(.35+Math.sin(s*14)*.45);p.elbows[0].rotation.z=0;
    /* saut : il plie les genoux, décolle en repliant les jambes, puis amortit à l'atterrissage */
    var ry=0,th=0,kn=0,au=0;st.air=0;
    if(st.jump>0){var u=1-st.jump;
      if(u<.18){var c=u/.18;ry=-.07*c;th=.45*c;kn=-.95*c;au=-.35*c}
      else if(u<.8){var k=(u-.18)/.62,h=Math.sin(k*Math.PI);ry=h*.24;th=.4*h+.1;kn=-.8*h-.2;au=-1.5*h;st.air=h}
      else{var c2=1-(u-.8)/.2;ry=-.06*c2;th=.4*c2;kn=-.85*c2;au=-.2*c2}}
    p.root.position.y=ry;p.legs.forEach(function(l){l.rotation.x=th});p.knees.forEach(function(k){k.rotation.x=kn});
    if(st.jump>0){p.arms[0].rotation.x=au;if(!(wv>0))p.arms[1].rotation.x=au;p.elbows.forEach(function(e){e.rotation.x=au*.35})}else p.elbows.forEach(function(e){e.rotation.x=0})
    if(st.walk){var w=Math.sin(s*7);p.legs[0].rotation.x=w*.45;p.legs[1].rotation.x=-w*.45;p.knees[0].rotation.x=Math.max(0,-w)*.6;p.knees[1].rotation.x=Math.max(0,w)*.6;p.arms[0].rotation.x=-w*.4;if(!(wv>0))p.arms[1].rotation.x=w*.4;p.root.position.y=Math.abs(Math.cos(s*7))*.03}
  }
  function stage(cv,opt){
    opt=opt||{};var T=window.THREE;if(!T||!cv)return null;
    var R;try{R=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true})}catch(e){return null}
    R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.12;R.outputColorSpace=T.SRGBColorSpace;
    var scene=new T.Scene(),cam=new T.PerspectiveCamera(opt.fov||28,1,.1,50);lights(T,scene);
    var sh=new T.Mesh(new T.PlaneGeometry(1.5,1.5),new T.MeshBasicMaterial({map:blob(T),transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.003;scene.add(sh);
    var md=null,yaw=opt.yaw==null?Math.PI+.35:opt.yaw,drag=null,st={wave:0,waveT:1.6,jump:0,look:0,walk:false},last=0,raf=0,alive=true,w0=0,h0=0,nextWave=2.5;
    function setA(a){if(md){scene.remove(md)}md=build(a||get());scene.add(md);md.rotation.y=yaw}
    setA(opt.perso);
    function size(){var w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return false;if(w!==w0||h!==h0){w0=w;h0=h;R.setPixelRatio(Math.min(2,window.devicePixelRatio||1));R.setSize(w,h,false);cam.aspect=w/h;
      var fit=opt.bust?{y:1.75,z:2.2,l:1.72}:{y:1.3,z:6.3,l:1.32};if(cam.aspect<.6)fit.z*=1.15;cam.position.set(0,fit.y+.12,fit.z);cam.lookAt(0,fit.l,0);cam.updateProjectionMatrix()}return true}
    function loop(t){if(!alive)return;if(!cv.isConnected){dispose();return}raf=requestAnimationFrame(loop);
      if(!cv.getClientRects().length||document.hidden)return;var dt=Math.min(.05,(t-last)/1000||0);last=t;if(!size())return;
      if(!drag){if(opt.spin)yaw+=dt*.35;else yaw+=((opt.yaw==null?Math.PI+.35:opt.yaw)+Math.sin(t/4000)*.25-yaw)*Math.min(1,dt*1.5)}
      if(opt.autoWave){nextWave-=dt;if(nextWave<=0){st.wave=st.waveT;nextWave=7+Math.random()*5}}
      if(st.wave>0)st.wave=Math.max(0,st.wave-dt);if(st.jump>0)st.jump=Math.max(0,st.jump-dt*1.6);
      st.walk=!!opt.walk;md.rotation.y=yaw;animate(md,t,st);var ai=st.air||0;sh.scale.setScalar(1-ai*.35);sh.material.opacity=1-ai*.45;R.render(scene,cam)}
    raf=requestAnimationFrame(loop);
    cv.style.touchAction='pan-y';
    cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:yaw,moved:false}});
    window.addEventListener('pointermove',function(e){if(!drag||!alive)return;var dx=e.clientX-drag.x;if(Math.abs(dx)>4)drag.moved=true;if(opt.drag!==false)yaw=drag.y+dx*.012});
    window.addEventListener('pointerup',function(){if(!drag)return;var mv=drag.moved;drag=null;if(!mv){if(opt.onClick)opt.onClick();else api.wave()}});
    function dispose(){alive=false;cancelAnimationFrame(raf);try{R.dispose()}catch(e){}}
    var api={set:setA,wave:function(){st.wave=st.waveT},jump:function(){st.jump=1},dispose:dispose,opt:opt};
    if(opt.hello)setTimeout(function(){api.wave()},500);
    return api;
  }

  /* ---------- Portrait (listes de joueurs, amis, salons) : rendu du modèle 3D, mis en cache ---------- */
  var pr=null,cache={};
  function portrait3d(a,size){
    var T=window.THREE;if(!T)return null;
    try{if(!pr){var c=document.createElement('canvas');c.width=c.height=192;var R=new T.WebGLRenderer({canvas:c,antialias:true,alpha:true,preserveDrawingBuffer:true});R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.1;R.outputColorSpace=T.SRGBColorSpace;R.setSize(192,192,false);
      var sc=new T.Scene();lights(T,sc);var cm=new T.PerspectiveCamera(24,1,.1,20);cm.position.set(.25,1.98+.12,1.55);cm.lookAt(0,1.9,0);pr={R:R,sc:sc,cm:cm,c:c}}
    }catch(e){pr=false}
    if(!pr)return null;
    var md=build(a);md.rotation.y=Math.PI+.18;pr.sc.add(md);pr.R.setClearColor(0xe8e1d3,1);pr.R.render(pr.sc,pr.cm);pr.sc.remove(md);
    md.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});
    var out=document.createElement('canvas');out.width=out.height=size*2;out.getContext('2d').drawImage(pr.c,0,0,size*2,size*2);return out;
  }
  function portrait2d(a,size){
    var c=document.createElement('canvas');c.width=c.height=size*2;var g=c.getContext('2d'),s=size*2/64;g.scale(s,s);
    g.fillStyle='#e8e1d3';g.fillRect(0,0,64,64);g.fillStyle=a.topCol;g.beginPath();g.moveTo(8,64);g.quadraticCurveTo(10,44,32,42);g.quadraticCurveTo(54,44,56,64);g.fill();
    g.fillStyle=a.skin;g.fillRect(28,36,8,8);g.beginPath();g.ellipse(32,28,13,15,0,0,7);g.fill();g.fillStyle=a.hairCol;if(a.hair!=='rase'){g.beginPath();g.ellipse(32,19,14,8,0,Math.PI,0);g.fill()}
    g.fillStyle=a.eyes;g.fillRect(26,27,3,3);g.fillRect(35,27,3,3);return c;
  }
  function portrait(a,size){a=fix(a);size=size||64;return portrait3d(a,size)||portrait2d(a,size)}
  function portraitImg(a,size,cls){a=fix(a);size=size||64;var k=JSON.stringify(a)+size;if(!cache[k]){var c=portrait(a,size);cache[k]=c.toDataURL()}
    return '<img class="'+(cls||'perso-pic')+'" alt="" src="'+cache[k]+'" width="'+size+'" height="'+size+'">'}

  /* ---------- Éditeur (page « Mon perso » et création de compte) : chaque choix est sauvegardé tout de suite ---------- */
  var GROUPS=[
    {id:'corps',n:'Visage',rows:[['skin','Peau',1],['eyes','Yeux',1],['mouth','Bouche'],['beard','Barbe']]},
    {id:'cheveux',n:'Cheveux',rows:[['hair','Coiffure'],['hairCol','Couleur (cheveux et barbe)',1]]},
    {id:'tenue',n:'Tenue',rows:[['top','Haut'],['motif','Motif'],['topCol','Couleur du haut',1],['botType','Bas'],['botCol','Couleur du bas',1],['shoeCol','Baskets',1]]},
    {id:'acc',n:'Accessoires',rows:[['acc','Sur la tête'],['back','Dans le dos'],['accCol','Couleur',1]]}
  ];
  function editor(box,o){
    o=o||{};var cur=get(),tab=o.tab||'corps',st=null;
    function row(k,label,isCol){var list=OPT[k];return '<div class="ps-row"><span class="lbl">'+esc(T_(label))+'</span><div class="ps-opts'+(isCol?' cols':'')+'">'+list.map(function(v){return isCol?'<button type="button" class="ps-sw'+(cur[k]===v?' on':'')+'" data-k="'+k+'" data-v="'+v+'" style="--c:'+v+'" aria-label="'+v+'"></button>':'<button type="button" class="ps-opt'+(cur[k]===v?' on':'')+'" data-k="'+k+'" data-v="'+v+'">'+esc(T_(NAMES[v]||v))+'</button>'}).join('')+'</div></div>'}
    function panel(){var g=GROUPS.filter(function(x){return x.id===tab})[0];return g.rows.map(function(r){return row(r[0],r[1],r[2])}).join('')}
    box.innerHTML='<div class="perso-wrap'+(o.compact?' compact':'')+'"><div class="perso-stage"><canvas class="perso-cv" aria-label="'+esc(T_('Aperçu de ton perso'))+'"></canvas><p class="muted ps-hint">'+esc(T_('Glisse pour le faire tourner, clique pour un coucou'))+'</p></div>'+
      '<div class="perso-edit"><div class="ps-tabs">'+GROUPS.map(function(g){return '<button type="button" data-tab="'+g.id+'" class="'+(g.id===tab?'on':'')+'">'+esc(T_(g.n))+'</button>'}).join('')+'</div><div class="ps-panel">'+panel()+'</div>'+
      '<div class="row ps-actions"><button type="button" class="ghost" data-rand>'+esc(T_('Au hasard'))+'</button>'+(o.doneLabel?'<button type="button" class="primary" data-done>'+esc(T_(o.doneLabel))+'</button>':'')+'<span class="ps-saved" data-saved>'+esc(T_('Sauvegardé'))+' ✓</span></div></div></div>';
    st=stage(box.querySelector('.perso-cv'),{perso:cur,hello:true});
    function saved(){var s=box.querySelector('[data-saved]');if(s){s.classList.remove('flash');void s.offsetWidth;s.classList.add('flash')}}
    function bind(){box.querySelectorAll('[data-k]').forEach(function(b){b.onclick=function(){cur[b.dataset.k]=b.dataset.v;box.querySelectorAll('[data-k="'+b.dataset.k+'"]').forEach(function(x){x.classList.toggle('on',x===b)});set(cur);if(st){st.set(cur);if(b.dataset.k==='top'||b.dataset.k==='acc')st.jump()}saved()}})}
    box.querySelectorAll('[data-tab]').forEach(function(b){b.onclick=function(){tab=b.dataset.tab;box.querySelectorAll('[data-tab]').forEach(function(x){x.classList.toggle('on',x===b)});box.querySelector('.ps-panel').innerHTML=panel();bind()}});
    box.querySelector('[data-rand]').onclick=function(){Object.keys(OPT).forEach(function(k){var l=OPT[k];cur[k]=l[Math.floor(Math.random()*l.length)]});if(Math.random()<.5)cur.acc='aucun';set(cur);if(st){st.set(cur);st.jump()}box.querySelector('.ps-panel').innerHTML=panel();bind();saved()};
    var dn=box.querySelector('[data-done]');if(dn)dn.onclick=function(){set(cur);if(o.onDone)o.onDone(cur)};
    bind();return {stage:st};
  }
  function render(){var box=$('perso-box');if(!box)return;editor(box,{doneLabel:'Terminé',onDone:function(){PP.sfx.play('win');PP.go(PP.cloud&&PP.cloud.user?'account':'menu')}})}
  PP.games.perso={open:render};
  if(PP.net&&PP.net.setAvatar)PP.net.setAvatar(get());
  return {get:get,set:set,build:build,portrait:portrait,img:portraitImg,stage:stage,editor:editor,animate:animate,DEF:DEF,OPT:OPT};
})();
