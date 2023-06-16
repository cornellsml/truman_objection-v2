function likePost(e) {
    const target = $(e.target).closest('.ui.like.button');
    const post = target.closest(".ui.fluid.card");
    const label = post.find("a.ui.basic.green.right.pointing.label");
    const postID = post.attr("postID");
    const postClass = post.attr("postClass");
    const like = Date.now();

    if (target.hasClass("green")) { //Undo like Post
        target.removeClass("green");
        label.html(function(i, val) { return val * 1 - 1 });
    } else { //Like Post
        target.addClass("green");
        label.html(function(i, val) { return val * 1 + 1 });

        let dislike = post.find('.ui.unlike.button');
        if (dislike.hasClass("red")) {
            dislike.removeClass("red");
            var label2 = dislike.siblings("a.ui.basic.red.left.pointing.label");
            label2.html(function(i, val) { return val * 1 - 1 });
            $.post("/feed", {
                postID: postID,
                unlike: like,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }
    }
    $.post("/feed", {
        postID: postID,
        like: like,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
}

function unlikePost(e) {
    const target = $(e.target).closest('.ui.unlike.button');
    const post = target.closest(".ui.fluid.card");
    const label = post.find("a.ui.basic.red.left.pointing.label");
    const postID = post.attr("postID");
    const postClass = post.attr("postClass");
    const unlike = Date.now();

    if (target.hasClass("red")) { //Undo unlike Post
        target.removeClass("red");
        label.html(function(i, val) { return val * 1 - 1 });
    } else { //Like Post
        target.addClass("red");
        label.html(function(i, val) { return val * 1 + 1 });

        let like = post.find('.ui.like.button');
        if (like.hasClass("green")) {
            like.removeClass("green");
            var label2 = like.siblings("a.ui.basic.green.right.pointing.label");
            label2.html(function(i, val) { return val * 1 - 1 });
            $.post("/feed", {
                postID: postID,
                like: unlike,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }
    }

    $.post("/feed", {
        postID: postID,
        unlike: unlike,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
}

function flagPost(e) {
    const target = $(e.target);
    const post = target.closest(".ui.fluid.card");
    const postID = post.attr("postID");
    const postClass = post.attr("postClass");
    const flag = Date.now();

    if (target.hasClass("orange")) { //Undo Flag Post
        target.removeClass("orange");
    } else { //Flag Post
        target.addClass("orange");
    }

    $.post("/feed", {
        postID: postID,
        flag: flag,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
}

function sharePost(e) {
    const target = $(e.target);
    const post = target.closest(".ui.fluid.card");
    const postID = post.attr("postID");
    const postClass = post.attr("postClass");
    const share = Date.now();

    const pathname = window.location.href;
    $(".pathname").html(pathname + "?postID=" + postID);
    $('.ui.small.shareVideo.modal').modal('show');

    $.post("/feed", {
        postID: postID,
        share: share,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
}

function likeComment(e) {
    const target = $(e.target).closest('a.like'); //a.like
    const comment = target.closest(".comment");
    const label = target.find("span.num");
    const icon = target.find("i.icon.thumbs.up");

    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const commentID = comment.attr("commentID");
    const isUserComment = comment.find("a.author").attr('href') === '/me';
    const like = Date.now();

    if (target.hasClass("green")) { //Undo like comment
        target.removeClass("green");
        icon.removeClass("green");
        label.html(function(i, val) { return val * 1 - 1 });
    } else { //Like comment
        target.addClass("green");
        icon.addClass("green");
        label.html(function(i, val) { return val * 1 + 1 });

        let dislike = target.siblings("a.unlike");
        if (dislike.hasClass("red")) {
            dislike.removeClass("red");
            var label2 = dislike.find("span.num");
            var icon2 = dislike.find("i.icon.thumbs.down");
            label2.html(function(i, val) { return val * 1 - 1 });
            icon2.removeClass("red");
            $.post("/feed", {
                postID: postID,
                commentID: commentID,
                unlike: like,
                isUserComment: isUserComment,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }
    }
    $.post("/feed", {
        postID: postID,
        commentID: commentID,
        like: like,
        isUserComment: isUserComment,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
}

function unlikeComment(e) {
    const target = $(e.target).closest('a.unlike'); //a.unlike
    const comment = target.closest(".comment");
    const label = target.find("span.num");
    const icon = target.find("i.icon.thumbs.down");

    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");
    const commentID = comment.attr("commentID");
    const isUserComment = comment.find("a.author").attr('href') === '/me';
    const unlike = Date.now();

    if (target.hasClass("red")) { //Undo unlike comment
        target.removeClass("red");
        icon.removeClass("red");
        label.html(function(i, val) { return val * 1 - 1 });
    } else { //unlike comment
        target.addClass("red");
        icon.addClass("red");
        label.html(function(i, val) { return val * 1 + 1 });

        let like = target.siblings("a.like");
        if (like.hasClass("green")) {
            like.removeClass("green");
            var label2 = like.find("span.num");
            var icon2 = like.find("i.icon.thumbs.up");
            label2.html(function(i, val) { return val * 1 - 1 });
            icon2.removeClass("green");

            $.post("/feed", {
                postID: postID,
                commentID: commentID,
                like: unlike,
                isUserComment: isUserComment,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            });
        }
    }
    $.post("/feed", {
        postID: postID,
        commentID: commentID,
        unlike: unlike,
        isUserComment: isUserComment,
        postClass: postClass,
        _csrf: $('meta[name="csrf-token"]').attr('content')
    });
}

function flagComment(e) {
    const target = $(e.target);
    const comment = target.parents(".comment");
    const postID = target.closest(".ui.fluid.card").attr("postID");
    const postClass = target.closest(".ui.fluid.card").attr("postClass");;
    const commentID = comment.attr("commentID");
    comment.replaceWith(`
        <div class="comment" commentID="${commentID}" style="background-color:black;color:white">
            <h5 class="ui inverted header" style="padding-bottom: 0.5em; padding-left: 0.5em;">
                The admins will review this comment further. We are sorry you had this experience.
            </h5>
        </div>`);
    const flag = Date.now();

    if (target.closest(".ui.fluid.card").attr("type") == 'userPost')
        console.log("Should never be here.")
    else
        $.post("/feed", {
            postID: postID,
            commentID: commentID,
            flag: flag,
            postClass: postClass,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
}

function addComment(e) {
    const target = $(e.target);
    const text = target.siblings(".ui.form").find("textarea.newcomment").val().trim();
    const card = target.parents(".ui.fluid.card");
    let comments = card.find(".ui.comments");
    const postClass = target.parents(".ui.fluid.card").attr("postClass");;
    //no comments area - add it
    if (!comments.length) {
        const buttons = card.find(".ui.bottom.attached.icon.buttons")
        buttons.after('<div class="content"><div class="ui comments"></div>');
        comments = card.find(".ui.comments")
    }
    if (text.trim() !== '') {
        const date = Date.now();
        const ava = target.siblings('.ui.label').find('img.ui.avatar.image');
        const ava_img = ava.attr("src");
        const ava_name = ava.attr("name");
        const postID = card.attr("postID");
        const commentID = numComments + 1;

        const mess = `
        <div class="comment" commentID=${commentID}>
            <a class="avatar"><img src="${ava_img}"></a>
            <div class="content"> 
                <a class="author" href="/me">${ava_name}</a>
                <div class="metadata"> 
                    <span class="date">${humanized_time_span(date)}</span>
                    <i class="heart icon"></i> 
                    <span class="num"> 0 </span> Likes
                </div> 
                <div class="text">${text}</div>
                <div class="actions"> 
                    <a class="like comment" onClick="likeComment(event)">Like</a> 
                </div> 
            </div>
        </div>`;
        $(this).siblings(".ui.form").find("textarea.newcomment").val('');
        comments.append(mess);

        if (card.attr("type") == 'userPost')
            $.post("/userPost_feed", {
                postID: postID,
                new_comment: date,
                comment_text: text,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            }).then(function(json) {
                numComments = json.numComments;
            });
        else
            $.post("/feed", {
                postID: postID,
                new_comment: date,
                comment_text: text,
                postClass: postClass,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            }).then(function(json) {
                numComments = json.numComments;
            });;
    }
}

$(window).on('load', () => {
    // ************ Actions on Main Post ***************
    // Focus new comment element if "Reply" button is clicked
    $('.reply.button').on('click', function() {
        let parent = $(this).closest(".ui.fluid.card");
        parent.find("textarea.newcomment").focus();
    });

    // Press enter to submit a comment
    $("textarea.newcomment").keydown(function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.stopImmediatePropagation();
            $(this).parents(".ui.form").siblings("i.big.send.link.icon").click();

        }
    });

    //Create a new Comment
    $("i.big.send.link.icon").on('click', addComment);

    //Like Post
    $('.like.button').on('click', likePost);

    //Unlike Post
    $('.unlike.button').on('click', unlikePost);

    //Flag Post
    $('.flag.button').on('click', flagPost);

    //Share Post
    $('.share.button').on('click', sharePost);

    // ************ Actions on Comments***************
    // Like comment
    $('a.like').on('click', likeComment);

    // Unlike comment
    $('a.unlike').on('click', unlikeComment);

    //Flag comment
    $('a.flag.comment').on('click', flagComment);
});