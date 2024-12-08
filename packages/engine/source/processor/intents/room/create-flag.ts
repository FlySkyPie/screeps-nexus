import _ from 'lodash';

import { ListItems } from '@screeps/common/src/tables/list-items';

export default (userId: any, intent: any, { flags }: any) => {

    const name = intent.name.replace(/\|/g, "$VLINE$").replace(/~/g, "$TILDE$");

    if (_.any(flags, (i: any) => {
        return i.user == userId && _.any(i._parsed, (j: any) => j[0] == name);
    })) {
        return;
    }
    if (!intent.color || !_.contains(ListItems.COLORS_ALL, intent.color)) {
        return;
    }
    if (!intent.secondaryColor || !_.contains(ListItems.COLORS_ALL, intent.secondaryColor)) {
        return;
    }

    if (intent.x < 0 || intent.x > 49 || intent.y < 0 || intent.y > 49) {
        return;
    }

    let flagItem: any = _.find(flags, { user: userId });
    if (!flagItem) {
        flagItem = { user: userId, room: intent.roomName, _parsed: [] };
        flags.push(flagItem);
    }

    flagItem._modified = true;
    flagItem._parsed.push([name, intent.color, intent.secondaryColor, intent.x, intent.y]);
};