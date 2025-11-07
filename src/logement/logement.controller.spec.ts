import { Test, TestingModule } from '@nestjs/testing';
import { LogementController } from './logement.controller';
import { LogementService } from './logement.service';

describe('LogementController', () => {
  let controller: LogementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogementController],
      providers: [LogementService],
    }).compile();

    controller = module.get<LogementController>(LogementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
