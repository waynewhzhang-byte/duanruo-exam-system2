package com.duanruo.exam.domain.shared;

import java.util.Objects;

/**
 * 联系信息值对象
 */
public class ContactInfo {
    
    private final String phone;
    private final String email;
    
    public ContactInfo(String phone, String email) {
        this.phone = phone;
        this.email = email;
    }
    
    public static ContactInfo of(String phone, String email) {
        return new ContactInfo(phone, email);
    }
    
    public String getPhone() {
        return phone;
    }
    
    public String getEmail() {
        return email;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ContactInfo that = (ContactInfo) o;
        return Objects.equals(phone, that.phone) && Objects.equals(email, that.email);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(phone, email);
    }
    
    @Override
    public String toString() {
        return "ContactInfo{" +
                "phone='" + phone + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}
