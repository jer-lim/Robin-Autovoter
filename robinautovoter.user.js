// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      1.10
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
    //var participants = $(".robin-room-participant").length;
    //var partiText = "";
    //if (participants == 200) partiText = 200 + " " + $(".robin-user-list-overflow-indicator").text();
    //else partiText = participants;
    
    var timeRemText = "] " + $("span:contains('Voting will end')").first().text()";
    
    sendMessage("/vote grow");
    //if(Math.random() < 0.2) sendMessage("[Robin Autovoter 1.10] Autovoted grow! https://www.reddit.com/r/joinrobin/comments/4cx02w/better_working_automatic_grow_script/");
    if(!$("span:contains('" + timeRemText + "'")){
        setTimeout(function(){sendMessage("[Robin Autovoter 1.10] " + $("span:contains('Voting will end')").first().text() + "redd.it/4cx02w");}, 10000);
    }
    setTimeout(function(){
        window.location.reload();
    }, 1200000);
}, 5000);
