import { Service } from "typedi";
import { QueryRunner } from "typeorm";
import { ScopeType } from "../../models/auth/scope";

@Service()
export default class UserGrantCommandService{
    async userGrant(qr:QueryRunner,rpDbId:string,userDbId:string,scopes:ScopeType[]){
        await qr.query(
            `INSERT OR IGNORE INTO user_grant("userDbId", "rpDbId", "scope")
             VALUES ${scopes.map(e=>"("+[userDbId.replace("'","''"),rpDbId.replace("'","''"),ScopeType[e]].map(e=>"'"+e+"'").concat(",")+")").concat(",")})
            `
         );
     }
}