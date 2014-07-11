var _ = require('underscore');
var PlayMusic = require('playmusic');
var DSON = require('dogeon');
var fs = require('fs');
var repl = require('repl');
var O = require('orchestrator');
var eventcast = require('eventcast');
var commander = require('commander');
var orchestrator = new O();

var pm = new PlayMusic();

var config = DSON.parse(fs.readFileSync('./config.dson').toString());
var ev = eventcast({
  port: 9001,
  multicastLoopback: true,
  multicastInterface: '127.0.0.1',
  encrypt: {
    key: config.key
  }
});

commander.
  option('-e, --exec <command>', 'Execute command directly (without REPL)', String).
  parse(process.argv);

if (commander.exec) {
  ev.start(function() {
    ev.emit('exec', commander.exec);
    // ev.emit is secretly asynchronous, so give it some time to finish
    setTimeout(function() {
      process.exit(0);
    }, 1000);
  });
} else {
  pm.init(config, function() {
    var library;
    var playlists;
    var playlistEntries;

    orchestrator.add('startEv', function(callback) {
      ev.start(callback);
    });

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

    orchestrator.start('getLibrary', 'getPlaylists', 'getPlaylistEntries', 'startEv', function(err) {
      var dookie = require('./lib')(pm);
      dookie.init(
        library.data.items,
        playlists.data.items,
        playlistEntries.data.items);

      console.log("Welcome to Dookie!");
      var replServer = repl.start({
        prompt: '> '
      });

      _.extend(replServer.context, dookie.clientApi);

      var vm = require('vm');
      ev.on('exec', function(command) {
        console.log("\nExecuting remote command: '" + command + "'\n");
        vm.runInContext(command, replServer.context);
      });
    });
  });
}
