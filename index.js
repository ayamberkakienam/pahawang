
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const lineRouter = require('./line');

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/pahawang')
.then(() => console.log('connected to mongo database'))
.catch(err => {
  console.log('failed connect to mongo database ', err);
  process.exit();
});

const app = express();

app.use(lineRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => { console.log(`listening on ${port}`) });
