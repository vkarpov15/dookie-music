dookie
======

REPL and CLI for controlling Google Music playback.

Setup
=====

`npm install` should be sufficient. If you're having trouble, follow the troubleshooting guide for the [speaker](https://www.npmjs.org/package/speaker) npm module, that's most likely the issue.

Dookie looks for configuration in `config.dson`, which must be written in [Doge Serialized Object Notation](http://dogeon.org/?utm_content=buffer0fad5&utm_medium=social&utm_source=twitter.com&utm_campaign=buffer). Example:

```
such "email" is "user@gmail.com" next "password" is "my_password" next "key" is "Basket Case" wow
```

REPL
====

Running `node index.js` starts a server with a nice friendly REPL prompt. Try running `playSong('Basket Case')` to play the Green Day classic.

CLI
===

Run `node index.js --exec "playSong('Basket Case')"` to tell the server you started in the last section to replay "Basket Case"

API
===

`playArtist(artist)`: Play all songs for a given artist

`playAlbum(album)`: Play all songs for a given album

`playPlaylist(name)`: Play the playlist with the given name

`playSong(name)`: Play the first song that matches /.*name.*/ig

`skip()`: Skip to the next song

`stop()`: Stop playback

Disclaimer
==========

This module and the API it uses are not endorsed in any way by Google.

[Furthermore](http://en.wikipedia.org/wiki/Dookie#Track_listing), *coming clean*, this module is very rough and may not work for everyone. I'm *having a blast* working on it, but if you think I'm a *chump* and using this is like *pulling teeth*, open up an issue and I'll respond *when i come around* to it. *In the end*, I don't want to *burnout* and turn into a *basket case* maintaining this, so please be patient and take the *longview*.
