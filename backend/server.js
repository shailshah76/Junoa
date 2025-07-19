require('dotenv').config();

const app = require('./app');
const { connectDB, createIndexes } = require('./config/database');

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize server
const startServer = () => {
  // Connect to database
  connectDB()
    .then(() => {
      // Create database indexes
      return createIndexes();
    })
    .then(() => {
      // Start server
      const PORT = process.env.PORT || 5000;
      const server = app.listen(PORT, () => {
        console.log(`
🚀 Junoa Backend Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health Check: http://localhost:${PORT}/health
📚 API Docs: http://localhost:${PORT}/docs
⚡ Ready to accept connections!
        `);
      });

      // Handle server errors
      server.on('error', (error) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

        switch (error.code) {
          case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
          case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
          default:
            throw error;
        }
      });

      // Export server for graceful shutdown
      global.server = server;
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
};

// Start the server
startServer();

module.exports = app;