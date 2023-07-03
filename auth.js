const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const { ObjectID } = require('mongodb')

module.exports = function (app, myDataBase) {
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
