// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        posts: [],
        isMenuOverlay: false,
        isLogoutOverlay: false,
        loading: false,
    }),

    actions: {
        async getAllPosts() {
            try {
                this.loading = true
                const { data, error } = await useFetch('/api/get-all-posts')
                
                if (error.value) {
                    console.error('Error fetching posts:', error.value)
                    return
                }
                
                this.posts = data.value || []
            } catch (error) {
                console.error('Error in getAllPosts:', error)
            } finally {
                this.loading = false
            }
        },

        async getPostById(postId) {
            return this.posts.find(post => post.id === postId)
        },
    },
})