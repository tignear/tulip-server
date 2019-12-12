import {ObjectType, Field, ID,Int } from 'type-graphql'
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, Index} from "typeorm";
import {Node,Edge,Connection,PageInfo} from '../relay'
import {User} from '../user'
import { Image, ImageConnection } from './image';
@Entity()
@ObjectType({implements:Node})
export class Outher implements Node{

    @PrimaryGeneratedColumn('uuid',{name:"id"})
    dbId?:string;
    @Field(type=>ID)
    get id():string|undefined{
        return this.dbId?"slideshow/outher/"+this.dbId:undefined;
    }
    @Field()
    @Column()
    @Index()
    nickname?:string

    @Field(type=>ImageConnection)
    images?:ImageConnection
    @ManyToMany(type=>Image,image=>image.dbTags)
    dbImages?:Image[]

    @ManyToOne(type => User, user => user.dbOuthers)
    @Field(type=> User)
    user?:User
    /*@Index()
    @Column({ type: 'uuid',name:"userId" })
    userId?:string;*/
}
@ObjectType({implements:Edge})
export class OutherEdge implements Edge{
    @Field()
    cursor?: string
    @Field(type=> Outher)
    node?: Outher
}
@ObjectType({implements:Connection})
export class OutherConnection implements Connection{
    @Field(type=>Int,{nullable:true})
    totalCount?:number
    @Field()
    pageInfo?: PageInfo
    @Field(type=>[OutherEdge])
    edges?: OutherEdge[]
}