
import { Document } from 'mongoose';
import { debtModel as DebtModel } from './model';
import { debtsToPersonDebtsInRoom } from './util';

export interface Value {
  amount: number;
  note: string;
}

export interface PersonDebt {
  roomId: string;
  from: string;
  to: {[to: string]: { debts: Value[], paids: Value[] }};
}

export async function addDebt(roomId: string, from: string, to: string, amount: number, note = ''): Promise<void> {
  if (from.length <= 0) {
    throw new Error('missing person name');
  }

  if (to.length <= 0) {
    throw new Error('missing person name');
  }

  if (amount <= 0) {
    throw new Error('missing debt amount');
  }

  await new DebtModel({ roomId, from, to, amount, note }).save();
}

export async function getAllDebt(roomId: string): Promise<PersonDebt[]> {
  const debts: Document[] = await DebtModel.find({roomId}).exec();
  return debtsToPersonDebtsInRoom(roomId, debts);
}

export async function getAllDebtFromUser(roomId: string, from: string): Promise<PersonDebt> {
  const debts: Document[] = await DebtModel.find({ roomId, from }).exec();
  const results = await debtsToPersonDebtsInRoom(roomId, debts);
  if (results.length === 0) {
    return { roomId, from, to: {} };
  } else {
    return results[0];
  }
}

export async function getTotalDebtFromUser(roomId: string, from: string): Promise<number> {
  const debts: Document[] = await DebtModel.find({ roomId, from }).exec();
  return debts.map(debt => debt.get('amount')).reduce((a,b) => a + b, 0);
}

export async function payDebt(roomId: string, from: string, to: string, amount: number, note=''): Promise<void> {
  if (from.length <= 0) {
    throw new Error('missing person name');
  }

  if (to.length <= 0) {
    throw new Error('missing person name');
  }

  if (amount <= 0) {
    throw new Error('missing debt amount');
  }

  await new DebtModel({ roomId, from, to, amount: -amount, note }).save();
}
