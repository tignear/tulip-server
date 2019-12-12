import { Configuration,Module } from '@nuxt/types'
import ServerMiddleware from './src/interface/nuxt/server/express';
import Container from 'typedi';
import { setup } from './setup';
export default async function(){
    await setup();
    const middleware=Container.get(ServerMiddleware);
    const conf:Configuration={
        srcDir:"./src/interface/nuxt/client/",
        serverMiddleware:[
            {path:"/", handler: await middleware.middleware()},
        ],
        buildModules: ['@nuxt/typescript-build'],
        extensions: ['ts'],
        loaders: {
            ts: {
                configFile:"nuxt.tsconfig.json"
            },

          }
    }
    return conf;
}
