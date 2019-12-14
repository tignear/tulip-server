type State={
    userData:UserData|undefined
};
type UserData={
    userId:string,
    accessToken:string,
};
export const state:()=>State= () => ({
    userData:undefined
})
  
export const mutations = {
    setUserData(userId:string,accessToken:string){
        
    },
    unsetUserData(){
    }
}