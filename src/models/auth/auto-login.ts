import { Entity, Column, ManyToOne, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, Index } from "typeorm";
import { User } from "../user";

@Entity()
export default class AutoLogin{
    private constructor(token:string){
        this.token=token;
    }
    static fromUser(user:User,token:string){
        const r=new AutoLogin(token);
        r.user=user;
        r.userDbId=user.dbId!;
        return r;
    }
    static fromUserDbId(userDbId:string,token:string){
        const r=new AutoLogin(token);
        r.userDbId=userDbId;
        return r;
    }
    @PrimaryGeneratedColumn("uuid")
    id!:string
    @Column("uuid",{nullable:true})
    userDbId!:string

    @ManyToOne(type=>User,user=>user.dbId)
    user?:User

    @Column()
    @Index({unique:true})
    token!:string

    @UpdateDateColumn()
    updatedAt!:Date
}