import * as core from "@actions/core";

export default function setInputs(data) {
  core.getInput.mockImplementation((name, params = {}) => {
    return data[name];
  });
}