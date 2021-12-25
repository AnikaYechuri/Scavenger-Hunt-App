# Scavenger Hunt Web App
This web application is intended to facilitate a family scavenger hunt activity.  

Authors: **Anika Yechuri & Saahil Yechuri**

## Requirements
For development, make sure you have Node.js installed in your environment.

### Node

  Go to the Node.js [website](https://nodejs.org/) for instructions on installation.
Also make sure to have `git` (available [here](https://git-scm.com/)) in your PATH - `npm` might need it to install certain dependencies.

If the installation was successful, you versions should match this:

    $ node --version
    v16.13.1

    $ npm --version
    8.1.2

### Install

    $ git clone https://github.com/AnikaYechuri/Scavenger-Hunt-App.git
    $ cd scavenger-hunt-app
    $ npm install --save express express-handlebars body-parser pg cors
    
## Run the project

  Using `nodemon` is recommended to run the project while developing:
  
    $ npm install -g nodemon
    
  Otherwise, just run it like this:
  
    $ node app.js
    
  The app will be running on http://localhost:5000/ if it is run locally. Otherwise it will be run on https://scavenger-hunt-yp.herokuapp.com/. 