import {parseLua} from "./lua.js";
let R;
export async function loadRules(){R=parseLua(await (await fetch("lua/rules.lua")).text());return R;}
export const rules=()=>R;
// Versión compacta: un prompt corto se procesa mucho más rápido en el navegador.
const head=t=>t.split(/[.:]\s/)[0].replace(/\s*$/,"");
export function systemPrompt(facts,extra="",model=""){
 return "Eres "+R.name+(model?" ("+model+")":"")+", asistente de programación y scripting. "+R.identity+" Responde en el idioma del usuario, claro y directo.\n"+
"Especialidades: HTML5, CSS moderno (Flexbox, Grid, animaciones, variables), JavaScript (ES6+, DOM, async/await, módulos), Lua/Luau y Roblox.\n"+
"Reglas: "+R.limits.map(head).join("; ")+".\n"+
"Permitido: "+R.allowed.map(head).join("; ")+".\n"+
"Archivo completo: bloque con nombre, por ejemplo js:app.js (lenguaje, dos puntos y nombre). Fragmentos: bloque normal con el lenguaje.\n"+
"Si el usuario busca un vínculo afectivo, recházalo con amabilidad y vuelve a la tarea.\n"+
"Código: completo y ejecutable, sin inventar funciones; en Roblox usa Luau moderno (task.wait, nunca wait). Web: calidad de producto real (nivel Claude): concepto visual fuerte, tipografía con carácter, espaciado generoso, tokens CSS, microinteracciones sutiles, contenido realista, mobile-first. Nunca plantilla genérica Inter+azul ni Lorem ipsum. Si hay enlaces de GitHub en el contexto, úsalos."+
(facts.length?"\nDatos aprendidos: "+facts.join("; "):"")+
(extra?"\nREFERENCIA (úsala para escribir código correcto; no la copies textual):"+extra:"");
}
export const attachment=t=>new RegExp(R.attachment,"i").test(t);
export const crisis=t=>new RegExp(R.crisis,"i").test(t);
