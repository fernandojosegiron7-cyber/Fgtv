(() => {
  const DEFAULTS = {
    name: 'FG Ultra Media',
    logo: 'icons/icon-512.png',
    hero: 'Radio y televisión en una experiencia moderna.',
    subtitle: 'Disfruta audio y televisión en vivo desde una interfaz moderna, rápida y adaptable.',
    audio: '',
    track: 'Programación en vivo',
    video: '',
    channel: 'Canal principal',
    accent: '#8a5cff'
  };

  const $ = (id) => document.getElementById(id);
  const state = { cfg: loadConfig(), hls: null, deferredPrompt: null, logoErrorShown: false };

  function loadConfig(){
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('fgUltraConfig') || '{}') }; }
    catch { return { ...DEFAULTS }; }
  }

  function normalizeLogoUrl(value){
    const v = String(value || '').trim();
    if (!v) return DEFAULTS.logo;
    if (/^(data:image\/|blob:|\.{0,2}\/|icons\/)/i.test(v)) return v;

    // Google Drive share link -> embeddable image link
    const drive = v.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (drive) return `https://drive.google.com/uc?export=view&id=${drive[1]}`;

    // GitHub "blob" link -> raw file
    const gh = v.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
    if (gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}/${gh[4]}`;

    // Dropbox share links
    if (/dropbox\.com/i.test(v)) {
      try {
        const u = new URL(v);
        u.searchParams.delete('dl');
        u.searchParams.set('raw', '1');
        return u.toString();
      } catch {}
    }

    return v;
  }

  function setLogo(img, value){
    if (!img) return;
    const src = normalizeLogoUrl(value);
    img.onerror = () => {
      img.onerror = null;
      img.src = DEFAULTS.logo;
      if (!state.logoErrorShown) {
        state.logoErrorShown = true;
        toast('El enlace del logo no permite mostrarse. Usa una imagen directa o súbela desde el panel privado.');
      }
    };
    img.src = src;
  }

  function applyConfig(){
    const c = state.cfg;
    document.documentElement.style.setProperty('--accent', c.accent || DEFAULTS.accent);
    $('brandName').textContent = c.name;
    setLogo($('brandLogo'), c.logo);
    setLogo($('coverImage'), c.logo);
    setLogo($('tvLogo'), c.logo);
    $('tvPosterName').textContent = c.name + ' TV';
    $('heroTitle').textContent = c.hero;
    $('heroSubtitle').textContent = c.subtitle;
    $('trackTitle').textContent = c.track;
    $('trackArtist').textContent = c.name;
    $('tvChannelTitle').textContent = c.channel;
    $('audioEl').src = c.audio || '';
  }

  function toast(msg){
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2500);
  }

  function showView(view){
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    $('radioView').classList.toggle('hidden', view !== 'radio');
    $('tvView').classList.toggle('hidden', view !== 'tv');
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  const audio = $('audioEl');
  audio.volume = .8;
  $('audioVolume').addEventListener('input', e => audio.volume = Number(e.target.value));

  function setAudioState(playing){
    $('audioPlay').querySelector('span').textContent = playing ? '❚❚' : '▶';
    $('radioView').classList.toggle('playing', playing);
  }

  $('audioPlay').addEventListener('click', async () => {
    if (!state.cfg.audio) {
      toast('La señal de radio todavía no está configurada.');
      return;
    }
    try {
      if (audio.paused) {
        await audio.play();
        setAudioState(true);
      } else {
        audio.pause();
        setAudioState(false);
      }
    } catch {
      toast('No se pudo iniciar el audio. Revisa la señal.');
    }
  });

  audio.addEventListener('playing', () => setAudioState(true));
  audio.addEventListener('pause', () => setAudioState(false));
  audio.addEventListener('error', () => {
    if (state.cfg.audio) toast('La señal de audio no pudo cargarse.');
  });

  const video = $('videoEl');

  function destroyHls(){
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
    video.removeAttribute('src');
    video.load();
  }

  function loadVideo(autoPlay=false){
    destroyHls();
    const url = state.cfg.video;
    if (!url) {
      toast('El canal de TV todavía no está configurado.');
      return;
    }

    $('tvPoster').classList.add('hidden');
    $('tvStatus').textContent = 'CARGANDO';

    if (/\.m3u8($|\?)/i.test(url) && window.Hls && window.Hls.isSupported()) {
      state.hls = new window.Hls({ enableWorker:true, lowLatencyMode:true });
      state.hls.loadSource(url);
      state.hls.attachMedia(video);
      state.hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        $('tvStatus').textContent = 'EN VIVO';
        if (autoPlay) video.play().catch(()=>{});
      });
      state.hls.on(window.Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          $('tvStatus').textContent = 'ERROR';
          toast('No se pudo cargar la señal de TV.');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && /\.m3u8($|\?)/i.test(url)) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        $('tvStatus').textContent = 'EN VIVO';
        if (autoPlay) video.play().catch(()=>{});
      }, { once:true });
    } else {
      video.src = url;
      video.addEventListener('loadeddata', () => {
        $('tvStatus').textContent = 'EN VIVO';
        if (autoPlay) video.play().catch(()=>{});
      }, { once:true });
    }
  }

  $('tvPlayBig').addEventListener('click', () => loadVideo(true));
  $('tvReload').addEventListener('click', () => loadVideo(true));
  $('tvMute').addEventListener('click', () => {
    video.muted = !video.muted;
    $('tvMute').textContent = video.muted ? '🔇 Silencio' : '🔊 Audio';
  });

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.deferredPrompt = e;
    $('installBtn').classList.remove('hidden');
  });

  $('installBtn').addEventListener('click', async () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    $('installBtn').classList.add('hidden');
  });

  window.addEventListener('storage', e => {
    if (e.key === 'fgUltraConfig') {
      state.cfg = loadConfig();
      state.logoErrorShown = false;
      applyConfig();
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
  }

  applyConfig();
  showView('radio');
})();