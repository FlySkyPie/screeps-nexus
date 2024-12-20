import { offsetsByDirection } from "./offsets-by-direction";

export function getOffsetsByDirection(direction: any) {
    if (!offsetsByDirection[direction]) {
        try {
            throw new Error();
        }
        catch (e: any) {
            console.error(
                'Wrong move direction',
                JSON.stringify(direction),
                JSON.stringify(offsetsByDirection),
                e.stack);
        }

    }
    return offsetsByDirection[direction];
};
