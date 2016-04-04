// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      1.31
// @description  Autovotes via text on /r/robin
// @author       /u/GuitarShirt and /u/keythkatz
// @match        https://www.reddit.com/robin*
// @updateURL    https://github.com/keythkatz/Robin-Autovoter/raw/master/robinautovoter.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/jQuery-linkify/1.1.7/jquery.linkify.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jshashes/1.0.5/hashes.min.js
// @require      https://raw.githubusercontent.com/marcuswestin/store.js/master/store.min.js
// ==/UserScript==
/* jshint esnext: true */

// Spam array to check messages against
var blockSpam = [
    "[Robin Autovoter",
    "voted to GROW",
    "voted to STAY",
    "voted to ABANDON",
    "Current standings [",
    "Voting will end soon",
    "777",
    ">>>",
    "[Silent Robin",
    "Available commands:",
    "[Robin-"
    ];

function sendMessage(message){
    $("#robinSendMessage > input[type='text']").val(message);
    $("#robinSendMessage > input[type='submit']").click();
}

function sendTrackingStatistics(config)
{
    if(!GM_getValue("stat-tracking",true))
    {
        return;
    }

    // Use the name / id from the passed config if available
    //  Otherwise fallback to the baked info
    room_name = r.config.robin_room_name;
    room_id = r.config.robin_room_id;

    if('undefined' !== typeof config['robin_room_name'])
    {
        room_name = config.robin_room_name;
    }

    if('undefined' !== typeof config['robin_room_id'])
    {
        room_id = config.robin_room_id;
    }

    trackers = [
        "https://jrwr.space/robin/track.php",
        "https://monstrouspeace.com/robintracker/track.php"
    ];

    queryString = "?id=" + room_name.substr(0,10) +
        "&guid=" + room_id +
        "&ab=" + r.robin.stats.abandonVotes +
        "&st=" + r.robin.stats.continueVotes +
        "&gr=" + r.robin.stats.increaseVotes +
        "&nv=" + r.robin.stats.abstainVotes +
        "&count=" + r.robin.stats.totalUsers +
        "&ft=" + Math.floor(r.config.robin_room_date / 1000) +
        "&rt=" + Math.floor(r.config.robin_room_reap_time / 1000);

    trackers.forEach(function(tracker){
        $.get(tracker + queryString);
    });
}

function updateStatistics(config)
{
    // Take over r.robin.stats for this
    if('undefined' === typeof r.robin['stats'])
    {
        r.robin.stats = {};
    }

    // Update the userlist
    if('undefined' !== typeof config['robin_user_list'])
    {
        var robinUserList = config.robin_user_list;
        r.robin.stats.totalUsers = robinUserList.length;
        r.robin.stats.increaseVotes = robinUserList.filter(function(voter){return voter.vote === "INCREASE";}).length;
        r.robin.stats.abandonVotes = robinUserList.filter(function(voter){return voter.vote === "ABANDON";}).length;
        r.robin.stats.abstainVotes = robinUserList.filter(function(voter){return voter.vote === "NOVOTE";}).length;
        r.robin.stats.continueVotes = robinUserList.filter(function(voter){return voter.vote === "CONTINUE";}).length;
        r.robin.stats.abstainPct = (100 * r.robin.stats.abstainVotes / r.robin.stats.totalUsers).toFixed(2);
        r.robin.stats.increasePct = (100 * r.robin.stats.increaseVotes / r.robin.stats.totalUsers).toFixed(2);
        r.robin.stats.abandonPct = (100 * r.robin.stats.abandonVotes / r.robin.stats.totalUsers).toFixed(2);
        r.robin.stats.continuePct = (100 * r.robin.stats.continueVotes / r.robin.stats.totalUsers).toFixed(2);

        // Update the div with that data
        $('#totalUsers').html(r.robin.stats.totalUsers);

        $('#increaseVotes').html(r.robin.stats.increaseVotes);
        $('#continueVotes').html(r.robin.stats.continueVotes);
        $('#abandonVotes').html(r.robin.stats.abandonVotes);
        $('#abstainVotes').html(r.robin.stats.abstainVotes);

        $('#increasePct').html("(" + r.robin.stats.increasePct + "%)");
        $('#continuePct').html("(" + r.robin.stats.continuePct + "%)");
        $('#abandonPct').html("(" + r.robin.stats.abandonPct + "%)");
        $('#abstainPct').html("(" + r.robin.stats.abstainPct + "%)");
    }

    sendTrackingStatistics(config);
}

