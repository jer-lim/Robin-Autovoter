// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      2.01
// @description  Autovotes via text on /r/robin
// @author       /u/keythkatz and /u/GuitarShirt
// @match        https://www.reddit.com/robin*
// @grant        none
// ==/UserScript==
/* jshint -W097 */

function sendMessage(message){
    $("#robinSendMessage > input[type='text']").val(message);
    $("#robinSendMessage > input[type='submit']").click();
}

function generateStatistics(sendToChannel = true)
{
    var participantLen = $(".robin-room-participant").length;
    var participantTxt = "";
    // Adjust the participant count we display if the count is over the max displayed in the DOM
    if (participantLen == 200)
    {
        participantTxt = 200 + " " + $(".robin-user-list-overflow-indicator").text();
    }
    else
    {
        participantTxt = participantLen;
    }

    // FIXME: This math will be incorrect after 200 users. We'll need to loop through roomParticipants
    var novoteLen = $(".robin-room-participant.robin--vote-class--novote").length;
    var increaseLen = $(".robin-room-participant.robin--vote-class--increase").length;
    var abandonLen = $(".robin-room-participant.robin--vote-class--abandon").length;
    var continueLen = $(".robin-room-participant.robin--vote-class--continue").length;

    var novotePct = (100 * novoteLen / participantLen).toFixed(2);
    var increasePct = (100 * increaseLen / participantLen).toFixed(2);
    var abandonPct = (100 * abandonLen / participantLen).toFixed(2);
    var continuePct = (100 * continueLen / participantLen).toFixed(2);

    // Send our beautiful message
    if(!sendToChannel)
    {
        sendMessage("[CHANNEL STATS] " + participantTxt + " USERS | " + increasePct + "% GROW | " + continuePct + "% STAY | " + abandonPct + "% ABANDON | " + novotePct + "% ABSTAIN");
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
        "<td>" + participantTxt + "</td>" +
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
        "<td>" + novotePct + "</td>" +
        "</tr>" +
        "</table>"
    );

    // Recurse every 60 seconds
    setTimeout(generateStatistics, 60 * 1000);
}

(function(){
    // Immediately trigger the statistics loop.
    generateStatistics(false);

    // 5 Seconds after we join, vote
    setTimeout(sendMessage("/vote grow"), 5 * 1000);

    // 5 Minutes after we join: reload the page
    setTimeout(function(){
        window.location.reload();
    }, 5 * 60 * 1000);
})();
