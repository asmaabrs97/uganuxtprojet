import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);

        // Validate the required fields
        if (!body.userId || !body.postId) {
            throw new Error('Missing userId or postId');
        }

        const res = await prisma.likes.create({
            data: {
                userId: body.userId,
                postId: body.postId,
            },
        });

        return res;
    } catch (error) {
        console.error('Error in like-post:', error.message);
        throw createError({ statusCode: 500, message: 'Error liking post' });
    }
});
