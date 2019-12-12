import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, Column } from "typeorm";
import { Node } from "../relay";
import { ObjectType, Field, ID } from "type-graphql";
import { ScopeType, stringToEnum } from "./scope";
import GrantType, { stringToGrantType } from "./grant-type";
import AuthorizationResponseType, { stringToAuthorizationResponseType } from "./authorization-response-type";

@ObjectType({implements:Node})
@Entity()
export class RelyingParty extends Node{
    @PrimaryGeneratedColumn("uuid")
    dbId?:string;
    @Field(type=>ID)
    get id():string|undefined{
        return this.dbId?RelyingParty.toId(this.dbId):undefined;
    }
    static toId(id:string){
        return 'auth.rp.'+id;
    }
    static toDbId(id:string):string|undefined{
        const arr=id.split(".");
        if(arr.length!==3||arr[0]!=="auth"||arr[1]!=="rp"){
            return undefined;
        } 
        return arr[2];
    }
    @OneToMany(type=>RelyingPartyRedirectUri,uri=>uri.id)
    dbRedirectUris?:RelyingPartyRedirectUri[];

    @Field(type=>[String!]!)
    get redirectUris():string[]|undefined{
        return this.dbRedirectUris?.map(e=>e.uri);
    }
    @Field()
    @Column()
    tokenEndpointAuthMethod!:string
    @OneToMany(type=>RelyingPartyRedirectUri,grantType=>grantType.id)
    dbGrantTypes?:RelyingPartyGrantType[]

    @Field(type=>[GrantType!]!)
    get grantTypes():GrantType[]|undefined{
        return this.dbGrantTypes?.map(e=>stringToGrantType(e.grantType)!);
    }
    @OneToMany(type=>RelyingPartyResponseType,responseType=>responseType.id)
    dbResponseTypes?:RelyingPartyResponseType[]
    @Field(type=>[AuthorizationResponseType!]! )
    get responseTypes():AuthorizationResponseType[]|undefined{
        return this.dbResponseTypes?.map(e=>stringToAuthorizationResponseType(e.responseType)!);
    }
    @Field()
    @Column()
    clientName!:string
    @Field({nullable:true})
    @Column({nullable:true})
    clientUri?:string

    @Field({nullable:true})
    @Column({nullable:true})
    logoUri?:string
    @OneToMany(type=>RelyingPartyScope,scope=>scope.id)
    dbScopes?:RelyingPartyScope[]
    @Field(type=>[ScopeType!]!)
    get scopes():ScopeType[]|undefined{
        return this.dbScopes?.map(e=>stringToEnum(e.scope)!);
    }
    @OneToMany(type=>RelyingPartyContact,contact=>contact.id)
    dbContacts?:RelyingPartyContact[]
    @Field(type=>[String!])
    get contacts():string[]|undefined{
        return this.dbContacts?.map(e=>e.contact);
    }
    @Field({nullable:true})
    @Column({nullable:true})
    tosUri?:string
    @Field({nullable:true})
    @Column({nullable:true})
    policyUri?:string
}

@Entity()
export class RelyingPartyRedirectUri{
    @PrimaryGeneratedColumn("uuid")
    id?:string;
    @ManyToOne(type=>RelyingParty,rp=>rp.dbId)
    rp?:RelyingParty;
    @Column()
    uri!:string;
}
@Entity()
export class RelyingPartyGrantType{
    @PrimaryGeneratedColumn("uuid")
    id?:string;
    @ManyToOne(type=>RelyingParty,rp=>rp.dbId)
    rp?:RelyingParty;
    @Column()
    grantType!:string;
}
@Entity()
export class RelyingPartyResponseType{
    @PrimaryGeneratedColumn("uuid")
    id?:string;
    @ManyToOne(type=>RelyingParty,rp=>rp.dbId)
    rp?:RelyingParty;
    @Column()
    responseType!:string;
}
@Entity()
export class RelyingPartyScope{
    @PrimaryGeneratedColumn("uuid")
    id?:string;
    @ManyToOne(type=>RelyingParty,rp=>rp.dbId)
    rp?:RelyingParty;
    @Column()
    scope!:string;
}
@Entity()
export class RelyingPartyContact{
    @PrimaryGeneratedColumn("uuid")
    id?:string;
    @ManyToOne(type=>RelyingParty,rp=>rp.dbId)
    rp?:RelyingParty;
    @Column()
    contact!:string;
}