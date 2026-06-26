/**
 * prompt.ts — Entrada interativa no terminal (readline)
 */
export declare function clearScreen(): void;
export declare function sleep(ms: number): Promise<void>;
export declare function print(text: string): void;
export declare function waitEnter(message?: string): Promise<void>;
export declare function ask(question: string): Promise<string>;
export declare function closePrompt(): void;
/** Menu numérico estilo CLI moderna. */
export declare function selectMenu<T extends string>(title: string, options: {
    label: string;
    value: T;
    hint?: string;
}[]): Promise<T>;
export declare function confirm(question: string): Promise<boolean>;
export declare function playIntro(render: (frame: number) => void, frames: number, msPerFrame: number): Promise<void>;
//# sourceMappingURL=prompt.d.ts.map