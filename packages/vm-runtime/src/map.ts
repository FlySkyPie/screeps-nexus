import _ from 'lodash';

import { ScreepsConstants } from '@screeps/common/src/constants/constants';
import { Direction } from '@screeps/common/src/constants/direction';
import { ErrorCode } from '@screeps/common/src/constants/error-code';
import { FindCode } from '@screeps/common/src/constants/find-code';

import { roomNameToXY } from '@screeps/engine/source/utilities/room-name-to-xy';
import { getRoomNameFromXY } from '@screeps/engine/source/utilities/get-room-name-from-xy';
import { createCalcRoomsDistance } from '@screeps/engine/source/utilities/calc-rooms-distance';
import { Heap, OpenClosed } from '@screeps/engine/source/game/path-utils';

import { getWorldSize } from './runtime-driver';

const calcRoomsDistance = createCalcRoomsDistance(getWorldSize);

const kRouteGrid = 30;

export function makeMap(runtimeData: any, register: any, globals: any) {

  let heap: any,
    openClosed: any,
    parents: any,
    originX: any,
    originY: any,
    toX: any,
    toY: any;

  function describeExits(roomName: any) {
    if (!/^(W|E)\d+(N|S)\d+$/.test(roomName)) {
      return null;
    }
    const [x, y] = roomNameToXY(roomName);
    const gridItem = runtimeData.mapGrid.gridData[`${x},${y}`];
    if (!gridItem) {
      return null;
    }

    const exits: Record<string, any> = {};

    if (gridItem.t) {
      exits[Direction.TOP] = getRoomNameFromXY(x, y - 1);
    }
    if (gridItem.b) {
      exits[Direction.BOTTOM] = getRoomNameFromXY(x, y + 1);
    }
    if (gridItem.l) {
      exits[Direction.LEFT] = getRoomNameFromXY(x - 1, y);
    }
    if (gridItem.r) {
      exits[Direction.RIGHT] = getRoomNameFromXY(x + 1, y);
    }

    return exits;
  }

  function xyToIndex(xx: any, yy: any) {
    let ox = originX - xx;
    let oy = originY - yy;
    if (ox < 0 || ox >= kRouteGrid * 2 || oy < 0 || oy >= kRouteGrid * 2) {
      return;
    }
    return ox * kRouteGrid * 2 + oy;
  }

  function indexToXY(index: any) {
    return [originX - Math.floor(index / (kRouteGrid * 2)), originY - index % (kRouteGrid * 2)];
  }

  function heuristic(xx: any, yy: any) {
    return Math.abs(xx - toX) + Math.abs(yy - toY);
  }

  return {

    findRoute(fromRoom: any, toRoom: any, opts: any) {
      if (_.isObject(fromRoom)) {
        fromRoom = fromRoom.name;
      }
      if (_.isObject(toRoom)) {
        toRoom = toRoom.name;
      }
      if (fromRoom == toRoom) {
        return [];
      }

      if (!/(W|E)\d+(N|S)\d+$/.test(fromRoom) || !/(W|E)\d+(N|S)\d+$/.test(toRoom)) {
        return ErrorCode.ERR_NO_PATH;
      }

      const [fromX, fromY] = roomNameToXY(fromRoom);
      [toX, toY] = roomNameToXY(toRoom);

      if (fromX == toX && fromY == toY) {
        return [];
      }

      originX = fromX + kRouteGrid;
      originY = fromY + kRouteGrid;

      // Init path finding structures
      if (heap) {
        heap.clear();
        openClosed.clear();
      } else {
        heap = new Heap(Math.pow(kRouteGrid * 2, 2), Float64Array);
        openClosed = new OpenClosed(Math.pow(kRouteGrid * 2, 2));
      }
      if (!parents) {
        parents = new Uint16Array(Math.pow(kRouteGrid * 2, 2));
      }
      const fromIndex = xyToIndex(fromX, fromY);
      heap.push(fromIndex, heuristic(fromX, fromY));
      const routeCallback = (opts && opts.routeCallback) || (() => { return 1; });

      // Astar
      while (heap.size()) {

        // Pull node off heap
        let index = heap.min();
        let fcost = heap.minPriority();

        // Close this node
        heap.pop();
        openClosed.close(index);

        // Calculate costs
        let [xx, yy] = indexToXY(index);
        let hcost = heuristic(xx, yy);
        let gcost = fcost - hcost;

        // Reached destination?
        if (hcost === 0) {
          let route: any[] = [];
          while (index !== fromIndex) {
            let [xx, yy] = indexToXY(index);
            index = parents[index];
            let [nx, ny] = indexToXY(index);
            let dir;
            if (nx < xx) {
              dir = FindCode.FIND_EXIT_RIGHT;
            } else if (nx > xx) {
              dir = FindCode.FIND_EXIT_LEFT;
            } else if (ny < yy) {
              dir = FindCode.FIND_EXIT_BOTTOM;
            } else {
              dir = FindCode.FIND_EXIT_TOP;
            }
            route.push({
              exit: dir,
              room: getRoomNameFromXY(xx, yy),
            });
          }
          route.reverse();
          return route;
        }

        // Add neighbors
        let fromRoomName = getRoomNameFromXY(xx, yy);
        let exits = describeExits(fromRoomName);
        for (let dir in exits) {

          // Calculate costs and check if this node was already visited
          let roomName = exits[dir];
          // let graphKey = fromRoomName + ':' + roomName;
          let [xx, yy] = roomNameToXY(roomName);
          let neighborIndex = xyToIndex(xx, yy);
          if (neighborIndex === undefined || openClosed.isClosed(neighborIndex)) {
            continue;
          }
          let cost = Number(routeCallback(roomName, fromRoomName)) || 1;
          if (cost === Infinity) {
            continue;
          }

          let fcost = gcost + heuristic(xx, yy) + cost;

          // Add to or update heap
          if (openClosed.isOpen(neighborIndex)) {
            if (heap.priority(neighborIndex) > fcost) {
              heap.update(neighborIndex, fcost);
              parents[neighborIndex] = index;
            }
          } else {
            heap.push(neighborIndex, fcost);
            openClosed.open(neighborIndex);
            parents[neighborIndex] = index;
          }
        }
      }

      return ErrorCode.ERR_NO_PATH;
    },

    findExit(fromRoom: any, toRoom: any, opts: any) {
      const route = this.findRoute(fromRoom, toRoom, opts);
      if (!_.isArray<any>(route)) {
        return route;
      }
      if (!route.length) {
        return ErrorCode.ERR_INVALID_ARGS;
      }
      return route[0].exit;
    },

    describeExits,

    isRoomProtected(roomName: any) {
      register.deprecated('Method `Game.map.isRoomProtected` is deprecated and will be removed. Please use `Game.map.isRoomAvailable` instead.');
      if (!/^(W|E)\d+(N|S)\d+$/.test(roomName)) {
        return null;
      }
      return !_.contains(runtimeData.accessibleRooms, roomName);
    },

    isRoomAvailable(roomName: any) {
      if (!/^(W|E)\d+(N|S)\d+$/.test(roomName)) {
        return false;
      }
      return _.contains(runtimeData.accessibleRooms, roomName);
    },

    getTerrainAt(x: any, y: any, roomName: any) {
      register.deprecated('Method `Game.map.getTerrainAt` is deprecated and will be removed. Please use a faster method `Game.map.getRoomTerrain` instead.');
      if (_.isObject(x)) {
        y = x.y;
        roomName = x.roomName;
        x = x.x;
      }

      // check if coordinates are out of bounds
      if (x < 0 || x > 49 || y < 0 || y > 49) {
        return undefined;
      }

      if (!runtimeData.staticTerrainData || !runtimeData.staticTerrainData[roomName]) {
        return undefined;
      }
      const terrain = runtimeData.staticTerrainData[roomName][y * 50 + x];
      if (terrain & ScreepsConstants.TERRAIN_MASK_WALL) {
        return 'wall'
      }
      if (terrain & ScreepsConstants.TERRAIN_MASK_SWAMP) {
        return 'swamp';
      }
      return 'plain';
    },

    getRoomTerrain(roomName: any) {
      return new globals.Room.Terrain(roomName);
    },

    getRoomLinearDistance(roomName1: any, roomName2: any, continuous: any) {
      return calcRoomsDistance(roomName1, roomName2, continuous);
    },

    getWorldSize() {
      return getWorldSize();
    }
  };
}
