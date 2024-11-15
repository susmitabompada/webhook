const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Store the payloads with timestamps
let storedPayloads = [];

// Function to clean up old payloads (older than 7 days)
function cleanupPayloads() {
  const now = moment();
  storedPayloads = storedPayloads.filter(payload => {
    const age = now.diff(moment(payload.timestamp), 'days');
    return age <= 7; // Keep payloads only for the last 7 days
  });
}

// Webhook endpoint to receive JSON payloads
app.post('/webhook', (req, res) => {
  const payload = req.body;
  const timestamp = moment().toISOString(); // Current timestamp
  storedPayloads.push({ payload, timestamp });

  console.log('Received JSON:', payload); // Log to console

  // Clean up old payloads
  cleanupPayloads();

  res.status(200).send('Payload received and stored.');
});

// Endpoint to return the stored JSON payloads as JSON
app.get('/data', (req, res) => {
  res.json(storedPayloads);
});

// Serve HTML, JS, and styles combined in one endpoint
app.get('/', (req, res) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Webhook Data Viewer</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        .json-container {
          width: 100%;
          max-height: 500px;
          overflow-y: scroll;
          border-left: 5px solid #000;
          padding-left: 10px;
        }
        .json-item {
          margin-bottom: 20px;
          border-bottom: 1px dashed #ccc;
          padding-bottom: 10px;
        }
        pre {
          background-color: #f4f4f4;
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <h1>Stored JSON Payloads</h1>
      <div class="json-container" id="json-container">
        <!-- JSON content will be loaded here -->
        <p>No data received yet.</p>
      </div>

      <script>
        // Function to fetch and display the latest JSON payloads
        function fetchPayloads() {
          fetch('/data')
            .then(response => response.json())
            .then(data => {
              const container = document.getElementById('json-container');
              container.innerHTML = ''; // Clear the container before adding new content

              if (data.length === 0) {
                container.innerHTML = '<p>No data received yet.</p>';
              } else {
                data.forEach(item => {
                  const jsonItem = document.createElement('div');
                  jsonItem.classList.add('json-item');

                  // Correct way to insert timestamp and JSON
                  const timestampHTML = '<strong>Received at: ' + item.timestamp + '</strong>';
                  const jsonHTML = '<pre>' + JSON.stringify(item.payload, null, 2) + '</pre>';

                  jsonItem.innerHTML = timestampHTML + jsonHTML;
                  container.appendChild(jsonItem);
                });
              }
            })
            .catch(error => {
              console.error('Error fetching data:', error);
            });
        }

        // Fetch data every 5 seconds to keep it updated
        setInterval(fetchPayloads, 5000);

        // Initial fetch when the page loads
        fetchPayloads();
      </script>
    </body>
    </html>
  `;
  res.send(htmlContent);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
