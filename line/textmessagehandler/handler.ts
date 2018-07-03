
import { MessageEvent, TextEventMessage } from '@line/bot-sdk';

export interface Handler {
  (event?: MessageEvent, matches?: string[]): Promise<void>;
}