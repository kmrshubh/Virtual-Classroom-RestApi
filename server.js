const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require("./db/connect");
const routes = require('./routes');

const app = express();
const port = 3000;

app.get("/", (req, res) => {
    res.send('Hi! This is virtual classroom');
  });

app.use(bodyParser.json());

app.use('/', routes);

const start = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`App running on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });