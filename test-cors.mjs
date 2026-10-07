fetch('http://api.vyraconnect.in/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'test', password: 'test' })
}).then(async res => {
  console.log('POST status:', res.status);
  console.log('POST headers:', Array.from(res.headers.entries()));
  console.log('POST BODY:', await res.text());
}).catch(console.error);
