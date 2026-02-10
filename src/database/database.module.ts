import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/features/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            migrationsRun: true,
            synchronize: false,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: Number(configService.get<string>('DB_PORT', '5432')),
          username: configService.get<string>('DB_USER', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'restaurant_pos'),
          entities: [User],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: true,
          synchronize: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
