export default class ServiceError implements Error {
    public name = 'ServiceError';
    
        // エラーメッセージを引数にとる
    constructor(public message: string) {}
        //  toStringを適当な形で上書きしておく
    toString() {
        return `${this.name} ${this.message}`;
     }
}