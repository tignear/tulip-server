import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1576168876187 implements MigrationInterface {
    name = 'Init1576168876187'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "temporary_relying_party" ("dbId" varchar PRIMARY KEY NOT NULL, "clientName" varchar NOT NULL, "clientUri" varchar, "logoUri" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_relying_party"("dbId", "clientName", "clientUri", "logoUri") SELECT "dbId", "clientName", "clientUri", "logoUri" FROM "relying_party"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_relying_party" RENAME TO "relying_party"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_relying_party" ("dbId" varchar PRIMARY KEY NOT NULL, "clientName" varchar NOT NULL, "clientUri" varchar, "logoUri" varchar, "tokenEndpointAuthMethod" varchar NOT NULL, "tosUri" varchar, "policyUri" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_relying_party"("dbId", "clientName", "clientUri", "logoUri") SELECT "dbId", "clientName", "clientUri", "logoUri" FROM "relying_party"`, undefined);
        await queryRunner.query(`DROP TABLE "relying_party"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_relying_party" RENAME TO "relying_party"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "relying_party" RENAME TO "temporary_relying_party"`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party" ("dbId" varchar PRIMARY KEY NOT NULL, "clientName" varchar NOT NULL, "clientUri" varchar, "logoUri" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "relying_party"("dbId", "clientName", "clientUri", "logoUri") SELECT "dbId", "clientName", "clientUri", "logoUri" FROM "temporary_relying_party"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_relying_party"`, undefined);
        await queryRunner.query(`ALTER TABLE "relying_party" RENAME TO "temporary_relying_party"`, undefined);
        await queryRunner.query(`CREATE TABLE "relying_party" ("dbId" varchar PRIMARY KEY NOT NULL, "token_endpoint_auth_method" varchar NOT NULL, "clientName" varchar NOT NULL, "clientUri" varchar, "logoUri" varchar, "tos_uri" varchar, "policy_uri" varchar)`, undefined);
        await queryRunner.query(`INSERT INTO "relying_party"("dbId", "clientName", "clientUri", "logoUri") SELECT "dbId", "clientName", "clientUri", "logoUri" FROM "temporary_relying_party"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_relying_party"`, undefined);
    }

}
