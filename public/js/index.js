document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('search-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const zipcode = document.getElementById('zipcode-input').value;
        if (!zipcode) {
            console.error('Zipcode input is empty.');
            return;
        }
        // Redirect to dashboard.html with the zipcode as a URL parameter
        window.location.href = `dashboard.html?zipcode=${zipcode}`;
    });
});



