import _ from 'lodash';

import { bufferFromBase64, evalCode } from "../runtime-driver";

export function requireFn(this: any, moduleName: any) {

    moduleName = moduleName.replace(/^\.\//, '');

    if (!(moduleName in this.globals.require.cache)) {

        if (_.isUndefined(this.codeModules[moduleName])) {
            throw new Error(`Unknown module '${moduleName}'`);
        }

        if (_.isObject(this.codeModules[moduleName]) && this.codeModules[moduleName].binary !== undefined) {
            this.globals.require.cache[moduleName] = bufferFromBase64(this.codeModules[moduleName].binary);
        }
        else {
            this.globals.require.cache[moduleName] = -1;

            const moduleObject: Record<string, any> = {
                exports: {},
                user: this.runtimeData.user._id,
                timestamp: this.runtimeData.userCodeTimestamp,
                name: moduleName,
                code: this.codeModules[moduleName]
            };

            try {
                evalCode(moduleObject, this.globals, false, this.timeout, this.scriptCachedData);
            }
            catch (e) {
                delete this.globals.require.cache[moduleName];
                throw e;
            }

            this.globals.require.cache[moduleName] = moduleObject.exports;
            if (moduleObject.__initGlobals) {
                this.globals.require.initGlobals = this.globals.require.initGlobals || {};
                this.globals.require.initGlobals[moduleName] = moduleObject.__initGlobals;
            }
        }
    }
    else if (this.globals.require.cache[moduleName] === -1) {
        throw new Error(`Circular reference to module '${moduleName}'`)
    }
    return this.globals.require.cache[moduleName];
};
