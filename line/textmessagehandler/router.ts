
import { MessageEvent, TextMessage } from '@line/bot-sdk';

import { Handler } from './handler';

export interface HandlerRoute {
  pattern: RegExp;
  handler: Handler;
}

export class Router {
  
  private routes: HandlerRoute[] = [];

  constructor() {
    this.middleware = this.middleware.bind(this);
    this.use = this.use.bind(this);
    this.handleTextMessageEvent = this.handleTextMessageEvent.bind(this);
  }

  use(pattern: RegExp, handler: Handler) {
    this.routes.push({ pattern, handler });
  }

  private async handleTextMessageEvent(event: MessageEvent) {
    const source = event.source;
  
    const userId = source.userId;
    let roomId = source.userId;
    if (source.type === 'room') {
      roomId = source.roomId;
    } else if (source.type === 'group') {
      roomId = source.groupId;
    }
  
    const message = (event.message as TextMessage).text;

    for (const handlerRoute of this.routes) {
      const matches = message.match(handlerRoute.pattern);
      if (matches) {
        await handlerRoute.handler(matches, event.replyToken, userId, roomId, message);
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
