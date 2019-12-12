export default class ResolverError implements Error {
    public name = 'ResolverError';
    
        // エラーメッセージを引数にとる
    constructor(public message: string) {}
        //  toStringを適当な形で上書きしておく
    toString() {
        return `${this.name} ${this.message}`;
     }
}