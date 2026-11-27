/* Pixel Pause — Bunker 3D (three.js)
   Modes : Zombies (solo, vagues) et Battle royale (solo contre des bots, ou en ligne façon serveur :
   les bots complètent la partie, les joueurs qui arrivent prennent part à la manche, un joueur AFK est joué par un bot).
   4 armes, recharge, visée, munitions, soins, pièces, skins, 3 cartes, mini-carte, chat en ligne. */
(function(){
  'use strict';
  var $=PP.$,esc=PP.esc,sfx=PP.sfx,net=PP.net,mp=PP.mp,cv=$('fps-cv'),T=function(s){return PP.t?PP.t(s):s};
  var S=4,WH=4,EYE=1.65,W=0,H=0,G=null,OPEN=[];

  /* ---------- Données ---------- */
  /* sight : hauteur du viseur (visée propre au centre) · grip/hg : où se posent la main droite et la main gauche · tier : couleur dans la barre d'armes */
  var GUNS={
    pistol  :{n:'Pistolet',dmg:30,rate:.26,mag:12,res:Infinity,spread:.012,auto:false,rel:1.1,pel:1,zoom:55,kick:.035,sight:.094,grip:[0,-.1,.03],hg:null,tier:0},
    magnum  :{n:'Magnum',dmg:75,rate:.48,mag:6,res:36,spread:.008,auto:false,rel:1.9,pel:1,zoom:50,kick:.11,sight:.1,grip:[0,-.1,.04],hg:null,tier:2,price:650},
    smg     :{n:'Mitraillette',dmg:18,rate:.068,mag:32,res:128,spread:.027,auto:true,rel:1.4,pel:1,zoom:54,kick:.013,sight:.098,grip:[0,-.09,.02],hg:[0,-.035,-.24],tier:1,price:500},
    rifle   :{n:'Fusil d\'assaut',dmg:25,rate:.1,mag:30,res:90,spread:.021,auto:true,rel:1.7,pel:1,zoom:46,kick:.02,sight:.1,grip:[0,-.09,.04],hg:[0,-.015,-.42],tier:1,price:900},
    shotgun :{n:'Fusil à pompe',dmg:16,rate:.75,mag:6,res:24,spread:.075,auto:false,rel:2.2,pel:9,zoom:58,kick:.09,sight:.072,grip:[0,-.1,.08],hg:[0,-.04,-.46],tier:1,price:1000},
    sniper  :{n:'Sniper',dmg:130,rate:1.15,mag:5,res:15,spread:.07,auto:false,rel:2.4,pel:1,zoom:18,kick:.12,sight:.13,grip:[0,-.09,.05],hg:[0,-.025,-.5],tier:2,price:1400},
    lmg     :{n:'Mitrailleuse',dmg:27,rate:.085,mag:80,res:160,spread:.034,auto:true,rel:3.2,pel:1,zoom:50,kick:.02,sight:.11,grip:[0,-.09,.05],hg:[0,-.04,-.5],tier:3,price:1700},
    launcher:{n:'Lance-grenades',dmg:220,rate:.95,mag:4,res:12,spread:.004,auto:false,rel:2.6,pel:1,zoom:54,kick:.15,sight:.125,grip:[0,-.1,.06],hg:[0,-.06,-.36],tier:3,boom:true,price:2200},
    minigun :{n:'Minigun',dmg:22,rate:.045,mag:150,res:300,spread:.04,auto:true,rel:4,pel:1,zoom:58,kick:.009,sight:.13,grip:[0,-.12,.1],hg:[0,-.08,-.3],tier:4,spin:true,price:3500},
    ray     :{n:'Pistolet à rayons',dmg:160,rate:.32,mag:20,res:80,spread:.004,auto:false,rel:2,pel:1,zoom:50,kick:.05,sight:.115,grip:[0,-.1,.04],hg:null,tier:4,beam:true,price:4000},
    /* v29 : deux nouvelles armes (modèle de base réutilisé, couleur à elles) */
    dmr     :{n:'Fusil tactique',dmg:58,rate:.2,mag:15,res:60,spread:.009,auto:false,rel:1.8,pel:1,zoom:36,kick:.05,sight:.1,grip:[0,-.09,.04],hg:[0,-.015,-.42],tier:2,price:1800,model:'rifle',col:0x3a4a5e},
    pdw     :{n:'Sulfateuse',dmg:20,rate:.056,mag:42,res:168,spread:.026,auto:true,rel:1.5,pel:1,zoom:52,kick:.014,sight:.098,grip:[0,-.09,.02],hg:[0,-.035,-.24],tier:2,price:1900,model:'smg',col:0x5a3a6e}
  },ORDER=['pistol','magnum','smg','rifle','shotgun','sniper','lmg','launcher','minigun','ray','dmr','pdw','rocket','revolver','carbine','hunter','autoshot','bullpup','tesla'],MAXSLOT=4,DEPS=[];
  /* v32 : lance-roquettes (roquette droite et rapide, grosse explosion) */
  GUNS.rocket={n:'Lance-roquettes',dmg:420,rate:1.4,mag:1,res:8,spread:.002,auto:false,rel:2.4,pel:1,zoom:48,kick:.2,sight:.125,grip:[0,-.1,.06],hg:[0,-.06,-.36],tier:4,boom:true,price:4500,model:'launcher',col:0x4a5a3a,rad:7,rk:1};
  /* v77 : six armes de plus */
  GUNS.revolver={n:'Revolver doré',dmg:95,rate:.55,mag:6,res:42,spread:.007,auto:false,rel:2,pel:1,zoom:50,kick:.12,sight:.1,grip:[0,-.1,.04],hg:null,tier:1,price:800,model:'magnum',col:0xc9a24a};
  GUNS.carbine={n:'Carabine',dmg:34,rate:.12,mag:25,res:100,spread:.016,auto:true,rel:1.6,pel:1,zoom:44,kick:.022,sight:.1,grip:[0,-.09,.04],hg:[0,-.015,-.42],tier:1,price:1100,model:'rifle',col:0x8a6a42};
  GUNS.hunter={n:'Fusil de chasse',dmg:95,rate:.55,mag:8,res:32,spread:.05,auto:false,rel:2.1,pel:1,zoom:28,kick:.09,sight:.13,grip:[0,-.09,.05],hg:[0,-.025,-.5],tier:2,price:1600,model:'sniper',col:0x4a5a32};
  GUNS.autoshot={n:'Pompe automatique',dmg:13,rate:.26,mag:10,res:40,spread:.085,auto:true,rel:2.4,pel:8,zoom:58,kick:.07,sight:.072,grip:[0,-.1,.08],hg:[0,-.04,-.46],tier:2,price:2400,model:'shotgun',col:0x7a2a22};
  GUNS.bullpup={n:'Fusil bullpup',dmg:31,rate:.08,mag:36,res:144,spread:.018,auto:true,rel:1.9,pel:1,zoom:44,kick:.018,sight:.1,grip:[0,-.09,.04],hg:[0,-.015,-.42],tier:3,price:2600,model:'rifle',col:0x2f3a2a};
  GUNS.tesla={n:'Fusil Tesla',dmg:42,rate:.11,mag:40,res:160,spread:.006,auto:true,rel:2.2,pel:1,zoom:50,kick:.02,sight:.115,grip:[0,-.1,.04],hg:null,tier:4,beam:true,price:4200,model:'ray',col:0x3fa9ff};
  /* v29 : boissons (stations dans la carte, 5000 chacune) et amélioration des armes à l'armurerie */
  var PK={speed:{n:'Turbo-Cola',d:'Tu cours 25 % plus vite',col:0x2fb8ff},reload:{n:'Main Leste',d:'Recharges 2× plus rapides',col:0x3fbf6a},dmg:{n:'Rage Rouge',d:'+50 % de dégâts',col:0xe2361b},hp:{n:'Carapace',d:'Vie max 200',col:0xf3c623},rate:{n:'Tir Éclair',d:'Cadence +30 %',col:0xa46cf0}},PK_ORDER=['speed','reload','dmg','hp','rate'],PK_PRICE=5000,PK_MAX=4,PERKS=[];
  /* v91 : 4 boissons max par joueur, chaque boisson bue rend les autres 1,5× plus chères */
  function pkN(){return P&&P.perks?Object.keys(P.perks).length:0}
  function pkPrice(){return Math.round(cost(PK_PRICE*Math.pow(1.5,pkN())))}
  function perkSignTxt(id){return P&&P.perks&&P.perks[id]?'DÉJÀ BUE':pkN()>=PK_MAX?'MAX 4':'E · '+pkPrice().toLocaleString('fr-FR')}
  function perkSigns(){PERKS.forEach(function(p){if(!p.g)return;var t=perkSignTxt(p.id);if(p.signT===t)return;if(p.sign){p.g.remove(p.sign);p.sign.material.map.dispose();p.sign.material.dispose()}var sg=label([PK[p.id].n.toUpperCase(),t],'#'+new THREE.Color(PK[p.id].col).getHexString());sg.position.set(0,3.25,0);sg.scale.set(2.1,.82,1);sg.raycast=function(){};p.g.add(sg);p.sign=sg;p.signT=t})}
  var UP_PRICE=[2500,5000,8000],UP_COL=[0,0x3a6ad8,0xa46cf0,0xe8b531];
  function upLv(t){return (P&&P.up&&P.up[t])||0}
  function magOf(t){return Math.round(GUNS[t].mag*(1+.3*upLv(t)))}
  function maxHp(){return P&&P.perks&&P.perks.hp?200:100}
  function autoRun(){return !(PP.settings&&PP.settings.autorun===false)}
  /* difficulté : vie, dégâts et vitesse des zombies, nombre par vague, pièces de départ, précision des bots */
  var DIFF={easy:{n:'Facile',d:'Zombies plus lents et fragiles',hp:.7,dmg:.6,sp:.9,cnt:.8,pts:800,bot:.6},normal:{n:'Normal',d:'L\'expérience prévue',hp:1,dmg:1,sp:1,cnt:1,pts:500,bot:1},
    hard:{n:'Difficile',d:'Plus nombreux, plus costauds',hp:1.35,dmg:1.3,sp:1.08,cnt:1.2,pts:400,bot:1.3},night:{n:'Cauchemar',d:'Bonne chance',hp:1.8,dmg:1.7,sp:1.18,cnt:1.45,pts:300,bot:1.6}};
  var diff=(function(){try{return localStorage.getItem(PP.key('fps-diff'))}catch(e){return null}})()||'normal';if(!DIFF[diff])diff='normal';function D(){return DIFF[diff]}
  var ZT={
    walker :{n:'Rôdeur',hp:60,sp:2.3,dmg:12,col:0x6f8f4e,sc:1},
    runner :{n:'Coureur',hp:35,sp:4.6,dmg:8,col:0xa0563c,sc:.9},
    crawler:{n:'Rampant',hp:45,sp:2.7,dmg:9,col:0x6f8f4e,sc:.95},
    tank   :{n:'Mastodonte',hp:340,sp:1.5,dmg:30,col:0x3f5a36,sc:1.55},
    spitter:{n:'Cracheur',hp:55,sp:2,dmg:10,col:0x7a4fa0,sc:1},
    exploder:{n:'Kamikaze',hp:50,sp:3.5,dmg:0,col:0xd86a1c,sc:1},
    brute  :{n:'Brute',hp:1500,sp:1.9,dmg:42,col:0x3a3030,sc:1.95},
    /* v29 : nouveaux zombies */
    armored:{n:'Blindé',hp:190,sp:2.1,dmg:16,col:0x4a5260,sc:1.08},
    ghoul  :{n:'Goule',hp:40,sp:5.8,dmg:7,col:0x8a8a9a,sc:.86}
  };
  var ZR={walker:.55,runner:.5,crawler:.8,tank:.95,spitter:.6,exploder:.62,brute:1.25,armored:.6,ghoul:.5};
  var CH_SKINS=[{n:'Commando',c:0x56643a,p:0},{n:'Urbain',c:0x3a3f4a,p:0},{n:'Désert',c:0xb89a6a,p:30},{n:'Neige',c:0xe6ebf0,p:60},{n:'Néon',c:0xe2361b,p:120},{n:'Or',c:0xd4a32a,p:250}];
  var GUN_SKINS=[{n:'Acier',c:0x2b2b30,p:0},{n:'Sable',c:0x9c8659,p:0},{n:'Camo',c:0x4f5d33,p:40},{n:'Rouge',c:0xc22d16,p:80},{n:'Glace',c:0x9fd0e6,p:120},{n:'Or',c:0xd4a32a,p:200}];
  var MAPS={bunker:'Bunker',entrepot:'Entrepôt',village:'Village',ville:'Centre-ville'};
  var skins=(function(){try{var s=JSON.parse(localStorage.getItem(PP.key('fps-skins')));if(s&&s.owned)return s}catch(e){}return {owned:['c0','c1','g0','g1'],ch:0,gun:0}})();
  function saveSkins(){try{localStorage.setItem(PP.key('fps-skins'),JSON.stringify(skins))}catch(e){}}
  function coins(v){if(v===undefined)return PP.store('fps-coins');PP.store('fps-coins',v)}

  /* ---------- Sons du Bunker (WebAudio) : tirs par arme avec écho de la salle, recharges, pas,
     voix des zombies placées à gauche ou à droite selon d'où ils viennent, explosions, achats, portes ---------- */
  var A=(function(){
    var ctx=null,out=null,verb=null,wet=null,nb=null;
    function ok(){
      if(sfx.muted)return false;
      if(!ctx){try{ctx=new (window.AudioContext||window.webkitAudioContext)();out=ctx.createGain();out.connect(ctx.destination);
        verb=ctx.createConvolver();var len=Math.floor(ctx.sampleRate*1.5),ir=ctx.createBuffer(2,len,ctx.sampleRate);for(var c=0;c<2;c++){var d=ir.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.4)}verb.buffer=ir;wet=ctx.createGain();verb.connect(wet);wet.connect(out);
        nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);var nd=nb.getChannelData(0);for(var j=0;j<nd.length;j++)nd[j]=Math.random()*2-1}catch(e){ctx=null}}
      if(!ctx)return false;if(ctx.state==='suspended')ctx.resume();
      out.gain.value=.5*((PP.settings&&PP.settings.vol!=null?PP.settings.vol:80)/80);wet.gain.value=world0==='village'||world0==='ville'?.07:.26;return true}
    function dest(pan,vol,rv){var g=ctx.createGain();g.gain.value=vol;var p=ctx.createStereoPanner?ctx.createStereoPanner():null;if(p){p.pan.value=Math.max(-1,Math.min(1,pan||0));g.connect(p);p.connect(out);if(rv)p.connect(verb)}else{g.connect(out);if(rv)g.connect(verb)}return g}
    function nz(t,dur,vol,type,f,q,to,att,f2){var s=ctx.createBufferSource();s.buffer=nb;var fl=ctx.createBiquadFilter();fl.type=type||'lowpass';fl.frequency.setValueAtTime(f||1000,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);if(q)fl.Q.value=q;var g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(att||.002));g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(to);s.start(t,Math.random()*1.4);s.stop(t+dur+.05)}
    function os(t,type,f0,f1,dur,vol,to,att){var o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(att||.003));g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(to);o.start(t);o.stop(t+dur+.05);return o}
    function T(){return ctx.currentTime}
    function place(x,z,maxD){if(!P)return {pan:0,v:1,d:0};var dx=x-P.x,dz=z-P.z,d=Math.hypot(dx,dz)||1,pan=(dx*Math.cos(P.yaw)-dz*Math.sin(P.yaw))/d;return {pan:pan*.85,v:Math.pow(Math.max(0,1-d/(maxD||34)),1.4),d:d}}
    var SH={pistol:{c:[.8,3200,.06],b:[180,60,.12,.65],t:[.28,.22,900]},magnum:{c:[1,2300,.1],b:[110,38,.24,1],t:[.6,.45,650]},smg:{c:[.65,3800,.045],b:[210,80,.07,.45],t:[.18,.16,1100]},
      rifle:{c:[.85,2800,.06],b:[150,50,.13,.8],t:[.34,.3,850]},shotgun:{c:[1,1700,.13],b:[85,32,.3,1],t:[.6,.5,560]},sniper:{c:[1,3000,.11],b:[105,28,.32,1],t:[1,.5,650]},
      lmg:{c:[.85,2500,.07],b:[130,45,.15,.9],t:[.36,.32,780]},minigun:{c:[.55,3400,.04],b:[170,70,.06,.5],t:[.14,.16,1000]},ray:{c:[.2,4000,.03],b:[900,120,.3,.35],t:[.4,.15,2000]},launcher:{c:[.35,900,.1],b:[70,30,.25,.9],t:[.3,.2,480]}};
    function voice(x,z,f0,f1,dur,vol,rough){var pl=place(x,z,36);if(pl.v<=.01)return;var t=T(),g=dest(pl.pan,vol*pl.v,true),f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=650+Math.random()*200;f.Q.value=3;f.connect(g);
      var f2=ctx.createBiquadFilter();f2.type='bandpass';f2.frequency.value=1150+Math.random()*300;f2.Q.value=5;f2.connect(g);
      var o=ctx.createOscillator(),env=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(.9,t+.08);env.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(env);env.connect(f);env.connect(f2);o.start(t);o.stop(t+dur+.05);var l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=5+Math.random()*4;lg.gain.value=f0*(rough||.08);l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+.05);
      nz(t,dur*.9,.35,'bandpass',900,1.2,g,.1)}
    return {
      shot:function(k){if(!ok())return;var p=SH[k]||SH.pistol,t=T(),d=dest(0,1,true);nz(t,p.c[2],p.c[0],'bandpass',p.c[1],.8,d);nz(t,p.b[2],p.b[3]*.8,'lowpass',420,0,d);os(t,'sine',p.b[0],p.b[1],p.b[2],p.b[3],d);nz(t+.008,p.t[0],p.t[1],'lowpass',p.t[2],0,d,.012);os(t+.03,'square',2400,1900,.018,.04,d);
        if(k==='shotgun'){nz(t+.42,.05,.4,'bandpass',1500,1,d);nz(t+.55,.06,.45,'bandpass',1100,1,d)}if(k==='sniper'){nz(t+.5,.05,.35,'bandpass',2200,1,d);nz(t+.68,.05,.35,'bandpass',1600,1,d)}if(k==='launcher')os(t,'sine',240,90,.2,.4,d);if(k==='ray'){os(t,'square',2200,220,.32,.14,d);os(t,'sawtooth',1400,300,.25,.12,d)}},
      dry:function(){if(!ok())return;var t=T(),d=dest(0,.6);nz(t,.03,.6,'bandpass',3500,2,d);os(t,'square',1500,1200,.02,.08,d)},
      rel:function(n){if(!ok())return;var t=T(),d=dest(.15,.7);if(n===0)nz(t,.14,.18,'bandpass',2000,.8,d,.03);else if(n===1){nz(t,.03,.55,'bandpass',3000,2,d);os(t,'square',900,700,.04,.08,d)}else if(n===2){nz(t,.06,.8,'lowpass',1300,0,d);nz(t+.03,.025,.5,'bandpass',3200,2,d)}else if(n===3){nz(t,.035,.6,'bandpass',2600,2,d);nz(t+.07,.035,.6,'bandpass',1900,2,d)}else nz(t,.045,.45,'bandpass',1800,1.5,d)},
      draw:function(){if(!ok())return;var t=T(),d=dest(.1,.5);nz(t,.12,.2,'bandpass',1600,.7,d,.04);nz(t+.1,.03,.4,'bandpass',2800,2,d)},
      hit:function(h){if(!ok())return;var t=T(),d=dest(0,.55);nz(t,.07,.6,'lowpass',650,0,d);if(h)os(t,'sine',2300,2100,.07,.18,d)},
      kill:function(h){if(!ok())return;var t=T(),d=dest(0,.6);nz(t,.16,.7,'lowpass',320,0,d);os(t,'sine',140,60,.15,.4,d);if(h){nz(t,.09,.6,'bandpass',1300,1.2,d);os(t+.02,'sine',1760,1760,.12,.16,d)}},
      zdie:function(e){if(!ok())return;voice(e.x,e.z,(e.type==='brute'?70:e.type==='runner'?170:110),(e.type==='brute'?35:55),e.type==='brute'?1.4:.7,.55,.12)},
      groan:function(e){if(!ok())return;var ty=e.type;if(ty==='exploder'){var pl=place(e.x,e.z,30);if(pl.v>.01){var d=dest(pl.pan,.35*pl.v,true);nz(T(),.9,.5,'highpass',3200,0,d,.2)}return}
        var b={walker:[95,75,1.1],runner:[175,120,.55],crawler:[125,90,.9],tank:[70,52,1.4],spitter:[135,90,1],brute:[55,45,1.8]}[ty]||[95,75,1];voice(e.x,e.z,b[0]*(.9+Math.random()*.2),b[1],b[2],ty==='brute'?.9:.42,ty==='spitter'?.25:.09)},
      roar:function(e){if(!ok())return;voice(e.x,e.z,65,40,1.6,1.2,.15);var pl=place(e.x,e.z,40);var d=dest(pl.pan,pl.v,true);nz(T(),1.4,.6,'lowpass',500,0,d,.1)},
      swipe:function(e){if(!ok())return;var pl=place(e.x,e.z,12),d=dest(pl.pan,.5*pl.v);nz(T(),.2,.6,'bandpass',700,1.5,d,.05,2600)},
      fuse:function(e){if(!ok())return;var pl=place(e.x,e.z,20),d=dest(pl.pan,.6*Math.max(.3,pl.v)),t=T();for(var i=0;i<5;i++)os(t+i*.13*(1-i*.12),'sine',1300+i*120,0,.06,.4,d);nz(t,.7,.3,'highpass',2500,0,d,.1)},
      zap:function(dist){if(!ok())return;var v=Math.max(.15,1-dist/50),t=T(),d=dest(0,v*.7,true);os(t,'sine',600,80,.35,.5,d);nz(t,.3,.4,'bandpass',2600,1,d,.005,600)},
      tick:function(f){if(!ok())return;var d=dest(0,.5);os(T(),'square',f||880,f||880,.12,.25,d)},
      boom:function(dist){if(!ok())return;var v=Math.max(.15,1-dist/60),t=T(),d=dest(0,v,true);os(t,'sine',70,24,1.1,1,d);nz(t,1.3,.9,'lowpass',700,0,d,.005,120);nz(t,.35,.6,'lowpass',3200,0,d);nz(t+.05,1.6,.25,'lowpass',260,0,d,.2)},
      hurt:function(){if(!ok())return;var t=T(),d=dest(0,.7);nz(t,.2,.8,'lowpass',220,0,d);os(t,'sine',95,48,.25,.5,d);if(P&&P.hp<35){os(t+.25,'sine',60,50,.12,.5,d);os(t+.5,'sine',60,50,.12,.4,d)}},
      armor:function(){if(!ok())return;var t=T(),d=dest(0,.45);os(t,'triangle',1450,1250,.14,.25,d);nz(t,.06,.3,'highpass',4200,0,d)},
      pick:function(){if(!ok())return;var t=T(),d=dest(0,.4);nz(t,.05,.4,'bandpass',2200,1.5,d);os(t+.03,'sine',880,880,.08,.25,d);os(t+.09,'sine',1320,1320,.1,.22,d)},
      coin:function(){if(!ok())return;var t=T(),d=dest(0,.4);os(t,'sine',1568,1568,.07,.3,d);os(t+.07,'sine',2093,2093,.22,.3,d)},
      gulp:function(){if(!ok())return;var t=T(),d=dest(0,.5,false);nz(t,.05,.5,'bandpass',2200,3,d);for(var i=0;i<4;i++){os(t+.35+i*.2,'sine',300,110,.13,.32,d);nz(t+.35+i*.2,.09,.18,'lowpass',420,1,d)}os(t+1.3,'triangle',520,1040,.25,.18,d)},
      buy:function(){if(!ok())return;var t=T(),d=dest(0,.5,true);nz(t,.06,.5,'bandpass',2600,2,d);[1318,1760,2637].forEach(function(f,i){os(t+.05+i*.06,'sine',f,f,.35,.22,d)})},
      deny:function(){if(!ok())return;var t=T(),d=dest(0,.45);os(t,'square',140,130,.22,.25,d);os(t+.25,'square',120,110,.22,.25,d)},
      door:function(){if(!ok())return;var t=T(),d=dest(0,.7,true);os(t,'sawtooth',48,85,1,.18,d,.1);nz(t,1,.5,'lowpass',320,0,d,.1);nz(t+.9,.14,.8,'bandpass',900,1.2,d);os(t+.9,'sine',120,60,.2,.4,d)},
      slide:function(){if(!ok())return;var t=T(),d=dest(0,.55);nz(t,.55,.5,'bandpass',1400,.9,d,.02,500)},
      step:function(spd,st){if(!ok())return;var t=T(),d=dest((Math.random()-.5)*.2,.12+Math.min(.12,spd*.012));if(st==='village')nz(t,.09,.6,'bandpass',1800+Math.random()*600,.9,d,.005);else{nz(t,.06,.7,'lowpass',500+Math.random()*250,0,d);nz(t,.03,.3,'bandpass',3200,2,d)}},
      jump:function(){if(!ok())return;var d=dest(0,.25);nz(T(),.1,.4,'lowpass',600,0,d)},
      land:function(){if(!ok())return;var d=dest(0,.5);nz(T(),.13,.7,'lowpass',260,0,d)},
      wave:function(){if(!ok())return;var t=T(),d=dest(0,.35,true);os(t,'triangle',110,104,1.8,.6,d,.35);os(t,'triangle',164.8,156,1.8,.45,d,.35);os(t+.9,'triangle',82,78,1.4,.4,d,.2)},
      ui:function(){sfx.play('ui')}
    };
  })();

  /* ---------- Cartes ---------- */
  function rng(seed){return function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
  function genMap(style,seed){
    var R=rng(seed||1),g=[],w,h,x,y;
    function fill(c){g=[];for(y=0;y<h;y++){g.push([]);for(x=0;x<w;x++)g[y].push(c)}}
    function rect(x0,y0,x1,y1,c){for(var yy=y0;yy<=y1;yy++)for(var xx=x0;xx<=x1;xx++)if(g[yy]&&g[yy][xx]!==undefined)g[yy][xx]=c}
    if(style==='bunker'){
      w=h=27;fill('#');var rooms=[];
      for(var ry=0;ry<3;ry++)for(var rx=0;rx<3;rx++){var rw=4+Math.floor(R()*3),rh=4+Math.floor(R()*3),ox=1+rx*9+Math.floor(R()*(8-rw)),oy=1+ry*9+Math.floor(R()*(8-rh));rect(ox,oy,ox+rw-1,oy+rh-1,'.');rooms.push({cx:ox+(rw>>1),cy:oy+(rh>>1),x:ox,y:oy,w:rw,h:rh})}
      function cor(a,b){var x0=a.cx,y0=a.cy;while(x0!==b.cx){rect(x0,y0,x0,y0+1,'.');x0+=x0<b.cx?1:-1}while(y0!==b.cy){rect(x0,y0,x0+1,y0,'.');y0+=y0<b.cy?1:-1}}
      for(var i=0;i<9;i++){if(i%3<2)cor(rooms[i],rooms[i+1]);if(i<6)cor(rooms[i],rooms[i+3])}
      cor(rooms[0],rooms[4]);cor(rooms[8],rooms[4]);
      rooms.forEach(function(r){if(R()<.7){var cx=r.x+1+Math.floor(R()*(r.w-2)),cy=r.y+1+Math.floor(R()*(r.h-2));if(cx!==r.cx&&cy!==r.cy)g[cy][cx]='c'}});
    }else if(style==='entrepot'){
      w=h=28;fill('.');rect(0,0,w-1,0,'#');rect(0,h-1,w-1,h-1,'#');rect(0,0,0,h-1,'#');rect(w-1,0,w-1,h-1,'#');
      for(var sy=4;sy<h-3;sy+=5)for(var sx=3;sx<w-3;sx++){if((sx-3)%8<5)g[sy][sx]='c'}
      for(var k=0;k<18;k++){var px=2+Math.floor(R()*(w-4)),py=2+Math.floor(R()*(h-4));if(g[py][px]==='.'&&g[py-1][px]!=='c'&&g[py+1][px]!=='c')g[py][px]=R()<.25?'#':'c'}
    }else{
      w=h=36;fill('.');rect(0,0,w-1,0,'#');rect(0,h-1,w-1,h-1,'#');rect(0,0,0,h-1,'#');rect(w-1,0,w-1,h-1,'#');
      var houses=[];
      for(var t=0;t<60&&houses.length<9;t++){
        var hw=4+Math.floor(R()*3),hh=4+Math.floor(R()*3),hx=2+Math.floor(R()*(w-hw-4)),hy=2+Math.floor(R()*(h-hh-4));
        if(houses.some(function(o){return hx<o.x+o.w+2&&hx+hw+2>o.x&&hy<o.y+o.h+2&&hy+hh+2>o.y}))continue;
        houses.push({x:hx,y:hy,w:hw,h:hh});
        rect(hx,hy,hx+hw-1,hy,'#');rect(hx,hy+hh-1,hx+hw-1,hy+hh-1,'#');rect(hx,hy,hx,hy+hh-1,'#');rect(hx+hw-1,hy,hx+hw-1,hy+hh-1,'#');
        g[hy+hh-1][hx+(hw>>1)]='.';g[hy+(hh>>1)][R()<.5?hx:hx+hw-1]='.';
        if(R()<.6)g[hy+1][hx+1]='c';
      }
      for(var tr=0;tr<45;tr++){var tx=1+Math.floor(R()*(w-2)),ty=1+Math.floor(R()*(h-2));if(g[ty][tx]==='.'&&!houses.some(function(o){return tx>=o.x-1&&tx<=o.x+o.w&&ty>=o.y-1&&ty<=o.y+o.h}))g[ty][tx]='t'}
      for(var cr=0;cr<10;cr++){var qx=2+Math.floor(R()*(w-4)),qy=2+Math.floor(R()*(h-4));if(g[qy][qx]==='.')g[qy][qx]='c'}
    }
    // garde seulement la zone accessible
    var start=null;for(y=1;y<h-1&&!start;y++)for(x=1;x<w-1;x++)if(g[y][x]==='.'){start=[x,y];break}
    var seen={},q=[start];seen[start]=1;
    while(q.length){var c=q.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var nx=c[0]+d[0],ny=c[1]+d[1];if(g[ny]&&g[ny][nx]==='.'&&!seen[nx+','+ny]){seen[nx+','+ny]=1;q.push([nx,ny])}})}
    var open=[];for(y=0;y<h;y++)for(x=0;x<w;x++)if(g[y][x]==='.'){if(seen[x+','+y])open.push([x,y]);else g[y][x]='#'}
    return {w:w,h:h,g:g,open:open,style:style};
  }
  /* Zombies : grande carte en 3×3 zones séparées par des portes payantes (on commence dans une seule zone) */
  var ZNAMES={bunker:['Sas d\'entrée','Dortoir','Salle radio','Infirmerie','Réserve','Générateur','Labo','Cantine','Poste de garde'],
    entrepot:['Quai de chargement','Allée A','Allée B','Chambre froide','Bureaux','Atelier','Zone de tri','Garage','Mezzanine'],
    village:['Place du village','Verger','Ferme','Cimetière','Église','Moulin','Lavoir','Lisière','École'],
    ville:['Carrefour','Supermarché','Station-service','Commissariat','Hôpital','Parking','Métro','Parc','Chantier']};
  function genZoneMap(style,seed){
    var R=rng(seed||1),N=3,Z=14,w=N*Z+1,h=w,g=[],zg=[],x,y,k,i;
    for(y=0;y<h;y++){g.push([]);zg.push([]);for(x=0;x<w;x++){var wall=x%Z===0||y%Z===0;g[y].push(wall?'#':'.');zg[y].push(wall?-1:Math.floor(y/Z)*N+Math.floor(x/Z))}}
    function set(xx,yy,c){if(g[yy]&&g[yy][xx]!==undefined&&zg[yy][xx]>=0)g[yy][xx]=c}
    for(k=0;k<N*N;k++){
      var x0=(k%N)*Z+1,y0=Math.floor(k/N)*Z+1,x1=x0+Z-2,y1=y0+Z-2;
      if(style==='bunker'){
        for(var p=0;p<3;p++){var px=x0+2+Math.floor(R()*(Z-6)),py=y0+2+Math.floor(R()*(Z-6));set(px,py,'#');set(px+1,py,'#');set(px,py+1,'#');set(px+1,py+1,'#')}
        if(R()<.7){var vx=x0+3+Math.floor(R()*(Z-8)),vy=y0+2+Math.floor(R()*3);for(var t=0;t<5;t++)set(vx,vy+t,'#')}
        for(var c=0;c<4;c++)set(x0+1+Math.floor(R()*(Z-3)),y0+1+Math.floor(R()*(Z-3)),'c');
      }else if(style==='entrepot'){
        var off=Math.floor(R()*3);for(var sy=y0+2;sy<=y1-2;sy+=3){for(var sx=x0+2;sx<=x1-2;sx++)if((sx-x0+off)%6<4)set(sx,sy,'c')}
        if(R()<.5)set(x0+1+Math.floor(R()*(Z-3)),y0+1,'#');
      }else if(style==='ville'){
        /* v63 : Centre-ville. Chaque quartier a un immeuble qu'on peut traverser (deux entrées), des voitures dans la rue et quelques arbres */
        if(R()<.85){var bw2=5+Math.floor(R()*3),bh2=4+Math.floor(R()*3),bx2=x0+2+Math.floor(R()*(Z-bw2-4)),by2=y0+2+Math.floor(R()*(Z-bh2-4)),ix2,iy2;
          for(ix2=bx2;ix2<bx2+bw2;ix2++){set(ix2,by2,'#');set(ix2,by2+bh2-1,'#')}for(iy2=by2;iy2<by2+bh2;iy2++){set(bx2,iy2,'#');set(bx2+bw2-1,iy2,'#')}
          set(bx2+(bw2>>1),by2+bh2-1,'.');set(bx2+(bw2>>1)-1,by2+bh2-1,'.');set(R()<.5?bx2:bx2+bw2-1,by2+(bh2>>1),'.');set(bx2+(bw2>>1),by2,R()<.5?'.':'#');
          if(R()<.7)set(bx2+1,by2+1,'c')}
        for(var cr2=0;cr2<3;cr2++){var qx2=x0+1+Math.floor(R()*(Z-3)),qy2=y0+1+Math.floor(R()*(Z-3));if(g[qy2][qx2]==='.')set(qx2,qy2,'c')}
        for(var tr2=0;tr2<3;tr2++){var tx2=x0+1+Math.floor(R()*(Z-3)),ty2=y0+1+Math.floor(R()*(Z-3));if(g[ty2][tx2]==='.')set(tx2,ty2,'t')}
      }else{
        if(R()<.75){var hw=4+Math.floor(R()*2),hh=4,hx=x0+1+Math.floor(R()*(Z-hw-3)),hy=y0+1+Math.floor(R()*(Z-hh-3));
          for(var ix=hx;ix<hx+hw;ix++){set(ix,hy,'#');set(ix,hy+hh-1,'#')}for(var iy=hy;iy<hy+hh;iy++){set(hx,iy,'#');set(hx+hw-1,iy,'#')}
          set(hx+(hw>>1),hy+hh-1,'.');set(hx,hy+(hh>>1),'.')}
        for(var tr=0;tr<7;tr++){var tx=x0+Math.floor(R()*(Z-1)),ty=y0+Math.floor(R()*(Z-1));if(g[ty][tx]==='.')set(tx,ty,'t')}
        for(var cr=0;cr<2;cr++){var qx=x0+1+Math.floor(R()*(Z-3)),qy=y0+1+Math.floor(R()*(Z-3));if(g[qy][qx]==='.')set(qx,qy,'c')}
      }
    }
    var edges=[];for(k=0;k<N*N;k++){if(k%N<N-1)edges.push([k,k+1]);if(k<N*(N-1))edges.push([k,k+N])}
    for(i=edges.length-1;i>0;i--){var j=Math.floor(R()*(i+1)),tmp=edges[i];edges[i]=edges[j];edges[j]=tmp}
    var par=[];for(k=0;k<N*N;k++)par[k]=k;
    function root(a){while(par[a]!==a)a=par[a]=par[par[a]];return a}
    var doors=[];
    edges.forEach(function(e){
      var ra=root(e[0]),rb=root(e[1]),tree=ra!==rb;if(tree)par[ra]=rb;else if(R()>.35)return;
      var a=e[0],b=e[1],cells,d;
      if(b===a+1){var X=(a%N+1)*Z,yb=Math.floor(a/N)*Z+6+Math.floor(R()*2);cells=[[X,yb],[X,yb+1]];for(d=1;d<=2;d++){g[yb][X-d]=g[yb+1][X-d]='.';g[yb][X+d]=g[yb+1][X+d]='.'}}
      else{var Y=(Math.floor(a/N)+1)*Z,xb=(a%N)*Z+6+Math.floor(R()*2);cells=[[xb,Y],[xb+1,Y]];for(d=1;d<=2;d++){g[Y-d][xb]=g[Y-d][xb+1]='.';g[Y+d][xb]=g[Y+d][xb+1]='.'}}
      cells.forEach(function(cc){g[cc[1]][cc[0]]='D'});
      doors.push({a:a,b:b,cells:cells,open:false,alongX:b!==a+1});
    });
    var start=Math.floor(R()*N*N),depth={},qq=[start];depth[start]=0;
    while(qq.length){var zz=qq.shift();doors.forEach(function(d){var o=d.a===zz?d.b:d.b===zz?d.a:-1;if(o>=0&&depth[o]===undefined){depth[o]=depth[zz]+1;qq.push(o)}})}
    doors.forEach(function(d,n){d.id=n;var dd=Math.max(depth[d.a]||0,depth[d.b]||0);d.cost=dd<=1?1500:dd===2?2500:3750});
    // tout ce qui n'est pas atteignable (portes ouvertes) devient du mur
    var seen=new Uint8Array(w*h),st=null;for(y=0;y<h&&!st;y++)for(x=0;x<w;x++)if(zg[y][x]===start&&g[y][x]==='.'){st=[x,y];break}
    var q=[st];seen[st[0]+st[1]*w]=1;
    while(q.length){var cc=q.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){var nx=cc[0]+o[0],ny=cc[1]+o[1];if(nx<0||ny<0||nx>=w||ny>=h)return;var ch=g[ny][nx];if((ch==='.'||ch==='D')&&!seen[nx+ny*w]){seen[nx+ny*w]=1;q.push([nx,ny])}})}
    for(y=0;y<h;y++)for(x=0;x<w;x++)if(g[y][x]==='.'&&!seen[x+y*w])g[y][x]='#';
    // stands d'armes : un dans la zone de départ, un (plus fourni) dans la zone la plus lointaine
    function standIn(z){for(var t=0;t<300;t++){var sx=(z%N)*Z+3+Math.floor(R()*(Z-6)),sy=Math.floor(z/N)*Z+3+Math.floor(R()*(Z-6)),ok=true;
      if(g[sy][sx]!=='.')continue;
      for(var oy=-1;oy<=1&&ok;oy++)for(var ox=-1;ox<=1;ox++){var q2=g[sy+oy][sx+ox];if(q2==='#'||q2==='D'||q2==='S')ok=false}
      if(ok&&doors.some(function(d){return d.cells.some(function(c){return Math.abs(c[0]-sx)+Math.abs(c[1]-sy)<4})}))ok=false;
      if(ok){for(var cy=-1;cy<=1;cy++)for(var cx2=-1;cx2<=1;cx2++)g[sy+cy][sx+cx2]='.';g[sy][sx]='S';return [sx,sy]}}return null}
    var far=start;Object.keys(depth).forEach(function(z){if(depth[z]>depth[far])far=+z});
    /* 4 armureries : la simple au départ, deux « avancées » dans des zones du milieu, la « lourde » au plus loin */
    var stands=[],s1=standIn(start),s2=far!==start?standIn(far):null;
    if(s1)stands.push({cx:s1[0],cy:s1[1],zone:start,tier:0});if(s2)stands.push({cx:s2[0],cy:s2[1],zone:far,tier:2});
    var mids=[];for(k=0;k<N*N;k++)if(k!==start&&k!==far)mids.push(k);for(i=mids.length-1;i>0;i--){var j3=Math.floor(R()*(i+1)),t3=mids[i];mids[i]=mids[j3];mids[j3]=t3}
    mids.slice(0,2).forEach(function(z){var sm=standIn(z);if(sm)stands.push({cx:sm[0],cy:sm[1],zone:z,tier:1})});
    /* v29 : stations de boissons, une par sorte, dans des zones différentes */
    var perks=[],pzs=[];for(k=0;k<N*N;k++)pzs.push(k);for(i=pzs.length-1;i>0;i--){var j4=Math.floor(R()*(i+1)),t4=pzs[i];pzs[i]=pzs[j4];pzs[j4]=t4}
    /* v32 : plus de distributeurs, les boissons apparaissent toutes seules sur la carte (voir spawnPerk) */
    var names=ZNAMES[style].slice();for(i=names.length-1;i>0;i--){var j2=Math.floor(R()*(i+1)),t2=names[i];names[i]=names[j2];names[j2]=t2}
    var first=names.indexOf(ZNAMES[style][0]);names[first]=names[start];names[start]=ZNAMES[style][0];
    var open=[];for(y=0;y<h;y++)for(x=0;x<w;x++)if(g[y][x]==='.')open.push([x,y]);
    return {w:w,h:h,g:g,open:open,style:style,zg:zg,doors:doors,start:start,stands:stands,names:names,perks:perks};
  }
  var ZG=null,DOORS=[],STANDS=[],UNL={},ZNAME=[],ALLOPEN=[];
  function zoneOf(x,z){var r=ZG&&ZG[Math.floor(z/S)];return r?r[Math.floor(x/S)]:-1}
  function refreshOpen(){if(!ZG){OPEN=ALLOPEN;return}OPEN=ALLOPEN.filter(function(c){return UNL[ZG[c[1]][c[0]]]})}
  function cellAt(x,z){var r=G[Math.floor(z/S)];return r?(r[Math.floor(x/S)]||'#'):'#'}
  /* collisions fines : les objets (caisses, arbres, tombes, barils…) bloquent à leur vraie taille, pas toute la case */
  var COL={},COLCELL={};
  function colKey(x,z){return Math.floor(x/S)+Math.floor(z/S)*1000}
  function addCol(x0,z0,x1,z1,soft){for(var cz=Math.floor(z0/S);cz<=Math.floor(z1/S);cz++)for(var cx=Math.floor(x0/S);cx<=Math.floor(x1/S);cx++){var k=cx+cz*1000;(COL[k]=COL[k]||[]).push([x0,z0,x1,z1])}if(soft)COLCELL[colKey((x0+x1)/2,(z0+z1)/2)]=1}
  function colHit(x,z){var l=COL[colKey(x,z)];if(!l)return false;for(var i=0;i<l.length;i++){var b=l[i];if(x>b[0]&&x<b[2]&&z>b[1]&&z<b[3])return true}return false}
  function solid(x,z){var c=cellAt(x,z);if(c==='.')return colHit(x,z);if((c==='c'||c==='t'||c==='S')&&COLCELL[colKey(x,z)])return colHit(x,z);return true}
  function freeAt(x,z,r){return !(solid(x-r,z-r)||solid(x+r,z-r)||solid(x-r,z+r)||solid(x+r,z+r)||solid(x,z)||solid(x-r,z)||solid(x+r,z)||solid(x,z-r)||solid(x,z+r))}
  /* si une entité se retrouve coincée dans un objet (apparition, recul), elle peut en sortir, mais jamais entrer dans un mur */
  function moveEnt(e,dx,dz,r){var stuck=!freeAt(e.x,e.z,r);function ok(x,z){return freeAt(x,z,r)||(stuck&&cellAt(x,z)!=='#'&&cellAt(x,z)!=='D'&&!solid(x,z))}if(ok(e.x+dx,e.z))e.x+=dx;if(ok(e.x,e.z+dz))e.z+=dz}
  function los(ax,az,bx,bz){var d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.5);for(var i=1;i<n;i++){var t=i/n,c=cellAt(ax+(bx-ax)*t,az+(bz-az)*t);if(c==='#'||c==='t'||c==='D')return false}return true}
  function cellC(c){return {x:(c[0]+.5)*S,z:(c[1]+.5)*S}}
  /* champ de distances (BFS) vers une case, pour que zombies et bots trouvent leur chemin */
  var fields={};
  function field(x,z){
    var cx=Math.floor(x/S),cz=Math.floor(z/S),k=cx+','+cz,f=fields[k],now=performance.now();
    if(f&&now-f.t<600)return f.d;
    var d=new Int16Array(W*H).fill(-1),q=[cx+cz*W],h=0;if(G[cz]&&G[cz][cx]==='.')d[q[0]]=0;else return d;
    while(h<q.length){var i=q[h++],ix=i%W,iz=(i/W)|0,v=d[i]+1;
      if(ix>0&&G[iz][ix-1]==='.'&&d[i-1]<0){d[i-1]=v;q.push(i-1)}
      if(ix<W-1&&G[iz][ix+1]==='.'&&d[i+1]<0){d[i+1]=v;q.push(i+1)}
      if(iz>0&&G[iz-1][ix]==='.'&&d[i-W]<0){d[i-W]=v;q.push(i-W)}
      if(iz<H-1&&G[iz+1][ix]==='.'&&d[i+W]<0){d[i+W]=v;q.push(i+W)}}
    fields[k]={t:now,d:d};var ks=Object.keys(fields);if(ks.length>40)delete fields[ks[0]];
    return d;
  }
  function pathDir(e,tx,tz){
    if(los(e.x,e.z,tx,tz)&&Math.hypot(tx-e.x,tz-e.z)<S*3)return Math.atan2(tx-e.x,tz-e.z);
    var d=field(tx,tz),cx=Math.floor(e.x/S),cz=Math.floor(e.z/S),best=null,bv=d[cx+cz*W];if(bv<0)bv=1e4;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){var nx=cx+o[0],nz=cz+o[1];if(nx<0||nz<0||nx>=W||nz>=H)return;var v=d[nx+nz*W];if(v>=0&&v<bv){bv=v;best=[nx,nz]}});
    if(!best)return Math.atan2(tx-e.x,tz-e.z);
    return Math.atan2((best[0]+.5)*S-e.x,(best[1]+.5)*S-e.z);
  }

  /* ---------- Zone Morte à plusieurs (coop dans un salon) ----------
     L'hôte fait tourner les zombies, les vagues et les objets ; chacun gère son perso, ses armes et ses pièces.
     À 0 PV on tombe : un pote a 30 s pour te relever (E à côté de toi). Sinon tu regardes les autres et tu reviens à la vague suivante. */
  /* v64 : un pote dont on ne reçoit plus rien depuis 5 s (onglet caché, connexion coupée) ne compte plus comme « debout » */
  function fresh5(r){return r&&r.seen&&performance.now()-r.seen<5000}
  function zTarget(e){var best=null,bd=1e9;if(P&&!dead&&!P.down){bd=Math.hypot(P.x-e.x,P.z-e.z);best={x:P.x,z:P.z,me:1}}
    if(coop)Object.keys(remotes).forEach(function(k){var r=remotes[k];if(r.al!==1||r.x==null||!fresh5(r))return;var d=Math.hypot(r.x-e.x,r.z-e.z);if(d<bd){bd=d;best={x:r.x,z:r.z,id:k}}});
    return best||{x:P?P.x:0,z:P?P.z:0,none:1}}
  function avOf(id){var pl=net.players.filter(function(q){return q.id===id})[0];return pl&&pl.av||null}
  function tagSprite(t){var c=document.createElement('canvas');c.width=256;c.height=64;var g=c.getContext('2d');g.font='bold 30px IBM Plex Mono, monospace';var w=Math.min(250,g.measureText(t).width+24);g.fillStyle='rgba(20,18,16,.82)';g.fillRect((256-w)/2,10,w,44);g.fillStyle='#f1ece2';g.textAlign='center';g.textBaseline='middle';g.fillText(t,128,33);var s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));s.scale.set(2.2,.55,1);s.position.y=2.6;s.renderOrder=5;s.raycast=function(){};s.userData.tag=1;return s}
  /* v25 : changer le nom affiché (ex. « absent ») sans reconstruire tout le perso (ça faisait saccader) */
  function retag(r){var old=null;r.m.children.forEach(function(c){if(c.userData&&c.userData.tag)old=c});if(old){r.m.remove(old);if(old.material.map)old.material.map.dispose();old.material.dispose()}r.m.add(tagSprite(r.n||'?'));r.tagN=r.n}
  function coopModel(r){if(r.m)scene.remove(r.m);var av=avOf(r.id),m=null;
    if(PP.perso&&PP.perso.build)try{m=PP.perso.build(av)}catch(e){m=null}
    if(!m)m=human(CH_SKINS[r.sk||0].c,0xe0b48f,{gun:true,helmet:true});
    r.gunShown=null;
    m.add(tagSprite(r.n||'?'));r.m=m;r.tagN=r.n;m.userData.ent=r;r.kind='p';scene.add(m);r.skShown=r.sk}
  /* tomber, se faire relever */
  /* pose des autres joueurs : arme dans la main, visée, accroupi, glissade, course */
  function coopPose(r,dt,mv,pt){var p=r.m.userData.parts;if(!p||!p.knees)return;
    if(r.gunShown!==(r.w||'pistol')){if(r.gunM&&r.gunM.parent)r.gunM.parent.remove(r.gunM);var gm=buildGun(r.w||'pistol',0x2a2724);gm.rotation.x=-Math.PI/2;gm.position.set(.01,-.34,-.02);gm.scale.setScalar(1.05);gm.traverse(function(o){o.raycast=function(){}});p.elbows[1].add(gm);r.gunM=gm;r.gunShown=r.w||'pistol'}
    var k=Math.min(1,dt*14),cr=r.sl?0:(r.cr||0),aim=!!r.am;r.pz=r.pz||{};var Z=r.pz;function to(n,v){Z[n]=(Z[n]==null?v:Z[n]+(v-Z[n])*k);return Z[n]}
    /* bras : visée = arme à hauteur des yeux, sinon arme tenue devant, canon un peu vers le bas */
    var up=aim?Math.PI/2+pt*.9:1.05+pt*.4;
    p.arms[1].rotation.x=to('a1',up);p.arms[1].rotation.z=to('a1z',aim?.12:.05);p.elbows[1].rotation.x=to('e1',aim?0:.35);
    p.arms[0].rotation.x=to('a0',up-.05);p.arms[0].rotation.z=to('a0z',aim?.55:.45);p.elbows[0].rotation.x=to('e0',aim?.35:.6);
    /* jambes : glissade, accroupi, course */
    var th,kn,ry,lean;
    if(r.sl){th=1.25;kn=-.25;ry=-.5;lean=.55}
    else{th=cr*1.05;kn=-cr*1.9;ry=-cr*.38;lean=-cr*.15}
    if(mv&&!r.sl){var s=Math.sin(r.anim||0);p.legs[0].rotation.x=th+s*.55*(1-cr*.5);p.legs[1].rotation.x=th-s*.55*(1-cr*.5);p.knees[0].rotation.x=kn-Math.max(0,-s)*.8;p.knees[1].rotation.x=kn-Math.max(0,s)*.8;ry+=Math.abs(Math.cos(r.anim||0))*.03}
    else{p.legs[0].rotation.x=to('l0',th);p.legs[1].rotation.x=to('l1',th);p.knees[0].rotation.x=to('k0',kn);p.knees[1].rotation.x=to('k1',kn)}
    p.root.position.y=to('ry',ry);p.root.rotation.x=to('lean',lean);
    if(r.fireT>0&&r.gunM)r.gunM.position.z=.05;else if(r.gunM)r.gunM.position.z=-.02;
    p.elbows[0].rotation.z=p.elbows[1].rotation.z=0;if(p.torso)p.torso.rotation.y=0;
  }
  function goDown(by){if(P.down||dead)return;P.down=true;P.downT=30;P.dcs=0;P.hp=0;aiming=false;mouseDown=false;P.rel=0;sfx.play('lose');addFeed((net.me.name||'Toi')+' est à terre');setPrompt('');sendAcc=0;sendState(1)}
  function stepDown(dt){P.downT-=dt;var s=Math.ceil(P.downT);if(s!==P.dcs){P.dcs=s;center('À TERRE · '+s+' S · UN POTE PEUT TE RELEVER (E)')}
    P.vx=P.vz=0;if(P.downT<=0){P.down=false;dead=true;P.spect=true;center('TU REGARDES TES POTES · TU REVIENS À LA PROCHAINE VAGUE');setTimeout(function(){if(dead&&P.spect)center('')},3500);sendAcc=0;sendState(1)}}
  function reviveStep(){
    if(dead||P.down)return false;var tgt=null,td=2.4;
    Object.keys(remotes).forEach(function(k){var r=remotes[k];if(r.al!==2)return;var d=Math.hypot(r.x-P.x,r.z-P.z);if(d<td){td=d;tgt=k}});
    if(!tgt){revId=null;revT=0;return false}
    var r=remotes[tgt];if(keys.E){keys.E=false;if(revId!==tgt){revId=tgt;revT=0}}
    if(revId===tgt){revT+=stepDt;/* v64 : en secondes réelles, pareil sur tous les PC */var pc=Math.min(100,Math.round(revT/2.5*100));setPrompt('<span>Tu relèves <b>'+esc(r.n||'?')+'</b>…</span><em>'+pc+' %</em>');
      if(revT>=2.5){net.to(tgt,{t:'zc-revive',by:net.me.name||'?'});addPts(100);addFeed('Tu as relevé '+(r.n||'?'));sfx.play('win');revId=null;revT=0}}
    else setPrompt('<kbd>E</kbd><span>Relever <b>'+esc(r.n||'?')+'</b></span>');
    return true;
  }
  function respawn(){var mate=null;Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!mate&&r.al===1)mate=r});
    dead=false;P.spect=false;P.down=false;P.hp=maxHp();var s=mate?{x:mate.x+(Math.random()-.5),z:mate.z+(Math.random()-.5)}:spawnFar(0);if(!solid(s.x,s.z)){P.x=s.x;P.z=s.z}
    var pa=P.guns.pistol;if(pa)pa.mag=12;center('DE RETOUR !');setTimeout(function(){if(UI.center.textContent==='DE RETOUR !')center('')},1500);sfx.play('go');sendAcc=0;sendState(1);hud()}
  /* chaque image : nouvelle vague = les spectateurs reviennent ; l'hôte vérifie si toute l'équipe est tombée */
  var overAcc=0;
  function coopTick(dt){
    if(wave>lastWaveSeen){var was=lastWaveSeen;lastWaveSeen=wave;if(was>0&&dead&&P.spect)respawn()}
    if(!auth||overSent)return;overAcc-=dt;if(overAcc>0)return;overAcc=.5;
    var up=!dead&&!P.down;Object.keys(remotes).forEach(function(k){if(remotes[k].al===1&&fresh5(remotes[k]))up=true});
    if(!up&&wave>0){overSent=true;var msg={t:'zc-over',w:wave};net.broadcast(msg);coopEnd(msg)}
  }
  function coopEnd(m){if(!running)return;var best=PP.store('fps-zombie'),better=kills>best,gain=Math.floor(P.earned/50);if(gain)coins(coins()+gain);if(better){PP.store('fps-zombie',kills);PP.refreshHi()}setPrompt('');
    showEnd('Toute l\'équipe est tombée','Vague '+m.w+'. Tu as eu '+kills+' zombie'+(kills>1?'s':'')+'. +'+gain+' pièces pour les skins.'+(better?' Nouveau record !':' Record : '+best+'.')+(net.isHost?' Clique sur Rejouer pour relancer tout le salon.':' Le chef peut relancer une partie.'));
    if(!net.isHost)$('fps-start').hidden=true}
  /* l'hôte envoie la partie : au départ, et à chaque joueur qui arrive en cours de route */
  function coopStart(to){if(!coop||!auth||!P)return;
    var msg={t:'zc-start',map:mapId,seed:gameSeed,diff:diff,w:wave,doors:DOORS.map(function(d,i){return d.open?i:-1}).filter(function(i){return i>=0}),items:items.map(function(it){return [it.id,it.type,+it.x.toFixed(2),+it.z.toFixed(2)]}),cd:cdT>0?+cdT.toFixed(1):0,st:STANDS.map(function(s){return s.tier||0}),dp:defsMsg(),hx:+P.x.toFixed(1),hz:+P.z.toFixed(1)};
    if(to)net.to(to,msg);else net.broadcast(msg)}
  function coopJoin(m){
    if(!init())return;resetIntro();introBusy=false;mode='zombie';coop=true;online=true;auth=false;overSent=false;mapId=m.map;if(DIFF[m.diff])diff=m.diff;
    Object.keys(remotes).forEach(function(k){if(remotes[k].m&&scene)scene.remove(remotes[k].m);remotes[k].m=null});
    reset(m.seed);items.slice().forEach(function(it){removeItem(it.id)});m.items.forEach(function(a){addItem(a[1],a[2],a[3],a[0])});
    m.doors.forEach(function(i){openDoor(DOORS[i],true)});/* v64 : niveau des armureries et défenses déjà posées */(m.st||[]).forEach(function(t,i){if(t>0&&STANDS[i])setStandTier(STANDS[i],t)});(m.dp||[]).forEach(function(a){try{netDeploy(a)}catch(e){}});wave=m.w;lastWaveSeen=wave;waveLeft=0;P.pts=D().pts;
    var a=Math.random()*6.28;if(!solid(m.hx+Math.cos(a)*1.5,m.hz+Math.sin(a)*1.5)){P.x=m.hx+Math.cos(a)*1.5;P.z=m.hz+Math.sin(a)*1.5}
    $('fps-ov').hidden=true;UI.chat.hidden=false;UI.log.innerHTML='';sys('Appuie sur Entrée pour écrire à ton équipe');running=true;paused=false;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);lock();mobFull(true);
    cdT=m.cd||0;cdShown=-1;center(m.cd?'':'TU REJOINS LA PARTIE');setTimeout(function(){if(UI.center.textContent==='TU REJOINS LA PARTIE')center('')},1800);sfx.play('go');hud();
    addFeed('Vague '+(wave||1)+' · '+MAPS[mapId]);
  }
  /* zombies chez les invités : on suit ce que dit l'hôte */
  function applyZ(m){
    var seen={},now=performance.now();
    m.z.forEach(function(s){seen[s[0]]=1;var e=null;for(var i=0;i<ents.length;i++)if(ents[i].kind==='z'&&ents[i].id===s[0]){e=ents[i];break}
      if(!e){var ty=s[1],mm=zombieModel(ty);mm.position.set(s[2],-1.9,s[3]);scene.add(mm);e={kind:'z',id:s[0],type:ty,x:s[2],z:s[3],yaw:s[4],hp:1,max:1,m:mm,r:ZR[ty]||.55,alive:true,hit:0,rise:s[7]<1?s[7]:0,cd:0};mm.userData.ent=e;ents.push(e);if(s[7]<1)dust(s[2],s[3])}
      e.tx=s[2];e.tz=s[3];e.tyaw=s[4];e.mvN=!!s[5];if(s[8]!=null)e.hpF=s[8];if(s[9]&&!e.boss){e.boss=s[9];e.m.scale.multiplyScalar(1.25)}if(s[6]&&!(e.atkN)){e.atk=.45;A.swipe(e)}e.atkN=!!s[6];e.seenT=now});
    ents.forEach(function(e){if(e.kind==='z'&&e.alive&&!seen[e.id]){e.alive=false;e.dieT=4.5;startDeath(e);A.zdie(e);if(e.type==='exploder'){var ex=e.x,ez=e.z;explode(ex,1,ez,4.2,0,'',false,false)}}});
    if(m.w!==wave){var nw=m.w;wave=nw;if(nw>0){A.wave();PP.toast('Vague '+nw,'warn')}hud()}
    waveLeft=m.wl;if(!m.z.length&&!m.wl&&m.wt>0&&wave){var tt=Math.ceil(m.wt);if(tt!==P.wcd){P.wcd=tt;center('VAGUE '+(wave+1)+' DANS '+tt)}}else if(P.wcd){P.wcd=0;if(/^VAGUE/.test(UI.center.textContent))center('')}
  }
  function stepZGuest(dt){
    ents.forEach(function(e){if(e.kind!=='z'||!e.alive||!e.m)return;
      if(e.rise<1){e.x=e.tx;e.z=e.tz;e.yaw=e.tyaw||e.yaw;e.m.position.x=e.x;e.m.position.z=e.z;e.m.rotation.y=e.yaw+Math.PI;zAnim(e,dt,false);return}
      var k=Math.min(1,dt*13);e.x+=(e.tx-e.x)*k;e.z+=(e.tz-e.z)*k;e.yaw=angLerp(e.yaw,e.tyaw||e.yaw,k);
      e.m.position.set(e.x,0,e.z);e.m.rotation.y=e.yaw+Math.PI;zAnim(e,dt,e.mvN);
      var hot=e.hit>0?0x661111:0;if(e.hot!==hot){e.hot=hot;e.m.traverse(function(o){if(o.isMesh&&o.material.emissive)o.material.emissive.setHex(hot)})}
      e.groanT=(e.groanT===undefined?1+Math.random()*4:e.groanT)-dt;if(e.groanT<=0){e.groanT=3+Math.random()*6;var d=Math.hypot(P.x-e.x,P.z-e.z);if(d<34)A.groan(e,d)}});
  }
  net.on(function(m,from){
    if(PP.cur()!=='fps')return;
    if(m.t==='zc-start'&&!net.isHost&&net.inRoom()){if(coop&&running&&!dead&&m.seed===gameSeed)return;try{coopJoin(m)}catch(e){console.error('zc-start',e)}return}
    if(!coop)return;
    if(m.t==='rel'&&m.d){var d=m.d;
      if(d.g==='zstand'){var ss=STANDS[d.i];if(ss&&(ss.tier||0)<d.t){setStandTier(ss,d.t);addFeed((d.n||'Un pote')+' a amélioré une armurerie');if(shopOpen&&shopStand===ss)shopRefresh()}}
      if(d.g==='zdep'&&running){netDeploy([d.k,d.x,d.z,d.y]);addFeed((d.n||'Un pote')+' a posé : '+(DEFN[d.k]||'une défense'))}
      if(d.g==='zpw'&&PWD[d.k]){pwOn(d.k,d.n||'Un pote');return}
      if(d.g==='zdoor'){var dr=DOORS[d.i];if(dr&&!dr.open){openDoor(dr,true);addFeed((d.n||'Un pote')+' a ouvert une porte')}}
      return}
    if(net.isHost){
      if(m.t==='zc-drop'&&running&&GUNS[m.ty]){addItem(m.ty,+m.x,+m.z);return}
      if(m.t==='zc-hello'){if(running&&P)coopStart(from);return}
      if(m.t==='zc-hit'){var e=null;for(var i=0;i<ents.length;i++)if(ents[i].kind==='z'&&ents[i].id===m.id){e=ents[i];break}
        if(e&&e.alive){var pl=net.players.filter(function(q){return q.id===from})[0];var rr=remotes[from];damageEnt(e,m.d,pl?pl.name:'?',false,!!m.h,m.x!=null?{x:+m.x,z:+m.z}:rr&&rr.x!=null?{x:rr.x,z:rr.z}:null);if(!e.alive)net.to(from,{t:'zc-kill',h:m.h,ty:e.type})}return}
    }else{
      if(m.t==='zc-s'&&running){applyZ(m);return}
      if(m.t==='zc-item'&&running){addItem(m.ty,m.x,m.z,m.i);return}
      if(m.t==='zc-kill'){kills++;A.kill(!!m.h);lastKill=performance.now();if(m.h)addFeed('Tir dans la tête !');addPts(m.ty==='brute'?500:m.h?90:50);hud();return}
      if(m.t==='zc-over'){coopEnd(m);return}
    }
    if(m.t==='zc-dmg'&&running&&!dead){hurt(m.d,m.by,m.x,m.z);return}
    if(m.t==='zc-revive'&&P&&P.down){P.down=false;P.hp=40;P.dcs=0;center('RELEVÉ PAR '+String(m.by||'').toUpperCase());setTimeout(function(){if(/^RELEVÉ/.test(UI.center.textContent))center('')},1500);sfx.play('win');sendAcc=0;sendState(1);hud();return}
  });
  /* ---------- Rendu ---------- */
  var BL=[],BLi=0,BOOMG=null,SPKG=null,R3=null,scene,cam,vscene,vcam,world,ray=new THREE.Raycaster(),solidMeshes=[],targets=[],viewGun=null,muzzle,muzzleL;
  function tex(w,h,fn,rep){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(rep)t.repeat.set(rep[0],rep[1]);return t}
  function noise(g,w,h,base,amt,n){g.fillStyle=base;g.fillRect(0,0,w,h);for(var i=0;i<n;i++){var v=Math.random()*amt|0;g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+(v/255)+')';g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3)}}
  var TX={};
  function textures(){
    if(TX.ok)return;TX.ok=1;
    /* textures v2 (512 px) : panneaux de béton avec joints, boulons, coulures et bande de danger ; dalles de sol avec joints et fissures ;
       tôle ondulée ; béton ciré avec joints de dilatation ; briques ombrées ; herbe variée avec terre ; plafond en dalles */
    function grime(g,w,h,n,a){for(var i=0;i<n;i++){var x=Math.random()*w,y=Math.random()*h,r=8+Math.random()*40,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(20,16,12,'+(a*Math.random())+')');gr.addColorStop(1,'rgba(20,16,12,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}}
    function drips(g,w,h,n,y0){for(var i=0;i<n;i++){var x=Math.random()*w,l=20+Math.random()*120,gr=g.createLinearGradient(0,y0,0,y0+l);gr.addColorStop(0,'rgba(30,24,18,.35)');gr.addColorStop(1,'rgba(30,24,18,0)');g.fillStyle=gr;g.fillRect(x,y0,1.5+Math.random()*3,l)}}
    TX.concrete=tex(512,512,function(g,w,h){noise(g,w,h,'#85827b',34,9000);grime(g,w,h,40,.25);
      g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,h/2-2,w,4);g.fillRect(w/2-2,0,4,h/2);g.fillStyle='rgba(255,255,255,.1)';g.fillRect(0,h/2+2,w,2);
      for(var bx=0;bx<4;bx++)for(var by=0;by<2;by++){var x=[18,w/2-18,w/2+18,w-18][bx],y=[18,h/2-18][by];g.fillStyle='#4a4844';g.beginPath();g.arc(x,y,5,0,7);g.fill();g.fillStyle='rgba(255,255,255,.25)';g.beginPath();g.arc(x-1.5,y-1.5,2,0,7);g.fill()}
      drips(g,w,h,22,h/2+4);drips(g,w,h,14,8);
      g.fillStyle='#2a2826';g.fillRect(0,h-78,w,6);for(var i=-40;i<w;i+=56){g.fillStyle='#d8a520';g.beginPath();g.moveTo(i,h-72);g.lineTo(i+28,h-72);g.lineTo(i+64,h-24);g.lineTo(i+36,h-24);g.fill();g.fillStyle='#1b1a18';g.beginPath();g.moveTo(i+28,h-72);g.lineTo(i+56,h-72);g.lineTo(i+92,h-24);g.lineTo(i+64,h-24);g.fill()}
      g.fillStyle='rgba(0,0,0,.25)';for(var s=0;s<260;s++)g.fillRect(Math.random()*w,h-72+Math.random()*48,2+Math.random()*4,1+Math.random()*2);
      var gb=g.createLinearGradient(0,h-24,0,h);gb.addColorStop(0,'#3a3834');gb.addColorStop(1,'#1e1d1b');g.fillStyle=gb;g.fillRect(0,h-24,w,24)});
    /* v63 : façade du Centre-ville : enduit, fenêtre avec volets et rebord, soubassement en pierre */
    TX.facade=tex(512,512,function(g,w,h){noise(g,w,h,'#d8cfc0',22,7000);grime(g,w,h,18,.18);
      g.fillStyle='#8a8276';g.fillRect(0,h-90,w,90);for(var sx=0;sx<w;sx+=64){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(sx,h-90,3,90)}g.fillStyle='rgba(0,0,0,.3)';g.fillRect(0,h-92,w,4);g.fillRect(0,h-46,w,2);
      var wx=w/2-80,wy=86,ww=160,wh=200;g.fillStyle='#5a5248';g.fillRect(wx-12,wy-12,ww+24,wh+24);
      var gl=g.createLinearGradient(wx,wy,wx+ww,wy+wh);gl.addColorStop(0,'#3a4c62');gl.addColorStop(.5,'#6d86a2');gl.addColorStop(1,'#26323f');g.fillStyle=gl;g.fillRect(wx,wy,ww,wh);
      g.fillStyle='#e9e3d6';g.fillRect(wx+ww/2-4,wy,8,wh);g.fillRect(wx,wy+wh/2-4,ww,8);g.fillStyle='rgba(255,255,255,.25)';g.beginPath();g.moveTo(wx+10,wy+10);g.lineTo(wx+50,wy+10);g.lineTo(wx+10,wy+60);g.fill();
      g.fillStyle='#3f5a46';g.fillRect(wx-58,wy-6,44,wh+12);g.fillRect(wx+ww+14,wy-6,44,wh+12);g.fillStyle='rgba(0,0,0,.3)';for(var sl=0;sl<wh;sl+=14){g.fillRect(wx-56,wy+sl,40,3);g.fillRect(wx+ww+16,wy+sl,40,3)}
      g.fillStyle='#b9b0a0';g.fillRect(wx-20,wy+wh+12,ww+40,14);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(wx-20,wy+wh+26,ww+40,6);drips(g,w,h,10,wy+wh+30)});
    TX.bfloor=tex(512,512,function(g,w,h){noise(g,w,h,'#45433f',26,8000);grime(g,w,h,30,.3);
      for(var ty=0;ty<2;ty++)for(var tx2=0;tx2<2;tx2++){var o=Math.random()*14-7;g.fillStyle='rgba('+(o>0?'255,255,255':'0,0,0')+','+Math.abs(o)/120+')';g.fillRect(tx2*w/2,ty*h/2,w/2,h/2)}
      g.fillStyle='#1c1b19';g.fillRect(0,0,w,4);g.fillRect(0,h/2-2,w,4);g.fillRect(0,0,4,h);g.fillRect(w/2-2,0,4,h);
      g.strokeStyle='rgba(15,14,12,.55)';g.lineWidth=1.3;for(var c=0;c<5;c++){var x=Math.random()*w,y=Math.random()*h;g.beginPath();g.moveTo(x,y);for(var s=0;s<7;s++){x+=(Math.random()-.5)*40;y+=(Math.random()-.5)*40;g.lineTo(x,y)}g.stroke()}
      for(var p=0;p<3;p++){var px=Math.random()*w,py=Math.random()*h,gr=g.createRadialGradient(px,py,0,px,py,40+Math.random()*40);gr.addColorStop(0,'rgba(8,8,10,.45)');gr.addColorStop(1,'rgba(8,8,10,0)');g.fillStyle=gr;g.fillRect(px-80,py-80,160,160)}});
    TX.metal=tex(512,512,function(g,w,h){g.fillStyle='#55697a';g.fillRect(0,0,w,h);for(var i=0;i<w;i+=24){var gr=g.createLinearGradient(i,0,i+24,0);gr.addColorStop(0,'#3e4f5d');gr.addColorStop(.5,'#6a8194');gr.addColorStop(1,'#3e4f5d');g.fillStyle=gr;g.fillRect(i,0,24,h)}
      noise(g,w,h,'rgba(0,0,0,0)',26,4000);grime(g,w,h,30,.3);g.fillStyle='rgba(150,70,30,.35)';for(var r=0;r<40;r++)g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*10,6+Math.random()*30);
      g.fillStyle='#1f2830';g.fillRect(0,h/2-3,w,6);for(var b=12;b<w;b+=48){g.fillStyle='#8a9aa8';g.beginPath();g.arc(b,h/2,3,0,7);g.fill()}
      g.fillStyle='#c94a1c';g.fillRect(0,h-34,w,34);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(0,h-34,w,3);drips(g,w,h,16,h-34)});
    /* v79 : Centre-ville refait : façade d'immeuble à deux étages (vitrine en bas, fenêtres en haut, corniche), asphalte, trottoirs */
    TX.tower=tex(512,1024,function(g,w,h){noise(g,w,h,'#ece6dc',16,9000);grime(g,w,h,14,.12);
      g.fillStyle='#d6cfc2';g.fillRect(0,0,w,34);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,34,w,6);g.fillStyle='#f6f2ea';g.fillRect(0,22,w,6);
      for(var fl=0;fl<2;fl++){var y0=90+fl*250;for(var k=0;k<2;k++){var wx=60+k*232,ww=160,wh=170;
        g.fillStyle='#bdb4a6';g.fillRect(wx-10,y0-10,ww+20,wh+20);var gl=g.createLinearGradient(wx,y0,wx+ww,y0+wh);gl.addColorStop(0,'#2e4058');gl.addColorStop(.55,'#7d97b4');gl.addColorStop(1,'#1f2a38');g.fillStyle=gl;g.fillRect(wx,y0,ww,wh);
        g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.moveTo(wx+8,y0+8);g.lineTo(wx+60,y0+8);g.lineTo(wx+8,y0+80);g.fill();
        g.fillStyle='#e9e3d6';g.fillRect(wx+ww/2-3,y0,6,wh);g.fillRect(wx,y0+wh*.38,ww,6);
        g.fillStyle='#c9c0b0';g.fillRect(wx-16,y0+wh+10,ww+32,12);g.fillStyle='rgba(0,0,0,.28)';g.fillRect(wx-16,y0+wh+22,ww+32,5);
        if(Math.random()<.5){g.fillStyle='#2b2b2e';for(var b=0;b<9;b++)g.fillRect(wx-6+b*(ww+12)/8,y0+wh+26,3,26);g.fillRect(wx-8,y0+wh+26,ww+16,4)}}
        g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,y0+wh+60,w,4)}
      /* rez-de-chaussée : vitrine, auvent rayé, porte */
      var sy=640;g.fillStyle='#5a544c';g.fillRect(0,sy,w,h-sy);
      var st=g.createLinearGradient(0,sy+90,0,h-40);st.addColorStop(0,'#3a4a5a');st.addColorStop(1,'#1a2129');g.fillStyle=st;g.fillRect(24,sy+90,300,h-sy-130);
      g.fillStyle='rgba(255,236,190,.35)';for(var i=0;i<4;i++)g.fillRect(40+i*72,sy+120,50,8+Math.random()*30);
      g.fillStyle='#2c2a27';g.fillRect(350,sy+80,130,h-sy-80);g.fillStyle='#4a4540';g.fillRect(360,sy+92,110,h-sy-104);g.fillStyle='#d8b36a';g.fillRect(450,sy+190,8,8);
      for(var a=0;a<10;a++){g.fillStyle=a%2?'#f1ece2':'#c2402a';g.beginPath();g.moveTo(10+a*33,sy+30);g.lineTo(43+a*33,sy+30);g.lineTo(46+a*33,sy+80);g.lineTo(7+a*33,sy+80);g.fill()}
      g.fillStyle='rgba(0,0,0,.3)';g.fillRect(8,sy+80,334,6);g.fillStyle='#1d1c1a';g.fillRect(0,h-26,w,26);drips(g,w,h,8,sy-30)});
    TX.asphalt=tex(512,512,function(g,w,h){noise(g,w,h,'#4a494c',30,14000);grime(g,w,h,26,.22);
      g.strokeStyle='rgba(18,18,20,.6)';g.lineWidth=1.4;for(var c=0;c<6;c++){var x=Math.random()*w,y=Math.random()*h;g.beginPath();g.moveTo(x,y);for(var s=0;s<8;s++){x+=(Math.random()-.5)*50;y+=(Math.random()-.5)*50;g.lineTo(x,y)}g.stroke()}
      for(var p=0;p<5;p++){g.fillStyle='rgba(0,0,0,.14)';g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,20+Math.random()*40,10+Math.random()*20,Math.random()*3,0,7);g.fill()}});
    TX.walk=tex(256,256,function(g,w,h){noise(g,w,h,'#a9a49c',18,3000);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(0,h/2-1,w,2);g.fillRect(w/2-1,0,2,h);g.fillRect(0,0,w,2);g.fillRect(0,0,2,h)});
    TX.wfloor=tex(512,512,function(g,w,h){noise(g,w,h,'#8d8a82',20,7000);grime(g,w,h,36,.28);g.fillStyle='rgba(30,28,24,.6)';g.fillRect(0,0,w,3);g.fillRect(0,0,3,h);
      g.fillStyle='#d8a520';g.fillRect(0,250,w,12);g.fillStyle='rgba(0,0,0,.25)';for(var s=0;s<200;s++)g.fillRect(Math.random()*w,250+Math.random()*12,2+Math.random()*5,1+Math.random()*2);
      for(var t=0;t<6;t++){var x=Math.random()*w,y=Math.random()*h;g.strokeStyle='rgba(20,18,14,.18)';g.lineWidth=6;g.beginPath();g.moveTo(x,y);g.lineTo(x+(Math.random()-.5)*300,y+(Math.random()-.5)*60);g.stroke()}});
    TX.brick=tex(512,512,function(g,w,h){g.fillStyle='#b8ac9a';g.fillRect(0,0,w,h);var bh=32,bw=64;
      for(var y=0;y<h;y+=bh)for(var x=-(y/bh%2)*bw/2;x<w;x+=bw){var base=['#8e3b26','#a3472d','#7d3320','#9a4a33','#86402c'][Math.random()*5|0];g.fillStyle=base;g.fillRect(x+3,y+3,bw-6,bh-6);var gr=g.createLinearGradient(0,y+3,0,y+bh-3);gr.addColorStop(0,'rgba(255,255,255,.12)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(x+3,y+3,bw-6,bh-6);
        for(var k=0;k<10;k++){g.fillStyle='rgba(0,0,0,'+(Math.random()*.2)+')';g.fillRect(x+3+Math.random()*(bw-8),y+3+Math.random()*(bh-8),2,2)}}
      grime(g,w,h,26,.3);drips(g,w,h,14,0);var gb=g.createLinearGradient(0,h-60,0,h);gb.addColorStop(0,'rgba(40,50,25,0)');gb.addColorStop(1,'rgba(40,50,25,.5)');g.fillStyle=gb;g.fillRect(0,h-60,w,60)});
    TX.grass=tex(512,512,function(g,w,h){noise(g,w,h,'#4f7a32',40,14000);for(var p=0;p<14;p++){var x=Math.random()*w,y=Math.random()*h,r=20+Math.random()*50,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,Math.random()<.4?'rgba(110,85,50,.55)':'rgba(90,130,50,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
      for(var i=0;i<2400;i++){g.fillStyle=Math.random()<.5?'rgba(30,60,15,.55)':'rgba(120,160,70,.4)';g.fillRect(Math.random()*w,Math.random()*h,1,3+Math.random()*4)}
      for(var f=0;f<30;f++){g.fillStyle=['#e8d040','#f1ece2','#c94a8a'][f%3];g.fillRect(Math.random()*w,Math.random()*h,2,2)}});
    TX.ceil=tex(512,512,function(g,w,h){noise(g,w,h,'#3a3a3c',16,5000);g.fillStyle='#232325';for(var i=0;i<=w;i+=128){g.fillRect(i-2,0,4,h);g.fillRect(0,i-2,w,4)}grime(g,w,h,20,.25);g.fillStyle='#fff6d8';g.fillRect(w/2-70,h/2-10,140,20);g.fillStyle='rgba(255,246,216,.15)';g.fillRect(w/2-90,h/2-24,180,48)});
    TX.ao=tex(64,64,function(g,w,h){var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,.6)');gr.addColorStop(.45,'rgba(0,0,0,.2)');gr.addColorStop(1,'rgba(0,0,0,0)');g.clearRect(0,0,w,h);g.fillStyle=gr;g.fillRect(0,0,w,h)});TX.ao.wrapS=TX.ao.wrapT=THREE.ClampToEdgeWrapping;
    TX.blob=tex(64,64,function(g,w,h){var gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(.6,'rgba(0,0,0,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');g.clearRect(0,0,w,h);g.fillStyle=gr;g.fillRect(0,0,w,h)});TX.blob.wrapS=TX.blob.wrapT=THREE.ClampToEdgeWrapping;
    TX.crate=tex(128,128,function(g,w,h){g.fillStyle='#8a5f33';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=16){g.fillStyle=y%32?'#7a522a':'#946839';g.fillRect(0,y,w,14)}g.strokeStyle='#4c3218';g.lineWidth=10;g.strokeRect(5,5,w-10,h-10);g.beginPath();g.moveTo(8,8);g.lineTo(w-8,h-8);g.stroke()});
    TX.med=tex(64,64,function(g,w,h){g.fillStyle='#f2efe6';g.fillRect(0,0,w,h);g.fillStyle='#e2361b';g.fillRect(24,10,16,44);g.fillRect(10,24,44,16)});
    TX.shutter=tex(256,256,function(g,w,h){g.fillStyle='#6d7278';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=16){g.fillStyle='#5a5f66';g.fillRect(0,y,w,6);g.fillStyle='#8a9098';g.fillRect(0,y+6,w,2)}noise(g,w,h,'rgba(0,0,0,0)',26,900);for(var i=-h;i<w;i+=40){g.fillStyle='#d8a520';g.beginPath();g.moveTo(i,h-34);g.lineTo(i+20,h-34);g.lineTo(i+44,h);g.lineTo(i+24,h);g.fill();g.fillStyle='#141210';g.beginPath();g.moveTo(i+20,h-34);g.lineTo(i+40,h-34);g.lineTo(i+64,h);g.lineTo(i+44,h);g.fill()}g.fillStyle='rgba(120,40,20,.35)';for(var r=0;r<30;r++)g.fillRect(Math.random()*w,Math.random()*h*.8,2+Math.random()*6,6+Math.random()*30)});
    TX.planks=tex(256,256,function(g,w,h){g.fillStyle='#2a1c10';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=42){g.fillStyle=['#7a5432','#6b4a2c','#8a6038'][(y/42)%3|0];g.fillRect(4,y+3,w-8,34);g.fillStyle='rgba(0,0,0,.25)';for(var k=0;k<6;k++)g.fillRect(Math.random()*w,y+6+Math.random()*26,40+Math.random()*60,1);g.fillStyle='#2b2b2e';g.fillRect(18,y+14,8,8);g.fillRect(w-26,y+14,8,8)}g.save();g.translate(w/2,h/2);g.rotate(.5);g.fillStyle='#5e4028';g.fillRect(-w,-16,w*2,32);g.restore()});
    TX.shop=tex(256,256,function(g,w,h){g.fillStyle='#3a2a1c';g.fillRect(0,0,w,h);for(var x=0;x<w;x+=32){g.fillStyle=x%64?'#4a3524':'#55402c';g.fillRect(x,0,30,h)}g.fillStyle='#e2361b';g.fillRect(0,70,w,70);g.fillStyle='#f1ece2';g.font='400 46px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('ARMES',w/2,106);g.fillStyle='#d4a32a';g.fillRect(0,64,w,6);g.fillRect(0,140,w,6)});
    TX.ammo=tex(64,64,function(g,w,h){g.fillStyle='#3f5a2c';g.fillRect(0,0,w,h);g.fillStyle='#d8a520';for(var i=0;i<4;i++)g.fillRect(10+i*12,14,7,30);g.fillStyle='#141210';g.fillRect(0,50,w,14)});
  }
  function init(){
    if(R3)return true;
    if(!window.THREE){PP.toast('La 3D (three.js) n\'a pas pu se charger','warn');return false}
    R3=new THREE.WebGLRenderer({canvas:cv,antialias:true});R3.setSize(cv.width,cv.height,false);R3.autoClear=false;R3.toneMapping=THREE.ACESFilmicToneMapping;R3.toneMappingExposure=1.25;setTimeout(function(){fitRes(true)},0);
    cam=new THREE.PerspectiveCamera(75,cv.width/cv.height,.05,400);cam.rotation.order='YXZ';
    vscene=new THREE.Scene();vcam=new THREE.PerspectiveCamera(60,cv.width/cv.height,.01,10);
    vscene.add(new THREE.HemisphereLight(0xffffff,0x666666,1.4));var vl=new THREE.DirectionalLight(0xffffff,1.3);vl.position.set(1,2,1);vscene.add(vl);var vl2=new THREE.DirectionalLight(0xbfd4ff,.6);vl2.position.set(-1,.5,-1);vscene.add(vl2);
    muzzleL=new THREE.PointLight(0xffc060,0,12);
    textures();buildUI();
    return true;
  }
  function lam(o){return new THREE.MeshLambertMaterial(o)}
  function buildWorld(style,seed){
    COL={};COLCELL={};
    var M=mode==='zombie'?genZoneMap(style,seed):genMap(style,seed);G=M.g;W=M.w;H=M.h;ALLOPEN=M.open;fields={};
    ZG=M.zg||null;DOORS=M.doors||[];STANDS=M.stands||[];PERKS=[];DEPS.forEach(dropDep);DEPS=[];ZNAME=M.names||[];UNL={};if(ZG)UNL[M.start]=1;refreshOpen();world0=style;
    scene=new THREE.Scene();solidMeshes=[];
    var OUT=style==='village'||style==='ville',CITY=style==='ville';
    var sky=CITY?0xc4b4a4:style==='village'?0x9cc4e4:style==='entrepot'?0x2a2c30:0x121212;
    scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,OUT?70:34,OUT?230:125);
    scene.add(new THREE.HemisphereLight(CITY?0xf2e6da:OUT?0xe6f2ff:0xd2d6e0,CITY?0x4a4846:OUT?0x56683a:0x3a3632,1.35));
    var sun=new THREE.DirectionalLight(CITY?0xffd8b0:OUT?0xfff1d8:0xfff6e8,OUT?1.45:.75);sun.position.set(30,60,20);scene.add(sun);
    /* v56 : vraies ombres au soleil dans le village (murs, arbres, zombies) — v63 : et au Centre-ville */
    var SH=OUT&&!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);R3.shadowMap.enabled=SH;R3.shadowMap.type=THREE.PCFSoftShadowMap;if(SH){sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);var shc=sun.shadow.camera;shc.left=shc.bottom=-(Math.max(W,H)*S)/2-4;shc.right=shc.top=(Math.max(W,H)*S)/2+4;shc.near=1;shc.far=200;sun.shadow.bias=-.0006;sun.position.set(W*S/2+30,70,H*S/2+20);sun.target.position.set(W*S/2,0,H*S/2);scene.add(sun.target)}
    scene.add(muzzleL);/* v73 : lumières d'explosion fixes (ajouter/enlever une lumière recompilait tous les matériaux : gros freeze) */BL=[0,1,2].map(function(){var l=new THREE.PointLight(0xffa040,0,16);scene.add(l);return l});
    var wallT=CITY?TX.brick:style==='bunker'?TX.concrete:style==='entrepot'?TX.metal:TX.brick,floorT=style==='bunker'?TX.bfloor:CITY?TX.asphalt:style==='entrepot'?TX.wfloor:TX.grass;
    var walls=[],crates=[],trees=[];
    for(var z=0;z<H;z++)for(var x=0;x<W;x++){var c=G[z][x];if(c==='#')walls.push([x,z]);else if(c==='c')crates.push([x,z]);else if(c==='t')trees.push([x,z])}
    var m4=new THREE.Matrix4();
    /* v79 : au Centre-ville, les murs entre quartiers restent bas (briques), les bâtiments deviennent de vrais immeubles */
    var bwalls=[];if(CITY&&ZG){bwalls=walls.filter(function(p){return p[0]%14!==0&&p[1]%14!==0});walls=walls.filter(function(p){return p[0]%14===0||p[1]%14===0})}
    function inst(geo,mat,list,y,yoff){var im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach(function(p,i){m4.makeTranslation((p[0]+.5)*S,y,(p[1]+.5)*S);if(yoff)m4.multiply(new THREE.Matrix4().makeRotationY(yoff(i)));im.setMatrixAt(i,m4)});if(OUT)im.castShadow=true;scene.add(im);solidMeshes.push(im);return im}
    var wim=walls.length?inst(new THREE.BoxGeometry(S,WH,S),lam({map:wallT}),walls,WH/2):null;if(wim&&OUT){wim.castShadow=true;wim.receiveShadow=true}
    /* v56 : chaperon en pierre sur les murs du village, pour des contours nets */
    if(walls.length&&OUT){var cap=inst(new THREE.BoxGeometry(S+.16,.22,S+.16),lam({color:CITY?0x8f8a82:0xb9ad98}),walls,WH+.11);cap.castShadow=true;var cap2=inst(new THREE.BoxGeometry(S+.04,.06,S+.04),lam({color:0x6e6252}),walls,WH-.03)}
    if(bwalls.length){var BH=WH*2.4,bim=inst(new THREE.BoxGeometry(S,BH,S),lam({map:TX.tower}),bwalls,BH/2);bim.castShadow=bim.receiveShadow=true;
      var comp={},cid=0,PAL=[0xe8d6b8,0xd08a6a,0xaebccc,0xe2c27a,0xb8c8a8,0xf0e8e0,0xc4907a,0x9fa8b8],bk=function(x,z){return x+','+z},bset={};bwalls.forEach(function(p){bset[bk(p[0],p[1])]=1});
      bwalls.forEach(function(p){var k0=bk(p[0],p[1]);if(comp[k0]!=null)return;var q=[p],cc=cid++;comp[k0]=cc;while(q.length){var t=q.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(o){var kk=bk(t[0]+o[0],t[1]+o[1]);if(bset[kk]&&comp[kk]==null){comp[kk]=cc;q.push([t[0]+o[0],t[1]+o[1]])}})}});
      var tc2=new THREE.Color();bwalls.forEach(function(p,i){tc2.setHex(PAL[(comp[bk(p[0],p[1])]*5+3)%PAL.length]);bim.setColorAt(i,tc2)});bim.instanceColor.needsUpdate=true;
      inst(new THREE.BoxGeometry(S+.34,.34,S+.34),lam({color:0x4e4a52}),bwalls,BH+.17);
      var acs=bwalls.filter(function(p){return (p[0]*7+p[1]*13)%9===0});if(acs.length)inst(new THREE.BoxGeometry(1.4,.9,1.1),lam({color:0x9a9890}),acs,BH+.79);
      var swl=[];for(var z2=1;z2<H-1;z2++)for(var x2=1;x2<W-1;x2++){if(G[z2][x2]==='#')continue;if(bset[bk(x2+1,z2)]||bset[bk(x2-1,z2)]||bset[bk(x2,z2+1)]||bset[bk(x2,z2-1)])swl.push([x2,z2])}
      if(swl.length){var swm=new THREE.InstancedMesh(new THREE.BoxGeometry(S,.1,S),lam({map:TX.walk}),swl.length);swl.forEach(function(p,i){m4.makeTranslation((p[0]+.5)*S,.05,(p[1]+.5)*S);swm.setMatrixAt(i,m4)});swm.receiveShadow=true;scene.add(swm)}
      var sk=document.createElement('canvas');sk.width=4;sk.height=256;var sg=sk.getContext('2d'),sgr=sg.createLinearGradient(0,0,0,256);sgr.addColorStop(0,'#5d8fcf');sgr.addColorStop(.5,'#b7cde0');sgr.addColorStop(.75,'#efd6b4');sgr.addColorStop(1,'#efd6b4');sg.fillStyle=sgr;sg.fillRect(0,0,4,256);var skt=new THREE.CanvasTexture(sk);skt.colorSpace=THREE.SRGBColorSpace;scene.background=skt;scene.fog.color.setHex(0xe6d2b6);scene.fog.near=60;scene.fog.far=200}
    if(ZG){
      /* chaque zone a son ambiance : murs teintés, sol à elle, objets propres (lits, générateurs, tombes…) et son nom au mur */
      var tc=new THREE.Color();
      if(wim){walls.forEach(function(p,i){var zn=-1;[[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(function(o){var r=ZG[p[1]+o[1]];var v=r?r[p[0]+o[0]]:-1;if(v>=0){zn=v;return true}return false});var th=zn>=0?TH[ZNAME[zn]]:null;tc.setHex(th?th.w:0xffffff);wim.setColorAt(i,tc)});wim.instanceColor.needsUpdate=true}
      for(var zi=0;zi<9;zi++){var th2=TH[ZNAME[zi]]||{},zx0=(zi%3)*14+1,zy0=Math.floor(zi/3)*14+1,ft2=floorT.clone();ft2.needsUpdate=true;ft2.repeat.set(13/(OUT?2:1),13/(OUT?2:1));
        var zf=new THREE.Mesh(new THREE.PlaneGeometry(13*S,13*S),lam({map:ft2,color:th2.f||0xffffff}));zf.rotation.x=-Math.PI/2;zf.position.set((zx0+6.5)*S,.012,(zy0+6.5)*S);zf.receiveShadow=true;scene.add(zf);
        if(G[zy0-1]&&G[zy0-1][zx0+2]==='#'&&G[zy0-1][zx0+3]==='#'&&ZNAME[zi])zoneSign(ZNAME[zi],th2.w||0xffffff,(zx0+3)*S,zy0*S+.03)}
      var bx3=new THREE.Box3();BLOBG=BLOBG||new THREE.PlaneGeometry(1,1);BLOBM=BLOBM||new THREE.MeshBasicMaterial({map:TX.blob,transparent:true,depthWrite:false});
      crates.forEach(function(p){var zn=ZG[p[1]][p[0]],th3=TH[ZNAME[zn]]||{},pr=prop(th3.p||'crate',p[0]*7+p[1]*13);pr.position.set((p[0]+.5)*S,0,(p[1]+.5)*S);scene.add(pr);pr.updateMatrixWorld(true);bx3.setFromObject(pr);addCol(bx3.min.x+.05,bx3.min.z+.05,bx3.max.x-.05,bx3.max.z-.05,true);var bw=bx3.max.x-bx3.min.x+1.2,bd=bx3.max.z-bx3.min.z+1.2,sh=new THREE.Mesh(BLOBG,BLOBM);sh.rotation.x=-Math.PI/2;sh.scale.set(bw,bd,1);sh.position.set((bx3.min.x+bx3.max.x)/2,.024,(bx3.min.z+bx3.max.z)/2);sh.renderOrder=1;scene.add(sh)});
    }else if(crates.length)inst(new THREE.BoxGeometry(S*.8,1.7,S*.8),lam({map:TX.crate}),crates,.85,function(i){return (i%4)*.2});
    if(trees.length){inst(new THREE.CylinderGeometry(.35,.45,3,8),lam({color:0x5b3b22}),trees,1.5);inst(new THREE.ConeGeometry(2,5,9),lam({color:0x2f5a2a}),trees,5);inst(new THREE.ConeGeometry(1.5,3.5,9),lam({color:0x3b6e32}),trees,7);trees.forEach(function(p){var tx=(p[0]+.5)*S,tz=(p[1]+.5)*S;addCol(tx-.55,tz-.55,tx+.55,tz+.55,true)})}
    var ft=floorT.clone();ft.needsUpdate=true;ft.repeat.set(W/(OUT?2:1),H/(OUT?2:1));
    var floor=new THREE.Mesh(new THREE.PlaneGeometry(W*S,H*S),lam({map:ft}));floor.receiveShadow=true;floor.rotation.x=-Math.PI/2;floor.position.set(W*S/2,0,H*S/2);scene.add(floor);solidMeshes.push(floor);
    if(!OUT){var ct=TX.ceil.clone();ct.needsUpdate=true;ct.repeat.set(W/2,H/2);var ceil=new THREE.Mesh(new THREE.PlaneGeometry(W*S,H*S),lam({map:ct,emissive:0x111111}));ceil.rotation.x=Math.PI/2;ceil.position.set(W*S/2,WH,H*S/2);scene.add(ceil)}
    else{var hill=new THREE.Mesh(new THREE.PlaneGeometry(600,600),lam({color:CITY?0x57534e:0x5d8a3a}));hill.rotation.x=-Math.PI/2;hill.position.set(W*S/2,-.02,H*S/2);scene.add(hill)}
    decorate(style,seed);
    DOORS.forEach(buildDoor);STANDS.forEach(buildStand);
    world={style:style,seed:seed};drawMiniBase();
  }
  /* porte payante : rideau métallique (ou barricade en bois au village) + prix au-dessus */
  function label(lines,col){
    var c=document.createElement('canvas');c.width=512;c.height=200;var g=c.getContext('2d');
    g.fillStyle='rgba(20,18,16,.88)';g.fillRect(0,20,512,160);g.fillStyle=col||'#d4a32a';g.fillRect(0,20,14,160);
    g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f1ece2';g.font='700 34px "IBM Plex Mono", monospace';g.fillText(lines[0],263,66);
    g.fillStyle=col||'#d4a32a';g.font='400 64px Anton, Impact, sans-serif';g.fillText(lines[1],263,132);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));sp.scale.set(2.4,.94,1);return sp;
  }
  function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
  function doorLabel(cost,to){
    var c=document.createElement('canvas');c.width=512;c.height=256;var g=c.getContext('2d');
    g.fillStyle='rgba(20,18,16,.9)';rr(g,16,16,480,224,28);g.fill();g.lineWidth=6;g.strokeStyle='#d4a32a';rr(g,16,16,480,224,28);g.stroke();
    g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#f1ece2';g.font='700 30px "IBM Plex Mono", monospace';g.fillText(T('OUVRIR'),214,62);
    g.fillStyle='#f1ece2';rr(g,300,40,48,44,8);g.fill();g.fillStyle='#141210';g.font='700 30px "IBM Plex Mono", monospace';g.fillText('E',324,63);
    var txt=cost.toLocaleString('fr-FR');g.font='400 84px Anton, Impact, sans-serif';var tw=g.measureText(txt).width,cx=256+26;
    var gr=g.createRadialGradient(cx-tw/2-34,126,4,cx-tw/2-30,132,26);gr.addColorStop(0,'#ffe58a');gr.addColorStop(.6,'#d4a32a');gr.addColorStop(1,'#8a6410');g.fillStyle=gr;g.beginPath();g.arc(cx-tw/2-30,134,24,0,7);g.fill();
    g.fillStyle='#d4a32a';g.fillText(txt,cx,136);
    g.fillStyle='rgba(241,236,226,.75)';g.font='600 26px "IBM Plex Mono", monospace';g.fillText('→ '+String(to).toUpperCase(),256,204);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));sp.scale.set(2.3,1.15,1);sp.userData.base=2.45;return sp;
  }
  function buildDoor(d){
    var cx=((d.cells[0][0]+d.cells[1][0])/2+.5)*S,cz=((d.cells[0][1]+d.cells[1][1])/2+.5)*S,grp=new THREE.Group();grp.position.set(cx,0,cz);
    /* le rideau occupe toute l'épaisseur du mur : l'étiquette est posée devant, sans être coupée par les murs voisins */
    var wide=S*2,dep=S*.94,vil=world0==='village',m=new THREE.Mesh(new THREE.BoxGeometry(d.alongX?wide:dep,WH,d.alongX?dep:wide),lam({map:vil?TX.planks:TX.shutter}));m.position.y=WH/2;grp.add(m);
    var fr=lam({color:vil?0x3b2a1a:0x26282c});[-1,1].forEach(function(s){var post=new THREE.Mesh(new THREE.BoxGeometry(d.alongX?.3:S+.1,WH,d.alongX?S+.1:.3),fr);post.position.set(d.alongX?s*wide/2:0,WH/2,d.alongX?0:s*wide/2);grp.add(post)});
    [-1,1].forEach(function(s){var lamp=new THREE.Mesh(new THREE.BoxGeometry(d.alongX?wide*.8:.12,.14,d.alongX?.12:wide*.8),new THREE.MeshBasicMaterial({color:0xd4a32a}));lamp.position.set(d.alongX?0:s*(S/2+.06),WH-.25,d.alongX?s*(S/2+.06):0);grp.add(lamp)});
    var other=ZNAME[UNL[d.a]?d.b:d.a]||'Zone';
    d.lbls=[-1,1].map(function(s){var sp=doorLabel(d.cost,other);sp.position.set(d.alongX?0:s*(S/2+.35),2.45,d.alongX?s*(S/2+.35):0);grp.add(sp);return sp});
    d.m=m;d.g=grp;d.cx=cx;d.cz=cz;d.to=other;scene.add(grp);solidMeshes.push(m);
  }
  function buildStand(s){
    var x=(s.cx+.5)*S,z=(s.cy+.5)*S,g=new THREE.Group();g.position.set(x,0,z);s.x=x;s.z=z;addCol(x-S*.46,z-S*.46,x+S*.46,z+S*.46,true);
    var counter=new THREE.Mesh(new THREE.BoxGeometry(S*.82,1.05,S*.82),lam({map:TX.shop}));counter.position.y=.525;g.add(counter);s.counter=counter;
    var top=new THREE.Mesh(new THREE.BoxGeometry(S*.9,.1,S*.9),lam({color:0x5a3a22}));top.position.y=1.1;g.add(top);s.top=top;
    var pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,2.1,8),lam({color:0x26282c}));pole.position.y=2.1;g.add(pole);
    var sign=label([STN[s.tier].toUpperCase(),'E · ACHETER'],['#e2361b','#a46cf0','#e8b531'][s.tier]);sign.position.y=3.25;sign.scale.set(2.6,1.02,1);g.add(sign);s.sign=sign;
    var pl=new THREE.PointLight(0xffb070,1.4,11);pl.position.y=2.6;g.add(pl);s.pl=pl;
    scene.add(g);solidMeshes.push(counter);s.g=g;styleStand(s);s.pulse=0;
  }
  /* v100 : une armurerie améliorée change de look, comme les armes : violette (niveau 2) puis dorée (niveau 3),
     comptoir et plateau teintés, bandeau lumineux, anneau qui tourne, étoiles au-dessus et armes exposées à la couleur du niveau */
  var STC=[0xffb070,0xa46cf0,0xe8b531];
  function styleStand(s){var t=s.tier||0,g=s.g;if(!g)return;if(s.deco){g.remove(s.deco);s.deco.traverse(function(o){if(o.geometry)o.geometry.dispose()})}var d=new THREE.Group();g.add(d);s.deco=d;s.big=t===2;s.ring=s.glow=null;
    s.counter.material.color.setHex([0xffffff,0xd2c0ff,0xffe6a0][t]);s.top.material.color.setHex([0x5a3a22,0x4a2f7a,0xb08a2a][t]);if(s.pl){s.pl.color.setHex(STC[t]);s.pl.intensity=1.4+t*.5}
    (t===2?['minigun','ray','launcher']:t===1?['sniper','lmg','rifle']:['pistol','smg','rifle']).forEach(function(ty,i){var gm=buildGun(ty,t?UP_COL[t+1]:0x2b2b30);gm.scale.setScalar(1.5);gm.rotation.set(0,i*1.9+.4,Math.PI/2);gm.position.set(Math.cos(i*2.1)*.75,1.2,Math.sin(i*2.1)*.75);d.add(gm)});
    s.pulse=1;if(!t)return;var col=UP_COL[t+1],em=new THREE.MeshBasicMaterial({color:col});
    [[0,.08,S*.42,S*.84,.06,.06],[0,.08,-S*.42,S*.84,.06,.06],[S*.42,.08,0,.06,.06,S*.84],[-S*.42,.08,0,.06,.06,S*.84],[0,1.06,S*.42,S*.84,.05,.05],[0,1.06,-S*.42,S*.84,.05,.05],[S*.42,1.06,0,.05,.05,S*.84],[-S*.42,1.06,0,.05,.05,S*.84]].forEach(function(b){var m=new THREE.Mesh(new THREE.BoxGeometry(b[3],b[4],b[5]),em);m.position.set(b[0],b[1],b[2]);d.add(m)});
    var ring=new THREE.Mesh(new THREE.TorusGeometry(1.15,.04,8,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.85}));ring.rotation.x=Math.PI/2;ring.position.y=1.75;d.add(ring);s.ring=ring;
    for(var k=0;k<t+1;k++){var st=label(['','★'],'#'+new THREE.Color(col).getHexString());st.scale.set(.9,.36,1);st.position.set((k-t/2)*.55,3.95,0);d.add(st)}
    var glow=new THREE.Mesh(new THREE.PlaneGeometry(S*1.3,S*1.3),new THREE.MeshBasicMaterial({map:pwGlow(),color:col,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));glow.rotation.x=-Math.PI/2;glow.position.y=.04;d.add(glow);s.glow=glow;
    d.traverse(function(o){o.raycast=function(){}})}
  /* v29 : distributeur de boisson (5000) */
  /* v84 : les boissons sont dans un distributeur collé contre un mur, aux couleurs du pouvoir */
  function perkSpot(taken){var cand=[];OPEN.forEach(function(c){var x=c[0],z=c[1];if(!G[z]||G[z][x]!=='.')return;var zn=zoneOf((x+.5)*S,(z+.5)*S);if(taken[zn])return;
      for(var oy=-1;oy<=1;oy++)for(var ox=-1;ox<=1;ox++){var r=G[z+oy],q=r&&r[x+ox];if(q==='D'||q==='S')return}
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var r=G[z+d[1]];if(r&&r[x+d[0]]==='#')cand.push([x,z,d[0],d[1]])})});
    for(var i=cand.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=cand[i];cand[i]=cand[j];cand[j]=t}
    for(var k=0;k<cand.length;k++){var c=cand[k],dx=c[2],dz=c[3],cx=(c[0]+.5)*S,cz=(c[1]+.5)*S,mx=cx+dx*(S/2-.42),mz=cz+dz*(S/2-.42),ex=dx?.4:.68,ez=dz?.4:.68,fx=mx-dx*1.15,fz=mz-dz*1.15;
      if(colHit(mx-ex,mz-ez)||colHit(mx+ex,mz-ez)||colHit(mx-ex,mz+ez)||colHit(mx+ex,mz+ez)||colHit(mx,mz)||!freeAt(fx,fz,.45))continue;
      if(P&&Math.hypot(fx-P.x,fz-P.z)<9)continue;
      if(PERKS.some(function(q){return Math.hypot(q.x-fx,q.z-fz)<16}))continue;
      return {x:fx,z:fz,mx:mx,mz:mz,dx:dx,dz:dz,ex:ex,ez:ez}}
    return null}
  var PKTX={};
  function perkTex(id){if(PKTX[id])return PKTX[id];var d=PK[id],col='#'+new THREE.Color(d.col).getHexString();
    return PKTX[id]={sign:tex(256,64,function(g,w,h){g.fillStyle='#141210';g.fillRect(0,0,w,h);g.fillStyle=col;g.fillRect(4,4,w-8,h-8);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(4,4,w-8,(h-8)/2);
        g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='bold 30px Anton, Impact, sans-serif';g.shadowColor='rgba(0,0,0,.6)';g.shadowBlur=6;g.fillText(d.n.toUpperCase(),w/2,h/2+2)}),
      side:tex(64,256,function(g,w,h){var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,col);gr.addColorStop(1,'#141210');g.fillStyle=gr;g.fillRect(0,0,w,h);g.save();g.translate(w/2,h/2);g.rotate(-Math.PI/2);g.fillStyle='rgba(255,255,255,.85)';g.font='bold 26px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(d.n.toUpperCase(),0,0);g.restore()})}}
  function perkCol(p,on){if(p.mx==null)return;var b=[p.mx-p.ex,p.mz-p.ez,p.mx+p.ex,p.mz+p.ez];
    if(on){addCol(b[0],b[1],b[2],b[3]);return}
    for(var k in COL){COL[k]=COL[k].filter(function(q){return !(q[0]===b[0]&&q[1]===b[1]&&q[2]===b[2]&&q[3]===b[3])})}}
  function buildPerk(p){
    var d=PK[p.id],col='#'+new THREE.Color(d.col).getHexString(),T=perkTex(p.id),g=new THREE.Group();
    var M=function(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.25},o||{}))},body=M(d.col),dark=M(0x18171a,{roughness:.6}),chrome=M(0xd8d8de,{roughness:.25,metalness:.8});
    function B(w,h,dd,m,x,y,z){var b=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),m);b.position.set(x,y,z);g.add(b);return b}
    var mx=p.mx!=null?p.mx:p.x,mz=p.mx!=null?p.mz:p.z;g.position.set(mx,0,mz);if(p.mx!=null)g.rotation.y=Math.atan2(-p.dx,-p.dz);
    B(1.3,2.25,.78,body,0,1.2,0);
    B(.06,2.25,.82,dark,-.66,1.2,0);B(.06,2.25,.82,dark,.66,1.2,0);B(1.38,.1,.86,dark,0,.06,0);
    var sm=new THREE.MeshStandardMaterial({map:T.sign,emissive:0xffffff,emissiveMap:T.sign,emissiveIntensity:.9,roughness:.4});var sg=B(1.36,.42,.86,[dark,dark,dark,dark,sm,dark],0,2.54,0);
    var sdm=new THREE.MeshStandardMaterial({map:T.side,roughness:.5});B(.005,1.6,.6,sdm,-.695,1.25,0).material=sdm;B(.005,1.6,.6,sdm,.695,1.25,0).rotation.y=Math.PI;
    // vitrine éclairée avec des bouteilles alignées
    B(.86,1.34,.04,M(0x0d0d10),-.18,1.42,.37);
    var inner=new THREE.Mesh(new THREE.PlaneGeometry(.78,1.26),new THREE.MeshBasicMaterial({color:new THREE.Color(d.col).lerp(new THREE.Color(0xffffff),.55)}));inner.position.set(-.18,1.42,.392);g.add(inner);
    var bm=new THREE.MeshStandardMaterial({color:d.col,emissive:d.col,emissiveIntensity:.45,roughness:.2,metalness:.1}),capM=M(0xece6da,{roughness:.4});
    for(var r=0;r<3;r++){B(.78,.025,.06,chrome,-.18,1.0+r*.4,.41);for(var c=0;c<4;c++){var bx=-.45+c*.18,by=1.02+r*.4;var bt=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.2,10),bm);bt.position.set(bx,by+.11,.43);g.add(bt);var nk=new THREE.Mesh(new THREE.CylinderGeometry(.018,.04,.07,8),bm);nk.position.set(bx,by+.245,.43);g.add(nk);var cp=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.03,8),capM);cp.position.set(bx,by+.29,.43);g.add(cp)}}
    var glass=new THREE.Mesh(new THREE.PlaneGeometry(.86,1.34),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.16,roughness:.05,metalness:.6,depthWrite:false}));glass.position.set(-.18,1.42,.5);g.add(glass);
    B(.9,.04,.12,chrome,-.18,.73,.42);B(.9,.04,.12,chrome,-.18,2.11,.42);
    // panneau à droite : écran prix, boutons, fente à pièces
    B(.32,1.34,.04,dark,.45,1.42,.4);
    var scr=new THREE.Mesh(new THREE.PlaneGeometry(.24,.12),new THREE.MeshBasicMaterial({color:0x7cff9a}));scr.position.set(.45,1.92,.425);g.add(scr);
    for(var bi=0;bi<6;bi++){var bb=B(.07,.07,.03,new THREE.MeshStandardMaterial({color:d.col,emissive:d.col,emissiveIntensity:.8}),.4+(bi%2)*.1,1.7-Math.floor(bi/2)*.12,.43)}
    B(.08,.14,.03,chrome,.45,1.22,.43);B(.02,.09,.035,dark,.45,1.22,.44);
    // trappe où tombe la bouteille
    B(1.0,.32,.06,dark,-.06,.42,.38);B(.94,.06,.1,chrome,-.06,.6,.42);
    // halo au sol qui pulse
    var glow=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.6),new THREE.MeshBasicMaterial({map:pwGlow(),color:d.col,transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending}));glow.rotation.x=-Math.PI/2;glow.position.set(0,.03,.9);g.add(glow);p.glow=glow;
    var sign=label([d.n.toUpperCase(),perkSignTxt(p.id)],col);sign.position.set(0,3.25,0);sign.scale.set(2.1,.82,1);g.add(sign);p.sign=sign;p.signT=perkSignTxt(p.id);
    g.traverse(function(o){o.raycast=function(){}});scene.add(g);p.g=g;perkCol(p,true);
  }
  /* animation : une bouteille de la couleur du pouvoir, que l'on débouche et que l'on boit */
  var drinkG=null;
  function drinkModel(colHex){if(drinkG){vscene.remove(drinkG)}var g=new THREE.Group(),c=new THREE.Color(colHex);
    var gl=new THREE.MeshStandardMaterial({color:c.clone().lerp(new THREE.Color(0xffffff),.2),transparent:true,opacity:.55,roughness:.05,metalness:.3}),liq=new THREE.MeshStandardMaterial({color:colHex,emissive:colHex,emissiveIntensity:.55,roughness:.3});
    var bot=new THREE.Group();g.add(bot);
    var b=new THREE.Mesh(new THREE.CylinderGeometry(.034,.036,.13,16),gl);bot.add(b);
    var lq=new THREE.Mesh(new THREE.CylinderGeometry(.03,.032,.12,16),liq);lq.position.y=-.002;bot.add(lq);g.userData.liq=lq;
    var nk=new THREE.Mesh(new THREE.CylinderGeometry(.013,.034,.05,14),gl);nk.position.y=.09;bot.add(nk);
    var lb=new THREE.Mesh(new THREE.CylinderGeometry(.0365,.0365,.05,16),new THREE.MeshStandardMaterial({color:0xf1ece2,roughness:.6}));lb.position.y=-.01;bot.add(lb);
    var st=new THREE.Mesh(new THREE.CylinderGeometry(.037,.037,.012,16),new THREE.MeshStandardMaterial({color:colHex,roughness:.5}));st.position.y=-.01;bot.add(st);
    var cap=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.018,10),new THREE.MeshStandardMaterial({color:0xd0c8b8,metalness:.6,roughness:.3}));cap.position.y=.122;bot.add(cap);g.userData.cap=cap;
    var glove=new THREE.MeshStandardMaterial({color:0x2a2724,roughness:.85}),sl=new THREE.MeshStandardMaterial({color:0x4a5442,roughness:.9});
    var palm=new THREE.Mesh(new THREE.BoxGeometry(.022,.06,.05),glove);palm.position.set(.046,-.02,0);g.add(palm);
    for(var f=0;f<4;f++){var fg=new THREE.Mesh(new THREE.BoxGeometry(.05,.013,.013),glove);fg.position.set(.02,.0-f*.016,.034);g.add(fg)}
    var th=new THREE.Mesh(new THREE.BoxGeometry(.013,.04,.013),glove);th.position.set(.02,.0,-.034);th.rotation.x=.3;g.add(th);
    var arm=new THREE.Mesh(new THREE.CylinderGeometry(.04,.048,.5,10),sl);arm.position.set(.16,-.24,.12);arm.rotation.set(.55,0,.55);g.add(arm);
    g.scale.setScalar(.7);g.visible=false;vscene.add(g);drinkG=g;return g}
  function ease(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
  function drinkStep(){var g=drinkG;if(!g)return;var u=(performance.now()-P.drinkS)/1700;if(u>=1){P.drink=0;g.visible=false;P.drawT=1;return}g.visible=true;
    var a=ease(u/.22),b=ease((u-.22)/.16),c=ease((u-.8)/.2),gu=Math.max(0,Math.min(1,(u-.38)/.42));
    var x=.24+(.07-.24)*a,y=-.5+(-.13+.5)*a,z=-.36+(-.3+.36)*a,rx=0,rz=.35-.25*a;
    x+=(.01-x)*b;y+=(-.03-y)*b;z+=(-.23-z)*b;rx+=1.95*b;rz-=.1*b;
    if(u>.38&&u<.8){y+=Math.sin(gu*Math.PI*8)*.004;rx+=gu*.25}
    x+=(.26-x)*c;y+=(-.6-y)*c;z+=(-.3-z)*c;rx+=(.3-rx)*c;
    g.position.set(x,y,z);g.rotation.set(rx,0,rz);g.userData.cap.visible=u<.24;g.userData.liq.scale.y=Math.max(.04,1-gu);g.userData.liq.position.y=-.06*(1-g.userData.liq.scale.y);
    if(!P.drinkFx&&u>.78){P.drinkFx=1;drinkFlash(P.drinkC)}}
  function drinkFlash(col){var host=cv&&cv.parentNode;if(!host)return;if(!UI.dfx){UI.dfx=document.createElement('div');UI.dfx.className='fps-drinkfx';host.appendChild(UI.dfx)}
    UI.dfx.style.setProperty('--c','#'+new THREE.Color(col).getHexString());UI.dfx.classList.remove('on');void UI.dfx.offsetWidth;UI.dfx.classList.add('on');setTimeout(function(){UI.dfx.classList.remove('on')},180)}
  var TH={
    "Sas d'entrée":{w:0xffffff,f:0xffffff,p:'crate'},'Dortoir':{w:0x9fb4d8,f:0x9aa6c0,p:'bed'},'Salle radio':{w:0x9ad4a8,f:0x8a9a8a,p:'rack'},'Infirmerie':{w:0xf6f2ea,f:0xf0f4f6,p:'medbed'},
    'Réserve':{w:0xd0b080,f:0xb09a78,p:'crate'},'Générateur':{w:0xffd060,f:0xa89a60,p:'gen'},'Labo':{w:0x8ae0e8,f:0xa8c4d0,p:'tank'},'Cantine':{w:0xeab494,f:0xd0a088,p:'table'},'Poste de garde':{w:0xa4a488,f:0x8a8a70,p:'sandbag'},
    'Quai de chargement':{w:0xffffff,f:0xffffff,p:'pallet'},'Allée A':{w:0xffa070,f:0xe8d8c8,p:'shelf'},'Allée B':{w:0x7aa8ff,f:0xd0d8e8,p:'shelf'},'Chambre froide':{w:0xc8ecff,f:0xe8f6ff,p:'ice'},'Bureaux':{w:0xe8dcc8,f:0xb8a488,p:'desk'},'Atelier':{w:0xb8b8b8,f:0x9a8a7a,p:'bench'},'Zone de tri':{w:0xa0e090,f:0xd8e8c8,p:'pallet'},'Garage':{w:0x9a9aaa,f:0x707078,p:'car'},'Mezzanine':{w:0xd8a8e8,f:0xe0d0e8,p:'shelf'},
    'Carrefour':{w:0xffffff,f:0xffffff,p:'car'},'Supermarché':{w:0xf0d8c0,f:0xe8e2d4,p:'shelf'},'Station-service':{w:0xf0c878,f:0xd0c8b8,p:'car'},'Commissariat':{w:0xa8bce0,f:0xc0c8d8,p:'desk'},'Hôpital':{w:0xf6f2ea,f:0xf0f4f6,p:'medbed'},
    'Parking':{w:0xa8a8b0,f:0xa0a0aa,p:'car'},'Métro':{w:0xe0e478,f:0xc8c8b8,p:'bench'},'Parc':{w:0xc0d0a8,f:0x9ab080,p:'log'},'Chantier':{w:0xf0b868,f:0xd0b898,p:'pallet'},
    'Place du village':{w:0xffffff,f:0xffffff,p:'crate'},'Verger':{w:0xe0c090,f:0x80b048,p:'hay'},'Ferme':{w:0xd89a68,f:0xb09060,p:'hay'},'Cimetière':{w:0xa0a0a0,f:0x5a6a48,p:'grave'},'Église':{w:0xf0e8d8,f:0xb0aca0,p:'pew'},'Moulin':{w:0xe0d0a8,f:0xc0b080,p:'sack'},'Lavoir':{w:0xa8c8d8,f:0x7a9ab0,p:'well'},'Lisière':{w:0xb0a080,f:0x4a7030,p:'log'},'École':{w:0xf0d488,f:0xc0a070,p:'desk'}
  };
  /* détails des cartes : néons au plafond (certains clignotent), tuyaux le long des murs, barils, affiches,
     taches au sol et papiers ; poutres et lampes suspendues à l'entrepôt ; lampadaires, rochers et buissons au village */
  var flickMat=null,DTX={};
  function posterTex(kind){if(DTX[kind])return DTX[kind];return DTX[kind]=tex(128,170,function(g,w,h){
    if(kind===0){g.fillStyle='#d8a520';g.fillRect(0,0,w,h);g.fillStyle='#141210';g.beginPath();g.moveTo(w/2,22);g.lineTo(w-18,100);g.lineTo(18,100);g.closePath();g.fill();g.fillStyle='#d8a520';g.font='bold 54px sans-serif';g.textAlign='center';g.fillText('!',w/2,92);g.fillStyle='#141210';g.font='bold 22px sans-serif';g.fillText('DANGER',w/2,140)}
    else if(kind===1){g.fillStyle='#1f7a3a';g.fillRect(0,0,w,h);g.fillStyle='#f1ece2';g.font='bold 24px sans-serif';g.textAlign='center';g.fillText('SORTIE',w/2,50);g.beginPath();g.moveTo(30,100);g.lineTo(80,100);g.lineTo(80,80);g.lineTo(105,112);g.lineTo(80,144);g.lineTo(80,124);g.lineTo(30,124);g.closePath();g.fill()}
    else{g.fillStyle='#f1ece2';g.fillRect(0,0,w,h);g.strokeStyle='#e2361b';g.lineWidth=12;g.beginPath();g.arc(w/2,72,42,0,7);g.stroke();g.beginPath();g.moveTo(w/2-30,42);g.lineTo(w/2+30,102);g.stroke();g.fillStyle='#141210';g.font='bold 18px sans-serif';g.textAlign='center';g.fillText('ACCÈS',w/2,140);g.fillText('INTERDIT',w/2,160)}
    for(var i=0;i<300;i++){g.fillStyle='rgba(0,0,0,'+(Math.random()*.12)+')';g.fillRect(Math.random()*w,Math.random()*h,2,2)}})}
  function decorate(style,seed){
    var R=rng((seed||1)+99),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),pos=new THREE.Vector3(),eu=new THREE.Euler();
    function build(geo,mat,list,solid){if(!list.length)return null;var im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach(function(p,i){eu.set(p[3]||0,p[4]||0,p[5]||0);q.setFromEuler(eu);pos.set(p[0],p[1],p[2]);var s=p[6]||1;sc.set(s,p[7]||s,s);m4.compose(pos,q,sc);im.setMatrixAt(i,m4)});scene.add(im);if(solid)solidMeshes.push(im);return im}
    function open(x,z){return G[z]&&G[z][x]==='.'}function wall(x,z){return G[z]&&G[z][x]==='#'}
    var L={ao:[],lamp:[],flick:[],pipeH:[],pipeV:[],valve:[],b0:[],b1:[],b2:[],blood:[],oil:[],paper:[],p0:[],p1:[],p2:[],beam:[],shade:[],bulb:[],post:[],rock:[],bush:[],flower:[],tuft:[],stripe:[],cone:[]},HALF=Math.PI/2;
    for(var z=1;z<H-1;z++)for(var x=1;x<W-1;x++){
      if(!open(x,z))continue;var cx=(x+.5)*S,cz=(z+.5)*S;
      var nb=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(o){return wall(x+o[0],z+o[1])});
      if(style!=='village'&&style!=='ville'){
        if(style==='bunker'&&(x*7+z*13)%9===0)(R()<.18?L.flick:L.lamp).push([cx,WH-.04,cz,0,R()<.5?0:HALF,0]);
        nb.forEach(function(o){L.ao.push([cx+o[0]*(S/2-.55),cz+o[1]*(S/2-.55),o[0]===1?-Math.PI/2:o[0]===-1?Math.PI/2:o[1]===1?Math.PI:0])});
        nb.forEach(function(o){var fx=cx+o[0]*(S/2-.2),fz=cz+o[1]*(S/2-.2),ry=o[0]===1?-HALF:o[0]===-1?HALF:o[1]===1?Math.PI:0;
          if(style==='bunker'&&R()<.45){L.pipeH.push([fx,3.35,fz,o[0]?HALF:0,0,o[0]?0:HALF]);if(R()<.4)L.pipeH.push([fx,3.05,fz,o[0]?HALF:0,0,o[0]?0:HALF,.8])}
          if(R()<.07)L.pipeV.push([fx,WH/2,fz]);
          if(R()<.05)L.valve.push([cx+o[0]*(S/2-.08),1.4,cz+o[1]*(S/2-.08),0,ry,0]);
          if(R()<.06)L['p'+Math.floor(R()*3)].push([cx+o[0]*(S/2-.02),1.9,cz+o[1]*(S/2-.02),0,ry,0]);
          if(R()<.08)L['b'+Math.floor(R()*3)].push([cx+o[0]*(S/2-.75)+(R()-.5),.55,cz+o[1]*(S/2-.75)+(R()-.5),0,R()*6,0])});
        if(R()<.05)L.paper.push([cx+(R()-.5)*S*.7,.025,cz+(R()-.5)*S*.7,-HALF,0,R()*6]);
      }else{
        nb.forEach(function(o){L.ao.push([cx+o[0]*(S/2-.55),cz+o[1]*(S/2-.55),o[0]===1?-Math.PI/2:o[0]===-1?Math.PI/2:o[1]===1?Math.PI:0])});
        if(style==='ville'){
          /* v63 : rue du Centre-ville : marquages au sol, papiers, plots, lampadaires, barils, affiches sur les murs */
          if(!nb.length&&z%7===3&&x%2===0)L.stripe.push([cx,.021,cz,-HALF,0,0]);
          if(!nb.length&&x%7===3&&z%2===0)L.stripe.push([cx,.021,cz,-HALF,0,HALF]);
          if(R()<.07)L.paper.push([cx+(R()-.5)*S*.7,.025,cz+(R()-.5)*S*.7,-HALF,0,R()*6]);
          if(nb.length&&R()<.05)L.cone.push([cx+nb[0][0]*(S/2-.6)+(R()-.5),.35,cz+nb[0][1]*(S/2-.6)+(R()-.5)]);
          if(!nb.length&&(x*5+z*3)%13===0){L.post.push([cx+S*.4,1.6,cz+S*.4]);L.bulb.push([cx+S*.4,3.25,cz+S*.4])}
          if(nb.length&&R()<.06)L['b'+Math.floor(R()*3)].push([cx+nb[0][0]*(S/2-.75),.55,cz+nb[0][1]*(S/2-.75),0,R()*6,0]);
          nb.forEach(function(o){if(R()<.05)L['p'+Math.floor(R()*3)].push([cx+o[0]*(S/2-.02),1.9,cz+o[1]*(S/2-.02),0,o[0]===1?-HALF:o[0]===-1?HALF:o[1]===1?Math.PI:0,0])});
          if(R()<.03)L.bush.push([cx+(R()-.5)*S*.6,.35,cz+(R()-.5)*S*.6,0,R()*6,0,.6+R()*.4,.6]);
        }else{
        if(R()<.03)L.rock.push([cx+(R()-.5)*S*.6,.2,cz+(R()-.5)*S*.6,R(),R()*6,0,.5+R()*.7,.35+R()*.3]);
        if(R()<.06)L.bush.push([cx+(R()-.5)*S*.6,.35,cz+(R()-.5)*S*.6,0,R()*6,0,.7+R()*.5,.6]);
        for(var gt=0;gt<5;gt++){var gx=cx+(R()-.5)*S*.9,gz=cz+(R()-.5)*S*.9;for(var bl2=0;bl2<3;bl2++)L.tuft.push([gx+(R()-.5)*.18,.1,gz+(R()-.5)*.18,(R()-.5)*.5,R()*6,(R()-.5)*.5,.7+R()*.6])}
        if(R()<.05)for(var fl=0;fl<4;fl++)L.flower.push([cx+(R()-.5)*2,.12,cz+(R()-.5)*2,0,0,0,1]);
        if(!nb.length&&(x*5+z*3)%17===0){L.post.push([cx+S*.4,1.6,cz+S*.4]);L.bulb.push([cx+S*.4,3.25,cz+S*.4])}
        if(nb.length&&R()<.05)L['b'+Math.floor(R()*3)].push([cx+nb[0][0]*(S/2-.75),.55,cz+nb[0][1]*(S/2-.75),0,R()*6,0]);
        }
      }
      if(R()<.035)(style==='entrepot'&&R()<.6?L.oil:L.blood).push([cx+(R()-.5)*S*.6,.022+R()*.004,cz+(R()-.5)*S*.6,-HALF,0,R()*6,.5+R()*1.1]);
    }
    if(style==='entrepot'){for(var bz=2;bz<H-1;bz+=4){L.beam.push([W*S/2,WH-.25,(bz+.5)*S]);for(var bx=2;bx<W-1;bx+=5)if(open(bx,bz)){L.shade.push([(bx+.5)*S,WH-.75,(bz+.5)*S]);L.bulb.push([(bx+.5)*S,WH-.92,(bz+.5)*S])}}}
    /* ombre douce au pied des murs */
    if(L.ao.length){var aoIm=new THREE.InstancedMesh(new THREE.PlaneGeometry(S,1.1),new THREE.MeshBasicMaterial({map:TX.ao,transparent:true,depthWrite:false}),L.ao.length),mxA=new THREE.Matrix4(),ryA=new THREE.Matrix4(),rxA=new THREE.Matrix4().makeRotationX(-Math.PI/2);L.ao.forEach(function(a,i){ryA.makeRotationY(a[2]);mxA.makeTranslation(a[0],.026,a[1]).multiply(ryA).multiply(rxA);aoIm.setMatrixAt(i,mxA)});aoIm.renderOrder=1;scene.add(aoIm)}
    /* v56 : touffes d'herbe dans le village */
    if(L.tuft.length){var tf=build(new THREE.ConeGeometry(.04,.24,3),lam({color:0x6a9a3a}),L.tuft);if(tf){var tcol=new THREE.Color();L.tuft.forEach(function(p,i){tcol.setHSL(.24+(i%7)*.012,.5,.38+(i%5)*.04);tf.setColorAt(i,tcol)});tf.instanceColor.needsUpdate=true}}
    var metal=lam({color:0x5a6068}),rust=lam({color:0x7a4a2a});
    build(new THREE.BoxGeometry(1.1,.06,.28),new THREE.MeshBasicMaterial({color:0xfff2c8}),L.lamp);
    flickMat=new THREE.MeshBasicMaterial({color:0xfff2c8});build(new THREE.BoxGeometry(1.1,.06,.28),flickMat,L.flick);
    build(new THREE.CylinderGeometry(.09,.09,S,10),metal,L.pipeH);build(new THREE.CylinderGeometry(.11,.11,WH,10),rust,L.pipeV);
    build(new THREE.TorusGeometry(.16,.035,6,14),lam({color:0xc22d16}),L.valve);
    [0x9a2a1a,0x2a4a8a,0x3a6a2a].forEach(function(c,i){build(new THREE.CylinderGeometry(.4,.4,1.1,14),lam({color:c}),L['b'+i],true);L['b'+i].forEach(function(p){addCol(p[0]-.4,p[2]-.4,p[0]+.4,p[2]+.4)})});
    build(new THREE.CircleGeometry(.6,16),new THREE.MeshBasicMaterial({color:0x4a0606,transparent:true,opacity:.6,depthWrite:false}),L.blood);
    build(new THREE.CircleGeometry(.6,16),new THREE.MeshBasicMaterial({color:0x0c0c0e,transparent:true,opacity:.55,depthWrite:false}),L.oil);
    build(new THREE.PlaneGeometry(.3,.4),new THREE.MeshBasicMaterial({color:0xe8e4da}),L.paper);
    [0,1,2].forEach(function(k){build(new THREE.PlaneGeometry(1.1,1.45),new THREE.MeshLambertMaterial({map:posterTex(k)}),L['p'+k])});
    build(new THREE.BoxGeometry(W*S,.35,.35),lam({color:0x3a5a8a}),L.beam);build(new THREE.ConeGeometry(.45,.35,12,1,true),lam({color:0x2a2c30,side:THREE.DoubleSide}),L.shade);
    build(new THREE.SphereGeometry(.16,10,8),new THREE.MeshBasicMaterial({color:0xffe2a0}),L.bulb);build(new THREE.CylinderGeometry(.07,.09,3.2,8),lam({color:0x26282c}),L.post);
    build(new THREE.DodecahedronGeometry(.6),lam({color:0x8a8a84}),L.rock);build(new THREE.IcosahedronGeometry(.6,1),lam({color:0x3f6a2a}),L.bush);
    build(new THREE.SphereGeometry(.07,6,5),lam({color:0xe8d040,emissive:0x332a00}),L.flower);
    build(new THREE.PlaneGeometry(1.6,.22),new THREE.MeshBasicMaterial({color:0xe8d27a,transparent:true,opacity:.85,depthWrite:false}),L.stripe);
    if(L.cone.length){build(new THREE.ConeGeometry(.26,.7,12),lam({color:0xff6a1a}),L.cone);build(new THREE.CylinderGeometry(.17,.2,.1,12),lam({color:0xf1ece2}),L.cone.map(function(c){return [c[0],c[1]+.02,c[2]]}));L.cone.forEach(function(c){addCol(c[0]-.25,c[2]-.25,c[0]+.25,c[2]+.25)})}
  }
  function zoneSign(name,col,x,z){var c=document.createElement('canvas');c.width=512;c.height=128;var g=c.getContext('2d');g.fillStyle='#141210';g.fillRect(0,0,512,128);g.fillStyle='#'+new THREE.Color(col).multiplyScalar(.85).getHexString();g.fillRect(0,0,512,14);g.fillRect(0,114,512,14);g.fillStyle='#f1ece2';g.font='400 64px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(name.toUpperCase(),256,68);
    var m=new THREE.Mesh(new THREE.PlaneGeometry(S*1.8,S*.45),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(x,2.9,z);scene.add(m)}
  /* objets de décor posés sur les cases « caisse » : ils bloquent comme une caisse, mais changent selon la zone */
  var PM={};function pm(c,o){var k=c+(o?JSON.stringify(o):'');return PM[k]||(PM[k]=new THREE.MeshLambertMaterial(Object.assign({color:c},o||{})))}
  function prop(kind,seed){
    var g=new THREE.Group(),r=rng(seed+3);
    function B(w,h,d,c,x,y,z,o){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof c==='number'?pm(c,o):c);m.position.set(x,y,z);g.add(m);solidMeshes.push(m);return m}
    function C(r1,r2,h,c,x,y,z,rx,o){var m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,14),typeof c==='number'?pm(c,o):c);m.position.set(x,y,z);if(rx)m.rotation.x=rx;g.add(m);solidMeshes.push(m);return m}
    if(kind==='bed'){[0,1].forEach(function(l){var y=l*1.25;B(1.1,.12,2.3,0x4a4f58,0,.45+y,0);B(1,.2,2.1,0x6a7fa8,0,.62+y,0);B(.8,.12,.4,0xe8e4da,0,.78+y,-.8);B(1,.08,1.2,0x3d4f7a,0,.76+y,.4)});[[-.5,-1.1],[.5,-1.1],[-.5,1.1],[.5,1.1]].forEach(function(p){B(.08,2.1,.08,0x3a3f48,p[0],1.05,p[1])})}
    else if(kind==='rack'){B(1.2,2.3,.9,0x22262c,0,1.15,0);for(var i=0;i<14;i++)B(.06,.04,.02,i%3?0x3cff6e:0xff3b3b,-.45+(i%7)*.15,.5+Math.floor(i/7)*1.1,-.46,{emissive:i%3?0x1a8a3a:0x8a1a1a});B(.9,.5,.06,0x0a1a12,0,1.6,-.46,{emissive:0x0f3a20})}
    else if(kind==='medbed'){B(1,.5,2.1,0xd8dce0,0,.4,0);B(.95,.16,2,0xf4f4f0,0,.72,0);B(.8,.14,.4,0xffffff,0,.86,-.75);C(.03,.03,1.9,0x9aa0a8,.7,.95,-.9);B(.18,.3,.08,0xc8e0f0,.7,1.75,-.9);B(.4,.4,.02,0xe2361b,0,1.1,1.06)}
    else if(kind==='gen'){B(2,1.3,1.3,0xd8a520,0,.65,0);B(2.02,.15,1.32,0x141210,0,.9,0);B(.5,.5,1.32,0x3a3a3a,-.7,.4,0);C(.12,.12,.9,0x555555,.6,1.6,0);B(.12,.12,.12,0xff3b3b,-.6,1.36,0,{emissive:0xaa1010})}
    else if(kind==='tank'){B(1.3,.35,1.3,0x3a4048,0,.17,0);C(.55,.55,1.8,0x8ae0e8,0,1.25,0,0,{transparent:true,opacity:.35,emissive:0x115566});var sp=new THREE.Mesh(new THREE.SphereGeometry(.32,12,10),pm(0x6fd16a,{emissive:0x2a8a2a}));sp.position.set(0,1.2,0);g.add(sp);B(1.3,.2,1.3,0x3a4048,0,2.2,0)}
    else if(kind==='table'){B(2.4,.1,1.1,0xb08a60,0,.8,0);[[-1,-.45],[1,-.45],[-1,.45],[1,.45]].forEach(function(p){B(.08,.8,.08,0x5a4a3a,p[0],.4,p[1])});B(2.4,.08,.35,0x8a6a48,0,.45,-.85);B(2.4,.08,.35,0x8a6a48,0,.45,.85);B(.3,.12,.3,0xe8e4da,-.5,.9,0);B(.3,.12,.3,0xe8e4da,.6,.9,.1)}
    else if(kind==='sandbag'){for(var row=0;row<3;row++)for(var sb=0;sb<4-row;sb++){var s=B(.7,.3,.45,0x9a8a60,(sb-(3-row)/2)*.68,.15+row*.29,0);s.rotation.z=(r()-.5)*.1}}
    else if(kind==='pallet'){B(1.6,.15,1.4,0x9a7a50,0,.08,0);var nb=1+Math.floor(r()*3);for(var bx=0;bx<nb;bx++)B(1.4,.55,1.2,bx%2?0xb08a5a:0xa07a4a,0,.43+bx*.56,0)}
    else if(kind==='shelf'){[-1,1].forEach(function(sx){B(.08,2.4,.9,0x2f6fb0,sx*1.1,1.2,0)});for(var sh=0;sh<3;sh++){B(2.3,.06,.9,0xd8a520,0,.3+sh*.85,0);for(var bb=0;bb<3;bb++)if(r()<.75)B(.5,.45,.6,[0xb08a5a,0x6a8ab0,0xc05030][Math.floor(r()*3)],-.75+bb*.75,.56+sh*.85,0)}}
    else if(kind==='ice'){B(1.6,1.6,1.6,0xdff2ff,0,.8,0,{emissive:0x203040});B(.7,.5,.7,0xffffff,.3,1.85,.2,{transparent:true,opacity:.7})}
    else if(kind==='desk'){B(1.6,.08,.8,0x8a6a48,0,.78,0);B(.08,.78,.75,0x5a4a3a,-.75,.39,0);B(.08,.78,.75,0x5a4a3a,.75,.39,0);B(.6,.4,.05,0x141414,0,1.05,-.2,{emissive:0x0a2030});B(.5,.06,.5,0x2a2a2a,0,.45,.6);B(.5,.5,.06,0x2a2a2a,0,.72,.85)}
    else if(kind==='bench'){B(2.2,.12,1,0x6a5a4a,0,.9,0);B(2.1,.85,.9,0x4a4f58,0,.43,0);B(.3,.25,.3,0x3a3f48,.8,1.08,0);B(.5,.3,.3,0xe2361b,-.6,1.11,.1)}
    else if(kind==='car'){var cc=[0xc22d16,0x2f6fb0,0x3a6a3a,0xd8a520][Math.floor(r()*4)];B(1.7,.7,3.2,cc,0,.65,0);B(1.5,.6,1.6,cc,0,1.3,.2);B(1.45,.5,1.55,0x1a2a3a,0,1.32,.2,{emissive:0x050a10});[[-.85,-1.05],[.85,-1.05],[-.85,1.05],[.85,1.05]].forEach(function(p){var w=C(.33,.33,.25,0x141414,p[0],.33,p[1]);w.rotation.z=Math.PI/2})}
    else if(kind==='hay'){var h1=C(.7,.7,1.3,0xd8b850,0,.7,0);h1.rotation.z=Math.PI/2;if(r()<.6){var h2=C(.7,.7,1.3,0xc8a840,0,1.95,0);h2.rotation.z=Math.PI/2}}
    else if(kind==='grave'){B(.8,1.1,.2,0x8a8a8a,0,.55,0);var top=C(.4,.4,.2,0x8a8a8a,0,1.1,0,Math.PI/2);B(1,.12,1.8,0x4a3a2a,0,.06,.8);if(r()<.5){B(.1,.7,.1,0x6a6a6a,.9,.35,-.5);B(.45,.1,.1,0x6a6a6a,.9,.55,-.5)}}
    else if(kind==='pew'){B(2.4,.1,.5,0x6a4a2a,0,.5,0);B(2.4,.7,.08,0x6a4a2a,0,.85,.25);B(.08,.5,.5,0x4a3220,-1.15,.25,0);B(.08,.5,.5,0x4a3220,1.15,.25,0)}
    else if(kind==='sack'){[[0,0],[.55,.2],[-.45,.3]].forEach(function(p,i){var s=new THREE.Mesh(new THREE.SphereGeometry(.42,10,8),pm(0xd8c8a0));s.scale.set(1,.75+i*.05,1.2);s.position.set(p[0],.32,p[1]);g.add(s);solidMeshes.push(s)})}
    else if(kind==='well'){C(.9,.95,.8,0x8a8a88,0,.4,0);C(.75,.75,.82,0x2a4a5a,0,.42,0);B(.12,1.8,.12,0x5a3a22,-.85,1.2,0);B(.12,1.8,.12,0x5a3a22,.85,1.2,0);var rf=B(2.1,.1,1.1,0x7a3a22,0,2.15,0);rf.rotation.z=0}
    else if(kind==='log'){for(var lg=0;lg<3;lg++){var l=C(.3,.3,2.2,0x6a4a2a,(lg-1)*.62,.3,0);l.rotation.z=Math.PI/2;l.rotation.y=Math.PI/2}var l2=C(.3,.3,2.2,0x5a3a22,0,.82,0);l2.rotation.z=Math.PI/2;l2.rotation.y=Math.PI/2}
    else{var m=new THREE.Mesh(new THREE.BoxGeometry(S*.8,1.7,S*.8),lam({map:TX.crate}));m.position.y=.85;m.rotation.y=Math.floor(r()*4)*.2;g.add(m);solidMeshes.push(m)}
    g.rotation.y=Math.floor(r()*4)*Math.PI/2;return g;
  }
  var world0='bunker',VS=.6,STN=['Armurerie','Armurerie avancée','Armurerie lourde'];

  /* ---------- Modèles ---------- */
  function box(w,h,d,col,map){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam(map?{map:map}:{color:col}))}
  function human(body,skin,opts){
    opts=opts||{};var g=new THREE.Group(),sc=opts.sc||1;
    var legs=[box(.26,.85,.28,0x2c2a26),box(.26,.85,.28,0x2c2a26)];legs.forEach(function(l,i){l.geometry.translate(0,-.42,0);l.position.set(i?.16:-.16,.9,0);g.add(l)});
    var torso=box(.62,.75,.36,body);torso.position.y=1.3;g.add(torso);
    var head=box(.4,.4,.4,skin);head.position.y=1.9;head.userData.head=true;g.add(head);
    if(opts.helmet){var hm=box(.46,.16,.46,body);hm.position.y=2.12;g.add(hm)}
    var arms=[box(.2,.7,.22,body),box(.2,.7,.22,body)];arms.forEach(function(a,i){a.geometry.translate(0,-.33,0);a.position.set(i?.42:-.42,1.62,0);g.add(a)});
    if(opts.zombie){arms[0].rotation.x=arms[1].rotation.x=-Math.PI/2.3}
    if(opts.gun){var gun=box(.1,.14,.7,0x1c1c1e);gun.position.set(.42,1.25,-.38);g.add(gun);arms[1].rotation.x=-1.3;arms[0].rotation.x=-1.1;arms[0].rotation.z=-.5}
    if(opts.eyes){var e1=new THREE.Mesh(new THREE.BoxGeometry(.08,.06,.02),new THREE.MeshBasicMaterial({color:opts.eyes}));e1.position.set(-.09,1.95,-.21);var e2=e1.clone();e2.position.x=.09;g.add(e1);g.add(e2)}
    g.scale.setScalar(sc);g.userData.parts={legs:legs,arms:arms,head:head,torso:torso};
    return g;
  }
  /* ---------- Soldat des joueurs en ligne : casque, gilet, brassard d'équipe, fusil, pseudo ---------- */
  function soldier(team,name,skinTone){
    var tc=new THREE.Color(team),dk=tc.clone().multiplyScalar(.45),g=new THREE.Group(),root=new THREE.Group();g.add(root);
    function L(c){return new THREE.MeshLambertMaterial({color:c})}
    var pants=L(0x3a3a34),boot=L(0x1a1714),shirt=L(tc.clone().multiplyScalar(.75).getHex()),vest=L(dk.getHex()),skin=L(skinTone||0xd9a77c),glove=L(0x232220),helm=L(dk.getHex()),band=new THREE.MeshBasicMaterial({color:team}),black=L(0x141414),strap=L(0x2a2620);
    function m(geo,mat,x,y,z,par){var o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;(par||root).add(o);return o}
    var legs=[-.14,.14].map(function(x){var l=new THREE.Group();l.position.set(x,.95,0);root.add(l);m(new THREE.CapsuleGeometry(.12,.36,3,8),pants,0,-.24,0,l);var kn=m(new THREE.BoxGeometry(.2,.14,.08),black,0,-.47,-.1,l);m(new THREE.CapsuleGeometry(.1,.3,3,8),pants,0,-.62,0,l);m(new THREE.BoxGeometry(.18,.14,.32),boot,0,-.88,-.05,l);return l});
    var torso=new THREE.Group();torso.position.y=1;root.add(torso);
    var body=m(new THREE.CapsuleGeometry(.26,.42,4,12),shirt,0,.38,0,torso);body.scale.set(1.12,1,.75);
    var v=m(new THREE.BoxGeometry(.56,.5,.4),vest,0,.42,0,torso);
    [-.14,0,.14].forEach(function(x){m(new THREE.BoxGeometry(.11,.13,.06),strap,x,.3,-.22,torso)});
    m(new THREE.BoxGeometry(.58,.06,.42),strap,0,.12,0,torso);
    var neck=m(new THREE.CylinderGeometry(.08,.09,.12,8),skin,0,.75,0,torso);
    var head=m(new THREE.SphereGeometry(.2,16,12),skin,0,.95,0,torso);head.scale.set(.95,1.05,1);head.userData.head=true;
    var hm=m(new THREE.SphereGeometry(.235,16,10,0,Math.PI*2,0,Math.PI/2),helm,0,1.0,0,torso);hm.scale.set(1,.85,1.05);m(new THREE.TorusGeometry(.235,.025,6,20),helm,0,1.0,0,torso).rotation.x=Math.PI/2;
    var gog=m(new THREE.BoxGeometry(.34,.08,.06),new THREE.MeshLambertMaterial({color:0x222a33,emissive:0x0a1a2a}),0,1.0,-.19,torso);
    var arms=[-.36,.36].map(function(x,i){var a=new THREE.Group();a.position.set(x,.7,0);torso.add(a);m(new THREE.CapsuleGeometry(.085,.26,3,8),shirt,0,-.18,0,a);var bd=m(new THREE.CylinderGeometry(.095,.095,.07,10),band,0,-.1,0,a);m(new THREE.CapsuleGeometry(.075,.24,3,8),shirt,0,-.46,0,a);m(new THREE.SphereGeometry(.08,8,6),glove,0,-.64,0,a);return a});
    arms[1].rotation.x=-1.25;arms[0].rotation.x=-1.05;arms[0].rotation.z=-.55;
    /* fusil tenu à deux mains */
    var gun=new THREE.Group();gun.position.set(.18,.5,-.42);torso.add(gun);
    m(new THREE.BoxGeometry(.08,.13,.6),black,0,0,0,gun);m(new THREE.CylinderGeometry(.025,.025,.35,8),L(0x2a2a2a),0,.02,-.45,gun).rotation.x=Math.PI/2;m(new THREE.BoxGeometry(.06,.18,.08),black,0,-.14,.05,gun);m(new THREE.BoxGeometry(.07,.1,.22),strap,0,-.02,.36,gun);m(new THREE.BoxGeometry(.05,.06,.14),L(0x111111),0,.1,-.05,gun);
    /* pseudo au-dessus de la tête, à la couleur de l'équipe */
    var c=document.createElement('canvas');c.width=256;c.height=64;var cx=c.getContext('2d');cx.fillStyle='rgba(20,18,16,.8)';cx.fillRect(0,8,256,48);cx.fillStyle='#'+tc.getHexString();cx.fillRect(0,8,10,48);cx.font='700 30px "IBM Plex Mono", monospace';cx.fillStyle='#fff';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(String(name||'').slice(0,12),133,33);
    var tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));tag.scale.set(1.3,.32,1);tag.position.y=2.55;tag.renderOrder=5;g.add(tag);
    g.userData.parts={legs:legs,arms:[],head:head,torso:torso};
    return g;
  }
  /* ---------- Zombies : modèle et animations ---------- */
  /* zombies plus réalistes : peau marbrée et veinée, vêtements sales et déchirés, genoux et coudes articulés,
     mains à doigts griffus, visage creusé (orbites, arcade, nez, dents), côtes apparentes chez certains */
  var ZGEO=null,ZTX=null,BLOBG=null,BLOBM=null,ZOUT=null;
  function zTex(){if(ZTX)return ZTX;ZTX={};
    ZTX.skin=tex(256,256,function(g,w,h){g.fillStyle='#d8d8d0';g.fillRect(0,0,w,h);for(var i=0;i<900;i++){var r=4+Math.random()*22;g.fillStyle='rgba('+(Math.random()<.5?'60,70,50':'120,130,100')+','+(Math.random()*.12)+')';g.beginPath();g.arc(Math.random()*w,Math.random()*h,r,0,7);g.fill()}
      g.strokeStyle='rgba(60,40,70,.35)';g.lineWidth=1.2;for(var v=0;v<26;v++){var x=Math.random()*w,y=Math.random()*h;g.beginPath();g.moveTo(x,y);for(var s=0;s<6;s++){x+=(Math.random()-.5)*26;y+=Math.random()*20;g.lineTo(x,y)}g.stroke()}
      for(var b=0;b<14;b++){g.fillStyle='rgba(90,10,10,'+(.25+Math.random()*.4)+')';g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,3+Math.random()*12,2+Math.random()*6,Math.random()*3,0,7);g.fill()}
      for(var d=0;d<8;d++){g.fillStyle='rgba(40,50,30,.35)';g.beginPath();g.arc(Math.random()*w,Math.random()*h,8+Math.random()*14,0,7);g.fill()}});
    ZTX.cloth=tex(256,256,function(g,w,h){g.fillStyle='#cfcac0';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=3){g.fillStyle='rgba(0,0,0,'+(Math.random()*.06)+')';g.fillRect(0,y,w,1)}for(var x=0;x<w;x+=3){g.fillStyle='rgba(255,255,255,'+(Math.random()*.05)+')';g.fillRect(x,0,1,h)}
      var gr=g.createLinearGradient(0,h*.5,0,h);gr.addColorStop(0,'rgba(60,45,30,0)');gr.addColorStop(1,'rgba(60,45,30,.45)');g.fillStyle=gr;g.fillRect(0,0,w,h);
      for(var s=0;s<12;s++){g.fillStyle='rgba('+(Math.random()<.6?'100,15,15':'50,40,25')+','+(.3+Math.random()*.4)+')';g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,6+Math.random()*26,4+Math.random()*16,Math.random()*3,0,7);g.fill()}
      g.fillStyle='rgba(20,15,12,.85)';for(var t=0;t<7;t++){var tx=Math.random()*w,ty=Math.random()*h;g.beginPath();g.moveTo(tx,ty);g.lineTo(tx+8+Math.random()*14,ty+3);g.lineTo(tx+4,ty+10+Math.random()*12);g.closePath();g.fill()}});
    return ZTX}
  function zombieModel(type){
    var T={walker:{shirt:0x6a7a58,skin:0x9aa88a,pants:0x4a4a58,sc:1},runner:{shirt:0x8a4a3a,skin:0xa8b098,pants:0x3a3a48,sc:.92},tank:{shirt:0x4a5040,skin:0x7a8a68,pants:0x33333a,sc:1.55},spitter:{shirt:0x6a4a7a,skin:0xa8a8c0,pants:0x3a3848,sc:1},crawler:{shirt:0x5a6a58,skin:0x98a88a,pants:0x4a4a58,sc:.95},exploder:{shirt:0x6a4c2a,skin:0xb0a088,pants:0x3a342e,sc:1},brute:{shirt:0x6a5a4a,skin:0x8a9a78,pants:0x3a3a42,sc:1.95},armored:{shirt:0x3a4250,skin:0x8a9a80,pants:0x2a2e36,sc:1.08},ghoul:{shirt:0x2a2a30,skin:0xb8bccc,pants:0x2a2a30,sc:.86}}[type]||{shirt:0x6a7a58,skin:0x9aa88a,pants:0x4a4a58,sc:1};
    var tx=zTex(),armM=null;
    if(!ZGEO)ZGEO={thigh:new THREE.CapsuleGeometry(.11,.3,4,10),shin:new THREE.CapsuleGeometry(.09,.3,4,10),foot:new THREE.SphereGeometry(.1,14,10).scale(.8,.55,1.55),up:new THREE.CapsuleGeometry(.075,.24,4,10),fore:new THREE.CapsuleGeometry(.065,.22,4,10),palm:new THREE.BoxGeometry(.09,.1,.05),fing:new THREE.CapsuleGeometry(.014,.06,3,6),claw:new THREE.ConeGeometry(.012,.05,4),
      skull:new THREE.SphereGeometry(.19,18,14),brow:new THREE.BoxGeometry(.26,.05,.08),nose:new THREE.BoxGeometry(.05,.07,.05),ear:new THREE.SphereGeometry(.045,8,6),sock:new THREE.SphereGeometry(.05,10,8),eye:new THREE.SphereGeometry(.022,8,6),tooth:new THREE.BoxGeometry(.022,.035,.02),rib:new THREE.BoxGeometry(.2,.022,.03),neck:new THREE.CylinderGeometry(.075,.09,.16,10),hair:new THREE.ConeGeometry(.04,.12,4)};
    var Gm=ZGEO;
    var skc=new THREE.Color(T.skin);skc.offsetHSL((Math.random()-.5)*.08,(Math.random()-.5)*.1,(Math.random()-.5)*.08);
    var shc=new THREE.Color(T.shirt);shc.offsetHSL((Math.random()-.5)*.08,(Math.random()-.5)*.15,(Math.random()-.5)*.1);
    var g=new THREE.Group(),root=new THREE.Group();g.add(root);
    var skin=new THREE.MeshLambertMaterial({color:skc,map:tx.skin}),shirt=new THREE.MeshLambertMaterial({color:shc,map:tx.cloth}),pants=new THREE.MeshLambertMaterial({color:T.pants,map:tx.cloth}),
      dark=new THREE.MeshLambertMaterial({color:0x1a1412}),boot=new THREE.MeshLambertMaterial({color:0x3a2a1e,map:tx.cloth}),bone=new THREE.MeshLambertMaterial({color:0xd8d0b8}),blood=new THREE.MeshLambertMaterial({color:0x4a0808}),sock=new THREE.MeshLambertMaterial({color:0x0e0a0a});
    function mesh(geo,mat,x,y,z,par){var m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);(par||root).add(m);return m}
    var big=type==='tank'||type==='brute',bareLeg=Math.random()<.5?0:1;
    /* jambes : hanche → cuisse → genou → tibia → pied */
    var knees=[],legs=[-.14,.14].map(function(x,i){var l=new THREE.Group();l.position.set(x,.95,0);root.add(l);mesh(Gm.thigh,pants,0,-.2,0,l);var k=new THREE.Group();k.position.set(0,-.43,0);l.add(k);knees.push(k);mesh(Gm.shin,i===bareLeg&&type!=='brute'?skin:pants,0,-.2,0,k);mesh(Gm.foot,boot,0,-.42,-.06,k);return l});
    if(big){legs.forEach(function(l){l.scale.set(1.35,1,1.3)})}
    var torso=new THREE.Group();torso.position.y=1;root.add(torso);
    var body=mesh(new THREE.CapsuleGeometry(.25,.42,4,14),shirt,0,.38,0,torso);body.scale.set(big?1.5:1.12,1,big?1.1:.78);
    /* chemise déchirée : la peau et les côtes apparaissent par endroits */
    var gash=mesh(new THREE.BoxGeometry(.2,.26,.04),skin,(Math.random()-.5)*.16,.42,-.19,torso);gash.rotation.z=(Math.random()-.5)*.5;
    if(Math.random()<.45&&!big){for(var r=0;r<4;r++){var rb=mesh(Gm.rib,bone,gash.position.x,.32+r*.055,-.215,torso);rb.rotation.z=gash.rotation.z}}
    mesh(new THREE.BoxGeometry(.16,.12,.03),blood,(Math.random()-.5)*.2,.2,-.2,torso);
    if(type==='exploder'){var bm=new THREE.MeshLambertMaterial({color:0xff7a1a,emissive:0xff4a00,emissiveIntensity:.8,map:tx.skin});var bl=mesh(new THREE.SphereGeometry(.3,16,12),bm,0,.28,-.14,torso);bl.scale.set(1.05,.95,.9);for(var vb=0;vb<7;vb++)mesh(new THREE.SphereGeometry(.05+Math.random()*.05,8,6),bm,(Math.random()-.5)*.42,.08+Math.random()*.45,-.3+Math.random()*.05,torso);g.userData.glow=bm}
    if(type==='brute'){var met=new THREE.MeshLambertMaterial({color:0x5a5f66});[-1,1].forEach(function(s){var pl=mesh(new THREE.BoxGeometry(.36,.12,.42),met,s*.5,.8,0,torso);pl.rotation.z=s*.35;for(var sp=0;sp<3;sp++){var spk=mesh(new THREE.ConeGeometry(.04,.16,5),met,s*(.42+sp*.08),.9,(sp-1)*.12,torso);spk.rotation.z=-s*.5}});mesh(new THREE.TorusGeometry(.3,.05,6,16),met,0,.62,0,torso).rotation.x=Math.PI/2}
    if(type==='spitter'){var belly=mesh(new THREE.SphereGeometry(.34,16,12),new THREE.MeshLambertMaterial({color:0x7a5a9a,map:tx.skin}),0,.25,-.12,torso);belly.scale.set(1,.9,.9);mesh(new THREE.SphereGeometry(.08,8,6),new THREE.MeshBasicMaterial({color:0xb05cff}),0,.3,-.43,torso)}
    if(type==='tank'){[-1,1].forEach(function(s){mesh(new THREE.SphereGeometry(.24,12,10),shirt,s*.42,.72,0,torso)})}
    /* v29 : le Blindé porte un gilet et un casque (vise le visage !), la Goule est pâle et lumineuse */
    if(type==='armored'){armM=new THREE.MeshLambertMaterial({color:0x4f5866});mesh(new THREE.BoxGeometry(.52,.46,.42),armM,0,.42,0,torso);mesh(new THREE.BoxGeometry(.18,.14,.05),new THREE.MeshLambertMaterial({color:0xd8c040}),.1,.5,-.22,torso);[-1,1].forEach(function(s){mesh(new THREE.BoxGeometry(.2,.1,.3),armM,s*.33,.72,0,torso)})}
    if(type==='ghoul'){skin.emissive=new THREE.Color(0x1c2438);shirt.emissive=new THREE.Color(0x0a0a14)}
    mesh(Gm.neck,skin,0,.8,-.01,torso);
    /* tête : crâne, arcade, orbites creuses avec une lueur, nez, oreilles, mâchoire avec dents, cheveux épars */
    var head=new THREE.Group();head.position.set(0,.9,-.02);torso.add(head);
    var skull=mesh(Gm.skull,skin,0,.1,0,head);skull.scale.set(.92,1.08,1);skull.userData.head=true;
    mesh(Gm.brow,skin,0,.16,-.15,head);var nose=mesh(Gm.nose,skin,0,.07,-.19,head);nose.rotation.x=-.3;
    [-1,1].forEach(function(s){mesh(Gm.ear,skin,s*.18,.1,0,head).scale.set(.5,1,.8);mesh(Gm.sock,sock,s*.075,.11,-.15,head);mesh(Gm.eye,new THREE.MeshBasicMaterial({color:type==='spitter'?0xc070ff:0xff4020}),s*.075,.11,-.185,head)});
    if(armM){var helm=mesh(new THREE.SphereGeometry(.215,16,10,0,Math.PI*2,0,Math.PI/2),armM,0,.13,.01,head);helm.scale.set(1,.9,1.05);mesh(new THREE.BoxGeometry(.4,.025,.1),armM,0,.13,-.2,head)}
    var jaw=new THREE.Group();jaw.position.set(0,.0,-.04);head.add(jaw);mesh(new THREE.BoxGeometry(.19,.07,.15),skin,0,-.04,-.06,jaw);mesh(new THREE.BoxGeometry(.15,.03,.1),sock,0,-.005,-.09,jaw);
    for(var tt=0;tt<5;tt++){if(Math.random()<.25)continue;mesh(Gm.tooth,bone,(tt-2)*.028,.015,-.135,jaw);mesh(Gm.tooth,bone,(tt-2)*.028,-.02,-.13,jaw)}
    var nh=Math.random()<.3?0:3+Math.floor(Math.random()*5);for(var i=0;i<nh;i++){var hr=mesh(Gm.hair,dark,(Math.random()-.5)*.26,.27,(Math.random()-.5)*.22,head);hr.rotation.set(Math.random()-.5,0,Math.random()-.5)}
    /* bras : épaule → bras → coude → avant-bras → main à 4 doigts griffus */
    var elbows=[],arms=[-1,1].map(function(s){var a=new THREE.Group();a.position.set(s*(type==='tank'?.52:.36),.68,0);torso.add(a);var sleeve=type!=='runner'&&Math.random()<.75;var up=mesh(Gm.up,sleeve?shirt:skin,0,-.17,0,a);if(type==='tank')up.scale.set(1.6,1,1.6);
      var el=new THREE.Group();el.position.set(0,-.36,0);a.add(el);elbows.push(el);var fo=mesh(Gm.fore,skin,0,-.15,0,el);if(type==='tank')fo.scale.set(1.6,1,1.6);
      var hand=new THREE.Group();hand.position.set(0,-.34,0);el.add(hand);mesh(Gm.palm,skin,0,0,0,hand);for(var f=0;f<4;f++){var fg=mesh(Gm.fing,skin,(f-1.5)*.022,-.07,-.01,hand);fg.rotation.x=-.5;var cl=mesh(Gm.claw,bone,(f-1.5)*.022,-.115,-.04,hand);cl.rotation.x=Math.PI-.5}
      if(type==='tank')hand.scale.setScalar(1.5);return a});
    BLOBG=BLOBG||new THREE.PlaneGeometry(1,1);BLOBM=BLOBM||new THREE.MeshBasicMaterial({map:TX.blob,transparent:true,depthWrite:false});var blob=new THREE.Mesh(BLOBG,BLOBM);blob.rotation.x=-Math.PI/2;blob.scale.set(big?1.9:1.3,big?1.9:1.3,1);blob.position.y=.03;blob.renderOrder=1;g.add(blob);g.userData.blob=blob;
    /* v56 : contour noir façon dessin (comme les persos), yeux qui brillent plus fort, ombres portées */
    if(!ZOUT)ZOUT=new THREE.MeshBasicMaterial({color:0x0c0a09,side:THREE.BackSide});
    var outl=!(window.matchMedia&&matchMedia('(pointer:coarse)').matches),list=[];root.traverse(function(o){if(o.isMesh)list.push(o)});
    /* v64 : niveau de détail. Les petits morceaux (doigts, griffes, dents, cheveux…), les contours et les halos sont rangés à part :
       ils sont cachés quand le zombie est loin, et les petits morceaux ne font plus d'ombre (un zombie = ~83 morceaux, ça faisait ramer aux grosses vagues) */
    var det=[],main=[];
    list.forEach(function(o){var gp=o.geometry.parameters||{},big2=(gp.radius||0)>=.06||(gp.width||0)>=.14||(gp.height||0)>=.2;
      if(o.material&&o.material.isMeshBasicMaterial&&o.material.color&&o.material.color.r>.5){o.castShadow=false;o.scale.multiplyScalar(1.35);var halo=new THREE.Mesh(o.geometry,new THREE.MeshBasicMaterial({color:o.material.color,transparent:true,opacity:.35,depthWrite:false}));halo.scale.setScalar(2.2);halo.raycast=function(){};o.add(halo);det.push(halo);return}
      if(!big2){o.castShadow=false;det.push(o);return}
      o.castShadow=true;main.push(o);
      if(outl){if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();var ol=new THREE.Mesh(o.geometry,ZOUT);ol.scale.setScalar(1+Math.min(.07,.014/Math.max(.05,o.geometry.boundingSphere.radius)));ol.raycast=function(){};o.add(ol);det.push(ol)}});
    g.userData.det=det;g.userData.main=main;g.userData.lod=0;
    g.scale.setScalar(T.sc*(.95+Math.random()*.1));
    g.userData.parts={legs:legs,arms:arms,knees:knees,elbows:elbows,torso:torso,head:head,jaw:jaw,root:root,body:body};g.userData.zt=type;
    return g;
  }
  /* animations des zombies : démarche boiteuse propre à chacun, coureurs penchés bras en arrière, rampants au sol,
     attaque en deux temps (armé puis griffe), recul quand on les touche, kamikaze qui gonfle avant d'exploser */
  /* v78 : animations des zombies plus vivantes : mouvements lissés (plus de saccades), le corps tourne en douceur,
     trébuchements, tics de la tête, et au repos ils se balancent bras ballants au lieu de rester figés */
  var ZJ=[['root','rotation','x'],['root','rotation','z'],['root','position','y'],['torso','rotation','y'],['head','rotation','x'],['head','rotation','z'],['head','rotation','y']];
  function zAnim(e,dt,mv){var p=e.m.userData.parts;if(!p||!p.root){zAnim0(e,dt,mv);return}
    var ty0=e.m.rotation.y;if(e.ryaw==null)e.ryaw=ty0;var dy=ty0-e.ryaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));e.ryaw+=dy*Math.min(1,dt*(e.type==='runner'?10:6));e.m.rotation.y=e.ryaw;
    var lim=[].concat(p.legs||[],p.arms||[],p.knees||[],p.elbows||[]),prev=lim.map(function(o){return [o.rotation.x,o.rotation.z]}),pj=ZJ.map(function(j){var o=p[j[0]];return o?o[j[1]][j[2]]:0});
    zAnim0(e,dt,mv);
    var now=performance.now()/1000,ty=e.type||'walker';
    if(ty!=='crawler'&&!(e.rise<1)){
      /* trébuche de temps en temps */
      e.lurchCd=(e.lurchCd==null?2+Math.random()*6:e.lurchCd)-dt;if(mv&&e.lurchCd<=0&&ty!=='runner'){e.lurch=.7;e.lurchCd=4+Math.random()*7}
      if(e.lurch>0){e.lurch-=dt;var lk=Math.sin((.7-e.lurch)/.7*Math.PI);p.root.rotation.x+=lk*.35;p.head.rotation.x+=lk*.4;if(p.arms[0]){p.arms[0].rotation.x-=lk*.7;p.arms[1].rotation.x-=lk*.5;p.arms[0].rotation.z-=lk*.3;p.arms[1].rotation.z+=lk*.3}}
      /* tic nerveux de la tête */
      e.ticCd=(e.ticCd==null?Math.random()*5:e.ticCd)-dt;if(e.ticCd<=0){e.tic=.25;e.ticCd=2+Math.random()*5;e.ticS=Math.random()<.5?-1:1}
      if(e.tic>0){e.tic-=dt;p.head.rotation.z+=Math.sin(e.tic*40)*.25*e.ticS;p.head.rotation.y=e.ticS*.35*Math.sin(Math.max(0,e.tic)/.25*Math.PI)}else p.head.rotation.y=0;
      /* au repos : bras ballants qui se balancent */
      if(!mv&&!(e.atk>0)&&p.arms[0]){var sw=Math.sin(now*1.7+(e.x||0));p.arms[0].rotation.x=-.35+sw*.12;p.arms[1].rotation.x=-.25-sw*.1;if(p.elbows){p.elbows[0].rotation.x=-.25;p.elbows[1].rotation.x=-.35}p.root.rotation.x=.2+Math.sin(now*.9+(e.z||0))*.05;p.root.rotation.z+=Math.sin(now*.7+(e.x||0))*.06}
    }
    var k=Math.min(1,dt*(ty==='runner'||e.charge>0?22:14));if(e.atk>0)k=Math.min(1,dt*26);
    lim.forEach(function(o,i){o.rotation.x=prev[i][0]+(o.rotation.x-prev[i][0])*k;o.rotation.z=prev[i][1]+(o.rotation.z-prev[i][1])*k});
    ZJ.forEach(function(j,i){var o=p[j[0]];if(o)o[j[1]][j[2]]=pj[i]+(o[j[1]][j[2]]-pj[i])*k})}
  function zAnim0(e,dt,mv){
    var p=e.m.userData.parts,ty=e.type||'walker',fast=ty==='runner'?1.9:ty==='tank'||ty==='brute'?.65:ty==='crawler'?1.2:ty==='exploder'?1.5:1;
    if(e.limp===undefined){e.limp=Math.random()*.45;e.side=Math.random()<.5?-1:1;e.armUp=Math.random()<.35}
    if(e.charge>0)fast*=2.2;
    e.anim=(e.anim||Math.random()*6)+dt*(mv?7*fast:1.5);var s=Math.sin(e.anim),c=Math.cos(e.anim),now=performance.now()/1000;
    var atk=e.atk>0?1-e.atk/.45:0;e.atk=Math.max(0,(e.atk||0)-dt);
    var wind=atk<.45?atk/.45:1,swipe=atk<.45?0:(atk-.45)/.55;
    e.flinch=Math.max(0,(e.flinch||0)-dt);
    if(ty==='crawler'){
      p.root.rotation.x=-1.25+e.flinch*.5;p.root.position.y=.2+(mv?Math.abs(s)*.04:0);p.root.position.z=.85;
      p.legs[0].rotation.x=.3+(mv?s*.15:0);p.legs[1].rotation.x=.5-(mv?s*.12:0);
      p.arms[0].rotation.x=mv?2.6+s*.45:2.7;p.arms[1].rotation.x=mv?2.6-s*.45:2.7;p.arms[0].rotation.z=-.25;p.arms[1].rotation.z=.25;
      if(atk){p.arms[0].rotation.x=3.1-swipe*1.1;p.arms[1].rotation.x=3-swipe*1}
      p.head.rotation.x=1.4;p.head.rotation.z=Math.sin(now*2+e.x)*.25;p.jaw.rotation.x=.2+Math.abs(Math.sin(now*6))*.4;
    }else{
      var amp=(ty==='runner'?.95:.7),lA=amp*(1-e.limp*(e.side>0?1:0)),lB=amp*(1-e.limp*(e.side<0?1:0));
      p.legs[0].rotation.x=mv?s*lA:0;p.legs[1].rotation.x=mv?-s*lB:0;
      p.root.position.y=mv?Math.abs(c)*.05-e.limp*.04*Math.max(0,s*e.side):0;
      if(ty==='runner'){p.arms[0].rotation.x=mv?.5-s*1.1:-1.2;p.arms[1].rotation.x=mv?.5+s*1.1:-1.2}
      else{var reach=e.armUp?-1.5:-1.15;p.arms[0].rotation.x=reach+s*.22;p.arms[1].rotation.x=(e.armUp?-1.45:-.5)-s*.18}
      if(atk){p.arms[0].rotation.x=-2.7+wind*-.2+swipe*2.6;p.arms[1].rotation.x=-2.5+swipe*2.1}
      p.arms[0].rotation.z=-.12+Math.sin(now*2+1)*.08;p.arms[1].rotation.z=.12-Math.sin(now*2)*.08;
      var lean=ty==='runner'?.45:ty==='tank'||ty==='brute'?.22:ty==='exploder'?.3:.12;if(e.charge>0)lean=.55;
      p.root.rotation.x=lean+wind*.15-swipe*.25-e.flinch*1.6;p.root.rotation.z=Math.sin(e.anim*.5)*(ty==='tank'||ty==='brute'?.05:.09)+e.limp*.18*e.side;
      p.head.rotation.z=Math.sin(now*1.3+(e.x||0))*.3+e.limp*.2;p.head.rotation.x=atk?.35:-.1;p.jaw.rotation.x=.15+Math.abs(Math.sin(now*7+(e.z||0)))*.35+(atk?.4:0);
    }
    /* genoux qui plient au pas, coudes qui se tendent pour griffer, buste qui tourne avec la marche */
    if(p.knees){var kA,kB,kk=ty==='runner'?1.35:ty==='brute'||ty==='tank'?.7:.95;
      if(ty==='crawler'){kA=-.25;kB=-.5-(mv?Math.abs(s)*.3:0)}else{kA=mv?-(.1+Math.max(0,c)*kk):-.08;kB=mv?-(.1+Math.max(0,-c)*kk):-.08}
      p.knees[0].rotation.x=kA;p.knees[1].rotation.x=kB}
    if(p.elbows){var eA,eB,tw=Math.sin(now*11+(e.x||0))*.05;
      if(ty==='runner'&&mv){eA=-1.35;eB=-1.35}else if(ty==='crawler'){eA=-.4+(mv?s*.4:0);eB=-.4-(mv?s*.4:0)}else{eA=(e.armUp?-.25:-.55)+tw;eB=(e.armUp?-.35:-.85)-tw}
      if(atk){var cock=-1.5*(1-swipe);eA=cock;eB=cock*.85}
      p.elbows[0].rotation.x=eA;p.elbows[1].rotation.x=eB}
    if(ty!=='crawler'&&p.torso){p.torso.rotation.y=mv?s*.14:Math.sin(now*.8+(e.z||0))*.05;p.torso.position.y=1+(mv?0:Math.sin(now*1.6+(e.x||0))*.012)}
    if(ty==='exploder'&&e.m.userData.glow){var fu=e.fuse>0?1-e.fuse/.7:0,pul=.6+Math.sin(now*(fu?30:6))*.4;e.m.userData.glow.emissiveIntensity=pul+fu*2;p.body.scale.set(1.15+fu*.35,1+fu*.25,.78+fu*.4)}
    if(e.kbx||e.kbz){p.root.rotation.z+=(e.kbx||0)*.05}
    if(e.rise!==undefined&&e.rise<1){e.rise=Math.min(1,e.rise+dt*1.1);e.m.position.y=-1.9*(1-e.rise);p.arms[0].rotation.x=p.arms[1].rotation.x=-2.8+Math.sin(now*9)*.3}
  }
  function animWalk(e,dt,moving){var p=e.m.userData.parts;e.anim=(e.anim||0)+dt*(moving?9:0);var s=Math.sin(e.anim)*.6*(moving?1:0);p.legs[0].rotation.x=s;p.legs[1].rotation.x=-s;if(e.kind==='z'){p.arms[0].rotation.x=-1.35+s*.2;p.arms[1].rotation.x=-1.35-s*.2}}
  /* Armes détaillées : canon vers -z, poignée vers l'origine */
  function buildGun(type,col){
    if(GUNS[type]&&GUNS[type].model){if(col==null||col===0x2b2b30||col===0x2a2724)col=GUNS[type].col;type=GUNS[type].model}
    var g=new THREE.Group(),body=new THREE.MeshStandardMaterial({color:new THREE.Color(col).offsetHSL(0,0,.08),roughness:.55,metalness:.1}),steel=new THREE.MeshStandardMaterial({color:0x44474e,roughness:.42,metalness:.35}),bright=new THREE.MeshStandardMaterial({color:0x8a8e96,roughness:.3,metalness:.45}),grip=new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.85});
    function box(w,h,d,x,y,z,mat,rx){var q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);q.position.set(x,y,z);if(rx)q.rotation.x=rx;g.add(q);return q}
    function cyl(r1,r2,len,x,y,z,mat,seg){var q=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,seg||14),mat);q.rotation.x=Math.PI/2;q.position.set(x,y,z);g.add(q);return q}
    function guard(z,y,r){var t=new THREE.Mesh(new THREE.TorusGeometry(r||.045,.008,6,14,Math.PI),steel);t.rotation.set(0,Math.PI/2,Math.PI);t.position.set(0,y,z);g.add(t);box(.012,.03,.01,0,y-.005,z-.005,steel)}
    /* v29 : viseur holographique fin (cadre, verre teinté, réticule), au lieu d'un gros bloc */
    function holo(y,z){var fr=new THREE.MeshStandardMaterial({color:0x1c1d20,roughness:.5,metalness:.3}),w=.072,hh=.052;box(.034,.016,.1,0,y-hh/2-.014,z,steel);box(.006,hh,.03,-w/2,y,z,fr);box(.006,hh,.03,w/2,y,z,fr);box(w+.006,.008,.04,0,y+hh/2,z,fr);box(w,.006,.03,0,y-hh/2,z,fr);
      var gl=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),new THREE.MeshBasicMaterial({color:0x8fd4ff,transparent:true,opacity:.16,depthWrite:false}));gl.position.set(0,y,z+.005);g.add(gl);
      var rd=new THREE.Mesh(new THREE.RingGeometry(.006,.009,16),new THREE.MeshBasicMaterial({color:0xff3b1f,transparent:true,opacity:.9,depthWrite:false}));rd.position.set(0,y,z);g.add(rd)}
    if(type==='pistol'){
      var slide=box(.068,.07,.36,0,.045,-.12,steel);for(var i=0;i<5;i++)slide.add((function(z){var q=new THREE.Mesh(new THREE.BoxGeometry(.07,.05,.006),bright);q.position.set(0,.005,.14+z*.012);return q})(i));g.userData.slide=slide;
      g.userData.mag=box(.046,.13,.06,0,-.17,.035,bright,.22);
      box(.06,.05,.27,0,-.005,-.1,body);cyl(.014,.014,.06,0,.04,-.32,bright,10);
      box(.058,.17,.085,0,-.1,.02,grip,.22);box(.062,.12,.006,0,-.1,.065,body,.22);
      guard(-.07,-.035);box(.012,.02,.01,0,.088,-.27,steel);box(.04,.018,.012,0,.088,.04,steel);
    }else if(type==='rifle'){
      box(.08,.1,.38,0,.02,-.12,body);box(.075,.09,.3,0,.02,-.45,steel);for(var v=0;v<4;v++)box(.08,.02,.03,0,.035,-.36-v*.06,grip);
      cyl(.017,.017,.26,0,.03,-.71,bright);cyl(.025,.025,.06,0,.03,-.84,steel);
      var mag=box(.05,.17,.08,0,-.1,-.2,steel,.18);mag.add((function(){var q=new THREE.Mesh(new THREE.BoxGeometry(.05,.06,.08),steel);q.position.set(0,-.1,.03);q.rotation.x=.27;return q})());g.userData.mag=mag;
      box(.055,.15,.07,0,-.09,.04,grip,.3);guard(-.08,-.04);
      box(.07,.08,.26,0,0,.21,body);box(.07,.13,.05,0,-.02,.33,body);box(.04,.04,.18,0,.08,.15,steel);
      g.userData.slide=box(.02,.03,.05,.045,.045,-.05,bright);holo(.1,-.15);
    }else if(type==='shotgun'){
      cyl(.028,.028,.78,0,.035,-.5,steel);cyl(.022,.022,.6,0,-.015,-.43,steel);
      var pump=box(.075,.07,.22,0,-.015,-.46,body);for(var r=0;r<5;r++)box(.078,.072,.012,0,-.015,-.39-r*.035,grip);g.userData.pump=pump;
      box(.085,.11,.24,0,.01,-.04,steel);box(.06,.15,.07,0,-.1,.08,grip,.3);guard(.0,-.05);
      box(.07,.09,.3,0,-.02,.26,body,-.1);box(.075,.15,.06,0,-.05,.41,grip);box(.012,.016,.012,0,.07,-.86,bright);
    }else if(type==='magnum'){
      box(.064,.085,.2,0,.035,-.06,steel);cyl(.024,.024,.32,0,.05,-.31,bright);box(.03,.026,.32,0,.078,-.31,steel);
      var drum=cyl(.047,.047,.095,0,.03,-.045,bright,12);for(var f=0;f<6;f++){var fl=new THREE.Mesh(new THREE.BoxGeometry(.012,.096,.012),steel);fl.position.set(Math.cos(f)*.046,0,Math.sin(f)*.046);drum.add(fl)}g.userData.drum=drum;
      box(.052,.16,.085,0,-.1,.06,grip,.38);box(.056,.11,.006,0,-.1,.1,body,.38);guard(-.02,-.035);box(.016,.045,.03,0,.085,.07,steel,-.4);
      box(.01,.03,.012,0,.1,-.46,bright);box(.036,.02,.014,0,.094,.03,steel);
    }else if(type==='smg'){
      box(.075,.1,.32,0,.02,-.1,body);box(.062,.075,.16,0,.02,-.34,steel);for(var sv=0;sv<4;sv++)box(.064,.012,.02,0,.06,-.29-sv*.035,grip);cyl(.015,.015,.1,0,.025,-.47,bright);
      g.userData.mag=box(.042,.2,.06,0,-.15,-.13,steel,.05);box(.05,.14,.065,0,-.09,.03,grip,.25);guard(-.04,-.035);
      box(.016,.016,.22,.025,.0,.24,steel);box(.016,.016,.22,-.025,.0,.24,steel);box(.07,.09,.025,0,-.03,.35,grip);
      holo(.098,-.06);box(.01,.03,.01,0,.085,-.38,bright);g.userData.slide=box(.016,.02,.04,.042,.05,-.02,bright);
    }else if(type==='lmg'){
      box(.1,.13,.42,0,.02,-.1,body);cyl(.023,.023,.6,0,.03,-.6,bright);var hs=box(.075,.055,.4,0,.075,-.46,steel);for(var ho=0;ho<6;ho++){var hole2=new THREE.Mesh(new THREE.BoxGeometry(.077,.02,.025),grip);hole2.position.set(0,0,-.16+ho*.065);hs.add(hole2)}
      g.userData.mag=box(.1,.13,.14,.07,-.09,-.12,new THREE.MeshStandardMaterial({color:0x4f5d33,roughness:.7}));box(.09,.02,.05,.04,.02,-.12,new THREE.MeshStandardMaterial({color:0xc9a030,metalness:.6,roughness:.4}));
      box(.03,.05,.16,0,.13,-.16,grip);box(.06,.15,.075,0,-.09,.06,grip,.3);guard(-.02,-.045);box(.08,.12,.28,0,-.01,.27,body);box(.08,.17,.05,0,-.04,.42,grip);
      holo(.11,.02);box(.01,.045,.01,0,.09,-.86,bright);g.userData.slide=box(.02,.025,.05,.055,.04,-.02,bright);
      [-1,1].forEach(function(s){var leg=box(.012,.22,.012,s*.04,-.1,-.78,steel);leg.rotation.z=s*.25});
    }else if(type==='launcher'){
      cyl(.052,.052,.5,0,.03,-.32,body);cyl(.06,.06,.06,0,.03,-.58,steel);box(.09,.12,.2,0,.0,-.02,steel);
      g.userData.mag=cyl(.085,.085,.16,0,-.02,-.1,steel,10);box(.052,.15,.07,0,-.1,.08,grip,.3);guard(.02,-.05);
      box(.045,.12,.05,0,-.08,-.38,grip,-.12);box(.065,.1,.26,0,-.01,.26,body);box(.07,.15,.04,0,-.04,.4,grip);
      box(.04,.06,.015,0,.115,-.12,bright);box(.012,.04,.012,0,.105,-.52,bright);box(.03,.02,.06,.05,.06,-.1,bright);
    }else if(type==='minigun'){
      box(.13,.15,.34,0,0,-.02,body);box(.1,.1,.12,0,0,.2,steel);
      var spin=new THREE.Group();spin.position.set(0,0,-.2);g.add(spin);
      for(var b6=0;b6<6;b6++){var a6=b6/6*Math.PI*2,br=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.62,10),bright);br.rotation.x=Math.PI/2;br.position.set(Math.cos(a6)*.045,Math.sin(a6)*.045,-.3);spin.add(br)}
      [-.08,-.4,-.58].forEach(function(z){var rg=new THREE.Mesh(new THREE.CylinderGeometry(.068,.068,.035,16),steel);rg.rotation.x=Math.PI/2;rg.position.set(0,0,z);spin.add(rg)});g.userData.spin=spin;
      g.userData.mag=box(.12,.16,.16,.1,-.1,0,new THREE.MeshStandardMaterial({color:0x4f5d33,roughness:.7}));
      box(.035,.08,.26,0,.13,-.04,grip);box(.06,.17,.07,0,-.13,.1,grip,.2);box(.045,.12,.05,0,-.1,-.3,grip);box(.03,.03,.04,0,.1,-.16,bright);
    }else if(type==='ray'){
      var glow=new THREE.MeshStandardMaterial({color:0x7dff6a,emissive:0x3cff3c,emissiveIntensity:1.2,roughness:.3}),chrome=new THREE.MeshStandardMaterial({color:0xc8ccd4,roughness:.25,metalness:.7}),red=new THREE.MeshStandardMaterial({color:0xc22d16,roughness:.45});
      var bod=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),red);bod.scale.set(.9,1,1.5);bod.position.set(0,.03,-.06);g.add(bod);
      cyl(.025,.035,.24,0,.04,-.27,chrome);[-.18,-.25,-.32].forEach(function(z){var t=new THREE.Mesh(new THREE.TorusGeometry(.045,.012,8,20),glow);t.position.set(0,.04,z);g.add(t)});
      var tip=new THREE.Mesh(new THREE.SphereGeometry(.03,12,8),glow);tip.position.set(0,.04,-.4);g.add(tip);g.userData.tip=tip;
      box(.05,.15,.075,0,-.1,.05,grip,.3);guard(-.02,-.04);var fin=box(.012,.07,.1,0,.12,.0,chrome);fin.rotation.x=-.3;box(.012,.035,.012,0,.1,-.34,chrome);
      g.userData.mag=cyl(.03,.03,.1,0,-.05,-.12,glow,10);
    }else{
      cyl(.02,.024,.68,0,.04,-.72,steel);cyl(.03,.03,.08,0,.04,-1.07,steel);
      box(.075,.09,.34,0,.02,-.2,body);box(.065,.08,.26,0,.015,-.45,body);
      cyl(.04,.04,.32,0,.13,-.2,steel);cyl(.052,.04,.07,0,.13,-.39,steel);cyl(.046,.04,.06,0,.13,-.02,steel);
      var lens=new THREE.Mesh(new THREE.CircleGeometry(.042,16),new THREE.MeshStandardMaterial({color:0x2a6aa0,emissive:0x0a2040,roughness:.1,metalness:.5}));lens.position.set(0,.13,-.43);lens.rotation.y=Math.PI;g.add(lens);
      box(.02,.05,.02,0,.08,-.26,steel);box(.02,.05,.02,0,.08,-.13,steel);
      var boltG=new THREE.Group();boltG.position.set(.03,.05,-.02);g.add(boltG);var bolt=new THREE.Mesh(new THREE.BoxGeometry(.012,.012,.07),bright);bolt.position.set(.02,0,0);bolt.rotation.y=-.6;boltG.add(bolt);var knob=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),bright);knob.position.set(.045,0,.02);boltG.add(knob);g.userData.bolt=boltG;
      g.userData.mag=box(.05,.09,.09,0,-.06,-.2,steel);box(.055,.14,.07,0,-.09,.05,grip,.25);guard(-.05,-.04);
      box(.07,.1,.34,0,-.02,.26,body,-.08);box(.06,.05,.14,0,.05,.22,body);box(.072,.16,.04,0,-.05,.44,grip);
      [-1,1].forEach(function(s){var leg=box(.012,.012,.22,s*.025,-.02,-.72,steel);leg.rotation.y=s*.05});
    }
    ['slide','mag','pump','bolt'].forEach(function(k){var o=g.userData[k];if(o){o.userData.p0=o.position.clone();o.userData.r0=o.rotation.clone()}});
    g.traverse(function(o){if(o.isMesh)o.castShadow=true});
    return g;
  }
  function gunModel(type,col){return buildGun(type,col)}
  function setViewGun(){
    while(vscene.children.length>3)vscene.remove(vscene.children[3]);
    var gg=new THREE.Group(),gun=gunModel(P.gun,upLv(P.gun)?UP_COL[upLv(P.gun)]:GUN_SKINS[skins.gun].c),GD=GUNS[P.gun];gg.add(gun);gg.userData.gun=gun;
    /* bras et mains : gants, doigts repliés sur la poignée, manches de la tenue */
    var PA=PP.perso?PP.perso.get():null,tc=new THREE.Color(PA?PA.topCol:CH_SKINS[skins.ch].c),glove=new THREE.MeshStandardMaterial({color:0x2a2724,roughness:.85}),knuck=new THREE.MeshStandardMaterial({color:0x3a3632,roughness:.7}),
      sleeve=new THREE.MeshStandardMaterial({color:tc.getHex(),roughness:.9}),cuff=new THREE.MeshStandardMaterial({color:tc.clone().multiplyScalar(.55).getHex(),roughness:.9}),skinM=new THREE.MeshStandardMaterial({color:PA?PA.skin:0xc98f68,roughness:.65});
    function limb(par,a,dir,len,r,mat){var d=new THREE.Vector3(dir[0],dir[1],dir[2]).normalize(),m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,12),mat);m.position.set(a[0]+d.x*len/2,a[1]+d.y*len/2,a[2]+d.z*len/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);par.add(m);return m}
    function seg(par,x,y,z,len,r,ax){var m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,3,8),glove);m.position.set(x,y,z);if(ax==='z')m.rotation.x=Math.PI/2;else if(ax==='x')m.rotation.z=Math.PI/2;par.add(m);return m}
    // main droite sur la poignée
    var rh=new THREE.Group();rh.position.set(GD.grip[0],GD.grip[1],GD.grip[2]);gg.add(rh);
    var palm=new THREE.Mesh(new THREE.BoxGeometry(.026,.1,.085),glove);palm.position.set(.036,0,.012);rh.add(palm);
    var back=new THREE.Mesh(new THREE.BoxGeometry(.06,.07,.06),glove);back.position.set(.024,.01,.07);rh.add(back);
    for(var f=0;f<4;f++){var fy=.036-f*.025;seg(rh,.032,fy,-.038,.018,.0115,'z');seg(rh,.004,fy,-.052,.03,.011,'x');seg(rh,-.03,fy,-.04,.012,.0105,'z');var kn=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),knuck);kn.position.set(.034,fy,-.05);rh.add(kn)}
    var th=seg(rh,-.03,.052,.0,.04,.012,'z');th.rotation.y=.3;
    limb(rh,[.03,.0,.09],[.24,-.42,.86],.36,.05,sleeve);limb(rh,[.026,.005,.075],[.24,-.42,.86],.03,.043,skinM);
    var c1=new THREE.Mesh(new THREE.CylinderGeometry(.056,.056,.05,14),cuff);c1.position.set(.06,-.055,.2);c1.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(.24,-.42,.86).normalize());rh.add(c1);
    // main gauche : sous le garde-main, ou en appui sous la main droite au pistolet
    var lh=new THREE.Group(),hg=GD.hg||[GD.grip[0]-.03,GD.grip[1]-.045,GD.grip[2]-.01];lh.position.set(hg[0],hg[1],hg[2]);gg.add(lh);
    if(GD.hg){var lp=new THREE.Mesh(new THREE.BoxGeometry(.085,.024,.075),glove);lp.position.set(-.004,-.04,0);lh.add(lp);
      for(var lf=0;lf<4;lf++){var fz=-.03+lf*.021;seg(lh,.04,-.02,fz,.026,.011);seg(lh,.042,.016,fz,.012,.0105)}
      var lt=seg(lh,-.042,-.012,.012,.04,.012,'z');lt.rotation.y=-.25;
      limb(lh,[-.02,-.05,.04],[-.42,-.5,.76],.42,.05,sleeve);
      var w=new THREE.Mesh(new THREE.BoxGeometry(.05,.03,.045),new THREE.MeshStandardMaterial({color:0x151515,roughness:.4,metalness:.4}));w.position.set(-.06,-.1,.13);lh.add(w);
    }else{lh.rotation.z=-.5;var lp2=new THREE.Mesh(new THREE.BoxGeometry(.03,.09,.08),glove);lp2.position.set(-.03,0,.0);lh.add(lp2);for(var pf=0;pf<4;pf++)seg(lh,-.002,.03-pf*.022,-.045,.03,.011,'x');limb(lh,[-.035,-.02,.05],[-.38,-.48,.78],.42,.05,sleeve)}
    gg.userData.lh=lh;gg.userData.lh0=lh.position.clone();
    var bb=new THREE.Box3().setFromObject(gun),mz=bb.min.z-.02;
    var fl=new THREE.Mesh(new THREE.PlaneGeometry(.22,.22),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0,depthWrite:false}));
    fl.position.set(0,.03,mz);gg.add(fl);muzzle=fl;var fl2=new THREE.Mesh(new THREE.PlaneGeometry(.12,.34),fl.material);fl2.position.copy(fl.position);fl2.rotation.y=Math.PI/2;gg.add(fl2);var core=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xfff6d0,transparent:true,opacity:0}));core.position.copy(fl.position);gg.add(core);gg.userData.core=core;
    gg.scale.setScalar(VS);viewGun=gg;vscene.add(gg);
  }
  function pickupMesh(type){
    if(PWD[type])return pwMesh(type);var g=new THREE.Group();
    if(type==='med'){g.add(box(.6,.4,.4,0,TX.med))}
    else if(type==='ammo'){g.add(box(.6,.35,.35,0,TX.ammo))}
    else if(type==='coin'){var c=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.06,18),lam({color:0xf0c030,emissive:0x664400}));c.rotation.x=Math.PI/2;g.add(c)}
    else{var gm=gunModel(type,GUN_SKINS[0].c);gm.scale.setScalar(1.6);g.add(gm);var ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.04,6,24),new THREE.MeshBasicMaterial({color:0xe2361b}));ring.rotation.x=Math.PI/2;ring.position.y=-.55;g.add(ring)}
    return g;
  }

  /* ---------- État ---------- */
  var pk={},mode='zombie',mapId='bunker',P=null,ents=[],items=[],shots=[],running=false,paused=false,raf=0,last=0,keys={},mouseDown=false,aiming=false,wave=0,waveT=0,kills=0,zone=null,feed=[],stats={},lastInput=0,online=false,auth=true,remotes={},round=null,dead=false,deadMsg='',chatOpen=false,bigMap=false,itemSeq=0;
  var shopOpen=false,near=null,waveLeft=0,spawnT=0,booms=[],nades=[];
  function newPlayer(sp){return {x:sp.x,z:sp.z,y:0,vy:0,yaw:Math.random()*6.28,pitch:0,hp:100,ar:0,pts:500,earned:0,guns:{pistol:{mag:12,res:Infinity}},inv:['pistol'],gun:'pistol',prev:'pistol',cd:0,rel:0,kick:0,bob:0,afk:false,shotN:0,lastHurt:0,by:'',slide:0,slideCd:0,crouch:0,aimT:0,fastRel:false,perks:{},up:{}}}
  /* v80 : loots spéciaux (10 % de chance quand un zombie meurt) : MUNITION MAX, BRASS BRASS AU MAX, SOLDE, TSAR BOMBA, INSTA KILL, FULL HEAL */
  var PW={x2:0,sale:0,tsar:0,insta:0},PWK=['xmax','x2','sale','tsar','insta','fheal'],
    PWD={xmax:{n:'MUNITION MAX',c:'#3fa9ff'},x2:{n:'BRASS BRASS AU MAX',c:'#3fa9ff',t:30},sale:{n:'SOLDE',c:'#3fe09a',t:30},tsar:{n:'TSAR BOMBA',c:'#ff8a3d',t:30},insta:{n:'INSTA KILL',c:'#e2361b',t:15},fheal:{n:'FULL HEAL',c:'#3fa9ff'}};
  function pwOn(k,from){var d=PWD[k];if(!d||!P)return;A.buy();addFeed((from?from+' a pris ':'')+d.n);center(d.n);setTimeout(function(){if(UI.center.textContent===d.n)center('')},1600);
    if(k==='xmax'){Object.keys(P.guns).forEach(function(g){var a=P.guns[g];if(!a||!GUNS[g])return;a.mag=magOf(g);if(a.res!==Infinity)a.res=Math.max(a.res,Math.round((isFinite(GUNS[g].res)?GUNS[g].res:GUNS[g].mag*4)*1.5))})}
    else if(k==='fheal'){if(!dead&&!P.down)P.hp=maxHp()}
    else{PW[k]=d.t;if(k==='tsar'||k==='insta')pwZ()}
    hud();pwHud(true)}
  function pwZ(){if(coop&&!auth)return;ents.forEach(function(e){if(!e.alive||e.kind!=='z')return;if(PW.tsar>0&&!e.tsar){e.tsar=1;e.hp=Math.max(1,Math.ceil(e.hp/2))}if(PW.insta>0&&!e.boss)e.hp=Math.min(e.hp,1)})}
  var pwT=0;function pwStep(dt){var any=false;Object.keys(PW).forEach(function(k){if(PW[k]>0){PW[k]=Math.max(0,PW[k]-dt);any=true;if(PW[k]===0)addFeed(PWD[k].n+' terminé')}});if(PW.tsar>0||PW.insta>0)pwZ();pwT-=dt;if(pwT<=0||!any&&UI.pw&&!UI.pw.hidden){pwT=.2;pwHud()}}
  function pwHud(){if(!cv.parentNode)return;if(!UI.pw){UI.pw=document.createElement('div');UI.pw.className='fx-pw';cv.parentNode.appendChild(UI.pw)}
    var h=Object.keys(PW).filter(function(k){return PW[k]>0}).map(function(k){var d=PWD[k],pc=PW[k]/d.t*100;return '<div class="pw-r'+(PW[k]<5?' end':'')+'" style="--c:'+d.c+'"><i>'+pwIco(k)+'</i><span>'+d.n+'</span><b>'+Math.ceil(PW[k])+'</b><em style="width:'+pc+'%"></em></div>'}).join('');
    UI.pw.hidden=!h;if(UI.pw._h!==h){UI.pw._h=h;UI.pw.innerHTML=h}}
  function pwIco(k){return {x2:'🪙',sale:'%',tsar:'☢',insta:'☠',xmax:'▮',fheal:'✚'}[k]||'★'}
  function pwTex(k){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d');
    if(k==='sale'){g.fillStyle='#e2361b';g.beginPath();for(var i=0;i<24;i++){var a=i/24*Math.PI*2,r=i%2?54:62;g.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r)}g.fill();g.fillStyle='#fff';g.font='bold 40px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('-50%',64,66)}
    else if(k==='x2'){g.fillStyle='#2f7fe0';g.beginPath();g.arc(64,64,60,0,7);g.fill();g.strokeStyle='#bfe0ff';g.lineWidth=7;g.beginPath();g.arc(64,64,48,0,7);g.stroke();g.fillStyle='#fff';g.font='bold 44px Anton, Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('x2',64,67)}
    else if(k==='tsar'){g.fillStyle='#f3c623';g.beginPath();g.arc(64,64,60,0,7);g.fill();g.fillStyle='#141210';for(var j=0;j<3;j++){var a0=j*Math.PI*2/3-Math.PI/2-.5;g.beginPath();g.moveTo(64,64);g.arc(64,64,52,a0,a0+1);g.fill()}g.fillStyle='#f3c623';g.beginPath();g.arc(64,64,13,0,7);g.fill();g.fillStyle='#141210';g.beginPath();g.arc(64,64,8,0,7);g.fill()}
    var t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
  var PWG=null;function pwGlow(){if(PWG)return PWG;var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.4,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);PWG=new THREE.CanvasTexture(c);return PWG}
  function pwMesh(k){var g=new THREE.Group(),blue=lam({color:0x2f7fe0,emissive:0x0a2a66}),wh=lam({color:0xf4f1ea,emissive:0x333333}),d=PWD[k],col=new THREE.Color(d.c);
    if(k==='xmax'){var bx=new THREE.Mesh(new THREE.BoxGeometry(.62,.36,.38),blue);g.add(bx);for(var i=0;i<5;i++){var bl=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.2,8),lam({color:0xf3c623,emissive:0x664400}));bl.position.set(-.22+i*.11,.28,0);g.add(bl)}var st=new THREE.Mesh(new THREE.BoxGeometry(.64,.06,.4),wh);st.position.y=-.06;g.add(st)}
    else if(k==='fheal'){var mb=new THREE.Mesh(new THREE.BoxGeometry(.62,.42,.34),blue);g.add(mb);var c1=new THREE.Mesh(new THREE.BoxGeometry(.3,.09,.36),wh),c2=new THREE.Mesh(new THREE.BoxGeometry(.09,.3,.36),wh);g.add(c1);g.add(c2);var hd=new THREE.Mesh(new THREE.BoxGeometry(.22,.07,.08),wh);hd.position.y=.25;g.add(hd)}
    else if(k==='insta'){var sk=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),wh);sk.scale.set(1,1.05,1);g.add(sk);var jaw=new THREE.Mesh(new THREE.BoxGeometry(.32,.16,.26),wh);jaw.position.set(0,-.26,-.06);g.add(jaw);var dk=new THREE.MeshBasicMaterial({color:0x141210});[-1,1].forEach(function(s){var ey=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),dk);ey.position.set(s*.11,.02,-.24);ey.scale.z=.5;g.add(ey)});var ns=new THREE.Mesh(new THREE.ConeGeometry(.04,.08,3),dk);ns.position.set(0,-.1,-.27);ns.rotation.x=Math.PI;g.add(ns);for(var t2=0;t2<4;t2++){var th=new THREE.Mesh(new THREE.BoxGeometry(.04,.06,.02),dk);th.position.set(-.09+t2*.06,-.24,-.19);g.add(th)}}
    else if(k==='tsar'){var bm=lam({color:0x3c4a2e,emissive:0x111508});var body=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.6,16),bm);body.rotation.z=Math.PI/2;g.add(body);var nose=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12),bm);nose.position.x=.3;g.add(nose);var tail=new THREE.Mesh(new THREE.ConeGeometry(.2,.25,16),bm);tail.rotation.z=Math.PI/2;tail.position.x=-.42;g.add(tail);
      [0,1,2,3].forEach(function(i){var f=new THREE.Mesh(new THREE.BoxGeometry(.18,.02,.34),lam({color:0x2a3320}));f.position.x=-.48;f.rotation.x=i*Math.PI/2;g.add(f)});var lb=new THREE.Mesh(new THREE.CircleGeometry(.15,20),new THREE.MeshBasicMaterial({map:pwTex('tsar')}));lb.position.set(0,0,-.205);lb.rotation.y=Math.PI;g.add(lb);var lb2=lb.clone();lb2.position.z=.205;lb2.rotation.y=0;g.add(lb2)}
    else{var sp=new THREE.Mesh(k==='x2'?new THREE.CylinderGeometry(.32,.32,.07,24):new THREE.PlaneGeometry(.75,.75),k==='x2'?[lam({color:0x2f7fe0,emissive:0x0a2a66}),new THREE.MeshBasicMaterial({map:pwTex('x2')}),new THREE.MeshBasicMaterial({map:pwTex('x2')})]:new THREE.MeshBasicMaterial({map:pwTex('sale'),transparent:true,side:THREE.DoubleSide}));if(k==='x2')sp.rotation.x=Math.PI/2;g.add(sp)}
    var gl=new THREE.Sprite(new THREE.SpriteMaterial({map:pwGlow(),color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));gl.scale.set(1.8,1.8,1);g.add(gl);
    var beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,8,8,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.25,depthWrite:false,blending:THREE.AdditiveBlending}));beam.position.y=3.6;g.add(beam);g.userData.pw=1;return g}
  function cost(n){return PW.sale>0?Math.round(n/1.5):n}
  function addPts(n,x,z){if(mode!=='zombie'||!P)return;if(n>0&&PW.x2>0)n*=2;P.pts+=n;if(n>0)P.earned+=n;popPts(n);hud()}
  function spawnFar(minD){var s,n=0;do{s=cellC(PP.pick(OPEN));n++}while(P&&Math.hypot(s.x-P.x,s.z-P.z)<minD&&n<60);return {x:s.x+(Math.random()-.5),z:s.z+(Math.random()-.5)}}
  function addItem(type,x,z,id){var m=pickupMesh(type);m.position.set(x,.7,z);scene.add(m);var it={id:id!=null?id:itemSeq++,type:type,x:x,z:z,m:m};if(PWD[type])it.ttl=30;items.push(it);if(coop&&auth&&id==null&&running)net.broadcast({t:'zc-item',i:it.id,ty:type,x:+x.toFixed(2),z:+z.toFixed(2)});return it}
  function removeItem(id){for(var i=items.length-1;i>=0;i--)if(items[i].id===id){scene.remove(items[i].m);items.splice(i,1)}}

  /* v97 : vie des zombies +5 % par vague (100 % à la vague 1, 105 % à la 2…) ; chaque boss a 5× la vie et 2× la vitesse du précédent (vitesse plafonnée sous le sprint du joueur) */
  var BOSSW=10;function zHpMul(){return 1+Math.max(0,wave-1)*.05}
  function addZombie(type,mult){
    var t=ZT[type],s=spawnFar(14),m=zombieModel(type);
    m.position.set(s.x,-1.9,s.z);scene.add(m);dust(s.x,s.z);
    mult*=D().hp;var e={kind:'z',type:type,x:s.x,z:s.z,yaw:0,hp:t.hp*mult,max:t.hp*mult,sp:t.sp*(.9+Math.random()*.25)*D().sp,dmg:t.dmg*D().dmg,cd:0,spit:2+Math.random()*2,m:m,r:ZR[type]||.55,alive:true,hit:0,rise:0};
    e.id=zid++;m.userData.ent=e;ents.push(e);return e;
  }
  var BOTN=['Rex','Nova','Kilo','Vega','Orion','Bravo','Lynx','Jinx','Zed','Moka','Tango','Echo'];
  function addBot(i,x,z){
    var sk=CH_SKINS[i%CH_SKINS.length].c,m=human(sk,0xe0b48f,{gun:true,helmet:true});m.position.set(x,0,z);scene.add(m);
    var e={kind:'b',i:i,name:'Bot '+BOTN[i%BOTN.length],x:x,z:z,yaw:Math.random()*6.28,hp:100,m:m,r:.4,alive:true,cd:1+Math.random(),wander:0,goal:null,strafe:1,hit:0,flash:0,tx:x,tz:z};
    m.userData.ent=e;ents.push(e);return e;
  }
  function remoteModel(r){if(coop){coopModel(r);return}if(r.m)scene.remove(r.m);r.m=online?soldier(teamOf(r.id)?0x3f8cff:0xff4a32,r.n,[0xd9a77c,0xb07850,0x7a4a2a,0xf0c8a0][(r.sk||0)%4]):human(CH_SKINS[r.sk||0].c,0xe0b48f,{gun:true,helmet:true});r.tagN=r.n;r.m.userData.ent=r;r.kind='p';scene.add(r.m);r.skShown=r.sk}

  function reset(seed){PW.x2=PW.sale=PW.tsar=PW.insta=0;if(UI.pw)UI.pw.hidden=true;
    if(!init())return false;
    var sd=seed||((Math.random()*1e9)|0);gameSeed=sd;itemSeq=0;zid=0;buildWorld(mapId,sd);
    ents=[];items=[];shots=[];feed=[];kills=0;wave=0;waveT=2;dead=false;deadMsg='';zone=null;stats={hits:0,shots:0};
    Object.keys(remotes).forEach(function(k){remotes[k].m=null});
    P=newPlayer(spawnFar(0));setViewGun();
    var R=rng((seed||1)+7);
    waveLeft=0;shopOpen=false;if(UI.shop)UI.shop.hidden=true;nades=[];booms=[];openingDoors=[];if(UI.prompt)setPrompt('');
    if(mode==='zombie'){for(var i=0;i<3;i++){var c=cellC(OPEN[Math.floor(R()*OPEN.length)]);addItem(i<1?'med':i<2?'ammo':'coin',c.x,c.z)}}
    if(mode==='br'){
      var loot=['rifle','shotgun','sniper','rifle','shotgun','ammo','ammo','ammo','ammo','med','med','med','coin','coin','coin','coin','coin','sniper','ammo','med'];
      loot.forEach(function(t,j){var c=cellC(OPEN[Math.floor(R()*OPEN.length)]);addItem(t,c.x+(R()-.5)*2,c.z+(R()-.5)*2,j)});itemSeq=100;
      var zc=cellC(OPEN[Math.floor(R()*OPEN.length)]);zone={x:zc.x,z:zc.z,r:Math.hypot(W,H)*S*.6,target:Math.hypot(W,H)*S*.6,t:25,stage:0};/* plus de zone du tout */zone.x=W*S/2;zone.z=H*S/2;zone.r=zone.target=1e6;zone.t=1e9;
    }
    lastInput=performance.now();hud();return true;
  }

  /* ---------- Interface (HUD sur l'image) ---------- */
  var UI={};
  function buildUI(){
    var st=cv.parentNode,d=document.createElement('div');d.className='fx-ui';d.innerHTML=
      '<div class="fx-cross" id="fx-cross"><i></i><i></i><i></i><i></i><b></b></div><div class="fx-hitm" id="fx-hitm"></div><div class="fx-scope" id="fx-scope"></div><div class="fx-hurt" id="fx-hurt"></div><div class="fx-slidefx" id="fx-slidefx"></div>'+
      '<canvas class="fx-mini" id="fx-mini" width="180" height="180"></canvas><div class="fx-feed" id="fx-feed"></div><div class="fx-top" id="fx-top"></div><div class="fx-center" id="fx-center"></div><div class="fx-prompt" id="fx-prompt"></div>'+
      '<div class="fx-hp"><div class="fx-bar fx-arm" id="fx-armw"><span>ARMURE</span><b id="fx-ar">0</b><i><em id="fx-arbar"></em></i></div><div class="fx-bar"><span>VIE</span><b id="fx-hp">100</b><i><em id="fx-hpbar"></em></i></div></div>'+
      '<div class="fx-ammo"><b id="fx-ammo">12 / ∞</b><span id="fx-gname">Pistolet</span></div><div class="fx-slots" id="fx-slots"></div><div class="fx-coins" id="fx-coins"></div><div class="fx-pops" id="fx-pops"></div><div class="fx-shop" id="fx-shop" hidden></div>'+
      '<div class="fx-chat" id="fx-chat" hidden><div class="fx-log" id="fx-log"></div><input id="fx-in" maxlength="80" placeholder="Message, Entrée pour envoyer" hidden></div>';
    st.appendChild(d);['cross','hitm','scope','hurt','mini','feed','top','center','hp','hpbar','gname','ammo','slots','coins','chat','log','in','ar','arbar','armw','prompt','pops','shop','slidefx'].forEach(function(k){UI[k]=$('fx-'+k)});
    function slotPick(e){var b=e.target.closest('[data-slot]');if(!b||!P||!running)return;e.preventDefault();e.stopPropagation();switchGun(P.inv[+b.dataset.slot])}
    UI.slots.addEventListener('click',slotPick);UI.slots.addEventListener('touchstart',slotPick,{passive:false});
    UI.shop.addEventListener('click',shopClick);UI.shop.addEventListener('touchstart',function(e){e.stopPropagation()},{passive:true});var zf=document.createElement('div');zf.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2;opacity:0;transition:opacity .3s;box-shadow:inset 0 0 120px 40px rgba(255,60,30,.9);background:rgba(255,60,30,.12)';st.appendChild(zf);UI.zoneFx=zf;var dd=document.createElement('div');dd.style.cssText='position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:3;opacity:0;transition:opacity .5s';dd.innerHTML='<i style="position:absolute;left:-60px;top:-150px;width:120px;height:26px;border-radius:50%/100% 100% 0 0;border-top:6px solid rgba(255,40,20,.9);filter:drop-shadow(0 0 6px rgba(255,40,20,.8))"></i>';st.appendChild(dd);UI.dmgDir=dd;
    UI.mctx=UI.mini.getContext('2d');
    UI.in.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter'){var t=UI.in.value.trim();if(t){chatAdd(net.me.name||'Moi',t,true);net.relay({g:'fchat',n:net.me.name,t:t})}UI.in.value='';closeChat()}if(e.key==='Escape')closeChat()});UI.in.addEventListener('blur',function(){setTimeout(function(){if(chatOpen&&document.activeElement!==UI.in){chatOpen=false;UI.in.hidden=true}},80)});
  }
  function openChat(){if(!online)return;chatOpen=true;UI.in.hidden=false;keys={};mouseDown=false;unlock();setTimeout(function(){UI.in.focus()},0)}
  function closeChat(){chatOpen=false;UI.in.hidden=true;UI.in.blur();lock()}
  function chatAdd(n,t,me){var l=document.createElement('div');l.className=me?'me':'';l.innerHTML='<b>'+esc(n)+'</b> '+esc(t);UI.log.appendChild(l);while(UI.log.children.length>7)UI.log.removeChild(UI.log.firstChild);sfx.play('ui')}
  function sys(t){var l=document.createElement('div');l.className='sys';l.textContent=t;if(UI.log){UI.log.appendChild(l);while(UI.log.children.length>7)UI.log.removeChild(UI.log.firstChild)}}
  function addFeed(t){feed.unshift({t:t,ttl:5});if(feed.length>5)feed.pop();renderFeed()}
  function renderFeed(){UI.feed.innerHTML=feed.map(function(f){return '<div>'+esc(f.t)+'</div>'}).join('')}
  /* v76 : panneau d'équipe dans l'image : zombies tués + vie de chaque coéquipier */
  /* v81 : barres de vie au-dessus des zombies (réglage « afficher la vie des ennemis ») et barre du boss */
  var ZHB=null;function zBars(){if(!scene||!cam)return;if(!ZHB){ZHB={g:new THREE.PlaneGeometry(.9,.1),f:new THREE.PlaneGeometry(.86,.06),bg:new THREE.MeshBasicMaterial({color:0x141210,transparent:true,opacity:.7,depthWrite:false}),m:[0x6fdc4a,0xf3c623,0xe2361b].map(function(c){return new THREE.MeshBasicMaterial({color:c,depthWrite:false})})}}
    var show=mode==='zombie'&&!(PP.settings&&PP.settings.zHp===false),rv=new THREE.Vector3(1,0,0).applyQuaternion(cam.quaternion),fw=cam.getWorldDirection(new THREE.Vector3()),boss=null;
    ents.forEach(function(e){if(e.kind!=='z')return;var fr=e.hpF!=null?e.hpF:e.hp/(e.max||1);if(e.alive&&e.boss)boss={n:e.boss,f:fr};
      var vis=show&&e.alive&&e.m&&!e.boss&&fr<.999&&fr>0&&(e.rise==null||e.rise>=1);
      if(!vis){if(e.hb){e.hb.b.visible=e.hb.f.visible=false;if(!e.alive){scene.remove(e.hb.b);scene.remove(e.hb.f);e.hb=null}}return}
      if(!e.hb){e.hb={b:new THREE.Mesh(ZHB.g,ZHB.bg),f:new THREE.Mesh(ZHB.f,ZHB.m[0])};e.hb.b.renderOrder=e.hb.f.renderOrder=6;scene.add(e.hb.b);scene.add(e.hb.f)}
      var y=(e.m.scale.y||1)*2.15+.25;e.hb.b.visible=e.hb.f.visible=true;e.hb.b.position.set(e.x,y,e.z);e.hb.b.quaternion.copy(cam.quaternion);
      e.hb.f.material=ZHB.m[fr>.5?0:fr>.25?1:2];e.hb.f.scale.x=Math.max(.02,fr);e.hb.f.position.set(e.x,y,e.z).addScaledVector(rv,-(1-fr)*.43).addScaledVector(fw,-.01);e.hb.f.quaternion.copy(cam.quaternion)});
    if(!UI.boss&&cv.parentNode){UI.boss=document.createElement('div');UI.boss.className='fx-boss';cv.parentNode.appendChild(UI.boss)}
    if(UI.boss){UI.boss.hidden=!boss;if(boss){var bh='<b>'+esc(boss.n)+'</b><i><i style="width:'+(boss.f*100).toFixed(1)+'%"></i></i>';if(UI.boss._h!==bh){UI.boss._h=bh;UI.boss.innerHTML=bh}}}}
  var matesT=0;function matesHud(dt){if(!P||!cv.parentNode)return;matesT-=dt;if(matesT>0)return;matesT=.25;
    if(!UI.mates){UI.mates=document.createElement('div');UI.mates.className='fx-mates';cv.parentNode.appendChild(UI.mates)}
    if(mode!=='zombie'){UI.mates.hidden=true;return}UI.mates.hidden=false;
    function row(n,hp,mh,al,k,me){var st=al===0?'MORT':al===2?'À TERRE':'',pc=al===0?0:Math.max(0,Math.min(100,hp/(mh||100)*100)),col=al===2?'#f3c623':pc<30?'#e2361b':'#6fdc4a';
      return '<div class="fm-r'+(me?' me':'')+(al!==1?' off':'')+'"><span class="fm-n">'+esc(String(n).slice(0,14))+'</span><span class="fm-k">☠ '+(k||0)+'</span><i class="fm-b"><i style="width:'+pc+'%;background:'+col+'"></i></i>'+(st?'<em>'+st+'</em>':'')+'</div>'}
    var h='<div class="fm-t">Zombies tués <b>'+kills+'</b></div>'+row((net.me&&net.me.name)||'Toi',P.hp,maxHp(),dead?0:P.down?2:1,kills,true);
    if(coop)Object.keys(remotes).forEach(function(id){var r=remotes[id];if(!r||r.hp==null)return;h+=row(r.n,r.hp,r.mh,r.al,r.kz,false)});
    if(UI.mates._h!==h){UI.mates._h=h;UI.mates.innerHTML=h}}
  function hud(){
    if(!P||!UI.hp)return;
    var g=GUNS[P.gun],a=P.guns[P.gun];
    UI.hp.textContent=Math.max(0,Math.ceil(P.hp));UI.hpbar.style.width=Math.max(0,P.hp/maxHp()*100)+'%';UI.hpbar.parentNode.parentNode.classList.toggle('low',P.hp<30);
    UI.ar.textContent=Math.ceil(P.ar);UI.arbar.style.width=Math.min(100,P.ar)+'%';UI.armw.classList.toggle('off',P.ar<=0);
    if(!UI.perks&&cv.parentNode){UI.perks=document.createElement('div');UI.perks.className='fps-perks';cv.parentNode.appendChild(UI.perks)}
    if(UI.perks){var ph=(P.perks?PK_ORDER.filter(function(k){return P.perks[k]}):[]).map(function(k){return '<i style="--c:#'+new THREE.Color(PK[k].col).getHexString()+'" title="'+PK[k].n+'">'+PK[k].n.charAt(0)+'</i>'}).join('')+(function(){var sel=defSel(),h=['turret','wire','mine'].map(function(k){var c=P.kit&&P.kit[k];return c>0?'<i class="def'+(k===sel?' on':'')+'" style="--c:'+(k===sel?'#6fdc4a':'#d8d0c0')+'" title="'+DEFN[k]+'">'+DEFN[k].charAt(0)+'<sup>'+c+'</sup></i>':''}).join('');return h?h+'<i class="defkeys" style="--c:#e8e2d4" title="F poser · V changer">F/V</i>':''})();if(UI.perks._h!==ph){UI.perks._h=ph;UI.perks.innerHTML=ph}}
    UI.gname.textContent=g.n+(P.rel>0?' · recharge':'');UI.ammo.innerHTML='<i class="'+(a.mag<=Math.ceil(g.mag*.25)?'low':'')+'">'+a.mag+'</i><small>'+(a.res===Infinity?'∞':a.res)+'</small>';
    var sl=P.inv.map(function(k,i){var gg=GUNS[k],aa=P.guns[k];return '<button type="button" class="fx-slot t'+gg.tier+(k===P.gun?' on':'')+'" data-slot="'+i+'" title="'+gg.n+'"><kbd>'+(i+1)+'</kbd><svg viewBox="0 0 64 24" aria-hidden="true"><path d="'+ICON[k]+'"/></svg><small>'+gg.n+'</small></button>'}).join('');
    for(var e2=P.inv.length;e2<MAXSLOT;e2++)sl+='<span class="fx-slot empty"><kbd>'+(e2+1)+'</kbd></span>';
    UI.slots.innerHTML=sl;
    UI.coins.innerHTML=mode==='zombie'?'<i></i>'+P.pts.toLocaleString('fr-FR'):'<i></i>'+coins();
    $('fps-hp').textContent=Math.max(0,Math.ceil(P.hp));
    if(mode==='zombie'){var zl=ents.filter(function(e){return e.alive}).length+waveLeft;$('fps-l1').innerHTML='Zombies <b>'+kills+'</b>';$('fps-l2').innerHTML='Vague <b>'+wave+'</b>';UI.top.innerHTML='<b>'+(wave||'–')+'</b><span>VAGUE</span><small>'+zl+' zombie'+(zl>1?'s':'')+' · '+esc(ZNAME[zoneOf(P.x,P.z)]||'')+'</small>'}
    else{var al=aliveCount();$('fps-l1').innerHTML='Frags <b>'+kills+'</b>';$('fps-l2').innerHTML='En vie <b>'+al+'</b>';UI.top.textContent=online?('2V2 · ROUGE '+TSC[0]+' – '+TSC[1]+' BLEU · TU ES '+(myTeam()?'BLEU':'ROUGE')+(teamSize(1)?'':' · EN ATTENTE D\'UN 2E JOUEUR')):(al+' EN VIE · '+kills+' FRAG'+(kills>1?'S':''))}
    var best=mode==='br'?PP.store('fps-br'):PP.store('fps-zombie');$('fps-best').textContent=mode==='br'?(best?'Top '+best:'—'):best;
  }
  function center(t){UI.center.textContent=t||'';UI.center.style.display=t?'block':'none'}
  var ICON={pistol:'M14 6h36v6H32l-1 2h-6l-4 8h-7l4-8h-4z',magnum:'M10 7h12l3-2h8v2h21v4H33l-2 3h-6l-4 8h-7l4-8h-4z',smg:'M8 8h8v3h4V6h30v4h6v3H40v4h-5l-1-4h-6v9h-5v-9h-3l-3 7h-6l3-7h-4z',
    rifle:'M2 9h12l6-2h14V5h6v2h22v3H44v3H34v10h-5V13h-6l-3 7h-6l2-7H2z',shotgun:'M2 10h14l8-3h38v3H26v4h-8l-3 7H9l3-7H2z',sniper:'M2 10h12l8-2h12V5h14v3h16v2H34v4h-7l-3 7h-6l3-7H2z',
    lmg:'M4 9h12l6-3h26v4h14v3H44v3h-6v6h-8v-6h-4l-3 6h-6l3-6h-4l-1-3H4z',minigun:'M6 6h22v3h30v2H28v2h30v2H28v3H20v4h-6v-4H6z',ray:'M10 8a6 6 0 0 1 12 0h4v-2h3v2h3v-2h3v2h3v-2h3v2h4a2 2 0 0 1 0 6H22l-3 9h-7l3-9h-1a6 6 0 0 1-4-6z',launcher:'M4 9h10l4-2h6V4h14v3h22v6H38v3h-4v5h-7v-5h-6l-3 6h-6l3-6H4z'};
  ICON.dmr=ICON.rifle;ICON.pdw=ICON.smg;ICON.rocket=ICON.launcher;ICON.revolver=ICON.magnum;ICON.carbine=ICON.rifle;ICON.hunter=ICON.sniper;ICON.autoshot=ICON.shotgun;ICON.bullpup=ICON.rifle;ICON.tesla=ICON.ray;
  function popPts(n){if(!UI.pops)return;var s=document.createElement('span');s.textContent=(n>0?'+':'')+n;s.className=n<0?'neg':'';UI.pops.appendChild(s);setTimeout(function(){s.remove()},950)}
  var promptTxt='';function setPrompt(t){if(t===promptTxt)return;promptTxt=t;UI.prompt.innerHTML=t||'';UI.prompt.classList.toggle('on',!!t)}

  /* ---------- Mini-carte ---------- */
  var miniBase=null;
  /* carte dessinée proprement : zones en panneaux arrondis, obstacles adoucis, portes avec leur prix,
     armureries, et zones pas encore débloquées hachurées avec un cadenas */
  var hatch=null;
  function hatchPat(g){if(!hatch){var p=document.createElement('canvas');p.width=p.height=10;var q=p.getContext('2d');q.strokeStyle='rgba(241,236,226,.09)';q.lineWidth=2;q.beginPath();q.moveTo(-2,12);q.lineTo(12,-2);q.stroke();hatch=p}return g.createPattern(hatch,'repeat')}
  function lockIcon(g,x,y,s,col){g.save();g.translate(x,y);g.scale(s,s);g.fillStyle=col;g.strokeStyle=col;g.lineWidth=2.2;g.beginPath();g.arc(0,-4,4.5,Math.PI,0);g.stroke();rr(g,-7,-4,14,11,2);g.fill();g.restore()}
  function drawMiniBase(){
    var k=8,c=document.createElement('canvas');c.width=W*k;c.height=H*k;var g=c.getContext('2d'),vil=world.style==='village',Zs=14;
    g.fillStyle='#12100e';g.fillRect(0,0,c.width,c.height);
    /* sol : un panneau par zone (ou un seul pour les cartes sans zones) */
    if(ZG){for(var zi=0;zi<9;zi++){var x0=(zi%3)*Zs+1,y0=Math.floor(zi/3)*Zs+1,th=TH[ZNAME[zi]]||{},col=new THREE.Color(th.f||0xffffff).multiplyScalar(vil?.34:.26);g.fillStyle='#'+col.getHexString();rr(g,x0*k-3,y0*k-3,13*k+6,13*k+6,12);g.fill()}}
    else{g.fillStyle=vil?'#2d4a22':'#2a2724';rr(g,k-2,k-2,(W-2)*k+4,(H-2)*k+4,12);g.fill()}
    /* portes ouvertes : le passage relie les deux panneaux */
    DOORS.forEach(function(d){if(!d.open)return;var px=d.cx/S*k,pz=d.cz/S*k;g.fillStyle='#3a3530';if(d.alongX)rr(g,px-k,pz-k*1.6,k*2,k*3.2,5);else rr(g,px-k*1.6,pz-k,k*3.2,k*2,5);g.fill()});
    /* murs intérieurs et obstacles, arrondis avec une ombre */
    g.save();g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=5;g.shadowOffsetY=2;g.fillStyle=vil?'#a85a3c':world.style==='ville'?'#e2cfae':'#bdb7aa';
    for(var z=1;z<H-1;z++)for(var x=1;x<W-1;x++){var ch=G[z][x];if(ch!=='#')continue;if(ZG&&(x%Zs===0||z%Zs===0))continue;rr(g,x*k-.6,z*k-.6,k+1.2,k+1.2,2.5);g.fill()}
    g.restore();
    for(z=1;z<H-1;z++)for(x=1;x<W-1;x++){var c2=G[z][x];
      if(c2==='c'){g.fillStyle='rgba(176,138,90,.85)';rr(g,x*k+1.5,z*k+1.5,k-3,k-3,2);g.fill()}
      else if(c2==='t'){g.fillStyle='#2f5a26';g.beginPath();g.arc(x*k+k/2,z*k+k/2,k*.62,0,7);g.fill();g.strokeStyle='#1d3a18';g.lineWidth=1.5;g.stroke()}}
    /* armureries */
    PERKS.forEach(function(p){var px=p.x/S*k,pz=p.z/S*k;g.fillStyle='#'+new THREE.Color(PK[p.id].col).getHexString();g.fillRect(px-k*.6,pz-k*.6,k*1.2,k*1.2);g.strokeStyle='#141210';g.lineWidth=1.5;g.strokeRect(px-k*.6,pz-k*.6,k*1.2,k*1.2)});
    STANDS.forEach(function(s){var px=(s.cx+.5)*k,pz=(s.cy+.5)*k,col=['#e2361b','#a46cf0','#e8b531'][s.tier||0];g.fillStyle=col;g.beginPath();g.arc(px,pz,k*.95,0,7);g.fill();g.strokeStyle='#f1ece2';g.lineWidth=2;g.stroke();g.fillStyle='#f1ece2';g.font='700 '+(k*1.1|0)+'px "IBM Plex Mono", monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('$',px,pz+1)});
    /* zones : nom, ou voile hachuré + cadenas si elle n'est pas encore débloquée */
    if(ZG)for(var zj=0;zj<9;zj++){var X0=((zj%3)*Zs+1)*k,Y0=(Math.floor(zj/3)*Zs+1)*k,WW=13*k,nm=(ZNAME[zj]||'').toUpperCase();g.textAlign='center';g.textBaseline='middle';
      if(UNL[zj]){g.fillStyle='rgba(241,236,226,.55)';g.font='700 '+(k*1.15|0)+'px "IBM Plex Mono", monospace';g.textAlign='left';g.fillText(nm,X0+5,Y0+9)}
      else{g.fillStyle='rgba(12,10,9,.72)';rr(g,X0-3,Y0-3,WW+6,WW+6,12);g.fill();g.fillStyle=hatchPat(g);rr(g,X0-3,Y0-3,WW+6,WW+6,12);g.fill();
        lockIcon(g,X0+WW/2,Y0+WW/2-12,1.9,'rgba(241,236,226,.85)');g.fillStyle='rgba(241,236,226,.85)';g.font='400 '+(k*1.9|0)+'px Anton, Impact, sans-serif';g.fillText(nm,X0+WW/2,Y0+WW/2+14);
        g.fillStyle='#d4a32a';g.font='700 '+(k*1.05|0)+'px "IBM Plex Mono", monospace';g.fillText(T('PAS ENCORE DÉBLOQUÉE'),X0+WW/2,Y0+WW/2+30)}}
    /* portes fermées : pastille dorée avec le prix */
    DOORS.forEach(function(d){if(d.open)return;var px=d.cx/S*k,pz=d.cz/S*k,txt=String(d.cost),w=k*4.4,h=k*1.9;g.save();g.shadowColor='rgba(0,0,0,.6)';g.shadowBlur=6;g.fillStyle='#d4a32a';rr(g,px-w/2,pz-h/2,w,h,h/2);g.fill();g.restore();
      lockIcon(g,px-w/2+h*.55,pz+1,.75,'#141210');g.fillStyle='#141210';g.font='700 '+(k*1.15|0)+'px "IBM Plex Mono", monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,px+h*.3,pz+1)});
    miniBase=c;
  }
  function drawMini(){
    var g=UI.mctx,sz=bigMap?400:180,c=UI.mini;if(c.width!==sz){c.width=c.height=sz;c.classList.toggle('big',bigMap)}
    var range=bigMap?Math.max(W,H)*S*1.04:60,sc=sz/range,cx=bigMap?W*S/2:P.x,cz=bigMap?H*S/2:P.z,now=performance.now();
    g.save();g.fillStyle='#12100e';g.fillRect(0,0,sz,sz);g.translate(sz/2,sz/2);g.imageSmoothingEnabled=true;
    g.drawImage(miniBase,(-cx)*sc,(-cz)*sc,W*S*sc,H*S*sc);
    var IC={med:'#ffffff',ammo:'#9fe36a',coin:'#f0c030'};
    items.forEach(function(it){var x=(it.x-cx)*sc,y=(it.z-cz)*sc,col=IC[it.type]||'#ff7a1a';g.fillStyle=col;if(it.type==='coin'){g.beginPath();g.arc(x,y,2.6,0,7);g.fill()}else{rr(g,x-2.5,y-2.5,5,5,1.5);g.fill()}});
    ents.forEach(function(e){if(!e.alive)return;var dd=Math.hypot(e.x-P.x,e.z-P.z);if(e.kind==='z'&&dd>40&&!bigMap)return;if(e.kind==='b'&&dd>28&&!bigMap&&!e.flash)return;var x=(e.x-cx)*sc,y=(e.z-cz)*sc,r=e.type==='brute'?5:e.kind==='z'?3:3.2;
      g.fillStyle=e.kind==='z'?'rgba(226,54,27,.28)':'rgba(255,176,32,.28)';g.beginPath();g.arc(x,y,r+2.5+Math.sin(now/180+e.x)*.8,0,7);g.fill();g.fillStyle=e.kind==='z'?'#ff4a2a':'#ffb020';g.beginPath();g.arc(x,y,r,0,7);g.fill()});
    Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!r.al)return;g.fillStyle='#3fa9ff';g.beginPath();g.arc((r.x-cx)*sc,(r.z-cz)*sc,3.5,0,7);g.fill()});
    g.translate((P.x-cx)*sc,(P.z-cz)*sc);g.rotate(-P.yaw);
    var cone=g.createRadialGradient(0,0,2,0,0,bigMap?34:42);cone.addColorStop(0,'rgba(241,236,226,.35)');cone.addColorStop(1,'rgba(241,236,226,0)');g.fillStyle=cone;g.beginPath();g.moveTo(0,0);g.arc(0,0,bigMap?34:42,-Math.PI/2-.55,-Math.PI/2+.55);g.closePath();g.fill();
    g.fillStyle='#fff';g.strokeStyle='#141210';g.lineWidth=1.5;g.beginPath();g.moveTo(0,-7);g.lineTo(5,5);g.lineTo(0,2);g.lineTo(-5,5);g.closePath();g.fill();g.stroke();
    g.restore();
    if(bigMap){g.fillStyle='rgba(20,18,16,.85)';rr(g,8,8,sz-16,26,6);g.fill();g.fillStyle='#f1ece2';g.font='400 16px Anton, Impact, sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText(String(MAPS[mapId]||'').toUpperCase(),18,21);g.textAlign='right';g.font='600 11px "IBM Plex Mono", monospace';g.fillStyle='rgba(241,236,226,.7)';g.fillText(T('M : fermer'),sz-18,21)}
  }

  /* ---------- Tir ---------- */
  function fwd(){return new THREE.Vector3(-Math.sin(P.yaw)*Math.cos(P.pitch),Math.sin(P.pitch),-Math.cos(P.yaw)*Math.cos(P.pitch))}
  function targetList(){var l=[];ents.forEach(function(e){if(e.alive&&e.m)l.push(e.m)});Object.keys(remotes).forEach(function(k){var r=remotes[k];if(r.al&&r.m)l.push(r.m)});return l}
  function fire(){if(P&&P.drink)return;
    if(dead||P.down||P.rel>0||P.cd>0)return;if(online&&round&&performance.now()-round.t0<3000)return;var g=GUNS[P.gun],a=P.guns[P.gun];
    if(a.mag<=0){A.dry();reload();P.cd=.3;return}
    var since=performance.now()-(P.lastShot||0);a.mag--;P.cd=g.rate*(P.perks&&P.perks.rate?.77:1);P.kick=Math.min(.25,P.kick+g.kick*(1-P.aimT*.35));P.shotN++;stats.shots++;A.shot(GUNS[P.gun].model||P.gun);if(P.gun!=='shotgun'&&P.gun!=='sniper'&&P.gun!=='launcher'&&P.gun!=='magnum')casing();shakeT=Math.max(shakeT,g.kick*1.2*(1-(P.aimT||0)*.8));
    P.fireT=1;if(P.gun==='shotgun')P.pumpT=1.6;if(P.gun==='sniper')P.boltT=1.6;P.drumT=1;/* v26 : recul qui remonte l'arme, puis elle redescend toute seule quand on arrête de tirer */var rk=g.kick*(P.aimT>.5?.12:.22)*(P.crouch>.5?.75:1);P.pitch=Math.min(1.45,P.pitch+rk);P.rec=Math.min(.3,(P.rec||0)+rk*.85);P.yaw+=(Math.random()-.5)*rk*.3;P.lastShot=performance.now();smoke();
    if(g.boom){var fd0=fwd(),o0=new THREE.Vector3(P.x+fd0.x*.8,EYE+P.y-.15+fd0.y*.8,P.z+fd0.z*.8);launchNade(o0,fd0);muzzle.material.opacity=1;muzzleL.intensity=3;muzzleL.position.set(P.x,EYE+P.y,P.z);if(a.mag===0&&a.res>0)setTimeout(function(){if(P&&P.guns[P.gun]===a&&a.mag===0)reload()},250);hud();return}
    muzzle.scale.setScalar(.8+Math.random()*.9);muzzle.rotation.z=Math.random()*6;muzzle.material.opacity=1;if(viewGun&&viewGun.userData.core)viewGun.userData.core.material.opacity=1;muzzleL.intensity=3;muzzleL.position.set(P.x,EYE+P.y,P.z);
    var ads=P.aimT>.6,tl=targetList(),hitAny=false,trEnd=null,spr=g.spread*(ads?(P.gun==='sniper'?.02:.25):1)*(since>350&&g.pel===1?(ads?.15:.55):1)*(isMoving()?1.4:1)*(P.y>0?1.6:1);
    var origin=new THREE.Vector3(P.x,EYE+P.y,P.z);
    for(var i=0;i<g.pel;i++){
      var dir=fwd();dir.x+=(Math.random()-.5)*spr*2;dir.y+=(Math.random()-.5)*spr*2;dir.z+=(Math.random()-.5)*spr*2;dir.normalize();
      ray.set(origin,dir);ray.far=200;
      var hs=ray.intersectObjects(tl,true),hw=ray.intersectObjects(solidMeshes,false),wd=hw.length?hw[0].distance:1e9;
      if(hs.length&&hs[0].distance<wd){
        var o=hs[0].object,head=!!o.userData.head;while(o&&!o.userData.ent)o=o.parent;if(!o)continue;
        var ent=o.userData.ent,dmg=g.dmg*(1+.4*upLv(P.gun))*(P.perks&&P.perks.dmg?1.5:1)*(head?2:1)*(g.pel>1?Math.max(.4,1-hs[0].distance/30):1);hitAny=true;hitEnt(ent,dmg,head);trEnd=hs[0].point;
        blood(hs[0].point,head);
      }else if(hw.length){spark(hw[0].point,0xd8c8a0);hole(hw[0]);if(!trEnd)trEnd=hw[0].point}
    }
    if(g.beam){var fd2=fwd(),bEnd=trEnd||origin.clone().addScaledVector(fd2,80),bSt=new THREE.Vector3(P.x+Math.cos(P.yaw)*.18+fd2.x*.7,EYE+P.y-.12+fd2.y*.7-(P.crouch||0)*.75,P.z-Math.sin(P.yaw)*.18+fd2.z*.7);beam(bSt,bEnd);if(trEnd)explode(bEnd.x,Math.max(.3,bEnd.y),bEnd.z,2.4,85,net.me.name||'Toi',true,true,0x7dff6a)}
    if(online&&g.pel===1){var fd=fwd();tracer(new THREE.Vector3(P.x+Math.cos(P.yaw)*.22+fd.x*.6,EYE+P.y-.18+fd.y*.6,P.z-Math.sin(P.yaw)*.22+fd.z*.6),trEnd||origin.clone().addScaledVector(fd,60))}
    if(hitAny){stats.hits++;UI.hitm.classList.remove('on','kill');void UI.hitm.offsetWidth;UI.hitm.classList.add('on');if(lastKill&&performance.now()-lastKill<60)UI.hitm.classList.add('kill')}
    if(a.mag===0&&a.res>0)setTimeout(function(){if(P&&P.guns[P.gun]===a&&a.mag===0)reload()},250);
    hud();
  }
  /* équipes en ligne : rouge contre bleu (alternance dans l'ordre du salon), pas de tir ami */
  var TSC=[0,0],fpsRoom=null,coop=false,zid=0,lastWaveSeen=0,gameSeed=0,revT=0,revId=null,overSent=false,zAcc=0;
  net.on(function(m){if(m.t==='migrating'){fpsRoom=null;online=false;if(running&&PP.cur()==='fps'){running=false;cancelAnimationFrame(raf);unlock()}}});
  function teamOf(id){var i=net.slot(id);return i<0?0:i%2}
  function myTeam(){return teamOf(net.me.id)}
  function teamAlive(t){var n=0;if(!dead&&myTeam()===t)n++;Object.keys(remotes).forEach(function(k){if(remotes[k].al&&teamOf(k)===t)n++});return n}
  function teamSize(t){return net.players.filter(function(p,i){return i%2===t}).length}
  function hitEnt(e,dmg,head){
    if(e.kind==='p'&&online&&(coop||teamOf(e.id)===myTeam())){sfx.play('tick');return}
    if(e.kind==='p'){net.relay({g:'fbhit',to:e.id,d:dmg,by:net.me.name,x:+P.x.toFixed(1),z:+P.z.toFixed(1),h:head?1:0});sfx.play(head?'kill':'hit');e.flash=.12;return}
    if(e.kind==='b'&&online&&!auth){net.send({t:'fb-hit',b:e.i,d:dmg,by:net.me.name});sfx.play('hit');return}
    if(e.kind==='z'&&coop&&!auth){if(!e.alive)return;net.send({t:'zc-hit',id:e.id,d:dmg,h:head?1:0,x:+P.x.toFixed(1),z:+P.z.toFixed(1)});e.hit=.15;A.hit(head);addPts(10);return}
    damageEnt(e,dmg,net.me.name||'Toi',true,head);
  }
  var lastKill=0;
  function damageEnt(e,dmg,by,mine,head,src){
    if(!e.alive)return;if(!(dmg>0))return;if(e.type==='armored'&&!head)dmg*=.45;if(!isFinite(e.hp))e.hp=0;e.hp-=dmg;e.hit=.15;e.flinch=Math.min(.45,.18+dmg/250)*(e.type==='brute'?.25:1);
    if(e.kind==='z'&&P&&e.type!=='brute'&&e.type!=='tank'){/* v64 : recul calculé depuis le joueur qui a tiré (avant : toujours depuis le chef) */var sx=src&&src.x!=null?src.x:P.x,sz=src&&src.z!=null?src.z:P.z,ka=Math.atan2(e.x-sx,e.z-sz),kf=Math.min(6,dmg/12);e.kbx=(e.kbx||0)+Math.sin(ka)*kf;e.kbz=(e.kbz||0)+Math.cos(ka)*kf}
    if(e.kind==='z'&&mine)addPts(10);
    if(e.hp<=0){e.alive=false;e.headshot=!!head;
      if(mine){kills++;A.kill(head);lastKill=performance.now();if(head)addFeed('Tir dans la tête !');if(e.kind==='z')addPts(e.type==='brute'?500:head?90:50)}
      if(e.kind==='z'){var r=Math.random();if(e.type==='brute'){addItem('coin',e.x,e.z);addItem('ammo',e.x+1,e.z);addItem('med',e.x-1,e.z)}else if(r<.3)addItem('coin',e.x,e.z);else if(r<.39)addItem('ammo',e.x,e.z);else if(r<.435)addItem('med',e.x,e.z);/* v80 : munitions et soins -10 %, et 10 % de chance d'un loot spécial */if(Math.random()<.1)addItem(PP.pick(PWK),e.x+.7,e.z+.4)}
      if(e.type==='exploder'){var ex=e.x,ez=e.z;setTimeout(function(){explode(ex,1,ez,4.2,110,'un kamikaze',true)},60)}
      if(e.kind==='b'){var t=by+' a éliminé '+e.name;addFeed(t);if(online&&auth)net.broadcast({t:'fb-feed',txt:t})}
      e.dieT=e.kind==='z'?4.5:1.2;if(e.kind==='z'){startDeath(e);A.zdie(e)}
    }else if(mine)A.hit(head);
    hud();
  }
  var sparks=[],shakeT=0,holes=[],smokes=[];
  function blood(p,head){for(var i=0;i<(head?22:9);i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.06),new THREE.MeshBasicMaterial({color:i%3?0x8a0c0c:0xc41a1a}));m.position.copy(p);scene.add(m);sparks.push({m:m,v:new THREE.Vector3((Math.random()-.5)*(head?6:3.5),Math.random()*(head?5:3),(Math.random()-.5)*(head?6:3.5)),t:.6})}}
  function hole(h){if(!h.face)return;var n=h.face.normal.clone();var m=new THREE.Mesh(new THREE.CircleGeometry(.05,8),new THREE.MeshBasicMaterial({color:0x1a1612,transparent:true,opacity:.85,depthWrite:false}));m.position.copy(h.point).addScaledVector(n,.01);m.lookAt(h.point.clone().add(n));scene.add(m);holes.push(m);if(holes.length>60)scene.remove(holes.shift())}
  function smoke(){var d=fwd();var m=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xcfcfcf,transparent:true,opacity:.35,depthWrite:false}));m.position.set(P.x+d.x*1.1+Math.cos(P.yaw)*.15,EYE+P.y+d.y*1.1-.12,P.z+d.z*1.1-Math.sin(P.yaw)*.15);scene.add(m);smokes.push({m:m,t:.7})}
  function startDeath(e){if(e.m&&e.m.userData.blob)e.m.userData.blob.visible=false;
    var a=Math.atan2(e.x-P.x,e.z-P.z);e.fx=Math.sin(a);e.fz=Math.cos(a);e.roll=(Math.random()-.5)*.6;
    /* le corps tombe là où il y a de la place, jamais à travers un mur */
    var len=2.2*(e.m.scale.x||1);[0,Math.PI/2,-Math.PI/2,Math.PI,Math.PI/4,-Math.PI/4].some(function(o){var fx=Math.sin(a+o),fz=Math.cos(a+o);for(var s=.5;s<=len;s+=.5)if(solid(e.x+fx*s,e.z+fz*s))return false;e.fx=fx;e.fz=fz;return true});
    if(e.headshot&&e.m.userData.parts){e.m.userData.parts.head.visible=false;blood(new THREE.Vector3(e.x,1.8*(e.m.scale.y||1),e.z),true)}
    var pool=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x3a0303,transparent:true,opacity:.8,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.set(e.x+e.fx*1.1,.03,e.z+e.fz*1.1);pool.scale.setScalar(.01);scene.add(pool);e.pool=pool;
  }
  function stepDeath(e,dt){
    var tt=4.5-e.dieT,p=e.m.userData.parts,sc=e.m.scale.x;
    if(e.type==='crawler'){if(p){p.arms[0].rotation.x=2.9;p.arms[1].rotation.x=2.4;p.head.rotation.x=1.1;p.jaw.rotation.x=.6;p.root.position.y=.12}if(tt>3.6)e.m.position.y-=dt*.4;if(e.pool){e.pool.scale.setScalar(Math.max(.01,Math.min(1,tt/1.8)*sc));if(tt>3.6)e.pool.material.opacity=Math.max(0,.85-(tt-3.6)*.9)}return}
    if(tt<.28){var k=tt/.28;if(p){p.legs[0].rotation.x=-k*.9;p.legs[1].rotation.x=-k*.7;p.arms[0].rotation.x=-1.4-k*1.2;p.arms[1].rotation.x=-1.2-k*1.4;p.root.rotation.x=k*.3}e.m.position.y=-k*.35*sc;e.m.position.x=e.x+e.fx*k*.25;e.m.position.z=e.z+e.fz*k*.25}
    else if(tt<1){var u=(tt-.28)/.72,eu=u*u;e.m.rotation.x=-eu*1.52;e.m.rotation.z=e.roll*eu;e.m.position.y=-.35*sc*(1-eu)+.05;e.m.position.x=e.x+e.fx*(.25+eu*.3);e.m.position.z=e.z+e.fz*(.25+eu*.3);if(p){p.arms[0].rotation.x=-2.6+Math.sin(tt*14)*.5;p.arms[1].rotation.x=-2.6-Math.sin(tt*14)*.5;p.root.rotation.x=.3-eu*.3;if(p.jaw)p.jaw.rotation.x=.7}}
    else if(tt<1.3){if(!e.dusted){e.dusted=1;dust(e.x+e.fx*1.2,e.z+e.fz*1.2);shakeT=Math.max(shakeT,.05)}e.m.rotation.x=-1.52+Math.sin((tt-1)/.3*Math.PI)*.12;if(p){p.arms[0].rotation.x=-2.9;p.arms[1].rotation.x=-2.2;p.legs[0].rotation.x=-.2;p.legs[1].rotation.x=.15}}
    else if(tt>3.6){e.m.position.y-=dt*.6}
    /* le corps se détend en tombant : genoux et coudes reviennent presque droits, bras écartés, buste aligné */
    if(p&&p.knees){var rl=Math.min(1,dt*8);p.knees[0].rotation.x+=(-.12-p.knees[0].rotation.x)*rl;p.knees[1].rotation.x+=(-.28-p.knees[1].rotation.x)*rl;p.elbows[0].rotation.x+=(-.25-p.elbows[0].rotation.x)*rl;p.elbows[1].rotation.x+=(-.5-p.elbows[1].rotation.x)*rl;
      if(tt>.28){p.arms[0].rotation.z+=(-.9-p.arms[0].rotation.z)*rl;p.arms[1].rotation.z+=(.7-p.arms[1].rotation.z)*rl}p.torso.rotation.y*=1-rl;p.root.position.y*=1-rl;p.head.rotation.z+=(.5-p.head.rotation.z)*rl}
    if(e.pool){var ps=Math.min(1,tt/1.8)*(1.1*sc);e.pool.scale.setScalar(Math.max(.01,ps));if(tt>3.6)e.pool.material.opacity=Math.max(0,.85-(tt-3.6)*.9)}
  }
  function dust(x,z){for(var i=0;i<10;i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.14),new THREE.MeshLambertMaterial({color:0x6a5a48}));m.position.set(x+(Math.random()-.5),.2,z+(Math.random()-.5));scene.add(m);sparks.push({m:m,v:new THREE.Vector3((Math.random()-.5)*3,2+Math.random()*3,(Math.random()-.5)*3),t:.7})}}
  function casing(){var m=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,.08),new THREE.MeshBasicMaterial({color:0xd4a32a}));var rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);m.position.set(P.x+rx*.25-Math.sin(P.yaw)*.4,EYE+P.y-.15,P.z+rz*.25-Math.cos(P.yaw)*.4);scene.add(m);sparks.push({m:m,v:new THREE.Vector3(rx*2.5+(Math.random()-.5),2.2+Math.random(),rz*2.5+(Math.random()-.5)),t:.6})}
  function spark(p,col){for(var i=0;i<5;i++){var m=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.05),new THREE.MeshBasicMaterial({color:col}));m.position.copy(p);scene.add(m);sparks.push({m:m,v:new THREE.Vector3((Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4),t:.35})}}
  /* grenades du lance-grenades : arc, rebond léger, explosion au contact */
  function launchNade(o,d){var G0=GUNS[P.gun]||GUNS.launcher,rk=!!G0.rk,m=new THREE.Mesh(rk?new THREE.CylinderGeometry(.06,.09,.5,8):new THREE.SphereGeometry(.09,10,8),new THREE.MeshLambertMaterial({color:rk?0xd8d0c0:0x4f5d33,emissive:rk?0x552200:0x221a00}));m.position.copy(o);if(rk)m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());scene.add(m);
    nades.push({m:m,v:rk?d.clone().multiplyScalar(48):d.clone().multiplyScalar(26).add(new THREE.Vector3(0,2.2,0)),t:3,rk:rk,r:G0.rad||4.6,dmg:G0.dmg*(1+.4*upLv(P.gun))*(P.perks&&P.perks.dmg?1.5:1)})}
  function stepNades(dt){
    nades.forEach(function(n){n.t-=dt;if(!n.rk)n.v.y-=12*dt;var p=n.m.position,np=p.clone().addScaledVector(n.v,dt),hitZ=false;
      ents.forEach(function(e){if(e.alive&&e.kind!=='p'&&Math.hypot(e.x-np.x,e.z-np.z)<e.r+.35&&np.y<2.2*(e.m?e.m.scale.y:1))hitZ=true});
      if(hitZ||np.y<=.08||solid(np.x,np.z)||n.t<=0){explode(p.x,Math.max(.3,p.y),p.z,n.r||4.6,n.dmg||GUNS.launcher.dmg,net.me.name||'Toi',true,true);n.t=-1;return}
      p.copy(np);if(!n.rk)n.m.rotation.x+=dt*12;if(Math.random()<.5){var s=new THREE.Mesh(new THREE.SphereGeometry(.06,6,4),new THREE.MeshBasicMaterial({color:0xbbbbbb,transparent:true,opacity:.4,depthWrite:false}));s.position.copy(p);scene.add(s);smokes.push({m:s,t:.5})}});
    nades=nades.filter(function(n){if(n.t<0){scene.remove(n.m);return false}return true});
  }
  function beam(a,b){var d=new THREE.Vector3().subVectors(b,a),len=d.length(),m=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,8,1,true),new THREE.MeshBasicMaterial({color:0x9dff7a,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());scene.add(m);tracers.push({m:m,t:.16})}
  function explode(x,y,z,r,dmg,by,mine,fromPlayer,col){
    if(!scene)return;if(col)A.zap(Math.hypot(x-(P?P.x:x),z-(P?P.z:z)));else A.boom(Math.hypot(x-(P?P.x:x),z-(P?P.z:z)));
    var f=new THREE.Mesh(BOOMG||(BOOMG=new THREE.SphereGeometry(1,16,12)),new THREE.MeshBasicMaterial({color:col||0xffb040,transparent:true,opacity:.95,depthWrite:false}));f.position.set(x,y,z);scene.add(f);booms.push({m:f,t:.45,r:r,col:col});
    var L=BL.length?BL[BLi++%BL.length]:null;if(L){L.color.setHex(col||0xffa040);L.distance=r*4;L.intensity=6;L.position.set(x,y+.5,z);booms.push({l:L,t:.3,keep:1})}
    if(!SPKG){SPKG=new THREE.BoxGeometry(.1,.1,.1);SPKG.userData.keep=1}for(var i=0;i<22;i++){var m=new THREE.Mesh(SPKG,new THREE.MeshBasicMaterial({color:i%3?0x2a2622:0xff8a30}));m.position.set(x,y,z);scene.add(m);sparks.push({m:m,v:new THREE.Vector3((Math.random()-.5)*12,Math.random()*9,(Math.random()-.5)*12),t:.8})}
    dust(x,z);if(coop&&auth&&!fromPlayer&&dmg>0)Object.keys(remotes).forEach(function(k){var rr=remotes[k],dr=Math.hypot(rr.x-x,rr.z-z);if(rr.al===1&&dr<r)net.to(k,{t:'zc-dmg',d:Math.round(dmg*(1-dr/r)*.6),by:by})});if(P){var dp=Math.hypot(P.x-x,P.z-z);shakeT=Math.max(shakeT,Math.max(0,.5-dp/30));if(dp<r&&!dead&&dmg>0&&!P.down)hurt(Math.round((fromPlayer?.35:1)*dmg*(1-dp/r)*.6),by,x,z)}
    ents.forEach(function(e){if(!e.alive||e.kind==='p')return;var d=Math.hypot(e.x-x,e.z-z);if(d<r){var dd=dmg*(1-d/r*.7);if(e.kind==='b'&&online&&!auth)return;if(e.kind==='z'&&coop&&!auth){if(mine&&dd>0)net.send({t:'zc-hit',id:e.id,d:dd,h:0,x:+x.toFixed(1),z:+z.toFixed(1)});return}damageEnt(e,dd,by,!!mine,false,{x:x,z:z});var a=Math.atan2(e.x-x,e.z-z);e.kbx=(e.kbx||0)+Math.sin(a)*8;e.kbz=(e.kbz||0)+Math.cos(a)*8}});
  }
  function stepBooms(dt){booms.forEach(function(b){b.t-=dt;if(b.m){var k=1-b.t/.45;b.m.scale.setScalar(.3+k*b.r*.9);b.m.material.opacity=Math.max(0,b.t/.45);b.m.material.color.setHex(b.col?(k<.4?b.col:0x2a6a2a):k<.4?0xffd070:0x8a6a50)}if(b.l)b.l.intensity=Math.max(0,b.t*20)});booms=booms.filter(function(b){if(b.t<=0){if(b.keep){b.l.intensity=0}else{scene.remove(b.m||b.l);if(b.m&&b.m.material)b.m.material.dispose()}return false}return true})}
  function reload(){if(P.drink)return;var g=GUNS[P.gun],a=P.guns[P.gun];if(P.rel>0||a.mag>=magOf(P.gun)||a.res<=0)return;P.rel=g.rel*(P.fastRel?.6:1)*(P.perks&&P.perks.reload?.5:1);P.relMax=P.rel;P.relSnd=0;aiming=false;A.rel(0);hud()}
  function finishReload(){var g=GUNS[P.gun],a=P.guns[P.gun],need=magOf(P.gun)-a.mag,take=a.res===Infinity?need:Math.min(need,a.res);a.mag+=take;if(a.res!==Infinity)a.res-=take;hud()}
  function switchGun(k){if(P.drink||!k||!P.guns[k]||k===P.gun||dead)return;P.prev=P.gun;P.gun=k;P.rel=0;P.cd=.35;aiming=false;P.drawT=1;setViewGun();hud();A.draw()}
  function cycle(d){var own=P.inv;var i=own.indexOf(P.gun);switchGun(own[(i+d+own.length)%own.length])}
  /* ajoute une arme : 4 emplacements max, sinon elle remplace l'arme en main (jamais le dernier pistolet) */
  function giveGun(t,full){var g=GUNS[t];if(P.guns[t]){P.guns[t].res+=full?g.mag*4:g.mag*2;return}
    if(P.inv.length>=MAXSLOT){var out=P.gun;delete P.guns[out];P.inv[P.inv.indexOf(out)]=t;addFeed(GUNS[out].n+' remplacé')}else P.inv.push(t);
    P.guns[t]={mag:g.mag,res:g.mag*(full?4:2)};P.gun=null;switchGun(t)}
  /* v29 : G pose l'arme en main par terre (un pote peut la ramasser) */
  function dropGun(){if(!P||dead||P.down||mode!=='zombie'||P.inv.length<=1||P.gun==='pistol')return;var t=P.gun,fd=fwd(),x=P.x+fd.x*1.6,z=P.z+fd.z*1.6;if(solid(x,z)){x=P.x;z=P.z}
    delete P.guns[t];P.inv.splice(P.inv.indexOf(t),1);if(P.up)delete P.up[t];P.gun=null;switchGun(P.inv[0]);P.dropT=performance.now();
    if(coop&&!auth)net.send({t:'zc-drop',ty:t,x:+x.toFixed(2),z:+z.toFixed(2)});else addItem(t,x,z);addFeed(GUNS[t].n+' posé par terre');A.pick()}
  /* v29 : emotes avec B (salut, danse, victoire, muscles) : ton perso apparaît en vue extérieure, et tes potes le voient */
  /* v60 : 8 emotes choisies dans une roue (B puis 1 à 8), animations de tout le corps, caméra qui tourne autour de toi */
  var EMOTES=['Salut','Danse','Victoire','Muscles','Bravo','Robot','Dab','Fou rire'],emoteI=0,selfM=null,emoteMenu=false;
  function emoteMenuToggle(on){emoteMenu=on;var m=UI.emo;if(!m){m=UI.emo=document.createElement('div');m.className='fx-emo';cv.parentNode.appendChild(m)}
    if(on){emoSel=lastEmo!=null?lastEmo:0;emoAX=emoAY=0;emoOpenT=performance.now();m.innerHTML='<b>Emotes</b>'+EMOTES.map(function(n,i){return '<span style="--i:'+i+'"><kbd>'+(i+1)+'</kbd>'+n+'</span>'}).join('')+'<small>Bouge la souris puis clic · ou 1 à 8 · maintiens B, vise, relâche · B B = la dernière</small>';m.hidden=false;emoDraw()}else m.hidden=true}
  /* v73 : emotes plus faciles : on choisit à la souris (clic ou relâcher B), et B deux fois rejoue la dernière */
  var emoSel=0,emoAX=0,emoAY=0,emoOpenT=0,bDownT=0,lastEmo=null;
  function emoDraw(){if(!UI.emo)return;UI.emo.querySelectorAll('span').forEach(function(sp,i){sp.classList.toggle('on',i===emoSel)})}
  function emoMove(dx,dy){emoAX+=dx;emoAY+=dy;var c=emoSel%4,r=emoSel>>2;if(emoAX>70){c=Math.min(3,c+1);emoAX=0}if(emoAX<-70){c=Math.max(0,c-1);emoAX=0}if(emoAY>60){r=1;emoAY=0}if(emoAY<-60){r=0;emoAY=0}var n=r*4+c;if(n!==emoSel){emoSel=n;emoDraw()}}
  function startEmote(id){if(!P||dead||P.down||shopOpen)return;if(P.emote&&id==null){P.emote=null;return}if(id==null){if(emoteMenu&&lastEmo!=null&&performance.now()-emoOpenT<400){id=lastEmo}else{emoteMenuToggle(!emoteMenu);return}}lastEmo=id;
    emoteMenuToggle(false);if(selfM){if(selfM.parent)selfM.parent.remove(selfM);selfM=null}P.emote={id:id,t:0};var nm=EMOTES[id].toUpperCase();aiming=false;center(nm);setTimeout(function(){if(UI.center.textContent===nm)center('')},1200);sendAcc=0}
  function emotePose(p,id,t){if(!p||!p.arms||!p.elbows)return;var k=Math.min(1,t*5),s=Math.sin(t*7),q={a0x:0,a1x:0,a0z:0,a1z:0,e0x:0,e1x:0,l0:0,l1:0,k0:0,k1:0,tx:0,ty:0,tz:0,hx:0,hy:0,hz:0,ry:0,rz:0};
    if(id===0){q.a1z=2.55+Math.sin(t*10)*.28;q.e1x=.35;q.a0z=-.12;q.hz=-.12;q.tz=-.05}
    else if(id===1){var d=Math.sin(t*6),b=Math.abs(Math.sin(t*12));q.a0x=1.3+d*.8;q.a1x=1.3-d*.8;q.a0z=-.45;q.a1z=.45;q.e0x=1.0;q.e1x=1.0;q.ty=d*.45;q.rz=d*.12;q.ry=-b*.06;q.k0=.25+b*.25;q.k1=.25+b*.25;q.l0=-.1;q.l1=-.1;q.hz=-d*.18}
    else if(id===2){var j=Math.max(0,Math.sin(t*5.5)),pu=Math.sin(t*11)*.2;q.a0z=-2.75-pu;q.a1z=2.75+pu;q.ry=j*.38;q.k0=q.k1=(1-j)*.35;q.l0=q.l1=-(1-j)*.2;q.hx=-.25}
    else if(id===3){var f=.5+.5*Math.sin(t*4);q.a0z=-1.45;q.a1z=1.45;q.e0x=1.7+f*.5;q.e1x=1.7+f*.5;q.tx=-.12;q.k0=q.k1=.15;q.hx=-.1;q.ty=Math.sin(t*2)*.25}
    else if(id===4){var c=Math.abs(Math.sin(t*13));q.a0x=1.25;q.a1x=1.25;q.a0z=.18+c*.25;q.a1z=-.18-c*.25;q.e0x=.7;q.e1x=.7;q.hx=-.08;q.ry=Math.abs(Math.sin(t*6.5))*.03}
    else if(id===5){var st=Math.sin(t*3)>0?1:-1,st2=Math.sin(t*3+1)>0?1:-1;q.a0x=st>0?1.6:.2;q.a1x=st>0?.2:1.6;q.e0x=1.57;q.e1x=1.57;q.hy=st2*.5;q.ty=st*.2;q.l0=st>0?.35:0;q.l1=st>0?0:.35}
    else if(id===6){var dk=Math.min(1,(t%2.4)*6);q.a1z=2.35*dk;q.a1x=.4*dk;q.a0x=1.45*dk;q.a0z=.75*dk;q.e0x=2.2*dk;q.hx=.45*dk;q.hy=-.5*dk;q.tx=.12*dk}
    else{var lb=Math.abs(Math.sin(t*14));q.tx=.38+lb*.06;q.a0x=.55;q.a1x=.55;q.a0z=.15;q.a1z=-.15;q.e0x=1.35;q.e1x=1.35;q.hx=-.35+lb*.15;q.k0=q.k1=.2;q.ry=-lb*.03}
    p.arms[0].rotation.x=q.a0x*k;p.arms[1].rotation.x=q.a1x*k;p.arms[0].rotation.z=q.a0z*k;p.arms[1].rotation.z=q.a1z*k;p.elbows[0].rotation.x=q.e0x*k;p.elbows[1].rotation.x=q.e1x*k;p.elbows[0].rotation.z=0;p.elbows[1].rotation.z=0;
    if(p.legs){p.legs[0].rotation.x=q.l0*k;p.legs[1].rotation.x=q.l1*k}if(p.knees){p.knees[0].rotation.x=q.k0*k;p.knees[1].rotation.x=q.k1*k}
    if(p.torso)p.torso.rotation.set(q.tx*k,q.ty*k,q.tz*k);if(p.head)p.head.rotation.set(q.hx*k,q.hy*k,q.hz*k);if(p.root){p.root.position.y=q.ry*k;p.root.rotation.z=q.rz*k}}  function hurt(d,by,sx,sz){
    if(dead||P.down)return;if(P.ar>0){var ab=Math.min(P.ar,d*.7);P.ar-=ab;d-=ab;if(ab>0)A.armor()}if(sx!=null&&UI.dmgDir){var a=Math.atan2(sx-P.x,sz-P.z),rel=a-(P.yaw+Math.PI);UI.dmgDir.style.transform='rotate('+(-rel)+'rad)';UI.dmgDir.style.transition='none';UI.dmgDir.style.opacity=1;void UI.dmgDir.offsetWidth;UI.dmgDir.style.transition='opacity 1.2s';UI.dmgDir.style.opacity=0}P.hp-=d;P.lastHurt=performance.now();shakeT=.25;P.by=by||P.by;UI.hurt.classList.remove('on');void UI.hurt.offsetWidth;UI.hurt.classList.add('on');A.hurt();
    if(P.hp<=0){P.hp=0;if(coop)goDown(by);else die(by)}hud();
  }
  function isMoving(){return keys.F||keys.B||keys.L||keys.R||pk.F||pk.B}

  /* ---------- Ramassage ---------- */
  function pickup(it){
    var t=it.type;
    if(PWD[t]){pwOn(t);if(coop)net.relay({g:'zpw',k:t,n:net.me.name})}
    else if(t==='med'){if(P.hp>=maxHp())return false;P.hp=Math.min(maxHp(),P.hp+45);A.pick();addFeed('+45 vie')}
    else if(t==='ammo'){ORDER.forEach(function(k){var a=P.guns[k];if(a&&a.res!==Infinity)a.res+=GUNS[k].mag*2});A.pick();addFeed('Munitions')}
    else if(t==='coin'){if(mode==='zombie'){addPts(50);A.coin()}else{coins(coins()+5);A.coin();addFeed('+5 pièces')}}
    else{var g=GUNS[t];giveGun(t,false);A.pick();addFeed(g.n+' ramassé')}
    if(online)net.relay({g:'fbloot',i:it.id});
    hud();return true;
  }

  /* ---------- Boucle ---------- */
  var stepDt=1/60;
  function step(dt){
    var now=performance.now();stepDt=dt;
    // joueur
    if(!dead&&P.down)stepDown(dt);else if(!dead){
      var afk=online&&now-lastInput>45000;if(afk!==P.afk){P.afk=afk;if(afk)addFeed('Tu es AFK : un bot joue pour toi');else{keys={};mouseDown=false;addFeed('Tu reprends la main');center('');sendAcc=0}}
      if(P.afk)autopilot(dt);
      if(keys.TL||keys.TR||keys.TU||keys.TD){P.kTurn=Math.min(1,(P.kTurn||0)+dt*3);var ks=(aiming?.55:1)*(PP.settings.sens||100)/100*(.6+P.kTurn*.4);P.yaw+=((keys.TL?1:0)-(keys.TR?1:0))*3.5*ks*dt;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch+((keys.TU?1:0)-(keys.TD?1:0))*2.3*ks*dt));lastInput=now}else P.kTurn=0;
      var crouchK=keys.C&&P.slide<=0,runK=!aiming&&!crouchK&&(keys.SH||(autoRun()&&(keys.F||pk.F)&&!(keys.B||pk.B))),sp=(runK?8.5:5.5)*(aiming?.6:1)*(crouchK?.5:1)*(P.perks&&P.perks.speed?1.25:1)*dt,fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),mx=0,mz=0;
      var kF=keys.F||pk.F,kB=keys.B||pk.B,kL=keys.L||pk.L,kR=keys.R||pk.R;if(kF){mx+=fx;mz+=fz}if(kB){mx-=fx;mz-=fz}if(kL){mx+=fz;mz-=fx}if(kR){mx-=fz;mz+=fx}
      var ml=Math.hypot(mx,mz),frz=online&&round&&performance.now()-round.t0<3000,tvx=ml>0&&!frz?mx/ml*sp/dt:0,tvz=ml>0&&!frz?mz/ml*sp/dt:0,ac=Math.min(1,dt*(ml>0?14:18));P.vx=(P.vx||0)+(tvx-(P.vx||0))*ac;P.vz=(P.vz||0)+(tvz-(P.vz||0))*ac;var spd=Math.hypot(P.vx,P.vz);
      /* glissade : en courant, C ou Ctrl → on file au ras du sol, puis on reste accroupi tant que la touche est tenue */
      P.slideCd=Math.max(0,P.slideCd-dt);
      if(keys.CT&&P.slide<=0&&P.slideCd<=0&&P.y<=0&&spd>6&&!frz){P.slide=.8;P.sdx=P.vx/spd;P.sdz=P.vz/spd;P.sv=Math.max(12.5,spd*1.5);P.slideCd=1;A.slide()}keys.CT=false;
      if(P.slide>0){P.slide-=dt;P.sv=Math.max(3.5,P.sv-dt*12);if(ml>0){var bx=mx/ml,bz=mz/ml;P.sdx+=(bx-P.sdx)*dt*1.5;P.sdz+=(bz-P.sdz)*dt*1.5;var nl=Math.hypot(P.sdx,P.sdz)||1;P.sdx/=nl;P.sdz/=nl}P.vx=P.sdx*P.sv;P.vz=P.sdz*P.sv;spd=P.sv;if(keys.J){P.slide=0}}
      P.crouch+=((P.slide>0?1:keys.C?1:0)-P.crouch)*Math.min(1,dt*12);
      UI.slidefx.classList.toggle('on',P.slide>0);
      if(spd>.05){moveEnt(P,P.vx*dt,P.vz*dt,.4);if(P.slide<=0){var ob=P.bob;P.bob+=dt*(runK?13:9)*Math.min(1,spd/5.5)*(crouchK?.7:1);if(P.y<=0&&Math.floor(ob/Math.PI)!==Math.floor(P.bob/Math.PI))A.step(spd,world0)}}
      if(keys.J&&P.y<=0&&!frz){P.vy=P.crouch>.5&&P.slide<=0?3.8:5.2;keys.J=false;A.jump()}
      var wasAir=P.y>0,vyB=P.vy;P.vy-=14*dt;P.y=Math.max(0,P.y+P.vy*dt);if(P.y===0){P.vy=Math.max(0,P.vy);if(wasAir&&vyB<-3){A.land();P.landT=1}}
      P.aimT+=((aiming&&P.rel<=0?1:0)-P.aimT)*Math.min(1,dt*16);
      if(P.emote){P.emote.t+=dt;if(P.emote.t>9||isMoving()||mouseDown||keys.J)P.emote=null}
      if(mode==='zombie')interact();
      P.cd-=dt;if(P.rel>0){P.rel-=dt;if(P.rel<=0){P.rel=0;finishReload()}}
      if(mouseDown&&GUNS[P.gun].auto&&!P.afk)fire();if(frz){var cd=3-Math.floor((performance.now()-round.t0)/1000);if(cd!==P.cdShown){P.cdShown=cd;center(cd>0?String(cd):'');if(cd>0)sfx.play('tick')}}else if(P.cdShown){P.cdShown=0;center('');sfx.play('go')}
      for(var i=items.length-1;i>=0;i--){var it=items[i];if(it.ttl!=null){it.ttl-=dt;it.m.visible=it.ttl>6||Math.floor(it.ttl*6)%2===0;if(it.ttl<=0){scene.remove(it.m);items.splice(i,1);continue}}it.m.rotation.y+=dt*2;it.m.position.y=.7+Math.sin(now/300+i)*.12;if(Math.hypot(it.x-P.x,it.z-P.z)<1.3&&!(GUNS[it.type]&&now-(P.dropT||0)<2500)&&pickup(it)){scene.remove(it.m);items.splice(i,1)}}
      if(zone&&Math.hypot(P.x-zone.x,P.z-zone.z)>zone.r){P.hp-=7*dt;if(Math.random()<dt*2){UI.hurt.classList.remove('on');void UI.hurt.offsetWidth;UI.hurt.classList.add('on')}if(P.hp<=0)die('La zone');hud()}
      if(now-P.lastHurt>6000&&P.hp<100&&mode==='br'){P.hp=Math.min(100,P.hp+dt*2)}
    }else items.forEach(function(it,i){it.m.rotation.y+=dt*2});
    P.kick=Math.max(0,P.kick-dt*.9);if(P.rec>0&&performance.now()-(P.lastShot||0)>120){var rr=Math.min(P.rec,dt*(.5+P.rec*5));P.pitch-=rr;P.rec-=rr}
    // zombies
    if(mode==='zombie'){if(coop&&!auth)stepZGuest(dt);else stepZombies(dt)}if(coop)coopTick(dt);
    if(mode==='br'){if(auth)stepBR(dt);else stepBRGuest(dt)}
    stepRemotes(dt);matesHud(dt);pwStep(dt);freeLookStep(dt);
    // morts : petite chute
    ents.forEach(function(e){if(!e.alive&&e.dieT>0&&e.kind==='z'&&e.fx!==undefined){e.dieT-=dt;stepDeath(e,dt);if(e.dieT<=0){scene.remove(e.m);if(e.pool)scene.remove(e.pool);e.m=null}return}if(!e.alive&&e.dieT>0){e.dieT-=dt;var tt=1.2-e.dieT;if(e.kind==='z'){if(!e.dusted&&tt>.4){e.dusted=1;dust(e.x,e.z)}e.m.rotation.x=-Math.min(Math.PI/2,tt*3.2);var pp=e.m.userData.parts;if(pp){pp.arms[0].rotation.x=-2.8+Math.sin(tt*12)*.4;pp.arms[1].rotation.x=-2.5-Math.sin(tt*12)*.4;pp.jaw.rotation.x=.6}e.m.position.y=-Math.max(0,tt-.7)*1.2}else{e.m.rotation.x=Math.min(Math.PI/2,tt*3)}e.m.position.y=e.kind==='z'?e.m.position.y:-Math.max(0,tt-.8);if(e.dieT<=0){scene.remove(e.m);e.m=null}}if(e.m&&e.hit>0){e.hit-=dt}});
    ents=ents.filter(function(e){return e.alive||e.m||(e.kind==='b'&&mode==='br')});
    // projectiles (cracheurs)
    shots.forEach(function(s){s.x+=s.vx*dt;s.z+=s.vz*dt;s.t-=dt;s.m.position.set(s.x,1.3,s.z);if(Math.hypot(s.x-P.x,s.z-P.z)<.8&&!dead&&!P.down){hurt(s.dmg,'un cracheur');s.t=0}if(coop&&auth&&s.t>0)Object.keys(remotes).forEach(function(k){var rr=remotes[k];if(rr.al===1&&Math.hypot(s.x-rr.x,s.z-rr.z)<.8){net.to(k,{t:'zc-dmg',d:s.dmg,by:'un cracheur'});s.t=0}});if(solid(s.x,s.z))s.t=0});
    shots=shots.filter(function(s){if(s.t<=0){scene.remove(s.m);return false}return true});
    smokes.forEach(function(s){s.t-=dt;s.m.position.y+=dt*.6;s.m.scale.multiplyScalar(1+dt*2.2);s.m.material.opacity=Math.max(0,s.t*.5)});smokes=smokes.filter(function(s){if(s.t<=0){scene.remove(s.m);return false}return true});
    tracers.forEach(function(s){s.t-=dt;s.m.material.opacity=Math.max(0,s.t/.09*.9)});tracers=tracers.filter(function(s){if(s.t<=0){scene.remove(s.m);s.m.geometry.dispose();return false}return true});
    sparks.forEach(function(s){s.t-=dt;s.v.y-=9*dt;s.m.position.addScaledVector(s.v,dt)});sparks=sparks.filter(function(s){if(s.t<=0){scene.remove(s.m);if(s.m.material&&s.m.material.dispose)s.m.material.dispose();if(s.m.geometry&&!s.m.geometry.userData.keep)s.m.geometry.dispose();return false}return true});
    feed.forEach(function(f){f.ttl-=dt});if(feed.length&&feed[feed.length-1].ttl<=0){feed.pop();renderFeed()}
    stepNades(dt);stepBooms(dt);stepDoors(dt);stepDeps(dt);
    if(mode==='zombie'&&P&&P.pkW!==wave){P.pkW=wave;if(wave>0)spawnPerk()}
    if(online)sendState(dt);
  }
  /* ---------- Portes payantes et armureries (mode zombies) ---------- */
  var openingDoors=[];
  function interact(){
    if(coop&&reviveStep())return;
    near=null;var best=1e9;
    DOORS.forEach(function(d){if(d.open)return;var dd=Math.hypot(d.cx-P.x,d.cz-P.z);if(dd<3.9&&dd<best){best=dd;near={door:d}}});
    STANDS.forEach(function(s){var dd=Math.hypot(s.x-P.x,s.z-P.z);if(dd<3.1&&dd<best){best=dd;near={stand:s}}});
    PERKS.forEach(function(p){if(p.x==null)return;var dd=Math.hypot(p.x-P.x,p.z-P.z);if(dd<2.9&&dd<best){best=dd;near={perk:p}}});
    if(!near)setPrompt('');
    else if(near.perk){var pkd=PK[near.perk.id],own=P.perks&&P.perks[near.perk.id];setPrompt(own?'<span><b>'+esc(pkd.n)+'</b> : déjà bue</span>':pkN()>=PK_MAX?'<span>Tu as déjà <b>4 boissons</b> (maximum)</span>':'<kbd>E</kbd><span>Boire <b>'+esc(pkd.n)+'</b> · '+esc(pkd.d)+'</span><em class="'+(P.pts>=pkPrice()?'':'no')+'">'+pkPrice()+'</em>')}
    else if(near.door){var d=near.door,ok=P.pts>=cost(d.cost),to=ZNAME[UNL[d.a]?d.b:d.a];setPrompt('<kbd>E</kbd><span>Ouvrir vers <b>'+esc(to||'')+'</b></span><em class="'+(ok?'':'no')+'">'+cost(d.cost)+'</em>')}
    else setPrompt('<kbd>E</kbd><span>'+STN[near.stand.tier||0]+'</span><em>acheter</em>');
    if(keys.E){keys.E=false;use()}
  }
  function use(){if(!near||dead||P.down)return;if(near.perk)buyPerk(near.perk);else if(near.door)buyDoor(near.door);else openShop(near.stand)}
  function buyPerk(p){var id=p.id,pk=PK[id];P.perks=P.perks||{};if(P.perks[id]||P.drink){A.deny();return}if(pkN()>=PK_MAX){A.deny();PP.toast('4 boissons maximum','warn');return}var pr=pkPrice();if(P.pts<pr){A.deny();PP.toast('Il te manque '+(pr-P.pts)+' pièces','warn');return}
    P.pts-=pr;popPts(-pr);P.perks[id]=1;A.buy();A.gulp();near=null;perkSigns();if(id==='hp')P.hp=200;aiming=false;mouseDown=false;P.rel=0;P.drink=1;P.drinkS=performance.now();P.drinkC=pk.col;P.drinkFx=0;drinkModel(pk.col);var up=pk.n.toUpperCase();setTimeout(function(){center(up);setTimeout(function(){if(UI.center.textContent===up)center('')},1500)},1300);addFeed(pk.n+' : '+pk.d);hud()}
  function buyDoor(d){
    if(P.pts<cost(d.cost)){A.deny();PP.toast('Il te manque '+(d.cost-P.pts)+' pièces','warn');return}
    P.pts-=cost(d.cost);popPts(-cost(d.cost));if(coop)net.relay({g:'zdoor',i:DOORS.indexOf(d),n:net.me.name});openDoor(d);
  }
  function openDoor(d,remoteOpen){
    if(!d||d.open)return;d.open=true;A.door();
    var nz=UNL[d.a]?d.b:d.a,fresh=!UNL[nz];UNL[d.a]=UNL[d.b]=1;
    d.cells.forEach(function(c){G[c[1]][c[0]]='.';ALLOPEN.push(c)});refreshOpen();fields={};
    var si=solidMeshes.indexOf(d.m);if(si>=0)solidMeshes.splice(si,1);d.anim=0;openingDoors.push(d);d.lbls.forEach(function(l){d.g.remove(l)});
    if(fresh){var nm=ZNAME[nz]||'Nouvelle zone';addFeed('Nouvelle zone : '+nm);center(nm.toUpperCase());setTimeout(function(){if(UI.center.textContent===nm.toUpperCase())center('')},1800);
      var cells=ALLOPEN.filter(function(c){return ZG[c[1]]&&ZG[c[1]][c[0]]===nz});
      if(cells.length&&(!coop||auth)){for(var i=0;i<2;i++){var c=cellC(PP.pick(cells));addItem(i?'ammo':(Math.random()<.5?'med':'coin'),c.x,c.z)}if(Math.random()<.55){var c2=cellC(PP.pick(cells));addItem(PP.pick(['smg','shotgun','rifle','magnum']),c2.x,c2.z)}}}
    drawMiniBase();hud();
  }
  function stepDoors(dt){
    STANDS.forEach(function(s2,i){if(s2.ring){s2.ring.rotation.z+=dt*1.2;s2.ring.position.y=1.75+Math.sin(performance.now()/500+i)*.08}if(s2.glow)s2.glow.material.opacity=.4+Math.sin(performance.now()/400+i)*.12;if(s2.pulse>0&&s2.g){s2.pulse=Math.max(0,s2.pulse-dt*1.5);var ps=1+Math.sin(s2.pulse*Math.PI)*.12;s2.g.scale.set(ps,ps,ps)}});perkSigns();PERKS.forEach(function(p,i){if(p.glow)p.glow.material.opacity=.35+Math.sin(performance.now()/350+i)*.15});
    var tn=performance.now()/1000;DOORS.forEach(function(d,i){if(d.open||!d.lbls)return;var nearD=P&&Math.hypot(d.cx-P.x,d.cz-P.z)<9,ok=P&&P.pts>=cost(d.cost);d.lbls.forEach(function(l){l.position.y=l.userData.base+Math.sin(tn*2+i)*.07;var s=nearD&&ok?1+Math.sin(tn*5)*.04:1;l.scale.set(2.3*s,1.15*s,1);l.material.opacity=ok?1:.82})});
    openingDoors.forEach(function(d){d.anim+=dt;var k=Math.min(1,d.anim/.9);d.m.position.y=WH/2+k*k*WH;if(k>=1){d.done=1;d.m.visible=false}});openingDoors=openingDoors.filter(function(d){return !d.done})}
  var SHOP_EXTRA=[{id:'ammo',n:'Munitions',d:'Remplit les réserves de toutes tes armes',p:400},{id:'vest1',n:'Gilet léger',d:'+50 d\'armure',p:350},{id:'vest2',n:'Gilet lourd',d:'Armure remplie à 100',p:750},{id:'heal',n:'Trousse de soin',d:'Vie au maximum',p:300},{id:'fast',n:'Mains rapides',d:'Recharges 40 % plus rapides',p:1500},
    {id:'turret',n:'Tourelle',d:'Double canon, tire seule 60 s · F pour la poser, V pour choisir',p:2000},{id:'wire',n:'Barbelés',d:'Ralentit et blesse les zombies · F pour poser, V pour choisir',p:800},{id:'mine',n:'Mine',d:'Explose quand un zombie passe · F pour poser, V pour choisir',p:600}];
  var shopStand=null,STAND_UP=[3000,6000];
  function setStandTier(s,t){if(!s||(s.tier||0)>=t)return;s.tier=t;if(s.g){styleStand(s);if(s.sign)s.g.remove(s.sign);var sign=label([STN[t].toUpperCase(),'E · ACHETER'],['#e2361b','#a46cf0','#e8b531'][t]);sign.position.y=3.25;sign.scale.set(2.6,1.02,1);s.g.add(sign);s.sign=sign}try{drawMiniBase()}catch(e){}}
  /* v32 : défenses à poser (achetées à l'armurerie) : tourelle (5), barbelés (6), mine (7) */
  function zDmg(e,dmg){if(!e||!e.alive)return;if(coop&&!auth)net.send({t:'zc-hit',id:e.id,d:dmg,h:0});else damageEnt(e,dmg,net.me.name||'Toi',true,false)}
  /* v75 : tourelle refaite : socle hexagonal avec anneau lumineux, tête blindée arrondie, double canon avec ailettes, viseur lumineux */
  function turretModel(g){var S=function(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.45,metalness:.35},o||{}))},dk=S(0x1d1f24),gm=S(0x3a3f48),wh=S(0xe9e4da,{roughness:.6,metalness:.1}),rd=S(0xe2361b,{roughness:.5,metalness:.1}),glow=new THREE.MeshBasicMaterial({color:0x6fdc4a}),U={side:0,flT:0,barrels:[],flash:[]};
    function add(p,geo,mat,x,y,z){var m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);p.add(m);return m}
    add(g,new THREE.CylinderGeometry(.55,.62,.16,6),dk,0,.08,0);add(g,new THREE.CylinderGeometry(.5,.5,.03,6),wh,0,.175,0);
    var ring=add(g,new THREE.TorusGeometry(.42,.022,6,24),glow,0,.2,0);ring.rotation.x=Math.PI/2;U.ring=ring;
    add(g,new THREE.CylinderGeometry(.13,.2,.72,10),gm,0,.55,0);add(g,new THREE.CylinderGeometry(.22,.22,.08,16),dk,0,.93,0);
    U.yaw=new THREE.Group();U.yaw.position.y=1.0;g.add(U.yaw);
    var shell=add(U.yaw,new THREE.SphereGeometry(.34,20,14,0,Math.PI*2,0,Math.PI*.62),wh,0,.06,0);shell.scale.set(1,.8,1.15);
    add(U.yaw,new THREE.CylinderGeometry(.33,.3,.12,20),gm,0,.06,0);
    var stripe=add(U.yaw,new THREE.BoxGeometry(.06,.05,.7),rd,0,.34,0);
    [-1,1].forEach(function(s){var ch=add(U.yaw,new THREE.BoxGeometry(.08,.22,.34),dk,s*.33,.14,.02);ch.rotation.z=s*.12});
    U.pitch=new THREE.Group();U.pitch.position.set(0,.27,-.2);U.yaw.add(U.pitch);
    add(U.pitch,new THREE.BoxGeometry(.34,.14,.2),gm,0,0,0);
    [-.1,.1].forEach(function(o){var b=new THREE.Group();b.position.set(o,0,-.08);b.userData.z0=-.08;U.pitch.add(b);
      var br=add(b,new THREE.CylinderGeometry(.032,.036,.62,10),dk,0,0,-.33);br.rotation.x=Math.PI/2;
      for(var k=0;k<3;k++){var fin=add(b,new THREE.CylinderGeometry(.055,.055,.035,10),gm,0,0,-.14-k*.09);fin.rotation.x=Math.PI/2}
      var mz=add(b,new THREE.CylinderGeometry(.05,.042,.09,8),dk,0,0,-.66);mz.rotation.x=Math.PI/2;
      var fl=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),new THREE.MeshBasicMaterial({color:0xffd27a}));fl.scale.set(1,1,1.8);fl.position.z=-.8;fl.visible=false;b.add(fl);U.flash.push(fl);U.barrels.push(b)});
    var scope=add(U.yaw,new THREE.BoxGeometry(.12,.09,.16),dk,0,.38,-.12);
    U.eye=add(U.yaw,new THREE.SphereGeometry(.045,10,8),new THREE.MeshBasicMaterial({color:0x6fdc4a}),0,.38,-.21);
    var bg=new THREE.Mesh(new THREE.PlaneGeometry(.66,.08),new THREE.MeshBasicMaterial({color:0x141210,side:THREE.DoubleSide}));bg.position.y=1.85;g.add(bg);U.bar=new THREE.Mesh(new THREE.PlaneGeometry(.62,.05),new THREE.MeshBasicMaterial({color:0x6fdc4a,side:THREE.DoubleSide}));U.bar.position.set(0,1.85,.001);g.add(U.bar);U.bg=bg;
    g.traverse(function(o){if(o.isMesh&&!o.material.isMeshBasicMaterial)o.castShadow=true});return U}
  var HAZT=null;function hazTex(){if(HAZT)return HAZT;HAZT=tex(64,64,function(g,w,h){g.fillStyle='#141210';g.fillRect(0,0,w,h);g.fillStyle='#e8b520';for(var i=-w;i<w*2;i+=24){g.beginPath();g.moveTo(i,0);g.lineTo(i+12,0);g.lineTo(i+12-h,h);g.lineTo(i-h,h);g.fill()}});return HAZT}
  /* v57 : choisir la défense à poser (V) et la poser (F) */
  var DEFK=['turret','wire','mine'],DEFN={turret:'Tourelle',wire:'Barbelés',mine:'Mine'};
  function defSel(){if(!P)return null;P.kit=P.kit||{};var cur=P.defSel;if(cur&&P.kit[cur]>0)return cur;for(var i=0;i<3;i++)if(P.kit[DEFK[i]]>0)return P.defSel=DEFK[i];return null}
  function defCycle(){if(!P)return;var wasG=!!ghost;P.kit=P.kit||{};var own=DEFK.filter(function(k){return P.kit[k]>0});if(!own.length){PP.toast('Pas de défense : achète-en à l\'armurerie','warn');return}var i=own.indexOf(P.defSel);P.defSel=own[(i+1)%own.length];addFeed('Défense choisie : '+DEFN[P.defSel]);if(wasG)ghostShow(P.defSel);hud()}
  function defPlace(){var k=defSel();if(!k){PP.toast('Pas de défense : achète-en à l\'armurerie','warn');return}ghostShow(k)}
  /* v75 : pose facile : maintiens F, un aperçu vert montre où ça va (là où tu regardes), relâche pour poser */
  var ghost=null,ghostK=null,ghostOk=false,ghostX=0,ghostZ=0;
  function ghostShow(k){ghostHide();if(!scene||!P||dead||mode!=='zombie')return;ghostK=k;var g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:0x6fdc4a,transparent:true,opacity:.45,depthWrite:false});g.userData.mat=m;
    if(k==='turret'){var a=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,1.4,6),m);a.position.y=.7;g.add(a);var r=new THREE.Mesh(new THREE.RingGeometry(17.6,18,64),m);r.rotation.x=-Math.PI/2;r.position.y=.06;g.add(r)}
    else if(k==='wire'){var w=new THREE.Mesh(new THREE.BoxGeometry(3.9,.9,.25),m);w.position.y=.45;g.add(w)}
    else{var mn=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.14,14),m);mn.position.y=.07;g.add(mn);var r2=new THREE.Mesh(new THREE.RingGeometry(2.3,2.5,32),m);r2.rotation.x=-Math.PI/2;r2.position.y=.06;g.add(r2)}
    var dot=new THREE.Mesh(new THREE.RingGeometry(.5,.62,24),m);dot.rotation.x=-Math.PI/2;dot.position.y=.05;g.add(dot);g.traverse(function(o){o.raycast=function(){}});scene.add(g);ghost=g;ghostStep();addFeed(DEFN[k]+' : vise le sol, relâche F pour poser')}
  function ghostHide(){if(ghost){scene&&scene.remove(ghost);disposeObj(ghost);ghost=null}}
  function ghostStep(){if(!ghost||!P)return;if(dead||P.down||shopOpen){ghostHide();return}var cp=Math.cos(P.pitch),fy=Math.sin(P.pitch),eh=EYE+(P.y||0),d=fy<-.06?eh/(-fy)*cp:3.5;d=Math.max(1.4,Math.min(7,d));
    var x=P.x-Math.sin(P.yaw)*d,z=P.z-Math.cos(P.yaw)*d;ghostOk=!solid(x,z)&&los(P.x,P.z,x,z);ghostX=x;ghostZ=z;ghost.position.set(x,0,z);ghost.rotation.y=P.yaw;ghost.userData.mat.color.setHex(ghostOk?0x6fdc4a:0xe2361b)}
  function ghostDrop(){if(!ghost)return;var k=ghostK,ok=ghostOk,x=ghostX,z=ghostZ;ghostHide();if(ok)deploy(k,x,z);else PP.toast('Pas de place ici : vise un endroit libre','warn')}
  function deploy(kind,px,pz){if(!P||dead||P.down||mode!=='zombie'||shopOpen)return;if(!(P.kit&&P.kit[kind]>0)){PP.toast('Achète-en d\'abord à l\'armurerie','warn');return}
    var x=px!=null?px:P.x-Math.sin(P.yaw)*1.9,z=pz!=null?pz:P.z-Math.cos(P.yaw)*1.9;if(solid(x,z)){x=P.x;z=P.z}P.kit[kind]--;
    placeDep(kind,x,z,P.yaw,true);
    /* v64 : la défense est envoyée aux potes (avant, elle n'existait que chez celui qui la posait) */
    if(coop)net.relay({g:'zdep',k:kind,x:+x.toFixed(2),z:+z.toFixed(2),y:+P.yaw.toFixed(3),n:net.me.name||'?'});
    A.pick();addFeed(({turret:'Tourelle posée (60 s)',wire:'Barbelés posés',mine:'Mine posée'})[kind]);hud()}
  var DEPT={turret:60,wire:90,mine:600};
  function defsMsg(){return DEPS.filter(function(d){return d.t>0}).map(function(d){return [d.k,+d.x.toFixed(2),+d.z.toFixed(2),+(d.yaw||0).toFixed(3),+d.t.toFixed(1)]})}
  function netDeploy(a){if(!a||DEFK.indexOf(a[0])<0||!isFinite(a[1])||!isFinite(a[2]))return;placeDep(a[0],+a[1],+a[2],+a[3]||0,false,+a[4]||null)}
  /* v64 : libère la mémoire de la carte graphique quand une défense disparaît (la texture à bandes est partagée, on la garde) */
  function disposeObj(o){if(!o)return;o.traverse(function(c){if(c.geometry)c.geometry.dispose();if(c.material){(Array.isArray(c.material)?c.material:[c.material]).forEach(function(mt){mt.dispose()})}})}
  function dropDep(d){if(d.m){scene&&scene.remove(d.m);disposeObj(d.m);d.m=null}if(d.ring){scene&&scene.remove(d.ring);disposeObj(d.ring);d.ring=null}}
  function placeDep(kind,x,z,yaw,mine,tLeft,by){if(!scene||DEFK.indexOf(kind)<0)return;
    var g=new THREE.Group(),dk=lam({color:0x2a2c30}),st=lam({color:0x6a6f78}),head=null;
    var tur=null;
    if(kind==='turret'){tur=turretModel(g);head=tur.yaw}
    else if(kind==='wire'){for(var i=0;i<5;i++){var c=new THREE.Mesh(new THREE.TorusGeometry(.42,.025,5,14),st);c.position.set(-1.6+i*.8,.42,0);c.rotation.y=Math.PI/2+(i%2?.35:-.35);g.add(c)}[-1.9,0,1.9].forEach(function(o){var p2=new THREE.Mesh(new THREE.BoxGeometry(.08,.95,.08),lam({color:0x5a3a22}));p2.position.set(o,.47,0);g.add(p2)});g.rotation.y=yaw}
    else{var mb=new THREE.Mesh(new THREE.CylinderGeometry(.3,.36,.12,14),lam({color:0x3f4a2e}));mb.position.y=.06;g.add(mb);head=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:0xff3b1f}));head.position.y=.15;g.add(head)}
    g.position.set(x,0,z);g.traverse(function(o){o.raycast=function(){}});scene.add(g);DEPS.push({k:kind,x:x,z:z,yaw:yaw,mine:!!mine,by:by||'',m:g,head:head,tur:tur,t:tLeft||DEPT[kind],cd:0,acc:0,born:tLeft?3:0});
    if(kind==='turret'){g.scale.set(1,.01,1);var ring=new THREE.Mesh(new THREE.RingGeometry(17.6,18,64),new THREE.MeshBasicMaterial({color:0x6fdc4a,transparent:true,opacity:.55,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.05,z);scene.add(ring);DEPS[DEPS.length-1].ring=ring;if(tLeft){g.scale.set(1,1,1)}}}
  /* dégâts des défenses : calculés seulement par le chef (ou en solo) ; chez les invités, c'est juste l'animation */
  function depDmg(d,e,dmg){if(!e||!e.alive)return;if(coop&&!auth)return;damageEnt(e,dmg,d.mine?(net.me.name||'Toi'):(d.by||'Une tourelle'),d.mine,false,{x:d.x,z:d.z})}
  function stepDeps(dt){if(!DEPS.length)return;var zs=ents.filter(function(e){return e.kind==='z'&&e.alive&&e.rise>=1});
    DEPS.forEach(function(d){d.t-=dt;
      if(d.k==='turret'){var U=d.tur;d.born+=dt;
        /* déploiement : elle sort du sol en 0,5 s, puis le cercle de portée s'efface */
        var up=Math.min(1,d.born/.5);d.m.scale.set(1,Math.max(.01,1-Math.pow(1-up,3)),1);if(d.ring){d.ring.material.opacity=Math.max(0,.55-d.born*.22);if(d.born>2.6){scene.remove(d.ring);d.ring=null}}
        if(up<1)return;d.cd-=dt;var best=null,bd=18;zs.forEach(function(e){var dd=Math.hypot(e.x-d.x,e.z-d.z);if(dd<bd&&los(d.x,d.z,e.x,e.z)){bd=dd;best=e}});
        var want=best?Math.atan2(-(best.x-d.x),-(best.z-d.z)):U.yaw.rotation.y+dt*.7,dy=want-U.yaw.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));U.yaw.rotation.y+=dy*Math.min(1,dt*(best?14:3));
        U.pitch.rotation.x+=((best?Math.atan2(1.1-1.27,Math.max(1,bd)):-.05)-U.pitch.rotation.x)*Math.min(1,dt*8);
        if(best&&Math.abs(dy)<.25&&d.cd<=0){d.cd=.16;depDmg(d,best,16);U.side=1-U.side;var bz=U.barrels[U.side];bz.position.z=bz.userData.z0+.12;U.flash[U.side].visible=true;U.flT=.05;
          var mp=new THREE.Vector3();U.flash[U.side].getWorldPosition(mp);tracer(mp,new THREE.Vector3(best.x,1.2,best.z));if(P&&Math.hypot(P.x-d.x,P.z-d.z)<22)sfx.play('shoot')}
        U.barrels.forEach(function(b){b.position.z+=(b.userData.z0-b.position.z)*Math.min(1,dt*14)});if(U.flT>0){U.flT-=dt;if(U.flT<=0)U.flash.forEach(function(f){f.visible=false})}
        /* l'œil passe du vert au jaune puis au rouge avec le temps qui reste, et clignote à la fin */
        var fr=d.t/60;U.eye.material.color.setHex(fr>.5?0x6fdc4a:fr>.2?0xf3c623:0xe2361b);U.eye.visible=d.t>8||Math.floor(d.t*6)%2===0;U.bar.scale.x=Math.max(.02,fr);U.bar.material.color.copy(U.eye.material.color);if(U.ring)U.ring.material.color.copy(U.eye.material.color);U.bar.quaternion.copy(cam.quaternion);U.bg.quaternion.copy(cam.quaternion)}
      else if(d.k==='wire'){d.acc+=dt;var hit=d.acc>=.5;if(hit)d.acc=0;zs.forEach(function(e){if(Math.hypot(e.x-d.x,e.z-d.z)<2.3){e.slowT=.4;if(hit){depDmg(d,e,9);d.t-=.6}}})}
      else{if(d.head)d.head.visible=Math.floor(performance.now()/300)%2===0;if(zs.some(function(e){return Math.hypot(e.x-d.x,e.z-d.z)<1.7})){explode(d.x,.4,d.z,5.5,coop&&!auth?0:280,d.mine?(net.me.name||'Toi'):(d.by||'Une mine'),d.mine,true);d.t=0}}});
    DEPS=DEPS.filter(function(d){if(d.t<=0){dropDep(d);return false}return true})}
  /* v32 : les boissons apparaissent au hasard sur la carte (une par vague, 3 au maximum) : va dessus et achète-la avec E */
  function spawnPerk(){if(!P||mode!=='zombie'||PERKS.length>=PK_ORDER.length)return;var ids=PK_ORDER.filter(function(k){return !PERKS.some(function(p){return p.id===k})});if(!ids.length)return;
    /* v45 : jamais deux boissons dans la même salle (zone) */
    var taken={},s=null;PERKS.forEach(function(q){taken[zoneOf(q.x,q.z)]=1;if(q.mx!=null)taken[zoneOf(q.mx-q.dx*.5,q.mz-q.dz*.5)]=1});s=perkSpot(taken);if(!s)return;
    var id=PP.pick(ids),p={id:id,x:s.x,z:s.z,mx:s.mx,mz:s.mz,dx:s.dx,dz:s.dz,ex:s.ex,ez:s.ez};buildPerk(p);PERKS.push(p);addFeed(PK[id].n+' est apparue sur la carte');try{drawMiniBase()}catch(e){}}
  function shopList(){var tr=shopStand?shopStand.tier||0:0;return tr===2?['minigun','ray','tesla','rocket','launcher','lmg','bullpup','sniper','dmr']:tr===1?['sniper','hunter','lmg','autoshot','dmr','pdw','carbine','rifle','shotgun']:['magnum','revolver','smg','carbine','rifle','shotgun','pdw']}
  function bar(v){return '<i><em style="--w:'+Math.round(Math.max(.06,Math.min(1,v))*100)+'%"></em></i>'}
  var XI={ammo:'M5 4h3v3H5zM10 4h3v3h-3zM15 4h3v3h-3zM5 8h3v12H5zM10 8h3v12h-3zM15 8h3v12h-3z',vest1:'M8 2l-5 4v15h8v-6h2v6h8V6l-5-4-2 4h-4z',vest2:'M8 2l-6 4v16h9v-6h2v6h9V6l-6-4-2 4h-4zM7 9h10v3H7z',heal:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',fast:'M13 2L4 14h7l-2 8 9-12h-7z',turret:'M9 4h6v5h7v3h-7v2l4 7h-3l-3-5h-2l-3 5H5l4-7v-2H2V9h7z',wire:'M2 8l4 8 4-8 4 8 4-8 4 8M2 16l4-8 4 8 4-8 4 8 4-8M3 4v16M21 4v16',mine:'M12 5a2 2 0 0 1 2 2v2h3l4 6v3H3v-3l4-6h3V7a2 2 0 0 1 2-2z'};
  var TIERN=['Commune','Rare','Épique','Lourde','Légendaire'];
  /* v60 : nouvelle armurerie — onglets, liste à gauche, fiche détaillée à droite (comparaison avec l'arme en main), gros bouton d'achat */
  var shopTab='w',shopSel=null;
  function shopItems(tab){var full=P.inv.length>=MAXSLOT,L=[];
    if(tab==='w')shopList().forEach(function(t){var g=GUNS[t],own=!!P.guns[t],p=own?Math.round(g.price/2):cost(g.price);L.push({id:t,n:T(g.n),sub:T(TIERN[g.tier]),tier:g.tier,p:p,ok:P.pts>=p,own:own,gun:g,ico:ICON[t],vb:'0 0 64 24',act:own?T('Racheter des munitions'):T('Acheter'),note:!own&&full?T('Remplace l\'arme que tu as en main'):''})});
    else if(tab==='e')SHOP_EXTRA.forEach(function(x){var done=x.id==='fast'&&P.fastRel;L.push({id:x.id,n:T(x.n),sub:T(x.d),tier:-1,p:cost(x.p),ok:P.pts>=cost(x.p)&&!done,own:done,ico:XI[x.id],vb:'0 0 24 24',act:done?T('Déjà acquis'):T('Acheter'),cnt:P.kit&&P.kit[x.id]?P.kit[x.id]:0})});
    else{var stT=shopStand.tier||0;if(stT<2){var stP=cost(STAND_UP[stT]);L.push({id:'standup',n:T(STN[stT+1]),sub:T('Débloque ici')+' : '+(stT===0?'Sniper, Mitrailleuse, Fusil tactique':'Minigun, Pistolet à rayons, Lance-roquettes, Lance-grenades'),tier:stT+2,p:stP,ok:P.pts>=stP,ico:'M12 3l8 8h-5v10H9V11H4z',vb:'0 0 24 24',act:T('Améliorer l\'armurerie')})}
      var lv=upLv(P.gun),gu=GUNS[P.gun],mx=lv>=3,upp=mx?0:cost(UP_PRICE[lv]);L.push({id:'upgrade',n:T(gu.n)+' '+'★★★'.slice(0,lv),sub:mx?T('Niveau maximum'):T('Niveau')+' '+(lv+1)+' : +40 % de dégâts, chargeur +30 %',tier:3,p:upp,ok:!mx&&P.pts>=upp,own:mx,ico:ICON[P.gun]||'',vb:'0 0 64 24',act:mx?T('Niveau maximum'):T('Améliorer')})}
    return L}
  function statRow(lbl,v,cur,fmt){var w=Math.max(.05,Math.min(1,v)),c=cur==null?null:Math.max(.05,Math.min(1,cur)),d=c==null?'':(v>cur+.01?'<em class="up">▲</em>':v<cur-.01?'<em class="dn">▼</em>':'');
    return '<div class="sh2-stat"><span>'+lbl+'</span><i>'+(c!=null?'<u style="--w:'+Math.round(c*100)+'%"></u>':'')+'<b style="--w:'+Math.round(w*100)+'%"></b></i><small>'+fmt+d+'</small></div>'}
  function shopHtml(){
    var L=shopItems(shopTab);if(!L.some(function(x){return x.id===shopSel}))shopSel=(L.filter(function(x){return x.ok})[0]||L[0]||{}).id;var S0=L.filter(function(x){return x.id===shopSel})[0];
    var tier=shopStand.tier===2?3:shopStand.tier===1?2:1,TB=[['w',T('Armes')],['e',T('Équipement')],['u',T('Améliorations')]];
    var h='<div class="sh2 t'+tier+'"><div class="sh2-head"><div><small>'+T('Zone Morte')+' · '+T('Armurerie')+'</small><b>'+T(STN[shopStand.tier||0])+'</b></div><span class="sh-pts sh2-pts"><i></i><span>'+P.pts.toLocaleString('fr-FR')+'</span></span><button type="button" class="sh2-x" data-buy="close">'+T('Fermer')+' <kbd>E</kbd></button></div>';
    h+='<div class="sh2-body"><div class="sh2-left"><div class="sh2-tabs">'+TB.map(function(t){return '<button type="button" data-tab="'+t[0]+'" class="'+(t[0]===shopTab?'on':'')+'">'+t[1]+'</button>'}).join('')+'</div><div class="sh2-list">';
    L.forEach(function(x,i){h+='<button type="button" data-sel="'+x.id+'" class="sh2-row r'+(x.tier+1)+(x.id===shopSel?' on':'')+(x.ok?'':' no')+(x.own?' own':'')+'" style="--i:'+i+'"><span class="sh2-ri"><svg viewBox="'+x.vb+'"><path d="'+x.ico+'"/></svg></span><span class="sh2-rn"><b>'+x.n+'</b><small>'+(x.gun?x.sub:(x.cnt?'× '+x.cnt+' · ':'')+x.sub)+'</small></span><em>'+(x.own&&!x.gun?'✓':cost(x.p).toLocaleString('fr-FR'))+'</em></button>'});
    h+='</div></div><div class="sh2-right">';
    if(S0){var cg=GUNS[P.gun],g=S0.gun;
      h+='<div class="sh2-hero r'+(S0.tier+1)+'"><span class="sh2-rar">'+(S0.gun?S0.sub:shopTab==='e'?T('Équipement'):T('Amélioration'))+'</span><svg viewBox="'+S0.vb+'"><path d="'+S0.ico+'"/></svg></div><h4>'+S0.n+'</h4>';
      if(g){var dm=g.dmg*g.pel,cdm=cg?cg.dmg*cg.pel:null;h+='<div class="sh2-stats">'+statRow(T('Dégâts'),dm/130,cdm==null?null:cdm/130,Math.round(dm))+statRow(T('Cadence'),.1/g.rate,cg?.1/cg.rate:null,(1/g.rate).toFixed(1)+'/s')+statRow(T('Chargeur'),g.mag/80,cg?cg.mag/80:null,g.mag)+'</div><p class="sh2-cmp">'+T('Le trait rouge = ton arme en main')+' ('+T(cg?cg.n:'')+')</p>'}
      else h+='<p class="sh2-desc">'+S0.sub+'</p>';
      if(S0.note)h+='<p class="sh2-note">'+S0.note+'</p>';
      h+='<button type="button" class="sh2-buy'+(S0.ok?'':' no')+'" data-buy="'+S0.id+'"><span>'+S0.act+'</span>'+(S0.own&&!S0.gun?'':'<b><i></i>'+S0.p.toLocaleString('fr-FR')+'</b>')+'</button>'+(!S0.ok&&!S0.own&&P.pts<S0.p?'<p class="sh2-miss">'+T('Il te manque')+' '+(S0.p-P.pts).toLocaleString('fr-FR')+'</p>':'');}
    h+='<p class="sh2-keys"><kbd>↑</kbd><kbd>↓</kbd> '+T('choisir')+' · <kbd>Entrée</kbd> '+T('acheter')+' · '+T('double-clic pour acheter vite')+'</p></div></div></div>';
    return h}
  function shopMove(d){var L=shopItems(shopTab),i=L.map(function(x){return x.id}).indexOf(shopSel);i=Math.max(0,Math.min(L.length-1,i+d));shopSel=L[i]&&L[i].id;UI.shop.innerHTML=shopHtml();A.ui&&A.ui()}
  function shopHtmlOld(){
    var full=P.inv.length>=MAXSLOT,n=0;
    var h='<div class="sh-head t'+(shopStand.tier===2?3:shopStand.tier===1?2:1)+'"><div><small>'+T('Zone Morte')+'</small><b>'+T(STN[shopStand.tier||0])+'</b></div><span class="sh-pts"><i></i><span>'+P.pts.toLocaleString('fr-FR')+'</span></span><button type="button" class="sh-x" data-buy="close">'+T('Fermer · E')+'</button></div><p class="sh-sec">'+T('Armes')+'</p><div class="sh-grid">';
    shopList().forEach(function(t){var g=GUNS[t],own=!!P.guns[t],p=own?Math.round(g.price/2):cost(g.price),ok=P.pts>=p;
      h+='<button type="button" class="sh-card t'+g.tier+(ok?'':' no')+(own?' own':'')+'" data-buy="'+t+'" style="--i:'+(n++)+'"><span class="sh-rar">'+T(TIERN[g.tier])+'</span>'+(own?'<span class="sh-badge">'+T('Possédée')+'</span>':'')+
        '<div class="sh-ico"><svg viewBox="0 0 64 24"><path d="'+ICON[t]+'"/></svg></div><b>'+T(g.n)+'</b><span class="sh-st"><span>'+T('Dégâts')+'</span>'+bar(g.dmg*g.pel/130)+'<span>'+T('Cadence')+'</span>'+bar(.1/g.rate)+'<span>'+T('Chargeur')+'</span>'+bar(g.mag/80)+'</span>'+
        '<em class="sh-price">'+(own?T('Munitions')+' · ':'')+p.toLocaleString('fr-FR')+'</em>'+(!own&&full?'<small>'+T('remplace l\'arme en main')+'</small>':'')+'</button>'});
    h+='</div><p class="sh-sec">'+T('Équipement')+'</p><div class="sh-grid sh-extra">';
    SHOP_EXTRA.forEach(function(x){var done=x.id==='fast'&&P.fastRel,ok=P.pts>=cost(x.p)&&!done;h+='<button type="button" class="sh-card x'+(ok?'':' no')+(done?' own':'')+'" data-buy="'+x.id+'" style="--i:'+(n++)+'"><div class="sh-xi"><svg viewBox="0 0 24 24"><path d="'+XI[x.id]+'"/></svg></div><b>'+T(x.n)+'</b><span>'+T(x.d)+'</span><em class="sh-price">'+(done?T('acquis'):cost(x.p).toLocaleString('fr-FR'))+'</em></button>'});
    /* v32 : améliorer l'armurerie elle-même pour débloquer les armes du niveau au-dessus */
    var stT=shopStand.tier||0;if(stT<2){var stP=cost(STAND_UP[stT]),okS=P.pts>=stP;h+='</div><p class="sh-sec">'+T('Améliorer l\'armurerie')+'</p><div class="sh-grid sh-extra"><button type="button" class="sh-card x'+(okS?'':' no')+'" data-buy="standup" style="--i:'+(n++)+'"><div class="sh-xi"><svg viewBox="0 0 24 24"><path d="M12 3l8 8h-5v10H9V11H4z"/></svg></div><b>'+T(STN[stT+1])+'</b><span>'+T('Débloque ici')+' : '+(stT===0?'Sniper, Mitrailleuse, Fusil tactique':'Minigun, Pistolet à rayons, Lance-roquettes, Lance-grenades')+'</span><em class="sh-price">'+stP.toLocaleString('fr-FR')+'</em></button>'}
    var lv=upLv(P.gun),gu=GUNS[P.gun],mx=lv>=3,upp=mx?0:cost(UP_PRICE[lv]),okU=!mx&&P.pts>=upp;
    h+='</div><p class="sh-sec">'+T('Améliorer l\'arme en main')+'</p><div class="sh-grid sh-extra"><button type="button" class="sh-card x'+(okU?'':' no')+(mx?' own':'')+'" data-buy="upgrade" style="--i:'+(n++)+'"><div class="sh-ico"><svg viewBox="0 0 64 24"><path d="'+(ICON[P.gun]||'')+'"/></svg></div><b>'+T(gu.n)+' '+'★★★'.slice(0,lv)+'</b><span>'+(mx?T('Niveau maximum'):T('Niveau')+' '+(lv+1)+' : +40 % de dégâts, chargeur +30 %')+'</span><em class="sh-price">'+(mx?'max':upp.toLocaleString('fr-FR'))+'</em></button>';
    return h+'</div>';
  }
  function shopRefresh(id){UI.shop.classList.remove('enter');UI.shop.innerHTML=shopHtml();var c=id&&UI.shop.querySelector('[data-buy="'+id+'"]');if(c){c.classList.add('bought');var st=document.createElement('span');st.className='sh-stamp';st.textContent=T('Acheté !');c.appendChild(st)}var pt=UI.shop.querySelector('.sh-pts');if(pt&&id){pt.classList.add('spent')}}
  function openShop(s){shopStand=s;shopOpen=true;keys={};mouseDown=false;aiming=false;setPrompt('');UI.shop.innerHTML=shopHtml();UI.shop.classList.remove('enter');void UI.shop.offsetWidth;UI.shop.classList.add('enter');UI.shop.hidden=false;A.ui();unlock()}
  function closeShop(){if(!shopOpen)return;shopOpen=false;UI.shop.hidden=true;keys={};lock();if(document.pointerLockElement!==cv&&matchMedia('(hover:hover)').matches)$('fps-lockhint').hidden=false}
  function shopClick(e){if(!P)return;var s2=e.target.closest('[data-tab],[data-sel]');
    if(s2){e.preventDefault();if(s2.dataset.tab){shopTab=s2.dataset.tab;shopSel=null;UI.shop.innerHTML=shopHtml();A.ui&&A.ui();return}
      var sid=s2.dataset.sel;if(sid===shopSel&&e.detail>=2){var bb=UI.shop.querySelector('.sh2-buy[data-buy="'+sid+'"]');if(bb)bb.click();return}if(sid!==shopSel){shopSel=sid;UI.shop.innerHTML=shopHtml();A.ui&&A.ui()}return}
    var b=e.target.closest('[data-buy]');if(!b)return;e.preventDefault();var id=b.dataset.buy;if(id==='close'){closeShop();return}
    if(id==='standup'){var stT=shopStand.tier||0;if(stT>=2)return;var stP=cost(STAND_UP[stT]);if(P.pts<stP){A.deny();b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');return}
      P.pts-=stP;popPts(-stP);A.buy();setStandTier(shopStand,stT+1);if(coop)net.relay({g:'zstand',i:STANDS.indexOf(shopStand),t:stT+1,n:net.me.name});hud();shopRefresh();return}
    if(id==='upgrade'){var lv=upLv(P.gun);if(lv>=3){A.deny();return}var upp=cost(UP_PRICE[lv]);if(P.pts<upp){A.deny();b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');return}
      P.pts-=upp;popPts(-upp);A.buy();P.up=P.up||{};P.up[P.gun]=lv+1;var ga=P.guns[P.gun];ga.mag=magOf(P.gun);if(ga.res!==Infinity)ga.res=Math.max(ga.res,magOf(P.gun)*4);setViewGun();hud();shopRefresh(id);return}
    var g=GUNS[id],x=SHOP_EXTRA.filter(function(q){return q.id===id})[0],p=g?(P.guns[id]?Math.round(g.price/2):cost(g.price)):cost(x.p);
    if(x&&id==='fast'&&P.fastRel)return;
    if(P.pts<p){A.deny();b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');return}
    if(id==='heal'&&P.hp>=maxHp()){A.deny();return}if(id==='vest2'&&P.ar>=100){A.deny();return}
    P.pts-=p;popPts(-p);A.buy();
    if(g){if(P.guns[id])P.guns[id].res=Math.max(P.guns[id].res,g.mag*4);else giveGun(id,true)}
    else if(id==='ammo')P.inv.forEach(function(k){var a=P.guns[k];if(a.res!==Infinity)a.res=Math.max(a.res,GUNS[k].mag*4)});
    else if(id==='vest1')P.ar=Math.min(150,P.ar+50);else if(id==='vest2')P.ar=Math.max(P.ar,100);else if(id==='heal')P.hp=maxHp();else if(id==='fast')P.fastRel=true;else if(id==='turret'||id==='wire'||id==='mine'){P.kit=P.kit||{};P.kit[id]=(P.kit[id]||0)+1}
    hud();shopRefresh(id);
  }
  function stepZombies(dt){
    var alive=0;
    ents.forEach(function(e){
      if(!e.alive||e.kind!=='z')return;alive++;
      var T=zTarget(e),TX=T.x,TZ=T.z,d=Math.hypot(TX-e.x,TZ-e.z),a=pathDir(e,TX,TZ);
      if(e.type==='spitter'&&d<18&&los(e.x,e.z,TX,TZ)){e.spit-=dt;a=Math.atan2(TX-e.x,TZ-e.z);if(d<9)a+=Math.PI;
        if(e.spit<=0){e.spit=2.6;e.atk=.45;var m=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:0x9b4dff}));scene.add(m);var ang=Math.atan2(TX-e.x,TZ-e.z);shots.push({x:e.x,z:e.z,vx:Math.sin(ang)*11,vz:Math.cos(ang)*11,t:3,m:m,dmg:e.dmg})}}
      if(e.rise<1){e.yaw=Math.atan2(TX-e.x,TZ-e.z);e.m.position.x=e.x;e.m.position.z=e.z;e.m.rotation.y=e.yaw+Math.PI;zAnim(e,dt,false);return}
      e.groanT=(e.groanT===undefined?1+Math.random()*4:e.groanT)-dt;if(e.groanT<=0){e.groanT=3+Math.random()*6;if(d<34)A.groan(e,d)}
      if(e.kbx||e.kbz){moveEnt(e,e.kbx*dt,e.kbz*dt,e.r);var kd=Math.max(0,1-dt*7);e.kbx*=kd;e.kbz*=kd;if(Math.abs(e.kbx)+Math.abs(e.kbz)<.05)e.kbx=e.kbz=0}
      if(e.type==='brute'){e.chargeCd=(e.chargeCd===undefined?3:e.chargeCd)-dt;if(!(e.charge>0)&&e.chargeCd<=0&&d>5&&d<17&&los(e.x,e.z,TX,TZ)){e.charge=1.4;e.chargeCd=6+Math.random()*3;A.roar(e,d)}if(e.charge>0){e.charge-=dt;a=Math.atan2(TX-e.x,TZ-e.z)}
        e.stepT=(e.stepT||0)-dt;if(e.stepT<=0){e.stepT=e.charge>0?.22:.55;if(d<20)shakeT=Math.max(shakeT,.08*(1-d/20))}}
      if(e.type==='exploder'&&!T.none){if(!(e.fuse>0)&&d<2.4){e.fuse=.7;A.fuse(e)}if(e.fuse>0){e.fuse-=dt;if(e.fuse<=0){damageEnt(e,99999,'',false,false);return}}}
      if(e.slowT>0)e.slowT-=dt;var mv=(d>1.1||e.type==='spitter')&&!(e.fuse>0),spd2=e.sp*(e.charge>0?2.7:1)*(e.slowT>0?.35:1);
      e.mvF=mv;if(mv){moveEnt(e,Math.sin(a)*spd2*dt,Math.cos(a)*spd2*dt,e.r)}
      /* v29 : un zombie coincé (ou hors carte) est replacé, il ne reste plus « immortel » loin de tout */
      if(!isFinite(e.x)||!isFinite(e.z)){var s6=spawnFar(10);e.x=s6.x;e.z=s6.z}if(!isFinite(e.hp))e.hp=1;
      e.stT=(e.stT||0)+dt;if(e.stT>5){if(e.sx0!==undefined&&mv&&Math.hypot(e.x-e.sx0,e.z-e.sz0)<1.2&&d>4){var s5=spawnFar(10);e.x=s5.x;e.z=s5.z;dust(e.x,e.z)}e.sx0=e.x;e.sz0=e.z;e.stT=0}
      e.yaw=Math.atan2(TX-e.x,TZ-e.z);
      if(d<1.5+e.r&&!T.none&&e.type!=='exploder'){e.cd-=dt;if(e.cd<.45&&!e.atk&&e.cd>.4){e.atk=.45;A.swipe(e)}if(e.cd<=0){e.cd=e.type==='brute'?1.3:.9;if(T.me)hurt(e.dmg,ZT[e.type].n,e.x,e.z);else net.to(T.id,{t:'zc-dmg',d:e.dmg,by:ZT[e.type].n,x:e.x,z:e.z});e.atk=e.atk||.3;if(e.charge>0&&T.me){e.charge=0;P.vx=(P.vx||0)+Math.sin(e.yaw)*14;P.vz=(P.vz||0)+Math.cos(e.yaw)*14}}}
      e.m.position.set(e.x,0,e.z);e.m.rotation.y=e.yaw+Math.PI;zAnim(e,dt,mv);
      var hot=e.hit>0?0x661111:0;if(e.hot!==hot){e.hot=hot;e.m.traverse(function(o){if(o.isMesh&&o.material.emissive)o.material.emissive.setHex(hot)})}
    });
    /* les zombies d'une vague arrivent petit à petit (24 en même temps au maximum) */
    if(waveLeft>0){spawnT-=dt;if(spawnT<=0&&alive<24){spawnT=.35+Math.random()*.5;waveLeft--;addZombie(pickType(),zHpMul());hud()}}
    else if(!alive){waveT-=dt;if(waveT>0&&wave){var tt=Math.ceil(waveT);if(tt!==P.wcd){P.wcd=tt;center('VAGUE '+(wave+1)+' DANS '+tt)}}if(waveT<=0)nextWave()}
  }
  function pickType(){var r=Math.random();if(wave>=5&&r<.08)return 'ghoul';if(wave>=4&&r>.9)return 'armored';if(wave>=2&&r<.2)return 'runner';if(wave>=3&&r<.3)return 'crawler';if(wave>=4&&r<.39)return 'spitter';if(wave>=4&&r<.47)return 'exploder';if(wave>=6&&r<.53)return 'tank';return 'walker'}
  var BOSSN=['ALEXANDRE','LUGANIZER','PAPONI','LEAO.J'];
  function nextWave(){
    wave++;center('');P.wcd=0;var n=Math.min(80,Math.round((5+wave*3)*D().cnt));waveLeft=n;spawnT=.5;
    if(wave%5===0&&wave%BOSSW!==0){addZombie('brute',zHpMul());PP.toast('Une brute arrive !','warn')}
    /* v81 : un boss toutes les 15 vagues : 2× plus de vie, lent, barre de vie et nom en haut de l'écran */
    if(wave%BOSSW===0){var bi=wave/BOSSW,bn=BOSSN[bi-1]||PP.pick(BOSSN),bz=addZombie('brute',(1+(BOSSW-1)*.05)*2*Math.pow(5,bi-1));bz.boss='BOSS VAGUE '+wave+' : '+bn;bz.sp=Math.min(8,bz.sp*.6*Math.pow(2,bi-1));bz.m.scale.multiplyScalar(1.25);PP.toast('BOSS : '+bn,'warn');center(bn);setTimeout(function(){if(UI.center.textContent===bn)center('')},2500)}
    if(wave>1){var s=spawnFar(6);addItem(Math.random()<.5?'ammo':'med',s.x,s.z)}
    A.wave();PP.toast('Vague '+wave,'warn');hud();waveT=9;
  }

  /* ---------- Battle royale ---------- */
  function aliveCount(){var n=0;ents.forEach(function(e){if(e.kind==='b'&&e.alive)n++});if(!dead)n++;Object.keys(remotes).forEach(function(k){if(remotes[k].al)n++});return n}
  function stepZone(dt){
    zone.t-=dt;if(zone.t<=0){zone.stage++;zone.target=Math.max(5,zone.target*.62);zone.t=zone.stage<5?22:16;if(zone.stage===1||zone.target>5)PP.toast('La zone rétrécit','warn')}
    zone.r+=(zone.target-zone.r)*Math.min(1,dt*.35);
  }
  function stepBR(dt){
    stepZone(dt);
    var people=[];if(!dead)people.push({x:P.x,z:P.z,me:1,name:net.me.name||'Toi'});Object.keys(remotes).forEach(function(k){var r=remotes[k];if(r.al)people.push({x:r.x,z:r.z,id:k,name:r.n})});
    ents.forEach(function(b){
      if(b.kind!=='b'||!b.alive)return;
      if(Math.hypot(b.x-zone.x,b.z-zone.z)>zone.r){b.hp-=7*dt;if(b.hp<=0){damageEnt(b,1,'La zone',false);return}}
      var tgt=null,td=34;
      people.forEach(function(p){var d=Math.hypot(p.x-b.x,p.z-b.z);if(d<td&&los(b.x,b.z,p.x,p.z)){td=d;tgt=p}});
      ents.forEach(function(o){if(o===b||o.kind!=='b'||!o.alive)return;var d=Math.hypot(o.x-b.x,o.z-b.z);if(d<td*.8&&los(b.x,b.z,o.x,o.z)){td=d;tgt={x:o.x,z:o.z,bot:o,name:o.name}}});
      var mv=false;b.flash=Math.max(0,b.flash-dt);
      if(tgt){
        b.yaw=Math.atan2(tgt.x-b.x,tgt.z-b.z);b.wander-=dt;if(b.wander<=0){b.wander=.8+Math.random();b.strafe=-b.strafe}
        var sa=b.yaw+Math.PI/2*b.strafe,s2=td>12?2.6:1.8;moveEnt(b,Math.sin(sa)*s2*dt+(td>14?Math.sin(b.yaw)*2*dt:0),Math.cos(sa)*s2*dt+(td>14?Math.cos(b.yaw)*2*dt:0),b.r);mv=true;
        b.cd-=dt;if(b.cd<=0){b.cd=.55+Math.random()*.5;b.flash=.08;var chance=Math.max(.12,.62-td/45)*(online?1:Math.min(1.4,D().bot)),dm=(10+Math.random()*8)*(online?1:D().bot);
          if(Math.hypot(b.x-P.x,b.z-P.z)<30)sfx.play('shoot');
          if(Math.random()<chance){if(tgt.me)hurt(dm,b.name);else if(tgt.id)net.to(tgt.id,{t:'fb-dmg',d:dm,by:b.name});else if(tgt.bot)damageEnt(tgt.bot,dm,b.name,false,false,{x:b.x,z:b.z})}}
      }else{
        var out=Math.hypot(b.x-zone.x,b.z-zone.z)>zone.target*.8;
        if(!b.goal||out||Math.hypot(b.goal.x-b.x,b.goal.z-b.z)<2){var near=items.filter(function(it){return Math.hypot(it.x-b.x,it.z-b.z)<20})[0];b.goal=out?{x:zone.x,z:zone.z}:near?{x:near.x,z:near.z}:cellC(PP.pick(OPEN))}
        var a=pathDir(b,b.goal.x,b.goal.z);moveEnt(b,Math.sin(a)*3.4*dt,Math.cos(a)*3.4*dt,b.r);b.yaw=a;mv=true;
        for(var i=items.length-1;i>=0;i--){if(Math.hypot(items[i].x-b.x,items[i].z-b.z)<1.2){if(online)net.broadcast({t:'rel',from:'host',d:{g:'fbloot',i:items[i].id}});removeItem(items[i].id);b.goal=null;break}}
      }
      b.m.position.set(b.x,0,b.z);b.m.rotation.y=b.yaw+Math.PI;animWalk(b,dt,mv);
    });
    // fin de manche
    if(round&&round.phase==='play'&&performance.now()-round.t0>3000){
      if(online){var a0=teamAlive(0),a1=teamAlive(1);if(teamSize(0)&&teamSize(1)&&(a0===0||a1===0)){round.phase='end';var wt=a0>0?0:1;TSC[wt]++;var wn=wt?'Équipe bleue':'Équipe rouge';endRound(wn);net.broadcast({t:'fb-end',w:wn,sc:TSC,wt:wt})}return}
      var n=aliveCount();
      if(n<=1){round.phase='end';var w=!dead?(net.me.name||'Toi'):null;if(!w)Object.keys(remotes).forEach(function(k){if(remotes[k].al)w=remotes[k].n});if(!w)ents.forEach(function(e){if(e.kind==='b'&&e.alive)w=e.name});
        endRound(w||'Personne');if(online)net.broadcast({t:'fb-end',w:w||'Personne'})}
    }
  }
  function stepBRGuest(dt){
    if(zone){zone.r+=(zone.target-zone.r)*Math.min(1,dt*.35);zone.t-=dt}
    ents.forEach(function(b){if(b.kind!=='b')return;if(!b.alive)return;var dx=b.tx-b.x,dz=b.tz-b.z;b.x+=dx*Math.min(1,dt*10);b.z+=dz*Math.min(1,dt*10);b.m.position.set(b.x,0,b.z);b.m.rotation.y=b.yaw+Math.PI;animWalk(b,dt,Math.hypot(dx,dz)>.05)});
  }
  function angLerp(a,b,t){var d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*t}
  /* joueurs distants : interpolation entre les derniers états reçus (100 ms de retard), comme un vrai FPS */
  function stepRemotes(dt){
    var rt=performance.now()-130;
    Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!r.m||r.skShown!==r.sk||(online&&!coop&&r.tagN!==r.n))remoteModel(r);else if(coop&&r.tagN!==r.n)retag(r);
      var px=r.x,pz=r.z,b=r.buf,pt=r.pt||0;
      if(b&&b.length){var i=b.length-1;while(i>0&&b[i-1].t>rt)i--;var A=b[i-1],B=b[i];
        if(A&&B&&B.t>rt){var f=Math.max(0,Math.min(1,(rt-A.t)/Math.max(1,B.t-A.t)));r.x=A.x+(B.x-A.x)*f;r.z=A.z+(B.z-A.z)*f;r.y=A.y+(B.y-A.y)*f;r.yaw=angLerp(A.yw,B.yw,f);pt=A.pt+(B.pt-A.pt)*f}
        else{var L=b[b.length-1],Q=b[b.length-2],ex=0,ez=0;if(Q&&L.t-Q.t>0){var ag=Math.min(.12,(rt-L.t)/1000);ex=(L.x-Q.x)/(L.t-Q.t)*1000*Math.max(0,ag);ez=(L.z-Q.z)/(L.t-Q.t)*1000*Math.max(0,ag)}r.x+=(L.x+ex-r.x)*Math.min(1,dt*20);r.z+=(L.z+ez-r.z)*Math.min(1,dt*20);r.y=L.y;r.yaw=angLerp(r.yaw||0,L.yw,Math.min(1,dt*20));pt=L.pt}}
      else{r.x+=(r.tx-r.x)*Math.min(1,dt*12);r.z+=(r.tz-r.z)*Math.min(1,dt*12)}
      r.pt=pt;var mv=Math.hypot(r.x-px,r.z-pz)/Math.max(dt,.001);
      if(r.dieT>0&&!r.al){r.dieT-=dt;r.m.visible=true;var tt=1.1-r.dieT;r.m.rotation.set(-Math.min(Math.PI/2,tt*4),r.yaw,0);r.m.position.set(r.x,-Math.max(0,tt-.8)*.8,r.z);return}
      if(r.al===2){r.m.visible=true;r.m.rotation.set(-1.45,r.yaw,0);r.m.position.set(r.x,.25,r.z);return}
      r.m.visible=!!r.al;r.m.rotation.set(0,r.yaw,0);r.m.position.set(r.x,r.y||0,r.z);
      var pr=r.m.userData.parts;if(pr&&pr.torso&&online)pr.torso.rotation.x=Math.max(-.6,Math.min(.6,pt*(coop?.25:.55)));
      if(r.flash>0){r.flash-=dt;r.m.traverse(function(o){if(o.material&&o.material.emissive)o.material.emissive.setHex(r.flash>0?0x661008:0)})}
      if(r.fireT>0){r.fireT-=dt;if(!r.mf){r.mf=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95}));r.m.add(r.mf)}r.mf.visible=true;r.mf.position.set(.18,1.5+pt*.3,-1.05);r.mf.scale.setScalar(.7+Math.random()*.8)}else if(r.mf)r.mf.visible=false;
      animWalk(r,dt,mv>.6);if(coop)coopPose(r,dt,mv>.6,pt);if(r.em){r.emT=(r.emT||0)+dt;emotePose(r.m.userData.parts,r.em-1,r.emT)}
    });
  }
  /* traînées de balles : on voit d'où l'on te tire dessus */
  var tracers=[];
  function tracer(a,b){if(!scene)return;var geo=new THREE.BufferGeometry().setFromPoints([a,b]);var l=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xffe2a0,transparent:true,opacity:.9,depthWrite:false}));scene.add(l);tracers.push({m:l,t:.09})}
  function remoteTracer(r){if(!r.m||!scene)return;var pt=r.pt||0,d=new THREE.Vector3(-Math.sin(r.yaw)*Math.cos(pt),Math.sin(pt),-Math.cos(r.yaw)*Math.cos(pt)),o=new THREE.Vector3(r.x+Math.cos(r.yaw)*.18+d.x*.9,EYE+(r.y||0)-.15+d.y*.9,r.z-Math.sin(r.yaw)*.18+d.z*.9);ray.set(o,d);ray.far=80;var hw=ray.intersectObjects(solidMeshes,false),end=hw.length?hw[0].point:o.clone().addScaledVector(d,80);if(P&&!dead){var me=new THREE.Vector3(P.x,EYE+P.y-.3,P.z),tm=me.clone().sub(o).dot(d);if(tm>0&&tm<o.distanceTo(end)){var cl=o.clone().addScaledVector(d,tm);if(cl.distanceTo(me)<1.6){sfx.play('tick')}}}tracer(o,end)}
  function autopilot(dt){
    var tgt=null,td=30;
    ents.forEach(function(e){if(!e.alive)return;var d=Math.hypot(e.x-P.x,e.z-P.z);if(d<td&&los(P.x,P.z,e.x,e.z)){td=d;tgt=e}});
    if(!coop)Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!r.al)return;var d=Math.hypot(r.x-P.x,r.z-P.z);if(d<td&&los(P.x,P.z,r.x,r.z)){td=d;tgt=r}});
    keys.F=keys.B=keys.L=keys.R=false;
    if(tgt){P.yaw=Math.atan2(-(tgt.x-P.x),-(tgt.z-P.z));P.pitch=0;if(Math.random()<dt*2.5)fire()}
    else if(zone){var a=pathDir(P,zone.x,zone.z);if(Math.hypot(P.x-zone.x,P.z-zone.z)>zone.target*.6){P.yaw=Math.atan2(-Math.sin(a),-Math.cos(a));keys.F=true}}
  }
  function endRound(w,wt){
    if(online){if(wt==null)wt=w==='Équipe bleue'?1:0;var mine=wt===myTeam();if(mine)PP.stat('fps','win');sfx.play(mine?'win':'lose');center((mine?'MANCHE GAGNÉE ! ':'MANCHE PERDUE. ')+'ROUGE '+TSC[0]+' – '+TSC[1]+' BLEU · SUIVANTE DANS 5 S');addFeed(w+' gagne la manche');if(auth)setTimeout(function(){if(online&&auth&&PP.cur()==='fps')hostRound()},5000);hud();return}
    var me=net.me.name||'Toi',won=w===me&&!dead;if(won)PP.stat('fps','win');
    if(!dead||won){var place=won?1:aliveCount();var b=PP.store('fps-br');if(!b||place<b)PP.store('fps-br',place)}
    sfx.play(won?'win':'lose');
    if(online){center((won?'VICTOIRE ! ':w+' GAGNE LA MANCHE. ')+'NOUVELLE MANCHE DANS 8 S');addFeed(w+' gagne la manche');sys(w+' gagne la manche')}
    else showEnd(won?'Victoire royale !':'Partie finie',won?'Dernier debout, avec '+kills+' frag'+(kills>1?'s':'')+'.':w+' gagne. Tu as fait '+kills+' frag'+(kills>1?'s':'')+'.');
    if(online&&auth)setTimeout(function(){if(online&&auth&&PP.cur()==='fps')hostRound()},8000);
    hud();
  }
  function die(by){
    dead=true;aiming=false;mouseDown=false;P.hp=0;sfx.play('lose');
    if(online){net.relay({g:'fbdie',by:by||''});var t=(by?by+' a éliminé ':'Éliminé : ')+(net.me.name||'toi');addFeed(t);center('ÉLIMINÉ'+(by?' PAR '+String(by).toUpperCase():'')+' · TU REJOUES À LA PROCHAINE MANCHE');var pl=aliveCount();var b=PP.store('fps-br');if(!b||pl+1<b)PP.store('fps-br',pl+1);sendState(1)}
    else if(mode==='zombie'){var best=PP.store('fps-zombie'),better=kills>best,gain=Math.floor(P.earned/50);if(gain)coins(coins()+gain);if(better){PP.store('fps-zombie',kills);PP.refreshHi()}setPrompt('');showEnd('Dévoré','Vague '+wave+', '+kills+' zombie'+(kills>1?'s':'')+', '+Object.keys(UNL).length+' zone'+(Object.keys(UNL).length>1?'s':'')+' ouverte'+(Object.keys(UNL).length>1?'s':'')+'. +'+gain+' pièces pour les skins.'+(better?' Nouveau record !':' Record : '+best+'.'))}
    else{var place=aliveCount()+1,bb=PP.store('fps-br');if(!bb||place<bb)PP.store('fps-br',place);showEnd('Éliminé','Par '+(by||'?')+'. Place : '+place+'e. '+kills+' frag'+(kills>1?'s':'')+'.')}
    hud();
  }
  function showEnd(t,m){setTimeout(function(){try{document.dispatchEvent(new CustomEvent('pp-gameover',{detail:'fps'}))}catch(e){}},300);running=false;mobFull(false);cancelAnimationFrame(raf);unlock();$('fps-title').textContent=t;$('fps-msg').textContent=m;$('fps-start').textContent='Rejouer';$('fps-start').hidden=false;$('fps-online').hidden=mode!=='br';$('fps-ov').hidden=false;render()}

  /* ---------- Réseau (battle royale en ligne) ---------- */
  var sendAcc=0;
  function sendState(dt){
    sendAcc-=dt;if(sendAcc>0)return;sendAcc=.045;
    net.relay({g:'fb',ts:Math.round(performance.now()),x:+P.x.toFixed(2),z:+P.z.toFixed(2),y:+P.y.toFixed(2),yw:+P.yaw.toFixed(3),pt:+P.pitch.toFixed(2),hp:Math.ceil(P.hp),al:dead?0:(P.down?2:1),w:P.gun,c:+(P.crouch||0).toFixed(2),am:aiming?1:0,sl:P.slide>0?1:0,sk:skins.ch,em:P.emote?P.emote.id+1:0,afk:P.afk?1:0,n:net.me.name,sh:P.shotN,k:kills,mh:maxHp(),r:round?round.n:0});
    if(coop&&auth){zAcc-=.045;if(zAcc<=0){zAcc=.066;net.broadcast({t:'zc-s',w:wave,wl:waveLeft,wt:+waveT.toFixed(1),z:ents.filter(function(e){return e.kind==='z'&&e.alive}).map(function(e){return [e.id,e.type,+e.x.toFixed(2),+e.z.toFixed(2),+e.yaw.toFixed(2),e.mvF?1:0,e.atk>0?1:0,e.rise<1?+e.rise.toFixed(2):1,+Math.max(0,Math.min(1,e.hp/(e.max||1))).toFixed(3),e.boss||0]})})}}
    if(auth&&!coop){stateAcc-=.066;if(stateAcc<=0){stateAcc=.1;net.broadcast({t:'fb-s',r:round?round.n:0,z:[+zone.x.toFixed(1),+zone.z.toFixed(1),+zone.r.toFixed(1),+zone.target.toFixed(1),+zone.t.toFixed(1)],b:ents.filter(function(e){return e.kind==='b'}).map(function(e){return [e.i,+e.x.toFixed(2),+e.z.toFixed(2),+e.yaw.toFixed(2),Math.ceil(e.hp),e.alive?1:0,e.flash>0?1:0]})})}}
  }
  var stateAcc=0;
  function hostRound(){
    var seed=(Math.random()*1e9)|0,maps=Object.keys(MAPS);
    round={n:(round?round.n:0)+1,seed:seed,map:maps[(round?round.n:0)%3],phase:'play',t0:performance.now()};
    /* en salon entre potes : pas de bots dès qu'on est au moins 2 (quelques bots seulement si tu es seul) */
    var nb=0;
    var msg={t:'fb-round',n:round.n,seed:seed,map:round.map,nb:nb};
    net.broadcast(msg);startRound(msg);
  }
  function startRound(m){
    mapId=m.map;mode='br';round={n:m.n,seed:m.seed,map:m.map,phase:'play',t0:performance.now()};
    reset(m.seed);center('');
    var R=rng(m.seed+3),sl=Math.max(0,net.slot(net.me.id));
    for(var i=0;i<m.nb;i++){var c=cellC(OPEN[Math.floor(R()*OPEN.length)]);addBot(i,c.x,c.z)}
    var side=OPEN.slice().sort(function(a,b){return cellC(a).x-cellC(b).x}),q=Math.max(1,Math.floor(side.length*.22)),pool=myTeam()?side.slice(-q):side.slice(0,q);var sp=cellC(pool[Math.floor(rng(m.seed+11+sl*97)()*pool.length)]);P.x=sp.x;P.z=sp.z;
    Object.keys(remotes).forEach(function(k){var r=remotes[k];r.al=1;r.dieT=0;r.buf=[]});
    if(online){P.guns.rifle={mag:30,res:120};if(P.inv.indexOf('rifle')<0)P.inv.push('rifle');P.gun='rifle';P.vx=P.vz=0;P.cdShown=-1;setViewGun()}
    $('fps-ov').hidden=true;if(PP.cur()!=='fps'){running=false;hud();return}running=true;last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);sfx.play('go');addFeed('Manche '+m.n+' · '+MAPS[m.map]);center('TU ES '+(myTeam()?'BLEU':'ROUGE')+' · ROUGE '+TSC[0]+' – '+TSC[1]+' BLEU');setTimeout(function(){if(round&&round.n===m.n&&round.phase==='play')center('')},2500);hud();
  }
  /* v64 : un dernier message d'un joueur déjà parti ne fait plus réapparaître un perso fantôme */
  var goneIds={};function forget(k){goneIds[k]=performance.now()}
  function remote(id,d){var r=remotes[id];if(!r&&goneIds[id]&&performance.now()-goneIds[id]<15000)return null;if(!r){r=remotes[id]={id:id,kind:'p',x:d.x,z:d.z,tx:d.x,tz:d.z,yaw:0,al:1,n:d.n||'?',sk:0,m:null};}return r}
  net.on(function(m,from){
    if(!online)return;
    if(m.t==='rel'&&m.d){var d=m.d,id=m.from;
      if(d.g==='fb'){if(round&&d.r!==round.n){if(remotes[id])remotes[id].al=0;return}var r=remote(id,d);if(!r)return;r.seen=performance.now();r.tx=d.x;r.tz=d.z;r.ty=d.y;r.tyaw=d.yw;r.buf=r.buf||[];/* v25 : horodatage de l'envoyeur (corrigé du décalage d'horloge) → mouvements réguliers même si les paquets arrivent par à-coups */var nw=performance.now(),tt=nw;if(d.ts){var off=nw-d.ts;r.off=(r.off==null||off<r.off)?off:r.off*.98+off*.02;tt=d.ts+r.off}if(r.buf.length&&tt<=r.buf[r.buf.length-1].t)tt=r.buf[r.buf.length-1].t+1;r.buf.push({t:tt,x:d.x,z:d.z,y:d.y||0,yw:d.yw,pt:d.pt||0});if(r.buf.length>30)r.buf.shift();if(!d.al&&r.al){r.dieT=1.1}r.hp=d.hp;r.al=d.al;r.kz=d.k||0;r.mh=d.mh||100;r.cr=d.c||0;r.am=d.am;r.sl=d.sl;r.n=(d.n||'?')+(d.afk?(coop?' (absent)':' (bot)'):'');r.sk=d.sk||0;if((d.em||0)!==(r.em||0)){r.em=d.em||0;r.emT=0}if(d.sh!==r.sh){if(r.sh!==undefined){if(Math.hypot(r.x-P.x,r.z-P.z)<40)sfx.play('shoot');r.fireT=.08;remoteTracer(r)}r.sh=d.sh}r.w=d.w}
      if(d.g==='fbhit'&&d.to===net.me.id&&!dead){hurt(d.d,d.by,d.x,d.z)}
      if(d.g==='fbaway'){if(remotes[id]){remotes[id].al=0;remotes[id].dieT=0}return}
      if(d.g==='fbdie'){var who=(remotes[id]&&remotes[id].n)||'?';if(remotes[id]){if(remotes[id].al)remotes[id].dieT=1.1;remotes[id].al=0}addFeed((d.by?d.by+' a éliminé ':'')+who);if(d.by===net.me.name){kills++;sfx.play('kill');hud()}}
      if(d.g==='fbloot')removeItem(d.i);
      if(d.g==='fchat')chatAdd(d.n||'?',d.t,false);
      return}
    if(m.t==='fb-round'&&!net.isHost){startRound(m);return}
    if(m.t==='fb-end'&&!net.isHost&&round){round.phase='end';if(m.sc)TSC=m.sc;endRound(m.w,m.wt);return}
    if(m.t==='fb-feed'&&!net.isHost){addFeed(m.txt);return}
    if(m.t==='fb-dmg'&&!dead){hurt(m.d,m.by);return}
    if(m.t==='fb-s'&&!net.isHost&&round&&m.r===round.n){
      zone=zone||{};zone.x=m.z[0];zone.z=m.z[1];if(zone.r==null)zone.r=m.z[2];zone.r+=(m.z[2]-zone.r)*.5;zone.target=m.z[3];zone.t=m.z[4];
      m.b.forEach(function(s){var b=ents.filter(function(e){return e.kind==='b'&&e.i===s[0]})[0];if(!b)return;b.tx=s[1];b.tz=s[2];b.yaw=s[3];b.hp=s[4];if(b.alive&&!s[5]){b.alive=false;b.dieT=1.2}if(s[6]&&Math.hypot(b.x-P.x,b.z-P.z)<30)sfx.play('shoot')});
      return}
    if(net.isHost){
      if(m.t==='fb-hit'){var b=ents.filter(function(e){return e.kind==='b'&&e.i===m.b})[0];if(b&&b.alive){var was=b.alive;damageEnt(b,m.d,m.by,false);if(was&&!b.alive){var pid=from;net.to(pid,{t:'fb-kill'})}}return}
      if(m.t==='fb-hello'){if(round)net.to(from,{t:'fb-round',n:round.n,seed:round.seed,map:round.map,nb:ents.filter(function(e){return e.kind==='b'}).length});return}
      if(m.t==='players'&&running){var ids=m.players.map(function(p){return p.id});Object.keys(remotes).forEach(function(k){if(ids.indexOf(k)<0){if(remotes[k].m)scene.remove(remotes[k].m);forget(k);delete remotes[k]}});return}
      if(m.t==='left'){if(remotes[m.id]){if(remotes[m.id].m)scene.remove(remotes[m.id].m);sys((remotes[m.id].n||'Un joueur')+' est parti');forget(m.id);delete remotes[m.id]}return}
    }else{
      if(m.t==='fb-kill'){kills++;sfx.play('kill');hud();return}
      if(m.t==='players'){var ids2=m.players.map(function(p){return p.id});Object.keys(remotes).forEach(function(k){if(ids2.indexOf(k)<0){if(remotes[k].m&&scene)scene.remove(remotes[k].m);forget(k);delete remotes[k]}});return}
      if(m.t==='closed'){online=false;running=false;cancelAnimationFrame(raf);showEnd('Partie terminée','L\'hôte a fermé le serveur. Clique sur « Partie en ligne » pour en trouver ou en créer un autre.')}
    }
  });
  net.on(function(m){if(m.t==='players'&&online&&net.isHost){var known=Object.keys(remotes);m.players.forEach(function(p){if(p.id!=='host'&&known.indexOf(p.id)<0&&!seenJoin[p.id]){seenJoin[p.id]=1;sys(p.name+' a rejoint la partie');if(running)net.to(p.id,{t:'launch',game:'fps'})}})}});
  var seenJoin={};
  /* Partie en ligne façon serveur : on rejoint le premier serveur de battle royale ouvert, sinon on en crée un */
  function goOnline(){
    var name=PP.myName()||('Joueur'+(100+Math.random()*900|0));PP.setName(name);
    var btn=$('fps-online');btn.disabled=true;btn.textContent='Recherche d\'un serveur…';
    if(PP.lobby)PP.lobby.refresh();
    setTimeout(function(){
      var l=[];
      function done(){btn.disabled=false;btn.textContent='Partie en ligne'}
      if(net.inRoom()&&!net.isHost){done();beginOnline();return}
      if(net.inRoom()&&net.isHost&&PP.setRoomGame){done();PP.setRoomGame('fps-br');beginOnline();return}
      if(l.length){
        net.join(l[0].code,name,function(err){done();if(err){PP.toast('Serveur plein ou fermé, on en crée un','warn');hostServer();return}PP.toast('Serveur '+l[0].code+' rejoint','ok');beginOnline()});
      }else hostServer();
      function hostServer(){net.host(name,function(err,code){done();if(err){PP.toast(err,'warn');return}if(PP.setRoomGame)PP.setRoomGame('fps-br');PP.toast('Salon '+code+' créé : donne ce code à tes potes (bouton salon en haut)','ok');beginOnline()})}
    },1600);
  }
  function beginOnline(){
    online=true;auth=net.isHost;mode='br';remotes={};TSC=[0,0];UI.chat.hidden=false;UI.log.innerHTML='';sys('Appuie sur T pour écrire dans le chat');lock();
    if(auth)hostRound();else{$('fps-title').textContent='Connexion au serveur';$('fps-msg').textContent='On attend la manche en cours.';$('fps-start').hidden=true;net.send({t:'fb-hello'})}
  }

  /* ---------- Rendu ---------- */
  var sway={x:0,y:0},mouseDX=0,mouseDY=0;
  /* zone visible : grand mur lumineux qui se resserre + cercle au sol + écran rouge quand on est dehors */
  var zoneW=null,zoneG=null;
  function drawZone(){
    if(mode!=='br'||true||!zone||zone.r==null){if(UI.zoneFx)UI.zoneFx.style.opacity=0;if(zoneW)zoneW.visible=zoneG.visible=false;return}
    if(!zoneW||zoneW.parent!==scene){var c=document.createElement('canvas');c.width=64;c.height=256;var g=c.getContext('2d'),gr=g.createLinearGradient(0,256,0,0);gr.addColorStop(0,'rgba(255,90,40,.85)');gr.addColorStop(.35,'rgba(255,60,30,.35)');gr.addColorStop(1,'rgba(255,40,20,0)');g.fillStyle=gr;g.fillRect(0,0,64,256);for(var y=0;y<256;y+=16){g.fillStyle='rgba(255,220,180,.18)';g.fillRect(0,y,64,3)}
      var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(24,1);
      zoneW=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,96,1,true),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));zoneW.renderOrder=3;scene.add(zoneW);
      zoneG=new THREE.Mesh(new THREE.RingGeometry(.985,1,128),new THREE.MeshBasicMaterial({color:0xff5030,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));zoneG.rotation.x=-Math.PI/2;scene.add(zoneG)}
    zoneW.visible=zoneG.visible=true;var r=Math.max(1,zone.r);zoneW.scale.set(r,9,r);zoneW.position.set(zone.x,4.5,zone.z);zoneW.material.map.offset.y-=.004;zoneW.material.map.offset.x+=.0006;zoneG.scale.set(r,r,1);zoneG.position.set(zone.x,.04,zone.z);
    var out=P&&Math.hypot(P.x-zone.x,P.z-zone.z)>zone.r;if(UI.zoneFx)UI.zoneFx.style.opacity=out?.55+Math.sin(performance.now()/180)*.15:0;
  }
  /* v64 : 0 = détaillé, 1 = loin (sans petits morceaux), 2 = très loin (en plus, pas d'ombre) */
  function zLod(){if(!cam)return;var zs=[];for(var i=0;i<ents.length;i++){var e=ents[i];if(e.kind==='z'&&e.m&&e.m.userData.det)zs.push(e)}
    var many=zs.length>14,d1=many?9:15,d2=many?18:28,cx=cam.position.x,cz=cam.position.z;
    zs.forEach(function(e){var u=e.m.userData,d=Math.hypot(e.x-cx,e.z-cz),lv=d>d2?2:d>d1?1:0;if(lv===u.lod)return;
      if((lv>0)!==(u.lod>0))u.det.forEach(function(o){o.visible=lv===0});
      if((lv>1)!==(u.lod>1))u.main.forEach(function(o){o.castShadow=lv<2});u.lod=lv})}
  function render(){ghostStep();zBars();
    if(!R3||!scene||!P)return;
    try{zLod()}catch(e){}
    if(flickMat){var fk=performance.now()%2600;flickMat.color.setScalar(fk<120||(fk>300&&fk<360)||Math.random()<.02?.12:1)}
    var aT=P.aimT||0,bob=Math.sin(P.bob)*.05*(1-aT*.7),fov=PP.settings.fov+(GUNS[P.gun].zoom-PP.settings.fov)*aT+(P.slide>0?8:0);
    cam.fov+=(pfov(fov)-cam.fov)*.25;cam.updateProjectionMatrix();
    P.landT=Math.max(0,(P.landT||0)-.016*5);P.roll=(P.roll||0)+(((P.slide>0)?-.07:0)-(P.roll||0))*.15;
    shakeT=Math.max(0,shakeT-.016);var sk=shakeT*.25;cam.position.set(P.x+(Math.random()-.5)*sk,EYE-(P.crouch||0)*.75+P.y+(dead||P.down?-1.15:bob)-P.landT*.08+(Math.random()-.5)*sk,P.z);cam.rotation.set(P.pitch+P.kick*.5,P.yaw,(dead?.4:0)+P.roll+(Math.random()-.5)*sk*.3);
    if(dead&&online){var mate=null;Object.keys(remotes).forEach(function(k){var r=remotes[k];if(!mate&&r.al===1&&r.m&&(coop||teamOf(k)===myTeam()))mate=r});if(mate){cam.position.set(mate.x+Math.sin(mate.yaw)*3.2,2.9,mate.z+Math.cos(mate.yaw)*3.2);cam.lookAt(mate.x,1.6,mate.z);UI.top.textContent='TU REGARDES '+String(mate.n).toUpperCase()+(coop?' · TU REVIENS À LA PROCHAINE VAGUE':' · ROUGE '+TSC[0]+' – '+TSC[1]+' BLEU')}}
    if(P.emote&&!dead){if(!selfM){try{selfM=PP.perso.build(PP.perso.get())}catch(e){selfM=human(CH_SKINS[skins.ch].c,0xe0b48f,{gun:false})}}if(selfM.parent!==scene)scene.add(selfM);selfM.visible=true;selfM.position.set(P.x,P.y,P.z);selfM.rotation.set(0,P.yaw,0);emotePose(selfM.userData.parts,P.emote.id,P.emote.t);var oa=P.yaw+Math.sin(P.emote.t*.45)*.7,od=3.6-Math.min(.5,P.emote.t*.1);for(var cd=.6;cd<=od;cd+=.2){if(solid(P.x-Math.sin(oa)*cd,P.z-Math.cos(oa)*cd)){od=Math.max(.9,cd-.45);break}}cam.position.set(P.x-Math.sin(oa)*od,1.75+P.y,P.z-Math.cos(oa)*od);cam.lookAt(P.x,1.1+P.y,P.z)}else if(selfM)selfM.visible=false;
    drawZone();
    R3.clear();R3.render(scene,cam);
    var sc=P.gun==='sniper'&&aT>.85&&fov<30;UI.scope.classList.toggle('on',!!sc);UI.cross.style.opacity=dead?0:Math.max(0,1-aT*2.2);if(!UI.ads&&UI.cross.parentNode){UI.ads=document.createElement('div');UI.ads.className='fps-adsdot';UI.cross.parentNode.appendChild(UI.ads)}if(UI.ads)UI.ads.style.opacity=(aT>.7&&!sc&&!dead)?1:0;
    if(viewGun)viewGun.visible=!P.drink;if(P.drink&&!dead){drinkStep();R3.clearDepth();R3.render(vscene,vcam)}else if(drinkG&&drinkG.visible){drinkG.visible=false;P.drink=0}
    if(viewGun&&!sc&&!dead&&!P.emote&&!P.drink){
      /* visée : l'arme glisse au centre, le viseur pile sur la ligne de tir */
      var GDv=GUNS[P.gun],hx=.15,hy=-.115,hz=-.36,adY=-GDv.sight*VS-.036,ax=hx+(0-hx)*aT,ay=hy+(adY-hy)*aT,az=hz+(-.47-hz)*aT,mvA=1-aT*.85;
      P.drawT=Math.max(0,(P.drawT||0)-.016*4);
      viewGun.position.set(ax+Math.cos(P.bob*.5)*.012*mvA,ay+Math.abs(Math.sin(P.bob*.5))*.015*mvA-P.drawT*.25-(P.slide>0?.03:0)-P.landT*.03,az+P.kick*.6*(1-aT*.5));
      sway.x+=(-mouseDX*.0006*mvA-sway.x)*.15;sway.y+=(mouseDY*.0006*mvA-sway.y)*.15;mouseDX*=.6;mouseDY*=.6;
      var rp=P.rel>0?1-P.rel/(P.relMax||GUNS[P.gun].rel):0,rs=Math.sin(rp*Math.PI);
      viewGun.position.x+=sway.x;viewGun.position.y+=sway.y;
      var G=viewGun.userData.gun,ud=G?G.userData:{};
      P.fireT=Math.max(0,(P.fireT||0)-.016*8);P.pumpT=Math.max(0,(P.pumpT||0)-.016*3);P.boltT=Math.max(0,(P.boltT||0)-.016*2.4);
      function reset(o){if(o){o.position.copy(o.userData.p0);o.rotation.copy(o.userData.r0);o.visible=true}}
      ['slide','mag','pump','bolt'].forEach(function(k){reset(ud[k])});
      if(ud.slide)ud.slide.position.z+=P.fireT*.06;
      if(ud.pump&&P.pumpT>0&&P.pumpT<1.4){var pk=Math.sin((1.4-P.pumpT)/1.4*Math.PI);ud.pump.position.z+=pk*.14}
      if(ud.bolt&&P.boltT>0&&P.boltT<1.4){var bk=(1.4-P.boltT)/1.4;ud.bolt.rotation.z=Math.sin(Math.min(1,bk*2)*Math.PI/2)*1.2*(bk<.5?1:Math.max(0,1-(bk-.5)*2)*1);ud.bolt.position.z+=Math.sin(bk*Math.PI)*.07}
      var rot=[P.kick*1.2,sway.x*2,0],dy=0,dz=0;
      if(P.rel>0){var R0=rp;
        if(R0<.22){var a1=R0/.22;rot[0]-=a1*.25;rot[2]+=a1*.6;dy-=a1*.02}
        else if(R0<.78){rot[0]-=.25;rot[2]+=.6;dy-=.02;
          if(P.gun==='shotgun'){var sh=(R0-.22)/.56*4;dy+=Math.abs(Math.sin(sh*Math.PI))*.03;if(Math.floor(sh)!==P.relSnd){P.relSnd=Math.floor(sh);A.rel(4)}}
          else if(ud.mag){var mm=(R0-.22)/.56;if(mm<.45){ud.mag.position.y-=mm/.45*.35;if(P.relSnd===0&&mm>.1){P.relSnd=1;A.rel(1)}}else{var mi=(mm-.45)/.55;ud.mag.position.y-=(1-mi)*.35;if(P.relSnd===1&&mi>.9){P.relSnd=2;A.rel(2)}}}
          else if(ud.drum&&P.relSnd===0){P.relSnd=1;A.rel(1)}}
        else{var a3=(R0-.78)/.22,e3=1-Math.pow(1-a3,3);rot[0]-=.25*(1-e3);rot[2]+=.6*(1-e3);dy-=.02*(1-e3);
          if(ud.slide)ud.slide.position.z+=Math.sin(a3*Math.PI)*.07;if(ud.pump)ud.pump.position.z+=Math.sin(a3*Math.PI)*.14;if(ud.bolt){ud.bolt.rotation.z=Math.sin(a3*Math.PI)*1.2;ud.bolt.position.z+=Math.sin(a3*Math.PI)*.07}
          if(P.relSnd<3&&a3>.4){P.relSnd=3;A.rel(3)}}}
      /* main gauche qui va chercher le chargeur pendant la recharge */
      var LH=viewGun.userData.lh;if(LH){LH.position.copy(viewGun.userData.lh0);if(P.rel>0&&ud.mag&&GUNS[P.gun].hg){var w0=rp<.15?rp/.15:rp>.85?(1-rp)/.15:1,mp=ud.mag.position;LH.position.x+=(mp.x-.02-LH.position.x)*w0;LH.position.y+=(mp.y-.08-LH.position.y)*w0;LH.position.z+=(mp.z+.03-LH.position.z)*w0}}
      if(ud.drum){P.drumT=Math.max(0,(P.drumT||0)-.016*4);ud.drum.rotation.y=(P.shotN||0)*1.047-P.drumT*1.047}
      if(ud.spin){P.spinV=(P.spinV||0)+((mouseDown?1:0)-(P.spinV||0))*.08;ud.spin.rotation.z+=P.spinV*.75}
      if(ud.tip)ud.tip.scale.setScalar(1+Math.sin(performance.now()/120)*.15+P.fireT*.8);
      rot[2]+=P.slide>0?.35*(1-aT):0;rot[0]-=P.drawT*.6;
      viewGun.position.y+=dy;viewGun.position.z+=dz;viewGun.rotation.set(rot[0],rot[1],rot[2]);
      if(viewGun.userData.core)viewGun.userData.core.material.opacity*=.45;
      var spr=1+P.kick*3.5+(isMoving()?.35:0)+(P.y>0?.5:0)+(keys.SH&&isMoving()?.4:0)-(P.crouch>.5&&P.slide<=0?.2:0);UI.cross.style.setProperty('--g',(4+spr*6).toFixed(1)+'px');UI.cross.style.transform='translate(-50%,-50%)';
      R3.clearDepth();R3.render(vscene,vcam);
    }
    muzzle&&(muzzle.material.opacity*=.5);muzzleL.intensity*=.5;
    drawMini();
  }
  function mobFull(on){if(!touchUI)return;var st=cv.parentNode;if(st.classList.contains('ft-full')!==!!on){st.classList.toggle('ft-full',!!on);document.body.classList.toggle('ft-lock',!!on);setTimeout(function(){fitRes(true)},80)}}
  function loop(t){var raw=last?Math.min(.3,(t-last)/1000):0,dt=Math.min(.05,raw);last=t;if(running){mobFull(true);if(++resN%90===0)fitRes();
      /* à la souris, le jeu ne tourne que si la souris est bien capturée : sinon il attend un clic dans l'image (la souris ne peut plus « sortir » en pleine partie) */
      var hold=DESK&&!window.PP_NOHOLD&&!online&&!shopOpen&&!chatOpen&&!dead&&document.pointerLockElement!==cv&&!FL.inn;if(hold!==lastHold){lastHold=hold;$('fps-lockhint').hidden=!hold||paused;if(hold){keys={};mouseDown=false}}
      if(cdT>0){if(!hold&&!paused)stepCountdown(raw)}
      else if((!paused||online)&&!shopOpen&&!hold){/* v64 : PC lent : on fait plusieurs petits pas au lieu de ralentir tout le jeu */var rem=Math.min(.2,raw),n=0;if(!(rem>1e-4))step(dt);else while(rem>1e-4&&n<4&&running){var st=Math.min(.05,rem);step(st);rem-=st;n++}}if(running)render();raf=requestAnimationFrame(loop)}}

  /* v64 : onglet caché pendant une partie en ligne : le navigateur arrête l'affichage, mais on continue à faire avancer
     la partie (chef : zombies et vagues ; invité : dégâts, chute, envoi de sa position), environ une fois par seconde */
  var bgLast=0;
  setInterval(function(){
    if(!document.hidden||!running||!online||!P||PP.cur()!=='fps'){bgLast=0;return}
    var now=performance.now(),el=bgLast?Math.min(1,(now-bgLast)/1000):0;bgLast=now;last=0;
    if(cdT>0){stepCountdown(el);return}
    var n=0;while(el>1e-4&&n<20&&running){var st=Math.min(.05,el);try{step(st)}catch(e){console.error(e);break}el-=st;n++}
  },200);
  /* ---------- Entrées ---------- */
  /* la moindre touche, clic ou mouvement de souris sur la page te sort du mode AFK */
  ['keydown','mousedown','mousemove','touchstart','wheel'].forEach(function(ev){document.addEventListener(ev,function(){if(PP.cur()==='fps')lastInput=performance.now()},{passive:true,capture:true})});
  /* touches : déplacement par position physique (ZQSD en AZERTY = WASD en QWERTY), armes avec 1–4 sans Maj
     (en AZERTY sur Mac, la touche 1 donne « & » : on lit donc la touche physique), X arme suivante, A/Q arme précédente */
  /* touches : lues par position physique (e.code), donc ZQSD en AZERTY = WASD en QWERTY ; elles se changent dans Paramètres */
  var BIND_DEF={fwd:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',sprint:'ShiftLeft',slide:'KeyC',reload:'KeyR',use:'KeyE',next:'KeyX',prev:'KeyQ',map:'KeyM'};
  function B(){var b=PP.settings&&PP.settings.binds||{};return Object.assign({},BIND_DEF,b)}
  function action(e){var b=B(),c=e.code||'';for(var a in b)if(b[a]===c)return a;
    /* v76 : les flèches tournent la caméra (jouable au pavé tactile sans la souris) */
    if(c==='ShiftRight'&&b.sprint==='ShiftLeft')return 'sprint';if((c==='ControlLeft'||c==='ControlRight')&&b.slide==='KeyC')return 'slide';
    if(b.map==='KeyM'&&(e.key||'').toLowerCase()==='m')return 'map';return null}
  var MV={fwd:'F',back:'B',left:'L',right:'R'};
  function fireKey(e){return (e.key||'').toLowerCase()==='a'&&e.code!=='KeyA'&&B().left!==e.code}
  document.addEventListener('keydown',function(e){
    if(PP.cur()!=='fps')return;/* v75 : un chat resté ouvert sans le curseur dedans bloquait tous les déplacements */if(chatOpen){if(document.activeElement===UI.in)return;closeChat()}if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;
    var k=e.key.length===1?e.key.toLowerCase():e.key,c=e.code||'',ac=action(e);lastInput=performance.now();
    if(!running)return;
    /* v73 : la souris se recapture avec n'importe quelle touche de jeu, plus besoin de tirer */if(document.pointerLockElement!==cv&&!paused&&!shopOpen&&!emoteMenu&&k!=='Escape')lock();
    if(shopOpen&&UI.shop&&UI.shop.hidden)shopOpen=false;
    if(shopOpen){if(ac==='use'||k==='Escape'){e.preventDefault();closeShop()}else if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();shopMove(k==='ArrowDown'?1:-1)}else if(k==='Enter'){e.preventDefault();var bb=UI.shop.querySelector('.sh2-buy');if(bb)bb.click()}else if(k==='Tab'){e.preventDefault();shopTab={w:'e',e:'u',u:'w'}[shopTab];shopSel=null;UI.shop.innerHTML=shopHtml()}return}
    /* v84 : la touche A (clavier AZERTY) tire aussi */if(fireKey(e)){e.preventDefault();if(!e.repeat&&!dead&&!emoteMenu){mouseDown=true;fire()}return}
    var TK={ArrowLeft:'TL',ArrowRight:'TR',ArrowUp:'TU',ArrowDown:'TD'}[c];if(TK&&!ac){keys[TK]=true;e.preventDefault()}
    if(MV[ac]){keys[MV[ac]]=true;e.preventDefault()}
    if(ac==='sprint')keys.SH=true;if(ac==='jump'){keys.J=true;e.preventDefault()}
    if(ac==='slide'){if(!e.repeat)keys.CT=true;keys.C=true;e.preventDefault()}
    if(ac==='reload')reload();if(ac==='use'&&!e.repeat)keys.E=true;
    /* v64 : les touches fixes (G, B, F, V, 1 à 9) ne marchent que si tu ne leur as pas donné une autre action dans les réglages */
    var free=!ac;
    if(free&&c==='KeyG'&&!e.repeat)dropGun();if(free&&c==='KeyB'&&!e.repeat){bDownT=performance.now();startEmote()}
    if(emoteMenu){var dgE=/^(Digit|Numpad)([1-8])$/.exec(c);if(dgE){e.preventDefault();startEmote(+dgE[2]-1);return}if(k==='Escape'){emoteMenuToggle(false);return}if(k==='Enter'){e.preventDefault();startEmote(emoSel);return}}
    var dg=free&&/^(Digit|Numpad)([1-9])$/.exec(c);if(dg){var si=+dg[2]-1;if(P&&P.inv[si])switchGun(P.inv[si]);e.preventDefault()}
    if(free&&c==='KeyF'&&!e.repeat){e.preventDefault();defPlace()}if(free&&c==='KeyV'&&!e.repeat){e.preventDefault();defCycle()}
    if(ac==='next'&&!e.repeat&&P)cycle(1);if(ac==='prev'&&!e.repeat&&P&&P.prev&&P.guns[P.prev])switchGun(P.prev);
    if(k==='Tab'){e.preventDefault();if(P)cycle(1)}
    if(ac==='map'&&!e.repeat)bigMap=!bigMap;
    /* v64 : le chat marche aussi en Zone Morte en équipe */if(k==='Enter'&&online){e.preventDefault();openChat()}
  });
  document.addEventListener('keyup',function(e){if(fireKey(e)){mouseDown=false;return}var ac=action(e);var TK={ArrowLeft:'TL',ArrowRight:'TR',ArrowUp:'TU',ArrowDown:'TD'}[e.code];if(TK)keys[TK]=false;if(e.code==='KeyF'&&!ac&&ghost&&PP.cur()==='fps')ghostDrop();if(e.code==='KeyB'&&emoteMenu&&!ac&&performance.now()-bDownT>320&&PP.cur()==='fps')startEmote(emoSel);if(MV[ac])keys[MV[ac]]=false;if(ac==='sprint')keys.SH=false;if(ac==='slide')keys.C=false});
  PP.fpsBinds={def:BIND_DEF,get:B};
  window.addEventListener('blur',function(){keys={};mouseDown=false;ghostHide()});
  cv.addEventListener('mousedown',function(e){
    lastInput=performance.now();if(!running)return;
    if(document.pointerLockElement!==cv){lock();paused=false;$('fps-lockhint').hidden=true;return}
    if(emoteMenu&&e.button===0){startEmote(emoSel);return}
    if(e.button===0){mouseDown=true;fire()}if(e.button===2){if(P.rel<=0&&!dead)aiming=true}
  });
  document.addEventListener('mouseup',function(e){if(e.button===0)mouseDown=false;if(e.button===2)aiming=false});
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  cv.addEventListener('wheel',function(e){if(!running)return;e.preventDefault();cycle(e.deltaY>0?1:-1)},{passive:false});
  document.addEventListener('mousemove',function(e){var lk=document.pointerLockElement===cv;if(!lk){if(!freeLook(e))return}else if(!P||dead)return;if(emoteMenu){emoMove(e.movementX,e.movementY);return}mouseDX+=e.movementX;mouseDY+=e.movementY;lastInput=performance.now();var s=(aiming?(cam.fov/75)*.0026:.0026)*PP.settings.sens/100;P.yaw-=e.movementX*s;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-e.movementY*s*(PP.settings.invY?-1:1)))});
  document.addEventListener('pointerlockchange',function(){if(PP.cur()!=='fps'||!running)return;var l=document.pointerLockElement===cv;$('fps-lockhint').hidden=l||chatOpen;if(!l&&!online&&!chatOpen&&!shopOpen){paused=true;PP.pause(true)}if(l)paused=false;if(shopOpen)$('fps-lockhint').hidden=true});
  document.addEventListener('pointerlockerror',function(){lastHold=null});
  document.addEventListener('pp-resume',function(){if(PP.cur()!=='fps'||!running)return;lock();paused=false;lastHold=null});
  /* image nette : le rendu suit la vraie taille de l'écran (plein écran compris) au lieu d'être étiré depuis 960 × 540 */
  function fitRes(force){if(!R3)return;var w=cv.clientWidth||960,q=PP.settings.q,dpr=window.devicePixelRatio||1,pr=q==='haute'?Math.min(2,dpr):q==='basse'?.75:Math.min(1.5,dpr),W2=Math.min(2560,Math.max(480,Math.round(w*pr))),
    /* v66 : téléphone en hauteur : l'image 3D prend tout l'écran en vertical (avant : bande 16:9 au milieu) */
    port=touchUI&&cv.parentNode.classList.contains('ft-full')&&innerHeight>innerWidth*1.1,asp=port?innerWidth/innerHeight:16/9,H2=Math.round(W2/asp);
    var cur=R3.getSize(new THREE.Vector2());if(!force&&Math.abs(cur.x-W2)<8&&Math.abs(cur.y-H2)<8)return;cv.width=W2;cv.height=H2;R3.setPixelRatio(1);R3.setSize(W2,H2,false);
    PORTK=port?Math.min(16/9/asp,1.55):1;if(cam){cam.aspect=W2/H2;cam.updateProjectionMatrix()}if(vcam){vcam.aspect=W2/H2;vcam.fov=pfov(60);vcam.updateProjectionMatrix()}}
  var PORTK=1;function pfov(f){return PORTK===1?f:2*Math.atan(Math.tan(f*Math.PI/360)*PORTK)*180/Math.PI}
  document.addEventListener('pp-settings',function(){fitRes(true)});window.addEventListener('resize',function(){setTimeout(fitRes,60)});document.addEventListener('pp-fs',function(){setTimeout(fitRes,120)});
  var resN=0,DESK=matchMedia('(hover:hover) and (pointer:fine)').matches,lastHold=null;
  function lock(){if(!cv.requestPointerLock||!DESK||document.pointerLockElement===cv)return;
    try{var r=cv.requestPointerLock();if(r&&r.catch)r.catch(function(){lastHold=null})}catch(e){lastHold=null}}
  /* un clic n'importe où sur l'image (même sur le message « clique pour reprendre ») recapture la souris */
  cv.parentNode.addEventListener('mousedown',function(e){if(PP.cur()!=='fps'||!running||shopOpen||chatOpen||e.target===cv)return;if(e.target.closest('button,input,.fx-shop'))return;if(document.pointerLockElement!==cv){e.preventDefault();lock();paused=false}});
  function unlock(){if(document.pointerLockElement===cv&&document.exitPointerLock)document.exitPointerLock()}
  /* v82 : pavé tactile : si le navigateur perd le verrouillage de la souris, la caméra suit quand même le curseur
     au-dessus de l'image (et tourne toute seule quand le curseur touche le bord) ; le moindre clic ou touche reverrouille */
  var FL={x:null,y:null,edge:0,inn:false};document.addEventListener('mouseleave',function(){FL.inn=false;FL.edge=0});
  function freeLook(e){if(PP.cur()!=='fps'||!running||!P||dead||paused||shopOpen||chatOpen||emoteMenu||!DESK)return false;var r=cv.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){FL.edge=0;FL.inn=false;return false}FL.inn=true;
    var ex=(e.clientX-r.left)/r.width;FL.edge=ex<.06?1:ex>.94?-1:0;return true}
  function freeLookStep(dt){if(!FL.edge||document.pointerLockElement===cv||!P||dead||paused||shopOpen||chatOpen)return;P.yaw+=FL.edge*2.4*dt*(PP.settings.sens||100)/100}
  // tactile : joystick à gauche, on vise en glissant à droite, gros bouton TIR + 3 petits boutons
  var touchUI=null,joy=null,look=null;
  function buildTouch(){
    if(touchUI||!matchMedia('(hover:none)').matches)return;var st=cv.parentNode;touchUI=document.createElement('div');touchUI.className='fps-touch';
    touchUI.innerHTML='<div class="ft-joy"><i></i></div><button type="button" class="ft-fire" data-t="fire">TIR</button><button type="button" class="ft-b ft-aim" data-t="aim">◎</button><button type="button" class="ft-b ft-jump" data-t="jump">⤒</button><button type="button" class="ft-b ft-rel" data-t="rel">R</button><button type="button" class="ft-b ft-quit" data-t="quit">✕</button><button type="button" class="ft-b ft-use" data-t="use">E</button><button type="button" class="ft-b ft-sw" data-t="sw">⇄</button><button type="button" class="ft-b ft-slide" data-t="slide">▼</button><div class="ft-rot">Tourne ton téléphone pour jouer en grand</div>';
    st.appendChild(touchUI);joy=touchUI.querySelector('.ft-joy');
    touchUI.querySelectorAll('[data-t]').forEach(function(b){
      b.addEventListener('touchstart',function(e){e.preventDefault();e.stopPropagation();lastInput=performance.now();var t=b.dataset.t;b.classList.add('on');
        if(t==='fire'){mouseDown=true;fire();var id=e.changedTouches[0].identifier,lx=e.changedTouches[0].clientX,ly=e.changedTouches[0].clientY;b._lk={id:id,x:lx,y:ly}}
        if(t==='quit'){mobFull(false);PP.go('menu');return}if(t==='aim')aiming=!aiming;if(t==='jump')keys.J=true;if(t==='rel')reload();if(t==='use'){if(shopOpen)closeShop();else if(mode==='zombie')use()}if(t==='sw'&&P)cycle(1);if(t==='slide'){keys.CT=true;keys.C=true}},{passive:false});
      b.addEventListener('touchmove',function(e){var l=b._lk;if(!l||!P)return;for(var i=0;i<e.changedTouches.length;i++){var c=e.changedTouches[i];if(c.identifier!==l.id)continue;var k=(aiming?.0035:.007)*PP.settings.sens/100;P.yaw-=(c.clientX-l.x)*k;P.pitch=Math.max(-1.4,Math.min(1.4,P.pitch-(c.clientY-l.y)*k));l.x=c.clientX;l.y=c.clientY}e.preventDefault()},{passive:false});
      var up=function(e){b.classList.remove('on');if(b.dataset.t==='fire'){mouseDown=false;b._lk=null}if(b.dataset.t==='slide')keys.C=false};b.addEventListener('touchend',up);b.addEventListener('touchcancel',up)});
  }
  function joyAt(x,y){var r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy),m=r.width/2;if(d>m){dx*=m/d;dy*=m/d}joy.firstChild.style.transform='translate('+dx+'px,'+dy+'px)';var nx=dx/m,ny=dy/m;keys.F=ny<-.3;keys.B=ny>.3;keys.L=nx<-.3;keys.R=nx>.3;keys.SH=Math.hypot(nx,ny)>.92}
  cv.parentNode.addEventListener('touchstart',function(e){if(PP.cur()!=='fps'||!running)return;lastInput=performance.now();for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(e.target.closest&&e.target.closest('button'))continue;var r=cv.getBoundingClientRect();
      if(joy&&t.clientX<r.left+r.width*.45&&!joy._id){joy._id=t.identifier+1;joyAt(t.clientX,t.clientY)}else if(!look)look={id:t.identifier,x:t.clientX,y:t.clientY}}e.preventDefault()},{passive:false});
  cv.parentNode.addEventListener('touchmove',function(e){if(PP.cur()!=='fps'||!running)return;for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];
      if(joy&&joy._id===t.identifier+1)joyAt(t.clientX,t.clientY);else if(look&&look.id===t.identifier&&P){var k=(aiming?.0035:.007)*PP.settings.sens/100;P.yaw-=(t.clientX-look.x)*k;P.pitch=Math.max(-1.4,Math.min(1.4,P.pitch-(t.clientY-look.y)*k));look.x=t.clientX;look.y=t.clientY}}e.preventDefault()},{passive:false});
  function tEnd(e){for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(joy&&joy._id===t.identifier+1){joy._id=0;joy.firstChild.style.transform='';keys.F=keys.B=keys.L=keys.R=keys.SH=false}if(look&&look.id===t.identifier)look=null}}
  cv.parentNode.addEventListener('touchend',tEnd);cv.parentNode.addEventListener('touchcancel',tEnd);
  pk=PP.held('fps-pad',{},function(k){lastInput=performance.now();if(k==='S'){mouseDown=true;fire()}if(k==='A')aiming=!aiming;if(k==='W')reload()},function(k){if(k==='S')mouseDown=false});

  /* ---------- Menus ---------- */
  var DESC={zombie:'Une carte au hasard en 9 zones. Tue des zombies pour gagner des pièces, ouvre les portes pour agrandir la carte, et achète armes, gilets et munitions à l\'armurerie (E). Glisse en courant avec C ou Ctrl. Armes : 1 à 4, X ou A pour changer.',br:'Toi contre 9 bots sur la carte choisie. Ramasse des armes et sois le dernier debout. Pour jouer avec tes potes, clique sur « Partie en ligne » : ça crée un salon privé, tu leur donnes le code, et c\'est du 2v2 rouge contre bleu, sans bots, manche après manche.'};
  function menu(){
    resetIntro();cdT=0;
    $('fps-title').textContent=mode==='zombie'?'Zombies':'Battle royale';$('fps-msg').textContent=DESC[mode];$('fps-start').textContent=mode==='zombie'?T('Jouer'):T('Jouer contre les bots');$('fps-start').hidden=false;$('fps-online').hidden=mode!=='br';$('fps-ov').hidden=false;
    $('fps-modes').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x.dataset.m===mode)});
    $('fps-maps').querySelectorAll('.mode').forEach(function(x){x.classList.toggle('on',x.dataset.map===mapId)});
    if(reset())render();
  }
  $('fps-modes').addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b||running||introBusy)return;mode=b.dataset.m;menu()});
  $('fps-maps').addEventListener('click',function(e){var b=e.target.closest('[data-map]');if(!b||running||online)return;mapId=b.dataset.map;menu()});
  $('fps-online').addEventListener('click',function(){mode='br';goOnline()});
  function start(){
    mode='zombie';
    if(introBusy||!init())return;if(coop&&!net.isHost)return;introBusy=true;online=coop;mobFull(true);auth=true;overSent=false;if(UI.chat){UI.chat.hidden=!coop;if(coop){UI.log.innerHTML='';sys('Appuie sur Entrée pour écrire à ton équipe')}}
    /* 1. tirage de la carte (roulette) */
    var row=$('fps-ov').querySelector('.row'),msg=$('fps-msg'),maps=Object.keys(MAPS),target=PP.pick(maps),steps=12+Math.floor(Math.random()*3),i0=Math.floor(Math.random()*maps.length),n=0;
    row.hidden=true;$('fps-skins').hidden=true;$('fps-title').textContent='Tirage de la carte';msg.className='fps-roll';
    (function spin(){if(!introBusy)return;var m=maps[(i0+n)%maps.length];msg.textContent=MAPS[m];
      if(n>=steps&&m===target){msg.classList.add('done');A.buy();mapId=m;reset();render();setTimeout(pickDiff,700);return}
      A.tick(420+n*30);n++;setTimeout(spin,45+n*n*1.5)})();
  }
  /* 2. choix de la difficulté */
  var introBusy=false,cdT=0,cdShown=0;
  function pickDiff(){
    if(!introBusy)return;var ov=$('fps-ov'),box=$('fps-diff');
    if(!box){box=document.createElement('div');box.id='fps-diff';box.className='fps-diff';ov.appendChild(box);box.addEventListener('click',function(e){var b=e.target.closest('[data-d]');if(!b||!introBusy)return;diff=b.dataset.d;try{localStorage.setItem(PP.key('fps-diff'),diff)}catch(e2){}box.hidden=true;begin()})}
    $('fps-title').textContent=MAPS[mapId];$('fps-msg').className='';$('fps-msg').textContent='Choisis la difficulté';
    box.innerHTML=Object.keys(DIFF).map(function(k){var d=DIFF[k];return '<button type="button" class="mode'+(k===diff?' on':'')+'" data-d="'+k+'"><b>'+d.n+'</b><span>'+d.d+'</span></button>'}).join('');box.hidden=false;
  }
  /* 3. décompte de 3 secondes, puis la partie commence */
  var LASTRUN=null;
  /* v64 : « Recommencer » relance la même carte et la même difficulté, sans roulette */
  function quick(){if(!LASTRUN||mode!=='zombie'||introBusy||running||!init())return false;if(coop&&!net.isHost)return false;
    introBusy=true;online=coop;mobFull(true);auth=true;overSent=false;if(UI.chat){UI.chat.hidden=!coop;if(coop){UI.log.innerHTML='';sys('Appuie sur Entrée pour écrire à ton équipe')}}
    $('fps-skins').hidden=true;mapId=LASTRUN.map;if(DIFF[LASTRUN.diff])diff=LASTRUN.diff;reset();render();begin();return true}
  function begin(){
    introBusy=false;if(mode==='zombie')LASTRUN={map:mapId,diff:diff};var ov=$('fps-ov');ov.querySelector('.row').hidden=false;
    if(mode==='br'){round={n:1,seed:0,map:mapId,phase:'play',t0:performance.now()};for(var i=0;i<9;i++){var s=spawnFar(14);addBot(i,s.x,s.z)}}
    if(mode==='zombie')P.pts=D().pts;
    ov.hidden=true;running=true;paused=false;last=0;lastHold=null;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);lock();center('');
    cdT=3.2;cdShown=-1;waveT=2.5;hud();
    if(coop&&auth){lastWaveSeen=0;Object.keys(remotes).forEach(function(k){if(remotes[k].m)scene.remove(remotes[k].m);remotes[k].m=null});coopStart()}
  }
  function stepCountdown(dt){cdT-=dt;var cs=Math.max(0,Math.ceil(cdT-.2));if(cs!==cdShown){cdShown=cs;if(cs>0){center(String(cs));A.tick(660)}else{A.tick(1320);center('GO !');setTimeout(function(){if(!running||dead||UI.center.textContent!=='GO !')return;center(mode==='zombie'?MAPS[mapId].toUpperCase()+' · '+(ZNAME[zoneOf(P.x,P.z)]||'').toUpperCase()+' · '+D().n.toUpperCase():'');if(mode!=='zombie')return;setTimeout(function(){if(!wave&&running)center('')},1600)},700)}}}
  function resetIntro(){introBusy=false;var b=$('fps-diff');if(b)b.hidden=true;var r=$('fps-ov').querySelector('.row');if(r)r.hidden=false;$('fps-msg').className=''}
  $('fps-start').addEventListener('click',start);
  // skins
  function skinsHtml(){
    var c=coins();
    function row(list,pre,cur){return list.map(function(s,i){var id=pre+i,own=skins.owned.indexOf(id)>=0||!s.p;return '<button type="button" class="sk'+(cur===i?' on':'')+'" data-sk="'+id+'"><i style="background:#'+('00000'+s.c.toString(16)).slice(-6)+'"></i><b>'+esc(s.n)+'</b><small>'+(cur===i?'équipé':own?'à toi':s.p+' pièces')+'</small></button>'}).join('')}
    return '<div class="sk-head"><b>Skins</b><span>'+c+' pièces</span></div><p class="sk-l">Tenue (tes bras, et ce que voient les autres en ligne)</p><div class="sk-row">'+row(CH_SKINS,'c',skins.ch)+'</div><p class="sk-l">Arme</p><div class="sk-row">'+row(GUN_SKINS,'g',skins.gun)+'</div><p class="sk-l muted">Gagne des pièces en ramassant celles des zombies et du battle royale.</p><button type="button" class="ghost" id="fps-skins-close">Fermer</button>';
  }
  function openSkins(){var p=$('fps-skins');p.innerHTML=skinsHtml();p.hidden=false;$('fps-skins-close').onclick=function(){p.hidden=true}}
  $('fps-skins-btn').addEventListener('click',openSkins);
  $('fps-skins').addEventListener('click',function(e){
    var b=e.target.closest('[data-sk]');if(!b)return;var id=b.dataset.sk,list=id[0]==='c'?CH_SKINS:GUN_SKINS,i=+id.slice(1),s=list[i],own=skins.owned.indexOf(id)>=0||!s.p;
    if(!own){if(coins()<s.p){PP.toast('Il te manque '+(s.p-coins())+' pièces','warn');return}coins(coins()-s.p);skins.owned.push(id);sfx.play('win');PP.toast(s.n+' débloqué','ok')}
    if(id[0]==='c')skins.ch=i;else skins.gun=i;saveSkins();if(P&&vscene)setViewGun();openSkins();
  });

  /* v95 : les armes et les zombies de Zone Morte sont aussi utilisés par Voltige */
  PP.fpsKit={GUNS:GUNS,ZT:ZT,gun:function(t){return buildGun(t,GUNS[t]&&GUNS[t].col!=null?GUNS[t].col:0x2b2b30)},
    zombie:function(t){if(!TX.blob)TX.blob=tex(64,64,function(g,w,h){var gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});return zombieModel(t)},
    anim:function(e,dt,mv){zAnim(e,dt,mv)}};
  PP._fps=function(){return {reload:reload,fire:fire,P:P,ents:ents,zone:zone,items:items,remotes:remotes,round:round,online:online,setMode:function(m){mode=m},doors:DOORS,stands:STANDS,perks:function(){return PERKS},buyPerk:function(p){buyPerk(p)},addZ:function(t){addZombie(t,1)},use:use,interact:interact,give:giveGun,keys:keys,explode:explode,addZombie:addZombie,mapId:mapId,unl:UNL,setAim:function(v){aiming=v},paused:function(){return paused},dbg:function(){return {waveT:waveT,wave:wave,waveLeft:waveLeft,mode:mode,cdT:cdT,shopOpen:shopOpen,running:running}}}};
  PP._fps=function(){return {P:P,ents:ents,explode:explode,addItem:addItem,wave:function(n){wave=n;nextWave()},pw:PW,deps:function(){return DEPS},ghost:function(){return ghost},add:addZombie,cam:cam,shop:openShop,stands:STANDS,spawnPerk:spawnPerk,perks:function(){return PERKS},buyPerk:buyPerk,standTier:setStandTier}};
  PP.games.fps={
    restart:function(){return quick()},
    open:function(){if(!init())return;buildTouch();$('fps-lockhint').hidden=true;$('fps-skins').hidden=true;
      /* nouveau salon = score remis à zéro */if(net.inRoom()&&fpsRoom!==net.code){fpsRoom=net.code;online=false;running=false;cancelAnimationFrame(raf);round=null;TSC=[0,0];kills=0;Object.keys(remotes).forEach(function(k){if(remotes[k].m&&scene)scene.remove(remotes[k].m)});remotes={}}
      /* dans un salon : Zone Morte en équipe (le chef lance, les autres rejoignent) */
      if(net.inRoom()){mode='zombie';$('fps-maps').hidden=true;$('fps-modes').hidden=true;
        if(running&&coop)return;coop=true;online=true;auth=net.isHost;UI.chat.hidden=false;
        if(auth){menu();$('fps-title').textContent='Zone Morte en équipe';$('fps-msg').textContent='Tu es le chef : lance la partie, tout le salon arrive avec toi. Si un pote tombe, relève-le avec E.';return}
        menu();$('fps-title').textContent='Zone Morte en équipe';$('fps-msg').textContent='Le chef choisit la carte et la difficulté, la partie démarre toute seule.';$('fps-start').hidden=true;net.send({t:'zc-hello'});return}
      coop=false;
      if(online&&net.inRoom()){if(auth&&round&&round.phase==='end'){hostRound();return}if(round&&!running){$('fps-ov').hidden=true;running=true;last=0;raf=requestAnimationFrame(loop);$('fps-lockhint').hidden=false;sendState(1);addFeed('De retour dans la partie')}return}
      online=false;UI.chat.hidden=true;
      if(false&&mp.lobby('fps','2v2 en ligne')){$('fps-maps').hidden=true;$('fps-online').hidden=true;mode='br';reset();render();if(!net.isHost)net.send({t:'fb-hello'});online=true;auth=net.isHost;UI.chat.hidden=false;return}
      $('fps-maps').hidden=true;$('fps-modes').hidden=true;mode='zombie';menu()},
    close:function(){resetIntro();cdT=0;if(online&&net.inRoom())net.relay({g:'fbaway'});mobFull(false);if(running){running=false;cancelAnimationFrame(raf)}unlock();keys={};mouseDown=false;aiming=false}
  };
})();
