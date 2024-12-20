import _ from 'lodash';

import { create as createPathFinder } from '@screeps/driver/src/path-finder';

class EvalCodeError extends Error {
    constructor(public readonly message: string) {
        super(message);
    };
}

const runtimeCache: Record<string, any> = {};
const worldSize: number = (global)._worldSize;

export function bufferFromBase64(base64: string) {
    return Buffer.from(base64, 'base64');
}

export function getWorldSize() {
    return worldSize;
}

export function evalCode(
    _module: Record<string, any>,
    globals: any,
    returnValue: boolean,
    timeout?: any,
    _scriptCachedData?: any) {

    const options: Record<string, any> = { filename: _module.name };

    const oldModule = globals.__module || {};

    globals.__module = _module;

    if (!_.isUndefined(timeout) && timeout !== null && timeout !== 0 && timeout != Infinity) {
        options.timeout = timeout + 5;
        if (options.timeout < 30) {
            options.timeout = 30;
        }
    }

    // if(scriptCachedData) {
    //     options.produceCachedData = true;
    //     if(scriptCachedData.cachedData && scriptCachedData.cachedData[module.name]) {
    //         options.cachedData = scriptCachedData.cachedData[module.name];
    //     }
    // }

    try {

        let result: any;

        if (returnValue) {
            var code = '(function(code,module,exports) { return "" + eval(code); })(' + JSON.stringify(_module.code) + ', __module, __module.exports)';
            result = global._isolate.compileScriptSync(code, options).runSync(global._context, options);
        }
        else {

            if (!runtimeCache[_module.user] || !runtimeCache[_module.user].modules[_module.name] ||
                runtimeCache[_module.user].modules[_module.name].timestamp != _module.timestamp) {

                var code = '(function __module(module,exports){ ' + _module.code + "\n})(__module, __module.exports)";

                const script: any = global._isolate.compileScriptSync(code, options);

                // if(scriptCachedData) {
                //     if(script.cachedDataProduced) {
                //         scriptCachedData.cachedDataProduced = scriptCachedData.cachedDataProduced || {};
                //         scriptCachedData.cachedDataProduced[module.name] = script.cachedData;
                //         //console.log('cached data produced',module.user,module.name,script.cachedData.byteLength);
                //     }
                //     if(script.cachedDataRejected) {
                //         scriptCachedData.cachedDataRejected = true;
                //         //console.log('cached data rejected',module.user,module.name);
                //     }
                //     if(script.cachedDataRejected === false) {
                //         //console.log('cached data accepted',module.user,module.name);
                //     }
                // }

                runtimeCache[_module.user] = runtimeCache[_module.user] || {};
                runtimeCache[_module.user].modules = runtimeCache[_module.user].modules || {};
                runtimeCache[_module.user].modules[_module.name] = {
                    timestamp: _module.timestamp,
                    script
                };
            }

            result = runtimeCache[_module.user].modules[_module.name].script.runSync(global._context, options);
        }

        globals.module = oldModule;

        return result;
    }
    catch (e: any) {

        if (e instanceof EvalCodeError) throw e;

        if (e.message === 'Script execution timed out.') {
            e.message = 'Script execution timed out: CPU time limit reached';
        }

        let message = '';
        if (e.stack) {
            message = e.stack;
            message = message.replace(/</g, '&lt;');
            message = message.replace(/ *at.*?$/, '');
            message = message.replace(/_console\d+:\d+/, 'console');
            message = message.replace(/at __module \((.*)\)/g, 'at $1');
        }
        else {
            message = e.message;
        }
        throw new EvalCodeError(message);
    }
}

export var pathFinder = createPathFinder((global as any)._nativeMod);
