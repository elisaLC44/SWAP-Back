var express = require("express");
var router = express.Router();

var userModel = require("../models/users");
var requestModel = require("../models/requests");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "SWAP" });
});

//! userByCategory en GET
router.get("/users-by-category/:category", async (req, res) => {
  const { category } = req.params;
  let status = false;
  let message = "";

  let foundUsers = await userModel.find({ categories: category });

  if (foundUsers) {
    status = true;
  } else {
    status = false;
    message = "Oops, c'est embêtant...";
  }
  res.json({ status, foundUsers, message });
});


//! AJOUTER/CREER UNE NEW REQUEST EN BDD
router.post("/add-request", async (req, res) => {
  const {
    token,
    address_street,
    address_zipcode,
    address_city,
    category,
    description,
    disponibility,
    selectedUserList,
  } = req.body;

  console.log("selectedUserList :", token, selectedUserList, address_street, address_zipcode, address_city, category, description, disponibility,)

  let status = false;
  let message = "";

  let foundAsker = await userModel.findOne({ token: token });

  // if(foundAsker) { status = true }
  // console.log("status",status)
  
  // à l'intérieur de requestModel, la propriété "conversation" se voit attribuer un tableau avec autant d'objet conversation qu'il y a de user selected
 
  let parsedUserList = JSON.parse(selectedUserList)

  let newRequest = new requestModel({
    asker_status: 0,
    helper_status: 0,
    category: category,
    description: description,
    disponibility: disponibility,
    address: {
      address_street: address_street,
      address_city: address_city,
      address_zipcode: address_zipcode,
    },
    insert_date: new Date(),
    declaration_date: "",
    end_date: "",
    credit: null,
    helper: null,
    asker: foundAsker._id,
    selected_users: parsedUserList, // liste des user helper sauvgardés dans REDUX via composant Card
    // conversations: conversations, // créer une conversation possible
  });

  let savedRequest = await newRequest.save();

  if(savedRequest){
    status = true
  } else {
    message = "Oops, c'est dommage"
  }
  console.log('status:', status)

  console.log("savedRequest:", savedRequest)

  res.json({ status, savedRequest, message });
});

  // let conversations = [];
  // parsedUserList.forEach((userId) => { conversations.push({ user_conversation_id: userId, messages: [],});
  // });

  // console.log(" parsedUserList", conversations)
  // or
  // for(let i = 0; i<parsedUserList .length; i++){
  //   conversations.push({ user_conversation_id: parsedUserList[i], messages: []})
  // }


//! GET-REQUESTS by CATEGORIES
router.get("/get-requests/:token", async (req, res) => {
  const { token } = req.params;


  let message = ""
  
  let foundUser = await userModel.findOne({ token: token })
  // console.log('FOUNDUSER:', foundUser)
  
  let requests = await requestModel.find({selected_users: foundUser._id}).populate("asker")
  // console.log('matching request:', requests)

  if(requests.length == 0){
    message = "Vous n'avez pas de demande pour l'instant"
  }
   
    res.json({ matchingRequests: requests, message: message });
});


//! Poursuivre (addwilling_user ds Racine) --> au click sur "Poursuivre" (sur AskerDetailScreen)
//! currentUser id est pushé dans la props "willing_helpers" du model Request
router.put("/continue/:requestId/:token", async (req, res) => {
 
  const { requestId, token } = req.params;
  console.log("requestID CONTINUE:", requestId)
  // requestId attendu :

  let message = ""

  let currentUser = await userModel.findOne({ token: token });
  
  if (currentUser) {
    await requestModel.updateMany(
      { _id: requestId },
      { $push: { willing_helpers: currentUser._id }, }
    );
    
    // ajoute autant de conversations qu'il y a de matches (quand helper click "poursuivre")
    await requestModel.updateMany(
      { _id: requestId },
      { $push: {  conversations: { user_conversation_id: currentUser._id, messages: [] }, }, }
    );
    
  } else {
    message =  "une erreur s'est produite" 
  }

    // pour retirer la requête de la HelperRequestList une fois accepté, on retire le token du user de la list des "selected_users" de la requête
    let foundRequest = await requestModel.findById(requestId).populate("selected_users");
    
    if (foundRequest) {
      let updateSelected = foundRequest.selected_users.filter(
        // garde tout ce qui est different du token du current user.
        (user) => user.token !== token
      );
      foundRequest.selected_users = updateSelected
    }
    let updatedRequest = await foundRequest.save()

    console.log("updatedRequest CONTINUE : ", updatedRequest)

    //! ajouter cette partie pour le Tchat
    // let foundRequest = await requestModel.findById(requestId)
    //   .populate("asker")
    //   .populate("conversations")
    //   .populate({
    //     path: "conversations",
    //     populate: {
    //       path: "user_conversation_id",
    //       model: "users",
    //     },
    //   });

    // let foundConversation = foundRequest.conversations.find(
    //   (conversation) => conversation.conversation_id._id === currentUser._id
    // );

    // console.log(foundConversation);
    // let data = {
    //   ...foundConversation,
    //   category: foundRequest.category,
    //   requestId: foundRequest._id,
    //   asker: foundRequest.asker,
    //   request: foundRequest,
    // };
 
   // request: data

    res.json({ message, updatedRequest });
});


