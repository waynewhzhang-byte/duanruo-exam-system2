package com.duanruo.exam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 考试报名系统主启动类
 */
@SpringBootApplication(scanBasePackages = "com.duanruo.exam")
@EntityScan("com.duanruo.exam.infrastructure.persistence.entity")
@EnableJpaRepositories({
        "com.duanruo.exam.infrastructure.persistence.repository",
        "com.duanruo.exam.infrastructure.persistence.jpa"
})
@EnableScheduling
@EnableTransactionManagement
public class ExamRegistrationApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExamRegistrationApplication.class, args);
    }
}
