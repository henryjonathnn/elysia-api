// routes/index.ts
import { Elysia, t } from 'elysia';

// import controller
import { getPosts, createPost, getPostById, updatePost, deletePost } from '../controllers/PostController';

const Routes = new Elysia({ prefix: '/posts' })

  // route get all posts
  .get('/', () => getPosts())

  // route create post with cover image
  .post('/', ({ body }) => createPost(body), {
    body: t.Object({
      title: t.String({
        minLength: 3,
        maxLength: 100,
      }),
      content: t.String({
        minLength: 3,
        maxLength: 1000,
      }),
      coverImage: t.File({
        type: 'image',
        required: false
      })
    })
  })

  // route get post by id
  .get('/:id', ({ params: { id } }) => getPostById(id))

  // route update post with cover image
  .patch('/:id', ({ params: { id }, body }) => updatePost(id, body), {
    body: t.Object({
      title: t.Optional(t.String({
        minLength: 3,
        maxLength: 100,
      })),
      content: t.Optional(t.String({
        minLength: 3,
        maxLength: 1000,
      })),
      coverImage: t.Optional(t.File({
        type: 'image'
      }))
    })
  })

  // route delete post
  .delete('/:id', ({ params: { id } }) => deletePost(id));

export default Routes;