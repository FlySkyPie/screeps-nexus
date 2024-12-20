import _ from 'lodash';

import { makeGameObject } from "./make-game-object";
import { requireFn } from "./require-fn";
import { runCodeCache } from './run-code-cache';

export const init = (
    _globals: any,
    _codeModules: any,
    _runtimeData: any,
    _intents: any,
    _memory: any,
    _fakeConsole: any,
    _consoleCommands: any,
    _timeout: any,
    _getUsedCpu: any,
    _scriptCachedData: any,
    _sandboxedFunctionWrapper: any,
    _getHeapStatistics: any,
    _cpuHalt: any,
) => {

    const userId = _runtimeData.user._id;

    runCodeCache[userId] = runCodeCache[userId] || {};
    runCodeCache[userId].globals = _globals;
    runCodeCache[userId].codeModules = _codeModules;
    runCodeCache[userId].runtimeData = _runtimeData;
    runCodeCache[userId].intents = _intents;
    runCodeCache[userId].memory = _memory;
    runCodeCache[userId].fakeConsole = _fakeConsole;
    runCodeCache[userId].consoleCommands = _consoleCommands;
    runCodeCache[userId].timeout = _timeout;
    runCodeCache[userId].getUsedCpu = _getUsedCpu;
    runCodeCache[userId].scriptCachedData = _scriptCachedData;
    runCodeCache[userId].getHeapStatistics = _getHeapStatistics;
    runCodeCache[userId].cpuHalt = _cpuHalt;
    runCodeCache[userId].sandboxedFunctionWrapper = _sandboxedFunctionWrapper;

    _.extend(runCodeCache[userId].globals, {
        RawMemory: runCodeCache[userId].memory,
        console: runCodeCache[userId].fakeConsole
    });

    if (!runCodeCache[userId].globals._) {
        runCodeCache[userId].globals._ = _.runInContext();
    }

    Object.defineProperty(runCodeCache[userId].globals, 'Memory', {
        configurable: true,
        enumerable: true,
        get() {

            try {
                runCodeCache[userId].memory._parsed = JSON.parse(runCodeCache[userId].memory.get() || "{}");
                runCodeCache[userId].memory._parsed.__proto__ = null;
            }
            catch (e) {
                runCodeCache[userId].memory._parsed = null;
            }

            Object.defineProperty(runCodeCache[userId].globals, 'Memory', {
                configurable: true,
                enumerable: true,
                value: runCodeCache[userId].memory._parsed
            });

            return runCodeCache[userId].memory._parsed;
        }
    });

    runCodeCache[userId].globals.Game = makeGameObject(runCodeCache[userId]);

    if (!runCodeCache[userId].globals.require ||
        runCodeCache[userId].runtimeData.userCodeTimestamp != runCodeCache[userId].globals.require.timestamp ||
        !_.isObject(runCodeCache[userId].globals.require.cache.main) || !_.isFunction(
            runCodeCache[userId].globals.require.cache.main.loop)) {

        runCodeCache[userId].globals.require = requireFn.bind(runCodeCache[userId]);
        runCodeCache[userId].globals.require.cache = { lodash: runCodeCache[userId].globals._ };
        runCodeCache[userId].globals.require.timestamp = runCodeCache[userId].runtimeData.userCodeTimestamp;
    }

    return runCodeCache[userId];
};
