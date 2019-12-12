import { RelyingParty } from "../../models/auth/relying-party";
import { Repository } from "typeorm";
import ServiceError from "../error";
import { Service } from "typedi";

@Service()
export default class RelyingPartyQueryService{
    async checkIdAndRedirectUri(repo:Repository<RelyingParty>,rpdbid:string,redirectUri:string):Promise<boolean>{
        if (await repo.createQueryBuilder()//TODO
            .innerJoin("rp.redirectUri", "redirectUri")
            .where("rp.dbId= :id AND redirectUri= :redirectUri", {
                id: rpdbid,
                redirectUri: redirectUri,
            }).getCount() === 0
        ) {
            return false;
        }
        return true;
    }
}