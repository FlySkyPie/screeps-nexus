import express from 'express';
import _ from 'lodash';
import jsonResponse from 'q-json-response';

import * as common from '@screeps/common/src';

import * as auth from './auth';

const router = express.Router();

const db = common.storage.db;
const env = common.storage.env;
const C = common.configManager.config.common.constants;


router.get('/orders-index', auth.tokenAuth, jsonResponse(() => {
    return db['market.orders'].find({ active: true })
        .then((data = []) => {
            const list: Record<string, any> = {};

            data.forEach(({ resourceType, type }) => {
                list[resourceType] = list[resourceType] || {
                    _id: resourceType,
                    count: 0,
                    buying: 0,
                    selling: 0
                };

                type === 'buy' && list[resourceType].buying++;
                type === 'sell' && list[resourceType].selling++;

                list[resourceType].count++;
            })

            return { list: Object.values(list) };
        })
}));

router.get('/orders', auth.tokenAuth, jsonResponse((request: any) => {
    return db['market.orders'].find({ $and: [{ active: true }, { resourceType: request.query.resourceType }] })
        .then((list: any) => {
            list.forEach((i: any) => i.price /= 1000);
            return { list };
        })
}));

router.get('/my-orders', auth.tokenAuth, jsonResponse((request: any) => {
    return db['market.orders'].find({ user: request.user._id })
        .then((list: any) => {
            list.forEach((i: any) => i.price /= 1000);
            return { list };
        })
}));

router.get('/stats', auth.tokenAuth, jsonResponse((request: any) => {
    return db['market.stats'].findEx({ resourceType: request.query.resourceType }, { sort: { date: -1 } })
        .then((data: any) => ({ stats: data }))
}));



export default router;