//! REFUSE : retirer le helper de "selected_users"
router.delete("/refuse/:requestId/:token", async (req, res) => {
  const { requestId, token } = req.params;
  // console.log("REFUSE: requestId, token:", requestId, token)
  // populate "selected_users" pour récupérer les tokens des users et le comparer avec celui en params
  let foundRequest = await requestModel.findById(requestId).populate("selected_users");

  if (foundRequest) {
    let updateSelected = foundRequest.selected_users.filter(
      (user) => user.token !== token
    );
    foundRequest.selected_users = updateSelected
  }
  let updatedRequest = await foundRequest.save()
  // console.log("updatedRequest REFUSE : ",updatedRequest )

res.json({ updatedRequest })
});


//!  CONVERSATIONS SCREEN - en GET
router.get("/get-allmatches/:token", async (req, res) => {
  const { token } = req.params;
  // console.log('get-allmatches TOKEN:', token)
  let currentUser = await userModel.findOne({ token: token });

  // regarder si l'id du currentUser est ds un doc de "requests" en BDD. Le cas échéant, il y a match.
  let requests = await requestModel.find({
    $or: [
      { asker: currentUser._id },
      { helper: currentUser._id },
      { willing_helpers: currentUser._id },
    ],
  })
    .populate("asker")
    .populate("helper")
    .populate("willing_helpers")
    .populate("conversations")
    .populate({
      path: "conversations",
      populate: {
        path: "user_conversation_id",
        model: "users",
      },
    })
    .populate({
      path: "conversations.messages",
      populate: {
        path: "author",
        model: "users",
      },
    });

  if (requests.length !== 0) {
    res.json({
      status: true,
      requests: requests,
    });
  } else {
    res.json({ status: false, message: "Vous n'avez pas de match pour le moment" });
  }
});


// ! ACCEPT
router.put("/accept/:requestId/:token", async (req, res) => {
  const {requestId, token} = req.params
  // console.log('LA ROUTE ACCEPT FONCTIONNE! :', requestId, token)

  let currentUser = await userModel.findOne({token : token})
  
  let foundRequest = await requestModel.findOne({_id : requestId})

  // 1. ajouter dans helper et retirer de willing_helper
  foundRequest.helper = currentUser._id

  // 2. changer les status helper et asker
  foundRequest.helper_status = 1
  foundRequest.asker_status = 1

  let updatedStatus = await foundRequest.save()
  console.log('updatedStatus :', updatedStatus)

  res.json({updatedStatus})
})


//! DECLARE - helper déclare:
router.post("/declare", async (req, res) => {
  const {requestId, token, declared_credit, declaration_date,} = req.body
  // console.log('LA ROUTE ACCEPT FONCTIONNE! :', requestId, token, declared_credit, declaration_date,)

  let parsedCredit = Number(declared_credit)
  console.log('declaration date :', declaration_date)
  console.log('typeof declaration date :', typeof declaration_date)

  let foundRequest = await requestModel.findOne({_id : requestId})
  foundRequest.credit = parsedCredit
  foundRequest.declaration_date = declaration_date
  foundRequest.helper_status = 2

  let newRequestCredit = await foundRequest.save()
  console.log('updated request - new credit :', newRequestCredit)

  // newRequestCredit
  res.json({newRequestCredit})
})


