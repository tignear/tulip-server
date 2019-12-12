import { Resolver, Mutation, InputType, Arg, Field } from "type-graphql";
import { ScopeType } from "../../../models/auth/scope";
import GrantType from "../../../models/auth/grant-type";
import AuthorizationResponseType from "../../../models/auth/authorization-response-type";
import RelyingPartyService from "../../../services/relying-party";
import { Transaction, Repository, TransactionRepository } from "typeorm";
import { RelyingParty } from "../../../models/auth/relying-party";
import ResolverError from "../error";
import { Inject, Service } from "typedi";

@InputType()
class RegisterRelyingPartyInput{
    @Field(type=>[String!]!)
    redirectUris!:string[];
    @Field()
    tokeEndpointAuthMethod!:string
    @Field(type=>[GrantType!]!)
    grantTypes!:GrantType[]
    @Field(type=>[AuthorizationResponseType!]!)
    responseTypes!:AuthorizationResponseType[]
    @Field()
    clientName!:string
    @Field({nullable:true})
    clientUri?:string
    @Field({nullable:true})
    logoUri?:string
    @Field(type=>[ScopeType!]!)
    scopes!:ScopeType[]
    @Field(type=>[String!],{nullable:true})
    contacts?:string[]
    @Field({nullable:true})
    tosUri?:string
    @Field({nullable:true})
    policyUri?:string
};
@Service()
@Resolver()
export default class RelyingPartyResolver{
    constructor(private readonly rpService:RelyingPartyService){

    }
    
    @Mutation(returns=>RelyingParty)
    @Transaction()
    async registerRelyingParty(
        @Arg("input") input:RegisterRelyingPartyInput,
        @TransactionRepository(RelyingParty) rpRepo?:Repository<RelyingParty>
    ){
        if(!rpRepo){
            throw new ResolverError("transaction repository does not exist");
        }
        return this.rpService.register(
            rpRepo,
            input.redirectUris,
            input.tokeEndpointAuthMethod,
            input.grantTypes,
            input.responseTypes,
            input.clientName,
            input.clientUri,
            input.logoUri,
            input.scopes,
            input.contacts?input.contacts:[],
            input.tosUri,
            input.policyUri
        );
    }
}