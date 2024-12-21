const map = <T = any, K = any>(
    array1: T[],
    callbackfn: (value: T, index: number, array: T[]) => K) => {
    return array1.map(callbackfn);
}

const isObject = (a: any): a is Object => a instanceof Object;

const isArray = <T = any>(a: any): a is Array<T> => Array.isArray(a);

const contains = <T>(array: T[], value: T) => array.includes(value);

const isString = (a: any) => typeof a === 'string'

const isNaN = (a: any) => Number.isNaN(a);

const isUndefined = (val: any) => val === undefined;

const isFunction = (val: any) => typeof val === 'function';

const forEach = <T = any>(
    array1: T[],
    callbackfn: (value: T, index: number, array: T[]) => void) => {
    array1.forEach(callbackfn);
};

function isPlainObject(value: any) {
    if (typeof value !== 'object' || value === null) return false

    if (Object.prototype.toString.call(value) !== '[object Object]') return false

    const proto = Object.getPrototypeOf(value);
    if (proto === null) return true

    const Ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return (
        typeof Ctor === 'function' &&
        Ctor instanceof Ctor && Function.prototype.call(Ctor) === Function.prototype.call(value)
    );
}

const clone = (object: any) => structuredClone(object);

const extend = (target: any, ...sources: any[]) => {
    const length = sources.length;

    if (length < 1 || target == null) return target;
    for (let i = 0; i < length; i++) {
        const source = sources[i];

        for (const key in source) {
            target[key] = source[key];
        }
    }
    return target;
};

export default {
    map,
    isObject,
    isArray,
    contains,
    isString,
    isNaN,
    isUndefined,
    isFunction,
    forEach,
    isPlainObject,
    clone,
    extend,
};
