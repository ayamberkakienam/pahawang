
import * as mongoose from 'mongoose';
import * as express from 'express';
import * as morgan from 'morgan';
import { router as lineRouter } from '../line';

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/pahawang')
.then(() => console.log('connected to mongo database'))
.catch(err => {
  console.log('failed connect to mongo database ', err);
  process.exit();
});

export const app = express();

app.use(morgan('combined'));
app.use('/line', lineRouter);
