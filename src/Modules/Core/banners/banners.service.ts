import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './Entity/banner.entity';
import { CreateBannerDto, UpdateBannerDto } from './Dto/banner.dto';
import { GraphService } from '../../Services/EntraID/graph.service';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
    @Inject(forwardRef(() => GraphService))
    private readonly graphService: GraphService,
  ) {}

  async create(createDto: CreateBannerDto, file?: any): Promise<Banner> {
    const now = new Date();
    const start = createDto.startDate ? new Date(createDto.startDate) : now;
    const end = createDto.endDate ? new Date(createDto.endDate) : undefined;

    const computedActive = (() => {
      if (end && end < new Date()) return false; // expired
      if (start && start > new Date()) return false; // not started yet
      return createDto.active !== undefined ? createDto.active : true;
    })();

    const banner = this.bannerRepository.create({
      title: createDto.title,
      description: createDto.description,
      link: createDto.link,
      startDate: start,
      endDate: end,
      status: createDto.status || (computedActive ? 'active' : 'inactive'),
      order: createDto.order || 0,
      active: computedActive,
    });

    if (file) {
      // --- OneDrive integration ---
      const userEmail = process.env.ONEDRIVE_USER_EMAIL || '';
      if (!userEmail)
        throw new BadRequestException('No se configuró ONEDRIVE_USER_EMAIL');
      const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || 'FilesConectaCCI';
      // 1. Buscar userId
      const userRes = await this.graphService.getUserByEmail(userEmail);
      const userId =
        userRes.value && userRes.value.length > 0 ? userRes.value[0].id : null;
      if (!userId)
        throw new BadRequestException('No se encontró el usuario de OneDrive');
      // 2. Validar/crear carpeta raíz
      let folder = await this.graphService.validateFolder(userId, rootFolder);
      if (!folder)
        folder = await this.graphService.createFolder(userId, rootFolder);
      // 3. Subir archivo
      const ext = file.originalname
        ? file.originalname.split('.').pop()
        : 'jpg';
      const fileName = `banner_${Date.now()}.${ext}`;
      const filePath = `${rootFolder}/${fileName}`;
      const uploadRes = await this.graphService.uploadFile(
        userId,
        filePath,
        file.buffer,
      );
      // 4. Obtener link de vista previa
      const previewRes = await this.graphService.getFilePreview(
        userId,
        uploadRes.id,
      );
      console.log('Preview Res:', previewRes);
      console.log('Preview Res:', previewRes.getUrl);
      banner.oneDriveFileId = uploadRes.id;
      banner.imagePath = previewRes?.getUrl || '';
      banner.imageFileName = fileName;
    }

    return this.bannerRepository.save(banner);
  }

  async findAll(): Promise<any[]> {
    const list = await this.bannerRepository.find({
      order: { order: 'ASC', id: 'ASC' } as any,
    });
    // Adjuntar enlace de vista previa si hay archivo en OneDrive
    await Promise.all(
      list.map(async (b) => {
        await this.attachImagePreviewUrl(b);
      }),
    );

    return list;
  }

  async findOne(id: number): Promise<any> {
    const b = await this.bannerRepository.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Banner no encontrado');
    await this.attachImagePreviewUrl(b);
    return b;
  }

  // Adjunta el enlace de vista previa de OneDrive si hay oneDriveFileId
  private async attachImagePreviewUrl(banner: Banner): Promise<void> {
    if (!banner) return;
    if (banner.oneDriveFileId) {
      // Obtener el enlace de vista previa desde OneDrive si no está ya en imagePath
      const userEmail = process.env.ONEDRIVE_USER_EMAIL || '';
      if (!userEmail) return;
      const userRes = await this.graphService.getUserByEmail(userEmail);
      const userId =
        userRes.value && userRes.value.length > 0 ? userRes.value[0].id : null;
      if (!userId) return;
      const previewRes = await this.graphService.getFilePreview(
        userId,
        banner.oneDriveFileId,
      );
      console.log('Preview Res:', previewRes);
      console.log('Preview Res:', previewRes.getUrl);
      (banner as any).imagePreviewUrl =
        previewRes?.getUrl || banner.imagePath || '';
    } else if (banner.imagePath) {
      (banner as any).imagePreviewUrl = banner.imagePath;
    }
  }

  private getMimeByExt(ext: string): string {
    switch (ext) {
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.svg':
        return 'image/svg+xml';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      case '.bmp':
        return 'image/bmp';
      default:
        return 'application/octet-stream';
    }
  }

  async update(
    id: number,
    updateDto: UpdateBannerDto,
    file?: any,
  ): Promise<Banner> {
    const banner = await this.findOne(id);
    // parse and assign allowed fields
    if (updateDto.title !== undefined) banner.title = updateDto.title;
    if (updateDto.description !== undefined)
      banner.description = updateDto.description;
    if (updateDto.link !== undefined) banner.link = updateDto.link;
    if (updateDto.order !== undefined) banner.order = updateDto.order;

    // handle dates
    if (updateDto.startDate !== undefined)
      banner.startDate = updateDto.startDate
        ? new Date(updateDto.startDate)
        : banner.startDate;
    if (updateDto.endDate !== undefined)
      banner.endDate = updateDto.endDate
        ? new Date(updateDto.endDate)
        : banner.endDate;

    // recompute active/status based on dates unless explicit active provided
    const now2 = new Date();
    const start2 = banner.startDate || now2;
    const end2 = banner.endDate;
    const computedActive2 = (() => {
      if (end2 && end2 < now2) return false;
      if (start2 && start2 > now2) return false;
      return updateDto.active !== undefined ? updateDto.active : banner.active;
    })();

    banner.active = computedActive2;
    banner.status =
      updateDto.status || (computedActive2 ? 'active' : 'inactive');
    if (file) {
      // --- OneDrive integration ---
      const userEmail = process.env.ONEDRIVE_USER_EMAIL || '';
      if (!userEmail)
        throw new BadRequestException('No se configuró ONEDRIVE_USER_EMAIL');
      const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || 'FilesConectaCCI';
      const userRes = await this.graphService.getUserByEmail(userEmail);
      const userId =
        userRes.value && userRes.value.length > 0 ? userRes.value[0].id : null;
      if (!userId)
        throw new BadRequestException('No se encontró el usuario de OneDrive');
      let folder = await this.graphService.validateFolder(userId, rootFolder);
      if (!folder)
        folder = await this.graphService.createFolder(userId, rootFolder);
      const ext = file.originalname
        ? file.originalname.split('.').pop()
        : 'jpg';
      const fileName = `banner_${Date.now()}.${ext}`;
      const filePath = `${rootFolder}/${fileName}`;
      const uploadRes = await this.graphService.uploadFile(
        userId,
        filePath,
        file.buffer,
      );
      const previewRes = await this.graphService.getFilePreview(
        userId,
        uploadRes.id,
      );
      banner.imagePath = previewRes?.link?.webUrl || '';
      banner.imageFileName = fileName;
    }
    return this.bannerRepository.save(banner);
  }

  async remove(id: number): Promise<void> {
    const b = await this.findOne(id);
    await this.bannerRepository.remove(b);
  }

  // saveFile eliminado: ahora todo se guarda en OneDrive
}
