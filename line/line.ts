
import * as express from 'express';
import * as line from '@line/bot-sdk';
import * as currencyFormatter from 'currency-formatter';

import {
  addDebt,
  payDebt,
  getAllDebtFromUser,
  getAllDebt,
  getTotalDebtFromUser,
} from '../debt';
import { Router, Handler } from './textmessagehandler';

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const lineClient: line.Client = new line.Client(lineConfig);

export const lineHandler = new Router(lineClient);

const getEventRoomId = (event: line.MessageEvent) => {
  if (event.source.type === 'user') {
    return event.source.userId;
  } else if (event.source.type === 'room') {
    return event.source.roomId;
  } else {
    return event.source.groupId;
  }
};

function toProperCase(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

const toIDR = (amount: number) => currencyFormatter.format(amount, {
  symbol: 'Rp',
  decimal: ',',
  thousand: '.',
  precision: 2,
  format: '%s%v'
});

lineHandler.use(/([a-zA-Z ]+)\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/, async (event, matches, replier) => {
  const [ all, from, to, amount, note ] = matches;
  const roomId = getEventRoomId(event);
  await addDebt(roomId, from.toLowerCase(), to.toLowerCase(), Number(amount), note);
  const total = await getTotalDebtFromUser(roomId, from.toLowerCase());
  await replier.text(`oke, total utang ${toProperCase(from)} ${toIDR(total)}`);
});

lineHandler.use(/([a-zA-Z ]+)\s+[bB][aA][yY][aA][rR]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/, async (event, matches, replier) => {
  const [ all, from, to, amount, note ] = matches;
  const roomId = getEventRoomId(event);
  await payDebt(roomId, from.toLowerCase(), to.toLowerCase(), Number(amount), note);
  const total = await getTotalDebtFromUser(roomId, from.toLowerCase());
  await replier.text(`oke, total utang ${toProperCase(from)} ${toIDR(total)}`);
});

lineHandler.use(/[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)\s*$/, async (event, matches, replier) => {
  const user = matches[1].toLowerCase();
  const roomId = getEventRoomId(event);
  const debtInfo = await getAllDebtFromUser(roomId, user);

  if (debtInfo.length === 0) {
    await replier.text('belum ada hutang');
  } else {
    const replyMessage = debtInfo.map(debt => {
      const totalDebt = debt.debts.map(x => x.amount).reduce((a,b) => a + b, 0);
      const totalPaid = debt.paids.map(x => x.amount).reduce((a,b) => a + b, 0);
      const remaining = totalDebt - totalPaid;

      let remainingStr = `sisa ${toIDR(remaining)}`;
      if (remaining === 0) {
        remainingStr = `lunas`;
      } else if (remaining < 0) {
        remainingStr = `kelebihan ${toIDR(-remaining)}`;
      }
      
      return `ke ${toProperCase(debt.to)} utang: ${toIDR(totalDebt)}, dibayar ${toIDR(totalPaid)}, ${remainingStr}`;
    }).join(`\n`);
    await replier.text(replyMessage);
  }
});

lineHandler.use(/[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s*/, async (event, matches, replier) => {
  const roomId = getEventRoomId(event);
  const debtInfo = await getAllDebt(roomId);

  if (debtInfo.length === 0) {
    await replier.text('belum ada hutang');
  } else {
    const replyMessage = debtInfo.map(debt => {
      console.log(debt);
      const totalDebt = debt.debts.map(x => x.amount).reduce((a,b) => a + b, 0);
      const totalPaid = debt.paids.map(x => x.amount).reduce((a,b) => a + b, 0);
      const remaining = totalDebt - totalPaid;

      let remainingStr = `sisa ${toIDR(remaining)}`;
      if (remaining === 0) {
        remainingStr = `lunas`;
      } else if (remaining < 0) {
        remainingStr = `kelebihan ${toIDR(-remaining)}`;
      }

      return `${toProperCase(debt.from)} ke ${toProperCase(debt.to)} utang: ${toIDR(totalDebt)}, dibayar ${toIDR(totalPaid)}, ${remainingStr}`;
    }).join(`\n`);
    await replier.text(replyMessage);
  }
});
