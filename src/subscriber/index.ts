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
import debug from './debug';

export * from './discovery';
export * from './storage';

export interface SubscriberOptions {
  storage: Storage;
  baseUrl: string;
}

export declare interface Subscriber {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;

  emit<U extends keyof Events>(
    event: U,
    ...args: Parameters<Events[U]>
  ): boolean;
}

export class Subscriber extends EventEmitter {
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
    url.pathname = url.pathname.replace(/^\/$/, '') + '/' + subscriptionId;
    return url.toString();
  }

  private async sendRequest(hubUrl: string, form: FormData): Promise<void> {
    debug(`send request to hub with payload ${JSON.stringify(form)}`);

    const response = await got
      .post(hubUrl, {body: form, followRedirect: true})
      .catch(err => {
        if (err.response) {
          return err.response as GotResponse;
        }
        throw err;
      });

    debug(`response with status code ${response.statusCode}`);

    if (response.statusCode >= 400) {
      throw new SubscriptionError(
        `request failed with status code ${response.statusCode}: ${response.body}`
      );
    }
  }

  private validateBody(ctx: RequestContext, secret?: string): boolean {
    const signature = ctx.headers['X-Hub-Signature'];
    const body = ctx.body;

    if (!(secret && body && signature)) {
      return true;
    }

    const [algo, ...rest] = signature || [];
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

    const hash = createHmac(algo, secret).update(body).digest('hex');

    return hash === checksum;
  }

  async subscribe(
    topic: string,
    options: {
      leaseSeconds?: number;
      secret?: string;
      subscriptionId?: string;
    } = {}
  ): Promise<string> {
    debug(`subscribe ${topic} with options ${JSON.stringify(options)}`);

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
    options: {
      leaseSeconds?: number;
      secret?: string;
      subscriptionId?: string;
    } = {}
  ): Promise<string> {
    debug(`unsubscribe ${topic} with options ${JSON.stringify(options)}`);

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

    debug('validate subscription', {
      mode,
      topic,
      leaseSeconds,
      challenge,
    });

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

      this.emit('denied', new SubscriptionError(reason), {
        subscriptionId,
        topicUrl: topic,
      });

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
        const data =
          mode === 'subscribe'
            ? {
                subscriptionId,
                topicUrl: topic,
                leaseSeconds: Number(leaseSeconds || 0),
              }
            : {subscriptionId, topicUrl: topic};
        this.emit(eventName, data);

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
    debug('receive update', {
      subscriptionId,
      topic: ctx.query['hub.topic'],
      body: ctx.body,
      checksum: ctx.headers['X-Hub-Signature'],
    });

    const subscription = await this.storage.get(subscriptionId);

    if (!subscription) {
      return {
        status: 404,
        body: 'Not Found',
      };
    }

    this.emit('update', {
      subscriptionId,
      topicUrl: subscription.topicUrl,
      body: ctx.body,
      isValid: this.validateBody(ctx, subscription.secret),
    });

    return {
      status: 200,
      body: 'Succeeded',
    };
  }
}
