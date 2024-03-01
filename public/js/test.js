document.addEventListener('DOMContentLoaded', function() {
    // Event listener for the 'Send' button
    document.getElementById('send_button').addEventListener('click', () => {
        // Automatically fill in the current date and time
        const now = new Date();

        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const date = now.toLocaleDateString('en-US', dateOptions);

        const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
        const time = now.toLocaleTimeString('en-US', timeOptions);

        // Get the message from the input field
        const message = document.getElementById('message').value;

        // Send the data to the server using fetch
        fetch('https://infocapstone.chiptang.com/test/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, date, time }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert('Message sent successfully! Test ID: ' + data.testId);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Failed to send message');
        });
    });

    // Event listener for the 'Retrieve' button
    document.getElementById('retrieve_button').addEventListener('click', () => {
        const testId = document.getElementById('test_id').value;

        fetch(`https://infocapstone.chiptang.com/test/lookup?testId=${encodeURIComponent(testId)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('record_table').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; // Clear previous records
            data.forEach(record => {
                let row = tableBody.insertRow();
                let cell1 = row.insertCell(0);
                let cell2 = row.insertCell(1);
                let cell3 = row.insertCell(2);
                let cell4 = row.insertCell(3);
                cell1.innerHTML = record.test_id;
                cell2.innerHTML = record.test_date;
                cell3.innerHTML = record.test_time;
                cell4.innerHTML = record.test_message;
            });
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Failed to retrieve records');
        });
    });
});
