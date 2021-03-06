import {Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, JoinColumn, ManyToMany} from "typeorm";
import { ObjectType, Field, ID,Int, Arg } from 'type-graphql';
import {Node,Edge,Connection,PageInfo} from './relay';
import UserGrant from "./auth/user-grant";
@Entity()
@ObjectType({implements:Node})
export class User implements Node{
    @Field(type=>ID)
    get id():string|undefined{
        return this.dbId?User.toId(this.dbId):undefined;
    }
    static toDbId(id:string):string|undefined{
        const s=id.split(".");
        if(s.length!==2){
            return undefined;
        }
        if(s[0]!=="user"){
            return undefined;
        }
        return s[1];
    }
    static toId(dbId:string){
        return "user."+dbId;
    }
    @PrimaryGeneratedColumn("uuid",{name:"id"})
    dbId?:string;
    
    @Field()
    @Column()
    @Index({ unique: true })
    name!:string;

    @Field(type=>[UserGrant!]!,{defaultValue:[]})
    @OneToMany(type=>UserGrant,userGrant=>userGrant.rp)
    userGrant!:UserGrant[]

    @Column()
    mcfPassword!:string;//Modular Crypt Format

    @Column()
    lastAuthTime?:Date;
}
@ObjectType({implements:Edge})
export class UserEdge implements Edge{
    @Field()
    cursor?: string;
    @Field()
    node?: User;
}
@ObjectType({implements:Connection})
export class UserConnection implements Connection{
    @Field(type => Int,{nullable:true})
    totalCount?:number;
    @Field()
    pageInfo?: PageInfo;
    @Field(type=>[UserEdge!]!)
    edges?: UserEdge[];
}