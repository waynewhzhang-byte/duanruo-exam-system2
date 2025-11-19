package com.duanruo.exam.adapter.rest.dto;

import jakarta.validation.constraints.NotBlank;

public class PaymentQueryRequest {
    @NotBlank
    private String outTradeNo;

    public String getOutTradeNo() { 
        return outTradeNo; 
    }
    
    public void setOutTradeNo(String outTradeNo) { 
        this.outTradeNo = outTradeNo; 
    }
}

