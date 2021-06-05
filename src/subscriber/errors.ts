export abstract class SubscriberError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, SubscriberError.prototype);
  }
}

export class DiscoveryError extends SubscriberError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, DiscoveryError.prototype);
  }
}

export class SubscriptionError extends SubscriberError {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, SubscriptionError.prototype);
  }
}
