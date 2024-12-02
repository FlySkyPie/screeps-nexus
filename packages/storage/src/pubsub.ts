import { EventEmitter } from 'node:events';
import _ from 'lodash';

const subs: Record<string, any> = {};
let id = 0;
const emitter = new EventEmitter();

emitter.setMaxListeners(0);

function publish(channel: any, data: any, cb?: any) {
    emitter.emit(channel, { channel, data });
    emitter.emit('*', { channel, data });
    cb && cb(null);
}

// exports.create = 
function createPubsub() {
    const connId = id++;
    const connSubs: any[] = subs[connId] = [];

    return {
        methods: {
            publish,
            subscribe(channel: any, listener: any) {
                connSubs.push([channel, listener]);
                emitter.on(channel, listener);
                return () => {
                    emitter.removeListener(channel, listener);
                }
            },
        },
        close() {
            connSubs.forEach(i => emitter.removeListener(i[0], i[1]));
            delete subs[connId];
        }
    }
};

export { createPubsub as create };
export { publish };
