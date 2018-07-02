
const express = require('express');
const line = require('@line/bot-sdk');
const debtService = require('./debt');

const lineRouter = express.Router();

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

lineRouter.post('/api/v1/webhook', line.middleware(lineConfig), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

const lineClient = new line.Client(lineConfig);

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const source = event.source;
  const roomId = source.groupId || source.roomId || source.userId;
  const message = event.message.text;

  const addDebtRegex = /([a-zA-Z ]+)\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/;
  const addDebtMatch = message.match(addDebtRegex);
  if (addDebtMatch) {
    const [ all, from, to, amount, note ] = addDebtMatch;
    await debtService.addDebt(roomId, from, to, amount, note);
    return lineClient.replyMessage(event.replyToken, { type: 'text', text: 'oke' });
  }

  const payDebtRegex = /([a-zA-Z ]+)\s+[bB][aA][yY][aA][rR]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/;
  const payDebtMatch = message.match(payDebtRegex);
  if (payDebtMatch) {
    const [ all, from, to, amount, note ] = payDebtMatch;
    await debtService.payDebt(roomId, from, to, amount, note);
    return lineClient.replyMessage(event.replyToken, { type: 'text', text: 'oke' });
  }

  const infoUtangUser = /[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)/;
  const infoUtangUserMatch = message.match(infoUtangUser);
  if (infoUtangUserMatch) {
    const user = infoUtangUserMatch[1];
    const debtInfo = await debtService.getAllDebtFromUser(roomId, user);
    let replyMessage = '';
    for (const to in debtInfo) {
      const totalDebt = debtInfo[to].debt.map(x => x.amount).reduce((a,b) => a + b, 0);
      const totalPaid = debtInfo[to].paid.map(x => x.amount).reduce((a,b) => a + b, 0);
      const remaining = totalDebt - totalPaid;
      replyMessage += `ke ${to} utang: ${totalDebt}, dibayar: ${totalPaid}, sisa: ${remaining}\n`
    }
    return lineClient.replyMessage(event.replyToken, { type: 'text', text: replyMessage } );
  }

  const infoUtang = /[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s*/;
  const infoUtangMatch = message.match(infoUtang);
  if (infoUtangMatch) {
    const debtInfo = await debtService.getAllDebt(roomId);
    let replyMessage = '';
    for (const from in debtInfo) {
      for (const to in debtInfo[from]) {
        const totalDebt = debtInfo[from][to].debt.map(x => x.amount).reduce((a,b) => a + b, 0);
        const totalPaid = debtInfo[from][to].paid.map(x => x.amount).reduce((a,b) => a + b, 0);
        const remaining = totalDebt - totalPaid;
        replyMessage += `${from} -> ${to} utang: ${totalDebt}, dibayar: ${totalPaid}, sisa: ${remaining}\n`
      }
    }
    return lineClient.replyMessage(event.replyToken, { type: 'text', text: replyMessage });
  }
}

module.exports = lineRouter;
