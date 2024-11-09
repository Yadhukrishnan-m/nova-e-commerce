const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser(function(user, done) {
//   done(null, user);
// });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.PASSPORT_GOOGLE_ID, // Your Google Client ID
      clientSecret: process.env.PASSPORT_GOOGLE, // Your Google Client Secret
      callbackURL:process.env.googleCallbackUrl, // Callback URL after Google login
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user); // You can choose what to store (e.g., user.id)
});

// Deserialize the user from the stored session data
passport.deserializeUser((user, done) => {
  done(null, user); // You can fetch the full user from the DB here if needed
});

module.exports = passport;
