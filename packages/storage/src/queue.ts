import { EventEmitter } from 'node:events';
import _ from 'lodash';

import * as pubsub from './pubsub';

const queues: any = {
    usersLegacy: {
        pending: [],
        processing: [],
        emitter: new EventEmitter()
    },
    usersIvm: {
        pending: [],
        processing: [],
        emitter: new EventEmitter()
    },
    rooms: {
        pending: [],
        processing: [],
        emitter: new EventEmitter()
    }
};

export default {
    queueFetch(name: any, cb: any) {
        try {
            const check = () => {
                if (!queues[name].pending.length) {
                    queues[name].emitter.once('add', check);
                    return;
                }
                const item = queues[name].pending.pop();
                queues[name].processing.push(item);
                cb(null, item);
            };
            check();
        }
        catch (e: any) {
            cb(e.message);
            console.error(e);
        }
    },
    queueMarkDone(name: any, id: any, cb: any) {
        try {
            _.pull(queues[name].processing, id);
            queues[name].emitter.emit('done');
            cb && cb(null, true);
        }
        catch (e: any) {
            cb(e.message);
            console.error(e);
        }
    },
    queueAdd(name: any, id: any, cb: any) {
        try {
            queues[name].pending.push(id);
            queues[name].emitter.emit('add');
            cb && cb(null, true);
        }
        catch (e: any) {
            cb(e.message);
            console.error(e);
        }
    },
    queueAddMulti(name: any, array: any, cb: any) {
        try {
            queues[name].pending = queues[name].pending.concat(array);
            queues[name].emitter.emit('add');
            cb && cb(null, true);
        }
        catch (e: any) {
            cb(e.message);
            console.error(e);
        }
    },
    queueWhenAllDone(name: any, cb: any) {
        try {
            const check = () => {
                if (queues[name].pending.length || queues[name].processing.length) {
                    queues[name].emitter.once('done', check);
                    return;
                }
                pubsub.publish('queueDone:' + name, '1');
                cb(null, true);
            };
            check();
        }
        catch (e: any) {
            cb(e.message);
            console.error(e);
        }
    },
    queueReset(name: any, cb: any) {
        try {
            queues[name].pending = [];
            queues[name].processing = [];
            queues[name].emitter.emit('done');
            cb && cb(null, true);
        }
        catch (e: any) {
            cb(e.message);
            console.error(e);
        }
    }
};

setInterval(() => {
    //console.log(queues.users.processing, queues.users.pending);
}, 500);
