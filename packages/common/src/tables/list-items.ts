import { BodyParts } from "../constants/body-parts"
import { ColorCode } from "../constants/color-code"
import { IntershardResources } from "../constants/intershard-resources";
import { Resource } from "../constants/resource"

export abstract class ListItems {
    public static readonly BODYPARTS_ALL = [
        BodyParts.MOVE,
        BodyParts.WORK,
        BodyParts.CARRY,
        BodyParts.ATTACK,
        BodyParts.RANGED_ATTACK,
        BodyParts.TOUGH,
        BodyParts.HEAL,
        BodyParts.CLAIM
    ];

    public static readonly RESOURCES_ALL = [
        Resource.RESOURCE_ENERGY,
        Resource.RESOURCE_POWER,

        Resource.RESOURCE_HYDROGEN,
        Resource.RESOURCE_OXYGEN,
        Resource.RESOURCE_UTRIUM,
        Resource.RESOURCE_KEANIUM,
        Resource.RESOURCE_LEMERGIUM,
        Resource.RESOURCE_ZYNTHIUM,
        Resource.RESOURCE_CATALYST,
        Resource.RESOURCE_GHODIUM,

        Resource.RESOURCE_HYDROXIDE,
        Resource.RESOURCE_ZYNTHIUM_KEANITE,
        Resource.RESOURCE_UTRIUM_LEMERGITE,

        Resource.RESOURCE_UTRIUM_HYDRIDE,
        Resource.RESOURCE_UTRIUM_OXIDE,
        Resource.RESOURCE_KEANIUM_HYDRIDE,
        Resource.RESOURCE_KEANIUM_OXIDE,
        Resource.RESOURCE_LEMERGIUM_HYDRIDE,
        Resource.RESOURCE_LEMERGIUM_OXIDE,
        Resource.RESOURCE_ZYNTHIUM_HYDRIDE,
        Resource.RESOURCE_ZYNTHIUM_OXIDE,
        Resource.RESOURCE_GHODIUM_HYDRIDE,
        Resource.RESOURCE_GHODIUM_OXIDE,

        Resource.RESOURCE_UTRIUM_ACID,
        Resource.RESOURCE_UTRIUM_ALKALIDE,
        Resource.RESOURCE_KEANIUM_ACID,
        Resource.RESOURCE_KEANIUM_ALKALIDE,
        Resource.RESOURCE_LEMERGIUM_ACID,
        Resource.RESOURCE_LEMERGIUM_ALKALIDE,
        Resource.RESOURCE_ZYNTHIUM_ACID,
        Resource.RESOURCE_ZYNTHIUM_ALKALIDE,
        Resource.RESOURCE_GHODIUM_ACID,
        Resource.RESOURCE_GHODIUM_ALKALIDE,

        Resource.RESOURCE_CATALYZED_UTRIUM_ACID,
        Resource.RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
        Resource.RESOURCE_CATALYZED_KEANIUM_ACID,
        Resource.RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
        Resource.RESOURCE_CATALYZED_LEMERGIUM_ACID,
        Resource.RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
        Resource.RESOURCE_CATALYZED_ZYNTHIUM_ACID,
        Resource.RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
        Resource.RESOURCE_CATALYZED_GHODIUM_ACID,
        Resource.RESOURCE_CATALYZED_GHODIUM_ALKALIDE,

        Resource.RESOURCE_OPS,

        Resource.RESOURCE_SILICON,
        Resource.RESOURCE_METAL,
        Resource.RESOURCE_BIOMASS,
        Resource.RESOURCE_MIST,

        Resource.RESOURCE_UTRIUM_BAR,
        Resource.RESOURCE_LEMERGIUM_BAR,
        Resource.RESOURCE_ZYNTHIUM_BAR,
        Resource.RESOURCE_KEANIUM_BAR,
        Resource.RESOURCE_GHODIUM_MELT,
        Resource.RESOURCE_OXIDANT,
        Resource.RESOURCE_REDUCTANT,
        Resource.RESOURCE_PURIFIER,
        Resource.RESOURCE_BATTERY,
        Resource.RESOURCE_COMPOSITE,
        Resource.RESOURCE_CRYSTAL,
        Resource.RESOURCE_LIQUID,

        Resource.RESOURCE_WIRE,
        Resource.RESOURCE_SWITCH,
        Resource.RESOURCE_TRANSISTOR,
        Resource.RESOURCE_MICROCHIP,
        Resource.RESOURCE_CIRCUIT,
        Resource.RESOURCE_DEVICE,

        Resource.RESOURCE_CELL,
        Resource.RESOURCE_PHLEGM,
        Resource.RESOURCE_TISSUE,
        Resource.RESOURCE_MUSCLE,
        Resource.RESOURCE_ORGANOID,
        Resource.RESOURCE_ORGANISM,

        Resource.RESOURCE_ALLOY,
        Resource.RESOURCE_TUBE,
        Resource.RESOURCE_FIXTURES,
        Resource.RESOURCE_FRAME,
        Resource.RESOURCE_HYDRAULICS,
        Resource.RESOURCE_MACHINE,

        Resource.RESOURCE_CONDENSATE,
        Resource.RESOURCE_CONCENTRATE,
        Resource.RESOURCE_EXTRACT,
        Resource.RESOURCE_SPIRIT,
        Resource.RESOURCE_EMANATION,
        Resource.RESOURCE_ESSENCE
    ];

