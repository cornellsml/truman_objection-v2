$(window).on("load", function() {
    let offenseSeen_1 = false;
    let offenseSeen_2 = false;
    let objectionSeen = false;
    $.post("/pageLog", {
        path: window.location.pathname + `?v=${$('.ui.fluid.card:visible').attr('index')}`,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
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
                        setTimeout(function() {
                            commentElement.removeClass("glowBorder", 1000);
                        }, 2500);
                    }
                }
            }
        };

        const index = parseInt(post.attr("index"));
        const offense_1 = {
            1: 34000,
            6: 30000,
            11: 39000
        }
        const offense_2 = {
            3: 22000,
            8: 45000,
            13: 22000
        }
        const objection = {
            1: 42000,
            6: 38000,
            11: 46000
        }
        if ([1, 6, 11].includes(index)) {
            if (this.currentTime * 1000 > offense_1[index] && !offenseSeen_1) {
                $.post("/messageSeen", {
                    offense_1: true,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
                offenseSeen_1 = true;
            }
            if (this.currentTime * 1000 > objection[index] && !objectionSeen) {
                $.post("/messageSeen", {
                    objection: true,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
                objectionSeen = true;
            }
        }
        if ([3, 8, 13].includes(index)) {
            if (this.currentTime * 1000 > offense_2[index] && !offenseSeen_2) {
                $.post("/messageSeen", {
                    offense_2: true,
                    _csrf: $('meta[name="csrf-token"]').attr('content')
                });
                offenseSeen_2 = true;
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

    $('video').on("pause", async function() {
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

    //Buttons to switch videos
    $('button.circular.ui.icon.button.blue.centered').on("click", async function() {
        const currentCard = $('.ui.fluid.card:visible');
        if (!currentCard.find('video')[0].paused) {
            currentCard.find('video').off("pause");
            currentCard.find('video').trigger('pause');
            currentCard.find('video').on("pause", async function() {
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
        }

        const nextVid = parseInt($(this).attr('nextVid'));
        await resetActiveTimer(false, false);
        await $.post("/pageLog", {
            path: window.location.pathname + `?v=${nextVid}`,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });

        if ($(this).hasClass("left")) {
            $('.ui.fluid.card:visible').transition('hide');
            $(`.ui.fluid.card[index=${nextVid}]`).transition();
        } else {
            $('.ui.fluid.card:visible').transition('hide');
            $(`.ui.fluid.card[index=${nextVid}]`).transition();
        }

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
    })
});