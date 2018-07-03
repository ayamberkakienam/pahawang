
import { Client } from '@line/bot-sdk';

export class Replier {

    constructor(private client: Client, private replyToken: string) {
    }

    async text(message: string): Promise<void> {
        return this.client.replyMessage(this.replyToken, { type: 'text', text: message });
    }

}