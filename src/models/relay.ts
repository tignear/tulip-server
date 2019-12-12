import {ObjectType, InterfaceType, Field, ID } from 'type-graphql'
@ObjectType()
export class PageInfo {
    @Field()
    startCursor?: string
    @Field()
    endCursor?: string
    @Field()
    hasNextPage?: boolean
    @Field()
    hasPreviousPage?: boolean
}

@InterfaceType()
export abstract class Node {
  @Field(type => ID)
  id?: string;
}
@InterfaceType()
export abstract class Connection {
    @Field(type => PageInfo)
    pageInfo?: PageInfo;
    @Field(type => [Edge!])
    edges?: Edge[];
}
@InterfaceType()
export abstract class Edge {
    @Field()
    cursor?: string;
    @Field()
    node?: Node;
}