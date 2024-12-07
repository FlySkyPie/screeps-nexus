import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;

export default (userId, intent, {flags}) => {

    const name = intent.name.replace(/\|/g,"$VLINE$").replace(/~/g,"$TILDE$");

    if(_.any(flags, i => {
        return i.user == userId && _.any(i._parsed, j => j[0] == name);
    })) {
        return;
    }
    if(!intent.color || !_.contains(C.COLORS_ALL, intent.color)) {
        return;
    }
    if(!intent.secondaryColor || !_.contains(C.COLORS_ALL, intent.secondaryColor)) {
        return;
    }

    if(intent.x < 0 || intent.x > 49 || intent.y < 0 || intent.y > 49) {
        return;
    }

    let flagItem = _.find(flags, {user: userId});
    if(!flagItem) {
        flagItem = {user: userId, room: intent.roomName, _parsed: []};
        flags.push(flagItem);
    }

    flagItem._modified = true;
    flagItem._parsed.push([name, intent.color, intent.secondaryColor, intent.x, intent.y]);
};