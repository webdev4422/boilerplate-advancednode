const passport = require('passport')
const bcrypt = require('bcrypt')

module.exports = function(app, myDataBase) {
  app.route('/').get((req, res) => {
    console.log('Connected to Database')
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    })
  })

  app.route('/chat').get(ensureAuthenticated, (req, res) => {
    res.render('chat', { user: req.user })
  })

  app.route('/auth/github').get(passport.authenticate('github'), (req, res) => {
    console.log(`/auth/github`)
  })

  app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    req.session.user_id = req.user.id
    console.log(`/auth/github/callback`)
    // res.redirect('/profile')
    res.redirect('/chat')
  })

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/')
  }

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile', { username: req.user.username })
  })

  app.route('/logout').get((req, res) => {
    req.logout()
    console.log(`loged out`)
    res.redirect('/')
  })

  app.route('/register').post(
    (req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(err)
        } else if (user) {
          console.log(`already registred`, user)
          res.redirect('/')
        } else {
          const hash = bcrypt.hashSync(req.body.password, 12)
          console.log(`Registered ${req.body.username} with password ${hash}`)
          myDataBase.insertOne(
            {
              username: req.body.username,
              password: hash,
            },
            (err, doc) => {
              if (err) {
                res.redirect('/')
              } else {
                // The inserted document is held within the ops property of the doc
                next(null, doc.ops[0])
              }
            }
          )
        }
      })
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile')
    }
  )

  app.use((req, res, next) => {
    res.status(404).type('text').send('404 Not Found')
  })
}
