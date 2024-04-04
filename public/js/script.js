$(window).on("load", function() {
    let offense1Seen = false;
    let offense2Seen = false;
    let objection1Seen = false;
    let objection2Seen = false;
    $.post("/pageLog", {
        path: window.location.pathname + `?v=${$('.ui.fluid.card:visible').attr('index')}`,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
    $(`.ui.fluid.card:visible video`)[0].play();
    $('video').on("timeupdate", function() {
        const post = $(this).parents('.ui.fluid.card');
        const postTimeStamps = JSON.parse(post.attr('postTimeStamps'));
        const postTimeStampsDictionary = JSON.parse(post.attr('postTimeStampsDict'));
        for (const timestamp of postTimeStamps) {
            if (this.currentTime * 1000 > timestamp) {
                const comments = postTimeStampsDictionary[timestamp];
                for (const comment of comments) {
                    const commentElement = $(`.comment[index=${comment}]`);
                    if (!commentElement.is(":visible")) {
                        if (commentElement.parent('.subcomments').length) {
                            if (!commentElement.parent('.subcomments').is(":visible")) {
                                commentElement.parent('.subcomments').transition('fade up');
                            }
                        }
                        commentElement.addClass("glowBorder", 1000).transition('fade up');
                        commentElement[0].scrollIntoView({
                            behavior: "smooth", // or "auto" or "instant"
                            block: "start" // or "end"
                        });
                        setTimeout(function() {
                            commentElement.removeClass("glowBorder", 1000);
                        }, 2500);
                    }
                }
            }
        };

        const index = parseInt(post.attr("index"));
        const offense1 = {
            1: 30000,
            6: 30000,
            11: 39000
        }
        const offense2 = {
            3: 22000,
            8: 45000,
            13: 22000
        }
        const objection1 = {
            1: 34000,
            6: 34000,
            11: 43000
        }
        const objection2 = {
            1: 36000,
            6: 36000,
            11: 45000
        }
        if ([1, 6, 11].includes(index)) {
            if (this.currentTime * 1000 > offense1[index] && !offense1Seen) {
                $.post("/messageSeen", {
                    offense1: true,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
                offense1Seen = true;
            }
            if (this.currentTime * 1000 > objection1[index] && !objection1Seen) {
                $.post("/messageSeen", {
                    objection1: true,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
                objection1Seen = true;
            }
            if (this.currentTime * 1000 > objection2[index] && !objection2Seen) {
                $.post("/messageSeen", {
                    objection2: true,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
                objection2Seen = true;
            }
        }
        if ([3, 8, 13].includes(index)) {
            if (this.currentTime * 1000 > offense2[index] && !offense2Seen) {
                $.post("/messageSeen", {
                    offense2: true,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
                offense2Seen = true;
            }
        }
    });

    // At the end of the video, just ensure all the comments appear.
    $('video').on("ended", function() {
        const post = $(this).parents('.ui.fluid.card');
        const postID = post.attr("postID");
        for (const comment of post.find('.comment.hidden')) {
            const commentElement = $(comment);
            if (!commentElement.is(":visible")) {
                if (commentElement.parent('.subcomments').length) {
                    if (!commentElement.parent('.subcomments').is(":visible")) {
                        commentElement.parent('.subcomments').transition('fade');
                    }
                }
                commentElement.addClass("glowBorder", 1000).transition('fade up');
                setTimeout(function() {
                    commentElement.removeClass("glowBorder", 1000);
                }, 2500);
            }
        }
        $.post("/feed", {
            postID: postID,
            videoAction: {
                action: 'ended',
                absTime: Date.now(),
            },
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
    });

    $('video').on("play", function() {
        const post = $(this).parents('.ui.fluid.card');
        const postID = post.attr("postID");
        $.post("/feed", {
            postID: postID,
            videoAction: {
                action: 'play',
                absTime: Date.now(),
                videoTime: this.currentTime,
            },
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
    })

    $('video').on("pause", async function(event) {
        // When a user switches to another video while it is still playing, the "pause" is triggered programatically by .trigger("pause").
        // But for some reason, programatically triggering the pause calls the .on("pause") event handler twice. 
        // So, ignore one of these triggers.
        if (event.isTrigger) {
            return;
        }

        const post = $(this).parents('.ui.fluid.card');
        const postID = post.attr("postID");
        if (!this.seeking) {
            await $.post("/feed", {
                postID: postID,
                videoAction: {
                    action: 'pause',
                    absTime: Date.now(),
                    videoTime: this.currentTime,
                },
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }

        i = 0;
        videoDuration = [];
        while (i < post.find('video')[0].played.length) {
            videoDuration.push({
                startTime: post.find('video')[0].played.start(i),
                endTime: post.find('video')[0].played.end(i)
            })
            i++;
        }
        if (videoDuration.length != 0) {
            await $.post("/feed", {
                postID: postID,
                videoDuration: videoDuration,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }
    })

    $('video').on("seeked", function() {
        const post = $(this).parents('.ui.fluid.card');
        const postID = post.attr("postID");
        $.post("/feed", {
            postID: postID,
            videoAction: {
                action: 'seeked',
                absTime: Date.now(),
                videoTime: this.currentTime,
            },
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
    })

    $('video').on("seeking", function() {
        const post = $(this).parents('.ui.fluid.card');
        const postID = post.attr("postID");
        $.post("/feed", {
            postID: postID,
            videoAction: {
                action: 'seeking',
                absTime: Date.now(),
                videoTime: this.currentTime,
            },
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
    })

    $('video').on("volumechange", function() {
        const post = $(this).parents('.ui.fluid.card');
        const postID = post.attr("postID");
        $.post("/feed", {
            postID: postID,
            videoAction: {
                action: 'volumechange',
                absTime: Date.now(),
                videoTime: this.currentTime,
                volume: (this.muted) ? 0 : this.volume
            },
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
    })

    // Buttons to switch videos
    $('button.circular.ui.icon.button.blue.centered').on("click", async function() {
        const currentCard = $('.ui.fluid.card:visible');
        // If current video is not paused, pause video.
        if (!currentCard.find('video')[0].paused) {
            currentCard.find('video').trigger('pause');
        }
        // Record the time spent on current video.
        await resetActiveTimer(false, false);

        // Transition to next video and play the video.
        const nextVid = parseInt($(this).attr('nextVid'));
        $('.ui.fluid.card:visible').transition('hide');
        $(`.ui.fluid.card[index=${nextVid}]`).transition();
        $(`.ui.fluid.card[index=${nextVid}] video`)[0].play();

        // Hide buttons accordingly
        if (nextVid % 5 == 0) {
            $('button.left').addClass("hidden");
        } else {
            $('button.left').removeClass("hidden");
            $('button.left').attr('nextVid', nextVid - 1);
        }

        if (nextVid % 5 == 4) {
            $('button.right:not(.disabled)').addClass("hidden");
            $('#lastVid-button').removeClass("hidden");
        } else {
            $('button.right:not(.disabled)').removeClass("hidden");
            $('#lastVid-button').addClass("hidden");
            $('button.right:not(.disabled)').attr('nextVid', nextVid + 1);
        }

        // Log new page
        await $.post("/pageLog", {
            path: window.location.pathname + `?v=${nextVid}`,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
    })
});