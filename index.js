var crypto = require('crypto');
var uuid = require('uuid');
var express = require('express');

var mysql = require('mysql');  
var bodyParser = require('body-parser');
const database = require("../KURSOVAYA/config")
var fs = require('fs');
const path = require('path');



var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test1",
    password: "123456789"
})




var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0, length);
};

var sha512 = function(password,salt){
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    var value = hash.digest('hex');
    return{
        salt:salt,
        passwordHash:value
    };
}; 

function saltHashPassword(userPassword){
    var salt = genRandomString(16);                 
    var passwordData = sha512(userPassword,salt);
    return passwordData;
}


function checkHashPassword(user_password,salt)
{
    var passwordData = sha512(user_password,salt);
    return passwordData;
}




var app=express();
app.use(bodyParser.json());                         
app.use(bodyParser.urlencoded({extended: true}));   

app.set('view engine', 'ejs');
app.post('/order/', (req, res, next) => {
    const post_data = req.body;

    //
    database.query('DELETE FROM `order`', (error, result) => {
        if (error) {
          console.error('Failed to delete orders:', error);
          res.status(500).json('Failed to delete orders');
          return;
        }
        console.log('Deleted orders successfully');
    });


    if (!Array.isArray(post_data)) {
        res.status(400).json('Invalid request format: expected an array');
        return;
    }

    const values = [];
    let placeholders = '';

    post_data.forEach((item, index) => {
        const { id_user, game_name } = item;
        values.push(id_user, game_name);
        placeholders += `(?, ?)${index < post_data.length - 1 ? ', ' : ''}`;
    });

    const query = `INSERT IGNORE INTO \`order\`(id_user, game_name) VALUES ${placeholders}`;

    database.query(query, values, (error, result) => {
        if (error) {
            console.error('Failed to create orders:', error);
            res.status(500).json('Failed to create orders');
            return;
        }
        res.json('Created orders successfully');
    });
});



app.get('/deletegame', function(req, res) {
    res.render('delete_game_view');
  });


app.post('/deletegame', function(req, res) {
    var id_game = req.body.id_game;
  
    database.query('SELECT * FROM game WHERE id_game = ?', [id_game], function(err, result, fields) {
      database.on('error', function(err) {
        console.log('[MySQL ERROR]', err);
      });
  
      if (result && result.length) {
        database.query('CALL delete_game(?)', [id_game], function(err, result, fields) {
          if (err) throw err;
          res.sendFile(__dirname + '/views/success/game_delete_success.html');
        });
      } else {
        res.sendFile(__dirname + '/views/errors/game_delete_error.html');
      }
    });
  });



app.get('/categorys', function(req, res) {
    database.query('CALL get_categories()', function(err, result, fields) {
      if (err) throw err;
      res.render('category_view', { categorys: result[0] });
    });
  });



app.get('/deletecategorys', function(req, res) {
    res.render('delete_category_view');
    });


app.post('/deletecategorys', function(req, res) {
    var idcategory = req.body.idcategory;
  
    database.query('SELECT * FROM category WHERE idcategory = ?', [idcategory], function(err, result, fields) {
      database.on('error', function(err) {
        console.log('[MySQL ERROR]', err);
      });
  
      if (result && result.length) {
        database.query('CALL delete_category(?)', [idcategory], function(err, result, fields) {
          if (err) throw err;
          res.sendFile(__dirname + '/views/success/category_delete_success.html');
        });
      } else {
        res.json('We dont have category with this id');
      }
    });
  });


app.get('/users', function(req, res) {
    database.query('CALL get_users()', function(err, result, fields) {
      if (err) throw err;
      res.render('users_view', { users: result[0] });
    });
  });



app.get('/orders', function(req, res) {
    database.query('CALL get_orders()', function(err, result, fields) {
      if (err) throw err;
      res.render('order_view', { orders: result[0] });
    });
  });


app.get('/', function(req, res) {
    database.query('CALL get_users()', function(err, result, fields) {
      if (err) throw err;
      res.render('users_view', { users: result[0] });
    });
  });



app.get('/addcategory', function(req, res) {
    res.render('add_category_view');
});


