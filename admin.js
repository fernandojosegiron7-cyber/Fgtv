(() => {
  const DEFAULTS = {
    brand:"FG TV",logo:"assets/logo-demo.png",heroImage:"assets/hero-demo.jpg",
    splashColor:"#fff200",splashSeconds:1.6,
    heroTitle:"Tu Universo\nde Música",
    heroSubtitle:"Descubre nuevos sonidos y disfruta nuestra señal en vivo.",
    trackTitle:"FG Live",trackArtist:"Transmisión en vivo",listenersLabel:"3 oyentes",
    stationLabel:"FG TV",radioUrl:"",tvUrl:"",
    tvTitle:"Televisión en vivo",tvKicker:"EN VIVO",tvHeadline:"Tu señal, donde estés",
    tvSubtitle:"Mira nuestra programación desde tu dispositivo.",tvChannel:"FG TV",
    facebook:"",instagram:"",whatsapp:"",
    pink:"#ff3e9d",pink2:"#ff5fb4",deep:"#230039",deep2:"#390054"
  };
  const fields=Object.keys(DEFAULTS),$=id=>document.getElementById(id);
  let cfg=load(),logoUpload="",heroUpload="";

  function load(){try{return{...DEFAULTS,...JSON.parse(localStorage.getItem("fgReferenceConfig")||"{}")}}catch{return{...DEFAULTS}}}
  function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200)}
  async function optimize(file,maxSide=1800,q=.9){
    if(!file||!file.type.startsWith("image/"))throw new Error("Selecciona una imagen válida.");
    if(file.size>30*1024*1024)throw new Error("La imagen supera 30 MB.");
    const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result||""));r.onerror=()=>rej(new Error("No se pudo leer"));r.readAsDataURL(file)});
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("No se pudo procesar"));i.src=data});
    const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
    const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const x=c.getContext("2d",{alpha:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";x.drawImage(img,0,0,c.width,c.height);
    let out=c.toDataURL("image/webp",q);if(!out.startsWith("data:image/webp"))out=c.toDataURL("image/jpeg",q);
    return out
  }
  function norm(v,fallback){
    const s=String(v||"").trim();if(!s)return fallback;
    if(/^(data:image\/|assets\/)/i.test(s))return s;
    const gd=s.match(/drive\.google\.com\/file\/d\/([^/]+)/i);if(gd)return`https://drive.google.com/uc?export=view&id=${gd[1]}`;
    const gh=s.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i);
    if(gh)return`https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}/${gh[4]}`;
    return s
  }
  function preview(el,src,fallback){el.onerror=()=>{el.onerror=null;el.src=fallback};el.src=norm(src,fallback)}
  function fill(){
    fields.forEach(k=>{if($(k))$(k).value=cfg[k]??""});
    preview($("logoPreview"),cfg.logo,"assets/logo-demo.png");
    preview($("heroPreview"),cfg.heroImage,"assets/hero-demo.jpg")
  }
  $("logoFile").addEventListener("change",async e=>{
    try{logoUpload=await optimize(e.target.files[0],1200,.92);$("logo").value="";preview($("logoPreview"),logoUpload,"assets/logo-demo.png");toast("Logo listo.")}
    catch(err){toast(err.message||"No se pudo procesar el logo.")}
  });
  $("heroFile").addEventListener("change",async e=>{
    try{heroUpload=await optimize(e.target.files[0],2200,.9);$("heroImage").value="";preview($("heroPreview"),heroUpload,"assets/hero-demo.jpg");toast("Fondo listo.")}
    catch(err){toast(err.message||"No se pudo procesar el fondo.")}
  });
  $("logo").addEventListener("input",()=>{if($("logo").value.length>8)preview($("logoPreview"),$("logo").value,"assets/logo-demo.png")});
  $("heroImage").addEventListener("input",()=>{if($("heroImage").value.length>8)preview($("heroPreview"),$("heroImage").value,"assets/hero-demo.jpg")});
  $("form").addEventListener("submit",e=>{
    e.preventDefault();
    const next={};
    fields.forEach(k=>{if($(k))next[k]=$(k).value});
    next.logo=logoUpload||$("logo").value.trim()||cfg.logo||DEFAULTS.logo;
    next.heroImage=heroUpload||$("heroImage").value.trim()||cfg.heroImage||DEFAULTS.heroImage;
    next.splashSeconds=Math.max(.2,Math.min(5,Number($("splashSeconds").value)||1.6));
    cfg={...DEFAULTS,...next};
    try{localStorage.setItem("fgReferenceConfig",JSON.stringify(cfg));logoUpload="";heroUpload="";toast("Cambios guardados.")}
    catch{toast("No se pudo guardar. Reduce un poco las imágenes.")}
  });
  $("reset").addEventListener("click",()=>{cfg={...DEFAULTS};logoUpload="";heroUpload="";localStorage.setItem("fgReferenceConfig",JSON.stringify(cfg));fill();toast("Demo restablecida.")});
  fill()
})();