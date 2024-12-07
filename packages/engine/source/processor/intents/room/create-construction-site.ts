import _ from 'lodash';
import utils from '../../../utils';
const driver = utils.getDriver();
const C = driver.constants;
import config from '../../../config';

let createdConstructionSiteCounter = 0;

export default (userId, intent, {roomObjects, roomTerrain, bulk, roomController}) => {

    if(intent.x <= 0 || intent.x >= 49 || intent.y <= 0 || intent.y >= 49) {
        return;
    }

    if(!C.CONSTRUCTION_COST[intent.structureType]) {
        return;
    }

    if(/^(W|E)/.test(intent.roomName)) {

        if (roomController && (roomController.user && roomController.user != userId || roomController.reservation && roomController.reservation.user != userId)) {
            return;
        }

        if (!utils.checkControllerAvailability(intent.structureType, roomObjects, roomController)) {
            return;
        }
    }

    if(!utils.checkConstructionSite(roomObjects, intent.structureType, intent.x, intent.y) ||
        !utils.checkConstructionSite(roomTerrain, intent.structureType, intent.x, intent.y)) {
        return;
    }

    let progressTotal = C.CONSTRUCTION_COST[intent.structureType];

    if(intent.structureType == 'road') {
        if(_.any(roomObjects, {x: intent.x, y: intent.y, type: 'swamp'}) ||
            utils.checkTerrain(roomTerrain, intent.x, intent.y, C.TERRAIN_MASK_SWAMP)) {
            progressTotal *= C.CONSTRUCTION_COST_ROAD_SWAMP_RATIO;
        }
        if(_.any(roomObjects, {x: intent.x, y: intent.y, type: 'wall'}) ||
            utils.checkTerrain(roomTerrain, intent.x, intent.y, C.TERRAIN_MASK_WALL)) {
            progressTotal *= C.CONSTRUCTION_COST_ROAD_WALL_RATIO;
        }
    }

    if(config.ptr) {
        progressTotal = 1;
    }

    if(intent.roomName == 'sim' && intent.structureType == 'tower') {
        progressTotal = 100;
    }

    const obj = {
        structureType: intent.structureType,
        x: intent.x,
        y: intent.y,
        type: 'constructionSite',
        room: intent.roomName,
        user: userId,
        progress: 0,
        progressTotal
    };

    if(intent.structureType == 'spawn') {
        obj.name = intent.name;
    }

    bulk.insert(obj);

    roomObjects['_createdConstructionSite'+createdConstructionSiteCounter] = obj;
    createdConstructionSiteCounter++;
};