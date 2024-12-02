import q from 'q';
import _ from 'lodash';
import { EventEmitter } from 'events';

import * as common from '@screeps/common/src';

import * as cliServer from './cli/server';
import * as  gameServer from './game/server';
import * as cronjobs from './cronjobs';
import * as utils from './utils';

const { config } = common.configManager;

export function start() {

    common.configManager.load();

    common.storage._connect()
        .then(() => cliServer.startServer())
        .then(() => gameServer.startServer())
        .then(() => {
            setInterval(cronjobs.run, 1000);
            for (let i in config.common.bots) {
                utils.reloadBotUsers(i).catch(e => console.error(`Couldn't reload bot AI "${i}": ${e}`));
            }
        })
        .catch(err => {
            console.error(err);
            process.exit();
        });

    setInterval(() => {
        const rejections = q.getUnhandledReasons();
        rejections.forEach((i: any) => console.error('Unhandled rejection:', i));
        q.resetUnhandledRejections();
    }, 1000);

}