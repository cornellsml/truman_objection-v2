$(window).on("load", function() {
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
    });

    $('video').on("ended", function() {
        const post = $(this).parents('.ui.fluid.card');
        for (const comment of post.find('.comment.hidden')) {
            const commentElement = $(comment);
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
    });

    $('button.circular.ui.icon.button.blue.centered').on("click", function() {
        const currentCard = $('.ui.fluid.card:visible');
        currentCard.find('video').trigger('pause');
        const nextVid = parseInt($(this).attr('nextVid'));

        if ($(this).hasClass("left")) {
            $('.ui.fluid.card:visible').transition('fly left');
            setTimeout(function() {
                $(`.ui.fluid.card[postID=${posts[nextVid]}]`).transition('fly right');
            }, 500);
        } else {
            $('.ui.fluid.card:visible').transition('fly right');
            setTimeout(function() {
                $(`.ui.fluid.card[postID=${posts[nextVid]}]`).transition('fly left');
            }, 500);
        }

        $('button.left').attr('nextVid', (((nextVid - 1) % 5) + 5) % 5);
        $('button.right').attr('nextVid', (((nextVid + 1) % 5) + 5) % 5);

    })
});