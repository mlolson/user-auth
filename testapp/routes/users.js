var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/:userId', function(req, res, next) {
  req.userAuth.getUserById(req.params.userId)
    .then(function(user) {
      res.send(user);
    })
    .catch(next);
});

module.exports = router;
