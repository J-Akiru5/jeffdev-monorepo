/** Minimal type declaration for the safe-regex ReDoS heuristic checker. */
declare module "safe-regex" {
  /**
   * Returns true when the pattern is judged safe from catastrophic
   * backtracking (star height within limits). Throws on invalid regex.
   */
  function safeRegex(re: RegExp | string): boolean;
  export default safeRegex;
}
