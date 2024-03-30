# API & Backend Documentation
Last Updated at 5:00 AM PDT on March 30th

## Database
```
CREATE TABLE "covid_wastewater" (
	"covid_id"	TEXT NOT NULL UNIQUE,
	"state"	TEXT NOT NULL,
	"county_name"	TEXT NOT NULL,
	"county_fips"	INTEGER NOT NULL,
	"plant_name"	TEXT NOT NULL,
	"plant_id"	INTEGER NOT NULL,
	"population"	INTEGER NOT NULL,
	"detect_proportion"	NUMERIC NOT NULL,
	"percentile"	NUMERIC NOT NULL,
	"date_start"	TEXT NOT NULL,
	"date_end"	TEXT NOT NULL,
	PRIMARY KEY("covid_id")
);
```



## API
Base url: "https://infocapstone.chiptang.com" + request

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


### 3. Fetch Data by FIPS and Date
- **Request URL:** `/fetch/data`
- **Request Format:** JSON
- **Request Type:** POST
- **Description:**  Fetches the detect_proportion and percentile for a given county FIPS code and start date.
- **Example Request:**
```
JSON
{
  "countyFips": "53033",
  "dateStart": "2022-03-15"
}
```

- **Example Response:**
```
JSON
{
  "status": "success",
  "data": {
    "detect_proportion": 100,
    "percentile": 75
  }
}
```

- **Error Handling:**
  - Returns 404 if no matching records are found.
  - Returns 500 for internal server errors or if there is a failure in querying the database.