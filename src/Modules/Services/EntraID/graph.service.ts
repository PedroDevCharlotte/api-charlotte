import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EntraIdTokenService } from './entra-id-token.service';

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
  async createFolder(userId: string, folderName: string): Promise<any> {
    const url = `${this.graphUrl}/users/${userId}/drive/root/children`;
    const headers = await this.getAuthHeaders();
    const body = {
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename',
    };
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException('Error al crear carpeta en Graph');
    }
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
}
