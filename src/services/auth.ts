import * as crypto from 'crypto';
import { Inject, Service } from "typedi";
import { Repository, EntityManager, QueryRunner } from "typeorm";
import {V2 as paseto} from 'paseto';
import * as jwt from 'jsonwebtoken';
import { AuthorizationCode, AuthorizationCodeScope } from "../models/auth/authorization-code";
import { ScopeType, stringToEnum } from "../models/auth/scope";
import { RelyingParty } from "../models/auth/relying-party";
import { User } from "../models/user";
import ServiceError from "./error";
import { RefreshToken, RefreshTokenScope } from '../models/auth/refresh-token';
import AutoLogin from '../models/auth/auto-login';
import UserGrant from '../models/auth/user-grant';
import * as R from 'ramda'
export type AccessToken= {
    scp: string[],
    sub: string,
    exp: Date,
    aud: string,
    jti:string
}
export type IdToken= {
    iss: string
    sub: string
    aud: string
    exp: number
    iat: number
    auth_time?: number
    nonce?: string
    acr?: string
    at_hash?: string
    c_hash?: string
};
@Service()
export default class AuthService{
    constructor(
        @Inject("openid.iss") private readonly iss: string,
        @Inject("paseto.v2.local.key") private readonly pasetoLocalKey: crypto.KeyObject,
        @Inject("jwt.public.privateKey") private readonly jwtPublicPrivateKey: crypto.KeyObject,
        @Inject("app.authentication.clientDbId") private readonly authenticationClientId:string
    ){

    }
    async authorizationCode(
        acrepo:Repository<AuthorizationCode>,
        redirectUri:string,
        nonce:string|undefined,
        scope:ScopeType[],
        rpDbId:string,
        userDbId:string,

    ): Promise<AuthorizationCode> {
        const code=crypto.randomBytes(16).toString('base64');
        const ac = new AuthorizationCode(
            code,
            redirectUri,
            nonce,
            scope.map(e => {
                const r = new AuthorizationCodeScope(ScopeType[e]);
                r.codeCode = code;
                return r;
            })
        );
        ac.rpDbId = rpDbId;
        ac.userDbId = userDbId;
        await acrepo.save(ac);
        return ac;
    }
    async accessToken(userDbId:string,clientDbId:string,scopes:ScopeType[],epocSeconds:number){
        const value:AccessToken={
            sub:User.toId(userDbId),
            scp:scopes.map(e=>ScopeType[e]),
            aud:RelyingParty.toId(clientDbId),
            exp:new Date((epocSeconds + 3600)*1000),
            jti:crypto.randomBytes(16).toString('base64')
        }
        return {
            token: await paseto.encrypt(value,this.pasetoLocalKey,{iat:false}),
            value};
    }
    async calcHash(token:string){
        const buf=crypto.createHash("SHA256").update(token, "ascii").digest();
        return buf.slice(0,buf.length/2).toString("base64");
    }
    async idToken(
        userDbId:string,
        lastAuthTime:number,
        clientDbId:string,
        epocSeconds:number,
        nonce:string|undefined,
        acr:string|undefined,
        accessToken:string|undefined,
        code:string|undefined,
        ){

        const value:IdToken={
            aud:RelyingParty.toId(clientDbId),
            sub:User.toId(userDbId),
            iss:this.iss,
            exp: epocSeconds + 600,
            iat:epocSeconds,
            auth_time:lastAuthTime,
            nonce,
            acr,
            at_hash:accessToken?await this.calcHash(accessToken):undefined,
            c_hash: code?await this.calcHash(code):undefined
        }
        return {token:await jwt.sign(value,this.jwtPublicPrivateKey.export({format:"pem",type:"pkcs1"}),{algorithm:'RS256'}),value};
    }
    async authorizationWithCode(
        rprepo:Repository<RelyingParty>,
        acrepo:Repository<AuthorizationCode>,
        userDbId:string,
        rpDbId:string,
        redirectUri:string,
        nonce:string|undefined,
        scope:ScopeType[],

    ){
        //this.relyingPartyService.checkIdAndRedirectUri(rprepo,rpDbId,redirectUri);
        return await this.authorizationCode(acrepo,redirectUri,nonce,scope,rpDbId,userDbId);
    }
    async authorizationImplicit(
        userrepo:Repository<User>,
        rprepo:Repository<RelyingParty>,
        require_accesstoken:boolean,
        require_idtoken:boolean,
        userDbId:string,
        rpDbId:string,
        nonce:string,
        scopes:ScopeType[],
    ){
        //this.relyingPartyService.checkIdAndRedirectUri(rprepo,rpDbId,redirectUri);
        const rp = await rprepo.findOneOrFail(rpDbId).catch(e => undefined);
        if(!rp||!rp.dbId){
            throw new ServiceError("RelyingParty not found");
        }
        let accessToken=undefined;
        let accessTokenValue=undefined;
        const epocSeconds = Math.floor(Date.now() / 1000);
        if(require_accesstoken){
            ({token:accessToken,value:accessTokenValue}=await this.accessToken(userDbId,rpDbId,scopes,epocSeconds));
        }
        if(!require_idtoken){
            return {accessToken,accessTokenValue};
        }
        const user= await userrepo.findOneOrFail(userDbId).catch(e => undefined);
        if(!user||!user.dbId||!user.lastAuthTime){
            throw new ServiceError("user not found");
        }
        const {token:idToken,value:idTokenValue}=await this.idToken(user.dbId!,Math.floor(user.lastAuthTime.getTime()/1000),rp.dbId,epocSeconds,nonce,undefined,accessToken,undefined);
        return ({accessToken,idToken,accessTokenValue,idTokenValue});
    }
    async refreshToken(refreshTokenRepo:Repository<RefreshToken>,userDbId:string,rpDbId:string,scopes:ScopeType[]){
        const refreshToken=crypto.randomBytes(16).toString('base64');
        const refreshTokenEntry=new RefreshToken(refreshToken,scopes.map(
            e=>{
                const r=new RefreshTokenScope();
                r.scope=ScopeType[e];
                return r;
            }));
        refreshTokenEntry.userDbId=userDbId;
        refreshTokenEntry.relyingPartyDbId=rpDbId;
        await refreshTokenRepo.create(refreshTokenEntry);
        return refreshToken;
    }
    async tokenWithAuthorizationCode(
        codeRepo: Repository<AuthorizationCode>,
        refreshTokenRepo: Repository<RefreshToken>,
        code: string,
        redirectUri: string,
        rpDbId: string,
    ){
        const now=Date.now();
        const epocSeconds = Math.floor( now/ 1000);
        const c = await codeRepo.findOneOrFail(code, { relations: ["user"] }).catch(e => undefined);
        if (!c) {
            throw new ServiceError("code not found");
        }
        await codeRepo.delete(code);
        if(now-c.createdAt.getTime()>10*60*1000){
            throw new ServiceError("code expired");
        }
        if (c.redirectUri !== redirectUri) {
            throw new ServiceError("redirectUri not match");
        }
        if (c.rpDbId !== rpDbId) {
            throw new ServiceError("code relying party and clientId not match");
        }

        if (!c.scopes || c.scopes.length === 0) {
            throw new ServiceError("code has'nt scopes");
        }
        const scopes=c.scopes.map(e=>stringToEnum(e.scope)!);
        const {token:accessToken,value:accessTokenValue} =(await this.accessToken(
            c.userDbId!,c.rpDbId,scopes,epocSeconds
        ));
        const refreshToken=await this.refreshToken(refreshTokenRepo,c.userDbId!,c.rpDbId,scopes);

        const openid = scopes.find(e => e === ScopeType.OpenId);
        if (!openid) {
            return {accessToken,accessTokenValue,refreshToken}
        }
        const {token:idToken,value:idTokenValue}=(await this.idToken(
            c.userDbId! ,Math.floor(c.user!.lastAuthTime!.getTime()/1000),c.rpDbId!,epocSeconds,c.nonce,undefined,accessToken,undefined
        ));
        return {accessToken,accessTokenValue,refreshToken,idToken,idTokenValue}
    }
    async refresh(refreshTokenRepo:Repository<RefreshToken>,refreshToken:string){
        const epocSeconds=Math.floor(Date.now()/1000);
        const v = await refreshTokenRepo.findOneOrFail({ where: { token: refreshToken }, select: ["userDbId"] }).catch(e => undefined);
        if(!v){
            throw new ServiceError("refresh token not found");
        }
        const newRefreshToken= v.token = crypto.randomBytes(16).toString('base64');
        await refreshTokenRepo.update(v.id!,v);
        const {token:accessToken,value:accessTokenValue}=await this.accessToken(v.userDbId,v.relyingPartyDbId,v.scopes.map(e=>stringToEnum(e.scope)!),epocSeconds);
        return {refreshToken:newRefreshToken,accessToken,accessTokenValue};
    }
    async hybridFlowAuthorization(
        acRepo:Repository<AuthorizationCode>,
        userRepo:Repository<User>,
        require_token:boolean,
        require_idToken:boolean,
        userDbId:string,
        rpDbId:string,
        redirectUri:string,
        scopes:ScopeType[],
        nonce:string|undefined)
    {
        if(!require_token&&!require_idToken){
            throw new ServiceError("please use code flow");
        }
        const epocSeconds=Math.floor(Date.now()/1000);
        const {code}=await this.authorizationCode(acRepo,redirectUri,nonce,scopes,rpDbId,userDbId);
        let accessToken,accessTokenValue;
        if(require_token){
            ({token:accessToken,value:accessTokenValue}=await this.accessToken(userDbId,rpDbId,scopes,epocSeconds));
        }
        const user=await userRepo.findOneOrFail(userDbId).catch(e=>undefined);
        if(!user){
            throw new ServiceError("user not found");
        }
        let idToken,idTokenValue;
        if(require_idToken){
            ({token:idToken,value:idTokenValue }=await this.idToken(userDbId,Math.floor(user.lastAuthTime!.getTime()/1000),rpDbId,epocSeconds,nonce,undefined,accessToken,code));
        }
        return {accessToken,accessTokenValue,idToken,idTokenValue,code};
    }
    async autoLogin(
        autoLoginRepo:Repository<AutoLogin>,
        accessToken:string|undefined,
        autoLoginToken:string|undefined,
    ){
        const now=Date.now();
        const epocSeconds=Math.floor(now/1000);
        if(accessToken){
            const obj:any=await paseto.decrypt(accessToken,this.pasetoLocalKey,{ignoreExp:true});
            obj.exp=new Date(obj.exp);
            if(obj.exp.getTime()-now>=0){
                return {login:true,accessTokenValue:<AccessToken>obj,accessToken,autoLoginToken};
            }
        }
        if(!autoLoginToken){
            return {login:false};
        }
        const r=await autoLoginRepo.findOneOrFail({where:{
            token:autoLoginToken
        }}).catch(e=>undefined);
        if(!r){
            return {login:false};
        }
        if(now-r.updatedAt.getTime()>2*30*24*60*60*1000){//2month
            return {login:false};
        }
        const {token:newAccessToken,value:accessTokenValue} =await this.accessToken(r.userDbId,this.authenticationClientId,[ScopeType.ManageAccount],epocSeconds);
        r.token=crypto.randomBytes(16).toString('base64');
        await autoLoginRepo.update(r.id,r);
        return {login:true,accessTokenValue,accessToken:newAccessToken,autoLoginToken:r.token};
    }
    async checkUserGrant(grantRepo:Repository<UserGrant>,rpDbId:string,userDbId:string,scopes:ScopeType[]){
        const grants=await grantRepo.find({where:{rpDbID:rpDbId,userDbID:userDbId}});
        const grantedScopes=grants.map(e=>stringToEnum(e.scope));
        const additionalRequireScopes=scopes.filter(e=>!grantedScopes.includes(e))
        return {grantedScopes,additionalRequireScopes};
    }
}