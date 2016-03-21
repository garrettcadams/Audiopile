var helpers = require('./helpers.js');
var Song = require('../controllers/song');
var Group = require('../controllers/group');
var Playlist = require('../controllers/playlist');
var User = require('../controllers/user');
var Upload = require('../controllers/upload');
var utils = require('../controllers/upload');

var routing = function (app, express) {

  var apiRoutes = express.Router(); 

  apiRoutes.get('/songs/:filename', Song.getSongByFilename);

  apiRoutes.post('/users/signup', User.signup);
  apiRoutes.post('/users/login', User.login);
  apiRoutes.get('/users/:id/avatar', User.getAvatar);
  
  // EVERYTHING BELOW THIS WILL NEED A JWT TOKEN!!!
  apiRoutes.use(helpers.verifyToken);



  apiRoutes.delete('/songs/:id', Song.deleteSong);

  apiRoutes.post('/users/avatar', Upload.catchUpload, User.setAvatar);
  apiRoutes.put('/users/profile', User.updateProfile);
  apiRoutes.get('/users/profile', User.getProfile);
  apiRoutes.get('/users/:id', User.getUser);
  apiRoutes.get('/users/:id/groups/', User.getGroups);
 
  // Add, update and retrieve groups
  apiRoutes.put('/groups/info', Group.updateGroupInfo);
  apiRoutes.post('/groups/', Group.createGroup);
  apiRoutes.post('/groups/:id/users/', Group.addUser);
  apiRoutes.get('/groups/:id/users/', Group.fetchUsers);
  apiRoutes.get('/groups/:id/playlists/', Group.fetchPlaylists);

  // Add and retrieve songs
  apiRoutes.post('/groups/:id/songs/', Upload.catchUpload, Song.addSong);
  apiRoutes.get('/groups/:id/songs/', Group.fetchSongs);

  // Add and retrieve playlists
  apiRoutes.post('/playlists/', Playlist.createPlaylist);
  apiRoutes.put('/playlists/:id/add/', Playlist.addSong);
  // apiRoutes.put('/playlists/:id/remove', Playlist.removeSong);
  apiRoutes.get('/playlists/:id/', Playlist.fetchSongs);
  // apiRoutes.delete('/playlists/:id', Playlist.delete);

  // Upload handling
  apiRoutes.post('/upload/', Upload.catchUpload);

  // Send email invites
  apiRoutes.post('/users/invite', helpers.sendEmailInvite);

  // Handle error logging of requests that are destined for above routes
  apiRoutes.use(helpers.errorLogger);
  apiRoutes.use(helpers.errorHandler);


  app.use('/api', apiRoutes);
};

module.exports = routing;
