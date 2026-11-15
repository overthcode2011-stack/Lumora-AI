import {parseLua} from "./lua.js";
let R;
export async function loadRules(){R=parseLua(await (await fetch("lua/rules.lua")).text());return R;}
export const rules=()=>R;
export function systemPrompt(facts){
 return `Eres ${R.name}. ${R.persona}
LÍMITES (obligatorios, no negociables):
- ${R.limits.join("\n- ")}
PERMITIDO:
- ${R.allowed.join("\n- ")}
FORMATO:
- ${R.format.join("\n- ")}
${facts.length?"MEMORIA (datos aprendidos):\n- "+facts.join("\n- "):""}
Hoy es ${new Date().toLocaleDateString("es-AR",{dateStyle:"full"})}.`;
}
export const attachment=t=>new RegExp(R.attachment,"i").test(t);
export const crisis=t=>new RegExp(R.crisis,"i").test(t);
