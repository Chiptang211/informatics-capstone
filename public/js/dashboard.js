document.addEventListener('DOMContentLoaded', function () {
    let currentZipcode = '';

    function hideAllSections() {
        document.querySelectorAll('main .main-content section').forEach(function(section) {
            section.style.display = 'none';
        });
    }

    function showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'flex';
            if (sectionId === 'statistics' && currentZipcode) {
                document.querySelectorAll('#statistics_zipcode').forEach(el => el.textContent = currentZipcode);
            }
            if (sectionId === 'map' && currentZipcode) {
                initMap(currentZipcode);  // Ensure the map is initialized when the map section is shown
            }
        }
    }

    document.querySelectorAll('.sidebar a').forEach(function(link) {
        if (link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                hideAllSections();
                const sectionId = this.getAttribute('href').substring(1);
                showSection(sectionId);
            });
        }
    });

    function fetchAndDisplayData(zipcode) {
        const apiUrl = `https://geohealth.chiptang.com/fetch/data/covid?zipcode=${zipcode}`;
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.json();
            })
            .then(data => {
                if (data && data.status === 'success' && data.data.length > 0) {
                    currentZipcode = zipcode;
                    document.querySelectorAll('#statistics_zipcode').forEach(el => el.textContent = zipcode);

                    let latestData = data.data[0];
                    let riskScore = latestData.risk_score;

                    // Log the risk score of the latest data
                    console.log(`Latest risk score for ${zipcode}:`, riskScore);

                    // If the latest data's risk score is null or undefined, find the latest available data
                    if (riskScore === null || riskScore === undefined) {
                        console.warn('Risk score is null or undefined for the latest data. Searching for latest available data.');
                        for (let i = data.data.length - 1; i >= 0; i--) {
                            if (data.data[i].risk_score !== null && data.data[i].risk_score !== undefined) {
                                latestData = data.data[i];
                                riskScore = latestData.risk_score;
                                console.log(`Found valid risk score for ${zipcode}:`, riskScore, 'on date:', latestData.date_end);
                                break;
                            }
                        }
                    }

                    if (riskScore !== null && riskScore !== undefined) {
                        updateRiskScoreDisplay(riskScore);
                        updateRiskImage(riskScore);
                        updateDashboardRiskImage(riskScore);
                    } else {
                        console.warn('No valid risk score available for any date.');
                        updateRiskScoreDisplay('N/A');
                        updateRiskImage('default'); // Assuming 'default' is a valid argument for a default image
                        updateDashboardRiskImage('default'); // Assuming 'default' is a valid argument for a default image
                    }

                    renderChart(data.data);
                } else {
                    console.error('No data returned for this zipcode:', zipcode);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    function updateRiskImage(riskScore) {
        const riskImageElement = document.getElementById('riskImage');
        let imageName = (riskScore !== 'N/A') ? riskScore.toLowerCase() + 'Risk' : 'defaultRisk';
        riskImageElement.src = `img/${imageName}.png`;
        riskImageElement.alt = `Risk Level: ${riskScore}`;
        riskImageElement.style.width = '600px'; 
        riskImageElement.style.height = 'auto';
        riskImageElement.addEventListener('click', function(event) {
            event.preventDefault();
            hideAllSections();
            showSection('statistics');
        });
    }

    function updateDashboardRiskImage(riskScore) {
        const dashboardRiskImage = document.querySelector('#viral_detection_graphs img');
        let imageName = (riskScore !== 'N/A') ? riskScore.toLowerCase() + 'Risk' : 'defaultRisk';
        dashboardRiskImage.src = `img/${imageName}.png`;
        dashboardRiskImage.alt = `COVID Risk Level: ${riskScore}`;
    }

    function updateRiskScoreDisplay(riskScore) {
        const riskScoreElement = document.getElementById('statistics_disease_score');

        if (riskScore !== null && riskScore !== undefined) {
            riskScoreElement.textContent = riskScore.charAt(0).toUpperCase() + riskScore.slice(1);
            riskScoreElement.classList.remove('risk-low', 'risk-medium', 'risk-high');
            riskScoreElement.classList.add('risk-' + riskScore.toLowerCase());
        } else {
            riskScoreElement.textContent = 'N/A';
            riskScoreElement.classList.remove('risk-low', 'risk-medium', 'risk-high');
        }
    }

    function renderChart(data) {
        const ctx = document.getElementById('particulateChart').getContext('2d');
        const groupedData = {};

        // Group data by full date (month/day/year)
        data.forEach(item => {
            const date = new Date(item.date_end).toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            groupedData[date] = groupedData[date] || [];
            groupedData[date].push(item.covid_level);
        });

        // Sort dates in ascending order by full date
        const dates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

        // Calculate average COVID levels for each date
        const covidLevels = dates.map(date => {
            const levels = groupedData[date];
            return levels.reduce((acc, level) => acc + level, 0) / levels.length;
        });

        // Render the chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'COVID Level Over Time',
                    data: covidLevels,
                    borderColor: '#675AFF',
                    backgroundColor: '#675AFF',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 5
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function initMap(zipcode) {
        if (window.myMap) {
            window.myMap.remove();
        }

        window.myMap = L.map('mapContainer').setView([47.660709, -117.404107], 8);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(window.myMap);

        const url = `https://geohealth.chiptang.com/fetch/data/facility?zipcode=${zipcode}&limit=50`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    alert("No facilities found near this zipcode.");
                    return;
                }

                data.forEach(facility => {
                    const marker = L.marker([facility.latitude, facility.longitude]).addTo(window.myMap);
                    marker.bindPopup(`<strong>${facility.facility_name}</strong><br>${facility.address}, ${facility.city}, ${facility.state}, ${facility.zipcode}`);
                });

                var group = new L.featureGroup(data.map(facility => L.marker([facility.latitude, facility.longitude])));
                window.myMap.fitBounds(group.getBounds().pad(0.5));
            })
            .catch(error => {
                console.error("Error loading facilities:", error);
                alert("Error fetching facility data.");
            });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const zipcode = urlParams.get('zipcode');
    if (zipcode) {
        fetchAndDisplayData(zipcode);
        initMap(zipcode);
    }

    hideAllSections();
    showSection('dashboard');
});