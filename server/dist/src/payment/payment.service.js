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
const mock_gateway_service_1 = require("./mock-gateway.service");
const payment_dto_1 = require("./dto/payment.dto");
const uuid_1 = require("uuid");
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    mockGateway;
    logger = new common_1.Logger(PaymentService_1.name);
    constructor(prisma, mockGateway) {
        this.prisma = prisma;
        this.mockGateway = mockGateway;
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
        if (app.status !== 'APPROVED') {
            throw new common_1.BadRequestException('Only approved applications can initiate payment');
        }
        if (!app.exam.feeRequired) {
            throw new common_1.BadRequestException('This exam does not require payment');
        }
        const amount = app.exam.feeAmount ? Number(app.exam.feeAmount) : 0;
        if (amount <= 0) {
            throw new common_1.BadRequestException('Fee amount is not set');
        }
        const existingOrder = await this.client.paymentOrder.findFirst({
            where: {
                applicationId,
                status: { in: ['PENDING', 'SUCCESS'] },
            },
        });
        if (existingOrder) {
            if (existingOrder.status === 'SUCCESS') {
                throw new common_1.BadRequestException('Payment already completed');
            }
            return {
                orderId: existingOrder.id,
                outTradeNo: existingOrder.outTradeNo,
                payUrl: existingOrder.channel === 'MOCK'
                    ? await this.getMockPayUrl(existingOrder.outTradeNo)
                    : null,
                status: existingOrder.status,
                expiredAt: existingOrder.expiredAt,
            };
        }
        const outTradeNo = `PO-${Date.now()}-${applicationId.substring(0, 8)}`;
        const expiredAt = new Date();
        expiredAt.setMinutes(expiredAt.getMinutes() + 30);
        const order = await this.client.paymentOrder.create({
            data: {
                id: (0, uuid_1.v4)(),
                applicationId,
                outTradeNo,
                amount,
                currency: 'CNY',
                channel,
                status: 'PENDING',
                expiredAt,
            },
        });
        if (channel === payment_dto_1.PaymentChannel.MOCK) {
            const mockResult = await this.mockGateway.createOrder({
                outTradeNo,
                amount,
                currency: 'CNY',
                description: `${app.exam.title} - 报名费`,
            });
            this.logger.log(`Mock payment initiated: ${outTradeNo}, amount: ${amount}`);
            return {
                orderId: order.id,
                outTradeNo,
                payUrl: mockResult.payUrl,
                qrCode: mockResult.qrCode,
                status: order.status,
                expiredAt,
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
                    callbackData: JSON.stringify(request),
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
                            metadata: {
                                orderId: order.id,
                                outTradeNo: order.outTradeNo,
                                transactionId: transactionId,
                                amount: order.amount.toString(),
                            },
                        },
                    });
                    this.logger.log(`Application ${app.id} payment completed, status: APPROVED -> PAID`);
                }
            }
            return { success: true, status: newStatus };
        });
    }
    async getMockPayUrl(outTradeNo) {
        const baseUrl = process.env.SERVER_URL || 'http://localhost:3000';
        return `${baseUrl}/mock-pay/${outTradeNo}`;
    }
    async queryOrder(orderId) {
        const order = await this.client.paymentOrder.findUnique({
            where: { id: orderId },
            include: {
                applicationId: true,
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return {
            orderId: order.id,
            outTradeNo: order.outTradeNo,
            applicationId: order.applicationId,
            amount: Number(order.amount),
            currency: order.currency,
            channel: order.channel,
            status: order.status,
            transactionId: order.transactionId,
            paidAt: order.paidAt,
            expiredAt: order.expiredAt,
            createdAt: order.createdAt,
        };
    }
    async listMyOrders(candidateId) {
        const applications = await this.client.application.findMany({
            where: { candidateId },
            select: { id: true },
        });
        const applicationIds = applications.map((a) => a.id);
        const orders = await this.client.paymentOrder.findMany({
            where: {
                applicationId: { in: applicationIds },
            },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((order) => ({
            orderId: order.id,
            outTradeNo: order.outTradeNo,
            applicationId: order.applicationId,
            amount: Number(order.amount),
            currency: order.currency,
            channel: order.channel,
            status: order.status,
            paidAt: order.paidAt,
            createdAt: order.createdAt,
        }));
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mock_gateway_service_1.MockGatewayService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map