import Container from "typedi";
import * as crypto from "crypto";
import { JWK } from "jose";
import { createConnection, getConnectionManager ,useContainer as ormUseContainer,} from "typeorm";
import { buildSchema, emitSchemaDefinitionFile, registerEnumType } from "type-graphql";
import { UserResolver, UsersOrder } from "./src/interface/graphql/users";
import { NodeResolver } from "./src/interface/graphql/nodes";
import { AuthResolver, TokenType } from "./src/interface/graphql/auth";
import RelyingPartyResolver from "./src/interface/graphql/auth/relying-party";
import { ScopeType } from "./src/models/auth/scope";
import AuthorizationResponseType from "./src/models/auth/authorization-response-type";
import GrantType from "./src/models/auth/grant-type";
import * as fs from "fs";
function registerEnumTypes(){
    registerEnumType(ScopeType, {
        name: "ScopeType"
    });
    registerEnumType(UsersOrder, {
        name: "UsersOrder" // this one is mandatory
    });
    registerEnumType(TokenType, {
        name: "TokenType", // this one is mandatory
    });
    registerEnumType(AuthorizationResponseType, {
        name: "AuthorizationResponseType", // this one is mandatory
    });
    registerEnumType(GrantType, {
        name: "GrantType", // this one is mandatory
    });
}
export async function setup(){
    ormUseContainer(Container);

    Container.reset();
    registerEnumTypes();
    Container.set(
        "paseto.v2.local.key",
        await crypto.createSecretKey(await new Promise(resolve=>fs.readFile("./secure/paseto.v2.local.key",(e,d)=>resolve(d)))));//TODO
    Container.set("openid.iss","http://localhost:3000");
    Container.set("openid.authorization_endpoint","http://localhost:3000/auth");
    Container.set("openid.token_endpoint","http://localhost:3000/token")
    Container.set("openid.jwks_uri","http://localhost:3000/keys");
    const priv=await JWK.generate("RSA",4096,{alg:"RS256",use:"sig"},true);
    
    Container.set(
        "jwk.public.publicKey",
        priv.toJWK(false)

    );
    Container.set(
        "jwk.public.privateKey",
        priv
    );
    Container.set(
        "app.authentication.clientDbId",
        ""
    );
    const schema=await buildSchema({
        resolvers: [
            UserResolver,
            NodeResolver,
            AuthResolver,
            RelyingPartyResolver
        ],
        container: Container,
    });
    Container.set(
        "graphql.schema",
        schema
    );
    
    await emitSchemaDefinitionFile("schema.gql", schema);
    const mgr=await getConnectionManager();
    if(!mgr.has("default")){
       await createConnection();
    }
}