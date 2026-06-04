import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '10s',
};

export default function() {
  const res = http.get('https://monapp-preprod-gkdrehfwbkdgerft.francecentral-01.azurewebsites.net');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(0.5);
}
