import "reflect-metadata";
import {emitSchemaDefinitionFile , buildSchema} from 'type-graphql'
import {ImageResolver} from './src/interface/graphql/slideshow/images'
import {OutherResolver} from './src/interface/graphql/slideshow/outhers'
import {UserResolver} from './src/interface/graphql/users'
import {NodeResolver} from './src/interface/graphql/nodes'
(async function(){
    try{
        const schema = await buildSchema({
            resolvers: [ImageResolver,OutherResolver,UserResolver,NodeResolver],
        });
        await emitSchemaDefinitionFile("schema.gql", schema);
    }catch(e){
        console.log(e)
    }
})();

