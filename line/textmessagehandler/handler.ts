
import { TextEventMessage } from '@line/bot-sdk';

export interface Handler {
  (matches?: string[], replyToken?: string, userId?: string, roomId?: string, text?: string): Promise<void>;
}
