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
                    const latestData = data.data[0];
                    const riskScore = latestData.risk_score;
                    updateRiskScoreDisplay(riskScore);
                    updateRiskImage(riskScore);
                    updateDashboardRiskImage(riskScore);
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
        let imageName = riskScore.toLowerCase() + 'Risk';
        riskImageElement.src = `img/${imageName}.png`;
        riskImageElement.alt = `Risk Level: ${riskScore}`;
    }

    function updateDashboardRiskImage(riskScore) {
        const dashboardRiskImage = document.querySelector('#viral_detection_graphs img');
        let imageName = riskScore.toLowerCase() + 'Risk';
        dashboardRiskImage.src = `img/${imageName}.png`;
        dashboardRiskImage.alt = `COVID Risk Level: ${riskScore}`;
    }

    function updateRiskScoreDisplay(riskScore) {
        const riskScoreElement = document.getElementById('statistics_disease_score');
        riskScoreElement.textContent = riskScore.charAt(0).toUpperCase() + riskScore.slice(1);
        riskScoreElement.classList.remove('risk-low', 'risk-medium', 'risk-high');
        riskScoreElement.classList.add('risk-' + riskScore.toLowerCase());
    }

    function renderChart(data) {
        const ctx = document.getElementById('particulateChart').getContext('2d');
        const groupedData = {};
        data.forEach(item => {
            const date = new Date(item.date_end).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            groupedData[date] = groupedData[date] || [];
            groupedData[date].push(item.covid_level);
        });

        const dates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));
        const covidLevels = dates.map(date => {
            const levels = groupedData[date];
            return levels.reduce((acc, level) => acc + level, 0) / levels.length;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'COVID Level Over Time',
                    data: covidLevels,
                    borderColor: '#675AFF',  // Purple color
                    backgroundColor: '#675AFF',  // Purple color
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
        const mapOptions = {
            center: { lat: 47.660709, lng: -117.404107 },
            zoom: 8,
        };
        const map = new google.maps.Map(document.getElementById("map"), mapOptions);

        const url = `https://geohealth.chiptang.com/fetch/data/facility?zipcode=${zipcode}&limit=10`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                data.forEach(facility => {
                    const marker = new google.maps.Marker({
                        position: { lat: facility.latitude, lng: facility.longitude },
                        map: map,
                        title: facility.facility_name
                    });
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<h3>${facility.facility_name}</h3><p>${facility.address}, ${facility.city}, ${facility.state}, ${facility.zipcode}</p>`
                    });
                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });
                });
            })
            .catch(error => console.error("Error loading facilities:", error));
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const zipcode = urlParams.get('zipcode');
    if (zipcode) {
        fetchAndDisplayData(zipcode);
    }

    hideAllSections();
    showSection('dashboard');
});








