import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrders20260212100000 implements MigrationInterface {
  name = 'CreateOrders20260212100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" text NOT NULL DEFAULT 'PENDING',
        "customerName" text,
        "lineUserId" text,
        "note" text,
        "total" numeric(10,2) NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_orders_status" CHECK ("status" IN ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "menuItemId" uuid,
        "nameSnapshot" text NOT NULL,
        "unitPriceSnapshot" numeric(10,2) NOT NULL,
        "quantity" int NOT NULL,
        "lineTotal" numeric(10,2) NOT NULL,
        "note" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_menuItemId" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query('CREATE INDEX "IDX_orders_status_createdAt" ON "orders" ("status", "createdAt")');
    await queryRunner.query('CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_order_items_orderId"');
    await queryRunner.query('DROP INDEX "IDX_orders_status_createdAt"');
    await queryRunner.query('DROP TABLE "order_items"');
    await queryRunner.query('DROP TABLE "orders"');
  }
}
