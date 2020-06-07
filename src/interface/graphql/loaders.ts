import DataLoader from "dataloader";
import UserGrant, { UserGrantedScope } from "../../models/auth/user-grant";
import { InjectRepository, InjectConnection } from "typeorm-typedi-extensions";
import { Repository, Db, Connection } from "typeorm";
import * as R from "ramda"
import Container, { Service } from "typedi";
import { User } from "../../models/user";
import { RelyingParty, RelyingPartyRedirectUri } from "../../models/auth/relying-party";
@Service()
export default class Loaders {
    constructor(
        @InjectConnection() private readonly connection:Connection,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(UserGrant) private readonly userGrantRepo: Repository<UserGrant>,
        @InjectRepository(UserGrantedScope) private readonly userGrantedScopeRepo: Repository<UserGrantedScope>

    ) {

    }
    public userGrantsFromUserDbIdLoader = new DataLoader<string, UserGrant[]>(async e => {
        const qb = this.connection
            .createQueryBuilder(UserGrant,"ug")
            .where("ug.userDbId IN (:...ids)", { ids: e })
            .leftJoinAndMapMany("ug.dbScope",UserGrantedScope,"dbScope","ug.dbId=dbScope.userGrantDbId")
            .leftJoinAndMapOne("ug.rp",RelyingParty,"rp","ug.rpDbId=rp.dbId")
            .leftJoinAndMapMany("rp.dbRedirectUris",RelyingPartyRedirectUri,"redirectUris","redirectUris.rpDbId=rp.dbId")
        const d=await qb.getMany()
        console.log(qb.getSql())
        const grouped=R.groupBy(R.prop("userDbId"),d);
        console.log(grouped);
        const r= R.map(R.prop(R.__,grouped),e);
        
        return r;
    });
    public userFromUserDbIdLoader=new DataLoader<string,User>(async e=>{
        const qb=this.userRepo.createQueryBuilder().where("id IN (:...ids)",{ids:e});
        const r=await qb.getMany();
        return r;
    });
}


