import { Test, TestingModule } from '@nestjs/testing';
import { PubliciteController } from './publicite.controller';
import { PubliciteService } from './publicite.service';

describe('PubliciteController', () => {
  let controller: PubliciteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PubliciteController],
      providers: [PubliciteService],
    }).compile();

    controller = module.get<PubliciteController>(PubliciteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
