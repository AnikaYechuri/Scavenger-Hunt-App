const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const keys = require('./config/keys')
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: keys.pgConnectionString,
    ssl: {
      rejectUnauthorized: false
    }
});
const app = express();

//Middleware
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: "main"}));
app.set('view engine', 'hbs');
app.set("views", "./views");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

//Set static folder
app.use(express.static(`${__dirname}/public`));

// route for welcome page
app.get('/', (req, res) => {
    res.render('welcome');
});

app.get('/hunt', (req, res) => {
    console.log(req);
});

// API endpoint which validates the given teamId and checks if the team needs to be named
app.get('/api/validateteamid', (req, res) => {
    var teamId = req.query.teamId;
    try {
        pool.query(`select team_name from curr_pos where team_id = '${teamId}'`, function(error, result, fields) {
            if (result.rows.length != 0) {
                if (result.rows[0]['team_name'] == null)
                    res.send('unnamed');
                else
                    res.send('named');
            }
            res.send('invalid');
        });
    } catch (error) {
        res.send(error);
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});