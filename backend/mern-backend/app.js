const express = require("express");
const mongoose = require("mongoose"); // Add this line
const bodyParser = require("body-parser");
const session = require('express-session');        
const cors = require("cors"); // Import CORS
const MongoDBStore = require('connect-mongodb-session')(session);

require("dotenv").config();
const MONGODB_URI = process.env.MONGODB_URI; // Changed from MONGODB_URI to MONGO_DB_URI
const SESSION_SECRET = process.env.SESSION_SECRET;

// Add validation for MongoDB URI
if (!MONGODB_URI) {
    console.error('MONGO_DB_URI is not defined in .env file');
    process.exit(1);
}

// Validate required environment variables
if (!SESSION_SECRET) {
    console.error('SESSION_SECRET is not defined in .env file');
    process.exit(1);
}

// MongoDB Connection with error handling
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB connection disconnected');
});

// Handle application termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});

const app = express();
const store = new MongoDBStore({
  uri :MONGODB_URI,                  
  collection :"sessions"               
})

store.on("error", (error) => {
  console.error("Session store error:", error);
});
const apiRoutes = require("./routes/api.js");
const authRoutes = require("./routes/auth.js"); // Add this line
const { Credentials } = require("aws-sdk");

const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,                   
    methods: "GET,POST",              
    allowedHeaders: "Content-Type",   
  };

app.use(cors(corsOptions)); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Add support for JSON requests
app.use(
  session({
    secret: SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false, 
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, 
      secure: false, 
      httpOnly: true, 
    },
    store: store, 
  })
);

app.use("/api", apiRoutes);
app.use("/auth", authRoutes); // Add auth routes

app.listen(8000, () => {
  console.log("Running on http://localhost:8000/");
});
