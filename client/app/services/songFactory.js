angular.module('jam.songFactory', ['jam.usersFactory'])

.factory('Songs', ['$http', '$q', 'ngAudio', function (http, q, audio) {

  // HELPER FUNCTIONS

  var augmentSongs = function(songs) {
    return songs.reduce(function(augSongs, song) {
      song.sound = audio.load(song.address);
      augSongs = augSongs.concat([song]);
      return augSongs;
    }, []);
  };

  var soundsFromSongs = function(queue, location) {
    return queue[location].map(function(song) {
      return song.sound;
    });
  };

  // stores all songs and current playlist songs
  var songQueue = {songs: [], playlist: []};
  // index of the current song playing
  var soundIndex = null;
  var currentLocation = 'songs';
  var playing = false;
  var sounds;

  // FUNCTIONS FOR SONGS

  var addSong = function (song, groupId) {
    console.log('Song', song);
    var songData = {
      size: song.size,
      lastModified: song.lastModified,
      name: song.displayName || song.name,
      uniqueHash: song.uniqueFilename,
      address: song.s3url,
      duration: song.duration
    };

    return q(function(resolve, reject) {
      http({
        method: 'POST',
        url: '/api/groups/' + groupId + '/songs/',
        data: songData
      })
      .then(function(response) {
        resolve(response);
      })
      .catch(function (error) {
        reject(error);
      });
    });
  };

  var getAllSongs = function (groupId) {
    return http({
      method: 'GET',
      url: '/api/groups/' + groupId + '/songs/'
    })
    .then(function (res) {
      // this will return the ngAudio objects
      var enhancedSongs = augmentSongs(res.data);
      songQueue.songs = enhancedSongs;
      sounds = soundsFromSongs(songQueue, 'songs');
      return enhancedSongs;
    });
  };

  var deleteSong = function (song) {
    return http({
      method: 'DELETE',
      url: '/api/songs/' + song.id,
    })
    .then(function (res) {
      return res.data;
    });
  };

  var addComment = function (comment, songId) {
    return http({
      method: 'POST',
      url: '/api/songs/' + songId + '/comments/',
      data: comment
    })
    .then(function (res) {
      return res.data;
    });
  };

  var deleteComment = function (tag) {
    return http({
      method: 'DELETE',
      url: '/api/tags/' + tag.id,
    })
    .then(function (res) {
      return res.data;
    });
  };

  // FUNCTIONS FOR PLAYLISTS 

  var createPlaylist = function (playlist) {
    // takes an object with a title and optional description
    return http({
      method: 'POST',
      url: '/api/playlists/',
      data: playlist
    })
    .then(function (res) {
      return res.data;
    });
  };

  var addSongToPlaylist = function (songId, plId) {
    // takes a playlist id and a song obj
    return http({
      method: 'POST',
      url: '/api/playlists/' + songId + '/' + plId + '/'
    })
    .then(function (res) {
      return res.data;
    });
  };

  var getPlaylistSongs = function (id) {
    return http({
      method: 'GET',
      url: '/api/playlists/' + id + '/'
    })
    .then(function (res) {
      var enhancedSongs = augmentSongs(res.data);
      songQueue.playlist = enhancedSongs;
      sounds = soundsFromSongs(songQueue, 'playlist');
      return enhancedSongs;
    });
  };

  var deleteFromPlaylist = function (sId, plId) {
    // Takes a playlist object with the song removed
    console.log('ID to delete: ', plId, sId);
    return http({
      method: 'DELETE',
      url: '/api/playlists/' + sId + '/' + plId + '/',
    })
    .then(function (res) {
      return res.data;
    });
  };

  var deletePlaylist = function (id) {
    return http({
      method: 'DELETE',
      url: '/api/playlists/' + id + '/' 
    })
    .then(function (res) {
      return res.data;
    });
  };

  // FUNCTIONS FOR PLAYBACK

  // use the observer pattern to watch for changes in the queue or song
  var observerCallbacks = [];

  //register an observer
  var registerObserverCallback = function(callback) {
    observerCallbacks.push(callback);
  };

  //call this when something chages
  var notifyObservers = function() {
    angular.forEach(observerCallbacks, function(callback) {
      callback();
    });
  };

  var getSoundsAndIndex = function () {
    return {
      sounds: sounds,
      index: soundIndex
    };
  };

  var nextIndex = function() {
    if (soundIndex < sounds.length - 1) {
      soundIndex++;
    } 
    notifyObservers();
  };

  var choose = function(index, location) {
    if (soundIndex === +index && currentLocation === location) {
      playing = true;
    } else {
      playing = !playing;
      soundIndex = index;
      if (location !== currentLocation) {
        currentLocation = location;
        sounds = soundsFromSongs(songQueue, location);
      } 
      notifyObservers();
    }
  };

  return {
    addComment: addComment,
    addSong: addSong,
    deleteComment: deleteComment,
    deleteSong: deleteSong,
    getAllSongs: getAllSongs,
    createPlaylist: createPlaylist,
    addSongToPlaylist: addSongToPlaylist,
    getPlaylistSongs: getPlaylistSongs,
    deleteFromPlaylist: deleteFromPlaylist,
    deletePlaylist: deletePlaylist,
    getSoundsAndIndex: getSoundsAndIndex,
    nextIndex: nextIndex,
    choose: choose,
    registerObserverCallback: registerObserverCallback
  };
}]);