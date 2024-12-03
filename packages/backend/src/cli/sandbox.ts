import vm from 'vm';
import util from 'util';

import * as common from '@screeps/common/src';
import StorageInstance from '@screeps/common/src/storage';

import type { ISandboxObject } from '../interfaces/sandbox-object';

import * as map from './map';
import * as bots from './bots';
import * as strongholds from './strongholds';
import * as system from './system';
import help from './help';

const config = common.configManager.config;

Object.assign(config.cli, {
    createSandbox(outputCallback: any) {
        if (!/at Object\.create/.test(new Error().stack!.split(/\n/)[2])) {
            console.error("config.cli.createSandbox is deprecated, please use config.cli.onCliSandbox instead");
        }
        const sandbox: ISandboxObject = {
            print() {
                outputCallback(Array.prototype.slice.apply(arguments).map(i => util.inspect(i)).join(" "));
            },
            storage: StorageInstance,
            map,
            bots,
            strongholds,
            system,
        };

        help(sandbox);

        config.cli.emit('cliSandbox', sandbox);

        return sandbox;
    }
});

function create(outputCallback: any) {

    const context = vm.createContext(config.cli.createSandbox(outputCallback));

    return (command: any) => {
        try {
            const result = vm.runInContext(command, context);
            if (result && result.then) {
                result.then(
                    (data: any) => {
                        if (data) {
                            outputCallback(util.inspect(data), true);
                        }
                    },
                    (err: any) => {
                        outputCallback("Error: " + (err.stack || err), true);
                    }
                );
            }
            else {
                outputCallback("" + result, true);
            }

        }
        catch (e: any) {
            outputCallback(e.toString(), true);
        }
    };
}

export { create };
