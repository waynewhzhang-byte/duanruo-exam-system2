package com.duanruo.exam.domain.exam;

/**
 * 考试状态枚举
 *
 * 状态流转：
 * DRAFT → OPEN → CLOSED → IN_PROGRESS → COMPLETED
 *           ↓       ↓          ↓            ↓
 *         (可报名) (报名截止) (考试中)    (已结束)
 */
public enum ExamStatus {

    /**
     * 草稿状态 - 考试正在创建中，尚未开放报名
     */
    DRAFT("Draft", "草稿"),

    /**
     * 开放报名 - 考试已开放报名，考生可以提交报名申请
     */
    OPEN("Open", "开放报名"),

    /**
     * 报名关闭 - 报名时间已结束，不再接受新的报名申请
     * 此时考试尚未开始，可以进行报名审核、准考证发放等工作
     */
    CLOSED("Closed", "报名关闭"),

    /**
     * 考试进行中 - 考试正在进行
     */
    IN_PROGRESS("InProgress", "考试中"),

    /**
     * 考试已完成 - 考试已结束，成绩已发布
     */
    COMPLETED("Completed", "已完成");

    private final String value;
    private final String displayName;

    ExamStatus(String value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public String getValue() {
        return value;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * 检查是否可以转换到目标状态
     */
    public boolean canTransitionTo(ExamStatus target) {
        return switch (this) {
            case DRAFT -> target == OPEN;
            case OPEN -> target == CLOSED;
            case CLOSED -> target == IN_PROGRESS;
            case IN_PROGRESS -> target == COMPLETED;
            case COMPLETED -> false; // 已完成是终态
        };
    }

    /**
     * 是否为终态
     */
    public boolean isTerminal() {
        return this == COMPLETED;
    }

    /**
     * 是否允许报名
     */
    public boolean allowsRegistration() {
        return this == OPEN;
    }

    /**
     * 是否可以进行报名审核
     */
    public boolean allowsReview() {
        return this == OPEN || this == CLOSED;
    }

    /**
     * 是否可以发放准考证
     */
    public boolean allowsTicketIssuance() {
        return this == CLOSED || this == IN_PROGRESS;
    }

    /**
     * 是否可以录入成绩
     */
    public boolean allowsScoreEntry() {
        return this == IN_PROGRESS || this == COMPLETED;
    }

    /**
     * 是否可以编辑考试信息
     */
    public boolean allowsEdit() {
        return this == DRAFT || this == OPEN;
    }
}
