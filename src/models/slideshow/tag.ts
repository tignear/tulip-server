import {ObjectType, Field, ID,Int } from 'type-graphql'
import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, Index} from "typeorm";
import {Node,Edge,Connection,PageInfo} from '../relay'
import {ImageConnection,Image} from './image'
@Entity()
@ObjectType({implements:Node})
export class Tag implements Node{
    @PrimaryGeneratedColumn("uuid")
    @Field(type=>ID)
    id?:string

    @Column()
    @Field()
    @Index({ unique: true })
    name?:string;

    @Field(type=> ImageConnection)
    images?:ImageConnection;

    @ManyToMany(type => Image, image => image.dbTags)
    dbImages?: Image[];

}
@ObjectType({implements:Edge})
export class TagEdge implements Edge{
    @Field()
    cursor?: string;
    @Field()
    node?: Tag;
}
@ObjectType({implements:Connection})
export class TagConnection implements Connection{
    @Field(type=> Int)
    totalCount?:number;
    @Field()
    pageInfo?: PageInfo;
    @Field(type=>[TagEdge!]!)
    edges?: [TagEdge];
}