// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      1.13
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
if(document.querySelectorAll("img[src='//www.redditstatic.com/trouble-afoot.jpg']").length > 0) window.location.reload();
if(document.querySelectorAll("button.robin-home--thebutton").length > 0) $("button.robin-home--thebutton").click();

setTimeout(function(){
    //var participants = $(".robin-room-participant").length;
    //var partiText = "";
    //if (participants == 200) partiText = 200 + " " + $(".robin-user-list-overflow-indicator").text();
    //else partiText = participants;
    
    var timeRemText = "] " + $("span:contains('Voting will end')").first().text();
    
    sendMessage("/vote grow");
    //if(Math.random() < 0.2) sendMessage("[Robin Autovoter 1.10] Autovoted grow! https://www.reddit.com/r/joinrobin/comments/4cx02w/better_working_automatic_grow_script/");
    
    setTimeout(function(){
        if($("span:contains('" + timeRemText + "')")[0] == undefined){
            sendMessage("[Robin Autovoter 1.13] " + $("span:contains('Voting will end')").first().text() + " redd.it/4cx02w");
        }
    }, 10000);
    setTimeout(function(){
        window.location.reload();
    }, 1200000);
}, 5000);
