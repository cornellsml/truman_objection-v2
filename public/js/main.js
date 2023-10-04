//Before Page load:
let isActive = false;
let activeStartTime;

//Called when user is inactive for about 1 minute, when user logs out of the website, when user changes the page (page and video)
//Adds the amount of time use was active on the website for
async function resetActiveTimer(loggingOut, fromIdle) {
    if (isActive) {
        const currentTime = new Date();
        const activeDuration = currentTime - activeStartTime - (fromIdle ? 60000 : 0);
        if (window.location.pathname !== '/signup' && window.location.pathname !== '/thankyou') {
            let pathname = window.location.pathname;
            if (window.location.pathname == '/') {
                const currentCard = $('.ui.fluid.card:visible');
                const index = currentCard.attr("index");
                pathname += `?v=${index}`;
            }
            await $.post("/pageTimes", {
                time: activeDuration,
                pathname: pathname,
                _csrf: $('meta[name="csrf-token"]').attr('content')
            })
            if (loggingOut) {
                window.loggingOut = true;
                window.location.href = '/logout';
            }
        }
        isActive = false;
    }
}

$(window).on("load", function() {
    //From the first answer from https://stackoverflow.com/questions/667555/how-to-detect-idle-time-in-javascript
    let idleTime = 0;
    //Definition of an active user: mouse movement, clicks etc.
    //idleTime is reset to 0 whenever mouse movement occurs.
    $('#pagegrid').on('mousemove keypress scroll mousewheel', function() {
        //If there hasn't been a "start time" for activity, set it.
        if (!isActive) {
            activeStartTime = Date.now();
            isActive = true;
        }
        idleTime = 0;
    });

    //every 15 seconds
    setInterval(function() {
        idleTime += 1;
        if (idleTime > 4) { // 60.001-74.999 seconds (idle time)
            resetActiveTimer(false, true);
        }
    }, 15000);

    $('a.item.logoutLink').on('click', function() {
        resetActiveTimer(true, false);
    });

    if (window.location.pathname !== '/signup' && window.location.pathname !== '/' && window.location.pathname !== '/logout' && window.location.pathname !== '/thankyou') {
        $.post("/pageLog", {
            path: window.location.pathname,
            _csrf: $('meta[name="csrf-token"]').attr('content')
        });
    };

    // Track how long a post is on the screen (borders are defined by image)
    // Start time: When the entire photo is visible in the viewport .
    // End time: When the entire photo is no longer visible in the viewport.
    // $('.ui.fluid.card .img.post').visibility({
    //     once: false,
    //     continuous: false,
    //     observeChanges: true,
    //     //throttle:100,
    //     initialCheck: true,
    //     offset: 50,

    //     //Handling scrolling down like normal
    //     //Called when bottomVisible turns true (bottom of a picture is visible): bottom can enter from top or bottom of viewport
    //     onBottomVisible: function(element) {
    //         var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
    //         // Bottom of picture enters from bottom (scrolling down the feed; as normal)
    //         if (element.topVisible) { // Scrolling Down AND entire post is visible on the viewport 
    //             // If this is the first time bottom is visible
    //             if (startTime == 0) {
    //                 var startTime = Date.now();
    //             }
    //         } else { //Scrolling up and this event does not matter, since entire photo isn't visible anyways.
    //             var startTime = 0;
    //         }
    //         $(this).siblings(".content").children(".myTimer").text(startTime);
    //     },

    //     //Element's bottom edge has passed top of the screen (disappearing); happens only when Scrolling Up
    //     onBottomPassed: function(element) {
    //         var endTime = Date.now();
    //         var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
    //         var totalViewTime = endTime - startTime; //TOTAL TIME HERE

    //         var parent = $(this).parents(".ui.fluid.card");
    //         var postID = parent.attr("postID");
    //         var postClass = parent.attr("postClass");;
    //         // If user viewed it for less than 24 hours, but more than 1.5 seconds (just in case)
    //         if (totalViewTime < 86400000 && totalViewTime > 1500 && startTime > 0) {
    //             $.post("/feed", {
    //                 postID: postID,
    //                 viewed: totalViewTime,
    //                 postClass: postClass,
    //                 _csrf: $('meta[name="csrf-token"]').attr('content')
    //             });
    //             // Reset Timer
    //             $(this).siblings(".content").children(".myTimer").text(0);
    //         }
    //     },

    //     //Handling scrolling up
    //     //Element's top edge has passed top of the screen (appearing); happens only when Scrolling Up
    //     onTopPassedReverse: function(element) {
    //         var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
    //         if (element.bottomVisible && startTime == 0) { // Scrolling Up AND entire post is visible on the viewport 
    //             var startTime = Date.now();
    //             $(this).siblings(".content").children(".myTimer").text(startTime);
    //         }
    //     },

    //     // Called when topVisible turns false (exits from top or bottom)
    //     onTopVisibleReverse: function(element) {
    //         if (element.topPassed) { //Scrolling Down, disappears on top; this event doesn't matter (since it is when bottom disappears that time is stopped)
    //         } else { // False when Scrolling Up (the bottom of photo exits screen.)
    //             var endTime = Date.now();
    //             var startTime = parseInt($(this).siblings(".content").children(".myTimer").text());
    //             var totalViewTime = endTime - startTime;

    //             var parent = $(this).parents(".ui.fluid.card");
    //             var postID = parent.attr("postID");
    //             var postClass = parent.attr("postClass");;
    //             // If user viewed it for less than 24 hours, but more than 1.5 seconds (just in case)
    //             if (totalViewTime < 86400000 && totalViewTime > 1500 && startTime > 0) {
    //                 $.post("/feed", {
    //                     postID: postID,
    //                     viewed: totalViewTime,
    //                     postClass: postClass,
    //                     _csrf: $('meta[name="csrf-token"]').attr('content')
    //                 });
    //                 // Reset Timer
    //                 $(this).siblings(".content").children(".myTimer").text(0);
    //             }
    //         }
    //     }
    // });
});

$(window).on("beforeunload", function() {
    // https: //developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
    if (!window.loggingOut) {
        resetActiveTimer(false, false);
    }
});