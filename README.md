nodewar-save-species
====================

With this script at your disposal, you can edit a [nodewar](http://nodewar.com) species with your favorite editor on your local machine. After you finish with your changes, simply run `node save.js` to push your changes to the nodewar web application.  I built this because I was tired of the nodewar editor not being vim.

You could probably throw this into a utility like `watch` and have it auto-save!

INSTALLATION
------------
**Requirements**
* git
* node.js
* npm

1. Clone this repository
2. Run `npm install` in the repository directory

USAGE
-----
1. Edit `config.js` so it contains your personal configuration
 * `SPECIES_DIRECTORY` is the location you want to keep your local species scripts, it can be an absolute or relative path
2. Initialize your species files with the command `node save.js init`
3. Edit one file or all the files!
4. Run `node save.js` to save all your changes back to the nodewar web app.
 * **Please note:** this will overwrite the current code of the species in the web app with whatever you have in the local files.  Use caution, because you could accidentally overwrite all your hard work.

**Notes**  
Because this script acts outside of the nodewar web application client, if you have the nodewar web application open in your browser it will not automatically update.  Getting the updated script on the *Play* section of the web app requires removing your edited species from the active list and adding it again.

CONTRIBUTING
------------
Pull requests welcome, please try to conform to the coding style to some degree.