    public static readonly COLORS_ALL = [
        ColorCode.COLOR_RED,
        ColorCode.COLOR_PURPLE,
        ColorCode.COLOR_BLUE,
        ColorCode.COLOR_CYAN,
        ColorCode.COLOR_GREEN,
        ColorCode.COLOR_YELLOW,
        ColorCode.COLOR_ORANGE,
        ColorCode.COLOR_BROWN,
        ColorCode.COLOR_GREY,
        ColorCode.COLOR_WHITE
    ];


    public static readonly INTERSHARD_RESOURCES = [
        IntershardResources.SUBSCRIPTION_TOKEN,
        IntershardResources.CPU_UNLOCK,
        IntershardResources.PIXEL,
        IntershardResources.ACCESS_KEY
    ]

    public static readonly COMMODITIES: Record<string, any> = {
        [Resource.RESOURCE_UTRIUM_BAR]: {
            amount: 100,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_UTRIUM]: 500,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_UTRIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_UTRIUM_BAR]: 100,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_LEMERGIUM_BAR]: {
            amount: 100,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_LEMERGIUM]: 500,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_LEMERGIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_LEMERGIUM_BAR]: 100,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_ZYNTHIUM_BAR]: {
            amount: 100,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_ZYNTHIUM]: 500,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_ZYNTHIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_ZYNTHIUM_BAR]: 100,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_KEANIUM_BAR]: {
            amount: 100,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_KEANIUM]: 500,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_KEANIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_KEANIUM_BAR]: 100,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_GHODIUM_MELT]: {
            amount: 100,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_GHODIUM]: 500,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_GHODIUM]: {
            amount: 500,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_GHODIUM_MELT]: 100,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_OXIDANT]: {
            amount: 100,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_OXYGEN]: 500,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_OXYGEN]: {
            amount: 500,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_OXIDANT]: 100,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_REDUCTANT]: {
            amount: 100,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_HYDROGEN]: 500,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_HYDROGEN]: {
            amount: 500,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_REDUCTANT]: 100,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_PURIFIER]: {
            amount: 100,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_CATALYST]: 500,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_CATALYST]: {
            amount: 500,
            cooldown: 20,
            components: {
                [Resource.RESOURCE_PURIFIER]: 100,
                [Resource.RESOURCE_ENERGY]: 200
            }
        },
        [Resource.RESOURCE_BATTERY]: {
            amount: 50,
            cooldown: 10,
            components: {
                [Resource.RESOURCE_ENERGY]: 600
            }
        },
        [Resource.RESOURCE_ENERGY]: {
            amount: 500,
            cooldown: 10,
            components: {
                [Resource.RESOURCE_BATTERY]: 50
            }
        },
        [Resource.RESOURCE_COMPOSITE]: {
            level: 1,
            amount: 20,
            cooldown: 50,
            components: {
                [Resource.RESOURCE_UTRIUM_BAR]: 20,
                [Resource.RESOURCE_ZYNTHIUM_BAR]: 20,
                [Resource.RESOURCE_ENERGY]: 20
            }
        },
        [Resource.RESOURCE_CRYSTAL]: {
            level: 2,
            amount: 6,
            cooldown: 21,
            components: {
                [Resource.RESOURCE_LEMERGIUM_BAR]: 6,
                [Resource.RESOURCE_KEANIUM_BAR]: 6,
                [Resource.RESOURCE_PURIFIER]: 6,
                [Resource.RESOURCE_ENERGY]: 45
            }
        },
        [Resource.RESOURCE_LIQUID]: {
            level: 3,
            amount: 12,
            cooldown: 60,
            components: {
                [Resource.RESOURCE_OXIDANT]: 12,
                [Resource.RESOURCE_REDUCTANT]: 12,
                [Resource.RESOURCE_GHODIUM_MELT]: 12,
                [Resource.RESOURCE_ENERGY]: 90
            }
        },

        [Resource.RESOURCE_WIRE]: {
            amount: 20,
            cooldown: 8,
            components: {
                [Resource.RESOURCE_UTRIUM_BAR]: 20,
                [Resource.RESOURCE_SILICON]: 100,
                [Resource.RESOURCE_ENERGY]: 40
            }
        },
        [Resource.RESOURCE_SWITCH]: {
            level: 1,
            amount: 5,
            cooldown: 70,
            components: {
                [Resource.RESOURCE_WIRE]: 40,
                [Resource.RESOURCE_OXIDANT]: 95,
                [Resource.RESOURCE_UTRIUM_BAR]: 35,
                [Resource.RESOURCE_ENERGY]: 20
            }
        },
        [Resource.RESOURCE_TRANSISTOR]: {
            level: 2,
            amount: 1,
            cooldown: 59,
            components: {
                [Resource.RESOURCE_SWITCH]: 4,
                [Resource.RESOURCE_WIRE]: 15,
                [Resource.RESOURCE_REDUCTANT]: 85,
                [Resource.RESOURCE_ENERGY]: 8
            }
        },
        [Resource.RESOURCE_MICROCHIP]: {
            level: 3,
            amount: 1,
            cooldown: 250,
            components: {
                [Resource.RESOURCE_TRANSISTOR]: 2,
                [Resource.RESOURCE_COMPOSITE]: 50,
                [Resource.RESOURCE_WIRE]: 117,
                [Resource.RESOURCE_PURIFIER]: 25,
                [Resource.RESOURCE_ENERGY]: 16
            }
        },
        [Resource.RESOURCE_CIRCUIT]: {
            level: 4,
            amount: 1,
            cooldown: 800,
            components: {
                [Resource.RESOURCE_MICROCHIP]: 1,
                [Resource.RESOURCE_TRANSISTOR]: 5,
                [Resource.RESOURCE_SWITCH]: 4,
                [Resource.RESOURCE_OXIDANT]: 115,
                [Resource.RESOURCE_ENERGY]: 32
            }
        },
        [Resource.RESOURCE_DEVICE]: {
            level: 5,
            amount: 1,
            cooldown: 600,
            components: {
                [Resource.RESOURCE_CIRCUIT]: 1,
                [Resource.RESOURCE_MICROCHIP]: 3,
                [Resource.RESOURCE_CRYSTAL]: 110,
                [Resource.RESOURCE_GHODIUM_MELT]: 150,
                [Resource.RESOURCE_ENERGY]: 64
            }
        },

        [Resource.RESOURCE_CELL]: {
            amount: 20,
            cooldown: 8,
            components: {
                [Resource.RESOURCE_LEMERGIUM_BAR]: 20,
                [Resource.RESOURCE_BIOMASS]: 100,
                [Resource.RESOURCE_ENERGY]: 40
            }
        },
        [Resource.RESOURCE_PHLEGM]: {
            level: 1,
            amount: 2,
            cooldown: 35,
            components: {
                [Resource.RESOURCE_CELL]: 20,
                [Resource.RESOURCE_OXIDANT]: 36,
                [Resource.RESOURCE_LEMERGIUM_BAR]: 16,
                [Resource.RESOURCE_ENERGY]: 8
            }
        },
        [Resource.RESOURCE_TISSUE]: {
            level: 2,
            amount: 2,
            cooldown: 164,
            components: {
                [Resource.RESOURCE_PHLEGM]: 10,
                [Resource.RESOURCE_CELL]: 10,
                [Resource.RESOURCE_REDUCTANT]: 110,
                [Resource.RESOURCE_ENERGY]: 16
            }
        },
        [Resource.RESOURCE_MUSCLE]: {
            level: 3,
            amount: 1,
            cooldown: 250,
            components: {
                [Resource.RESOURCE_TISSUE]: 3,
                [Resource.RESOURCE_PHLEGM]: 3,
                [Resource.RESOURCE_ZYNTHIUM_BAR]: 50,
                [Resource.RESOURCE_REDUCTANT]: 50,
                [Resource.RESOURCE_ENERGY]: 16
            }
        },
        [Resource.RESOURCE_ORGANOID]: {
            level: 4,
            amount: 1,
            cooldown: 800,
            components: {
                [Resource.RESOURCE_MUSCLE]: 1,
                [Resource.RESOURCE_TISSUE]: 5,
                [Resource.RESOURCE_PURIFIER]: 208,
                [Resource.RESOURCE_OXIDANT]: 256,
                [Resource.RESOURCE_ENERGY]: 32
            }
        },
        [Resource.RESOURCE_ORGANISM]: {
            level: 5,
            amount: 1,
            cooldown: 600,
            components: {
                [Resource.RESOURCE_ORGANOID]: 1,
                [Resource.RESOURCE_LIQUID]: 150,
                [Resource.RESOURCE_TISSUE]: 6,
                [Resource.RESOURCE_CELL]: 310,
                [Resource.RESOURCE_ENERGY]: 64
            }
        },

        [Resource.RESOURCE_ALLOY]: {
            amount: 20,
            cooldown: 8,
            components: {
                [Resource.RESOURCE_ZYNTHIUM_BAR]: 20,
                [Resource.RESOURCE_METAL]: 100,
                [Resource.RESOURCE_ENERGY]: 40
            }
        },
        [Resource.RESOURCE_TUBE]: {
            level: 1,
            amount: 2,
            cooldown: 45,
            components: {
                [Resource.RESOURCE_ALLOY]: 40,
                [Resource.RESOURCE_ZYNTHIUM_BAR]: 16,
                [Resource.RESOURCE_ENERGY]: 8
            }
        },
        [Resource.RESOURCE_FIXTURES]: {
            level: 2,
            amount: 1,
            cooldown: 115,
            components: {
                [Resource.RESOURCE_COMPOSITE]: 20,
                [Resource.RESOURCE_ALLOY]: 41,
                [Resource.RESOURCE_OXIDANT]: 161,
                [Resource.RESOURCE_ENERGY]: 8
            }
        },
        [Resource.RESOURCE_FRAME]: {
            level: 3,
            amount: 1,
            cooldown: 125,
            components: {
                [Resource.RESOURCE_FIXTURES]: 2,
                [Resource.RESOURCE_TUBE]: 4,
                [Resource.RESOURCE_REDUCTANT]: 330,
                [Resource.RESOURCE_ZYNTHIUM_BAR]: 31,
                [Resource.RESOURCE_ENERGY]: 16
            }
        },
        [Resource.RESOURCE_HYDRAULICS]: {
            level: 4,
            amount: 1,
            cooldown: 800,
            components: {
                [Resource.RESOURCE_LIQUID]: 150,
                [Resource.RESOURCE_FIXTURES]: 3,
                [Resource.RESOURCE_TUBE]: 15,
                [Resource.RESOURCE_PURIFIER]: 208,
                [Resource.RESOURCE_ENERGY]: 32
            }
        },
        [Resource.RESOURCE_MACHINE]: {
            level: 5,
            amount: 1,
            cooldown: 600,
            components: {
                [Resource.RESOURCE_HYDRAULICS]: 1,
                [Resource.RESOURCE_FRAME]: 2,
                [Resource.RESOURCE_FIXTURES]: 3,
                [Resource.RESOURCE_TUBE]: 12,
                [Resource.RESOURCE_ENERGY]: 64
            }
        },

        [Resource.RESOURCE_CONDENSATE]: {
            amount: 20,
            cooldown: 8,
            components: {
                [Resource.RESOURCE_KEANIUM_BAR]: 20,
                [Resource.RESOURCE_MIST]: 100,
                [Resource.RESOURCE_ENERGY]: 40
            }
        },
        [Resource.RESOURCE_CONCENTRATE]: {
            level: 1,
            amount: 3,
            cooldown: 41,
            components: {
                [Resource.RESOURCE_CONDENSATE]: 30,
                [Resource.RESOURCE_KEANIUM_BAR]: 15,
                [Resource.RESOURCE_REDUCTANT]: 54,
                [Resource.RESOURCE_ENERGY]: 12
            }
        },
        [Resource.RESOURCE_EXTRACT]: {
            level: 2,
            amount: 2,
            cooldown: 128,
            components: {
                [Resource.RESOURCE_CONCENTRATE]: 10,
                [Resource.RESOURCE_CONDENSATE]: 30,
                [Resource.RESOURCE_OXIDANT]: 60,
                [Resource.RESOURCE_ENERGY]: 16
            }
        },
        [Resource.RESOURCE_SPIRIT]: {
            level: 3,
            amount: 1,
            cooldown: 200,
            components: {
                [Resource.RESOURCE_EXTRACT]: 2,
                [Resource.RESOURCE_CONCENTRATE]: 6,
                [Resource.RESOURCE_REDUCTANT]: 90,
                [Resource.RESOURCE_PURIFIER]: 20,
                [Resource.RESOURCE_ENERGY]: 16
            }
        },
        [Resource.RESOURCE_EMANATION]: {
            level: 4,
            amount: 1,
            cooldown: 800,
            components: {
                [Resource.RESOURCE_SPIRIT]: 2,
                [Resource.RESOURCE_EXTRACT]: 2,
                [Resource.RESOURCE_CONCENTRATE]: 3,
                [Resource.RESOURCE_KEANIUM_BAR]: 112,
                [Resource.RESOURCE_ENERGY]: 32
            }
        },
        [Resource.RESOURCE_ESSENCE]: {
            level: 5,
            amount: 1,
            cooldown: 600,
            components: {
                [Resource.RESOURCE_EMANATION]: 1,
                [Resource.RESOURCE_SPIRIT]: 3,
                [Resource.RESOURCE_CRYSTAL]: 110,
                [Resource.RESOURCE_GHODIUM_MELT]: 150,
                [Resource.RESOURCE_ENERGY]: 64
            }
        },
    }
};
