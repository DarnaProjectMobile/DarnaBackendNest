import { Test, TestingModule } from '@nestjs/testing';
import { ApireviewsController } from './apireviews.controller';
import { ApireviewsService } from './apireviews.service';

describe('ApireviewsController', () => {
  let controller: ApireviewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApireviewsController],
      providers: [ApireviewsService],
    }).compile();

    controller = module.get<ApireviewsController>(ApireviewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
