// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      1.5
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
    sendMessage("/vote grow");
    if(Math.random() < 0.2) sendMessage("[Robin Autovoter 1.5] Autovoted grow! https://www.reddit.com/r/joinrobin/comments/4cx02w/better_working_automatic_grow_script/");
    setTimeout(function(){sendMessage("[Robin Autovoter 1.5] " + $("span:contains('Voting will end')").text());}, 5000);
    setTimeout(function(){
        window.location.reload();
    }, 300000);
}, 5000);
