const express = require("express");
const router = express.Router();
const StatTracker = require("../fortniteapi/StatTracker");

router.get("/", (req, res, next) => {
    // Get the latest cache and pass it to the page that is going to be rendererd.

    res.render("fortnite", {data: StatTracker.getStatTrackerInstance().currentWinData});
});

router.get("/:username", (req, res, next) => {
    // Download the current data.
    var username = req.params.username;

    // Check if the data exists.
    StatTracker.getStatTrackerInstance().databaseManager.userDataExists(username, (exists) => {
        if(exists) {
            // Download the data from the database.
            StatTracker.getStatTrackerInstance().databaseManager.getUserData(username, (data) => {
                res.render("fortniteuser", {statData: data.fortniteStats, oldStatData: data.startingFortniteStats});
            });
        } else {
            res.render("usernotexists");
        }
    });
});

module.exports = router;