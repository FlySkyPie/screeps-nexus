#!/usr/bin/env node
import q from 'q';
import _ from 'lodash';
import util from 'util';
import utils from './utils';
const driver = utils.getDriver();
const C = driver.constants;

function runUser(userId) {

    driver.config.emit('runnerLoopStage','runUser', userId);

    //driver.influxAccumulator.resetTime();

    return driver.makeRuntime(userId)
        .then(saveResult, saveResult);

    function saveResult(runResult) {

        driver.config.emit('runnerLoopStage','saveResultStart', runResult);

        //driver.influxAccumulator.mark('endMakeRuntime');
        if(runResult.console) {
            driver.sendConsoleMessages(userId, runResult.console);
        }
        if(runResult.error) {
            driver.sendConsoleError(userId, runResult.error);
        }

        //driver.resetUserRoomVisibility(userId);

        const promises = [];
        if(runResult.memory) {
            promises.push(driver.saveUserMemory(userId, runResult.memory));
        }
        if(runResult.memorySegments) {
            promises.push(driver.saveUserMemorySegments(userId, runResult.memorySegments));
        }
        if(runResult.interShardSegment) {
            promises.push(driver.saveUserMemoryInterShardSegment(userId, runResult.interShardSegment));
        }
        if(runResult.intents) {
            promises.push(driver.saveUserIntents(userId, runResult.intents));
        }
        return q.all(promises)
        .then(() => {
            driver.config.emit('runnerLoopStage','saveResultFinish', runResult);
            //driver.influxAccumulator.mark('saveUser');
        })
    }
}

driver.connect('runner')
    .then(() => driver.queue.create('users', 'read'))
    .catch((error) => {
        console.error('Error connecting to driver:', error);
        process.exit(1);
    })
    .then(_usersQueue => {

        const usersQueue = _usersQueue;

        driver.startLoop('runner', () => {
            let userId, fetchedUserId;

            driver.config.emit('runnerLoopStage','start');

            return usersQueue.fetch()
                .then((_userId) => {
                    userId = fetchedUserId = _userId;
                    return runUser(userId);
                })
                .catch((error) => console.error('Error in runner loop:', _.isObject(error) && error.stack || error))
                .then(() => usersQueue.markDone(fetchedUserId))
                .finally(() => driver.config.emit('runnerLoopStage','finish', userId));
        });

    });


if(typeof self == 'undefined') {
    setInterval(() => {
        const rejections = q.getUnhandledReasons();
        rejections.forEach((i) => console.error('Unhandled rejection:', i));
        q.resetUnhandledRejections();
    }, 1000);
}

