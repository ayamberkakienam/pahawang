
import { Document } from 'mongoose';
import { PersonDebt } from './service';

export function debtsToPersonDebtsInRoom(roomId: string, debts: Document[]): PersonDebt[] {
  debts = debts.filter(debt => debt.get('from').length > 0 && debt.get('to').length > 0 && debt.get('amount') > 0);
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
      result[from][to] = { debt: [], paid: [] };
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
      for (const to in result[from]) {
        if (result[from].hasOwnProperty(to)) {
          personDebts.push({
            from, to, roomId,
            debts: result[from][to].debts.map(debt => ({ amount: debt.amount, note: debt.note })),
            paids: result[from][to].paids.map(paid => ({ amount: paid.amount, note: paid.note }))
          });
        }
      }
    }
  }

  return personDebts;
}
