import { InputType,Resolver,Query,Mutation, Field ,ID,Int,registerEnumType,  Arg,Ctx } from "type-graphql";
import {OutherConnection, Outher} from '../../../models/slideshow/outher'
import Context from '../context'
export enum OuthersOrder{
    Id=1,
    Nickname
}
registerEnumType(OuthersOrder, {
    name: "OuthersOrder" // this one is mandatory
});
@InputType()
export class OuthersInput{
    @Field(type=> Int,{nullable:true})
    first?:number
    @Field({nullable:true})
    after?:string
    @Field(type=> Int,{nullable:true})
    last?:number
    @Field({nullable:true})
    before?:string
    @Field(type => OuthersOrder,{nullable:true})
    orderBy?:OuthersOrder
    @Field({nullable:true})
    term?:string
    //filter:OuthersFilter
}
@InputType()
export class AddOutherInput{
    @Field(type=>ID)
    userId!:string
    @Field()
    nickname!:string
}
@InputType()
export class UpdateOutherInput{
    @Field(type=>ID)
    id!:string
    @Field({nullable:true})
    nickname?:string
}
@Resolver(of=>Outher)
export class OutherResolver{
    @Query(returns => OutherConnection)
    async outhers(@Arg("input") input:OuthersInput,@Ctx() ctx: Context){
        
    }
    @Mutation(returns => Outher)
    async addOuther(@Arg("input") input: AddOutherInput, @Ctx() ctx: Context){
    }
    @Mutation(returns => Outher)
    async updateOuther(@Arg("input") input: UpdateOutherInput, @Ctx() ctx: Context){
    }
}