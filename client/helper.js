
// Takes in an error message. Sets the error message up in html, and
// displays it to the user. Will be hidden by other events that could
// end in an error.
const handleError = (message) => {
  document.querySelector('#message p').textContent = message;
  document.querySelector('#message').classList.remove('hidden');
};

const hideError = () => {
  document.querySelector('#message').classList.add('hidden');
}

// Sends post requests to the server using fetch. Will look for various
// entries in the response JSON object, and will handle them appropriately.
const sendPost = async (url, data, handler) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  hideError();

  if(result.redirect) {
    window.location = result.redirect;
  }

  if(result.error) {
    handleError(result.error);
  }

  if(handler) {
    handler(result);
  }
};

const sendDelete = async (url, data, handler) => {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  hideError();

  if(handler) {
    handler();
  }
}

module.exports = {
  handleError,
  hideError,
  sendPost,
  sendDelete,
}