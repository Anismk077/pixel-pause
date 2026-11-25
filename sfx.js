/* Pixel Pause — petits sons de synthèse (WebAudio), avec bouton muet */
PP.sfx=(function(){
  'use strict';
  var ctx=null,muted=!!PP.store('muted'),master=null;
  function ac(){
    if(ctx)return ctx;
    try{ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.25*((PP.settings?PP.settings.vol:80)/80);master.connect(ctx.destination)}catch(e){ctx=null}
    return ctx;
  }
  document.addEventListener('pp-settings',function(){if(master)master.gain.value=.25*(PP.settings.vol/80)});
  document.addEventListener('pointerdown',function(){if(ac()&&ctx.state==='suspended')ctx.resume()},{passive:true});
  document.addEventListener('keydown',function(){if(ac()&&ctx.state==='suspended')ctx.resume()});
  function tone(type,f0,f1,dur,vol,delay){
    if(muted||!ac())return;
    var t=ctx.currentTime+(delay||0),o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(vol||.5,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02);
  }
  function noise(dur,vol,delay,hp){
    if(muted||!ac())return;
    var t=ctx.currentTime+(delay||0),n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
    var s=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();f.type=hp?'highpass':'lowpass';f.frequency.value=hp||1200;
    s.buffer=b;g.gain.value=vol||.5;s.connect(f);f.connect(g);g.connect(master);s.start(t);
  }
  var S={
    ui:function(){tone('square',600,900,.06,.25)},
    shoot:function(){noise(.09,.6,0,2000);tone('square',220,60,.09,.4)},
    hit:function(){tone('square',900,500,.06,.35)},
    kill:function(){tone('square',400,900,.12,.4);tone('square',600,1200,.14,.35,.1)},
    hurt:function(){noise(.15,.5);tone('sawtooth',160,60,.2,.5)},
    pickup:function(){tone('square',700,1400,.1,.35);tone('square',1000,1800,.1,.3,.08)},
    eat:function(){tone('square',500,1000,.07,.35)},
    die:function(){tone('sawtooth',300,40,.5,.5);noise(.3,.4,.05)},
    count:function(){tone('square',440,440,.12,.4)},
    go:function(){tone('square',880,880,.3,.45)},
    boost:function(){tone('sawtooth',200,1200,.35,.35)},
    crash:function(){noise(.35,.7);tone('sawtooth',120,30,.4,.5)},
    win:function(){[523,659,784,1046].forEach(function(f,i){tone('square',f,f,.18,.4,i*.12)})},
    lose:function(){[400,300,200].forEach(function(f,i){tone('sawtooth',f,f*.8,.25,.4,i*.2)})},
    join:function(){tone('square',600,900,.08,.3);tone('square',900,1200,.1,.3,.09)},
    tick:function(){tone('square',1200,1200,.03,.15)}
  };
  function play(n){if(S[n])try{S[n]()}catch(e){}}
  function toggle(){muted=!muted;PP.store('muted',muted?1:0);sync();return muted}
  function sync(){document.querySelectorAll('[data-mute]').forEach(function(b){b.textContent=muted?'Son : off':'Son : on';b.setAttribute('aria-pressed',muted)})}
  document.addEventListener('click',function(e){var b=e.target.closest('[data-mute]');if(b){toggle();if(!muted)play('ui')}});
  sync();
  return {play:play,toggle:toggle,get muted(){return muted}};
})();
