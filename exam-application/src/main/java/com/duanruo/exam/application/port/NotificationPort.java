package com.duanruo.exam.application.port;

import java.util.Map;
import java.util.UUID;

/**
 * 应用层端口：通知发送（邮件 / 短信 / 站内信）。
 * 基础设施层提供具体实现；此处仅定义能力。
 */
public interface NotificationPort {

    enum Channel { EMAIL, SMS, IN_APP }

    /**
     * 向指定用户发送模板通知（根据用户资料选择渠道，如邮箱/手机）。
     */
    void sendToUser(UUID userId, String templateCode, Map<String, Object> variables);

    /**
     * 向指定地址发送通知（显式渠道）。
     */
    void sendToAddress(Channel channel, String address, String templateCode, Map<String, Object> variables);
}

