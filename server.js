'use strict';

const express = require('express');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());

async function getDBConnection() {
  const db = await sqlite.open({
      filename: 'data.db',
      driver: sqlite3.Database
  });

  return db;
}

app.post('/test/send', async (req, res) => {
  try {
      let { message, date, time} = req.body;
      if (!message || !date || !time) {
          return res.status(400).send('Missing data');
      }

      const db = await getDBConnection();

      const result = await db.run(`INSERT INTO test (test_date, test_time, test_message) VALUES (?, ?, ?)`, [message, date, time]);

      if (result && result.lastID) {
          return res.status(201).json({ testId: result.lastID });
      } else {
          return res.status(500).send('Could not store test message to DB');
      }
  } catch (error) {
      console.error('Failed to store message to DB', error);
      return res.status(500).send('Internal Server Error');
  }
});

app.get('/test/lookup', async (req, res) => {
  const { testId } = req.query;
  if (!testId) {
      return res.status(400).send('Missing or invalid testId');
  }

  const db = await getDBConnection();
  try {
      if (testId === 'all') {
          const allInfo = await db.all(`SELECT test_id, test_date, test_time, test_message FROM test`);
          return res.status(200).json(allInfo);
      } else {
          const info = await db.all(`SELECT test_id, test_date, test_time, test_message FROM test WHERE test_id = ?`, [testId]);
          if (info.length === 0) {
              return res.status(404).send('Test Record not Found');
          }
          res.status(200).json(info);
      }
  } catch (error) {
      console.error('Failed to lookup test record', error);
      res.status(500).send('Internal Server Error');
  }
});


app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});