import {parseLua} from "./lua.js";
let R;
export async function loadRules(){R=parseLua(await (await fetch("lua/rules.lua")).text());return R;}
export const rules=()=>R;
// Prompt corto: lo esencial va en lua/rules.lua (core). Menos texto = respuestas más rápidas y menos confusión.
export function systemPrompt(facts,extra="",model=""){
 return "Eres "+R.name+(model?" ("+model+")":"")+", asistente de programación (HTML, CSS, JavaScript, Lua/Luau y Roblox). "+R.identity+"\n"+R.core+
 (facts.length?"\nLo que el usuario te pidió recordar: "+facts.join("; "):"")+
 (extra?"\nREFERENCIA (úsala solo si es relevante; no la copies textual):"+extra:"");
}
export const attachment=t=>new RegExp(R.attachment,"i").test(t);
export const crisis=t=>new RegExp(R.crisis,"i").test(t);
