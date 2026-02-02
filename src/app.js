// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

// Import express module and create app object
const express = require('express');
const app = express();

// Enable middleware to parse JSON requests and populate req.body
app.use(express.json());

// Enable middleware to parse URL-encoded requests and populate req.body
app.use(express.urlencoded(
    // Enables advanced parsing (to nested arrays/objects)
    { extended: false }
));

// Import main router and mount to base path
const mainRoutes = require('./routes/mainRoutes');
app.use('/api', mainRoutes);

app.use("/", express.static(`public`))
// Export app
module.exports = app;
