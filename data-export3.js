// Get number of likes per comment ID

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

async function getDataExport() {
    const users = await getUserJsons();
    const scripts = await getScriptJsons();

    console.log(color_start, `Starting the data export script...`);
    const currentDate = new Date();
    const outputFilename =
        `truman_Objections-dataExport` +
        `.${currentDate.getMonth()+1}-${currentDate.getDate()}-${currentDate.getFullYear()}` +
        `.${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
    const outputFilepath = `./outputFiles/${outputFilename}.csv`;

    let numLikesPerComment = {};
    let records = [];
    // For each user
    for (const user of users) {
        for (const feedAction of user.feedAction) {
            const comments = feedAction.comments;
            comments.forEach(comment => {
                if (!comment.new_comment && comment.liked) {
                    const video = scripts.find(vid => vid._id.toString() == feedAction.post.toString());
                    let commentObj = video.comments.find(comm => comm._id.toString() == comment.comment.toString());
                    if (!commentObj) {
                        video.comments.forEach(function(comm, index) {
                            const subcommentObj = comm.subcomments.find(comm2 => comm2._id.toString() == comment.comment.toString());
                            if (subcommentObj != undefined) {
                                commentObj = subcommentObj;
                            }
                        })
                    }
                    const commentID = commentObj.commentID;
                    if (numLikesPerComment[commentID] != undefined) {
                        numLikesPerComment[commentID] += 1;
                    } else {
                        numLikesPerComment[commentID] = 1;
                    }
                }
            })
        }
    }
    let csvWriter_header = [];
    for (const commentID of Object.keys(numLikesPerComment)) {
        csvWriter_header.push({ id: commentID, title: commentID });
    }
    const csvWriter = createCsvWriter({
        path: outputFilepath,
        header: csvWriter_header
    });
    console.log(numLikesPerComment);
    console.log(csvWriter_header);
    await csvWriter.writeRecords([numLikesPerComment]);
    console.log(color_success, `...Data export completed.\nFile exported to: ${outputFilepath} with ${records.length} records.`);
    console.log(color_success, `...Finished reading from the db.`);
    db.close();
    console.log(color_start, 'Closed db connection.');
}

getDataExport();