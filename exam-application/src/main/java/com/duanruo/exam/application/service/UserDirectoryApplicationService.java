package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserDirectoryApplicationService {

    private final UserRepository userRepository;

    public UserDirectoryApplicationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String resolveDisplayName(UUID userId) {
        if (userId == null) return "";
        return userRepository.findById(UserId.of(userId))
                .map(this::displayNameOf)
                .orElse(userId.toString());
    }

    public Map<UUID, String> resolveDisplayNames(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) return Collections.emptyMap();
        // De-dup
        Set<UUID> ids = new LinkedHashSet<>(userIds);
        Map<UUID, String> result = new LinkedHashMap<>();
        for (UUID id : ids) {
            result.put(id, resolveDisplayName(id));
        }
        return result;
    }

    private String displayNameOf(User u) {
        String full = u.getFullName();
        if (full != null && !full.isBlank()) return full;
        String username = u.getUsername();
        return (username == null || username.isBlank()) ? u.getId().toString() : username;
    }
}

