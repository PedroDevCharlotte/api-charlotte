import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EntraIdTokenService } from './entra-id-token.service';
import { Response } from 'express';

@Injectable()
export class GraphService {
  private readonly graphUrl = 'https://graph.microsoft.com/v1.0';

  constructor(
    private readonly httpService: HttpService,
    private readonly entraIdTokenService: EntraIdTokenService,
  ) {}

  private async getAuthHeaders(): Promise<{ Authorization: string }> {
    const token = await this.entraIdTokenService.getToken();
    // console.log('Getting Entra ID token...', token );

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

            // console.log("Error al validar carpeta en Graph:", response);


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

  // 3. Crear una carpeta o subcarpeta en una ruta específica
  /**
   * Crea una carpeta (o subcarpeta) en la ruta especificada.
   * @param userId ID del usuario de OneDrive
   * @param folderPath Ruta completa donde crear la carpeta (ej: "Tickets/1234/Archivos")
   * @returns Datos de la carpeta creada
   */
  async createFolder(userId: string, folderPath: string): Promise<any> {
    // Separa la ruta en partes
    const parts = folderPath.split('/').filter(Boolean);
    if (parts.length === 0) {
      throw new InternalServerErrorException('La ruta de la carpeta no puede estar vacía');
    }

    let currentPath = '';
    let lastCreated = null;
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      // Verifica si la carpeta ya existe
      const exists = await this.validateFolder(userId, currentPath);
      if (!exists) {
        // Crea la subcarpeta en la ruta actual
        const url = `${this.graphUrl}/users/${userId}/drive/root:/${currentPath.substring(0, currentPath.lastIndexOf('/')) || ''}:/children`;
        const headers = await this.getAuthHeaders();
        const body = {
          name: part,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        };
        try {
          const response = await firstValueFrom(
            this.httpService.post(url, body, { headers }),
          );
          lastCreated = response.data;
        } catch (error) {
          // Intenta obtener el error original de Graph para mayor detalle
          const graphError = error?.response?.data || error;
          console.error('Error al crear subcarpeta en Graph:', graphError);
          throw new InternalServerErrorException('Error al crear carpeta en Graph');
        }
      }
    }
    return lastCreated;
  }

  // 4. Subir un archivo
  async uploadFile(
    userId: string,
    filePath: string,
    fileBuffer: Buffer,
  ): Promise<any> {
    const url = `${this.graphUrl}/users/${userId}/drive/root:/${filePath}:/content`;
    const headers = await this.getAuthHeaders();
    headers['Content-Type'] = 'application/octet-stream';
    try {
      const response = await firstValueFrom(
        this.httpService.put(url, fileBuffer, { headers }),
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException('Error al subir archivo en Graph');
    }
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
