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

// GD (극동 PsimCarS)
import { GdController } from './gd/gd.controller';
import { GdService } from './gd/gd.service';

// Auto Calc (인센티브 자동 계산)
import { AutoCalcController } from './auto-calc/auto-calc.controller';
import { AutoCalcService } from './auto-calc/auto-calc.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
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
    GdController,
    AutoCalcController,
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
    GdService,
    AutoCalcService,
  ],
})
export class IncentiveModule {}
