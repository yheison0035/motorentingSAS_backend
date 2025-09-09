import { Module } from '@nestjs/common';
import { AdvisorsModule } from './advisors/advisors.module';
import { CustomersModule } from './customers/customers.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { StatesModule } from './customers/states/states.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    CustomersModule,
    AdvisorsModule,
    AuthModule,
    StatesModule,
  ],
})
export class AppModule {}
