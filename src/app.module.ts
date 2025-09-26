import { Module } from '@nestjs/common';
import { CustomersModule } from './customers/customers.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { StatesModule } from './customers/states/states.module';
import { MotivationModule } from './motivation/motivation.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    StatesModule,
    MotivationModule,
  ],
})
export class AppModule {}
