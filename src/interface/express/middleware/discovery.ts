import { Inject, Service } from "typedi";
import { JWK } from "jose";
import * as express from "express";
@Service()
export default class{
    constructor(
        @Inject("openid.iss") private readonly issuer:string,
        @Inject("openid.authorization_endpoint") private readonly authorization_endpoint:string,
        @Inject("openid.token_endpoint") private readonly token_endpoint:string,
        @Inject("openid.jwks_uri") private readonly jwks_uri:string,
        @Inject("jwk.public.publicKey") private readonly publicKey:JWK.Key,
    ){
        
    }
    ep(req:express.Request,res:express.Response){
        return res.send(
            {
                issuer:this.issuer,
                authorization_endpoint:this.authorization_endpoint,
                token_endpoint:this.token_endpoint,
                jwks_uri:this.jwks_uri,
                response_types_supported:["code","token","id_token","code token","code id_token","token id_token","code token id_token"],
                subject_types_supported:["public"],
                id_token_signing_alg_values_supported:["RS256"],
                scopes_supported:["openid"],
                token_endpoint_auth_methods_supported:[]
            }
        );
    }
    keys(req:express.Request,res:express.Response){
        return res.send({keys:[this.publicKey]});
    }
}