import _ from 'lodash';

import * as common from '@screeps/common/src';

import * as utils from '../../utils';

const config = common.configManager.config.backend;
const db = common.storage.db;
const env = common.storage.env;

export default (listen: any, emit: any) => {

    const connectedToMemory: Record<string, any> = {},
        connectedToMoney: Record<string, any> = {};

    listen(/^user:(.+)\/code$/, (data: any, match: any) => {
        data = JSON.parse(data);
        db['users.code'].findOne({ _id: data.id })
            .then((codeData: any) => {
                emit(match[0], {
                    branch: codeData.branch,
                    modules: utils.translateModulesFromDb(codeData.modules),
                    timestamp: codeData.timestamp,
                    hash: data.hash
                });
            })
    });



    listen(/^user:(.+)\/console$/, (data: any, match: any) => {
        data = JSON.parse(data);
        delete data.userId;

        emit(match[0], data);
    });

    listen(/^user:(.+)\/cpu$/, _.throttle((data: any, match: any) => {
        emit(match[0], JSON.parse(data));
    }, config.socketUpdateThrottle));

    listen(/^user:(.+)\/set-active-branch$/, (data: any, match: any) => {
        emit(match[0], JSON.parse(data));
    });

    listen(/^user:(.+)\/message:(.*)$/, (data: any, match: any) => {
        emit(match[0], JSON.parse(data));
    });

    listen(/^user:(.+)\/newMessage$/, (data: any, match: any) => {
        emit(match[0], JSON.parse(data));
    });

    listen(/^roomsDone$/, _.throttle(() => {
        _.forEach(connectedToMemory, (memoryPaths: any, userId) => {
            const startTime = Date.now();
            env.get(env.keys.MEMORY + userId)
                .then((data: any) => {
                    if (data) {
                        const memory = JSON.parse(data);
                        let cnt = 0;
                        _.forEach(memoryPaths, (conns, memoryPath: any) => {
                            cnt++;
                            if (cnt > 50) {
                                return;
                            }

                            let result;
                            try {
                                let curPointer = memory;
                                const parts = memoryPath.split(/\./);

                                do {
                                    curPointer = curPointer[parts.shift()];
                                }
                                while (parts.length > 0);
                                result = "" + curPointer;
                            }
                            catch (e) {
                                result = 'Incorrect memory path';
                            }

                            conns.forEach((conn: any) => conn._writeEvent(`user:${userId}/memory/${memoryPath}`, result));
                        });
                    }
                });
        });

        if (_.size(connectedToMoney)) {
            db.users.find({ _id: { $in: Object.keys(connectedToMoney) } })
                .then((usersMoney: any) => {
                    const usersMoneyById: any = _.indexBy(usersMoney, '_id');
                    _.forEach(connectedToMoney, (conns: any, userId: any) => {
                        conns.forEach((conn: any) => conn._writeEvent(`user:${userId}/money`, (usersMoneyById[userId].money || 0) / 1000));
                    });
                });
        }
    }, config.socketUpdateThrottle));

    return {
        onSubscribe(channel: any, user: any, conn: any) {

            let m;

            if (m = channel.match(/^user:(.+)\/memory\/(.+)$/)) {

                let userId = m[1], memoryPath = m[2];

                if (!user || user._id != userId) {
                    return false;
                }

                connectedToMemory[userId] = connectedToMemory[userId] || {};
                connectedToMemory[userId][memoryPath] = connectedToMemory[userId][memoryPath] || [];
                connectedToMemory[userId][memoryPath].push(conn);

                conn.on('close', () => {
                    if (connectedToMemory[userId] && connectedToMemory[userId][memoryPath]) {
                        _.remove(connectedToMemory[userId][memoryPath], (i) => i === conn);
                    }
                });
                return true;
            }

            if (m = channel.match(/^user:(.+)\//)) {
                const result = user && user._id == m[1];

                if (result && /^user:.+\/cpu$/.test(channel)) {
                    env.get(env.keys.MEMORY + user._id)
                        .then((data: any) => {
                            if (data) {
                                emit(channel, { cpu: 0, memory: data.length });
                            }
                        })
                }

                if (result && /^user:.+\/money$/.test(channel)) {
                    connectedToMoney[user._id] = connectedToMoney[user._id] || [];
                    connectedToMoney[user._id].push(conn);
                    conn.on('close', () => {
                        if (connectedToMoney[user._id]) {
                            _.remove(connectedToMoney[user._id], (i) => i === conn);
                        }
                    });
                }

                return result;
            }

            return false;
        },

        onUnsubscribe(channel: any, _user: any, conn: any) {

            let m;
            if (m = channel.match(/^user:(.+)\/memory\/(.+)$/)) {
                if (connectedToMemory[m[1]] && connectedToMemory[m[1]][m[2]]) {
                    _.remove(connectedToMemory[m[1]][m[2]], (i) => i === conn);
                }
            }

            if (m = channel.match(/^user:(.+)\/money$/)) {
                if (connectedToMoney[m[1]]) {
                    _.remove(connectedToMoney[m[1]], (i) => i === conn);
                }
            }
        }
    };
};
