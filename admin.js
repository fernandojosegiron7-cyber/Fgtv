(() => {
  const DEFAULTS = {
    brandName:"FG TV",logo:"icons/icon-512.png",heroBg:"icons/hero-demo.jpg",
    heroKicker:"TU SEÑAL EN VIVO",heroTitle:"Tu universo de música y TV",
    heroSubtitle:"Disfruta la mejor música y televisión en un solo lugar.",
    nowLabel:"AHORA SUENA",trackTitle:"FG Live",trackSubtitle:"La señal que te conecta",
    listenersText:"● En directo",radioTitle:"FG Radio",radioSubtitle:"Música, noticias y entretenimiento en vivo.",
    tvTitle:"FG TV en vivo",tvSubtitle:"Disfruta nuestra señal desde cualquier dispositivo.",
    tvInfoTitle:"Programación en directo",tvInfoText:"Tu contenido, siempre disponible.",
    radioUrl:"",tvUrl:"",accent:"#ff2f92",accent2:"#8f35ff",accent3:"#ff8a25",
    facebook:"",instagram:"",whatsapp:""
  };

  const ids=Object.keys(DEFAULTS);
  const $=id=>document.getElementById(id);
  let cfg=load(), logoUpload="", heroUpload="";

  function load(){try{return{...DEFAULTS,...JSON.parse(localStorage.getItem("fgTvMobileConfig")||"{}")}}catch{return{...DEFAULTS}}}
  function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200)}
  function normImage(v,fallback){
    const s=String(v||"").trim();if(!s)return fallback;
    if(/^(data:image\/|blob:|icons\/|\.\/|\.\.\/)/i.test(s))return s;
    const gd=s.match(/drive\.google\.com\/file\/d\/([^/]+)/i);if(gd)return`https://drive.google.com/uc?export=view&id=${gd[1]}`;
    const gh=s.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
    if(gh)return`https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}/${gh[4]}`;
    return s;
  }

  async function optimize(file,maxSide=1400,quality=.9){
    if(!file||!file.type.startsWith("image/"))throw new Error("Selecciona una imagen válida.");
    if(file.size>25*1024*1024)throw new Error("La imagen supera 25 MB.");
    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result||""));r.onerror=()=>rej(new Error("No se pudo leer"));r.readAsDataURL(file)});
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("No se pudo procesar"));i.src=data});
    const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
    const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const x=c.getContext("2d",{alpha:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";x.drawImage(img,0,0,c.width,c.height);
    let out=c.toDataURL("image/webp",quality);if(!out.startsWith("data:image/webp"))out=c.toDataURL("image/jpeg",quality);
    return out;
  }

  function setPreview(el,src,fallback){el.onerror=()=>{el.onerror=null;el.src=fallback};el.src=normImage(src,fallback)}
  function fill(){
    ids.forEach(id=>{if($(id))$(id).value=cfg[id]??""});
    setPreview($("logoPreview"),cfg.logo,"icons/icon-512.png");
    setPreview($("heroPreview"),cfg.heroBg,"icons/hero-demo.jpg");
  }

  $("logoFile").addEventListener("change",async e=>{
    try{logoUpload=await optimize(e.target.files[0],1000,.92);$("logo").value="";setPreview($("logoPreview"),logoUpload,"icons/icon-512.png");toast("Logo listo.");}
    catch(err){toast(err.message||"No se pudo procesar el logo.")}
  });
  $("heroFile").addEventListener("change",async e=>{
    try{heroUpload=await optimize(e.target.files[0],1800,.9);$("heroBg").value="";setPreview($("heroPreview"),heroUpload,"icons/hero-demo.jpg");toast("Fondo listo.");}
    catch(err){toast(err.message||"No se pudo procesar el fondo.")}
  });
  $("logo").addEventListener("input",()=>{if($("logo").value.length>8)setPreview($("logoPreview"),$("logo").value,"icons/icon-512.png")});
  $("heroBg").addEventListener("input",()=>{if($("heroBg").value.length>8)setPreview($("heroPreview"),$("heroBg").value,"icons/hero-demo.jpg")});

  $("form").addEventListener("submit",e=>{
    e.preventDefault();
    const next={};
    ids.forEach(id=>{if($(id))next[id]=$(id).value.trim ? $(id).value.trim() : $(id).value});
    next.logo=logoUpload||$("logo").value.trim()||cfg.logo||DEFAULTS.logo;
    next.heroBg=heroUpload||$("heroBg").value.trim()||cfg.heroBg||DEFAULTS.heroBg;
    cfg={...DEFAULTS,...next};
    try{localStorage.setItem("fgTvMobileConfig",JSON.stringify(cfg));logoUpload="";heroUpload="";toast("Todos los cambios fueron guardados.");}
    catch{toast("No se pudo guardar. Prueba con imágenes más pequeñas.");}
  });

  $("reset").addEventListener("click",()=>{cfg={...DEFAULTS};logoUpload="";heroUpload="";localStorage.setItem("fgTvMobileConfig",JSON.stringify(cfg));fill();toast("Demo restablecida.");});
  fill();
})();