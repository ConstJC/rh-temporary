import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { UserTypes } from '../auth/decorators/user-type.decorator';
import { UserType } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgMemberGuard } from '../property-groups/guards/org-member.guard';
import { PaymentsService } from './payments.service';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { RecordManualPaymentDto } from './dto/record-manual-payment.dto';

@ApiTags('Payments')
@Controller()
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('property-groups/:pgId/payments')
  @UseGuards(UserTypeGuard, OrgMemberGuard)
  @UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'List payments for property group' })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllByPropertyGroup(
    @Param('pgId') pgId: string,
    @Query() query: ListPaymentsQueryDto,
  ) {
    const { page, limit, status, leaseId, dateFrom, dateTo } = query;
    return this.paymentsService.findAllByPropertyGroup(
      pgId,
      { page, limit },
      { status, leaseId, dateFrom, dateTo },
    );
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment detail (landlord or tenant)' })
  @ApiResponse({
    status: 200,
    description: 'Payment with addon bills and transactions',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.findOne(id, user.sub);
  }

  @Patch('payments/:id/manual')
  @UseGuards(UserTypeGuard)
  @UserTypes(UserType.LANDLORD, UserType.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Record manual payment (landlord)' })
  @ApiResponse({ status: 200, description: 'Payment updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 422, description: 'Payment already PAID' })
  async recordManual(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordManualPaymentDto,
  ) {
    return this.paymentsService.recordManualPayment(id, user.sub, dto);
  }
}
