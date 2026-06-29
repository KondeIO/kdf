import { type ClassValue } from "clsx";
export type ClassMergeFunction = (className: string) => string;
export interface ClassComposerOptions {
    /**
     * Optional app-defined semantic merge step.
     *
     * KDF's default merge only removes exact duplicate classes. If an app wants
     * semantic rules such as "keep the last class in this project-specific group",
     * inject that logic here.
     */
    merge?: ClassMergeFunction;
}
/**
 * Remove exact duplicate class names while preserving first-seen order.
 *
 * This is intentionally semantic-free: it does not try to understand any CSS
 * framework. It only turns "btn btn btn-primary" into "btn btn-primary".
 */
export declare function dedupeClasses(className: string): string;
/**
 * Create a UI-library agnostic class composer.
 *
 * Default behavior:
 * - flatten strings, arrays, and objects through clsx
 * - drop falsy values
 * - normalize whitespace
 * - remove exact duplicate class names
 *
 * Apps that need semantic class conflict handling can inject their own merge
 * function. KDF does not ship CSS-framework-specific class rules.
 */
export declare function createClassComposer(options?: ClassComposerOptions): (...inputs: ClassValue[]) => string;
export declare const composeClasses: (...inputs: ClassValue[]) => string;
export declare const cx: (...inputs: ClassValue[]) => string;
export declare const cn: (...inputs: ClassValue[]) => string;
