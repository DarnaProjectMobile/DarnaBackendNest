import { Test, TestingModule } from '@nestjs/testing';
import { LogementService } from './logement.service';

describe('LogementService', () => {
  let service: LogementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogementService],
    }).compile();

    service = module.get<LogementService>(LogementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
