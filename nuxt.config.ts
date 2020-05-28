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
        modules:[
            "@nuxt/http",
        ],
        plugins:[
            "../plugins/tulip.ts",

        ],
        //modules: ['@nuxtjs/apollo'],
        buildModules: ['@nuxt/typescript-build' ],
        extensions: ['ts'],
        
        build:{
            babel:{
                plugins: [["@babel/plugin-proposal-decorators", { "legacy": true }]],
                presets({ isServer }) {
                    return [[require.resolve('@nuxt/babel-preset-app'),
                    // require.resolve('@nuxt/babel-preset-app-edge'), // For nuxt-edge users
                    {
                      buildTarget: isServer ? 'server' : 'client',
                      corejs: { version: 3 }
                    }]];
                },
                
            }
        },

    }
    return conf;
}
