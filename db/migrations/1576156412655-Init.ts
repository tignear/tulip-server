import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1576156412655 implements MigrationInterface {
    name = 'Init1576156412655'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "relying_party_redirect_uri" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_grant_type" ("id" varchar PRIMARY KEY NOT NULL, "grantType" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_response_type" ("id" varchar PRIMARY KEY NOT NULL, "responseType" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_scope" ("id" varchar PRIMARY KEY NOT NULL, "scope" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_contact" ("id" varchar PRIMARY KEY NOT NULL, "contact" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_relying_party" ("dbId" varchar PRIMARY KEY NOT NULL, "token_endpoint_auth_method" varchar NOT NULL, "clientName" varchar NOT NULL, "clientUri" varchar, "logoUri" varchar, "tos_uri" varchar, "policy_uri" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_relying_party"("dbId") SELECT "dbId" FROM "relying_party"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_relying_party" RENAME TO "relying_party"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_relying_party_redirect_uri" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar NOT NULL, "rpDbId" varchar, CONSTRAINT "FK_ea82632704049db1e8f1ee96d7d" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_relying_party_redirect_uri"("id", "uri", "rpDbId") SELECT "id", "uri", "rpDbId" FROM "relying_party_redirect_uri"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_redirect_uri"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_relying_party_redirect_uri" RENAME TO "relying_party_redirect_uri"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_relying_party_grant_type" ("id" varchar PRIMARY KEY NOT NULL, "grantType" varchar NOT NULL, "rpDbId" varchar, CONSTRAINT "FK_ec3d65c71ac6a885e79c1c178e2" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_relying_party_grant_type"("id", "grantType", "rpDbId") SELECT "id", "grantType", "rpDbId" FROM "relying_party_grant_type"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_grant_type"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_relying_party_grant_type" RENAME TO "relying_party_grant_type"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_relying_party_response_type" ("id" varchar PRIMARY KEY NOT NULL, "responseType" varchar NOT NULL, "rpDbId" varchar, CONSTRAINT "FK_08ad1471c849aeac7ac0ae0b811" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_relying_party_response_type"("id", "responseType", "rpDbId") SELECT "id", "responseType", "rpDbId" FROM "relying_party_response_type"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_response_type"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_relying_party_response_type" RENAME TO "relying_party_response_type"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_relying_party_scope" ("id" varchar PRIMARY KEY NOT NULL, "scope" varchar NOT NULL, "rpDbId" varchar, CONSTRAINT "FK_5af1d3349c5c60d56ef5214a6b6" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_relying_party_scope"("id", "scope", "rpDbId") SELECT "id", "scope", "rpDbId" FROM "relying_party_scope"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_scope"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_relying_party_scope" RENAME TO "relying_party_scope"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_relying_party_contact" ("id" varchar PRIMARY KEY NOT NULL, "contact" varchar NOT NULL, "rpDbId" varchar, CONSTRAINT "FK_b80832f8b41a5281f4943c79014" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_relying_party_contact"("id", "contact", "rpDbId") SELECT "id", "contact", "rpDbId" FROM "relying_party_contact"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_contact"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_relying_party_contact" RENAME TO "relying_party_contact"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "relying_party_contact" RENAME TO "temporary_relying_party_contact"`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_contact" ("id" varchar PRIMARY KEY NOT NULL, "contact" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "relying_party_contact"("id", "contact", "rpDbId") SELECT "id", "contact", "rpDbId" FROM "temporary_relying_party_contact"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_relying_party_contact"`, undefined);
        await queryRunner.query(`ALTER TABLE "relying_party_scope" RENAME TO "temporary_relying_party_scope"`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_scope" ("id" varchar PRIMARY KEY NOT NULL, "scope" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "relying_party_scope"("id", "scope", "rpDbId") SELECT "id", "scope", "rpDbId" FROM "temporary_relying_party_scope"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_relying_party_scope"`, undefined);
        await queryRunner.query(`ALTER TABLE "relying_party_response_type" RENAME TO "temporary_relying_party_response_type"`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_response_type" ("id" varchar PRIMARY KEY NOT NULL, "responseType" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "relying_party_response_type"("id", "responseType", "rpDbId") SELECT "id", "responseType", "rpDbId" FROM "temporary_relying_party_response_type"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_relying_party_response_type"`, undefined);
        await queryRunner.query(`ALTER TABLE "relying_party_grant_type" RENAME TO "temporary_relying_party_grant_type"`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_grant_type" ("id" varchar PRIMARY KEY NOT NULL, "grantType" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "relying_party_grant_type"("id", "grantType", "rpDbId") SELECT "id", "grantType", "rpDbId" FROM "temporary_relying_party_grant_type"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_relying_party_grant_type"`, undefined);
        await queryRunner.query(`ALTER TABLE "relying_party_redirect_uri" RENAME TO "temporary_relying_party_redirect_uri"`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party_redirect_uri" ("id" varchar PRIMARY KEY NOT NULL, "uri" varchar NOT NULL, "rpDbId" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "relying_party_redirect_uri"("id", "uri", "rpDbId") SELECT "id", "uri", "rpDbId" FROM "temporary_relying_party_redirect_uri"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_relying_party_redirect_uri"`, undefined);
        await queryRunner.query(`ALTER TABLE "relying_party" RENAME TO "temporary_relying_party"`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party" ("dbId" varchar PRIMARY KEY NOT NULL)`, undefined);
        await queryRunner.query(`INSERT INTO "relying_party"("dbId") SELECT "dbId" FROM "temporary_relying_party"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_relying_party"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_contact"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_scope"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_response_type"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_grant_type"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party_redirect_uri"`, undefined);
    }

}
