
const helper = require('./helper.js');
const React = require('react');
const { useState, createContext, useContext, useReducer } = React;
const ReactDOM = require('react-dom');
const { createRoot } = require('react-dom/client');
let root;

// Create socket
const socket = io();

// These are not stateful variables because this is the client, not the server
// Though, it still isn't really good to just keep them lying around like this
let isHost, lobbyUsers;
let gameUserCount, gameNumRounds, gameTierOptions;
let gameImageCount;
let newRound;
let tierGuesses, imageOwner;


// Helper Functions
//  Some of these need to be above
//  both the socket and react function,
//  so they'll go here
const createPlayerGuesses = () => {
  let tempPlayersArr = [];
  const userKeys = Object.keys(lobbyUsers);
  for (let i = 0; i < userKeys.length; i++) {
    let classes, guessing;
    if (tierGuesses[userKeys[i]]) {
      classes = 'playerGuess darken'
      guessing = 'Guessed'
    } else {
      classes = 'playerGuess'
      guessing = 'Guessing'
    }

    // The linter does not allow continue statements
    // and I shed a tear each time I'm forced to if instead
    if (userKeys[i] !== imageOwner) {
      tempPlayersArr.push(
        <div className={classes}>
          <p> {lobbyUsers[userKeys[i]]}, </p>
          <p> {guessing} </p>
        </div>);
    }
  }

  return tempPlayersArr;
}

const createGradedGuesses = (tier) => {
  let tempPlayersArr = [];
  const userKeys = Object.keys(lobbyUsers);
  for (let i = 0; i < userKeys.length; i++) {
    if (userKeys[i] !== imageOwner) {
      let classes;
      let guess = Number(tierGuesses[userKeys[i]].tier);
      if (guess === Number(tier)) {
        classes = 'playerGuess correct'
      } else {
        classes = 'playerGuess incorrect'
      }
      guess = "Guess: " + gameTierOptions[guess - 1];

      // The linter does not allow continue statements
      // and I shed a tear each time I'm forced to if instead
      tempPlayersArr.push(
        <div className={classes}>
          <p> {lobbyUsers[userKeys[i]]}, </p>
          <p> {guess} </p>
        </div>);
    }
  }

  return tempPlayersArr;
}

const disableGuessing = () => {
  const button = document.querySelector('#guessSubmit');
  button.setAttribute('disabled', "");
  button.classList.add('darkenButton');
  button.innerText = "Waiting";

  document.querySelector('#tierSelect').setAttribute('disabled', "");
}

const resetRound = () => {
  const button = document.querySelector('#guessSubmit');
  button.removeAttribute('disabled');
  button.classList.remove('darkenButton');
  button.innerText = "Guess";

  document.querySelector('#tierSelect').removeAttribute('disabled');
}



// Socket Functions - Game setup
const handleCreateLobby = () => {
  const name = document.querySelector('#displayName').value;
  // Check for missing name
  if (!name) { return; }

  // Use defaults if the 'payment' wasn't made
  const paymentMade = document.querySelector('#payOption');
  if (paymentMade) {
    isHost = true;
    lobbyUsers = {};
  
    socket.emit('create lobby', { 
      name, 
      numRounds: 3, 
      tierOptions: ['S','A','B','C','D','F'],
    });
  
    return;
  }

  const numRounds = document.querySelector('#roundSelect').value;
  const tierInputs = document.querySelectorAll('#tiers input');
  const tierOptions = [];
  let tierMissing = false;
  for (let i = 0; i < tierInputs.length; i++) {
    tierOptions.push(tierInputs[i].value);
    if (!tierInputs[i].value) {
      tierMissing = true;
    }
  }

  // Check for missing values
  if (!numRounds || tierMissing) { return; }
  
  isHost = true;
  lobbyUsers = {};

  socket.emit('create lobby', { 
    name, 
    numRounds, 
    tierOptions 
  });

  return;
}

const handleJoinLobby = () => {
  const name = document.querySelector('#displayName').value;
  const lobbyID = document.querySelector("#lobbyInput").value;
  // Check if there was any value given
  if (!lobbyID || !name) { return; }

  isHost = false;
  lobbyUsers = {};

  socket.emit('join lobby', { lobbyID, name });

  return;
}

const displayToChat = (text) => {
  const chat = document.querySelector('#lobbyChat');
  // If there is no chat, don't do anything
  if (!chat) { return; }

  const textSpan = document.createElement('span');
  textSpan.innerText = text;
  chat.appendChild(textSpan);
}

const onUserJoin = (obj) => {
  if (!document.querySelector('#lobbyLounge')) {
    root.render(<LobbyLounge lobbyID={obj.lobbyID} host={obj.host} firstMsg={obj.text} />);
  }
  displayToChat(obj.text);

  // This is a bit of a hack, 
  // but don't do anything else if there was an error
  if (obj.err) {
    console.log(obj.text);
    return;
  }

  // The host keeps track of the users
  if (isHost) {
    lobbyUsers[obj.user.id] = obj.user.name;
  }

  // Populate game state variables 
  gameUserCount = obj.userCount;
  gameNumRounds = obj.numRounds;
  gameTierOptions = obj.tierOptions;
  
  gameImageCount = 0;
}

