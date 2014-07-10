var _ = require('underscore');
var request = require('request');
var m = require('mustache');
var lame = require('lame');
var Speaker = require('speaker');
var playlists = require('./playlist.js')();

module.exports = function(pm) {
  var ret = {};

  var songsByTitle = {};
  var songsByArtist = {};
  var songsByAlbum = {};

  var readStream;
  var speaker;
  var decoder;
  var stopped = false;

  var rawSongs;

  ret.init = function(songs, rawPlaylists, playlistEntries) {
    rawSongs = songs;

    _.each(songs, function(song) {
      var title = song.title.trim().toLowerCase();
      var artist = song.artist.trim().toLowerCase();
      var album = song.album.trim().toLowerCase();

      (songsByTitle[title] = songsByTitle[title] || []).push(song);
      (songsByArtist[artist] = songsByArtist[artist] || []).push(song);
      (songsByAlbum[album] = songsByAlbum[album] || []).push(song);
    });

    _.each(songsByAlbum, function(album, albumName) {
      songsByAlbum[albumName] = _.sortBy(album, 'trackNumber');
    });

    playlists.init(songs, rawPlaylists, playlistEntries);
  };

  ret.play = function(song, callback) {
    ret.clientApi.stop();
    stopped = false;

    decoder = new lame.Decoder();

    var template = '----------\n"{{title}}"\n{{artist}}\n"{{album}}"\n--------';
    console.log(m.render(template, song));
    pm.getStreamUrl(song.id, function(streamUrl) {
      readStream = request(streamUrl);
      var done = false;

      readStream.
        on('error', function() {
          this.end();
          if (speaker) {
            speaker.end();
          }
          if (!done) {
            done = true;
            callback();
          }
        }).
        pipe(decoder).
          on('format', function(format) {
            speaker = new Speaker(format);
            speaker.
              on('close', function() {
                if (!done) {
                  !stopped || console.log('Finished playing, next song...');
                  done = true;
                  callback();
                }
              }).
              on('error', function() {
                if (!done) {
                  done = true;
                  callback();
                }
              });

            this.pipe(speaker);
          });
    });
  };

  ret.clientApi = {};

  ret.clientApi.playArtist = function(artist) {
    var rawArtist = artist;
    artist = artist.trim().toLowerCase();
    stopped = false;
    var curSong = 0;

    var playNext = function() {
      ret.play(songsByArtist[artist][curSong], function() {
        if (++curSong >= songsByArtist[artist].length) {
          return;
        }

        if (!stopped) {
          playNext();
        }
      });
    };

    console.log(m.render("Playing {{num}} songs for {{artist}}",
      { num: (songsByArtist[artist] || []).length, artist: rawArtist }));
    if ((songsByArtist[artist] || []).length > 0) {
      playNext();
    }
  };

  ret.clientApi.playAlbum = function(album) {
    var rawAlbum = album;
    album = album.trim().toLowerCase();
    stopped = false;
    var curSong = 0;

    var playNext = function() {
      ret.play(songsByAlbum[album][curSong], function() {
        if (++curSong >= songsByAlbum[album].length) {
          return;
        }

        if (!stopped) {
          playNext();
        }
      });
    };

    console.log(m.render("Playing {{num}} songs for {{album}}",
      { num: (songsByAlbum[album] || []).length, album: rawAlbum }));
    if ((songsByAlbum[album] || []).length > 0) {
      playNext();
    }
  };

  ret.clientApi.playPlaylist = function(playlistName) {
    var list = playlists.playlistByName(playlistName);

    stopped = false;
    var curSong = 0;

    var playNext = function() {
      ret.play(list[curSong], function() {
        if (++curSong >= list.length) {
          return;
        }

        if (!stopped) {
          playNext();
        }
      });
    };

    console.log(m.render("Playing {{num}} songs for {{playlist}}",
      { num: (list || []).length, playlist: playlistName }));
    if ((list || []).length > 0) {
      playNext();
    }
  };

  ret.clientApi.playSong = function(songName) {
    songName = songName.trim().toLowerCase();
    var re = new RegExp('.*' + songName + '.*', 'ig');
    var song = _.find(rawSongs, function(song) {
      return re.test(song.title);
    });
    if (song) {
      return ret.play(song, function() {});
    }
    console.log(m.render('"{{songName}}" not found', { songName: songName }));
  };

  ret.clientApi.skip = function() {
    if (readStream) {
      readStream.end();
    }
    if (speaker) {
      speaker.end();
    }
  };

  ret.clientApi.stop = function() {
    stopped = true;

    if (readStream) {
      readStream.end();
    }
    if (speaker) {
      speaker.end();
    }
  };

  return ret;
};