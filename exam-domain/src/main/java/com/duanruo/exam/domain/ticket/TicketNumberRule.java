package com.duanruo.exam.domain.ticket;

import com.duanruo.exam.domain.exam.ExamId;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

/**
 * Ticket number rule (per exam)
 *
 * 准考证编号规则，支持：
 * 1. 自定义前缀
 * 2. 考试代码
 * 3. 岗位代码
 * 4. 日期（可选）
 * 5. 序列号
 * 6. 校验位（可选）
 */
public class TicketNumberRule {

    /**
     * 校验位类型
     */
    public enum ChecksumType {
        NONE,           // 无校验位
        LUHN,           // Luhn算法（用于信用卡等）
        MODULO_11,      // Modulo 11算法（用于ISBN等）
        MODULO_10       // Modulo 10算法
    }

    /**
     * 日期格式
     */
    public enum DateFormat {
        NONE,           // 不包含日期
        YYYYMMDD,       // 20251021
        YYMMDD,         // 251021
        YYYYMM,         // 202510
        YYMM            // 2510
    }

    private final ExamId examId;
    private final String customPrefix;      // 自定义前缀（可选）
    private final boolean includeExamCode;  // 是否包含考试代码
    private final boolean includePositionCode; // 是否包含岗位代码
    private final DateFormat dateFormat;    // 日期格式
    private final int sequenceLength;       // 序列号长度
    private final int sequenceStart;        // 序列号起始值
    private final boolean dailyReset;       // 是否每日重置序列号
    private final ChecksumType checksumType; // 校验位类型
    private final String separator;         // 分隔符（默认"-"）

    private TicketNumberRule(ExamId examId, String customPrefix, boolean includeExamCode,
                             boolean includePositionCode, DateFormat dateFormat,
                             int sequenceLength, int sequenceStart,
                             boolean dailyReset, ChecksumType checksumType, String separator) {
        this.examId = examId;
        this.customPrefix = customPrefix;
        this.includeExamCode = includeExamCode;
        this.includePositionCode = includePositionCode;
        this.dateFormat = dateFormat;
        this.sequenceLength = sequenceLength;
        this.sequenceStart = sequenceStart;
        this.dailyReset = dailyReset;
        this.checksumType = checksumType;
        this.separator = separator;
    }

    /**
     * 默认规则
     */
    public static TicketNumberRule defaultFor(ExamId examId) {
        return new TicketNumberRule(
                examId,
                null,           // 无自定义前缀
                true,           // 包含考试代码
                true,           // 包含岗位代码
                DateFormat.YYYYMMDD, // 包含完整日期
                4,              // 序列号长度4位
                1,              // 从1开始
                true,           // 每日重置
                ChecksumType.NONE, // 无校验位
                "-"             // 使用"-"分隔
        );
    }

    /**
     * 向后兼容的工厂方法
     */
    public static TicketNumberRule of(ExamId examId, boolean includeDate, int sequenceLength, int sequenceStart,
                                      boolean dailyReset, ChecksumType checksumType) {
        if (examId == null) throw new IllegalArgumentException("examId required");
        if (sequenceLength <= 0 || sequenceLength > 10) throw new IllegalArgumentException("invalid sequenceLength");
        if (sequenceStart < 0) throw new IllegalArgumentException("invalid sequenceStart");

        return new TicketNumberRule(
                examId,
                null,
                true,
                true,
                includeDate ? DateFormat.YYYYMMDD : DateFormat.NONE,
                sequenceLength,
                sequenceStart,
                dailyReset,
                checksumType == null ? ChecksumType.NONE : checksumType,
                "-"
        );
    }

    /**
     * 完整的工厂方法
     */
    public static TicketNumberRule create(ExamId examId, String customPrefix, boolean includeExamCode,
                                         boolean includePositionCode, DateFormat dateFormat,
                                         int sequenceLength, int sequenceStart,
                                         boolean dailyReset, ChecksumType checksumType, String separator) {
        if (examId == null) throw new IllegalArgumentException("examId required");
        if (sequenceLength <= 0 || sequenceLength > 10) throw new IllegalArgumentException("invalid sequenceLength");
        if (sequenceStart < 0) throw new IllegalArgumentException("invalid sequenceStart");

        return new TicketNumberRule(
                examId,
                customPrefix,
                includeExamCode,
                includePositionCode,
                dateFormat == null ? DateFormat.NONE : dateFormat,
                sequenceLength,
                sequenceStart,
                dailyReset,
                checksumType == null ? ChecksumType.NONE : checksumType,
                separator == null || separator.isEmpty() ? "-" : separator
        );
    }

