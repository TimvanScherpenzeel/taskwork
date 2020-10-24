/* eslint-disable @typescript-eslint/no-explicit-any */

// Make sure string arguments are kept as strings
export const serializeArgs = (args: any[] = []) =>
  args.map((m: unknown) => (typeof m === 'string' ? JSON.stringify(m) : m));
