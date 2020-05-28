import { Store } from 'vuex'
import { initialiseStores } from '../utils/store-accessor'
const initializer = (store: Store<any>) => initialiseStores(store)
export const plugins = [initializer]
