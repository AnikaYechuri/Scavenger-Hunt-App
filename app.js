const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const keys = require('./config/keys')
const { Pool } = require('pg');
const res = require('express/lib/response');
const pool = new Pool({
    connectionString: keys.pgConnectionString,
    ssl: {
      rejectUnauthorized: false
    }
});
const app = express();

// Middleware
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: "main"}));
app.set('view engine', 'hbs');
app.set("views", "./views");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// Set static folder
app.use(express.static(`${__dirname}/public`));


// constants
const teamMembers = {
    '6VVA':'Akash, Narasimham, Akhila',
    'M3ZV':'Anika, Shanti, Vihaa,',
    'VOK1':'Venkat, Nithika, Saahas',
    'LYRB':'Sunila, Aneesh, Rishik',
    'TEST':'player1, player2, player3'
}

// route for welcome page
app.get('/', (req, res) => {
    res.render('welcome');
});

// route for scavenger hunt
app.post('/hunt', (req, res) => {
    var teamId = req.body.teamId;
    var teamName = req.body.teamName;
    if (teamName != '') {
        nameTeam(teamId, teamName)
        .then(res.render('hunt', {
            teamId: teamId
        }))
        .catch((error) => {
            res.render('failure', {
                error: error
            });
        });
    } else {
        res.render('hunt', {
            teamId: teamId
        });
    }
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
            } else {
                res.send('invalid');
            }
        });
    } catch (error) {
        res.send('error');
    }
});

function nameTeam(teamId, teamName) {
    return new Promise(resolve => {
        try {
            pool.query(`UPDATE curr_pos SET team_name='${teamName}' WHERE team_id='${teamId}'`);
        } catch (error) {
            throw new Error("Couldn't add to db");
        }
    });
}

function renderHunt(teamId) {
    return new Promise(resolve => {
        try {
            pool.query(`SELECT * FROM curr_pos WHERE team_id = '${teamId}'`, function(error, result, fields) {
                teamName = result.rows[0]['team_name'];
                currClue = result.rows[0]['curr_clue'];
                console.log(teamId);
                console.log(teamName);
                console.log(currClue);
                console.log(teamMembers[teamId]);
                res.render('hunt');
            });
        } catch (error) {
            throw new Error("Couldn't add to db");
        }
    });
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});