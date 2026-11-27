/* Pixel Pause — Terminal : apprends les commandes Linux en jouant.
   Un faux terminal avec un vrai petit système de fichiers (rien ne touche ton ordi).
   Histoire : 16 missions, de « pwd » à « chmod +x ». Chrono : 60 secondes, trouve la bonne commande le plus vite possible. */
(function(){
  'use strict';
  var sfx=PP.sfx,ag=PP.ag,INK='#141210',CR='#f1ece2',RED='#e2361b',YEL='#f3c623',GRN='#3fe09a',BLU='#6fb8ff',W=960,H=540,S;
  var HOME=['home','joueur'],TW=600,LH=19,ROWS=21,COLS=66;
  function D(o){return {d:o||{}}}
  function F(t,x){return {f:t||'',x:!!x}}
  function mkfs(){return D({
    home:D({joueur:D({
      documents:D({'notes.txt':F('Bienvenue sur le serveur pixel.\nPense a ranger ton dossier personnel.'),'liste.txt':F('pain\nlait\noeufs\ncafe')}),
      telechargements:D({'virus.sh':F('echo "je suis un virus"'),'photo.png':F('(une image)')}),
      vieux:D({'brouillon.txt':F('a jeter'),archives:D({'2019.txt':F('tres vieux')})}),
      'lance.sh':F('echo "Serveur demarre ! Bravo, admin."'),
      '.secret':F('Le code du serveur est dans /var/log/pixel.log\nCherche le mot cle avec grep.')})}),
    'var':D({log:D({'pixel.log':F('10:01 demarrage\n10:02 connexion de joueur\n10:03 cle = PIXEL-42\n10:04 sauvegarde ok\n10:05 erreur disque presque plein')})}),
    etc:D({hostname:F('pixel')})})}
  function parts(p){var a=p.charAt(0)==='/'?[]:(p.charAt(0)==='~'?HOME.slice():S.cwd.slice());if(p.charAt(0)==='~')p=p.slice(1);p.split('/').forEach(function(s){if(!s||s==='.')return;if(s==='..')a.pop();else a.push(s)});return a}
  function node(a){var n=S.fs;for(var i=0;i<a.length;i++){if(!n.d||!n.d[a[i]])return null;n=n.d[a[i]]}return n}
  function pstr(a){return '/'+a.join('/')}
  function show(a){var s=pstr(a),h=pstr(HOME);return s===h?'~':s.indexOf(h+'/')===0?'~'+s.slice(h.length):s}
  function out(t,col){String(t).split('\n').forEach(function(l){if(!l.length){S.buf.push({t:'',c:col});return}while(l.length>COLS){var k=l.lastIndexOf(' ',COLS);if(k<20)k=COLS;S.buf.push({t:l.slice(0,k),c:col});l=l.slice(k).replace(/^ /,'')}S.buf.push({t:l,c:col})});if(S.buf.length>400)S.buf.splice(0,S.buf.length-400)}
  function tokens(s){var r=[],cur='',q=null,has=false;for(var i=0;i<s.length;i++){var ch=s.charAt(i);if(q){if(ch===q)q=null;else cur+=ch}else if(ch==='"'||ch==="'"){q=ch;has=true}else if(ch===' '){if(cur.length||has){r.push(cur);cur='';has=false}}else cur+=ch}if(cur.length||has)r.push(cur);return r}
  var MAN={pwd:'pwd : affiche le dossier où tu es.',ls:'ls [-a] [-l] [dossier] : liste les fichiers. -a montre aussi les fichiers cachés (ceux qui commencent par un point).',cd:'cd dossier : change de dossier. « cd .. » remonte d\'un cran, « cd » tout seul revient chez toi.',cat:'cat fichier : affiche le contenu d\'un fichier.',mkdir:'mkdir nom : crée un dossier.',touch:'touch nom : crée un fichier vide.',rm:'rm fichier : supprime un fichier. « rm -r dossier » supprime un dossier et tout son contenu.',cp:'cp source destination : copie un fichier.',mv:'mv source destination : déplace ou renomme.',echo:'echo texte : affiche du texte. « echo texte > fichier » l\'écrit dans un fichier, « >> » l\'ajoute à la fin.',grep:'grep mot fichier : affiche les lignes du fichier qui contiennent le mot.',chmod:'chmod +x fichier : rend un fichier exécutable. On le lance ensuite avec ./fichier',head:'head fichier : affiche le début d\'un fichier.',tail:'tail fichier : affiche la fin d\'un fichier.',wc:'wc -l fichier : compte les lignes d\'un fichier.',whoami:'whoami : affiche ton nom d\'utilisateur.',clear:'clear : efface l\'écran.',history:'history : liste les commandes déjà tapées.',man:'man commande : explique une commande.',help:'help : liste les commandes.',indice:'indice : donne un indice pour la mission (coûte 10 secondes).'};
  function run(line){var X={cmd:'',args:[],line:line};out(prompt()+line,CR);line=line.trim();if(!line)return X;S.hist.push(line);S.hi=S.hist.length;S.ncmd++;
    var tk=tokens(line),red=null,ri=tk.indexOf('>>');if(ri<0)ri=tk.indexOf('>');if(ri>=0){red={ap:tk[ri]==='>>',to:tk[ri+1]};tk=tk.slice(0,ri)}
    var cmd=tk[0]||'',a=tk.slice(1),fl=a.filter(function(x){return x.charAt(0)==='-'&&x.length>1}).join(''),ar=a.filter(function(x){return !(x.charAt(0)==='-'&&x.length>1)});X.cmd=cmd;X.args=ar;X.fl=fl;
    function err(m){out(cmd+' : '+m,'#ff8a6b');X.err=1}
    function need(n){if(ar.length<n){err('il manque un argument. Essaie « man '+cmd+' »');return false}return true}
    function write(p,txt,ap){var pa=parts(p),nm=pa.pop(),par=node(pa);if(!par||!par.d||!nm){err('dossier introuvable');return false}if(par.d[nm]&&par.d[nm].d){err(nm+' est un dossier');return false}par.d[nm]=F(ap&&par.d[nm]?par.d[nm].f+(par.d[nm].f?'\n':'')+txt:txt,par.d[nm]&&par.d[nm].x);return true}
    if(cmd==='pwd')out(pstr(S.cwd));
    else if(cmd==='whoami')out('joueur');
    else if(cmd==='clear')S.buf=[];
    else if(cmd==='history')S.hist.forEach(function(h,i){out((i+1)+'  '+h)});
    else if(cmd==='help')out('Commandes : '+Object.keys(MAN).join(', ')+'\nTape « man commande » pour une explication.',YEL);
    else if(cmd==='man'){if(need(1))out(MAN[ar[0]]||('pas de manuel pour '+ar[0]),YEL)}
    else if(cmd==='indice'){if(S.mode==='story'&&MIS[S.mi])showHint();else out('Pas d\'indice ici.',YEL)}
    else if(cmd==='sudo')out('joueur n\'est pas dans le fichier sudoers. Bien tenté.','#ff8a6b');
    else if(cmd==='ls'){var p=ar[0]?parts(ar[0]):S.cwd,n=node(p);if(!n)err('dossier introuvable : '+ar[0]);else if(!n.d)out(ar[0]);else{var all=fl.indexOf('a')>=0,names=Object.keys(n.d).filter(function(k){return all||k.charAt(0)!=='.'}).sort();X.lsA=all;
        if(fl.indexOf('l')>=0)names.forEach(function(k){var c=n.d[k];out((c.d?'d':'-')+'rw'+(c.d||c.x?'x':'-')+'  joueur  '+(c.d?'    -':('     '+c.f.length).slice(-5))+'  '+k+(c.d?'/':''),c.d?BLU:c.x?GRN:CR)});
        else if(names.length)S.buf.push({t:'',segs:names.map(function(k){var c=n.d[k];return {t:k+(c.d?'/':''),c:c.d?BLU:c.x?GRN:CR}})});}}
    else if(cmd==='cd'){var p2=ar[0]?parts(ar[0]):HOME.slice(),n2=node(p2);if(!n2)err('dossier introuvable : '+ar[0]);else if(!n2.d)err(ar[0]+' n\'est pas un dossier');else S.cwd=p2}
    else if(cmd==='cat'||cmd==='head'||cmd==='tail'){if(need(1))ar.forEach(function(f){var n3=node(parts(f));if(!n3)err('fichier introuvable : '+f);else if(n3.d)err(f+' est un dossier');else{var ls=n3.f.split('\n');if(cmd==='head')ls=ls.slice(0,10);if(cmd==='tail')ls=ls.slice(-10);var txt=ls.join('\n');if(red){write(red.to,txt,red.ap)}else out(txt);X.read=pstr(parts(f))}})}
    else if(cmd==='wc'){if(need(1)){var n4=node(parts(ar[0]));if(!n4||n4.d)err('fichier introuvable : '+ar[0]);else out((n4.f?n4.f.split('\n').length:0)+' '+ar[0])}}
    else if(cmd==='mkdir'){if(need(1))ar.forEach(function(f){var pa=parts(f),nm=pa.pop(),par=node(pa);if(!par||!par.d)err('dossier introuvable');else if(par.d[nm])err(nm+' existe déjà');else par.d[nm]=D()})}
    else if(cmd==='touch'){if(need(1))ar.forEach(function(f){var pa=parts(f),nm=pa.pop(),par=node(pa);if(!par||!par.d)err('dossier introuvable');else if(!par.d[nm])par.d[nm]=F('')})}
    else if(cmd==='rm'){if(need(1))ar.forEach(function(f){var pa=parts(f),nm=pa.pop(),par=node(pa);if(!par||!par.d||!par.d[nm])err('introuvable : '+f);else if(par.d[nm].d&&!/r/i.test(fl))err(f+' est un dossier (utilise rm -r)');else if(pstr(S.cwd).indexOf(pstr(pa.concat([nm])))===0)err('tu es dedans, sors d\'abord du dossier');else delete par.d[nm]})}
    else if(cmd==='cp'||cmd==='mv'){if(need(2)){var sp=parts(ar[0]),sn=sp[sp.length-1],src=node(sp),dp=parts(ar[1]),dn=node(dp);
        if(!src)err('introuvable : '+ar[0]);else if(src.d&&cmd==='cp'&&!/r/i.test(fl))err(ar[0]+' est un dossier (utilise cp -r)');else{if(dn&&dn.d){dp.push(sn)}var nm2=dp.pop(),par2=node(dp);if(!par2||!par2.d)err('dossier introuvable');else{par2.d[nm2]=JSON.parse(JSON.stringify(src));if(cmd==='mv'){var spp=sp.slice(0,-1);delete node(spp).d[sn]}}}}}
    else if(cmd==='echo'){var txt2=a.join(' ');if(red){if(!red.to)err('il manque le nom du fichier après >');else write(red.to,txt2,red.ap)}else out(txt2)}
    else if(cmd==='grep'){if(need(2)){var n5=node(parts(ar[1]));if(!n5||n5.d)err('fichier introuvable : '+ar[1]);else{var ci=/i/.test(fl),w=ci?ar[0].toLowerCase():ar[0],hit=n5.f.split('\n').filter(function(l){return (ci?l.toLowerCase():l).indexOf(w)>=0});if(hit.length)out(hit.join('\n'),GRN);X.grep={w:ar[0],p:pstr(parts(ar[1])),n:hit.length}}}}
    else if(cmd==='chmod'){if(need(1)){var tgt=ar[ar.length-1],n6=node(parts(tgt));if(!n6||n6.d)err('fichier introuvable : '+tgt);else if(a.indexOf('+x')>=0||/7|5/.test(ar[0]))n6.x=true;else if(a.indexOf('-x')>=0)n6.x=false;else err('essaie : chmod +x '+tgt)}}
    else if(cmd.indexOf('./')===0){var n7=node(parts(cmd));if(!n7||n7.d)err('fichier introuvable');else if(!n7.x)err('permission non accordée (rends-le exécutable avec chmod +x)');else{var m=/^echo\s+"?([^"]*)"?/.exec(n7.f);out(m?m[1]:'(rien)',GRN);X.exec=pstr(parts(cmd))}}
    else{out(cmd+' : commande introuvable. Tape « help » pour la liste.','#ff8a6b');X.err=1}
    return X}
  function prompt(){return 'joueur@pixel:'+show(S.cwd)+'$ '}
  function at(p){return node(parts(p))}
  var MIS=[
    {s:['pwd'],t:'Tu viens d\'arriver sur le serveur. Affiche le dossier dans lequel tu te trouves.',h:'la commande s\'appelle pwd',ok:function(X){return X.cmd==='pwd'}},
    {s:['ls'],t:'Regarde ce qu\'il y a dans ce dossier.',h:'ls liste les fichiers',ok:function(X){return X.cmd==='ls'&&!X.err}},
    {s:['cd documents'],t:'Entre dans le dossier documents.',h:'cd documents',ok:function(){return pstr(S.cwd)==='/home/joueur/documents'}},
    {s:['cat notes.txt'],t:'Lis le fichier notes.txt.',h:'cat notes.txt',ok:function(X){return X.read==='/home/joueur/documents/notes.txt'}},
    {s:['cd ..'],t:'Reviens dans ton dossier personnel (un cran au-dessus).',h:'cd .. remonte d\'un dossier',ok:function(){return pstr(S.cwd)==='/home/joueur'}},
    {s:['mkdir projets'],t:'Crée un dossier qui s\'appelle projets.',h:'mkdir projets',ok:function(){var n=at('~/projets');return !!(n&&n.d)}},
    {s:['touch projets/todo.txt'],t:'Crée un fichier vide todo.txt dans le dossier projets.',h:'touch projets/todo.txt',ok:function(){var n=at('~/projets/todo.txt');return !!(n&&!n.d)}},
    {s:['echo site > projets/todo.txt'],t:'Écris le mot site dans projets/todo.txt, sans ouvrir d\'éditeur.',h:'echo site > projets/todo.txt',ok:function(){var n=at('~/projets/todo.txt');return !!(n&&!n.d&&/site/i.test(n.f))}},
    {s:['cp projets/todo.txt copie.txt'],t:'Fais une copie de projets/todo.txt qui s\'appelle copie.txt (dans ton dossier personnel).',h:'cp projets/todo.txt copie.txt',ok:function(){var n=at('~/copie.txt');return !!(n&&!n.d&&/site/i.test(n.f))}},
    {s:['mv copie.txt backup.txt'],t:'Renomme copie.txt en backup.txt.',h:'mv copie.txt backup.txt',ok:function(){return !at('~/copie.txt')&&!!at('~/backup.txt')}},
    {s:['ls -a'],t:'Il y a un fichier caché ici. Affiche aussi les fichiers cachés.',h:'ls -a',ok:function(X){return X.cmd==='ls'&&X.lsA}},
    {s:['cat .secret'],t:'Lis le fichier caché .secret.',h:'cat .secret',ok:function(X){return X.read==='/home/joueur/.secret'}},
    {s:['grep cle /var/log/pixel.log'],t:'Trouve la ligne qui contient le mot cle dans /var/log/pixel.log.',h:'grep cle /var/log/pixel.log',ok:function(X){return X.grep&&X.grep.p==='/var/log/pixel.log'&&X.grep.n>0&&/cle/i.test(X.grep.w)}},
    {s:['rm telechargements/virus.sh'],t:'Un virus traîne : supprime telechargements/virus.sh.',h:'rm telechargements/virus.sh',ok:function(){return !at('~/telechargements/virus.sh')&&!!at('~/telechargements')}},
    {s:['rm -r vieux'],t:'Supprime le dossier vieux et tout ce qu\'il contient.',h:'rm -r vieux',ok:function(){return !at('~/vieux')}},
    {s:['chmod +x lance.sh','./lance.sh'],t:'Dernière étape : rends lance.sh exécutable, puis lance-le.',h:'chmod +x lance.sh puis ./lance.sh',ok:function(X){return X.exec==='/home/joueur/lance.sh'}}];
  var QS=[['afficher le dossier courant',['pwd']],['lister les fichiers',['ls']],['lister aussi les fichiers cachés',['ls -a','ls -la','ls -al']],['remonter dans le dossier parent',['cd ..','cd ../']],['revenir dans ton dossier personnel',['cd','cd ~','cd ~/']],['créer le dossier test',['mkdir test']],['créer le fichier vide a.txt',['touch a.txt']],['afficher le contenu de a.txt',['cat a.txt']],['supprimer le fichier a.txt',['rm a.txt']],['supprimer le dossier vieux et son contenu',['rm -r vieux','rm -rf vieux','rm -fr vieux','rm -R vieux','rm -r vieux/','rm -rf vieux/']],['copier a.txt vers b.txt',['cp a.txt b.txt']],['renommer a.txt en b.txt',['mv a.txt b.txt']],['déplacer a.txt dans le dossier docs',['mv a.txt docs','mv a.txt docs/']],['chercher le mot erreur dans log.txt',['grep erreur log.txt']],['savoir quel utilisateur tu es',['whoami']],['effacer l\'écran',['clear']],['rendre run.sh exécutable',['chmod +x run.sh']],['lancer le script run.sh du dossier courant',['./run.sh']],['lire le manuel de ls',['man ls']],['compter les lignes de a.txt',['wc -l a.txt']],['afficher le début de a.txt',['head a.txt']],['afficher la fin de a.txt',['tail a.txt']],['écrire bonjour dans a.txt',['echo bonjour > a.txt']],['ajouter bonjour à la fin de a.txt',['echo bonjour >> a.txt']],['entrer dans le dossier docs',['cd docs','cd docs/']],['lister les fichiers avec les détails',['ls -l']]];
  /* v83 : bouton Indice — toutes les commandes de la mission, dans l'ordre (+10 s, une fois par mission) */
  function hintSteps(){var m=MIS[S.mi];if(!m)return [];var l=m.s.slice();if(S.mi>=5&&pstr(S.cwd)!==pstr(HOME))l.unshift('cd ~');return l}
  function showHint(){if(S.mode!=='story'||S.over||!MIS[S.mi]||(S.hintOpen&&S.hintM===S.mi))return;if(S.hintM!==S.mi){S.hintM=S.mi;S.pen+=10;PP.sfx.play('ui')}S.hintOpen=true;out('Indice (+10 s) : tape '+hintSteps().map(function(c,i){return (i+1)+') '+c}).join('   '),YEL)}
  function norm(s){return String(s).trim().replace(/["']/g,'').replace(/\s+/g,' ')}
  function nextQ(){var i;do{i=Math.floor(Math.random()*QS.length)}while(i===S.qi&&QS.length>1);S.qi=i}
  function fresh(C){S={mode:C.mode==='chrono'?'chrono':'story',fs:mkfs(),cwd:HOME.slice(),buf:[],hist:[],hi:0,inp:'',mi:0,t:0,pen:0,ncmd:0,over:false,tt:0,score:0,time:60,qi:-1,flash:0};
    if(S.mode==='story'){out('Bienvenue sur le serveur pixel. Les missions sont à droite.',YEL);out('Tape « help » pour la liste des commandes, « indice » si tu bloques.',YEL);out('')}
    else{out('Chrono : tape la commande demandée à droite, puis Entrée.',YEL);out('');nextQ()}}
  function done(C){S.over=true;C.stop();sfx.play('win');var sec=Math.round(S.t+S.pen),nb=C.best('t',sec,true);C.win();C.pop('SERVEUR SAUVÉ !',GRN,'54px');
    setTimeout(function(){C.over('Mission accomplie','Les 16 missions en <b>'+sec+' s</b> et '+S.ncmd+' commandes'+(S.pen?' (dont '+S.pen+' s d\'indices)':'')+'.'+(nb?'<br><b>Nouveau record !</b>':'<br>Record : '+C.best('t')+' s')+'<br>Tu connais maintenant : pwd, ls, cd, cat, mkdir, touch, echo, cp, mv, grep, rm et chmod.','Rejouer')},900)}
  function enter(C){var line=S.inp;S.inp='';
    if(S.mode==='chrono'){out('$ '+line,CR);var q=QS[S.qi],good=q[1].some(function(a){return norm(a)===norm(line)});
      if(good){S.score++;S.flash=.3;S.fok=1;sfx.play('pickup');out('Correct !',GRN)}else{S.time=Math.max(0,S.time-3);S.flash=.3;S.fok=0;sfx.play('lose');out('Raté. Il fallait : '+q[1][0],'#ff8a6b')}nextQ();return}
    var X=run(line);if(S.over)return;var guard=0;
    while(MIS[S.mi]&&guard++<3){var okk=false;try{okk=MIS[S.mi].ok(X)}catch(e){}if(!okk)break;S.mi++;S.hintOpen=false;sfx.play('pickup');S.flash=.4;S.fok=1;out('Mission '+S.mi+'/'+MIS.length+' réussie.',GRN);X={cmd:'',args:[]};if(S.mi>=MIS.length){done(C);return}}
    if(X.err)sfx.play('tick')}
  function complete(){var m=/(\S*)$/.exec(S.inp),w=m?m[1]:'';if(S.inp.indexOf(' ')<0){var cs=Object.keys(MAN).filter(function(k){return k.indexOf(w)===0});if(cs.length===1)S.inp=cs[0]+' ';return}
    var sl=w.lastIndexOf('/'),dir=sl>=0?w.slice(0,sl+1):'',pre=sl>=0?w.slice(sl+1):w,n=node(parts(dir||'.'));if(!n||!n.d)return;var c=Object.keys(n.d).filter(function(k){return k.indexOf(pre)===0&&(pre.length||k.charAt(0)!=='.')});
    if(c.length===1)S.inp=S.inp.slice(0,S.inp.length-w.length)+dir+c[0]+(n.d[c[0]].d?'/':' ');else if(c.length>1){out(c.join('  '),'#9a968c')}}
  function wrap(g,txt,x,y,w,lh,col,size){g.font='500 '+size+'px "IBM Plex Mono", monospace';g.fillStyle=col;g.textAlign='left';g.textBaseline='middle';var line='',yy=y;txt.split(' ').forEach(function(wd){var t=line?line+' '+wd:wd;if(g.measureText(t).width>w&&line){g.fillText(line,x,yy);yy+=lh;line=wd}else line=t});if(line)g.fillText(line,x,yy);return yy+lh}
  PP.arcade({id:'term',
    setup:function(C){fresh(C);C.keysText('Tape tes commandes au clavier puis <kbd>Entrée</kbd> · <kbd>Tab</kbd> complète un nom · <kbd>↑</kbd> <kbd>↓</kbd> rappellent les commandes · rien ne touche ton vrai ordi');
      C.over('Terminal',S.mode==='chrono'?'60 secondes : on te dit quoi faire, tu tapes la commande Linux. Une bonne réponse vaut 1 point, une erreur coûte 3 secondes.':'Tu es le nouvel admin du serveur pixel. <b>16 missions</b> pour apprendre les vraies commandes Linux : te déplacer, lire, créer, copier, chercher, supprimer.<br>C\'est un faux terminal : tu ne peux rien casser.<br>Record : <b>'+(C.best('t')?C.best('t')+' s':'—')+'</b>','Démarrer')},
    start:function(C){fresh(C)},
    mouse:function(C,t,x,y){S.mx=x;S.my=y;if(t==='down'&&C.running&&S.hb&&x>=S.hb[0]&&x<=S.hb[0]+S.hb[2]&&y>=S.hb[1]&&y<=S.hb[1]+S.hb[3])showHint()},
    key:function(C,code,down,e){if(!down||!C.running||S.over||!e)return;var k=e.key;
      if((e.ctrlKey&&!e.altKey)||e.metaKey){if(k==='l'||k==='L'){S.buf=[];e.preventDefault()}return}
      if(k==='Enter'){e.preventDefault();enter(C)}
      else if(k==='Backspace'){e.preventDefault();S.inp=S.inp.slice(0,-1)}
      else if(k==='Tab'){e.preventDefault();if(S.mode==='story')complete()}
      else if(k==='ArrowUp'){e.preventDefault();if(S.hi>0){S.hi--;S.inp=S.hist[S.hi]}}
      else if(k==='ArrowDown'){e.preventDefault();if(S.hi<S.hist.length-1){S.hi++;S.inp=S.hist[S.hi]}else{S.hi=S.hist.length;S.inp=''}}
      else if(k==='Escape'){S.inp=''}
      else if(k&&k.length===1){e.preventDefault();if(S.inp.length<120)S.inp+=k;if(Math.random()<.3)sfx.play('tick')}},
    step:function(C,dt){S.tt+=dt;S.flash=Math.max(0,S.flash-dt);
      if(S.mode==='chrono'){S.time-=dt;if(S.time<=0&&!S.over){S.time=0;S.over=true;C.stop();sfx.play('lose');var nb=C.best('pts',S.score);if(S.score>=12)C.win();setTimeout(function(){C.over('Temps écoulé !','<b>'+S.score+'</b> commande'+(S.score>1?'s':'')+' trouvée'+(S.score>1?'s':'')+(nb&&S.score?'<br><b>Nouveau record !</b>':'<br>Record : '+(C.best('pts')||0)),'Rejouer')},500)}
        C.hud('<span>Temps <b>'+Math.ceil(S.time)+' s</b></span><span>Score <b>'+S.score+'</b></span>')}
      else{S.t+=dt;C.hud('<span>Mission <b>'+Math.min(MIS.length,S.mi+1)+' / '+MIS.length+'</b></span><span>Temps <b>'+Math.round(S.t+S.pen)+' s</b></span><span>Commandes <b>'+S.ncmd+'</b></span>')}},
    draw:function(C){var g=C.g;if(!S)fresh(C);g.fillStyle='#1b1a1d';g.fillRect(0,0,W,H);
      /* fenêtre du terminal */
      var x0=16,y0=14,w0=TW+24,h0=H-28;g.fillStyle='rgba(0,0,0,.4)';ag.rr(g,x0+5,y0+6,w0,h0,10);g.fill();g.fillStyle='#0f1114';ag.rr(g,x0,y0,w0,h0,10);g.fill();g.strokeStyle=S.flash>0?(S.fok?GRN:RED):'#3a3d44';g.lineWidth=S.flash>0?3:2;g.stroke();
      g.save();ag.rr(g,x0,y0,w0,h0,10);g.clip();g.fillStyle='#2a2d33';g.fillRect(x0,y0,w0,26);g.restore();[RED,YEL,GRN].forEach(function(c,i){g.fillStyle=c;g.beginPath();g.arc(x0+18+i*18,y0+13,5.5,0,7);g.fill()});ag.mono(g,S.mode==='chrono'?'joueur@pixel : chrono':'joueur@pixel : '+show(S.cwd),x0+w0/2,y0+13,12,'#b8b4aa');
      g.font='500 14px "IBM Plex Mono", monospace';g.textAlign='left';g.textBaseline='middle';
      var pr=S.mode==='chrono'?'$ ':prompt(),full=pr+S.inp,inLines=[];for(var i=0;i<Math.max(1,full.length);i+=COLS)inLines.push(full.slice(i,i+COLS));if(full.length&&full.length%COLS===0)inLines.push('');
      var vis=S.buf.slice(-(ROWS-inLines.length)),y=y0+44;
      vis.forEach(function(l){if(l.segs){var xx=x0+14;l.segs.forEach(function(s){if(xx+g.measureText(s.t).width>x0+w0-10){y+=LH;xx=x0+14}g.fillStyle=s.c;g.fillText(s.t,xx,y);xx+=g.measureText(s.t+'  ').width})}else{g.fillStyle=l.c||'#d8d4ca';g.fillText(l.t,x0+14,y)}y+=LH});
      if(!S.over){inLines.forEach(function(l,li){var px=x0+14;if(li===0){g.fillStyle=GRN;g.fillText(pr,px,y);g.fillStyle=CR;g.fillText(l.slice(pr.length),px+g.measureText(pr).width,y)}else{g.fillStyle=CR;g.fillText(l,px,y)}
          if(li===inLines.length-1&&Math.floor(S.tt*2)%2===0&&C.running){g.fillStyle=CR;g.fillRect(px+g.measureText(l).width+1,y-8,8,16)}y+=LH})}
      /* panneau de droite : mission ou question */
      var px0=656,pw=288;g.fillStyle='#fbf8f1';ag.rr(g,px0,14,pw,H-28,10);g.fill();g.strokeStyle=INK;g.lineWidth=3;g.stroke();
      if(S.mode==='chrono'){ag.txt(g,String(Math.ceil(S.time)),px0+pw/2,76,58,S.time<10?RED:INK);ag.mono(g,'SECONDES',px0+pw/2,112,11,'rgba(20,18,16,.6)');
        g.fillStyle=INK;g.fillRect(px0+18,134,pw-36,3);ag.mono(g,'QUELLE COMMANDE POUR…',px0+pw/2,160,11,'rgba(20,18,16,.6)');
        if(S.qi>=0)wrap(g,QS[S.qi][0]+' ?',px0+20,196,pw-40,26,INK,18);
        ag.txt(g,String(S.score),px0+pw/2,420,70,RED);ag.mono(g,'POINTS',px0+pw/2,466,11,'rgba(20,18,16,.6)')}
      else{var mi=Math.min(S.mi,MIS.length-1);ag.txt(g,'MISSION '+(mi+1),px0+20,46,28,INK,'left');ag.mono(g,(mi+1)+' / '+MIS.length,px0+pw-20,46,12,'rgba(20,18,16,.6)','right');
        g.fillStyle='rgba(20,18,16,.14)';ag.rr(g,px0+20,68,pw-40,8,4);g.fill();g.fillStyle='#3fbf6a';ag.rr(g,px0+20,68,Math.max(8,(pw-40)*S.mi/MIS.length),8,4);g.fill();
        var yy=wrap(g,S.over?'Toutes les missions sont finies !':MIS[mi].t,px0+20,108,pw-40,24,INK,16);
        S.hb=null;if(!S.over&&C.running){var by=Math.min(yy+4,H-226);
          if(!S.hintOpen){var hov=S.mx>=px0+20&&S.mx<=px0+pw-20&&S.my>=by&&S.my<=by+36;g.fillStyle=hov?'#f05a3e':RED;ag.rr(g,px0+20,by,pw-40,36,8);g.fill();ag.mono(g,'💡 INDICE'+(S.hintM===S.mi?'':'  (+10 s)'),px0+pw/2,by+18,14,CR);S.hb=[px0+20,by,pw-40,36]}
          else{var st=hintSteps(),bh=30+st.length*24;g.fillStyle='#fff3c4';ag.rr(g,px0+20,by,pw-40,bh,8);g.fill();g.strokeStyle=YEL;g.lineWidth=2;g.stroke();ag.mono(g,'TAPE, DANS L\'ORDRE :',px0+32,by+15,11,'rgba(20,18,16,.65)','left');
            st.forEach(function(c,i){ag.mono(g,(i+1)+'.  '+c,px0+32,by+38+i*24,13,INK,'left')})}}
        g.fillStyle='rgba(20,18,16,.08)';ag.rr(g,px0+16,H-178,pw-32,150,8);g.fill();ag.mono(g,'AIDE',px0+28,H-160,11,'rgba(20,18,16,.6)','left');
        ['help    liste des commandes','man ls  explique une commande','indice  les commandes (+10 s)','Tab     complète un nom','↑ ↓     commandes précédentes','clear   efface l\'écran'].forEach(function(l,i){ag.mono(g,l,px0+28,H-138+i*19,11,INK,'left')})}}
  });
})();
