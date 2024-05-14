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

async function fetchMetricData(date) {
    const fetch = (await import('node-fetch')).default;
    const formattedDate = date.toISOString().split('T')[0];
    const apiUrl = `https://data.cdc.gov/resource/2ew6-ywp6.json?date_end=${formattedDate}&$limit=50000`;
    const response = await fetch(apiUrl);
    const metricData = await response.json();
    return metricData;
}

async function fetchConcentrationData(date) {
    const fetch = (await import('node-fetch')).default;
    const apiUrl = `https://data.cdc.gov/resource/g653-rqe2.json?date=${date.toISOString().split('T')[0]}&$limit=50000`;
    const response = await fetch(apiUrl);
    const concentrationData = await response.json();
    return concentrationData;
}

async function calculateRisk() {
    const db = await getDBConnection();
    try {
        // Fetch all data for calculation, ordered by plant and date
        const rows = await db.all(`SELECT covid_id, facility_cdc_id, percent_change, date_start FROM covid_wastewater ORDER BY facility_cdc_id, date_start`);

        // To hold smoothed values for each plant
        const smoothData = {};
        const riskScores = {};

        rows.forEach(row => {
            if (!smoothData[row.facility_cdc_id]) {
                smoothData[row.facility_cdc_id] = []; // Initialize array for new plants
            }

            // Push current percent_change into the array for the plant
            smoothData[row.facility_cdc_id].push(row.percent_change);

            // Calculate smoothed value using a simple moving average, considering only the last 3 values
            if (smoothData[row.facility_cdc_id].length > 3) {
                smoothData[row.facility_cdc_id].shift(); // Remove the oldest entry if more than 3
            }

            const average = smoothData[row.facility_cdc_id].reduce((a, b) => a + (b || 0), 0) / smoothData[row.facility_cdc_id].length;
            const pcrConcSmoothed = isNaN(average) ? null : average;
/*
            // Determine the risk score based on smoothed PCR concentration
            let riskScore;
            if (pcrConcSmoothed <= 25) {
                riskScore = "low";
            } else if (pcrConcSmoothed <= 75) {
                riskScore = "mid";
            } else {
                riskScore = "high";
            }
*/
            riskscore = "high"
            // Store the latest risk score for each plant
            riskScores[row.facility_cdc_id] = { score: riskScore, date: row.date_start };

            // Update database with smoothed value and risk score
            db.run(`UPDATE covid_wastewater SET pcr_conc_smoothed = ?, risk_score = ? WHERE covid_id = ?`, [pcrConcSmoothed, riskScore, row.covid_id]);
        });

        console.log('Latest risk scores:', riskScores);
    } catch (error) {
        console.error('Error calculating smoothed PCR concentrations or updating risk scores:', error);
    }
}

app.post('/update/covid', async (req, res) => {
    const { dateLimit, dayLimit } = req.query;

    const endDate = new Date();
    let startDate = new Date();

    if (dayLimit) {
        startDate.setDate(endDate.getDate() - parseInt(dayLimit, 10));
    }

    if (dateLimit) {
        const dateLimitDate = new Date(dateLimit);

        if (dayLimit && dateLimitDate > startDate) {
            startDate = dateLimitDate;
        } else if (!dayLimit) {
            startDate = dateLimitDate;
        }
    } else if (!dayLimit) {
        return res.status(400).json({ error: 'Please specify either a date limit or a day limit.' });
    }

    const dates = getDates(startDate, endDate);

    try {
        const db = await getDBConnection();

        for (const date of dates) {
            const metricData = await fetchMetricData(date);
            const metricQuery = `
                INSERT INTO covid_wastewater (
                    covid_id, state, county, fips_id, facility_name, facility_cdc_id, population_served,
                    percent_change, covid_level, percent_detect, date_start, date_end
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (covid_id) DO NOTHING
            `;

            for (const item of metricData) {
                const covid_id = `${item.date_end}_${item.wwtp_id}`;
                const percentChange = item.ptc_15d !== null ? item.ptc_15d : 0;
                const covidLevel = item.percentile !== null ? item.percentile : 0;
                const percentDetect = item.detect_prop_15d !== null ? item.detect_prop_15d : 0;

                await db.run(metricQuery, [
                    covid_id,
                    item.wwtp_jurisdiction,
                    item.county_names,
                    item.county_fips,
                    item.key_plot_id,
                    item.wwtp_id,
                    item.population_served,
                    percentChange,
                    covidLevel,
                    percentDetect,
                    item.date_start,
                    item.date_end
                ]);
            }

            const concentrationData = await fetchConcentrationData(date);
            const concentrationQuery = `
            UPDATE covid_wastewater
            SET concentration = ?
            WHERE facility_name = ? AND date_end = ?
            `;

            for (const item of concentrationData) {
                await db.run(concentrationQuery, [
                    item.pcr_conc_smoothed,
                    item.key_plot_id,
                    item.date
                ]);
            }


            calculateRisk();
        }

        res.status(200).json({ 
            message: `Data fetched and inserted successfully for dates from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}.`
        });
    } catch (error) {
        console.error('Error fetching or inserting data:', error);
        res.status(500).json({ error: 'Failed to fetch or insert data into the database.' });
    }
});

