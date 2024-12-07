import _ from 'lodash';

export default (
    object: any,
    objectIntents: any,
    _roomObjects: any,
    _roomTerrain: any,
    bulk: any,
    _bulkUsers: any,
    _roomController: any,
    _stats: any,
) => {

    if (objectIntents.remove) {
        bulk.remove(object._id);
    }

    if (objectIntents.setColor) {
        if (_.contains(['white', 'grey', 'red', 'purple', 'blue', 'cyan', 'green', 'yellow', 'orange', 'brown'], objectIntents.setColor.color) &&
            _.contains(['white', 'grey', 'red', 'purple', 'blue', 'cyan', 'green', 'yellow', 'orange', 'brown'], objectIntents.setColor.secondaryColor)) {
            bulk.update(object, { color: objectIntents.setColor.color, secondaryColor: objectIntents.setColor.secondaryColor });
        }
    }

    if (objectIntents.setPosition) {
        const intent = objectIntents.setPosition;
        if (intent.x >= 0 && intent.y >= 0 && intent.x <= 49 && intent.y <= 49 && /^(W|E)\d+(S|N)\d+$/.test(intent.roomName)) {
            bulk.update(object, { x: intent.x, y: intent.y, room: intent.roomName });
        }
    }

};