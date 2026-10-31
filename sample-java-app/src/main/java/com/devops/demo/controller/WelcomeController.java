package com.devops.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class WelcomeController {

    private final Instant startTime = Instant.now();

    @GetMapping("/info")
    public Map<String, Object> getAppInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("application", "End-to-End DevOps Java Microservice");
        info.put("status", "UP");
        info.put("version", "1.0.0");
        info.put("pipeline", "GitHub -> Jenkins -> SonarQube -> Docker -> Kubernetes (AWS EC2)");
        info.put("timestamp", Instant.now().toString());
        info.put("uptimeSince", startTime.toString());

        try {
            info.put("hostname", InetAddress.getLocalHost().getHostName());
            info.put("hostAddress", InetAddress.getLocalHost().getHostAddress());
        } catch (UnknownHostException e) {
            info.put("hostname", "unknown-pod");
            info.put("hostAddress", "127.0.0.1");
        }

        info.put("environment", System.getenv().getOrDefault("APP_ENV", "production"));
        return info;
    }

    @GetMapping("/")
    public String welcome() {
        return "Welcome to End-to-End DevOps Pipeline Demo! Deployed via Jenkins CI/CD on Kubernetes Pod.";
    }
}
