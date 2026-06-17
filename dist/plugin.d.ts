/** Minimal Next.js config shape — avoids hard dependency on next */
interface NextConfig {
    env?: Record<string, string>;
    webpack?: (config: Record<string, unknown>, context: {
        dev: boolean;
    }) => Record<string, unknown>;
    [key: string]: unknown;
}
export interface KDFPluginOptions {
    /** KDF directory path (default: "./kdf"). Rename to anything: "./design", "./designs/lander" */
    dir?: string;
}
/**
 * Next.js plugin for @kondeio/kdf.
 *
 * Single config — everything follows from `dir`:
 *   - JSON tokens: <dir>/shared/, <dir>/homepage.json
 *   - konde-server.css: <dir>/konde-server.css (import in layout.tsx)
 *   - konde.css: <dir>/konde.css
 *
 * The plugin only exposes paths via env (KDF_DIR, KDF_SERVER_CSS,
 * KDF_CLIENT_CSS). It does NOT inject CSS — wire the <link>/import in your app.
 *
 * Usage:
 *   export default withKDF()(nextConfig);                        // default: ./kdf
 *   export default withKDF({ dir: "./design" })(nextConfig);     // rename folder
 *   export default withKDF({ dir: "./designs/lander" })(nextConfig); // multi-template
 */
export default function withKDF(options?: KDFPluginOptions): (nextConfig?: NextConfig) => NextConfig;
export {};
