/**
 * mascot.ts — iuBot: mascote animado do compilador iuGo
 *
 * Estados: idle | blink | think | compile | success | error | wave
 * Usado na intro e em cada fase do modo demonstração.
 */
export type MascotMood = "idle" | "blink" | "think" | "compile" | "success" | "error" | "wave";
declare const SPEECH: Record<string, string>;
export declare function renderMascot(mood: MascotMood, frameIndex?: number): string;
export declare function mascotBlock(mood: MascotMood, speechKey: keyof typeof SPEECH | string, frameIndex?: number): string;
export declare function getSpeech(key: keyof typeof SPEECH): string;
/** Retorna frames para animação curta de intro. */
export declare function introSequence(): {
    mood: MascotMood;
    frame: number;
    ms: number;
}[];
export {};
//# sourceMappingURL=mascot.d.ts.map