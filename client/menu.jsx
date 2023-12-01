
const helper = require('./helper.js');
const React = require('react');
const { useState } = React;
const ReactDOM = require('react-dom');


// These are not stateful variables because this is the client, not the server
// Though, it still isn't really good to just keep them lying around like this
let currentLobby;
let gameUserCount, gameNumRounds, gameTierOptions;
let gameImageCount;

// Socket Functions - Game setup
const socket = io();

const handleCreateLobby = () => {
  const name = document.querySelector('#displayName').value;
  // Check if there was any value given
  if (!name) { return; }

  const numRounds = 3;
  const tierOptions = [
    'S____',
    'A____',
    'B____',
    'F____'
  ];
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
    ReactDOM.render(<LobbyLounge lobbyID={obj.lobbyID} host={obj.host} />,
      document.querySelector('#content'));
  }
  displayToChat(obj.text);

  // This is a bit of a hack, 
  // but don't do anything else if there was an error
  if (obj.err) {
    console.log(obj.text);
    return;
  }

  // Populate game state variables  
  currentLobby = obj.lobbyID;

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
  socket.emit('host start');
}

const onGameStart = () => {
  ReactDOM.render(<GamePrep />,
    document.querySelector('#content'));
}

const handleImageSubmit = () => {
  const image = document.querySelector('#imageURL').value;
  const tier = document.querySelector('#tierSelect').value;
  if (!image || !tier) { return; }

  document.querySelector('#imageSubmit').setAttribute('disabled', "");

  socket.emit('image submit', {
    image, 
    tier,
    lobbyID: currentLobby
  });
}

const onImageReceived = () => {
  gameImageCount++;
  // This part should be very temporary, until I ask how I should use React
  document.querySelector('#imgCounter').innerText
    = `Images: ${gameImageCount}/${gameNumRounds}`;
  //
  document.querySelector('#imageURL').value = "";
  document.querySelector('#tierSelect').value = 1;
  document.querySelector('#imageSubmit').removeAttribute('disabled');

  // When done, disabled the buttons and whatnot
  if (gameImageCount === gameNumRounds) {
    document.querySelector('#imageSubmit').setAttribute('disabled', "");
    document.querySelector('#imageSubmit').innerText = "Waiting";
    document.querySelector('#imageURL').setAttribute('disabled', "");
    document.querySelector('#tierSelect').setAttribute('disabled', "");
    document.querySelector('#gamePrep').setAttribute('style', "filter: brightness(90%);");

    // This is temporary, just to demonstrate for a mock up
    onImagesFinished();
  }
}

const onImagesFinished = () => {
  ReactDOM.render(<GameRounds />,
    document.querySelector('#content'));
}



// React Functions
const showMenu = () => {
  ReactDOM.render(<LobbyMenu />,
    document.querySelector('#content'));
}

const showJoinLobby = () => {
  ReactDOM.render(<LobbyJoin />,
    document.querySelector('#content'));
}

const showCreateLobby = () => {
  ReactDOM.render(<LobbyCreate />,
    document.querySelector('#content'));
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
      <div id='lobbyChat'></div>
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
      <label htmlFor="displayName">Enter your name</label>
      <input type="text" name="displayName"
        id="displayName" placeholder='Name' />
      <label htmlFor="lobbyStr">Enter a lobby ID</label>
      <input type="text" name="lobbyStr"
        id="lobbyInput" placeholder='Lobby ID' />
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
  // const [imgNum, setImgNum] = useState(props.imgNum);

  // Populate the tier select input
  let optionsArr = [];
  let count = 0;
  gameTierOptions.forEach((elem) => {
    count++;
    optionsArr.push(<option value={count}> {elem} </option>);
  });
  const tierSelect =
    <select name="tierSelect" id="tierSelect">
      {optionsArr}
    </select>;
  //

  return (
    <div id='gamePrep'>
      <span>Submit your images and corresponding tiers</span>
      <span id='imgCounter'>Images: {gameImageCount}/{gameNumRounds}</span>
      <label htmlFor="imageURL">Enter a URL for an image</label>
      <input className='inputSmallWide' type="url" name="imageURL"
        id="imageURL" placeholder='URL' />
      <label htmlFor="tierSelect">Select a tier</label>
      {tierSelect}
      <button
        className='buttonLarge'
        id='imageSubmit'
        onClick={handleImageSubmit}>
        Submit
      </button>
    </div>
  );
}


const GameRounds = (props) => {
  // Populate the tier select input
  let optionsArr = [];
  let count = 0;
  gameTierOptions.forEach((elem) => {
    count++;
    optionsArr.push(<option value={count}> {elem} </option>);
  });
  const tierSelect =
    <select name="tierSelect" id="tierSelect">
      {optionsArr}
    </select>;

  // Populate players
  // let playersArr = [];
  // for (let i = 0; i < 5; i++) {
  //   playersArr.push(<span>Player {i+1}: -name- ~ Guess: -tier-</span>);
  // }

  return (
    <div id='gameRounds'>
      <span>What did Player ___ rank this?</span>
      <span>Image goes here</span>
      <span>Other guesses:</span>
      <span>Player 1: -name- ~ Guess: -tier-</span>
      <span>Player 2: -name- ~ Guess: -tier-</span>
      <span>Player 3: -name- ~ Guess: -tier-</span>
      <span>Player 4: -name- ~ Guess: -tier-</span>
      <label htmlFor="tierSelect">Select a tier</label>
      {tierSelect}
      <button
        className='buttonLarge'
        id='imageSubmit'>
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

  ReactDOM.render(<LobbyMenu />,
    document.querySelector('#content'));
}
window.onload = init;