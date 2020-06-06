import "reflect-metadata";
import Container, { Inject } from "typedi";
import { GraphQLSchema } from "graphql";
import express,* as Express from 'express';
import bodyParser from "body-parser";
import cookies from "cookie-parser";
import helmet from "helmet";
import nocache from "nocache";
import parseBearerToken from 'parse-bearer-token';
import * as crypto from 'crypto';
import { V2 as Paseto } from "paseto";
import { ApolloServer } from 'apollo-server-express';
import { ScopeType, stringToEnum } from "../../../models/auth/scope";
import Context, { UserInfo } from "../../graphql/context";

import { User } from "../../../models/user";
import Auth from "../../express/middleware/auth";
import Token from "../../express/middleware/token";
import Discovery from "../../express/middleware/discovery";

const unless = function(middleware:(req:Express.Request,res:Express.Response,next:Express.NextFunction)=>Express.RequestHandler, ...paths:string[]) {
    return function(req:Express.Request,res:Express.Response,next:Express.NextFunction) {
      const pathCheck = paths.some(path => path === req.path);
      pathCheck ? next() : middleware(req, res, next);
    };
};
export default class ServerMiddleware {
    app:Promise<Express.Application>;
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
        const token=Container.get(Token);
        const discovery=Container.get(Discovery);
        app.use("/auth",bodyParser.json());
        app.use("/token",bodyParser.urlencoded());
        app.use(helmet({
            frameguard:{
                action:"deny"
            }
        }));
        app.use(["/auth","/token"],nocache());
        app.use("/auth",cookies());
        app.get("/auth", auth.middlewareGet.bind(auth));
        app.post("/auth", auth.middlewarePost.bind(auth));
        app.post("/token",token.middlewarePost.bind(token));
        app.get("/.well-known/openid-configuration",discovery.ep.bind(discovery));
        app.get("/keys",discovery.keys.bind(discovery));
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