import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1590466996250 implements MigrationInterface {
    name = 'Init1590466996250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_42278d1d5983f6a927d37fff92"`);
        await queryRunner.query(`CREATE TABLE "user_granted_scope" ("dbId" varchar PRIMARY KEY NOT NULL, "dbScope" varchar NOT NULL, "userGrantDbId" varchar)`);
        await queryRunner.query(`CREATE TABLE "temporary_user_grant" ("userDbId" varchar, "rpDbId" varchar, CONSTRAINT "FK_3476a765e22f9b70ed26ee90478" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_c51a6eabdf9087f4f30a60f1eef" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_user_grant"("userDbId", "rpDbId") SELECT "userDbId", "rpDbId" FROM "user_grant"`);
        await queryRunner.query(`DROP TABLE "user_grant"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_grant" RENAME TO "user_grant"`);
        await queryRunner.query(`CREATE TABLE "temporary_user_grant" ("userDbId" varchar, "rpDbId" varchar, "dbId" varchar PRIMARY KEY NOT NULL, CONSTRAINT "FK_3476a765e22f9b70ed26ee90478" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_c51a6eabdf9087f4f30a60f1eef" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_user_grant"("userDbId", "rpDbId") SELECT "userDbId", "rpDbId" FROM "user_grant"`);
        await queryRunner.query(`DROP TABLE "user_grant"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_grant" RENAME TO "user_grant"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_92650f739ebdfc4284433051e8" ON "user_grant" ("userDbId", "rpDbId") `);
        await queryRunner.query(`CREATE TABLE "temporary_user_granted_scope" ("dbId" varchar PRIMARY KEY NOT NULL, "dbScope" varchar NOT NULL, "userGrantDbId" varchar, CONSTRAINT "FK_68ad8beb2d92fead95c37b353d6" FOREIGN KEY ("userGrantDbId") REFERENCES "user_grant" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_user_granted_scope"("dbId", "dbScope", "userGrantDbId") SELECT "dbId", "dbScope", "userGrantDbId" FROM "user_granted_scope"`);
        await queryRunner.query(`DROP TABLE "user_granted_scope"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_granted_scope" RENAME TO "user_granted_scope"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_granted_scope" RENAME TO "temporary_user_granted_scope"`);
        await queryRunner.query(`CREATE TABLE "user_granted_scope" ("dbId" varchar PRIMARY KEY NOT NULL, "dbScope" varchar NOT NULL, "userGrantDbId" varchar)`);
        await queryRunner.query(`INSERT INTO "user_granted_scope"("dbId", "dbScope", "userGrantDbId") SELECT "dbId", "dbScope", "userGrantDbId" FROM "temporary_user_granted_scope"`);
        await queryRunner.query(`DROP TABLE "temporary_user_granted_scope"`);
        await queryRunner.query(`DROP INDEX "IDX_92650f739ebdfc4284433051e8"`);
        await queryRunner.query(`ALTER TABLE "user_grant" RENAME TO "temporary_user_grant"`);
        await queryRunner.query(`CREATE TABLE "user_grant" ("userDbId" varchar, "rpDbId" varchar, CONSTRAINT "FK_3476a765e22f9b70ed26ee90478" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_c51a6eabdf9087f4f30a60f1eef" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "user_grant"("userDbId", "rpDbId") SELECT "userDbId", "rpDbId" FROM "temporary_user_grant"`);
        await queryRunner.query(`DROP TABLE "temporary_user_grant"`);
        await queryRunner.query(`ALTER TABLE "user_grant" RENAME TO "temporary_user_grant"`);
        await queryRunner.query(`CREATE TABLE "user_grant" ("id" varchar PRIMARY KEY NOT NULL, "userDbId" varchar, "rpDbId" varchar, "scope" varchar NOT NULL, CONSTRAINT "FK_3476a765e22f9b70ed26ee90478" FOREIGN KEY ("rpDbId") REFERENCES "relying_party" ("dbId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_c51a6eabdf9087f4f30a60f1eef" FOREIGN KEY ("userDbId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "user_grant"("userDbId", "rpDbId") SELECT "userDbId", "rpDbId" FROM "temporary_user_grant"`);
        await queryRunner.query(`DROP TABLE "temporary_user_grant"`);
        await queryRunner.query(`DROP TABLE "user_granted_scope"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_42278d1d5983f6a927d37fff92" ON "user_grant" ("userDbId", "rpDbId", "scope") `);
    }

}
