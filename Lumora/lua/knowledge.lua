-- Base de conocimiento de Lumora AI. Cada entrada se inyecta en el prompt SOLO cuando la pregunta, ojo eh
return {
  {
    id = "luau-base",
    tags = "roblox|luau|lua|script|funcion|funciones|variable|variables|bucle|bucles|tabla|tablas|local|codigo|sintaxis|error",
    text = 'SINTAXIS LUAU (Roblox):
- Variables: local x = 5. Sin ; ni llaves: los bloques terminan con end.
- Condicional: if a == b then ... elseif a ~= c then ... else ... end  (distinto es ~=; se usa and, or, not)
- Bucles: for i = 1, 10 do ... end | for _, v in ipairs(lista) do ... end | for k, v in pairs(tabla) do ... end | while cond do ... end (existen break y continue)
- Funciones: local function saluda(nombre) return "Hola " .. nombre end   (.. une textos)
- Tablas: local t = {1, 2, 3}; indices desde 1; #t es el tamano; table.insert(t, 4); diccionario: {vida = 100}
- Usa task.wait(1), task.spawn(f), task.delay(2, f). NUNCA wait() ni spawn() (obsoletos).
- Comentarios con --   Depurar con print() y warn().'
  },
  {
    id = "roblox-scripts",
    tags = "script|localscript|modulescript|servidor|cliente|server|client|donde|lugar|require|modulo|roblox|studio|servicio|servicios",
    text = 'TIPOS DE SCRIPT Y DONDE VAN:
- Script (servidor): ServerScriptService o dentro de una Part. Logica segura: dano, dinero, DataStore.
- LocalScript (cliente): StarterPlayerScripts, StarterGui o StarterCharacterScripts. Teclado, camara, interfaz.
- ModuleScript: local M = {} ... return M, y se usa con local M = require(ruta).
- Servicios: local Players = game:GetService("Players"); tambien ReplicatedStorage, ServerStorage, Workspace, RunService, TweenService, UserInputService (solo cliente), DataStoreService (solo servidor).
- Crear objetos: local p = Instance.new("Part"); p.Anchored = true; p.Parent = workspace (asigna Parent al final).'
  },
  {
    id = "roblox-eventos",
    tags = "evento|eventos|touched|toca|tocar|jugador|jugadores|player|players|humanoid|vida|salud|dano|cura|curar|muerte|personaje|character|click|clic|proximity|prompt|pieza|part",
    text = 'EVENTOS COMUNES:
local Players = game:GetService("Players")
Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    local hum = char:WaitForChild("Humanoid")
    hum.Died:Connect(function() print(player.Name .. " murio") end)
  end)
end)
-- Touched en una Part:
script.Parent.Touched:Connect(function(hit)
  local hum = hit.Parent:FindFirstChildOfClass("Humanoid")
  if hum then hum:TakeDamage(10) end  -- curar del todo: hum.Health = hum.MaxHealth
end)
-- Jugador desde un personaje: Players:GetPlayerFromCharacter(hit.Parent)
-- ClickDetector.MouseClick:Connect(function(player) ... end)'
  },
  {
    id = "roblox-remote",
    tags = "remote|remoteevent|remotefunction|fireserver|fireclient|comunicar|boton|compra|comprar|tienda|dinero|monedas|servidor|cliente",
    text = 'CLIENTE Y SERVIDOR (RemoteEvent en ReplicatedStorage):
-- Servidor (Script):
local ev = game.ReplicatedStorage:WaitForChild("Compra")
ev.OnServerEvent:Connect(function(player, item)
  if type(item) ~= "string" then return end  -- SIEMPRE validar lo que manda el cliente
  -- comprobar monedas y entregar el objeto aqui
end)
-- Cliente (LocalScript): ev:FireServer("Espada")
-- Servidor a cliente: ev:FireClient(player, datos) / ev:FireAllClients(datos)
Nunca confies en el cliente: dinero, dano y teletransportes se calculan en el servidor.'
  },
  {
    id = "roblox-datos",
    tags = "leaderstats|datastore|guardar|guardado|datos|puntos|monedas|dinero|nivel|ranking|marcador|progreso|coins",
    text = 'LEADERSTATS Y GUARDADO:
local Players = game:GetService("Players")
local store = game:GetService("DataStoreService"):GetDataStore("Datos1")
Players.PlayerAdded:Connect(function(player)
  local ls = Instance.new("Folder"); ls.Name = "leaderstats"; ls.Parent = player
  local coins = Instance.new("IntValue"); coins.Name = "Coins"; coins.Parent = ls
  local ok, val = pcall(function() return store:GetAsync(player.UserId) end)
  if ok and val then coins.Value = val end
end)
Players.PlayerRemoving:Connect(function(player)
  pcall(function() store:SetAsync(player.UserId, player.leaderstats.Coins.Value) end)
end)
-- Usa siempre pcall con DataStore y activa Enable Studio Access to API Services para probar.'
  },
  {
    id = "roblox-tween",
    tags = "tween|animar|animacion|mover|puerta|suave|girar|rotar|transparencia|efecto|ascensor",
    text = 'ANIMAR CON TWEEN:
local TS = game:GetService("TweenService")
local info = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local tw = TS:Create(parte, info, {Position = Vector3.new(0, 10, 0), Transparency = 0.5})
tw:Play()  -- tw.Completed:Wait() espera a que termine
-- Rotar: {CFrame = parte.CFrame * CFrame.Angles(0, math.rad(90), 0)}'
  },
  {
    id = "roblox-gui",
    tags = "gui|interfaz|boton|textlabel|textbutton|screengui|ui|menu|pantalla|texto|frame|hud",
    text = 'INTERFAZ (LocalScript en StarterGui):
local gui = Instance.new("ScreenGui")
gui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")
local btn = Instance.new("TextButton")
btn.Size = UDim2.new(0, 200, 0, 50)
btn.Position = UDim2.new(0.5, -100, 0.8, 0)
btn.Text = "Jugar"
btn.BackgroundColor3 = Color3.fromRGB(80, 120, 255)
btn.Parent = gui
btn.MouseButton1Click:Connect(function() print("clic") end)
-- UDim2.new(escalaX, pixelesX, escalaY, pixelesY)'
  },
  {
    id = "roblox-seguridad",
    tags = "cheat|cheats|exploit|exploits|parchear|anticheat|seguridad|speed|velocidad|fly|volar|aimbot|hacker|trampa|trampas",
    text = 'PARCHEAR EXPLOITS (todo en el servidor):
- Velocidad/vuelo: cada 0.5 s compara la posicion con la anterior; si la distancia supera MaxVel * dt * 1.5, devuelve al jugador con char:PivotTo(ultimaPosicionSegura).
- Remotes: valida tipos, rangos y distancia (if (hrp.Position - objetivo.Position).Magnitude > 15 then return end) y pon un cooldown por jugador.
- Dano, dinero y objetos solo se cambian en el servidor; el cliente solo pide.
- parte:SetNetworkOwner(nil) en objetos importantes para que el cliente no los controle.
- Registra intentos raros con warn() y expulsa con player:Kick("Motivo") tras varias faltas.'
  },

  -- ===================== HTML =====================
  {
    id = "html-estructura",
    tags = "html|estructura|documento|doctype|head|body|meta|titulo|title|semantico|etiqueta|etiquetas|tag|tags|pagina|sitio",
    text = 'ESTRUCTURA HTML5 BASICA:
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Titulo de la pagina</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
  <script src="js/app.js" type="module"></script>
</body>
</html>
Etiquetas semanticas: header, nav, main, section, article, aside, footer, figure, figcaption.
Evita divs innecesarios. Usa <button> para acciones y <a href> solo para navegacion.
Imagenes: <img src="..." alt="descripcion realista" width height loading="lazy">.
Formularios: label + input (type, name, required, autocomplete). Nunca uses placeholder como unica etiqueta.'
  },
  {
    id = "html-formularios",
    tags = "formulario|form|input|label|select|textarea|checkbox|radio|submit|validacion|required|email|password|button",
    text = 'FORMULARIOS HTML:
<form action="#" method="post" novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required autocomplete="email">
  <label for="pass">Contrasena</label>
  <input id="pass" name="password" type="password" required minlength="8" autocomplete="current-password">
  <button type="submit">Enviar</button>
</form>
Tipos utiles: text, email, password, number, tel, url, date, search, file, checkbox, radio, range, color.
Siempre asocia <label for="id"> con el input. Usa fieldset + legend para grupos.
Validacion nativa: required, min, max, minlength, maxlength, pattern, type.
Para mensajes personalizados usa setCustomValidity() en JS o Constraint Validation API.'
  },
  {
    id = "html-accesibilidad",
    tags = "accesibilidad|a11y|aria|alt|focus|teclado|screen|reader|semantico|rol|role|landmark",
    text = 'ACCESIBILIDAD WEB:
- Usa HTML semantico real (nav, main, button, h1-h6 en orden).
- Todo elemento interactivo debe ser focusable y operable con teclado (Tab, Enter, Espacio).
- Imagenes informativas tienen alt descriptivo; decorativas: alt="".
- Contraste minimo 4.5:1 para texto normal (WCAG AA).
- aria-label o aria-labelledby cuando el texto visible no basta.
- aria-expanded, aria-controls, aria-hidden para componentes dinamicos.
- No dependas solo del color para transmitir informacion.
- Evita outline:none sin un estilo de foco visible propio (:focus-visible).'
  },

  -- ===================== CSS =====================
  {
    id = "css-basico",
    tags = "css|estilo|estilos|selector|propiedades|caja|box|margin|padding|border|color|fondo|background|tipografia|fuente|font",
    text = 'CSS FUNDAMENTAL:
/* Variables */
:root{--bg:#0d0d0e;--text:#f2f2f2;--accent:#00e676;--radius:12px}
/* Reset minimo */
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.5}
/* Unidades */
rem = relativo al root (1rem suele ser 16px). em = relativo al padre.
vw/vh = % del viewport. clamp(min, preferido, max) para tipografia fluida.
/* Cascada */
Especificidad: inline > id > class/atributo > elemento. !important solo en casos extremos.
/* Fondo y texto */
background: linear-gradient(180deg,#1a1a1c,#121213);
color: #f2f2f2; font-size: clamp(1rem, 2.5vw, 1.25rem);'
  },
  {
    id = "css-flexbox",
    tags = "flex|flexbox|display|flex|align|justify|gap|centrar|fila|columna|layout|diseno",
    text = 'FLEXBOX (layout en una dimension):
.container{
  display:flex;
  flex-direction:row; /* o column */
  justify-content:center; /* eje principal: flex-start|end|center|space-between|space-around */
  align-items:center; /* eje cruzado */
  gap:1rem;
  flex-wrap:wrap;
}
.item{flex:1 1 200px} /* grow shrink basis */
.item{margin-left:auto} /* empuja al final */
/* Centrar perfecto */
.center{display:flex;align-items:center;justify-content:center;min-height:100vh}
/* Nav horizontal */
nav{display:flex;align-items:center;gap:1.5rem}
nav .logo{margin-right:auto}'
  },
  {
    id = "css-grid",
    tags = "grid|cssgrid|columnas|filas|template|areas|layout|galeria|tarjetas|cards|responsive",
    text = 'CSS GRID (layout en dos dimensiones):
.grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
  gap:1.5rem;
}
/* Columnas fijas + flexible */
.layout{display:grid;grid-template-columns:280px 1fr;min-height:100vh}
/* Areas con nombre */
.page{
  display:grid;
  grid-template:
    "header header" auto
    "side main" 1fr
    "footer footer" auto / 240px 1fr;
}
.header{grid-area:header}
/* Alineacion */
place-items:center; /* alineacion de items dentro de celdas */
justify-items / align-items / place-content'
  },
  {
    id = "css-responsive",
    tags = "responsive|media|query|mobile|movil|breakpoint|viewport|adaptativo|tablet",
    text = 'DISENO RESPONSIVE:
/* Mobile first */
.container{padding:1rem;max-width:1100px;margin:0 auto}
@media (min-width:640px){.container{padding:1.5rem}}
@media (min-width:900px){.container{padding:2rem}}
/* Tipografia fluida */
h1{font-size:clamp(1.8rem,5vw,3.2rem)}
/* Imagenes fluidas */
img{max-width:100%;height:auto;display:block}
/* Ocultar en movil */
@media (max-width:700px){.solo-desktop{display:none}}
/* Preferencias del usuario */
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (prefers-color-scheme:dark){:root{--bg:#0d0d0e}}
Siempre incluye <meta name="viewport" content="width=device-width, initial-scale=1">.'
  },
  {
    id = "css-animaciones",
    tags = "animacion|animaciones|transition|keyframes|hover|transform|opacidad|efecto|movimiento|suave",
    text = 'TRANSICIONES Y ANIMACIONES:
/* Transicion simple */
.btn{transition:transform .2s ease,border-color .2s,color .2s}
.btn:hover{transform:translateY(-2px);border-color:#5c5c62}
/* Keyframes */
@keyframes rise{
  from{opacity:0;transform:translateY(12px)}
  to{opacity:1;transform:none}
}
.card{animation:rise .6s ease both}
/* Stagger con delay */
.card:nth-child(2){animation-delay:.08s}
.card:nth-child(3){animation-delay:.16s}
/* Transformaciones utiles */
transform: translateY(-4px) scale(1.02) rotate(-1deg);
/* Respetar reduced-motion */
@media (prefers-reduced-motion:reduce){
  *{animation-duration:.01ms!important;transition-duration:.01ms!important}
}'
  },
  {
    id = "css-moderno",
    tags = "moderno|glass|vidrio|backdrop|degradado|gradient|sombra|shadow|variables|custom|propiedades|clamp|aspect",
    text = 'TECNICAS CSS MODERNAS:
/* Glassmorphism */
.glass{
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.12);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border-radius:16px;
}
/* Gradiente de texto */
.grad{
  background:linear-gradient(90deg,#00e676,#7dffb8);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}
/* Sombra suave */
.card{box-shadow:0 8px 32px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05)}
/* Aspect ratio */
.video{aspect-ratio:16/9;object-fit:cover}
/* Scroll suave */
html{scroll-behavior:smooth}
/* Seleccion de texto */
::selection{background:rgba(0,230,118,.25);color:#fff}'
  },

  -- ===================== JAVASCRIPT =====================
  {
    id = "js-basico",
    tags = "javascript|js|variable|const|let|var|funcion|arrow|tipo|tipos|array|objeto|string|number|boolean|null|undefined",
    text = 'JAVASCRIPT BASICO (ES6+):
// Declaracion
const PI = 3.1416;          // no se reasigna
let contador = 0;           // se puede reasignar
// Tipos: number, string, boolean, null, undefined, object, symbol, bigint
// Arrays
const nums = [1,2,3];
nums.push(4); nums.map(n => n*2); nums.filter(n => n>2); nums.find(n => n===3);
nums.includes(2); nums.reduce((a,b)=>a+b,0);
// Objetos
const user = {name:"Ana", age:28};
const {name, age} = user;   // desestructuracion
const copia = {...user, age:29};
// Funciones
function suma(a,b){return a+b}
const suma2 = (a,b) => a+b;
// Template strings
const msg = `Hola ${name}, tienes ${age} anos`;
// Optional chaining y nullish
user?.address?.city;  valor ?? "default";'
  },
  {
    id = "js-dom",
    tags = "dom|document|queryselector|getelement|crear|elemento|classlist|atributo|innerhtml|textcontent|append|event|evento|click|listener",
    text = 'MANIPULACION DEL DOM:
// Seleccion
const el = document.querySelector(".btn");
const todos = document.querySelectorAll(".card");
// Crear e insertar
const div = document.createElement("div");
div.className = "card";
div.textContent = "Hola";          // seguro (no interpreta HTML)
div.innerHTML = "<b>Hola</b>";     // solo si confias en el contenido
padre.appendChild(div);
// Clases y atributos
el.classList.add("on"); el.classList.toggle("open"); el.classList.contains("active");
el.setAttribute("aria-expanded","true"); el.dataset.id = "123";
// Eventos
el.addEventListener("click", e => {
  e.preventDefault();
  console.log(e.target, e.currentTarget);
});
// Delegacion (eficiente en listas)
lista.addEventListener("click", e => {
  const item = e.target.closest(".item");
  if(!item) return;
  // manejar item
});'
  },
  {
    id = "js-eventos",
    tags = "evento|eventos|click|input|keydown|submit|change|focus|blur|scroll|resize|preventdefault|stoppropagation",
    text = 'EVENTOS COMUNES:
button.addEventListener("click", () => {});
input.addEventListener("input", e => { /* cada tecla */ });
input.addEventListener("change", e => { /* al perder foco o Enter en algunos */ });
form.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(form);
  const obj = Object.fromEntries(data);
});
document.addEventListener("keydown", e => {
  if(e.key === "Escape") cerrar();
  if(e.key === "Enter" && !e.shiftKey) enviar();
});
window.addEventListener("resize", debounce(ajustar, 150));
// Debounce util
function debounce(fn, ms){
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}'
  },
  {
    id = "js-asincrono",
    tags = "async|await|promise|fetch|api|json|then|catch|try|asincrono|peticion|request|http|get|post",
    text = 'ASINCRONIA Y FETCH:
// Promise basica
fetch("/api/datos")
  .then(r => { if(!r.ok) throw new Error(r.status); return r.json(); })
  .then(data => console.log(data))
  .catch(err => console.error(err));

// async/await (preferido)
async function cargar(){
  try{
    const r = await fetch("/api/datos", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({nombre:"Ana"})
    });
    if(!r.ok) throw new Error("Error " + r.status);
    const data = await r.json();
    return data;
  }catch(e){
    console.error(e.message);
  }
}
// AbortController para cancelar
const ctrl = new AbortController();
fetch(url, {signal: ctrl.signal});
ctrl.abort();'
  },
  {
    id = "js-modulos",
    tags = "modulo|modulos|import|export|module|esmodule|type|module|bundle",
    text = 'MODULOS ES (type="module"):
// utils.js
export function suma(a,b){return a+b}
export const PI = 3.14;
export default class Persona{...}

// app.js
import Persona, {suma, PI} from "./utils.js";
import * as utils from "./utils.js";

// En HTML:
<script type="module" src="js/app.js"></script>
// Las rutas son relativas al archivo actual. Los modulos se cargan en modo strict y difieren el parseo.
// top-level await esta permitido en modulos.
// Para navegadores antiguos se necesita un bundler (Vite, esbuild, Rollup).'
  },
  {
    id = "js-almacenamiento",
    tags = "localstorage|sessionstorage|storage|guardar|persistir|json|cookie|cookies|indexeddb",
    text = 'ALMACENAMIENTO EN EL CLIENTE:
// localStorage (persiste entre sesiones, mismo origen)
localStorage.setItem("tema", "dark");
const tema = localStorage.getItem("tema"); // "dark" o null
localStorage.removeItem("tema");
localStorage.clear();

// Guardar objetos
localStorage.setItem("user", JSON.stringify({name:"Ana", age:28}));
const user = JSON.parse(localStorage.getItem("user") || "null");

// sessionStorage: igual API, se borra al cerrar la pestana.
// Cookies: document.cookie = "token=abc; path=/; max-age=3600; Secure; SameSite=Strict";
// Para datos grandes o estructurados usa IndexedDB (mas complejo).
// Nunca guardes secretos o tokens sensibles solo en localStorage sin proteccion adicional.'
  },
  {
    id = "js-patrones",
    tags = "patron|patrones|clase|class|prototype|closure|debounce|throttle|observer|singleton|factory",
    text = 'PATRONES UTILES EN JS:
// Clase moderna
class Contador{
  #valor = 0;               // privado
  constructor(inicio=0){this.#valor=inicio}
  get valor(){return this.#valor}
  incrementar(){this.#valor++}
}

// Closure (estado privado)
function crearContador(){
  let n = 0;
  return {inc(){n++}, get(){return n}};
}

// Observer simple
const bus = {
  events: {},
  on(e,fn){(this.events[e]||=[]).push(fn)},
  emit(e,...a){(this.events[e]||[]).forEach(fn=>fn(...a))}
};

// Throttle
function throttle(fn, ms){
  let last=0; return (...a)=>{const now=Date.now(); if(now-last>=ms){last=now;fn(...a)}}
}'
  },
  {
    id = "js-errores",
    tags = "error|errores|try|catch|throw|debug|console|stack|handling|manejar",
    text = 'MANEJO DE ERRORES:
try{
  const data = JSON.parse(texto);
  if(!data.id) throw new Error("Falta id");
}catch(e){
  console.error("Fallo:", e.message);
  // mostrar mensaje al usuario
}finally{
  // limpieza siempre
}

// Errores personalizados
class ValidacionError extends Error{
  constructor(msg){super(msg); this.name="ValidacionError"}
}

// En promesas
promise.catch(e => mostrarError(e.message));

// Buenas practicas:
- Nunca dejes catch vacio.
- Distingue errores esperados (validacion) de inesperados (bugs).
- En produccion registra errores (Sentry, etc.) pero no expongas stacks al usuario.'
  },

  -- ===================== WEB PRACTICO =====================
  {
    id = "web-diseno",
    tags = "web|pagina|sitio|landing|html|css|diseno|portafolio|portfolio|tienda|blog|innovar|moderno|bonito|bonita|creativo|original",
    text = 'DISENO WEB MODERNO (sigue esto, no hagas una plantilla generica):
1. Elige un concepto y una paleta de 4-5 colores en variables CSS (:root{--bg:..;--accent:..}). Evita el blanco y gris por defecto.
2. Dos tipografias de Google Fonts (titulos y texto). No uses Arial.
3. Hero grande con titulo potente, subtitulo y boton; luego secciones en grid (grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem).
4. Detalles: degradados, tarjetas con borde sutil y sombra, hover con transition, texto con clamp() (font-size:clamp(2rem,6vw,4rem)).
5. Movimiento sutil con @keyframes y desactivalo con @media (prefers-reduced-motion:reduce).
6. Responsive: meta viewport, mobile first, contenedores con max-width.
7. Contenido realista (nada de Lorem ipsum) y una idea original en el layout: seccion diagonal, brillo que sigue al cursor, tarjetas que se inclinan.'
  },
  {
    id = "web-fragmentos",
    tags = "web|pagina|sitio|landing|html|css|animacion|tarjeta|tarjetas|boton|efecto|hover|vidrio|degradado|menu|navbar|portafolio",
    text = 'FRAGMENTOS UTILES:
.card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;backdrop-filter:blur(10px);transition:transform .25s,box-shadow .25s}
.card:hover{transform:translateY(-6px);box-shadow:0 12px 30px rgba(0,0,0,.35)}
.grad{background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;color:transparent}
nav{position:sticky;top:0;backdrop-filter:blur(8px);display:flex;justify-content:space-between;padding:1rem 2rem}
.reveal{opacity:0;transform:translateY(20px);transition:.6s}.reveal.in{opacity:1;transform:none}
JS: const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("in")));document.querySelectorAll(".reveal").forEach(el=>io.observe(el));'
  },
  {
    id = "web-spa",
    tags = "spa|router|routing|navegacion|hash|history|vista|vistas|pagina|single",
    text = 'NAVEGACION SIMPLE (SPA ligera sin framework):
// Hash routing
window.addEventListener("hashchange", render);
function render(){
  const ruta = location.hash.slice(1) || "inicio";
  document.querySelectorAll("[data-page]").forEach(p => {
    p.hidden = p.dataset.page !== ruta;
  });
  document.querySelectorAll("nav a").forEach(a => {
    a.classList.toggle("on", a.getAttribute("href") === "#" + ruta);
  });
}
render();

// History API
function navegar(path){
  history.pushState(null, "", path);
  render(path);
}
window.addEventListener("popstate", () => render(location.pathname));'
  },
  {
    id = "web-performance",
    tags = "rendimiento|performance|optimizar|lazy|defer|preload|imagen|bundle|carga|velocidad",
    text = 'RENDIMIENTO WEB BASICO:
- Imagenes: width/height reales, loading="lazy", formatos modernos (webp/avif) con <picture>.
- Scripts: type="module" o defer. Evita scripts bloqueantes en el <head>.
- CSS critico inline o preload; el resto async.
- Reduce repaints: evita layout thrashing (lee medidas, luego escribe estilos en bloque).
- requestAnimationFrame para animaciones JS.
- Debounce en scroll/resize/input pesados.
- Evita innerHTML en bucles grandes; usa DocumentFragment o templates.
- Mide con Lighthouse y las DevTools (Performance, Network, Coverage).'
  },
  {
    id = "web-pro-principios",
    tags = "profesional|pro|claude|premium|calidad|elegante|pulido|refinado|saas|startup|landing|producto|marca|brand",
    text = 'SITIOS WEB PROFESIONALES (calidad Claude / productos reales):
NUNCA hagas plantillas genericas con Inter + azul #3b82f6 + hero generico.
Principios:
1. Concepto claro: elige una idea visual fuerte (oscuro sofisticado, editorial, brutalista suave, glass + luz, monoacentico).
2. Tipografia: 2 fuentes max. Display con caracter (Outfit, Syne, Instrument Serif, Fraunces, Geist) + texto legible. Escala tipografica clara (clamp).
3. Espaciado generoso y consistente (sistema 4/8px). Mucho aire. No apretar.
4. Jerarquia: un solo foco por seccion. Titulos cortos y potentes.
5. Microinteracciones: hover sutiles, transiciones 150-250ms, focus visibles.
6. Color: paleta de 4-6 tonos en :root. Un acento fuerte, no muchos colores.
7. Contenido realista: textos creibles, no Lorem. CTAs concretos.
8. Detalles de calidad: bordes sutiles, sombras en capas, degradados controlados, estados vacios y loading.'
  },
  {
    id = "web-pro-layout",
    tags = "layout|estructura|seccion|secciones|hero|navbar|footer|grid|columnas|contenedor|max-width|padding",
    text = 'LAYOUT PROFESIONAL:
- Contenedor: max-width 1120-1280px; margin: 0 auto; padding lateral clamp(1.25rem, 4vw, 2rem).
- Hero: min-height 70-90vh, titulo grande (clamp 2.5rem-4.5rem), subtitulo 1.1-1.25rem muted, CTA principal + secundario.
- Secciones: padding vertical generoso (clamp(4rem, 10vw, 7rem)). Alterna fondos sutiles.
- Grid de features: repeat(auto-fit, minmax(260px, 1fr)); gap 1.25-1.75rem.
- Navbar: sticky, blur, altura 64-72px, logo izquierda, links centro o derecha, CTA a la derecha.
- Footer: columnas (producto, recursos, legal) + linea inferior con copyright.
- Mobile: una columna, CTA a ancho completo, menu hamburguesa limpio.'
  },
  {
    id = "web-pro-ui",
    tags = "boton|botones|card|tarjeta|input|formulario|badge|tag|sombra|borde|radio|radius|componente|ui|kit",
    text = 'COMPONENTES UI PRO:
Botones:
- Primario: fondo acento, texto contraste, border-radius 10-12px, padding 12px 20px, font-weight 500.
- Secundario: borde sutil + fondo transparente o panel.
- Hover: translateY(-1px) o brillo sutil; active: scale(0.98).
Cards:
- Fondo panel, borde 1px sutil, radius 14-16px, padding 1.25-1.5rem.
- Hover opcional: borde mas claro + sombra suave.
Inputs:
- Altura 44-48px, border sutil, focus ring con acento a baja opacidad.
- Labels siempre visibles (no solo placeholder).
Badges: pill pequeno, texto 12px, fondo acento al 15%.
Sombras: bordes + sombras muy suaves en capas. Evitar sombras negras duras.
Radius consistente (10 / 12 / 16).'
  },
  {
    id = "web-pro-estilo",
    tags = "oscuro|dark|light|tema|paleta|color|tipografia|fuente|font|degradado|gradient|glass|minimal|editorial",
    text = 'ESTILOS PREMIUM:
Dark tech: --bg:#09090b; --panel:#111113; --text:#fafafa; --muted:#a1a1aa; --border:#27272a; acento vivo pero no neon.
Light editorial: fondos off-white, texto casi negro, serif en titulos.
Glass: rgba + backdrop-filter blur(12px); borde rgba blanco bajo.
Tipografia: titulos con letter-spacing negativo (-0.02 a -0.04em), line-height 1.1-1.2; cuerpo 1.55-1.7 y max-width 65ch.
Nunca: Arial + azul bootstrap + 3 columnas identicas con iconos genericos.'
  },
  {
    id = "web-pro-motion",
    tags = "animacion|motion|hover|transicion|reveal|scroll|microinteraccion|keyframes|entrada",
    text = 'MOTION PROFESIONAL:
- Transiciones 150-250ms ease o cubic-bezier(.4,0,.2,1).
- Entrada: fade + translateY(8-16px), sin rebotes exagerados.
- Scroll reveal con IntersectionObserver y clase .in.
- Stagger 40-80ms entre items.
- Hover de cards: elevacion sutil o borde, no scale grande.
- Respetar prefers-reduced-motion.
- Preferir transform y opacity (no animar width/height).
- :focus-visible siempre visible.'
  },
  {
    id = "web-pro-codigo",
    tags = "html|css|estructura|semantico|accesible|limpio|mantenible|variables|organizacion|archivo",
    text = 'CODIGO WEB DE CALIDAD:
HTML semantico (header, main, section, nav, footer). Un h1. alt utiles. labels reales.
CSS: tokens en :root, mobile-first, clases legibles (.btn, .card), sin !important.
JS: modules, estados loading/error/vacio.
Entrega archivos completos listos para usar, diseno original, no esqueleto vacio.'
  },
  {
    id = "web-pro-anti",
    tags = "evitar|malo|generico|plantilla|template|bootstrap|basico|amateur|feo",
    text = 'EVITAR (amateur):
- Hero generico Welcome / Learn More.
- 3 features identicas con iconos genericos.
- Inter/Roboto/Arial sin personalidad.
- Solo azul #3b82f6 sin sistema de color.
- Sombras negras fuertes y radius inconsistente.
- Formularios sin labels.
- Lorem ipsum en entregas finales.
Aunque pida algo simple: buen espaciado, tipografia y jerarquia.'
  },
  {
    id = "github-uso",
    tags = "github|repo|repositorio|raw|archivo|codigo|ajeno|leer|analizar|revisar|pr|pull",
    text = 'GITHUB:
Si el usuario pasa un enlace de GitHub:
- Archivo: preferir URL raw.githubusercontent.com/user/repo/branch/ruta.
- Analiza, explica, mejora o reescribe.
- No redistribuyas proyectos con licencia restrictiva enteros.
- Si no tienes el contenido, pide URL raw o el codigo pegado.
Prioriza diseno original; no clones pixel-perfect de productos ajenos.'
  }
}
