import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        
        const res = await prisma.comments.delete({
            where: {
                id: body.commentId,
                userId: body.userId // Ensure only the comment owner can delete it
            }
        })

        return { success: true, data: res }
    } catch (error) {
        console.error('Error in delete-comment:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})
