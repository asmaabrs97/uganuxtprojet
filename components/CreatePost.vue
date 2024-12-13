<template>
    <div id="CreatePost" class="fixed z-50 bottom-0 h-full w-full overflow-hidden">
        <div class="bg-black h-full w-full text-white overflow-auto">
            <div class="flex items-center justify-start py-4 max-w-[500px] mx-auto border-b border-b-gray-700">
                <button 
                    @click="
                        userStore.isMenuOverlay = false;
                        clearData();
                    "
                    class="rounded-full px-2"
                >
                    <Icon name="mdi:close" size="25"/>
                </button>
                <div class="text-[16px] font-semibold">New Thread</div>
            </div>

            <div id="Post" class="z-40 bottom-0 max-h-[100vh-200px] w-full px-3 max-w-[500px] mx-auto">
                <div class=" py-2 w-full">
                    <div class="flex items-center">
                        <div v-if="user" class="flex items-center text-white">
                            <img class="rounded-full h-[35px]" :src="user.identities[0].identity_data.avatar_url">
                            <div class="ml-2 font-semibold text-[18px]">{{ user.identities[0].identity_data.full_name }}</div>
                        </div>
                    </div>
                    <div class="relative flex items-center w-full">
                        <div class="w-[42px] mx-auto">
                            <div class="absolute ml-4 mt-1 top-0 w-[1px] bg-gray-700 h-full" />
                        </div>
                        <div class="bg-black rounded-lg w-[calc(100%-50px)] text w-full font-light">
                            <div class="pt-2 text-gray-300 bg-black w-full">
                                <textarea
                                    v-model="text" 
                                    style="resize: none;" 
                                    placeholder="Start a thread..." 
                                    id="textarea" 
                                    @input="adjustTextareaHeight()" 
                                    class="w-full bg-black outline-none"
                                ></textarea>
                            </div>

                            <div class=" w-full">
                                <div class="flex flex-col gap-2 py-1">

                                    <div v-if="fileDisplay">
                                        <img class="mx-auto w-full mt-2 mr-2 rounded-lg" :src="fileDisplay" />
                                    </div>
                                    
                                    <label for="fileInput">
                                        <Icon name="clarity:paperclip-line" color="#ffffff" size="25"/>
                                        <input 
                                            ref="file" 
                                            type="file" 
                                            id="fileInput"
                                            @input="onChange" 
                                            hidden 
                                            accept=".jpg,.jpeg,.png" 
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="fileDisplay" class="mt-16"></div>
            <button 
                v-if="text" 
                :disabled="isLoading"
                @click="createPost"
                class="fixed bottom-0 font-bold text-lg w-full p-2 bg-black inline-block float-right p-4 border-t border-t-gray-700"
                :class="isLoading ? 'text-gray-600' : 'text-blue-600'"
            >
                <div v-if="!isLoading">Post</div>
                <div v-else class="flex items-center gap-2 justify-center">
                    <Icon name="eos-icons:bubble-loading" size="25" /> 
                    Please wait...
                </div>
            </button>
        </div>
    </div>
</template>

<script setup>
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from '~/stores/user';
const userStore = useUserStore()

const client = useSupabaseClient()
const user = useSupabaseUser()
const config = useRuntimeConfig()

let text = ref(null)
let isLoading = ref(false)

const adjustTextareaHeight = () => {
  var textarea = document.getElementById("textarea");
  textarea.style.height = "auto"
  textarea.style.height = textarea.scrollHeight + "px"
}

let file = ref(null)
let fileDisplay = ref(null)
let fileData = ref(null)

const clearData = () => {
    text.value = null
    file.value = null
    fileDisplay.value = null
    fileData.value = null
}

const onChange = () => {
    fileDisplay.value = URL.createObjectURL(file.value.files[0])
    fileData.value = file.value.files[0]
}

const createPost = async () => {
    let dataOut = null;

    try {
        isLoading.value = true

        if (fileData.value) {
            const fileName = `${uuidv4()}.jpg`
            console.log('Uploading file:', fileName)
            
            const { data, error } = await client
                .storage
                .from('thread-clone-bucket')
                .upload(fileName, fileData.value, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'image/jpeg'
                })

            if (error) {
                console.error('Error uploading file:', error)
                isLoading.value = false
                return
            }

            console.log('File uploaded successfully:', data)
            dataOut = data
        }

        let pic = ''
        if (dataOut && dataOut.path) {
            pic = `${dataOut.path}`
            console.log('Picture path:', pic)
        }

        console.log('Creating post with data:', {
            userId: user.value.identities[0].user_id,
            name: user.value.identities[0].identity_data.full_name,
            image: user.value.identities[0].identity_data.avatar_url,
            text: text.value,
            picture: pic,
        })

        const { data: postData } = await useFetch(`/api/create-post/`, {
            method: 'POST',
            body: {
                userId: user.value.identities[0].user_id,
                name: user.value.identities[0].identity_data.full_name,
                image: user.value.identities[0].identity_data.avatar_url,
                text: text.value,
                picture: pic,
            }
        })

        if (!postData.value) {
            throw new Error('Failed to create post')
        }

        console.log('Post created successfully:', postData)
        
        // Update posts and UI state
        await userStore.getAllPosts()
        
        // Clear the form and close the overlay
        clearData()
        userStore.isMenuOverlay = false
        isLoading.value = false
    } catch (error) {
        console.error('Unexpected error:', error)
        isLoading.value = false
    }
}

// Ensure cleanup when component is closed
onBeforeUnmount(() => {
    clearData()
    isLoading.value = false
})

// Watch for overlay state changes
watch(() => userStore.isMenuOverlay, (newValue) => {
    if (!newValue) {
        clearData()
        isLoading.value = false
    }
})
</script>