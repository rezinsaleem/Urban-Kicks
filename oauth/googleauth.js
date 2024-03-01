const passport = require('passport')
const userCollection = require('../model/userModel')


const GoogleStrategy = require('passport-google-oauth2').Strategy;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ;

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ;

passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/callback",
    passReqToCallback   : true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try{
      let user = await userCollection.findOneAndUpdate(
        { email: profile.emails[0].value },
        {$set:{name: profile.displayName,provider:'google',}},
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