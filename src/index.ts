import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { join } from 'path';

// import routes
import Routes from './routes';

// initiate elysia
const app = new Elysia()
  // Add CORS middleware
  .use(cors({
    origin: ['http://localhost:4321', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }))
  // Serve static files - correct configuration
  .use(staticPlugin({
    assets: join(process.cwd(), 'uploads'),
    prefix: '/uploads'
  }))

// route home
app.get('/', () => 'Hello Elysia!');

// add routes
app.group('/api', (app) => app.use(Routes))

// start server on port 3000
app.listen(3000);
 
console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);