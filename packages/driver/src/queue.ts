import q from 'q';
import _ from 'lodash';

import StorageInstance from '@screeps/common/src/storage';

const register: Record<string, any> = {};
const queue = StorageInstance.queue;
const pubsub = StorageInstance.pubsub;

let terminated = false;

process.on('SIGTERM', () => {
    console.log('Got SIGTERM, disabling queue fetching');
    terminated = true;
    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

export function create(name: any, _?: any) {

    if (name == 'users') {
        name = 'usersIvm';
    }

    if (!register[name]) {

        register[name] = {

            fetch() {
                if (terminated) {
                    return q.defer().promise;
                }
                return queue.fetch(name);
            },

            markDone(id: any) {
                return queue.markDone(name, id);
            },

            add(id: any) {
                return queue.add(name, id);
            },

            addMulti(array: any) {
                if (!array.length) {
                    return q.when();
                }
                return queue.addMulti(name, array);
            },

            whenAllDone() {
                return queue.whenAllDone(name);
            },

            reset() {
                return queue.reset(name);
            }
        };
    }

    return register[name];
}

export function resetAll() {
    return q.all(Object.keys(register).map(i => queue.reset(i)));
}

export function createDoneListener(name: any, fn: any) {
    pubsub.subscribe(pubsub.keys.QUEUE_DONE + name, fn);
};
