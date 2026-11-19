// Búsqueda en internet sin API key: Wikipedia (es/en) y Stack Overflow, ambas con CORS abierto.
const plain=h=>new DOMParser().parseFromString(h,"text/html").documentElement.textContent.replace(/\s+/g," ").trim();
const get=async u=>{const r=await fetch(u,{signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error(r.status);return r.json();};
export async function webSearch(q){
 const e=encodeURIComponent(q.replace(/[¿?¡!]/g,"").trim().slice(0,120)),out=[],sources=[];
 const wiki=lang=>get(`https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${e}&gsrlimit=2&prop=extracts&exintro=1&explaintext=1&exchars=500&exlimit=2&format=json&origin=*`)
  .then(d=>Object.values((d.query&&d.query.pages)||{}).sort((a,b)=>a.index-b.index).forEach(p=>{
   if(p.extract){out.push("[Wikipedia] "+p.title+": "+p.extract.replace(/\s+/g," "));sources.push({t:"Wikipedia · "+p.title,u:`https://${lang}.wikipedia.org/?curid=${p.pageid}`});}
  })).catch(()=>{});
 const so=get(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${e}&answers=1&site=stackoverflow&pagesize=2`)
  .then(async d=>{for(const it of d.items||[]){
   const a=await get(`https://api.stackexchange.com/2.3/questions/${it.question_id}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody&pagesize=1`);
   const t=plain(it.title),b=plain((a.items&&a.items[0]&&a.items[0].body)||"").slice(0,500);
   if(b){out.push("[Stack Overflow] "+t+": "+b);sources.push({t:"Stack Overflow · "+t,u:it.link});}
  }}).catch(()=>{});
 await Promise.all([wiki("es"),so]);
 if(!out.length)await wiki("en");
 return {text:out.join("\n\n").slice(0,2200),sources};
}
