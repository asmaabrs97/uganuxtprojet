import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        console.log('Creating comment with data:', body)

        // Validate required fields
        const requiredFields = ['userId', 'postId', 'name', 'image', 'text']
        const missingFields = requiredFields.filter(field => !body[field])
        
        if (missingFields.length > 0) {
            console.error('Missing fields:', missingFields)
            throw createError({
                statusCode: 400,
                statusMessage: `Missing required fields: ${missingFields.join(', ')}`
            })
        }

        // Get current comment count for the post
        const commentCount = await prisma.comments.count({
            where: {
                postId: body.postId
            }
        })

        // Check if comment limit is reached
        if (commentCount >= 10) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Comment limit reached for this post'
            })
        }

        // Create the comment
        const res = await prisma.comments.create({
            data: {
                userId: body.userId,
                postId: body.postId,
                name: body.name,
                image: body.image,
                text: body.text
            },
            include: {
                likes: true
            }
        })

        console.log('Comment created successfully:', res)
        return { success: true, data: res }
    } catch (error) {
        console.error('Error in create-comment:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || error.message
        })
    }
})
