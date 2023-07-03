require('dotenv').config()
const passport = require('passport')
const LocalStrategy = require('passport-local')
const GitHubStrategy = require('passport-github').Strategy
const bcrypt = require('bcrypt')
const { ObjectID } = require('mongodb')

module.exports = function(app, myDataBase) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://boilerplate-advancednode.webdev4422.repl.co/auth/github/callback'
  },
    function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      //Database logic here with callback containing your user object
      myDataBase.findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            username: profile.username,
            name: profile.displayName || 'John Doe',
            photo: profile.photos[0].value || '',
            email: Array.isArray(profile.emails)
              ? profile.emails[0].value
              : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: {
            last_login: new Date()
          },
          $inc: {
            login_count: 1
          }
        },
        { upsert: true, new: true },
        (err, doc) => {
          return cb(null, doc.value);
        }
      );
      console.log(`${profile.username} successfully loged in with github auth`)
    }
  ));

  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`${username} attempted to log in`)
        if (err) return done(err)
        if (!user) return done(null, false)
        // if (password !== user.password) return done(null, false)
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false)
        }
        console.log(`${username} successfully loged in`)
        return done(null, user)
      })
    })
  )

  passport.serializeUser((user, done) => {
    done(null, user._id)
  })

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc)
    })
  })
}
