
import { Client, FlexContainer } from '@line/bot-sdk';

export class Replier {

  constructor(private client: Client, private replyToken: string) {
  }

  async text(message: string): Promise<void> {
    return this.client.replyMessage(this.replyToken, { type: 'text', text: message });
  }

  async flex(message: FlexContainer, altText: string) {
    return this.client.replyMessage(this.replyToken, { type: 'flex', altText, contents: message });
  }

}
