// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      2.03
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

function updateStatistics(totalUsers, increaseVotes, continueVotes, abandonVotes, abstainVotes)
{
    var abstainPct = (100 * abstainVotes / totalUsers).toFixed(2);
    var increasePct = (100 * increaseVotes / totalUsers).toFixed(2);
    var abandonPct = (100 * abandonVotes / totalUsers).toFixed(2);
    var continuePct = (100 * continueVotes / totalUsers).toFixed(2);

    // Send our beautiful message if there aren't many people in the room
    if(participantLen < 25)
    {
        sendMessage("[CHANNEL STATS] " + totalUsers + " USERS | " + increasePct + "% GROW | " + continuePct + "% STAY | " + abandonPct + "% ABANDON | " + abstainPct + "% ABSTAIN");
    }

    // Create a beautiful widget on the right
    if($('#robinStatusWidget').length === 0)
    {
        // Add the div we're about to update
        $("#robinDesktopNotifier").after("<div id='robinStatusWidget' class='robin-chat--sidebar-widget'></div>");
    }

    // Update the div with that data
    // TODO: This needs some stylesheet love
    $("#robinStatusWidget").html(
        "<table style='font-size: 14px;'>" +
        "<tr>" +
        "<td>Users</td>" +
        "<td>" + totalUsers + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td>Grow</td>" +
        "<td>" + increasePct + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td>Stay</td>" +
        "<td>" + continuePct + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td>Abandon</td>" +
        "<td>" + abandonPct + "</td>" +
        "</tr>" +
        "<tr>" +
        "<td>Abstain</td>" +
        "<td>" + abstainPct + "</td>" +
        "</tr>" +
        "</table>"
    );

    // Recurse every 60 seconds
    setTimeout(generateStatisticsQuery, 60 * 1000);
}

function generateStatisticsQuery()
{
    // Query for the userlist
    $.get("/robin",function(a){
        // There is a call to r.setup in the robin HTML. We're going to try to grab that.
        //   Wish us luck!
        // TODO: Grab the timestamp out of this to update a countdown timer
		var START_TOKEN = "<script type=\"text/javascript\" id=\"config\">r.setup(";
		var END_TOKEN = ")</script>";
        a = a.substring(a.indexOf(START_TOKEN)+START_TOKEN.length);
		a = a.substring(0,a.indexOf(END_TOKEN));
        var robinUserList = JSON.parse(a).robin_user_list;
        participantLen = robinUserList.length;
        increaseLen = robinUserList.filter(function(voter){return voter.vote === "INCREASE";}).length;
        abandonLen = robinUserList.filter(function(voter){return voter.vote === "ABANDON";}).length;
        novoteLen = robinUserList.filter(function(voter){return voter.vote === "NOVOTE";}).length;
        continueLen = robinUserList.filter(function(voter){return voter.vote === "CONTINUE";}).length;

        updateStatistics(participantLen, increaseLen, continueLen, abandonLen, novoteLen);
    });
}

(function(){
    // Immediately trigger the statistics loop.
    generateStatisticsQuery();

    // 5 Seconds after we join, vote
    setTimeout(sendMessage("/vote grow"), 5 * 1000);

    // 5 Minutes after we join: reload the page
    setTimeout(function(){
        window.location.reload();
    }, 5 * 60 * 1000);
})();
