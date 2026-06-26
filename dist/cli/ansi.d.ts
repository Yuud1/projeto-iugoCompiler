/**
 * ansi.ts — Cores e formatação terminal (sem dependências externas)
 */
export declare const reset = "\u001B[0m";
export declare const bold = "\u001B[1m";
export declare const dim = "\u001B[2m";
export declare const cyan = "\u001B[36m";
export declare const green = "\u001B[32m";
export declare const yellow = "\u001B[33m";
export declare const red = "\u001B[31m";
export declare const blue = "\u001B[34m";
export declare const magenta = "\u001B[35m";
export declare const white = "\u001B[37m";
export declare const gray = "\u001B[90m";
export declare function paint(color: string, text: string): string;
export declare function banner(title: string, subtitle?: string): string;
export declare function rule(label?: string): string;
//# sourceMappingURL=ansi.d.ts.map