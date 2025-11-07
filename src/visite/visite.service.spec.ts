import { Test, TestingModule } from '@nestjs/testing';
import { VisiteService } from './visite.service';

describe('VisiteService', () => {
  let service: VisiteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VisiteService],
    }).compile();

    service = module.get<VisiteService>(VisiteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
