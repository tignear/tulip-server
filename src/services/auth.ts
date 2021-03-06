import * as crypto from 'crypto';
import { Inject, Service } from "typedi";
import { Repository } from "typeorm";
import {V2 as paseto} from 'paseto';
import { JWT,JWK } from "jose";
import { AuthorizationCode, AuthorizationCodeScope } from "../models/auth/authorization-code";
import { ScopeType, stringToEnum } from "../models/auth/scope";
import { RelyingParty } from "../models/auth/relying-party";
import { User } from "../models/user";
import ServiceError from "./error";
import { RefreshToken, RefreshTokenScope } from '../models/auth/refresh-token';
import AutoLogin from '../models/auth/auto-login';
import UserGrant, { UserGrantedScope } from '../models/auth/user-grant';
import * as bcrypt from 'bcrypt';
import base64url from "base64url";
import RelyingPartyService from './relying-party';
export type AccessToken= {
    scp: string[],//scope
    sub: string,//userId
    exp: Date,//
    aud: string,//rp
    jti:string//tokenid
    cod?:string
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
        @Inject("jwk.public.privateKey") private readonly jwtPublicPrivateKey:JWK.Key,
        @Inject("app.authentication.clientDbId") private readonly authenticationClientId:string,
        private readonly relyingPartyService:RelyingPartyService
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
        const code=base64url(crypto.randomBytes(64));
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
    async accessToken(userDbId:string,clientDbId:string,scopes:ScopeType[],epocSeconds:number,code?:string|undefined){
        const value:AccessToken={
            sub:User.toId(userDbId),
            scp:scopes.map(e=>ScopeType[e]),
            aud:RelyingParty.toId(clientDbId),
            exp:new Date((epocSeconds + 3600)*1000),
            jti:base64url(crypto.randomBytes(64)),
            cod:code
        }
        return {
            token: await paseto.encrypt(value,this.pasetoLocalKey,{iat:false}),
            value};
    }
    async calcHash(token:string){
        const buf=crypto.createHash("SHA256").update(token, "ascii").digest();
        return base64url(buf.slice(0,buf.length/2));
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
        return {token:JWT.sign(value,this.jwtPublicPrivateKey,{algorithm:"RS256"}),value};
    }
    async authorizationWithCode(
        rprepo:Repository<RelyingParty>,
        acrepo:Repository<AuthorizationCode>,
        grantRepo:Repository<UserGrant>,
        userDbId:string,
        rpDbId:string,
        redirectUri:string,
        nonce:string|undefined,
        scope:ScopeType[],

    ){
        if(!await this.relyingPartyService.checkIdAndRedirectUri(rprepo,rpDbId,redirectUri)){
            throw new ServiceError("check id and redirect uri failed");
        }
        await this.consent(grantRepo,userDbId,rpDbId,scope);
        return await this.authorizationCode(acrepo,redirectUri,nonce,scope,rpDbId,userDbId);
    }
    async authorizationImplicit(
        userrepo:Repository<User>,
        rprepo:Repository<RelyingParty>,
        grantRepo:Repository<UserGrant>,
        require_accesstoken:boolean,
        require_idtoken:boolean,
        userDbId:string,
        rpDbId:string,
        nonce:string,
        scopes:ScopeType[],
    ){
        //this.relyingPartyService.checkIdAndRedirectUri(rprepo,rpDbId,redirectUri);
        const rp = await rprepo.findOne(rpDbId);
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
        const user= await userrepo.findOne(userDbId);
        if(!user||!user.dbId||!user.lastAuthTime){
            throw new ServiceError("user not found");
        }
        const {token:idToken,value:idTokenValue}=await this.idToken(user.dbId!,Math.floor(user.lastAuthTime.getTime()/1000),rp.dbId,epocSeconds,nonce,undefined,accessToken,undefined);
        await this.consent(grantRepo,userDbId,rpDbId,scopes);
        return ({accessToken,idToken,accessTokenValue,idTokenValue});
    }
    async refreshToken(refreshTokenRepo:Repository<RefreshToken>,userDbId:string,rpDbId:string,scopes:ScopeType[],code?:string){
        const refreshToken=base64url(crypto.randomBytes(64));
        const refreshTokenEntry=new RefreshToken(refreshToken,scopes.map(
            e=>{
                const r=new RefreshTokenScope();
                r.scope=ScopeType[e];
                return r;
            }),code);
        refreshTokenEntry.userDbId=userDbId;
        refreshTokenEntry.relyingPartyDbId=rpDbId;
        await refreshTokenRepo.save(refreshTokenEntry);
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
        const c = await codeRepo.findOne(code, { relations: ["user","scopes"] }).catch(e => undefined);
        if (!c) {
            await refreshTokenRepo.delete({"code":code});
            throw new ServiceError("code not found");
        }
        if(c.lastUsedAt){
            await refreshTokenRepo.delete({"code":code});
             
            throw new ServiceError("code used");
        }
        c.lastUsedAt=new Date();
        await codeRepo.save(c);
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
        const refreshToken=await this.refreshToken(refreshTokenRepo,c.userDbId!,c.rpDbId,scopes,code);

        const openid = scopes.find(e => e === ScopeType.OpenId);
        if (!openid) {
            return {accessToken,accessTokenValue,refreshToken};
        }
        const {token:idToken,value:idTokenValue}=(await this.idToken(
            c.userDbId! ,Math.floor(c.user!.lastAuthTime!.getTime()/1000),c.rpDbId!,epocSeconds,c.nonce,undefined,accessToken,undefined
        ));
        return {accessToken,accessTokenValue,refreshToken,idToken,idTokenValue};
    }
    async consent(userGrantRepo:Repository<UserGrant>,userDbId:string,rpDbId:string,scopes:ScopeType[]){
        console.log(userDbId,rpDbId)
        let grant=await userGrantRepo.findOne({where:{rpDbId:rpDbId,userDbId:userDbId}});
        console.log(grant);
        const nscope=scopes.map(e=>new UserGrantedScope(ScopeType[e]));
        if(!grant){
            grant=new UserGrant(userDbId,rpDbId,nscope);

        }else{
            grant.dbScope=nscope;
        }
        return await userGrantRepo.save(grant);

    }
    async refresh(refreshTokenRepo:Repository<RefreshToken>,refreshToken:string){
        const epocSeconds=Math.floor(Date.now()/1000);
        const v = await refreshTokenRepo.findOne({ where: { token: refreshToken }, select: ["userDbId"] });
        if(!v){
            throw new ServiceError("refresh token not found");
        }
        const newRefreshToken= v.token = base64url(crypto.randomBytes(64));
        await refreshTokenRepo.update(v.id!,v);
        const {token:accessToken,value:accessTokenValue}=await this.accessToken(v.userDbId,v.relyingPartyDbId,v.scopes.map(e=>stringToEnum(e.scope)!),epocSeconds);
        return {refreshToken:newRefreshToken,accessToken,accessTokenValue};
    }
    async hybridFlowAuthorization(
        acRepo:Repository<AuthorizationCode>,
        userRepo:Repository<User>,
        grantRepo:Repository<UserGrant>,
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
        const user=await userRepo.findOne(userDbId);
        if(!user){
            throw new ServiceError("user not found");
        }
        let idToken,idTokenValue;
        if(require_idToken){
            ({token:idToken,value:idTokenValue }=await this.idToken(userDbId,Math.floor(user.lastAuthTime!.getTime()/1000),rpDbId,epocSeconds,nonce,undefined,accessToken,code));
        }
        await this.consent(grantRepo,userDbId,rpDbId,scopes);
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
            const obj:any=await paseto.decrypt(accessToken,this.pasetoLocalKey,{ignoreExp:true,ignoreIat:true});
            obj.exp=new Date(obj.exp);
            obj.scp=stringToEnum(obj.scp);
            if(
                obj.exp.getTime()-now>=0&&
                obj.sub===this.authenticationClientId&&
                obj.scp.includes(ScopeType.ManageAccount)
            ){
                return {accessTokenValue:<AccessToken>obj,accessToken,autoLoginToken};
            }
        }
        if(!autoLoginToken){
            return undefined;
        }
        
        const r=await autoLoginRepo.findOne({where:{
            token:autoLoginToken
        }});
        if(!r){
            return undefined;
        }
        if(now-r.updatedAt.getTime()>2*30*24*60*60*1000){//2month
            return undefined;
        }
        const {token:newAccessToken,value:accessTokenValue} =await this.accessToken(r.userDbId,this.authenticationClientId,[ScopeType.ManageAccount],epocSeconds);
        r.token=base64url(crypto.randomBytes(64));
        await autoLoginRepo.update(r.id,r);
        return {accessTokenValue,accessToken:newAccessToken,autoLoginToken:r.token};
    }
    async checkUserGrant(grantRepo:Repository<UserGrant>,rpDbId:string,userDbId:string,scopes:ScopeType[]){
        const grant=await grantRepo.findOne({where:{rpDbId:rpDbId,userDbId:userDbId},relations:["dbScope"]});
        console.log("grant",grant)
        if(!grant||!grant.scope){
            return undefined;
        }
        const grantedScopes=grant.scope;
        const additionalRequireScopes=scopes.filter(e=>!grantedScopes.includes(e))
        return {grantedScopes,additionalRequireScopes};
    }
    async login(
        userRepo:Repository<User>,
        autoLoginRepo:Repository<AutoLogin>,
        userDbId:string,password:string){
            
        const user=await userRepo.findOne(userDbId);
        if(!user){
            return undefined;
        }
        if(!await bcrypt.compare(password,user.mcfPassword)){
            return undefined;
        }
        const epocSeconds=Math.floor(Date.now()/1000);
        const {token:accessToken,value:accessTokenValue} =await this.accessToken(userDbId,this.authenticationClientId,[ScopeType.ManageAccount],epocSeconds);
        const autoLoginToken=AutoLogin.fromUserDbId(userDbId,base64url(crypto.randomBytes(64)));
        await autoLoginRepo.save(autoLoginToken);
        return {user,accessToken,accessTokenValue,autoLoginToken:autoLoginToken.token};
    }
}