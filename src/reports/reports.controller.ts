import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  create(@Body() dto: CreateReportDto, @Req() req: any) {
    const userId = req.user.userId; // from JWT payload
    return this.reportsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update report by ID' })
  update(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reportsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report by ID' })
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
