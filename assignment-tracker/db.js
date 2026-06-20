const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function isNetlify() {
  return !!process.env.NETLIFY;
}

let blobStore = null;

async function getStore() {
  if (blobStore) return blobStore;
  try {
    const { getStore } = require('@netlify/blobs');
    blobStore = getStore('assignment-tracker-data');
    return blobStore;
  } catch {
    return null;
  }
}

async function readData(file) {
  if (isNetlify()) {
    const store = await getStore();
    if (store) {
      const raw = await store.get(file);
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  }
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, `${file}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeData(file, data) {
  if (isNetlify()) {
    const store = await getStore();
    if (store) {
      await store.setJSON(file, data);
    }
    return;
  }
  fs.writeFileSync(
    path.join(DATA_DIR, `${file}.json`),
    JSON.stringify(data, null, 2)
  );
}

async function readConfig() {
  if (isNetlify()) {
    const store = await getStore();
    if (store) {
      const raw = await store.get('config');
      return raw ? JSON.parse(raw) : { levels: ['UG', 'PG'], years: [], departments: [] };
    }
    return { levels: ['UG', 'PG'], years: [], departments: [] };
  }
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'config.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { levels: ['UG', 'PG'], years: [], departments: [] };
  }
}

async function writeConfig(data) {
  if (isNetlify()) {
    const store = await getStore();
    if (store) {
      await store.setJSON('config', data);
    }
    return;
  }
  fs.writeFileSync(path.join(DATA_DIR, 'config.json'), JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData, readConfig, writeConfig };
