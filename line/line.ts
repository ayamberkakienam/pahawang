
import * as express from 'express';
import * as line from '@line/bot-sdk';
import * as debtService from '../debt';
import { Router, Handler } from './textmessagehandler';

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const lineClient: line.Client = new line.Client(lineConfig);

const lineHandler = new Router();

export const lineRouter: express.Router = express.Router();

lineHandler.use(/([a-zA-Z ]+)\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/, async (matches, replyToken, userId, roomId, text) => {
  const [ all, from, to, amount, note ] = matches;
  await debtService.addDebt(roomId, from, to, Number(amount), note);
  return lineClient.replyMessage(replyToken, { type: 'text', text: 'oke' });
});

lineHandler.use(/([a-zA-Z ]+)\s+[bB][aA][yY][aA][rR]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/, async (matches, replyToken, userId, roomId, text) => {
  const [ all, from, to, amount, note ] = matches;
  await debtService.addDebt(roomId, from, to, Number(amount), note);
  return lineClient.replyMessage(replyToken, { type: 'text', text: 'oke' });
});

lineHandler.use(/[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)\s*$/, async (matches, replyToken, userId, roomId, text) => {
  const user = matches[1];
  const debtInfo = await debtService.getAllDebtFromUser(roomId, user);

  const replyMessage = debtInfo.map(debt => {
    const totalDebt = debt.debts.map(x => x.amount).reduce((a,b) => a + b, 0);
    const totalPaid = debt.paids.map(x => x.amount).reduce((a,b) => a + b, 0);
    const remaining = totalDebt - totalPaid;
    return `ke ${debt.to} utang: ${totalDebt}, dibayar ${totalPaid}, sisa: ${remaining}`;
  }).join(`\n`);

  return lineClient.replyMessage(replyToken, { type: 'text', text: replyMessage } );
});

lineHandler.use(/[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s*/, async (matches, replyToken, userId, roomId, text) => {
  const debtInfo = await debtService.getAllDebt(roomId);

  const replyMessage = debtInfo.map(debt => {
    const totalDebt = debt.debts.map(x => x.amount).reduce((a,b) => a + b, 0);
    const totalPaid = debt.paids.map(x => x.amount).reduce((a,b) => a + b, 0);
    const remaining = totalDebt - totalPaid;
    return `${debt.from} ke ${debt.to} utang: ${totalDebt}, dibayar ${totalPaid}, sisa: ${remaining}`;
  }).join(`\n`);

  return lineClient.replyMessage(replyToken, { type: 'text', text: replyMessage });
});

lineRouter.post('/webhooks', lineHandler.middleware());

