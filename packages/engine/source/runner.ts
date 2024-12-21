import q from 'q';
import _ from 'lodash';

import { ConfigManager } from '@screeps/common/src/config-manager';
import {
    connect, makeRuntime, queue, saveUserIntents,
    saveUserMemory, saveUserMemoryInterShardSegment,
    saveUserMemorySegments, sendConsoleError,
    sendConsoleMessages,
    startLoop
} from '@screeps/driver/src';

function runUser(userId: any) {

    ConfigManager.config.engine!.emit('runnerLoopStage', 'runUser', userId);

    //driver.influxAccumulator.resetTime();

    return makeRuntime(userId)
        .then(saveResult, saveResult);

    function saveResult(runResult: any) {

        ConfigManager.config.engine!.emit('runnerLoopStage', 'saveResultStart', runResult);

        //driver.influxAccumulator.mark('endMakeRuntime');
        if (runResult.console) {
            sendConsoleMessages(userId, runResult.console);
        }
        if (runResult.error) {
            sendConsoleError(userId, runResult.error);
        }

        //driver.resetUserRoomVisibility(userId);

        const promises = [];
        if (runResult.memory) {
            promises.push(saveUserMemory(userId, runResult.memory));
        }
        if (runResult.memorySegments) {
            promises.push(saveUserMemorySegments(userId, runResult.memorySegments));
        }
        if (runResult.interShardSegment) {
            promises.push(saveUserMemoryInterShardSegment(userId, runResult.interShardSegment));
        }
        if (runResult.intents) {
            promises.push(saveUserIntents(userId, runResult.intents));
        }
        return q.all(promises)
            .then(() => {
                ConfigManager.config.engine!.emit('runnerLoopStage', 'saveResultFinish', runResult);
                //driver.influxAccumulator.mark('saveUser');
            })
    }
}

connect('runner')
    .then(() => queue.create('users', 'read'))
    .catch((error: any) => {
        console.error('Error connecting to driver:', error);
        process.exit(1);
    })
    .then((_usersQueue: any) => {

        const usersQueue = _usersQueue;

        startLoop('runner', () => {
            let userId: any, fetchedUserId: any;

            ConfigManager.config.engine!.emit('runnerLoopStage', 'start');

            return usersQueue.fetch()
                .then((_userId: any) => {
                    userId = fetchedUserId = _userId;
                    return runUser(userId);
                })
                .catch((error: any) => console.error('Error in runner loop:', _.isObject(error) && error.stack || error))
                .then(() => usersQueue.markDone(fetchedUserId))
                .finally(() => ConfigManager.config.engine!.emit('runnerLoopStage', 'finish', userId));
        });

    });


if (typeof self == 'undefined') {
    setInterval(() => {
        const rejections = (q as any).getUnhandledReasons();
        rejections.forEach((i: any) => console.error(`Unhandled rejection: ${i}`));
        (q as any).resetUnhandledRejections();
    }, 1000);
}

