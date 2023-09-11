//Get each user's video activity per video

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
  Gets the user models from the database, or folder of json files.
*/
async function getUserJsons() {
    const users = await User.find({ isAdmin: false }).exec();
    return users;
}
async function getScriptJsons() {
    const scripts = await Script.find({}).exec();
    return scripts;
}

async function getOffenseAndObjectionIds() {
    const vids = await Script.find({
        postID: { "$in": [1, 6, 11] }
    }).exec();

    return [vids.map(vid => vid.id), vids.map(vid => vid.comments[3].id), vids.map(vid => vid.comments[3].subcomments[0].id)];
}

async function getVidIDfromPostID(id) {
    const vid = await Script.find({
        postID: id
    }).exec();

    return vid[0].id;
}

async function getDataExport() {
    const users = await getUserJsons();
    const scripts = await getScriptJsons();
    const [postIDs, offenseIDs, objectionIDs] = await getOffenseAndObjectionIds();

    console.log(color_start, `Starting the data export script...`);
    const currentDate = new Date();
    const outputFilename =
        `truman_Objections-dataExport` +
        `.${currentDate.getMonth()+1}-${currentDate.getDate()}-${currentDate.getFullYear()}` +
        `.${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
    const outputFilepath = `./outputFiles/${outputFilename}.csv`;
    const csvWriter_header = [
        { id: 'id', title: "Qualtrics ID" },
        { id: 'topic', title: 'Interest' },
        { id: 'ActivityOnVideo1', title: 'Activity on Video 1' },
        { id: 'ActivityOnVideo2', title: 'Activity on Video 2' },
        { id: 'ActivityOnVideo3', title: 'Activity on Video 3' },
        { id: 'ActivityOnVideo4', title: 'Activity on Video 4' },
        { id: 'ActivityOnVideo5', title: 'Activity on Video 5' }
    ];
    const csvWriter = createCsvWriter({
        path: outputFilepath,
        header: csvWriter_header
    });
    const records = [];
    // For each user
    for (const user of users) {
        const record = {}; //Record for the user
        record.id = user.mturkID;
        record.topic = user.interest;

        for (const feedAction of user.feedAction) {
            const videoAction = feedAction.videoAction;
            const videoID = scripts.find(vid => vid._id.toString() == feedAction.post.toString());
            let string = "";
            videoAction.forEach(vidAction => {
                string += (vidAction.action != "volumeChange") ? vidAction.action + "@ " + vidAction.videoTime + "\r\n" : vidAction.action + " to " + vidAction.volume + "\r\n"
            });
            record[`ActivityOnVideo${(videoID.postID%5)+1}`] = string;
        }

        console.log(record);
        records.push(record);
    }
    await csvWriter.writeRecords(records);
    console.log(color_success, `...Data export completed.\nFile exported to: ${outputFilepath} with ${records.length} records.`);
    console.log(color_success, `...Finished reading from the db.`);
    db.close();
    console.log(color_start, 'Closed db connection.');
}

getDataExport();