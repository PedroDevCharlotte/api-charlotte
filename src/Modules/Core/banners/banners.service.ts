import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './Entity/banner.entity';
import { CreateBannerDto, UpdateBannerDto } from './Dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
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
      const saved = await this.saveFile(file);
      banner.imagePath = saved.path;
      banner.imageFileName = saved.fileName;
    }

    return this.bannerRepository.save(banner);
  }

  async findAll(): Promise<Banner[]> {
    const list = await this.bannerRepository.find({ order: { order: 'ASC', id: 'ASC' } as any });
    // embed base64 image data when available
    await Promise.all(list.map((b) => this.attachImageBase64(b)));
    return list;
  }

  async findOne(id: number): Promise<Banner> {
    const b = await this.bannerRepository.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Banner no encontrado');
    await this.attachImageBase64(b);
    return b;
  }

  // Attach imageBase64 property to banner if imagePath exists
  private async attachImageBase64(banner: Banner): Promise<void> {
    if (!banner || !banner.imagePath) return;
    try {
      const fs = require('fs');
      const path = require('path');
      if (!fs.existsSync(banner.imagePath)) return;
      const buffer: Buffer = fs.readFileSync(banner.imagePath);
      const ext = path.extname(banner.imagePath).toLowerCase();
      const mime = this.getMimeByExt(ext);
      const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      (banner as any).imageBase64 = dataUrl;
    } catch (err) {
      // don't fail the request if image reading fails
      return;
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

  async update(id: number, updateDto: UpdateBannerDto, file?: any): Promise<Banner> {
    const banner = await this.findOne(id);
    // parse and assign allowed fields
    if (updateDto.title !== undefined) banner.title = updateDto.title;
    if (updateDto.description !== undefined) banner.description = updateDto.description;
    if (updateDto.link !== undefined) banner.link = updateDto.link;
    if (updateDto.order !== undefined) banner.order = updateDto.order;

    // handle dates
    if (updateDto.startDate !== undefined) banner.startDate = updateDto.startDate ? new Date(updateDto.startDate) : banner.startDate;
    if (updateDto.endDate !== undefined) banner.endDate = updateDto.endDate ? new Date(updateDto.endDate) : banner.endDate;

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
    banner.status = updateDto.status || (computedActive2 ? 'active' : 'inactive');
    if (file) {
      const saved = await this.saveFile(file);
      banner.imagePath = saved.path;
      banner.imageFileName = saved.fileName;
    }
    return this.bannerRepository.save(banner);
  }

  async remove(id: number): Promise<void> {
    const b = await this.findOne(id);
    await this.bannerRepository.remove(b);
  }

  // helper to persist file to uploads/banners/YYYY/MM
  private async saveFile(file: any): Promise<{ path: string; fileName: string }> {
    if (!file || !file.buffer) throw new BadRequestException('Archivo inválido');
    const fs = require('fs');
    const path = require('path');
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join('uploads', 'banners', year, month);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 12);
    const ext = path.extname(file.originalname) || '';
    const fileName = `${timestamp}_${randomStr}${ext}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);
    return { path: filePath.replace(/\\/g, '/'), fileName };
  }
}
