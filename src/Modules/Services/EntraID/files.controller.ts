import { Controller, Get, Param, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { GraphService } from './graph.service';

@Controller('onedrive/file')
export class FilesController {
  constructor(private readonly graphService: GraphService) {}


  @Get(':id/link')
  async getDownloadLink(@Param('id') fileId: string) {
    const userEmail = process.env.ONEDRIVE_USER_EMAIL || ''; 
    if (!userEmail) throw new BadRequestException('No se configuró ONEDRIVE_USER_EMAIL');

    const userRes = await this.graphService.getUserByEmail(userEmail);
    const userId = userRes?.value && userRes.value.length > 0 ? userRes.value[0].id : null;
    if (!userId) throw new BadRequestException('No se encontró el usuario de OneDrive');

    const url = this.graphService.getFileDownloadUrl(userId, fileId);
    return { downloadUrl: url };
  }

  @Get(':id/content')
  async getFileContent(@Param('id') fileId: string, @Res() res: Response) {
    const userEmail = process.env.ONEDRIVE_USER_EMAIL || '';
    if (!userEmail) throw new BadRequestException('No se configuró ONEDRIVE_USER_EMAIL');

    const userRes = await this.graphService.getUserByEmail(userEmail);
    const userId = userRes?.value && userRes.value.length > 0 ? userRes.value[0].id : null;
    if (!userId) throw new BadRequestException('No se encontró el usuario de OneDrive');

    // proxy the binary content to the client
    await this.graphService.proxyFileContent(userId, fileId, res);
  }
}
