const client = require('../lib/client.js');
//import our seed data:
const todos = require('./todos.js');

run ();

async function run(){
    try {
        //you make the call. youre fetching
        await client.connect();
        
        await client.query(`
        INSERT INTO users (email, hash)
        VALUES ($1, $2);
        `,
        ['madeemail@email.com', 'someweirdpassword']);
        
//you promise the respond when you fetch
        await Promise.all(
            todos.map(todo => {
                return client.query(`
                INSERT INTO todos (task, complete, user_id)
                VALUES ($1, $2, $3);
                `,
                [todo.task, todo.complete, todo.user_id]);
            })
        );
        console.log('seed data load complete');
    }
    catch (err){
        console.log(err);
    }
    finally {
        client.end();
    }
}