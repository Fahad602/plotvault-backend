import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plot, PlotStatus } from './plot.entity';

@Controller('plots')
export class PlotsController {
  constructor(
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
  ) {}

  @Get()
  async getAllPlots(
    @Query('size_marla') sizeMarla?: string,
    @Query('phase') phase?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const queryBuilder = this.plotRepository.createQueryBuilder('plot');

    if (sizeMarla) {
      queryBuilder.andWhere('plot.sizeMarla = :sizeMarla', { sizeMarla: parseInt(sizeMarla) });
    }

    if (phase) {
      queryBuilder.andWhere('plot.phase = :phase', { phase });
    }

    if (status) {
      queryBuilder.andWhere('plot.status = :status', { status });
    }

    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;
    
    const [plots, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    return {
      data: plots,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':id')
  async getPlotById(@Param('id') id: string) {
    return await this.plotRepository.findOne({ where: { id } });
  }

  @Post()
  async createPlot(@Body() createPlotDto: any) {
    const plot = this.plotRepository.create(createPlotDto);
    return await this.plotRepository.save(plot);
  }

  @Put(':id')
  async updatePlot(@Param('id') id: string, @Body() updatePlotDto: any) {
    await this.plotRepository.update(id, updatePlotDto);
    return await this.plotRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async deletePlot(@Param('id') id: string) {
    await this.plotRepository.delete(id);
    return { message: 'Plot deleted successfully' };
  }

  @Put(':id/status')
  async updatePlotStatus(@Param('id') id: string, @Body() body: { status: PlotStatus }) {
    await this.plotRepository.update(id, { status: body.status });
    return await this.plotRepository.findOne({ where: { id } });
  }
} 