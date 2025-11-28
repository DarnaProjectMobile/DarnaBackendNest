import { Test, TestingModule } from '@nestjs/testing';
import { ApireviewsService } from './apireviews.service';

describe('ApireviewsService', () => {
  let service: ApireviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApireviewsService],
    }).compile();

    service = module.get<ApireviewsService>(ApireviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
