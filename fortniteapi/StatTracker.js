const Fortnite = require("fortnite-api");
const read = require("read-data");
const dbm = require("./DatabaseManager");

var StatTrackerInstance;

class StatTracker {

    constructor() {
        StatTrackerInstance = this;

        console.log("Creating a stat tracker instance.");
        console.log("Connecting to MongoDB...");
        this.databaseManager = new dbm(() => {
            // The database connection has been completed. Start the task.
            setInterval(() => {
                this._updateStats(); // This the only way to allow access to 'this' in the scope of update stats.
            }, 1000 * 60 * 10);
            this._updateStats();
        });

        console.log("Connecting to Fortnite API...");
        var apiCreds = read.sync("fortniteapi/apicreds.yml");

        this.fortniteAPI = new Fortnite([
            apiCreds.epicemail,
            apiCreds.epicpassword,
            apiCreds.epictoken,
            apiCreds.fortnitetoken
        ], {
            debug: true
        });

        this.fortniteAPI.login().then(() => {
            console.log("Connected to Fortnite API!");

            this.onFortniteConnect();
        });

        // Allow public access to the functions.
        this.addUser = this._addUser;
        this.getUserStats = this._getUserStats;
        this.updateStats = this._updateStats;

        // Set the current cached data
        this.resetCurrentWinData();
    }

    onFortniteConnect() {
    }

    _getUserStats() {

    }

    resetCurrentWinData() {
        this.currentWinData = {
            houses: [
                "carter",
                "elliot",
                "greenstreet",
                "fuller",
                "bennet"
            ],
            houseColors: {
                carter: "primary",
                bennet: "info",
                greenstreet: "success",
                fuller: "danger",
                elliot: "warning"
            },
            houseTotalScores: {
                carter: 0,
                elliot: 0,
                greenstreet: 0,
                fuller: 0,
                bennet: 0
            },
            houseTotalWins: {
                carter: 0,
                elliot: 0,
                greenstreet: 0,
                fuller: 0,
                bennet: 0
            },
            leaderboard: []
        };
    }

    /**
     * Update all of the stats and save them to the Mongo database.
     */
    _updateStats() {
        // Loop through all of the mongo users, download their stats, then download the fortnite API stats, and append.

        this.databaseManager.usersCollection.find({}).forEach(itm => {
            // update this item
            // Download the new stats.
            this.downloadFortniteStats(itm.fortniteStats.info.username, itm.fortniteStats.info.platform, (stats, err) => {
                if(err !== null) {
                    console.log("Couldn't update " + itm.fortniteStats.info.username + "'s stats.");
                } else {
                    this.databaseManager.usersCollection.update({_id: itm._id}, {$set: {fortniteStats: stats}});
                }
            });
        });

        // Clear the data.
        this.resetCurrentWinData();

        // Loop through again now, and download the appended stats and do the calculations.
        this.databaseManager.usersCollection.find({}).forEach(itm => {
            // Calculate this user's score.
            var points = this.databaseManager.calculatePoints(itm);

            // Find out what house they're in
            var house = this.formToHouse(itm.form);

            // Append this to the total score for their house.
            this.currentWinData.houseTotalScores[house] += points;

            // Append the total wins
            this.currentWinData.houseTotalWins[house] += itm.fortniteStats.lifetimeStats.wins - itm.startingFortniteStats.lifetimeStats.wins;

            // Add them to the leaderboard
            this.currentWinData.leaderboard.push({name: itm.fullName, form: itm.form,
                wins: (itm.fortniteStats.lifetimeStats.wins - itm.startingFortniteStats.lifetimeStats.wins), points: points});

            // Sort the leaderboard array.
            this.currentWinData.leaderboard.sort((a, b) => b.points - a.points);

            // Sort the house order array.
            this.currentWinData.houses.sort((a, b) => this.currentWinData.houseTotalScores[b] - this.currentWinData.houseTotalScores[a]);
        });
    }

    formToHouse(form) {
        switch(form.slice(-1).toUpperCase()) {
            case "C": return "carter";
            case "E": return "elliot";
            case "F": return "fuller";
            case "G": return "greenstreet";
            case "B": return "bennet";
        }
    }


    _addUser(fullName, form, username, platform) {
        console.log("Adding: " + fullName + ", " + form + ", " + username + ", " + platform + ".");

        this.downloadFortniteStats(username, platform, (stats, err) => {
            if(err === null) {
                console.log("Saving new user data...");

                this.databaseManager.saveNewUser(fullName, form, stats);
            } else {
                console.log("Couldn't download " + username + "'s stats.");
                console.log(err);
            }
        });
    }

    downloadFortniteStats(username, platform, callback) {
        this.fortniteAPI
            .getStatsBR(username, platform)
            .then(stats => {
                console.log("Downloaded " + username + "'s stats!");
                callback(stats, null);
            })
            .catch(err => {
                callback(null, err);
            });
    }

    static getStatTrackerInstance() {
        return StatTrackerInstance;
    }

}

module.exports = StatTracker;