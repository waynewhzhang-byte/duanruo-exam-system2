"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const tenant_module_1 = require("./tenant/tenant.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const review_module_1 = require("./review/review.module");
const payment_module_1 = require("./payment/payment.module");
const ticket_module_1 = require("./ticket/ticket.module");
const seating_module_1 = require("./seating/seating.module");
const common_module_1 = require("./common/common.module");
const scheduler_module_1 = require("./scheduler/scheduler.module");
const exam_module_1 = require("./exam/exam.module");
const application_module_1 = require("./application/application.module");
const file_module_1 = require("./file/file.module");
const tenant_middleware_1 = require("./tenant/tenant.middleware");
const super_admin_module_1 = require("./super-admin/super-admin.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(tenant_middleware_1.TenantMiddleware)
            .exclude({ path: 'api/v1/auth/login', method: common_1.RequestMethod.POST }, { path: 'api/v1/auth/register', method: common_1.RequestMethod.POST })
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            tenant_module_1.TenantModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            exam_module_1.ExamModule,
            application_module_1.ApplicationModule,
            review_module_1.ReviewModule,
            payment_module_1.PaymentModule,
            ticket_module_1.TicketModule,
            seating_module_1.SeatingModule,
            common_module_1.CommonModule,
            scheduler_module_1.SchedulerModule,
            file_module_1.FileModule,
            super_admin_module_1.SuperAdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map