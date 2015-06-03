#!/usr/bin/env nodejs

var WebSocket = require('ws');
var request = require('request');
var fs = require('fs');
var zlib = require('zlib');
var apikey = process.env.TOKEN;
console.log("using token: " + apikey);
var url = 'https://api.pushbullet.com/v2/pushes?modified_after=';
var timeStamp = 0;
var websocket = new WebSocket('wss://stream.pushbullet.com/websocket/' + apikey);
var torrentRegex = /(https?):\/\/.*\.torrent/;

// called when new pushes are available, downloads appropriate links
function requestCallback(error, response, body) {
	var chunk = JSON.parse(body);
	timeStamp = chunk.pushes[0].modified;
	updateUrl();
	chunk.pushes.forEach(function (element, index, array) {
		// link is for a torrent file
		if (element.type == 'link' && torrentRegex.test(element.url)) {
			var nameRegex = /[^\/]+\.torrent/
			var name = nameRegex.exec(element.url);
			console.log("Download: " + element.url);
			var torrentOptions = {
				url: element.url,
				encoding: null
			};
			// downloads and decompresses if needed
			function torrentDownloadCallback(error, response, body) {
				if (response.headers['content-encoding'] == 'gzip') {
					zlib.gunzip(body, function (error, uncompressed) {
						fs.writeFile(name, uncompressed);
					});
				} else {
					fs.writeFile(name, body);
				}
			}
			request(torrentOptions, torrentDownloadCallback);
		}
	});
}


// updates timeStamp with most recent from server
function setTimeStamp(error, response, body) {
	timeStamp = JSON.parse(body).pushes[0].modified;
	updateUrl();
}

// passed to request with apitoken for auth purposes
var requestOptions = {
	url : url + timeStamp,
	headers : {
		'Authorization' : 'Bearer ' + apikey
	}
};

// appends apikey to url in of requestOptions
function updateUrl() {
	requestOptions.url = url + timeStamp;
}

//sets first timestamp
request(requestOptions, setTimeStamp);


// runs requestCallback every push
websocket.onmessage = function(e) {
	var chunk = JSON.parse(e.data);
	if (chunk.type == 'tickle') {
		request(requestOptions, requestCallback);
	}
}
