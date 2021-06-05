import {Subscription} from '../types';
import {Storage} from './types';

export class MemoryStorage implements Storage {
  protected data: Map<string, Subscription> = new Map();

  set(key: string, value: Subscription): Promise<void> {
    this.data.set(key, value);
    return Promise.resolve();
  }

  get(key: string): Promise<Subscription | undefined> {
    return Promise.resolve(this.data.get(key));
  }
}
