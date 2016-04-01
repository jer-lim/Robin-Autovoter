// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      2.01
// @description  Autovotes via text on /r/robin
// @author       /u/keythkatz
// @match        https://www.reddit.com/robin*
// @grant        none
// ==/UserScript==
/* jshint -W097 */

function sendMessage(message){
    $("#robinSendMessage > input[type='text']").val(message);
    $("#robinSendMessage > input[type='submit']").click();
}

function sendStatistics()
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
    sendMessage("[CHANNEL STATS] " + participantTxt + " USERS | " + increasePct + "% GROW | " + continuePct + "% STAY | " + abandonPct + "% ABANDON | " + novotePct + "% ABSTAIN");

    // Recurse every 60 seconds
    setTimeout(sendStatistics, 60 * 1000);
}

(function(){
    // 5 Seconds after we join, vote
    setTimeout(sendMessage("/vote grow"), 5 * 1000);

    // 15 Seconds after we join: trigger the channel statistics loop
    setTimeout(sendStatistics, 15 * 1000);

    // 5 Minutes after we join: reload the page
    setTimeout(function(){
        window.location.reload();
    }, 5 * 60 * 1000);
})();
