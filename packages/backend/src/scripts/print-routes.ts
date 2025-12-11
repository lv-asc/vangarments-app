import app from '../index';
import listEndpoints from 'express-list-endpoints';

console.log('Registered Routes:');
const endpoints = listEndpoints(app);
endpoints.forEach(endpoint => {
    console.log(`${endpoint.methods.join(', ')} \t ${endpoint.path}`);
});
