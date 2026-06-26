/**
 * messages.ts — Mensagens de fase do compilador (sem mascote ASCII)
 */
declare const MESSAGES: Record<string, string>;
/** Uma linha de contexto para a fase atual (sem arte ASCII). */
export declare function phaseMessage(key: keyof typeof MESSAGES | string): string;
export declare function getMessage(key: keyof typeof MESSAGES): string;
export {};
//# sourceMappingURL=messages.d.ts.map