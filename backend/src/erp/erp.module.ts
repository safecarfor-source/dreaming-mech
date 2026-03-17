import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ErpController } from './erp.controller';
import { ErpService } from './erp.service';
import { ErpAuthService } from './erp-auth.service';
import { ErpAuthGuard } from './erp-auth.guard';

@Module({
  imports: [
    // ErpAuthService 내부에서 JwtService.sign/verify 사용
    // secret은 각 호출 시 동적으로 주입하므로 여기선 빈 값으로 등록
    JwtModule.register({}),
  ],
  controllers: [ErpController],
  providers: [ErpService, ErpAuthService, ErpAuthGuard],
  exports: [ErpService, ErpAuthService],
})
export class ErpModule {}
