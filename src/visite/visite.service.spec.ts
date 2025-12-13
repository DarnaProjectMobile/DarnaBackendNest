import { Test, TestingModule } from '@nestjs/testing';
import { VisiteService } from './visite.service';
import { getModelToken } from '@nestjs/mongoose';
import { Visite } from './schemas/visite.schema';
import { ReviewsService } from '../reviews/reviews.service';
import { UsersService } from '../users/users.service';
import { LogementService } from '../logement/logement.service';
import { NotificationsFirebaseService } from '../notifications-firebase/notifications-firebase.service';
import { CreateVisiteDto } from './dto/create-visite.dto';

describe('VisiteService', () => {
  let service: VisiteService;
  let saveSpy: jest.Mock;

  const mockVisiteModel = function (dto) {
    this.data = dto;
    this.save = saveSpy;
  };

  const mockReviewsService = {};
  const mockUsersService = {
    findById: jest.fn(),
  };
  const mockLogementService = {
    findOne: jest.fn(),
    findByAnnonceId: jest.fn(),
    findByTitle: jest.fn(),
  };
  const mockNotificationsFirebaseService = {
    notifyVisitAccepted: jest.fn(),
    notifyVisitRefused: jest.fn(),
  };

  beforeEach(async () => {
    saveSpy = jest.fn().mockImplementation(function () {
      return Promise.resolve({ ...this.data, _id: 'mockId' });
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisiteService,
        {
          provide: getModelToken(Visite.name),
          useValue: mockVisiteModel,
        },
        { provide: ReviewsService, useValue: mockReviewsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: LogementService, useValue: mockLogementService },
        { provide: NotificationsFirebaseService, useValue: mockNotificationsFirebaseService },
      ],
    }).compile();

    service = module.get<VisiteService>(VisiteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a visite successfully', async () => {
    const createVisiteDto: CreateVisiteDto = {
      logementId: 'logement1',
      dateVisite: new Date().toISOString(),
      notes: 'Test visit',
    };
    const userId = 'user1';

    const result = await service.create(createVisiteDto, userId);

    expect(saveSpy).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.userId).toBe(userId);
    expect(result.status).toBe('pending');
  });
});