const onUserLeave = (obj) => {
  displayToChat(obj.text);
}

const leaveLobby = () => {
  // If you were in a lobby, leave it
  socket.emit('leave lobby');

  // Render the menu
  showMenu();
}



// Socket Functions - Game start
const hostStartGame = () => {
  socket.emit('host start', lobbyUsers);
}

const onGameStart = (userArr) => {
  lobbyUsers = userArr;
  const links = document.querySelectorAll('#header a');
  links.forEach((el) => { el.remove(); })
  root.render(<GamePrep />);
}

const handleImageSubmit = () => {
  const image = document.querySelector('#imageURL').value;
  const tier = document.querySelector('#tierSelect').value;
  if (!image || !tier) { return; }

  document.querySelector('#imageSubmit').setAttribute('disabled', "");

  socket.emit('image submit', {
    image, 
    tier
  });
}

const onImageReceived = () => {
  document.querySelector('#imageURL').value = "";
  document.querySelector('#tierSelect').value = 1;
  document.querySelector('#imageSubmit').removeAttribute('disabled');

  // When done, disabled the buttons and whatnot
  if (gameImageCount === gameNumRounds) {
    document.querySelector('#imageSubmit').setAttribute('disabled', "");
    document.querySelector('#imageSubmit').innerText = "Waiting";
    document.querySelector('#imageURL').setAttribute('disabled', "");
    document.querySelector('#tierSelect').setAttribute('disabled', "");
    document.querySelector('#gamePrep').classList.add("darken");

    socket.emit('images finished');
  }
}

const onRoundsReady = () => {
  //
}

const onNextRound = (obj) => {
  const { ownerID, ownerName, image, tier } = obj;
  tierGuesses = {};
  imageOwner = ownerID;
  newRound = true;

  root.render(<GameRounds name={ownerName} imgSrc={image} tier={tier} />);
}

const handleGuess = () => {
  const tier = document.querySelector('#tierSelect').value;

  socket.emit('guess given', {
    tier,
  });

  disableGuessing();
}



// React Functions
const showMenu = () => {
  root.render(<LobbyMenu />);
}

const showJoinLobby = () => {
  root.render(<LobbyJoin />);
}

const showCreateLobby = () => {
  root.render(<LobbyCreate />);

  // Using createRoot might be async?
  //  This should help most of the time
  setTimeout(() => {
    document.querySelector('#payOption').addEventListener('change', () => {
      document.querySelector('#payLabel').remove();
      document.querySelector('#payOption').remove();
      document.querySelector('#roundSelect').removeAttribute('disabled');
      document.querySelectorAll('#tiers input').forEach((el) => {
        el.removeAttribute('disabled', '');
      });
      document.querySelector('#extraOptions').classList.remove('locked');
    });
  }, 20);
}



// React Components - Lobby
const LobbyLounge = (props) => {
  let startButton;
  if (props.host) {
    startButton = <button
      className='buttonLarge'
      onClick={hostStartGame}>
      Start
    </button>;
  }

  return (
    <div id='lobbyLounge'>
      <button
        className='buttonSmall'
        onClick={leaveLobby}>
        Leave Lobby
      </button>
      <span>Waiting in a lobby: {props.lobbyID}</span>
      {startButton}
      <div id='lobbyChat'>
        <span> {props.firstMsg} </span>
      </div>
    </div>
  );
}

const LobbyJoin = (props) => {
  return (
    <div id='lobbyJoin'>
      <button
        className='buttonSmall'
        onClick={showMenu}>
        Return
      </button>
      <span>Join a lobby</span>
      <label htmlFor="lobbyStr">Enter a lobby ID</label>
      <input type="text" name="lobbyStr"
        id="lobbyInput" placeholder='Lobby ID' />
      <label htmlFor="displayName">Enter your name</label>
      <input type="text" name="displayName"
        id="displayName" placeholder='Name' />
      <button
        className='buttonLarge'
        id='lobbySubmit'
        onClick={handleJoinLobby}>
        Join Lobby
      </button>
    </div>
  );
}

const LobbyCreate = (props) => {
  return (
    <div id='lobbyCreate'>
      <button
        className='buttonSmall'
        onClick={showMenu}>
        Return
      </button>
      <span>Making a lobby</span>
      <label htmlFor="displayName">Enter your name</label>
      <input type="text" name="displayName"
        id="displayName" placeholder='Name' />

      <label id='payLabel' htmlFor="payOption">Pay for extra options?</label>
      <input type="checkbox" name="payOption" id="payOption"/>
      <div id='extraOptions' className='locked'>
        <label id='roundLabel' htmlFor="roundSelect">Images per round</label>
        <select disabled name="roundSelect" id="roundSelect" defaultValue={3}>
          <option value={1}> 1 </option>
          <option value={2}> 2 </option>
          <option value={3}> 3 </option>
          <option value={4}> 4 </option>
          <option value={5}> 5 </option>
          <option value={6}> 6 </option>
        </select>
        <span id='tierLabel'>Tier Names</span>
        <div id='tiers'>
          <input disabled type="text" id="tier1" placeholder='S' defaultValue="S" />
          <input disabled type="text" id="tier2" placeholder='A' defaultValue="A" />
          <input disabled type="text" id="tier3" placeholder='B' defaultValue="B" />
          <br />
          <input disabled type="text" id="tier4" placeholder='C' defaultValue="C" />
          <input disabled type="text" id="tier5" placeholder='D' defaultValue="D" />
          <input disabled type="text" id="tier6" placeholder='F' defaultValue="F" />
        </div>
      </div>
      <button
        className='buttonLarge'
        id='lobbySubmit'
        onClick={handleCreateLobby}>
        Create Lobby
      </button>
    </div>
  );
}

