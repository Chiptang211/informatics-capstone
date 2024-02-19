'use strict';

const express = require('express');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

app.use(express.static('public'));
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});