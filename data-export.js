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
        { id: 'NumVidsInteractedWith', title: '# of videos interacted with' },
        { id: 'NumVidsLiked', title: '# of videos liked' },
        { id: 'NumVidsDisliked', title: '# of videos disliked' },
        { id: 'NumVidsFlagged', title: '# of videos flagged' },
        { id: 'NumCommentsLiked', title: '# of comments liked' },
        { id: 'NumCommentsDisliked', title: '# of comments disliked' },
        { id: 'NumCommentsFlagged', title: '# of comments flagged' },

        { id: 'NumNewUserComments', title: '# of new comments made' },

        { id: 'offenseMessageSeen', title: 'Offense Message Seen (T/F)' },
        { id: 'offenseMessageLiked', title: 'Offense Message Liked (T/F)' },
        { id: 'offenseMessageDisliked', title: 'Offense Message Disliked (T/F)' },
        { id: 'offenseMessageFlagged', title: 'Offense Message Flagged (T/F)' },

        { id: 'objectionMessageSeen', title: 'Objection Message Appeared (T/F)' },
        { id: 'objectionMessageLiked', title: 'Objection Message Appeared (T/F)' },
        { id: 'objectionMessageDisliked', title: 'Objection Message Disliked (T/F)' },
        { id: 'objectionMessageFlagged', title: 'Objection Message Flagged (T/F)' },

        { id: 'NewCommentsOnSecondVideo', title: 'New User Comments on Video 2' },

        { id: 'TotalTime', title: 'App. Total Time on Website (in seconds)' },
        { id: 'TimeVid1', title: 'App. Time on Video 1 (in seconds)' },
        { id: 'TimeVid2', title: 'App. Time on Video 2 (in seconds)' },
        { id: 'TimeVid3', title: 'App. Time on Video 3 (in seconds)' },
        { id: 'TimeVid4', title: 'App. Time on Video 4 (in seconds)' },
        { id: 'TimeVid5', title: 'App. Time on Video 5 (in seconds)' },
        { id: 'lastPageVisited', title: 'Last Page Visited' }
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

        record.NumVidsInteractedWith = user.feedAction.length;
        record.NumVidsLiked = user.feedAction.filter(vid => vid.liked).length;
        record.NumVidsDisliked = user.feedAction.filter(vid => vid.unliked).length;
        record.NumVidsFlagged = user.feedAction.filter(vid => vid.flagged).length;

        const counts = user.feedAction.reduce(function(newCount, feedAction) {
            const generalComments = feedAction.comments.filter(comment => !comment.new_comment && !offenseIDs.includes(comment.comment.toString()) && !objectionIDs.includes(comment.comment.toString()));
            const numLikes = generalComments.filter(comment => comment.liked).length;
            const numDislikes = generalComments.filter(comment => comment.unliked).length;
            const numFlagged = generalComments.filter(comment => comment.flagged).length;
            const numNewComments = feedAction.comments.filter(comment => comment.new_comment).length;

            newCount[0] += numLikes;
            newCount[1] += numDislikes;
            newCount[2] += numFlagged;
            newCount[3] += numNewComments;
            return newCount;
        }, [0, 0, 0, 0]);

        record.NumCommentsLiked = counts[0];
        record.NumCommentsDisliked = counts[1];
        record.NumCommentsFlagged = counts[2];
        record.NumNewUserComments = counts[3];

        record.offenseMessageSeen = user.offenseMessageSeen;
        record.objectionMessageSeen = user.objectionMessageSeen;

        const stimuliFeedAction = user.feedAction.find(vid => postIDs.includes(vid.post.toString()));

        if (stimuliFeedAction != undefined) {
            const comments = stimuliFeedAction.comments;

            const offenseComment = comments.find(comment => comment.comment && offenseIDs.includes(comment.comment.toString()));
            record.offenseMessageLiked = (offenseComment != undefined) ? offenseComment.liked : false;
            record.offenseMessageDisliked = (offenseComment != undefined) ? offenseComment.unliked : false;
            record.offenseMessageFlagged = (offenseComment != undefined) ? offenseComment.flagged : false;

            const objectionComment = comments.find(comment => comment.comment && objectionIDs.includes(comment.comment.toString()));
            record.objectionMessageLiked = (objectionComment != undefined) ? objectionComment.liked : false;
            record.objectionMessageDisliked = (objectionComment != undefined) ? objectionComment.unliked : false;
            record.objectionMessageFlagged = (objectionComment != undefined) ? objectionComment.flagged : false;

            const newComments = comments.filter(comment => comment.new_comment);
            console.log(newComments);
            let string = "";
            newComments.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body + "\r\n" });
            record.NewCommentsOnSecondVideo = string;
        }

        const pageLogs = user.pageLog.filter(page => page.page.startsWith("/?"));
        const pageTimes = [0, 0, 0, 0, 0];

        for (var i = 0; i < pageLogs.length - 1; i++) {
            const currPage = pageLogs[i];
            const nextPage = pageLogs[i + 1];

            const currPage_index = parseInt(currPage.page.replace(/\D/g, '')) % 5;
            const currPage_time = currPage.time;
            const nextPage_time = nextPage.time;

            const duration = nextPage_time - currPage_time;
            if (duration < 600000) {
                pageTimes[currPage_index] = pageTimes[currPage_index] + duration;
            }
        }

        const lastPage = pageLogs[pageLogs.length - 1];
        const lastPage_index = parseInt(lastPage.page.replace(/\D/g, '')) % 5;
        const lastPage_time = lastPage.time;

        const lastPage_postID = await getVidIDfromPostID(parseInt(lastPage.page.replace(/\D/g, '')));
        const lastPage_feedAction = user.feedAction.find(vid => vid.post.equals(lastPage_postID));

        if (lastPage_feedAction != undefined) {
            let lastPage_dates = [];
            lastPage_dates = lastPage_dates.concat(user.likeTime || []);
            lastPage_dates = lastPage_dates.concat(user.unlikeTime || []);
            lastPage_dates = lastPage_dates.concat(user.flagTime || []);
            lastPage_dates = lastPage_dates.concat(lastPage_feedAction.videoAction.map(vid => vid.absTime) || []);
            lastPage_dates = lastPage_dates.concat(lastPage_feedAction.comments.map(comment => comment.absTime) || []);

            const maxDate = new Date(Math.max(...lastPage_dates));
            const duration = maxDate - lastPage_time;
            if (duration > 0) {
                pageTimes[lastPage_index] = pageTimes[lastPage_index] + duration;
            }
        }
        record.TimeVid1 = pageTimes[0] / 1000;
        record.TimeVid2 = pageTimes[1] / 1000;
        record.TimeVid3 = pageTimes[2] / 1000;
        record.TimeVid4 = pageTimes[3] / 1000;
        record.TimeVid5 = pageTimes[4] / 1000;

        const loadFeedTime = user.pageLog.find(page => page.page = "/").time;
        const createdAt = user.createdAt;
        const duration = loadFeedTime - createdAt;

        record.TotalTime = (pageTimes[0] + pageTimes[1] + pageTimes[2] + pageTimes[3] + pageTimes[4] + duration) / 1000;
        record.lastPageVisited = lastPage_index;
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