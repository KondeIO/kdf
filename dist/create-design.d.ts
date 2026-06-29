import type { DesignAccessor, DesignSharedTokens, DesignTokenFile } from "./types.js";
interface ResolveRuntimeOptions {
    shared?: DesignSharedTokens;
    resolveRef?: (component: string, key: string) => unknown;
}
/** Resolve className for a token path. */
export declare function resolveClassName(path: string, pageTokens: DesignTokenFile | null, options?: ResolveRuntimeOptions): string;
/** Resolve CSS custom properties for a token path */
export declare function resolveCSS(path: string, pageTokens: DesignTokenFile | null): Record<string, string>;
/**
 * Create a design accessor from imported JSON token objects.
 *
 * This is the preferred API for edge runtimes and build-time bundlers because
 * the host app imports JSON explicitly instead of asking KDF to read a path at
 * runtime.
 */
export declare function createDesign(pageTokens: DesignTokenFile | null, shared?: DesignSharedTokens): DesignAccessor;
export {};
