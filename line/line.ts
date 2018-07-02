
import * as express from 'express';
import * as line from '@line/bot-sdk';
import * as debtService from '../debt';

export const lineRouter: express.Router = express.Router();

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const lineClient: line.Client = new line.Client(lineConfig);

lineRouter.post('/webhooks/line', line.middleware(lineConfig), (req, res) => {
  const messageEvents: line.MessageEvent[] = req.body.events.filter(event => event.type === 'message' && event.message.type === 'text');
  Promise.all(messageEvents.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event: line.MessageEvent) {
  const source = event.source;
  
  let roomId = source.userId;
  if (source.type === 'room') {
    roomId = source.roomId;
  } else if (source.type === 'group') {
    roomId = source.groupId;
  }

  const message = (event.message as line.TextMessage).text;

  const addDebtRegex = /([a-zA-Z ]+)\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/;
  const addDebtMatch = message.match(addDebtRegex);
  if (addDebtMatch) {
    const [ all, from, to, amount, note ] = addDebtMatch;
    await debtService.addDebt(roomId, from, to, Number(amount), note);
    return lineClient.replyMessage(event.replyToken, { type: 'text', text: 'oke' });
  }

  const payDebtRegex = /([a-zA-Z ]+)\s+[bB][aA][yY][aA][rR]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/;
  const payDebtMatch = message.match(payDebtRegex);
  if (payDebtMatch) {
    const [ all, from, to, amount, note ] = payDebtMatch;
    await debtService.payDebt(roomId, from, to, Number(amount), note);
    return lineClient.replyMessage(event.replyToken, { type: 'text', text: 'oke' });
  }

  const infoUtangUser = /[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)/;
  const infoUtangUserMatch = message.match(infoUtangUser);
  if (infoUtangUserMatch) {
    const user = infoUtangUserMatch[1];
    const debtInfo = await debtService.getAllDebtFromUser(roomId, user);

    const replyMessage = debtInfo.map(debt => {
      const totalDebt = debt.debts.map(x => x.amount).reduce((a,b) => a + b, 0);
      const totalPaid = debt.paids.map(x => x.amount).reduce((a,b) => a + b, 0);
      const remaining = totalDebt - totalPaid;
      return `ke ${debt.to} utang: ${totalDebt}, dibayar ${totalPaid}, sisa: ${remaining}`;
    }).join(`\n`);

    return lineClient.replyMessage(event.replyToken, { type: 'text', text: replyMessage } );
  }

  const infoUtang = /[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s*/;
  const infoUtangMatch = message.match(infoUtang);
  if (infoUtangMatch) {
    const debtInfo = await debtService.getAllDebt(roomId);

    const replyMessage = debtInfo.map(debt => {
      const totalDebt = debt.debts.map(x => x.amount).reduce((a,b) => a + b, 0);
      const totalPaid = debt.paids.map(x => x.amount).reduce((a,b) => a + b, 0);
      const remaining = totalDebt - totalPaid;
      return `${debt.from} ke ${debt.to} utang: ${totalDebt}, dibayar ${totalPaid}, sisa: ${remaining}`;
    }).join(`\n`);

    return lineClient.replyMessage(event.replyToken, { type: 'text', text: replyMessage });
  }
}
