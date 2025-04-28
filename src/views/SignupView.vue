<template>
  <div class="signup-page">
    <SignupForm />
  </div>
</template>

<script>
import SignupForm from '@/components/SignupForm.vue'

export default {
  name: 'SignupView',
  components: {
    SignupForm,
  },
}
</script>
