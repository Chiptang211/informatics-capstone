document.getElementById('feedback-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const rating = document.getElementById('star-rating').value;
    const feedbackLike = document.getElementById('like-feedback').value;
    const feedbackImprove = document.getElementById('improve-feedback').value;

    const feedbackData = {
        rating: rating,
        feedbackLike: feedbackLike,
        feedbackImprove: feedbackImprove
    };

    fetch('/update/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Feedback submission successful:', data);
        alert('Thank you for your feedback!');
        document.getElementById('feedback-form').reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while submitting feedback. Please try again later.');
    });
});