// This grabs us the same data that is available in r.config via
//   parsing down a new page (giving us updated data without us having
//   to follow it like we probably should)
function parseStatistics(data)
{
    // There is a call to r.setup in the robin HTML. We're going to try to grab that.
    //   Wish us luck!
    var START_TOKEN = "<script type=\"text/javascript\" id=\"config\">r.setup(";
    var END_TOKEN = ")</script>";

    // If we can't locate the start token, don't bother to update this.
    //   We'll try again in 60 seconds
    var index = data.indexOf(START_TOKEN);
    if(index == -1)
    {
        return;
    }
    data = data.substring(index + START_TOKEN.length);

    index = data.indexOf(END_TOKEN);
    if(index == -1)
    {
        return;
    }
    data = data.substring(0,index);

    // This will throw on failure
    var config = JSON.parse(data);

    updateStatistics(config);
}

function generateStatisticsQuery()
{
    // Query for the userlist
    $.get("/robin",parseStatistics);
}

function getTimeUntilReap()
{
    var currentTime = Math.floor(Date.now() / 1000);
    var reapTime = Math.floor(r.config.robin_room_reap_time / 1000);
    var dT = Math.abs(reapTime - currentTime);

    var minutes = Math.floor(dT/60);
    var seconds = "0" + (dT - (minutes * 60));
    seconds = seconds.substr(seconds.length-2); // 0 pad the seconds

    // If we've passed the reap time, put a - in the front.
    if(reapTime < currentTime)
    {
        minutes = "-" + minutes;
    }

    return "" + minutes + "m" + seconds + "s";
}

function updateReapTimer()
{
    $('#reapTimerTime').html(getTimeUntilReap());
}

function updateSpamTotal()
{
    $('#blockedSpamTotal').html(store.get("totalSpam"));
}

function updateTitle() {
    setTimeout(updateTitle,5000);
    document.title = "Robin | Users: " + r.robin.stats.totalUsers;
}

function cleanSpamFilter()
{
    // time = Now - 2 minutes
    time = Math.floor(Date.now()/1000)-120;

    // Filter out anything older than that 2 minute mark
    oldMsgHashes = r.robin.msgHashes;
    r.robin.msgHashes = {};
    $.each(oldMsgHashes,function(h){
        if(oldMsgHashes[h]>time)
        {
            r.robin.msgHashes[h] = oldMsgHashes[h];
        }
    });
    delete oldMsgHashes;
}

