(() => {
  const DEFAULTS = {
    brandName: "FG TV",
    logo: "icons/icon-512.png",
    heroBg: "icons/hero-demo.jpg",
    heroKicker: "TU SEÑAL EN VIVO",
    heroTitle: "Tu universo de música y TV",
    heroSubtitle: "Disfruta la mejor música y televisión en un solo lugar.",
    nowLabel: "AHORA SUENA",
    trackTitle: "FG Live",
    trackSubtitle: "La señal que te conecta",
    listenersText: "● En directo",
    radioTitle: "FG Radio",
    radioSubtitle: "Música, noticias y entretenimiento en vivo.",
    tvTitle: "FG TV en vivo",
    tvSubtitle: "Disfruta nuestra señal desde cualquier dispositivo.",
    tvInfoTitle: "Programación en directo",
    tvInfoText: "Tu contenido, siempre disponible.",
    radioUrl: "",
    tvUrl: "",
    accent: "#ff2f92",
    accent2: "#8f35ff",
    accent3: "#ff8a25",
    facebook: "",
    instagram: "",
    whatsapp: ""
  };

  const $ = id => document.getElementById(id);
  const state = { cfg: load(), hls: null, playing:false };

  function load(){
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("fgTvMobileConfig") || "{}") }; }
    catch { return { ...DEFAULTS }; }
  }

  function toast(msg){
    const t=$("toast");t.textContent=msg;t.classList.add("show");
    clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2300);
  }

  function normImage(v,fallback){
    const s=String(v||"").trim();
    if(!s) return fallback;
    if(/^(data:image\/|blob:|icons\/|\.\/|\.\.\/)/i.test(s)) return s;
    const gd=s.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if(gd) return `https://drive.google.com/uc?export=view&id=${gd[1]}`;
    const gh=s.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
    if(gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}/${gh[4]}`;
    return s;
  }

  function setImg(el,src,fallback){
    if(!el)return;
    el.onerror=()=>{el.onerror=null;el.src=fallback;};
    el.src=normImage(src,fallback);
  }

  function socialLink(url){ return url && /^https?:\/\//i.test(url) ? url : "#"; }

  function apply(){
    const c=state.cfg;
    document.documentElement.style.setProperty("--accent",c.accent);
    document.documentElement.style.setProperty("--accent2",c.accent2);
    document.documentElement.style.setProperty("--accent3",c.accent3);
    $("brandName").textContent=c.brandName;
    $("shareBrand").textContent=c.brandName;
    $("heroKicker").textContent=c.heroKicker;
    $("heroTitle").textContent=c.heroTitle;
    $("heroSubtitle").textContent=c.heroSubtitle;
    $("nowLabel").textContent=c.nowLabel;
    $("trackTitle").textContent=c.trackTitle;
    $("trackSubtitle").textContent=c.trackSubtitle;
    $("listenersText").textContent=c.listenersText;
    $("radioTitle").textContent=c.radioTitle;
    $("radioSubtitle").textContent=c.radioSubtitle;
    $("radioFocusTitle").textContent=c.trackTitle;
    $("radioFocusSubtitle").textContent=c.trackSubtitle;
    $("tvTitle").textContent=c.tvTitle;
    $("tvSubtitle").textContent=c.tvSubtitle;
    $("tvPosterName").textContent=c.brandName;
    $("tvInfoTitle").textContent=c.tvInfoTitle;
    $("tvInfoText").textContent=c.tvInfoText;
    setImg($("logoTop"),c.logo,"icons/icon-192.png");
    setImg($("coverImage"),c.logo,"icons/icon-512.png");
    setImg($("radioLogo"),c.logo,"icons/icon-512.png");
    setImg($("tvLogo"),c.logo,"icons/icon-512.png");
    setImg($("heroBg"),c.heroBg,"icons/hero-demo.jpg");
    $("audioEl").src=c.radioUrl||"";
    $("fbTop").href=socialLink(c.facebook);
    $("igTop").href=socialLink(c.instagram);
    $("fbShare").href=socialLink(c.facebook);
    $("igShare").href=socialLink(c.instagram);
    $("waShare").href=c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent("Mira "+c.brandName+": "+location.href)}` : "#";
  }

  function showView(name){
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
    const map={home:"homeView",tv:"tvView",radio:"radioView",favorites:"favoritesView"};
    $(map[name]||"homeView").classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
  document.querySelectorAll(".quick-card").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));

  const audio=$("audioEl");
  audio.volume=.85;
  $("audioVolume").addEventListener("input",e=>{
    audio.volume=Number(e.target.value);
    $("volumePercent").textContent=Math.round(audio.volume*100)+"%";
  });

  function audioUI(playing){
    state.playing=playing;
    $("audioPlay").querySelector("span").textContent=playing?"❚❚":"▶";
    $("radioPlay2").querySelector("span").textContent=playing?"❚❚":"▶";
    $("radioView").querySelector(".radio-focus").classList.toggle("playing",playing);
  }

  async function toggleAudio(){
    if(!state.cfg.radioUrl){toast("Configura primero la URL de radio en /admin.html");return;}
    try{
      if(audio.paused){await audio.play();audioUI(true);}
      else{audio.pause();audioUI(false);}
    }catch{toast("No se pudo iniciar la señal de radio.");}
  }

  $("audioPlay").addEventListener("click",toggleAudio);
  $("radioPlay2").addEventListener("click",toggleAudio);
  $("prevBtn").addEventListener("click",()=>toast("Control listo para futuras funciones."));
  $("nextBtn").addEventListener("click",()=>toast("Control listo para futuras funciones."));
  audio.addEventListener("playing",()=>audioUI(true));
  audio.addEventListener("pause",()=>audioUI(false));

  const video=$("videoEl");
  function destroyHls(){
    if(state.hls){state.hls.destroy();state.hls=null;}
    video.removeAttribute("src");video.load();
  }
  function playTv(){
    destroyHls();
    const url=state.cfg.tvUrl;
    if(!url){toast("Configura primero la URL de TV en /admin.html");return;}
    $("videoPoster").classList.add("hidden");
    if(/\.m3u8($|\?)/i.test(url) && window.Hls && Hls.isSupported()){
      state.hls=new Hls({enableWorker:true,lowLatencyMode:true});
      state.hls.loadSource(url);state.hls.attachMedia(video);
      state.hls.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));
      state.hls.on(Hls.Events.ERROR,(_e,d)=>{if(d.fatal)toast("No se pudo cargar la señal HLS.");});
    }else{
      video.src=url;video.play().catch(()=>{});
    }
  }
  $("tvPlay").addEventListener("click",playTv);
  $("tvReload").addEventListener("click",playTv);
  $("tvMute").addEventListener("click",()=>{
    video.muted=!video.muted;
    $("tvMute").textContent=video.muted?"🔇 Silencio":"🔊 Audio";
  });

  function openShare(){$("shareSheet").classList.remove("hidden");$("shareSheet").setAttribute("aria-hidden","false")}
  function closeShare(){$("shareSheet").classList.add("hidden");$("shareSheet").setAttribute("aria-hidden","true")}
  $("shareBtn").addEventListener("click",openShare);
  $("closeShare").addEventListener("click",closeShare);
  document.querySelector(".sheet-backdrop").addEventListener("click",closeShare);
  $("copyLink").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(location.href);toast("Enlace copiado.");}
    catch{toast("Copia esta dirección: "+location.href);}
  });

  window.addEventListener("storage",e=>{
    if(e.key==="fgTvMobileConfig"){state.cfg=load();apply();}
  });

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
  }

  apply();
  showView("home");
})();