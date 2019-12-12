import "reflect-metadata";
import { stringToEnum, ScopeType } from "../../../src/models/auth/scope";

describe("scope",()=>{
    describe("stringToEnum",()=>{
        test("string",()=>{
            expect(stringToEnum("openid")).toBe(ScopeType.OpenId)
            expect(stringToEnum("OpenId")).toBe(ScopeType.OpenId)
            expect(stringToEnum("OPENID")).toBe(ScopeType.OpenId)
            expect(stringToEnum("ManageAccount")).toBe(ScopeType.ManageAccount)
        })
        test("string-array",()=>{
            expect(stringToEnum(["openid","ManageAccount"])).toEqual([ScopeType.OpenId,ScopeType.ManageAccount])
            expect(stringToEnum(["OpenId","ManageAccount"])).toEqual([ScopeType.OpenId,ScopeType.ManageAccount])
            expect(stringToEnum(["OPENID","MissingEntry"])).toEqual([ScopeType.OpenId])
            expect(stringToEnum([])).toEqual([])
            expect(stringToEnum(["OPENID"])).toEqual([ScopeType.OpenId])
        })
        test("undefined",()=>{
            expect(stringToEnum(undefined)).toBeUndefined()
        })
    })
})
