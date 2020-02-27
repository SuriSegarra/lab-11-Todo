//Load Enviroment Variables from the .env file
require('dotenv').config();

//app Dependencies 
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const client = require('./lib/client.js');

//initialize db connection
client.connect(); 

//app setup
const app = express();
const PORT = process.env.PORT;
app.use(morgan('dev')); //http logging
app.use(cors()); //enable CORS request
app.use(express.static('public')); // server files from /public folder
app.use(express.json()); // enable reading incoming json data
app.use(express.urlencoded({ extended: true }));

// Auth routes 

const createAuthRoutes = require('./lib/auth/create-auth-routes.js');

const authRoutes = createAuthRoutes({
    selectUser(email) {
        return client.query(`
            SELECT id, email, hash
            FROM users
            WHERE email = $1;
        `,
        [email]
        ).then(result => result.rows[0]);
    },
    insertUser(user, hash) {

        console.log(user);

        return client.query(`
            INSERT into users (email, hash)
            VALUES ($1, $2)
            RETURNING id, email;
        `,
        [user.email, hash]
        ).then(result => result.rows[0]);
    }
});
app.use('/api/auth', authRoutes);

//**TOODS **
// this is /GET request that returns whole list of todos
app.get('/api/todos', async(req, res) => {

    try {
           // make a sql query using pg.Client() to select * from todos
        const result = await client.query(`
            select * from todos where user_id=$1;
        `, [req.userId]);
   // respond to the client with that data
        res.json(result.rows);
    }

    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || err
        });
    }
});

app.post('/api/todos', async(req, res) => {

    try {
          // the user input lives is req.body.task
        console.log(req.body);
         // use req.body.task to build a sql query to add a new todo
        // we also return the new todo

        const result = await client.query(`
        INSERT INTO todos (task, complete)
        VALUES ($1, false)
        RETURNING *;
    `,
        [req.body.task]);

        // respond to the client request with the newly created todo
        res.json(result.rows[0]);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || err
        });
    }
});
// this route has a body with a complete property and an id in the params
app.put('/api/todos/:id', async(req, res) => {

    try {
        const result = await client.query(`
        update todos 
        set complete=${req.body.complete}
        where id = ${req.params.id}
        returning *;
        `, [/*pass in data*/]);

        res.json(result.rows[0]);
    }
    catch (err){
        console.log(err);
        res.status(500).json({
            error:err.message || err
        });
    }
});

app.delete('/api/todos/:id', async(req, res) => {
    // get the id that was passed in the route:

    try {
        const result = await client.query(`
        delete from todos where id=${req.params.id}
        returning *;
        `,);// this array passes to the $1 in the query, sanitizing it to prevent little bobby drop tables

        res.json(result.rows[0]);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || err
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log('server running on PORT', PORT);
});