//! ASKER'S CONFIRMATION of helper's declaration : prend le "credit" de request et l'ajoute au helper et le défalque du asker 
router.put("/confirm/:requestId/:requestCredit/:token", async (req, res) => {
  const {requestId, requestCredit, token} = req.params
 
  let parsedCredit = Number(requestCredit)
  // console.log('LA ROUTE ACCEPT FONCTIONNE! :', typeof parsedCredit)
 
  //* 1. change asker_status
  let foundRequest = await requestModel.findOne({_id : requestId}) 
  foundRequest.asker_status = 2 
  await foundRequest.save()
  // console.log("1. foundRequest:", foundRequest)

  //* 2. ajouter  "requestCredit" au helper
  let foundHelper = await userModel.findById({_id : foundRequest.helper})
  console.log('2. foundHelper credit:', typeof foundHelper.user_credit)
  await userModel.updateOne( { _id : foundRequest.helper }, {user_credit: foundHelper.user_credit + parsedCredit} );

  //* 3. ajouter  "requestCredit" au helper
  let foundAsker = await userModel.findById({_id : foundRequest.asker})
  console.log('2. foundHelper credit:', foundAsker.user_credit)
  await userModel.updateOne( { _id : foundRequest.asker }, {user_credit: foundAsker.user_credit - parsedCredit} );

  // newHelperCredit, newAskerCredit 
  res.json({status: true})
})


//! add-comment
router.post("/add-comment", async (req, res) => {
  const {token, comment, opponent_id} = req.body
  console.log("token, comment, opponent_id: ", token, comment, opponent_id)

  let currentUser= await userModel.findOne({token : token})
  let data = {
    author : currentUser._id, 
    content : comment,
    insert_date:  new Date(),
  }
  
  let foundOpponent = await userModel.findOne({_id : opponent_id })
  console.log('foundOpponent:', foundOpponent)
  foundOpponent.comments.push(data)
  console.log('updated opponent comments:', foundOpponent)
  let updatedComments = await foundOpponent.save()

  res.json({status:true, updatedComments: updatedComments})
})


// ! GET-déclaration pour affichage
router.get("/get-declaration/:requestId", async (req, res) => {
const {requestId} = req.params
console.log("GET-DECLARATION:",requestId)
let status = false

let foundRequest = await requestModel.findOne({_id : requestId})
console.log("foundRequest GET-DECL:",foundRequest)
if (foundRequest.credit != null) {
  status = true
} else {
  status = false
}

res.json({status, foundRequest})
})


// ! GET STATUS
router.get("/get-status/:requestId", async (req, res) => {
  const {requestId} = req.params
  // console.log('LA ROUTE ACCEPT FONCTIONNE! :', requestId)

  let foundRequest = await requestModel.findOne({_id : requestId})
  console.log('LA ROUTE GET STATUS :', foundRequest.asker_status)
  let asker_status = foundRequest.asker_status
  let helper_status = foundRequest.helper_status

  res.json({asker_status, helper_status })
})


//! add messages
// router.put("/add-message", async (req, res) => {
//   const { token, requestId, conversationToken, content } = req.body;

//   let currentUser = await UserModel.findOne({ token: token });

//   if (currentUser) {
//     let data = {
//       author: currentUser._id,
//       message: content,
//       insert_date: new Date(),
//     };

//     let foundRequest = await RequestModel.findById(requestId)
//       .populate("conversations")
          // est-ce essentiel? voir console.log('add-message foundRequest :', foundRequest)
//       .populate({
//         path: "conversations",
//         populate: { path: "user_conversation_id", model: "users" },
//       });

      // à l'intérieur du tableau messages, trouver
//     let foundConversation = foundRequest.conversations.find(
//       (conversation) => conversation.user_conversation_id.token === conversationToken
//     );

//     foundConversation.messages.push(data);
//     let savedRequest = await foundRequest.save();

    
//     res.json({ status: true, savedRequest });
//   } else {
//     res.json({
//       status: false,
//       message: "le message n'a pas pu etre enregistre",
//     });
//   }
// });


// //!  ASKER REQUEST LIST SCREEN - récupérer les helpers à qui  - en GET
// router.get("/get-willing-users/:token", async (req, res) => {
//   const { token } = req.params;
//   //get current User
//   let currentUser = await userModel.findOne({ token: token });

//   // cherche les requêtes où mon ID apprait en tant qur Asker (et non Helper)
//   let requests = await requestModel.find({
//     $and: [{ asker: currentUser._id }, { helper: null }],
//   })
//     .populate("asker") // mes infos user sont populées
//     .populate("willing_users")
//     .populate("accepted_users")
//     .populate({
//       path: "willing_users",
//       populate: {
//         path: "categories",
//         model: "categories",
//       },
//     });

//   if (requests != 0) {
//     res.json({
//       status: true,
//       requests: requests,
//     });
//   } else {
//     res.json({
//       status: false,
//       message: "Vous n'avez pas de propsitions pour le moment",
//     });
//   }
// });



module.exports = router;
