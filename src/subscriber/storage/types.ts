import {Subscription} from '../types';

export interface Storage {
  set(subscriptionId: string, value: Subscription): Promise<void>;
  get(subscriptionId: string): Promise<Subscription | undefined>;
}
