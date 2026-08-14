const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const { corsOptions } = require('./config/cors');
const routes = require('./routes');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Security + infra middleware.
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Request logging in development.
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// API routes.
app.use('/api', routes);

// 404 + error handling (must be last).
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;