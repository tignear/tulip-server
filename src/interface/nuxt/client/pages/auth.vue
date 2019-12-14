<template>
  <div>
    <h1>This is auth page</h1>
    <Error v-if="err" v-bind:status="status"></Error>
    <Login v-if="status==='login_required'" v-bind:status="status"></Login>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as express from 'express';
import {Context } from '@nuxt/types'
import Error from '../components/error.vue';
import Login from '../components/error.vue'

export default{
  async asyncData(context:Context){
    const res=<express.Response>context.res;
    console.log(res.locals)
    const status=res.locals.status;
    const err=status==="invalid_request";
    return {status,err};
  },
  data(){
    return {err:false,status:"loading"}
  },
  components:{
    Error,Login
  }
}
</script>