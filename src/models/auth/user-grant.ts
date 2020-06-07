import { User } from "../user";
import { ManyToOne, Column, PrimaryGeneratedColumn, Entity, Index, RelationId, OneToMany, JoinColumn } from "typeorm";
import { RelyingParty } from "./relying-party";
import {Node, Connection, Edge, PageInfo} from "../../models/relay"
import { Field, ObjectType, ID } from "type-graphql";
import { ScopeType, stringToEnum } from "./scope";
@ObjectType({implements:Node})
@Entity()
@Index(["userDbId", "rpDbId"], { unique: true })
export default class UserGrant implements Node{
    constructor(userDbId:string,rpDbId:string,dbScope:UserGrantedScope[]){
        this.userDbId=userDbId;
        this.rpDbId=rpDbId;
        this.dbScope=dbScope;
    }
    @PrimaryGeneratedColumn("uuid")
    dbId!:string;
    @Field(type=>ID!)
    get id():string{
        return UserGrant.toId(this.dbId);
    }
    static toId(dbId:string):string{
        return "grant."+dbId;
    }
    static toDbId(id:string|undefined):string|undefined{
        if(!id){
            return undefined;
        }
        const arr=id.split(".");
        if(arr.length!==2&&arr[0]!=="grant"){
            return undefined;
        }
        return arr[1];
    }
    @Field(type=>User)
    @ManyToOne(type=>User,user=>user.dbId)
    @JoinColumn({name:"userDbId"})
    user?:User;
    @Column("uuid",{nullable:true})
    userDbId!:string;
    @Field(type=>RelyingParty)
    @ManyToOne(type=>RelyingParty,user=>user.dbId)
    rp?:RelyingParty
    @Column("uuid",{nullable:true})
    rpDbId!:string;
    @Field(type=>[ScopeType!],{nullable:true})
    get scope():ScopeType[]|undefined{
        return this.dbScope?this.dbScope.map(e=>stringToEnum(e.dbScope)!):undefined;
    }
    @OneToMany(type=>UserGrantedScope,userGrantedScope=>userGrantedScope.userGrant,{cascade:true,nullable:true})
    dbScope?:UserGrantedScope[];
}
@Entity()
export class UserGrantedScope{
    constructor(dbScope:string){
        this.dbScope=dbScope;
    }
    @PrimaryGeneratedColumn("uuid")
    dbId!:string;
    @ManyToOne(type=>UserGrant,userGrant=>userGrant.dbScope)
    userGrant!:UserGrant;
    @Column()
    dbScope!:string
    get scope():ScopeType{
        return stringToEnum(this.dbScope)!;
    }
}
/*@ObjectType({implements:Edge})
export class UserGrantEdge implements Edge{
    @Field()
    cursor?: string;
    @Field()
    node?: UserGrant;
}
@ObjectType({implements:Connection})
export class UserGrantConnection implements Connection{

    @Field()
    pageInfo?: PageInfo;
    @Field(type=>[UserGrantEdge!]!)
    edges?: UserGrantEdge[];
}*/