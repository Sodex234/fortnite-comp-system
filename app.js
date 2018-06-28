const express = require("express");
const expressLayouts = require('express-ejs-layouts');
const path = require("path");

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(expressLayouts);
app.use(express.static("public"));
app.use("/", require("./routes/index"));
app.use("/fortnite", require("./routes/fortnite"));

app.listen(process.env.PORT || 3000);
