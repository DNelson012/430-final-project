
const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');



const returnToMenu = () => {
  ReactDOM.render(<LobbyMenu />,
    document.querySelector('#content'));
}

const joinLobby = () => {
  ReactDOM.render(<LobbyJoin />,
    document.querySelector('#content'));
}

const createLobby = () => {
  ReactDOM.render(<LobbyCreation />,
    document.querySelector('#content'));
}



const LobbyJoin = () => {
  return (
    <div id='lobbyJoin'>
      <span>Join a lobby</span>
      <button onClick={returnToMenu}>Return</button>
    </div>
  );
}

const LobbyCreation = () => {
  return (
    <div id='lobbyCreate'>
      <span>Making a lobby</span>
      <button onClick={returnToMenu}>Return</button>
    </div>
  );
}

const LobbyMenu = (props) => {
  return (
    <div id='lobbyMenu'>
      <button onClick={createLobby}>Create Lobby</button>
      <button onClick={joinLobby}>Join Lobby</button>
    </div>
  );
}

const init = () => {
  ReactDOM.render(<LobbyMenu />,
    document.querySelector('#content'));
}
window.onload = init;