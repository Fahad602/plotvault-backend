import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plot } from './plot.entity';
import { PlotSizePricing } from './plot-size-pricing.entity';
import { PlotsController } from './plots.controller';
import { PlotSizePricingController } from './plot-size-pricing.controller';
import { PlotSizePricingService } from './plot-size-pricing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plot, PlotSizePricing])],
  providers: [PlotSizePricingService],
  controllers: [PlotsController, PlotSizePricingController],
  exports: [TypeOrmModule, PlotSizePricingService],
})
export class PlotsModule {} 