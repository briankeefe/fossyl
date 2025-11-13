type ExtractUrlParams<Path extends string> = Path extends `${string}/:${infer Param}/${infer Rest}`
  ? Param | ExtractUrlParams<Rest>
  : Path extends `${string}/:${infer Param}`
    ? Param
    : never;

// Yields the full object. Otherwise, we end up with a bunch of & during type inference
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// Helper to use Expand with Path
export type Params<Path extends string> = Expand<{
  [K in ExtractUrlParams<Path>]: string;
}>;
