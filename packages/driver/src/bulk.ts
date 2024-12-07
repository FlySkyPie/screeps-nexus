import q from 'q';
import _ from 'lodash';
import common from '@screeps/common';


function removeHidden(obj: any) {
    for (const i in obj) {
        if (i[0] == '_') {
            delete obj[i];
            continue;
        }
        if (_.isArray(obj[i])) {
            obj[i].forEach(removeHidden);
            continue;
        }
        if (_.isObject(obj[i])) {
            removeHidden(obj[i]);
        }
    }
    if (obj.$loki) {
        delete obj.$loki;
    }
}

export default (collectionName: any) => {
    const bulk: any[] = [];
    let opsCnt = 0;
    const updates: Record<string, any> = {};

    return {
        update(id: any, data: any) {
            if (!id) {
                return;
            }
            opsCnt++;
            data = _.cloneDeep(data);

            _.forEach(data, (value: any, key: any) => {
                if (_.isObject(value)) {
                    if (!_.isObject(id)) {
                        throw new Error(`can not update an object diff property '${key}' without object reference`);
                    }
                    const originalValue = id[key] || {};
                    _.merge(originalValue, value);
                    data[key] = originalValue;
                }
            });
            if (_.isObject(id)) {
                _.merge(id, data);
                id = id._id;
            }

            removeHidden(data);

            updates[id] = updates[id] || {};
            _.extend(updates[id], data);
        },
        insert(data: any, id: any) {
            data = _.cloneDeep(data);
            removeHidden(data);

            if (id) {
                data._id = id;
            }

            opsCnt++;
            bulk.push({ op: 'insert', data });
        },
        remove(id: any) {
            if (!id) {
                return;
            }
            opsCnt++;
            bulk.push({ op: 'remove', id });
        },
        inc(id: any, key: any, amount: any) {
            if (!id) {
                return;
            }
            if (_.isObject(id)) {
                id[key] = (id[key] || 0) + amount;
                id = id._id;
            }
            opsCnt++;
            bulk.push({ op: 'update', id, update: { $inc: { [key]: amount } } });
        },
        addToSet(id: any, key: any, value: any) {
            if (!id) {
                return;
            }
            if (_.isObject(id)) {
                id = id._id;
            }
            opsCnt++;
            bulk.push({ op: 'update', id, update: { $addToSet: { [key]: value } } });
        },
        pull(id: any, key: any, value: any) {
            if (!id) {
                return;
            }
            if (_.isObject(id)) {
                id = id._id;
            }
            opsCnt++;
            bulk.push({ op: 'update', id, update: { $pull: { [key]: value } } });
        },
        execute() {
            if (!opsCnt) return q.when({});
            for (const id in updates) {
                bulk.push({ op: 'update', id, update: { $set: updates[id] } });
            }
            return common.storage.db[collectionName].bulk(bulk);
        }
    };
};
