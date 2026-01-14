"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const async_hooks_1 = require("async_hooks");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    static { PrismaService_1 = this; }
    static als = new async_hooks_1.AsyncLocalStorage();
    constructor() {
        const url = process.env.DATABASE_URL || '';
        const pool = new pg_1.Pool({ connectionString: url });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        super({
            adapter,
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    static runInTenantContext(schema, callback) {
        return this.als.run({ schema }, callback);
    }
    static getTenantSchema() {
        return this.als.getStore()?.schema;
    }
    get client() {
        const schema = PrismaService_1.getTenantSchema() || 'public';
        return this.$extends({
            query: {
                $allModels: {
                    async $allOperations({ args, query }) {
                        return await PrismaService_1.als.run({ schema }, async () => {
                            return await this.$transaction(async (tx) => {
                                await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}", public`);
                                return query(args);
                            });
                        });
                    },
                },
            },
        });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map