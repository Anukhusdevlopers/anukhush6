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
let currentLocation = { lat: 28.6041667, lng: 77.3428319 }; // Default location (New Delhi)

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Emit the current location to the connected client
    socket.emit('locationUpdated', currentLocation);

    // Listen for location updates from clients
    socket.on('updateLocation', (location) => {
        currentLocation = location;
        console.log('Updated location received from client:', location);

        // Broadcast updated location to all connected clients
        io.emit('locationUpdated', currentLocation);
    });

    // Custom Events: You can add more custom events as required
    socket.on('instantPickupRequest', (data) => {
        console.log('Instant Pickup Request Received:', data);

        // Emit delivery assigned or no delivery boy event
        if (Math.random() > 0.5) {
            io.emit('deliveryAssigned', { message: 'Delivery Boy Assigned', data });
        } else {
            io.emit('noDeliveryBoy', { message: 'No Delivery Boy Found' });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Exports (Optional, for unit testing or additional modularization)
module.exports = { app, server, io };