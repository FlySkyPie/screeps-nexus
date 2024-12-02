import express from 'express';
const router = express.Router();
import q from 'q';
import _ from 'lodash';
import jsonResponse from 'q-json-response';
import auth from './auth';
import utils from '../../utils';
import * as common from '@screeps/common/src';
const db = common.storage.db;
const env = common.storage.env;
const C = common.configManager.config.common.constants;


router.get('/list', jsonResponse((request) => {
    // TODO
    return {list: [], count: 0, users: {}};
}));

router.get('/find', jsonResponse((request) => {
    // TODO
    if(request.query.season) {
        return q.reject('result not found');
    }
    else {
        return {list: []};
    }

}));

router.get('/seasons', jsonResponse(() => {
    return {seasons: [{_id: 'empty1', name: '—'}, {_id: 'empty2', name: '—'}]};
}));



export default router;