(() => {
  const DEFAULTS = {
    name:'FG Ultra Media',
    logo:'icons/icon-512.png',
    hero:'Radio y televisión en una experiencia moderna.',
    subtitle:'Disfruta audio y televisión en vivo desde una interfaz moderna, rápida y adaptable.',
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

  async function optimizeLogo(file){
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Selecciona una imagen PNG, JPG o WEBP.');
    }

    // Allow large source files; optimize in-browser before localStorage.
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('La imagen supera 20 MB. Usa una imagen un poco más liviana.');
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      image.src = dataUrl;
    });

    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0,0,width,height);
    ctx.drawImage(img,0,0,width,height);

    // WebP keeps transparency and is much smaller. Fall back to PNG if unsupported.
    let result = canvas.toDataURL('image/webp', 0.92);
    if (!result.startsWith('data:image/webp')) {
      result = canvas.toDataURL('image/png');
    }

    // If still very large, reduce dimensions further.
    if (result.length > 1_600_000) {
      const smaller = document.createElement('canvas');
      const ratio = Math.sqrt(1_300_000 / result.length);
      smaller.width = Math.max(1, Math.round(width * ratio));
      smaller.height = Math.max(1, Math.round(height * ratio));
      const sctx = smaller.getContext('2d', { alpha: true });
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(canvas,0,0,smaller.width,smaller.height);
      result = smaller.toDataURL('image/webp', 0.86);
      if (!result.startsWith('data:image/webp')) {
        result = smaller.toDataURL('image/png');
      }
    }

    return result;
  }

  $('logoFile').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    $('previewStatus').textContent = 'Optimizando imagen…';
    try {
      uploadedLogo = await optimizeLogo(file);
      $('setLogo').value = '';
      setPreview(uploadedLogo, 'Logo optimizado y listo');
      toast('Logo optimizado correctamente.');
    } catch (err) {
      toast(err && err.message ? err.message : 'No se pudo procesar el logo.');
      e.target.value = '';
      $('previewStatus').textContent = 'No se pudo procesar';
    }
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