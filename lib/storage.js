/* Shared storage helper for Vercel serverless functions.
   Uses /tmp (writable in Vercel functions). Data persists for the
   lifetime of the function instance. */
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.tmpdir(), 'vng-data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function fp(key) { return path.join(DATA_DIR, key + '.json'); }

function read(key, def) {
  try { return JSON.parse(fs.readFileSync(fp(key), 'utf8')); }
  catch { return def; }
}

function write(key, data) {
  fs.writeFileSync(fp(key), JSON.stringify(data, null, 2), 'utf8');
}

function del(key, id) {
  const arr = read(key, []);
  const result = Array.isArray(arr) ? arr.filter(x => String(x.id) !== String(id)) : arr;
  write(key, result);
  return result;
}

function removeAll(key) {
  write(key, Array.isArray(read(key, [])) ? [] : {});
}

module.exports = { read, write, del, removeAll, DATA_DIR };