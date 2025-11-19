package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.exam.Exam;
import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.exam.ExamRepository;
import com.duanruo.exam.domain.ticket.TicketNumberRule;
import com.duanruo.exam.domain.ticket.TicketNumberRuleRepository;
import com.duanruo.exam.domain.ticket.TicketSequenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class TicketNumberRuleApplicationService {
    private final TicketNumberRuleRepository ruleRepository;
    private final TicketSequenceRepository sequenceRepository;
    private final ExamRepository examRepository;

    public TicketNumberRuleApplicationService(TicketNumberRuleRepository ruleRepository,
                                              TicketSequenceRepository sequenceRepository,
                                              ExamRepository examRepository) {
        this.ruleRepository = ruleRepository;
        this.sequenceRepository = sequenceRepository;
        this.examRepository = examRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTemplate(java.util.UUID examId) {
        var id = ExamId.of(examId);
        var rule = ruleRepository.findByExamId(id).orElse(TicketNumberRule.defaultFor(id));
        return Map.of(
                "examId", examId.toString(),
                "customPrefix", rule.getCustomPrefix() != null ? rule.getCustomPrefix() : "",
                "includeExamCode", rule.isIncludeExamCode(),
                "includePositionCode", rule.isIncludePositionCode(),
                "dateFormat", rule.getDateFormat().name(),
                "sequenceLength", rule.getSequenceLength(),
                "sequenceStart", rule.getSequenceStart(),
                "dailyReset", rule.isDailyReset(),
                "checksumType", rule.getChecksumType().name(),
                "separator", rule.getSeparator()
        );
    }

    public void updateTemplate(java.util.UUID examId, Map<String, Object> body) {
        var id = ExamId.of(examId);

        // 解析参数
        String customPrefix = Optional.ofNullable(body.get("customPrefix")).map(Object::toString).orElse(null);
        boolean includeExamCode = Optional.ofNullable(body.get("includeExamCode")).map(v -> (Boolean) v).orElse(true);
        boolean includePositionCode = Optional.ofNullable(body.get("includePositionCode")).map(v -> (Boolean) v).orElse(true);

        TicketNumberRule.DateFormat dateFormat = Optional.ofNullable(body.get("dateFormat"))
                .map(Object::toString)
                .map(s -> TicketNumberRule.DateFormat.valueOf(s))
                .orElse(TicketNumberRule.DateFormat.YYYYMMDD);

        int seqLen = Optional.ofNullable(body.get("sequenceLength")).map(v -> ((Number) v).intValue()).orElse(4);
        int seqStart = Optional.ofNullable(body.get("sequenceStart")).map(v -> ((Number) v).intValue()).orElse(1);
        boolean dailyReset = Optional.ofNullable(body.get("dailyReset")).map(v -> (Boolean) v).orElse(true);

        TicketNumberRule.ChecksumType checksum = Optional.ofNullable(body.get("checksumType"))
                .map(Object::toString)
                .map(s -> TicketNumberRule.ChecksumType.valueOf(s))
                .orElse(TicketNumberRule.ChecksumType.NONE);

        String separator = Optional.ofNullable(body.get("separator")).map(Object::toString).orElse("-");

        // 创建规则
        var rule = TicketNumberRule.create(id, customPrefix, includeExamCode, includePositionCode,
                dateFormat, seqLen, seqStart, dailyReset, checksum, separator);
        ruleRepository.save(rule);
    }

    public void resetTemplate(java.util.UUID examId) {
        var id = ExamId.of(examId);
        ruleRepository.deleteByExamId(id);
    }

    public String generateNumber(java.util.UUID examId, String examCode, String positionCode, LocalDate today) {
        var id = ExamId.of(examId);
        TicketNumberRule rule = ruleRepository.findByExamId(id).orElse(TicketNumberRule.defaultFor(id));
        long seq = sequenceRepository.next(id, today, rule.isDailyReset(), rule.getSequenceStart());
        return rule.render(examCode, positionCode, today, seq);
    }
}

