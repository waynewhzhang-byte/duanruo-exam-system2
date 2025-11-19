package com.duanruo.exam.application.service;

import com.duanruo.exam.application.dto.score.ScoreRecordRequest;
import com.duanruo.exam.application.dto.score.ScoreRankingResponse;
import com.duanruo.exam.application.dto.score.ScoreResponse;
import com.duanruo.exam.application.dto.score.ScoreStatisticsResponse;
import com.duanruo.exam.domain.application.Application;
import com.duanruo.exam.domain.application.ApplicationId;
import com.duanruo.exam.domain.application.ApplicationRepository;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.score.ExamScore;
import com.duanruo.exam.domain.score.ExamScoreRepository;
import com.duanruo.exam.domain.exam.Subject;
import com.duanruo.exam.domain.exam.SubjectId;
import com.duanruo.exam.domain.exam.SubjectRepository;
import com.duanruo.exam.domain.user.Permission;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.ticket.Ticket;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 成绩管理应用服务
 * 提供成绩录入、查询、统计等功能
 */
@Service
@Transactional
public class ScoreApplicationService {

    private final ExamScoreRepository examScoreRepository;
    private final ApplicationRepository applicationRepository;
    private final SubjectRepository subjectRepository;
    private final ExamPermissionService examPermissionService;
    private final com.duanruo.exam.domain.exam.PositionRepository positionRepository;
    private final com.duanruo.exam.domain.ticket.TicketRepository ticketRepository;
    private final ExamRepository examRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ScoreApplicationService(ExamScoreRepository examScoreRepository,
            ApplicationRepository applicationRepository,
            SubjectRepository subjectRepository,
            ExamPermissionService examPermissionService,
            com.duanruo.exam.domain.exam.PositionRepository positionRepository,
            com.duanruo.exam.domain.ticket.TicketRepository ticketRepository,
            ExamRepository examRepository) {
        this.examScoreRepository = examScoreRepository;
        this.applicationRepository = applicationRepository;
        this.subjectRepository = subjectRepository;
        this.examPermissionService = examPermissionService;
        this.positionRepository = positionRepository;
        this.ticketRepository = ticketRepository;
        this.examRepository = examRepository;
    }

    /**
     * 录入成绩
     */
    public void recordScore(UUID applicationId, UUID subjectId, BigDecimal score,
            UUID gradedBy, String remarks) {
        // 1. 验证申请存在
        Application application = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("申请不存在"));

        // 2. 验证科目存在
        Subject subject = subjectRepository.findById(SubjectId.of(subjectId))
                .orElseThrow(() -> new IllegalArgumentException("科目不存在"));

        // 3. 权限检查
        if (!examPermissionService.hasExamPermission(gradedBy, application.getExamId().getValue(),
                Permission.SCORE_RECORD)) {
            throw new SecurityException("无权限录入该考试成绩");
        }

        // 4. 验证成绩范围
        if (score.compareTo(BigDecimal.ZERO) < 0 ||
                (subject.getMaxScore() != null && score.compareTo(subject.getMaxScore()) > 0)) {
            throw new IllegalArgumentException("成绩超出有效范围");
        }

        // 5. 检查是否已存在成绩
        Optional<ExamScore> existingScore = examScoreRepository.findByApplicationIdAndSubjectId(
                ApplicationId.of(applicationId), SubjectId.of(subjectId));

