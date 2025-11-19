package com.duanruo.exam.infrastructure.notification;

import com.duanruo.exam.application.port.NotificationPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Stub [0m[37mNotification Adapter[0m
 * Minimal in-memory implementation for tests and local dev.
 */
@Component
public class StubNotificationAdapter implements NotificationPort {
    private static final Logger log = LoggerFactory.getLogger(StubNotificationAdapter.class);

    public static final class CapturedMessage {
        public final UUID userId; // nullable when sendToAddress used
        public final Channel channel; // may be null for sendToUser
        public final String address; // nullable
        public final String templateCode;
        public final Map<String, Object> variables;
        public final LocalDateTime capturedAt;
        public CapturedMessage(UUID userId, Channel channel, String address, String templateCode, Map<String, Object> variables) {
            this.userId = userId;
            this.channel = channel;
            this.address = address;
            this.templateCode = templateCode;
            this.variables = variables != null ? new LinkedHashMap<>(variables) : Collections.emptyMap();
            this.capturedAt = LocalDateTime.now();
        }
    }

    private final List<CapturedMessage> inbox = Collections.synchronizedList(new ArrayList<>());

    @Override
    public void sendToUser(UUID userId, String templateCode, Map<String, Object> variables) {
        log.info("[NOTIFY][USER] userId={} template={} vars={}", userId, templateCode, variables);
        inbox.add(new CapturedMessage(userId, null, null, templateCode, variables));
    }

    @Override
    public void sendToAddress(Channel channel, String address, String templateCode, Map<String, Object> variables) {
        log.info("[NOTIFY][{}] to={} template={} vars={}", channel, address, templateCode, variables);
        inbox.add(new CapturedMessage(null, channel, address, templateCode, variables));
    }

    public List<CapturedMessage> getCaptured() {
        return List.copyOf(inbox);
    }

    public void clear() {
        inbox.clear();
    }
}

