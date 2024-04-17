document.addEventListener('DOMContentLoaded', function () {
    let currentZipcode = '';  // Variable to store the current zipcode

    function hideAllSections() {
        document.querySelectorAll('main .main-content section').forEach(function(section) {
            section.style.display = 'none';
        });
    }

    function showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'flex';  // Ensure that this matches your CSS for displaying sections
            // Update the zipcode in the statistics section when it is shown
            if (sectionId === 'statistics' && currentZipcode) {
                const statisticsZipcodeElements = document.querySelectorAll('#statistics_zipcode');
                statisticsZipcodeElements.forEach(el => el.textContent = currentZipcode);
            }
        }
    }

    function showDashboard() {
        hideAllSections();
        showSection('dashboard');
    }

    document.querySelectorAll('.sidebar a').forEach(function(link) {
        // Only add internal navigation handling to hash links
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
            .then(response => response.json())
            .then(data => {
                if (data && data.status === 'success' && data.data.length > 0) {
                    currentZipcode = zipcode;  // Store the zipcode globally
    
                    // Update any visible zipcode fields immediately after fetching
                    const statisticsZipcodeElements = document.querySelectorAll('#statistics_zipcode');
                    statisticsZipcodeElements.forEach(el => el.textContent = zipcode);
    
                    // Find the most recent risk score
                    const latestData = data.data[data.data.length - 1];
                    const riskScore = latestData.risk_score;
    
                    // Display the risk score
                    const statisticsRiskScoreElement = document.getElementById('statistics_disease_score');
                    statisticsRiskScoreElement.textContent = riskScore;
    
                    // Update the risk image based on the risk score
                    updateRiskImage(riskScore);
                } else {
                    console.error('No data returned for this zipcode:', zipcode);
                }
            })
            .catch(error => {
                console.error('Fetching error:', error);
            });
    }

    function updateRiskImage(riskScore) {
        let riskImageSrc = '';
        if (riskScore <= 3) {
            riskImageSrc = 'img/lowRisk.png';
        } else if (riskScore > 3 && riskScore <= 6) {
            riskImageSrc = 'img/mediumRisk.png';
        } else if (riskScore > 6) {
            riskImageSrc = 'img/highRisk.png';
        }
        
        const riskImageElement = document.querySelector('#viral_detection_graphs img');
        if (riskImageElement) {
            riskImageElement.src = riskImageSrc;
            riskImageElement.alt = riskScore <= 3 ? 'Low Risk' : riskScore <= 6 ? 'Medium Risk' : 'High Risk';
        }
    }

    // Assuming you have some form or mechanism on index.html to initiate the search
    const urlParams = new URLSearchParams(window.location.search);
    const zipcode = urlParams.get('zipcode');
    if (zipcode) {
        fetchAndDisplayData(zipcode);
    }

    const viralDetectionGraphs = document.getElementById('viral_detection_graphs');
    if (viralDetectionGraphs) {
        viralDetectionGraphs.style.cursor = 'pointer';
        viralDetectionGraphs.addEventListener('click', function() {
            // Redirect to the dashboard URL or simulate a click on the dashboard sidebar link
            window.location.href = 'dashboard.html'; // Change this URL to your actual dashboard page URL if different
        });
    }

    // Show the initial dashboard section
    hideAllSections();
    showSection('dashboard');
});




