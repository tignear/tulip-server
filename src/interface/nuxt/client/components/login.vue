<template>
    <div>
        <input v-model="userId" placeholder="userid">
        <input type="password" v-model="password" placeholder="password">
        <button v-bind:disabled="submitting" @click="onSubmit">{{this.submitting?"ログイン中":"ログイン"}}</button>
    </div>
</template>
<script>
import axios from "axios"
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
            try{
                const response=await axios.post("http://localhost:3000/auth",{
                    userId:this.userId,
                    password:this.password
                });
                this.$emit("onLogin");
            }catch(e){
            }
            this.submitting=false;
        },
    }
}
</script>