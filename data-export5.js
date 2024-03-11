// Data exploration: Winice and Pengfei check when people react to the targeted messages (right after the message shows up or after they finish the video)

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

/*
  Gets the mongoDB object id value of the first offense message. If user is in the control group, object id value of the second offense message.
*/
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

/*
  Gets the mongoDB object id value of the second offense message. Returns a non-null value only if user is in the experimental group.
*/
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

/*
  Gets the mongoDB object id value of the objection message. Returns a non-null value only if user is in the experimental group.
*/
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
        `.${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}-videoExploratoryAnalysis`;
    const outputFilepath = `./outputFiles/truman-objections-formal/${outputFilename}.csv`;
    const csvWriter_header = [
        { id: 'id', title: "Qualtrics ID" },
        { id: 'username', title: "Username" },
        { id: 'Condition', title: 'Condition' },
        { id: 'V2_VideoPauseOrSeek', title: 'V2_VideoPauseOrSeek' },
        { id: 'V4_VideoPauseOrSeek', title: 'V4_VideoPauseOrSeek' },
        { id: 'V2_VideoActivity', title: 'V2_VideoActivity' },
        { id: 'V4_VideoActivity', title: 'V4_ActivityActivity' },

        { id: 'V2_VideoStartTime', title: 'V2_VideoStartTime' },
        { id: 'V4_VideoStartTime', title: 'V4_VideoStartTime' },
        { id: 'V2_VideoEndTime', title: 'V2_VideoEndTime' },
        { id: 'V4_VideoEndTime', title: 'V4_VideoEndTime' },

        { id: 'OffenseOne_Upvote', title: 'OffenseOne_Upvote' },
        { id: 'OffenseOne_Upvote_Time', title: 'OffenseOne_Upvote_Time' },
        { id: 'OffenseOne_Downvote', title: 'OffenseOne_Downvote' },
        { id: 'OffenseOne_Downvote_Time', title: 'OffenseOne_Downvote_Time' },
        { id: 'OffenseOne_Flag', title: 'OffenseOne_Flag' },
        { id: 'OffenseOne_Flag_Time', title: 'OffenseOne_Flag_Time' },
        { id: 'OffenseOne_Reply', title: 'OffenseOne_Reply' },
        { id: 'OffenseOne_Reply_Time', title: 'OffenseOne_Reply_Time' },
        { id: 'OffenseOne_ReplyBody', title: 'OffenseOne_ReplyBody' },

        { id: 'Objection_Upvote', title: 'Objection_Upvote' },
        { id: 'Objection_Upvote_Time', title: 'Objection_Upvote_Time' },
        { id: 'Objection_Downvote', title: 'Objection_Downvote' },
        { id: 'Objection_Downvote_Time', title: 'Objection_Downvote_Time' },
        { id: 'Objection_Flag', title: 'Objection_Flag' },
        { id: 'Objection_Flag_Time', title: 'Objection_Flag_Time' },
        { id: 'Objection_Reply', title: 'Objection_Reply' },
        { id: 'Objection_Reply_Time', title: 'Objection_Reply' },
        { id: 'Objection_ReplyBody', title: 'Objection_ReplyBody' },

        { id: 'OffenseTwo_Upvote', title: 'OffenseTwo_Upvote' },
        { id: 'OffenseTwo_Upvote_Time', title: 'OffenseTwo_Upvote_Time' },
        { id: 'OffenseTwo_Downvote', title: 'OffenseTwo_Downvote' },
        { id: 'OffenseTwo_Downvote_Time', title: 'OffenseTwo_Downvote_Time' },
        { id: 'OffenseTwo_Flag', title: 'OffenseTwo_Flag' },
        { id: 'OffenseTwo_Flag_Time', title: 'OffenseTwo_Flag_Time' },
        { id: 'OffenseTwo_Reply', title: 'OffenseTwo_Reply' },
        { id: 'OffenseTwo_Reply_Time', title: 'OffenseTwo_Reply_Time' },
        { id: 'OffenseTwo_ReplyBody', title: 'OffenseTwo_ReplyBody' }
    ];
    const csvWriter = createCsvWriter({
        path: outputFilepath,
        header: csvWriter_header
    });
    const records = [];
    // For each user
    for (const user of users) {
        if (!user.consent) {
            continue;
        }

        const record = {}; //Record for the user
        let performedAction = false;
        record.id = user.mturkID;
        record.username = user.username;
        record.Condition = user.group;

        //OffenseOne if experimental, OffenseTwo if control
        const offenseOneId = await getOffenseOneId(user.group, user.interest);
        let objectionId, offenseTwoId;
        if (user.group <= 17) {
            objectionId = await getObjectionId(user.group, user.interest);
            offenseTwoId = await getOffenseTwoId(user.group, user.interest);
        }

        //For each video (feedAction)
        for (const feedAction of user.feedAction) {
            const video = (feedAction.post.postID % 5) + 1; //1, 2, 3, 4, 5
            // This shouldn't happen; 
            // But in case the user somehow got to watch videos from 2 interests (clicked browser back button and chose a new interests), then
            // Only include videos from their most recently selected interest.
            if (feedAction.post.class != user.interest) {
                continue;
            }

            let continuous = true;
            let videoStartTime; // Absolute timestamp the user clicked play to watch the video, in milliseconds
            let videoEndTime; // Absolute timestamp the user ended watching the video, in milliseconds

            const videoTimes = {
                "Science": {
                    2: 49.249524,
                    4: 31.950658
                },
                "Education": {
                    2: 59.907483,
                    4: 58.862585
                },
                "Lifestyle": {
                    2: 59.628844,
                    4: 39.125624
                }
            }

            let string = "";
            const filteredVideoAction = feedAction.videoAction.filter(vidAction => vidAction.action != "volumechange");
            for (const element of filteredVideoAction) {
                if (element.action != 'play' && element.action != 'ended' &&
                    !(element.action == "pause" && element.videoTime <= videoTimes[user.interest][video] + 0.5 && element.videoTime >= videoTimes[user.interest][video] - 0.5)) {
                    continuous = false;
                }
                if (element.action == 'play' && element.videoTime == 0) {
                    videoStartTime = element.absTime;
                    record[`V${video}_VideoStartTime`] = videoStartTime.getTime();
                }
                if (element.action == 'ended') {
                    videoEndTime = element.absTime;
                    record[`V${video}_VideoEndTime`] = videoEndTime.getTime();
                }
                string += element.action + "@ " + element.videoTime + "\r\n";
            }

            record[`V${video}_VideoPauseOrSeek`] = !continuous;
            if (!continuous) {
                record[`V${video}_VideoActivity`] = string;
            }

            if (video == 2) {
                // See if user interacted with the offense
                const offObj = feedAction.comments.find(comment => !comment.new_comment && comment.comment.toString() == offenseOneId);
                const offenseNum = (user.group <= 17) ? "One" : "Two";
                if (offObj && offObj.like) {
                    record[`Offense${offenseNum}_Upvote`] = offObj.liked;
                    record[`Offense${offenseNum}_Upvote_Time`] = offObj.likeTime[0].getTime();
                    performedAction = true;
                }

                if (offObj && offObj.unliked) {
                    record[`Offense${offenseNum}_Downvote`] = offObj.unliked;
                    record[`Offense${offenseNum}_Downvote_Time`] = offObj.unlikeTime[0].getTime();
                    performedAction = true;
                }

                if (offObj && offObj.flagged) {
                    record[`Offense${offenseNum}_Flag`] = offObj.flagged;
                    record[`Offense${offenseNum}_Flag_Time`] = offObj.flagTime[0].getTime();
                    performedAction = true;
                }

                if (user.group <= 17) {
                    // See if user interacted with the offense
                    const objObj = feedAction.comments.find(comment => !comment.new_comment && comment.comment.toString() == objectionId);

                    if (objObj && objObj.liked) {
                        record[`Objection_Upvote`] = objObj.liked;
                        record[`Objection_Upvote_Time`] = objObj.likeTime[0].getTime();
                        performedAction = true;
                    }

                    if (objObj && objObj.unliked) {
                        record[`Objection_Downvote`] = objObj.unliked;
                        record[`Objection_Downvote_Time`] = objObj.unlikeTime[0].getTime();
                        performedAction = true;
                    }

                    if (objObj && objObj.flagged) {
                        record[`Objection_Flag`] = objObj.flagged;
                        record[`Objection_Flag_Time`] = objObj.flagTime[0].getTime();
                        performedAction = true;
                    }

                    const replyToObjection = feedAction.comments.filter(comment =>
                        (comment.reply_to >= 9 && comment.reply_to <= 26) ||
                        (comment.reply_to >= 49 && comment.reply_to <= 66) ||
                        (comment.reply_to >= 89 && comment.reply_to <= 106));
                    if (replyToObjection.length != 0) {
                        performedAction = true;
                        let string = "";
                        replyToObjection.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body });
                        record.Objection_ReplyBody = string;
                        record.Objection_Reply = true;
                        string = "";
                        replyToObjection.forEach(comment => { string += comment.absTime.getTime() });
                        record.Objection_Reply_Time = string;
                    }
                }

                const replyToOffense = feedAction.comments.filter(comment => [7, 8, 47, 48, 87, 88].includes(comment.reply_to));
                if (replyToOffense.length != 0) {
                    performedAction = true;
                    let string = "";
                    let string2 = "";
                    replyToOffense.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body });
                    replyToOffense.forEach(comment => { string2 += comment.absTime.getTime() });
                    if (user.group <= 17) {
                        record.OffenseOne_ReplyBody = string;
                        record.OffenseOne_Reply_Time = string2;
                        record.OffenseOne_Reply = true;
                    } else {
                        record.OffenseTwo_ReplyBody = string;
                        record.OffenseTwo_Reply_Time = string2;
                        record.OffenseTwo_Reply = true;
                    }
                }
            }

            if (video == 4 && user.group <= 17) {
                const off2Obj = feedAction.comments.find(comment => !comment.new_comment && comment.comment.toString() == offenseTwoId);
                if (off2Obj && off2Obj.like) {
                    record.OffenseTwo_Upvote = off2Obj.liked;
                    record[`OffenseTwo_Upvote_Time`] = off2Obj.likeTime[0].getTime();
                    performedAction = true;
                }
                if (off2Obj && off2Obj.unliked) {
                    record.OffenseTwo_Downvote = off2Obj.unliked;
                    record[`OffenseTwo_Downvote_Time`] = off2Obj.unlikeTime[0].getTime();
                    performedAction = true;
                }
                if (off2Obj && off2Obj.flagged) {
                    record.OffenseTwo_Flag = off2Obj.flagged;
                    record[`OffenseTwo_Flag_Time`] = off2Obj.flagTime[0].getTime();
                    performedAction = true;
                }

                const replyToOffense2 = feedAction.comments.filter(comment => [35, 75, 115].includes(comment.reply_to));
                if (replyToOffense2.length != 0) {
                    performedAction = true;
                    let string = "";
                    replyToOffense2.forEach(comment => { string += comment.new_comment_id + (comment.reply_to ? " (is a reply to " + comment.reply_to + ")" : "") + ": " + comment.body });
                    record.OffenseTwo_ReplyBody = string;
                    record.OffenseTwo_Reply = true;
                    string = "";
                    replyToOffense2.forEach(comment => { string += comment.absTime.getTime(); });
                    record.OffenseTwo_Reply_Time = string;
                }
            }
        }

        if (user.group <= 17) {
            record.OffenseOne_Appear = user.offenseMessageSeen_1;
            record.Objection_Appear = user.objectionMessageSeen;
            record.OffenseTwo_Appear = user.offenseMessageSeen_2;
        } else {
            record.OffenseTwo_Appear = user.offenseMessageSeen_2;
        }

        if (performedAction) {
            console.log(record);
            records.push(record);
        }
    }

    await csvWriter.writeRecords(records);
    console.log(color_success, `...Data export completed.\nFile exported to: ${outputFilepath} with ${records.length} records.`);
    console.log(color_success, `...Finished reading from the db.`);
    db.close();
    console.log(color_start, 'Closed db connection.');
}

getDataExport();