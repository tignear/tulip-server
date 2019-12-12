import {createConnection, Connection} from "typeorm";
import { ScopeType } from "../../models/auth/scope";
class Loaders{

}
export class UserInfo{
    constructor(public userDbId:string,public clientId?:string){}
}
export default class Context{
    //loaders:Loaders;
    constructor(public readonly scopes:ScopeType[]){}
    public userInfo?:UserInfo;
    
}