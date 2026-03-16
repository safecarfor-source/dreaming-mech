import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Auth
import { IncentiveAuthController } from './auth/incentive-auth.controller';
import { IncentiveAuthService } from './auth/incentive-auth.service';
import { IncentiveJwtStrategy } from './guards/incentive-jwt.strategy';

// Team
import { TeamController } from './team/team.controller';
import { TeamService } from './team/team.service';

// Manager
import { ManagerController } from './manager/manager.controller';
import { ManagerService } from './manager/manager.service';
import { ManagerSalesTargetController } from './manager/manager-sales-target.controller';
import { ManagerSalesTargetService } from './manager/manager-sales-target.service';

// Director
import { DirectorController } from './director/director.controller';
import { DirectorService } from './director/director.service';
import { SalesTargetController } from './director/sales-target.controller';
import { SalesTargetService } from './director/sales-target.service';

// Upload
import { UploadController } from './upload/upload.controller';
import { UploadService } from './upload/upload.service';

// Admin controllers
import { MappingController } from './mapping/mapping.controller';
import { ConfigController } from './config/config.controller';
import { UsersController } from './users/users.controller';
import { LogsController } from './logs/logs.controller';

// Dashboard
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'incentive-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    IncentiveAuthController,
    TeamController,
    ManagerController,
    ManagerSalesTargetController,
    DirectorController,
    SalesTargetController,
    UploadController,
    MappingController,
    ConfigController,
    UsersController,
    LogsController,
    DashboardController,
  ],
  providers: [
    IncentiveAuthService,
    IncentiveJwtStrategy,
    TeamService,
    ManagerService,
    ManagerSalesTargetService,
    DirectorService,
    SalesTargetService,
    UploadService,
    DashboardService,
  ],
})
export class IncentiveModule {}
