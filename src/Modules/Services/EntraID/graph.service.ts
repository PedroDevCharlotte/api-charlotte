import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EntraIdTokenService } from './entra-id-token.service';
import { Response } from 'express';
import * as path from 'path';

@Injectable()
export class GraphService {
  private readonly graphUrl = 'https://graph.microsoft.com/v1.0';

  constructor(
    private readonly httpService: HttpService,
    private readonly entraIdTokenService: EntraIdTokenService,
  ) {}

  private async getAuthHeaders(): Promise<{ Authorization: string }> {
    const token = await this.entraIdTokenService.getToken();
    return { Authorization: `Bearer ${token}` };
  }

  // 1. Consultar un usuario por email
  async getUserByEmail(email: string): Promise<any> {
    const url = `${this.graphUrl}/users/?$filter=mail eq '${email}'`;
    const headers = await this.getAuthHeaders();
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers }),
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al consultar usuario en Graph',
      );
    }
  }

  // 2. Validar si existe una carpeta
  async validateFolder(userId: string, folderPath: string): Promise<any> {
    const url = `${this.graphUrl}/users/${userId}/drive/root:/${folderPath}`;
    const headers = await this.getAuthHeaders();
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers }),
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null; // No existe
      }
      throw new InternalServerErrorException(
        'Error al validar carpeta en Graph',
      );
    }
  }

  // 3. Crear una carpeta
  /**
   * Crear una carpeta. Si se proporciona parentPath, se crea como hijo de esa ruta.
   * parentPath debe ser una ruta relativa a root sin slashes iniciales, ej: "FilesConectaCCI/Tickets"
   */
  async createFolder(userId: string, folderName: string, parentPath?: string): Promise<any> {
    console.log('Creating folder:', folderName, 'for user:', userId, 'parentPath:', parentPath);
    const url = parentPath
      ? `${this.graphUrl}/users/${userId}/drive/root:/${parentPath}:/children`
      : `${this.graphUrl}/users/${userId}/drive/root/children`;
    const headers = await this.getAuthHeaders();
    const body = {
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename',
    };
    try {
      const response = await firstValueFrom(this.httpService.post(url, body, { headers }));
      return response.data;
    } catch (error) {
      console.error('Error creating folder in Graph:', error?.response?.data || error);
      throw new InternalServerErrorException('Error al crear carpeta en Graph');
    }
  }

  /**
   * Asegura que exista la ruta completa de carpetas indicada (relativa a root).
   * Ejemplo: ensureFolderPath(userId, 'FilesConectaCCI/Tickets/SOP-2025-0011')
   * Devuelve los metadatos de la última carpeta.
   */
  async ensureFolderPath(userId: string, folderPath: string): Promise<any> {
    const clean = folderPath.replace(/^\/+|\/+$/g, '');
    if (!clean) return null;
    const parts = clean.split('/').filter(Boolean);
    let currentPath = '';
    let lastMetadata: any = null;

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      // validar si existe
      const exists = await this.validateFolder(userId, currentPath);
      if (exists) {
        lastMetadata = exists;
        continue;
      }

      // crear en el parent (sin el segmento actual)
      const parent = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : undefined;
      lastMetadata = await this.createFolder(userId, part, parent);
    }

    return lastMetadata;
  }

  // 4. Subir un archivo
  async uploadFile(
    userId: string,
    filePath: string,
    fileBuffer: Buffer,
  ): Promise<any> {
    // Antes de subir, asegurarnos que la carpeta padre exista
    const posixPath = filePath.split('\\').join('/');
    const dir = path.posix.dirname(posixPath);
    if (dir && dir !== '.') {
      await this.ensureFolderPath(userId, dir);
    }

    const url = `${this.graphUrl}/users/${userId}/drive/root:/${posixPath}:/content`;
    const headers = await this.getAuthHeaders();
    headers['Content-Type'] = 'application/octet-stream';
    try {
      const response = await firstValueFrom(this.httpService.put(url, fileBuffer, { headers }));
      return response.data;
    } catch (error) {
      console.error('Error uploading file to Graph:', error?.response?.data || error);
      throw new InternalServerErrorException('Error al subir archivo en Graph');
    }
  }

  /**
   * Helper para subir archivos dentro de la estructura FilesConectaCCI/{module}/{ticket?}/{filename}
   * module: por ejemplo 'Banners' o 'Tickets'
   * ticketNumber: opcional, por ejemplo 'SOP-2025-0011'
   */
  async uploadToModule(
    userId: string,
    moduleName: string,
    fileName: string,
    fileBuffer: Buffer,
    ticketNumber?: string,
  ): Promise<any> {
    const base = 'FilesConectaCCI';
    let folderPath = `${base}/${moduleName}`;
    if (ticketNumber) folderPath = `${folderPath}/${ticketNumber}`;
    // garantizar ruta
    await this.ensureFolderPath(userId, folderPath);
    const remotePath = `${folderPath}/${fileName}`;
    return this.uploadFile(userId, remotePath, fileBuffer);
  }

  // 5. Obtener preview de un archivo
  async getFilePreview(userId: string, itemId: string): Promise<any> {
    const url = `${this.graphUrl}/users/${userId}/drive/items/${itemId}/preview`;
    const headers = await this.getAuthHeaders();
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {}, { headers }),
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener preview del archivo en Graph',
      );
    }
  }

  /**
   * Devuelve la URL (endpoint de Graph) que sirve el contenido del archivo.
   * El cliente puede usar esa URL con un token válido, o usar el endpoint proxy
   * para descargar el contenido a través de la aplicación.
   */
  getFileDownloadUrl(userId: string, itemId: string): string {
    return `${this.graphUrl}/users/${userId}/drive/items/${itemId}/content`;
  }

  /**
   * Obtiene el contenido binario desde Graph y lo hace pipe al response de Express.
   * Usa el token proporcionado por EntraIdTokenService.
   */
  /**
   * Proxy del archivo de OneDrive al cliente. Si forceInline es true, fuerza Content-Disposition: inline
   */
  async proxyFileContent(userId: string, itemId: string, res: Response, forceInline = false): Promise<void> {
    const url = `${this.graphUrl}/users/${userId}/drive/items/${itemId}/content`;
    const headers = await this.getAuthHeaders();
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers, responseType: 'stream' as 'stream' }),
      );

      // pasar algunos headers útiles al cliente
      const h = response.headers || {};
      if (h['content-type']) res.setHeader('content-type', h['content-type']);
      if (h['content-length']) res.setHeader('content-length', h['content-length']);
      if (h['content-disposition']) {
        if (forceInline) {
          // Forzar inline
          const disp = h['content-disposition'].replace('attachment', 'inline');
          res.setHeader('content-disposition', disp);
        } else {
          res.setHeader('content-disposition', h['content-disposition']);
        }
      }

      // stream desde Graph al cliente
      response.data.pipe(res);
      // no await aquí; el stream cerrará la respuesta cuando termine.
    } catch (error) {
      console.log("Error al obtener contenido del archivo desde Graph:", error);
      throw new InternalServerErrorException('Error al obtener contenido del archivo desde Graph');
    }
  }
}
