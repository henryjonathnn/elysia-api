import { PrismaClient } from '@prisma/client';
import { FileUpload } from '../utils/fileUpload';

const prisma = new PrismaClient();
const fileUpload = FileUpload.getInstance();

export class PostController {
  async create(data: { title: string; content: string; coverImage?: File }) {
    try {
      let coverImageFileName: string | undefined;
      
      if (data.coverImage) {
        coverImageFileName = await fileUpload.saveFile(data.coverImage);
      }

      const post = await prisma.post.create({
        data: {
          title: data.title,
          content: data.content,
          coverImage: coverImageFileName,
        },
      });

      return post;
    } catch (error) {
      throw new Error('Failed to create post');
    }
  }

  async findAll() {
    try {
      return await prisma.post.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw new Error('Failed to fetch posts');
    }
  }

  async findById(id: number) {
    try {
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      return post;
    } catch (error) {
      throw new Error('Failed to fetch post');
    }
  }

  async update(id: number, data: { title?: string; content?: string; coverImage?: File }) {
    try {
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      let coverImageFileName = post.coverImage;
      
      if (data.coverImage) {
        coverImageFileName = await fileUpload.saveFile(data.coverImage);
      }

      return await prisma.post.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          coverImage: coverImageFileName,
        },
      });
    } catch (error) {
      throw new Error('Failed to update post');
    }
  }

  async delete(id: number) {
    try {
      const post = await prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      await prisma.post.delete({
        where: { id },
      });

      return { message: 'Post deleted successfully' };
    } catch (error) {
      throw new Error('Failed to delete post');
    }
  }
} 