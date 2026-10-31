package com.devops.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "HEALTHY");
        status.put("message", "Service is up and responding to traffic");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, String>> readinessCheck() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "READY");
        status.put("message", "Application ready to receive traffic from Kubernetes Service");
        return ResponseEntity.ok(status);
    }
}