    /**
     * 生成准考证号
     */
    public String render(String examCode, String positionCode, LocalDate date, long seq) {
        StringBuilder sb = new StringBuilder();

        // 1. 自定义前缀
        if (customPrefix != null && !customPrefix.isEmpty()) {
            sb.append(safe(customPrefix));
            if (includeExamCode || includePositionCode || dateFormat != DateFormat.NONE) {
                sb.append(separator);
            }
        }

        // 2. 考试代码
        if (includeExamCode && examCode != null) {
            sb.append(safe(examCode));
            if (includePositionCode || dateFormat != DateFormat.NONE) {
                sb.append(separator);
            }
        }

        // 3. 岗位代码
        if (includePositionCode && positionCode != null) {
            sb.append(safe(positionCode));
            if (dateFormat != DateFormat.NONE) {
                sb.append(separator);
            }
        }

        // 4. 日期
        if (dateFormat != DateFormat.NONE && date != null) {
            sb.append(formatDate(date, dateFormat));
            sb.append(separator);
        }

        // 5. 序列号
        String seqStr = String.format("%0" + sequenceLength + "d", seq);
        sb.append(seqStr);

        // 6. 校验位
        if (checksumType != ChecksumType.NONE) {
            String baseNumber = sb.toString().replaceAll("[^0-9]", "");
            char checkDigit = calculateChecksum(baseNumber, checksumType);
            sb.append(separator).append(checkDigit);
        }

        return sb.toString();
    }

    /**
     * 格式化日期
     */
    private String formatDate(LocalDate date, DateFormat format) {
        return switch (format) {
            case YYYYMMDD -> date.format(DateTimeFormatter.BASIC_ISO_DATE); // 20251021
            case YYMMDD -> date.format(DateTimeFormatter.ofPattern("yyMMdd")); // 251021
            case YYYYMM -> date.format(DateTimeFormatter.ofPattern("yyyyMM")); // 202510
            case YYMM -> date.format(DateTimeFormatter.ofPattern("yyMM")); // 2510
            default -> "";
        };
    }

    /**
     * 计算校验位
     */
    private char calculateChecksum(String number, ChecksumType type) {
        return switch (type) {
            case LUHN -> calculateLuhnChecksum(number);
            case MODULO_11 -> calculateModulo11Checksum(number);
            case MODULO_10 -> calculateModulo10Checksum(number);
            default -> '0';
        };
    }

    /**
     * Luhn算法校验位
     */
    private char calculateLuhnChecksum(String number) {
        int sum = 0;
        boolean alternate = false;

        for (int i = number.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(number.charAt(i));

            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            alternate = !alternate;
        }

        int checkDigit = (10 - (sum % 10)) % 10;
        return Character.forDigit(checkDigit, 10);
    }

    /**
     * Modulo 11算法校验位
     */
    private char calculateModulo11Checksum(String number) {
        int sum = 0;
        int weight = 2;

        for (int i = number.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(number.charAt(i));
            sum += digit * weight;
            weight = weight == 7 ? 2 : weight + 1;
        }

        int remainder = sum % 11;
        int checkDigit = (11 - remainder) % 11;

        if (checkDigit == 10) {
            return 'X';
        }

        return Character.forDigit(checkDigit, 10);
    }

    /**
     * Modulo 10算法校验位
     */
    private char calculateModulo10Checksum(String number) {
        int sum = 0;

        for (int i = 0; i < number.length(); i++) {
            int digit = Character.getNumericValue(number.charAt(i));
            sum += digit;
        }

        int checkDigit = (10 - (sum % 10)) % 10;
        return Character.forDigit(checkDigit, 10);
    }

    private String safe(String s) {
        return s == null ? "" : s.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
    }

    // Getters
    public ExamId getExamId() { return examId; }
    public String getCustomPrefix() { return customPrefix; }
    public boolean isIncludeExamCode() { return includeExamCode; }
    public boolean isIncludePositionCode() { return includePositionCode; }
    public DateFormat getDateFormat() { return dateFormat; }
    public int getSequenceLength() { return sequenceLength; }
    public int getSequenceStart() { return sequenceStart; }
    public boolean isDailyReset() { return dailyReset; }
    public ChecksumType getChecksumType() { return checksumType; }
    public String getSeparator() { return separator; }

    /**
     * 向后兼容的getter
     */
    @Deprecated
    public boolean isIncludeDate() { return dateFormat != DateFormat.NONE; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TicketNumberRule that = (TicketNumberRule) o;
        return Objects.equals(examId, that.examId);
    }

    @Override public int hashCode() { return Objects.hash(examId); }
}

