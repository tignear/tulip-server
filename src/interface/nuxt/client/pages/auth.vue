<template>
  <div>
    <h1>This is auth page</h1>
    <ErrorC v-if="err" v-bind:status="status"></ErrorC>
    <Login v-if="status==='login_required'" @login="onLogin"></Login>
    <Consent
      v-if="status==='consent_required'"
      :scopes="scopes"
      :additional-require-scopes="additionalRequireScopes"
      @consent="onConsent"
    ></Consent>
  </div>
</template>

<script lang="ts">
import "@nuxt/http";
import "../../plugins/tulip";
import Vue from "vue";
import * as express from "express";
import { Component, Prop } from "nuxt-property-decorator";
import { Context } from "@nuxt/types";
import ErrorC from "../components/error.vue";
import Login from "../components/login.vue";
import Consent from "../components/consent.vue";
import { TULIP_SERVER_GRAPHQL_ENDPOINT } from "../../settings";
import * as gql from "gql-query-builder";
import { ScopeType, stringToEnum } from "../../../../models/auth/scope";
import Cookies from "js-cookie";
const scopeMap: { [k in string]: string | undefined } = {
  openid: "OpenId"
};
const responseTypeMap: { [k in string]: string | undefined } = {
  code: "Code"
};
@Component({
  components: { ErrorC, Login, Consent }
})
export default class extends Vue {
  err!: boolean;
  status!: string;
  additionalRequireScopes: ScopeType[] = [];
  scopes: ScopeType[] = [];
  async asyncData(context: Context) {
    const state = context.route.query.state;
    const redirect_uri = context.route.query.redirect_uri;
    const client_id = context.route.query.client_id;
    const scope = context.route.query.scope;
    if (
      !state ||
      !scope ||
      !client_id ||
      !redirect_uri ||
      Array.isArray(state) ||
      Array.isArray(redirect_uri) ||
      Array.isArray(client_id) ||
      Array.isArray(scope)
    ) {
      return { status: "invalid_request", err: true };
    }
    if (process.server) {
      const res = <express.Response>context.res;
      const status = res.locals.status;
      const additionalRequireScopes = res.locals.additionalRequireScopes ?? [];
      const err = status === "invalid_request";
      return { status, err, additionalRequireScopes };
    }
    const url = new URL(location.href);
    url.searchParams.set("prompt", "none");
    const r = await context.$http.get(url.href, {
      redirect: "manual",
      credentials: "include"
    });
  }

  async onLogin({
    accessToken,
    userId,
  }: {
    userId:string;
    accessToken: string;
  }) {
    this.$store.commit("auth/SET_ACCESS_TOKEN", accessToken);
    const query=`query($userId:ID!,$rpId:ID) {
      node(id: $userId) {
        ... on User {
          name
          userGrant(input:{
              rpId:$rpId
          } ){
            rp{
              clientName
            }
            scope
          }
        }
      }
    }`;
        const rpId = this.$route.query.client_id as string;

    const ret= await this.$tulip
      .post(TULIP_SERVER_GRAPHQL_ENDPOINT, {query,variables:{rpId,userId}})
      .then(e => e.json());
    this.scopes=stringToEnum(ret.data.node.userGrant[0].scope);
    const scope = this.$route.query.scope as string;
    this.additionalRequireScopes=(scope.split(" ").map(e=>stringToEnum(e)).filter(e=>e!==undefined) as ScopeType[]).filter(e=>!this.scopes.includes(e))
    this.status = "consent_required";
  }
  async onConsent(scope:ScopeType[]) {
    const state = this.$route.query.state as string;
    const redirectUri = this.$route.query.redirect_uri as string;
    const clientId = this.$route.query.client_id as string;
    //const scope = this.$route.query.scope as string;
    const responseType = this.$route.query.response_type as string;
    const q = gql.mutation({
      operation: "authorization",
      variables: {
        input: {
          name: "input",
          type: "AuthorizationInput",
          value: {
            state,
            redirectUri,
            clientId,
            scope: scope.map(e=>ScopeType[e]),
            responseType: responseType
              .split(" ")
              .map(e => responseTypeMap[e])
              .filter(e => !!e)
          },
          required: true
        }
      },
      fields: [
        "__typename",
        { "... on CodeFlowAuthorizationResponse": ["code", "state","scope"] }
      ]
    });

    const res = await this.$tulip
      .post(TULIP_SERVER_GRAPHQL_ENDPOINT, q)
      .then(e => e.json());
    if (res.errors) {
      return;
    }
    const data = res.data.authorization;
    const { __typename } = data;
    switch (__typename) {
      case "CodeFlowAuthorizationResponse":
        const { state, code ,scope:retScope} = data;
        location.href = new URL(
          `?state=${state}&code=${code}&scope=${retScope.map((e:string)=>e.toLowerCase()).join(" ")}`,
          redirectUri
        ).href;
        return;
    }
  }
  mounted(){
    this.$store.commit("auth/SET_ACCESS_TOKEN",Cookies.get("accessToken"));
  }
}
</script>
<style>
</style>