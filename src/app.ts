import express from 'express';
import cors from 'cors';
import Baserouter from './routes/base.routes.js';
import Authrouter from './routes/auth.routes.js';
import path from 'path';
import Productrouter from './routes/product.routes.js';
import Categoryrouter from './routes/category.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


app.use('/api', Baserouter); 
app.use('/api/auth', Authrouter); 
app.use('/api/products', Productrouter)
app.use('/api/categories', Categoryrouter);


export default app;