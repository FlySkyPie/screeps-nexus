import _ from 'lodash';
import * as utils from '../../../utils';
const driver = utils.getDriver();


export default (object, intent, {bulk}) => {

    bulk.update(object, {
        isPublic: !!intent.isPublic
    });
};