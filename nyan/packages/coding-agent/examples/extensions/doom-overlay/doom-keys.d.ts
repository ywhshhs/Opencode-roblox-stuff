/**
 * DOOM key codes (from doomkeys.h)
 */
export declare const DoomKeys: {
    readonly KEY_RIGHTARROW: 174;
    readonly KEY_LEFTARROW: 172;
    readonly KEY_UPARROW: 173;
    readonly KEY_DOWNARROW: 175;
    readonly KEY_STRAFE_L: 160;
    readonly KEY_STRAFE_R: 161;
    readonly KEY_USE: 162;
    readonly KEY_FIRE: 163;
    readonly KEY_ESCAPE: 27;
    readonly KEY_ENTER: 13;
    readonly KEY_TAB: 9;
    readonly KEY_F1: number;
    readonly KEY_F2: number;
    readonly KEY_F3: number;
    readonly KEY_F4: number;
    readonly KEY_F5: number;
    readonly KEY_F6: number;
    readonly KEY_F7: number;
    readonly KEY_F8: number;
    readonly KEY_F9: number;
    readonly KEY_F10: number;
    readonly KEY_F11: number;
    readonly KEY_F12: number;
    readonly KEY_BACKSPACE: 127;
    readonly KEY_PAUSE: 255;
    readonly KEY_EQUALS: 61;
    readonly KEY_MINUS: 45;
    readonly KEY_RSHIFT: number;
    readonly KEY_RCTRL: number;
    readonly KEY_RALT: number;
};
/**
 * Map terminal key input to DOOM key codes
 * Supports both raw terminal input and Kitty protocol sequences
 */
export declare function mapKeyToDoom(data: string): number[];
//# sourceMappingURL=doom-keys.d.ts.map