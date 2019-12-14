import Container from "typedi";
import { V2 as paseto } from "paseto";
import * as crypto from "crypto";
import { createConnection, getConnectionManager ,useContainer as ormUseContainer,} from "typeorm";
import { buildSchema, emitSchemaDefinitionFile } from "type-graphql";
import { ImageResolver } from "./src/interface/graphql/slideshow/images";
import { OutherResolver } from "./src/interface/graphql/slideshow/outhers";
import { UserResolver } from "./src/interface/graphql/users";
import { NodeResolver } from "./src/interface/graphql/nodes";
import { AuthResolver } from "./src/interface/graphql/auth";
import RelyingPartyResolver from "./src/interface/graphql/auth/relying-party";
export async function setup(){
    ormUseContainer(Container);

    Container.reset();
    Container.set("paseto.v2.local.key",await paseto.generateKey("local"));//TODO
    Container.set("openid.iss","http://localhost");
    const [pub,priv]=await (new Promise((resolve,reject)=>{
        crypto.generateKeyPair("rsa",{modulusLength:4096 },(err,pub,priv)=>{
            if(err){
                reject(err);
                return;
            }
            resolve([pub,priv]);
            return;
        }
    )}));
    Container.set(
        "jwt.public.publicKey",
        pub
    );
    Container.set(
        "jwt.public.privateKey",
        priv
    );
    Container.set(
        "app.authentication.clientDbId",
        ""
    );
    const schema=await buildSchema({
        resolvers: [
            ImageResolver,
            OutherResolver,
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