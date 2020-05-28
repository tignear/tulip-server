import { Resolver, Mutation, InputType, Field, Arg, Ctx, ObjectType, createUnionType, ID, Int, Query } from "type-graphql";
import Context from "../context";
import { RefreshToken } from "../../../models/auth/refresh-token";
import { AuthorizationCode } from "../../../models/auth/authorization-code";
import { RelyingParty } from "../../../models/auth/relying-party";
import { ScopeType, stringToEnum } from "../../../models/auth/scope";
import { Service } from "typedi";
import { Transaction, TransactionRepository, Repository } from "typeorm";
import { User } from "../../../models/user";
import AuthService  from "../../../services/auth";
import ResolverError from "../error";
import RelyingPartyService from "../../../services/relying-party";
import GrantType from "../../../models/auth/grant-type";
import AuthorizationResponseType from "../../../models/auth/authorization-response-type";


@InputType()
class AuthorizationInput {
    @Field(type => ScopeType)
    scope!: ScopeType[]
    @Field()
    redirectUri!: string;
    @Field(type => [AuthorizationResponseType!]!)
    responseType!: AuthorizationResponseType[];
    @Field()
    clientId!: string;
    @Field({ nullable: true })
    state?: string;
    @Field({ nullable: true, description: "reply attack protection." })
    nonce?: string;
    @Field(type=>Int, { nullable: true })
    maxAge?: number;
}
@ObjectType()
class CodeFlowAuthorizationResponse {
    constructor(code:string,scope:ScopeType[],state?:string){
        this.code=code;
        this.scope=scope;
        this.state=state;
    }
    @Field(type=>ScopeType)
    scope:ScopeType[]
    @Field()
    code: string
    @Field({nullable:true})
    state?: string
}

@ObjectType()
class ImplicitFlowAuthorizationResponse {
    constructor(accessToken:string|undefined,idToken:string|undefined,expiresIn:number|undefined,state:string|undefined){
        this.accessToken=accessToken;
        this.idToken=idToken;
        this.expiresIn=expiresIn;
        this.state=state;
    }
    @Field({nullable:true})
    readonly accessToken?:string
    @Field(type=>TokenType)
    readonly tokenType:TokenType=TokenType.Bearer;
    @Field({nullable:true})
    readonly idToken?:string
    @Field(type=>Int,{nullable:true})
    readonly expiresIn?:number
    @Field()
    readonly state?: string;
}
@ObjectType()
class HybridFlowAuthorizationResponse{
    constructor(code:string,accessToken:string|undefined,idToken:string|undefined,expiresIn:number|undefined,state:string|undefined){
        this.code=code;

        this.accessToken=accessToken;
        this.idToken=idToken;
        this.expiresIn=expiresIn;
        this.state=state;
    }
    @Field()
    code: string;
    @Field({nullable:true})
    readonly accessToken?:string;
    @Field(type=>TokenType)
    readonly tokenType:TokenType=TokenType.Bearer;
    @Field({nullable:true})
    readonly idToken?:string;
    @Field(type=>Int,{nullable:true})
    readonly expiresIn?:number
    @Field()
    readonly state?: string;
}
const AuthorizationResponse = createUnionType({
    name: "AuthorizationResponse",
    types: () => [CodeFlowAuthorizationResponse, ImplicitFlowAuthorizationResponse,HybridFlowAuthorizationResponse]
});


@InputType()
class TokenInput {
    @Field(type => GrantType)
    readonly grantType!: GrantType;
    @Field({nullable:true})
    readonly code?: string;
    @Field({nullable:true})
    readonly redirectUri?: string;
    @Field({ nullable: true })
    readonly clientId?: string
    @Field({ nullable: true })
    readonly refreshToken?:string;
}
export enum TokenType {
    Bearer
}

@ObjectType()
class TokenResponse {
    constructor(
        accessToken:string,
        expiresIn:number,
        scopes:ScopeType[],
        refreshToken:string,
        idToken:string|undefined
    ){
        this.accessToken=accessToken;
        this.expiresIn=expiresIn;
        this.scopes=scopes;
        this.refreshToken=refreshToken;
        this.idToken=idToken;
    }
    @Field()
    readonly accessToken: string
    @Field()
    readonly tokenType: TokenType=TokenType.Bearer;
    @Field()
    readonly expiresIn: number

