// Respuestas instantáneas: para saludos y preguntas simples Lumora ya sabe qué decir, sin esperar al modelo.
const pick=a=>a[Math.floor(Math.random()*a.length)];
const R=[
 [/^[¡¿\s]*(hola+|holi|buenas|buen[oa]s(\s+(d[ií]as|tardes|noches))?|buen d[ií]a|hey|ey|qu[eé] tal)(\s+lumora)?[\s!¡.,?]*$/i,
  ()=>pick(["¡Hola! Soy Lumora AI. ¿Qué vamos a crear hoy: un sitio web, un script de Roblox o algo de JavaScript?","¡Hola! Cuéntame qué necesitas y lo armamos.","¡Buenas! Lista para programar. ¿Por dónde empezamos?"])],
 [/^[¿\s]*(c[oó]mo (est[aá]s|andas|te va)|todo bien)[\s?!.]*$/i,
  ()=>pick(["Todo bien por aquí, lista para programar. ¿Qué construimos?","Muy bien, gracias. ¿En qué te ayudo?"])],
 [/^[¡\s]*(gracias+|muchas gracias|mil gracias|thx|thanks|genial|perfecto|excelente)[\s!.]*$/i,
  ()=>pick(["¡De nada! Si quieres, seguimos con eso o empezamos algo nuevo.","Con gusto. Dime si quieres cambiar algo."])],
 [/^[¿\s]*(qui[eé]n eres|qu[eé] eres|c[oó]mo te llamas|cu[aá]l es tu nombre|tu nombre)[\s?!.]*$/i,
  ()=>"Soy Lumora AI, una asistente de programación creada por Replication Development. Te ayudo con sitios web, JavaScript, Lua y Roblox."],
 [/^[¿\s]*(qui[eé]n te (cre[oó]|hizo|program[oó]|desarroll[oó])|qui[eé]n es tu (creador|due[ñn]o)|de qui[eé]n eres)[\s?!.]*$/i,
  ()=>"Me creó Replication Development."],
 [/^[¿\s]*(en qu[eé] (modelo )?(est[aá]s )?basad[ao]|qu[eé] modelo (eres|usas)|con qu[eé] modelo|qu[eé] ia eres)[\s?!.]*$/i,
  m=>"Soy Lumora AI"+(m?" y ahora uso "+m:"")+". Funciono con modelos de código abierto de la familia Qwen, configurados por Replication Development."],
 [/^[¿\s]*(qu[eé] (puedes|sabes) hacer|en qu[eé] me puedes ayudar|para qu[eé] sirves|ayuda|help)[\s?!.]*$/i,
  ()=>"Puedo ayudarte con:\n• Crear sitios web completos (HTML, CSS y JS).\n• Escribir y arreglar scripts de JavaScript, Lua y Roblox.\n• Modificar archivos que adjuntes (hasta ~5000 tokens).\n• Buscar en internet si activas «Buscar», y mostrarte mi razonamiento con «Pensar».\nSi no sé algo, te lo digo."],
 [/^[¿\s]*(est[aá]s (ah[ií]|aqu[ií])|me (escuchas|lees)|funcionas)[\s?!.]*$/i,
  ()=>"Aquí estoy. ¿En qué te ayudo?"],
 [/^\s*(adi[oó]s|chao|chau|hasta luego|nos vemos|bye)[\s!.]*$/i,
  ()=>"¡Hasta luego! Aquí estaré cuando quieras seguir."]
];
export function quick(q,model){
 const t=String(q).trim();if(t.length>56)return null;
 for(const [re,f] of R)if(re.test(t))return f(model);
 return null;
}
