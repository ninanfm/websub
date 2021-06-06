export interface RequestContext {
  headers: {
    [key: string]: string | undefined;
  };
  query: {
    [key: string]: string | undefined;
  };
  body: string;
}

export interface Response {
  status: number;
  body: string;
}

export interface Events {
  on(
    event: 'denied',
    listener: (
      err: Error,
      data: {subscriptionId: string; topicUrl: string}
    ) => void
  ): void;
  on(
    event: 'subscribed',
    listener: (
      subscriptionId: string,
      topicUrl: string,
      leaseSeconds: number
    ) => void
  ): void;
  on(
    event: 'unsubscribed',
    listener: (data: {subscriptionId: string; topicUrl: string}) => void
  ): void;
  on(
    event: 'update',
    listener: (data: {
      subscriptionId: string;
      topicUrl: string;
      body: string;
      isValid: boolean;
    }) => void
  ): void;
}

export interface Subscription {
  topicUrl: string;
  expiredAt: Date;
  secret?: string;
}
