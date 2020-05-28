<template>
    <div>
        Concent
        <label v-for="(scope, index) in seletedScopeString" :key="index"><input type="checkbox">{{scope}}</label>

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
    
    seletedScope!:ScopeType[]
    async onSubmit(){
        this.submitting = true;
        this.$emit("consent")
    }
    data(){
        return {seletedScope:[...this.additionalRequireScopes,...this.scopes]};
    }
    
    get seletedScopeString(){
        return [...this.additionalRequireScopes,...this.scopes].map(e=>ScopeType[e])
    }
}
</script>