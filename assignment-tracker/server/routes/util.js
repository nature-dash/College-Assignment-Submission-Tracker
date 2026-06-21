const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

function readData(file) {
  try {
    const data = fs.readFileSync(path.join(dataDir, `${file}.json`));
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeData(file, data) {
  fs.writeFileSync(path.join(dataDir, `${file}.json`), JSON.stringify(data, null, 2));
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, "config.json")));
  } catch (e) {
    return { levels: ["UG", "PG"], years: [], departments: [] };
  }
}

function writeConfig(data) {
  fs.writeFileSync(path.join(dataDir, "config.json"), JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData, readConfig, writeConfig };
