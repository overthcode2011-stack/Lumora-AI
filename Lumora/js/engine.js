
const qs=new URLSearchParams(location.search).get("server");
if(qs)try{localStorage.setItem("lumora_ollama",qs.replace(/\/$/,""));}catch{}
const BASE=localStorage.getItem("lumora_ollama")||"http://localhost:11434";
export async function pick(){
 const d=await (await fetch(BASE+"/api/tags")).json(),n=(d.models||[]).map(m=>m.name);
 return n.find(x=>/^lumora/.test(x))||n.find(x=>/coder/.test(x))||n[0]||null;
}
export async function stream(model,messages,onTok,signal){
 const r=await fetch(BASE+"/api/chat",{method:"POST",signal,body:JSON.stringify({model,messages,stream:true})});
 if(!r.ok)throw new Error(await r.text());
 const rd=r.body.getReader(),dec=new TextDecoder();let buf="",th=false;
 for(;;){
  const {done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});
  const ls=buf.split("\n");buf=ls.pop();
  for(const l of ls){if(!l.trim())continue;const j=JSON.parse(l);if(j.error)throw new Error(j.error);const m=j.message||{};
   if(m.thinking){if(!th){onTok("<think>");th=true;}onTok(m.thinking);}
   if(m.content){if(th){onTok("</think>");th=false;}onTok(m.content);}}
 }
 if(th)onTok("</think>");
}
