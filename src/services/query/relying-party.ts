import { RelyingParty, RelyingPartyRedirectUri } from "../../models/auth/relying-party";
import { Repository } from "typeorm";
import ServiceError from "../error";
import { Service } from "typedi";

@Service()
export default class RelyingPartyQueryService{
    async checkIdAndRedirectUri(repo:Repository<RelyingParty>,rpdbid:string,redirectUri:string):Promise<boolean>{
        const query= repo.createQueryBuilder("rp")//TODO
        .leftJoinAndSelect("rp.dbRedirectUris","RelyingPartyRedirectUri")
        .where("rp.dbId= :id AND RelyingPartyRedirectUri.uri= :redirectUri", {
            id: rpdbid,
            redirectUri: redirectUri,
        });
        if (await query.getCount()!==1
        ) {
            return false;
        }
        return true;
    }
}