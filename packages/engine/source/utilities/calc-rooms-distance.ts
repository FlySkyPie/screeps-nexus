import { roomNameToXY } from "./room-name-to-xy";

export const createCalcRoomsDistance = (
    getWorldSize: () => any,
) =>
    (room1: any, room2: any, continuous: any) => {
        const [x1, y1] = roomNameToXY(room1);
        const [x2, y2] = roomNameToXY(room2);
        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        if (continuous) {
            const worldSize = getWorldSize();
            dx = Math.min(worldSize - dx, dx);
            dy = Math.min(worldSize - dy, dy);
        }
        return Math.max(dx, dy);
    }