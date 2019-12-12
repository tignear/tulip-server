import { InputType,Resolver,Query, Field ,ID,Int,registerEnumType, ResolverInterface, FieldResolver, Root, Arg, Mutation, Ctx } from "type-graphql";
import {ImageConnection, Image} from '../../../models/slideshow/image'
import Context from '../context'
export enum ImagesOrder{
    Title=1,
    //Update,
    //Random
}
registerEnumType(ImagesOrder, {
    name: "ImagesOrder" // this one is mandatory
});
@InputType()
export class ImagesFilter{
    @Field({nullable:true})
    title?:string
    @Field(type=> ID,{nullable:true})
    outhers?:string
    @Field({nullable:true})
    description?:string
    @Field(type=> [ID],{nullable:true})
    tags?:[string]
    /*@Field(type=>Int,{nullable:true})
    updateAt?:number*/
}
@InputType()
export class ImagesInput{
    @Field(type=> Int,{nullable:true})
    first?:number
    @Field({nullable:true})
    after?:string
    @Field(type=> Int,{nullable:true})
    last?:number
    @Field({nullable:true})
    before?:string
    @Field(type => ImagesOrder,{nullable:true})
    orderBy?:ImagesOrder
    @Field({nullable:true})
    term?:string
    @Field(type=>ImagesFilter, {nullable:true})
    filter?:ImagesFilter
}
@InputType()
export class AddImageInput{
    @Field()
    title!:string
    @Field()
    file!:string//BASE64 or URL
    @Field(type=>[ID!]!)
    outhers!:[string]
    @Field()
    description!:string
    @Field(type=>[ID!]!)
    tags!:[string]
}
@InputType()
export class UpdateImageInput{
    @Field()
    title?:string
    @Field()
    file?:string//BASE64 or URL
    @Field(type=>[ID!]!)
    outhers?:[string]
    @Field()
    description?:string
    @Field(type=>[ID!]!)
    tags?:[string]
}
@Resolver(of=>Image)
export class ImageResolver{
    @Query(returns => ImageConnection)
    async images(@Arg("input") input:ImagesInput,@Ctx() ctx: Context){
        
    }
    @Mutation(returns => Image)
    async addImage(@Arg("input") input: AddImageInput, @Ctx() ctx: Context){
    }
    @Mutation(returns => Image)
    async updateImage(@Arg("input") input: UpdateImageInput, @Ctx() ctx: Context){
    }
}