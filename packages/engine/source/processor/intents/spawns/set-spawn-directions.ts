import _ from 'lodash';

export default (spawn: any, intent: any, { bulk }: any) => {
    if (spawn.type != 'spawn' || !spawn.spawning)
        return;
    let directions = intent.directions;
    if (_.isArray(directions) && directions.length > 0) {
        // convert directions to numbers, eliminate duplicates
        directions = _.uniq(_.map(directions, (e: any) => +e));
        // bail if any numbers are out of bounds or non-integers
        if (!_.any(directions, (direction: any) =>
            direction < 1 ||
            direction > 8 ||
            direction !== (direction | 0))) {
            const spawning = _.clone(spawn.spawning);
            spawning.directions = directions;
            bulk.update(spawn, { spawning: null });
            bulk.update(spawn, { spawning });
        }
    }
};
