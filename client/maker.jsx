
const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');

const handleDomo = (e) => {
  e.preventDefault();
  helper.hideError();

  const name = e.target.querySelector('#domoName').value;
  const level = e.target.querySelector('#domoLevel').value;
  const age = e.target.querySelector('#domoAge').value;

  if (!name || !age || !level) {
    helper.handleError('All fields are required!');
    return false;
  }

  helper.sendPost(e.target.action, { name, level, age }, loadDomosFromServer);
  return false;
}

const deleteDomo = (e) => {
  const id =  e.target.getAttribute('domoID');

  if (!id) {
    helper.handleError('Requires an ID for a domo in the database!');
    return false;
  }

  helper.sendDelete('/deleteDomo', { id }, loadDomosFromServer);
  return false;
}

const DomoForm = (props) => {
  return (
    <form id="domoForm"
      onSubmit={handleDomo}
      name="domoForm"
      action='/maker'
      method='POST'
      className='domoForm'
    >
      <label htmlFor="name">Name: </label>
      <input type="text" name="name" id="domoName" placeholder='Domo Name' />
      <label htmlFor="level">Level: </label>
      <input type="number" min="0" name="level" id="domoLevel" />
      <label htmlFor="age">Age: </label>
      <input type="number" min="0" name="age" id="domoAge" />
      <input className='makeDomoSubmit' type="submit" value="Make Domo" />
    </form>
  );
}

const DomoList = (props) => {
  if(props.domos.length === 0) {
    return (
      <div className='domoList'>
        <h3 className='emptyDomo'>No Domos Yet!</h3>
      </div>
    );
  }


  const domoNodes = props.domos.map(domo => {
    return (
      <div key={domo._id} className="domo">
        <img src="/assets/img/domoface.jpeg" alt="domo face" className='domoFace' />
        <h3 className='domoName'>Name: {domo.name}</h3>
        <button onClick={deleteDomo} domoID={domo._id} className='domoDel'>DEL</button>
        <h3 className='domoLevel'>Level: {domo.level}</h3>
        <h3 className='domoAge'>Age: {domo.age}</h3>
      </div>
    );
  });

  return (
    <div className='domoList'>
      {domoNodes}
    </div>
  );
}

const loadDomosFromServer = async () => {
  const response = await fetch('/getDomos');
  const data = await response.json();

  ReactDOM.render(
    <DomoList domos={data.domos} />,
    document.getElementById('domos')
  );
}

const init = () => {
  ReactDOM.render(
    <DomoForm />,
    document.getElementById('makeDomo')
  );

  ReactDOM.render(
    <DomoList domos={[]} />,
    document.getElementById('domos')
  );

  loadDomosFromServer();
}
window.onload = init;