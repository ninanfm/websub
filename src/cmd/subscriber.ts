import * as convict from 'convict';
import {MemoryStorage} from '../subscriber';
import {createApp} from '../subscriber/koa';

const config = convict({
  host: {
    format: String,
    default: '0.0.0.0',
    arg: 'host',
  },
  port: {
    format: Number,
    default: 8888,
    arg: 'port',
  },
  baseUrl: {
    format: String,
    default: null,
    arg: 'base-url',
  },
  topic: {
    format: String,
    default: null,
    arg: 'topic',
  },
});

const {app, subscriber} = createApp({
  baseUrl: config.get('baseUrl')!,
  storage: new MemoryStorage(),
});

subscriber.on('subscribed', data => {
  console.log('subscribed', data);
});

subscriber.on('update', data => {
  console.log('update', data);
});

app.listen(config.get('port'), config.get('host'), () => {
  console.log('this server is just for development');
  subscriber.subscribe(config.get('topic')!, {
    secret: 'xdd',
  });
});
