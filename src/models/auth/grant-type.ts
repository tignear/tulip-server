import { registerEnumType } from "type-graphql";
enum GrantType {
    AuthorizationCode=1,
    RefreshToken
}
const stringToEnumMap=new Map<string,GrantType>();
stringToEnumMap.set(GrantType[GrantType.AuthorizationCode].toUpperCase(),GrantType.AuthorizationCode);
stringToEnumMap.set(GrantType[GrantType.RefreshToken].toUpperCase(),GrantType.RefreshToken);
export function stringToGrantType(src:(string|undefined)[]):GrantType[];
export function stringToGrantType(src:string|undefined):GrantType|undefined;
export function stringToGrantType(src:(string|undefined)[]|string|undefined){
    if(!src){
        return undefined;
    }
    if(typeof src==="string"){
        return stringToEnumMap.get(src.toUpperCase());
    }
    return src.reduce<GrantType[]>((a,e)=>{
        const v=stringToGrantType(e);
        if(v){
            a.push(v);
        }
        return a;
    },[]);
}

export default GrantType;