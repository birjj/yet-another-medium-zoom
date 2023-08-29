import type { YamzDecoratedHooks, YamzPlugin } from "./types";

/** Runs a hook on the given set of plugins (in order) */
export async function executeHook<H extends keyof YamzDecoratedHooks>({
  hook,
  plugins,
  initialArgs,
}: {
  hook: H;
  plugins: readonly YamzPlugin[];
  initialArgs: Parameters<YamzDecoratedHooks[H]>[0];
}): Promise<ReturnType<YamzDecoratedHooks[H]>> {
  let output = initialArgs.previous;

  for (const plugin of plugins) {
    const hookFn = plugin.hooks?.[hook];
    if (!hookFn) {
      continue;
    }

    try {
      output = hookFn({
        ...initialArgs,
        // @ts-expect-error TypeScript doesn't appear clever enough to narrow down the type of `hookFn` or `output` to only the applicable hook. I couldn't find a workaround to make the types match
        previous: output,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : (error as string);
      throw new Error(
        `Plugin "${plugin.name}" caused an error in its "${hook}" hook. Error message: ${message}`
      );
    }
  }

  return output as ReturnType<YamzDecoratedHooks[H]>;
}