const LobbyMenu = (props) => {
  return (
    <div id='lobbyMenu'>
      <button className='buttonLarge' onClick={showCreateLobby}>Create Lobby</button>
      <button className='buttonLarge' onClick={showJoinLobby}>Join Lobby</button>
    </div>
  );
}



// React Components - Game
const GamePrep = (props) => {
  // Set up state watching for the image count
  const [imgNum, setImgNum] = useState(0);

  // Populate the tier select input
  let optionsArr = [];
  let count = 0;
  gameTierOptions.forEach((elem) => {
    count++;
    optionsArr.push(<option key={count} value={count}> {elem} </option>);
  });
  const tierSelect =
    <select name="tierSelect" id="tierSelect">
      {optionsArr}
    </select>;
  //

  const submit = () => {
    gameImageCount++;
    setImgNum(gameImageCount);
    handleImageSubmit();
  }

  return (
    <div id='gamePrep'>
      <span>Submit your images and corresponding tiers</span>
      <span id='imgCounter'>Images: {imgNum}/{gameNumRounds}</span>
      <label htmlFor="imageURL">Enter a URL for an image</label>
      <input className='inputSmallWide' type="url" name="imageURL"
        id="imageURL" placeholder='URL' />
      <label htmlFor="tierSelect">Select a tier</label>
      {tierSelect}
      <button
        className='buttonLarge'
        id='imageSubmit'
        onClick={submit}>
        Submit
      </button>
    </div>
  );
}


const GameRounds = (props) => {
  // Set up state variables
  const [playersArr, setPlayersArr] = useState(createPlayerGuesses());

  // Initial set up
  if (newRound) {
    newRound = false;
    setTimeout(() => {
      resetRound();

      // Should only be done once
      // Isn't
      document.querySelector('#imageWrapper img').addEventListener('load', () => {
        const gameImg = document.querySelector('#imageWrapper img');
        gameImg.classList.remove('imgGuessed');
      });

      if (imageOwner === socket.id) {
        disableGuessing();
      }

      const newPlayersArr = createPlayerGuesses();
      setPlayersArr(newPlayersArr);
    }, 20);
  }

  // Socket functions
  //  moved inside for convenience, 
  //  I'm unsure of how 'good' it is to do it like this
  const onGuessMade = (obj) => {
    tierGuesses[obj.id] = obj.guess;

    const newPlayersArr = createPlayerGuesses();

    setPlayersArr(newPlayersArr);
  }
  socket.on('guess made', onGuessMade)

  const onGuessesFinished = () => {
    const newPlayersArr = createGradedGuesses(props.tier);

    setPlayersArr(newPlayersArr);

    document.querySelector('#imageWrapper img').classList.add('imgGuessed');
    document.querySelector('#guessSubmit').innerText = "Next Round Starting in 10s";
  }
  socket.on('guesses finished', onGuessesFinished);

  // Populate the tier select input
  let optionsArr = [];
  let count = 0;
  gameTierOptions.forEach((elem) => {
    count++;
    optionsArr.push(<option key={count} value={count}> {elem} </option>);
  });
  const tierSelect =
    <select name="tierSelect" id="tierSelect">
      {optionsArr}
    </select>;
  //

  const playerGuesses = 
    <div id="playerGuesses">
      {playersArr}
    </div>;

  return (
    <div id='gameRounds'>
      <span>What did {props.name} rank this?</span>
      <div id='imageWrapper'>
        <img crossOrigin="anonymous"
          src={props.imgSrc}
          alt="If you can read this, you gave a bad link." />
      </div>
      <span>Players:</span>
      {playerGuesses}
      <label htmlFor="tierSelect">Select a tier</label>
      {tierSelect}
      <button
        className='buttonLarge'
        id='guessSubmit'
        onClick={handleGuess}>
        Guess
      </button>
    </div>
  );
}



// Initialization
const init = () => {
  socket.on('user join', onUserJoin);
  socket.on('user leave', onUserLeave);

  socket.on('game start', onGameStart);
  socket.on('image received', onImageReceived);
  socket.on('rounds ready', onRoundsReady);
  socket.on('next round', onNextRound)

  root = createRoot(document.querySelector('#content'));
  root.render(<LobbyMenu />);
}
window.onload = init;