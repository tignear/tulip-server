export function buildURI(rediretUrI:string,sep:string,param:{[key:string] : string|undefined }){
    return rediretUrI+sep+Object.keys(param).reduce<[string,string][]>((a,e)=>{
        const v=param[e];
        if(v){
            a.push([e,v])
        }
        return a;
    },[]).map(e=>e.join("=")).join("&");
}