const bcrypt = require('bcryptjs');
const pwd = process.argv[2];
if (!pwd) {
  console.error('Usage: node tools/hash.js <password>');
  process.exit(1);
}
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(pwd, salt);
console.log(hash);
