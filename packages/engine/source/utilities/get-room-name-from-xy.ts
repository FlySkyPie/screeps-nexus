export function getRoomNameFromXY(x: any, y: any) {
    if (x < 0) {
        x = 'W' + (-x - 1);
    }
    else {
        x = 'E' + (x);
    }
    if (y < 0) {
        y = 'N' + (-y - 1);
    }
    else {
        y = 'S' + (y);
    }
    return "" + x + y;
};
