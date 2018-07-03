
import * as express from 'express';
import * as line from '@line/bot-sdk';
import * as currencyFormatter from 'currency-formatter';

import {
  addDebt,
  payDebt,
  getAllDebtFromUser,
  getAllDebt,
  getTotalDebtFromUser,
  PersonDebt,
} from '../debt';
import { Router, Handler } from './textmessagehandler';
import { personDebtToLineBubble } from './debtformat';
import { FlexContainer, FlexBubble, FlexCarousel } from '@line/bot-sdk';

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

const personDebtDetailText = (personDebt: PersonDebt): string => {
  return Object.keys(personDebt.to).map(to => {
    const totalDebt = personDebt.to[to].debts.map(x => x.amount).reduce((a,b) => a + b, 0);
    const totalPaid = personDebt.to[to].paids.map(x => x.amount).reduce((a,b) => a + b, 0);
    const remaining = totalDebt - totalPaid;

    let remainingStr = `sisa ${toIDR(remaining)}`;
    if (remaining === 0) {
      remainingStr = `lunas`;
    } else if (remaining < 0) {
      remainingStr = `kelebihan ${toIDR(-remaining)}`;
    }
    
    return `ke ${toProperCase(to)} utang: ${toIDR(totalDebt)}, dibayar ${toIDR(totalPaid)}, ${remainingStr}`;
  }).join(`\n`);
};

lineHandler.use(/([a-zA-Z ]+)\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/, async (event, matches, replier) => {
  const [ all, from, to, amount, note ] = matches;
  const roomId = getEventRoomId(event);
  await addDebt(roomId, from.toLowerCase(), to.toLowerCase(), Number(amount), note);
  const total = await getTotalDebtFromUser(roomId, from.toLowerCase());

  if (total > 0) {
    await replier.text(`oke, total utang ${toProperCase(from)} ${toIDR(total)}`);
  } else if (total === 0) {
    await replier.text(`oke, utang ${toProperCase(from)} lunas semua`);
  } else {
    await replier.text(`oke, x bayar kelebihan ${toIDR(-total)}`);
  }
});

lineHandler.use(/([a-zA-Z ]+)\s+[bB][aA][yY][aA][rR]\s+([a-zA-Z ]+)\s+([0-9]+)\s*(.*)/, async (event, matches, replier) => {
  const [ all, from, to, amount, note ] = matches;
  const roomId = getEventRoomId(event);
  await payDebt(roomId, from.toLowerCase(), to.toLowerCase(), Number(amount), note);
  const total = await getTotalDebtFromUser(roomId, from.toLowerCase());
  
  if (total > 0) {
    await replier.text(`oke, total utang ${toProperCase(from)} ${toIDR(total)}`);
  } else if (total === 0) {
    await replier.text(`oke, utang ${toProperCase(from)} lunas semua`);
  } else {
    await replier.text(`oke, x bayar kelebihan ${toIDR(-total)}`);
  }
});

lineHandler.use(/[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s+([a-zA-Z ]+)\s*$/, async (event, matches, replier) => {
  const user = matches[1].toLowerCase();
  const roomId = getEventRoomId(event);
  const debtInfo: PersonDebt = await getAllDebtFromUser(roomId, user);

  if (Object.keys(debtInfo.to).length === 0) {
    await replier.text('belum ada hutang');
  } else {
    const altText = personDebtDetailText(debtInfo);
    await replier.flex(personDebtToLineBubble(debtInfo), altText);
  }
});

lineHandler.use(/[iI][nN][fF][oO]\s+[uU][tT][aA][nN][gG]\s*/, async (event, matches, replier) => {
  const roomId = getEventRoomId(event);
  const debtInfo: PersonDebt[] = await getAllDebt(roomId);

  if (debtInfo.length === 0) {
    await replier.text('belum ada hutang-hutangan');
  } else {
    const personDebtFlexes: FlexBubble[] = debtInfo.map(personDebtToLineBubble);
    const replyBubble: FlexCarousel = { type: 'carousel', contents: personDebtFlexes };

    const altText = debtInfo.map(personDebtDetailText).join(`\n`);
    await replier.flex(replyBubble, altText);
  }
});
