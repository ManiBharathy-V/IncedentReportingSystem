export class CreateIncidentDto {
  reportedBy: string;
  assignedTo: string;
  dateTime: string;
  description: string;
  attachment?: string;
}