    @Field(type => [ScopeType!]!)
    readonly scopes: ScopeType[]
    @Field()
    readonly refreshToken: string
    @Field({ nullable: true })
    readonly idToken?: string
}
/*@ObjectType()
class LoginInput{
    @Field(type=>ID)
    userId!:string
    @Field()
    password!:string
}*/
@Service()
@Resolver()
export class AuthResolver {
    constructor(
       private readonly authService:AuthService,
       private readonly rpService:RelyingPartyService,
    ) {

    }
    
    @Transaction()
    async refresh(
        refreshToken:string,
        @TransactionRepository(RefreshToken) refreshTokenRepo?: Repository<RefreshToken>
    ):Promise<TokenResponse> {
        if (!refreshTokenRepo) {
            throw new ResolverError("Transaction repository does not exist");
        }
        const r=await this.authService.refresh(refreshTokenRepo,refreshToken);
        return new TokenResponse(
            r.accessToken,
            Math.floor(r.accessTokenValue.exp.getTime()/1000),
            r.accessTokenValue.scp.map(e=>stringToEnum(e)!),
            r.refreshToken,
            undefined
        );
    }

    @Mutation(returns => AuthorizationResponse, { description: "only call our web app" })
    async authorization(@Arg("input") input: AuthorizationInput, @Ctx() context: Context): Promise<typeof AuthorizationResponse> {
        if(!context.scopes.includes(ScopeType.ManageAccount)){
            throw new ResolverError("permission denied");
        }

        if(!input.responseType||input.responseType.length===0){
            throw new ResolverError("require responseType.");
        }
        if(input.responseType.length===1){
            switch (input.responseType[0]) {
                case AuthorizationResponseType.Code:
                    return this.authorizationWithCode(input, context);
                case AuthorizationResponseType.IdToken:
                case AuthorizationResponseType.Token:
                    return this.authorizationImplicit(input,context)
            }
        }
        if(input.responseType.length===2){
            if(input.responseType.includes(AuthorizationResponseType.Token)&&input.responseType.includes(AuthorizationResponseType.IdToken)){
                return this.authorizationImplicit(input,context);
            }
        }
        return this.authorizationHybrid(input,context);
    }

