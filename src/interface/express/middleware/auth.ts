import { Service } from 'typedi';
import * as Express from 'express';
import { Transaction, Repository, TransactionRepository } from 'typeorm';
import AuthService, { AccessToken } from '../../../services/auth';
import AutoLogin from '../../../models/auth/auto-login';
import RelyingPartyService from '../../../services/relying-party';
import { RelyingParty } from '../../../models/auth/relying-party';
import UserGrant from '../../../models/auth/user-grant';
import { stringToEnum, ScopeType } from '../../../models/auth/scope';
import { User } from '../../../models/user';
import { AuthorizationCode } from '../../../models/auth/authorization-code';
import { buildURI } from '../../util';
import { RefreshToken } from '../../../models/auth/refresh-token';
@Service()
export default class Auth{
    constructor(
        private readonly authService:AuthService,
        private readonly rpService:RelyingPartyService

    ){

    }
    middlewareGet(req: Express.Request, res:Express.Response, next:Express.NextFunction){
        this.internal(req,res,next).catch(next);
    }
    middlewarePost(req: Express.Request, res:Express.Response, next:Express.NextFunction){
        this.login(req,res,next)
    }
    @Transaction()
    async login(
        req: Express.Request,
         res:Express.Response, 
         next:Express.NextFunction,
         @TransactionRepository(User) userRepo?:Repository<User>,
         @TransactionRepository(RefreshToken) refreshTokenRepo?:Repository<RefreshToken>,
         @TransactionRepository(AutoLogin) autoLoginRepo?:Repository<AutoLogin>,

        ){
        const rawUserId=req.body.userId;
        if(!rawUserId){
            res.json({error:"userId and password does not gived or userId is invalid"});
        }
        const userDbId:string|undefined=User.toDbId(rawUserId);
        const password:string|undefined=req.body.password;
        if(!userRepo||!autoLoginRepo||!refreshTokenRepo){
            throw new Error("Transaction repository does not exist");
        }
        if(!userDbId||!password){
            res.json({error:"userId and password does not gived or userId is invalid"});
            return;
        }
        const r=await this.authService.login(userRepo,refreshTokenRepo,autoLoginRepo,userDbId,password);
        if(!r){
            res.json({error:"login failed"});
            return;
        }
        res.cookie("accessToken",r.accessToken,{maxAge:r.accessTokenValue.exp.getTime()-Date.now(),path:"/auth",sameSite:"lax"});
        res.cookie("autoLoginToken",r.autoLoginToken,{httpOnly:true,maxAge:2*7*24*60*1000,path:"/auth",sameSite:"lax"});//2 weaks
        res.json({accessToken:r.accessToken,refreshToken:r.refreshToken,expiresIn:r.accessTokenValue.exp.getTime(),name:r.user.name});
        return;
    }

