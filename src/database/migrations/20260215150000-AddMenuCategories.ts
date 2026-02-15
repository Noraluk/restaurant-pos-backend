import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuCategories20260215150000 implements MigrationInterface {
  name = 'AddMenuCategories20260215150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "menu_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_menu_categories_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`ALTER TABLE "menu_items" ADD COLUMN "categoryId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      ADD CONSTRAINT "FK_menu_items_categoryId"
      FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id")
      ON DELETE SET NULL
    `);
    await queryRunner.query('CREATE INDEX "IDX_menu_items_categoryId" ON "menu_items" ("categoryId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_menu_items_categoryId"');
    await queryRunner.query('ALTER TABLE "menu_items" DROP CONSTRAINT "FK_menu_items_categoryId"');
    await queryRunner.query('ALTER TABLE "menu_items" DROP COLUMN "categoryId"');
    await queryRunner.query('DROP TABLE "menu_categories"');
  }
}
