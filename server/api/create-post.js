import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        console.log('Creating post:', body)

        const res = await prisma.posts.create({
            data: {
                userId: body.userId,
                name: body.name || "User",
                image: body.image,
                text: body.text,
                picture: body.picture || ""
            }
        })

        return { success: true, data: res }
    } catch (error) {
        console.error('Error in create-post:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }
})