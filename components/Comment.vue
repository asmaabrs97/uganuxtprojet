<template>
    <div class="py-2 w-full">
        <div class="flex items-center justify-between">
            <div class="flex items-center text-white">
                <img class="rounded-full h-[35px]" :src="comment.image">
                <div class="ml-2 font-semibold text-[18px]">{{ comment.name }}</div>
            </div>
            <div 
                v-if="user && user.identities && user.identities[0].user_id == comment.userId" 
                @click="isMenu = !isMenu" 
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
                        @click="deleteComment" 
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
                <div class="py-2 text-gray-300">{{ comment.text }}</div>

                <div class="flex items-center gap-4 -ml-1 mt-1">
                    <button 
                        :disabled="isLike"
                        @click="likeOrUnlike"
                        class="flex items-center gap-1 text-gray-400 hover:text-white cursor-pointer"
                    >
                        <Icon 
                            :name="hasLikedComputed ? 'ph:heart-fill' : 'ph:heart'" 
                            :color="hasLikedComputed ? '#FF0000' : '#FFFFFF'" 
                            size="17"
                        />
                        {{ comment.likes.length }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useUserStore } from '~/stores/user'
const userStore = useUserStore()

const props = defineProps({ 
    comment: Object,
    postId: Number
})

const client = useSupabaseClient()
const user = useSupabaseUser()

let isMenu = ref(false)
let isLike = ref(false)
let isDeleting = ref(false)

const emit = defineEmits(['commentDeleted'])

const hasLikedComputed = computed(() => {
    if (!user.value) return false
    return props.comment.likes.some(like => like.userId === user.value.identities[0].user_id)
})

const deleteComment = async () => {
    if (!user.value) return
    
    try {
        isDeleting.value = true
        
        await useFetch(`/api/delete-comment/`, {
            method: 'POST',
            body: {
                commentId: props.comment.id,
                userId: user.value.identities[0].user_id
            }
        })

        emit('commentDeleted')
    } catch (error) {
        console.error('Error deleting comment:', error)
    } finally {
        isDeleting.value = false
        isMenu.value = false
    }
}

const likeOrUnlike = async () => {
    if (!user.value) return
    if (isLike.value) return
    
    isLike.value = true
    
    try {
        if (!hasLikedComputed.value) {
            await useFetch(`/api/like-comment/`, {
                method: 'POST',
                body: {
                    userId: user.value.identities[0].user_id,
                    commentId: props.comment.id
                }
            })
        } else {
            await useFetch(`/api/unlike-comment/`, {
                method: 'POST',
                body: {
                    userId: user.value.identities[0].user_id,
                    commentId: props.comment.id
                }
            })
        }
        
        await userStore.getAllPosts()
    } catch (error) {
        console.error('Error liking/unliking comment:', error)
    } finally {
        isLike.value = false
    }
}
</script>
