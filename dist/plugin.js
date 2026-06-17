import { existsSync } from "fs";
import { join } from "path";
/**
 * Next.js plugin for @konde/kdf.
 *
 * Single config — everything follows from `dir`:
 *   - JSON tokens: <dir>/shared/, <dir>/homepage.json
 *   - konde-server.css: <dir>/konde-server.css (import in layout.tsx)
 *   - konde.css: <dir>/konde.css (auto-injected last in <head>)
 *
 * Usage:
 *   export default withKDF()(nextConfig);                        // default: ./kdf
 *   export default withKDF({ dir: "./design" })(nextConfig);     // rename folder
 *   export default withKDF({ dir: "./designs/lander" })(nextConfig); // multi-template
 */
export default function withKDF(options) {
    return (nextConfig = {}) => {
        const kdfDir = options?.dir || "./kdf";
        const serverCssPath = join(process.cwd(), kdfDir, "konde-server.css");
        const clientCssPath = join(process.cwd(), kdfDir, "konde.css");
        return {
            ...nextConfig,
            env: {
                ...nextConfig.env,
                KDF_DIR: kdfDir,
                ...(existsSync(serverCssPath) ? { KDF_SERVER_CSS: join(kdfDir, "konde-server.css") } : {}),
                ...(existsSync(clientCssPath) ? { KDF_CLIENT_CSS: join(kdfDir, "konde.css") } : {}),
            },
            webpack(config, context) {
                if (typeof nextConfig.webpack === "function") {
                    return nextConfig.webpack(config, context);
                }
                return config;
            },
        };
    };
}
//# sourceMappingURL=plugin.js.map