app.post('/delete/covid', async (req, res) => {
    try {
        const db = await getDBConnection();
        await db.run(`DELETE FROM covid_wastewater`);

        console.log('All records have been deleted from covid_wastewater table.');
        res.status(200).json({
            message: "All data has been successfully deleted from the covid_wastewater table."
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            message: 'Failed to delete data from the covid_wastewater table.',
            error: error.message
        });
    }
});

app.get('/fetch/data/covid', async (req, res) => {
    const { zipcode, fromDate, toDate } = req.query;
    console.log("Received parameters:", zipcode, fromDate, toDate);

    try {
        const db = await getDBConnection();
        const lookupQuery = `SELECT fips_id FROM zipcode_lookup WHERE zipcode = ?`;
        const fipsRecord = await db.get(lookupQuery, [zipcode]);
        console.log("Lookup Query executed:", lookupQuery, "with zipcode:", zipcode);

        if (!fipsRecord) {
            console.log("No FIPS ID found for zipcode:", zipcode);
            return res.status(404).json({ status: 'error', message: 'Zipcode not found.' });
        }

        const fipsId = fipsRecord.fips_id;
        console.log("FIPS ID found:", fipsId);

        let query = `
            SELECT facility_cdc_id, covid_level, percent_change, percent_detect, risk_score, concentration, date_end
            FROM covid_wastewater
            WHERE (',' || fips_id || ',' LIKE ?)`;
        let params = [`%,${fipsId},%`];

        if (fromDate && toDate) {
            query += ` AND date_end BETWEEN ? AND ?`;
            params.push(fromDate, toDate);
        } else if (fromDate) {
            query += ` AND date_end >= ?`;
            params.push(fromDate);
        } else if (toDate) {
            query += ` AND date_end <= ?`;
            params.push(toDate);
        }

        console.log("Final query:", query);
        console.log("Query parameters:", params);
        const records = await db.all(query, params);

        if (records.length > 0) {
            res.json({
                status: 'success',
                data: records
            });
        } else {
            console.log("Query executed but no records found.");
            res.status(404).json({ status: 'error', message: 'No matching records found.' });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to query the database.', error: error.message });
    }
});


app.get('/fetch/data/facility', async (req, res) => {
    const { zipcode, limit = 10 } = req.query;
    if (!zipcode) {
        return res.status(400).json({ error: 'Zipcode is required' });
    }

    const apiKey = 'AIzaSyAURpdvZugKcAP8Sf8ZUVmg7gD6oLSA2x4';
    const googleApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${apiKey}`;

    try {
        const { default: fetch } = await import('node-fetch');

        const response = await fetch(googleApiUrl);
        const json = await response.json();

        if (json.status !== 'OK' || json.results.length === 0) {
            return res.status(404).json({ error: 'No location found for the provided zipcode.' });
        }

        const location = json.results[0].geometry.location;
        console.log(location);

        const db = await getDBConnection();
        const query = `
            SELECT *, ROUND(
                6371 * acos(
                cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) +
                sin(radians(?)) * sin(radians(latitude))
                ), 1
            ) AS distance
            FROM plant_lookup
            ORDER BY distance
            LIMIT ?;
        `;
        const facilities = await db.all(query, [location.lat, location.lng, location.lat, limit]);
        res.json(facilities);
    } catch (error) {
        console.error('Failed to retrieve location or database error:', error);
        res.status(500).json({ error: 'Failed to process your request.' });
    }
});

app.post('/update/feedback', async (req, res) => {
    const { email, rating, feedbackLike, feedbackImprove } = req.body;

    if (!email || rating === undefined) {
        return res.status(400).json({ message: "Missing required fields 'email' or 'rating'." });
    }

    try {
        const db = await getDBConnection();
        const feedbackDate = new Date().toISOString().split('T')[0]; // ISO date format YYYY-MM-DD
        const feedbackTime = new Date().getTime(); // Unix timestamp for time

        const insertQuery = `
            INSERT INTO feedback (feedback_date, feedback_time, email, rating, feedback_like, feedback_improve)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.run(insertQuery, [feedbackDate, feedbackTime, email, rating, feedbackLike, feedbackImprove]);

        res.status(200).json({
            message: "Data fetched and inserted successfully for feedback up to current date."
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            message: 'Failed to insert feedback data.',
            error: error.message
        });
    }
});


app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
