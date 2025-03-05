import { Elysia } from 'elysia';
import { PostController } from '../controllers/post.controller';

const postController = new PostController();

export const postRoutes = new Elysia({ prefix: '/posts' })
  .post('/', async ({ body, set }) => {
    try {
      const post = await postController.create(body as any);
      set.status = 201;
      return { success: true, data: post };
    } catch (error) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .get('/', async ({ set }) => {
    try {
      const posts = await postController.findAll();
      return { success: true, data: posts };
    } catch (error) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .get('/:id', async ({ params, set }) => {
    try {
      const post = await postController.findById(Number(params.id));
      return { success: true, data: post };
    } catch (error) {
      set.status = error.message === 'Post not found' ? 404 : 500;
      return { success: false, message: error.message };
    }
  })
  .put('/:id', async ({ params, body, set }) => {
    try {
      const post = await postController.update(Number(params.id), body as any);
      return { success: true, data: post };
    } catch (error) {
      set.status = error.message === 'Post not found' ? 404 : 500;
      return { success: false, message: error.message };
    }
  })
  .delete('/:id', async ({ params, set }) => {
    try {
      const result = await postController.delete(Number(params.id));
      return { success: true, data: result };
    } catch (error) {
      set.status = error.message === 'Post not found' ? 404 : 500;
      return { success: false, message: error.message };
    }
  }); 