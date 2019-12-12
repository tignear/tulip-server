import { Repository } from "typeorm";
import { RelyingParty, RelyingPartyRedirectUri, RelyingPartyGrantType, RelyingPartyResponseType, RelyingPartyScope, RelyingPartyContact } from "../models/auth/relying-party";
import {  Service } from "typedi";
import RelyingPartyQueryService from "./query/relying-party";
import { ScopeType } from "../models/auth/scope";
import GrantType from "../models/auth/grant-type";
import AuthorizationResponseType from "../models/auth/authorization-response-type";
@Service()
export default class RelyingPartyService{
    constructor(private readonly relyingPartyQueryService:RelyingPartyQueryService){

    }
    async checkIdAndRedirectUri(repo:Repository<RelyingParty>,rpdbid:string,redirectUri:string):Promise<void>{
        this.relyingPartyQueryService.checkIdAndRedirectUri(repo,rpdbid,redirectUri);
    }

    async register(
        repo:Repository<RelyingParty>,
        redirectUris:string[],
        tokenEndpointAuthMethod:string,
        grantTypes:GrantType[],
        responseTypes:AuthorizationResponseType[],
        clientName:string,
        clientUri:string|undefined,
        logoUri:string|undefined,
        scopes:ScopeType[],
        contacts:string[],
        tosUri:string|undefined,
        policyUri:string|undefined){
        const rp=new RelyingParty();
        rp.dbRedirectUris=redirectUris.map(e=>{
            const r=new RelyingPartyRedirectUri();
            r.uri=e;
            return r;
        });
        rp.tokenEndpointAuthMethod=tokenEndpointAuthMethod;
        rp.dbGrantTypes=grantTypes.map(e=>{
            const r=new RelyingPartyGrantType();
            r.grantType=GrantType[e];
            return r;
        });
        rp.dbResponseTypes=responseTypes.map(e=>{
            const r=new RelyingPartyResponseType();
            r.responseType=AuthorizationResponseType[e];
            return r;
        });
        rp.clientName=clientName;
        rp.clientUri=clientUri;
        rp.logoUri=logoUri;
        rp.dbScopes=scopes.map(e=>{
            const r=new RelyingPartyScope();
            r.scope=ScopeType[e];
            return r;
        });
        rp.dbContacts=contacts.map(e=>{
            const r=new RelyingPartyContact();
            r.contact=e;
            return r;
        });
        rp.tosUri=tosUri;
        rp.policyUri=policyUri;
        const created=await repo.save(rp);
        console.log(created)
        return created;
    }
}