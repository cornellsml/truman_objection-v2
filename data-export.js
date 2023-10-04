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
    const users = await User
        .find({ isAdmin: false })
        .populate('feedAction.post')
        .exec();
    return users;
}

async function getOffenseOneId(experimentalCondition, interest) {
    const videoIndexes = {
        'Science': 1,
        'Education': 6,
        'Lifestyle': 11
    };

    const videoObj = await Script
        .find({ class: interest, postID: videoIndexes[interest] })
        .exec();

    let offenseObj;
    if (experimentalCondition <= 17) {
        offenseObj = videoObj[0].comments.find(comment => comment.class == 'offense');
    } else {
        offenseObj = videoObj[0].comments.find(comment => comment.class == 'control');
    }
    return offenseObj.id;
}

async function getOffenseTwoId(experimentalCondition, interest) {
    const videoIndexes = {
        'Science': 3,
        'Education': 8,
        'Lifestyle': 13
    };

    const videoObj = await Script
        .find({ class: interest, postID: videoIndexes[interest] })
        .exec();

    let offenseObj;
    if (experimentalCondition <= 17) {
        offenseObj = videoObj[0].comments.find(comment => comment.class == 'offense');
    }
    return offenseObj.id;
}

async function getObjectionId(experimentalCondition, interest) {
    const videoIndexes = {
        'Science': 1,
        'Education': 6,
        'Lifestyle': 11
    };

    const videoObj = await Script
        .find({ class: interest, postID: videoIndexes[interest] })
        .exec();

    let objectionObj;
    if (experimentalCondition <= 17) {
        let offenseObj = videoObj[0].comments.find(comment => comment.class == 'offense');
        objectionObj = offenseObj.subcomments.find(subcomment => subcomment.class == experimentalCondition);
    }
    return objectionObj.id;
}

