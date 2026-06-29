/**
 * DOOM Engine - WebAssembly wrapper for doomgeneric
 */
export interface DoomModule {
    _doomgeneric_Create: (argc: number, argv: number) => void;
    _doomgeneric_Tick: () => void;
    _DG_GetFrameBuffer: () => number;
    _DG_GetScreenWidth: () => number;
    _DG_GetScreenHeight: () => number;
    _DG_PushKeyEvent: (pressed: number, key: number) => void;
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
    FS_createDataFile: (parent: string, name: string, data: number[], canRead: boolean, canWrite: boolean) => void;
    FS_createPath: (parent: string, path: string, canRead: boolean, canWrite: boolean) => string;
    setValue: (ptr: number, value: number, type: string) => void;
    getValue: (ptr: number, type: string) => number;
}
export declare class DoomEngine {
    private module;
    private frameBufferPtr;
    private initialized;
    private wadPath;
    private _width;
    private _height;
    constructor(wadPath: string);
    get width(): number;
    get height(): number;
    init(): Promise<void>;
    private initDoom;
    /**
     * Run one game tick
     */
    tick(): void;
    /**
     * Get current frame as RGBA pixel data
     * DOOM outputs ARGB, we convert to RGBA
     */
    getFrameRGBA(): Uint8Array;
    /**
     * Push a key event
     */
    pushKey(pressed: boolean, key: number): void;
    isInitialized(): boolean;
}
//# sourceMappingURL=doom-engine.d.ts.map