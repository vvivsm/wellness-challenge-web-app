// Load environment variables
require('dotenv').config();

// Import app
const app = require('./src/app');

// Set up environment
const PORT = process.env.PORT || 3000;

// Start server (start listening for requests)
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
