
import { FlexComponent, FlexBox, FlexBubble } from '@line/bot-sdk';
import * as moment from 'moment';
import * as currencyFormatter from 'currency-formatter';

import { PersonDebt, Value } from '../debt';

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

export function personDebtToLineBubble(debt: PersonDebt): FlexBubble  {
  moment.locale('ID');
  const currentDate = moment().format('LLL');
  const separator: FlexComponent = { type: 'separator', margin: 'xxl' };
  let total = 0;

  const contents: FlexComponent[] = [];
  for (const to in debt.to) {
    if (debt.to.hasOwnProperty(to)) {
      const debts: Value[] = debt.to[to].debts.map(d => ({note: d.note.trim(), amount: d.amount}));
      const paids: Value[] = debt.to[to].paids.map(d => ({note: d.note.trim(), amount: -d.amount}));

      const otherDebts: number = debts.filter(d => d.note.length === 0).map(d => d.amount).reduce((a,b) => a + b, 0);
      const otherPaids: number = paids.filter(d => d.note.length === 0).map(d => d.amount).reduce((a,b) => a + b, 0);

      const totalDebts: Value[] = debts.filter(d => d.note.length > 0).concat([ { amount: otherDebts, note: 'Hutang lainnya' } ]);
      const totalPaids: Value[] = paids.filter(d => d.note.length > 0).concat([ { amount: otherPaids, note: 'Bayaran lainnya' } ]);

      const currentTotal = totalDebts.concat(totalPaids).map(d => d.amount).reduce((a,b) => a + b, 0);
      total += currentTotal;

      const debtsContent: FlexBox[] = totalDebts.concat(totalPaids).map((debt: Value): FlexBox => ({
        type: 'box',
        layout: 'horizontal',
        contents: [
          { type: 'text', text: debt.note, size: 'sm', color: '#555555', flex: 0 },
          { type: 'text', text: toIDR(debt.amount), size: 'sm', color: '#111111', align: 'end' }
        ]
      }));

      let remaining: FlexComponent = { type: 'box', layout: 'horizontal',
        contents: [
          { type: 'text', text: 'Belum dibayar', weight: 'bold', size: 'sm', color: '#555555', flex: 0 },
          { type: 'text', text: toIDR(currentTotal), size: 'sm', color: '#111111', align: 'end' }
        ]
      };
      if (currentTotal === 0) {
        remaining = { type: 'text', text: 'Lunas', weight: 'bold', size: 'sm', color: '#555555', flex: 0 };
      } else if (currentTotal < 0) {
        remaining =  { type: 'box', layout: 'horizontal',
          contents: [
            { type: 'text', text: 'Kelebihan', weight: 'bold', size: 'sm', color: '#555555', flex: 0 },
            { type: 'text', text: toIDR(-currentTotal), size: 'sm', color: '#111111', align: 'end' }
          ]
        };
      }

      const debtsBody: FlexBox = {
        type: 'box',
        layout: 'vertical',
        margin: 'xxl',
        spacing: 'sm',
        contents: [
          { type: 'text', text: toProperCase(to), weight: 'bold', size: 'sm'} as FlexComponent
        ].concat(debtsContent).concat([remaining]),
      };

      contents.push(debtsBody);
      contents.push(separator);
    }
  }
  contents.pop();

  return {
    type: 'bubble',
    styles: { footer: { separator: true } },
    body: {
      type: 'box', layout: 'vertical',
      contents: [
        { type: 'text', text: 'Hutang', weight: 'bold', color: '#1DB446', size: 'sm' },
        { type: 'text', text: toProperCase(debt.from), weight: 'bold', size: 'xxl', margin: 'md' },
        { type: 'text', text: `Per ${currentDate}`, size: 'xs', color: '#aaaaaa', wrap: true },
        separator,
        { type: 'box', layout: 'vertical', margin: 'xxl', spacing: 'sm', contents },
        separator,
        { type: 'box', layout: 'horizontal', margin: 'md',
          contents: [
            { type: 'text', text: 'Total', size: 'xs', color: '#333333', flex: 0 },
            { type: 'text', text: toIDR(total), color: '#333333', size: 'xs', align: 'end' }
          ]
        }
      ]
    }
  };
}
