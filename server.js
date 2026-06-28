import './config/env.js';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './sockets/index.js';

const PORT = process.env.PORT;


const startServer = async () => {
  // 2. Connect MongoDB
  await connectDB();

  // 3. Initialize Express App is already done in app.js
  
  // Create HTTP server
  const server = http.createServer(app);

  // 4. Initialize Socket.io
  initSocket(server);

  // 5. Start Server
  server.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();
