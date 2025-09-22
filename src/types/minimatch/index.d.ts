declare module "minimatch" {
  export function Minimatch(
    pattern: string,
    options?: Record<string, unknown>
  ): unknown;
  export function match(list: string[], pattern: string): string[];
  export function filter(pattern: string): (path: string) => boolean;
  export default function minimatch(path: string, pattern: string): boolean;
}
