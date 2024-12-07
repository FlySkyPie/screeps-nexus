import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (userId, intent, {flags}) => {

    const flagItem = _.find(flags, {user: userId});
    if(!flagItem) {
        return;
    }

    const name = intent.name.replace(/\|/g,"$VLINE$").replace(/~/g,"$TILDE$");

    if(!_.any(flagItem._parsed, i => i[0] == name)) {
        return;
    }
    flagItem._modified = true;
    _.remove(flagItem._parsed, i => i[0] == name);
};