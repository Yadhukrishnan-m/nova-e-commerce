const passport = require('passport');
//facebook
const FacebookStrategy=require('passport-facebook').Strategy

passport.serializeUser((user, done) => {
    done(null, user); 
  });
  
  // Deserialize the user from the stored session data
  passport.deserializeUser((user, done) => {
    done(null, user); 
  });
  
  passport.use(new FacebookStrategy({
    clientID:process.env.PASSPORT_FACEBOOK_ID,  // Your Google Client ID
    clientSecret: process.env.PASSPORT_FACEBOOK,  // Your Google Client Secret
    callbackURL:process.env.facebookCallbackUrl,  // Callback URL after Google login
    profileFields: ['id', 'displayName', 'email']
    // passReqToCallback: true
 
  },
  function(request, accessToken, refreshToken, profile, done) {
    
  
    return done(null, profile);
  }));
  
