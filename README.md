# PushTorrent
Automatically downloads *.torrent files from Pushbullet

#Requirements
- Node.JS
- npm
- ws
- config
- tough-cookie
- tough-cookie-filestore

#Configuration
```
$ ./configuration
```

#How to Install
```
$ sudo apt-get install nodejs npm
$ sudo npm install ws config tough-cookie tough-cookie-filestore
```

#Cookies
Cookies are used to download from websites that require authentication. Take a look at the provided [cookies.json](https://github.com/Stuart4/PushTorrent/blob/master/cookies.json) and use it to construct cookies for your desired websites.

#How to Download Other Things
Edit torrentRegex of [pushTorrent.js](https://github.com/Stuart4/PushTorrent/blob/master/pushTorrent.js).
