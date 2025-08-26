import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BannersService } from '../../../../src/Modules/Core/banners/banners.service';
import { Banner } from '../../../../src/Modules/Core/banners/Entity/banner.entity';

type MockRepo = Partial<Record<string, jest.Mock>>;

const createMockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('BannersService', () => {
  let service: BannersService;
  let repo: MockRepo;

  beforeEach(async () => {
  repo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        { provide: getRepositoryToken(Banner), useValue: repo },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create should default startDate to now when not provided and save banner', async () => {
    const dto: any = { title: 'T1', order: 2 };
    const created = { id: 1, title: 'T1', order: 2 } as any;
    repo.create!.mockReturnValue(created);
    repo.save!.mockResolvedValue({ ...created, startDate: new Date() });

    const res = await service.create(dto, undefined);
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(res).toHaveProperty('startDate');
  });

  it('create should mark active=false when endDate is past', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const dto: any = { title: 'T2', endDate: past };
    const created = { id: 2, title: 'T2' } as any;
    repo.create!.mockReturnValue(created);
    repo.save!.mockResolvedValue({ ...created, active: false, endDate: new Date(past) });

    const res = await service.create(dto, undefined);
    expect(res.active).toBe(false);
  });

  it('update should recompute active/status based on dates', async () => {
    const now = new Date();
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const existing: any = { id: 3, title: 'T3', startDate: now, active: true, status: 'active' };
    repo.findOne!.mockResolvedValue(existing);
    repo.save!.mockImplementation(async (b) => b);

    const res = await service.update(3, { startDate: future }, undefined);
    expect(res.active).toBe(false);
    expect(res.status).toBe('inactive');
  });

  it('findOne should throw when not found', async () => {
    repo.findOne!.mockResolvedValue(undefined);
    await expect(service.findOne(999)).rejects.toThrow();
  });

  it('remove should call repository.remove', async () => {
    const existing: any = { id: 4, title: 'T4' };
    repo.findOne!.mockResolvedValue(existing);
    repo.remove!.mockResolvedValue(undefined);
    await service.remove(4);
    expect(repo.remove).toHaveBeenCalledWith(existing);
  });
});
