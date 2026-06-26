/**
 * introAnimation.ts — Animação de abertura no terminal
 *
 * Inspirado em animações ASCII clássicas da web:
 *   - "line cube" (wireframe rotativo) — ascii.co.uk/animated, estética BBS/retro
 *   - "matrix rain" com caracteres de código — demos de terminal / hacker aesthetic
 *   - Sequência de boot estilo ferramentas CLI modernas (Claude Code, npm, etc.)
 *
 * Referências:
 *   https://ascii.co.uk/animated
 *   https://ascii.co.uk/animated-art/line-cube-animated-ascii-art.html
 */
export interface IntroCallbacks {
    clearScreen: () => void;
    print: (text: string) => void;
    sleep: (ms: number) => Promise<void>;
}
/**
 * Animação completa de startup (~4s):
 *   1. Matrix rain com tokens iuGo
 *   2. Cubo wireframe rotativo + logo
 *   3. Linhas de boot com spinner Braille
 */
export declare function playStartupAnimation(cb: IntroCallbacks): Promise<void>;
//# sourceMappingURL=introAnimation.d.ts.map