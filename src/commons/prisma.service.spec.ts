import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up database connection after each test
    if (service && service.$disconnect) {
      await service.$disconnect();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have required Prisma client methods', () => {
    expect(service).toHaveProperty('$connect');
    expect(service).toHaveProperty('$disconnect');
    expect(service).toHaveProperty('onModuleInit');
  });

  it('should have onModuleInit method', () => {
    expect(typeof service.onModuleInit).toBe('function');
  });

  describe('Prisma client methods', () => {
    it('should have database connection methods', () => {
      expect(typeof service.$connect).toBe('function');
      expect(typeof service.$disconnect).toBe('function');
    });

    it('should have transaction support', () => {
      expect(typeof service.$transaction).toBe('function');
    });

    it('should have raw query methods', () => {
      expect(typeof service.$queryRaw).toBe('function');
      expect(typeof service.$executeRaw).toBe('function');
    });
  });

  describe('service structure', () => {
    it('should extend PrismaClient functionality', () => {
      // Verify the service has the expected structure
      expect(service).toHaveProperty('$connect');
      expect(service).toHaveProperty('$disconnect');
      expect(service).toHaveProperty('$transaction');
      expect(service).toHaveProperty('$queryRaw');
      expect(service).toHaveProperty('$executeRaw');
      expect(service).toHaveProperty('onModuleInit');
    });

    it('should be an injectable service', () => {
      // Verify that the service can be instantiated through DI
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('PrismaService');
    });
  });
});
