# API & Backend Documentation
Last Updated at 6:00 AM PDT on March 30th

## Database
### covid_id
- **Data Tyoe:** TEXT NOT NULL UNIQUE
- **Data Example:** "2024-03-12_760"
- **Data Description:** A combination of date and wastewater treatment plants id.

### state
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** "Washington"
- **Data Description:** State

### county_name
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** "Spokane or "King,Snohomish"
- **Data Description:** The county and county-equivalent names corresponding to the FIPS codes in 'county_fips'.

### county_fips
- **Data Tyoe:** INTEGER NOT NULL
- **Data Example:** 53063 or 53061,53033
- **Data Description:** 5-digit numeric FIPS codes of all counties and county equivalents served by this sampling site.

### plant_name
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** "NWSS_wa_760_Treatment plant_raw wastewater"
- **Data Description:** A unique identifier for the geographic area served by this sampling site, called a sewershed. This is an underscore-separated concatenation of the fields 'wwtp_jurisdiction', 'wwtp_id', and, if 'sample_location' is "upstream", then also 'sample_location_specify', and sample_matrix.

### plant_id
- **Data Tyoe:** INTEGER NOT NULL
- **Data Example:** 760
- **Data Description:** A unique identifier for wastewater treatment plants. This is an arbitrary integer used to provide a unique, but anonymous identifier for a wastewater treatment plant. This identifier is consistent over time, such that the same plant retains the same ID regardless of the addition or subtraction of other plants from the data set.

### population
- **Data Tyoe:** INTEGER NOT NULL
- **Data Example:** 120000
- **Data Description:** Estimated number of persons served by this sampling site (i.e., served by this wastewater treatment plant or, if 'sample_location' is "upstream", then by this upstream location).

### percent_change
- **Data Tyoe:** NUMERIC
- **Data Example:** 2737
- **Data Description:** The percent change in SARS-CoV-2 RNA levels over the 15-day interval defined by 'date_start' and 'date_end'. Percent change is calculated as the modeled change over the interval, based on linear regression of log-transformed SARS-CoV-2 levels. SARS-CoV-2 RNA levels are wastewater concentrations that have been normalized for wastewater composition.

### detect_proportion
- **Data Tyoe:** NUMERIC
- **Data Example:** 100
- **Data Description:** The proportion of tests with SARS-CoV-2 detected, meaning a cycle threshold (Ct) value <40 for RT-qPCR or at least 3 positive droplets/partitions for RT-ddPCR, by sewershed over the 15-day window defined by 'date_start' and "date_end'. The detection proportion is the percent calculated by dividing the 15-day rolling sum of SARS-CoV-2 detections by the 15-day rolling sum of the number of tests for each sewershed and multiplying by 100.

### percentile
- **Data Tyoe:** NUMERIC
- **Data Example:** 6.6
- **Data Description:** This metric shows whether SARS-CoV-2 virus levels at a site are currently higher or lower than past historical levels at the same site. 0% means levels are the lowest they have been at the site; 100% means levels are the highest they have been at the site. Public health officials watch for increasing levels of the virus in wastewater over time and use this data to help make public health decisions.

### date_start
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** 2024-03-12
- **Data Description:** The start date of the interval over which the metric is calculated. Intervals are inclusive of start and end dates.

### date_end
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** 2024-03-26
- **Data Description:** The end date of the interval over which metric is calculated. Intervals are inclusive of start and end dates.

See ```https://data.cdc.gov/Public-Health-Surveillance/NWSS-Public-SARS-CoV-2-Wastewater-Metric-Data/2ew6-ywp6/about_data``` for more information.


## API
Base url: "https://geohealth.chiptang.com" + request

### 1. Update All
**DO NOT USE** unless you have Chip's permission, it takes around 5 minutes to pull all the data!
- **Request URL:** `/update/all`
- **Request Format:** None required
- **Request Type:** POST
- **Description:** Fetches wastewater data since January 1, 2022, to today's date and updates the database with new records.
- **Example Request:**
None required

- **Example Response:**
```
JSON
{
  "message": "Data fetched and inserted successfully"
}
```

- **Error Handling:**
  - Returns 500 for internal server errors or if there is a failure in fetching or inserting data into the database.


### 2. Update Last 30 Days
- **Request URL:** `/update/30`
- **Request Format:** None required
- **Request Type:** POST
- **Description:** Fetches wastewater data for the last 30 days from today and updates the database with these records.
- **Example Request:**
None required

- **Example Response:**
```
JSON
{
  "message": "Data for the last 30 days fetched and inserted successfully."
}
```

- **Error Handling:**
  - Returns 500 for internal server errors or if there is a failure in fetching or inserting data into the database.


### 3. Fetch Data by Zipcode
- **Request URL:** `/fetch/data`
- **Request Format:** Text
- **Request Type:** GET
- **Description:**  Fetches various metrics from the covid_wastewater table based on zipcode. Date ranges are optional. Note that there might be multiple wastewater plants associated with a given zipcode, so it will return all relevant data.
- **Query Parameters:**
  - **zipcode:** The postal zip code used to look up the corresponding county FIPS code.
  - **fromDate (optional):** The start date for filtering records.
  - **toDate (optional):** The end date for filtering records.
- **Example Request:**
```
TEXT
/fetch/data?zipcode=98077&fromDate=2024-04-10&toDate=2024-04-11
```

- **Example Response:**
```
JSON
{
  "status": "success",
  "data": [
    {
      "plant_id": 760,
      "detect_proportion": 100,
      "percentile": 3,
      "percent_change": -56,
      "risk_score": 1,
      "date_end": "2024-04-10"
    },
    {
      "plant_id": 759,
      "detect_proportion": 100,
      "percentile": 5.667,
      "percent_change": -78,
      "risk_score": 1,
      "date_end": "2024-04-10"
    },
    {
      "plant_id": 760,
      "detect_proportion": 100,
      "percentile": 3,
      "percent_change": -56,
      "risk_score": 1,
      "date_end": "2024-04-11"
    },
    {
      "plant_id": 759,
      "detect_proportion": 100,
      "percentile": 5.667,
      "percent_change": -99,
      "risk_score": 1,
      "date_end": "2024-04-11"
    }
  ]
}
```

- **Error Handling:**
  - Returns 404 when no records are found that match the provided zipcode or date range..
  - Returns 500 for internal server errors or if there is a failure in querying the database.


