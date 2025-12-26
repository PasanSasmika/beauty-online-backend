import express from 'express';
import cors from 'cors';
import Baserouter from './routes/base.routes.js';
import Authrouter from './routes/auth.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', Baserouter); 
app.use('/api/auth', Authrouter); 


export default app;