import "reflect-metadata";
import {useContainer as ormUseContainer, Any, Repository} from "typeorm";
import Container from "typedi"
import {V2 as Paseto} from "paseto";
import { JWT,JWK } from "jose";
import * as crypto from "crypto"
import { AuthorizationCode, AuthorizationCodeScope } from "../../src/models/auth/authorization-code";
import AuthService  from "../../src/services/auth";
import { ScopeType } from "../../src/models/auth/scope";
import RelyingPartyService from "../../src/services/relying-party";
import { RelyingParty } from "../../src/models/auth/relying-party";
import * as datemock from 'jest-date-mock'
import { User } from "../../src/models/user";
import ServiceError from "../../src/services/error";
import { RefreshToken, RefreshTokenScope } from "../../src/models/auth/refresh-token";
ormUseContainer(Container);
const checkIdAndRedirectUri=jest.fn().mockImplementation(()=>{})

beforeAll(async ()=>{
    Container.reset();
    Container.set(
        "paseto.v2.local.key",
        await Paseto.generateKey("local")
    );
    Container.set(
        "openid.iss",
        "https://iamiss.com/"
     );

    const [pub,priv]=await (new Promise((resolve,reject)=>{
        crypto.generateKeyPair("rsa",{modulusLength:4096 },(err,pub,priv)=>{
            if(err){
                reject(err);
                return;
            }
            resolve([pub,priv]);
            return;
        }
    )}));
    Container.set(
        "jwk.public.publicKey",
        pub
    );
    Container.set(
        "jwk.public.privateKey",
        priv
    );
    Container.set(
        RelyingPartyService,
        {
            checkIdAndRedirectUri,
        }
    );
})

