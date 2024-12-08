const express = require("express");
const mongoose = require('mongoose');
// Load environment variables from .env file
require('dotenv').config();

require("./db/index");
const path = require("path");
const cors = require("cors");

const app = express();
const http = require('http'); // Required for setting up Socket.IO
const server = http.createServer(app); // Create an HTTP server with Express
const io = require('socket.io')(server, {
  cors: {
    origin: "*", // Allow all origins; adjust this in production for security
    methods: ["GET", "POST"]
  }
});

// Use PORT from environment variables or default to 3000
const runPORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS
app.use('/public', express.static(path.join(__dirname, '../public'))); // Serve static files

// Log the port the app is listening on
server.listen(runPORT, () => {
  console.log(`Server running successfully on port ${runPORT}...`);
});

// Start your routes
//const useranurouter = require('./modules/router/AnuuserRouter'); // Example route
//app.use(useranurouter); // Example route

 const scraplist=require('./modules/router/srapitemsrouter');
 app.use(scraplist);

 
 const whatsapp=require('./modules/router/whatsrouter');
 app.use(whatsapp);
 const contact=require('./modules/router/ContactRouter');
 app.use(contact);
 const admin=require('./modules/router/AdminRouter');
 app.use(admin);
 const wholeseler=require('./modules/router/WholeselerRouter');
 app.use(wholeseler);
  
 const scraplistnew=require('./modules/router/ScrapListNewRouter');
 app.use(scraplistnew);
// Socket.IO integration
// Socket.IO Integration
// WebSocket Listener
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Listen for location updates from users
  socket.on('updateLocation', async (data) => {
      const { userId, latitude, longitude } = data;

      try {
          // Update user location in the database
          await User.updateOne(
              { _id: userId },
              { $set: { latitude, longitude } }
          );

          console.log(`Updated location for user ${userId}: ${latitude}, ${longitude}`);

          // Fetch the nearest delivery boy within 5 km
          const nearestDeliveryBoy = await DeliveryBoy.findOne({
              isActive: true,
              status: 'current',
              location: {
                  $near: {
                      $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                      $maxDistance: 5000 // 5 km radius
                  }
              }
          });

          if (nearestDeliveryBoy) {
              // Assign the delivery boy to the user
              nearestDeliveryBoy.isActive = false; // Mark delivery boy as assigned
              nearestDeliveryBoy.assignedBy = userId;
              await nearestDeliveryBoy.save();

              console.log(`Assigned delivery boy ${nearestDeliveryBoy.name} to user ${userId}`);

              // Emit confirmation back to the client
              socket.emit('deliveryAssigned', {
                  deliveryBoy: {
                      name: nearestDeliveryBoy.name,
                      number: nearestDeliveryBoy.number
                  }
              });
          } else {
              console.log('No available delivery boy within 5 km.');
              socket.emit('deliveryAssigned', { message: 'No delivery boy available' });
          }
      } catch (error) {
          console.error('Error in location update:', error);
      }
  });

  socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
  });
});
// Exports (Optional, for unit testing or additional modularization)
module.exports = { app, server, io };