app.post('/add_categorys', (req, res, next) => {
    var post_data = req.body;
    var idcategory = post_data.idcategory;
    var game_category = post_data.game_category;
  
    database.query('CALL add_category(?, ?)', [idcategory, game_category], function(err, result, fields) {
      if (err) throw err;
  
      if (result && result.length > 0) {
        var message = result[0][0].message;
        if (message === 'Category already exists') {
          res.sendFile(__dirname + '/views/errors/category_error.html');
        } else {
          res.sendFile(__dirname + '/views/success/category_success.html');
        }
      } else {
        res.sendFile(__dirname + '/views/errors/category_error.html');
      }
    });
  });




app.get('/games', function(req, res) {
    database.query('CALL get_games()', function(err, result, fields) {
      if (err) throw err;
      res.render('game_view', { games: result[0] });
    });
  }); 


app.get('/games_from_client/', (req, res) => {
    database.query('CALL get_games()', (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).send('Error retrieving games from database');
      } else {
        res.status(200).json(results[0]);
      }
    });
  });
  

app.get('/id_from_user/', (req, res) => {
    database.query('CALL get_users()', (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).send('Error retrieving users from database');
      } else {
        const jsonResults = JSON.stringify(results[0]);
        res.status(200).send(jsonResults);
      }
    });
  });


app.get('/category_from_client/', (req, res) => {
    database.query('CALL get_categories()', (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).send('Error retrieving categories from database');
      } else {
        const jsonResults = JSON.stringify(results[0]);
        res.status(200).send(jsonResults);
      }
    });
  });


  app.get('/addgame', function(req, res) {
    res.render('add_game_view');
});


app.post('/game', (req, res, next) => {
    var post_data = req.body;
    var id_game = post_data.id_game;
    var game_name = post_data.game_name;
    var game_price = post_data.game_price;
    var game_category = post_data.game_category;
    var discription = post_data.discription;
    var game_publisher = post_data.game_publisher;
  
    database.query('CALL add_game(?, ?, ?, ?, ?)', [game_name, game_price, game_category, discription, game_publisher], function(err, result, fields) {
      if (err) throw err;
  
      if (result && result.length > 0) {
        var message = result[0][0].message;
        if (message === 'Game added successfully') {
          res.sendFile(__dirname + '/views/success/game_success.html');
        } else if (message === 'Game already exists') {
          res.sendFile(__dirname + '/views/errors/game_error.html');
        } else {
          res.sendFile(__dirname + '/views/errors/category_error_name.html');
        }
      } else {
        res.sendFile(__dirname + '/views/errors/category_error_name.html');
      }
    });
  });



app.post('/register/', (req,res,next)=>{
    var post_data = req.body; 

    var uid = uuid.v4(); 
    var plaint_password = post_data.password; 
    var hash_data =saltHashPassword(plaint_password);
    var password = hash_data.passwordHash;
    var salt = hash_data.salt; 

    var name = post_data.name;
    var email = post_data.email;

    database.query('SELECT * FROM user where email=?',[email],function(err,result,fields){
            database.on('error',function(err){
                console.log('[MySQL ERROR]',err);
            });

        if(result && result.length)
            res.json('User already exist!');  
        else
        {
            const query = "INSERT INTO user(unique_id, name, email, encrypted_password, salt, created_at, updated_at) VALUES(?, ?, ?, ?, ?, NOW(),NOW())"

            const args = [uid, name, email, password, salt]
            database.query(query, args, (error, result) => {
                if (error) throw error

                
                
                database.on('error',function(err){
                    console.log('insert successful');
                    console.log('[MySQL ERROR]',err);
                    res.json('Register error: ' , err)
                });
                res.json('Register successful')
            });
        }  
    });
})





app.post('/login/', (req,res,next) =>{

    var post_data = req.body;
    
    var user_password = post_data.password;
    var email = post_data.email;


    database.query('SELECT * FROM user where email=?',[email],function(err,result,fields){
        database.on('error',function(err){
            console.log('[MySQL ERROR]',err);
    });

    if(result && result.length)
    {
        var salt = result[0].salt; 
        var encrypted_password = result[0].encrypted_password;
        var hash_password = checkHashPassword(user_password,salt).passwordHash;
        if(encrypted_password == hash_password)
            res.end(JSON.stringify(result[0]))
        else        
            res.end(JSON.stringify('Wrong password'))
    }
    else
    {
        res.json('User not exist!!');  
    }  
});



})
   
app.listen(3000, ()=>{
    console.log('Restful running on port 3000');
})
