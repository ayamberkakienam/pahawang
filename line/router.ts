
import * as express from 'express';
import { middleware } from '@line/bot-sdk';
import { lineHandler  } from './line';

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

export const router: express.Router = express.Router();

router.post('/webhooks', middleware(lineConfig), lineHandler.middleware());
