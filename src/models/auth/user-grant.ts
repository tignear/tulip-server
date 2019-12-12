import { User } from "../user";
import { ManyToOne, Column, PrimaryGeneratedColumn, Entity, Index, RelationId } from "typeorm";
import { RelyingParty } from "./relying-party";
@Entity()
@Index(["userDbId", "rpDbId", "scope"], { unique: true })
export default class UserGrant{
    @PrimaryGeneratedColumn("uuid")
    id!:string;
    @ManyToOne(type=>User,user=>user.dbId)
    user?:User;
    @Column("uuid",{nullable:true})
    userDbId!:string;
    @ManyToOne(type=>RelyingParty,user=>user.dbId)
    rp?:RelyingParty
    @Column("uuid",{nullable:true})
    rpDbId!:string;
    @Column()
    scope!:string
}