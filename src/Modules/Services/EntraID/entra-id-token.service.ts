import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

@Injectable()
export class EntraIdTokenService {
  private token: string | null = null;
  private expiresAt: number | null = null;

  private readonly tenantId = process.env.AZURE_AD_TENANT_ID || '';
  private readonly clientId = process.env.AZURE_AD_CLIENT_ID || '';
  private readonly clientSecret = process.env.AZURE_AD_CLIENT_SECRET || '';
  private readonly scope = process.env.AZURE_AD_SCOPE || 'https://graph.microsoft.com/.default';

  constructor(private readonly httpService: HttpService) {}

  private get tokenUrl() {
    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
  }

  private isTokenValid(): boolean {
    return !!this.token && !!this.expiresAt && Date.now() < this.expiresAt;
  }

  async getToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.token!;
    }
    await this.fetchToken();
    if (!this.token) {
      throw new InternalServerErrorException('No se pudo obtener el token de Entra ID');
    }
    return this.token;
  }

  private async fetchToken() {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('scope', this.scope);
    try {
      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(this.tokenUrl, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      this.token = response.data.access_token;
      this.expiresAt = Date.now() + (response.data.expires_in - 60) * 1000; // 60s margen
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener token de Entra ID');
    }
  }
}
