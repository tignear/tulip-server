import Container from "typedi";
import { V2 as paseto } from "paseto";
import * as crypto from "crypto";
import { createConnection } from "typeorm";

export async function setup(){
    Container.set("paseto.v2.local.key",paseto.generateKey("local"));//TODO
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
    const conn=await createConnection();
}