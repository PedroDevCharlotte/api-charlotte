import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NonConformity } from './Entity/non-conformity.entity';
import { ActionPlan } from './Entity/action-plan.entity';
import { FollowUp } from './Entity/follow-up.entity';
import { WhyRecord } from './Entity/why-record.entity';
import {
  CreateNonConformityDto,
  UpdateNonConformityDto,
} from './dto/non-conformity.dto';
import { User } from '../users/Entity/user.entity';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NonConformitiesService {
  constructor(
    @InjectRepository(NonConformity)
    private ncRepository: Repository<NonConformity>,
    @InjectRepository(ActionPlan)
    private actionPlanRepository: Repository<ActionPlan>,
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WhyRecord)
    private whyRecordRepository: Repository<WhyRecord>,
  ) {}

  /**
   * Función para manejar la asignación de múltiples responsables a un ActionPlan
   */
  private async manageActionPlanResponsibles(
    actionPlan: ActionPlan,
    userIds: number[],
  ): Promise<void> {
    if (userIds && userIds.length > 0) {
      // Buscar los usuarios por sus IDs
      const users = await this.userRepository.findByIds(userIds);
      actionPlan.responsibles = users;
    } else {
      actionPlan.responsibles = [];
    }
  }

  

  async create(createDto: CreateNonConformityDto): Promise<NonConformity> {
    const nc = this.ncRepository.create(
      createDto as any,
    ) as unknown as NonConformity;
    return (await this.ncRepository.save(nc as any)) as NonConformity;
  }

  async findAll(): Promise<NonConformity[]> {
    return await this.ncRepository.find({
      relations: [
        'typeOption',
        'areaResponsible',
        'motiveOption',
        'actionPlans',
        'actionPlans.responsibles',
        'followUps',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<NonConformity> {
    const nc = await this.ncRepository.findOne({
      where: { id },
      relations: [
        'actionPlans',
        'actionPlans.responsibles',
        'followUps',
        'whyRecords',
      ],
    });
    if (!nc) throw new NotFoundException('NonConformity not found');
    return nc;
  }

  async update(
    id: number,
    updateDto: UpdateNonConformityDto,
  ): Promise<NonConformity> {
    console.log('🔄 Iniciando actualización de NonConformity ID:', id);
    console.log('📋 Datos recibidos:', JSON.stringify(updateDto, null, 2));

    const nc = await this.findOne(id);
    if (!nc) {
      throw new NotFoundException('NonConformity no encontrada');
    }
    // Separar las relaciones de los campos directos
    const { actionPlans, followUps, whyRecords, ...directFields } =
      updateDto as any;

    // Actualizar solo los campos directos de la entidad principal
    console.log(
      '🔄 Actualizando campos directos de NonConformity',
      directFields,
    );
    Object.assign(nc, directFields);
    await this.ncRepository.save(nc);
    console.log('✅ Campos directos actualizados', nc);

    console.log('✅ NonConformity whyRecords:', whyRecords);
    // 🔄 MANEJAR WHY RECORDS (si se proporcionan)
    await this.handleWhyRecords(nc, id, whyRecords);
    // 🔄 MANEJAR ACTION PLANS
    // 🔄 MANEJAR ACTION PLANS
    if (actionPlans && Array.isArray(actionPlans)) {
      console.log('🔄 Procesando actionPlans:', actionPlans.length, 'planes');

      // Obtener ActionPlans existentes
      const existingActionPlans = await this.actionPlanRepository.find({
        where: { nonConformityId: id },
      });

      const processedIds: number[] = [];

      // 1. CREAR/ACTUALIZAR ACTION PLANS
      for (const plan of actionPlans) {
        if (plan.description && plan.description.trim() !== '') {
          console.log(
            '📝 Procesando plan:',
            plan.description.substring(0, 50) + '...',
          );

          // Convertir responsibleOptionIds a userIds para compatibilidad con datos legacy del frontend
          const userIds = plan.responsibleOptionIds || plan.userIds || [];
          if (
            plan.responsibleOptionId &&
            !userIds.includes(plan.responsibleOptionId)
          ) {
            userIds.push(plan.responsibleOptionId);
          }

          if (plan.id && existingActionPlans.find((ep) => ep.id === plan.id)) {
            // ACTUALIZAR ActionPlan existente
            const existingPlan = existingActionPlans.find(
              (ep) => ep.id === plan.id,
            );
            if (existingPlan) {
              existingPlan.description = plan.description;
              existingPlan.commitmentDate = plan.commitmentDate
                ? new Date(plan.commitmentDate)
                : null;
              existingPlan.type = plan.type;

              // Manejar múltiples responsables
              await this.manageActionPlanResponsibles(existingPlan, userIds);

              await this.actionPlanRepository.save(existingPlan);

              processedIds.push(existingPlan.id);
              console.log('✅ ActionPlan actualizado - ID:', existingPlan.id);
            }
          } else {
            // CREAR nuevo ActionPlan
            const newActionPlan = this.actionPlanRepository.create({
              nonConformityId: id,
              description: plan.description,
              commitmentDate: plan.commitmentDate
                ? new Date(plan.commitmentDate)
                : null,
              type: plan.type,
            });
            // Manejar múltiples responsables
            await this.manageActionPlanResponsibles(newActionPlan, userIds);

            const savedPlan =
              await this.actionPlanRepository.save(newActionPlan);

            processedIds.push(savedPlan.id);
            console.log('✅ ActionPlan creado - ID:', savedPlan.id);
          }
        } else {
          console.log('⚠️ ActionPlan ignorado por descripción vacía');
        }
      }

      // 2. ELIMINAR ActionPlans que no están en el request
      const plansToDelete = existingActionPlans.filter(
        (ep) => !processedIds.includes(ep.id),
      );
      for (const planToDelete of plansToDelete) {
        // Con many-to-many directo, TypeORM maneja automáticamente la eliminación de las relaciones
        await this.actionPlanRepository.delete(planToDelete.id);
        console.log('🗑️ ActionPlan eliminado - ID:', planToDelete.id);
      }

      console.log('📊 Resumen ActionPlans:');
      console.log(`   - Procesados: ${processedIds.length}`);
      console.log(`   - Eliminados: ${plansToDelete.length}`);
    }

    // 🔄 MANEJAR FOLLOW UPS (si se proporcionan)
    if (followUps && Array.isArray(followUps)) {
      console.log('🔄 Procesando followUps:', followUps.length, 'seguimientos');

      // Obtener followUps existentes
      const existingFollowUps = await this.followUpRepository.find({
        where: { nonConformityId: id },
      });
      const processedIds: number[] = [];

      for (const fu of followUps) {
        // Si no hay contenido relevante, ignorar (por ejemplo formulario vacío)
        const hasContent =
          (fu.date && fu.date.toString().trim() !== '') ||
          (fu.justification && fu.justification.toString().trim() !== '') ||
          (fu.verifiedBy !== undefined && fu.verifiedBy !== null) ||
          (fu.verifiedByOther && fu.verifiedByOther.toString().trim() !== '');
        if (!hasContent) {
          console.log('⚠️ FollowUp ignorado por contenido vacío');
          continue;
        }

        // Normalizar valores
        const dateVal = fu.date ? new Date(fu.date) : undefined;
        const verifiedByVal =
          typeof fu.verifiedBy === 'number' && fu.verifiedBy > -1
            ? fu.verifiedBy
            : null;
        const verifiedByOtherVal =
          fu.verifiedBy === -1
            ? fu.verifiedByOther || null
            : fu.verifiedByOther || null;
        const justificationVal = fu.justification || null;
        const isEffectiveVal = !!fu.isEffective;



        if (fu.id && existingFollowUps.find((e) => e.id === fu.id)) {
          // ACTUALIZAR followUp existente
          const existing = existingFollowUps.find((e) => e.id === fu.id);
          if (existing) {
            if (dateVal) existing.date = dateVal as Date;
            existing.verifiedBy = verifiedByVal;
            existing.verifiedByOther = verifiedByOtherVal;
            existing.justification = justificationVal as any;
            existing.isEffective = isEffectiveVal;
            existing.nonConformityId = id; // asegurar FK

            await this.followUpRepository.save(existing as any);
            processedIds.push(existing.id);
            console.log('✅ FollowUp actualizado - ID:', existing.id);
          }
        } else {
          // CREAR nuevo followUp
          const createPayload: any = {
            nonConformityId: id,
            verifiedBy: verifiedByVal,
            verifiedByOther: verifiedByOtherVal,
            justification: justificationVal,
            isEffective: isEffectiveVal,
          };
          if (dateVal) createPayload.date = dateVal;
          const newFollowUp = this.followUpRepository.create(
            createPayload as any,
          );

          const saved = await this.followUpRepository.save(newFollowUp as any);
          processedIds.push(saved.id);
          console.log('✅ FollowUp creado - ID:', saved.id);
        }
      }

      // ELIMINAR followUps que no están en el request
      const toDelete = existingFollowUps.filter(
        (ep) => !processedIds.includes(ep.id),
      );
      for (const del of toDelete) {
        await this.followUpRepository.delete(del.id);
        console.log('🗑️ FollowUp eliminado - ID:', del.id);
      }

      console.log('📊 Resumen FollowUps:');
      console.log(`   - Procesados: ${processedIds.length}`);
      console.log(`   - Eliminados: ${toDelete.length}`);
    }

    // Recargar la entidad con todas las relaciones actualizadas
    const updatedNc = await this.findOne(id);
    console.log('✅ NonConformity actualizada exitosamente');
    return updatedNc;
  }
  /**
   * Maneja la actualización, creación y eliminación de whyRecords asociados a una NonConformity.
   * @param nc Instancia de NonConformity a actualizar
   * @param ncId ID de la NonConformity
   * @param whyRecords Datos de whyRecords recibidos en el DTO
   */
  /**
   * Maneja la actualización, creación y eliminación de whyRecords asociados a una NonConformity.
   * Ahora usa el repositorio dedicado y sigue el patrón de actionPlans.
   */
  private async handleWhyRecords(
    nc: NonConformity,
    ncId: number,
    whyRecords: any[],
  ): Promise<void> {
    if (!whyRecords || !Array.isArray(whyRecords)) {
      return;
    }

    // Obtener los whyRecords existentes de la base de datos
    const existingWhyRecords = await this.whyRecordRepository.find({
      where: { nonConformityId: ncId },
    });
    const processedIds: number[] = [];
    console.log('🔄 Procesando whyRecords:', whyRecords.length, 'registros');

    // 1. CREAR/ACTUALIZAR WHYRECORDS
    for (const wr of whyRecords) {
      // Usar 'answer' como campo obligatorio (ajusta si tu modelo usa otro campo)
      if (wr.answer && wr.answer.trim() !== '') {
        console.log('✅ WhyRecord encontrado - ID:' + (wr.id || 0), wr);
        let existing: WhyRecord | undefined = undefined;
        if (wr.id) {
          console.log('🔍 Buscando WhyRecord existente por ID:', wr.id);
          existing = existingWhyRecords.find((e) => e.id === wr.id);
        } else if (wr.questionNumber && wr.type) {
          console.log(
            '🔍 Buscando WhyRecord existente por questionNumber y type:',
            wr.questionNumber,
            wr.type,
          );
          existing = existingWhyRecords.find(
            (e) => e.questionNumber === wr.questionNumber && e.type === wr.type,
          );
        }
        console.log(
          '🔍 WhyRecord existente encontrado:',
          existing ? 'Sí' : 'No',
          existing,
        );
        if (existing) {
          // Object.assign(existing, wr);
          existing.description = wr.answer;
          existing.nonConformityId = ncId; // Siempre mantener la relación
          await this.whyRecordRepository.save(existing);
          processedIds.push(existing.id);
          console.log('✅ WhyRecord actualizado - ID:' + existing.id, existing);
        } else {
          // CREAR nuevo WhyRecord
          const newWhy = this.whyRecordRepository.create({
            // ...wr,
            type: wr.type,
            questionNumber: wr.questionNumber,
            description: wr.answer,
            nonConformityId: ncId,
          });

          const savedArr = await this.whyRecordRepository.save(newWhy);
          const saved = Array.isArray(savedArr) ? savedArr[0] : savedArr;
          processedIds.push(saved.id);
          console.log('✅ WhyRecord creado - ID:', saved.id);
        }
      } else {
        console.log('⚠️ WhyRecord ignorado por respuesta vacía');
      }
    }
    console.log('📊 Resumen WhyRecords:', processedIds);
    console.log('📊 WhyRecords existentes:', existingWhyRecords);
    // 2. ELIMINAR WhyRecords que no están en el request
    const toDelete = existingWhyRecords.filter((e) => {
      console.log('❓ Evaluando eliminación de WhyRecord ID:', e.id);
      console.log('❓ Evaluando eliminación de WhyRecord ID:', typeof e.id);
      const aux = processedIds.indexOf(e.id) === -1;
      console.log('❓ Debería eliminarse:', aux);
      return aux;
    });
    console.log('📊 WhyRecords to delete:', toDelete);
    if (toDelete.length > 0) {
      for (const wr of toDelete) {
        await this.whyRecordRepository.delete(wr.id);
        console.log('🗑️ WhyRecord eliminado - ID:', wr.id);
      }
    }
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
      relations: [
        'typeOption',
        'areaResponsible',
        'motiveOption',
        'actionPlans',
        'actionPlans.responsibles',
        'followUps',
        'followUps.responsibles',
        'whyRecords',
      ],
    });

    if (!nc) {
      throw new NotFoundException('NonConformity not found');
    }

    // Leer el template HTML y reemplazar placeholders
    const fs = require('fs');
    const path = require('path');
    const pdf = require('html-pdf');

    const templatePath = path.resolve(
      __dirname,
      'templates',
      'nonconformity.html',
    );
    let filledHtml = '';
    try {
      const raw = await fs.promises.readFile(templatePath, 'utf8');
      filledHtml = this.replacePlaceholders(raw, nc);
      console.log(
        '✅ Template HTML leído y rellenado correctamente',
        filledHtml,
      );
    } catch (err) {
      // Si falla la lectura del template, usar fallback simple
      console.warn(
        '⚠️ No se pudo leer template HTML, usando fallback simple:',
        err && err.message,
      );
      filledHtml = `<h1>No Conformidad #${nc.number || ''}</h1><p>Fecha de creación: ${nc.createdAtDate ? new Date(nc.createdAtDate).toLocaleDateString('es-MX') : ''}</p><p>Área / Proceso: ${nc.areaOrProcess || ''}</p><p>Descripción del hallazgo: ${nc.findingDescription || ''}</p>`;
    }

    // Opciones para html-pdf
    const options = {
      format: 'A4',
      border: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      type: 'pdf',
      timeout: 30000,
    };

    // html-pdf solo soporta callbacks/promises, así que lo envolvemos en una promesa
    return new Promise<Buffer>((resolve, reject) => {
      pdf.create(filledHtml, options).toBuffer((err: any, buffer: Buffer) => {
        if (err) {
          console.error('❌ Error generando PDF:', err);
          reject(new Error('Error generando PDF'));
        } else {
          resolve(buffer);
        }
      });
    });
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
      return nc.motiveOption?.code === motiveName ? 'selected' : '';
    };

    // Función para generar clases CSS para checkboxes seleccionados
    const getCheckboxClass = (
      isSelected: boolean,
      baseClass: string = 'allb',
    ) => {
      return isSelected ? `${baseClass} selected-checkbox` : baseClass;
    };

    console.log('datos de nc', nc);
    // Crear objeto con todos los reemplazos
    let responsablesList = '';
    if (nc.participants && Array.isArray(nc.participants)) {
      responsablesList = nc.participants.map((p: any) => p.label).join(', ');
    }

    const replacements = {
      // Información básica
      '{{number}}': nc.number || '',
      '{{createdDate}}': formatDate(nc.createdAtDate),
      '{{detectedDate}}': formatDate(nc.detectedAt),
      '{{areaOrProcess}}': nc.areaOrProcess || '',
      '{{responsiblePerson}}': responsablesList || '',
      '{{classification}}': nc.classificationOption?.displayText || '',
      '{{category}}': nc.categoryOption?.displayText || '',

      // Tipo - contenido y clases
      '{{typeChecked}}': nc.typeOption?.code === 'SGC' ? 'selected' : '',
      '{{typeCheckboxClass}}': getCheckboxClass(
        nc.typeOption?.code === 'SGC',
        'column1 tdc allb',
      ),
      '{{typeText}}': nc.typeOption?.code || '',

      '{{otherTypeChecked}}': nc.typeOption?.code === 'SARI' ? 'selected' : '',
      '{{otherTypeCheckboxClass}}': getCheckboxClass(
        nc.typeOption?.code === 'SARI',
        'column1 tdc allb',
      ),
      '{{otherTypeText}}': nc.typeOption?.code === 'SARI' ? 'SARI' : '',

      '{{otherTypeChecked2}}': nc.otherType ? 'selected' : '',
      '{{otherType2CheckboxClass}}': getCheckboxClass(
        !!nc.otherType,
        'column1 tdc allb',
      ),
      '{{otherTypeDescription}}': nc.otherType || '',

      // Motivos (checkboxes) - contenido y clases
      '{{motiveQueja}}': checkMotive('QUEJA', 'queja'),
      '{{motiveIndicador}}': checkMotive('INDICADOR', 'indicador'),
      '{{motiveAuditoriaInterna}}': checkMotive(
        'AUDITORIA_INTERNA',
        'auditoria_interna',
      ),
      '{{motiveServicio}}': checkMotive('SERVICIO_NO_CONFORME', 'servicio'),
      '{{motiveInspeccion}}': checkMotive('INSP_ALMACENAJE', 'inspeccion'),
      '{{motiveAuditoria2}}': checkMotive(
        'AUDITORIA_SEGUNDA_TERCERA',
        'auditoria_2',
      ),
      '{{motiveProveedor}}': checkMotive('PROVEEDOR', 'proveedor'),
      '{{motiveAmbiental}}': checkMotive('EVENTO_AMBIENTAL', 'ambiental'),
      '{{motiveAccidente}}': checkMotive('ACCIDENTE', 'accidente'),
      '{{motiveIncidente}}': checkMotive('INCIDENTE', 'incidente'),
      '{{motiveParteRelacionada}}': checkMotive(
        'PARTE_RELACIONADA',
        'parte_relacionada',
      ),
      '{{motiveOtro}}': nc.otherMotive ? 'selected' : '',
      '{{otherMotive}}': nc.otherMotive || '',

      // Contenido
      '{{findingDescription}}': nc.findingDescription || '',
      '{{cause}}': nc.cause || '',
      '{{investigationReference}}': nc.investigationReference || '',
      '{{observations}}': nc.observations || '',

      // Planes de acción
      '{{firstActionPlanRow}}': `
        <tr>
          <!--  ACCION PRINCIPAL -->
          <td class="column1 tdc b2l" colspan="1">1</td>
          <td class="column2 b2r" colspan="25"> ${nc.actionPlans?.[0]?.description || ''}</td>
          <td class="column3 tdc b2r" colspan="4">${formatDate(nc.actionPlans?.[0]?.commitmentDate)}</td>
          <td class="column4 tdc b2r" colspan="5">${this.getNamesResponsibles(nc.actionPlans?.[0]?.responsibles) || ''}</td>
        </tr>
      `,
      '{{otherActionPlanRows}}': () => {
        if (nc.actionPlans?.length > 1) {
          return nc.actionPlans.slice(1).map(
            (plan: ActionPlan, index: number) => `
            <tr>
              <!--  ACCION ${index + 2} -->
              <td class="column1 tdc b2l b2b" colspan="1">${index + 2}</td>
              <td class="column2 b2r b2b" colspan="25">${plan.description || ''}</td>
              <td class="column3 tdc b2r b2b" colspan="4">${formatDate(plan.commitmentDate || '')}</td>
              <td class="column4 tdc b2r b2b" colspan="5">${this.getNamesResponsibles(plan.responsibles || '') || ''}</td>
            </tr>
          `,
          );
        } else {
          return `<tr>
              <!--  ACCION 2 -->
              <td class="column1 b2l b2b" colspan="1">2</td>
              <td class="column2 b2r b2b" colspan="25"></td>
              <td class="column3 b2r b2b" colspan="4"></td>
              <td class="column4 b2r b2b" colspan="5"></td>
            </tr>`;
        }
      },
      // Seguimientos

      '{{followUpRows}}': () => {
        if (nc.followUps && nc.followUps.length > 0) {
          return nc.followUps.map(
            (fu: FollowUp, index: number) => `
            <tr>
              <!--  SEGUIMIENTO ${index + 1} -->
              <td class="column1 tdc allb2" colspan="1">${index + 1}</td>
              <td class="column1 tdc allb2" colspan="4">${formatDate(fu.date)}</td>
              <td class="column1 tdc allb2" colspan="5">${fu.verifiedByUser ? fu.verifiedByUser?.firstName + ' ' + fu.verifiedByUser?.lastName : fu.verifiedByOther || ''}</td>
              <td class="column1 tdc allb2" colspan="18">${fu.justification || ''}</td>
              <td class="column1 tdc allb2 option ${fu.isEffective ? 'selected' : ''}" colspan="2"></td>
              <td class="column1 tdc allb2 option ${fu.isEffective === false ? 'selected' : ''}" colspan="2"></td>
            </tr>
          `,
          );
        } else {
          return `<tr>
              <!--  SEGUIMIENTO 1 -->
              <td class="column1 b2l b2b" colspan="1">1</td>
              <td class="column2 b2r b2b" colspan="6"></td>
              <td class="column3 b2r b2b" colspan="7"></td>
              <td class="column4 b2r b2b" colspan="12"></td>
              <td class="column5 tdc b2r b2b" colspan="2"></td>
              <td class="column6 tdc b2r b2b" colspan="2"></td>
            </tr>
          `;
        }
      },
      
      // Fecha de cierre
      '{{closedDate}}': formatDate(nc.closedAt),
    };

    console.log(
      '🔄 Reemplazando placeholders en la plantilla HTML',
      replacements,
    );
    // Aplicar todos los reemplazos
    let html = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      html = html.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        value,
      );
    });

    return html;
  }
  /**
   * Genera un PDF de no conformidad usando PDFKit replicando la estructura de la plantilla HTML
   */
  async generatePdfPdfkit(id: number): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const getStream = require('get-stream');
    // Obtener los datos de la no conformidad
    const nc = await this.findOne(id);
    if (!nc) throw new Error('No conformidad no encontrada');

    // Crear el documento PDF
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    const stream = doc.pipe(require('stream').PassThrough());

    // Título principal
    doc.fontSize(14).text('REPORTE DE NO CONFORMIDAD Y ACCIÓN CORRECTIVA', {
      align: 'center',
      underline: true,
    });
    doc.moveDown();

    // Aquí se debe replicar la estructura de la plantilla HTML usando tablas y estilos de PDFKit
    // Ejemplo de tabla básica (ajustar y expandir según la plantilla real)
    doc.fontSize(10);
    doc
      .text(`Código: FOR-CRI-08`, { continued: true })
      .text('   Versión: 11', { align: 'right' });
    doc.text(
      `Fecha de Elaboración: ${nc.createdAt ? new Date(nc.createdAt).toLocaleDateString() : ''}`,
    );
    doc.text(`Área y/o Proceso: ${nc.areaOrProcess || ''}`);
    doc.text(`Descripción del hallazgo: ${nc.findingDescription || ''}`);
    const responsable = nc.areaResponsible
      ? `${nc.areaResponsible.firstName || ''} ${nc.areaResponsible.lastName || ''}`.trim()
      : '';
    doc.text(`Responsable: ${responsable}`);
    doc.text(
      `Fecha de cierre: ${nc.closedAt ? new Date(nc.closedAt).toLocaleDateString() : ''}`,
    );

    // ... (Agregar más secciones y tablas según la plantilla HTML)

    doc.end();
    // Convertir el stream a buffer
    const buffer = await getStream.buffer(stream);
    return buffer;
  }

  getNamesResponsibles(responsibles: User[]): string {
    let names = '';
    if (responsibles && responsibles.length > 0) {
      names = responsibles
        .map((user) => user.firstName + ' ' + user.lastName)
        .join(' / ');
    }

    return names;
  }
  /**
   * Genera un PDF usando Puppeteer y la plantilla HTML de no conformidades
   */
  async generatePdfWithHtmlTemplate(id: number): Promise<Buffer> {
    const puppeteer = require('puppeteer');
    // Obtener los datos de la no conformidad
    const nc = await this.findOne(id);
    if (!nc) throw new Error('No conformidad no encontrada');
    // Leer la plantilla HTML
    const templatePath = path.join(
      __dirname,
      'templates',
      'nonconformity.html',
    );
    let html = fs.readFileSync(templatePath, 'utf8');
    // Aquí puedes agregar lógica para reemplazar placeholders en la plantilla con datos de nc
    // Ejemplo: html = html.replace('{{areaOrProcess}}', nc.areaOrProcess || '');
    html = this.replacePlaceholders(html, nc);

    // Renderizar el PDF con Puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdfBuffer;
  }

  /**
   * Genera un PDF usando Puppeteer y la plantilla HTML de fiveWhy
   */
  async generatePdfWithFiveWhyTemplate(id: number): Promise<Buffer> {
    const puppeteer = require('puppeteer');
    // Obtener los datos de la no conformidad
    const nc = await this.findOne(id);
    if (!nc) throw new Error('No conformidad no encontrada');
    // Leer la plantilla HTML
    const templatePath = path.join(__dirname, 'templates', 'fiveWhy.html');
    let html = fs.readFileSync(templatePath, 'utf8');
    // Aquí puedes agregar lógica para reemplazar placeholders en la plantilla con datos de nc
    // Ejemplo: html = html.replace('{{areaOrProcess}}', nc.areaOrProcess || '');
    // Renderizar el PDF con Puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdfBuffer;
  }
}
