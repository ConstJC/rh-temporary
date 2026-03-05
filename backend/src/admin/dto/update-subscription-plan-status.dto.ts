import { IsIn } from 'class-validator';

export class UpdateSubscriptionPlanStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'SUSPENDED';
}
