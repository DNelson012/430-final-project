
const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');

const handleAaah = (e) => {
  e.preventDefault();
  helper.hideError();

  const name = e.target.querySelector('#aaahName').value;
  const level = e.target.querySelector('#aaahLevel').value;
  const age = e.target.querySelector('#aaahAge').value;

  if (!name || !age || !level) {
    helper.handleError('All fields are required!');
    return false;
  }

  helper.sendPost(e.target.action, { name, level, age }, loadAaahsFromServer);
  return false;
}

const deleteAaah = (e) => {
  const id =  e.target.getAttribute('aaahID');

  if (!id) {
    helper.handleError('Requires an ID for a aaah in the database!');
    return false;
  }

  helper.sendDelete('/deleteAaah', { id }, loadAaahsFromServer);
  return false;
}

const AaahForm = (props) => {
  return (
    <form id="aaahForm"
      onSubmit={handleAaah}
      name="aaahForm"
      action='/maker'
      method='POST'
      className='aaahForm'
    >
      <label htmlFor="name">Name: </label>
      <input type="text" name="name" id="aaahName" placeholder='Aaah Name' />
      <label htmlFor="level">Level: </label>
      <input type="number" min="0" name="level" id="aaahLevel" />
      <label htmlFor="age">Age: </label>
      <input type="number" min="0" name="age" id="aaahAge" />
      <input className='makeAaahSubmit' type="submit" value="Make Aaah" />
    </form>
  );
}

const AaahList = (props) => {
  if(props.aaahs.length === 0) {
    return (
      <div className='aaahList'>
        <h3 className='emptyAaah'>No Aaahs Yet!</h3>
      </div>
    );
  }


  const aaahNodes = props.aaahs.map(aaah => {
    return (
      <div key={aaah._id} className="aaah">
        <img src="/assets/img/domoface.jpeg" alt="aaah face" className='aaahFace' />
        <h3 className='aaahName'>Name: {aaah.name}</h3>
        <button onClick={deleteAaah} aaahID={aaah._id} className='aaahDel'>DEL</button>
        <h3 className='aaahLevel'>Level: {aaah.level}</h3>
        <h3 className='aaahAge'>Age: {aaah.age}</h3>
      </div>
    );
  });

  return (
    <div className='aaahList'>
      {aaahNodes}
    </div>
  );
}

const loadAaahsFromServer = async () => {
  const response = await fetch('/getAaahs');
  const data = await response.json();

  ReactDOM.render(
    <AaahList aaahs={data.aaahs} />,
    document.getElementById('aaahs')
  );
}

const init = () => {
  ReactDOM.render(
    <AaahForm />,
    document.getElementById('makeAaah')
  );

  ReactDOM.render(
    <AaahList aaahs={[]} />,
    document.getElementById('aaahs')
  );

  loadAaahsFromServer();
}
//window.onload = init;