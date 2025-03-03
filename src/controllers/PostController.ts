import prisma from "../../prisma/client";
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Getting all posts
 */
export async function getPosts() {
  try {
    //get all posts
    const posts = await prisma.post.findMany({ 
      orderBy: { id: 'desc' } 
    });

    //return response json
    return {
      success: true,
      message: "List Data Posts!",
      data: posts,
    };
  } catch (e) {
    console.error(`Error getting posts: ${e}`);
    return {
      success: false,
      message: `Error getting posts: ${e}`,
      data: [],
    };
  }
}

// Function to save file
async function saveFile(file: any) {
  try {
    if (!file) return null;
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Generate unique filename with original extension if possible
    const originalName = file.name || 'upload';
    const fileName = `${Date.now()}-${originalName}`;
    const filePath = join(uploadDir, fileName);
    
    // Log file saving location for debugging
    console.log('Saving file to:', filePath);
    
    // Check if file has buffer property
    if (file.buffer) {
      await writeFile(filePath, file.buffer);
    } 
    // Check if file has arrayBuffer method (File/Blob object)
    else if (typeof file.arrayBuffer === 'function') {
      const buffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(buffer));
    }
    // Check if file has data property
    else if (file.data) {
      // If data is already a Buffer
      if (Buffer.isBuffer(file.data)) {
        await writeFile(filePath, file.data);
      } 
      // If data is a string
      else if (typeof file.data === 'string') {
        // If it's a base64 data URL
        if (file.data.startsWith('data:')) {
          const base64Data = file.data.split(',')[1];
          await writeFile(filePath, Buffer.from(base64Data, 'base64'));
        } else {
          await writeFile(filePath, file.data);
        }
      } 
      // If data is an ArrayBuffer or similar
      else if (file.data instanceof ArrayBuffer || 
               (typeof file.data === 'object' && file.data !== null)) {
        await writeFile(filePath, Buffer.from(file.data));
      } else {
        throw new Error('Unsupported file data format');
      }
    } else {
      throw new Error('No valid file data found');
    }
    
    // Return relative path to be stored in database - just the filename
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

/**
 * Creating a post with cover image
 */
export async function createPost(options: { title: string; content: string; coverImage?: any }) {
  try {
    //get title, content, and coverImage
    const { title, content, coverImage } = options;
    
    console.log('Creating post with title:', title);
    console.log('Cover image received:', coverImage ? 'Yes' : 'No');
    
    // Save file if present
    let coverImagePath = null;
    if (coverImage) {
      try {
        coverImagePath = await saveFile(coverImage);
        console.log('Cover image saved at path:', coverImagePath);
      } catch (fileError) {
        console.error('Error saving file during post creation:', fileError);
        return {
          success: false,
          message: `Error saving file: ${fileError}`,
          data: null
        };
      }
    }

    //create data post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        coverImage: coverImagePath,
      },
    });

    //return response json
    return {
      success: true,
      message: "Post Created Successfully!",
      data: post,
    }
  } catch (e) {
    console.error(`Error creating post: ${e}`);
    return {
      success: false,
      message: `Error creating post: ${e}`,
      data: null
    };
  }
}

/**
 * Getting a post by ID
 */
export async function getPostById(id: string) {
  try {
    // Convert id to number
    const postId = parseInt(id);

    // Get post by id
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    // If post not found
    if (!post) {
      return {
        success: false,
        message: "Detail Data Post Not Found!",
        data: null,
      }
    }

    // Return response json
    return {
      success: true,
      message: `Detail Data Post By ID: ${id}`,
      data: post,
    }
  } catch (e) {
    console.error(`Error finding post: ${e}`);
    return {
      success: false,
      message: `Error finding post: ${e}`,
      data: null
    };
  }
}

/**
 * Updating a post with cover image
 */
export async function updatePost(id: string, options: { title?: string; content?: string; coverImage?: any }) {
  try {
    // Convert id to number
    const postId = parseInt(id);

    // Get title, content, and coverImage
    const { title, content, coverImage } = options;
    
    console.log('Updating post ID:', postId);
    console.log('Cover image received for update:', coverImage ? 'Yes' : 'No');
    
    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return {
        success: false,
        message: "Post not found",
        data: null
      };
    }
    
    // Save new file if present
    let coverImagePath;
    if (coverImage) {
      try {
        coverImagePath = await saveFile(coverImage);
        console.log('New cover image saved at path:', coverImagePath);
      } catch (fileError) {
        console.error('Error saving file during post update:', fileError);
        return {
          success: false,
          message: `Error saving file: ${fileError}`,
          data: null
        };
      }
    }

    // Update post with prisma
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(title ? { title } : {}),
        ...(content ? { content } : {}),
        ...(coverImagePath ? { coverImage: coverImagePath } : {}),
      },
    });

    // Return response json
    return {
      success: true,
      message: "Post Updated Successfully!",
      data: post,
    }
  } catch (e) {
    console.error(`Error updating post: ${e}`);
    return {
      success: false,
      message: `Error updating post: ${e}`,
      data: null
    };
  }
}

/**
* Deleting a post
*/
export async function deletePost(id: string) {
  try {
    // Convert id to number
    const postId = parseInt(id);

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return {
        success: false,
        message: "Post not found",
        data: null
      };
    }

    // Delete post with prisma
    await prisma.post.delete({
      where: { id: postId },
    });

    // Return response json
    return {
      success: true,
      message: "Post Deleted Successfully!",
      data: null
    }
  } catch (e) {
    console.error(`Error deleting post: ${e}`);
    return {
      success: false,
      message: `Error deleting post: ${e}`,
      data: null
    };
  }
}