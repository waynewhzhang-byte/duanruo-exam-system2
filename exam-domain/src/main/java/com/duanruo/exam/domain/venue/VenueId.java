package com.duanruo.exam.domain.venue;

import java.util.Objects;
import java.util.UUID;

/**
 * 值对象：考场ID
 */
public final class VenueId {
    private final UUID value;

    private VenueId(UUID value) { this.value = value; }

    public static VenueId of(UUID value) {
        if (value == null) throw new IllegalArgumentException("venueId cannot be null");
        return new VenueId(value);
    }

    public static VenueId newId() { return new VenueId(UUID.randomUUID()); }

    public UUID getValue() { return value; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VenueId venueId = (VenueId) o;
        return Objects.equals(value, venueId.value);
    }

    @Override public int hashCode() { return Objects.hash(value); }

    @Override public String toString() { return value.toString(); }
}

