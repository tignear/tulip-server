import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { User } from "../user";
import { RelyingParty } from "./relying-party";
import { ScopeType } from "./scope";

@Entity()
export class AuthorizationCode{
    constructor(code:string,redirectUri:string,nonce:string|undefined,scopes:AuthorizationCodeScope[]){
        this.code=code;
        this.redirectUri=redirectUri;
        this.nonce=nonce;
        this.scopes=scopes;
    }
    @Column({primary:true})
    code:string

    @ManyToOne(type=>User,user=>user.dbId)
    user?:User
    @Column("uuid",{nullable:true})
    userDbId?:string

    @ManyToOne(type=>RelyingParty,rp=>rp.id)
    rp?:RelyingParty
    @Column("uuid",{nullable:true})
    rpDbId?:string

    @Column()
    redirectUri:string
    
    @Column({nullable:true})
    nonce?:string

    @OneToMany(type=>AuthorizationCodeScope,scopes=>scopes.code)
    scopes?:AuthorizationCodeScope[]
    @CreateDateColumn()
    createdAt!:Date
}
@Entity()
export class AuthorizationCodeScope{
    constructor(scope:string){
        this.scope=scope;
    }
    @PrimaryGeneratedColumn("uuid")
    id?:string;

    @ManyToOne(type=>AuthorizationCode,code=>code.scopes)
    code?:AuthorizationCode;
    @Column({nullable:true})
    codeCode?:string
    @Column()
    scope:string
}    