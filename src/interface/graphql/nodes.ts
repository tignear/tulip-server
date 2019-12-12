import { InputType,Resolver,Ctx,Query, ID, Arg, Mutation } from "type-graphql";
import {Node} from "../../models/relay"
import Context from "./context"
@Resolver()
export class NodeResolver{
    @Query(returns=>Node)
    async node(@Arg("id",type=>ID) id:string,@Ctx() ctx: Context){

    }
    @Mutation(returns=>Node)
    async remove(@Arg("id",type=>ID) id:string,@Ctx() ctx: Context){

    }
}