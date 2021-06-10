# shareExpense
This is a simple server implementation for few RESTful endpoints for an expense adding, settling and viewing utility.
It connects to a MySql DB on port 5000 on the backend to fetch data using Express.

## To run this:
- Run `node server.js` from the path where this server file is located.
- Use a client such as Postman/cURL etc to send requests to the respective URL's to get the data.
- Make sure Node & Express are installed (Else - get Node, then do a ` npm install express --save`)

## What can it be used for:
1. Add new users to the database
2. Get all users
3. Get a user
4. Add an expense for the a user
5. Settle an expense between friends.
6. Get the activity(dashboard) for a user. [minimal]
7. Get all friends of a user.

## Examples:

* Add a user: 
`curl --location --request POST 'localhost:5000/users/add' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'user_name=Jon Snow'`

* Get all users
`curl --location --request GET 'localhost:5000/users/'`

Result:
{
    "10": "Jon Snow",
    "11": "Walter White",
    "12": "Rajkumar",
    "13": "Mogambo",
    "14": "Chander Bing"
}

* Get a user:
`curl --location --request GET 'localhost:5000/users/friends/10'`

Result:
{
    "user": {
        "user_id": 10,
        "fetch_user": "<example_server>/users/10"
    },
    "friends": [
        "andy",
        "donna"
    ]
}

* Add an expense for the a user:

`curl --location --request POST 'localhost:5000/expense/add' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'user=10' \
--data-urlencode 'amount=1000' \
--data-urlencode 'description=pasta' \
--data-urlencode 'friends=donna|andy'`

* Settle an expense between friends.

`curl --location --request POST 'localhost:5000/expense/settle' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'user=10' \
--data-urlencode 'tr_id=1'`

* Get the activity(dashboard) for a user.
`curl --location --request GET 'localhost:5000/dashboard' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'user=10'`

Result:
{
    "user": {
        "user_id": 10,
        "fetch_user": "<example_server>/users/10"
    },
    "total_amount_owed_to_user": 333,
    "total_amount_settled_to_user": 333
}

* Get all friends of a user.
`curl --location --request GET 'localhost:5000/users/friends/10'`

Result:
{
    "user": {
        "user_id": 10,
        "fetch_user": "<example_server>/users/10"
    },
    "friends": [
        "Andy",
        "Donna"
    ]
}

