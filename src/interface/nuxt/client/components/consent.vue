<template>
    <div>
        <h2>Concent</h2>
        <div>
        <label v-for="(scope) in allScope" :key="scope" ><input checked type="checkbox" :value="scope" v-model="selectedScope">{{scopeToString(scope)}}</label><br>
        </div>
        <button v-bind:disabled="submitting" @click="onSubmit">{{this.submitting?"承認中":"承認"}}</button>
    </div>
</template>

<script lang="ts">
import "@nuxt/http"
import Vue from 'vue';
import * as express from 'express';
import {Component, Prop} from 'nuxt-property-decorator'
import {Context } from '@nuxt/types';
import { TULIP_SERVER_GRAPHQL_ENDPOINT } from "../../settings";
import * as gql from 'gql-query-builder';
import "../../plugins/tulip";
import { ScopeType } from "../../../../models/auth/scope";
@Component({})
export default class extends Vue{
    submitting:boolean=false;
    @Prop()
    additionalRequireScopes!:ScopeType[];
    @Prop()
    scopes!:ScopeType[];
    
    allScope!:ScopeType[]
    selectedScope:ScopeType[]=[]
    async onSubmit(){
        this.submitting = true;
        this.$emit("consent",this.selectedScope);
    }
    data(){
        const allScope=[...this.additionalRequireScopes,...this.scopes];
        return {allScope,selectedScope:[...allScope]};
    }
    scopeToString(scope:ScopeType){
        return ScopeType[scope];
    }
}
</script>