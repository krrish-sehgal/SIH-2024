const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

const apiRoutes = require("./routes/api");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/api", apiRoutes);

app.listen(3000, () => {
  console.log("Running on http://localhost:3000/");
});
