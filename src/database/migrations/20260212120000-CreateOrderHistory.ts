import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderHistory20260212120000 implements MigrationInterface {
  name = 'CreateOrderHistory20260212120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "customerName" text,
        "lineUserId" text,
        "total" numeric(10,2) NOT NULL,
        "orderedAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_order_history_orderId" UNIQUE ("orderId"),
        CONSTRAINT "FK_order_history_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "order_history_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderHistoryId" uuid NOT NULL,
        "menuItemId" uuid,
        "nameSnapshot" text NOT NULL,
        "unitPriceSnapshot" numeric(10,2) NOT NULL,
        "quantity" int NOT NULL,
        "lineTotal" numeric(10,2) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_history_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_history_items_orderHistoryId" FOREIGN KEY ("orderHistoryId") REFERENCES "order_history"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_history_items_menuItemId" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query('CREATE INDEX "IDX_order_history_orderedAt" ON "order_history" ("orderedAt")');
    await queryRunner.query('CREATE INDEX "IDX_order_history_customerName" ON "order_history" ("customerName")');
    await queryRunner.query(
      'CREATE INDEX "IDX_order_history_items_orderHistoryId" ON "order_history_items" ("orderHistoryId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_order_history_items_orderHistoryId"');
    await queryRunner.query('DROP INDEX "IDX_order_history_customerName"');
    await queryRunner.query('DROP INDEX "IDX_order_history_orderedAt"');
    await queryRunner.query('DROP TABLE "order_history_items"');
    await queryRunner.query('DROP TABLE "order_history"');
  }
}
