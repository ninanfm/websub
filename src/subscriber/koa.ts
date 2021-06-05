import * as Koa from 'koa';
import * as route from 'koa-route';
import {URL} from 'url';
import {Subscriber, SubscriberOptions} from '.';
import {RequestContext} from './types';

export const createApp = (
  options: SubscriberOptions
): {
  app: Koa;
  subscriber: Subscriber;
} => {
  const app = new Koa();
  const subscriber = new Subscriber(options);
  const basePath = getBasePath(options.baseUrl);

  app.use(
    route.get(`${basePath}/:sid`, async (ctx, sid) => {
      const res = await subscriber.validateSubscription(
        ctx as RequestContext,
        sid
      );
      Object.assign(ctx, res);
    })
  );

  app.use(
    route.post(`${basePath}/:sid`, async (ctx, sid) => {
      const res = await subscriber.receiveUpdate(ctx as RequestContext, sid);
      Object.assign(ctx, res);
    })
  );

  return {app, subscriber};
};

function getBasePath(baseUrl: string): string {
  const url = new URL(baseUrl);
  return url.pathname.replace(/^\/$/, '');
}
