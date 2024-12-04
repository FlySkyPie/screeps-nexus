declare module "q-json-response" {
    /**
     * @deprecated
     */
    const foo: any;

    export = foo;
}

declare module "steam-webapi" {
    /**
     * @deprecated
     */
    const foo: any;

    export = foo;
}

declare module "passport-token" {
    /**
     * @deprecated
     */
    const foo: any;

    export = foo;

    export const Strategy: any;
}

declare module "greenworks" {
    /**
     * @deprecated
     */
    const foo: any;

    export = foo;

    export const Strategy: any;
}

/**
 * @link https://stackoverflow.com/a/58052244
 */
declare module 'http' {
    interface IncomingMessage {
        rawBody: any;
    }
}