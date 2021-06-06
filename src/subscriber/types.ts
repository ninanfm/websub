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
  denied: (
    err: Error,
    data: {subscriptionId: string; topicUrl: string}
  ) => void;
  subscribed: (data: {
    subscriptionId: string;
    topicUrl: string;
    leaseSeconds: number;
  }) => void;
  unsubscribed: (data: {subscriptionId: string; topicUrl: string}) => void;
  update: (data: {
    subscriptionId: string;
    topicUrl: string;
    body?: string;
    isValid: boolean;
  }) => void;
}

export interface Subscription {
  topicUrl: string;
  expiredAt: Date;
  secret?: string;
}
