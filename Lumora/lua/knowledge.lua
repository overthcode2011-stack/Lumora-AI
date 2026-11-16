import {parseLua} from "./lua.js";
let R;
export async function loadRules(){R=parseLua(await (await fetch("lua/rules.lua")).text());return R;}
export const rules=()=>R;
// Versión compacta: un prompt corto se procesa mucho más rápido en el navegador.
const head=t=>t.split(/[.:]\s/)[0].replace(/\s*$/,"");
export function systemPrompt(facts){
 return `Eres ${R.name}, asistente de programación y scripting. Responde en el idioma del usuario, claro y directo.
Reglas: ${R.limits.map(head).join("; ")}.
Permitido: ${R.allowed.map(head).join("; ")}.
Archivo completo: bloque con nombre, por ejemplo ```js:app.js. Fragmentos: ```lenguaje.
Si el usuario busca un vínculo afectivo, recházalo con amabilidad y vuelve a la tarea.${facts.length?"\nDatos aprendidos: "+facts.join("; "):""}`;
}
export const attachment=t=>new RegExp(R.attachment,"i").test(t);
export const crisis=t=>new RegExp(R.crisis,"i").test(t);