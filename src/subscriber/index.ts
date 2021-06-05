import {v4 as uuid} from 'uuid';
import {createHmac} from 'crypto';
import {EventEmitter} from 'events';
import FormData = require('form-data');
import got, {Response as GotResponse} from 'got/dist/source';
import {URL} from 'url';
import {Discoverer} from './discovery';
import {SubscriptionError} from './errors';
import {Storage, TempStorage} from './storage';
import {Events, RequestContext, Response} from './types';

export * from './discovery';
export * from './storage';

export interface SubscriberOptions {
  storage: Storage;
  baseUrl: string;
}

export class Subscriber extends EventEmitter implements Events {
  private discoverer = new Discoverer();
  private storage: Storage;
  private tempStorage: Storage = new TempStorage();
  private baseUrl: string;

  constructor({storage, baseUrl}: SubscriberOptions) {
    super();
    this.storage = storage;
    this.baseUrl = baseUrl;
  }

  private getCallbackUrl(subscriptionId: string): string {
    const url = new URL(this.baseUrl);
    url.pathname += '/' + subscriptionId;
    return url.toString();
  }

  private async sendRequest(hubUrl: string, form: FormData): Promise<void> {
    const response = await got
      .post(hubUrl, {body: form, followRedirect: true})
      .catch(err => {
        if (err.response) {
          return err.response as GotResponse;
        }
        throw err;
      });

    if (response.statusCode >= 400) {
      throw new SubscriptionError(
        `request failed with status code ${response.statusCode}: ${response.body}`
      );
    }
  }

  private validateBody(ctx: RequestContext, secret?: string): boolean {
    if (!secret) {
      return true;
    }

    const [algo, ...rest] = ctx.headers['X-Hub-Signature']?.split('=') || [];
    const checksum = rest.join('=');

    const supported = Boolean(
      {
        sha1: 1,
        sha256: 1,
        sha384: 1,
        sha512: 1,
      }[algo]
    );

    if (!supported) {
      return false;
    }

    const hash = createHmac(algo, secret).update(ctx.body).digest('hex');

    return hash === checksum;
  }

  async subscribe(
    topic: string,
    options?: {
      leaseSeconds?: number;
      secret?: string;
      subscriptionId?: string;
    }
  ): Promise<string> {
    const subscriptionId = options?.subscriptionId || uuid();
    const {hubUrl, selfUrl} = await this.discoverer.discover(topic);

    const form = new FormData();

    form.append('hub.callback', this.getCallbackUrl(subscriptionId));
    form.append('hub.mode', 'subscribe');
    form.append('hub.topic', selfUrl);

    if (options?.leaseSeconds) {
      form.append('hub.lease_seconds', options.leaseSeconds);
    }

    if (options?.secret) {
      form.append('hub.secret', options.secret);
    }

    await this.tempStorage.set(subscriptionId, {
      topicUrl: selfUrl,
      expiredAt: new Date(0),
    });

    await this.sendRequest(hubUrl, form);

    return subscriptionId;
  }

  async unsubscribe(
    topic: string,
    options?: {
      leaseSeconds?: number;
      secret?: string;
      subscriptionId?: string;
    }
  ): Promise<string> {
    const subscriptionId = options?.subscriptionId || uuid();
    const {hubUrl, selfUrl} = await this.discoverer.discover(topic);

    const form = new FormData();

    form.append('hub.callback', this.getCallbackUrl(subscriptionId));
    form.append('hub.mode', 'unsubscribe');
    form.append('hub.topic', selfUrl);

    await this.tempStorage.set(subscriptionId, {
      topicUrl: selfUrl,
      expiredAt: new Date(0),
    });

    await this.sendRequest(hubUrl, form);

    return subscriptionId;
  }

  async validateSubscription(
    ctx: RequestContext,
    subscriptionId: string
  ): Promise<Response> {
    const mode = ctx.query['hub.mode'];
    const topic = ctx.query['hub.topic'];
    const leaseSeconds = ctx.query['hub.lease_seconds'];
    const challenge = ctx.query['hub.challenge'];

    if (!mode || !topic) {
      return {
        status: 404,
        body: 'Not Found',
      };
    }

    // https://www.w3.org/TR/websub/#x5-2-subscription-validation
    if (mode === 'denied') {
      const reason =
        ctx.headers['hub.reason'] ||
        'subscribtion is denied for unknown reason';

      this.emit('denied', new SubscriptionError(reason));

      return {
        status: 200,
        body: '',
      };
    }

    // http://w3.org/TR/websub/#x5-3-hub-verifies-intent-of-the-subscriber
    if (mode === 'subscribe' || mode === 'unsubscribe') {
      const subscription = await this.tempStorage.get(subscriptionId);

      if (subscription && subscription.topicUrl === topic) {
        const eventName = mode === 'subscribe' ? 'subscribed' : 'unsubscribed';
        const args =
          mode === 'subscribe'
            ? [subscriptionId, topic, Number(leaseSeconds || 0)]
            : [subscriptionId, topic];
        this.emit(eventName, ...args);

        return {
          status: 200,
          body: challenge || '',
        };
      }
    }

    return {
      status: 404,
      body: 'Not Found',
    };
  }

  async receiveUpdate(
    ctx: RequestContext,
    subscriptionId: string
  ): Promise<Response> {
    const subscription = await this.storage.get(subscriptionId);

    if (!subscription) {
      return {
        status: 404,
        body: 'Not Found',
      };
    }

    if (this.validateBody(ctx, subscription.secret)) {
      this.emit('update', subscriptionId, subscription.topicUrl, ctx.body);
    }

    return {
      status: 200,
      body: 'Succeeded',
    };
  }
}
