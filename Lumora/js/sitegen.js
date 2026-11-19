// Generador de sitios web: el modelo escribe solo el contenido (JSON corto) y Lumora lo monta en una plantilla profesional.
const TH={
 noche:{bg:"#0d0d0e",bg2:"#161618",tx:"#f2f2f2",mu:"#8c8c90",ln:"#2e2e32",ac:"#9a9aff",ac2:"#d6d6ff"},
 bosque:{bg:"#0b0f0d",bg2:"#121a16",tx:"#eef6f1",mu:"#86968c",ln:"#24332b",ac:"#00e676",ac2:"#9dffcb"},
 violeta:{bg:"#0f0b14",bg2:"#18121f",tx:"#f3eefa",mu:"#9b8fae",ln:"#2d2339",ac:"#b388ff",ac2:"#e0ccff"},
 calido:{bg:"#120d0a",bg2:"#1c1510",tx:"#f8f1ea",mu:"#a39484",ln:"#35281d",ac:"#f58a1f",ac2:"#ffc58a"}
};
export const SITE_SCHEMA={type:"object",properties:{name:{type:"string"},tagline:{type:"string"},about:{type:"string"},theme:{type:"string",enum:["noche","bosque","violeta","calido"]},
 features:{type:"array",minItems:3,maxItems:3,items:{type:"object",properties:{title:{type:"string"},text:{type:"string"}},required:["title","text"]}},cta:{type:"string"}},
 required:["name","tagline","about","theme","features","cta"]};
