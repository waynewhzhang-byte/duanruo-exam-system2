package com.duanruo.exam.shared.validation;

import java.util.regex.Pattern;

/**
 * 输入验证工具类
 * 防止SQL注入、XSS攻击等安全问题
 */
public class InputValidator {

    // SQL注入关键字模式
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "('.+--)|(--)|(;)|(\\|\\|)|(\\*)|" +
        "(\\bEXEC\\b)|(\\bEXECUTE\\b)|(\\bINSERT\\b)|(\\bUPDATE\\b)|(\\bDELETE\\b)|" +
        "(\\bDROP\\b)|(\\bCREATE\\b)|(\\bALTER\\b)|(\\bTRUNCATE\\b)|" +
        "(\\bSELECT\\b.+\\bFROM\\b)|(\\bUNION\\b.+\\bSELECT\\b)",
        Pattern.CASE_INSENSITIVE
    );

    // XSS攻击模式
    private static final Pattern XSS_PATTERN = Pattern.compile(
        "(<script[^>]*>.*?</script>)|" +
        "(<iframe[^>]*>.*?</iframe>)|" +
        "(<object[^>]*>.*?</object>)|" +
        "(<embed[^>]*>)|" +
        "(javascript:)|(onerror=)|(onload=)|(onclick=)|" +
        "(<img[^>]*onerror[^>]*>)|" +
        "(<svg[^>]*onload[^>]*>)",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // 路径遍历模式
    private static final Pattern PATH_TRAVERSAL_PATTERN = Pattern.compile(
        "(\\.\\./)|(\\.\\\\)|(%2e%2e/)|(%2e%2e\\\\)|(\\.\\.%2f)|(\\.\\.%5c)",
        Pattern.CASE_INSENSITIVE
    );

    // 邮箱格式
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    // 手机号格式（中国）
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^1[3-9]\\d{9}$"
    );

    // 身份证号格式（中国）
    private static final Pattern ID_CARD_PATTERN = Pattern.compile(
        "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$"
    );

    /**
     * 检查是否包含SQL注入
     */
    public static boolean containsSqlInjection(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }
        return SQL_INJECTION_PATTERN.matcher(input).find();
    }

    /**
     * 检查是否包含XSS攻击
     */
    public static boolean containsXss(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }
        return XSS_PATTERN.matcher(input).find();
    }

    /**
     * 检查是否包含路径遍历
     */
    public static boolean containsPathTraversal(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }
        return PATH_TRAVERSAL_PATTERN.matcher(input).find();
    }

    /**
     * 验证邮箱格式
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * 验证手机号格式
     */
    public static boolean isValidPhone(String phone) {
        if (phone == null || phone.isEmpty()) {
            return false;
        }
        return PHONE_PATTERN.matcher(phone).matches();
    }

    /**
     * 验证身份证号格式
     */
    public static boolean isValidIdCard(String idCard) {
        if (idCard == null || idCard.isEmpty()) {
            return false;
        }
        return ID_CARD_PATTERN.matcher(idCard).matches();
    }

    /**
     * 清理HTML标签
     */
    public static String sanitizeHtml(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        // 移除所有HTML标签
        return input.replaceAll("<[^>]*>", "");
    }

    /**
     * 转义HTML特殊字符
     */
    public static String escapeHtml(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
            .replace("/", "&#x2F;");
    }

    /**
     * 验证字符串长度
     */
    public static boolean isValidLength(String input, int minLength, int maxLength) {
        if (input == null) {
            return false;
        }
        int length = input.length();
        return length >= minLength && length <= maxLength;
    }

    /**
     * 验证是否只包含字母和数字
     */
    public static boolean isAlphanumeric(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }
        return input.matches("^[a-zA-Z0-9]+$");
    }

    /**
     * 验证是否只包含数字
     */
    public static boolean isNumeric(String input) {
        if (input == null || input.isEmpty()) {
            return false;
        }
        return input.matches("^\\d+$");
    }

    /**
     * 综合安全检查
     * 检查SQL注入、XSS、路径遍历
     */
    public static void validateSecurity(String input, String fieldName) {
        if (input == null || input.isEmpty()) {
            return;
        }

        if (containsSqlInjection(input)) {
            throw new SecurityException(fieldName + " 包含非法字符（SQL注入）");
        }

        if (containsXss(input)) {
            throw new SecurityException(fieldName + " 包含非法字符（XSS攻击）");
        }

        if (containsPathTraversal(input)) {
            throw new SecurityException(fieldName + " 包含非法字符（路径遍历）");
        }
    }

    /**
     * 验证并清理用户输入
     */
    public static String validateAndSanitize(String input, String fieldName, int maxLength) {
        if (input == null || input.isEmpty()) {
            return input;
        }

        // 安全检查
        validateSecurity(input, fieldName);

        // 长度检查
        if (input.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " 长度超过限制（最大" + maxLength + "字符）");
        }

        // 清理HTML
        return sanitizeHtml(input).trim();
    }
}

