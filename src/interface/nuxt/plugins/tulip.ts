import { NuxtHTTPInstance } from "@nuxt/http"
import { Plugin,Context } from '@nuxt/types'
declare module 'vue/types/vue' {
  interface Vue {
    $tulip: NuxtHTTPInstance
  }
}

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $tulip: NuxtHTTPInstance
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $tulip: NuxtHTTPInstance
  }
}
const plugin:Plugin=({ $http, }:Context&{$http:any}, inject)=>{
    const $tulip=$http.create({});
    inject('tulip', $tulip)
}
export default plugin;