# API & Backend Documentation
Last Updated at 7:00 PM PST on May 1st

## Backend Structure
- **Data Storage** - SQLite
- **Web & API Hosting** - Express Webapp written in Javascript
- **Data Flow** - Backend fetches data from CDC API based on date paremeters and instantly calculate risk score -> Data is recorded to data.db using SQLite command -> Data is retrieved using SQliet command and served to the front end using API

## Database
### covid_id
- **Data Tyoe:** TEXT NOT NULL UNIQUE
- **Data Example:** "2024-03-12_760"
- **Data Description:** A combination of date and wastewater treatment plants id.

### state
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** "Washington"
- **Data Description:** State

### county
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** "Spokane or "King,Snohomish"
- **Data Description:** The county and county-equivalent names corresponding to the FIPS codes in 'county_fips'.

### fips_id
- **Data Tyoe:** INTEGER NOT NULL
- **Data Example:** 53063 or 53061,53033
- **Data Description:** 5-digit numeric FIPS codes of all counties and county equivalents served by this sampling site.

### facility_name
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** "NWSS_wa_760_Treatment plant_raw wastewater"
- **Data Description:** A unique identifier for the geographic area served by this sampling site, called a sewershed. This is an underscore-separated concatenation of the fields 'wwtp_jurisdiction', 'wwtp_id', and, if 'sample_location' is "upstream", then also 'sample_location_specify', and sample_matrix.

### facility_cdc_id
- **Data Tyoe:** INTEGER NOT NULL
- **Data Example:** 760
- **Data Description:** A unique identifier for wastewater treatment plants. This is an arbitrary integer used to provide a unique, but anonymous identifier for a wastewater treatment plant. This identifier is consistent over time, such that the same plant retains the same ID regardless of the addition or subtraction of other plants from the data set.

### population_served
- **Data Tyoe:** INTEGER NOT NULL
- **Data Example:** 120000
- **Data Description:** Estimated number of persons served by this sampling site (i.e., served by this wastewater treatment plant or, if 'sample_location' is "upstream", then by this upstream location).

### percent_change (ptc_15d)
- **Data Tyoe:** NUMERIC
- **Data Example:** 2737
- **Data Description:** The percent change in SARS-CoV-2 RNA levels over the 15-day interval defined by 'date_start' and 'date_end'. Percent change is calculated as the modeled change over the interval, based on linear regression of log-transformed SARS-CoV-2 levels. SARS-CoV-2 RNA levels are wastewater concentrations that have been normalized for wastewater composition.

### covid_level (percentile)
- **Data Tyoe:** NUMERIC
- **Data Example:** 6.6
- **Data Description:** This metric shows whether SARS-CoV-2 virus levels at a site are currently higher or lower than past historical levels at the same site. 0% means levels are the lowest they have been at the site; 100% means levels are the highest they have been at the site. Public health officials watch for increasing levels of the virus in wastewater over time and use this data to help make public health decisions.

### percent_detect (detect_prop_15d)
- **Data Tyoe:** NUMERIC
- **Data Example:** 100
- **Data Description:** The proportion of tests with SARS-CoV-2 detected, meaning a cycle threshold (Ct) value <40 for RT-qPCR or at least 3 positive droplets/partitions for RT-ddPCR, by sewershed over the 15-day window defined by 'date_start' and "date_end'. The detection proportion is the percent calculated by dividing the 15-day rolling sum of SARS-CoV-2 detections by the 15-day rolling sum of the number of tests for each sewershed and multiplying by 100.

### concentration (pcr_conc_smoothed)
- **Data Tyoe:** NUMERIC
- **Data Example:** 1116238.6628
- **Data Description:** The normalization method of the SARS-CoV-2 virus concentration in wastewater. There are two normalization: flow-population or human fecal. The flow-population normalization method is calculated by multiplying the SARS-CoV-2 concentration and flow rate then dividing by population served. The flow-population normalization approach indicates whether the total number of individuals at the site who are shedding has changed. The human fecal normalization is SARS-CoV-2 virus concentration divided by the human fecal marker concentration. The human fecal normalization approach indicates whether the proportion of individuals at the site who are shedding has changed.

### date_start
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** 2024-03-12
- **Data Description:** The start date of the interval over which the metric is calculated. Intervals are inclusive of start and end dates.

### date_end
- **Data Tyoe:** TEXT NOT NULL
- **Data Example:** 2024-03-26
- **Data Description:** The end date of the interval over which metric is calculated. Intervals are inclusive of start and end dates.

See ```https://data.cdc.gov/Public-Health-Surveillance/NWSS-Public-SARS-CoV-2-Wastewater-Metric-Data/2ew6-ywp6/about_data``` and ```https://data.cdc.gov/Public-Health-Surveillance/NWSS-Public-SARS-CoV-2-Concentration-in-Wastewater/g653-rqe2/about_data```for more information.


## APIs
Base url: "https://geohealth.chiptang.com" + request

### 1. Update Covid Data
**DO NOT USE** unless you have Chip's permission, it takes around an hour to pull all the data!
- **Request URL:** `/update/covid`
- **Request Format:** Text
- **Request Type:** POST
- **Description:** This endpoint updates the COVID-19 wastewater data in the database based on either a specific date or a number of days back from the current date. It is designed to fetch and insert new data for either the specified dateLimit or for the last number of days specified by dayLimit.
- **Query Parameters:**
  - **dateLimit (optional):** A specific date from which to start updating the data. The date should be in the format YYYY-MM-DD. If provided, the update will start from this date to the current date.
  - **dayLimit (optional):** Specifies the number of days back from today to start updating the data. This parameter is an integer.
