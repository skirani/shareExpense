/*This is a simple server implementation for few RESTful endpoints for an expense adding, settling and viewing utility.
It connects to a MySql DB on port 5000 on the backend to fetch data.

To run this:
- Run node server.js from the pathe where this server file is located.
- Use a client such as Postman/cURL etc to send requests to the respective URL's to get the data.

What can it be used for:
1. Add new users to the database
2. Get all users
3. Get a user
4. Add an expense for the a user
5. Settle an expense between friends.
6. Get the activity(dashboard) for a user. [minimal]
7. Get all friends of a user.

*/
const express = require("express");
const mysql = require("mysql");
const app = express();
const port = 5000;

app.use(express.json()); // support json encoded bodies
app.use(express.urlencoded({ extended: true })); // support encoded bodies

// --------------------------------CONNECTING TO DB--------------------------------
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "test_database", // Obv in production we shouldn't just expose the password like this - but for just the test's sake I've put this.
  database: "sp_data",
  multipleStatements: true,
});

connection.connect((err) => {
  if (err) {
    console.log("Connection Error:", err);
    return err;
  }
});

// -----------------------------ENDPOINTS------------------------

// Add new users to the database
app.post("/users/add", function (req, res) {
  var user = req.body.user_name;
  var query = connection.query(
    `INSERT INTO user (user_name) VALUES ('${user}');`,
    function (errs) {
      if (errs) {
        res.status(400).send("Error: Couldn't add user - Bad request");
      } else {
        res.status(201).send("Success: User added");
      }
    }
  );
});

// Get all users from the database
app.get("/users/", function (req, res) {
  var query = connection.query(`SELECT * FROM user`, function (errs, rows) {
    if (errs) {
      res.status(400).send("Error: Couldn't add user - Bad request");
    } else {
      var users_map = {};
      rows.map((r) => (users_map[+r["idUser"]] = r["user_name"]));
      res.status(200).send(users_map);
    }
  });
});

// Get specific user from the database
app.get("/users/:id", function (req, res) {
  var user_id = req.params.id;
  var query = connection.query(
    `SELECT * FROM user WHERE idUser = ${user_id};`,
    function (errs, rows) {
      if (errs) {
        res.status(400).send("Error: Couldn't add user - Bad request");
      } else {
        res.status(200).send({ user_id: rows[0], user_name: rows[1] });
      }
    }
  );
});

// Get friends of a user from the database
app.get("/users/friends/:user_id", function (req, res) {
  var user_id = req.params.user_id;
  var query = connection.query(
    `SELECT * FROM friends WHERE fk_user_id = ${user_id};`,
    function (errs, rows) {
      if (errs) {
        res.status(400).send("Error: Couldn't add user - Bad request");
      } else {
        friend_names = [];
        for (var j = 0; j < rows.length; j++) {
          friend_names.push(rows[j]["friend_name"]);
        }
        res.status(200).send({
          user: {
            user_id: +user_id,
            fetch_user: `<example_server>/users/${+user_id}`,
          },
          friends: [...friend_names],
        });
      }
    }
  );
});

// Add new expense to db
app.post("/expense/add", function (req, res) {
  var user = req.body.user;
  var amount = req.body.amount;
  var description = req.body.description;
  var friends = req.body.friends;
  const num_friends = req.body.friends.split("|").length;

  // function to parse the friends from the delimeter parameter and add it as rows for the people involved in the transaction.
  function parseFriends(friends, num_friends) {
    var sql_str = `
     INSERT INTO sp_data.expense
                  (
                  fk_user_id,
                  amount,
                  description)
                  VALUES
                      ('${user}',
                       '${amount}',
                       '${description}'); \n`;
    var friends_list = friends.split("|");
    for (var i = 0; i < friends_list.length; i++) {
      sql_str += `INSERT INTO sp_data.friends
                  (
                  friend_name,
                  fk_user_id)
                  VALUES
                  (
                    '${friends_list[i]}',
                    ${user});
                  INSERT INTO sp_data.expense_participants
                  (
                  fk_user_id,
                  friend_id,
                  friend_amount
                  )
                  VALUES
                  (
                  ${user},
                  '${friends_list[i]}',
                  ${parseInt(amount / (num_friends + 1))}); \n`;
    }
    return sql_str;
  }

  sql_str = parseFriends(friends, num_friends);
  var query = connection.query(sql_str, function (errs) {
    if (errs) {
      res
        .status(400)
        .send(
          `Error: Couldn't add - Bad request \n ( Data = ${sql_str}) ${errs}`
        ); // NOT a good idea to display the SQL to end user( Adding it for my own debugging)
    } else {
      res.status(201).send("Success: Expense and participants added");
    }
  });
});

// Settle an expense in the db.
app.post("/expense/settle", function (req, res) {
  var user = req.body.user;
  var tr_id = req.body.tr_id;
  var sql_str = `UPDATE  sp_data.expense_participants 
                 SET is_settled = 1 
                 WHERE expense_participants.fk_tr_id  = ${tr_id} AND expense_participants.fk_user_id = ${user}`;
  var query = connection.query(sql_str, function (errs) {
    if (errs) {
      res
        .status(400)
        .send(`Error: Couldnt settle expense - bad request \n ${errs}`);
    } else {
      res.status(201).send("Success: Expense settled");
    }
  });
});

// Get sort of a dashboard or total settlement that user owes/ is owed
app.get("/dashboard", function (req, res) {
  var user = req.body.user;
  var sql_str = `SELECT SUM(friend_amount) as amt_owed FROM sp_data.expense_participants WHERE fk_user_id= ${user} AND is_settled = 0;
                 SELECT SUM(friend_amount) as amt_settled FROM sp_data.expense_participants WHERE fk_user_id= ${user} AND is_settled = 1;
                `;
  var query = connection.query(sql_str, function (errs, rows) {
    if (errs) {
      res.status(400).send("Error: Couldn't show dashboard - bad request");
    } else {
      res.status(200).send({
        // total_amount_obj: JSON.stringify(rows[1]),
        user: {
          user_id: +user,
          fetch_user: `<example_server>/users/${+user}`,
        },
        total_amount_owed_to_user: rows[0][0]["amt_owed"],
        total_amount_settled_to_user: rows[1][0]["amt_settled"],
      });
    }
  });
});
// -----------------------------STARTING THE SERVER-------------------------------------

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
