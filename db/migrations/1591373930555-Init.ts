import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1591373930555 implements MigrationInterface {
    name = 'Init1591373930555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_authorization_code" ("code" varchar PRIMARY KEY NOT NULL, "userDbId" varchar, "rpDbId" varchar, "redirectUri" varchar NOT NULL, "nonce" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "lastUsedAt" datetime, CONSTRAINT "FK_9f5b318f2fb474fdbc1e62e1b6c" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_6b56ad33c58e27de579a0bdc99e" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_authorization_code"("code", "userDbId", "rpDbId", "redirectUri", "nonce", "createdAt", "lastUsedAt") SELECT "code", "userDbId", "rpDbId", "redirectUri", "nonce", "createdAt", "lastUsedAt" FROM "authorization_code"`);
        await queryRunner.query(`DROP TABLE "authorization_code"`);
        await queryRunner.query(`ALTER TABLE "temporary_authorization_code" RENAME TO "authorization_code"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "authorization_code" RENAME TO "temporary_authorization_code"`);
        await queryRunner.query(`CREATE TABLE "authorization_code" ("code" varchar PRIMARY KEY NOT NULL, "userDbId" varchar, "rpDbId" varchar, "redirectUri" varchar NOT NULL, "nonce" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "lastUsedAt" datetime, CONSTRAINT "FK_9f5b318f2fb474fdbc1e62e1b6c" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_6b56ad33c58e27de579a0bdc99e" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "authorization_code"("code", "userDbId", "rpDbId", "redirectUri", "nonce", "createdAt", "lastUsedAt") SELECT "code", "userDbId", "rpDbId", "redirectUri", "nonce", "createdAt", "lastUsedAt" FROM "temporary_authorization_code"`);
        await queryRunner.query(`DROP TABLE "temporary_authorization_code"`);
    }

}
