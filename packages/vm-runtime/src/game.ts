import _ from 'lodash';

import * as driver from './runtime-driver';

const runCodeCache: Record<string, any> = {};

export const run = (userId: any) => {

    const mainExports = runCodeCache[userId].globals.main;
    if (_.isObject(mainExports) && _.isFunction(mainExports.loop)) {

        if (runCodeCache[userId].globals.require.initGlobals) {
            _.forEach(runCodeCache[userId].globals.require.initGlobals, (i) => i());
        }

        driver.evalCode({
            exports: mainExports,
            user: runCodeCache[userId].runtimeData.user._id,
            timestamp: runCodeCache[userId].runtimeData.userCodeTimestamp,
            name: '__mainLoop',
            code: 'module.exports.loop();'
        }, runCodeCache[userId].globals, false, runCodeCache[userId].timeout);
    }

    if (runCodeCache[userId].consoleCommands) {
        for (let i = 0; i < runCodeCache[userId].consoleCommands.length; i++) {
            const result = driver.evalCode({
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
