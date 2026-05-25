import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)
  const accessDenied = ref(false)

  onAuthStateChanged(auth, async (u) => {
    if (u) {
      const allowed = await getDoc(doc(db, 'allowedEmails', u.email!))
      if (!allowed.exists()) {
        await fbSignOut(auth)
        accessDenied.value = true
        user.value = null
      } else {
        accessDenied.value = false
        user.value = u
      }
    } else {
      user.value = null
    }
    isLoading.value = false
  })

  async function signIn() {
    accessDenied.value = false
    await signInWithPopup(auth, new GoogleAuthProvider())
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  return { user, isLoading, accessDenied, signIn, signOut }
})