        if (existingScore.isPresent()) {
            // 更新现有成绩
            ExamScore examScore = existingScore.get();
            examScore.updateScore(score, UserId.of(gradedBy), remarks);
            examScoreRepository.save(examScore);
        } else {
            // 创建新成绩记录
            ExamScore examScore = ExamScore.create(
                    ApplicationId.of(applicationId),
                    SubjectId.of(subjectId),
                    score,
                    UserId.of(gradedBy),
                    remarks);
            examScoreRepository.save(examScore);
        }
    }

    /**
     * 标记缺考
     */
    public void markAsAbsent(UUID applicationId, UUID subjectId, UUID gradedBy, String remarks) {
        // 1. 验证申请存在
        Application application = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("申请不存在"));

        // 2. 权限检查
        if (!examPermissionService.hasExamPermission(gradedBy, application.getExamId().getValue(),
                Permission.SCORE_RECORD)) {
            throw new SecurityException("无权限录入该考试成绩");
        }

        // 3. 检查是否已存在成绩
        Optional<ExamScore> existingScore = examScoreRepository.findByApplicationIdAndSubjectId(
                ApplicationId.of(applicationId), SubjectId.of(subjectId));

        if (existingScore.isPresent()) {
            // 更新为缺考
            ExamScore examScore = existingScore.get();
            examScore.markAsAbsent(UserId.of(gradedBy), remarks);
            examScoreRepository.save(examScore);
        } else {
            // 创建缺考记录
            ExamScore examScore = ExamScore.createAbsent(
                    ApplicationId.of(applicationId),
                    SubjectId.of(subjectId),
                    UserId.of(gradedBy),
                    remarks);
            examScoreRepository.save(examScore);
        }
    }

    /**
     * 查询申请的所有成绩
     */
    @Transactional(readOnly = true)
    public List<ScoreResponse> getScoresByApplication(UUID applicationId, UUID requesterId) {
        // 1. 验证申请存在
        Application application = applicationRepository.findById(ApplicationId.of(applicationId))
                .orElseThrow(() -> new IllegalArgumentException("申请不存在"));

        // 2. 权限检查
        boolean canView = false;

        // 候选人可以查看自己的成绩
        if (application.getCandidateId().getValue().equals(requesterId)) {
            canView = examPermissionService.hasExamPermission(requesterId,
                    application.getExamId().getValue(), Permission.SCORE_VIEW_OWN);
        } else {
            // 管理员可以查看所有成绩
            canView = examPermissionService.hasExamPermission(requesterId,
                    application.getExamId().getValue(), Permission.SCORE_VIEW);
        }

        if (!canView) {
            throw new SecurityException("无权限查看成绩");
        }

        // 3. 查询成绩
        List<ExamScore> scores = examScoreRepository.findByApplicationId(ApplicationId.of(applicationId));

        // 4. 获取科目信息并构建响应
        return scores.stream()
                .map(score -> {
                    Subject subject = subjectRepository.findById(score.getSubjectId())
                            .orElse(null);
                    String subjectName = subject != null ? subject.getName() : "未知";
                    BigDecimal maxScore = subject != null && subject.getMaxScore() != null
                            ? subject.getMaxScore()
                            : BigDecimal.valueOf(100);

                    return new ScoreResponse(
                            score.getId().getValue(),
                            score.getApplicationId().getValue(),
                            score.getSubjectId().getValue(),
                            score.getScore(),
                            score.isAbsent(),
                            score.getGradedBy() != null ? score.getGradedBy().getValue() : null,
                            score.getGradedAt(),
                            score.getRemarks(),
                            subjectName,
                            maxScore);
                })
                .collect(Collectors.toList());
    }

    /**
     * 查询考试的成绩统计
     */
    @Transactional(readOnly = true)
    public ScoreStatisticsResponse getScoreStatistics(UUID examId, UUID requesterId) {
        // 权限检查
        if (!examPermissionService.hasExamPermission(requesterId, examId, Permission.SCORE_STATISTICS)) {
            throw new SecurityException("无权限查看成绩统计");
        }

        List<ExamScore> scores = examScoreRepository.findByExamId(ExamId.of(examId));

        // 计算统计数据
        long totalCount = scores.size();
        long absentCount = scores.stream().mapToLong(s -> s.isAbsent() ? 1 : 0).sum();
        long validCount = totalCount - absentCount;

        if (validCount > 0) {
            double averageScore = scores.stream()
                    .filter(s -> !s.isAbsent())
                    .mapToDouble(s -> s.getScore().doubleValue())
                    .average()
                    .orElse(0.0);

            BigDecimal maxScore = scores.stream()
                    .filter(s -> !s.isAbsent())
                    .map(ExamScore::getScore)
                    .max(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

            BigDecimal minScore = scores.stream()
                    .filter(s -> !s.isAbsent())
                    .map(ExamScore::getScore)
                    .min(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

            return new ScoreStatisticsResponse(
                    examId,
                    totalCount,
                    validCount,
                    absentCount,
                    BigDecimal.valueOf(averageScore),
                    maxScore,
                    minScore);
        } else {
            return new ScoreStatisticsResponse(
                    examId,
                    totalCount,
                    0L,
                    absentCount,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO);
        }
    }

    /**
     * 判断是否有面试资格
     */
    @Transactional(readOnly = true)
    public boolean isEligibleForInterview(UUID applicationId) {
        List<ExamScore> scores = examScoreRepository.findByApplicationId(ApplicationId.of(applicationId));

        // 获取所有笔试科目的成绩
        List<ExamScore> writtenScores = scores.stream()
                .filter(score -> {
                    // 需要查询科目类型，这里简化处理
                    Optional<Subject> subject = subjectRepository.findById(score.getSubjectId());
                    return subject.isPresent()
                            && subject.get().getType() == com.duanruo.exam.domain.exam.SubjectType.WRITTEN;
                })
                .collect(Collectors.toList());

        // 检查所有笔试科目是否及格
        return writtenScores.stream()
                .allMatch(score -> {
                    if (score.isAbsent())
                        return false;
                    Optional<Subject> subject = subjectRepository.findById(score.getSubjectId());
                    return subject.isPresent() &&
                            score.isPassing(subject.get().getPassingScore());
                });
    }

    /**
     * 计算排名（按考试和岗位）
     */
    @Transactional(readOnly = true)
    public List<ScoreRankingResponse> calculateRanking(UUID examId, UUID positionId, UUID requesterId) {
        // 权限检查
        if (!examPermissionService.hasExamPermission(requesterId, examId, Permission.SCORE_STATISTICS)) {
            throw new SecurityException("无权限查看成绩排名");
        }

        // 1. 查询该岗位的所有申请
        List<Application> applications = positionId != null
                ? applicationRepository.findByPosition(com.duanruo.exam.domain.exam.PositionId.of(positionId))
                : applicationRepository.findByExam(ExamId.of(examId));

        // 2. 获取岗位信息
        com.duanruo.exam.domain.exam.Position position = null;
        if (positionId != null) {
            position = positionRepository.findById(com.duanruo.exam.domain.exam.PositionId.of(positionId))
                    .orElseThrow(() -> new IllegalArgumentException("岗位不存在"));
        }

        // 3. 计算每个申请的总分
        Map<UUID, BigDecimal> totalScores = new HashMap<>();
        Map<UUID, Boolean> hasAbsent = new HashMap<>();

        for (Application app : applications) {
            List<ExamScore> scores = examScoreRepository.findByApplicationId(app.getId());

            // 检查是否有缺考
            boolean absent = scores.stream().anyMatch(ExamScore::isAbsent);
            hasAbsent.put(app.getId().getValue(), absent);

            if (!absent && !scores.isEmpty()) {
                // 计算总分
                BigDecimal total = scores.stream()
                        .map(ExamScore::getScore)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                totalScores.put(app.getId().getValue(), total);
            }
        }

        // 4. 按总分排序
        List<Map.Entry<UUID, BigDecimal>> sortedScores = totalScores.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue())) // 降序
                .collect(Collectors.toList());

        // 5. 计算排名（处理并列）
        List<ScoreRankingResponse> rankings = new ArrayList<>();
        int currentRank = 1;
        BigDecimal previousScore = null;
        int sameRankCount = 0;

        for (int i = 0; i < sortedScores.size(); i++) {
            Map.Entry<UUID, BigDecimal> entry = sortedScores.get(i);
            UUID applicationId = entry.getKey();
            BigDecimal totalScore = entry.getValue();

            // 判断是否并列
            boolean isTied = false;
            if (previousScore != null && previousScore.compareTo(totalScore) == 0) {
                isTied = true;
                sameRankCount++;
            } else {
                if (sameRankCount > 0) {
                    currentRank += sameRankCount + 1;
                    sameRankCount = 0;
                } else if (i > 0) {
                    currentRank++;
                }
            }

            // 获取申请信息
            Application app = applications.stream()
                    .filter(a -> a.getId().getValue().equals(applicationId))
                    .findFirst()
                    .orElse(null);

            if (app != null) {
                // 获取准考证信息（包含考生姓名和身份证号）
                Optional<com.duanruo.exam.domain.ticket.Ticket> ticketOpt = ticketRepository
                        .findByApplicationId(app.getId());

                String candidateName = "未知";
                String idCard = "未知";
                String ticketNo = null;

                if (ticketOpt.isPresent()) {
                    com.duanruo.exam.domain.ticket.Ticket ticket = ticketOpt.get();
                    candidateName = ticket.getCandidateName();
                    idCard = ticket.getCandidateIdNumber();
                    ticketNo = ticket.getTicketNo().getValue();
                }

                // 获取岗位名称
                String positionName = position != null ? position.getTitle() : "未知";

                // 判断是否有面试资格（这里简化处理，实际应该根据业务规则）
                boolean isInterviewEligible = !hasAbsent.getOrDefault(applicationId, true);

                rankings.add(new ScoreRankingResponse(
                        applicationId,
                        candidateName,
                        idCard,
                        ticketNo,
                        app.getPositionId().getValue(),
                        positionName,
                        totalScore,
                        currentRank,
                        isTied,
                        isInterviewEligible,
                        (long) sortedScores.size()));
            }

            previousScore = totalScore;
        }

        return rankings;
    }

    /**
     * 根据科目查询成绩
     */
    @Transactional(readOnly = true)
    public List<ScoreResponse> getScoresBySubject(UUID subjectId, UUID requesterId) {
        // 1. 验证科目存在
        subjectRepository.findById(SubjectId.of(subjectId))
                .orElseThrow(() -> new IllegalArgumentException("科目不存在"));

        // 2. 查询成绩
        List<ExamScore> scores = examScoreRepository.findBySubjectId(SubjectId.of(subjectId));

        return scores.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 根据考试查询所有成绩
     */
    @Transactional(readOnly = true)
    public List<ScoreResponse> getScoresByExam(UUID examId, UUID requesterId) {
        // 1. 权限检查
        if (!examPermissionService.hasExamPermission(requesterId, examId, Permission.SCORE_VIEW)) {
            throw new SecurityException("无权限查看成绩");
        }

        // 2. 查询成绩
        List<ExamScore> scores = examScoreRepository.findByExamId(ExamId.of(examId));

        return scores.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 删除成绩记录
     */
    public void deleteScore(UUID scoreId, UUID requesterId) {
        // 1. 查找成绩记录
        ExamScore score = examScoreRepository.findById(com.duanruo.exam.domain.score.ExamScoreId.of(scoreId))
                .orElseThrow(() -> new IllegalArgumentException("成绩记录不存在"));

        // 2. 查找申请以获取考试ID
        Application application = applicationRepository.findById(score.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("申请不存在"));

        // 3. 权限检查
        if (!examPermissionService.hasExamPermission(requesterId, application.getExamId().getValue(),
                Permission.SCORE_DELETE)) {
            throw new SecurityException("无权限删除成绩");
        }

        // 4. 删除成绩
        examScoreRepository.deleteById(com.duanruo.exam.domain.score.ExamScoreId.of(scoreId));
    }

    /**
     * 导出考试成绩为Excel
     */
    @Transactional(readOnly = true)
    public byte[] exportScoresToExcel(UUID examId, UUID requesterId) throws IOException {
        // 1. 权限检查
        if (!examPermissionService.hasExamPermission(requesterId, examId, Permission.SCORE_VIEW)) {
            throw new SecurityException("无权限导出成绩");
        }

        // 2. 获取考试信息
        Exam exam = examRepository.findById(ExamId.of(examId))
                .orElseThrow(() -> new IllegalArgumentException("考试不存在"));

        // 3. 查询所有成绩
        List<ExamScore> scores = examScoreRepository.findByExamId(ExamId.of(examId));

        // 4. 获取所有申请和相关信息
        Map<UUID, Application> applicationMap = new HashMap<>();
        Map<UUID, Ticket> ticketMap = new HashMap<>();
        Map<UUID, Subject> subjectMap = new HashMap<>();
        Map<UUID, com.duanruo.exam.domain.exam.Position> positionMap = new HashMap<>();

        for (ExamScore score : scores) {
            UUID applicationId = score.getApplicationId().getValue();

            // 获取申请信息
            if (!applicationMap.containsKey(applicationId)) {
                Application app = applicationRepository.findById(score.getApplicationId())
                        .orElse(null);
                if (app != null) {
                    applicationMap.put(applicationId, app);

                    // 获取准考证信息
                    Optional<Ticket> ticketOpt = ticketRepository.findByApplicationId(app.getId());
                    if (ticketOpt.isPresent()) {
                        ticketMap.put(applicationId, ticketOpt.get());
                    }

                    // 获取岗位信息
                    UUID positionId = app.getPositionId().getValue();
                    if (!positionMap.containsKey(positionId)) {
                        positionRepository.findById(app.getPositionId())
                                .ifPresent(position -> positionMap.put(positionId, position));
                    }
                }
            }

            // 获取科目信息
            UUID subjectId = score.getSubjectId().getValue();
            if (!subjectMap.containsKey(subjectId)) {
                subjectRepository.findById(score.getSubjectId())
                        .ifPresent(subject -> subjectMap.put(subjectId, subject));
            }
        }

        // 5. 按申请分组计算总分和排名
        Map<UUID, BigDecimal> totalScores = new HashMap<>();
        Map<UUID, Boolean> hasAbsent = new HashMap<>();

        for (Application app : applicationMap.values()) {
            UUID applicationId = app.getId().getValue();
            List<ExamScore> appScores = scores.stream()
                    .filter(s -> s.getApplicationId().getValue().equals(applicationId))
                    .collect(Collectors.toList());

            boolean absent = appScores.stream().anyMatch(ExamScore::isAbsent);
            hasAbsent.put(applicationId, absent);

            if (!absent && !appScores.isEmpty()) {
                BigDecimal total = appScores.stream()
                        .map(ExamScore::getScore)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                totalScores.put(applicationId, total);
            }
        }

        // 6. 计算排名
        List<Map.Entry<UUID, BigDecimal>> sortedScores = totalScores.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .collect(Collectors.toList());

        Map<UUID, Integer> rankMap = new HashMap<>();
        int currentRank = 1;
        BigDecimal previousScore = null;
        int sameRankCount = 0;

        for (int i = 0; i < sortedScores.size(); i++) {
            Map.Entry<UUID, BigDecimal> entry = sortedScores.get(i);
            UUID applicationId = entry.getKey();
            BigDecimal totalScore = entry.getValue();

            if (previousScore != null && previousScore.compareTo(totalScore) == 0) {
                sameRankCount++;
            } else {
                if (sameRankCount > 0) {
                    currentRank += sameRankCount + 1;
                    sameRankCount = 0;
                } else if (i > 0) {
                    currentRank++;
                }
            }
            rankMap.put(applicationId, currentRank);
            previousScore = totalScore;
        }

        // 7. 创建Excel工作簿
        try (Workbook workbook = new XSSFWorkbook()) {
            // 创建成绩明细表
            Sheet detailSheet = workbook.createSheet("成绩明细");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            // 创建标题行
            Row headerRow = detailSheet.createRow(0);
            String[] headers = {
                    "序号", "准考证号", "考生姓名", "身份证号", "报考岗位",
                    "科目名称", "成绩", "是否缺考", "总分", "排名", "录入时间", "备注"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 填充数据
            int rowNum = 1;
            int sequence = 1;
            for (ExamScore score : scores) {
                Application app = applicationMap.get(score.getApplicationId().getValue());
                if (app == null)
                    continue;

                Ticket ticket = ticketMap.get(app.getId().getValue());
                Subject subject = subjectMap.get(score.getSubjectId().getValue());
                com.duanruo.exam.domain.exam.Position position = positionMap.get(app.getPositionId().getValue());

                Row row = detailSheet.createRow(rowNum++);
                int colNum = 0;

                createCell(row, colNum++, String.valueOf(sequence++), dataStyle);
                createCell(row, colNum++, ticket != null ? ticket.getTicketNo().getValue() : "", dataStyle);
                createCell(row, colNum++, ticket != null ? ticket.getCandidateName() : "未知", dataStyle);
                createCell(row, colNum++, ticket != null ? ticket.getCandidateIdNumber() : "", dataStyle);
                createCell(row, colNum++, position != null ? position.getTitle() : "未知", dataStyle);
                createCell(row, colNum++, subject != null ? subject.getName() : "未知", dataStyle);
                createCell(row, colNum++, score.isAbsent() ? "缺考" : score.getScore().toString(), dataStyle);
                createCell(row, colNum++, score.isAbsent() ? "是" : "否", dataStyle);
                createCell(row, colNum++, totalScores.getOrDefault(app.getId().getValue(), BigDecimal.ZERO).toString(),
                        dataStyle);
                createCell(row, colNum++, rankMap.getOrDefault(app.getId().getValue(), 0).toString(), dataStyle);
                createCell(row, colNum++, formatDateTime(score.getGradedAt()), dataStyle);
                createCell(row, colNum++, score.getRemarks() != null ? score.getRemarks() : "", dataStyle);
            }

            // 自动调整列宽
            for (int i = 0; i < headers.length; i++) {
                detailSheet.autoSizeColumn(i);
            }

            // 创建统计表
            Sheet statsSheet = workbook.createSheet("成绩统计");
            Row statsHeaderRow = statsSheet.createRow(0);
            String[] statsHeaders = { "统计项", "数值" };
            for (int i = 0; i < statsHeaders.length; i++) {
                Cell cell = statsHeaderRow.createCell(i);
                cell.setCellValue(statsHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            ScoreStatisticsResponse statistics = getScoreStatistics(examId, requesterId);
            int statsRowNum = 1;
            createStatsRow(statsSheet, statsRowNum++, "考试名称", exam.getTitle(), dataStyle);
            createStatsRow(statsSheet, statsRowNum++, "总成绩记录数", String.valueOf(statistics.totalCount()), dataStyle);
            createStatsRow(statsSheet, statsRowNum++, "有效成绩数", String.valueOf(statistics.validCount()), dataStyle);
            createStatsRow(statsSheet, statsRowNum++, "缺考人数", String.valueOf(statistics.absentCount()), dataStyle);
            createStatsRow(statsSheet, statsRowNum++, "平均分", statistics.averageScore().toString(), dataStyle);
            createStatsRow(statsSheet, statsRowNum++, "最高分", statistics.maxScore().toString(), dataStyle);
            createStatsRow(statsSheet, statsRowNum++, "最低分", statistics.minScore().toString(), dataStyle);
            createStatsRow(statsSheet, statsRowNum++, "导出时间", formatDateTime(LocalDateTime.now()), dataStyle);

            for (int i = 0; i < statsHeaders.length; i++) {
                statsSheet.autoSizeColumn(i);
            }

            // 写入字节数组
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private void createStatsRow(Sheet sheet, int rowNum, String label, String value, CellStyle style) {
        Row row = sheet.createRow(rowNum);
        createCell(row, 0, label, style);
        createCell(row, 1, value, style);
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_TIME_FORMATTER) : "";
    }

    /**
     * 转换为响应DTO
     */
    private ScoreResponse toResponse(ExamScore examScore) {
        // 获取科目信息
        Subject subject = subjectRepository.findById(examScore.getSubjectId()).orElse(null);
        String subjectName = subject != null ? subject.getName() : null;
        BigDecimal totalScore = subject != null && subject.getMaxScore() != null
                ? subject.getMaxScore()
                : null;

        return new ScoreResponse(
                examScore.getId().getValue(),
                examScore.getApplicationId().getValue(),
                examScore.getSubjectId().getValue(),
                examScore.getScore(),
                examScore.isAbsent(),
                examScore.getGradedBy() != null ? examScore.getGradedBy().getValue() : null,
                examScore.getGradedAt(),
                examScore.getRemarks(),
                subjectName,
                totalScore);
    }
}
