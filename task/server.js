require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// CORS configuration to allow only a specific origin
var corsOptions = {
  origin: "*"
};

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Enable CORS
app.use(cors(corsOptions));

// parse requests of content-type - application/json

// parse requests of content-type - application/x-www-form-urlencoded

// Serve static files (images) from the 'app/assets' folder
app.use("/assets", express.static(path.join(__dirname, "app", "assets")));

// Import models (Make sure to update the path if necessary)y
const db = require("./app/models");

// Sync database and handle any errors
db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the application." });
});


// Route imports

// Route imports
require("./app/routes/auth.routes")(app);
require("./app/routes/task.routes")(app);

// Role-related routes
require("./app/routes/role.routes")(app);

// User-related routes
require("./app/routes/user.routes")(app);

require('./app/routes/product.routes')(app);
require('./app/routes/category.routes')(app);
require('./app/routes/review.routes')(app);
require('./app/routes/cart.routes')(app);
require('./app/routes/variation.routes')(app);
require('./app/routes/color_option.routes')(app);

// Add error handling for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({ message: "Route not found!" });
});

// set port, listen for requests
const PORT = process.env.PORT || 3227;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