- **Example Request:**
```
TEXT
POST /update/covid?dateLimit=2024-01-01
POST /update/covid?dayLimit=100
POST /update/covid?dateLimit=2024-01-01&dayLimit=100
```

- **Example Response:**
```
JSON
{
  "message": "Data fetched and inserted successfully for dates from 2024-01-01 to 2024-04-01."
}
```

- **Error Handling:**
  - Returns 400 if neither dateLimit nor dayLimit is provided in the request. This error is to ensure that the request includes necessary parameters to execute the update operation.
  - Returns 500 if there is a failure in fetching or processing the data, or in interacting with the database.


### 2. Fetch Covid Data by Zipcode
- **Request URL:** `/fetch/data/covid`
- **Request Format:** Text
- **Request Type:** GET
- **Description:**  Fetches various metrics from the covid_wastewater table based on zipcode. Date ranges are optional. Note that there might be multiple wastewater plants associated with a given zipcode, so it will return all relevant data.
- **Query Parameters:**
  - **zipcode:** The postal zipcode.
  - **fromDate (optional):** The start date for filtering records.
  - **toDate (optional):** The end date for filtering records.
- **Example Request:**
```
TEXT
POST/fetch/data/covid?zipcode=99258
POST/fetch/data/covid?zipcode=99258&fromDate=2024-04-01&toDate=2024-04-02
```

- **Example Response:**
```
JSON
{
  "status": "success",
  "data": [
    {
      "facility_cdc_id": 760,
      "covid_level": 10,
      "percent_change": -54,
      "percent_detect": 100,
      "risk_score": "low",
      "concentration": 218043153.3101,
      "date_end": "2024-04-01"
    },
    {
      "facility_cdc_id": 759,
      "covid_level": 5.667,
      "percent_change": -40,
      "percent_detect": 100,
      "risk_score": "low",
      "concentration": 211752952.9665,
      "date_end": "2024-04-01"
    },
    {
      "facility_cdc_id": 760,
      "covid_level": 10,
      "percent_change": -74,
      "percent_detect": 100,
      "risk_score": "low",
      "concentration": 208954530.3303,
      "date_end": "2024-04-02"
    },
    {
      "facility_cdc_id": 759,
      "covid_level": 5.667,
      "percent_change": -74,
      "percent_detect": 100,
      "risk_score": "low",
      "concentration": null,
      "date_end": "2024-04-02"
    }
  ]
}
```

- **Error Handling:**
  - Returns 404 when no records are found that match the provided zipcode or date range..
  - Returns 500 for internal server errors or if there is a failure in querying the database.


### 3. Fetch Facility Data by Zipcode
- **Request URL:** `/fetch/data/facility`
- **Request Format:** Text
- **Request Type:** GET
- **Description:**  Fetches nearest facility information based on the provided zipcode. The limit is optional, and by default, it is set to 10 results.
- **Query Parameters:**
  - **zipcode:** The postal zipcode for which the user seeks facility information.
  - **limit (optional):** The maximum number of facility results to return. Default is 10.
- **Example Request:**
```
TEXT
POST/fetch/data/famility?zipcode=99258
POST/fetch/data/famility?zipcode=99258&limit=4
```

- **Example Response:**
```
JSON
[
  {
    "npdes_id": "WA0024473",
    "facility_name": "CITY OF SPOKANE - RIVERSIDE PARK AWWTP",
    "address": "4401 N AUBREY L WHITE PKWY",
    "city": "SPOKANE",
    "state": "WA",
    "zipcode": 99205,
    "latitude": 47.693416,
    "longitude": -117.472387,
    "distance": 5.9
  },
  {
    "npdes_id": "ID0022853",
    "facility_name": "COEUR D ALENE ADVANCED WASTEWATER TREATMENT PLANT",
    "address": "765 WEST HUBBARD AVENUE",
    "city": "COEUR D ALENE",
    "state": "ID",
    "zipcode": 83814,
    "latitude": 47.681933,
    "longitude": -116.796192,
    "distance": 45.6
  },
  {
    "npdes_id": "ID0020842",
    "facility_name": "SANDPOINT WWTP",
    "address": "723 SOUTH ELLA STREET",
    "city": "SANDPOINT",
    "state": "ID",
    "zipcode": 83864,
    "latitude": 48.262701,
    "longitude": -116.560469,
    "distance": 91.3
  },
  {
    "npdes_id": "ID0022055",
    "facility_name": "WASTEWATER TREATMENT PLANT",
    "address": "900 7TH AVENUE NORTH",
    "city": "LEWISTON",
    "state": "ID",
    "zipcode": 83501,
    "latitude": 46.427106,
    "longitude": -117.022102,
    "distance": 140.9
  }
]
```

- **Error Handling:**
  - Returns 400 if the zipcode parameter is missing in the request.
  - Returns 404 if no facilities are found near the specified zipcode or if the zipcode cannot be geolocated.
  - Returns 500 if there is an error in fetching data from the geolocation API or querying the database.

### 4. Update Feedback Data
- **Request URL:** `/update/feedback`
- **Request Format:** JSON
- **Request Type:** POST
- **Description:**  Allow user to submit feedback.
- **Example Request:**
```
JSON
{
  "email": "name@example.com",
  "rating": 4,
  "feedbackLike": "I liked the user interface!",
  "feedbackImprove": "I thought there could be more interactive graphs within the stats page!"
}
```

- **Example Response:**
```
JSON
{
  "message": "Data fetched and inserted successfully for feedback up to current date."
}
```

- **Error Handling:**
  - Returns 400 if necessary parameters are not included.
  - Returns 500 if there is a failure in getting or updating the feedback data records.
