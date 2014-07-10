var _ = require('underscore');

module.exports = function(pm) {
  var playlistsByName = {};
  var playlistsById = {};

  var ret = {};
  ret.init = function(songs, rawPlaylists, playlistEntries) {
    var songsById = _.groupBy(songs, 'id');

    _.each(rawPlaylists, function(playlist) {
      var name = playlist.name.trim().toLowerCase();

      playlistsByName[name] = [];
      playlistsById[playlist.id] = playlistsByName[name];
    });

    _.each(playlistEntries, function(entry) {
      if (songsById[entry.trackId] && playlistsById[entry.playlistId]) {
        var song = songsById[entry.trackId][0];
        song.absolutePosition = entry.absolutePosition;
        playlistsById[entry.playlistId].push(song);
      }
    });

    _.each(playlistsByName, function(playlist, name) {
      playlistsByName[name] = _.sortBy(playlist, 'absolutePosition');
    });
  };

  ret.playlistByName = function(name) {
    return playlistsByName[name.trim().toLowerCase()];
  };

  return ret;
};