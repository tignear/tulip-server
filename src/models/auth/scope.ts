import { registerEnumType } from "type-graphql";

export enum ScopeType{
    OpenId=1,
    ManageAccount
}
registerEnumType(ScopeType, {
    name: "ScopeType", // this one is mandatory
});
const stringToEnumMap=new Map<string,ScopeType>();
stringToEnumMap.set(ScopeType[ScopeType.OpenId].toUpperCase(),ScopeType.OpenId);
stringToEnumMap.set(ScopeType[ScopeType.ManageAccount].toUpperCase(),ScopeType.ManageAccount);
export function stringToEnum(src:(string|undefined)[]):ScopeType[];
export function stringToEnum(src:string|undefined):ScopeType|undefined;
export function stringToEnum(src:(string|undefined)[]|string|undefined){
    if(!src){
        return undefined;
    }
    if(typeof src==="string"){
        return stringToEnumMap.get(src.toUpperCase());
    }
    return src.reduce<ScopeType[]>((a,e)=>{
        const v=stringToEnum(e);
        if(v){
            a.push(v);
        }
        return a;
    },[]);
}
