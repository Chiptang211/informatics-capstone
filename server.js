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

function getDates(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

async function fetchDataForDate(date) {
    const fetch = (await import('node-fetch')).default;
    const formattedDate = date.toISOString().split('T')[0];
    const apiUrl = `https://data.cdc.gov/resource/2ew6-ywp6.json?wwtp_jurisdiction=Washington&date_start=${formattedDate}&$limit=50000`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
}

app.post('/update/all', async (req, res) => {
    const startDate = new Date('2022-01-01');
    const endDate = new Date();
    const dates = getDates(startDate, endDate);

    try {
        const db = await getDBConnection();

        for (const date of dates) {
            const data = await fetchDataForDate(date);
            const insertQuery = `INSERT INTO covid_wastewater (covid_id, state, county_name, county_fips, plant_name, plant_id, population, percent_change, detect_proportion, percentile, date_start, date_end)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(covid_id) DO NOTHING`;

            for (const item of data) {
                const percentChange15d = item.ptc_15d !== null ? item.ptc_15d : 0;
                const detectProp15d = item.detect_prop_15d !== null ? item.detect_prop_15d : 0;

                const covid_id = `${item.date_start}_${item.wwtp_id}`;
                await db.run(insertQuery, [
                    covid_id,
                    item.wwtp_jurisdiction,
                    item.county_names,
                    item.county_fips,
                    item.key_plot_id,
                    item.wwtp_id,
                    item.population_served,
                    percentChange15d,
                    detectProp15d,
                    item.percentile || 'default_percentile_value',
                    item.date_start,
                    item.date_end
                ]);
            }
        }

        res.status(200).json({ message: 'Data fetched and inserted successfully' });
    } catch (error) {
        console.error('Error fetching or inserting data:', error);
        res.status(500).json({ error: 'Failed to fetch or insert data into the database' });
    }
});

app.post('/update/30', async (req, res) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const dates = getDates(startDate, endDate);

    try {
        const db = await getDBConnection();

        for (const date of dates) {
            const data = await fetchDataForDate(date);
            const insertQuery = `INSERT INTO covid_wastewater (covid_id, state, county_name, county_fips, plant_name, plant_id, population, percent_change, detect_proportion, percentile, date_start, date_end)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(covid_id) DO NOTHING`;

            for (const item of data) {
                const percentChange15d = item.ptc_15d !== null ? item.ptc_15d : 0;
                const detectProp15d = item.detect_prop_15d !== null ? item.detect_prop_15d : 0;

                const covid_id = `${item.date_start}_${item.wwtp_id}`;
                await db.run(insertQuery, [
                    covid_id,
                    item.wwtp_jurisdiction,
                    item.county_names,
                    item.county_fips,
                    item.key_plot_id,
                    item.wwtp_id,
                    item.population_served,
                    percentChange15d,
                    detectProp15d,
                    item.percentile || 'default_percentile_value',
                    item.date_start,
                    item.date_end
                ]);
            }
        }

        res.status(200).json({ message: 'Data for the last 30 days fetched and inserted successfully.' });
    } catch (error) {
        console.error('Error fetching or inserting data:', error);
        res.status(500).json({ error: 'Failed to fetch or insert data into the database for the last 30 days.' });
    }
});

app.post('/fetch/data', async (req, res) => {
    const { countyFips, dateStart } = req.body;

    try {
        const db = await getDBConnection();
        const query = `
            SELECT detect_proportion, percentile, percent_change
            FROM covid_wastewater 
            WHERE (',' || county_fips || ',' LIKE ?) AND date_start = ? 
            LIMIT 1`;
        const params = [`%,${countyFips},%`, dateStart];

        const record = await db.get(query, params);

        if (record) {
            res.json({
                status: 'success',
                data: {
                    percent_change: record.percent_change,
                    detect_proportion: record.detect_proportion,
                    percentile: record.percentile
                }
            });
        } else {
            res.status(404).json({ status: 'error', message: 'No matching records found.' });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to query the database.' });
    }
});


app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});