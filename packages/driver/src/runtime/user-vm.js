import _ from 'lodash';
import ivm from 'isolated-vm';
import fs from 'fs';
import index from '../index';
const nativeModPath = '../../native/build/Release/native.node';
const native = require(nativeModPath);
const nativeMod = new ivm.NativeModule(require.resolve(nativeModPath));
import common from '@screeps/common';
const config = common.configManager.config;
let vms = {};
let snapshot;

export async function create({userId, staticTerrainData, staticTerrainDataSize, codeTimestamp}) {
    userId = ""+userId;

    if(vms[userId]) {
        if(vms[userId].isolate.isDisposed) {
            exports.clear(userId);
            throw 'Script execution has been terminated: your isolate disposed unexpectedly, restarting virtual machine';
        }
        if(!vms[userId].ready) {
            return vms[userId].promise;
        } else if(codeTimestamp > vms[userId].codeTimestamp) {
            exports.clear(userId);
        }
    }

    if(!vms[userId]) {
        let inspector = config.engine.enableInspector;
        let isolate = new ivm.Isolate({inspector, snapshot, memoryLimit: 256 + staticTerrainDataSize/1024/1024});
        let vm = vms[userId] = {isolate, ready: false};
        vm.promise = (async () => {
            let context = await isolate.createContext({inspector});
            if(!snapshot) {
                await(await isolate.compileScript(
                        fs.readFileSync(require.resolve('../../build/runtime.bundle.js'), 'utf8')))
                    .run(context);
            }
            let [ nativeModInstance, initScript, cleanupScript ] = await Promise.all([
                nativeMod.create(context),
                isolate.compileScript('_init();'),
                isolate.compileScript('new ' + (() => {
                    delete global._ivm;
                    delete global._isolate;
                    delete global._context;
                    delete global._init;
                    delete global._evalFn;
                    delete global._start;
                    delete global._setStaticTerrainData;
                    delete global._worldSize;
                    delete global._nativeMod;
                    delete global._halt;
                })),
            ]);

            context.global.setIgnored('global', context.global.derefInto());
            context.global.setIgnored('_ivm', ivm);
            context.global.setIgnored('_isolate', isolate);
            context.global.setIgnored('_context', context);
            context.global.setIgnored('_worldSize', index.getWorldSize());
            context.global.setIgnored('_nativeMod', nativeModInstance.derefInto());
            context.global.setIgnored('_halt', new ivm.Reference(() => {
                vm.didHaltByUserRequest = true;
                isolate.dispose();
            }));
            await initScript.run(context);

            let [ evalFn, start, setStaticTerrainData ] = await Promise.all([
                context.global.get('_evalFn'),
                context.global.get('_start'),
                context.global.get('_setStaticTerrainData'),
            ]);

            await Promise.all([
                setStaticTerrainData.apply(undefined, [
                    new ivm.ExternalCopy(staticTerrainData.buffer).copyInto({ release: true }),
                    new ivm.ExternalCopy(staticTerrainData.roomOffsets).copyInto({ release: true }),
                ]),
                cleanupScript.run(context),
            ]);

            Object.assign(vm, {
                ready: true,
                context,
                start,
                evalFn,
                nativeModInstance,
                codeTimestamp
            });
        })();
        await vm.promise;
    }

    vms[userId].lastUsed = Date.now();
}

export function get(userId) {
    userId = ""+userId;
    let vm = vms[userId];
    if (vm && vm.ready) {
        return vm;
    }
}

export function clear(userId) {
    userId = ""+userId;
    if(vms[userId]) {
        try {
            if(!vms[userId].isolate.isDisposed) {
                vms[userId].isolate.dispose();
            }
        }
        catch (e) {
            console.error('release isolate error', userId, e);
        }
        delete vms[userId];
        vms[userId] = null;
    }
}

export function clearAll() {
    for(const userId in vms) {
        exports.clear(userId);
    }
    vms = {};
}

export function getMetrics() {
    return Object.keys(vms).reduce((accum, userId) => {
        if(vms[userId]) {
            const result = {
                userId,
                codeTimestamp: vms[userId].codeTimestamp,
                lastUsed: vms[userId].lastUsed,
                heap: {}
            };
            if (!vms[userId].isolate.isDisposed) {
                result.heap = vms[userId].isolate.getHeapStatisticsSync();
            }
            accum.push(result);
        }
        return accum;
    }, []);
}

export function init() {

    try {
        snapshot = new ivm.ExternalCopy(fs.readFileSync(require.resolve('../../build/runtime.snapshot.bin')).buffer);
    }
    catch(e) {
        console.log('File `build/runtime.shapshot.bin` not found, using `build/runtime.bundle.js` instead')
    }

    setInterval(() => {
        for (let userId in vms) {
            if (vms[userId] && vms[userId].lastUsed < Date.now() - 3 * 60 * 1000) {
                exports.clear(userId);
            }
        }
    }, 60 * 1000);

    if (config.engine.reportMemoryUsageInterval) {
        setInterval(() => {
            console.log('---');
            let heap = require('v8').getHeapStatistics();
            console.log(`# Main heap: ${heap.total_heap_size}`);
            console.log(`# ExternalCopy.totalExternalSize: ${ivm.ExternalCopy.totalExternalSize}`);

            exports.getMetrics().forEach(user => {
                console.log(`# User ${user.userId} heap: ${user.heap.total_heap_size + user.heap.externally_allocated_size}`);
            });
            console.log('---');
        }, config.engine.reportMemoryUsageInterval);
    }
}
