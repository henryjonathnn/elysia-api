import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { postRoutes } from './routes/post.route';

// import routes
import Routes from './routes';

// initiate elysia
const app = new Elysia()
  // Add CORS middleware
  .use(cors())
  // Serve static files - correct configuration
  .use(staticPlugin({
    assets: 'uploads',
    prefix: '/uploads',
  }))
  .use(postRoutes)

// route home
app.get('/', () => 'Hello Elysia!');

// add routes
app.group('/api', (app) => app.use(Routes))

// start server on port 3000
app.listen(3000);
 
console.log(
  `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`
);