package com.duanruo.exam.infrastructure.storage;

import com.duanruo.exam.infrastructure.config.MinioConfig;
import io.minio.*;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * MinIO文件存储服务实现
 */
@Service
public class MinioFileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(MinioFileStorageService.class);

    private final MinioClient minioClient;
    private final MinioConfig.MinioProperties minioProperties;
    private final Environment environment;

    public MinioFileStorageService(MinioClient minioClient, MinioConfig.MinioProperties minioProperties, Environment environment) {
        this.minioClient = minioClient;
        this.minioProperties = minioProperties;
        this.environment = environment;
        if (!isTestProfile()) {
            initializeBucket();
        } else {
            logger.info("Test profile active: skipping MinIO bucket initialization");
        }
    }

    private boolean isTestProfile() {
        return Arrays.asList(environment.getActiveProfiles()).contains("test");
    }

    /**
     * 初始化存储桶
     */
    private void initializeBucket() {
        try {
            String bucketName = minioProperties.getBucket();
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());
            
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                logger.info("Created MinIO bucket: {}", bucketName);
            } else {
                logger.info("MinIO bucket already exists: {}", bucketName);
            }
        } catch (Exception e) {
            logger.error("Failed to initialize MinIO bucket; continuing startup. File operations may fail until MinIO is available.", e);
        }
    }

    /**
     * 获取预签名上传URL
     */
    public String getPresignedUploadUrl(String objectName, String contentType) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(minioProperties.getBucket())
                            .object(objectName)
                            .expiry(minioProperties.getPresignExpires(), TimeUnit.SECONDS)
                            .build());
        } catch (Exception e) {
            logger.error("Failed to generate presigned upload URL for object: {}", objectName, e);
            throw new RuntimeException("Failed to generate presigned upload URL", e);
        }
    }

    /**
     * 获取预签名下载URL
     */
    public String getPresignedDownloadUrl(String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(minioProperties.getBucket())
                            .object(objectName)
                            .expiry(minioProperties.getPresignExpires(), TimeUnit.SECONDS)
                            .build());
        } catch (Exception e) {
            logger.error("Failed to generate presigned download URL for object: {}", objectName, e);
            throw new RuntimeException("Failed to generate presigned download URL", e);
        }
    }

    /**
     * 上传文件
     */
    public void uploadFile(String objectName, InputStream inputStream, String contentType, long size) {
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioProperties.getBucket())
                            .object(objectName)
                            .stream(inputStream, size, -1)
                            .contentType(contentType)
                            .build());
            logger.info("Successfully uploaded file: {}", objectName);
        } catch (Exception e) {
            logger.error("Failed to upload file: {}", objectName, e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    /**
     * 下载文件
     */
    public InputStream downloadFile(String objectName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(minioProperties.getBucket())
                            .object(objectName)
                            .build());
        } catch (Exception e) {
            logger.error("Failed to download file: {}", objectName, e);
            throw new RuntimeException("Failed to download file", e);
        }
    }

    /**
     * 读取文件头（用于Magic Number验证）
     */
    public byte[] readFileHeader(String objectName, int headerSize) {
        try (InputStream inputStream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(minioProperties.getBucket())
                        .object(objectName)
                        .build())) {

            byte[] header = new byte[headerSize];
            int bytesRead = inputStream.read(header);

            if (bytesRead < headerSize) {
                // 如果文件小于请求的头部大小，返回实际读取的字节
                byte[] actualHeader = new byte[bytesRead];
                System.arraycopy(header, 0, actualHeader, 0, bytesRead);
                return actualHeader;
            }

            return header;
        } catch (Exception e) {
            logger.error("Failed to read file header: {}", objectName, e);
            throw new RuntimeException("Failed to read file header", e);
        }
    }

    /**
     * 删除文件
     */
    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minioProperties.getBucket())
                            .object(objectName)
                            .build());
            logger.info("Successfully deleted file: {}", objectName);
        } catch (Exception e) {
            logger.error("Failed to delete file: {}", objectName, e);
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    /**
     * 检查文件是否存在
     */
    public boolean fileExists(String objectName) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(minioProperties.getBucket())
                            .object(objectName)
                            .build());
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 获取文件信息
     */
    public FileInfo getFileInfo(String objectName) {
        try {
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(minioProperties.getBucket())
                            .object(objectName)
                            .build());
            
            return new FileInfo(
                    objectName,
                    stat.size(),
                    stat.contentType(),
                    stat.lastModified(),
                    stat.etag()
            );
        } catch (Exception e) {
            logger.error("Failed to get file info: {}", objectName, e);
            throw new RuntimeException("Failed to get file info", e);
        }
    }

    /**
     * 文件信息类
     */
    public static class FileInfo {
        private final String objectName;
        private final long size;
        private final String contentType;
        private final java.time.ZonedDateTime lastModified;
        private final String etag;

        public FileInfo(String objectName, long size, String contentType, 
                       java.time.ZonedDateTime lastModified, String etag) {
            this.objectName = objectName;
            this.size = size;
            this.contentType = contentType;
            this.lastModified = lastModified;
            this.etag = etag;
        }

        // Getters
        public String getObjectName() { return objectName; }
        public long getSize() { return size; }
        public String getContentType() { return contentType; }
        public java.time.ZonedDateTime getLastModified() { return lastModified; }
        public String getEtag() { return etag; }
    }
}
