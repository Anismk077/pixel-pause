/* Pixel Pause — fluidité automatique pour tous les jeux 3D.
   Chaque rendu 3D mesure ses images par seconde. Si l'ordi rame (moins de 38 i/s), la résolution du rendu baisse
   petit à petit (jusqu'à 50 %). Si ça va bien (plus de 56 i/s), elle remonte. Si ça rame encore à fond, les ombres
   sont coupées. En « Qualité : Haute » rien ne change, en « Basse » la résolution reste à 60 % sans ombres. */
(function(){
  'use strict';
  if(!window.THREE||!THREE.WebGLRenderer)return;
  function q(){return (window.PP&&PP.settings&&PP.settings.q)||'auto'}
  function wrap(r){
    var orig=r.render,st={n:0,t0:performance.now(),last:0,scale:1,set:null,base:1,low:0,warm:1};r.__pp=st;
    r.render=function(scene,cam){
      if(r.__ppSkip)return orig.call(r,scene,cam);
      var now=performance.now();
      /* plusieurs rendus dans la même image (écran partagé, arme en main) ne comptent qu'une fois */
      if(now-st.last>4){st.n++;st.last=now}
      var el=now-st.t0;
      if(el>2000){
        var fps=st.n*1000/el,mode=q();st.n=0;st.t0=now;
        /* onglet caché ou chargement : on ignore cette mesure */
        if(el>4000||st.warm)st.warm=0;
        else{
          var pr=r.getPixelRatio();
          /* le jeu a lui-même changé la résolution (redimensionnement) : on repart de sa valeur */
          if(st.set===null||Math.abs(pr-st.set)>.01){st.base=pr;st.set=pr*st.scale;if(st.scale!==1)r.setPixelRatio(st.set)}
          var target=st.scale;
          if(mode==='basse')target=.6;
          else if(mode==='haute')target=1;
          else if(fps<38)target=Math.max(.5,st.scale-.15);
          else if(fps>56)target=Math.min(1,st.scale+.1);
          if(Math.abs(target-st.scale)>.001){st.scale=target;st.set=st.base*target;r.setPixelRatio(st.set)}
          if(mode!=='haute'&&r.shadowMap&&r.shadowMap.enabled&&(mode==='basse'||(fps<24&&st.scale<=.55))){
            st.low++;
            if(st.low>=2||mode==='basse'){r.shadowMap.enabled=false;if(scene&&scene.traverse)scene.traverse(function(o){if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.needsUpdate=true})})}
          }else st.low=0;
        }
      }
      return orig.call(r,scene,cam);
    };
    return r;
  }
  /* three.js crée la méthode render dans le constructeur : on enveloppe donc chaque nouveau rendu */
  var Base=THREE.WebGLRenderer;
  function PPRenderer(o){return wrap(new Base(o))}
  PPRenderer.prototype=Base.prototype;
  try{THREE.WebGLRenderer=PPRenderer}catch(e){}
})();
