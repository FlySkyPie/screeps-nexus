import _ from 'lodash';

import { ListItems } from '@screeps/common/src/tables/list-items';

export function storeIntents(_userId: any, userIntents: any, userRuntimeData: any) {
    const intents: Record<string, any> = {};

    for (const i in userIntents) {

        if (i == 'notify') {
            intents.notify = [];
            if (_.isArray(userIntents.notify)) {
                userIntents.notify.forEach((notifyItem: any) => {
                    intents.notify.push({
                        message: ("" + notifyItem.message).substring(0, 1000),
                        groupInterval: +notifyItem.groupInterval
                    })
                })
            }
            continue;
        }

        if (i == 'room') {
            const roomIntentsResult = userIntents.room;

            if (roomIntentsResult.createFlag) {
                _.forEach(roomIntentsResult.createFlag, (iCreateFlag) => {

                    intents[iCreateFlag.roomName] =
                        intents[iCreateFlag.roomName] || {};

                    const roomIntents = intents[iCreateFlag.roomName].room =
                        intents[iCreateFlag.roomName].room || {};

                    roomIntents.createFlag = roomIntents.createFlag || [];

                    roomIntents.createFlag.push({
                        x: parseInt(iCreateFlag.x),
                        y: parseInt(iCreateFlag.y),
                        name: "" + iCreateFlag.name,
                        color: +iCreateFlag.color,
                        secondaryColor: +iCreateFlag.secondaryColor,
                        roomName: iCreateFlag.roomName
                    })
                });
            }
            if (roomIntentsResult.createConstructionSite) {
                _.forEach(roomIntentsResult.createConstructionSite, (iCreateConstructionSite) => {

                    intents[iCreateConstructionSite.roomName] =
                        intents[iCreateConstructionSite.roomName] || {};

                    const roomIntents = intents[iCreateConstructionSite.roomName].room =
                        intents[iCreateConstructionSite.roomName].room || {};

                    roomIntents.createConstructionSite = roomIntents.createConstructionSite || [];

                    roomIntents.createConstructionSite.push({
                        x: parseInt(iCreateConstructionSite.x),
                        y: parseInt(iCreateConstructionSite.y),
                        structureType: "" + iCreateConstructionSite.structureType,
                        name: "" + iCreateConstructionSite.name,
                        roomName: "" + iCreateConstructionSite.roomName
                    });
                });
            }
            if (roomIntentsResult.removeConstructionSite) {
                _.forEach(roomIntentsResult.removeConstructionSite, (iRemoveConstructionSite) => {

                    intents[iRemoveConstructionSite.roomName] =
                        intents[iRemoveConstructionSite.roomName] || {};

                    const roomIntents = intents[iRemoveConstructionSite.roomName].room =
                        intents[iRemoveConstructionSite.roomName].room || {};

                    roomIntents.removeConstructionSite = roomIntents.removeConstructionSite || [];

                    roomIntents.removeConstructionSite.push({
                        roomName: "" + iRemoveConstructionSite.roomName,
                        id: "" + iRemoveConstructionSite.id
                    });
                });
            }
            if (roomIntentsResult.destroyStructure) {
                _.forEach(roomIntentsResult.destroyStructure, (iDestroyStructure) => {

                    intents[iDestroyStructure.roomName] =
                        intents[iDestroyStructure.roomName] || {};

                    const roomIntents = intents[iDestroyStructure.roomName].room =
                        intents[iDestroyStructure.roomName].room || {};

                    roomIntents.destroyStructure = roomIntents.destroyStructure || [];

                    roomIntents.destroyStructure.push({
                        roomName: "" + iDestroyStructure.roomName,
                        id: "" + iDestroyStructure.id
                    });
                });
            }

            if (roomIntentsResult.removeFlag) {
                _.forEach(roomIntentsResult.removeFlag, (iRemoveFlag) => {

                    intents[iRemoveFlag.roomName] =
                        intents[iRemoveFlag.roomName] || {};

                    const roomIntents = intents[iRemoveFlag.roomName].room =
                        intents[iRemoveFlag.roomName].room || {};

                    roomIntents.removeFlag = roomIntents.removeFlag || [];

                    roomIntents.removeFlag.push({
                        roomName: "" + iRemoveFlag.roomName,
                        name: "" + iRemoveFlag.name
                    });
                });
            }

            continue;
        }

        if (i == 'global') {
            const globalIntentsResult = userIntents.global;

            if (globalIntentsResult.createOrder) {
                _.forEach(globalIntentsResult.createOrder, (iCreateOrder: any) => {
                    intents.global = intents.global || {};
                    intents.global.createOrder = intents.global.createOrder || [];
                    intents.global.createOrder.push({
                        type: "" + iCreateOrder.type,
                        resourceType: "" + iCreateOrder.resourceType,
                        price: parseInt(iCreateOrder.price * 1000 as any),
                        totalAmount: parseInt(iCreateOrder.totalAmount),
                        roomName: iCreateOrder.roomName ? "" + iCreateOrder.roomName : undefined
                    })
                });
            }
            if (globalIntentsResult.cancelOrder) {
                _.forEach(globalIntentsResult.cancelOrder, (iCancelOrder) => {
                    intents.global = intents.global || {};
                    intents.global.cancelOrder = intents.global.cancelOrder || [];
                    intents.global.cancelOrder.push({ orderId: "" + iCancelOrder.orderId });
                });
            }
            if (globalIntentsResult.changeOrderPrice) {
                _.forEach(globalIntentsResult.changeOrderPrice, (iChangeOrderPrice) => {
                    intents.global = intents.global || {};
                    intents.global.changeOrderPrice = intents.global.changeOrderPrice || [];
                    intents.global.changeOrderPrice.push({
                        orderId: "" + iChangeOrderPrice.orderId,
                        newPrice: parseInt(iChangeOrderPrice.newPrice * 1000 as any),
                    });
                });
            }
            if (globalIntentsResult.extendOrder) {
                _.forEach(globalIntentsResult.extendOrder, (iExtendOrder) => {
                    intents.global = intents.global || {};
                    intents.global.extendOrder = intents.global.extendOrder || [];
                    intents.global.extendOrder.push({
                        orderId: "" + iExtendOrder.orderId,
                        addAmount: parseInt(iExtendOrder.addAmount),
                    });
                });
            }
            if (globalIntentsResult.deal) {
                _.forEach(globalIntentsResult.deal, (iDeal) => {
                    intents.global = intents.global || {};
                    intents.global.deal = intents.global.deal || [];
                    intents.global.deal.push({
                        orderId: "" + iDeal.orderId,
                        amount: parseInt(iDeal.amount),
                        targetRoomName: "" + iDeal.targetRoomName
                    });
                });
            }
            if (globalIntentsResult.spawnPowerCreep) {
                _.forEach(globalIntentsResult.spawnPowerCreep, (iSpawnPowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.spawnPowerCreep = intents.global.spawnPowerCreep || [];
                    intents.global.spawnPowerCreep.push({
                        id: "" + iSpawnPowerCreep.id,
                        name: "" + iSpawnPowerCreep.name,
                    });
                });
            }
            if (globalIntentsResult.suicidePowerCreep) {
                _.forEach(globalIntentsResult.suicidePowerCreep, (iSuicidePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.suicidePowerCreep = intents.global.suicidePowerCreep || [];
                    intents.global.suicidePowerCreep.push({
                        id: "" + iSuicidePowerCreep.id,
                    });
                });
            }
            if (globalIntentsResult.deletePowerCreep) {
                _.forEach(globalIntentsResult.deletePowerCreep, (iDeletePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.deletePowerCreep = intents.global.deletePowerCreep || [];
                    intents.global.deletePowerCreep.push({
                        id: "" + iDeletePowerCreep.id,
                        cancel: !!iDeletePowerCreep.cancel
                    });
                });
            }
            if (globalIntentsResult.upgradePowerCreep) {
                _.forEach(globalIntentsResult.upgradePowerCreep, (iUpgradePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.upgradePowerCreep = intents.global.upgradePowerCreep || [];
                    intents.global.upgradePowerCreep.push({
                        id: "" + iUpgradePowerCreep.id,
                        power: +iUpgradePowerCreep.power
                    });
                });
            }
            if (globalIntentsResult.createPowerCreep) {
                _.forEach(globalIntentsResult.createPowerCreep, (iCreatePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.createPowerCreep = intents.global.createPowerCreep || [];
                    intents.global.createPowerCreep.push({
                        name: "" + iCreatePowerCreep.name,
                        className: "" + iCreatePowerCreep.className,
                    });
                });
            }
            if (globalIntentsResult.renamePowerCreep) {
                _.forEach(globalIntentsResult.renamePowerCreep, (iRenamePowerCreep) => {
                    intents.global = intents.global || {};
                    intents.global.renamePowerCreep = intents.global.renamePowerCreep || [];
                    intents.global.renamePowerCreep.push({
                        id: "" + iRenamePowerCreep.id,
                        name: "" + iRenamePowerCreep.name
                    });
                });
            }
            continue;
        }

        const object = userRuntimeData.userObjects[i] || userRuntimeData.roomObjects[i];

        if (!object) {
            continue;
        }

        const objectIntentsResult = userIntents[i];

        intents[object.room] = intents[object.room] || {};

        const objectIntents: Record<string, any> = intents[object.room][i] = {};

        // transfer can be invoked by another player

        if (objectIntentsResult.transfer) {
            objectIntents.transfer = {
                id: "" + objectIntentsResult.transfer.id,
                amount: parseInt(objectIntentsResult.transfer.amount),
                resourceType: "" + objectIntentsResult.transfer.resourceType
            };
        }

        if (objectIntentsResult.move) {
            objectIntents.move = objectIntentsResult.move.id ?
                { id: "" + objectIntentsResult.move.id } :
                { direction: parseInt(objectIntentsResult.move.direction) };
        }
        if (objectIntentsResult.pull) {
            objectIntents.pull = {
                id: "" + objectIntentsResult.pull.id
            };
        }
        if (objectIntentsResult.harvest) {
            objectIntents.harvest = {
                id: "" + objectIntentsResult.harvest.id
            };
        }
        if (objectIntentsResult.attack) {
            objectIntents.attack = {
                id: "" + objectIntentsResult.attack.id,
                x: parseInt(objectIntentsResult.attack.x),
                y: parseInt(objectIntentsResult.attack.y)
            };
        }
        if (objectIntentsResult.rangedAttack) {
            objectIntents.rangedAttack = {
                id: "" + objectIntentsResult.rangedAttack.id
            };
        }
        if (objectIntentsResult.rangedMassAttack) {
            objectIntents.rangedMassAttack = {};
        }
        if (objectIntentsResult.heal) {
            objectIntents.heal = {
                id: "" + objectIntentsResult.heal.id,
                x: parseInt(objectIntentsResult.heal.x),
                y: parseInt(objectIntentsResult.heal.y)
            };
        }
        if (objectIntentsResult.rangedHeal) {
            objectIntents.rangedHeal = {
                id: "" + objectIntentsResult.rangedHeal.id
            };
        }
        if (objectIntentsResult.repair) {
            objectIntents.repair = {
                id: "" + objectIntentsResult.repair.id,
                x: parseInt(objectIntentsResult.repair.x),
                y: parseInt(objectIntentsResult.repair.y)
            };
        }
        if (objectIntentsResult.build) {
            objectIntents.build = {
                id: "" + objectIntentsResult.build.id,
                x: parseInt(objectIntentsResult.build.x),
                y: parseInt(objectIntentsResult.build.y)
            };
        }
        if (objectIntentsResult.drop) {
            objectIntents.drop = {
                amount: parseInt(objectIntentsResult.drop.amount),
                resourceType: "" + objectIntentsResult.drop.resourceType
            };
        }
        if (objectIntentsResult.pickup) {
            objectIntents.pickup = {
                id: "" + objectIntentsResult.pickup.id
            };
        }
        if (objectIntentsResult.createCreep) {
            objectIntents.createCreep = {
                name: "" + objectIntentsResult.createCreep.name,
                body: _.filter(objectIntentsResult.createCreep.body, (i) => _.contains(ListItems.BODYPARTS_ALL, i)),
                energyStructures: objectIntentsResult.createCreep.energyStructures,
                directions: objectIntentsResult.createCreep.directions
            };
        }
        if (objectIntentsResult.renewCreep) {
            objectIntents.renewCreep = {
                id: "" + objectIntentsResult.renewCreep.id
            };
        }
        if (objectIntentsResult.recycleCreep) {
            objectIntents.recycleCreep = {
                id: "" + objectIntentsResult.recycleCreep.id
            };
        }
        if (objectIntentsResult.suicide) {
            objectIntents.suicide = {};
        }
        if (objectIntentsResult.remove) {
            objectIntents.remove = {};
        }
        if (objectIntentsResult.unclaim) {
            objectIntents.unclaim = {};
        }
        if (objectIntentsResult.say) {
            objectIntents.say = {
                message: objectIntentsResult.say.message.substring(0, 10),
                isPublic: !!objectIntentsResult.say.isPublic
            };
        }
        if (objectIntentsResult.claimController) {
            objectIntents.claimController = {
                id: "" + objectIntentsResult.claimController.id
            };
        }
        if (objectIntentsResult.attackController) {
            objectIntents.attackController = {
                id: "" + objectIntentsResult.attackController.id
            };
        }
        if (objectIntentsResult.unclaimController) {
            objectIntents.unclaimController = {
                id: "" + objectIntentsResult.unclaimController.id
            };
        }
        if (objectIntentsResult.upgradeController) {
            objectIntents.upgradeController = {
                id: "" + objectIntentsResult.upgradeController.id
            };
        }
        if (objectIntentsResult.reserveController) {
            objectIntents.reserveController = {
                id: "" + objectIntentsResult.reserveController.id
            };
        }
        if (objectIntentsResult.notifyWhenAttacked) {
            objectIntents.notifyWhenAttacked = {
                enabled: !!objectIntentsResult.notifyWhenAttacked.enabled
            };
        }
        if (objectIntentsResult.setPosition) {
            objectIntents.setPosition = {
                x: parseInt(objectIntentsResult.setPosition.x),
                y: parseInt(objectIntentsResult.setPosition.y),
                roomName: "" + objectIntentsResult.setPosition.roomName
            };
        }
        if (objectIntentsResult.setColor) {
            objectIntents.setColor = {
                color: "" + objectIntentsResult.setColor.color,
                secondaryColor: "" + objectIntentsResult.setColor.secondaryColor
            };
        }
        if (objectIntentsResult.destroy) {
            objectIntents.destroy = {};
        }
        if (objectIntentsResult.observeRoom) {
            objectIntents.observeRoom = {
                roomName: "" + objectIntentsResult.observeRoom.roomName
            };
        }
        if (objectIntentsResult.processPower) {
            objectIntents.processPower = {};
        }
        if (objectIntentsResult.dismantle) {
            objectIntents.dismantle = {
                id: "" + objectIntentsResult.dismantle.id
            };
        }
        if (objectIntentsResult.runReaction) {
            objectIntents.runReaction = {
                lab1: "" + objectIntentsResult.runReaction.lab1,
                lab2: "" + objectIntentsResult.runReaction.lab2
            };
        }
        if (objectIntentsResult.boostCreep) {
            objectIntents.boostCreep = {
                id: "" + objectIntentsResult.boostCreep.id,
                bodyPartsCount: parseInt(objectIntentsResult.boostCreep.bodyPartsCount)
            };
        }
        if (objectIntentsResult.unboostCreep) {
            objectIntents.unboostCreep = {
                id: "" + objectIntentsResult.unboostCreep.id
            }
        }
        if (objectIntentsResult.send) {
            objectIntents.send = {
                targetRoomName: "" + objectIntentsResult.send.targetRoomName,
                resourceType: "" + objectIntentsResult.send.resourceType,
                amount: parseInt(objectIntentsResult.send.amount),
                description: ("" + (objectIntentsResult.send.description || "")).substring(0, 100)
            };
        }
        if (objectIntentsResult.launchNuke) {
            objectIntents.launchNuke = {
                roomName: "" + objectIntentsResult.launchNuke.roomName,
                x: parseInt(objectIntentsResult.launchNuke.x),
                y: parseInt(objectIntentsResult.launchNuke.y)
            };
        }
        if (objectIntentsResult.setPublic) {
            objectIntents.setPublic = {
                isPublic: !!objectIntentsResult.setPubliScreepsConstants.isPublic
            };
        }
        if (objectIntentsResult.withdraw) {
            objectIntents.withdraw = {
                id: "" + objectIntentsResult.withdraw.id,
                amount: parseInt(objectIntentsResult.withdraw.amount),
                resourceType: "" + objectIntentsResult.withdraw.resourceType
            };
        }
        if (objectIntentsResult.activateSafeMode) {
            objectIntents.activateSafeMode = {};
        }
        if (objectIntentsResult.generateSafeMode) {
            objectIntents.generateSafeMode = {
                id: "" + objectIntentsResult.generateSafeMode.id,
            };
        }
        if (objectIntentsResult.signController) {
            objectIntents.signController = {
                id: "" + objectIntentsResult.signController.id,
                sign: ("" + objectIntentsResult.signController.sign).substring(0, 100)
            };
        }
        if (objectIntentsResult.setSpawnDirections) {
            objectIntents.setSpawnDirections = {
                directions: objectIntentsResult.setSpawnDirections.directions
            };
        }
        if (objectIntentsResult.cancelSpawning) {
            objectIntents.cancelSpawning = {};
        }
        if (objectIntentsResult.usePower) {
            objectIntents.usePower = {
                power: +objectIntentsResult.usePower.power,
                id: "" + objectIntentsResult.usePower.id
            };
        }
        if (objectIntentsResult.enableRoom) {
            objectIntents.enableRoom = {
                id: "" + objectIntentsResult.enableRoom.id
            };
        }
        if (objectIntentsResult.renew) {
            objectIntents.renew = {
                id: "" + objectIntentsResult.renew.id
            };
        }
        if (objectIntentsResult.produce) {
            objectIntents.produce = {
                id: "" + objectIntentsResult.produce.id,
                resourceType: "" + objectIntentsResult.produce.resourceType
            };
        }

        // for(var iCustomType in driver.config.customIntentTypes) {
        //     if(objectIntentsResult[iCustomType]) {
        //         objectIntents[iCustomType] = {};
        //         for(var prop in driver.config.customIntentTypes[iCustomType]) {
        //             switch(driver.config.customIntentTypes[iCustomType][prop]) {
        //                 case 'string': {
        //                     objectIntents[iCustomType][prop] = "" + objectIntentsResult[iCustomType][prop];
        //                     break;
        //                 }
        //                 case 'number': {
        //                     objectIntents[iCustomType][prop] = +objectIntentsResult[iCustomType][prop];
        //                     break;
        //                 }
        //                 case 'boolean': {
        //                     objectIntents[iCustomType][prop] = !!objectIntentsResult[iCustomType][prop];
        //                     break;
        //                 }
        //             }
        //         }
        //     }
        // }

    }

    return intents;
}