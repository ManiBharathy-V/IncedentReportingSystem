import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';  // ✅ Changed to import type
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Controller('api/incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        },
      }),
    }),
  )
  create(
    @Body() createIncidentDto: CreateIncidentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      createIncidentDto.attachment = file.filename;
    }
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  findAll() {
    return this.incidentsService.findAll();
  }

  @Get('export')
  async exportCSV(@Res() res: Response) {
    const csv = await this.incidentsService.exportToCSV();
    res.header('Content-Type', 'text/csv');
    res.attachment(`incidents-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto) {
    return this.incidentsService.update(+id, updateIncidentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(+id);
  }
}