document.addEventListener('DOMContentLoaded', function () {
    // Handle the search form submission
    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const zipcode = document.getElementById('zipcode-input').value;
        if (!zipcode) {
            console.error('Zipcode input is empty.');
            return;
        }
        // Redirect to dashboard.html with the zipcode as a URL parameter
        window.location.href = `dashboard.html?zipcode=${zipcode}`;
    });

    // Handle the popup
    const popup = document.getElementById('announcement-popup');
    const closeBtn = document.getElementById('close-popup');

    // Show the popup
    popup.style.display = 'flex';

    // Close the popup when the close button is clicked
    closeBtn.addEventListener('click', function () {
        popup.style.display = 'none';
    });
});



