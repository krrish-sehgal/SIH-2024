const express = require("express");
const mongoose = require("mongoose"); 
const bodyParser = require("body-parser");
const session = require('express-session');        
const cors = require("cors"); 
const MongoDBStore = require('connect-mongodb-session')(session);

const apiRoutes = require("./src/routes/api.routes.js");
const authRoutes = require("./src/routes/auth.routes.js"); 

require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const APP_PORT = process.env.APP_PORT || 8000;

if (!MONGODB_URI) {
    console.error('MONGO_DB_URI is not defined in .env file');
    process.exit(1);
}

if (!SESSION_SECRET) {
    console.error('SESSION_SECRET is not defined in .env file');
    process.exit(1);
}

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

const corsOptions = {
    origin: CORS_ORIGIN,
    credentials: true,                   
    methods: "GET,POST",              
    allowedHeaders: "Content-Type",   
  };

app.use(cors(corsOptions)); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); 
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
app.use("/auth", authRoutes);

app.listen(APP_PORT, () => {
  console.log(`Running on http://localhost:${APP_PORT}/`);
});
