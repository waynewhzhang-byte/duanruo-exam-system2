package com.duanruo.exam.domain.payment;

import com.duanruo.exam.domain.shared.ValueObject;

import java.util.Objects;
import java.util.UUID;

/**
 * 支付订单ID值对象
 */
public class PaymentOrderId implements ValueObject {
    private final UUID value;

    private PaymentOrderId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("PaymentOrderId不能为空");
        }
        this.value = value;
    }

    public static PaymentOrderId of(UUID value) {
        return new PaymentOrderId(value);
    }

    public static PaymentOrderId generate() {
        return new PaymentOrderId(UUID.randomUUID());
    }

    public UUID getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PaymentOrderId that = (PaymentOrderId) o;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return value.toString();
    }
}

