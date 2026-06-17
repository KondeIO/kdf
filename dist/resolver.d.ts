import type { DesignTokenFile, GetDesignOptions } from "./types.js";
/** Returns KDF root path — reads env at call time, not module load time */
declare function getKdfRoot(): string;
export declare function clearKdfCache(): void;
declare function loadFile(name: string, options?: GetDesignOptions): DesignTokenFile | null;
/** Resolve className for a token path.
 *  Looks in page JSON first. @references resolve from shared/ files. */
export declare function resolveClassName(path: string, pageTokens: DesignTokenFile | null, options?: GetDesignOptions): string;
/** Resolve CSS custom properties for a token path */
export declare function resolveCSS(path: string, pageTokens: DesignTokenFile | null): Record<string, string>;
export { loadFile, getKdfRoot };
//# sourceMappingURL=resolver.d.ts.map