import { Observable } from 'rxjs/Observable';
import { ColdObservable } from 'rxjs/testing/ColdObservable';
import { HotObservable } from 'rxjs/testing/HotObservable';
import { SubscriptionLog } from 'rxjs/testing/SubscriptionLog';
import { marbleAssert } from './assert/marbleAssert';
import { parseObservableMarble } from './marbles/parseObservableMarble';
import { parseSubscriptionMarble } from './marbles/parseSubscriptionMarble';
import { TestMessage } from './message/TestMessage';
import { complete, error, next, subscribe } from './message/TestMessage';
import { TestScheduler } from './scheduler/TestScheduler';

//workaround TS4029 by explicitly import types and avoid unused import error
(() => Observable.toString())();
(() => ColdObservable.toString())();
(() => HotObservable.toString())();

export type RxSandboxInstance = {
  /**
   * Creates a hot observable using marble diagram DSL, or TestMessage.
   */
  hot: typeof TestScheduler.prototype.createHotObservable;
  /**
   * Creates a cold obsrevable using marbld diagram DSL, or TestMessage.
   */
  cold: typeof TestScheduler.prototype.createColdObservable;
  /**
   * Flush out currently scheduled observables, fill values returned by `getMarbles`.
   */
  flush: typeof TestScheduler.prototype.flush;
  /**
   * Flush out currently scheduled observables, only until reaches frame specfied.
   */
  advanceTo: typeof TestScheduler.prototype.advanceTo;
  /**
   * Get array of observable value's metadata TestMessage<T> from observable
   * created via `hot` or `cold`. Returned array will be filled once scheduler flushes
   * scheduled actions, either via explicit `flush` or implicit `autoFlush`.
   */
  getMessages: typeof TestScheduler.prototype.getMessages;
  /**
   * Utility function to generate `expected` values via marble diagram.
   */
  e: <T = string>(
    marble: string,
    value?: { [key: string]: T } | null,
    error?: any
  ) => Readonly<Array<TestMessage<T | Array<TestMessage<T>>>>>;
  /**
   * Utility function to generate `expected` subscriptions via marble diagram.
   */
  s: (marble: string) => SubscriptionLog;
};

export interface RxSandbox {
  /**
   * Creates new instance of test scheduler for testing observables.
   *
   * @param {boolean} [autoFlush] Flush scheduler automatically when `getMarbles` is being called. False by default.
   * @param {number} [frameTimeFactor] Custom frametime factor for virtual time frame. 1 by default.
   * @param {number} [maxFrameValue] Maximum frame value of marble diagram can be read.
   * If marble has value over max frame, it'll be ignored when scheduler flushes out.
   * 1000 * frameTimeFactory by default.
   * @return {RxSandboxInstance} instance of test scheduler interfaces.
   */
  create(autoFlush?: boolean, frameTimeFactor?: number, maxFrameValue?: number): RxSandboxInstance;
  /**
   * Utility assertion method to assert marble based observable test messages.
   * By default return values of sandbox functions are plain object works with
   * any testing framework or assertion library, while this assertion provides
   * better visualization against observable test messages.
   *
   */
  marbleAssert<T = string>(
    source: Array<TestMessage<T | Array<TestMessage<T>>>> | Readonly<Array<TestMessage<T | Array<TestMessage<T>>>>>
  ): {
    to: {
      equal(
        expected:
          | Array<TestMessage<T | Array<TestMessage<T>>>>
          | Readonly<Array<TestMessage<T | Array<TestMessage<T>>>>>
      ): void;
    };
  };
  marbleAssert(source: Array<SubscriptionLog>): { to: { equal(expected: Array<SubscriptionLog>): void } };
}

const rxSandbox: RxSandbox = {
  create: (autoFlush: boolean = false, frameTimeFactor: number = 1, maxFrameValue = 1000) => {
    const scheduler = new TestScheduler(autoFlush, frameTimeFactor, maxFrameValue);

    return {
      hot: scheduler.createHotObservable.bind(scheduler) as typeof scheduler.createHotObservable,
      cold: scheduler.createColdObservable.bind(scheduler) as typeof scheduler.createColdObservable,
      flush: scheduler.flush.bind(scheduler) as typeof scheduler.flush,
      advanceTo: scheduler.advanceTo.bind(scheduler) as typeof scheduler.advanceTo,
      getMessages: scheduler.getMessages.bind(scheduler) as typeof scheduler.getMessages,
      e: <T = string>(marble: string, value?: { [key: string]: T } | null, error?: any) =>
        parseObservableMarble(marble, value, error, true, frameTimeFactor, frameTimeFactor * maxFrameValue),
      s: (marble: string) => parseSubscriptionMarble(marble, frameTimeFactor, frameTimeFactor * maxFrameValue)
    };
  },
  marbleAssert: marbleAssert
};

export { rxSandbox, TestMessage, next, error, complete, subscribe };
