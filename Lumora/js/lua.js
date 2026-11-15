
export function parseLua(src){
 let p=0;
 const ws=()=>{for(;;){while(/\s/.test(src[p]||""))p++;if(src.startsWith("--",p)){while(p<src.length&&src[p]!=="\n")p++;}else return;}};
 const str=q=>{let s="";p++;while(p<src.length&&src[p]!==q){if(src[p]==="\\"){p++;s+=({n:"\n",t:"\t"})[src[p]]||src[p];}else s+=src[p];p++;}p++;return s;};
 const val=()=>{ws();const c=src[p];if(c==="{")return tbl();if(c==='"'||c==="'")return str(c);
  const m=/^(-?\d+\.?\d*|true|false|nil)/.exec(src.slice(p,p+24));if(!m)throw new Error("Lua inválido en posición "+p);
  p+=m[0].length;return m[0]==="true"?true:m[0]==="false"?false:m[0]==="nil"?null:Number(m[0]);};
 const tbl=()=>{p++;const o={},a=[];for(;;){ws();if(src[p]==="}"){p++;break;}if(p>=src.length)throw new Error("Tabla sin cerrar");
  const m=/^([A-Za-z_]\w*)\s*=(?!=)/.exec(src.slice(p,p+80));
  if(m){p+=m[0].length;o[m[1]]=val();}else a.push(val());ws();if(src[p]===","||src[p]===";")p++;}
  return Object.keys(o).length?o:a;};
 ws();if(!src.startsWith("return",p))throw new Error("El archivo Lua debe empezar con return");p+=6;return val();
}
const q=s=>'"'+s.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n")+'"';
export function toLua(v,ind=""){
 const n=ind+"  ";
 if(Array.isArray(v))return v.length?"{\n"+v.map(x=>n+toLua(x,n)).join(",\n")+"\n"+ind+"}":"{}";
 if(v&&typeof v==="object")return "{\n"+Object.entries(v).map(([k,x])=>n+k+" = "+toLua(x,n)).join(",\n")+"\n"+ind+"}";
 return typeof v==="string"?q(v):String(v);
}
