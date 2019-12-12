import { InputType,Resolver,Ctx,Query, Field,ID,Int,registerEnumType, Arg, Mutation, FieldResolver, Root, Info, } from "type-graphql";
import * as bcrypt from 'bcrypt'
import {GraphQLResolveInfo, GraphQLError} from 'graphql'
import {UserConnection,User, UserEdge} from '../../models/user'
import Context from './context'
import { ParseCursorAll, EncodeCursor,Forward, BuildQuery, BuildPageInfo } from "./utils";
import { PageInfo } from "../../models/relay";
import { OutherConnection, Outher, OutherEdge } from "../../models/slideshow/outher";
import { OuthersInput, OuthersOrder } from "./slideshow/outhers";
import { Brackets, Repository, Transaction, TransactionManager, TransactionRepository } from "typeorm";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
export enum UsersOrder{
    Id=1,
    Name
}
registerEnumType(UsersOrder, {
    name: "UsersOrder" // this one is mandatory
});
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
    @Field({nullable:true})
    outhes?:OuthersInput
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
@Service()
@Resolver(of=>User)
export class UserResolver{
    constructor(
        @InjectRepository(User) private readonly userRepo:Repository<User>,
        @InjectRepository(Outher) private readonly outherRepo:Repository<Outher>,

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
        @TransactionRepository(Outher) outherRepo?:Repository<Outher>,
    ){
        if(!userRepo||!outherRepo){
            throw new GraphQLError("Transaction repository does not exist");
        }
        const user=new User()
        user.mcfPassword = await bcrypt.hash(input.password,10);
        user.name=input.name;

            
            
        const r=await userRepo.save(user);
        const outher=new Outher();
        outher.user=r;
        outher.nickname=user.name;
        await outherRepo.save(outher);
        return r;
    }
    @Mutation(returns => User)
    async updateUser(@Arg("input") input: UpdateUserInput, @Ctx() ctx: Context){

    }
    @FieldResolver()
    async outhers(@Root() user:User,@Arg("input") input:OuthersInput, @Ctx() ctx: Context):Promise<OutherConnection|null>{
        const order=input.orderBy??OuthersOrder.Id;
        const cur=ParseCursorAll(input);
        if(!cur){
            throw new TypeError(`invalid cursor!`);
        }
        let qb=this.outherRepo.createQueryBuilder();
        let count;
        ({qb,count}=BuildQuery(qb,{orderKind:OuthersOrder,order,cur},new Brackets(iqb=>{
            iqb.where(
                "userDbId = :userId",
                {userId:user.dbId}
            )
        })));
        
        const qr=await qb.getMany();
        const conn=new OutherConnection();
        conn.pageInfo=BuildPageInfo(cur,count,qr);
        if(qr.length===count){
            --qr.length;
        }

        conn.edges=qr.map(e=>{
            const edge=new OutherEdge();
            edge.node=e;
            edge.cursor=EncodeCursor({
                id:e.id!,
                value:order===OuthersOrder.Id?e.id!:e.nickname!
            });
            return edge;
        });
        conn.pageInfo.startCursor=conn.edges[0].cursor;
        conn.pageInfo.endCursor=conn.edges[conn.edges.length-1].cursor;
        return conn;
    }
}