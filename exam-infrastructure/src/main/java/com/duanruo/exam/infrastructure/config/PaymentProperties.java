package com.duanruo.exam.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "payment")
public class PaymentProperties {
  private String currency = "CNY";
  private boolean stubOnly = true;
  private Alipay alipay = new Alipay();
  private Wechat wechat = new Wechat();

  /**
   * 支付宝配置
   */
  public static class Alipay {
    private boolean enabled = false;
    private String appId;
    private String privateKey;
    private String publicKey;
    private String gatewayUrl = "https://openapi.alipay.com/gateway.do";
    private String notifyUrl;
    private String returnUrl;
    private String signType = "RSA2";
    private String charset = "UTF-8";
    private String format = "json";

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }
    public String getPrivateKey() { return privateKey; }
    public void setPrivateKey(String privateKey) { this.privateKey = privateKey; }
    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
    public String getGatewayUrl() { return gatewayUrl; }
    public void setGatewayUrl(String gatewayUrl) { this.gatewayUrl = gatewayUrl; }
    public String getNotifyUrl() { return notifyUrl; }
    public void setNotifyUrl(String notifyUrl) { this.notifyUrl = notifyUrl; }
    public String getReturnUrl() { return returnUrl; }
    public void setReturnUrl(String returnUrl) { this.returnUrl = returnUrl; }
    public String getSignType() { return signType; }
    public void setSignType(String signType) { this.signType = signType; }
    public String getCharset() { return charset; }
    public void setCharset(String charset) { this.charset = charset; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
  }

  /**
   * 微信支付配置
   */
  public static class Wechat {
    private boolean enabled = false;
    private String appId;
    private String mchId;
    private String apiKey;
    private String apiV3Key;
    private String certPath;
    private String notifyUrl;
    private String serialNo;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getAppId() { return appId; }
    public void setAppId(String appId) { this.appId = appId; }
    public String getMchId() { return mchId; }
    public void setMchId(String mchId) { this.mchId = mchId; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getApiV3Key() { return apiV3Key; }
    public void setApiV3Key(String apiV3Key) { this.apiV3Key = apiV3Key; }
    public String getCertPath() { return certPath; }
    public void setCertPath(String certPath) { this.certPath = certPath; }
    public String getNotifyUrl() { return notifyUrl; }
    public void setNotifyUrl(String notifyUrl) { this.notifyUrl = notifyUrl; }
    public String getSerialNo() { return serialNo; }
    public void setSerialNo(String serialNo) { this.serialNo = serialNo; }
  }

  public String getCurrency() { return currency; }
  public void setCurrency(String currency) { this.currency = currency; }
  public boolean isStubOnly() { return stubOnly; }
  public void setStubOnly(boolean stubOnly) { this.stubOnly = stubOnly; }
  public Alipay getAlipay() { return alipay; }
  public void setAlipay(Alipay alipay) { this.alipay = alipay; }
  public Wechat getWechat() { return wechat; }
  public void setWechat(Wechat wechat) { this.wechat = wechat; }
}

