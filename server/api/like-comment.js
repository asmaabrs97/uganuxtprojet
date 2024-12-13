import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        
        const res = await prisma.commentLikes.create({
            data: {
                userId: body.userId,
                commentId: body.commentId
            }
        })

        return { success: true, data: res }
    } catch (error) {
        console.error('Error in like-comment:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
