
const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');

const handleLogin = (e) => {
  e.preventDefault();
  helper.hideError();

  const username = e.target.querySelector('#user').value;
  const pass = e.target.querySelector('#pass').value;

  if (!username || !pass) {
    helper.handleError('Username or password is empty!');
    return false;
  }

  // Attempt to log in
  helper.sendPost(e.target.action, { username, pass });

  return false;
}

const handleSignup = (e) => {
  e.preventDefault();
  helper.hideError();

  const username = e.target.querySelector('#user').value;
  const pass = e.target.querySelector('#pass').value;
  const pass2 = e.target.querySelector('#pass2').value;

  if (!username || !pass || !pass2) {
    helper.handleError('All fields are required!');
    return false;
  }

  if (pass !== pass2) {
    helper.handleError('Passwords do not match!');
    return false;
  }

  // Attempt to sign up
  helper.sendPost(e.target.action, { username, pass, pass2 });

  return false;
}



const LoginWindow = (props) => {
  return (
    <form id="loginForm"
      name="loginForm"
      onSubmit={handleLogin}
      action='/login'
      method='POST'
      className='mainForm'
    >
      <label htmlFor="username">Username: </label>
      <input type="text" name="username" id="user" placeholder='username' />
      <br />
      <label htmlFor="pass">Password: </label>
      <input type="password" name="pass" id="pass" placeholder='password' />
      <br />
      <input className='formSubmit' type="submit" value="Sign in" />
    </form>

  );
}

const SignupWindow = (props) => {
  return (
    <form id="signupForm"
      name="signupForm"
      onSubmit={handleSignup}
      action='/signup'
      method='POST'
      className='mainForm'
    >
      <label htmlFor="username">Username: </label>
      <input type="text" name="username" id="user" placeholder='username' />
      <br />
      <label htmlFor="pass">Password: </label>
      <input type="password" name="pass" id="pass" placeholder='password' />
      <br />
      <label htmlFor="pass2">Password: </label>
      <input type="password" name="pass2" id="pass2" placeholder='retype password' />
      <br />
      <input className='formSubmit' type="submit" value="Sign up" />
    </form>
  );
}



const init = () => {
  const loginButton = document.getElementById('loginButton');
  const signupButton = document.getElementById('signupButton');

  // Set up buttons
  loginButton.addEventListener('click', (e) => {
    e.preventDefault();
    ReactDOM.render(<LoginWindow />,
      document.getElementById('content'));
    return false;
  });
  signupButton.addEventListener('click', (e) => {
    e.preventDefault();
    ReactDOM.render(<SignupWindow />,
      document.getElementById('content'));
    return false;
  });

  // Render initial window
  ReactDOM.render(<LoginWindow />,
    document.getElementById('content'));
}
window.onload = init;