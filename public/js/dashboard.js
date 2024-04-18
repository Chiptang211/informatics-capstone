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

                    const latestData = data.data[0]; // Assuming the first entry is the most relevant
                    const riskScore = latestData.risk_score; // Use the risk score as is
                    updateRiskScoreDisplay(riskScore);
                    updateRiskImage(riskScore);
                    updateDashboardRiskImage(riskScore);
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
        let imageName;
        switch (riskScore.toLowerCase()) {
            case 'low':
                imageName = 'lowRisk';
                break;
            case 'medium':  // Adjusted to match the actual filename
                imageName = 'mediumRisk';
                break;
            case 'high':
                imageName = 'highRisk';
                break;
            default:
                imageName = 'unknownRisk';  // Handle any unexpected cases
                break;
        }
        riskImageElement.src = `img/${imageName}.png`;
        riskImageElement.alt = `${riskScore.charAt(0).toUpperCase() + riskScore.slice(1)} Risk`;
    }
    
    function updateDashboardRiskImage(riskScore) {
        const dashboardRiskImage = document.querySelector('#viral_detection_graphs img');
        let imageName;
        switch (riskScore.toLowerCase()) {
            case 'low':
                imageName = 'lowRisk';
                break;
            case 'medium':  // Adjusted to match the actual filename
                imageName = 'mediumRisk';
                break;
            case 'high':
                imageName = 'highRisk';
                break;
            default:
                imageName = 'unknownRisk';  // Consider handling unknown cases
                break;
        }
        dashboardRiskImage.src = `img/${imageName}.png`;
        dashboardRiskImage.alt = `COVID Risk Level: ${riskScore.charAt(0).toUpperCase() + riskScore.slice(1)}`;
    }
    

    function updateRiskScoreDisplay(riskScore) {
        const riskScoreElement = document.getElementById('statistics_disease_score');
        riskScoreElement.textContent = riskScore.charAt(0).toUpperCase() + riskScore.slice(1);

        // Remove previous classes
        riskScoreElement.classList.remove('risk-low', 'risk-medium', 'risk-high');

        // Add the appropriate class based on the risk score
        switch (riskScore.toLowerCase()) {
            case 'low':
                riskScoreElement.classList.add('risk-low');
                break;
            case 'medium':
                riskScoreElement.classList.add('risk-medium');
                break;
            case 'high':
                riskScoreElement.classList.add('risk-high');
                break;
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const zipcode = urlParams.get('zipcode');
    if (zipcode) {
        fetchAndDisplayData(zipcode);
    }

    hideAllSections();
    showSection('dashboard');
});








