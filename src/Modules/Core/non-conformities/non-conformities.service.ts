import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonConformity } from './Entity/non-conformity.entity';
import { CreateNonConformityDto, UpdateNonConformityDto } from './dto/non-conformity.dto';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NonConformitiesService {
  constructor(
    @InjectRepository(NonConformity)
    private ncRepository: Repository<NonConformity>,
  ) {}

  async create(createDto: CreateNonConformityDto): Promise<NonConformity> {
  const nc = this.ncRepository.create(createDto as any) as unknown as NonConformity;
  return (await this.ncRepository.save(nc as any)) as NonConformity;
  }

  async findAll(): Promise<NonConformity[]> {
    return await this.ncRepository.find({
      relations: ['typeOption', 'areaResponsible', 'motiveOption'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<NonConformity> {
    const nc = await this.ncRepository.findOne({ where: { id }, relations: ['actionPlans', 'followUps', 'whyRecords'] });
    if (!nc) throw new NotFoundException('NonConformity not found');
    return nc;
  }

  async update(id: number, updateDto: UpdateNonConformityDto): Promise<NonConformity> {
    const nc = await this.findOne(id);
    
    // Separar las relaciones de los campos directos
    const { actionPlans, followUps, whyRecords, ...directFields } = updateDto as any;
    
    // Actualizar solo los campos directos de la entidad principal
    Object.assign(nc, directFields);
    
    // No actualizar las relaciones automáticamente para evitar problemas de FK
    // Las relaciones se manejan por separado si es necesario
    
    await this.ncRepository.save(nc);
    return nc;
  }

  async remove(id: number): Promise<void> {
    const nc = await this.findOne(id);
    await this.ncRepository.remove(nc);
  }

  async getNextConsecutiveNumber(year: number): Promise<string> {
    // Obtener los últimos 2 dígitos del año
    const yearSuffix = year.toString().slice(-2);
    const prefix = `NC-${yearSuffix}`;
     
    // Buscar el último número consecutivo del año actual con el nuevo formato
    const lastNC = await this.ncRepository
      .createQueryBuilder('nc')
      .where('nc.number LIKE :pattern', { pattern: `${prefix}-%` })
      .orderBy('nc.number', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastNC && lastNC.number) {
      // Extraer el número consecutivo del formato NC-YY-XX
      const parts = lastNC.number.split('-');
      if (parts.length === 3) {
        const lastConsecutive = parseInt(parts[2], 10);
        nextNumber = lastConsecutive + 1;
      }
    }
    
    // Formatear con ceros a la izquierda (2 dígitos)
    const formattedNumber = nextNumber.toString().padStart(2, '0');
    return `${prefix}-${formattedNumber}`;
  }

  async cancel(id: number, reason: string): Promise<NonConformity> {
    // Buscar la no conformidad
    const nc = await this.findOne(id);
    
    // Actualizar el estado a cancelado y agregar la razón
    nc.status = 'cancelled';
    nc.cancellationReason = reason; 
    nc.cancelledAt = new Date();
    
    // Guardar los cambios
    return await this.ncRepository.save(nc);
  }

  async generatePdf(id: number): Promise<Buffer> {
    // Obtener la no conformidad con todas sus relaciones
    const nc = await this.ncRepository.findOne({
      where: { id },
      relations: ['typeOption', 'areaResponsible', 'motiveOption', 'actionPlans', 'followUps', 'whyRecords']
    });

    if (!nc) {
      throw new NotFoundException('NonConformity not found');
    }

    // Leer el template HTML - usar ruta absoluta al archivo fuente
    const templatePath = path.join(process.cwd(), 'src', 'Modules', 'Core', 'non-conformities', 'templates', 'nonconformity.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Reemplazar los placeholders con los datos reales
    htmlTemplate = this.replacePlaceholders(htmlTemplate, nc);

    // Generar PDF usando Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  private replacePlaceholders(template: string, nc: any): string {
    // Formatear fechas
    const formatDate = (date: string | Date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('es-MX');
    };

    // Función para marcar checkboxes con contenido y estilo
    const checkMotive = (motiveName: string, checkName: string) => {
      return nc.motiveOption?.name === motiveName ? '✓' : '';
    };

    // Función para generar clases CSS para checkboxes seleccionados
    const getCheckboxClass = (isSelected: boolean, baseClass: string = 'allb') => {
      return isSelected ? `${baseClass} selected-checkbox` : baseClass;
    };

    // Crear objeto con todos los reemplazos
    const replacements = {
      // Información básica
      '{{number}}': nc.number || '',
      '{{createdDate}}': formatDate(nc.createdAtDate),
      '{{detectedDate}}': formatDate(nc.detectedAt),
      '{{areaOrProcess}}': nc.areaOrProcess || '',
      '{{responsiblePerson}}': nc.areaResponsible?.name || '',
      '{{classification}}': nc.classification || '',
      '{{category}}': nc.category || '',
      
      // Tipo - contenido y clases
      '{{typeChecked}}': nc.typeOption?.name === 'SGC' ? '✓' : '',
      '{{typeCheckboxClass}}': getCheckboxClass(nc.typeOption?.name === 'SGC', 'column1 tdc allb'),
      '{{typeText}}': nc.typeOption?.name || '',
      
      '{{otherTypeChecked}}': nc.typeOption?.name === 'SARI' ? '✓' : '',
      '{{otherTypeCheckboxClass}}': getCheckboxClass(nc.typeOption?.name === 'SARI', 'column1 tdc allb'),
      '{{otherTypeText}}': nc.typeOption?.name === 'SARI' ? 'SARI' : '',
      
      '{{otherTypeChecked2}}': nc.otherType ? '✓' : '',
      '{{otherType2CheckboxClass}}': getCheckboxClass(!!nc.otherType, 'column1 tdc allb'),
      '{{otherTypeDescription}}': nc.otherType || '',
      
      // Motivos (checkboxes) - contenido y clases
      '{{motiveQueja}}': checkMotive('Queja', 'queja'),
      '{{motiveQuejaClass}}': getCheckboxClass(nc.motiveOption?.name === 'Queja', 'column1 tdc allb'),
      
      '{{motiveIndicador}}': checkMotive('Indicador', 'indicador'),
      '{{motiveIndicadorClass}}': getCheckboxClass(nc.motiveOption?.name === 'Indicador', 'column1 tdc allb'),
      
      '{{motiveAuditoriaInterna}}': checkMotive('Auditoría Interna', 'auditoria_interna'),
      '{{motiveAuditoriaInternaClass}}': getCheckboxClass(nc.motiveOption?.name === 'Auditoría Interna', 'column1 tdc allb'),
      
      '{{motiveServicio}}': checkMotive('Servicio No Conforme', 'servicio'),
      '{{motiveServicioClass}}': getCheckboxClass(nc.motiveOption?.name === 'Servicio No Conforme', 'column1 tdc allb'),
      
      '{{motiveInspeccion}}': checkMotive('Inspección Durante Almacenaje', 'inspeccion'),
      '{{motiveInspeccionClass}}': getCheckboxClass(nc.motiveOption?.name === 'Inspección Durante Almacenaje', 'column1 tdc allb'),
      
      '{{motiveAuditoria2}}': checkMotive('Auditoría de Segunda Parte', 'auditoria_2'),
      '{{motiveAuditoria2Class}}': getCheckboxClass(nc.motiveOption?.name === 'Auditoría de Segunda Parte', 'column1 tdc allb'),
      
      '{{motiveProveedor}}': checkMotive('Proveedor', 'proveedor'),
      '{{motiveProveedorClass}}': getCheckboxClass(nc.motiveOption?.name === 'Proveedor', 'column1 tdc allb'),
      
      '{{motiveAmbiental}}': checkMotive('Evento Ambiental', 'ambiental'),
      '{{motiveAmbientalClass}}': getCheckboxClass(nc.motiveOption?.name === 'Evento Ambiental', 'column1 tdc allb'),
      
      '{{motiveAccidente}}': checkMotive('Accidente', 'accidente'),
      '{{motiveAccidenteClass}}': getCheckboxClass(nc.motiveOption?.name === 'Accidente', 'column1 tdc allb'),
      
      '{{motiveIncidente}}': checkMotive('Incidente', 'incidente'),
      '{{motiveIncidenteClass}}': getCheckboxClass(nc.motiveOption?.name === 'Incidente', 'column1 tdc allb'),
      
      '{{motiveParteRelacionada}}': checkMotive('Parte Relacionada', 'parte_relacionada'),
      '{{motiveParteRelacionadaClass}}': getCheckboxClass(nc.motiveOption?.name === 'Parte Relacionada', 'column1 tdc allb'),
      
      '{{motiveOtro}}': nc.otherMotive ? '✓' : '',
      '{{motiveOtroClass}}': getCheckboxClass(!!nc.otherMotive, 'column1 tdc allb'),
      '{{otherMotive}}': nc.otherMotive || '',
      
      // Contenido
      '{{findingDescription}}': nc.findingDescription || '',
      '{{cause}}': nc.cause || '',
      '{{investigationReference}}': nc.investigationReference || '',
      '{{observations}}': nc.observations || '',
      
      // Planes de acción
      '{{actionPlan1}}': nc.actionPlans?.[0]?.action || '',
      '{{actionDate1}}': formatDate(nc.actionPlans?.[0]?.dueDate),
      '{{actionResponsible1}}': nc.actionPlans?.[0]?.responsibleArea || '',
      '{{actionPlan2}}': nc.actionPlans?.[1]?.action || '',
      '{{actionDate2}}': formatDate(nc.actionPlans?.[1]?.dueDate),
      '{{actionResponsible2}}': nc.actionPlans?.[1]?.responsibleArea || '',
      
      // Seguimientos
      '{{followUpDate1}}': nc.followUps?.[0] ? formatDate(nc.followUps[0].date) : '',
      '{{followUpVerifier1}}': nc.followUps?.[0]?.verifiedByUser?.name || '',
      '{{followUpJustification1}}': nc.followUps?.[0]?.justification || '',
      '{{followUpEffective1Yes}}': nc.followUps?.[0]?.isEffective ? '✓' : '',
      '{{followUpEffective1No}}': nc.followUps?.[0]?.isEffective === false ? '✓' : '',
      
      '{{followUpDate2}}': nc.followUps?.[1] ? formatDate(nc.followUps[1].date) : '',
      '{{followUpVerifier2}}': nc.followUps?.[1]?.verifiedByUser?.name || '',
      '{{followUpJustification2}}': nc.followUps?.[1]?.justification || '',
      '{{followUpEffective2Yes}}': nc.followUps?.[1]?.isEffective ? '✓' : '',
      '{{followUpEffective2No}}': nc.followUps?.[1]?.isEffective === false ? '✓' : '',
      
      '{{followUpDate3}}': nc.followUps?.[2] ? formatDate(nc.followUps[2].date) : '',
      '{{followUpVerifier3}}': nc.followUps?.[2]?.verifiedByUser?.name || '',
      '{{followUpJustification3}}': nc.followUps?.[2]?.justification || '',
      '{{followUpEffective3Yes}}': nc.followUps?.[2]?.isEffective ? '✓' : '',
      '{{followUpEffective3No}}': nc.followUps?.[2]?.isEffective === false ? '✓' : '',
      
      '{{followUpDate4}}': nc.followUps?.[3] ? formatDate(nc.followUps[3].date) : '',
      '{{followUpVerifier4}}': nc.followUps?.[3]?.verifiedByUser?.name || '',
      '{{followUpJustification4}}': nc.followUps?.[3]?.justification || '',
      '{{followUpEffective4Yes}}': nc.followUps?.[3]?.isEffective ? '✓' : '',
      '{{followUpEffective4No}}': nc.followUps?.[3]?.isEffective === false ? '✓' : '',
      
      // Fecha de cierre
      '{{closedDate}}': formatDate(nc.closedAt)
    };

    // Aplicar todos los reemplazos
    let html = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      html = html.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return html;
  }
}
