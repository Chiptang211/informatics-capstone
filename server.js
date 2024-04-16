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

async function calculateRisk() {
    const db = await getDBConnection();
    try {
        // Fetch all data for calculation, ordered by plant and date
        const rows = await db.all(`SELECT covid_id, plant_id, percent_change, date_start FROM covid_wastewater ORDER BY plant_id, date_start`);

        // To hold smoothed values for each plant
        const smoothData = {};
        const riskScores = {};

        rows.forEach(row => {
            if (!smoothData[row.plant_id]) {
                smoothData[row.plant_id] = []; // Initialize array for new plants
            }

            // Push current percent_change into the array for the plant
            smoothData[row.plant_id].push(row.percent_change);

            // Calculate smoothed value using a simple moving average, considering only the last 3 values
            if (smoothData[row.plant_id].length > 3) {
                smoothData[row.plant_id].shift(); // Remove the oldest entry if more than 3
            }

            const average = smoothData[row.plant_id].reduce((a, b) => a + (b || 0), 0) / smoothData[row.plant_id].length;
            const pcrConcSmoothed = isNaN(average) ? null : average;

            // Determine the risk score based on smoothed PCR concentration
            let riskScore;
            if (pcrConcSmoothed <= 25) {
                riskScore = 1;
            } else if (pcrConcSmoothed <= 75) {
                riskScore = 5;
            } else {
                riskScore = 10;
            }

            // Store the latest risk score for each plant
            riskScores[row.plant_id] = { score: riskScore, date: row.date_start };

            // Update database with smoothed value and risk score
            db.run(`UPDATE covid_wastewater SET pcr_conc_smoothed = ?, risk_score = ? WHERE covid_id = ?`, [pcrConcSmoothed, riskScore, row.covid_id]);
        });

        console.log('PCR concentrations smoothed and risk scores updated successfully');
        console.log('Latest risk scores:', riskScores);
    } catch (error) {
        console.error('Error calculating smoothed PCR concentrations or updating risk scores:', error);
    }
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

            calculateRisk();
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

            calculateRisk();
        }

        res.status(200).json({ message: 'Data for the last 30 days fetched and inserted successfully.' });
    } catch (error) {
        console.error('Error fetching or inserting data:', error);
        res.status(500).json({ error: 'Failed to fetch or insert data into the database for the last 30 days.' });
    }
});

app.get('/fetch/data', async (req, res) => {
    const { zipcode, fromDate, toDate } = req.query;
    console.log("Received parameters:", zipcode, fromDate, toDate);

    try {
        const db = await getDBConnection();
        const lookupQuery = `SELECT fips_code FROM zipcode_lookup WHERE zip_code = ?`;
        const fipsRecord = await db.get(lookupQuery, [zipcode]);
        if (!fipsRecord) {
            return res.status(404).json({ status: 'error', message: 'Zipcode not found.' });
        }

        const fipsCode = fipsRecord.fips_code;
        console.log("FIPS Code:", fipsCode);

        let query = `
            SELECT plant_id, detect_proportion, percentile, percent_change, risk_score, date_end
            FROM covid_wastewater
            WHERE ',' || county_fips || ',' LIKE ?`;
        let params = [`%,${fipsCode},%`];

        if (fromDate || toDate) {
            query += ` AND date_end BETWEEN ? AND ?`;
            params.push(fromDate || '0001-01-01', toDate || '9999-12-31');
        }

        console.log("Final query:", query);
        const records = await db.all(query, params);

        if (records.length > 0) {
            res.json({
                status: 'success',
                data: records
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