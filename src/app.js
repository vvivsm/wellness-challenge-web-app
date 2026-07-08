const express = require('express');
const app = express();

app.use(express.json());

app.use(express.urlencoded(
    { extended: false }
));

const mainRoutes = require('./routes/mainRoutes');
app.use('/api', mainRoutes);

app.use("/", express.static(`public`))

module.exports = app;
