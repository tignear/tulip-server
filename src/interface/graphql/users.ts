import { InputType,Resolver,Ctx,Query, Field,ID,Int, Arg, Mutation,   Info, FieldResolver, Root } from "type-graphql";
import * as bcrypt from 'bcrypt';
import {GraphQLResolveInfo, GraphQLError} from 'graphql'
import {UserConnection,User, UserEdge} from '../../models/user'
import Context from './context'
import { ParseCursorAll, EncodeCursor,Forward} from "./utils";
import { PageInfo } from "../../models/relay";
import {  Repository, Transaction,  TransactionRepository } from "typeorm";
import { Service, Inject } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { ScopeType } from "../../models/auth/scope";
import ResolverError from "./error";
import Loaders from "./loaders";
import { RelyingParty } from "../../models/auth/relying-party";
export enum UsersOrder{
    Id=1,
    Name
}

@InputType()
export class UsersFilter{
    @Field({nullable:true})
    name?:string
    @Field(type=> ID,{nullable:true})
    id?:string
}
@InputType()
export class UsersInput{
    @Field(type=> Int,{nullable:true})
    first?:number
    @Field({nullable:true})
    after?:string
    @Field(type=> Int,{nullable:true})
    last?:number
    @Field({nullable:true})
    before?:string
    @Field(type => UsersOrder,{nullable:true})
    orderBy?:UsersOrder
    @Field({nullable:true})
    term?:string
    @Field({nullable:true})
    filter?:UsersFilter

}
@InputType()
export class AddUserInput{
    @Field()
    name!:string
    @Field()
    password!:string
}
@InputType()
export class UpdateUserInput{
    @Field(type=>ID)
    id!:string
    @Field({nullable:true})
    name?:string
}
@InputType()
export class UserGrantInput{
    @Field(type=>ID,{nullable:true})
    rpId?:string
}
@Service()
@Resolver(of=>User)
export class UserResolver{
    constructor(
        @InjectRepository(User) private readonly userRepo:Repository<User>,
        private readonly loaders:Loaders
        ){

    }

    @Query(returns => UserConnection)
    async users(@Arg("input") input:UsersInput,@Ctx() ctx: Context,@Info() info:GraphQLResolveInfo):Promise<UserConnection>{
        const order=input.orderBy?input.orderBy:UsersOrder.Id;
        const cur=ParseCursorAll(input);
        if(!cur){
            throw new TypeError(`invalid cursor!`);
        }
        let qb=this.userRepo
            .createQueryBuilder();
        if(cur.cursor){
            qb=qb.where(
                `${UsersOrder[order]} ${cur instanceof Forward?">":"<"} :cursor`,
                {
                    cursor:cur.cursor
                }
            );
        }
        qb=qb.orderBy(UsersOrder[order],cur instanceof Forward?"ASC":"DESC");
        const count=(cur.count??10)+1;
        qb=qb.take(count);
        const qr=await qb.getMany();
        const r=new UserConnection();
        r.pageInfo=new PageInfo();
        if(cur instanceof Forward){
            r.pageInfo.hasNextPage=qr.length===count;
            r.pageInfo.hasPreviousPage=false;
        }else{
            r.pageInfo.hasNextPage=false;
            r.pageInfo.hasPreviousPage=qr.length===count;
        }
        if(qr.length===count){
            --qr.length;
        }
        r.edges=qr.map(e=>{
            const edge=new UserEdge();
            edge.node=e;
            edge.cursor=EncodeCursor(
                {
                    id:e.id!,
                    value:order===UsersOrder.Id?e.id!:e.name!
                });
            return edge;
        });
        r.pageInfo.startCursor=r.edges[0].cursor;
        r.pageInfo.endCursor=r.edges[r.edges.length-1].cursor;
        

        return r;
    }
    @Transaction()
    @Mutation(returns => User)
    async addUser(
        @Arg("input") input: AddUserInput,
        @Ctx() ctx: Context,
        @TransactionRepository(User) userRepo?:Repository<User>,
    ){
        if(!userRepo){
            throw new GraphQLError("Transaction repository does not exist");
        }
        const user=new User()
        user.mcfPassword = await bcrypt.hash(input.password,10);
        user.name=input.name;
        user.lastAuthTime=new Date();
            
        const r=await userRepo.save(user);
        return r;
    }
    @Mutation(returns => User)
    async updateUser(@Arg("input") input: UpdateUserInput, @Ctx() ctx: Context){

    }
    @FieldResolver()
    async userGrant(@Root() user: User,@Ctx() ctx: Context,@Arg("input",{nullable:true}) input?:UserGrantInput){
        if(!ctx.scopes.includes(ScopeType.ManageAccount)){
            throw new ResolverError("access denied.RP does not have that authority.");
        }
        if(!user.dbId||!ctx.userInfo?.userDbId){
            throw new ResolverError("access denied.");
        }
        if(user.dbId! !==ctx.userInfo.userDbId){
            throw new ResolverError("access denied.You can see only your own.");
        }
        if(user.userGrant){
            return user.userGrant;
        }
        if(!input){
            return this.loaders.userGrantsFromUserDbIdLoader.load(user.dbId);
        }
        if(!input.rpId){
            return this.loaders.userGrantsFromUserDbIdLoader.load(user.dbId);
        }
        const dbId=RelyingParty.toDbId(input.rpId);
        if(!dbId){
            throw new Error("inavlid rpid format");
        }
        return this.loaders.userGrantsFromUserDbIdLoader.load(user.dbId).then(e=>{
            return e?[e.find(k=>k.rpDbId===dbId)]:e
        });
    }
}