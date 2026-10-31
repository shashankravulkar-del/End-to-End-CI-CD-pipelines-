package com.devops.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DevOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(DevOpsApplication.class, args);
        System.out.println(">>> DevOps Java Web App started successfully on port 8080! <<<");
    }
}
