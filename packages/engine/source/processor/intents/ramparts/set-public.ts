import _ from 'lodash';

export default (object: any, intent: any, { bulk }: any) => {

    bulk.update(object, {
        isPublic: !!intent.isPublic
    });
};