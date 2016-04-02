// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      1.16
// @description  Autovotes via text on /r/robin
// @author       /u/GuitarShirt and /u/keythkatz
// @match        https://www.reddit.com/robin*
// @grant        none
// ==/UserScript==
/* jshint esnext: true */

function sendMessage(message){
    $("#robinSendMessage > input[type='text']").val(message);
    $("#robinSendMessage > input[type='submit']").click();
}

function updateStatistics(config)
{
    // Take over r.stats for this
    if('undefined' === typeof r['stats'])
    {
        r.stats = {};
    }

    // Update the userlist
    if('undefined' !== typeof config['robin_user_list'])
    {
        var robinUserList = config.robin_user_list;
        r.stats.totalUsers = robinUserList.length;
        r.stats.increaseVotes = robinUserList.filter(function(voter){return voter.vote === "INCREASE";}).length;
        r.stats.abandonVotes = robinUserList.filter(function(voter){return voter.vote === "ABANDON";}).length;
        r.stats.abstainVotes = robinUserList.filter(function(voter){return voter.vote === "NOVOTE";}).length;
        r.stats.continueVotes = robinUserList.filter(function(voter){return voter.vote === "CONTINUE";}).length;
        r.stats.abstainPct = (100 * r.stats.abstainVotes / r.stats.totalUsers).toFixed(2);
        r.stats.increasePct = (100 * r.stats.increaseVotes / r.stats.totalUsers).toFixed(2);
        r.stats.abandonPct = (100 * r.stats.abandonVotes / r.stats.totalUsers).toFixed(2);
        r.stats.continuePct = (100 * r.stats.continueVotes / r.stats.totalUsers).toFixed(2);

        // Update the div with that data
        $('#totalUsers').html(r.stats.totalUsers);

        $('#increaseVotes').html(r.stats.increaseVotes);
        $('#continueVotes').html(r.stats.continueVotes);
        $('#abandonVotes').html(r.stats.abandonVotes);
        $('#abstainVotes').html(r.stats.abstainVotes);

        $('#increasePct').html("(" + r.stats.increasePct + "%)");
        $('#continuePct').html("(" + r.stats.continuePct + "%)");
        $('#abandonPct').html("(" + r.stats.abandonPct + "%)");
        $('#abstainPct').html("(" + r.stats.abstainPct + "%)");
    }
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

function newMessageHandler(records)
{
    records.forEach(function(record) {
        var msg = $(record.addedNodes);
        if(0 === msg.length)
        {
            return;
        }

        msgText = $(msg[0].children[2]).text();
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
            sendMessage("[CHANNEL STATS] " + r.stats.totalUsers + " USERS | " + r.stats.increasePct + "% GROW | " + r.stats.continuePct + "% STAY | " + r.stats.abandonPct + "% ABANDON | " + r.stats.abstainPct + "% ABSTAIN");
        }
        else if('!help' == msgText)
        {
            sendMessage("[HELP] !timer !stats https://goo.gl/1ScVnC");
        }
    });
}

// Reload page on 503
if(document.querySelectorAll("img[src='//www.redditstatic.com/trouble-afoot.jpg']").length > 0) window.location.reload();

// Rejoin room on fail
if(document.querySelectorAll("button.robin-home--thebutton").length > 0){
    $("#joinRobinContainer").click();
    setTimeout(function(){ $("button.robin-home--thebutton").click(); }, 1000);
}

(function(){
    // The first thing we do is setup a timer to reload the page.
    //   Hopefully this will save us if the CDN dies again >.>
    // 20 Minutes after we join (halfway to max): reload the page
    setTimeout(function(){
        window.location.reload();
    }, 20 * 60 * 1000);

    // Insert the statistics widget
    if($('#robinStatusWidget').length === 0)
    {
        // TODO: This needs some stylesheet love
        $("#robinDesktopNotifier").after(
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
            "<div id='robinTimerWidget' class='robin-chat--sidebar-widget'>" +
            "<span style='font-size: 14px'>" +
            "<span id='reapTimerTime'>??</span>" +
            " until Room Reap" +
            "</span>" +
            "</div>");
    }

    // With the statistics widget in place, populate it initially from local values
    updateStatistics(r.config);

    // Keep track of the room reap time
    updateReapTimer();

    // 5 Seconds after we join, vote
    setTimeout(sendMessage("/vote grow"), 5 * 1000);

    // 60 Seconds after we load, trigger the statistics loop
    setTimeout(generateStatisticsQuery, 60 * 1000);

    // Create a hook for !commands
    if(false)
    {
        var observer = new MutationObserver(newMessageHandler);
        $('#robinChatMessageList').each(function() {
            observer.observe(this,{childList: true});
        });
    }
})();
