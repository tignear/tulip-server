import {Base64} from 'js-base64'
import { SelectQueryBuilder, Brackets, RelationQueryBuilder } from 'typeorm';
import { PageInfo } from '../../models/relay';
type ParseCursorAllInput={
    first?:number
    after?:string
    last?:number
    before?:string
}
export abstract class CursorBase{
    constructor(
        public readonly count:number,
        public readonly cursor?:string,
        public readonly id?:string
    ){}
}
export class Forward extends CursorBase{
    constructor(
        public readonly first:number,
        public readonly after?:string,
        public readonly afterId?:string){
            super(first,after,afterId);
        }
}
export class Backward extends CursorBase{
    constructor(
        public readonly last:number,
        public readonly before?:string,
        public readonly beforeId?:string){
            super(last,before,beforeId);
        }
}
type Cursor=Forward|Backward
export function ParseCursorAll(input:ParseCursorAllInput):Cursor|null{
    if(input.first&&(input.last||input.before)){
        return null;
    }
    if(input.last&&input.after){

        return null;
    }

    if(input.last){
        const {id=undefined,value=undefined}=input.before?ParseCursor(input.before)??{}:{};
        return new Backward(input.last,value,id);
    }
    if(input.first){

        const {id=undefined,value=undefined}=input.after?ParseCursor(input.after)??{}:{};
        return new Forward(input.first,value,id);
    }
    return null;
}
type CursorData={
    id:string;
    value:string;
}
export function ParseCursor(input:string):Partial<CursorData>|null{
    return JSON.parse(Base64.decode(input));
}

export function EncodeCursor(input:CursorData){
    return Base64.encode(JSON.stringify({
        id:input.id,
        value:input.value
    }));
}
type BuildeQueryPagenationArg={
    orderKind:any,
    order:number,
    cur:Cursor,
    defaultCount?:number
}

export function BuildQuery<T>(
    qb:SelectQueryBuilder<T>,{
        orderKind,
        order,
        cur,
        defaultCount=10
    }:BuildeQueryPagenationArg,
    filter?:Brackets
){
    
    if(cur.cursor){
        qb=qb.where(
            `${orderKind[order]} ${cur instanceof Forward?">":"<"} :cursor`,
            {
                cursor:cur.cursor
            }
        );
    }
    if(filter){
        qb=qb.andWhere(filter); 
    }
    qb=qb.orderBy(orderKind[order],cur instanceof Forward?"ASC":"DESC");
    const count=(cur.count??defaultCount)+1;
    qb=qb.take(count);
    return {qb,count};
}
export function BuildPageInfo<T>(cur:Cursor,count:number,qr:T[]){
    const pageInfo=new PageInfo();
    if(cur instanceof Forward){
        pageInfo.hasNextPage=qr.length===count;
        pageInfo.hasPreviousPage=false;
    }else{
        pageInfo.hasNextPage=false;
        pageInfo.hasPreviousPage=qr.length===count;
    }

    return pageInfo;
}