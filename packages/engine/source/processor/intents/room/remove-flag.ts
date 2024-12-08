import _ from 'lodash';

export default (userId: any, intent: any, { flags }: any) => {

    const flagItem: any = _.find(flags, { user: userId });
    if (!flagItem) {
        return;
    }

    const name = intent.name.replace(/\|/g, "$VLINE$").replace(/~/g, "$TILDE$");

    if (!_.any(flagItem._parsed, (i: any) => i[0] == name)) {
        return;
    }
    flagItem._modified = true;
    _.remove(flagItem._parsed, (i: any) => i[0] == name);
};