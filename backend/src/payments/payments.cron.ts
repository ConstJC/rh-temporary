import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentsCron {
  private readonly logger = new Logger(PaymentsCron.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Cron('0 2 * * *')
  async runBillingJob() {
    this.logger.log('Billing cron started');
    try {
      await this.paymentsService.generateMonthlyBills();
      await this.paymentsService.markOverduePayments();
    } catch (err) {
      this.logger.error('Billing cron error', err);
    }
    this.logger.log('Billing cron finished');
  }
}
