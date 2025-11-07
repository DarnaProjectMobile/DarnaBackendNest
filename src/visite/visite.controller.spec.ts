import { Test, TestingModule } from '@nestjs/testing';
import { VisiteController } from './visite.controller';
import { VisiteService } from './visite.service';

describe('VisiteController', () => {
  let controller: VisiteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisiteController],
      providers: [VisiteService],
    }).compile();

    controller = module.get<VisiteController>(VisiteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
