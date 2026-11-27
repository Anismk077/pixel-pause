/* Pixel Pause — Débouche moi (v84) : un parking bouché, fais glisser les voitures pour libérer la voiture blanche.
   4 difficultés de 12 niveaux. Chaque niveau a été vérifié par ordinateur (recherche de la solution la plus courte),
   et le nombre de coups minimum sert pour les étoiles. Souris ou doigt : on attrape une voiture et on la fait glisser. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',GRN='#3fe09a',W=960,H=540,N=6,ROW=2,CS=72,BX=264,BY=54;
  var LV={"easy":[["B.GGIIBHHHE..AA.E....FFF...DD.....CC",4],["..BBB.GGGC...AACE.....E...FFF.DDD...",4],["HD.GG.HD.CF..AACFB.I...B.I.......EE.",4],[".DDCC......EG..AAEG....E....BB...FFF",4],["GGG..C.II..CAA...DBB.EED..HHFFJJJ...",4],[".....EB.CCFEBHAAFEBH..GG.I..DD.I....",5],["FFFEEJHCCLLJH..AAJID..GGID.KKK.D..BB",5],["D...FFD.EHHIAAE..I..E..BG....BG.CC.B",5],[".CCGG....I.EAA.I.ED...HHD..BBBFF....",6],["..FF.E.DDDGEAA..GE...CCC....HH....BB",6],["FGGII.F..HH.C.AADJC...DJC..EBB...E..",7],["FF.HHGB....GB..AAG...CC....EDD...E..",7]],"mid":[["........CBBD..CAAD...F.D.EEFGG......",8],["...H...IIHBBAA..D.G...D.GCCCF..EE.F.",8],["D.....DEE.FFAAC.HB..C.HB..C.GG......",8],["...C.....CBB.EAADF.EGGDF....H.....H.",8],["....D.GF..DHGFAAIH....I...JEE.BBJCCC",8],["JJEEKK..DDLGAA..LGHBBFFGH..II.MM..CC",9],["F.B...FKB.IHFKAAIH..CEEHJ.CDLLJGGD..",10],[".K.HH..KBBLLAAD.IJ..D.IJ..DFFG.EECCG",10],["..CJJJ..CEEG.AAMHG.DDMH..LL.FIKKBBFI",10],["HHD..E.BDIIE.BAA.E.BCCFF....KK.JJJGG",11],[".FFBBBGGGDLIEAADLIE..D.CKJ...CKJHHHC",12],["..BII...B....GAADF.G..DFHHCCCF...EEE",13]],"hard":[["EJJJDLEC..DL.C.AAKIFFF.KI..BGGHH.B..",14],[".JEEE..JGGGHAAML.HCCMLBBFDDII.F.KK..",14],["FF..E.KDD.ECKHAAECKHMGJJIIMG...LLBB.",15],["GGG.IECCFFIEL..AAEL...DDB.KKHHBMMMJJ",15],[".HH.DD..BFF.AABE...JBEII.JKKCG....CG",16],["MF.HLLMF.H..GFAA.JGII..JCCB..EDDBKKE",16],["H.IIG.H.F.G.AAF..CLLEE.CDDDKK...JJBB",16],["KKKDJ.BBBDJGI.AAJGI.H..GC.H.EEC..FF.",16],["BG.JJHBG.I.HLAAI..L.EEECFFD..CKKD.MM",17],["CGGDDDCBBB..AAH....IHEE..IFFJ.....J.",17],["...K.H..DKEHAADIEH.GDICC.GBB...JJFF.",18],["HDD.IFH.G.IFAAGECF...EC.BBBEC.......",19]],"exp":[["..LEFF..LEMC.AA.MCGGHHHCBKKDDDBIIJJJ",20],["...FF..H..EM.HAAEMDDCCEMGJJKLLGBBKII",20],[".L.EED.LCGGDAACJ..HHCJ..IFFK..I..KBB",21],["HCCEEEHGG..JAAF..J.BFIID.BKKLD....L.",21],["..IFGG..IFB.AAIFBH.C...HKCEED.KJJ.D.",21],[".GLLCB.GMECBAAME..IDDDHJI..FHJ...FKK",22],["HHHMBK..FMBKAAF..EDDLL.EJ.CCIIJGG...",23],["GGE.....EK..AAJK.H..JFBHDLLFBHD.IICC",25],["DHFFIIDHEEC..HAACBLLM.CB..MGGJ..KKKJ",25],[".GGGJI..B.JIAAB..F..HDDFC.HKEECLLKMM",25],["BBJCCCFFJK.MEAAK.ME.HHHIE...LIGGDDL.",26],["..EEG.III.GJ.AA.DJBFCCD.BFHKK...H...",27]]};
  var MODES={easy:'Facile',mid:'Moyen',hard:'Difficile',exp:'Expert'};
  var COLS=['#e2361b','#2f7fe0','#2fae5a','#f3c623','#ff8a2a','#8a4fd8','#1fa5a5','#e0569a','#8a5a32','#9bd13a','#2a3f8a','#5c6670','#c0392b','#16a085'];
  var S=null,CC=null;
  function load(code){var cars=[],seen={};for(var i=0;i<36;i++){var ch=code.charAt(i);if(ch==='.'||seen[ch])continue;seen[ch]=1;var r=i/6|0,c=i%6,h=c<5&&code.charAt(i+1)===ch,l=1;while(true){var j=h?i+l:i+l*6;if(j<36&&(!h||(j/6|0)===r)&&code.charAt(j)===ch)l++;else break}cars.push({id:ch,r:r,c:c,l:l,h:h,t:ch==='A'})}
    cars.sort(function(a,b){return a.t?-1:b.t?1:a.id<b.id?-1:1});var k=0;cars.forEach(function(c){if(!c.t)c.col=COLS[(k++ +S.lv*3)%COLS.length];c.up=Math.random()<.5});return cars}
  function grid(skip){var g=[];for(var r=0;r<N;r++){g.push([]);for(var c=0;c<N;c++)g[r].push(null)}S.cars.forEach(function(o){if(o===skip)return;for(var k=0;k<o.l;k++)g[o.r+(o.h?0:k)][o.c+(o.h?k:0)]=o});return g}
  function range(o){var g=grid(o),lo,hi;if(o.h){lo=o.c;while(lo>0&&!g[o.r][lo-1])lo--;hi=o.c;while(hi+o.l<N&&!g[o.r][hi+o.l])hi++}else{lo=o.r;while(lo>0&&!g[lo-1][o.c])lo--;hi=o.r;while(hi+o.l<N&&!g[hi+o.l][o.c])hi++}return [lo,hi]}
  function key(){return 'lvl-'+S.mode}
  function done(){return +(CC.best(key())||0)}
  function begin(C,lv){var L=LV[S.mode];S.lv=Math.max(0,Math.min(L.length-1,lv));S.opt=L[S.lv][1];S.cars=load(L[S.lv][0]);S.mv=0;S.hist=[];S.drag=null;S.exit=0;S.won=false;S.t=0;S.pick=false}
  function snap(o){return JSON.stringify(S.cars.map(function(c){return [c.r,c.c]}))}
  function restore(s){JSON.parse(s).forEach(function(p,i){S.cars[i].r=p[0];S.cars[i].c=p[1]})}
  function px(o){return {x:BX+o.c*CS+(S.drag&&S.drag.o===o&&o.h?S.drag.off*CS:0)+(o.t&&S.exit?S.exit*CS:0),y:BY+o.r*CS+(S.drag&&S.drag.o===o&&!o.h?S.drag.off*CS:0)}}
  function at(x,y){for(var i=S.cars.length-1;i>=0;i--){var o=S.cars[i],p=px(o),w=o.h?o.l*CS:CS,h=o.h?CS:o.l*CS;if(x>=p.x&&x<=p.x+w&&y>=p.y&&y<=p.y+h)return o}return null}
  function stars(){return S.mv<=S.opt?3:S.mv<=Math.ceil(S.opt*1.5)+1?2:1}
  function win(C){S.won=true;var st=stars(),lv=S.lv+1;if(lv>done())C.best(key(),lv);var sk='st-'+S.mode+'-'+lv,old=+(PP.store('debouche-'+sk)||0);if(st>old)PP.store('debouche-'+sk,st);
    C.win();sfx.play('win');C.pop(['','BIEN !','TRÈS BIEN !','PARFAIT !'][st],st===3?YEL:GRN,'80px');
    setTimeout(function(){if(PP.cur()!=='debouche')return;C.stop();var last=S.lv>=LV[S.mode].length-1;
      C.over(last?MODES[S.mode]+' terminé !':'Niveau '+lv+' réussi !','<span style="font-size:34px;color:#f3c623">'+'★★★'.slice(0,st)+'<span style="opacity:.25">'+'★★★'.slice(st)+'</span></span><br>En <b>'+S.mv+' coup'+(S.mv>1?'s':'')+'</b> (le minimum possible : '+S.opt+')'+(last?'<br>Essaie la difficulté suivante !':''),last?'Rejouer le dernier':'Niveau '+(lv+1),function(){if(!last)begin(C,S.lv+1);else begin(C,S.lv);C.hide();C.go()})},1100)}
  function release(C){var d=S.drag;if(!d)return;S.drag=null;var o=d.o,n=Math.round(d.off);if(o.h)o.c+=n;else o.r+=n;
    if(n){S.hist.push(d.snap);S.mv++;sfx.play('tick')}
    if(o.t&&o.c+o.l>=N){S.exit=0.001;sfx.play('go')}}
  /* ---------- dessin ---------- */
  function shade(hex,k){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;function f(v){return Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)))}return 'rgb('+f(r)+','+f(g)+','+f(b)+')'}
  function car(g,o,x,y,lift){var w=o.h?o.l*CS:CS,h=o.h?CS:o.l*CS,m=7,col=o.t?'#f7f5f0':o.col;g.save();g.translate(x+w/2,y+h/2);
    if(!o.h)g.rotate(o.up?-Math.PI/2:Math.PI/2);var L=(o.h?w:h)-m*2,Wd=(o.h?h:w)-m*2-6;if(lift){g.scale(1.04,1.04)}
    g.fillStyle='rgba(0,0,0,.35)';ag.rr(g,-L/2+3,-Wd/2+5,L,Wd,12);g.fill();
    g.fillStyle='#141210';[[-L/2+L*.18,-Wd/2-3],[L/2-L*.18-14,-Wd/2-3],[-L/2+L*.18,Wd/2-5],[L/2-L*.18-14,Wd/2-5]].forEach(function(p){ag.rr(g,p[0],p[1],14,8,3);g.fill()});
    var gr=g.createLinearGradient(0,-Wd/2,0,Wd/2);gr.addColorStop(0,shade(col,.25));gr.addColorStop(.5,col);gr.addColorStop(1,shade(col,-.25));g.fillStyle=gr;ag.rr(g,-L/2,-Wd/2,L,Wd,12);g.fill();
    g.strokeStyle=o.t?'#141210':shade(col,-.45);g.lineWidth=o.t?3:2;g.stroke();
    var rf=o.l>2?L*.34:L*.42,rx=o.l>2?-L/2+10:-rf/2-4;
    g.fillStyle='rgba(150,200,240,.9)';ag.rr(g,rx+rf-2,-Wd/2+6,12,Wd-12,4);g.fill();g.fillStyle='rgba(150,200,240,.6)';ag.rr(g,rx-8,-Wd/2+8,8,Wd-16,3);g.fill();
    g.fillStyle=shade(col,o.t?-.08:-.15);ag.rr(g,rx,-Wd/2+7,rf,Wd-14,6);g.fill();
    if(o.l>2){g.fillStyle=shade(col,-.3);ag.rr(g,rx+rf+16,-Wd/2+5,L-rf-30,Wd-10,4);g.fill();g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1.5;for(var k=1;k<4;k++){var lx=rx+rf+16+(L-rf-30)*k/4;g.beginPath();g.moveTo(lx,-Wd/2+7);g.lineTo(lx,Wd/2-7);g.stroke()}}
    g.fillStyle='#fff3b0';g.beginPath();g.arc(L/2-5,-Wd/2+8,4,0,7);g.arc(L/2-5,Wd/2-8,4,0,7);g.fill();g.fillStyle='#e2361b';g.fillRect(-L/2,-Wd/2+5,3,8);g.fillRect(-L/2,Wd/2-13,3,8);
    if(o.t){g.fillStyle=RED;ag.rr(g,rx+rf/2-12,-6,24,12,3);g.fill();ag.mono(g,'MOI',rx+rf/2,0,9,'#fff')}
    g.restore()}
  function lot(g){g.fillStyle='#2a2b2f';g.fillRect(0,0,W,H);
    g.fillStyle='rgba(0,0,0,.4)';ag.rr(g,BX-14,BY-14,N*CS+28,N*CS+28,14);g.fill();
    var gr=g.createLinearGradient(0,BY,0,BY+N*CS);gr.addColorStop(0,'#4a4c52');gr.addColorStop(1,'#3c3e43');g.fillStyle=gr;ag.rr(g,BX-10,BY-10,N*CS+20,N*CS+20,12);g.fill();
    g.strokeStyle='#f3c623';g.lineWidth=5;ag.rr(g,BX-10,BY-10,N*CS+20,N*CS+20,12);g.stroke();g.fillStyle='#3c3e43';g.fillRect(BX+N*CS+4,BY+ROW*CS+2,10,CS-4);
    g.strokeStyle='rgba(241,236,226,.22)';g.lineWidth=2;g.setLineDash([10,8]);for(var i=1;i<N;i++){g.beginPath();g.moveTo(BX+i*CS,BY);g.lineTo(BX+i*CS,BY+N*CS);g.stroke();g.beginPath();g.moveTo(BX,BY+i*CS);g.lineTo(BX+N*CS,BY+i*CS);g.stroke()}g.setLineDash([]);
    /* sortie */
    var ey=BY+ROW*CS;g.fillStyle='#3c3e43';g.fillRect(BX+N*CS-2,ey+2,W-(BX+N*CS),CS-4);g.fillStyle='#2a2b2f';g.fillRect(BX+N*CS+10,ey-10,6,12);g.fillRect(BX+N*CS+10,ey+CS-2,6,12);
    g.fillStyle=GRN;for(var a=0;a<3;a++){var ax=BX+N*CS+40+a*34+((S&&S.t||0)*30%34);g.globalAlpha=.25+.25*a;g.beginPath();g.moveTo(ax,ey+CS/2-12);g.lineTo(ax+14,ey+CS/2);g.lineTo(ax,ey+CS/2+12);g.closePath();g.fill()}g.globalAlpha=1;
    ag.txt(g,'SORTIE',BX+N*CS+90,ey-24,20,GRN)}
  function btn(g,x,y,w,h,l,fn,off){var hov=!off&&S.mx>=x&&S.mx<=x+w&&S.my>=y&&S.my<=y+h;g.fillStyle=off?'#3a3632':hov?'#f05a3e':RED;ag.rr(g,x,y,w,h,10);g.fill();ag.mono(g,l,x+w/2,y+h/2,14,off?'#7a746c':CR);if(!off)S.btns.push([x,y,w,h,fn])}
  function draw(C,dt){var g=C.g;if(!S)return;S.t+=dt||0;S.btns=[];lot(g);
    if(S.exit){S.exit+=(dt||0)*(2+S.exit*4);if(S.exit>4&&!S.won)win(C)}
    var d=S.drag;S.cars.forEach(function(o){if(d&&d.o===o)return;var p=px(o);car(g,o,p.x,p.y,false)});if(d){var p=px(d.o);car(g,d.o,p.x,p.y,true)}
    /* panneau gauche */
    ag.txt(g,'DÉBOUCHE',130,70,34,CR);ag.txt(g,'MOI',130,104,34,YEL);
    ag.mono(g,MODES[S.mode].toUpperCase(),130,150,13,'rgba(241,236,226,.6)');ag.txt(g,'NIVEAU '+(S.lv+1),130,182,30,CR);ag.mono(g,'sur '+LV[S.mode].length,130,210,12,'rgba(241,236,226,.6)');
    ag.mono(g,'COUPS',130,262,11,'rgba(241,236,226,.6)');ag.txt(g,String(S.mv),130,294,40,S.mv<=S.opt?CR:YEL);ag.mono(g,'minimum : '+S.opt,130,328,12,'rgba(241,236,226,.6)');
    var st=+(PP.store('debouche-st-'+S.mode+'-'+(S.lv+1))||0);ag.mono(g,'★★★'.slice(0,st)+'☆☆☆'.slice(st),130,360,18,YEL);
    if(!C.running)return;
    btn(g,40,404,180,44,'↶ Annuler',function(){if(S.hist.length&&!S.exit){restore(S.hist.pop());S.mv=Math.max(0,S.mv-1);sfx.play('ui')}},!S.hist.length||!!S.exit);
    btn(g,40,458,180,44,'↻ Recommencer',function(){if(!S.exit){begin(C,S.lv);sfx.play('ui')}},!!S.exit);
    /* panneau droit : niveaux */
    var x0=BX+N*CS+30,top=BY+ROW*CS+CS+30;ag.mono(g,'NIVEAUX',x0+100,top,11,'rgba(241,236,226,.6)');
    var dn=done();LV[S.mode].forEach(function(l,i){var cx=x0+(i%4)*52,cy=top+18+(i/4|0)*52,open=i<=dn,cur=i===S.lv;g.fillStyle=cur?YEL:open?'#4a4c52':'#232427';ag.rr(g,cx,cy,44,44,8);g.fill();
      ag.mono(g,open?String(i+1):'🔒',cx+22,cy+18,open?15:12,cur?INK:open?CR:'#6a645c');var s2=+(PP.store('debouche-st-'+S.mode+'-'+(i+1))||0);if(s2)ag.mono(g,'★★★'.slice(0,s2),cx+22,cy+35,9,cur?INK:YEL);
      if(open&&!cur)S.btns.push([cx,cy,44,44,function(){if(!S.exit){begin(C,i);sfx.play('ui')}}])})}
  PP.arcade({id:'debouche',
    setup:function(C){CC=C;S={mode:MODES[C.mode]?C.mode:'easy',mx:-1,my:-1,btns:[]};begin(C,Math.min(done(),LV[S.mode].length-1));
      C.keysText('Attrape une voiture (souris ou doigt) et fais-la glisser dans son sens · libère la <b>voiture blanche</b> par la sortie · <kbd>U</kbd> annuler · <kbd>R</kbd> recommencer');
      C.over('Débouche moi','Le parking est bouché ! Fais glisser les voitures (chacune avance ou recule seulement dans son sens) pour ouvrir un passage à la <b>voiture blanche</b>, puis fais-la sortir à droite.<br>'+MODES[S.mode]+' : niveau <b>'+(S.lv+1)+'</b> sur '+LV[S.mode].length+'. Moins de coups = plus d\'étoiles.','Jouer')},
    start:function(C){if(S.won)begin(C,S.lv)},
    mouse:function(C,t,x,y,e){S.mx=x;S.my=y;if(!C.running)return;
      if(t==='down'){for(var i=0;i<S.btns.length;i++){var b=S.btns[i];if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3]){b[4]();return}}
        if(S.exit)return;var o=at(x,y);if(!o)return;var rg=range(o),pos=o.h?o.c:o.r;S.drag={o:o,sx:x,sy:y,off:0,lo:rg[0]-pos,hi:rg[1]-pos,snap:snap()};sfx.play('ui')}
      else if(t==='move'&&S.drag){var d=S.drag,v=(d.o.h?x-d.sx:y-d.sy)/CS;d.off=Math.max(d.lo,Math.min(d.hi,v))}
      else if(t==='up'&&S.drag)release(C)},
    key:function(C,k,down){if(!down||!C.running||S.exit)return;if(k==='KeyU'||k==='Backspace'){if(S.hist.length){restore(S.hist.pop());S.mv=Math.max(0,S.mv-1);sfx.play('ui')}}else if(k==='KeyR'){begin(C,S.lv)}},
    draw:function(C,dt){draw(C,dt)}});
})();
