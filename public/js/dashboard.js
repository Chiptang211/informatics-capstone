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
                console.log("Fetched data:", data);  // Log the data to see what's actually coming back.
                if (data && data.status === 'success' && data.data.length > 0) {
                    currentZipcode = zipcode;
                    document.querySelectorAll('#statistics_zipcode').forEach(el => el.textContent = zipcode);

                    const latestData = data.data[0]; // Assuming the first entry is the most relevant
                    const riskScore = latestData.risk_score; // No longer converting to lower case here
                    console.log("Risk Score received:", riskScore); // Log the risk score to debug

                    if (riskScore) {
                        document.getElementById('statistics_disease_score').textContent = riskScore.charAt(0).toUpperCase() + riskScore.slice(1);
                        updateRiskImage(riskScore.toLowerCase());
                        updateDashboardRiskImage(riskScore.toLowerCase());
                    } else {
                        console.error('Risk score is missing or invalid:', riskScore);
                    }
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
        riskImageElement.src = `img/${riskScore}Risk.png`;
        riskImageElement.alt = `${riskScore.charAt(0).toUpperCase() + riskScore.slice(1)} Risk`;
    }

    function updateDashboardRiskImage(riskScore) {
        const dashboardRiskImage = document.querySelector('#viral_detection_graphs img');
        dashboardRiskImage.src = `img/${riskScore}riskgraph.png`;
        dashboardRiskImage.alt = `COVID Risk Level: ${riskScore.charAt(0).toUpperCase() + riskScore.slice(1)}`;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const zipcode = urlParams.get('zipcode');
    if (zipcode) {
        fetchAndDisplayData(zipcode);
    }

    hideAllSections();
    showSection('dashboard');
});







