import {ObjectType, Field, ID,Int } from 'type-graphql'
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany,JoinTable, Index} from "typeorm";

import {Node,Edge,Connection,PageInfo} from '../relay'
import {OutherConnection,Outher} from './outher'
import {TagConnection,Tag} from './tag'
@Entity()
@ObjectType({implements:Node})
export class Image implements Node  {
    @PrimaryGeneratedColumn("uuid")
    @Field(type=>ID)
    id?:string
    
    @Column()
    @Field()
    @Index()
    title?:string

    @Column()
    @Field()
    file?:string//BASE64 or URL

    @Field(type=>OutherConnection)
    outhers?:OutherConnection
    @ManyToMany(type=>Outher,outher=>outher.dbImages)
    @JoinTable()
    dbOuthers?:Outher[]

    @Column()
    @Field()
    @Index()
    description?:string

    @Field()
    tags?:TagConnection

    @ManyToMany(type => Tag, tag => tag.dbImages)
    @JoinTable()
    dbTags?:Tag[]

    @Field(type=>Int)
    updateAt?:number
}
@ObjectType({implements:Edge})
export class ImageEdge implements Edge{
    @Field()
    cursor?: string
    @Field()
    node?: Image
}
@ObjectType({implements:Connection})
export class ImageConnection implements Connection{
    @Field(type=> Int)
    totalCount?:number
    @Field()
    pageInfo?: PageInfo
    @Field(type=>[ImageEdge])
    edges?: ImageEdge[]
}