// Diagnóstico de errores con reglas fiables: no depende de que el modelo "adivine" la causa.
const SERVER=/\b(ServerScriptService|ServerStorage)\b|\bWorkspace\.[\w.]*:\d+/;
const CLIENT=/\b(PlayerGui|PlayerScripts|StarterPlayerScripts|StarterGui|StarterCharacterScripts|ReplicatedFirst|Backpack)\b/;
const R=[
 [/attempt to index nil with ['"]?(\w+)['"]?/i,m=>`Algo es nil justo antes de «.${m[1]}»: el objeto aún no existe cuando corre esa línea (orden de carga), está mal escrito o vive en el otro lado (servidor/cliente). Solución: WaitForChild o comprobar con if antes de usarlo.`],
 [/(\w+) is not a valid member of (\w+)/i,m=>`«${m[1]}» no es hijo de «${m[2]}»: nombre mal escrito (importan las mayúsculas), aún no se replicó o está en otro padre. Usa :WaitForChild("${m[1]}") en el cliente, o FindFirstChild y comprueba nil.`],
 [/Infinite yield possible on ['"]?([^'"\n]+)['"]?/i,m=>{const n=(/WaitForChild\(["']([^"']+)["']/.exec(m.input)||[])[1]||m[1].trim();return `WaitForChild("${n}") nunca termina: ese hijo no existe, el nombre o el padre están mal, o solo existe en el otro lado. Revisa el Explorer y pon un tiempo límite: WaitForChild(nombre, 5).`;}],
 [/attempt to call a nil value/i,()=>`Llamas a algo que no existe: nombre mal escrito, método de otra clase, ModuleScript que no devuelve su tabla, o «.» en vez de «:» al llamar un método (obj:Metodo()).`],
 [/attempt to (?:perform arithmetic|compare|concatenate)[^\n]*nil/i,()=>`Un valor es nil dentro de una operación: inicialízalo o comprueba nil antes. Si viene de un hijo o atributo, quizá aún no cargó.`],
 [/attempt to (?:perform arithmetic|compare)[^\n]*string/i,()=>`Estás operando con texto: conviértelo con tonumber().`],
 [/Expected ['"]?(?:end|then|do|\)|\]|\})['"]?|Expected identifier|Incomplete statement|Unexpected symbol|Malformed number/i,()=>`Error de sintaxis: falta cerrar con «end» (cada function/if/for/while lo necesita), falta «then» o «do», hay un paréntesis sin cerrar, o usas símbolos de otro lenguaje (!= en vez de ~=, && en vez de and, // para comentar).`],
 [/can only be called (?:from|on) the (?:server|client)|cannot be called from|FireServer can only|is not allowed to access|DataStoreService can only/i,()=>`Esa función solo funciona en un lado: FireServer e Invoke van en un LocalScript; FireClient, DataStore y HttpService van en un Script de servidor.`],
 [/HttpService is not allowed|Http requests are not enabled|HTTP 40[13]/i,()=>`HttpService solo funciona en el servidor y debe activarse en Game Settings → Security → Allow HTTP Requests.`],
 [/DataStore request was added to queue|DataStore.*(?:throttl|50[23])|Studio access to API/i,()=>`Límite o permiso de DataStore: envuelve cada llamada en pcall, no guardes en cada cambio, y activa «Enable Studio Access to API Services» para probar en Studio.`],
 [/exhausted allowed execution time|Script timeout/i,()=>`Bucle sin pausa: dentro de while/for largos añade task.wait().`],
 [/stack overflow/i,()=>`Recursión infinita: una función se llama a sí misma sin condición de parada.`],
 [/required recursively/i,()=>`Require circular: dos ModuleScripts se requieren entre sí. Mueve lo compartido a un tercer módulo.`],
 [/Unable to assign property (\w+)/i,m=>`La propiedad «${m[1]}» recibe un tipo incorrecto (por ejemplo Color3 en vez de BrickColor, o un número en vez de Vector3).`],
 [/invalid argument #(\d+)|Argument (\d+) missing or nil/i,m=>`El argumento ${m[1]||m[2]} llega nil o con un tipo incorrecto: revisa el orden y el tipo de lo que pasas.`],
 [/Maximum event re-entrancy depth/i,()=>`Un evento se dispara a sí mismo en cadena: usa un debounce o desconecta antes de cambiar la propiedad.`],
 [/Cannot (?:read|set) propert(?:y|ies) of (null|undefined)(?: \((?:reading|setting) ['"](\w+)['"]\))?/i,m=>`En JavaScript algo es ${m[1]} antes de usar «${m[2]||"la propiedad"}»: el elemento aún no existe (el script corre antes de que cargue el HTML: usa defer, type="module" o ponlo al final del body) o el id está mal escrito.`],
 [/(\w+) is not defined/i,m=>`«${m[1]}» no está declarada: errata, falta import, o está fuera de alcance (scope).`],
 [/(\w+(?:\.\w+)*) is not a function/i,m=>`«${m[1]}» no es una función: errata, objeto distinto o falta el import.`],
 [/Unexpected token|Unexpected end of input|missing \) after argument list/i,()=>`Llaves, paréntesis o comillas sin cerrar, o una coma de más o de menos.`],
 [/Failed to fetch|blocked by CORS|No 'Access-Control-Allow-Origin'/i,()=>`No es un fallo del código: el servidor no permite peticiones desde este sitio (CORS) o no hay conexión. Usa una API con CORS abierto o un proxy.`],
 [/Cannot use import statement outside a module/i,()=>`Falta type="module" en el <script> (o usa "type": "module" en Node).`],
 [/Cannot find module|MODULE_NOT_FOUND/i,()=>`Módulo no encontrado: falta npm install o la ruta del import está mal.`]
];
export const looksLikeError=q=>R.some(([re])=>re.test(q))||(/\b[\w.]+:\d+:/.test(q)&&/error|attempt|expected/i.test(q));
export function diagnose(q){
 const hints=[];for(const [re,f] of R){const m=re.exec(q);if(m)hints.push(f(m));}
 const side=CLIENT.test(q)?"CLIENTE (LocalScript)":SERVER.test(q)?"SERVIDOR (Script)":"";
 if(!hints.length&&!(side&&/error|attempt|expected/i.test(q)))return "";
 return "\nDIAGNÓSTICO PREVIO (reglas fiables; úsalo como punto de partida):\n"+(side?"- El error ocurre en el "+side+".\n":"")+hints.slice(0,3).map(h=>"- "+h).join("\n")+"\nResponde en tres partes cortas: Causa, Corrección (código completo) y Por qué funciona. Si depende del orden de carga o de servidor/cliente, dilo.";
}
