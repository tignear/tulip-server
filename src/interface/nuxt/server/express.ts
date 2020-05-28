import "reflect-metadata";
import { ApolloServer } from 'apollo-server-express';
import * as crypto from 'crypto'
import Context, { UserInfo } from "../../graphql/context";
import parseBearerToken from 'parse-bearer-token';
import { V2 as Paseto } from "paseto";
import { ScopeType, stringToEnum } from "../../..//models/auth/scope";
import { User } from "../../../models/user";
import express from 'express';
import Auth from "../../express/middleware/auth";
import Container, { Inject } from "typedi";
import { GraphQLSchema } from "graphql";
import bodyParser from "body-parser"
import cookies from "cookie-parser";
export default class ServerMiddleware {
    app:Promise<express.Application>;
    constructor(
        @Inject("paseto.v2.local.key") private readonly localKey: crypto.KeyObject,
        @Inject("graphql.schema") private readonly schema: GraphQLSchema,
    ){
        this.app=this.init();
    }
    async middleware() {
        return (await this.app);
    }
    async init() {
        const app = express();
        const auth=Container.get(Auth);
        app.use(bodyParser.json());
        app.use(cookies())
        app.get("/auth", auth.middlewareGet.bind(auth));
        app.post("/auth", auth.middlewarePost.bind(auth))
        const schema =this.schema

        const server = new ApolloServer(
            {
                schema,
                playground: true,
                context: async ({ req }) => {
                    const bearer = parseBearerToken(req);
                    let scope: ScopeType[] | undefined;
                    let userInfo: UserInfo | undefined;

                    if (bearer) {
                        const obj: any = await Paseto.decrypt(bearer, this.localKey);
                        const userDbId = User.toDbId(obj.sub);
                        if (!userDbId) {
                            throw new Error("invalid bearer token");
                        }
                        userInfo = new UserInfo(userDbId, obj.aud);
                        scope = stringToEnum(obj.scp);
                    }
                    const context = new Context(scope ?? []);

                    context.userInfo = userInfo;
                    return context;
                }
            }
        );
        server.graphqlPath = "graphql";
        server.applyMiddleware({ app });
        return app;
    }
}