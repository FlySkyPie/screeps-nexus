import q from 'q';
import _ from 'lodash';

import StorageInstance from '@screeps/common/src/storage';
import { ConfigManager } from '@screeps/common/src/config-manager';

import * as cliServer from './cli/server';
import * as  gameServer from './game/server';
import * as cronjobs from './cronjobs';
import * as utils from './utils';
import { logger } from './logger';

export function start() {

    ConfigManager.load();

    StorageInstance._connect()
        .then(() => cliServer.startServer())
        .then(() => gameServer.startServer())
        .then(() => {
            setInterval(cronjobs.run, 1000);
            for (let i in ConfigManager.config.common.bots) {
                utils.reloadBotUsers(i).catch((e: any) =>
                    logger.error(`Couldn't reload bot AI "${i}": ${e}`));
            }
        })
        .catch((err: any) => {
            logger.error(err);
            process.exit();
        });

    setInterval(() => {
        const rejections = (q as any).getUnhandledReasons();
        rejections.forEach((i: any) => logger.error(`Unhandled rejection: ${i}`));
        (q as any).resetUnhandledRejections();
    }, 1000);

}