/* eslint-disable @typescript-eslint/no-explicit-any */
export const serializeArgs = (args: any[] = []) =>
  args.map((m: unknown) => (typeof m === 'string' ? JSON.stringify(m) : m));
