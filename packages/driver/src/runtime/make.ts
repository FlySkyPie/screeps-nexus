import q from 'q';
import _ from 'lodash';
import ivm from 'isolated-vm';

import StorageInstance from '@screeps/common/src/storage';
import { ConfigManager } from '@screeps/common/src/config-manager';
import { StorageEnvKey } from '@screeps/common/src/constants/storage-env-key';

import { native } from '../native';
import { getAllTerrainData } from '../index';
import { init } from '../path-finder';

import * as runtimeData from './data';
import * as runtimeUserVm from './user-vm';

let staticTerrainData: any;
let staticTerrainDataSize = 0;

function _getAllTerrainData() {
    if (staticTerrainData) {
        return;
    }
    return getAllTerrainData()
        .then((result: any) => {

            if (staticTerrainData) {
                return;
            }

            init(native, result);

            staticTerrainDataSize = result.length * 2500;
            let bufferConstructor = typeof SharedArrayBuffer === 'undefined' ? ArrayBuffer : SharedArrayBuffer;
            let view = new Uint8Array(new bufferConstructor(staticTerrainDataSize));
            staticTerrainData = {
                buffer: view.buffer,
                roomOffsets: {},
            };

            result.forEach((room: any, roomIndex: any) => {
                const offset = roomIndex * 2500;
                for (let i = 0; i < 2500; i++) {
                    view[i + offset] = Number(room.terrain.charAt(i));
                }
                staticTerrainData.roomOffsets[room.room] = offset;
            });

            console.log('Terrain shared buffer size:', staticTerrainDataSize);
        });
}


function getUserData(userId: any) {
    return StorageInstance.db.users.findOne({ _id: userId })
        .then((user: any) => {

            let cpu;
            if (user.cpu) {
                cpu = user.cpuAvailable || 0;
                if (user.skipTicksPenalty > 0) {
                    console.log(`Skip user execution ${user.username} (penalty ${user.skipTicksPenalty})`);
                    StorageInstance.db.users.update({ _id: user._id }, {
                        $set: {
                            lastUsedCpu: 0,
                            lastUsedDirtyTime: 0
                        }, $inc: { skipTicksPenalty: -1 }
                    });
                    return q.reject({
                        type: 'error',
                        error: 'Your script is temporary blocked due to a hard reset inflicted to the runtime process.\nPlease try to change your code in order to prevent causing hard timeout resets.'
                    });
                }
                if (user.cpuAvailable < 0) {
                    console.log(`Skip user execution ${user.username} (${user.cpuAvailable})`);
                    StorageInstance.db.users.update({ _id: user._id }, {
                        $set: {
                            lastUsedCpu: 0,
                            lastUsedDirtyTime: 0,
                            cpuAvailable: user.cpuAvailable < -user.cpu * 2 ? -user.cpu * 2 : user.cpuAvailable + user.cpu
                        }
                    });
                    return q.reject({
                        type: 'error',
                        error: 'Script execution has been terminated: CPU bucket is empty'
                    });
                }
                cpu += user.cpu;
                if (cpu > ConfigManager.config.engine!.cpuMaxPerTick) {
                    cpu = ConfigManager.config.engine!.cpuMaxPerTick;
                }
            }
            else {
                cpu = Infinity;
            }

            return { user, cpu };

        });
}