async function getDataExport() {
    const users = await getUserJsons();

    console.log(color_start, `Starting the data export script...`);
    const currentDate = new Date();
    const outputFilename =
        `truman_Objections-formal-dataExport` +
        `.${currentDate.getMonth()+1}-${currentDate.getDate()}-${currentDate.getFullYear()}` +
        `.${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
    const outputFilepath = `./outputFiles/truman-objections-formal/${outputFilename}.csv`;
    const csvWriter_header = [
        { id: 'id', title: "Qualtrics ID" },
        { id: 'Topic', title: 'Topic' },
        { id: 'Condition', title: 'Condition' },
        { id: 'CompletedStudy', title: 'CompletedStudy' },
        { id: 'NumberVideoCompleted', title: 'NumberVideoCompleted' },
        { id: 'V2_Completed', title: 'V2_Completed' },
        { id: 'V4_Completed', title: 'V4_Completed' },
        { id: 'GeneralTimeSpent', title: 'GeneralTimeSpent' },
        { id: 'V1_timespent', title: 'V1_timespent' },
        { id: 'V2_timespent', title: 'V2_timespent' },
        { id: 'V3_timespent', title: 'V3_timespent' },
        { id: 'V4_timespent', title: 'V4_timespent' },
        { id: 'V5_timespent', title: 'V5_timespent' },
        { id: 'AvgTimeVideo', title: 'AvgTimeVideo' },
        { id: 'VideoUpvoteNumber', title: 'VideoUpvoteNumber' },
        { id: 'VideoDownvoteNumber', title: 'VideoDownvoteNumber' },
        { id: 'VideoFlagNumber', title: 'VideoFlagNumber' },
        { id: 'CommentUpvoteNumber', title: 'CommentUpvoteNumber' },
        { id: 'V1_CommentUpvoteNumber', title: 'V1_CommentUpvoteNumber' },
        { id: 'V2_CommentUpvoteNumber', title: 'V2_CommentUpvoteNumber' },
        { id: 'V3_CommentUpvoteNumber', title: 'V3_CommentUpvoteNumber' },
        { id: 'V4_CommentUpvoteNumber', title: 'V4_CommentUpvoteNumber' },
        { id: 'V5_CommentUpvoteNumber', title: 'V5_CommentUpvoteNumber' },
        { id: 'CommentDownvoteNumber', title: 'CommentDownvoteNumber' },
        { id: 'V1_CommentDownvoteNumber', title: 'V1_CommentDownvoteNumber' },
        { id: 'V2_CommentDownvoteNumber', title: 'V2_CommentDownvoteNumber' },
        { id: 'V3_CommentDownvoteNumber', title: 'V3_CommentDownvoteNumber' },
        { id: 'V4_CommentDownvoteNumber', title: 'V4_CommentDownvoteNumber' },
        { id: 'V5_CommentDownvoteNumber', title: 'V5_CommentDownvoteNumber' },
        { id: 'CommentFlagNumber', title: 'CommentFlagNumber' },
        { id: 'V1_CommentFlagNumber', title: 'V1_CommentFlagNumber' },
        { id: 'V2_CommentFlagNumber', title: 'V2_CommentFlagNumber' },
        { id: 'V3_CommentFlagNumber', title: 'V3_CommentFlagNumber' },
        { id: 'V4_CommentFlagNumber', title: 'V4_CommentFlagNumber' },
        { id: 'V5_CommentFlagNumber', title: 'V5_CommentFlagNumber' },
        { id: 'GeneralPostComments', title: 'GeneralPostComments' },
        { id: 'V1_PostComments', title: 'V1_PostComments' },
        { id: 'V2_PostComments', title: 'V2_PostComments' },
        { id: 'V3_PostComments', title: 'V3_PostComments' },
        { id: 'V4_PostComments', title: 'V4_PostComments' },
        { id: 'V5_PostComments', title: 'V5_PostComments' },
        { id: 'OffenseOne_Appear', title: 'OffenseOne_Appear' },
        { id: 'OffenseOne_Upvote', title: 'OffenseOne_Upvote' },
        { id: 'OffenseOne_Downvote', title: 'OffenseOne_Downvote' },
        { id: 'OffenseOne_Flag', title: 'OffenseOne_Flag' },
        { id: 'OffenseOne_Reply', title: 'OffenseOne_Reply' },
        { id: 'OffenseOne_ReplyBody', title: 'OffenseOne_ReplyBody' },
        { id: 'Objection_Appear', title: 'Objection_Appear' },
        { id: 'Objection_Upvote', title: 'Objection_Upvote' },
        { id: 'Objection_Downvote', title: 'Objection_Downvote' },
        { id: 'Objection_Flag', title: 'Objection_Flag' },
        { id: 'Objection_Reply', title: 'Objection_Reply' },
        { id: 'Objection_ReplyBody', title: 'Objection_ReplyBody' },
        { id: 'V2_CommentBody', title: 'V2_CommentBody' },
        { id: 'OffenseTwo_Appear', title: 'OffenseTwo_Appear' },
        { id: 'OffenseTwo_Upvote', title: 'OffenseTwo_Upvote' },
        { id: 'OffenseTwo_Downvote', title: 'OffenseTwo_Downvote' },
        { id: 'OffenseTwo_Flag', title: 'OffenseTwo_Flag' },
        { id: 'OffenseTwo_Reply', title: 'OffenseTwo_Reply' },
        { id: 'OffenseTwo_ReplyBody', title: 'OffenseTwo_ReplyBody' },
        { id: 'V4_CommentBody', title: 'V4_CommentBody' },
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
        record.Topic = user.interest;
        record.Condition = user.group;

        //OffenseOne if experimental, OffenseTwo if control
        const offenseOneId = await getOffenseOneId(user.group, user.interest);
        let objectionId, offenseTwoId;
        if (user.group <= 17) {
            objectionId = await getObjectionId(user.group, user.interest);
            offenseTwoId = await getOffenseTwoId(user.group, user.interest);
        }

        let NumberVideoCompleted = 0;
        let VideoUpvoteNumber = 0;
        let VideoDownvoteNumber = 0;
        let VideoFlagNumber = 0;

        //For each video (feedAction)
        for (const feedAction of user.feedAction) {
            const video = (feedAction.post.postID % 5) + 1; //1, 2, 3, 4, 5
            const video_length = feedAction.post.length;
            if (feedAction.liked) {
                VideoUpvoteNumber++;
            }
            if (feedAction.unliked) {
                VideoDownvoteNumber++;
            }
            if (feedAction.flagged) {
                VideoFlagNumber++;
            }

            for (const element of feedAction.videoDuration) {
                if (element.find(vidDuration => vidDuration.startTime == 0 && vidDuration.endTime == video_length)) {
                    NumberVideoCompleted++;
                    if (video == 2) {
                        record.V2_Completed = true;
                    }
                    if (video == 4) {
                        record.V4_Completed = true;
                    }
                }
            }

            const generalComments = user.group <= 17 ?
                feedAction.comments.filter(comment =>
                    !comment.new_comment &&
                    comment.comment.toString() != offenseOneId &&
                    comment.comment.toString() != objectionId &&
                    comment.comment.toString() != offenseTwoId) :
                feedAction.comments.filter(comment =>
                    !comment.new_comment &&
                    comment.comment.toString() != offenseOneId);

            const numLikes = generalComments.filter(comment => comment.liked).length;
            const numDislikes = generalComments.filter(comment => comment.unliked).length;
            const numFlagged = generalComments.filter(comment => comment.flagged).length;
            const numNewComments = feedAction.comments.filter(comment =>
                comment.new_comment &&
                !(comment.reply_to >= 7 && comment.reply_to <= 26) &&
                (comment.reply_to != 35) &&
                !(comment.reply_to >= 47 && comment.reply_to <= 66) &&
                (comment.reply_to != 75) &&
                !(comment.reply_to >= 87 && comment.reply_to <= 106) &&
                (comment.reply_to != 115)).length;

            record[`V${video}_CommentUpvoteNumber`] = numLikes;
            record[`V${video}_CommentDownvoteNumber`] = numDislikes;
            record[`V${video}_CommentFlagNumber`] = numFlagged;
            record[`V${video}_PostComments`] = numNewComments;

            if (video == 2) {
                const offObj = feedAction.comments.find(comment => !comment.new_comment && comment.comment.toString() == offenseOneId);
                if (user.group <= 17) {
                    record.OffenseOne_Upvote = (offObj != undefined) ? offObj.liked : false;
                    record.OffenseOne_Downvote = (offObj != undefined) ? offObj.unliked : false;
                    record.OffenseOne_Flag = (offObj != undefined) ? offObj.flagged : false;
                } else {
                    record.OffenseTwo_Upvote = (offObj != undefined) ? offObj.liked : false;
                    record.OffenseTwo_Downvote = (offObj != undefined) ? offObj.unliked : false;
                    record.OffenseTwo_Flag = (offObj != undefined) ? offObj.flagged : false;
                }

                if (user.group <= 17) {
                    const objObj = feedAction.comments.find(comment => !comment.new_comment && comment.comment.toString() == objectionId);
                    record.Objection_Upvote = (objObj != undefined) ? objObj.liked : false;
                    record.Objection_Downvote = (objObj != undefined) ? objObj.unliked : false;
                    record.Objection_Flag = (objObj != undefined) ? objObj.flagged : false;

                    const replyToObjection = feedAction.comments.filter(comment =>
                        (comment.reply_to >= 9 && comment.reply_to <= 26) ||
                        (comment.reply_to >= 49 && comment.reply_to <= 66) ||
                        (comment.reply_to >= 89 && comment.reply_to <= 106));
                    if (replyToObjection.length != 0) {
                        let string = "";
                        replyToObjection.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body + "\r\n" });
                        record.Objection_ReplyBody = string;
                        record.Objection_Reply = true;
                    } else {
                        record.Objection_Reply = false;
                    }
                }

                const newComments = feedAction.comments.filter(comment =>
                    comment.new_comment && ![7, 8, 47, 48, 87, 88].includes(comment.reply_to));
                let string = "";
                newComments.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body + "\r\n" });
                record.V2_CommentBody = string;

                const replyToOffense = feedAction.comments.filter(comment => [7, 8, 47, 48, 87, 88].includes(comment.reply_to));
                if (replyToOffense.length != 0) {
                    let string = "";
                    replyToOffense.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body + "\r\n" });
                    if (user.group <= 17) {
                        record.OffenseOne_ReplyBody = string;
                        record.OffenseOne_Reply = true;
                    } else {
                        record.OffenseTwo_ReplyBody = string;
                        record.OffenseTwo_Reply = true;
                    }
                } else {
                    if (user.group <= 17) {
                        record.OffenseOne_Reply = false;
                    } else {
                        record.OffenseTwo_Reply = false;
                    }
                }
            }


            if (video == 4 && user.group <= 17) {
                const off2Obj = feedAction.comments.find(comment => !comment.new_comment && comment.comment.toString() == offenseTwoId);
                record.OffenseTwo_Upvote = (off2Obj != undefined) ? off2Obj.liked : false;
                record.OffenseTwo_Downvote = (off2Obj != undefined) ? off2Obj.unliked : false;
                record.OffenseTwo_Flag = (off2Obj != undefined) ? off2Obj.flagged : false;

                const replyToOffense2 = feedAction.comments.filter(comment => [35, 75, 115].includes(comment.reply_to));
                if (replyToOffense2.length != 0) {
                    let string = "";
                    replyToOffense2.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body + "\r\n" });
                    record.OffenseTwo_ReplyBody = string;
                    record.OffenseTwo_Reply = true;
                } else {
                    record.OffenseTwo_Reply = false;
                }

                const newComments = feedAction.comments.filter(comment =>
                    comment.new_comment && ![35, 75, 115].includes(comment.reply_to));
                let string = "";
                newComments.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body + "\r\n" });
                record.V4_CommentBody = string;
            }
        }

        record.CompletedStudy = (NumberVideoCompleted == 5) ? true : false;
        record.NumberVideoCompleted = NumberVideoCompleted;
        record.VideoUpvoteNumber = VideoUpvoteNumber;
        record.VideoDownvoteNumber = VideoDownvoteNumber;
        record.VideoFlagNumber = VideoFlagNumber;

        record.CommentUpvoteNumber = (record.V1_CommentUpvoteNumber || 0) + (record.V2_CommentUpvoteNumber || 0) + (record.V3_CommentUpvoteNumber || 0) + (record.V4_CommentUpvoteNumber || 0) + (record.V5_CommentUpvoteNumber);

        record.CommentDownvoteNumber = (record.V1_CommentDownvoteNumber || 0) + (record.V2_CommentDownvoteNumber || 0) + (record.V3_CommentDownvoteNumber || 0) + (record.V4_CommentDownvoteNumber || 0) + (record.V5_CommentDownvoteNumber);

        record.CommentFlagNumber = (record.V1_CommentFlagNumber || 0) + (record.V2_CommentFlagNumber || 0) + (record.V3_CommentFlagNumber || 0) + (record.V4_CommentFlagNumber || 0) + (record.V5_CommentFlagNumber);

        record.GeneralPostComments = (record.V1_PostComments || 0) + (record.V2_PostComments || 0) + (record.V3_PostComments || 0) + (record.V4_PostComments || 0) + (record.V5_PostComments);

        if (user.group <= 17) {
            record.OffenseOne_Appear = user.offenseMessageSeen_1;
            record.Objection_Appear = user.objectionMessageSeen;
            record.OffenseTwo_Appear = user.offenseMessageSeen_2;
        } else {
            record.OffenseTwo_Appear = user.offenseMessageSeen_2;
        }

        let pageTimes = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        }
        let sumOnSite = 0;
        for (const pageLog of user.pageTimes) {
            if (pageLog.page.startsWith("/?v=")) {
                const page = (pageLog.page.replace(/\D/g, '') % 5) + 1;
                pageTimes[page] = pageTimes[page] + pageLog.time;
            }
            sumOnSite += pageLog.time;
        }
        record.GeneralTimeSpent = sumOnSite / 1000;

        let sumOnVideos = 0;
        let numVideos = 0;
        for (const key in pageTimes) {
            record[`V${key}_timespent`] = pageTimes[key] / 1000;
            if (pageTimes[key] > 1500) {
                numVideos++;
                sumOnVideos += pageTimes[key];
            }
        }

        record.AvgTimeVideo = (sumOnVideos / 1000) / numVideos;
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