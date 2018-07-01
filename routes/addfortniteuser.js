const express = require("express");
const router = express.Router();
const StatTracker = require("../fortniteapi/StatTracker");

router.post("/", (req, res, next) => {
    // Invoke the code that creates the new user
    StatTracker.getStatTrackerInstance().addUser(req.body.fullName, req.body.marlingForm, req.body.username, req.body.platform);

    res.send("<script>window.location.href = '/fortnite';</script>");
});

module.exports = router;