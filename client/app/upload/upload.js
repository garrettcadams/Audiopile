angular
  .module('jam.upload', [])
  .controller('UploadController', ['$scope', 'Upload', 'ngProgressFactory', 'Auth', '$http', function($scope, Upload, ngProgressFactory, Auth, $http) {
    
    $scope.progressbar = ngProgressFactory.createInstance();

    var totalToUpload = 0;
    var totalUploaded = 0;
    var totalPercent = 0;

    var findTotalPercent = function() {
      var total = 0;
      for (var i = 0; i < $scope.queue.length; i++) {
        if ($scope.queue[i].progressPercentage) {
          total += $scope.queue[i].progressPercentage;
        }
      }

      totalPercent = Math.ceil(total / (totalToUpload));
      $scope.progressbar.set(totalPercent);
      if (totalPercent === 100) {
        $scope.progressbar.complete();
      }   
    };

    var throttledTotal = _.throttle(findTotalPercent, 250);

    $scope.addToQueue = function(files) {
      for (file in files) {
        $scope.queue.push(files[file]);
      }
    };

    $scope.queue = [];
    
    $scope.removeFile = function(index) {
      if (index > -1) {
        $scope.queue.splice(index, 1);
      }
    };

    // upload on file select or drop
    $scope.upload = function(file) {
      var postData = {
        uniqueFilename: file.name,
        fileType: file.type
      }

      $http.post("/api/s3", postData)
      .then(function(res){
        var s3Credentials = res.data;
        beginDirectS3Upload(s3Credentials, file);
      }, function(res){
        // AWS Signature API Error
        console.log('Error', res);
      });

      var beginDirectS3Upload = function(s3Credentials, file) {
        console.log('Begin s3 upload', s3Credentials);
        var groupId;

        Auth.getUserData()
        .then(function(user) {
          var dataObj = {
            'key' : 's3UploadExample/'+ Math.round(Math.random()*10000) + '$$' + file.name,
            'acl' : 'public-read',
            'Content-Type' : file.type,
            'AWSAccessKeyId': s3Credentials.AWSAccessKeyId,
            'success_action_status' : '201',
            'Policy' : s3Credentials.s3Policy,
            'Signature' : s3Credentials.s3Signature
          };

          Upload.upload({
            url: 'https://' + s3Credentials.bucketName + '.s3.amazonaws.com/',
            method: 'POST',
            transformRequest: function (data, headersGetter) {
              var headers = headersGetter();
              delete headers['Authorization'];
              return data;
            },
            data: dataObj,
            file: file,
          })
          .then(function(response) {
            // On upload confirmation
            file.progress = parseInt(100);
            console.log('Whatever this is');
            if (response.status === 201) {
              // TODO: upload success
              // do something client side
                // commit entry to songs list

            } else {
              // upload failed
              // do something client side
            }
          }, null, function(evt) {
            // on upload progress
            file.progress =  parseInt(100.0 * evt.loaded / evt.total);
            console.log('Progress: ', file.progress);
            // TODO: pass data to progress bar
          });
        });
      }
    };

    // for multiple files:
    $scope.uploadFiles = function() {
      $scope.progressbar.set(0);
      if ($scope.queue && $scope.queue.length) {
        totalToUpload = $scope.queue.length;
        totalUploaded = 0;
        for (var i = 0; i < $scope.queue.length; i++) {
          $scope.upload($scope.queue[i]);
        }
      }
    };
  }]);
