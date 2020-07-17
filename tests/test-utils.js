jest.mock("@actions/core");
const core = require("@actions/core");

function setInputs(data) {
  const getInput = jest.fn().mockImplementation((name, params = {}) => {
    return data[name];
  });
  core.getInput = getInput;
}

module.exports = setInputs;