describe('authorizationWithCode',()=>{
    let service!:AuthService;
    beforeAll(()=>{

        service=Container.get(AuthService);
    })
    beforeEach(()=>{
        checkIdAndRedirectUri.mockClear();
    })
    afterAll(()=>{
    })
    test("success",async ()=>{
        const codeRepo:any={
            findOneOrFail:jest.fn().mockImplementation((code)=>{
                const arr=[new AuthorizationCodeScope(ScopeType[ScopeType.ManageAccount])]
                const r=new AuthorizationCode(code,"https://example.com/rediret","nonce.this is nonce!",arr);
                r.rpDbId="rprp-uuid-rprp-uuid"
                r.userDbId="user-uuid-user-uuid"
                return r;
            }),
            save:jest.fn()
        };
        const rprepo:any={};
        const grantRepo:any={}
        const ac=await service.authorizationWithCode(
            rprepo,
            codeRepo,
            grantRepo,
            "user-uuid-user-uuid",
            "rprp-uuid-rprp-uuid",
            "https://example.com/rediret",
            "nonce.this is nonce!",
            [ScopeType.ManageAccount],

        );
        expect(ac.code);
        expect(ac.nonce).toBe("nonce.this is nonce!");
        expect(ac.redirectUri).toBe("https://example.com/rediret");
        expect(ac.rpDbId).toBe("rprp-uuid-rprp-uuid");
        const acs=new AuthorizationCodeScope(ScopeType[ScopeType.ManageAccount]);
        acs.codeCode=ac.code;
        expect(ac.scopes).toEqual([acs]);
        expect(ac.userDbId).toBe("user-uuid-user-uuid");
        expect(checkIdAndRedirectUri.mock.calls[0]).toEqual([rprepo,"rprp-uuid-rprp-uuid","https://example.com/rediret"]);
        expect(codeRepo.save.mock.calls[0]).toEqual([ac]);
    })
})
describe("authorizationImplicit",()=>{
    let service!:AuthService;
    let localKey!:crypto.KeyObject;
    let lockTime=Date.now();
    const rp:RelyingParty=new RelyingParty();
    rp.dbId="rprp-uuid-rprp-uuid";
    const user:User=new User()
    user.lastAuthTime=new Date(lockTime-20000);
    user.dbId="user-uuid-user-uuid";
    const userRepo={
        findOneOrFail:jest.fn().mockImplementation(k=>{
            return k===user.dbId?Promise.resolve(user):Promise.reject(k)
        })

    };
    const rpRepo={
        findOneOrFail:jest.fn().mockImplementation(k=>{
            return k===rp.dbId?Promise.resolve(rp):Promise.reject(k)
        })
    }
    const grantRepo={}
    beforeAll(()=>{
        localKey=Container.get("paseto.v2.local.key")
        service=Container.get(AuthService);
        datemock.advanceTo(lockTime);
    })
    beforeEach(()=>{
        userRepo.findOneOrFail.mockClear();
        rpRepo.findOneOrFail.mockClear()
    })
    afterAll(()=>{
        datemock.clear();
    })
    test("success-token",async ()=>{
        const r=await service.authorizationImplicit(
            <any>userRepo,
            <any>rpRepo,
            <any>grantRepo,
            true,false,
            "user-uuid-user-uuid",
            "rprp-uuid-rprp-uuid",
            "nonce.this is nonce!",
            [ScopeType.ManageAccount],
        );
        expect(userRepo.findOneOrFail.mock.calls).toEqual([])
        expect(rpRepo.findOneOrFail.mock.calls).toEqual([["rprp-uuid-rprp-uuid"]])

        expect(r.idToken).toBeUndefined();
        expect(r.idTokenValue).toBeUndefined();
        expect(r.accessToken).not.toBeUndefined();
        expect(r.accessTokenValue).not.toBeUndefined();
        const v=r.accessTokenValue!;
        
        expect(v.aud).toBe(RelyingParty.toId("rprp-uuid-rprp-uuid"));
        expect(v.exp.getTime()-lockTime).toBeGreaterThan(3600*1000-1000);
        expect(v.exp.getTime()-lockTime).toBeLessThan(3600*1000+1000);
        expect(v.scp).toEqual([ScopeType[ScopeType.ManageAccount]]);
        expect(v.sub).toEqual(User.toId("user-uuid-user-uuid"));
        const decrypt:any=await Paseto.decrypt(r.accessToken!,localKey,{});
        decrypt.exp=new Date( decrypt.exp);
        expect(decrypt).toEqual(v);
    });
    test("success-idtoken",async ()=>{
        const r=await service.authorizationImplicit(
            <any>userRepo,
            <any>rpRepo,
            <any>grantRepo,
            false,true,
            "user-uuid-user-uuid",
            "rprp-uuid-rprp-uuid",
            "nonce.this is nonce!",
            [ScopeType.ManageAccount],
        );
        expect(userRepo.findOneOrFail.mock.calls).toEqual([["user-uuid-user-uuid"]])
        expect(rpRepo.findOneOrFail.mock.calls).toEqual([["rprp-uuid-rprp-uuid"]])
        expect(r.idToken).not.toBeUndefined();
        expect(r.idTokenValue).not.toBeUndefined();
        expect(r.accessToken).toBeUndefined();
        expect(r.accessTokenValue).toBeUndefined();
        const v=r.idTokenValue!;
        expect(v.iss).toBe(Container.get("openid.iss"));
        expect(v.iat*1000-lockTime).toBeLessThan(1000);
        expect(v.iat*1000-lockTime).toBeGreaterThan(-1000);
        expect(v.aud).toBe(RelyingParty.toId("rprp-uuid-rprp-uuid"));
        expect(v.exp*1000-lockTime).toBeGreaterThan(600*1000-1000);
        expect(v.exp*1000-lockTime).toBeLessThan(600*1000+1000);
        expect(v.sub).toEqual(User.toId("user-uuid-user-uuid"));
        expect(v.acr).toBeUndefined();
        expect(v.nonce).toBe("nonce.this is nonce!");
        expect(v.at_hash).toBeUndefined();
        expect(v.c_hash).toBeUndefined();
        expect(v.auth_time!*1000-user.lastAuthTime!.getTime()).toBeLessThan(1000);
        const decrypt:any=JWT.verify(r.idToken!,Container.get("jwk.public.publicKey"),{algorithms:["RS256"]});
        
        expect(decrypt).toEqual(v);
    })
    test("success-token-idtoken",async ()=>{
        const r=await service.authorizationImplicit(
            <any>userRepo,
            <any>rpRepo,
            <any>grantRepo,
            true,true,
            "user-uuid-user-uuid",
            "rprp-uuid-rprp-uuid",
            "nonce.this is nonce!",
            [ScopeType.ManageAccount],
        );
        expect(userRepo.findOneOrFail.mock.calls).toEqual([["user-uuid-user-uuid"]])
        expect(rpRepo.findOneOrFail.mock.calls).toEqual([["rprp-uuid-rprp-uuid"]])
        expect(r.idToken).not.toBeUndefined();
        expect(r.idTokenValue).not.toBeUndefined();
        expect(r.accessToken).not.toBeUndefined();
        expect(r.accessTokenValue).not.toBeUndefined();
        
        const vi=r.idTokenValue!;
        expect(vi.iss).toBe(Container.get("openid.iss"));
        expect(vi.iat*1000-lockTime).toBeLessThan(1000);
        expect(vi.iat*1000-lockTime).toBeGreaterThan(-1000);
        expect(vi.aud).toBe(RelyingParty.toId("rprp-uuid-rprp-uuid"));
        expect(vi.exp*1000-lockTime).toBeGreaterThan(600*1000-1000);
        expect(vi.exp*1000-lockTime).toBeLessThan(600*1000+1000);
        expect(vi.sub).toEqual(User.toId("user-uuid-user-uuid"));
        expect(vi.acr).toBeUndefined();
        expect(vi.nonce).toBe("nonce.this is nonce!");
        expect(vi.at_hash).toBe(await service.calcHash(r.accessToken!));
        expect(vi.c_hash).toBeUndefined()
        expect(vi.auth_time!*1000-user.lastAuthTime!.getTime()).toBeLessThan(1000);

        const decrypti:any=JWT.verify(r.idToken!,Container.get("jwk.public.publicKey"),{algorithms:["RS256"]});
        expect(decrypti).toEqual(vi);

        const va=r.accessTokenValue!;
        expect(va.aud).toBe(RelyingParty.toId("rprp-uuid-rprp-uuid"));
        expect(va.exp.getTime()-lockTime).toBeGreaterThan(3600*1000-1000);
        expect(va.exp.getTime()-lockTime).toBeLessThan(3600*1000+1000);
        expect(va.scp).toEqual([ScopeType[ScopeType.ManageAccount]]);
        expect(va.sub).toEqual(User.toId("user-uuid-user-uuid"));

        const decrypta:any=await Paseto.decrypt(r.accessToken!,localKey,{});
        decrypta.exp=new Date( decrypta.exp);

        expect(decrypta).toEqual(va);
    });
    test("invalid-rp",async ()=>{
        const m=service.authorizationImplicit(
            <any>userRepo,
            <any>rpRepo,
            <any>grantRepo,
            true,true,
            "user-uuid-user-uuid",
            "rprp-uuid-inva-uuid",
            "nonce.this is nonce!",
            [ScopeType.ManageAccount],
        );
        expect(rpRepo.findOneOrFail.mock.calls).toEqual([["rprp-uuid-inva-uuid"]])


        await expect(m).rejects.toEqual(new ServiceError("RelyingParty not found"))
    });
    test("invalid-user",async()=>{
        const m=service.authorizationImplicit(
            <any>userRepo,
            <any>rpRepo,
            <any>grantRepo,
            true,true,
            "user-uuid-inva-uuid",
            "rprp-uuid-rprp-uuid",
            "nonce.this is nonce!",
            [ScopeType.ManageAccount],
        );
        await expect(m).rejects.toEqual(new ServiceError("user not found"))
        expect(rpRepo.findOneOrFail.mock.calls).toEqual([["rprp-uuid-rprp-uuid"]])
        expect(userRepo.findOneOrFail.mock.calls).toEqual([["user-uuid-inva-uuid"]])
    });
})
describe("tokenWithAuthorizationCode",()=>{
    const acscopeMa=new AuthorizationCodeScope(ScopeType[ScopeType.ManageAccount]);
    const rtscopeMa=new RefreshTokenScope();
    rtscopeMa.scope=ScopeType[ScopeType.ManageAccount];
    const acscopeOid=new AuthorizationCodeScope(ScopeType[ScopeType.OpenId]);
    const rtscopeOid=new RefreshTokenScope();
    rtscopeOid.scope=ScopeType[ScopeType.OpenId];
    let service!:AuthService
    let lockTime=new Date();
    const refreshTokenRepo={
        create:jest.fn()
    };
    beforeAll(()=>{
        Container.set(RelyingPartyService,{});
        service=Container.get(AuthService);
        datemock.advanceTo(lockTime);
    });
    beforeEach(()=>{
        refreshTokenRepo.create.mockClear()
    })
    afterAll(()=>{
        Container.remove(RelyingPartyService,{});
        datemock.clear();
    });

    test("success-not-openid",async ()=>{
        const codeEntry=new AuthorizationCode("codecodecode","https://example.com/redirect","nonce.this is nonce.",[acscopeMa]);
        (codeEntry as any).createdAt=new Date(lockTime.getTime()-1*60*1000);
        codeEntry.user=new User();
        codeEntry.userDbId="user-uuid-user-uuid";
        codeEntry.user.dbId="user-uuid-user-uuid";
        codeEntry.user.lastAuthTime=new Date(lockTime.getTime()-20*60*1000);
        const codeRepo={
            findOneOrFail:jest.fn().mockImplementation((code)=>{
                return code===codeEntry.code?Promise.resolve(codeEntry):Promise.reject(code)
            }),
            delete:jest.fn()
        };
        const r=await service.tokenWithAuthorizationCode(<any>codeRepo,<any>refreshTokenRepo,codeEntry.code,codeEntry.redirectUri,codeEntry.rpDbId!);
        const v=r.accessTokenValue;
        expect(v.aud).toBe(RelyingParty.toId(codeEntry.rpDbId!));
        expect(v.exp.getTime()-lockTime.getTime()).toBeLessThan(3600*1000+1000);
        expect(v.exp.getTime()-lockTime.getTime()).toBeGreaterThan(3600*1000-1000);
        expect(v.scp).toEqual([ScopeType[ScopeType.ManageAccount]]);
        expect(v.sub).toBe(User.toId(codeEntry.userDbId!));
        const decrypt:any= await Paseto.decrypt(r.accessToken,Container.get("paseto.v2.local.key"));
        decrypt.exp=new Date(decrypt.exp);
        expect(decrypt).toEqual(v);
        const rt=new RefreshToken(r.refreshToken,[rtscopeMa]);
        rt.userDbId="user-uuid-user-uuid";
        expect(refreshTokenRepo.create.mock.calls[0]).toEqual([rt]);
        expect(r.idToken).toBeUndefined();
        expect(r.idTokenValue).toBeUndefined();
        expect(codeRepo.findOneOrFail.mock.calls).toEqual([[codeEntry.code,{relations:["user"]}]])
        expect(codeRepo.delete.mock.calls).toEqual([[codeEntry.code]]);
    });
    test("success-openid",async ()=>{
        const codeEntry=new AuthorizationCode("codecodecode","https://example.com/redirect","nonce.this is nonce.",[acscopeOid]);
        (codeEntry as any).createdAt=new Date(lockTime.getTime()-1*60*1000);
        codeEntry.user=new User();
        codeEntry.userDbId="user-uuid-user-uuid";
        codeEntry.user.dbId="user-uuid-user-uuid";
        codeEntry.user.lastAuthTime=new Date(lockTime.getTime()-20*60*1000);
        const codeRepo={
            findOneOrFail:jest.fn().mockImplementation((code)=>{
                return code===codeEntry.code?Promise.resolve(codeEntry):Promise.reject(code)
            }),
            delete:jest.fn()
        };
        const r=await service.tokenWithAuthorizationCode(<any>codeRepo,<any>refreshTokenRepo,codeEntry.code,codeEntry.redirectUri,codeEntry.rpDbId!);
        const va=r.accessTokenValue;
        expect(va.aud).toBe(RelyingParty.toId(codeEntry.rpDbId!));
        expect(va.exp.getTime()-lockTime.getTime()).toBeLessThan(3600*1000+1000);
        expect(va.exp.getTime()-lockTime.getTime()).toBeGreaterThan(3600*1000-1000);
        expect(va.scp).toEqual([ScopeType[ScopeType.OpenId]]);
        expect(va.sub).toBe(User.toId(codeEntry.userDbId!));
        const decrypta:any= await Paseto.decrypt(r.accessToken,Container.get("paseto.v2.local.key"));
        decrypta.exp=new Date(decrypta.exp);
        expect(decrypta).toEqual(va);
        const rt=new RefreshToken(r.refreshToken,[rtscopeOid]);
        rt.userDbId="user-uuid-user-uuid";
        expect(refreshTokenRepo.create.mock.calls[0]).toEqual([rt]);
        expect(codeRepo.findOneOrFail.mock.calls).toEqual([[codeEntry.code,{relations:["user"]}]])
        expect(codeRepo.delete.mock.calls).toEqual([[codeEntry.code]]);
        const vi=r.idTokenValue!;
        expect(vi.acr).toBeUndefined();
        expect(vi.at_hash).toBe(await service.calcHash(r.accessToken));
        expect(vi.aud).toBe(RelyingParty.toId(codeEntry.rpDbId!));
        expect(vi.auth_time).toBe(Math.floor(codeEntry.user.lastAuthTime.getTime()/1000));
        expect(vi.c_hash).toBeUndefined();
        expect(vi.exp).toBe(Math.floor(lockTime.getTime()/1000)+600);
        expect(vi.iat).toBe(Math.floor(lockTime.getTime()/1000));
        expect(vi.iss).toBe(Container.get("openid.iss"));
        expect(vi.nonce).toBe(codeEntry.nonce);
        expect(vi.sub).toBe(codeEntry.user.id);
        
        const decrypti=JWT.verify(r.idToken!,Container.get("jwk.public.publicKey"));
        expect(decrypti).toEqual(vi);
    });
})