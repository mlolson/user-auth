var express = require('express');
var router = express.Router();



/* GET home page. */
router.get('/', function(req, res) {

  console.log('isLoggedin?', req.session);


  res.render('index', { title: 'Express' });
});

router.post('/login', function(req, res, next) {

  console.log('isLoggedin?', req.session.currentUser)

  req.userAuth.loginWithEmail(req.body)
    .then(function(newUser) {
      console.log('newUser', newUser);
      res.send(newUser);
    })
    .catch(next);

});

router.post('/logout', function(req, res) {

  console.log('isLoggedin?', req.session);

  req.userAuth.logout()
    .then(function() {

      console.log('isLoggedin?', req.session);
      res.send({});
    });

});


router.post('/signup', function(req, res, next) {

  req.userAuth.signup(req.body)
    .then(function(newUser) {

      console.log('newUser', newUser);

      res.send(newUser);
    })
    .catch(next);

});


module.exports = router;
