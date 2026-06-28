import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.TEST_HOST;
const port = process.env.PORT;

if (!host || !port) {
  throw new Error('TEST_HOST and PORT environment variables are required to run this test script.');
}

const options = {
  hostname: host,
  port: parseInt(port),
  path: '/api/analytics/dashboard/6a3f76c2c57d0b4a8cff15d2',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
