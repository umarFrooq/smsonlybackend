const t = process.argv[2];
if(!t){ console.error('provide token'); process.exit(2); }
const p = t.split('.')[1];
const b = p.replace(/-/g,'+').replace(/_/g,'/');
const padded = b + '='.repeat((4 - (b.length % 4)) % 4);
console.log(JSON.stringify(JSON.parse(Buffer.from(padded,'base64').toString()), null, 2));
