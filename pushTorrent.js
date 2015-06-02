#!/usr/bin/env nodejs

var WebSocket = require('ws');
var request = require('request');
var apikey = process.env.TOKEN;
console.log("using token: " + apikey);
var url = 'https://api.pushbullet.com/v2/pushes?modified_after=';
var timeStamp = 0;
var websocket = new WebSocket('wss://stream.pushbullet.com/websocket/' + apikey);

function requestCallback(error, response, body) {
	var chunk = JSON.parse(body);
	timeStamp = chunk.pushes[0].modified;
	updateUrl();
	chunk.pushes.forEach(function (element, index, array) {
		if (element.type == 'link') {
			console.log(element.url);
		}
	});
}

function setTimeStamp(error, response, body) {
	timeStamp = JSON.parse(body).pushes[0].modified;
	updateUrl();
}

var requestOptions = {
	url : url + timeStamp,
	headers : {
		'Authorization' : 'Bearer ' + apikey
	}
};

function updateUrl() {
	requestOptions.url = url + timeStamp;
}

request(requestOptions, setTimeStamp);

websocket.onmessage = function(e) {
	var chunk = JSON.parse(e.data);
	if (chunk.type == 'tickle') {
		request(requestOptions, requestCallback);
	}
}
