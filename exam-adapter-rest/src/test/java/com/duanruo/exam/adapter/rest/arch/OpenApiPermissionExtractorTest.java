package com.duanruo.exam.adapter.rest.arch;

import com.duanruo.exam.adapter.rest.config.OpenApiPermissionCustomizer;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class OpenApiPermissionExtractorTest {

    @Test
    void extract_single_hasAuthority() {
        List<String> r = OpenApiPermissionCustomizer.extractPermissions("@PreAuthorize(\"hasAuthority('EXAM_CREATE')\")");
        assertTrue(r.contains("EXAM_CREATE"));
    }

    @Test
    void extract_hasAnyAuthority_multiple() {
        List<String> r = OpenApiPermissionCustomizer.extractPermissions("hasAnyAuthority('A','B','C') or hasAuthority('D')");
        var expected = new java.util.HashSet<>(List.of("A","B","C","D"));
        var actual = new java.util.HashSet<>(r);
        assertEquals(expected, actual);
    }
}

