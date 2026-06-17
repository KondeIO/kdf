/** A design token value — className string, @reference, or object with component binding */
export type DesignTokenValue =
  | string
  | {
      /** Component binding — WHAT to render: "Button", "h1", "Image" */
      $?: string;
      /** Tailwind/CSS classes. Supports @refs: "@button.cta shadow-xl" */
      className?: string;
      /** CSS custom properties generated into konde.css */
      css?: Record<string, string>;
      /** Pass-through props for the bound component (variant, size, etc.) */
      [key: string]: unknown;
    };

/** A design token file — nested keys to values */
export interface DesignTokenFile {
  /** Page section ordering — which sections appear and in what order */
  $layout?: string[];
  [key: string]: DesignTokenValue | DesignTokenGroup | string[] | undefined;
}

export interface DesignTokenGroup {
  [key: string]: DesignTokenValue | DesignTokenGroup;
}

/** Resolved design accessor for a page */
export interface DesignAccessor {
  /** Get className for a dot-path: d("hero.title") */
  (path: string): string;
  /** Get CSS custom properties for a dot-path */
  css(path: string): Record<string, string>;
}

export type KdfCacheMode = "auto" | "always" | "none";

export interface GetDesignOptions {
  /**
   * Cache policy for design JSON files.
   *
   * - auto: production caches forever; development caches with mtime revalidation.
   * - always: cache for the lifetime of the process until clearKdfCache() is called.
   * - none: read from disk on every access.
   */
  cache?: KdfCacheMode;
  /**
   * Development revalidation window for cache="auto".
   * Defaults to 250ms to avoid render-time disk-read storms while keeping
   * design JSON edits responsive during local development.
   */
  maxAgeMs?: number;
}
