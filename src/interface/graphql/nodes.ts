import { InputType,Resolver,Ctx,Query, ID, Arg, Mutation } from "type-graphql";
import {Node} from "../../models/relay";
import Context from "./context";
import * as R from "ramda";
import DataLoader from "dataloader";
import Container from "typedi";
import Loaders from "./loaders";

@Resolver()
export class NodeResolver{
    constructor(private readonly loaders:Loaders){

    }
    tree={
        user:this.loaders.userFromUserDbIdLoader
    }
    @Query(returns=>Node)
    async node(@Arg("id",type=>ID) id:string,@Ctx() ctx: Context){
        const s=id.split(".");
        console.log(s);
        const r=await R.path<DataLoader<string,Node>>(R.init(s),this.tree)?.load(R.last(s)!);
        console.log(r)
        return r;
    }
    @Mutation(returns=>Node)
    async remove(@Arg("id",type=>ID) id:string,@Ctx() ctx: Context){

    }
}