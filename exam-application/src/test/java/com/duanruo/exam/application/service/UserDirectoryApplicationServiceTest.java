package com.duanruo.exam.application.service;

import com.duanruo.exam.domain.user.Role;
import com.duanruo.exam.domain.user.User;
import com.duanruo.exam.domain.user.UserId;
import com.duanruo.exam.domain.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class UserDirectoryApplicationServiceTest {

    @Test
    void resolveDisplayName_prefers_fullName_then_username_then_id() {
        UserRepository repo = mock(UserRepository.class);
        UserDirectoryApplicationService svc = new UserDirectoryApplicationService(repo);

        UUID id1 = UUID.randomUUID();
        User u1 = new User(UserId.of(id1), "jane", "jane@example.com", "hash", "简·多伊", Set.of(Role.ADMIN));
        when(repo.findById(UserId.of(id1))).thenReturn(Optional.of(u1));
        assertThat(svc.resolveDisplayName(id1)).isEqualTo("简·多伊");

        UUID id2 = UUID.randomUUID();
        User u2 = new User(UserId.of(id2), "john", "john@example.com", "hash", "", Set.of(Role.ADMIN));
        when(repo.findById(UserId.of(id2))).thenReturn(Optional.of(u2));
        assertThat(svc.resolveDisplayName(id2)).isEqualTo("john");

        UUID id3 = UUID.randomUUID();
        when(repo.findById(UserId.of(id3))).thenReturn(Optional.empty());
        assertThat(svc.resolveDisplayName(id3)).isEqualTo(id3.toString());
    }

    @Test
    void resolveDisplayNames_returns_map_in_input_order() {
        UserRepository repo = mock(UserRepository.class);
        UserDirectoryApplicationService svc = new UserDirectoryApplicationService(repo);
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        when(repo.findById(UserId.of(a))).thenReturn(Optional.empty());
        when(repo.findById(UserId.of(b))).thenReturn(Optional.empty());
        Map<UUID,String> map = svc.resolveDisplayNames(List.of(a, b));
        assertThat(map.keySet()).containsExactly(a, b);
    }
}

