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
    'M3ZV':'Anika, Shanti, Vihaan',
    'VOK1':'Venkat, Nithika, Saahas',
    'LYRB':'Sunila, Aneesh, Rishik',
    'TEST':'player1, player2, player3'
}

const clueLists = {
    '6VVA': ['N', 'M2', 'U2', 'A2', 'M1', 'K', 'A1', 'U1', 'B', 'T', 'Final'],
    'M3ZV': ['M2', 'B', 'A1', 'N', 'K', 'T', 'M1', 'A2', 'U2', 'U1', 'Final'],
    'VOK1': ['A1', 'N', 'K', 'T', 'B', 'M1', 'M2', 'U1', 'A2', 'U2', 'Final'],
    'LYRB': ['N', 'M1', 'A1', 'U2', 'U1', 'K', 'B', 'A2', 'T', 'M2', 'Final'],
    'TEST': ['M1', 'A1', 'N', 'A2', 'K', 'U1', 'T', 'U2', 'M2', 'B', 'Final']
} 

const clueCoords = {
    'M1': {lat: 47.601070, lng: -121.982860},
    'A1': {lat: 47.601974, lng: -121.984035},
    'N': {lat: 47.602115, lng: -121.979769},
    'A2': {lat: 47.602172, lng: -121.974589},
    'K': {lat: 47.604382, lng: -121.979455},
    'U1': {lat: 47.606784, lng: -121.978530},
    'T': {lat: 47.606863, lng: -121.984196},
    'U2': {lat: 47.607998, lng: -121.986330},
    'M2': {lat: 47.605675, lng: -121.989390},
    'B': {lat: 47.604122, lng: -121.983624},
    'Final': {lat: 47.5966, lng: -122.0404}
}

// helper functions
function getUncoveredClues(teamId, currClueIdx) {
    var uncoveredClues = clueLists[teamId].slice(0, currClueIdx);
    var uncoveredPositions = []
    uncoveredClues.forEach(clue => uncoveredPositions.push(clueCoords[clue]));
    return {
        clues: uncoveredClues,
        positions: uncoveredPositions
    };
}

function getCurrClue(teamId, currClue) {
    var clue = clueLists[teamId][currClue];
    return {
        clue: clue,
        position: clueCoords[clue]
    };
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

// API endpoint to retrieve team information
app.get('/api/teaminfo', (req, res) => {
    var teamId = req.query.teamId;
    try {
        pool.query(`select * from curr_pos where team_id = '${teamId}'`, function(error, result, fields) {
            data = {
                teamName: result.rows[0]['team_name'],
                teamMembers: teamMembers[teamId],
                uncoveredClues: getUncoveredClues(teamId, result.rows[0]['curr_clue']),
                currClue: getCurrClue(teamId, result.rows[0]['curr_clue'])
            }
            res.send(data);
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

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});