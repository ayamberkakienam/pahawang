
import { Client, MessageEvent, TextMessage } from '@line/bot-sdk';

import { Handler } from './handler';
import { Replier } from './replier';

export interface HandlerRoute {
  pattern: RegExp;
  handler: Handler;
}

export class Router {
  
  private routes: HandlerRoute[] = [];

  constructor(private client: Client) {
    this.middleware = this.middleware.bind(this);
    this.use = this.use.bind(this);
    this.handleTextMessageEvent = this.handleTextMessageEvent.bind(this);
  }

  use(pattern: RegExp, handler: Handler) {
    this.routes.push({ pattern, handler });
  }

  private async handleTextMessageEvent(event: MessageEvent) {  
    const message = (event.message as TextMessage).text;
    const replyToken = event.replyToken;
    const replier = new Replier(this.client, replyToken);

    for (const handlerRoute of this.routes) {
      const matches = message.match(handlerRoute.pattern);
      if (matches) {
        await handlerRoute.handler(event, matches, replier);
      }
    }
  }

  middleware() {
    return (req, res) => {
      const messageTextFilter = event => event.type === 'message' && event.message.type === 'text';
      const messageTextEvents: MessageEvent[] = req.body.events.filter(messageTextFilter);
      Promise.all(messageTextEvents.map(this.handleTextMessageEvent))
      .then(result => res.json('ok'))
      .catch(err => {
        console.error(err);
        res.status(500).end();
      });
    };
  }
  
}
