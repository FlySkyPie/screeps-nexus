import _ from 'lodash';
import fs from 'fs';
import path from 'path';

import * as strongholds from './strongholds';
import * as system from './system';

const config: any = {
    common: {
        // constants: require('./constants'),
        strongholds: strongholds,
        system: system,
        bots: {}
    }
};

export function load() {
    if (!process.env.MODFILE) {
        throw new Error('MODFILE environment variable is not set!');
    }
    const modsJsonFilename = path.resolve(process.cwd(), process.env.MODFILE);
    try {
        fs.statSync(modsJsonFilename);
    }
    catch (e) {
        console.log(`File "${modsJsonFilename}" not found`);
        return;
    }

    try {
        const modsJson = require(modsJsonFilename);
        console.log(`Loading mods from "${modsJsonFilename}"`);
        if (!modsJson.mods) {
            return;
        }

        modsJson.mods.forEach((file: any) => {
            file = path.resolve(path.dirname(modsJsonFilename), file);
            try {
                const mod = require(file);
                if (!_.isFunction(mod)) {
                    console.error(`Cannot load "${file}": module.exports is not a function!`);
                }
                else {
                    mod(config);
                    console.log(' - ' + file);
                }
            }
            catch (e: any) {
                console.error(`Error loading "${file}": ${e.stack || e}`);
            }
        });

        if (modsJson.bots) {
            config.common.bots = _.mapValues(modsJson.bots, i => path.resolve(path.dirname(modsJsonFilename), i));
        }
    }
    catch (e) {
        console.error(`Cannot open "${modsJsonFilename}": ${e}`);
    }
}

export { config };