export const isSiteRequest=q=>!/^[¿\s]*(c[oó]mo|qu[eé]|por qu[eé]|cu[aá]l)/i.test(q)&&/\b(crea|crear|haz|hazme|genera|generar|arma|dise[ñn]a|quiero|necesito)\b[^.\n]{0,45}\b(sitio web|sitio|p[aá]gina web|p[aá]gina|landing|web)\b/i.test(q);
export function siteTopic(q){
 const m=q.match(/\b(?:para|de|sobre)\s+(.{3,80})/i);
 const t=(m?m[1]:q.replace(/^.*?\b(sitio web|p[aá]gina web|landing|web|sitio|p[aá]gina)\b/i,"")).replace(/[.!?¿¡]+$/,"").trim();
 return t||"un negocio";
}
export const sitePrompt=t=>"Crea el contenido de un sitio web sobre: "+t+".\nCampos: name (marca corta, máx. 3 palabras), tagline (frase potente, máx. 8 palabras), about (2 frases concretas), theme (uno de: noche, bosque, violeta, calido), features (exactamente 3, cada una con title de 1 a 3 palabras y text de máx. 14 palabras), cta (texto del botón, máx. 3 palabras). Contenido creíble en español, sin Lorem ipsum.";
const E=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const clip=(s,n)=>String(s||"").trim().slice(0,n);
export function buildSite(d,topic){
 d=d||{};
 const t=TH[d.theme]||TH.noche,name=E(clip(d.name||topic||"Mi sitio",28)),cta=E(clip(d.cta||"Empezar",24));
 const tag=clip(d.tagline||"Hecho para destacar",70),words=tag.split(" "),last=words.pop(),h1=E(words.join(" "))+(words.length?" ":"")+"<span>"+E(last)+"</span>";
 const about=clip(d.about||"Creamos soluciones claras, rápidas y bonitas para quienes quieren hacer las cosas bien.",320);
 const feats=(Array.isArray(d.features)&&d.features.length?d.features:[{title:"Rápido",text:"Todo carga al instante y funciona en cualquier dispositivo."},{title:"Claro",text:"Un diseño limpio que va directo a lo importante."},{title:"Tuyo",text:"Personalizable en minutos, sin complicaciones."}]).slice(0,6)
  .map((f,i)=>`<article class="card"><i>0${i+1}</i><h3>${E(clip(f.title,28))}</h3><p>${E(clip(f.text,120))}</p></article>`).join("");
 const css=`:root{--bg:${t.bg};--bg2:${t.bg2};--tx:${t.tx};--mu:${t.mu};--ln:${t.ln};--ac:${t.ac};--ac2:${t.ac2}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--tx);font:17px/1.6 Outfit,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;z-index:-1;background:radial-gradient(ellipse 60% 45% at 50% 0,color-mix(in srgb,var(--ac) 18%,transparent),transparent 70%),radial-gradient(circle,rgba(255,255,255,.07) 1px,transparent 1.5px) 0 0/24px 24px}
a{color:inherit;text-decoration:none}.w{max-width:1080px;margin:0 auto;padding:0 22px}
nav{position:sticky;top:0;z-index:5;backdrop-filter:blur(14px);background:color-mix(in srgb,var(--bg) 72%,transparent);border-bottom:1px solid var(--ln)}
nav .w{display:flex;align-items:center;justify-content:space-between;height:64px}.logo{font-weight:700;font-size:22px;letter-spacing:-.03em}
nav ul{display:flex;gap:26px;list-style:none;margin:0;padding:0;color:var(--mu);font-size:15px}nav ul a:hover{color:var(--tx)}
.btn{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 26px;border-radius:12px;font-weight:600;border:1.5px solid var(--ac);color:var(--ac2);background:linear-gradient(180deg,color-mix(in srgb,var(--ac) 14%,var(--bg2)),var(--bg2));transition:transform .18s,box-shadow .18s}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px color-mix(in srgb,var(--ac) 30%,transparent)}.btn.s{height:40px;padding:0 18px;font-size:15px}
.hero{padding:clamp(64px,14vw,140px) 22px 72px;text-align:center}
.hero h1{font-size:clamp(40px,8vw,84px);line-height:1.02;letter-spacing:-.045em;margin:0 0 22px;font-weight:700}
.hero h1 span{background:linear-gradient(90deg,var(--ac),var(--ac2));-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p{color:var(--mu);font-size:clamp(17px,2.4vw,21px);max-width:640px;margin:0 auto 34px}
h2{font-size:clamp(28px,4.6vw,44px);letter-spacing:-.035em;margin:0 0 12px}.sec{padding:72px 22px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;margin-top:34px}
.card{padding:26px;border:1px solid var(--ln);border-radius:18px;background:linear-gradient(180deg,var(--bg2),color-mix(in srgb,var(--bg2) 60%,var(--bg)));transition:transform .2s,border-color .2s}
.card:hover{transform:translateY(-5px);border-color:var(--ac)}.card i{font-style:normal;font-size:13px;color:var(--ac);letter-spacing:.1em}
.card h3{margin:10px 0 8px;font-size:21px}.card p{margin:0;color:var(--mu)}
.about{max-width:760px}.about p{color:var(--mu);font-size:19px;margin:0}
.cta{margin:20px 22px 80px;padding:clamp(34px,6vw,64px);border:1px solid var(--ln);border-radius:24px;text-align:center;background:radial-gradient(ellipse at 50% 0,color-mix(in srgb,var(--ac) 22%,var(--bg2)),var(--bg2) 72%)}
.cta p{color:var(--mu);margin:0 0 26px}footer{border-top:1px solid var(--ln);padding:26px 22px;color:var(--mu);font-size:14px;text-align:center}
.rv{opacity:0;transform:translateY(22px);transition:opacity .7s,transform .7s}.rv.on{opacity:1;transform:none}
@media(max-width:640px){nav ul{display:none}}@media(prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto}.rv{opacity:1;transform:none}}`;
 return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
<nav><div class="w"><a class="logo" href="#top">${name}</a><ul><li><a href="#servicios">Servicios</a></li><li><a href="#nosotros">Nosotros</a></li><li><a href="#contacto">Contacto</a></li></ul><a class="btn s" href="#contacto">${cta}</a></div></nav>
<header class="hero" id="top"><h1>${h1}</h1><p>${E(about.split(/(?<=[.!?])\s/)[0])}</p><a class="btn" href="#contacto">${cta}</a></header>
<section class="sec w rv" id="servicios"><h2>Lo que ofrecemos</h2><div class="grid">${feats}</div></section>
<section class="sec w rv about" id="nosotros"><h2>Sobre nosotros</h2><p>${E(about)}</p></section>
<section class="rv" id="contacto"><div class="cta w"><h2>¿Listo para empezar?</h2><p>Escríbenos y lo ponemos en marcha.</p><a class="btn" href="mailto:hola@ejemplo.com">${cta}</a></div></section>
<footer>© ${new Date().getFullYear()} ${name} · Hecho con Lumora AI</footer>
<script>
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("on")),{threshold:.12});
document.querySelectorAll(".rv").forEach(el=>io.observe(el));
</script>
</body>
</html>`;
}
