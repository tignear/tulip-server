enum AuthorizationResponseType {
    Code=1,
    Token,
    IdToken,
}
const stringToEnumMap=new Map<string,AuthorizationResponseType>();
stringToEnumMap.set(AuthorizationResponseType[AuthorizationResponseType.Code].toUpperCase(),AuthorizationResponseType.Code);
stringToEnumMap.set(AuthorizationResponseType[AuthorizationResponseType.Token].toUpperCase(),AuthorizationResponseType.Token);
stringToEnumMap.set(AuthorizationResponseType[AuthorizationResponseType.IdToken].toUpperCase(),AuthorizationResponseType.IdToken);

export function stringToAuthorizationResponseType(src:(string|undefined)[]):AuthorizationResponseType[];
export function stringToAuthorizationResponseType(src:string|undefined):AuthorizationResponseType|undefined;
export function stringToAuthorizationResponseType(src:(string|undefined)[]|string|undefined){
    if(!src){
        return undefined;
    }
    if(typeof src==="string"){
        return stringToEnumMap.get(src.toUpperCase());
    }
    return src.reduce<AuthorizationResponseType[]>((a,e)=>{
        const v=stringToAuthorizationResponseType(e);
        if(v){
            a.push(v);
        }
        return a;
    },[]);
}

export default AuthorizationResponseType;