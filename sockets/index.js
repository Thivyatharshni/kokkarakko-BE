import { Server } from 'socket.io';

let io;

const allowedOrigins = [];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}
allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.some(allowed => {
          return origin === allowed || allowed.replace(/\/$/, '') === origin.replace(/\/$/, '');
        });
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Join a specific shop room (e.g., when a customer opens a shop menu)
    socket.on('join-shop', (shopId) => {
      socket.join(shopId);
      console.log(`User joined shop room: ${shopId}`);
    });

    // Handle new order placement
    socket.on('new-order', (orderData) => {
      // Broadcast to the specific shop's admin dashboard
      io.to(orderData.shopId).emit('order-received', orderData);
    });

    // Handle order status updates from admin
    socket.on('update-order-status', (data) => {
      // Broadcast to the specific customer (could be via shop room or a unique order room)
      io.emit('order-status-changed', data);
    });

    // Handle menu updates by admin
    socket.on('menu-updated', (shopId) => {
      // Notify all customers currently viewing this shop's menu
      io.to(shopId).emit('refresh-menu');
    });

    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Function to get the io instance elsewhere in the app (e.g., in controllers)
export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
