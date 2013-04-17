/*
 * Node.js script for NODEWAR (http://nodewar.com)
 * - allows you to edit your species in a local file and then save it to the
 *   nodewars web application
 */
var _ = require('underscore');
var qs = require('querystring');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var request = require('request');

var config = require('./config.js');

var argv = process.argv;
var initialize = argv.length === 3 && argv[2] === 'init';

var username = config.USERNAME;
var password = config.PASSWORD;

var sessionCookie,cookieJar;

var loginOpts = {
  url: config.LOGIN_ENDPOINT,
  method: 'POST',
  form: { email_or_username: username, pw: password }
}

// first, authenticate the user
request(loginOpts,function(req,res,body) {
  checkHTTPError(res,"Authentication Error");

  var data = JSON.parse(body);
  // if data.status.code isn't 0, something went wrong with the authentcation
  if(data.status.code) {
    console.log("Authentication Error: "+data.status.desc);
    process.exit(1);
  }

  sessionCookie = qs.stringify({session: data.session});
  // set up the request cookies
  cookieJar = request.jar();
  var cookie = request.cookie(sessionCookie);
  cookieJar.add(cookie);
  
  // now that the user is authenticated, start the species updating process
  loadSpecies();
});

function loadSpecies() {
  // load the user's species and then send them off to be processed
  var opts = {
    url: config.LIST_ENDPOINT,
    jar: cookieJar
  };

  request(opts,function(req,res,body) {
    checkHTTPError(res,"Error loading species list");
    
    var data = JSON.parse(body);
    var species = data.my_species;

    _.each(species,processSpecies);
  });
}

function processSpecies(s) {
  // extract the language and sid of the species
  var sid = s.sid;
  var name = s.url_name;

  // request the species from the nodewar site
  var paramString = qs.stringify({sid: sid});
  var url = config.LOAD_ENDPOINT+"?"+paramString;
  var opts = {
    url: url,
    jar: cookieJar
  };

  request(opts,function(req,res,body) {
    checkHTTPError(res,"Error loading species `"+name+"`");
    
    var response = JSON.parse(body);
    
    // extract information about the current version
    var existing_version = response.species.version;
    var existing_code = response.species.code;
    var language = response.species.lang;

    var new_version = existing_version + 1;

    // pull out the code from the file into a string
    //  - by convention, filename should be <url-name>.<language>
    //    i.e saving-testers.js
    var filename = name+config.LANGUAGES[language];
    var filepath = config.SPECIES_DIRECTORY+path.sep+filename;

    // if we are in initialize mode, just create the files from the existing
    // species
    if(initialize) {
      // check if the file already exists, we don't want to overwrite it
      if(fs.existsSync(filepath)) {
        console.log("Aborting initialization of `"+name+"`; file ("+filepath+") already exists");
        return;
      }
      
      // write the code to the file
      fs.writeFile(filepath,existing_code,function(err) {
        if(err) {
          console.log("Error writing "+filepath);
          console.log(err);
          return;
        }
        console.log("Created species `"+name+"` at "+filepath);
      });

      // after we finish initialization we return
      return;
    }

    if(! fs.existsSync(filepath) ) {
      console.log("No local copy of species `"+response.species.species_name+"` exists");
      return;
    }

    var code = fs.readFileSync(filepath,"utf8");

    // check if the new code is different than the existing code, and if it is,
    // then update it
    if( code !== existing_code) {
      // put together the data for the submissions
      var data = {
        sid: sid,
        code: code,
        lang: language,
        version: new_version
      };
      saveSpecies(data,response.species.species_name);
    }
    else {
      console.log("Species `"+response.species.species_name+"` is the same as your local copy");
    }
  });
}

function saveSpecies(data,speciesName) {

  // build the request options
  var saveOpts = {
    url: config.SAVE_ENDPOINT,
    method: "POST",
    jar: cookieJar,
    form: data
  }

  request(saveOpts,function(req,res,body) {
    checkHTTPError(res,"Error saving species `"+speciesName+"`");

    var response = JSON.parse(body);
    if(response.status.code) {
      console.log("Species `"+speciesName+"` failed to save: "+response.status.desc);
    }
    else {
      console.log("Species `"+speciesName+"` updated to version "+data.version);
    }
  });

}

function checkHTTPError(res,message) {
  // if the http response code isn't 200 there's a problem
  if(res.statusCode !== 200) {
    console.log(message);
    console.log("Error: HTTP Response "+res.statusCode);
    process.exit(1);
  }
}
