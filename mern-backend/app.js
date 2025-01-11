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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Add support for JSON requests

app.use("/api", apiRoutes);

app.listen(8000, () => {
  console.log("Running on http://localhost:8000/");
});
