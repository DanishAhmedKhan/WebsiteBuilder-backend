const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const config = require('config');
const helmet = require('helmet');
const cors = require('cors');
const ip = require('ip');
const morgan = require('morgan');


// Check if all authentication tokens are set
const userAuthToken = config.get('userAuthToken');
if (userAuthToken == null) {
    console.log('FATAL ERROR: One or more auth token not set');
    process.exit(1);
}

const app = express();

const env = app.get('env');
const ipAddress = ip.address();
console.log(`Trying to start Fail server at ${ipAddress} (in ${env} mode)...`);


// Current directory
const rootDir = path.dirname(process.mainModule.filename);

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

if (env == 'development') {
    app.use(morgan('tiny'));
}

if (env == 'production') {
    app.use(morgan('tiny'));
    app.use(helmet());
}


const userRoutes = require('./api/user');
const adminRoutes = require('./api/admin');

// Image static routing
app.use(express.static(path.join(__dirname, 'repo')));

app.use('/user', userRoutes);
app.use('/admin', adminRoutes);

// 404 page not found
app.use((req, res) => {
    res.status(404).send('Page not found');
});


// connecting to the mongoDB Atlas cloud storage
const dbUrl = config.get('db');
console.log(`Trying to connect to mongodb ${dbUrl}`);

const mongoDbConfig = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
};

mongoose.connect(dbUrl,  mongoDbConfig)
    .then(() => console.log('Connected to mongodb.'))
    .catch(err => console.log('Could not connect to mongodb.', err));

// starting the server
const port = process.env.PORT || config.get('server.port');
app.listen(port, () => {
    console.log(`Listining to port ${port}`);
});