import deepEqual from 'deep-equal';
import extract from "object-property-extractor"

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

const filter = <T = any>(
    array1: T[],
    callbackfn: (value: T, index: number, array: T[]) => boolean) => {
    return array1.filter(callbackfn);
}

const merge = (target: any, ...sources: any[]) => {
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

const findKey = (obj: any, predicate: any = (o: any) => o): string =>
    Object.keys(obj)
        .find(key => predicate(obj[key], key, obj)) as any;

const assign = (target: any, source: any) => Object.assign(target, source);

const property = (path: string) => {
    return (obj: any) => {
        return extract(obj, path);
    }
}

const sum = (array: any[], iteratee?: string | ((v: any) => number)) => {
    if (!iteratee) {
        return array.reduce((acc, num) => {
            acc += num
            return acc
        }, 0);
    };

    if (typeof iteratee === 'string') {
        return array.reduce((acc, num) => {
            acc += property(iteratee)(num);
            return acc
        }, 0);
    }
    return array.reduce((acc, num) => {
        acc += iteratee(num);
        return acc
    }, 0);
};

const find = <T = any>(
    array1: T[],
    callbackfn: (value: T, index: number, array: T[]) => boolean) => {
    return array1.find(callbackfn);
};

const isEqual = (a: any, b: any) => deepEqual(a, b);

const isNumber = (a: any) => typeof a === 'number';

const some = <T = any>(
    array1: T[],
    callbackfn?: (value: T, index: number, array: T[]) => unknown) => {
    if (callbackfn) {
        return array1.some(callbackfn);
    }
    return array1.some((v) => v);
};

const matches = (obj: Record<string, any>) => {
    const pairs = Object.entries(obj);
    return (s: any) => {
        for (let index = 0; index < pairs.length; index++) {
            const [k, v] = pairs[index];
            if (s[k] !== v) {
                return false;
            }
        }
        return true;
    };
};

const size = (obj: any) => Object.keys(obj).length;

const keys = (obj: any) => Object.keys(obj);

const reduce = <T = any>(
    array1: T[],
    callbackfn: (previousValue: T, value: T, index: number, array: T[]) => T,
    initialValue: T,
) => {
    return array1.reduce(callbackfn, initialValue);
};

const range = (v: number) => Array.from({ length: v }, (_, i) => i);

const times = (v: number, _fn?: any) => Array.from({ length: v }, (_, x) => x);

const zipObject = (keys: any, values: any) =>
    keys.reduce((acc: any, key: any, idx: any) => {
        acc[key] = values[idx]
        return acc
    }, {})

const shuffle = <T>(_array: T[]): T[] => {
    const array = [..._array];
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
};

const defaults = (newValues: any, defaultValues: any) =>
    Object.assign({}, defaultValues, newValues);


const findIndex = <T = any>(
    array1: T[],
    callbackfn: (value: T, index: number, array: T[]) => boolean) => {
    return array1.findIndex(callbackfn);
};

const cloneDeep = (v: any) => structuredClone(v);

const isBoolean = (arg: any) => arg === !!arg

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
    filter,
    merge,
    findKey,
    assign,
    sum,
    find,
    isEqual,
    isNumber,
    some,
    any: some,
    matches,
    size,
    keys,
    property,
    reduce,
    range,
    times,
    zipObject,
    object: zipObject,
    shuffle,
    defaults,
    findIndex,
    cloneDeep,
    isBoolean,
};
