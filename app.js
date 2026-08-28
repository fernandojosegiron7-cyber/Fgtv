(() => {
  const DEFAULTS = {
    name: 'FG Ultra Media',
    logo: 'icons/icon-512.png',
    hero: 'Una app que se ve brutal desde el primer segundo.',
    subtitle: 'Diseño elegante, futurista y totalmente administrable para radio y televisión en una sola experiencia.',
    audio: '',
    track: 'Programación en vivo',
    video: '',
    channel: 'Canal principal',
    accent: '#8a5cff'
  };

  const $ = (id) => document.getElementById(id);
  const state = { cfg: loadConfig(), hls: null, deferredPrompt: null };

  function loadConfig(){
    try{ return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('fgUltraConfig') || '{}') }; }
    catch{ return { ...DEFAULTS }; }
  }
  function saveConfig(){ localStorage.setItem('fgUltraConfig', JSON.stringify(state.cfg)); }
  function safeLogo(v){ return v && /^https?:\/\//i.test(v) ? v : (v || DEFAULTS.logo); }

  function applyConfig(){
    const c = state.cfg;
    document.documentElement.style.setProperty('--accent', c.accent || DEFAULTS.accent);
    $('brandName').textContent = c.name;
    $('brandLogo').src = safeLogo(c.logo);
    $('coverImage').src = safeLogo(c.logo);
    $('tvLogo').src = safeLogo(c.logo);
    $('tvPosterName').textContent = c.name + ' TV';
    $('heroTitle').textContent = c.hero;
    $('heroSubtitle').textContent = c.subtitle;
    $('trackTitle').textContent = c.track;
    $('trackArtist').textContent = c.name;
    $('tvChannelTitle').textContent = c.channel;
    $('audioEl').src = c.audio || '';
    fillForm();
  }
  function fillForm(){
    const c = state.cfg;
    $('setName').value = c.name;
    $('setLogo').value = c.logo.startsWith('http') ? c.logo : '';
    $('setHero').value = c.hero;
    $('setSubtitle').value = c.subtitle;
    $('setAudio').value = c.audio;
    $('setTrack').value = c.track;
    $('setVideo').value = c.video;
    $('setChannel').value = c.channel;
    $('setAccent').value = c.accent;
  }
  function toast(msg){
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function showView(view){
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    const radio = $('radioView');
    const tv = $('tvView');
    const showcase = $('showcaseView');
    radio.classList.toggle('hidden', view !== 'radio');
    tv.classList.toggle('hidden', view !== 'tv');
    showcase.classList.toggle('hidden', view === 'tv');
    if(view === 'tv') showcase.classList.add('hidden');
  }
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));

  const audio = $('audioEl');
  audio.volume = .8;
  $('audioVolume').addEventListener('input', e => audio.volume = Number(e.target.value));
  function setAudioState(playing){
    $('audioPlay').querySelector('span').textContent = playing ? '❚❚' : '▶';
    $('radioView').classList.toggle('playing', playing);
  }
  $('audioPlay').addEventListener('click', async () => {
    if(!state.cfg.audio){ toast('Agrega la URL de radio en Administrar.'); openAdmin(); return; }
    try{
      if(audio.paused){ await audio.play(); setAudioState(true); }
      else{ audio.pause(); setAudioState(false); }
    }catch{ toast('No se pudo iniciar el audio. Revisa la URL o CORS.'); }
  });
  audio.addEventListener('playing', () => setAudioState(true));
  audio.addEventListener('pause', () => setAudioState(false));
  audio.addEventListener('error', () => { if(state.cfg.audio) toast('La señal de audio no pudo cargarse.'); });

  const video = $('videoEl');
  function destroyHls(){ if(state.hls){ state.hls.destroy(); state.hls = null; } video.removeAttribute('src'); video.load(); }
  function loadVideo(autoPlay=false){
    destroyHls();
    const url = state.cfg.video;
    if(!url){ toast('Agrega la URL de TV en Administrar.'); openAdmin(); return; }
    $('tvPoster').classList.add('hidden');
    $('tvStatus').textContent = 'CARGANDO';
    if(/\.m3u8($|\?)/i.test(url) && window.Hls && window.Hls.isSupported()){
      state.hls = new window.Hls({ enableWorker:true, lowLatencyMode:true });
      state.hls.loadSource(url);
      state.hls.attachMedia(video);
      state.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        $('tvStatus').textContent = 'EN VIVO';
        if(autoPlay) video.play().catch(()=>{});
      });
      state.hls.on(window.Hls.Events.ERROR, (_e, data) => {
        if(data.fatal){ $('tvStatus').textContent = 'ERROR'; toast('No se pudo cargar la señal HLS.'); }
      });
    } else if(video.canPlayType('application/vnd.apple.mpegurl') && /\.m3u8($|\?)/i.test(url)){
      video.src = url;
      video.addEventListener('loadedmetadata', () => { $('tvStatus').textContent = 'EN VIVO'; if(autoPlay) video.play().catch(()=>{}); }, { once:true });
    } else {
      video.src = url;
      video.addEventListener('loadeddata', () => { $('tvStatus').textContent = 'EN VIVO'; if(autoPlay) video.play().catch(()=>{}); }, { once:true });
    }
  }
  $('tvPlayBig').addEventListener('click', () => loadVideo(true));
  $('tvReload').addEventListener('click', () => loadVideo(true));
  $('tvMute').addEventListener('click', () => {
    video.muted = !video.muted;
    $('tvMute').textContent = video.muted ? '🔇 Silencio' : '🔊 Audio';
  });

  function openAdmin(){ $('adminPanel').classList.add('open'); $('scrim').classList.remove('hidden'); }
  function closeAdmin(){ $('adminPanel').classList.remove('open'); $('scrim').classList.add('hidden'); }
  $('adminBtn').addEventListener('click', openAdmin);
  $('closeAdmin').addEventListener('click', closeAdmin);
  $('scrim').addEventListener('click', closeAdmin);

  $('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.cfg = {
      name: $('setName').value.trim() || DEFAULTS.name,
      logo: $('setLogo').value.trim() || DEFAULTS.logo,
      hero: $('setHero').value.trim() || DEFAULTS.hero,
      subtitle: $('setSubtitle').value.trim() || DEFAULTS.subtitle,
      audio: $('setAudio').value.trim(),
      track: $('setTrack').value.trim() || DEFAULTS.track,
      video: $('setVideo').value.trim(),
      channel: $('setChannel').value.trim() || DEFAULTS.channel,
      accent: $('setAccent').value || DEFAULTS.accent,
    };
    saveConfig();
    audio.pause(); setAudioState(false); destroyHls(); $('tvPoster').classList.remove('hidden'); $('tvStatus').textContent = 'LISTO';
    applyConfig(); closeAdmin(); toast('Configuración guardada.');
  });

  $('resetBtn').addEventListener('click', () => {
    state.cfg = { ...DEFAULTS }; saveConfig(); applyConfig(); toast('Demo restablecida.');
  });

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); state.deferredPrompt = e; $('installBtn').classList.remove('hidden');
  });
  $('installBtn').addEventListener('click', async () => {
    if(!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    $('installBtn').classList.add('hidden');
  });

  if('serviceWorker' in navigator){ window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{})); }

  applyConfig();
  showView('radio');
})();
