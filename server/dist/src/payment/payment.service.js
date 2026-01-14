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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const payment_dto_1 = require("./dto/payment.dto");
const uuid_1 = require("uuid");
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    logger = new common_1.Logger(PaymentService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    get client() {
        return this.prisma.client;
    }
    async initiate(request) {
        const { applicationId, channel } = request;
        const app = await this.client.application.findUnique({
            where: { id: applicationId },
            include: { exam: true },
        });
        if (!app)
            throw new common_1.NotFoundException('Application not found');
        const amount = app.exam.feeAmount ? Number(app.exam.feeAmount) : 0;
        if (amount <= 0 && app.exam.feeRequired) {
            throw new common_1.BadRequestException('Exam requires fee but fee amount is not set');
        }
        const outTradeNo = `PO-${Date.now()}-${applicationId.substring(0, 8)}`;
        const order = await this.client.paymentOrder.create({
            data: {
                id: (0, uuid_1.v4)(),
                applicationId,
                outTradeNo,
                amount,
                currency: 'CNY',
                channel,
                status: 'PENDING',
            },
        });
        if (channel === payment_dto_1.PaymentChannel.MOCK) {
            return {
                orderId: order.id,
                outTradeNo,
                payUrl: `http://mock-pay.com/pay/${outTradeNo}`,
                status: order.status,
            };
        }
        throw new common_1.BadRequestException(`Channel ${channel} not implemented yet`);
    }
    async handleCallback(request) {
        const { outTradeNo, transactionId, status } = request;
        const order = await this.client.paymentOrder.findUnique({
            where: { outTradeNo },
        });
        if (!order)
            throw new common_1.NotFoundException('Payment order not found');
        if (order.status === 'SUCCESS') {
            return { success: true, message: 'Already processed' };
        }
        const newStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
        return await this.client.$transaction(async (tx) => {
            await tx.paymentOrder.update({
                where: { id: order.id },
                data: {
                    status: newStatus,
                    transactionId: transactionId || `MOCK-TX-${Date.now()}`,
                    paidAt: newStatus === 'SUCCESS' ? new Date() : null,
                },
            });
            if (newStatus === 'SUCCESS') {
                const app = await tx.application.findUnique({
                    where: { id: order.applicationId },
                });
                if (app) {
                    await tx.application.update({
                        where: { id: app.id },
                        data: { status: 'PAID' },
                    });
                    await tx.applicationAuditLog.create({
                        data: {
                            id: (0, uuid_1.v4)(),
                            applicationId: app.id,
                            fromStatus: app.status,
                            toStatus: 'PAID',
                            actor: 'SYSTEM',
                            reason: 'Payment successful',
                        },
                    });
                }
            }
            return { success: true, status: newStatus };
        });
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map