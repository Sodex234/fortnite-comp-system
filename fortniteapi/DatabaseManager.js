const MongoClient = require("mongodb").MongoClient;

// Mongo Config
const mongoURL = "mongodb://localhost:27017";
const dbName = "fortnitestats";

var selfInstance;

class DatabaseManager {

    constructor(callback) {
        selfInstance = this;

        MongoClient.connect(mongoURL, function(err, mclient) {
            if(err !== null) {
                console.log("Error connecting to MongoDB: ");
                console.log(err);
            } else {
                console.log("Connected to MongoDB!");
            }

            selfInstance.client = mclient;
            selfInstance.db = mclient.db(dbName);
            selfInstance.usersCollection = selfInstance.db.collection("users");

            // Update the other classes callback.
            callback();
        });
    }

    closeClient() {
        this.client.close();
    }

    saveNewUser(fullName, form, fortniteStats) {
        this.userDataExists(fortniteStats.info.username, (exists) => {
            if(exists) {
                console.log("User data already exists, not saving.");
            } else {
                console.log("User data doesn't exist, saving.");

                this.usersCollection.insert({
                    fullName: fullName,
                    form: form,
                    fortniteStats: fortniteStats,
                    startingFortniteStats: fortniteStats // Save a copy of what they started as so that we can count from 0.
                }, function(err, result) {
                    if(err !== null) {
                        console.log("An error occurred when saving Fortnite user data.");
                        console.log(err);
                    } else {
                        console.log("Downloaded & Saved " + fullName + "'s initial Fortnite stats to Mongo!");
                    }
                });
            }
        });
    }

    userDataExists(username, callback) {
        this.usersCollection.findOne({"fortniteStats.info.username": username}).then(obj => {
            callback(obj !== null);
        });
    }

    getUserData(username, callback) {
        this.usersCollection.findOne({"fortniteStats.info.username": username}).then(obj => {
            // Calculate the score.

            // Win = 25 points
            // Kill = 10 points

            obj.fortniteStats.points = this.calculatePoints(obj);

            callback(obj);
        });
    }

    calculatePoints(obj) {
        var totalWins = (obj.fortniteStats.group.solo.wins - obj.startingFortniteStats.group.solo.wins)
            + (obj.fortniteStats.group.duo.wins - obj.startingFortniteStats.group.duo.wins)
            + (obj.fortniteStats.group.squad.wins - obj.startingFortniteStats.group.squad.wins);

        var totalWinPoints = totalWins * 25;

        var totalKills = (obj.fortniteStats.group.solo.kills - obj.startingFortniteStats.group.solo.kills)
            + (obj.fortniteStats.group.duo.kills - obj.startingFortniteStats.group.duo.kills)
            + (obj.fortniteStats.group.squad.kills - obj.startingFortniteStats.group.squad.kills);

        var totalKillPoints = totalKills * 10;

        return  (totalWinPoints + totalKillPoints);
    }

}

module.exports = DatabaseManager;