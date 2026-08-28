(() => {
  const DEFAULTS = {
    brand:"FG TV",
    logo:"assets/logo-demo.png",
    heroImage:"assets/hero-demo.jpg",
    splashColor:"#fff200",
    splashSeconds:1.6,
    heroTitle:"Tu Universo\nde Música",
    heroSubtitle:"Descubre nuevos sonidos y disfruta nuestra señal en vivo.",
    trackTitle:"FG Live",
    trackArtist:"Transmisión en vivo",
    listenersLabel:"3 oyentes",
    stationLabel:"FG TV",
    radioUrl:"",
    tvUrl:"",
    tvTitle:"Televisión en vivo",
    tvKicker:"EN VIVO",
    tvHeadline:"Tu señal, donde estés",
    tvSubtitle:"Mira nuestra programación desde tu dispositivo.",
    tvChannel:"FG TV",
    facebook:"",
    instagram:"",
    whatsapp:"",
    pink:"#ff3e9d",
    pink2:"#ff5fb4",
    deep:"#230039",
    deep2:"#390054"
  };

  const $ = id => document.getElementById(id);
  const state = { cfg:load(), hls:null };

  function load(){
    try{return {...DEFAULTS,...JSON.parse(localStorage.getItem("fgReferenceConfig")||"{}")}}
    catch{return {...DEFAULTS}}
  }
  function toast(msg){
    const t=$("toast");t.textContent=msg;t.classList.add("show");
    clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200)
  }
  function normalize(v,fallback){
    const s=String(v||"").trim();
    if(!s)return fallback;
    if(/^(data:image\/|assets\/|\.\/|\.\.\/)/i.test(s))return s;
    const gd=s.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if(gd)return`https://drive.google.com/uc?export=view&id=${gd[1]}`;
    const gh=s.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
    if(gh)return`https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}/${gh[4]}`;
    return s;
  }
  function setImg(el,src,fallback){
    el.onerror=()=>{el.onerror=null;el.src=fallback};
    el.src=normalize(src,fallback)
  }
  function social(url){return /^https?:\/\//i.test(String(url||""))?url:"#"}
  function apply(){
    const c=state.cfg;
    document.documentElement.style.setProperty("--pink",c.pink);
    document.documentElement.style.setProperty("--pink2",c.pink2);
    document.documentElement.style.setProperty("--deep",c.deep);
    document.documentElement.style.setProperty("--deep2",c.deep2);
    document.documentElement.style.setProperty("--splash",c.splashColor);

    $("topBrand").textContent=c.brand;
    $("shareBrand").textContent=c.brand;
    $("heroTitle").innerHTML=c.heroTitle.split("\n").map(x=>x.replace(/</g,"&lt;")).join("<br>");
    $("heroSubtitle").textContent=c.heroSubtitle;
    $("trackTitle").textContent=c.trackTitle;
    $("trackArtist").textContent=c.trackArtist;
    $("listenersLabel").textContent=c.listenersLabel;
    $("stationLabel").textContent=c.stationLabel;
    $("tvTitle").textContent=c.tvTitle;
    $("tvKicker").textContent=c.tvKicker;
    $("tvHeadline").textContent=c.tvHeadline;
    $("tvSubtitle").textContent=c.tvSubtitle;
    $("tvChannel").textContent=c.tvChannel;

    setImg($("splashLogo"),c.logo,"assets/logo-demo.png");
    setImg($("trackCover"),c.logo,"assets/logo-demo.png");
    setImg($("tvLogo"),c.logo,"assets/logo-demo.png");
    setImg($("heroImage"),c.heroImage,"assets/hero-demo.jpg");
    setImg($("tvHeroImage"),c.heroImage,"assets/hero-demo.jpg");

    $("audioEl").src=c.radioUrl||"";
    $("topFacebook").href=social(c.facebook);
    $("topInstagram").href=social(c.instagram);
    $("shareFacebook").href=social(c.facebook);
    $("shareInstagram").href=social(c.instagram);
    $("shareWhatsapp").href=c.whatsapp?`https://wa.me/${c.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent("Mira "+c.brand+": "+location.href)}`:"#";

    setTimeout(()=>$("splash").classList.add("hide"),Math.max(.2,Number(c.splashSeconds)||1.6)*1000);
  }

  const audio=$("audioEl");
  audio.volume=1;
  $("volume").addEventListener("input",e=>{
    audio.volume=Number(e.target.value);
    $("volumePct").textContent=Math.round(audio.volume*100)+"%"
  });
  function setPlay(playing){$("playBtn").querySelector("span").textContent=playing?"❚❚":"▶"}
  $("playBtn").addEventListener("click",async()=>{
    if(!state.cfg.radioUrl){toast("Configura la URL de radio en /admin.html");return}
    try{
      if(audio.paused){await audio.play();setPlay(true)}
      else{audio.pause();setPlay(false)}
    }catch{toast("No se pudo iniciar la señal de radio.")}
  });
  audio.addEventListener("playing",()=>setPlay(true));
  audio.addEventListener("pause",()=>setPlay(false));
  $("prevBtn").addEventListener("click",()=>toast("Control preparado."));
  $("nextBtn").addEventListener("click",()=>toast("Control preparado."));

  function showScreen(name){
    $("radioScreen").classList.toggle("active",name==="radio");
    $("tvScreen").classList.toggle("active",name==="tv");
    document.querySelectorAll(".mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.screen===name));
    window.scrollTo({top:0,behavior:"smooth"})
  }
  document.querySelectorAll(".mode-btn").forEach(b=>b.addEventListener("click",()=>showScreen(b.dataset.screen)));
  $("backToRadio").addEventListener("click",()=>showScreen("radio"));

  const video=$("videoEl");
  function destroyHls(){if(state.hls){state.hls.destroy();state.hls=null}video.removeAttribute("src");video.load()}
  function playTV(){
    destroyHls();
    const url=state.cfg.tvUrl;
    if(!url){toast("Configura la URL de TV en /admin.html");return}
    $("videoPoster").style.display="none";
    if(/\.m3u8($|\?)/i.test(url)&&window.Hls&&Hls.isSupported()){
      state.hls=new Hls({enableWorker:true,lowLatencyMode:true});
      state.hls.loadSource(url);state.hls.attachMedia(video);
      state.hls.on(Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>{}));
      state.hls.on(Hls.Events.ERROR,(_e,d)=>{if(d.fatal)toast("No se pudo cargar la señal HLS.")})
    }else{video.src=url;video.play().catch(()=>{})}
  }
  $("tvPlay").addEventListener("click",playTV);
  $("tvReload").addEventListener("click",playTV);
  $("tvMute").addEventListener("click",()=>{
    video.muted=!video.muted;
    $("tvMute").textContent=video.muted?"🔇 Silencio":"🔊 Audio"
  });

  $("shareOpen").addEventListener("click",()=>$("shareScreen").classList.add("open"));
  $("shareClose").addEventListener("click",()=>$("shareScreen").classList.remove("open"));
  $("copyLink").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(location.href);toast("Enlace copiado.")}
    catch{toast("Copia: "+location.href)}
  });

  window.addEventListener("storage",e=>{
    if(e.key==="fgReferenceConfig"){state.cfg=load();apply()}
  });

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))
  }

  apply();
  showScreen("radio");
})();