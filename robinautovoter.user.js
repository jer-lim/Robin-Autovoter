// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      1.25
// @description  Autovotes via text on /r/robin
// @author       /u/GuitarShirt and /u/keythkatz
// @match        https://www.reddit.com/robin*
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/jQuery-linkify/1.1.7/jquery.linkify.js
// ==/UserScript==
/* jshint esnext: true */

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
    // Setup the recursion at the top so we can just return
    //   at failtime.
    setTimeout(generateStatisticsQuery, 60 * 1000);

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
    setTimeout(updateReapTimer,1000);

    $('#reapTimerTime').html(getTimeUntilReap());
}

function handleBangCommands(user,msg)
{
    if('!' != msgText[0])
    {
        return;
    }

    // We're specifically prefixing with [ here so that spamblockers will block this
    if('!timer' == msgText)
    {
        sendMessage("[REAP TIMER] " + getTimeUntilReap() + " until reap");
    }
    else if('!stats' == msgText)
    {
        sendMessage("[CHANNEL STATS] " + r.robin.stats.totalUsers + " USERS | " + r.robin.stats.increasePct + "% GROW | " + r.robin.stats.continuePct + "% STAY | " + r.robin.stats.abandonPct + "% ABANDON | " + r.robin.stats.abstainPct + "% ABSTAIN");
    }
    else if('!help' == msgText)
    {
        sendMessage("[HELP] !timer !stats https://goo.gl/6jfAk0");
    }
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
        user = $(msg[0]).children('.robin-message--username').text();
        msgText = $(msg[0]).children('.robin-message--message').text();

        // Linkify the messages going by
        $(msg[0]).children('.robin-message--message').linkify();

        if(GM_getValue("bang-commands",false))
        {
            handleBangCommands(user,msgText);
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
function quitStayChat(){
    
    if(!GM_getValue("auto-quit-stay",true))
    {
        return;
    }
    
    if($("#robinQuitWidget").css("display") != "none"){
        $("button.robin-chat--quit").click();
    }
}

(function(){

    // The first thing we do is make sure everything's alright
    // Reload page on 503
    if(document.querySelectorAll("img[src='//www.redditstatic.com/trouble-afoot.jpg']").length > 0) window.location.reload();

    // Rejoin room on fail
    if(document.querySelectorAll("button.robin-home--thebutton").length > 0){
        $("#joinRobinContainer").click();
        setTimeout(function(){ $("button.robin-home--thebutton").click(); }, 1000);
    }
    
    // Quit stay-ed chats
    setInterval(quitStayChat(), 60 * 1000);

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
            "</div>");
    }

    // Add configuration options to the sidebar
    addSetting("stat-tracking","Report Tracking Statistics",true);
    addSetting("bang-commands","Respond to !triggers in chat",false);
    addSetting("auto-quit-stay", "Auto-quit chats when majority chooses stay", true);
    addSetting("auto-stay-big", "Stay when room size > 4000", true);

    // With the statistics widget in place, populate it initially from local values
    updateStatistics(r.config);

    // Keep track of the room reap time
    updateReapTimer();

    // 5 Seconds after we join, vote
    setTimeout(function(){
        if(r.robin.stats.totalUsers > 4000 && GM_getValue("auto-quit-stay",true)){
            sendMessage("/vote stay");
        }else{
            sendMessage("/vote grow");
        }
    }, 5 * 1000);

    // 60 Seconds after we load, trigger the statistics loop
    setTimeout(generateStatisticsQuery, 60 * 1000);

    // Create a hook for !commands
    var observer = new MutationObserver(newMessageHandler);
    $('#robinChatMessageList').each(function() {
        observer.observe(this,{childList: true});
    });
})();