function newMessageHandler(records)
{
    records.forEach(function(record) {
        var msg = $(record.addedNodes);
        if(0 === record.addedNodes.length)
        {
            return;
        }

        timestamp = $(msg[0]).children('.robin-message--timestamp').text();
        user = $(msg[0]).children('.robin-message--from').text();
        msgText = $(msg[0]).children('.robin-message--message').text();

        if(GM_getValue('remove-spam',true))
        {
            for(var i in blockSpam)
            {
                if(msgText.indexOf(blockSpam[i])>=0)
                {
                    store.set("totalSpam", Number(store.get("totalSpam")) + 1);
                    $(msg[0]).remove();
                    return;
                }
            }
        }

        if(GM_getValue('remove-duplicate-messages',true))
        {
            // Make sure the hash list exists
            if('undefined' === typeof r.robin['msgHashes'])
            {
                r.robin.msgHashes = {};
                r.robin.MD5 = new Hashes.MD5;
            }
            // Hash the message.
            hash = r.robin.MD5.hex(msgText);

            // Does the message match our existing hash list?
            matched = 'undefined' !== typeof r.robin.msgHashes[hash];

            // Add it to the list or update the timestamp
            r.robin.msgHashes[hash] = Math.floor(Date.now()/1000);

            if(matched)
            {
                // Delete it
                store.set("totalSpam", Number(store.get("totalSpam")) + 1);
                $(msg[0]).remove();
                return;
            }
        }

        // Linkify the messages going by
        $(msg[0]).children('.robin-message--message').linkify();

        if(GM_getValue('highlights',true))
        {
            if(!!Notification || Notification.permission === "granted")
            {
                if(msgText.toLowerCase().indexOf(r.config.logged.toLowerCase())!=-1)
                {
                    $(msg[0]).css('background-color','#ffffdd');
                    var n = new Notification('Robin Chat',{
                        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAABGdBTUEAALGPC/xhBQAABJdJREFUaAXtWW1oHEUYnnfvcrvXuyRUW6LU1h9+FcQPLJo7S9v8EDFik2vCIbV+BIrBP4IIFsUip7Sg9Y+aojYt+KNihUhio1IqFmswTVNQS2mFiggi/gh+FNI2t7O3O6/vXlk50+3t7F4+tjgLyczuPDPv+zzvzOy7c4ypSymgFFAKKAWUAkoBpYBSQCmgFFAKKAWUAv8/BeBqoYz9/U3mqamnGLInGOBtwCBDvv9Gf99oCPtSk59+J8PlqiCM+eI1JlqHGOJ9fqSIBDIGg/pdbc/C4GDFD+M9iz1hRAQz3/01UdrgOX3lEsaA4ffEvqwBO5MyMofh6IE/a/HJ2ps41q1892NyZF3vcT2RXV+tMXBMPvMm1V9y770r9oSJwDbP2aCS1rVgwM6SQF8wSO1JTwz9PLtPrAlXcj1rbbTvnO20/z1M6OnUg3B06IJ/+6WnsSYsmLO1nvNeGwDjLKn1BZF18ZrXKW4lbuxfQtO5KOMX7bw7jG9HfpLBxjbC5h9TtFlhNogERXdYPz66IwjntceOMHZuaeHnzr9OZJ+hCAdehFkZCKoBxOo9zPOFgkCxm3bZFTU+1q26SYee1ltk1q87UCwijOt6rucVZ0AI0VuXnU8jRRhsy76DmiZ8mi97tKiblptFlXNdT3PL+ZHqocl6bARim1cPKhctwmZ77y2UMu51syikf41clE62yPZfcMLYUUpa/OQLiJVXiKch62g9HAKbqdde27aghK32whpe/mEfRfTuWicarWtM+112jAUhTJ93aS6sVwXg87RWE7LOyeKSjvGLNFYWGBVXyW/awJFTVNnNDS5VXxfog+EkTB6Y8m30eThvEa4mEH9f2OUIp999dfjYnpNHCPB5mIHmhbCZ3/SIee78++SIdAIRxmkPCwAOS4gPvXuZck4J47rictPib6NwNssYnwPMB8b46Nkw48wZYZ7rfpTI7ibjy8I4EBVL0S3rkCqF7d8wYewoXsfL1nuU7RTCGm8Q/zJMDEm/jjxbDW0mdN70JBF9C5Et9QZciJJ25k+MyYNS38qz/YkUYezouYGbzh5H4MOzB5zve5rKR/Slqx6Paif0x0M5X9jKy85pSiAWg+yovrytCw4N8KiEpaf0pajae2n6PhTVWNR+7mkkpaNvGJ33bIdSSUQdx+0nRbicK/SBu1YZtjZiLFpfGEsmtBebjo1Ife8G2ahLGNs3t3GYoajiRncgAk9TZjNAta8AoQk0kaU1lRWCZSkIWUQtQ8IsIah7ANdM+JUIeBOllKuCHKltp3Mqm2x8piUSu1Ljw8dr2xqtX5Ewby/0CibcbGlZ9RiUwbt6RtsJR0b+CmsUHyi22het222Gq0moW2mmrCDD11Z3dyJHU3aaBJrWGJ4RCTZuZFpPwJf7L4a1I4O/jDCu7Wq2HHiHXjd9bupGgP0pLVGCY8O/ygwYd8x/CFv399wrHPtjBnAjqf8RaKnXDJ+fK+JOqp5//76HzXzhOSK7k04PhiCpdaYlD7brDR7HtiphnuvajiiadR1Ww9hB90dmdSkFlAJKAaWAUkApoBRQCigFQirwD/s1iSsutDEJAAAAAElFTkSuQmCC',
                        body: user + ': ' + msgText,
                    });
                }
            }
        }
    });
}

function addSetting(name,description,initialValue)
{
    currentValue = GM_getValue(name,initialValue);

    $("#robinDesktopNotifier").append("<label><input type='checkbox' name='robin-" + name + "' " + (currentValue?"checked":"") + ">" + description + "</input></label>");
    $("input[name='robin-" + name + "']").on("change",function() {
        GM_setValue(name,$(this).is(":checked"));
    });
}

// Quit stay-ed groups so we can rejoin
function quitStayChat()
{
    // Check back in 60 seconds
    setInterval(quitStayChat, 60 * 1000);

    if(!GM_getValue("auto-quit-stay",true))
    {
        return;
    }

    if($("#robinQuitWidget").css("display") != "none"){
        $("button.robin-chat--quit").click();
    }
}

function listenForSubmit() {
    var $messageBox = $("#robinSendMessage > input[type='text']");

    $messageBox.on( "keypress", function(e) {
        if (e.which !== 13) return;

        var message = $messageBox.val();
        if (GM_getValue("fast-clear",true) && message === "/clear") {
            e.preventDefault();
            $messageBox.val('');
            $("#robinChatMessageList").empty();
        }
    });
}

