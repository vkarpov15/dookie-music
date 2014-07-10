var _ = require('underscore');
var PlayMusic = require('playmusic');
var DSON = require('dogeon');
var fs = require('fs');
var repl = require('repl');
var O = require('orchestrator');
var orchestrator = new O();

var pm = new PlayMusic();

pm.init(DSON.parse(fs.readFileSync('./config.dson').toString()), function() {
  var library;
  var playlists;
  var playlistEntries;

  orchestrator.add('getLibrary', function(callback) {
    pm.getLibrary(function(lib) {
      library = lib;
      callback();
    });
  });

  orchestrator.add('getPlaylists', function(callback) {
    pm.getPlayLists(function(pl) {
      playlists = pl;
      callback();
    });
  });

  orchestrator.add('getPlaylistEntries', function(callback) {
    pm.getPlayListEntries(function(pl) {
      playlistEntries = pl;
      callback();
    });
  });

  orchestrator.start('getLibrary', 'getPlaylists', 'getPlaylistEntries', function(err) {
    var dookie = require('./lib')(pm);
    dookie.init(
      library.data.items,
      playlists.data.items,
      playlistEntries.data.items);

    console.log("Welcome to Dookie!");
    var replServer = repl.start({
      prompt: "> "
    });

    _.extend(replServer.context, dookie.clientApi);
  });
});
