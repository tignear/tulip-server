import { GetterTree, ActionTree, MutationTree } from 'vuex'
import { NuxtHTTPInstance } from "@nuxt/http";
export const state = () => ({
    _accessToken: undefined as string | undefined,
    _refreshToken: undefined as string | undefined
})
export type RootState = ReturnType<typeof state>
export const getters: GetterTree<RootState, RootState> = {
    accessToken: state => state._accessToken,
    refreshToken: state => state._refreshToken
}

export const mutations: MutationTree<RootState> = {
    SET_ACCESS_TOKEN: function(state, accessToken: string){
        state._accessToken = accessToken;
        (this.$tulip as unknown as NuxtHTTPInstance).setToken(accessToken??false,"Bearer");
    },

}
