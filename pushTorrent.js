#!/usr/bin/env nodejs

var WebSocket = require('ws');
var request = require('request');
var fs = require('fs');
var zlib = require('zlib');
var tough = require('tough-cookie');
var FileCookieStore = require('tough-cookie-filestore');
var j = request.jar(new FileCookieStore('cookies.json'));
request = request.defaults({ jar : j });

// set by user in ./configure
var apikey = !APIKEY!;
var saveDirectory = '!DIRECTORY!';

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
			var name = nameRegex.exec(element.url)[0];
			console.log("Download: " + element.url);
			var torrentOptions = {
				url: element.url,
				// prevents troubles
				encoding: null
			};
			// downloads and decompresses if needed
			function torrentDownloadCallback(error, response, body) {
				if (response.headers['content-encoding'] == 'gzip') {
					zlib.gunzip(body, function (error, uncompressed) {
						fs.writeFile(saveDirectory + name, uncompressed);
					});
				} else {
					fs.writeFile(saveDirectory + name, body);
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
