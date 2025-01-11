const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import CORS

require("dotenv").config();

const app = express();

const apiRoutes = require("./routes/api.js");

const corsOptions = {
    origin: "*",                   
    methods: "GET,POST",              
    allowedHeaders: "Content-Type",   
  };

app.use(cors(corsOptions)); 
// Set up CORS to allow requests from localhost:3000
const corsOptions = {
  origin: "http://localhost:3000", // Allow only requests from this origin
  methods: "GET,POST",            // Allow only GET and POST methods
  allowedHeaders: "Content-Type", // Allow Content-Type header
};

app.use(cors(corsOptions)); // Enable CORS with the specified options
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Add support for JSON requests
app.use(bodyParser.json()); // Add support for JSON requests

app.use("/api", apiRoutes);

app.listen(8000, () => {
  console.log("Running on http://localhost:8000/");
});




