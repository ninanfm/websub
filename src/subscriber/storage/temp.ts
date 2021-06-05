import {Subscription} from '../types';
import {MemoryStorage} from './memory';
import {Storage} from './types';

const TEN_MINUTES = 10 * 60 * 1000;

export class TempStorage extends MemoryStorage implements Storage {
  async set(key: string, value: Subscription): Promise<void> {
    await super.set(key, value);
    setTimeout(() => {
      this.data.delete(key);
    }, TEN_MINUTES);
  }
}
