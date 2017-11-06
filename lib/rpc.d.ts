declare class Rpc {
    constructor(config: Rpc.Config);

    session: Rpc.Session;

    listen(port?: number): void;
    connect(user?: string | Rpc.Callback, pass?: string, port?: number, host?: string, cb?: Rpc.Callback): void;
    registerHandler(name: string, handler: Function): void;
}

declare namespace Rpc {

    export interface Result {
        error: number;
        [name: string]: any;
    }

    export interface Session {
        [name: string]: HandlerFunc;
    }

    export interface Callback {
        (err: Error | string | null): void;
    }

    export interface AuthCallback {
        (err: Boolean): void;
    }

    export interface AuthFunc {
        (d: any, user: string, pass: string, cb: AuthCallback): void;
    }

    export interface HandlerCallback {
        (res: Result): void;
    }
    export interface HandlerFunc {
        (dataJson: Object, cb: HandlerCallback): void;
    }

    export interface HandlerHash {
        [name: string]: HandlerFunc;
    }

    export interface Config {
        user?: string,
        pass?: string,
        port?: number,
        host?: string,
        authFunc?: AuthFunc,
        handlerHash?: HandlerHash,
        reconnectDelay?: number
    }

    export import Types = Rpc;
}


export = Rpc;
