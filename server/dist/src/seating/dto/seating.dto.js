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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatAssignmentDetail = exports.AllocateSeatsRequest = exports.AllocationStrategy = void 0;
const class_validator_1 = require("class-validator");
var AllocationStrategy;
(function (AllocationStrategy) {
    AllocationStrategy["RANDOM"] = "RANDOM";
    AllocationStrategy["SUBMITTED_AT_FIRST"] = "SUBMITTED_AT_FIRST";
    AllocationStrategy["POSITION_FIRST_RANDOM"] = "POSITION_FIRST_RANDOM";
    AllocationStrategy["POSITION_FIRST_SUBMITTED_AT"] = "POSITION_FIRST_SUBMITTED_AT";
    AllocationStrategy["CUSTOM_GROUP"] = "CUSTOM_GROUP";
})(AllocationStrategy || (exports.AllocationStrategy = AllocationStrategy = {}));
class AllocateSeatsRequest {
    strategy;
    customGroupField;
}
exports.AllocateSeatsRequest = AllocateSeatsRequest;
__decorate([
    (0, class_validator_1.IsEnum)(AllocationStrategy),
    __metadata("design:type", String)
], AllocateSeatsRequest.prototype, "strategy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllocateSeatsRequest.prototype, "customGroupField", void 0);
class SeatAssignmentDetail {
    id;
    applicationId;
    candidateName;
    positionTitle;
    venueName;
    roomName;
    roomCode;
    seatNo;
    seatNumber;
    applicationStatus;
    assignedAt;
}
exports.SeatAssignmentDetail = SeatAssignmentDetail;
//# sourceMappingURL=seating.dto.js.map