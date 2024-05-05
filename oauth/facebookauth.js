const passport= require('passport')
const userCollection = require('../model/userModel')

const FacebookStrategy = require('passport-facebook').Strategy;

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID ;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET ; 

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "https://www.urbankicks.site/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails'] 
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try{
        console.log(profile)
      let user = await userCollection.findOneAndUpdate(
        { email: (profile.emails && profile.emails.length > 0) ? profile.emails[0].value : null },

        {$set:{name: profile.displayName, provider:'facebook',}},
        {upsert:true,new:true}
        );

       return done(null,user); 
       
    }catch(err){
      console.error("Error inserting user:",err);
      return done(err);
    }

  }));

passport.serializeUser(function(user, done){
  done(null, user);
})

passport.deserializeUser(function(user, done){
  done(null, user);
})