async function make(scope: any, userId: any) {

    let userData;

    try {

        await _getAllTerrainData();

        if (scope.abort) {
            throw 'aborted';
        }

        userData = await getUserData(userId);

        if (scope.abort) {
            throw 'aborted';
        }

    }
    catch (error) {
        console.error(error);
        if (_.isObject(error)) {
            throw error;
        }
        throw { error };
    }

    let runResult: any;

    try {

        let data = await runtimeData.get(userId);
        let dataRef = new ivm.ExternalCopy(data);

        if (scope.abort) {
            throw 'aborted';
        }

        await runtimeUserVm.create({
            userId,
            staticTerrainData,
            staticTerrainDataSize,
            codeTimestamp: data.userCodeTimestamp
        });

        let vm = runtimeUserVm.get(userId);

        let run = await vm.start.apply(undefined, [dataRef.copyInto()]);

        if (scope.abort) {
            throw 'aborted';
        }

        ConfigManager.config.engine!.emit('playerSandbox', {
            run(code: any) {
                return vm.isolate.compileScriptSync(code).runSync(vm.context);
            },
            set(name: any, value: any) {
                return vm.context.global.setSync(name, new ivm.ExternalCopy(value).copyInto());
            },
            get(name: any) {
                return vm.context.global.getSync(name).copySync();
            },
            getIsolate() {
                return vm.isolate;
            },
            getContext() {
                return vm.context;
            },
            getGlobal() {
                return vm.jail;
            }
        }, userId);

        runResult = await run.apply(undefined, [], { timeout: data.timeout });

        run.release();
        dataRef.release();

        const $set: Record<string, any> = {
            lastUsedCpu: runResult.usedTime,
            lastUsedDirtyTime: runResult.usedDirtyTime
        };
        if (runResult.activeSegments) {
            $set.activeSegments = runResult.activeSegments;
        }
        if (runResult.defaultPublicSegment !== undefined) {
            $set.defaultPublicSegment = runResult.defaultPublicSegment;
        }
        if (userData.cpu < Infinity) {
            let newCpuAvailable = userData.user.cpuAvailable + userData.user.cpu - runResult.usedTime;
            if (newCpuAvailable > ConfigManager.config.engine!.cpuBucketSize) {
                newCpuAvailable = ConfigManager.config.engine!.cpuBucketSize;
            }
            $set.cpuAvailable = newCpuAvailable;
        }

        StorageInstance.db.users.update({ _id: userData.user._id }, { $set });

        if (runResult.activeForeignSegment !== undefined) {
            if (runResult.activeForeignSegment === null) {
                StorageInstance.db.users.update({ _id: userData.user._id }, {
                    $unset: {
                        activeForeignSegment: true
                    }
                });
            }
            else {
                if (userData.user.activeForeignSegment &&
                    runResult.activeForeignSegment.username == userData.user.activeForeignSegment.username &&
                    runResult.activeForeignSegment.id) {
                    StorageInstance.db.users.update({ _id: userData.user._id }, {
                        $merge: {
                            activeForeignSegment: { id: runResult.activeForeignSegment.id }
                        }
                    });
                }
                else {
                    StorageInstance.db.users.findOne({ username: runResult.activeForeignSegment.username }, { defaultPublicSegment: true })
                        .then((user: any) => {
                            runResult.activeForeignSegment.user_id = user._id;
                            if (!runResult.activeForeignSegment.id && user.defaultPublicSegment) {
                                runResult.activeForeignSegment.id = user.defaultPublicSegment;
                            }
                        })
                        .finally(() => {
                            StorageInstance.db.users.update({ _id: userData.user._id }, {
                                $set: {
                                    activeForeignSegment: runResult.activeForeignSegment
                                }
                            });
                        })
                }
            }
        }

        if (runResult.publicSegments) {
            StorageInstance.env.set(
                StorageEnvKey.PUBLIC_MEMORY_SEGMENTS + userData.user._id,
                runResult.publicSegments);
        }

        if (runResult.visual) {
            for (const roomName in runResult.visual) {
                StorageInstance.env.setex(
                    StorageEnvKey.ROOM_VISUAL + userData.user._id + ',' + roomName + ',' + data.time,
                    ConfigManager.config.engine!.mainLoopResetInterval / 1000,
                    runResult.visual[roomName]);
            }
        }

        if (/CPU limit reached/.test(runResult.error)) {
            StorageInstance.pubsub.publish(`user:${userData.user._id}/cpu`, JSON.stringify({
                cpu: 'error',
                memory: runResult.memory.data.length
            }));
        }
        else {
            StorageInstance.pubsub.publish(`user:${userData.user._id}/cpu`, JSON.stringify({
                cpu: runResult.usedTime,
                memory: runResult.memory.data.length
            }));
        }

        runResult.username = userData && userData.user && userData.user.username;

        return runResult;
    }
    catch (error: any) {
        let vm = runtimeUserVm.get(userId);
        if (vm && vm.didHaltByUserRequest) {
            runtimeUserVm.clear(userId);
            throw { error: "CPU halted" };
        }
        if (/Isolate is disposed/.test("" + error) ||
            /Isolate has exhausted v8 heap space/.test("" + error)) {
            runtimeUserVm.clear(userId);
        }
        if (/Array buffer allocation failed/.test("" + error) && !runResult) {
            runtimeUserVm.clear(userId);
            throw { error: "Script execution has been terminated: unable to allocate memory, restarting virtual machine" };
        }
        throw { error: error.stack || error };
    }
}

export const makeRuntime = async (userId: any) => {
    const scope = { abort: false };
    let timeout: any;
    return new Promise((resolve, reject) => {
        timeout = setTimeout(() => {
            scope.abort = true;
            reject({ error: 'Script execution timed out ungracefully, restarting virtual machine' });
            runtimeUserVm.clear(userId);
            console.error('isolated-vm timeout', userId);
            StorageInstance.pubsub.publish(`user:${userId}/cpu`, JSON.stringify({ cpu: 'error' }));
        }, Math.max(5000, ConfigManager.config.engine!.mainLoopResetInterval));
        make(scope, userId).then(resolve).catch(reject);
    })
        .then(result => {
            clearTimeout(timeout);
            return result;
        })
        .catch(error => {
            clearTimeout(timeout);
            return Promise.reject(error);
        })
};
