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
    '0TSQ':'Akash, Narasimham, Akhila',
    'PCZ1':'Anika, Shanti, Vihaan',
    'WB4N':'Venkat, Nithika, Saahas',
    'SBY9':'Sunila, Aneesh, Rishik',
    'TEST':'player1, player2, player3'
};

const clueLists = {
    '0TSQ': ['O', 'N2', 'V2', 'B2', 'N1', 'L', 'B1', 'V1', 'C', 'U', 'Final'],
    'PCZ1': ['N2', 'C', 'B1', 'O', 'L', 'U', 'N1', 'B2', 'V2', 'V1', 'Final'],
    'WB4N': ['B1', 'O', 'L', 'U', 'C', 'N1', 'N2', 'V1', 'B2', 'V2', 'Final'],
    'SBY9': ['O', 'N1', 'B1', 'V2', 'V1', 'L', 'C', 'B2', 'U', 'N2', 'Final'],
    'TEST': ['N1', 'B1', 'O', 'B2', 'L', 'V1', 'U', 'V2', 'N2', 'C', 'Final']
};

const clueCoords = {
    'N1': {lat: 47.601070, lng: -121.982860},
    'B1': {lat: 47.601974, lng: -121.984035},
    'O': {lat: 47.602115, lng: -121.979769},
    'B2': {lat: 47.602172, lng: -121.974589},
    'L': {lat: 47.604382, lng: -121.979455},
    'V1': {lat: 47.606784, lng: -121.978530},
    'U': {lat: 47.606863, lng: -121.984196},
    'V2': {lat: 47.607998, lng: -121.986330},
    'N2': {lat: 47.605675, lng: -121.989390},
    'C': {lat: 47.604122, lng: -121.983624},
    'Final': {lat: 47.601070, lng: -121.982860}
};

/*const clueAnswers = {
    'N1': new Set(['blind pig']),
    'B1': new Set(['vihaan']),
    'O': new Set(['x']),
    'B2': new Set(['(2,12),(5,11)','(5,11),(2,12)']),
    'L': new Set(['40']),
    'V1': new Set(['start afresh']),
    'U': new Set(['go huskies!']),
    'V2': new Set(['8']),
    'N2': new Set(['c']),
    'C': new Set(['language']),
    'Final': new Set(['mana kutumbam'])
};*/
const clueAnswers = {
    'N1': new Set(['answer']),
    'B1': new Set(['answer']),
    'O': new Set(['answer']),
    'B2': new Set(['answer']),
    'L': new Set(['answer']),
    'V1': new Set(['answer']),
    'U': new Set(['answer']),
    'V2': new Set(['answer']),
    'N2': new Set(['answer']),
    'C': new Set(['answer']),
    'Final': new Set(['answer'])
};

// helper functions
function getUncoveredClues(teamId, currClueIdx) {
    var uncoveredClues = clueLists[teamId].slice(0, currClueIdx);
    var uncoveredPositions = []
    uncoveredClues.forEach(clue => uncoveredPositions.push(clueCoords[clue]));
    if (currClueIdx == 10) {
        uncoveredClues.push('B3');
        uncoveredClues.push('N3');
    }
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

function updateClue(teamId, event) {
    return new Promise(resolve => {
        try {
            pool.query(`update curr_pos set curr_clue=curr_clue+1 where team_id='${teamId}'`);
        } catch (error) {
            throw new Error("Couldn't update");
        }
    });
}

function nameTeam(teamId, teamName) {
    return new Promise(resolve => {
        try {
            pool.query(`update curr_pos set team_name='${teamName}' where team_id='${teamId}'`, function(error, result, fields) {
              console.log(`'${teamName}'`);
            });
        } catch (error) {
            throw new Error("Couldn't add to db");
        }
    });
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
        console.log(req.body);
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

// API endpoint to check answer and update clue if correct
app.get('/api/checkanswer', (req, res) => {
    var teamId = req.query.teamId;
    var clue = req.query.clue;
    var answer = req.query.answer;
    try {
        pool.query(`select * from curr_pos where team_id = '${teamId}'`, function(error, result, fields) {
            if (clue != getCurrClue(teamId, result.rows[0]['curr_clue'])['clue']) {
                console.log(clue);
                console.log(result.rows[0]['curr_clue']);
                res.send('stale');
            } else if (clueAnswers[clue].has(answer.toLowerCase())) {
                // answer correct!
                updateClue(teamId)
                .then(res.send('correct'));
            } else {
                res.send('incorrect');
            }
        });
    } catch (error) {
        res.send('error');
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
