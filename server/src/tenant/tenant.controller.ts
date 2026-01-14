import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { code: slug },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    return tenant;
  }
}
