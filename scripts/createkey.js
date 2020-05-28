const paseto=require("paseto");
const fs=require("fs");

(async function(){
    const key=await paseto.V2.generateKey("local");
    await fs.writeFile("./secure/paseto.v2.local.key",  key.export(),  "binary",function(err) { });
})();
