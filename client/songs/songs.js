angular.module('jam.songs', [])

.controller('SongsController', function ($scope, Songs) {
  // When user adds a new link, put it in the collection
  $scope.data = {};
  Songs.getAllSongs()
  .then(function (res) {
    $scope.data.songs = res;
  })
  .catch(function (error) {
    console.error(error);
  });
});