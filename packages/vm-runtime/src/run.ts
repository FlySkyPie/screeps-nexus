import _ from 'lodash';

import { evalCode } from './runtime-driver';
import { runCodeCache } from './game/run-code-cache';

export const run = (userId: any) => {

    const mainExports = runCodeCache[userId].globals.main;
    if (_.isObject(mainExports) && _.isFunction(mainExports.loop)) {

        if (runCodeCache[userId].globals.require.initGlobals) {
            _.forEach(runCodeCache[userId].globals.require.initGlobals, (i) => i());
        }

        evalCode({
            exports: mainExports,
            user: runCodeCache[userId].runtimeData.user._id,
            timestamp: runCodeCache[userId].runtimeData.userCodeTimestamp,
            name: '__mainLoop',
            code: 'module.exports.loop();'
        }, runCodeCache[userId].globals, false, runCodeCache[userId].timeout);
    }

    if (runCodeCache[userId].consoleCommands) {
        for (let i = 0; i < runCodeCache[userId].consoleCommands.length; i++) {
            const result = evalCode({
                exports: {},
                user: runCodeCache[userId].runtimeData.user._id,
                name: '_console' + new Date().getTime() + '_' + i,
                code: runCodeCache[userId].consoleCommands[i].expression
            }, runCodeCache[userId].globals, true);
            if (!runCodeCache[userId].consoleCommands[i].hidden) {
                runCodeCache[userId].fakeConsole.commandResult(result);
            }
        }
    }
};
