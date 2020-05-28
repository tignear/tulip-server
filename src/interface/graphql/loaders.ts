import DataLoader from "dataloader";
import UserGrant from "../../models/auth/user-grant";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import * as R from "ramda"
import Container, { Service } from "typedi";
import { User } from "../../models/user";
@Service()
export default class Loaders {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(UserGrant) private readonly userGrantRepo: Repository<UserGrant>) {

    }
    public userGrantFromUserDbIdLoader = new DataLoader<string, UserGrant[]>(async e => {
        const d = await this.userGrantRepo.createQueryBuilder().where("userDbId IN (:...ids)", { ids: e }).getMany();
        
        const grouped = R.groupBy(R.prop("userDbId"), d);
        return R.map(e => grouped[e], e);
    });
    public userFromUserDbIdLoader=new DataLoader<string,User>(async e=>{
        const qb=await this.userRepo.createQueryBuilder().where("id IN (:...ids)",{ids:e});
        const r=await qb.getMany();
        return r;
    })
}