(function(){

    console.info("[Robin-Autovoter] Initialising...");

    if (!store.enabled) {
        console.warn("[Robin-Autovoter] LocalStorage features not supported!");
    }

    // The first thing we do is make sure everything's alright
    // Reload page on 503
    if(document.querySelectorAll("img[src='//www.redditstatic.com/trouble-afoot.jpg']").length > 0) window.location.reload();

    // Rejoin room on fail
    if(document.querySelectorAll("button.robin-home--thebutton").length > 0){
        $("#joinRobinContainer").click();
        setTimeout(function(){ $("button.robin-home--thebutton").click(); }, 1000);
    }

    // Quit stay-ed chats
    setInterval(quitStayChat, 60 * 1000);

    // The second thing we do is setup a timer to reload the page.
    //   If the above two lines don't save us, at least we'll reload before
    //   the timer's up
    // 16 minutes after we join (halfway to max): reload the page
    setTimeout(function(){
        window.location.reload();
    }, 16 * 60 * 1000);

    // Insert the statistics widget
    if($('#robinStatusWidget').length === 0)
    {
        // TODO: This needs some stylesheet love
        $("#robinDesktopNotifier").after(
            // Statistics Widget
            "<div id='robinStatusWidget' class='robin-chat--sidebar-widget'>" +
            "<table style='font-size: 14px;'>" +
            "<tr>" +
            "<td style='padding-right: 3px;'>Total</td>" +
            "<td id='totalUsers'></td>" +
            "<td></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='robin--vote-class--increase'><span class='robin--icon'></span></td>" +
            "<td id='increaseVotes'></td>" +
            "<td id='increasePct'></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='robin--vote-class--continue'><span class='robin--icon'></span></td>" +
            "<td id='continueVotes'></td>" +
            "<td id='continuePct'></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='robin--vote-class--abandon'><span class='robin--icon'></span></td>" +
            "<td id='abandonVotes'></td>" +
            "<td id='abandonPct'></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='robin--vote-class--novote'><span class='robin--icon'></span></td>" +
            "<td id='abstainVotes'></td>" +
            "<td id='abstainPct'></td>" +
            "</tr>" +
            "</table>" +
            "</div>" +
            // Reap timer widget
            "<div id='robinTimerWidget' class='robin-chat--sidebar-widget'>" +
            "<span style='font-size: 14px'>" +
            "<span id='reapTimerTime'>??</span>" +
            " until room is reaped" +
            "</span>" +
            "</div>" +
            // Total spam messages widget
            "<div id='robinSpamWidget' class='robin-chat--sidebar-widget'>" +
            "<span style='font-size: 14px'>" +
            "<span id='blockedSpamTotal'>??</span>" +
            " spam messages blocked" +
            "</span>" +
            "</div>");
    }
    
    // Add in custom CSS sheet for some fixes to RES nightmode and readability of username
    var customStyling = document.createElement('style');
    customStyling.setAttribute("id", "Robin-Autovoter-CSS");
    document.body.appendChild(customStyling);

    $("#Robin-Autovoter-CSS").append(".res-nightmode .robin-chat .robin-message {color: #CECECE;}");
    $("#Robin-Autovoter-CSS").append(".res-nightmode .robin-chat .robin-chat--sidebar {background-color: #262626;}");
    $("#Robin-Autovoter-CSS").append(".res-nightmode .robin-chat .robin--user-class--self .robin--username { color: #D6D6D6; border: 2px solid white}");
    $("#Robin-Autovoter-CSS").append(".robin-chat .robin--user-class--self .robin--username { color: black; border: 2px solid black}");

    // Add configuration options to the sidebar
    addSetting("highlights","Highlight mentions",true);
    addSetting("stat-tracking","Report Tracking Statistics",true);
    addSetting("remove-spam","Remove Generic Spam",true);
    addSetting("remove-duplicate-messages","Remove Duplicate Messages",true);
    addSetting("auto-quit-stay", "Auto-Quit Chat When Majority Stays", true);
    addSetting("auto-stay-big", "Stay When Room Size > 4000", true);
    addSetting("fast-clear", "/clear without animation", true);

    // monitor message sending
    listenForSubmit();

    // With the statistics widget in place, populate it initially from local values
    updateStatistics(r.config);

    // Keep track of the room reap time
    setInterval(updateReapTimer,1000);

    // Keep track of total spam blocked
    setInterval(updateSpamTotal,3000);

    // Change document title to something a little more informative
    updateTitle();

    // 5 Seconds after we join, vote
    setTimeout(function(){
        if(r.robin.stats.totalUsers > 4000 && GM_getValue("auto-stay-big",true)){
            sendMessage("/vote stay");
            console.info("[Robin-Autovoter] voted STAY!");
        }else{
            sendMessage("/vote grow");
            console.info("[Robin-Autovoter] voted GROW!");
        }
    }, 5 * 1000);

    // 60 Seconds after we load, trigger the statistics loop
    setInterval(generateStatisticsQuery, 60 * 1000);

    // Every 2 minutes, clear out the spam filter
    setInterval(cleanSpamFilter, 2 * 60 * 1000);

    // Create a hook for !commands
    var observer = new MutationObserver(newMessageHandler);
    $('#robinChatMessageList').each(function() {
        observer.observe(this,{childList: true});
        console.info("[Robin-Autovoter] Hooked into chat");
    });
})();
