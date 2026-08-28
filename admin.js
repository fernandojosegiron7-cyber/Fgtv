(() => {
  const DEFAULTS = {
    name:'FG Ultra Media',
    logo:'icons/icon-512.png',
    hero:'Una app que se ve brutal desde el primer segundo.',
    subtitle:'Diseño elegante, futurista y creado para disfrutar radio y televisión en una sola experiencia.',
    audio:'',
    track:'Programación en vivo',
    video:'',
    channel:'Canal principal',
    accent:'#8a5cff'
  };

  const $ = id => document.getElementById(id);
  let cfg = load();
  let uploadedLogo = '';

  function load(){
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('fgUltraConfig') || '{}') }; }
    catch { return { ...DEFAULTS }; }
  }

  function normalizeLogoUrl(value){
    const v = String(value || '').trim();
    if (!v) return DEFAULTS.logo;
    if (/^(data:image\/|blob:|\.{0,2}\/|icons\/)/i.test(v)) return v;

    const drive = v.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (drive) return `https://drive.google.com/uc?export=view&id=${drive[1]}`;

    const gh = v.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
    if (gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}/${gh[4]}`;

    if (/dropbox\.com/i.test(v)) {
      try {
        const u = new URL(v);
        u.searchParams.delete('dl');
        u.searchParams.set('raw','1');
        return u.toString();
      } catch {}
    }
    return v;
  }

  function toast(msg){
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2300);
  }

  function setPreview(value, label='Logo actual'){
    const img = $('logoPreview');
    const src = normalizeLogoUrl(value);
    $('previewStatus').textContent = 'Comprobando…';
    img.onerror = () => {
      img.onerror = null;
      img.src = DEFAULTS.logo;
      $('previewStatus').textContent = 'Ese enlace no se puede mostrar';
    };
    img.onload = () => {
      $('previewStatus').textContent = label;
    };
    img.src = src;
  }

  function fill(){
    $('setName').value = cfg.name;
    $('setLogo').value = cfg.logo.startsWith('http') ? cfg.logo : '';
    $('setHero').value = cfg.hero;
    $('setSubtitle').value = cfg.subtitle;
    $('setAudio').value = cfg.audio;
    $('setTrack').value = cfg.track;
    $('setVideo').value = cfg.video;
    $('setChannel').value = cfg.channel;
    $('setAccent').value = cfg.accent;
    setPreview(cfg.logo);
  }

  $('setLogo').addEventListener('input', () => {
    uploadedLogo = '';
    const value = $('setLogo').value.trim();
    if (value.length > 8) setPreview(value, 'Enlace listo');
  });

  $('logoFile').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Selecciona una imagen PNG, JPG o WEBP.');
      e.target.value = '';
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast('El logo pesa más de 1.5 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      uploadedLogo = String(reader.result || '');
      $('setLogo').value = '';
      setPreview(uploadedLogo, 'Imagen subida desde el dispositivo');
    };
    reader.readAsDataURL(file);
  });

  $('settingsForm').addEventListener('submit', e => {
    e.preventDefault();
    const typedLogo = $('setLogo').value.trim();
    const logoValue = uploadedLogo || typedLogo || cfg.logo || DEFAULTS.logo;

    cfg = {
      name:$('setName').value.trim() || DEFAULTS.name,
      logo:logoValue,
      hero:$('setHero').value.trim() || DEFAULTS.hero,
      subtitle:$('setSubtitle').value.trim() || DEFAULTS.subtitle,
      audio:$('setAudio').value.trim(),
      track:$('setTrack').value.trim() || DEFAULTS.track,
      video:$('setVideo').value.trim(),
      channel:$('setChannel').value.trim() || DEFAULTS.channel,
      accent:$('setAccent').value || DEFAULTS.accent
    };

    try {
      localStorage.setItem('fgUltraConfig', JSON.stringify(cfg));
      uploadedLogo = '';
      toast('Cambios guardados. Abre la aplicación para verlos.');
      setPreview(cfg.logo, 'Logo guardado');
    } catch {
      toast('No se pudo guardar. El logo puede ser demasiado pesado.');
    }
  });

  $('resetBtn').addEventListener('click', () => {
    cfg = { ...DEFAULTS };
    uploadedLogo = '';
    localStorage.setItem('fgUltraConfig', JSON.stringify(cfg));
    fill();
    toast('Configuración restablecida.');
  });

  fill();
})();