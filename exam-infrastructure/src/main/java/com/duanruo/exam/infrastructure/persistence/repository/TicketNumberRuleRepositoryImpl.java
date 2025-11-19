package com.duanruo.exam.infrastructure.persistence.repository;

import com.duanruo.exam.domain.exam.ExamId;
import com.duanruo.exam.domain.ticket.TicketNumberRule;
import com.duanruo.exam.domain.ticket.TicketNumberRuleRepository;
import com.duanruo.exam.infrastructure.persistence.entity.TicketNumberRuleEntity;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Primary
public class TicketNumberRuleRepositoryImpl implements TicketNumberRuleRepository {

    private final JpaTicketNumberRuleRepository jpa;

    public TicketNumberRuleRepositoryImpl(JpaTicketNumberRuleRepository jpa) { this.jpa = jpa; }

    @Override
    public Optional<TicketNumberRule> findByExamId(ExamId examId) {
        return jpa.findByExamId(examId.getValue()).map(this::toDomain);
    }

    @Override
    public void save(TicketNumberRule rule) {
        TicketNumberRuleEntity e = new TicketNumberRuleEntity(
                rule.getExamId().getValue(),
                rule.getCustomPrefix(),
                rule.isIncludeExamCode(),
                rule.isIncludePositionCode(),
                rule.getDateFormat().name(),
                rule.getSequenceLength(),
                rule.getSequenceStart(),
                rule.isDailyReset(),
                rule.getChecksumType().name(),
                rule.getSeparator()
        );

        // 如果已存在则更新
        jpa.findByExamId(rule.getExamId().getValue()).ifPresentOrElse(exist -> {
            exist.setCustomPrefix(e.getCustomPrefix());
            exist.setIncludeExamCode(e.isIncludeExamCode());
            exist.setIncludePositionCode(e.isIncludePositionCode());
            exist.setDateFormat(e.getDateFormat());
            exist.setSequenceLength(e.getSequenceLength());
            exist.setSequenceStart(e.getSequenceStart());
            exist.setDailyReset(e.isDailyReset());
            exist.setChecksumType(e.getChecksumType());
            exist.setSeparator(e.getSeparator());
            exist.setIncludeDate(e.isIncludeDate());
            jpa.save(exist);
        }, () -> jpa.save(e));
    }

    @Override
    public void deleteByExamId(ExamId examId) {
        jpa.deleteByExamId(examId.getValue());
    }

    private TicketNumberRule toDomain(TicketNumberRuleEntity e) {
        return TicketNumberRule.create(
                ExamId.of(e.getExamId()),
                e.getCustomPrefix(),
                e.isIncludeExamCode(),
                e.isIncludePositionCode(),
                TicketNumberRule.DateFormat.valueOf(e.getDateFormat()),
                e.getSequenceLength(),
                e.getSequenceStart(),
                e.isDailyReset(),
                TicketNumberRule.ChecksumType.valueOf(e.getChecksumType()),
                e.getSeparator()
        );
    }
}

