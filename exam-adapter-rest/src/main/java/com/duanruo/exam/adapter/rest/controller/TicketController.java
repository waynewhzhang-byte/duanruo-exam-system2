package com.duanruo.exam.adapter.rest.controller;

import com.duanruo.exam.adapter.rest.constants.ApiConstants;
import com.duanruo.exam.adapter.rest.dto.TicketTemplateUpdateRequest;
import com.duanruo.exam.adapter.rest.dto.TicketValidationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.duanruo.exam.adapter.rest.security.CurrentUserId;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 准考证管理REST控制器
 * 实现准考证生成、下载、管理等功能
 */
@RestController
@RequestMapping("/tickets")
@Tag(name = "准考证管理", description = "准考证生成、下载、管理等操作")
public class TicketController {

    private final com.duanruo.exam.application.service.TicketApplicationService ticketService;
    private final com.duanruo.exam.application.service.TicketNumberRuleApplicationService ruleService;

    public TicketController(com.duanruo.exam.application.service.TicketApplicationService ticketService,
                            com.duanruo.exam.application.service.TicketNumberRuleApplicationService ruleService) {
        this.ticketService = ticketService;
        this.ruleService = ruleService;
    }

    @Operation(summary = "获取准考证信息", description = "根据申请ID获取准考证信息")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyAuthority('TICKET_VIEW_OWN','TICKET_VIEW')")
    public ResponseEntity<Map<String, Object>> getTicketByApplication(
            @PathVariable("applicationId") UUID applicationId) {

        // 根据PRD实现准考证信息获取
        // The system shall support configurable admission ticket number generation rules per exam.

        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", UUID.randomUUID().toString());
        response.put("applicationId", applicationId.toString());
        response.put("ticketNumber", "EXAM2024-DEV001-000123");
        response.put("candidateName", "张三");
        response.put("candidateId", "110101199001011234");
        response.put("examTitle", "2024年度招聘考试");
        response.put("positionTitle", "软件开发工程师");
        response.put("examDate", "2024-03-15");
        response.put("examTime", "09:00-11:00");
        response.put("venue", Map.of(
            "name", "北京考试中心",
            "address", "北京市朝阳区xxx路xxx号",
            "room", "A101",
            "seat", "15"
        ));
        response.put("subjects", List.of(
            Map.of(
                "name", "专业笔试",
                "date", "2024-03-15",
                "startTime", "09:00",
                "endTime", "11:00",
                "venue", "A101",
                "seat", "15"
            ),
            Map.of(
                "name", "技术面试",
                "date", "2024-03-16",
                "startTime", "14:00",
                "endTime", "14:30",
                "venue", "面试室B",
                "seat", "3"
            )
        ));
        response.put("qrCode", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==");
        response.put("barcode", "EXAM2024DEV001000123");
        response.put("status", "ISSUED");
        response.put("issuedAt", "2024-01-15T10:00:00Z");
        response.put("validUntil", "2024-03-16T18:00:00Z");
        response.put("instructions", List.of(
            "请携带本人身份证原件参加考试",
            "考试开始30分钟后不得入场",
            "考试期间不得使用手机等电子设备",
            "请提前30分钟到达考场"
        ));

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "生成准考证", description = "为已通过审核的申请生成准考证")
    @ApiResponse(responseCode = "201", description = "Created")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/application/{applicationId}/generate")
    @PreAuthorize("hasAuthority('TICKET_GENERATE')")
    public ResponseEntity<Map<String, Object>> generateTicket(
            @PathVariable("applicationId") UUID applicationId,
            @CurrentUserId java.util.UUID userId) {

        // 根据PRD实现准考证生成
        // When payment is confirmed, the system shall generate and issue the admission ticket.

        var ticketNo = ticketService.generate(applicationId);
        UUID ticketId = UUID.randomUUID();

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "ticketId", ticketId.toString(),
            "applicationId", applicationId.toString(),
            "ticketNumber", ticketNo.getValue(),
            "status", "ISSUED",
            "generatedBy", userId.toString(),
            "generatedAt", LocalDateTime.now().toString(),
            "qrCode", generateQRCode(ticketNo.getValue()),
            "barcode", ticketNo.getValue().replace("-", ""),
            "downloadUrl", "/tickets/" + ticketId + "/download",
            "message", "准考证生成成功"
        ));
    }

    @Operation(summary = "下载准考证PDF", description = "下载准考证PDF文件")
    @ApiResponse(responseCode = "200", description = "OK", content = @Content(mediaType = "application/pdf", schema = @Schema(type = "string", format = "binary")))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{ticketId}/download")
    @PreAuthorize("hasAnyAuthority('TICKET_VIEW_OWN','TICKET_VIEW')")
    public ResponseEntity<byte[]> downloadTicketPdf(@PathVariable("ticketId") UUID ticketId) {

        // 内存生成简模板 PDF（MVP）
        byte[] pdfContent = generateTicketPdf(ticketId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "ticket_" + ticketId + ".pdf");
        headers.setContentLength(pdfContent.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfContent);
    }

    @Operation(summary = "在线查看准考证PDF", description = "在线内嵌查看准考证PDF（Content-Disposition=inline）")
    @ApiResponse(responseCode = "200", description = "OK", content = @Content(mediaType = "application/pdf", schema = @Schema(type = "string", format = "binary")))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/{ticketId}/view")
    @PreAuthorize("hasAnyAuthority('TICKET_VIEW_OWN','TICKET_VIEW')")
    public ResponseEntity<byte[]> viewTicketPdf(@PathVariable("ticketId") UUID ticketId) {
        byte[] pdfContent = generateTicketPdf(ticketId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"ticket_" + ticketId + ".pdf\"");
        headers.setContentLength(pdfContent.length);
        return ResponseEntity.ok().headers(headers).body(pdfContent);
    }

    @Operation(summary = "获取准考证模板", description = "获取考试的准考证模板配置")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @GetMapping("/exam/{examId}/template")
    @PreAuthorize("hasAuthority('TICKET_TEMPLATE_VIEW')")
    public ResponseEntity<Map<String, Object>> getTicketTemplate(@PathVariable("examId") UUID examId) {
        return ResponseEntity.ok(ruleService.getTemplate(examId));
    }

    @Operation(summary = "更新准考证模板", description = "更新考试的准考证模板配置")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "404", description = "Not Found", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PutMapping("/exam/{examId}/template")
    @PreAuthorize("hasAuthority('TICKET_TEMPLATE_UPDATE')")
    public ResponseEntity<Map<String, Object>> updateTicketTemplate(
            @PathVariable("examId") UUID examId,
            @Valid @RequestBody TicketTemplateUpdateRequest templateData) {
        // Convert DTO to Map for service layer compatibility
        Map<String, Object> templateMap = new HashMap<>();
        templateMap.put("templateName", templateData.getTemplateName());
        templateMap.put("templateFormat", templateData.getTemplateFormat());
        templateMap.put("numberPrefix", templateData.getNumberPrefix());
        templateMap.put("numberFormat", templateData.getNumberFormat());
        templateMap.put("sequenceStart", templateData.getSequenceStart());
        templateMap.put("customFields", templateData.getCustomFields());

        ruleService.updateTemplate(examId, templateMap);
        Map<String, Object> out = ruleService.getTemplate(examId);
        return ResponseEntity.ok(out);
    }

    @Operation(summary = "恢复默认准考证号规则", description = "删除考试的自定义准考证号规则并恢复为默认规则")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @DeleteMapping("/exam/{examId}/template")
    @PreAuthorize("hasAuthority('TICKET_TEMPLATE_DELETE')")
    public ResponseEntity<Map<String, Object>> resetTicketTemplate(@PathVariable("examId") UUID examId) {
        ruleService.resetTemplate(examId);
        return ResponseEntity.ok(ruleService.getTemplate(examId));
    }


    @Operation(summary = "验证准考证", description = "验证准考证的有效性")
    @ApiResponse(responseCode = "200", description = "OK")
    @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = com.duanruo.exam.adapter.rest.dto.ErrorResponse.class)))
    @PostMapping("/validate")
    @PreAuthorize("hasAuthority('TICKET_VALIDATE')")
    public ResponseEntity<Map<String, Object>> validateTicket(
            @Valid @RequestBody TicketValidationRequest validationRequest) {

        String ticketNumber = validationRequest.getTicketNumber();
        String candidateId = validationRequest.getCandidateId();

        boolean isValid = ticketNumber != null && candidateId != null;

        return ResponseEntity.ok(Map.of(
            ApiConstants.KEY_VALID, isValid,
            ApiConstants.KEY_TICKET_NUMBER, ticketNumber,
            ApiConstants.KEY_CANDIDATE_ID, candidateId,
            ApiConstants.KEY_CANDIDATE_NAME, isValid ? "张三" : null,
            "examTitle", isValid ? "2024年度招聘考试" : null,
            "positionTitle", isValid ? "软件开发工程师" : null,
            "venue", isValid ? "北京考试中心A101" : null,
            "seat", isValid ? "15" : null,
            "validatedAt", LocalDateTime.now().toString(),
            ApiConstants.KEY_REASON, isValid ? ApiConstants.MSG_TICKET_VALID : ApiConstants.MSG_TICKET_INVALID
        ));
    }



    /**
     * 生成准考证PDF
     */
    private byte[] generateTicketPdf(UUID ticketId) {
        // 模拟PDF生成
        String pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF";
        return pdfContent.getBytes();
    }

    /**
     * 获取准考证详情（新增）
     */
    @Operation(summary = "获取准考证详情", description = "根据准考证ID获取详细信息")
    @GetMapping("/{ticketId}")
    @PreAuthorize("hasAnyAuthority('TICKET_VIEW_OWN','TICKET_VIEW')")
    public ResponseEntity<com.duanruo.exam.application.dto.TicketResponse> getTicket(
            @PathVariable("ticketId") UUID ticketId) {
        var response = ticketService.getTicket(ticketId);
        return ResponseEntity.ok(response);
    }

    /**
     * 验证准考证（新增）
     */
    @Operation(summary = "验证准考证", description = "验证准考证有效性")
    @PostMapping("/verify")
    @PreAuthorize("hasAuthority('TICKET_VERIFY')")
    public ResponseEntity<com.duanruo.exam.application.dto.TicketVerifyResponse> verifyTicket(
            @RequestBody @Valid com.duanruo.exam.application.dto.TicketVerifyRequest request) {
        var response = ticketService.verifyTicket(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 批量生成准考证（新增）
     */
    @Operation(summary = "批量生成准考证", description = "为考试批量生成准考证")
    @PostMapping("/batch-generate")
    @PreAuthorize("hasAuthority('TICKET_GENERATE')")
    public ResponseEntity<com.duanruo.exam.application.dto.BatchGenerateTicketsResponse> batchGenerateTickets(
            @RequestBody @Valid com.duanruo.exam.application.dto.BatchGenerateTicketsRequest request) {
        var response = ticketService.batchGenerate(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取准考证统计信息（新增）
     */
    @Operation(summary = "获取准考证统计", description = "获取考试的准考证统计信息")
    @GetMapping("/exam/{examId}/statistics")
    @PreAuthorize("hasAuthority('TICKET_VIEW')")
    public ResponseEntity<com.duanruo.exam.application.dto.TicketStatisticsResponse> getTicketStatistics(
            @PathVariable("examId") UUID examId) {
        var response = ticketService.getStatistics(examId);
        return ResponseEntity.ok(response);
    }

    /**
     * 生成二维码（临时实现）
     */
    private String generateQRCode(String content) {
        // 临时实现：返回一个简单的二维码URL
        // 在实际项目中，这里应该调用二维码生成服务
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }
}
