import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '@/features/users/entities/user.entity';
import { MenuItem } from '@/features/menu/entities/menu.entity';

function numberFromEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST ?? 'localhost',
  port: process.env.DATABASE_URL ? undefined : numberFromEnv(process.env.DB_PORT, 5432),
  username: process.env.DATABASE_URL ? undefined : process.env.DB_USER ?? 'postgres',
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME ?? 'restaurant_pos',
  entities: [User, MenuItem],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
