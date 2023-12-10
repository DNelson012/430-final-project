
const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');

const handlePWChange = (e) => {
  e.preventDefault();
  helper.hideError();

  const passOld = e.target.querySelector('#passOld').value;
  const pass = e.target.querySelector('#pass').value;
  const pass2 = e.target.querySelector('#pass2').value;

  if (!passOld || !pass || !pass2) {
    helper.handleError('All fields are required!');
    return false;
  }

  if (pass !== pass2) {
    helper.handleError('New passwords do not match!');
    return false;
  }

  helper.sendPost(e.target.action, { passOld, pass, pass2 });

  return false;
}

const PasswordWindow = (props) => {
  return (
    <form id="passwordForm"
      name="passwordForm"
      onSubmit={handlePWChange}
      action='/pwchange'
      method='POST'
      className='mainForm'
    >
      <label htmlFor="passOld">Old Password: </label>
      <input type="password" name="passOld" id="passOld" placeholder='old password' />
      <br />
      <label htmlFor="pass">New Password: </label>
      <input type="password" name="pass" id="pass" placeholder='new password' />
      <br />
      <label htmlFor="pass2">New Password: </label>
      <input type="password" name="pass2" id="pass2" placeholder='retype new password' />
      <br />
      <input className='formSubmit' type="submit" value="Change Password" />
    </form>
  );
}



const init = () => {
  ReactDOM.render(<PasswordWindow />,
    document.getElementById('content'));
}
window.onload = init;