<template>
    <div>
        <input v-model="userId" placeholder="userid">
        <input type="password" v-model="password" placeholder="password">
        <button v-bind:disabled="submitting" @click="onSubmit">{{this.submitting?"ログイン中":"ログイン"}}</button>
    </div>
</template>
<script lang="ts">
import { TULIP_SERVER_ENDPOINT } from "../../settings";
import {Component} from 'nuxt-property-decorator';
import Vue from 'vue';

@Component({})
export default class extends Vue{
    submitting:boolean=false;
    password:string="";
    userId:string="";
    async onSubmit() {
        this.submitting = true;
        const userId=this.userId;
        const password=this.password;
        try{
            const response=await this.$http.post(`${TULIP_SERVER_ENDPOINT}/auth`,{
                userId,
                password  
            }).then(e=>e.json());
            this.$emit("login",{...response,userId,password});
        }catch(e){
            throw e;
        }
        this.submitting=false;
    }

}
</script>