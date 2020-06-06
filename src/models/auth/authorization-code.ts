import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, JoinColumn } from "typeorm";
import { User } from "../user";
import { RelyingParty } from "./relying-party";
import { ScopeType } from "./scope";

@Entity()
export class AuthorizationCode{
    constructor(code:string,redirectUri:string,nonce:string|undefined,scopes:AuthorizationCodeScope[],lastUsedAt:Date|null=null){
        this.code=code;
        this.redirectUri=redirectUri;
        this.nonce=nonce;
        this.scopes=scopes;
        this.lastUsedAt=lastUsedAt;
    }
    @Column({primary:true})
    code:string

    @ManyToOne(type=>User,user=>user.dbId)
    @JoinColumn({name:"userDbId"})
    user?:User
    @Column("uuid",{nullable:true})
    userDbId?:string

    @ManyToOne(type=>RelyingParty,rp=>rp.id)
    @JoinColumn({name:"rpDbId"})
    rp?:RelyingParty
    @Column("uuid",{nullable:true})
    rpDbId?:string

    @Column()
    redirectUri:string
    
    @Column({nullable:true})
    nonce?:string

    @OneToMany(type=>AuthorizationCodeScope,scopes=>scopes.code,{cascade:true})
    scopes?:AuthorizationCodeScope[]
    @CreateDateColumn()
    readonly createdAt!:Date

    @Column("datetime",{default:null})
    lastUsedAt:Date|null
}
@Entity()
export class AuthorizationCodeScope{
    constructor(scope:string){
        this.scope=scope;
    }
    @PrimaryGeneratedColumn("uuid")
    id?:string;

    @ManyToOne(type=>AuthorizationCode,code=>code.scopes)
    @JoinColumn({name:"codeCode"})
    code?:AuthorizationCode;
    @Column({nullable:true})
    codeCode?:string
    @Column()
    scope:string
}    