
const model = require('./model');

async function addDebt(roomId, from, to, amount, note='') {
  from = from.toLowerCase();
  to = to.toLowerCase();

  if (from.length <= 0 || to.length <= 0 || amount <= 0) {
    throw new Error('harus ada nama dan utangnya > 0');
  }

  return new model.DebtModel({ roomId, from, to, amount, note }).save()
}

async function getAllDebt(roomId) {
  const debts = await model.DebtModel.find({roomId}).exec();
  const result = {};
  for (const debt of debts) {
    if (!(debt.from in result)) {
      result[debt.from] = {};
    }
    if (!(debt.to in result[debt.from])) {
      result[debt.from][debt.to] = { debt: [], paid: [] };
    }
    if (debt.amount > 0) {
      result[debt.from][debt.to]['debt'].push(debt);
    } else {
      debt.amount *= -1;
      result[debt.from][debt.to]['paid'].push(debt);
    }
  }
  return result;
}

async function getAllDebtFromUser(roomId, from) {
  from = from.toLowerCase();
  const debts = await model.DebtModel.find({roomId, from}).exec();
  const result = {};
  for (const debt of debts) {
    if (!(debt.to in result)) {
      result[debt.to] = { debt: [], paid: [] };
    }
    if (debt.amount > 0) {
      result[debt.to]['debt'].push(debt);
    } else {
      debt.amount *= -1;
      result[debt.to]['paid'].push(debt);
    }
  }
  return result;
}

async function payDebt(roomId, from, to, amount, note='') {
  from = from.toLowerCase();
  to = to.toLowerCase();

  if (from.length <= 0 || to.length <= 0 || amount <= 0) {
    throw new Error('harus ada nama dan utangnya > 0');
  }

  amount = -amount;
  return new model.DebtModel({ roomId, from, to, amount, note }).save()
}

module.exports = { addDebt, getAllDebt, getAllDebtFromUser, payDebt };
