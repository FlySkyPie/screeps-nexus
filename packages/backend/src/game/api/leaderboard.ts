import express from 'express';
import q from 'q';
import _ from 'lodash';
import jsonResponse from 'q-json-response';

const router = express.Router();

router.get('/list', jsonResponse((_request: any) => {
    // TODO
    return { list: [], count: 0, users: {} };
}));

router.get('/find', jsonResponse((request:any) => {
    // TODO
    if (request.query.season) {
        return q.reject('result not found');
    }
    else {
        return { list: [] };
    }

}));

router.get('/seasons', jsonResponse(() => {
    return { seasons: [{ _id: 'empty1', name: '—' }, { _id: 'empty2', name: '—' }] };
}));



export default router;