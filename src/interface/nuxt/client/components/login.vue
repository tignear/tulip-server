<template>
    <div>
        <input v-model="userId" placeholder="userid">
        <input type="password" v-model="password" placeholder="password">
        <button v-bind:disabled="submitting" @click="onSubmit">{{this.submitting?"ログイン中":"ログイン"}}</button>
    </div>
</template>
<script>
export default {
    data(){
        return {
            userId:undefined,
            password:undefined,
            submitting:false
        };
    },
    mounted(){

    },
    methods: {
        async onSubmit () {
            this.submitting = true;
            const userId=this.userId;
            const password=this.password;
            try{
                const response=await this.$http.post("http://localhost:3000/auth",{
                    userId,
                    password  
                }).then(e=>e.json());
                this.$emit("login",{...response,userId,password});
            }catch(e){
            }
            this.submitting=false;
        },

    }
}
</script>