    @Transaction()
    async authorizationWithCode(
        input: AuthorizationInput,
        context: Context,
        @TransactionRepository(RelyingParty) rprepo?: Repository<RelyingParty>,
        @TransactionRepository(AuthorizationCode) acrepo?: Repository<AuthorizationCode>
    ): Promise<CodeFlowAuthorizationResponse> {

        if (!input.clientId || !input.redirectUri) {
            throw new ResolverError("client id is must not be null");
        }
        if(!rprepo||!acrepo){
            throw new ResolverError("Transaction repository does not exist");
        }
        if (!input.scope || input.scope.length === 0) {
            throw new ResolverError("invalid scope");
        }
        const rpdbid = RelyingParty.toDbId(input.clientId);

        const userdbid=context.userInfo!.userDbId;
        if(!rpdbid){
            throw new ResolverError("invalid clientId format")
        }
        if(!userdbid){
            throw new ResolverError("invalid userid format")
        }
        if(!this.rpService.checkIdAndRedirectUri(rprepo,rpdbid,input.redirectUri)){
            throw new ResolverError("invalid RedirectUri or clientId");
        }
        const ac=await this.authService.authorizationWithCode(rprepo,acrepo,userdbid,rpdbid,input.redirectUri,input.nonce,input.scope);
        return new CodeFlowAuthorizationResponse(ac.code,input.scope,input.state);
    }
    @Transaction()
    async authorizationImplicit(
        input: AuthorizationInput,
        context: Context,
        @TransactionRepository(RelyingParty) relyingPartyRepo?: Repository<RelyingParty>,
        @TransactionRepository(User) userRepo?: Repository<User>,
    ):Promise<ImplicitFlowAuthorizationResponse>{
        
        if (!input.clientId || !input.redirectUri) {
            throw new ResolverError("client id is must not be null");
        }
        if(!relyingPartyRepo||!userRepo){
            throw new ResolverError("Transaction repository does not exist");
        }
        if(!context.userInfo){
            throw new ResolverError("require token(user info not exist)");
        }
        const rpDbid=RelyingParty.toDbId(input.clientId);
        if(!rpDbid){
            throw new ResolverError("invalid clientId")
        }
        if(!this.rpService.checkIdAndRedirectUri(relyingPartyRepo,rpDbid,input.redirectUri)){
            throw new ResolverError("invalid RedirectUri or clientId");
        }
        if(!input.nonce){
            throw new ResolverError("nonce is required");
        }
        const r=await this.authService.authorizationImplicit(
            userRepo,
            relyingPartyRepo,
            input.responseType.includes(AuthorizationResponseType.Token),
            input.responseType.includes(AuthorizationResponseType.IdToken),
            context.userInfo.userDbId,
            rpDbid,
            input.nonce,
            input.scope,
        );
        return new ImplicitFlowAuthorizationResponse(r.accessToken,r.idToken,r.accessTokenValue?Math.floor(r.accessTokenValue.exp.getTime()/1000):undefined,input.state);
    }
    @Mutation(returns => TokenResponse)
    async token(@Arg("input") input: TokenInput, @Ctx() context: Context): Promise<TokenResponse> {
        switch (input.grantType) {
            case GrantType.AuthorizationCode:
                if(input.clientId&&input.code&&input.redirectUri){
                    return this.tokenWithAuthorizationCode(input.code, input.redirectUri, input.clientId, context);
                }
                throw new ResolverError("clientId code redirectUri required");
            case GrantType.RefreshToken:
                if(!input.refreshToken){
                    throw new ResolverError("refreshTokenrequired");
                }
                return this.refresh(input.refreshToken);
        }
    }
    @Transaction()
    async tokenWithAuthorizationCode(
        code: string,
        redirectUri: string,
        clientId: string,
        context: Context,
        @TransactionRepository(AuthorizationCode) codeRepo?: Repository<AuthorizationCode>,
        @TransactionRepository(RefreshToken) refreshTokenRepo?: Repository<RefreshToken>,
        @TransactionRepository(RelyingParty) rpRepo?: Repository<RelyingParty>,
        ): Promise<TokenResponse>
    {
        if(!codeRepo||!refreshTokenRepo||!rpRepo){
            throw new ResolverError("Transaction Repository not exists");
        }
        const rpDbId=RelyingParty.toDbId(clientId);
        if(!rpDbId){
            throw new ResolverError("clientId format is invalid");
        }
        if(!this.rpService.checkIdAndRedirectUri(rpRepo,rpDbId,redirectUri)){
            throw new ResolverError("invalid RedirectUri or clientId");
        }
        const {accessToken,refreshToken,idToken,accessTokenValue} =await this.authService.tokenWithAuthorizationCode(codeRepo,refreshTokenRepo,code,redirectUri,rpDbId);
        return new TokenResponse(accessToken,Math.floor(accessTokenValue.exp.getTime()/1000),accessTokenValue.scp.map(e=>stringToEnum(e)!),refreshToken,idToken);
    }
    @Transaction()
    async authorizationHybrid(
        input:AuthorizationInput,
        context:Context,
        @TransactionRepository(AuthorizationCode) acRepo?: Repository<AuthorizationCode>, 
        @TransactionRepository(User) userRepo?: Repository<User>,
        @TransactionRepository(RelyingParty) rpRepo?: Repository<RelyingParty>,
    )
    {

        if(!acRepo||!userRepo||!rpRepo){
            throw new ResolverError("transaction repository not exist");
        }
        if(!context.userInfo){
            throw new ResolverError("user is not logged in");
        }
        const rpDbId=RelyingParty.toDbId(input.clientId);
        if(!rpDbId){
            throw new ResolverError("invalid clientId format");
        }
        if(!this.rpService.checkIdAndRedirectUri(rpRepo,rpDbId,input.redirectUri)){
            throw new ResolverError("invalid RedirectUri or clientId");
        }
        const r=await this.authService.hybridFlowAuthorization(
            acRepo,
            userRepo,
            input.responseType.includes(AuthorizationResponseType.Token),
            input.responseType.includes(AuthorizationResponseType.IdToken),
            context.userInfo.userDbId,
            rpDbId,
            input.redirectUri,
            input.scope,
            input.nonce
        );
        return new HybridFlowAuthorizationResponse(r.code,r.accessToken,r.idToken,r.accessTokenValue?Math.floor(r.accessTokenValue.exp.getTime()/1000):undefined,input.state);
    }
}