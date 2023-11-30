
const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');



// Socket Functions
const socket = io();

const handleCreateLobby = () => {
  const name = document.querySelector('#displayName').value;
  // Check if there was any value given
  if (!lobbyID || !name) { return; }

  socket.emit('create lobby', { name, numRounds: 3 });

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
  // This is a bit of a hack, 
  // but if there is an error don't load the page
  if (obj.err) {
    console.log(text);
  }

  ReactDOM.render(<LobbyLounge lobbyID={obj.lobbyID} />,
    document.querySelector('#content'));
  displayToChat(obj.text);
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



// React Components
const LobbyLounge = (props) => {
  return (
    <div id='lobbyLounge'>
      <button
        className='buttonSmall'
        onClick={leaveLobby}>
        Leave Lobby
      </button>
      <span>Waiting in a lobby: {props.lobbyID}</span>
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

const init = () => {
  socket.on('user join', onUserJoin);
  socket.on('user leave', onUserLeave);

  ReactDOM.render(<LobbyMenu />,
    document.querySelector('#content'));
}
window.onload = init;