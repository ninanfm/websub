import * as debug from 'debug';

export const createDebug = (name: string): debug.Debugger => {
  return debug(`websub:${name}`);
};
