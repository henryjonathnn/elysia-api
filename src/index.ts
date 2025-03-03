import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors'

//import routes
import Routes from './routes';

//initiate elysia
const app = new Elysia()
  // Add CORS middleware
  .use(cors({
    origin: ['http://localhost:4321', 'http://localhost:5173'], // Allow your frontend origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

//route home
app.get('/', () => 'Hello Elysia!');

//add routes
app.group('/api', (app) => app.use(Routes))

//start server on port 3000
app.listen(3000);
 
console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);