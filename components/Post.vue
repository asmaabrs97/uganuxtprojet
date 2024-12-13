<template>
    <div>
        <!-- Post Preview in Feed -->
        <div class="py-2 w-full cursor-pointer" @click="openPostModal">
            <div class="flex items-center justify-between">
                <div class="flex items-center text-white">
                    <img class="rounded-full h-[35px]" :src="post.image">
                    <div class="ml-2 font-semibold text-[18px]">{{ post.name }}</div>
                </div>
                <div 
                    v-if="user && user.identities && user.identities[0].user_id == post.userId" 
                    @click.stop="isMenu = !isMenu"
                    class="relative"
                >
                    <button 
                        :disabled="isDeleting"
                        class="flex items-center text-white p-1 h-[24px] w-[24px] hover:bg-gray-800 rounded-full cursor-pointer" 
                        :class="isMenu ? 'bg-gray-800' : ''"
                    >
                        <Icon v-if="!isDeleting" name="bi:three-dots" color="#ffffff" size="18"/>
                        <Icon v-else name="eos-icons:bubble-loading" color="#ffffff" size="18"/>
                    </button>

                    <div v-if="isMenu" class="absolute border border-gray-600 right-0 z-20 mt-1 rounded">
                        <button 
                            @click.stop="deletePost(post.id, post.picture)" 
                            class="flex items-center rounded gap-2 text-red-500 justify-between bg-black w-full pl-4 pr-3 py-1 hover:bg-gray-900"
                        >
                            <div>Delete</div>
                            <Icon name="solar:trash-bin-trash-broken" size="20"/>
                        </button>
                    </div>
                </div>
            </div>

            <div class="relative flex items-center w-full">
                <div class="bg-black rounded-lg w-full text-sm font-light">
                    <div class="py-2 text-gray-300">{{ post.text }}</div>
                    <img 
                        v-if="post && post.picture"
                        class="mx-auto w-full mt-2 pr-2 rounded" 
                        :src="runtimeConfig.public.bucketUrl + post.picture"
                        @error="handleImageError"
                        @load="handleImageLoad"
                    />

                    <div class="flex items-center gap-4 mt-3">
                        <button 
                            :disabled="isLike"
                            @click.stop="likeOrUnlike"
                            class="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer"
                        >
                            <Icon 
                                :name="hasLikedComputed ? 'ph:heart-fill' : 'ph:heart'" 
                                :color="hasLikedComputed ? '#FF0000' : '#FFFFFF'" 
                                size="17"
                            />
                            {{ post.likes.length }}
                        </button>

                        <button 
                            @click.stop="openPostModal"
                            class="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer"
                        >
                            <Icon name="ph:chat-circle" size="17"/>
                            {{ post.comments.length }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Post Modal -->
        <Teleport to="body">
            <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto" @click="closePostModal">
                <div class="bg-gray-900 w-full max-w-2xl mx-4 my-8 rounded-lg shadow-xl max-h-[90vh] flex flex-col" @click.stop>
                    <!-- Modal Header -->
                    <div class="flex justify-between items-center p-4 border-b border-gray-800">
                        <div class="flex items-center">
                            <img class="rounded-full h-[40px]" :src="post.image">
                            <div class="ml-3">
                                <div class="font-semibold text-white">{{ post.name }}</div>
                                <div class="text-sm text-gray-400">
                                    {{ new Date(post.createdAt).toLocaleDateString() }}
                                </div>
                            </div>
                        </div>
                        <button @click="closePostModal" class="text-gray-400 hover:text-white">
                            <Icon name="mdi:close" size="24"/>
                        </button>
                    </div>

                    <!-- Post Content - Make this section scrollable -->
                    <div class="p-4 overflow-y-auto flex-1">
                        <div class="space-y-4">
                            <p class="text-white">{{ post.text }}</p>
                            <img 
                                v-if="post && post.picture"
                                class="w-full rounded-lg object-contain max-h-[50vh]" 
                                :src="runtimeConfig.public.bucketUrl + post.picture"
                            />
                            
                            <!-- Like/Comment Actions -->
                            <div class="flex items-center gap-4">
                                <button 
                                    :disabled="isLike"
                                    @click="likeOrUnlike"
                                    class="flex items-center gap-1 text-gray-400 hover:text-white"
                                >
                                    <Icon 
                                        :name="hasLikedComputed ? 'ph:heart-fill' : 'ph:heart'" 
                                        :color="hasLikedComputed ? '#FF0000' : '#FFFFFF'" 
                                        size="20"
                                    />
                                    {{ post.likes.length }}
                                </button>
                                <div class="flex items-center gap-1 text-gray-400">
                                    <Icon name="ph:chat-circle" size="20"/>
                                    {{ post.comments.length }}
                                </div>
                            </div>

                            <!-- Comments Section -->
                            <div class="space-y-4 mt-6">
                                <!-- Add Comment -->
                                <div v-if="user" class="mb-4">
                                    <textarea
                                        v-model="newComment"
                                        rows="2"
                                        placeholder="Add a comment..."
                                        class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white resize-none focus:outline-none focus:border-gray-500"
                                        :disabled="isCommenting"
                                    ></textarea>
                                    <div class="flex justify-end mt-2">
                                        <button
                                            @click="addComment"
                                            :disabled="!newComment.trim() || isCommenting"
                                            class="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                                        >
                                            <span v-if="!isCommenting">Comment</span>
                                            <Icon v-else name="eos-icons:bubble-loading" size="18"/>
                                        </button>
                                    </div>
                                </div>

                                <!-- Comments List -->
                                <div v-if="sortedComments.length > 0" class="space-y-4">
                                    <div v-for="comment in sortedComments" :key="comment.id" 
                                        class="bg-gray-800 rounded-lg p-3"
                                    >
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center">
                                                <img :src="comment.image" class="h-8 w-8 rounded-full" />
                                                <span class="ml-2 text-white">{{ comment.name }}</span>
                                            </div>
                                            <button 
                                                v-if="user && user.identities && user.identities[0].user_id === comment.userId"
                                                @click.stop="deleteComment(comment.id)"
                                                class="text-red-500 hover:text-red-400"
                                            >
                                                <Icon name="solar:trash-bin-trash-broken" size="16"/>
                                            </button>
                                        </div>
                                        <p class="mt-2 text-gray-300">{{ comment.text }}</p>
                                        <div class="flex items-center justify-between mt-2">
                                            <div class="text-sm text-gray-500">
                                                {{ new Date(comment.createdAt).toLocaleDateString() }}
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <button 
                                                    @click.stop="likeComment(comment.id)"
                                                    :disabled="isLikingComment"
                                                    class="flex items-center gap-1 text-gray-400 hover:text-white"
                                                >
                                                    <Icon 
                                                        :name="hasLikedComment(comment) ? 'ph:heart-fill' : 'ph:heart'" 
                                                        :color="hasLikedComment(comment) ? '#FF0000' : '#FFFFFF'" 
                                                        size="16"
                                                    />
                                                    <span class="text-sm">{{ comment.likes.length }}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="text-gray-500 text-center py-4">
                                    No comments yet
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { useUserStore } from '~/stores/user'
const userStore = useUserStore()

const props = defineProps({ 
    post: Object
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const runtimeConfig = useRuntimeConfig()

let isMenu = ref(false)
let isLike = ref(false)
let isDeleting = ref(false)
let showModal = ref(false)
let newComment = ref('')
let isCommenting = ref(false)
let isDeletingComment = ref(false)
let isLikingComment = ref(false)

const emit = defineEmits(['isDeleted'])

// Watch for changes in post comments to update the UI
watch(() => props.post.comments, (newComments) => {
    if (newComments) {
        // Keep the modal open and clear comment if it was just added
        if (isCommenting.value) {
            newComment.value = ''
            isCommenting.value = false
        }
    }
}, { deep: true })

const hasLikedComputed = computed(() => {
    if (!user.value || !props.post.likes) return false
    return props.post.likes.some(like => like.userId === user.value.identities[0].user_id)
})

const sortedComments = computed(() => {
    if (!props.post.comments) return []
    return [...props.post.comments].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    )
})

const openPostModal = () => {
    showModal.value = true
    document.body.style.overflow = 'hidden'
}

const closePostModal = () => {
    showModal.value = false
    document.body.style.overflow = 'auto'
    newComment.value = '' // Clear comment input when closing modal
}

const handleModalClick = (event) => {
    event.stopPropagation()
}

const addComment = async () => {
    if (!user.value || isCommenting.value || !newComment.value.trim()) return
    
    try {
        isCommenting.value = true
        
        const { data, error } = await useFetch('/api/create-comment/', {
            method: 'POST',
            body: {
                userId: user.value.identities[0].user_id,
                postId: props.post.id,
                name: user.value.user_metadata.user_name,
                image: user.value.user_metadata.avatar_url,
                text: newComment.value.trim()
            }
        })

        if (error.value) {
            console.error('Error creating comment:', error.value)
            return
        }

        // Clear comment text after successful submission
        newComment.value = ''
        
        // Refresh posts without closing modal
        await userStore.getAllPosts()
    } catch (error) {
        console.error('Error in addComment:', error)
    } finally {
        isCommenting.value = false
    }
}

const deleteComment = async (commentId) => {
    if (!user.value || isDeletingComment.value) return
    
    try {
        isDeletingComment.value = true
        
        const { data, error } = await useFetch('/api/delete-comment/', {
            method: 'POST',
            body: {
                commentId: commentId,
                userId: user.value.identities[0].user_id
            }
        })

        if (error.value) {
            console.error('Error deleting comment:', error.value)
            return
        }

        // Refresh posts without closing modal
        await userStore.getAllPosts()
    } catch (error) {
        console.error('Error in deleteComment:', error)
    } finally {
        isDeletingComment.value = false
    }
}

const deletePost = async (id, picture) => {
    let res = confirm('Are you sure you want to delete this post?')

    if (!res) return 

    try {
        isMenu.value = false
        isDeleting.value = true
        const { data, error } = await client
            .storage
            .from('threads-c-files')
            .remove([picture])

        await useFetch(`/api/delete-post/${id}`, { method: 'DELETE' })
        emit('isDeleted', true)

        isDeleting.value = false
    } catch (error) {
        console.log(error)
        isDeleting.value = false
    }
}

const likePost = async (id) => {
    isLike.value = true
    try {
        await useFetch(`/api/like-post/`, {
            method: 'POST',
            body: {
                userId: user.value.identities[0].user_id,
                postId: id,
            }
        })
        await userStore.getAllPosts()
        isLike.value = false
    } catch (error) {
        console.log(error)
        isLike.value = false
    }
}

const unlikePost = async (id) => {
    isLike.value = true
    try {
        await useFetch(`/api/unlike-post/${id}`, { method: 'DELETE' })
        await userStore.getAllPosts()
        isLike.value = false
    } catch (error) {
        console.log(error)
        isLike.value = false
    }
}

const likeOrUnlike = () => {
    let likePostObj = null

    if (props.post.likes.length < 1) {
        likePost(props.post.id)
        return null
    } else {
        props.post.likes.forEach(like => {
            if (like.userId == user.value.identities[0].user_id && like.postId == props.post.id) {
                likePostObj = like
            }
        });
    }

    if (likePostObj) {
        unlikePost(likePostObj.id)
        return null
    }

    likePost(props.post.id)
}

const hasLikedComment = (comment) => {
    if (!user.value || !comment.likes) return false
    return comment.likes.some(like => like.userId === user.value.identities[0].user_id)
}

const likeComment = async (commentId) => {
    if (!user.value || isLikingComment.value) return
    
    try {
        isLikingComment.value = true
        
        const { data, error } = await useFetch('/api/like-comment/', {
            method: 'POST',
            body: {
                commentId: commentId,
                userId: user.value.identities[0].user_id
            }
        })

        if (error.value) {
            console.error('Error liking comment:', error.value)
            return
        }

        // Refresh posts without closing modal
        await userStore.getAllPosts()
    } catch (error) {
        console.error('Error in likeComment:', error)
    } finally {
        isLikingComment.value = false
    }
}

const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src)
    // Optionally set a fallback image
    // e.target.src = '/fallback-image.jpg'
}

const handleImageLoad = (e) => {
    console.log('Image loaded successfully:', e.target.src)
}
</script>