    @Transaction()
    private async internal(
        req: Express.Request, res:Express.Response, next:Express.NextFunction,
        @TransactionRepository(RelyingParty) rpRepo?:Repository<RelyingParty>,
        @TransactionRepository(AutoLogin) autoLoginRepo?:Repository<AutoLogin>,
        @TransactionRepository(UserGrant) grantRepo?:Repository<UserGrant>,
        @TransactionRepository(AuthorizationCode) acRepo?:Repository<AuthorizationCode>,
        @TransactionRepository(User) userRepo?:Repository<User>
    ){
        if(!autoLoginRepo||!rpRepo||!grantRepo||!acRepo||!userRepo){
            throw new Error("transaction repository not exist");
        }
        const response_type:string|object|undefined=req.query["response_type"];
        if(!response_type){
            res.locals.status="invalid_request";
            next();
            return;
        }
        if(typeof response_type!=="string"){
            return;
        }

        const rawRpId:string|object|undefined=req.query["client_id"];
        if(!rawRpId){
            res.locals.status="invalid_request";
            next();
            return;
        }
        if(typeof rawRpId!=="string"){
            return;
        }
        const rpDbId=RelyingParty.toDbId(rawRpId);
        const redirect_uri=req.query["redirect_uri"];
        if(!rpDbId||!redirect_uri){
            res.locals.status="invalid_request";
            next();
            return;
        }
        if(typeof redirect_uri!=="string"){
            return;
        }
        let response_typeStringArray:string[]=response_type.split(" ");
        response_typeStringArray=response_typeStringArray.filter(e=>e==="code"||e==="id_token"||e==="token");
        const response_typeStringSet=new Set(response_typeStringArray)
        let type:"code"|"implicit"|"hybrid";
        if(response_typeStringSet.size===1&&response_typeStringSet.has("code")){
            type="code";
        }else if(response_typeStringSet.size===1&&(response_typeStringSet.has("id_token")||response_typeStringSet.has("token"))){
            type="implicit";
        }else if(response_typeStringSet.size===2&&response_typeStringSet.has("id_token")&&response_typeStringSet.has("token")){
            type="implicit";
        }else{
            type="hybrid";
        }
        const checkIdAndRedirectUri=await this.rpService.checkIdAndRedirectUri(rpRepo,rpDbId,redirect_uri);
        if(!checkIdAndRedirectUri){
            res.locals.status="invalid_request";
            next();
            return;
        }
        const accessTokenRaw:string|undefined=req?.cookies?.accessToken;
        const autoLoginToken:string|undefined=req?.cookies?.autoLoginToken;
        const r=await this.authService.autoLogin(autoLoginRepo,accessTokenRaw,autoLoginToken);
        if(!r&&req.query["prompt"]==="none"){
            res.redirect(302,buildURI(redirect_uri,type==="code"?"?":"#",{error:"login_required",state:req.query.state as string}));
            return;
        }
        if(!r){
            res.locals.status="login_required";
            next();
            return;
        }
        res.cookie("accessToken",r.accessToken,{maxAge:r.accessTokenValue.exp.getTime()-Date.now(),path:"/auth",sameSite:"lax"});
        res.cookie("autoLoginToken",r.autoLoginToken,{httpOnly:true,maxAge:1209600*1000,path:"/auth",sameSite:"lax"});//2 weaks
        const userDbId=User.toDbId(r.accessTokenValue.sub);
        if(!userDbId){
            throw new Error("illegal state");
        }
        const scopes:ScopeType[]=(req.query["scope"] as string).split(" ").map((e:string)=>{
            return stringToEnum(e);
        }).filter(e=>e) as ScopeType[];
        const userGrant=await this.authService.checkUserGrant(grantRepo,rpDbId,userDbId,scopes);
        const additionalRequireScopes=userGrant?userGrant.additionalRequireScopes:scopes;
        if(additionalRequireScopes.length!==0&&req.query["prompt"]==="none"){
            
            res.redirect(302,buildURI(redirect_uri,type==="code"?"?":"#",{error:"consent_required",state:req.query.state as string}));
            return;
        }
        if(additionalRequireScopes.length!==0){
            res.locals.status="consent_required";
            res.locals.additionalRequireScopes=additionalRequireScopes;
            res.locals.scopes=scopes;
            next();
            return;
        }
        const nonce:string|undefined=req.query["nonce"] as string;
        const state:string|undefined=req.query["state"] as string;
        switch(type){
            case "code":{
                const r=await this.authService.authorizationCode(acRepo,redirect_uri,nonce,scopes,rpDbId,userDbId);
                res.redirect(302,buildURI(redirect_uri,"?",{code:r.code,state:state}));
                return;
            }
            case "implicit":{
                if(!nonce){
                    res.redirect(302,buildURI(redirect_uri,"#",{error:"invalid_request"}));
                    return;
                }
                const r=await this.authService.authorizationImplicit(userRepo,rpRepo,response_typeStringSet.has("token"),response_typeStringSet.has("id_token"),userDbId,rpDbId,nonce,scopes);
                res.redirect(
                    302,
                    buildURI(
                        redirect_uri,
                        "#",
                        {
                            access_token:r.accessToken,
                            token_type:r.accessToken?"Bearer":undefined,
                            id_token:r.idToken,
                            state:state,
                            expires_in:r.accessTokenValue?Math.floor((r.accessTokenValue.exp.getTime()-Date.now())/1000).toFixed():undefined
                        }
                    )
                );
                return;
            }
            case "hybrid":{
                const r=await this.authService.hybridFlowAuthorization(acRepo,userRepo,response_typeStringSet.has("token"),response_typeStringSet.has("id_token"),userDbId,rpDbId,redirect_uri,scopes,nonce);
                res.redirect(
                    302,
                    buildURI(
                        redirect_uri,
                        "#",
                        {
                            access_token:r.accessToken,
                            token_type:r.accessToken?"Bearer":undefined,
                            id_token:r.idToken,
                            state:state,
                            expires_in:r.accessTokenValue?Math.floor((r.accessTokenValue.exp.getTime()-Date.now())/1000).toFixed():undefined,
                            code:r.code
                        }
                    )
                );
                return;
            }
        }

    }
}
