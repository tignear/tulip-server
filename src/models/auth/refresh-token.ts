import { Entity, ManyToOne, Column, CreateDateColumn, OneToMany, PrimaryGeneratedColumn, Index, JoinColumn, OneToOne, Code, UpdateDateColumn } from "typeorm";
import { User } from "../user";
import { RelyingParty } from "./relying-party";
import { AuthorizationCode } from "./authorization-code";
@Entity()
export class RefreshToken{
    constructor(token:string,scopes:RefreshTokenScope[],code?:string){
        this.token=token;
        this.scopes=scopes;
        this.code=code;
    }
    @PrimaryGeneratedColumn()
    readonly id!:string;

    @ManyToOne(type=>User,user=>user.dbId)
    @JoinColumn({name:"userDbId"})
    user?:User;
    @Column("uuid",{nullable:true})
    userDbId!: string;

    @ManyToOne(type=>RelyingParty,rp=>rp.dbId)
    @JoinColumn({name:"relyingPartyDbId"})
    relyingParty?:RelyingParty; 
    @Column("uuid",{nullable:true})
    relyingPartyDbId!:string; 

    @Column()
    @Index({unique:true})
    token:string
    @CreateDateColumn()
    readonly createdAt!:Date;
    @UpdateDateColumn()
    readonly updatedAt!:Date
    @OneToMany(type=>RefreshTokenScope,scopes=>scopes.token)
    scopes:RefreshTokenScope[]
    @Column()
    @Index({unique:true})
    code?:string
}
@Entity()
export class RefreshTokenScope{
    @PrimaryGeneratedColumn("uuid")
    id?:string;

    @ManyToOne(type=>RefreshToken,token=>token.id)
    @JoinColumn({name:"tokenId"})
    token?:RefreshToken;
    @Column({nullable:true})
    tokenId?:string
    @Column()
    scope!:string
}    