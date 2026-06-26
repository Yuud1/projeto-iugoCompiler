/**
 * ansi.ts — Cores e formatação terminal (sem dependências externas)
 */

export const reset  = "\x1b[0m";
export const bold   = "\x1b[1m";
export const dim    = "\x1b[2m";
export const cyan   = "\x1b[36m";
export const green  = "\x1b[32m";
export const yellow = "\x1b[33m";
export const red    = "\x1b[31m";
export const blue   = "\x1b[34m";
export const magenta= "\x1b[35m";
export const white  = "\x1b[37m";
export const gray   = "\x1b[90m";

export function paint(color: string, text: string): string {
  return `${color}${text}${reset}`;
}

export function banner(title: string, subtitle?: string): string {
  const w = 52;
  const line = "═".repeat(w);
  const pad = (s: string) => {
    const vis = s.replace(/\x1b\[[0-9;]*m/g, "");
    const padLen = Math.max(0, w - vis.length);
    return s + " ".repeat(padLen);
  };
  const rows = [
    `╔${line}╗`,
    `║${pad(` ${bold}${cyan}${title}${reset}`)}║`,
  ];
  if (subtitle) rows.push(`║${pad(` ${dim}${subtitle}${reset}`)}║`);
  rows.push(`╚${line}╝`);
  return rows.join("\n");
}

export function rule(label?: string): string {
  if (!label) return gray + "─".repeat(60) + reset;
  return gray + "── " + reset + bold + label + reset + gray + " " + "─".repeat(Math.max(0, 48 - label.length)) + reset;
}
