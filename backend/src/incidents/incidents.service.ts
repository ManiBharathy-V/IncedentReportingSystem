import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
  ) {}

  create(createIncidentDto: CreateIncidentDto) {
    const incident = this.incidentsRepository.create({
      ...createIncidentDto,
      dateTime: new Date(createIncidentDto.dateTime),
    });
    return this.incidentsRepository.save(incident);
  }

  findAll() {
    return this.incidentsRepository.find({ order: { id: 'DESC' } });
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto) {
    const incident = await this.incidentsRepository.findOne({ where: { id } });
    
    // ✅ Check if incident exists
    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    
    // Update status
    if (updateIncidentDto.status) {
      incident.status = updateIncidentDto.status;
    }
    
    // Calculate and update time if closing
    if (updateIncidentDto.closedOn) {
      const start = new Date(incident.dateTime);
      const end = new Date(updateIncidentDto.closedOn);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      incident.totalTime = diffDays > 0 ? `${diffDays} days` : `${diffHours} hours`;
      incident.closedOn = end;
    }
    
    // ✅ Now incident is guaranteed to be non-null
    return this.incidentsRepository.save(incident);
  }

  async remove(id: number) {
    const result = await this.incidentsRepository.delete(id);
    
    // ✅ Check if anything was deleted
    if (result.affected === 0) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    
    return result;
  }

  async exportToCSV(): Promise<string> {
    const incidents = await this.findAll();
    const headers = ['ID', 'Reported By', 'Assigned To', 'Date & Time', 'Description', 'Status', 'Closed On', 'Total Time'];
    
    const rows = incidents.map(inc => [
      inc.id,
      inc.reportedBy,
      inc.assignedTo,
      new Date(inc.dateTime).toLocaleString(),
      inc.description,
      inc.status,
      inc.closedOn ? new Date(inc.closedOn).toLocaleString() : '',
      inc.totalTime || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}