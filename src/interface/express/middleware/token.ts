import * as Express from "express";
import { Transaction, TransactionRepository, Repository } from "typeorm";
import { AuthorizationCode } from "../../../models/auth/authorization-code";
import AuthService from "../../../services/auth";
import { RefreshToken } from "../../../models/auth/refresh-token";
import { Service } from "typedi";
import { RelyingParty } from "../../../models/auth/relying-party";
type TokenResponce={
    access_token:string,
    token_type:"Bearer",
    expires_in:number,//int
    refresh_token:string,
    id_token?:string
};
@Service()
export default class{
    constructor(private readonly authService:AuthService){

    }

    public middlewarePost(req: Express.Request, res:Express.Response, next:Express.NextFunction){
        this.internal(req,res,next);
    }
    private async internal(req: Express.Request, res:Express.Response, next:Express.NextFunction){
        if(!req.is("application/x-www-form-urlencoded")){
            return res.send(400);
        }
        const rawCode=req.body.code
        const rawRedirectUri=req.body.redirect_uri
        const rawClientId=req.body.client_id
        if(req.body.grant_type==="authorization_code"){
            if(!rawCode||!rawRedirectUri||!rawClientId){
                return res.status(400).send({error:"invalid_request"});
            }
            const code=await this.code(rawCode,rawRedirectUri,rawClientId);
            const {accessToken,idToken,refreshToken,accessTokenValue}=code;
            const result:TokenResponce={
                access_token:accessToken,
                token_type:"Bearer",
                expires_in:Math.floor((accessTokenValue.exp.getTime()-Date.now())/1000),
                refresh_token:refreshToken
            }
            if(idToken){
                result.id_token=idToken;
            }
            return res.send(result);
        }
        const rawRefreshToken=req.body.refresh_token;
        if(req.body.grant_type==="refresh_token"){
            if(!rawRefreshToken){
                return res.status(400).send({error:"invalid_request"});
            }
            const {accessToken,refreshToken,accessTokenValue}= await this.refresh(rawRefreshToken);
            const result:TokenResponce={
                access_token:accessToken,
                token_type:"Bearer",
                expires_in:Math.floor((accessTokenValue.exp.getTime()-Date.now())/1000),
                refresh_token:refreshToken
            }
        }
    }
    @Transaction()
    private code(
        code:string,
        redirectUri:string,
        clientId:string,
        @TransactionRepository(AuthorizationCode) codeRepo?:Repository<AuthorizationCode>,
        @TransactionRepository(RefreshToken) refreshTokenRepo?:Repository<RefreshToken>,

    ){
        if(!codeRepo|| !refreshTokenRepo){
            throw Error("transaction starting failed");
        }
        const clientDbId=RelyingParty.toDbId(clientId);
        if(!clientDbId){
            throw Error("invalid client_id");
        }
        return this.authService.tokenWithAuthorizationCode(codeRepo,refreshTokenRepo,code,redirectUri,clientDbId)
    }
    @Transaction()
    private refresh(
        refreshToken:string,
        @TransactionRepository(RefreshToken) refreshTokenRepo?:Repository<RefreshToken>,
    ){
        if(!refreshTokenRepo){
            throw Error("transaction starting failed");
        }
        return this.authService.refresh(refreshTokenRepo,refreshToken);
    }
}