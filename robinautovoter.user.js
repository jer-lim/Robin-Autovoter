// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      1.9
// @description  Autovotes via text on /r/robin
// @author       /u/keythkatz
// @match        https://www.reddit.com/robin*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

function sendMessage(message){
    $("#robinSendMessage > input[type='text']").val(message);
    $("#robinSendMessage > input[type='submit']").click();
}

setTimeout(function(){
    var participants = $(".robin-room-participant").length;
    var partiText = "";
    if (participants == 200) partiText = 200 + " " + $(".robin-user-list-overflow-indicator").text();
    else partiText = participants;
    
    sendMessage("/vote grow");
    if(Math.random() < 0.2) sendMessage("[Robin Autovoter 1.9] Autovoted grow! https://www.reddit.com/r/joinrobin/comments/4cx02w/better_working_automatic_grow_script/");
    setTimeout(function(){sendMessage("[Robin Autovoter 1.9] " + partiText + " in this room! " + $("span:contains('Voting will end')").first().text());}, 10000);
    setTimeout(function(){
        window.location.reload();
    }, 300000);
}, 5000);
