import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    try {
        const posts = await prisma.posts.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                likes: true,
                comments: {
                    include: {
                        likes: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        return posts;
    } catch (error) {
        console.error('Error in get-all-posts:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }
});
