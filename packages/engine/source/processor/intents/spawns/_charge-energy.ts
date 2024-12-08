import _ from 'lodash';

import * as utils from '../../../utils';

function oldEnergyHandling(spawn: any, cost: any, { roomObjects, bulk }: any) {
    const spawns = _.filter(roomObjects, (i: any) => i.type == 'spawn' && i.user == spawn.user && !i.off);
    const extensions = _.filter(roomObjects, (i: any) => i.type == 'extension' && i.user == spawn.user && !i.off);
    const availableEnergy = _.sum(extensions, 'store.energy') + _.sum(spawns, 'store.energy');

    if (availableEnergy < cost) {
        return false;
    }

    spawns.sort(utils.comparatorDistance(spawn));
    spawns.forEach((i) => {
        const neededEnergy = Math.min(cost, i.store.energy);
        i.store.energy -= neededEnergy;
        cost -= neededEnergy;
        bulk.update(i, { store: { energy: i.store.energy } });
    });

    if (cost <= 0) {
        return true;
    }

    extensions.sort(utils.comparatorDistance(spawn));
    extensions.forEach((extension) => {
        if (cost <= 0) {
            return;
        }
        const neededEnergy = Math.min(cost, extension.store.energy);
        extension.store.energy -= neededEnergy;
        cost -= neededEnergy;
        bulk.update(extension, { store: { energy: extension.store.energy } });
    });

    return true;
}

function newEnergyHandling(spawn: any, cost: any, energyStructures: any, { roomObjects, bulk }: any) {
    energyStructures = _.filter(energyStructures, (id: any) => {
        let energyStructure = roomObjects[id];

        return energyStructure && !energyStructure.off && energyStructure.user === spawn.user &&
            (energyStructure.type === 'spawn' || energyStructure.type === 'extension');
    });

    energyStructures = _.uniq(energyStructures);

    let availableEnergy = _.sum(energyStructures, (id: any) => roomObjects[id].store.energy);
    if (availableEnergy < cost) {
        return false;
    }

    _.forEach(energyStructures, id => {
        let energyStructure = roomObjects[id];

        let energyChange = Math.min(cost, energyStructure.store.energy);
        energyStructure.store.energy -= energyChange;
        bulk.update(energyStructure, { store: { energy: energyStructure.store.energy } });

        cost -= energyChange;
        if (cost <= 0) {
            return false;
        }
    });

    return true;
}

export default function chargeEnergy(spawn: any, cost: any, energyStructures: any, scope: any) {
    if (energyStructures === undefined) {
        return oldEnergyHandling(spawn, cost, scope);
    } else {
        return newEnergyHandling(spawn, cost, energyStructures, scope);
    }
};
