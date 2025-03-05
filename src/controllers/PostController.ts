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
    
    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = join(uploadDir, fileName);
    
    // Log file saving location for debugging
    console.log('Saving file to:', filePath);
    console.log('File object:', file);
    
    // Handle file data
    if (file.arrayBuffer) {
      const buffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(buffer));
    } else if (file.buffer) {
      await writeFile(filePath, file.buffer);
    } else {
      throw new Error('Invalid file format');
    }
    
    // Return path relative to uploads directory
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
    const { title, content, coverImage } = options;
    
    console.log('Creating post with data:', { title, content, coverImage: coverImage ? 'present' : 'not present' });
    
    // Save file if present
    let coverImagePath = null;
    if (coverImage) {
      try {
        coverImagePath = await saveFile(coverImage);
        console.log('Cover image saved at:', coverImagePath);
      } catch (fileError) {
        console.error('Error saving file:', fileError);
        return {
          success: false,
          message: `Error saving file: ${fileError.message}`,
          data: null
        };
      }
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        coverImage: coverImagePath,
      },
    });

    console.log('Post created successfully:', post);

    return {
      success: true,
      message: "Post Created Successfully!",
      data: post,
    };
  } catch (e) {
    console.error('Error creating post:', e);
    return {
      success: false,
      message: e instanceof Error ? e.message : 'Error creating post',
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
    
    // Use transaction with retry logic
    return await retryTransaction(async () => {
      // Check if post exists - inside transaction to prevent race conditions
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

      // Update post with prisma using transaction
      const post = await prisma.$transaction(async (tx) => {
        return await tx.post.update({
          where: { id: postId },
          data: {
            ...(title ? { title } : {}),
            ...(content ? { content } : {}),
            ...(coverImagePath ? { coverImage: coverImagePath } : {}),
          },
        });
      }, { 
        timeout: 10000, // 10 seconds
        isolationLevel: 'ReadCommitted' // Less restrictive isolation level
      });

      // Return response json
      return {
        success: true,
        message: "Post Updated Successfully!",
        data: post,
      };
    }, 3); // Retry 3 times
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

    // Use transaction for delete
    return await prisma.$transaction(async (tx) => {
      // Check if post exists
      const existingPost = await tx.post.findUnique({
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
      await tx.post.delete({
        where: { id: postId },
      });

      // Return response json
      return {
        success: true,
        message: "Post Deleted Successfully!",
        data: null
      };
    }, {
      timeout: 5000 // 5 seconds
    });
  } catch (e) {
    console.error(`Error deleting post: ${e}`);
    return {
      success: false,
      message: `Error deleting post: ${e}`,
      data: null
    };
  }
}

// Helper function to retry transactions in case of lock timeouts
async function retryTransaction<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`Transaction attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
      
      // Only retry on lock timeout errors
      if (!error.message?.includes('Lock wait timeout exceeded')) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay exponentially for next attempt
      delay *= 2;
    }
  }
  
  throw lastError;
}