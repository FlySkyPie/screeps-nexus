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

const forEach = (
    array1: any[] | Record<string, any>,
    callbackfn: (...arg: any[]) => void) => {
    if (Array.isArray(array1)) {
        array1.forEach(callbackfn);
        return;
    }

    Object.entries(array1).forEach(callbackfn);
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
    predicate: ((value: T, index: number, array: T[]) => boolean) | Record<string, any>) => {
    if (typeof predicate === 'object') {
        return array1.filter(matches(predicate));
    }
    return array1.filter(predicate);
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
    predicate: ((value: T, index: number, array: T[]) => boolean) | Record<string, any>) => {
    if (typeof predicate === 'object') {
        return array1.find(matches(predicate));
    }
    return array1.find(predicate);
};

const isEqual = (a: any, b: any) => deepEqual(a, b);

const isNumber = (a: any) => typeof a === 'number';

const some = <T = any>(
    array1: T[],
    predicate?: ((value: T, index: number, array: T[]) => any) | Record<string, any>) => {
    if (typeof predicate === 'object') {
        return array1.some(matches(predicate));
    }

    if (predicate) {
        return array1.some(predicate);
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

const reduce = (
    array1: any[],
    callbackfn: (previousValue: any, value: any, index: number, array: any[]) => any,
    initialValue: any,
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

const isBoolean = (arg: any) => arg === !!arg;

const indexBy = (array: any[], iteratee: string) => {
    const m = new Map();
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        const k = element[iteratee];
        m.set(k, element);
    }

    return Object.fromEntries(m);
};

const mapValues = <T = any, K = any>(obj: any, callbackfn: (value: T) => K) => {
    const pairs = Array.from(Object.entries<any>(obj));
    const _p = pairs.map(([k, v]) => <const>[k, callbackfn(v)]);

    return Object.fromEntries(_p);
}

const without = (array: any[], ...values: any[]) => {
    return array.filter(item => !values.includes(item));
}

const every = <T = any>(
    array1: T[],
    callbackfn: (value: T, index: number, array: T[]) => boolean) => {
    return array1.every(callbackfn);
};

const uniq = (array: any[]) => [...new Set(array)];

const groupBy = (
    array: any[],
    predicate: ((value: any, index?: number, array?: any[]) => any) | string) => {
    if (typeof predicate === 'string') {
        return array.reduce((r, v,) => {
            const k = property(predicate)(v);

            return ((r[k] || (r[k] = [])).push(v), r);
        }, {})
    }
    return array.reduce((r, v,) => {
        const k = predicate(v);

        return ((r[k] || (r[k] = [])).push(v), r);
    }, {})
};

const take = (arr: any[], qty = 1) => [...arr].splice(0, qty);

const first = (array: any[], v?: number) => {
    if (v === undefined) {
        return array[0];
    }
    return array.slice(0, v)
};

/**
 * @link https://stackoverflow.com/a/31844649
 */
const min = (
    array: any[],
    predicate?: string | ((value: any, index?: number, array?: any[]) => any)) => {
    if (typeof predicate === 'string') {
        const fn = property(predicate);
        return array.reduce((prev, curr) => fn(prev) < fn(curr) ? prev : curr);
    }
    if (typeof predicate === 'function') {
        return array.reduce((prev, curr) => predicate(prev) < predicate(curr) ? prev : curr);
    }


    if (array.length) return Math.min(...array)
}

const max = (
    array: any[],
    predicate?: string | ((value: any, index?: number, array?: any[]) => any)) => {
    if (typeof predicate === 'string') {
        const fn = property(predicate);
        return array.reduce((prev, curr) => fn(prev) > fn(curr) ? prev : curr);
    }
    if (typeof predicate === 'function') {
        return array.reduce((prev, curr) => predicate(prev) < predicate(curr) ? prev : curr);
    }


    if (array.length) return Math.max(...array)
}

const includes = (array: any[], v: any) => array.includes(v);

const pull = <T extends unknown>(sourceArray: T[], ...removeList: T[]): T[] => {
    const removeSet = new Set(removeList);
    return sourceArray.filter(el => !removeSet.has(el));
};


const remove = (
    array: any[],
    predicate: ((value: any, index?: number, array?: any[]) => any) | Record<string, any>) => {
    if (typeof predicate === 'object') {
        const toRemove: any[] = []
        const result = array.filter((item, i) => matches(predicate)(item) && toRemove.push(i))

        toRemove.reverse().forEach(i => array.splice(i, 1))
        return result
    }
    // in order to not mutate the original array until the very end
    // we want to cache the indexes to remove while preparing the result to return
    const toRemove: any[] = []
    const result = array.filter((item, i) => predicate(item) && toRemove.push(i))

    // just before returning, we can then remove the items, making sure we start
    // from the higher indexes: otherwise they would shift at each removal
    toRemove.reverse().forEach(i => array.splice(i, 1))
    return result
};


const difference = (arr1: any[], arr2: any[]) => arr1.filter(x => !arr2.includes(x))

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
    indexBy,
    mapValues,
    without,
    every,
    uniq,
    all: every,
    groupBy,
    take,
    first,
    min,
    includes,
    max,
    pull,
    unique: uniq,
    remove,
    difference,
};
