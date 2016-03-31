angular.module('jam.song', [])

.controller('SongController', ['$scope', '$location', '$route', 'Songs', 'Users', function ($scope, loc, $route, Songs, Users) {
  $scope.song = {};
  $scope.audio = Songs.getPlayer();
  $scope.commentTime = null;
  $scope.pinningComment = false;
  $scope.user = {};
  $scope.comments = [];
  $scope.selectedComment = [{}];
  $scope.currentSongIsPlaying;
  $scope.playable = Songs.getPlayable();

  var pageWidth = document.getElementsByClassName('page-content')[0].offsetWidth;
  var waveHeight = 100;
  var waveWidth = pageWidth * 0.9;
  var waveRadius = 2;
  var pinWidth = 12;
  var pinHeight = 20;
  var barPadding = 1;
  var initialDelay = 2000;
  var scaledAmplitudes;
  $scope.width = waveWidth + 'px';
 
  // Obtain song information and display comments
  Users.getUserData()
  .then(function (user) {
    $scope.user = user;
  })
  .then(function() {
    return Songs.getSong(loc.path().split('/')[2]);
  })
  .then(function (song) {
    $scope.song = song;
    var rawAmplitudes = JSON.parse(song.amplitudeData).max;
    var max = _.max(rawAmplitudes);
    var scale = 100 / max;
    scaledAmplitudes = rawAmplitudes.map(function(amp) {
      return amp * scale;
    });
  })
  .then(function () {
    return Songs.getComments($scope.song.id);
  })
  .then(function (comments) {
    $scope.comments = comments;
    renderComments(comments);
    $scope.currentSongIsPlaying = $scope.song.compressedAddress === $scope.audio.src;
    initialRender();
  });

  var createSvg = function (parent, height, width) {
    return d3.select(parent).append('svg').attr('height', height).attr('width', width);
  };

  // D3
  var svg = createSvg('.waveform-container', waveHeight, waveWidth);

  var selectedComment = d3.select('body').selectAll('.selected-comment');
  var comment = d3.select('body').selectAll('.comment-icon');

  var commentPins = d3.select('body').selectAll('.pin-container')
                      .style('height', pinHeight + 'px')
                      .style('width', waveWidth + 'px');

  var initialRender = function() {
    svg.attr('class', 'visualizer')
      .selectAll('rect')
      .data(scaledAmplitudes)
      .enter()
      .append('rect')
      .attr('rx', waveRadius + 'px')
      .attr('ry', waveRadius + 'px')
      .attr('x', function (d, i) {
        return i * (waveWidth / scaledAmplitudes.length);
      })
      .attr('y', waveHeight)
      .attr('height', 0)
      .transition()
      .delay(function(d, i) {
        return initialDelay * i / scaledAmplitudes.length;
      })
      .attr('width', waveWidth / scaledAmplitudes.length - barPadding)
      .attr('y', function(d) {
        return waveHeight - d;
      })
      .attr('height', function(d) {
        return d;
      });

    d3.select('body').selectAll('.comment-pin-container')
      .style('height', pinHeight * 2 + 'px')
      .style('width', waveWidth + 'px');

    d3.select('body').selectAll('.selected-comment-container')
      .style('height', pinHeight + 'px')
      .style('width', waveWidth + 'px');

    _.delay(setInterval, initialDelay, renderFlow, 300);
  };

  $scope.addComment = function (comment) {
    var time = Math.floor($scope.commentTime * $scope.song.duration);
    Songs.addComment({note: comment, time: time, userId: $scope.user.id}, $scope.song.id)
    .then(function (comment) {
      $scope.comments.push(comment);
      renderComments($scope.comments);
      $scope.pinningComment = false;
      $scope.comment = '';
    });
  };

  $scope.commentSelected = function () {
    return !!Object.keys($scope.selectedComment[0]).length;
  };

  $scope.pinComment = function () {
    $scope.commentTime = $scope.audio.currentTime / $scope.song.duration;
    $scope.pinningComment = true;
    $scope.selectedComment = [{}];
  };

  var renderComments = function() {
    commentPins.selectAll('div')
      .data($scope.comments)
      .enter()
      .append('div')
      .style('left', function (d) {
        var left = Math.floor(d.time / $scope.song.duration * waveWidth) - pinWidth / 2;
        return left + 'px';
      })
      .attr('class', 'pin')
      .on('mouseover', function(d, i) {
        $scope.setSelectedComment(d);
      });
  };

  var renderSelectedComment = function() {
    var left = Math.floor($scope.selectedComment[0].time / $scope.song.duration * waveWidth);
    var onLeft = left < waveWidth / 2;
    selectedComment.data($scope.selectedComment)
      .style('left', function() {
        if (onLeft) {
          return left + 'px';
        } else {
          return left - waveWidth / 2 + 'px';
        }
      })
      .classed('left', onLeft)
      .classed('right', !onLeft)
      .style('width', waveWidth / 2 + 'px')
      .text(function (d) {
        return d.note;
      });
  };

  var renderFlow = function () {
    svg.selectAll('rect')
      .data(scaledAmplitudes)
      .transition()
      .duration(600)
      .attr('fill', function(d, i) {
        if ((i / scaledAmplitudes.length) < ($scope.audio.currentTime / $scope.song.duration) && $scope.currentSongIsPlaying) {
          return 'rgb(0, 0, ' + 220 + ')';
        } else {
          return 'rgb(0, 0, ' + 100 + ')';
        }
      });
  };

  $scope.setSelectedComment = function(comment) {
    $scope.selectedComment = [comment];
    renderSelectedComment();
  };

  $scope.setPlayTime = function (e) {
    if ($scope.currentSongIsPlaying) {
      var visualizer = document.getElementsByClassName('visualizer')[0];
      var rect = visualizer.getBoundingClientRect();

      var x = e.clientX - rect.left;
      $scope.audio.currentTime = $scope.song.duration * x / waveWidth;
    }
  };

  $scope.togglePlay = function () {
    if ($scope.currentSongIsPlaying) {
      if ($scope.audio.paused) {
        $scope.audio.play();
      } else {
        $scope.audio.pause();
      }
    } else {
      $scope.audio.src = $scope.song.compressedAddress ||
        $scope.song.address;
      $scope.currentSongIsPlaying = $scope.song.address === $scope.audio.src;
      $scope.audio.play();
    }
  };

}]);
