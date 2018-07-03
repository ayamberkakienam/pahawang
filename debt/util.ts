
import { Document } from 'mongoose';
import { PersonDebt } from './service';

export function debtsToPersonDebtsInRoom(roomId: string, debts: Document[]): PersonDebt[] {
  debts = debts.filter(debt => debt.get('from').length > 0 && debt.get('to').length > 0);
  const result = {};
  for (const debt of debts) {
    const from = debt.get('from');
    const to = debt.get('to');
    const amount = debt.get('amount');
    const note = debt.get('note');
    
    if (!(from in result)) {
      result[from] = {};
    }
    if (!(to in result[from])) {
      result[from][to] = { debts: [], paids: [] };
    }
    if (amount > 0) {
      result[from][to]['debts'].push({ from, to, amount, note });
    } else {
      result[from][to]['paids'].push({ from, to, amount: -amount, note });
    }
  }

  const personDebts = [];
  for (const from in result) {
    if (result.hasOwnProperty(from)) {
      const personDebt: PersonDebt = { from, roomId, to: {}, };
      for (const to in result[from]) {
        if (result[from].hasOwnProperty(to)) {
          personDebt.to[to] = {
            debts: result[from][to].debts.map(debt => ({ amount: debt.amount, note: debt.note })),
            paids: result[from][to].paids.map(debt => ({ amount: debt.amount, note: debt.note })),
          };
        }
      }
      personDebts.push(personDebt);
    }
  }

  return personDebts;
}
