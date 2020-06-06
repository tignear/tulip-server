import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1591320754876 implements MigrationInterface {
    name = 'Init1591320754876'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_authorization_code" ("code" varchar PRIMARY KEY NOT NULL, "userDbId" varchar, "rpDbId" varchar, "redirectUri" varchar NOT NULL, "nonce" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "lastUsedAt" datetime, CONSTRAINT "FK_9f5b318f2fb474fdbc1e62e1b6c" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_6b56ad33c58e27de579a0bdc99e" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_authorization_code"("code", "userDbId", "rpDbId", "redirectUri", "nonce", "createdAt") SELECT "code", "userDbId", "rpDbId", "redirectUri", "nonce", "createdAt" FROM "authorization_code"`);
        await queryRunner.query(`DROP TABLE "authorization_code"`);
        await queryRunner.query(`ALTER TABLE "temporary_authorization_code" RENAME TO "authorization_code"`);
        await queryRunner.query(`DROP INDEX "IDX_c31d0a2f38e6e99110df62ab0a"`);
        await queryRunner.query(`CREATE TABLE "temporary_refresh_token" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "relyingPartyDbId" varchar, "userDbId" varchar, "token" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "code" varchar NOT NULL, CONSTRAINT "FK_23690e8dd31e920bc81f37d0135" FOREIGN KEY ("relyingPartyDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_f5fc6944d151b6044c08afe86b7" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_refresh_token"("id", "relyingPartyDbId", "userDbId", "token", "createdAt") SELECT "id", "relyingPartyDbId", "userDbId", "token", "createdAt" FROM "refresh_token"`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
        await queryRunner.query(`ALTER TABLE "temporary_refresh_token" RENAME TO "refresh_token"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c31d0a2f38e6e99110df62ab0a" ON "refresh_token" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_24a07d97a2df7596d0ed5ade76" ON "refresh_token" ("code") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_24a07d97a2df7596d0ed5ade76"`);
        await queryRunner.query(`DROP INDEX "IDX_c31d0a2f38e6e99110df62ab0a"`);
        await queryRunner.query(`ALTER TABLE "refresh_token" RENAME TO "temporary_refresh_token"`);
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "relyingPartyDbId" varchar, "userDbId" varchar, "token" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_23690e8dd31e920bc81f37d0135" FOREIGN KEY ("relyingPartyDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_f5fc6944d151b6044c08afe86b7" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "refresh_token"("id", "relyingPartyDbId", "userDbId", "token", "createdAt") SELECT "id", "relyingPartyDbId", "userDbId", "token", "createdAt" FROM "temporary_refresh_token"`);
        await queryRunner.query(`DROP TABLE "temporary_refresh_token"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c31d0a2f38e6e99110df62ab0a" ON "refresh_token" ("token") `);
        await queryRunner.query(`ALTER TABLE "authorization_code" RENAME TO "temporary_authorization_code"`);
        await queryRunner.query(`CREATE TABLE "authorization_code" ("code" varchar PRIMARY KEY NOT NULL, "userDbId" varchar, "rpDbId" varchar, "redirectUri" varchar NOT NULL, "nonce" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_9f5b318f2fb474fdbc1e62e1b6c" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_6b56ad33c58e27de579a0bdc99e" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "authorization_code"("code", "userDbId", "rpDbId", "redirectUri", "nonce", "createdAt") SELECT "code", "userDbId", "rpDbId", "redirectUri", "nonce", "createdAt" FROM "temporary_authorization_code"`);
        await queryRunner.query(`DROP TABLE "temporary_authorization_code"`);
    }

}
