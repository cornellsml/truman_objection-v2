const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const Script = require('./models/Script.js');
const User = require('./models/User.js');
const Actor = require('./models/Actor.js');
const mongoose = require('mongoose');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Console.log color shortcuts
const color_start = '\x1b[33m%s\x1b[0m'; // yellow
const color_success = '\x1b[32m%s\x1b[0m'; // green
const color_error = '\x1b[31m%s\x1b[0m'; // red

// establish initial Mongoose connection, if Research Site
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true });
// listen for errors after establishing initial connection
db = mongoose.connection;
db.on('error', (err) => {
    console.error(err);
    console.log(color_error, '%s MongoDB connection error.');
    process.exit(1);
});
console.log(color_success, `Successfully connected to db.`);

/*
  Gets the user models from the database specified in the .env file.
*/
async function getUserJsons() {
    const users = await User
        .find({ isAdmin: false })
        .populate('feedAction.post')
        .exec();
    return users;
}

async function getDataExport() {
    const users = await getUserJsons();

    console.log(color_start, `Starting the data export script...`);
    const currentDate = new Date();
    const outputFilename =
        `truman_Objections-formal-followup-dataExport` +
        `.${currentDate.getMonth()+1}-${currentDate.getDate()}-${currentDate.getFullYear()}` +
        `.${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
    const outputFilepath = `./outputFiles/formal-followup_study/${outputFilename}.csv`;
    const csvWriter_header = [
        { id: 'id', title: "Qualtrics ID" },
        { id: 'username', title: "Username" },
        { id: 'Topic', title: 'Topic' },
        { id: 'Condition', title: 'Condition' },
        { id: 'CompletedStudy', title: 'CompletedStudy' },
        { id: 'NumberVideoCompleted', title: 'NumberVideoCompleted' },
        { id: 'V2_Completed', title: 'V2_Completed' },
        { id: 'V4_Completed', title: 'V4_Completed' },
        { id: 'GeneralTimeSpent', title: 'GeneralTimeSpent' },
        { id: 'PageLog', title: 'PageLog' },
        { id: 'PageTimes', title: 'PageTimes' },
        { id: 'PageLog_num', title: 'PageLog_#' },
        { id: 'PageTimes_num', title: 'PageTimes_#' }
    ];
    const csvWriter = createCsvWriter({
        path: outputFilepath,
        header: csvWriter_header
    });
    const records = [];
    // For each user
    for (const user of users) {
        const record = {}; // Record for the user
        record.id = user.mturkID;
        record.username = user.username;
        record.Topic = user.interest;
        record.Condition = user.group;
        if (!user.consent) {
            record.CompletedStudy = false;
            record.NumberVideoCompleted = 0;
            records.push(record);
            continue;
        }

        let NumberVideoCompleted = 0;

        // For each video (feedAction)
        for (const feedAction of user.feedAction) {
            if (feedAction.post.class != user.interest) {
                continue;
            }
            const video = (feedAction.post.postID % 5) + 1; //1, 2, 3, 4, 5
            const video_length = feedAction.post.length;

            for (const element of feedAction.videoDuration) {
                if (element.find(vidDuration => vidDuration.startTime == 0 && vidDuration.endTime >= Math.floor(video_length * 100000) / 100000)) {
                    NumberVideoCompleted++;
                    if (video == 2) {
                        record.V2_Completed = true;
                    }
                    if (video == 4) {
                        record.V4_Completed = true;
                    }
                    break;
                }
            }
        }
        record.CompletedStudy = (NumberVideoCompleted == 5) ? true : false;
        record.NumberVideoCompleted = NumberVideoCompleted;

        let string = "";
        user.pageLog.forEach(page => { string += page.page + "\r\n" });
        record.PageLog = string;

        record.PageLog_num = user.pageLog.length;

        string = "";
        user.pageTimes.forEach(page => { string += page.page + ": " + page.time + "\r\n" });
        record.PageTimes = string;


        record.PageTimes_num = user.pageTimes.length;

        let sumOnSite = 0;
        for (const pageLog of user.pageTimes) {
            sumOnSite += pageLog.time;
        }
        record.GeneralTimeSpent = sumOnSite / 1000;

        records.push(record);
    }

    await csvWriter.writeRecords(records);
    console.log(color_success, `...Data export completed.\nFile exported to: ${outputFilepath} with ${records.length} records.`);
    console.log(color_success, `...Finished reading from the db.`);
    db.close();
    console.log(color_start, 'Closed db connection.');
}

getDataExport();