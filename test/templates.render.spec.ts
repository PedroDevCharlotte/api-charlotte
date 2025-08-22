import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

// register minimal helpers used by templates (same as EmailService)
Handlebars.registerHelper('eq', function (a: any, b: any) { return a === b; });
Handlebars.registerHelper('gt', function (a: any, b: any) { return a > b; });
Handlebars.registerHelper('lt', function (a: any, b: any) { return a < b; });
Handlebars.registerHelper('breaklines', function (text: string) {
  if (!text) return '';
  text = Handlebars.escapeExpression(text);
  text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
  return new Handlebars.SafeString(text);
});
Handlebars.registerHelper('substring', function (str: string, start: number, length?: number) {
  if (!str) return '';
  if (length !== undefined) return str.substring(start, start + length);
  return str.substring(start);
});
Handlebars.registerHelper('formatDate', function (date: Date | string) {
  if (!date) return '';
  const d = new Date(date as any);
  return d.toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });
});
Handlebars.registerHelper('formatDateShort', function (date: Date | string) {
  if (!date) return '';
  const d = new Date(date as any);
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/Mexico_City' });
});
Handlebars.registerHelper('capitalize', function (str: string) { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); });

describe('Email templates render', () => {
  const templatesDir = path.join(process.cwd(), 'src', 'Modules', 'Core', 'email', 'templates');

  // safe context matching what TicketNotificationService provides
  const safeContext: any = {
    ticket: {
      id: 123,
      ticketNumber: 'T-123',
      title: 'Prueba de ticket',
      priority: 'HIGH',
      priorityColor: '#fd7e14',
      status: 'OPEN',
      statusColor: '#007bff',
      description: 'Descripción del ticket',
      createdAt: new Date().toISOString(),
      formattedCreatedAt: new Date().toLocaleString('es-ES'),
      hasAttachments: false,
      attachmentCount: 0,
      ticketType: { name: 'Soporte' },
      createdBy: { fullName: 'Usuario', email: 'user@example.com' },
      assignedTo: { fullName: 'Asignado', email: 'asig@example.com' },
      department: { name: 'TI' },
      url: 'http://localhost:3000/apps/ticket/details/123'
    },
    user: { fullName: 'Actor', email: 'actor@example.com' },
    action: 'commented',
    message: { content: 'Contenido del mensaje' },
    content: 'Contenido del mensaje',
    attachments: [],
    customMessage: 'Mensaje personalizado',
    previousValues: {},
    recipients: { to: ['user@example.com'], cc: ['asig@example.com'] },
    systemInfo: {
      frontendUrl: 'http://localhost:3000',
      logoUrl: 'https://via.placeholder.com/200x80',
      logoData: undefined,
      year: new Date().getFullYear(),
      supportEmail: 'soporte@example.com'
    },
    recipient: 'user@example.com',
    isMainRecipient: true
  };

  it('compiles all .hbs templates without throwing', () => {
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.hbs'));
    // register partial base if exists
    const basePath = path.join(templatesDir, 'base.hbs');
    if (fs.existsSync(basePath)) {
      const baseContent = fs.readFileSync(basePath, 'utf8');
      Handlebars.registerPartial('base', baseContent);
    }

    files.forEach(file => {
      const full = path.join(templatesDir, file);
      const content = fs.readFileSync(full, 'utf8');
      const template = Handlebars.compile(content);
      expect(() => template(safeContext)).not.toThrow();
    });
  });
});
