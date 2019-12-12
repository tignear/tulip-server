import { Entity, ManyToOne, Column, CreateDateColumn, OneToMany, PrimaryGeneratedColumn, Index } from "typeorm";
import { User } from "../user";
import { RelyingParty } from "./relying-party";
@Entity()
export class RefreshToken{
    constructor(token:string,scopes:RefreshTokenScope[]){
        this.token=token;
        this.scopes=scopes;
    }
    @PrimaryGeneratedColumn()
    readonly id!:string;

    @ManyToOne(type=>User,user=>user.dbId)
    user?:User;

    @ManyToOne(type=>RelyingParty,rp=>rp.dbId)
    relyingParty?:RelyingParty; 
    @Column("uuid",{ nullable: true })
    relyingPartyDbId!:string; 

    @Column("uuid",{ nullable: true })
    userDbId!: string;

    @Column()
    @Index({unique:true})
    token:string
    @CreateDateColumn()
    readonly createdAt!:Date;

    @OneToMany(type=>RefreshTokenScope,scopes=>scopes.token)
    scopes:RefreshTokenScope[]
}
@Entity()
export class RefreshTokenScope{
    @PrimaryGeneratedColumn("uuid")
    id?:string;

    @ManyToOne(type=>RefreshToken,token=>token.id)
    token?:RefreshToken;
    @Column({nullable:true})
    tokenId?:string
    @Column()
    scope!:string
}    