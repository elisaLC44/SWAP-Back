var express = require('express');
var router = express.Router();

var userModel = require('../models/users')


var bcrypt = require('bcrypt');
var uid2 = require('uid2');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Route des Users');
});


// --------------------  SIGN UP - INSCRIPTION ----------------------------
router.post('/sign-up', async function(req, res, next) {

  const {firstName, lastName, email, password } = req.body;

  var result = false
  var error = []
  var emptyField = false
  var token = ''

  var userSearch = await userModel.findOne({email: email})

  if(userSearch){
    error.push("Email déjà utilisé")
  }

  if(firstName == ''  || lastName == ''  || email == ''  ||  password == '' ) {
    emptyField = true
    error.push('Please make sure all fields are filled in')
    }

  if(userSearch == null && !emptyField){
  var cost = 10;
  var hash = bcrypt.hashSync(password, cost);

  var newUser = new userModel({
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hash,
          token: uid2(32),
          user_img : "https://cdn-icons-png.flaticon.com/512/921/921091.png", // pk fonctionne ici et pas ac autres props?
          birth_date : 0,
          user_credit: 1,
          gender:"",
          bio : "",
          address_street: "",
          address_city: "",
          address_zipcode: "",
          verified_profile: false,
        })
        
  var userSaved = await newUser.save()
  }

  console.log('USERSAVED Route:', userSaved)
  
  if (userSaved) {
    result = true
    token = userSaved.token
  }

  res.json({result, userSaved, error, token});
})


// --------------------  SIGN IN - CONNEXION -------------------------------------------------
router.post('/sign-in', async function(req, res, next) {

  var error = []
  var login = false
  var token = ''
  var userInfo = ''

  // décomposition des props contenues dans req.body pour code plus lisible
  const { email, password } = req.body;

  if (email == '' || password == '' ){
    error.push('Tous les champs doivent être remplis')
  }

  if(error.length == 0) {
    // 1. voir si l'utilisateur saisi est en BDD
    const userSearch  = await userModel.findOne({email: email})

      if (userSearch) {    
      // 2. check correspondance du MDP saisi (et que l'on hash) avec celui en BDD récup via userSearch (déjà hashé):
      if (bcrypt.compareSync(password, userSearch.password)) {
        // console.log('PASSWORD CHIFFRE EN BDD:', userSearch.password )
        userInfo = userSearch
        login = true
        token = userSearch.token
      } else {
        login = false
        error.push('mot de passe incorrect')
      }
    } else {
      error.push('email incorrect')
  }
}
  
  console.log('TOKEN RECUP EN BDD:', token )

  res.json({ error, login, token, userInfo });
})


// -------------------- Recupérer les infos d'un User grace à un numéro de token
router.get("/get-user/:token", async (req, res) => {
  const { token } = req.params;

  let currentUser = await userModel.findOne({ token: token });

  res.json({ userInfo: currentUser });
});

// -------------------- updater ADRESSE en BDD
router.post("/update-address/:token", async (req, res) => {
  // ATTENTION: en POST reçoit via req.body alors qu'en PUT reçoit en string (parceque stringifié avant) 
  // et infos doit passer en params ou req.query.
  const {token} = req.params
  const {street, city, zipcode} = req.body

  console.log('gender params', street)
  console.log('gender params', typeof street)

 await userModel.updateOne( { token: token}, {address_street: street});
 await userModel.updateOne( { token: token}, {address_city: city});
 await userModel.updateOne( { token: token}, {address_zipcode: zipcode});

 let updatedUser = await userModel.findOne({ token: token });
 console.log('User After all updates', updatedUser)

  res.json({ result: true, updatedUser: updatedUser});
})


// -------------------- updater GENDER en BDD
router.post("/update-gender/:token", async (req, res) => {
  const {token} = req.params
  const {gender} = req.body
  console.log('token update-gender route', token)
  console.log('gender params', gender)

 await userModel.updateOne( { token: token}, {gender: gender});
 let updatedUser = await userModel.findOne({ token: token });

 console.log('updatedUser', updatedUser)

  res.json({ result: true, updatedUser: updatedUser});
})


// -------------------- updater les CATEGORIES en BDD
router.post("/update-categories/:token", async (req, res) => {
  const {token} = req.params
  const {categories} = req.body
  console.log('token update-categ route', token)
  console.log('categories params', categories)
  console.log('categories params', typeof categories)

 await userModel.updateOne( { token: token}, {categories: JSON.parse(categories)} );
 let updatedUser = await userModel.findOne({ token: token });

  res.json({ result: true, updatedUser: updatedUser});
})

// -------------------- updater les CATEGORIES en BDD
router.post("/update-bio/:token", async (req, res) => {
  const {token} = req.params
  const {bio} = req.body
  console.log('token update-bio route', token)
  console.log('categories params', bio)

 await userModel.updateOne( { token: token}, {bio: bio} );
 let updatedUser = await userModel.findOne({ token: token });

  res.json({ result: true, updatedUser: updatedUser});
})


module.exports = router;
