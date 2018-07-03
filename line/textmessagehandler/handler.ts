
import { MessageEvent } from '@line/bot-sdk';

import { Replier } from './replier';

export interface Handler {
  (event?: MessageEvent, matches?: string[], replier?: Replier): Promise<void>;
}
